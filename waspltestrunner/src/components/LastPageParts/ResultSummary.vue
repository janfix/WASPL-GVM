<template>
    <div class="MainResultContainer">
      <p>
        <b>You have answered {{ answeredCount }} questions out of {{ totalQuestions }}.</b><br>
        Your total score:
        <b>{{ totalScore }} / {{ totalMaxScore }} → {{ percentageScore }}%</b>
      </p>
  
      <p class="message" v-if="hasShortAnswerQuestions">
        Is AI Correction activated for at least one question?<br>
        Please launch AI corrections to finalize your score!
      </p>
    </div>
  </template>
  
  <script setup>
  import { computed } from 'vue';
  
  const props = defineProps({
    answeredCount: Number,
    totalQuestions: Number,
    totalScore: Number,
    totalMaxScore: Number,
    hasShortAnswerQuestions: Boolean
  });
  
  const percentageScore = computed(() => {
    if (!props.totalMaxScore || isNaN(props.totalScore)) return '0.00';
    return ((props.totalScore / props.totalMaxScore) * 100).toFixed(2);
  });
  </script>
  
  <style scoped>
  .MainResultContainer {
    border: 1px solid gainsboro;
    border-radius: 5px;
    padding: 10px;
    margin: 10px;
    box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.05);
  }
  
  .message {
    color: rgb(87, 132, 205);
    animation: blink 3s ease-in-out 12;
    font-weight: bold;
  }
  
  @keyframes blink {
    0%, 100% {
      color: rgb(17, 255, 0);
    }
    50% {
      color: rgb(187, 32, 24);
    }
  }
  </style>
  