<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader 
        :elementLabel="elementLabel" 
        :elementType="selectedElement.el_Type" 
        :mode="'Preview'"
      />
      <div class="card-body">

        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div class="quill-editor" ref="quillEditor"></div>

      </div>
      <div class="card-footer" style="text-align: right;">
        <button class="btn btn-primary btn-sm">Submit</button>
        <button style="margin-left: 10px;" class="btn btn-secondary btn-sm">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore'
import { computed, ref, onMounted, watch } from 'vue';
import Quill from 'quill'

const store = useTestStore()

const quillEditor = ref(null); // Référence pour le conteneur HTML de Quill
let quillInstance = null; // Instance de Quill

const selectedElement = computed(() => store.selectedElement)
const elementLabel = computed(() => store.selectedElementLabel)

// Ajuster dynamiquement la hauteur du conteneur Quill
const adjustQuillHeight = () => {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight; // Hauteur réelle du contenu
    quillEditor.value.style.overflow = 'hidden'; // Supprime les barres de défilement
  }
};

// Initialisation de Quill
onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: {
        toolbar: false,
      },
    });

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    adjustQuillHeight(); // Ajuste la hauteur après l'initialisation
  }
});


// Observer uniquement el_RichText pour les mises à jour en temps réel
watch(
  () => selectedElement.value?.el_RichText,
  (newValue) => {
    if (quillInstance && newValue !== quillInstance.root.innerHTML) {
      quillInstance.root.innerHTML = newValue || ''; // Met à jour le contenu
      adjustQuillHeight(); // Ajuste la hauteur
    }
  }
);
</script>

<style scoped>
.card-header {
  background-color: #426C9C;
  color: white
};
.quill-editor {
  min-height: max-content!important;
  height:auto!important;
  border: 1px solid #ccc;
  overflow: hidden !important;
  transition: height 0.3s ease;
}
</style>