<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <cardHeader :elementLabel="elementLabel" :elementType="selectedElement.el_Type" mode="Editor" />
      <div class="card-body">
        <!-- Main Prompt -->
        <div class="mb-3">
          <h3>
            <input type="text" class="inputMainPrompt" v-model="selectedElement.el_Text"
              @input="updateElement('el_Text', selectedElement.el_Text)" placeholder="Main prompt" />
          </h3>
        </div>

        <!-- Global Quill Editor (Instruction) -->
        <div class="form-group mb-3">
          <div ref="quillEditor" class="quill-editor"></div>
        </div>

        <!-- Parameters -->
        <div class="row mb-4">
          <div class="col">
            <h5>Choices Parameters</h5>
          </div>
          <div class="col">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !selectedElement.multiple }"
                @click="setChoiceType(false)">Single choice</button>
              <button type="button" class="btn btn-sm" :class="{ 'btn-primary': selectedElement.multiple }"
                @click="setChoiceType(true)">Multiple choice</button>
            </div>
          </div>
          <div class="col">
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-sm" :class="{ 'btn-primary': !selectedElement.randomized }"
                @click="setRandom(false)">Fixed</button>
              <button type="button" class="btn btn-sm" :class="{ 'btn-primary': selectedElement.randomized }"
                @click="setRandom(true)">Shuffle</button>
            </div>
          </div>
        </div>

        <!-- Option blocks with QuillBlock component -->
        <div v-for="(option, index) in selectedElement.options" :key="option.id" class="mb-4">
          <div class="row" style="margin-bottom: 60px;">
            <div class="col-8">
              <QuillBlock 
                v-model="option.richText"  
                @update:modelValue="(val) => updateOption(index, 'richText', val)"/>
            </div>
            <div class="col-4">
              <div class="controls mt-2">
                <div class="row">
                  <div class="col">
                    <input type="checkbox" v-model="option.isCorrect"
                      @change="updateOption(index, 'isCorrect', option.isCorrect)"
                      title="If correct is checked, only positive weight, if not checked, only 0 or negative weight" />
                    <label style="margin-left: 5px;">Correct</label>
                  </div>
                </div>
                <div class="row mt-2">
                  <div class="col">
                    <label style="margin-right: 5px;">Weight:</label>
                  </div>
                  <div class="col">
                    <input min="1" type="number" v-model="option.weight" @input="updateOption(index, 'weight', option.weight)"
                      title="If correct is checked, only positive weight, if not checked, only 0 or negative weight" />
                  </div>
                </div>
                <div class="row mt-2">
                  <div class="col"><button @click="deleteOption(index)" class="btn btn-sm btn-danger">🗑</button></div>
                </div>
              </div>
            </div>
          </div>


        </div>

        <button class="btn btn-primary btn-sm" @click="addOption">+ Add Option</button>

        <!-- Hint and Feedback -->
        <div class="form-floating hintContainer mt-4">
          <input type="text" class="form-control" placeholder="Hint" v-model="selectedElement.tip"
            @input="updateElement('tip', selectedElement.tip)" />
          <label>Hint</label>
        </div>
        <div class="form-floating feedback mt-4">
          <input type="text" class="form-control" placeholder="Positive feedback"
            v-model="selectedElement.feedback.correct"
            @input="updateElement('feedback.correct', selectedElement.feedback.correct)" />
          <label>Positive feedback</label>
        </div>
        <div class="form-floating feedback mt-4">
          <input type="text" class="form-control" placeholder="Negative feedback"
            v-model="selectedElement.feedback.incorrect"
            @input="updateElement('feedback.incorrect', selectedElement.feedback.incorrect)" />
          <label>Negative feedback</label>
        </div>
      </div>
      <dimension />
      <div class="card-footer">
        <EditorActionBar :selectedElement="selectedElement" :elementLabel="elementLabel" :isItemBank="isItemBank" />
      </div>
    </div>
    <div v-else class="alert alert-info">Select an element to edit</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import Quill from 'quill';
import cardHeader from '../default/cardHeader.vue';
import EditorActionBar from '../default/EditorActionBar.vue';
import QuillBlock from './QuillBlock.vue';
import { useTestStore } from '../../../stores/testStore';
import dimension from '../default/dimension.vue'; 

const props = defineProps({
  isItemBank: Boolean
});

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement || { options: [], feedback: {} });
const elementLabel = computed(() => store.selectedElementLabel);

const quillEditor = ref(null);
let quillInstance = null;

onMounted(() => {
  if (quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      modules: { toolbar: [['bold', 'italic'], ['link', 'image']] }
    });
    if (selectedElement.value.el_RichText) {
      quillInstance.clipboard.dangerouslyPasteHTML(selectedElement.value.el_RichText);
    }
    quillInstance.on('text-change', () => {
      selectedElement.value.el_RichText = quillInstance.root.innerHTML;
      store.updateElement(selectedElement.value);
    });
  }

    // Nouvelle logique pour s'assurer que chaque option ait un weight par défaut
    selectedElement.value.options.forEach(option => {
    if (option.weight === undefined || option.weight === null || option.weight === '') {
      option.weight = 1;
    }
  });
  store.updateElement(selectedElement.value);
});

const updateElement = (key, value) => {
  const keys = key.split('.');
  let target = selectedElement.value;
  while (keys.length > 1) target = target[keys.shift()];
  target[keys[0]] = value;
  store.updateElement(selectedElement.value);
};

const addOption = () => {
  const id = `opt_${Date.now()}`;
  selectedElement.value.options.push({ id, richText: '', isCorrect: false, weight: 1 });
  store.updateElement(selectedElement.value);
};

const deleteOption = (index) => {
  selectedElement.value.options.splice(index, 1);
  store.updateElement(selectedElement.value);
};

const updateOption = (index, key, value) => {
  selectedElement.value.options[index][key] = value;
  store.updateElement(selectedElement.value);
};

const setChoiceType = (isMultiple) => updateElement('multiple', isMultiple);
const setRandom = (isRandom) => updateElement('randomized', isRandom);
</script>

<style scoped>
.quill-editor {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 1rem;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.btn-group {
  border: 1px solid #ccc;
}
</style>
