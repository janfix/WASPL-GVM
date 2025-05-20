<template>
  <div class="login">
    <h2>Connexion</h2>
    <div v-if="showSessionExpired" class="alert-session-expired">
  Votre session a expiré. Veuillez vous reconnecter.
</div>
    <form @submit.prevent="handleLogin">
      <div>
        <label>Email:</label>
        <input type="email" v-model="email" required>
      </div>
      <div>
        <label>Mot de passe:</label>
        <input type="password" v-model="password" required>
      </div>
      <button type="submit">Se connecter</button>
    </form>
  </div>
</template>

<script setup>
import {computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const route = useRoute();
const showSessionExpired = computed(() => route.query.reason === 'expired');

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await authStore.login(email.value, password.value);
    router.push('/Publications');// Redirige vers la page d'accueil
    console.log('Redirection vers la page d\'accueil');
    console.log(authStore.user.groups);
  } catch (error) {
    alert('Erreur de connexion');
  }
};
</script>

<style scoped>
.alert-session-expired {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px;
  border: 1px solid #ffeeba;
  border-radius: 5px;
  margin-bottom: 20px;
}


.login {
  max-width: 400px;
  padding: 20px;
  background-color: #f9f9f9; /* Optionnel pour une meilleure visibilité */
  border-radius: 8px; /* Ajout d'une bordure arrondie */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Optionnel pour un effet d'élévation */
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background-color: #f3f4f6; /* Optionnel pour un contraste agréable */
}

form div {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px; /* Arrondi du bouton */
}

button:hover {
  background-color: #45a049;
}

</style>