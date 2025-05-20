<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">

        <form @submit.prevent="saveElement">
          <div hidden class="mb-3">
            <label class="form-label">Element Label</label>
            <input type="text" class="form-control" v-model="elementLabel" @input="handleLabelChange(elementLabel)">
          </div>
          <div hidden class="mb-3">
            <label class="form-label">Element ID</label>
            <input type="text" class="form-control" v-model="selectedElement.el_ID" readonly>
          </div>
          <div hidden class="mb-3" v-show="selectedElement.isNewElement">
            <label class="form-label">Type</label>
            <input type="text" class="form-control" v-model="selectedElement.el_Type">
          </div>
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="elText" />

            </h3>
          </div>
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>

          <!-- <p>You can use both : AI or text match to correct the answer and define a score.</p> -->
          <div class="IAParams">To use AI, you must have configured an AI API. By default, the AI solution is : local AI
            based on LMstudio + API_URL = "http://localhost:1234/v1/completions" with
            the model: "deepseek-r1-distill-qwen-7b", temperature: 0.1, max_tokens: 1000. Please load the model
            first(loading could be long).
          </div>
          <div class="form-check form-switch mb-3">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="switchCheckDefault"
              v-model="AIisActivated"
            />
            <label class="form-check-label" for="switchCheckDefault">Activate AI Correction</label>
          </div>

          <!-- AI Configuration -->
          <div v-if="AIisActivated" class="AI-Preparation">
            <AICorrAxes :correctionAxes="selectedElement.correctionAxes || []"
              @update:correctionAxes="updateCorrectionAxes" />
          </div>
        </form>
      </div>
      <dimension />
      <div class="card-footer ">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" @save-element="saveElement"
          :isItemBank />
      </div>
    </div>
    <div v-else class="alert alert-info">
      <p>Select an element to edit</p>
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import AICorrAxes from '../default/AICorrAxes.vue';
import { useTestStore } from '../../../stores/testStore'
import { computed, ref, watch, onMounted } from 'vue'
import EditorActionBar from '../default/EditorActionBar.vue';
import Quill from 'quill'
import dimension from '../default/dimension.vue';

// Définir les props Pour l'adaptation de l'action bar footer au contexte : TEST or ITEM BANK
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const AIisActivated = computed({
  get() {
    return selectedElement.value?.AIisActivated ?? false;
  },
  set(newVal) {
    if (!selectedElement.value) return;
    selectedElement.value.AIisActivated = newVal;
    store.updateElement({ ...selectedElement.value });
  }
});
const store = useTestStore()
const selectedElement = computed(() => store.selectedElement)
const elementLabel = ref('')
const correctionAxes = ref([])

const quillEditor = ref(null) // Référence pour l'éditeur Quill
let quillInstance = null // Instance de Quill

// Mettre à jour les axes de correction
const updateCorrectionAxes = (newAxes) => {

  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }

  if (selectedElement.value) {
    selectedElement.value.correctionAxes = newAxes;
    store.updateElement({ ...selectedElement.value });
  }
};

watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || ''
}, { immediate: true })






// 🟢 **Ajout d'un computed property pour el_Text** 🟢
const elText = computed({
  get: () => selectedElement.value?.el_Text || '',
  set: (newValue) => {
    if (!selectedElement.value) return;

    selectedElement.value.el_Text = newValue;
    store.updateElement({ ...selectedElement.value });
  }
});

// 🟢 **Ajout d'un watch pour détecter un changement dans el_Text et mettre à jour le store** 🟢
watch(() => selectedElement.value?.el_Text, (newText) => {
  if (!selectedElement.value) return;

  store.updateElement({
    ...selectedElement.value,
    el_Text: newText
  });
});



const handleLabelChange = (newLabel) => {

  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  store.updateElementLabel(newLabel)
}

if (quillInstance && selectedElement.el_RichText) {
  quillInstance.root.innerHTML = selectedElement.el_RichText;
}

const saveElement = () => {

  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }

  if (selectedElement.value) {
    store.updateElement({
      ...selectedElement.value,
      correctionAxes: correctionAxes.value, // Inclure les axes de correction
    });
  }
};


// Initialisation de l'éditeur Quill
onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          // Styles de texte
          ['bold', 'italic', 'underline', 'strike'], // Gras, italique, souligné, barré

          // Titres
          [{ header: 1 }, { header: 2 }], // Titres niveau 1 et 2
          [{ header: [1, 2, 3, 4, 5, 6, false] }], // Menu déroulant des tailles de titre

          // Listes et indentations
          [{ list: 'ordered' }, { list: 'bullet' }], // Listes ordonnées et à puces
          [{ indent: '-1' }, { indent: '+1' }], // Indentation

          // Alignement
          [{ align: [] }], // Alignement : gauche, centre, droite, justifié

          // Couleurs
          [{ color: [] }, { background: [] }], // Couleur de texte et d'arrière-plan

          // Médias
          ['image', 'link'], // Insérer une image, un lien, ou une vidéo

          // Nettoyer la mise en forme
          ['clean'], // Bouton pour effacer le formatage
        ],
      },
    })

    // Synchroniser Quill avec les données
    if (selectedElement.value?.el_RichText) {

      quillInstance.root.innerHTML = selectedElement.value.el_RichText
    }

    quillInstance.on('text-change', () => {

      /* if (props.isItemBank) {
        alert("Voulez-vous modifier cet élément dans l'Item Bank ?");
        console.log("isItemBank is true. Skipping store.updateElement.");
        return;
      } */

      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML
        store.updateElement({ ...selectedElement.value });
      }
    })


  }
})
</script>

<style scoped>
.card-header {
  background-color: #426C9C;
  color: white
}

.sendToItemLibBT {
  margin-left: 10px;
}

.IAParams {
  font-size: 0.8rem;
  color: grey;
  padding: 5px;
  font-style: italic;
  margin-bottom: 10px;
}

/* .shortAnswerInput {
  width: 100%;
  
} */
</style>