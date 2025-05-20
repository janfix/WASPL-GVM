// routes/mediaRoutes.js
import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// ✅ Détermination robuste du chemin racine du projet (2 niveaux au-dessus de waspleditor)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mediaRoot = path.resolve(__dirname, '../../../media'); // 🔥 adapte si ta structure change

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaRoot);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // tu peux rajouter Date.now() pour éviter les collisions
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });

  // ✅ URL publique pour accéder à l’image via Express.static (défini dans index.js)
  res.json({ url: `/media/${req.file.filename}` });
});

export default router;
