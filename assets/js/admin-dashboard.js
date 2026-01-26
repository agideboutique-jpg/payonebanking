// ========================================
// 👨‍💼 DASHBOARD ADMINISTRATEUR
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
    loadAdminInfo();
    await loadStats();
});

// ========================================
// 📊 CHARGER LES INFOS ADMIN
// ========================================

function loadAdminInfo() {
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');

    document.getElementById('admin-name').textContent = userName || 'Administrateur';
    document.getElementById('admin-email').textContent = userEmail || 'admin@payonebank.com';
}

// ========================================
// 📊 CHARGER LES STATISTIQUES
// ========================================

async function loadStats() {
    try {
        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            displayStats(data.stats);
            console.log('✅ Statistiques chargées');
        } else {
            alert('❌ ' + data.message);
        }

    } catch (error) {
        console.error('❌ Erreur chargement stats:', error);
        alert('❌ Erreur de connexion au serveur');
    }
}

// ========================================
// 📊 AFFICHER LES STATISTIQUES
// ========================================

function displayStats(stats) {
    // Clients
    document.getElementById('stat-clients-total').textContent = stats.clients.total;
    document.getElementById('stat-clients-actifs').textContent = `${stats.clients.actifs} actifs`;

    // Badge clients
    document.getElementById('badge-clients-total').textContent = stats.clients.total;

    // Transactions
    document.getElementById('stat-transactions-total').textContent = stats.transactions.total;
    document.getElementById('stat-transactions-today').textContent = `${stats.transactions.aujourdhui} aujourd'hui`;

    // Volume
    document.getElementById('stat-volume-total').textContent = formatNumber(stats.transactions.volumeTotal) + ' €';

    // Bénéficiaires
    document.getElementById('stat-benef-attente').textContent = stats.beneficiaires.enAttente;
    document.getElementById('stat-benef-valides').textContent = `${stats.beneficiaires.validesAujourdhui} validés aujourd'hui`;
    document.getElementById('badge-benef-attente').textContent = stats.beneficiaires.enAttente;

    // Crédits/Débits
    document.getElementById('stat-credits').textContent = formatNumber(stats.transactions.volumeCredits) + ' €';
    document.getElementById('stat-debits').textContent = formatNumber(stats.transactions.volumeDebits) + ' €';

    // Progress bars crédits/débits
    const volumeTotal = parseFloat(stats.transactions.volumeTotal);
    const volumeCredits = parseFloat(stats.transactions.volumeCredits);
    const volumeDebits = parseFloat(stats.transactions.volumeDebits);

    if (volumeTotal > 0) {
        const creditPct = ((volumeCredits / volumeTotal) * 100).toFixed(1);
        const debitPct = ((volumeDebits / volumeTotal) * 100).toFixed(1);

        document.getElementById('progress-credits').style.width = creditPct + '%';
        document.getElementById('progress-credits').textContent = creditPct + '%';

        document.getElementById('progress-debits').style.width = debitPct + '%';
        document.getElementById('progress-debits').textContent = debitPct + '%';
    }

    // Clients actifs/inactifs
    document.getElementById('clients-actifs-detail').textContent = stats.clients.actifs;
    document.getElementById('clients-inactifs-detail').textContent = stats.clients.inactifs;

    const totalClients = stats.clients.total;
    if (totalClients > 0) {
        const actifsPct = ((stats.clients.actifs / totalClients) * 100).toFixed(1);
        const inactifsPct = ((stats.clients.inactifs / totalClients) * 100).toFixed(1);

        document.getElementById('progress-actifs').style.width = actifsPct + '%';
        document.getElementById('progress-actifs').textContent = actifsPct + '%';

        document.getElementById('progress-inactifs').style.width = inactifsPct + '%';
        document.getElementById('progress-inactifs').textContent = inactifsPct + '%';
    }
}

// ========================================
// 🔓 DÉCONNEXION
// ========================================

function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.clear();
        alert('✅ Déconnexion réussie');
        window.location.href = '/log-in.html';
    }
}

// ========================================
// 🛠️ FONCTION UTILITAIRE
// ========================================

function formatNumber(num) {
    return parseFloat(num).toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}