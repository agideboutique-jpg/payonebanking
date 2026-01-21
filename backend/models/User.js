// ========================================
// MODÈLE UTILISATEUR (CLIENT OU ADMIN)
// ========================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

// Définition du modèle User
const User = sequelize.define('User', {
  
  // ========================================
  // IDENTIFIANT UNIQUE
  // ========================================
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,        // Clé primaire
    autoIncrement: true      // S'incrémente automatiquement
  },
  
  // ========================================
  // INFORMATIONS PERSONNELLES
  // ========================================
  firstName: {
    type: DataTypes.STRING(100),  // Texte max 100 caractères
    allowNull: false,             // Obligatoire
    field: 'first_name'           // Nom dans la base de données
  },
  
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,              // Chaque email doit être unique
    validate: {
      isEmail: true            // Vérifie que c'est un email valide
    }
  },
  
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
    // Le mot de passe sera crypté automatiquement
  },
  
  // ========================================
  // ADRESSE
  // ========================================
  address: {
    type: DataTypes.STRING(255),
    allowNull: true              // Optionnel
  },
  
  city: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  country: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'postal_code'
  },
  
  // ========================================
  // INFORMATIONS BANCAIRES
  // ========================================
  accountNumber: {
    type: DataTypes.STRING(50),
    unique: true,               // Chaque numéro de compte est unique
    field: 'account_number'
    // Sera généré automatiquement : PAY1737326400123
  },
  
  balance: {
    type: DataTypes.DECIMAL(15, 2),  // 15 chiffres, 2 décimales
    defaultValue: 0.00,              // Solde initial : 0€
    validate: {
      min: 0  // Le solde ne peut JAMAIS être négatif (sécurité bancaire)
    }
  },
  
  // ========================================
  // RÔLE ET STATUT
  // ========================================
  role: {
    type: DataTypes.ENUM('client', 'admin'),  // Soit client, soit admin
    defaultValue: 'client'                    // Par défaut : client
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,          // Le compte est actif par défaut
    field: 'is_active'
  },
  
  // ========================================
  // PHOTO DE PROFIL (OPTIONNEL)
  // ========================================
  profilePhoto: {
    type: DataTypes.TEXT,        // Peut stocker une URL ou du Base64
    allowNull: true,
    field: 'profile_photo'
  }
  
}, {
  // ========================================
  // OPTIONS DU MODÈLE
  // ========================================
  tableName: 'users',          // Nom de la table dans MySQL
  timestamps: true,            // Ajoute created_at et updated_at automatiquement
  underscored: true            // Utilise snake_case (first_name au lieu de firstName)
});

// ========================================
// HOOK : AVANT LA CRÉATION D'UN UTILISATEUR
// ========================================
User.beforeCreate(async (user) => {
  
  // 1. Crypter le mot de passe
  if (user.password) {
    const salt = await bcrypt.genSalt(10);  // Génère un "sel" pour sécuriser
    user.password = await bcrypt.hash(user.password, salt);  // Crypte le mot de passe
  }
  
  // 2. Générer un numéro de compte unique
  if (!user.accountNumber) {
    // Format : PAY + timestamp + nombre aléatoire
    // Exemple : PAY1737326400789
    user.accountNumber = 'PAY' + Date.now() + Math.floor(Math.random() * 1000);
  }
});

// ========================================
// MÉTHODE : COMPARER LES MOTS DE PASSE
// ========================================
// Utilisée lors de la connexion pour vérifier le mot de passe
User.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export du modèle
module.exports = User;