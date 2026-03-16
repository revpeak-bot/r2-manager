// Configuration
const API = "https://r2-manager.revpeak2.workers.dev";
const BUCKET_URL = "https://assets.revpeak.web.id"; // Custom domain untuk bucket
let allFiles = [];

// DOM Elements
const filesGrid = document.getElementById('filesGrid');
const searchInput = document.getElementById('searchInput');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadArea = document.getElementById('uploadArea');
const selectedFile = document.getElementById('selectedFile');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const fileCount = document.getElementById('fileCount');
const toast = document.getElementById('toast');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFiles();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Search with debounce
    searchInput.addEventListener('input', debounce(searchFiles, 300));
    
    // Upload area click
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.background = 'rgba(255, 255, 255, 0.15)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.background = '';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.background = '';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect();
        }
    });
}

// Load files from API
async function loadFiles() {
    try {
        showLoadingSkeletons();
        const response = await fetch(`${API}/list`);
        const data = await response.json();
        allFiles = data;
        renderFiles(data);
        updateFileCount(data.length);
    } catch (error) {
        showToast('Failed to load files', 'error');
        console.error('Error loading files:', error);
    }
}

// Render files grid
function renderFiles(files) {
    if (!files || files.length === 0) {
        filesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>No files yet. Upload your first file!</p>
            </div>
        `;
        return;
    }

    filesGrid.innerHTML = files.map((file, index) => {
        // Gunakan BUCKET_URL untuk URL file
        const fileUrl = `${BUCKET_URL}/${file.key}`;
        // URL untuk preview gambar (masih perlu melalui API untuk list?)
        const previewUrl = `${API}/file/${file.key}`;
        const isImage = file.key.match(/\.(jpg|jpeg|png|gif|webp|svg)/i);
        const fileSize = formatFileSize(file.size);
        const fileType = getFileType(file.key);
        
        return `
            <div class="file-card" style="animation-delay: ${index * 0.05}s">
                <div class="preview-container">
                    ${isImage ? 
                        `<img class="file-preview" src="${previewUrl}" alt="${file.key}" loading="lazy">` : 
                        `<i class="fas fa-${fileType} file-icon"></i>`
                    }
                </div>
                <div class="file-info-details">
                    <div class="file-name">${file.key}</div>
                    <div class="file-meta">${fileSize}</div>
                </div>
                <div class="card-actions">
                    <button class="action-btn view-btn" onclick="viewFile('${file.key}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="action-btn copy-btn" onclick="copyLink('${file.key}')">
                        <i class="fas fa-link"></i> Copy
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteFile('${file.key}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Handle file selection
function handleFileSelect() {
    const file = fileInput.files[0];
    if (file) {
        selectedFile.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
        `;
        uploadFile(file);
    }
}

// Upload file
async function uploadFile(file) {
    try {
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        
        const formData = new FormData();
        formData.append('file', file);
        
        // Simulate progress (since we can't track actual progress)
        simulateProgress();
        
        const response = await fetch(`${API}/upload`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            progressBar.style.width = '100%';
            showToast('File uploaded successfully!', 'success');
            setTimeout(() => {
                progressBar.style.width = '0%';
                progressContainer.style.display = 'none';
                selectedFile.innerHTML = `
                    <i class="fas fa-file"></i>
                    <span>No file selected</span>
                `;
                fileInput.value = '';
            }, 1000);
            
            loadFiles();
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        showToast('Failed to upload file', 'error');
        console.error('Upload error:', error);
        progressBar.style.width = '0%';
    }
}

// Simulate upload progress
function simulateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 90) {
            clearInterval(interval);
        }
        progressBar.style.width = Math.min(progress, 90) + '%';
    }, 200);
}

// Search files
function searchFiles() {
    const searchTerm = searchInput.value.toLowerCase();
    if (!searchTerm.trim()) {
        renderFiles(allFiles);
        updateFileCount(allFiles.length);
        return;
    }
    
    const filtered = allFiles.filter(file => 
        file.key.toLowerCase().includes(searchTerm)
    );
    renderFiles(filtered);
    updateFileCount(filtered.length);
}

// View file - menggunakan BUCKET_URL
function viewFile(filename) {
    window.open(`${BUCKET_URL}/${filename}`, '_blank');
}

// Copy link - menggunakan BUCKET_URL
function copyLink(filename) {
    const url = `${BUCKET_URL}/${filename}`;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy link', 'error');
    });
}

// Delete file
async function deleteFile(filename) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
        const response = await fetch(`${API}/delete/${filename}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('File deleted successfully!', 'success');
            loadFiles();
        } else {
            throw new Error('Delete failed');
        }
    } catch (error) {
        showToast('Failed to delete file', 'error');
        console.error('Delete error:', error);
    }
}

// Show loading skeletons
function showLoadingSkeletons() {
    const skeletons = Array(6).fill(0).map(() => `
        <div class="skeleton">
            <div class="skeleton-preview"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line short"></div>
        </div>
    `).join('');
    
    filesGrid.innerHTML = skeletons;
}

// Show toast notification
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Update file count
function updateFileCount(count) {
    fileCount.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file type icon
function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
        'pdf': 'file-pdf',
        'doc': 'file-word',
        'docx': 'file-word',
        'xls': 'file-excel',
        'xlsx': 'file-excel',
        'zip': 'file-archive',
        'rar': 'file-archive',
        'mp3': 'file-audio',
        'mp4': 'file-video',
        'txt': 'file-alt'
    };
    return types[ext] || 'file';
}

// Debounce function
function debounce(func, delay) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, delay);
    };
}

// Make functions global for onclick handlers
window.viewFile = viewFile;
window.copyLink = copyLink;
window.deleteFile = deleteFile;
