// js/app.js

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', async () => {
    // Cek autentikasi
    const credentials = checkAuth();
    if (!credentials) return;
    
    // Tampilkan email user (bagian dari access key)
    document.getElementById('userEmail').textContent = 
        credentials.accessKey.substring(0, 10) + '...';
    
    // Load buckets
    await loadBuckets();
});

// Load semua bucket
async function loadBuckets() {
    const loadingState = document.getElementById('loadingState');
    const bucketsGrid = document.getElementById('bucketsGrid');
    const emptyState = document.getElementById('emptyState');
    
    loadingState.style.display = 'block';
    bucketsGrid.style.display = 'none';
    emptyState.style.display = 'none';
    
    try {
        const result = await api.listBuckets();
        
        loadingState.style.display = 'none';
        
        if (result.success && result.buckets && result.buckets.length > 0) {
            renderBuckets(result.buckets);
            bucketsGrid.style.display = 'grid';
        } else {
            emptyState.style.display = 'block';
        }
    } catch (error) {
        loadingState.style.display = 'none';
        showAlert('error', 'Gagal memuat bucket: ' + error.message);
    }
}

// Render daftar bucket
function renderBuckets(buckets) {
    const grid = document.getElementById('bucketsGrid');
    grid.innerHTML = buckets.map(bucket => `
        <div class="bucket-card">
            <div class="bucket-icon">
                <i class="fas fa-bucket"></i>
            </div>
            <div class="bucket-info">
                <h3 title="${escapeHtml(bucket.name)}">${escapeHtml(bucket.name)}</h3>
                <div class="bucket-meta">
                    <span>
                        <i class="fas fa-calendar"></i>
                        ${formatDate(bucket.creation_date)}
                    </span>
                </div>
            </div>
            <div class="bucket-actions">
                <button class="btn-manage" onclick="viewBucket('${escapeHtml(bucket.name)}')">
                    <i class="fas fa-folder-open"></i> Kelola
                </button>
                <button class="btn-delete" onclick="showDeleteBucketModal('${escapeHtml(bucket.name)}')">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        </div>
    `).join('');
}

// Refresh buckets
async function refreshBuckets() {
    await loadBuckets();
}

// Create bucket modal
function showCreateBucketModal() {
    document.getElementById('createBucketModal').classList.add('show');
    document.getElementById('bucketName').value = '';
}

function hideCreateBucketModal() {
    document.getElementById('createBucketModal').classList.remove('show');
}

// Create bucket
async function createBucket(event) {
    event.preventDefault();
    
    const bucketName = document.getElementById('bucketName').value.trim();
    
    if (!validateBucketName(bucketName)) {
        showAlert('error', 'Nama bucket tidak valid');
        return;
    }
    
    const createBtn = document.getElementById('createBucketBtn');
    const btnText = createBtn.querySelector('.btn-text');
    const btnLoader = createBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    createBtn.disabled = true;
    
    try {
        const result = await api.createBucket(bucketName);
        
        if (result.success) {
            hideCreateBucketModal();
            showAlert('success', 'Bucket berhasil dibuat');
            await loadBuckets();
        } else {
            showAlert('error', result.error || 'Gagal membuat bucket');
        }
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        createBtn.disabled = false;
    }
}

// Delete bucket modal
let currentDeleteBucket = '';

function showDeleteBucketModal(bucketName) {
    currentDeleteBucket = bucketName;
    document.getElementById('deleteBucketName').textContent = bucketName;
    document.getElementById('deleteBucketModal').classList.add('show');
}

function hideDeleteBucketModal() {
    document.getElementById('deleteBucketModal').classList.remove('show');
    currentDeleteBucket = '';
}

// Confirm delete bucket
async function confirmDeleteBucket() {
    if (!currentDeleteBucket) return;
    
    const deleteBtn = document.getElementById('deleteBucketBtn');
    const btnText = deleteBtn.querySelector('.btn-text');
    const btnLoader = deleteBtn.querySelector('.btn-loader');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    deleteBtn.disabled = true;
    
    try {
        const result = await api.deleteBucket(currentDeleteBucket);
        
        if (result.success) {
            hideDeleteBucketModal();
            showAlert('success', 'Bucket berhasil dihapus');
            await loadBuckets();
        } else {
            showAlert('error', result.error || 'Gagal menghapus bucket');
        }
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        deleteBtn.disabled = false;
    }
}

// View bucket detail
async function viewBucket(bucketName) {
    document.getElementById('detailBucketName').textContent = bucketName;
    document.getElementById('bucketDetailModal').classList.add('show');
    
    await loadBucketFiles(bucketName);
}

function hideBucketDetailModal() {
    document.getElementById('bucketDetailModal').classList.remove('show');
}

// Load files in bucket
async function loadBucketFiles(bucketName) {
    const filesLoading = document.getElementById('filesLoading');
    const filesList = document.getElementById('filesList');
    const filesEmpty = document.getElementById('filesEmpty');
    
    filesLoading.style.display = 'block';
    filesList.innerHTML = '';
    filesEmpty.style.display = 'none';
    
    try {
        const result = await api.listObjects(bucketName);
        
        filesLoading.style.display = 'none';
        
        if (result.success && result.objects && result.objects.length > 0) {
            renderFiles(bucketName, result.objects);
        } else {
            filesEmpty.style.display = 'block';
        }
    } catch (error) {
        filesLoading.style.display = 'none';
        filesList.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
    }
}

// Render files in bucket
function renderFiles(bucketName, objects) {
    const filesList = document.getElementById('filesList');
    
    filesList.innerHTML = `
        <div class="files-list">
            ${objects.map(obj => `
                <div class="file-item">
                    <div class="file-info">
                        <i class="fas fa-file"></i>
                        <div class="file-details">
                            <h4 title="${escapeHtml(obj.key)}">${escapeHtml(obj.key)}</h4>
                            <p>
                                ${formatFileSize(obj.size)} • 
                                ${formatDate(obj.last_modified)}
                            </p>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn-view" onclick="viewFile('${bucketName}', '${escapeHtml(obj.key)}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-download" onclick="downloadFile('${bucketName}', '${escapeHtml(obj.key)}')">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="btn-delete-file" onclick="deleteFile('${bucketName}', '${escapeHtml(obj.key)}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Upload file
async function uploadFile(event) {
    event.preventDefault();
    
    const bucketName = document.getElementById('detailBucketName').textContent;
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('error', 'Pilih file terlebih dahulu');
        return;
    }
    
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showAlert('error', `File terlalu besar. Maksimal ${formatFileSize(CONFIG.MAX_FILE_SIZE)}`);
        return;
    }
    
    const uploadBtn = document.getElementById('uploadBtn');
    const btnText = uploadBtn.querySelector('.btn-text');
    const btnLoader = uploadBtn.querySelector('.btn-loader');
    const progressBar = document.getElementById('uploadProgress');
    const progressFill = progressBar.querySelector('.progress-fill');
    const progressText = progressBar.querySelector('.progress-text');
    
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    uploadBtn.disabled = true;
    progressBar.style.display = 'block';
    
    try {
        await api.uploadFile(bucketName, file, (progress) => {
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
        });
        
        showAlert('success', 'File berhasil diupload');
        fileInput.value = '';
        await loadBucketFiles(bucketName);
    } catch (error) {
        showAlert('error', error.message);
    } finally {
        btnText.style.display = 'inline-block';
        btnLoader.style.display = 'none';
        uploadBtn.disabled = false;
        
        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            progressText.textContent = '0%';
        }, 1000);
    }
}

// View file
function viewFile(bucketName, objectKey) {
    const url = api.getObjectUrl(bucketName, objectKey);
    window.open(url, '_blank');
}

// Download file
function downloadFile(bucketName, objectKey) {
    const url = api.getObjectUrl(bucketName, objectKey);
    const a = document.createElement('a');
    a.href = url;
    a.download = objectKey.split('/').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Delete file
async function deleteFile(bucketName, objectKey) {
    if (!confirm('Hapus file ini?')) return;
    
    try {
        const result = await api.deleteObject(bucketName, objectKey);
        
        if (result.success) {
            showAlert('success', 'File berhasil dihapus');
            await loadBucketFiles(bucketName);
        } else {
            showAlert('error', result.error || 'Gagal menghapus file');
        }
    } catch (error) {
        showAlert('error', error.message);
    }
}

// File input info
document.getElementById('fileInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    const fileInfo = document.getElementById('fileInfo');
    
    if (file) {
        fileInfo.innerHTML = `
            <i class="fas fa-check-circle" style="color: var(--success)"></i>
            ${file.name} (${formatFileSize(file.size)})
        `;
    } else {
        fileInfo.innerHTML = '';
    }
});