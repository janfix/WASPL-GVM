<template>
  <div id="test-list" class="TableContainer tabulator">
    <h3>Tests list</h3>
    <input 
      v-model="searchQuery" 
      @input="onSearchInput" 
      type="text" 
      placeholder="Global search..."
      class="form-control mb-3" />
    <div id="test-table" ref="test-table"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch,nextTick  } from "vue";
import api from "@/services/axios";
import { useTestStore } from "../stores/testStore";
import { DateTime } from "luxon";
import { TabulatorFull as Tabulator } from 'tabulator-tables';

window.DateTime = DateTime;

const store = useTestStore();

const editorMain = ref(null);

const searchQuery = ref("");

const onSearchInput = () => {
  if (table) {
    console.log("Applying filter with value:", searchQuery.value);
    table.setFilter([
      { field: "global", type: "like", value: searchQuery.value }
    ]);
    table.setPage(1); // revient à la première page
    
  }
};

const tests = ref([]);
let table = null;
let selectedRowId = null;

// Configuration conforme à Tabulator 6.x pour la pagination serveur
const fetchTestsForTabulator = async (url, config, params) => {
   
  const page = params.page || 1;
  const size = params.size || 10;

  // Récupération du filtre - correction ici
  let filterValue = "";
  
  // Dans Tabulator 6.3, les filtres sont accessibles via params.filters
  if (params.filters && Array.isArray(params.filters)) {
    const globalFilter = params.filters.find(f => f.field === "global");
    if (globalFilter) {
      filterValue = globalFilter.value || "";
    }
  }

  // Support pour l'ancien format également (au cas où)
  else if (Array.isArray(params.filter)) {
    const globalFilter = params.filter.find(f => f.field === "global");
    filterValue = globalFilter?.value || "";
  }

  // Récupération du tri
  let sortField = "";
  let sortDir = "";
  if (Array.isArray(params.sorters) && params.sorters.length > 0) {
    sortField = params.sorters[0].field;
    sortDir = params.sorters[0].dir;
  }

  let queryParams = `?page=${page}&size=${size}`;
  if (filterValue) queryParams += `&filter=${encodeURIComponent(filterValue)}`;
  if (sortField && sortDir) queryParams += `&sortField=${sortField}&sortDir=${sortDir}`;

  try {
    const response = await api.get(`/tests/getTests${queryParams}`);
    return {
      data: response.data.tests || [],
      last_page: response.data.totalPages || 1,
      total_pages: response.data.totalPages || 1,
      totalItems: response.data.totalItems || 0,
    };
  } catch (error) {
    console.error("Erreur ajaxRequestFunc :", error);
    return { data: [], last_page: 1, total_pages: 1, totalItems: 0 };
  }
};





// Gestion des actions
const handleAction = (e, cell) => {
  e.stopPropagation(); // Empêche le déclenchement de l'événement rowClick

  const row = cell.getRow();
  const rowData = row.getData();
  if (e.target.classList.contains("preview-btn")) {
    previewTest(rowData);
  } else if (e.target.classList.contains("edit-btn")) {
    emit("edit-test", rowData);
    
  } else if (e.target.classList.contains("delete-btn")) {
    deleteTest(rowData);
  }
};

const emit= defineEmits(["edit-test"]);

// Fonction de prévisualisation
const previewTest = (test) => {
  alert(`Previewing Test: ${test.title}`);
};

// Fonction d'édition modifiée
// Dans TestList.vue, modifiez la fonction editTest

const editTest = async (test) => {
  try {
    selectedRowId = test.ID;

    // Reset et mise à jour du store
    store.resetState();
    store.setTestData(test);

    // Mettre à jour uniquement le statut de surbrillance
    table.getRows().forEach((row) => {
      const rowData = row.getData();
      const isSelected = rowData.ID === test.ID;

      // Mettre à jour seulement si nécessaire pour éviter les effets de bord
      if (isSelected !== rowData.isHighlighted) {
        row.update({ isHighlighted: isSelected });
      }
    });
    
    // Émettre l'événement
    emit("edit-test", test);
    
    // Ajouter un défilement direct ici
    setTimeout(() => {
      const editorElement = document.getElementById("EditorMain");
      if (editorElement) {
        editorElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200); // Délai plus long pour s'assurer que l'élément est rendu
    
  } catch (error) {
    console.error("Erreur lors de l'édition du test :", error);
  }
};

// Fonction de suppression
const deleteTest = async (test) => {
  const testId = test.ID;
  if (confirm(`Are you sure you want to delete Test: ${test.title}?`)) {
    try {
      // Suppression sur le backend
      const response = await api.delete(`/tests/${testId}`);
      table.setData();

      // Suppression locale du store
      store.deleteTestById(testId);

      // Rafraîchir la page actuelle
      if (table) {
        console.log(table);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression :", error);
    }
  }
};

// Méthode pour ajouter un test
const addTest = async (newTest) => {
  try {
    const response = await api.post(`/tests/addTest`, newTest);
    const savedTest = response.data;

    // Rafraîchir la page 1
    if (table) {
      table.setPage(1).then(() => {
        
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
  }
};

// Exposer la méthode pour le composant parent
defineExpose({
  addTest,
});

// Initialisation de Tabulator avec la config pour v6.3.0
const initTable = () => {
  table = new Tabulator("#test-table", {
    pagination: true,
    paginationMode: "remote",
    paginationSize: 10,
    paginationSizeSelector: [10, 20, 50, 100],
    paginationCounter: "rows",
    ajaxURL: `/api/tests/getTests`,
    ajaxRequestFunc: fetchTestsForTabulator,
    ajaxFiltering: true,
    ajaxSorting: true,
    filterMode: "remote", 
    layout: "fitColumns",
    columns: [
      { title: "Title", field: "title", sorter: "string" },
      { title: "Creation Date", field: "metadata.Created", sorter: "date" },
      { title: "Elements", field: "elements.length", sorter: "number" },
      { title: "Last Modified", field: "metadata.LastModif", sorter: "date" },
      { title: "Subject", field: "Subject", sorter: "string" },
      { title: "ISCED", field: "ISCED", sorter: "string" },
      {
        title: "Actions",
        field: "actions",
        hozAlign: "center",
        formatter: () =>
          `<button class="action-btn delete-btn" style="background:none;border:none;cursor:pointer;font-size:18px;padding:2px;">❌</button>`,
        cellClick: handleAction,
        headerSort: false,
        resizable: false,
        width: 80
      },
    ],
    rowFormatter: function (row) {
      const element = row.getElement();
      const data = row.getData();

      if (data.isHighlighted) {
        element.classList.add("row-highlight");
      } else {
        element.classList.remove("row-highlight");
      }
    },
    dataLoaded: function (data) {
      // Réappliquer la surbrillance après chargement des données
      if (selectedRowId) {
        setTimeout(() => {
          const rows = this.getRows();
          for (let row of rows) {
            const rowData = row.getData();
            if (rowData.ID === selectedRowId) {
              row.update({ isHighlighted: true });
              break;
            }
          }
        }, 10);
      }
    }
  });

  // Gestion de l'événement rowClick
  table.on("rowClick", function (e, row) {
    const data = row.getData();
    editTest(data);
  });

  // Écouteurs d'événements supplémentaires pour la pagination
  table.on("pageLoaded", function () {
    // Vérifier si la ligne sélectionnée est sur cette page
    if (selectedRowId) {
      setTimeout(() => {
        const rows = table.getRows();
        for (let row of rows) {
          const rowData = row.getData();
          if (rowData.ID === selectedRowId) {
            row.update({ isHighlighted: true });
            break;
          }
        }
      }, 10);
    }
  });
};

// Watcher pour le store
watch(
  () => store.testData,
  (newTestData) => {
    if (!newTestData || !newTestData.ID) return;

    // Mettre à jour spécifiquement la ligne dans la table si elle est visible
    if (table) {
      const rows = table.getRows();
      for (let row of rows) {
        const rowData = row.getData();
        if (rowData.ID === newTestData.ID) {
          // Ne mettre à jour que ce qui est nécessaire
          const updatedData = {
            ...rowData,
            ...newTestData,
            isHighlighted: true
          };
          row.update(updatedData);
          break;
        }
      }
    }
  },
  { deep: true }
);

// Initialisation au montage
onMounted(() => {
  initTable();

  // Optionnel: ajouter un écouteur pour le débogage
  if (table) {
    table.on("dataFiltering", function(filters) {
    });
  }
});
</script>

<style scoped>
#test-table {
  margin-top: 20px;
}

.TableContainer {
  width: 100%;
  height: auto;
}
</style>

<style>
.tabulator-row-even {
  background-color: transparent !important;
}

.tabulator-row-even:hover {
  background-color: #dee2e6 !important;
}

.row-highlight {
  background-color: #d3d3d3 !important;
  font-weight: bold !important;
}
</style>