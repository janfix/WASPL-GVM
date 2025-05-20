<template>
    <div class="ai-interaction">
        <button title="Open AI - Chat GPT Call" type="button" class="btn btn-primary btn-sm" @click="callAPI">
            Call AI API
        </button>

        <div v-if="loading" class="mt-3">
            <p>Loading...</p>
        </div>

        <div v-if="error" class="alert alert-danger mt-3">
            <p>{{ error }}</p>
        </div>

        <div v-if="result" class="json-result mt-3">
            <h5>Generated JSON:</h5>
            <pre>{{ result }}</pre>
        </div>
    </div>
</template>

<script setup>

/* Rappel : 2 requêtes sont nécessaires : 
1. pour définir le texte de la question : temperature 0.5
2. pour définir le JSON de la question : temperature 0
*/

import { ref } from "vue";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid'; // Importer UUID
import { useTestStore } from '../stores/testStore'
const store = useTestStore()

const loading = ref(false);
const error = ref(null);
const result = ref(null);
const el_ID = store.selectedElement.el_ID;
const newEl_ID = uuidv4();
const activePage = store.getElementPage(el_ID);
console.log(activePage.id)


// Mock pour le mode test
const isTestMode = true;
const mockJsonResponse = `[
    {
      "el_ID": "RG001",
      "el_Type": "choice",
      "el_Text": "What is Ricky Gervais best known for?",
      "el_RichText": "Ricky Gervais is a famous comedian and actor. What is his most iconic role?",
      "options": [
        { "id": "RG001_choice1", "text": "The Office (UK)", "isCorrect": true, "weight": 1 },
        { "id": "RG001_choice2", "text": "Parks and Recreation", "isCorrect": false, "weight": 0 },
        { "id": "RG001_choice3", "text": "Friends", "isCorrect": false, "weight": 0 },
        { "id": "RG001_choice4", "text": "Brooklyn Nine-Nine", "isCorrect": false, "weight": 0 },
        { "id": "RG001_choice5", "text": "After Life", "isCorrect": true, "weight": 1 }
      ],
      "multiple": true,
      "maxScore": "2",
      "feedback": { "correct": "Correct!", "incorrect": "Incorrect." },
      "tip": "Think about British sitcoms or his recent Netflix show.",
      "randomized": true,
      "isNewElement": true
    },
    {
      "el_ID": "RG002",
      "el_Type": "choice",
      "el_Text": "Which award show did Ricky Gervais famously host multiple times?",
      "el_RichText": "Ricky Gervais is known for his controversial humor. Which award show did he host?",
      "options": [
        { "id": "RG002_choice1", "text": "The Oscars", "isCorrect": false, "weight": 0 },
        { "id": "RG002_choice2", "text": "The Golden Globes", "isCorrect": true, "weight": 1 },
        { "id": "RG002_choice3", "text": "The Grammys", "isCorrect": false, "weight": 0 },
        { "id": "RG002_choice4", "text": "The Emmys", "isCorrect": false, "weight": 0 },
        { "id": "RG002_choice5", "text": "The BAFTAs", "isCorrect": false, "weight": 0 }
      ],
      "multiple": false,
      "maxScore": "1",
      "feedback": { "correct": "Correct!", "incorrect": "Incorrect." },
      "tip": "Think about his sharp humor aimed at Hollywood stars.",
      "randomized": true,
      "isNewElement": true
    },
    {
      "el_ID": "RG003",
      "el_Type": "choice",
      "el_Text": "What was Ricky Gervais' role in the show 'Extras'?",
      "el_RichText": "In 'Extras', Ricky Gervais played a character working in showbiz. What was his role?",
      "options": [
        { "id": "RG003_choice1", "text": "A producer", "isCorrect": false, "weight": 0 },
        { "id": "RG003_choice2", "text": "A director", "isCorrect": false, "weight": 0 },
        { "id": "RG003_choice3", "text": "An extra", "isCorrect": true, "weight": 1 },
        { "id": "RG003_choice4", "text": "A writer", "isCorrect": false, "weight": 0 },
        { "id": "RG003_choice5", "text": "A casting agent", "isCorrect": false, "weight": 0 }
      ],
      "multiple": false,
      "maxScore": "1",
      "feedback": { "correct": "Correct!", "incorrect": "Incorrect." },
      "tip": "The title of the show gives a clue!",
      "randomized": true,
      "isNewElement": true
    },
    {
      "el_ID": "RG004",
      "el_Type": "choice",
      "el_Text": "Which Netflix show did Ricky Gervais create and star in?",
      "el_RichText": "Ricky Gervais created a heartfelt comedy-drama for Netflix. What is it called?",
      "options": [
        { "id": "RG004_choice1", "text": "Derek", "isCorrect": false, "weight": 0 },
        { "id": "RG004_choice2", "text": "After Life", "isCorrect": true, "weight": 1 },
        { "id": "RG004_choice3", "text": "The Office", "isCorrect": false, "weight": 0 },
        { "id": "RG004_choice4", "text": "An Idiot Abroad", "isCorrect": false, "weight": 0 },
        { "id": "RG004_choice5", "text": "Humanity", "isCorrect": false, "weight": 0 }
      ],
      "multiple": false,
      "maxScore": "1",
      "feedback": { "correct": "Correct!", "incorrect": "Incorrect." },
      "tip": "Think of a Netflix original about grief and humor.",
      "randomized": true,
      "isNewElement": true
    },
    {
      "el_ID": "RG005",
      "el_Type": "choice",
      "el_Text": "What genre of comedy is Ricky Gervais known for?",
      "el_RichText": "Ricky Gervais is celebrated for his unique comedic style. Which genre best describes it?",
      "options": [
        { "id": "RG005_choice1", "text": "Physical comedy", "isCorrect": false, "weight": 0 },
        { "id": "RG005_choice2", "text": "Satire", "isCorrect": true, "weight": 1 },
        { "id": "RG005_choice3", "text": "Slapstick", "isCorrect": false, "weight": 0 },
        { "id": "RG005_choice4", "text": "Improvisation", "isCorrect": false, "weight": 0 },
        { "id": "RG005_choice5", "text": "Parody", "isCorrect": false, "weight": 0 }
      ],
      "multiple": false,
      "maxScore": "1",
      "feedback": { "correct": "Correct!", "incorrect": "Incorrect." },
      "tip": "Think of his sharp observations about society.",
      "randomized": true,
      "isNewElement": true
    }
  ]

`;

// Props
const props = defineProps({
    prompt: {
        type: String,
        required: true,
    },
    selectedInteraction: {
        type: String,
        required: true,
    },
    jsonModelText: {
        type: String,
        required: true,
    },
});

// Fonction pour appeler l'API
const callAPI = async () => {
    loading.value = true;
    error.value = null;
    result.value = null;

    try {
        if (isTestMode) {
            console.log("Using mocked JSON response");
            result.value = JSON.parse(mockJsonResponse);
            if (Array.isArray(result.value)) {
                console.log("Array detected");
                // Parcourir chaque élément du tableau
                result.value.forEach((item) => {
                    const newID = uuidv4(); // Générer un nouvel ID pour chaque élément
                    item.el_ID = newID;
                    store.addElement(activePage.id, newID, item);
                });
                store.removeElement(el_ID); // Supprimer l'ancien élément après ajout
            } else if (typeof result.value === 'object') {
                console.log("Object detected");
                result.value.el_ID = newEl_ID;
                store.addElement(activePage.id, newEl_ID, result.value);
                store.removeElement(el_ID);
            } else {
                console.error("Invalid result type: Expected an object or an array.");
            }


            try {
                await store.saveTestDataToDatabase();
                return;
            } catch (error) {
                console.error("❌ Erreur lors de la sauvegarde :", error);
            }

        }

        // Étape 1 : Génération du texte avec température 0.5
        console.log("Étape 1 : Génération de texte");
        const textResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [{ role: "user", content: props.prompt }],
                temperature: 0.5,
            },
            {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_CHATGPT_API}`,
                    "Content-Type": "application/json",
                }
            }
        );

        const generatedText = textResponse.data.choices[0].message.content;
        console.log("Texte généré :", generatedText);

        // Préparer la requête pour l'étape 2
        const jsonPrompt = `Generate a new element using the interaction model "${props.selectedInteraction}" 
      with the following JSON structure:\n${props.jsonModelText}\n\n
      Provide the output strictly as valid JSON. 
      Do not include any explanations, comments, or non-JSON content.
      Ensure all required fields are present and correctly formatted.
      You are a JSON generator. 
      Always produce output strictly formatted as valid JSON. 
      If any part of the structure is ambiguous, 
      assume the defaults as described and do not generate additional text.
      Rules for JSON generation:
      double quotes for all keys and string values.
      Do not include any comments or trailing commas.
      Boolean values must be unquoted (true/false).
      Provide only the JSON object as output, nothing else.
      The maxScore of a question is strictly the sum of the weight for 
      correct answers of that same question.
      All isNewElement must be false`;

        // Étape 2 : Génération du JSON avec température 0
        console.log("Étape 2 : Génération de JSON");
        const jsonResponse = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4",
                messages: [{ role: "user", content: jsonPrompt }],
                temperature: 0,
            },
            {
                headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_CHATGPT_API}`,
                    "Content-Type": "application/json",
                }
            }
        );

        result.value = jsonResponse.data.choices[0].message.content;
        console.log("JSON généré :", result.value);

    } catch (err) {
        error.value = err.response?.data?.error?.message || "An error occurred.";
        console.error("API Error:", err.response?.data);
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.json-result pre {
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 5px;
    overflow: auto;
    max-height: 300px;
}
</style>