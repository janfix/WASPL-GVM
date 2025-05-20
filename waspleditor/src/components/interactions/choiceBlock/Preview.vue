<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" mode="Preview" />
      <div class="card-body">

        <div
          v-if="showReport && results.score == computedMaxScore && results.error === 0 && selectedElement.feedback.correct"
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
            :class="['block-option', isSelected(option.id) ? 'selected' : '']" v-html="option.richText"
            @click="toggleOption(option.id)" />
        </div>

        <!-- Hint -->
        <div v-if="displayHintButton" class="hintContainer mt-3">
          <button class="btn btn-sm btn-primary" @click="showHint = true">Hint!</button>
          <div v-if="showHint" class="hintMessage mt-2">{{ selectedElement.tip }}</div>
        </div>
      </div>

      <!-- Report -->
      <div class="ReportContainer" v-if="showReport">
        <h5>Results:</h5>
        <p><strong>Your Answers:</strong> {{ results.selectedOptions.join(', ') }}</p>
        <p><strong>Score:</strong> {{ results.score }}</p>
        <p><strong>Max Score:</strong> {{ computedMaxScore }}</p>
        <p><strong>Penalties:</strong> {{ results.error }}</p>
        <p><strong>Hint used:</strong> {{ results.hint }}</p>


      </div>

      <div class="card-footer text-end">
        <button class="btn btn-sm btn-primary" @click="submitAnswers">Submit</button>
        <button v-if="showReport" class="btn btn-sm btn-console ms-2" @click="showReport = false">Close Report</button>
        <button class="btn btn-sm btn-secondary ms-2" @click="resetSelections">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect } from 'vue';
import Quill from 'quill';
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore';

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);
const elementLabel = computed(() => store.selectedElementLabel);
const isMultiple = computed(() => selectedElement.value?.multiple === true);
const displayHintButton = computed(() => !!selectedElement.value?.tip);

const studentAnswers = ref(isMultiple.value ? [] : null);
const showHint = ref(false);
const showReport = ref(false);
const results = ref({ score: 0, error: 0, mark: 0, selectedOptions: [], hint: false });

const quillEditor = ref(null);
let quillInstance = null;
const isQuillEmpty = ref(true);

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const displayedOptions = ref([]);

onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false }
    });
    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
      isQuillEmpty.value = !quillInstance.getText().trim();
    }
  }

  displayedOptions.value = selectedElement.value?.randomized
    ? shuffleArray([...selectedElement.value.options])
    : [...selectedElement.value.options];
});

watchEffect(() => {
  if (!selectedElement.value) return;
  studentAnswers.value = isMultiple.value ? [] : null;
  showReport.value = false;
  results.value = { score: 0, error: 0, mark: 0, selectedOptions: [], hint: false };

  if (quillInstance) {
    quillInstance.root.innerHTML = selectedElement.value.el_RichText || '';
    isQuillEmpty.value = !quillInstance.getText().trim();
  }

  displayedOptions.value = selectedElement.value?.randomized
    ? shuffleArray([...selectedElement.value.options])
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
};

const isSelected = (id) => {
  return isMultiple.value ? studentAnswers.value.includes(id) : studentAnswers.value === id;
};

const resetSelections = () => {
  studentAnswers.value = isMultiple.value ? [] : null;
  showHint.value = false;
  showReport.value = false;
  results.value = {
    score: 0,
    error: 0,
    mark: 0,
    selectedOptions: [],
    hint: false
  };

  if (selectedElement.value?.randomized) {
    displayedOptions.value = shuffleArray([...selectedElement.value.options]);
  } else {
    displayedOptions.value = [...selectedElement.value.options];
  }
};

const computedMaxScore = computed(() => {
  if (!selectedElement.value) return 1;
  if (selectedElement.value.multiple) {
    return selectedElement.value.options
      .filter(opt => opt.isCorrect && Number(opt.weight) > 0)
      .reduce((sum, opt) => sum + Number(opt.weight), 0);
  } else {
    const correctOpt = selectedElement.value.options.find(opt => opt.isCorrect);
    return correctOpt ? Number(correctOpt.weight || 1) : 1;
  }
});

const submitAnswers = () => {
  if (!selectedElement.value) return;
  if (!studentAnswers.value || (Array.isArray(studentAnswers.value) && studentAnswers.value.length === 0)) {
    alert('Please choose an answer!');
    return;
  }

  const selectedIds = isMultiple.value ? studentAnswers.value : [studentAnswers.value];

  results.value.selectedOptions = [];
  results.value.score = 0;
  results.value.error = 0;

  selectedElement.value.options.forEach(opt => {
    if (selectedIds.includes(opt.id)) {
      results.value.selectedOptions.push(stripHtml(opt.richText));
      const weight = parseInt(opt.weight ?? 1) || 0;
      if (opt.isCorrect) results.value.score += weight;
      else results.value.error += weight;
    }
  });

  const maxScore = computedMaxScore.value || 1;
  results.value.mark = ((results.value.score / maxScore) || 0).toFixed(2);
  results.value.hint = showHint.value;
  showReport.value = true;
};

const stripHtml = (html) => html.replace(/<[^>]*>?/gm, '').trim();
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
</style>
