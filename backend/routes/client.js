// ========================================
// 🦢 ROUTES ESPACE CLIENT
// ========================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiaire = require('../models/Beneficiaire');
const authMiddleware = require('../middleware/auth');

// ========================================
// 📊 RÉCUPÉRER LES INFORMATIONS DU PROFIL
// ========================================
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'nom', 'email', 'telephone', 'adresse', 'solde', 'userType', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    res.status(200).json({
      message: 'Profil récupéré',
      user: {
        id: user.id,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        adresse: user.adresse,
        solde: parseFloat(user.solde),
        userType: user.userType,
        memberSince: user.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📜 RÉCUPÉRER L'HISTORIQUE DES TRANSACTIONS
// ========================================
router.get('/transactions', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;

    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const total = await Transaction.count({
      where: { userId: req.userId }
    });

    res.status(200).json({
      message: 'Transactions récupérées',
      transactions,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('❌ Erreur récupération transactions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📊 STATISTIQUES DU COMPTE
// ========================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const transactions = await Transaction.findAll({
      where: { userId: req.userId }
    });

    let totalCredits = 0;
    let totalDebits = 0;

    transactions.forEach(t => {
      if (t.type === 'credit') {
        totalCredits += parseFloat(t.montant);
      } else {
        totalDebits += parseFloat(t.montant);
      }
    });

    res.status(200).json({
      message: 'Statistiques récupérées',
      stats: {
        soldeActuel: parseFloat(user.solde),
        totalTransactions: transactions.length,
        totalCredits: totalCredits.toFixed(2),
        totalDebits: totalDebits.toFixed(2),
        derniereMiseAJour: user.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🧪 ROUTE DE TEST : AJOUTER DES TRANSACTIONS
// ========================================
router.post('/add-test-transactions', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const testTransactions = [
      {
        userId,
        type: 'credit',
        montant: 500.00,
        description: 'Dépôt initial',
        beneficiaire: 'Payone Banking',
        iban: null
      },
      {
        userId,
        type: 'debit',
        montant: 50.00,
        description: 'Achat en ligne',
        beneficiaire: 'Amazon',
        iban: 'FR7630006000011234567890189'
      },
      {
        userId,
        type: 'credit',
        montant: 200.00,
        description: 'Virement reçu',
        beneficiaire: 'Jean Dupont',
        iban: 'FR7612345678901234567890123'
      },
      {
        userId,
        type: 'debit',
        montant: 30.50,
        description: 'Restaurant',
        beneficiaire: 'Le Gourmet',
        iban: null
      },
      {
        userId,
        type: 'credit',
        montant: 1000.00,
        description: 'Salaire',
        beneficiaire: 'Entreprise XYZ',
        iban: null
      }
    ];

    await Transaction.bulkCreate(testTransactions);

    const totalCredits = testTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.montant, 0);

    const totalDebits = testTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.montant, 0);

    const newBalance = totalCredits - totalDebits;

    await User.update(
      { solde: newBalance },
      { where: { id: userId } }
    );

    res.status(200).json({
      message: 'Transactions de test créées',
      totalTransactions: testTransactions.length,
      newBalance: newBalance.toFixed(2)
    });

  } catch (error) {
    console.error('❌ Erreur création transactions test:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 💸 EFFECTUER UN VIREMENT PAR BÉNÉFICIAIRE
// ========================================
router.post('/transfer', authMiddleware, async (req, res) => {
  console.log('📨 POST /api/client/transfer');
  console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));
  console.log('💸 Demande de virement de userId:', req.userId);

  try {
    const { beneficiaireId, montant, description } = req.body;
    const userId = req.userId;

    console.log('📥 Données reçues:', { beneficiaireId, montant, description });

    // ✅ VALIDATION : Vérifier que SEULEMENT ces 3 champs sont présents
    if (!beneficiaireId || !montant || !description) {
      console.log('❌ Validation échouée - Champs manquants');
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires (beneficiaireId, montant, description)' 
      });
    }

    // Vérifier que le montant est positif
    const amount = parseFloat(montant);
    if (isNaN(amount) || amount <= 0) {
      console.log('❌ Montant invalide:', montant);
      return res.status(400).json({ message: 'Le montant doit être supérieur à 0' });
    }

    // Récupérer l'utilisateur (expéditeur)
    const user = await User.findByPk(userId);
    if (!user) {
      console.log('❌ Utilisateur introuvable:', userId);
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    console.log('👤 Utilisateur trouvé:', user.nom, '- Solde actuel:', user.solde);

    // Vérifier que le compte est actif
    if (!user.isActive) {
      console.log('❌ Compte désactivé');
      return res.status(403).json({ message: 'Votre compte est désactivé' });
    }

    // Vérifier que l'utilisateur a assez d'argent
    if (parseFloat(user.solde) < amount) {
      console.log('❌ Solde insuffisant:', user.solde, '<', amount);
      return res.status(400).json({ 
        message: `Solde insuffisant. Votre solde actuel est de ${parseFloat(user.solde).toFixed(2)} €` 
      });
    }

    // Récupérer le bénéficiaire
    const beneficiaire = await Beneficiaire.findOne({
      where: { 
        id: beneficiaireId,
        userId: userId
      }
    });

    if (!beneficiaire) {
      console.log('❌ Bénéficiaire introuvable');
      return res.status(404).json({ 
        message: 'Bénéficiaire introuvable' 
      });
    }

    console.log('✅ Bénéficiaire trouvé:', beneficiaire.nom, '-', beneficiaire.iban, '- Statut:', beneficiaire.statut);

    // Vérifier que le bénéficiaire est validé
    if (beneficiaire.statut !== 'valide') {
      console.log('❌ Bénéficiaire non validé. Statut:', beneficiaire.statut);
      return res.status(403).json({ 
        message: `Ce bénéficiaire n'est pas encore validé. Statut actuel : ${beneficiaire.statut}` 
      });
    }

    // Créer la transaction de débit (retrait du compte de l'utilisateur)
    const transactionDebit = await Transaction.create({
      userId: userId,
      type: 'debit',
      montant: amount,
      description: description,
      beneficiaire: beneficiaire.nom,
      iban: beneficiaire.iban
    });

    console.log('✅ Transaction créée:', transactionDebit.id);

    // Mettre à jour le solde de l'utilisateur
    const newBalance = parseFloat(user.solde) - amount;
    await User.update(
      { solde: newBalance },
      { where: { id: user.id } }
    );

    console.log('✅ Nouveau solde:', newBalance.toFixed(2));
    console.log('🎉 Virement réussi !');

    // Réponse au client
    res.status(200).json({
      message: 'Virement effectué avec succès',
      virement: {
        montant: amount.toFixed(2),
        beneficiaire: beneficiaire.nom,
        iban: beneficiaire.iban,
        description: description,
        nouveauSolde: newBalance.toFixed(2),
        date: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du virement:', error);
    res.status(500).json({ 
      message: 'Erreur lors du virement',
      error: error.message 
    });
  }
});

module.exports = router;