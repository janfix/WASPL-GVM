<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <!-- Utilisation du composant PreviewHeader -->
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
              <input  @input="updateText" placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text" />
            </h3>
          </div>
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>

          <div class="mb-3">
            <label class="form-label">Enter labels in the correct order:</label>
            <div v-for="(label, index) in selectedElement.labels" :key="index" class="input-group mb-2">
              <input type="text" class="form-control" v-model="selectedElement.labels[index]"
                placeholder="Label text" />
              <button type="button" class="btn btn-danger btn-sm" @click="removeLabel(index)">
                ✖
              </button>
            </div>
            <button type="button" class="btn btn-primary btn-sm" @click="addLabel">
              ➕ Add Label
            </button>
          </div>

          <div class="form-floating feedback mt-4">
            <input Title="Positive feedback" placeholder="Positive feedback" type="text" name="positiveFeedback"
              id="positiveFeedback" class="form-control" v-model="selectedElement.feedback.correct" />
            <label class="ml-2" for="positiveFeedback">Positive feedback</label>
          </div>
          <div class="form-floating feedback mt-4">
            <input title="Negative feedback" placeholder="Negative feedback" type="text" name="negativeFeedback"
              id="negativeFeedback" class="form-control" v-model="selectedElement.feedback.incorrect" />
            <label class="ml-2" for="negativeFeedback">Negative feedback</label>
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
      Select an element to edit
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore'
import { computed, ref, watch, onMounted } from 'vue'
import Quill from 'quill'
import EditorActionBar from '../default/EditorActionBar.vue';
import dimension from '../default/dimension.vue';

// Définir les props Pour l'adaptation de l'action bar footer au contexte : TEST or ITEM BANK
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});

const store = useTestStore()

/* const saveTest = () => {
  store.saveTestData();
}; */

const selectedElement = computed(() => store.selectedElement)
const elementLabel = ref('')
const quillEditor = ref(null) // Référence pour l'éditeur Quill
let quillInstance = null // Instance de Quill

watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || ''
}, { immediate: true })

const handleLabelChange = (newLabel) => {
 /*  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  } */
  store.updateElementLabel(newLabel)
}

if (quillInstance && selectedElement.el_RichText) {
  quillInstance.root.innerHTML = selectedElement.el_RichText;
}

const updateText = () => {
  if (props.isItemBank) return;
  store.updateElement({ ...selectedElement.value });
}


const saveElement = () => {
 /*  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  } */
  if (selectedElement.value) {
    store.updateElement(selectedElement.value)
  }
}

const addLabel = () => {
  selectedElement.value.labels.push('');
  if (props.isItemBank) {
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  store.updateElement(selectedElement.value);
};

const removeLabel = (index) => {
  selectedElement.value.labels.splice(index, 1);
  store.updateElement(selectedElement.value);
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
      if (selectedElement.value) {
        if (props.isItemBank) {
          console.log("isItemBank is true. Skipping store.updateElement.");
          return;
        }
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
</style>