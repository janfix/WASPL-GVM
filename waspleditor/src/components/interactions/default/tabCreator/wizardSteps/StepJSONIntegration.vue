<template>
  <div>
    <h4>{{ title }}</h4>

    <!-- Mode API -->
    <template v-if="mode === 'api'">
      <p>✅ JSON automatically generated from the API:</p>

      <!-- Spinner pendant chargement -->
      <div v-if="isLoading" class="text-center my-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Generating JSON...</span>
        </div>
        <p class="mt-2">Generating JSON, please wait...</p>
      </div>

      <!-- Zone texte seulement une fois chargé -->
      <div v-else>
        <textarea v-model="localJSON" class="form-control" rows="12"></textarea>

        <button class="btn btn-success mt-3" @click="submitJSON">
          📥 Integrate into test
        </button>
      </div>
    </template>

    <!-- Mode manuel -->
    <template v-else>
      <p>✍️ Paste here the JSON response you got from an external LLM:</p>
      <textarea v-model="localJSON" class="form-control" rows="12"></textarea>

      <button class="btn btn-success mt-3" @click="submitJSON">
        📥 Integrate into test
      </button>
    </template>
  </div>
</template>


<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  jsonModelText: String, // RESULTAT JSON DE LAPI !!!!
  step: Number,
  apiConfig: Object,
  prompt: String,
  mode: String // 'api' or 'manual'
});
const emit = defineEmits(['submit', 'update:jsonModelText']);

//console.log('props', props);
const localJSON = ref(props.jsonModelText);
//console.log('localJSON', localJSON.value);

// Sync prop to local
watch(() => props.jsonModelText, (val) => {
  localJSON.value = val;
});

// Sync local to parent
watch(localJSON, (val) => {
  emit('update:jsonModelText', val);
});

const submitJSON = () => {
  try {
    const parsed = JSON.parse(localJSON.value);
    emit('submit', parsed);
  } catch (e) {
    alert('❌ Invalid JSON.');
  }
};

const title = computed(() => {
  const total = props.mode === 'api' ? 5 : 4;
  return `Step ${props.step}/${total}: JSON Integration`;
});


const isLoading = ref(false);

watch(
  () => props.prompt,
  async (newPrompt) => {
    if (props.mode !== 'api' || !newPrompt) return;

    isLoading.value = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 30s timeout

    try {
      const response = await fetch(props.apiConfig.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: props.apiConfig.model,
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates JSON test items."
            },
            {
              role: "user",
              content: newPrompt
            }
          ],
          temperature: props.apiConfig.temperature ?? 0.7,
          max_tokens: props.apiConfig.maxTokens > 0 ? props.apiConfig.maxTokens : 1024,
          stream: false // mode classique
        })
      });

      clearTimeout(timeoutId); // on annule le timeout si tout se passe bien

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content ?? '';

      // Essai de formatage JSON
      try {
        const parsed = JSON.parse(rawText);
        localJSON.value = JSON.stringify(parsed, null, 2); // formaté joliment
      } catch (err) {
        console.warn('🟡 JSON non valide. Affichage brut.');
        localJSON.value = rawText;
      }

    } catch (e) {
      console.error("❌ Error generating JSON:", e);
      localJSON.value = '// ❌ Error during generation';
    } finally {
      isLoading.value = false;
    }
  },
  { immediate: true }
);





</script>