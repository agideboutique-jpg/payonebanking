// ========================================
// MODÈLE TRANSACTION BANCAIRE
// ========================================

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Définition du modèle Transaction
const Transaction = sequelize.define('Transaction', {
  
  // ========================================
  // IDENTIFIANT UNIQUE
  // ========================================
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ========================================
  // ÉMETTEUR (celui qui ENVOIE l'argent)
  // ========================================
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,              // Obligatoire
    field: 'sender_id',
    references: {
      model: 'users',              // Référence à la table users
      key: 'id'
    }
  },
  
  // ========================================
  // DESTINATAIRE (celui qui REÇOIT l'argent)
  // ========================================
  receiverId: {
    type: DataTypes.INTEGER,
    allowNull: true,               // Optionnel (pour dépôts/retraits)
    field: 'receiver_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // ========================================
  // MONTANT DE LA TRANSACTION
  // ========================================
  amount: {
    type: DataTypes.DECIMAL(15, 2),  // Max 15 chiffres, 2 décimales
    allowNull: false,
    validate: {
      min: 0.01  // Minimum 0.01€ (1 centime)
    }
  },
  
  // ========================================
  // TYPE DE TRANSACTION
  // ========================================
  type: {
    type: DataTypes.ENUM('transfer', 'deposit', 'withdrawal'),
    allowNull: false,
    defaultValue: 'transfer'
    // transfer = virement entre 2 comptes
    // deposit = dépôt d'argent
    // withdrawal = retrait d'argent
  },
  
  // ========================================
  // STATUT DE LA TRANSACTION
  // ========================================
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
    defaultValue: 'completed'
    // pending = en attente
    // completed = réussie
    // failed = échouée
    // cancelled = annulée
  },
  
  // ========================================
  // DESCRIPTION / MOTIF
  // ========================================
  description: {
    type: DataTypes.STRING(500),
    allowNull: true
    // Exemple : "Remboursement restaurant", "Loyer janvier"
  },
  
  // ========================================
  // RÉFÉRENCE UNIQUE
  // ========================================
  reference: {
    type: DataTypes.STRING(100),
    unique: true
    // Sera générée automatiquement : TRX1737326400789
  }
  
}, {
  tableName: 'transactions',
  timestamps: true,      // Ajoute created_at et updated_at
  underscored: true
});

// ========================================
// HOOK : AVANT LA CRÉATION D'UNE TRANSACTION
// ========================================
Transaction.beforeCreate(async (transaction) => {
  
  // Générer une référence unique
  if (!transaction.reference) {
    // Format : TRX + timestamp + nombre aléatoire
    // Exemple : TRX1737326400456
    transaction.reference = 'TRX' + Date.now() + Math.floor(Math.random() * 10000);
  }
});

// Export du modèle
module.exports = Transaction;