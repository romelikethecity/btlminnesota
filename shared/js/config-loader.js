/**
 * BTL Events — Config Loader
 * Reads config.json, hydrates page sections based on specialty slug.
 * Entry: BTLEvents.init({ specialty: 'chiro' }) or BTLEvents.init() for main page.
 */
const BTLEvents = (() => {
  let config = null;
  let specialty = null;

  /** Resolve config.json path relative to page location */
  function getConfigPath() {
    const path = window.location.pathname;
    if (path.includes('/specialty/')) return '../config.json';
    return 'config.json';
  }

  async function loadConfig() {
    const resp = await fetch(getConfigPath());
    if (!resp.ok) throw new Error(`Config load failed: ${resp.status}`);
    config = await resp.json();
    return config;
  }

  function init(opts = {}) {
    specialty = opts.specialty || null;
    loadConfig().then(() => {
      hydratePage();
      // Dispatch event for other modules
      document.dispatchEvent(new CustomEvent('btl:config-ready', { detail: { config, specialty } }));
    }).catch(err => {
      console.error('BTLEvents config error:', err);
    });
  }

  function hydratePage() {
    hydrateEventMeta();
    hydrateHero();
    hydrateAgenda();
    hydrateSpeakers();
    hydrateFAQ();
    hydrateLocation();
    hydrateForm();

    if (specialty && config.specialties[specialty]) {
      hydrateSpecialty();
    }

    // Post-event mode: config flag OR ?post=true URL param (for demo)
    const urlParams = new URLSearchParams(window.location.search);
    if (config.status === 'post-event' || config.post_event?.enabled || urlParams.get('post') === 'true') {
      activatePostEventMode();
    }
  }

  // ——— Event Meta ———
  function hydrateEventMeta() {
    setText('[data-event-name]', config.event_name);
    setText('[data-event-tagline]', config.event_tagline);
    setText('[data-event-date]', formatDate(config.date));
    setText('[data-event-time]', `${formatTime(config.time_start)} – ${formatTime(config.time_end)}`);
    setText('[data-event-venue]', config.location.venue);
    setText('[data-event-city]', `${config.location.city}, ${config.location.state}`);
    setText('[data-event-address]', `${config.location.address}, ${config.location.city}, ${config.location.state} ${config.location.zip}`);

    // Maps link
    document.querySelectorAll('[data-maps-link]').forEach(el => {
      el.href = config.location.maps_url;
    });

    // Page title
    if (specialty && config.specialties[specialty]) {
      document.title = `${config.specialties[specialty].name} — ${config.event_name}`;
    } else {
      document.title = config.event_name;
    }
  }

  // ——— Hero ———
  function hydrateHero() {
    if (specialty && config.specialties[specialty]) {
      const spec = config.specialties[specialty];
      setText('[data-hero-headline]', spec.headline);
      setText('[data-hero-subheadline]', spec.subheadline);
    } else {
      setText('[data-hero-headline]', config.event_name);
      setText('[data-hero-subheadline]', config.event_tagline);
    }
  }

  // ——— Agenda ———
  function hydrateAgenda() {
    const container = document.querySelector('[data-agenda]');
    if (!container || !config.agenda) return;

    container.innerHTML = config.agenda.map(item => `
      <li class="agenda-item">
        <div class="agenda-item__time">${item.time}</div>
        <div class="agenda-item__title">${item.title}</div>
        <div class="agenda-item__desc">${item.description}</div>
      </li>
    `).join('');
  }

  // ——— Speakers ———
  function hydrateSpeakers() {
    const container = document.querySelector('[data-speakers]');
    if (!container || !config.speakers) return;

    container.innerHTML = config.speakers.map(s => `
      <div class="speaker-card">
        <div class="speaker-card__name">${s.name}</div>
        <div class="speaker-card__title">${s.title}</div>
        <div class="speaker-card__bio">${s.bio}</div>
      </div>
    `).join('');
  }

  // ——— FAQ ———
  function hydrateFAQ() {
    const container = document.querySelector('[data-faq]');
    if (!container || !config.faq) return;

    container.innerHTML = config.faq.map((item, i) => `
      <div class="faq-item" data-faq-item>
        <button class="faq-question" aria-expanded="false" aria-controls="faq-answer-${i}">
          <span>${item.question}</span>
          <svg class="faq-question__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
        <div class="faq-answer" id="faq-answer-${i}">
          <p>${item.answer}</p>
        </div>
      </div>
    `).join('');

    // Accordion behavior
    container.querySelectorAll('.faq-question').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.closest('.faq-item');
        const wasActive = item.classList.contains('active');
        // Close all
        container.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
        container.querySelectorAll('.faq-question').forEach(b => b.setAttribute('aria-expanded', 'false'));
        // Toggle
        if (!wasActive) {
          item.classList.add('active');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // ——— Location ———
  function hydrateLocation() {
    const container = document.querySelector('[data-location]');
    if (!container) return;

    const loc = config.location;
    container.innerHTML = `
      <div class="location-card">
        <div class="location-card__info">
          <div class="location-card__venue">${loc.venue}</div>
          <div class="location-card__address">${loc.address}, ${loc.city}, ${loc.state} ${loc.zip}</div>
        </div>
        <a href="${loc.maps_url}" target="_blank" rel="noopener" class="btn btn--secondary btn--sm">
          Get Directions
        </a>
      </div>
    `;
  }

  // ——— Form ———
  function hydrateForm() {
    // Set hidden specialty field on specialty pages
    if (specialty) {
      const specInput = document.querySelector('input[name="specialty"]');
      if (specInput) specInput.value = specialty;
    }

    // Set event_id hidden field
    const eventInput = document.querySelector('input[name="event_id"]');
    if (eventInput) eventInput.value = config.event_id;
  }

  // ——— Specialty-specific sections ———
  function hydrateSpecialty() {
    const spec = config.specialties[specialty];

    // Products
    hydrateProducts(spec.products);

    // Testimonial
    const testimonialEl = document.querySelector('[data-testimonial]');
    if (testimonialEl && spec.testimonial) {
      const t = spec.testimonial;
      testimonialEl.innerHTML = `
        <div class="testimonial">
          <div class="testimonial__quote">${t.quote}</div>
          <div class="testimonial__author">${t.author}</div>
          <div class="testimonial__practice">${t.practice}</div>
        </div>
      `;
    }

    // Talking points
    const tpEl = document.querySelector('[data-talking-points]');
    if (tpEl && spec.talking_points) {
      tpEl.innerHTML = `
        <ul class="talking-points">
          ${spec.talking_points.map(tp => `<li>${tp}</li>`).join('')}
        </ul>
      `;
    }
  }

  function hydrateProducts(productSlugs) {
    const container = document.querySelector('[data-products]');
    if (!container || !productSlugs) return;

    // Resolve asset prefix based on script tag's own src (works at any depth)
    const assetPrefix = (() => {
      const scripts = document.querySelectorAll('script[src*="config-loader"]');
      if (scripts.length > 0) {
        return scripts[0].getAttribute('src').replace('js/config-loader.js', 'assets');
      }
      const isSpecialty = window.location.pathname.includes('/specialty/');
      return isSpecialty ? '../../shared/assets' : '../shared/assets';
    })();

    const html = productSlugs.map(slug => {
      const p = config.products[slug];
      if (!p) return '';

      const statsHtml = p.stats.map(s => `<span class="product-stat">${s}</span>`).join('');
      const imgSrc = `${assetPrefix}/products/${slug}/hero.jpg`;
      const imgFallback = `${assetPrefix}/products/${slug}/hero.png`;

      return `
        <div class="card">
          <img class="card__image" src="${imgSrc}" alt="${p.name}" onerror="if(!this.dataset.tried){this.dataset.tried='1';this.src='${imgFallback}'}else{this.style.display='none'}">
          <div class="card__body">
            <div class="card__title">${p.name}</div>
            <div class="card__subtitle">${p.tagline}</div>
            <div class="card__text">${p.description}</div>
            <div class="product-stats">${statsHtml}</div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;
  }

  // ——— Specialty navigation (main page) ———
  function hydrateSpecialtyNav() {
    const container = document.querySelector('[data-specialty-nav]');
    if (!container) return;

    const html = Object.entries(config.specialties).map(([slug, spec]) => {
      const count = config.demo_counts[slug] || 0;
      const countText = count >= 3 ? `${count} registered` : '';
      return `
        <a href="specialty/${slug}.html" class="specialty-nav__item">
          <span>${spec.name}</span>
          ${countText ? `<span class="specialty-nav__count">${countText}</span>` : ''}
        </a>
      `;
    }).join('');

    container.innerHTML = html;
  }

  // ——— Post-Event Mode ———
  function activatePostEventMode() {
    // Hide registration form
    const formSection = document.querySelector('[data-form-section]');
    if (formSection) formSection.hidden = true;

    // Show post-event section
    const postSection = document.querySelector('[data-post-event]');
    if (postSection) {
      postSection.hidden = false;
      const pe = config.post_event;
      setText('[data-lead-magnet-title]', pe.lead_magnet_title);
      setText('[data-lead-magnet-desc]', pe.lead_magnet_description);
    }

    // Hide social proof & countdown
    document.querySelectorAll('[data-social-proof], [data-countdown]').forEach(el => {
      el.hidden = true;
    });
  }

  // ——— Helpers ———
  function setText(selector, text) {
    document.querySelectorAll(selector).forEach(el => {
      el.textContent = text;
    });
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  // Public API
  return {
    init,
    getConfig: () => config,
    getSpecialty: () => specialty,
    hydrateSpecialtyNav,
  };
})();
