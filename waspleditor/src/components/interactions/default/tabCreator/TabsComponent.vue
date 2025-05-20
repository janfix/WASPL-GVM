<template>
  <div>
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
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import CreateComponent from "./CreateComponent.vue";
import AIGenerateComponent from "./AIGenerateComponent.vue";
import ImportComponent from "./ImportComponent.vue";

const props = defineProps({
  selectedElement: Object,
});

// Define tabs with their labels and components
const tabs = [
  { label: "Create", component: CreateComponent },
  { label: "AI Generate", component: AIGenerateComponent },
  //{ label: "Import", component: ImportComponent },
];

// Active tab index
const activeTab = ref(0);

// Computed property to determine the active component
const activeTabComponent = computed(() => tabs[activeTab.value].component);

// Function to provide props based on the component
const getComponentProps = (component) => {
  if (component === AIGenerateComponent) {
    return {
      prompt: "This is the AI prompt", // Example prompt
      selectedElement: props.selectedElement, // Pass selectedElement to AIGenerateComponent
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
  border-color: #dee2e6 #dee2e6 #fff;
}
</style>
