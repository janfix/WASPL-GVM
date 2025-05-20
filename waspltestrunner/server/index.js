import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Student from './models/student.js';
import Publication from './models/publication.js';
import Group from "./models/group.js";
import Test from './models/Test.js';
import Result from './models/results.js';
import Session from "./models/session.js"; 
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { verifySystemToken } from './middleware/systemAuth.js';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import sessionRoutes from './routes/sessionRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sharedEnvPath = path.resolve('./', process.env.JWT_SECRET_FILE || '../shared/.env.shared');
if (fsSync.existsSync(sharedEnvPath)) {
  dotenv.config({ path: sharedEnvPath });
}

dotenv.config();
console.log("🔧 Environnement NODE_ENV =", process.env.NODE_ENV);
console.log("🔧 VITE_BASE_URL =", process.env.VITE_BASE_URL);


const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH","DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());


app.use((req, res, next) => {
  console.log(`🔍 Requête reçue : ${req.method} ${req.url}`);
  next();
});


const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté...");
  } catch (error) {
    console.error("❌ Erreur MongoDB:", error);
    setTimeout(connectDB, 5000); // 🔄 Retry après 5 secondes
  }
};


connectDB().then(() => console.log("🚀 Serveur prêt à recevoir des requêtes !"));
console.log("✅ MongoDB connecté...");  
console.log("🚀 Enregistrement des routes...");


app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`📌 Route enregistrée : ${r.route.path}`);
  }
});


cron.schedule('0 */1 * * *', async () => {
  const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const result = await Session.updateMany(
    {
      submitted: false,
      abandoned: false,
      sessionStart: { $lt: TWO_HOURS_AGO }
    },
    {
      $set: {
        abandoned: true,
        sessionEnd: new Date()
      }
    }
  );

  if (result.modifiedCount > 0) {
    console.log(`🧹 ${result.modifiedCount} session(s) marquées comme abandonnées.`);
  }
});



// Middleware for authentication
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded._id);
    if (!student) throw new Error();
    req.student = {
      _id: decoded._id,
      firstname: decoded.firstname,
      lastname: decoded.lastname,
    };
    next();
  } catch (error) {
    console.error("❌ Erreur d'authentification :", error.message);
    res.status(401).send({ error: 'Authentication required' });
    
  }
};





// 🔥 Sert le dossier media statiquement à l’URL /media
app.use('/media', express.static(path.join(__dirname, '../../media')));


app.get('/routes', (req, res) => {
  res.json([
    { method: "POST", path: "/api/results" },
    { method: "GET", path: "/api/tests/:id" }
  ]);
});

// Login route
console.log("🚀 Chargement de la route /api/login...");


app.post('/api/login', async (req, res) => {
  console.log("🔹 Requête de connexion reçue :", req.body);
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student) throw new Error('Invalid login credentials');

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) throw new Error('Invalid login credentials');

    const token = jwt.sign(
      { _id: student._id, 
        firstname: student.firstname, 
        lastname: student.lastname,
        groups: student.group,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log("🧪 Token payload : ", jwt.decode(token));
    res.send({ student, token });
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Get publications for the logged-in student
app.get('/api/publications', auth, async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.student._id);

    const groups = await Group.find({ students: studentId });
    const groupIds = groups.map(group => group._id);

    const now = new Date();

    const publications = await Publication.find({
      groupId: { $in: groupIds },
      startingDate: { $lte: now },
      endDate: { $gte: now },
    })
    .populate({
      path: 'testId',
      select: 'title duration elements' // ou 'title duration' selon ton schéma
    })
    .populate({
      path: 'groupId',
      select: 'groupName' // 🏷️ le nom du groupe dans ton modèle Group
    })
    .lean();

    res.send(publications);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});



app.get('/api/tests/:id', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: 'Test non trouvé' });
    }
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
});

// Route pour enregistrer les résultats d'un test
app.post('/api/results', auth, async (req, res) => {
  try {
    const { testId, publicationId, groupId, responses } = req.body;

    if (!testId || !publicationId || !groupId || !responses || responses.length === 0) {
      console.error("❌ Données manquantes dans la requête !");
      return res.status(400).json({ message: "Données incomplètes.", receivedData: req.body });
    }

    // 🔍 Récupérer les données nécessaires
    const [student, test, publication, group] = await Promise.all([
      Student.findById(req.student._id),
      Test.findById(testId),
      Publication.findById(publicationId).select('+owner'),
      Group.findById(groupId)
    ]);

    if (!student || !test || !publication || !group) {
      return res.status(404).json({ message: "Entité liée non trouvée." });
    }

    // 📦 Création du résultat enrichi
    console.log("📦 publication =", publication);
    console.log("📦 publication.owner =", publication.owner);
    const newResult = new Result({
      owner: publication.owner,
      studentId: req.student._id,
      studentFirstname: student.firstname,
      studentLastname: student.lastname,

      testId,
      testTitle: test.title,

      publicationId,
      publicationName: publication.publicationName,

      groupId,
      groupName: group.groupName,

      responses,
      submittedAt: new Date()
    });

    await newResult.save();
    res.status(201).json({ message: "Résultats enregistrés avec succès.", result: newResult });

  } catch (error) {
    console.error("❌ Erreur lors de l'enregistrement :", error);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement des résultats." });
  }
});

app.post("/api/sessions/start", auth, async (req, res) => {
  try {
    const { studentId, publicationId, groupId } = req.body;

    if (!studentId || !publicationId || !groupId) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // Récupère la publication
    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return res.status(404).json({ message: "Publication introuvable" });
    }

    const isMultiple = publication.access === 'multiple';

    // Vérifie si une session existe déjà pour cet étudiant/publication
    let existingSession = await Session.findOne({
      student: studentId,
      publication: publicationId,
    });

    // Cas bloquant : accès unique, test déjà terminé, pas réactivé
    if (
      existingSession &&
      existingSession.submitted &&
      publication.access === 'unique' &&
      !existingSession.reactivated
    ) {
      return res.status(403).json({
        message: "Accès refusé : test déjà terminé pour cette publication.",
      });
    }

    // Réutiliser session si elle est encore valide (pas encore soumise ou réactivée)
    if (
      existingSession &&
      (!existingSession.submitted || existingSession.reactivated)
    ) {
      return res.status(200).json({
        message: "Session déjà existante récupérée",
        sessionId: existingSession._id,
      });
    }

    // Créer une nouvelle session
    const newSession = new Session({
      student: studentId,
      group: groupId,
      publication: publicationId,
      testId: publication.testId,
      sessionStart: new Date(),
      submitted: false,
      reactivated: false,
    });

    await newSession.save();

    console.log("✅ Nouvelle session démarrée :", newSession);
    res.status(201).json({ message: "Session enregistrée", sessionId: newSession._id });
  } catch (error) {
    console.error("❌ Erreur dans `/api/sessions/start` :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// GET /api/sessions/check?student=xxx&publication=yyy
app.get("/api/sessions/check", auth, async (req, res) => {
  const { student, publication } = req.query;
  if (!student || !publication) return res.status(400).json({ message: "Champs requis manquants" });

  const session = await Session.findOne({ student, publication });
  res.status(200).json({ session });
});

app.use('/api/sessions', sessionRoutes);

app.patch("/api/sessions/:id/submit", auth, async (req, res) => {
  try {
    const sessionId = req.params.id;

    const session = await Session.findById(sessionId);
    if (!session) {
      console.log("STOPPED BY SESSION ERROR")
      return res.status(404).json({ message: "Session introuvable." });
    }

    // ✅ Mise à jour complète
    console.log("UPDATE FOR DATA SUBMITED")
    session.submitted = true;
    session.abandoned = false;             // 🔧 C'EST CETTE LIGNE QUI MANQUE
    session.sessionEnd = new Date();
    session.reactivated = false;

    await session.save();

    res.status(200).json({ message: "Session marquée comme soumise." });
  } catch (error) {
    console.error("❌ Erreur lors de la soumission de la session :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});



app.post("/api/sessions/end", auth, async (req, res) => {
  console.log("api/sessions/end REACHED!!!!")
  try {
    const { sessionId, abandoned } = req.body; // ✅ On récupère l'ID de session et si l'étudiant a abandonné

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId est requis." });
    }

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session non trouvée." });
    }

    session.sessionEnd = new Date(); // ✅ Enregistre la fin de la session
    session.abandoned = abandoned || false; // ✅ Marque comme abandonné si précisé

// ⛔ Nouveau blocage automatique si EXAM + accès unique + abandon
if (session.abandoned) {
  const publication = await Publication.findById(session.publication);
  const isExam = publication?.mode === 'EXAM';
  const isUnique = publication?.access === 'unique';

  if (isExam && isUnique) {
    session.accessStatus = false;
  }
}

    await session.save();

    console.log("✅ Session terminée :", session);
    res.status(200).json({ message: "Session mise à jour", session });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la session :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});


app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`📌 Route enregistrée : ${r.route.path}`);
  }
});

// ✅ Route pour incrémenter attempts d'une publication
console.log("✅ Route PATCH /api/publications/:id/increment-attempts chargée !");
app.patch('/api/publications/:id/increment-attempts', async (req, res) => {
  try {
    const publication = await Publication.findByIdAndUpdate(
      req.params.id,
      { $inc: { attempts: 1 } }, // Incrémente attempts de 1
      { new: true }
    );

    if (!publication) {
      return res.status(404).json({ error: "Publication non trouvée" });
    }

    res.json({ message: "Tentative ajoutée avec succès", publication });
  } catch (error) {
    console.error("❌ Erreur API :", error);
    res.status(500).json({ error: "Erreur serveur lors de l'incrémentation de attempts" });
  }
});


app.get('/api/publications/:id', async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id)
      .populate('groupId')
      .populate('testId');
    if (!publication) return res.status(404).json({ error: "Publication non trouvée" });
    res.json(publication);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la récupération de la publication" });
  }
});

app.post('/api/addNewInteraction', verifySystemToken,async (req, res) => {
  const { newName } = req.body;

  if (!newName || typeof newName !== 'string') {
    return res.status(400).json({ error: 'Nom d’interaction invalide.' });
  }

  try {
    // Répertoires sources
    const baseComponentPath = path.resolve('src/components/interactions');
    const baseLogicPath = path.resolve('src/interactions');

    // Fichiers source
    const defaultComponent = path.join(baseComponentPath, 'DefaultRender.vue');
    const defaultInteraction = path.join(baseLogicPath, 'DefaultInteraction.js');

    // Fichiers de destination
    const newComponent = path.join(baseComponentPath, `${newName}Render.vue`);
    const newInteraction = path.join(baseLogicPath, `${newName}Interaction.js`);

    // 1. Clonage + remplacement dans le .vue
    let componentContent = await fs.readFile(defaultComponent, 'utf-8');
    componentContent = componentContent.replace(/message/g, newName);
    await fs.writeFile(newComponent, componentContent);

    // 2. Clonage + remplacement dans le .js
    let logicContent = await fs.readFile(defaultInteraction, 'utf-8');
    logicContent = logicContent.replace(/Default/g, newName);
    await fs.writeFile(newInteraction, logicContent);

    res.status(200).json({ message: `✅ Interaction ${newName} créée avec succès.` });
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'interaction :", error);
    res.status(500).json({ error: 'Erreur serveur lors de la création de l’interaction.' });
  }
});


app.patch('/api/sessions/cleanup', auth, async (req, res) => {
  try {
    const TWO_HOURS_AGO = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const result = await Session.updateMany(
      {
        submitted: false,
        abandoned: false,
        sessionStart: { $lt: TWO_HOURS_AGO }
      },
      {
        $set: {
          abandoned: true,
          sessionEnd: new Date()
        }
      }
    );

    res.status(200).json({
      message: `Nettoyage effectué.`,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage des sessions :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get('/api/access/ping', (req, res) => {
  res.json({ message: "Access routes OK ✅" });
});


const PORT = process.env.PORT || 3011;
const HOST = "0.0.0.0"; // 🔥 Permet à Docker d'accéder au serveur

console.log("📋 Liste des routes chargées :");
app._router.stack.forEach((r) => {
  if (r.route?.path) {
    console.log(`📌 ${r.route.stack[0].method.toUpperCase()} ${r.route.path}`);
  }
});


const baseUrl = (process.env.VITE_BASE_URL || '/testrunner').replace(/\/+$/, '');
console.log(`🛠️ Configuration frontend en production avec base : "${baseUrl}"`);


  const distPath = path.resolve(__dirname, '../dist');
  app.use(baseUrl, express.static(distPath));

  // Sert vite.svg si nécessaire
  app.get(`${baseUrl}/vite.svg`, (req, res) => {
    res.sendFile(path.join(distPath, 'vite.svg'));
  });

  // Catch-all Vue Router (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});


if (process.env.NODE_ENV === 'production') {console.log("BAD JP")}
console.log("⚙️ NODE_ENV =", process.env.NODE_ENV);

app.listen(PORT, HOST, () => console.log(`✅ Server running on http://${HOST}:${PORT}`));

