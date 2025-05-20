<template>
  <div>
    <h3>IMPORT FROM ITEM LIB</h3>
    <p>This is the content for the first link.</p>

    <!-- Affiche la bibliothèque d’items si demandée -->
    <itemBankGrabber
      v-if="ItemBGrab"
      @close="toggleItemBank"
      :isVisible="true"
      :showItemBank="true"
    />
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import itemBankGrabber from '@/components/testTabSystem/itemBankgrabber.vue';

const props = defineProps({
  showItemBank: Boolean,
});

const ItemBGrab = ref(true);


// Synchronise l’état local avec la prop
watchEffect(() => {
  ItemBGrab.value = true;
  console.log("🚨 showItemBank prop:", props.showItemBank);
});

// Méthode appelée quand l’utilisateur ferme l’itemBank
const toggleItemBank = () => {
  console.log("🚨 showItemBank prop:", props.showItemBank);
  ItemBGrab.value = false;
  clearPreviewAndEditor();
};

// Nettoyage (si besoin plus tard)
const clearPreviewAndEditor = () => {
  currentPreviewElement.value = null;
  currentEditorElement.value = null;
};

const currentPreviewElement = ref(null);
const currentEditorElement = ref(null);
</script>
