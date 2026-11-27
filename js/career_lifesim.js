// Spielerkarriere 3.0 – Lebenssimulation (wöchentlich): Partnerschaft (Kennenlernen bis Hochzeit, Krisen, Trennung),
// Familienplanung, Kinder (altern mit), Freunde (Pflege, Konflikte), Wohlbefinden, Zufriedenheit, Fangruppen,
// Journalisten, Auslöser für Gespräche (Presse, Fans, Trainer), Vertragsprämien, Leihe, Vereinsgelände-Aktivitäten.
// Konflikte Privatleben ↔ Sport als Ereignispaket „leben“. Der Karriere-Regisseur steuert nur Häufigkeit, nie Ergebnisse.
(function (R) {
  var L = R.life, X = R.cx, C = R.pc, W = R.world, D = R.data, T = R.transfers, S = R.season;
  if (!L || !X) return;
  var HB = X.HB, clamp = X.clamp, money = L.money, K = HB ? 0.45 : 1;
  function tick(st) { return st.tick || 0; }
  function chance(p) { return R.rand() < p; }
  function pick(a) { return a[Math.floor(R.rand() * a.length)]; }
  function fn(x) { return x ? x.name.split(' ')[0] : ''; }
  var GOALS = ['eine eigene Praxis', 'ein Jahr Weltreise', 'Karriere im eigenen Beruf', 'ein Haus im Grünen', 'eine große Familie', 'ein eigenes Geschäft'];
  var JOBS = ['Lehrerin/Lehrer', 'Ärztin/Arzt', 'Architektur', 'Pflege', 'Softwareentwicklung', 'Journalismus', 'Studium', 'Eigenes Café', 'Physiotherapie', 'Unternehmensberatung', 'Polizei', 'Mode & Design'];
  var INTR = ['Reisen', 'Kochen', 'Musik', 'Wandern', 'Kunst', 'Lesen', 'Yoga', 'Filme', 'Tiere', 'Fotografie', 'Tanzen', 'Gärtnern'];
  var WHERE = ['Auf der Geburtstagsfeier eines Freundes', 'Bei einer Benefizgala des Vereins', 'Im Lieblingscafé in der Innenstadt', 'Beim Physiotermin im Wartezimmer', 'Auf einer Hochzeit im Freundeskreis', 'Beim Sprachkurs'];

  // Ansehen & Zufriedenheit als sichtbare Persönlichkeitswerte
  X.PER.risk = 'Risikobereitschaft'; X.PER.resil = 'Stressresistenz'; X.PER.loyal = 'Loyalität'; X.PER.sat = 'Zufriedenheit';

  // ---------- Kontext für Ereignisse erweitern ----------
  var baseCtx = X.ctx;
  X.ctx = function (st) { var c = baseCtx(st); c.life = L.life(st); return c; };

  // ---------- Personen erzeugen ----------
  L.newCand = function (st) {
    var lf = L.life(st), g = R.rand() < 0.9 ? 'a' : 'b', intr = []; // überwiegend Frauen kennenlernen (der Spieler ist ein Mann)
    while (intr.length < 2) { var i = pick(INTR); if (intr.indexOf(i) < 0) intr.push(i); }
    var x = { id: 'c' + (lf.uid++), name: L.name(g), g: g, job: pick(JOBS), intr: intr, goal: pick(GOALS), sport: R.randInt(20, 90), move: R.randInt(15, 85), kids: R.randInt(10, 95), time: R.randInt(30, 85), v: 50, stage: 0, dates: 0, t: tick(st) };
    lf.cands.push(x);
    // höchstens 5 Bekanntschaften: zuerst fallen flüchtige Begegnungen (noch kein Kontakt) raus, dann lose Kontakte –
    // wen du schon datest („Erste Dates“) oder heimlich triffst, bleibt immer
    while (lf.cands.length > 5) {
      var loose = lf.cands.filter(function (y) { return !y.stage && !y.aff && y !== x; });
      var drop = loose[0] || lf.cands.filter(function (y) { return y.stage === 1 && !y.aff && y !== x; }).sort(function (a, b) { return a.v - b.v; })[0];
      if (!drop) break; lf.cands.splice(lf.cands.indexOf(drop), 1);
    }
    return x;
  };
  L.makePartner = function (st, x) {
    var lf = L.life(st); lf.cands = lf.cands.filter(function (y) { return y.id !== x.id; });
    x.stage = 3; x.since = tick(st); x.stageT = tick(st); x.crisis = 0; x.v = Math.max(60, x.v); lf.partner = x;
    X.chron(st, 'familie', '💞', 'Neue Beziehung', 'Du bist jetzt mit ' + x.name + ' zusammen (' + x.job + ').', 2, 'date');
    return x;
  };
  L.breakup = function (st, why) {
    var lf = L.life(st), p = lf.partner; if (!p) return;
    lf.exes.unshift({ name: p.name, stage: p.stage, s: st.season, why: why }); if (lf.exes.length > 6) lf.exes.length = 6;
    lf.partner = null; lf.planKids = false; lf.preg = null;
    X.chron(st, 'familie', '💔', p.stage >= 6 ? 'Scheidung' : 'Trennung', p.name + ' – ' + why + '.', 3);
    X.eff(st, { stress: 6, family: -2 });
    if (p.stage >= 6 && R.pf) R.pf.book(st, -Math.round(30000 * K), 'Familie');
  };
  L.bonusF = function (st) { var lf = L.life(st), ct = lf && lf.contract, p = C.player(st); if (!ct || !p || ct.club !== p.clubId) return 1; return 1 + (ct.bonus || 0) * 0.25; };

  // ---------- Wöchentliche Simulation ----------
  L.weekly = function (st) {
    var pc = st.pc; if (!pc || pc.retired) return;
    var cx = L.ensure(st), lf = cx.life, p = C.player(st); if (!p) return;
    var t = tick(st), a = cx.plan.a || {}, c = L.ctx(st);
    L.refreshAp(st);
    // Offene Gespräche nicht ewig liegen lassen: nach 3 Wochen selbstständig (vorsichtigste Antwort) abschließen
    var dl = L.active(st); if (dl && (dl.done || t - dl.t0 >= 3)) { if (!dl.done) L.autoRun(st, safePolicy); else L.close(st); }
    // Trainingsakkumulator (Vereinsgelände, Feedback): kleine, gedeckelte Wirkung
    Object.keys(lf.train).forEach(function (k) { var v = Math.min(0.12, lf.train[k]); if (p.attr[k] != null && v > 0) { p.attr[k] = clamp(p.attr[k] + v, 10, 99); lf.train[k] -= v; } if (lf.train[k] <= 0.001) delete lf.train[k]; });
    W.recalc(p);
    // Medizin: Diagnostik und Abteilung beschleunigen Heilung mit Wahrscheinlichkeit (keine Garantie)
    var ml = c.c && c.c.fac ? (c.c.fac.medizin || 1) : 1;
    if (p.inj && p.inj.weeks > 1 && chance(0.04 * Math.max(0, ml - 2) + (lf.med.dx > t ? 0.08 : 0))) p.inj.weeks--;
    if (!p.inj && lf.relapse > t && chance(0.05)) { p.inj = { type: 'Rückfall nach zu früher Rückkehr', weeks: R.randInt(2, 4), total: 3 }; lf.relapse = 0; X.chron(st, 'verletzung', '🩹', 'Rückfall', 'Die zu frühe Rückkehr rächt sich.', 2, 'medizin'); }
    // ---- Partnerschaft ----
    var pt = lf.partner;
    if (pt) {
      var care = (a.partner || 0) * 1.6 + (a.private || 0) * 0.6, need = (pt.time - 40) / 60;
      pt.v = clamp(pt.v - 0.5 - need * 0.6 + care - Math.max(0, cx.per.stress - 65) / 40, 0, 100);
      if (pc.moving && !lf.moveAsked && !L.pt) { lf.moveAsked = true; if (!L.active(st)) L.start(st, 'partner_talk', { topic: 'abroad' }); }
      if (!L.pt && pt.v < 38 && !pt.crisis && chance(0.12)) { pt.crisis = 1; X.chron(st, 'familie', '⛈️', 'Beziehungskrise', fn(pt) + ' fühlt sich vernachlässigt.', 2); if (!L.active(st)) L.start(st, 'partner_talk', { topic: 'crisis' }); }
      if (pt.v < 14 && chance(0.25)) L.breakup(st, fn(pt) + ' hat die Beziehung beendet');
      else if (pt.stage < 3 && t - (pt.stageT || 0) > 20) pt.stage = 3;
    } else if (p.age >= 17) {
      lf.cands = lf.cands.filter(function (x) { x.v -= x.stage ? 0.4 : 1; return x.v > 30 && t - x.t < 30; });
      var pr = 0.012 + (a.private || 0) * 0.008 + (a.partner || 0) * 0.02 + (cx.per.conf - 50) / 4000;
      if (lf.cands.length < 2 && chance(pr) && !L.active(st)) { var x = L.newCand(st); L.start(st, 'meet', { cid: x.id, where: pick(WHERE) }); }
    }
    // ---- Familienplanung, Schwangerschaft, Kinder ----
    if (pt && lf.planKids && !lf.preg && pt.stage >= 4 && (lf.kidTry = (lf.kidTry || 0) + 1) && chance(Math.min(0.2, 0.035 + 0.003 * lf.kidTry))) { lf.kidTry = 0; lf.preg = { due: t + R.randInt(32, 38) }; X.chron(st, 'familie', '🤰', 'Ihr erwartet ein Kind', fn(pt) + ' ist schwanger.', 3); X.eff(st, { family: 4 }); }
    if (lf.preg && t >= lf.preg.due) {
      var g = R.rand() < 0.5 ? 'a' : 'b', kid = { id: 'k' + (lf.uid++), name: L.first(g) + ' ' + p.last, g: g, born: st.season, bornT: t };
      lf.kids.push(kid); lf.preg = null; lf.newborn = t;
      if (lf.kids.length >= (pt && pt.kids >= 75 ? 3 : 2)) lf.planKids = false;
      X.chron(st, 'familie', '👶', 'Geburt', kid.name + ' ist auf der Welt. Willkommen!', 3, 'familie');
      L.eff(st, { well: 12, stress: 4, family: 8, partner: 6 });
      if (S.news) S.news(st, 'Nachwuchs', W.playerName(p) + ' ist Vater/Mutter geworden.', 'karriere');
    }
    if (lf.newborn && t - lf.newborn < 8) { p.fitness = clamp(p.fitness - 0.8, 20, 100); cx.per.stress = clamp(cx.per.stress + 0.3, 0, 100); }
    // ---- Freunde ----
    var tm = X.person(st, 'friend');
    if (tm && !lf.friends.some(function (f) { return f.pid === tm.pid; })) { var tp = st.players[tm.pid]; if (tp) lf.friends.push({ id: 'fr' + (lf.uid++), pid: tm.pid, name: W.playerName(tp), kind: 'team', v: tm.v, since: st.season, last: t, note: 'Mitspieler und Freund.' }); }
    lf.friends.forEach(function (f) { f.v = clamp(f.v - 0.35 + (a.friends || 0) * 1.2 + (a.private || 0) * 0.25, 0, 100); });
    if (!L.active(st) && lf.friends.length) {
      var fr = pick(lf.friends), r = R.rand();
      if (r < 0.006 && fr.kind !== 'team') L.start(st, 'friend', { friend: fr.id, topic: 'money', amt: Math.round(R.randInt(2, 15) * 1000 * K / 500) * 500 });
      else if (r < 0.009 && R.pf && R.pf.liquid(st) > 30000 * K) L.start(st, 'friend', { friend: fr.id, topic: 'biz', amt: Math.round(R.randInt(10, 40) * 1000 * K / 1000) * 1000, biz: pick(['Café', 'Fitnessstudio', 'Modelabel', 'Foodtruck', 'Sportbar']) });
      else if (r < 0.02) L.start(st, 'friend', { friend: fr.id, topic: 'bday' });
    }
    if (chance(0.003) && lf.friends.length < 6 && !L.active(st)) { var nf = { id: 'fr' + (lf.uid++), name: L.name(), kind: 'jugend', v: 55, since: st.season, last: t, note: 'Alter Bekannter aus der Jugend, zufällig wiedergetroffen.' }; lf.friends.push(nf); L.start(st, 'friend', { friend: nf.id, topic: 'reunion' }); }
    // ---- Wohlbefinden & Zufriedenheit ----
    var fAvg = lf.friends.length ? R.avg(lf.friends, function (f) { return f.v; }) : 40, sec = R.pf ? R.pf.security(st).lvl : 3;
    var wt = 50 + (pt ? (pt.v - 50) * 0.3 : -3) + (fAvg - 50) * 0.15 + (cx.rel.family - 60) * 0.15 - Math.max(0, cx.per.stress - 40) * 0.35 + (3 - sec) * 2.5 + (p.inj ? -6 : 0) + lf.kids.length * 2;
    lf.well = clamp(lf.well + (wt - lf.well) * 0.08, 0, 100);
    var share = c.share != null ? c.share : 0.6, fair = W.fairWage(p) || 1;
    var stt = 45 + (share - 0.5) * 40 + (pc.trust - 50) * 0.25 + (Math.min(1.3, p.wage / fair) - 0.9) * 30 + (lf.well - 50) * 0.3;
    cx.per.sat = clamp(cx.per.sat + (stt - cx.per.sat) * 0.06, 0, 100);
    if (cx.per.stress > 60) cx.per.resil = clamp(cx.per.resil + 0.04, 0, 100);
    if (lf.well < 30 && p.morale > 40) p.morale = clamp(p.morale - 0.6, 0, 100);
    // ---- Fans & Journalisten driften ----
    var fs = lf.fans, form = c.form, ld = cx.per.loyal;
    Object.keys(fs).forEach(function (k) {
      var tg = 50 + (form - 6.3) * (k === 'krit' ? -10 : k === 'gel' ? 12 : 8) + (k === 'ultras' || k === 'aktiv' ? (ld - 55) * 0.25 : 0) + (k === 'fam' ? (cx.per.pop - 50) * 0.15 : 0);
      fs[k] = clamp(fs[k] + (tg - fs[k]) * 0.03, 0, 100);
    });
    cx.rel.fans = clamp(R.avg(['fam', 'gel', 'club', 'aktiv', 'ultras'], function (k) { return fs[k]; }) * 0.4 + cx.rel.fans * 0.6, 0, 100);
    lf.jrn.forEach(function (j) { j.v = clamp(j.v + (50 - j.v) * 0.01, 0, 100); });
    lf.protest = fs.krit > 62 && fs.ultras < 40;
    // ---- Gesprächsanlässe (Häufigkeit über Regisseur-Gewichte, Ergebnisse bleiben regelbasiert) ----
    if (!L.active(st) && c.pro && st.phase === 'season') {
      var lm = cx.lastMatch, dir = X.director ? 1 : 1;
      var fresh = lm && lm.season === st.season && st.week - lm.week <= 1 && lf.lmSeen !== lm.season * 100 + lm.week; if (fresh) lf.lmSeen = lm.season * 100 + lm.week;
      if (fresh && lm.rating != null && (lm.rating >= 8 || lm.rating <= 4.6) && chance(0.35 * dir)) L.start(st, 'press', { kind: 'interview' });
      else if (pc.fame >= 15 && chance(0.035)) L.start(st, 'press', {});
      else if (pc.fame >= 8 && chance(0.014)) L.start(st, 'fans', { grp: lf.protest || chance(0.35) ? 'ultras' : chance(0.4) ? 'fam' : 'club' });
      else if (pc.trust < 35 && chance(0.03)) L.start(st, 'coach', {});
    }
  };
  function safePolicy(op) { var s = op.filter(function (x) { return !x.o.hint; }); return (s[0] || op[0]).i; }
  L.safePolicy = safePolicy;

  // ---------- Saisonwechsel: Kinder altern, Lebensmeilensteine, Leihe ----------
  L.newSeason = function (st) {
    var lf = L.life(st); if (!lf) return;
    lf.kids.forEach(function (k) {
      var age = L.kidAge(st, k);
      if (age === 6) X.chron(st, 'familie', '🎒', 'Einschulung', k.name + ' kommt in die Schule.', 2, 'familie');
      if (age === 10 && chance(0.5)) X.chron(st, 'familie', '⚽', 'Im Verein angemeldet', k.name + ' will auch ' + (HB ? 'Handball' : 'Fußball') + ' spielen.', 2);
      if (age === 18) X.chron(st, 'familie', '🎓', 'Volljährig', k.name + ' wird 18.', 2);
    });
    lf.moveAsked = false; lf.leak = 0;
    var p = C.player(st), lp = st.pc.loanPending;
    if (lp && p && T && T.loanPlayer && st.clubs[lp.to] && p.clubId && p.clubId !== lp.to) { T.loanPlayer(st, p, st.clubs[lp.to], 0.5); X.chron(st, 'vertrag', '🔁', 'Leihe', 'Für eine Saison an ' + st.clubs[lp.to].name + ' verliehen.', 3); }
    st.pc.loanPending = null;
  };

  // ---------- Angebote: Leihe, Beratersuche ----------
  L.onOffers = function (st) {
    var pc = st.pc, p = C.player(st); if (!p || p.youth) return;
    var fl = pc.cx.mem.flags, own = st.clubs[p.clubId];
    if (fl.loanWish === st.season && own && !p.loan) {
      var lower = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && c.league >= own.league && c.id !== own.id && !pc.offers.some(function (o) { return o.clubId === c.id; }); }).sort(function (a, b) { return (a.league - b.league) || (b.reputation - a.reputation); });
      var tgt = lower[R.randInt(0, Math.min(4, lower.length - 1))];
      if (tgt) pc.offers.push({ id: 'l' + tick(st), clubId: tgt.id, loan: true, wage: p.wage, years: 1, fee: 0, role: 'Leihe (Stammspieler)' });
    }
    if (fl.scout === st.season && !pc.offers.some(function (o) { return !o.renew && !o.loan; })) {
      var c2 = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && c.id !== p.clubId && c.league <= (own ? own.league : 3); })[R.randInt(0, 10)];
      if (c2) pc.offers.push({ id: 's' + tick(st), clubId: c2.id, wage: Math.round(W.fairWage(p) * R.randRange(1, 1.15) / 1000) * 1000, years: R.randInt(2, 4), fee: p.contract > 1 ? Math.round(p.value / 50000) * 50000 : 0, role: 'über Berater-Sondierung' });
    }
    if (R.ag) pc.offers.forEach(function (o) { R.ag.enrich(st, o); });
  };
  var baseAccept = C.acceptOffer;
  C.acceptOffer = function (st, id) {
    var o = st.pc.offers.filter(function (x) { return x.id === id; })[0];
    if (o && o.loan) { var c = st.clubs[o.clubId]; st.pc.loanPending = { to: o.clubId, season: st.season }; st.pc.offers = []; if (S.news) S.news(st, 'Leihe vereinbart', 'Zur neuen Saison spielst du auf Leihbasis für ' + c.name + '.', 'karriere'); return { ok: true, msg: 'Leihe zu ' + c.short + ' zur neuen Saison vereinbart.' }; }
    return baseAccept(st, id);
  };

  // ---------- Trainerzusage beeinflusst die Aufstellung (zeitlich begrenzt) ----------
  var baseBias = C.lineupBias;
  C.lineupBias = function (st, p) { var b = baseBias(st, p), lf = st.pc && st.pc.cx && st.pc.cx.life; if (lf && lf.coachPromise > tick(st)) b = Math.min(1.36, b + 0.08); return b; };

  // ---------- Vereinsgelände: Aktivitäten in vorhandenen Einrichtungen ----------
  function lv(c, k) { return c && c.fac ? (c.fac[k] || 0) : 0; }
  function q(c, k) { var l = lv(c, k), f = D.facilities[k]; return f && f.levels[l] ? (f.levels[l].q || 0) : 0; }
  L.BLD = {
    training: { n: 'Trainingszentrum', ic: '🏋️', acts: [
      { k: 'tech', n: 'Techniktraining', d: 'Zusatzeinheit Technik', ap: 1, fx: function (st, c) { L.life(st).train.tec = (L.life(st).train.tec || 0) + 0.12 + q(c.c, 'training') * 0.04; return L.eff(st, { fit: -3, coach: 0.5 }); } },
      { k: 'ath', n: 'Athletiktraining', d: 'Kraft & Ausdauer', ap: 1, fx: function (st, c) { var k = c.p.attr.sta != null ? 'sta' : 'spd'; L.life(st).train[k] = (L.life(st).train[k] || 0) + 0.12 + q(c.c, 'training') * 0.04; return L.eff(st, { fit: -4, disc: 1 }); } },
      { k: 'video', n: 'Videoanalyse mit dem Trainer', d: 'Taktik & Fehleranalyse', ap: 1, fx: function (st, c) { return L.eff(st, { coach: 2 + q(c.c, 'training') * 0.4 }); } },
      { k: 'talk', n: 'Gespräch mit dem Trainer', d: 'Mehrstufiges Gespräch', ap: 0, dlg: 'coach' },
      { k: 'regen', n: 'Regenerationseinheit', d: 'Frische zurückholen', ap: 1, fx: function (st, c) { return L.eff(st, { fit: 5 + q(c.c, 'training'), stress: -2 }); } }] },
    jugend: { n: 'Nachwuchszentrum', ic: '🧢', acts: [
      { k: 'yc', n: 'Gespräch mit dem Jugendtrainer', d: 'Perspektive, Internat, Position', ap: 0, dlg: 'youthcoach', req: function (c) { return c.youth || c.age <= 19; } },
      { k: 'mentor', n: 'Nachwuchs trainieren (Mentor)', d: 'Führung und Ansehen stärken', ap: 1, req: function (c) { return c.pro && c.age >= 24; }, fx: function (st) { return L.eff(st, { lead: 2, f_fam: 2, board: 1 }); } },
      { k: 'school', n: 'Lernzeit im Internat', d: 'Schule nicht vernachlässigen', ap: 1, req: function (c) { return c.age < 19; }, fx: function (st) { st.pc.cx.edu = Math.min(100, (st.pc.cx.edu || 0) + 3); return L.eff(st, { family: 2, disc: 1 }); } }] },
    medizin: { n: 'Medizinische Abteilung', ic: '🩺', acts: [
      { k: 'doc', n: 'Gespräch mit dem Mannschaftsarzt', d: 'Diagnose, Reha, Zweitmeinung', ap: 0, dlg: 'doctor' },
      { k: 'physio', n: 'Physiotherapie', d: 'Heilung & Prävention', ap: 1, fx: function (st, c) { var p = c.p; if (p.inj && p.inj.weeks > 1 && chance(0.2 + q(c.c, 'medizin') * 0.08)) { p.inj.weeks--; return 'Die Reha schlägt an: eine Woche früher zurück möglich. ' + L.eff(st, { stress: -1 }); } return L.eff(st, { fit: 3 + q(c.c, 'medizin') }); } }] },
    stadion: { n: HB ? 'Halle' : 'Stadion', ic: '🏟️', acts: [
      { k: 'fans', n: 'Fantreffen nach dem Training', d: 'Fanclubs, Familienfans', ap: 1, dlg: 'fans', data: { grp: 'club' } },
      { k: 'ultras', n: HB ? 'Treffen mit dem Fanblock' : 'Treffen mit den Ultras', d: HB ? 'Trommeln, Choreos, Stimmung in der Halle' : 'Kurve, Choreos, Pyrotechnik', ap: 1, dlg: 'fans', data: { grp: 'ultras' }, req: function (c) { return c.pro; } },
      { k: 'press', n: 'Pressekonferenz geben', d: 'Mehrstufig, mit Journalisten', ap: 0, dlg: 'press', req: function (c) { return c.pro && c.pc.fame >= 5; } },
      { k: 'sign', n: 'Autogrammstunde', d: 'Beliebtheit & Familienfans', ap: 1, fx: function (st) { C.addFame(st, 0.5); return L.eff(st, { pop: 2, f_fam: 3, f_gel: 2 }); } }] },
    geschaeft: { n: 'Geschäftsstelle', ic: '🏛️', acts: [
      { k: 'board', n: 'Termin bei der Vereinsführung', d: 'Zukunft, Vertrag, Infrastruktur', ap: 0, dlg: 'board' }] }
  };
  // ---------- Spenden an die Fanszene: Choreo oder Auswärtsfahrt (stärkt die Stimmung der Fans) ----------
  L.DON = {
    choreo: { n: HB ? 'Choreo im Fanblock mitfinanzieren' : 'Choreo in der Kurve mitfinanzieren', ic: '🎨', cost: HB ? 1000 : 2500, cd: 8, d: 'Fahnen, Folien, Spruchbänder – die aktive Szene merkt sich das.', e: { f_ultras: 8, f_aktiv: 6, f_club: 3, fans: 3, pop: 1 }, txt: 'Am Spieltag zeigt die Kurve eine riesige Choreo – und auf einem Spruchband steht dein Name. Gänsehaut.' },
    away: { n: 'Auswärtsfahrt der Fans bezuschussen', ic: '🚌', cost: HB ? 1500 : 4000, cd: 8, d: 'Ein Bus für die nächste Auswärtsfahrt. Die Auswärtsfahrer vergessen das nicht.', e: { f_away: 10, f_aktiv: 4, f_club: 3, fans: 3, pop: 1 }, txt: 'Zwei volle Busse fahren mit – im Gästeblock wird dein Name gesungen.' }
  };
  L.donBlock = function (st, k) {
    var a = L.DON[k], lf = L.life(st), t = st.tick || 0, last = (lf.don || {})[k]; if (!a) return 'unbekannt';
    if (!st.pc.cx || !C.player(st) || !C.player(st).clubId) return 'kein Verein';
    if (last != null && t - last < a.cd) return 'wieder in ' + (a.cd - (t - last)) + ' Wo.';
    var cash = R.pf && R.pf.liquid ? R.pf.liquid(st) : (st.pc.cash || 0); if (cash < a.cost) return 'zu wenig Geld';
    return '';
  };
  L.donate = function (st, k) {
    var a = L.DON[k], why = L.donBlock(st, k); if (why) return { ok: false, why: why };
    if (R.pf) R.pf.book(st, -a.cost, 'Spenden'); else st.pc.cash -= a.cost;
    var lf = L.life(st); lf.don = lf.don || {}; lf.don[k] = st.tick || 0;
    var fx = L.eff(st, a.e);
    X.chron(st, 'fans', a.ic, 'Spende an die Fans', a.n + ' (' + money(a.cost) + ').', 1);
    return { ok: true, txt: a.txt + ' ' + fx, cost: a.cost };
  };
  L.bldAct = function (st, b, k) {
    var B = L.BLD[b], a = B && B.acts.filter(function (x) { return x.k === k; })[0], c = L.ctx(st); if (!a) return { ok: false, why: 'Unbekannt.' };
    if (a.req && !a.req(c)) return { ok: false, why: 'Gerade nicht möglich.' };
    if (b !== 'geschaeft' && b !== 'stadion' && lv(c.c, b === 'training' ? 'training' : b) < 1) return { ok: false, why: 'Diese Einrichtung gibt es im Verein nicht.' };
    var cur = L.active(st);
    if (a.dlg && cur && !cur.done && cur.id === a.dlg && JSON.stringify(cur.data) === JSON.stringify(a.data || {})) return { ok: true, dlg: true }; // dasselbe Gespräch fortsetzen
    if (a.dlg && cur) L.ensure(st).dlg = null; // anderes offenes Gespräch ohne weitere Wirkung beenden
    if (a.ap) { var r = L.spend(st, a.ap); if (!r.ok) return r; }
    var lf = L.life(st); lf.visits[b] = (lf.visits[b] || 0) + 1;
    if (a.dlg) { L.start(st, a.dlg, R.clone(a.data || {})); return { ok: true, dlg: true }; }
    var txt = a.fx(st, c); X.chron(st, 'sport', B.ic, a.n, txt || '', 1);
    return { ok: true, txt: txt };
  };

  // ---------- Konflikte Privatleben ↔ Sport (Ereignispaket) ----------
  X.add('leben', [
    { id: 'l_kid_bday', cat: 'familie', ic: '🎂', cd: 40, when: function (c) { return c.life && c.life.kids.some(function (k) { return L.kidAge(c.st, k) >= 3; }) && c.season; }, ti: 'Kindergeburtstag am Spieltag', t: function (c) { var k = c.life.kids[0]; return fn(k) + ' feiert am Samstag Geburtstag – genau zur Anstoßzeit. Der Trainer erwartet dich im Kader.'; },
      o: [{ l: 'Spielen, abends nachfeiern', fx: function (st) { return L.eff(st, { coach: 1, family: -3, partner: -2 }); } }, { l: (HB ? 'Morgens feiern, dann direkt in die Halle' : 'Morgens feiern, dann direkt ins Stadion'), fx: function (st) { return L.eff(st, { family: 2, fit: -3, stress: 2 }); } }, { l: 'Um Freigabe bitten', fx: function (st, c) { return X.roll(st, 0.35, [(c.pc.trust - 50) / 200]) ? 'Der Trainer gibt dir frei. ' + L.eff(st, { family: 6, partner: 3, coach: -2 }) : 'Abgelehnt. ' + L.eff(st, { coach: -2, family: -2 }); } }] },
    { id: 'l_wedding_away', cat: 'freund', ic: '💒', cd: 70, when: function (c) { return c.life && c.life.friends.length && c.pro; }, ti: 'Hochzeit eines Freundes', t: function (c) { return fn(c.life.friends[0]) + ' heiratet – du sollst Trauzeuge sein. Am selben Tag ist Auswärtsspiel.'; },
      o: [{ l: 'Zum Spiel fahren', fx: function (st) { return L.eff(st, { friend: -12, coach: 1 }, { friend: L.life(st).friends[0].id }); } }, { l: 'Freistellung beantragen', fx: function (st, c) { return X.roll(st, 0.4, [(c.pc.trust - 50) / 200]) ? 'Freigestellt. Eine unvergessliche Rede! ' + L.eff(st, { friend: 12, well: 4 }, { friend: L.life(st).friends[0].id }) : 'Nicht genehmigt. ' + L.eff(st, { friend: -8, coach: -1 }, { friend: L.life(st).friends[0].id }); } }] },
    { id: 'l_partner_job', cat: 'familie', ic: '💼', cd: 80, when: function (c) { return !L.pt && c.life && c.life.partner && c.life.partner.stage >= 4; }, ti: 'Jobangebot für deine Partnerperson', t: function (c) { var p = c.life.partner; return fn(p) + ' bekommt ein tolles Jobangebot – aber 400 km entfernt.'; },
      o: [{ l: 'Unterstützen – Fernbeziehung auf Zeit', fx: function (st) { var p = L.life(st).partner; p.time = Math.min(95, p.time + 10); return L.eff(st, { partner: 6, stress: 3 }); } }, { l: 'Bitten, das Angebot abzulehnen', fx: function (st) { return L.eff(st, { partner: -10 }); } }, { l: 'Selbst über einen Wechsel in die Nähe nachdenken', fx: function (st) { X.setFlag(st, 'scout', st.season); return L.eff(st, { partner: 8, loyal: -3 }); } }] },
    { id: 'l_newborn_night', cat: 'familie', ic: '🍼', cd: 20, when: function (c) { return c.life && c.life.newborn && c.st.tick - c.life.newborn < 10; }, ti: 'Schlaflose Nächte', t: function () { return 'Das Baby schläft kaum. Morgen ist Abschlusstraining.'; },
      o: [{ l: 'Nachtschicht übernehmen', fx: function (st) { return L.eff(st, { partner: 5, fit: -5 }); } }, { l: 'Im Gästezimmer schlafen', fx: function (st) { return L.eff(st, { partner: -4, fit: 2 }); } }, { l: 'Babysitter organisieren (150 €)', fx: function (st) { if (R.pf) R.pf.book(st, -150, 'Familie'); return L.eff(st, { partner: 2, fit: 1 }); } }] },
    { id: 'l_tabloid', cat: 'medien', ic: '📸', cd: 60, when: function (c) { return c.life && c.life.partner && c.pc.fame >= 25; }, ti: 'Paparazzi', t: function (c) { return 'Der ' + (L.jrn(c.st, 'j_boul') || { outlet: 'Boulevard' }).outlet + ' druckt private Fotos von dir und ' + fn(c.life.partner) + '.'; },
      o: [{ l: 'Anwalt einschalten (2.000 €)', fx: function (st) { if (R.pf) R.pf.book(st, -2000, 'Sonstige Ausgaben'); return L.eff(st, { partner: 3, j_boul: -6, press: -1 }); } }, { l: 'Ignorieren', fx: function (st) { return L.eff(st, { partner: -3, stress: 2 }); } }, { l: 'Selbst ein offenes Interview geben', fx: function (st) { C.addFame(st, 1); return L.eff(st, { partner: -2, j_boul: 6, media: 2 }); } }] },
    { id: 'fr_money_back', cat: 'freund', ic: '💶', follow: true, ti: 'Das geliehene Geld', t: function (c, d) { var f = L.friend(c.st, d.friend); return d.ok ? fn(f) + ' zahlt dir die ' + money(d.amt) + ' zurück – mit einem Dankesbrief.' : fn(f) + ' meldet sich nicht mehr. Das Geld ist wohl weg.'; },
      o: [{ l: 'Okay', fx: function (st, c, d) { if (d.ok && R.pf) R.pf.book(st, d.amt, 'Privatdarlehen'); return L.eff(st, d.ok ? { friend: 6 } : { friend: -20, stress: 2 }, { friend: d.friend }); } }] },
    { id: 'fr_biz_result', cat: 'freund', ic: '📈', follow: true, ti: function (c, d) { return 'Das ' + d.biz; }, t: function (c, d) { return d.ok ? 'Das ' + d.biz + ' läuft! Deine Beteiligung wirft eine Ausschüttung ab.' : 'Das ' + d.biz + ' musste schließen. Dein Einsatz ist verloren.'; },
      o: [{ l: 'Verstanden', fx: function (st, c, d) { if (d.ok && R.pf) R.pf.book(st, Math.round(d.amt * R.randRange(1.2, 1.8)), 'Beteiligung'); return L.eff(st, d.ok ? { friend: 6, well: 3 } : { friend: -4, stress: 3 }, { friend: d.friend }); } }] }
  ]);

  if (R.cm) {
  // Regelbasierte Auflösung (Sofort-Modus): richtet sich nach Risikobereitschaft und Disziplin, kein Zufall beim Wählen
  R.cm.rulePolicy = function (st) {
    var per = st.pc.cx.per, risky = (per.risk != null ? per.risk : 50) >= 62, calm = per.disc >= 60;
    return function (inst) {
      var lab = inst.labels, sel = lab.filter(function (o) { var h = (o.hint || '') + ' ' + o.l; return risky ? /risk|Risiko|direkt|Abschluss|Wurf|schie/i.test(h) : calm ? !/risk|Risiko|provoz|Rudel|Schiri/i.test(h) : true; });
      var pickL = (sel.length ? sel : lab)[risky ? 0 : Math.floor(((sel.length ? sel : lab).length - 1) / 2)];
      return pickL.i;
    };
  };

  }
  // Offene Gespräche auch in Wochen ohne Karriere-Wochenlauf (Vorbereitung) nach spätestens 3 Wochen abschließen
  if (S && S.completeWeek && !S._lifeWrap) {
    var baseCW = S.completeWeek; S._lifeWrap = true;
    S.completeWeek = function (st, played) { var r = baseCW.apply(this, arguments); try { if (st && st.pc && st.pc.cx && st.pc.cx.life) { var dl = L.active(st); if (dl && (dl.done || (st.tick || 0) - dl.t0 >= 3)) { if (!dl.done) L.autoRun(st, safePolicy); else L.close(st); } } } catch (er) { if (typeof console !== 'undefined') console.error(er); } return r; };
  }
  // ---------- Hooks ----------
  // ---------- Vertrag beim eigenen Verein: Verlängerung, rechtzeitige Absage, vereinslos ----------
  // Läuft der Vertrag mit dieser Saison aus, entscheidet der Verein in der Hinrunde (oder sobald du um ein Gespräch bittest):
  // Verlängerungsangebot mit Verhandlung – oder eine klare Absage, damit genug Zeit für die Vereinssuche bleibt.
  // Vereinslos kommen laufend Angebote mit sofortigem Einstieg; spätestens nach 8 Wochen unterschreibst du beim besten.
  function rnd(v, s) { return Math.round(v / s) * s; }
  function sw() { return S.SEASON_WEEKS || 34; }
  L.cstat = function (st) { var lf = L.life(st); if (!lf.cs || lf.cs.season !== st.season) lf.cs = { season: st.season, dec: null, wk: null, asked: -99, warn: 0, own: null, ownGone: false }; return lf.cs; };
  function posAvg(st, c, p) { var sq = W.squad(st, c.id).filter(function (x) { return x.pos === p.pos && !x.youth && x.id !== p.id; }).sort(function (a, b) { return b.ovr - a.ovr; }), top = sq.slice(0, Math.max(1, Math.ceil(sq.length / 2))); return top.length ? R.avg(top, function (x) { return x.ovr; }) : 50; }
  L.renewScore = function (st) { // > 0: Verein will verlängern
    var p = C.player(st), pc = st.pc, c = p && p.clubId && st.clubs[p.clubId]; if (!c) return -99;
    var played = st.week > 3 ? Math.min(1, p.stats.apps / Math.max(1, st.week * 0.6)) : 0.5;
    var gw = p.age <= 21 ? 1.5 : p.age <= 24 ? 2.2 : 3, pw = p.age <= 23 ? 1 : p.age <= 26 ? 0.5 : 0; // Talente: Potenzial zählt mit, Rückstand weniger
    return (p.ovr - posAvg(st, c, p)) * gw + (pc.trust - 45) * 0.6 + (played - 0.4) * 14 - Math.max(0, p.age - 31) * 5 + Math.max(0, (p.pot || p.ovr) - p.ovr) * pw + 8;
  };
  function ownOffer(st) {
    var p = C.player(st), pc = st.pc, c = st.clubs[p.clubId], fair = W.fairWage(p) * (1 + pc.fame / 250) * (pc.agent ? 1.08 : 1);
    var o = { id: 'own' + tick(st), clubId: c.id, renew: true, wage: rnd(Math.max(p.wage * 1.03, fair * (0.9 + pc.trust / 500)), 1000), years: p.age >= 31 ? 1 : R.randInt(2, 4) };
    pc.offers = pc.offers.filter(function (x) { return !x.renew; }); pc.offers.push(o); if (R.ag) R.ag.enrich(st, o);
    return o;
  }
  L.marketOffers = function (st, n, role) { // hängt Angebote anderer Vereine an (ohne bestehende zu löschen)
    var pc = st.pc, p = C.player(st); if (!p || n <= 0) return 0;
    var free = !p.clubId, want = p.ovr + (pc.agent ? 2 : 0) + pc.fame / 25, fair = W.fairWage(p) * (1 + pc.fame / 250) * (pc.agent ? 1.12 : 1);
    var all = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.foreign && c.league && c.id !== p.clubId && !pc.offers.some(function (o) { return o.clubId === c.id; }); })
      .map(function (c) { return { c: c, gap: want - posAvg(st, c, p) }; });
    var cands = all.filter(function (x) { return x.gap > (free ? -9 : -6); }).sort(function (a, b) { return (a.c.league - b.c.league) || (b.gap - a.gap); });
    if (!cands.length) cands = all.sort(function (a, b) { return (b.c.league - a.c.league) || (b.gap - a.gap); }); // notfalls tiefere Ligen
    var k = 0;
    cands.slice(0, 12).sort(function () { return R.rand() - 0.5; }).slice(0, n).forEach(function (x) {
      var o = { id: 'm' + tick(st) + '_' + (k++), clubId: x.c.id, wage: rnd(fair * (free ? R.randRange(0.8, 1.0) : R.randRange(1.0, 1.15)), 1000), years: free ? R.randInt(1, 3) : R.randInt(2, 4), fee: !free && p.contract > 1 ? rnd(p.value, 50000) : 0, role: role || (x.gap > 3 ? 'Stammspieler' : x.gap > -1 ? 'Rotation' : 'Herausforderer'), now: free };
      pc.offers.push(o); if (R.ag) R.ag.enrich(st, o);
    });
    return k;
  };
  L.decideRenewal = function (st, asked) {
    var cs = L.cstat(st), p = C.player(st), pc = st.pc, c = p && p.clubId && st.clubs[p.clubId];
    if (!c || p.youth || p.loan || pc.moving || cs.dec) return cs.dec;
    cs.dec = L.renewScore(st) > 0 ? 'renew' : 'no'; cs.wk = st.week;
    if (cs.dec === 'renew') {
      var o = cs.own = ownOffer(st);
      X.chron(st, 'vertrag', '✍️', 'Verein will verlängern', c.short + ' bietet dir eine Vertragsverlängerung an: ' + money(o.wage) + '/Jahr, ' + o.years + (o.years === 1 ? ' Jahr' : ' Jahre') + '.', 2);
      if (S.news) S.news(st, 'Verlängerungsangebot', c.name + ' möchte mit dir verlängern – verhandeln unter „Berater & Verträge“.', 'karriere');
      if (!asked && !L.active(st)) L.start(st, 'negotiate', { oid: o.id });
    } else {
      pc.offers = pc.offers.filter(function (x) { return !x.renew; });
      X.chron(st, 'vertrag', '📭', 'Keine Vertragsverlängerung', c.name + ' verlängert deinen auslaufenden Vertrag nicht. Du hast bis zum Sommer Zeit, einen neuen Verein zu finden.', 3);
      if (S.news) S.news(st, 'Kein neuer Vertrag', c.name + ' plant nicht mehr mit dir – der Vertrag endet im Sommer.', 'karriere');
      pc.offerSeason = st.season; // Markt öffnet sofort, ohne die vorhandenen Angebote zu verwerfen
      L.marketOffers(st, 1 + (pc.agent ? 2 : 1) + (pc.fame > 40 ? 1 : 0));
      if (pc.agent) X.setFlag(st, 'scout', st.season);
      if (!asked) X.fire(st, 'c_norenew', { club: c.id });
    }
    return cs.dec;
  };
  L.askRenewal = function (st) { // du bittest selbst um ein Vertragsgespräch
    var p = C.player(st), pc = st.pc, c = C.club(st), cs = L.cstat(st);
    if (!c || !p || p.youth) return { ok: false, msg: 'Gerade nicht möglich.' };
    var own = pc.offers.filter(function (o) { return o.renew; })[0]; if (own) return { ok: true, oid: own.id };
    if (pc.moving) return { ok: false, msg: 'Dein Wechsel ist bereits vereinbart.' };
    if (cs.dec === 'no') return { ok: false, msg: 'Die Entscheidung steht: ' + c.short + ' verlängert nicht. Konzentriere dich auf die Angebote anderer Vereine.' };
    if (p.contract > 2) return { ok: false, msg: 'Die Sportdirektion winkt ab: „Dein Vertrag läuft noch ' + p.contract + ' Saisons. Darüber reden wir später.“' };
    if (st.week - cs.asked < 6 && cs.asked >= 0) return { ok: false, msg: 'Du hast erst vor Kurzem gefragt. Die Sportdirektion meldet sich.' };
    cs.asked = st.week;
    if (p.contract <= 1) { var d = L.decideRenewal(st, true); return d === 'renew' ? { ok: true, oid: cs.own.id, fresh: true } : { ok: false, no: true, msg: '„Wir müssen ehrlich sein: Wir planen ohne dich. Dein Vertrag wird nicht verlängert.“ Du hast bis zum Sommer Zeit – ' + (pc.agent ? 'dein Berater sucht bereits.' : 'ein Spielerberater kann bei der Suche helfen.') + ' Erste Angebote liegen schon vor.' }; }
    if (L.renewScore(st) > 6) { cs.dec = 'renew'; var o = cs.own = ownOffer(st); return { ok: true, oid: o.id, fresh: true }; }
    return { ok: false, msg: '„Wir sind zufrieden, aber für eine vorzeitige Verlängerung ist es noch zu früh. Zeig dich weiter, dann reden wir.“' };
  };
  L.onContract = function (st) { // wöchentlich
    var pc = st.pc, p = C.player(st); if (!p || pc.retired) return;
    var lf = L.life(st);
    if (!p.clubId) { // vereinslos: kein Leerlauf
      lf.free = (lf.free || 0) + 1;
      var now = pc.offers.filter(function (o) { return o.now; }).length;
      if (now < 2 && (lf.free % 2 === 1 || !now)) { var n = L.marketOffers(st, 2 - now + (pc.agent ? 1 : 0), 'Vereinslos – sofortiger Einstieg'); if (n) X.chron(st, 'vertrag', '📨', 'Neue Angebote', n + ' Verein(e) bieten dir einen Vertrag mit sofortigem Einstieg an.', 1); }
      if (lf.free >= 8 && pc.offers.some(function (o) { return o.now; })) { var best = pc.offers.filter(function (o) { return o.now; }).sort(function (a, b) { return st.clubs[a.clubId].league - st.clubs[b.clubId].league || b.wage - a.wage; })[0]; C.acceptOffer(st, best.id); }
      return;
    }
    lf.free = 0;
    if (p.youth || p.loan || st.phase !== 'season') return;
    var cs = L.cstat(st);
    if (p.contract <= 1 && !cs.dec && !pc.moving && st.week >= 8) L.decideRenewal(st, false);
    if (p.contract <= 1 && !pc.moving && st.week >= sw() - 6 && !cs.warn) { // letzte Erinnerung
      cs.warn = 1;
      var renewOpen = pc.offers.some(function (o) { return o.renew; }), other = pc.offers.filter(function (o) { return !o.renew && !o.loan; }).length;
      if (other < 2) L.marketOffers(st, 2 - other);
      X.chron(st, 'vertrag', '⏳', 'Vertrag läuft aus', 'Noch ' + Math.max(1, sw() - st.week) + ' Wochen bis Saisonende. ' + (renewOpen ? 'Die Verlängerung liegt noch auf dem Tisch.' : 'Ohne Unterschrift bist du im Sommer vereinslos.'), 2);
      if (S.news) S.news(st, 'Vertrag läuft aus', 'Ohne Einigung endet dein Vertrag im Sommer. Angebote unter „Berater & Verträge“.', 'karriere');
    }
  };
  L.contractOffers = function (st) { // nach C.makeOffers: Entscheidung des Vereins respektieren
    var pc = st.pc, cs = L.cstat(st);
    if (pc.moving || pc.loanPending) { pc.offers = pc.offers.filter(function (o) { return !o.renew; }); return; } // Wechsel vereinbart: kein Verlängerungsangebot mehr
    if (cs.dec === 'no' || (cs.dec === 'renew' && cs.ownGone)) pc.offers = pc.offers.filter(function (o) { return !o.renew; });
    else if (cs.dec === 'renew' && cs.own) { pc.offers = pc.offers.filter(function (o) { return !o.renew; }); pc.offers.unshift(cs.own); }
  };
  var baseDecline = C.declineOffer;
  C.declineOffer = function (st, id) { var o = st.pc.offers.filter(function (x) { return x.id === id; })[0]; if (o && o.renew) L.cstat(st).ownGone = true; return baseDecline(st, id); };
  var baseAccept2 = C.acceptOffer;
  C.acceptOffer = function (st, id) {
    var pc = st.pc, p = C.player(st), o = pc.offers.filter(function (x) { return x.id === id; })[0];
    if (o && o.renew && pc.moving) { pc.offers = pc.offers.filter(function (x) { return !x.renew; }); return { ok: false, why: 'Dein Wechsel ist bereits vereinbart – das Verlängerungsangebot ist hinfällig.' }; }
    if (o && o.now && p && !p.clubId) { // vereinslos: sofort unterschreiben
      var c = st.clubs[o.clubId]; T.executeTransfer(st, p, c, 0, o.wage, o.years); C.checkClub(st, p); pc.offers = []; L.life(st).free = 0;
      X.chron(st, 'vertrag', '🖊️', 'Neuer Verein: ' + c.short, 'Du unterschreibst bis ' + (st.season + o.years) + ' und bist ab sofort dabei.', 3);
      if (S.news) S.news(st, 'Neuer Verein: ' + c.name, W.playerName(p) + ' unterschreibt bis ' + (st.season + o.years) + '.', 'karriere');
      return { ok: true, msg: 'Unterschrieben bei ' + c.short + ' – ab sofort dabei.' };
    }
    var r = baseAccept2(st, id);
    if (r && r.ok && o) { var cs2 = L.cstat(st); cs2.ownGone = true; if (!o.renew) cs2.own = null; } // nach einem Wechsel ist das alte Verlängerungsangebot vom Tisch
    return r;
  };
  L.onClubless = function (st) { // Saisonstart ohne Verein
    var p = C.player(st), pc = st.pc; if (!p || p.clubId || pc.retired) return;
    var lf = L.life(st); lf.free = 0;
    var n = L.marketOffers(st, 3 + (pc.agent ? 1 : 0), 'Vereinslos – sofortiger Einstieg');
    X.chron(st, 'vertrag', '🧳', 'Vereinslos', 'Dein Vertrag ist ausgelaufen. ' + (n ? n + ' Verein(e) bieten dir sofort einen Vertrag an.' : 'Die Suche läuft.'), 3);
  };
  X.add('vertrag', [
    { id: 'c_norenew', cat: 'vertrag', ic: '📭', cd: 1, when: function () { return false; }, ti: 'Gespräch mit der Sportdirektion',
      t: function (c, d) { var cl = c.st.clubs[d.club]; return '„Wir wollen offen zu dir sein: ' + (cl ? cl.short : 'Der Verein') + ' wird deinen Vertrag nach dieser Saison nicht verlängern.“ Bis zum Sommer bleibt dir Zeit, einen neuen Verein zu finden – erste Angebote liegen schon vor.'; },
      o: [{ l: 'Verstanden – ich schaue mich um', fx: function (st) { return L.eff(st, { stress: 2 }); } },
        { l: 'Berater mit der Suche beauftragen', req: function (c) { return !!c.st.pc.agent; }, fx: function (st) { L.marketOffers(st, 1, 'über Berater'); return 'Dein Berater legt los – ein weiteres Angebot ist schon da.'; } },
        { l: 'Um eine zweite Chance kämpfen', hint: 'Entscheidung kann sich ändern', fx: function (st) { var cs = L.cstat(st); if (chance(0.3)) { cs.dec = null; st.pc.trust = clamp(st.pc.trust + 6, 0, 100); return 'Die Sportdirektion will deine nächsten Wochen abwarten.'; } return 'Die Entscheidung bleibt. ' + L.eff(st, { stress: 3 }); } }] }
  ]);
  C.on.weekly.push(L.onContract);
  C.on.offers.push(L.contractOffers);
  C.on.newSeason.push(L.onClubless);

  C.on.weekly.push(L.weekly);
  C.on.newSeason.push(L.newSeason);
  C.on.offers.push(L.onOffers);
  C.on.start.push(function (st) { L.ensure(st); });
  C.on.retire.push(function (st) { var cx = L.ensure(st); if (cx) cx.phase = 9; });
})(RFM);
