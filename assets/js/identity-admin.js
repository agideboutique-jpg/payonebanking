// ========================================
// 🆔 GESTION VÉRIFICATION D'IDENTITÉ - ADMIN
// ========================================

// Variables globales
let currentFilter = 'en_attente';
let allVerifications = [];
let documentModal;
let refuseModal;

// ========================================
// 🚀 INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🆔 Initialisation admin vérifications d\'identité');
    
    // Initialiser les modals Bootstrap
    documentModal = new bootstrap.Modal(document.getElementById('documentModal'));
    refuseModal = new bootstrap.Modal(document.getElementById('refuseModal'));
    
    loadVerifications();
    setupFilters();
    setupRefuseModal();
    setupLogout();
});

// ========================================
// 📥 CHARGER LES VÉRIFICATIONS
// ========================================
async function loadVerifications() {
    try {
        console.log('📥 Chargement des vérifications...');
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/identity/admin/all', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erreur chargement');
        }

        const data = await response.json();
        allVerifications = data.verifications;
        
        console.log('✅ Vérifications chargées:', allVerifications.length);
        
        updateStats();
        displayVerifications();
        
    } catch (error) {
        console.error('❌ Erreur chargement:', error);
        document.getElementById('verificationsList').innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Erreur lors du chargement des vérifications
            </div>
        `;
    }
}

// ========================================
// 📊 METTRE À JOUR LES STATISTIQUES
// ========================================
function updateStats() {
    const enAttente = allVerifications.filter(v => v.statut === 'en_attente').length;
    const valide = allVerifications.filter(v => v.statut === 'valide').length;
    const refuse = allVerifications.filter(v => v.statut === 'refuse').length;
    
    document.getElementById('statEnAttente').textContent = enAttente;
    document.getElementById('statValide').textContent = valide;
    document.getElementById('statRefuse').textContent = refuse;
}

// ========================================
// 🔍 FILTRES
// ========================================
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Retirer active de tous les boutons
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Activer ce bouton
            this.classList.add('active');
            
            // Récupérer le filtre
            currentFilter = this.getAttribute('data-filter');
            console.log('🔍 Filtre:', currentFilter);
            
            // Afficher les vérifications filtrées
            displayVerifications();
        });
    });
}

// ========================================
// 📋 AFFICHER LES VÉRIFICATIONS
// ========================================
function displayVerifications() {
    const container = document.getElementById('verificationsList');
    
    // Filtrer les vérifications
    let filtered = allVerifications;
    if (currentFilter !== 'all') {
        filtered = allVerifications.filter(v => v.statut === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Aucune vérification avec le statut "${currentFilter === 'all' ? 'toutes' : currentFilter}"
            </div>
        `;
        return;
    }
    
    let html = '';
    
    filtered.forEach(verification => {
        const badgeClass = `badge-${verification.statut}`;
        const user = verification.user;
        
        html += `
            <div class="verification-card">
                <div class="row">
                    <div class="col-md-8">
                        <div class="client-info">
                            <h5><i class="fas fa-user"></i> ${user.nom}</h5>
                            <p class="mb-1">
                                <strong>Email:</strong> ${user.email}<br>
                                <strong>Téléphone:</strong> ${user.telephone || 'N/A'}<br>
                                <strong>Type de document:</strong> ${formatDocType(verification.typeDocument)}<br>
                                <strong>Date de soumission:</strong> ${formatDate(verification.dateSoumission)}
                            </p>
                        </div>
                        
                        <span class="badge ${badgeClass} mb-3">
                            ${formatStatut(verification.statut)}
                        </span>
                        
                        ${verification.dateValidation ? `
                            <p class="mb-1"><strong>Traité le:</strong> ${formatDate(verification.dateValidation)}</p>
                        ` : ''}
                        
                        ${verification.validateur ? `
                            <p class="mb-1"><strong>Par:</strong> ${verification.validateur.nom}</p>
                        ` : ''}
                        
                        ${verification.raisonRefus ? `
                            <div class="alert alert-danger mt-2">
                                <strong>Raison du refus:</strong><br>
                                ${verification.raisonRefus}
                            </div>
                        ` : ''}
                        
                        ${verification.commentaireAdmin ? `
                            <div class="alert alert-info mt-2">
                                <strong>Commentaire:</strong><br>
                                ${verification.commentaireAdmin}
                            </div>
                        ` : ''}
                        
                        <div class="action-buttons">
                            <button class="btn btn-primary" onclick="viewDocuments(${verification.id})">
                                <i class="fas fa-eye"></i> Voir les documents
                            </button>
                            
                            ${verification.statut === 'en_attente' ? `
                                <button class="btn btn-success" onclick="validateVerification(${verification.id})">
                                    <i class="fas fa-check"></i> Valider
                                </button>
                                <button class="btn btn-danger" onclick="openRefuseModal(${verification.id})">
                                    <i class="fas fa-times"></i> Refuser
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="col-md-4">
                        <h6>Aperçu Photo de Profil</h6>
                        <img src="http://localhost:5000/api/identity/admin/image/profile-photos/${verification.photoProfile}" 
                             class="document-preview" 
                             onclick="viewImage('http://localhost:5000/api/identity/admin/image/profile-photos/${verification.photoProfile}')"
                             alt="Photo de profil">
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========================================
// 👁️ VOIR LES DOCUMENTS EN DÉTAIL
// ========================================
function viewDocuments(verificationId) {
    const verification = allVerifications.find(v => v.id === verificationId);
    if (!verification) return;
    
    const user = verification.user;
    const baseUrl = 'http://localhost:5000/api/identity/admin/image';
    
    let html = `
        <div class="client-info">
            <h4><i class="fas fa-user"></i> ${user.nom}</h4>
            <p>
                <strong>Email:</strong> ${user.email}<br>
                <strong>Téléphone:</strong> ${user.telephone || 'N/A'}<br>
                <strong>Type de document:</strong> ${formatDocType(verification.typeDocument)}
            </p>
        </div>
        
        <h5 class="mt-4 mb-3">Documents soumis</h5>
        
        <div class="comparison-section">
            <div>
                <h6>Document ${verification.typeDocument === 'passeport' ? '(Page d\'identité)' : '(Recto)'}</h6>
                <img src="${baseUrl}/identity-documents/${verification.documentRecto}" 
                     class="document-preview" 
                     onclick="viewImage('${baseUrl}/identity-documents/${verification.documentRecto}')"
                     alt="Document recto">
            </div>
            
            ${verification.documentVerso ? `
                <div>
                    <h6>Document (Verso)</h6>
                    <img src="${baseUrl}/identity-documents/${verification.documentVerso}" 
                         class="document-preview" 
                         onclick="viewImage('${baseUrl}/identity-documents/${verification.documentVerso}')"
                         alt="Document verso">
                </div>
            ` : ''}
        </div>
        
        <h5 class="mt-4 mb-3">Photo de Profil</h5>
        <div class="text-center">
            <img src="${baseUrl}/profile-photos/${verification.photoProfile}" 
                 class="document-preview" 
                 style="max-width: 300px;"
                 onclick="viewImage('${baseUrl}/profile-photos/${verification.photoProfile}')"
                 alt="Photo de profil">
        </div>
        
        ${verification.statut === 'en_attente' ? `
            <div class="action-buttons">
                <button class="btn btn-success btn-lg" onclick="validateVerification(${verification.id})">
                    <i class="fas fa-check-circle"></i> Valider cette vérification
                </button>
                <button class="btn btn-danger btn-lg" onclick="openRefuseModal(${verification.id})">
                    <i class="fas fa-times-circle"></i> Refuser cette vérification
                </button>
            </div>
        ` : `
            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle"></i>
                Cette vérification a déjà été traitée (Statut: ${formatStatut(verification.statut)})
            </div>
        `}
    `;
    
    document.getElementById('modalContent').innerHTML = html;
    documentModal.show();
}

// ========================================
// 🖼️ VOIR UNE IMAGE EN PLEIN ÉCRAN
// ========================================
function viewImage(url) {
    window.open(url, '_blank');
}

// ========================================
// ✅ VALIDER UNE VÉRIFICATION
// ========================================
async function validateVerification(verificationId) {
    if (!confirm('Êtes-vous sûr de vouloir VALIDER cette vérification d\'identité ?')) {
        return;
    }
    
    const commentaire = prompt('Commentaire (optionnel) :');
    
    try {
        console.log('✅ Validation de la vérification:', verificationId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/identity/admin/${verificationId}/validate`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                commentaireAdmin: commentaire
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('✅ Vérification validée');
            alert('✅ ' + data.message);
            
            // Fermer le modal
            documentModal.hide();
            
            // Recharger
            await loadVerifications();
            
        } else {
            alert('❌ ' + data.message);
        }
        
    } catch (error) {
        console.error('❌ Erreur validation:', error);
        alert('❌ Erreur lors de la validation');
    }
}

// ========================================
// ❌ REFUSER UNE VÉRIFICATION
// ========================================
function openRefuseModal(verificationId) {
    document.getElementById('refuseVerificationId').value = verificationId;
    document.getElementById('raisonRefus').value = '';
    document.getElementById('commentaireRefus').value = '';
    
    // Fermer le modal des documents s'il est ouvert
    documentModal.hide();
    
    // Ouvrir le modal de refus
    refuseModal.show();
}

function setupRefuseModal() {
    const confirmBtn = document.getElementById('confirmRefuseBtn');
    
    confirmBtn.addEventListener('click', async function() {
        const verificationId = document.getElementById('refuseVerificationId').value;
        const raisonRefus = document.getElementById('raisonRefus').value.trim();
        const commentaireRefus = document.getElementById('commentaireRefus').value.trim();
        
        // Validation
        if (!raisonRefus || raisonRefus.length < 10) {
            alert('❌ La raison du refus doit contenir au moins 10 caractères');
            return;
        }
        
        try {
            console.log('❌ Refus de la vérification:', verificationId);
            
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:5000/api/identity/admin/${verificationId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    raisonRefus: raisonRefus,
                    commentaireAdmin: commentaireRefus || null
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Vérification refusée');
                alert('✅ ' + data.message);
                
                // Fermer le modal
                refuseModal.hide();
                
                // Recharger
                await loadVerifications();
                
            } else {
                alert('❌ ' + data.message);
            }
            
        } catch (error) {
            console.error('❌ Erreur refus:', error);
            alert('❌ Erreur lors du refus');
        }
    });
}

// ========================================
// 🚪 DÉCONNEXION
// ========================================
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            window.location.href = 'admin-login.html';
        });
    }
}

// ========================================
// 🛠️ FONCTIONS UTILITAIRES
// ========================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatDocType(type) {
    const types = {
        'carte_identite': 'Carte d\'Identité',
        'passeport': 'Passeport',
        'permis_conduire': 'Permis de Conduire'
    };
    return types[type] || type;
}

function formatStatut(statut) {
    const statuts = {
        'en_attente': '⏳ En attente',
        'valide': '✅ Validé',
        'refuse': '❌ Refusé'
    };
    return statuts[statut] || statut;
}