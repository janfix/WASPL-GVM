// scripts/tokenGenerator.js
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ESM-friendly __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📍 Chemins utiles
const sharedEnvPath = path.resolve(__dirname, '../shared/.env.shared');
const wasplEditorEnvPath = path.resolve(__dirname, '../waspleditor/.env.local'); // ← ici

// ✅ Chargement de la clé secrète
if (!fs.existsSync(sharedEnvPath)) {
  console.error('❌ Fichier .env.shared introuvable à :', sharedEnvPath);
  process.exit(1);
}
dotenv.config({ path: sharedEnvPath });

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET non défini dans .env.shared');
  process.exit(1);
}

// 🛠 Génération du token
const token = jwt.sign(
  { role: "system", app: "waspleditor" },
  process.env.JWT_SECRET,
  { expiresIn: "30d" }
);

// 📝 Mise à jour de waspleditor/.env.local
let envContent = '';
if (fs.existsSync(wasplEditorEnvPath)) {
  envContent = fs.readFileSync(wasplEditorEnvPath, 'utf-8');
}

// 🔄 Remplace ou ajoute la ligne correspondante
const newLine = `VITE_SYSTEM_TOKEN_FOR_TESTRUNNER=${token}`;
if (envContent.includes('VITE_SYSTEM_TOKEN_FOR_TESTRUNNER=')) {
  envContent = envContent.replace(
    /VITE_SYSTEM_TOKEN_FOR_TESTRUNNER=.*/g,
    newLine
  );
} else {
  envContent += `\n${newLine}\n`;
}

// 💾 Écrit dans le fichier
fs.writeFileSync(wasplEditorEnvPath, envContent.trim() + '\n');

console.log('\n🎟️ Token système généré et mis à jour dans : waspleditor/.env.local');
console.log('\n🔐 Token :\n' + token + '\n');
