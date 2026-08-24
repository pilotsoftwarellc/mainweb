// ============================================
// Pilot Software LLC — Premium interactions
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileNav();
    initScrollReveal();
    initSmoothScroll();
    initContactForm();
    initCounters();
    initOrbitPackets();
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

// --- Scroll reveal (progressive enhancement) ---
function initScrollReveal() {
    document.documentElement.classList.add('js');

    const elements = document.querySelectorAll(
        '.service-card, .process-step, .about-point, .showcase, .metric, .section-head'
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

// --- Smooth scrolling ---
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

// --- Animated counters (real data only; values set in HTML data-count) ---
function initCounters() {
    const counters = document.querySelectorAll('[data-count]');
    if (!counters.length || !('IntersectionObserver' in window)) return;

    const fmt = new Intl.NumberFormat(document.documentElement.lang === 'es' ? 'es' : 'en');

    const animate = (el) => {
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const decimals = Number(el.dataset.decimals || 0);
        const dur = 1400;
        let start = null;

        const tick = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
            el.textContent = fmt.format(+(target * eased).toFixed(decimals)) + suffix;
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    };

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animate(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.4 });

    counters.forEach(el => obs.observe(el));
}

// --- Orbit: animate data packets along the connection lines ---
function initOrbitPackets() {
    const svg = document.querySelector('.orbit-svg');
    if (!svg || !('animate' in Element.prototype)) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const NS = 'http://www.w3.org/2000/svg';
    svg.querySelectorAll('line').forEach((line, i) => {
        const x1 = +line.getAttribute('x1'), y1 = +line.getAttribute('y1');
        const x2 = +line.getAttribute('x2'), y2 = +line.getAttribute('y2');

        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('r', '2.5');
        circle.setAttribute('class', 'packet');
        circle.setAttribute('fill', '#00D9FF');
        svg.appendChild(circle);

        const dur = 3600 + (i % 3) * 1200;
        const delay = i * 550;
        const anim = circle.animate([
            { cx: x1, cy: y1, opacity: 0 },
            { opacity: 1, offset: 0.12 },
            { opacity: 1, offset: 0.88 },
            { cx: x2, cy: y2, opacity: 0 }
        ], { duration: dur, delay, iterations: Infinity });

        anim.startTime = performance.now() + delay;
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
