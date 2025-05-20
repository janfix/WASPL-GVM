// utils/evaluationContext.js
import { ref } from 'vue';

// État partagé pour la session d'évaluation
export const partialScoreRef = ref([]);
export const memoAxis = [];
export const totalQScoreRef = ref(0);

// Reset pour une nouvelle évaluation
export function resetEvaluationContext() {
  partialScoreRef.value = [];
  memoAxis.length = 0;
  totalQScoreRef.value = 0;
}
