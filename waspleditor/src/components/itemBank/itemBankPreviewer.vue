<template>
    <div>
      <!-- Vérifie si un élément est sélectionné -->
      <div v-if="selectedItem">
        
        <!-- Composant Preview dynamique -->
        <component
          :is="dynamicPreviewComponent"
          v-if="dynamicPreviewComponent"
        />
        <br>
        <!-- Composant Editor dynamique -->
        <component class="DynamicEditorItem"
          :is="dynamicEditorComponent"
          v-if="dynamicEditorComponent"
          :isItemBank = "true"
        />
      </div>
      <div v-else>
       <!--  <p>Sélectionnez un élément pour afficher l'aperçu et l'éditeur.</p> -->
      </div>
      </div>
    </template>
  
  <script setup>
  import { shallowRef, watch } from "vue";
  import { useTestStore } from "../../stores/testStore"; // Importation du store
  
  // Props pour récupérer l'élément sélectionné
  const props = defineProps({
    selectedItem: {
      type: Object,
      default: () => null,
    },
  });
  
  // Récupération du store
  const store = useTestStore();
  
  // Références dynamiques pour les composants
  const dynamicPreviewComponent = shallowRef(null);
  const dynamicEditorComponent = shallowRef(null);
  
  // Surveille les changements de `selectedItem` et met à jour le store et les composants dynamiques
  watch(
    () => props.selectedItem,
    async (newItem) => {
      if (newItem?.el_Type) {
        try {
          // Met à jour le store avec l'élément et son label
          store.setSelectedElement(newItem, newItem.el_Label || "Label non défini");
  
          // Charge dynamiquement le composant Preview
          const modulePreview = await import(`../interactions/${newItem.el_Type}/Preview.vue`);
          dynamicPreviewComponent.value = modulePreview.default || modulePreview;
  
          // Charge dynamiquement le composant Editor
          const moduleEditor = await import(`../interactions/${newItem.el_Type}/Editor.vue`);
          dynamicEditorComponent.value = moduleEditor.default || moduleEditor;
        } catch (err) {
          console.error("Erreur lors du chargement des composants :", err);
          dynamicPreviewComponent.value = null; // Réinitialise en cas d'erreur
          dynamicEditorComponent.value = null; // Réinitialise en cas d'erreur
        }
      } else {
        // Réinitialise si aucun élément n'est sélectionné
        store.clearSelectedElement(); // Réinitialise le store
        dynamicPreviewComponent.value = null;
        dynamicEditorComponent.value = null;
      }
    },
    { immediate: true } // Exécute immédiatement pour gérer les valeurs initiales
  );
  </script>
<style scoped>
.DynamicEditorItem{
    margin-bottom: 30px;
}
</style>
  