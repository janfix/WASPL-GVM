<template>
  <div class="preview-section">
    <div v-if="selectedElement" >
              <component :is="previewComponent" :element="selectedElement" />
    </div>
    <div v-else class="alert alert-info">
      No element selected for preview
    </div>
  </div>
</template>

<script setup>
import { defineAsyncComponent, computed } from "vue";
import { useTestStore } from "../stores/testStore";

const store = useTestStore();

const selectedElement = computed(() => store.selectedElement);

// Charge dynamiquement le preview en fonction du type d'élément
const previewComponent = computed(() => {
  //console.log(selectedElement.value?.el_Type)
  const type = selectedElement.value?.el_Type || "Default";
  return defineAsyncComponent(() =>
    import(`@/components/interactions/${type}/Preview.vue`).catch(() =>
      import("@/components/interactions/default/Preview.vue")
    )
  );
});

</script>

<style scoped>
  
</style>