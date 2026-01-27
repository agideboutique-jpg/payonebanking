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
const TransactionCode = require('./TransactionCode'); // ✅ LIGNE AJOUTÉE

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
// ✅ NOUVELLES RELATIONS : TransactionCode
// ========================================

// Un utilisateur peut avoir plusieurs codes
User.hasMany(TransactionCode, { 
  foreignKey: 'userId', 
  as: 'codes',
  onDelete: 'CASCADE'
});

// Un code appartient à un utilisateur (client)
TransactionCode.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'client'
});

// Un code est généré par un administrateur
TransactionCode.belongsTo(User, { 
  foreignKey: 'generePar', 
  as: 'administrateur'
});

// Un code peut être lié à une transaction (si utilisé)
TransactionCode.belongsTo(Transaction, { 
  foreignKey: 'transactionId', 
  as: 'transaction'
});

// ========================================
// 📤 EXPORT
// ========================================

module.exports = {
  sequelize,
  User,
  Transaction,
  Beneficiaire,
  TransactionCode // ✅ LIGNE AJOUTÉE
};