import { ref } from 'vue';
import api from '@/api';

export function useSessionManager(testId, publicationId, groupId, userId,publicationAccess) {
  const sessionId = ref(null);
  const error = ref(null);

  const startSession = async () => {
    try {
      const response = await api.post('/sessions/start', {
        studentId: userId,
        publicationId,
        groupId,
      });
      sessionId.value = response.data.sessionId;
  
      // Si l'accès est "unique", on désactive immédiatement après la session
      console.log(publicationAccess)
      if (publicationAccess === 'unique') {
        await api.patch(`/sessions/${sessionId.value}`, {
          accessStatus: false,
        });
      }
  
    } catch (e) {
      error.value = 'Erreur lors du démarrage de la session';
      console.error(e);
    }
  };
  

  const endSession = async (abandoned = false) => {
    console.log("END SESSION CALLED")
    if (!sessionId.value) return;
    try {
      const action = abandoned ? 'abandon' : 'submit';
      await api.patch(`/sessions/${sessionId.value}/${action}`);
    } catch (e) {
      error.value = 'Erreur lors de la fermeture de session';
      console.error(e);
    }
  };

  return {
    sessionId,
    startSession,
    endSession,
    error,
  };
}
