
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
            // Vibrate for 10ms (very light tap)
            window.navigator.vibrate(10);
        }
    }, { passive: true });
});
