// First Baptist Church of Rancho Cordova — shared site behavior
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      toggle.classList.toggle('is-open', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  // Desktop Programs dropdown
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-dropdown-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('is-open');
      document.querySelectorAll('.nav-dropdown.is-open').forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        dropdown.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown.is-open').forEach(dropdown => {
      dropdown.classList.remove('is-open');
      dropdown.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.nav-dropdown.is-open').forEach(dropdown => {
        dropdown.classList.remove('is-open');
        dropdown.querySelector('.nav-dropdown-trigger').setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Mobile Programs dropdown (accordion-style, inside full-screen mobile menu)
  document.querySelectorAll('.mobile-nav-dropdown').forEach(item => {
    const trigger = item.querySelector('.mobile-dropdown-trigger');
    const panel = item.querySelector('.mobile-dropdown-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
      panel.style.maxHeight = isOpen ? panel.scrollHeight + 'px' : null;
    });
  });

  // Accordion (FAQ)
  document.querySelectorAll('.accordion-item').forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const panel = item.querySelector('.accordion-panel');
    if (!trigger || !panel) return;
    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');
      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(other => {
        other.classList.remove('is-open');
        other.querySelector('.accordion-panel').style.maxHeight = null;
        other.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('is-open');
        panel.style.maxHeight = panel.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Reveal on scroll
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // Newsletter archive (reads assets/js/newsletters-data.js)
  const currentWrap = document.querySelector('[data-newsletter-current]');
  const pastWrap = document.querySelector('[data-newsletter-past]');
  if (currentWrap && typeof NEWSLETTER_MONTHS !== 'undefined') {
    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];

    const entries = NEWSLETTER_MONTHS
      .map(raw => String(raw).trim())
      .filter(raw => /^\d{4}-\d{2}$/.test(raw))
      .map(raw => {
        const [year, month] = raw.split('-').map(Number);
        return { key: raw, year, month, file: `newsletters/${raw}.pdf`,
          label: `${MONTH_NAMES[month - 1]} ${year}` };
      })
      // de-duplicate in case the same month was accidentally listed twice
      .filter((entry, i, arr) => arr.findIndex(e => e.key === entry.key) === i)
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));

    if (entries.length) {
      const [current, ...past] = entries;

      currentWrap.innerHTML = `
        <h2 class="mt-2">${current.label} Newsletter</h2>
        <div class="hero-actions mt-3" style="justify-content:center;">
          <a href="${current.file}" target="_blank" rel="noopener" class="btn btn-primary">Open Full Newsletter</a>
        </div>
        <div class="newsletter-embed mt-4">
          <iframe src="${current.file}" title="${current.label} Newsletter"></iframe>
        </div>
      `;

      if (pastWrap) {
        if (past.length) {
          pastWrap.innerHTML = past.map(entry => `
            <a href="${entry.file}" target="_blank" rel="noopener" class="newsletter-row">
              <span class="newsletter-row-icon"><svg viewBox="0 0 24 24" fill="none"><path d="M7 3H14L19 8V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V5C5 3.9 5.9 3 7 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3V8H19" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span>
              <span class="newsletter-row-label">${entry.label}</span>
              <span class="newsletter-row-arrow"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
            </a>
          `).join('');
          pastWrap.closest('[data-newsletter-past-section]')?.removeAttribute('hidden');
        }
      }
    } else {
      currentWrap.innerHTML = `
        <h2 class="mt-2">New newsletters are coming soon</h2>
        <p class="lede mt-3">Check back each month for the latest newsletter from our church family.</p>
      `;
    }
  }

  // Contact / prayer form (no backend — friendly confirmation only)
  const form = document.querySelector('[data-form]');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = form.querySelector('[data-form-note]');
      form.querySelectorAll('input, textarea, select').forEach(f => f.value = '');
      if (note) {
        note.textContent = 'Thank you — your message has been received. Our team will follow up soon.';
        note.style.color = 'var(--color-gold-dark)';
      }
    });
  }
});
