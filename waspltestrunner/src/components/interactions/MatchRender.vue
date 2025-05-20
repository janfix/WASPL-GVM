<template>
  <div class="preview-section">
    <div v-if="selectedElement" :class="['card', 'card-preview', { 'readonly-mode': readOnly }]">
      <cardHeader :numOrder="getQuestionNumber() === 'N/A' ? numOrder : getQuestionNumber()"
        :elementType="selectedElement.el_Type" mode="Preview" />

      <div class="card-body">
        <div class="mb-2">

          <div class="AllFeedbacks" v-if="showReport">
            <div v-if="isMatrixCorrect() && selectedElement.feedback?.correct" class="PositiveFeebackContainer">
              {{ selectedElement.feedback.correct }}
            </div>
            <div v-else-if="!isMatrixCorrect() && selectedElement.feedback?.incorrect" class="NegativeFeebackContainer">
              {{ selectedElement.feedback.incorrect }}
            </div>
          </div>


          <h3>{{ selectedElement.el_Text }}</h3>
        </div>

        <div class="quill-editor" ref="quillEditor"></div>

        <div class="mt-3 table-responsive">
          <table class="table table-bordered text-center small align-middle">
            <thead>
              <tr>
                <th></th>
                <th v-for="(col, cIndex) in data.columns" :key="'col-' + cIndex">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIndex) in data.rows" :key="'row-' + rIndex">
                <td class="text-start">{{ row }}</td>
                <td v-for="(col, cIndex) in data.columns" :key="'cell-' + rIndex + '-' + cIndex">
                  <input 
                    type="checkbox" 
                    v-model="userMatrix[rIndex][cIndex]" 
                    @change="emitAnswer"
                    :disabled="showReport || readOnly" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ✅ Zone de report -->
        <div v-if="showReport" class="ReportContainer mt-4">
          <h5>Résultats :</h5>
          <ul class="mb-2">
            <li v-for="(rowLabel, rIndex) in data.rows" :key="'report-row-' + rIndex">
              <strong>{{ rowLabel }}</strong> ⇨
              <span v-for="(col, cIndex) in data.columns" :key="'mark-' + rIndex + '-' + cIndex" class="mx-1">
                <span>{{ col }}</span>
                <span v-if="userMatrix[rIndex][cIndex]">
                  <span v-if="isCorrect(rIndex, cIndex)">✅</span>
                  <span v-else>❌</span>
                </span>
              </span>
            </li>
          </ul>
          <div class="mt-2">
            <strong>Score :</strong> {{ score }} / {{ maxScore }} points
            ({{ ((score / maxScore) * 100).toFixed(0) }}%)
          </div>
          <div class="mt-1">
            <strong>Penalties :</strong> {{ penalties }}
          </div>
          <div class="mt-2">
            <strong>Result :</strong>
            <span v-if="isMatrixCorrect()">✅ Correct</span>
            <span v-else>❌ Incorrect</span>
          </div>
        </div>
      </div>

      <cardFooterLearningMode 
        v-if="(publicationStore.publicationData?.mode) !== 'exam'"
        :showReport="showReport" 
        :submitAnswers="showReportOnSubmit" 
        :closeReport="closeReport"
        :resetSelections="resetSelections" />
    </div>

  </div>
</template>


<script setup>
import cardHeader from './cardHeader.vue'
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore';
import cardFooterLearningMode from './cardFooterLearningMode.vue';
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Quill from 'quill'

const emit = defineEmits(['interaction-started','update'])
const publicationStore = usePublicationStore()
const restoredMatch = ref(null);
const responsesStore = useResponsesStore();
const token = localStorage.getItem('token');
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;


function decodeToken(token) {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
}



const { question, testData, numOrder, questionIndexMap, restoredAnswer,readOnly } = defineProps({
  question: { type: Object, required: true },
  testData: { type: Object, required: true },
  numOrder: [Number, null],
  questionIndexMap: { type: Object, required: false },
  restoredAnswer: { type: [String, Array, null], default: null },
  readOnly: { type: Boolean, default: false }
});

const selectedElement = computed(() => question);

const store = usePublicationStore()




const elementLabel = computed(() => store.selectedElementLabel)

const quillEditor = ref(null)
let quillInstance = null

const data = computed(() => selectedElement.value?.el_Data || {
  rows: [],
  columns: [],
  solutionMatrix: []
})

// ✅ userMatrix : réponses de l'élève
const userMatrix = ref([])
const penalties = ref(0)
const showReport = ref(false)
const score = ref(0)
const maxScore = computed(() => {
  const matrix = data.value.solutionMatrix || []
  return matrix.flat().filter(cell => cell).length * (data.value.scoring?.right || 1)
})


function showReportOnSubmit() {
  submitAnswer();
}

function resetSelections() {
  resetAnswer();
}

// Comparer chaque case
function isCorrect(rIndex, cIndex) {
  const correct = data.value.solutionMatrix?.[rIndex]?.[cIndex]
  const answer = userMatrix.value?.[rIndex]?.[cIndex]
  return correct === answer
}

// Calcul du score
function calculateScore() {
  const rightWeight = data.value.scoring?.right || 1
  const wrongPenalty = data.value.scoring?.wrong || 0

  let totalScore = 0
  let totalPenalty = 0

  userMatrix.value.forEach((row, rIndex) => {
    row.forEach((checked, cIndex) => {
      const correct = data.value.solutionMatrix?.[rIndex]?.[cIndex]
      if (checked && correct) {
        totalScore += rightWeight
      } else if (checked && !correct) {
        totalPenalty += wrongPenalty
      }
    })
  })

  score.value = totalScore
  penalties.value = totalPenalty
}

function autoSaveAnswer() {
  calculateScore();

  const response = {
    userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    userMatrix: userMatrix.value,
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore.value,
    score: score.value,
    penalties: penalties.value
  };

  responsesStore.saveResponse(response);

  if (testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', userId);
  }

  console.log("💾 Auto-save réponse (exam mode)", response);
}



function resetAnswer() {
  userMatrix.value = data.value.rows.map(() => data.value.columns.map(() => false));
  showReport.value = false;
  score.value = 0;
  penalties.value = 0;
  emitAnswer(); // important
}


function closeReport() {
  showReport.value = false
}

watch(data, (newData) => {
  if (newData?.rows && newData?.columns) {
    userMatrix.value = newData.rows.map(() => newData.columns.map(() => false))
  }
}, { immediate: true })


// ↪️ appelé à chaque modification de case
function emitAnswer() {
  if (readOnly) return; 
  emit('update', {
    el_ID: selectedElement.value?.el_ID,
    userMatrix: userMatrix.value
  });

  if (publicationStore.publicationData?.mode === 'exam') {
    autoSaveAnswer(); // ✅ auto-save à chaque clic en mode exam
  }
}



function adjustQuillHeight() {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight
    quillEditor.value.style.overflow = 'hidden'
  }
}

function isMatrixCorrect() {
  const solution = data.value.solutionMatrix
  const user = userMatrix.value

  if (!solution || !user) return false

  for (let r = 0; r < solution.length; r++) {
    for (let c = 0; c < solution[r].length; c++) {
      if (solution[r][c] !== user[r][c]) return false
    }
  }

  return true
}

function submitAnswer() {
  calculateScore();
  showReport.value = true;

  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    userMatrix: userMatrix.value,
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore.value,
    score: score.value,
    penalties: penalties.value
  };

  responsesStore.saveResponse(response);

  if (testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', userId);
  }

  console.log("📦 Réponse enregistrée :", response);
}




onMounted(async () => {
  console.log('selectedElement.value', selectedElement.value);
  console.log('data.value', data.value);

  await nextTick();

  // Initialiser Quill
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: {
        toolbar: false,
      }
    });

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    adjustQuillHeight();
  }

  // 🔥 Chargement des réponses sauvegardées
  const savedResponse = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);

  if (savedResponse?.userMatrix) {
    // On vide proprement l'ancienne matrice
    userMatrix.value = [];
    // Et on réinsère ligne par ligne de manière réactive
    savedResponse.userMatrix.forEach((row) => {
      userMatrix.value.push(row.map(cell => !!cell));
    });
    console.log('✅ Réponses restaurées pour cette question.', userMatrix.value);
  } else {
    // Si aucune réponse, on initialise vide
    userMatrix.value = data.value.rows.map(() => data.value.columns.map(() => false));
    console.log('✅ Matrice vide initialisée.');
  }
});



watch(userMatrix, (newMatrix) => {
  if (newMatrix.length > 0 && !readOnly) {
    autoSaveAnswer();
  }
}, { deep: true });

watch(() => selectedElement.value?.el_RichText, (newValue) => {
  if (quillInstance && newValue !== quillInstance.root.innerHTML) {
    quillInstance.root.innerHTML = newValue || ''
    adjustQuillHeight()
  }
});

// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!questionIndexMap || typeof questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return questionIndexMap[question.el_ID] ?? "N/A";
};
</script>

<style scoped>
.card-header {
  background-color: #426C9C;
  color: white;
}

.quill-editor {
  min-height: max-content !important;
  height: auto !important;
  border: 1px solid #ccc;
  overflow: hidden !important;
  transition: height 0.3s ease;
}

input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
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

.btn-console {
  background-color: rgb(78 54 54);
  color: white;
}

.readonly-mode {
  background-color: #f8f9fa; /* Fond gris très léger */
  opacity: 0.8;
  pointer-events: none; /* Bloque les interactions utilisateur */
  cursor: not-allowed;
}
</style>
