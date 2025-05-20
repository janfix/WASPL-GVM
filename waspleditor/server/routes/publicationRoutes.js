import express from 'express';
import Publication from '../models/publicationModel.js';// Assurez-vous que le chemin est correct
import { getStudentSessionStats } from "../controllers/sessionController.js";
import Session from '../models/sessionModel.js';
import authMiddleware from "../middleware/authMiddleware.js";
import { getPaginatedStudentStats } from "../controllers/sessionController.js";
import dotenv from 'dotenv';
import axios from "axios";
dotenv.config();


const router = express.Router();
router.use(authMiddleware);

// 🔽 Cette route permet à l’admin de déclencher un reset d’accès pour un élève donné
router.post('/:publicationId/student-sessions/:studentId/reset-access', async (req, res) => {
  try {
    const { publicationId, studentId } = req.params;

    // 🔐 Vérification : l'utilisateur est bien le propriétaire de la publication
    const publication = await Publication.findOne({
      _id: publicationId,
      owner: req.user._id
    });

    if (!publication) {
      return res.status(403).json({ error: "Accès refusé à cette publication." });
    }

    // 🔁 Appel distant à waspltestrunner pour réinitialiser l'accès
    const runnerRes = await axios.post(
      `${process.env.TESTRUNNER_API_URL}/api/access/reset`,
      { studentId, publicationId },
      {
        headers: {
          Authorization: `Bearer ${process.env.VITE_SYSTEM_TOKEN_FOR_TESTRUNNER}`
        }
      }
    );

    res.status(200).json({
      message: "Accès réinitialisé avec succès via le testRunner.",
      result: runnerRes.data
    });
  } catch (err) {
    console.error("❌ Erreur lors de l’appel à waspltestrunner :", err.message);

    const status = err.response?.status || 500;
    const data = err.response?.data || { error: "Erreur interne" };

    res.status(status).json(data);
  }
});


router.get("/:publicationId/student-sessions", async (req, res, next) => {
  const pub = await Publication.findOne({ _id: req.params.publicationId, owner: req.user._id });
  if (!pub) return res.status(403).json({ error: "Accès refusé à cette publication." });

  if (req.query.remote) {
    return getPaginatedStudentStats(req, res); // 🔁 pagination distante
  }

  next(); // sinon continue vers getStudentSessionStats normal
}, getStudentSessionStats);

// CREATE : Ajouter une nouvelle publication
router.post('/', async (req, res) => {
  try {
    const publication = new Publication({
      ...req.body,
      owner: req.user._id
    });
    await publication.save();
    res.status(201).json({ message: 'Publication créée avec succès.', publication });
  } catch (err) {
    console.error('Erreur lors de la création de la publication :', err.message);
    res.status(500).json({ error: 'Erreur lors de la création de la publication.' });
  }
});

// READ : Récupérer toutes les publications
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;

    const ownerFilter = { owner: req.user._id };

    const total = await Publication.countDocuments(ownerFilter);
    const publications = await Publication.find(ownerFilter)
      .skip((page - 1) * size)
      .limit(size)
      .populate('testId', 'title')
      .populate('groupId', 'groupName')
      .lean(); // ⚠️ important pour pouvoir modifier les objets ensuite

    // Ajout du comptage des connexions par publication
    const publicationIds = publications.map(pub => pub._id);
    const sessionCounts = await Session.aggregate([
      { $match: { publication: { $in: publicationIds } } },
      { $group: { _id: "$publication", uniqueStudents: { $addToSet: "$student" } } },
      { $project: { _id: 1, studentCount: { $size: "$uniqueStudents" } } }
    ]);

    // map rapide id -> count
    const countsMap = Object.fromEntries(sessionCounts.map(sc => [sc._id.toString(), sc.studentCount]));
    console.log(countsMap)
    // Injecte dans les publications
    for (const pub of publications) {
      pub.connectedStudentsCount = countsMap[pub._id.toString()] || 0;
    }

    res.status(200).json({
      data: publications,
      last_page: Math.ceil(total / size),
      total,
    });
  } catch (err) {
    console.error('Erreur lors de la récupération des publications :', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des publications.' });
  }
});



// READ : Récupérer une publication par son ID
router.get('/:id', async (req, res) => {
  try {
    const publication = await Publication.findOne({ _id: req.params.id, owner: req.user._id })
      .populate('testId', 'title')
      .populate('groupId', 'groupName');
    if (!publication) {
      return res.status(404).json({ message: 'Publication introuvable.' });
    }
    res.status(200).json(publication);
  } catch (err) {
    console.error('Erreur lors de la récupération de la publication :', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération de la publication.' });
  }
});

// UPDATE : Mettre à jour une publication par son ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findOneAndUpdate(
      { _id: id, owner: req.user._id }, // 🔐 sécurise par ownership
      req.body,
      { new: true, runValidators: true }
    );

    if (!publication) {
      return res.status(403).json({ message: 'Accès refusé ou publication introuvable.' });
    }

    res.status(200).json({ message: 'Publication mise à jour avec succès.', publication });
  } catch (err) {
    console.error('Erreur lors de la mise à jour de la publication :', err.message);
    res.status(500).json({ error: 'Erreur lors de la mise à jour de la publication.' });
  }
});


// DELETE : Supprimer une publication par son ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const publication = await Publication.findOneAndDelete({
      _id: id,
      owner: req.user._id // 🔐 sécurité ownership
    });

    if (!publication) {
      return res.status(403).json({ message: 'Accès refusé ou publication introuvable.' });
    }

    res.status(200).json({ message: 'Publication supprimée avec succès.', publication });
  } catch (err) {
    console.error('Erreur lors de la suppression de la publication :', err.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de la publication.' });
  }
});


// LIST : Récupérer uniquement les noms et identifiants des publications
router.get('/list', async (req, res) => {
  try {
    const publications = await Publication.find(
      { owner: req.user._id },
      'publicationName _id'
    ); // Projection pour récupérer uniquement les champs nécessaires
    res.status(200).json(publications);
  } catch (err) {
    console.error('Erreur lors de la récupération de la liste des publications :', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération de la liste des publications.' });
  }
});

// Route pour récupérer les sessions d'une publication
// Route pour récupérer les sessions d'une publication (monitoring)
router.get("/:publicationId/student-sessions",
  async (req, res, next) => {
    try {
      const pub = await Publication.findOne({
        _id: req.params.publicationId,
        owner: req.user._id
      });

      if (!pub) {
        return res.status(403).json({ error: "Accès refusé à cette publication." });
      }

      next(); // passe à getStudentSessionStats
    } catch (err) {
      console.error("Erreur lors de la vérification de la publication :", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  },
  getStudentSessionStats
);



export default router; 