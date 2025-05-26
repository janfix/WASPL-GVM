<template>
  
  <div class="homeContainer">
    <h1 class="text-primary">Get ready {{ user.firstName }} to start the assessment session</h1>
    <div class="lead">The {{ testData.preset }} mode is activated.</div>
    <div>Check the test rules, and when you are ready, click on the start test button bellow!</div>
<hr>
    <h1>{{ testData.title }}</h1>
    <p>{{ testData.Description }}</p>
    <p> Navigation rules : </p>
    <ul>
      <li v-if="testData.settings.skip === true">
      Skipping a question is allowed
      </li>
      <li v-else="testData.settings.skip === false">
      Skipping a question is not allowed - 
      </li>
      <li v-if="testData.navigation === 'backPossible'">
      Browsing back to modify or complete your answers is allowed.
      </li>
      <li v-if="testData.navigation === 'backReadOnly'">
      Browsing back to read your answers is allowed. It will not be possible to modify your answer.
      </li>
      <li v-if="testData.navigation === 'BackforEmptys'">
      Browsing back is possible only to complete non answered question(s).
      </li>
      <li v-if="testData.navigation === 'noBack'">
      Browsing back is not allowed.
      </li>
    </ul>
    <p v-if="testData.settings.timeLimit" >This test is limited up to .. {{testData.duration}}</p>
    <hr>
    
    <button class="btn btn-success" @click="startTest">Start Test</button>
  </div>
  <hr>
  <div class="container m-4">
    <button class="disco" @click="handleLogout">Disconnect</button>
    
   
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import testData from '../data/testData.json';
import Navbar from '../components/Navbar.vue';
import { useAuthStore } from '../stores/auth';
import { computed } from 'vue';

const authStore = useAuthStore();

// Obtenir les informations de l'utilisateur depuis le store
const user = computed(() => authStore.user);

// Fonction de déconnexion
const handleLogout = () => {
  authStore.logout();
  console.log('Utilisateur déconnecté');
  window.location.reload();
};


// Initialisation du routeur
const router = useRouter();

// Fonction pour démarrer le test
function startTest() {
  router.push('/test-runner');
}
</script>

<style scoped>

</style>
