<script setup>
import studentImport from "../students/StudentImportComponent.vue";
import groupList from "../students/groupList.vue";
import studentList from "../students/studentList.vue";
import add1student from "../students/add1student.vue";
import groupCreator from "../students/groupCreator.vue";
import groupCardEditor from "../students/groupCardEditor.vue";
import api from "@/services/axios";
import { ref, onMounted } from "vue";

// Identifiant du groupe sélectionné
const selectedGroupId = ref(null);
const selectedGroupForEdit = ref(null);
const refreshKey = ref(0);

function refreshGroups() {
  groupRefreshFlag.value++;
  refreshGroupList();
}

const groupRefreshFlag = ref(0);

// Liste des groupes
const groupListData = ref([]); // Déclarez groupListData

// Appeler la méthode pour rafraîchir la liste des groupes au montage
onMounted(() => {
  refreshGroupList(); // Charge les données des groupes à l'initialisation
});


// Rafraîchir la liste des groupes
async function refreshGroupList() {
  

  try {
    const response = await api.get(`/groups`);
    console.log("GROUPLIST :", response.data.groups )

    if (!Array.isArray(response.data.groups)) {
      console.error("Erreur: la réponse API ne contient pas un tableau", response.data);
      return;
    }

    groupListData.value = response.data.groups; // Prendre uniquement le tableau
    selectedGroupForEdit.value = null;  // Ferme l'éditeur après mise à jour

  } catch (error) {
    console.error("Error refreshing group list:", error);
    alert("Failed to refresh group list.");
  }
}


// Ouvrir l'éditeur de groupe
function showGroupCardEditor(group) {
  console.log("Données du groupe à éditer :", group); // Log pour debug
  selectedGroupForEdit.value = { ...group }; // Force la création d'un nouvel objet pour garantir la réactivité
}

// Filtrer par groupe
function handleGroupSelection(groupId) {
  console.log("📡 Groupe sélectionné dans le parent :", groupId);
  selectedGroupId.value = groupId;
}

function clearGroupFilter(deletedGroupId) {
  if (selectedGroupId.value === deletedGroupId) {
    selectedGroupId.value = null;
  }
}

const showImport = ref(false);
const showAdd1Student = ref(false);
const showGroupCreator = ref(false);

const toggleShowImport = () => {
  showImport.value = !showImport.value;
  showGroupCreator.value = false;
  showAdd1Student.value = false;
};

const toggleshowAdd1Student = () => {
  showImport.value = false;
  showGroupCreator.value = false;
  showAdd1Student.value = !showAdd1Student.value;
};

const toggleshowGroupCreator = () => {
  showImport.value = false;
  showAdd1Student.value = false;
  showGroupCreator.value = !showGroupCreator.value;
};

function onGroupCreated() {
 // refreshKey.value++;              // dit à TabulatorRemote de se recharger
  showGroupCreator.value = false;  
  refreshGroups();       
}


function refreshFromChild() {
  refreshKey.value++; // 🔁 force le reload de TabulatorRemote
}


</script>

<template>
  <div class="main tab">
    <div class="groupContainer">
      <div class="row" style="margin-top:-30px">
        <div class="col-1"><img src="@/assets/GM.png" alt="Logo group manager" class="mb-4" style="width: 100px;" />
          </div>
        <div class="col"><h1>Group Manager</h1></div>
        <div class="col mt-3">
      <button @click="toggleshowGroupCreator()" type="button" class="btn btn-primary ActionCreator-btn">Create a new
        Group</button>
      <button @click="toggleshowAdd1Student()" type="button" class="btn btn-primary ActionStud-btn">Add a
        Student</button>
      <button @click="toggleShowImport()" type="button" class="btn btn-Success ActionImport-btn">Import
        Students</button>
      </div>
    </div>

      <groupCreator v-if="showGroupCreator" @group-created="onGroupCreated" />
      <add1student v-if="showAdd1Student" />
      <studentImport v-if="showImport" />

      <!-- Liste des groupes -->
      <!-- :refresh-flag="refreshKey" -->
      <hr />
    
      <groupList :refresh-flag="groupRefreshFlag" @select-item="handleGroupSelection" @group-edit="showGroupCardEditor"
        @group-deleted="clearGroupFilter" @refresh-request="refreshGroups" />
      <hr />
      <groupCardEditor v-if="selectedGroupForEdit" :group="selectedGroupForEdit" @close="selectedGroupForEdit = null"
        @updated="refreshGroupList" />

      <!-- Liste des étudiants -->
      <studentList 
        :filterGroupId="selectedGroupId" 
        @reset-group="selectedGroupId = null"
        @refresh-group-list="refreshGroups" 
        :refresh-group-options="groupRefreshFlag"
        />
    </div>
  </div>
</template>



<style scoped>
.tab {
  border-left: 1px gainsboro solid;
  background-color: #F8F9FA;
  padding-top: 30px;
}

.groupContainer {
  margin: 20px;
}

.ActionStud-btn {
  background-color: #426c9c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer !important;
  width: 200px !important;
}

.ActionStud-btn:hover {
  background-color: #2e4c6d !important;
}


.ActionImport-btn {
  background-color: #9f42bb;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer !important;
  width: 200px !important;
}

.ActionImport-btn:hover {
  background-color: #5d0d90;
  color: white;
}

.ActionCreator-btn {
  background-color: #b5af16;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer !important;
  width: 200px !important;
}

.ActionCreator-btn:hover {
  background-color: #bac466;
  color: white;
}

.btn-Success {
  background-color: #5cb85c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 10px;
  margin-left: 2px;
  cursor: pointer !important;
  width: 200px !important;

}
</style>