// ========================================
// 👨‍💼 GESTION ADMIN - CLIENTS
// ========================================

let allClients = [];
let currentClient = null;

// ========================================
// 📄 CHARGER AU DÉMARRAGE
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Chargement de la page admin-clients');
  console.log('🔑 Token présent:', !!localStorage.getItem('token'));
  console.log('👤 UserType:', localStorage.getItem('userType'));
  
  await loadClients();
  setupSearch();
  setupSoldeModal();
});

// ========================================
// 👥 CHARGER LES CLIENTS
// ========================================

async function loadClients(search = '') {
  console.log('📥 Chargement des clients... Recherche:', search || 'aucune');
  
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('❌ Aucun token trouvé');
      alert('❌ Vous devez être connecté');
      window.location.href = '/log-in.html';
      return;
    }

    const url = search 
      ? `http://localhost:5000/api/admin/clients?search=${encodeURIComponent(search)}`
      : 'http://localhost:5000/api/admin/clients';

    console.log('🔗 URL:', url);

    const response = await fetch(url, {
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
      allClients = data.clients;
      console.log('✅ Clients chargés:', allClients.length);
      displayClients(allClients);
      updateStats();
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
// 📊 AFFICHER LES CLIENTS
// ========================================

function displayClients(clients) {
  const tbody = document.getElementById('clients-tbody');
  const noClients = document.getElementById('no-clients');
  const list = document.getElementById('clients-list');

  if (clients.length === 0) {
    noClients.style.display = 'block';
    list.style.display = 'none';
    return;
  }

  noClients.style.display = 'none';
  list.style.display = 'block';

  tbody.innerHTML = clients.map(c => {
    const dateInscription = new Date(c.createdAt).toLocaleDateString('fr-FR');
    const statutBadge = c.isActive 
      ? '<span class="badge bg-success">✅ Actif</span>'
      : '<span class="badge bg-danger">❌ Inactif</span>';

    return `
      <tr>
        <td><strong>${c.nom}</strong></td>
        <td>${c.email}</td>
        <td>${c.telephone}</td>
        <td><strong>${parseFloat(c.solde).toFixed(2)} €</strong></td>
        <td>${statutBadge}</td>
        <td><small>${dateInscription}</small></td>
        <td class="text-center">
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-info" onclick="voirDetails(${c.id})" title="Voir détails">
              <i class="ph ph-eye"></i>
            </button>
            <button class="btn btn-outline-primary" onclick="ouvrirModalSolde(${c.id}, '${c.nom.replace(/'/g, "\\'")}', ${c.solde})" title="Modifier solde">
              <i class="ph ph-coins"></i>
            </button>
            <button class="btn btn-outline-${c.isActive ? 'danger' : 'success'}" onclick="toggleStatus(${c.id}, '${c.nom.replace(/'/g, "\\'")}', ${c.isActive})" title="${c.isActive ? 'Désactiver' : 'Activer'}">
              <i class="ph ph-${c.isActive ? 'lock' : 'lock-open'}"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ========================================
// 📊 METTRE À JOUR LES STATS
// ========================================

function updateStats() {
  const total = allClients.length;
  const actifs = allClients.filter(c => c.isActive).length;
  const inactifs = total - actifs;

  document.getElementById('count-total').textContent = total;
  document.getElementById('count-actifs').textContent = actifs;
  document.getElementById('count-inactifs').textContent = inactifs;
}

// ========================================
// 🔍 RECHERCHE
// ========================================

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const resetBtn = document.getElementById('reset-btn');

  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    loadClients(query);
  });

  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      loadClients(query);
    }
  });

  resetBtn.addEventListener('click', () => {
    searchInput.value = '';
    loadClients();
  });
}

// ========================================
// 👁️ VOIR DÉTAILS
// ========================================

async function voirDetails(clientId) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/admin/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      afficherDetails(data.client);
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}

function afficherDetails(client) {
  const content = document.getElementById('modal-details-content');

  content.innerHTML = `
    <div class="row">
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Nom complet</h6>
        <p class="fw-bold">${client.nom}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Email</h6>
        <p>${client.email}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Téléphone</h6>
        <p>${client.telephone}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Adresse</h6>
        <p>${client.adresse}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Solde actuel</h6>
        <p class="fw-bold text-success">${parseFloat(client.solde).toFixed(2)} €</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Statut</h6>
        <p>${client.isActive ? '<span class="badge bg-success">Actif</span>' : '<span class="badge bg-danger">Inactif</span>'}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Date d'inscription</h6>
        <p>${new Date(client.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
      <div class="col-md-6 mb-3">
        <h6 class="text-muted">Dernière mise à jour</h6>
        <p>${new Date(client.updatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </div>

    <hr>

    <h6 class="mb-3">📊 Statistiques</h6>
    <div class="row">
      <div class="col-md-4 text-center">
        <h3 class="text-primary">${client.stats.totalTransactions}</h3>
        <small class="text-muted">Transactions</small>
      </div>
      <div class="col-md-4 text-center">
        <h3 class="text-success">${client.stats.beneficiaires}</h3>
        <small class="text-muted">Bénéficiaires</small>
      </div>
      <div class="col-md-4 text-center">
        <h3 class="text-info">${client.stats.dernieresTransactions.length}</h3>
        <small class="text-muted">Récentes</small>
      </div>
    </div>

    ${client.stats.dernieresTransactions.length > 0 ? `
      <hr>
      <h6 class="mb-3">💸 Dernières transactions</h6>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Montant</th>
              <th>Description</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${client.stats.dernieresTransactions.map(t => `
              <tr>
                <td><span class="badge bg-${t.type === 'credit' ? 'success' : 'danger'}">${t.type === 'credit' ? '➕' : '➖'} ${t.type}</span></td>
                <td><strong>${parseFloat(t.montant).toFixed(2)} €</strong></td>
                <td><small>${t.description || '-'}</small></td>
                <td><small>${new Date(t.createdAt).toLocaleDateString('fr-FR')}</small></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
  `;

  const modal = new bootstrap.Modal(document.getElementById('detailsModal'));
  modal.show();
}

// ========================================
// 💰 MODIFIER LE SOLDE
// ========================================

function ouvrirModalSolde(clientId, nom, solde) {
  currentClient = { id: clientId, nom, solde };

  document.getElementById('modal-solde-nom').textContent = nom;
  document.getElementById('modal-solde-actuel').textContent = parseFloat(solde).toFixed(2);
  document.getElementById('solde-type').value = 'credit';
  document.getElementById('solde-montant').value = '';
  document.getElementById('solde-description').value = '';

  const modal = new bootstrap.Modal(document.getElementById('soldeModal'));
  modal.show();
}

function setupSoldeModal() {
  const confirmBtn = document.getElementById('confirm-solde-btn');

  confirmBtn.addEventListener('click', async () => {
    const type = document.getElementById('solde-type').value;
    const montant = document.getElementById('solde-montant').value;
    const description = document.getElementById('solde-description').value.trim();

    if (!montant || parseFloat(montant) <= 0) {
      alert('⚠️ Veuillez entrer un montant valide');
      return;
    }

    if (!description || description.length < 5) {
      alert('⚠️ Veuillez entrer une description (min. 5 caractères)');
      return;
    }

    const typeText = type === 'credit' ? 'ajouter' : 'retirer';
    const preposition = type === 'credit' ? 'au' : 'du';
    
    if (!confirm(`Confirmer ${typeText} ${montant} € ${preposition} compte de ${currentClient.nom} ?\n\nRaison : ${description}`)) {
      return;
    }

    await modifierSolde(currentClient.id, type, montant, description);
  });
}

async function modifierSolde(clientId, type, montant, description) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/admin/clients/${clientId}/solde`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ montant, type, description })
    });

    const data = await response.json();

    if (response.ok) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('soldeModal'));
      modal.hide();

      alert(`✅ ${data.message}\n\nAncien solde : ${data.client.ancienSolde} €\nNouveau solde : ${data.client.nouveauSolde} €`);

      await loadClients();
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}

// ========================================
// 🔒 ACTIVER/DÉSACTIVER
// ========================================

async function toggleStatus(clientId, nom, isActive) {
  const action = isActive ? 'désactiver' : 'activer';
  const warning = isActive ? '⚠️ Le client ne pourra plus se connecter.' : '✅ Le client pourra se reconnecter.';

  if (!confirm(`Voulez-vous vraiment ${action} le compte de ${nom} ?\n\n${warning}`)) {
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/admin/clients/${clientId}/toggle-status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✅ ${data.message}`);
      await loadClients();
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}