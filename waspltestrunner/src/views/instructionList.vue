<template>
    <div>
      <button
        v-if="collapsible"
        class="btn-toggle"
        @click="toggle"
      >
        <span v-if="isOpen">▾ Hide instructions</span>
        <span v-else>▸ Show instructions</span>
      </button>
  
      <transition name="fade">
        <ul v-show="!collapsible || isOpen" class="instructionList">
          <li v-if="publication.access === 'multiple'">☑️ You can access to the test multiple times.</li>
          <li v-if="publication.access === 'unique'">🔑 Be careful, you have only one attempt for this test! Be Ready!</li>
          <li v-if="publication.timeLimit === true">⏱️The time is limited to {{publication.testId?.duration}} minutes. Check the chronometer!</li>
          <li v-if="publication.skip === true">🚶‍♀️ Skipping questions is allowed to continue the test...</li>
          <li v-if="publication.skip === false">✋️ Impossible to skip a question, you must answer!</li>
          <li v-if="publication.browsing === 'backPossible'">🔙 You will be able to go back to a previous page.</li>
          <li v-if="publication.browsing === 'noBack'">⛔ Going back to previous pages is forbidden.</li>
          <li v-if="publication.testMap === true">🗺️ A test map will help you to follow your progression.</li>
          <li v-if="publication.readOnlyAnswer">👓 Read-Only: Once you have answered, you can't change your answer.</li>
          <li v-if="publication.revealQuestionNB === true">🧮The test have {{publication.testId?.elements.length}} questions in total</li>
        </ul>
      </transition>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  const props = defineProps({
    publication: { type: Object, required: true },
    collapsible: { type: Boolean, default: true }
  });
  
  const isOpen = ref(true); // par défaut ouvert pour collapsible = false
  
  if (props.collapsible) {
    isOpen.value = false; // replié au début si mode escamotable
  }
  
  const toggle = () => {
    isOpen.value = !isOpen.value;
  };
  </script>
  
  <style scoped>
  .btn-toggle {
    background: none;
    border: none;
    color: #007bff;
    cursor: pointer;
    padding: 0.25rem;
    
  }
  .instructionList {
    margin-top: 0.5rem;
    padding-left: 1.2rem;
  }
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .instructionList{
 
 list-style-type: none;
 padding-left: 10px; /* Retire aussi l'espace par défaut à gauche */
 margin-left: 0;

}
  </style>
  