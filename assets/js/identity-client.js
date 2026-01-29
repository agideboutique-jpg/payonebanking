// ========================================
// 🆔 GESTION VÉRIFICATION D'IDENTITÉ - CLIENT
// ========================================

// Variables globales
let selectedDocType = 'carte_identite'; // ✅ PAR DÉFAUT
let uploadedFiles = {
    recto: null,
    verso: null,
    photo: null
};

// ========================================
// 🚀 INITIALISATION
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🆔 Initialisation de la vérification d\'identité');
    
    checkVerificationStatus();
    setupDocumentTypeSelection();
    setupFileUploads();
    setupFormSubmission();
    setupLogout();
    
    // ✅ Sélectionner carte d'identité par défaut
    selectDefaultDocType();
});

// ========================================
// ✅ SÉLECTIONNER CARTE D'IDENTITÉ PAR DÉFAUT
// ========================================
function selectDefaultDocType() {
    console.log('✅ Carte d\'identité sélectionnée par défaut');
    
    // La carte est déjà marquée avec class="selected" dans le HTML
    // On s'assure juste que le hidden input est bien rempli
    document.getElementById('typeDocument').value = 'carte_identite';
    
    // Afficher le verso (carte d'identité = recto + verso obligatoires)
    document.getElementById('versoSection').style.display = 'block';
    document.getElementById('rectoLabel').textContent = '2. Document (Recto)';
    document.getElementById('photoLabel').textContent = '4. Photo de Profil 📸';
    document.getElementById('documentVerso').required = true;
}

// ========================================
// 📊 VÉRIFIER LE STATUT DE VÉRIFICATION
// ========================================
async function checkVerificationStatus() {
    const loadingMessage = document.getElementById('loadingMessage');
    const verificationForm = document.getElementById('verificationForm');
    const statusSection = document.getElementById('statusSection');
    
    try {
        loadingMessage.style.display = 'block';
        
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/identity/status', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.hasVerification) {
            // L'utilisateur a déjà soumis des documents
            displayStatus(data.verification);
            statusSection.style.display = 'block';
            
            // Cacher le formulaire si en attente ou validé
            if (data.verification.statut !== 'refuse') {
                verificationForm.style.display = 'none';
            } else {
                // Permettre une nouvelle soumission si refusé
                verificationForm.style.display = 'block';
            }
        } else {
            // Aucune vérification, afficher le formulaire
            verificationForm.style.display = 'block';
        }
        
        loadingMessage.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Erreur vérification statut:', error);
        loadingMessage.style.display = 'none';
        verificationForm.style.display = 'block';
    }
}

// ========================================
// 📊 AFFICHER LE STATUT DE VÉRIFICATION
// ========================================
function displayStatus(verification) {
    const statusSection = document.getElementById('statusSection');
    
    let statusClass = '';
    let statusIcon = '';
    let statusTitle = '';
    let statusMessage = '';
    
    switch(verification.statut) {
        case 'en_attente':
            statusClass = 'status-en_attente';
            statusIcon = 'ph ph-clock';
            statusTitle = '⏳ Vérification en attente';
            statusMessage = 'Vos documents ont été soumis le ' + formatDate(verification.dateSoumission) + 
                          '. Un administrateur les examinera sous 24-48h.';
            break;
            
        case 'valide':
            statusClass = 'status-valide';
            statusIcon = 'ph ph-check-circle';
            statusTitle = '✅ Identité vérifiée';
            statusMessage = 'Votre identité a été validée le ' + formatDate(verification.dateValidation) + 
                          '. Votre compte est maintenant totalement sécurisé !';
            break;
            
        case 'refuse':
            statusClass = 'status-refuse';
            statusIcon = 'ph ph-times-circle';
            statusTitle = '❌ Vérification refusée';
            statusMessage = 'Votre vérification a été refusée le ' + formatDate(verification.dateValidation) + '.';
            break;
    }
    
    let html = `
        <div class="status-card ${statusClass}">
            <div class="d-flex align-items-center mb-3">
                <i class="${statusIcon}" style="font-size: 2rem; margin-right: 15px;"></i>
                <h4 class="mb-0">${statusTitle}</h4>
            </div>
            <p class="mb-2">${statusMessage}</p>
            
            <div class="mt-3">
                <strong>Type de document :</strong> ${formatDocType(verification.typeDocument)}<br>
                <strong>Date de soumission :</strong> ${formatDate(verification.dateSoumission)}
    `;
    
    if (verification.dateValidation) {
        html += `<br><strong>Date de traitement :</strong> ${formatDate(verification.dateValidation)}`;
    }
    
    if (verification.raisonRefus) {
        html += `
            <div class="alert alert-danger mt-3 mb-0">
                <strong>Raison du refus :</strong><br>
                ${verification.raisonRefus}
            </div>
        `;
    }
    
    if (verification.commentaireAdmin) {
        html += `
            <div class="alert alert-info mt-3 mb-0">
                <strong>Commentaire de l'administrateur :</strong><br>
                ${verification.commentaireAdmin}
            </div>
        `;
    }
    
    html += `</div></div>`;
    
    if (verification.statut === 'refuse') {
        html += `
            <div class="alert alert-warning">
                <i class="ph ph-info"></i>
                <strong>Vous pouvez soumettre de nouveaux documents ci-dessous</strong>
            </div>
        `;
    }
    
    statusSection.innerHTML = html;
}

// ========================================
// 📝 SÉLECTION DU TYPE DE DOCUMENT
// ========================================
function setupDocumentTypeSelection() {
    const docTypeCards = document.querySelectorAll('.doc-type-card');
    const typeDocumentInput = document.getElementById('typeDocument');
    const versoSection = document.getElementById('versoSection');
    const rectoLabel = document.getElementById('rectoLabel');
    const photoLabel = document.getElementById('photoLabel');
    
    docTypeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Retirer la sélection des autres cartes
            docTypeCards.forEach(c => c.classList.remove('selected'));
            
            // Sélectionner cette carte
            this.classList.add('selected');
            
            // Récupérer le type
            selectedDocType = this.getAttribute('data-type');
            typeDocumentInput.value = selectedDocType;
            
            console.log('📄 Type de document sélectionné:', selectedDocType);
            
            // Afficher/Cacher le verso selon le type
            if (selectedDocType === 'passeport') {
                versoSection.style.display = 'none';
                rectoLabel.textContent = '2. Page d\'identité du passeport';
                photoLabel.textContent = '3. Photo de Profil 📸';
                document.getElementById('documentVerso').required = false;
            } else {
                versoSection.style.display = 'block';
                rectoLabel.textContent = '2. Document (Recto)';
                photoLabel.textContent = '4. Photo de Profil 📸';
                document.getElementById('documentVerso').required = true;
            }
            
            // Vérifier si le bouton peut être activé
            checkFormValidity();
        });
    });
}

// ========================================
// 📤 GESTION DES UPLOADS DE FICHIERS
// ========================================
function setupFileUploads() {
    // Recto
    setupSingleUpload('recto', 'rectoZone', 'documentRecto', 'rectoPreview', 'removeRecto');
    
    // Verso
    setupSingleUpload('verso', 'versoZone', 'documentVerso', 'versoPreview', 'removeVerso');
    
    // Photo (gestion spéciale avec déverrouillage)
    setupPhotoUpload();
}

function setupSingleUpload(fileKey, zoneId, inputId, previewId, removeId) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    const removeBtn = document.getElementById(removeId);
    
    // Clic sur la zone = clic sur l'input
    zone.addEventListener('click', function(e) {
        if (e.target !== removeBtn && !removeBtn.contains(e.target)) {
            input.click();
        }
    });
    
    // Changement de fichier
    input.addEventListener('change', function(e) {
        handleFileSelect(e, fileKey, zone, preview);
    });
    
    // Drag & Drop
    zone.addEventListener('dragover', function(e) {
        e.preventDefault();
        if (!zone.classList.contains('disabled')) {
            zone.style.borderColor = '#0d6efd';
            zone.style.backgroundColor = '#e7f1ff';
        }
    });
    
    zone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        zone.style.borderColor = '#ddd';
        zone.style.backgroundColor = '';
    });
    
    zone.addEventListener('drop', function(e) {
        e.preventDefault();
        zone.style.borderColor = '#ddd';
        zone.style.backgroundColor = '';
        
        if (!zone.classList.contains('disabled')) {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                input.files = files;
                handleFileSelect({ target: input }, fileKey, zone, preview);
            }
        }
    });
    
    // Bouton supprimer
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        removeFile(fileKey, zone, input, preview);
    });
}

// ========================================
// 📸 GESTION SPÉCIALE PHOTO DE PROFIL
// ========================================
function setupPhotoUpload() {
    const photoZone = document.getElementById('photoZone');
    const photoInput = document.getElementById('photoProfile');
    const photoPreview = document.getElementById('photoPreview');
    const removePhoto = document.getElementById('removePhoto');
    
    // Clic sur la zone (seulement si déverrouillée)
    photoZone.addEventListener('click', function(e) {
        if (!photoZone.classList.contains('disabled') && e.target !== removePhoto && !removePhoto.contains(e.target)) {
            photoInput.click();
        }
    });
    
    // Changement de fichier
    photoInput.addEventListener('change', function(e) {
        handleFileSelect(e, 'photo', photoZone, photoPreview);
    });
    
    // Bouton supprimer
    removePhoto.addEventListener('click', function(e) {
        e.stopPropagation();
        removeFile('photo', photoZone, photoInput, photoPreview);
    });
}

function handleFileSelect(event, fileKey, zone, preview) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Vérifier le type
    if (!file.type.startsWith('image/')) {
        alert('❌ Veuillez sélectionner un fichier image');
        return;
    }
    
    // Vérifier la taille (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        alert('❌ Le fichier est trop volumineux (max 5MB)');
        return;
    }
    
    console.log(`📎 Fichier sélectionné (${fileKey}):`, file.name);
    
    // Stocker le fichier
    uploadedFiles[fileKey] = file;
    
    // Ajouter la classe has-file
    zone.classList.add('has-file');
    
    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = function(e) {
        preview.src = e.target.result;
        preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    
    // ✅ DÉVERROUILLER LA PHOTO SI LES DOCUMENTS SONT UPLOADÉS
    checkAndUnlockPhoto();
    
    // Vérifier la validité du formulaire
    checkFormValidity();
}

function removeFile(fileKey, zone, input, preview) {
    console.log(`🗑️ Suppression du fichier (${fileKey})`);
    
    uploadedFiles[fileKey] = null;
    input.value = '';
    preview.src = '';
    preview.style.display = 'none';
    zone.classList.remove('has-file');
    
    // ✅ REVERROUILLER LA PHOTO SI NÉCESSAIRE
    if (fileKey === 'recto' || fileKey === 'verso') {
        lockPhotoUpload();
    }
    
    checkFormValidity();
}

// ========================================
// 🔓 DÉVERROUILLER LA PHOTO DE PROFIL
// ========================================
function checkAndUnlockPhoto() {
    const photoZone = document.getElementById('photoZone');
    const photoInput = document.getElementById('photoProfile');
    
    // Vérifier si le recto est uploadé
    const rectoUploaded = uploadedFiles.recto !== null;
    
    // Vérifier si le verso est uploadé (seulement si requis)
    let versoUploaded = true;
    if (selectedDocType === 'carte_identite' || selectedDocType === 'permis_conduire') {
        versoUploaded = uploadedFiles.verso !== null;
    }
    
    // Déverrouiller si les documents sont uploadés
    if (rectoUploaded && versoUploaded) {
        console.log('🔓 Déverrouillage de la photo de profil');
        photoZone.classList.remove('disabled');
        photoInput.disabled = false;
        photoZone.style.cursor = 'pointer';
    }
}

// ========================================
// 🔒 VERROUILLER LA PHOTO DE PROFIL
// ========================================
function lockPhotoUpload() {
    const photoZone = document.getElementById('photoZone');
    const photoInput = document.getElementById('photoProfile');
    const photoPreview = document.getElementById('photoPreview');
    
    console.log('🔒 Verrouillage de la photo de profil');
    
    // Réinitialiser la photo si elle était uploadée
    uploadedFiles.photo = null;
    photoInput.value = '';
    photoInput.disabled = true;
    photoPreview.src = '';
    photoPreview.style.display = 'none';
    photoZone.classList.remove('has-file');
    photoZone.classList.add('disabled');
    photoZone.style.cursor = 'not-allowed';
}

// ========================================
// ✅ VÉRIFIER LA VALIDITÉ DU FORMULAIRE
// ========================================
function checkFormValidity() {
    const submitBtn = document.getElementById('submitBtn');
    
    // Vérifier que le type de document est sélectionné
    if (!selectedDocType) {
        submitBtn.disabled = true;
        return;
    }
    
    // Vérifier que le recto et la photo sont présents
    if (!uploadedFiles.recto || !uploadedFiles.photo) {
        submitBtn.disabled = true;
        return;
    }
    
    // Si carte d'identité ou permis, vérifier le verso
    if ((selectedDocType === 'carte_identite' || selectedDocType === 'permis_conduire') && !uploadedFiles.verso) {
        submitBtn.disabled = true;
        return;
    }
    
    // Tout est OK
    submitBtn.disabled = false;
}

// ========================================
// 📤 SOUMISSION DU FORMULAIRE
// ========================================
function setupFormSubmission() {
    const form = document.getElementById('verificationForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        console.log('📤 Soumission des documents...');
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Envoi en cours...';
        
        try {
            // Créer le FormData
            const formData = new FormData();
            formData.append('typeDocument', selectedDocType);
            formData.append('documentRecto', uploadedFiles.recto);
            
            if (uploadedFiles.verso) {
                formData.append('documentVerso', uploadedFiles.verso);
            }
            
            formData.append('photoProfile', uploadedFiles.photo);
            
            // Envoyer la requête
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/identity/submit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
                console.log('✅ Documents soumis avec succès');
                
                // Afficher un message de succès
                alert('✅ ' + data.message);
                
                // Recharger la page pour afficher le statut
                window.location.reload();
                
            } else {
                console.error('❌ Erreur:', data.message);
                alert('❌ ' + data.message);
                
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
            
        } catch (error) {
            console.error('❌ Erreur soumission:', error);
            alert('❌ Erreur lors de l\'envoi des documents. Veuillez réessayer.');
            
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });
}

// ========================================
// 🚪 DÉCONNEXION
// ========================================
function setupLogout() {
    const logoutBtns = document.querySelectorAll('.logout-btn');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userType');
            window.location.href = 'log-in.html';
        });
    });
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