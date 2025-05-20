export const downloadJSON = (publication, sessionData, studentNames, studentAttemptCount, results, latestResults) => {
    if (!publication || !publication._id) {
      console.error("❌ Erreur : Publication non définie.");
      return;
    }
  
    // Construire l'objet avec toutes les données
    const dataToDownload = {
      publicationId: publication._id,
      students: sessionData.map(student => ({
        studentID: student.studentID,
        name: studentNames[student.studentID] || "Étudiant inconnu",
        attempts: studentAttemptCount[student.studentID] || 0,
      })),
      results: results,
      latestResults: latestResults
    };
  
    // Convertir en JSON
    const jsonData = JSON.stringify(dataToDownload, null, 2);
  
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Créer un élément <a> pour télécharger le fichier
    const a = document.createElement("a");
    a.href = url;
    a.download = `publication_${publication._id}_results.json`; // ✅ Correction
    document.body.appendChild(a);
    a.click();
  
    // Nettoyer l'URL après le téléchargement
    URL.revokeObjectURL(url);
  };
  
  export const downloadCSV = (publication, studentNames, studentAttemptCount, latestResults) => {
    if (!publication || !publication._id) {
      console.error("❌ Erreur : Publication non définie.");
      return;
    }
  
    // Construire les en-têtes du CSV
    const headers = ["Student ID", "Student Name", "Attempts", "Question Label", "Selected Answers", "Score"];
  
    // Construire les lignes des résultats
    const rows = latestResults.map(response => {
      const studentName = studentNames[response.userId] || "Étudiant inconnu";
      const attempts = studentAttemptCount[response.userId] || 0;
      const selectedAnswers = response.selectedLabels.join(", ") || response.rawOpenAnswer || response.gapsAnswers.join(", ");
      
      return [
        response.userId,
        studentName,
        attempts,
        response.questionLabel,
        selectedAnswers,
        response.score
      ];
    });
  
    // Générer le contenu CSV
    let csvContent = "data:text/csv;charset=utf-8," + 
      headers.join(";") + "\n" + // En-têtes
      rows.map(row => row.join(";")).join("\n"); // Lignes
  
    // Encoder en URI
    const encodedUri = encodeURI(csvContent);
  
    // Créer un élément de téléchargement
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `publication_${publication._id}_results.csv`; // ✅ Correction
    document.body.appendChild(link);
    link.click();
  
    // Nettoyage
    document.body.removeChild(link);
  };
  