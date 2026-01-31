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

// ✅ STRATÉGIE 1 : Parser MYSQL_URL manuellement (RECOMMANDÉ pour Railway)
if (process.env.MYSQL_URL) {
  console.log('✅ Connexion via MYSQL_URL (Railway)');
  
  try {
    // Parser l'URL MySQL manuellement
    // Format: mysql://user:password@host:port/database
    const url = new URL(process.env.MYSQL_URL);
    
    const dbConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      database: url.pathname.replace('/', ''),
      username: url.username,
      password: url.password
    };
    
    console.log('📊 CONFIGURATION PARSÉE:');
    console.log('Host:', dbConfig.host);
    console.log('Port:', dbConfig.port);
    console.log('Database:', dbConfig.database);
    console.log('User:', dbConfig.username);
    console.log('Password:', dbConfig.password ? '*** (masqué)' : 'VIDE');
    console.log('\n');
    
    // Créer l'instance Sequelize avec les paramètres extraits
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          connectTimeout: 60000, // 60 secondes
          ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
          } : false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 60000,  // Augmenté à 60 secondes
          idle: 10000
        },
        define: {
          freezeTableName: true
        }
      }
    );
  } catch (error) {
    console.error('❌ ERREUR lors du parsing de MYSQL_URL:', error.message);
    console.log('⚠️  Basculement sur les variables individuelles...\n');
    
    // Fallback sur les variables individuelles
    const dbConfig = {
      host: process.env.MYSQLHOST || 'localhost',
      port: parseInt(process.env.MYSQLPORT) || 3306,
      database: process.env.MYSQLDATABASE || 'railway',
      username: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || ''
    };
    
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        logging: false,
        dialectOptions: {
          connectTimeout: 60000,
          ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: false
          } : false
        },
        pool: {
          max: 5,
          min: 0,
          acquire: 60000,
          idle: 10000
        },
        define: {
          freezeTableName: true
        }
      }
    );
  }
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
      dialectOptions: {
        connectTimeout: 60000,
        ssl: process.env.NODE_ENV === 'production' ? {
          rejectUnauthorized: false
        } : false
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 60000,
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