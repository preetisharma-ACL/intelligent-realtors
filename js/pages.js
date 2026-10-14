/* ==========================================================================
   Intelligent Realtors — inner-page interactions
   FAQ, forms, job filter, project tabs, gallery lightbox, enquiry modal.
   Loads after main.js; every block bails out if its markup is absent.
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lenis = function () { return window.__lenis || null; };

  var scrollToEl = function (el, offset) {
    var y = el.getBoundingClientRect().top + window.scrollY - (offset || 0);
    if (lenis()) lenis().scrollTo(y, { duration: 1.1 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };
  var lockScroll = function (on) {
    if (lenis()) { on ? lenis().stop() : lenis().start(); }
    document.documentElement.style.overflow = on ? 'hidden' : '';
  };

  /* ----------------------------------------------------------------------
     FAQ accordion — one open at a time per list
     ---------------------------------------------------------------------- */
  $$('.faq').forEach(function (list) {
    var items = $$('.faq-item', list);
    var set = function (item, open) {
      var a = $('.faq-a', item), q = $('.faq-q', item);
      item.classList.toggle('is-open', open);
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.height = open ? a.scrollHeight + 'px' : '0px';
    };
    items.forEach(function (item, i) {
      $('.faq-q', item).addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) { if (o !== item) set(o, false); });
        set(item, open);
      });
      if (i === 0) set(item, true);
    });
    window.addEventListener('resize', function () {
      items.forEach(function (it) { if (it.classList.contains('is-open')) $('.faq-a', it).style.height = $('.faq-a', it).scrollHeight + 'px'; });
    });
  });

  /* ----------------------------------------------------------------------
     Forms — validate required fields, then show the thank-you state.
     These are front-end only: wire the submit to your CRM or mail service.
     ---------------------------------------------------------------------- */
  $$('form[data-form]').forEach(function (form) {
    var check = function (fld) {
      var input = $('input, select, textarea', fld);
      if (!input || !input.required) return true;
      var v = (input.value || '').trim(), ok = v.length > 0;
      if (ok && input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (ok && input.type === 'tel') ok = /^[0-9+\-\s]{10,15}$/.test(v);
      fld.classList.toggle('is-bad', !ok);
      return ok;
    };
    $$('.fld', form).forEach(function (fld) {
      var input = $('input, select, textarea', fld);
      if (input) input.addEventListener('input', function () { if (fld.classList.contains('is-bad')) check(fld); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('.fld', form).forEach(function (fld) { if (!check(fld)) ok = false; });
      var consent = $('.consent input', form);
      if (consent && consent.required && !consent.checked) { ok = false; consent.focus(); }
      if (!ok) { var bad = $('.fld.is-bad input, .fld.is-bad select, .fld.is-bad textarea', form); if (bad) bad.focus(); return; }
      var name = $('input[name="name"]', form);
      var who = $('[data-who]', form);
      if (who && name) who.textContent = name.value.trim().split(' ')[0];
      form.classList.add('is-sent');
    });
  });

  /* file picker shows the chosen file name */
  $$('.file-drop input[type="file"]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      var label = $('[data-file-label]', inp.parentElement);
      if (label && inp.files[0]) label.textContent = inp.files[0].name;
    });
  });

  /* ----------------------------------------------------------------------
     Careers: filter openings, and "Apply" pre-selects the role in the form
     ---------------------------------------------------------------------- */
  var jobChips = $$('.job-filter .chip');
  if (jobChips.length) {
    jobChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        jobChips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
        var want = chip.dataset.filter;
        $$('.job, .cx-job').forEach(function (job) {
          job.classList.toggle('is-hidden', want !== 'all' && job.dataset.dept !== want);
        });
      });
    });
  }
  $$('[data-apply-role]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var sel = $('#applyRole');
      if (sel) sel.value = btn.dataset.applyRole;
      var target = $('#apply');
      if (target) scrollToEl(target, 90);
    });
  });

  /* ----------------------------------------------------------------------
     Project page: sticky tabs with scroll-spy
     ---------------------------------------------------------------------- */
  var tabs = $$('.pd-tabs [data-target]');
  if (tabs.length) {
    var blocks = tabs.map(function (t) { return document.getElementById(t.dataset.target); });
    /* the tab bar is the only sticky bar on this page, so offsets follow its height */
    var tabBar = $('.pd-tabs');
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (blocks[i]) scrollToEl(blocks[i], tabBar.offsetHeight + 22); });
    });
    var activate = function () {
      var line = tabBar.offsetHeight + 60, current = 0;
      blocks.forEach(function (b, i) { if (b && b.getBoundingClientRect().top - line <= 0) current = i; });
      tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === current); });
      var active = tabs[current];
      if (active && active.parentElement.scrollWidth > active.parentElement.clientWidth) {
        active.parentElement.scrollLeft = active.offsetLeft - 20;
      }
    };
    window.addEventListener('scroll', activate, { passive: true });
    if (lenis()) lenis().on('scroll', activate);
    activate();
  }

  /* ----------------------------------------------------------------------
     Gallery lightbox
     ---------------------------------------------------------------------- */
  var shots = $$('[data-lb]');
  var lb = $('#lightbox');
  if (shots.length && lb) {
    var img = $('img', lb), count = $('.lb-count', lb), at = 0;
    var srcs = shots.map(function (s) { return s.dataset.lb; });
    var show = function (i) {
      at = (i + srcs.length) % srcs.length;
      img.src = srcs[at];
      count.textContent = (at + 1) + ' / ' + srcs.length;
    };
    var open = function (i) { show(i); lb.classList.add('is-open'); lockScroll(true); };
    var close = function () { lb.classList.remove('is-open'); lockScroll(false); };
    shots.forEach(function (s, i) { s.addEventListener('click', function () { open(+(s.dataset.lbIndex || i)); }); });
    $$('[data-lb-open]').forEach(function (b) { b.addEventListener('click', function () { open(0); }); });
    $('.lb-x', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(at - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(at + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(at - 1);
      if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* ----------------------------------------------------------------------
     Enquiry modal (Get best price, Download brochure, price breakup)
     ---------------------------------------------------------------------- */
  var mdl = $('#enqModal');
  if (mdl) {
    var title = $('[data-mdl-title]', mdl), kick = $('[data-mdl-kicker]', mdl);
    var openM = function (btn) {
      if (btn && btn.dataset.title && title) title.textContent = btn.dataset.title;
      if (btn && btn.dataset.kicker && kick) kick.textContent = btn.dataset.kicker;
      var form = $('form', mdl); if (form) form.classList.remove('is-sent');
      mdl.classList.add('is-open'); lockScroll(true);
      setTimeout(function () { var f = $('input', mdl); if (f) f.focus(); }, 350);
    };
    var closeM = function () { mdl.classList.remove('is-open'); lockScroll(false); };
    $$('[data-modal="enq"]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openM(b); }); });
    $('.mdl-x', mdl).addEventListener('click', closeM);
    mdl.addEventListener('click', function (e) { if (e.target === mdl) closeM(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mdl.classList.contains('is-open')) closeM(); });
  }

  /* ----------------------------------------------------------------------
     Careers: open roles expand to show the position details
     ---------------------------------------------------------------------- */
  var roles = $$('.cx-job');
  if (roles.length) {
    var setRole = function (role, open) {
      var body = $('.cx-job-b', role);
      role.classList.toggle('is-open', open);
      $('.cx-job-h', role).setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        body.style.height = body.scrollHeight + 'px';
      } else {
        /* from auto back to a fixed height first, so the close animates */
        body.style.height = body.scrollHeight + 'px';
        body.getBoundingClientRect();
        body.style.height = '0px';
      }
    };
    roles.forEach(function (role) {
      var body = $('.cx-job-b', role);
      body.addEventListener('transitionend', function (e) {
        if (e.target === body && role.classList.contains('is-open')) body.style.height = 'auto';
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
      $('.cx-job-h', role).addEventListener('click', function () {
        var open = !role.classList.contains('is-open');
        roles.forEach(function (o) { if (o !== role && o.classList.contains('is-open')) setRole(o, false); });
        setRole(role, open);
      });
    });
    /* search by position and location — filters as you type */
    var search = $('[data-job-search]');
    if (search) {
      var q = $('input[name="q"]', search), loc = $('select[name="loc"]', search);
      var countEl = $('[data-job-count]'), empty = $('[data-job-empty]');
      var run = function () {
        var term = q.value.trim().toLowerCase(), where = loc.value, n = 0;
        roles.forEach(function (r) {
          var show = (!term || r.dataset.title.indexOf(term) > -1) && (where === 'all' || r.dataset.loc === where);
          r.classList.toggle('is-hidden', !show);
          if (!show && r.classList.contains('is-open')) setRole(r, false);
          if (show) n++;
        });
        if (countEl) countEl.innerHTML = 'Showing <b>' + n + '</b> ' + (n === 1 ? 'role' : 'roles');
        if (empty) empty.hidden = n > 0;
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      };
      q.addEventListener('input', run);
      loc.addEventListener('change', run);
      search.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    }
  }

  /* ----------------------------------------------------------------------
     City / developer pages: show only the projects that match ?city= or ?dev=
     ---------------------------------------------------------------------- */
  var listing = $('[data-listing]');
  if (listing && window.IR_DATA) {
    var D = window.IR_DATA, mode = listing.dataset.listing;
    var qs = new URLSearchParams(window.location.search);
    var want = (qs.get(mode === 'city' ? 'city' : 'dev') || '').toLowerCase();
    var cityOf = function (k) { return D.cities.filter(function (c) { return c.key === k; })[0]; };
    var devOf = function (k) { return D.developers.filter(function (d) { return d.key === k; })[0]; };
    var match = mode === 'city' ? cityOf(want) : devOf(want);
    /* optional ?type=residential|commercial|plots, set by the Projects menu */
    var typeWant = (qs.get('type') || '').toLowerCase();
    var typeName = ({ residential: 'Residential', commercial: 'Commercial', plots: 'Plots' })[typeWant] || '';
    var rows = D.projects.filter(function (p) {
      return (!match || (mode === 'city' ? p.c : p.d) === match.key) && (!typeName || p.t === typeName);
    });

    var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
    var pin = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.3 7 13 7 13s7-7.7 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>';
    var tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-1.2 14.5-4-4 1.4-1.4 2.6 2.6 5.6-5.6 1.4 1.4-7 7z"/></svg>';
    var ne = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v2h5.6L5 15.6 6.4 17 15 8.4V14h2V5z"/></svg>';
    var card = function (p, i) {
      return '<article class="pcard lst-card" style="animation-delay:' + (i * 0.07) + 's">' +
        '<div class="pcard-media"><img src="' + p.i + '" alt="' + esc(p.n) + '" loading="lazy">' +
          '<span class="pcard-status">' + esc(p.s) + '</span><span class="pcard-cat">' + esc(p.t) + '</span>' +
          '<div class="pcard-overlay"><h3>' + esc(p.n) + '</h3><span class="pcard-loc">' + pin + esc(p.a) + ', ' + esc(cityOf(p.c).name) + '</span></div>' +
          '<span class="pcard-go" aria-hidden="true">' + ne + '</span></div>' +
        '<div class="pcard-body"><span class="pcard-dev">' + tick + 'By ' + esc(devOf(p.d).name) + '</span>' +
          '<span class="pcard-from">Starting from</span><span class="pcard-price">' + esc(p.p) + '<sup>*</sup></span>' +
          '<ul class="pcard-specs list-unstyled"><li>' + esc(p.sp[0]) + '</li><li>' + esc(p.sp[1]) + '</li></ul>' +
          '<a href="project-details.html" class="pcard-link">View details ' + ne + '</a></div>' +
      '</article>';
    };

    var name = match ? match.name : (mode === 'city' ? 'all cities' : 'our developer partners');
    var h1 = $('[data-lst-h1]'), sub = $('[data-lst-sub]'), crumb = $('[data-lst-crumb]'), logo = $('[data-lst-logo]');
    var lead = (typeName === 'Plots' ? 'Plots' : typeName ? typeName + ' projects' : 'Projects') + (mode === 'city' ? ' in ' : ' by ');
    if (h1) h1.innerHTML = lead + '<em>' + esc(name) + '</em>';
    if (crumb) crumb.textContent = match ? match.name : (mode === 'city' ? 'All cities' : 'All developers');
    if (sub) {
      var types = rows.map(function (p) { return p.t; }).filter(function (t, i, a) { return a.indexOf(t) === i; });
      sub.textContent = rows.length + (rows.length === 1 ? ' project' : ' projects') + (types.length ? ' · ' + types.join(', ') : '');
    }
    if (logo && mode === 'dev' && match) { logo.hidden = false; $('img', logo).src = match.logo; $('img', logo).alt = match.name; }
    if (match || typeName) document.title = lead + (match ? match.name : name) + ' — Intelligent Realtors';

    var empty = $('[data-lst-empty]');
    var show = function (list) {
      listing.innerHTML = list.map(card).join('');
      if (empty) empty.hidden = list.length > 0;
    };
    show(rows);

    /* banner search: budget band + free text over name, developer, locality and city */
    var crore = function (p) { var v = parseFloat(p.replace(/[^0-9.]/g, '')); return /L/.test(p) ? v / 100 : v; };
    var form = $('[data-lst-search]');
    if (form) {
      var q = $('input[name="q"]', form), budget = $('select[name="budget"]', form);
      var subDefault = sub ? sub.textContent : '';
      var run = function (scroll) {
        var term = q.value.trim().toLowerCase(), band = budget.value.split('-');
        var list = rows.filter(function (p) {
          var hay = [p.n, p.a, cityOf(p.c).name, devOf(p.d).name, p.t].join(' ').toLowerCase();
          var cr = crore(p.p);
          return (!term || hay.indexOf(term) > -1) && (!budget.value || (cr >= +band[0] && cr < +band[1]));
        });
        show(list);
        if (sub) sub.textContent = (term || budget.value) ? list.length + (list.length === 1 ? ' project matches' : ' projects match') + ' your search' : subDefault;
        if (scroll && lenis()) lenis().scrollTo(listing, { offset: -120, duration: 1 });
        else if (scroll) listing.scrollIntoView({ behavior: 'smooth' });
      };
      form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });
      q.addEventListener('input', function () { run(false); });
      budget.addEventListener('change', function () { run(false); });
    }
  }

  /* ----------------------------------------------------------------------
     Careers: growth bars fill when the card scrolls into view
     ---------------------------------------------------------------------- */
  var barCards = $$('[data-bars]');
  if (barCards.length) {
    if ('IntersectionObserver' in window) {
      var bio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); bio.unobserve(e.target); } });
      }, { threshold: .4 });
      barCards.forEach(function (c) { bio.observe(c); });
    } else barCards.forEach(function (c) { c.classList.add('is-in'); });
  }
})();
