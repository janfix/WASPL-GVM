<template>
  <div class="interaction-noEditor container">
    <cardHeader
      :numOrder="getQuestionNumber()"
      :elementType="question.el_Type"
      :mode="'Preview'" 
      style="padding: 10px; border-top-left-radius: 5px; border-top-right-radius : 5px;"  
    />

    <div class="card-body">
      <h3>{{ question.el_Text }}</h3>
      <div v-if="question.el_RichText" class="quill-editor" ref="quillEditor"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import Quill from 'quill';

import cardHeader from './cardHeader.vue';
import { useResponsesStore } from '@/stores/useResponsesStore';

const responsesStore = useResponsesStore();
defineEmits(['interaction-started'])
const props = defineProps({
  question: { type: Object, required: true },
  testData: { type: Object, required: true },
  numOrder: [Number, null],
  questionIndexMap: { type: Object, default: () => ({}) },
  restoredAnswer: { type: [String, Array, Object, null], default: null }
});

const quillEditor = ref(null);
let quillInstance = null;

// 🧠 Calcul du numéro de la question depuis la map si dispo
const getQuestionNumber = () => {
  if (!props.questionIndexMap || typeof props.questionIndexMap !== 'object') {
    console.warn("⚠️ questionIndexMap manquant ou invalide.");
    return props.numOrder ?? 'N/A';
  }
  return props.questionIndexMap[props.question.el_ID] ?? props.numOrder ?? 'N/A';
};

// 🔄 ID utilisateur pour sauvegarde (à adapter selon ton projet)
const token = localStorage.getItem('token');
const decodedToken = token ? JSON.parse(atob(token.split('.')[1])) : null;
const userId = decodedToken?._id || decodedToken?.sub || null;

// ✅ Restauration automatique
const restoredData = ref(null);

// ⚠️ À adapter selon le type d’interaction
onMounted(async () => {
  if (props.question.el_RichText && quillEditor.value) {
    quillInstance = new Quill(quillEditor.value, {
      theme: 'snow',
      readOnly: true,
      modules: { toolbar: false }
    });

    quillInstance.root.innerHTML = props.question.el_RichText;
  }

  // 📦 Lecture de réponse sauvegardée
  const saved = responsesStore.getResponseForQuestion(userId, props.question.el_ID);
  if (saved) {
    restoredData.value = saved;
  }

  // Exemple de log (à retirer ensuite)
  if (restoredData.value) {
    console.log("🔁 Réponse restaurée :", restoredData.value);
  }
});
</script>

<style scoped>
.interaction-noEditor {
  margin: 1em 0;
}

.quill-editor {
  border: 1px solid #ccc;
  padding: 10px;
  margin-top: 1rem;
}

.container{
  margin-left: 15px;
}
</style>
