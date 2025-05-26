import jwt from "jsonwebtoken";
import Student from "../models/student.js";

const studentAuthMiddleware = async (req, res, next) => {
  console.log("🔐 studentAuthMiddleware appelé pour :", req.method, req.originalUrl);
  console.log("📡 Headers reçus :", req.headers);

  let token;

  // 🔎 Header Authorization
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log("🔑 Token extrait du header :", token);
  }

  // 🍪 Cookie fallback
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
    console.log("🔑 Token extrait du cookie :", token);
  }

  if (!token) {
    console.log("❌ Aucun token trouvé");
    return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token décodé avec succès :", decoded);

    const studentId = decoded._id || decoded.id;

    // 🎯 CAS SPÉCIAL : token généré pour mode PREVIEW depuis waspleditor
    if (studentId === "preview") {
      req.student = {
        _id: "preview",
        firstname: "Preview",
        lastname: "Mode",
        email: "preview@waspl.ai",
      };
      console.log("🎬 Mode preview autorisé sans étudiant");
      return next();
    }

    if (!studentId) {
      return res.status(401).json({ message: "Token invalide (pas d'ID)" });
    }

    req.student = await Student.findById(studentId);
    if (!req.student) {
      return res.status(401).json({ message: "Étudiant introuvable" });
    }

    console.log("🔐 Auth étudiant OK pour :", req.student.email);
    next();
  } catch (error) {
    console.error("❌ Erreur d'authentification étudiant :", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

export default studentAuthMiddleware;
