<template>
    <div class="mt-2">
      <!-- Navigation Tabs -->
      <ul class="nav nav-tabs">
        <li v-for="(tab, index) in tabs" :key="index" class="nav-item">
          <a
            class="nav-link"
            :class="{ active: activeTab === index }"
            href="#"
            @click.prevent="selectTab(index)"
          >
            {{ tab.label }}
          </a>
        </li>
      </ul>
  
      <!-- Tab Content -->
      <div class="tab-content">
        <component
          :is="activeTabComponent"
          v-bind="getComponentProps(activeTabComponent)"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from "vue";
  import WasplTest from "./mainTabSystem/WasplTest.vue";
  import ItemBank from "./mainTabSystem/ItemBank.vue";
  import PublicationManager from "./mainTabSystem/PublicationManager.vue";
  import GroupManager from "./mainTabSystem/GroupManager.vue";
  import Results from "./mainTabSystem/Results.vue";
  import Documentation from "./mainTabSystem/Documentation.vue";
  import About from "./mainTabSystem/About.vue";
  
  const props = defineProps({
    //Todo
  });
  
  // Define tabs with their labels and components
  const tabs = [
    { label: "Test Manager", component: WasplTest },
    { label: "Item Collection", component: ItemBank },
    { label: "Publication", component: PublicationManager },  
    { label: "Group Manager", component: GroupManager }, 
    { label: "Results", component: Results },   
    { label: "Documentation", component: Documentation },
    { label: "About", component: About },
  ];
  
  // Active tab index
  const activeTab = ref(0);
  
  // Computed property to determine the active component
  const activeTabComponent = computed(() => tabs[activeTab.value].component);
  
  // Function to provide props based on the component
  const getComponentProps = (component) => {
    if (component === WasplTest) {
      return {
        prompt: "This is an example", // Example to pass props
      };
    }
    return {}; // No props for other components
  };
  
  // Method to select a tab
  function selectTab(index) {
    activeTab.value = index;
  }
  </script>
  
  <style scoped>
  .nav-tabs .nav-link.active {
    font-weight: bold;
    border-color: #dee2e6 #dee2e6 #F8F9FA;
    background-color: #F8F9FA;
  }
  </style>
  