// src/stores/responsesStore.js
import { defineStore } from 'pinia';

export const useResponsesStore = defineStore('responses', {
  state: () => ({
    responses: JSON.parse(localStorage.getItem('responses') || '[]'), // Récupérer les réponses depuis le localStorage
  }),
  getters: {
    // Récupérer les réponses d'un utilisateur
    getUserResponses: (state) => (userId) => {
      return state.responses.filter((response) => response.userId === userId);
    },
    // Récupérer une réponse spécifique
    getResponseForQuestion: (state) => (userId, questionId) => {
      return state.responses.find(
        (response) => response.userId === userId && response.questionId === questionId
      );
    },
    // Vérifier si une question est répondue
    isQuestionAnswered: (state) => (questionId) => {
      return state.responses.some((response) => response.questionId === questionId && response.answered);
    }
  },
  actions: {
    resetResponses() {  // ✅ Fonction pour réinitialiser les réponses
      this.responses = [];
      localStorage.removeItem('responses');
    },
    // Ajouter ou mettre à jour une réponse
    saveResponse(response) {
      //console.log('Réponse enregistrée :', response); 
      const index = this.responses.findIndex(
        (r) =>
          r.userId === response.userId && r.questionId === response.questionId
      );

      if (index !== -1) {
        this.responses[index] = response; // Mise à jour
      } else {
        this.responses.push(response); // Ajout
      }
      localStorage.setItem('responses', JSON.stringify(this.responses)); // Sauvegarder dans le localStorage
    },

    // Envoyer les réponses à la base de données
    async sendResponsesToDatabase(strategy, userId, pageId = null) {
      const userResponses = this.getUserResponses(userId);

      let responsesToSend = [];
      if (strategy === 'page') {
        // Envoyer uniquement les réponses d'une page
        responsesToSend = userResponses.filter((r) => r.pageId === pageId);
      } else if (strategy === 'end') {
        // Envoyer toutes les réponses
        responsesToSend = userResponses;
      }

      // Simuler un envoi des données
      try {
        await fetch('/responses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(responsesToSend),
        });
        console.log('Réponses envoyées avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'envoi des réponses:', error);
      }
    },
  },
  
});


