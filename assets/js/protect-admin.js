// ========================================
// 🔒 PROTECTION DE L'ESPACE ADMIN
// ========================================

(function() {
  console.log('🔒 Vérification de l\'accès admin...');

  // Récupérer les infos de l'utilisateur
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('userType');

  console.log('Token présent:', !!token);
  console.log('UserType:', userType);

  // Si pas de token → Redirection vers login
  if (!token) {
    console.log('❌ Aucun token - Redirection vers login');
    alert('⚠️ Vous devez être connecté pour accéder à cette page');
    window.location.href = '/log-in.html';
    return;
  }

  // Si c'est un client → Redirection vers client dashboard
  if (userType === 'client') {
    console.log('⚠️ Compte client détecté - Redirection vers client dashboard');
    alert('⚠️ Vous êtes connecté en tant que client. Redirection vers l\'espace client...');
    window.location.href = '/dashboard.html';
    return;
  }

  // Si c'est un admin → Autoriser l'accès
  if (userType === 'admin') {
    console.log('✅ Accès admin autorisé');
    return;
  }

  // Type inconnu → Redirection vers login
  console.log('❌ Type d\'utilisateur inconnu:', userType);
  alert('⚠️ Type de compte invalide. Veuillez vous reconnecter.');
  localStorage.clear();
  window.location.href = '/log-in.html';
})();