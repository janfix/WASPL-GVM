<template>
  <div class="preview-section mb-4">
    
    <div v-if="selectedElement" 
    :class="['card', { 'readonly-mode': props.readOnly }]"
    >
      <cardHeader 
        :numOrder="getQuestionNumber() === 'N/A' ? numOrder :  getQuestionNumber() "
        :elementType="selectedElement.el_Type" 
        :mode="'Preview'" />
      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div v-show="!isQuillEmpty" class="quill-editor" ref="quillEditor"></div>

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

        <!-- Single Choice (Radio Buttons) -->
        <div v-if="!selectedElement.multiple" class="mb-3 mt-4 ml-4">
          <div v-for="(option, index) in selectedElement.options" :key="index" class="mb-2">
            <div class="input-group">
              <input 
                :id="option.id" 
                type="radio" 
                :name="'singleChoiceGroup' + selectedElement.el_ID" 
                :value="option.id"
                v-model="studentAnswers" 
                @change="handleInputChange(option)" 
                :disabled="props.readOnly"
                />
              <label :for="option.id" style="margin-left: 10px; cursor: pointer;">
                {{ option.text }}
              </label>
            </div>
          </div>
        </div>

        <!-- Multiple Choice (Checkboxes) -->
        <div v-else class="mb-3 mt-4 ml-4">
          <div v-for="(option, index) in selectedElement.options" :key="index" class="mb-2">
            <div class="input-group">
              <input 
                :id="option.id" 
                type="checkbox" 
                :value="option.id" 
                v-model="studentAnswers"
                @change="handleInputChange(option)" 
                :disabled="props.readOnly"
              />
              <label :for="option.id" style="margin-left: 10px; cursor: pointer;">
                {{ option.text }}
              </label>
            </div>
          </div>
        </div>
        <div class="hintContainer" v-if="displayHintButton">
          <button 
            @click="HandlerShowHint" 
            class="hintBT btn btn-primary btn-sm"
            :disabled="props.readOnly"
            >
            Hint!
          </button>
          <div v-if="showHint" class="hintMessage">{{ selectedElement.tip }} </div>
        </div>
      </div>
      <div class="ReportContainer" v-if="showReport">
        <div class="row">
          <div class="col">
            <h5>Results:</h5>
          </div>
          <div class="col" style="text-align: right;"><strong>Date:</strong> {{ currentDate }}</div>

          <hr>
          <p><strong>Your Answers:</strong> {{ results.selectedLabels.join(', ') }}</p>
          <p><strong>Score:</strong> {{ results.score }} </p>
          <p><strong>Max-Score:</strong> {{ selectedElement.maxScore }} </p>
          <p><strong>Penalties:</strong> {{ results.error }}</p>
          <!--  <p><strong>Mark:</strong> {{ (results.mark * 100).toFixed(0) }}%</p> -->
          <p><strong>Hint was used : </strong>{{ results.hint }}</p>

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
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore'
import cardHeader from './cardHeader.vue';
import cardFooterLearningMode from './cardFooterLearningMode.vue';
import { computed, ref, onMounted, watch } from 'vue';
import Quill from 'quill'

defineEmits(['interaction-started'])

const publicationStore = usePublicationStore()
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
    type: Object, // ✅ correction ici
    required: false
  },
  restoredAnswer: {
  type: [String, Array, null],
  default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  }
  
});


//console.log("✅ restoredAnswer reçue :", props.restoredAnswer);
const responsesStore = useResponsesStore();


// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
};




const quillEditor = ref(null); // Référence pour le conteneur HTML de Quill
let quillInstance = null; // Instance de Quill

const selectedElement = computed(() => props.question);

let isQuillEmpty = ref(true);


// Propriété calculée pour déterminer si le bouton Hint doit être affiché
const displayHintButton = computed(() => {

  return !!selectedElement.value.tip; // Retourne true si tip est défini et non vide
});

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Mélanger les options de l'élément sélectionné
const shuffleOptions = () => {
  if (selectedElement.value?.options) {
    selectedElement.value.options = shuffleArray([...selectedElement.value.options]);
  }
};


// Variable pour stocker les réponses de l'utilisateur
const studentAnswers = ref(
  props.restoredAnswer !== null && props.restoredAnswer !== undefined
    ? (
        selectedElement.value?.multiple
          ? [...props.restoredAnswer] // ⬅️ multiple → array
          : props.restoredAnswer[0]  // ⬅️ simple → string
      )
    : (selectedElement.value?.multiple ? [] : null)
);


// Calculer la date actuelle
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


// Ajuster dynamiquement la hauteur du conteneur Quill
const adjustQuillHeight = () => {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight; // Hauteur réelle du contenu
    quillEditor.value.style.height = `${contentHeight}px`; // Ajuste dynamiquement la hauteur
    quillEditor.value.style.overflow = 'hidden'; // Supprime les barres de défilement
  }
};


// Initialisation de Quill
onMounted(() => {


  //console.log("🧪 studentAnswers final:", studentAnswers.value);


  if (props.restoredAnswer !== null && props.restoredAnswer !== undefined) {
  studentAnswers.value = selectedElement.value?.multiple
    ? [...props.restoredAnswer]
    : props.restoredAnswer[0]; // single choice => string
    
}


  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: {
        toolbar: false,
      },
    });

    if (selectedElement.value?.randomized) {
      shuffleOptions()
    }


    if (selectedElement.value?.el_RichText) {
      quillInstance.root.innerHTML = selectedElement.value.el_RichText;
    }

    adjustQuillHeight(); // Ajuste la hauteur après l'initialisation
    const plainText = selectedElement.value.el_RichText.replace(/<[^>]*>?/gm, '').trim();
    if (plainText.length === 0) {
      isQuillEmpty.value = true;
    } else {
      isQuillEmpty.value = false;
    }
  }

  // Charger les réponses sauvegardées si disponibles
  const savedResponse = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);
if (savedResponse) {
  studentAnswers.value = selectedElement.value.multiple
    ? [...(savedResponse.selectedOptions || [])]
    : savedResponse.selectedOptions?.[0] || null;
}
});

// Fonction pour réinitialiser les sélections
const resetSelections = () => {
  //console.log(selectedElement.value.randomized)
  if (selectedElement.value.randomized) { shuffleOptions() }
  if (selectedElement.value) {
    studentAnswers.value = selectedElement.value.multiple ? [] : null;
  }
  showReport.value = false;
  showHint.value = false;
  results.value = {
    score: 0,
    error: 0,
    mark: 0,
    selectedOptions: [],
    hint: false
  };

};

const handleInputChange = (option) => {
  if (props.readOnly) return; 
  // Get The results
  submitAnswers()

};

const showReport = ref(false);
const showHint = ref(false);
const results = ref({
  score: 0,
  error: 0,
  mark: 0,
  selectedOptions: [],
  hint: false
});

const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;


// Fonction pour soumettre les réponses
const submitAnswers = () => {
  results.value.score = 0;
  results.value.error = 0;
  // Réinitialiser selectedOptions avant d'ajouter les nouvelles réponses
  results.value.selectedOptions = [];
  results.value.selectedLabels = [];

  if (!selectedElement.value) return;
  if (studentAnswers.value === null) {
    alert("Please choose an answer !")
    return; // Ajouter un return ici pour éviter d'exécuter le reste si pas de réponse
  }

  // Vérifier les réponses de l'étudiant
  selectedElement.value.options.forEach((option) => {
    if (studentAnswers.value.includes(option.id)) {
      results.value.selectedOptions.push(option.id);    // ID de l'option
      results.value.selectedLabels.push(option.text);   // Texte de l'option
      if (option.isCorrect) {
        results.value.score += parseInt(option.weight);
      } else {
        if (option.weight == 0 ||option.weight==null ||option.weight.length == 0   ) { option.weight = 0 }
        results.value.error += parseInt(option.weight);
      }
    }
  });

  // Calculer le pourcentage (note)
  const maxScore = selectedElement.value.maxScore || selectedElement.value.options.filter(o => o.isCorrect).length;
  results.value.mark = (results.value.score + results.value.error / maxScore).toFixed(2);


  // Préparer la réponse
  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    selectedOptions: results.value.selectedOptions, // Contient les IDs
    selectedLabels: results.value.selectedLabels,  // Contient les labels (textes des réponses)
    timestamp: new Date().toISOString(),
    answered: true,
    maxScore: maxScore,
    score: results.value.mark,
    hint: results.value.hint
  };


  // Sauvegarder dans Pinia
  responsesStore.saveResponse(response);

  // Envoi selon la stratégie définie
  if (props.testData.strategy === 'realTime') {
    responsesStore.sendResponsesToDatabase('realTime', USER_ID);
  }

  //console.log('Answer submitted:', response);
  return response
};

const showReportOnSubmit = () => {
  showReport.value = true;
}

const closeReport = () => {
  showReport.value = false;
}

const HandlerShowHint = () => {
  showHint.value = true;
  results.value.hint = true;
  handleInputChange("hint");

}


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


<style scoped>
.hintMessage {
  border: green 1px solid;
  border-radius: 5px;
  padding: 10px;
  margin: 10px;
  background-color: rgb(222, 235, 222);
}

.ml-2 {
  margin-left: 10px;
}

.ml-4 {
  margin-left: 40px;
}

.btn-console {
  background-color: rgb(78 54 54);
  color: white;
}

.btn-console:hover {
  background-color: rgb(119, 104, 104);
  color: white;
}



.quill-editor {
  height: auto !important;
 /*  border: 1px solid #ccc; */
  border-radius: 5px;
  overflow: hidden !important;
  transition: height 0.3s ease;
  padding: 5px;

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

.readonly-mode {
  background-color: #f8f9fa; /* Gris très léger */
  opacity: 0.8; /* Légère transparence */
  pointer-events: none; /* Désactive les interactions, sauf pour les éléments déjà disabled */
  cursor: not-allowed; /* Curseur barré */
}
</style>