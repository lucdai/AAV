// Changelog Manager - Fetches changelog from local JSON file or GitHub API
const GITHUB_REPO = 'lucdai/AAV';
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_REPO}`;
const CHANGELOG_JSON_URL = './changelog.json';

let changelogData = [];
let changelogCache = null;
const CACHE_KEY = 'aav_changelog_cache';
const CACHE_EXPIRY_KEY = 'aav_changelog_cache_expiry';
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

// Initialize changelog modal
function initChangelogModal() {
    const modalHTML = `
        <div id="changelogModal" class="fixed inset-0 bg-slate-900/60 z-50 hidden items-center justify-center p-4 backdrop-blur-md animate-fade-in">
            <div id="changelogModalContent" class="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-white/20">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 id="changelogModalTitle" class="text-lg font-extrabold text-slate-900 flex items-center gap-3">
                        <div class="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span data-i18n="changelog_title">Lịch sử cập nhật phiên bản</span>
                    </h3>
                    <button onclick="closeChangelogModal()" class="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div id="changelogModalBody" class="p-8 overflow-y-auto text-slate-700 leading-relaxed">
                    <div class="text-center py-8">
                        <div class="inline-block">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                        <p class="mt-4 text-slate-600" data-i18n="loading_changelog">Đang tải lịch sử cập nhật...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Insert modal into the body
    if (!document.getElementById('changelogModal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Fetch changelog from local JSON file
async function fetchChangelogFromJSON() {
    try {
        // Check cache first
        const now = Date.now();
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
        
        if (cachedData && cacheExpiry && now < parseInt(cacheExpiry)) {
            return JSON.parse(cachedData);
        }
        
        // Fetch changelog.json
        const response = await fetch(CHANGELOG_JSON_URL);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch changelog: ${response.status}`);
        }
        
        const changelog = await response.json();
        
        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify(changelog));
        localStorage.setItem(CACHE_EXPIRY_KEY, (now + CACHE_DURATION).toString());
        
        return changelog;
    } catch (error) {
        console.error('Error fetching changelog from JSON:', error);
        return null;
    }
}

// Fetch changelog from GitHub API (fallback)
async function fetchChangelogFromGitHub() {
    try {
        // Check cache first
        const now = Date.now();
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY);
        
        if (cachedData && cacheExpiry && now < parseInt(cacheExpiry)) {
            return JSON.parse(cachedData);
        }
        
        // Fetch commits from GitHub API
        const response = await fetch(`${GITHUB_API_URL}/commits?per_page=50`);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const commits = await response.json();
        
        // Process commits into changelog format
        const changelog = {
            generated_at: new Date().toISOString(),
            total_commits: commits.length,
            repository: GITHUB_REPO,
            entries: []
        };
        
        const grouped = {};
        commits.forEach(commit => {
            const date = new Date(commit.commit.author.date).toLocaleDateString('en-CA');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push({
                sha: commit.sha.substring(0, 7),
                message: commit.commit.message.split('\n')[0],
                author: commit.commit.author.name,
                url: commit.html_url
            });
        });
        
        // Sort dates in reverse order
        for (const date of Object.keys(grouped).sort().reverse()) {
            changelog.entries.push({
                date: date,
                commit_count: grouped[date].length,
                categories: {
                    'All': grouped[date]
                }
            });
        }
        
        // Cache the data
        localStorage.setItem(CACHE_KEY, JSON.stringify(changelog));
        localStorage.setItem(CACHE_EXPIRY_KEY, (now + CACHE_DURATION).toString());
        
        return changelog;
    } catch (error) {
        console.error('Error fetching changelog from GitHub:', error);
        return null;
    }
}

// Display changelog in modal
function displayChangelog(changelog) {
    const modalBody = document.getElementById('changelogModalBody');
    
    if (!changelog || !changelog.entries || changelog.entries.length === 0) {
        modalBody.innerHTML = `
            <div class="text-center py-12">
                <svg class="w-12 h-12 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p class="text-slate-600" data-i18n="no_changelog">Không có dữ liệu lịch sử cập nhật</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="space-y-6">';
    
    changelog.entries.forEach(entry => {
        html += `
            <div class="border-l-4 border-indigo-500 pl-4">
                <h4 class="font-bold text-slate-900 mb-3">
                    ${entry.date}
                    <span class="text-sm font-normal text-slate-500 ml-2">(${entry.commit_count} commit${entry.commit_count !== 1 ? 's' : ''})</span>
                </h4>
                <div class="space-y-2">
        `;
        
        // Display commits by category
        for (const [category, commits] of Object.entries(entry.categories || {})) {
            if (commits && commits.length > 0) {
                if (category !== 'All') {
                    html += `<div class="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">${category}</div>`;
                }
                
                commits.forEach(commit => {
                    html += `
                        <div class="bg-slate-50 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                            <div class="flex items-start justify-between gap-2">
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-medium text-slate-900 break-words">${escapeHtml(commit.message)}</p>
                                    <div class="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                        <span class="font-mono bg-slate-200 px-2 py-1 rounded">${commit.sha}</span>
                                        <span>${commit.author}</span>
                                    </div>
                                </div>
                                <a href="${commit.url}" target="_blank" rel="noopener noreferrer" class="flex-shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View on GitHub">
                                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                </a>
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    modalBody.innerHTML = html;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Open changelog modal
async function openChangelogModal() {
    const modal = document.getElementById('changelogModal');
    if (!modal) {
        initChangelogModal();
    }
    
    const modal2 = document.getElementById('changelogModal');
    modal2.classList.remove('hidden');
    modal2.classList.add('flex');
    
    // Fetch and display changelog
    let changelog = await fetchChangelogFromJSON();
    
    // Fallback to GitHub API if JSON file not available
    if (!changelog) {
        changelog = await fetchChangelogFromGitHub();
    }
    
    displayChangelog(changelog);
}

// Close changelog modal
function closeChangelogModal() {
    const modal = document.getElementById('changelogModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Add changelog icon to footer
function addChangelogIcon() {
    const githubLink = document.querySelector('a[href="https://github.com/lucdai/AAV"]');
    
    if (githubLink && !document.getElementById('changelogIcon')) {
        const changelogIcon = document.createElement('a');
        changelogIcon.id = 'changelogIcon';
        changelogIcon.href = '#';
        changelogIcon.className = 'w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer';
        changelogIcon.title = 'View Update History';
        changelogIcon.setAttribute('data-i18n-title', 'changelog');
        changelogIcon.onclick = (e) => {
            e.preventDefault();
            openChangelogModal();
        };
        changelogIcon.innerHTML = `
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
        `;
        
        githubLink.parentNode.insertBefore(changelogIcon, githubLink.nextSibling);
    }
}

// Initialize when page loads
window.addEventListener('load', () => {
    initChangelogModal();
    addChangelogIcon();
});

// Re-add icon when language changes (in case footer is regenerated)
window.addEventListener('i18nReady', () => {
    addChangelogIcon();
});

// Listen for language change events
const originalChangeLanguage = window.changeLanguage;
if (originalChangeLanguage) {
    window.changeLanguage = function(lang) {
        originalChangeLanguage.call(this, lang);
        addChangelogIcon();
    };
}
