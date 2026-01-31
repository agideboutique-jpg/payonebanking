// ========================================
// 📝 FORMULAIRE D'INSCRIPTION MULTI-ÉTAPES
// assets/js/signup-multi.js
// ========================================

let currentStep = 1;
const totalSteps = 4;

// ========================================
// 🚀 INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Init formulaire inscription');
    
    loadCountries();
    setupValidation();
    setupConditionalFields();
    setupPasswordToggles();
    setupFormSubmission();
});

// ========================================
// 🌍 CHARGER LES PAYS
// ========================================
function loadCountries() {
    const select = document.getElementById('pays');
    if (!select || typeof countries === 'undefined') return;
    
    select.innerHTML = '<option value="">Sélectionnez...</option>';
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        if (country === 'France') option.selected = true;
        select.appendChild(option);
    });
}

// ========================================
// 🎯 NAVIGATION ÉTAPES
// ========================================
function nextStep() {
    if (!validateStep(currentStep)) return;
    
    if (currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
    }
}

function showStep(step) {
    // Cacher toutes les étapes
    document.querySelectorAll('.form-step').forEach(s => {
        s.classList.remove('active');
    });
    
    // Afficher l'étape demandée
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (stepElement) {
        stepElement.classList.add('active');
    }
    
    // Mettre à jour l'indicateur
    document.querySelectorAll('.step').forEach((el, index) => {
        el.classList.remove('active', 'completed');
        if (index + 1 === step) {
            el.classList.add('active');
        } else if (index + 1 < step) {
            el.classList.add('completed');
        }
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// ✅ VALIDATION
// ========================================
function validateStep(step) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    const inputs = stepElement.querySelectorAll('input[required], select[required]');
    
    let valid = true;
    inputs.forEach(input => {
        if (!validateField(input)) {
            valid = false;
        }
    });
    
    return valid;
}

function validateField(field) {
    const value = field.value.trim();
    const name = field.name;
    let isValid = true;
    let message = '';
    
    // Champs obligatoires
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = 'Ce champ est obligatoire';
    }
    
    // Email
    else if (name === 'email' && value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            isValid = false;
            message = 'Email invalide';
        }
    }
    
    // Date de naissance (18+ ans)
    else if (name === 'dateNaissance' && value) {
        const birthDate = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        if (age < 18) {
            isValid = false;
            message = 'Vous devez avoir au moins 18 ans';
        }
    }
    
    // Téléphone
    else if ((name === 'telephoneMobile' || name === 'telephoneFixe') && value) {
        const cleaned = value.replace(/[\s\-\(\)\.]/g, '');
        if (cleaned.length < 10) {
            isValid = false;
            message = 'Numéro invalide';
        }
    }
    
    // Mot de passe
    else if (name === 'password' && value) {
        if (value.length < 8) {
            isValid = false;
            message = 'Au moins 8 caractères';
        } else if (!/[A-Z]/.test(value)) {
            isValid = false;
            message = 'Au moins 1 majuscule';
        } else if (!/[a-z]/.test(value)) {
            isValid = false;
            message = 'Au moins 1 minuscule';
        } else if (!/[0-9]/.test(value)) {
            isValid = false;
            message = 'Au moins 1 chiffre';
        } else if (!/[^A-Za-z0-9]/.test(value)) {
            isValid = false;
            message = 'Au moins 1 caractère spécial';
        }
    }
    
    // Confirmation mot de passe
    else if (name === 'confirmPassword' && value) {
        const password = document.getElementById('password').value;
        if (value !== password) {
            isValid = false;
            message = 'Les mots de passe ne correspondent pas';
        }
    }
    
    // Checkbox
    else if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        isValid = false;
        message = 'Vous devez accepter';
    }
    
    // Appliquer le style
    if (!isValid) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        const feedback = field.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = message;
        }
    } else {
        field.classList.remove('is-invalid');
        if (value) field.classList.add('is-valid');
    }
    
    return isValid;
}

function setupValidation() {
    const form = document.getElementById('signup-form');
    
    form.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('blur', function() {
            if (this.value) validateField(this);
        });
        
        field.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                validateField(this);
            }
        });
    });
}

// ========================================
// 🔄 CHAMPS CONDITIONNELS
// ========================================
function setupConditionalFields() {
    const statut = document.getElementById('statutProfessionnel');
    const typeContratGroup = document.getElementById('typeContratGroup');
    const typeContrat = document.getElementById('typeContrat');
    
    if (statut && typeContratGroup) {
        statut.addEventListener('change', function() {
            if (this.value === 'salarie') {
                typeContratGroup.style.display = 'block';
                typeContrat.required = true;
            } else {
                typeContratGroup.style.display = 'none';
                typeContrat.required = false;
                typeContrat.value = 'non_applicable';
            }
        });
    }
}

// ========================================
// 👁️ AFFICHER/MASQUER MOT DE PASSE
// ========================================
function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('ph-eye-slash');
                this.classList.add('ph-eye');
            } else {
                input.type = 'password';
                this.classList.remove('ph-eye');
                this.classList.add('ph-eye-slash');
            }
        });
    });
}

// ========================================
// 📤 SOUMISSION
// ========================================
function setupFormSubmission() {
    const form = document.getElementById('signup-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('📤 Soumission...');
        
        // Vérifier CGU
        const terms = document.getElementById('acceptTerms');
        if (!terms.checked) {
            alert('❌ Vous devez accepter les conditions');
            return;
        }
        
        // Valider dernière étape
        if (!validateStep(currentStep)) {
            alert('❌ Veuillez corriger les erreurs');
            return;
        }
        
        // Récupérer les données
        const formData = new FormData(form);
        const data = {};
        
        formData.forEach((value, key) => {
            if (key !== 'confirmPassword') {
                data[key] = value;
            }
        });
        
        console.log('📦 Données:', data);
        
        // UI Loading
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const submitSpinner = document.getElementById('submitSpinner');
        
        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'inline-block';
        
        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Inscription réussie');
                alert('✅ ' + result.message + '\n\nRedirection vers la connexion...');
                
                setTimeout(() => {
                    window.location.href = '/log-in.html';
                }, 1500);
            } else {
                console.error('❌ Erreur:', result.message);
                alert('❌ ' + result.message);
                
                submitBtn.disabled = false;
                submitText.style.display = 'inline-block';
                submitSpinner.style.display = 'none';
            }
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('❌ Erreur de connexion au serveur');
            
            submitBtn.disabled = false;
            submitText.style.display = 'inline-block';
            submitSpinner.style.display = 'none';
        }
    });
}

console.log('✅ signup-multi.js chargé');