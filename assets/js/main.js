/* ==========================================================================
   Intelligent Realtors — interaction layer
   Lenis drives the scroll, GSAP/ScrollTrigger reads from it.
   ========================================================================== */

(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Only hide things for animation once we know JS actually runs. */
  if (!reduced) document.documentElement.classList.add('js-ready');

  /* ----------------------------------------------------------------------
     1. Smooth scroll (Lenis) + ScrollTrigger handshake
     ---------------------------------------------------------------------- */
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
      closeMenu();
      scrollTo(el);
    });
  });

  /* ----------------------------------------------------------------------
     2. Header state
     ---------------------------------------------------------------------- */
  function onScroll(y) {
    document.body.classList.toggle('scrolled', y > 70);
  }

  if (lenis) lenis.on('scroll', function (e) { onScroll(e.scroll); });
  else window.addEventListener('scroll', function () { onScroll(window.scrollY); }, { passive: true });
  onScroll(window.scrollY);

  /* ----------------------------------------------------------------------
     3. Mobile drawer
     ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     4. Projects mega menu: city / property type / snapshot
     ---------------------------------------------------------------------- */
  (function () {
    var cityEl = $('#snapCities'), typeEl = $('#snapTypes'), listEl = $('#snapList');
    if (!cityEl || !typeEl || !listEl) return;

    var titleEl = $('#snapTitle'), allEl = $('#snapAll');

    var CITIES = [
      { name: 'All cities',    count: 0  },
      { name: 'Noida',         count: 68 },
      { name: 'Gurugram',      count: 54 },
      { name: 'Greater Noida', count: 31 },
      { name: 'Mumbai',        count: 22 },
      { name: 'Bengaluru',     count: 19 },
      { name: 'Pune',          count: 14 },
      { name: 'Ghaziabad',     count: 9  },
      { name: 'Lucknow',       count: 6  }
    ];

    var TYPES = [
      { key: 'all',         label: 'All types'   },
      { key: 'residential', label: 'Residential' },
      { key: 'commercial',  label: 'Commercial'  },
      { key: 'plots',       label: 'Plots'       }
    ];

    var IMG = {
      villa:  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=240&q=70',
      hill:   'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=240&q=70',
      tower:  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=240&q=70',
      modern: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=240&q=70',
      block:  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=240&q=70',
      inter:  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=240&q=70'
    };

    var RS = '₹';

    var PROJECTS = {
      'Noida': [
        { n: 'Marigold Estate',         a: 'Sector 150',      p: RS + '3.15 Cr onwards',  t: 'residential', i: IMG.hill },
        { n: 'Bellevue Heights',        a: 'Sector 143',      p: RS + '1.28 Cr onwards',  t: 'residential', i: IMG.block },
        { n: 'Meridian Corporate Park', a: 'Sector 142',      p: RS + '1.85 Cr per unit', t: 'commercial',  i: IMG.tower },
        { n: 'The Kiln High Street',    a: 'Sector 129',      p: RS + '92 L onwards',     t: 'commercial',  i: IMG.inter },
        { n: 'Riverfront Plots',        a: 'Sector 168',      p: RS + '68 L onwards',     t: 'plots',       i: IMG.modern }
      ],
      'Gurugram': [
        { n: 'The Aravalli Residences', a: 'Golf Course Extn.', p: RS + '6.40 Cr onwards',  t: 'residential', i: IMG.villa },
        { n: 'Sutlej Sky Villas',       a: 'Sector 79',         p: RS + '5.20 Cr onwards',  t: 'residential', i: IMG.modern },
        { n: 'Cyber Greens Offices',    a: 'Golf Course Road',  p: RS + '2.40 Cr per unit', t: 'commercial',  i: IMG.tower }
      ],
      'Greater Noida': [
        { n: 'Orchid County',        a: 'Sector 12',        p: RS + '1.05 Cr onwards', t: 'residential', i: IMG.block },
        { n: 'Knowledge Park Plots', a: 'Knowledge Park V', p: RS + '52 L onwards',    t: 'plots',       i: IMG.hill }
      ],
      'Mumbai': [
        { n: 'Worli Sea Face Tower', a: 'Worli',        p: RS + '11.80 Cr onwards', t: 'residential', i: IMG.tower },
        { n: 'Andheri Work Lofts',   a: 'Andheri East', p: RS + '3.10 Cr per unit', t: 'commercial',  i: IMG.inter }
      ],
      'Bengaluru': [
        { n: 'Whitefield Rise',      a: 'Whitefield',      p: RS + '2.25 Cr onwards',  t: 'residential', i: IMG.modern },
        { n: 'Outer Ring Tech Park', a: 'Outer Ring Road', p: RS + '1.95 Cr per unit', t: 'commercial',  i: IMG.tower }
      ],
      'Pune':      [ { n: 'Kharadi Court',         a: 'Kharadi',        p: RS + '1.42 Cr onwards', t: 'residential', i: IMG.block  } ],
      'Ghaziabad': [ { n: 'Raj Nagar Greens',      a: 'Raj Nagar Extn.',p: RS + '78 L onwards',    t: 'residential', i: IMG.hill   } ],
      'Lucknow':   [ { n: 'Gomti Riverside Plots', a: 'Gomti Nagar',    p: RS + '43 L onwards',    t: 'plots',       i: IMG.modern } ]
    };

    var city = 'Noida', type = 'all';
    var ALL = 'All cities';
    CITIES[0].count = CITIES.slice(1).reduce(function (n, c) { return n + c.count; }, 0);
    var slug = function (s) { return s.toLowerCase().replace(/\s+/g, '-'); };
    var ctaEl = $('#snapCta');

    function render() {
      cityEl.innerHTML = CITIES.map(function (c) {
        return '<button class="snap-city' + (c.name === city ? ' is-active' : '') +
               '" data-city="' + c.name + '">' + c.name + '<span>' + c.count + '</span></button>';
      }).join('');

      typeEl.innerHTML = TYPES.map(function (t) {
        return '<button class="snap-type' + (t.key === type ? ' is-active' : '') +
               '" data-type="' + t.key + '">' + t.label + '</button>';
      }).join('');

      var pool = city === ALL
        ? Object.keys(PROJECTS).reduce(function (a, c) { return a.concat(PROJECTS[c].map(function (p) { return Object.assign({ c: c }, p); })); }, [])
        : (PROJECTS[city] || []).map(function (p) { return Object.assign({ c: city }, p); });
      var rows = pool.filter(function (p) { return type === 'all' || p.t === type; });
      var label = TYPES.filter(function (t) { return t.key === type; })[0].label;

      titleEl.textContent = label + ' in ' + (city === ALL ? 'all cities' : city);
      if (allEl) allEl.hidden = true;

      /* one button that follows the choice: city + property type */
      if (ctaEl) {
        var noun = type === 'all' ? 'projects' : type === 'plots' ? 'plots' : label.toLowerCase() + ' projects';
        ctaEl.querySelector('span').textContent = city === ALL ? 'View all ' + noun : 'View ' + (type === 'all' ? 'all ' : '') + noun + ' in ' + city;
        ctaEl.href = 'city.html' + (city === ALL
          ? (type === 'all' ? '' : '?type=' + type)
          : '?city=' + slug(city) + (type === 'all' ? '' : '&type=' + type));
      }

      listEl.innerHTML = rows.length
        ? rows.map(function (p) {
            return '<a class="snap-item" href="project-details.html">' +
                     '<img src="' + p.i + '" alt="" loading="lazy">' +
                     '<span class="snap-item-b">' +
                       '<strong>' + p.n + '</strong>' +
                       '<em>' + p.a + ', ' + p.c + '</em>' +
                       '<b>' + p.p + '</b>' +
                     '</span>' +
                   '</a>';
          }).join('')
        : '<p class="snap-empty">Nothing live in this combination today. Tell us what you need and we will source it.</p>';

      if (window.gsap && !reduced) {
        gsap.fromTo(listEl.children,
          { autoAlpha: 0, y: 12 },
          { autoAlpha: 1, y: 0, clearProps: 'transform', duration: .38, stagger: .045, ease: 'power2.out', overwrite: true });
        gsap.fromTo(titleEl,
          { autoAlpha: 0, x: -8 },
          { autoAlpha: 1, x: 0, duration: .34, ease: 'power2.out', overwrite: true });
      }
    }

    cityEl.addEventListener('click', function (e) {
      var b = e.target.closest('.snap-city'); if (!b) return;
      city = b.dataset.city; render();
    });
    cityEl.addEventListener('mouseover', function (e) {
      var b = e.target.closest('.snap-city'); if (!b || b.dataset.city === city) return;
      city = b.dataset.city; render();
    });
    typeEl.addEventListener('click', function (e) {
      var b = e.target.closest('.snap-type'); if (!b) return;
      type = b.dataset.type; render();
    });

    render();
  })();

  /* ----------------------------------------------------------------------
     5. New-launch rail — continuous loop, modelled on Swiper's
        { speed: 4000, autoplay: { delay: 0 }, loop: true }: each card takes
        four seconds to glide past and the next glide starts straight away,
        so the rail moves like a slow conveyor rather than stepping.
     ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     6. Featured projects filter
     ---------------------------------------------------------------------- */
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

        if (window.gsap && !reduced) {
          gsap.fromTo(shown,
            { autoAlpha: 0, y: 30 },
            { autoAlpha: 1, y: 0, clearProps: 'transform', duration: .7, stagger: .08, ease: 'power3.out', overwrite: true });
        }
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  })();

  /* ----------------------------------------------------------------------
     7. Testimonials — quote rotates every 6.5s, pausing while hovered
     ---------------------------------------------------------------------- */
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

  /* ----------------------------------------------------------------------
     8. Back to top
     ---------------------------------------------------------------------- */
  if ($('#toTop')) $('#toTop').addEventListener('click', function () { scrollTo(0); });

  /* ----------------------------------------------------------------------
     9. GSAP scenes
     ---------------------------------------------------------------------- */
  if (!window.gsap || reduced) {
    document.documentElement.classList.remove('js-ready');
    return;
  }

  /* homepage hero only */
  if ($('.hero')) {
    /* -- hero: headline, panel and strapline settle in sequence -- */
    gsap.set('.hero-title, .search-card, .hero-ops', { opacity: 0 });

    var heroTl = gsap.timeline({ delay: .2 });

    heroTl.fromTo('.hero-title', { autoAlpha: 0, y: 30 },
                  { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' })
          .fromTo('.search-card', { autoAlpha: 0, y: 30 },
                  { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.42')
          .fromTo('.sc-pill', { autoAlpha: 0, y: 14 },
                  { autoAlpha: 1, y: 0, clearProps: 'transform', duration: .55, stagger: .06, ease: 'power3.out' }, '-=.4')
          .fromTo('.hero-ops', { autoAlpha: 0, y: 30 },
                  { autoAlpha: 1, y: 0, duration: .7, ease: 'power3.out' }, '-=.45');

    /* -- hero parallax -- */
    gsap.to('#heroImg', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
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

  /* -- why-choose-us: cards fan out from the centre card -- */
  if ($('.why5-row')) {
    gsap.fromTo('.why5-row .wc',
      { autoAlpha: 0, y: 46, scale: .94 },
      {
        autoAlpha: 1, y: 0, scale: 1, clearProps: 'transform',
        duration: .85, ease: 'power3.out',
        stagger: { each: .1, from: 'center' },
        scrollTrigger: { trigger: '.why5-row', start: 'top 85%', once: true }
      });
  }

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


/* ##########################################################################
   PROJECT DATA (was projects.js) — the list the city and developer pages are built from.
   Must stay above the inner-page code below, which reads window.IR_DATA.
   ########################################################################## */
/* ==========================================================================
   Intelligent Realtors — project list shared by the city and developer pages.
   Each project: name, locality, city, developer key, type, status, price,
   two spec lines and a photo. Add or edit projects here only.
   ========================================================================== */
(function () {
  'use strict';

  var U = function (id) { return 'https://images.unsplash.com/photo-' + id + '?w=900&q=80'; };
  var IMG = {
    villa:  U('1613490493576-7fde63acd811'),
    hill:   U('1580587771525-78b9dba3b914'),
    white:  U('1600596542815-ffad4c1539a9'),
    tower:  U('1486406146926-c627a92ad1ab'),
    inter:  U('1600566753086-00f18fb6b3ea'),
    modern: U('1512917774080-9991f1c4c750'),
    block:  U('1545324418-cc1a3fa10c00'),
    sky:    U('1514565131-fce0801e5785')
  };

  var CITIES = [
    { key: 'noida',         name: 'Noida' },
    { key: 'gurugram',      name: 'Gurugram' },
    { key: 'greater-noida', name: 'Greater Noida' },
    { key: 'mumbai',        name: 'Mumbai' },
    { key: 'bengaluru',     name: 'Bengaluru' },
    { key: 'pune',          name: 'Pune' },
    { key: 'ghaziabad',     name: 'Ghaziabad' },
    { key: 'lucknow',       name: 'Lucknow' }
  ];

  var DEVELOPERS = [
    { key: 'godrej',   name: 'Godrej Properties', logo: 'assets/images/partners/godrej.svg' },
    { key: 'dlf',      name: 'DLF',               logo: 'assets/images/partners/dlf.svg' },
    { key: 'm3m',      name: 'M3M India',         logo: 'assets/images/partners/m3m.png' },
    { key: 'ace',      name: 'ACE Group',         logo: 'assets/images/partners/ace.webp' },
    { key: 'bhutani',  name: 'Bhutani Infra',     logo: 'assets/images/partners/bhutani.png' },
    { key: 'emaar',    name: 'Emaar',             logo: 'assets/images/partners/emaar.svg' },
    { key: 'tata',     name: 'Tata Housing',      logo: 'assets/images/partners/tata.png' },
    { key: 'prestige', name: 'Prestige Group',    logo: 'assets/images/partners/prestige.svg' }
  ];

  var PROJECTS = [
    /* Noida */
    { n: 'Marigold Estate',         a: 'Sector 150',        c: 'noida',         d: 'ace',      t: 'Residential', s: 'Under construction', p: '₹3.15 Cr', sp: ['3 & 4 BHK', '2,150 – 3,400 sq.ft.'],       i: IMG.hill },
    { n: 'Bellevue Heights',        a: 'Sector 143',        c: 'noida',         d: 'tata',     t: 'Residential', s: 'Ready to move',      p: '₹1.28 Cr', sp: ['2 & 3 BHK', '1,240 – 1,860 sq.ft.'],       i: IMG.block },
    { n: 'Meridian Corporate Park', a: 'Sector 142',        c: 'noida',         d: 'bhutani',  t: 'Commercial',  s: 'New launch',         p: '₹1.85 Cr', sp: ['Office suites', '900 – 4,200 sq.ft.'],     i: IMG.tower },
    { n: 'The Kiln High Street',    a: 'Sector 129',        c: 'noida',         d: 'bhutani',  t: 'Commercial',  s: 'Under construction', p: '₹92 L',    sp: ['Retail & F&B', '300 – 1,600 sq.ft.'],      i: IMG.inter },
    { n: 'Riverfront Plots',        a: 'Sector 168',        c: 'noida',         d: 'ace',      t: 'Plots',       s: 'New launch',         p: '₹68 L',    sp: ['Residential plots', '120 – 300 sq.yd.'],   i: IMG.modern },
    /* Gurugram */
    { n: 'The Aravalli Residences', a: 'Golf Course Extn.', c: 'gurugram',      d: 'godrej',   t: 'Residential', s: 'New launch',         p: '₹6.40 Cr', sp: ['4 & 5 BHK', '3,240 – 4,810 sq.ft.'],       i: IMG.villa },
    { n: 'Sutlej Sky Villas',       a: 'Sector 79',         c: 'gurugram',      d: 'm3m',      t: 'Residential', s: 'New launch',         p: '₹5.20 Cr', sp: ['4 BHK + Study', '3,690 – 4,100 sq.ft.'],   i: IMG.modern },
    { n: 'Cyber Greens Offices',    a: 'Golf Course Road',  c: 'gurugram',      d: 'dlf',      t: 'Commercial',  s: 'Ready to move',      p: '₹2.40 Cr', sp: ['Office floors', '1,200 – 6,000 sq.ft.'],   i: IMG.tower },
    { n: 'The Crest Residences',    a: 'DLF Phase 5',       c: 'gurugram',      d: 'dlf',      t: 'Residential', s: 'Ready to move',      p: '₹8.75 Cr', sp: ['4 BHK', '4,200 – 6,000 sq.ft.'],           i: IMG.white },
    { n: 'Emerald Hills',           a: 'Sector 65',         c: 'gurugram',      d: 'emaar',    t: 'Residential', s: 'Under construction', p: '₹2.95 Cr', sp: ['3 & 4 BHK', '1,950 – 2,850 sq.ft.'],       i: IMG.hill },
    /* Greater Noida */
    { n: 'Orchid County',           a: 'Sector 12',         c: 'greater-noida', d: 'prestige', t: 'Residential', s: 'Under construction', p: '₹1.05 Cr', sp: ['2 & 3 BHK', '1,050 – 1,620 sq.ft.'],       i: IMG.block },
    { n: 'Knowledge Park Plots',    a: 'Knowledge Park V',  c: 'greater-noida', d: 'godrej',   t: 'Plots',       s: 'New launch',         p: '₹52 L',    sp: ['Residential plots', '100 – 250 sq.yd.'],   i: IMG.hill },
    /* Mumbai */
    { n: 'Worli Sea Face Tower',    a: 'Worli',             c: 'mumbai',        d: 'tata',     t: 'Residential', s: 'New launch',         p: '₹11.80 Cr', sp: ['3 & 4 BHK', '2,100 – 3,600 sq.ft.'],      i: IMG.sky },
    { n: 'Andheri Work Lofts',      a: 'Andheri East',      c: 'mumbai',        d: 'godrej',   t: 'Commercial',  s: 'Under construction', p: '₹3.10 Cr', sp: ['Office lofts', '1,100 – 3,200 sq.ft.'],    i: IMG.inter },
    /* Bengaluru */
    { n: 'Whitefield Rise',         a: 'Whitefield',        c: 'bengaluru',     d: 'prestige', t: 'Residential', s: 'Under construction', p: '₹2.25 Cr', sp: ['3 BHK', '1,680 – 2,240 sq.ft.'],           i: IMG.modern },
    { n: 'Outer Ring Tech Park',    a: 'Outer Ring Road',   c: 'bengaluru',     d: 'prestige', t: 'Commercial',  s: 'Ready to move',      p: '₹1.95 Cr', sp: ['Office suites', '1,000 – 5,500 sq.ft.'],   i: IMG.tower },
    /* Pune, Ghaziabad, Lucknow */
    { n: 'Kharadi Court',           a: 'Kharadi',           c: 'pune',          d: 'godrej',   t: 'Residential', s: 'Under construction', p: '₹1.42 Cr', sp: ['2 & 3 BHK', '1,020 – 1,540 sq.ft.'],       i: IMG.block },
    { n: 'Raj Nagar Greens',        a: 'Raj Nagar Extn.',   c: 'ghaziabad',     d: 'm3m',      t: 'Residential', s: 'Ready to move',      p: '₹78 L',    sp: ['2 & 3 BHK', '980 – 1,450 sq.ft.'],         i: IMG.hill },
    { n: 'Gomti Riverside Plots',   a: 'Gomti Nagar',       c: 'lucknow',       d: 'emaar',    t: 'Plots',       s: 'New launch',         p: '₹43 L',    sp: ['Residential plots', '100 – 200 sq.yd.'],   i: IMG.modern }
  ];

  window.IR_DATA = { cities: CITIES, developers: DEVELOPERS, projects: PROJECTS };
})();


/* ##########################################################################
   INNER-PAGE FEATURES (was pages.js) — FAQ, forms, careers, project tabs, gallery,
   enquiry modal and the city/developer listings. Each block does nothing if
   its markup is not on the page.
   ########################################################################## */
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
