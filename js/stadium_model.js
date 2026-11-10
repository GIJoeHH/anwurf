// ANWURF! – Gemeinsames Hallen-Daten- und Geometriemodell
// Eine einzige Quelle für Hallenplan (Draufsicht), Hallenansicht (3D außen/innen/Vorschau), Zentrale und Vereinsstadt.
// Das Modell wird bei jedem Aufruf aus dem gespeicherten Zustand abgeleitet (club.stadium + club.fac) und nie
// selbst gespeichert. Dadurch ändert jede Baumaßnahme genau einen Zustand, und alle Ansichten stimmen überein.
// Reine Logik ohne DOM/WebGL – läuft auch headless in jsc (Tests).
//
// Koordinaten in Metern, Draufsicht: x nach Osten, y nach Süden, Mittelpunkt = Anwurfpunkt.
// Spielfeld 40 × 20 m. Nord = Haupttribüne (N1–N3), Süd = Gegengerade (S1–S3), West/Ost = hinter den Toren (W1/W2, E1/E2),
// Ecken NW/NE/SW/SE. Alles steht unter einem Hallendach; die Hallenhülle (Wände, Dach, Foyer) wächst mit den Tribünen.
(function (R) {
  var D = R.data, SP = R.stadium;
  var SM = R.stadiumModel = {};

  // ---------- Grundmaße ----------
  var G = SM.GEO = {
    pitchL: 40, pitchW: 20,
    Lx: 21, Iy: 13.5,  // Längsseiten: halbe Länge, Abstand Vorderkante zur Mittellinie (3,5 m Seitenraum für Bänke/Kampfgericht)
    Ly: 10.5, Ix: 24.5, // hinter den Toren: halbe Breite, Abstand Vorderkante (4,5 m Auslauf)
    TD: [7, 6, 6, 6, 6], // Tiefe je Rang (kompakt und steil wie in einer Handballhalle)
    rake: 0.6, band: 2.8, base: 0.9, // Neigung, Logen-/Umlaufband zwischen Rängen, Höhe Vorderkante
    arcSeg: 8, roofOver: 0, roofGap: 4.5,
    wallGap: 2.5, minHx: 28, minHy: 18, foyer: 7 // Hallenhülle: Abstand zu den Tribünen, Mindestmaß, Foyertiefe (Süden)
  };
  G.CD = [0]; for (var ci = 0; ci < G.TD.length; ci++) G.CD.push(G.CD[ci] + G.TD[ci]);
  G.HIN = [G.base];
  for (var i = 1; i < G.TD.length; i++) G.HIN[i] = G.HIN[i - 1] + G.TD[i - 1] * G.rake + G.band;
  SM.AREAS = ['N', 'S', 'W', 'E', 'NW', 'NE', 'SW', 'SE'];
  SM.CORNERS = ['NW', 'NE', 'SW', 'SE'];
  SM.AREA_NAMES = { N: 'Nordtribüne', S: 'Südtribüne', W: 'Westtribüne', E: 'Osttribüne', NW: 'Ecke Nordwest', NE: 'Ecke Nordost', SW: 'Ecke Südwest', SE: 'Ecke Südost' };
  SM.AREA_SUB = { N: 'Haupttribüne', S: 'Gegengerade', W: 'Fanblock West', E: 'Fanblock Ost' };
  SM.CORNER_SIGN = { NW: [-1, -1], NE: [1, -1], SW: [-1, 1], SE: [1, 1] };
  SM.CORNER_SIDES = { NW: ['N', 'W'], NE: ['N', 'E'], SW: ['S', 'W'], SE: ['S', 'E'] };
  SM.TYPE_COL = { steh: '#7c8594', sitz: '#2f6fd6', business: '#119b8c', loge: '#d4a017' };
  // Sechs Hallenstufen, abgeleitet aus der Kapazität (Beispielwerte: 300 / 900 / 2.000 / 4.500 / 8.500 / 14.000 Plätze)
  SM.STAGES = { 1: 'Sporthalle', 2: 'Vereinshalle', 3: 'Handballzentrum', 4: 'Profi-Arena', 5: 'Großarena', 6: 'Multifunktionsarena' };
  SM.STAGE_CAP = [0, 600, 1400, 3200, 6500, 11000]; // ab dieser Kapazität gilt Stufe 1 … 6
  SM.stageOf = function (cap) { var s = 1; for (var i = 1; i < SM.STAGE_CAP.length; i++) if (cap >= SM.STAGE_CAP[i]) s = i + 1; return s; };

  function r1(v) { return Math.round(v * 100) / 100; }
  function lvOf(club, k, fac) { var f = D.facilities[k]; var v = fac && fac[k] != null ? fac[k] : club.fac && club.fac[k] != null ? club.fac[k] : (f.min || 0); return v; }
  function hex(c, d) { return /^#[0-9a-f]{6}$/i.test(c || '') ? c : (/^#[0-9a-f]{3}$/i.test(c || '') ? '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3] : d); }

  // ---------- Polylinien je Sektor und Tiefe ----------
  // Vorder-/Hinterkante eines Sektors bei Tiefe d (0 = Vorderkante Unterrang). Gleiche Punktzahl für innen/außen.
  SM.edge = function (id, d) {
    var s = SP.sec(id), k, a, b, out = [], n;
    if (s.side === 'N' || s.side === 'S') {
      k = +id.charAt(1) - 1; a = -G.Lx + k * (2 * G.Lx / 3); b = a + 2 * G.Lx / 3;
      var y = (s.side === 'N' ? -1 : 1) * (G.Iy + d);
      return [[r1(a), r1(y)], [r1(b), r1(y)]];
    }
    if (s.side === 'W' || s.side === 'E') {
      k = +id.charAt(1) - 1; a = -G.Ly + k * G.Ly; b = a + G.Ly;
      var x = (s.side === 'W' ? -1 : 1) * (G.Ix + d);
      return [[r1(x), r1(a)], [r1(x), r1(b)]];
    }
    // Ecke: Viertel-Ellipse um (±Lx, ±Ly); t=0 trifft exakt die Stirnkante der Längsseite, t=1 die der Hintertorseite
    var sg = SM.CORNER_SIGN[id], rx = (G.Ix - G.Lx) + d, ry = (G.Iy - G.Ly) + d; n = G.arcSeg;
    for (var j = 0; j <= n; j++) {
      var ph = j / n * Math.PI / 2;
      out.push([r1(sg[0] * G.Lx + sg[0] * rx * Math.sin(ph)), r1(sg[1] * G.Ly + sg[1] * ry * Math.cos(ph))]);
    }
    return out;
  };
  function poly(inner, outer) { return inner.concat(outer.slice().reverse()); }
  function centroid(pts) { var x = 0, y = 0; pts.forEach(function (p) { x += p[0]; y += p[1]; }); return [r1(x / pts.length), r1(y / pts.length)]; }
  SM.centroid = centroid;

  // ---------- Modell ----------
  // o.plan: anderer Plan (Vorschau), o.fac: andere Ausbaustufen, o.attendance: Auslastung 0..1
  SM.build = function (club, o) {
    o = o || {};
    var plan = o.plan || SP.ensure(club);
    var lv = function (k) { return lvOf(club, k, o.fac); };
    var m = {
      club: club.id, name: club.stadiumName || 'Stadion',
      colors: [hex(club.colors && club.colors[0], '#1d4ed8'), hex(club.colors && club.colors[1], '#ffffff')],
      sectors: {}, areas: {}, corners: {}, roof: {}, capacity: 0, capacityFull: 0, jobs: (plan.jobs || []).slice(),
      levels: { dach: lv('dach'), licht: lv('licht'), video: lv('video'), hosp: lv('hosp'), technik: lv('technik'), sanitaer: lv('sanitaer'), rasen: lv('rasen') }
    };
    var jobsBySec = {}; m.jobs.forEach(function (j) { jobsBySec[j.sec] = j; });
    SP.SECTORS.forEach(function (s) {
      var tiers = plan.sectors[s.id].tiers, job = jobsBySec[s.id] || null, live = SP.secCap(plan, s.id, { live: true }), full = SP.secCap(plan, s.id, { live: false });
      var sec = { id: s.id, side: s.side, kind: s.kind, area: s.side === 'C' ? s.id : s.side, name: s.n, tiers: [], cap: live.total, capFull: full.total, parts: live, job: job, depth: 0, top: 0, vip: live.business + live.loge };
      tiers.forEach(function (t, ti) {
        var d0 = G.CD[ti], d1 = d0 + G.TD[ti] * t.size, hIn = G.HIN[ti], hOut = r1(hIn + (d1 - d0) * G.rake);
        sec.tiers.push({ i: ti, type: t.type, size: t.size, cap: SP.tierCap(s, ti, t.type, t.size), d0: d0, d1: r1(d1), hIn: hIn, hOut: hOut,
          inner: SM.edge(s.id, d0), outer: SM.edge(s.id, d1), busy: !!(job && job.tier === ti && job.action !== 'new') });
        sec.depth = r1(d1); sec.top = Math.max(sec.top, hOut);
      });
      sec.slot = { inner: SM.edge(s.id, 0), outer: SM.edge(s.id, G.TD[0]) }; // Bauplatz Unterrang (Klickfläche im Plan)
      sec.footprint = sec.tiers.length ? poly(sec.tiers[0].inner, sec.tiers[sec.tiers.length - 1].outer) : poly(sec.slot.inner, sec.slot.outer);
      sec.center = centroid(sec.footprint);
      m.sectors[s.id] = sec; m.capacity += sec.cap; m.capacityFull += sec.capFull;
    });
    // Bereiche (Seiten + Ecken)
    SM.AREAS.forEach(function (a) {
      var secs = SP.SECTORS.filter(function (s) { return (s.side === 'C' ? s.id : s.side) === a; }).map(function (s) { return m.sectors[s.id]; });
      var built = secs.filter(function (x) { return x.tiers.length; });
      m.areas[a] = { id: a, name: SM.AREA_NAMES[a], sectors: secs.map(function (x) { return x.id; }), built: built.length, tiers: Math.max.apply(null, [0].concat(secs.map(function (x) { return x.tiers.length; }))),
        cap: secs.reduce(function (n, x) { return n + x.cap; }, 0), depth: Math.max.apply(null, [0].concat(secs.map(function (x) { return x.depth; }))), top: Math.max.apply(null, [0].concat(secs.map(function (x) { return x.top; }))),
        vip: secs.reduce(function (n, x) { return n + x.vip; }, 0) };
    });
    // Ecken: eindeutiger Zustand – geschlossen genau dann, wenn in der Ecke mindestens ein Rang steht
    SM.CORNERS.forEach(function (c) { m.corners[c] = { id: c, state: m.sectors[c].tiers.length ? 'closed' : 'open', tiers: m.sectors[c].tiers.length }; });
    m.closedCorners = SM.CORNERS.filter(function (c) { return m.corners[c].state === 'closed'; }).length;
    // Hallendach: In einer Halle steht jede Tribüne unter dem Dach. „Klima & Lüftung“ (fac.dach) bestimmt nur die Haustechnik.
    var dl = m.levels.dach;
    SM.AREAS.forEach(function (a) { m.roof[a] = !!m.areas[a].built; });
    SP.SECTORS.forEach(function (s) { var x = m.sectors[s.id]; x.roof = !!x.tiers.length; });
    var tierTop = 0; SP.SECTORS.forEach(function (s) { tierTop = Math.max(tierTop, m.sectors[s.id].top); });
    m.roofH = r1(Math.max(8, tierTop + G.roofGap));
    // Gästeblock
    var gs = m.sectors[plan.guest] || null;
    m.guest = { sector: plan.guest, area: gs ? gs.area : null, center: gs ? gs.center : [0, 0], cap: gs ? gs.cap : 0 };
    if (gs) gs.guest = true;
    SP.guestIds(plan).forEach(function (id) { if (m.sectors[id]) m.sectors[id].guest = true; }); // weitere Gästeblöcke
    // Hallenstufe 1–6 (bestimmt Fassade, Foyer, Materialien, Details)
    m.stage = SM.stageOf(m.capacityFull);
    m.facade = { 1: 'sheet', 2: 'clad', 3: 'dark', 4: 'glass', 5: 'glass', 6: 'glass' }[m.stage];
    m.flood = { level: m.levels.licht, kind: 'hall', led: m.levels.licht >= 2 };
    m.video = { level: m.levels.video, screens: m.levels.video >= 1 ? 1 : 0, cube: m.levels.video >= 2 };
    m.led = m.levels.technik >= 1 || m.levels.video >= 1;
    m.vip = SM.AREAS.reduce(function (n, a) { return n + m.areas[a].vip; }, 0);
    m.hospitality = m.levels.hosp;
    m.attendance = o.attendance != null ? o.attendance : (club.avgAttendance && m.capacity ? Math.min(1, club.avgAttendance / m.capacity) : 0.85);
    m.hall = SM.hallBox(m);
    m.extent = SM.extent(m);
    m.parts = SM.parts(m);
    return m;
  };

  // Äußere Ausdehnung der Tribünen (ohne Hülle)
  SM.standsExtent = function (m) {
    var x = G.Ix + 1, y = G.Iy + 1;
    SM.AREAS.forEach(function (a) { var d = m.areas[a].depth; if (a === 'W' || a === 'E') x = Math.max(x, G.Ix + d); else if (a === 'N' || a === 'S') y = Math.max(y, G.Iy + d); else { x = Math.max(x, G.Lx + (G.Ix - G.Lx) + d); y = Math.max(y, G.Ly + (G.Iy - G.Ly) + d); } });
    return { x: r1(x), y: r1(y) };
  };
  // Hallenhülle: Rechteck um die Tribünen (ab Großarena mit abgeschrägten Ecken), Foyer im Süden, Technikanbau im Norden
  SM.hallBox = function (m) {
    var se = SM.standsExtent(m), hx = r1(Math.max(se.x + G.wallGap, G.minHx)), hy = r1(Math.max(se.y + G.wallGap, G.minHy));
    var fd = m.stage >= 2 ? G.foyer + (m.stage >= 5 ? 3 : 0) : 3;
    return { x: hx, y: hy, h: m.roofH, chamfer: m.stage >= 5 ? r1(Math.min(hx, hy) * 0.28) : 0, foyer: fd, foyerH: m.stage >= 4 ? 9 : m.stage >= 2 ? 6 : 4,
      annex: { w: Math.min(30, hx), d: 8, h: 6 }, stage: m.stage, facade: m.facade };
  };
  SM.extent = function (m) {
    var h = m.hall || SM.hallBox(m);
    return { x: r1(h.x + 1), y: r1(Math.max(h.y + h.annex.d, h.y + h.foyer) + 1) };
  };
  // Umriss der Hallenhülle als Polygon (Draufsicht)
  SM.hallOutline = function (h) {
    var x = h.x, y = h.y, c = h.chamfer;
    return c ? [[-x + c, -y], [x - c, -y], [x, -y + c], [x, y - c], [x - c, y], [-x + c, y], [-x, y - c], [-x, -y + c]] : [[-x, -y], [x, -y], [x, y], [-x, y]];
  };

  // ---------- Bauteilliste (einzige Geometriequelle für alle 3D-Ansichten) ----------
  SM.parts = function (m) {
    var P = [];
    SP.SECTORS.forEach(function (s) {
      var x = m.sectors[s.id];
      x.tiers.forEach(function (t, ti) {
        P.push({ kind: 'tier', sec: x.id, area: x.area, tier: ti, type: t.type, inner: t.inner, outer: t.outer, hIn: t.hIn, hOut: t.hOut, guest: !!x.guest, busy: t.busy });
        // Band zwischen den Rängen: Umlauf bzw. Logenreihe (Glas bei VIP/Hospitality)
        if (ti > 0) {
          var prev = x.tiers[ti - 1], glass = t.type === 'loge' || t.type === 'business' || prev.type === 'loge' || prev.type === 'business' || m.hospitality >= 2 || m.stage === 'modern';
          P.push({ kind: 'fascia', sec: x.id, area: x.area, tier: ti, line: t.inner, hBot: prev.hOut, hTop: t.hIn, vip: glass });
        }
      });
      if (x.tiers.length) {
        var last = x.tiers[x.tiers.length - 1];
        P.push({ kind: 'back', sec: x.id, area: x.area, line: last.outer, h: r1(last.hOut + 1.1), style: 'inner', vipTop: last.type === 'loge' || last.type === 'business' });
      }
      if (x.job) {
        var jt = x.job.action === 'new' ? x.job.tier : x.job.tier, d0 = G.CD[jt] || 0, d1 = d0 + (G.TD[jt] || 10), hIn = G.HIN[jt] || 1;
        P.push({ kind: 'site', sec: x.id, area: x.area, tier: jt, action: x.job.action, inner: SM.edge(x.id, d0), outer: SM.edge(x.id, d1), hIn: hIn, hOut: r1(hIn + (d1 - d0) * G.rake) });
      }
    });
    // Hallenhülle (Wände, Dach, Foyer, Technikanbau) – eine Quelle für Außenansicht, Innenansicht und Vereinsstadt
    var hb = m.hall;
    P.push({ kind: 'hall', x: hb.x, y: hb.y, h: hb.h, chamfer: hb.chamfer, foyer: hb.foyer, foyerH: hb.foyerH, annex: hb.annex, stage: hb.stage, facade: hb.facade, outline: SM.hallOutline(hb), hvac: m.levels.dach, name: m.name });
    // Dachtragwerk und Hallenlicht (Fachwerkträger quer über die Halle)
    var span = [], n = Math.max(3, Math.round(2 * hb.x / 7));
    for (var i2 = 1; i2 < n; i2++) span.push(r1(-hb.x + i2 * 2 * hb.x / n));
    P.push({ kind: 'trusses', xs: span, y: hb.y, h: hb.h, light: m.levels.licht, led: m.flood.led });
    // Anzeige: Anzeigetafel an der Westwand, elektronische Tafel bzw. Videowürfel unter dem Hallendach
    if (m.video.cube) P.push({ kind: 'screen', area: 'C', cube: true, x: 0, y: 0, z: r1(hb.h - 7.5), w: 6, hgt: 3.6, rot: 0, live: true });
    else { var dW = m.areas.W.depth, topW = m.areas.W.top; P.push({ kind: 'screen', area: 'W', cube: false, x: -r1(Math.min(hb.x - 0.6, G.Ix + dW + 0.6)), y: 0, z: r1(Math.max(3, topW + 1.2)), w: m.video.screens ? 8 : 4, hgt: m.video.screens ? 3.4 : 1.8, rot: -1, live: m.video.screens > 0 }); }
    // Werbebanden (hinter den Toren und an der Gegengerade), Bänke und Kampfgericht an der Nordseite
    P.push({ kind: 'boards', x: G.pitchL / 2 + 2.4, y: G.pitchW / 2 + 1.8, h: 0.9, led: m.led });
    P.push({ kind: 'bench', y: -(G.pitchW / 2 + 1.6) });
    P.push({ kind: 'pitch', l: G.pitchL, w: G.pitchW, quality: m.levels.rasen });
    return P;
  };

  // ---------- Ausbauvorschau ----------
  function clonePlan(p) { return JSON.parse(JSON.stringify(p)); }
  SM.previewPlan = function (club, secId, opt) {
    var p = clonePlan(SP.ensure(club));
    if (opt) { SP.applyJob(p, { sec: secId, tier: opt.tier, action: opt.action, type: opt.type }); p.jobs = p.jobs.filter(function (j) { return j.sec !== secId; }); }
    return p;
  };
  // Plan mit allen laufenden Bauvorhaben fertiggestellt
  SM.finishedPlan = function (club) { var p = clonePlan(SP.ensure(club)); p.jobs.forEach(function (j) { SP.applyJob(p, j); }); p.jobs = []; return p; };
  SM.withPlan = function (club, plan) { var c = Object.create(club); c.stadium = plan; return c; };
  // Kennzahlen einer Maßnahme: Plätze, Kosten, Bauzeit, Attraktivität vorher/nachher, Modell danach
  SM.impact = function (st, club, secId, idx) {
    var opt = SP.options(st, club, secId)[idx]; if (!opt) return null;
    var after = SM.previewPlan(club, secId, opt), c2 = SM.withPlan(club, after), E = R.econ;
    return { opt: opt, capBefore: E.capacity(club), capAfter: E.capacity(c2), attBefore: E.attractiveness(club), attAfter: E.attractiveness(c2), plan: after,
      tiersBefore: club.stadium.sectors[secId].tiers.length, tiersAfter: after.sectors[secId].tiers.length };
  };

  // ---------- Kurzwerte für Panels/Callouts ----------
  SM.facLevel = function (club, k) { var f = D.facilities[k]; return { l: lvOf(club, k), max: f.levels.length - 1, n: f.levels[lvOf(club, k)] ? f.levels[lvOf(club, k)].n : '' }; };
  SM.summary = function (m) {
    var rows = [];
    ['N', 'S', 'E', 'W'].forEach(function (a) { var A = m.areas[a]; rows.push({ id: a, n: SM.AREA_NAMES[a], l: A.tiers, max: 5, txt: A.tiers ? A.tiers + (A.tiers === 1 ? ' Rang' : ' Ränge') + ' · ' + R.fmtNum(A.cap) : 'nicht gebaut' }); });
    rows.push({ id: 'C', n: 'Ecken', l: m.closedCorners, max: 4, txt: m.closedCorners === 4 ? 'geschlossen' : m.closedCorners + '/4 geschlossen' });
    var fl = function (k) { var f = D.facilities[k]; return f.levels.length - 1; };
    rows.push({ id: 'rasen', n: 'Hallenboden', l: m.levels.rasen, max: fl('rasen'), txt: D.facilities.rasen.levels[m.levels.rasen].n });
    rows.push({ id: 'licht', n: 'Hallenlicht & Show', l: m.levels.licht, max: fl('licht'), txt: 'Stufe ' + m.levels.licht + '/' + fl('licht') });
    rows.push({ id: 'video', n: m.video.cube ? 'Videowürfel' : 'Anzeigetafel', l: m.levels.video, max: fl('video'), txt: 'Stufe ' + m.levels.video + '/' + fl('video') });
    rows.push({ id: 'dach', n: 'Klima & Lüftung', l: m.levels.dach, max: fl('dach'), txt: 'Stufe ' + m.levels.dach + '/' + fl('dach') });
    rows.push({ id: 'vip', n: 'VIP & Hospitality', l: m.levels.hosp, max: fl('hosp'), txt: R.fmtNum(m.vip) + ' VIP · Stufe ' + m.levels.hosp + '/' + fl('hosp') });
    return rows;
  };

  // ---------- Vereinscampus: feste Bauplätze (bleiben über alle Stufen gleich) ----------
  // x/y = Mittelpunkt, w/d = Grundfläche in Metern, rot = Ausrichtung (Grad, Fassade zum Stadion)
  SM.CITY_SLOTS = {
    geschaeft: { x: 130, y: -205, w: 70, d: 48, rot: 0 },
    training: { x: -40, y: -218, w: 180, d: 110, rot: 0 },
    jugend: { x: -265, y: -215, w: 150, d: 120, rot: 0 },
    gewerbe: { x: 270, y: -210, w: 120, d: 100, rot: 0 },
    solar: { x: 285, y: -50, w: 110, d: 110, rot: 0 },
    hotel: { x: 255, y: 75, w: 70, d: 46, rot: 0 },
    eventhalle: { x: 185, y: 220, w: 120, d: 80, rot: 0 },
    museum: { x: 45, y: 215, w: 80, d: 54, rot: 0 },
    medizin: { x: -85, y: 215, w: 70, d: 50, rot: 0 },
    parken: { x: -255, y: 215, w: 130, d: 100, rot: 0 },
    oepnv: { x: -265, y: 10, w: 80, d: 150, rot: 0 },
    erlebnis: { x: 40, y: 118, w: 64, d: 30, rot: 0 },
    restaurant: { x: -122, y: 108, w: 38, d: 30, rot: 0 },
    fanshop: { x: -132, y: 30, w: 34, d: 46, rot: 90 },
    cafe: { x: -132, y: -62, w: 28, d: 24, rot: 0 },
    strasse: { x: 0, y: 312, w: 900, d: 24, rot: 0 }
  };
  SM.CITY_ROAD = { x: 168, y: 140, w: 14 }; // Stadionring (halbe Breite/Höhe der Mittellinie), Fahrbahnbreite
  SM.city = function (club, o) {
    var out = [];
    Object.keys(SM.CITY_SLOTS).forEach(function (k) {
      var s = SM.CITY_SLOTS[k], f = D.facilities[k], l = lvOf(club, k, o && o.fac);
      out.push({ key: k, name: f.name, x: s.x, y: s.y, w: s.w, d: s.d, rot: s.rot, level: l, min: f.min || 0, max: f.levels.length - 1, ln: f.levels[l] ? f.levels[l].n : '—' });
    });
    return out;
  };
  // Vereinsstadt = dasselbe Hallenmodell + Campus; die Halle steht im Ursprung, nur die Kamera ist weiter weg
  SM.cityScene = function (club, o) { var m = SM.build(club, o); return { stadium: m, parts: m.parts, buildings: SM.city(club, o), road: SM.CITY_ROAD }; };

  // ---------- Ausbauplan als SVG (Draufsicht, direkt in Weltkoordinaten) ----------
  function pts(a) { return a.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); }
  function lerpLine(a, b, f) { return a.map(function (p, i) { return [r1(p[0] + (b[i][0] - p[0]) * f), r1(p[1] + (b[i][1] - p[1]) * f)]; }); }
  function fmtN(n) { return R.fmtNum ? R.fmtNum(n) : String(n); }
  // Handballfeld-Markierungen als SVG-Pfade (Weltkoordinaten, Meter): Torraum 6 m, Freiwurflinie 9 m (gestrichelt),
  // 7-m-Linie, Torwartgrenze 4 m, Mittellinie, Anwurfkreis, Auswechsellinien. Gleiche Maße wie die 3D-Bodentextur.
  SM.courtGeo = function () {
    var L = G.pitchL / 2, Wd = G.pitchW / 2;
    function zone(sx, r) { // Viertelkreise um die Torpfosten (±1,5 m) + Gerade, an der Seitenlinie abgeschnitten
      var x0 = sx * L, pts = [], a, py, n = 18;
      for (var i = 0; i <= n; i++) { a = (i / n) * Math.PI / 2; py = -1.5 - r * Math.sin(a); pts.push([x0 - sx * r * Math.cos(a), py]); }
      pts.reverse();
      for (i = 0; i <= n; i++) { a = (i / n) * Math.PI / 2; py = 1.5 + r * Math.sin(a); pts.push([x0 - sx * r * Math.cos(a), py]); }
      return pts.filter(function (q) { return Math.abs(q[1]) <= Wd + 1e-6 && (sx < 0 ? q[0] >= -L : q[0] <= L); }).map(function (q) { return [r1(q[0]), r1(q[1])]; });
    }
    return { L: L, W: Wd, z6: [zone(-1, 6), zone(1, 6)], z9: [zone(-1, 9), zone(1, 9)] };
  };
  SM.courtSVG = function (col, sw) {
    var c = SM.courtGeo(), L = c.L, Wd = c.W, s = '', st = 'stroke="' + (col || '#f1f5f9') + '" stroke-width="' + (sw || 0.16) + '" fill="none"';
    function path(a) { return 'M' + a.map(function (q) { return q[0] + ',' + q[1]; }).join(' L'); }
    s += '<rect x="' + (-L) + '" y="' + (-Wd) + '" width="' + 2 * L + '" height="' + 2 * Wd + '" ' + st + '/>';
    s += '<line x1="0" y1="' + (-Wd) + '" x2="0" y2="' + Wd + '" ' + st + '/><circle r="2" ' + st + '/>';
    [-1, 1].forEach(function (sx, i) {
      s += '<path d="' + path(c.z6[i]) + ' L' + (sx * L) + ',' + c.z6[i][c.z6[i].length - 1][1] + ' L' + (sx * L) + ',' + c.z6[i][0][1] + ' Z" fill="rgba(15,40,110,.55)" stroke="none"/>';
      s += '<path d="' + path(c.z6[i]) + '" ' + st + '/><path d="' + path(c.z9[i]) + '" ' + st + ' stroke-dasharray="0.6 0.5"/>';
      s += '<line x1="' + sx * (L - 7) + '" y1="-0.5" x2="' + sx * (L - 7) + '" y2="0.5" ' + st + '/><line x1="' + sx * (L - 4) + '" y1="-0.075" x2="' + sx * (L - 4) + '" y2="0.075" ' + st + '/>';
      s += '<line x1="' + sx * 4.5 + '" y1="' + (-Wd - 0.15) + '" x2="' + sx * 4.5 + '" y2="' + (-Wd + 0.15) + '" ' + st + '/>';
      s += '<rect x="' + (sx < 0 ? -L - 1 : L) + '" y="-1.5" width="1" height="3" fill="#f8fafc" stroke="#ef4444" stroke-width=".2"/>';
    });
    return s;
  };
  SM.FLOOR_COL = [['#8fa08a', '#7d9282'], ['#9fb3c8', '#7f97b0'], ['#d6a466', '#c58f50'], ['#2f7de0', '#1d3f86'], ['#101b33', '#0a1224']]; // Spielfeld / Umgebung je Hallenboden
  SM.planSVG = function (m, o) {
    o = o || {};
    var sel = o.sel, hi = o.highlight || [], ex = m.extent, hb = m.hall, W = Math.max(ex.x + 4, 40), H = Math.max(ex.y + 4, 30);
    var s = '<svg class="splan2" viewBox="' + (-W) + ' ' + (-H) + ' ' + 2 * W + ' ' + 2 * H + '" xmlns="http://www.w3.org/2000/svg" data-stage="' + m.stage + '">';
    s += '<defs><pattern id="spHatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="3" fill="rgba(245,179,1,.18)"/><line x1="0" y1="0" x2="0" y2="3" stroke="#f5b301" stroke-width="1"/></pattern>' +
      '<radialGradient id="spBg" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#1b2b45"/><stop offset="1" stop-color="#0b1424"/></radialGradient>' +
      '<filter id="spGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>';
    s += '<rect x="' + (-W) + '" y="' + (-H) + '" width="' + 2 * W + '" height="' + 2 * H + '" fill="url(#spBg)"/>';
    // Hallenhülle mit Foyer (Süden) und Technikanbau (Norden)
    var hp = pts(SM.hallOutline(hb));
    s += '<rect x="' + (-hb.annex.w) + '" y="' + (-hb.y - hb.annex.d) + '" width="' + 2 * hb.annex.w + '" height="' + hb.annex.d + '" rx="1" fill="#16233a" stroke="#2a3b59" stroke-width=".4" class="hall-annex"/>';
    s += '<rect x="' + (-hb.x * 0.62) + '" y="' + hb.y + '" width="' + hb.x * 1.24 + '" height="' + hb.foyer + '" rx="1" fill="rgba(125,211,252,.13)" stroke="#7dd3fc" stroke-width=".4" class="hall-foyer"/>';
    s += '<text x="0" y="' + r1(hb.y + hb.foyer / 2 + 1) + '" text-anchor="middle" font-size="2.6" font-weight="800" fill="#bae6fd" letter-spacing=".5">FOYER · EINGANG</text>';
    s += '<polygon class="hall-outline" points="' + hp + '" fill="#18263d" stroke="#64748b" stroke-width=".7"/>';
    // Innenraum (Hallenboden) + Handballfeld 40 × 20 m
    var fc = SM.FLOOR_COL[Math.min(SM.FLOOR_COL.length - 1, m.levels.rasen)];
    s += '<rect x="' + (-G.Ix) + '" y="' + (-G.Iy) + '" width="' + 2 * G.Ix + '" height="' + 2 * G.Iy + '" rx="1.5" fill="' + fc[1] + '"/>';
    s += '<rect x="-20" y="-10" width="40" height="20" fill="' + fc[0] + '"/>' + SM.courtSVG(m.levels.rasen >= 4 ? '#7dd3fc' : '#f8fafc', 0.16);
    // Banden (hinter den Toren, Gegengerade) und Bänke
    var bd = m.parts.filter(function (p) { return p.kind === 'boards'; })[0];
    if (bd) s += '<path d="M' + (-bd.x) + ',' + (-bd.y + 4) + ' V' + bd.y + ' H' + bd.x + ' V' + (-bd.y + 4) + '" fill="none" stroke="' + (bd.led ? '#38bdf8' : '#94a3b8') + '" stroke-width=".3" stroke-dasharray="' + (bd.led ? '0' : '1 .5') + '" opacity=".85"/>';
    s += '<rect x="-12" y="' + r1(-G.pitchW / 2 - 2.1) + '" width="7" height="1" fill="#475569"/><rect x="5" y="' + r1(-G.pitchW / 2 - 2.1) + '" width="7" height="1" fill="#475569"/><rect x="-1.5" y="' + r1(-G.pitchW / 2 - 2.3) + '" width="3" height="1.2" fill="#e2e8f0"/>';
    // Sektoren
    SP.SECTORS.forEach(function (sd) {
      var x = m.sectors[sd.id], on = sel === sd.id, hl = hi.indexOf(sd.id) >= 0;
      var g = '<g class="splan-sec' + (on ? ' on' : '') + (x.tiers.length ? '' : ' empty') + '" data-act="planSel" data-k="' + x.id + '" data-area="' + x.area + '"' + (x.side === 'C' ? ' data-corner="' + m.corners[x.id].state + '"' : '') + '><title>' + x.name + ' (' + x.id + ')</title>';
      if (!x.tiers.length) g += '<polygon points="' + pts(poly(x.slot.inner, x.slot.outer)) + '" fill="rgba(255,255,255,.035)" stroke="rgba(203,213,225,.35)" stroke-width=".25" stroke-dasharray=".8 .6"/>';
      x.tiers.forEach(function (t) {
        var col = SM.TYPE_COL[t.type], rows = Math.max(3, Math.round((t.d1 - t.d0) / 1.6));
        g += '<polygon class="tier" points="' + pts(poly(t.inner, t.outer)) + '" fill="' + col + '" stroke="#0b1424" stroke-width=".25"' + (t.busy ? ' opacity=".45"' : '') + '/>';
        var rl = ''; for (var r = 1; r < rows; r++) rl += '<polyline points="' + pts(lerpLine(t.inner, t.outer, r / rows)) + '"/>';
        g += '<g fill="none" stroke="rgba(0,0,0,.28)" stroke-width=".1">' + rl + '</g>';
      });
      var site = m.parts.filter(function (p) { return p.kind === 'site' && p.sec === x.id; })[0];
      if (site) g += '<polygon points="' + pts(poly(site.inner, site.outer)) + '" fill="url(#spHatch)" stroke="#f5b301" stroke-width=".3" stroke-dasharray=".8 .5"/>';
      var fp = x.footprint;
      if (on || hl) g += '<polygon points="' + pts(fp) + '" fill="' + (hl ? 'rgba(56,189,248,.18)' : 'rgba(251,191,36,.12)') + '" stroke="' + (hl ? '#38bdf8' : '#fbbf24') + '" stroke-width=".55" filter="url(#spGlow)" pointer-events="none"/>';
      if (x.guest) g += '<polygon class="guest" points="' + pts(fp) + '" fill="none" stroke="#ef4444" stroke-width=".45" data-gx="' + m.guest.center[0] + '" data-gy="' + m.guest.center[1] + '"/>';
      // Beschriftung
      var c = x.center, lab = x.id + (x.guest ? ' · GÄSTE' : x.cap ? ' · ' + fmtN(x.cap) : '') + (x.job ? ' 🚧' : '');
      var fs = x.side === 'C' ? 1.5 : 1.9, wpx = lab.length * fs * 0.56 + 1.6;
      g += '<g class="lbl" pointer-events="none"><rect x="' + r1(c[0] - wpx / 2) + '" y="' + r1(c[1] - fs * 0.85) + '" width="' + r1(wpx) + '" height="' + r1(fs * 1.55) + '" rx="' + r1(fs * 0.5) + '" fill="' + (x.guest ? 'rgba(127,29,29,.88)' : 'rgba(11,20,36,.78)') + '"/>' +
        '<text x="' + c[0] + '" y="' + r1(c[1] + fs * 0.36) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" fill="' + (x.guest ? '#fecaca' : '#fff') + '">' + lab + '</text></g>';
      s += g + '</g>';
    });
    // Anzeigetafel bzw. Videowürfel
    m.parts.forEach(function (p) {
      if (p.kind !== 'screen') return;
      if (p.cube) s += '<rect x="-3" y="-3" width="6" height="6" rx=".6" fill="rgba(56,189,248,.35)" stroke="#38bdf8" stroke-width=".35"><title>Videowürfel unter dem Hallendach</title></rect>';
      else s += '<rect x="' + r1(p.x - 0.5) + '" y="' + r1(p.y - p.w / 2) + '" width="1" height="' + p.w + '" fill="' + (p.live ? '#38bdf8' : '#475569') + '" stroke="#0b1424" stroke-width=".2"><title>' + (p.live ? 'Elektronische Anzeigetafel' : 'Anzeigetafel') + '</title></rect>';
    });
    var fsz = 2.2;
    s += '<text x="0" y="' + r1(-hb.y - hb.annex.d - 1.2) + '" text-anchor="middle" font-size="' + fsz + '" font-weight="800" fill="#9fb0d0" letter-spacing=".5">NORD · HAUPTTRIBÜNE</text>';
    s += '<text x="0" y="' + r1(H - 1.2) + '" text-anchor="middle" font-size="' + fsz + '" font-weight="800" fill="#9fb0d0" letter-spacing=".5">SÜD · GEGENGERADE</text>';
    s += '<text transform="translate(' + r1(-hb.x - 2) + ',0) rotate(-90)" text-anchor="middle" font-size="' + fsz + '" font-weight="800" fill="#9fb0d0" letter-spacing=".5">WEST</text>';
    s += '<text transform="translate(' + r1(hb.x + 2) + ',0) rotate(90)" text-anchor="middle" font-size="' + fsz + '" font-weight="800" fill="#9fb0d0" letter-spacing=".5">OST</text>';
    return s + '</svg>';
  };
})(RFM);
