<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Preview'" />
      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div v-show="!isQuillEmpty" class="quill-editor" ref="quillEditor"></div>

        <div class="gapText mt-4" v-html="transformedText" ref="gapTextContainer" @input="handleInput"></div>

        <div class="ReportContainer" v-if="showReport">
          <div class="row">
            <div class="col">
              <h5>Results:</h5>
            </div>
            <div class="col" style="text-align: right;">
              <strong>Date:</strong> {{ currentDate }}
            </div>
          </div>

          <hr />

          <p><strong>Your Answers:</strong></p>
          <table class="table">
            <thead>
              <tr>
                <th>Index</th>
                <th>Expected</th>
                <th>Answered</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(gap, index) in selectedElement.gaps" :key="index">
                <td>{{ index }}</td>
                <td>{{ gap.label }}</td>
                <td>{{ userAnswers[index] || "Not Answered" }}</td>
                <td>
                  {{ evaluateAnswer(index, gap.label, userAnswers[index]) }}
                </td>
              </tr>
            </tbody>
          </table>

          <p><strong>Max-Score:</strong> {{ selectedElement.maxScore }}</p>
          <p><strong>Score:</strong> {{ results.score }}</p>
          <p><strong>Penalties:</strong> {{ results.penalty }}</p>
        </div>
      </div>

      <div class="card-footer" style="text-align: right;">
        <button class="btn btn-primary btn-sm" @click="submitResults">Submit</button>
        <button class="btn btn-console btn-sm ml-2" @click="closeReport" v-if="showReport">Close Report</button>
        <button class="btn btn-secondary btn-sm" @click="resetLabels" style="margin-left: 10px;">Reset</button>
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
const quillEditor = ref(null);
const gapTextContainer = ref(null);
let quillInstance = null;
const showReport = ref(false);
let isQuillEmpty = ref(true);

const results = ref({
  score: 0,
  penalty: 0,
  content: '',
});

const userAnswers = ref([]);



const handleInput = (event) => {
  if (event.target.classList.contains('gap-input')) {
    const index = parseInt(event.target.dataset.index);
    updateUserAnswer(index, event.target.value.trim());
  }
};


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

const selectedElement = computed(() => store.selectedElement)
const elementLabel = computed(() => store.selectedElementLabel)
const gapsedText = computed(() => store.selectedElement?.el_GapsedText || '');

const evaluateAnswer = (index, expected, answered) => {
  if (!answered) return 0;
  return expected === answered ? selectedElement.value.gaps[index].weight : 0;
};

// Fonction pour mettre à jour le contenu de Quill
const updateQuillContent = (content) => {
  if (quillInstance) {
    quillInstance.root.innerHTML = content || ''; // Insère le contenu ou vide l'éditeur
  }
};

// Fonction mise à jour pour gérer les réponses utilisateur
const updateUserAnswer = (index, value) => {
 //console.log(value)
  userAnswers.value[index] = value;
  //console.log('Updated answers:', userAnswers.value);
};

const replaceSpansWithInputs = (text) => {
  //console.log('replaceSpansWithInputs called with text:', text);
  const container = document.createElement('div');
  container.innerHTML = text;

  const spans = container.querySelectorAll('span.gap');
  spans.forEach((span, index) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'gap-input';
    input.dataset.index = index;
    input.value = userAnswers.value[index] || ''; // Utilise la valeur existante ou vide

    // Gestionnaire d'événements mis à jour
    input.oninput = (event) => {
      //console.log("Update the user")
      updateUserAnswer(index, event.target.value.trim());
    };

    span.replaceWith(input);
  });

  return container.innerHTML;
};

const transformedText = computed(() => {
  return gapsedText.value ? replaceSpansWithInputs(gapsedText.value) : '';
});

const submitResults = () => {
 // console.log('Submitting answers:', userAnswers.value);

  results.value.score = 0;
  results.value.penalty = 0;

  selectedElement.value.gaps.forEach((gap, index) => {
    const answer = userAnswers.value[index]?.trim();
    //console.log(answer)
    if (answer && gap.label === answer) {
      results.value.score += gap.weight;
    } else {
      results.value.penalty += 1;
    }
  });

  showReport.value = true;
};

const resetLabels = () => {
  // Réinitialiser les réponses
  userAnswers.value = Array(selectedElement.value.gaps.length).fill('');

  // Réinitialiser les inputs
  if (gapTextContainer.value) {
    const inputs = gapTextContainer.value.querySelectorAll('input.gap-input');
    inputs.forEach(input => {
      input.value = '';
    });
  }

  // Réinitialiser les résultats
  results.value = {
    score: 0,
    penalty: 0,
    content: ''
  };

  showReport.value = false;
  //console.log('Reset answers:', userAnswers.value);
};

const closeReport = () => {
  showReport.value = false;
};

// Initialisation et watches
onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false },
    });

    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;

      const plainText = selectedElement.value.el_RichText.replace(/<[^>]*>?/gm, '').trim();
      if (plainText.length === 0) {
        isQuillEmpty.value = true;
      } else {
        isQuillEmpty.value = false;
      }
    }
  }

  // Initialisation des réponses si des gaps existent
  if (selectedElement.value?.gaps) {
    userAnswers.value = Array(selectedElement.value.gaps.length).fill('');
  }
});

// Observer les changements dans les gaps
watch(
  () => selectedElement.value?.gaps,
  (newGaps) => {
    if (newGaps) {
      userAnswers.value = Array(newGaps.length).fill('');
      //console.log('Initialized answers:', userAnswers.value);
    }
  },
  { immediate: true }
);

// Surveiller les changements de `selectedElement.el_RichText`
watch(
  () => selectedElement.value?.el_RichText,
  (newValue) => {
   // console.log('el_RichText changed:', newValue);
    updateQuillContent(newValue);
    const plainText = newValue.replace(/<[^>]*>?/gm, '').trim();
    if (plainText.length === 0) {
      isQuillEmpty.value = true;
    } else {
      isQuillEmpty.value = false;
    }
  }
);





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

.gap-input {
  display: inline-block;
  width: 120px;
  margin: 0 5px;
  padding: 2px 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.table {
  width: 100%;
  margin-top: 15px;
}

.table th,
.table td {
  text-align: center;
}

.ReportContainer p strong {
  color: yellowgreen;
}
</style>