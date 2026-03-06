/**
 * BTL Events — Social Proof
 * Renders registration counts from config.json mock data (MVP) or API (Phase B).
 * Thresholds: show specialty count when >= 3, total when >= 5.
 */
(function() {
  document.addEventListener('btl:config-ready', ({ detail }) => {
    const { config, specialty } = detail;
    renderSocialProof(config, specialty);
  });

  function renderSocialProof(config, specialty) {
    const counts = config.demo_counts || {};
    const total = counts.total || 0;

    // If proxy_base_url is set, fetch real counts (Phase B)
    if (config.proxy_base_url) {
      fetchLiveCounts(config).then(liveCounts => {
        render(liveCounts, specialty);
      }).catch(() => {
        render(counts, specialty);
      });
      return;
    }

    render(counts, specialty);
  }

  function render(counts, specialty) {
    const total = counts.total || 0;

    // Hero social proof (total)
    document.querySelectorAll('[data-social-proof="hero"]').forEach(el => {
      if (total >= 5) {
        el.innerHTML = `
          <span class="social-proof__dot"></span>
          <span>${total} providers already registered</span>
        `;
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    // Specialty social proof
    document.querySelectorAll('[data-social-proof="specialty"]').forEach(el => {
      const slug = specialty || el.dataset.specialty;
      const count = counts[slug] || 0;
      const specName = getSpecialtyLabel(slug);

      if (count >= 3) {
        el.innerHTML = `
          <span class="social-proof__dot"></span>
          <span>${count} ${specName} already registered</span>
        `;
        el.hidden = false;
      } else {
        el.hidden = true;
      }
    });

    // Specialty nav counts (main page)
    document.querySelectorAll('[data-specialty-count]').forEach(el => {
      const slug = el.dataset.specialtyCount;
      const count = counts[slug] || 0;
      if (count >= 3) {
        el.textContent = `${count} registered`;
      }
    });
  }

  async function fetchLiveCounts(config) {
    const resp = await fetch(`${config.proxy_base_url}/api/counts?event_id=${config.event_id}`);
    return await resp.json();
  }

  function getSpecialtyLabel(slug) {
    const labels = {
      'chiro': 'chiropractors',
      'medspa': 'med spa providers',
      'derm': 'dermatologists',
      'plastic-surgery': 'plastic surgeons',
      'family-practice': 'family practitioners',
      'ortho': 'orthopedic specialists',
      'cosmetic-dentist': 'cosmetic dentists',
      'psychiatry': 'psychiatrists',
    };
    return labels[slug] || 'providers';
  }
})();
