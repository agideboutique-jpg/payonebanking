// ========================================
// CONFIGURATION DE LA CONNEXION À MYSQL
// Compatible avec Railway
// ========================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// 🔍 DIAGNOSTIC - Afficher toutes les variables Railway
console.log('\n🔍 DIAGNOSTIC DES VARIABLES D\'ENVIRONNEMENT:');
console.log('================================================');

// Variables Railway MySQL (automatiques)
console.log('MYSQLHOST =', process.env.MYSQLHOST);
console.log('MYSQLPORT =', process.env.MYSQLPORT);
console.log('MYSQLDATABASE =', process.env.MYSQLDATABASE);
console.log('MYSQLUSER =', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD =', process.env.MYSQLPASSWORD ? '***' : 'undefined');
console.log('MYSQL_URL =', process.env.MYSQL_URL ? 'défini' : 'undefined');

// Variables personnalisées (si configurées)
console.log('DB_HOST =', process.env.DB_HOST);
console.log('DB_PORT =', process.env.DB_PORT);
console.log('DB_NAME =', process.env.DB_NAME);
console.log('DB_USER =', process.env.DB_USER);
console.log('DB_PASSWORD =', process.env.DB_PASSWORD ? '***' : 'undefined');
console.log('================================================\n');

// 🎯 STRATÉGIE : Utiliser Railway variables OU variables personnalisées
const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'payonebank',
  username: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || ''
};

console.log('📊 CONFIGURATION FINALE:');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('Database:', dbConfig.database);
console.log('User:', dbConfig.username);
console.log('Password:', dbConfig.password ? '***' : 'vide');
console.log('\n');

// Création de l'instance Sequelize
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'mysql',
    logging: false, // Mettre true pour voir les requêtes SQL
    
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