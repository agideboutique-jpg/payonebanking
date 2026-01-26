// ========================================
// 🔐 MIDDLEWARE D'AUTHENTIFICATION JWT
// ========================================

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;

    console.log('🔐 Vérification du token...');

    if (!authHeader) {
      console.log('❌ Aucun token fourni');
      return res.status(401).json({ message: 'Token manquant. Veuillez vous connecter.' });
    }

    // Format attendu: "Bearer TOKEN"
    const token = authHeader.split(' ')[1];

    if (!token) {
      console.log('❌ Format de token invalide');
      return res.status(401).json({ message: 'Format de token invalide' });
    }

    console.log('🔑 Token extrait:', token.substring(0, 30) + '...');

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('✅ Token valide - Données décodées:', decoded);

    // ✅ CORRECTION : Utiliser "id" au lieu de "userId"
    req.userId = decoded.id;  // ✅ CORRECT
    req.userEmail = decoded.email;
    req.userType = decoded.userType;

    console.log('👤 Utilisateur authentifié - ID:', req.userId, '- Type:', req.userType);

    // Passer au prochain middleware/route
    next();

  } catch (error) {
    console.error('❌ Erreur authentification:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré. Veuillez vous reconnecter.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token invalide. Veuillez vous reconnecter.' });
    }
    
    return res.status(401).json({ message: 'Erreur d\'authentification' });
  }
};

module.exports = authMiddleware;