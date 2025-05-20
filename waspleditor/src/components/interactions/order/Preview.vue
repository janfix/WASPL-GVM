<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <!-- Utilisation du composant PreviewHeader -->
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
        <div class="AllFeedbacks" v-if="showReport">
          <div v-if="results.score == selectedElement.maxScore && selectedElement.feedback.correct"
            class="PositiveFeebackContainer">
            {{ selectedElement.feedback.correct }}
          </div>
          <div v-else-if="results.score < selectedElement.maxScore && selectedElement.feedback.incorrect"
            class="NegativeFeebackContainer">
            {{ selectedElement.feedback.incorrect }}
          </div>
        </div>

        <div class="mt-4">
          <draggable 
            v-model="shuffledLabels" 
            tag="ol" 
            group="labels" 
            @end="onDragEnd" 
            itemKey="id"
            :class="['sortable-zone', {  flash: flashEffect }]"
            handle=".drag-handle">
            <template #item="{ element, index }">
              <li :key="element.id" class="label-item d-flex justify-content-between align-items-center">
                <span class="drag-handle" title="Move the proposition">☰</span>
                <input disabled type="text" v-model="shuffledLabels[index].text"
                  class="form-control me-2 flex-grow-1" />
                <span class="drag-handle" title="Move the proposition">☰</span>
              </li>
            </template>
          </draggable>
        </div>
        <div class="VorderContainer">
          <button @click="handleValidateClick()">Validate Order</button>
        </div>

        <div class="ReportContainer" v-if="showReport">
          <div class="row">
            <div class="col">
              <h5>Results:</h5>
            </div>
            <div class="col" style="text-align: right;">
              <strong>Date:</strong> {{ currentDate }}
            </div>

            <hr>
            <p><strong>Your Answers:</strong> {{ results.content }}</p>
            <p><strong>Max-Score:</strong> {{ selectedElement.maxScore }} </p>
            <p><strong>Score:</strong> {{ results.score }}</p>
            <p><strong>Penalties:</strong> {{ results.error }}</p>
          </div>
        </div>
      </div>
      <div class="card-footer" style="text-align: right;">
        <button class="btn btn-primary btn-sm" @click="submitAnswers">Submit</button>
        <button class="btn btn-console btn-sm ml-2" @click="closeReport" v-if="showReport">Close Report</button>
        <button class="btn btn-secondary btn-sm" @click="resetLabels" style="margin-left: 10px;">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore';
import { ref, computed, onMounted, watch } from 'vue';
import draggable from 'vuedraggable';
import Quill from 'quill'

const store = useTestStore();

const selectedElement = computed(() => store.selectedElement);
const elementLabel = computed(() => store.selectedElementLabel);

const shuffledLabels = ref([]);
const quillEditor = ref(null);
let quillInstance = null;
const showReport = ref(false);

const flashEffect = ref(false);

const handleValidateClick = () => {
  flashEffect.value = true;
 
  setTimeout(() => {
    flashEffect.value = false;
  }, 500); // durée du flash
};

const results = ref({
  score: 0,
  error: 0,
  content: '',
});

const currentDate = computed(() => {
  const now = new Date();
  return now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
});

// Mélanger les étiquettes
const shuffleArray = (array) => {
  return array
    .map((item) => ({ id: Math.random().toString(36).substr(2, 9), text: item }))
    .sort(() => Math.random() - 0.5);
};

const initializeLabels = () => {
  if (selectedElement.value?.labels) {
    shuffledLabels.value = shuffleArray(selectedElement.value.labels);
  }
};

// Synchroniser les modifications des labels avec le store
const updateLabel = (index) => {
  const updatedLabels = shuffledLabels.value.map((label) => label.text);
  store.updateElement({
    ...selectedElement.value,
    labels: updatedLabels,
  });
};

// Observer les modifications dans le store
watch(
  () => selectedElement.value.labels,
  (newLabels) => {
    if (newLabels) {
      initializeLabels();
    }
  },
  { deep: true }
);
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
  }
  initializeLabels();
});

const submitAnswers = () => {
  if (!selectedElement.value) return;

  // Normalize both arrays to simple string arrays
  const correctOrder = selectedElement.value.labels.map(label => 
    typeof label === 'string' ? label : label.text
  );

 
  
  const studentOrder = shuffledLabels.value.map(label => label.text);

  console.log("Correct Order:", correctOrder);
  console.log("Student Order:", studentOrder);

  results.value.content = studentOrder;
  console.log(selectedElement.value.weight)
  
  // Compare normalized arrays
  results.value.score = correctOrder.every((label, index) => label === studentOrder[index])
    ? 1
    : 0;
  
  results.value.error = results.value.score === 0 ? 1 : 0;
  console.log(results)

  showReport.value = true;
};

const resetLabels = () => {
  initializeLabels();
  showReport.value = false;
};

const closeReport = () => {
  showReport.value = false;
};

const onDragEnd = () => {
  // Synchronisation après drag-and-drop
  updateLabel();
};

// Ajuster dynamiquement la hauteur du conteneur Quill
const adjustQuillHeight = () => {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight; // Hauteur réelle du contenu
    quillEditor.value.style.overflow = 'hidden'; // Supprime les barres de défilement
  }
};
</script>

<style scoped>
.label-item {
  padding: 5px;
  
  border: 1px solid #ccc;
  margin-bottom: 5px;
  background-color: #f9f9f9;
  cursor: move;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 20px;
}

.loading-gif {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
}



.card-header {
  background-color: #426C9C;
  color: white
}

.ql-container.ql-snow {
  border: none !important;
}

.quill-editor {
  min-height: max-content !important;
  height: auto !important;
  border: 0 !important;
  /*  border: 1px solid #ccc;
  border-radius: 5px; */
  overflow: hidden !important;
  transition: height 0.3s ease;
}

.basicInput {
  border: 1px gainsboro solid;
  border-radius: 5px;
  padding: 5px;
}

.shortAnswerInput {
  width: 100%;
  min-height: 200px;
}

.PositiveFeebackContainer {
  background-color: rgb(222, 246, 224);
  margin: 10px;
  padding: 10px;
  border: 1px green dotted;
  border-radius: 5px;
  ;

}

.NegativeFeebackContainer {
  background-color: rgb(246, 234, 235);
  margin: 10px;
  padding: 10px;
  border: 1px rgb(253, 97, 206) dotted;
  border-radius: 5px;
  ;

}

.badgeTypePosition {
  text-align: right;
}

.preview-section input[type="text"] {
  cursor:move
}

.VorderContainer {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.VorderContainer button {
  border: 1px grey solid;
  border-radius: 5px;
  padding:10px;
 background-color: #F9F9F9;
 font-weight: bold;
}

.VorderContainer button:hover {
  background-color: grey;
  color: white;
 
}

.drag-handle {
  cursor: grab;
  font-size: 1.2rem;
  color: #888;
  padding: 0 8px;
  user-select: none;
}
.drag-handle:hover {
  color: #000;
}

.sortable-zone {
  transition: background-color 0.3s ease;
}

.flash {
  background-color: rgba(173, 216, 230, 0.4); /* bleu clair temporaire */
}

.flash input {
  font-weight: bold;
}

.btn-console{
      background-color: rgb(78 54 54);
    color: white;
}
</style>
