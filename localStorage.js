/**
 * AAV Auto-Backup System
 * Tự động sao lưu dữ liệu vào localStorage để tránh mất dữ liệu khi tải lại trang
 */

const STORAGE_KEY = 'aav_backup_data';
const BACKUP_TIMESTAMP_KEY = 'aav_backup_timestamp';
const AUTO_SAVE_INTERVAL = 1000; // Lưu mỗi 1 giây khi có thay đổi
let autoSaveTimer = null;
let hasUnsavedChanges = false;

function showAppNotification(message, type = 'info') {
    const safeMessage = String(message || '').trim();
    if (!safeMessage) return;

    let notification = document.getElementById('appNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'appNotification';
        notification.className = 'fixed top-4 right-4 max-w-sm text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50';
        document.body.appendChild(notification);
    }

    const typeClassMap = {
        success: 'bg-emerald-600',
        warning: 'bg-amber-600',
        error: 'bg-rose-600',
        info: 'bg-slate-700'
    };

    notification.className = `fixed top-4 right-4 max-w-sm text-white px-4 py-3 rounded-lg shadow-lg text-sm z-50 ${typeClassMap[type] || typeClassMap.info}`;
    notification.textContent = safeMessage;
    notification.style.display = 'block';

    clearTimeout(showAppNotification._timer);
    showAppNotification._timer = setTimeout(() => {
        notification.style.display = 'none';
    }, 2600);
}

function sanitizeText(value, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function sanitizeNumberValue(value, fallback = 0) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
}

function sanitizeFreqs(freqs) {
    if (!freqs || typeof freqs !== 'object') return {};
    const safeFreqs = {};
    Object.entries(freqs).forEach(([key, value]) => {
        if (/^\d+$/.test(key)) {
            safeFreqs[parseInt(key, 10)] = Math.max(0, Math.trunc(sanitizeNumberValue(value, 0)));
        }
    });
    return safeFreqs;
}

function sanitizeState(state) {
    if (!state || typeof state !== 'object') return null;

    const safeState = {
        m: state.m === 'table' ? 'table' : 'raw',
        ds: Array.isArray(state.ds) ? state.ds.slice(0, 30).map((d, i) => ({
            n: sanitizeText(d?.n, `${t('sample_prefix')}${String.fromCharCode(65 + i)}`).slice(0, 100),
            s: sanitizeText(d?.s, '').slice(0, 50000)
        })) : [],
        mr: Array.isArray(state.mr) ? state.mr.slice(0, 200).map((r) => ({
            l: sanitizeNumberValue(r?.l),
            u: sanitizeNumberValue(r?.u),
            f: sanitizeFreqs(r?.f)
        })) : [],
        dp: String(sanitizeNumberValue(state.dp, 2)),
        meth: state.meth === 'manual' ? 'manual' : 'auto',
        h: String(sanitizeNumberValue(state.h, 0)),
        k: String(sanitizeNumberValue(state.k, 0)),
        sv: String(sanitizeNumberValue(state.sv, 0)),
        ct: state.ct === 'charts' ? 'charts' : 'data'
    };

    if (safeState.ds.length === 0) {
        return null;
    }

    return safeState;
}

/**
 * Lấy trạng thái hiện tại của ứng dụng
 */
function getCurrentState() {
    return {
        m: mode,
        ds: datasets.map(d => ({ n: d.name, s: d.dataStr })),
        mr: manualRows.map(r => ({ l: r.lower, u: r.upper, f: r.freqs })),
        dp: document.getElementById('decimalPlaces').value,
        meth: document.getElementById('method').value,
        h: document.getElementById('manualH').value,
        k: document.getElementById('manualK').value,
        sv: document.getElementById('startValue').value,
        ct: currentTab // Lưu tab hiện tại
    };
}

/**
 * Lưu trạng thái vào localStorage
 */
function saveToLocalStorage() {
    try {
        const state = getCurrentState();
        const timestamp = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        localStorage.setItem(BACKUP_TIMESTAMP_KEY, timestamp);
        
        // Hiển thị thông báo sao lưu ngắn gọn
        showAutoSaveNotification();
        
        console.log('[AAV Auto-Backup] Dữ liệu đã được sao lưu lúc:', timestamp);
    } catch (e) {
        console.error('[AAV Auto-Backup] Lỗi khi lưu dữ liệu:', e);
        // Xử lý trường hợp localStorage đầy
        if (e.name === 'QuotaExceededError') {
            console.warn('[AAV Auto-Backup] localStorage đầy, xóa dữ liệu cũ');
            clearOldBackups();
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(getCurrentState()));
                localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
            } catch (e2) {
                console.error('[AAV Auto-Backup] Không thể lưu dữ liệu:', e2);
            }
        }
    }
}

/**
 * Lấy dữ liệu từ localStorage
 */
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        const timestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
        
        if (savedData) {
            const state = sanitizeState(JSON.parse(savedData));
            if (!state) return null;
            console.log('[AAV Auto-Backup] Dữ liệu được khôi phục từ:', timestamp);
            return state;
        }
    } catch (e) {
        console.error('[AAV Auto-Backup] Lỗi khi tải dữ liệu:', e);
    }
    return null;
}

/**
 * Khôi phục trạng thái từ localStorage
 */
function restoreFromLocalStorage() {
    const state = loadFromLocalStorage();
    if (!state) return false;

    try {
        // Khôi phục mode
        if (state.m) mode = state.m;
        
        // Khôi phục datasets
        if (state.ds) {
            datasets = state.ds.map((d, i) => ({ id: i + 1, name: d.n, dataStr: d.s }));
        }
        
        // Khôi phục manual rows
        if (state.mr) {
            manualRows = state.mr.map((r, i) => ({ id: Date.now() + i, lower: r.l, upper: r.u, freqs: r.f }));
        }
        
        // Khôi phục các giá trị input
        if (state.dp) document.getElementById('decimalPlaces').value = state.dp;
        if (state.meth) document.getElementById('method').value = state.meth;
        if (state.h) document.getElementById('manualH').value = state.h;
        if (state.k) document.getElementById('manualK').value = state.k;
        if (state.sv) document.getElementById('startValue').value = state.sv;
        
        // Khôi phục tab hiện tại
        if (state.ct) currentTab = state.ct;
        
        console.log('[AAV Auto-Backup] Trạng thái đã được khôi phục thành công');
        return true;
    } catch (e) {
        console.error('[AAV Auto-Backup] Lỗi khi khôi phục trạng thái:', e);
        return false;
    }
}

/**
 * Đánh dấu có thay đổi chưa lưu
 */
function markAsChanged() {
    hasUnsavedChanges = true;
    
    // Xóa timer cũ nếu có
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    
    // Thiết lập timer mới để lưu sau 1 giây
    autoSaveTimer = setTimeout(() => {
        if (hasUnsavedChanges) {
            saveToLocalStorage();
            hasUnsavedChanges = false;
        }
    }, AUTO_SAVE_INTERVAL);
}

/**
 * Hiển thị thông báo sao lưu tự động
 */
function showAutoSaveNotification() {
    // Kiểm tra xem thông báo đã tồn tại chưa
    let notification = document.getElementById('autoSaveNotification');
    
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'autoSaveNotification';
        notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 z-40 animate-pulse';
        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('class', 'w-4 h-4');
        icon.setAttribute('fill', 'none');
        icon.setAttribute('stroke', 'currentColor');
        icon.setAttribute('viewBox', '0 0 24 24');
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('d', 'M5 13l4 4L19 7');
        icon.appendChild(path);

        const label = document.createElement('span');
        label.textContent = t('data_saved');

        notification.appendChild(icon);
        notification.appendChild(label);
        document.body.appendChild(notification);
    }
    
    // Hiển thị thông báo
    notification.style.display = 'flex';
    notification.classList.add('animate-pulse');
    
    // Ẩn thông báo sau 2 giây
    setTimeout(() => {
        notification.style.display = 'none';
        notification.classList.remove('animate-pulse');
    }, 2000);
}

/**
 * Xóa dữ liệu sao lưu
 */
function clearBackup() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
        console.log('[AAV Auto-Backup] Dữ liệu sao lưu đã được xóa');
        showAppNotification(t('backup_cleared'), 'success');
    } catch (e) {
        console.error('[AAV Auto-Backup] Lỗi khi xóa dữ liệu:', e);
    }
}

/**
 * Xóa các backup cũ khi storage đầy
 */
function clearOldBackups() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
        console.log('[AAV Auto-Backup] Đã xóa backup cũ');
    } catch (e) {
        console.error('[AAV Auto-Backup] Lỗi khi xóa backup cũ:', e);
    }
}

/**
 * Lấy thông tin sao lưu cuối cùng
 */
function getLastBackupInfo() {
    const timestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    if (timestamp) {
        const date = new Date(timestamp);
        return {
            timestamp: timestamp,
            formatted: date.toLocaleString((() => {
                const lang = typeof currentLang !== 'undefined' ? currentLang : (localStorage.getItem('aav_lang') || 'vi');
                const localeMap = {
                    'vi': 'vi-VN', 'en': 'en-US', 'zh': 'zh-CN', 'hi': 'hi-IN', 'es': 'es-ES',
                    'fr': 'fr-FR', 'ar': 'ar-SA', 'bn': 'bn-BD', 'pt': 'pt-PT', 'ru': 'ru-RU', 'ur': 'ur-PK'
                };
                return localeMap[lang] || 'en-US';
            })()),
            exists: true
        };
    }
    return { exists: false };
}

/**
 * Xuất dữ liệu sao lưu dưới dạng JSON
 */
function exportBackupAsJSON() {
    const state = loadFromLocalStorage();
    if (!state) {
        showAppNotification(t('no_backup_to_export'), 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AAV_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Nhập dữ liệu sao lưu từ file JSON
 */
function importBackupFromJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const state = sanitizeState(JSON.parse(event.target.result));

                // Validate dữ liệu
                if (!state || !state.ds || !Array.isArray(state.ds)) {
                    throw new Error(t('invalid_file_format'));
                }

                // Lưu vào localStorage
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());
                
                showAppNotification(t('import_success'), 'success');
                console.log('[AAV Auto-Backup] Dữ liệu sao lưu đã được nhập');
            } catch (e) {
                showAppNotification('Lỗi khi nhập dữ liệu: ' + e.message, 'error');
                console.error('[AAV Auto-Backup] Lỗi khi nhập:', e);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * Khởi tạo hệ thống auto-backup
 */
function initAutoBackup() {
    console.log('[AAV Auto-Backup] Khởi tạo hệ thống tự động sao lưu');
    
    // Lưu khi người dùng thay đổi dữ liệu
    // Các hàm này sẽ được gọi từ các event handlers trong index.html
    
    // Lưu khi tắt tab/cửa sổ
    window.addEventListener('beforeunload', () => {
        if (hasUnsavedChanges) {
            saveToLocalStorage();
        }
    });
    
    console.log('[AAV Auto-Backup] Hệ thống tự động sao lưu đã được khởi tạo');
}
