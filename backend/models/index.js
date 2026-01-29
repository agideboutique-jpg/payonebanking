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
const User = require('./User');
const Transaction = require('./Transaction');
const Beneficiaire = require('./Beneficiaire');
const TransactionCode = require('./TransactionCode');
const IdentityVerification = require('./IdentityVerification'); // ✅ AJOUTÉ

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

// Relations User ↔ Beneficiaire
User.hasMany(Beneficiaire, { 
  foreignKey: 'userId', 
  as: 'beneficiaires',
  onDelete: 'CASCADE'
});

Beneficiaire.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

Beneficiaire.belongsTo(User, { 
  foreignKey: 'validePar', 
  as: 'validateur'
});

// Relations TransactionCode
User.hasMany(TransactionCode, { 
  foreignKey: 'userId', 
  as: 'codes',
  onDelete: 'CASCADE'
});

TransactionCode.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'client'
});

TransactionCode.belongsTo(User, { 
  foreignKey: 'generePar', 
  as: 'administrateur'
});

TransactionCode.belongsTo(Transaction, { 
  foreignKey: 'transactionId', 
  as: 'transaction'
});

// ========================================
// ✅ NOUVELLES RELATIONS : IdentityVerification
// ========================================

// Un utilisateur peut avoir plusieurs vérifications d'identité
User.hasMany(IdentityVerification, { 
  foreignKey: 'userId', 
  as: 'identityVerifications',
  onDelete: 'CASCADE'
});

// Une vérification appartient à un utilisateur
IdentityVerification.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user'
});

// Une vérification est validée par un admin
IdentityVerification.belongsTo(User, { 
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
  Beneficiaire,
  TransactionCode,
  IdentityVerification // ✅ AJOUTÉ
};