// AIGenerateComponent.vue (nouvelle version intégrant le Wizard)
<template>
  <div class="ai-generate-wrapper">
    <h3>🧠 Generate elements using AI</h3>
    <div class="alert alert-info">
      You can either use a connected API (e.g., LM Studio, ChatGPT) or manually copy-paste prompts into an online LLM-chatbot.
    </div>

    <!-- Intégration directe du wizard -->
    <AIGeneratorWizard @submit="handleAIItems" />
  </div>
</template>

<script setup>
import AIGeneratorWizard from './AIGeneratorWizard.vue'; // Ajuste le chemin si besoin
import { useTestStore } from '@/stores/testStore'; // ou autre store que tu utilises

const store = useTestStore();

const handleAIItems = (items) => {
  console.log("✅ Données JSON à intégrer :", items);
  // Exemple d'intégration directe dans le store
  items.forEach(item => {
    store.addItem(item); // à adapter selon ta logique d'ajout
  });
};
</script>

<style scoped>
.ai-generate-wrapper {
  padding: 2rem;
}
</style>
