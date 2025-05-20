<template>
    <div class="dim-wrapper" @mouseenter="show = true" @mouseleave="show = false">
      <!-- Cercle actif -->
      <div class="dim-circle" :style="{ backgroundColor: selectedColor }" title="Sélectionner une dimension"></div>
  
      <!-- Menu de couleurs -->
      <div class="dim-menu" v-if="show">
        <div
          v-for="(dim, index) in dimensions"
          :key="index"
          class="dim-option"
          :style="{ backgroundColor: dim.color }"
          :title="dim.label"
          @click="selectDimension(dim)"
        ></div>
      </div>
    </div>
  </template>
  
  
  <script setup>
  import { ref } from 'vue';
  
  const show = ref(false);
  const selectedColor = ref('#ccc');
  
  const dimensions = [
    { color: '#f44336', label: 'Maîtrise du calcul mental' },
    { color: '#ff9800', label: 'Résolution de problème' },
    { color: '#ffeb3b', label: 'Représentation spatiale' },
    { color: '#4caf50', label: 'Logique' },
    // etc.
  ];
  
  function selectDimension(dim) {
    selectedColor.value = dim.color;
    show.value = false;
  }
  </script>
  
  <style scoped>
  .dim-wrapper {
  position: relative;
  width: 20px;
  height: 20px;
}

.dim-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #aaa;
  cursor: pointer;
}

.dim-menu {
  position: absolute;
  bottom: 100%;
  right: 0;
  display: flex;
  gap: 5px;
  padding: 5px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 0 4px rgba(0,0,0,0.2);
  z-index: 10;
}

.dim-option {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid #ccc;
}

  </style>
  