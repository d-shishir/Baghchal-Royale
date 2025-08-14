class AdminAPI {
    constructor() {
        // Since admin files are now served from the backend (same origin),
        // we can always use relative URLs - no CORS issues!
        this.baseURL = '/api/v1';
        this.token = localStorage.getItem('adminToken');
        
        console.log('🎯 AdminAPI initialized with same-origin baseURL:', this.baseURL);
        console.log('✅ No CORS issues - admin served from backend!');
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminUser');
                    // Avoid redirect loop when already on login page
                    const onLoginPage = window.location.pathname === '/admin' || window.location.pathname === '/admin/';
                    if (!onLoginPage) {
                        window.location.href = '/admin';
                        return;
                    }
                    throw new Error('Unauthorized');
                }
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(username, password) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        
        // Since we're same-origin now, try multiple endpoint paths to bypass blockers
        const authPaths = ['/auth/login', '/auth/signin', '/auth/session/start', '/auth/session/login'];
        
        let lastError = null;
        
        for (const path of authPaths) {
            try {
                const fullURL = `${this.baseURL}${path}`;
                console.log(`🔄 Trying same-origin login: ${fullURL}`);
                
                const response = await fetch(fullURL, {
                    method: 'POST',
                    body: formData
                    // No CORS options needed for same-origin requests
                });
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
                    throw new Error(errorData.detail || `HTTP ${response.status}`);
                }
                
                const data = await response.json();
                this.token = data.access_token;
                localStorage.setItem('adminToken', this.token);
                console.log('✅ Login successful with same-origin request:', fullURL);
                return data;
            } catch (err) {
                console.warn(`❌ Failed ${path}:`, err.message);
                lastError = err;
                // Continue to next path
            }
        }
        
        console.error('🚫 All login attempts failed');
        console.error('💡 Check if backend server is running on port 8000');
        throw lastError || new Error('Login failed - check server status');
    }

    async testToken() {
        return this.makeRequest('/auth/login/test-token', {
            method: 'POST'
        });
    }

    // Reports
    async getReports(skip = 0, limit = 100) {
        return this.makeRequest(`/reports/?skip=${skip}&limit=${limit}`);
    }

    async updateReport(reportId, updateData) {
        return this.makeRequest(`/reports/${reportId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
    }

    // Feedback
    async getFeedback(skip = 0, limit = 100) {
        return this.makeRequest(`/feedback/?skip=${skip}&limit=${limit}`);
    }

    // Users
    async getAllUsers(skip = 0, limit = 100) {
        return this.makeRequest(`/users/?skip=${skip}&limit=${limit}`);
    }

    async getUserById(userId) {
        return this.makeRequest(`/users/${userId}`);
    }

    async updateUserStatus(userId, statusUpdate) {
        return this.makeRequest(`/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusUpdate)
        });
    }

    async searchUsers(query, skip = 0, limit = 100) {
        return this.makeRequest(`/users/search?query=${encodeURIComponent(query)}&skip=${skip}&limit=${limit}`);
    }

    // Utility methods for user management
    async muteUser(userId) {
        return this.updateUserStatus(userId, { status: 'OFFLINE' });
    }

    async banUser(userId) {
        // In this implementation, we'll set the user role to a banned state
        // You might want to add a specific "BANNED" status to your backend
        return this.updateUserStatus(userId, { status: 'OFFLINE', role: 'USER' });
    }

    async unmuteUser(userId) {
        return this.updateUserStatus(userId, { status: 'ONLINE' });
    }

    async runAiAnalysis(difficulty) {
        return this.makeRequest('/ai_analysis/analyze', {
            method: 'POST',
            body: JSON.stringify({ guest_ai_difficulty: difficulty })
        });
    }

    async getQTable(player) {
        return this.makeRequest(`/ai_analysis/q-table/${player}`);
    }
}

// Export as global variable for browser usage
window.AdminAPI = AdminAPI; 