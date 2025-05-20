// server/routes/addInteraction.js
import fs from 'fs';
import path from 'path';
import express from 'express';
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.post('/add-interaction', (req, res) => {
  const { interactionName } = req.body;
  if (!interactionName || !/^[a-z][a-zA-Z0-9]*$/.test(interactionName)) {
    return res.status(400).json({ error: 'Invalid name' });
  }

  const pascal = interactionName[0].toUpperCase() + interactionName.slice(1);
  const factoryPath = path.resolve('src/components/interactions/interactionFactory.js');
  const fileContent = fs.readFileSync(factoryPath, 'utf-8');

  // Vérifie si déjà présent
  if (fileContent.includes(`case "${interactionName}"`)) {
    return res.status(400).json({ error: 'Already exists in factory' });
  }

  // Injecter l'import en haut
  const newImport = `import { ${pascal}Interaction } from "./${pascal}Interaction";\n`;
  const updated = fileContent.replace(
    /\/\/ Importez d'autres interactions ici/,
    `${newImport}// Importez d'autres interactions ici`
  );

  // Injecter le nouveau case
  const newCase = `    case "${interactionName}":\n      return new ${pascal}Interaction(question, testData);\n`;
  const updatedWithCase = updated.replace(
    /\/\/ Ajoutez d'autres cas pour les autres types d'interactions/,
    `${newCase}    // Ajoutez d'autres cas pour les autres types d'interactions`
  );

  fs.writeFileSync(factoryPath, updatedWithCase, 'utf-8');

  return res.json({ success: true });
});

export default router;
