<template>
  <div>
    <h4>{{ title }}</h4>
    <pre id="Prompt" class="bg-dark text-light p-3">
      You are an expert in didactic of  {{ currentSubject }} and particulary in : {{ currentDomain }},
      These questions will be delivered to {{ currentLevel }} students.
      {{ mainPrompt }}
      I need {{ nbQuestions }} questions using the interaction {{ selectedInteraction }} JSON model, 
      {{ promptTemplates[selectedInteraction]?.() }}
      Here is the JSON model: 
      {{ jsonModelText }}
      
      

    </pre>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useTestStore } from '@/stores/testStore';
import choiceModel from "../../../choice/model.json";
import orderModel from "../../../order/model.json";
import messageModel from "../../../message/model.json";
import shortAnswer from "../../../shortAnswer/model.json";
import textGaps from "../../../textGaps/model.json";

const testStore = useTestStore();
const currentSubject = computed(() => testStore.testData?.Subject || 'Test subject');
const currentDomain = computed(() => testStore.testData?.domain || 'Test Domain');
const currentLevel = computed(() => testStore.testData?.level || 'Test level');
const promptTemplates = {
  choice: () => `Each question must include:
    - "el_ID" : is a unique identifier for the question
    - "el_Text": a clear question
    - "el_RichText": some context or instruction
    - "options": between 4 and 6 choices, with at least one correct (using keys "isCorrect" and "weight") each option as a unique id based on the question id.
    - "multiple": true or false depending on whether multiple answers are possible
    - "randomized": true if the choices should be shuffled
    - "feedback.correct" and "feedback.incorrect": feedback texts
    - "tip": a hint
    - "maxScore": total score
    - "isNewElement": false
    Return a JSON array strictly following this structure, with no additional explanation: 
`,

  order: () =>
    `Each question must include an instruction, a list of items to be ordered, and follow a coherent JSON structure.
    - "el_Text": a clear question
    - "el_RichText": some context or instruction
    - "labels" : a list of label to reorder
    - "maxScore": 1
    - "isNewElement": false
    `,

  shortAnswer: () =>
    `Each question must include:
- "el_Text": a clear instruction written as an open-ended question.
- "el_RichText": optional supporting content (e.g., context, reading passage, or excerpt).
- "correctionAxes": an evaluation rubric consisting of 3 to 5 simple criteria, each stated affirmatively (e.g., "the answer is clear").
    Each axis must contain the following fields:
    - "axis": the criterion description
    - "point": maximum points assigned to this criterion (default 10)
    - "penalty": points deducted if the criterion is not met (default 10)
- "isNewElement": false

The expected output is a **strictly formatted JSON array**, without any additional text or explanation:

\`\`\`json
[
  {
    "el_ID": "QSA0001",
    "el_Type": "shortAnswer",
    "el_Text": "Write here your main question",
    "el_RichText": "You can use this Rich text editor for prompt",
    "correctionAxes" : [
      { "axis" : "check if the answer is correct", "point": 10, "penalty" : 10 },
      { "axis" : "check if the answer is clear", "point": 10, "penalty" : 10 },
      { "axis" : "check if the answer is complete", "point": 10, "penalty" : 10 },
      { "axis" : "check if the answer is concise", "point": 10, "penalty" : 10 },
      { "axis" : "check if all the expected elements are present", "point": 10, "penalty" : 10 }
    ],
    "isNewElement": false
  }
]
\`\`\`
`,

  textGaps: () =>
    `Each question must include:
- "el_Text": a simple instruction introducing the exercise.
- "el_RichText": a contextual field which may contain an image or additional instructions.
- "el_GapsedText": HTML content containing one or more words wrapped in a <span class='tagged'> tag (these are the target blanks). Example:
  "<p>The <span class='tagged'>cat</span> is <span class='tagged'>black</span>.</p>"
- "gaps": an array of objects describing each missing word, with:
    - "id": a numeric identifier
    - "label": the expected word (must match exactly what is in the span)
    - "weight": the score assigned to this word (default 1)
- "maxScore": sum of the weights for all correct answers
- "feedback.correct" and "feedback.incorrect": messages shown based on performance
- "tip": an optional hint
- "isNewElement": false

Grading is based on **exact match** (case-sensitive) between the student's input and the expected word in the "label".

Return a **strictly formatted JSON array** using the following structure, with no extra text or comments:

\`\`\`json
[
  {
    "el_ID": "QTG0001",
    "el_Type": "textGaps",
    "el_Text": "Fill the gaps!",
    "el_RichText": "Add formatted text or an image using the rich editor",
    "el_GapsedText": "<h1>Beautiful day</h1><p>This <span class='tagged' style='background-color: yellow;'>test</span> is a high level <span class='tagged' style='background-color: yellow;'>text</span> with <span class='tagged' style='background-color: yellow;'>cold</span> ice and the <span class='tagged' style='background-color: yellow;'>history</span> of <span class='tagged' style='background-color: yellow;'>Water</span> ball and <span class='tagged' style='background-color: yellow;'>guns</span>.</p>",
    "gaps": [
      { "id": 0, "label": "test", "weight": 1 },
      { "id": 1, "label": "text", "weight": 1 },
      { "id": 2, "label": "cold", "weight": 1 },
      { "id": 3, "label": "history", "weight": 1 },
      { "id": 4, "label": "Water", "weight": 1 },
      { "id": 5, "label": "guns", "weight": 1 }
    ],
    "maxScore": "6",
    "feedback": {
      "correct": "Correct!",
      "incorrect": "Incorrect."
    },
    "tip": "",
    "isNewElement": false
  }
]
\`\`\`
`
  // other interaction types can be added progressively…
};



const jsonModelText = ref("");
const props = defineProps({
  mode: String,
  step: Number,
  selectedInteraction: String,
  nbQuestions: Number,
  mainPrompt: [String, Object],
});

const title = computed(() => {
  const total = props.mode === 'api' ? 5 : 4;

  return `Step ${props.step}/${total}: Prompt Review`;
});

// Charger le modèle JSON correspondant à l'interaction sélectionnée
const loadInteractionModel = async () => {
  if (props.selectedInteraction === "choice") {
    jsonModelText.value = JSON.stringify(choiceModel, null, 2);
  } else if (props.selectedInteraction === "order") {
    jsonModelText.value = JSON.stringify(orderModel, null, 2);
  } else if (props.selectedInteraction === "message") {
    jsonModelText.value = JSON.stringify(messageModel, null, 2);
  } else if (props.selectedInteraction === "shortAnswer") {
    jsonModelText.value = "";
    //jsonModelText.value = JSON.stringify(shortAnswer, null, 2);
  } else if (props.selectedInteraction === "textGaps") {
    //jsonModelText.value = JSON.stringify(textGaps, null, 2);
    jsonModelText.value = "";
  } else {
    jsonModelText.value = "";
  }
  //console.log(jsonModelText.value)
};


watch(() => props.selectedInteraction, () => {
  loadInteractionModel();
}, { immediate: true }); // pour que ça se lance dès le début



const emit = defineEmits(['updatePrompt']);
const fullPrompt = computed(() => {
  return `
You are an expert in didactic of ${currentSubject.value} and particularly in: ${currentDomain.value}.
These questions will be delivered to ${currentLevel.value} students.

${props.mainPrompt}

I need ${props.nbQuestions} questions using the interaction ${props.selectedInteraction} JSON model.
${promptTemplates[props.selectedInteraction]?.()}

Here is the JSON model:
${jsonModelText.value}
  `.trim();
});

// Émission automatique dès que le prompt est prêt
watch(fullPrompt, () => {
  emit('updatePrompt', fullPrompt.value);
}, { immediate: true });







</script>