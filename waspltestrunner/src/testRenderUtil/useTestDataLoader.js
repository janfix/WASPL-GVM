// src/testRenderUtil/useTestDataLoader.js
import { ref } from 'vue';
import api from '@/api';

export function useTestDataLoader(testId) {
  const testData = ref({});
  const loading = ref(false);
  const error = ref(null);

  const fetchTestData = async () => {
    if (!testId.value) {
      error.value = '❌ Aucun testId fourni';
      return;
    }

    loading.value = true;
    try {
      const response = await api.get(`/tests/${testId.value}`);
      testData.value = response.data;
    } catch (e) {
      error.value = '❌ Erreur lors du chargement du test';
      console.error(e);
    } finally {
      loading.value = false;
    }
  };

  return {
    testData,
    loading,
    error,
    fetchTestData
  };
}
