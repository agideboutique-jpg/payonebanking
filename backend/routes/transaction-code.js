// ========================================
// 🔐 ROUTES GESTION DES CODES DE TRANSACTION
// ========================================

const express = require('express');
const router = express.Router();
const { TransactionCode, User } = require('../models/index');
const authMiddleware = require('../middleware/auth');
const { Op } = require('sequelize');

// ========================================
// 🎲 GÉNÉRER UN CODE (ADMIN UNIQUEMENT)
// ========================================
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    console.log('🔐 Génération d\'un code de transaction');

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { userId, dureeMinutes = 10 } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ message: 'ID du client requis' });
    }

    // Vérifier que le client existe
    const client = await User.findOne({
      where: { id: userId, userType: 'client' }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable' });
    }

    // Générer un code à 6 chiffres aléatoire
    let code;
    let codeExiste = true;

    while (codeExiste) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await TransactionCode.findOne({ where: { code } });
      codeExiste = !!existing;
    }

    // Calculer la date d'expiration
    const dateExpiration = new Date();
    dateExpiration.setMinutes(dateExpiration.getMinutes() + parseInt(dureeMinutes));

    // Créer le code
    const transactionCode = await TransactionCode.create({
      code,
      userId,
      generePar: req.userId,
      statut: 'actif',
      dateExpiration
    });

    console.log(`✅ Code généré : ${code} pour ${client.nom} (expire dans ${dureeMinutes} min)`);

    res.status(201).json({
      message: 'Code généré avec succès',
      code: {
        code: transactionCode.code,
        client: {
          id: client.id,
          nom: client.nom,
          email: client.email
        },
        dateExpiration: transactionCode.dateExpiration,
        dureeMinutes: dureeMinutes
      }
    });

  } catch (error) {
    console.error('❌ Erreur génération code:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ✅ VALIDER UN CODE (CLIENT)
// ========================================
router.post('/validate', authMiddleware, async (req, res) => {
  try {
    console.log('🔍 Validation d\'un code de transaction');

    const { code } = req.body;
    const userId = req.userId;

    // Validation
    if (!code || code.length !== 6) {
      return res.status(400).json({ message: 'Code invalide (6 chiffres requis)' });
    }

    // Chercher le code
    const transactionCode = await TransactionCode.findOne({
      where: { 
        code,
        userId,
        statut: 'actif'
      }
    });

    if (!transactionCode) {
      console.log('❌ Code introuvable ou déjà utilisé');
      return res.status(404).json({ message: 'Code invalide ou déjà utilisé' });
    }

    // Vérifier l'expiration
    const now = new Date();
    if (now > transactionCode.dateExpiration) {
      console.log('❌ Code expiré');
      transactionCode.statut = 'expire';
      await transactionCode.save();
      return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code à votre administrateur.' });
    }

    console.log(`✅ Code valide : ${code}`);

    res.status(200).json({
      message: 'Code valide',
      codeId: transactionCode.id,
      expiresIn: Math.floor((transactionCode.dateExpiration - now) / 1000) // Secondes restantes
    });

  } catch (error) {
    console.error('❌ Erreur validation code:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📋 LISTE DES CODES (ADMIN)
// ========================================
router.get('/list', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Récupération liste des codes');

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { statut, userId } = req.query;

    // Construire la clause WHERE
    const whereClause = {};
    if (statut) whereClause.statut = statut;
    if (userId) whereClause.userId = userId;

    const codes = await TransactionCode.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'client',
          attributes: ['id', 'nom', 'email']
        },
        {
          model: User,
          as: 'administrateur',
          attributes: ['id', 'nom']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    console.log(`✅ ${codes.length} codes récupérés`);

    res.status(200).json({
      message: 'Codes récupérés',
      codes
    });

  } catch (error) {
    console.error('❌ Erreur récupération codes:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🗑️ RÉVOQUER UN CODE (ADMIN)
// ========================================
router.put('/:id/revoke', authMiddleware, async (req, res) => {
  try {
    console.log('🗑️ Révocation d\'un code');

    // Vérifier que c'est bien un admin
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const code = await TransactionCode.findByPk(req.params.id);

    if (!code) {
      return res.status(404).json({ message: 'Code introuvable' });
    }

    if (code.statut !== 'actif') {
      return res.status(400).json({ message: 'Ce code n\'est plus actif' });
    }

    code.statut = 'expire';
    await code.save();

    console.log(`✅ Code ${code.code} révoqué`);

    res.status(200).json({
      message: 'Code révoqué avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur révocation code:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;