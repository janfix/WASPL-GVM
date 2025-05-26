<template>
  <div class="login">
    <h2>{{ $t('Connection') }}</h2>
    <div v-if="showSessionExpired" class="alert-session-expired">
      {{ $t('Your session has expired. Please sign in again.') }}
    </div>
    <form @submit.prevent="handleLogin">
      <div>
        <label>{{ $t('Email') }}:</label>
        <input type="email" v-model="email" required />
      </div>
      <div>
        <label>{{ $t('Password') }}:</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">{{ $t('Sign in') }}</button>
    </form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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
    router.push('/Publications');
    console.log("Redirection vers la page d'accueil");
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
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
  background-color: #f3f4f6;
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
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}
</style>
