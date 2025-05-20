<template>
    <div class="iframe-container" :class="{ fullscreen: isFullscreen }">
      <button class="toggle-button" @click="toggleFullscreen">
        {{ isFullscreen ? "Quitter le plein écran" : "Plein écran" }}
      </button>


  
      <p v-if="!testRunnerUrl">Chargement de l’aperçu du test…</p>

      <iframe 
        v-if="testRunnerUrl"
        :src="testRunnerUrl" 
        frameborder="0"
        :class="{ fullscreen: isFullscreen }"
      ></iframe>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { useTestStore } from '../../stores/testStore';
  
  const store = useTestStore(); // Accéder au store
  
  // Récupérer dynamiquement l'ID du test actif depuis le store
/*   const testRunnerBaseUrl = 'http://localhost:5174/test-preview?testId=67cec4a7345c990bdfb0ce29&publicationId=67cfea7dab6eaed524b8007e&groupId=67cacf815ee783573393ebe2';

const testRunnerUrl = computed(() => {
  return store.testData._id ? `${testRunnerBaseUrl}/${store.testData._id}` : '';
}); */

//const testRunnerUrl = `http://localhost:5174/test-preview?testId=${store.testData._id}&publicationId=67cfea7dab6eaed524b8007e&groupId=67cacf815ee783573393ebe2`;  


const isDocker = import.meta.env.VITE_DOCKER_ON === "istrue";
console.log(isDocker)


// 🔧 Base dynamique
const baseURL = isDocker
  ? import.meta.env.VITE_TESTRUNNER_API // ex: /editor/api/auth (dans Docker)
  : import.meta.env.VITE_API_BASE_URL ; 

console.log(baseURL)


const testRunnerUrl = computed(() => {
  if (!store.testData._id) return '';

  if (isDocker) {
    return `http://localhost${baseURL}test-preview?testId=${store.testData._id}`;

  } else{
    return `http://localhost:5174/test-preview?testId=${store.testData._id}`;
  }

  
  //return `http://localhost:5174/test-preview?testId=${store.testData._id}`;
});

console.log("URL de l'iframe :", testRunnerUrl.value);  

  // Observer les changements d'ID pour debug
  watch(() => store.testData._id, (newTestID) => {
    console.log("TestPreview - Nouveau test sélectionné :", newTestID);
  });
  
  const isFullscreen = ref(false);
  
  const toggleFullscreen = () => {
    isFullscreen.value = !isFullscreen.value;
  };

  watch(testRunnerUrl, (newUrl) => {
  console.log("🚀 URL de l'iframe mise à jour :", newUrl);
});

  </script>
  
  
  
  <style scoped>
  /* Conteneur principal */
  .iframe-container {
    position: relative;
    width: 100%;
    height: 1000px; /* Hauteur normale */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease-in-out;
  }
  
  /* Plein écran */
  .iframe-container.fullscreen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: white; /* Ajoute un fond pour éviter les conflits visuels */
    z-index: 1000;
  }
  
  /* Styles de l'iframe */
  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
  
  /* Styles spécifiques au plein écran */
  .iframe-container.fullscreen iframe {
    width: 100vw;
    height: 100vh;
  }
  
  /* Bouton de bascule */
  .toggle-button {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1001; /* S'assurer qu'il reste visible */
    padding: 8px 12px;
    background: #426C9C;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
  }
  
  .toggle-button:hover {
    background: #36557c;
  }
  </style>
  