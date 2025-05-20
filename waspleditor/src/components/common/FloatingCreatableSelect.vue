<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: String,
  label: String,
  options: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const inputValue = ref(props.modelValue?.trim() || '')
const dropdownOpen = ref(false)
const wrapper = ref(null)

// ⚠️ Nettoyage initial des options : supprime les vides ou nulls
const localOptions = ref(
  [...new Set(props.options.filter(opt => typeof opt === 'string' && opt.trim() !== ''))]
)

// ✅ Liste affichée sans l’option courante
const filteredOptions = computed(() => {
  const val = String(inputValue.value || '').trim()
  return localOptions.value.filter(opt => opt !== val)
})

// ✅ Ajouter une nouvelle valeur
const addIfNew = () => {
  const val = String(inputValue.value || '').trim()
  if (!val || localOptions.value.includes(val)) return
  localOptions.value.push(val)
  emit('update:modelValue', val)
  dropdownOpen.value = false
}

// ✅ Sélection d’une valeur existante
const selectOption = (opt) => {
  inputValue.value = opt
  emit('update:modelValue', opt)
  dropdownOpen.value = false
}

// ✅ Suppression d’une option
const removeOption = (opt) => {
  if (!opt) return
  localOptions.value = localOptions.value.filter(o => o !== opt)
  if (inputValue.value === opt) {
    inputValue.value = ''
    emit('update:modelValue', '')
  }
}

// ✅ Fermer dropdown si clic en dehors
const handleClickOutside = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// ✅ Synchronisation avec modelValue proprement (évite "" en entrée)
watch(() => props.modelValue, (val) => {
  inputValue.value = String(val || '').trim()
})
</script>

<template>
  <div class="form-floating position-relative" ref="wrapper">
    <input
      type="text"
      class="form-control"
      v-model="inputValue"
      @keydown.enter.prevent="addIfNew"
      @focus="dropdownOpen = true"
      :placeholder="label"
    />
    <label>{{ label }}</label>

    <ul
      v-if="dropdownOpen && filteredOptions.length"
      class="dropdown-menu show w-100 mt-1"
      style="max-height: 200px; overflow-y: auto;"
    >
      <li
        v-for="opt in filteredOptions"
        :key="opt"
        class="d-flex justify-content-between align-items-center px-3 py-1"
      >
        <span @click="selectOption(opt)" style="cursor: pointer;">
          {{ opt }}
        </span>
        <button
          class="btn btn-sm btn-link text-danger p-0 ms-2"
          @click.stop="removeOption(opt)"
        >
          ❌
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.dropdown-menu {
  z-index: 1050;
  border: 1px solid #ccc;
  font-size: 0.9rem;
}
</style>
