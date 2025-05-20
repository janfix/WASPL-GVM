export const testColumns = [
    { title: "Titre", field: "title", headerFilter: "input", sorter: "string" },
    { title: "Sujet", field: "subject", headerFilter: "input" },
    { title: "Niveau", field: "ISCED", headerFilter: true },
    { title: "Créé le", field: "createdAt", sorter: "date" },
    { title: "Modifié le", field: "updatedAt", sorter: "date" },
    {
      title: "Actions",
      field: "actions",
      hozAlign: "center",
      formatter: () => `<button class="btn btn-sm btn-outline-primary">Éditer</button>`,
      cellClick: (e, cell) => {
        const rowData = cell.getRow().getData();
        alert(`Édition du test : ${rowData.title}`);
      },
    },
  ];
  