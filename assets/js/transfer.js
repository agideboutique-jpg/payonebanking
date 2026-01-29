// ========================================
// 💸 GESTION DES VIREMENTS EN 2 ÉTAPES
// ========================================

if (!localStorage.getItem('token')) {
  alert('⚠️ Vous devez être connecté pour effectuer un virement');
  window.location.href = '/log-in.html';
}

// Variables globales pour stocker les données de l'étape 1
let transferData = {
  beneficiaireId: null,
  beneficiaireNom: null,
  beneficiaireIban: null,
  montant: null,
  description: null
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadUserBalance();
  await loadBeneficiairesValides();
  setupStep1Form();
  setupStep2Validation();
  setupMontantValidation();
});

// ========================================
// 💰 CHARGER LE SOLDE
// ========================================
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
// ✅ VALIDATION MONTANT EN TEMPS RÉEL
// ========================================
function setupMontantValidation() {
  const montantInput = document.getElementById('montant');
  const validationMessage = document.createElement('small');
  validationMessage.id = 'montant-validation';
  validationMessage.className = 'tw-text-3 d-block tw-mt-2';
  
  if (montantInput) {
    montantInput.parentElement.appendChild(validationMessage);
    
    let currentBalance = 0;
    const balanceElement = document.querySelector('.user-balance');
    if (balanceElement) {
      currentBalance = parseFloat(balanceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
    }
    
    // Récupérer le bouton "CONTINUER"
    const transferForm = document.getElementById('transfer-form');
    const submitButton = transferForm ? transferForm.querySelector('button[type="submit"]') : null;
    
    montantInput.addEventListener('input', (e) => {
      const montant = parseFloat(e.target.value);
      
      // Réinitialiser les styles
      montantInput.style.borderColor = '';
      validationMessage.textContent = '';
      validationMessage.className = 'tw-text-3 d-block tw-mt-2';
      
      // Par défaut, réactiver le bouton si le champ est vide
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="ph ph-arrow-right"></i> CONTINUER';
      }
      
      // Si le champ est vide
      if (!e.target.value || e.target.value.trim() === '') {
        return;
      }
      
      // Si ce n'est pas un nombre valide
      if (isNaN(montant)) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = '<i class="ph ph-warning-circle"></i> Veuillez entrer un montant valide';
        
        // ✅ DÉSACTIVER LE BOUTON
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="ph ph-x-circle"></i> Montant invalide';
        }
        return;
      }
      
      // Si le montant est négatif ou zéro
      if (montant <= 0) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = '<i class="ph ph-warning-circle"></i> Le montant doit être supérieur à 0 €';
        
        // ✅ DÉSACTIVER LE BOUTON
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="ph ph-x-circle"></i> Montant invalide';
        }
        return;
      }
      
      // ✅ SI LE MONTANT DÉPASSE LE SOLDE - DÉSACTIVER LE BOUTON
      if (montant > currentBalance) {
        montantInput.style.borderColor = '#dc3545';
        validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-danger fw-semibold';
        validationMessage.innerHTML = `<i class="ph ph-warning-circle"></i> Solde insuffisant ! Il vous manque ${(montant - currentBalance).toFixed(2)} €`;
        
        // ✅ DÉSACTIVER LE BOUTON
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.innerHTML = '<i class="ph ph-lock"></i> Solde insuffisant';
          submitButton.style.cursor = 'not-allowed';
          submitButton.style.opacity = '0.6';
        }
        return;
      }
      
      // ✅ SI TOUT EST OK - RÉACTIVER LE BOUTON
      montantInput.style.borderColor = '#28a745';
      validationMessage.className = 'tw-text-3 d-block tw-mt-2 text-success fw-semibold';
      validationMessage.innerHTML = `<i class="ph ph-check-circle"></i> Montant valide - Reste après virement : ${(currentBalance - montant).toFixed(2)} €`;
      
      // ✅ RÉACTIVER LE BOUTON
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="ph ph-arrow-right"></i> CONTINUER';
        submitButton.style.cursor = 'pointer';
        submitButton.style.opacity = '1';
      }
    });
    
    // Mettre à jour le solde quand il change
    const updateBalance = () => {
      const balanceElement = document.querySelector('.user-balance');
      if (balanceElement) {
        const newBalance = parseFloat(balanceElement.textContent.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (newBalance !== currentBalance) {
          currentBalance = newBalance;
          // Re-valider le montant avec le nouveau solde
          montantInput.dispatchEvent(new Event('input'));
        }
      }
    };
    
    // Observer les changements du solde
    const observer = new MutationObserver(updateBalance);
    if (balanceElement) {
      observer.observe(balanceElement, { childList: true, characterData: true, subtree: true });
    }
  }
}

// ========================================
// 👥 CHARGER LES BÉNÉFICIAIRES
// ========================================
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

// ========================================
// 📋 AFFICHER LES BÉNÉFICIAIRES DANS LE SELECT
// ========================================
function displayBeneficiairesSelect(beneficiaires) {
  const selectElement = document.getElementById('beneficiaire-select');
  const transferForm = document.getElementById('transfer-form');

  if (!selectElement) return;

  // Supprimer l'ancienne alerte de sécurité si elle existe
  const oldAlert = selectElement.parentElement.querySelector('.security-alert');
  if (oldAlert) {
    oldAlert.remove();
  }

  // ========================================
  // CAS 1 : AUCUN BÉNÉFICIAIRE VALIDÉ
  // ========================================
  if (beneficiaires.length === 0) {
    selectElement.innerHTML = `
      <option value="" disabled selected>
        ❌ Aucun IBAN validé - Cliquez ici pour en ajouter
      </option>
    `;
    
    selectElement.style.cursor = 'pointer';
    
    let redirectTimeout = null;
    
    // Fonction de redirection
    const handleClick = () => {
      if (redirectTimeout) return; // Éviter les clics multiples
      
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
    
    // Ajouter les événements de redirection
    selectElement.addEventListener('click', handleClick);
    selectElement.addEventListener('focus', handleClick);

    // Ajouter une alerte de sécurité
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

    // Désactiver le bouton de soumission
    const submitButton = transferForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.innerHTML = '<i class="ph ph-lock"></i> Ajoutez un bénéficiaire d\'abord';
    }

    return;
  }

  // ========================================
  // CAS 2 : BÉNÉFICIAIRES DISPONIBLES
  // ========================================
  selectElement.style.cursor = 'default';
  selectElement.disabled = false;

  selectElement.innerHTML = `
    <option value="" disabled selected>Sélectionnez un bénéficiaire</option>
    ${beneficiaires.map(b => `
      <option value="${b.id}" data-nom="${b.nom}" data-iban="${b.iban}">
        ${b.nom} - ${formatIBAN(b.iban)}
      </option>
    `).join('')}
  `;

  // Réactiver le bouton de soumission
  const submitButton = transferForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="ph ph-arrow-right"></i> CONTINUER';
  }

  // Afficher l'IBAN au changement de sélection
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

// ========================================
// 📝 ÉTAPE 1 : FORMULAIRE DÉTAILS
// ========================================
function setupStep1Form() {
  const form = document.getElementById('transfer-form');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const beneficiaireSelect = document.getElementById('beneficiaire-select');
      const montant = document.getElementById('montant').value.trim();
      const description = document.getElementById('description').value.trim();

      if (!beneficiaireSelect.value || !montant || !description) {
        alert('⚠️ Veuillez remplir tous les champs');
        return;
      }

      const amount = parseFloat(montant);
      if (isNaN(amount) || amount <= 0) {
        alert('⚠️ Le montant doit être un nombre positif');
        return;
      }

      // Récupérer les infos du bénéficiaire
      const selectedOption = beneficiaireSelect.options[beneficiaireSelect.selectedIndex];
      
      // Stocker les données
      transferData = {
        beneficiaireId: parseInt(beneficiaireSelect.value),
        beneficiaireNom: selectedOption.dataset.nom,
        beneficiaireIban: selectedOption.dataset.iban,
        montant: amount,
        description: description
      };

      console.log('📦 Données de virement stockées:', transferData);

      // Passer à l'animation
      showLoadingAnimation();
    });
  }
}

// ========================================
// ⏳ ANIMATION DE CHARGEMENT
// ========================================
function showLoadingAnimation() {
  const step1 = document.getElementById('transfer-form');
  const loading = document.getElementById('loading-animation');
  const step2 = document.getElementById('transfer-form-step2');

  console.log('🔍 Vérification des éléments:');
  console.log('  - step1:', !!step1);
  console.log('  - loading:', !!loading);
  console.log('  - step2:', !!step2);

  if (!step1 || !loading || !step2) {
    console.error('❌ Un ou plusieurs éléments sont manquants !');
    return;
  }

  // Masquer étape 1
  step1.style.display = 'none';
  
  // Afficher animation
  loading.style.display = 'block';

  // Messages qui défilent
  const messages = [
    { text: '🔍 Vérification du compte bénéficiaire...', progress: 20 },
    { text: '✅ Compte bénéficiaire validé', progress: 40 },
    { text: '💰 Validation du montant...', progress: 60 },
    { text: '🔐 Préparation de la transaction sécurisée...', progress: 80 },
    { text: '✅ Tout est prêt ! En attente du code OTP...', progress: 100 }
  ];

  let currentIndex = 0;
  const messageElement = document.getElementById('loading-message');
  const progressBar = document.getElementById('loading-progress');

  const interval = setInterval(() => {
    if (currentIndex < messages.length) {
      const current = messages[currentIndex];
      messageElement.textContent = current.text;
      progressBar.style.width = current.progress + '%';
      progressBar.setAttribute('aria-valuenow', current.progress);
      currentIndex++;
    } else {
      clearInterval(interval);
      
      // Passer à l'étape 2 après un court délai
      setTimeout(() => {
        loading.style.display = 'none';
        step2.style.display = 'block';
        
        // Remplir le récapitulatif
        fillRecapitulatif();
        
        // Focus sur le champ OTP
        document.getElementById('code-otp').focus();
      }, 500);
    }
  }, 800); // Chaque message s'affiche pendant 800ms
}

// ========================================
// 📊 REMPLIR LE RÉCAPITULATIF
// ========================================
function fillRecapitulatif() {
  document.getElementById('recap-beneficiaire').textContent = transferData.beneficiaireNom;
  document.getElementById('recap-montant').textContent = transferData.montant.toFixed(2) + ' €';
  document.getElementById('recap-description').textContent = transferData.description;
}

// ========================================
// 🔐 ÉTAPE 2 : VALIDATION CODE OTP
// ========================================
function setupStep2Validation() {
  const codeInput = document.getElementById('code-otp');
  const validateBtn = document.getElementById('btn-validate-transfer');
  const backBtn = document.getElementById('btn-back-step1');

  // Validation visuelle du code
  if (codeInput) {
    codeInput.addEventListener('input', (e) => {
      const value = e.target.value;
      const icon = document.getElementById('otp-valid-icon');
      
      if (/^\d{6}$/.test(value)) {
        codeInput.style.borderColor = '#28a745';
        codeInput.style.backgroundColor = '#d4edda';
        if (icon) icon.style.display = 'block';
      } else {
        codeInput.style.borderColor = '';
        codeInput.style.backgroundColor = '#f8f9fa';
        if (icon) icon.style.display = 'none';
      }
    });
  }

  // Bouton retour
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      document.getElementById('transfer-form-step2').style.display = 'none';
      document.getElementById('transfer-form').style.display = 'block';
      document.getElementById('code-otp').value = '';
    });
  }

  // Bouton validation
  if (validateBtn) {
    validateBtn.addEventListener('click', async () => {
      const codeOtp = document.getElementById('code-otp').value.trim();

      if (!codeOtp) {
        alert('⚠️ Veuillez entrer le code OTP');
        return;
      }

      if (!/^\d{6}$/.test(codeOtp)) {
        alert('❌ Le code OTP doit contenir exactement 6 chiffres');
        return;
      }

      if (!confirm(`Confirmer le virement de ${transferData.montant.toFixed(2)} € vers ${transferData.beneficiaireNom} ?`)) {
        return;
      }

      // Désactiver le bouton
      const originalHTML = validateBtn.innerHTML;
      validateBtn.disabled = true;
      validateBtn.innerHTML = '<i class="ph ph-circle-notch ph-spin"></i> Virement en cours...';

      try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/client/transfer', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            beneficiaireId: transferData.beneficiaireId,
            montant: transferData.montant,
            description: transferData.description,
            codeOtp: codeOtp
          })
        });

        const data = await response.json();

        if (response.ok) {
          alert(`✅ ${data.message}\n\n💰 Montant : ${data.virement.montant} €\n👤 Bénéficiaire : ${data.virement.beneficiaire}\n🔄 IBAN : ${formatIBAN(data.virement.iban)}\n🔐 Code utilisé : ${data.virement.codeUtilise}\n💵 Nouveau solde : ${data.virement.nouveauSolde} €`);

          // Réinitialiser tout
          document.getElementById('transfer-form').reset();
          document.getElementById('code-otp').value = '';
          
          await loadUserBalance();

          setTimeout(() => {
            window.location.href = '/dashboard.html';
          }, 2000);

        } else {
          alert('❌ ' + data.message);
          validateBtn.disabled = false;
          validateBtn.innerHTML = originalHTML;
        }

      } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur de connexion au serveur');
        validateBtn.disabled = false;
        validateBtn.innerHTML = originalHTML;
      }
    });
  }
}

// ========================================
// 🔧 UTILITAIRES
// ========================================
function formatIBAN(iban) {
  return iban.replace(/(.{4})/g, '$1 ').trim();
}