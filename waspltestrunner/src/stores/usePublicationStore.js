// src/stores/usePublicationStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/api'

export const usePublicationStore = defineStore('publication', () => {
  const publicationData = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchPublication(publicationId) {
    if (!publicationId) {
      error.value = 'Missing publicationId'
      return
    }

    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/publications/${publicationId}`)
      console.log('✅ Publication chargée avec succès:', response.data)
      publicationData.value = response.data
    } catch (err) {
      error.value = err
      console.error('❌ Erreur lors du chargement de la publication:', err)
    } finally {
      loading.value = false
    }
  }

  function resetPublication() {
    publicationData.value = null
    error.value = null
    loading.value = false
  }

  return {
    publicationData,
    loading,
    error,
    fetchPublication,
    resetPublication,
  }
})
