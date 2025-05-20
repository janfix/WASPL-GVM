export const studentColumnsBase = [
  {
    formatter: "rowSelection",
    titleFormatter: "rowSelection",
    hozAlign: "center",
    headerSort: false,
    width: 50,
    cellClick: function (e, cell) {
      cell.getRow().toggleSelect();
    }
  },  
  { title: "ID", field: "_id", width: 150 },
  { title: "Firstname", field: "firstname", headerFilter: "input" },
  { title: "Lastname", field: "lastname", headerFilter: "input" },
 /*  { title: "Group", field: "group", headerFilter: "input" }, */
  { title: "Email", field: "email", headerFilter: "input" },
  { title: "Institution", field: "institution", headerFilter: "input" },
  { title: "Sector", field: "sector", headerFilter: "input" },
  { title: "Grade", field: "grade", headerFilter: "input" },
  { title: "Location", field: "location", headerFilter: "input" },
  { title: "Zip Code", field: "zipcode", headerFilter: "input" },
  {
    title: "Action",
    field: "action",
    headerSort: false,
    formatter: () => "<button class='btn btn-sm btn-info'>Info</button>",
    cellClick: (e, cell) => {
      const student = cell.getRow().getData();
      const component = cell.getTable()._component;
      component?.$emit("edit-student", student);
    }
  }
];
