// ===== GLOBAL VARIABLES =====
let api;
let currentSection = 'overview';
let users = [];
let reports = [];
let feedback = [];
let games = [];

// ===== DOM ELEMENTS =====
const elements = {
    sidebar: null,
    sidebarToggle: null,
    navItems: null,
    contentSections: null,
    pageTitle: null,
    logoutBtn: null,
    modal: null,
    modalOverlay: null,
    // Stats elements
    totalUsers: null,
    totalGames: null,
    pendingReports: null,
    avgRating: null,
    // Table elements
    usersTableBody: null,
    reportsGrid: null,
    feedbackGrid: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize DOM elements
    initializeElements();
    
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    api = new AdminAPI();
    
    // Verify admin privileges
    try {
        const user = await api.testToken();
        if (!user || user.role !== 'ADMIN') {
            localStorage.removeItem('adminToken');
            window.location.href = 'index.html';
            return;
        }
        
        // Update admin info
        updateAdminInfo(user);
    } catch (error) {
        console.error('Token validation failed:', error);
        localStorage.removeItem('adminToken');
        window.location.href = 'index.html';
        return;
    }

    // Initialize event listeners
    setupEventListeners();
    
    // Load initial data
    await loadAllData();
    await loadAdminStats();
    
    // Show overview section by default
    showSection('overview');
});

// ===== ELEMENT INITIALIZATION =====
function initializeElements() {
    elements.sidebar = document.querySelector('.sidebar');
    elements.sidebarToggle = document.getElementById('sidebar-toggle');
    elements.navItems = document.querySelectorAll('.nav-item');
    elements.contentSections = document.querySelectorAll('.content-section');
    elements.pageTitle = document.querySelector('.page-title');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.modal = document.getElementById('user-modal');
    elements.modalOverlay = document.getElementById('modal-overlay');
    
    // Stats elements
    elements.totalUsers = document.getElementById('total-users');
    elements.totalGames = document.getElementById('total-games');
    elements.pendingReports = document.getElementById('pending-reports');
    elements.avgRating = document.getElementById('avg-rating');
    
    // Table elements
    elements.usersTableBody = document.getElementById('users-table-body');
    elements.reportsGrid = document.getElementById('reports-grid');
    elements.feedbackGrid = document.getElementById('feedback-grid');
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Sidebar toggle
    if (elements.sidebarToggle) {
        elements.sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Navigation items
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const section = item.dataset.section;
            console.log('Navigation clicked:', section);
            
            // Allow normal link behavior for ai_analysis (external page)
            if (section === 'ai_analysis') {
                console.log('AI Analysis clicked - allowing normal navigation');
                // Get the href from the link and navigate directly
                const link = item.querySelector('a');
                if (link && link.href) {
                    console.log('Navigating to:', link.href);
                    window.location.href = link.href;
                }
                return; // Don't prevent default, let the link work normally
            }
            
            console.log('Dashboard section clicked:', section);
            e.preventDefault();
            showSection(section);
        });
    });
    
    // Logout button
    elements.logoutBtn.addEventListener('click', logout);
    
    // Refresh buttons
    setupRefreshButtons();
    
    // Modal events
    setupModalEvents();
    
    // Search and filter events
    setupSearchAndFilters();
    
    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !elements.sidebar.contains(e.target) && 
            !elements.sidebarToggle.contains(e.target) &&
            elements.sidebar.classList.contains('open')) {
            elements.sidebar.classList.remove('open');
        }
    });
    
    // Responsive handling
    window.addEventListener('resize', handleResize);
}

function setupRefreshButtons() {
    const refreshButtons = [
        { id: 'refresh-activity', action: loadRecentActivity },
        { id: 'refresh-users', action: loadUsers },
        { id: 'refresh-reports', action: loadReports },
        { id: 'refresh-feedback', action: loadFeedback },
        { id: 'refresh-games', action: loadGames }
    ];
    
    refreshButtons.forEach(({ id, action }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', async () => {
                btn.classList.add('fa-spin');
                await action();
                btn.classList.remove('fa-spin');
            });
        }
    });
}

function setupModalEvents() {
    // Close modal events
    const closeModalBtn = document.getElementById('close-modal');
    const modalCancel = document.getElementById('modal-cancel');
    
    [closeModalBtn, modalCancel].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', closeModal);
        }
    });
    
    // Modal overlay click to close
    elements.modalOverlay.addEventListener('click', (e) => {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    });
    
    // Modal action buttons
    const modalMute = document.getElementById('modal-mute');
    const modalBan = document.getElementById('modal-ban');
    
    if (modalMute) {
        modalMute.addEventListener('click', () => handleUserAction('mute'));
    }
    
    if (modalBan) {
        modalBan.addEventListener('click', () => handleUserAction('ban'));
    }
}

function setupSearchAndFilters() {
    // User search
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(filterUsers, 300));
    }
    
    // Report filter
    const reportFilter = document.getElementById('report-filter');
    if (reportFilter) {
        reportFilter.addEventListener('change', filterReports);
    }
    
    // Rating filter
    const ratingFilter = document.getElementById('rating-filter');
    if (ratingFilter) {
        ratingFilter.addEventListener('change', filterFeedback);
    }
    
    // Game filter
    const gameFilter = document.getElementById('game-filter');
    if (gameFilter) {
        gameFilter.addEventListener('change', filterGames);
    }
}

// ===== NAVIGATION =====
function showSection(sectionName) {
    // Update current section
    currentSection = sectionName;
    
    // Update navigation active state
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Update content sections
    elements.contentSections.forEach(section => {
        section.classList.toggle('active', section.id === `${sectionName}-section`);
    });
    
    // Update page title
    const titles = {
        overview: 'Dashboard Overview',
        users: 'User Management',
        reports: 'Reports Management',
        feedback: 'User Feedback',
        games: 'Game Analytics'
    };
    elements.pageTitle.textContent = titles[sectionName] || 'Dashboard';
    
    // Load section-specific data if needed
    loadSectionData(sectionName);
}

function toggleSidebar() {
    elements.sidebar.classList.toggle('open');
}

function handleResize() {
    if (window.innerWidth > 768) {
        elements.sidebar.classList.remove('open');
    }
}

// ===== DATA LOADING =====
async function loadAllData() {
    try {
        await Promise.all([
            loadUsers(),
            loadReports(),
            loadFeedback(),
            loadGames()
        ]);
        
        updateStats();
        loadRecentActivity();
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

async function loadSectionData(section) {
    switch (section) {
        case 'users':
            if (users.length === 0) await loadUsers();
            break;
        case 'reports':
            if (reports.length === 0) await loadReports();
            break;
        case 'feedback':
            if (feedback.length === 0) await loadFeedback();
            break;
        case 'games':
            if (games.length === 0) await loadGames();
            break;
    }
}

async function loadUsers() {
    try {
        users = await api.getAllUsers();
        renderUsers();
        updateStats();
    } catch (error) {
        console.error('Failed to load users:', error);
        showLoadingError(elements.usersTableBody, 'Failed to load users');
    }
}

async function loadReports() {
    try {
        reports = await api.getReports();
        renderReports();
        updateStats();
    } catch (error) {
        console.error('Failed to load reports:', error);
        showLoadingError(elements.reportsGrid, 'Failed to load reports');
    }
}

async function loadFeedback() {
    try {
        feedback = await api.getFeedback();
        renderFeedback();
        updateStats();
    } catch (error) {
        console.error('Failed to load feedback:', error);
        showLoadingError(elements.feedbackGrid, 'Failed to load feedback');
    }
}

async function loadGames() {
    try {
        const filter = document.getElementById('game-filter');
        const status = filter && filter.value !== 'all' ? filter.value.toUpperCase() : undefined;
        games = await api.getAdminGames({ status, limit: 50 });
        renderGames();
        updateStats();
    } catch (error) {
        console.error('Failed to load games:', error);
    }
}

// ===== RENDERING FUNCTIONS =====
function renderUsers(usersToRender = users) {
    if (!elements.usersTableBody) return;
    
    if (usersToRender.length === 0) {
        elements.usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No users found</td>
            </tr>
        `;
        return;
    }
    
    elements.usersTableBody.innerHTML = usersToRender.map(user => {
        const joinDate = new Date(user.created_at).toLocaleDateString();
        const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never';
        
        return `
            <tr>
                <td>
                    <div class="user-info">
                        <div class="user-name">${escapeHtml(user.username)}</div>
                        <div class="user-email">${escapeHtml(user.email)}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${user.status.toLowerCase()}">${user.status}</span>
                </td>
                <td>
                    <span class="role-badge ${user.role.toLowerCase()}">${user.role}</span>
                </td>
                <td>${user.rating}</td>
                <td>${joinDate}</td>
                <td>
                    <div class="user-actions">
                        <button class="action-btn edit" onclick="openUserModal('${user.user_id}', '${escapeHtml(user.username)}')">
                            <i class="fas fa-cog"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderReports(reportsToRender = reports) {
    if (!elements.reportsGrid) return;
    
    if (reportsToRender.length === 0) {
        elements.reportsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-inbox"></i>
                <span>No reports found</span>
            </div>
        `;
        return;
    }
    
    elements.reportsGrid.innerHTML = reportsToRender.map(report => {
        const reportDate = new Date(report.created_at).toLocaleDateString();
        const status = (report.status && report.status.toString && report.status.toString()) || report.status || 'OPEN';
        const statusClass = (status => {
            const s = status.toUpperCase();
            if (s === 'OPEN') return 'pending';
            if (s === 'REVIEWED') return 'reviewed';
            if (s === 'DISMISSED') return 'dismissed';
            return 'pending';
        })(status);
        
        return `
            <div class="report-card">
                <div class="report-header">
                    <div class="report-id">Report #${report.report_id.slice(0, 8)}</div>
                    <div class="report-status ${statusClass}">${status}</div>
                </div>
                <div class="report-content">
                    <div class="report-field">
                        <div class="report-label">Reporter</div>
                        <div class="report-value">${(report.reporter_id || '').slice(0, 8)}</div>
                    </div>
                    <div class="report-field">
                        <div class="report-label">Reported User</div>
                        <div class="report-value">${(report.reported_id || '').slice(0, 8)}</div>
                    </div>
                    <div class="report-field">
                        <div class="report-label">Reason</div>
                        <div class="report-value">${escapeHtml(report.reason)}</div>
                    </div>
                    <div class="report-field">
                        <div class="report-label">Date</div>
                        <div class="report-value">${reportDate}</div>
                    </div>
                </div>
                <div class="report-actions">
                    <button class="btn-warning">Investigate</button>
                    <button class="btn-secondary">Dismiss</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderFeedback(feedbackToRender = feedback) {
    if (!elements.feedbackGrid) return;
    
    if (feedbackToRender.length === 0) {
        elements.feedbackGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-comments"></i>
                <span>No feedback found</span>
            </div>
        `;
        return;
    }
    
    elements.feedbackGrid.innerHTML = feedbackToRender.map(fb => {
        const feedbackDate = new Date(fb.created_at).toLocaleDateString();
        const stars = generateStars(fb.rating);
        
        return `
            <div class="feedback-card">
                <div class="feedback-header">
                    <div class="feedback-rating">${stars}</div>
                    <div class="feedback-meta">ID: ${fb.feedback_id.slice(0, 8)}</div>
                </div>
                <div class="feedback-comment">${escapeHtml(fb.comment)}</div>
                <div class="feedback-meta">
                    User: ${fb.user_id.slice(0, 8)} • ${feedbackDate}
                </div>
            </div>
        `;
    }).join('');
}

function renderGames() {
    const gamesContainer = document.querySelector('.games-analytics');
    if (!gamesContainer) return;

    if (!games || games.length === 0) {
        gamesContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-inbox"></i>
                <span>No games found</span>
            </div>
        `;
        return;
    }

    // Summary chips
    const total = games.length;
    const completed = games.filter(g => (g.status || '').toString() === 'COMPLETED').length;
    const inProgress = games.filter(g => (g.status || '').toString() === 'IN_PROGRESS').length;
    const abandoned = games.filter(g => (g.status || '').toString() === 'ABANDONED').length;

    gamesContainer.innerHTML = `
        <div class="games-summary">
            <div class="summary-card">
                <h4>Total Games</h4>
                <div class="summary-value">${total}</div>
                <div class="summary-meta">Last ${total} loaded</div>
            </div>
            <div class="summary-card">
                <h4>Completed</h4>
                <div class="summary-value">${completed}</div>
            </div>
            <div class="summary-card">
                <h4>In Progress</h4>
                <div class="summary-value">${inProgress}</div>
            </div>
            <div class="summary-card">
                <h4>Abandoned</h4>
                <div class="summary-value">${abandoned}</div>
            </div>
        </div>

        <div class="games-list">
            ${games.map(g => {
                const created = new Date(g.created_at).toLocaleString();
                const status = (g.status || '').toString();
                const statusClass = `status-${status.toLowerCase()}`;
                const goat = g.player_goat?.username || (g.player_goat_id || '').slice(0, 8);
                const tiger = g.player_tiger?.username || (g.player_tiger_id || '').slice(0, 8);
                const winner = g.winner?.username || (g.winner_id ? (g.winner_id || '').slice(0,8) : '—');
                const duration = g.game_duration ? `${g.game_duration}s` : '';
                return `
                    <div class="game-card">
                        <div class="game-players">
                            <div class="player-tag"><i class="fas fa-goat"></i> Goat: ${escapeHtml(goat)}</div>
                            <div class="player-tag"><i class="fas fa-paw"></i> Tiger: ${escapeHtml(tiger)}</div>
                            <div class="player-tag winner"><i class="fas fa-trophy"></i> Winner: ${escapeHtml(winner)}</div>
                        </div>
                        <div class="game-meta">
                            <span class="badge ${statusClass}"><i class="fas fa-circle"></i> ${status.replace('_',' ')}</span>
                            <span class="game-id">#${(g.game_id || '').slice(0,8)}</span>
                            <span class="game-time">${created}</span>
                            ${duration ? `<span class=\"game-duration\">Duration: ${duration}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// ===== STATS FUNCTIONS =====
function updateStats() {
    // Keep avgRating from feedback; other stats from loadAdminStats
    if (elements.avgRating && feedback.length > 0) {
        const avgRating = feedback.reduce((sum, fb) => sum + (fb.rating || 0), 0) / feedback.length;
        elements.avgRating.textContent = isNaN(avgRating) ? '0.0' : avgRating.toFixed(1);
    }
}

async function loadAdminStats() {
    try {
        const stats = await api.getAdminStats();
        if (elements.totalUsers) {
            elements.totalUsers.textContent = stats.total_users ?? 0;
        }
        if (elements.totalGames) {
            elements.totalGames.textContent = stats.total_games ?? 0;
        }
        if (elements.pendingReports) {
            const pending = (stats.reports_by_status && (stats.reports_by_status.OPEN || stats.reports_by_status.Open)) || 0;
            elements.pendingReports.textContent = pending;
        }
    } catch (error) {
        console.error('Failed to load admin stats:', error);
    }
}

async function loadRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;
    try {
        const data = await api.getRecentActivity(20);
        const activities = (data && data.items) || [];
        if (activities.length === 0) {
            activityContainer.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-inbox"></i>
                    <span>No recent activity</span>
                </div>
            `;
            return;
        }

        activityContainer.innerHTML = activities.map(activity => {
            const when = activity.created_at ? new Date(activity.created_at).toLocaleString() : '';
            return `
                <div class="activity-item">
                    <div class="activity-icon ${activity.type}">
                        <i class="${activity.icon || 'fas fa-bell'}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">${escapeHtml(activity.text)}</div>
                        <div class="activity-time">${when}</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Failed to load recent activity', error);
        activityContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>
                <span>Failed to load activity</span>
            </div>
        `;
    }
}

// ===== FILTERING FUNCTIONS =====
function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm)
    );
    renderUsers(filteredUsers);
}

function filterReports() {
    const filterValue = document.getElementById('report-filter').value;
    let filteredReports = reports;
    
    if (filterValue !== 'all') {
        const wanted = filterValue.toUpperCase();
        filteredReports = reports.filter(r => {
            const status = (r.status && r.status.toString && r.status.toString()) || r.status || '';
            return status.toUpperCase().includes(wanted);
        });
    }
    
    renderReports(filteredReports);
}

function filterFeedback() {
    const ratingFilter = document.getElementById('rating-filter').value;
    let filteredFeedback = feedback;
    
    if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter);
        filteredFeedback = feedback.filter(fb => fb.rating === rating);
    }
    
    renderFeedback(filteredFeedback);
}

function filterGames() {
    loadGames();
}

// ===== MODAL FUNCTIONS =====
let currentUserId = null;
let currentUsername = null;

function openUserModal(userId, username) {
    currentUserId = userId;
    currentUsername = username;
    
    document.getElementById('modal-username').textContent = username;
    elements.modalOverlay.classList.add('active');
}

function closeModal() {
    elements.modalOverlay.classList.remove('active');
    currentUserId = null;
    currentUsername = null;
}

async function handleUserAction(action) {
    if (!currentUserId) return;
    
    try {
        if (action === 'mute') {
            await api.updateUserStatus(currentUserId, { status: 'OFFLINE' });
            showNotification(`User ${currentUsername} has been muted`, 'success');
        } else if (action === 'ban') {
            // Add ban logic when implemented
            showNotification(`User ${currentUsername} has been banned`, 'success');
        }
        
        closeModal();
        await loadUsers();
    } catch (error) {
        console.error(`Failed to ${action} user:`, error);
        showNotification(`Failed to ${action} user`, 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateStars(rating) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars.push('<i class="fas fa-star star"></i>');
        } else {
            stars.push('<i class="fas fa-star star empty"></i>');
        }
    }
    return stars.join('');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoadingError(container, message) {
    if (container) {
        container.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-exclamation-triangle" style="color: var(--danger-color);"></i>
                <span>${message}</span>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        color: white;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // Set background color based on type
    const colors = {
        success: 'var(--success-color)',
        error: 'var(--danger-color)',
        warning: 'var(--warning-color)',
        info: 'var(--info-color)'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

function updateAdminInfo(user) {
    const adminName = document.querySelector('.admin-name');
    if (adminName) {
        adminName.textContent = user.username;
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'index.html';
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 