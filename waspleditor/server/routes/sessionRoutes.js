import express from 'express';
import Session from '../models/sessionModel.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

// PATCH /api/sessions/:id → reset ou maj accessStatus
router.patch('/:id', async (req, res) => {
  try {
    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          accessStatus: true,
          abandoned: false,
          pending: false,
          reactivated: true,
        }
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Session not found." });
    }

    res.status(200).json({ message: "Session mise à jour.", session: updated });
  } catch (err) {
    console.error("❌ Erreur resetAccess :", err.message);
    res.status(500).json({ error: "Erreur serveur." });
  }
});


export default router;
