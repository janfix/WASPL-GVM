import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import testRoutes from "./routes/testRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import publicationRoutes from "./routes/publicationRoutes.js";
import userRoutes from './routes/userRoutes.js';
import { Element } from "./models/itemModel.js";
import authRoutes from './routes/auth.js';
import authMiddleware from './middleware/authMiddleware.js';
import addInteraction from './routes/addInteractions.js';
import scaffoldInteraction from './routes/scaffoldInteraction.js';
import path from 'path';
import { fileURLToPath } from 'url';
import mediaRoutes from './routes/mediaRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import { initDefaultAdmin } from './utils/initDefaultAdmin.js'
import cookieParser from 'cookie-parser';


const app = express();

const __dirname = path.dirname(fileURLToPath(import.meta.url));


// Sert les fichiers statiques Vue compilés
const isProd = process.env.NODE_ENV === "production";
const isDev = !isProd;




const wikiPath = path.join(__dirname, '../../wasplwiki');
// 🔥 Sert le dossier 'media' commun à la racine pour tous les médias (images, etc.)
const mediaPath = path.join(__dirname, '../../media');

app.use('/media', express.static(mediaPath));
app.use('/wiki', express.static(wikiPath));

const getAllMarkdownFiles = (dir, baseDir = '') => {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    const fullPath = path.join(dir, file)
    const relativePath = path.join(baseDir, file)
    const stat = fs.statSync(fullPath)
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath, relativePath))
    } else if (file.endsWith('.md')) {
      results.push(relativePath.replace(/\\/g, '/')) // pour Windows
    }
  })
  return results
}




// === Middleware ===
app.use(express.json({ limit: "10mb" })); // Parse JSON avec une limite de 10 Mo

// === Configuration CORS (plus dynamique) ===
app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH","OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"], 
  })
);

app.use(cookieParser());

// === Connexion à MongoDB avec gestion des erreurs ===
const connectDB = async () => {
  try {
    console.log("🟡 Tentative de connexion à MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté !");
  } catch (err) {
    console.error("❌ Erreur de connexion MongoDB:", err.message);
    console.log("🔄 Nouvelle tentative dans 5 secondes...");
    setTimeout(connectDB, 5000); // Réessaie après 5 secondes
  }
};

app.use((req, res, next) => {
  console.log(`[Backend] Reçu ${req.method} ${req.path}`);
  next();
});


// Routes
app.use('/api/auth', authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/publications", publicationRoutes);
app.use("/api/results", resultRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dev', addInteraction);
app.use('/api/dev', scaffoldInteraction);
app.use('/api/media', mediaRoutes);
app.use('/api/sessions', sessionRoutes);


const PORT = process.env.PORT || 4000;
const HOST = "0.0.0.0"; // 🔥 Permet l’accès depuis Docker


if (isProd) {
  const clientPath = path.join(__dirname, '../dist');
  app.use(express.static(clientPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}



const startServer = async () => {
  try {
    await connectDB();
    // === Debug : Afficher les routes enregistrées ===
    /* app._router.stack.forEach((r) => {
      if (r.route && r.route.path) {
        console.log(`Route enregistrée : ${r.route.path}`);
      }
    }); */

    await initDefaultAdmin()

    app.listen(PORT,HOST, () => {
      console.log(`✅ Server running on http://${HOST}:${PORT}`);
      
    });
  } catch (err) {
    console.error("❌ Failed to start the server:", err.message);
    process.exit(1);
  }
};


app.get('/api/wiki-files', (req, res) => {
  const wikiDir = path.join(__dirname, '../../wasplwiki')
  try {
    const files = getAllMarkdownFiles(wikiDir)
    res.json(files)
  } catch (e) {
    res.status(500).json({ error: 'Erreur de lecture des fichiers wiki' })
  }
})


app.get('/media-test', (req, res) => {
  res.sendFile(path.join(mediaPath, 'astro.png'));
});








startServer();

// === Initialisation de la base de données (avec try/catch) ===
async function seedDatabase() {
  try {
    const existingItems = await Element.countDocuments();
    if (existingItems > 0) return;

    const item = new Element({
      el_ID: "1",
      el_Label: "Exemple d'item",
      el_Type: "choice",
      el_Text: "Quelle est la capitale de la France ?",
    });

    await item.save();
    console.log("✅ Base de données initialisée avec un item.");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base :", error);
  }
}

//seedDatabase();