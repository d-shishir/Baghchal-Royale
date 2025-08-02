class AdminAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api/v1';
        this.token = localStorage.getItem('admin-token');
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
                    localStorage.removeItem('admin-token');
                    window.location.href = 'index.html';
                    return;
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

        const response = await fetch(`${this.baseURL}/auth/login`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Login failed');
        }

        const data = await response.json();
        this.token = data.access_token;
        localStorage.setItem('admin-token', this.token);
        return data;
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