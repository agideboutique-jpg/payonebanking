// ========================================
// 📊 MODÈLE TRANSACTION BANCAIRE
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Transaction = sequelize.define('Transaction', {
  
  // ID unique
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ID de l'utilisateur (propriétaire de la transaction)
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Type de transaction
  type: {
    type: DataTypes.ENUM('credit', 'debit'),
    allowNull: false
  },
  
  // Montant
  montant: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  
  // Description
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Bénéficiaire (pour virements)
  beneficiaire: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  // IBAN bénéficiaire
  iban: {
    type: DataTypes.STRING(34),
    allowNull: true
  }
  
}, {
  tableName: 'transactions',
  timestamps: true,
  underscored: false
});

module.exports = Transaction;