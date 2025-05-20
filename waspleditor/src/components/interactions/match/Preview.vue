<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Preview'" />

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
                  <input type="checkbox" v-model="userMatrix[rIndex][cIndex]" @change="emitAnswer"
                    :disabled="showReport" />
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

      <div class="card-footer text-end">
        <button class="btn btn-primary btn-sm" @click="submitAnswer">Submit</button>
        <button class="btn btn-console btn-sm ms-2" @click="closeReport" v-if="showReport">Close Report</button>
        <button class="btn btn-secondary btn-sm ms-2" @click="resetAnswer">Reset</button>
      </div>
    </div>
  </div>
</template>


<script setup>
import cardHeader from '../default/cardHeader.vue'
import { useTestStore } from '../../../stores/testStore'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import Quill from 'quill'

const store = useTestStore()
const selectedElement = computed(() => store.selectedElement)
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


function submitAnswer() {
  calculateScore()
  showReport.value = true
  emitAnswer()
}

function resetAnswer() {
  userMatrix.value = data.value.rows.map(() => data.value.columns.map(() => false))
  showReport.value = false
  score.value = 0
}

function closeReport() {
  showReport.value = false
}

watch(data, (newData) => {
  if (newData?.rows && newData?.columns) {
    userMatrix.value = newData.rows.map(() => newData.columns.map(() => false))
  }
}, { immediate: true })

const emit = defineEmits(['update'])

// ↪️ appelé à chaque modification de case
function emitAnswer() {
  emit('update', {
    el_ID: selectedElement.value?.el_ID,
    userMatrix: userMatrix.value
  })
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


onMounted(async () => {
  await nextTick()
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: {
        toolbar: false
      }
    })

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText
    }

    adjustQuillHeight()
  }
})

watch(() => selectedElement.value?.el_RichText, (newValue) => {
  if (quillInstance && newValue !== quillInstance.root.innerHTML) {
    quillInstance.root.innerHTML = newValue || ''
    adjustQuillHeight()
  }
})
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
</style>
