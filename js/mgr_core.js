// Managerkarriere 3.0 – Kern (gemeinsam für ANPFIFF und ANWURF)
// Lebendiger Verein: Personen mit eigenen Interessen (Spieler, Stab, Vorstand, Fans, Medien, Sponsoren, Berater),
// Persönlichkeiten und Kabine, Versprechen und Gesprächsgedächtnis, Vereinsgedächtnis, zentraler mehrstufiger Dialogmanager.
// Alles baut auf vorhandenen Daten auf (Spieler, Moral, Vorstandsvertrauen, Finanzen, Gebäude) – keine Parallelsysteme.
(function (R) {
  'use strict';
  var W = R.world, S = R.season, E = R.econ || R.economy, D = R.data, M = R.match, T = R.transfers;
  var MX = R.mx = {};
  var HB = !!(R.cx && R.cx.HB) || /Halle/.test((D.sponsorCategories || {}).namensrechte || '');
  MX.HB = HB;
  MX.TERM = HB ? { pen: 'Siebenmeter', penS: 'Siebenmeterschütze', arena: 'Halle', min: 60, xi: 7, sport: 'Handball', goalie: 'Torwart', pitch: 'Platte' }
    : { pen: 'Elfmeter', penS: 'Elfmeterschütze', arena: 'Stadion', min: 90, xi: 11, sport: 'Fußball', goalie: 'Torwart', pitch: 'Platz' };
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  MX.clamp = clamp;
  function tick(st) { return st.tick || 0; }
  MX.tick = tick;
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  MX.hash = hash;
  function hr(seed, i) { return (hash(seed + ':' + (i || 0)) % 10000) / 10000; } // deterministischer Zufall (beeinflusst den Spielzufall nicht)
  MX.hr = hr;
  function money(v) { return R.fmtMoney ? R.fmtMoney(v) : Math.round(v) + ' €'; }
  MX.money = money;
  function pname(p) { return p ? (W.playerName ? W.playerName(p) : p.first + ' ' + p.last) : '—'; }
  MX.pname = pname;
  function pk(a, seed) { return a[seed == null ? Math.floor(R.rand() * a.length) : hash(seed) % a.length]; }
  MX.pk = pk;
  MX.club = function (st) { return S.userClub(st); };
  // Aktiv nur in der Managerkarriere (in der Spielerkarriere läuft die Welt über js/career_*.js)
  MX.on = function (st) { return !!(st && st.manager && !st.manager.unemployed && S.userClub(st) && !(R.pc && R.pc.active && R.pc.active(st))); };

  var FIRST = ['Thomas', 'Andreas', 'Michael', 'Stefan', 'Markus', 'Jan', 'Tobias', 'Sven', 'Frank', 'Dirk', 'Jörg', 'Holger', 'Kai', 'Nils', 'Oliver', 'Patrick', 'Ralf', 'Uwe', 'Bernd', 'Martin', 'Sabine', 'Claudia', 'Petra', 'Anja', 'Katrin', 'Julia', 'Nicole', 'Sandra', 'Miriam', 'Lena', 'Aylin', 'Deniz', 'Marco', 'Luca', 'Henrik', 'Ole', 'Ines', 'Carla', 'Vera', 'Jonas'];
  var LAST = ['Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Lehmann', 'Köhler', 'Maier', 'Fuchs', 'Vogel', 'Roth', 'Jung', 'Hahn', 'Keller', 'Berger', 'Arnold', 'Franke', 'Lorenz', 'Brandt', 'Sommer', 'Graf', 'Seidel', 'Haas', 'Kraft', 'Busch', 'Dietrich', 'Ziegler', 'Kuhn', 'Pohl'];
  MX.newName = function (st, salt) {
    var used = (st.mx && st.mx.usedNames) || {}, n, g = 0;
    do { n = pk(FIRST, salt + 'f' + g + (st.seed || 0)) + ' ' + pk(LAST, salt + 'l' + g + (st.seed || 0)); g++; } while (used[n] && g < 40);
    if (st.mx) { st.mx.usedNames = used; used[n] = 1; }
    return n;
  };

  // ---------- Zustand ----------
  MX.V = 1;
  var FANG = { casual: 'Gelegenheitsfans', family: 'Familienfans', clubs: 'Organisierte Fanclubs', active: 'Aktive Fanszene', ultras: 'Ultras', long: 'Langjährige Anhänger', away: 'Auswärtsfahrer' };
  MX.FANG = FANG;
  var JTYPES = [['seriös', 'Tageblatt'], ['Boulevard', 'Abendpost'], ['Taktik-Analyst', 'Spielverlagerung Nord'], ['Fan-Podcast', 'Kurvengeflüster'], ['provokant', 'Sportradio 1']];
  var ATYPES = { lang: 'langfristig orientiert', prov: 'provisionsorientiert', hart: 'aggressiver Verhandler', jung: 'Nachwuchsspezialist', top: 'internationaler Topagent' };
  MX.ATYPES = ATYPES;
  MX.ensure = function (st) {
    if (!st) return null;
    var mx = st.mx;
    if (!mx) {
      mx = st.mx = { v: MX.V, usedNames: {}, clubId: null, people: null, fans: null, media: 50, kabMod: 0, kab: 60, roles: {}, pl: {}, mem: { said: [], prom: [], agree: [], conf: [] },
        arcs: [], cd: {}, dlg: null, dq: [], feed: [], chron: [], hist: { seasons: [], pl: {}, youthSales: [], records: {}, staff: [], builds: [], titles: [], moves: [] },
        rel: {}, spons: { v: 55, goals: [], paid: {} }, agents: [], life: null, stats: { dlgs: 0, auto: 0, byId: {}, fired: [] }, opt: { density: 'normal', autoMinor: false }, last: {}, reports: [], ident: {}, staffX: {}, ntJob: null };
    }
    if (!mx.usedNames) mx.usedNames = {};
    var club = S.userClub(st);
    if (club && mx.clubId !== club.id) MX.newClub(st, club);
    if (!mx.agents.length) MX.makeAgents(st);
    if (!mx.life) mx.life = { status: 'single', partner: null, exes: [], kids: [], stress: 30, dates: 0, lastDate: -99, cands: [] };
    (mx.life.cands || []).forEach(function (c, i) { if (!c.id) c.id = 'mc0_' + i; if (c.stage == null) c.stage = 1; if (!c.intr) c.intr = ['Kochen', 'Reisen']; }); // ältere Spielstände: Kontakte mit Kennung
    return mx;
  };
  // Vereinswechsel: neue Bezugspersonen, Gedächtnis des alten Vereins bleibt in der Historie
  MX.newClub = function (st, club) {
    var mx = st.mx, old = mx.clubId;
    if (old && mx.people) mx.hist.moves.push({ s: st.season, from: old, to: club.id, fromName: (st.clubs[old] || {}).name || '', toName: club.name });
    mx.clubId = club.id; mx.pl = {}; mx.roles = {}; mx.arcs = []; mx.kabMod = 0; mx.kab = 60;
    var s = club.id + ':' + (st.seed || 0);
    mx.people = {
      pres: { name: MX.newName(st, s + 'pres'), role: 'Präsident', style: pk(['ungeduldig', 'geduldig', 'visionär', 'sparsam'], s + 'ps'), v: 55 },
      ceo: { name: MX.newName(st, s + 'ceo'), role: 'Geschäftsführer', style: pk(['zahlenorientiert', 'kaufmännisch vorsichtig', 'wachstumsorientiert'], s + 'cs'), v: 55 },
      sd: { name: MX.newName(st, s + 'sd'), role: 'Sportdirektor', style: pk(['Nachwuchsförderer', 'Netzwerker', 'Analytiker'], s + 'ss'), v: 55 },
      ar: { name: MX.newName(st, s + 'ar'), role: 'Vorsitz Aufsichtsrat', style: pk(['Traditionalist', 'Wirtschaftsvertreter'], s + 'as'), v: 50 },
      inv: club.reputation >= 70 && hr(s, 'inv') < 0.4 ? { name: MX.newName(st, s + 'inv'), role: 'Investor', style: 'renditeorientiert', v: 50 } : null,
      fanClubs: { name: MX.newName(st, s + 'fc'), role: 'Sprecher der Fanclubs', v: 55 },
      ultras: { name: MX.newName(st, s + 'ul'), role: 'Vorsänger der aktiven Szene', v: 50 },
      fanProj: { name: MX.newName(st, s + 'fp'), role: 'Fanprojekt (Sozialarbeit)', v: 60 },
      jrn: JTYPES.map(function (j, i) { return { id: 'j' + i, name: MX.newName(st, s + 'j' + i), type: j[0], outlet: j[1], v: 50, quotes: [] }; })
    };
    mx.fans = { casual: 55, family: 58, clubs: 60, active: 55, ultras: 52, long: 60, away: 56 };
    mx.media = 50;
    mx.spons = { v: 55, goals: [], paid: (mx.spons && mx.spons.paid) || {} };
    mx.staffX = {};
    MX.ident(st, club);
    MX.chron(st, '🏟️', 'Neuer Arbeitgeber: ' + club.name, 'Präsident ' + mx.people.pres.name + ' (' + mx.people.pres.style + ') stellt dich vor.', 2);
  };
  MX.reset = function (st) { delete st.mx; return MX.ensure(st); };

  // ---------- Vereinsidentität ----------
  MX.ident = function (st, club) {
    var mx = st.mx; if (!club) return null;
    if (mx.ident[club.id]) return mx.ident[club.id];
    var s = 'id' + club.id + (st.seed || 0), rep = club.reputation || 50;
    var id = {
      trad: Math.round(clamp(rep * 0.6 + hr(s, 1) * 50 - 5, 10, 95)), // Traditionsbewusstsein
      youth: Math.round(clamp(((club.fac && club.fac.jugend) || 1) * 12 + hr(s, 2) * 40, 10, 95)), // Bedeutung der Nachwuchsarbeit
      region: Math.round(clamp(40 + hr(s, 3) * 55, 10, 95)), // Regionale Verwurzelung
      expect: Math.round(clamp(rep * 0.9 + (club.league === 1 ? 10 : 0) - 10 + hr(s, 4) * 15, 10, 95)), // Erwartungen der Fans
      money: Math.round(clamp((club.cash || 0) / Math.max(1, E.revenueEstimate ? E.revenueEstimate(st, club) : 1e7) * 60 + 35, 5, 95)),
      ambition: Math.round(clamp(rep * 0.7 + hr(s, 5) * 35, 10, 95)),
      sell: Math.round(clamp(30 + hr(s, 6) * 60, 10, 95)) // Toleranz gegenüber dem Verkauf wichtiger Spieler
    };
    id.label = (id.trad >= 70 ? 'Traditionsverein' : id.money >= 70 ? 'Finanzstarker Verein' : id.youth >= 70 ? 'Ausbildungsverein' : id.region >= 75 ? 'Regional verwurzelter Verein' : 'Ambitionierter Verein');
    mx.ident[club.id] = id; return id;
  };

  // ---------- Persönlichkeit (deterministisch je Spieler; manche Werte verborgen) ----------
  var TRAITS = { amb: 'Ehrgeiz', loy: 'Loyalität', dis: 'Disziplin', team: 'Teamfähigkeit', lead: 'Führungsqualität', conf: 'Selbstvertrauen', fight: 'Konfliktbereitschaft', risk: 'Risikobereitschaft', res: 'Belastbarkeit', media: 'Medienverhalten' };
  MX.TRAITS = TRAITS;
  MX.HIDDEN = { loy: 1, dis: 1, lead: 1, fight: 1, res: 1 };
  var GOALS = { titel: 'Titel gewinnen', geld: 'Gut verdienen', stamm: 'Stammplatz', ausland: 'Großer Verein / Ausland', heimat: 'Heimatverbundenheit', nati: 'Nationalmannschaft' };
  MX.GOALS = GOALS;
  MX.pers = function (p) {
    if (!p) return null;
    if (p.pers) return p.pers;
    var s = 'pers' + p.id + (p.extId || ''), o = {};
    Object.keys(TRAITS).forEach(function (k, i) { o[k] = Math.round(clamp(4 + hr(s, i) * 14 + hr(s, i + 20) * 4 - 2, 1, 20)); });
    if (p.age >= 29) o.lead = Math.min(20, o.lead + 2);
    if (p.age <= 20) { o.conf = Math.max(1, o.conf - 2); o.amb = Math.min(20, o.amb + 2); }
    o.goal = pk(Object.keys(GOALS), s + 'goal');
    p.pers = o; return o;
  };
  MX.pl = function (st, p) { var mx = st.mx, id = p.id || p; if (!mx.pl[id]) mx.pl[id] = { rel: 50, bench: 0, apps0: (st.players[id] && st.players[id].stats ? st.players[id].stats.apps : 0), known: {}, talks: 0, unhappy: 0, last: -99, wish: null }; return mx.pl[id]; };
  MX.reveal = function (st, p, trait, why) { var r = MX.pl(st, p); if (!r.known[trait]) { r.known[trait] = 1; MX.feedAdd(st, { who: 'Kabine', txt: pname(p) + ': ' + TRAITS[trait] + ' zeigt sich (' + why + ').', kind: 'info' }); } };
  MX.squad = function (st) { var c = S.userClub(st); return c ? W.squad(st, c.id).filter(function (p) { return !p.youth; }) : []; };
  MX.starters = function (st) { var sq = MX.squad(st).slice().sort(function (a, b) { return b.ovr - a.ovr; }); return sq.slice(0, MX.TERM.xi + 2); };

  // ---------- Mannschaftshierarchie ----------
  MX.ROLE_N = { kap: 'Kapitän', lead: 'Führungsspieler', fav: 'Publikumsliebling', glue: 'Integrationsfigur', quiet: 'Stiller Leistungsträger', young: 'Ehrgeiziger Nachwuchsspieler', bench: 'Unzufriedener Ersatzspieler', diva: 'Schwieriger Star', mentor: 'Erfahrener Mentor' };
  MX.ROLE_IC = { kap: '©️', lead: '🧭', fav: '❤️', glue: '🤝', quiet: '🔧', young: '🌱', bench: '😤', diva: '💎', mentor: '🎓' };
  MX.computeRoles = function (st) {
    var mx = st.mx, club = S.userClub(st), sq = MX.squad(st), roles = {}; if (!club || !sq.length) { mx.roles = roles; return roles; }
    var byOvr = sq.slice().sort(function (a, b) { return b.ovr - a.ovr; }), top3 = byOvr.slice(0, 3), hp = st.mx.hist.pl || {};
    if (club.captain && st.players[club.captain] && st.players[club.captain].clubId === club.id) roles[club.captain] = 'kap';
    function free(p) { return !roles[p.id]; }
    sq.forEach(function (p) {
      var q = MX.pers(p), r = MX.pl(st, p);
      if (!free(p)) return;
      if (r.bench >= 4 && q.amb >= 11 && byOvr.indexOf(p) < MX.TERM.xi + 5) roles[p.id] = 'bench';
      else if (top3.indexOf(p) >= 0 && (q.team <= 7 || q.fight >= 15)) roles[p.id] = 'diva';
    });
    var fav = sq.filter(free).map(function (p) { var h = hp[p.id] || {}; return { p: p, v: (p.stats.goals || 0) * 2 + (h.seasons || 0) * 3 + (p.homegrown ? 8 : 0) + (p.ovr - 60) * 0.3 }; }).sort(function (a, b) { return b.v - a.v; })[0];
    if (fav && fav.v > 8) roles[fav.p.id] = 'fav';
    sq.filter(free).forEach(function (p) {
      var q = MX.pers(p), avg = p.stats.apps ? p.stats.rsum / p.stats.apps : 0;
      if (q.lead >= 15 && p.age >= 26) roles[p.id] = 'lead';
      else if (p.age >= 31 && q.team >= 12) roles[p.id] = 'mentor';
      else if (q.team >= 15 && p.age >= 24 && q.loy >= 11) roles[p.id] = 'glue';
      else if (p.age <= 21 && q.amb >= 14) roles[p.id] = 'young';
      else if (avg >= (HB ? 7.4 : 7.0) && q.media <= 8 && p.stats.apps >= 4) roles[p.id] = 'quiet';
    });
    mx.roles = roles; return roles;
  };

  // ---------- Kabinenstimmung ----------
  MX.kabine = function (st) {
    var mx = st.mx, club = S.userClub(st), sq = MX.squad(st); if (!club || !sq.length) return { v: 60, f: [] };
    var f = [], base = R.avg(sq, function (p) { return p.morale; }); f.push(['Moral im Kader', Math.round(base - 60)]);
    var unhappy = sq.filter(function (p) { var r = MX.pl(st, p); return r.bench >= 4 && MX.pers(p).amb >= 11; }).length; if (unhappy) f.push(['Unzufriedene Ersatzspieler', -Math.min(10, unhappy * 2)]);
    var wages = sq.map(function (p) { return p.wage; }).sort(function (a, b) { return a - b; }), med = wages[Math.floor(wages.length / 2)] || 1, mxw = wages[wages.length - 1] || 1;
    if (mxw / med > 5) f.push(['Große Gehaltsunterschiede', -Math.round(Math.min(6, (mxw / med - 5) * 1.2))]);
    var cap = club.captain && st.players[club.captain]; if (cap && cap.clubId === club.id) { var cr = MX.pl(st, cap); f.push(['Kapitän ' + cap.last, Math.round((cap.morale - 60) / 6 + (cr.rel - 50) / 10)]); }
    var broken = mx.mem.prom.filter(function (p) { return p.state === 'broken' && tick(st) - p.end < 16; }).length; if (broken) f.push(['Gebrochene Zusagen', -broken * 3]);
    var open = mx.mem.conf.filter(function (c) { return !c.done; }).length; if (open) f.push(['Offene Konflikte', -open * 2]);
    var news = (st.transfers || []).filter(function (t) { return t.toId === club.id && t.season === st.season; }).length; if (news >= 5) f.push(['Viele Neuzugänge', -Math.min(5, news - 4)]);
    var l = mx.last || {}; if (l.streak >= 3) f.push(['Siegesserie', Math.min(8, l.streak * 2)]); if (l.streak <= -3) f.push(['Niederlagenserie', Math.max(-8, l.streak * 2)]);
    var leaders = sq.filter(function (p) { var r = mx.roles[p.id]; return r === 'lead' || r === 'kap' || r === 'mentor' || r === 'glue'; }).length;
    if (l.streak <= -3 && leaders >= 3) f.push(['Führungsspieler halten zusammen', 4]);
    var divas = sq.filter(function (p) { return mx.roles[p.id] === 'diva'; }).length; if (divas) f.push(['Schwierige Stars', -divas * 2]);
    if (mx.kabMod) f.push(['Jüngste Entscheidungen', Math.round(mx.kabMod)]);
    var v = clamp(60 + f.reduce(function (s, x) { return s + x[1]; }, 0), 0, 100);
    return { v: Math.round(v), f: f };
  };

  // ---------- Gedächtnis: Aussagen, Zusagen, Vereinbarungen, Konflikte ----------
  MX.say = function (st, k, txt, who) { var m = st.mx.mem; m.said.unshift({ k: k, txt: txt, who: who || '', t: tick(st), s: st.season, w: st.week }); if (m.said.length > 120) m.said.length = 120; };
  MX.said = function (st, k, maxAge) { var s = st.mx.mem.said.filter(function (x) { return x.k === k && (maxAge == null || tick(st) - x.t <= maxAge); }); return s[0] || null; };
  MX.saidAny = function (st, re, maxAge) { return st.mx.mem.said.filter(function (x) { return re.test(x.k) && (maxAge == null || tick(st) - x.t <= maxAge); })[0] || null; };
  MX.PROM_N = { mins: 'mehr Einsatzzeit', start: 'Stammplatz', contract: 'Vertragsverlängerung', youth: 'Förderung als Talent', loan: 'Leihgeschäft', nati: 'Unterstützung beim Nationalmannschaftsziel', pen: 'Klärung der Schützenrolle' };
  MX.promise = function (st, o) { // o: { k, pid, weeks, need, txt }
    var p = st.players[o.pid], pr = { id: 'pr' + (tick(st)) + '_' + (st.mx.mem.prom.length), k: o.k, pid: o.pid, name: pname(p), made: tick(st), due: tick(st) + (o.weeks || 8), need: o.need || 0, apps0: p ? p.stats.apps : 0, c0: p ? p.contract : 0, state: 'open', txt: o.txt || MX.PROM_N[o.k], s: st.season };
    st.mx.mem.prom.unshift(pr); MX.say(st, 'prom_' + o.k, pr.txt, pr.name); return pr;
  };
  MX.openPromises = function (st, pid) { return st.mx.mem.prom.filter(function (x) { return x.state === 'open' && (!pid || x.pid === pid); }); };
  MX.checkPromises = function (st) {
    var out = [];
    st.mx.mem.prom.forEach(function (pr) {
      if (pr.state !== 'open') return;
      var p = st.players[pr.pid], club = S.userClub(st);
      if (!p || !club || p.clubId !== club.id) { pr.state = 'void'; pr.end = tick(st); return; }
      var apps = p.stats.apps - (p.stats.apps < pr.apps0 ? 0 : pr.apps0), kept = null, wk = tick(st) - pr.made, span = Math.max(1, pr.due - pr.made);
      if (pr.k === 'mins') kept = apps >= (pr.need || 3) ? true : (tick(st) >= pr.due ? false : null);
      else if (pr.k === 'start') kept = apps >= Math.ceil(span * 0.6) ? true : (tick(st) >= pr.due ? false : null);
      else if (pr.k === 'contract') kept = p.contract > pr.c0 ? true : (tick(st) >= pr.due ? false : null);
      else if (pr.k === 'youth') kept = (!p.youth && apps >= (pr.need || 3)) ? true : (tick(st) >= pr.due ? false : null);
      else if (pr.k === 'loan') kept = p.loan ? true : (tick(st) >= pr.due ? false : null);
      else if (pr.k === 'nati' || pr.k === 'pen') kept = tick(st) >= pr.due ? !pr.violated : null;
      if (kept === null) return;
      pr.state = kept ? 'kept' : 'broken'; pr.end = tick(st);
      var r = MX.pl(st, p), q = MX.pers(p);
      if (kept) { r.rel = clamp(r.rel + 10, 0, 100); p.morale = clamp(p.morale + 8, 0, 100); MX.chron(st, '🤝', 'Zusage eingehalten', pname(p) + ': ' + pr.txt + '.', 1); }
      else {
        r.rel = clamp(r.rel - 18, 0, 100); p.morale = clamp(p.morale - 12, 0, 100); r.unhappy += 2;
        st.mx.mem.conf.push({ id: 'cf' + tick(st) + p.id, k: 'promise', pid: p.id, t: tick(st), txt: 'Zusage „' + pr.txt + '“ nicht eingehalten', done: false });
        MX.chron(st, '💔', 'Zusage gebrochen', pname(p) + ' fühlt sich getäuscht (' + pr.txt + ').', 2);
        MX.feedAdd(st, { who: pname(p), txt: 'Mir wurde etwas anderes versprochen. Ich mache mir meine Gedanken.', kind: 'player', hot: q.media >= 12 });
        if (q.loy <= 9) r.wish = 'wechsel';
      }
      out.push(pr);
    });
    return out;
  };

  // ---------- Feed (Social Media & Meldungen) und Chronik ----------
  MX.feedAdd = function (st, o) { var mx = st.mx; o.t = tick(st); o.s = st.season; o.w = st.week; o.id = 'f' + tick(st) + '_' + (mx.feed.length + (mx.stats.feedN = (mx.stats.feedN || 0) + 1)); mx.feed.unshift(o); if (mx.feed.length > 80) mx.feed.length = 80; return o; };
  MX.chron = function (st, ic, ti, x, imp, img) { var mx = st.mx; if (!mx) return; mx.chron.unshift({ s: st.season, w: st.week, t: tick(st), ic: ic, ti: ti, x: x || '', imp: imp || 1, img: img || null }); if (mx.chron.length > 400) mx.chron.length = 400; };

  // ---------- Effekte (sichtbar als Chips im Dialog) ----------
  function sgn(v) { return (v > 0 ? '+' : '−') + Math.abs(Math.round(v)); }
  MX.fx = function (st, spec) {
    var mx = st.mx, club = S.userClub(st), mg = st.manager, out = [];
    function chip(t, v, inv) { out.push({ t: t + ' ' + sgn(v), pos: inv ? v < 0 : v > 0, neg: inv ? v > 0 : v < 0 }); }
    if (!spec) return out;
    if (spec.mor) [].concat(spec.mor[0] && typeof spec.mor[0] === 'object' ? spec.mor : [spec.mor]).forEach(function (x) { var p = st.players[x[0]]; if (p && x[1]) { p.morale = clamp(p.morale + x[1], 0, 100); chip('Moral ' + p.last, x[1]); } });
    if (spec.rel) [].concat(spec.rel[0] && typeof spec.rel[0] === 'object' ? spec.rel : [spec.rel]).forEach(function (x) { var p = st.players[x[0]]; if (p && x[1]) { var r = MX.pl(st, p); r.rel = clamp(r.rel + x[1], 0, 100); chip('Verhältnis ' + p.last, x[1]); } });
    if (spec.team) { MX.squad(st).forEach(function (p) { p.morale = clamp(p.morale + spec.team, 0, 100); }); chip('Moral Team', spec.team); }
    if (spec.kab) { mx.kabMod = clamp(mx.kabMod + spec.kab, -15, 15); chip('Kabine', spec.kab); }
    if (spec.board) { mg.trust = clamp((mg.trust || 50) + spec.board, 0, 100); chip('Vorstandsvertrauen', spec.board); }
    ['pres', 'ceo', 'sd', 'ar', 'inv', 'fanClubs', 'ultras', 'fanProj'].forEach(function (k) { if (spec[k] && mx.people[k]) { mx.people[k].v = clamp(mx.people[k].v + spec[k], 0, 100); chip(mx.people[k].role, spec[k]); } });
    if (spec.fans != null) {
      if (typeof spec.fans === 'number') { Object.keys(mx.fans).forEach(function (g) { mx.fans[g] = clamp(mx.fans[g] + spec.fans, 0, 100); }); chip('Fans', spec.fans); }
      else Object.keys(spec.fans).forEach(function (g) { if (mx.fans[g] != null) { mx.fans[g] = clamp(mx.fans[g] + spec.fans[g], 0, 100); chip(FANG[g], spec.fans[g]); } });
    }
    if (spec.media) { mx.media = clamp(mx.media + spec.media, 0, 100); chip('Ansehen', spec.media); }
    if (spec.jrn) { var j = mx.people.jrn.filter(function (x) { return x.id === spec.jrn[0]; })[0]; if (j) { j.v = clamp(j.v + spec.jrn[1], 0, 100); chip(j.outlet, spec.jrn[1]); } }
    if (spec.spons) { mx.spons.v = clamp(mx.spons.v + spec.spons, 0, 100); chip('Sponsoren', spec.spons); }
    if (spec.rep && club) { club.reputation = clamp(club.reputation + spec.rep, 1, 100); chip('Ansehen Verein', spec.rep); }
    if (spec.mrep) { mg.reputation = clamp((mg.reputation || 40) + spec.mrep, 1, 100); chip('Ruf Manager', spec.mrep); }
    if (spec.cash && club && spec.cash[0]) { club.cash += spec.cash[0]; E.book(club, spec.cash[1] || 'Sonstiges', spec.cash[0]); out.push({ t: (spec.cash[0] > 0 ? '+' : '−') + money(Math.abs(spec.cash[0])), pos: spec.cash[0] > 0, neg: spec.cash[0] < 0 }); }
    if (spec.staff) { var s = MX.staffP(st, spec.staff[0]); if (s) { s.v = clamp(s.v + spec.staff[1], 0, 100); chip(s.role + ' ' + s.name.split(' ')[1], spec.staff[1]); } }
    if (spec.agent) { var a = mx.agents.filter(function (x) { return x.id === spec.agent[0]; })[0]; if (a) { a.v = clamp(a.v + spec.agent[1], 0, 100); chip('Berater ' + a.name.split(' ')[1], spec.agent[1]); } }
    if (spec.crel) { mx.rel[spec.crel[0]] = clamp((mx.rel[spec.crel[0]] || 50) + spec.crel[1], 0, 100); chip('Beziehung ' + ((st.clubs[spec.crel[0]] || {}).short || ''), spec.crel[1]); }
    if (spec.stress) { mx.life.stress = clamp(mx.life.stress + spec.stress, 0, 100); chip('Stress', spec.stress, true); }
    if (spec.partner && mx.life.partner) { mx.life.partner.v = clamp(mx.life.partner.v + spec.partner, 0, 100); chip(mx.life.partner.name.split(' ')[0], spec.partner); }
    return out;
  };

  // ---------- Trainerstab als Personen ----------
  var XROLES = HB ? { tw: 'Torwarttrainer', jugend: 'Nachwuchsleiter', scout: 'Chefscout', arzt: 'Mannschaftsarzt', physio: 'Physiotherapeut' } : { tw: 'Torwarttrainer', jugend: 'Nachwuchsleiter', scout: 'Chefscout', arzt: 'Mannschaftsarzt', physio: 'Physiotherapeut' };
  MX.XROLES = XROLES;
  MX.staffP = function (st, k) {
    var club = S.userClub(st), mx = st.mx; if (!club) return null;
    var key = k, s;
    if (k === 'coach') { var c = club.coach; if (!c) return null; s = mx.staffX.coach; if (!s || s.name !== c.name) s = mx.staffX.coach = mkStaff(st, 'coach', c.name, 'Cheftrainer', Math.round((c.quality || 50))); return s; }
    if (D.staff[k]) { var cs = club.staff && club.staff[k]; if (!cs) return null; s = mx.staffX[k]; if (!s || s.name !== cs.name) s = mx.staffX[k] = mkStaff(st, k, cs.name, D.staff[k].n, 25 + cs.lvl * 22); return s; }
    if (XROLES[k]) { s = mx.staffX[k]; if (!s) { var lvl = k === 'jugend' ? E.level(club, 'jugend').q || 1 : k === 'arzt' || k === 'physio' ? ((club.fac && club.fac.medizin) || 1) : 2; s = mx.staffX[k] = mkStaff(st, k, MX.newName(st, club.id + k + st.season), XROLES[k], clamp(25 + lvl * 10, 20, 90)); } return s; }
    return null;
  };
  function mkStaff(st, k, name, role, comp) { var sd = 'st' + name + k; return { k: k, name: name, role: role, comp: comp, loy: Math.round(5 + hr(sd, 1) * 15), amb: Math.round(5 + hr(sd, 2) * 15), idea: pk(['offensiv', 'defensiv', 'Ballbesitz', 'Pressing', 'Nachwuchs', 'Disziplin'], sd), v: 55, yrs: 1 + (hash(sd) % 3), since: st.season }; }
  MX.staffList = function (st) { var club = S.userClub(st); if (!club) return []; var ks = ['coach'].concat(Object.keys(D.staff)).concat(Object.keys(XROLES)); return ks.map(function (k) { return MX.staffP(st, k); }).filter(Boolean); };

  // ---------- Berater ----------
  MX.makeAgents = function (st) {
    var mx = st.mx; mx.agents = Object.keys(ATYPES).concat(['lang', 'prov']).map(function (t, i) { return { id: 'a' + i, name: MX.newName(st, 'agent' + i), type: t, v: 50, deals: 0 }; });
  };
  MX.agentOf = function (st, p) { var mx = st.mx; var a = mx.agents; var i = (p.age <= 20 && hash('ag' + p.id) % 3 === 0) ? 3 : hash('ag' + p.id) % a.length; if (p.ovr >= 80 && hash('agt' + p.id) % 2 === 0) i = 4; return a[i] || a[0]; };

  // ---------- Vereinsbeziehungen (Transfers werden erinnert) ----------
  MX.crel = function (st, cid) { var v = st.mx && st.mx.rel[cid]; return v == null ? 50 : v; };
  if (T && T.executeTransfer) {
    var baseExec = T.executeTransfer;
    T.executeTransfer = function (st, p, toClub, fee, wage, years, opts) {
      var from = p.clubId ? st.clubs[p.clubId] : null, val = p.value || 1, wasHome = from && from.userControlled && W.isHomegrown && W.isHomegrown(p), pid = p.id;
      var rec = baseExec.apply(this, arguments);
      try {
        if (st.mx && MX.on(st)) {
          var uc = S.userClub(st), other = from && from.userControlled ? toClub : from;
          if (other && uc && other.id !== uc.id && (from && from.userControlled || toClub.userControlled)) {
            var fair = fee / Math.max(1, val), d = (opts && opts.loan) ? 3 : (fair > 1.35 && toClub.userControlled) ? 4 : (fair < 0.7 && from && from.userControlled) ? 3 : 1;
            st.mx.rel[other.id] = clamp(MX.crel(st, other.id) + d, 0, 100);
          }
          if (from && from.userControlled) {
            var h = st.mx.hist.pl[pid]; if (h) h.sold = { s: st.season, fee: fee, to: toClub.name };
            if (wasHome && fee > 0) st.mx.hist.youthSales.push({ s: st.season, name: pname(p), fee: fee, to: toClub.name });
            MX.event(st, 'sold', { pid: pid, fee: fee, to: toClub.id });
          }
          if (toClub.userControlled) MX.event(st, 'bought', { pid: pid, fee: fee, from: from ? from.id : null });
        }
      } catch (e) { if (typeof console !== 'undefined') console.error(e); }
      return rec;
    };
  }
  // Gute Beziehungen erleichtern Verhandlungen, schlechte verteuern sie
  if (T && T.askingPrice) {
    var baseAsk = T.askingPrice;
    T.askingPrice = function (st, p) { var v = baseAsk.apply(this, arguments); if (st && st.mx && MX.on(st) && p && p.clubId && !st.clubs[p.clubId].userControlled) { var r = MX.crel(st, p.clubId); v = R.round(v * (1 + (50 - r) / 400), 5000); } return v; };
  }
  // Ereignis-Hooks (für den Regisseur): Merker, die später in Geschichten aufgegriffen werden
  MX.event = function (st, k, data) { var mx = st.mx; mx.ev = mx.ev || []; mx.ev.push({ k: k, t: tick(st), d: data || {} }); if (mx.ev.length > 60) mx.ev.splice(0, mx.ev.length - 60); };
  MX.recent = function (st, k, weeks) { return ((st.mx && st.mx.ev) || []).filter(function (e) { return e.k === k && tick(st) - e.t <= (weeks || 2); }); };

  // ---------- Zentraler Dialogmanager ----------
  // Dialoge sind Funktionen (Registrierung) → speicherbar ist nur { id, ctx, node }. Knoten: { say, img, opts:[{ l, hint, req(st,ctx), go(st,ctx) → { r, e, next, end, img, sum } }] }
  MX.D = {};
  MX.addDlg = function (id, def) { MX.D[id] = def; };
  MX.IMP = { status: 0, normal: 1, wichtig: 2, krise: 3, highlight: 3 };
  MX.start = function (st, id, ctx, o) {
    var mx = MX.ensure(st); if (!MX.D[id]) return null; o = o || {};
    var item = { id: id, ctx: ctx || {}, t0: tick(st), prio: o.prio || 0, manual: !!o.manual };
    if (o.manual && mx.dlg && !mx.dlg.done) { mx.dq.unshift({ id: mx.dlg.id, ctx: mx.dlg.ctx, t0: tick(st), prio: 9, resume: mx.dlg }); mx.dlg = null; return open(st, item); }
    if (mx.dlg && !mx.dlg.done) { mx.dq.push(item); mx.dq.sort(function (a, b) { return b.prio - a.prio; }); if (mx.dq.length > 8) mx.dq.length = 8; return mx.dlg; }
    return open(st, item);
  };
  function open(st, item) {
    var mx = st.mx, def = MX.D[item.id](st, item.ctx || {});
    if (!def || !def.nodes || !def.nodes[def.start || 'start']) return null;
    mx.dlg = { id: item.id, ctx: item.ctx || {}, node: def.start || 'start', step: 1, log: [], react: null, img: null, t0: tick(st), done: false, sum: '', imp: def.imp || 'normal' };
    mx.stats.dlgs++; mx.stats.byId[item.id] = (mx.stats.byId[item.id] || 0) + 1;
    if (mx.opt.autoMinor && (def.imp || 'normal') === 'normal' && !item.manual) { MX.autoRun(st); mx.stats.auto++; MX.close(st); return mx.dlg; }
    return mx.dlg;
  }
  MX.active = function (st) { return st.mx && st.mx.dlg; };
  MX.def = function (st) { var d = st.mx && st.mx.dlg; return d ? MX.D[d.id](st, d.ctx) : null; };
  function optsOf(st, def, d) { var n = def.nodes[d.node]; if (!n) return []; return (typeof n.opts === 'function' ? n.opts(st, d.ctx) : n.opts || []).map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { return !x.o.req || x.o.req(st, d.ctx); }); }
  MX.view = function (st) {
    var d = MX.active(st); if (!d) return null; var def = MX.D[d.id](st, d.ctx), n = def.nodes[d.node] || {};
    var say = typeof n.say === 'function' ? n.say(st, d.ctx) : n.say;
    var who = typeof def.who === 'function' ? def.who(st, d.ctx) : def.who, ws = n.who ? (typeof n.who === 'function' ? n.who(st, d.ctx) : n.who) : null;
    return { id: d.id, title: def.title, who: ws || who || { n: '', role: '' }, cat: def.cat, imp: d.imp, step: d.step, max: Math.max(def.max || 3, d.step), say: say, img: MX.img(def.img, d.img || n.img || 'a'), react: d.react, done: d.done, sum: d.sum, log: d.log,
      opts: d.done ? [] : optsOf(st, def, d).map(function (x) { return { i: x.i, l: typeof x.o.l === 'function' ? x.o.l(st, d.ctx) : x.o.l, hint: x.o.hint ? (typeof x.o.hint === 'function' ? x.o.hint(st, d.ctx) : x.o.hint) : '' }; }) };
  };
  MX.pick = function (st, i) {
    var d = MX.active(st); if (!d || d.done) return null; var def = MX.D[d.id](st, d.ctx), x = optsOf(st, def, d).filter(function (y) { return y.i === i; })[0]; if (!x) return null;
    var res = (x.o.go ? x.o.go(st, d.ctx) : {}) || {};
    var lbl = typeof x.o.l === 'function' ? x.o.l(st, d.ctx) : x.o.l;
    d.react = { txt: res.r || '', eff: res.e || [] };
    d.log.push({ a: lbl, r: res.r || '', eff: (res.e || []).map(function (c) { return c.t; }).join(', ') });
    if (res.img) d.img = res.img;
    if (res.next && def.nodes[res.next] && !res.end) { d.node = res.next; d.step++; }
    else { d.done = true; d.sum = res.sum || def.sum && (typeof def.sum === 'function' ? def.sum(st, d.ctx) : def.sum) || (d.log.length ? d.log[d.log.length - 1].r : ''); if (def.imp && def.imp !== 'normal' && !def.noChron) MX.chron(st, def.ic || '💬', def.title || 'Gespräch', (d.sum || '').slice(0, 220), def.imp === 'krise' || def.imp === 'highlight' ? 3 : 2, def.img); }
    return d;
  };
  MX.close = function (st) { var mx = st.mx; if (!mx) return; mx.dlg = null; while (mx.dq.length && !mx.dlg) { var nx = mx.dq.shift(); if (nx.resume) { mx.dlg = nx.resume; break; } if (tick(st) - nx.t0 <= 4) open(st, nx); } };
  MX.cancel = function (st) { var mx = st.mx; if (mx) { mx.dlg = null; } };
  MX.defaultPick = function (st) { var d = MX.active(st); if (!d) return 0; var def = MX.D[d.id](st, d.ctx), op = optsOf(st, def, d), df = op.filter(function (x) { return x.o.def; })[0]; return (df || op[0] || {}).i; };
  MX.autoRun = function (st, chooser) { var g = 0, d; while ((d = MX.active(st)) && !d.done && g++ < 14) { var def = MX.D[d.id](st, d.ctx), op = optsOf(st, def, d); if (!op.length) { d.done = true; break; } var i = chooser ? chooser(op.map(function (x) { return { i: x.i, l: typeof x.o.l === 'function' ? x.o.l(st, d.ctx) : x.o.l }; }), st, d) : MX.defaultPick(st); if (MX.pick(st, i) === null) MX.pick(st, op[0].i); } return d; };
  MX.pending = function (st) { var d = MX.active(st); return !!(d && !d.done); };

  // ---------- Bildzustände (zustandsabhängige Szenen, SVG-Platzhalter + optionale Bilddatei) ----------
  MX.SCENES = {}; // in js/ui_mgr.js befüllt (Farben/Emoji je Zustand)
  MX.img = function (scene, state) { scene = scene || 'buero'; state = state || 'a'; return { svg: 'mx_' + scene + '_' + state, scene: scene, state: state, src: MX.IMGDIR ? MX.IMGDIR + scene + '_' + state : null, alt: scene + ' ' + state }; };
  MX.IMGDIR = null; // Ordner für echte Ereignisbilder (z. B. 'img/mgr/'); null = SVG-Szenen

  // ---------- Vereinsgedächtnis ----------
  MX.seasonSnapshot = function (st) {
    var mx = st.mx, club = S.userClub(st); if (!club) return;
    var sq = W.squad(st, club.id), pos = st.week > 0 ? E.leaguePos(st, club) : null;
    var top = sq.slice().sort(function (a, b) { return (b.stats.goals || 0) - (a.stats.goals || 0); })[0];
    var snap = { s: st.season, club: club.name, cid: club.id, league: club.league, pos: pos, target: st.manager.boardTarget ? st.manager.boardTarget.text : '', fans: club.fans, cash: Math.round(club.cash), kab: MX.kabine(st).v, fanMood: MX.fanMood(st), media: Math.round(mx.media), trust: Math.round(st.manager.trust || 0), top: top ? { n: pname(top), g: top.stats.goals } : null, nat: (st.mnt && st.mnt.seasonCaps) || 0 };
    mx.hist.seasons.push(snap);
    sq.forEach(function (p) {
      var h = mx.hist.pl[p.id] = mx.hist.pl[p.id] || { n: pname(p), cid: club.id, apps: 0, goals: 0, seasons: 0, hg: !!p.homegrown, from: st.season, nt: 0, peak: 0 };
      h.n = pname(p); h.apps += p.stats.apps || 0; h.goals += p.stats.goals || 0; h.seasons++; h.peak = Math.max(h.peak, p.ovr); h.last = st.season;
      if (st.mnt && st.mnt.pl && st.mnt.pl[p.id]) h.nt = st.mnt.pl[p.id].caps || 0;
    });
    var rec = mx.hist.records; if (pos && (!rec.bestPos || pos < rec.bestPos.v || (club.league < rec.bestPos.l))) rec.bestPos = { v: pos, s: st.season, l: club.league };
    if (top && (!rec.goals || top.stats.goals > rec.goals.v)) rec.goals = { v: top.stats.goals, n: pname(top), s: st.season };
    if (!rec.fans || club.fans > rec.fans.v) rec.fans = { v: club.fans, s: st.season };
  };
  MX.legends = function (st) {
    var hp = st.mx.hist.pl; return Object.keys(hp).map(function (k) { var h = hp[k]; h.id = k; return h; }).filter(function (h) { return h.apps >= (HB ? 90 : 100) || h.goals >= (HB ? 250 : 40) || (h.hg && h.nt >= 5) || h.seasons >= 8; }).sort(function (a, b) { return b.apps + b.goals * 2 - a.apps - a.goals * 2; });
  };

  // ---------- Fans ----------
  MX.FW = { casual: 0.24, family: 0.16, clubs: 0.16, active: 0.12, ultras: 0.1, long: 0.14, away: 0.08 };
  MX.fanMood = function (st) { var f = st.mx && st.mx.fans; if (!f) return 50; var s = 0; Object.keys(MX.FW).forEach(function (k) { s += (f[k] || 50) * MX.FW[k]; }); return Math.round(s); };
  MX.fanWeek = function (st, res) { // res: { w, d, l } eigener Spiele dieser Woche
    var mx = st.mx, f = mx.fans, id = MX.ident(st, S.userClub(st)) || {}, exp = (id.expect || 50) / 50;
    function add(g, v) { f[g] = clamp(f[g] + v, 0, 100); }
    if (res.w) { add('casual', 1.6 * res.w); add('clubs', 1.1 * res.w); add('family', 0.8 * res.w); add('away', 1.0 * res.w); add('active', 0.6 * res.w); add('ultras', 0.5 * res.w); add('long', 0.5 * res.w); }
    if (res.l) { add('casual', -1.8 * res.l * exp); add('clubs', -1.0 * res.l * exp); add('family', -0.5 * res.l); add('away', -1.1 * res.l); add('active', -0.9 * res.l * exp); add('ultras', -1.0 * res.l * exp); add('long', -0.4 * res.l); }
    Object.keys(f).forEach(function (g) { f[g] = f[g] + (56 - f[g]) * 0.03; }); // langsame Rückkehr zum Normalzustand
    var club = S.userClub(st), m = MX.fanMood(st); if (club && club.fans) club.fans = Math.max(500, Math.round(club.fans * (1 + (m - 55) / 26000))); // Fanstimmung wirkt auf die Anhängerschaft
  };

  // ---------- Sponsorziele (mit den Vereinsfinanzen verbunden, jede Prämie genau einmal) ----------
  MX.SGOALS = {
    media: { n: 'Mediale Präsenz', d: 'Öffentliches Ansehen am Saisonende mindestens 60', ok: function (st) { return st.mx.media >= 60; } },
    intl: { n: 'Internationale Spiele', d: 'Teilnahme an einem Europapokal', ok: function (st) { var c = S.userClub(st); return !!(st.euroQual && st.euroQual[c.id]) || !!(c && c.euroThis); } },
    events: { n: 'Werbeveranstaltungen', d: 'Mindestens zwei Sponsorentermine wahrnehmen', ok: function (st) { return (st.mx.spons.events || 0) >= 2; } },
    youth: { n: 'Nachwuchsprojekt', d: 'Mindestens zwei Eigengewächse mit Profieinsätzen', ok: function (st) { return MX.squad(st).filter(function (p) { return p.homegrown && p.stats.apps >= 3; }).length >= 2; } },
    arena: { n: (HB ? 'Hallen' : 'Stadion') + 'präsenz', d: 'Fanstimmung am Saisonende mindestens 60', ok: function (st) { return MX.fanMood(st) >= 60; } },
    region: { n: 'Regionale Veranstaltungen', d: 'Einen Regionaltermin wahrnehmen', ok: function (st) { return (st.mx.spons.region || 0) >= 1; } }
  };
  MX.mainSponsor = function (st) { var c = S.userClub(st); if (!c || !c.sponsors || !c.sponsors.length) return null; return c.sponsors.slice().sort(function (a, b) { return (b.amount || 0) - (a.amount || 0); })[0]; };
  MX.sponsorGoals = function (st) {
    var mx = st.mx, sp = MX.mainSponsor(st); mx.spons.goals = []; mx.spons.events = 0; mx.spons.region = 0; if (!sp) return;
    var ks = Object.keys(MX.SGOALS), a = ks[hash('sg' + st.season + sp.name) % ks.length], b = ks[(hash('sg2' + st.season + sp.name) % (ks.length - 1) + ks.indexOf(a) + 1) % ks.length];
    [a, b].forEach(function (k) { mx.spons.goals.push({ k: k, bonus: R.round((sp.amount || 100000) * 0.06, D.MONEY ? 100 : 1000), s: st.season, done: null, sponsor: sp.name }); });
  };
  MX.sponsorSettle = function (st) { // Saisonende: Bonus genau einmal buchen
    var mx = st.mx, club = S.userClub(st), res = []; if (!club) return res;
    mx.spons.goals.forEach(function (g) {
      if (g.done !== null) return; var ok = !!MX.SGOALS[g.k].ok(st); g.done = ok; var key = 'sg' + g.s + g.k;
      if (ok && !mx.spons.paid[key]) { mx.spons.paid[key] = g.bonus; club.cash += g.bonus; E.book(club, 'Sponsoring', g.bonus); mx.spons.v = clamp(mx.spons.v + 6, 0, 100); res.push(g); MX.chron(st, '🤝', 'Sponsorziel erreicht', MX.SGOALS[g.k].n + ': Bonus ' + money(g.bonus) + ' von ' + g.sponsor + '.', 1); }
      else if (!ok) mx.spons.v = clamp(mx.spons.v - 5, 0, 100);
    });
    return res;
  };

  // ---------- Privatleben des Managers (Daten & Beziehung) ----------
  var PJOBS = ['Ärztin/Arzt', 'Architektin/Architekt', 'Lehrerin/Lehrer', 'Journalistin/Journalist (nicht Sport)', 'Physiotherapeutin/Physiotherapeut', 'Unternehmerin/Unternehmer', 'Grafikdesignerin/Grafikdesigner', 'Juristin/Jurist', 'Köchin/Koch', 'Musikerin/Musiker'];
  MX.LSTAGE = ['Kennenlernen', 'Dating', 'Feste Beziehung', 'Zusammengezogen', 'Verlobt', 'Verheiratet'];
  var PINTR = ['Kochen', 'Wandern', 'Musik', 'Kunst', 'Reisen', 'Lesen', 'Tanzen', 'Yoga', 'Filme', 'Laufen'];
  MX.CSRC = { insta: '📸 Instagram', app: '💘 Dating-App', out: '🍸 Beim Ausgehen', away: '🧳 Auswärtsfahrt', zufall: '🍀 Zufall', gala: '🥂 Gala', cafe: '☕ Café', freunde: '🍝 Freunde', charity: '🏃 Charity' };
  // Bekanntschaften (Dating): überwiegend Frauen – der Manager ist ein Mann (wie im Spielermodus, ca. 90 %)
  var CFEM = ['Sabine', 'Claudia', 'Petra', 'Anja', 'Katrin', 'Julia', 'Nicole', 'Sandra', 'Miriam', 'Lena', 'Aylin', 'Ines', 'Carla', 'Vera', 'Sophie', 'Hannah', 'Clara', 'Nora', 'Paula', 'Emma', 'Marie', 'Lara', 'Elif', 'Selin', 'Jana', 'Laura', 'Svenja', 'Melanie', 'Franziska', 'Kim'];
  MX.CFEM = CFEM;
  var CMAL = ['Jan', 'Tobias', 'Nils', 'Jonas', 'Luca', 'Henrik'];
  MX.candName = function (st, s) { var fem = hr(s, 7) < 0.9, n, g = 0, used = (st.mx && st.mx.usedNames) || {};
    do { n = pk(fem ? CFEM : CMAL, s + 'cf' + g) + ' ' + pk(LAST, s + 'cl' + g); g++; } while (used[n] && g < 40); if (st.mx) { st.mx.usedNames = used; used[n] = 1; } return n; };
  MX.newCand = function (st, where) {
    var s = 'cand' + tick(st) + where + (st.seed || 0) + (st.mx && st.mx.life ? st.mx.life.uid || 0 : 0), i1 = hash(s + 'i') % PINTR.length, i2 = (i1 + 1 + hash(s + 'k') % (PINTR.length - 1)) % PINTR.length;
    return { id: 'mc' + tick(st) + '_' + (hash(s) % 100000), name: MX.candName(st, s), job: pk(PJOBS, s + 'j'), where: where, met: tick(st), v: 45 + Math.round(hr(s, 1) * 20), humor: Math.round(hr(s, 2) * 10), football: Math.round(hr(s, 3) * 10), intr: [PINTR[i1], PINTR[i2]], stage: 0, dates: 0 };
  };
  // Kontaktliste wie im Spielermodus: bis zu vier Bekanntschaften; zuerst fallen lose Kontakte, nie heimliche Beziehungen
  MX.addCand = function (st, c) {
    var lf = st.mx.life; lf.uid = (lf.uid || 0) + 1; if (!c.id) c.id = 'mc' + tick(st) + '_' + lf.uid;
    lf.cands = (lf.cands || []).filter(function (y) { return y.id !== c.id; }); lf.cands.push(c);
    while (lf.cands.length > 4) { var dr = lf.cands.filter(function (y) { return !y.aff && y !== c; }).sort(function (a, b) { return (a.stage || 0) - (b.stage || 0) || a.v - b.v; })[0]; if (!dr) break; lf.cands.splice(lf.cands.indexOf(dr), 1); }
    return c;
  };
  MX.cand = function (st, id) { var lf = st.mx.life; return (lf.cands || []).filter(function (y) { return y.id === id; })[0] || null; };
  MX.affs = function (st) { return (st.mx.life.cands || []).filter(function (y) { return y.aff; }); };
  MX.makePartner = function (st, c) {
    var lf = st.mx.life;
    if (lf.partner && lf.partner !== c) { // schon vergeben → heimliche Beziehung
      if (!c.aff) { c.aff = true; c.stage = Math.max(c.stage || 0, 1); c.since = tick(st); c.lastD = tick(st); c.v = Math.max(c.v, 60); if (!MX.cand(st, c.id)) MX.addCand(st, c); MX.chron(st, '🤫', 'Heimliche Beziehung', 'Du triffst dich heimlich mit ' + c.name + ' – obwohl du mit ' + lf.partner.name + ' zusammen bist.', 1); lf.stress = clamp(lf.stress + 3, 0, 100); }
      return c;
    }
    c.aff = false; c.stage = 1; c.v = Math.max(c.v, 55); c.since = tick(st); lf.partner = c; lf.status = 'dating';
    lf.cands = (lf.cands || []).filter(function (y) { return y.id !== c.id && (y.stage || 0) >= 1; }); // flüchtige Kontakte verblassen, wer schon datet, bleibt
    MX.chron(st, '💞', 'Erstes Date', 'Mit ' + c.name + ' (' + c.job + ').', 1);
  };
  // Heimliche Beziehung offiziell machen: die bisherige Partnerschaft endet
  MX.affOfficial = function (st, id) { var lf = st.mx.life, c = MX.cand(st, id); if (!c) return null; if (lf.partner) MX.breakup(st, 'Du hast dich für ' + c.name + ' entschieden.'); c.aff = false; MX.makePartner(st, c); return c; };
  MX.candEnd = function (st, id, why) { var lf = st.mx.life, c = MX.cand(st, id); if (!c) return; lf.cands = lf.cands.filter(function (y) { return y.id !== id; }); if (c.aff) { MX.chron(st, '🚪', 'Heimliche Beziehung beendet', why || 'Du hast die Sache mit ' + c.name + ' beendet.', 1); lf.stress = clamp(lf.stress + 2, 0, 100); } };
  MX.affRisk = function (st) { var lf = st.mx.life, n = MX.affs(st).length; if (!n || !lf.partner) return 0; return clamp(0.035 * n + (n >= 2 ? 0.03 : 0) + ((st.manager.reputation || 40) / 2500) + (lf.partner.stage >= 3 ? 0.02 : 0) + (lf.suspect > tick(st) ? 0.05 : 0), 0, 0.4); };
  MX.breakup = function (st, why) { var lf = st.mx.life; if (!lf.partner) return; lf.exes.push({ name: lf.partner.name, s: st.season, why: why }); MX.chron(st, '💔', 'Trennung', lf.partner.name + ': ' + why, 2); lf.partner = null; lf.status = 'single'; lf.stress = clamp(lf.stress + 10, 0, 100); (lf.cands || []).forEach(function (y) { if (y.aff) { y.aff = false; y.stage = Math.max(1, y.stage || 0); } }); };
  MX.lifeWeek = function (st) {
    var lf = st.mx.life, pt = lf.partner, crisis = st.mx.arcs.some(function (a) { return a.k === 'crisis' && a.ph >= 2; });
    lf.stress = clamp(lf.stress + (crisis ? 1.2 : -0.6) + (st.mx.dlg ? 0.2 : 0), 5, 100);
    if (pt) { pt.v = clamp(pt.v - (lf.stress > 70 ? 0.8 : 0.25) + (tick(st) - lf.lastDate <= 2 ? 0.4 : 0) - MX.affs(st).length * 0.3, 0, 100); if (pt.v < 12 && pt.stage < 5) MX.breakup(st, 'Zu wenig gemeinsame Zeit.'); }
    // Kontakte: lose Bekanntschaften verblassen, heimliche Beziehungen wollen gepflegt werden und belasten
    var t = tick(st);
    (lf.cands || []).slice().forEach(function (y) {
      if (y.aff) { y.v = clamp(y.v - (t - (y.lastD || t) > 3 ? 2.5 : 0.8), 0, 100); lf.stress = clamp(lf.stress + 0.8, 0, 100); if (y.v < 35) MX.candEnd(st, y.id, y.name + ' hat genug vom Versteckspiel und meldet sich nicht mehr.'); }
      else { y.v = clamp(y.v - ((y.stage || 0) ? 0.4 : 1), 0, 100); if (y.v < 30 || (!(y.stage || 0) && t - (y.met || t) > 14)) lf.cands.splice(lf.cands.indexOf(y), 1); }
    });
    // Entdeckungsrisiko heimlicher Beziehungen
    if (pt && MX.affs(st).length && !st.mx.dlg && hr('aff' + t + (st.seed || 0), 7) < MX.affRisk(st)) { var ax = MX.affs(st)[0], press = hr('affp' + t, 3) < 0.35 + (st.manager.reputation || 40) / 250; MX.start(st, 'life_aff_caught', { cid: ax.id, press: press ? 1 : 0 }, { prio: 7 }); }
    // Geheimes Dating-Profil: Partnerin/Partner kann es finden
    if (pt && lf.partner && MX.appRisk && !st.mx.dlg && hr('appf' + t + (st.seed || 0), 8) < MX.appRisk(st)) { var rp = (st.manager.reputation || 40), hw = hr('appfh' + t, 9), how = hw < Math.min(0.25, rp / 300) ? 'press' : hw < 0.45 ? 'fan' : hw < 0.7 ? 'phone' : hw < 0.88 ? 'friend' : 'notif'; MX.start(st, 'life_app_found', { how: how }, { prio: 7 }); }
    // Stress wirkt: ein angespannter Manager strahlt weniger Ruhe aus (kleiner Einfluss auf die Kabine)
    if (lf.stress > 80) st.mx.kabMod = clamp(st.mx.kabMod - 0.3, -15, 15);
  };

  // ---------- Saisonwechsel & Woche (Grundlagen; Geschichten in js/mgr_events.js) ----------
  MX.decay = function (st) { var mx = st.mx; mx.kabMod *= 0.85; if (Math.abs(mx.kabMod) < 0.2) mx.kabMod = 0; mx.media = mx.media + (50 - mx.media) * 0.02; };
  MX.cool = function (st, k, weeks) { var mx = st.mx, c = mx.cd[k]; return c == null || tick(st) - c >= (weeks || 0); };
  MX.setCool = function (st, k) { st.mx.cd[k] = tick(st); };

  MX.PERSON_IC = { pres: '🎩', ceo: '💼', sd: '📋', ar: '🏛️', inv: '💰', fanClubs: '🧣', ultras: '📣', fanProj: '🤲' };
})(RFM);
