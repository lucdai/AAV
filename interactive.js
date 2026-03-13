document.addEventListener('DOMContentLoaded', () => {
    // 1. Click Effect (Ripple)
    const createClickEffect = (x, y) => {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        document.body.appendChild(effect);

        effect.addEventListener('animationend', () => {
            effect.remove();
        });
    };

    document.addEventListener('mousedown', (e) => {
        createClickEffect(e.clientX, e.clientY);
    });

    // 2. Touch Ripple Effect (for Mobile)
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const x = touch.clientX;
        const y = touch.clientY;

        // Create ripple on the element touched if it's a button or card
        const target = e.target.closest('button, .modern-card, .btn-primary, .btn-secondary');
        if (target) {
            const rect = target.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'touch-ripple';

            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';

            const rippleX = x - rect.left - size / 2;
            const rippleY = y - rect.top - size / 2;

            ripple.style.left = rippleX + 'px';
            ripple.style.top = rippleY + 'px';

            target.style.position = 'relative';
            target.style.overflow = 'hidden';
            target.appendChild(ripple);

            ripple.addEventListener('animationend', () => {
                ripple.remove();
            });
        }

        // Also show the click ripple at touch point
        createClickEffect(x, y);

        // 3. Haptic Feedback (Vibration)
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(10);
        }
    }, { passive: true });

    initToastContainer();
    initConfirmModal();
});

const FOCUSABLE_SELECTOR = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])';
let activeModalState = null;

function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(el => el.offsetParent !== null || el === document.activeElement);
}

function activateModal(modalId, contentId, initialFocusSelector) {
    const modal = document.getElementById(modalId);
    const content = document.getElementById(contentId);
    if (!modal || !content) return;

    const previouslyFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const focusables = getFocusableElements(content);
    const preferred = initialFocusSelector ? content.querySelector(initialFocusSelector) : null;
    const initialFocus = preferred || focusables[0] || content;
    if (!content.hasAttribute('tabindex')) content.setAttribute('tabindex', '-1');
    initialFocus.focus();

    const handleKeydown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            if (modalId === 'calcModal' && typeof window.closeCalcModal === 'function') window.closeCalcModal();
            if (modalId === 'changelogModal' && typeof window.closeChangelogModal === 'function') window.closeChangelogModal();
            return;
        }
        if (event.key !== 'Tab') return;

        const items = getFocusableElements(content);
        if (items.length === 0) {
            event.preventDefault();
            content.focus();
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];
        const isShift = event.shiftKey;

        if (isShift && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!isShift && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    };

    activeModalState = { modalId, previouslyFocused, handleKeydown };
    document.addEventListener('keydown', handleKeydown);
}

function deactivateModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    if (activeModalState && activeModalState.modalId === modalId) {
        document.removeEventListener('keydown', activeModalState.handleKeydown);
        if (activeModalState.previouslyFocused && typeof activeModalState.previouslyFocused.focus === 'function') {
            activeModalState.previouslyFocused.focus();
        }
        activeModalState = null;
    }
}

function initToastContainer() {
    if (document.getElementById('aavToastRegion')) return;
    const region = document.createElement('div');
    region.id = 'aavToastRegion';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.className = 'fixed bottom-4 right-4 z-[70] flex flex-col gap-2';
    document.body.appendChild(region);
}

function showToast(message, type = 'info') {
    const region = document.getElementById('aavToastRegion');
    if (!region) return;
    const tone = type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-emerald-600' : 'bg-slate-700';

    const toast = document.createElement('div');
    toast.className = `${tone} text-white px-4 py-2 rounded-lg shadow-lg text-sm`;
    toast.textContent = message;
    region.appendChild(toast);

    setTimeout(() => toast.remove(), 2600);
}

function initConfirmModal() {
    if (document.getElementById('confirmActionModal')) return;
    const html = `
        <div id="confirmActionModal" class="fixed inset-0 bg-slate-900/60 z-[80] hidden items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirmActionTitle" aria-describedby="confirmActionMessage">
            <div id="confirmActionContent" class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200" tabindex="-1">
                <h3 id="confirmActionTitle" class="text-lg font-bold text-slate-900 mb-2">Xác nhận thao tác</h3>
                <p id="confirmActionMessage" class="text-sm text-slate-600"></p>
                <div class="mt-6 flex justify-end gap-3">
                    <button id="confirmActionCancel" type="button" class="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">${typeof t === 'function' ? t('close') : 'Đóng'}</button>
                    <button id="confirmActionOk" type="button" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">OK</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function showConfirmModal(message, options = {}) {
    const modal = document.getElementById('confirmActionModal');
    const content = document.getElementById('confirmActionContent');
    const title = document.getElementById('confirmActionTitle');
    const msg = document.getElementById('confirmActionMessage');
    const okButton = document.getElementById('confirmActionOk');
    const cancelButton = document.getElementById('confirmActionCancel');

    if (!modal || !content || !title || !msg || !okButton || !cancelButton) {
        return Promise.resolve(window.confirm(message));
    }

    title.textContent = options.title || 'Xác nhận thao tác';
    msg.textContent = message;
    okButton.textContent = options.confirmText || 'OK';
    cancelButton.textContent = options.cancelText || (typeof t === 'function' ? t('close') : 'Đóng');

    return new Promise((resolve) => {
        const cleanup = () => {
            okButton.removeEventListener('click', onConfirm);
            cancelButton.removeEventListener('click', onCancel);
            modal.removeEventListener('click', onBackdrop);
            deactivateModal('confirmActionModal');
        };
        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        const onBackdrop = (event) => {
            if (event.target === modal) {
                cleanup();
                resolve(false);
            }
        };

        okButton.addEventListener('click', onConfirm);
        cancelButton.addEventListener('click', onCancel);
        modal.addEventListener('click', onBackdrop);
        activateModal('confirmActionModal', 'confirmActionContent', '#confirmActionCancel');
    });
}
