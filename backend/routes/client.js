// ========================================
// ROUTES CLIENT
// ========================================

const express = require('express');
const router = express.Router();
const { User, Transaction } = require('../models');
const { verifyToken, isClient } = require('../middleware/auth');
const { sequelize } = require('../config/database');

// Toutes les routes client nécessitent d'être connecté
// verifyToken : vérifie le token JWT
// isClient : vérifie que l'utilisateur est un client (pas admin)

// ========================================
// OBTENIR LE PROFIL DU CLIENT CONNECTÉ
// GET /api/client/profile
// ========================================

router.get('/profile', verifyToken, isClient, async (req, res) => {
  try {
    // req.user contient les infos de l'utilisateur connecté (ajouté par verifyToken)
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] } // On n'envoie pas le mot de passe
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        accountNumber: user.accountNumber,
        balance: user.balance,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil.',
      error: error.message
    });
  }
});

// ========================================
// MODIFIER LE PROFIL DU CLIENT
// PUT /api/client/profile
// ========================================

router.put('/profile', verifyToken, isClient, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      city,
      country,
      postalCode,
      profilePhoto
    } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    // Mise à jour des champs (seulement ceux qui sont fournis)
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (city) user.city = city;
    if (country) user.country = country;
    if (postalCode) user.postalCode = postalCode;
    if (profilePhoto) user.profilePhoto = profilePhoto;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès !',
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        postalCode: user.postalCode,
        accountNumber: user.accountNumber,
        balance: user.balance,
        profilePhoto: user.profilePhoto
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur modification profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification du profil.',
      error: error.message
    });
  }
});

// ========================================
// OBTENIR LE SOLDE DU CLIENT
// GET /api/client/balance
// ========================================

router.get('/balance', verifyToken, isClient, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'accountNumber', 'balance']
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé.'
      });
    }
    
    res.json({
      success: true,
      data: {
        accountNumber: user.accountNumber,
        balance: parseFloat(user.balance),
        currency: 'XOF' // Franc CFA
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération solde:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du solde.',
      error: error.message
    });
  }
});

// ========================================
// OBTENIR L'HISTORIQUE DES TRANSACTIONS
// GET /api/client/transactions
// ========================================

router.get('/transactions', verifyToken, isClient, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Récupérer toutes les transactions où l'utilisateur est émetteur OU destinataire
    const transactions = await Transaction.findAll({
      where: {
        [sequelize.Sequelize.Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'accountNumber']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'accountNumber']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    // Formater les transactions
    const formattedTransactions = transactions.map(t => ({
      id: t.id,
      reference: t.reference,
      amount: parseFloat(t.amount),
      type: t.type,
      status: t.status,
      description: t.description,
      sender: t.sender ? {
        id: t.sender.id,
        name: `${t.sender.firstName} ${t.sender.lastName}`,
        accountNumber: t.sender.accountNumber
      } : null,
      receiver: t.receiver ? {
        id: t.receiver.id,
        name: `${t.receiver.firstName} ${t.receiver.lastName}`,
        accountNumber: t.receiver.accountNumber
      } : null,
      // Déterminer si c'est un crédit (reçu) ou débit (envoyé)
      direction: t.receiverId === req.user.id ? 'credit' : 'debit',
      createdAt: t.createdAt
    }));
    
    res.json({
      success: true,
      data: formattedTransactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: formattedTransactions.length
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des transactions.',
      error: error.message
    });
  }
});

// ========================================
// FAIRE UN VIREMENT
// POST /api/client/transfer
// ========================================

router.post('/transfer', verifyToken, isClient, async (req, res) => {
  // Transaction SQL pour garantir l'intégrité
  const t = await sequelize.transaction();
  
  try {
    const { receiverAccountNumber, amount, description } = req.body;
    
    // 1. Vérifications de base
    if (!receiverAccountNumber || !amount) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Numéro de compte destinataire et montant requis.'
      });
    }
    
    const transferAmount = parseFloat(amount);
    
    if (transferAmount <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0.'
      });
    }
    
    // 2. Récupérer l'émetteur (utilisateur connecté)
    const sender = await User.findByPk(req.user.id, { transaction: t });
    
    if (!sender) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Émetteur non trouvé.'
      });
    }
    
    // 3. Vérifier qu'on n'envoie pas à soi-même
    if (sender.accountNumber === receiverAccountNumber) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas effectuer un virement vers votre propre compte.'
      });
    }
    
    // 4. Vérifier le solde de l'émetteur
    if (parseFloat(sender.balance) < transferAmount) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Solde insuffisant.',
        currentBalance: parseFloat(sender.balance),
        requestedAmount: transferAmount
      });
    }
    
    // 5. Récupérer le destinataire
    const receiver = await User.findOne({
      where: { accountNumber: receiverAccountNumber },
      transaction: t
    });
    
    if (!receiver) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Compte destinataire non trouvé.'
      });
    }
    
    // 6. Vérifier que le compte destinataire est actif
    if (!receiver.isActive) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Le compte destinataire est désactivé.'
      });
    }
    
    // 7. Effectuer le virement
    // Débiter l'émetteur
    sender.balance = parseFloat(sender.balance) - transferAmount;
    await sender.save({ transaction: t });
    
    // Créditer le destinataire
    receiver.balance = parseFloat(receiver.balance) + transferAmount;
    await receiver.save({ transaction: t });
    
    // 8. Créer la transaction
    const transaction = await Transaction.create({
      senderId: sender.id,
      receiverId: receiver.id,
      amount: transferAmount,
      type: 'transfer',
      status: 'completed',
      description: description || `Virement de ${sender.firstName} ${sender.lastName} à ${receiver.firstName} ${receiver.lastName}`
    }, { transaction: t });
    
    // 9. Valider la transaction SQL
    await t.commit();
    
    res.json({
      success: true,
      message: 'Virement effectué avec succès !',
      data: {
        transaction: {
          id: transaction.id,
          reference: transaction.reference,
          amount: parseFloat(transaction.amount),
          type: transaction.type,
          status: transaction.status,
          description: transaction.description,
          createdAt: transaction.createdAt
        },
        sender: {
          accountNumber: sender.accountNumber,
          newBalance: parseFloat(sender.balance)
        },
        receiver: {
          name: `${receiver.firstName} ${receiver.lastName}`,
          accountNumber: receiver.accountNumber
        }
      }
    });
    
  } catch (error) {
    // En cas d'erreur, annuler la transaction
    await t.rollback();
    console.error('❌ Erreur virement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du virement.',
      error: error.message
    });
  }
});

// ========================================
// OBTENIR UNE TRANSACTION SPÉCIFIQUE
// GET /api/client/transactions/:id
// ========================================

router.get('/transactions/:id', verifyToken, isClient, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        id: req.params.id,
        [sequelize.Sequelize.Op.or]: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'firstName', 'lastName', 'accountNumber']
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName', 'accountNumber']
        }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction non trouvée.'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: transaction.id,
        reference: transaction.reference,
        amount: parseFloat(transaction.amount),
        type: transaction.type,
        status: transaction.status,
        description: transaction.description,
        sender: transaction.sender ? {
          id: transaction.sender.id,
          name: `${transaction.sender.firstName} ${transaction.sender.lastName}`,
          accountNumber: transaction.sender.accountNumber
        } : null,
        receiver: transaction.receiver ? {
          id: transaction.receiver.id,
          name: `${transaction.receiver.firstName} ${transaction.receiver.lastName}`,
          accountNumber: transaction.receiver.accountNumber
        } : null,
        direction: transaction.receiverId === req.user.id ? 'credit' : 'debit',
        createdAt: transaction.createdAt
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la transaction.',
      error: error.message
    });
  }
});

module.exports = router;