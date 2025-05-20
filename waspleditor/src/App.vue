<script setup>
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';

const userStore = useUserStore();
console.log(userStore)
const router = useRouter();


onMounted(() => {
  if (!userStore.user || !userStore.user.email) {
    userStore.loadUserOnInit(router)
  }
})
</script>

<template>
  <router-view></router-view>
</template>

<style>
.btn-console {
  background-color: rgb(78 54 54);
  color: white;
}
</style>