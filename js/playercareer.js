// Spielerkarriere: Du bist ein Spieler und bestimmst sein Leben (Training, Lebensstil, Entscheidungen, Verträge,
// Wechsel, Karriereende). Die Spiele selbst steuert die KI – Einsätze hängen von Stärke, Form und dem Vertrauen
// des Trainers ab. Nach dem Karriereende geht es auf Wunsch als Manager weiter. In beiden Spielen gleich (CFG je Sportart).
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, T = R.transfers;
  var C = R.pc = {};
  var CFG = C.CFG = { sport: 'Handball', goalWord: 'Tore', natOvr: 76, nat: 'Nationalmannschaft', goalsBig: [50, 250, 500], rBase: 7.3, rGood: 8.1, rScale: 2, fameGoal: 0.03 };
  var K = D.MONEY || 1;
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'karriere'); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  C.active = function (st) { return !!(st && st.pc && !st.pc.retired); };
  C.player = function (st) { return st && st.pc ? st.players[st.pc.pid] || null : null; };
  C.club = function (st) { var p = C.player(st); return p && p.clubId ? st.clubs[p.clubId] : null; };
  C.isPc = function (st, p) { return !!(st && st.pc && p && p.id === st.pc.pid); };

  C.TALENT = { normal: { n: 'Talent', pot: 74 }, gross: { n: 'Großes Talent', pot: 84 }, wunder: { n: 'Wunderkind', pot: 92 } };
  C.FOCUS = {
    normal: { n: 'Normales Training', d: 'Ausgewogen, kein Risiko.', dev: 0 },
    extra: { n: 'Extraschichten', d: 'Schnellere Entwicklung, kostet Frische, kleines Verletzungsrisiko. Der Trainer sieht den Einsatz.', dev: 0.35, fit: -7, trust: 0.8, inj: 0.025 },
    video: { n: 'Videoanalyse & Taktik', d: 'Etwas bessere Entwicklung, der Trainer vertraut dir mehr.', dev: 0.08, trust: 1.5 },
    erholung: { n: 'Erholung', d: 'Volle Frische, langsamere Entwicklung.', dev: -0.15, fit: 10 },
    medien: { n: 'Medien & Social Media', d: 'Mehr Bekanntheit und Werbeeinnahmen, der Trainer sieht das kritisch.', dev: -0.05, fame: 1.5, trust: -0.6, cash: 0.25 },
    freizeit: { n: 'Freizeit & Freunde', d: 'Bessere Laune, etwas langsamere Entwicklung.', dev: -0.1, mor: 8, trust: -0.3 }
  };

  // ---------- Start ----------
  C.start = function (st, o) {
    var club = st.clubs[o.clubId]; if (!club) return null;
    Object.keys(st.clubs).forEach(function (k) { st.clubs[k].userControlled = false; });
    var pos = o.pos && D.posWeights[o.pos] ? o.pos : Object.keys(D.posWeights)[1];
    var youth = o.youth !== false, tal = C.TALENT[o.talent] || C.TALENT.normal;
    var base = W.fromMoneyScale ? W.fromMoneyScale(st, youth ? 42 : 50) : (youth ? 42 : 50);
    var p = W.genPlayer(st, pos, clamp(Math.round(base + (club.league === 1 ? 3 : club.league === 2 ? 1 : 0)), 30, 70), youth ? 16 : 18, club.id);
    p.first = String(o.first || 'Max').slice(0, 30); p.last = String(o.last || 'Mustermann').slice(0, 30);
    p.pot = clamp(Math.round(W.fromMoneyScale ? W.fromMoneyScale(st, tal.pot) : tal.pot) + R.randInt(-2, 2), p.ovr + 8, 99);
    p.youth = youth; p.homegrown = true; p.homeClub = club.id; p.contract = youth ? 3 : 2; p.custom = true; p.morale = 70;
    p.wage = Math.max((youth ? 8000 : 15000) * K, Math.round(W.fairWage(p) * (youth ? 0.5 : 0.8) / 1000) * 1000);
    W.recalc(p);
    var mg = st.manager; mg.clubId = null; mg.role = 'player'; mg.name = W.playerName(p); mg.unemployed = false; mg.offers = [];
    st.pc = { pid: p.id, start: st.season, talent: o.talent || 'normal', trust: 50, fame: 3, cash: 0, focus: 'normal', offers: [], offerSeason: null, log: [], ms: {}, last: { a: 0, r: 0, g: 0 }, club: club.id, seasons: [], agent: false, retired: false, nat: 0 };
    news(st, 'Die Karriere beginnt', W.playerName(p) + ' (' + p.age + ', ' + (D.posNames[pos] || pos) + ') startet ' + (youth ? 'in der Jugend' : 'im Profikader') + ' von ' + club.name + '.');
    return p;
  };

  // ---------- Entwicklung und Einsatz ----------
  C.devF = function (st, p) { var f = C.FOCUS[st.pc.focus] || C.FOCUS.normal; return Math.max(0.4, 1 + (f.dev || 0) + ((p.morale || 60) - 60) / 400); };
  C.lineupBias = function (st, p) { var t = st.pc.trust, form = p.form || 6; return clamp(1 + (t - 50) / 220 + (form - 6) / 60, 0.75, 1.3); };
  C.avgRating = function (p) { return p.stats.apps ? Math.round(p.stats.rsum / p.stats.apps * 10) / 10 : 0; };
  C.squadRank = function (st, p) { if (!p.clubId) return 0; var same = W.squad(st, p.clubId).filter(function (x) { return x.pos === p.pos && !x.youth; }).sort(function (a, b) { return b.ovr - a.ovr; }); return same.indexOf(p) + 1 || same.filter(function (x) { return x.ovr > p.ovr; }).length + 1; };
  C.addFame = function (st, x) { var pc = st.pc; pc.fame = clamp(pc.fame + (x > 0 ? x * (1 - pc.fame / 115) : x), 0, 100); };
  C.setFocus = function (st, k) { if (C.FOCUS[k]) st.pc.focus = k; };
  C.milestone = function (st, k, t, x) { var pc = st.pc; if (pc.ms[k]) return; pc.ms[k] = { s: st.season, w: st.week, t: t }; news(st, '⭐ ' + t, x || ''); C.addFame(st, 2); };

  C.weekly = function (st) {
    var pc = st.pc; if (!pc || pc.retired) return;
    var p = C.player(st); if (!p) { pc.retired = true; return; }
    var f = C.FOCUS[pc.focus] || C.FOCUS.normal;
    // Vereinswechsel bemerken
    C.checkClub(st, p);
    // Gehalt und Nebeneinnahmen
    pc.cash += Math.round(p.wage / E.WEEKS) + (f.cash ? Math.round(p.wage / E.WEEKS * f.cash * (0.5 + pc.fame / 50)) : 0);
    if (pc.agent) pc.cash -= Math.round(p.wage / E.WEEKS * 0.1);
    // Wochenfokus
    if (f.fit) p.fitness = clamp((p.fitness || 80) + f.fit, 20, 100);
    if (f.mor) p.morale = clamp((p.morale || 60) + f.mor * 0.5, 0, 100);
    if (f.trust) pc.trust = clamp(pc.trust + f.trust, 0, 100);
    if (f.fame) C.addFame(st, f.fame * 0.5);
    if (f.inj && !p.inj && R.chance(f.inj)) { var wks = R.randInt(1, 3); p.inj = { type: 'Muskelverhärtung (Extraschicht)', weeks: wks, total: wks }; news(st, 'Verletzt im Training', 'Zu viel gewollt: ' + wks + ' Woche(n) Pause.'); }
    // Spiel der Woche auswerten
    var da = p.stats.apps - pc.last.a, dg = p.stats.goals - pc.last.g, dr = p.stats.rsum - pc.last.r;
    if (da < 0) { da = p.stats.apps; dg = p.stats.goals; dr = p.stats.rsum; }
    if (da > 0) {
      var rt = dr / da;
      pc.trust = clamp(pc.trust + (rt - CFG.rBase) * CFG.rScale, 0, 100);
      C.addFame(st, dg * CFG.fameGoal + (rt >= CFG.rGood ? 0.6 : 0) + (p.clubId && st.clubs[p.clubId].league === 1 ? 0.12 : 0.04));
      pc.log.unshift({ s: st.season, w: st.week, c: p.clubId ? st.clubs[p.clubId].short : '–', r: Math.round(rt * 10) / 10, g: dg, a: da });
      pc.log = pc.log.slice(0, 40);
      if (!p.youth) C.milestone(st, 'debut', 'Profidebüt!', W.playerName(p) + ' feiert sein erstes Pflichtspiel für ' + st.clubs[p.clubId].short + '.');
      if (dg > 0) C.milestone(st, 'goal1', 'Das erste Profitor!', 'Ein Moment für die Ewigkeit.');
      if (p.clubId && st.clubs[p.clubId].league === 1) C.milestone(st, 'top', 'Debüt in der höchsten Liga', 'Angekommen in der ' + D.leagueNames[1] + '.');
    } else if (st.phase === 'season' && !p.inj && !p.youth) pc.trust = clamp(pc.trust + (50 - pc.trust) * 0.03, 0, 100);
    pc.last = { a: p.stats.apps, g: p.stats.goals, r: p.stats.rsum };
    var car = p.career ? p.career.goals : 0;
    CFG.goalsBig.forEach(function (n) { if (car >= n) C.milestone(st, 'g' + n, n + ' Karriere-' + CFG.goalWord + '!', ''); });
    // Jugend: Profivertrag?
    if (p.youth && p.clubId && st.phase === 'season' && st.week % 6 === 0) {
      var sq = W.squad(st, p.clubId).filter(function (x) { return !x.youth && x.pos === p.pos; }), avg = sq.length ? R.avg(sq, function (x) { return x.ovr; }) : 50;
      if (p.ovr >= avg - (p.age >= 18 ? 4 : p.age >= 17 ? 2 : 0) || (p.age >= 17 && p.ovr >= avg - 6 && pc.trust >= 65)) C.promote(st, 'Der Trainer holt dich zu den Profis!');
    }
    // Nationalmannschaft
    if (!p.youth && p.ovr >= W.fromMoneyScale(st, CFG.natOvr) && st.phase === 'season' && st.week % 8 === 4) {
      pc.nat++; pc.fame = clamp(pc.fame + 2, 0, 100);
      C.milestone(st, 'nat', 'Berufung in die ' + CFG.nat + '!', 'Der Bundestrainer setzt auf ' + W.playerName(p) + '.');
    }
    // Angebote ab der Rückrunde
    if (st.phase === 'season' && st.week >= S.WINTER_AFTER + 3 && pc.offerSeason !== st.season) C.makeOffers(st);
    // Ereignisse
    if (!st.pendingEvent && st.phase === 'season' && R.chance(0.13)) { var ev = C.randomEvent(st); if (ev) st.pendingEvent = ev; }
  };
  C.checkClub = function (st, p) { var pc = st.pc; if (p.clubId && p.clubId !== pc.club) { var nc = st.clubs[p.clubId]; news(st, 'Neuer Verein: ' + nc.name, W.playerName(p) + ' spielt ab sofort für ' + nc.short + '.'); pc.club = p.clubId; pc.trust = 45; } };
  C.promote = function (st, why) {
    var p = C.player(st); if (!p || !p.youth) return false;
    p.youth = false; p.trial = null; p.contract = Math.max(p.contract, 3); p.wage = Math.max(p.wage, Math.round(W.fairWage(p) * 0.7 / 1000) * 1000);
    news(st, 'Profivertrag!', (why || '') + ' ' + W.playerName(p) + ' unterschreibt bis ' + (st.season + p.contract) + '.');
    C.milestone(st, 'pro', 'Profivertrag unterschrieben', '');
    return true;
  };
  C.askPromotion = function (st) {
    var p = C.player(st); if (!p || !p.youth) return { ok: false, why: 'Du bist schon Profi.' };
    var pc = st.pc; if (pc.askedPro === st.season + ':' + Math.floor(st.week / 8)) return { ok: false, why: 'Du hast erst kürzlich gefragt.' };
    pc.askedPro = st.season + ':' + Math.floor(st.week / 8);
    var sq = W.squad(st, p.clubId).filter(function (x) { return !x.youth && x.pos === p.pos; }), avg = sq.length ? R.avg(sq, function (x) { return x.ovr; }) : 50;
    if (p.ovr >= avg - 9 + (pc.trust - 50) / 10 || p.age >= 19) { C.promote(st, 'Der Verein glaubt an dich.'); return { ok: true }; }
    pc.trust = clamp(pc.trust - 2, 0, 100);
    return { ok: false, why: 'Noch zu früh, sagt der Trainer. Du brauchst noch etwa ' + Math.ceil(avg - 9 - p.ovr) + ' Stärkepunkte.' };
  };

  // ---------- Angebote ----------
  C.makeOffers = function (st) {
    var pc = st.pc, p = C.player(st); if (!p) return;
    pc.offerSeason = st.season; pc.offers = [];
    var own = p.clubId && st.clubs[p.clubId], fair = W.fairWage(p) * (1 + pc.fame / 250) * (pc.agent ? 1.12 : 1);
    if (own && !p.youth && p.contract <= 2 && pc.trust >= 30) pc.offers.push({ id: 'own', clubId: own.id, renew: true, wage: Math.round(fair * (0.9 + pc.trust / 500) / 1000) * 1000, years: p.age >= 31 ? 1 : R.randInt(2, 4) });
    var want = p.ovr + (pc.agent ? 2 : 0) + pc.fame / 25;
    var cands = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && (!own || c.id !== own.id); }).map(function (c) {
      var sq = W.squad(st, c.id).filter(function (x) { return x.pos === p.pos; }).sort(function (a, b) { return b.ovr - a.ovr; }), top = sq.slice(0, Math.max(1, Math.ceil(sq.length / 2)));
      return { c: c, gap: want - (top.length ? R.avg(top, function (x) { return x.ovr; }) : 50) };
    }).filter(function (x) { return x.gap > -6; }).sort(function (a, b) { return (a.c.league - b.c.league) || (b.gap - a.gap); });
    var n = (p.youth ? 0 : 1) + (pc.agent ? 1 : 0) + (p.contract <= 1 ? 1 : 0) + (pc.fame > 40 ? 1 : 0);
    cands.slice(0, 12).sort(function () { return R.rand() - 0.5; }).slice(0, n).forEach(function (x, i) {
      pc.offers.push({ id: 'o' + i, clubId: x.c.id, wage: Math.round(fair * R.randRange(1.0, 1.2) / 1000) * 1000, years: R.randInt(2, 4), fee: p.contract > 1 ? Math.round(p.value / 50000) * 50000 : 0, role: x.gap > 3 ? 'Stammspieler' : x.gap > -1 ? 'Rotation' : 'Herausforderer' });
    });
    if (pc.offers.length) news(st, 'Vertragsangebote', pc.offers.length + ' Angebot(e) liegen vor – siehe „Mein Spieler“.');
  };
  C.acceptOffer = function (st, id) {
    var pc = st.pc, p = C.player(st), o = pc.offers.filter(function (x) { return x.id === id; })[0]; if (!o || !p) return { ok: false, why: 'Angebot nicht mehr gültig.' };
    var c = st.clubs[o.clubId];
    if (o.renew) { p.contract = o.years; p.wage = o.wage; pc.trust = clamp(pc.trust + 5, 0, 100); pc.offers = []; news(st, 'Vertrag verlängert', W.playerName(p) + ' bleibt bis ' + (st.season + o.years) + ' bei ' + c.short + '.'); return { ok: true, msg: 'Verlängert bis ' + (st.season + o.years) + '.' }; }
    if (T.isPending && T.isPending(st, p)) return { ok: false, why: 'Ein Wechsel ist bereits vereinbart.' };
    T.addPending(st, p, c, { fee: o.fee, wage: o.wage, years: o.years, free: !o.fee });
    pc.offers = []; pc.moving = { to: c.id, season: st.season };
    news(st, 'Wechsel zur neuen Saison', W.playerName(p) + ' wechselt zur neuen Saison zu ' + c.name + (o.fee ? ' (Ablöse ' + R.fmtMoney(o.fee) + ')' : ' (ablösefrei)') + '.');
    return { ok: true, msg: 'Wechsel zu ' + c.short + ' zur neuen Saison vereinbart.' };
  };
  C.declineOffer = function (st, id) { st.pc.offers = st.pc.offers.filter(function (x) { return x.id !== id; }); };

  // ---------- Ereignisse ----------
  function opt(l, a, hint) { return { l: l, plusAct: a, hint: hint }; }
  C.EVENTS = [
    { k: 'interview', ok: function (st, p) { return st.pc.fame >= 10; }, t: function (st, p) { return 'Ein Sportmagazin will ein großes Interview mit dir. Was sagst du zur Lage im Verein?'; },
      o: [opt('Diplomatisch bleiben', { k: 'pc', e: 'fame', v: 1 }, 'Bekanntheit +'), opt('Mehr Spielzeit fordern', { k: 'pc', e: 'push' }, 'Bekanntheit ++, Trainer verärgert'), opt('Absagen', { k: 'pc', e: 'none' })] },
    { k: 'party', ok: function () { return true; }, t: function () { return 'Ein paar Teamkollegen feiern heute Abend in der Stadt. Kommst du mit?'; },
      o: [opt('Mitfeiern', { k: 'pc', e: 'party' }, 'Laune +, Frische −, Risiko'), opt('Kurz vorbeischauen', { k: 'pc', e: 'mor', v: 4 }, 'Laune +'), opt('Zu Hause bleiben', { k: 'pc', e: 'trust', v: 1 }, 'Trainer +')] },
    { k: 'agent', ok: function (st) { return !st.pc.agent && st.pc.fame >= 8; }, t: function () { return 'Ein bekannter Spielerberater bietet dir seine Dienste an. Er nimmt 10 % deines Gehalts, holt dafür bessere Verträge und mehr Angebote.'; },
      o: [opt('Berater engagieren', { k: 'pc', e: 'agent' }, 'mehr Angebote, besseres Gehalt'), opt('Lieber allein verhandeln', { k: 'pc', e: 'none' })] },
    { k: 'ad', ok: function (st) { return st.pc.fame >= 20; }, t: function () { return 'Ein Sportartikelhersteller möchte dich für eine Werbekampagne.'; },
      o: [opt('Zusagen', { k: 'pc', e: 'ad' }, 'Geld +, Bekanntheit +'), opt('Ablehnen, Fokus auf Sport', { k: 'pc', e: 'trust', v: 2 }, 'Trainer +')] },
    { k: 'critic', ok: function (st, p) { return !p.youth && st.pc.trust < 55; }, t: function () { return 'Der Trainer kritisiert dich vor der Mannschaft: zu wenig Einsatz im Training.'; },
      o: [opt('Kritik annehmen und Gas geben', { k: 'pc', e: 'accept' }, 'Trainer +, Extraschichten'), opt('Widersprechen', { k: 'pc', e: 'argue' }, 'Risiko'), opt('Wechselwunsch äußern', { k: 'pc', e: 'away' }, 'Angebote, Trainer −−')] },
    { k: 'mentor', ok: function (st, p) { return p.age <= 21; }, t: function (st, p) { return 'Ein erfahrener Mitspieler bietet dir an, nach dem Training mit dir an deinen Schwächen zu arbeiten.'; },
      o: [opt('Gerne!', { k: 'pc', e: 'mentor' }, 'Stärke +'), opt('Danke, ich komme klar', { k: 'pc', e: 'none' })] },
    { k: 'charity', ok: function () { return true; }, t: function () { return 'Eine Kinderklinik fragt, ob du die jungen Patienten besuchst.'; },
      o: [opt('Natürlich', { k: 'pc', e: 'charity' }, 'Bekanntheit +, Laune +'), opt('Keine Zeit', { k: 'pc', e: 'none' })] },
    { k: 'fans', ok: function (st, p) { return !p.youth && p.form && p.form < 5.5; }, t: function () { return 'Nach schwachen Leistungen pfeifen dich einige Fans aus. Wie reagierst du?'; },
      o: [opt('Ruhig bleiben, auf dem Platz antworten', { k: 'pc', e: 'trust', v: 2 }, 'Trainer +'), opt('In den sozialen Medien zurückschießen', { k: 'pc', e: 'shitstorm' }, 'Ärger')] }
  ];
  C.randomEvent = function (st) {
    var p = C.player(st); if (!p) return null;
    var pool = C.EVENTS.filter(function (e) { return e.ok(st, p) && st.pc.lastEv !== e.k; }); if (!pool.length) return null;
    var e = R.pick(pool); st.pc.lastEv = e.k;
    return { custom: { t: e.t(st, p), ic: '🤾', o: e.o } };
  };
  C.act = function (st, a) {
    var pc = st.pc, p = C.player(st); if (!pc || !p) return null;
    var e = a.e, v = a.v || 0;
    if (e === 'none') return 'Okay.';
    if (e === 'fame') { pc.fame = clamp(pc.fame + 2 + v, 0, 100); return 'Gutes Interview – du wirst bekannter.'; }
    if (e === 'push') { pc.fame = clamp(pc.fame + 4, 0, 100); pc.trust = clamp(pc.trust - 8, 0, 100); return 'Das Interview schlägt Wellen. Der Trainer ist nicht begeistert.'; }
    if (e === 'party') { p.morale = clamp(p.morale + 10, 0, 100); p.fitness = clamp(p.fitness - 15, 20, 100); if (R.chance(0.25)) { pc.trust = clamp(pc.trust - 10, 0, 100); return 'Fotos von der Party landen in der Zeitung. Der Trainer tobt.'; } return 'Ein lustiger Abend – die Stimmung im Team ist super.'; }
    if (e === 'mor') { p.morale = clamp(p.morale + v, 0, 100); return 'Nett war’s.'; }
    if (e === 'trust') { pc.trust = clamp(pc.trust + v * 2, 0, 100); return 'Der Trainer registriert deine Professionalität.'; }
    if (e === 'agent') { pc.agent = true; return 'Du hast jetzt einen Berater. Er kümmert sich um Angebote.'; }
    if (e === 'ad') { var m = Math.max(5000 * K, Math.round(p.wage * 0.15 * (1 + pc.fame / 25) / 1000) * 1000); pc.cash += m; pc.fame = clamp(pc.fame + 3, 0, 100); return 'Kampagne läuft: ' + R.fmtMoney(m) + ' für dich.'; }
    if (e === 'accept') { pc.trust = clamp(pc.trust + 6, 0, 100); pc.focus = 'extra'; return 'Du gibst Gas – Fokus auf Extraschichten.'; }
    if (e === 'argue') { if (R.chance(0.4)) { pc.trust = clamp(pc.trust + 4, 0, 100); return 'Der Trainer respektiert deine Meinung.'; } pc.trust = clamp(pc.trust - 10, 0, 100); return 'Das kam gar nicht gut an.'; }
    if (e === 'away') { pc.trust = clamp(pc.trust - 15, 0, 100); pc.offerSeason = null; C.makeOffers(st); return 'Dein Wechselwunsch ist öffentlich. Andere Vereine melden sich.'; }
    if (e === 'mentor') { ['tec', 'pas', 'sho', 'def'].forEach(function (k) { if (p.attr[k] != null && p.pos !== 'TW') p.attr[k] = Math.min(99, p.attr[k] + 0.8); }); if (p.pos === 'TW') p.attr.gk = Math.min(99, p.attr.gk + 1.5); W.recalc(p); return 'Die Extraeinheiten zahlen sich aus.'; }
    if (e === 'charity') { pc.fame = clamp(pc.fame + 2, 0, 100); p.morale = clamp(p.morale + 6, 0, 100); return 'Ein bewegender Tag.'; }
    if (e === 'shitstorm') { pc.fame = clamp(pc.fame + 1, 0, 100); pc.trust = clamp(pc.trust - 6, 0, 100); p.morale = clamp(p.morale - 6, 0, 100); return 'Shitstorm – der Verein bittet um Zurückhaltung.'; }
    if (e === 'retire') { C.retire(st); return 'Du beendest deine Karriere.'; }
    if (e === 'goon') { pc.retireAsked = st.season; return 'Noch eine Saison!'; }
    return null;
  };

  // ---------- Saisonwechsel ----------
  C.seasonEnd = function (st) { // vor dem Altern
    var pc = st.pc, p = C.player(st); if (!pc || pc.retired || !p) return;
    var c = p.clubId && st.clubs[p.clubId], pos = 0, lg = c ? c.league : 0;
    if (c && st.finalTables) Object.keys(st.finalTables).forEach(function (k) { var i = (st.finalTables[k] || []).indexOf(c.id); if (i >= 0) { pos = i + 1; lg = +k || lg; } });
    pc.seasons.push({ season: st.season, club: c ? c.short : 'vereinslos', clubId: c ? c.id : null, league: lg, youth: !!p.youth, apps: p.stats.apps, goals: p.stats.goals, r: C.avgRating(p), ovr: p.ovr, pos: pos });
    if (c && pos === 1 && lg === 1 && !p.youth && p.stats.apps >= 5) { pc.titles = (pc.titles || []).concat(['Meister ' + st.season]); C.milestone(st, 'title' + st.season, 'Meister!', 'Der Titel mit ' + c.short + '!'); }
    var hs = st.history && st.history[st.history.length - 1]; if (hs && hs.season === st.season && c && hs.cup === c.id && !p.youth) pc.titles = (pc.titles || []).concat(['Pokalsieger ' + st.season]);
    pc.last = { a: 0, g: 0, r: 0 };
  };
  C.newSeason = function (st) { // nach st.season++
    var pc = st.pc, p = C.player(st); if (!pc || pc.retired) return;
    if (!p) { pc.retired = true; return; }
    pc.offers = []; pc.moving = null; C.checkClub(st, p);
    if (!p.clubId) { // vereinslos: nimmt das beste Angebot an
      var cands = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && W.squad(st, c.id).length < 27; })
        .sort(function (a, b) { return Math.abs(M_avg(st, a, p) - p.ovr) - Math.abs(M_avg(st, b, p) - p.ovr); });
      var c = cands[0];
      if (c) { T.executeTransfer(st, p, c, 0, Math.round(W.fairWage(p) / 1000) * 1000, 2); pc.club = c.id; pc.trust = 45; news(st, 'Neuer Verein: ' + c.name, 'Nach dem Vertragsende unterschreibt ' + W.playerName(p) + ' für zwei Jahre bei ' + c.short + '.'); }
    }
    if (p.age >= 38) { C.retire(st); return; }
    if (p.age >= 33 && pc.retireAsked !== st.season && !st.pendingEvent) {
      st.pendingEvent = { custom: { t: 'Mit ' + p.age + ' Jahren stellt sich die Frage: Noch eine Saison – oder ist jetzt der richtige Moment für das Karriereende? Danach kannst du als Manager weitermachen.', ic: '👋', o: [opt('Weiterspielen', { k: 'pc', e: 'goon' }), opt('Karriere beenden', { k: 'pc', e: 'retire' }, 'als Manager weitermachen')] } };
    }
  };
  function M_avg(st, c, p) { var sq = W.squad(st, c.id).filter(function (x) { return x.pos === p.pos; }); return sq.length ? R.avg(sq, function (x) { return x.ovr; }) : 50; }

  // ---------- Karriereende → Manager ----------
  C.retire = function (st) {
    var pc = st.pc, p = C.player(st); if (!pc || pc.retired) return;
    pc.retired = true; pc.retiredSeason = st.season;
    if (p) { pc.final = { name: W.playerName(p), apps: p.career ? p.career.apps : 0, goals: p.career ? p.career.goals : 0, ovr: p.ovr, age: p.age }; var c = p.clubId && st.clubs[p.clubId]; if (c && c.legends && pc.final.apps > 200) c.legends.push({ name: pc.final.name, apps: pc.final.apps, goals: pc.final.goals, season: st.season }); T.release(st, p); delete st.players[p.id]; }
    var mg = st.manager; mg.unemployed = true; mg.clubId = null; mg.role = 'manager'; mg.offers = []; mg.jobWeeks = 0; mg.reputation = clamp(Math.round(15 + pc.fame * 0.5), 10, 70); mg.history = mg.history || [];
    news(st, 'Karriereende', (pc.final ? pc.final.name + ' hängt die Schuhe an den Nagel: ' + pc.final.apps + ' Spiele, ' + pc.final.goals + ' ' + CFG.goalWord + '.' : '') + ' Als Manager-Neuling wartest du jetzt auf erste Jobangebote.');
  };
})(RFM);
