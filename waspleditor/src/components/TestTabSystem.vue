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
      <div class="tab-content mt-3">
        <component
          :is="activeTabComponent"
          v-bind="getComponentProps(activeTabComponent)"
          :show-item-bank="showItemBank"
          @toggle-item-bank="toggleItemBank"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from "vue";
  import ContainerEditor from "./testTabSystem/ContainerEditor.vue";
  import TestPreview from "./testTabSystem/TestPreview.vue";
  
  const props = defineProps({
    testId: String, // Recevoir l'ID du test depuis le parent
  });


  const showItemBank = ref(false);

function toggleItemBank() {
  showItemBank.value = !showItemBank.value;
}
  
  // Define tabs with their labels and components
  const tabs = [
   { label: "Editor", component: ContainerEditor },  
   { label: "Test Preview", component: TestPreview },
   
  ];
  
  // Active tab index
  const activeTab = ref(0);
  
  // Computed property to determine the active component
  const activeTabComponent = computed(() => tabs[activeTab.value].component);
  
  // Function to provide props based on the component
  const getComponentProps = (component) => {
    if (component === ContainerEditor) {
      return {
        prompt: "This is a fake Editor to wait", // Example prompt
      };
    }
    return {}; // No props for other components
  };
  
  // Method to select a tab
  function selectTab(index) {
    activeTab.value = index;
  }

  watch(() => props.testId, (newTestID) => {
  console.log("Nouveau test sélectionné :", newTestID);
});
  </script>
  
  <style scoped>
  .nav-tabs .nav-link.active {
    font-weight: bold;
    border-color: #dee2e6 #dee2e6 #fff;
  }
  </style>
  