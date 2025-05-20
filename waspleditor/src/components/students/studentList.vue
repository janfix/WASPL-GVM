<template>
  <div class="StudentListContainer">
    <h1>
      Student database
      <span v-if="selectedGroupName"> - filter: {{ selectedGroupName }}</span>
    </h1>
    <hr>

    <!-- Actions -->
    <div class="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
  <!-- Bloc gauche -->
  <div class="d-flex align-items-center gap-2">
    <button class="btn btn-danger" @click="deleteAllStudents">🗑️</button>
    <button class="btn btn-secondary" @click="resetGroupFilter">Reset Group Filter</button>
  </div>

  <!-- Bloc droite -->
  <div class="d-flex align-items-center gap-2">
    <select v-model="selectedGroupId" class="form-select w-auto">
      <option disabled value="">Select Group</option>
      <option v-for="group in groupList" :key="group._id" :value="group._id">
        {{ group.groupName }}
      </option>
    </select>
    <button class="btn btn-success" @click="addSelectedToGroup" :disabled="!selectedGroupId">
      Add students to the selected group
    </button>
  </div>
</div>





    <!-- Tableau Tabulator -->
    <TabulatorRemote ref="tabulatorRef" :apiUrl="`/students`" :columns="studentColumns" :filters="computedFilters"
      :key="componentKey" :onDelete="deleteStudent" selectionMode="multi" @select-items="handleSelectedStudents"
      @edit-student="openStudentModal" tableType="students" />
    <StudentModal v-if="showModal" :student="selectedStudent" :onDelete="deleteStudent" :onUpdate="updateStudent"
      @close="showModal = false" />

  </div>
  <!-- @select-item="handleRowClick" -->

  <div class="toast-container position-fixed top-0 end-0 p-3" style="z-index: 1100">
    <div class="toast align-items-center text-bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true"
      ref="successToast">
      <div class="d-flex">
        <div class="toast-body">{{ toastMessage }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="hideToast"></button>
      </div>
    </div>
  </div>

</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import api from "@/services/axios";
import TabulatorRemote from '@/components/common/TabulatorRemote.vue';
import { studentColumnsBase } from '@/columns/students.js';
import StudentModal from '@/components/students/studentModal.vue';



const props = defineProps({
  filterGroupId: String,
  refreshGroupOptions: Number, 
});

console.log("🧪 filterGroupId au mount :", props.filterGroupId);

const selectedGroupName = computed(() => {
  if (!props.filterGroupId) return null;
  const group = groupList.value.find(g => g._id === props.filterGroupId);
  return group?.groupName || null;
});

const emit = defineEmits(['select-item', 'reset-group','refresh-group-list']);


const showModal = ref(false);


const studentColumns = computed(() => studentColumnsBase);

const componentKey = ref(Date.now()); // Rechargement forcé
const selectedStudent = ref(null);

// Champs filtres dynamiques utilisateur
const filterField = ref('');
const filterType = ref('=');
const filterValue = ref('');

const refreshSelectedStudent = async () => {
  if (!selectedStudent.value || !selectedStudent.value._id) return;
  try {
    const { data } = await api.get(`/students/${selectedStudent.value._id}`);
    selectedStudent.value = data;
  } catch (err) {
    console.error("❌ Erreur lors de la mise à jour de la fiche étudiante :", err);
  }
};



const updateStudent = async (updatedData) => {
  try {
    const allowedFields = [
      'firstname',
      'lastname',
      'email',
      'institution',
      'sector',
      'grade',
      'location',
      'zipcode'
    ];

    const filteredData = Object.fromEntries(
      Object.entries(updatedData).filter(([key]) => allowedFields.includes(key))
    );

    await api.put(`/students/${updatedData._id}`, filteredData);
    console.log("✅ Student updated:", filteredData);

    // 🔁 Refresh la table Tabulator
    if (tabulatorRef.value?.tableInstance()?.setData) {
  tabulatorRef.value.tableInstance().setData()
} else {
  console.warn("🔍 Impossible de rafraîchir la table : instance Tabulator introuvable");
}


  } catch (err) {
    console.error("❌ Failed to update student:", err.response?.data || err.message);
  }
};

const selectedStudents = ref([]);

// Modifier la fonction de gestion des sélections
function handleSelectedStudents(students) {
  // Maintenant nous recevons toujours un tableau
  selectedStudents.value = students;
  console.log(`✅ ${students.length} étudiants sélectionnés`);
}



// 🎯 Recalcul des filtres envoyés à TabulatorRemote
const computedFilters = computed(() => {
  const filters = [];
  if (props.filterGroupId) {
    filters.push({ field: 'group', type: '=', value: props.filterGroupId });
  }
  /* if (filterField.value && filterValue.value) {
      filters.push({
          field: filterField.value,
          type: filterType.value,
          value: filterValue.value,
      });
  } */
  return filters;
});


watch(() => props.refreshGroupOptions, () => {
  loadGroups();
});

// 🔁 Rafraîchit la table si le groupe change
watch(() => props.filterGroupId, (newVal) => {
  console.log("🟢 Nouveau groupId reçu :", newVal);
  componentKey.value = Date.now();
});

// 👉 Action lorsqu’une ligne est cliquée
function handleRowClick(student) {
  console.log("Élève cliqué :", student);
  selectedStudent.value = student;
  showModal.value = true;
}

// ✉️ Émettre vers parent
function emitItemSelected(student) {
  emit('select-item', student);
}

// Modifiez la fonction deleteStudent
async function deleteStudent(studentId) {
  try {
    const response = await api.delete(`/students/${studentId}`);

    // Méthode optimale avec accès direct à l'instance
    if (tabulatorRef.value?.tableInstance) {
      await tabulatorRef.value.tableInstance.setData();
      console.log("Table refreshed after deletion");
    } else {
      componentKey.value = Date.now(); // Fallback
    }

    alert("Étudiant supprimé avec succès");
  } catch (err) {
    if (err.response?.status >= 500) {
      console.error("Server error:", err);
      alert("Erreur serveur lors de la suppression");
    }
    // Les 400/404 sont silencieux (traités comme des cas normaux)
  }
}


// 🔥 Suppression de tous les étudiants
async function deleteAllStudents() {
  if (!confirm('Are you sure you want to delete all students?')) return;
  try {
    await api.delete(`/students`);
    alert('All students deleted successfully');
    componentKey.value = Date.now(); // refresh
  } catch (err) {
    console.error('Error deleting students:', err);
    alert('Failed to delete all students');
  }
}

// 🔄 Réinitialisation du filtre groupe
function resetGroupFilter() {
  emit('reset-group');
  componentKey.value = Date.now(); // reload sans filtre de groupe
  alert('Group filter reset.');
}

// 🧼 Nettoyage des filtres utilisateur
function clearFilter() {
  filterField.value = '';
  filterType.value = '=';
  filterValue.value = '';
}

const selectedGroupId = ref("");
const groupList = ref([]);
const tabulatorRef = ref(null);

// Charger la liste des groupes
const loadGroups = async () => {
  try {
    const res = await api.get(`/groups`);
    groupList.value = res.data.groups;
  } catch (err) {
    console.error("❌ Failed to load groups:", err);
  }
};
loadGroups();

const addSelectedToGroup = async () => {
  if (selectedStudents.value.length === 0) {
    showToast("Aucun étudiant sélectionné", "danger");
    emit("refresh-group-list");
    return;
  }

  const studentIds = Array.isArray(selectedStudents.value)
    ? selectedStudents.value.map(s => s._id)
    : [];
  console.log("✅ Étudiants à ajouter :", studentIds);


  await api.put(`/groups/${selectedGroupId.value}/add-students`, {
    studentIds
  });

  showToast(`${studentIds.length} étudiant(s) ajouté(s) au groupe !`, "success");

  await refreshSelectedStudent();

};

const successToast = ref(null);
const toastMessage = ref("");

let bsToast = null;

onMounted(() => {
  const Toast = window.bootstrap?.Toast;
  if (Toast && successToast.value) {
    bsToast = new Toast(successToast.value, { delay: 4000 });
  }

});

function showToast(message) {
  toastMessage.value = message;
  bsToast?.show();
}

function hideToast() {
  bsToast?.hide();
}

function openStudentModal(student) {
  selectedStudent.value = student;
  showModal.value = true;
}



</script>

<style scoped>
.toast-container {
  pointer-events: none;
}

.toast {
  pointer-events: auto;
}


.StudentListContainer {
  padding: 10px;
  border: 1px gainsboro solid;
  margin-top: 120px;
  background-color: aliceblue;
}

.mr-2 {
  margin-right: 20px;
}
</style>