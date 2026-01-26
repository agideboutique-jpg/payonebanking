// ========================================
// 👥 MODÈLE BÉNÉFICIAIRE (IBAN)
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Beneficiaire = sequelize.define('Beneficiaire', {
  
  // ID unique
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ID du client propriétaire
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Nom du bénéficiaire
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Le nom du bénéficiaire est obligatoire'
      }
    }
  },
  
  // IBAN du bénéficiaire
  iban: {
    type: DataTypes.STRING(34),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'L\'IBAN est obligatoire'
      },
      len: {
        args: [15, 34],
        msg: 'L\'IBAN doit contenir entre 15 et 34 caractères'
      }
    }
  },
  
  // Statut de validation
  statut: {
    type: DataTypes.ENUM('en_attente', 'valide', 'refuse'),
    allowNull: false,
    defaultValue: 'en_attente'
  },
  
  // Date de demande
  dateDemande: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  // Date de validation (automatique ou manuelle)
  dateValidation: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // ID de l'admin qui a validé/refusé (null si validation automatique)
  validePar: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Raison du refus (optionnel)
  raisonRefus: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  
}, {
  tableName: 'beneficiaires',
  timestamps: true,
  underscored: false
});

module.exports = Beneficiaire;