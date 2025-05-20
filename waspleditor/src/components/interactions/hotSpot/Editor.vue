<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form @submit.prevent="saveElement">
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text" />
            </h3>
          </div>
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>
        </form>
        You can create categories to retreive using the stickers. Type 2 caracters or use an <a href="https://emojipedia.org/" target="_blank">Emojis</a> 
        <br> like these : ✅ ❌ ❎ ⭕ 🔅 🔴 🔸🔻🚀 🛸 and much more...(just copy and paste!)
        <ZoneDataTable :zones="zones" :selectedZoneId="selectedZoneId" :stickerZone="stickerZone"
          @select-zone="handleZoneSelection" />
        <div class="mb-3">
          <div class="form-floating mb-3">
            <input type="number" class="form-control" id="floatingInput"
              v-model.number="selectedElement.el_data.penalties" placeholder="Penalties">
            <label for="floatingInput">Wrong click penalties</label>
          </div>
        </div>

        <div class="canvas-toolbar">
          <div class="btn-group mb-2">
            <button class="btn btn-outline-secondary btn-sm" :class="{ active: shapeMode === 'circle' }"
              @click="handleAddZone('circle')" title="Add Circle Zone" v-html="circleShaper">
            </button>

            <button class="btn btn-outline-secondary btn-sm" :class="{ active: shapeMode === 'rect' }"
              @click="handleAddZone('rect')" title="Add Rectangle Zone" v-html="squareShaper">

            </button>

            <button class="btn btn-outline-secondary btn-sm" :class="{ active: shapeMode === 'freeform' }"
              @click="startFreeform" title="Draw Freeform Zone" v-html="freeformLogo">
            </button>

            <button class="btn btn-outline-danger btn-sm btdel" @click="deleteSelectedZone" :disabled="!selectedZoneId"
              title="Delete Selected Zone">
              🗑️
            </button>

            <button title="Zoom locker !" class="btn btn-outline-primary btn-sm" @click="toggleZoomLock">
              <span class="zoomLocker">{{ isZoomLocked() ? '🔒' : '🔓' }}</span> <span class="zoomer">🔍</span>
            </button>

            <button title="Reset zoom ratio to original size" class="btn btn-outline-primary btn-sm"
              @click="zoomRatio1_1">
              <span class="zoomLocker"><img src="../../../assets/graphicInteractions/ratio1.png"></span>
              <span class="zoomer">🔍</span>
            </button>


            <button class="BGloader" @click.prevent="triggerFileInput">
              Load background image
            </button>
            <input ref="fileInput" type="file" accept="image/*" style="display: none" @change="handleImageUpload" />

          </div>
        </div>



        <div class="canvas-wrapper">
          <div ref="canvasRef" class="konva-container"></div>
        </div>
      </div>
      <dimension />
      <div class="card-footer">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" @save-element="saveElement"
          :isItemBank="isItemBank" />
      </div>
    </div>
    <div v-else class="alert alert-info">
      Select an element to edit
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Quill from 'quill'
import Konva from 'konva'
import { useTestStore } from '../../../stores/testStore'
import cardHeader from '../default/cardHeader.vue'
import EditorActionBar from '../default/EditorActionBar.vue'
import { useKonvaCanvas } from './composables/useKonvaCanvas'
import { useZoneManager } from './composables/useZoneManager'
import freeformLogoSvg from '@/assets/graphicInteractions/freeform.svg?raw'
import circleShaperSvg from '@/assets/graphicInteractions/CircleShaper.svg?raw'
import squareShaperSvg from '@/assets/graphicInteractions/SquareShaper.svg?raw'
import ZoneDataTable from './ZoneDataTable.vue'
import { debounce } from 'lodash-es'
import dimension from '../default/dimension.vue';

const props = defineProps({
  isItemBank: { type: Boolean, default: false }
})

const freeformLogo = ref(freeformLogoSvg)
const circleShaper = ref(circleShaperSvg)
const squareShaper = ref(squareShaperSvg)

const store = useTestStore()
const selectedElement = computed(() => store.selectedElement)
const elementLabel = ref('')
const canvasRef = ref(null)
const quillEditor = ref(null)
let quillInstance = null
const shapeMode = ref(null)
const selectedZoneId = ref(null)
const stickerZone = ref(null);
const zones = ref([])

// ✅ Déclaration AVANT l'appel à useKonvaCanvas
const localSaveElement = () => {
  if (!selectedElement.value) return;

  // Sécurisation : s'assurer que zones.value est bien un tableau
  const zoneArray = Array.isArray(zones.value) ? zones.value : [];

  // Nettoyage des zones pour ne garder que les propriétés utiles
  const cleanZones = zoneArray.map(zone => ({
    ...zone,
    message: undefined, // on supprime le champ message s’il existe
    name: zone.name || '', // nom par défaut vide si absent
    score: zone.score ?? 0, // score 0 par défaut
  }));

  // Affectation au bon champ dans l'élément sélectionné
  selectedElement.value.el_Data = JSON.parse(JSON.stringify(cleanZones)); // deep clone pour éviter les effets de bord
  selectedElement.value.el_data.stickerZoneId = stickerZone.value?.id || null;

  // Mise à jour dans le store (Pinia)
  store.updateElement({ ...selectedElement.value });
}



const saveElement = localSaveElement;

const {
  stage,
  zoneLayer,
  initStage,
  drawExistingZones,
  deleteSelectedZone,
  registerDrawZone,
  setBackgroundImage,
  isZoomLocked,
  toggleZoomLock,
  clearSelection
} = useKonvaCanvas(canvasRef, selectedElement, selectedZoneId, zones, localSaveElement)

const fileInput = ref(null)

function triggerFileInput() {
  if (fileInput.value) fileInput.value.click()
}

async function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('http://localhost:4000/api/media/upload', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Erreur HTTP ${res.status}`);
    }

    const data = await res.json();
    // Assurez-vous que le chemin est correct
    const relativePath = data.url;
    console.log("Chemin relatif reçu de l'API:", relativePath);

    // Ne plus utiliser FileReader, mais plutôt l'URL complète
    const fullImageUrl = `http://localhost:4000${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
    console.log("URL complète pour l'affichage:", fullImageUrl);

    // Pour l'affichage immédiat, utilisons l'URL complète
    // Mais stockons le chemin relatif pour la sauvegarde
    setBackgroundImage(fullImageUrl, relativePath);

    // Réinitialiser l'input file pour permettre de sélectionner à nouveau le même fichier
    fileInput.value.value = '';
  } catch (error) {
    console.error("Erreur lors du téléchargement de l'image:", error);
    alert("Erreur lors du téléchargement de l'image.");
  }
}

const {
  drawZone,
  drawNewZone,
  addZone,
  startFreeform
} = useZoneManager(stage, zoneLayer, selectedZoneId, localSaveElement, zones, stickerZone)

registerDrawZone(drawZone)

function handleAddZone(type) {
  shapeMode.value = type;
  canvasRef.value.style.cursor = 'crosshair'; // curseur spécial
}

function handleCanvasClick(event) {
  if (!shapeMode.value) return;

  const stageEl = stage.value;
  const pointer = stageEl?.getPointerPosition();
  if (!pointer) return;

  const newId = drawNewZone(shapeMode.value, pointer.x, pointer.y);
  if (!newId) return;

  handleZoneSelection(newId); // transformer actif direct
  localSaveElement();

  shapeMode.value = null;
  canvasRef.value.style.cursor = 'default';
}





function zoomRatio1_1() {
  if (!stage.value) return
  stage.value.to({
    scaleX: 1,
    scaleY: 1,
    x: 0,
    y: 0,
    duration: 0.3,
    easing: Konva.Easings.EaseInOut
  })
}

function updateMaxScore() {
  const el = selectedElement.value;
  if (!el || !Array.isArray(el.el_Data)) {
    el.maxScore = 0;
    return;
  }
  const total = el.el_Data.reduce((sum, z) => sum + (Number(z.score) || 0), 0);
  el.maxScore = total;
}

function handleZoneSelection(zoneId) {
  const shape = zoneLayer.value.findOne(`#${zoneId}`)
  if (!shape) return
  selectedZoneId.value = zoneId
  clearSelection()
  zoneLayer.value.find('Transformer').forEach(tr => tr.destroy())

  const tr = new Konva.Transformer({
    node: shape,
    enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
    boundBoxFunc: (oldBox, newBox) => {
      return (newBox.width < 10 || newBox.height < 10) ? oldBox : newBox
    }
  })

  zoneLayer.value.add(tr)
  zoneLayer.value.draw()
}

const debouncedSave = debounce(() => {
  localSaveElement()
  updateMaxScore()
}, 500)

watch(zones, () => {
  updateMaxScore()
  debouncedSave()
}, { deep: true })

watch(() => store.selectedElementLabel, newLabel => {
  elementLabel.value = newLabel || ''
}, { immediate: true })

watch([selectedElement, stage, zoneLayer], ([el, stageReady, layerReady]) => {
  if (el?.el_Data && stageReady && layerReady) {
    zones.value = JSON.parse(JSON.stringify(el.el_Data));
    if (Array.isArray(el?.el_Data)) {
      zones.value = JSON.parse(JSON.stringify(el.el_Data));
      drawExistingZones(zones.value);
    } else {
      zones.value = [];
    }
    stickerZone.value = el.el_data?.stickerZoneId
      ? zones.value.find(z => z.id === el.el_data.stickerZoneId)
      : null;
  }
}, { immediate: true });


watch(selectedElement, el => {
  if (el && !el.el_data) el.el_data = {};
}, { immediate: true })

function handleKeyDown(event) {
  if (event.key === 'Delete' && selectedZoneId.value && stickerZone.value) {
    deleteSelectedZone()
  }
}

onMounted(async () => {

  canvasRef.value.addEventListener('click', handleCanvasClick);

  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ header: 1 }, { header: 2 }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          [{ color: [] }, { background: [] }],
          ['image', 'link'],
          ['clean']
        ]
      }
    })
    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText
    }
    quillInstance.on('text-change', () => {
      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML
        if (!props.isItemBank) store.updateElement({ ...selectedElement.value })
      }
    })

    canvasRef.value?.addEventListener('click', handleCanvasClick);


  }

  window.addEventListener('keydown', handleKeyDown)

  await initStage()

  if (!selectedElement.value.el_data) selectedElement.value.el_data = {}
  selectedElement.value.el_data.penalties ??= 0

  if (selectedElement.value?.el_Data) {
    zones.value = JSON.parse(JSON.stringify(selectedElement.value.el_Data))
    drawExistingZones(zones.value)
  }

  if (selectedElement.value.el_data?.penalties !== undefined) {
    selectedElement.value.el_Penalties = selectedElement.value.el_data.penalties;
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  canvasRef.value?.removeEventListener('click', handleCanvasClick);
})
</script>


<style scoped>
.canvas-toolbar .btn.active {
  background-color: #0d6efd;
  color: white;
}

.canvas-toolbar svg {
  margin-right: 4px;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.inputMainPrompt {
  width: 100%;
  padding: 8px;
  font-size: 16px;
}

.quill-editor {
  min-height: 150px;
  border: 1px solid #ccc;
  padding: 10px;
}

.canvas-wrapper {
  width: 100%;
  border: 1px dashed #999;
  margin-top: 10px;
  overflow: auto;
}

.konva-container {
  display: inline-block;
}

.BGloader {
  background-color: white;
  border: 2px solid #ccc;
  color: black;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
}

.BGloader:hover {
  background-color: #a8bcf5;
  border-color: #3b4083;
  color: white;
}

.canvas-toolbar button svg {
  width: 30px;
  height: 30px;
  display: inline-block;
  vertical-align: middle;
}

.zoomer {
  top: 0px;
  right: 0px;
  z-index: 0;
  font-size: 30px;
}

.zoomLocker {
  position: absolute;
  top: 5px;
  right: 30px;
  z-index: 10;

}
</style>