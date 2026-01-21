// ========================================
// DÉFINITION DES RELATIONS ENTRE MODÈLES
// ========================================

const User = require('./User');
const Transaction = require('./Transaction');

// ========================================
// RELATIONS USER ↔ TRANSACTION
// ========================================

// 1. Un utilisateur peut ENVOYER plusieurs transactions
User.hasMany(Transaction, {
  foreignKey: 'senderId',       // Colonne sender_id dans transactions
  as: 'sentTransactions'        // Alias pour récupérer les données
});

// 2. Un utilisateur peut RECEVOIR plusieurs transactions
User.hasMany(Transaction, {
  foreignKey: 'receiverId',
  as: 'receivedTransactions'
});

// 3. Une transaction appartient à un ÉMETTEUR
Transaction.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender'                  // Alias pour récupérer l'émetteur
});

// 4. Une transaction appartient à un DESTINATAIRE
Transaction.belongsTo(User, {
  foreignKey: 'receiverId',
  as: 'receiver'                // Alias pour récupérer le destinataire
});

// ========================================
// EXPORT DES MODÈLES
// ========================================
module.exports = {
  User,
  Transaction
};