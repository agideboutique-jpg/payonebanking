// ========================================
// 👥 GESTION DES BÉNÉFICIAIRES
// ========================================

// Vérifier que l'utilisateur est connecté
if (!localStorage.getItem('token')) {
  alert('⚠️ Vous devez être connecté pour accéder à cette page');
  window.location.href = '/log-in.html';
}

// ========================================
// 🔄 CHARGER AU DÉMARRAGE
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  await loadBeneficiaires();
  setupAddBeneficiaireForm();
});

// ========================================
// 📋 CHARGER LA LISTE DES BÉNÉFICIAIRES
// ========================================

async function loadBeneficiaires() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch('http://localhost:5000/api/beneficiaires', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (response.ok) {
      displayBeneficiaires(data.beneficiaires);
      console.log('✅ Bénéficiaires chargés:', data.beneficiaires.length);
    } else {
      throw new Error(data.message);
    }

  } catch (error) {
    console.error('❌ Erreur chargement bénéficiaires:', error);
    alert('Erreur de chargement des bénéficiaires');
  }
}

// ========================================
// 📊 AFFICHER LA LISTE DES BÉNÉFICIAIRES
// ========================================

function displayBeneficiaires(beneficiaires) {
  const container = document.getElementById('beneficiaires-list');
  
  if (!container) return;

  if (beneficiaires.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="ph ph-user-circle-plus tw-text-15 text-muted d-block mb-3"></i>
        <p class="text-muted">Aucun bénéficiaire enregistré</p>
        <p class="text-muted tw-text-3">Ajoutez un bénéficiaire pour effectuer des virements</p>
      </div>
    `;
    return;
  }

  container.innerHTML = beneficiaires.map(b => {
    // Définir les couleurs selon le statut
    let statutBadge = '';
    let statutIcon = '';
    
    if (b.statut === 'en_attente') {
      statutBadge = 'bg-warning text-dark';
      statutIcon = '<i class="ph ph-clock"></i>';
    } else if (b.statut === 'valide') {
      statutBadge = 'bg-success text-white';
      statutIcon = '<i class="ph ph-check-circle"></i>';
    } else if (b.statut === 'refuse') {
      statutBadge = 'bg-danger text-white';
      statutIcon = '<i class="ph ph-x-circle"></i>';
    }

    const dateAjout = new Date(b.createdAt).toLocaleDateString('fr-FR');

    return `
      <div class="card mb-3 border">
        <div class="card-body">
          <div class="row align-items-center">
            
            <!-- Icône -->
            <div class="col-auto">
              <div class="tw-w-12 tw-h-12 rounded-circle bg-primary-05 d-flex align-items-center justify-content-center">
                <i class="ph ph-user tw-text-6 text-primary-600"></i>
              </div>
            </div>

            <!-- Informations -->
            <div class="col">
              <h5 class="mb-1 fw-semibold">${b.nom}</h5>
              <p class="mb-0 text-muted tw-text-4">
                <i class="ph ph-bank"></i> ${formatIBAN(b.iban)}
              </p>
              <small class="text-muted tw-text-3">
                Ajouté le ${dateAjout}
              </small>
            </div>

            <!-- Statut -->
            <div class="col-auto">
              <span class="badge ${statutBadge} tw-px-3 tw-py-2">
                ${statutIcon} ${getStatutText(b.statut)}
              </span>
            </div>

            <!-- Actions -->
            <div class="col-auto">
              <button 
                class="btn btn-sm btn-outline-danger delete-benef-btn" 
                data-id="${b.id}"
                data-nom="${b.nom}"
                ${b.statut === 'valide' ? 'title="Attention : ce bénéficiaire est validé"' : ''}
              >
                <i class="ph ph-trash"></i> Supprimer
              </button>
            </div>

          </div>

          <!-- Raison du refus (si refusé) -->
          ${b.statut === 'refuse' && b.raisonRefus ? `
            <div class="alert alert-danger mt-3 mb-0">
              <strong>Raison du refus :</strong> ${b.raisonRefus}
            </div>
          ` : ''}

          <!-- Info validation en attente -->
          ${b.statut === 'en_attente' ? `
            <div class="alert alert-info mt-3 mb-0 tw-text-3">
              <i class="ph ph-info"></i> 
              Ce bénéficiaire sera validé automatiquement dans 24h ou manuellement par un administrateur.
            </div>
          ` : ''}

        </div>
      </div>
    `;
  }).join('');

  // Attacher les événements de suppression
  attachDeleteEvents();
}

// ========================================
// 📝 GÉRER LE FORMULAIRE D'AJOUT
// ========================================

function setupAddBeneficiaireForm() {
  const form = document.getElementById('add-beneficiaire-form');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nom = document.getElementById('benef-nom').value.trim();
      const iban = document.getElementById('benef-iban').value.trim();

      // Validation
      if (!nom || !iban) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
      }

      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Ajout en cours...';

      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/beneficiaires/add', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nom, iban })
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ ' + data.message);
          form.reset();
          await loadBeneficiaires();
        } else {
          alert('❌ ' + data.message);
        }

      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de l\'ajout du bénéficiaire');
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }
}

// ========================================
// 🗑️ SUPPRIMER UN BÉNÉFICIAIRE
// ========================================

function attachDeleteEvents() {
  const deleteButtons = document.querySelectorAll('.delete-benef-btn');

  deleteButtons.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.dataset.id;
      const nom = e.currentTarget.dataset.nom;

      if (!confirm(`Voulez-vous vraiment supprimer le bénéficiaire "${nom}" ?`)) {
        return;
      }

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`http://localhost:5000/api/beneficiaires/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          alert('✅ Bénéficiaire supprimé');
          await loadBeneficiaires();
        } else {
          alert('❌ ' + data.message);
        }

      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur lors de la suppression');
      }
    });
  });
}

// ========================================
// 🛠️ FONCTIONS UTILITAIRES
// ========================================

function formatIBAN(iban) {
  // Ajouter des espaces tous les 4 caractères pour la lisibilité
  return iban.replace(/(.{4})/g, '$1 ').trim();
}

function getStatutText(statut) {
  switch(statut) {
    case 'en_attente': return 'En attente';
    case 'valide': return 'Validé';
    case 'refuse': return 'Refusé';
    default: return statut;
  }
}