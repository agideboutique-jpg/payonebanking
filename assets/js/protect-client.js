// ========================================
// 🔒 PROTECTION DE L'ESPACE CLIENT
// ========================================

(function() {
  console.log('🔒 Vérification de l\'accès client...');

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

  // Si c'est un admin → Redirection vers admin dashboard
  if (userType === 'admin') {
    console.log('⚠️ Compte admin détecté - Redirection vers admin dashboard');
    window.location.href = '/admin-dashboard.html';
    return;
  }

  // Si c'est un client → Autoriser l'accès
  if (userType === 'client') {
    console.log('✅ Accès client autorisé');
    return;
  }

  // Type inconnu → Redirection vers login
  console.log('❌ Type d\'utilisateur inconnu:', userType);
  alert('⚠️ Type de compte invalide. Veuillez vous reconnecter.');
  localStorage.clear();
  window.location.href = '/log-in.html';
})();