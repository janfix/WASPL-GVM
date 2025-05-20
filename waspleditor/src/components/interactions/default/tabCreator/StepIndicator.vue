<template>
  <ul class="wizard-steps list-inline">
    <li class="list-inline-item" :class="{active: step >= 1}">1️⃣ AI Choice</li>

    <!-- API mode has an extra step for config -->
    <li v-if="mode === 'api'" class="list-inline-item" :class="{active: step >= 2}">2️⃣ API Config</li>

    <li class="list-inline-item" :class="{active: step >= (mode === 'api' ? 3 : 2)}">
      {{ mode === 'api' ? '3️⃣ Prompt' : '2️⃣ Prompt' }}
    </li>

    <li class="list-inline-item" :class="{active: step >= (mode === 'api' ? 4 : 3)}">
      {{ mode === 'api' ? '4️⃣ Review' : '3️⃣ Review' }}
    </li>

    <li class="list-inline-item" :class="{active: step >= (mode === 'api' ? 5 : 4)}">
      {{ mode === 'api' ? '5️⃣ Results' : '4️⃣ Results' }}
    </li>
  </ul>
</template>

<script setup>
defineProps({
  step: Number,
  mode: String
});
</script>

<style scoped>
.wizard-steps li {
  padding: 0.5rem 1rem;
  border-bottom: 2px solid #ccc;
}
.wizard-steps li.active {
  border-color: #0d6efd;
  font-weight: bold;
}
</style>
