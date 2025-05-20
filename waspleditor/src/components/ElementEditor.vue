<template>
  <div class="editor-container">
    <div v-if="selectedElement" >
        <component :is="editorComponent" :element="selectedElement" />
    </div>
    <div v-else class="alert alert-info">
      Select an element to edit
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useTestStore } from "../stores/testStore";

const store = useTestStore();

const selectedElement = computed(() => store.selectedElement);

// Charge dynamiquement l'éditeur en fonction du type d'élément
const editorComponent = computed(() => {
  const type = selectedElement.value?.el_Type || "Default";
  return defineAsyncComponent(() =>
    import(`@/components/interactions/${type}/Editor.vue`).catch(() =>
      import("@/components/interactions/default/Editor.vue")
    )
  );
});

</script>



<style scoped>
</style>