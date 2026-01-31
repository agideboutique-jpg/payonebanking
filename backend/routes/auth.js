// ========================================
// 🔐 ROUTES D'AUTHENTIFICATION
// ========================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========================================
// 🔐 ROUTE D'INSCRIPTION COMPLÈTE
// À REMPLACER dans backend/routes/auth.js
// ========================================

router.post('/register', async (req, res) => {
  console.log('📝 POST /api/auth/register');
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));

  try {
    const {
      // Infos personnelles
      nom, prenom, dateNaissance, lieuNaissance, nationalite,
      numeroSecuriteSociale, situationFamiliale,
      // Coordonnées
      numeroRue, nomRue, complementAdresse, ville, codePostal, pays,
      telephoneFixe, telephoneMobile, email,
      // Situation pro
      statutProfessionnel, revenusMensuels, typeContrat,
      // Sécurité
      password
    } = req.body;

    // ========================================
    // ✅ VALIDATION CHAMPS OBLIGATOIRES
    // ========================================
    const required = [
      'nom', 'prenom', 'dateNaissance', 'lieuNaissance', 'nationalite',
      'situationFamiliale', 'numeroRue', 'nomRue', 'ville', 'codePostal',
      'pays', 'telephoneMobile', 'email', 'statutProfessionnel',
      'revenusMensuels', 'password'
    ];

    const missing = required.find(field => !req.body[field]);
    if (missing) {
      return res.status(400).json({
        message: `Le champ "${missing}" est obligatoire`
      });
    }

    // ========================================
    // ✅ VALIDATION EMAIL
    // ========================================
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Email invalide' });
    }

    // Vérifier unicité
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        message: 'Cet email est déjà utilisé'
      });
    }

    // ========================================
    // ✅ VALIDATION MOT DE PASSE
    // ========================================
    if (password.length < 8) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial'
      });
    }

    // ========================================
    // ✅ VALIDATION ÂGE (18+)
    // ========================================
    const birthDate = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return res.status(400).json({
        message: 'Vous devez avoir au moins 18 ans'
      });
    }

    // ========================================
    // 🔒 HASHER MOT DE PASSE
    // ========================================
    const hashedPassword = await bcrypt.hash(password, 10);

    // ========================================
    // 💾 CRÉER L'UTILISATEUR
    // ========================================
    const newUser = await User.create({
      // Infos personnelles
      nom, prenom, dateNaissance, lieuNaissance, nationalite,
      numeroSecuriteSociale: numeroSecuriteSociale || null,
      situationFamiliale,
      // Coordonnées
      numeroRue, nomRue,
      complementAdresse: complementAdresse || null,
      ville, codePostal, pays,
      telephoneFixe: telephoneFixe || null,
      telephoneMobile, email,
      // Situation pro
      statutProfessionnel, revenusMensuels,
      typeContrat: typeContrat || 'non_applicable',
      // Sécurité
      password: hashedPassword,
      solde: 0.00,
      userType: 'client',
      isActive: true
    });

    console.log('✅ Utilisateur créé:', newUser.id, '-', newUser.email);

    // ========================================
    // 📧 RÉPONSE
    // ========================================
    res.status(201).json({
      message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.',
      user: {
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    
    // Erreurs Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(e => e.message);
      return res.status(400).json({
        message: 'Erreur de validation',
        errors
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Cette information est déjà utilisée (email ou n° sécu)'
      });
    }
    
    res.status(500).json({
      message: 'Erreur serveur lors de l\'inscription',
      error: error.message
    });
  }
});

// ========================================
// 🔐 CONNEXION
// ========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('📨 Tentative de connexion pour:', email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    // Chercher l'utilisateur
    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      console.log('❌ Compte désactivé');
      return res.status(403).json({ message: 'Votre compte a été désactivé. Contactez l\'administrateur.' });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        userType: user.userType  // ✅ AJOUTER LE TYPE
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Connexion réussie pour:', user.nom, '- Type:', user.userType);

    // Réponse avec le token ET le userType
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        userType: user.userType  // ✅ RENVOYER LE TYPE
      }
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🔍 ROUTE DE VÉRIFICATION DU TOKEN (optionnel)
// ========================================
router.get('/verify', async (req, res) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Token manquant' });
    }

    const token = authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Chercher l'utilisateur
    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'nom', 'email', 'userType', 'solde', 'isActive']
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé' });
    }

    res.status(200).json({
      message: 'Token valide',
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        userType: user.userType,
        solde: user.solde
      }
    });

  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    res.status(401).json({ message: 'Token invalide ou expiré' });
  }
});

module.exports = router;