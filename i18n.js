
let currentLang = localStorage.getItem('aav_lang') || 'vi';
let translations = {};

async function initI18n() {
    try {
        const response = await fetch('translations.json');
        translations = await response.json();
        
        // Ensure currentLang is valid
        if (!translations[currentLang]) {
            currentLang = 'vi';
            localStorage.setItem('aav_lang', 'vi');
        }
        
        applyTranslations();
        updateLanguageSwitcher();
        
        // Trigger calculation to update dynamic elements
        if (typeof calculate === 'function') {
            calculate();
        }
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

function t(key, variables = {}) {
    let text = translations[currentLang] ? translations[currentLang][key] : key;
    if (!text) return key;
    
    for (const [varName, varValue] of Object.entries(variables)) {
        text = text.replace(`{${varName}}`, varValue);
    }
    return text;
}

function applyTranslations() {
    // Update title and meta tags
    document.title = t('title');
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('description'));
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', t('keywords'));

    // Update elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'number' || !el.type)) {
            if (el.placeholder) el.placeholder = t(key);
        } else if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = t(key);
        } else {
            // Check if it's a dynamic table header or has specific content to preserve
            if (el.id === 'groupColumnTitle') {
                // Preserve user-edited title if it's not the default
                if (el.innerText === t('group', {lang: currentLang === 'vi' ? 'en' : 'vi'})) {
                    el.innerText = t(key);
                }
            } else {
                el.innerText = t(key);
            }
        }
    });

    // Update elements with data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        el.placeholder = t(key);
    });

    // Update elements with data-i18n-title attribute
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        el.title = t(key);
    });
}

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('aav_lang', lang);
    applyTranslations();
    updateLanguageSwitcher();
    
    // Re-calculate to update dynamic strings in the UI if needed
    if (typeof calculate === 'function') {
        calculate();
    }
    
    // Update Chart.js labels if charts exist
    if (typeof Chart !== 'undefined') {
        Chart.helpers.each(Chart.instances, function(instance) {
            // Update specific labels based on chart type or context
            if (instance.config.options.scales) {
                if (instance.config.options.scales.x && instance.config.options.scales.x.title) {
                    instance.config.options.scales.x.title.text = t('value_col');
                }
                if (instance.config.options.scales.y && instance.config.options.scales.y.title) {
                    // For relative frequency chart
                    if (instance.canvas.id === 'chartRelFreq') {
                        instance.config.options.scales.y.title.text = '%';
                    }
                }
            }
            
            // Update labels for Boxplot and Violin
            if (instance.config.type === 'boxplot' || instance.config.type === 'violin') {
                const key = instance.config.type === 'boxplot' ? 'distribution' : 'density';
                if (instance.config.data.labels && instance.config.data.labels.length > 0) {
                    instance.config.data.labels[0] = t(key);
                }
            }
            
            instance.update();
        });
    }
}

function updateLanguageSwitcher() {
    const switcher = document.getElementById('languageSwitcher');
    if (!switcher) return;
    
    const languages = {
        'vi': 'Tiếng Việt',
        'en': 'English',
        'zh': '中文',
        'hi': 'हिन्दी',
        'es': 'Español',
        'fr': 'Français',
        'ar': 'العربية',
        'bn': 'বাংলা',
        'pt': 'Português',
        'ru': 'Русский',
        'ur': 'اردو'
    };
    
    let html = `
        <div class="relative inline-block text-left">
            <button type="button" onclick="toggleLangDropdown()" class="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-lg shadow-sm font-medium transition text-sm hover:bg-slate-50">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                <span>${languages[currentLang]}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div id="langDropdown" class="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 max-h-64 overflow-y-auto">
                <div class="py-1" role="menu" aria-orientation="vertical">
    `;
    
    for (const [code, name] of Object.entries(languages)) {
        html += `
            <a href="#" onclick="changeLanguage('${code}'); return false;" class="block px-4 py-2 text-sm ${currentLang === code ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-100'}" role="menuitem">${name}</a>
        `;
    }
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    switcher.innerHTML = html;
}

function toggleLangDropdown() {
    const dropdown = document.getElementById('langDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
    }
}

// Close dropdown when clicking outside
window.addEventListener('click', function(e) {
    const dropdown = document.getElementById('langDropdown');
    const switcher = document.getElementById('languageSwitcher');
    if (dropdown && switcher && !switcher.contains(e.target)) {
        dropdown.classList.add('hidden');
    }
});

document.addEventListener('DOMContentLoaded', initI18n);
