/* Resource index + filters. Announces result counts, so filtering is not a
   purely visual event. */
(function () {
  'use strict';
  var list = document.getElementById('reslist');
  if (!list || !window.RESOURCES) return;

  var LABELS = window.RES_LABELS;
  var fixed = list.dataset.filter || '';
  var status = document.getElementById('resstatus');

  var ARROW = '<svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true" focusable="false"><path d="M10 1l4 4-4 4M0 5h13.5" stroke="currentColor" stroke-width="1.5"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function card(r) {
    var external = /^https?:/.test(r[2]);
    return '<a class="rcard" href="' + esc(r[2]) + '"' +
      (external ? ' target="_blank" rel="noopener"' : '') + '>' +
      '<span class="rtag">' + esc(r[4] || LABELS[r[0]]) + '</span>' +
      '<h3 class="h-sm">' + esc(r[1]) + '</h3>' +
      '<span class="go">' + esc(r[3]) +
      (external ? '<span class="vh"> (opens in a new tab)</span>' : '') + ' ' + ARROW + '</span></a>';
  }

  function render(type, announce) {
    var items = window.RESOURCES.filter(function (r) { return !type || r[0] === type; });
    if (!items.length) {
      list.innerHTML = '';
      list.insertAdjacentHTML('afterend', '<p class="res-empty" id="resempty">Nothing here yet — try another filter.</p>');
    } else {
      var empty = document.getElementById('resempty');
      if (empty) empty.remove();
      list.innerHTML = items.map(card).join('');
    }
    if (status && announce) {
      status.textContent = items.length + (items.length === 1 ? ' resource' : ' resources') +
        (type ? ' in ' + (LABELS[type] || type) : '') + '.';
    }
  }

  var box = document.getElementById('filters');
  if (box && !fixed) {
    var opts = [['', 'All'], ['blog', 'Blog'], ['podcast', 'Podcast'], ['case-study', 'Case studies'],
                ['ebook', 'Workbook'], ['ai-tool', 'AI Tools'], ['news', 'News']];
    box.innerHTML = opts.map(function (o, i) {
      return '<button type="button" class="chip" data-t="' + o[0] + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + o[1] + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      Array.prototype.forEach.call(box.querySelectorAll('.chip'), function (c) {
        c.setAttribute('aria-pressed', c === btn ? 'true' : 'false');
      });
      render(btn.dataset.t, true);
    });
  }

  render(fixed, false);
})();
