export default function getResultColumns(onReload = () => {}) {

    return [
      { title: "Résultat ID", field: "_id", headerFilter: "input" },
      { title: "Test", field: "testId.title", headerFilter: "input" },
      { title: "Publication", field: "publicationId.publicationName", headerFilter: "input" },
      { title: "Groupe", field: "groupId.groupName", headerFilter: "input" },
      { title: "Soumis le", field: "submittedAt", formatter: "datetime", headerFilter: "input" },
      {
        title: "Actions",
        field: "actions",
        hozAlign: "center",
        headerSort: false,
        formatter: () => `
          <button class="btn btn-sm btn-danger delete-btn">🗑️</button>
          <button class="btn btn-sm btn-success download-btn">⬇️</button>
        `,
        cellClick: async (e, cell) => {
          const rowData = cell.getRow().getData();
          const resultId = rowData._id;
  
          if (e.target.classList.contains("delete-btn")) {
            if (confirm("Confirmer la suppression ?")) {
              try {
                await fetch(`http://localhost:4000/api/results/${resultId}`, {
                  method: "DELETE",
                });
  
                onReload(); // ✅ ici on appelle le callback passé
              } catch (err) {
                alert("Erreur lors de la suppression.");
                console.error(err);
              }
            }
          }
  
          if (e.target.classList.contains("download-btn")) {
            try {
              const res = await fetch(`http://localhost:4000/api/results/result/${resultId}`);
              const result = await res.json();
          
              const responses = result.responses || [];
          
              if (responses.length === 0) {
                alert("Aucune réponse à exporter.");
                return;
              }
          
              // Création du CSV
              const headers = Object.keys(responses[0]);
              const csvRows = [headers.join(",")];
          
              for (const response of responses) {
                const row = headers.map(h => JSON.stringify(response[h] ?? "")).join(",");
                csvRows.push(row);
              }
          
              const csvContent = csvRows.join("\n");
              const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          
              // Construction du nom de fichier
              const name = result.studentId?.fullName?.replace(/\s+/g, '_') || 'anonymous';
              const date = new Date(result.submittedAt).toISOString().split('T')[0];
              const filename = `responses-${name}-${date}.csv`;
          
              const link = document.createElement("a");
              link.href = URL.createObjectURL(blob);
              link.download = filename;
              link.click();
            } catch (err) {
              alert("Erreur lors du téléchargement.");
              console.error(err);
            }
          }
          
          
        },
      },
    ];
  }
  