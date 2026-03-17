/**
 * AAV Personalization & Preferences System
 */

const PREFS_STORAGE_KEY = 'aav_user_preferences';
const DEFAULT_PREFS = {
    accentColor: '#6366f1',
    backgroundColor: '', // Empty means use theme default
    textColor: '', // Empty means use theme default
    chartTheme: 'default',
    fontSize: 100, // percentage
    fontFamily: 'sans-serif', // 'sans-serif', 'serif'
    trackingEnabled: true,
    autoSaveSession: true,
    showDataLabels: true,
    chartPalette: 'default',
    hotkeysEnabled: true,
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
            delete userPrefs.theme;
        } catch (e) {
            console.error('Error parsing preferences:', e);
        }
    }
    
    applyAllPreferences();
    setupColorInputs();
    
    if (userPrefs.autoSaveSession) {
        loadSessionData();
        setInterval(saveSessionData, 30000);
    }
}

/**
 * Apply all preferences to the UI
 */
function applyAllPreferences() {
    applyAccentColor(userPrefs.accentColor);
    applyCustomColors(userPrefs.backgroundColor, userPrefs.textColor);
    applyFontSize(userPrefs.fontSize);
    applyFontFamily(userPrefs.fontFamily);
    applyChartPalette(userPrefs.chartPalette);
    setupHotkeys(userPrefs.hotkeysEnabled);
}

/**
 * Update Chart.js defaults based on theme
 */
function updateChartTheme() {
    if (typeof Chart === 'undefined') return;

    // Determine colors based on preferences
    let textColor = userPrefs.textColor || '#64748b';
    
    Chart.defaults.color = textColor;
    
    // Force re-calculate and re-draw all charts to ensure full synchronization
    if (typeof calculate === 'function' && typeof lastGroups !== 'undefined' && lastGroups.length > 0) {
        calculate();
    }
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
    const primaryLight = hexToRgba(color, 0.125);
    document.documentElement.style.setProperty('--primary-light', primaryLight || color);
    
    // Sync charts when accent color changes
    if (typeof lastGroups !== 'undefined' && lastGroups.length > 0) {
        updateChartTheme();
    }
}

/**
 * Custom Background and Text Color
 */
function applyCustomColors(bgColor, textColor) {
    const root = document.documentElement;
    if (bgColor) {
        root.style.setProperty('--background', bgColor);
    } else {
        root.style.removeProperty('--background');
    }
    
    if (textColor) {
        root.style.setProperty('--text-main', textColor);
        const mutedColor = hexToRgba(textColor, 0.7) || textColor;
        root.style.setProperty('--text-muted', mutedColor);
    } else {
        root.style.removeProperty('--text-main');
        root.style.removeProperty('--text-muted');
    }
    
    // Refresh charts to pick up new text color
    updateChartTheme();
}

/**
 * Chart Palette Management
 */
const CHART_PALETTES = {
    'default': ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'],
    'ocean': ['#0ea5e9', '#2dd4bf', '#3b82f6', '#06b6d4', '#6366f1', '#94a3b8', '#0f172a'],
    'forest': ['#10b981', '#84cc16', '#059669', '#15803d', '#4d7c0f', '#166534', '#3f6212'],
    'sunset': ['#f43f5e', '#f97316', '#fbbf24', '#e11d48', '#ea580c', '#d97706', '#be123c'],
    'monochrome': ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0']
};

function applyChartPalette(paletteName) {
    if (!CHART_PALETTES[paletteName]) return;
    // This will be used by chart generation logic
    if (typeof Chart !== 'undefined' && typeof calculate === 'function') {
        calculate();
    }
}

/**
 * Hotkeys Management
 */
function setupHotkeys(enabled) {
    if (!enabled) {
        document.removeEventListener('keydown', handleGlobalHotkeys);
        return;
    }
    document.addEventListener('keydown', handleGlobalHotkeys);
}

function handleGlobalHotkeys(e) {
    // Alt + A: Add Sample
    if (e.altKey && e.key === 'a') {
        e.preventDefault();
        const addBtn = document.querySelector('[onclick*="addSample"]');
        if (addBtn) addBtn.click();
    }
    // Alt + C: Clear All
    if (e.altKey && e.key === 'c') {
        e.preventDefault();
        const clearBtn = document.querySelector('[onclick*="clearAll"]');
        if (clearBtn) clearBtn.click();
    }
    // Alt + S: Save Backup
    if (e.altKey && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('[onclick*="saveBackup"]');
        if (saveBtn) saveBtn.click();
    }
    // Alt + 1: Switch to Data Tab
    if (e.altKey && e.key === '1') {
        const tab = document.getElementById('tabDataBtn');
        if (tab) tab.click();
    }
    // Alt + 2: Switch to Charts Tab
    if (e.altKey && e.key === '2') {
        const tab = document.getElementById('tabChartsBtn');
        if (tab) tab.click();
    }
}

/**
 * Session Management
 */
function saveSessionData() {
    if (!userPrefs.autoSaveSession) return;
    // We need a way to get current datasets. Assuming a global function or variable exists.
    if (typeof datasets !== 'undefined') {
        const data = {
            datasets: datasets,
            timestamp: new Date().getTime()
        };
        localStorage.setItem('aav_last_session', JSON.stringify(data));
    }
}

function loadSessionData() {
    if (!userPrefs.autoSaveSession) return;
    const saved = localStorage.getItem('aav_last_session');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // If datasets exist, we might want to restore them if current datasets are empty
            if (data.datasets && data.datasets.length > 0 && (typeof datasets === 'undefined' || datasets.length === 0)) {
                // Restore logic depends on how datasets are managed in the app
                console.log('Session data found from:', new Date(data.timestamp).toLocaleString());
            }
        } catch (e) {
            console.error('Error loading session:', e);
        }
    }
}

/**
 * Helper to adjust color brightness
 */
function adjustColor(hex, percent) {
    if (!hex || hex[0] !== '#') return hex;
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);

    // Use a more robust adjustment that works even for black (#000000)
    const amt = Math.floor((2.55 * percent));
    r = Math.floor(Math.min(255, Math.max(0, r + amt)));
    g = Math.floor(Math.min(255, Math.max(0, g + amt)));
    b = Math.floor(Math.min(255, Math.max(0, b + amt)));

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hexToRgba(hex, alpha) {
    if (!hex || hex[0] !== '#') return null;

    const numericAlpha = Number(alpha);
    if (!Number.isFinite(numericAlpha)) return null;
    const safeAlpha = Math.min(1, Math.max(0, numericAlpha));

    let normalizedHex = hex.slice(1);
    if (normalizedHex.length === 3) {
        normalizedHex = normalizedHex.split('').map(c => c + c).join('');
    }

    if (normalizedHex.length !== 6) return null;

    const r = parseInt(normalizedHex.slice(0, 2), 16);
    const g = parseInt(normalizedHex.slice(2, 4), 16);
    const b = parseInt(normalizedHex.slice(4, 6), 16);
    if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;

    return `rgba(${r}, ${g}, ${b}, ${safeAlpha})`;
}

function generateRandomState() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    }

    return Math.random().toString(36).slice(2);
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
    
    const rootStyle = getComputedStyle(document.documentElement);
    
    if (accentInput) accentInput.value = userPrefs.accentColor;
    if (accentHex) accentHex.value = userPrefs.accentColor;
    
    const currentBg = userPrefs.backgroundColor || rootStyle.getPropertyValue('--background').trim() || '#f8fafc';
    if (bgInput) bgInput.value = currentBg;
    if (bgHex) bgHex.value = currentBg;
    
    const currentText = userPrefs.textColor || rootStyle.getPropertyValue('--text-main').trim() || '#0f172a';
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
    const { theme, ...filteredPrefs } = newPrefs;
    userPrefs = { ...userPrefs, ...filteredPrefs };
    delete userPrefs.theme;
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
    localStorage.removeItem(PREFS_STORAGE_KEY);
    localStorage.removeItem('aav_backup_data');
    localStorage.removeItem('aav_backup_timestamp');
    location.reload();
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
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${SCOPE}&state=${generateRandomState()}`;
    console.log('Redirecting to GitHub:', authUrl);
    // Tự động tiếp tục đăng nhập, không hiển thị hộp thoại xác nhận của trình duyệt
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
