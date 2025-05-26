<template>
  <div>
    <button
      v-if="collapsible"
      class="btn-toggle"
      @click="toggle"
    >
      <span v-if="isOpen">▾ {{ $t('instructions.hide') }}</span>
      <span v-else>▸ {{ $t('instructions.show') }}</span>
    </button>

    <transition name="fade">
      <ul v-show="!collapsible || isOpen" class="instructionList">
        <li v-if="publication.access === 'multiple'">☑️ {{ $t('instructions.multipleAccess') }}</li>
        <li v-if="publication.access === 'unique'">🔑 {{ $t('instructions.singleAttempt') }}</li>
        <li v-if="publication.timeLimit === true">⏱️ {{ $t('instructions.timeLimited', { minutes: publication.testId?.duration }) }}</li>
        <li v-if="publication.skip === true">🚶‍♀️ {{ $t('instructions.skipAllowed') }}</li>
        <li v-if="publication.skip === false">✋️ {{ $t('instructions.noSkip') }}</li>
        <li v-if="publication.browsing === 'backPossible'">🔙 {{ $t('instructions.backPossible') }}</li>
        <li v-if="publication.browsing === 'noBack'">⛔ {{ $t('instructions.noBack') }}</li>
        <li v-if="publication.testMap === true">🗺️ {{ $t('instructions.testMap') }}</li>
        <li v-if="publication.readOnlyAnswer">👓 {{ $t('instructions.readOnly') }}</li>
        <li v-if="publication.revealQuestionNB === true">🧮 {{ $t('instructions.totalQuestions', { count: publication.testId?.elements.length }) }}</li>
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

const isOpen = ref(true);

if (props.collapsible) {
  isOpen.value = false;
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
  list-style-type: none;
  padding-left: 10px;
  margin-left: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
