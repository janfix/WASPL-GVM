<template>

  <header class="p-3 mb-3 border-bottom">
    <div class="container">
      <div class="d-flex flex-wrap align-items-center justify-content-center justify-content-lg-start">
        <a href="/" class="d-flex align-items-center mb-2 mb-lg-0 text-dark text-decoration-none">
          <svg class="bi me-2" width="40" height="32" role="img" aria-label="Bootstrap">
            <use xlink:href="#bootstrap"></use>
          </svg>
        </a>

        <ul class="nav col-12 col-lg-auto me-lg-auto mb-2 justify-content-center mb-md-0">
          <a href="/publications"
            class="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
            <img src="../assets/waspl.png" width="100px" style="margin-left: -100px;" />
            <span  class="topbarTitle"> TEST SUMMARY</span>
          </a>
        </ul>



        <div class="dropdown text-end">

          <div class="dropdown text-end" @click="toggleDropdown" style="position: relative;">
            <div class="d-block link-dark text-decoration-none dropdown-toggle" style="cursor: pointer;">
              <img src="../../src/assets/student.png" alt="mdo" width="42" height="42" class="rounded-circle"><br />
              {{ studentName }}
            </div>

            <ul v-if="dropdownOpen" class="dropdown-menu text-small show"
              style="display: block; position: absolute; right: 0;">
              <li><a class="dropdown-item" href="#" @click="handleLogout">Sign out</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </header>


  <div class="container ">
    <!-- Message de bienvenue -->
    <h2>Welcome, {{ studentName }}!</h2>
    <p class="text-muted">Here are your available tasks:</p>
    <!-- Liste des publications -->
    <ul class="list-group custom-list">
      <li v-for="publication in publications" :key="publication._id"
        class="list-group-item d-flex justify-content-between align-items-center">

        <div class="row">
          <div class="col PubListInfo">
            <div v-if="publication.mode === 'exam'" class="WarnMode warnExam"></div>
            <div v-else-if="publication.mode === 'learning'" class="WarnMode"></div>
            <div v-else-if="publication.mode === 'live'" class="WarnMode"></div>
            <div v-else class="WarnMode warnLearning"></div>

            <span class="badge badge-pill" :class="`badge-${publication.mode}`">
              {{ publication.mode }}
            </span>

            <strong>{{ publication.publicationName }}</strong> |
            Group: <strong>{{ publication.groupId?.groupName || 'Unknown Group' }}</strong> |
            Test: <strong>{{ publication.testId?.title || 'Unknown Test' }}</strong>

            <br />
            <small>📅 Available from: {{ formatDate(publication.startingDate) }}</small>
            -
            <small>Until: {{ formatDate(publication.endDate) }}</small>
            <br />
            <InstructionList :publication="publication" />
          </div>
        </div>

        <!-- Status Icon -->
        <div class="col" style="text-align: right; font-size: 1.8rem;">
          <template v-if="sessionStatuses[publication._id]">
            <span v-if="sessionStatuses[publication._id].accessStatus === false && publication.access === 'unique' && publication.mode==='exam' && !sessionStatuses[publication._id].submitted "
              title="Accès bloqué par le superviseur">⛔</span>

            <span v-else-if="sessionStatuses[publication._id].submitted" title="Test accomplished">✅</span>

            <span v-else-if="sessionStatuses[publication._id].abandoned" title="Test abandoned, or time over passed">
              <template v-if="publication.access === 'multiple'"><img width="30px" src="@/assets/retry.svg" ></template>
              <template v-else>🤔</template>
            </span>
          </template>

        </div>

        <!-- Start Now or More Info -->
        <div class="col-2" style="text-align: right;">

          <!-- Access : {{publication.access}} <br>
          Mode : {{publication.mode}} <br>
          Submitted : {{ sessionStatuses[publication._id]?.submitted }} <br>
          Abandoned :{{ sessionStatuses[publication._id]?.abandoned }} <br>
          Access : {{ sessionStatuses[publication._id]?.accessStatus }} <br>  -->

          <template v-if="
            (publication.access === 'multiple' ||
              (!sessionStatuses[publication._id]?.submitted &&
                !sessionStatuses[publication._id]?.abandoned)) &&
            sessionStatuses[publication._id]?.accessStatus !== false || publication.mode !=='exam'
          ">
          
            <button 
              v-if="sessionStatuses[publication._id]?.abandoned" 
              class="btn btn-warning btn-sm" 
              @click="openPreparationModal(publication)"
              style="width: 80px;"
              >
              Retry
            </button>
            <button 
              v-else-if="sessionStatuses[publication._id]?.submitted && publication.mode==='exam' && publication.access ==='multiple'" 
              class="btn btn-warning btn-sm" 
              @click="openPreparationModal(publication)"
              style="width: 80px;"
              >
              Retry
            </button>
            <button 
              v-else   
            class="btn btn-primary btn-sm" @click="openPreparationModal(publication)">
            Start Now
            </button>  
            
          </template>

          <template v-else>
            <a href="#" @click.prevent="openInfoModal(publication)">
              More info
            </a>
          </template>
        </div>

      </li>
    </ul>


    <!-- Message si aucune publication n'est disponible -->
    <div v-if="publications.length === 0" class="alert alert-info mt-3">
      No publications available at the moment.
    </div>
  </div>

  <div class="container m-4" style="text-align: right;">
    <hr>
    <button hidden class="btn btn-danger" @click="handleLogout">Disconnect</button>
  </div>

<!-- <DebugPanel 
    :publications="publications" 
    @refresh-publications="fetchPublications" 
  /> -->

  <Footer />

  <ModalStartTest v-if="showModal" :publication="selectedPublication" @confirm="confirmStartTest"
    @cancel="closeModal" />


  <InfoModal ref="infoModalRef" />



</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import axios from "axios";
import { useRouter } from "vue-router";
import { jwtDecode } from 'jwt-decode';
import api from "@/api";
import { useResponsesStore } from "../stores/useResponsesStore.js";
import { usePublicationStore } from '@/stores/usePublicationStore';
import Footer from './footer.vue';
import InstructionList from './instructionList.vue';
import ModalStartTest from './ModalStartTest.vue';
import InfoModal from './infoModal.vue'
import DebugPanel from '@/components/DebugPanel.vue'

const publicationStore = usePublicationStore();
const responsesStore = useResponsesStore();
const router = useRouter();
const studentName = ref("Student"); // Nom par défaut si non trouvé
const publications = ref([]);
const AccessControl = (publication) => {
  const now = new Date();
  const startDate = new Date(publication.startingDate);
  const endDate = new Date(publication.endDate);

  // Conditions d'accès
  /*  if (now < startDate) {
     return { disabled: true, message: "Test is not available yet." };
   }
 
   if (now > endDate) {
     return { disabled: true, message: "Test is no longer available." };
   }
 
   if (publication.access === 'unique' && publication.attempts > 0) {
     return { disabled: true, message: "You have already completed this test." };
   }
  */
  return { disabled: false, message: "" }; // Test accessible
};

const infoModalRef = ref(null)

const openInfoModal = (publication) => {
  const session = sessionStatuses.value[publication._id] || {};

  let message = "Information not available for this session.";

  if (session.accessStatus === false) {
    message = "⛔ Votre accès à cette session a été bloqué par le superviseur.";
  } else if (session.abandoned && !session.submitted) {
    if (publication.access === 'multiple') {
      message = "Ce test a été abandonné. Vous pouvez le relancer.";
    } else {
      message = "Vous avez ouvert le test mais ne l'avez pas complété. Veuillez contacter le superviseur.";
    }
  } else if (session.submitted) {
    message = "Vous avez déjà terminé ce test.";
  }

  infoModalRef.value?.show(message);
};


// Fonction pour gérer l'affichage du menu déroulant
const dropdownOpen = ref(false);

const sessionStatuses = ref({});

const checkSessionStatus = async (studentId, publicationId) => {
  try {
    const response = await api.get(`/sessions/check?student=${studentId}&publication=${publicationId}`);
    return response.data.session;
  } catch (error) {
    console.error('Erreur lors de la vérification de la session :', error);
    return null;
  }
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = (e) => {
  if (!e.target.closest('.dropdown')) {
    dropdownOpen.value = false;
  }
};

const showModal = ref(false)
const selectedPublication = ref(null)

const openPreparationModal = (publication) => {
  selectedPublication.value = publication
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  selectedPublication.value = null
}

const confirmStartTest = async () => {
  if (!selectedPublication.value) return;

  try {
    const token = localStorage.getItem("token");
    const decoded = jwtDecode(token);
    const studentId = decoded._id || decoded.sub;
    const publicationId = selectedPublication.value._id;
    const groupId = selectedPublication.value.groupId?._id || selectedPublication.value.groupId;
    const mode = selectedPublication.value.mode;
    const access = selectedPublication.value.access;

    let session;

    // 1. 🔍 Vérifie si la session existe
    const sessionCheck = await api.get(`/sessions/check?student=${studentId}&publication=${publicationId}`);
    session = sessionCheck.data.session;

    // 2. Si pas de session → on la crée
    if (!session) {
      const sessionStart = await api.post("/sessions/start", {
        studentId,
        publicationId,
        groupId
      });
      console.log("🆕 Session créée :", sessionStart.data);
      session = { _id: sessionStart.data.sessionId }; // On reconstruit au minimum
    }

    // 3. ✅ Si EXAM + accès unique → on la marque comme abandonnée
    //if (mode === 'exam' && access === 'unique') {
      await api.patch("/sessions/mark-abandoned", {
        studentId,
        publicationId
      });
    //}

    // 4. Redirection vers le test
    await goToTest(selectedPublication.value);
    closeModal();

  } catch (error) {
    console.error("❌ Erreur confirmStartTest:", error);
    alert("Erreur lors du démarrage du test. Merci de réessayer.");
  }
};










onMounted(() => {
  document.addEventListener('click', closeDropdown);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown);
});


// Fonction pour récupérer les publications
const fetchPublications = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Aucun token trouvé.");
      return;
    }

    const response = await api.get("/publications");
 /*    const response = await axios.get("http://localhost:3011/api/publications", {
      headers: { Authorization: `Bearer ${token}` },
    }); */

    if (Array.isArray(response.data)) {
      publications.value = response.data;

      // Récupérer l'ID de l'étudiant depuis le token
      const decoded = jwtDecode(token);
      const studentId = decoded._id || decoded.sub;

      // Vérifier l'état de chaque session
      for (const publication of publications.value) {
        const session = await checkSessionStatus(studentId, publication._id);
        sessionStatuses.value[publication._id] = session;
      }
    } else {
      console.warn("⚠️ Données inattendues, pas de tableau :", response.data);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des publications :", error);
  }
};


// Fonction pour récupérer le nom de l'étudiant depuis le token
const fetchStudentName = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Décoder le token pour extraire les informations utilisateur
    const decoded = jwtDecode(token);
    studentName.value = `${decoded.firstname} ${decoded.lastname}`;
  } catch (error) {
    console.error("Erreur lors du décodage du token :", error);
    studentName.value = "Student";
  }
};

// Fonction pour gérer la déconnexion
const handleLogout = () => {
  localStorage.removeItem("token");
  router.push("/login");
};

// Vérifie si une publication est ouverte
const isOpen = (publication) => {
  const now = new Date();
  const startDate = new Date(publication.startingDate);
  const endDate = new Date(publication.endDate);
  return now >= startDate && now <= endDate;
};

// Redirige vers le TestRunner pour un test spécifique
const goToTest = async (publication) => {
  responsesStore.resetResponses();

  const testId = publication.testId?._id || publication.testId;
  const publicationId = publication._id;
  const groupId = publication.groupId?._id || publication.groupId;

  if (!testId || !publicationId || !groupId) {
    console.error("❌ Erreur : Informations manquantes", { testId, publicationId, groupId });
    return;
  }

  try {
    const response = await api.patch(`publications/${publicationId}/increment-attempts`);

    if (response.status === 200) {
      // 🔥 Ajout important : RESET publicationStore ici
      publicationStore.resetPublication();

      const route = `/test-runner?testId=${testId}&publicationId=${publicationId}&groupId=${groupId}`;
      router.push(route);
    } else {
      console.error("⚠️ Erreur lors de l'incrémentation de attempts :", response);
    }
  } catch (error) {
    console.error("❌ Erreur API :", error);
  }
};




// Formatte une date au format lisible
const formatDate = (date) => {
  if (!date) return "Invalid Date";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Actions au montage du composant
onMounted(() => {
  fetchStudentName(); // Décoder le token pour récupérer les infos utilisateur
  fetchPublications(); // Récupérer les publications
});
</script>

<style scoped>
.ml-2 {
  margin-left: 10px;
}

.WarnMode {
  text-align: center;
  position: absolute;
  top: 0;
  left: 0;
  background-color: grey;
  color: white;
  padding: 5px;
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  height: 100%;
  width: 5px;
}

.PubListInfo {
  margin-left: 10px;
}

.warnExam {
  background-color: tomato;
  color: white;

}

.warnLearning {
  background-color: rgb(125, 168, 125);
  color: white;

}

.badge-exam {
  color: #fff;
  background-color: #dc3545;
}

.badge-learning {
  color: #fff;
  background-color: #7DA87D;
}

.badge-formative {
  color: #fff;
  background-color: #7DA87D;
}

.badge-custom {
  color: #fff;
  background-color: #89c4ee;
}


.badge {
  margin-right: 10px;
  display: inline-block;
  padding: .25em .4em;
  font-size: 75%;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: .25rem;
}

.custom-list .list-group-item {
  border-radius: 5px;
  margin-top: 5px;
  margin-bottom: 5px;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
}

.custom-list .list-group-item:hover {

  background-color: rgb(244, 244, 244) !important;
}

.instructionList {

  list-style-type: none;
  padding-left: 10px;
  /* Retire aussi l'espace par défaut à gauche */
  margin-left: 0;

}

.status-icon-success {
  color: green;
  font-size: 2rem;
}

.status-icon-abandoned {
  color: darkred;
  font-size: 2rem;
}

.topbarTitle{
  margin-left: 100px;;
  margin-top:-10px;
  font-size: 1.5rem;
  color:#1B87BB;
  font-weight: bold;
}
</style>
