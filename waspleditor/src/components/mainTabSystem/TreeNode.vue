<script setup>
const props = defineProps({
  node: Object,
  openFolders: Object, // Set
  isOpen: Function,
})
const emit = defineEmits(['select', 'toggle'])

const isFolder = (entry) => typeof entry === 'object' && !entry.__file
</script>

<template>
  <ul class="list-unstyled ps-2">
    <li v-for="(child, name) in node" :key="name">
      <template v-if="child.__file">
        <!-- FICHIER MARKDOWN -->
        <button
          class="btn btn-link p-0 text-start"
          @click="$emit('select', child.path)"
        >
          📄 {{ name.replace('.md', '') }}
        </button>
      </template>

      <template v-else>
        <!-- DOSSIER -->
        <div
          @click="$emit('toggle', name)"
          class="fw-bold"
          style="cursor: pointer"
        >
          {{ isOpen(name) ? '📂' : '📁' }} {{ name }}
        </div>
        <!-- ENFANTS -->
        <TreeNode
          v-if="isOpen(name)"
          :node="child"
          :open-folders="openFolders"
          :is-open="isOpen"
          @select="$emit('select', $event)"
          @toggle="$emit('toggle', $event)"
        />
      </template>
    </li>
  </ul>
</template>
