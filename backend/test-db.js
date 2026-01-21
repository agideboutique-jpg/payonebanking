// ========================================
// FICHIER DE TEST DE CONNEXION À MYSQL
// ========================================

require('dotenv').config();
const { connectDB } = require('./config/database');
const { User, Transaction } = require('./models');

// Fonction de test
async function testDatabase() {
  try {
    console.log('🔄 Test de connexion à MySQL...\n');
    
    // 1. Connexion à la base de données
    await connectDB();
    
    console.log('\n📊 Vérification des modèles...');
    
    // 2. Compter les utilisateurs
    const userCount = await User.count();
    console.log(`   👥 Utilisateurs dans la base : ${userCount}`);
    
    // 3. Compter les transactions
    const transactionCount = await Transaction.count();
    console.log(`   💳 Transactions dans la base : ${transactionCount}`);
    
    console.log('\n🎉 Configuration MySQL réussie !');
    console.log('✅ Tout fonctionne parfaitement !\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message);
    console.error('\n🔧 Vérifiez :');
    console.error('   1. WAMP est démarré (icône verte)');
    console.error('   2. La base "payonebank" existe dans phpMyAdmin');
    console.error('   3. Le fichier .env est correct\n');
    process.exit(1);
  }
}

// Lancer le test
testDatabase();