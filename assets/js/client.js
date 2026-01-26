// ========================================
// 📊 GESTION DU DASHBOARD CLIENT
// ========================================

// Vérifier que l'utilisateur est connecté
if (!localStorage.getItem('token')) {
  alert('⚠️ Vous devez être connecté pour accéder au dashboard');
  window.location.href = '/log-in.html';
}

// ========================================
// 🔄 CHARGER LES DONNÉES AU DÉMARRAGE
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProfile();
  await loadTransactions();
  await loadStats();
  setupLogoutButton();
});

// ========================================
// 👤 CHARGER LE PROFIL UTILISATEUR
// ========================================

async function loadUserProfile() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/client/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      // Afficher le nom
      document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = data.user.nom;
      });

      // Afficher le solde
      document.querySelectorAll('.user-balance').forEach(el => {
        el.textContent = parseFloat(data.user.solde).toFixed(2) + ' €';
      });

      // Afficher l'email
      document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = data.user.email;
      });

      console.log('✅ Profil chargé:', data.user);
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement profil:', error);
    alert('Erreur de chargement du profil. Reconnectez-vous.');
    logout();
  }
}

// ========================================
// 📜 CHARGER LES TRANSACTIONS
// ========================================

async function loadTransactions() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/client/transactions?limit=7', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      displayTransactions(data.transactions);
      console.log('✅ Transactions chargées:', data.transactions.length);
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement transactions:', error);
    displayNoTransactions();
  }
}

// ========================================
// 📊 AFFICHER LES TRANSACTIONS DANS LE TABLEAU
// ========================================

function displayTransactions(transactions) {
  const tbody = document.getElementById('transactions-list');
  
  if (!tbody) return;

  if (transactions.length === 0) {
    displayNoTransactions();
    return;
  }

  tbody.innerHTML = transactions.map((t, index) => {
    const isEven = index % 2 === 1;
    const bgClass = isEven ? 'bg-neutral-10' : '';
    const statusClass = t.type === 'credit' ? 'bg-primary-05 text-primary-600' : 'bg-danger-05 text-danger-600';
    const statusText = t.type === 'credit' ? 'Crédit' : 'Débit';
    const date = new Date(t.createdAt);
    const formattedDate = date.toLocaleDateString('fr-FR');
    const formattedTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return `
      <tr>
        <th scope="row">
          <div class="tw-px-6 tw-py-2 ${bgClass}">
            <span class="fw-semibold tw-text-4 text-dark-600 tw-mb-1 d-block">${t.description || 'Transaction'}</span>  
            <span class="fw-medium tw-text-sm">
              ${t.beneficiaire || 'N/A'}
            </span>
          </div>
        </th>

        <td>
          <div class="tw-px-6 tw-py-2 ${bgClass}">
            <span class="fw-semibold tw-text-4 text-dark-600 tw-mb-1 d-block">${formattedDate}</span>
            <span class="fw-medium tw-text-sm">
              ${formattedTime}
            </span>
          </div>
        </td>

        <td class="${bgClass}">
          <button type="button" class="${statusClass} tw-px-6 tw-py-205 rounded-pill fw-semibold tw-text-sm mx-auto justify-content-center d-flex">
            ${statusText}
          </button>
        </td>

        <td>
          <div class="tw-px-6 tw-py-2 ${bgClass}">
            <span class="fw-semibold tw-text-4 text-dark-600 tw-mb-1 d-block">${parseFloat(t.montant).toFixed(2)} €</span>
            <span class="fw-medium tw-text-sm">
              ${t.iban || 'N/A'}
            </span>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function displayNoTransactions() {
  const tbody = document.getElementById('transactions-list');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-5">
          <p class="text-muted">Aucune transaction pour le moment</p>
        </td>
      </tr>
    `;
  }
}

// ========================================
// 📊 CHARGER LES STATISTIQUES
// ========================================

async function loadStats() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/client/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      const totalCreditsElement = document.getElementById('total-credits');
      if (totalCreditsElement) {
        totalCreditsElement.textContent = data.stats.totalCredits + ' €';
      }

      const totalDebitsElement = document.getElementById('total-debits');
      if (totalDebitsElement) {
        totalDebitsElement.textContent = data.stats.totalDebits + ' €';
      }

      console.log('✅ Statistiques chargées');
    }

  } catch (error) {
    console.error('❌ Erreur chargement stats:', error);
  }
}

// ========================================
// 🚪 DÉCONNEXION
// ========================================

function setupLogoutButton() {
  const logoutButtons = document.querySelectorAll('.logout-btn');
  
  logoutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
}

function logout() {
  localStorage.clear();
  alert('✅ Vous avez été déconnecté');
  window.location.href = '/log-in.html';
}

// ========================================
// 🧪 FONCTION DE TEST : AJOUTER DES TRANSACTIONS
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const testBtn = document.getElementById('test-transactions-btn');
  
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      if (!confirm('Voulez-vous ajouter des transactions de test ?')) return;

      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/client/add-test-transactions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ ' + data.message + '\nNouveau solde : ' + data.newBalance + ' €');
          
          // Recharger les données
          await loadUserProfile();
          await loadTransactions();
          await loadStats();
        } else {
          alert('❌ ' + data.message);
        }

      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'ajout des transactions');
      }
    });
  }
});