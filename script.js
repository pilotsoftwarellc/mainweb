// ============================================
// Pilot Software LLC — Shared Script (EN + ES)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initMobileNav();
    initScrollReveal();
    initSmoothScroll();
    initContactForm();
});

// --- Navbar scroll effect ---
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 40);
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
        document.body.style.overflow = open ? 'hidden' : '';
    });

    links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            toggle.classList.remove('open');
            links.classList.remove('open');
            document.body.style.overflow = '';
        });
    });
}

// --- Scroll reveal (progressive enhancement, never hides content by default) ---
function initScrollReveal() {
    document.documentElement.classList.add('js');

    const elements = document.querySelectorAll(
        '.service-card, .process-step, .why-point, .work-card, .section-intro, .contact-layout'
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
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });

    elements.forEach(el => observer.observe(el));

    // Safety fallback
    setTimeout(() => {
        elements.forEach(el => el.classList.add('visible'));
    }, 1500);
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
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });
}

// --- Contact form (FormSubmit.co async submission with status states) ---
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

        // Honeypot check
        if (form.querySelector('[name="_honey"]')?.value) return;

        // Basic validation feedback
        if (!form.checkValidity()) {
            if (statusEl) { statusEl.textContent = t.required; statusEl.className = 'form-status err'; }
            form.reportValidity();
            return;
        }

        if (submitBtn) { submitBtn.disabled = true; }
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
            if (submitBtn) { submitBtn.disabled = false; }
        }
    });
}
