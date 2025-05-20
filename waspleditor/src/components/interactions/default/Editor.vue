<template>
  <div class="editor-container">
    <div v-if="selectedElement" class="card">
      <div class="card-header">Creation Mode</div>
      <div class="card-body">
        <TabsComponent :selectedElement = "selectedElement"/>
      </div>
    </div>
    <div v-else class="alert alert-info">Select an element to edit</div>
  </div>
</template>

<script setup>
import { useTestStore } from '../../../stores/testStore';
import { computed, watch } from 'vue';
import { interactions } from '../../../../interactions';
import { v4 as uuidv4 } from 'uuid'; // Importer UUID
import TabsComponent from "./tabCreator/TabsComponent.vue";

const store = useTestStore();
const selectedElement = computed(() => store.selectedElement);

/* // Interaction types disponibles
const interactionTypes = interactions;

// Charger dynamiquement le modèle JSON et ajouter un el_ID
const loadInteractionModel = async (type) => {
  if (interactions[type]?.model) {
    const model = await interactions[type].model();
    store.updateElement({
      ...model,
      el_ID: uuidv4(), // Générer un identifiant unique pour le nouvel élément
    });
  }
};

// Watch pour détecter les changements de type d'interaction
watch(
  () => selectedElement.value?.el_Type,
  (newType) => {
    if (newType) {
      loadInteractionModel(newType);
    }
  }
); */
</script>

<style scoped>
/* Votre CSS reste inchangé */
.btn-sm {
  font-size: 0.875rem !important;
  padding: 0.25rem 0.5rem !important;
}

.card-header {
  background-color: #426C9C;
  color: white;
}

.inputMainPrompt {
  border: gainsboro 1px solid;
  border-radius: 5px;
  width: 100%;
  padding: 10px;
}

.mb-2 {
  margin-bottom: 10px;
}

.ia-form-container {
  border: gainsboro 1px solid;
  border-radius: 5px;
  margin-top: 20px;
  padding: 10px;

}
</style>
