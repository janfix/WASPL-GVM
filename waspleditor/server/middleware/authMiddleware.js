import jwt from "jsonwebtoken";
import User from "../models/User.js";

const authMiddleware = async (req, res, next) => {
  console.log("🔐 authMiddleware appelé pour :", req.method, req.originalUrl);
  console.log("📡 Headers reçus :", req.headers);

  const authHeader = req.header("Authorization");
  if (!authHeader) {
    console.log("❌ Aucun header Authorization");
    return res.status(401).json({ message: "Accès refusé. Aucun token fourni." });
  }

  const token = authHeader.split(" ")[1];
  console.log("🔑 Token extrait :", token);

  if (!token) {
    console.log("❌ Aucun token dans le header");
    return res.status(401).json({ message: "Accès refusé. Aucun token trouvé." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token décodé avec succès :", decoded);

    if (!decoded.id) {
      console.log("❌ ID manquant dans le token");
      return res.status(401).json({ message: "Token invalide" });
    }

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      console.log("❌ Utilisateur introuvable en base :", decoded.id);
      return res.status(401).json({ message: "Utilisateur non trouvé" });
    }

    //console.log("✅ Utilisateur trouvé :", req.user);
    console.log("🔐 Auth OK pour :", req.user);
    next();
  } catch (error) {
    console.error("❌ Erreur middleware d'authentification :", error);
    return res.status(401).json({ message: "Token invalide ou expiré" });
  }
};

export default authMiddleware;
