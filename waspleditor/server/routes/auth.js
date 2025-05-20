import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, firstname, lastname, institution } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username et mot de passe requis' });
    }

    const existingUser = await User.findOne({ $or: [ { username }, { email } ] });
    if (existingUser) {
      return res.status(409).json({ error: 'Username ou email déjà utilisé' });
    }

    const user = new User({
      username,
      password,
      email,
      firstname,
      lastname,
      institution
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Erreur d’enregistrement :", error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: req.body.username }).select("+password");
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // 📌 Correction : Utiliser `id` au lieu de `userId`
    const token = jwt.sign(
      { id: user._id },  // Modification ici
      process.env.JWT_SECRET,  // 📌 Utilisation d'une variable d'environnement
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
