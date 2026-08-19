/* Contact form.

   ============================================================================
   SET THIS BEFORE GOING LIVE.
   Point ENDPOINT at whatever will actually receive the enquiry — a Formspree /
   Basin / Netlify Forms URL, or your own handler. Until it is set, the form
   falls back to a mailto: link so an enquiry is never silently discarded.
   ============================================================================ */
var MVP1_FORM_ENDPOINT = ''; // e.g. 'https://formspree.io/f/xxxxxxxx'
var MVP1_FALLBACK_EMAIL = 'info@mvp1.com.au';

(function () {
  'use strict';
  var form = document.getElementById('contact-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');
  var submitLabel = submit ? submit.querySelector('.btn-label') : null;

  function setStatus(state, message) {
    if (!status) return;
    status.hidden = false;
    status.setAttribute('data-state', state);
    status.textContent = message;
  }

  function fieldError(input, message) {
    var wrap = input.closest('.field');
    var slot = wrap && wrap.querySelector('.field-error');
    if (!slot) return;
    slot.textContent = message || '';
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  // Validate on blur, and again on input once a field has already errored —
  // never while the visitor is still mid-answer.
  Array.prototype.forEach.call(form.querySelectorAll('input,textarea,select'), function (input) {
    var check = function () {
      if (input.validity.valid) { fieldError(input, ''); return true; }
      var msg = input.validity.valueMissing
        ? 'Please fill in ' + (input.dataset.label || 'this field').toLowerCase() + '.'
        : input.type === 'email' ? 'Please enter a valid email address.'
        : 'Please check this field.';
      fieldError(input, msg);
      return false;
    };
    input.addEventListener('blur', check);
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') check();
    });
  });

  function mailtoFallback(data) {
    var lines = [];
    data.forEach(function (value, key) {
      if (key !== 'company_website') lines.push(key + ': ' + value);
    });
    var href = 'mailto:' + MVP1_FALLBACK_EMAIL +
      '?subject=' + encodeURIComponent('Website enquiry — ' + (data.get('name') || '')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    window.location.href = href;
    setStatus('ok', 'Opening your email app so you can send this to us directly.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var firstInvalid = null;
    Array.prototype.forEach.call(form.querySelectorAll('input,textarea,select'), function (input) {
      if (!input.validity.valid && !firstInvalid) firstInvalid = input;
      if (!input.validity.valid) {
        var msg = input.validity.valueMissing
          ? 'Please fill in ' + (input.dataset.label || 'this field').toLowerCase() + '.'
          : 'Please check this field.';
        fieldError(input, msg);
      }
    });
    if (firstInvalid) {
      setStatus('error', 'Please correct the highlighted fields.');
      firstInvalid.focus();
      return;
    }

    var data = new FormData(form);

    // Honeypot — real people never fill a hidden field in.
    if (data.get('company_website')) { setStatus('ok', 'Thanks — we’ll be in touch.'); return; }

    if (!MVP1_FORM_ENDPOINT) { mailtoFallback(data); return; }

    if (submit) { submit.disabled = true; }
    if (submitLabel) { submitLabel.textContent = 'Sending…'; }
    setStatus('ok', 'Sending your enquiry…');

    fetch(MVP1_FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed: ' + res.status);
        form.reset();
        setStatus('ok', 'Thanks — we’ll be in touch within one business day.');
      })
      .catch(function () {
        setStatus('error', 'Something went wrong sending that. Please email ' + MVP1_FALLBACK_EMAIL + ' or call +61 483 920 790.');
      })
      .finally(function () {
        if (submit) submit.disabled = false;
        if (submitLabel) submitLabel.textContent = 'Book a discovery call';
      });
  });
})();
