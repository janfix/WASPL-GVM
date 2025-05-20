<template>
  <!-- ✅ Modale Bootstrap native -->
  <div class="modal fade" id="profileModal" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
      <div class="modal-content" v-if="userStore.user">
        <div class="modal-header">
          <h5 class="modal-title" id="profileModalLabel">User Profile Definition</h5>
          <button type="button" class="btn-close" @click="closeModal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p><b>Your profile helps to categorize your content.</b> Don't hesitate to modify your data to
            easely categorize items depending of your activities. For example you are teaching math and physics. For one
            work session, just precise your subject once and it will categorised your new content automatically.</p>

          <form v-if="userStore.user" @submit.prevent="saveProfile">
            <div class="row mb-4">
              <div class="col-md-4 form-floating">
                <input v-model="userStore.user.username" type="text" class="form-control" readonly />
                <label class="fw-bold">Username</label>
              </div>

              <div class="col-md-4 form-floating">
                <input v-model="userStore.user.lastname" type="text" class="form-control" required />
                <label class="fw-bold">Last Name</label>
              </div>
              <div class="col-md-4 form-floating">
                <input v-model="userStore.user.firstname" type="text" class="form-control" required />
                <label class="fw-bold">First Name</label>
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-md-5 form-floating">
                <input v-model="userStore.user.email" type="email" class="form-control" required />
                <label class="fw-bold">Email</label>
              </div>

              <div class="col-md-4 form-floating">
                <input v-model="userStore.user.institution" type="text" class="form-control" />
                <label class="fw-bold">Institution</label>
              </div>

              <div class="col-md-3 form-floating">
                <select v-model="userStore.user.role" class="form-select" required>
                  <option value="Author">Author</option>
                  <option value="Tester">Tester</option>
                  <option value="Admin">Admin</option>
                  <!-- <option value="Statisticien">Statisticien</option>
              <option value="Teacher">Teacher</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Director">Director</option>
              <option value="Manager">Manager</option>
              <optio value="Parent">Parent</optio -->n>
                  <option value="Other">Other</option>
                </select>
                <label class="fw-bold">Role</label>
              </div>
            </div>

            <!-- Langue-->
            <div class="row mb-3">
              <div class="col-md-6">
                <FloatingCreatableSelect v-model="languageValue"
                  :options="['English', 'French', 'Spanish', 'German', 'Italian']" label="Test/question Language" />
              </div>


              <!--  Notifications -->
              <div class="col-md-6 d-flex align-items-center">
                <input v-model="userStore.user.notifications" type="checkbox" class="form-check-input me-2" />
                <label class="form-check-label fw-bold">Enable Notifications</label>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-md-6">
                <FloatingCreatableSelect v-model="subjectValue" :options="userStore.user.subjects || []"
                  label="Subjects" />
              </div>
              <div class="col">
                <FloatingCreatableSelect v-model="domainValue" :options="userStore.user.domains || []"
                  label="Domains" />
              </div>
            </div>
            <!-- Class System Encoding -->
            <div class="row mb-3">
              <div class="col">
                <IscedSelector v-model="userStore.user.ISCED" />
              </div>
            </div>
            <div class="row mb-3">
              <div class="col">
              <FloatingCreatableSelect v-model="gradeValue" :options="userStore.user.grades || []" label="Grades" />
            </div>
            </div>
  


            <!-- Report Options -->
            <div class="row mb-3">
              <div class="col-md-6 form-floating">
                <select v-if="userStore.user.reportOptions" v-model="userStore.user.reportOptions.exportFormat" class="form-select">
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                  <option value="JSON">JSON</option>
                </select>
                <label class="fw-bold">Report - Export Format</label>
              </div>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="closeModal">Close</button>
          <button type="button" class="btn btn-success" @click="saveProfile">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { Modal } from "bootstrap";
import { useUserStore } from "@/stores/userStore";
import api from "@/services/axios";
import { jwtDecode } from "jwt-decode";
import FloatingCreatableSelect from './common/FloatingCreatableSelect.vue'
import IscedSelector from './common/IscedSelector.vue'
const userStore = useUserStore();
const modalInstance = ref(null);

const sanitizeUser = (rawUser) => {
  return {
    ...rawUser,
    reportOptions: rawUser.reportOptions ?? { exportFormat: 'PDF' },
    backdrop: rawUser.backdrop ?? true,
    subjects: rawUser.subjects ?? [],
    domains: rawUser.domains ?? [],
    grades: rawUser.grades ?? [],
    language: rawUser.language ?? 'English',
    AIConnectPrefs: rawUser.AIConnectPrefs ?? { mode: 'auto', level: 'medium' }
  }
}


// 🔹 Fonction pour récupérer les informations de l'utilisateur
const fetchUserData = async () => {
  try {
    // Récupérer le token depuis le localStorage
    const token = localStorage.getItem("editortoken");
    if (!token) throw new Error("Token non trouvé");

    // Décoder le token JWT pour récupérer l'ID utilisateur
    const decodedToken = jwtDecode(token);
    console.log("Decoded token:", decodedToken);
    const userId = decodedToken.id;

    if (!userId) throw new Error("ID utilisateur introuvable dans le token");

    // Construire l'URL API pour récupérer l'utilisateur par son ID
    const apiUrl = `/users/${userId}`;

    console.log("Fetching user data from:", apiUrl); // DEBUG

    // Effectuer la requête API
    const response = await api.get(apiUrl);

    // Mise à jour des données utilisateur dans le store
 userStore.user = sanitizeUser(response.data);
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur:", error);
  }
};

const subjectValue = ref('')
const domainValue = ref('')
const gradeValue = ref('')
const languageValue = ref('')

// Initialisation dès que userStore.user est prêt
watch(() => userStore.user, (user) => {
  if (user) {
    subjectValue.value = user.subjects?.[0] || ''
    domainValue.value = user.domains?.[0] || ''
    gradeValue.value = user.grades?.[0] || ''
    languageValue.value = user.language || ''
  }
}, { immediate: true })

// Synchronisation : dès qu’une valeur change, mise à jour du store
watch(subjectValue, (val) => {
  if (userStore.user) userStore.user.subjects = val ? [val] : []
})
watch(domainValue, (val) => {
  if (userStore.user) userStore.user.domains = val ? [val] : []
})
watch(gradeValue, (val) => {
  if (userStore.user) userStore.user.grades = val ? [val] : []
})
watch(languageValue, (val) => {
  if (userStore.user) userStore.user.language = String(val || '').trim()
})




// 🔹 Fonction d'ouverture de la modale
const openModal = async () => {
  await fetchUserData(); // Récupérer les données utilisateur avant d'afficher la modale
  if (!modalInstance.value) {
    modalInstance.value = new Modal(document.getElementById("profileModal"));
  }
  modalInstance.value.show();
};

// 🔹 Fonction pour fermer la modale
const closeModal = () => {

   document.activeElement?.blur();

  if (modalInstance.value) {
    modalInstance.value.hide();
  }
};

// 🔹 Fonction pour sauvegarder les changements
const saveProfile = async () => {
  //console.log("🟢 Bouton Save cliqué !");
  //console.log("Saving profile changes:", userStore.user);
  try {
    await userStore.updateUser(userStore.user);
    closeModal();
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
  }
};

defineExpose({ openModal });
</script>


<style scoped>
.fw-bold {
  font-weight: 700;
  margin-left: 10px;
}
</style>
