import mongoose from "mongoose";
import express from 'express';
import User from '../models/User.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Middleware d'authentification

const router = express.Router();


/**
 * 📌 Route protégée pour récupérer le profil de l'utilisateur connecté
 * Requête : GET /api/users/profile
 * Nécessite un token JWT valide
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log("User ID from token:", req.user.id); // Vérification

    // Vérifier que req.user.id existe
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Récupération des infos utilisateur depuis la base MongoDB
    const user = await User.findById(req.user.id).select("-password"); // Ne pas renvoyer le password

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération du profil utilisateur:", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * 📌 Route protégée pour mettre à jour le profil utilisateur
 * Requête : PUT /api/users/profile
 */
router.put('/profile', authMiddleware, async (req, res) => {

  console.log("🔧 Données reçues pour update :", req.body);

  try {
    const { username, email, firstname, lastname, institution, role , language, notifications, reportOptions,subjects, domains, grades, ISCED } = req.body;

    console.log(role)
    // Vérifier que l'utilisateur est bien authentifié
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    // Mise à jour des champs si fournis
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (institution) user.institution = institution;
    if (role) user.role = role;
    if (language) user.language = language;
    if (notifications) user.notifications = notifications;
    if (reportOptions) user.reportOptions = reportOptions;
    if (subjects) user.subjects = Array.isArray(subjects) ? subjects : subjects.split(',').map(s => s.trim());
    if (domains) user.domains = Array.isArray(domains) ? domains : domains.split(',').map(d => d.trim());
    if (grades) user.grades = Array.isArray(grades) ? grades : grades.split(',').map(g => g.trim());
    if (ISCED) user.ISCED = ISCED;
    
   

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/**
 * 📌 Route publique pour récupérer un utilisateur par son _id
 * Requête : GET /api/users/:id
 */
router.get("/:id", authMiddleware, async (req, res) => {
  console.log("🔍 ID reçu dans la requête :", req.params.id);

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    // 🛡️ Contrôle que l'utilisateur accède à son propre profil
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Accès refusé" });
    }

    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/test", (req, res) => {
  console.log("✅ Route /test atteinte !");
  res.send("Test OK");
});
export default router;
