<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form @submit.prevent="saveElement">
          <div class="mb-3">
            <h3>
              <input 
                placeholder="Main prompt" 
                type="text" 
                class="inputMainPrompt" 
                v-model="selectedElement.el_Text" 
              />
            </h3>
          </div>
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>
        </form>
      </div>
      <div class="card-footer">
        <EditorActionBar 
          :selectedElement="selectedElement" 
          :elementLabel="elementLabel" 
          @save-element="saveElement"
          :isItemBank="isItemBank"
        />
      </div>
    </div>
    <div v-else class="alert alert-info">
      Select an element to edit
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import EditorActionBar from '../default/EditorActionBar.vue';
import { useTestStore } from '../../../stores/testStore'
import { computed, ref, watch, onMounted } from 'vue'
import Quill from 'quill'

// Props pour ajuster l'interface selon le contexte (Test ou Item Bank)
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const saveElement = () => {
  console.warn('⚠️ saveElement not implemented yet.');
};

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);
const elementLabel = ref('');
const quillEditor = ref(null); // Référence pour l'éditeur Quill
let quillInstance = null; // Instance de Quill


// Synchronize label

watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || ''
}, { immediate: true })

// Mise à jour automatique du store lorsque el_Text est modifié
watch(() => selectedElement.value?.el_Text, (newText) => {
  if (newText !== undefined && !props.isItemBank) {
    store.updateElement({ ...selectedElement.value });
  }
});

// Initialisation et mise à jour automatique du RichText
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
          ['clean'],
        ],
      },
    });

    // Initialiser le contenu de Quill
    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    // Détecter les modifications et sauvegarder automatiquement
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
</style>
