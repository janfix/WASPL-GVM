export const itemColumns = (deleteItemFn) => [
  { title: "ID", field: "_id", width: 70 },
  { title: "Label", field: "el_Label", headerFilter: "input", width: 200 },
  { title: "Type", field: "el_Type", headerFilter: "input", width: 150 },
  { title: "Texte", field: "el_Text", headerFilter: "input", width: 300 },
  { title: "ISCED", field: "metadata.ISCED", headerFilter: "input", width: 150 },
  { title: "Sujet", field: "metadata.subject", headerFilter: "input", width: 150 },
  { title: "Domaine", field: "metadata.domain", headerFilter: "input", width: 150 },
  {
    title: "Mots-clés",
    field: "metadata.keywords",
    formatter: (cell) => (Array.isArray(cell.getValue()) ? cell.getValue().join(", ") : ""),
    headerFilter: "input",
    width: 200,
  },
  {
    title: "Action",
    field: "action",
    width: 80,
    formatter: (cell) => {
      const el_id = cell.getRow().getData()._id;
      return `<button class="delete-btn" data-id="${el_id}" style="background:none;border:none;cursor:pointer;font-size:18px;padding:2px;">❌</button>`;
    },
    cellClick: (e, cell) => {
      const el_id = cell.getRow().getData()._id;
      if (confirm("Supprimer cet item ?")) {
        deleteItemFn(el_id); // ← appel direct à la fonction du parent
      }
    },
  },
];