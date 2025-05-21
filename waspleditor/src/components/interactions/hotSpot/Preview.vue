<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Konva from 'konva';
import Quill from 'quill';
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore'; // Assuming this is the dev store for data

// --- DOM References ---
const canvasRef = ref(null); // Reference for the Konva container div
const quillEditor = ref(null); // Reference for the Quill editor div
const emoticonSourceRef = ref(null); // Reference for the emoticon source div

// --- Konva Instances (not reactive, initialized in onMounted/drawCanvas) ---
let stage = null;
let bgLayer = null;
let zoneLayer = null;
let targetLayer = null; // Layer for dropped/placed stickers
let removeLayer = null; // New layer for the remove zone
let backgroundKonvaImage = null; // To store the Konva Image node for the background
let removeZoneGroup = null; // Reference to the remove zone Konva group

// --- Quill Instance ---
let quillInstance = null;


// --- State Variables ---
const store = useTestStore(); // This is likely the dev store; will be replaced by props in test runner
const selectedElement = computed(() => store.selectedElement); // From dev store
const elementLabel = computed(() => store.selectedElementLabel); // From dev store

const quillEditorReady = ref(false); // State related to Quill init (not strictly needed in readOnly)
const isQuillEmpty = ref(true); // State related to Quill content (not strictly needed in readOnly)

const showHint = ref(false); // Hint state
const showReport = ref(false); // Report state
const displayHintButton = computed(() => !!selectedElement.value?.tip); // Show hint button if tip exists

// --- Core State for Placed Stickers (Data Array) ---
// This array will store DATA about the stickers, NOT Konva nodes
const placedStickersData = ref([]); // Renamed for clarity
const interactionCount = ref(0); // Count of drops (interactions)

// Scores - These are computed *directly* from placedStickersData (for preview display)
// In test runner, final report scores are calculated at submission time from final data
const countInside = computed(() => placedStickersData.value.filter(sticker => sticker.isInsideAnyZone).length);
const countOutside = computed(() => placedStickersData.value.filter(sticker => !sticker.isInsideAnyZone).length);

// Report data derived from placedStickersData after submission
const submittedReport = ref([]); // Array to store results after submission
const selectedZonePoints = computed(() => {
  return submittedReport.value.reduce((sum, item) => {
    if (item.isCorrect) {
      return sum + (item.zone?.score || 0);
    }
    return sum;
  }, 0);
});
const penalties = computed(() => {
  // console.log( selectedElement.value?.el_Penalties) // Debug log
  const outOfZoneCount = submittedReport.value.filter(item => !item.zone).length;
  // Assuming penalties is a property on the element itself
  // Use el_Penalties consistently (typo el_data?.penalties corrected)
  const penaltyValue = selectedElement.value?.el_Penalties ?? 0;
  return outOfZoneCount * penaltyValue;
});
const maxScore = computed(() => {
  const zones = selectedElement.value?.el_Data || [];
  // Max score is the sum of scores of all zones, assuming each zone can contribute its score
  return zones.reduce((sum, zone) => sum + (zone.score ?? 0), 0);
});
const reportDetails = computed(() => {
  return submittedReport.value.map((item, idx) => {
    if (!item.zone) return `${idx + 1}. ❌ "${item.emoji}" hors zone`;
    if (!item.isCorrect) return `${idx + 1}. ❌ "${item.emoji}" dans "${item.zone.name}" (attendu: "${item.zone.sticker}")`; // Added quotes around sticker
    return `${idx + 1}. ✅ "${item.emoji}" dans "${item.zone.name}"`;
  });
});

// --- Computed property for unique stickers from zones (for the source panel) ---
const uniqueStickers = computed(() => {
  const zones = selectedElement.value?.el_Data || [];
  // Extract 'sticker' property, filter out null/undefined, get unique values
  const stickers = [...new Set(zones.map(zone => zone.sticker).filter(Boolean))];
  // console.log("[Computed] Unique Stickers:", stickers); // Debug log
  return stickers;
});


// --- Lifecycle Hooks ---

onMounted(() => {
  console.log("Component mounted");
  initializeQuill();

  // Wait for next tick to ensure DOM elements have rendered
  nextTick(() => {
    drawCanvas(); // Draws canvas, sets up layers, loads image, draws zones/stickers, adds remove zone
    attachDelegatedHtmlDragstartListener(); // Attach HTML drag/drop listeners
    // ResizeObserver is NOT used anymore for this layout/scaling approach
  });
});

onUnmounted(() => {
  console.log("Component unmounting, cleaning up...");

  // No ResizeObserver to disconnect in this version

  // Destroy Konva stage
  if (stage) {
    stage.destroy(); // Destroy Konva stage and all its contents
    stage = null;
    bgLayer = null;
    zoneLayer = null;
    targetLayer = null;
    removeLayer = null; // Nullify remove layer
    backgroundKonvaImage = null;
    removeZoneGroup = null; // Nullify remove zone group
    console.log("Konva stage destroyed");
  }

  // Clean up Quill instance
  if (quillInstance) {
    quillInstance = null;
    console.log("Quill instance nulled");
  }

  // HTML event listeners added with addEventListener need manual cleanup
  if (emoticonSourceRef.value) {
    emoticonSourceRef.value.removeEventListener('dragstart', handleHtmlDragStart);
  }
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('dragover', handleCanvasDragOver);
    canvasRef.value.removeEventListener('drop', handleCanvasDrop);
  }
});


// --- Watchers ---

// Watch RichText for updates (in dev mode)
watch(() => selectedElement.value?.el_RichText, (newValue) => {
  if (quillInstance) {
    if ((newValue || '') !== (quillInstance.root.innerHTML || '')) {
      quillInstance.root.innerHTML = newValue || '';
    }
  }
});

// Redraw canvas and reset state if element data (zones, background) changes (in dev mode)
watch(() => [selectedElement.value?.el_Data, selectedElement.value?.el_Background], () => {
  if (selectedElement.value && canvasRef.value) {
    console.log("selectedElement el_Data or el_Background changed, redrawing canvas and resetting state.");
    // Destroy the old stage and all its nodes
    if (stage) {
      stage.destroy();
      stage = null;
    }
    // Reset state related to placed items (clears placedStickersData)
    // Passing false prevents implicit Konva redraw via resetSelections, we'll do it after drawCanvas
    resetSelections(false);

    // Now draw the new canvas, which will be populated from the (now empty) data
    nextTick(() => { // Wait for next tick to ensure container dimensions are updated
      drawCanvas(); // Creates new stage, layers, loads image, draws zones/stickers, adds remove zone
      // Re-attach event listeners as the container might be recreated
      attachDelegatedHtmlDragstartListener();
    });
  }
}, { deep: true });


// --- Quill Functions ---
function initializeQuill() {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, { theme: 'snow', readOnly: true, modules: { toolbar: false } });
    quillInstance.root.innerHTML = selectedElement.value?.el_RichText || '';
    isQuillEmpty.value = quillInstance.getText().trim() === '';
    quillEditorReady.value = true;
  }
}
// function adjustQuillHeight() { /* Not needed for readOnly mode usually */ } // Removed


// --- Konva Canvas Drawing Functions ---
function drawCanvas() {
  if (!canvasRef.value) {
    console.error("Canvas container not available!");
    return;
  }

  // Use the INTENDED stage size from element data for Konva's internal coordinates
  const intrinsicStageWidth = selectedElement.value?.el_CanvasSize?.width || 700;
  const intrinsicStageHeight = selectedElement.value?.el_CanvasSize?.height || 500;

  // Create Konva Stage with the INTENDED dimensions
  stage = new Konva.Stage({
    container: canvasRef.value,
    width: intrinsicStageWidth, // Set Konva stage size to intended size
    height: intrinsicStageHeight, // Set Konva stage size to intended size
    // listening: !localReadonly.value, // Add this in test runner version
  });
  console.log(`Konva Stage created with intrinsic size: ${stage.width()}x${stage.height()}`);


  // Create Layers
  bgLayer = new Konva.Layer({ name: 'bgLayer' });
  zoneLayer = new Konva.Layer({ name: 'zoneLayer' });
  targetLayer = new Konva.Layer({ name: 'targetLayer' }); // Layer for dropped stickers
  removeLayer = new Konva.Layer({ name: 'removeLayer' }); // New layer for remove zone

  stage.add(bgLayer);
  stage.add(zoneLayer);
  stage.add(removeLayer); // Add remove layer below target layer so stickers are above it
  stage.add(targetLayer);


  // Load and draw Background Image
  const imageObj = new window.Image();
  imageObj.onload = () => {
    stage.width(imageObj.width);
    stage.height(imageObj.height);

    backgroundKonvaImage = new Konva.Image({
      image: imageObj,
      width: imageObj.width,
      height: imageObj.height,
      listening: false,
    });
    bgLayer.add(backgroundKonvaImage);
    bgLayer.draw();
    console.log("Background image loaded and drawn.");

    // Draw zones and stickers *after* background is loaded and drawn and sized
    drawZones(zoneLayer, selectedElement.value?.el_Data || []);
    addRemoveZone(removeLayer, intrinsicStageWidth, intrinsicStageHeight); // Add remove zone
    redrawPlacedStickers(); // Draw existing stickers from data
  };

  const VITE_FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;
  const rawSrc = selectedElement.value?.el_Background || '/images/europe.png';
  // Determine if the source is an absolute URL, starts with /, or relative
  const isAbsolute = /^https?:\/\//i.test(rawSrc);
  const isRooted = rawSrc.startsWith('/');

  // Fonction utilitaire pour assembler les URLs
  function joinUrl(base, path) {
    if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
    if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
    return base + path;
  }

imageObj.src = isAbsolute
  ? rawSrc
  : (isRooted
      ? rawSrc // <--- c'est le plus important !
      : rawSrc);

  console.log('[drawCanvas] image source:', imageObj.src);

  // Handle potential error loading image (optional)
  imageObj.onerror = (err) => {
    console.error("Error loading background image:", imageObj.src, err);
    // Still draw layers even if image failed
    bgLayer.draw(); // Draw an empty background layer or placeholder
    drawZones(zoneLayer, selectedElement.value?.el_Data || []);
    addRemoveZone(removeLayer, intrinsicStageWidth, intrinsicStageHeight); // Add remove zone
    redrawPlacedStickers();
  };

  // Draw layers immediately. They will be empty initially if image is async.
  bgLayer.draw();
  zoneLayer.draw();
  removeLayer.draw(); // Draw the new layer
  targetLayer.draw();
}


// Function to add the remove zone (trash can) to a layer
// Function to add the remove zone (trash can) to a layer
function addRemoveZone(layer, stageWidth, stageHeight) {
  if (!layer) return;

  const zoneSize = 60; // Size of the interactive zone (rectangle)
  const padding = 15; // Padding from edge
  const iconSize = 40; // Font size for emoji

  // Position the zone in the bottom right corner
  const zoneX = stageWidth - zoneSize - padding;
  const zoneY = stageHeight - zoneSize - padding;

  // Create a group to hold the rectangle and the icon
  removeZoneGroup = new Konva.Group({
    x: zoneX,
    y: zoneY,
    width: zoneSize,
    height: zoneSize,
    name: 'removeZone', // Identify this group
    listening: true, // Important: make the group listen for events (to detect drops)
  });

  // Add a visual rectangle for the background/hit area
  const zoneRect = new Konva.Rect({
    x: 0, // Position relative to the group's origin
    y: 0, // Position relative to the group's origin
    width: zoneSize,
    height: zoneSize,
    fill: 'rgba(255, 0, 0, 0.3)', // Semi-transparent red
    stroke: 'red',
    strokeWidth: 2,
    cornerRadius: 5,
  });

  // Add the trash can icon
  const trashIcon = new Konva.Text({
    text: '🗑️', // Trash can emoji
    // **AJUSTEMENT ICI : Décalage par rapport au centre géométrique (zoneSize / 2)**
    // Le centre géométrique de la zone de 60x60 est (30, 30) par rapport à l'origine du groupe (0,0).
    // L'offset de l'icône est (20, 20) pour une font de 40.
    // On positionne l'icône à (30, 30) pour aligner son centre (visé par offsetX/Y) avec le centre de la zone.
    // Si l'icône semble trop haute, augmentez y. Si elle semble trop à gauche, augmentez x.
    // Commençons par un léger décalage vers le bas et la droite, par exemple +2 pixels.
    x: (zoneSize / 2) - 7, // 30 + 2 = 32 par rapport au groupe (0,0)
    y: zoneSize / 2 + 2, // 30 + 2 = 32 par rapport au groupe (0,0)
    fontSize: iconSize, // 40
    fill: 'white',
    // align: 'center', // Pas strictement nécessaire pour un seul nœud texte
    // verticalAlign: 'middle', // Pas strictement nécessaire pour un seul nœud texte
    listening: false, // L'icône elle-même n'a pas besoin d'écouter
    // Offset pour que les coordonnées x,y correspondent au CENTRE du nœud texte
    offsetX: iconSize / 2, // 20
    offsetY: iconSize / 2, // 20
  });

  removeZoneGroup.add(zoneRect);
  removeZoneGroup.add(trashIcon);

  layer.add(removeZoneGroup);
  layer.draw();
  console.log("Remove zone added.");

  // Add hover effect (optional)
  // In the preview, we assume interactive mode. In Test Runner, check localReadonly.
  removeZoneGroup.on('mouseover', function () {
    if (stage && stage.container()) stage.container().style.cursor = 'copy'; // Indicate drop target
    zoneRect.fill('rgba(255, 0, 0, 0.6)'); // Darker red on hover
    layer.draw();
  });
  removeZoneGroup.on('mouseout', function () {
    if (stage && stage.container()) stage.container().style.cursor = 'default';
    zoneRect.fill('rgba(255, 0, 0, 0.3)'); // Revert fill
    layer.draw();
  });
}


// drawZones function - Ensure strokeWidth is set when revealing
function drawZones(layer, zones) {
  if (!layer || !stage) return;
  layer.destroyChildren(); // Clear previous zones

  zones.forEach(zone => {
    let shape;
    // Base style for Konva shape - zones are initially invisible
    const style = {
      id: zone.id,
      name: zone.name || 'zone', // Name for identification
      sticker: zone.sticker, // Expected sticker for this zone
      score: zone.score ?? 0, // Score for this zone
      opacity: 0, // Zones are invisible by default
      fill: 'green', // Default fill (invisible)
      stroke: 'blue', // Default stroke color (invisible initially)
      strokeWidth: 0, // Default stroke width (invisible initially)
      listening: false, // Zones do not listen for events in this interaction model
    };

    if (zone.type === 'rect') {
      // Use original zone data coordinates/size
      shape = new Konva.Rect({ ...style, ...zone });
    } else if (zone.type === 'circle') {
      // Use original zone data coordinates/radius
      shape = new Konva.Circle({ ...style, ...zone });
    } else if (zone.type === 'freeform' && Array.isArray(zone.points)) {
      // Use original points
      shape = new Konva.Line({
        ...style,
        points: zone.points,
        closed: true,
      });
    } else {
      console.warn("Unsupported zone type:", zone.type, zone);
      return; // Skip this zone
    }
    layer.add(shape);
  });
  layer.draw();
}


// Helper to redraw stickers from the placedStickersData array
function redrawPlacedStickers() {
  if (!targetLayer || !stage) return;

  targetLayer.destroyChildren(); // Remove existing sticker shapes from the layer

  // Iterate over the DATA array (placedStickersData.value)
  placedStickersData.value.forEach(stickerData => {
    // Create a *new* Konva Text node instance for each item in the data array
    const stickerNode = new Konva.Text({
      text: stickerData.emoji,
      x: stickerData.x, // Using stored data coordinates (top-left of text)
      y: stickerData.y, // Using stored data coordinates (top-left of text)
      fontSize: 40, // Using a consistent size for emojis
      draggable: true, // Stickers are always draggable in Preview mode
      offsetX: 20, // Use consistent offsets for center calculation (half of approx size)
      offsetY: 20, // Use consistent offsets for center calculation (half of approx size)
      id: `sticker-${stickerData.id}`, // Use a unique ID based on data ID
      name: 'placedSticker', // Identifier name for Konva nodes (used by stage.find)
    });

    // Store a reference back to the data object ON THE KONVA NODE
    stickerNode.stickerData = stickerData; // Link Konva node back to its data object

    // Add the *new* Konva node to the target layer
    targetLayer.add(stickerNode);

    // Attach the dragend listener to this *new* Konva node
    stickerNode.on('dragend', handleStickerDragEnd);
  });

  targetLayer.draw(); // Redraw the layer to show the newly created nodes
  console.log(`[HotSpot] Redrew ${placedStickersData.value.length} stickers.`);
}


// --- HTML Drag and Drop Handlers (Source Column to Canvas) ---
// These listeners are attached to the HTML container elements, not Konva stage.
// No readOnly checks needed here in the Preview version.
function attachDelegatedHtmlDragstartListener() {
  if (!emoticonSourceRef.value || !canvasRef.value) {
    console.warn("Cannot attach drag/drop listeners: refs not available.");
    return;
  }
  // Remove previous listeners to prevent duplicates on redraw
  emoticonSourceRef.value.removeEventListener('dragstart', handleHtmlDragStart);
  canvasRef.value.removeEventListener('dragover', handleCanvasDragOver);
  canvasRef.value.removeEventListener('drop', handleCanvasDrop);

  emoticonSourceRef.value.addEventListener('dragstart', handleHtmlDragStart);
  canvasRef.value.addEventListener('dragover', handleCanvasDragOver);
  canvasRef.value.addEventListener('drop', handleCanvasDrop);
  console.log("HTML Drag/Drop listeners attached.");
}

function handleHtmlDragStart(e) {
  if (e.target && e.target.classList.contains('draggable-emoticon')) {
    e.dataTransfer.setData('text/emoticon', e.target.textContent);
    e.dataTransfer.effectAllowed = 'copy';
    console.log('HTML Drag start (delegated):', e.target.textContent);
  } else {
    e.preventDefault();
  }
}

function handleCanvasDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

function handleCanvasDrop(e) {
  e.preventDefault();

  const emoticonText = e.dataTransfer.getData('text/emoticon');
  if (!emoticonText || !stage || !targetLayer || !zoneLayer || !canvasRef.value) {
    console.warn("Drop ignored: missing data or Konva not ready.");
    return;
  }

  interactionCount.value += 1; // Count each drop as an interaction

  // Get the drop position relative to the STAGE (using event coordinates and canvas container offset)
  // IMPORTANT: Convert HTML coordinates to Konva stage coordinates
  const containerRect = canvasRef.value.getBoundingClientRect();
  // Calculate position relative to the *scaled* Konva canvas visual area
  const htmlX = e.clientX - containerRect.left;
  const htmlY = e.clientY - containerRect.top;

  // Get the actual HTML canvas element rendered by Konva (safer than stage.getCanvas)
  const canvasElement = canvasRef.value.querySelector('canvas');
  if (!canvasElement) {
    console.error("Cannot find Konva canvas element inside container for drop.");
    return;
  }

  const actualWidth = canvasElement.offsetWidth;
  const actualHeight = canvasElement.offsetHeight;
  const intrinsicWidth = stage.width();
  const intrinsicHeight = stage.height();

  // Calculate scaling factor
  const scaleX = intrinsicWidth / actualWidth;
  const scaleY = intrinsicHeight / actualHeight;

  // Convert HTML coordinates to intrinsic Stage coordinates
  const stageX = htmlX * scaleX;
  const stageY = htmlY * scaleY;

  // console.log(`HTML Drop: "${emoticonText}" at (${htmlX}, ${htmlY}). Converted Stage pos: (${stageX}, ${stageY})`); // Debug log


  // --- Create the DATA object for the new sticker ---
  // Store position relative to the STAGE's intrinsic coordinates
  const newStickerData = {
    id: Date.now(), // Simple unique ID based on timestamp
    emoji: emoticonText,
    x: stageX, // Store top-left position in stage coordinates
    y: stageY, // Store top-left position in stage coordinates
    // isInsideAnyZone state will be determined later if needed,
    // but for the report, we check zone at submission time.
    // We can add it here too for live counts if required, but report is key.
    isInsideAnyZone: false, // Placeholder, updated below if needed for live counts
  };

  // --- Create the NEW Konva Text node for this data ---
  // This node is created to immediately visualize it and determine its center for initial zone check
  const stickerNode = new Konva.Text({
    text: newStickerData.emoji,
    x: newStickerData.x, // Use data coordinates (stage coords)
    y: newStickerData.y, // Use data coordinates (stage coords)
    fontSize: 40, // Must match size used for offset calculation
    draggable: true, // Stickers are draggable in Preview
    offsetX: 20, // Use consistent offsets for center calculation (half of approx size)
    offsetY: 20, // Use consistent offsets for center calculation (half of approx size)
    id: `sticker-${newStickerData.id}`, // Use data ID for Konva ID
    name: 'placedSticker', // Identifier name
  });

  // Store a reference back to the data object on the Konva node
  stickerNode.stickerData = newStickerData; // Link Konva node back to its data

  // --- Determine initial state and update data (for live counts) ---
  // Check if its CENTER is initially inside any zone (using calculated stageX/stageY and offsets)
  const initialStickerCenterX = stageX + stickerNode.offsetX();
  const initialStickerCenterY = stageY + stickerNode.offsetY();
  const droppedInZone = findZoneContainingPoint({
    x: initialStickerCenterX,
    y: initialStickerCenterY
  });

  // Update the state in the DATA object for live counts
  newStickerData.isInsideAnyZone = !!droppedInZone;

  // Add the DATA object to our reactive array
  placedStickersData.value.push(newStickerData);
  console.log(`Added sticker "${emoticonText}" to data. Total: ${placedStickersData.value.length}`);


  // Add the NEW Konva node to the target layer
  targetLayer.add(stickerNode);

  // --- Add dragend listener for subsequent drags *on the canvas* ---
  stickerNode.on('dragend', handleStickerDragEnd);


  // Redraw the layer to show the new sticker node
  targetLayer.draw();

  // Counts update automatically because they are computed properties based on placedStickersData.value
}


// --- Konva Sticker Drag Handler (Dragging *on* the canvas) ---
// --- Konva Sticker Drag Handler (Dragging *on* the canvas) ---
// --- Konva Sticker Drag Handler (Dragging *on* the canvas) ---


function handleStickerDragEnd(e) {
  console.log("handleStickerDragEnd started.");
  const stickerNode = e.target; // The Konva node that was dragged
  const stickerData = stickerNode.stickerData;
  if (!stickerData) {
    console.error("Could not find sticker data for dragged node!", stickerNode.id());
    targetLayer.draw();
    return;
  }
  console.log(`Dragged sticker "${stickerData.emoji}" (ID: ${stickerData.id}) dragend.`);
  console.log('Final sticker node position:', stickerNode.position());

  // Get the pointer position at the moment the drag ended
  const pointerPos = stage.getPointerPosition();

  if (!pointerPos) {
    console.warn("Could not get pointer position at dragend. Cannot check remove zone.");
    // Proceed with normal position update based on node's final pos
    stickerData.x = stickerNode.x();
    stickerData.y = stickerNode.y();
    const droppedInZone = findZoneContainingPoint({
      x: stickerNode.x() + stickerNode.offsetX(),
      y: stickerNode.y() + stickerNode.offsetY()
    });
    stickerData.isInsideAnyZone = !!droppedInZone;
    console.log(`Sticker "${stickerData.emoji}" position updated based on node pos (${stickerData.x.toFixed(2)}, ${stickerData.y.toFixed(2)}). Pointer pos not found, skipping remove check.`);
    return; // Exit handler
  }
  console.log(`Pointer position at dragend: (${pointerPos.x.toFixed(2)}, ${pointerPos.y.toFixed(2)})`);


  // --- Find the remove zone Konva group and check if pointer is inside ---
  const removeZoneGroup = removeLayer.findOne('.removeZone');

  let isPointerOverRemoveZone = false;
  if (!removeZoneGroup) {
    console.error("Remove zone group not found on removeLayer!");
  } else {
    const removeZonePos = removeZoneGroup.position();
    const removeZoneSize = { width: removeZoneGroup.width(), height: removeZoneGroup.height() }; // Use the group's actual size
    const pointerX = pointerPos.x;
    const pointerY = pointerPos.y;

    isPointerOverRemoveZone =
      pointerX >= removeZonePos.x &&
      pointerX <= removeZonePos.x + removeZoneSize.width &&
      pointerY >= removeZonePos.y &&
      pointerY <= removeZonePos.y + removeZoneSize.height;

    console.log(`Remove Zone Group Position: (${removeZonePos.x.toFixed(2)}, ${removeZonePos.y.toFixed(2)}), Size: ${removeZoneSize.width}x${removeZoneSize.height}`);
    console.log('Is pointer over remove zone?', isPointerOverRemoveZone);
  }


  if (isPointerOverRemoveZone) {
    console.log(`Pointer is over remove zone. Initiating removal for sticker "${stickerData.emoji}"...`);

    // --- REMOVAL LOGIC ---

    // 1. Remove the sticker data from the reactive array *first*.
    const initialStickerCount = placedStickersData.value.length;
    placedStickersData.value = placedStickersData.value.filter(item => item.id !== stickerData.id);
    console.log(`Removed data for "${stickerData.emoji}" (ID: ${stickerData.id}). Initial count: ${initialStickerCount}, Final count: ${placedStickersData.value.length}`);

    if (placedStickersData.value.length === initialStickerCount) {
      console.warn("Data removal potentially failed: Sticker ID not found in placedStickersData array.");
    }

    // 2. Animate the removal of the Konva node
    if (stickerNode && stickerNode.getParent() === targetLayer) {
      stickerNode.to({
        opacity: 0, // Fade out
        scaleX: 0.1, // Shrink
        scaleY: 0.1,
        duration: 0.3, // Animation duration in seconds
        onFinish: () => {
          console.log('Animation finished. Destroying Konva node...');
          // 3. Destroy the Konva node from the layer after animation
          if (stickerNode && stickerNode.getParent() === targetLayer) {
            stickerNode.destroy();
            // No need to targetLayer.draw() here, Konva handles it after destroy
            console.log(`Konva node for "${stickerData.emoji}" destroyed.`);
          } else {
            console.warn("Konva node already removed or parent changed before animation finished.");
          }
        },
      });
    } else {
      console.warn("Sticker Konva node already removed or parent changed before attempting animation.");
      // If node is already gone, just ensure the layer is drawn if necessary
      targetLayer?.draw();
    }


  } else {
    // --- Sticker was NOT dropped on the remove zone ---
    console.log('Pointer is NOT over remove zone. Updating position and zone.');

    // Update the position in the DATA object with the Konva node's final position
    stickerData.x = stickerNode.x();
    stickerData.y = stickerNode.y();
    console.log(`Sticker "${stickerData.emoji}" data position updated to (${stickerData.x.toFixed(2)}, ${stickerData.y.toFixed(2)}).`);

    // Find the zone the sticker's center was dropped into (for live counts in Preview)
    // Use sticker's center *after* the drag
    const stickerCenterX = stickerNode.x() + stickerNode.offsetX();
    const stickerCenterY = stickerNode.y() + stickerNode.offsetY();
    const droppedInZone = findZoneContainingPoint({
      x: stickerCenterX,
      y: stickerCenterY
    });

    const currentlyInsideAnyZone = !!droppedInZone;
    const previouslyInsideAnyZone = stickerData.isInsideAnyZone;

    // Check if the zone state has changed (for live counts display in Preview)
    if (currentlyInsideAnyZone !== previouslyInsideAnyZone) {
      // Update the state in the DATA object
      stickerData.isInsideAnyZone = currentlyInsideAnyZone;
      // Counts update automatically
      console.log(`Sticker "${stickerData.emoji}" moved ${currentlyInsideAnyZone ? 'INSIDE' : 'OUTSIDE'} any zone.`);
    }
    // If state hasn't changed, counts remain the same
  }
  console.log("handleStickerDragEnd finished.");
}

// Helper to check if we are in the test runner read-only mode (simplified for Preview)
// In the actual test runner, this would check `localReadonly.value`
function isTestRunnerReadonly() {
  // In Preview mode, drag/drop/remove are generally enabled.
  // We can simulate a 'readonly' state for testing the remove zone behavior
  // by checking if stage.listening is false if we added that in drawCanvas,
  // but for pure Preview, assume interactions are allowed.
  return false; // Always false in this Preview context
}


// --- Zone and Point Checking Functions ---
// These functions operate on STAGE coordinates.
function isPointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 6 || polygon.length % 2 !== 0) {
    console.warn("Invalid polygon data for check:", polygon);
    return false;
  }
  let inside = false;
  // Use a small epsilon to handle floating point inaccuracies near boundaries
  const epsilon = 1e-9;
  for (let i = 0, j = polygon.length - 2; i < polygon.length; i += 2) {
    const xi = polygon[i], yi = polygon[i + 1];
    const xj = polygon[j], yj = polygon[j + 1];

    // Check if point is collinear with segment (optional)
    // if (Math.abs((yj - yi) * (point.x - xi) - (xj - xi) * (point.y - yi)) < epsilon) {
    //     if (Math.min(xi, xj) - epsilon <= point.x && point.x <= Math.max(xi, xj) + epsilon &&
    //         Math.min(yi, yj) - epsilon <= point.y && point.y <= Math.max(yi, yj) + epsilon) {
    //         return true;
    //     }
    // }

    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi + epsilon) + xi); // Add epsilon

    if (intersect) inside = !inside;
    j = i;
  }
  return inside;
}
function findZoneContainingPoint(pos) {
  const zones = selectedElement.value?.el_Data || [];
  // Iterate through zones to find the first one containing the point
  for (const zone of zones) {
    if (zone.type === 'rect') {
      // Check if point is inside the rect bounds
      if (pos.x >= zone.x && pos.x <= zone.x + zone.width && pos.y >= zone.y && pos.y <= zone.y + zone.height) {
        return zone; // Return the zone object from el_Data
      }
    } else if (zone.type === 'circle') {
      // Check if point is within the circle radius from its center
      const dx = pos.x - zone.x;
      const dy = pos.y - zone.y;
      if (Math.hypot(dx, dy) <= zone.radius) { // Use Math.hypot
        return zone; // Return the zone object from el_Data
      }
    } else if (zone.type === 'freeform' && Array.isArray(zone.points)) {
      // Check if the point is inside the polygon defined by zone.points
      if (isPointInPolygon(pos, zone.points)) {
        return zone; // Return the zone object from el_Data
      }
    }
  }
  return null; // No zone found containing the point
}


// --- Action Buttons ---

// resetSelections clears the data and redraws the canvas (which will be empty)
function resetSelections(shouldRedrawKonva = true) {
  console.log("Resetting selections...");

  // Clear the DATA array
  placedStickersData.value = [];

  // Other state variables
  interactionCount.value = 0;
  submittedReport.value = []; // Clear report data

  // Hide report and hint
  showReport.value = false;
  showHint.value = false;

  // Counts update automatically because they are computed properties based on placedStickersData.value

  // Redraw the canvas to reflect the empty placedStickersData array
  if (stage && targetLayer) { // Only need to clear target layer for stickers
    targetLayer.destroyChildren();
    targetLayer.draw();
    console.log("Cleared Konva target layer.");
  } else {
    console.warn("Cannot clear Konva target layer: stage or layer not ready.");
  }
  // Note: In Test Runner, this should also trigger auto-save if in Exam mode.
}

function HandlerShowHint() { showHint.value = true; }
function closeReport() { showReport.value = false; }

// submitAnswers processes the data in placedStickersData
function submitAnswers() {
  console.log("Submitting answers...");
  // Process the final positions from the DATA array
  submittedReport.value = placedStickersData.value.map((stickerData) => {
    // Find the zone the sticker's center is in at the time of submission, using the data's coordinates
    // Use the same offsetX/offsetY (20, 20) as when creating the Konva node for center calculation
    const stickerCenterX = stickerData.x + 20;
    const stickerCenterY = stickerData.y + 20;
    const zone = findZoneContainingPoint({
      x: stickerCenterX,
      y: stickerCenterY
    });
    return {
      emoji: stickerData.emoji,
      x: stickerData.x, // Store top-left x/y from data
      y: stickerData.y, // Store top-left x/y from data
      zone: zone, // null if outside any zone (contains score, name etc if found)
      isCorrect: zone && stickerData.emoji === zone.sticker
    };
  });

  // Display the report
  showReport.value = true;
  console.log("[HotSpot] Report generated:", submittedReport.value);
  // Note: In Test Runner, this function should also trigger auto-save or final save.
}

function revealZones() {
  if (!zoneLayer || !stage) {
    console.warn("Konva stage or zoneLayer not ready for revealing zones.");
    return;
  }
  const allShapes = zoneLayer.getChildren();
  if (allShapes.length === 0) {
    console.warn("No zones found in zoneLayer to reveal.");
    return;
  }
  console.log('[RevealZones] Revealing', allShapes.length, 'zones.');

  allShapes.forEach(shape => {
    shape.opacity(0.8); // Make visible
    shape.stroke('blue'); // Set stroke color (could be red/green based on correctness in Report mode)
    shape.strokeWidth(2); // Set a visible stroke width
    shape.listening(false); // Ensure clicking revealed zones doesn't do anything unexpected
  });
  zoneLayer.draw(); // Redraw layer to show visible zones

  const revealDuration = 2000; // 2 seconds
  // const startTime = Date.now(); // Capture start time - Not needed

  setTimeout(() => {
    // Check if component is still mounted and layers exist before trying to revert
    if (!zoneLayer || !stage || !stage.container()) {
      console.log('[RevealZones] Stage or layer gone, cannot revert.');
      return;
    }

    const shapesToRevert = zoneLayer.getChildren(); // Get current shapes in case layer content changed
    if (shapesToRevert.length === 0) {
      console.log('[RevealZones] No shapes to revert.');
      return;
    }

    console.log('[RevealZones] Reverting zones...');
    shapesToRevert.forEach(shape => {
      shape.opacity(0); // Back to invisible
      shape.stroke('blue'); // Revert stroke color
      shape.strokeWidth(0); // Revert stroke width back to invisible
      shape.listening(false);
    });

    // Only draw if there are shapes to draw
    zoneLayer.draw();

  }, revealDuration);
}

</script>

<template>
  <div v-if="selectedElement" class="card card-preview">
    <!-- Card Header (Preview mode) -->
    <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" mode="Preview" />

    <div class="card-body">
      <div class="mb-3">
        <h3>{{ selectedElement.el_Text }}</h3>
      </div>

      <!-- Quill editor area -->
      <div v-if="selectedElement?.el_RichText?.trim().length > 0" class="quill-editor" ref="quillEditor"></div>
      <p v-else-if="selectedElement.hasOwnProperty('el_RichText') && !selectedElement?.el_RichText?.trim()">No
        additional text provided.</p>


      <!-- Main Container for Emoticons Source and Canvas -->
      <!-- This container uses flexbox to arrange the source panel and canvas side-by-side -->
      <div id="container">
        <!-- Konva Canvas Area - Now comes first in HTML -->
        <!-- The canvas-wrapper takes available space -->
        <div class="canvas-wrapper">
          <!-- The Konva stage will be created inside this div -->
          <!-- Its size will match the intrinsic size from el_CanvasSize -->
          <div ref="canvasRef" class="konva-container"></div>
          <!-- Reset button overlay -->
          <!-- Positioned absolutely over the canvas-wrapper -->
          <button class="btn btn-warning btn-sm canvas-reset-btn" @click="resetSelections">
            🔄 Reset canvas
          </button>
        </div>

        <!-- Emoticons Source Column - Now positioned absolutely over the canvas -->
        <!-- Added z-index 6 to ensure it's above remove zone (z-index 5) -->
        <div id="emoticon-source" ref="emoticonSourceRef">
          <template v-if="uniqueStickers.length > 0">
            <!-- Use draggable="true" on these HTML elements -->
            <div v-for="sticker in uniqueStickers" :key="sticker" class="draggable-emoticon" draggable="true">
              {{ sticker }}
            </div>
          </template>
          <template v-else>
            <p>No stickers defined for zones.</p>
          </template>
        </div>
      </div>

      <!-- Hint Message -->
      <div hidden class="mt-3">
        <button v-if="displayHintButton && !showReport && !showHint" @click="HandlerShowHint"
          class="btn btn-primary btn-sm">Show Hint</button>
        <div v-if="showHint" class="hintMessage">{{ selectedElement.tip }}</div>
      </div>

      <!-- Score Display -->
      <div hidden id="score">
        <!-- Counts update automatically from computed properties -->
        <span class="inside">Dans les zones = {{ countInside }}</span>
        <span class="outside">Hors des zones = {{ countOutside }}</span>
      </div>

      <!-- Report Container -->
      <div v-if="showReport" class="ReportContainer ">
        <h4>Evaluation Report</h4>
        <p><strong>Total Interactions (Drops):</strong> {{ interactionCount }}</p>
        <p><strong>Stickers Placed:</strong> {{ placedStickersData.length }}</p> <!-- Use placedStickersData length -->
        <p><strong>Details:</strong></p>
        <ul>
          <li v-for="(detail, index) in reportDetails" :key="index">{{ detail }}</li>
        </ul>
        <p><strong>Points Gained:</strong> {{ selectedZonePoints }}</p>
        <p><strong>Penalties Applied:</strong> {{ penalties }}</p>
        <p><strong>Maximum Possible Score:</strong> {{ maxScore }}</p>
      </div>
    </div>

    <!-- Card Footer Buttons -->
    <div class="card-footer" style="text-align: right;">
      <button class="btn btn-primary btn-sm" @click="submitAnswers">Submit</button>
      <button class="btn btn-info btn-sm mx-2" @click="revealZones">👁️ Reveal Zones</button>
      <button class="btn btn-secondary btn-sm" @click="resetSelections" style="margin-left: 10px;">
        Reset All
      </button>
      <button class="btn btn-console btn-sm ml-2" @click="closeReport" v-if="showReport">Close Report</button>
    </div>
  </div>
</template>

<style scoped>
/* Styles to ensure the image and canvas are contained within the card and responsive */

/* Ensure the card itself respects its max-width and contains its content */
.card {
  margin-bottom: 20px;
  width: 100%;
  /* Card takes full width of its parent */
  box-sizing: border-box;
  /* Include padding/border in width calculation */
  overflow: hidden;
  /* Crucial to hide anything overflowing the card */
}

/* Ensure card-body correctly contains its children */
.card-body {
  display: flex;
  flex-direction: column;
  padding: 15px;
  width: 100%;
  /* Make card-body take full width of its parent */
  box-sizing: border-box;
  /* Include padding in width */
  overflow: hidden;
  /* Hide anything overflowing horizontally */
}

/* The flex container for canvas and source panel (canvas comes first in HTML) */
#container {
  display: flex;
  flex-direction: row;
  /* Canvas and panel side-by-side */
  border: 1px solid #ccc;
  box-sizing: border-box;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  margin-bottom: 15px;
  width: 100%;
  /* Make container take full width of card-body */
  align-self: center;
  /* Center the container if card-body allows */
  flex-wrap: nowrap;
  /* Prevent wrapping */
  position: relative;
  /* Parent for absolute positioning of emoticon-source */
}

/* Emoticons Source Column - Positioned ABSOLUTELY over the canvas */
#emoticon-source {
  position: absolute;
  /* Position relative to #container */
  top: 0;
  left: 0;
  width: 100px;
  /* Fixed width for the panel */
  max-height: 100%;
  /* Take max height available from parent (#container) */
  padding: 10px;
  border: 1px solid rgba(204, 204, 204, 0.5);
  /* Semi-transparent border */
  background-color: rgb(148 148 148 / 60%);
  /* Semi-transparent dark background */
  display: flex;
  flex-direction: column;
  /* Stack emoticons vertically */
  align-items: center;
  /* Center emoticons horizontally */
  user-select: none;
  cursor: default;
  z-index: 6;
  /* Ensure panel is above the canvas layers and remove zone */
  overflow-y: auto;
  /* Add scroll if many stickers exceed height */
  box-sizing: border-box;
}

.draggable-emoticon {
  font-size: 35px;
  margin: 8px 0;
  cursor: grab;
  transition: transform 0.1s ease;
  color: white;
  /* Make emoticons visible on dark background */
}

.draggable-emoticon:hover {
  transform: scale(1.05);
}

.draggable-emoticon:active {
  cursor: grabbing;
  transform: scale(1.15);
  opacity: 0.8;
}

/* Konva Canvas Area - Takes remaining space in the flex container */
.canvas-wrapper {
  position: relative;
  flex-grow: 1;
  /* Allow canvas container to take remaining space */
  background-color: #eee;
  /* Fallback background */
  /* min-height handled by the intrinsic height of Konva stage */
  min-height: 200px;
  /* Add min-height */
}

/* The Konva container div */
.konva-container {
  width: 100%;
  /* Konva container takes full width of its parent */
  height: 100%;
  /* Konva container takes full height of its parent */
  overflow: hidden;
  position: relative;
}

/* The Konva canvas element itself generated inside .konva-container */
.konva-container canvas {
  /* These styles are crucial for scaling the canvas element itself */
  /* When Konva sets width/height attributes based on el_CanvasSize,
     max-width/height in CSS will force it to scale down to fit the container,
     maintaining the aspect ratio due to height: auto. */
  max-width: 100%;
  max-height: 100%;
  /* Ensure it doesn't exceed the container height */
  height: auto !important;
  /* Maintain aspect ratio when scaling down */
  display: block;
  /* Remove extra space below canvas */
  margin: 0 auto;
  /* Center the canvas if it's smaller than container */
  border: none;
  /* Make sure the canvas background matches the intended background */
  background-color: transparent;
  /* Konva draws the background, so container bg is not needed */
}

/* Position the reset button */
.canvas-reset-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  /* Adjusted position to not overlap with panel edge */
  z-index: 10;
  /* Ensure it's above the canvas and emoticon panel */
  background-color: #ffc107;
  border-color: #ffc107;
  font-weight: bold;
  padding: 5px 10px;
  font-size: 0.8rem;
  border-radius: 4px;
}

/* Styles for other elements in card-body */
.quill-editor,
#score {
  width: 100%;
  /* Take full width of parent (card-body) */
  max-width: 780px;
  /* Approx 800px container - 2*10px padding/margin */
  box-sizing: border-box;
  align-self: center;
  /* Center if max-width is less than 100% */
}

.hintMessage {
  border: green 1px solid;
  border-radius: 5px;
  padding: 10px;
  margin: 10px;
  background-color: rgb(222, 235, 222);
  color: #333;
}



.btn-console {
  background-color: #343a40;
  color: white;
  border: none;
  cursor: pointer;
}

.quill-editor {
  margin-bottom: 15px;
}

.quill-editor .ql-editor {
  min-height: auto !important;
  padding: 12px 15px !important;
}

.quill-editor .ql-container {
  border: none !important;
}


/* Style for score display */
#score {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  border: 2px solid #007bff;
  border-radius: 5px;
  background-color: #e9f5ff;
  min-width: 300px;
  text-align: center;
  align-self: center;
}

#score span.inside {
  color: #006600;
}

#score span.outside {
  color: #cc0000;
  margin-left: 15px;
}

.card-footer {
  padding: 10px 15px;
  width: 100%;
  box-sizing: border-box;
}

/* Ensure responsiveness for small screens */
@media (max-width: 600px) {

  /* On small screens, stack the canvas and then the panel below it */
  #container {
    flex-direction: column;
    align-items: center;
  }

  /* Emoticon source panel when stacked below canvas */
  #emoticon-source {
    position: relative;
    /* Change from absolute */
    top: auto;
    /* Remove absolute positioning */
    left: auto;
    /* Remove absolute positioning */
    width: 100%;
    /* Take full width */
    max-width: none;
    /* Remove max-width constraint */
    height: auto;
    /* Height based on content */
    max-height: none;
    /* Remove max-height */
    border: none;
    /* Remove borders */
    border-top: 1px solid rgba(204, 204, 204, 0.5);
    /* Horizontal border above */
    background-color: #f8f9fa;
    /* Lighter background when not overlaid */
    display: flex;
    /* Keep flex */
    flex-direction: row;
    /* Layout emoticons horizontally */
    flex-wrap: wrap;
    /* Allow emoticons to wrap */
    justify-content: center;
    z-index: auto;
    /* Remove specific z-index */
    padding: 10px 0;
    /* Adjust padding */
    box-shadow: inset 0 5px 5px -5px rgba(0, 0, 0, 0.1);
    /* Add a subtle shadow top */
  }

  .draggable-emoticon {
    margin: 5px;
    /* Adjust margin for horizontal layout */
    color: #333;
    /* Darker color on lighter background */
  }

  /* Canvas wrapper takes full width when stacked */
  .canvas-wrapper {
    width: 100%;
    flex-grow: 0;
    /* Don't grow beyond content needs */
    min-height: 150px;
    /* Adjust min-height for small screens */
  }

  /* Konva container takes full width */
  .konva-container {
    width: 100%;
    height: auto;
    /* Allow height to adjust based on canvas aspect ratio */
    overflow: hidden;
  }

  /* Konva canvas element scales */
  .konva-container canvas {
    width: 100%;
    /* Ensure canvas takes full width */
    height: auto !important;
    /* Maintain aspect ratio */
    max-width: 100%;
    max-height: none;
    /* Remove max-height constraint */
  }

  /* Adjust padding/margins for smaller screens if needed */
  .card-body,
  .card-footer {
    padding: 10px;
  }

  /* Position the reset button for small screens */
  .canvas-reset-btn {
    top: 5px;
    right: 5px;
    padding: 3px 8px;
    font-size: 0.7rem;
  }

  .ReportContainer {
    padding: 15px;
  }
}
</style>