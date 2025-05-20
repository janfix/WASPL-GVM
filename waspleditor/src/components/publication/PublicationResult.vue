<template>
  <div>
    <h2>Publication Results (Quick view)</h2>

    <div v-if="hasShortAnswers" class="IATreatment">
      <h5>IA Correction Process</h5>
      <p>
        This process will correct the short answer questions using an AI model.
        It may take some time depending on the number of questions and the length of the answers.</p>

      <button @click="launchAICorrection" :disabled="aiProcessing || !hasShortAnswers" class="btn btn-primary mb-3">
        {{ aiProcessing ? "Correction en cours..." : "Launch AI Correction" }}
      </button>
    </div>
    <hr>
    <button style="margin-left:10px; margin-right: 10px;" @click="handleDownloadJSON" class="btn btn-success mb-3">
      Download results (JSON)
    </button>

    <button @click="handleDownloadCSV" class="btn btn-warning mb-3">
      Download results (CSV)
    </button>

    <table class="table table-bordered" v-if="latestResults.length > 0">
      <thead>
        <tr>
          <th>Student Name</th>
          <th>Student ID</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(response, index) in latestResults" :key="index">
          <!-- Affichage du nom et des tentatives uniquement à la première occurrence -->
          <tr v-if="index === firstOccurrenceIndex(response.userId)">
            <td class="studID">
              {{ studentNames[response.userId?._id || response.userId] || "Étudiant inconnu" }}
              <span class="badge">
                {{ studentAttemptCount[response.userId?._id || response.userId] || 0 }} Attempt(s)
              </span>

            </td>
            <td class="studID">
              {{ response.userId }}
            </td>
          </tr>

          <!-- Affichage des réponses -->
          <tr>
            <td>{{ response.questionLabel }}</td>
            <td>{{ response.selectedLabels.join(", ") || response.rawOpenAnswer || response.gapsAnswers.join(", ") }}
            </td>
            <td>{{ response.score }}</td>
          </tr>
        </template>
      </tbody>
    </table>


    <p v-else class="no-results">Aucun résultat disponible pour cette publication.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "@/services/axios";
import { downloadJSON, downloadCSV } from "@/utils/downloadUtils";

const props = defineProps({
  publication: {
    type: Object,
    required: true,
  },
});

const results = ref([]);
const studentNames = ref({});
const aiProcessing = ref(false);
const sessionData = ref([]);
const studentAttemptCount = ref({});
const testDetails = ref(null);
const hasShortAnswers = ref(false);


const handleDownloadJSON = () => {
  downloadJSON(props.publication, sessionData.value, studentNames.value, studentAttemptCount.value, results.value, latestResults.value);
};

const handleDownloadCSV = () => {
  downloadCSV(props.publication, studentNames.value, studentAttemptCount.value, latestResults.value);
};

// ✅ Fonction pour récupérer les détails du test
const fetchTest = async () => {
  if (!props.publication.testId.value) return;
  try {
    const apiUrl = `/tests/${props.publication.testId.value}`;
    const response = await api.get(apiUrl);
    testDetails.value = response.data;
    hasShortAnswers.value = testDetails.value.questions.some(q => q.type === "shortAnswer");
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du test :", error);
  }
};

// ✅ Fonction pour récupérer les résultats de la publication
const fetchResults = async () => {
  if (!props.publication._id) return;
  try {
    const response = await api.get(`/results/publication/${props.publication._id}`);

    if (!Array.isArray(response.data)) {
      throw new Error("Les résultats ne sont pas un tableau !");
    }
    results.value = response.data;
    await fetchStudentNames();
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des résultats :", error);
  }
};

// ✅ Fonction pour récupérer les noms des étudiants
const fetchStudentNames = async () => {
  try {
    const studentIds = [...new Set(results.value.map(r => {
      return typeof r.studentId === 'object' && r.studentId._id ? r.studentId._id : r.studentId;
    }))];
    if (studentIds.length === 0) return;
    const response = await api.post(`/students/getNames`, { studentIds });
    studentNames.value = response.data;
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des noms des étudiants :", error);
  }
};

// ✅ Fonction pour récupérer les sessions des étudiants
const fetchStudentSessions = async () => {
  if (!props.publication._id) return [];
  try {
    const response = await api.get(`/publications/${props.publication._id}/student-sessions`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching student sessions:", error);
    return [];
  }
};

// ✅ Fonction pour logguer les sessions des étudiants
const fetchAndLogStudentSessions = async () => {
  sessionData.value = await fetchStudentSessions();
  studentAttemptCount.value = sessionData.value.reduce((acc, session) => {
    // Corriger ici : utiliser studentID qui vient de l'API des sessions
    const studentIdStr = session.studentID; // L'API renvoie le studentID directement ici

    if (studentIdStr) { // Assure-toi que l'ID est valide
      acc[studentIdStr] = (acc[studentIdStr] || 0) + 1;
    }
    return acc;
  }, {});
  console.log("Tentatives par étudiant (keys):", Object.keys(studentAttemptCount.value));
  console.log("Tentatives par étudiant (values):", studentAttemptCount.value);
};

// ✅ Calcul des derniers résultats de chaque étudiant
const latestResults = computed(() => {
  const latestAttempts = {}; // Utilisera les ID étudiants comme clés
  results.value.forEach((attempt) => {
    // Extrait l'ID étudiant sous forme de chaîne de manière consistante
    const studentIdStr = typeof attempt.studentId === 'object' && attempt.studentId?._id
      ? attempt.studentId._id
      : attempt.studentId;

    if (studentIdStr) { // Assure-toi que l'ID est valide
      const currentLatestAttempt = latestAttempts[studentIdStr];

      // Compare les dates submittedAt (peut nécessiter des vérifications null/undefined)
      const currentSubmittedAt = currentLatestAttempt ? new Date(currentLatestAttempt.submittedAt) : null;
      const attemptSubmittedAt = attempt.submittedAt ? new Date(attempt.submittedAt) : null;

      // Si pas de dernière tentative pour cet étudiant, OU si cette tentative est plus récente
      if (!currentLatestAttempt || (attemptSubmittedAt && (!currentSubmittedAt || attemptSubmittedAt > currentSubmittedAt))) {
          latestAttempts[studentIdStr] = attempt; // Stocke l'objet attempt complet, clé par ID string
      }
    }
  });

  // Maintenant, itère sur les valeurs (qui sont les objets attempt les plus récents)
  // et mappe chaque réponse en y ajoutant l'ID étudiant
  return Object.values(latestAttempts).flatMap(latestAttempt =>
    latestAttempt.responses.map(response => ({
      // Définit le userId dans le tableau final, en extrayant l'ID string de manière consistante
      userId: typeof latestAttempt.studentId === 'object' && latestAttempt.studentId?._id
            ? latestAttempt.studentId._id
            : latestAttempt.studentId,
      questionLabel: response.questionLabel,
      selectedLabels: response.selectedLabels || [],
      rawOpenAnswer: response.selectedOptions || "", // Note: utilisation de selectedOptions comme dans le code d'origine, pas rawOpenAnswer mentionné dans le commentaire.
      gapsAnswers: response.gapsAnswers || [],
      score: response.score
    }))
  );
});

// ✅ Trouver la première occurrence d'un étudiant dans les résultats
const firstOccurrenceIndex = (userId) => {
  return latestResults.value.findIndex(r => r.userId === userId);
};






// ✅ Surveiller les changements de publication et recharger les résultats
watch(
  () => props.publication,
  async () => {
    console.log("🔄 Mise à jour de PublicationResult avec une nouvelle publication !");
    await fetchResults(); // Récupère les résultats des tests
    await fetchAndLogStudentSessions(); // Récupère les tentatives des étudiants
    await fetchTest(); // Récupère les détails du test
  },
  { deep: true, immediate: true }
);

// ✅ Charger les résultats au montage
onMounted(async () => {
  await fetchResults();
  await fetchAndLogStudentSessions();
  await fetchTest();
});
</script>


<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: left;
}

.no-results {
  font-size: 16px;
  color: #777;
  text-align: center;
  margin-top: 20px;
}

.badge {
  background-color: #007bff;
  color: white;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 10px;
}

.studID {
  background-color: gainsboro !important;
}
</style>
