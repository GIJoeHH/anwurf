// ANWURF! – Hallenplan: Grundriss mit Sektoren und Rängen, Gästeblock, Abnutzung
// 14 Sektoren: je 2 hinter den Toren (West/Ost), je 3 an den Längsseiten (Haupttribüne/Gegengerade), 4 Ecken.
// Alle Sektoren (auch die Ecken) haben bis zu 5 Ränge (max. rund 38.000 Stehplatz-Äquivalente,
// also z. B. 22.000 Plätze als Mischung aus Steh- und Sitzplätzen). Die ersten drei Ränge sind unverändert,
// damit bestehende Spielstände ihre Kapazität behalten. Ein Rang ist Stehplatz, Sitzplatz, Business oder Logen und kann
// teilweise ausgebaut sein (Größe 5 … 100 %). Überdachung, Technik, Flutlicht usw. laufen weiter über die
// bisherigen Ausbaustufen. Ältere Spielstände werden aus den alten Kapazitäten übernommen.
(function (R) {
  var D = R.data, E = R.econ;
  var SP = R.stadium = {};

  SP.SECTORS = [
    { id: 'N1', side: 'N', kind: 'long', n: 'Haupttribüne A' }, { id: 'N2', side: 'N', kind: 'long', n: 'Haupttribüne B' }, { id: 'N3', side: 'N', kind: 'long', n: 'Haupttribüne C' },
    { id: 'S1', side: 'S', kind: 'long', n: 'Gegengerade A' }, { id: 'S2', side: 'S', kind: 'long', n: 'Gegengerade B' }, { id: 'S3', side: 'S', kind: 'long', n: 'Gegengerade C' },
    { id: 'W1', side: 'W', kind: 'goal', n: 'Fanblock West 1' }, { id: 'W2', side: 'W', kind: 'goal', n: 'Fanblock West 2' },
    { id: 'E1', side: 'E', kind: 'goal', n: 'Fanblock Ost 1' }, { id: 'E2', side: 'E', kind: 'goal', n: 'Fanblock Ost 2' },
    { id: 'NW', side: 'C', kind: 'corner', n: 'Ecke Nordwest' }, { id: 'NE', side: 'C', kind: 'corner', n: 'Ecke Nordost' },
    { id: 'SW', side: 'C', kind: 'corner', n: 'Ecke Südwest' }, { id: 'SE', side: 'C', kind: 'corner', n: 'Ecke Südost' }
  ];
  SP.BASE = { long: [400, 520, 600, 720, 820], goal: [480, 600, 680, 780, 860], corner: [180, 260, 360, 440, 520] }; // Stehplatz-Äquivalent je Rang (Halle)
  SP.TYPES = {
    steh: { n: 'Stehplatz', f: 1, cost: 110, up: 5, col: '#8d8676', ic: '🧍' },
    sitz: { n: 'Sitzplatz', f: 0.55, cost: 260, up: 9, col: '#2f5fb3', ic: '💺' },
    business: { n: 'Business', f: 0.35, cost: 1100, up: 30, col: '#0f766e', ic: '💼' },
    loge: { n: 'Logen', f: 0.12, cost: 5200, up: 150, col: '#a16207', ic: '🥂' }
  };
  SP.TIER_COST = [1, 1.35, 1.8, 2.3, 2.9];
  SP.TIER_NAMES = ['Unterrang', 'Oberrang', '3. Rang', '4. Rang', '5. Rang'];
  SP.sec = function (id) { return SP.SECTORS.filter(function (s) { return s.id === id; })[0]; };
  SP.maxTiers = function (sec) { return SP.BASE[sec.kind].length; };
  SP.tierCap = function (sec, ti, type, size) { return Math.round(SP.BASE[sec.kind][ti] * SP.TYPES[type].f * (size == null ? 1 : size)); };

  // ---------- Aus alten Kapazitäten übernehmen ----------
  SP.fromCaps = function (steh, sitz, vip) {
    var plan = { v: 2, sectors: {}, guest: 'E2', jobs: [], wear: 0 };
    SP.SECTORS.forEach(function (s) { plan.sectors[s.id] = { tiers: [] }; });
    function fill(type, amount, order) {
      for (var i = 0; i < order.length && amount > 0; i++) {
        var o = order[i], sec = SP.sec(o[0]), t = plan.sectors[o[0]].tiers;
        if (t.length !== o[1]) continue; // Ränge werden von unten nach oben belegt
        if (o[1] > 0 && t[o[1] - 1].size < 1) continue;
        var full = SP.tierCap(sec, o[1], type, 1), size = Math.min(1, amount / full);
        size = Math.max(0.05, Math.ceil(size * 20) / 20);
        t.push({ type: type, size: size });
        amount -= full * size;
      }
    }
    function order(ids, tiers) { var o = []; tiers.forEach(function (ti) { ids.forEach(function (id) { o.push([id, ti]); }); }); return o; }
    fill('steh', steh, order(['W1', 'W2', 'E1', 'E2'], [0, 1, 2]));
    fill('sitz', sitz, order(['N2', 'N1', 'N3', 'S2', 'S1', 'S3'], [0]).concat(order(['NW', 'NE', 'SW', 'SE'], [0])).concat(order(['N2', 'N1', 'N3', 'S2', 'S1', 'S3'], [1])).concat(order(['NW', 'NE', 'SW', 'SE'], [1])).concat(order(['N2', 'N1', 'N3', 'S2', 'S1', 'S3', 'W1', 'W2', 'E1', 'E2'], [0, 1, 2])));
    fill('loge', vip, order(['N2', 'N1', 'N3', 'S2'], [0, 1, 2]));
    // Gästeblock: ein Hintertor-Sektor mit Plätzen, sonst eine Ecke/Seite
    var g = ['E2', 'E1', 'W2', 'W1', 'SE', 'S3', 'N3'].filter(function (id) { return plan.sectors[id].tiers.length; })[0];
    plan.guest = g || 'E2';
    return plan;
  };
  SP.ensure = function (club) {
    if (club.stadium && club.stadium.v) return club.stadium.v < SP.VERSION ? SP.migrate(club) : club.stadium;
    var f = D.facilities, lvl = function (k) { return f[k].levels[club.fac[k] != null ? club.fac[k] : (f[k].min || 0)]; };
    club.stadium = SP.fromCaps(lvl('steh').cap, lvl('sitz').cap, lvl('vip').vip);
    return club.stadium;
  };
  SP.has = function (club) { return !!(club && club.stadium && club.stadium.v); };
  // Baumaßnahme auf einen Plan anwenden (Fertigstellung und Ausbauvorschau nutzen dieselbe Regel)
  SP.applyJob = function (plan, j) {
    var t = plan.sectors[j.sec].tiers;
    if (j.action === 'new') t.push({ type: j.type, size: 1 });
    else if (j.action === 'grow') t[j.tier].size = 1;
    else if (j.action === 'convert') t[j.tier].type = j.type;
    else if (j.action === 'remove') t.splice(j.tier, 1);
  };
  // Spielstände aus älteren Versionen bereinigen (v1 → v2): fehlende Felder, ungültige Ränge, Gästeblock ohne Plätze
  SP.VERSION = 2;
  SP.migrate = function (club) {
    var p = club && club.stadium; if (!p || !p.v) return p;
    p.sectors = p.sectors || {}; p.jobs = Array.isArray(p.jobs) ? p.jobs : []; p.wear = +p.wear || 0;
    SP.SECTORS.forEach(function (s) {
      var x = p.sectors[s.id] = p.sectors[s.id] || { tiers: [] };
      x.tiers = (x.tiers || []).filter(function (t) { return t && SP.TYPES[t.type]; }).slice(0, SP.maxTiers(s));
      x.tiers.forEach(function (t) { t.size = Math.max(0.05, Math.min(1, +t.size || 1)); });
    });
    p.jobs = p.jobs.filter(function (j) { return j && p.sectors[j.sec]; });
    if (!p.guest || !p.sectors[p.guest] || !p.sectors[p.guest].tiers.length) {
      var g = ['E2', 'E1', 'W2', 'W1', 'SE', 'S3', 'N3'].concat(SP.SECTORS.map(function (s) { return s.id; })).filter(function (id) { return p.sectors[id].tiers.length; })[0];
      p.guest = g || 'E2';
    }
    p.guests = (Array.isArray(p.guests) ? p.guests : [p.guest]).filter(function (id) { return p.sectors[id] && p.sectors[id].tiers.length; });
    if (!p.guests.length || p.guests.indexOf(p.guest) < 0) p.guests.unshift(p.guest);
    p.v = SP.VERSION;
    return p;
  };

  // ---------- Kennzahlen ----------
  function busy(plan, id, ti) { return plan.jobs.some(function (j) { return j.sec === id && j.tier === ti && j.action !== 'new'; }); }
  SP.secCap = function (plan, id, opts) {
    var sec = SP.sec(id), r = { steh: 0, sitz: 0, business: 0, loge: 0, total: 0 };
    plan.sectors[id].tiers.forEach(function (t, ti) {
      if (opts && opts.live && busy(plan, id, ti)) return; // während des Umbaus gesperrt
      var c = SP.tierCap(sec, ti, t.type, t.size); r[t.type] += c; r.total += c;
    });
    return r;
  };
  SP.parts = function (club, opts) {
    var plan = club.stadium, r = { steh: 0, sitz: 0, vip: 0, business: 0, loge: 0 };
    SP.SECTORS.forEach(function (s) { var c = SP.secCap(plan, s.id, { live: !opts || opts.live !== false }); r.steh += c.steh; r.sitz += c.sitz; r.business += c.business; r.loge += c.loge; });
    r.vip = r.business + r.loge;
    return r;
  };
  // Mehrere Gästeblöcke möglich (plan.guests); plan.guest bleibt der erste Block (ältere Spielstände)
  SP.guestIds = function (p) { if (!p) return []; var g = Array.isArray(p.guests) && p.guests.length ? p.guests : (p.guest ? [p.guest] : []); return g.filter(function (id) { return p.sectors[id]; }); };
  SP.guestCap = function (club) { var p = club.stadium; return SP.guestIds(p).reduce(function (s, id) { return s + SP.secCap(p, id, { live: true }).total; }, 0); };
  SP.guestType = function (club) { var p = club.stadium, cnt = {}; SP.guestIds(p).forEach(function (id) { p.sectors[id].tiers.forEach(function (t, ti) { cnt[t.type] = (cnt[t.type] || 0) + SP.tierCap(SP.sec(id), ti, t.type, t.size); }); }); var k = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0]; return k || 'steh'; };
  SP.upkeep = function (club) {
    var plan = club.stadium, u = 0;
    SP.SECTORS.forEach(function (s) { plan.sectors[s.id].tiers.forEach(function (t, ti) { u += SP.tierCap(s, ti, t.type, t.size) * SP.TYPES[t.type].up; }); });
    return u;
  };
  SP.value = function (club) {
    var plan = club.stadium, v = 0;
    SP.SECTORS.forEach(function (s) { plan.sectors[s.id].tiers.forEach(function (t, ti) { v += SP.tierCap(s, ti, t.type, t.size) * SP.TYPES[t.type].cost * SP.TIER_COST[ti]; }); });
    return v;
  };
  // Seitenprofil für die Grafik: Ränge, Tiefe, vorherrschender Typ
  SP.sideProfile = function (club, side) {
    var plan = club.stadium, secs = SP.SECTORS.filter(function (s) { return s.side === side; }), depth = 0, cnt = {}, tiers = 0, n = 0;
    secs.forEach(function (s) {
      var t = plan.sectors[s.id].tiers; tiers = Math.max(tiers, t.length);
      t.forEach(function (x) { depth += x.size; cnt[x.type] = (cnt[x.type] || 0) + x.size; }); n++;
    });
    var dom = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })[0] || null;
    return { depth: n ? depth / n : 0, tiers: tiers, type: dom, loge: (cnt.loge || 0) + (cnt.business || 0) };
  };

  // ---------- Bauen ----------
  SP.jobOf = function (plan, id) { return plan.jobs.filter(function (j) { return j.sec === id; })[0]; };
  function weeksFor(places, ti) { return Math.max(2, Math.round(3 + places / 130 * SP.TIER_COST[ti])); }
  // Mögliche Maßnahmen für einen Sektor
  SP.options = function (st, club, id) {
    var plan = SP.ensure(club), sec = SP.sec(id), tiers = plan.sectors[id].tiers, out = [];
    if (SP.jobOf(plan, id)) return out;
    tiers.forEach(function (t, ti) {
      if (t.size < 1) {
        var add = SP.tierCap(sec, ti, t.type, 1) - SP.tierCap(sec, ti, t.type, t.size);
        out.push({ action: 'grow', tier: ti, type: t.type, n: SP.TIER_NAMES[ti] + ' auf 100 % ausbauen', cap: add, cost: Math.round(add * SP.TYPES[t.type].cost * SP.TIER_COST[ti]), weeks: weeksFor(add, ti) });
      }
      Object.keys(SP.TYPES).forEach(function (ty) {
        if (ty === t.type) return;
        var capNew = SP.tierCap(sec, ti, ty, t.size), capOld = SP.tierCap(sec, ti, t.type, t.size);
        var cost = Math.round(capNew * SP.TYPES[ty].cost * SP.TIER_COST[ti] * (SP.TYPES[ty].cost > SP.TYPES[t.type].cost ? 0.7 : 0.25));
        out.push({ action: 'convert', tier: ti, type: ty, n: SP.TIER_NAMES[ti] + ': ' + SP.TYPES[t.type].n + ' → ' + SP.TYPES[ty].n, cap: capNew - capOld, cost: cost, weeks: weeksFor(capNew, ti) });
      });
    });
    var ti2 = tiers.length;
    if (ti2 < SP.maxTiers(sec) && (ti2 === 0 || tiers[ti2 - 1].size >= 1)) {
      Object.keys(SP.TYPES).forEach(function (ty) {
        var cap = SP.tierCap(sec, ti2, ty, 1);
        out.push({ action: 'new', tier: ti2, type: ty, n: 'Neuer ' + SP.TIER_NAMES[ti2] + ': ' + SP.TYPES[ty].n, cap: cap, cost: Math.round(cap * SP.TYPES[ty].cost * SP.TIER_COST[ti2] * (ti2 ? 1.15 : 1)), weeks: weeksFor(cap, ti2) + (ti2 ? 4 : 0) });
      });
    }
    if (tiers.length && tiers.length > 0) out.push({ action: 'remove', tier: tiers.length - 1, n: SP.TIER_NAMES[tiers.length - 1] + ' abreißen', cap: -SP.tierCap(sec, tiers.length - 1, tiers[tiers.length - 1].type, tiers[tiers.length - 1].size), cost: 0, weeks: 2 });
    out.forEach(function (o) { o.cost = Math.max(0, Math.round(o.cost * (1 - E.subRate(club, { sub: 0.1 })) / 5000) * 5000); o.sec = id; });
    return out;
  };
  SP.start = function (st, club, id, idx) {
    var opt = SP.options(st, club, id)[idx];
    if (!opt) return { ok: false, why: 'Maßnahme nicht möglich' };
    if (E.buildCount(club) >= E.MAX_BUILDS) return { ok: false, why: 'Maximal ' + E.MAX_BUILDS + ' Bauvorhaben in der Halle gleichzeitig' };
    if (club.cash < opt.cost) return { ok: false, why: 'Nicht genug Geld (' + R.fmtMoney(opt.cost) + ')' };
    club.cash -= opt.cost; if (opt.cost) E.book(club, 'Bauprojekte', -opt.cost);
    club.stadium.jobs.push({ sec: id, tier: opt.tier, action: opt.action, type: opt.type, weeks: opt.weeks, total: opt.weeks, cost: opt.cost, n: opt.n });
    return { ok: true, opt: opt };
  };
  SP.progress = function (st, club) {
    if (!SP.has(club)) return [];
    var plan = club.stadium, done = [];
    plan.jobs.forEach(function (j) { j.weeks--; if (j.weeks <= 0) done.push(j); });
    done.forEach(function (j) {
      SP.applyJob(plan, j);
      plan.jobs.splice(plan.jobs.indexOf(j), 1);
      if (club.userControlled) R.season.news(st, 'Hallenausbau fertig: ' + SP.sec(j.sec).n, j.n + '. Neue Kapazität: ' + R.fmtNum(E.capacity(club)) + ' Plätze.', 'bau');
    });
    return done;
  };
  SP.removeGuest = function (club, id) { var p = SP.ensure(club), g = SP.guestIds(p); if (g.length <= 1 || g.indexOf(id) < 0) return false; p.guests = g.filter(function (x) { return x !== id; }); p.guest = p.guests[0]; return true; };
  SP.addGuest = function (club, id) { var p = SP.ensure(club); if (!p.sectors[id] || !p.sectors[id].tiers.length) return false; var g = SP.guestIds(p); if (g.indexOf(id) < 0) g.push(id); p.guests = g; p.guest = g[0]; return true; };
  SP.setGuest = function (club, id) { var p = SP.ensure(club); if (!p.sectors[id] || !p.sectors[id].tiers.length) return false; p.guest = id; p.guests = [id]; p.wear = Math.min(p.wear || 0, 40); return true; };
  // Gästeblock sanieren (Abnutzung durch Gästefans)
  SP.repairCost = function (club) { var p = club.stadium; return Math.round(((p && p.wear) || 0) * (800 + SP.guestCap(club) * 2.5) / 1000) * 1000; };
  SP.repair = function (club) { var c = SP.repairCost(club); if (!c) return { ok: false, why: 'Kein Sanierungsbedarf' }; if (club.cash < c) return { ok: false, why: 'Nicht genug Geld' }; club.cash -= c; E.book(club, 'Unterhalt Anlagen', -c); club.stadium.wear = 0; return { ok: true, cost: c }; };
})(RFM);
