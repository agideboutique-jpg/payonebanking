// ========================================
// 🔐 GESTION INSCRIPTION CLIENT
// ========================================

const signupForm = document.getElementById('signup-form');

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page

    // Récupérer les valeurs du formulaire
    const nom = document.getElementById('nom').value.trim();
    const email = document.getElementById('email').value.trim();
    const telephone = document.getElementById('telephone').value.trim();
    const adresse = document.getElementById('adresse').value.trim();
    const password = document.getElementById('password').value;

    // Vérification basique des champs
    if (!nom || !email || !telephone || !adresse || !password) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('⚠️ Format d\'email invalide');
      return;
    }

    // Validation du mot de passe
    if (password.length < 6) {
      alert('⚠️ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Désactiver le bouton pendant l'envoi
    const submitButton = signupForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Inscription en cours...';

    try {
      // Envoyer les données au serveur
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nom,
          email,
          telephone,
          adresse,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Inscription réussie
        alert('✅ ' + data.message + ' ! Vous allez être redirigé vers la connexion.');
        
        // Réinitialiser le formulaire
        signupForm.reset();
        
        // Rediriger vers la page de connexion
        setTimeout(() => {
          window.location.href = '/log-in.html';
        }, 1000);
      } else {
        // Erreur retournée par le serveur
        alert('❌ ' + data.message);
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    } catch (error) {
      // Erreur de connexion au serveur
      console.error('Erreur:', error);
      alert('❌ Erreur de connexion au serveur. Vérifiez que le serveur est bien démarré.');
      submitButton.disabled = false;
      submitButton.textContent = originalButtonText;
    }
  });
}

// ========================================
// 🔐 GESTION DE LA CONNEXION
// ========================================

const loginForm = document.getElementById('login-form');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation
    if (!email || !password) {
      alert('⚠️ Veuillez remplir tous les champs');
      return;
    }

    // Désactiver le bouton
    const submitButton = loginForm.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = '⏳ Connexion en cours...';

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        // Stocker le token
        localStorage.setItem('token', data.token);
        
        // Stocker les infos utilisateur
        localStorage.setItem('userName', data.user.nom);
        localStorage.setItem('userEmail', data.user.email);
        localStorage.setItem('userType', data.user.userType);  // ✅ STOCKER LE TYPE

        console.log('✅ Connexion réussie:', data.user.nom, '- Type:', data.user.userType);

        // ✅ REDIRECTION SELON LE TYPE DE COMPTE
        if (data.user.userType === 'admin') {
          // Rediriger vers le dashboard admin
          alert(`✅ Bienvenue Administrateur ${data.user.nom} !`);
          window.location.href = '/admin-dashboard.html';
        } else {
          // Rediriger vers le dashboard client
          alert(`✅ Bienvenue ${data.user.nom} !`);
          window.location.href = '/dashboard.html';
        }

      } else {
        // Erreur
        alert('❌ ' + data.message);
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }

    } catch (error) {
      console.error('Erreur:', error);
      alert('❌ Erreur de connexion au serveur');
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  });
}

// ========================================
// 🚪 GESTION DÉCONNEXION
// ========================================

// Fonction pour se déconnecter (à appeler depuis n'importe quelle page)
function logout() {
  // Supprimer toutes les données du localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userType');
  localStorage.removeItem('nom');
  localStorage.removeItem('email');
  localStorage.removeItem('solde');

  // Rediriger vers la page de connexion
  alert('✅ Vous avez été déconnecté');
  window.location.href = '/log-in.html';
}

// ========================================
// 🔒 VÉRIFICATION DE L'AUTHENTIFICATION
// ========================================

// Fonction pour vérifier si l'utilisateur est connecté
function isAuthenticated() {
  const token = localStorage.getItem('token');
  return token !== null;
}

// Fonction pour protéger une page (à appeler au chargement des pages protégées)
function protectPage(requiredUserType = null) {
  if (!isAuthenticated()) {
    alert('⚠️ Vous devez être connecté pour accéder à cette page');
    window.location.href = '/log-in.html';
    return;
  }

  // Si un type d'utilisateur spécifique est requis
  if (requiredUserType) {
    const userType = localStorage.getItem('userType');
    if (userType !== requiredUserType) {
      alert('⚠️ Vous n\'avez pas les permissions pour accéder à cette page');
      window.location.href = '/log-in.html';
      return;
    }
  }
}

// ========================================
// 📊 FONCTIONS UTILITAIRES
// ========================================

// Récupérer les informations de l'utilisateur connecté
function getCurrentUser() {
  return {
    userId: localStorage.getItem('userId'),
    nom: localStorage.getItem('nom'),
    email: localStorage.getItem('email'),
    userType: localStorage.getItem('userType'),
    solde: localStorage.getItem('solde'),
    token: localStorage.getItem('token')
  };
}

// Afficher le nom de l'utilisateur dans la page
function displayUserName(elementId) {
  const nom = localStorage.getItem('nom');
  const element = document.getElementById(elementId);
  if (element && nom) {
    element.textContent = nom;
  }
}

// Afficher le solde de l'utilisateur
function displayUserBalance(elementId) {
  const solde = localStorage.getItem('solde');
  const element = document.getElementById(elementId);
  if (element && solde) {
    element.textContent = parseFloat(solde).toFixed(2) + ' €';
  }
}