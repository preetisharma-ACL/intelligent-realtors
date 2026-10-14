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
