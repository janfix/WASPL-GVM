// AIGeneratorWizard.vue
<template>
  <div class="ai-wizard">
    <StepIndicator :step="step" :mode="aiMode" />

    <!-- Dynamically render step component based on mode and step -->
    <component :is="getStepComponent" v-if="getStepComponent" v-model:mainPrompt="mainPrompt"
      v-model:selectedInteraction="selectedInteraction" v-model:nbQuestions="nbQuestions"
      v-model:jsonModelText="jsonModelText" v-model:apiConfig="apiConfig" :mode="aiMode" :step="step"
      @mode-selected="aiMode = $event" @submit="handleIntegration"
      v-bind="step === 5 ? { prompt: generatedPrompt } : {}"
      v-on="step === 4 ? { updatePrompt: (val) => generatedPrompt = val } : {}" />

    <div class="text-end mt-4">
      <button v-if="step > 1" @click="prevStep" class="btn btn-secondary me-2">⬅️ Previous</button>
      <button v-if="(aiMode === 'api' && step < 5) || (aiMode !== 'api' && step < 4)" @click="nextStep"
        class="btn btn-primary">
        Next ➡️
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue';
import { useTestStore } from '@/stores/testStore';
import StepIndicator from './StepIndicator.vue';
import StepAIUsageChoice from './wizardSteps/StepAIUsageChoice.vue';
import StepPromptDefinition from './wizardSteps/StepPromptDefinition.vue';
import StepPromptReview from './wizardSteps/StepPromptReview.vue';
import StepJSONIntegration from './wizardSteps/StepJSONIntegration.vue';
import StepAPIConfiguration from './wizardSteps/StepAPIConfiguration.vue';

const store = useTestStore();

const handleIntegration = (newItems) => {
  const activePageId = store.getActivePageId() || store.testData.pages[0]?.id;

  newItems.forEach((item) => {
    const newId = `el_${crypto.randomUUID()}`;
    item.el_ID = newId;

    store.testData.elements.push(item);

    const page = store.testData.pages.find(p => p.id === activePageId);
    if (page) {
      page.children.push({
        id: newId,
        label: item.el_Text
          ? item.el_Text.slice(0, 50) + (item.el_Text.length > 50 ? '…' : '')
          : 'New Item'
      });
    }
  });

  const ActifElementID = store.selectedElement.el_ID;
  console.log(ActifElementID)
  store.deleteElement(ActifElementID)

  // 💾 Sauvegarde dans la base si nécessaire
  store.saveTestDataToDatabase();
};


const step = ref(1);
const mainPrompt = ref('');
const selectedInteraction = ref('');
const nbQuestions = ref(5);
const jsonModelText = ref('');
const aiMode = ref('manual');
const apiConfig = ref({
  mode: 'local',
  name: 'LMStudio - gemma-3-27b-it',
  model: 'gemma-3-27b-it',
  url: 'http://127.0.0.1:1234/v1/chat/completions',
  maxTokens: 512,
  temperature: 0.5,
  stream: false
});

const generatedPrompt = ref('');
const nextStep = () => step.value++;
const prevStep = () => step.value--;

const getStepComponent = computed(() => {
  if (step.value === 1) return StepAIUsageChoice;

  if (aiMode.value === 'manual') {
    return {
      2: StepPromptDefinition,
      3: StepPromptReview,
      4: StepJSONIntegration
    }[step.value];
  }

  if (aiMode.value === 'api') {
    return {
      2: StepAPIConfiguration,
      3: StepPromptDefinition,
      4: StepPromptReview,
      5: StepJSONIntegration
    }[step.value];
  }

  return null;
});


</script>