/**
 * BTL Events — Countdown & Scarcity
 * Shows spots remaining (from mock data) and date countdown when event is close.
 * Spots bar shows when < 50% capacity. Date countdown when < 7 days to registration close.
 */
(function() {
  document.addEventListener('btl:config-ready', ({ detail }) => {
    const { config } = detail;
    renderCountdown(config);
  });

  function renderCountdown(config) {
    const container = document.querySelector('[data-countdown]');
    if (!container) return;

    const capacity = config.capacity || 75;
    const totalRegistered = config.demo_counts?.total || 0;
    const spotsLeft = Math.max(0, capacity - totalRegistered);
    const fillPercent = Math.round((totalRegistered / capacity) * 100);
    const closeDate = new Date(config.registration_close_date + 'T23:59:59');
    const now = new Date();
    const daysLeft = Math.ceil((closeDate - now) / (1000 * 60 * 60 * 24));

    // Full capacity
    if (spotsLeft <= 0) {
      container.innerHTML = `
        <div class="countdown-bar" style="background:#FEF2F2;border-color:#DC2626;">
          <span style="color:#DC2626;font-weight:700;">This event is full</span> — join the waitlist below
        </div>
      `;
      container.hidden = false;
      return;
    }

    const parts = [];

    // Spots remaining — show when under 50% capacity left
    if (fillPercent >= 50) {
      parts.push(`
        <span class="countdown-bar__highlight">${spotsLeft} spots remaining</span> out of ${capacity}
        <div class="capacity-meter">
          <div class="capacity-meter__fill ${fillPercent >= 85 ? 'capacity-meter__fill--high' : ''}" style="width:${fillPercent}%"></div>
        </div>
      `);
    }

    // Date countdown — within 7 days
    if (daysLeft > 0 && daysLeft <= 7) {
      const dayWord = daysLeft === 1 ? 'day' : 'days';
      parts.push(`
        Registration closes in <span class="countdown-bar__highlight">${daysLeft} ${dayWord}</span>
      `);
    }

    if (parts.length > 0) {
      container.innerHTML = `<div class="countdown-bar">${parts.join('<br>')}</div>`;
      container.hidden = false;
    } else {
      container.hidden = true;
    }
  }
})();
