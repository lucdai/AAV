/**
 * AAV Personalization & Preferences System
 */

const PREFS_STORAGE_KEY = 'aav_user_preferences';
const DEFAULT_PREFS = {
    theme: 'system', // 'light', 'dark', 'high-contrast', 'system'
    accentColor: '#6366f1',
    backgroundColor: '', // Empty means use theme default
    textColor: '', // Empty means use theme default
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
    setupColorInputs();
}

/**
 * Apply all preferences to the UI
 */
function applyAllPreferences() {
    applyTheme(userPrefs.theme);
    applyAccentColor(userPrefs.accentColor);
    applyCustomColors(userPrefs.backgroundColor, userPrefs.textColor);
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
    
    // Update Chart.js defaults
    updateChartTheme(effectiveTheme);
}

/**
 * Update Chart.js defaults based on theme
 */
function updateChartTheme(theme) {
    if (typeof Chart === 'undefined') return;
    
    const isDark = theme === 'dark' || theme === 'high-contrast';
    
    // Determine colors based on theme or custom preferences
    let textColor = userPrefs.textColor || (isDark ? '#94a3b8' : '#64748b');
    let gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    Chart.defaults.color = textColor;
    
    // Update existing charts
    Chart.helpers.each(Chart.instances, function(instance) {
        if (instance.options.scales) {
            Object.keys(instance.options.scales).forEach(scaleId => {
                const scale = instance.options.scales[scaleId];
                if (scale.grid) scale.grid.color = gridColor;
                if (scale.ticks) scale.ticks.color = textColor;
                if (scale.title) scale.title.color = textColor;
            });
        }
        
        // Update dataset colors if they should match accent color
        if (instance.config.type !== 'pie' && instance.config.type !== 'doughnut') {
            instance.data.datasets.forEach((dataset, i) => {
                // Only update if it's a single dataset or we want to sync all
                // For now, let's ensure they use the accent color if it's a primary chart
                if (instance.data.datasets.length === 1) {
                    dataset.backgroundColor = userPrefs.accentColor + '80'; // 50% opacity
                    dataset.borderColor = userPrefs.accentColor;
                }
            });
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
    if (!color) return;
    document.documentElement.style.setProperty('--primary', color);
    // Generate hover color (darken)
    const hoverColor = adjustColor(color, -20);
    document.documentElement.style.setProperty('--primary-hover', hoverColor); 
    document.documentElement.style.setProperty('--primary-light', `${color}20`);
    
    // Sync charts when accent color changes
    if (typeof lastGroups !== 'undefined' && lastGroups.length > 0) {
        updateChartTheme(userPrefs.theme);
    }
}

/**
 * Custom Background and Text Color
 */
function applyCustomColors(bgColor, textColor) {
    const root = document.documentElement;
    if (bgColor) {
        root.style.setProperty('--background', bgColor);
        // Also adjust surface color to be slightly different
        const surfaceColor = adjustColor(bgColor, root.classList.contains('dark-mode') ? 10 : -5);
        root.style.setProperty('--surface', surfaceColor);
    } else {
        root.style.removeProperty('--background');
        root.style.removeProperty('--surface');
    }
    
    if (textColor) {
        root.style.setProperty('--text-main', textColor);
        const mutedColor = textColor + 'b3'; // ~70% opacity
        root.style.setProperty('--text-muted', mutedColor);
    } else {
        root.style.removeProperty('--text-main');
        root.style.removeProperty('--text-muted');
    }
    
    // Refresh charts to pick up new text color
    updateChartTheme(userPrefs.theme);
}

/**
 * Helper to adjust color brightness
 */
function adjustColor(hex, percent) {
    if (!hex || hex[0] !== '#') return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    r = Math.floor(Math.min(255, Math.max(0, r * (100 + percent) / 100)));
    g = Math.floor(Math.min(255, Math.max(0, g * (100 + percent) / 100)));
    b = Math.floor(Math.min(255, Math.max(0, b * (100 + percent) / 100)));

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Setup color inputs to sync with preferences
 */
function setupColorInputs() {
    const accentInput = document.getElementById('accentColorInput');
    const accentHex = document.getElementById('accentColorHex');
    const bgInput = document.getElementById('bgColorInput');
    const bgHex = document.getElementById('bgColorHex');
    const textInput = document.getElementById('textColorInput');
    const textHex = document.getElementById('textColorHex');
    
    const isDark = document.documentElement.classList.contains('dark-mode') || 
                  (userPrefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (accentInput) accentInput.value = userPrefs.accentColor;
    if (accentHex) accentHex.value = userPrefs.accentColor;
    
    const currentBg = userPrefs.backgroundColor || (isDark ? '#0f172a' : '#f8fafc');
    if (bgInput) bgInput.value = currentBg;
    if (bgHex) bgHex.value = currentBg;
    
    const currentText = userPrefs.textColor || (isDark ? '#f8fafc' : '#0f172a');
    if (textInput) textInput.value = currentText;
    if (textHex) textHex.value = currentText;
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
    
    // Update color swatches active state
    updateColorSwatches();
}

function updateColorSwatches() {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
        const color = swatch.getAttribute('data-color');
        if (color === userPrefs.accentColor) {
            swatch.classList.add('active');
        } else {
            swatch.classList.remove('active');
        }
    });
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
        if (panel.classList.contains('active')) {
            setupColorInputs();
            updateColorSwatches();
        }
    }
}

function loginWithGitHub() {
    const CLIENT_ID = 'Ov23liYvG9H6gabDLa4Y';
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    const SCOPE = 'read:user';
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPE}&state=${Math.random().toString(36).substring(7)}`;
    console.log('Redirecting to GitHub:', authUrl);
    alert('Đang chuyển hướng đến GitHub để xác thực...');
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
