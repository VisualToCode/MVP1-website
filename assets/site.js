/* MVP1 Ventures, behaviour
   The header, footer and every internal link are now static HTML, so the site
   still works (and is still crawlable) if this file never loads. Everything
   below is progressive enhancement only. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky nav ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- desktop submenus: pointer + keyboard ----------
     CSS handles :hover and :focus-within. This adds Escape-to-close and
     makes the trigger announce its state to assistive technology. */
  Array.prototype.forEach.call(document.querySelectorAll('.has-sub'), function (group) {
    var trigger = group.querySelector('.nlink');
    if (!trigger) return;
    var setOpen = function (open) {
      group.setAttribute('data-open', open ? 'true' : 'false');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    setOpen(false);
    group.addEventListener('focusin', function () { setOpen(true); });
    group.addEventListener('focusout', function () {
      if (!group.contains(document.activeElement)) setOpen(false);
    });
    group.addEventListener('mouseenter', function () { setOpen(true); });
    group.addEventListener('mouseleave', function () { setOpen(false); });
    group.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { setOpen(false); trigger.focus(); }
    });
  });

  /* ---------- mobile menu ---------- */
  var mob = document.querySelector('.mob');
  var burger = document.querySelector('.burger');
  var mclose = document.querySelector('.mclose');

  if (mob && burger) {
    var lastFocused = null;

    var setInert = function (on) {
      if ('inert' in HTMLElement.prototype) {
        mob.inert = on;
      } else {
        // Fallback: keep the offscreen links out of the tab order.
        Array.prototype.forEach.call(mob.querySelectorAll('a,button'), function (el) {
          if (on) el.setAttribute('tabindex', '-1');
          else el.removeAttribute('tabindex');
        });
      }
      mob.setAttribute('aria-hidden', on ? 'true' : 'false');
    };

    var openMenu = function () {
      lastFocused = document.activeElement;
      setInert(false);
      mob.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      document.documentElement.style.overflow = 'hidden';
      var first = mob.querySelector('a,button');
      if (first) first.focus();
    };

    var closeMenu = function () {
      mob.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
      setInert(true);
      // Send focus back where it came from, and to the burger if that is
      // no longer a sensible target, so it never falls back to <body>.
      var target = (lastFocused && lastFocused.focus && document.contains(lastFocused) &&
                    lastFocused !== document.body) ? lastFocused : burger;
      target.focus();
    };

    setInert(true);
    burger.setAttribute('aria-expanded', 'false');
    burger.addEventListener('click', openMenu);
    if (mclose) mclose.addEventListener('click', closeMenu);

    document.addEventListener('keydown', function (e) {
      if (!mob.classList.contains('open')) return;
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      // Trap focus inside the open menu.
      var items = mob.querySelectorAll('a,button');
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // Close if the viewport grows past the mobile breakpoint while it is open.
    var mq = window.matchMedia('(min-width: 1025px)');
    var onMQ = function (e) { if (e.matches && mob.classList.contains('open')) closeMenu(); };
    if (mq.addEventListener) mq.addEventListener('change', onMQ);
    else if (mq.addListener) mq.addListener(onMQ);
  }

  /* ---------- scroll reveal ----------
     Applied to section groups, not every paragraph, and short enough
     that it never delays reading. Skipped entirely for reduced motion. */
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    // Fall back to a sane height if the viewport reports 0 (background tab,
    // pre-layout). Getting this wrong would hide content behind a fade that
    // never triggers, so it fails towards "just show it".
    var vh = window.innerHeight || document.documentElement.clientHeight || 800;

    Array.prototype.forEach.call(document.querySelectorAll('[data-reveal]'), function (el) {
      // Already in view on load? Show it immediately, never fade in content
      // the visitor can already see.
      var box = el.getBoundingClientRect();
      if (box.top < vh * 0.9) return;
      el.classList.add('rv');
      io.observe(el);
    });
  }

  /* ---------- background video ----------
     Sources are attached by JS rather than sitting in the markup, so the clips
     are never downloaded for people who asked for reduced motion, they keep
     the poster frame. Each one also only loads once it is actually on screen
     and pauses when it is not, so a visitor who never scrolls to the closing
     CTA never pays for its video. */
  var bgVideos = document.querySelectorAll('.js-bgvideo');
  if (bgVideos.length && !reduced) {
    var controllers = [];

    Array.prototype.forEach.call(bgVideos, function (video) {
      var loaded = false;

      var load = function () {
        if (loaded) return;
        loaded = true;
        Array.prototype.forEach.call(video.querySelectorAll('source[data-src]'), function (s) {
          s.src = s.dataset.src;
        });
        video.load();
      };

      var play = function () {
        load();
        var p = video.play();
        // Autoplay can still be refused (low power mode, data saver). The
        // poster frame stays put if it is, which is a fine outcome.
        if (p && p.catch) p.catch(function () {});
      };

      var pause = function () { if (loaded) video.pause(); };
      controllers.push({ el: video, play: play, pause: pause, isLoaded: function () { return loaded; } });

      if ('IntersectionObserver' in window) {
        var vio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) play();
            else pause();
          });
        }, { threshold: 0.12 });
        vio.observe(video);
      } else {
        play();
      }
    });

    document.addEventListener('visibilitychange', function () {
      controllers.forEach(function (c) {
        if (!c.isLoaded()) return;
        if (document.hidden) c.pause();
        else {
          var box = c.el.getBoundingClientRect();
          if (box.bottom > 0 && box.top < window.innerHeight) c.play();
        }
      });
    });

    // If the visitor turns reduced motion on mid-session, stop everything.
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onRM = function (e) { if (e.matches) controllers.forEach(function (c) { c.pause(); }); };
    if (rm.addEventListener) rm.addEventListener('change', onRM);
    else if (rm.addListener) rm.addListener(onRM);
  }

  /* ---------- case study images: graceful fallback ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('.case-img img'), function (img) {
    var fail = function () {
      var box = img.closest('.case-img');
      if (box) box.classList.add('noimg');
    };
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });

  /* ---------- home: capabilities ambient glow ----------
     Purely decorative, two drifting colour fields plus a light that
     follows the pointer. Skipped outright under reduced motion, same
     treatment as the background video above. */
  var capSection = document.querySelector('section[data-screen-label="Home, capabilities"]');
  if (capSection && !reduced) {
    var b1 = document.createElement('div'); b1.className = 'cap-blob b1';
    var b2 = document.createElement('div'); b2.className = 'cap-blob b2';
    capSection.insertBefore(b2, capSection.firstChild);
    capSection.insertBefore(b1, capSection.firstChild);
    var cursor = document.createElement('div'); cursor.className = 'cap-cursor';
    capSection.appendChild(cursor);
    capSection.addEventListener('mousemove', function (e) {
      var box = capSection.getBoundingClientRect();
      cursor.style.left = (e.clientX - box.left) + 'px';
      cursor.style.top = (e.clientY - box.top) + 'px';
    });
  }

  /* ---------- contact form: validation and submit feedback ----------
     The markup already carries the hooks (field-error, form-status,
     aria-invalid), this wires them up. Posts with fetch so a rejected
     submission never costs the visitor their message to a reload. */
  var form = document.getElementById('contact-form');
  if (form) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('button[type="submit"]');
    var honeypot = document.getElementById('f-hp');

    var messageFor = function (input) {
      if (input.validity.valueMissing) return 'Enter ' + (input.dataset.label || 'this field') + '.';
      if (input.validity.typeMismatch) return 'That doesn’t look like a valid email.';
      return 'Check this field.';
    };

    var setError = function (input, text) {
      var field = input.closest('.field');
      var err = field && field.querySelector('.field-error');
      if (err) err.textContent = text || '';
      input.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (!field) return;
      field.classList.remove('invalid');
      if (text) {
        void field.offsetWidth; // restart the shake even if this field was already showing an error
        field.classList.add('invalid');
      }
    };

    var validate = function (input) {
      if (input.checkValidity()) { setError(input, ''); return true; }
      setError(input, messageFor(input));
      return false;
    };

    Array.prototype.forEach.call(form.querySelectorAll('input,textarea'), function (input) {
      if (input === honeypot) return;
      input.addEventListener('blur', function () { validate(input); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validate(input);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (honeypot && honeypot.value) return; // spam bot filled the hidden field, go quiet, not loud

      var required = Array.prototype.filter.call(form.querySelectorAll('input,textarea'), function (input) {
        return input.required;
      });
      var firstInvalid = null;
      var allValid = required.reduce(function (ok, input) {
        var valid = validate(input);
        if (!valid && !firstInvalid) firstInvalid = input;
        return ok && valid;
      }, true);
      if (!allValid) { firstInvalid.focus(); return; }

      if (submitBtn) submitBtn.classList.add('is-loading');
      if (statusEl) { statusEl.hidden = true; statusEl.removeAttribute('data-state'); }

      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('bad status');
          if (statusEl) {
            statusEl.textContent = 'Message sent, we reply within one business day.';
            statusEl.dataset.state = 'ok';
            statusEl.hidden = false;
          }
          form.reset();
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'That didn’t go through. Email info@mvp1.com.au directly and we’ll pick it up from there.';
            statusEl.dataset.state = 'error';
            statusEl.hidden = false;
          }
        })
        .finally(function () {
          if (submitBtn) submitBtn.classList.remove('is-loading');
        });
    });
  }
})();
