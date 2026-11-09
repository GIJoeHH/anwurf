// ANWURF! – Oberfläche Halle & Vereinsstadt auf Basis des gemeinsamen Hallenmodells
// Hallenansicht (Außen/Innen/Ausbauvorschau), interaktiver Hallenplan mit Vorschau, Vereinscampus.
// Alle Bilder kommen aus R.stadiumModel (Geometrie) und R.s3d (3D), alle Texte/Zahlen/Knöpfe sind HTML.
(function (R) {
  var U = R.ui, D = R.data, E = R.econ, SP = R.stadium, SM = R.stadiumModel, S3 = R.s3d, esc = R.esc, money = R.fmtMoney, num = R.fmtNum;

  function stufe(l, max) { var s = ''; for (var i = 0; i < max; i++) s += '<i class="' + (i < l ? 'on' : '') + '"></i>'; return '<span class="lvlbar">' + s + '</span>'; }
  function badge(title, sub, l, max, busy) { return '<b>' + esc(title) + '</b><span>' + esc(sub) + '</span>' + (max ? '<span class="lvl-row">' + stufe(l, max) + (busy ? U.buildMark(typeof busy === 'string' ? busy : 'Im Bau') : '') + '</span>' : busy ? U.buildMark() : ''); }
  // Wird in einem Bereich (N/S/W/E, Ecke) der Halle gebaut?
  function areaBusy(m, a) { return m.jobs.some(function (j) { var s = m.sectors[j.sec]; return s && (s.area === a || (a === 'C' && s.side === 'C')); }); }

  // Callouts in der Halle: Ankerpunkte aus dem Modell
  function stadiumCallouts(m, c) {
    var G = SM.GEO, L = [], A = m.areas;
    function side(a, x, y) { var ar = A[a]; L.push({ x: x, y: y, z: ar.top + 4, html: badge(SM.AREA_NAMES[a], ar.tiers ? ar.tiers + (ar.tiers === 1 ? ' Rang' : ' Ränge') + ' · ' + num(ar.cap) : 'Bauplatz', ar.tiers, 5, areaBusy(m, a)), act: 'planSelArea', k: a }); }
    side('N', 0, -(G.Iy + A.N.depth * 0.5)); side('S', 0, G.Iy + A.S.depth * 0.5); side('W', -(G.Ix + A.W.depth * 0.5), 0); side('E', G.Ix + A.E.depth * 0.5, 0);
    var ne = m.sectors.NE; L.push({ x: ne.center[0], y: ne.center[1], z: (ne.top || 2) + 3, html: badge('Ecken', m.closedCorners === 4 ? 'geschlossen ✓' : m.closedCorners + '/4 geschlossen', m.closedCorners, 4, areaBusy(m, 'C')), act: 'planSelArea', k: 'NE' });
    var fl = function (k) { return D.facilities[k].levels.length - 1; };
    L.push({ x: -m.hall.x * 0.55, y: -m.hall.y * 0.7, z: m.roofH + 3, html: badge('Klima & Lüftung', D.facilities.dach.levels[m.levels.dach].n, m.levels.dach, fl('dach'), U.isBuilding(c, 'dach')), act: 'stadiumPart', k: 'dach' });
    L.push({ x: m.hall.x * 0.45, y: -4, z: m.roofH - 1, html: badge('Hallenlicht & Show', 'Stufe ' + m.levels.licht + '/' + fl('licht'), m.levels.licht, fl('licht'), U.isBuilding(c, 'licht')), act: 'stadiumPart', k: 'licht' });
    L.push({ x: 8, y: 6, z: 1.5, html: badge('Hallenboden', D.facilities.rasen.levels[m.levels.rasen].n, m.levels.rasen, fl('rasen'), U.isBuilding(c, 'rasen')), act: 'stadiumPart', k: 'rasen' });
    L.push({ x: 18, y: -(G.Iy + Math.min(A.N.depth, 12)), z: Math.max(A.N.top * 0.6, 5), html: badge('VIP & Hospitality', num(m.vip) + ' Plätze · Stufe ' + m.levels.hosp + '/3', m.levels.hosp, 3), act: 'stadiumPart', k: 'hosp' });
    var scr = m.parts.filter(function (p) { return p.kind === 'screen'; })[0];
    if (scr) L.push({ x: scr.x, y: scr.cube ? 0 : scr.y + 6, z: scr.z + scr.hgt + 1, html: badge(scr.cube ? 'Videowürfel' : scr.live ? 'Anzeigetafel (elektronisch)' : 'Anzeigetafel', 'Stufe ' + m.levels.video + '/' + (D.facilities.video.levels.length - 1), m.levels.video, D.facilities.video.levels.length - 1, U.isBuilding(c, 'video')), act: 'stadiumPart', k: 'video' });
    if (m.guest.area) L.push({ x: m.guest.center[0], y: m.guest.center[1], z: (m.sectors[m.guest.sector].top || 2) + 2, html: '<b>Gästeblock</b><span>' + m.guest.sector + ' · ' + num(m.guest.cap) + '</span>', cls: 'guest', act: 'planSelArea', k: m.guest.sector });
    m.jobs.forEach(function (j) { var s = m.sectors[j.sec]; L.push({ x: s.center[0], y: s.center[1], z: Math.max(10, s.top + 6), html: '<b>🚧 Baustelle ' + j.sec + '</b><span>noch ' + j.weeks + ' Wo.</span>', cls: 'site', act: 'planSelArea', k: j.sec }); });
    return L;
  }
  function stagePanel(m, c, title) {
    var rows = SM.summary(m);
    return '<div class="s3d-panel"><div class="s3d-panel-h"><span class="s3d-ic">' + U.lc('stadium', 22) + '</span><div><b>' + esc(title || c.stadiumName) + '</b><span>' + SM.STAGES[m.stage] + '</span></div></div>' +
      '<div class="s3d-kv"><div><span>Kapazität</span><b>' + num(m.capacity) + '</b></div><div><span>Attraktivität</span><b>' + E.attractiveness(c) + '<small>/100</small></b></div></div>' +
      '<div class="s3d-sub">Hallenstufe ' + m.stage + '/6 · Ausstattung</div>' + rows.map(function (r) {
        var busy = r.id.length === 1 ? areaBusy(m, r.id) : U.isBuilding(c, r.id === 'vip' ? 'hosp' : r.id) || (r.id === 'vip' && U.isBuilding(c, 'vip'));
        return '<div class="s3d-row"><span>' + esc(r.n) + '</span><em>' + esc(r.txt) + '</em><span class="lvl-row">' + stufe(r.l, r.max) + (busy ? U.buildMark() : '') + '</span></div>'; }).join('') + '</div>';
  }

  // ---------- Hallenansicht (oben auf dem Hallen-Bildschirm) ----------
  U.stadiumStage = function (st, c) {
    var cam = U.p.cam || 'aussen', prev = cam === 'vorschau', mNow = SM.build(c), m = mNow, note = '';
    if (prev) {
      var sel = U.p.sec, oi = U.p.opt;
      if (sel != null && oi != null && SP.options(st, c, sel)[oi]) { var imp = SM.impact(st, c, sel, +oi); m = SM.build(c, { plan: imp.plan }); note = 'Vorschau: ' + esc(SP.sec(sel).n) + ' – ' + esc(imp.opt.n); }
      else if (c.stadium.jobs.length) { m = SM.build(c, { plan: SM.finishedPlan(c) }); note = 'Vorschau: alle laufenden Bauvorhaben fertig'; }
      else note = 'Keine Maßnahme gewählt – im Hallenplan unten einen Sektor und eine Ausbauoption antippen.';
    }
    var cams = [['aussen', 'Außenansicht'], ['innen', 'Innenansicht'], ['vorschau', 'Ausbauvorschau']];
    var h = '<div class="stage3d"><div class="stage-bar"><div class="seg">' + cams.map(function (x) { return '<button class="sm ' + (cam === x[0] ? 'on' : '') + '" data-act="s3dCam" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (note ? '<span class="stage-note">' + note + '</span>' : '<span class="stage-note muted">' + esc(c.stadiumName) + ' · ' + SM.STAGES[m.stage] + '</span>') +
      '<button class="sm ghost" data-act="gfxToggle" title="Grafikdetails umschalten">Grafik: ' + (S3.quality() === 'reduziert' ? 'reduziert' : 'hoch') + '</button></div>';
    h += S3.host('stadium', { kind: 'world', model: m, buildings: SM.city(c), cam: cam === 'vorschau' ? 'vorschau' : cam, labels: stadiumCallouts(m, c), interactive: true, ratio: '16/9',
      highlight: prev && U.p.sec ? [U.p.sec] : m.jobs.length ? [] : [], overlay: stagePanel(m, c),
      fallback: '<div class="splan-wrap">' + SM.planSVG(m) + '</div>' });
    return h + '</div>';
  };
  U.acts.s3dCam = function (d) { U.p.cam = d.v; U.render(); };
  U.acts.gfxToggle = function () { S3.setQuality(S3.quality() === 'reduziert' ? 'hoch' : 'reduziert'); U.toast('Grafikdetails: ' + S3.quality()); U.render(); };
  U.acts.planSelArea = function (d) {
    var k = d.k, sec = k.length === 1 ? (k === 'N' ? 'N2' : k === 'S' ? 'S2' : k + '1') : k;
    U.p.tab = 'plan'; U.p.sec = sec; U.p.opt = null; U.render();
    var el = document.querySelector('.plan2'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ---------- Ausbauplan: interaktive Draufsicht + Detailpanel mit Vorschau ----------
  U.stadiumPlanPanel = function (st, c) {
    var plan = SP.ensure(c), sel = U.p.sec || plan.guest || 'N2', sec = SP.sec(sel), can = U.can('business');
    var m = SM.build(c), parts = SP.parts(c), full = SP.parts(c, { live: false }), gs = c.guestStats;
    var opts = can && !SP.jobOf(plan, sel) ? SP.options(st, c, sel) : [], oi = U.p.opt != null && opts[U.p.opt] ? +U.p.opt : null;
    var imp = oi != null ? SM.impact(st, c, sel, oi) : null;
    var h = '<div class="plan2 grid g21"><div class="panel splan-panel"><div class="panel-h"><h2>Tribünenplan</h2><span class="muted small">' + SM.STAGES[m.stage] + ' · ' + num(m.capacity) + ' Plätze</span></div>';
    h += '<div class="splan-wrap">' + SM.planSVG(m, { sel: sel, highlight: imp ? [sel] : [] }) + '</div>';
    h += '<div class="splan-legend">' + Object.keys(SP.TYPES).map(function (k) { return '<span><i style="background:' + SM.TYPE_COL[k] + '"></i>' + SP.TYPES[k].n + '</span>'; }).join('') +
      '<span><i class="lg-guest"></i>Gästeblock</span><span><i class="lg-site"></i>Baustelle</span><span><i class="lg-roof"></i>Hallenhülle</span></div>';
    h += '<p class="muted small" style="margin:6px 0 0">Sektor antippen. Je Längsseite 3, hinter jedem Tor 2 Sektoren, 4 Ecken. Bis zu 5 Ränge in allen Sektoren, auch in den Ecken, insgesamt über 22.000 Plätze möglich. Eine Ecke mit Rang gilt als geschlossen. Die Hallenhülle wächst mit den Tribünen.</p></div><div class="grid" style="align-content:start">';
    // Sektorpanel
    var tiers = plan.sectors[sel].tiers, job = SP.jobOf(plan, sel), cap = SP.secCap(plan, sel), msec = m.sectors[sel];
    h += '<div class="panel sec-panel"><div class="panel-h"><h2>' + esc(sec.n) + ' <span class="muted small">' + sel + (msec.guest ? ' · <span class="neg">Gästeblock</span>' : '') + '</span></h2><b class="mono">' + num(cap.total) + ' Plätze</b></div>';
    h += '<div class="small muted" style="margin-bottom:6px">' + (sec.kind === 'corner' ? 'Ecke: <b>' + (m.corners[sel].state === 'closed' ? 'geschlossen' : 'offen') + '</b> · ' : '') + '' + tiers.length + '/' + SP.maxTiers(sec) + ' Ränge</div>';
    h += tiers.length ? '<table class="t small">' + tiers.map(function (t, ti) { return '<tr><td>' + SP.TIER_NAMES[ti] + '</td><td><i class="dot" style="background:' + SM.TYPE_COL[t.type] + '"></i>' + SP.TYPES[t.type].n + '</td><td class="num">' + Math.round(t.size * 100) + ' %</td><td class="num">' + num(SP.tierCap(sec, ti, t.type, t.size)) + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Tribüne – hier ist nur Hallenboden.</p>';
    if (job) h += '<div class="help small" style="margin-top:8px">🚧 Im Bau: <b>' + esc(job.n) + '</b> – noch ' + job.weeks + ' von ' + job.total + ' Wochen.' + U.bar(job.total - job.weeks, job.total, '#f5b301') + '</div>';
    if (plan.guest !== sel && tiers.length && can) h += '<button class="sm" style="margin-top:8px" data-act="planGuest" data-k="' + sel + '">🔴 Als Gästeblock festlegen</button>';
    if (opts.length) {
      h += '<h3 style="margin-top:12px">Ausbauoptionen</h3><div class="opt-list">' + opts.map(function (o, i) {
        return '<button class="opt-card' + (i === oi ? ' on' : '') + '" data-act="planOpt" data-v="' + i + '"><b>' + esc(o.n) + '</b><span>' + (o.cap ? (o.cap > 0 ? '+' : '') + num(o.cap) + ' Plätze · ' : '') + o.weeks + ' Wo.</span><em>' + (o.cost ? money(o.cost) : 'kostenlos') + '</em></button>';
      }).join('') + '</div>';
    }
    if (imp) {
      var o = imp.opt, afford = c.cash >= o.cost, dAtt = imp.attAfter - imp.attBefore;
      h += '<div class="impact"><div class="imp-grid">' +
        '<div><span>Zustand jetzt</span><b>' + imp.tiersBefore + ' ' + (imp.tiersBefore === 1 ? 'Rang' : 'Ränge') + ' · ' + num(cap.total) + '</b></div>' +
        '<div><span>Nach dem Ausbau</span><b>' + imp.tiersAfter + ' ' + (imp.tiersAfter === 1 ? 'Rang' : 'Ränge') + ' · ' + num(cap.total + o.cap) + '</b></div>' +
        '<div><span>Plätze</span><b class="' + (o.cap >= 0 ? 'pos' : 'neg') + '">' + (o.cap >= 0 ? '+' : '') + num(o.cap) + '</b></div>' +
        '<div><span>Gesamtkapazität</span><b>' + num(imp.capBefore) + ' → ' + num(imp.capAfter) + '</b></div>' +
        '<div><span>Kosten</span><b>' + (o.cost ? money(o.cost) : 'kostenlos') + '</b></div>' +
        '<div><span>Bauzeit</span><b>' + o.weeks + ' Wochen</b></div>' +
        '<div class="span2"><span>Attraktivität</span><b>' + imp.attBefore + ' → ' + imp.attAfter + ' <small class="' + (dAtt > 0 ? 'pos' : dAtt < 0 ? 'neg' : 'muted') + '">(' + (dAtt > 0 ? '+' : '') + dAtt + ')</small></b></div></div>';
      if (o.action === 'convert' || o.action === 'grow') h += '<p class="small warn">Der Rang ist während des Umbaus gesperrt.</p>';
      var mp = SM.build(c, { plan: imp.plan });
      h += '<div class="imp-prev">' + S3.host('preview', { kind: 'lite', model: mp, cam: 'aussen', highlight: [sel], interactive: true, ratio: '16/10', resetView: false, fallback: '<div class="splan-wrap">' + SM.planSVG(mp, { highlight: [sel] }) + '</div>' }) + '<span class="imp-tag">Vorschau nach dem Ausbau</span></div>';
      h += '<button class="primary big-build" data-act="planBuild" data-k="' + sel + '" data-v="' + oi + '"' + (afford ? '' : ' disabled title="Nicht genug Geld"') + '>🏗️ Ausbau beauftragen · ' + (o.cost ? money(o.cost) : 'kostenlos') + '</button></div>';
    } else if (opts.length) h += '<p class="muted small" style="margin-top:8px">Option antippen: Vorschau, Kosten und Auswirkung erscheinen hier.</p>';
    h += '</div>';
    // Kapazität & Gästeblock
    h += '<div class="panel"><h2>Kapazität</h2><div class="grid g2">' + U.ikpi('fans', 'Stehplätze', num(parts.steh)) + U.ikpi('stadium', 'Sitzplätze', num(parts.sitz)) + U.ikpi('stocks', 'Business', num(parts.business)) + U.ikpi('star', 'Logenplätze', num(parts.loge)) + '</div>' +
      (full.steh + full.sitz + full.vip > parts.steh + parts.sitz + parts.vip ? '<p class="small warn" style="margin-top:6px">🚧 Wegen Umbau gesperrt: ' + num(full.steh + full.sitz + full.vip - parts.steh - parts.sitz - parts.vip) + ' Plätze</p>' : '') +
      '<p class="small" style="margin-top:6px">Gästeblock: <b>' + esc(SP.sec(plan.guest).n) + '</b> · ' + num(SP.guestCap(c)) + ' Plätze' + (gs && gs.season === st.season ? ' · zuletzt ' + num(gs.last) + ' Gästefans' + (gs.short ? ' <span class="warn">(zu klein – Nachfrage ' + num(gs.demand) + ')</span>' : '') : '') + '</p>' +
      '<div class="row between small"><span>Abnutzung Gästeblock</span><b>' + Math.round(plan.wear || 0) + ' %</b></div>' + U.bar(plan.wear || 0, 100, (plan.wear || 0) > 60 ? '#ef4444' : (plan.wear || 0) > 30 ? '#f5b301' : '#22c55e') +
      (can && (plan.wear || 0) >= 5 ? '<button class="sm" style="margin-top:6px" data-act="planRepair">Gästeblock sanieren (' + money(SP.repairCost(c)) + ')</button>' : '') +
      '<p class="muted small" style="margin-top:6px">Je höher die Liga und je größer der Gegner, desto mehr Gästefans reisen an – mehr Einnahmen, aber auch mehr Abnutzung und Randale-Gefahr. Gute Sanitäranlagen und eine regelmäßige Sanierung senken das Risiko.</p></div>';
    h += '</div></div>';
    if (plan.jobs.length) h += '<div class="panel" style="margin-top:14px"><h2>Laufende Tribünen-Bauprojekte</h2>' + plan.jobs.map(function (j) { return '<div class="row between small" style="margin-bottom:6px"><span>' + esc(SP.sec(j.sec).n) + ': ' + esc(j.n) + '</span><span class="muted">noch ' + j.weeks + ' Wo.</span></div>' + U.bar(j.total - j.weeks, j.total, '#f5b301'); }).join('') + '</div>';
    return h;
  };
  U.acts.planSel = function (d) { U.p.sec = d.k; U.p.opt = null; U.render(); };
  U.acts.planOpt = function (d) { U.p.opt = +d.v; U.render(); };
  U.acts.planGuest = function (d) { if (SP.setGuest(U.club(), d.k)) U.toast('Gästeblock: ' + SP.sec(d.k).n); U.render(); };
  U.acts.planRepair = function () { var r = SP.repair(U.club()); U.toast(r.ok ? 'Gästeblock saniert (' + money(r.cost) + ').' : r.why); U.render(); };
  U.acts.planBuild = function (d) {
    var st = U.st, c = U.club(), o = SP.options(st, c, d.k)[+d.v]; if (!o) return;
    U.confirm('Ausbau beauftragen', '<p><b>' + esc(SP.sec(d.k).n) + '</b>: ' + esc(o.n) + '</p><p>Kosten ' + money(o.cost) + ' · Bauzeit ' + o.weeks + ' Wochen' + (o.cap ? ' · ' + (o.cap > 0 ? '+' : '') + num(o.cap) + ' Plätze' : '') + '</p>', function () {
      var r = SP.start(st, c, d.k, +d.v); U.closeModal(); U.p.opt = null; U.toast(r.ok ? 'Baustart: ' + r.opt.n : r.why); U.render();
    });
  };

  // ---------- Vereinsstadt ----------
  U.cityStage = function (st, c) {
    var m = SM.build(c), blds = SM.city(c), keysRev = ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe', 'solar', 'geschaeft'];
    var labels = blds.filter(function (b) { return b.key !== 'strasse'; }).map(function (b) {
      return { x: b.x, y: b.y, bld: b.key, html: badge(b.name.replace(' & Merchandising', '').replace('Öffentlicher Nahverkehr', 'Nahverkehr'), b.level ? 'Stufe ' + b.level + '/' + b.max : 'Bauplatz', b.level, b.max, U.isBuilding(c, b.key)), cls: b.level ? '' : 'empty', act: 'cityPlot', k: b.key };
    });
    labels.push({ x: 0, y: 0, z: Math.max(m.roofH, m.areas.N.top) + 10, html: badge(c.stadiumName, num(m.capacity) + ' Plätze', 0, 0), cls: 'main', act: 'nav-stadion' });
    var lv = 0, n = 0; Object.keys(D.facilities).forEach(function (k) { var f = D.facilities[k], l = c.fac[k] != null ? c.fac[k] : (f.min || 0); lv += l / (f.levels.length - 1); n++; });
    var rev = 0, up = 0; keysRev.forEach(function (k) { rev += E.buildingRevenue(st, c, k); var l = E.level(c, k); up += l ? l.up : 0; });
    var panel = '<div class="s3d-panel"><div class="s3d-panel-h"><span class="s3d-ic">🏙️</span><div><b>Vereinsstadt</b><span>' + esc(c.name) + '</span></div></div>' +
      '<div class="s3d-row"><span>Halle</span><em>' + num(m.capacity) + ' Plätze</em></div>' +
      '<div class="s3d-row"><span>Ausbau gesamt</span><em>' + Math.round(lv / n * 100) + ' %</em>' + stufe(Math.round(lv / n * 5), 5) + '</div>' +
      '<div class="s3d-row"><span>Attraktivität</span><em>' + E.attractiveness(c) + '/100</em></div>' +
      '<div class="s3d-row"><span>Betriebe</span><em class="' + (rev - up < 0 ? 'neg' : 'pos') + '">' + money(rev - up) + '/J.</em></div></div>';
    return '<div class="stage3d city"><div class="stage-bar"><span class="stage-note muted">Vereinscampus rund um ' + esc(c.stadiumName) + ' – Gebäude antippen zum Ausbauen</span><button class="sm ghost" data-act="gfxToggle">Grafik: ' + (S3.quality() === 'reduziert' ? 'reduziert' : 'hoch') + '</button></div>' +
      S3.host('city', { kind: 'world', model: m, buildings: blds, cam: 'stadt', labels: labels, interactive: true, ratio: '16/9', overlay: panel, fallback: U.gfx.cityView(c) }) + '</div>';
  };

  U.stadiumThumb3d = function (c, ratio) {
    var m = SM.build(c);
    return S3.host('thumb', { kind: 'lite', model: m, cam: 'aussen', ratio: ratio || '4/3', fallback: U.gfx.stadiumThumb(c) });
  };
})(RFM);
