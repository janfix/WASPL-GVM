<template>
  <div>
    <h3>Choose an interaction to create a new element</h3>

    <!-- Grille dynamique -->
    <div class="d-flex flex-wrap gap-3 justify-content-start">
      <button
        v-for="(interaction, key) in interactionTypes"
        :key="key + reloadKey"
        type="button"
        class="card border-0 shadow-sm p-3 clickable-card"
        :class="{ 'bg-primary text-white': selectedElement.el_Type === key }"
        style="cursor: pointer; width: 180px;"
        @click="selectInteraction(key)"
      >
        <div class="text-center">
          <img
            :src="getImagePath(key)"
            :alt="`${key} interaction image`"
            class="img-fluid rounded shadow-sm mb-2"
            :title="interaction.description || key"
          />
          <h5 class="card-title mb-1 text-capitalize">{{ formatName(key) }}</h5>
        </div>
      </button>
    </div>

    <hr />

    <!-- Mode développeur -->
    <div class="d-flex flex-wrap gap-3 justify-content-start">
      <button class="card border-0 shadow-sm p-3 clickable-card" @click="showModal = true">
        <img
          width="60px"
          src="../../../../assets/toolbox.png"
          alt="toolbox image"
          class="img-fluid rounded shadow-sm mb-2 m-auto"
          title="Create your own interaction"
        />
        Create a new interaction <br />(developer tool)
      </button>

      <button hidden class="card border-0 shadow-sm p-3 clickable-card">
        <img
          width="60px"
          src="../../../../assets/ImportZip.png"
          alt="import zip"
          class="img-fluid rounded shadow-sm mb-2 m-auto"
          title="Import your interaction"
        />
        Import <br />a new Interaction
      </button>
    </div>

    <!-- Modal -->
    <CreateInteractionModal
      v-if="showModal"
      @close="showModal = false"
      @created="handleInteractionCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTestStore } from '../../../../stores/testStore';
import { interactions } from '../../../../../interactions';
import { v4 as uuidv4 } from 'uuid';
import CreateInteractionModal from './CreateInteractionModal.vue';

const store = useTestStore();
const reloadKey = ref(0);
const showModal = ref(false);

const selectedElement = computed(() => store.selectedElement);
const interactionTypes = computed(() => ({ ...interactions }));

const selectInteraction = async (type) => {
  // Ignore si le type vient d'être créé et est déjà dans le store
  if (selectedElement.value?.el_Type === type) return;

  selectedElement.value.el_Type = type;

  if (interactions[type]?.model) {
    const model = await interactions[type].model();
    store.updateElement({
      ...model,
      el_ID: uuidv4(),
    });
  }
};


const getImagePath = (interactionKey) => {
  try {
    return new URL(`../../../../assets/${interactionKey}.png`, import.meta.url).href;
  } catch {
    return new URL(`../../../../assets/default.png`, import.meta.url).href;
  }
};

const formatName = (key) => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

// 📤 handler de création via modale
const handleInteractionCreated = async (data) => {
  const formData = new FormData();
  formData.append('interactionName', data.interactionName);
  formData.append('description', data.description);
  formData.append('authorName', data.authorName);
  formData.append('createdAt', data.createdAt);
  formData.append('image', data.imageFile);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  try {
    const res = await fetch(`${apiBaseUrl}/api/dev/scaffold-interaction`, {
      method: 'POST',
      body: formData,
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error);
    alert(`✅ Interaction "${data.interactionName}" created successfully.`);
    reloadKey.value++; // re-render les boutons
    showModal.value = false;
    
   const newKey = data.interactionName;
 if (interactions[newKey]?.model) {
  const model = await interactions[newKey].model();
  store.updateElement({
    ...model,
    el_ID: uuidv4(),
  });
}


  } catch (err) {
    //Failed to create interaction: model is not defined
    alert(`❌ Failed to create interaction: ${err.message}`);
  }
};
</script>

<style scoped>
.clickable-card:hover {
  transform: scale(1.03);
  transition: transform 0.2s ease-in-out;
}
</style>
