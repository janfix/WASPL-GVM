<template>
  <div class="group-list">
    <h2 class="mb-3">Group List   
      <button @click="refreshTable" type="button" class="btn btn-outline-primary mb-2">
        🔄Refresh
      </button>
    </h2>
    <TabulatorRemote
      table-type="groups"
      :api-url="'/groups'"
      :columns="groupColumns"
      :page-size="10"
      selectionMode="single"
      @select-item="emitSelectedGroup"
      @refresh-request="refreshTable"
      @custom-delete="handleDelete"
      @custom-edit="handleEdit"
      :refresh-flag="props.refreshFlag" 
    />
  </div>
</template>

<script setup>
import { ref } from "vue";
import TabulatorRemote from "@/components/common/TabulatorRemote.vue";
import api from "@/services/axios";
import { groupColumns } from "@/columns/groups.js";

const props = defineProps({
  refreshFlag: Number,
});

const emit = defineEmits(["select-item", "group-edit", "group-deleted", "refresh-request"]);




function emitSelectedGroup(group) {
  console.log("✅ Groupe sélectionné:", group);
  // Dans le mode "single", group sera directement un objet (pas un tableau)
  if (group && group._id) {
    console.log("✅ Groupe sélectionné:", group.groupName || group._id);
    emit("select-item", group._id);
  } else {
    console.warn("❌ Format de groupe inattendu:", group);
  }
}

function refreshTable() {
  emit("refresh-request");
}

async function handleDelete(group) {
  if (!confirm("Confirmer la suppression du groupe ?")) return;
  try {
    await api.delete(`/groups/${group._id}`);
    alert("Groupe supprimé !");
    emit("group-deleted", group._id);
    emit("refresh-request");
    refreshTable();
  } catch (err) {
    console.error("Erreur suppression groupe:", err);
    alert("Erreur lors de la suppression.");
  }
}

function handleEdit(group) {
  emit("group-edit", group);
}
</script>

<style scoped>
.group-list {
  padding: 1rem;
}
</style>