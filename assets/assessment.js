/* AI Readiness Assessment, runs entirely in the browser.
   Ten questions across four dimensions. Nothing is transmitted anywhere unless
   the visitor chooses to send their result via the follow-up form. */
(function () {
  'use strict';
  var root = document.getElementById('assessment');
  if (!root) return;

  var DIMENSIONS = {
    process: 'Process',
    data: 'Data',
    systems: 'Systems',
    governance: 'Governance'
  };

  var QUESTIONS = [
    { d: 'process', q: 'How well documented are the workflows you would want to automate?',
      a: ['Not documented, they live in people’s heads', 'Partly documented, often out of date', 'Documented and broadly accurate', 'Documented, owned and reviewed regularly'] },
    { d: 'process', q: 'How much of the work is genuinely repeatable rather than case-by-case judgement?',
      a: ['Almost everything needs judgement', 'Some repeatable steps inside bigger judgement calls', 'Substantial repeatable volume', 'Large, high-volume repeatable processes'] },
    { d: 'process', q: 'Do you know what your highest-cost manual processes actually cost you?',
      a: ['No, we have never measured it', 'A rough sense, not measured', 'Measured for some processes', 'Measured, with hours and cost per process'] },
    { d: 'data', q: 'Where does the data those workflows need actually live?',
      a: ['Spread across inboxes, drives and people', 'Several systems that do not talk to each other', 'Mostly in core systems, some gaps', 'In core systems, accessible via APIs'] },
    { d: 'data', q: 'How much would you trust that data to be accurate right now?',
      a: ['We know it is unreliable', 'Reliable in parts, unverified elsewhere', 'Generally reliable, some known gaps', 'Reliable, with owners and quality checks'] },
    { d: 'systems', q: 'Can your core systems be integrated with, do they have APIs or supported connectors?',
      a: ['No, or we do not know', 'Some do, the important ones do not', 'Most do', 'Yes, and we already integrate them'] },
    { d: 'systems', q: 'How are permissions and access currently managed across those systems?',
      a: ['Informally, shared logins are common', 'Per system, no central view', 'Role-based in most systems', 'Centrally managed with role-based access'] },
    { d: 'governance', q: 'If an automated process made a wrong decision, who would own it?',
      a: ['Nobody defined', 'It would land with whoever noticed', 'A team owns it informally', 'A named owner, with an escalation path'] },
    { d: 'governance', q: 'Do you have a policy for how AI may handle sensitive or regulated data?',
      a: ['No policy', 'Under discussion', 'A policy exists but is not enforced', 'Policy in place, enforced and audited'] },
    { d: 'governance', q: 'Could you produce an audit trail of an automated decision if a regulator asked?',
      a: ['No', 'Partially, with significant effort', 'Yes for most systems', 'Yes, logged and retrievable by design'] }
  ];

  var BANDS = [
    { max: 40, name: 'Foundations first',
      verdict: 'Automating now would amplify problems rather than remove them. The return is in the groundwork, and it is usually six to twelve weeks of it, not a year.',
      next: ['Document the two or three processes that consume the most hours, as they actually run today.',
             'Establish a single source of truth for the data those processes depend on.',
             'Name an owner for AI decisions before any agent is deployed.'] },
    { max: 60, name: 'Selectively ready',
      verdict: 'There is a real opportunity here, but not everywhere. One well-chosen process will prove the case; a broad rollout would stall on the weakest dimension.',
      next: ['Pick the single highest-volume repeatable process and automate that alone.',
             'Fix data access for that process specifically rather than across the business.',
             'Define human approval points before launch, not after.'] },
    { max: 80, name: 'Ready to build',
      verdict: 'The foundations will carry an agent build. The risk now shifts from readiness to scope, choosing work that pays back quickly and measuring it honestly.',
      next: ['Scope two or three processes with a measurable baseline for each.',
             'Set up monitoring and cost tracking before go-live, not after.',
             'Plan where the capacity you free up will be redeployed.'] },
    { max: 100, name: 'Ready to scale',
      verdict: 'You are past the readiness question. The constraint is sequencing and governance at scale, keeping a register of what is running, who owns it, and what it costs.',
      next: ['Build a register of agents with named owners and review cadence.',
             'Standardise the deployment and audit pattern so each new agent is cheaper than the last.',
             'Track cost against efficiency monthly, per agent.'] }
  ];

  var answers = new Array(QUESTIONS.length).fill(null);
  var step = 0;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function renderQuestion() {
    var q = QUESTIONS[step];
    root.innerHTML =
      '<p class="assess-progress">Question ' + (step + 1) + ' of ' + QUESTIONS.length +
      ' <span class="assess-dim">' + DIMENSIONS[q.d] + '</span></p>' +
      '<div class="assess-bar"><span style="transform:scaleX(' + (step / QUESTIONS.length).toFixed(4) + ')"></span></div>' +
      '<fieldset class="assess-q"><legend class="h-sm">' + esc(q.q) + '</legend>' +
      q.a.map(function (opt, i) {
        return '<label class="assess-opt"><input type="radio" name="q' + step + '" value="' + i + '"' +
          (answers[step] === i ? ' checked' : '') + '><span>' + esc(opt) + '</span></label>';
      }).join('') + '</fieldset>' +
      '<div class="btns mt-5">' +
      (step > 0 ? '<button class="btn btn-g" type="button" data-act="back">Back</button>' : '') +
      '<button class="btn btn-p" type="button" data-act="next">' +
      (step === QUESTIONS.length - 1 ? 'See my result' : 'Next') + '</button></div>' +
      '<p class="assess-error" role="alert" aria-live="assertive"></p>';
    var first = root.querySelector('input');
    if (first) first.focus();
  }

  function score() {
    var per = {}, counts = {};
    Object.keys(DIMENSIONS).forEach(function (k) { per[k] = 0; counts[k] = 0; });
    QUESTIONS.forEach(function (q, i) {
      per[q.d] += answers[i];
      counts[q.d] += 1;
    });
    var overall = Math.round((answers.reduce(function (a, b) { return a + b; }, 0) / (QUESTIONS.length * 3)) * 100);
    var dims = Object.keys(DIMENSIONS).map(function (k) {
      return { key: k, name: DIMENSIONS[k], pct: Math.round((per[k] / (counts[k] * 3)) * 100) };
    });
    return { overall: overall, dims: dims };
  }

  function renderResult() {
    var s = score();
    var band = BANDS.find(function (b) { return s.overall <= b.max; }) || BANDS[BANDS.length - 1];
    var weakest = s.dims.slice().sort(function (a, b) { return a.pct - b.pct; })[0];

    root.innerHTML =
      '<div class="assess-result">' +
      '<p class="eyebrow">Your result</p>' +
      '<p class="assess-score"><b>' + s.overall + '<em>%</em></b><span>' + esc(band.name) + '</span></p>' +
      '<p class="lede mt-4">' + esc(band.verdict) + '</p>' +
      '<h3 class="h-sm mt-6">Where you sit, by dimension</h3>' +
      '<ul class="assess-dims">' + s.dims.map(function (d) {
        return '<li><span class="assess-dim-name">' + esc(d.name) + '</span>' +
          '<span class="assess-bar"><span style="transform:scaleX(' + (d.pct / 100).toFixed(4) + ')"></span></span>' +
          '<span class="assess-pct">' + d.pct + '%</span></li>';
      }).join('') + '</ul>' +
      '<p class="muted fine mt-4">Weakest dimension: <strong>' + esc(weakest.name) + '</strong>. That is the one that will cap an agent build, whatever the others score.</p>' +
      '<h3 class="h-sm mt-6">What to do first</h3>' +
      '<ol class="assess-next">' + band.next.map(function (n) { return '<li><span>' + esc(n) + '</span></li>'; }).join('') + '</ol>' +
      '<div class="btns mt-6">' +
      '<a class="btn btn-p" href="contact.html">Talk through this result <svg width="15" height="10" viewBox="0 0 15 10" fill="none" aria-hidden="true" focusable="false"><path d="M10 1l4 4-4 4M0 5h13.5" stroke="currentColor" stroke-width="1.5"/></svg></a>' +
      '<button class="btn btn-g" type="button" data-act="restart">Start again</button></div>' +
      '<p class="muted fine mt-4">Your answers stayed in this browser. Nothing was sent anywhere.</p>' +
      '</div>';
    root.querySelector('.assess-result').focus();
  }

  root.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-act]');
    if (!btn) return;
    var act = btn.dataset.act;
    if (act === 'back') { step -= 1; renderQuestion(); return; }
    if (act === 'restart') { answers = new Array(QUESTIONS.length).fill(null); step = 0; renderQuestion(); return; }
    if (act === 'next') {
      var picked = root.querySelector('input[name="q' + step + '"]:checked');
      if (!picked) {
        root.querySelector('.assess-error').textContent = 'Choose the option that fits best to continue.';
        return;
      }
      answers[step] = parseInt(picked.value, 10);
      if (step === QUESTIONS.length - 1) { renderResult(); return; }
      step += 1;
      renderQuestion();
    }
  });

  renderQuestion();
})();
