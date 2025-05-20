<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore';
import api from '@/services/axios'

const userStore = useUserStore()

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')

const login = async () => {
  try {
  const response = await api.post('/auth/login', {
    username: username.value,
    password: password.value
  });

  const data = response.data;
  localStorage.setItem('editortoken', data.token);
  await userStore.loadUserOnInit();
  router.push('/home');
} catch (err) {
  console.error("Erreur login:", err);
  console.error("Réponse backend:", err?.response?.data);
  error.value = err?.response?.data?.error || 'Une erreur est survenue';
}
}
</script>

<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-body">
            <h2 class="card-title text-center mb-4">Connexion</h2>
            <form @submit.prevent="login">
              <div class="mb-3">
                <label for="username" class="form-label">Nom d'utilisateur</label>
                <input type="text" class="form-control" id="username" v-model="username" required>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Mot de passe</label>
                <input type="password" class="form-control" id="password" v-model="password" required>
              </div>
              <div v-if="error" class="alert alert-danger">
                {{ error }}
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Se connecter
              </button>
              <div class="text-center mt-3">
                <router-link to="/register">Pas encore inscrit ? Créez un compte</router-link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>