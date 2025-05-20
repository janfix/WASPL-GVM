<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form @submit.prevent>
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text" />
            </h3>
          </div>

          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>

          <div class="pair-editor">
            <h5>Pair definition :</h5>
            <div v-for="(pair, index) in interactionData.expectedPairs" :key="index" class="pair-row">
              <input v-model="pair.left" placeholder="Write here your left pair" class="form-control me-2" @input="triggerUpdate" />
              <span>⇄</span>
              <input v-model="pair.right" placeholder="Write here your right pair" class="form-control ms-2 me-2" @input="triggerUpdate" />
              <button @click.prevent="removePair(index)" class="btn btn-outline-danger btn-sm">🗑️</button>
            </div>

            <button @click.prevent="addPair" class="btn btn-outline-success mt-3">➕ Add a new pair</button>

            <div class="mt-4">
              <label for="pointsInput" class="form-label">Points par paire correcte :</label>
              <input id="pointsInput" type="number" v-model.number="interactionData.pointsPerPair" @input="triggerUpdate" class="form-control" min="0" />
            </div>
          </div>
        </form>
      </div>
      <dimension />
      <div class="card-footer">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" @save-element="saveElement" :isItemBank="isItemBank" />
      </div>
    </div>
    <div v-else class="alert alert-info">Select an element to edit</div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import EditorActionBar from '../default/EditorActionBar.vue';
import { useTestStore } from '../../../stores/testStore';
import { ref, computed, watch, onMounted } from 'vue';
import Quill from 'quill';
import dimension from '../default/dimension.vue';

const props = defineProps({
  isItemBank: { type: Boolean, default: false }
});

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);
const elementLabel = ref('');
const quillEditor = ref(null);
let quillInstance = null;

const interactionData = computed(() => {
  if (!selectedElement.value.el_InteractionData) {
    selectedElement.value.el_InteractionData = {
      expectedPairs: [],
      pointsPerPair: 1
    };
  }
  return selectedElement.value.el_InteractionData;
});

function addPair() {
  interactionData.value.expectedPairs.push({ left: '', right: '' });
  triggerUpdate();
}

function removePair(index) {
  interactionData.value.expectedPairs.splice(index, 1);
  triggerUpdate();
}

function triggerUpdate() {
  if (!props.isItemBank) {
    store.updateElement({ ...selectedElement.value });
  }
}

const saveElement = () => {
  if (!props.isItemBank) {
    store.updateElement({ ...selectedElement.value });
  }
};

function updateMaxScore() {
  if (!selectedElement.value) return;
  const nbPairs = interactionData.value.expectedPairs.length;
  const points = interactionData.value.pointsPerPair || 0;
  selectedElement.value.maxScore = nbPairs * points;
  triggerUpdate(); // Met à jour le store si hors ItemBank
}

// Watch sur la liste des paires (ajout/suppression/modif)
watch(() => interactionData.value.expectedPairs, updateMaxScore, { deep: true });

// Watch sur le nombre de points par paire
watch(() => interactionData.value.pointsPerPair, updateMaxScore);

watch(() => selectedElement.value?.el_Text, (newText) => {
  if (newText !== undefined && !props.isItemBank) {
    store.updateElement({ ...selectedElement.value });
  }
});

watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || '';
}, { immediate: true });

onMounted(() => {
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
    });

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    quillInstance.on('text-change', () => {
      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML;
        if (!props.isItemBank) {
          store.updateElement({ ...selectedElement.value });
        }
      }
    });
  }
});
</script>

<style scoped>
.pair-row {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
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
.pair-editor {
  margin-top: 1rem;
}
</style>