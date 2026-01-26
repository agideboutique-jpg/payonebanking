// ========================================
// 👥 ROUTES GESTION DES BÉNÉFICIAIRES
// ========================================

const express = require('express');
const router = express.Router();
const Beneficiaire = require('../models/Beneficiaire');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// ========================================
// 📋 LISTE DES BÉNÉFICIAIRES DU CLIENT
// ========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const beneficiaires = await Beneficiaire.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });

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
// ➕ AJOUTER UN BÉNÉFICIAIRE
// ========================================
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { nom, iban } = req.body;

    // Validations
    if (!nom || !iban) {
      return res.status(400).json({ 
        message: 'Le nom et l\'IBAN sont obligatoires' 
      });
    }

    // Nettoyer l'IBAN (enlever les espaces)
    const ibanCleaned = iban.replace(/\s/g, '').toUpperCase();

    // Vérifier le format basique de l'IBAN
    if (ibanCleaned.length < 15 || ibanCleaned.length > 34) {
      return res.status(400).json({ 
        message: 'Format d\'IBAN invalide (15-34 caractères)' 
      });
    }

    // Vérifier que l'IBAN n'est pas déjà enregistré pour cet utilisateur
    const existingBenef = await Beneficiaire.findOne({
      where: { 
        userId: req.userId,
        iban: ibanCleaned
      }
    });

    if (existingBenef) {
      return res.status(400).json({ 
        message: 'Cet IBAN est déjà enregistré dans vos bénéficiaires' 
      });
    }

    // Créer le bénéficiaire
    const beneficiaire = await Beneficiaire.create({
      userId: req.userId,
      nom,
      iban: ibanCleaned,
      statut: 'en_attente',
      dateDemande: new Date()
    });

    console.log('✅ Bénéficiaire créé:', beneficiaire.nom, '-', beneficiaire.iban);

    res.status(201).json({
      message: 'Bénéficiaire ajouté avec succès. Il sera validé dans 24h ou par un administrateur.',
      beneficiaire
    });

  } catch (error) {
    console.error('❌ Erreur ajout bénéficiaire:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// ========================================
// 🗑️ SUPPRIMER UN BÉNÉFICIAIRE
// ========================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const beneficiaire = await Beneficiaire.findOne({
      where: { 
        id: req.params.id,
        userId: req.userId // Vérifier que c'est bien son bénéficiaire
      }
    });

    if (!beneficiaire) {
      return res.status(404).json({ 
        message: 'Bénéficiaire introuvable' 
      });
    }

    await beneficiaire.destroy();

    res.status(200).json({
      message: 'Bénéficiaire supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur suppression bénéficiaire:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ✅ LISTE DES BÉNÉFICIAIRES VALIDÉS (pour virements)
// ========================================
router.get('/valides', authMiddleware, async (req, res) => {
  try {
    const beneficiaires = await Beneficiaire.findAll({
      where: { 
        userId: req.userId,
        statut: 'valide'
      },
      order: [['nom', 'ASC']]
    });

    res.status(200).json({
      message: 'Bénéficiaires validés récupérés',
      beneficiaires
    });

  } catch (error) {
    console.error('❌ Erreur récupération bénéficiaires validés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;