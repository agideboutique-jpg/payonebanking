// ========================================
// 🦢 ROUTES ESPACE CLIENT
// ========================================

const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Beneficiaire = require('../models/Beneficiaire');
const authMiddleware = require('../middleware/auth');


// ========================================
// 📥 ROUTE GET PROFILE - COMPLÈTE
// ========================================

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('📥 GET /api/client/profile');
    console.log('👤 User ID:', req.userId);

    // Récupérer l'utilisateur avec TOUS les champs
    const user = await User.findByPk(req.userId);

    if (!user) {
      console.log('❌ Utilisateur introuvable');
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    if (!user.isActive) {
      console.log('❌ Compte désactivé');
      return res.status(403).json({ message: 'Votre compte est désactivé' });
    }

    // Créer un objet avec TOUS les champs (sauf le mot de passe)
    const userProfile = {
      id: user.id,
      
      // Infos personnelles
      nom: user.nom,
      prenom: user.prenom,
      dateNaissance: user.dateNaissance,
      lieuNaissance: user.lieuNaissance,
      nationalite: user.nationalite,
      numeroSecuriteSociale: user.numeroSecuriteSociale,
      situationFamiliale: user.situationFamiliale,
      
      // Coordonnées
      numeroRue: user.numeroRue,
      nomRue: user.nomRue,
      complementAdresse: user.complementAdresse,
      ville: user.ville,
      codePostal: user.codePostal,
      pays: user.pays,
      telephoneFixe: user.telephoneFixe,
      telephoneMobile: user.telephoneMobile,
      email: user.email,
      
      // Situation professionnelle
      statutProfessionnel: user.statutProfessionnel,
      revenusMensuels: user.revenusMensuels,
      typeContrat: user.typeContrat,
      
      // Système
      solde: user.solde,
      userType: user.userType,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      
      // Anciens champs (compatibilité)
      adresse: user.adresse,
      telephone: user.telephone
    };

    console.log('✅ Profil complet renvoyé');
    console.log('📊 Nombre de champs:', Object.keys(userProfile).length);

    res.status(200).json({
      message: 'Profil récupéré',
      user: userProfile
    });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
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

// ========================================
// 📝 ROUTE POUR METTRE À JOUR LE PROFIL
// À AJOUTER dans backend/routes/client.js
// ========================================

// ========================================
// ✏️ METTRE À JOUR LE PROFIL
// ========================================
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('✏️ PUT /api/client/profile');
    console.log('📦 Body:', req.body);
    
    const userId = req.userId;
    const {
      // Infos personnelles
      nom, prenom, dateNaissance, lieuNaissance, nationalite,
      numeroSecuriteSociale, situationFamiliale,
      // Coordonnées
      numeroRue, nomRue, complementAdresse, ville, codePostal, pays,
      telephoneFixe, telephoneMobile, email,
      // Situation pro
      statutProfessionnel, revenusMensuels, typeContrat
    } = req.body;

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Si l'email change, vérifier qu'il n'est pas déjà utilisé
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ 
        where: { 
          email,
          id: { [Op.ne]: userId } // Exclure l'utilisateur actuel
        } 
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          message: 'Cet email est déjà utilisé par un autre compte' 
        });
      }
    }

    // Préparer les données à mettre à jour
    const updateData = {};
    
    // Infos personnelles
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;
    if (dateNaissance) updateData.dateNaissance = dateNaissance;
    if (lieuNaissance) updateData.lieuNaissance = lieuNaissance;
    if (nationalite) updateData.nationalite = nationalite;
    if (numeroSecuriteSociale !== undefined) updateData.numeroSecuriteSociale = numeroSecuriteSociale;
    if (situationFamiliale) updateData.situationFamiliale = situationFamiliale;
    
    // Coordonnées
    if (numeroRue) updateData.numeroRue = numeroRue;
    if (nomRue) updateData.nomRue = nomRue;
    if (complementAdresse !== undefined) updateData.complementAdresse = complementAdresse;
    if (ville) updateData.ville = ville;
    if (codePostal) updateData.codePostal = codePostal;
    if (pays) updateData.pays = pays;
    if (telephoneFixe !== undefined) updateData.telephoneFixe = telephoneFixe;
    if (telephoneMobile) updateData.telephoneMobile = telephoneMobile;
    if (email) updateData.email = email;
    
    // Situation pro
    if (statutProfessionnel) updateData.statutProfessionnel = statutProfessionnel;
    if (revenusMensuels) updateData.revenusMensuels = revenusMensuels;
    if (typeContrat !== undefined) updateData.typeContrat = typeContrat;

    // Mettre à jour
    await user.update(updateData);

    console.log('✅ Profil mis à jour');

    // Retourner le profil mis à jour
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

// ========================================
// 🔒 CHANGER LE MOT DE PASSE
// ========================================
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    console.log('🔒 PUT /api/client/change-password');
    
    const userId = req.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Tous les champs sont obligatoires' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Les nouveaux mots de passe ne correspondent pas' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Vérifier la complexité
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);

    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        message: 'Le mot de passe doit contenir 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Vérifier l'ancien mot de passe
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Le mot de passe actuel est incorrect' 
      });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await user.update({ password: hashedPassword });

    console.log('✅ Mot de passe changé');

    res.status(200).json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({ 
      message: 'Erreur serveur',
      error: error.message 
    });
  }
});

module.exports = router;