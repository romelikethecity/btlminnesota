/**
 * BTL Events — Calendar
 * Google Calendar link + .ics file generation from registration data.
 */
(function() {
  document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(sessionStorage.getItem('btl_registration') || 'null');
    if (!data) return;

    initCalendarButtons(data);
  });

  function initCalendarButtons(data) {
    // Google Calendar button
    const gcalBtn = document.getElementById('btn-gcal');
    if (gcalBtn) {
      gcalBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(buildGoogleCalendarUrl(data), '_blank');
      });
    }

    // .ics download button
    const icsBtn = document.getElementById('btn-ics');
    if (icsBtn) {
      icsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        downloadICS(data);
      });
    }
  }

  function buildGoogleCalendarUrl(data) {
    const start = toUTCString(data.event_date, data.event_time_start, data.event_timezone);
    const end = toUTCString(data.event_date, data.event_time_end, data.event_timezone);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: data.event_name,
      dates: `${start}/${end}`,
      details: `You're registered for ${data.event_name}.\n\nVenue: ${data.event_venue}\nAddress: ${data.event_address}`,
      location: `${data.event_venue}, ${data.event_address}`,
      ctz: data.event_timezone,
    });

    return `https://calendar.google.com/calendar/render?${params}`;
  }

  function downloadICS(data) {
    const start = toICSDate(data.event_date, data.event_time_start, data.event_timezone);
    const end = toICSDate(data.event_date, data.event_time_end, data.event_timezone);
    const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BTL Events//Registration//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `DTSTART;TZID=${data.event_timezone}:${start}`,
      `DTEND;TZID=${data.event_timezone}:${end}`,
      `DTSTAMP:${now}`,
      `UID:${data.event_name.replace(/\s/g, '-').toLowerCase()}-${Date.now()}@btlevents`,
      `SUMMARY:${data.event_name}`,
      `DESCRIPTION:You're registered for ${data.event_name}.\\nVenue: ${data.event_venue}\\nAddress: ${data.event_address}`,
      `LOCATION:${data.event_venue}\\, ${data.event_address}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reminder: ${data.event_name} is tomorrow`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:${data.event_name} starts in 2 hours`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.event_name.replace(/\s+/g, '-').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /** Convert date + time + timezone to Google Calendar UTC format (YYYYMMDDTHHmmssZ) */
  function toUTCString(dateStr, timeStr, tz) {
    const dt = new Date(`${dateStr}T${timeStr}:00`);
    // Use Intl to get offset, then convert to UTC
    const utcStr = dt.toLocaleString('en-US', { timeZone: 'UTC' });
    const localStr = dt.toLocaleString('en-US', { timeZone: tz });
    const diff = new Date(localStr) - new Date(utcStr);
    const utc = new Date(dt.getTime() - diff);

    return utc.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /** Convert to ICS local datetime format (YYYYMMDDTHHmmss) */
  function toICSDate(dateStr, timeStr) {
    return dateStr.replace(/-/g, '') + 'T' + timeStr.replace(/:/g, '') + '00';
  }
})();
