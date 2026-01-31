// ========================================
// CONFIGURATION DE LA CONNEXION À MYSQL
// Compatible Railway avec MYSQL_URL
// ========================================

const { Sequelize } = require('sequelize');
require('dotenv').config();

// 🔍 DIAGNOSTIC COMPLET
console.log('\n🔍 DIAGNOSTIC DES VARIABLES D\'ENVIRONNEMENT:');
console.log('================================================');
console.log('MYSQL_URL =', process.env.MYSQL_URL ? 'défini ✅' : 'undefined ❌');
console.log('MYSQLHOST =', process.env.MYSQLHOST);
console.log('MYSQLPORT =', process.env.MYSQLPORT);
console.log('MYSQLDATABASE =', process.env.MYSQLDATABASE);
console.log('MYSQLUSER =', process.env.MYSQLUSER);
console.log('MYSQLPASSWORD =', process.env.MYSQLPASSWORD ? '*** (défini ✅)' : 'undefined ❌');
console.log('================================================\n');

let sequelize;

// ✅ STRATÉGIE 1 : Utiliser MYSQL_URL (RECOMMANDÉ - tout en un)
if (process.env.MYSQL_URL) {
  console.log('✅ Connexion via MYSQL_URL (Railway)');
  
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      freezeTableName: true
    }
  });
} 
// ⚠️ STRATÉGIE 2 : Utiliser variables individuelles
else {
  console.log('⚠️  Connexion via variables individuelles');
  
  const dbConfig = {
    host: process.env.MYSQLHOST || 'localhost',
    port: parseInt(process.env.MYSQLPORT) || 3306,
    database: process.env.MYSQLDATABASE || 'railway',
    username: process.env.MYSQLUSER || 'root',
    password: process.env.MYSQLPASSWORD || ''
  };

  console.log('📊 CONFIGURATION UTILISÉE:');
  console.log('Host:', dbConfig.host);
  console.log('Port:', dbConfig.port);
  console.log('Database:', dbConfig.database);
  console.log('User:', dbConfig.username);
  console.log('Password:', dbConfig.password ? '*** (défini ✅)' : 'VIDE ❌');
  console.log('\n');

  // ⚠️ ALERTE si pas de mot de passe
  if (!dbConfig.password) {
    console.log('⚠️⚠️⚠️  ATTENTION : Aucun mot de passe MySQL détecté !');
    console.log('➡️  Ajoutez la variable MYSQLPASSWORD dans Railway');
    console.log('➡️  OU utilisez MYSQL_URL à la place\n');
  }

  sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
      host: dbConfig.host,
      port: dbConfig.port,
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      define: {
        freezeTableName: true
      }
    }
  );
}

// Export
module.exports = sequelize;