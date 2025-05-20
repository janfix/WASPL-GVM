import mongoose from 'mongoose';
import express from 'express';
import Session from '../models/session.js';
import { updateSessionAccessStatus } from '../controllers/sessionController.js';

const router = express.Router();



// PATCH /api/sessions/mark-abandoned
router.patch('/mark-abandoned', async (req, res) => {
  const { studentId, publicationId } = req.body;
  console.log("📩 Corps reçu :", req.body);

  if (!studentId || !publicationId) {
    console.warn("❌ Champs manquants !");
    return res.status(400).json({ message: "Champs manquants" });
  }

  try {
    const session = await Session.findOne({
      student: new mongoose.Types.ObjectId(studentId),
      publication: new mongoose.Types.ObjectId(publicationId)
    });

    if (!session) {
      console.warn("❌ Session non trouvée !");
      return res.status(404).json({ message: "Session non trouvée." });
    }

    session.abandoned = true;
    //session.accessStatus = false; // facultatif, selon ta logique
    await session.save();

    console.log("✅ Session mise à jour :", session._id);
    res.status(200).json({ message: "Session marquée comme abandonnée." });
  } catch (err) {
    console.error("❌ Erreur dans /mark-abandoned:", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

router.patch('/:id', updateSessionAccessStatus);

export default router;