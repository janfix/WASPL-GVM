<template>
  <div class="container">

    <!-- Formulaire pour les informations du groupe -->
    <h3 class="mb-3">Create a New Group</h3>
    <form @submit.prevent="handleSubmit">
      <div class="row mb-3">
        <!-- Nom du groupe -->
        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" id="groupName" v-model="groupName" class="form-control" placeholder="Group Name"
              required />
            <label for="groupName">Group Name</label>
          </div>
        </div>

        <!-- Description du groupe -->
        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" id="groupDescription" v-model="groupDescription" class="form-control"
              placeholder="Group Description" />
            <label for="groupDescription">Group Description (optional)</label>
          </div>
        </div>
      </div>
      <div class="row mb-3">
        <!-- Institution -->
        <div class="col-md-4">
          <div class="form-floating">
            <input type="text" id="groupInstitution" v-model="groupInstitution" class="form-control"
              placeholder="Institution" required />
            <label for="groupInstitution">Institution</label>
          </div>
        </div>

        <!-- Location -->
        <div class="col-md-4">
          <div class="form-floating">
            <input type="text" id="groupLocation" v-model="groupLocation" class="form-control" placeholder="Location" />
            <label for="groupLocation">Group Location</label>
          </div>
        </div>
        <div class="col">
          <div class="form-floating">
            <input type="text" id="groupZipCode" v-model="groupZipCode" class="form-control" placeholder="ZipCode" />
            <label for="groupZipCode">Group ZipCode</label>
          </div>

        </div>


      </div>
      <div class="row mb-3">

        <div class="col">
          <div class="form-floating">
            <input type="text" id="groupGrade" v-model="groupGrade" class="form-control" placeholder="Grade" />
            <label for="groupGrade">Group Grade</label>
          </div>

        </div>
        <div class="col">
          <div class="form-floating">
            <input type="text" id="groupSector" v-model="groupSector" class="form-control" placeholder="Sector" />
            <label for="groupSector">Group Sector</label>
          </div>

        </div>
        <div class="col">
          <div hidden class="form-floating">
            <input type="text" id="groupCreator" v-model="groupCreator" class="form-control" placeholder="Creator" />
            <label for="groupCreator">Group Creator</label>
          </div>

        </div>


      </div>
      <div class="row mb-3">

      </div>

      <!-- Bouton pour soumettre -->
      <div class="d-flex justify-content-end">
        <button type="submit" class="btn btn-primary">
          Create a Group
        </button>
      </div>
    </form>

    <!-- Message de confirmation -->
    <div v-if="message" class="alert mt-4" :class="success ? 'alert-success' : 'alert-danger'">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "@/services/axios";



// États pour les données
const groupName = ref("");
const groupDescription = ref("");
const groupInstitution = ref("");
const groupLocation = ref("");
const groupCreator = ref("64f2b8d5460c243123456789");
const groupZipCode = ref("");
const groupGrade = ref("");
const groupSector = ref("");

const message = ref(""); // Message de confirmation ou d'erreur
const success = ref(false); // Indicateur de succès


const emit = defineEmits(["group-created"]);


// Fonction pour soumettre le formulaire
async function handleSubmit() {
  try {
    const groupData = {
      groupName: groupName.value,
      description: groupDescription.value,
      institution: groupInstitution.value,
      location: groupLocation.value,
      zipCode: groupZipCode.value,
      grade: groupGrade.value,
      sector: groupSector.value,
      creator: groupCreator.value,

    };

  
    // Appeler l'API pour créer le groupe
    const response = await api.post(`/groups/newGroup`, groupData);

    emit("group-created");

    // Réinitialiser les champs et afficher le message de succès
    groupName.value = "";
    groupDescription.value = "";
    groupInstitution.value = "";
    groupLocation.value = "";
    groupZipCode.value = ""
    groupGrade.value = ""
    groupSector.value = ""
    groupCreator.value = "64f2b8d5460c243123456789"
    message.value = "Group created successfully!";
    success.value = true;
  } catch (error) {
    console.error("Failed to create group:", error);
    message.value = "An error occurred while creating the group.";
    success.value = false;
  }
}
</script>

<style scoped>
.container {
  border: 1px solid gainsboro;
  border-radius: 5px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #f6f4e2;
}

.alert {
  padding: 10px;
  margin-top: 20px;
  font-weight: bold;
}
</style>