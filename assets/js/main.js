/* ==========================================================================
   Intelligent Realtors — site script
   One file for the whole site. Every block checks for the elements it needs
   and does nothing when they are missing, so the same file loads on every
   page. Blocks share a few helpers through the IR object (section 0).

   Contents
      0.  Shared helpers
      1.  Smooth scroll + scroll sync
      2.  Header: sticky / hiding state
      3.  Mobile menu (sidebar)
      4.  Menus: projects filter
      5.  Home: new-launch slider
      6.  Home: featured projects filter
      7.  Home: testimonials
      8.  Back to top
      9.  Scroll animations
     10.  FAQ accordion
     11.  Forms: validation + thank-you state
     12.  Careers: apply buttons
     13.  Project page: floor plan tabs, nearby list
     14.  Project page: gallery lightbox
     15.  Enquiry popup
     16.  Careers: open roles + job search
     17.  Projects listing: filters, sorting, pagination
     18.  Blogs: category filter
     19.  Careers: growth bars
     20.  Home: evening-to-night hero video
     21.  Image fallback

   Libraries expected on the page: GSAP + ScrollTrigger, Lenis, Bootstrap.
   ========================================================================== */

/* Fallback image for project photos. Project cards are written in the HTML
   (by the CMS); if a card's photo fails to load, it shows this instead. */
window.IR_PLACEHOLDER = 'assets/images/project-placeholder.jpg';

/* ==========================================================================
   0. Shared helpers
   ========================================================================== */
var IR = window.IR = (function () {
  'use strict';
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenisNow = function () { return window.__lenis || null; };
  return {
    $: $, $$: $$, reduced: reduced,
    lenis: null,            /* set by section 1 */
    scrollTo: null,         /* set by section 1 */
    lenisNow: lenisNow,
    /* smooth-scroll to an element, leaving room for the header */
    scrollToEl: function (el, offset) {
      var y = el.getBoundingClientRect().top + window.scrollY - (offset || 0);
      if (lenisNow()) lenisNow().scrollTo(y, { duration: 1.1 });
      else window.scrollTo({ top: y, behavior: 'smooth' });
    },
    /* freeze page scrolling while a popup is open */
    lockScroll: function (on) {
      if (lenisNow()) { on ? lenisNow().stop() : lenisNow().start(); }
      document.documentElement.style.overflow = on ? 'hidden' : '';
    }
  };
})();

/* Only hide things for animation once we know JS actually runs. */
if (!IR.reduced) document.documentElement.classList.add('js-ready');

/* ==========================================================================
   1. Smooth scroll + scroll sync
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  var lenis = null;

  if (window.Lenis && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    window.__lenis = lenis;          /* shared with pages.js */

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  } else if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  function scrollTo(target) {
    if (lenis) lenis.scrollTo(target, target === 0 ? {} : { offset: -90 });
    else if (typeof target === 'number') window.scrollTo(0, target);
    else target.scrollIntoView({ behavior: 'smooth' });
  }

  /* anchor links */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id === '#') return;
      var el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (IR.closeMenu) IR.closeMenu();   /* defined in section 3 */
      scrollTo(el);
    });
  });

  /* shared with the blocks below */
  IR.lenis = lenis;
  IR.scrollTo = scrollTo;
})();

/* ==========================================================================
   2. Header: sticky / hiding state
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var lenis = IR.lenis;

  function onScroll(y) {
    document.body.classList.toggle('scrolled', y > 70);
  }

  if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
  else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  onScroll(window.scrollY);
})();

/* ==========================================================================
   3. Mobile menu (sidebar)
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var lenis = IR.lenis;

  var burger = $('#burger');

  function openMenu() {
    document.body.classList.add('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'true');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!document.body.classList.contains('menu-open')) return;
    document.body.classList.remove('menu-open');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }

  if (burger) burger.addEventListener('click', function () {
    document.body.classList.contains('menu-open') ? closeMenu() : openMenu();
  });
  if ($('#mmClose'))    $('#mmClose').addEventListener('click', closeMenu);
  if ($('#mmBackdrop')) $('#mmBackdrop').addEventListener('click', closeMenu);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* Locations / Developers accordions: one open at a time; a closed list is
     inert so its links are skipped by Tab and screen readers */
  var groups = $$('[data-mm-group]');
  var setGroup = function (g, open) {
    g.classList.toggle('is-open', open);
    $('.mm-toggle', g).setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.mm-sub', g).inert = !open;
  };
  groups.forEach(function (g) {
    $('.mm-toggle', g).addEventListener('click', function () {
      var open = !g.classList.contains('is-open');
      groups.forEach(function (o) { if (o !== g) setGroup(o, false); });
      setGroup(g, open);
    });
  });

  /* used by the anchor links in section 1 */
  IR.closeMenu = closeMenu;
})();

/* ==========================================================================
   4. Menus: projects filter
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  /* Locations / Developers dropdowns: once a list passes 6 links it switches
     to a wide, four-across layout, so it grows sideways rather than down */
  $$('.has-drop .drop-grid').forEach(function (g) {
    g.closest('.has-drop').classList.toggle('is-wide', $$('a', g).length > 6);
  });

  (function () {
    var cityEl = $('#snapCities'), typeEl = $('#snapTypes'), listEl = $('#snapList');
    if (!cityEl || !typeEl || !listEl) return;

    var titleEl = $('#snapTitle'), countEl = $('#snapCount');
    var items = $$('.pm-card', listEl), emptyEl = $('.pm-empty', listEl);

    /* cities and their counts come from the project cards themselves, so a
       new city appears here as soon as a project in it is added; busiest first */
    var tally = {};
    items.forEach(function (a) { tally[a.dataset.city] = (tally[a.dataset.city] || 0) + 1; });
    var CITIES = Object.keys(tally)
      .map(function (n) { return { name: n, count: tally[n] }; })
      .sort(function (a, b) { return b.count - a.count; });
    CITIES.unshift({ name: 'All cities', count: items.length });

    var TYPES = [
      { key: 'all',         label: 'All types'   },
      { key: 'residential', label: 'Residential' },
      { key: 'commercial',  label: 'Commercial'  },
      { key: 'plots',       label: 'Plots'       }
    ];

    var ALL = 'All cities';
    var city = CITIES[1] ? CITIES[1].name : ALL, type = 'all';
    var slug = function (s) { return s.toLowerCase().replace(/\s+/g, '-'); };
    var ctaEl = $('#snapCta');
    var cityBtn = function (c) {
      return '<button type="button" class="pm-city' + (c.name === city ? ' is-active' : '') +
             '" data-city="' + c.name + '">' + c.name + '<sup>' + c.count + '</sup></button>';
    };

    /* "+N more cities": the tabs that don't fit move into a small panel with a
       search box, so any number of cities stays reachable */
    var more = document.createElement('div');
    more.className = 'pm-more';
    more.innerHTML = '<button type="button" class="pm-more-btn" aria-expanded="false"></button>' +
      '<div class="pm-more-panel" hidden><input type="search" class="pm-more-search" placeholder="Search city" aria-label="Search city">' +
      '<div class="pm-more-list"></div><p class="pm-more-none" hidden>No city found.</p></div>';
    cityEl.after(more);
    var moreBtn = $('.pm-more-btn', more), morePanel = $('.pm-more-panel', more);
    var moreList = $('.pm-more-list', more), moreSearch = $('.pm-more-search', more), moreNone = $('.pm-more-none', more);
    var openMore = function (open) {
      morePanel.hidden = !open;
      moreBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { moreSearch.value = ''; filterMore(); }
    };
    var filterMore = function () {
      var q = moreSearch.value.trim().toLowerCase(), shown = 0;
      $$('.pm-city', moreList).forEach(function (b) {
        var hit = !q || b.dataset.city.toLowerCase().indexOf(q) > -1;
        b.hidden = !hit; if (hit) shown++;
      });
      moreNone.hidden = shown > 0;
    };

    /* fit the tabs to the row: every tab that would overflow goes to "more" */
    function layoutTabs() {
      var tabs = $$('.pm-city', cityEl);
      tabs.forEach(function (t) { t.hidden = false; });
      more.hidden = true;
      if (cityEl.scrollWidth <= cityEl.clientWidth + 1) { moreList.innerHTML = ''; return; }
      more.hidden = false;
      var gap = parseFloat(getComputedStyle(cityEl).columnGap) || 0, room = cityEl.clientWidth, used = 0, cut = tabs.length;
      for (var i = 0; i < tabs.length; i++) {
        used += tabs[i].offsetWidth + (i ? gap : 0);
        if (used > room && i > 0) { cut = i; break; }
      }
      var spare = CITIES.slice(cut);
      tabs.slice(cut).forEach(function (t) { t.hidden = true; });
      moreList.innerHTML = spare.map(cityBtn).join('');
      filterMore();   /* keep any search already typed when the list is rebuilt */
      var picked = spare.some(function (c) { return c.name === city; });
      moreBtn.classList.toggle('is-active', picked);
      moreBtn.innerHTML = (picked ? city : '+' + spare.length + ' more ' + (spare.length === 1 ? 'city' : 'cities')) +
        ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>';
    }

    /* the project grid shows exactly two rows of cards; the rest scroll */
    function fitRows() {
      listEl.scrollTop = 0;
      var tops = [];
      items.forEach(function (a) { if (!a.hidden && tops.indexOf(a.offsetTop) < 0) tops.push(a.offsetTop); });
      tops.sort(function (a, b) { return a - b; });
      if (tops.length < 3) { listEl.style.maxHeight = ''; return; }
      var gap = parseFloat(getComputedStyle(listEl).rowGap) || 0;
      listEl.style.maxHeight = (tops[2] - tops[0] - gap) + 'px';
    }

    function render() {
      cityEl.innerHTML = CITIES.map(cityBtn).join('');

      typeEl.innerHTML = TYPES.map(function (t) {
        return '<button type="button" class="pm-type' + (t.key === type ? ' is-active' : '') +
               '" data-type="' + t.key + '">' + t.label + '</button>';
      }).join('');

      /* the items are in the HTML; keep the ones matching city + type */
      var rows = items.filter(function (a) {
        var keep = (city === ALL || a.dataset.city === city) && (type === 'all' || a.dataset.type === type);
        a.hidden = !keep;
        return keep;
      });
      var label = TYPES.filter(function (t) { return t.key === type; })[0].label;

      titleEl.textContent = label + ' in ' + (city === ALL ? 'all cities' : city);
      if (countEl) countEl.textContent = rows.length + (rows.length === 1 ? ' project' : ' projects') + ' available';

      /* one button that follows the choice: city + property type */
      if (ctaEl) {
        var noun = type === 'all' ? 'projects' : type === 'plots' ? 'plots' : label.toLowerCase() + ' projects';
        ctaEl.querySelector('span').textContent = city === ALL ? 'View all ' + noun : 'View ' + (type === 'all' ? 'all ' : '') + noun + ' in ' + city;
        ctaEl.href = city === ALL
          ? (type === 'all' ? 'projects.html' : 'property-type.html?type=' + type)
          : 'projects.html?city=' + slug(city) + (type === 'all' ? '' : '&type=' + type);
      }

      if (emptyEl) emptyEl.hidden = rows.length > 0;
      layoutTabs();
      fitRows();

      if (window.gsap && !reduced) {
        gsap.fromTo(rows.length ? rows : [emptyEl],
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, clearProps: 'transform', duration: .38, stagger: .045, ease: 'power2.out', overwrite: true });
        gsap.fromTo(titleEl,
          { autoAlpha: 0, x: -8 },
          { autoAlpha: 1, x: 0, duration: .34, ease: 'power2.out', overwrite: true });
      }
    }

    cityEl.addEventListener('click', function (e) {
      var b = e.target.closest('.pm-city'); if (!b) return;
      city = b.dataset.city; render();
    });
    cityEl.addEventListener('mouseover', function (e) {
      var b = e.target.closest('.pm-city'); if (!b || b.dataset.city === city) return;
      city = b.dataset.city; render();
    });
    typeEl.addEventListener('click', function (e) {
      var b = e.target.closest('.pm-type'); if (!b) return;
      type = b.dataset.type; render();
    });
    moreBtn.addEventListener('click', function () { openMore(morePanel.hidden); });
    moreSearch.addEventListener('input', filterMore);
    moreList.addEventListener('click', function (e) {
      var b = e.target.closest('.pm-city'); if (!b) return;
      city = b.dataset.city; openMore(false); render();
    });
    document.addEventListener('click', function (e) { if (!more.contains(e.target)) openMore(false); });
    /* widths are only final once the menu is open and fonts have loaded */
    var refit = function () { layoutTabs(); fitRows(); };
    var mega = cityEl.closest('.has-mega');
    if (mega) mega.addEventListener('mouseenter', refit);
    window.addEventListener('resize', refit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

    render();
  })();
})();

/* ==========================================================================
   5. Home: new-launch slider
   { speed: 4000, autoplay: { delay: 0 }, loop: true }: each card takes
   four seconds to glide past and the next glide starts straight away,
   so the rail moves like a slow conveyor rather than stepping.
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  (function () {
    var rail = $('#launchRail'), dotsEl = $('#launchDots');
    if (!rail) return;

    var SPEED = 4;          /* seconds per card, as on the reference */
    var CLICK = 1.1;        /* a dot click should answer faster than the drift */
    var GAP = 24;           /* matches the 1.5rem flex gap */

    var originals = [].slice.call(rail.querySelectorAll('.pcard'));
    var N = originals.length;
    if (N < 2) return;

    /* clone the set so the loop wraps without a visible rewind */
    originals.forEach(function (card) {
      var k = card.cloneNode(true);
      k.classList.remove('reveal-card');
      k.classList.add('is-clone');
      k.setAttribute('aria-hidden', 'true');
      [].forEach.call(k.querySelectorAll('a, button'), function (el) { el.tabIndex = -1; });
      rail.appendChild(k);
    });

    var i = 0, tween = null, waitId = null;
    var held = false, offscreen = true;

    var step = function () { return originals[0].getBoundingClientRect().width + GAP; };

    /* ---- dots: one per project, sized by distance from the active one ---- */
    if (dotsEl) {
      var html = '';
      for (var d = 0; d < N; d++) {
        html += '<button class="rail-dot" role="tab" aria-label="Show project ' + (d + 1) + '" data-i="' + d + '"></button>';
      }
      dotsEl.innerHTML = html;
    }
    var paint = function () {
      if (!dotsEl) return;
      var a = ((i % N) + N) % N, dots = dotsEl.children;
      for (var k = 0; k < dots.length; k++) {
        var dist = Math.abs(k - a);
        dots[k].className = 'rail-dot' + (dist === 0 ? ' is-active' : dist === 1 ? ' is-near' : dist === 2 ? ' is-mid' : ' is-far');
        dots[k].setAttribute('aria-selected', dist === 0 ? 'true' : 'false');
      }
    };

    var glide = function (to, dur, done) {
      if (tween) tween.kill();
      if (window.gsap) {
        tween = gsap.to(rail, { scrollLeft: to, duration: dur, ease: 'power1.inOut', onComplete: done });
      } else {
        rail.scrollLeft = to;
        waitId = setTimeout(done, dur * 1000);
      }
    };

    /* once we've drifted onto the clones, jump back by one set — the frames match */
    var wrap = function () {
      if (i >= N) { i -= N; rail.scrollLeft = i * step(); }
    };

    var advance = function () {
      clearTimeout(waitId);
      if (held || offscreen || document.hidden || reduced) {
        waitId = setTimeout(advance, 500);
        return;
      }
      i += 1;
      paint();
      glide(i * step(), SPEED, function () { wrap(); advance(); });
    };

    /* ---- dot clicks ---- */
    if (dotsEl) dotsEl.addEventListener('click', function (e) {
      var b = e.target.closest('.rail-dot'); if (!b) return;
      clearTimeout(waitId);
      i = +b.dataset.i;
      paint();
      glide(i * step(), CLICK, advance);
    });

    /* ---- hand control to the visitor while they drag, swipe or wheel ---- */
    var release;
    var hold = function () {
      held = true;
      if (tween) tween.kill();
      clearTimeout(release);
    };
    var letGo = function () {
      clearTimeout(release);
      release = setTimeout(function () {
        var s = step();
        if (rail.scrollLeft >= N * s) rail.scrollLeft -= N * s;
        i = Math.round(rail.scrollLeft / s);
        paint();
        held = false;
        glide(i * s, .6, advance);          /* settle onto a card, then carry on */
      }, 1400);
    };
    rail.addEventListener('pointerdown', hold);
    rail.addEventListener('touchstart', hold, { passive: true });
    window.addEventListener('pointerup', function () { if (held) letGo(); });
    rail.addEventListener('touchend', letGo, { passive: true });
    rail.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { hold(); letGo(); }
    }, { passive: true });

    /* only run while the section is on screen */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        offscreen = !entries[0].isIntersecting;
      }, { threshold: .15 }).observe(rail);
    } else {
      offscreen = false;
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        if (tween) tween.kill();
        rail.scrollLeft = i * step();
        clearTimeout(waitId);
        advance();
      }, 150);
    });

    paint();
    advance();
  })();
})();

/* ==========================================================================
   6. Home: featured projects filter
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  (function () {
    var chips = $$('.chip');
    var cards = $$('#projGrid .pcard');
    if (!chips.length || !cards.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.classList.remove('is-active'); });
        chip.classList.add('is-active');

        var want = chip.dataset.filter;
        var shown = [];

        cards.forEach(function (card) {
          var match = want === 'all' || (card.dataset.cat || '').indexOf(want) > -1;
          card.classList.toggle('is-hidden', !match);
          if (match) shown.push(card);
        });

        /* the "View all" button below follows the chip */
        var all = $('#featuredAll');
        if (all) {
          $('span', all).textContent = want === 'all' ? 'View all projects' : 'View all ' + chip.textContent.trim().toLowerCase() + (want === 'plots' ? '' : ' projects');
          all.href = want === 'all' ? 'projects.html' : 'property-type.html?type=' + want;
        }

        if (window.gsap && !reduced) {
          gsap.fromTo(shown,
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, stagger: .08, ease: 'power3.out', overwrite: true });
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  })();
})();

/* ==========================================================================
   7. Home: testimonials
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  (function () {
    var main = $('#tqMain');
    if (!main) return;
    var slides = $$('.tq-slide', main), N = slides.length;
    if (!N) return;
    var at = 0, timer = null, hovering = false;

    var render = function () {
      slides.forEach(function (s, i) {
        s.classList.toggle('is-active', i === at);
        s.setAttribute('aria-hidden', i === at ? 'false' : 'true');
      });
    };
    var start = function () {
      clearInterval(timer);
      if (reduced || hovering) return;
      timer = setInterval(function () { at = (at + 1) % N; render(); }, 6500);
    };
    var go = function (i) { at = (i + N) % N; render(); start(); };

    $('#tqNext').addEventListener('click', function () { go(at + 1); });
    $('#tqPrev').addEventListener('click', function () { go(at - 1); });
    main.addEventListener('mouseenter', function () { hovering = true; clearInterval(timer); });
    main.addEventListener('mouseleave', function () { hovering = false; start(); });

    var x0 = null;
    main.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) go(at + (dx < 0 ? 1 : -1));
      x0 = null;
    });

    render();
    start();
  })();
})();

/* ==========================================================================
   8. Back to top
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var scrollTo = IR.scrollTo;

  if ($('#toTop')) $('#toTop').addEventListener('click', function () { scrollTo(0); });
})();

/* ==========================================================================
   9. Scroll animations
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  if (!window.gsap || reduced) {
    document.documentElement.classList.remove('js-ready');
    return;
  }

  /* homepage hero only */
  if ($('.hero')) {
    /* -- hero: photo eases in, then kicker, headline, subtitle and button
          rise in sequence -- */
    var heroBits = $$('.hero-kicker, .hero-title, .hero-sub, .hero-cta');
    gsap.set(heroBits, { autoAlpha: 0 });

    var heroTl = gsap.timeline({ delay: .2 });

    /* banner text rises from the bottom one line after another, easing in
       from a soft blur; the photos zoom and crossfade on their own in CSS */
    heroTl.fromTo(heroBits,
                  { autoAlpha: 0, y: 80, filter: 'blur(10px)' },
                  { autoAlpha: 1, y: 0, filter: 'blur(0px)', clearProps: 'transform,filter',
                    duration: 1.6, stagger: .22, ease: 'expo.out' }, .3);

    /* -- hero parallax -- */
    gsap.to('#heroImg', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* -- home: the about panel rises over the pinned banner. It enters as a
        smaller card with an arched top and grows to full screen, the arch
        flattening, by the time it reaches the top of the window. -- */
  var rise = $('[data-rise]');
  if (rise) {
    var arch = function () { var r = Math.round(rise.offsetWidth * 0.5); return r + 'px ' + r + 'px 0px 0px'; };
    gsap.fromTo(rise,
      { scale: 0.72, borderRadius: arch },
      {
        scale: 1, borderRadius: '0px 0px 0px 0px', ease: 'none',
        scrollTrigger: { trigger: rise.parentElement, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true }
      });
  }

  /* -- home: the three pillars rise into place one after another -- */
  if ($('.pillars')) {
    gsap.fromTo('.pillar',
      { autoAlpha: 0, y: 100 },
      {
        autoAlpha: 1, y: 0, clearProps: 'transform', duration: 1.1, stagger: .15, ease: 'power3.out',
        scrollTrigger: { trigger: '.pillars', start: 'top 85%', once: true }
      });
  }

  /* -- generic reveals -- */
  $$('.reveal').forEach(function (el) {
    if (el.closest('.hero')) return;           /* hero handled by the timeline */
    gsap.fromTo(el,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
  });

  /* -- cards stagger within their own row/grid -- */
  var groups = [];
  $$('.reveal-card').forEach(function (el) {
    var parent = el.parentElement;
    if (parent && /col(-|$)/.test(parent.className)) parent = parent.parentElement;
    var g = groups.filter(function (x) { return x.parent === parent; })[0];
    if (!g) { g = { parent: parent, items: [] }; groups.push(g); }
    g.items.push(el);
  });

  groups.forEach(function (g) {
    gsap.fromTo(g.items,
      { autoAlpha: 0, y: 30 },
      {
        autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, stagger: .08, ease: 'power3.out',
        scrollTrigger: { trigger: g.items[0], start: 'top 88%', once: true },
        onComplete: function () { ScrollTrigger.refresh(); }
      });
  });

  /* -- why-choose-us: same motion as the about cards. The five cards wait
        stacked behind the centre card, then deal out to their places as you
        scroll (scrubbed, so it reverses on the way back up). The cards differ
        in size, so each stacked offset is measured: the inner pair peeks out a
        little from behind the centre card, the outer pair a little more.
        Five-across layout only; narrower screens just fade up. -- */
  (function () {
    var row = $('.why5-row');
    if (!row) return;
    var cards = [].slice.call(row.querySelectorAll('.wc'));
    if (cards.length !== 5) return;
    var mm = gsap.matchMedia();

    mm.add('(min-width: 992px)', function () {
      var PEEK = 26;                                    /* px each layer shows past the one in front */
      var LOOK = [                                      /* stacked pose per card, left to right */
        { depth: 2, rot: -9, scale: .86, y: 36 },
        { depth: 1, rot: -5, scale: .93, y: 22 },
        null,                                           /* centre card */
        { depth: 1, rot: 5,  scale: .93, y: 22 },
        { depth: 2, rot: 9,  scale: .86, y: 36 }
      ];
      var centreX = function (el) { return el.offsetLeft + el.offsetWidth / 2; };
      /* x that parks a card behind the centre card with its outer edge showing */
      var stackX = function (i) {
        var c = cards[2], el = cards[i], side = i < 2 ? -1 : 1, L = LOOK[i];
        var show = c.offsetWidth / 2 - el.offsetWidth * L.scale / 2 + L.depth * PEEK;
        return centreX(c) - centreX(el) + side * show;
      };

      gsap.set(cards, { autoAlpha: 1 });
      gsap.set(cards[2], { zIndex: 5 });
      gsap.set([cards[1], cards[3]], { zIndex: 4 });
      gsap.set([cards[0], cards[4]], { zIndex: 3 });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: row, start: 'top 92%', end: 'center 52%',
          scrub: .7, invalidateOnRefresh: true
        }
      });
      cards.forEach(function (el, i) {
        var L = LOOK[i];
        /* fromTo, not from: on refresh a from() would re-read the stacked state as its end point */
        if (L) tl.fromTo(el, { x: function () { return stackX(i); }, y: L.y, rotation: L.rot, scale: L.scale }, { x: 0, y: 0, rotation: 0, scale: 1 }, 0);
        else   tl.fromTo(el, { y: -14, scale: 1.03 }, { y: 0, scale: 1 }, 0);
      });

      return function () { gsap.set(cards, { clearProps: 'zIndex,transform,opacity,visibility' }); };
    });

    mm.add('(max-width: 991.98px)', function () {
      gsap.fromTo(cards, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, stagger: .08, ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 88%', once: true }
      });
    });
  })();

  /* -- about: the three "learn more" cards wait stacked in the centre, then
        deal out to their places as you scroll. Scrubbed, so it reverses on the
        way back up. Three-across layout only; narrower screens just fade up. -- */
  (function () {
    var grid = $('.lm-grid');
    if (!grid) return;
    var cards = [].slice.call(grid.querySelectorAll('.lm-card'));
    if (cards.length !== 3) return;
    var mm = gsap.matchMedia();

    mm.add('(min-width: 992px)', function () {
      /* distance from an outer column to the centre one, less a sliver so the
         back cards peek out from behind the front card while stacked */
      var toCentre = function () { return cards[1].offsetLeft - cards[0].offsetLeft - 36; };
      gsap.set(cards[1], { zIndex: 3 });
      gsap.set(cards[0], { zIndex: 2 });
      gsap.set(cards[2], { zIndex: 1 });

      /* no pin: the page keeps scrolling and the cards spread while the section
         rises into view. ease none + light scrub smoothing = an even glide */
      gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: grid, start: 'top 92%', end: 'center 52%',
          scrub: .7, invalidateOnRefresh: true,
          onToggle: function (self) { grid.classList.toggle('is-moving', self.isActive); }
        }
      })
        /* fromTo, not from: on refresh a from() would re-read the stacked state as its end point */
        .fromTo(cards[0], { x: function () { return toCentre(); },  y: 22, rotation: -7, scale: .9 }, { x: 0, y: 0, rotation: 0, scale: 1 }, 0)
        .fromTo(cards[2], { x: function () { return -toCentre(); }, y: 22, rotation: 7,  scale: .9 }, { x: 0, y: 0, rotation: 0, scale: 1 }, 0)
        .fromTo(cards[1], { y: -14, scale: 1.03 }, { y: 0, scale: 1 }, 0);

      return function () { grid.classList.remove('is-moving'); gsap.set(cards, { clearProps: 'zIndex,transform' }); };
    });

    mm.add('(max-width: 991.98px)', function () {
      gsap.fromTo(cards, { autoAlpha: 0, y: 30 }, {
        autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, stagger: .08, ease: 'power3.out',
        scrollTrigger: { trigger: grid, start: 'top 88%', once: true }
      });
    });
  })();

  /* -- partner wall: one cell at a time, the logo dissolves out (blur, fade,
        drift up) as a spare logo dissolves in, with a gold light sweep -- */
  (function () {
    var wall = $('.pgrid'), poolEl = $('#pgPool');
    if (!wall || !poolEl) return;
    var spares = JSON.parse(poolEl.textContent || '[]');
    var cells = [].slice.call(wall.querySelectorAll('.pg-cell'));
    if (!spares.length || !cells.length) return;

    /* preload so a logo never dissolves in half-loaded */
    spares.forEach(function (s) { var im = new Image(); im.src = s.src; });

    /* shuffled visiting order, so it twinkles rather than sweeping in a line */
    var order = [];
    var nextCell = function () {
      if (!order.length) order = cells.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
      return cells[order.pop()];
    };

    var swap = function () {
      var cell = null;
      for (var t = 0; t < cells.length && !cell; t++) {
        var c = nextCell();
        /* skip cells hidden on this screen size, mid-swap, or under the pointer */
        if (c.offsetParent !== null && !c.classList.contains('is-swapping') && !c.matches(':hover')) cell = c;
      }
      if (!cell) return;

      var oldImg = cell.querySelector('img');
      var incoming = spares.shift();
      var outgoing = { src: oldImg.getAttribute('src'), name: oldImg.alt, h: parseFloat(oldImg.style.getPropertyValue('--h')) || 40 };

      var newImg = oldImg.cloneNode();
      newImg.src = incoming.src;
      newImg.alt = incoming.name;
      newImg.style.cssText = '--h:' + incoming.h + 'px';
      oldImg.after(newImg);
      cell.classList.add('is-swapping');

      gsap.timeline({
        onComplete: function () {
          oldImg.remove();
          gsap.set(newImg, { clearProps: 'opacity,filter,transform' });
          cell.classList.remove('is-swapping');
          spares.push(outgoing);              /* back in the pool once it has left */
        }
      })
        .to(oldImg, { opacity: 0, filter: 'blur(8px)', scale: .86, y: -10, duration: .9, ease: 'power2.inOut' })
        .fromTo(newImg,
          { opacity: 0, filter: 'blur(10px)', scale: 1.12, y: 10 },
          { opacity: 1, filter: 'blur(0px)', scale: 1, y: 0, duration: 1.1, ease: 'power3.out' }, .35)
        .fromTo(cell.querySelector('.pg-shine'),
          { xPercent: 0, opacity: 0 },
          { xPercent: 420, opacity: 1, duration: 1.2, ease: 'power2.inOut' }, .1);
    };

    /* run on GSAP's clock so it stops with everything else when the tab is hidden */
    var loop = null;
    var tick = function () { swap(); loop = gsap.delayedCall(1.6, tick); };
    var start = function () { if (!loop) loop = gsap.delayedCall(.6, tick); };
    var stop = function () { if (loop) loop.kill(); loop = null; };
    var inView = false;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { inView = e[0].isIntersecting; inView ? start() : stop(); }, { threshold: .25 }).observe(wall);
    } else { start(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (inView && start()); });
  })();

  /* fonts and images both shift layout once they settle */
  if (document.fonts) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); }, { once: true });
})();

/* ==========================================================================
   10. FAQ accordion
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

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
})();

/* ==========================================================================
   11. Forms: validation + thank-you state
   These are front-end only: wire the submit to your CRM or mail service.
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

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
})();

/* ==========================================================================
   12. Careers: apply buttons
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var scrollToEl = IR.scrollToEl;

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
})();

/* ==========================================================================
   13. Project page: floor plan tabs, nearby list
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$;
  var lenis = IR.lenisNow;
  var scrollToEl = IR.scrollToEl;

  /* section tabs: a click scrolls to the block just below the navbar + tab
     bar; while scrolling, the tab of the block in view is underlined */
  var tabs = $$('.pd-tabs [data-target]');
  if (tabs.length) {
    var bar = $('.pd-tabs'), header = $('.site-header');
    var blocks = tabs.map(function (t) { return document.getElementById(t.dataset.target); });
    var offset = function () { return (header ? header.offsetHeight : 0) + bar.offsetHeight + 16; };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { if (blocks[i]) scrollToEl(blocks[i], offset()); });
    });
    var activate = function () {
      var line = offset() + 40, current = 0;
      blocks.forEach(function (b, i) { if (b && b.getBoundingClientRect().top - line <= 0) current = i; });
      tabs.forEach(function (t, i) { t.classList.toggle('is-active', i === current); });
      var nav = tabs[current].parentElement;
      if (nav.scrollWidth > nav.clientWidth) nav.scrollLeft = tabs[current].offsetLeft - 20;
    };
    window.addEventListener('scroll', activate, { passive: true });
    if (lenis()) lenis().on('scroll', activate);
    activate();
  }

  /* floor plans: one tab per unit type shows its card; arrow keys move
     between tabs, as in a standard tab list */
  $$('[data-pj-tabs]').forEach(function (box) {
    var btns = $$('[role="tab"]', box);
    var show = function (i, focus) {
      btns.forEach(function (b, k) {
        var on = k === i;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) btns[i].focus();
    };
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { show(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % btns.length, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show((i - 1 + btns.length) % btns.length, true); }
      });
    });
  });

  /* FAQ search: hides the questions (and answers) that don't contain the
     words typed; a short note shows when nothing matches */
  $$('[data-faq-search]').forEach(function (input) {
    var sec = input.closest('section');
    var items = $$('.faq-item', sec), none = $('[data-faq-none]', sec);
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase(), shown = 0;
      items.forEach(function (it) {
        var hit = !q || it.textContent.toLowerCase().indexOf(q) > -1;
        it.hidden = !hit;
        if (hit) shown++;
      });
      if (none) none.hidden = shown > 0;
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  });

  /* travel times: past 8 places, fold the rest behind a View all button so
     the block stays compact however long the list grows */
  var NEAR_SHOWN = 8;
  $$('.pj-near').forEach(function (list) {
    var items = $$('li', list);
    if (items.length <= NEAR_SHOWN) return;
    var extra = items.slice(NEAR_SHOWN);
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'near-more';
    btn.setAttribute('aria-expanded', 'false');
    var label = function (open) {
      btn.innerHTML = (open ? 'Show fewer places' : 'View all ' + items.length + ' places') +
        ' <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5z"/></svg>';
    };
    var set = function (open) {
      extra.forEach(function (li) { li.hidden = !open; });
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      label(open);
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    list.after(btn);
    set(false);
  });
})();

/* ==========================================================================
   14. Project page: gallery lightbox
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var lockScroll = IR.lockScroll;

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
})();

/* ==========================================================================
   15. Enquiry popup
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var lockScroll = IR.lockScroll;

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
})();

/* ==========================================================================
   16. Careers: open roles + job search
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

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
})();

/* ==========================================================================
   17. Projects listing: filters, sorting, pagination
   Every project card is in the HTML with data- labels. This block only
   reads the filters, then shows, sorts and pages the cards. All choices
   live in the URL, so a filtered view can be shared or bookmarked.
   property-type.html locks the type from ?type= and swaps the heading.
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;
  var lenis = IR.lenisNow;

  var flt = $('[data-flt]'), grid = $('[data-listing]');
  if (flt && grid) {
    var PER_PAGE = 6;
    var cards = $$('.pcard', grid);
    var tabs = $$('.flt-tabs [data-type]', flt);
    var sortEl = $('[data-sort]'), rbar = $('[data-rbar]'), pager = $('[data-pager]'), empty = $('[data-lst-empty]');
    var field = function (n) { return flt.elements.namedItem(n); };
    var TYPE_COPY = {
      residential: { label: 'Residential', h1: 'Residential <em>projects</em>', lead: 'Homes for every stage of life, from a first apartment to a family villa, each checked before it reaches you.' },
      commercial:  { label: 'Commercial',  h1: 'Commercial <em>projects</em>',  lead: 'Offices, retail and pre-leased assets, assessed on lease terms, tenant quality and location.' },
      plots:       { label: 'Plots',       h1: 'Plots &amp; <em>land</em>',     lead: 'Freehold plots with clear title and sanctioned layouts, ready for you to build on.' }
    };
    var locked = flt.hasAttribute('data-locked-type');

    /* ----- state <-> URL ----- */
    var state = (function () {
      var u = new URLSearchParams(location.search);
      var t = (u.get('type') || '').toLowerCase();
      if (!TYPE_COPY[t]) t = locked ? 'residential' : 'all';
      return { type: t, city: u.get('city') || '', dev: u.get('dev') || '', status: u.get('status') || '',
               budget: u.get('budget') || '', q: u.get('q') || '', sort: u.get('sort') || '', page: Math.max(1, +u.get('page') || 1) };
    })();
    var writeUrl = function () {
      var u = new URLSearchParams();
      if (state.type !== 'all') u.set('type', state.type);
      ['city', 'dev', 'status', 'budget', 'q', 'sort'].forEach(function (k) { if (state[k]) u.set(k, state[k]); });
      if (state.page > 1) u.set('page', state.page);
      var qs = u.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : ''));
    };
    var fillForm = function () {
      ['city', 'dev', 'status', 'budget', 'q'].forEach(function (k) { if (field(k)) field(k).value = state[k]; });
      if (sortEl) sortEl.value = state.sort;
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.type === state.type ? 'true' : 'false'); });
    };

    /* ----- filtering ----- */
    var matches = function (c, ignoreType) {
      var cr = parseFloat(c.dataset.price), band = state.budget.split('-');
      return (ignoreType || state.type === 'all' || c.dataset.type === state.type) &&
             (!state.city || c.dataset.city === state.city) &&
             (!state.dev || c.dataset.developer === state.dev) &&
             (!state.status || c.dataset.status === state.status) &&
             (!state.budget || (cr >= +band[0] && cr < +band[1])) &&
             (!state.q || c.dataset.search.indexOf(state.q.toLowerCase()) > -1);
    };
    /* "price on request" cards have no price and always sort last */
    var byPrice = function (dir) {
      return function (a, b) {
        var x = parseFloat(a.dataset.price), y = parseFloat(b.dataset.price);
        if (isNaN(x) || isNaN(y)) return isNaN(x) - isNaN(y);
        return (x - y) * dir;
      };
    };
    var sorted = function (list) {
      var by = {
        'price-asc':  byPrice(1),
        'price-desc': byPrice(-1),
        'name':       function (a, b) { return $('h3', a).textContent.localeCompare($('h3', b).textContent); }
      }[state.sort] || function (a, b) { return a.dataset.index - b.dataset.index; };
      return list.slice().sort(by);
    };

    /* ----- rendering ----- */
    var heading = function () {
      var h1 = $('[data-lst-h1]'), sub = $('[data-lst-sub]'), crumb = $('[data-lst-crumb]'), logo = $('[data-lst-logo]');
      var pick = function (k, v) { return cards.filter(function (c) { return c.dataset[k] === v; })[0]; };
      var title = function (text, em) { h1.textContent = text; var e = document.createElement('em'); e.textContent = em; h1.appendChild(e); };
      if (locked) {
        var t = TYPE_COPY[state.type];
        if (h1) h1.innerHTML = t.h1;
        if (sub) sub.textContent = t.lead;
        if (crumb) crumb.textContent = t.label;
        document.title = t.label + ' Projects — Intelligent Realtors';
        return;
      }
      var dev = state.dev && pick('developer', state.dev), place = state.city && pick('city', state.city);
      if (h1 && dev) title('Projects by ', dev.dataset.developerName);
      else if (h1 && place) title('Projects in ', place.dataset.cityName);
      if (logo) { logo.hidden = !dev; if (dev) { $('img', logo).src = dev.dataset.developerLogo; $('img', logo).alt = dev.dataset.developerName; } }
      if (crumb) crumb.textContent = dev ? dev.dataset.developerName : place ? place.dataset.cityName : 'Projects';
      if (dev || place) document.title = 'Projects ' + (dev ? 'by ' + dev.dataset.developerName : 'in ' + place.dataset.cityName) + ' — Intelligent Realtors';
    };
    var render = function (scroll) {
      var list = sorted(cards.filter(function (c) { return matches(c, false); }));
      var pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
      if (state.page > pages) state.page = pages;
      var from = (state.page - 1) * PER_PAGE, page = list.slice(from, from + PER_PAGE);

      cards.forEach(function (c) { c.hidden = page.indexOf(c) < 0; });
      page.forEach(function (c, i) { grid.appendChild(c); c.style.animationDelay = (i * 0.06) + 's'; });

      /* tab counts follow every filter except the type itself */
      $$('[data-count]', flt).forEach(function (s) {
        var k = s.dataset.count;
        s.textContent = cards.filter(function (c) { return matches(c, true) && (k === 'all' || c.dataset.type === k); }).length;
      });
      if (rbar) rbar.innerHTML = list.length
        ? 'Showing <b>' + (from + 1) + '&ndash;' + (from + page.length) + '</b> of <b>' + list.length + '</b> ' + (list.length === 1 ? 'project' : 'projects')
        : 'No projects match';
      if (empty) empty.hidden = list.length > 0;

      if (pager) {
        var html = '';
        if (pages > 1) {
          html += '<button type="button" data-page="' + (state.page - 1) + '"' + (state.page === 1 ? ' disabled' : '') + ' aria-label="Previous page">&lsaquo;</button>';
          for (var p = 1; p <= pages; p++) html += '<button type="button" data-page="' + p + '"' + (p === state.page ? ' aria-current="page"' : '') + '>' + p + '</button>';
          html += '<button type="button" data-page="' + (state.page + 1) + '"' + (state.page === pages ? ' disabled' : '') + ' aria-label="Next page">&rsaquo;</button>';
        }
        pager.innerHTML = html;
      }
      writeUrl();
      if (scroll) { if (lenis()) lenis().scrollTo(flt, { offset: -110, duration: 1 }); else flt.scrollIntoView({ behavior: 'smooth' }); }
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    };

    /* ----- events ----- */
    var update = function (scroll) { state.page = 1; render(scroll); };
    tabs.forEach(function (t) { t.addEventListener('click', function () { state.type = t.dataset.type; fillForm(); update(false); }); });
    ['city', 'dev', 'status', 'budget'].forEach(function (k) {
      if (field(k)) field(k).addEventListener('change', function () { state[k] = this.value; update(false); });
    });
    if (field('q')) field('q').addEventListener('input', function () { state.q = this.value.trim(); update(false); });
    if (sortEl) sortEl.addEventListener('change', function () { state.sort = sortEl.value; update(false); });
    var clear = function () {
      ['city', 'dev', 'status', 'budget', 'q', 'sort'].forEach(function (k) { state[k] = ''; });
      if (!locked) state.type = 'all';
      fillForm(); update(true);
    };
    flt.addEventListener('reset', function (e) { e.preventDefault(); clear(); });
    flt.addEventListener('submit', function (e) { e.preventDefault(); update(true); });
    $$('[data-flt-clear]').forEach(function (b) { b.addEventListener('click', clear); });
    if (pager) pager.addEventListener('click', function (e) {
      var b = e.target.closest('[data-page]'); if (!b || b.disabled) return;
      state.page = +b.dataset.page; render(true);
    });

    fillForm(); heading(); render(false);
  }
})();

/* ==========================================================================
   18. Blogs: category filter
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

  var blogFilter = $('[data-blog-filter]');
  if (blogFilter) {
    var posts = $$('.blog-card');
    blogFilter.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cat]'); if (!b) return;
      $$('[data-cat]', blogFilter).forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      posts.forEach(function (p) { p.hidden = b.dataset.cat !== 'all' && p.dataset.cat !== b.dataset.cat; });
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }
})();

/* ==========================================================================
   19. Careers: growth bars
   ========================================================================== */
(function () {
  'use strict';
  var $ = IR.$, $$ = IR.$$, reduced = IR.reduced;

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

/* ==========================================================================
   20. Home: evening-to-night hero video
   Plays one skyline from evening to night, starting at data-start seconds. Loads the 1080p
   file on larger screens and 720p on phones. At the end of each run the
   evening still fades in, the video rewinds to the start point underneath, and
   the still fades out, so the cycle never jumps from night straight back. Pauses when
   scrolled out of view or when the tab is hidden; with reduced motion the
   poster stays as a still image.
   ========================================================================== */
(function () {
  'use strict';
  var video = document.querySelector('.hero-video');
  if (!video || IR.reduced) return;
  var still = document.querySelector('.hero-dissolve');
  var FADE = 1400;            /* matches the CSS transition on .hero-dissolve */
  var START = parseFloat(video.dataset.start) || 0;   /* where the evening begins */

  var small = window.matchMedia('(max-width: 767.98px)').matches;
  video.src = small ? video.dataset.srcSd : video.dataset.srcHd;
  video.muted = true;         /* browsers only autoplay muted video */
  video.preload = 'auto';
  /* jump to the evening before the first frame is shown */
  video.addEventListener('loadedmetadata', function () { if (START && video.currentTime < START) video.currentTime = START; }, { once: true });

  var play = function () { var p = video.play(); if (p && p.catch) p.catch(function () {}); };
  var inView = true, restarting = false;

  /* night -> evening dissolve, started just before the clip ends */
  video.addEventListener('timeupdate', function () {
    if (restarting || !video.duration || video.duration - video.currentTime > FADE / 1000 + 0.15) return;
    restarting = true;
    if (still) still.classList.add('is-on');
    setTimeout(function () {
      video.addEventListener('seeked', function () {
        if (inView && !document.hidden) play();
        setTimeout(function () { if (still) still.classList.remove('is-on'); restarting = false; }, 120);
      }, { once: true });
      video.currentTime = START;
    }, FADE);
  });
  video.addEventListener('ended', function () { if (!restarting) { video.currentTime = START; play(); } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      inView = e[0].isIntersecting;
      if (inView && !document.hidden) play(); else video.pause();
    }).observe(video);
  } else play();
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) video.pause(); else if (inView) play();
  });
})();

/* ==========================================================================
   21. Image fallback
   If a project photo from the CMS fails to load, show the placeholder
   instead of a broken image. Runs once per image.
   ========================================================================== */
document.addEventListener('error', function (e) {
  var img = e.target;
  if (!img || img.tagName !== 'IMG' || img.dataset.fallback) return;
  if (!img.closest('.pcard-media, .pm-card')) return;
  img.dataset.fallback = '1';
  img.src = window.IR_PLACEHOLDER;
}, true);
