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
