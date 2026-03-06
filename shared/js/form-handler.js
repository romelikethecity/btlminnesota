/**
 * BTL Events — Form Handler
 * URL pre-fill, validation, honeypot, mock submit → confirmation page.
 */
(function() {
  document.addEventListener('btl:config-ready', ({ detail }) => {
    const { config } = detail;
    initPreFill();
    initFormSubmit(config);
  });

  /** Pre-fill form fields from URL params */
  function initPreFill() {
    const params = new URLSearchParams(window.location.search);
    const fieldMap = {
      'first': 'first_name',
      'last': 'last_name',
      'email': 'email',
      'practice': 'practice',
      'phone': 'phone',
    };

    Object.entries(fieldMap).forEach(([param, field]) => {
      const val = params.get(param);
      if (val) {
        const input = document.querySelector(`input[name="${field}"]`);
        if (input) input.value = val;
      }
    });

    // Specialty from URL overrides page default
    const specParam = params.get('specialty');
    if (specParam) {
      const specInput = document.querySelector('input[name="specialty"]');
      if (specInput) specInput.value = specParam;
    }

    // Store referral code
    const ref = params.get('ref');
    if (ref) {
      const refInput = document.querySelector('input[name="referred_by"]');
      if (refInput) refInput.value = ref;
    }

    // Store UTM params
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(utm => {
      const val = params.get(utm);
      if (val) {
        const input = document.querySelector(`input[name="${utm}"]`);
        if (input) input.value = val;
      }
    });
  }

  /** Setup form submit handler */
  function initFormSubmit(config) {
    const form = document.getElementById('registration-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Honeypot check
      const hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) {
        // Bot detected — fake success
        goToConfirmation(config, {});
        return;
      }

      // Validate
      if (!validateForm(form)) return;

      // Collect form data
      const data = Object.fromEntries(new FormData(form));
      data.referral_source = window.location.href;
      data.registered_at = new Date().toISOString();

      // Set submit button loading state
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Registering...';

      // Mock API — simulate network delay
      if (!config.proxy_base_url) {
        await new Promise(r => setTimeout(r, 800));
        // Generate mock referral code
        data.referral_code = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        goToConfirmation(config, data);
        return;
      }

      // Real API (Phase B)
      try {
        const resp = await fetch(`${config.proxy_base_url}/api/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await resp.json();
        if (result.success) {
          data.referral_code = result.referral_code;
          goToConfirmation(config, data);
        } else {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showFormError('Registration failed. Please try again.');
        }
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        showFormError('Connection error. Please try again.');
      }
    });
  }

  /** Validate required fields */
  function validateForm(form) {
    let valid = true;
    const required = ['first_name', 'last_name', 'email'];

    // Clear previous errors
    form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    required.forEach(name => {
      const input = form.querySelector(`input[name="${name}"]`);
      if (!input || !input.value.trim()) {
        input?.classList.add('error');
        valid = false;
      }
    });

    // Email format
    const emailInput = form.querySelector('input[name="email"]');
    if (emailInput && emailInput.value && !isValidEmail(emailInput.value)) {
      emailInput.classList.add('error');
      valid = false;
    }

    if (!valid) {
      // Focus first error
      const firstError = form.querySelector('.error');
      if (firstError) firstError.focus();
    }

    return valid;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFormError(msg) {
    const existing = document.querySelector('.form-error-banner');
    if (existing) existing.remove();

    const banner = document.createElement('div');
    banner.className = 'form-error-banner';
    banner.style.cssText = 'background:#FEF2F2;color:#DC2626;padding:0.75rem 1rem;border-radius:6px;margin-bottom:1rem;font-size:0.875rem;text-align:center;';
    banner.textContent = msg;

    const form = document.getElementById('registration-form');
    form?.insertBefore(banner, form.firstChild);
    setTimeout(() => banner.remove(), 5000);
  }

  /** Navigate to confirmation page with data in sessionStorage */
  function goToConfirmation(config, data) {
    // Store registration data for confirmation page
    sessionStorage.setItem('btl_registration', JSON.stringify({
      ...data,
      event_name: config.event_name,
      event_date: config.date,
      event_time_start: config.time_start,
      event_time_end: config.time_end,
      event_timezone: config.timezone,
      event_venue: config.location.venue,
      event_address: `${config.location.address}, ${config.location.city}, ${config.location.state} ${config.location.zip}`,
      event_maps_url: config.location.maps_url,
      event_description: config.event_description || '',
    }));

    // Navigate to confirmation
    const isSpecialty = window.location.pathname.includes('/specialty/');
    const confirmPath = isSpecialty ? '../confirmation.html' : 'confirmation.html';
    window.location.href = confirmPath;
  }
})();
