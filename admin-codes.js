// ========================================
// 🔐 GESTION DES CODES DE TRANSACTION - ADMIN
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Chargement de la page admin-codes');
  await loadClients();
  await loadCodes();
  setupGenerateForm();
});

// ========================================
// 👥 CHARGER LA LISTE DES CLIENTS
// ========================================

async function loadClients() {
  console.log('📥 Chargement des clients...');
  
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('❌ Aucun token trouvé');
      alert('❌ Vous devez être connecté');
      window.location.href = '/admin-login.html';
      return;
    }

    console.log('🔗 URL:', 'http://localhost:5000/api/admin/clients');

    const response = await fetch('http://localhost:5000/api/admin/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response status:', response.status);

    const data = await response.json();
    console.log('📦 Data reçue:', data);

    if (response.ok) {
      const select = document.getElementById('client-select');
      
      if (!select) {
        console.error('❌ Élément client-select introuvable');
        return;
      }

      select.innerHTML = '<option value="">-- Sélectionner un client --</option>';
      
      if (!data.clients || data.clients.length === 0) {
        console.warn('⚠️ Aucun client trouvé');
        select.innerHTML += '<option value="" disabled>Aucun client disponible</option>';
        return;
      }

      console.log('✅ Nombre de clients:', data.clients.length);

      data.clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.nom} (${client.email})`;
        select.appendChild(option);
        console.log('➕ Client ajouté:', client.nom);
      });

      console.log('✅ Clients chargés avec succès');
    } else {
      console.error('❌ Erreur API:', data.message);
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement clients:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}

// ========================================
// 📋 CHARGER LES CODES
// ========================================

async function loadCodes() {
  console.log('📥 Chargement des codes...');
  
  try {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('❌ Aucun token trouvé');
      return;
    }

    const response = await fetch('http://localhost:5000/api/transaction-codes/list', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Response codes status:', response.status);

    const data = await response.json();
    console.log('📦 Codes reçus:', data);

    if (response.ok) {
      displayCodes(data.codes || []);
      console.log('✅ Codes chargés:', data.codes ? data.codes.length : 0);
    } else {
      console.error('❌ Erreur API codes:', data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement codes:', error);
  }
}

// ========================================
// 📊 AFFICHER LES CODES
// ========================================

function displayCodes(codes) {
  const tbody = document.getElementById('codes-tbody');

  if (!tbody) {
    console.error('❌ Élément codes-tbody introuvable');
    return;
  }

  if (codes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          Aucun code généré
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = codes.map(c => {
    const dateGeneration = new Date(c.createdAt).toLocaleString('fr-FR');
    const dateExpiration = new Date(c.dateExpiration).toLocaleString('fr-FR');
    
    let statutBadge = '';
    if (c.statut === 'actif') {
      // Vérifier si expiré
      const now = new Date();
      if (now > new Date(c.dateExpiration)) {
        statutBadge = '<span class="badge bg-secondary">⏰ Expiré</span>';
      } else {
        statutBadge = '<span class="badge bg-success">✅ Actif</span>';
      }
    } else if (c.statut === 'utilise') {
      statutBadge = '<span class="badge bg-info">✓ Utilisé</span>';
    } else {
      statutBadge = '<span class="badge bg-secondary">⏰ Expiré</span>';
    }

    const actionBtn = c.statut === 'actif' 
      ? `<button class="btn btn-sm btn-outline-danger" onclick="revokeCode(${c.id})">
           <i class="ph ph-x"></i> Révoquer
         </button>`
      : '<span class="text-muted">-</span>';

    return `
      <tr>
        <td><code class="fs-5">${c.code}</code></td>
        <td>${c.client ? c.client.nom : 'N/A'}</td>
        <td>${statutBadge}</td>
        <td><small>${dateGeneration}</small></td>
        <td><small>${dateExpiration}</small></td>
        <td><small>${c.administrateur ? c.administrateur.nom : 'N/A'}</small></td>
        <td class="text-center">${actionBtn}</td>
      </tr>
    `;
  }).join('');
}

// ========================================
// 🎲 FORMULAIRE DE GÉNÉRATION
// ========================================

function setupGenerateForm() {
  const form = document.getElementById('generate-code-form');

  if (!form) {
    console.error('❌ Formulaire generate-code-form introuvable');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId = document.getElementById('client-select').value;
    const dureeMinutes = document.getElementById('duree-minutes').value;

    console.log('📝 Génération code pour userId:', userId, 'durée:', dureeMinutes);

    if (!userId) {
      alert('⚠️ Veuillez sélectionner un client');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Génération...';

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/transaction-codes/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, dureeMinutes })
      });

      console.log('📡 Response génération:', response.status);

      const data = await response.json();
      console.log('📦 Data génération:', data);

      if (response.ok) {
        // Afficher le code généré
        document.getElementById('generated-code').textContent = data.code.code;
        document.getElementById('code-client-name').textContent = data.code.client.nom;
        document.getElementById('code-expiration').textContent = new Date(data.code.dateExpiration).toLocaleString('fr-FR');
        document.getElementById('code-display').style.display = 'block';

        // Réinitialiser le formulaire
        form.reset();

        // Recharger la liste
        await loadCodes();

        alert('✅ Code généré avec succès !');
      } else {
        alert('❌ ' + data.message);
      }

    } catch (error) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur de connexion au serveur');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// ========================================
// 📋 COPIER LE CODE
// ========================================

function copyCode() {
  const code = document.getElementById('generated-code').textContent;
  navigator.clipboard.writeText(code).then(() => {
    alert('✅ Code copié dans le presse-papier : ' + code);
  }).catch(err => {
    console.error('❌ Erreur copie:', err);
    alert('❌ Impossible de copier le code');
  });
}

// ========================================
// 🗑️ RÉVOQUER UN CODE
// ========================================

async function revokeCode(id) {
  console.log('🗑️ Révocation du code ID:', id);

  if (!confirm('Voulez-vous vraiment révoquer ce code ?')) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/transaction-codes/${id}/revoke`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert('✅ Code révoqué');
      await loadCodes();
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}
