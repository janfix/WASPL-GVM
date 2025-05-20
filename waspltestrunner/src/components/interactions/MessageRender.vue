<template>
  <div class="interaction-message container">
    <hr>
    <h3>{{ question.el_Text }}</h3>
    <div v-html="question.el_RichText"></div>
  </div>
</template>

<script setup>
defineEmits(['interaction-started'])
defineProps({
  question: {
    type: Object,
    required: true,
  },
  testData: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.interaction-message {
  margin: 1em 0;
}
</style>
