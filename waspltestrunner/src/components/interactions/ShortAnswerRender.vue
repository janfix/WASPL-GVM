<template>
  <hr>
  <div class="preview-section">
    <div class="card">
      <cardHeader 
        :elementType="question.el_Type" 
        :numOrder="getQuestionNumber() === 'N/A' ? numOrder :  getQuestionNumber() "
      />
      <div class="card-body">

        <div class="mb-2">
          <h3>{{ question.el_Text }}</h3>
        </div>
        <div v-html="question.el_RichText"></div>

        <div class="mt-2">
          <textarea 
          name="shortAnswer" 
          class="basicInput shortAnswerInput form-control" 
          v-model="studentAnswers"
          :readOnly="readOnly"
          :class="{ readOnly: readOnly }"
          @input="handleInputChange('not used')">
        </textarea>
        </div>


        <div class="ReportContainer" v-if="showReport">
          <div class="row">
            <div class="col">
              <h5>Results:</h5>
            </div>
            <div class="col" style="text-align: right;"><strong>Date:</strong> {{ currentDate }}</div>

            <hr>
            <div v-if="isLoading" class="loading-container">
              <img src="../../assets/loading.gif" alt="Loading..." class="loading-gif" />
              <p>Processing your answer, please wait...</p>
            </div>

            <div v-if="results.correction.length > 0">
              <h5>AI Correction :</h5>

              <div v-for="(correction, index) in results.correction" :key="index" class="card mb-3">
                <div class="card-body">
                  <h6 class="card-title"><strong>Axis:</strong> {{ correction.axis }}</h6>
                  <strong>Answer:</strong> {{ correction.response.answer }}
                  <p><strong>Response:</strong> {{ correction.response.comment }}</p>
                  <!-- <p><strong>Score AI:</strong> {{ correction.response.score }} / 10</p> -->
                  <p><strong>Score Q:</strong> {{ getRealScore(correction.axis, correction.response.answer) }}</p>
                </div>
              </div>

              <hr>
              <div style="color:orange">
                <h5>Final Prompt</h5>
                <p>{{ correctionPrompt }}</p>
                <p>AI Model: {{ results.AImodel }}</p>
                <p>AI Total duration: {{ results.AItotal_duration }}</p>
              </div>
            </div>

            <hr>
            <p><strong>Final Score:</strong> {{ totalQScore }} </p>
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
import { useResponsesStore } from '../../stores/useResponsesStore.js';
import { usePublicationStore } from '@/stores/usePublicationStore'
import cardHeader from './cardHeader.vue';
import { computed, ref, onMounted } from 'vue';
import Quill from 'quill'
import cardFooterLearningMode from './cardFooterLearningMode.vue';

const publicationStore = usePublicationStore()

const responsesStore = useResponsesStore();
const quillEditor = ref(null); // Référence pour le conteneur HTML de Quill
let quillInstance = null; // Instance de Quill
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
    type: Object, // ✅ correction ici
    required: false
  },
  readOnly: { type: Boolean, default: false },
});

const selectedElement = computed(() => props.question);

// Récupère le numéro de la question depuis questionIndexMap
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.error("❌ questionIndexMap est indéfini ou n'est pas un objet.");
    return "N/A";
  }

  return props.questionIndexMap[props.question.el_ID] ?? "N/A";
};


// Variable pour stocker les réponses de l'utilisateur
const studentAnswers = ref('');
const showReport = ref(false);
const correctionPrompt = ref('');
const ExamMode = ref(false); // No FB + No Verification + No Question TYPE! (No header) + No reset = (NO FOOTER)
const TestMode = ref(false); // DEPEND ON QUESTION PARAM
const LearningMode = ref(false); // Verification Report possible for Each Item + FB + Question TYPE + reset + AI comment!
const LiveMode = ref(false); // Report at the end of the page - compare with Classroom - NO QUESTION REPORT ! - FB + Reset DEFINE BY QUESTION PARAM  

const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
const decodedToken = decodeToken(token);
const userId = decodedToken?._id || decodedToken?.sub;
console.log(userId)


const results = ref({
  userId: userId,
  questionId: selectedElement.value.el_ID,
  type: selectedElement.value.el_Type,
  content: studentAnswers.value,
  timestamp: new Date().toISOString(),
  score: 0,
  error: 0,
  correction: [],
  AImodel: "",
  AItotal_duration: "",
  axes: selectedElement.value.correctionAxes
});

const totalQScore = computed(() => {
  return results.value.correction.reduce((sum, correction) => {
    return sum + getRealScore(correction.axis, correction.response.answer);
  }, 0);
});


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
/* const adjustQuillHeight = () => {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight; // Hauteur réelle du contenu
    //quillEditor.value.style.height = `${contentHeight}px`; // Ajuste dynamiquement la hauteur
    quillEditor.value.style.overflow = 'hidden'; // Supprime les barres de défilement
  }
}; */

const closeReport = () => {
  showReport.value = false;
}

const showReportOnSubmit = () => {
  showReport.value = true;
  submitAnswers(props.question)
}


const stripHTMLTags = (input) => {
  const tempElement = document.createElement("div"); // Crée un élément temporaire
  tempElement.innerHTML = input;                    // Insère le texte avec balises
  return tempElement.textContent || tempElement.innerText || ""; // Récupère le texte sans balises
}

/* this function will prepare and send an AI request Prompt for each different correction axis*/
const SequenceAxesTreatment = (data) => {

  const axes = props.question.correctionAxes;

  results.value.correction.length = 0;

  for (let i = 0; i < axes.length; i++) {

    correctionPrompt.value =
      `you are a ${data.Subject} teacher in ${data.level}, 
  here is the question asked to the students: 
  ${props.question.el_Text}
  Here is the student\'s answer: 
  ${studentAnswers.value.trim()}
  Can you say if ${axes[i].axis} ? 
  Format your answer in the strict form of a JSON and assign a score out of 10 that strictly concerns this aspect of the question. 
  Here is the structure of the JSON to respect { "answer": false/true, "score": 0-10, "comment": "here is your comment" }. 
  Be careful, no information should accompany the JSON!`;

    // Appeler Ollama pour traiter la réponse
    askLMStudio(correctionPrompt.value.trim(), axes[i].axis);

  }
}

const submitAnswers = (question) => {
  /* NO SAVING HERE - Just sending to AI PROCESS */
  const data = props.testData;

  if (!question) return;

  // Vérifiez si une réponse a été saisie
  if (!studentAnswers.value || studentAnswers.value.trim().length === 0) {
    alert("There is no answer to submit. Try again!");
    return;
  }

  if (question.AIisActivated) {
    console.log("AI IS ACTIVATED")
    SequenceAxesTreatment(data)
  } else{
    console.log("AI IS NOT ACTIVATED")
  }

}


const isLoading = ref(false); // État pour afficher/masquer le GIF



const askLMStudio = (Question, currentAxis, attempt = 1, maxRetries = 3) => {  
  isLoading.value = true; // Activer le GIF pendant le traitement

  const API_URL = "http://localhost:1234/v1/completions";
 
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-r1-distill-qwen-7b",
      prompt: Question,
      temperature: 0.1,
      max_tokens: 1000,
      stop: null
    })
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`Tentative ${attempt} - Réponse de l'API :`, data);

      // Extraire uniquement la partie JSON
      let parsedResponse = extractJsonFromResponse(data.choices[0].text);

      if (parsedResponse) {
        results.value.correction.push({
          axis: currentAxis,
          response: parsedResponse,
          score: parsedResponse.score
        });

        results.value.AImodel = data.model;
      } else {
        console.error(`Tentative ${attempt}: Impossible d'extraire une réponse JSON valide.`);
        
        // 🔄 Relancer l'API si on n'a pas atteint la limite des tentatives
        if (attempt < maxRetries) {
          console.warn(`Relance de l'API... Tentative ${attempt + 1}`);
          askLMStudio(Question, currentAxis, attempt + 1, maxRetries);
        } else {
          console.error("Échec après plusieurs tentatives.");
          alert("❌ AI could not return a valid response after several attempts.");
          
        }
      }

      isLoading.value = false;
    })
    .catch(error => {
      console.error("Erreur lors de l'appel à l'API :", error);
      alert("⚠️ Unable to connect to the AI API (LMStudio). Make sure it is running.");
      isLoading.value = false;
      
    });
};


//EXTRACTOR FOR DEEPSEEK CLEANING THINKING
function extractJsonFromResponse(responseText) {
  const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      return JSON.parse(jsonMatch[1]); // Convertir en objet JSON
    } catch (error) {
      console.error("Erreur de parsing JSON :", error);
      return null;
    }
  }
  console.warn("Aucun JSON trouvé dans la réponse AI.");
  return null;
}


const resetSelections = () => {
  const confirmed = window.confirm('Êtes-vous sûr de vouloir réinitialiser vos réponses ?');
  if (confirmed) {
    studentAnswers.value = ''; // Réinitialiser la réponse si confirmé
  }
  showReport.value = false; // Cacher le rapport de correction
};

const handleInputChange = (content) => {
  console.log("Option sélectionnée ou modifiée :", content);

  // Simuler la mise à jour des indicateurs de suivi
  console.log("Mise à jour des indicateurs de suivi pour :", {
    questionId: selectedElement.value.el_ID,
    score: results.value.score,
    hintUsed: "not used",
  });
  // Get The results
  console.log(content)
  const response = {
    userId: userId,
    questionId: selectedElement.value.el_ID,
    type: selectedElement.value.el_Type,
    questionLabel: selectedElement.value.el_Text,
    selectedOptions: studentAnswers.value,
    timestamp: new Date().toISOString(),
    answered: true,
    score: "AI",
    axes: selectedElement.value.correctionAxes
  };
  console.log(response)

  // Sauvegarder dans Pinia  
  responsesStore.saveResponse(response);


};


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

function getRealScore(axis, answer) {
  let QScore = 0; // Initialiser QScore à 0

  let correctionAxes = selectedElement.value.correctionAxes;

  for (let i = 0; i < correctionAxes.length; i++) {
    if (axis === correctionAxes[i].axis) {
      return answer ? correctionAxes[i].point : (-correctionAxes[i].penalty || 0);
    }
  }

  results.score = results.score + QScore;

  return QScore; // Retourner 0 si aucun axe ne correspond
}





onMounted(() => {
  const savedResponse = responsesStore.getResponseForQuestion(userId, selectedElement.value.el_ID);

  if (savedResponse && savedResponse.selectedOptions) {
    // Charger la réponse sauvegardée dans la zone de texte
    studentAnswers.value = savedResponse.selectedOptions;
  }
});

</script>

<style scoped>
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

.ReportContainer {
  border: grey 1px solid;
  border-radius: 3px;
  padding: 20px;
  background-color: rgb(54, 63, 67);
  color: greenyellow;
}

.card-header {
  background-color: #426C9C;
  color: black
}

;

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

.btn-console {
  margin-left: 10px;
  color: white;
  background-color: #363F43;
}

.shortAnswerInput.readOnly {
  background-color: #f5f5f5; /* léger gris */
  color: #666; /* texte un peu plus pâle */
  pointer-events: none; /* sécurité supplémentaire */
}
</style>