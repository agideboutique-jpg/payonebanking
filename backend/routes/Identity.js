// ========================================
// 🆔 ROUTES VÉRIFICATION D'IDENTITÉ
// ========================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { IdentityVerification, User } = require('../models/index');
const authMiddleware = require('../middleware/auth');

// ========================================
// 📁 CONFIGURATION MULTER POUR UPLOAD
// ========================================

// Créer les dossiers s'ils n'existent pas
const uploadsDir = path.join(__dirname, '../../uploads');
const identityDocsDir = path.join(uploadsDir, 'identity-documents');
const profilePhotosDir = path.join(uploadsDir, 'profile-photos');

[uploadsDir, identityDocsDir, profilePhotosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuration du stockage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'photoProfile') {
      cb(null, profilePhotosDir);
    } else {
      cb(null, identityDocsDir);
    }
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtre pour accepter seulement les images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non autorisé. Utilisez JPG, JPEG, PNG ou WEBP.'));
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB max
  },
  fileFilter: fileFilter
});

// ========================================
// 📤 SOUMETTRE DES DOCUMENTS (CLIENT)
// ========================================
router.post('/submit', authMiddleware, upload.fields([
  { name: 'documentRecto', maxCount: 1 },
  { name: 'documentVerso', maxCount: 1 },
  { name: 'photoProfile', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📤 Soumission de documents d\'identité');
    console.log('👤 User ID:', req.userId);
    console.log('📦 Body:', req.body);
    console.log('📁 Files:', req.files);

    const { typeDocument } = req.body;
    const userId = req.userId;

    // Validation
    if (!typeDocument) {
      return res.status(400).json({ message: 'Le type de document est obligatoire' });
    }

    if (!['carte_identite', 'passeport', 'permis_conduire'].includes(typeDocument)) {
      return res.status(400).json({ message: 'Type de document invalide' });
    }

    // Vérifier les fichiers uploadés
    if (!req.files || !req.files.documentRecto || !req.files.photoProfile) {
      return res.status(400).json({ 
        message: 'Le document recto et la photo de profil sont obligatoires' 
      });
    }

    // Pour carte d'identité et permis, le verso est obligatoire
    if ((typeDocument === 'carte_identite' || typeDocument === 'permis_conduire') && !req.files.documentVerso) {
      return res.status(400).json({ 
        message: 'Le verso du document est obligatoire pour ce type de document' 
      });
    }

    // Vérifier si l'utilisateur a déjà une vérification en attente
    const existingVerification = await IdentityVerification.findOne({
      where: { 
        userId,
        statut: 'en_attente'
      }
    });

    if (existingVerification) {
      return res.status(400).json({ 
        message: 'Vous avez déjà une demande de vérification en attente' 
      });
    }

    // Créer la vérification
    const verification = await IdentityVerification.create({
      userId,
      typeDocument,
      documentRecto: req.files.documentRecto[0].filename,
      documentVerso: req.files.documentVerso ? req.files.documentVerso[0].filename : null,
      photoProfile: req.files.photoProfile[0].filename,
      statut: 'en_attente',
      dateSoumission: new Date()
    });

    console.log('✅ Vérification créée:', verification.id);

    res.status(201).json({
      message: 'Documents soumis avec succès. En attente de validation par un administrateur.',
      verification: {
        id: verification.id,
        typeDocument: verification.typeDocument,
        statut: verification.statut,
        dateSoumission: verification.dateSoumission
      }
    });

  } catch (error) {
    console.error('❌ Erreur soumission documents:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la soumission des documents',
      error: error.message 
    });
  }
});

// ========================================
// 📋 STATUT DE VÉRIFICATION (CLIENT)
// ========================================
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    const verification = await IdentityVerification.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    if (!verification) {
      return res.status(200).json({
        message: 'Aucune vérification trouvée',
        hasVerification: false
      });
    }

    res.status(200).json({
      message: 'Statut de vérification récupéré',
      hasVerification: true,
      verification: {
        id: verification.id,
        typeDocument: verification.typeDocument,
        statut: verification.statut,
        dateSoumission: verification.dateSoumission,
        dateValidation: verification.dateValidation,
        raisonRefus: verification.raisonRefus,
        commentaireAdmin: verification.commentaireAdmin
      }
    });

  } catch (error) {
    console.error('❌ Erreur récupération statut:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📋 LISTE DES VÉRIFICATIONS EN ATTENTE (ADMIN)
// ========================================
router.get('/admin/pending', authMiddleware, async (req, res) => {
  try {
    console.log('📋 Récupération des vérifications en attente');

    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const verifications = await IdentityVerification.findAll({
      where: { statut: 'en_attente' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nom', 'email', 'telephone']
      }],
      order: [['dateSoumission', 'ASC']]
    });

    console.log('✅ Vérifications en attente:', verifications.length);

    res.status(200).json({
      message: 'Vérifications en attente récupérées',
      verifications
    });

  } catch (error) {
    console.error('❌ Erreur récupération vérifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 📋 TOUTES LES VÉRIFICATIONS (ADMIN)
// ========================================
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { statut } = req.query;
    const whereClause = statut ? { statut } : {};

    const verifications = await IdentityVerification.findAll({
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
          attributes: ['id', 'nom'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      message: 'Vérifications récupérées',
      verifications
    });

  } catch (error) {
    console.error('❌ Erreur récupération vérifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ✅ VALIDER UNE VÉRIFICATION (ADMIN)
// ========================================
router.put('/admin/:id/validate', authMiddleware, async (req, res) => {
  try {
    console.log('✅ Validation de la vérification:', req.params.id);

    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { commentaireAdmin } = req.body;

    const verification = await IdentityVerification.findByPk(req.params.id);

    if (!verification) {
      return res.status(404).json({ message: 'Vérification introuvable' });
    }

    if (verification.statut !== 'en_attente') {
      return res.status(400).json({ 
        message: `Cette vérification a déjà été traitée (statut: ${verification.statut})` 
      });
    }

    verification.statut = 'valide';
    verification.dateValidation = new Date();
    verification.validePar = req.userId;
    verification.commentaireAdmin = commentaireAdmin || null;
    await verification.save();

    console.log('✅ Vérification validée');

    res.status(200).json({
      message: 'Vérification validée avec succès',
      verification
    });

  } catch (error) {
    console.error('❌ Erreur validation:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// ❌ REFUSER UNE VÉRIFICATION (ADMIN)
// ========================================
router.put('/admin/:id/reject', authMiddleware, async (req, res) => {
  try {
    console.log('❌ Refus de la vérification:', req.params.id);

    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé : Administrateur requis' });
    }

    const { raisonRefus, commentaireAdmin } = req.body;

    if (!raisonRefus || raisonRefus.trim().length < 10) {
      return res.status(400).json({ 
        message: 'Une raison de refus (min. 10 caractères) est obligatoire' 
      });
    }

    const verification = await IdentityVerification.findByPk(req.params.id);

    if (!verification) {
      return res.status(404).json({ message: 'Vérification introuvable' });
    }

    if (verification.statut !== 'en_attente') {
      return res.status(400).json({ 
        message: `Cette vérification a déjà été traitée (statut: ${verification.statut})` 
      });
    }

    verification.statut = 'refuse';
    verification.dateValidation = new Date();
    verification.validePar = req.userId;
    verification.raisonRefus = raisonRefus.trim();
    verification.commentaireAdmin = commentaireAdmin || null;
    await verification.save();

    console.log('✅ Vérification refusée');

    res.status(200).json({
      message: 'Vérification refusée',
      verification
    });

  } catch (error) {
    console.error('❌ Erreur refus:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ========================================
// 🖼️ SERVIR LES IMAGES (ADMIN)
// ========================================
router.get('/admin/image/:folder/:filename', authMiddleware, (req, res) => {
  try {
    if (req.userType !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const { folder, filename } = req.params;
    const filePath = path.join(uploadsDir, folder, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Image introuvable' });
    }

    res.sendFile(filePath);

  } catch (error) {
    console.error('❌ Erreur récupération image:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;