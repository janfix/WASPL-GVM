<template>
    <div hidden class="notification-wrapper" ref="wrapper">
      <div class="notification-bell" @click="toggleDropdown">
        <span class="bell">🔔</span>
        <span v-if="count > 0" class="badge">{{ displayCount }}</span>
      </div>
      <div v-if="isOpen" class="dropdown">
        <NotificationCenter :notifications="notifications" />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import NotificationCenter from './NotificationCenter.vue'
  import { onClickOutside } from '@vueuse/core'

  
  const props = defineProps({
    count: Number,
    notifications: Array
  })
  
  const isOpen = ref(false)
  
  const toggleDropdown = () => {
    isOpen.value = !isOpen.value
  }
  
  const displayCount = computed(() => {
    return props.count > 99 ? '99+' : props.count
  })
  
  const wrapper = ref(null)
  onClickOutside(wrapper, () => {
    isOpen.value = false
  })
  </script>
  
  <style scoped>
  .notification-wrapper {
    position: relative;
    display: inline-block;
  }
  
  .notification-bell {
    position: relative;
    cursor: pointer;
    font-size: 24px;
  }
  
  .bell {
    font-size: 28px;
  }
  
  .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: white;
    color: black;
    border: 1px solid #999;
    padding: 2px 6px;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    min-width: 20px;
    text-align: center;
    box-shadow: 0 0 2px rgba(0,0,0,0.3);
  }
  
  .dropdown {
    position: absolute;
    top: 35px;
    left: 10px;
    right: 0;
    width: 510px;
    max-height: 600px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    z-index: 1000;
    overflow-y: auto;
    padding: 10px;
  }
  </style>
  