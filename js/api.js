// js/api.js

const api = {
    // Headers dasar
    getHeaders() {
        const credentials = checkAuth();
        if (!credentials) return null;
        
        return {
            'X-Account-Id': credentials.accountId,
            'X-Access-Key': credentials.accessKey,
            'X-Secret-Key': credentials.secretKey,
            'Content-Type': 'application/json'
        };
    },
    
    // Request dengan timeout
    async request(endpoint, options = {}) {
        const headers = this.getHeaders();
        if (!headers) throw new Error('Not authenticated');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);
        
        try {
            const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
                ...options,
                headers: { ...headers, ...options.headers },
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }
            
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    },
    
    // List semua bucket
    async listBuckets() {
        try {
            return await this.request('/buckets');
        } catch (error) {
            console.error('List buckets error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Buat bucket baru
    async createBucket(bucketName) {
        try {
            return await this.request('/buckets', {
                method: 'POST',
                body: JSON.stringify({ bucketName })
            });
        } catch (error) {
            console.error('Create bucket error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Hapus bucket
    async deleteBucket(bucketName) {
        try {
            return await this.request(`/buckets/${encodeURIComponent(bucketName)}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Delete bucket error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // List objects dalam bucket
    async listObjects(bucketName) {
        try {
            return await this.request(`/buckets/${encodeURIComponent(bucketName)}/objects`);
        } catch (error) {
            console.error('List objects error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Upload file
    async uploadFile(bucketName, file, onProgress) {
        return new Promise((resolve, reject) => {
            const credentials = checkAuth();
            if (!credentials) {
                reject(new Error('Not authenticated'));
                return;
            }
            
            const formData = new FormData();
            formData.append('file', file);
            
            const xhr = new XMLHttpRequest();
            
            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete);
                    }
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (e) {
                        resolve({ success: true });
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error || 'Upload failed'));
                    } catch (e) {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            });
            
            xhr.addEventListener('error', () => {
                reject(new Error('Network error'));
            });
            
            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });
            
            xhr.open('POST', `${CONFIG.API_URL}/buckets/${encodeURIComponent(bucketName)}/upload`);
            xhr.setRequestHeader('X-Account-Id', credentials.accountId);
            xhr.setRequestHeader('X-Access-Key', credentials.accessKey);
            xhr.setRequestHeader('X-Secret-Key', credentials.secretKey);
            
            xhr.timeout = CONFIG.TIMEOUT;
            xhr.send(formData);
        });
    },
    
    // Hapus object
    async deleteObject(bucketName, objectKey) {
        try {
            return await this.request(
                `/buckets/${encodeURIComponent(bucketName)}/objects/${encodeURIComponent(objectKey)}`,
                { method: 'DELETE' }
            );
        } catch (error) {
            console.error('Delete object error:', error);
            return { success: false, error: error.message };
        }
    },
    
    // Get object URL
    getObjectUrl(bucketName, objectKey) {
        const credentials = checkAuth();
        if (!credentials) return '#';
        
        return `${CONFIG.API_URL}/buckets/${encodeURIComponent(bucketName)}/objects/${encodeURIComponent(objectKey)}/download?accountId=${credentials.accountId}&accessKey=${credentials.accessKey}&secretKey=${credentials.secretKey}`;
    }
};