// 📄 Fichier : src/testRenderUtil/useResultSender.js
import api from '@/api';
import { ref } from 'vue';

export function useResultSender(responsesStore) {
  const error = ref(null);
  const success = ref(false);

  const sendResultsToDatabase = async ({ userId, testId, publicationId, groupId, owner }) => {

console.log("📤 Envoi des résultats avec owner =", owner);

    if (!userId || !testId || !responsesStore) {
      error.value = "Informations manquantes pour l'envoi des résultats.";
      return;
    }

console.log("📤 owner reçu dans sendResultsToDatabase :", owner);

    const resultData = {
      studentId: userId,
      testId,
      publicationId,
      groupId,
      responses: responsesStore.responses,
      submittedAt: new Date().toISOString(),
      owner
    };

    try {
      await api.post("/results", resultData);
      success.value = true;
    } catch (e) {
      error.value = 'Erreur lors de l\'envoi des résultats';
      console.error(e);
    }
  };

  return {
    sendResultsToDatabase,
    success,
    error,
  };
}
