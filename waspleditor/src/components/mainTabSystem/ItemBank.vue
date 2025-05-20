<template>
  <div class="main">
    <!-- The ITEM-Bank list -->
    <itemList ref="itemListRef" @select-item="handleItemSelection" />
    
    <!-- The item-Previewer -->
    <br>
    <itemBankPreviewer :selected-item="selectedItem"/>

    <!-- The ItemCard for details -->
    <itemCard :selected-item="selectedItem" @refresh="refreshItems" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import itemList from "../itemBank/itemList.vue";
import itemCard from "../itemBank/itemCard.vue";
import itemBankPreviewer from "../itemBank/itemBankPreviewer.vue";

const itemListKey = ref(0);


// Référence pour stocker l'item sélectionné
const selectedItem = ref(null);

// Référence vers le composant itemList
const itemListRef = ref(null);

// Fonction appelée lorsque l'utilisateur sélectionne un item
function handleItemSelection(item) {
  selectedItem.value = item;
}

// Fonction appelée après mise à jour d’un item
function refreshItems() {
  itemListRef.value?.reloadTable();
}
</script>

<style scoped>
.main {
  background-color: #F8F9FA;
  padding: 30px;
  border-left: 1px gainsboro solid;
}
</style>
