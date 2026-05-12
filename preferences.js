/**
 * AAV Personalization & Preferences System
 */

const PREFS_STORAGE_KEY = 'aav_user_preferences';
const DEFAULT_PREFS = {
    theme: 'system', // 'light', 'dark', 'system'
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
    interactionEffectsEnabled: true,
    vibrateEnabled: true,
    accessibilityStrict: true,
    effectiveTokens: {},
    featureFlags: {
        newCharts: true,
        betaFeatures: false
    }
};

let userPrefs = { ...DEFAULT_PREFS };
window.userPrefs = userPrefs;

/**
 * Initialize preferences
 */
function initPreferences() {
    const savedPrefs = localStorage.getItem(PREFS_STORAGE_KEY);
    if (savedPrefs) {
        try {
            userPrefs = { ...DEFAULT_PREFS, ...JSON.parse(savedPrefs) };
            if (userPrefs.theme === 'high-contrast') userPrefs.theme = 'dark';
        } catch (e) {
            console.error('Error parsing preferences:', e);
        }
    }
    
    applyAllPreferences();
    syncSettingsUI();
    setupSystemThemeListener();
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
    applyTheme(userPrefs.theme);
    applyAccentColor(userPrefs.accentColor);
    applyCustomColors(userPrefs.backgroundColor, userPrefs.textColor);
    applyFontSize(userPrefs.fontSize);
    applyFontFamily(userPrefs.fontFamily);
    applyChartPalette(userPrefs.chartPalette);
    setupHotkeys(userPrefs.hotkeysEnabled);
    applyContrastEngine(userPrefs);
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
    
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add(`${effectiveTheme}-mode`);
    
    // Update Chart.js defaults
    updateChartTheme(effectiveTheme);
}

/**
 * Update Chart.js defaults based on theme
 */
function updateChartTheme(theme) {
    if (typeof Chart === 'undefined') return;
    
    const isDark = theme === 'dark' ||
                  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Determine colors based on theme or custom preferences
    let textColor = userPrefs.textColor || (isDark ? '#94a3b8' : '#64748b');
    
    Chart.defaults.color = textColor;
    
    // Force re-calculate and re-draw all charts to ensure full synchronization
    if (typeof calculate === 'function' && typeof lastGroups !== 'undefined' && lastGroups.length > 0) {
        calculate();
    }
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
        const isDark = root.classList.contains('dark-mode') || 
                      (userPrefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const surfaceColor = adjustColor(bgColor, isDark ? 10 : -5);
        const borderColor = adjustColor(bgColor, isDark ? 20 : -15);
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        root.style.setProperty('--surface', surfaceColor);
        root.style.setProperty('--border', borderColor);
        root.style.setProperty('--grid', gridColor);
    } else {
        root.style.removeProperty('--background');
        root.style.removeProperty('--surface');
        root.style.removeProperty('--border');
        root.style.removeProperty('--grid');
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

/**
 * Setup color inputs to sync with preferences
 */

function getReadableTextColor(bgHex) {
    const white = '#ffffff';
    const black = '#0f172a';
    return contrastRatio(bgHex, white) >= contrastRatio(bgHex, black) ? white : black;
}

function buildContrastTokens(base = {}) {
    const bg = base.backgroundColor || getCurrentSystemColors().bg;
    const text = base.textColor || getCurrentSystemColors().text;
    const accent = base.accentColor || userPrefs.accentColor || '#6366f1';
    const surface0 = adjustColor(bg, 6);
    const surface1 = adjustColor(bg, 14);
    const surface2 = adjustColor(bg, 22);
    const on0 = contrastRatio(surface0, text) >= 4.5 ? text : getReadableTextColor(surface0);
    const on1 = contrastRatio(surface1, text) >= 4.5 ? text : getReadableTextColor(surface1);
    const on2 = contrastRatio(surface2, text) >= 4.5 ? text : getReadableTextColor(surface2);
    const onAccent = getReadableTextColor(accent);
    return {
        '--surface-0': surface0, '--surface-1': surface1, '--surface-2': surface2,
        '--on-surface-0': on0, '--on-surface-1': on1, '--on-surface-2': on2,
        '--accent': accent, '--on-accent': onAccent,
        '--border': adjustColor(bg, 28), '--focus-ring': `${accent}55`,
        '--icon-default': on1, '--icon-hover': on0, '--icon-active': onAccent, '--icon-disabled': adjustColor(on1, 40),
        '--control-disabled-bg': adjustColor(surface1, -10), '--control-disabled-text': adjustColor(on1, 35)
    };
}

function applyContrastEngine(base = {}) {
    const root = document.documentElement;
    const tokens = buildContrastTokens(base);
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
}
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
    if (!validateColorAccessibility(newPrefs)) return;
    const withValidated = applyAccessibilityColorGuards(newPrefs);
    userPrefs = { ...userPrefs, ...withValidated };
    window.userPrefs = userPrefs;
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(userPrefs));
    applyAllPreferences();
    syncSettingsUI();
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

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const srgb = [r, g, b].map(v => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function getCurrentSystemColors() {
    const isDark = document.documentElement.classList.contains('dark-mode') || (userPrefs.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return {
        bg: userPrefs.backgroundColor || (isDark ? '#0f172a' : '#f8fafc'),
        text: userPrefs.textColor || (isDark ? '#f8fafc' : '#0f172a')
    };
}

function showContrastWarning(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message || '';
}

function validateColorAccessibility(newPrefs) {
    const c = getCurrentSystemColors();
    const bg = newPrefs.backgroundColor ?? c.bg;
    const text = newPrefs.textColor ?? c.text;
    const ratio = contrastRatio(bg, text);
    const ok = ratio >= 4.5;
    showContrastWarning('bgContrastWarning', ok ? '' : `Độ tương phản thấp (${ratio.toFixed(2)}:1). Khuyến nghị >= 4.5:1.`);
    showContrastWarning('textContrastWarning', ok ? '' : `Màu chữ chưa đạt chuẩn (${ratio.toFixed(2)}:1).`);
    if (!ok) return window.confirm('Độ tương phản chưa đạt chuẩn WCAG 4.5:1. Bạn vẫn muốn dùng màu này?');
    if (newPrefs.accentColor) {
        const ar = contrastRatio(newPrefs.accentColor, bg);
        showContrastWarning('accentContrastWarning', ar < 3 ? `Màu nhấn có thể khó đọc trên nền (${ar.toFixed(2)}:1).` : '');
    }
    return true;
}

function getHcSafePalette() {
    return {
        bg: '#800000',
        text: '#fff8e8',
        accent: '#d4af37',
        border: '#efd8d8',
        focus: '#ffe39a'
    };
}

function applyAccessibilityColorGuards(newPrefs) {
    const strict = userPrefs.accessibilityStrict;
    if (!strict) return newPrefs;
    const safe = getHcSafePalette();
    const candidateBg = newPrefs.backgroundColor || userPrefs.backgroundColor || safe.bg;
    const candidateText = newPrefs.textColor || userPrefs.textColor || safe.text;
    const candidateAccent = newPrefs.accentColor || userPrefs.accentColor || safe.accent;
    const result = { ...newPrefs };
    const effective = {
        userPicked: { backgroundColor: newPrefs.backgroundColor, textColor: newPrefs.textColor, accentColor: newPrefs.accentColor },
        effectiveColor: { backgroundColor: candidateBg, textColor: candidateText, accentColor: candidateAccent },
        checks: {}
    };
    const pairs = [
        ['text/background', candidateText, candidateBg, 4.5, 'textColor'],
        ['button text/button bg', candidateText, candidateAccent, 4.5, 'accentColor'],
        ['border/background', safe.border, candidateBg, 3, null],
        ['focus ring/background', safe.focus, candidateBg, 3, null]
    ];
    pairs.forEach(([name, c1, c2, min, key]) => {
        const ratio = contrastRatio(c1, c2);
        effective.checks[name] = Number(ratio.toFixed(2));
        if (ratio < min && key) {
            result[key] = safe[key === 'textColor' ? 'text' : key === 'backgroundColor' ? 'bg' : 'accent'];
            effective.effectiveColor[key] = result[key];
            console.warn(`[A11Y] Override ${key}: ${c1} / ${c2} (${ratio.toFixed(2)}:1) < ${min}:1`);
            showContrastWarning('accentContrastWarning', 'Một số màu đã được tự động điều chỉnh để đảm bảo độ tương phản ở chế độ HC.');
        }
    });
    result.effectiveTokens = effective;
    return result;
}

function syncSettingsUI() {
    document.querySelectorAll('[data-pref-key]').forEach(btn => {
        const k = btn.dataset.prefKey;
        const v = btn.dataset.prefValue;
        btn.classList.toggle('active', String(userPrefs[k]) === v);
    });
    updateColorSwatches();
    const map = {trackingToggle:'trackingEnabled',hotkeysToggle:'hotkeysEnabled',autoSaveToggle:'autoSaveSession',interactionEffectsToggle:'interactionEffectsEnabled',vibrateToggle:'vibrateEnabled'};
    Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id); if(el) el.checked=!!userPrefs[key];});
    const ff = document.getElementById('fontFamilySelect'); if (ff) ff.value = userPrefs.fontFamily;
    const cp = document.getElementById('chartPaletteSelect'); if (cp) cp.value = userPrefs.chartPalette;
    const fs = document.getElementById('fontSizeDisplay'); if (fs) fs.textContent = `${userPrefs.fontSize}%`;
}
