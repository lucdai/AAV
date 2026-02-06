/**
 * AAV Personalization & Preferences System
 */

const PREFS_STORAGE_KEY = 'aav_user_preferences';
const DEFAULT_PREFS = {
    theme: 'system', // 'light', 'dark', 'high-contrast', 'system'
    accentColor: '#6366f1',
    chartTheme: 'default',
    fontSize: 100, // percentage
    fontFamily: 'sans-serif', // 'sans-serif', 'serif'
    trackingEnabled: true,
    featureFlags: {
        newCharts: true,
        betaFeatures: false
    }
};

let userPrefs = { ...DEFAULT_PREFS };

/**
 * Initialize preferences
 */
function initPreferences() {
    const savedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (savedPrefs) {
        try {
            userPrefs = { ...DEFAULT_PREFS, ...JSON.parse(savedPrefs) };
        } catch (e) {
            console.error('Error parsing preferences:', e);
        }
    }
    
    applyAllPreferences();
    setupSystemThemeListener();
}

/**
 * Apply all preferences to the UI
 */
function applyAllPreferences() {
    applyTheme(userPrefs.theme);
    applyAccentColor(userPrefs.accentColor);
    applyFontSize(userPrefs.fontSize);
    applyFontFamily(userPrefs.fontFamily);
}

/**
 * Theme Management
 */
function applyTheme(theme) {
    const root = document.documentElement;
    let effectiveTheme = theme;
    
    if (theme === 'system') {
        effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    root.classList.remove('light-mode', 'dark-mode', 'high-contrast-mode');
    root.classList.add(`${effectiveTheme}-mode`);
    
    // Update Chart.js defaults if needed
    updateChartTheme(effectiveTheme);
}

/**
 * Update Chart.js defaults based on theme
 */
function updateChartTheme(theme) {
    if (typeof Chart === 'undefined') return;
    
    const isDark = theme === 'dark' || theme === 'high-contrast';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    
    Chart.defaults.color = textColor;
    
    // Update existing charts
    Chart.helpers.each(Chart.instances, function(instance) {
        if (instance.options.scales) {
            if (instance.options.scales.x) {
                instance.options.scales.x.grid.color = gridColor;
                instance.options.scales.x.ticks.color = textColor;
            }
            if (instance.options.scales.y) {
                instance.options.scales.y.grid.color = gridColor;
                instance.options.scales.y.ticks.color = textColor;
            }
        }
        instance.update();
    });
}

function setupSystemThemeListener() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (userPrefs.theme === 'system') {
            applyTheme('system');
        }
    });
}

/**
 * Accent Color Management
 */
function applyAccentColor(color) {
    document.documentElement.style.setProperty('--primary', color);
    // Generate hover color (simplified: darken)
    // In a real app, we'd use a library or more complex logic
    document.documentElement.style.setProperty('--primary-hover', color); 
    document.documentElement.style.setProperty('--primary-light', `${color}20`); // 20 is hex for ~12% opacity
}

/**
 * Font Management
 */
function applyFontSize(size) {
    document.documentElement.style.fontSize = `${(size / 100) * 16}px`;
    const display = document.getElementById('fontSizeDisplay');
    if (display) display.innerText = `${size}%`;
}

function applyFontFamily(family) {
    const body = document.body;
    if (family === 'serif') {
        body.style.fontFamily = "'Noto Serif', serif";
    } else {
        body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    }
}

/**
 * Save preferences
 */
function savePreferences(newPrefs) {
    userPrefs = { ...userPrefs, ...newPrefs };
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(userPrefs));
    applyAllPreferences();
    
    // If logged in, sync to server (to be implemented in Phase 7)
    if (typeof syncPrefsToServer === 'function') {
        syncPrefsToServer(userPrefs);
    }
}

/**
 * Privacy Center Actions
 */
function exportUserData() {
    const data = {
        preferences: userPrefs,
        backupData: JSON.parse(localStorage.getItem('aav_backup_data') || '{}'),
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AAV_User_Data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function deleteUserData() {
    if (confirm(t('confirm_delete_all_data'))) {
        localStorage.removeItem(PREFS_STORAGE_KEY);
        localStorage.removeItem('aav_backup_data');
        localStorage.removeItem('aav_backup_timestamp');
        location.reload();
    }
}

/**
 * UI Toggles
 */
function toggleSettings() {
    const panel = document.getElementById('settingsPanel');
    const overlay = document.getElementById('settingsOverlay');
    if (panel && overlay) {
        panel.classList.toggle('active');
        overlay.classList.toggle('active');
    }
}

function loginWithGitHub() {
    // GitHub OAuth Configuration
    const CLIENT_ID = 'Ov23liYvG9H6gabDLa4Y'; // Placeholder Client ID
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    const SCOPE = 'read:user';
    
    // Redirect to GitHub OAuth
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPE}&state=${Math.random().toString(36).substring(7)}`;
    
    // In a real implementation, we would redirect. 
    // For this demo, we'll simulate the login process.
    console.log('Redirecting to GitHub:', authUrl);
    alert('Đang chuyển hướng đến GitHub để xác thực... (Trong môi trường thực tế, bạn sẽ được chuyển đến trang đăng nhập của GitHub)');
    
    // Simulate successful login for demonstration
    setTimeout(() => {
        const mockUser = { name: 'lucdai', avatar: 'https://github.com/lucdai.png' };
        localStorage.setItem('aav_user', JSON.stringify(mockUser));
        updateSyncStatus(mockUser);
    }, 1500);
}

function updateSyncStatus(user) {
    const statusText = document.getElementById('syncStatusText');
    if (statusText) {
        if (user) {
            statusText.innerText = t('logged_in_as', { name: user.name });
            statusText.classList.add('text-indigo-600', 'font-bold');
        } else {
            statusText.innerText = t('not_logged_in');
            statusText.classList.remove('text-indigo-600', 'font-bold');
        }
    }
}

// Check login status on load
document.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('aav_user');
    if (savedUser) {
        updateSyncStatus(JSON.parse(savedUser));
    }
});

// Initialize on load
document.addEventListener('DOMContentLoaded', initPreferences);
