// ========================================
// ROUTES D'AUTHENTIFICATION
// ========================================

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ========================================
// INSCRIPTION CLIENT
// POST /api/auth/signup
// ========================================

router.post('/signup', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      address,
      city,
      country,
      postalCode
    } = req.body;
    
    // 1. Vérifier que tous les champs obligatoires sont présents
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs obligatoires doivent être remplis.'
      });
    }
    
    // 2. Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ where: { email } });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }
    
    // 3. Créer l'utilisateur
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Sera crypté automatiquement par le hook beforeCreate
      address,
      city,
      country,
      postalCode,
      role: 'client', // Par défaut, c'est un client
      balance: 0.00
    });
    
    // 4. Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valide 7 jours
    );
    
    // 5. Retourner les informations (sans le mot de passe)
    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès !',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          accountNumber: user.accountNumber,
          balance: user.balance,
          role: user.role
        },
        token
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du compte.',
      error: error.message
    });
  }
});

// ========================================
// CONNEXION
// POST /api/auth/login
// ========================================

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Vérifier que l'email et le mot de passe sont fournis
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.'
      });
    }
    
    // 2. Chercher l'utilisateur
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }
    
    // 3. Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }
    
    // 4. Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }
    
    // 5. Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // 6. Retourner les informations
    res.json({
      success: true,
      message: 'Connexion réussie !',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          accountNumber: user.accountNumber,
          balance: user.balance,
          role: user.role
        },
        token
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion.',
      error: error.message
    });
  }
});

// ========================================
// CRÉER LE COMPTE ADMIN PAR DÉFAUT
// POST /api/auth/create-admin (à utiliser une seule fois)
// ========================================

router.post('/create-admin', async (req, res) => {
  try {
    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Un administrateur existe déjà.'
      });
    }
    
    // Créer le compte admin
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'PayOne',
      email: process.env.ADMIN_EMAIL,
      phone: '+229 00 00 00 00',
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      balance: 0.00
    });
    
    res.status(201).json({
      success: true,
      message: 'Compte administrateur créé avec succès !',
      data: {
        email: admin.email,
        accountNumber: admin.accountNumber
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin.',
      error: error.message
    });
  }
});

module.exports = router;