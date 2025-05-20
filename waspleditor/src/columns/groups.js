// /columns/groups.js
export const groupColumns = [
    { title: "ID", field: "_id", width: 10 },
    { title: "Group Name", field: "groupName", headerFilter: "input" },
    { title: "Institution", field: "institution", headerFilter: "input",width: 200  },
    {
      title: "Students",
      field: "students",
      formatter: (cell) => cell.getValue()?.length || 0,
      width: 100,
    },
    { title: "Location", field: "location", headerFilter: "input" },
    { title: "Zipcode", field: "zipCode", headerFilter: "input" },
    { title: "Grade", field: "grade", headerFilter: "input" },
    { title: "Sector", field: "sector", headerFilter: "input" },
    {
      title: "Action",
      field: "action",
      width: 100,
      formatter: (cell) => {
        return `
          <button class="delete-btn" style="background:none;border:none;cursor:pointer;font-size:16px;">❌</button>
          <button class="edit-btn" style="background:none;border:none;cursor:pointer;font-size:16px;">
            ✏️
          </button>
        `;
      },
      cellClick: (e, cell) => {
        const group = cell.getRow().getData();
      
        const tabulatorInstance = cell.getTable();
        const vueComponent = tabulatorInstance._component;
      
        if (!vueComponent) return;
      
        if (e.target.closest(".edit-btn")) {
          vueComponent.$emit("custom-edit", group);
        }
      
        if (e.target.closest(".delete-btn")) {
          vueComponent.$emit("custom-delete", group);
        }
      }
      ,
    },
  ];
  