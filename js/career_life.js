// Spielerkarriere 3.0 (gemeinsam für ANPFIFF und ANWURF): zentrales Dialogsystem mit Gesprächsgedächtnis,
// Privatleben (Partnerschaft, Familie, Freunde, Wohlbefinden), Fans und Fangruppen, Journalisten, Vereinsgelände
// (nutzt die vorhandenen Einrichtungen aus D.facilities), Ereignisbilder (Manifest) und 10 Karrierephasen.
// Baut auf R.cx (career_core.js) auf. Alte Spielstände werden in L.ensure versioniert ergänzt (cx.v 1 → 3).
(function (R) {
  var D = R.data, W = R.world, S = R.season, C = R.pc, X = R.cx, E = R.econ;
  if (!X) return;
  var L = R.life = {};
  var HB = X.HB, clamp = X.clamp;
  function tick(st) { return st.tick || 0; }
  function money(v) { return R.fmtMoney(Math.round(v)); }
  function pick(a) { return a[Math.floor(R.rand() * a.length)]; }
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'karriere'); }
  L.money = money;

  // ---------- Namen (fiktiv) ----------
  var FN_A = ['Lena', 'Mia', 'Sophie', 'Clara', 'Elif', 'Hannah', 'Lea', 'Nora', 'Paula', 'Ida', 'Emma', 'Jana', 'Selin', 'Marie', 'Lara', 'Zoe', 'Amira', 'Frieda'];
  var FN_B = ['Jonas', 'Felix', 'Noah', 'Lukas', 'Emil', 'Ben', 'Paul', 'Mats', 'Leon', 'Can', 'Tim', 'Moritz', 'Jannik', 'David', 'Niklas', 'Theo', 'Malik', 'Ole'];
  var LN = ['Albers', 'Brandt', 'Demir', 'Engel', 'Fuchs', 'Graf', 'Hahn', 'Jansen', 'Kaya', 'Lorenz', 'Möller', 'Novak', 'Ott', 'Peters', 'Roth', 'Schulte', 'Thiel', 'Vogt', 'Winter', 'Yilmaz', 'Ziegler', 'Berger', 'Krüger', 'Sommer'];
  L.name = function (g) { return pick(g === 'a' ? FN_A : g === 'b' ? FN_B : (R.rand() < 0.5 ? FN_A : FN_B)) + ' ' + pick(LN); };
  L.first = function (g) { return pick(g === 'a' ? FN_A : FN_B); };
  var JOBS = [['Lehrerin/Lehrer', 'Schule'], ['Ärztin/Arzt', 'Klinik'], ['Architektin/Architekt', 'Büro'], ['Pflegekraft', 'Klinik'], ['Softwareentwicklung', 'Tech'], ['Journalismus', 'Medien'], ['Studium', 'Uni'], ['Eigenes Café', 'Selbstständig'], ['Physiotherapie', 'Praxis'], ['Unternehmensberatung', 'Büro'], ['Polizei', 'Behörde'], ['Mode & Design', 'Kreativ']];
  var INTR = ['Reisen', 'Kochen', 'Musik', 'Wandern', 'Kunst', 'Lesen', 'Yoga', 'Filme', 'Tiere', 'Fotografie', 'Tanzen', 'Gärtnern'];
  var OUTLETS = { sach: ['Sportblick', 'Die Rundschau'], krit: ['Tagesspiegel Nord', 'Kick & Kritik'], boul: ['Abendpost Express', 'Promi-Echo'], nah: ['Vereinsecho', 'Stadionradio'] };
  L.JTYPES = { sach: 'Sachlicher Sportjournalist', krit: 'Kritische Reporterin/Reporter', boul: 'Boulevardjournalismus', nah: 'Vereinsnahes Medium' };
  L.FANS = { fam: 'Familienfans', gel: 'Gelegenheitsfans', club: 'Organisierte Fanclubs', aktiv: 'Aktive Fanszene', ultras: 'Ultras', away: 'Auswärtsfahrer', krit: 'Kritische Fangruppe' };
  L.STAGES = ['Single', 'Kennenlernen', 'Erste Dates', 'Feste Partnerschaft', 'Zusammengezogen', 'Verlobt', 'Verheiratet'];
  L.FRK = { jugend: 'Aus der Jugend', heimat: 'Aus der Heimat', team: 'Mannschaftskamerad', aussen: 'Außerhalb des Sports', neu: 'Neue Bekanntschaft' };

  // ---------- Versionierte Migration ----------
  L.ensure = function (st) {
    var cx = X.ensure(st); if (!cx) return null;
    if ((cx.v || 1) < 3 || !cx.life) {
      cx.per.risk = cx.per.risk != null ? cx.per.risk : 50; cx.per.resil = cx.per.resil != null ? cx.per.resil : 50;
      cx.per.loyal = cx.per.loyal != null ? cx.per.loyal : 55; cx.per.sat = cx.per.sat != null ? cx.per.sat : 60;
      cx.mem.prom = cx.mem.prom || []; cx.mem.dlg = cx.mem.dlg || {};
      var pr = cx.prof || {}, home = pr.home || 'der Heimat';
      cx.life = {
        partner: null, cands: [], exes: [], kids: [], uid: 1, well: 60, ap: 3, apWeek: -1, goalsL: ['family', 'health'],
        fam: [{ id: 'f1', rel: 'Mutter', name: L.first('a') + ' ' + (C.player(st) ? C.player(st).last : ''), v: 75 }, { id: 'f2', rel: 'Vater', name: L.first('b') + ' ' + (C.player(st) ? C.player(st).last : ''), v: 68 }, { id: 'f3', rel: R.rand() < 0.5 ? 'Schwester' : 'Bruder', name: '', v: 64 }],
        friends: [], jrn: [], fans: { fam: 55, gel: 50, club: 52, aktiv: 50, ultras: 45, away: 45, krit: 40 },
        train: {}, med: { dx: 0, second: 0 }, visits: {}, events: []
      };
      var sib = cx.life.fam[2]; sib.name = (sib.rel === 'Schwester' ? L.first('a') : L.first('b')) + ' ' + (C.player(st) ? C.player(st).last : '');
      cx.life.friends.push({ id: 'fr' + (cx.life.uid++), name: L.name(), kind: 'heimat', v: 70, since: st.season, last: tick(st), note: 'Seit der Grundschule befreundet, wohnt noch in ' + home + '.' });
      if (C.player(st) && C.player(st).age <= 19) cx.life.friends.push({ id: 'fr' + (cx.life.uid++), name: L.name('b'), kind: 'jugend', v: 62, since: st.season, last: tick(st), note: 'Ihr habt zusammen in der Jugend gespielt.' });
      ['sach', 'krit', 'boul', 'nah'].forEach(function (t) { cx.life.jrn.push({ id: 'j_' + t, type: t, name: L.name(), outlet: pick(OUTLETS[t]), v: t === 'nah' ? 60 : t === 'krit' ? 42 : 50, quotes: [] }); });
      cx.phase = L.computePhase(st);
      cx.v = 3;
    }
    return cx;
  };
  L.life = function (st) { var cx = L.ensure(st); return cx ? cx.life : null; };

  // ---------- 10 Karrierephasen ----------
  X.PHASES = ['Jugendspieler', 'Nachwuchstalent', 'Leistungszentrum / Akademie', 'Übergang zu den Profis', 'Jungprofi', 'Etablierter Profi', 'Spitzenspieler', 'Erfahrener Profi', 'Karriereausklang', 'Karriereende & Anschluss'];
  X.PHASE_TXT = ['Erste Vereinserfahrungen – Schule, Training, Jugendliga.', 'Auswahlmannschaften und Sichtungen: Die ersten Augen sind auf dich gerichtet.', 'Internat, Leistungsdiagnostik, tägliches Training – der Weg wird ernst.', 'Der Sprung in den Erwachsenenbereich steht an.', 'Kampf um Einsatzzeiten bei den Profis.',
    'Stammplatz – und erste große Karriereentscheidungen.', 'Titel, Nationalmannschaft, internationale Bühne.', 'Erfahrung zählt – Leistung, Verletzungen und Vertragsfragen.', 'Die letzten Verträge, der Abschied, vielleicht eine Trainerkarriere.', 'Die aktive Zeit ist vorbei – was kommt danach?'];
  var basePhase = X.computePhase;
  L.computePhase = function (st) {
    var pc = st.pc; if (pc.retired) return 9;
    var p = C.player(st); if (!p) return 0;
    var o = basePhase(st); // alte Skala 0–7
    if (o <= 1 && p.youth) {
      var c = C.club(st), jl = c && c.fac ? (c.fac.jugend || 0) : 0;
      if (o === 1 && (jl >= 3 || X.mem(st, 'academy')) && p.age >= 15) return 2;
      return o;
    }
    return o + 1;
  };
  X.computePhase = L.computePhase;

  // ---------- Wirkungen inkl. neuer Werte ----------
  var LBL = { risk: 'Risikobereitschaft', resil: 'Stressresistenz', loyal: 'Loyalität', sat: 'Zufriedenheit', well: 'Wohlbefinden', partner: 'Partnerschaft', friend: 'Freundschaft', value: 'Marktwert', sponsor: 'Sponsoreninteresse', ap: 'Termine' };
  Object.keys(L.FANS).forEach(function (k) { LBL['f_' + k] = L.FANS[k]; });
  L.eff = function (st, o, ref) {
    var cx = L.ensure(st), lf = cx.life, rest = {}, out = [];
    Object.keys(o || {}).forEach(function (k) {
      var v = o[k]; if (!v) return;
      if (k === 'well') lf.well = clamp(lf.well + v, 0, 100);
      else if (k === 'partner') { if (!lf.partner) return; lf.partner.v = clamp(lf.partner.v + v, 0, 100); }
      else if (k === 'friend') { var fr = ref && ref.friend ? L.friend(st, ref.friend) : lf.friends[0]; if (!fr) return; fr.v = clamp(fr.v + v, 0, 100); fr.last = tick(st); }
      else if (k === 'fam') { lf.fam.forEach(function (f) { f.v = clamp(f.v + v, 0, 100); }); rest.family = (rest.family || 0) + v; return; }
      else if (k.indexOf('f_') === 0 && lf.fans[k.slice(2)] != null) { lf.fans[k.slice(2)] = clamp(lf.fans[k.slice(2)] + v, 0, 100); }
      else if (k.indexOf('j_') === 0) { var j = L.jrn(st, k); if (!j) return; j.v = clamp(j.v + v, 0, 100); out.push(j.name + ' ' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v))); return; }
      else if (k === 'value') { var p = C.player(st); if (!p) return; p.value = Math.max(0, Math.round(p.value * (1 + v / 100))); }
      else if (k === 'sponsor') { lf.spInt = clamp((lf.spInt || 40) + v, 0, 100); }
      else if (k === 'ap') { lf.ap = Math.max(0, lf.ap + v); }
      else if (k === 'risk' || k === 'resil' || k === 'loyal' || k === 'sat') { cx.per[k] = clamp((cx.per[k] != null ? cx.per[k] : 50) + v, 0, 100); }
      else { rest[k] = v; return; }
      if (LBL[k]) out.push(LBL[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)) + (k === 'value' ? ' %' : ''));
    });
    var t = X.eff(st, rest); if (t) out.unshift(t);
    return out.join(', ');
  };
  // Effekte als Liste für die sichtbare Reaktion (Chips: +/−)
  L.effList = function (txt) { return (txt || '').split(', ').filter(Boolean).map(function (s) { return { t: s, pos: /\+/.test(s) && !/Stress \+/.test(s), neg: /−/.test(s) || /Stress \+/.test(s) }; }); };

  // ---------- Gesprächsgedächtnis (Aussagen, Versprechen) ----------
  L.remember = function (st, k, txt, who) { var cx = L.ensure(st); cx.mem.prom.unshift({ k: k, txt: txt, who: who || '', s: st.season, w: st.week, t: tick(st) }); if (cx.mem.prom.length > 80) cx.mem.prom.length = 80; X.mem(st, 'said_' + k, 1); };
  L.said = function (st, k, maxAge) { var cx = L.ensure(st), t = tick(st); return cx.mem.prom.filter(function (x) { return x.k === k && (!maxAge || t - x.t <= maxAge); })[0] || null; };
  L.promises = function (st) { return L.ensure(st).mem.prom.slice(); };

  // ---------- Ereignisbilder (Manifest) ----------
  // imageId, imageCategory, imagePath (ohne Endung, Formate in fmt), imageAlt, imageVariant, imageFallback, imagePrompt, sport (fb/hb/beide)
  L.IMG = [
    { imageId: 'ev_contract_signing', imageCategory: 'karriere', imagePath: 'img/events/ev_contract_signing_01', fmt: ['avif', 'jpg'], imageAlt: 'Vertragsgespräch: Spieler und Verhandlungspartner prüfen Unterlagen', imageVariant: 1, imageFallback: 'svg:vertrag', sport: 'beide', imagePrompt: 'Fotorealistisch: Profisportler und Vereinsvertreter am Holztisch, Vertragsunterlagen, Stadion durch das Fenster, warmes Licht, keine Logos' },
    { imageId: 'ev_locker_down', imageCategory: 'sport', imagePath: 'img/events/ev_locker_down_01', fmt: ['avif', 'jpg'], imageAlt: 'Enttäuschter Spieler allein in der Kabine', imageVariant: 1, imageFallback: 'svg:kabine', sport: 'beide', imagePrompt: 'Fotorealistisch: Spieler sitzt mit gesenktem Kopf auf der Kabinenbank, Handtuch über der Schulter, kühles Licht, keine Logos' },
    { imageId: 'ev_stadium_night', imageCategory: 'sport', imagePath: 'img/events/ev_stadium_night_01', fmt: ['avif', 'jpg'], imageAlt: 'Volles Stadion unter Flutlicht', imageVariant: 1, imageFallback: 'svg:stadion', sport: 'fb', imagePrompt: 'Fotorealistisch: volles Fußballstadion bei Nacht, Flutlicht, Fahnen im Vordergrund, keine Vereinslogos' },
    { imageId: 'ev_first_date', imageCategory: 'privat', imagePath: 'img/events/ev_first_date_01', fmt: ['avif', 'jpg'], imageAlt: 'Zwei Menschen beim gemeinsamen Abendessen bei Kerzenlicht', imageVariant: 1, imageFallback: 'svg:date', sport: 'beide', imagePrompt: 'Fotorealistisch: gemütliches Abendessen zu zweit, Lichterkette, Kerzen, warme Farben' },
    { imageId: 'ev_academy_training', imageCategory: 'verein', imagePath: 'img/events/ev_academy_training_01', fmt: ['avif', 'jpg'], imageAlt: 'Nachwuchsspieler beim Training im Leistungszentrum', imageVariant: 1, imageFallback: 'svg:training', sport: 'fb', imagePrompt: 'Fotorealistisch: Nachwuchsspieler mit Ball auf dem Trainingsplatz eines Leistungszentrums, Trainer im Hintergrund, keine Logos' },
    { imageId: 'ev_fanclub_meeting', imageCategory: 'oeffentlichkeit', imagePath: 'img/events/ev_fanclub_meeting_01', fmt: ['webp', 'jpg'], imageAlt: 'Direktes Gespräch mit Fanclub und aktiver Fanszene', imageVariant: 1, imageFallback: 'svg:fans', sport: 'beide', imagePrompt: 'Fotorealistisch: Spieler im Gespräch mit Fans in einer Fankneipe, Schals, Fahnen' },
    { imageId: 'ev_press_conference', imageCategory: 'oeffentlichkeit', imagePath: 'img/events/ev_press_conference_01', fmt: ['webp', 'jpg'], imageAlt: 'Kritisches Presseinterview nach dem Spiel', imageVariant: 1, imageFallback: 'svg:presse', sport: 'beide', imagePrompt: 'Fotorealistisch: Spieler auf dem Podium, Journalisten stellen kritische Fragen, Mikrofone' }
  ];
  // Szenen → Bild-IDs (mehrere Varianten möglich; Zustand opening/response/closing wählt bei Bedarf ein anderes Motiv)
  L.SCENES = {
    trainer: { fb: ['ev_academy_training'], hb: [], svg: 'trainer' }, berater: { all: ['ev_contract_signing'], svg: 'vertrag' }, vertrag: { all: ['ev_contract_signing'], svg: 'vertrag' },
    presse: { all: ['ev_press_conference'], svg: 'presse' }, fans: { all: ['ev_fanclub_meeting'], svg: 'fans' }, ultras: { all: ['ev_fanclub_meeting'], svg: 'fans' },
    date: { all: ['ev_first_date'], svg: 'date' }, partner: { all: ['ev_first_date'], svg: 'date' }, familie: { all: [], svg: 'familie' }, freunde: { all: [], svg: 'freunde' },
    kabine: { all: ['ev_locker_down'], svg: 'kabine' }, niederlage: { all: ['ev_locker_down'], svg: 'kabine' }, stadion: { fb: ['ev_stadium_night'], hb: [], svg: 'stadion' },
    jugend: { fb: ['ev_academy_training'], hb: [], svg: 'training' }, training: { fb: ['ev_academy_training'], hb: [], svg: 'training' }, medizin: { all: [], svg: 'medizin' },
    vorstand: { all: ['ev_contract_signing'], svg: 'buero' }, finanzen: { all: [], svg: 'finanzen' }, feier: { all: [], svg: 'feier' }, verletzung: { all: ['ev_locker_down'], svg: 'medizin' }
  };
  L.imgById = function (id) { return L.IMG.filter(function (x) { return x.imageId === id; })[0] || null; };
  // Bild für eine Szene: echte Assets, sonst SVG-Szenenbild. state wählt (falls vorhanden) eine Variante.
  L.sceneImg = function (scene, state) {
    var sc = L.SCENES[scene] || { all: [], svg: scene || 'buero' }, list = (sc.all || []).concat(sc[HB ? 'hb' : 'fb'] || []);
    var ids = list.filter(function (id) { var im = L.imgById(id); return im && (im.sport === 'beide' || im.sport === (HB ? 'hb' : 'fb')); });
    if (!ids.length) return { svg: sc.svg || 'buero', alt: scene };
    var i = state === 'closing' ? ids.length - 1 : state === 'response' ? Math.min(1, ids.length - 1) : 0, im = L.imgById(ids[i]);
    return { src: im.imagePath, fmt: im.fmt, alt: im.imageAlt, id: im.imageId, fallback: im.imageFallback };
  };

  // ---------- Zentrales Dialogsystem ----------
  // Dialog: { id, cat, scene, who(c,d,s) → {n, role, ic}, max, init(st,c,d,s), nodes: { key: { say(c,d,s), opts(c,d,s) | [ {l, hint, req(c,d,s), fx(st,c,d,s) → {r, e, next, mem, mood, end}} ] } }, sum(st,c,d,s) }
  L.DLG = {};
  L.addDlg = function (list) { list.forEach(function (d) { L.DLG[d.id] = d; }); };
  function ctx(st) { var c = X.ctx(st); c.life = L.life(st); return c; }
  L.ctx = ctx;
  L.active = function (st) { var cx = L.ensure(st); return cx && cx.dlg ? cx.dlg : null; };
  L.start = function (st, id, data) {
    var cx = L.ensure(st), d = L.DLG[id]; if (!cx || !d) return null;
    if (cx.dlg && !cx.dlg.done) { cx.dlgQ = cx.dlgQ || []; if (cx.dlgQ.length < 3) cx.dlgQ.push({ id: id, data: data || {} }); return null; }
    var s = { id: id, node: 'start', data: data || {}, step: 1, log: [], mood: 0, v: {}, done: false, react: null, sum: null, t0: tick(st) };
    cx.dlg = s;
    try { if (d.init) d.init(st, ctx(st), s.data, s); } catch (er) { if (typeof console !== 'undefined') console.error(er); }
    cx.mem.dlg[id] = (cx.mem.dlg[id] || 0) + 1;
    return s;
  };
  function nodeOf(d, s) { return d.nodes[s.node] || d.nodes.start; }
  L.optsOf = function (st, s) {
    var d = L.DLG[s.id], n = nodeOf(d, s), c = ctx(st), list = typeof n.opts === 'function' ? n.opts(c, s.data, s) : n.opts || [];
    return list.map(function (o, i) { return { o: o, i: i }; }).filter(function (x) { try { return !x.o.req || x.o.req(c, s.data, s); } catch (er) { return false; } });
  };
  L.view = function (st) {
    var s = L.active(st); if (!s) return null;
    var d = L.DLG[s.id], c = ctx(st), who = d.who ? d.who(c, s.data, s) : { n: '?', role: '' }, n = nodeOf(d, s), say = '';
    if (!s.done) { try { say = typeof n.say === 'function' ? n.say(c, s.data, s) : n.say; } catch (er) { say = '…'; } }
    var opts = s.done ? [] : L.optsOf(st, s).map(function (x) { return { i: x.i, l: typeof x.o.l === 'function' ? x.o.l(c, s.data, s) : x.o.l, hint: x.o.hint || '' }; });
    var max = typeof d.max === 'function' ? d.max(c, s.data, s) : (d.max || 5);
    var scene = typeof d.scene === 'function' ? d.scene(c, s.data, s) : d.scene;
    return { id: s.id, cat: d.cat, who: who, img: L.sceneImg(scene, s.done ? 'closing' : s.react ? 'response' : 'opening'), say: say, opts: opts, react: s.react, step: Math.min(s.step, max), max: max, done: s.done, sum: s.sum, log: s.log, mood: s.mood, title: d.title ? (typeof d.title === 'function' ? d.title(c, s.data, s) : d.title) : '' };
  };
  L.pick = function (st, i) {
    var s = L.active(st); if (!s || s.done) return null;
    var d = L.DLG[s.id], n = nodeOf(d, s), c = ctx(st), list = typeof n.opts === 'function' ? n.opts(c, s.data, s) : n.opts || [], o = list[i]; if (!o) return null;
    var say = ''; try { say = typeof n.say === 'function' ? n.say(c, s.data, s) : n.say; } catch (er) { say = ''; }
    var res = {}; try { res = (o.fx ? o.fx(st, c, s.data, s) : {}) || {}; } catch (er) { if (typeof console !== 'undefined') console.error(er); res = { r: '…', end: true }; }
    var effTxt = res.e ? L.eff(st, res.e, res.ref || s.data) : '';
    if (res.mem) L.remember(st, res.mem.k, res.mem.txt, (d.who ? d.who(c, s.data, s).n : ''));
    if (res.mood) s.mood += res.mood;
    var label = typeof o.l === 'function' ? o.l(c, s.data, s) : o.l;
    s.log.push({ q: say, a: label, r: res.r || '', eff: effTxt });
    s.react = { txt: res.r || '', eff: L.effList(effTxt), raw: effTxt };
    var next = typeof res.next === 'function' ? res.next(c, s.data, s) : res.next;
    var max = typeof d.max === 'function' ? d.max(c, s.data, s) : (d.max || 5);
    if (!res.end && next && d.nodes[next] && s.step < max + 4) { s.node = next; s.step++; }
    else { s.done = true; try { s.sum = d.sum ? d.sum(st, ctx(st), s.data, s) : null; } catch (er) { s.sum = null; }
      var cx = L.ensure(st); if (d.chron !== false) X.chron(st, d.cat || 'medien', d.ic || '💬', (d.title ? (typeof d.title === 'function' ? d.title(c, s.data, s) : d.title) : 'Gespräch') + (who(d, c, s) ? ' mit ' + who(d, c, s) : ''), (s.sum || s.log.map(function (x) { return x.a; }).slice(-2).join(' · ')).slice(0, 220), d.imp || 2);
      var last = cx.chron[0]; if (last) last.img = typeof d.scene === 'function' ? d.scene(c, s.data, s) : d.scene; }
    return s.react;
  };
  function who(d, c, s) { try { return d.who ? d.who(c, s.data, s).n : ''; } catch (er) { return ''; } }
  L.close = function (st) { var cx = L.ensure(st); cx.dlg = null; if (cx.dlgQ && cx.dlgQ.length) { var q = cx.dlgQ.shift(); L.start(st, q.id, q.data); } };
  // Automatische Auflösung (Tests, Auto-Modus): wählt nach Strategie bis zum Ende
  L.autoRun = function (st, policy) {
    var guard = 0, s;
    while ((s = L.active(st)) && !s.done && guard++ < 30) { var op = L.optsOf(st, s); if (!op.length) { s.done = true; break; } L.pick(st, policy ? policy(op, s) : op[Math.floor(R.rand() * op.length)].i); }
    var r = L.active(st); L.close(st); return r;
  };

  // ---------- Hilfen für Personen ----------
  L.friend = function (st, id) { return L.life(st).friends.filter(function (f) { return f.id === id; })[0] || null; };
  L.jrn = function (st, id) { var k = String(id).replace(/^j_j_/, 'j_'); return L.life(st).jrn.filter(function (j) { return j.id === k || 'j_' + j.type === k; })[0] || null; };
  L.kidAge = function (st, k) { return Math.max(0, st.season - k.born); };
  L.apLeft = function (st) { var lf = L.life(st); L.refreshAp(st); return lf.ap; };
  L.refreshAp = function (st) { var lf = L.life(st), cx = st.pc.cx, wk = tick(st); if (lf.apWeek !== wk) { var a = cx.plan.a || {}; lf.ap = 2 + (a.private || 0) + (a.partner || 0) + (a.friends || 0) + (a.family || 0) + (a.fans || 0); lf.apWeek = wk; } };
  L.spend = function (st, n, cost) {
    var lf = L.life(st); L.refreshAp(st); n = n == null ? 1 : n;
    if (lf.ap < n) return { ok: false, why: 'Für diese Woche sind keine freien Termine mehr übrig. Mehr Zeit gibt es über Freizeit, Partnerschaft oder Freunde im Wochenplan.' };
    if (cost && R.pf && R.pf.liquid(st) < cost) return { ok: false, why: 'Dafür reicht das Geld nicht (' + money(cost) + ').' };
    lf.ap -= n; if (cost && R.pf) R.pf.book(st, -cost, 'Freizeit & Privatleben');
    return { ok: true };
  };
})(RFM);
