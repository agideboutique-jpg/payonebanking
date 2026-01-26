// ========================================
// 🔐 ROUTES D'AUTHENTIFICATION
// ========================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========================================
// 📝 ROUTE D'INSCRIPTION
// ========================================
router.post('/register', async (req, res) => {
  try {
    console.log('📥 Données reçues:', req.body);
    
    // Récupérer les données du formulaire
    const { nom, email, telephone, adresse, password } = req.body;

    // Vérifier que tous les champs sont présents
    if (!nom || !email || !telephone || !adresse || !password) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires' 
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide' 
      });
    }

    // Validation du mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Cet email est déjà utilisé' 
      });
    }

    // Hasher le mot de passe (10 rounds de salage)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur dans la base de données
    const newUser = await User.create({
      nom,
      email,
      telephone,
      adresse,
      password: hashedPassword,
      solde: 0,
      userType: 'client',
      isActive: true
    });

    console.log('✅ Utilisateur créé:', newUser.email);

    // Réponse de succès
    res.status(201).json({
      message: 'Inscription réussie',
      userId: newUser.id
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'inscription' 
    });
  }
});

// ========================================
// 🔐 ROUTE DE CONNEXION
// ========================================
router.post('/login', async (req, res) => {
  try {
    console.log('📥 Tentative de connexion pour:', req.body.email);
    
    const { email, password } = req.body;

    // Vérifier que les champs sont présents
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email et mot de passe requis' 
      });
    }

    // Chercher l'utilisateur dans la base de données
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Votre compte a été désactivé. Contactez un administrateur.' 
      });
    }

    // Générer un token JWT (valide 24h)
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        userType: user.userType 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Connexion réussie pour:', user.email);

    // Réponse de succès avec les informations de l'utilisateur
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      userId: user.id,
      userType: user.userType,
      nom: user.nom,
      email: user.email,
      solde: user.solde
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({ 
      message: 'Erreur serveur lors de la connexion' 
    });
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