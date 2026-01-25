// =========================
// STUDENT PARTNER INTERACTIVE SYSTEM
// =========================

// 🎯 Counter Animation (Lifecycle Stats)
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number[data-target]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2500; // 2.5s animation
        let startTime = null;

        const updateCounter = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const current = easeOutQuart(progress) * target;

            counter.textContent = Math.floor(current).toLocaleString();
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + '+';
                counter.style.fontSize = '3.2rem'; // Final size boost
            }
        };
        requestAnimationFrame(updateCounter);
    });
}

// 📈 Progress Bar Animation
function animateProgressBars() {
    const progressFills = document.querySelectorAll('.progress-fill, .lifecycle-progress');
    progressFills.forEach((fill, index) => {
        const targetWidth = fill.dataset.width || '100%';
        setTimeout(() => {
            fill.style.width = targetWidth;
            fill.style.transition = 'width 2s cubic-bezier(0.4, 0, 0.2, 1)';
        }, index * 200);
    });
}

// 🎠 3D Tilt Effect (Cards & Buttons)
function addTiltEffect() {
    const tiltElements = document.querySelectorAll('[data-tilt], .support-card, .module-card, .btn');

    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            el.style.transition = 'transform 0.1s ease-out';
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            el.style.transition = 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        });
    });
}

// ✨ Mouse Trail + Particle Explosion
function createMouseTrail() {
    const trail = document.createElement('div');
    trail.className = 'mouse-trail';
    document.body.appendChild(trail);

    let trailCount = 0;
    document.addEventListener('mousemove', (e) => {
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        trail.style.opacity = '0.8';

        // Particle burst every 10px moved
        if (trailCount++ % 10 === 0) {
            createParticleBurst(e.clientX, e.clientY);
        }
    });

    // Fade trail
    document.addEventListener('mousemove', () => {
        trail.style.opacity = '0';
        setTimeout(() => trail.style.opacity = '0.8', 50);
    });
}

// 💥 Particle Burst System
function createParticleBurst(x, y) {
    for (let i = 0; i < 6; i++) {
        const particle = document.createElement('div');
        particle.className = 'hero-particle-burst';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.transform = `translate(-50%, -50%) rotate(${i * 60}deg)`;
        document.body.appendChild(particle);

        setTimeout(() => {
            particle.style.transform += ` translate(${20 + i * 5}px, ${20 + i * 5}px)`;
            particle.style.opacity = '0';
        }, 10);

        setTimeout(() => particle.remove(), 800);
    }
}

// 🎬 Scroll-triggered Animations (Intersection Observer)
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, index * 100);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all animatable elements
    document.querySelectorAll('.support-card, .module-card, .stat, .hero-content > *').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(60px) scale(0.95)';
        el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
}

// 🎪 Lifecycle Journey Animation
function animateLifecycleJourney() {
    const stages = ['Student', 'Graduate', 'Intern', 'Professional'];
    let stageIndex = 0;

    setInterval(() => {
        const currentStage = document.querySelector('.current-lifecycle-stage');
        if (currentStage) {
            currentStage.textContent = stages[stageIndex];
            stageIndex = (stageIndex + 1) % stages.length;
        }
    }, 3000);
}

// 🎵 Sound Effects (Optional - Mobile muted)
function initMicroInteractions() {
    // Button ripple effect
    document.querySelectorAll('.btn, .nav-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            createRipple(e, btn);
        });
    });

    // Logo hover sparkle
    const logo = document.querySelector('.logo-img');
    if (logo) {
        logo.addEventListener('mouseenter', () => createSparkleBurst(logo));
    }
}

// 💧 Ripple Effect
function createRipple(e, button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.classList.add('ripple');
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

// ✨ Sparkle Burst for Logo
function createSparkleBurst(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = centerX + 'px';
        sparkle.style.top = centerY + 'px';
        document.body.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 1000);
    }
}

// 🧮 Easing Functions
const easeOutQuart = (t) => 1 - (--t) * t * t * t;

// 🎮 MASTER INITIALIZER
document.addEventListener('DOMContentLoaded', () => {
    // Core animations
    animateCounters();
    animateProgressBars();
    addTiltEffect();
    createMouseTrail();
    initScrollAnimations();
    initMicroInteractions();

    // Lifecycle & floating elements
    setTimeout(() => {
        animateLifecycleJourney();
        document.querySelectorAll('.shape, .hero-particles .particle').forEach((el, i) => {
            el.style.animationDelay = `${i * 0.5}s`;
        });
    }, 500);

    // Parallax header on scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const header = document.querySelector('.main-header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.2}px)`; // Refined
        }
    });

    // Password Toggle Logic
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
});

// =========================
// PERFORMANCE OPTIMIZATIONS
// =========================
window.addEventListener('load', () => {
    // Preload critical animations
    document.body.classList.add('animations-ready');
});

// Password Strength
document.getElementById('register-password')?.addEventListener('input', (e) => {
    const password = e.target.value;
    const strengthBar = e.target.parentElement.querySelector('.strength-bar');
    if (!strengthBar) return;

    let strength = 0;
    if (password.length > 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const levels = ['weak', 'fair', 'good', 'strong'];
    const strengthClass = levels[Math.min(strength, 3)];
    strengthBar.className = `strength-bar strength-${strengthClass}`;

    // Smooth transition
    strengthBar.style.width = `${(Math.min(strength + 1, 4) / 4) * 100}%`;
});