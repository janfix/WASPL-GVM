<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" :mode="'Editor'" />
      <div class="card-body">
        <form>
          <!-- Input for Main Prompt -->
          <div class="mb-3">
            <h3>
              <input placeholder="Main prompt" type="text" class="inputMainPrompt" v-model="selectedElement.el_Text"
                @input="updateElement('el_Text', selectedElement.el_Text)" />
            </h3>
          </div>

          <!-- Quill Editor -->
          <div class="form-group mb-3">
            <div ref="quillEditor" class="quill-editor"></div>
          </div>

          <!-- Choice Parameters -->
          <div class="choiceParams row mb-4">
            <div class="col">
              <h5 class="mt-2">Choices Parameters</h5>
            </div>
            <!-- Single/Multiple Buttons -->
            <div class="col">
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !selectedElement.multiple }"
                  @click="setChoiceType(false)">
                  Single choice
                </button>
                <button type="button" class="btn btn-sm" :class="{ 'btn-primary': selectedElement.multiple }"
                  @click="setChoiceType(true)">
                  Multiple choice
                </button>
              </div>
            </div>
            <!-- Random/Fixed Buttons -->
            <div class="col">
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !selectedElement.randomized }"
                  @click="setRandom(false)">
                  Fixed
                </button>
                <button type="button" class="btn btn-sm" :class="{ 'btn-primary': selectedElement.randomized }"
                  @click="setRandom(true)">
                  Random
                </button>
              </div>
            </div>
          </div>

          <!-- Options List -->
          <div v-if="selectedElement.options" class="mb-3">
            <div v-for="(option, index) in selectedElement.options" :key="index" class="input-group mb-2">
              <input type="text" class="form-control" v-model="option.text" placeholder="Option Text"
                @input="updateOption(index, 'text', option.text)" />
              <div class="input-group-text">
                <!-- Dynamique entre checkbox et radio -->
                <label class="inputWeightLabel">Weight:</label>
                <input class="inputWeight" type="number" name="weight" v-model="option.weight">
                <template v-if="selectedElement.multiple">
                  <input type="checkbox" v-model="option.isCorrect"
                    @change="updateOption(index, 'isCorrect', option.isCorrect)" />
                  <label class="ml-2">Correct</label>
                </template>
                <template v-else>
                  <!-- Mode Single Choice : Radio -->
                  <input type="radio" :name="'singleChoiceGroup'" :checked="option.isCorrect"
                    @change="updateOption(index, 'isCorrect', true)" />
                  <label class="ml-2">Correct</label>
                </template>

                <button type="button" @click="deleteOption(index)" class="trashChoice">
                  <i class="fa fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
          <div v-if="validationErrors.length > 0" class="alert alert-warning mt-2">
            <ul>
              <li v-for="(error, index) in validationErrors" :key="index">
                {{ error }}
              </li>
            </ul>
          </div>

          <button type="button" class="btn btn-primary btn-sm" @click="addOption">+ Add Option</button>

          <!-- Feedback and Hint -->
          <div class="form-floating hintContainer mt-4">
            <input type="text" name="hint" class="form-control" placeholder="Hint" v-model="selectedElement.tip"
              @input="updateElement('tip', selectedElement.tip)" />
            <label for="hintText">Hint</label>
          </div>
          <div class="form-floating feedback mt-4">
            <input type="text" name="positiveFeedback" class="form-control" placeholder="Positive feedback"
              v-model="selectedElement.feedback.correct"
              @input="updateElement('feedback.correct', selectedElement.feedback.correct)" />
            <label for="positiveFeedback">Positive feedback</label>
          </div>
          <div class="form-floating feedback mt-4">
            <input type="text" name="negativeFeedback" class="form-control" placeholder="Negative feedback"
              v-model="selectedElement.feedback.incorrect"
              @input="updateElement('feedback.incorrect', selectedElement.feedback.incorrect)" />
            <label for="negativeFeedback">Negative feedback</label>
          </div>

          <!-- Save Buttons -->
          <!--  <div class="form-actions mt-3">
            <button type="button" class="btn btn-primary" @click="saveTest">Save Changes</button>
          </div> -->
        </form>
      </div>
      <dimension />
      <div class="card-footer">        
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" :isItemBank />
      </div>
    </div>
    <div v-else class="alert alert-info">Select an element to edit</div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import Quill from 'quill';
import cardHeader from '../default/cardHeader.vue';
import EditorActionBar from '../default/EditorActionBar.vue';
import dimension from '../default/dimension.vue';
import { useTestStore } from '../../../stores/testStore';

// Définir les props Pour l'adaptation de l'action bar footer au contexte : TEST or ITEM BANK
const props = defineProps({
  isItemBank: {
    type: Boolean,
    default: false
  }
});
const validationErrors = ref([]);

const store = useTestStore();
const quillEditor = ref(null);
let quillInstance = null;

const selectedElement = computed(() => store.selectedElement || { el_Text: '', options: [], feedback: {} });

// Synchronize label
const elementLabel = ref('');
watch(() => store.selectedElementLabel, (newLabel) => {
  elementLabel.value = newLabel || ''
}, { immediate: true })

// Watch selectedElement and update Quill when it changes
watch(selectedElement, (newElement) => {

  if (quillInstance && newElement?.el_RichText) {
    quillInstance.clipboard.dangerouslyPasteHTML(newElement.el_RichText);
  } else if (quillInstance) {
    quillInstance.setText(''); // Efface le contenu de l'éditeur si el_RichText est vide
  }
});


// Quill editor initialization
onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: {
        toolbar: [
          ['bold', 'italic', 'underline'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
        ],
      },
    });

    // Initialize Quill content if el_RichText exists
    if (selectedElement.value?.el_RichText) {
      quillInstance.clipboard.dangerouslyPasteHTML(selectedElement.value.el_RichText);
    }

    // Synchronize changes in Quill with el_RichText
    quillInstance.on('text-change', () => {

      if (selectedElement.value) {
        selectedElement.value.el_RichText = quillInstance.root.innerHTML;

        if (props.isItemBank) {
          console.log("isItemBank is true. Skipping store.updateElement.");
          return;
        }
        store.updateElement({ ...selectedElement.value });
      }
    });
  }
});


// Utility methods
const updateElement = (key, value) => {
  if (!props.isItemBank) {
    // Sauvegarde automatique uniquement dans le contexte du test
    console.log(`Updating element in test context: key=${key}, value=${value}`);
    if (selectedElement.value) {
      const keys = key.split('.');
      let obj = selectedElement.value;
      while (keys.length > 1) obj = obj[keys.shift()];
      obj[keys[0]] = value;
      store.updateElement(selectedElement.value);
    }
  } else {
    // Logique spécifique à l'Item Bank (si nécessaire)
    console.log("Item Bank context detected. No auto-save triggered.");
  }
};

const addOption = () => {
  const optionID = `option_${selectedElement.value.options.length}_${Date.now()}`;
  const newOption = { id: optionID, text: '', isCorrect: false, weight: 0 };
  selectedElement.value.options.push(newOption);
  calculateMaxScore();
  validateWeights();
  if (props.isItemBank) {
    alert("isItemBank is true. Skipping store.updateElement.")
    console.log("isItemBank is true. Skipping store.updateElement.");
    return;
  }
  store.updateElement(selectedElement.value);
};

const updateOption = (index, key, value) => {
  if (key === "isCorrect") {
    if (!selectedElement.value.multiple) {
      // Mode Single Choice : Met toutes les autres options à `false`
      selectedElement.value.options.forEach((option, i) => {
        option.isCorrect = (i === index); // Seule l'option sélectionnée devient `true`
      });
    } else {
      // Mode Multiple Choice : Comportement normal des checkboxes
      selectedElement.value.options[index].isCorrect = value;
    }
  } else {
    selectedElement.value.options[index][key] = value;
  }

  calculateMaxScore();
  validateWeights();
  store.updateElement(selectedElement.value);
};


const deleteOption = (index) => {
  selectedElement.value.options.splice(index, 1);
  calculateMaxScore();
  validateWeights();
};

const setChoiceType = (isMultiple) => {
  updateElement('multiple', isMultiple);
  calculateMaxScore(); // Recalculer car le mode de choix change
};
const setRandom = (isRandom) => updateElement('randomized', isRandom);

const saveTest = () => store.saveTestData();



watch(
  () => selectedElement.value.options,
  () => {
    calculateMaxScore();
  },
  { deep: true }
);


const calculateMaxScore = () => {
  if (!selectedElement.value || !selectedElement.value.options) return;

  if (!selectedElement.value.multiple) {
    // Mode "Single Choice": Prendre le poids de la seule bonne réponse
    const correctOption = selectedElement.value.options.find(option => option.isCorrect && option.weight > 0);
    updateElement('maxScore', correctOption ? correctOption.weight : 0);
  } else {
    // Mode "Multiple Choice": Somme des poids des bonnes réponses
    const totalScore = selectedElement.value.options
      .filter(option => option.isCorrect && option.weight > 0) // Exclure poids négatifs et mauvaises réponses
      .reduce((sum, option) => sum + option.weight, 0);

    updateElement('maxScore', totalScore);
  }
};

const validateWeights = () => {
  validationErrors.value = [];

  const isMultiple = selectedElement.value.multiple;
  const correctOptions = selectedElement.value.options.filter(option => option.isCorrect);
  const incorrectOptions = selectedElement.value.options.filter(option => !option.isCorrect);

  if (!isMultiple) {
    // Mode "Single Choice"
    if (correctOptions.length !== 1) {
      validationErrors.value.push("Une seule option doit être correcte.");
    } else {
      const correctOption = correctOptions[0];
      if (correctOption.weight <= 0) {
        validationErrors.value.push("La seule bonne réponse doit avoir un poids positif.");
      }
    }

    incorrectOptions.forEach(option => {
      if (option.weight > 0) {
        validationErrors.value.push(`Une option incorrecte a un poids positif.`);
      }
    });

  } else {
    // Mode "Multiple Choice"
    correctOptions.forEach(option => {
      if (option.weight <= 0) {
        validationErrors.value.push(`Une option correcte a un poids nul ou négatif.`);
      }
    });

    incorrectOptions.forEach(option => {
      if (option.weight > 0) {
        validationErrors.value.push(`Une option incorrecte a un poids positif.`);
      }
    });
  }

  if (validationErrors.value.length === 0) {
    validationErrors.value = [];
  }
};




watch(
  () => [selectedElement.value.options, selectedElement.value.multiple],
  () => {
    validateWeights();
  },
  { deep: true }
);

watch(
  () => ({
    options: selectedElement.value.options,
    el_Text: selectedElement.value.el_Text,
    tip: selectedElement.value.tip,
    feedback: selectedElement.value.feedback,
    multiple: selectedElement.value.multiple,
    randomized: selectedElement.value.randomized,
  }),
  () => {
    calculateMaxScore(); // Mise à jour du score max en cas de modification
    validateWeights(); // Vérifier les erreurs
    store.updateElement(selectedElement.value); // Enregistrement automatique
  },
  { deep: true }
);



</script>

<style scoped>
.btn-sm {
  font-size: 0.875rem !important;
  padding: 0.25rem 0.5rem !important;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.quill-editor {
  border: 1px solid #ccc;
  height: auto;
  overflow: hidden;
}



.inputWeight {
  width: 60px;
  border: gainsboro 1px solid;
  border-radius: 5px;
  margin-right: 5px;
}

.inputWeightLabel {
  margin-right: 20px;
  margin-left: 5px;
}

.elementLabel {
  color: white;
  background-color: #426C9C;
  border-top-right-radius: 0px;
  border-bottom-right-radius: 0px;
}

.elementLabelInput {
  margin-top: 1px;
  height: 2.6em;
  border: 1px solid #426C9C;
}

.trashChoice {
  color: #495057;
  margin-left: 20px;
  border: none;
  background-color: transparent;
  font-size: 0.8em;
}

.trashChoice:hover {
  font-size: 1em;
  color: orange;

}

.mr-2 {
  margin-right: 10px;
}

.ml-2 {
  margin-left: 10px;
}

.mb-2 {
  margin-bottom: 10px;
}

.inputWeight {
  width: 60px;
  border: gainsboro 1px solid;
  border-radius: 5px;
}

.inputWeightLabel {
  margin-right: 20px;
  margin-left: 5px;
}

.btn-group {
  border: 1px solid gainsboro;
}


</style>
