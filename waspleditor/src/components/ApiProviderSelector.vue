<template>
    <div>
        <b>Choose an AI model available</b>
        <select class="form-select" name="AICorrectionModel" id="AICorrectionModel" v-model="selectedProvider"
            @change="updateApiKey">
            <option v-for="provider in apiProviders" :key="provider.name" :value="provider">
                {{ provider.name }}
            </option>
        </select>


        <div v-if="selectedApiKey">
            Clé API / URL sélectionnée: {{ selectedApiKey }}

        </div>
    </div>
</template>

<script>
export default {
    name: "ApiProviderSelector",
    data() {
        return {
            apiProviders: [],
            selectedProvider: null,
            selectedApiKey: null,
        };
    },
    mounted() {
        // Charger les variables d'environnement
        const env = import.meta.env;

        const availableProviders = [
            { name: "GROQ", apiKey: env.VITE_GROQ_API_KEY },
            { name: "HuggingFace", apiKey: env.VITE_HUGGINGFACE_API_KEY },
            { name: "OpenAI", apiKey: env.VITE_OPENAI_API_KEY },
            { name: "Anthropic", apiKey: env.VITE_ANTHROPIC_API_KEY },
            { name: "Open Router", apiKey: env.VITE_OPEN_ROUTER_API_KEY },
            { name: "Google Generative AI", apiKey: env.VITE_GOOGLE_GENERATIVE_AI_API_KEY },
            { name: "Ollama API Base URL", apiKey: env.VITE_OLLAMA_API_BASE_URL },
            { name: "OpenAI-like", apiKey: env.VITE_OPENAI_LIKE_API_BASE_URL },
            { name: "DeepSeek", apiKey: env.VITE_DEEPSEEK_API_KEY },
            { name: "Mistral", apiKey: env.VITE_MISTRAL_API_KEY },
            { name: "Cohere", apiKey: env.VITE_COHERE_API_KEY },
            { name: "XAI", apiKey: env.VITE_XAI_API_KEY },
        ];

        // Filtrer les providers avec des clés valides
        this.apiProviders = availableProviders.filter(provider => provider.apiKey);

        // Initialiser la sélection si un provider est disponible
        if (this.apiProviders.length > 0) {
            this.selectedProvider = this.apiProviders[0];
            this.selectedApiKey = this.apiProviders[0].apiKey;
        }
    },
    methods: {
        updateApiKey() {
            this.selectedApiKey = this.selectedProvider?.apiKey || null;
        },
    },

};
</script>

<style scoped>
h3 {
    margin-bottom: 10px;
}

select {
    margin-bottom: 20px;
}

h4 {
    margin-top: 20px;
}

p {

    color: grey;
}
</style>