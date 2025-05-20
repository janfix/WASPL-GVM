<template>
  <div class="preview-section">
    <hr>
    <div v-if="selectedElement" class="card">
      <!-- Utilisation du composant PreviewHeader -->
      <cardHeader :numOrder="getQuestionNumber() === 'N/A' ? numOrder : getQuestionNumber()"
        :elementType="selectedElement.el_Type" :mode="'Preview'" />

      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div class="quill-editor" ref="quillEditor"></div>

        <div class="AllFeedbacks" v-if="showReport">
          <div v-if="results.score === selectedElement.maxScore && selectedElement.feedback.correct"
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
            :disabled="props.readOnly" 
            :class="['sortable-zone', { 'readonly-mode': props.readOnly, flash: flashEffect }]"
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
            <p hidden><strong>The Right order:</strong>
            <div>{{ selectedElement.labels }}</div>
            </p>
            <p><strong>Your Answers:</strong> {{ results.content }}</p>
            <p><strong>Max-Score:</strong> {{ selectedElement.maxScore }} </p>
            <p><strong>Score:</strong> {{ results.score }}</p>

          </div>
        </div>
      </div>

      <cardFooterLearningMode v-if="(publicationStore.publicationData?.mode) !== 'exam'" :showReport="showReport"
        :submitAnswers="() => submitAnswers(true)" :closeReport="closeReport" :resetSelections="resetLabels" />
    </div>
  </div>
</template>

<script setup>
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore'
import cardHeader from './cardHeader.vue';
import { ref, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import Quill from 'quill';
import cardFooterLearningMode from './cardFooterLearningMode.vue';

const publicationStore = usePublicationStore()
defineEmits(['interaction-started'])
const props = defineProps({
  question: {
    type: Object,
    required: true,
  },
  testData: {
    type: Object,
    required: true,
  },
  numOrder: [Number, null],

  questionIndexMap: {
    type: Object,
    required: false
  },
  readOnly: { type: Boolean, default: false },
});

const selectedElement = computed(() => props.question);
const responsesStore = useResponsesStore();
const shuffledLabels = ref([]);
const quillEditor = ref(null);
let quillInstance = null;
const showReport = ref(false);
const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;

const orderedLabels = ref([]);

const flashEffect = ref(false);

const handleValidateClick = () => {
  flashEffect.value = true;
  submitAnswers(false);

  setTimeout(() => {
    flashEffect.value = false;
  }, 500); // durée du flash
};

// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
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
  const savedResponse = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);

  if (savedResponse && savedResponse.labelsOrder && savedResponse.labelsOrder.length) {
    console.log('✅ Restaurer ordre depuis Pinia:', savedResponse.labelsOrder);
    shuffledLabels.value = savedResponse.labelsOrder.map((labelText) => ({
      id: Math.random().toString(36).substr(2, 9),
      text: labelText,
    }));
  } else {
    console.log('🔀 Aucun ordre enregistré, on mélange');
    if (selectedElement.value?.labels) {
      const initialOrder = selectedElement.value.labels.map(text => ({
        id: Math.random().toString(36).substr(2, 9),
        text
      })).sort(() => Math.random() - 0.5);

      shuffledLabels.value = initialOrder;

      // Sauvegarde immédiate comme réponse par défaut
      const response = {
        userId: userId,
        questionId: selectedElement.value.el_ID,
        questionLabel: selectedElement.value.el_Text,
        type: selectedElement.value.el_Type,
        labelsOrder: initialOrder.map(label => label.text),
        timestamp: new Date().toISOString(),
        answered: true,
        score: 0, // on laisse à 0 par défaut ici
        maxScore: selectedElement.value.maxScore
      };

      responsesStore.saveResponse(response);
      console.log('💾 Ordre initial enregistré comme réponse par défaut');
    }
  }
};


onMounted(() => {
  initializeLabels();

  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false },
    });

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }
  }
});


// Calculer le score et sauvegarder
const submitAnswers = (showR = false) => {
  const correctOrder = selectedElement.value.labels;
  const studentOrder = shuffledLabels.value.map(label => label.text); // Liste complète

  results.value.content = [...studentOrder]; // Sauvegarde complète de l'ordre actuel

  const isCorrect =
    studentOrder.length === correctOrder.length &&
    studentOrder.every((label, index) => label === correctOrder[index]);

  results.value.score = isCorrect ? selectedElement.value.maxScore : 0;
  results.value.error = isCorrect ? 0 : 1;


  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    questionLabel: selectedElement.value.el_Text,
    type: selectedElement.value.el_Type,
    labelsOrder: [...studentOrder], // Liste complète garantie
    timestamp: new Date().toISOString(),
    answered: true,
    score: results.value.score || 0,
    maxScore: selectedElement.value.maxScore
  };

  responsesStore.saveResponse(response);
  showReport.value = showR;
};


const resetLabels = () => {
  initializeLabels(); // Réinitialiser à un ordre aléatoire
  showReport.value = false;

  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    labelsOrder: [],
    timestamp: new Date().toISOString(),
    answered: false,
  };

  responsesStore.saveResponse(response);
};

const closeReport = () => {
  showReport.value = false;
};

const onDragEnd = () => {
  const studentOrder = shuffledLabels.value.map(label => label.text);

  const response = {
    userId: userId,
    questionLabel: selectedElement.value.el_Text,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    labelsOrder: [...studentOrder], // Toujours inclure l'ensemble des positions
    score: results.value.score || 0,
    timestamp: new Date().toISOString(),
    answered: true,
  };

  responsesStore.saveResponse(response);
  console.log('Updated labels after drag-and-drop:', studentOrder);
};



function decodeToken(token) {
  if (!token) {
    return null;
  }
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
</script>

<style scoped>
.label-item {
  padding: 5px;
  border: 1px solid #ccc;
  margin-bottom: 5px;
  background-color: #f9f9f9;
  cursor: move;
}

.PositiveFeebackContainer {
  background-color: rgb(222, 246, 224);
  margin: 10px;
  padding: 10px;
  border: 1px green dotted;
  border-radius: 5px;
}

.NegativeFeebackContainer {
  background-color: rgb(246, 234, 235);
  margin: 10px;
  padding: 10px;
  border: 1px rgb(253, 97, 206) dotted;
  border-radius: 5px;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
}

.readonly-mode {
  opacity: 0.6;
  pointer-events: none;
}

.readonly-mode .label-item {
  cursor: not-allowed;
}

.VorderContainer {
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
}

.VorderContainer button {
  border: 1px grey solid;
  border-radius: 5px;

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

</style>