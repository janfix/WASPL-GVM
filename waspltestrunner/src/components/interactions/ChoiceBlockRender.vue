<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader  :numOrder="getQuestionNumber() === 'N/A' ? numOrder :  getQuestionNumber() " :elementType="selectedElement.el_Type" mode="Preview" />
      <div class="card-body">

        <div v-if="showReport && results.score == computedMaxScore && results.error === 0 && selectedElement.feedback.correct"
  class="PositiveFeebackContainer">
  {{ selectedElement.feedback.correct }}
</div>
<div v-else-if="showReport && selectedElement.feedback.incorrect" class="NegativeFeebackContainer">
  {{ selectedElement.feedback.incorrect }}
</div>

        <h3>{{ selectedElement.el_Text }}</h3>

        <div class="quill-editor" ref="quillEditor" v-show="!isQuillEmpty"></div>

        <div class="block-options mt-3">
          <div v-for="(option, index) in displayedOptions" :key="option.id"
  :class="['block-option', isSelected(option.id) ? 'selected' : '', props.readOnly ? 'readonly-mode' : '']"
  v-html="option.richText"
  @click="!props.readOnly && toggleOption(option.id)" />
        </div>

        <!-- Hint -->
        <div v-if="displayHintButton" class="hintContainer mt-3">
          <button class="btn btn-sm btn-primary" @click="showHint = true">{{$t('Hint')}}!</button>
          <div v-if="showHint" class="hintMessage mt-2">{{ selectedElement.tip }}</div>
        </div>
      </div>

      <!-- Report -->
      <div class="ReportContainer" v-if="showReport">
        <h5>Results:</h5>
        <p><strong>Your Answers:</strong> {{ results.selectedLabels.join(', ') }}</p>
        <p><strong>Score:</strong> {{ results.score }}</p>
        <p><strong>Max Score:</strong> {{ computedMaxScore }}</p>
        <p><strong>Penalties:</strong> {{ results.error }}</p>
        <p><strong>Hint used:</strong> {{ results.hint }}</p>


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
import { ref, computed, onMounted, watchEffect, nextTick } from 'vue';
import Quill from 'quill';
import cardHeader from './cardHeader.vue';
import cardFooterLearningMode from './cardFooterLearningMode.vue';
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore';

const publicationStore = usePublicationStore();
const responsesStore = useResponsesStore();

const token = localStorage.getItem('token');
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;


const props = defineProps({
  question: { type: Object, required: true },
  testData: { type: Object, required: true },
  numOrder: [Number, null],
  questionIndexMap: { type: Object, required: false },
  restoredAnswer: { type: [String, Array, null], default: null },
  readOnly: { type: Boolean, default: false }
});

const selectedElement = computed(() => props.question);
const isMultiple = computed(() => selectedElement.value?.multiple === true);
const displayHintButton = computed(() => !!selectedElement.value?.tip);

const quillEditor = ref(null);
let quillInstance = null;
const isQuillEmpty = ref(true);

const showHint = ref(false);
const showReport = ref(false);

const results = ref({
  score: 0,
  error: 0,
  mark: 0,
  selectedOptions: [],
  selectedLabels: [],
  hint: false
});

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const displayedOptions = ref([]);
const studentAnswers = ref(isMultiple.value ? [] : null);

const computedMaxScore = computed(() => {
  if (!selectedElement.value) return 1;
  const opts = selectedElement.value.options || [];
  if (isMultiple.value) {
    return opts
      .filter(opt => opt.isCorrect && Number(opt.weight) > 0)
      .reduce((sum, opt) => sum + Number(opt.weight), 0);
  } else {
    const correct = opts.find(o => o.isCorrect);
    return correct ? Number(correct.weight || 1) : 1;
  }
});

const showReportOnSubmit = () => {
  showReport.value = true;
}

const closeReport = () => {
  showReport.value = false;
}

onMounted(async () => {
  if (quillEditor.value && selectedElement.value?.el_RichText) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false }
    });
    quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    isQuillEmpty.value = !quillInstance.getText().trim();
  }

  displayedOptions.value = selectedElement.value?.randomized
    ? shuffleArray(selectedElement.value.options)
    : [...selectedElement.value.options];

  // 🔁 restauration depuis props (navigation arrière)
  if (props.restoredAnswer !== null && props.restoredAnswer !== undefined) {
    studentAnswers.value = isMultiple.value
      ? [...props.restoredAnswer]
      : props.restoredAnswer[0];
  }

  // 🔁 restauration depuis Pinia
  const saved = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);
  if (saved) {
    studentAnswers.value = isMultiple.value
      ? [...(saved.selectedOptions || [])]
      : saved.selectedOptions?.[0] || null;
  }

  await nextTick();
  displayedOptions.value = [...displayedOptions.value]; // force rerender
});

watchEffect(() => {
  if (!selectedElement.value) return;
  results.value = {
    score: 0, error: 0, mark: 0, selectedOptions: [], selectedLabels: [], hint: false
  };
  showReport.value = false;

  if (quillInstance && selectedElement.value.el_RichText) {
    quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    isQuillEmpty.value = !quillInstance.getText().trim();
  }

  displayedOptions.value = selectedElement.value.randomized
    ? shuffleArray(selectedElement.value.options)
    : [...selectedElement.value.options];
});

const toggleOption = (id) => {
  if (!isMultiple.value) {
    studentAnswers.value = id;
  } else {
    const index = studentAnswers.value.indexOf(id);
    if (index === -1) studentAnswers.value.push(id);
    else studentAnswers.value.splice(index, 1);
  }

    // Appel à la nouvelle fonction pour gérer la soumission intermédiaire
    handleInputChange(id);

  // Sauvegarde immédiate si mode exam
  if (publicationStore.publicationData?.mode === 'exam') {
    autoSaveAnswer();
  }
};


const isSelected = (id) => {
  return isMultiple.value ? studentAnswers.value.includes(id) : studentAnswers.value === id;
};

function autoSaveAnswer() {
  const selectedIds = isMultiple.value ? studentAnswers.value : [studentAnswers.value];
  const selectedLabels = selectedElement.value.options
    .filter(opt => selectedIds.includes(opt.id))
    .map(opt => stripHtml(opt.richText));

  const maxScore = computedMaxScore.value;

  const response = {
    userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    selectedOptions: selectedIds,
    selectedLabels,
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore,
    score: 0, // on ne corrige pas en mode exam
    hint: showHint.value
  };

  responsesStore.saveResponse(response);

  if (props.testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', userId);
  }

  console.log("💾 Auto-save réponse (exam mode):", response);
}



const submitAnswers = () => {
  if (!selectedElement.value || !studentAnswers.value || (Array.isArray(studentAnswers.value) && studentAnswers.value.length === 0)) {
    alert('Please choose an answer!');
    return;
  }

  const selectedIds = isMultiple.value ? studentAnswers.value : [studentAnswers.value];
  results.value.selectedOptions = [];
  results.value.selectedLabels = [];
  results.value.score = 0;
  results.value.error = 0;

  selectedElement.value.options.forEach(opt => {
    if (selectedIds.includes(opt.id)) {
      results.value.selectedOptions.push(opt.id);
      results.value.selectedLabels.push(stripHtml(opt.richText));
      const weight = parseInt(opt.weight ?? 0);
      if (opt.isCorrect) results.value.score += weight;
      else results.value.error += weight;
    }
  });

  const maxScore = computedMaxScore.value;
  results.value.mark = ((results.value.score / maxScore) || 0).toFixed(2);
  results.value.hint = showHint.value;
  

  const response = {
    userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    selectedOptions: results.value.selectedOptions,
    selectedLabels: results.value.selectedLabels,
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore,
    score: results.value.mark,
    hint: results.value.hint
  };

  responsesStore.saveResponse(response);

  if (props.testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', userId);
  }
};

const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim();

const resetSelections = () => {
  studentAnswers.value = isMultiple.value ? [] : null;
  showHint.value = false;
  showReport.value = false;
  results.value = { score: 0, error: 0, mark: 0, selectedOptions: [], selectedLabels: [], hint: false };
  displayedOptions.value = selectedElement.value.randomized
    ? shuffleArray([...selectedElement.value.options])
    : [...selectedElement.value.options];
};


const handleInputChange = (optionId) => {
  console.log("Option sélectionnée :", optionId);

  // Appel direct à submitAnswers
  submitAnswers();
};

function decodeToken(token) {
  if (!token) {
    console.error('Le token est null ou non défini');
    return null;
  }
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (error) {
    console.error('Erreur lors du décodage du token :', error);
    return null;
  }
}

const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }
  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
};
</script>


<style scoped>
.block-option {
  border: 1px solid #ccc;
  padding: 1rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s ease;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
}

.block-option.selected {
  background-color: #cce5ff;
  border-color: #58595b;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}

.block-option:hover {
  border-width: 2px;
  border-color: #8999a9;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}

.quill-editor {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 1rem;
}

.hintMessage {
  border: green 1px solid;
  border-radius: 5px;
  padding: 10px;
  background-color: rgb(222, 235, 222);
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
  padding: 10px;
  border: 1px green dotted;
  border-radius: 5px;
}

.NegativeFeebackContainer {
  background-color: rgb(246, 234, 235);
  padding: 10px;
  border: 1px red dotted;
  border-radius: 5px;
}

.btn-console {
  background-color: #4e3636;
  color: white;
}

.readonly-mode {
  opacity: 0.6;
  pointer-events: none; /* Bloque tout (survol, clic, etc.) */
  cursor: not-allowed;
}


</style>
