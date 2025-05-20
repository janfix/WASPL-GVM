import express from 'express';
import { getTestResults, 
        getStudentResults, 
        getResult, 
        getScore, 
        getResultsByPublication,
        listResultSummaries,
        deleteResult,
        listAvailablePublications 
    } from '../controllers/resultController.js';
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();
router.use(authMiddleware);

// Vérification des routes enregistrées
//console.log("✅ Chargement des routes résultats...");

router.get('/test/:testId', getTestResults);
router.get('/student/:studentId', getStudentResults);
router.get('/result/:resultId', getResult);  // 🔹 Ajout du préfixe "result/"
router.get('/result/:resultId/score', getScore);  // 🔹 Ajout du préfixe "result/"
router.get("/publication/:publicationId", getResultsByPublication);
router.get("/summaries", listResultSummaries);
router.delete('/:resultId', deleteResult);
router.get("/publication-list", listAvailablePublications);
  


export default router;
