// ========================================
// 👨‍💼 GESTION ADMIN - BÉNÉFICIAIRES
// ========================================

let allBeneficiaires = [];
let currentFilter = 'en_attente';
let currentBeneficiaire = null;

// ========================================
// 📄 CHARGER AU DÉMARRAGE
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadAllBeneficiaires();
  setupTabs();
  setupStatutModal();
});

// ========================================
// 📋 CHARGER TOUS LES BÉNÉFICIAIRES
// ========================================

async function loadAllBeneficiaires() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/admin/beneficiaires/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      allBeneficiaires = data.beneficiaires;
      updateStats();
      filterAndDisplay(currentFilter);
      console.log('✅ Bénéficiaires chargés:', allBeneficiaires.length);
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement bénéficiaires:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}

// ========================================
// 📊 METTRE À JOUR LES STATISTIQUES
// ========================================

function updateStats() {
  const attente = allBeneficiaires.filter(b => b.statut === 'en_attente').length;
  const valides = allBeneficiaires.filter(b => b.statut === 'valide').length;
  const refuses = allBeneficiaires.filter(b => b.statut === 'refuse').length;
  const total = allBeneficiaires.length;

  document.getElementById('count-attente').textContent = attente;
  document.getElementById('count-valides').textContent = valides;
  document.getElementById('count-refuses').textContent = refuses;
  document.getElementById('count-total').textContent = total;

  document.getElementById('badge-attente').textContent = attente;
  document.getElementById('badge-valides').textContent = valides;
  document.getElementById('badge-refuses').textContent = refuses;
  document.getElementById('badge-tous').textContent = total;
}

// ========================================
// 🔍 FILTRER ET AFFICHER
// ========================================

function filterAndDisplay(statut) {
  currentFilter = statut;
  
  let filtered = statut === '' 
    ? allBeneficiaires 
    : allBeneficiaires.filter(b => b.statut === statut);

  displayBeneficiaires(filtered);
}

// ========================================
// 📊 AFFICHER LES BÉNÉFICIAIRES
// ========================================

function displayBeneficiaires(beneficiaires) {
  const tbody = document.getElementById('beneficiaires-tbody');
  const noBenef = document.getElementById('no-beneficiaires');
  const list = document.getElementById('beneficiaires-list');

  if (beneficiaires.length === 0) {
    noBenef.style.display = 'block';
    list.style.display = 'none';
    return;
  }

  noBenef.style.display = 'none';
  list.style.display = 'block';

  tbody.innerHTML = beneficiaires.map(b => {
    const dateDemande = new Date(b.dateDemande).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Badge de statut
    let statutBadge = '';
    if (b.statut === 'en_attente') {
      statutBadge = '<span class="badge bg-warning">⏳ En attente</span>';
    } else if (b.statut === 'valide') {
      statutBadge = '<span class="badge bg-success">✅ Valide</span>';
    } else if (b.statut === 'refuse') {
      statutBadge = '<span class="badge bg-danger">❌ Refuse</span>';
    }

    // Validateur
    const validateur = b.validateur 
      ? `<small class="text-muted">${b.validateur.nom}</small>`
      : '<small class="text-muted">-</small>';

    // Raison de refus
    const raisonRefus = b.raisonRefus 
      ? `<br><small class="text-danger"><i class="ph ph-warning"></i> ${b.raisonRefus}</small>`
      : '';

    return `
      <tr>
        <td>
          <div>
            <strong>${b.user ? b.user.nom : 'N/A'}</strong><br>
            <small class="text-muted">${b.user ? b.user.email : 'N/A'}</small>
          </div>
        </td>
        <td><strong>${b.nom}</strong></td>
        <td><code>${formatIBAN(b.iban)}</code></td>
        <td>${statutBadge}${raisonRefus}</td>
        <td><small>${dateDemande}</small></td>
        <td>${validateur}</td>
        <td class="text-center">
          <button 
            class="btn btn-sm btn-outline-primary" 
            onclick='ouvrirModalStatut(${JSON.stringify(b).replace(/'/g, "&apos;")})'
            title="Changer le statut"
          >
            <i class="ph ph-pencil"></i> Modifier
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ========================================
// 🔄 CONFIGURER LES ONGLETS
// ========================================

function setupTabs() {
  const tabs = document.querySelectorAll('#statutTabs button');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      // Retirer active de tous
      tabs.forEach(t => t.classList.remove('active'));
      // Ajouter active au cliqué
      e.currentTarget.classList.add('active');
      
      const statut = e.currentTarget.dataset.statut;
      filterAndDisplay(statut);
    });
  });
}

// ========================================
// 🔄 OUVRIR LE MODAL DE CHANGEMENT DE STATUT
// ========================================

function ouvrirModalStatut(beneficiaire) {
  currentBeneficiaire = beneficiaire;
  
  document.getElementById('modal-beneficiaire-nom').textContent = beneficiaire.nom;
  document.getElementById('modal-beneficiaire-iban').textContent = formatIBAN(beneficiaire.iban);
  document.getElementById('modal-client-nom').textContent = beneficiaire.user ? beneficiaire.user.nom : 'N/A';
  document.getElementById('modal-statut-actuel').innerHTML = getStatutBadge(beneficiaire.statut);
  
  document.getElementById('nouveau-statut').value = beneficiaire.statut;
  document.getElementById('raison-refus').value = beneficiaire.raisonRefus || '';
  
  toggleRaisonContainer();

  const modal = new bootstrap.Modal(document.getElementById('statutModal'));
  modal.show();
}

// ========================================
// ⚙️ CONFIGURER LE MODAL
// ========================================

function setupStatutModal() {
  const select = document.getElementById('nouveau-statut');
  const textarea = document.getElementById('raison-refus');
  const charCount = document.getElementById('char-count');
  const confirmBtn = document.getElementById('confirm-statut-btn');

  // Afficher/masquer la raison selon le statut
  select.addEventListener('change', toggleRaisonContainer);

  // Compteur de caractères
  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    charCount.textContent = length;
    
    if (length < 10) {
      charCount.classList.add('text-danger');
      charCount.classList.remove('text-success');
    } else {
      charCount.classList.remove('text-danger');
      charCount.classList.add('text-success');
    }
  });

  // Bouton de confirmation
  confirmBtn.addEventListener('click', async () => {
    const nouveauStatut = select.value;
    const raison = textarea.value.trim();

    if (nouveauStatut === 'refuse' && raison.length < 10) {
      alert('⚠️ La raison de refus doit contenir au moins 10 caractères');
      textarea.focus();
      return;
    }

    await changerStatut(currentBeneficiaire.id, nouveauStatut, raison);
  });
}

function toggleRaisonContainer() {
  const select = document.getElementById('nouveau-statut');
  const container = document.getElementById('raison-container');
  
  if (select.value === 'refuse') {
    container.style.display = 'block';
  } else {
    container.style.display = 'none';
  }
}

// ========================================
// 🔄 CHANGER LE STATUT
// ========================================

async function changerStatut(id, nouveauStatut, raison) {
  try {
    const token = localStorage.getItem('token');

    const body = { nouveauStatut };
    if (nouveauStatut === 'refuse') {
      body.raison = raison;
    }

    const response = await fetch(`http://localhost:5000/api/admin/beneficiaires/${id}/changer-statut`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      // Fermer le modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('statutModal'));
      modal.hide();

      alert(`✅ ${data.message}`);
      await loadAllBeneficiaires();
    } else {
      alert('❌ ' + data.message);
    }

  } catch (error) {
    console.error('❌ Erreur changement statut:', error);
    alert('❌ Erreur de connexion au serveur');
  }
}

// ========================================
// 🛠️ FONCTIONS UTILITAIRES
// ========================================

function formatIBAN(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function getStatutBadge(statut) {
  if (statut === 'en_attente') {
    return '<span class="badge bg-warning">⏳ En attente</span>';
  } else if (statut === 'valide') {
    return '<span class="badge bg-success">✅ Validé</span>';
  } else if (statut === 'refuse') {
    return '<span class="badge bg-danger">❌ Refusé</span>';
  }
  return statut;
}