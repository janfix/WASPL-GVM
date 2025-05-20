// src/columns/publications.js

/**
 * Fabrique un tableau de colonnes pour Tabulator avec injection de callbacks
 * @param {Function} deleteHandler - Fonction à appeler sur clic "🗑️ Delete"
 * @returns {Array} - Colonnes Tabulator
 */
const getPublicationColumns = (deleteHandler) => [
    { title: "Publication Name", field: "publicationName", widthGrow: 2, headerFilter: "input" },
    { title: "Status", field: "status", widthGrow: 1, headerFilter: "input" },
    { title: "Group", field: "groupId.groupName", widthGrow: 1, headerFilter: "input" },
    { title: "Test", field: "testId.title", widthGrow: 1, headerFilter: "input" },
    { title: "Mode", field: "mode", widthGrow: 1, headerFilter: "input" },
    { title: "startingDate", field: "startingDate", headerFilter: "input" },
    { title: "endDate", field: "endDate", headerFilter: "input" },
    {
      title: "Reports",
      field: "reports",
      headerSort: false,
      widthGrow: 1,
      formatter: (cell) => {
        const reports = cell.getValue();
        if (!reports) return "";
        return `
          ${reports.studentReport ? '<i class="icon-download" title="Student Report">Stud</i>' : ""}
          ${reports.groupReport ? '<i class="icon-download" title="Group Report">Group</i>' : ""}
          ${reports.statisticReport ? '<i class="icon-download" title="Statistic Report">Stat</i>' : ""}
        `;
      },
    },
    {
      title: "Actions",
      headerSort: false,
      width: 120,
      formatter: (cell) => {
        const button = document.createElement("button");
        button.innerText = "🗑️ Delete";
        button.classList.add("btn", "btn-danger", "btn-sm");
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          const rowData = cell.getRow().getData();
          deleteHandler(rowData._id);
        });
        return button;
      },
    }
  ];
  
  // 👇 C'est ce qu’il manquait !
  export default getPublicationColumns;
  