<template>
  <div class="container">
    <h3 class="mb-3">Import Students</h3>

    <form @submit.prevent="handleImport">
      <!-- Choix entre un groupe existant ou un nouveau -->
      <div class="row mb-3">
        <div class="col-md-6">
          <div class="form-floating">
            <select v-model="groupOption" class="form-select">
              <option value="new">Créer un nouveau groupe</option>
              <option value="existing">Ajouter à un groupe existant</option>
            </select>
            <label>Choix du groupe</label>
          </div>
        </div>
      </div>

      <!-- Sélection d'un groupe existant -->
      <div v-if="groupOption === 'existing'" class="row mb-3">
        <div class="col-md-6">
          <div class="form-floating">
            <select v-model="selectedGroup" id="GroupSelect" class="form-select" aria-label="Floating label select group" >
              <option v-for="group in groups" :key="group._id" :value="group._id">
                {{ group.groupName }}
              </option>
            </select>
            <label  for="GroupSelect">Sélectionner un groupe</label>
          </div>
        </div>
      </div>

      <!-- Création d'un nouveau groupe -->
      <div v-if="groupOption === 'new'" class="row mb-3">
        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" id="groupName" v-model="groupName" class="form-control" placeholder="Group Name"
              required />
            <label>Nom du groupe</label>
          </div>
        </div>

        <div class="col-md-6">
          <div class="form-floating">
            <input type="text" id="groupDescription" v-model="groupDescription" class="form-control"
              placeholder="Group Description" />
            <label>Description du groupe (optionnel)</label>
          </div>
        </div>
      </div>

      <!-- Informations du groupe -->
      <div class="row mb-3">
        <div class="col-md-4">
          <div class="form-floating">
            <input type="text" id="groupInstitution" v-model="groupInstitution" class="form-control"
              placeholder="Institution" required />
            <label>Institution</label>
          </div>
        </div>

        <div class="col-md-4">
          <div class="form-floating">
            <input type="text" id="groupLocation" v-model="groupLocation" class="form-control" placeholder="Location" />
            <label>Localisation</label>
          </div>
        </div>

        <div class="col-md-4">
          <div class="form-floating">
            <input type="text" id="groupZipcode" v-model="groupZipcode" class="form-control" placeholder="Zipcode" />
            <label>Code postal</label>
          </div>
        </div>
      </div>

      <div class="row">
        <div class="col">
          <div class="form-floating">
            <input type="text" id="groupGrade" v-model="groupGrade" class="form-control" placeholder="Grade" />
            <label>Niveau</label>
          </div>
        </div>

        <div class="col">
          <div class="form-floating">
            <input type="text" id="groupSector" v-model="groupSector" class="form-control" placeholder="Sector" />
            <label>Spécialité</label>
          </div>
        </div>
      </div>

      <!-- Import du fichier CSV -->
      <div class="mb-3 mt-3">
        <label class="form-label"><b>Import Students (CSV)</b></label>
        <input type="file" id="studentFile" class="form-control" accept=".csv" @change="handleFileUpload" />
      </div>

      <!-- Aperçu des données importées -->
      <div v-if="studentsPreview.length > 0" class="mt-4">
        <h5>Prévisualisation des étudiants importés</h5>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>#</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Institution</th>
              <th>Spécialité</th>
              <th>Niveau</th>
              <th>Localisation</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(student, index) in studentsPreview" :key="index">
              <td>{{ index + 1 }}</td>
              <td>{{ student.firstname }}</td>
              <td>{{ student.lastname }}</td>
              <td>{{ student.email }}</td>
              <td>{{ student.institution }}</td>
              <td>{{ student.sector }}</td>
              <td>{{ student.grade }}</td>
              <td>{{ student.location }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Bouton pour soumettre -->
      <div class="d-flex justify-content-end">
        <button type="submit" class="btn btn-primary" :disabled="studentsPreview.length === 0">
          Importer les étudiants
        </button>
      </div>
    </form>
  </div>
</template>


<script setup>
import Papa from "papaparse";
import { ref, onMounted } from "vue";
import api from "@/services/axios";



// États pour les données
const groupOption = ref("new"); // "new" pour créer un groupe, "existing" pour sélectionner un groupe existant
const groups = ref([]);
const selectedGroup = ref("");
const groupName = ref("");
const groupDescription = ref("");
const groupInstitution = ref("");
const groupLocation = ref("");
const groupZipcode = ref("");
const groupGrade = ref("");
const groupSector = ref("");
const studentsPreview = ref([]);
const file = ref(null);

// Charger la liste des groupes existants
onMounted(async () => {
  try {
    const response = await api.get(`/groups/list`);
groups.value = response.data; // L'API retourne directement la liste des groupes
console.log("Groupes chargés :", groups.value); // Debugging
  } catch (error) {
    console.error("Error fetching groups:", error);
  }
});

// Gestion de l'import du fichier CSV
const handleFileUpload = (event) => {
  file.value = event.target.files[0];
  if (file.value) {
    Papa.parse(file.value, {
      delimiter: ";",
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        studentsPreview.value = results.data.map((row) => ({
          firstname: row.firstname || "",
          lastname: row.lastname || "",
          email: row.email || "",
          institution: row.institution || "",
          sector: row.sector || "",
          class: row.class || "",
          grade: row.grade || "",
          location: row.location || "",
          zipcode: row.zipcode || "",
          mailStatus: row.mailStatus || "",
          password: row.password || "",
        }));
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
      },
    });
  }
};

// Gestion de l'import des étudiants avec vérification des doublons
const handleImport = async () => {
  if (studentsPreview.value.length === 0) {
    alert("Please import students before submitting.");
    return;
  }

  try {
    const studentIds = [];

    for (const student of studentsPreview.value) {
      // Vérification des doublons (email existant)
      const existingStudent = await api.get(`/students/check?email=${student.email}`);
      if (existingStudent.data.exists) {
        console.warn(`Student with email ${student.email} already exists, skipping.`);
        continue; // Ne pas réimporter l'étudiant
      }

      // Création de l'étudiant s'il n'existe pas
      const response = await api.post(`/students`, student);
      studentIds.push(response.data.student._id);
    }

    let groupId = selectedGroup.value;

    // Si l'utilisateur crée un nouveau groupe, on l'ajoute
    if (groupOption.value === "new") {
      const groupResponse = await api.post(`/groups`, {
        groupName: groupName.value,
        description: groupDescription.value,
        institution: groupInstitution.value,
        location: groupLocation.value,
        zipCode: groupZipcode.value,
        grade: groupGrade.value,
        sector: groupSector.value,
        students: studentIds,
      });
      groupId = groupResponse.data.group._id;
    }

     // 🆕 Si l'utilisateur ajoute des étudiants à un groupe existant, on met à jour la liste
     if (groupOption.value === "existing") {
      await api.put(`/groups/${selectedGroup.value}/add-students`, {
        students: studentIds, // Envoi la liste des _id des étudiants
      });
    }

    // Ajout des étudiants au groupe
    for (const studentId of studentIds) {
      await api.post(`/students/${studentId}/add-group`, { groupId });
    }

    alert("Import successful!");

    // Réinitialisation des champs après succès
    groupName.value = "";
    groupDescription.value = "";
    groupInstitution.value = "";
    groupLocation.value = "";
    groupZipcode.value = "";
    groupGrade.value = "";
    groupSector.value = "";
    studentsPreview.value = [];
    file.value = null;
  } catch (error) {
    console.error("Error importing students:", error.response?.data || error.message);
    alert("An error occurred during import.");
  }
};
</script>


<style scoped>
.table {
  margin-top: 1rem;
}

.container {
  border: 1px gainsboro solid;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 20px;
  background-color: rgb(244, 226, 246);
}
</style>