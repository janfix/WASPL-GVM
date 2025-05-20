<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: String,
  label: {
    type: String,
    default: 'ISCED Level'
  }
})

const emit = defineEmits(['update:modelValue'])

const iscedLevels = [
  { code: 'ISCED_0', label: 'Early childhood education (Level 0)' },
  { code: 'ISCED_1', label: 'Primary education (Level 1)' },
  { code: 'ISCED_2', label: 'Lower secondary education (Level 2)' },
  { code: 'ISCED_3', label: 'Upper secondary education (Level 3)' },
  { code: 'ISCED_4', label: 'Post-secondary non-tertiary education (Level 4)' },
  { code: 'ISCED_5', label: 'Short-cycle tertiary education (Level 5)' },
  { code: 'ISCED_6', label: 'Bachelor’s or equivalent (Level 6)' },
  { code: 'ISCED_7', label: 'Master’s or equivalent (Level 7)' },
  { code: 'ISCED_8', label: 'Doctoral or equivalent (Level 8)' }
]
</script>

<template>
  <div class="form-floating">
    <select
      class="form-select"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option disabled value="">Choose a level</option>
      <option v-for="level in iscedLevels" :key="level.code" :value="level.code">
        {{ level.label }}
      </option>
    </select>
    <label>{{ label }}</label>
  </div>
</template>
