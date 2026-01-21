// ========================================
// MIDDLEWARE D'AUTHENTIFICATION
// ========================================

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ========================================
// VÉRIFIER LE TOKEN JWT
// ========================================

const verifyToken = async (req, res, next) => {
  try {
    // DEBUG : Afficher les headers (temporaire)
    console.log('🔍 Headers reçus:', req.headers);
    console.log('🔍 Authorization header:', req.headers.authorization);
    
    // 1. Récupérer le token depuis les headers
    const token = req.headers.authorization?.split(' ')[1];
    // Format attendu: "Bearer TOKEN_ICI"
    
    console.log('🔍 Token extrait:', token ? token.substring(0, 20) + '...' : 'AUCUN');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Aucun token fourni.'
      });
    }
    
    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token décodé:', decoded);
    
    // 3. Récupérer l'utilisateur depuis la base de données
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // On n'envoie pas le mot de passe
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    // 4. Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }
    
    // 5. Ajouter l'utilisateur à la requête
    req.user = user;
    console.log('✅ Utilisateur authentifié:', user.email, '- Role:', user.role);
    next(); // Passer au middleware/route suivant
    
  } catch (error) {
    console.error('❌ Erreur auth middleware:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Veuillez vous reconnecter.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification du token.',
      error: error.message
    });
  }
};

// ========================================
// VÉRIFIER QUE L'UTILISATEUR EST CLIENT
// ========================================

const isClient = (req, res, next) => {
  console.log('🔍 Vérification role client pour:', req.user.email, '- Role:', req.user.role);
  
  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Réservé aux clients.'
    });
  }
  next();
};

// ========================================
// VÉRIFIER QUE L'UTILISATEUR EST ADMIN
// ========================================

const isAdmin = (req, res, next) => {
  console.log('🔍 Vérification role admin pour:', req.user.email, '- Role:', req.user.role);
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé. Réservé aux administrateurs.'
    });
  }
  next();
};

// Export des middlewares
module.exports = {
  verifyToken,
  isClient,
  isAdmin
};
