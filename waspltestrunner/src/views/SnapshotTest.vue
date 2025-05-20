<template>
  <div>
    <h2>Test de Snapshot - Contenu Dynamique</h2>

    <div v-if="!snapshotTaken">
      <div id="snapshot-container" class="p-4 border" style="min-height: 600px; background: #f8f9fa;">
        <h3>Contenu interactif de base</h3>
        <input type="text" placeholder="Tapez ici..." class="form-control mb-2" />
        <input type="checkbox" id="check1" />
        <label for="check1">Accepter</label>

        <div class="dynamic-content mt-4">
          <h4>Champs ajoutés dynamiquement :</h4>
          <div v-for="(field, index) in dynamicFields" :key="index" class="mb-2">
            <input
              type="text"
              class="form-control"
              :placeholder="field.placeholder"
            />
          </div>
        </div>

        <button class="btn btn-secondary mt-4" @click="addField">
          ➕ Ajouter un champ dynamique
        </button>
      </div>

      <button class="btn btn-primary mt-4" @click="takeSnapshot">
        📸 Prendre Snapshot
      </button>
    </div>

    <div v-else>
      <h3>Snapshot généré :</h3>
      <img :src="snapshotSrc" style="width: 100%; height: auto;" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import html2canvas from 'html2canvas';

const snapshotTaken = ref(false);
const snapshotSrc = ref(null);
const dynamicFields = ref([]);

// Fonction pour ajouter un champ dynamique
function addField() {
  dynamicFields.value.push({
    placeholder: `Champ dynamique ${dynamicFields.value.length + 1}`
  });
}

// Fonction pour prendre le snapshot
async function takeSnapshot() {
  const container = document.getElementById('snapshot-container');
  if (!container) {
    console.error('Container non trouvé.');
    return;
  }

  const canvas = await html2canvas(container, {
    scrollY: -window.scrollY,
    useCORS: true,
    allowTaint: true,
    windowWidth: container.scrollWidth,
    windowHeight: container.scrollHeight
  });

  snapshotSrc.value = canvas.toDataURL();
  snapshotTaken.value = true;
}
</script>

<style scoped>
#snapshot-container {
  background-color: #fff;
  padding: 20px;
  margin-top: 20px;
}
</style>
