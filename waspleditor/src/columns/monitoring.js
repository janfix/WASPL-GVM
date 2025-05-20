export default function createMonitoringColumns(resetAccessFn, publicationMode) {
  return [
    { title: "Student ID", field: "studentID", headerFilter: "input" },
    { title: "Last Name", field: "lastName", headerFilter: "input" },
    { title: "First Name", field: "firstName", headerFilter: "input" },
    { title: "Connections", field: "connectionNumber", headerFilter: "number" },
    {
      title: "Status",
      field: "status",
      headerFilter: "select",
      headerFilterParams: { values: ["", "not started", "ongoing", "submitted", "abandoned"] },
      formatter: function (cell) {
        const value = cell.getValue();
        const label = cell.getRow().getData().statusLabel;
        const badgeMap = {
          "not started": "secondary",
          "ongoing": "info",
          "submitted": "success",
          "abandoned": "danger",
        };
        return `<span class="badge bg-${badgeMap[value] || 'light'}" title="${label}">${value}</span>`;
      }
    },
    {
      title: "Reset Access",
      field: "accessStatus",
      hozAlign: "center",
      formatter(cell) {
        const row = cell.getData();
        if (!row.accessStatus && publicationMode === "exam") {
          return `<button class="btn btn-warning btn-sm reset-access-btn" data-id="${row._id}">Reset</button>`;
        }
        return `<span class="text-success">✔</span>`;
      },
      cellClick(e, cell) {
        const row = cell.getData();
        console.log("🧪 Ligne cliquée dans Reset Access :", row);
        if (
          e.target.classList.contains("reset-access-btn") &&
          !row.accessStatus &&
          publicationMode === "exam"
        ) {
          resetAccessFn(row._id); // ✅ appel direct
        }
      }
    }
  ];
}
