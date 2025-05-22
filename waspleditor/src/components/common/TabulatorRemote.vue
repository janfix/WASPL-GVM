<template>
  <div class="TableContainer">
    <div ref="tableRef" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineExpose, getCurrentInstance } from "vue";
import { TabulatorFull as Tabulator } from "tabulator-tables";
import api from "@/services/axios";
import { columnPresets } from "@/columns";

const instance = getCurrentInstance();
const emit = defineEmits(["select-item", "select-items"]);

const props = defineProps({
  apiUrl: { type: String, default: null },
  data: { type: Array, default: null },
  tableType: { type: String, required: true },
  columns: { type: Array, required: true },
  pageSize: { type: Number, default: 10 },
  refreshFlag: { type: Number, default: 0 },
  filters: { type: Array, default: () => [] },
  // Nouvelle prop pour contrôler le mode de sélection
  selectionMode: { 
    type: String, 
    default: "single", 
    validator: (value) => ["single", "multi", "none"].includes(value)
  }
});

const tableRef = ref(null);
const table = ref(null);

// 📦 fetchData : remote data loading
const fetchData = async (url, config, params) => {
  const page = params.page || 1;
  const size = params.size || props.pageSize;

  const headerFilters = table.value?.getHeaderFilters() || [];

  const searchParams = new URLSearchParams();
  searchParams.append("page", page);
  searchParams.append("size", size);

  if (props.filters?.length) {
    searchParams.append("filters", JSON.stringify(props.filters));
  }

  if (headerFilters.length) {
    searchParams.append("headerFilters", JSON.stringify(headerFilters));
  }

  if (Array.isArray(params.sorters) && params.sorters.length > 0) {
    searchParams.append("sortField", params.sorters[0].field);
    searchParams.append("sortDir", params.sorters[0].dir);
  }

  const fullUrl = `${props.apiUrl}?${searchParams.toString()}`;

  try {
    const response = await api.get(fullUrl);
    const data = response.data;

    const listKey = {
      items: "items",
      groups: "groups",
      students: "students",
      tests: "tests",
      publications: "publications",
      results: "data",
    }[props.tableType] || "data";

    return {
      data: data[listKey] || [],
      last_page: data.last_page || data.totalPages || 1,
      totalItems: data.totalItems || data.total || 0,
    };
  } catch (err) {
    console.error("❌ Erreur fetchData :", err);
    return {
      data: [],
      last_page: 1,
      totalItems: 0,
    };
  }
};

onMounted(() => {
  if (!Array.isArray(props.columns)) {
    console.error("❌ Les colonnes ne sont pas un tableau :", props.columns);
    return;
  }

  const tabulatorOptions = {
    layout: "fitColumns",
    headerFilter: true,
    columns: props.columns,
    paginationSize: props.pageSize,
    paginationSizeSelector: [10, 20, 50],
    index: "_id",
  };

  // 🧠 Mode local (data fournie en prop)
  if (props.data) {
    tabulatorOptions.data = props.data;
    tabulatorOptions.pagination = true;
    tabulatorOptions.paginationMode = "local";
  }

  // 🌐 Mode distant (apiUrl fourni)
  else if (props.apiUrl) {
    tabulatorOptions.ajaxURL = props.apiUrl;
    tabulatorOptions.ajaxRequestFunc = fetchData;
    tabulatorOptions.pagination = true;
    tabulatorOptions.paginationMode = "remote";
    tabulatorOptions.ajaxConfig = "GET";
    tabulatorOptions.ajaxFiltering = true;
    tabulatorOptions.ajaxSorting = true;
    tabulatorOptions.filterMode = "remote";
    tabulatorOptions.sortMode = "remote";
  }

  // 🎯 Gestion de la sélection selon le mode
  if (props.selectionMode === "multi") {
    Object.assign(tabulatorOptions, {
      selectable: true,
      selectableRangeMode: "click",
      selectableRollingSelection: true,
      selectableRows: true,
    });
  } else if (props.selectionMode === "single") {
    Object.assign(tabulatorOptions, {
      selectable: 1,
      selectableRollingSelection: false,
    });
  } else {
    tabulatorOptions.selectable = false;
  }

  // 🧱 Initialisation Tabulator
  table.value = new Tabulator(tableRef.value, tabulatorOptions);
  table.value._component = instance?.proxy;

  if (!props.data) {
    table.value.on("tableBuilt", () => {
      table.value.setData();
    });
  }

  table.value.on("dataLoaded", () => {
    console.log("✅ Données chargées, table prête.");
  });

  // 📦 Événements de sélection
  if (props.selectionMode === "single") {
  // Uniquement le clic déclenche la sélection
  table.value.on("rowClick", function (e, row) {
    const rowData = row.getData();
    emit("select-item", rowData);
  });
}

if (props.selectionMode === "multi") {
  table.value.on("rowSelectionChanged", function (data, rows) {
    const selectedData = rows.map((row) => row.getData());
    emit("select-items", selectedData);
  });
}


});


defineExpose({
  tableInstance: () => table.value,
  reloadData: () => {
    table.value?.setData()
      .then(() => console.log("✅ Data reloaded"))
      .catch(err => console.error("❌ Reload error:", err));
  },
  getTable: () => table.value,
  // Méthodes utiles pour la sélection
  getSelectedRows: () => table.value?.getSelectedRows(),
  selectRow: (rowId) => table.value?.selectRow(rowId),
  deselectRow: () => table.value?.deselectRow(),
  toggleSelectRow: (rowId) => table.value?.toggleSelectRow(rowId)
});

watch(() => props.refreshFlag, () => {
  table.value?.setData();
});

watch(() => props.filters, () => {
  table.value?.setData();
}, { deep: true });

watch(() => props.data, (newData) => {
  if (props.data && table.value) {
    table.value.replaceData(newData);
  }
});
</script>

<style scoped>
.TableContainer {
  width: 100%;
}
</style>