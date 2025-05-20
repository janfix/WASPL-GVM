<script setup>
import { ref, onMounted, watch } from 'vue'
import { marked } from 'marked'

const emit = defineEmits(['update:file'])

function rewriteLinks(html) {
  const basePath = '/wiki/' // dossier backend
  return html.replace(/href="((?!http)[^"]+\.md)"/g, (match, p1) => {
    return `href="#" data-mdlink="${p1}"`;
  })
}

const props = defineProps({
  file: {
    type: String,
    default: 'index.md'
  }
})

const rawContent = ref('')
const htmlContent = ref('')

const fetchMarkdown = async () => {
  const response = await fetch(`/wiki/${props.file}`)
  rawContent.value = await response.text()
  const rawHtml = marked.parse(rawContent.value)
  htmlContent.value = rewriteLinks(rawHtml)
}

const onClick = (e) => {
  if (e.target.matches('[data-mdlink]')) {
    e.preventDefault()
    const newFile = e.target.getAttribute('data-mdlink')
    emit('update:file', newFile)
  }
}


onMounted(fetchMarkdown)
watch(() => props.file, fetchMarkdown)
</script>

<template>
 <div class="wiki-viewer" v-html="htmlContent" @click="onClick" />
</template>

<style scoped>
.wiki-viewer {
  padding: 1rem;
  max-width: 900px;
  margin: auto;
  font-family: system-ui, sans-serif;
  line-height: 1.6;
}
.wiki-viewer h1, .wiki-viewer h2 {
  border-bottom: 1px solid #ddd;
  margin-top: 2rem;
}
</style>
