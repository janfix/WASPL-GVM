import { getResultsByTest, getResultsByStudent, getResultById } from '../services/resultService.js';
import { calculateScore } from '../services/scoreService.js';
import Result from "../models/results.js"

/**
 * Endpoint pour récupérer tous les résultats d'un test
 */
export const getTestResults = async (req, res) => {
  try {
    const { testId } = req.params;
    const { page = 1, size = 10 } = req.query;

    const query = { testId, owner: req.user._id };
    const total = await Result.countDocuments(query);
    const results = await Result.find(query)
      .populate('studentId testId publicationId groupId')
      .skip((page - 1) * size)
      .limit(Number(size))
      .lean();

    res.json({
      data: results,
      last_page: Math.ceil(total / size),
      total,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des résultats.' });
  }
};


/**
 * Endpoint pour récupérer tous les résultats d'un étudiant
 */
export const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const results = await getResultsByStudent(studentId);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des résultats.' });
  }
};

/**
 * Endpoint pour récupérer un résultat spécifique
 */
export const getResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const result = await getResultById(resultId);
    if (!result) return res.status(404).json({ error: 'Résultat non trouvé.' });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du résultat.' });
  }
};

/**
 * Endpoint pour calculer le score d'un résultat
 */
export const getScore = async (req, res) => {
    try {
      const { resultId } = req.params;
      const scoreData = await calculateScore(resultId);
      res.json(scoreData);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors du calcul du score.' });
    }
  };


  export const getResultsByPublication = async (req, res) => {
    try {
      const { publicationId } = req.params;
  
      const results = await Result.find({ publicationId, owner: req.user._id })
        .populate('studentId', 'firstname lastname')
        .populate('testId', 'title')
        .populate('groupId', 'groupName')
        .populate('publicationId', 'publicationName')
        .lean();
  
      if (!results.length) {
        return res.status(404).json({ error: "Aucun résultat trouvé pour cette publication." });
      }
  
      res.json(results);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des résultats :", error);
      res.status(500).json({ error: "Erreur serveur lors de la récupération des résultats." });
    } 
  };
  

  export const listResultSummaries = async (req, res) => {
    try {
      const results = await Result.find({ owner: req.user._id })
        .populate('testId', 'title')
        .populate('publicationId', 'publicationName')
        .populate('groupId', 'groupName')
        .populate('studentId', 'lastname') // optionnel
        .lean();
  
      res.json({
        data: results,
        total: results.length,
      });
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des résultats :", error);
      res.status(500).json({ error: "Erreur serveur lors de la récupération des résultats." });
    }
  };
  
  

  export const deleteResult = async (req, res) => {
    try {
      const { resultId } = req.params;
      const deleted = await Result.findOneAndDelete({ _id: resultId, owner: req.user._id });
  
      if (!deleted) {
        return res.status(404).json({ error: "Résultat introuvable." });
      }
  
      res.json({ message: "Résultat supprimé avec succès." });
    } catch (error) {
      console.error("❌ Erreur suppression :", error);
      res.status(500).json({ error: "Erreur serveur lors de la suppression." });
    }
  };

// ✅ Controller côté WasplEditor (ou WasplAPI)
export const listAvailablePublications = async (req, res) => {
  console.log("In the CONTROLLER!");

  if (!req.user || !req.user._id) {
    console.warn("❌ Aucun utilisateur authentifié !");
    return res.status(401).json({ error: "Utilisateur non authentifié." });
  }

  try {
    const publications = await Result.aggregate([
      { $match: { owner: req.user._id } },
      {
        $sort: {
          publicationName: -1
        }
      },
      {
        $group: {
          _id: "$publicationId",
          publicationName: { $first: "$publicationName" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          publicationId: "$_id",
          publicationName: {
            $ifNull: ["$publicationName", "(Nom non renseigné)"]
          },
          count: 1
        }
      }
    ]);

    res.json({ data: publications });
  } catch (err) {
    console.error("❌ Erreur récupération des publications :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};





  