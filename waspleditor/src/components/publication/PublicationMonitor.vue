<script setup>
import { computed, ref, onMounted } from 'vue';
import api from '@/services/axios';
import TabulatorRemote from '@/components/common/TabulatorRemote.vue';
import createMonitoringColumns from "@/columns/monitoring.js";
import PieChart from '@/components/charts/PieChart.vue';

const props = defineProps({
  publication: { type: Object, required: true }
});

const columns = computed(() =>
  createMonitoringColumns(resetAccess, props.publication.mode)
);

const groupName = ref(null);
const groupSize = ref(null);
const connectedCount = ref(null);
const submittedCount = ref(0);
const abandonedCount = ref(0);
const sessionList = ref([]);
const tableRef = ref(null);
const daysLeft = computed(() => {
  if (!props.publication.endDate) return "N/A";
  const today = new Date();
  const endDate = new Date(props.publication.endDate);
  const diffTime = endDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});
const resetMessage = ref(null);
const connected = computed(() => connectedCount.value ?? 0);
const submitted = computed(() => submittedCount.value ?? 0);
const abandoned = computed(() => abandonedCount.value ?? 0);
const total = computed(() => groupSize.value ?? 1);

const fetchUrl = `/publications/${props.publication._id}/student-sessions?remote=true`;

function formatDate(dateString) {
  return dateString ? dateString.split("T")[0] : "N/A";
}

// Fonction utilitaire pour vérifier les valeurs booléennes qui peuvent être stockées de différentes façons
function isTruthy(value) {
  return value === true || value === 1 || value === "true";
}

async function resetAccess(sessionId) {
  try {
    await api.patch(`/sessions/${sessionId}`);
    // recharge les données dans Tabulator
    tableRef.value?.reloadData();
    resetMessage.value = { type: "success", text: "Accès réinitialisé avec succès." };
    setTimeout(() => resetMessage.value = null, 3000);

  } catch (err) {
    resetMessage.value = { type: "danger", text: "Erreur lors de la réinitialisation de l'accès." };
    setTimeout(() => resetMessage.value = null, 4000);
    console.error("❌ Erreur resetAccess :", err);
  }
}

defineExpose({
  resetAccess
});


onMounted(async () => {
  const groupId = props.publication.groupId?._id || props.publication.groupId;
  if (!groupId) return;

  try {
    // 🔹 Récupérer le nom du groupe
    const groupInfoRes = await api.get(`/groups/${groupId}`);
    groupName.value = groupInfoRes.data.groupName;

    // 🔹 Récupérer les étudiants du groupe
    const groupRes = await api.get(`/groups/${groupId}/students`);
    groupSize.value = groupRes.data.length;

    // 🔹 Récupérer les sessions de la publication
    const sessionRes = await api.get(`/publications/${props.publication._id}/student-sessions`);
    const sessions = sessionRes.data;
    console.log(sessions)

    const mode = props.publication.mode;

    const enrichedSessions = sessions.map(session => ({
      ...session,
      publicationMode: mode,
    }));

    // Ajoute cette ligne :
    sessionList.value = enrichedSessions;

    console.log("🧪 Sessions reçues :", sessions);

    const studentStatus = new Map(); // Map studentId -> { submitted, abandoned, connected }

    sessions.forEach(session => {
      const studentId = session.studentID;
      if (!studentId) return;

      const existing = studentStatus.get(studentId) || {
        connected: false,
        submitted: false,
        abandoned: false,

      };

      // Vérification plus robuste des valeurs booléennes
      const isSubmitted = isTruthy(session.submitted) || isTruthy(session.accomplished);
      const isAbandoned = isTruthy(session.abandoned);

      studentStatus.set(studentId, {
        connected: true,
        submitted: existing.submitted || isSubmitted,
        abandoned: existing.abandoned || isAbandoned
      });
    });

    // 🔹 Calculs finaux
    connectedCount.value = studentStatus.size;
    submittedCount.value = [...studentStatus.values()].filter(s => s.submitted).length;
    abandonedCount.value = [...studentStatus.values()].filter(s => s.abandoned).length;

    console.log("📊 Stats : ", {
      total: groupSize.value,
      connected: connectedCount.value,
      submitted: submittedCount.value,
      abandoned: abandonedCount.value
    });

  } catch (error) {
    console.error("❌ Erreur lors de la récupération des données :", error);
    groupSize.value = connectedCount.value = submittedCount.value = abandonedCount.value = "Erreur";
  }
});
</script>

<template>
  <div>
    <h2>Publication Monitor : {{ publication.publicationName }}</h2>

    <div class="row">
      <div class="col">
        <i>Publication ID: {{ publication._id }}</i>
      </div>
      <div class="col">
        👥 Group : <b>{{ groupName ?? '...' }}</b>
      </div>
      <div class="row">
        <div class="col">
          <div v-if="groupSize !== null" class="charts">
            <div>
              <PieChart :connected="connected" :total="total" title="Connected Students" />
            </div>
            <div>
              <PieChart :connected="submitted" :total="total" title="Submited answers" />
            </div>
            <div>
              <PieChart :connected="abandoned" :total="total" title="Abandon" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row timeInfo MonitorPubMode">
      <div class="col-2">
        Mode : {{ publication.mode }}
      </div>
      <div class="col">Starting from: {{ formatDate(publication.startingDate) }}</div>
      <div class="col">End date: {{ formatDate(publication.endDate) }}</div>
      <div class="col">Days left: {{ daysLeft }}</div>
    </div>

    <hr />

    <h3>Student Session Statistics</h3>
    <div v-if="submittedCount > 0 || abandonedCount > 0" class="summary mb-3">
      <div class="alert alert-info">
        Total Sessions: <b>{{ connectedCount }}</b> |
        Submitted: <b>{{ submittedCount }}</b> |
        Abandoned: <b>{{ abandonedCount }}</b>
      </div>
    </div>
    <div v-if="resetMessage" class="alert" :class="`alert-${resetMessage.type}`">
      {{ resetMessage.text }}
    </div>
    <TabulatorRemote
  ref="tableRef"
  :data="sessionList"
  :columns="columns"
  :pagination="true"
  tableType="monitoring"
/>
  </div>
</template>

<style scoped>
.MonitorPubMode {
  text-align: center;
  border: 1px grey solid;
  background-color: rgb(239, 250, 247);
  border-radius: 5px;
}

.charts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.charts>div {
  width: 250px;
}
</style>