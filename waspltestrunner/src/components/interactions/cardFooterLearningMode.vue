<template>
  <div class="card-footer" style="text-align: right;">
    <button class="btn btn-primary btn-sm" @click="submitAnswers">{{$t('Submit')}}</button>
    <button
      v-if="showReport"
      class="btn btn-console btn-sm ml-2"
      @click="closeReport"
    >
      {{$t('Close Report')}}
    </button>
    <button
      class="btn btn-secondary btn-sm"
      @click="resetSelections"
      style="margin-left: 10px;"
    >
      {{$t('Reset')}}
    </button>
  </div>
</template>

<script setup>


// Props pour récupérer les méthodes et les états depuis le parent
defineProps({
  showReport: {
    type: Boolean,
    required: true,
  },
  submitAnswers: {
    type: Function,
    required: true,
  },
  closeReport: {
    type: Function,
    required: true,
  },
  resetSelections: {
    type: Function,
    required: true,
  },
});
</script>

<style scoped>
.ml-2 {
  margin-left: 10px;
}

.btn-console {
  background-color: rgb(78, 54, 54);
  color: white;
}

.btn-console:hover {
  background-color: rgb(119, 104, 104);
  color: white;
}
</style>
