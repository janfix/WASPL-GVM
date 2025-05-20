<script setup>
import { ref } from 'vue';
import TabulatorRemote from '@/components/common/TabulatorRemote.vue';
import getResultColumns from '@/columns/results.js';
import PublicationExports from './PublicationExports.vue'

const tabRef = ref();

const resultColumns = getResultColumns(() => {
  tabRef.value?.reloadData();
});
</script>

<template>
  <div class="mainContainer">
<div class="row">
  <div class="col-1"><img width="100px" src="../../assets/R.png" alt="Result process logo" /></div>
  <div class="col mt-4"><h1>Results</h1></div>
</div>



    <p>Choose a publication and download the results</p>
    
    <PublicationExports />

    <!-- <TabulatorRemote
      ref="tabRef"
      :columns="resultColumns"
      apiUrl="http://localhost:4000/api/results/summaries"
      :pagination="false"
      :header-filters="true"
      tableType="results"
    /> -->
  </div>
</template>

<style scoped>
.mainContainer{
  padding : 20px;
}
</style>
