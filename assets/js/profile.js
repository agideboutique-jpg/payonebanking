// ========================================
// 👤 GESTION DU PROFIL CLIENT
// assets/js/profile.js
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Init page profil');
    
    loadUserProfile();
    setupEditModes();
    setupPasswordForm();
    setupLogout();
});

// ========================================
// 📥 CHARGER LE PROFIL
// ========================================
async function loadUserProfile() {
    try {
        console.log('📥 Chargement du profil...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/log-in.html';
            return;
        }

        const response = await fetch('http://localhost:5000/api/client/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/log-in.html';
            }
            throw new Error('Erreur chargement profil');
        }

        const data = await response.json();
        const user = data.user;
        
        console.log('✅ Profil chargé:', user);

        // Remplir tous les champs
        fillProfileData(user);

    } catch (error) {
        console.error('❌ Erreur:', error);
        alert('Erreur lors du chargement du profil');
    }
}

// ========================================
// 📝 REMPLIR LES DONNÉES
// ========================================
function fillProfileData(user) {
    // Sidebar
    document.querySelectorAll('.user-name').forEach(el => {
        el.textContent = `${user.prenom} ${user.nom}`;
    });
    document.querySelectorAll('.user-email').forEach(el => {
        el.textContent = user.email;
    });
    
    // Infos personnelles
    setValue('nom', user.nom);
    setValue('prenom', user.prenom);
    setValue('dateNaissance', user.dateNaissance);
    setValue('lieuNaissance', user.lieuNaissance);
    setValue('nationalite', user.nationalite);
    setValue('numeroSecuriteSociale', user.numeroSecuriteSociale);
    setValue('situationFamiliale', user.situationFamiliale);
    
    // Coordonnées
    setValue('numeroRue', user.numeroRue);
    setValue('nomRue', user.nomRue);
    setValue('complementAdresse', user.complementAdresse);
    setValue('ville', user.ville);
    setValue('codePostal', user.codePostal);
    setValue('pays', user.pays);
    setValue('telephoneFixe', user.telephoneFixe);
    setValue('telephoneMobile', user.telephoneMobile);
    setValue('email', user.email);
    
    // Situation pro
    setValue('statutProfessionnel', user.statutProfessionnel);
    setValue('revenusMensuels', user.revenusMensuels);
    setValue('typeContrat', user.typeContrat);
}

function setValue(id, value) {
    const element = document.getElementById(id);
    if (element && value != null) {
        element.value = value;
    }
}

// ========================================
// ✏️ MODES ÉDITION
// ========================================
function setupEditModes() {
    // COORDONNÉES
    const btnEditContact = document.getElementById('btn-edit-contact');
    const btnCancelContact = document.getElementById('btn-cancel-contact');
    const formContact = document.getElementById('form-contact');
    const contactButtons = document.getElementById('contact-buttons');
    
    if (btnEditContact) {
        btnEditContact.addEventListener('click', function() {
            // Activer l'édition
            formContact.querySelectorAll('input').forEach(input => {
                input.removeAttribute('readonly');
            });
            btnEditContact.style.display = 'none';
            contactButtons.style.display = 'block';
        });
    }
    
    if (btnCancelContact) {
        btnCancelContact.addEventListener('click', function() {
            // Annuler - recharger les données
            loadUserProfile();
            // Désactiver l'édition
            formContact.querySelectorAll('input').forEach(input => {
                input.setAttribute('readonly', true);
            });
            btnEditContact.style.display = 'block';
            contactButtons.style.display = 'none';
        });
    }
    
    if (formContact) {
        formContact.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProfile('contact');
        });
    }
    
    // SITUATION PRO
    const btnEditPro = document.getElementById('btn-edit-pro');
    const btnCancelPro = document.getElementById('btn-cancel-pro');
    const formPro = document.getElementById('form-pro');
    const proButtons = document.getElementById('pro-buttons');
    
    if (btnEditPro) {
        btnEditPro.addEventListener('click', function() {
            formPro.querySelectorAll('select').forEach(select => {
                select.removeAttribute('disabled');
            });
            btnEditPro.style.display = 'none';
            proButtons.style.display = 'block';
        });
    }
    
    if (btnCancelPro) {
        btnCancelPro.addEventListener('click', function() {
            loadUserProfile();
            formPro.querySelectorAll('select').forEach(select => {
                select.setAttribute('disabled', true);
            });
            btnEditPro.style.display = 'block';
            proButtons.style.display = 'none';
        });
    }
    
    if (formPro) {
        formPro.addEventListener('submit', async function(e) {
            e.preventDefault();
            await updateProfile('pro');
        });
    }
}

// ========================================
// 💾 METTRE À JOUR LE PROFIL
// ========================================
async function updateProfile(section) {
    try {
        console.log('💾 Mise à jour section:', section);
        
        const token = localStorage.getItem('token');
        let data = {};
        
        if (section === 'contact') {
            data = {
                numeroRue: document.getElementById('numeroRue').value,
                nomRue: document.getElementById('nomRue').value,
                complementAdresse: document.getElementById('complementAdresse').value,
                ville: document.getElementById('ville').value,
                codePostal: document.getElementById('codePostal').value,
                pays: document.getElementById('pays').value,
                telephoneFixe: document.getElementById('telephoneFixe').value,
                telephoneMobile: document.getElementById('telephoneMobile').value,
                email: document.getElementById('email').value
            };
        } else if (section === 'pro') {
            data = {
                statutProfessionnel: document.getElementById('statutProfessionnel').value,
                revenusMensuels: document.getElementById('revenusMensuels').value,
                typeContrat: document.getElementById('typeContrat').value
            };
        }
        
        console.log('📦 Données:', data);
        
        const response = await fetch('http://localhost:5000/api/client/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Profil mis à jour');
            alert('✅ ' + result.message);
            
            // Recharger et revenir en mode lecture
            await loadUserProfile();
            
            if (section === 'contact') {
                document.getElementById('form-contact').querySelectorAll('input').forEach(input => {
                    input.setAttribute('readonly', true);
                });
                document.getElementById('btn-edit-contact').style.display = 'block';
                document.getElementById('contact-buttons').style.display = 'none';
            } else if (section === 'pro') {
                document.getElementById('form-pro').querySelectorAll('select').forEach(select => {
                    select.setAttribute('disabled', true);
                });
                document.getElementById('btn-edit-pro').style.display = 'block';
                document.getElementById('pro-buttons').style.display = 'none';
            }
        } else {
            console.error('❌ Erreur:', result.message);
            alert('❌ ' + result.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur réseau:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========================================
// 🔒 CHANGEMENT DE MOT DE PASSE
// ========================================
function setupPasswordForm() {
    const form = document.getElementById('form-password');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('🔒 Changement de mot de passe...');
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (newPassword !== confirmPassword) {
            alert('❌ Les nouveaux mots de passe ne correspondent pas');
            return;
        }
        
        if (newPassword.length < 8) {
            alert('❌ Le mot de passe doit contenir au moins 8 caractères');
            return;
        }
        
        // Vérifier la complexité
        const hasUpper = /[A-Z]/.test(newPassword);
        const hasLower = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
        
        if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
            alert('❌ Le mot de passe doit contenir 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial');
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/client/change-password', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Mot de passe changé');
                alert('✅ ' + result.message);
                form.reset();
            } else {
                console.error('❌ Erreur:', result.message);
                alert('❌ ' + result.message);
            }
            
        } catch (error) {
            console.error('❌ Erreur réseau:', error);
            alert('❌ Erreur de connexion au serveur');
        }
    });
}

// ========================================
// 🚪 DÉCONNEXION
// ========================================
function setupLogout() {
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('👋 Déconnexion...');
            
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            
            window.location.href = '/log-in.html';
        });
    });
}

console.log('✅ profile.js chargé');