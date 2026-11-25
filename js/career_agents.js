// Spielerberater & Agenturen: Beraterdatenbank, Persönlichkeiten mit verdeckten Werten, Vertrauen, Beraterverträge,
// Empfehlungen (Fakten / Einschätzung / verborgenes Motiv), Verhandlungen, Interessenkonflikte, eigenständiges Arbeiten
// und Beraterwechsel. Ohne Vollmacht unterschreibt kein Berater etwas für den Spieler.
(function (R) {
  var D = R.data, W = R.world, S = R.season, C = R.pc, E = R.econ, X = R.cx;
  var AG = R.ag = {};
  var HB = X.HB, clamp = X.clamp, K = D.MONEY || 1;
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'karriere'); }
  function tick(st) { return st.tick || 0; }

  // Konfigurierbare Regeln je Sportart und Land (vereinfachtes Modell)
  AG.RULES = {
    fb: { maxYears: 2, maxFee: 0.10, minorAge: 18, minorFee: 0, note: 'Vertretungsverträge höchstens 2 Jahre, Vergütung höchstens 10 % des Gehalts, bei Minderjährigen keine Vergütung und nur mit Zustimmung der Eltern.' },
    hb: { maxYears: 3, maxFee: 0.10, minorAge: 18, minorFee: 0, note: 'Vertretungsverträge höchstens 3 Jahre, Vergütung höchstens 10 % des Gehalts, bei Minderjährigen keine Vergütung und nur mit Zustimmung der Eltern.' },
    country: { Deutschland: {}, 'Österreich': {}, Schweiz: { maxFee: 0.08 } }
  };
  AG.rules = function (st) { var r = R.clone(AG.RULES[HB ? 'hb' : 'fb']), nat = st.pc && st.pc.cx ? st.pc.cx.prof.nat : 'Deutschland', o = AG.RULES.country[nat] || {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); return r; };
  AG.ATTR = { neg: 'Verhandlungsgeschick', net: 'Vereinsnetzwerk', intl: 'Internationale Kontakte', hon: 'Ehrlichkeit', loy: 'Loyalität', comm: 'Provisionsorientierung', risk: 'Risikobereitschaft', yth: 'Nachwuchskompetenz', med: 'Medienkompetenz', care: 'Persönliche Betreuung' };
  AG.TYPES = {
    seri: { n: 'Seriöser Karriereberater', b: { neg: 60, net: 65, intl: 40, hon: 80, loy: 75, comm: 35, risk: 30, yth: 55, med: 45, care: 70 }, fee: [0.05, 0.07], tf: 0.03, self: 'Mir geht es um deine Entwicklung. Lieber ein Jahr Geduld als ein Wechsel auf die Bank.' },
    prov: { n: 'Provisionsorientierter Berater', b: { neg: 65, net: 70, intl: 45, hon: 45, loy: 40, comm: 85, risk: 60, yth: 40, med: 55, care: 40 }, fee: [0.04, 0.06], tf: 0.08, self: 'Ich habe die Kontakte. Wenn eine Tür aufgeht, gehst du durch – ich kümmere mich um alles.' },
    star: { n: 'Aggressiver Starberater', b: { neg: 82, net: 75, intl: 60, hon: 55, loy: 50, comm: 70, risk: 82, yth: 30, med: 85, care: 35 }, fee: [0.08, 0.10], tf: 0.07, minFame: 35, self: 'Ich hole das Maximum raus. Gehälter, Prämien, Klauseln – und die Schlagzeilen gleich mit.' },
    youth: { n: 'Nachwuchsspezialist', b: { neg: 50, net: 55, intl: 25, hon: 72, loy: 70, comm: 40, risk: 35, yth: 88, med: 40, care: 78 }, fee: [0.03, 0.05], tf: 0.04, self: 'Ich kenne jede Akademie und jeden Jugendtrainer. Der Sprung zu den Profis ist mein Spezialgebiet.' },
    trust: { n: 'Persönlicher Vertrauter', b: { neg: 35, net: 25, intl: 10, hon: 85, loy: 95, comm: 15, risk: 40, yth: 45, med: 25, care: 90 }, fee: [0.01, 0.03], tf: 0.01, self: 'Ich kenne dich, seit du laufen kannst. Ich will nur, dass es dir gut geht.' },
    intl: { n: 'Internationaler Topagent', b: { neg: 85, net: 72, intl: 95, hon: 60, loy: 45, comm: 65, risk: 55, yth: 30, med: 70, care: 28 }, fee: [0.07, 0.10], tf: 0.06, minFame: 50, self: 'Meine Klienten spielen in ganz Europa. Ich öffne Türen, an die andere nicht einmal klopfen.' }
  };
  var FIRST = ['Marco', 'Jens', 'Olaf', 'Sven', 'Dirk', 'Kai', 'Lars', 'Ralf', 'Nico', 'Tobias', 'Stefan', 'Ivo', 'Milan', 'Sandra', 'Petra', 'Julia', 'Anja', 'Gregor', 'Patrick', 'Frank'];
  var LAST = ['Brenner', 'Kowalski', 'Hartmann', 'Vogel', 'Sander', 'Lindqvist', 'Moreau', 'Petković', 'Albers', 'Engel', 'Wolters', 'Kaya', 'Roth', 'Behrens', 'Falk', 'Sommer', 'Janssen', 'Ritter'];
  var FIRMS = { seri: ['Sportconsult Nord', 'Laufbahn & Partner', 'Klarblick Sportberatung'], prov: ['TransferHub', 'Deal Factory Sports', 'Quick Move Agency'], star: ['Spotlight Management', 'Headline Sports Group'], youth: ['Talentwerk', 'Akademiebrücke'], trust: ['Familienrat', 'Ehemaliger Jugendtrainer'], intl: ['EuroAthletes International', 'Continental Sports Partners'] };

  AG.genDb = function (st) {
    var db = [], n = 0, clubs = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league; });
    Object.keys(AG.TYPES).forEach(function (ty) {
      var T = AG.TYPES[ty], cnt = ty === 'trust' ? 2 : ty === 'star' || ty === 'intl' ? 2 : 3;
      for (var i = 0; i < cnt; i++) {
        var a = {}; Object.keys(T.b).forEach(function (k) { a[k] = Math.round(clamp(R.gauss(T.b[k], 13), 3, 98)); });
        var nm = ty === 'trust' ? (i === 0 ? 'Onkel ' + R.pick(['Frank', 'Uwe', 'Rolf']) : 'Trainer ' + R.pick(['Becker', 'Heinze', 'Krüger'])) : R.pick(FIRST) + ' ' + R.pick(LAST);
        var crel = {};
        for (var j = 0; j < 6; j++) { var c = R.pick(clubs); crel[c.id] = Math.round(clamp(R.gauss(a.net > 60 ? 18 : 5, 18), -40, 40)); }
        var cl = []; if (ty !== 'trust') for (var q = 0; q < R.randInt(2, ty === 'intl' || ty === 'prov' ? 7 : 4); q++) { var cc = R.pick(clubs); cl.push({ name: R.pick(FIRST.slice(0, 13)) + ' ' + R.pick(LAST), pos: R.pick(Object.keys(D.posWeights)), clubId: cc.id }); }
        var fee = Math.round(R.randRange(T.fee[0], T.fee[1]) * 100) / 100;
        db.push({ id: 'A' + (++n), n: nm, firm: R.pick(FIRMS[ty]), ty: ty, a: a, fee: fee, tf: T.tf, rep: clamp(Math.round((a.neg + a.net + a.intl) / 60 + R.randRange(-0.7, 0.7)), 1, 5), crel: crel, cl: cl, self: T.self, busy: ty === 'intl' ? R.randInt(25, 45) : ty === 'star' ? R.randInt(15, 30) : R.randInt(3, 15) });
      }
    });
    return db;
  };
  AG.ensure = function (st) {
    var pc = st.pc; if (!pc) return null;
    if (!pc.ag) pc.ag = { db: AG.genDb(st), cur: null, con: null, trust: 50, recs: [], hist: [], known: {}, ign: 0, power: false, pend: [], fakeOn: null };
    if (pc.agent && !pc.ag.cur && !pc.ag.legacy) { // alter Spielstand mit „Berater“: einem seriösen Berater zuordnen
      var a0 = pc.ag.db.filter(function (a) { return a.ty === 'seri'; })[0]; pc.ag.legacy = true; if (a0) { pc.ag.cur = a0.id; pc.ag.con = { start: tick(st), until: tick(st) + 104, fee: 0.1, power: false, excl: true }; }
    }
    return pc.ag;
  };
  AG.get = function (st, id) { var ag = AG.ensure(st); return ag.db.filter(function (a) { return a.id === id; })[0] || null; };
  AG.current = function (st) { var ag = st.pc && st.pc.ag; return ag && ag.cur ? AG.get(st, ag.cur) : null; };

  // ---------- Verborgene Werte erkennen ----------
  // Stufe 0: unbekannt, 1: Tendenz (niedrig/mittel/hoch), 2: genau
  AG.know = function (st, id, k, lvl) { var ag = AG.ensure(st), m = ag.known[id] = ag.known[id] || {}; if ((m[k] || 0) < lvl) { m[k] = lvl; return true; } return false; };
  AG.shown = function (st, a, k) { var lv = (AG.ensure(st).known[a.id] || {})[k] || 0, v = a.a[k]; if (lv >= 2) return String(v); if (lv === 1) return v >= 67 ? 'eher hoch' : v >= 40 ? 'mittel' : 'eher niedrig'; return '?'; };
  AG.publicInfo = function (st, a) { return { name: a.n, firm: a.firm, type: AG.TYPES[a.ty].n, rep: a.rep, fee: a.fee, tf: a.tf, clients: a.cl.slice(0, 4), self: a.self }; };

  // ---------- Markt: welche Berater interessieren sich für den Spieler? ----------
  AG.market = function (st) {
    var ag = AG.ensure(st), pc = st.pc, p = C.player(st); if (!p) return [];
    return ag.db.filter(function (a) {
      if (a.id === ag.cur) return false; var T = AG.TYPES[a.ty];
      if (T.minFame && pc.fame < T.minFame) return false;
      if (a.ty === 'youth' && p.age > 23) return false;
      if ((ag.burned || {})[a.id]) return false;
      return a.ty === 'trust' || pc.fame + (p.pot - p.ovr) / 2 + (p.youth ? 8 : 0) >= 6 + a.rep * 3;
    });
  };
  AG.terms = function (st, a) { var r = AG.rules(st), p = C.player(st), minor = p && p.age < r.minorAge; return { years: Math.min(r.maxYears, a.ty === 'trust' ? r.maxYears : 2), fee: minor ? r.minorFee : Math.min(r.maxFee, a.fee), tf: a.tf, minor: minor }; };
  AG.sign = function (st, id, o) {
    var ag = AG.ensure(st), a = AG.get(st, id), p = C.player(st); if (!a || !p) return { ok: false, why: 'Berater nicht verfügbar.' };
    var r = AG.rules(st), t = AG.terms(st, a); o = o || {};
    if (t.minor && st.pc.cx && st.pc.cx.rel.family < 35) return { ok: false, why: 'Deine Eltern stimmen dem Vertrag nicht zu. (Familienbeziehung zu schlecht.)' };
    if (ag.cur) { var res = AG.fire(st, true); if (!res.ok) return res; }
    var years = clamp(o.years || t.years, 1, r.maxYears);
    ag.cur = a.id; ag.con = { start: tick(st), until: tick(st) + years * 52, fee: t.fee, tf: t.tf, power: !!o.power, excl: true, minor: t.minor };
    ag.trust = a.ty === 'trust' ? 75 : 50; ag.ign = 0; st.pc.agent = true;
    AG.know(st, a.id, a.ty === 'trust' ? 'loy' : 'neg', 1);
    X.chron(st, 'berater', '🤝', 'Neuer Berater: ' + a.n, a.firm + ' · ' + AG.TYPES[a.ty].n + ' · ' + Math.round(t.fee * 100) + ' % Gehaltsbeteiligung' + (t.minor ? ' (minderjährig: ohne Vergütung, mit Zustimmung der Eltern)' : '') + (o.power ? ' · mit Verhandlungsvollmacht' : ''), 2);
    news(st, 'Neuer Berater', W.playerName(p) + ' lässt sich ab sofort von ' + a.n + ' (' + a.firm + ') vertreten.');
    return { ok: true };
  };
  AG.fireCost = function (st) { var ag = AG.ensure(st), p = C.player(st); if (!ag.cur || !p) return 0; var left = Math.max(0, ag.con.until - tick(st)); return Math.round(left / 52 * p.wage * ag.con.fee * 0.5 / 100) * 100; };
  AG.fire = function (st, silent) {
    var ag = AG.ensure(st), a = AG.current(st); if (!a) return { ok: false, why: 'Kein Berater.' };
    var cost = AG.fireCost(st);
    if (cost && R.pf) R.pf.book(st, -cost, 'Beraterhonorar');
    ag.hist.push({ id: a.id, n: a.n, from: ag.con.start, to: tick(st), trust: Math.round(ag.trust), why: 'gekündigt' });
    ag.burned = ag.burned || {}; ag.burned[a.id] = tick(st);
    ag.cur = null; ag.con = null; ag.pend = []; st.pc.agent = false; ag.fakeOn = null;
    st.pc.offers.forEach(function (o) { if (o.viaAgent) o.dead = true; }); st.pc.offers = st.pc.offers.filter(function (o) { return !o.dead; });
    X.mem(st, 'agentFired', 1); X.setFlag(st, 'lastAgentFire', tick(st));
    if (a.a.loy < 40 && a.a.med > 50) { X.later(st, R.randInt(2, 6), 'ag_revenge', { id: a.id }); }
    X.chron(st, 'berater', '✂️', 'Trennung von ' + a.n, cost ? 'Ablösung des Vertrags: ' + R.fmtMoney(cost) + '. Laufende Gespräche über ihn sind beendet.' : 'Laufende Gespräche über ihn sind beendet.', 2);
    if (!silent) news(st, 'Beraterwechsel', 'Die Zusammenarbeit mit ' + a.n + ' ist beendet.' + (cost ? ' Kosten: ' + R.fmtMoney(cost) + '.' : ''));
    return { ok: true, cost: cost };
  };
  AG.setPower = function (st, on) { var ag = AG.ensure(st); if (ag.con) ag.con.power = !!on; };
  AG.trust = function (st, d, why) { var ag = AG.ensure(st); ag.trust = clamp(ag.trust + d, 0, 100); if (why) ag.hist.push({ t: tick(st), d: d, why: why }); if (ag.hist.length > 120) ag.hist.splice(0, ag.hist.length - 120); };

  // ---------- Angebote: Netzwerk, Verhandlungsgeschick, Fakten, Klauseln, Empfehlung ----------
  AG.SLOTS = HB ? { TW: 1, AUS: 2, RUE: 3, KRS: 1 } : { TW: 1, ABW: 4, MIT: 4, STU: 2 };
  AG.trueRank = function (st, p, clubId) { return W.squad(st, clubId).filter(function (x) { return x.id !== p.id && x.pos === p.pos && !x.youth && x.ovr > p.ovr + 1; }).length + 1; };
  AG.chanceText = function (rank, pos) { var s = AG.SLOTS[pos] || 2; return rank <= s ? 'Stammplatz realistisch' : rank <= s + 1 ? 'Rotation' : rank <= s + 2 ? 'zunächst Ersatz' : 'kaum Einsatzchancen'; };
  AG.CLAUSES = { abstieg: 'Gehalt −40 % bei Abstieg', option: 'Einseitige Vereinsoption auf ein weiteres Jahr', leih: 'Leihklausel: Verein darf dich jederzeit verleihen', prämie: 'Hoher Anteil leistungsabhängiger Prämien (Grundgehalt niedriger)', ausstieg: 'Ausstiegsklausel für dich (Vorteil)' };
  AG.onOffers = function (st) {
    var ag = AG.ensure(st), pc = st.pc, p = C.player(st), a = AG.current(st); if (!p) return;
    // zusätzliche Angebote über das Netzwerk
    if (a && R.chance((a.a.net + a.a.intl) / 260)) {
      var best = Object.keys(a.crel).map(function (k) { return st.clubs[k]; }).filter(function (c) { return c && c.league && c.id !== p.clubId && a.crel[c.id] > 5 && !pc.offers.some(function (o) { return o.clubId === c.id; }); })[0];
      if (best) pc.offers.push({ id: 'n' + tick(st), clubId: best.id, wage: Math.round(W.fairWage(p) * R.randRange(1.0, 1.25) / 1000) * 1000, years: R.randInt(2, 4), fee: p.contract > 1 ? Math.round(p.value / 50000) * 50000 : 0, role: 'über Netzwerk', viaAgent: true });
    }
    pc.offers.forEach(function (o) { AG.enrich(st, o); });
  };
  AG.enrich = function (st, o) {
    var p = C.player(st), a = AG.current(st), pc = st.pc; if (!p || o.info) return o;
    var rank = o.renew ? C.squadRank(st, p) : AG.trueRank(st, p, o.clubId);
    o.info = { rank: rank, chance: AG.chanceText(rank, p.pos) };
    // Verhandlungsgeschick (ersetzt den pauschalen Beraterbonus des Grundmoduls)
    var mult = a ? (1 + (a.a.neg - 60) / 260) / 1.12 : 1; if (pc.agent && !a) mult = 1;
    o.wage = Math.round(o.wage * mult / 1000) * 1000; o.wage0 = o.wage;
    o.cl = []; if (!o.renew) { if (R.chance(0.22)) o.cl.push('abstieg'); if (R.chance(0.18)) o.cl.push('option'); if (R.chance(0.12)) o.cl.push('leih'); if (R.chance(0.2)) o.cl.push('prämie'); if (R.chance(0.1)) o.cl.push('ausstieg'); }
    o.chk = {};
    if (a) {
      // Interessenkonflikt: Berater vertritt bereits einen Spieler auf derselben Position in diesem Verein
      var conflict = a.cl.some(function (c) { return c.clubId === o.clubId && c.pos === p.pos; });
      var comm = Math.round(o.wage * o.years * (o.renew ? a.tf * 0.4 : a.tf) / 100) * 100; // Provision (zahlt der Verein)
      var sport = (AG.SLOTS[p.pos] + 1 - rank) / 3 + (o.renew ? 0.1 : 0) + ((C.club(st) ? C.club(st).league : 3) - (st.clubs[o.clubId].league || 3)) * 0.25;
      var money = o.wage / Math.max(1, p.wage) - 1;
      var errSd = (100 - a.a.net) / 220; // auch seriöse Berater irren sich
      var playerU = sport * 0.8 + money * 0.5 + R.gauss(0, errSd);
      var agentU = playerU * a.a.hon / 100 + (money * 0.8 + comm / Math.max(1, p.wage) * 2) * a.a.comm / 100 - (conflict ? 0.4 : 0) - (o.renew ? a.a.comm / 250 : 0);
      var claimRank = Math.max(1, Math.round(rank - (100 - a.a.hon) / 35 * (agentU > 0 ? 1 : 0) + R.gauss(0, errSd * 2)));
      var r = agentU > 0.15 ? 'accept' : agentU < -0.15 ? 'reject' : 'neutral';
      var lines = { accept: ['Das ist eine Riesenchance. Ich würde unterschreiben.', 'Die Konditionen sind top, und die sportliche Rolle passt.', 'So ein Angebot kommt nicht zweimal.'], reject: ['Davon rate ich ab. Das passt sportlich nicht.', 'Lass uns warten, da kommt Besseres.', 'Zu wenig Perspektive für dich.'], neutral: ['Kann man machen, muss man aber nicht.', 'Für und Wider halten sich die Waage.'] };
      var flagged = o.cl.filter(function (k) { return k !== 'ausstieg' && R.chance((a.a.care + a.a.hon) / 220); });
      o.rec = { r: r, claimRank: claimRank, txt: R.pick(lines[r]) + (claimRank <= AG.SLOTS[p.pos] && rank > AG.SLOTS[p.pos] ? ' Du bist dort als Stammspieler eingeplant.' : ''), flagged: flagged, comm: comm, conflict: conflict };
      if (flagged.length && r === 'accept' && a.a.hon > 70) { o.rec.r = 'neutral'; o.rec.txt = 'Gute Konditionen – aber ich habe problematische Klauseln gefunden, die wir klären müssen.'; }
      AG.ensure(st).recs.unshift({ t: tick(st), s: st.season, k: o.renew ? 'renew' : 'offer', club: o.clubId, r: o.rec.r, claim: claimRank, rank: rank, aid: a.id, followed: null, comm: comm, conflict: conflict });
      AG.ensure(st).recs = AG.ensure(st).recs.slice(0, 80);
      if (conflict && R.chance(0.5)) X.later(st, 1, 'ag_conflict', { club: o.clubId });
    }
    return o;
  };
  // Erst Informationen zu den Einsatzchancen verlangen (der Berater kann färben)
  AG.askInfo = function (st, id) {
    var o = AG.offer(st, id), a = AG.current(st), p = C.player(st); if (!o) return 'Angebot nicht mehr da.';
    o.chk.info = true;
    if (!a) { var self = clamp(o.info.rank + R.randInt(-1, 1), 1, 9); return 'Eigene Recherche: Du wärst dort etwa Nr. ' + self + ' auf deiner Position (' + AG.chanceText(self, p.pos) + ').'; }
    var said = a.a.hon >= 60 ? o.info.rank : o.rec ? o.rec.claimRank : o.info.rank;
    if (a.a.hon >= 60) AG.know(st, a.id, 'hon', 1);
    return a.n + ': „Du wärst dort Nr. ' + said + ' auf deiner Position – ' + AG.chanceText(said, p.pos) + '.“' + (said !== o.info.rank ? '' : '');
  };
  // Mit dem aktuellen Trainer sprechen
  AG.talkCoach = function (st, id) {
    var o = AG.offer(st, id), pc = st.pc, p = C.player(st), c = C.club(st); if (!o || !c) return 'Kein Trainer zum Reden.';
    if (o.chk.coach) return 'Du hast schon mit dem Trainer gesprochen.'; o.chk.coach = true;
    if (pc.trust >= 62) { var own = pc.offers.filter(function (x) { return x.renew; })[0]; if (own) { own.wage = Math.round(own.wage * 1.08 / 1000) * 1000; } X.eff(st, { coach: 2 }); return 'Der Trainer will dich unbedingt halten: „Du bist fest eingeplant.“' + (own ? ' Der Verein bessert die Verlängerung nach.' : ''); }
    if (pc.trust < 40) { X.eff(st, { coach: -2 }); return 'Der Trainer zuckt mit den Schultern: „Wenn du gehen willst, halte ich dich nicht auf.“'; }
    return 'Der Trainer bleibt vage: „Du musst dich weiter anbieten.“';
  };
  // Zweite Meinung einholen (kostet Geld, zeigt Fakten und Klauseln, lässt auf das Motiv des Beraters schließen)
  AG.secondOpinion = function (st, id) {
    var o = AG.offer(st, id), a = AG.current(st), p = C.player(st); if (!o) return 'Angebot nicht mehr da.';
    if (o.chk.second) return 'Liegt schon vor.';
    var cost = Math.round(Math.max(1500 * K, p.wage * 0.01) / 100) * 100; if (R.pf) R.pf.book(st, -cost, 'Beratungskosten');
    o.chk.second = true; o.chk.info = true; o.chk.clauses = true;
    var t = 'Ein unabhängiger Anwalt prüft das Angebot (' + R.fmtMoney(cost) + '): Rang ' + o.info.rank + ' auf deiner Position (' + o.info.chance + ').' + (o.cl.length ? ' Klauseln: ' + o.cl.map(function (k) { return AG.CLAUSES[k]; }).join('; ') + '.' : ' Keine auffälligen Klauseln.');
    if (a && o.rec) { t += ' Geschätzte Provision deines Beraters bei Abschluss: ' + R.fmtMoney(o.rec.comm) + '.'; if (o.rec.claimRank < o.info.rank - 0) { AG.know(st, a.id, 'hon', 2); AG.trust(st, -8, 'Zweite Meinung widerspricht dem Berater'); t += ' Dein Berater hat deine Rolle schöngeredet.'; } else { AG.know(st, a.id, 'hon', 1); AG.trust(st, 2, 'Zweite Meinung bestätigt den Berater'); } if (o.rec.conflict) { t += ' Achtung: Er vertritt dort bereits einen Spieler auf deiner Position.'; AG.know(st, a.id, 'comm', 1); } }
    return t;
  };
  // Verhandlung: Forderung moderat / hoch / extrem
  AG.negotiate = function (st, id, lvl) {
    var o = AG.offer(st, id), a = AG.current(st), pc = st.pc, p = C.player(st); if (!o) return { ok: false, msg: 'Angebot nicht mehr da.' };
    if (o.negN >= 2) return { ok: false, msg: 'Der Verein will nicht weiter verhandeln.' };
    o.negN = (o.negN || 0) + 1;
    var ask = { moderat: 0.07, hoch: 0.15, extrem: 0.3 }[lvl] || 0.07, skill = a ? a.a.neg : 30 + (st.pc.cx ? st.pc.cx.per.conf / 4 : 10);
    var pSucc = clamp(0.25 + skill / 160 + pc.fame / 300 - ask * 1.6 + (a && a.crel[o.clubId] ? a.crel[o.clubId] / 150 : 0), 0.05, 0.9);
    if (R.rand() < pSucc) { o.wage = Math.round(o.wage * (1 + ask) / 1000) * 1000; if (a) AG.know(st, a.id, 'neg', 1); if (a && a.ty === 'star' && lvl !== 'moderat' && R.chance(0.35)) { X.eff(st, { press: -3, board: -4 }); return { ok: true, msg: 'Durchgesetzt: ' + R.fmtMoney(o.wage) + '/Jahr. Der Poker lief öffentlich – nicht jeder fand das gut.' }; } return { ok: true, msg: 'Durchgesetzt: neues Gehalt ' + R.fmtMoney(o.wage) + '/Jahr.' }; }
    if (R.chance(ask * 1.8)) { pc.offers = pc.offers.filter(function (x) { return x !== o; }); if (a) { AG.know(st, a.id, 'risk', 1); AG.trust(st, -4, 'Angebot nach Poker zurückgezogen'); } return { ok: false, msg: 'Der Verein bricht die Gespräche ab – das Angebot ist weg.' }; }
    return { ok: false, msg: 'Der Verein bleibt bei seinem Angebot.' };
  };
  AG.offer = function (st, id) { return st.pc.offers.filter(function (x) { return x.id === id; })[0] || null; };
  // Annahme/Ablehnung mitschreiben: wurde der Empfehlung gefolgt?
  function track(st, o, accepted) {
    var ag = AG.ensure(st), r = ag.recs.filter(function (x) { return x.club === o.clubId && x.followed == null && x.s === st.season; })[0]; if (!r) return;
    r.followed = (r.r === 'accept') === accepted; r.acc = accepted;
    if (!r.followed && r.r !== 'neutral') ag.ign++;
  }
  var baseAccept = C.acceptOffer;
  C.acceptOffer = function (st, id) {
    var o = AG.offer(st, id), res = baseAccept(st, id);
    if (res.ok && o) { track(st, o, true); X.mem(st, o.renew ? 'renewals' : 'transfersAgreed', 1); if (!o.renew) { var a = AG.current(st); if (a && o.rec) { X.chron(st, 'transfer', '✍️', 'Wechsel vereinbart', st.clubs[o.clubId].name + ', ' + R.fmtMoney(o.wage) + '/Jahr. Empfehlung des Beraters: ' + ({ accept: 'annehmen', reject: 'ablehnen', neutral: 'neutral' })[o.rec.r] + '.', 3); if (o.rec.r === 'accept' && o.info.rank > AG.SLOTS[C.player(st).pos] + 1) X.setFlag(st, 'pushedToBench', st.season + 1); } else X.chron(st, 'transfer', '✍️', 'Wechsel vereinbart', st.clubs[o.clubId].name + ', ' + R.fmtMoney(o.wage) + '/Jahr.', 3); } else X.chron(st, 'vertrag', '📝', 'Vertrag verlängert', 'Bis ' + (st.season + o.years) + ', ' + R.fmtMoney(o.wage) + '/Jahr.', 2); if (st.pc.cx) X.setFlag(st, 'fakeRelied', 0); }
    return res;
  };
  var baseDecline = C.declineOffer;
  C.declineOffer = function (st, id) { var o = AG.offer(st, id); if (o) { track(st, o, false); if (o.renew && AG.ensure(st).fakeOn) X.setFlag(st, 'fakeRelied', 1); } return baseDecline(st, id); };

  // ---------- Eigenständige Arbeit des Beraters (wöchentlich) ----------
  AG.weekly = function (st) {
    var ag = AG.ensure(st), a = AG.current(st), p = C.player(st), pc = st.pc; if (!p) return;
    if (!a) return;
    var con = ag.con, t = tick(st);
    // Honorar
    if (con.fee && R.pf) R.pf.book(st, -Math.round(p.wage / E.WEEKS * con.fee), 'Beraterhonorar');
    // Beziehungen zu Vereinen verändern sich
    if (R.chance(0.08)) { var ks = Object.keys(a.crel); if (ks.length) { var k = R.pick(ks); a.crel[k] = clamp(a.crel[k] + R.randInt(-6, 6), -50, 50); } }
    // Betreuungsqualität: wenig Aufmerksamkeit bei vielbeschäftigten Agenten
    var attention = clamp(a.a.care - a.busy / 2, 5, 100);
    if (R.chance(0.03) && attention < 30) { AG.trust(st, -2, 'Berater kaum erreichbar'); AG.know(st, a.id, 'care', 1); }
    // Vertragsende
    if (t >= con.until) { X.fire(st, 'ag_contract_end', { id: a.id }, true); con.until = t + 8; }
    // Trennung durch den Berater
    if ((ag.trust < 18 || (ag.ign >= 4 && a.a.loy < 55) || ((a.ty === 'star' || a.ty === 'intl') && pc.fame < 15 && p.age > 21)) && R.chance(0.15)) { X.fire(st, 'ag_quits', { id: a.id }, true); return; }
    if (st.phase !== 'season' && st.phase !== 'winter' && st.phase !== 'preseason') return;
    var busyInbox = pc.cx && pc.cx.inbox.filter(function (x) { return X.REG[x.id] && X.REG[x.id].pack === 'berater'; }).length;
    if (busyInbox >= 2) return;
    // Aktionen nach Persönlichkeit
    var acts = [
      ['ag_interest', 0.025 + a.a.net / 2500, true],
      ['ag_push', a.a.comm > 60 && !p.youth && C.squadRank(st, p) <= AG.SLOTS[p.pos] ? (a.a.comm - 55) / 900 : 0],
      ['ag_fake', !ag.fakeOn && pc.offers.some(function (o) { return o.renew; }) ? (100 - a.a.hon) * a.a.risk / 120000 : 0],
      ['ag_sponsor', p.youth ? 0 : a.a.med / 4000 * (0.4 + pc.fame / 60)],
      ['ag_warn', (a.a.hon + a.a.care) / 9000 * (pc.offers.some(function (o) { return !o.renew && o.info && o.info.rank > AG.SLOTS[p.pos] + 1; }) ? 4 : 0)],
      ['ag_renewprep', p.contract <= 1 && !p.youth && !pc.moving && pc.offers.length === 0 && st.week > 10 ? a.a.care / 3000 : 0],
      ['ag_invest', a.a.comm > 55 && a.a.hon < 60 && R.pf && R.pf.liquid(st) > 50000 * K ? 0.006 : 0],
      ['ag_media', a.ty === 'star' ? 0.01 : a.a.med > 70 ? 0.004 : 0]
    ];
    for (var i = 0; i < acts.length; i++) if (acts[i][1] > 0 && R.chance(acts[i][1])) { var e = X.REG[acts[i][0]]; if (e && X.eligible(st, Object.assign({}, e, { follow: false }), X.ctx(st))) { X.fire(st, acts[i][0], { id: a.id }, true); break; } }
  };
  // Saisonbilanz der Empfehlungen: sportliche Entwicklung nach befolgtem Rat bewerten
  AG.seasonEnd = function (st) {
    var ag = AG.ensure(st), p = C.player(st), pc = st.pc, last = pc.seasons[pc.seasons.length - 1]; if (!p || !last) return;
    ag.recs.forEach(function (r) {
      if (r.eval || r.acc !== true || r.k !== 'offer' || r.s !== st.season - 1) return;
      r.eval = true; var share = last.clubId === r.club ? last.apps / 30 : null; if (share == null) return;
      var a = AG.get(st, r.aid); r.share = Math.round(share * 100);
      var good = share >= 0.45;
      if (ag.cur === r.aid) {
        if (r.r === 'accept') AG.trust(st, good ? 8 : -12, good ? 'Wechsel hat sich sportlich gelohnt' : 'Wechsel auf die Bank – trotz Empfehlung');
        if (a) { AG.know(st, a.id, 'hon', r.claim < r.rank - 1 ? 2 : 1); AG.know(st, a.id, 'net', 1); }
      }
      X.chron(st, 'berater', good ? '✅' : '⚠️', 'Bilanz eines Wechsels', (st.clubs[r.club] ? st.clubs[r.club].short : 'Verein') + ': ' + last.apps + ' Spiele. ' + (r.claim < r.rank ? 'Der Berater hatte dich als Nr. ' + r.claim + ' angekündigt, tatsächlich warst du Nr. ' + r.rank + '.' : 'Die Einschätzung des Beraters war realistisch.'), 2);
      if (!good) X.setFlag(st, 'badMove', st.season);
    });
    // häufige Wechsel bremsen Entwicklung und Ruf (Kontinuität)
    var moves = pc.seasons.slice(-4).map(function (s) { return s.clubId; }).filter(function (v, i, arr) { return v && arr.indexOf(v) === i; }).length;
    if (moves >= 4) { X.eff(st, { press: -4, board: -3 }); X.chron(st, 'transfer', '🧳', 'Ruf als Wandervogel', 'Vier Vereine in vier Jahren – Vereine zweifeln an deiner Beständigkeit.', 2); }
    if (ag.cur) { var a2 = AG.current(st); AG.know(st, a2.id, 'care', 1); if (ag.trust > 70) AG.know(st, a2.id, 'loy', 1); }
  };
  C.agentFee = function (st, p) { }; // Honorar läuft über AG.weekly
  C.on.offers.push(AG.onOffers);
  C.on.weekly.push(function (st) { AG.ensure(st); AG.weekly(st); });
  C.on.seasonEnd.push(AG.seasonEnd);

  // ---------- Berater- und Transferereignisse ----------
  function A(ctx) { return ctx.ag; }
  function an(ctx) { return ctx.ag ? ctx.ag.n : 'Dein Berater'; }
  function clubOf(st, d) { return d && d.club && st.clubs[d.club]; }
  function randClub(st, p, better) { var cs = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && c.id !== p.clubId && (!better || c.league <= (C.club(st) ? C.club(st).league : 3)); }); return cs.length ? R.pick(cs) : null; }
  function offerFrom(st, c, f) { var p = C.player(st), o = { id: 'x' + tick(st) + c.id, clubId: c.id, wage: Math.round(W.fairWage(p) * f / 1000) * 1000, years: R.randInt(2, 4), fee: p.contract > 1 ? Math.round(p.value / 50000) * 50000 : 0, role: 'Anfrage', viaAgent: true }; st.pc.offers.push(o); AG.enrich(st, o); return o; }
  X.add('berater', [
    { id: 'ag_first', cat: 'berater', ic: '💼', w: 1.4, once: true, when: function (c) { return !c.ag && c.pc.fame >= 6 && c.age >= 16; }, ti: 'Erste Beraterinteressenten', t: function (c) { return 'Nach deinen ersten Auftritten melden sich Spielerberater bei dir' + (c.age < 18 ? ' und deinen Eltern' : '') + '. Unter „Berater & Verträge“ kannst du Agenturen vergleichen.'; },
      o: [{ l: 'Angebote in Ruhe vergleichen', hint: 'öffnet den Beratermarkt', fx: function (st) { X.setFlag(st, 'agMarket', 1); return 'Die Agenturen liegen dir vor.'; } }, { l: 'Vorerst selbst verhandeln', fx: function (st) { X.eff(st, { conf: 2 }); return 'Du vertrittst dich selbst – günstig, aber ohne Netzwerk.'; } }] },
    { id: 'ag_parents', cat: 'berater', ic: '👪', once: true, when: function (c) { return c.age < 18 && !c.ag && c.pc.fame >= 8; }, ti: 'Familienrat', t: function () { return 'Am Küchentisch: Deine Eltern wollen, dass ein Berater erst nach der Schule kommt. Ein Agent drängt, jetzt zu unterschreiben.'; },
      o: [{ l: 'Auf die Eltern hören', fx: function (st) { return X.eff(st, { family: 6, disc: 2 }); } }, { l: 'Mit dem Agenten weiterreden', hint: 'Familie unzufrieden', fx: function (st) { X.setFlag(st, 'agMarket', 1); return X.eff(st, { family: -6, amb: 3 }); } }] },
    { id: 'ag_interest', cat: 'transfer', ic: '📞', inbox: true, exp: 4, follow: true, cd: 8, ti: function (c) { return 'Nachricht von ' + an(c); }, t: function (c, d) { var st = c.st, cl = clubOf(st, d) || (d.club = (randClub(st, c.p) || {}).id, clubOf(st, d)); if (!cl) return 'Ein Verein fragt unverbindlich nach dir.'; var r = AG.trueRank(st, c.p, cl.id), a = A(c), claim = a && a.a.hon < 55 ? Math.max(1, r - 1) : r; d.rank = r; d.claim = claim; return '„Ich habe mit ' + cl.name + ' (' + D.leagueNames[cl.league] + ') gesprochen. Man ist interessiert. ' + (claim <= AG.SLOTS[c.p.pos] ? 'Du wärst dort Stammspieler.' : 'Die Konkurrenz ist groß, aber du hättest Chancen.') + ' Soll ich ein Angebot anbahnen?“'; },
      o: [{ l: 'Verhandlungen aufnehmen', fx: function (st, c, d) { var cl = clubOf(st, d); if (!cl) return ''; var o = offerFrom(st, cl, R.randRange(1, 1.25)); X.eff(st, { coach: c.share > 0.5 ? -1 : 0 }); return 'Ein konkretes Angebot von ' + cl.short + ' liegt vor (' + R.fmtMoney(o.wage) + '/Jahr).'; } },
        { l: 'Erst Infos zu den Einsatzchancen', fx: function (st, c, d) { var cl = clubOf(st, d); X.later(st, 1, 'ag_interest_info', d); return 'Dein Berater hört sich um.'; } },
        { l: 'Mit dem aktuellen Trainer sprechen', req: function (c) { return !!c.c; }, fx: function (st, c) { if (c.pc.trust >= 60) { X.eff(st, { coach: 2 }); return 'Der Trainer will dich halten und verspricht dir mehr Verantwortung.'; } return 'Der Trainer: „Ich kann dir nichts versprechen.“'; } },
        { l: 'Ablehnen', fx: function (st, c) { if (c.ag && c.ag.a.comm > 70) { AG.trust(st, -2, 'Anbahnung abgelehnt'); return 'Dein Berater klingt enttäuscht.'; } return 'Abgesagt.'; } }] },
    { id: 'ag_interest_info', cat: 'transfer', ic: '🔎', follow: true, inbox: true, ti: 'Einsatzchancen geprüft', t: function (c, d) { var cl = clubOf(c.st, d); var a = A(c); var said = a && a.a.hon < 55 ? d.claim : d.rank; return an(c) + ': „Bei ' + (cl ? cl.short : 'dem Verein') + ' wärst du Nr. ' + said + ' auf deiner Position (' + AG.chanceText(said, c.p.pos) + ').“'; },
      o: [{ l: 'Angebot anfordern', fx: function (st, c, d) { var cl = clubOf(st, d); if (!cl) return ''; offerFrom(st, cl, R.randRange(1, 1.2)); return 'Angebot liegt vor.'; } }, { l: 'Zweite Meinung (Scout) einholen', fx: function (st, c, d) { var cost = Math.round(Math.max(800 * K, c.p.wage * 0.005) / 100) * 100; if (R.pf) R.pf.book(st, -cost, 'Beratungskosten'); var a = A(c); if (a && d.claim < d.rank) { AG.know(st, a.id, 'hon', 2); AG.trust(st, -7, 'Einsatzchancen schöngeredet'); return 'Der Scout sieht dich dort nur als Nr. ' + d.rank + '. Dein Berater hat übertrieben.'; } if (a) AG.know(st, a.id, 'hon', 1); return 'Der Scout bestätigt: Nr. ' + d.rank + '.'; } }, { l: 'Kein Interesse', fx: function () { return 'Abgehakt.'; } }] },
    { id: 'ag_push', cat: 'berater', ic: '💸', follow: true, inbox: true, exp: 3, cd: 20, ti: 'Dein Berater drängt', t: function (c, d) { var cl = clubOf(c.st, d) || randClub(c.st, c.p, true); if (cl) d.club = cl.id; return '„Du bist Stammspieler, klar – aber ' + (cl ? cl.name : 'ein Verein') + ' würde deutlich mehr zahlen. Jetzt ist dein Marktwert am höchsten. Wir sollten wechseln!“'; },
      o: [{ l: 'Wechsel anbahnen lassen', fx: function (st, c, d) { var cl = clubOf(st, d) || randClub(st, c.p, true); if (!cl) return ''; offerFrom(st, cl, R.randRange(1.15, 1.45)); X.eff(st, { coach: -3, board: -3 }); X.mem(st, 'pushed', 1); return 'Angebot von ' + cl.short + ' liegt vor. Im Verein spricht sich das herum.'; } },
        { l: 'Nach seiner Provision fragen', fx: function (st, c) { var a = A(c); if (!a) return ''; AG.know(st, a.id, 'comm', 1); if (a.a.hon >= 55) { AG.trust(st, 2, 'Offen über Provision gesprochen'); return 'Er nennt offen seine Provision. Immerhin ehrlich.'; } AG.trust(st, -3, 'Weicht bei Provision aus'); return 'Er weicht aus. Das gibt dir zu denken.'; } },
        { l: 'Ich bleibe – Thema erledigt', fx: function (st, c) { var a = A(c); if (a && a.a.loy < 45) { AG.trust(st, -3); return 'Er ist verstimmt.'; } return X.eff(st, { coach: 1, board: 2 }); } }] },
    { id: 'ag_fake', cat: 'berater', ic: '🌍', follow: true, inbox: true, exp: 3, cd: 60, ti: 'Angeblicher Spitzenverein', t: function (c) { return an(c) + ': „Ganz vertraulich: Ein europäischer Topclub ist konkret an dir interessiert. Unterschreib auf keinen Fall die Verlängerung, da kommt etwas viel Größeres!“'; },
      o: [{ l: 'Ihm vertrauen – Verlängerung liegen lassen', fx: function (st, c) { var ag = AG.ensure(st); ag.fakeOn = { t: tick(st), real: c.ag ? R.chance(c.ag.a.hon / 140) : false }; X.setFlag(st, 'fakeRelied', 1); X.later(st, R.randInt(4, 8), 'ag_fake_reveal', {}); return 'Du wartest auf das große Angebot.'; } },
        { l: 'Konkrete Belege verlangen', fx: function (st, c) { var a = A(c); if (!a) return ''; AG.know(st, a.id, 'hon', 1); if (a.a.hon < 50) { AG.trust(st, -6, 'Konnte keine Belege liefern'); return 'Er druckst herum – Belege gibt es keine.'; } AG.ensure(st).fakeOn = { t: tick(st), real: true }; X.later(st, R.randInt(3, 6), 'ag_fake_reveal', {}); return 'Er zeigt dir eine echte Anfrage. Es scheint etwas dran zu sein.'; } },
        { l: 'Lieber den Spatz in der Hand', fx: function (st) { return X.eff(st, { board: 2 }); } }] },
    { id: 'ag_fake_reveal', cat: 'berater', ic: '🎭', follow: true, prio: 2, ti: 'Was wurde aus dem Topclub?', t: function (c) { var f = AG.ensure(c.st).fakeOn; return f && f.real ? 'Es war kein Bluff: Ein großer Verein legt tatsächlich ein Angebot vor!' : 'Wochen vergehen. Vom angeblichen Topclub kommt nichts. Es war offenbar nur ein unverbindlicher Kontakt – oder gar nichts.'; },
      o: [{ l: 'Weiter', fx: function (st, c) { var ag = AG.ensure(st), f = ag.fakeOn; ag.fakeOn = null; var a = A(c); if (f && f.real) { var cl = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (x) { return x.league === 1 && x.id !== c.p.clubId; }).sort(function (x, y) { return y.reputation - x.reputation; })[R.randInt(0, 3)]; if (cl) offerFrom(st, cl, R.randRange(1.2, 1.5)); if (a) { AG.trust(st, 10, 'Topclub-Kontakt war echt'); AG.know(st, a.id, 'net', 2); } return 'Angebot von ' + (cl ? cl.name : 'einem Topclub') + '!'; } if (a) { AG.trust(st, -22, 'Falsches Versprechen'); AG.know(st, a.id, 'hon', 2); } X.setFlag(st, 'burnedByAgent', st.season); var own = st.pc.offers.some(function (o) { return o.renew; }); return own ? 'Die Verlängerung liegt zum Glück noch auf dem Tisch.' : 'Die Verlängerung ist inzwischen vom Tisch. Das wird teuer.'; } }] },
    { id: 'ag_sponsor', cat: 'sponsor', ic: '👟', follow: true, inbox: true, exp: 4, cd: 30, ti: 'Sponsorenangebot', t: function (c, d) { var amt = d.amt || Math.round(Math.max(3000 * K, c.p.wage * (0.05 + c.pc.fame / 600)) / 1000) * 1000; d.amt = amt; return an(c) + ' hat einen Ausrüstervertrag besorgt: ' + R.fmtMoney(amt) + ' pro Jahr für zwei Jahre, dazu zwei Werbedrehs pro Saison.'; },
      o: [{ l: 'Unterschreiben', fx: function (st, c, d) { var amt = d.amt; if (R.pf) R.pf.addSponsor(st, { n: 'Ausrüstervertrag', y: amt, weeks: 104 }); if (c.ag) { AG.trust(st, 3, 'Sponsor besorgt'); AG.know(st, c.ag.id, 'med', 1); } return 'Sponsorvertrag läuft: ' + R.fmtMoney(amt) + '/Jahr.'; } },
        { l: 'Höher pokern', fx: function (st, c, d) { var a = A(c), amt = d.amt; if (a && R.chance(a.a.neg / 140)) { amt = Math.round(amt * 1.3 / 1000) * 1000; if (R.pf) R.pf.addSponsor(st, { n: 'Ausrüstervertrag', y: amt, weeks: 104 }); return 'Nachverhandelt: ' + R.fmtMoney(amt) + '/Jahr.'; } return 'Der Sponsor springt ab.'; } },
        { l: 'Ablehnen', fx: function () { return 'Kein Sponsor.'; } }] },
    { id: 'ag_warn', cat: 'berater', ic: '🛑', follow: true, inbox: true, cd: 6, ti: 'Dein Berater warnt', t: function (c) { var o = c.pc.offers.filter(function (x) { return !x.renew && x.info && x.info.rank > AG.SLOTS[c.p.pos] + 1; })[0]; c._o = o && o.id; return '„Das Angebot von ' + (o ? c.st.clubs[o.clubId].short : 'dem Verein') + ' sieht nach viel Geld aus, aber dort sitzt du auf der Bank. Ich rate ab – auch wenn ich dabei weniger verdiene.“'; },
      o: [{ l: 'Danke für die Ehrlichkeit', fx: function (st, c) { if (c.ag) { AG.trust(st, 6, 'Ehrliche Warnung'); AG.know(st, c.ag.id, 'hon', 1); AG.know(st, c.ag.id, 'care', 1); } return 'Vertrauen wächst.'; } }, { l: 'Ich entscheide selbst', fx: function (st) { AG.trust(st, -1); return 'Notiert.'; } }] },
    { id: 'ag_renewprep', cat: 'vertrag', ic: '🗂️', follow: true, inbox: true, cd: 20, ti: 'Vertragsverlängerung vorbereiten', t: function (c) { return an(c) + ': „Dein Vertrag läuft aus. Soll ich mit dem Verein über eine Verlängerung sprechen, bevor andere Vereine kommen?“' + (AG.ensure(c.st).con && AG.ensure(c.st).con.power ? ' (Du hast ihm eine Verhandlungsvollmacht erteilt – unterschreiben darf er trotzdem nur mit deinem OK.)' : ''); },
      o: [{ l: 'Ja, Gespräche aufnehmen', fx: function (st, c) { var p = c.p; if (!c.c) return ''; var a = A(c), f = W.fairWage(p) * (1 + c.pc.fame / 250) * (a ? 1 + (a.a.neg - 60) / 260 : 1); var o = { id: 'own' + tick(st), clubId: p.clubId, renew: true, wage: Math.round(f * (0.92 + c.pc.trust / 500) / 1000) * 1000, years: p.age >= 31 ? 1 : R.randInt(2, 3) }; st.pc.offers.push(o); AG.enrich(st, o); return 'Der Verein legt eine Verlängerung vor: ' + R.fmtMoney(o.wage) + '/Jahr.'; } }, { l: 'Noch abwarten', fx: function () { return 'Du wartest auf den Markt.'; } }] },
    { id: 'ag_invest', cat: 'finanzen', ic: '📈', follow: true, inbox: true, cd: 60, ti: 'Ein „heißer Tipp“ deines Beraters', t: function (c) { return an(c) + ' empfiehlt dir, einen großen Teil deiner Ersparnisse in eine Kryptowährung zu stecken: „Da steigen gerade alle Profis ein.“ (Er ist kein Finanzberater.)'; },
      o: [{ l: 'Große Summe investieren', hint: 'hohes Risiko', fx: function (st, c) { var r = R.pf ? R.pf.investTip(st, 0.5) : null; X.setFlag(st, 'agTip', tick(st)); X.later(st, 12, 'ag_invest_review', {}); return r || 'Investiert.'; } }, { l: 'Einen kleinen Teil investieren', fx: function (st) { var r = R.pf ? R.pf.investTip(st, 0.1) : null; X.later(st, 12, 'ag_invest_review', {}); return r || 'Investiert.'; } }, { l: 'Meinen Finanzberater fragen', req: function (c) { return !!c.fa; }, fx: function (st, c) { var g = c.fa && R.fa.quality(c.fa) > 55; if (R.fa) R.fa.know(st, c.fa.id, 'kap', 1); return g ? 'Dein Finanzberater rät klar ab: viel zu konzentriert, viel zu riskant.' : 'Dein Finanzberater findet die Idee „spannend“.'; } }, { l: 'Ablehnen – Sport und Geld trennen', fx: function (st, c) { if (c.ag) AG.know(st, c.ag.id, 'comm', 1); return X.eff(st, { disc: 2 }); } }] },
    { id: 'ag_invest_review', cat: 'finanzen', ic: '📉', follow: true, ti: 'Der Tipp, ein Vierteljahr später', t: function (c) { var g = R.pf ? R.pf.tipResult(c.st) : 0; return g >= 0 ? 'Der Krypto-Tipp deines Beraters liegt bei ' + (g >= 0 ? '+' : '') + Math.round(g * 100) + ' %. Glück gehabt – oder doch ein gutes Gespür?' : 'Der Krypto-Tipp deines Beraters liegt bei ' + Math.round(g * 100) + ' %. Das tut weh.'; },
      o: [{ l: 'Berater zur Rede stellen', req: function (c) { return !!c.ag; }, fx: function (st, c) { var g = R.pf ? R.pf.tipResult(st) : 0; if (g < -0.2) { AG.trust(st, -10, 'Riskanter Anlagetipp ging schief'); AG.know(st, c.ag.id, 'risk', 2); return 'Er schiebt es auf den Markt.'; } return 'Er grinst.'; } }, { l: 'Abhaken', fx: function () { return 'Lehrgeld oder Glück – das Depot rechnet weiter.'; } }] },
    { id: 'ag_media', cat: 'medien', ic: '📰', follow: true, inbox: true, cd: 30, ti: 'Dein Berater spielt über die Medien', t: function (c) { return an(c) + ' lässt in einer Zeitung durchblicken, dass du „über deine Zukunft nachdenkst“. Er will so den Druck auf den Verein erhöhen.'; },
      o: [{ l: 'Mitspielen', hint: 'mehr Geld möglich, Vereinsführung verärgert', fx: function (st) { st.pc.offers.forEach(function (o) { if (o.renew) o.wage = Math.round(o.wage * 1.1 / 1000) * 1000; }); X.mem(st, 'mediaPoker', 1); return X.eff(st, { board: -8, fans: -4, fame: 2 }); } }, { l: 'Öffentlich dementieren', fx: function (st, c) { if (c.ag) AG.trust(st, -4, 'Öffentlich dementiert'); return X.eff(st, { board: 5, fans: 4 }); } }] },
    { id: 'ag_conflict', cat: 'berater', ic: '⚖️', follow: true, inbox: true, ti: 'Interessenkonflikt', t: function (c, d) { var cl = clubOf(c.st, d); return 'Du erfährst: ' + an(c) + ' vertritt bei ' + (cl ? cl.short : 'dem interessierten Verein') + ' bereits den Stammspieler auf deiner Position. Wessen Interessen vertritt er bei diesem Wechsel?'; },
      o: [{ l: 'Offen ansprechen', fx: function (st, c) { var a = A(c); if (!a) return ''; AG.know(st, a.id, 'hon', 1); if (a.a.hon >= 60) { AG.trust(st, 3, 'Konflikt offen erklärt'); return 'Er legt alles offen und bietet an, einen Kollegen einzuschalten.'; } AG.trust(st, -8, 'Konflikt verschwiegen'); return 'Er wiegelt ab. Vertrauen beschädigt.'; } }, { l: 'Unabhängigen Anwalt einschalten', fx: function (st, c, d) { var cost = Math.round(Math.max(2000 * K, c.p.wage * 0.008) / 100) * 100; if (R.pf) R.pf.book(st, -cost, 'Beratungskosten'); st.pc.offers.forEach(function (o) { if (o.clubId === d.club && o.chk) { o.chk.second = true; o.chk.info = true; o.chk.clauses = true; } }); return 'Der Anwalt übernimmt die Prüfung (' + R.fmtMoney(cost) + ').'; } }, { l: 'Ignorieren', fx: function () { return 'Du lässt es laufen.'; } }] },
    { id: 'ag_contract_end', cat: 'berater', ic: '📅', follow: true, inbox: true, exp: 4, ti: 'Beratervertrag läuft aus', t: function (c) { var ag = AG.ensure(c.st); return 'Der Vertrag mit ' + an(c) + ' endet. Vertrauen: ' + Math.round(ag.trust) + '/100. Verlängern?'; },
      o: [{ l: 'Verlängern', fx: function (st, c) { var ag = AG.ensure(st), r = AG.rules(st); ag.con.until = tick(st) + r.maxYears * 52; ag.con.fee = AG.terms(st, c.ag).fee; return 'Verlängert um ' + r.maxYears + ' Jahre.'; } }, { l: 'Auslaufen lassen', fx: function (st) { var ag = AG.ensure(st); if (ag.con) ag.con.until = tick(st); AG.fire(st, true); return 'Du vertrittst dich vorerst selbst.'; } }] },
    { id: 'ag_quits', cat: 'berater', ic: '🚪', follow: true, prio: 1, ti: 'Dein Berater beendet die Zusammenarbeit', t: function (c) { return an(c) + ' kündigt: „Wir passen nicht zusammen.“ ' + (AG.ensure(c.st).ign >= 4 ? 'Du hast seine Ratschläge zu oft ignoriert.' : AG.ensure(c.st).trust < 20 ? 'Das Vertrauen ist aufgebraucht.' : 'Er setzt auf größere Namen.'); },
      o: [{ l: 'Okay', fx: function (st) { var ag = AG.ensure(st); if (ag.cur) { ag.hist.push({ id: ag.cur, n: (AG.current(st) || {}).n, from: ag.con.start, to: tick(st), why: 'vom Berater beendet' }); ag.cur = null; ag.con = null; st.pc.agent = false; ag.pend = []; } return 'Du bist wieder ohne Berater.'; } }] },
    { id: 'ag_revenge', cat: 'medien', ic: '🗞️', follow: true, ti: 'Der Ex-Berater redet', t: function () { return 'Dein früherer Berater erzählt in einem Interview, du seist „schwierig“ und „undankbar“.'; },
      o: [{ l: 'Sachlich reagieren', fx: function (st) { return X.eff(st, { press: 2, media: 2 }); } }, { l: 'Zurückschießen', fx: function (st) { return X.eff(st, { press: -5, fame: 2, stress: 4 }); } }, { l: 'Schweigen', fx: function (st) { return X.eff(st, { press: -2 }); } }] },
    { id: 'tr_bench', cat: 'transfer', ic: '🪑', w: 1.2, cd: 30, when: function (c) { return c.pro && c.share != null && c.share < 0.3 && c.st.week > 8; }, ti: 'Kaum Einsatzzeit', t: function (c) { return 'Du sitzt meist draußen. ' + (X.mem(c.st, 'pushedToBench') ? 'Genau davor wurdest du vor dem Wechsel gewarnt – oder eben nicht.' : 'Wie gehst du damit um?'); },
      o: [{ l: 'Im Training Gas geben', fx: function (st) { return X.eff(st, { coach: 4, stress: 2 }); } }, { l: 'Leihe im Winter anfragen', fx: function (st, c) { X.later(st, 2, 'tr_loan', {}); return 'Der Verein prüft eine Leihe.'; } }, { l: 'Öffentlich Spielzeit fordern', fx: function (st) { return X.eff(st, { coach: -8, fame: 2, board: -3 }); } }] },
    { id: 'tr_loan', cat: 'transfer', ic: '🔄', follow: true, ti: 'Leihgeschäft', t: function (c) { return 'Ein Zweitligist würde dich bis Saisonende ausleihen: Spielpraxis statt Bank.'; },
      o: [{ l: 'Annehmen (Wechsel zur neuen Saison per Angebot)', fx: function (st, c) { var cl = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (x) { return x.league === Math.min(3, (c.lg || 1) + 1) && x.id !== c.p.clubId; }); if (cl.length) { var k = R.pick(cl); offerFrom(st, k, 1.0); return 'Angebot von ' + k.short + ' liegt vor.'; } return ''; } }, { l: 'Lieber durchbeißen', fx: function (st) { return X.eff(st, { amb: 2, coach: 1 }); } }] },
    { id: 'tr_rival_signing', cat: 'rival', ic: '🆕', w: 0.8, cd: 50, when: function (c) { return c.pro && c.season && c.st.week > 3 && c.st.week < 15; }, ti: 'Neuer Konkurrent', t: function (c) { return 'Der Verein hat einen Spieler für deine Position geholt. Der Trainer spricht von „gesundem Konkurrenzkampf“.'; },
      o: [{ l: 'Annehmen – Leistung zählt', fx: function (st) { return X.eff(st, { amb: 3, coach: 2 }); } }, { l: 'Beim Sportdirektor beschweren', fx: function (st) { return X.eff(st, { board: -4, coach: -2 }); } }, { l: 'Berater auf den Markt schicken', req: function (c) { return !!c.ag; }, fx: function (st, c) { X.fire(st, 'ag_interest', {}, true); return 'Dein Berater hört sich um.'; } }] },
    { id: 'tr_hometown', cat: 'transfer', ic: '🏠', cd: 80, when: function (c) { return c.pro && c.age >= 27 && c.cx.prof.home && c.pc.fame >= 15; }, ti: 'Ruf der Heimat', t: function (c) { return 'Der Verein aus deiner Heimat ' + (c.cx.prof.home ? '(' + c.cx.prof.home + ')' : '') + ' fragt, ob du dir eine Rückkehr vorstellen kannst – für weniger Geld.'; },
      o: [{ l: 'Gespräche führen', fx: function (st, c) { var cl = randClub(st, c.p, false); if (cl) { var o = offerFrom(st, cl, 0.8); o.role = 'Heimatverein'; } return X.eff(st, { family: 8 }) + '. Angebot liegt vor.'; } }, { l: 'Noch nicht', fx: function (st) { return X.eff(st, { family: -2 }); } }] },
    { id: 'tr_deadline', cat: 'transfer', ic: '⏰', cd: 60, when: function (c) { return c.pro && c.st.week === S.WINTER_AFTER && c.ag && c.ag.a.risk > 55; }, ti: 'Deadline Day', t: function (c) { return an(c) + ' ruft um 23 Uhr an: „Last-Minute-Angebot! Entscheide dich in 30 Minuten.“'; },
      o: [{ l: 'Anhören', fx: function (st, c) { var cl = randClub(st, c.p, false); if (cl) offerFrom(st, cl, R.randRange(1.1, 1.5)); return 'Ein Angebot unter Zeitdruck liegt vor.'; } }, { l: 'Unter Zeitdruck entscheide ich nicht', fx: function (st) { return X.eff(st, { disc: 2 }); } }] },
    { id: 'tr_board_talk', cat: 'vertrag', ic: '🏛️', cd: 60, when: function (c) { return c.pro && c.p.contract <= 1 && c.share != null && c.share > 0.5; }, ti: 'Gespräch mit der Vereinsführung', t: function () { return 'Der Sportdirektor bittet dich zum Gespräch: Man möchte langfristig planen. Wie trittst du auf?'; },
      o: [{ l: 'Loyal und bescheiden', fx: function (st, c) { var f = W.fairWage(c.p); var o = { id: 'own' + tick(st), clubId: c.p.clubId, renew: true, wage: Math.round(f * 0.95 / 1000) * 1000, years: R.randInt(3, 4) }; st.pc.offers.push(o); AG.enrich(st, o); return X.eff(st, { board: 6 }) + '. Langfristiges Angebot liegt vor.'; } }, { l: 'Selbstbewusst fordern', fx: function (st, c) { var f = W.fairWage(c.p); var o = { id: 'own' + tick(st), clubId: c.p.clubId, renew: true, wage: Math.round(f * 1.1 / 1000) * 1000, years: 2 }; st.pc.offers.push(o); AG.enrich(st, o); return X.eff(st, { board: -2 }) + '. Angebot liegt vor.'; } }, { l: 'Auf den Berater verweisen', req: function (c) { return !!c.ag; }, fx: function (st) { X.fire(st, 'ag_renewprep', {}, true); return 'Dein Berater übernimmt.'; } }] },
    { id: 'tr_long_offer', cat: 'vertrag', ic: '📜', cd: 70, when: function (c) { return c.pro && c.age <= 26 && c.pc.fame >= 25; }, ti: 'Hochdotierter Langzeitvertrag', t: function (c) { return 'Ein finanzstarker Verein bietet einen Fünfjahresvertrag mit Spitzengehalt. Die sportliche Perspektive ist unklar.'; },
      o: [{ l: 'Berater prüfen lassen', req: function (c) { return !!c.ag; }, fx: function (st, c) { var a = c.ag; if (a.a.hon + a.a.care > 130) { AG.trust(st, 8, 'Hat problematische Klauseln aufgedeckt'); AG.know(st, a.id, 'hon', 2); return a.n + ' rät ab: Klauseln zu Leihe und Gehaltskürzung, dazu drei Konkurrenten. Er verzichtet damit auf eine hohe Provision.'; } return a.n + ': „Unterschreib!“ Er hat das Kleingedruckte offenbar nicht gelesen.'; } }, { l: 'Angebot anfordern', fx: function (st, c) { var cl = randClub(st, c.p, true); if (!cl) return ''; var o = offerFrom(st, cl, 1.5); o.years = 5; o.cl = ['leih', 'abstieg']; return 'Angebot liegt vor: ' + R.fmtMoney(o.wage) + '/Jahr, 5 Jahre.'; } }, { l: 'Kein Interesse', fx: function () { return 'Abgesagt.'; } }] },
    { id: 'ag_trust_check', cat: 'berater', ic: '🧭', cd: 40, when: function (c) { return !!c.ag && AG.ensure(c.st).trust < 35; }, ti: 'Zweifel am Berater', t: function (c) { return 'Dein Vertrauen in ' + an(c) + ' ist angeknackst. Was tust du?'; },
      o: [{ l: 'Zur Rede stellen', fx: function (st, c) { var a = c.ag; AG.know(st, a.id, 'hon', 1); AG.know(st, a.id, 'loy', 1); if (a.a.hon > 55) { AG.trust(st, 10, 'Aussprache'); return 'Eine ehrliche Aussprache – es geht weiter.'; } AG.trust(st, -5); return 'Ausreden. Es wird nicht besser.'; } }, { l: 'Andere Agenturen anhören', fx: function (st) { X.setFlag(st, 'agMarket', 1); return 'Die Konkurrenz wartet unter „Berater & Verträge“.'; } }, { l: 'Weitermachen', fx: function () { return 'Du gibst ihm noch eine Chance.'; } }] },
    { id: 'ag_rival_client', cat: 'berater', ic: '🔀', cd: 80, when: function (c) { return !!c.ag && !!c.rival && c.ag.a.comm > 50; }, ti: 'Gleicher Berater wie dein Rivale', t: function (c) { return 'Überraschung: ' + c.rival.name + ', dein Konkurrent im Kader, hat jetzt denselben Berater wie du.'; },
      o: [{ l: 'Kein Problem', fx: function (st, c) { c.ag.cl.push({ name: c.rival.name, pos: c.p.pos, clubId: c.p.clubId }); return 'Abwarten.'; } }, { l: 'Exklusivität verlangen', fx: function (st, c) { if (c.ag.a.loy > 55) { AG.trust(st, 4, 'Hat dich bevorzugt'); return 'Er gibt den Rivalen an einen Kollegen ab.'; } AG.trust(st, -6, 'Verweigert Exklusivität'); c.ag.cl.push({ name: c.rival.name, pos: c.p.pos, clubId: c.p.clubId }); return 'Er lehnt ab.'; } }] },
    { id: 'ag_scandal', cat: 'berater', ic: '🚨', cd: 200, w: 0.4, when: function (c) { return !!c.ag && c.ag.a.hon < 40; }, ti: 'Ermittlungen gegen deinen Berater', t: function (c) { return 'Gegen ' + an(c) + ' wird wegen fragwürdiger Provisionszahlungen ermittelt. Die Presse fragt dich nach deiner Meinung.'; },
      o: [{ l: 'Trennung verkünden', fx: function (st) { AG.fire(st, true); return X.eff(st, { press: 4, board: 3 }); } }, { l: 'Hinter ihm stehen', fx: function (st, c) { AG.know(st, c.ag.id, 'hon', 2); return X.eff(st, { press: -6 }); } }] },
    { id: 'ag_self_neg', cat: 'vertrag', ic: '🧑‍💼', cd: 60, when: function (c) { return !c.ag && c.pro && c.p.contract <= 1 && c.st.week > 12; }, ti: 'Ohne Berater verhandeln', t: function () { return 'Der Verein bittet dich direkt zum Vertragsgespräch – ganz ohne Berater.'; },
      o: [{ l: 'Selbstbewusst verhandeln', fx: function (st, c) { var pS = 0.3 + c.cx.per.conf / 200; var f = W.fairWage(c.p) * (R.rand() < pS ? 1.05 : 0.88); var o = { id: 'own' + tick(st), clubId: c.p.clubId, renew: true, wage: Math.round(f / 1000) * 1000, years: R.randInt(2, 3) }; st.pc.offers.push(o); AG.enrich(st, o); return 'Angebot liegt vor: ' + R.fmtMoney(o.wage) + '/Jahr.'; } }, { l: 'Doch einen Berater suchen', fx: function (st) { X.setFlag(st, 'agMarket', 1); return 'Der Beratermarkt steht dir offen.'; } }] },
    { id: 'ag_two_advisors', cat: 'berater', ic: '🤼', cd: 70, when: function (c) { return !!c.ag && !!c.fa && c.pc.offers.some(function (o) { return !o.renew && o.rec && o.rec.r === 'accept'; }) && c.sec <= 3; }, ti: 'Zwei Berater, zwei Meinungen', t: function (c) { return an(c) + ' drängt auf den lukrativen Wechsel. ' + c.fa.n + ', dein Finanzberater, hält dagegen: „Finanziell hast du das gar nicht nötig – und du verlierst dein Umfeld.“'; },
      o: [{ l: 'Auf den Spielerberater hören', fx: function (st) { return X.eff(st, { amb: 2 }); } }, { l: 'Auf den Finanzberater hören', fx: function (st, c) { AG.trust(st, -3, 'Rat des Finanzberaters vorgezogen'); return X.eff(st, { family: 3 }); } }, { l: 'Beide an einen Tisch holen', fx: function (st, c) { if (c.ag.a.care + c.fa.a.ehr > 120) { AG.trust(st, 3); return 'Ein konstruktives Gespräch – jetzt kennst du alle Zahlen.'; } return 'Die beiden geraten aneinander.'; } }] },
    { id: 'tr_release_clause', cat: 'transfer', ic: '🔓', cd: 90, when: function (c) { return c.pro && !!c.ag && c.share > 0.5 && c.form >= 6.6 && c.age <= 29; }, ti: 'Ausstiegsklausel', t: function (c) { return an(c) + ' schlägt vor, in die nächste Vertragsverlängerung eine Ausstiegsklausel einbauen zu lassen. Der Verein wäre dafür nur bei geringerem Gehalt bereit.'; },
      o: [{ l: 'Klausel fordern, weniger Gehalt', fx: function (st) { X.setFlag(st, 'releaseClause', 1); var p = C.player(st); if (p) p.wage = Math.round(p.wage * 0.93); return X.eff(st, { board: -2, amb: 2 }) + ' Gehalt −7 %, dafür flexibler bei Angeboten.'; } }, { l: 'Kein Interesse – ich will hier bleiben', fx: function (st) { AG.trust(st, -1); return X.eff(st, { board: 3, fans: 2 }); } }, { l: 'Erst später darüber reden', fx: function () { return 'Das Thema ist vertagt.'; } }] }
  ]);
})(RFM);
