import express from 'express';
import Test from '../models/TestModel.js'; 
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();


// Récupérer uniquement les noms et identifiants des tests
router.get('/list', async (req, res) => {
  try {
    const tests = await Test.find({}, 'title _id'); // Récupérer uniquement les champs 'name' et '_id'
    res.status(200).json(tests);
  } catch (err) {
    console.error('Erreur lors de la récupération des tests :', err.message);
    res.status(500).json({ message: 'Erreur lors de la récupération des tests.' });
  }
});

// Récupérer tous les tests



router.get('/getTests', authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const filter = req.query.filter || '';
    const regex = new RegExp(filter, 'i');
    const sortField = req.query.sortField;
    const sortDir = req.query.sortDir === 'desc' ? -1 : 1;

    const query = filter
      ? {
          $or: [
            { title: regex },
            { Subject: regex },
            { level: regex },
            { "metadata.Created": regex },
            { "metadata.LastModif": regex }
          ]
        }
      : {};

    const userId = req.user._id; // ✅ sécurisé par authMiddleware
    const filteredQuery = { ...query, owner: userId };

    let sort = { "metadata.Created": -1 };
    if (sortField) {
      const allowedFields = [
        "title", "Subject", "level",
        "metadata.Created", "metadata.LastModif"
      ];

      if (allowedFields.includes(sortField)) {
        sort = {};
        sort[sortField] = sortDir;
      }
    }

    const tests = await Test.find(filteredQuery)
      .skip(skip)
      .limit(size)
      .sort(sort);

    const totalTests = await Test.countDocuments(filteredQuery);

    res.status(200).json({
      tests: tests || [],
      totalPages: Math.ceil(totalTests / size),
      totalItems: totalTests,
    });
  } catch (err) {
    console.error("❌ Erreur dans getTests :", err.message);
    res.status(500).json({ error: err.message });
  }
});


router.use(authMiddleware);
router.use((req, res, next) => {
  console.log('🧩 Middleware global → req.user :', req.user?._id);
  next();
});

// Ajouter un nouveau test
router.post('/addTest', async (req, res) => {
  if (!req.user || !req.user._id) {
    console.log('❌ req.user ou req.user._id est manquant');
    return res.status(400).json({ error: 'Utilisateur non authentifié ou ID manquant' });
  }
  try {
    const newTest = new Test({
      ...req.body,
      owner: req.user._id, // ← injecté par le middleware
    });

    await newTest.save();
    res.status(201).json(newTest);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du test :', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/save', async (req, res) => {
  try {
    const { ID, _id, ...rest } = req.body;

    // Supprimer _id si vide ou invalide
    const cleanedBody = {
      ...rest,
      ID,
      ...(!!_id && _id.trim() !== '' ? { _id } : {}) // ne garde _id que s’il est valide
    };

    const existingTest = await Test.findOne({ ID });

    if (existingTest) {
      await Test.updateOne({ ID }, cleanedBody);
      res.status(200).json({ message: 'Test mis à jour avec succès.' });
    } else {
      const newTest = new Test(cleanedBody);
      await newTest.save();
      res.status(201).json({ message: 'Test sauvegardé avec succès.' });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde :', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde des données.' });
  }
});



// Supprimer un test par ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Suppression basée sur le champ `ID` (et non `_id`)
    const deletedTest = await Test.findOneAndDelete({ ID: id });

    if (!deletedTest) {
      return res.status(404).json({ message: 'Test introuvable.' });
    }

    res.status(200).json({ message: 'Test supprimé avec succès.' });
  } catch (err) {
    console.error('Erreur lors de la suppression :', err);
    res.status(500).json({ error: 'Erreur lors de la suppression du test.' });
  }
});

// 🔥 Récupérer toutes les questions de type "ShortAnswer" pour un test donné
router.get("/:testId/short-answer-questions", async (req, res) => {
  try {
    const { testId } = req.params;
    
    // Récupère uniquement les éléments du test où `el_Type` est "shortAnswer"
    const test = await Test.findOne({ _id: testId }, "elements");

    if (!test) {
      return res.status(404).json({ message: "Test non trouvé." });
    }

    // Filtre uniquement les éléments ayant `el_Type = "shortAnswer"`
    const shortAnswerQuestions = test.elements
      .filter(el => el.el_Type === "shortAnswer")
      .map(el => ({
        id: el._id,
        text: el.el_Text,
      }));

    if (shortAnswerQuestions.length === 0) {
      return res.status(404).json({ message: "Aucune question ShortAnswer trouvée." });
    }

    res.json(shortAnswerQuestions);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des questions :", error);
    res.status(500).json({ message: "Erreur lors de la récupération des questions." });
  }
});


// 🔥 Lancer la correction AI pour une question donnée
router.post("/:testId/correct-ai", async (req, res) => {
  
  try {
    const { questionId } = req.body;
    console.log(`⚡ AI en train de traiter la correction pour la question ID: ${questionId}`);

    // Simule une correction AI avec un délai de 2 secondes (à remplacer par ton service AI réel)
    setTimeout(() => {
      res.json({ message: `✅ Correction AI terminée pour la question ${questionId}` });
    }, 2000);
  } catch (error) {
    console.error("❌ Erreur lors de la correction AI :", error);
    res.status(500).json({ message: "Erreur lors du traitement de la correction AI." });
  }
});



// Exporter le routeur
export default router;
