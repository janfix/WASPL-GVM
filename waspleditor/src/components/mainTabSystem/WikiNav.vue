<script setup>
import { ref, onMounted } from 'vue'
import WikiViewer from './WikiViewer.vue'
import TreeNode from './TreeNode.vue'

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const tree = ref({})
const currentFile = ref('index.md')
const openFolders = ref(new Set())

// Fonction récursive de construction de l'arborescence
function buildTree(paths) {
  const root = {}
  for (const path of paths) {
    const parts = path.split('/')
    let current = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      if (!current[part]) {
        current[part] = isFile ? { __file: true, path } : {}
      }
      current = current[part]
    }
  }
  return root
}

// Ouvrir/fermer les dossiers
const toggleFolder = (name) => {
  if (openFolders.value.has(name)) openFolders.value.delete(name)
  else openFolders.value.add(name)
}

const isFolderOpen = (name) => openFolders.value.has(name)

// Chargement initial
onMounted(async () => {
  const res = await fetch(`${VITE_API_BASE_URL}/api/wiki-files`)
  const filesArray = await res.json()
  tree.value = buildTree(filesArray)
})
</script>

<template>
  <div class="d-flex">
    <aside class="p-3 border-end bg-light" style="min-width: 250px;">
      <h5 class="mb-3">📂 Wiki</h5>
      <TreeNode
        :node="tree"
        :open-folders="openFolders"
        @select="currentFile = $event"
        @toggle="toggleFolder"
        :is-open="isFolderOpen"
      />
    </aside>

    <main class="flex-grow-1 p-4">
      <WikiViewer v-model:file="currentFile" />
    </main>
  </div>
</template>

<style scoped>
button {
  cursor: pointer;
  color: #007bff;
}
button:hover {
  text-decoration: underline;
}
</style>
