/**
 * BTL Events — Referral Share
 * Generates shareable URL with referral code, native share on mobile, copy on desktop.
 * Used on confirmation page.
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(sessionStorage.getItem('btl_registration') || 'null');
    if (!data || !data.referral_code) return;

    initReferral(data);
  });

  function initReferral(data) {
    // Build referral URL
    const baseUrl = window.location.origin + window.location.pathname.replace('confirmation.html', '');
    const referralUrl = `${baseUrl}?ref=${data.referral_code}`;

    // Set URL in input
    const urlInput = document.getElementById('referral-url');
    if (urlInput) urlInput.value = referralUrl;

    // Copy button
    const copyBtn = document.getElementById('btn-copy-referral');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(referralUrl).then(() => {
          const original = copyBtn.textContent;
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('btn--primary');
          copyBtn.classList.remove('btn--secondary');
          setTimeout(() => {
            copyBtn.textContent = original;
            copyBtn.classList.remove('btn--primary');
            copyBtn.classList.add('btn--secondary');
          }, 2000);
        });
      });
    }

    // Native share button (mobile)
    const shareBtn = document.getElementById('btn-native-share');
    if (shareBtn) {
      if (navigator.share) {
        shareBtn.hidden = false;
        shareBtn.addEventListener('click', () => {
          navigator.share({
            title: data.event_name,
            text: `Join me at ${data.event_name} — see BTL's medical device lineup in person.`,
            url: referralUrl,
          }).catch(() => {}); // User cancelled
        });
      } else {
        shareBtn.hidden = true;
      }
    }

    // Email share
    const emailBtn = document.getElementById('btn-email-share');
    if (emailBtn) {
      const subject = encodeURIComponent(`Join me at ${data.event_name}`);
      const eventDesc = data.event_description || 'a hands-on event with BTL\'s medical devices — body contouring, facial rejuvenation, pelvic health, and more';
      const body = encodeURIComponent(
        `I just registered for ${data.event_name} and thought you'd be interested.\n\n` +
        `It's ${eventDesc}. ` +
        `Free to attend, everything included.\n\n` +
        `Register here: ${referralUrl}`
      );
      emailBtn.href = `mailto:?subject=${subject}&body=${body}`;
    }

    // SMS share
    const smsBtn = document.getElementById('btn-sms-share');
    if (smsBtn) {
      const text = encodeURIComponent(`Join me at ${data.event_name} — register here: ${referralUrl}`);
      smsBtn.href = `sms:?body=${text}`;
    }
  }
})();
