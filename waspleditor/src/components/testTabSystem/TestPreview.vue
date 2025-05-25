<template>
  <div class="iframe-container" :class="{ fullscreen: isFullscreen }">
    <button class="toggle-button" @click="toggleFullscreen">
      {{ isFullscreen ? "Quitter le plein écran" : "Plein écran" }}
    </button>

    <!-- Debug info (à supprimer en prod) -->
    <!-- <div v-if="showDebug" class="debug-info">
      <p><strong>Test ID:</strong> {{ store.testData._id }}</p>
      <p><strong>URL iframe:</strong> {{ testRunnerUrl }}</p>
      <p><strong>Docker mode:</strong> {{ isDocker }}</p>
      <p><strong>Base URL:</strong> {{ baseURL }}</p>
      <p><strong>Token:</strong> {{ tokenDebug }}</p>
    </div> -->

    <p v-if="!testRunnerUrl">Chargement de l'aperçu du test…</p>

    <iframe 
      v-if="testRunnerUrl"
      :src="testRunnerUrl" 
      frameborder="0"
      :class="{ fullscreen: isFullscreen }"
      @load="onIframeLoad"
      @error="onIframeError"
    ></iframe>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useTestStore } from '../../stores/testStore';

const store = useTestStore();

const tokenDebug = ref(localStorage.getItem('token') || '⚠️ aucun');

// Debug toggle (à supprimer en prod)
let showDebug = import.meta.env.DEV;
console.log("🔧 Debug mode:", showDebug);
showDebug = true;

const isDocker = import.meta.env.VITE_DOCKER_ON === "istrue";
console.log("🐳 Docker mode:", isDocker);

// 🔧 Configuration des URLs
const token = localStorage.getItem('token');
const testRunnerUrl = computed(() => {
  const base = window.location.origin;
  //if (!store.testData._id || !token) return '';

  if (isDocker) {
    console.log("TOKEN", token)
    // En mode Docker, utiliser l'URL interne ou externe selon la config
    //const dockerUrl = import.meta.env.VITE_TESTRUNNER_URL || 'http://localhost:5174';
    return `${base}/testrunner/test-preview?testId=${store.testData._id}&token=${token}`;
  } else {
    // En mode dev local
    return `http://localhost:5174/test-preview?testId=${store.testData._id}&token=${token}`;
  }
});

console.log("🔗 URL de l'iframe :", testRunnerUrl.value);

// Observer les changements d'ID pour debug
watch(() => store.testData._id, (newTestID) => {
  console.log("🔄 TestPreview - Nouveau test sélectionné :", newTestID);
});

const isFullscreen = ref(false);

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
};

// Gestion des événements iframe pour debug
const onIframeLoad = () => {
  console.log("✅ Iframe chargée avec succès");
};

const onIframeError = (event) => {
  console.error("❌ Erreur de chargement de l'iframe:", event);
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
  height: 1000px;
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
  background: white;
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
  z-index: 1001;
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

/* Debug info (à supprimer en prod) */
.debug-info {
  position: absolute;
  top: 50px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 1001;
  max-width: 300px;
}
</style>