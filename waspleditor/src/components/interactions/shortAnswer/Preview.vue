<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Preview'" />
      <div class="card-body">

        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div class="quill-editor" ref="quillEditor"></div>

        <div class="mt-2">
          <textarea name="shortAnswer" class="basicInput shortAnswerInput form-control" v-model="studentAnswers">
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
              <img src="../../../assets/loading.gif" alt="Loading..." class="loading-gif" />
              <p>Processing your answer, please wait...</p>
            </div>

            <div v-if="results.correction && selectedElement.AIisActivated">
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
                <p>AI temperature: {{ results.temperature }}</p>
                <p>AI Max Token: {{ results.max_tokens }}</p>
              </div>
               <p><strong>Final Score:</strong> {{ totalQScore }} </p>
               <hr>
            </div>
            <div v-else>
              <p>The raw answer is stored in the database without any score.</p>
              <p>Human correction is needed. Use the WASPL correction project to make it easy! </p>
            </div>

            

            



          </div>
        </div>



      </div>
      <div class="card-footer" style="text-align: right;">
        <button class="btn btn-primary btn-sm" @click="submitAnswers">Submit</button>
        <button class="btn btn-console btn-sm ml-2" @click="closeReport" v-if="showReport">Close Report</button>
        <button class="btn btn-secondary btn-sm" @click="resetSelections" style="margin-left: 10px;">
          Reset
        </button>
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

const quillEditor = ref(null); // Référence pour le conteneur HTML de Quill
let quillInstance = null; // Instance de Quill
const testData = store.getTestData();

const selectedElement = computed(() => store.selectedElement)
const elementLabel = computed(() => store.selectedElementLabel)

// Variable pour stocker les réponses de l'utilisateur
const studentAnswers = ref('');
const showReport = ref(false);
const correctionPrompt = ref('');

const results = ref({
  userId: "",
  questionId: selectedElement.value.el_ID,
  type: selectedElement.value.el_Type,
  content: studentAnswers.value,
  timestamp: new Date().toISOString(),
  score: 0,
  error: 0,
  correction: [],
  AImodel: "",
  temperature: "",
  max_tokens:"",
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
const adjustQuillHeight = () => {
  if (quillInstance) {
    const contentHeight = quillInstance.root.scrollHeight; // Hauteur réelle du contenu
    //quillEditor.value.style.height = `${contentHeight}px`; // Ajuste dynamiquement la hauteur
    quillEditor.value.style.overflow = 'hidden'; // Supprime les barres de défilement
  }
};

const closeReport = () => {
  showReport.value = false;
}

// Initialisation de Quill
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

    adjustQuillHeight(); // Ajuste la hauteur après l'initialisation
  }
});


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

const stripHTMLTags = (input) => {
  const tempElement = document.createElement("div"); // Crée un élément temporaire
  tempElement.innerHTML = input;                    // Insère le texte avec balises
  return tempElement.textContent || tempElement.innerText || ""; // Récupère le texte sans balises
}


const submitAnswers = () => {

  if (!selectedElement.value) return;


  results.value.correction = [];

  const data = testData;
  // Vérifiez si une réponse a été saisie
  if (!studentAnswers.value || studentAnswers.value.trim().length === 0) {
    alert("There is no answer to submit. Try again!");
    return;
  }

  console.log(selectedElement.value)
  if (selectedElement.value.AIisActivated) {
    console.log("AI IS ACTIVATED")
    SequenceAxesTreatment(data)
  } else{
    console.log("AI IS NOT ACTIVATED")
  }

  // Afficher le rapport
  showReport.value = true;
};


const isLoading = ref(false); // État pour afficher/masquer le GIF

/* this function will prepare and send an AI request Prompt for each different correction axis*/
const SequenceAxesTreatment = (data) => {

  const axes = selectedElement.value.correctionAxes;

  results.value.correction.length = 0;

  for (let i = 0; i < axes.length; i++) {

    correctionPrompt.value =
      `you are a ${data.Subject} teacher in ${data.level}, 
here is the question asked to the students: 
${selectedElement.value.el_Text}
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

const askLMStudio = (Question, currentAxis, attempt = 1, maxRetries = 3) => {
  console.log(Question)
  console.log(currentAxis)
  isLoading.value = true; // Activer le GIF pendant le traitement

  const API_URL = "http://localhost:1234/v1/completions";

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-r1-distill-qwen-7b",
     // model: "mistral-7b-instruct-v0.3",
      prompt: Question,
      temperature: 0.3,
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
      if (isJSON(data.choices[0].text)) {
        let parsedResponse = data.choices[0].text;
        results.value.correction.push({
          axis: currentAxis,
          response: parsedResponse,
          score: parsedResponse.score,
        });
        results.value.AImodel = data.model;
        results.value.temperature = 0.3;
        results.value.max_tokens = 1000;
      } else {
        let parsedResponse = extractJsonFromResponse(data.choices[0].text);
        if (parsedResponse) {
          results.value.correction.push({
            axis: currentAxis,
            response: parsedResponse,
            score: parsedResponse.score
          });
          results.value.AImodel = data.model;
          results.value.temperature = 0.3;
          results.value.max_tokens = 1000;

        } else {
          console.error(`Tentative ${attempt}: Impossible d'extraire une réponse JSON valide.`);

          // 🔄 Relancer l'API si on n'a pas atteint la limite des tentatives
          if (attempt < maxRetries) {
            console.warn(`Relance de l'API... Tentative ${attempt + 1}`);
            askLMStudio(Question, currentAxis, attempt + 1, maxRetries);
          } else {
            console.error("Échec après plusieurs tentatives.");
          }
        }

      }
      // Extraire uniquement la partie JSON





      isLoading.value = false;
    })
    .catch(error => {
      console.error("Erreur :", error);
      isLoading.value = false;
    });
};

function isJSON(str) {
  if (typeof str !== "string") {
    return false; // Doit être une chaîne de caractères
  }

  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null;
  } catch (e) {
    return false; // Erreur de parsing => pas un JSON valide
  }
}

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
    studentAnswers.value = ''; // Réinitialiser la réponse
    results.value.correction = []; // Vider les corrections
    showReport.value = false; // Cacher le rapport de correction
  }
};


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
  color: white
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
</style>