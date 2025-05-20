<script setup>
import { useTestStore } from '../stores/testStore'
//import { defineProps } from 'vue';

// Définissez les props acceptées par FileUploader
defineProps({
  title: {
    type: String,
    default: '', // Définissez une valeur par défaut
  },
});

const emit = defineEmits(['import-test', 'close']);

const store = useTestStore()

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        store.setTestData(data)
        localStorage.setItem('testData', JSON.stringify(data))
        emit('import-test', data);
      } catch (error) {
        console.error('Error parsing JSON:', error)
      }
    }
    reader.readAsText(file)
  }
}
</script>

<template>
<input hidden class="form-control" id="file" type="file" accept=".json" @change="handleFileUpload" placeholder="Import WASPL JSON file">
    
<label for="file">Import Test</label>



</template>

<style scoped>
input[type="file"] {
  height: 0;
  width: 0;
  overflow: hidden;
}

input[type="file"] + label {
  text-align: center;
  background-color: #4d9b59;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 5px 10px;
    margin-bottom: 10px;
    margin-left: 2px;
    cursor: pointer !important;
    width: 120px !important;
}

input[type="file"] + label:hover{
  background-color: #376c3f;
}
</style>