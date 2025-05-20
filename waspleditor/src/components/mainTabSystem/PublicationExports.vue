<template>
    <div class="container mt-4">
      <h4>📚 Results available for these publications</h4>
      <table class="table table-sm">
        <thead>
          <tr>
            <th>Publication name</th>
            <th>Students answers</th>
            <th>Raw data Export</th>
            <th>AI Analysis</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pub in publications" :key="pub.publicationId">
            <td>{{ pub.publicationName }}</td>
            <td>{{ pub.count }}</td>
            <td>
              <button class="btn btn-outline-success btn-sm" @click="downloadCSV(pub.publicationId, pub.publicationName)">
                ⬇️ Download
              </button>
            </td>
            <td>
              <button class="btn btn-outline-success btn-sm" @click="AITreatment(pub.publicationId)">
                AI Treatment
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import api from "@/services/axios";
  
  const publications = ref([]);
  
onMounted(async () => {
  try {
    const res = await api.get('/results/publication-list');
    console.log("💡 Résultat API publications :", res.data.data); 
    publications.value = res.data.data;
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des publications :", err);
    error.value = "Impossible de charger les publications. Vérifiez votre connexion ou vos droits.";
  }
});
  
  async function downloadCSV(publicationId, publicationName) {
  try {
    const res = await api.get(`/results/publication/${publicationId}`);
    const results = res.data;

    const csvRows = [];

    for (const result of results) {
      const base = {
        resultId: result._id,
        studentId: result.studentId,
        studentLastname: result.studentLastname,
        studentFirstname: result.studentFirstname,
        testTitle: result.testTitle,
        groupName: result.groupName,
        publicationName: result.publicationName,
        submittedAt: result.submittedAt,
      };

      for (const response of result.responses) {
        const flat = { ...base, ...response };

        if (csvRows.length === 0) {
          csvRows.push(Object.keys(flat).join(","));
        }

        csvRows.push(Object.values(flat).map(v => JSON.stringify(v ?? "")).join(","));
      }
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `responses-${publicationName.replace(/\s+/g, "_")}.csv`;
    link.click();
  } catch (err) {
    console.error("❌ Erreur téléchargement :", err);
    alert("Impossible d'exporter les résultats.");
  }
}


  async function AITreatment(publicationID){
    console.log('Launch AI Treatment')
  }
  </script>
  