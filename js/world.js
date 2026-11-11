// ANWURF! – Spielwelt: Spieler, Vereine, neue Karriere
(function (R) {
  var D = R.data;
  var W = R.world = {};

  W.overallFor = function (p, role) {
    var w = D.posWeights[role], a = p.attr;
    return a.tec * w[0] + a.pas * w[1] + a.sho * w[2] + a.def * w[3] + a.spd * w[4] + a.sta * w[5] + a.gk * w[6];
  };
  // Stärke eines Spielers auf einer bestimmten Rolle (inkl. Positionsmalus)
  W.roleRating = function (p, role) {
    var r = W.overallFor(p, role);
    if (p.pos === role) return r;
    if (p.alt && p.alt.indexOf(role) >= 0) return r * 0.96;
    if (role === 'TW' || p.pos === 'TW') return r * 0.35;
    return r * 0.85;
  };
  W.recalc = function (p) {
    p.ovr = Math.round(W.overallFor(p, p.pos));
    if (p.pot < p.ovr) p.pot = p.ovr;
    p.value = W.marketValue(p);
  };
  // Echte Spielwelt: Die Stärkewerte liegen enger beieinander und höher als in der fiktiven Welt
  // (Ligaschnitt 76/69/64 statt 73/63/57). Für Geldbeträge (Gehalt, Marktwert) wird die Stärke deshalb
  // auf die Skala der Wirtschaftssimulation umgerechnet; die angezeigte Stärke bleibt unverändert.
  W.REAL_SCALE = [1, 0]; // Handball: Stärkewerte der echten Welt liegen bereits auf der Skala der Wirtschaftssimulation
  W.moneyOvr = function (p) { return p.rs ? W.REAL_SCALE[0] * p.ovr + W.REAL_SCALE[1] : p.ovr; };
  W.fromMoneyScale = function (st, x) { return st && st.world === 'real' ? (x - W.REAL_SCALE[1]) / W.REAL_SCALE[0] : x; };
  W.marketValue = function (p) {
    // Handball-Ablösen sind klein: die meisten Wechsel sind ablösefrei, Bundesliga-Stammspieler ~100–200 Tsd. €,
    // Weltstars ~1–1,5 Mio. € (Rekordablösen knapp 2 Mio. €), 2. Liga meist 10–80 Tsd. €, 3. Liga wenige Tausend
    var v = 105000 * Math.exp((W.moneyOvr(p) - 70) / 7.8);
    var ageF = p.age <= 21 ? 1 + (p.pot - p.ovr) / 30 : p.age <= 27 ? 1 + Math.max(0, p.pot - p.ovr) / 50 : p.age <= 30 ? 0.85 : p.age <= 32 ? 0.55 : 0.3;
    v *= ageF;
    if (p.contract <= 1) v *= 0.75;
    if (p.inj && p.inj.weeks > 8) v *= 0.8;
    return Math.max(1000, R.round(v, v > 1e6 ? 50000 : v > 1e5 ? 5000 : 1000));
  };
  // Jahresgehalt (brutto) nach realen Größenordnungen im deutschen Männerhandball:
  // Weltstars bei Top-Klubs ~400–500 Tsd. €, Bundesliga-Stammspieler ~60–80 Tsd. € (Schnitt ~70–100 Tsd. €),
  // 2. Liga meist 15–50 Tsd. € (Spitze knapp unter 100 Tsd. €), 3. Liga Halbprofis/Amateure ~5–25 Tsd. €.
  W.fairWage = function (p) {
    var w = 62000 * Math.exp((W.moneyOvr(p) - 70) / 10.2);
    if (p.age >= 31) w *= 0.9;
    return Math.max(3000, R.round(w, 500));
  };
  W.WAGE_CAP = { 1: 600000, 2: 95000, 3: 40000 }; // Obergrenzen je Liga (3 = alle Staffeln der 3. Liga)
  W.wageCap = function (club) { return club ? (W.WAGE_CAP[club.league] || W.WAGE_CAP[3]) : W.WAGE_CAP[1]; };
  W.capWage = function (wage, club) { return Math.min(wage, W.wageCap(club)); };
  // Alte Spielstände: Gehälter einmalig auf das neue Gefüge umrechnen (Verhältnis neue/alte Formel, Ligaobergrenze)
  W.WAGE_V = 2;
  W.migrateWages = function (st) {
    if ((st.wageV || 1) >= W.WAGE_V) return 0;
    var n = 0;
    Object.keys(st.players).forEach(function (id) {
      var p = st.players[id]; if (!p || !p.wage) return;
      var o = W.moneyOvr(p), f = (62000 * Math.exp((o - 70) / 10.2)) / Math.max(1, 12000 * Math.exp((o - 50) / 9));
      var c = p.clubId ? st.clubs[p.clubId] : null;
      p.wage = Math.max(1500, R.round(W.capWage(p.wage * f, c), 500)); p.value = W.marketValue(p); if (p.asking) p.asking = R.round(p.value * 1.25, 5000); n++;
    });
    st.wageV = W.WAGE_V;
    return n;
  };

  var nextId = function (st, kind) { st.nextIds[kind] = (st.nextIds[kind] || 0) + 1; return kind.charAt(0) + st.nextIds[kind]; };
  W.nextId = nextId;

  W.blankPlayer = function (st, pos, age, clubId) {
    var p = {
      id: nextId(st, 'player'), first: R.pick(D.firstNames), last: R.pick(D.lastNames), age: age, pos: pos, alt: [],
      attr: {}, ovr: 0, pot: 0, form: 6, fitness: R.randInt(88, 100), morale: R.randInt(60, 80),
      wage: 0, contract: R.randInt(1, 4), value: 0, inj: null, susp: 0, yellow: 0, clubId: clubId,
      youth: false, homegrown: false, listed: false, asking: 0, loan: null,
      stats: { apps: 0, goals: 0, assists: 0, yc: 0, rc: 0, rsum: 0 }, career: { apps: 0, goals: 0, assists: 0 },
      boughtFor: 0, risk: R.rand() < 0.15 ? R.randRange(0.4, 1) : R.randRange(0, 0.3), joined: st.season
    };
    if (st.world === 'real') p.rs = 1;
    return p;
  };
  W.genPlayer = function (st, pos, target, age, clubId) {
    var p = W.blankPlayer(st, pos, age, clubId);
    var w = D.posWeights[pos];
    D.attrKeys.forEach(function (k, i) {
      var bias = w[i] >= 0.2 ? 6 : (w[i] === 0 ? (k === 'gk' ? -35 : -14) : 0);
      if (pos === 'TW' && k !== 'gk') bias = -8;
      p.attr[k] = target + bias + R.gauss(0, 6);
    });
    // Feinabstimmung auf Zielstärke
    for (var it = 0; it < 3; it++) {
      var d = target - W.overallFor(p, pos);
      D.attrKeys.forEach(function (k) { p.attr[k] = R.clamp(p.attr[k] + d, 1, 99); });
    }
    D.attrKeys.forEach(function (k) { p.attr[k] = Math.round(p.attr[k]); });
    // Nebenpositionen
    if (pos === 'AUS' && R.chance(0.2)) p.alt.push('RUE');
    if (pos === 'RUE' && R.chance(0.25)) p.alt.push(R.chance(0.6) ? 'AUS' : 'KRS');
    if (pos === 'KRS' && R.chance(0.25)) p.alt.push('RUE');
    p.posDetail = W.detailFor(pos);
    W.recalc(p);
    var potAdd = age <= 18 ? R.randInt(6, 28) : age <= 21 ? R.randInt(3, 18) : age <= 24 ? R.randInt(0, 9) : age <= 27 ? R.randInt(0, 3) : 0;
    p.pot = R.clamp(p.ovr + potAdd, p.ovr, 95);
    p.wage = Math.round(W.capWage(W.fairWage(p) * R.randRange(0.85, 1.15), clubId ? st.clubs[clubId] : null) / 500) * 500;
    p.value = W.marketValue(p);
    st.players[p.id] = p;
    return p;
  };

  // Genaue Position zufällig passend zur Positionsgruppe
  W.detailFor = function (pos) { return pos === 'TW' ? 'TW' : pos === 'AUS' ? (R.chance(0.5) ? 'LA' : 'RA') : pos === 'KRS' ? 'KM' : R.pick(['RL', 'RM', 'RR']); };
  W.genYouth = function (st, club, quality) {
    // quality 0..4 (Stufe Nachwuchszentrum)
    var pos = R.weighted(['TW', 'AUS', 'RUE', 'KRS'], function (x) { return { TW: 1.2, AUS: 2.5, RUE: 3.5, KRS: 1.5 }[x]; });
    var base = W.fromMoneyScale(st, 34 + quality * 4 + (club.league === 1 ? 4 : club.league === 2 ? 2 : 0));
    var p = W.genPlayer(st, pos, R.clamp(R.gauss(base, 5), 25, 70), R.randInt(16, 18), club.id);
    p.pot = R.clamp(Math.round(p.ovr + R.randInt(10, 22) + quality * R.randInt(2, 5) + (R.chance(0.04 + quality * 0.02) ? R.randInt(5, 12) : 0)), p.ovr, 96);
    p.youth = true; p.homegrown = true; p.contract = 3;
    p.wage = Math.max(1500, Math.round(W.fairWage(p) * 0.5 / 500) * 500);
    W.recalc(p);
    return p;
  };

  W.genCoach = function (quality, league) {
    var q = R.clamp(Math.round(quality), 20, 99);
    return { name: R.pick(D.firstNames) + ' ' + R.pick(D.lastNames), profile: R.pick(D.coachProfiles), quality: q, wage: R.round(60000 * D.MONEY * 1.5 * Math.exp((q - 40) / 14), 1000), age: R.randInt(36, 66) };
  };

  W.sponsorBase = function (club) {
    var base = { 1: 2200000, 2: 500000, 3: 100000 }[club.league];
    return base * (0.6 + club.reputation / 120) * Math.pow(Math.max(400, club.fans) / 6000, 0.25);
  };

  W.genSponsor = function (st, club, cat, forOffer) {
    var total = W.sponsorBase(club) * D.sponsorShare[cat];
    // Öffentliche Wahrnehmung beeinflusst das Sponsoreninteresse
    if (club.publicImage != null) total *= 0.9 + club.publicImage / 500;
    var amount = R.round(total * R.randRange(0.85, 1.15), 1000);
    var pool = st && st.sponsorPool && st.sponsorPool.length ? st.sponsorPool : D.sponsorNames;
    var kits = st && st.kitPool && st.kitPool.length ? st.kitPool : D.kitBrands;
    var name = cat === 'ausruester' ? R.pick(kits) : R.pick(pool);
    return {
      id: nextId(st, 'sponsor'), cat: cat, name: name, amount: amount, years: R.randInt(1, 3),
      bonusTop: R.round(amount * R.randRange(0.08, 0.2), 1000), bonusPromo: R.round(amount * R.randRange(0.1, 0.3), 1000),
      bonusTitle: R.round(amount * R.randRange(0.15, 0.4), 1000), topN: R.pick([3, 5, 8])
    };
  };

  function pickStadium(targetCap) {
    var best = [0, 0], bestD = 1e9;
    for (var s = 0; s <= 6; s++) for (var t = 0; t <= 6; t++) {
      var cap = D.facilities.sitz.levels[s].cap + D.facilities.steh.levels[t].cap;
      var d = Math.abs(cap - targetCap) + (t > s + 1 ? 600 : 0);
      if (d < bestD) { bestD = d; best = [s, t]; }
    }
    return best;
  }

  W.makeClub = function (st, row, idx) {
    var lvl = row[5], tier = row[6];
    var club = {
      id: 'c' + (idx + 1), name: row[0], short: row[1], city: row[2], colors: [row[3], row[4]], crest: { shape: idx % 4, symbol: idx % 6 },
      league: lvl, staffel: row[8] || 0, tier: tier, reputation: Math.round(15 + tier * 80), fans: row[7], tradition: R.randInt(30, 90),
      cash: R.round({ 1: R.randRange(6e6, 30e6), 2: R.randRange(1.5e6, 6e6), 3: R.randRange(3e5, 1.5e6) }[lvl] * D.MONEY, 1000),
      savings: 0, loans: [], portfolio: {}, sponsors: [], construction: [], fac: {},
      budgets: { admin: 1, marketing: 1, fans: 1, scouting: 1, trainorg: 1 },
      tickets: { 1: { steh: 14, sitz: 28, vip: 150 }, 2: { steh: 10, sitz: 18, vip: 80 }, 3: { steh: 7, sitz: 12, vip: 40 } }[lvl],
      tactic: { formation: R.pick(['6:0', '6:0', '5:1', '3:2:1', '4:2']), style: 1, pressing: 1, tempo: 1 },
      lineup: [], bench: [], captain: null, pen: null, fk: null, corner: null,
      training: 'technik', trainingBonus: 0, coach: W.genCoach(30 + tier * 65, lvl), rivals: [], stadiumName: row[9] || ((row[1].length < 12 ? row[1] : row[2]) + '-Halle'),
      history: [], titles: { league: 0, cup: 0, promo: 0 }, legends: [], records: { attendance: 0, transferIn: null, transferOut: null },
      fin: { season: {}, last: null, weeks: [] }, chemistry: 50, fanTrust: 60, publicImage: 50, pitch: 100, attBonus: 0, dealHistory: [], commitments: [], dealLast: {}, attendanceHist: [], cityAuto: true, form: [], stadiumHist: []
    };
    // Einrichtungen nach Liga/Stärke
    var sc = { 1: 0.55 + tier * 0.3, 2: 0.3 + tier * 0.3, 3: 0.08 + tier * 0.3 }[lvl];
    var capTarget = row[10] || club.fans * ({ 1: 0.8, 2: 0.85, 3: 0.9 }[lvl]);
    var stad = pickStadium(capTarget);
    club.fac.sitz = stad[0]; club.fac.steh = stad[1];
    ['dach', 'vip', 'licht', 'video', 'rasen', 'sanitaer', 'hosp', 'technik'].forEach(function (k) {
      var mx = D.facilities[k].levels.length - 1; club.fac[k] = R.clamp(Math.round(sc * mx + R.randRange(-0.6, 0.6)), 0, mx);
    });
    ['oepnv', 'strasse', 'parken', 'medizin', 'jugend', 'training', 'geschaeft'].forEach(function (k) {
      var mx = D.facilities[k].levels.length - 1; club.fac[k] = R.clamp(Math.round(1 + sc * (mx - 1) + R.randRange(-0.6, 0.6)), 1, mx);
    });
    ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'solar', 'gewerbe'].forEach(function (k) {
      var mx = D.facilities[k].levels.length - 1; var base = k === 'fanshop' || k === 'restaurant' ? 1 : 0;
      club.fac[k] = R.clamp(Math.round(base + sc * 0.75 * (mx - 1) * (k === 'hotel' || k === 'eventhalle' || k === 'gewerbe' ? 0.5 : 1) + R.randRange(-0.8, 0.3)), 0, mx);
    });
    st.clubs[club.id] = club;
    return club;
  };

  W.genSquad = function (st, club, mean) {
    var plan = [['TW', 3], ['AUS', 4], ['RUE', 7], ['KRS', 3]];
    plan.forEach(function (pp) {
      for (var i = 0; i < pp[1]; i++) {
        var starter = i < (pp[0] === 'TW' ? 1 : pp[0] === 'KRS' ? 1 : pp[0] === 'AUS' ? 2 : 3);
        var age = R.clamp(Math.round(R.gauss(26, 4)), 18, 35);
        var t = mean + (starter ? 3 : -3) + R.gauss(0, 4);
        if (age <= 20) t -= 4;
        W.genPlayer(st, pp[0], R.clamp(t, 25, 92), age, club.id);
      }
    });
    // Jugend
    for (var j = 0; j < 3; j++) W.genYouth(st, club, (club.fac.jugend || 1) - 1);
  };

  W.squad = function (st, clubId) {
    var out = [];
    for (var id in st.players) { var p = st.players[id]; if (p.clubId === clubId && !p.youth) out.push(p); }
    return out;
  };
  W.youthOf = function (st, clubId) {
    var out = [];
    for (var id in st.players) { var p = st.players[id]; if (p.clubId === clubId && p.youth) out.push(p); }
    return out;
  };
  // Ligaschlüssel eines Vereins: 1 = Bundesliga, 2 = 2. Bundesliga, 3–6 = Staffeln der 3. Liga
  W.lk = function (c) { return !c ? 1 : c.league < 3 ? c.league : 3 + (c.staffel || 0); };
  W.clubsInLeague = function (st, key) {
    return Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return W.lk(c) === key; });
  };
  // Alle Vereine einer Spielklasse (1, 2 oder 3 = alle vier Staffeln)
  W.clubsInTier = function (st, tier) {
    return Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return c.league === tier; });
  };
  W.playerName = function (p) { return p ? (p.first ? p.first + ' ' + p.last : p.last) : '—'; };
  W.shortName = function (p) { return p ? (p.first ? p.first.charAt(0) + '. ' + p.last : p.last) : '—'; };

  // ---------- Echte Spielwelt 2026/27 (Daten aus game/js/data_real.js, erzeugt von tools/build_real_db.py) ----------
  W.hasRealWorld = function () { return !!(D.real && D.real.clubs && D.real.clubs.length); };
  // Feste Pseudozufallszahl 0..1 je Spieler, damit Potenzial & Co. in jeder Karriere gleich sind
  function h01(id, salt) { var x = Math.sin(id * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); }
  W.realTier = function (t) { return R.clamp(t, 0.12, 1); };
  // Attribute so anpassen, dass die Gesamtstärke (gerundet) exakt dem Zielwert entspricht.
  W.fitOverall = function (p, target) {
    var w = D.posWeights[p.pos], keys = D.attrKeys, sw2 = R.sum(w, function (x) { return x * x; });
    for (var it = 0; it < 8; it++) {
      var d = target - W.overallFor(p, p.pos); if (Math.abs(d) < 0.05) break;
      keys.forEach(function (k, i) { p.attr[k] = R.clamp(p.attr[k] + d * w[i] / sw2, 1, 99); });
    }
    keys.forEach(function (k) { p.attr[k] = Math.round(p.attr[k]); });
    var order = keys.map(function (k, i) { return i; }).sort(function (a, b) { return w[b] - w[a]; });
    for (var g = 0; g < 40; g++) {
      var cur = Math.round(W.overallFor(p, p.pos)); if (cur === target) break;
      var dir = cur < target ? 1 : -1;
      for (var j = 0; j < order.length; j++) { var k = keys[order[j]]; if (w[order[j]] > 0 && p.attr[k] + dir >= 1 && p.attr[k] + dir <= 99) { p.attr[k] += dir; break; } }
    }
  };
  W.realRow = function (row, cols) { var c = {}; cols.forEach(function (k, i) { c[k] = row[i]; }); return c; };
  W.applyRealRating = function (p, c) {
    p.pos = c.pos; p.posDetail = c.posDetail || W.detailFor(c.pos);
    p.alt = c.alt ? String(c.alt).split(' ').filter(Boolean) : [];
    p.attr = { tec: c.tec, pas: c.pas, sho: c.sho, def: c.def, spd: c.spd, sta: c.sta, gk: c.gk };
    W.fitOverall(p, c.ovr);
    p.ovr = c.ovr;
  };
  W.importPlayer = function (st, row, cols, clubId) {
    var c = W.realRow(row, cols);
    var age = c.age, id = c.extId, ovr = c.ovr;
    var p = W.blankPlayer(st, c.pos, age, clubId);
    p.first = c.first; p.last = c.last; p.extId = id; p.nat = c.nat; p.dob = c.dob; p.height = c.height || null; p.shirt = c.num || null;
    p.realStats = c.games != null ? { games: c.games, goals: c.goals, saves: c.saves || 0 } : null;
    W.applyRealRating(p, c);
    var hid = typeof id === 'number' ? id : String(id).split('').reduce(function (a, ch) { return (a * 31 + ch.charCodeAt(0)) % 1000003; }, 7);
    var r1 = h01(hid, 1), r2 = h01(hid, 2), r3 = h01(hid, 3);
    var potAdd = age <= 18 ? 8 + r1 * 14 : age <= 20 ? 5 + r1 * 11 : age <= 22 ? 3 + r1 * 8 : age <= 24 ? 1 + r1 * 5 : age <= 26 ? r1 * 3 : 0;
    potAdd *= R.clamp((95 - ovr) / 25, 0.3, 1);
    p.pot = R.clamp(Math.round(ovr + potAdd), ovr, Math.max(ovr, 95));
    p.contract = age <= 22 ? 2 + Math.floor(r2 * 3) : age <= 29 ? 1 + Math.floor(r2 * 3) : age <= 32 ? 1 + Math.floor(r2 * 2) : 1;
    p.wage = Math.max(1500, Math.round(W.capWage(W.fairWage(p) * (0.85 + r3 * 0.3), clubId ? st.clubs[clubId] : null) / 500) * 500);
    p.value = W.marketValue(p);
    st.players[p.id] = p;
    return p;
  };
  // Echte Vereine anlegen und Kader importieren
  W.buildRealWorld = function (st) {
    var RD = D.real, cc = {}; RD.clubCols.forEach(function (k, i) { cc[k] = i; });
    var clubs = RD.clubs.map(function (r, i) {
      var row = [r[cc.name], r[cc.short], r[cc.city], r[cc.color1], r[cc.color2], r[cc.league], W.realTier(r[cc.tier]), r[cc.fans], r[cc.staffel] || 0, r[cc.hall] || null, r[cc.cap] || null];
      var club = W.makeClub(st, row, i);
      club.real = true; club.realName = r[cc.name];
      if (r[cc.logo]) club.logoUrl = r[cc.logo];
      return club;
    });
    var byName = {}; clubs.forEach(function (c) { byName[c.realName] = c; byName[c.short] = c; });
    (RD.derbies || []).forEach(function (d) { var a = byName[d[0]], b = byName[d[1]]; if (a && b && a !== b && a.rivals.indexOf(b.id) < 0) { a.rivals.push(b.id); b.rivals.push(a.id); } });
    return clubs;
  };
  W.importRealPlayers = function (st) {
    var RD = D.real, ci = RD.playerCols.indexOf('club'), seen = {}, dup = 0;
    RD.players.forEach(function (row) {
      var ext = row[0];
      if (seen[ext]) { dup++; return; } // doppelte Einträge werden ignoriert
      seen[ext] = true;
      var club = st.clubs['c' + (row[ci] + 1)];
      W.importPlayer(st, row, RD.playerCols, club.id);
    });
    // Durchschnittliche Stammspielerstärke je Spielklasse (für nachrückende/neu erzeugte Spieler)
    st.leagueMean = {};
    [1, 2, 3].forEach(function (l) {
      var cl = W.clubsInTier(st, l);
      st.leagueMean[l] = Math.round(R.avg(cl, function (c) { return R.avg(W.squad(st, c.id).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 10), function (p) { return p.ovr; }); }));
    });
    st.realWorld = { source: RD.source, season: RD.season, players: Object.keys(st.players).length, duplicatesSkipped: dup };
    st.realDataStamp = RD.stamp;
  };

  W.diffSettings = {
    einsteiger: { name: 'Einsteiger', cash: 1.6, nego: 0.85, injury: 0.7, econ: 0.8, ai: -2, events: 1 },
    normal: { name: 'Normal', cash: 1.0, nego: 1.0, injury: 1.0, econ: 1.0, ai: 0, events: 1 },
    schwer: { name: 'Schwer', cash: 0.65, nego: 1.15, injury: 1.15, econ: 1.2, ai: 2, events: 1 },
    chaos: { name: 'Chaos-Modus', cash: 1.0, nego: 1.0, injury: 1.0, econ: 1.4, ai: 0, events: 2.5 }
  };

  // Neue Welt erzeugen. opts: {seed, difficulty, mode, clubId, role, canBeFired, managerName, newClub, replaceClubId}
  W.newGame = function (opts) {
    var seed = opts.seed || (Date.now() % 2147483647);
    R.rng.seed(seed);
    var st = {
      version: 1, wageV: 2, seed: seed, rngState: 0, season: 2026, week: 0, phase: 'preseason',
      settings: { difficulty: opts.difficulty || 'normal', cheatEnabled: true, matchSpeed: 'schnell', sound: false, autoBest: true },
      clubs: {}, players: {}, leagues: {}, cup: null, nextIds: {}, news: [], inbox: [], achievements: {}, cheatUsed: false, cheatClicks: 0,
      market: { stocks: {}, crypto: {} }, savingsRate: 0.02, history: [], hall: { champions: [], cups: [], topScorers: [], records: {} },
      transfers: [], allTime: {}, pendingEvent: null, deal: null, dealsScheduled: [], dealLog: [], lastResults: null, seasonLog: []
    };
    var diff = W.diffSettings[st.settings.difficulty];
    var real = true; // ANWURF! kennt nur die echte Spielwelt (Bundesliga, 2. Bundesliga, 3. Liga in vier Staffeln)
    st.world = 'real';
    if (real) W.buildRealWorld(st);
    else {
      D.clubs.forEach(function (row, i) { W.makeClub(st, row, i); });
      // Rivalitäten
      var byShort = {}; Object.keys(st.clubs).forEach(function (k) { byShort[st.clubs[k].short] = st.clubs[k]; });
      D.derbies.forEach(function (d) { var a = byShort[d[0]], b = byShort[d[1]]; if (a && b) { a.rivals.push(b.id); b.rivals.push(a.id); } });
    }

    // Eigener Verein gründen
    var userClub = null;
    if (opts.mode === 'found') {
      var rep = st.clubs[opts.replaceClubId] || W.clubsInTier(st, 3)[0];
      var nc = opts.newClub || {};
      var keepId = rep.id;
      var row = [nc.name || 'HC Neustadt', nc.short || 'Neustadt', nc.city || 'Neustadt', nc.color1 || '#16a34a', nc.color2 || '#ffffff', 3, 0.18, 800, rep.staffel || 0, null, 300];
      rep.rivals.forEach(function (rid) { var r = st.clubs[rid]; r.rivals = r.rivals.filter(function (x) { return x !== keepId; }); });
      var club = W.makeClub(st, row, parseInt(keepId.slice(1), 10) - 1);
      club.crest = { shape: nc.crestShape || 0, symbol: nc.crestSymbol || 0 };
      if (nc.crestImage) club.crestImage = nc.crestImage;
      club.stadiumName = nc.stadium || ('Sporthalle ' + club.short);
      club.reputation = 15; club.tradition = 5;
      Object.keys(club.fac).forEach(function (k) { var f = D.facilities[k]; club.fac[k] = f.min || 0; });
      club.fac.steh = 1; club.fac.sitz = 0; club.fac.restaurant = 1; // Würstchenbude
      club.cash = R.round((nc.capital || 150000), 1000);
      club.founded = true;
      club.coach = W.genCoach(35, 3);
      userClub = club;
    } else {
      userClub = st.clubs[opts.clubId] || W.clubsInTier(st, 3)[0];
    }

    // Kader erzeugen (echte Welt: importierte Spieler; ein neu gegründeter Verein bekommt einen erzeugten Kader)
    if (real) {
      W.importRealPlayers(st);
      if (opts.mode === 'found') {
        // Der Kader des ersetzten Vereins wird vertragslos (Transfermarkt), damit keine Spieler verloren gehen
        Object.keys(st.players).forEach(function (id) { var p = st.players[id]; if (p.clubId === userClub.id) { p.clubId = null; p.freeSince = st.season; } });
      }
    }
    // Kleine Kader (z. B. zweite Mannschaften) auf mindestens 15 Spieler auffüllen
    if (real) Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k]; if (c.founded) return;
      var sq = W.squad(st, c.id), need = { TW: 2, AUS: 4, RUE: 5, KRS: 2 };
      var mean = R.avg(sq.slice().sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 10), function (p) { return p.ovr; }) - 5;
      Object.keys(need).forEach(function (pos) { var have = sq.filter(function (p) { return p.pos === pos; }).length; while (have++ < need[pos]) W.genPlayer(st, pos, R.clamp(R.gauss(mean, 3), 30, 85), R.randInt(18, 24), c.id); });
      while (W.squad(st, c.id).length < 15) W.genPlayer(st, R.pick(['RUE', 'AUS', 'KRS', 'RUE']), R.clamp(R.gauss(mean, 3), 30, 85), R.randInt(18, 24), c.id);
    });
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      var mean = 40 + c.tier * 38 + (c === userClub ? 0 : diff.ai);
      if (c.founded) mean = real ? st.leagueMean[3] - 7 : 47;
      if (!real || c.founded) W.genSquad(st, c, mean);
      ['haupt', 'trikot', 'aermel', 'ausruester', 'bande'].forEach(function (cat) { var s = W.genSponsor(st, c, cat); if (c.founded && cat !== 'haupt' && cat !== 'bande') return; c.sponsors.push(s); });
    });
    userClub.cash = Math.round(userClub.cash * (opts.mode === 'found' ? 1 : diff.cash));

    // Ligen
    D.leagueKeys.forEach(function (l) { st.leagues[l] = { level: D.leagueTier[l], key: l, name: D.leagueNames[l], clubIds: W.clubsInLeague(st, l).map(function (c) { return c.id; }), fixtures: [] }; });

    // Märkte
    R.econ.ensureMarkets(st); // inkl. 52 Wochen Kursverlauf

    var role = opts.role || 'manager';
    st.manager = {
      name: opts.managerName || 'Manager', clubId: userClub.id, role: role,
      canBeFired: opts.mode === 'found' ? false : !!opts.canBeFired, founder: opts.mode === 'found',
      reputation: opts.mode === 'found' ? 25 : R.clamp(Math.round(userClub.reputation * 0.6), 15, 60),
      history: [{ clubId: userClub.id, club: userClub.name, from: st.season, to: null, role: role, titles: [] }],
      unemployed: false, offers: [], pressure: 0, warnings: 0, firedReason: null, jobWeeks: 0, seasonsPlayed: 0,
      boardTarget: null, trust: 60
    };
    userClub.userControlled = true;
    st.rngState = R.rng.state;
    R.season.startSeason(st, true);
    st.rngState = R.rng.state;
    return st;
  };
})(RFM);
