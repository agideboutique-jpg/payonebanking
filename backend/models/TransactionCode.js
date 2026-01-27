// ========================================
// 🔐 MODÈLE CODE DE TRANSACTION (OTP)
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionCode = sequelize.define('TransactionCode', {
  
  // ID unique
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Code généré (6 chiffres)
  code: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
    validate: {
      len: {
        args: [6, 6],
        msg: 'Le code doit contenir exactement 6 chiffres'
      }
    }
  },
  
  // ID du client pour qui le code a été généré
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // ID de l'admin qui a généré le code
  generePar: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Statut du code
  statut: {
    type: DataTypes.ENUM('actif', 'utilise', 'expire'),
    allowNull: false,
    defaultValue: 'actif'
  },
  
  // Date d'expiration (10 minutes par défaut)
  dateExpiration: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  // Date d'utilisation
  dateUtilisation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // ID de la transaction associée (si utilisé)
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'transactions',
      key: 'id'
    }
  },
  
  // Montant du virement (pour tracking)
  montant: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true
  }
  
}, {
  tableName: 'transaction_codes',
  timestamps: true,
  underscored: false
});

module.exports = TransactionCode;