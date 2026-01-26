// ========================================
// 💸 GESTION DES VIREMENTS
// ========================================

if (!localStorage.getItem('token')) {
  alert('⚠️ Vous devez être connecté pour effectuer un virement');
  window.location.href = '/log-in.html';
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserBalance();
  await loadBeneficiairesValides();
  setupTransferForm();
  setupMontantValidation(); // ✅ VALIDATION EN TEMPS RÉEL
});

async function loadUserBalance() {
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
      const balanceElements = document.querySelectorAll('.user-balance');
      balanceElements.forEach(el => {
        el.textContent = parseFloat(data.user.solde).toFixed(2) + ' €';
      });

      const nameElements = document.querySelectorAll('.user-name');
      nameElements.forEach(el => {
        el.textContent = data.user.nom;
      });

      console.log('✅ Solde chargé:', data.user.solde);
    }
  } catch (error) {
    console.error('❌ Erreur chargement solde:', error);
  }
}

// ========================================
// ✅ VALIDER LE MONTANT EN TEMPS RÉEL
// ========================================

function setupMontantValidation() {
  const montantInput = document.getElementById('montant');
  const validationMessage = document.createElement('small');
  validationMessage.id = 'montant-validation';
  validationMessage.className = 'tw-text-3 d-block tw-mt-2';
  
  if (montantInput) {
    // Insérer le message après l'input
    montantInput.parentElement.appendChild(validationMessage);
    
    // Variable pour stocker le solde actuel
    let currentBalance = 0;
    
    // Récupérer le solde depuis l'élément .user-balance
    const balanceElement = document.querySelector('.user-balance');
    if (balanceElement) {
      currentBalance = parseFloat(balanceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    montantInput.addEventListener('input', (e) => {
      const montant = parseFloat(e.target.value);
      
      // Réinitialiser les styles
      montantInput.style.borderColor = '';
      validationMessage.textContent = '';
      validationMessage.className = 'tw-text-3 d-block tw-mt-2';
      
      // Si le champ est vide
      if (!e.target.value || e.target.value.trim() === '') {
        return;
      }
      
      // Si ce n'est pas un nombre valide
      if (isNaN(montant)) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = '<i class="ph ph-warning-circle"></i> Veuillez entrer un montant valide';
        return;
      }
      
      // Si le montant est négatif ou zéro
      if (montant <= 0) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = '<i class="ph ph-warning-circle"></i> Le montant doit être supérieur à 0 €';
        return;
      }
      
      // Si le montant dépasse le solde
      if (montant > currentBalance) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = `<i class="ph ph-warning-circle"></i> Solde insuffisant ! Il vous manque ${(montant - currentBalance).toFixed(2)} €`;
        return;
      }
      
      // Si tout est OK
      montantInput.style.borderColor = '#28a745';
      validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-success fw-semibold';
      validationMessage.innerHTML = `<i class="ph ph-check-circle"></i> Montant valide - Reste après virement : ${(currentBalance - montant).toFixed(2)} €`;
    });
    
    // Mettre à jour le solde quand il change
    const updateBalance = () => {
      const balanceElement = document.querySelector('.user-balance');
      if (balanceElement) {
        currentBalance = parseFloat(balanceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
      }
    };
    
    // Observer les changements du solde
    const observer = new MutationObserver(updateBalance);
    if (balanceElement) {
      observer.observe(balanceElement, { childList: true, characterData: true, subtree: true });
    }
  }
}

async function loadBeneficiairesValides() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/beneficiaires/valides', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (response.ok) {
      displayBeneficiairesSelect(data.beneficiaires);
      console.log('✅ Bénéficiaires validés chargés:', data.beneficiaires.length);
    }
  } catch (error) {
    console.error('❌ Erreur chargement bénéficiaires:', error);
  }
}

function displayBeneficiairesSelect(beneficiaires) {
  const selectElement = document.getElementById('beneficiaire-select');
  const nobenefContainer = document.getElementById('no-beneficiaire-message');
  const transferForm = document.getElementById('transfer-form');

  if (!selectElement) return;

  if (nobenefContainer) {
    nobenefContainer.style.display = 'none';
  }
  if (transferForm) {
    transferForm.style.display = 'block';
  }

  const oldAlert = selectElement.parentElement.querySelector('.security-alert');
  if (oldAlert) {
    oldAlert.remove();
  }

  if (beneficiaires.length === 0) {
    selectElement.innerHTML = `
      <option value="" disabled selected>
        ❌ Aucun IBAN trouvé - Cliquez ici pour en ajouter
      </option>
    `;
    
    selectElement.style.cursor = 'pointer';
    
    let redirectTimeout = null;
    
    const handleClick = () => {
      if (redirectTimeout) return;
      
      selectElement.innerHTML = `
        <option value="" disabled selected>
          ⏳ Redirection dans 2 secondes...
        </option>
      `;
      
      selectElement.disabled = true;
      
      redirectTimeout = setTimeout(() => {
        window.location.href = '/beneficiaires.html';
      }, 2000);
    };
    
    selectElement.addEventListener('click', handleClick);
    selectElement.addEventListener('focus', handleClick);

    const securityAlert = document.createElement('div');
    securityAlert.className = 'security-alert tw-mt-3 rounded-3';
    securityAlert.style.backgroundColor = '#fff3cd';
    securityAlert.style.border = '1px solid #ffc107';
    securityAlert.style.padding = '10px 12px';
    securityAlert.innerHTML = `
      <div class="d-flex align-items-start tw-gap-2">
        <i class="ph ph-shield-warning text-warning tw-text-5 flex-shrink-0 tw-mt-1"></i>
        <small class="text-warning fw-normal tw-text-3" style="line-height: 1.5;">
          Pour des raisons de sécurité, seuls les IBAN validés sont éligibles aux opérations de virement.
        </small>
      </div>
    `;
    
    selectElement.parentElement.appendChild(securityAlert);

    const submitButton = transferForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="ph ph-lock"></i> Ajoutez un bénéficiaire d\'abord';
    }

    return;
  }

  selectElement.style.cursor = 'default';
  selectElement.disabled = false;

  selectElement.innerHTML = `
    <option value="" disabled selected>Sélectionnez un bénéficiaire</option>
    ${beneficiaires.map(b => `
      <option value="${b.id}" data-iban="${b.iban}">
        ${b.nom} - ${formatIBAN(b.iban)}
      </option>
    `).join('')}
  `;

  const submitButton = transferForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = '💸 ENVOYER LE VIREMENT';
  }

  selectElement.addEventListener('change', (e) => {
    const selectedOption = e.target.options[e.target.selectedIndex];
    const iban = selectedOption.dataset.iban;
    const ibanDisplay = document.getElementById('iban-display');
    
    if (ibanDisplay && iban) {
      ibanDisplay.textContent = `IBAN : ${formatIBAN(iban)}`;
      ibanDisplay.style.display = 'block';
    }
  });
}

function setupTransferForm() {
  const transferForm = document.getElementById('transfer-form');

  if (transferForm) {
    transferForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const beneficiaireId = document.getElementById('beneficiaire-select').value;
      const montant = document.getElementById('montant').value.trim();
      const description = document.getElementById('description').value.trim();

      if (!beneficiaireId) {
        alert('⚠️ Veuillez sélectionner un bénéficiaire');
        return;
      }

      if (!montant || !description) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
      }

      const amount = parseFloat(montant);
      if (isNaN(amount) || amount <= 0) {
        alert('⚠️ Le montant doit être un nombre positif');
        return;
      }

      const selectElement = document.getElementById('beneficiaire-select');
      const selectedOption = selectElement.options[selectElement.selectedIndex];
      const benefNom = selectedOption.text;

      if (!confirm(`Confirmer le virement de ${amount.toFixed(2)} € vers ${benefNom} ?`)) {
        return;
      }

      const submitButton = transferForm.querySelector('button[type="submit"]');
      const originalHTML = submitButton.innerHTML;
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Virement en cours...';

      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/client/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            beneficiaireId: parseInt(beneficiaireId),
            montant: amount,
            description
          })
        });

        const data = await response.json();

        if (response.ok) {
          alert(`✅ ${data.message}\n\n💰 Montant : ${data.virement.montant} €\n👤 Bénéficiaire : ${data.virement.beneficiaire}\n🔄 IBAN : ${formatIBAN(data.virement.iban)}\n💵 Nouveau solde : ${data.virement.nouveauSolde} €`);

          transferForm.reset();
          const ibanDisplay = document.getElementById('iban-display');
          if (ibanDisplay) {
            ibanDisplay.style.display = 'none';
          }

          await loadUserBalance();

          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 2000);

        } else {
          alert('❌ ' + data.message);
          submitButton.disabled = false;
          submitButton.innerHTML = originalHTML;
        }

      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion au serveur');
        submitButton.disabled = false;
        submitButton.innerHTML = originalHTML;
      }
    });
  }
}

function formatIBAN(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}