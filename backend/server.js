// ========================================
// SERVEUR PRINCIPAL DE L'APPLICATION
// ========================================


require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import de Sequelize ET des modèles
const { sequelize, User, Transaction, Beneficiaire } = require('./models/index');

// Initialisation de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// 👇 CES 2 LIGNES DOIVENT ÊTRE LÀ
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes codes de transaction
app.use('/api/transaction-codes', require('./routes/transaction-code'));

// ========================================
// MIDDLEWARES (ORDRE IMPORTANT !)
// ========================================

// 1. CORS en premier
app.use(cors());

// 2. Body Parser AVANT les routes (CRUCIAL !)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// 3. Logger les requêtes (pour debug)
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📦 Body reçu:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// 4. Servir les fichiers statiques (HTML, CSS, JS, images)
app.use(express.static(path.join(__dirname, '..')));

// ========================================
// ROUTES DE TEST
// ========================================

// Route principale - Test que le serveur fonctionne
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🏦 API PayOne Bank - Serveur opérationnel',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      client: '/api/client',
      admin: '/api/admin'
    }
  });
});

// Route de santé - Vérifier que tout fonctionne
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur en bonne santé',
    timestamp: new Date().toISOString(),
    database: 'MySQL connecté'
  });
});

// ========================================
// ROUTES DE L'APPLICATION
// ========================================

// Routes d'authentification
app.use('/api/auth', require('./routes/auth'));

// Routes client
    app.use('/api/client', require('./routes/client'));

// Routes bénéficiaires
    app.use('/api/beneficiaires', require('./routes/beneficiaire'));

// ✅ AJOUTER CETTE LIGNE - Routes admin
app.use('/api/admin', require('./routes/admin'));

// Routes admin (à créer)
// app.use('/api/admin', require('./routes/admin'));

// ========================================
// GESTION DES ERREURS 404
// ========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    requestedUrl: req.originalUrl
  });
});

// ========================================
// GESTION DES ERREURS SERVEUR
// ========================================

app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ========================================
// DÉMARRAGE DU SERVEUR
// ========================================

const startServer = async () => {
  try {
    // 1. Connexion à la base de données
    await sequelize.authenticate();
    console.log('✅ MySQL connecté avec succès à la base', process.env.DB_NAME);
    
    // 2. Synchroniser les modèles avec la base de données
    await sequelize.sync(); // Mode normal
    console.log('✅ Tables synchronisées');
    
    // 3. Démarrage du serveur
    app.listen(PORT, () => {
      console.log('\n========================================');
      console.log('🏦  PAYONE BANKING - SERVEUR DÉMARRÉ');
      console.log('========================================');
      console.log(`🌐  URL: http://localhost:${PORT}`);
      console.log(`📡  API: http://localhost:${PORT}/api`);
      console.log(`🗄️  Base de données: ${process.env.DB_NAME} (MySQL)`);
      console.log('========================================');
      console.log('\n✅  Serveur prêt à recevoir des requêtes');
      console.log('📋  Routes disponibles:');
      console.log('     - GET  /api');
      console.log('     - GET  /api/health');
      console.log('     - POST /api/auth/register');
      console.log('     - POST /api/auth/login');
      console.log('\n⏹️   Appuyez sur Ctrl+C pour arrêter\n');
    });
    
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error.message);
    process.exit(1);
  }
};

// Lancer le serveur
startServer();