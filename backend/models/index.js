// ========================================
// 📦 INDEX DES MODÈLES ET RELATIONS
// ========================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la connexion à la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// ========================================
// 📥 IMPORT DES MODÈLES
// ========================================
// Les modèles sont déjà initialisés avec sequelize.define() dans leurs fichiers respectifs

const User = require('./User');
const Transaction = require('./Transaction');
const Beneficiaire = require('./Beneficiaire');

// ========================================
// 🔗 DÉFINITION DES RELATIONS
// ========================================

// Relations User ↔ Transaction
User.hasMany(Transaction, { 
  foreignKey: 'userId', 
  as: 'transactions',
  onDelete: 'CASCADE'
});

Transaction.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

// Relations User ↔ Beneficiaire (client qui crée le bénéficiaire)
User.hasMany(Beneficiaire, { 
  foreignKey: 'userId', 
  as: 'beneficiaires',
  onDelete: 'CASCADE'
});

Beneficiaire.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

// Relation Beneficiaire ↔ User (admin validateur)
Beneficiaire.belongsTo(User, { 
  foreignKey: 'validePar', 
  as: 'validateur'
});

// ========================================
// 📤 EXPORT
// ========================================

module.exports = {
  sequelize,
  User,
  Transaction,
  Beneficiaire
};