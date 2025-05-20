<template>
  <div>
    <div id="publication-table"></div>
  </div>
</template>

<script setup>
import getPublicationColumns  from "@/columns/publications.js";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import api from "@/services/axios";
import { useEventBus } from '@vueuse/core'
import { onMounted, onUnmounted } from "vue";

// Ajoutez ce code dans le setup()
const eventBus = useEventBus('publication-updated')

// Écoutez l'événement de rafraîchissement
const unsubscribe = eventBus.on(() => {
  if (table) {
    table.setData()
      .then(() => console.log('Publications table refreshed'))
      .catch(err => console.error('Refresh error:', err))
  }
})

// Nettoyez l'écouteur quand le composant est démonté
onUnmounted(() => {
  unsubscribe()
})

// Définir un événement pour émettre l'ID du groupe sélectionné
const emit = defineEmits(["publication-selected"]);
let table = null;

async function fetchPublications(url, config, params = {}) {
  try {
    const { page, size, sorters, filters } = params;

    const response = await api.get(`/publications`, {
      params: {
        page,
        size,
        sorters: JSON.stringify(sorters),
        filters: JSON.stringify(filters),
      }
    });


    const today = new Date();
    const publications = response.data.data.map(pub => {
      const startingDate = new Date(pub.startingDate);
      const endDate = new Date(pub.endDate);
      let status = "Coming";
      if (today >= startingDate && today <= endDate) status = "Open";
      else if (today > endDate) status = "Close";

      return {
        ...pub,
        status
      };
    });

    return {
      data: publications,
      last_page: response.data.last_page
    };

  } catch (error) {
    console.error("Erreur lors de la récupération des publications :", error);
    return { data: [], last_page: 1 };
  }


}


async function deletePublication(publicationId) {
  if (!confirm("Are you sure you want to delete this publication?")) return;

  try {
    await api.delete(`/publications/${publicationId}`);
    alert("Publication deleted successfully!");
    table.setPage(1);// recharge la 1ère page (ou current page si tu veux)
  } catch (error) {
    console.error("Error deleting publication:", error.response?.data || error.message);
    alert("An error occurred while deleting the publication.");
  }
}


function createTable(data) {
  table = new Tabulator("#publication-table", {
    pagination: true,
    paginationMode: "remote",
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50, 100],
    paginationCounter: "rows",
    ajaxURL: `/publications/`,
    ajaxRequestFunc: fetchPublications,
    ajaxFiltering: true,
    ajaxSorting: true,
    layout: "fitColumns",
    columns: getPublicationColumns(deletePublication), 
  }
  );

  // Ajoutez l'écouteur pour les clics sur une ligne
  table.on("rowClick", (e, row) => {
    const publicationId = row.getData()._id; // Récupérer l'ID du groupe cliqué
    emit("publication-selected", publicationId); // Émet l'événement au composant parent
  });
}

// Appeler fetchPublications lorsque le composant est monté
onMounted(() => {
  createTable(); // C'est cette ligne qui est nécessaire pour lancer Tabulator
});

</script>

<style scoped>
.icon-download {
  cursor: pointer;
  margin: 0 5px;
  color: #007bff;
}

.icon-download:hover {
  color: #0056b3;
}
</style>
