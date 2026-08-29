// ============================================
// Pilot Software LLC — Interactions
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileNav();
    initScrollReveal();
    initSmoothScroll();
    initContactForm();
    initParallax();
    initChartTooltip();
});

// --- Navbar scroll effect ---
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 32);
    }, { passive: true });
}

// --- Mobile navigation ---
function initMobileNav() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.style.overflow = open ? 'hidden' : '';
    });

    links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('open');
            links.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        });
    });
}

// --- Scroll reveal (progressive enhancement, never hides content by default) ---
function initScrollReveal() {
    document.documentElement.classList.add('js');

    const elements = document.querySelectorAll(
        '.split-copy, .split-media, .benefit, .pillar, .section-head'
    );
    elements.forEach(el => el.classList.add('reveal'));

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));

    // Safety fallback
    setTimeout(() => {
        elements.forEach(el => el.classList.add('visible'));
    }, 1600);
}

// --- Smooth scrolling for same-page anchors ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const href = anchor.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 84;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

// --- Subtle scroll parallax on floating mockups ---
function initParallax() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const layers = document.querySelectorAll('[data-parallax]');
    if (!layers.length || !('requestAnimationFrame' in window)) return;

    let ticking = false;

    const update = () => {
        const vh = window.innerHeight;
        layers.forEach(el => {
            const speed = parseFloat(el.dataset.parallax) || 0.08;
            const rect = el.parentElement.getBoundingClientRect();
            const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
            el.style.transform = `translateY(${(-progress * speed * 100).toFixed(1)}px)`;
        });
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }, { passive: true });

    update();
}

// --- Chart tooltip ---
function initChartTooltip() {
    const chartDots = document.querySelectorAll('.chart-dot');
    if (!chartDots.length) return;

    const tooltip = document.getElementById('chartTooltip');
    if (!tooltip) return;

    const ttMonth = tooltip.querySelector('.tt-month');
    const ttValue = tooltip.querySelector('.tt-value');
    const chartLine = document.querySelector('.chart-line');
    const appFrame = document.querySelector('.app-frame');
    if (!appFrame) return;

    chartDots.forEach(dot => {
        dot.addEventListener('mouseenter', (e) => {
            const month = dot.dataset.month;
            const value = dot.dataset.value;
            if (month && value) {
                ttMonth.textContent = month;
                ttValue.textContent = value;

                // Get position relative to app-frame
                const dotRect = dot.getBoundingClientRect();
                const frameRect = appFrame.getBoundingClientRect();
                const x = dotRect.left - frameRect.left + dotRect.width / 2;
                const y = dotRect.top - frameRect.top;

                tooltip.style.left = `${x}px`;
                tooltip.style.top = `${y - 14}px`;
                tooltip.style.transform = 'translateX(-50%)';
                tooltip.style.display = 'block';
                tooltip.style.opacity = '1';

                // Dim the line
                chartLine.classList.add('dimmed');
            }
        });

        dot.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.style.display = 'none';
            }, 150);
            chartLine.classList.remove('dimmed');
        });
    });
}

// --- Contact form (async FormSubmit with status states) ---
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const statusEl = document.getElementById('formStatus');
    const submitBtn = form.querySelector('button[type="submit"]');
    const t = window.FORM_I18N || {
        sending: 'Sending…',
        ok: 'Message sent — we will get back to you shortly.',
        err: 'Something went wrong. Please email us directly.',
        required: 'Please fill in all required fields.'
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (form.querySelector('[name="_honey"]')?.value) return;

        if (!form.checkValidity()) {
            if (statusEl) { statusEl.textContent = t.required; statusEl.className = 'form-status err'; }
            form.reportValidity();
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (statusEl) { statusEl.textContent = t.sending; statusEl.className = 'form-status'; }

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: { 'Accept': 'application/json' }
            });
            if (res.ok) {
                if (statusEl) { statusEl.textContent = t.ok; statusEl.className = 'form-status ok'; }
                form.reset();
            } else {
                throw new Error('HTTP ' + res.status);
            }
        } catch (err) {
            if (statusEl) { statusEl.textContent = t.err; statusEl.className = 'form-status err'; }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}
