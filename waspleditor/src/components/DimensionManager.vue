<template>
    <div class="dimension-manager">
      <h4>Pedagocial dimensions</h4>
        <p class="dimExplain">Define dimensions to create specific analysis. For example : microskill, sub-domain, etc.. Once you have defined your dimension, just tag the item in the test using the same color. A specific sub-score will be calculated in the reports</p>
        <div
  v-for="(dim, index) in localDimensions"
  :key="dim._id"
  class="dimension-row"
>
  <div class="form-floating label-input">
    <input
      type="text"
      class="form-control"
      v-model="dim.label"
      :id="'label-input-' + dim._id"
      @input="autoSave"
      maxlength="15"
      placeholder="Entrez un label (max 15 caractères)"
    />
    <label :for="'label-input-' + dim._id">Badge label (short)</label>
  </div>

  <div class="form-floating desc-input">
    <textarea
      class="form-control"
      v-model="dim.description"
      :id="'desc-input-' + dim._id"
      style="height: 50px"
      @input="autoSave"
      placeholder="Description"
      title="It will be displayed in the report and used for analysis and AI prompting"
    ></textarea>
    <label :for="'desc-input-' + dim._id">Description</label>
  </div>

  <!-- 🔴 Bouton supprimer -->
  <button
    class="btn btn-outline-danger btn-sm"
    @click="removeDimension(index)"
    title="Supprimer cette dimension"
  >
    ❌
  </button>
</div>

  
      <button class="btn btn-sm btn-success mt-2" @click="addDimension">
        + Add a new dimension
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  import { v4 as uuidv4 } from 'uuid'
  import { useTestStore } from '@/stores/testStore'
  
  const props = defineProps({
    dimensions: {
      type: Array,
      default: () => []
    }
  })
  
  const emit = defineEmits(['update:dimensions'])
  const store = useTestStore()
  
  const localDimensions = ref([...props.dimensions])
  
  watch(
    () => props.dimensions,
    (newVal) => {
      localDimensions.value = [...newVal]
    }
  )
  
  const colors = [
    '#ffd6d6', // pastel rouge
    '#fff2b2', // pastel jaune
    '#d2f8d2', // pastel vert
    '#b2e0ff', // pastel bleu
    '#e2d1f9', // pastel violet
    '#ffc8dd', // rose pâle
    '#d8f3dc', // menthe
    '#ffe5b4'  // abricot
  ]
  
  function removeDimension(index) {
  if (confirm('Supprimer cette dimension ?')) {
    localDimensions.value.splice(index, 1)
    autoSave()
  }
}


  function addDimension() {
    const newDim = {
      _id: uuidv4(),
      color: colors[Math.floor(Math.random() * colors.length)],
      label: '',
      description: ''
    }
    localDimensions.value.push(newDim)
    autoSave()
  }
  
  function autoSave() {
    emit('update:dimensions', localDimensions.value)
    store.testData.dimensions = [...localDimensions.value]
    store.saveTestDataToDatabase()
  }
  </script>
  
  <style scoped>
  .dimension-manager {
    padding: 10px;
    background: #f9f9f9;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .dimension-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #ccc;
  }
  
  .label-input,
  .desc-input,
  .color-select {
    flex: 1;
    min-width: 180px;
  }
  
  .preview-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid #999;
    margin-top: 10px;
  }
  .dimExplain{
    font-size: 0.8rem;
    color: #999;
  }
  </style>
  