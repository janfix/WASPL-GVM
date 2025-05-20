import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import authMiddleware from "../middleware/authMiddleware.js";



const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 100 }, // max ~100 KB
});

// 🔧 Fonction utilitaire pour copier un fichier depuis l'interaction "default"
function copyFileFromDefault(sourceFileName, destDir, destFileName = null) {
    const src = path.join(process.cwd(), 'src/components/interactions/default', sourceFileName);
    const finalFileName = destFileName || sourceFileName;
    const dest = path.join(destDir, finalFileName);
  
    if (!fs.existsSync(src)) {
      throw new Error(`Missing source file: ${src}`);
    }
  
    fs.copyFileSync(src, dest);
  }

router.post('/scaffold-interaction', upload.single('image'), (req, res) => {
  try {
    const { interactionName, description, authorName, createdAt } = req.body;

    if (!interactionName || !/^[a-z][a-zA-Z0-9]*$/.test(interactionName)) {
      return res.status(400).json({ error: 'Invalid interaction name' });
    }

    const pascalName = interactionName[0].toUpperCase() + interactionName.slice(1);
    const baseDir = path.join(process.cwd(), `src/components/interactions/${interactionName}`);
    const interactionsFile = path.join(process.cwd(), './interactions.js');
    const imagePath = path.join(process.cwd(), `src/assets/${interactionName}.png`);

    if (fs.existsSync(baseDir)) {
      return res.status(400).json({ error: 'Interaction already exists' });
    }

    fs.mkdirSync(baseDir, { recursive: true });

    // ✅ Copier les fichiers depuis "default"
    copyFileFromDefault('EditorM.vue', baseDir, 'Editor.vue');;//On peut le personnaliser comme on veutcomme starting point
    copyFileFromDefault('PreviewM.vue', baseDir, 'Preview.vue');//On peut le personnaliser comme on veut comme starting point
    copyFileFromDefault('model.json', baseDir);//On peut le personnaliser comme on veut comme starting point

    // ✅ Modifier le model.json cloné pour adapter l'interaction
    const modelPath = path.join(baseDir, 'model.json');
    const raw = fs.readFileSync(modelPath, 'utf-8');
    const parsed = JSON.parse(raw);
    parsed.el_Type = interactionName;
    parsed.description = description;
    parsed.author = authorName;
    parsed.createdAt = createdAt;
    fs.writeFileSync(modelPath, JSON.stringify(parsed, null, 2));

    // ✅ Sauvegarder l'image
    if (req.file) {
      fs.writeFileSync(imagePath, req.file.buffer);
    }

    // ✅ Injection dans interactions.js
    if (!fs.existsSync(interactionsFile)) {
      return res.status(500).json({ error: 'interactions.js not found' });
    }

    let content = fs.readFileSync(interactionsFile, 'utf-8');
    if (content.includes(`${interactionName}:`)) {
      return res.status(400).json({ error: 'Interaction already declared in interactions.js' });
    }

    const newEntry = `  ${interactionName}: {
    model: () => import('./src/components/interactions/${interactionName}/model.json'),
    editor: () => import('./src/components/interactions/${interactionName}/Editor.vue'),
    preview: () => import('./src/components/interactions/${interactionName}/Preview.vue'),
  },\n`;

    content = content.replace(
      'export const interactions = {',
      `export const interactions = {\n${newEntry}`
    );

    fs.writeFileSync(interactionsFile, content);

    return res.json({ success: true });
  } catch (err) {
    console.error('❌ Error in scaffold-interaction:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
