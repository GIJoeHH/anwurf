// Privatleben 2.0 (ANPFIFF & ANWURF): lebendige Partnerschaft auf Basis des zentralen Dialogsystems (R.life).
// Eigene Persönlichkeit, Beruf & Einkommen, Beziehungsgeschichte (Erinnerungen), offene Geschichten (Threads),
// zehn Beziehungsphasen, Gesprächsbibliothek mit Anti-Wiederholungs-Filter, Sport als Gesprächsanlass,
// eigene Lebensereignisse der Partnerperson, abwechslungsreiche Aktivitäten, nachvollziehbare Konflikte.
// Inhalte: js/career_partner_lib.js (Bausteine mit Metadaten). Keine zweite Dialog-Engine – jedes Thema wird
// als gewöhnlicher Dialog (L.addDlg, Präfix „pt_“) registriert. Der Sport bleibt im Mittelpunkt (Takt & Phasen).
(function (R) {
  var L = R.life, X = R.cx, C = R.pc, W = R.world, S = R.season;
  if (!L || !X) return;
  var HB = X.HB, clamp = X.clamp, money = L.money, K = HB ? 0.45 : 1;
  function tick(st) { return st.tick || 0; }
  function chance(p) { return R.rand() < p; }
  function pick(a) { return a[Math.floor(R.rand() * a.length)]; }
  function fn(x) { return x ? x.name.split(' ')[0] : ''; }
  var P = L.pt = {};

  // ---------- Persönlichkeit (verdeckt; wirkt über Verhalten und Dialoge) ----------
  P.PERS = { ruhig: 'ruhig und ausgeglichen', temp: 'temperamentvoll', humor: 'humorvoll', ehrgeiz: 'ehrgeizig', still: 'zurückhaltend', herz: 'herzlich und offen' };
  P.CONFL = { offen: 'spricht Probleme offen an', harmonie: 'sucht Harmonie und schluckt manches herunter', direkt: 'wird bei Ärger schnell deutlich', rueck: 'zieht sich bei Streit erst einmal zurück' };
  // Beruf → Jahreseinkommen (brutto, grob), Arbeitsort-Typ, selbstständig?
  P.JOBS = { 'Lehrerin/Lehrer': [52000, 'Schule'], 'Ärztin/Arzt': [82000, 'Klinik'], 'Architektur': [58000, 'Büro'], 'Architektin/Architekt': [58000, 'Büro'], 'Pflege': [42000, 'Klinik'], 'Pflegekraft': [42000, 'Klinik'],
    'Softwareentwicklung': [68000, 'Firma'], 'Journalismus': [46000, 'Redaktion'], 'Studium': [9000, 'Uni', 0, 1], 'Eigenes Café': [38000, 'Café', 1], 'Physiotherapie': [38000, 'Praxis'], 'Unternehmensberatung': [78000, 'Firma'],
    'Polizei': [47000, 'Dienststelle'], 'Mode & Design': [44000, 'Studio', 1] };
  function jobInfo(x) { return P.JOBS[x.job] || [45000, 'Arbeit']; }
  var SKIN = ['#f5d0b5', '#e8b996', '#d29a6f', '#a86b45', '#7a4a2c', '#f0c8a8'], HAIR = ['#2b1d14', '#5a3a22', '#8a5a2b', '#c99a5b', '#e3c27a', '#111111', '#7b2f1d', '#9b9b9b'];
  P.ensure = function (st, x) { // ergänzt eine Person (Kandidat oder Partner) um alle Privatleben-2.0-Werte; alte Spielstände bleiben gültig
    if (!x || x.pv2) return x;
    var ji = jobInfo(x);
    x.pers = x.pers || pick(Object.keys(P.PERS)); x.confl = x.confl || pick(Object.keys(P.CONFL));
    x.pub = x.pub != null ? x.pub : R.randInt(15, 90); x.indep = x.indep != null ? x.indep : R.randInt(25, 90);
    x.sport = x.sport != null ? x.sport : R.randInt(20, 90); x.move = x.move != null ? x.move : R.randInt(15, 85); x.time = x.time != null ? x.time : R.randInt(30, 85); x.kids = x.kids != null ? x.kids : R.randInt(10, 95);
    x.inc = x.inc || Math.round(ji[0] * (0.85 + R.rand() * 0.35) / 1000) * 1000; x.self = !!ji[2]; x.stud = !!ji[3]; x.jobLv = x.jobLv || 1; x.place = ji[1];
    var c = C.club(st); x.city = x.city || (c ? c.city : '');
    x.look = x.look || { s: pick(SKIN), h: pick(HAIR), st: R.randInt(0, 4), g: !!(R.rand() < 0.25), e: R.randInt(0, 2) };
    x.hist = x.hist || []; x.used = x.used || {}; x.th = x.th || {}; x.neg = x.neg || 0; x.acts = x.acts || []; x.lastT = x.lastT || 0;
    if (!x.hist.length && x.stage >= 3) { // Migration: Geschichte aus dem bisherigen Stand ableiten
      x.hist.push({ k: 'meet', txt: 'Kennengelernt', ref: 'unser erstes Treffen', s: st.season, t: x.since || 0 });
      if (x.stage >= 4) x.hist.unshift({ k: 'movein', txt: 'Zusammengezogen', ref: 'unser Umzug in die gemeinsame Wohnung', s: st.season, t: x.stageT || 0 });
      if (x.stage >= 5) x.hist.unshift({ k: 'engaged', txt: 'Verlobung', ref: 'der Antrag', s: st.season, t: x.stageT || 0 });
      if (x.stage >= 6) x.hist.unshift({ k: 'wedding', txt: 'Hochzeit', ref: 'unsere Hochzeit', s: st.season, t: x.stageT || 0 });
    }
    x.sinceS = x.sinceS || st.season;
    x.pv2 = 1; return x;
  };
  P.partner = function (st) { var lf = L.life(st), p = lf && lf.partner; return p ? P.ensure(st, p) : null; };
  // Kandidaten und neue Partnerschaften sofort vollständig anlegen
  var baseCand = L.newCand; L.newCand = function (st) { return P.ensure(st, baseCand(st)); };
  var baseMake = L.makePartner;
  L.makePartner = function (st, x) { P.ensure(st, x); var r = baseMake(st, x); x.sinceS = st.season; x.hist = x.hist || []; P.mem(st, 'together', 'Ein Paar geworden', 'der Abend, an dem wir zusammengekommen sind'); return r; };
  var baseBreak = L.breakup;
  L.breakup = function (st, why) { var lf = L.life(st), p = lf.partner; if (p && lf.exes) { baseBreak(st, why); if (lf.exes[0]) lf.exes[0].hist = (p.hist || []).slice(0, 6); return; } baseBreak(st, why); };

  // ---------- Beziehungsgeschichte und offene Geschichten ----------
  P.mem = function (st, k, txt, ref, img) { var p = P.partner(st); if (!p) return; p.hist.unshift({ k: k, txt: txt, ref: ref || txt, s: st.season, w: st.week, t: tick(st), img: img || '' }); if (p.hist.length > 40) p.hist.length = 40; };
  P.has = function (p, k) { return !!(p && p.hist && p.hist.some(function (h) { return h.k === k; })); };
  P.memRef = function (p, minAge, t) { // eine ältere, bedeutsame Erinnerung für „Weißt du noch …“
    var list = (p.hist || []).filter(function (h) { return t - h.t >= (minAge || 8) && h.ref && ['meet', 'together'].indexOf(h.k) < 0; });
    return list.length ? list[Math.floor(R.rand() * Math.min(5, list.length))] : null;
  };
  P.open = function (st, k, d) { var p = P.partner(st); if (!p) return; p.th[k] = { t: tick(st), d: d || {}, done: false }; };
  P.isOpen = function (p, k, maxAge, t) { var x = p && p.th && p.th[k]; return !!(x && !x.done && (!maxAge || t - x.t <= maxAge)); };
  P.close = function (st, k, res) { var p = P.partner(st); if (p && p.th[k]) { p.th[k].done = true; p.th[k].res = res || ''; p.th[k].tc = tick(st); } };
  P.closed = function (p, k) { var x = p && p.th && p.th[k]; return !!(x && x.done); };

  // ---------- Zehn Beziehungsphasen (abgeleitet, keine Automatik) ----------
  P.PHASES = ['', 'Kennenlernen', 'Gegenseitiges Interesse', 'Erste Treffen', 'Feste Partnerschaft', 'Vertiefung', 'Gemeinsame Zukunftsplanung', 'Zusammengezogen', 'Verlobung & Hochzeit', 'Familie', 'Langjährige Partnerschaft'];
  P.phase = function (st, p) {
    p = p || P.partner(st); if (!p) return 0;
    if (p.stage <= 2) return p.stage + 1;
    var lf = L.life(st), yrs = st.season - (p.sinceS || st.season);
    if (yrs >= 5 && p.stage >= 4) return 10;
    if (lf.kids.length || lf.preg) return 9;
    if (p.stage >= 5) return 8;
    if (p.stage === 4) return 7;
    if (P.has(p, 'future')) return 6;
    if (tick(st) - (p.since || 0) >= 24 && p.v >= 58) return 5;
    return 4;
  };

  // ---------- Kontext für Dialoge ----------
  P.sport = function (st) { // letztes Spiel des eigenen Vereins (interaktiv oder simuliert)
    var cx = X.ensure(st), lm = cx.lastMatch, p = C.player(st), lf = L.life(st), o = { fresh: false };
    if (lm && lm.season === st.season && st.week - lm.week <= 1) {
      var me = lm.score[lm.side], op = lm.score[1 - lm.side];
      o = { fresh: true, win: me > op, loss: me < op, draw: me === op, goals: lm.goals || 0, rating: lm.rating, opp: lm.side === 0 ? lm.away : lm.home, res: me + ':' + op, key: lm.season * 100 + lm.week };
    } else if (p && p.clubId && st.lastResults && st.phase === 'season') {
      var r = st.lastResults.filter(function (x) { return x.h === p.clubId || x.a === p.clubId; })[0];
      if (r) { var home = r.h === p.clubId, m2 = home ? r.hg : r.ag, o2 = home ? r.ag : r.hg, oc = st.clubs[home ? r.a : r.h]; var g0 = lf.ptG == null ? p.stats.goals : lf.ptG;
        o = { fresh: true, win: m2 > o2, loss: m2 < o2, draw: m2 === o2, goals: Math.max(0, p.stats.goals - g0), rating: null, opp: oc ? oc.short : 'dem Gegner', res: m2 + ':' + o2, key: st.season * 100 + st.week }; }
    }
    return o;
  };
  P.ctx = function (st) {
    var c = L.ctx(st), p = P.partner(st), lf = c.life; c.pt = p; c.ptPh = p ? P.phase(st, p) : 0; c.t = tick(st); c.sp = P.sport(st);
    c.city = c.c ? c.c.city : ''; c.coachN = c.c && c.c.coach ? c.c.coach.name || 'der Trainer' : 'der Trainer';
    c.sw = HB ? 'Handball' : 'Fußball'; c.goalW = HB ? 'Tor' : 'Tor';
    c.wk = st.week; c.summer = st.phase !== 'season'; c.late = st.phase === 'season' && st.week >= (S.SEASON_WEEKS || 34) - 6;
    c.winter = st.phase === 'season' && st.week >= (S.WINTER_AFTER || 17) - 3 && st.week <= (S.WINTER_AFTER || 17) + 2;
    c.money = R.pf ? R.pf.liquid(st) : 0; c.lifeK = R.pf ? R.pf.ensure(st).life : 'komfortabel';
    c.load = c.cx.plan && c.cx.plan.a ? (c.cx.plan.a.train || 0) + (c.cx.plan.a.extra || 0) : 0;
    c.ld = !!(p && p.ld); c.moving = !!c.pc.moving; c.offers = (c.pc.offers || []).filter(function (o) { return !o.renew; });
    c.kid = lf.kids.length ? lf.kids[lf.kids.length - 1] : null; c.injW = c.p && c.p.inj ? c.p.inj.weeks : 0;
    c.noRenew = L.cstat ? L.cstat(st).dec === 'no' : false;
    return c;
  };
  // Persönlichkeitsvarianten: { fan, nofan, ruhig, temp, humor, ehrgeiz, still, herz, def } oder Funktion
  P.v = function (obj, c) {
    if (obj == null) return ''; if (typeof obj === 'function') return obj(c, c.pt) || ''; if (typeof obj === 'string') return obj;
    var p = c.pt || {};
    if (obj[p.pers] != null) return obj[p.pers];
    if (p.sport >= 62 && obj.fan != null) return obj.fan;
    if (p.sport < 40 && obj.nofan != null) return obj.nofan;
    if (obj['c_' + p.confl] != null) return obj['c_' + p.confl];
    return obj.def != null ? obj.def : '';
  };
  P.fill = function (txt, c) {
    var p = c.pt || {}, m = c.pt ? P.memRef(c.pt, 8, c.t) : null;
    return String(txt || '').replace(/\{(\w+)\}/g, function (a, k) {
      switch (k) {
        case 'n': return fn(p); case 'job': return p.job || ''; case 'hob': return (p.intr || ['Reisen'])[0]; case 'hob2': return (p.intr || ['Reisen', 'Musik'])[1] || (p.intr || ['Musik'])[0];
        case 'club': return c.c ? c.c.short : 'dem Verein'; case 'coach': return c.coachN; case 'opp': return c.sp.opp || 'dem Gegner'; case 'res': return c.sp.res || '';
        case 'city': return c.city || 'der Stadt'; case 'home': return p.city || 'hier'; case 'kid': return c.kid ? c.kid.name.split(' ')[0] : ''; case 'me': return c.first || '';
        case 'mem': return m ? m.ref : 'unser erstes Treffen'; case 'sw': return c.sw; case 'place': return p.place || 'Arbeit'; case 'goal': return p.goal || 'eigene Ziele';
        case 'yrs': return String(Math.max(1, c.st.season - (p.sinceS || c.st.season))); case 'ag': return c.ag ? c.ag.n.split(' ')[0] : 'dein Berater';
        case 'to': return c.pc.moving && c.st.clubs[c.pc.moving.to] ? c.st.clubs[c.pc.moving.to].short : (c.offers[0] && c.st.clubs[c.offers[0].clubId] ? c.st.clubs[c.offers[0].clubId].short : 'dem neuen Verein');
        case 'tocity': var to = c.pc.moving ? c.st.clubs[c.pc.moving.to] : c.offers[0] ? c.st.clubs[c.offers[0].clubId] : null; return to ? to.city : 'der neuen Stadt';
        default: return a;
      }
    });
  };

  // ---------- Bibliothek & Registrierung als Dialoge ----------
  P.LIB = []; P.BY = {};
  var LEN = { kurz: 2, pers: 5, gross: 8 }, CD = { kurz: 30, pers: 60, gross: 300 }, IMP = { kurz: 1, pers: 2, gross: 3 };
  P.CATN = { alltag: 'Alltag', sport: 'Sport', freizeit: 'Freizeit', beruf: 'Beruf & Ziele', transfer: 'Wechsel & Umzug', konflikt: 'Konflikt & Versöhnung', leben: 'Lebensereignis' };
  function opts(n) { return (n.o || []).map(function (o) { return Array.isArray(o) ? { l: o[0], r: o[1], e: o[2], n: o[3], fx: o[4], req: o[5], h: o[6] } : o; }); }
  P.add = function (list) {
    list.forEach(function (t) {
      t.len = t.len || 'kurz'; t.ph = t.ph || [4, 10]; P.LIB.push(t); P.BY[t.id] = t;
      var nodes = {};
      Object.keys(t.nodes).forEach(function (k) {
        var n = t.nodes[k];
        nodes[k] = {
          say: function (c0, d) { try { var c = P.ctx(c0.st); return P.fill(P.v(n.s, c), c); } catch (er) { return '…'; } },
          opts: function (c0, d) {
            var c = P.ctx(c0.st);
            return opts(n).filter(function (o) { try { return !o.req || o.req(c, c.pt, d); } catch (er) { return false; } }).map(function (o) {
              var lab; try { lab = P.fill(P.v(o.l, c), c); } catch (er) { lab = '…'; }
              return { l: lab, hint: o.h || '', fx: function (st, cc, dd, s) {
                var c2 = P.ctx(st), p = c2.pt; if (!p) return { r: '…', end: true };
                var ex = o.fx ? o.fx(st, c2, p, dd, s) : null, rep, nx = o.n; try { rep = typeof ex === 'string' ? ex : P.v(o.r, c2); } catch (er) { rep = '…'; }
                if (ex && typeof ex === 'object') { if (ex.r != null) rep = ex.r; if (ex.n !== undefined) nx = ex.n; }
                var res = { r: P.fill(rep, c2), e: o.e || {} };
                if (ex && ex.e) res.e = ex.e;
                if (nx && t.nodes[nx]) { res.next = nx; s.data.img = t.nodes[nx].img || s.data.img; } else { res.end = true; s.data.img = (ex && ex.img) || o.img || t.endImg || 'farewell'; }
                if (o.img) s.data.img = o.img;
                return res;
              } };
            });
          }
        };
      });
      L.addDlg([{
        id: 'pt_' + t.id, cat: 'familie', ic: t.ic || '💬', chron: t.len !== 'kurz', imp: IMP[t.len],
        title: function (c0) { var p = P.partner(c0.st); return (t.title ? P.fill(t.title, P.ctx(c0.st)) : P.CATN[t.cat]) + (p ? ' · ' + fn(p) : ''); },
        max: t.max || Math.min(LEN[t.len], Math.max(1, Object.keys(t.nodes).length + (t.len === 'kurz' ? 0 : 1))),
        scene: function (c0, d) { return 'pt_' + (d.img || t.nodes.start.img || 'relaxed'); },
        who: function (c0) { var p = P.partner(c0.st); return { n: p ? p.name : '?', role: p ? (p.job + ' · ' + P.PHASES[P.phase(c0.st, p)]) : '', ic: '💞', kind: 'partner', look: p ? p.look : null }; },
        init: function (st, c0, d, s) {
          var p = P.partner(st); if (!p || (t.th && !(p.th && p.th[t.th]))) { s.done = true; return; } // ohne Partnerperson bzw. ohne zugehörige Geschichte nicht startbar
          var lf = L.life(st); p.used[t.id] = tick(st); p.lastT = tick(st); lf.ptRecent = [t.id].concat((lf.ptRecent || []).filter(function (x) { return x !== t.id; })).slice(0, 12);
          lf.ptLog = lf.ptLog || []; lf.ptLog.push(t.id); if (lf.ptLog.length > 400) lf.ptLog.shift();
          d.img = t.nodes.start.img || 'relaxed';
          if (t.onStart) { try { t.onStart(st, P.ctx(st), p, d); } catch (er) { s.done = true; } }
        },
        nodes: nodes,
        sum: function (st, c0, d, s) { var c = P.ctx(st); return t.sum ? P.fill(P.v(t.sum, c), c) : (s.log.length ? s.log[s.log.length - 1].r : ''); }
      }]);
    });
  };

  // ---------- Anti-Wiederholungs-Filter & Auswahl ----------
  // 1. Karrierekontext  2. Beziehungszustand  3. offene Geschichten  4. kürzlich verwendet  5. unpassend/wiederholt raus
  // 6. Fortsetzungen bevorzugen  7. bester Kandidat (Relevanz + etwas Zufall). Kein Kandidat → null (kurze Zusammenfassung statt Wiederholung).
  P.cd = function (t) { return t.cd != null ? t.cd : CD[t.len]; };
  P.candidates = function (st, o) {
    o = o || {}; var c = P.ctx(st), p = c.pt; if (!p) return [];
    var lf = L.life(st), recent = (lf.ptRecent || []).slice(0, o.recentN != null ? o.recentN : 10);
    return P.LIB.filter(function (t) {
      if (o.ids && o.ids.indexOf(t.id) < 0) return false;
      if (o.cats && o.cats.indexOf(t.cat) < 0) return false;
      if (o.lens && o.lens.indexOf(t.len) < 0) return false;
      if (o.act && t.act !== o.act) return false;
      if (!o.act && t.act && !o.ids) return false; // Aktivitätsgespräche nur über die Aktivität
      if (o.trig && t.trig !== o.trig) return false;
      if (t.decision && !o.dec) return false; // Lebensentscheidungen nur auf Wunsch des Spielers
      if (!o.trig && t.trig && !o.ids) return false; // anlassgebundene Gespräche nur mit Anlass
      if (c.ptPh < t.ph[0] || c.ptPh > t.ph[1]) return false;
      if (t.th && !P.isOpen(p, t.th, t.thAge, c.t)) return false;
      if (t.once && p.used[t.id] != null) return false;
      if (p.used[t.id] != null && c.t - p.used[t.id] < P.cd(t)) return false;
      if (recent.indexOf(t.id) >= 0) return false;
      try { if (t.when && !t.when(c, p)) return false; } catch (er) { return false; }
      return true;
    }).map(function (t) { var r = 1; try { r = t.rel ? t.rel(c, p) : 1; } catch (er) { r = 1; } return { t: t, s: r + (t.th ? 3 : 0) + (t.trig ? 2 : 0) + R.rand() * 0.9 }; })
      .sort(function (a, b) { return b.s - a.s; });
  };
  P.select = function (st, o) { var l = P.candidates(st, o); return l.length ? l[0].t : null; };
  P.start = function (st, id, data) { var t = P.BY[id]; if (!t) return null; if (L.active(st) && !L.active(st).done) L.ensure(st).dlg = null; return L.start(st, 'pt_' + id, data || {}); };
  // Kurzer Moment ohne Dialog (statt einer Wiederholung)
  var MOM = ['Ihr kocht zusammen und erzählt euch vom Tag.', 'Ein ruhiger Abend: {n} liest, du schaust Spielszenen.', 'Ihr telefoniert kurz zwischen Training und {place}.', '{n} schickt dir ein Foto vom Feierabend.', 'Kurzer Spaziergang um den Block, mehr braucht es heute nicht.', 'Ihr plant die Woche am Küchentisch.', 'Frühstück zu zweit, bevor der Tag losgeht.'];
  P.moment = function (st) { var c = P.ctx(st); if (!c.pt) return ''; var lf = L.life(st), i = (lf.ptMomI = ((lf.ptMomI || 0) + 1) % MOM.length); return P.fill(MOM[i], c); };
  P.feed = function (st, txt) { var lf = L.life(st); lf.ptFeed = lf.ptFeed || []; lf.ptFeed.unshift({ t: tick(st), s: st.season, w: st.week, txt: txt }); if (lf.ptFeed.length > 8) lf.ptFeed.length = 8; };
  // Gespräch auf Wunsch des Spielers („Mit … reden“)
  P.talk = function (st) {
    var t = P.select(st, { cats: ['alltag', 'sport', 'beruf', 'freizeit', 'konflikt', 'transfer', 'leben'], lens: ['kurz', 'pers'] });
    if (t) return P.start(st, t.id);
    var txt = P.moment(st); P.feed(st, txt); return { moment: txt };
  };
  P.decisions = function (st) { return P.candidates(st, { cats: ['leben'], lens: ['gross', 'pers'], recentN: 0, dec: true }).map(function (x) { return x.t; }).filter(function (t) { return t.decision; }); };

  // ---------- Aktivitäten ----------
  P.ACTS = {
    dinner: { n: 'Essen gehen', cost: 120, ap: 1, ic: '🍽️', mood: 'Ein Abend mit gutem Essen und langen Gesprächen.', intr: 'Kochen' },
    cinema: { n: 'Kino', cost: 35, ap: 1, ic: '🎬', mood: 'Popcorn, ein Film und die Diskussion danach.', intr: 'Filme' },
    walk: { n: 'Spaziergang', cost: 0, ap: 1, ic: '🌳', mood: 'Frische Luft, keine Termine, nur ihr beide.', intr: 'Wandern' },
    concert: { n: 'Konzert', cost: 140, ap: 1, ic: '🎵', mood: 'Laute Musik, volle Halle, heisere Stimmen danach.', intr: 'Musik' },
    sport: { n: 'Gemeinsam Sport', cost: 20, ap: 1, ic: '🚴', mood: 'Eine lockere Runde zusammen – ohne Trainer und Taktik.', intr: 'Yoga' },
    trip: { n: 'Wochenendausflug', cost: 450, ap: 2, ic: '🧳', mood: 'Zwei Tage raus aus der Stadt.', intr: 'Reisen', summer: false },
    vacation: { n: 'Gemeinsamer Urlaub', cost: 2500, ap: 2, ic: '🏝️', mood: 'Eine Woche Sonne – das Handy bleibt meistens aus.', intr: 'Reisen', onlyBreak: true },
    friends: { n: 'Freunde besuchen', cost: 40, ap: 1, ic: '🫂', mood: 'Ein Abend bei Freunden, viel Lachen.', intr: 'Tanzen' },
    family: { n: 'Familienfeier', cost: 80, ap: 1, ic: '🎂', mood: 'Kaffee, Kuchen und neugierige Fragen der Verwandtschaft.', intr: '' },
    match: { n: 'Heimspiel besuchen lassen', cost: 0, ap: 0, ic: '🏟️', mood: '{n} sitzt auf der Tribüne und fiebert mit.', intr: '', season: true },
    dayoff: { n: 'Freier Tag zusammen', cost: 60, ap: 2, ic: '☀️', mood: 'Ein Tag ohne Plan – ausschlafen, Markt, Café.', intr: '' },
    home: { n: 'Gemütlicher Abend', cost: 0, ap: 1, ic: '🛋️', mood: 'Decke, Serie, Lieferessen – genau richtig.', intr: 'Filme' }
  };
  P.actAvail = function (st, k) {
    var a = P.ACTS[k], brk = st.phase !== 'season' || (S.isBreak && S.isBreak(st));
    if (a.onlyBreak && !brk) return 'Nur in der Sommer- oder Winterpause möglich.';
    if (a.season && st.phase !== 'season') return 'Gerade finden keine Heimspiele statt.';
    return '';
  };
  P.doAct = function (st, k) { // gibt { ok, dlg } oder { ok, txt } zurück
    var a = P.ACTS[k], p = P.partner(st); if (!a || !p) return { ok: false, why: 'Gerade nicht möglich.' };
    var na = P.actAvail(st, k); if (na) return { ok: false, why: na };
    var cost = Math.round(a.cost * (k === 'vacation' || k === 'trip' ? (R.pf && R.pf.ensure(st).life === 'luxus' ? 2 : 1) : 1));
    var sp = L.spend(st, a.ap, cost); if (!sp.ok) return sp;
    var c = P.ctx(st), hit = a.intr && (p.intr || []).indexOf(a.intr) >= 0, again = p.acts.slice(0, 3).indexOf(k) >= 0;
    p.acts.unshift(k); if (p.acts.length > 10) p.acts.length = 10; p.neg = Math.max(0, p.neg - 3); p.actT = tick(st);
    var gain = (hit ? 5 : 3) - (again ? 1.5 : 0) + (k === 'vacation' ? 5 : k === 'trip' || k === 'dayoff' ? 2 : 0);
    L.eff(st, { partner: Math.round(gain), stress: k === 'vacation' ? -6 : -1, well: k === 'vacation' ? 5 : 1 });
    if (k === 'vacation') P.mem(st, 'vacation', 'Gemeinsamer Urlaub', 'unser Urlaub' + (p.intr.indexOf('Wandern') >= 0 ? ' in den Bergen' : ' am Meer'));
    if (k === 'match') P.mem(st, 'stands_' + st.season, '{n} im Stadion', 'das Spiel, bei dem du auf der Tribüne warst'.replace('{n}', fn(p)));
    // Gesprächsanlass? Nicht jede Aktivität erzeugt ein Gespräch
    var t = chance(again ? 0.35 : 0.6) ? P.select(st, { act: k }) : null;
    if (t) { P.start(st, t.id, { act: k }); return { ok: true, dlg: true }; }
    var txt = P.fill(a.mood, c) + (hit ? ' ' + fn(p) + ' liebt so etwas.' : again ? ' Schön – aber langsam kennt ihr das.' : '') + (c.load >= 4 && k !== 'home' ? ' Nach der harten Trainingswoche bist du ziemlich müde.' : '') + (c.winter && (k === 'walk' || k === 'sport') ? ' Kalt, aber klar.' : '');
    P.feed(st, a.ic + ' ' + txt);
    return { ok: true, txt: txt };
  };

  // ---------- Wöchentlich: eigenes Leben, Vernachlässigung, Sport-Anlässe, Takt ----------
  // Takt: Partnergespräche aus eigenem Antrieb höchstens alle ~3 Wochen; in heißen Saisonphasen nur Wichtiges;
  // in der Sommerpause etwas mehr. Kleine Alltagsmomente laufen automatisch als kurze Zusammenfassung.
  P.LIFEEV = [
    { k: 'promo', p: 0.010, when: function (c, p) { return !p.stud && p.jobLv < 4; }, fx: function (st, p) { p.jobLv++; p.inc = Math.round(p.inc * 1.12 / 1000) * 1000; P.open(st, 'promo'); return fn(p) + ' wurde befördert.'; } },
    { k: 'joboffer', p: 0.004, when: function (c, p) { return !p.stud && c.ptPh >= 5 && !P.isOpen(p, 'joboffer'); }, fx: function (st, p) { P.open(st, 'joboffer', { city: pick(['Hamburg', 'München', 'Wien', 'Zürich', 'Leipzig', 'Köln']) }); return fn(p) + ' hat ein Jobangebot in einer anderen Stadt.'; } },
    { k: 'exam', p: 0.03, when: function (c, p) { return p.stud && !P.isOpen(p, 'exam') && !P.closed(p, 'grad'); }, fx: function (st, p) { P.open(st, 'exam', { due: tick(st) + R.randInt(2, 4) }); return fn(p) + ' steckt in der Prüfungsphase.'; } },
    { k: 'grad', p: 0.01, when: function (c, p) { return p.stud && (p.th.exam && p.th.exam.done) && c.st.season - (p.sinceS || c.st.season) >= 1; }, fx: function (st, p) { p.stud = false; p.job = pick(['Softwareentwicklung', 'Journalismus', 'Architektur', 'Unternehmensberatung', 'Lehrerin/Lehrer']); p.inc = Math.round((P.JOBS[p.job] || [45000])[0] * 0.8 / 1000) * 1000; P.open(st, 'grad'); P.mem(st, 'grad', 'Studienabschluss von ' + fn(p), 'dein Studienabschluss'); return fn(p) + ' hat das Studium abgeschlossen und beginnt als ' + p.job + '.'; } },
    { k: 'stress', p: 0.012, when: function (c, p) { return !P.isOpen(p, 'workstress'); }, fx: function (st, p) { P.open(st, 'workstress'); return fn(p) + ' hat gerade viel Stress im Beruf.'; } },
    { k: 'course', p: 0.006, when: function (c, p) { return !p.stud && !P.isOpen(p, 'course'); }, fx: function (st, p) { P.open(st, 'course'); return fn(p) + ' beginnt eine Weiterbildung.'; } },
    { k: 'success', p: 0.008, when: function () { return true; }, fx: function (st, p) { P.open(st, 'success'); return fn(p) + ' feiert einen beruflichen Erfolg.'; } },
    { k: 'setback', p: 0.006, when: function (c, p) { return !P.isOpen(p, 'setback'); }, fx: function (st, p) { P.open(st, 'setback'); return fn(p) + ' hat eine berufliche Enttäuschung erlebt.'; } },
    { k: 'famduty', p: 0.006, when: function (c, p) { return !P.isOpen(p, 'famduty'); }, fx: function (st, p) { P.open(st, 'famduty'); return fn(p) + ' muss sich um die eigene Familie kümmern.'; } },
    { k: 'ownTrip', p: 0.005, when: function (c) { return c.summer || c.winter; }, fx: function (st, p) { P.open(st, 'ownTrip'); return fn(p) + ' fährt ein paar Tage mit Freunden weg.'; } },
    { k: 'bizplan', p: 0.004, when: function (c, p) { return p.indep >= 60 && !p.stud && !p.self && !P.has(p, 'biz'); }, fx: function (st, p) { P.open(st, 'bizplan'); return fn(p) + ' denkt über die Selbstständigkeit nach.'; } }
  ];
  P.weekly = function (st) {
    var lf = L.life(st), p = P.partner(st), pc = st.pc; if (!p || pc.retired) { if (lf) lf.ptG = C.player(st) ? C.player(st).stats.goals : 0; return; }
    var c = P.ctx(st), t = c.t, pl = c.p;
    // eigenes Einkommen wächst langsam
    if (st.week === 1 && st.phase === 'season' && !p.stud) p.inc = Math.round(p.inc * 1.02 / 1000) * 1000;
    // Vernachlässigung: ohne Zeit füreinander steigt sie langsam; nicht sofort Drama
    var a = c.cx.plan.a || {}, careT = (a.partner || 0) + (a.private || 0) * 0.5 + (t - (p.actT || -99) <= 1 ? 1 : 0) + (t - (p.lastT || -99) <= 1 ? 0.5 : 0);
    p.neg = careT >= 1 ? Math.max(0, p.neg - 1.5) : p.neg + (p.time >= 60 ? 1 : 0.6);
    if (p.neg <= 0 && P.closed(p, 'neg_soft') && !P.isOpen(p, 'neg_hard')) { delete p.th.neg_soft; delete p.th.neg_hard; } // wieder im Lot: Konfliktkette kann später neu beginnen
    // eigene Lebensereignisse
    P.LIFEEV.forEach(function (ev) { if (chance(ev.p) && ev.when(c, p)) { var txt = ev.fx(st, p); X.chron(st, 'familie', '🗓️', 'Neues von ' + fn(p), txt, 1); P.feed(st, txt); } });
    if (p.th.exam && !p.th.exam.done && t >= (p.th.exam.d.due || 0) + 1) { P.close(st, 'exam', chance(0.8) ? 'bestanden' : 'durchgefallen'); P.open(st, 'examres', { ok: p.th.exam.res === 'bestanden' }); }
    // Sport-Anlässe vormerken (Verletzung, Transfer, Vertragsende, Rückkehr)
    if (pl && pl.inj && !P.isOpen(p, 'inj')) { P.open(st, 'inj', { w0: pl.inj.weeks, type: pl.inj.type, stage: 0 }); }
    if (pl && P.isOpen(p, 'inj') && !pl.inj) { p.th.inj.d.back = t; P.close(st, 'inj', 'zurück'); P.open(st, 'injback'); }
    if ((c.offers.length || c.moving) && !P.has(p, 'offer_s' + st.season) && !P.isOpen(p, 'offer')) P.open(st, 'offer', { told: false });
    if (c.moving && !P.isOpen(p, 'move') && !P.closed(p, 'move_' + st.season)) P.open(st, 'move', { to: pc.moving.to });
    if (c.noRenew && !P.isOpen(p, 'norenew') && !P.closed(p, 'norenew')) P.open(st, 'norenew');
    // Takt und Auswahl eines Gesprächs aus eigenem Antrieb
    var mode = lf.ptMode || 'normal', gap = t - (lf.ptLastAuto || -99), hot = c.late || (st.phase === 'season' && c.sp.fresh && c.cx.per.stress > 70);
    lf.ptG = pl ? pl.stats.goals : 0;
    if (L.active(st)) return;
    var trig = P.trigger(st, c);
    var prio = trig && trig.prio;
    var minGap = mode === 'wenig' ? 6 : c.summer ? 2 : 3;
    if (!prio && (gap < minGap || hot)) { if (chance(0.25)) P.feed(st, P.moment(st)); return; }
    var t1 = trig ? P.select(st, { trig: trig.k }) : null;
    if (!t1 && !prio && chance(c.summer ? 0.35 : 0.2)) t1 = P.select(st, { cats: ['alltag', 'beruf', 'freizeit', 'konflikt', 'leben', 'transfer'], lens: mode === 'wenig' ? ['gross'] : ['kurz', 'pers', 'gross'] });
    if (!t1) return;
    if (t1.len === 'kurz' || (mode === 'wenig' && t1.len === 'pers' && !prio)) { // kleine Dinge laufen automatisch
      P.start(st, t1.id); var r = L.autoRun(st, L.safePolicy); if (r && r.log && r.log.length) P.feed(st, '💬 ' + (r.log[r.log.length - 1].r || P.moment(st)));
      lf.ptLastAuto = t; return;
    }
    P.start(st, t1.id, { auto: 1 }); lf.ptLastAuto = t;
  };
  // Anlass mit Priorität (Verletzungsgeschichte, Transfer, Jobangebot, ernsthafter Konflikt, Sportmoment)
  P.trigger = function (st, c) {
    var p = c.pt, sp = c.sp, lf = L.life(st);
    if (P.isOpen(p, 'inj')) { var ij = p.th.inj.d, w = c.injW, s0 = ij.stage || 0, tot = ij.w0 || w;
      var stage = s0 === 0 ? 1 : (s0 === 1 && tot - w >= 1) ? 2 : (s0 === 2 && w <= Math.max(2, tot * 0.6) && tot >= 4) ? 3 : (s0 >= 2 && w <= 2 && s0 < 4) ? 4 : 0;
      if (stage) { ij.stage = stage; return { k: 'inj' + stage, prio: true }; } } // jede Etappe der Verletzungsgeschichte wird erzählt
    if (P.isOpen(p, 'neg_hard') && c.t - p.th.neg_hard.t > 10) P.close(st, 'neg_hard', 'verlaufen');
    if (P.isOpen(p, 'injback', 3, c.t)) return { k: 'injback', prio: true };
    if (P.isOpen(p, 'move')) return { k: 'move', prio: true };
    if (P.isOpen(p, 'norenew', 6, c.t)) return { k: 'norenew', prio: true };
    if (P.isOpen(p, 'joboffer', 8, c.t)) return { k: 'joboffer', prio: true };
    if (((p.neg >= 10 && P.closed(p, 'neg_soft')) || (p.v < 36 && p.neg >= 4)) && !P.isOpen(p, 'neg_hard') && !(p.th.neg_hard && c.t - (p.th.neg_hard.tc || 0) < 8)) { P.open(st, 'neg_hard'); return { k: 'neg_hard', prio: true }; }
    if (p.neg >= 4 && !P.isOpen(p, 'neg_soft') && !P.closed(p, 'neg_soft')) { P.open(st, 'neg_soft'); return { k: 'neg_soft', prio: false }; }
    if (sp.fresh && lf.ptSpKey !== sp.key) {
      lf.ptSpKey = sp.key;
      if (sp.win && sp.goals >= 1) return { k: 'goal', prio: false };
      if (sp.loss && (sp.rating != null ? sp.rating <= 5.2 : chance(0.4))) return { k: 'loss', prio: false };
      if (sp.win) return { k: 'win', prio: false };
    }
    if (c.share != null && c.share < 0.3 && st.week >= 8 && !P.isOpen(p, 'bench') && !P.closed(p, 'bench_' + st.season)) { P.open(st, 'bench'); return { k: 'bench', prio: false }; }
    if (P.isOpen(p, 'offer') && !p.th.offer.d.told) return { k: 'offer', prio: false };
    if (P.isOpen(p, 'offer') && p.th.offer.d.told && c.t - p.th.offer.t >= 2) return { k: 'offer2', prio: false };
    if (P.isOpen(p, 'coachp') && P.closed(p, 'coachdone')) return { k: 'coachback', prio: false };
    return null;
  };

  // ---------- Vorhaben aus Gesprächen (z. B. „Ich rede morgen mit dem Trainer“) ----------
  P.todo = function (st, k, label, dlg, data) { var lf = L.life(st); lf.todo = (lf.todo || []).filter(function (x) { return x.k !== k; }); lf.todo.push({ k: k, l: label, dlg: dlg, data: data || {}, t: tick(st), until: tick(st) + 6 }); };
  P.todos = function (st) { var lf = L.life(st), t = tick(st); lf.todo = (lf.todo || []).filter(function (x) { return x.until >= t && !x.done; }); return lf.todo; };
  var basePick = L.pick;
  L.pick = function (st, i) {
    var s = L.active(st), r = basePick(st, i), lf = L.life(st);
    if (s && s.done && lf && lf.todo) {
      var hit = s.id === 'coach' ? 'coach' : s.id === 'agent' ? 'agent' : null;
      if (hit) { lf.todo.forEach(function (x) { if (x.dlg === hit) x.done = true; }); var p = P.partner(st); if (p && P.isOpen(p, hit === 'coach' ? 'coachp' : 'agentp')) { P.open(st, hit + 'done'); P.close(st, hit + 'done'); } }
    }
    return r;
  };

  // ---------- Finanzen: gemeinsamer Haushalt (kein pauschaler Bonus) ----------
  if (R.pf && R.pf.month) {
    var baseMonth = R.pf.month;
    R.pf.month = function (st) {
      baseMonth(st);
      var lf = L.life(st), p = lf && lf.partner; if (!p || !p.pv2 || p.stage < 4 || p.ld) return;
      var f = R.pf.ensure(st), Lf = R.pf.LIFE[f.life] || R.pf.LIFE.komfortabel;
      var extra = Math.round(Lf.m * 0.25), share = Math.round(Math.min(p.inc / 12 * 0.3, Lf.m * 0.5));
      R.pf.book(st, -extra, 'Lebenshaltung');            // zu zweit kostet der Haushalt mehr
      if (share > 0) R.pf.book(st, share, 'Haushaltsbeitrag Partnerperson'); // eigener Beitrag aus eigenem Einkommen
    };
  }

  // ---------- Stimmungsbilder (Begrüßung, entspannt, romantisch, nachdenklich, Konflikt, Versöhnung, Erfolg, Abschied) ----------
  ['greet', 'relaxed', 'romantic', 'thought', 'conflict', 'reconcile', 'success', 'farewell'].forEach(function (k) { L.SCENES['pt_' + k] = { all: k === 'romantic' ? ['ev_first_date'] : [], svg: 'pt_' + k }; });
  P.IMGS = ['greet', 'relaxed', 'romantic', 'thought', 'conflict', 'reconcile', 'success', 'farewell'];

  // ---------- Vorhandene Abläufe anbinden ----------
  C.on.weekly.push(P.weekly);
  C.on.start.push(function (st) { var lf = L.life(st); if (lf && lf.partner) P.ensure(st, lf.partner); });
})(RFM);
