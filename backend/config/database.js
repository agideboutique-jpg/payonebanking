// ========================================
// CONFIGURATION DE LA CONNEXION À MYSQL
// ========================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// Création de l'instance Sequelize pour se connecter à MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,      // Nom de la base : payonebank
  process.env.DB_USER,      // Utilisateur : root
  process.env.DB_PASSWORD,  // Mot de passe : (vide)
  {
    host: process.env.DB_HOST,     // localhost
    port: process.env.DB_PORT || 3306,     // 3306
    dialect: 'mysql',              // On utilise MySQL
    logging: console.log,                // Mettre true pour voir les requêtes SQL
    
    // Configuration du pool de connexions
    pool: {
      max: 5,        // Maximum 5 connexions simultanées
      min: 0,        // Minimum 0 connexion
      acquire: 30000, // Timeout de 30 secondes
      idle: 10000    // Ferme après 10 secondes d'inactivité
    },
    
    // Options pour éviter les warnings
    define: {
      freezeTableName: true  // Ne pas pluraliser les noms de tables
    }
  }
);

// Export direct de l'instance sequelize
module.exports = sequelize;