<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const isSubmitting = ref(false)

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const register = async () => {
  error.value = ''

  if (!username.value || !email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }

  if (!emailRegex.test(email.value)) {
    error.value = 'Adresse email invalide.'
    return
  }

  if (password.value.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Les mots de passe ne correspondent pas.'
    return
  }

  isSubmitting.value = true

  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${import.meta.env.VITE_AUTH_ENDPOINT}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()

    if (response.ok) {
      router.push('/login')
    } else {
      error.value = data.error || 'Erreur inconnue.'
    }
  } catch (err) {
    console.error('Erreur API register:', err)
    error.value = 'Une erreur est survenue.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Inscription</h2>
            <form @submit.prevent="register">
              <div class="mb-3">
                <label for="username" class="form-label">Nom d'utilisateur</label>
                <input
                  type="text"
                  class="form-control"
                  id="username"
                  v-model="username"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  type="email"
                  class="form-control"
                  id="email"
                  v-model="email"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input
                  type="password"
                  class="form-control"
                  id="password"
                  v-model="password"
                  required
                >
              </div>

              <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirmer le mot de passe</label>
                <input
                  type="password"
                  class="form-control"
                  id="confirmPassword"
                  v-model="confirmPassword"
                  required
                >
              </div>

              <div v-if="error" class="alert alert-danger">
                {{ error }}
              </div>

              <button type="submit" class="btn btn-primary w-100" :disabled="isSubmitting">
                S'inscrire
              </button>

              <div class="text-center mt-3">
                <router-link to="/login">Déjà inscrit ? Connectez-vous</router-link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
