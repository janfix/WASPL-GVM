<template>
  <div class="preview-section">

    <div v-if="selectedElement" class="card card-preview">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Preview'" />
      <div class="card-body">
        <div class="mb-2">
          <h3>{{ selectedElement.el_Text }}</h3>
        </div>
        <div v-show="!isQuillEmpty" class="quill-editor" ref="quillEditor"></div>

        <div class="AllFeedbacks" v-if="showReport">
          <div v-if="results.mark >= 1 && selectedElement.feedback.correct" class="PositiveFeebackContainer">

            {{ selectedElement.feedback.correct }}
          </div>
          <div v-else-if="results.mark < 1 && selectedElement.feedback.incorrect" class="NegativeFeebackContainer">
            {{ selectedElement.feedback.incorrect }}
          </div>
        </div>

        <!-- Single Choice (Radio Buttons) -->
        <div v-if="!isMultiple" class="mb-3 mt-4 ml-4">
          <div v-for="(option, index) in selectedElement.options" :key="index" class="mb-2">
            <div class="input-group">
              <input :id="'option-' + index" type="radio" :value="option.id" v-model="studentAnswers"
                name="singleChoice" />
              <label :for="'option-' + index" style="margin-left: 10px; cursor: pointer;">
                {{ option.text }}
              </label>
            </div>
          </div>
        </div>

        <!-- Multiple Choice (Checkboxes) -->
        <!-- Multiple Choice (Checkboxes) -->
        <div v-else-if="isMultiple" class="mb-3 mt-4 ml-4">
          <div v-for="(option, index) in selectedElement.options" :key="index" class="mb-2">
            <div class="input-group">
              <input :id="'option-' + index" type="checkbox" :value="option.id" v-model="studentAnswers" />
              <label :for="'option-' + index" style="margin-left: 10px; cursor: pointer;">
                {{ option.text }}
              </label>
            </div>
          </div>
        </div>

        <div class="hintContainer" v-if="displayHintButton">
          <button @click="HandlerShowHint" class="hintBT btn btn-primary btn-sm">Hint!</button>
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
          <p><strong>Your Answers:</strong> {{ results.selectedOptions.join(', ') }}</p>
          <p><strong>Score:</strong> {{ results.score }} </p>
          <p><strong>Max-Score:</strong> {{ selectedElement.maxScore }} </p>
          <p><strong>Penalties:</strong> {{ results.error }}</p>
          <!--  <p><strong>Mark:</strong> {{ (results.mark * 100).toFixed(0) }}%</p> -->
          <p><strong>Hint was used : </strong>{{ results.hint }}</p>

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
import { useTestStore } from '../../../stores/testStore';
import { computed, ref, onMounted, watch, watchEffect } from 'vue';
import Quill from 'quill'

const store = useTestStore();

const quillEditor = ref(null); // Référence pour le conteneur HTML de Quill
let quillInstance = null; // Instance de Quill

const selectedElement = computed(() => store.selectedElement);
const elementLabel = computed(() => store.selectedElementLabel);
let isQuillEmpty = ref(true);

const isMultiple = computed(() => selectedElement.value?.multiple === true);

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

/* const toggleCheckbox = (id) => {
  const index = studentAnswers.value.indexOf(id);
  if (index === -1) {
    studentAnswers.value.push(id);
  } else {
    studentAnswers.value.splice(index, 1);
  }
}; */

// Mélanger les options de l'élément sélectionné
const shuffleOptions = () => {
  if (selectedElement.value?.options) {
    selectedElement.value.options = shuffleArray([...selectedElement.value.options]);
  }
};


// Variable pour stocker les réponses de l'utilisateur
const studentAnswers = ref([]);

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
});

// Surveiller les changements de `selectedElement` pour réinitialiser `studentAnswers`
watchEffect(() => {
  const element = selectedElement.value;
  if (element) {
    // Réinitialiser les réponses
    studentAnswers.value = element.multiple ? [] : null;

    // Mettre à jour Quill
    if (quillInstance) {
      quillInstance.root.innerHTML = element.el_RichText || '';
      adjustQuillHeight();

      const plainText = element.el_RichText.replace(/<[^>]*>?/gm, '').trim();
      isQuillEmpty.value = plainText.length === 0;
    }

    // Si randomisé, mélanger les options
    if (element.randomized) {
      shuffleOptions();
    }
  }
});


// Observer uniquement el_RichText pour les mises à jour en temps réel
watch(
  () => selectedElement.value?.el_RichText,
  (newValue) => {
    if (quillInstance && newValue !== quillInstance.root.innerHTML) {
      quillInstance.root.innerHTML = newValue || ''; // Met à jour le contenu
      adjustQuillHeight(); // Ajuste la hauteur
      const plainText = newValue.replace(/<[^>]*>?/gm, '').trim();
      if (plainText.length === 0) {
        isQuillEmpty.value = true;
      } else {
        isQuillEmpty.value = false;
      }
    }
  }
);



// Fonction pour réinitialiser les sélections
const resetSelections = () => {
  console.log(selectedElement.value.randomized)
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

const showReport = ref(false);
const showHint = ref(false);
const results = ref({
  score: 0,
  error: 0,
  mark: 0,
  selectedOptions: [],
  hint: false
});

// Fonction pour soumettre les réponses
const submitAnswers = () => {
  if (!selectedElement.value) return;
  if (studentAnswers.value === null || (Array.isArray(studentAnswers.value) && studentAnswers.value.length === 0)) {
    alert("Please choose an answer !");
    return;
  }

  // Reset
  results.value.selectedOptions = [];
  results.value.score = 0;
  results.value.error = 0;

  // Vérifier les réponses
  selectedElement.value.options.forEach((option) => {
    if (studentAnswers.value.includes(option.id)) {
      results.value.selectedOptions.push(option.text);
      const weight = parseInt(option.weight ?? 1) || 0;
      if (option.isCorrect) {
        results.value.score += weight;
      } else {
        results.value.error += weight;
      }
    }
  });

  const maxScore = selectedElement.value.maxScore || selectedElement.value.options.filter(o => o.isCorrect).length;
  
  // ⚠️ Correction ici : le mark est normalisé sur 1
  results.value.mark = results.value.score / maxScore;

  showReport.value = true;
};



const closeReport = () => {
  showReport.value = false;
}

const HandlerShowHint = () => {
  showHint.value = true;
  results.value.hint = true;
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

.card-header {
  background-color: #426C9C;
  color: white;
}

.quill-editor {
  height: auto !important;
  border: 1px solid #ccc;
  overflow: hidden !important;
  transition: height 0.3s ease;
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
</style>
