/**
 * BTL Events — Exit Intent (desktop) + Sticky CTA (mobile)
 * Desktop: cursor-toward-close triggers overlay once per session.
 * Mobile: scroll-triggered sticky CTA bar at 60% scroll depth.
 * Only fires if user hasn't registered (no btl_registration in sessionStorage).
 */
(function() {
  let shown = false;

  document.addEventListener('btl:config-ready', ({ detail }) => {
    const { config } = detail;

    // Skip if user already registered or event is post-event
    if (sessionStorage.getItem('btl_registration')) return;
    if (config.post_event?.enabled) return;

    if (window.innerWidth >= 768) {
      initExitIntent();
    } else {
      initStickyCTA(config);
    }
  });

  // ——— Desktop: Exit Intent Overlay ———
  function initExitIntent() {
    const overlay = document.querySelector('.exit-overlay');
    if (!overlay) return;

    // Trigger when cursor moves above viewport (toward close/tab bar)
    document.addEventListener('mouseout', (e) => {
      if (shown) return;
      if (e.clientY > 5) return; // Only trigger near top edge
      if (e.relatedTarget || e.toElement) return; // Cursor went to a child element

      showOverlay(overlay);
    }, { passive: true });

    // Also trigger after 45 seconds of inactivity
    let inactivityTimer = setTimeout(() => {
      if (!shown) showOverlay(overlay);
    }, 45000);

    // Reset inactivity timer on interaction
    ['mousemove', 'scroll', 'keydown', 'click'].forEach(evt => {
      document.addEventListener(evt, () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          if (!shown) showOverlay(overlay);
        }, 45000);
      }, { passive: true, once: false });
    });

    // Close handlers
    const closeBtn = overlay.querySelector('.exit-overlay__close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => hideOverlay(overlay));
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) hideOverlay(overlay);
    });

    // CTA button scrolls to form
    const ctaBtn = overlay.querySelector('[data-exit-cta]');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        hideOverlay(overlay);
        const form = document.querySelector('[data-form-section]');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  function showOverlay(overlay) {
    shown = true;
    overlay.classList.add('active');
    sessionStorage.setItem('btl_exit_shown', '1');
  }

  function hideOverlay(overlay) {
    overlay.classList.remove('active');
  }

  // ——— Mobile: Sticky CTA Bar ———
  function initStickyCTA(config) {
    const bar = document.querySelector('.sticky-cta');
    if (!bar) return;

    const spotsLeft = Math.max(0, (config.capacity || 75) - (config.demo_counts?.total || 0));
    const spotsEl = bar.querySelector('.sticky-cta__spots');
    if (spotsEl && spotsLeft > 0 && spotsLeft < 40) {
      spotsEl.textContent = `${spotsLeft} spots left`;
    }

    let barActive = false;

    window.addEventListener('scroll', () => {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.6 && !barActive) {
        bar.classList.add('active');
        barActive = true;
      }
    }, { passive: true });

    // CTA button scrolls to form
    const ctaBtn = bar.querySelector('[data-sticky-cta]');
    if (ctaBtn) {
      ctaBtn.addEventListener('click', () => {
        const form = document.querySelector('[data-form-section]');
        if (form) form.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
})();
