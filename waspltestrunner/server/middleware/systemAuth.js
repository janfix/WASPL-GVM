import jwt from 'jsonwebtoken';

export function verifySystemToken(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("🔐 Authorization header reçu :", authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Token système manquant" });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'system') {
      return res.status(403).json({ error: "Accès refusé : rôle non autorisé" });
    }

    req.systemUser = decoded;

    console.log("✅ Appel système autorisé depuis :", decoded?.app || "non spécifié");

    next(); // très important
  } catch (err) {
    console.error("❌ Token système invalide :", err.message);
    return res.status(401).json({ error: "Token système invalide" });
  }
}
