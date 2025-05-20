<template>
  
  <div class="mb-4" style="text-align: left;">
      <img src="../../../../../assets/AIcrazy.png" alt="">
    </div>
  <div>
    <h4>Step 1: Choose your AI usage</h4>

    

    <div class="form-check mb-2">
      <input
        class="form-check-input"
        type="radio"
        id="radio-api"
        name="aiMode"
        value="api"
        @change="$emit('mode-selected', 'api')"
      />
      <label class="form-check-label" for="radio-api">
        Use an API (e.g., LM Studio, ChatGPT...)
      </label>
    </div>

    <div class="form-check mb-2">
      <input
        class="form-check-input"
        type="radio"
        id="radio-manual"
        name="aiMode"
        value="manual"
        @change="$emit('modeSelected', 'manual')"
      />
      <label class="form-check-label" for="radio-manual">
        Use an online LLM-chatbot (manual prompt copy-paste)
      </label>
    </div>

   
  </div>
</template>

<script setup>

defineEmits(['modeSelected', 'submit','mode-selected' ]);

defineProps({
  mainPrompt: [String, Object],
  selectedInteraction: String,
  nbQuestions: Number,
  jsonModelText: String,
  apiConfig: Object,
  mode: String,
  step: Number
});
</script>
