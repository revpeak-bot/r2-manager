// js/config.js

// Konfigurasi API
const CONFIG = {
    // Ganti dengan URL worker Anda setelah di-deploy
    API_URL: 'https://r2-manager.revpeak2.workers.dev',
    
    // Timeout untuk request (dalam milidetik)
    TIMEOUT: 30000,
    
    // Maksimal ukuran file upload (dalam bytes) - 100MB
    MAX_FILE_SIZE: 100 * 1024 * 1024,
    
    // Format file yang diizinkan
    ALLOWED_FILE_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/json',
        'application/zip',
        'application/x-zip-compressed'
    ]
};

// Cek login
function checkAuth() {
    const accountId = sessionStorage.getItem('r2_account_id');
    const accessKey = sessionStorage.getItem('r2_access_key');
    const secretKey = sessionStorage.getItem('r2_secret_key');
    
    if (!accountId || !accessKey || !secretKey) {
        window.location.href = 'index.html';
        return false;
    }
    
    return { accountId, accessKey, secretKey };
}

// Format tanggal
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format ukuran file
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Escape HTML untuk keamanan
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Validasi nama bucket
function validateBucketName(name) {
    const pattern = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
    return pattern.test(name);
}

// Tampilkan alert
function showAlert(type, message) {
    const alertSuccess = document.getElementById('alertSuccess');
    const alertError = document.getElementById('alertError');
    
    if (type === 'success') {
        alertSuccess.querySelector('span').textContent = message;
        alertSuccess.style.display = 'flex';
        setTimeout(() => {
            alertSuccess.style.display = 'none';
        }, 3000);
    } else {
        alertError.querySelector('span').textContent = message;
        alertError.style.display = 'flex';
        setTimeout(() => {
            alertError.style.display = 'none';
        }, 3000);
    }
}

// Logout
function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
}