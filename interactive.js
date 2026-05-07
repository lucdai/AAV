
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

    // 3. Hover Effect for Icons and Buttons (Micro-interactions)
    const interactiveElements = document.querySelectorAll('button, .footer-icon-btn, .logo-container, .export-format-btn, .modern-card');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            const svg = el.querySelector('svg');
            if (svg) {
                svg.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
                svg.style.transform = 'scale(1.25) rotate(8deg)';
            }
            if (el.classList.contains('modern-card')) {
                el.style.transform = 'translateY(-6px)';
            }
        });
        el.addEventListener('mouseleave', () => {
            const svg = el.querySelector('svg');
            if (svg) {
                svg.style.transform = 'scale(1) rotate(0deg)';
            }
            if (el.classList.contains('modern-card')) {
                el.style.transform = 'translateY(0)';
            }
        });
    });

    // 4. Smooth Scroll for Tab Switching
    window.addEventListener('i18nReady', () => {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        });
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
            // Vibrate for 10ms (very light tap)
            window.navigator.vibrate(10);
        }
    }, { passive: true });
});
