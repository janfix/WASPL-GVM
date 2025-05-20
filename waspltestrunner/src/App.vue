<template>

  <router-view />
 
</template>

<script setup>
import { useAuthStore } from './stores/auth';
import { ref, onMounted } from 'vue'
const toastMessage = ref('');

const authStore = useAuthStore();

onMounted(() => {
  window.addEventListener("show-toast", (e) => {
    toastMessage.value = e.detail;
    setTimeout(() => toastMessage.value = "", 5000);
  });
});
</script>


<style>
nav {
  padding: 30px;
  text-align: center;
}

nav a {
  margin: 0 10px;
  color: #2c3e50;
  text-decoration: none;
}

nav a.router-link-active {
  color: #42b983;
}

.disco {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.disco:hover {
  background-color: #c0392b;
}
</style>
