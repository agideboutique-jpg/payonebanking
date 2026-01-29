// ========================================
// 🆔 MODÈLE VÉRIFICATION D'IDENTITÉ
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const IdentityVerification = sequelize.define('IdentityVerification', {
  
  // ID unique
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ID de l'utilisateur
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Type de document
  typeDocument: {
    type: DataTypes.ENUM('carte_identite', 'passeport', 'permis_conduire'),
    allowNull: false
  },
  
  // Chemin du document recto (ou document unique pour passeport)
  documentRecto: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Chemin du document verso (seulement pour carte identité et permis)
  documentVerso: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Chemin de la photo de profil
  photoProfile: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  
  // Statut de la vérification
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'refuse'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  
  // Date de soumission
  dateSoumission: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Date de validation/refus
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // ID de l'admin qui a validé/refusé
  validePar: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Raison du refus
  raisonRefus: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Commentaire de l'admin
  commentaireAdmin: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  
}, {
  tableName: 'identity_verifications',
  timestamps: true,
  underscored: false
});

module.exports = IdentityVerification;