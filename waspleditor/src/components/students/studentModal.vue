<template>
  <div class="modal fade show d-block" tabindex="-1" style="background: rgba(0, 0, 0, 0.5)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Student Card</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>

        <div class="modal-body">
          <div class="form-check form-switch mb-3">
            <input class="form-check-input" type="checkbox" v-model="isEditing" id="editToggle">
            <label class="form-check-label" for="editToggle">Edit Mode</label>
          </div>

          <form @submit.prevent="submitEdit" v-if="editableStudent">
            <div v-for="key in editableFields" :key="key" class="form-floating mb-3">
              <input type="text" class="form-control" :id="key" :readonly="!isEditing" v-model="editableStudent[key]"
                :placeholder="formatLabel(key)" />
              <label :for="key">{{ formatLabel(key) }}</label>
            </div>
          </form>

          <div class="mb-3">
            <label class="form-label">Groupes :</label>
            <div class="d-flex flex-wrap gap-2">
              <span class="badge bg-primary me-2"
                v-for="gid in props.student.group.filter(gid => getGroupName(gid) !== 'Unknown')" :key="gid">
                {{ getGroupName(gid) }}
                <span class="ms-2 text-white" style="cursor: pointer;" @click="removeGroup(gid)">✖️</span>
              </span>
            </div>
          </div>


        </div>

        <div class="modal-footer">
          <button class="btn btn-danger me-auto" @click="handleDelete">🗑️ Delete</button>
          <button class="btn btn-primary" @click="submitEdit" :disabled="!isEditing">Save</button>
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, toRefs, watch, onMounted } from 'vue';
import api from "@/services/axios";


const props = defineProps({
  student: Object,
  onDelete: Function,
  onUpdate: Function
})
const emit = defineEmits(['close'])

const isEditing = ref(false)
const editableStudent = ref({});
const editableFields = ['firstname', 'lastname', 'email', 'institution', 'sector', 'grade', 'location', 'zipcode']

const groupList = ref([]); // toutes les infos de groupes

const loadGroupNames = async () => {
  try {
    const res = await api.get(`/groups`);
    groupList.value = res.data;
    console.log("📦 groupList :", groupList.value);
  } catch (err) {
    console.error("Erreur chargement groupes :", err);
  }
};
onMounted(loadGroupNames);

const getGroupName = (groupId) => {
  const groups = groupList.value?.groups || [];
  const found = groups.find(g => g._id === groupId);
  return found ? found.groupName : "Unknown";
};


const removeGroup = async (groupId) => {
  const confirmed = confirm("❗ Retirer cet étudiant de ce groupe ?");
  if (!confirmed) return;

  const payload = {
    studentId: props.student._id,
    groupId,
  };

  console.log("🚀 Données envoyées :", payload);

  try {

    console.log("📤 Envoi de la requête à :", `/groups/remove-student`);
    console.log("📦 Données envoyées :", { studentId: props.student._id, groupId });

    await api.put(`/groups/remove-student`, payload);
    props.student.group = props.student.group.filter(gid => gid !== groupId);
    loadGroupNames();
  } catch (err) {
    console.error("Erreur suppression groupe :", err);
  }
};






watch(() => props.student, (newStudent) => {
  if (newStudent) {
    editableStudent.value = { ...newStudent };
  }
}, { immediate: true });

function formatLabel(key) {
  if (typeof key !== 'string') return '';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function handleDelete() {
  if (confirm("Delete this student ? Attention, this action is irreversible. The student data will be removed from the database.")) {
    props.onDelete(props.student._id)
    emit("close")
  }
}

function submitEdit() {
  if (typeof props.onUpdate === 'function') {
    props.onUpdate(editableStudent.value);
    isEditing.value = false;
  } else {
    console.warn('onUpdate n\'est pas une fonction');
  }
}

</script>

<style scoped>
.form-check-label {
  font-weight: bold;
}
</style>
