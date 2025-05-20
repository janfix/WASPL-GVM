<template>
    <div class="container p-3">
  
      <div v-if="loading" class="text-muted">Chargement en cours…</div>
      <div v-else-if="error" class="text-danger">{{ error }}</div>
  
      <div v-else class="row gy-3">
        <div v-for="post in posts" :key="post.id" class="col-12">
            <img
              v-if="post.featured_media_url"
              :src="post.featured_media_url"
              class="img-fluid rounded-top"
              style="width: 100%; height: 100px;  object-fit: cover;"
              alt="Miniature"
            />
            <div class="card shadow-sm border-0 d-flex flex-row">
            
            <div class="card-body">
              <h5 class="card-title mb-1">
                <a
                  :href="post.link"
                  target="_blank"
                  class="text-decoration-none link-primary"
                  v-html="post.title.rendered"
                ></a>
              </h5>
              <small class="text-muted">{{ formatDate(post.date) }}</small>
              <p class="card-text mt-2" v-html="post.excerpt.rendered"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { fetchLatestPosts } from '@/services/wordpressService.js'
  
  const posts = ref([])
  const loading = ref(true)
  const error = ref(null)
  
  function formatDate(dateStr) {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  
  onMounted(async () => {
    try {
      const rawPosts = await fetchLatestPosts(5)
      posts.value = await Promise.all(
        rawPosts.map(async (post) => {
          let featured_media_url = null
  
          if (post.featured_media && post._links['wp:featuredmedia']) {
            try {
              const mediaUrl = post._links['wp:featuredmedia'][0].href
              const res = await fetch(mediaUrl)
              if (res.ok) {
                const media = await res.json()
                featured_media_url = media.source_url
              }
            } catch (e) {
              console.warn('Erreur chargement image:', e)
            }
          }
  
          return {
            ...post,
            featured_media_url,
          }
        })
      )
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  })
  </script>
  