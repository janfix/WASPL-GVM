<script setup>
import { ref,onMounted, defineExpose } from 'vue';
import TabulatorRemote from '@/components/common/TabulatorRemote.vue';
import { itemColumns } from '@/columns/items';
import { convertQtiToWasplChoice } from '@/utils/qtiToWaspl';
import api from "@/services/axios";

const items = ref([]); 
const columns = itemColumns((id) => deleteItem(id));
const selectedItem = ref(null); // <- ajout ici
const tabulatorRef = ref(null); // ← pour accéder à la méthode reloadData

const emit = defineEmits(['select-item']);
const apiUrl = import.meta.env.VITE_API_BASE_URL + '/items';

function triggerFileSelect() {
  document.getElementById('file-input').click();
}

// Fonction pour charger les items depuis l’API
const loadItems = async () => {
  try {
    const response = await api.get('/items');
    items.value = response.data;
  } catch (error) {
    console.error('Failed to load items', error);
  }
};

// Appel initial
onMounted(() => {
  loadItems();
});

// ✅ expose loadItems() pour le parent
defineExpose({
  reloadTable: () => tabulatorRef.value?.reloadData()
});


async function handleQtiImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const xmlString = reader.result;
      const converted = convertQtiToWasplChoice(xmlString);

      const token = localStorage.getItem('editortoken');

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(converted),
      });

      if (!res.ok) throw new Error('Erreur lors de l’envoi du JSON');
      alert('✅ Item importé avec succès');
      tabulatorRef.value?.reloadData();

    } catch (e) {
      console.error('❌ Import QTI échoué', e);
      alert('Erreur lors de l’import du fichier QTI');
    }
  };

  reader.readAsText(file);
}


// 🧼 Fonction pour supprimer un item et mettre à jour la vue
async function deleteItem(el_ID) {
  try {
    await api.delete(`/items/${el_ID}`); // ou adapte le chemin si ce n’est pas /items

    console.log(`✅ Item ${el_ID} supprimé`);

    tabulatorRef.value?.reloadData();
    emit('select-item', null);

  } catch (err) {
    console.error(`❌ Erreur suppression ${el_ID}`, err);
    alert("Erreur lors de la suppression de l'item.");
  }
}

const searchQuery = ref('')
const filters = ref([])

const onSearch = () => {
  filters.value = [
    { field: 'title', type: 'like', value: searchQuery.value }
  ]
}
</script>

<template>
  <div class="mb-3">
    <div class="row">
      <div class="col-1"> <img width="80px" src="../../assets/ItemBank.png" alt="item bank" class="ItemBank" /></div>
      <div class="col-4"><h1 class="">Item Collection</h1></div>
      <div class="col" style="text-align: right; padding-top:20px">
        <input id="file-input" type="file" accept=".xml" class="d-none" @change="handleQtiImport" />
        <button type="button" class="btn btn-primary" @click="triggerFileSelect">
      Import QTI item
    </button>
      </div>
    </div>
   
    
    
   

  </div>

  <div class="ItemCollectionContainer">
    <h3>Item List</h3>
    <TabulatorRemote ref="tabulatorRef" table-type="items" :api-url="apiUrl" :page-size="10" :columns="columns"
      :filters="filters" @select-item="(item) => emit('select-item', item)" />
  </div>
</template>

<style scoped>
.ItemCollectionContainer{
  margin: 20px 0;
  padding: 10px;
  border-radius: 5px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;  
}

.ItemBank{

  margin-top: -10px;
  }

.itCol-title{
  font-size: 2.5rem;
  margin-left: -30px;
  margin-top: 0px;
  
}
</style>