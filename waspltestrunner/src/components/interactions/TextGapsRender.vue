<template>
  <div class="preview-section">
    <hr>
    <div v-if="selectedElement" class="card">
      <cardHeader  
        :numOrder="getQuestionNumber() === 'N/A' ? numOrder :  getQuestionNumber() "
        :elementType="selectedElement.el_Type" 
        :mode="'Preview'" />
      <div :class="['card-body', { 'readonly-mode': props.readOnly }]">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div v-show="!isQuillEmpty" class="quill-editor" ref="quillEditor"></div>

        <div class="gapText mt-4" v-html="transformedText" ref="gapTextContainer" @input="handleInput"></div>
       
       <!--  <div 
            v-if="props.readOnly" 
            class="readonly-overlay"
          ></div> -->


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
          <p><strong>Score:</strong> {{ totalScore }}</p>
        </div>
      </div>
      
      <cardFooterLearningMode 
       v-if="(publicationStore.publicationData?.mode) !== 'exam'"
        :showReport="showReport" 
        :submitAnswers="showReportOnSubmit" 
        :closeReport="closeReport"
        :resetSelections="resetLabels" />
    </div>
  </div>
</template>

<script setup>
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import cardHeader from './cardHeader.vue';
import { computed, ref, onMounted, watch,nextTick } from 'vue';
import Quill from 'quill'
import cardFooterLearningMode from './cardFooterLearningMode.vue';
import { usePublicationStore } from '@/stores/usePublicationStore'
const publicationStore = usePublicationStore()
const responsesStore = useResponsesStore();
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
const totalScore = ref(0);
const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;
defineEmits(['interaction-started'])

const calculateTotalScore = () => {
  totalScore.value = 0;
  selectedElement.value.gaps.forEach((gap, index) => {
    const answer = userAnswers.value[index]?.trim();
    if (answer && gap.label === answer) {
      totalScore.value += gap.weight; // Ajouter le poids de la bonne réponse
    }
  });
};


const handleInput = (event) => {
  if (event.target.classList.contains('gap-input')) {
    const index = parseInt(event.target.dataset.index);
    const value = event.target.value.trim();

    // Mettre à jour userAnswers
    updateUserAnswer(index, value);

    // Sauvegarder dans le store
    saveCurrentAnswers();
  }
};



const saveCurrentAnswers = () => {
  calculateTotalScore();
  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    questionLabel : selectedElement.value.el_Text,
    type: selectedElement.value.el_Type,
    gapsAnswers: [...userAnswers.value], // Sauvegarder les réponses actuelles
    score: totalScore.value,
    timestamp: new Date().toISOString(),
    answered: userAnswers.value.some((answer) => answer.trim() !== ''), // Vérifie si une réponse est donnée
  };

 // console.log('Saving to store:', response);
  responsesStore.saveResponse(response);
  //console.log('Answers saved:', response);
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
    required: false // ou true si tu veux
  },
  readOnly: { type: Boolean, default: false },

});

console.log(props.readOnly)
const selectedElement = computed(() => props.question);

// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
};


const gapsedText = computed(() => props.question?.el_GapsedText || '');

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


const replaceSpansWithInputs = (text, isReadOnly) => {
  console.log(isReadOnly)
  const container = document.createElement('div');
  container.innerHTML = text;

  const spans = container.querySelectorAll('span.gap');
  spans.forEach((span, index) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'gap-input';
    input.dataset.index = index;
    input.readOnly = isReadOnly; // 👈 ici on utilise isReadOnly reçu en argument

    if (isReadOnly) {
      input.classList.add('readonly-mode');
    }

    nextTick(() => {
      input.value = userAnswers.value[index] || '';
    });

    input.addEventListener('input', (event) => {
      const idx = parseInt(event.target.dataset.index);
      updateUserAnswer(idx, event.target.value.trim());
    });

    span.replaceWith(input);
  });

  return container.innerHTML;
};


watch(userAnswers, (newAnswers) => {
  calculateTotalScore();
  if (gapTextContainer.value) {
    const inputs = gapTextContainer.value.querySelectorAll('input.gap-input');
    inputs.forEach((input, index) => {
      input.value = newAnswers[index] || '';
    });
  }
}, { deep: true });


const transformedText = computed(() => {
  return gapsedText.value ? replaceSpansWithInputs(gapsedText.value, props.readOnly) : '';
});


const showReportOnSubmit = () => {
  showReport.value = true;
}

const resetLabels = () => {

  if (!confirm('Are you sure you want to reset all answers? This action cannot be undone.')) {
    return; // Si l'utilisateur clique sur "Annuler", on arrête la fonction
  }

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

   // Sauvegarder dans le store
   saveCurrentAnswers();

  showReport.value = false;
  //console.log('Reset answers:', userAnswers.value);
};

const closeReport = () => {
  showReport.value = false;
};


// Initialisation et watches
onMounted(() => {

  const savedResponse = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);
 // console.log('Saved response:', savedResponse);

  if (savedResponse && savedResponse.gapsAnswers) {
    //CAS DESTRUCTION DU TEXT A TROU ET RECONSTRUCTION AVEC LES USERS ANSWERS
    userAnswers.value = [...savedResponse.gapsAnswers]; 
   
        
  } else if (selectedElement.value?.gaps) {
    userAnswers.value = Array(selectedElement.value.gaps.length).fill('');
  }

 




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
    //userAnswers.value = Array(selectedElement.value.gaps.length).fill('');
  }
});


watch(userAnswers, (newAnswers) => {
  //console.log('userAnswers updated:', newAnswers);
  // Force la réévaluation de `transformedText`
  //transformedText.value = replaceSpansWithInputs(gapsedText.value);
}, { deep: true });

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
    //console.log('el_RichText changed:', newValue);
    updateQuillContent(newValue);
    const plainText = newValue.replace(/<[^>]*>?/gm, '').trim();
    if (plainText.length === 0) {
      isQuillEmpty.value = true;
    } else {
      isQuillEmpty.value = false;
    }
  }
);

watch(userAnswers, (newAnswers) => {
  //console.log('userAnswers updated:', userAnswers.value);
}, { deep: true });

function decodeToken(token) {
  if (!token) {
    console.error('Le token est null ou non défini');
    return null;
  }
  try {
    const payload = token.split('.')[1]; // Extraire la partie payload
    return JSON.parse(atob(payload)); // Décoder le payload (Base64)
  } catch (error) {
    console.error('Erreur lors du décodage du token :', error);
    return null;
  }
}
</script>

<style>

.gapText p{
  line-height: 40px;
}

.gap-input {
  height:25px;
  display: inline-block;
  width: 120px;
  padding: 2px 5px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-left: 5px!important;
  margin-right:5px!important;
  
}


</style>


<style scoped>
.card-header {
  background-color: #426C9C;
  color: black;
}

.quill-editor {
  min-height: max-content !important;
  height: auto !important;
  border: 1px solid #ccc;
  overflow: hidden !important;
  transition: height 0.3s ease;
  padding:5px
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

.btn-console {
  margin-left: 10px;
  background-color: rgb(78 54 54);
  color: white;
}

.btn-console:hover {
  background-color: rgb(119, 104, 104);
  color: white;
}

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
}

.readonly-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: red; /* ou "rgba(255, 255, 255, 0.3)" si tu veux un léger voile blanc */
  cursor: not-allowed;
  z-index: 10;
}

.gapText {
  position: relative;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.gap-input.readonly-mode {
  background-color: #e9ecef!important; /* gris Bootstrap classique */
  color: #6c757d!important; /* texte un peu grisé */
  pointer-events: none;
  cursor: not-allowed;
}

.readonly-mode {
  background-color: gainsboro!important;
  color:grey!important;
}


</style>