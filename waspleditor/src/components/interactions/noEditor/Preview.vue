<template>
  <div class="preview-section">
    <div v-if="selectedElement" class="card card-preview">
      <cardHeader 
        :elementLabel="elementLabel" 
        :elementType="selectedElement.el_Type" 
        :mode="'Preview'"
      />
      <div class="card-body">
        <b>Start to code your template here !</b>
      </div>
      <div class="card-footer" style="text-align: right;">
        <button class="btn btn-primary btn-sm">Submit</button>
        <button style="margin-left: 10px;" class="btn btn-secondary btn-sm">Reset</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import cardHeader from '../default/cardHeader.vue';
import { useTestStore } from '../../../stores/testStore'
import { computed, ref, onMounted, watch } from 'vue';

const store = useTestStore()



const selectedElement = computed(() => store.selectedElement)
const elementLabel = computed(() => store.selectedElementLabel)


</script>

<style scoped>
.card-header {
  background-color: #426C9C;
  color: white
};

</style>