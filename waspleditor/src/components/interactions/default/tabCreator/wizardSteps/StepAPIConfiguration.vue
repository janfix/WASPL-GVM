<template>
  <div>
    <h4>{{ title }}</h4>

    <div class="form-floating">
      <select class="form-select" id="AIGen" name="AIGen" required>
        <option value="" disabled selected hidden>Choose an AI generator</option>
        <option selected value="LMStudio">Local solution based on LM studio - gemma-3-27b-it</option>
        <option disabled value="ChatGPT">ChatGPT</option>
        <option disabled value="ClaudeAI">Claude AI</option>
        <option disabled value="DeepSeek">Deepseek</option>
      </select>
      <label for="AIGen">AI Generator</label>
    </div>
    <br>
    <div class="form-floating mb-3">
      <input readonly v-model="localConfig.url" class="form-control" placeholder="API URL" />
      <label>API URL</label>
    </div>

    <div v-if="localConfig.mode === 'distant'" class="form-floating mb-3">
      <input readonly v-model="localConfig.token" class="form-control" placeholder="Access token" />
      <label>Access token</label>
    </div>

    <div class="form-floating mb-3">
      <input readonly type="text" step="0.1" v-model="localConfig.model" class="form-control" placeholder="Temperature" />
      <label>AI Model</label>
    </div>

    <div class="form-floating mb-3">
      <input readonly type="number" step="0.1" v-model="localConfig.maxTokens" class="form-control" placeholder="Temperature" />
      <label>Max Tokens</label>
    </div>

    <div class="form-floating mb-3">
      <input readonly type="number" step="0.1" v-model="localConfig.temperature" class="form-control"
        placeholder="Temperature" />
      <label>Temperature</label>
    </div>

    <div class="form-check form-switch">
      <input readonly class="form-check-input" type="checkbox" id="streamSwitch" v-model="localConfig.stream">
      <label class="form-check-label" for="streamSwitch">Stream</label>
    </div>




    <div class="text-end">
      <button class="btn btn-outline-success" @click="saveAsDefault">💾 Save as Default AI configuration</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  apiConfig: Object,
  step: Number,
  mode: String,
  prompt : String,
});
const emit = defineEmits(['update:apiConfig']);

const localConfig = ref({ ...props.apiConfig });

watch(localConfig, () => {
  emit('update:apiConfig', localConfig.value);
}, { deep: true });

const saveAsDefault = () => {
  alert('🔐 API profile saved locally (connect to store if needed).');
};

const title = computed(() => {
  const total = props.mode === 'api' ? 5 : 4;
  return `Step ${props.step}/${total}: API Configuration`;
});
</script>
