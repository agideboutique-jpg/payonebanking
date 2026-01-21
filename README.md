# 🏦 Payone Banking - Application de Banque en Ligne

![Status](https://img.shields.io/badge/status-en%20développement-yellow)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MySQL](https://img.shields.io/badge/database-MySQL-blue)

Une application web complète de banque en ligne développée avec Node.js, Express et MySQL.

---

## 📋 Table des matières

- [À propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Structure du projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Roadmap](#-roadmap)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎯 À propos

**Payone Banking** est une application de banque en ligne qui permet aux utilisateurs de :
- Créer un compte bancaire
- Se connecter de manière sécurisée
- Consulter leur solde
- Effectuer des virements
- Gérer leurs bénéficiaires

Les administrateurs peuvent gérer l'ensemble des clients et des transactions via un espace d'administration dédié.

---

## ✨ Fonctionnalités

### 👤 Espace Client
- ✅ Inscription avec validation des données
- ✅ Connexion sécurisée (JWT)
- 🚧 Dashboard avec solde et transactions récentes
- 🚧 Historique complet des transactions
- 🚧 Effectuer des virements
- 🚧 Gestion des bénéficiaires (IBAN)
- 🚧 Modification du profil
- 🚧 Téléchargement de relevés bancaires (PDF)

### 👨‍💼 Espace Administrateur
- 🚧 Connexion admin sécurisée
- 🚧 Dashboard avec statistiques
- 🚧 Liste et gestion des clients
- 🚧 Modification des soldes
- 🚧 Activation/Désactivation de comptes
- 🚧 Vue globale des transactions
- 🚧 Génération de rapports

**Légende :** ✅ Terminé | 🚧 En cours | ⏳ À venir

---

## 🛠️ Technologies utilisées

### Backend
- **Node.js** - Environnement d'exécution JavaScript
- **Express.js** - Framework web
- **MySQL** - Base de données relationnelle
- **Sequelize** - ORM pour MySQL
- **JWT** - Authentification par tokens
- **bcrypt** - Hashage des mots de passe
- **dotenv** - Gestion des variables d'environnement
- **helmet** - Sécurité HTTP
- **cors** - Gestion des requêtes cross-origin

### Frontend
- **HTML5 / CSS3** - Structure et design
- **JavaScript (Vanilla)** - Interactivité
- **Fetch API** - Communication avec le backend

### Outils de développement
- **Nodemon** - Auto-reload du serveur
- **WAMP64** - Serveur MySQL local (Windows)

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** (v18 ou supérieur) - [Télécharger](https://nodejs.org/)
- **MySQL** (via WAMP, XAMPP, ou installation standalone) - [Télécharger WAMP](https://www.wampserver.com/)
- **Git** (optionnel) - [Télécharger](https://git-scm.com/)

---

## 🚀 Installation

### 1️⃣ Cloner le repository
```bash
git clone https://github.com/agideboutique-jpg/payonebanking.git
cd payonebanking
```

### 2️⃣ Installer les dépendances
```bash
npm install
```

### 3️⃣ Créer la base de données

Ouvrez **phpMyAdmin** (via WAMP) ou votre client MySQL et créez la base de données :
```sql
CREATE DATABASE payonebank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4️⃣ Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :
```bash
touch .env
```

Ajoutez-y les variables suivantes :
```env
# Base de données
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=payonebank

# JWT
JWT_SECRET=votre_secret_jwt_super_securise_a_changer

# Serveur
PORT=5000
NODE_ENV=development
```

⚠️ **Important** : Changez `JWT_SECRET` par une chaîne aléatoire sécurisée !

### 5️⃣ Démarrer le serveur
```bash
npm run dev
```

Le serveur démarre sur **http://localhost:5000** 🎉

---

## ⚙️ Configuration

### Variables d'environnement

| Variable | Description | Valeur par défaut |
|----------|-------------|-------------------|
| `DB_HOST` | Hôte MySQL | `localhost` |
| `DB_USER` | Utilisateur MySQL | `root` |
| `DB_PASSWORD` | Mot de passe MySQL | *(vide)* |
| `DB_NAME` | Nom de la base de données | `payonebank` |
| `JWT_SECRET` | Clé secrète pour JWT | *(à définir)* |
| `PORT` | Port du serveur | `5000` |
| `NODE_ENV` | Environnement | `development` |

---

## 💻 Utilisation

### Démarrer l'application
```bash
# Mode développement (avec auto-reload)
npm run dev

# Mode production
npm start
```

### Accéder à l'application

- **Page d'accueil** : http://localhost:5000
- **Inscription client** : http://localhost:5000/sign-up.html
- **Connexion client** : http://localhost:5000/log-in.html
- **Dashboard client** : http://localhost:5000/dashboard.html
- **Connexion admin** : http://localhost:5000/admin-login.html *(à venir)*

### Créer un compte administrateur

Pour créer un compte admin, vous devez modifier directement la base de données :
```sql
UPDATE users SET userType = 'admin' WHERE email = 'votre@email.com';
```

---

## 📂 Structure du projet
```
payone/
├── backend/
│   ├── server.js                 # Serveur Express principal
│   ├── config/
│   │   └── database.js           # Configuration Sequelize
│   ├── routes/
│   │   ├── auth.js               # Routes d'authentification
│   │   ├── client.js             # Routes espace client
│   │   └── admin.js              # Routes espace admin
│   ├── models/
│   │   ├── User.js               # Modèle utilisateur
│   │   └── Transaction.js        # Modèle transaction
│   └── middleware/
│       └── auth.js               # Middleware JWT
├── assets/
│   ├── css/                      # Fichiers CSS du thème
│   ├── js/
│   │   ├── auth.js               # Frontend : authentification
│   │   ├── client.js             # Frontend : espace client
│   │   └── admin.js              # Frontend : espace admin
│   └── images/                   # Images du thème
├── sign-up.html                  # Page d'inscription
├── log-in.html                   # Page de connexion
├── dashboard.html                # Dashboard client
├── my-profile.html               # Profil client
├── package.json                  # Dépendances npm
├── .env                          # Variables d'environnement
├── .gitignore                    # Fichiers ignorés par Git
└── README.md                     # Documentation
```

---

## 🌐 API Endpoints

### Authentification

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| POST | `/api/auth/register` | Inscription client | ❌ |
| POST | `/api/auth/login` | Connexion | ❌ |

#### Exemple : Inscription

**Request :**
```json
POST /api/auth/register
{
  "nom": "John Doe",
  "email": "john@example.com",
  "telephone": "0612345678",
  "adresse": "123 Rue de la Paix, Paris",
  "password": "motdepasse123"
}
```

**Response :**
```json
{
  "message": "Inscription réussie",
  "userId": 1
}
```

### Client (à venir)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| GET | `/api/client/profile` | Récupérer le profil | ✅ |
| PUT | `/api/client/profile` | Modifier le profil | ✅ |
| GET | `/api/client/transactions` | Historique transactions | ✅ |
| POST | `/api/client/transfer` | Effectuer un virement | ✅ |

### Admin (à venir)

| Méthode | Endpoint | Description | Auth requise |
|---------|----------|-------------|--------------|
| GET | `/api/admin/clients` | Liste des clients | ✅ Admin |
| PUT | `/api/admin/client/:id` | Modifier un client | ✅ Admin |
| POST | `/api/admin/balance/:id` | Modifier le solde | ✅ Admin |

---

## 🗺️ Roadmap

### Phase 1 : Authentification ✅
- [x] Configuration du serveur Express
- [x] Connexion à MySQL via Sequelize
- [x] Modèle User
- [x] Route d'inscription
- [x] Route de connexion
- [x] Hashage des mots de passe (bcrypt)
- [x] Génération de tokens JWT

### Phase 2 : Espace Client 🚧
- [ ] Dashboard avec solde
- [ ] Historique des transactions
- [ ] Effectuer un virement
- [ ] Gestion des bénéficiaires
- [ ] Modification du profil
- [ ] Téléchargement de relevés (PDF)

### Phase 3 : Espace Admin ⏳
- [ ] Connexion admin
- [ ] Dashboard administrateur
- [ ] Gestion des clients
- [ ] Gestion des transactions
- [ ] Statistiques et rapports

### Phase 4 : Améliorations ⏳
- [ ] Notifications par email
- [ ] Authentification à deux facteurs (2FA)
- [ ] Historique de connexions
- [ ] Limites de virement
- [ ] Export des données (CSV, Excel)
- [ ] Mode sombre
- [ ] Responsive design amélioré

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Forkez** le projet
2. **Créez** une branche (`git checkout -b feature/amelioration`)
3. **Committez** vos changements (`git commit -m 'Ajout fonctionnalité'`)
4. **Pushez** vers la branche (`git push origin feature/amelioration`)
5. **Ouvrez** une Pull Request

---

## 📝 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👨‍💻 Auteur

**Cedric**
- GitHub : [@agideboutique-jpg](https://github.com/agideboutique-jpg)

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez que MySQL est bien démarré (WAMP)
2. Vérifiez que le fichier `.env` est correctement configuré
3. Consultez les logs du serveur
4. Ouvrez une **issue** sur GitHub

---

## 🙏 Remerciements

- Thème HTML/CSS basé sur un template de banque en ligne
- Inspiré par les meilleures pratiques de développement web moderne

---

**Développé avec ❤️ pour apprendre Node.js et le développement full-stack**