<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import MainTabSystem from '../components/MainTabSystem.vue';
import NavBar from '../components/NavBar.vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore()
const router = useRouter()

const logout = () => {
  localStorage.removeItem('token')
  router.push('/login')
}


</script>



<template>
  <div class="app-wrapper d-flex flex-column min-vh-100">
    <NavBar />
    <main class="flex-grow-1 py-4">
      <div class="mainContainer">
        <div class="welcome"><b>Welcome to WASPL</b> – the ideal platform to design and manage complete assessment processes. For more information, project updates, support, and networking opportunities, visit <a target="_new" href="https://waspl.wiquid.fr/">waspl.wiquid.fr</a>.</div>
        <div class="tabContainer">
          <MainTabSystem />
        </div>
      </div>
    </main>

    <footer class="bg-dark text-white py-3 mt-auto">
      <div class="container text-center">
        <p class="mb-0">Wiquid Copyright © 2025</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
h1 {
  color: #333;
  font-size: 1.5rem;
  
}

.tabContainer{
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  
}

.dashboard {
  background-color: #f8f9fa;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
 
}
.DashModule {
  background-color: white;
  padding: 10px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin: 5px;
}



</style>

<style>
.tabulator {
  background-color: transparent !important;
}

.card-preview {
  background-color: rgb(243, 243, 243);
}

.dashbordBlock {
    text-align: left;
    margin-bottom: 0.5rem;
    color: #333;
    font-weight: bold;
    font-size: 1.5rem;

}

.infos{
  height:350px;
  overflow-y: scroll;
}

.welcome{
  font-style: italic;
  font-size: 1.1rem;;
  margin-top : 15px;
  margin-bottom: 30px;
  margin-left: 30px;
}
</style>

