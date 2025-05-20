<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <b>NO-EDITOR WAY to code a new interaction !</b>
        <hr>
        <p>Just code your interaction in the Preview. This is only for experimentation dev. The idea is to create a new interaction and have a static preview.</p>
        <p>Why using the no-editor mode ? Because the interaction has no need to be modified once it has been created. It is too specific.</p>
        <p>This is not a limitation to have specific function and randomized values in your static interaction. 
          The item variation can be included in the preview code</p>
      </div>
      <dimension />
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
import dimension from '../default/dimension.vue';

// Props pour ajuster l'interface selon le contexte (Test ou Item Bank)
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);
const elementLabel = ref('');
const quillEditor = ref(null); // Référence pour l'éditeur Quill
let quillInstance = null; // Instance de Quill

const saveElement = () => {
  console.warn('⚠️ saveElement not implemented yet.');
};
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
