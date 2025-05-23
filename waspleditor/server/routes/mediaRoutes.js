// routes/mediaRoutes.js
import express from 'express';
import multer from 'multer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const mediaRoot = path.resolve(__dirname, '../../../media');

// ✅ Route pour servir les images existantes
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(mediaRoot, filename);
  
  // Vérification de sécurité pour éviter les path traversal
  if (!filePath.startsWith(mediaRoot)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }
  
  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).json({ error: 'Image non trouvée' });
    }
  });
});

// Votre route upload existante
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, mediaRoot);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
  res.json({ url: `/api/media/${req.file.filename}` });
});

export default router;