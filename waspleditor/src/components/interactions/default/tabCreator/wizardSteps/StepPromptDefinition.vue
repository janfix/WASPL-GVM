<template>
  <div>
    <h4>{{ title }}</h4>
    <p>The main prompt must focuse on content. Precise here the domain, specific subjects or instructions. For example you can mention or add a text (or any stimuli) that will be the object of the questions.</p>

    <div class="accordion" id="accordionExample">
  <div class="accordion-item">
    <h2 class="accordion-header" id="headingOne">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#AIExample" aria-expanded="true" aria-controls="collapseOne">
        Prompt examples :
      </button>
    </h2>
    <div id="AIExample" class="accordion-collapse collapse hide" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
      <div class="accordion-body">
        <ul>
          <li>The questions will be about DNA and the role of epigenetics in its evolution.</li>
          <li>The questions will test the student's mastery of solving Euclidean equations.</li>
          <li>The questions will assess the student's understanding of the principles of photosynthesis.</li>
        </ul>
        
      </div>
    </div>
  </div>
</div>
<br>

    <div class="form-floating mb-3">
      <textarea
        class="form-control"
        v-model="localPrompt"
        placeholder="Main Prompt"
        style="height: 150px"
      ></textarea>
      <label>Main Prompt</label>
    </div>

    <div class="form-floating mb-3">
      <select class="form-select" v-model="localInteraction">
        <option disabled value="">-- Select interaction type --</option>
        <option value="choice">Choice</option>
        <option value="order">Order</option>
        <option value="shortAnswer">Short Answer</option>
        <option value="textGaps">Text Gaps</option>
        <option value="message">Message</option>
      </select>
      <label>Interaction Type</label>
    </div>

    <div class="form-floating mb-3">
      <input type="number" class="form-control" v-model="localNbQuestions" min="1" />
      <label>Number of questions</label>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  mainPrompt: String,
  selectedInteraction: String,
  nbQuestions: Number,
  mode: String,
  step: Number
});

const emit = defineEmits([
  'update:mainPrompt',
  'update:selectedInteraction',
  'update:nbQuestions'
]);

const localPrompt = ref(props.mainPrompt);
const localInteraction = ref(props.selectedInteraction);
const localNbQuestions = ref(props.nbQuestions);

watch(localPrompt, (val) => emit('update:mainPrompt', val));
watch(localInteraction, (val) => emit('update:selectedInteraction', val));
watch(localNbQuestions, (val) => emit('update:nbQuestions', val));

const title = computed(() => {
  const total = props.mode === 'api' ? 5 : 4;
  return `Step ${props.step}/${total}: Prompt Definition`;
});
</script>