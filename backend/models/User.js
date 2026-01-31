// ========================================
// 👤 MODÈLE UTILISATEUR - VERSION COMPLÈTE
// backend/models/User.js - REMPLACER COMPLÈTEMENT
// ========================================

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // ========================================
  // INFORMATIONS PERSONNELLES
  // ========================================
  nom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le nom est obligatoire' }
    }
  },
  
  prenom: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Le prénom est obligatoire' }
    }
  },
  
  dateNaissance: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'La date de naissance est obligatoire' },
      isDate: true
    }
  },
  
  lieuNaissance: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  nationalite: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  
  numeroSecuriteSociale: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  
  situationFamiliale: {
    type: DataTypes.ENUM('celibataire', 'marie', 'divorce', 'veuf', 'pacse', 'union_libre'),
    allowNull: false
  },
  
  // ========================================
  // COORDONNÉES
  // ========================================
  numeroRue: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  
  nomRue: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  complementAdresse: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  ville: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  codePostal: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  
  pays: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'France'
  },
  
  telephoneFixe: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  
  telephoneMobile: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  
  // ========================================
  // SITUATION PROFESSIONNELLE
  // ========================================
  statutProfessionnel: {
    type: DataTypes.ENUM('salarie', 'independant', 'retraite', 'etudiant', 'chomeur', 'autre'),
    allowNull: false
  },
  
  revenusMensuels: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  
  typeContrat: {
    type: DataTypes.ENUM('cdi', 'cdd', 'interim', 'stage', 'apprentissage', 'freelance', 'non_applicable'),
    allowNull: true
  },
  
  // ========================================
  // SÉCURITÉ
  // ========================================
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  solde: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  
  userType: {
    type: DataTypes.ENUM('client', 'admin'),
    allowNull: false,
    defaultValue: 'client'
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  
  // ========================================
  // ANCIENS CHAMPS (COMPATIBILITÉ)
  // ========================================
  adresse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  telephone: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
  
}, {
  tableName: 'users',
  timestamps: true,
  underscored: false,
  
  hooks: {
    beforeSave: (user) => {
      // Remplir l'adresse complète
      if (user.numeroRue && user.nomRue && user.ville && user.codePostal) {
        const parts = [
          user.numeroRue + ' ' + user.nomRue,
          user.complementAdresse,
          user.codePostal + ' ' + user.ville,
          user.pays
        ].filter(Boolean);
        user.adresse = parts.join(', ');
      }
      // Copier le mobile
      if (user.telephoneMobile) {
        user.telephone = user.telephoneMobile;
      }
    }
  }
});

module.exports = User;