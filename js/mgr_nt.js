// Managerkarriere 3.0 – Nationalmannschaften (gemeinsam für ANPFIFF und ANWURF)
// Spieler aller Vereine werden nach Nationalität, Leistung, Form, Spielpraxis, Ligastärke, Potenzial, Position, Alter,
// Fitness und früheren Länderspielen nominiert. Nationaltrainer haben Stile; ein Trainerwechsel ändert die Rangordnung.
// Abstellungen folgen einem gemeinsamen Kalender (Länderspielfenster nach Spieltagen, Turniere in den Pausen),
// Länderspiele der eigenen Spieler laufen über die vorhandene Spielsimulation. Danach: Rückkehrbericht mit Entscheidungen.
(function (R) {
  'use strict';
  var W = R.world, S = R.season, E = R.econ || R.economy, D = R.data, M = R.match, T = R.transfers, MX = R.mx, NT = R.nt;
  if (!MX || !NT) return;
  var MN = R.mnt = {}, HB = MX.HB, clamp = MX.clamp, hash = MX.hash, hr = MX.hr, tick = MX.tick, pname = MX.pname;
  // Rohdaten-Nationalitäten (echte Datenbank) → Verbandskürzel
  var MAP = { Germany: 'DE', France: 'FR', Austria: 'AT', Denmark: 'DK', Holland: 'NL', Netherlands: 'NL', Japan: 'JP', Turkey: 'TR', 'Türkiye': 'TR', Belgium: 'BE', Switzerland: 'CH', Poland: 'PL', Croatia: 'HR', 'United States': 'US', Sweden: 'SE', Nigeria: 'NG', Morocco: 'MA', Norway: 'NO', 'Korea Republic': 'KR', Portugal: 'PT', Brazil: 'BR', Italy: 'IT', Serbia: 'RS', England: 'EN', Finland: 'FI', Spain: 'ES', 'Czech Republic': 'CZ', Czechia: 'CZ', Greece: 'GR', Hungary: 'HU', Argentina: 'AR', Albania: 'AL', Iceland: 'IS', Australia: 'AU', 'Republic of Ireland': 'IE', Slovenia: 'SI', Scotland: 'SC', "Côte d'Ivoire": 'CI', Wales: 'WA', Ukraine: 'UA', Romania: 'RO', Slovakia: 'SK', Uruguay: 'UY', Colombia: 'CO', Ecuador: 'EC', Mexico: 'MX', Canada: 'CA', Iran: 'IR', 'Saudi Arabia': 'SA', Senegal: 'SN', Egypt: 'EG',
    DEU: 'DE', DNK: 'DK', SWE: 'SE', HRV: 'HR', ISL: 'IS', NLD: 'NL', NOR: 'NO', CZE: 'CZ', CHE: 'CH', AUT: 'AT', ESP: 'ES', SVN: 'SI', ITA: 'IT', POL: 'PL', FRA: 'FR', SRB: 'RS', HUN: 'HU', BIH: 'BA', EGY: 'EG', FRO: 'FO', UKR: 'UA', LTU: 'LT', ROU: 'RO', MNE: 'ME', GRC: 'GR', BEL: 'BE', DZA: 'DZ', TUR: 'TR', PRT: 'PT', TUN: 'TN', MKD: 'MK', BRA: 'BR', USA: 'US', SVK: 'SK', QAT: 'QA', JPN: 'JP', KOR: 'KR', ARG: 'AR', CHL: 'CL', BHR: 'BH' };
  // Verbände ohne Turnierkalender (nur Qualifikation/Testspiele, Schnellsimulation)
  var EXTRA = { Kosovo: ['XK', 'Kosovo', 0.6], Ghana: ['GH', 'Ghana', 0.7], 'Bosnia and Herzegovina': ['BA', 'Bosnien-Herzegowina', 0.66], Luxembourg: ['LU', 'Luxemburg', 0.5], Algeria: ['DZ', 'Algerien', 0.7], Georgia: ['GE', 'Georgien', 0.66], Mali: ['ML', 'Mali', 0.65], Bulgaria: ['BG', 'Bulgarien', 0.6], Tunisia: ['TN', 'Tunesien', 0.66], 'Congo DR': ['CD', 'DR Kongo', 0.63], Cameroon: ['CM', 'Kamerun', 0.7], ISR: ['IL', 'Israel', 0.55], LVA: ['LV', 'Lettland', 0.5], RUS: ['RU', 'Russland', 0.7], LUX: ['LU', 'Luxemburg', 0.45], CUB: ['CU', 'Kuba', 0.45], IRN: ['IR', 'Iran', 0.5], FIN: ['FI', 'Finnland', 0.45], EST: ['EE', 'Estland', 0.45] };
  var EX_BY = {}; Object.keys(EXTRA).forEach(function (k) { EX_BY[EXTRA[k][0]] = { code: EXTRA[k][0], name: EXTRA[k][1], q: EXTRA[k][2], conf: 'EU', extra: true }; });
  MN.nat = function (code) { return NT.nat(code) || EX_BY[code] || null; };
  MN.natName = function (code) { var n = MN.nat(code); return n ? n.name : code; };
  // Nationalität eines Spielers (echte Daten oder deterministisch für die fiktive Welt)
  MN.code = function (st, p) {
    if (!p) return null; if (p.ntc) return p.ntc;
    var c = null;
    if (p.nat) { c = MAP[p.nat] || (EXTRA[p.nat] && EXTRA[p.nat][0]) || null; if (!c && /^[A-Z]{2}$/.test(p.nat)) c = p.nat; if (!c && NT.byName(p.nat)) c = NT.byName(p.nat).code; if (!c) c = 'XX'; }
    else {
      var club = p.clubId && st.clubs[p.clubId], lg = club ? club.league : 2, share = HB ? ({ 1: 0.35, 2: 0.2, 3: 0.1 }[lg] || 0.15) : ({ 1: 0.45, 2: 0.3, 3: 0.15 }[lg] || 0.2);
      if (club && club.foreign) c = club.country || 'XX';
      else if (hr('nat' + p.id + (st.seed || 0), 1) >= share) c = 'DE';
      else { var pool = NT.NATIONS.filter(function (n) { return n.code !== 'DE'; }), wsum = 0; pool.forEach(function (n) { wsum += (n.conf === 'EU' ? 3 : 1) * n.q; }); var r = hr('nat' + p.id + (st.seed || 0), 2) * wsum; for (var i = 0; i < pool.length; i++) { r -= (pool[i].conf === 'EU' ? 3 : 1) * pool[i].q; if (r <= 0) { c = pool[i].code; break; } } c = c || 'AT'; }
    }
    p.ntc = c; return c;
  };

  // ---------- Zustand ----------
  MN.ensure = function (st) {
    if (!st.mnt) st.mnt = { v: 1, s: null, coaches: {}, qp: {}, tour: null, tours: [], pl: {}, away: {}, skip: {}, reports: [], sq: null, cur: null, champs: [], coachRel: {}, manual: {}, seasonCaps: 0, log: [] };
    var m = st.mnt; if (m.s !== st.season) { m.s = st.season; m.seasonCaps = 0; m.qp = m.qp || {}; }
    return m;
  };
  MN.coach = function (st, code) { var m = MN.ensure(st); if (!m.coaches[code]) { var ks = Object.keys(NT.STYLES), s = 'nc' + code + st.season + (st.seed || 0); m.coaches[code] = { name: MX.pk(['Hans', 'Rudi', 'Jo', 'Thomas', 'Ralf', 'Markus', 'Christian', 'Uwe', 'Lars', 'Mikkel', 'Dario', 'Ivan', 'Luis', 'Pierre'], s) + ' ' + MX.pk(['Brehm', 'Kessler', 'Lindner', 'Albrecht', 'Hauser', 'Sommer', 'Nielsen', 'Novak', 'Rossi', 'Dubois', 'Fernández', 'Kovač', 'Larsen', 'Petersen'], s + 'l'), style: MX.pk(ks, s + 'st'), since: st.season, sys: hash(s) % 6 }; } return m.coaches[code]; };
  MN.P = function (st, pid) { var m = MN.ensure(st); return m.pl[pid] || (m.pl[pid] = { caps: 0, goals: 0, assists: 0, rsum: 0, starts: 0, y: {}, ycaps: 0, bench: 0, xp: 0, fame: 0, hist: [], ms: {}, code: null }); };
  MN.squadCfg = function () { return NT.CFG.squad; };
  MN.lvls = function () { return HB ? ['U21', 'U19', 'U17'] : ['U21', 'U19', 'U17']; };
  MN.youthLvl = function (p) { var ls = MN.lvls().slice().reverse(), A = NT.CFG.youthAge; for (var i = 0; i < ls.length; i++) if (p.age <= A[ls[i]]) return ls[i]; return null; };

  // ---------- Nominierung ----------
  MN.score = function (st, p, code, lvl) {
    var cc = MN.coach(st, code), club = p.clubId && st.clubs[p.clubId], pr = MN.P(st, p.id), sty = cc.style;
    var apps = p.stats ? p.stats.apps : 0, maxApps = Math.max(1, st.phase === 'season' ? st.week : 8), share = clamp(apps / maxApps, 0, 1);
    if (st.phase !== 'season' && st.week < 3) share = 0.6; // Saisonstart: Praxis noch nicht messbar
    var avg = apps ? p.stats.rsum / apps : 6.5, rtF = (avg - (HB ? 7.0 : 6.6)) * (sty === 'form' ? 2.6 : 1.4);
    var lg = club ? ({ 1: 2, 2: -2.5, 3: -6.5 }[club.league] || -4) : -8; if (club && club.foreign) lg = 1;
    var v = p.ovr + (p.form - 6) * (sty === 'form' ? 2.2 : 1.2) + (share * 4 - 2) + lg + rtF;
    if (lvl && lvl !== 'A') v += (p.pot - p.ovr) * 0.3; else v += Math.max(0, p.pot - p.ovr) * 0.06;
    if (p.fitness < 75) v -= 3;
    if (sty === 'jung') v += p.age <= 23 ? 2.2 : p.age >= 31 ? -2.4 : 0;
    if (sty === 'erfahrung') v += Math.min(3, pr.caps / 12) + (p.age <= 21 ? -2 : 0);
    if (sty === 'system') v += ((hash('sys' + cc.sys + p.id) % 9) - 4) * 0.55;
    if (pr.caps >= 3 && pr.rsum) v += (pr.rsum / Math.max(1, pr.caps) - (HB ? 7.2 : 6.7)) * 1.6;
    v += Math.min(2.5, pr.caps / 20);
    if (pr.care === st.season) v -= 1.5; // Absprache mit dem Verband (Schonung)
    v += ((hash('nw' + p.id + st.season + (st.week || 0) + (st.prep || 0)) % 100) / 100 - 0.5) * 2.4;
    return v;
  };
  MN.target = function (st, code, lvl) { var n = MN.nat(code) || { q: 0.55 }; var ref = NT.ref(st), t = ref + (n.q - 0.8) * (HB ? 15 : 24); if (lvl && lvl !== 'A') { var a = NT.CFG.youthAge[lvl] || 21; t = t - (22 - a) * (HB ? 3.2 : 3.6) - 4; } return t; };
  function natPools(st) { var by = {}; Object.keys(st.players).forEach(function (k) { var p = st.players[k]; if (!p || !p.clubId || p.retired || p.ntPseudo || p.foreignClub) return; var c = MN.code(st, p); if (!c || c === 'XX') return; (by[c] = by[c] || []).push(p); }); return by; }
  MN.nominate = function (st, why) { // alle Nationen, A und Jugend; Ergebnis: m.sq = { code: { A:[pid], U21:[...] } }
    var m = MN.ensure(st), pools = natPools(st), sq = {}, cfg = MN.squadCfg(), job = st.mx && st.mx.ntJob;
    Object.keys(pools).forEach(function (code) {
      var pool = pools[code].filter(function (p) { return !(p.inj && p.inj.weeks > 1) && !p.ntRetired; }), out = { A: [] };
      var cut = MN.target(st, code, 'A') - 1.5, sc = pool.filter(function (p) { return !p.youth || p.ovr >= cut; }).map(function (p) { return { p: p, v: MN.score(st, p, code, 'A') }; }).filter(function (x) { return x.v >= cut; });
      if (job && job.code === code && m.manual[code] && m.manual[code].length) out.A = m.manual[code].filter(function (id) { var p = st.players[id]; return p && !(p.inj && p.inj.weeks > 1); });
      else Object.keys(cfg).forEach(function (pos) { sc.filter(function (x) { return x.p.pos === pos; }).sort(function (a, b) { return b.v - a.v; }).slice(0, cfg[pos]).forEach(function (x) { out.A.push(x.p.id); }); });
      MN.lvls().forEach(function (lvl) {
        var a = NT.CFG.youthAge[lvl], yc = MN.target(st, code, lvl) - 1, lo = lvl === 'U21' ? (NT.CFG.youthAge.U19 + 1) : lvl === 'U19' ? NT.CFG.youthAge.U17 + 1 : 15;
        var ys = pool.filter(function (p) { return p.age <= a && p.age >= lo && out.A.indexOf(p.id) < 0; }).map(function (p) { return { p: p, v: MN.score(st, p, code, lvl) }; }).filter(function (x) { return x.v >= yc; }).sort(function (x, y) { return y.v - x.v; }).slice(0, HB ? 16 : 23);
        if (ys.length) out[lvl] = ys.map(function (x) { return x.p.id; });
      });
      if (out.A.length || Object.keys(out).length > 1) sq[code] = out;
    });
    var firstEver = m.sqT == null; m.sq = sq; m.sqT = tick(st); m.sqWhy = why || '';
    // Erstnominierungen merken (für Ereignisse/Berichte)
    var uc = S.userClub(st);
    Object.keys(sq).forEach(function (code) { Object.keys(sq[code]).forEach(function (lvl) { sq[code][lvl].forEach(function (pid) { var pr = MN.P(st, pid); pr.code = code; if (lvl === 'A' && !pr.ms.call) { pr.ms.call = { s: st.season, t: tick(st) }; if (firstEver) pr.ms.est = 1; var p = st.players[pid]; if (!firstEver && uc && p && p.clubId === uc.id && st.mx) { MX.event(st, 'nt_first', { pid: pid, code: code }); MX.chron(st, '📨', 'Erstmals Nationalspieler', pname(p) + ' wird erstmals für ' + MN.natName(code) + ' nominiert.', 2, 'nominierung'); } } if (lvl !== 'A' && !pr.y[lvl]) { pr.y[lvl] = { caps: 0, goals: 0, s: st.season }; var py = st.players[pid]; if (uc && py && py.clubId === uc.id && st.mx) MX.event(st, 'nt_youth', { pid: pid, code: code, lvl: lvl }); } }); }); });
    return sq;
  };
  MN.mine = function (st) { // eigene Nominierte: [{ p, code, lvl }]
    var m = MN.ensure(st), uc = S.userClub(st), out = []; if (!uc || !m.sq) return out;
    Object.keys(m.sq).forEach(function (code) { Object.keys(m.sq[code]).forEach(function (lvl) { m.sq[code][lvl].forEach(function (pid) { var p = st.players[pid]; if (p && p.clubId === uc.id) out.push({ p: p, code: code, lvl: lvl }); }); }); });
    return out;
  };
  MN.isCalled = function (st, pid) { var m = MN.ensure(st); if (!m.sq) return null; for (var c in m.sq) for (var l in m.sq[c]) if (m.sq[c][l].indexOf(pid) >= 0) return { code: c, lvl: l }; return null; };

  // ---------- Kalender ----------
  MN.isWindow = function (st, week) { return NT.CFG.windows.indexOf(week) >= 0; };
  MN.winKind = function (st) { // Art der Fensterspiele
    var tourNext = NT.tourFor(st.season + 1, 'summer'), tourThis = NT.tourFor(st.season, 'summer');
    if (HB) return 'qual';
    if (tourNext) return 'qual';
    return tourThis ? 'league' : 'league';
  };
  function opp(st, code, salt) { var own = MN.nat(code) || { conf: 'EU' }, l = NT.NATIONS.filter(function (n) { return n.code !== code && (n.conf === own.conf || hr(salt, 9) < 0.25); }); if (!l.length) l = NT.NATIONS.filter(function (n) { return n.code !== code; }); return l[hash(salt + code + st.season) % l.length].code; }
  function qsim(qa, qb, home, salt) { // Schnellsimulation (Verbände ohne eigene Spieler)
    var d = qa - qb + (home ? 0.03 : 0), r1 = hr(salt, 1), r2 = hr(salt, 2);
    if (HB) { var base = 27, ga = Math.round(base + d * 30 + (r1 - 0.5) * 8), gb = Math.round(base - d * 30 + (r2 - 0.5) * 8); return [Math.max(15, ga), Math.max(15, gb)]; }
    function pois(l, u) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= (u = (u * 9301 + 49297) % 233280) / 233280; } while (p > L && k < 9); return k - 1; }
    return [pois(clamp(1.35 * Math.exp(d * 2.4), 0.2, 4), Math.floor(r1 * 233280)), pois(clamp(1.35 * Math.exp(-d * 2.4), 0.2, 4), Math.floor(r2 * 233280))];
  }
  MN.qsim = qsim;

  // ---------- Länderspiel mit eigenen Spielern über die vorhandene Spielsimulation ----------
  function cloneInto(st, team, pids) {
    var orig = team.squadIds.slice(), clones = [], ids = team.squadIds.slice();
    pids.forEach(function (pid) {
      var p = st.players[pid]; if (!p) return;
      var c = JSON.parse(JSON.stringify(p)); c.id = 'mxc_' + pid; c.clubId = team.id; c.ntPseudo = true; c.foreignClub = true; c.ntAway = false; c.inj = null; c.susp = 0; c.realId = pid; c.youth = false;
      Object.defineProperty(st.players, c.id, { enumerable: false, configurable: true, writable: true, value: c });
      var same = ids.map(function (id) { return st.players[id]; }).filter(function (x) { return x && !x.realId && x.pos === p.pos; }).sort(function (a, b) { return a.ovr - b.ovr; })[0]
        || ids.map(function (id) { return st.players[id]; }).filter(function (x) { return x && !x.realId; }).sort(function (a, b) { return a.ovr - b.ovr; })[0];
      if (same) ids[ids.indexOf(same.id)] = c.id; else ids.push(c.id);
      clones.push(c);
    });
    team.squadIds = ids; team.lineup = null; team.manualLineup = false;
    return { orig: orig, clones: clones };
  }
  function restore(st, team, cl) { team.squadIds = cl.orig; cl.clones.forEach(function (c) { delete st.players[c.id]; }); }
  MN.playEngine = function (st, code, oppCode, home, label) {
    if (!NT.nat(code) || !NT.nat(oppCode)) return null;
    var m = MN.ensure(st), a = NT.team(st, code, 'A'), b = NT.team(st, oppCode, 'A'); NT.refresh(st, a); NT.refresh(st, b);
    var mine = ((m.sq[code] || {}).A || []).filter(function (pid) { return st.players[pid] && !st.players[pid].inj; }), mineB = ((m.sq[oppCode] || {}).A || []).filter(function (pid) { return st.players[pid] && !st.players[pid].inj; });
    var ca = cloneInto(st, a, mine), cb = cloneInto(st, b, mineB), res;
    try {
      var mm = M.create(st, home ? a.id : b.id, home ? b.id : a.id, { comp: 'friendly', neutral: !home, extraTime: false }); mm.st = st;
      var start = {}; [0, 1].forEach(function (s) { mm.onPitch[s].forEach(function (id) { if (id) start[id] = 1; }); });
      M.simulate(mm);
      var sa = home ? 0 : 1; res = { score: [mm.score[sa], mm.score[1 - sa]], pl: {} };
      ca.clones.concat(cb.clones).forEach(function (c) {
        var s = mm.played[c.id]; res.pl[c.realId] = { played: s != null, start: !!start[c.id], rt: mm.rating[c.id] || null, g: mm.goals[c.id] || 0, a: mm.assists[c.id] || 0, inj: mm.injured[c.id] || null, side: s, fit: mm.fit[c.id] };
      });
    } finally { restore(st, a, ca); restore(st, b, cb); }
    return res;
  };
  // Einzelleistung bei Schnellsimulation (Jugend, Verbände ohne Turnierdaten)
  function quickPlayer(st, p, code, lvl, rank, salt, won) {
    var xi = MX.TERM.xi, start = rank < xi && hr(salt, 3) < 0.88, played = start || hr(salt, 4) < 0.55;
    if (!played) return { played: false, start: false, rt: null, g: 0, a: 0, inj: null };
    var cut = MN.target(st, code, lvl), base = HB ? 7.0 : 6.6, rt = clamp(Math.round((base + (p.ovr - cut) / 9 + (hr(salt, 5) - 0.5) * 1.6 + (won ? 0.3 : -0.2)) * 10) / 10, 3.5, 9.8);
    var gp = HB ? ({ TW: 0, KRS: 2.5, RUE: 3.2, AUS: 3.4 }[p.pos] || 2.4) : ({ TW: 0, ABW: 0.05, MIT: 0.16, STU: 0.42 }[p.pos] || 0.1), g = 0, r = hr(salt, 6);
    if (HB) g = Math.round(gp * (start ? 1 : 0.5) * (0.5 + r)); else g = r < gp * (start ? 1 : 0.4) ? (r < gp * 0.15 ? 2 : 1) : 0;
    var inj = hr(salt, 7) < (HB ? 0.012 : 0.015) * (1 + (p.risk || 0)) ? { type: MX.pk(['Muskelverhärtung', 'Bänderdehnung', 'Prellung', 'Zerrung'], salt), weeks: 1 + (hash(salt) % 4) } : null;
    return { played: true, start: start, rt: rt, g: g, a: HB ? Math.round(r * 3) : (hr(salt, 8) < 0.12 ? 1 : 0), inj: inj };
  }

  // ---------- Ein Länderspielfenster (zwei Spiele je Verband) ----------
  MN.runWindow = function (st, label) {
    var m = MN.ensure(st), uc = S.userClub(st), kind = MN.winKind(st), rep = { k: 'return', t: tick(st), s: st.season, w: st.week, label: label || ('Länderspielpause nach dem ' + st.week + '. Spieltag'), items: [], games: [] };
    if (!m.sq) MN.nominate(st, 'Fenster');
    var codes = Object.keys(m.sq), stats = {}; // pid → Liste
    codes.forEach(function (code) {
      var nat = MN.nat(code); if (!nat) return;
      var hasMine = uc && Object.keys(m.sq[code]).some(function (l) { return m.sq[code][l].some(function (id) { var p = st.players[id]; return p && p.clubId === uc.id; }); });
      for (var g = 0; g < 2; g++) {
        var salt = 'w' + st.season + '-' + st.week + '-' + code + g, o = opp(st, code, salt), home = g === 0, res = null, lab = (kind === 'qual' ? 'Qualifikation' : kind === 'league' ? NT.CFG.leagueName : 'Testspiel') + ' gegen ' + MN.natName(o) + (home ? ' (H)' : ' (A)');
        if (hasMine && (m.sq[code].A || []).length) res = MN.playEngine(st, code, o, home, lab);
        if (!res) { var sc = qsim(nat.q, (MN.nat(o) || { q: .6 }).q, home, salt); res = { score: sc, pl: {}, quick: true }; }
        var won = res.score[0] > res.score[1], lost = res.score[0] < res.score[1];
        if (kind === 'qual') m.qp[code] = (m.qp[code] || 0) + (won ? 3 : lost ? 0 : 1);
        var A = m.sq[code].A || [];
        A.forEach(function (pid, i) { var p = st.players[pid]; if (!p) return; var r = res.pl[pid] || quickPlayer(st, p, code, 'A', i % Math.max(1, A.length), salt + pid, won); (stats[pid] = stats[pid] || []).push({ lvl: 'A', code: code, opp: o, home: home, res: res.score, won: won, lost: lost, r: r, label: lab, engine: !res.quick }); });
        MN.lvls().forEach(function (lvl) { var Y = m.sq[code][lvl] || []; if (!Y.length) return; var ysc = qsim(nat.q, (MN.nat(o) || { q: .6 }).q, home, salt + lvl), yw = ysc[0] > ysc[1]; Y.forEach(function (pid, i) { var p = st.players[pid]; if (!p) return; (stats[pid] = stats[pid] || []).push({ lvl: lvl, code: code, opp: o, home: home, res: ysc, won: yw, lost: ysc[0] < ysc[1], r: quickPlayer(st, p, code, lvl, i, salt + lvl + pid, yw), label: lvl + ' gegen ' + MN.natName(o) }); }); });
        if (hasMine) rep.games.push({ code: code, label: lab, res: res.score, engine: !res.quick });
      }
    });
    Object.keys(stats).forEach(function (pid) { var it = MN.applyGames(st, pid, stats[pid]); if (it && uc && st.players[pid] && st.players[pid].clubId === uc.id) rep.items.push(it); });
    MN.finishReport(st, rep);
    return rep;
  };
  // Wirkung der Länderspiele auf einen Spieler (kurzfristige Form ≠ langfristige Entwicklung)
  MN.applyGames = function (st, pid, list) {
    var p = st.players[pid]; if (!p || !list.length) return null;
    var pr = MN.P(st, pid), uc = S.userClub(st), mineClub = uc && p.clubId === uc.id;
    var it = { pid: pid, name: pname(p), code: list[0].code, lvl: list[0].lvl, games: [], mins: 0, goals: 0, assists: 0, rts: [], fit0: Math.round(p.fitness), form0: p.form, mor0: Math.round(p.morale), val0: p.value, inj: null, states: [], xp0: pr.xp, starts: 0, apps: 0 };
    list.forEach(function (x) {
      var r = x.r; it.games.push({ label: x.label, res: x.res, won: x.won, lost: x.lost, played: r.played, start: r.start, rt: r.rt, g: r.g, a: r.a });
      if (!r.played) { if (x.lvl === 'A') pr.bench++; p.morale = clamp(p.morale - 1.5, 0, 100); return; }
      it.apps++; if (r.start) it.starts++;
      var mins = r.start ? MX.TERM.min : Math.round(MX.TERM.min * (HB ? 0.4 : 0.25)); it.mins += mins; it.goals += r.g; it.assists += r.a; if (r.rt) it.rts.push(r.rt);
      if (x.lvl === 'A') { pr.caps++; pr.goals += r.g; pr.assists += r.a; pr.rsum += r.rt || 6.5; if (r.start) pr.starts++; pr.bench = 0; st.mnt.seasonCaps += mineClub ? 1 : 0; if (!pr.ms.debut) { pr.ms.debut = { s: st.season, t: tick(st), opp: x.opp }; if (mineClub && st.mx && !pr.ms.est) { MX.chron(st, '🎶', 'Länderspieldebüt', pname(p) + ' debütiert für ' + MN.natName(x.code) + ' gegen ' + MN.natName(x.opp) + '.', 2, 'nominierung'); MX.event(st, 'nt_debut', { pid: pid }); } } }
      else { var y = pr.y[x.lvl] = pr.y[x.lvl] || { caps: 0, goals: 0, s: st.season }; y.caps++; y.goals += r.g; pr.ycaps++; }
      pr.hist.unshift({ s: st.season, t: tick(st), lvl: x.lvl, opp: x.opp, res: x.res, rt: r.rt, g: r.g }); if (pr.hist.length > 40) pr.hist.length = 40;
      // Belastung: Spiel + Reise; kurzfristige Form und Moral
      p.fitness = clamp(p.fitness - (r.start ? (HB ? 9 : 8) : 4) - 2, 25, 100);
      if (r.rt) p.form = clamp(p.form * 0.8 + (r.rt - 1) * 0.2 * 10 / 9, 1, 10);
      p.morale = clamp(p.morale + (x.won ? 3 : x.lost ? -3 : 0) + (r.g ? 2 : 0), 0, 100);
      // Erfahrung: wiederholte hochwertige Spielpraxis entwickelt (kein Sprung nach einem guten Spiel)
      if (x.lvl === 'A' && r.rt) pr.xp += (r.rt >= (HB ? 7.6 : 7.0) ? 1 : 0.4) * (r.start ? 1 : 0.5);
      pr.fame = clamp(pr.fame + (x.lvl === 'A' ? 0.8 : 0.3) + r.g * (HB ? 0.12 : 0.9) + (r.rt && r.rt >= (HB ? 8 : 7.5) ? 0.8 : 0), 0, 100);
      if (r.inj && !p.inj) { var wk = Math.max(1, Math.min(8, r.inj.weeks || 2)); p.inj = { type: (r.inj.type || 'Verletzung') + ' (Länderspiel)', weeks: wk, total: wk }; it.inj = p.inj; if (mineClub && st.mx) MX.event(st, 'nt_injury', { pid: pid, weeks: wk }); }
    });
    while (pr.xp >= 6) { pr.xp -= 6; if (p.age <= 28 && p.ovr < p.pot) { var keys = D.attrKeys.filter(function (k) { return k !== 'gk' || p.pos === 'TW'; }), best = keys.sort(function (a, b) { return (D.posWeights[p.pos][D.attrKeys.indexOf(b)] || 0) - (D.posWeights[p.pos][D.attrKeys.indexOf(a)] || 0); })[0]; p.attr[best] = Math.min(99, p.attr[best] + 1); W.recalc(p); it.dev = (it.dev || 0) + 1; } }
    p.value = W.marketValue(p);
    it.fit1 = Math.round(p.fitness); it.form1 = p.form; it.mor1 = Math.round(p.morale); it.val1 = p.value; it.rt = it.rts.length ? Math.round(R.avg(it.rts, function (x) { return x; }) * 10) / 10 : null;
    // Rückkehrzustände
    var won = it.games.filter(function (g) { return g.won; }).length, lost = it.games.filter(function (g) { return g.lost; }).length;
    if (it.inj) it.states.push('verletzt');
    if (it.fit1 < 70 && it.apps >= 2) it.states.push('erschöpft');
    if (it.apps === 0 && it.lvl === 'A') it.states.push('frustriert');
    if ((it.goals >= (HB ? 10 : 2) || (it.rt && it.rt >= (HB ? 8.2 : 7.8))) && !it.inj) it.states.push('gefeiert');
    if (lost >= 2 && !won && it.apps) it.states.push('enttäuscht');
    if (!it.states.length) it.states.push('normal');
    return it;
  };
  MN.finishReport = function (st, rep) {
    var m = MN.ensure(st); rep.id = 'r' + tick(st) + '_' + (m.reports.length); rep.seen = false; rep.done = {};
    if (!rep.items.length && !rep.games.length) return rep;
    m.reports.unshift(rep); if (m.reports.length > 14) m.reports.length = 14;
    if (st.mx) {
      rep.items.forEach(function (it) {
        if (it.states.indexOf('gefeiert') >= 0) { MX.event(st, 'nt_hero', { pid: it.pid }); MX.feedAdd(st, { who: 'Fans', txt: it.name + ' glänzt für ' + MN.natName(it.code) + '! ' + (it.goals ? it.goals + (HB ? ' Tore' : ' Tor' + (it.goals > 1 ? 'e' : '')) : 'Note ' + it.rt) + '.', kind: 'fan' }); }
        if (it.states.indexOf('frustriert') >= 0) { var pr = MN.P(st, it.pid); if (pr.bench >= 4) MX.event(st, 'nt_bench', { pid: it.pid }); }
        if (it.states.indexOf('erschöpft') >= 0) MX.event(st, 'nt_tired', { pid: it.pid });
      });
    }
    return rep;
  };
  MN.unseen = function (st) { var m = st.mnt; return m ? m.reports.filter(function (r) { return !r.seen; })[0] || null : null; };
  // Vorab: Abstellungsbericht
  MN.preview = function (st, label, weeks) {
    var m = MN.ensure(st), mine = MN.mine(st); if (!mine.length) return null;
    var rep = { k: 'preview', t: tick(st), s: st.season, w: st.week, label: label, items: mine.map(function (x) { var pr = MN.P(st, x.p.id); return { pid: x.p.id, name: pname(x.p), code: x.code, lvl: x.lvl, fit: Math.round(x.p.fitness), form: x.p.form, mor: Math.round(x.p.morale), caps: pr.caps, ycaps: pr.ycaps, first: x.lvl === 'A' && !pr.caps, weeks: weeks || 1, coach: MN.coach(st, x.code).name, style: NT.STYLES[MN.coach(st, x.code).style] }; }), games: [] };
    rep.id = 'v' + tick(st) + '_' + m.reports.length; rep.seen = false; rep.done = {};
    m.reports.unshift(rep); if (m.reports.length > 14) m.reports.length = 14; return rep;
  };

  // ---------- Entscheidungen nach der Rückkehr ----------
  MN.ACTIONS = {
    rest: { l: 'Schonen (nächstes Spiel pausieren)', d: 'Fitness +12, verpasst das nächste Pflichtspiel' },
    check: { l: 'Fitnesscheck anordnen', d: 'Medizinische Abteilung prüft Belastung und Verletzungsrisiko' },
    light: { l: 'Training reduzieren', d: 'Fitness +6, etwas weniger Form' },
    regen: { l: 'Regeneration verlängern', d: 'Fitness +9, Moral leicht + (bei Ehrgeizigen −)' },
    talk: { l: 'Persönlich sprechen', d: 'Gespräch über Rolle und Befinden' },
    play: { l: 'Trotz Belastung einsetzen', d: 'Keine Pause – höheres Verletzungsrisiko' },
    youth: { l: 'Ersatz aus dem Nachwuchs fördern', d: 'Ein Talent bekommt die Chance (Moral +)' },
    fed: { l: 'Mit Verband/Nationaltrainer sprechen', d: 'Belastungssteuerung abstimmen' }
  };
  MN.act = function (st, repId, pid, k) {
    var m = MN.ensure(st), rep = m.reports.filter(function (r) { return r.id === repId; })[0], p = st.players[pid]; if (!rep || !p || rep.done[pid]) return { ok: false, why: 'Bereits entschieden.' };
    var it = rep.items.filter(function (x) { return x.pid === pid; })[0], q = MX.pers(p), msg = '', fx = [];
    rep.done[pid] = k;
    if (k === 'rest') { p.fitness = clamp(p.fitness + 12, 0, 100); p.ntAway = 'rest'; p.ntRestT = tick(st); msg = pname(p) + ' setzt ein Spiel aus und erholt sich.'; if (q.amb >= 15) { p.morale = clamp(p.morale - 3, 0, 100); msg += ' Er wäre lieber dabei gewesen.'; } }
    else if (k === 'check') { var med = (S.userClub(st).fac || {}).medizin || 1, risky = (p.risk || 0) > 0.5 || p.fitness < 65; if (risky) { p.risk = Math.max(0, (p.risk || 0) - 0.15); p.fitness = clamp(p.fitness + 4 + med, 0, 100); msg = 'Der Check zeigt eine Überlastung – gezielte Behandlung senkt das Risiko.'; } else msg = 'Alles im grünen Bereich. Einsatzbereit.'; fx = MX.fx(st, { cash: [-(D.MONEY ? 300 : 3000) * med, 'Medizin'] }); }
    else if (k === 'light') { p.fitness = clamp(p.fitness + 6, 0, 100); p.form = clamp(p.form - 0.3, 1, 10); msg = 'Reduzierte Belastung diese Woche.'; }
    else if (k === 'regen') { p.fitness = clamp(p.fitness + 9, 0, 100); p.morale = clamp(p.morale + (q.amb >= 15 ? -1 : 2), 0, 100); msg = 'Zusätzliche Regenerationstage.'; }
    else if (k === 'talk') { MX.start(st, 'nt_return_talk', { pid: pid, st0: (it && it.states[0]) || 'normal', code: it ? it.code : '' }, { prio: 2 }); msg = 'Gespräch angesetzt.'; }
    else if (k === 'play') { p.ntRisk = tick(st); msg = pname(p) + ' bleibt im Einsatz. Die medizinische Abteilung ist skeptisch.'; if ((p.risk || 0) > 0.4 && hr('play' + pid + tick(st), 1) < 0.25) { var wk = 1 + (hash('pl' + pid + tick(st)) % 3); p.inj = { type: 'Muskelverhärtung (Überlastung)', weeks: wk, total: wk }; msg += ' Prompt meldet er Probleme: ' + wk + ' Woche(n) Pause.'; } }
    else if (k === 'youth') { var club = S.userClub(st), y = W.squad(st, club.id).concat(W.youthOf ? W.youthOf(st, club.id) : []).filter(function (x) { return x.age <= 21 && x.pos === p.pos && x.id !== pid; }).sort(function (a, b) { return b.pot - a.pot; })[0]; if (y) { y.morale = clamp(y.morale + 8, 0, 100); MX.event(st, 'chance', { pid: y.id, for: pid }); msg = pname(y) + ' bekommt die Chance, sich zu zeigen.'; } else msg = 'Kein passendes Talent auf dieser Position.'; }
    else if (k === 'fed') { var code = it ? it.code : MN.P(st, pid).code, rel = m.coachRel[code] = m.coachRel[code] == null ? 50 : m.coachRel[code]; var good = rel >= 45; m.coachRel[code] = clamp(rel + (good ? 2 : -6), 0, 100); if (good) { MN.P(st, pid).care = st.season; msg = 'Der Nationaltrainer sagt zu, ' + p.last + ' dosierter einzusetzen.'; } else { msg = 'Der Verband reagiert verschnupft – das Verhältnis kühlt ab.'; if (st.mx) MX.event(st, 'nt_conflict', { pid: pid, code: code }); } }
    if (st.mx) MX.chron(st, '🏳️', 'Nach der Länderspielreise', msg, 1);
    return { ok: true, msg: msg, fx: fx };
  };

  // ---------- Turniere (EM/WM, im Handball auch Olympia) ----------
  function rankTeams(st, filt, salt) { var m = MN.ensure(st); return NT.NATIONS.filter(filt).map(function (n) { return { n: n, v: n.q + (m.qp[n.code] || 0) * 0.004 + (hr(salt + n.code, 1) - 0.5) * 0.1 }; }).sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.n.code; }); }
  MN.setupTour = function (st, k, where) {
    var cfg = NT.CFG.tours[k]; if (!cfg) return null;
    var quota = {}, teams = []; if (cfg.conf) quota[cfg.conf] = cfg.teams; Object.keys(cfg.quota || {}).forEach(function (c) { quota[c] = cfg.quota[c]; });
    Object.keys(quota).forEach(function (cf) { rankTeams(st, function (n) { return n.conf === cf; }, 'mt' + k + st.season).slice(0, quota[cf]).forEach(function (c) { teams.push(c); }); });
    teams = teams.slice(0, cfg.teams);
    var ng = teams.length / 4, pots = teams.slice().sort(function (a, b) { return NT.nat(b).q - NT.nat(a).q; }), groups = []; for (var g = 0; g < ng; g++) groups.push([]);
    for (var p = 0; p < 4; p++) pots.slice(p * ng, (p + 1) * ng).sort(function (a, b) { return hash('pot' + a + st.season) - hash('pot' + b + st.season); }).forEach(function (c, i) { groups[i].push(c); });
    var pre = where === 'winter' ? 'w' : 'p', slots = teams.length === 12 ? { G1: 1, G2: 1, G3: 2, QF: 2, SF: 3, F: 3 } : (where === 'winter' ? { G1: 1, G2: 1, G3: 2, R16: 2, QF: 3, SF: 4, F: 4 } : { G1: 1, G2: 1, G3: 2, R16: 2, QF: 3, SF: 3, F: 4 });
    var tab = {}; teams.forEach(function (c) { tab[c] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    var t = { k: k, s: st.season, name: cfg.n + ' ' + (st.season + (where === 'winter' ? 1 : 0)), where: where, teams: teams, groups: groups, tab: tab, rounds: [], best: {}, out: {}, champ: null, done: false, slots: {} };
    Object.keys(slots).forEach(function (r) { t.slots[r] = pre + slots[r]; });
    ['G1', 'G2', 'G3'].forEach(function (r, md) { var fx = []; groups.forEach(function (gr) { [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]][md].forEach(function (x) { fx.push({ h: gr[x[0]], a: gr[x[1]], res: null }); }); }); t.rounds.push({ r: r, slot: t.slots[r], fx: fx, done: false }); });
    teams.forEach(function (c) { t.best[c] = 'G'; });
    var m = MN.ensure(st); m.tour = t;
    MN.nominate(st, t.name);
    // Abstellung: Nominierte aller Vereine fehlen ab Turnierbeginn
    teams.forEach(function (c) { ((m.sq[c] || {}).A || []).forEach(function (pid) { var pl = st.players[pid]; if (pl) { pl.ntAway = 'tour'; m.away[pid] = { code: c, t: tick(st), tour: t.k }; } }); });
    MN.preview(st, t.name + ' – Abstellung', where === 'winter' ? 4 : 4);
    return t;
  };
  function gtab(t, g) { return g.map(function (c) { var r = t.tab[c]; return { code: c, pts: r.pts, gd: r.gf - r.ga, gf: r.gf }; }).sort(function (a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || (a.code < b.code ? -1 : 1); }); }
  MN.gtab = gtab;
  function addTab(t, f) { var h = t.tab[f.h], a = t.tab[f.a], x = f.res[0], y = f.res[1]; h.p++; a.p++; h.gf += x; h.ga += y; a.gf += y; a.ga += x; if (x > y) { h.w++; a.l++; h.pts += HB ? 2 : 3; } else if (x < y) { a.w++; h.l++; a.pts += HB ? 2 : 3; } else { h.d++; a.d++; h.pts++; a.pts++; } }
  MN.playTourSlot = function (st, slot) {
    var m = MN.ensure(st), t = m.tour, uc = S.userClub(st); if (!t || t.done) return null;
    var stats = {}, played = false;
    for (var ri = 0; ri < t.rounds.length; ri++) (function (rd, ri) {
      if (rd.done || rd.slot !== slot || (ri > 0 && !t.rounds[ri - 1].done)) return;
      var ko = rd.r.charAt(0) !== 'G';
      rd.fx.forEach(function (f, fi) {
        var salt = 't' + t.s + t.k + rd.r + fi, hasMine = uc && [f.h, f.a].some(function (c) { return ((m.sq[c] || {}).A || []).some(function (id) { var p = st.players[id]; return p && p.clubId === uc.id; }); });
        var res = hasMine ? MN.playEngine(st, f.h, f.a, false, t.name) : null;
        if (!res) res = { score: qsim(NT.nat(f.h).q, NT.nat(f.a).q, false, salt), pl: {}, quick: true };
        f.res = res.score.slice();
        if (ko && f.res[0] === f.res[1]) { var hw = hr(salt, 'pen') < 0.5 + (NT.nat(f.h).q - NT.nat(f.a).q); f.pens = hw ? [5, 4] : [3, 4]; }
        f.w = f.res[0] > f.res[1] || (f.pens && f.pens[0] > f.pens[1]) ? f.h : f.a;
        if (!ko) addTab(t, f); else { var los = f.w === f.h ? f.a : f.h; t.out[los] = rd.r; t.best[f.w] = rd.r === 'F' ? 'W' : ({ R16: 'QF', QF: 'SF', SF: 'F' }[rd.r]); if (rd.r === 'F') { t.best[los] = 'F'; t.champ = f.w; } }
        [f.h, f.a].forEach(function (c, side) {
          var A = (m.sq[c] || {}).A || [], won = f.w === c, lost = f.w !== c && (ko || f.res[side] < f.res[1 - side]), sc = side === 0 ? f.res : [f.res[1], f.res[0]];
          A.forEach(function (pid, i) { var p = st.players[pid]; if (!p || p.inj) return; var r = res.pl[pid] ? (side === 0 ? res.pl[pid] : res.pl[pid]) : quickPlayer(st, p, c, 'A', i, salt + pid, won); (stats[pid] = stats[pid] || []).push({ lvl: 'A', code: c, opp: side === 0 ? f.a : f.h, res: sc, won: won, lost: lost, r: r, label: t.name + ' · ' + NT.ROUND_N[rd.r] + ' gegen ' + MN.natName(side === 0 ? f.a : f.h) }); });
        });
      });
      rd.done = true; played = true;
      if (rd.r === 'G3') { // Gruppenphase abgeschlossen → K.-o.-Runde
        var firsts = [], seconds = [], thirds = []; t.groups.forEach(function (g) { var tb = gtab(t, g); firsts.push(tb[0].code); seconds.push(tb[1].code); thirds.push(tb[2]); tb.slice(2).forEach(function (x) { t.out[x.code] = 'G'; }); });
        var nThird = t.teams.length === 12 ? 2 : 4; thirds.sort(function (a, b) { return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf; }); var bt = thirds.slice(0, nThird).map(function (x) { delete t.out[x.code]; return x.code; });
        var adv = firsts.concat(seconds).concat(bt), next = t.teams.length === 12 ? 'QF' : 'R16', fx = [];
        for (var i = 0; i < adv.length / 2; i++) fx.push({ h: adv[i], a: adv[adv.length - 1 - i], res: null });
        adv.forEach(function (c) { t.best[c] = next; });
        t.rounds.push({ r: next, slot: t.slots[next], fx: fx, done: false });
      } else if (ko && rd.r !== 'F') { var nr = { R16: 'QF', QF: 'SF', SF: 'F' }[rd.r], w = rd.fx.map(function (f) { return f.w; }), nf = []; for (var j = 0; j < w.length; j += 2) nf.push({ h: w[j], a: w[j + 1], res: null }); t.rounds.push({ r: nr, slot: t.slots[nr], fx: nf, done: false }); }
      else if (rd.r === 'F') MN.tourEnd(st, t);
    })(t.rounds[ri], ri);
    if (played) {
      var rep = { k: 'tour', t: tick(st), s: st.season, w: st.week, label: t.name + (t.done ? ' – Abschluss' : ' – Zwischenbericht'), items: [], games: [] };
      Object.keys(stats).forEach(function (pid) { var it = MN.applyGames(st, pid, stats[pid]); if (it && uc && st.players[pid] && st.players[pid].clubId === uc.id) { it.best = t.best[it.code]; rep.items.push(it); } });
      // Ausgeschiedene kehren zurück
      Object.keys(m.away).forEach(function (pid) { var a = m.away[pid]; if (a.tour === t.k && (t.out[a.code] || t.done)) { var pl = st.players[pid]; if (pl && pl.ntAway === 'tour') pl.ntAway = false; delete m.away[pid]; } });
      if (rep.items.length) MN.finishReport(st, rep);
    }
    return played;
  };
  MN.tourEnd = function (st, t) {
    var m = MN.ensure(st), uc = S.userClub(st); t.done = true; m.tours.unshift({ s: t.s, k: t.k, name: t.name, champ: t.champ, best: t.best }); if (m.tours.length > 30) m.tours.length = 30;
    m.champs.unshift({ s: t.s, name: t.name, champ: t.champ });
    // Nationaltrainer mit enttäuschendem Abschneiden müssen gehen
    t.teams.forEach(function (c) { var q = NT.nat(c).q, b = t.best[c], cc = MN.coach(st, c); if ((q >= 0.86 && (b === 'G' || b === 'R16')) || st.season - cc.since >= 6) { delete m.coaches[c]; var nc = MN.coach(st, c); nc.since = st.season; if (uc && MN.mine(st).some(function (x) { return x.code === c; }) && st.mx) MX.event(st, 'nt_coach', { code: c, old: cc.name, neu: nc.name }); } });
    // Titelträger: Bekanntheit, Marktwert, Transferinteresse
    if (uc) ((m.sq[t.champ] || {}).A || []).forEach(function (pid) { var p = st.players[pid]; if (!p || p.clubId !== uc.id) return; var pr = MN.P(st, pid); pr.fame = clamp(pr.fame + 12, 0, 100); pr.titles = (pr.titles || []).concat([t.name]); if (st.mx) { MX.chron(st, '🏆', t.name + ' gewonnen!', pname(p) + ' ist ' + (t.k === 'WM' ? 'Weltmeister' : t.k === 'OL' ? 'Olympiasieger' : 'Europameister') + ' mit ' + MN.natName(t.champ) + '.', 3, 'nt_hero'); MX.event(st, 'nt_title', { pid: pid, name: t.name }); } });
    if (st.mx && st.mx.ntJob) { var j = st.mx.ntJob, b2 = t.best[j.code]; if (b2) { var d = { W: 12, F: 7, SF: 4, QF: 1, R16: -2, G: -6 }[b2] || 0; st.manager.reputation = clamp((st.manager.reputation || 40) + d, 1, 100); j.trust = clamp((j.trust || 60) + d * 2, 0, 100); j.tours = (j.tours || []).concat([{ name: t.name, best: b2 }]); MX.chron(st, '🌍', 'Als Nationaltrainer: ' + t.name, MN.natName(j.code) + ' erreicht: ' + ({ W: 'den Titel', F: 'das Finale', SF: 'das Halbfinale', QF: 'das Viertelfinale', R16: 'das Achtelfinale', G: 'nur die Gruppenphase' }[b2]) + '.', 3); } }
  };

  // ---------- Wochenablauf (Kalender) ----------
  function slotNow(st) { return NT.slot(st); }
  MN.preWeek = function (st) {
    if (!MX.on(st)) return; var m = MN.ensure(st);
    // Schonung/Abstellung der Vorwoche aufheben
    Object.keys(st.players).forEach(function (k) { var p = st.players[k]; if (p.ntAway === 'rest' && tick(st) - (p.ntRestT || 0) >= 1) p.ntAway = false; });
    var sl = slotNow(st);
    if (st.phase === 'season' && MN.isWindow(st, st.week + 1)) { if (!m.sq || tick(st) - (m.sqT || -9) > 2) MN.nominate(st, 'Fenster'); m.skip = {}; Object.keys(m.sq).forEach(function (c) { Object.keys(m.sq[c]).forEach(function (l) { m.sq[c][l].forEach(function (pid) { m.skip[pid] = 1; }); }); }); m.winPending = st.week + 1; }
    if (m.tour && !m.tour.done && sl) { m.skip = {}; Object.keys(m.away).forEach(function (pid) { m.skip[pid] = 1; }); MN.playTourSlot(st, sl); }
  };
  MN.postWeek = function (st) {
    if (!MX.on(st)) return; var m = MN.ensure(st);
    if (m.winPending && st.phase !== 'preseason' && st.week === m.winPending) { MN.runWindow(st); m.winPending = null; m.skip = {}; m.sq = null; }
    else if (m.winPending && st.week > m.winPending) { m.winPending = null; m.skip = {}; }
    if (!(m.tour && !m.tour.done)) m.skip = m.winPending ? m.skip : {};
    // Vorschau eine Woche vor dem nächsten Fenster
    if (st.phase === 'season' && MN.isWindow(st, st.week + 1) && m.preT !== st.season + '-' + (st.week + 1)) { m.preT = st.season + '-' + (st.week + 1); MN.nominate(st, 'Fenster'); MN.preview(st, 'Abstellungsbericht: Länderspiele nach dem ' + (st.week + 1) + '. Spieltag', 1); }
    // Winterturnier (Handball EM/WM) beginnt mit der Winterpause
    if (st.phase === 'winter' && (st.winter || 1) === 1 && HB) { var k = NT.tourFor(st.season, 'winter'); if (k && !(m.tour && m.tour.s === st.season && m.tour.where === 'winter')) MN.setupTour(st, k, 'winter'); }
  };
  MN.newSeason = function (st) {
    if (!MX.on(st)) return; var m = MN.ensure(st); m.sq = null; m.skip = {}; m.away = {};
    Object.keys(st.players).forEach(function (k) { var p = st.players[k]; if (p.ntAway) p.ntAway = false; });
    var k = NT.tourFor(st.season, 'summer'); if (k) MN.setupTour(st, k, 'summer');
    if (!HB && NT.tourFor(st.season + 1, 'summer')) m.qp = {}; // neue Qualifikation
    if (HB) m.qp = {};
  };
  // Training: Abwesende Spieler trainieren nicht beim Verein (keine Entwicklung, keine Erholung)
  var baseTrain = S.trainingWeek;
  S.trainingWeek = function (st, club) {
    var m = st.mnt, keep = null;
    if (m && m.skip && club && club.userControlled && MX.on(st)) { keep = {}; Object.keys(m.skip).forEach(function (pid) { var p = st.players[pid]; if (p && p.clubId === club.id) keep[pid] = { attr: JSON.stringify(p.attr), ovr: p.ovr, fit: p.fitness }; }); }
    var r = baseTrain.apply(this, arguments);
    if (keep) Object.keys(keep).forEach(function (pid) { var p = st.players[pid], k = keep[pid]; if (!p) return; p.attr = JSON.parse(k.attr); p.ovr = k.ovr; p.fitness = Math.min(p.fitness, k.fit); });
    return r;
  };
  // Marktwert: internationale Bekanntheit
  var baseMV = W.marketValue;
  W.marketValue = function (p) { var v = baseMV.apply(this, arguments); var f = p && p.ntFame; return f ? v * (1 + Math.min(0.3, f / 300)) : v; };
  MN.syncFame = function (st) { var m = st.mnt; if (!m) return; Object.keys(m.pl).forEach(function (pid) { var p = st.players[pid], pr = m.pl[pid]; if (p) { pr.fame = Math.max(0, pr.fame - 0.15); p.ntFame = Math.round(pr.fame); } }); };

  // ---------- Optional: Manager als Nationaltrainer ----------
  MN.offerJob = function (st) {
    var mg = st.manager, mx = st.mx; if (!mx || mx.ntJob || (mg.reputation || 0) < 70) return null;
    var cands = NT.NATIONS.filter(function (n) { return Math.abs(n.q * 100 - (mg.reputation || 0) - 8) < 12; }); if (!cands.length) return null;
    return cands[hash('job' + st.season + (st.seed || 0)) % cands.length].code;
  };
  MN.takeJob = function (st, code) { st.mx.ntJob = { code: code, since: st.season, trust: 60, tours: [] }; MN.ensure(st).manual[code] = []; MX.chron(st, '🌍', 'Nationaltrainer ' + MN.natName(code), 'Zusätzlich zum Verein übernimmst du die Nationalmannschaft – Termine und Interessen müssen abgestimmt werden.', 3); };
  MN.quitJob = function (st) { var j = st.mx.ntJob; if (!j) return; MX.chron(st, '👋', 'Abschied als Nationaltrainer', MN.natName(j.code) + ' (' + (st.season - j.since) + ' Saisons).', 2); st.mx.ntJob = null; };
  MN.candidates = function (st, code) { return Object.keys(st.players).map(function (k) { return st.players[k]; }).filter(function (p) { return p && p.clubId && !p.ntPseudo && !p.foreignClub && MN.code(st, p) === code && !p.youth; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 60); };
})(RFM);
