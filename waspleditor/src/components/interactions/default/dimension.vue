<template>
    <div class="mb-1 dim-container">
      <div class="row">
        <div class="col-4">
          <select
            id="dimensionSelect"
            class="form-select"
            v-model="selectedDimensionId"
            @change="addDimension"
          >
            <option disabled value="">Add dimension(s)</option>
            <option
              v-for="dim in testData.dimensions"
              :key="dim._id"
              :value="dim._id"
            >
              {{ dim.label }}
            </option>
          </select>
        </div>
        <div class="col-8">
          <!-- 🏷️ Badges affichés -->
          <div class="mt-1 d-flex flex-wrap gap-2">
            <span
              v-for="(dim, index) in selectedElement.dimension"
              :key="dim.id"
              class="badge bg-success d-flex align-items-center"
            >
              {{ dim.label }}
              <button
                type="button"
                class="btn-close btn-close-white btn-sm ms-2"
                aria-label="Supprimer"
                @click="removeDimension(index)"
              ></button>
            </span>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useTestStore } from '@/stores/testStore'
  
  const selectedDimensionId = ref('')
  const store = useTestStore()
  
  const testData = computed(() => store.testData)
  const selectedElement = computed(() => store.selectedElement)
  
  // 🔼 Ajout d'une dimension complète (objet : id, label, description)
  function addDimension() {
    const dim = testData.value.dimensions.find(d => d._id === selectedDimensionId.value)
    if (!dim) return
  
    if (!selectedElement.value.dimension) {
      selectedElement.value.dimension = []
    }
  
    const exists = selectedElement.value.dimension.some(d => d.id === dim._id)
    if (!exists) {
      selectedElement.value.dimension.push({
        id: dim._id,
        label: dim.label,
        description: dim.description
      })
      store.updateElement(selectedElement.value) // Mise à jour dans le store
    }
  
    selectedDimensionId.value = ''
  }
  
  // ❌ Retirer une dimension
  function removeDimension(index) {
    selectedElement.value.dimension.splice(index, 1)
    store.updateElement(selectedElement.value)
  }
  </script>
  
  <style scoped>
  .dim-container {
    border-top: 1px gainsboro solid;
    padding: 5px;
  }
  
  .badge-success {
    color: #fff;
    background-color: #28a745;
  }
  </style>
  