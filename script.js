(() => {
  'use strict';

  const data = (window.SMMRM_CERTIFICATE && typeof window.SMMRM_CERTIFICATE === 'object')
    ? window.SMMRM_CERTIFICATE
    : {};

  const FALLBACK = 'NA';
  const DAY_MS = 86400000;

  const $ = (id) => document.getElementById(id);
  const clean = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };
  const displayValue = (value) => clean(value) || FALLBACK;

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = displayValue(value);
  }

  function parseIsoDate(value) {
    const raw = clean(value);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const time = Date.UTC(year, month - 1, day);
    const d = new Date(time);
    if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return { year, month, day, time };
  }

  function formatDate(value) {
    const parsed = parseIsoDate(value);
    if (!parsed) return FALLBACK;
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(new Date(parsed.time));
  }

  function renderCertificate() {
    setText('certificateName', data.certificateName);
    setText('shipName', data.shipName);
    setText('imoNumber', data.imoNumber);
    setText('callSign', data.callSign);
    setText('portOfRegistry', data.portOfRegistry);
    setText('grossTonnage', data.grossTonnage);
    setText('mmsiNumber', data.mmsiNumber);
    setText('certificateNumber', data.certificateNumber);
    setText('remarks', data.remarks);
    setText('statusCertificateName', data.certificateName);
    setText('statusCertificateNumber', data.certificateNumber);

    const issueEl = $('dateOfIssue');
    const validEl = $('validUntil');
    if (issueEl) issueEl.textContent = formatDate(data.dateOfIssue);
    if (validEl) validEl.textContent = formatDate(data.validUntil);
  }

  const text = $('validityText');
  const badge = $('statusBadge');
  const icon = $('statusIcon');
  const card = $('statusCard');

  const validIcon = '<circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="8"/><path d="M38 61l15 15 31-33" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>';
  const warningIcon = '<circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="8"/><path d="M60 35v31" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="60" cy="82" r="5" fill="currentColor"/>';
  const expiredIcon = '<circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="8"/><path d="M44 44l32 32M76 44L44 76" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>';
  const unknownIcon = '<circle cx="60" cy="60" r="42" stroke="currentColor" stroke-width="8"/><path d="M51 48c2-7 17-8 19 1 2 8-10 9-10 18" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><circle cx="60" cy="81" r="5" fill="currentColor"/>';

  function setStatus(kind, badgeText, message) {
    if (!badge || !text || !icon || !card) return;

    const palette = {
      valid:   { badge:'#101114', text:'#07805c', icon:'#078260', border:'#77e9b9', bg:'linear-gradient(135deg,#f4fff9 0%,#effcf7 100%)', svg:validIcon },
      expiring:{ badge:'#d39a18', text:'#a66d00', icon:'#d39a18', border:'#f1cf7a', bg:'linear-gradient(135deg,#fffdf4 0%,#fff9e9 100%)', svg:warningIcon },
      expired: { badge:'#c9362b', text:'#b42318', icon:'#c9362b', border:'#f2aaa5', bg:'linear-gradient(135deg,#fff8f7 0%,#fff3f2 100%)', svg:expiredIcon },
      unknown: { badge:'#667085', text:'#475467', icon:'#667085', border:'#d0d5dd', bg:'linear-gradient(135deg,#fbfcfd 0%,#f5f7f9 100%)', svg:unknownIcon }
    }[kind];

    badge.textContent = badgeText;
    text.textContent = message;
    badge.style.background = palette.badge;
    text.style.color = palette.text;
    icon.style.color = palette.icon;
    card.style.borderColor = palette.border;
    card.style.background = palette.bg;
    icon.innerHTML = palette.svg;
  }

  function updateValidity() {
    const expiry = parseIsoDate(data.validUntil);
    if (!expiry) {
      setStatus('unknown', 'NA', 'Validity date: NA');
      return;
    }

    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const daysRemaining = Math.round((expiry.time - todayUTC) / DAY_MS);

    if (daysRemaining > 1) {
      setStatus('valid', 'Valid', `Valid for ${daysRemaining} days`);
    } else if (daysRemaining === 1) {
      setStatus('valid', 'Valid', 'Valid for 1 day');
    } else if (daysRemaining === 0) {
      setStatus('expiring', 'Expiring', 'Expires today');
    } else {
      setStatus('expired', 'Expired', 'Expired');
    }
  }

  renderCertificate();
  updateValidity();
  setInterval(updateValidity, 60 * 60 * 1000);
})();
