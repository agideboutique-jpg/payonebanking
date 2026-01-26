// ========================================
// 👨‍💼 CRÉER UN COMPTE ADMINISTRATEUR
// ========================================

const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

async function createAdmin() {
  try {
    // Connexion à la BDD
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');

    // Mot de passe à hasher
    const plainPassword = 'Admin2025!';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    console.log('\n🔐 Mot de passe hashé:', hashedPassword);

    // Requête SQL
    const query = `
      INSERT INTO users (nom, email, telephone, adresse, password, solde, userType, isActive, createdAt, updatedAt)
      VALUES (
        'Administrateur Payone',
        'admin@payonebank.com',
        '+229 97 00 00 00',
        'Siège Payone Banking, Cotonou, Bénin',
        :hashedPassword,
        0.00,
        'admin',
        1,
        NOW(),
        NOW()
      )
    `;

    await sequelize.query(query, {
      replacements: { hashedPassword }
    });

    console.log('\n✅ Compte administrateur créé avec succès !');
    console.log('\n📧 Email    : admin@payonebank.com');
    console.log('🔑 Password : Admin2025!');
    console.log('\n⚠️  IMPORTANT : Changez ce mot de passe après la première connexion !');

    await sequelize.close();

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('❌ Un administrateur avec cet email existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
    }
    process.exit(1);
  }
}

createAdmin();