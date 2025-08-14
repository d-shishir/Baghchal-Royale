document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const api = new AdminAPI();

    // Check if already logged in
    const token = localStorage.getItem('adminToken');
    if (token) {
        console.log('🔄 Checking existing session...');
        
        // Here you could validate the token with the server
        // For now, just redirect to dashboard
        try {
            const user = JSON.parse(localStorage.getItem('adminUser'));
            if (user && user.role === 'ADMIN') {
                console.log('✅ Valid session found, redirecting...');
                window.location.href = '/admin/dashboard'
            } else {
                console.log('❌ Invalid session found, redirecting to login...');
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                window.location.href = 'auth.html'; // Redirect to login if session is invalid
            }
        } catch (error) {
            console.error('❌ Error checking session:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = 'auth.html'; // Redirect to login on error
        }
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = loginForm.username.value.trim();
        const password = loginForm.password.value.trim();

        // Basic validation
        if (!username || !password) {
            showError('Please enter both username and password');
            return;
        }

        try {
            clearError();
            setLoading(true);

            const response = await api.login(username, password);
            
            if (response.user.role === 'ADMIN') {
                console.log('✅ Admin login successful');
                localStorage.setItem('adminToken', response.access_token);
                localStorage.setItem('adminUser', JSON.stringify(response.user));
                window.location.href = '/admin/dashboard';
            } else {
                throw new Error('Access denied: Admin privileges required');
            }
        } catch (error) {
            console.error('❌ Login failed:', error);
            showError(error.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    });

    // Helper functions
    function setLoading(loading) {
        const loginButton = loginForm.querySelector('.login-btn');
        const btnText = loginButton.querySelector('.btn-text');
        const btnSpinner = loginButton.querySelector('.btn-spinner');

        if (loading) {
            loginButton.disabled = true;
            btnText.textContent = 'Signing in...';
            btnSpinner.classList.remove('hidden');
        } else {
            loginButton.disabled = false;
            btnText.textContent = 'Sign In';
            btnSpinner.classList.add('hidden');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Add shake animation
        errorMessage.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            errorMessage.style.animation = '';
        }, 500);
    }

    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        errorMessage.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
        errorMessage.style.borderColor = 'rgba(16, 185, 129, 0.2)';
        errorMessage.style.color = 'var(--success-color)';
    }

    function clearError() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        errorMessage.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        errorMessage.style.borderColor = 'rgba(239, 68, 68, 0.2)';
        errorMessage.style.color = 'var(--danger-color)';
    }

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.target.id === 'username' || e.target.id === 'password')) {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });

    // Add CSS for shake animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}); 