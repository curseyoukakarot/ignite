/* IGNITE BESPOKE — page behaviors (vanilla, no deps).
   Everything renders final content first and animates as an enhancement,
   so hidden tabs / headless renders never get stuck on a blank state. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ───────── nav background on scroll ───────── */
  var nav = $('#bnav');
  var onScrollNav = function () { nav.classList.toggle('is-scrolled', window.scrollY > 40); };
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ───────── reveals ───────── */
  var revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }
  // failsafe: anything already above the fold (or everything, if IO never fires) shows
  setTimeout(function () {
    revealEls.forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('is-in');
    });
  }, 2500);
  if (!('IntersectionObserver' in window)) revealEls.forEach(function (el) { el.classList.add('is-in'); });

  /* ───────── hero slideshow ───────── */
  var slides = $$('.hero__slide');
  var bars = $$('#reelBars i');
  var reelNum = $('#reelNum');
  var reelLabel = $('#reelLabel');
  var SLIDE_MS = 6500;
  var cur = 0;
  document.documentElement.style.setProperty('--slide-ms', SLIDE_MS + 'ms');

  function show(n) {
    slides[cur].classList.remove('is-active');
    cur = (n + slides.length) % slides.length;
    var s = slides[cur];
    var img = s.querySelector('img');
    if (img.loading === 'lazy') img.loading = 'eager';
    s.classList.add('is-active');
    bars.forEach(function (b, i) {
      b.classList.remove('is-active', 'is-done');
      void b.offsetWidth; // restart the fill animation
      if (i < cur) b.classList.add('is-done');
      if (i === cur) b.classList.add('is-active');
    });
    reelNum.textContent = ('0' + (cur + 1)).slice(-2);
    reelLabel.textContent = s.getAttribute('data-label');
  }
  if (slides.length > 1 && !reduced) {
    // warm the other slides so the crossfade never flashes
    slides.slice(1).forEach(function (s) { var i = new Image(); i.src = s.querySelector('img').src; });
    setInterval(function () { if (!document.hidden) show(cur + 1); }, SLIDE_MS);
  }

  /* ───────── scorebug clock: 4th quarter, ticking down ───────── */
  var clock = $('#clock');
  if (clock && !reduced) {
    var secs = 42;
    setInterval(function () {
      secs = secs <= 0 ? 59 : secs - 1;
      clock.textContent = secs === 0 ? 'FINAL' : '0:' + ('0' + secs).slice(-2);
    }, 1000);
  }

  /* ───────── thesis: words light up as you read ───────── */
  var thesis = $('#thesisText');
  if (thesis) {
    var keys = ['warriors', 'box,', 'world', 'cup', 'goal,', 'putt', 'room'];
    thesis.innerHTML = thesis.textContent.trim().split(/\s+/).map(function (w) {
      var k = keys.indexOf(w.toLowerCase().replace(/[.']/g, '')) > -1 ? ' is-key' : '';
      return '<span class="w' + k + '">' + w + '</span>';
    }).join(' ');
    var words = $$('.w', thesis);
    var lightWords = function () {
      var r = thesis.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when the block's top hits 85% of the viewport, 1 when its bottom reaches 45%
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      var n = Math.round(Math.max(0, Math.min(1, p)) * words.length);
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
    };
    if (reduced) words.forEach(function (w) { w.classList.add('is-lit'); });
    else { window.addEventListener('scroll', lightWords, { passive: true }); lightWords(); }
  }

  /* ───────── barcodes ───────── */
  $$('.barcode').forEach(function (el) {
    var seed = parseInt(el.getAttribute('data-seed'), 10) || 7;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var x = 0, rects = '';
    while (x < 200) {
      var w = 1 + Math.floor(rnd() * 4);
      if (rnd() > 0.35) rects += '<rect x="' + x + '" width="' + w + '" height="60"/>';
      x += w + 1 + Math.floor(rnd() * 2);
    }
    el.innerHTML = '<svg viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true" fill="#16130f">' + rects + '</svg>';
  });

  /* ───────── split-flap board ───────── */
  var board = $('#board');
  var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  function tileCell(cell) {
    var w = parseInt(cell.getAttribute('data-w'), 10);
    var text = cell.textContent.trim().toUpperCase().replace(/–/g, '-');
    cell.setAttribute('aria-label', cell.textContent.trim());
    var padded = (text + ' '.repeat(w)).slice(0, w);
    cell.innerHTML = padded.split('').map(function (c) {
      return '<span class="tile" aria-hidden="true" data-c="' + c + '">' + (c === ' ' ? '&nbsp;' : c) + '</span>';
    }).join('');
    cell.classList.add('is-tiled');
  }
  function flapRow(row, baseDelay) {
    $$('.tile', row).forEach(function (t, i) {
      var target = t.getAttribute('data-c');
      if (target === ' ') return;
      var steps = 5 + Math.floor(Math.random() * 7) + Math.floor(i / 3);
      var n = 0;
      setTimeout(function tick() {
        t.classList.remove('is-flip'); void t.offsetWidth; t.classList.add('is-flip');
        if (n++ < steps) {
          t.textContent = CHARS[Math.floor(Math.random() * CHARS.length)];
          setTimeout(tick, 55);
        } else {
          t.textContent = target;
        }
      }, baseDelay + i * 18);
    });
  }
  if (board) {
    $$('.flap', board).forEach(tileCell);
    var rows = $$('.brow', board);
    if (!reduced && 'IntersectionObserver' in window) {
      var boardVisible = false, played = false;
      new IntersectionObserver(function (entries) {
        boardVisible = entries[0].isIntersecting;
        if (boardVisible && !played) {
          played = true;
          rows.forEach(function (r, i) { flapRow(r, i * 140); });
        }
      }, { threshold: 0.25 }).observe(board);
      // the board keeps "updating": one row re-flips every few seconds while in view
      setInterval(function () {
        if (boardVisible && !document.hidden) flapRow(rows[Math.floor(Math.random() * rows.length)], 0);
      }, 4200);
    }
  }

  /* ───────── "your idea here" typewriter + pitch box ───────── */
  var typed = $('#typed');
  var ideas = [
    'Your idea here',
    'A private box at the Super Bowl',
    'Dinner in the paddock',
    'A winery buyout in Napa',
    'Courtside for your top ten accounts',
    'A foursome at a bucket-list course'
  ];
  var pitchInput = $('#pitchInput');
  if (typed && !reduced) {
    var ii = 0, ci = ideas[0].length, deleting = true;
    (function loop() {
      if (document.activeElement === pitchInput && pitchInput.value) { setTimeout(loop, 400); return; }
      var word = ideas[ii];
      if (deleting) {
        ci--;
        typed.textContent = word.slice(0, ci);
        if (ci <= 0) { deleting = false; ii = (ii + 1) % ideas.length; }
        setTimeout(loop, 32);
      } else {
        word = ideas[ii];
        ci++;
        typed.textContent = word.slice(0, ci);
        if (ci >= word.length) { deleting = true; setTimeout(loop, 2200); }
        else setTimeout(loop, 58 + Math.random() * 60);
      }
    })();
  }

  var ideaField = $('#ideaField');
  var pitchForm = $('#pitchForm');
  if (pitchForm) {
    pitchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = pitchInput.value.trim();
      if (v) {
        ideaField.value = v;
        var wild = $('input[value="Something Wild"]');
        if (wild) wild.checked = true;
      }
      $('#brief').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { $('input[name="first_name"]').focus({ preventScroll: true }); }, 700);
    });
  }

  /* ───────── reservation card → shared intake endpoint ─────────
     Posts as form "events" (ignite_intake + #ignite-leads-general), tagged
     "Bespoke". The endpoint has no notes column yet, so guests/timing ride in
     interests and the idea rides in source (both show in the Slack ping). */
  var resNo = 'BSP-' + (1000 + Math.floor(Math.random() * 9000));
  $('#resNo').textContent = resNo;
  $('#resNo2').textContent = resNo;
  var form = $('#briefForm');
  var errNote = $('#briefErr');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['first_name', 'email'].forEach(function (n) {
        var input = form.elements[n];
        var bad = !input.value.trim() || (n === 'email' && !/^\S+@\S+\.\S+$/.test(input.value));
        input.closest('.field').classList.toggle('is-bad', bad);
        if (bad && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;

      var data = new FormData(form);
      var name = String(data.get('first_name') || '').trim().split(/\s+/);
      var guests = String(data.get('guests') || '').trim();
      var when = String(data.get('when') || '').trim();
      var idea = String(data.get('idea') || '').trim();
      var interests = ['Bespoke'].concat(data.getAll('interests'));
      if (guests) interests.push('Guests: ' + guests);
      if (when) interests.push(('When: ' + when).slice(0, 80));
      var source = 'Bespoke page' + (idea ? ' · Idea: ' + idea : '') +
        (document.referrer ? ' · Ref: ' + document.referrer : '');

      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      errNote.hidden = true;
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          form: 'events',
          first_name: name.shift(),
          last_name: name.join(' '),
          email: String(data.get('email') || '').trim(),
          company: String(data.get('company') || '').trim(),
          interests: interests,
          source: source.slice(0, 300),
          website: data.get('website') // honeypot
        })
      })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () {
          form.hidden = true;
          $('#briefDone').hidden = false;
          if (window.dataLayer) window.dataLayer.push({ event: 'bespoke_brief_submitted' });
        })
        .catch(function () {
          btn.disabled = false;
          errNote.hidden = false;
        });
    });
  }
})();
