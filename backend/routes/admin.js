// ========================================
// 👨‍💼 ROUTES ESPACE ADMINISTRATEUR
// ========================================

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiaire = require('../models/Beneficiaire');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// ========================================
// 📊 STATISTIQUES GLOBALES DU DASHBOARD
// ========================================
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    console.log('📊 Récupération des statistiques admin');
    console.log('👤 Demandé par userId:', req.userId, '- Type:', req.userType);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    // 1. Nombre total de clients
    const totalClients = await User.count({
      where: { userType: 'client' }
    });

    // 2. Nombre de clients actifs
    const clientsActifs = await User.count({
      where: { 
        userType: 'client',
        isActive: true
      }
    });

    // 3. Nombre total de transactions
    const totalTransactions = await Transaction.count();

    // 4. Volume total des transactions
    const transactions = await Transaction.findAll({
      attributes: ['type', 'montant']
    });

    let volumeCredits = 0;
    let volumeDebits = 0;

    transactions.forEach(t => {
      if (t.type === 'credit') {
        volumeCredits += parseFloat(t.montant);
      } else {
        volumeDebits += parseFloat(t.montant);
      }
    });

    const volumeTotal = volumeCredits + volumeDebits;

    // 5. Bénéficiaires en attente
    const beneficiairesEnAttente = await Beneficiaire.count({
      where: { statut: 'en_attente' }
    });

    // 6. Bénéficiaires validés aujourd'hui
    const aujourdhui = new Date(); // ✅ CORRIGÉ : Sans espace
    aujourdhui.setHours(0, 0, 0, 0);

    const beneficiairesValidesAujourdhui = await Beneficiaire.count({
      where: {
        statut: 'valide',
        dateValidation: {
          [Op.gte]: aujourdhui // ✅ CORRIGÉ
        }
      }
    });

    // 7. Transactions du jour
    const transactionsDuJour = await Transaction.count({
      where: {
        createdAt: {
          [Op.gte]: aujourdhui // ✅ CORRIGÉ
        }
      }
    });

    console.log('✅ Statistiques calculées');

    res.status(200).json({
      message: 'Statistiques récupérées',
      stats: {
        clients: {
          total: totalClients,
          actifs: clientsActifs,
          inactifs: totalClients - clientsActifs
        },
        transactions: {
          total: totalTransactions,
          aujourdhui: transactionsDuJour,
          volumeTotal: volumeTotal.toFixed(2),
          volumeCredits: volumeCredits.toFixed(2),
          volumeDebits: volumeDebits.toFixed(2)
        },
        beneficiaires: {
          enAttente: beneficiairesEnAttente,
          validesAujourdhui: beneficiairesValidesAujourdhui
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération stats admin:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 👥 LISTE DES BÉNÉFICIAIRES EN ATTENTE
// ========================================
router.get('/beneficiaires/attente', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Récupération des bénéficiaires en attente');

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const beneficiaires = await Beneficiaire.findAll({
      where: { statut: 'en_attente' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nom', 'email', 'telephone']
      }],
      order: [['dateDemande', 'ASC']]
    });

    console.log('✅ Bénéficiaires en attente trouvés:', beneficiaires.length);

    res.status(200).json({
      message: 'Bénéficiaires en attente récupérés',
      beneficiaires
    });

  } catch (error) {
    console.error('❌ Erreur récupération bénéficiaires en attente:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ✅ VALIDER UN BÉNÉFICIAIRE
// ========================================
router.put('/beneficiaires/:id/valider', authMiddleware, async (req, res) => {
  try {
    console.log('✅ Validation du bénéficiaire:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const beneficiaire = await Beneficiaire.findByPk(req.params.id);

    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    if (beneficiaire.statut !== 'en_attente') {
      return res.status(400).json({ 
        message: `Ce bénéficiaire a déjà été traité (statut: ${beneficiaire.statut})` 
      });
    }

    // Mettre à jour le statut
    beneficiaire.statut = 'valide';
    beneficiaire.dateValidation = new Date();
    beneficiaire.validePar = req.userId;
    await beneficiaire.save();

    console.log('✅ Bénéficiaire validé avec succès');

    res.status(200).json({
      message: 'Bénéficiaire validé avec succès',
      beneficiaire
    });

  } catch (error) {
    console.error('❌ Erreur validation bénéficiaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ❌ REFUSER UN BÉNÉFICIAIRE AVEC RAISON
// ========================================
router.put('/beneficiaires/:id/refuser', authMiddleware, async (req, res) => {
  try {
    console.log('❌ Refus du bénéficiaire:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { raison } = req.body;

    // ✅ VALIDATION : La raison est OBLIGATOIRE
    if (!raison || raison.trim() === '') {
      return res.status(400).json({ 
        message: 'Une raison de refus est obligatoire' 
      });
    }

    // ✅ Vérifier la longueur minimale (au moins 10 caractères)
    if (raison.trim().length < 10) {
      return res.status(400).json({ 
        message: 'La raison de refus doit contenir au moins 10 caractères' 
      });
    }

    const beneficiaire = await Beneficiaire.findByPk(req.params.id);

    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    if (beneficiaire.statut !== 'en_attente') {
      return res.status(400).json({ 
        message: `Ce bénéficiaire a déjà été traité (statut: ${beneficiaire.statut})` 
      });
    }

    // Mettre à jour le statut
    beneficiaire.statut = 'refuse';
    beneficiaire.dateValidation = new Date();
    beneficiaire.validePar = req.userId;
    beneficiaire.raisonRefus = raison.trim();

    await beneficiaire.save();

    console.log('✅ Bénéficiaire refusé avec raison:', raison.substring(0, 50) + '...');

    res.status(200).json({
      message: 'Bénéficiaire refusé',
      beneficiaire
    });

  } catch (error) {
    console.error('❌ Erreur refus bénéficiaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📋 LISTE DE TOUS LES BÉNÉFICIAIRES (TOUS STATUTS)
// ========================================
router.get('/beneficiaires/all', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Récupération de tous les bénéficiaires');

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { statut } = req.query; // Filtrer par statut si fourni

    const whereClause = statut ? { statut } : {};

    const beneficiaires = await Beneficiaire.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'email', 'telephone']
        },
        {
          model: User,
          as: 'validateur',
          attributes: ['id', 'nom', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Bénéficiaires trouvés:', beneficiaires.length);

    res.status(200).json({
      message: 'Bénéficiaires récupérés',
      beneficiaires
    });

  } catch (error) {
    console.error('❌ Erreur récupération bénéficiaires:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🔄 CHANGER LE STATUT D'UN BÉNÉFICIAIRE (RÉVERSIBLE)
// ========================================
router.put('/beneficiaires/:id/changer-statut', authMiddleware, async (req, res) => {
  try {
    console.log('🔄 Changement de statut du bénéficiaire:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { nouveauStatut, raison } = req.body;

    // Validation du statut
    const statutsValides = ['en_attente', 'valide', 'refuse'];
    if (!nouveauStatut || !statutsValides.includes(nouveauStatut)) {
      return res.status(400).json({ 
        message: 'Statut invalide. Valeurs autorisées : en_attente, valide, refuse' 
      });
    }

    // Si refusé, la raison est obligatoire
    if (nouveauStatut === 'refuse' && (!raison || raison.trim().length < 10)) {
      return res.status(400).json({ 
        message: 'Une raison de refus (min. 10 caractères) est obligatoire pour refuser un bénéficiaire' 
      });
    }

    const beneficiaire = await Beneficiaire.findByPk(req.params.id);

    if (!beneficiaire) {
      return res.status(404).json({ message: 'Bénéficiaire introuvable' });
    }

    const ancienStatut = beneficiaire.statut;

    // Mettre à jour le statut
    beneficiaire.statut = nouveauStatut;
    beneficiaire.dateValidation = new Date();
    beneficiaire.validePar = req.userId;

    if (nouveauStatut === 'refuse') {
      beneficiaire.raisonRefus = raison ? raison.trim() : null;
    } else {
      // Si on passe à validé ou en_attente, on efface la raison de refus
      beneficiaire.raisonRefus = null;
    }

    await beneficiaire.save();

    console.log(`✅ Statut changé : ${ancienStatut} → ${nouveauStatut}`);

    res.status(200).json({
      message: `Statut changé de "${ancienStatut}" à "${nouveauStatut}"`,
      beneficiaire
    });

  } catch (error) {
    console.error('❌ Erreur changement de statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// ========================================
// 👥 LISTE DE TOUS LES CLIENTS
// ========================================
router.get('/clients', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Récupération de tous les clients');
    console.log('👤 Demandé par userId:', req.userId, '- Type:', req.userType);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    // Récupérer le paramètre de recherche (optionnel)
    const { search } = req.query;

    // Construire la clause WHERE
    const whereClause = { userType: 'client' };

    // Si une recherche est fournie
    if (search && search.trim() !== '') {
      whereClause[Op.or] = [
        { nom: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { telephone: { [Op.like]: `%${search}%` } }
      ];
    }

    // Récupérer tous les clients
    const clients = await User.findAll({
      where: whereClause,
      attributes: ['id', 'nom', 'email', 'telephone', 'adresse', 'solde', 'isActive', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    console.log('✅ Clients trouvés:', clients.length);

    res.status(200).json({
      message: 'Clients récupérés avec succès',
      clients
    });

  } catch (error) {
    console.error('❌ Erreur récupération clients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 👤 DÉTAILS D'UN CLIENT (avec stats)
// ========================================
router.get('/clients/:id', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Récupération détails client:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const client = await User.findOne({
      where: { 
        id: req.params.id,
        userType: 'client'
      },
      attributes: ['id', 'nom', 'email', 'telephone', 'adresse', 'solde', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    // Récupérer les statistiques du client
    const totalTransactions = await Transaction.count({
      where: { userId: client.id }
    });

    const beneficiaires = await Beneficiaire.count({
      where: { userId: client.id }
    });

    const dernieresTransactions = await Transaction.findAll({
      where: { userId: client.id },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    console.log('✅ Détails client récupérés');

    res.status(200).json({
      message: 'Détails client récupérés',
      client: {
        ...client.toJSON(),
        stats: {
          totalTransactions,
          beneficiaires,
          dernieresTransactions
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération détails client:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 💰 MODIFIER LE SOLDE D'UN CLIENT
// ========================================
router.put('/clients/:id/solde', authMiddleware, async (req, res) => {
  try {
    console.log('💰 Modification solde client:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { montant, type, description } = req.body;

    // Validation
    if (!montant || !type || !description) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires (montant, type, description)' 
      });
    }

    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ 
        message: 'Le type doit être "credit" ou "debit"' 
      });
    }

    const amount = parseFloat(montant);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ 
        message: 'Le montant doit être supérieur à 0' 
      });
    }

    // Récupérer le client
    const client = await User.findOne({
      where: { 
        id: req.params.id,
        userType: 'client'
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const ancienSolde = parseFloat(client.solde);

    // Calculer le nouveau solde
    let nouveauSolde;
    if (type === 'credit') {
      nouveauSolde = ancienSolde + amount;
    } else {
      nouveauSolde = ancienSolde - amount;
      
      // Vérifier que le solde ne devient pas négatif
      if (nouveauSolde < 0) {
        return res.status(400).json({ 
          message: `Solde insuffisant. Solde actuel : ${ancienSolde.toFixed(2)} €` 
        });
      }
    }

    // Créer la transaction
    await Transaction.create({
      userId: client.id,
      type: type,
      montant: amount,
      description: `[Admin] ${description}`,
      beneficiaire: type === 'credit' ? 'Payone Banking (Admin)' : 'Retrait Admin',
      iban: null
    });

    // Mettre à jour le solde
    await User.update(
      { solde: nouveauSolde },
      { where: { id: client.id } }
    );

    console.log(`✅ Solde modifié : ${ancienSolde.toFixed(2)} → ${nouveauSolde.toFixed(2)}`);

    res.status(200).json({
      message: 'Solde modifié avec succès',
      client: {
        id: client.id,
        nom: client.nom,
        ancienSolde: ancienSolde.toFixed(2),
        nouveauSolde: nouveauSolde.toFixed(2),
        operation: type,
        montant: amount.toFixed(2)
      }
    });

  } catch (error) {
    console.error('❌ Erreur modification solde:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🔒 ACTIVER/DÉSACTIVER UN CLIENT
// ========================================
router.put('/clients/:id/toggle-status', authMiddleware, async (req, res) => {
  try {
    console.log('🔒 Changement statut client:', req.params.id);

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const client = await User.findOne({
      where: { 
        id: req.params.id,
        userType: 'client'
      }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    const ancienStatut = client.isActive;
    const nouveauStatut = !ancienStatut;

    // Mettre à jour le statut
    await User.update(
      { isActive: nouveauStatut },
      { where: { id: client.id } }
    );

    console.log(`✅ Statut changé : ${ancienStatut} → ${nouveauStatut}`);

    res.status(200).json({
      message: `Compte ${nouveauStatut ? 'activé' : 'désactivé'} avec succès`,
      client: {
        id: client.id,
        nom: client.nom,
        isActive: nouveauStatut
      }
    });

  } catch (error) {
    console.error('❌ Erreur changement statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;