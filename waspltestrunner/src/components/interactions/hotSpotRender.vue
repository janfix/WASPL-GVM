<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Konva from 'konva';
import Quill from 'quill';
import cardHeader from './cardHeader.vue'; // Test Runner specific header
import { useResponsesStore } from '@/stores/useResponsesStore'; // Test Runner store
import { usePublicationStore } from '@/stores/usePublicationStore'; // Test Runner store
import cardFooterLearningMode from './cardFooterLearningMode.vue'; // Test Runner footer

// --- Props (Test Runner structure) ---
const props = defineProps({
  question: { type: Object, required: true },
  testData: { type: Object, required: true },
  numOrder: [Number, null],
  questionIndexMap: { type: Object, required: false },
  readOnly: { type: Boolean, default: false },
});

// --- Emits (Test Runner requirement) ---
const emit = defineEmits(['interaction-started']);

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

// --- Test Runner Stores ---
const responsesStore = useResponsesStore();
const publicationStore = usePublicationStore();

// --- Core State (Derived from props and user interaction) ---
const selectedElement = computed(() => props.question); // Use prop as source
const elementLabel = computed(() => selectedElement.value?.el_Text || 'HotSpot'); // Use el_Text for label

// --- State Variables ---
const localReadonly = ref(props.readOnly); // Local state for read-only mode
const showReport = ref(false); // To show/hide the report

// --- Core State for Placed Stickers (Data Array) ---
// This array will store DATA about the stickers, NOT Konva nodes
const placedStickersData = ref([]); // Renamed for clarity
const interactionCount = ref(0); // Count of drops (equivalent to clickCount in old runner code)

// Flag to track if remove zone hover effects have been added (to avoid adding duplicates)
let hoverEffectsAdded = false;

// --- Report Data (Derived from placedStickersData after submission) ---
const finalReport = ref([]); // Array to store results after submission (renamed from submittedReport)

// Scores - These are computed *after* the finalReport is generated on submission
const selectedZonePoints = computed(() => {
  return finalReport.value.reduce((sum, item) => {
    if (item.isCorrect) {
      return sum + (item.zone?.score || 0);
    }
    return sum;
  }, 0);
});
const penalties = computed(() => {
  // Assuming penalties is a property on the element itself
  const penaltyValue = selectedElement.value?.el_Penalties ?? 0;
  // Penalties are applied for stickers dropped *outside* any zone at submission
  const outOfZoneCount = finalReport.value.filter(item => !item.zone).length;
  return outOfZoneCount * penaltyValue;
});
const maxScore = computed(() => {
  const zones = selectedElement.value?.el_Data || [];
  // Max score is the sum of scores of all zones, assuming each zone can contribute its score
  return zones.reduce((sum, zone) => sum + (zone.score ?? 0), 0);
});
const reportDetails = computed(() => {
  // Format report based on the finalReport data structure
  return finalReport.value.map((item, idx) => {
    // Use sticker coordinates from the item for reporting if needed, but usually just status
    if (!item.zone) return `${idx + 1}. ❌ "${item.emoji}" hors zone`;
    if (!item.isCorrect) return `${idx + 1}. ❌ "${item.emoji}" dans "${item.zone.name}" (attendu: "${item.zone.sticker}")`;
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

// --- Hint Display (Optional in Test Runner, but included for completeness) ---
const showHint = ref(false); // Keep hint state
const displayHintButton = computed(() => !!selectedElement.value?.tip); // Show button if tip exists

// --- Auto-Save Logic (Test Runner requirement) ---
const token = localStorage.getItem('token');
const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
const userId = decodedToken?._id || decodedToken?.sub;

let saveTimeout = null;
function debouncedSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    autoSaveAnswers();
  }, 300); // Debounce time in ms
}

// Watch changes in placed stickers or drop count to trigger auto-save
watch(placedStickersData, (newVal, oldVal) => {
  // Only auto-save in exam mode
  //if (publicationStore.publicationData?.mode === 'exam') {
    // console.log("[HotSpot] 💾 Auto-save triggered by placedStickersData change");
    debouncedSave();
  //}
}, { deep: true }); // Deep watch is important for array of objects

watch(interactionCount, (newVal) => {
  // Only auto-save in exam mode
  if (publicationStore.publicationData?.mode === 'exam') {
    // console.log("[HotSpot] 💾 Auto-save triggered by interactionCount change");
    debouncedSave();
  }
});


// --- Lifecycle Hooks ---

onMounted(async () => {
  // Wait for next tick to ensure DOM elements have rendered
  await nextTick();
  console.log("Component mounted for question:", selectedElement.value?.el_ID);

  // Initialize Quill if RichText exists
  if (quillEditor.value && selectedElement.value?.el_RichText) {
    initializeQuill();
  }

  // Draw the canvas, layers, load image, draw zones, add remove zone
  drawCanvas();

  // Attach HTML drag/drop listeners to the source panel and canvas container
  attachDelegatedHtmlDragstartListener();

  // Check for saved answers *after* the canvas is drawn and layers exist
  // We need userId and questionId to be defined here.
  if (userId && selectedElement.value?.el_ID) {
      const saved = responsesStore.getResponseForQuestion(userId, selectedElement.value?.el_ID);

      if (saved?.placedStickersData) {
        placedStickersData.value = [...saved.placedStickersData];
        interactionCount.value = saved.interactionCount || 0; // Load interaction count
        console.log("[HotSpot] 🔄 Loaded saved data:", placedStickersData.value.length, "stickers");
        redrawPlacedStickers(); // Redraw Konva nodes based on loaded data
      } else {
        console.log("[HotSpot] No saved data found for user/question.");
      }
  } else {
      console.warn("[HotSpot] Cannot check for saved data: userId or questionId is missing.");
  }


  // Listen for the 'lock-hotspot' event (for external locking)
  window.addEventListener('lock-hotspot', lockHotspot);

  // Apply readOnly from props initially
  applyReadonly(props.readOnly);

  // Apply readOnly from publicationStore.readOnlyAnswer if present (overrides props.readOnly)
  if (publicationStore.publicationData?.readOnlyAnswer) {
    const readOnlyAnswer = publicationStore.publicationData.readOnlyAnswer;
    const isLocked = Array.isArray(readOnlyAnswer)
      ? readOnlyAnswer.includes(selectedElement.value?.el_ID)
      : (readOnlyAnswer instanceof Set
        ? readOnlyAnswer.has(selectedElement.value?.el_ID)
        : false);

    if (isLocked) {
      console.log(`[HotSpot] 🔒 Verrouillage immédiat pour ${selectedElement.value?.el_ID} d'après publicationStore.`);
      applyReadonly(true); // Set localReadonly and update Konva state
    }
  }

});

onUnmounted(() => {
  console.log("Component unmounting, cleaning up...");

  // Remove event listeners
  window.removeEventListener('lock-hotspot', lockHotspot);
  if (emoticonSourceRef.value) {
    emoticonSourceRef.value.removeEventListener('dragstart', handleHtmlDragStart);
  }
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('dragover', handleCanvasDragOver);
    canvasRef.value.removeEventListener('drop', handleCanvasDrop);
  }

  // Destroy Konva stage
  if (stage) {
    stage.destroy();
    stage = null;
    bgLayer = null;
    zoneLayer = null;
    targetLayer = null;
    removeLayer = null; // Nullify remove layer
    backgroundKonvaImage = null;
    removeZoneGroup = null; // Nullify remove zone group
    hoverEffectsAdded = false; // Reset flag on unmount
    console.log("Konva stage destroyed");
  }

  // Clean up Quill instance
  if (quillInstance) {
    quillInstance = null;
    console.log("Quill instance nulled");
  }

  // Clear any pending save timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
});


// --- Watchers ---

// Watch props.readOnly and apply the state
watch(() => props.readOnly, (newVal) => {
  console.log("[HotSpot] props.readOnly changed:", newVal);
  applyReadonly(newVal); // Apply readOnly state
});

// Redraw canvas and reset state if element data (zones, background) changes - Less likely in Test Runner
// but good practice if question prop can change dynamically without full component remount
watch(() => [selectedElement.value?.el_Data, selectedElement.value?.el_Background], ([newData, newBg], [oldData, oldBg]) => {
  // Avoid reacting to initial load or self-inflicted changes unless element ID changes
  if (!selectedElement.value || !canvasRef.value || !stage) return; // Only react if initialized

  console.log("[HotSpot] selectedElement el_Data or el_Background changed, redrawing canvas and resetting state.");
  // Destroy the old stage and all its nodes
  if (stage) {
    stage.destroy();
    stage = null;
  }
  // Reset state related to placed items (clears placedStickersData)
  // Passing false prevents auto-save here, resetSelections(true) would trigger it if in exam mode
  resetSelections(false);

  // Now draw the new canvas, which will be populated from the (now empty) data
  nextTick(() => { // Wait for next tick to ensure container dimensions are updated
    drawCanvas(); // Creates new stage, layers, loads image, draws zones/stickers, adds remove zone
    // Re-attach event listeners as the container might be recreated
    attachDelegatedHtmlDragstartListener();
    // Ensure readOnly state is reapplied after drawing the new stage
    applyReadonly(localReadonly.value);
  });

}, { deep: true });


// --- Read-Only Logic ---
function applyReadonly(isReadonly) {
  localReadonly.value = isReadonly;
  console.log("[HotSpot] Applying readOnly:", isReadonly);
  if (stage) {
    stage.listening(!isReadonly); // Disable/enable Konva stage events
    console.log("[HotSpot] Konva stage listening:", !isReadonly);

    // Also update the draggable state of existing stickers
    stage.find('.placedSticker').forEach(stickerNode => {
      stickerNode.draggable(!isReadonly);
    });
    // Update remove zone listening state (if remove zone exists)
    if (removeZoneGroup) {
        removeZoneGroup.listening(!isReadonly);
         console.log("[HotSpot] Remove zone listening:", !isReadonly);

        // Manage hover effects based on readOnly state
        if (isReadonly) {
            // --- Transitioning TO ReadOnly ---
            removeZoneGroup.off('mouseover'); // Remove hover listeners
            removeZoneGroup.off('mouseout');
            hoverEffectsAdded = false; // Reset flag
            const zoneRect = removeZoneGroup.findOne('Rect');
            if (zoneRect) {
                 zoneRect.fill('rgba(255, 0, 0, 0.3)'); // Revert fill
            }
            if (stage && stage.container()) {
                 stage.container().style.cursor = 'default'; // Ensure cursor is reset
            }
            console.log("[HotSpot] Remove zone hover effects removed.");

        } else {
            // --- Transitioning FROM ReadOnly to Interactive ---
            // Add hover effects if not already added
             if (!hoverEffectsAdded) {
                addRemoveZoneHoverEffects(); // Call helper
             }
        }
    }

    targetLayer?.draw(); // Redraw target layer to reflect draggable state change
    removeLayer?.draw(); // Redraw remove layer to reflect listening state/fill changes
  }
  // Visual overlay is controlled by v-show="localReadonly" in template
}

// Helper function to add hover effects to remove zone (called by applyReadonly)
// This function adds the listeners and sets the flag.
// It should only be called when transitioning INTO interactive mode AND they are not already added.
function addRemoveZoneHoverEffects() {
     // Check if removeZoneGroup and stage are ready before adding listeners
     if (!removeZoneGroup || !stage) {
         console.warn("[HotSpot] Cannot add remove zone hover effects: removeZoneGroup or stage not ready.");
         return;
     }
     // The flag check is now in applyReadonly before calling this.
     console.log("[HotSpot] Adding remove zone hover effects.");

     removeZoneGroup.on('mouseover', function() {
         if (stage && stage.container()) stage.container().style.cursor = 'copy';
         const zoneRect = removeZoneGroup.findOne('Rect');
         if (zoneRect) zoneRect.fill('rgba(255, 0, 0, 0.6)');
         removeLayer?.draw();
     });
     removeZoneGroup.on('mouseout', function() {
         if (stage && stage.container()) stage.container().style.cursor = 'default';
          const zoneRect = removeZoneGroup.findOne('Rect');
          if (zoneRect) zoneRect.fill('rgba(255, 0, 0, 0.3)');
          removeLayer?.draw();
     });

     hoverEffectsAdded = true; // Set flag after adding
     console.log("[HotSpot] Remove zone hover effects added.");
}


// Event listener for locking the question (e.g., on exam submission)
function lockHotspot(event) {
  // console.log("[HotSpotRender] Received lock-hotspot for", event.detail?.questionId, ", my ID is", selectedElement.value?.el_ID);

  if (event.detail && event.detail.questionId !== selectedElement.value?.el_ID) {
    // This event is not for this question
    // console.warn("[HotSpotRender] ❌ Not for me!");
    return;
  }
  console.log(`[HotSpotRender] 🔒 Lock received for ${selectedElement.value?.el_ID}`);
  applyReadonly(true); // Apply read-only state
}


// --- Quill Functions ---
function initializeQuill() {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, { theme: 'snow', readOnly: true, modules: { toolbar: false } });
    quillInstance.root.innerHTML = selectedElement.value?.el_RichText || '';
    // isQuillEmpty.value = quillInstance.getText().trim() === ''; // Not strictly needed in readOnly
    // quillEditorReady.value = true; // Not strictly needed in readOnly
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
    listening: !localReadonly.value, // Apply initial listening state based on localReadonly
  });
  console.log(`Konva Stage created with intrinsic size: ${stage.width()}x${stage.height()}. Listening: ${stage.listening()}`);


  // Create Layers
  bgLayer = new Konva.Layer({ name: 'bgLayer' });
  zoneLayer = new Konva.Layer({ name: 'zoneLayer' });
  targetLayer = new Konva.Layer({ name: 'targetLayer' }); // Layer for dropped/placed stickers
  removeLayer = new Konva.Layer({ name: 'removeLayer' }); // New layer for remove zone

  stage.add(bgLayer);
  stage.add(zoneLayer);
  stage.add(removeLayer); // Add remove layer below target layer so stickers are above it
  stage.add(targetLayer);


  // Load and draw Background Image
  const imageObj = new window.Image();
  imageObj.onload = () => {
    // Store the Konva Image node instance
    backgroundKonvaImage = new Konva.Image({
      image: imageObj,
      // Size the image to the *intended* stage dimensions (match stage size)
      width: stage.width(),
      height: stage.height(),
      listening: false, // Background image shouldn't capture events
    });
    bgLayer.add(backgroundKonvaImage);
    bgLayer.draw();
    console.log("Background image loaded and drawn.");

    // Draw zones and stickers *after* background is loaded and drawn and sized
    drawZones(zoneLayer, selectedElement.value?.el_Data || []);
    // Pass localReadonly state to addRemoveZone so it can set initial listening/effects
    addRemoveZone(removeLayer, intrinsicStageWidth, intrinsicStageHeight, localReadonly.value);
    // redrawPlacedStickers will be called after loading saved data in onMounted
  };

  const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const rawSrc = selectedElement.value?.el_Background || '';
  // Determine if the source is an absolute URL, starts with /, or relative
  const isAbsolute = /^https?:\/\//i.test(rawSrc);
  const isRooted = rawSrc.startsWith('/');
  imageObj.src = isAbsolute ? rawSrc : (isRooted ? `${VITE_API_BASE_URL.replace(/\/$/, '')}${rawSrc}` : rawSrc);
  console.log('[drawCanvas] image source:', imageObj.src);

  // Handle potential error loading image (optional)
  imageObj.onerror = (err) => {
    console.error("Error loading background image:", imageObj.src, err);
    // Still draw layers even if image failed
    bgLayer.draw(); // Draw an empty background layer or placeholder
    drawZones(zoneLayer, selectedElement.value?.el_Data || []);
    // Add remove zone even if image fails
    addRemoveZone(removeLayer, intrinsicStageWidth, intrinsicStageHeight, localReadonly.value);
    // redrawPlacedStickers will be called after loading saved data in onMounted
  };

  // Draw layers immediately. They will be empty initially if image is async.
  bgLayer.draw();
  zoneLayer.draw();
  removeLayer.draw(); // Draw the new layer
  targetLayer.draw();
}


// Function to add the remove zone (trash can) to a layer
function addRemoveZone(layer, stageWidth, stageHeight, isReadonly) {
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
    listening: !isReadonly, // Set initial listening based on readOnly state
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
    // Use zoneSize/2 for center, then adjust manually for visual centering
    x: (zoneSize / 2) - 7, // Centered horizontally, adjusted -7 based on visual check
    y: (zoneSize / 2) + 2, // Centered vertically, adjusted +2 based on visual check
    fontSize: iconSize, // 40
    fill: 'white',
    // Offset for center alignment
    offsetX: iconSize / 2, // 20
    offsetY: iconSize / 2, // 20
    listening: false, // Icon text itself doesn't need to listen
  });

  removeZoneGroup.add(zoneRect);
  removeZoneGroup.add(trashIcon);

  layer.add(removeZoneGroup);
  layer.draw();
  console.log("Remove zone added. Listening:", removeZoneGroup.listening());

  // Add hover effects only if not in readOnly mode initially
  // addRemoveZoneHoverEffects() checks the flag internally now.
  // Call it regardless, the flag prevents duplicates.
  // addRemoveZoneHoverEffects(); // This might add duplicates if called again on redraw
  // Better: call it specifically when needed in applyReadonly

  // We don't add hover effects here anymore. They are managed by applyReadonly.
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
      draggable: !localReadonly.value, // Make the node draggable *unless* in readOnly mode
      offsetX: 20, // Use consistent offsets for center calculation (half of approx size)
      offsetY: 20, // Use consistent offsets for center calculation (half of approx size)
      id: `sticker-${stickerData.id}`, // Use a unique ID based on data ID
      name: 'placedSticker', // Identifier name for Konva nodes (used by stage.find)
    });

    // Store a reference back to the data object on the Konva node
    stickerNode.stickerData = stickerData; // Link Konva node back to its data object

    // Add the *new* Konva node to the target layer
    targetLayer.add(stickerNode);

    // Attach the dragend listener to this *new* Konva node (only if not readonly)
    if (!localReadonly.value) {
      stickerNode.on('dragend', handleStickerDragEnd);
    }
  });

  targetLayer.draw(); // Redraw the layer to show the newly created nodes
  console.log(`[HotSpot] Redrew ${placedStickersData.value.length} stickers.`);
}


// --- HTML Drag and Drop Handlers (Source Column to Canvas) ---
// These listeners are attached to the HTML container elements, not Konva stage.
// We need to check localReadonly inside the drop handler.
function attachDelegatedHtmlDragstartListener() {
  if (!emoticonSourceRef.value || !canvasRef.value) {
    console.warn("Cannot attach drag/drop listeners: refs not available.");
    return;
  }
  // Ensure listeners are removed first if this is called on redraw
  emoticonSourceRef.value.removeEventListener('dragstart', handleHtmlDragStart);
  canvasRef.value.removeEventListener('dragover', handleCanvasDragOver);
  canvasRef.value.removeEventListener('drop', handleCanvasDrop);

  // Add new listeners
  emoticonSourceRef.value.addEventListener('dragstart', handleHtmlDragStart);
  canvasRef.value.addEventListener('dragover', handleCanvasDragOver);
  canvasRef.value.addEventListener('drop', handleCanvasDrop);
  console.log("HTML Drag/Drop listeners attached.");
}

function handleHtmlDragStart(e) {
  if (e.target && e.target.classList.contains('draggable-emoticon')) {
    // Prevent drag if in readonly mode
    if (localReadonly.value) {
      e.preventDefault();
      // console.log("HTML Drag start prevented (readonly).");
      return;
    }
    e.dataTransfer.setData('text/emoticon', e.target.textContent);
    e.dataTransfer.effectAllowed = 'copy';
    // console.log('HTML Drag start (delegated):', e.target.textContent);
  } else {
    // If the drag didn't start from a valid emoticon, prevent it
    e.preventDefault();
  }
}

function handleCanvasDragOver(e) {
  e.preventDefault(); // Necessary to allow dropping
  // Only allow drop effect if not readonly
  if (!localReadonly.value) {
    e.dataTransfer.dropEffect = 'copy';
  } else {
    e.dataTransfer.dropEffect = 'none';
  }
}

function handleCanvasDrop(e) {
  e.preventDefault();

  // Prevent drop if in readonly mode or Konva not ready
  if (localReadonly.value || !stage || !targetLayer || !zoneLayer || !canvasRef.value || !removeLayer) { // Added removeLayer check
    console.warn("Drop ignored: readonly, missing data, or Konva not ready.");
    return;
  }

  // 🚀 Emit interaction started signal (only on the first drop for this question)
  if (interactionCount.value === 0) {
    emit('interaction-started', selectedElement.value?.el_ID);
    console.log("[HotSpot] Emitted 'interaction-started'.");
  }

  interactionCount.value += 1; // Count each successful drop as an interaction

  const emoticonText = e.dataTransfer.getData('text/emoticon');
  if (!emoticonText) {
    console.warn("Drop ignored: no emoticon data.");
    return;
  }

  // Get the drop position relative to the STAGE (using event coordinates and canvas container offset)
  // IMPORTANT: Convert HTML coordinates to Konva stage coordinates
  const containerRect = canvasRef.value.getBoundingClientRect();
  // Calculate position relative to the *scaled* Konva canvas visual area
  const htmlX = e.clientX - containerRect.left;
  const htmlY = e.clientY - containerRect.top;

  // Get the actual HTML canvas element rendered by Konva
  const canvasElement = canvasRef.value.querySelector('canvas'); // Use DOM query

  if (!canvasElement) {
    console.error("Cannot find Konva canvas element inside container.");
    return; // Exit if canvas isn't found
  }

  const actualWidth = canvasElement.offsetWidth;
  const actualHeight = canvasElement.offsetHeight;

  // Get the intrinsic Konva stage dimensions
  const intrinsicWidth = stage.width();
  const intrinsicHeight = stage.height();

  // Calculate scaling factor: intrinsic size / actual rendered size
  const scaleX = intrinsicWidth / actualWidth;
  const scaleY = intrinsicHeight / actualHeight;

  // Convert HTML coordinates (relative to container) to intrinsic Stage coordinates
  const stageX = htmlX * scaleX;
  const stageY = htmlY * scaleY;

  // console.log(`HTML Drop: "${emoticonText}" at (${htmlX}, ${htmlY}). Converted Stage pos: (${stageX}, ${stageY})`);

  // --- Create the DATA object for the new sticker ---
  // Store position relative to the STAGE's intrinsic coordinates
  const newStickerData = {
    id: Date.now(), // Simple unique ID based on timestamp
    emoji: emoticonText,
    x: stageX, // Store top-left position in stage coordinates
    y: stageY, // Store top-left position in stage coordinates
    // isInsideAnyZone state is not needed for the final report evaluation,
    // but kept in Preview for live counts. Can remove in Test Runner if not used.
    // isInsideAnyZone: false, // Placeholder
  };

  // --- Create the NEW Konva Text node for this data ---
  const stickerNode = new Konva.Text({
    text: newStickerData.emoji,
    x: newStickerData.x, // Use data coordinates (stage coords)
    y: newStickerData.y, // Use data coordinates (stage coords)
    fontSize: 40, // Must match size used for offset calculation
    draggable: !localReadonly.value, // Make it draggable *on the canvas* after dropping (if not readonly)
    offsetX: 20, // Use consistent offsets for center calculation (half of approx size)
    offsetY: 20, // Use consistent offsets for center calculation (half of approx size)
    id: `sticker-${newStickerData.id}`, // Use data ID for Konva ID
    name: 'placedSticker', // Identifier name
  });

  // Store a reference back to the data object on the Konva node
  stickerNode.stickerData = newStickerData; // Link Konva node back to its data

  // Add the DATA object to our reactive array
  placedStickersData.value.push(newStickerData);
  console.log(`Added sticker "${emoticonText}" to data. Total: ${placedStickersData.value.length}`);


  // Add the NEW Konva node to the target layer
  targetLayer.add(stickerNode);

  // --- Add dragend listener for subsequent drags *on the canvas* ---
  // Only if draggable (i.e., not readonly)
  if (!localReadonly.value) {
    stickerNode.on('dragend', handleStickerDragEnd);
  }

  // Redraw the layer to show the new sticker node
  targetLayer.draw();

  // Auto-save the updated state (placedStickersData and interactionCount)
  if (publicationStore.publicationData?.mode === 'exam') {
    debouncedSave();
  }
}


// --- Konva Sticker Drag Handler (Dragging *on* the canvas) ---
function handleStickerDragEnd(e) {
  // Prevent dragend processing if somehow triggered in readonly (shouldn't happen if draggable is false)
  if (localReadonly.value) {
    console.warn("Dragend ignored (readonly).");
    return;
  }

  const stickerNode = e.target; // The Konva node that was dragged
  const stickerData = stickerNode.stickerData;
  if (!stickerData) {
    console.error("Could not find sticker data for dragged node!", stickerNode.id());
    return; // Exit if data link is broken
  }
  // console.log(`Dragged sticker "${stickerData.emoji}" (ID: ${stickerData.id}) dragend.`);


  // Get the pointer position at the moment the drag ended
  const pointerPos = stage.getPointerPosition();

  // --- Find the remove zone Konva group and check if pointer is inside ---
  const removeZoneGroup = removeLayer?.findOne('.removeZone'); // Use optional chaining

  let isPointerOverRemoveZone = false;
  if (!removeZoneGroup) {
    console.warn("Remove zone group not found on removeLayer! Cannot check remove zone.");
  } else if (pointerPos) { // Only check if pointer position is available
    const removeZonePos = removeZoneGroup.position();
    const removeZoneSize = { width: removeZoneGroup.width(), height: removeZoneGroup.height() };

    isPointerOverRemoveZone =
      pointerPos.x >= removeZonePos.x &&
      pointerPos.x <= removeZonePos.x + removeZoneSize.width &&
      pointerPos.y >= removeZonePos.y &&
      pointerPos.y <= removeZonePos.y + removeZoneSize.height;

    // console.log(`Remove Zone Group Position: (${removeZonePos.x.toFixed(2)}, ${removeZonePos.y.toFixed(2)}), Size: ${removeZoneSize.width}x${removeZoneSize.height}`);
    // console.log('Is pointer over remove zone?', isPointerOverRemoveZone);
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
    if (stickerNode && stickerNode.getParent() === targetLayer) { // Check if still on target layer
      stickerNode.to({
        opacity: 0, // Fade out
        scaleX: 0.1, // Shrink
        scaleY: 0.1,
        duration: 0.3, // Animation duration in seconds
        onFinish: () => {
          console.log('Animation finished. Destroying Konva node...');
          // 3. Destroy the Konva node from the layer after animation
          if (stickerNode && stickerNode.getParent() === targetLayer) { // Double check before destroying
            stickerNode.destroy();
            // Konva handles redraw after destroy automatically, no need for targetLayer.draw()
            console.log(`Konva node for "${stickerData.emoji}" destroyed.`);
          } else {
            console.warn("Konva node already removed or parent changed before animation finished.");
          }
        },
      });
    } else {
      console.warn("Sticker Konva node already removed or parent changed before attempting animation.");
      // If node is already gone, ensure layer is drawn if necessary
      targetLayer?.draw(); // Use optional chaining
    }

    // Auto-save the updated state (placedStickersData) after removal
    // This is inside the if block because removal is an interaction that needs saving.
    if (publicationStore.publicationData?.mode === 'exam') {
        debouncedSave();
    }


  } else {
    // --- Sticker was NOT dropped on the remove zone ---
    // console.log('Pointer is NOT over remove zone. Updating position.');

    // Update the position in the DATA object with the Konva node's final position
    // This happens regardless of dropping on a zone or not, just not if removed.
    stickerData.x = stickerNode.x();
    stickerData.y = stickerNode.y();
    // console.log(`Sticker "${stickerData.emoji}" data position updated to (${stickerData.x.toFixed(2)}, ${stickerData.y.toFixed(2)}).`);

    // Note: The isInsideAnyZone logic from Preview is not essential for the Test Runner's
    // final score calculation (which happens on submit based on final positions).
    // Keeping it requires finding the zone here, which adds computation.
    // If live counts are not needed in the Test Runner UI, this check can be removed.
    // If needed:
    // const stickerCenterX = stickerNode.x() + stickerNode.offsetX();
    // const stickerCenterY = stickerNode.y() + stickerNode.offsetY();
    // const droppedInZone = findZoneContainingPoint({ x: stickerCenterX, y: stickerCenterY });
    // stickerData.isInsideAnyZone = !!droppedInZone; // Update state if needed

    // Auto-save the updated state (placedStickersData) after position change
     // This is inside the else block because position change is an interaction that needs saving.
    if (publicationStore.publicationData?.mode === 'exam') {
        debouncedSave();
    }
  }
  // console.log("handleStickerDragEnd finished.");
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


// --- Actions ---

// Function to get the question number (Test Runner requirement)
function getQuestionNumber() {
  // Fallback to numOrder if questionIndexMap is not available or doesn't contain the ID
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object' || !selectedElement.value?.el_ID) {
    return props.numOrder ?? 'N/A';
  }
  return props.questionIndexMap[selectedElement.value.el_ID] ?? props.numOrder ?? 'N/A';
}


// resetSelections clears the data and redraws the canvas (which will be empty)
function resetSelections(shouldAutoSave = true) {
  console.log("Resetting selections...");

  // Prevent reset if in readonly mode
  if (localReadonly.value) {
      console.warn("Reset ignored (readonly).");
      return;
  }

  // Clear the DATA array
  placedStickersData.value = [];

  // Other state variables
  interactionCount.value = 0;
  finalReport.value = []; // Clear report data

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

  // Save the reset state if required (e.g., in exam mode)
  if (shouldAutoSave && publicationStore.publicationData?.mode === 'exam') {
    // Use a small timeout to ensure reactivity updates are processed before saving
    nextTick(() => {
      autoSaveAnswers();
    });
  }
}

// Handler for the Hint button
function HandlerShowHint() {
   // Prevent hint if in readonly mode
   if (localReadonly.value) {
       console.warn("Show Hint ignored (readonly).");
       return;
   }
   showHint.value = true;
    // Optionally log interaction or emit event if hints are tracked
}

// Handler to close the report (Learning Mode)
function closeReport() { showReport.value = false; }

// Handler for the Submit button (or Submit button in Learning Mode footer)
function showReportOnSubmit() {
  // In Test Runner, Submit typically calculates the score and shows the report
  submitAnswers();
}


// submitAnswers processes the data in placedStickersData and generates the report
function submitAnswers() {
  console.log("Submitting answers...");

  // Prevent submission in readOnly mode
  if (localReadonly.value) {
    console.warn("Submission ignored (readonly).");
    return;
  }

  // Ensure interactionStarted is emitted on first submit if no drops occurred yet
  // Only emit if NOT in a mode where submit button is not available (e.g. some exam modes)
  // This check might be redundant if the parent component handles submit button visibility,
  // but as a fallback:
  // if (publicationStore.publicationData?.mode !== 'exam') { // Or check if footer is shown
       if (interactionCount.value === 0) {
           emit('interaction-started', selectedElement.value?.el_ID);
           console.log("[HotSpot] Emitted 'interaction-started' on submit (no drops).");
       }
  // }


  // Process the final positions from the DATA array (placedStickersData.value)
  finalReport.value = placedStickersData.value.map((stickerData) => {
    // Find the zone the sticker's center is in at the time of submission, using the data's coordinates
    // Use the same offsetX/offsetY (20, 20) as when creating/positioning the Konva node for center calculation
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
  console.log("[HotSpot] Report generated:", finalReport.value);


  // Save the final result (even in learning mode, the final state is saved)
  // autoSaveAnswers() will save placedStickersData, interactionCount, and calculate scores/penalties based on current placement
  // It will also update the overall response in the store, including score/penalties.
  // The report calculation above is just for displaying the detailed feedback in the UI.
  autoSaveAnswers();

  // The responsesStore handles sending based on test strategy. No explicit send here needed.
}

// Function to save the current state to the responsesStore
function autoSaveAnswers() {
  if (!userId || !selectedElement.value?.el_ID) {
    console.warn("[HotSpot] Cannot auto-save: missing userId or questionId.");
    return;
  }
  // Don't warn if placedStickersData is empty - that's a valid state (e.g., after reset)
  // if (!placedStickersData.value) {
  //   console.warn("[HotSpot] Cannot auto-save: placedStickersData is null/undefined.");
  //   return;
  // }

  // Calculate score/penalties *at save time* based on current placedStickersData positions
  // This evaluation is for the overall score in the test dashboard, NOT the detailed report.
  const currentEvaluation = placedStickersData.value.map((stickerData) => {
    const stickerCenterX = stickerData.x + 20; // Use consistent offset for center
    const stickerCenterY = stickerData.y + 20;
    const zone = findZoneContainingPoint({ x: stickerCenterX, y: stickerCenterY });
    return {
      emoji: stickerData.emoji,
      x: stickerData.x,
      y: stickerData.y,
      zone: zone, // Include zone info in evaluation data
      isCorrect: zone && stickerData.emoji === zone.sticker
    };
  });

  const currentScore = currentEvaluation.reduce((sum, item) => sum + (item.isCorrect ? (item.zone?.score || 0) : 0), 0);
  const currentOutOfZoneCount = currentEvaluation.filter(item => !item.zone).length;
  const currentPenalties = currentOutOfZoneCount * (selectedElement.value?.el_Penalties ?? 0);
  const currentMaxScore = maxScore.value; // Max score is static per question

  const response = {
    userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    // Save the core interaction data
    placedStickersData: placedStickersData.value, // Save the array of sticker data
    interactionCount: interactionCount.value, // Save the interaction count
    timestamp: new Date().toISOString(),
    answered: placedStickersData.value.length > 0, // Consider answered if any sticker is placed
    // Save the current evaluation results (for dashboard summary)
    score: currentScore,
    maxScore: currentMaxScore,
    penalties: currentPenalties,
    // We don't save the full 'finalReport' structure here, only the data needed to recreate state and current score.
    // The final report is generated on submission.
  };

  responsesStore.saveResponse(response);
  // console.log("[HotSpot] 💾 Auto-saved response.");

  // The store itself handles sending the response to the database based on the test strategy.
  // If strategy is 'realTime', the store will queue it or send immediately.
  // responsesStore.sendResponsesToDatabase('realTime', userId); // Let the store manage this call timing
}


// revealZones makes zones visible temporarily
function revealZones() {
  if (!zoneLayer || !stage) {
    console.warn("Konva stage or zoneLayer not ready for revealing zones.");
    return;
  }
  // Prevent reveal if in readonly mode
  if (localReadonly.value) {
    console.warn("Reveal zones ignored (readonly).");
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
      shape.stroke('blue'); // Revert stroke color (or whatever was default)
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
    <!-- Test Runner Header -->
    <cardHeader :numOrder="getQuestionNumber() === 'N/A' ? numOrder : getQuestionNumber()"
      :elementType="selectedElement.el_Type" mode="TestRunner" :showReport="showReport"
      :questionId="selectedElement.el_ID" />

    <div class="card-body">
      <!-- Feedback messages (Test Runner structure) -->
      <div class="AllFeedbacks" v-if="showReport">
        <div v-if="selectedZonePoints >= maxScore && maxScore > 0 && selectedElement.feedback?.correct"
          class="PositiveFeebackContainer">
          {{ selectedElement.feedback.correct }}
        </div>
        <!-- Consider adding a check for some points but not max -->
        <div v-else-if="selectedZonePoints < maxScore && selectedZonePoints > 0 && selectedElement.feedback?.partial"
          class="PartialFeebackContainer">
          {{ selectedElement.feedback.partial }}
        </div>
        <div v-else-if="selectedZonePoints === 0 && selectedElement.feedback?.incorrect"
          class="NegativeFeebackContainer">
          {{ selectedElement.feedback.incorrect }}
        </div>
        <!-- Default feedback if no specific score feedback matches -->
        <div v-else-if="selectedElement.feedback?.default" class="DefaultFeebackContainer">
          {{ selectedElement.feedback.default }}
        </div>
      </div>

      <div class="mb-3">
        <h3>{{ selectedElement.el_Text }}</h3>
      </div>

      <!-- Quill editor area -->
      <div v-if="selectedElement?.el_RichText?.trim().length > 0" class="quill-editor" ref="quillEditor"></div>
      <p v-else-if="selectedElement.hasOwnProperty('el_RichText') && !selectedElement?.el_RichText?.trim()">No
        additional text provided.</p>


      <!-- Main Container for Emoticons Source and Canvas -->
      <div id="container">
        <!-- Konva Canvas Area -->
        <div class="canvas-wrapper">
          <!-- Read-only overlay -->
          <div v-show="localReadonly" class="canvas-overlay"></div>
          <!-- The Konva stage will be created inside this div -->
          <div ref="canvasRef" class="konva-container"></div>
          <!-- Reset button overlay -->
          <button class="btn btn-warning btn-sm canvas-reset-btn" @click="resetSelections" :disabled="localReadonly">
            🔄 Reset canvas
          </button>
        </div>

        <!-- Emoticons Source Column -->
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

      <!-- Hint Message (Optional in Test Runner) -->
      <!-- Keeping it hidden by default like the old HotSpot code -->
      <div hidden class="mt-3">
        <button v-if="displayHintButton && !showReport && !showHint && !localReadonly" @click="HandlerShowHint"
          class="btn btn-primary btn-sm">Show Hint</button>
        <div v-if="showHint" class="hintMessage">{{ selectedElement.tip }}</div>
      </div>

      <!-- Report Container -->
      <div v-if="showReport" class="ReportContainer mt-4">
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

    <!-- Card Footer (Test Runner structure - use Learning Mode or Exam mode footer) -->
    <!-- Assuming cardFooterLearningMode is used based on original test runner code -->
    <!-- In a full Test Runner, you'd likely switch between Learning/Exam footers -->
    <cardFooterLearningMode v-if="publicationStore.publicationData?.mode !== 'exam'" :showReport="showReport"
      :submitAnswers="showReportOnSubmit" :closeReport="closeReport" :resetSelections="resetSelections"
      :revealZones="revealZones" :readOnly="localReadonly" />
    <!-- If mode is 'exam', the test runner parent component handles the footer -->
    <!-- Basic buttons for exam mode if no common footer is used -->
    <!-- Or let the parent component provide submit/reset -->
    <!-- Keeping submit/reset here for basic functionality if parent doesn't override -->
    


  </div>
</template>

<style scoped>
/* Styles combined/adapted from both components */

/* Ensure the card itself respects its max-width and contains its content */
.card {
  margin-bottom: 20px;
  width: 100%;
  /* Card takes full width of its parent */
  box-sizing: border-box;
  /* Include padding/border in width calculation */
  overflow: hidden;
  /* Crucial to hide anything overflowing the card */
  background-color: #fff;
  /* Default card background */
  border: 1px solid rgba(0, 0, 0, .125);
  /* Default card border */
  border-radius: .25rem;
  /* Default card border radius */
}

.card-preview {
  /* Add any specific styles for this card type if needed */
}


/* Ensure card-body correctly contains its children */
.card-body {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  /* Use standard bootstrap padding */
  width: 100%;
  /* Make card-body take full width of its parent */
  box-sizing: border-box;
  /* Include padding in width */
  overflow: hidden;
  /* Hide anything overflowing horizontally */
}

/* Container for Feedback messages */
.AllFeedbacks {
  margin-bottom: 1rem;
  /* Standard spacing */
}

.PositiveFeebackContainer {
  background-color: #d4edda;
  /* Light green */
  border: 1px solid #c3e6cb;
  /* Green border */
  color: #155724;
  /* Dark green text */
  padding: .75rem 1.25rem;
  /* Standard padding */
  margin-bottom: 1rem;
  border-radius: .25rem;
}

.PartialFeebackContainer {
  background-color: #fff3cd;
  /* Light yellow */
  border: 1px solid #ffeeba;
  /* Yellow border */
  color: #856404;
  /* Dark yellow text */
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: .25rem;
}

.NegativeFeebackContainer {
  background-color: #f8d7da;
  /* Light red */
  border: 1px solid #f5c6cb;
  /* Red border */
  color: #721c24;
  /* Dark red text */
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: .25rem;
}

.DefaultFeebackContainer {
  background-color: #e9ecef;
  /* Light grey */
  border: 1px solid #dee2e6;
  /* Grey border */
  color: #495057;
  /* Dark grey text */
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border-radius: .25rem;
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
  /* Make container take full width of its parent */
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
  /* Add a min-height to ensure wrapper takes some space even if Konva is not drawn yet */
  min-height: 200px;
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

.canvas-reset-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


/* Styles for other elements in card-body */
.quill-editor {
  margin-bottom: 15px;
  width: 100%;
  /* Take full width of parent (card-body) */
  max-width: 780px;
  /* Optional max-width for better text readability */
  box-sizing: border-box;
  align-self: center;
  /* Center if max-width is less than 100% */
}

.quill-editor .ql-editor {
  min-height: auto !important;
  padding: 12px 15px !important;
}

.quill-editor .ql-container {
  border: none !important;
  /* Quill border already handled by .quill-editor */
}


.hintMessage {
  border: green 1px solid;
  border-radius: 5px;
  padding: 10px;
  margin: 10px;
  background-color: rgb(222, 235, 222);
  color: #333;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: #f8f9fa;
  /* Light background for report */
  color: #333;
  /* Dark text */
  margin-top: 15px;
  /* Add spacing */
}

.ReportContainer h4 {
  color: #007bff;
  /* Highlight report title */
  margin-bottom: 15px;
}

.ReportContainer ul {
  list-style: none;
  padding: 0;
}

.ReportContainer li {
  margin-bottom: 5px;
  line-height: 1.4;
}

.ReportContainer li::before {
  content: "• ";
  color: #007bff;
  /* Bullet color */
  font-weight: bold;
  display: inline-block;
  width: 1em;
  margin-left: -1em;
}

.btn-console {
  background-color: #343a40;
  color: white;
  border: none;
  cursor: pointer;
}


/* Style for the read-only overlay */
.canvas-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  /* Semi-transparent white */
  z-index: 10;
  /* Ensure it's above Konva layers but below controls like reset button */
  cursor: not-allowed;
  /* pointer-events: all; */
  /* This was in old code, but might block controls *above* the overlay? */
  /* Let's rely on Konva listening and handler checks first. */
  /* If needed, add pointer-events: all; */
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