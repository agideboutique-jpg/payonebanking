// ========================================
// 👤 MODÈLE UTILISATEUR
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');



const User = sequelize.define('User', {
  // ID (auto-incrémenté)
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Nom complet
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom ne peut pas être vide'
      }
    }
  },
  
  // Email (unique)
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: 'Cet email est déjà utilisé'
    },
    validate: {
      isEmail: {
        msg: 'Format d\'email invalide'
      },
      notEmpty: {
        msg: 'L\'email ne peut pas être vide'
      }
    }
  },
  
  // Téléphone
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le téléphone ne peut pas être vide'
      }
    }
  },
  
  // Adresse complète
  adresse: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'L\'adresse ne peut pas être vide'
      }
    }
  },
  
  // Mot de passe (hashé)
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le mot de passe ne peut pas être vide'
      }
    }
  },
  
  // Solde du compte
  solde: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00,
    validate: {
      isDecimal: {
        msg: 'Le solde doit être un nombre décimal'
      },
      min: {
        args: [0],
        msg: 'Le solde ne peut pas être négatif'
      }
    }
  },
  
  // Type d'utilisateur (client ou admin)
  userType: {
    type: DataTypes.ENUM('client', 'admin'),
    allowNull: false,
    defaultValue: 'client',
    validate: {
      isIn: {
        args: [['client', 'admin']],
        msg: 'Le type d\'utilisateur doit être "client" ou "admin"'
      }
    }
  },
  
  // Compte actif ou non
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
  
}, {
  // Options du modèle
  tableName: 'users',
  timestamps: true, // Active createdAt et updatedAt
  underscored: false // Utilise camelCase au lieu de snake_case
});

module.exports = User;