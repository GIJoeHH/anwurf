// Karriere-Engine (gemeinsam für ANPFIFF und ANWURF): Charakter, Persönlichkeit, Beziehungen, Karrierephasen,
// Wochenplanung, Ereignis-Engine mit Gedächtnis und Handlungsbögen, Karriere-Regisseur und Chronik.
// Baut auf R.pc (playercareer.js) auf und hängt sich über C.on-Hooks ein. Alte Spielstände werden in X.ensure ergänzt.
(function (R) {
  var D = R.data, W = R.world, S = R.season, C = R.pc, E = R.econ;
  var X = R.cx = {};
  var HB = X.HB = C.CFG.sport === 'Handball';
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'karriere'); }
  function tick(st) { return st.tick || 0; }
  X.clamp = clamp;

  // ---------- Sportart-Wortschatz ----------
  X.SW = HB ? { goal: 'Tor', goals: 'Tore', pen: 'Siebenmeter', venue: 'Halle', coach: 'Trainer', nat: 'Nationalmannschaft', boots: 'Handballschuhe', shot: 'Wurf', youthCup: 'Länderpokal der Landesauswahlen', sel: 'Landesauswahl', icon: '🤾' }
    : { goal: 'Tor', goals: 'Tore', pen: 'Elfmeter', venue: 'Stadion', coach: 'Trainer', nat: 'Nationalmannschaft', boots: 'Fußballschuhe', shot: 'Schuss', youthCup: 'Länderpokal der Landesverbände', sel: 'Verbandsauswahl', icon: '⚽' };

  // ---------- Charakter-Optionen (Assistent) ----------
  X.NATS = ['Deutschland', 'Österreich', 'Schweiz', 'Niederlande', 'Dänemark', 'Polen', 'Kroatien', 'Frankreich', 'Spanien', 'Schweden', 'Norwegen', 'Türkei'];
  X.BUILDS = { schmal: { n: 'Schmal & wendig', spd: 3, sta: 1, def: -2 }, athletisch: { n: 'Athletisch', spd: 1, sta: 2, def: 1 }, kraftvoll: { n: 'Kraftvoll', spd: -2, sta: 1, def: 3, sho: 1 } };
  X.STYLES = HB ? { werfer: { n: 'Wurfgewaltig', a: { sho: 3 } }, spielmacher: { n: 'Spielmacher', a: { pas: 3, tec: 1 } }, kaempfer: { n: 'Abwehrkämpfer', a: { def: 3, sta: 1 } }, tempo: { n: 'Tempospieler', a: { spd: 3 } } }
    : { knipser: { n: 'Knipser', a: { sho: 3 } }, spielmacher: { n: 'Spielmacher', a: { pas: 3, tec: 1 } }, kaempfer: { n: 'Zweikämpfer', a: { def: 3, sta: 1 } }, tempo: { n: 'Tempodribbler', a: { spd: 2, tec: 2 } } };
  X.GOALS = {
    top: { n: 'In der höchsten Liga spielen', ok: function (st, p, pc) { return !!pc.ms.top; } },
    nat: { n: 'Nationalspieler werden', ok: function (st, p, pc) { return pc.nat > 0; } },
    title: { n: 'Deutscher Meister werden', ok: function (st, p, pc) { return (pc.titles || []).some(function (t) { return /Meister/.test(t); }); } },
    legend: { n: 'Vereinslegende (200 Spiele für einen Verein)', ok: function (st, p, pc) { var m = {}; pc.seasons.forEach(function (s) { if (s.clubId && !s.youth) m[s.clubId] = (m[s.clubId] || 0) + s.apps; }); return Object.keys(m).some(function (k) { return m[k] >= 200; }); } },
    scorer: { n: (HB ? '500' : '100') + ' Karriere-Tore', ok: function (st, p) { return p && p.career && p.career.goals >= (HB ? 500 : 100); } },
    captain: { n: 'Kapitän werden', ok: function (st, p, pc) { return !!(pc.cx && pc.cx.captain); } },
    rich: { n: 'Millionär werden (Nettovermögen)', ok: function (st, p, pc) { return R.pf && R.pf.netWorth(st) >= 1e6; } },
    free: { n: 'Finanziell unabhängig werden', ok: function (st, p, pc) { return R.pf && R.pf.security(st).lvl === 1; } }
  };
  X.TRAITS = { tec: 'Technik', pas: HB ? 'Spielverständnis' : 'Passspiel', sho: HB ? 'Wurf' : 'Abschluss', def: HB ? 'Abwehr' : 'Defensive', spd: 'Tempo', sta: HB ? 'Athletik' : 'Kondition' };

  // ---------- Persönlichkeit & Beziehungen ----------
  X.PER = { conf: 'Selbstvertrauen', disc: 'Disziplin', amb: 'Ehrgeiz', team: 'Teamfähigkeit', lead: 'Führungsqualität', pop: 'Beliebtheit', media: 'Medienansehen', stress: 'Stressbelastung' };
  X.REL = { coach: 'Trainer', capt: 'Kapitän', mates: 'Mitspieler', board: 'Vereinsführung', fans: 'Fans', press: 'Medien', family: 'Familie' };

  X.ensure = function (st) {
    var pc = st && st.pc; if (!pc) return null;
    if (!pc.cx) {
      var p = C.player(st);
      pc.cx = {
        v: 1, prof: { nat: 'Deutschland', home: '', pos2: [], height: HB ? 190 : 182, build: 'athletisch', style: Object.keys(X.STYLES)[1], str: [], weak: [], goals: ['top', 'nat'] },
        per: { conf: 55, disc: 55, amb: 60, team: 55, lead: 30, pop: clamp(20 + pc.fame / 2, 0, 100), media: 50, stress: 20 },
        rel: { capt: 55, mates: 55, board: 50, fans: 50, press: 50, family: 70 },
        ppl: [], mem: { flags: {}, arcs: [], seen: {}, cats: {}, lastDec: tick(st), hist: [] }, inbox: [], chron: [],
        plan: { preset: 'ausgewogen', a: null }, mm: 'standard', lastMatch: null, goalsDone: {}, phase: 0, captain: false, edu: 0, uid: 1
      };
      // Chronik aus alten Spielständen ergänzen
      Object.keys(pc.ms || {}).forEach(function (k) { var m = pc.ms[k]; pc.cx.chron.push({ s: m.s, w: m.w || 0, t: tick(st), cat: 'meilenstein', ic: '⭐', ti: m.t || k, x: '' }); });
      if (p) X.updatePeople(st, true);
    }
    var cx = pc.cx; cx.plan = cx.plan || { preset: 'ausgewogen', a: null }; if (!cx.plan.a) cx.plan.a = X.presetPlan(cx.plan.preset, st);
    return cx;
  };
  X.mem = function (st, k, add) { var f = st.pc.cx.mem.flags; if (add != null) f[k] = (f[k] || 0) + add; return f[k] || 0; };
  X.setFlag = function (st, k, v) { st.pc.cx.mem.flags[k] = v; };

  // Wirkungen anwenden. Rückgabe: lesbare Kurzfassung (transparent für den Spieler)
  var LBL = { conf: 'Selbstvertrauen', disc: 'Disziplin', amb: 'Ehrgeiz', team: 'Teamfähigkeit', lead: 'Führung', pop: 'Beliebtheit', media: 'Medienansehen', stress: 'Stress',
    coach: 'Trainer', capt: 'Kapitän', mates: 'Mitspieler', board: 'Vereinsführung', fans: 'Fans', press: 'Medien', family: 'Familie', fame: 'Bekanntheit', morale: 'Laune', fit: 'Frische' };
  X.eff = function (st, o) {
    var pc = st.pc, cx = X.ensure(st), p = C.player(st), out = [];
    Object.keys(o || {}).forEach(function (k) {
      var v = o[k]; if (!v) return;
      if (k === 'cash') { if (R.pf) R.pf.book(st, v, v > 0 ? 'Sonstige Einnahmen' : 'Sonstige Ausgaben'); else pc.cash += v; out.push((v > 0 ? '+' : '') + R.fmtMoney(v)); return; }
      if (k === 'coach') pc.trust = clamp(pc.trust + v, 0, 100);
      else if (k === 'fame') C.addFame(st, v);
      else if (k === 'morale') { if (p) p.morale = clamp(p.morale + v, 0, 100); }
      else if (k === 'fit') { if (p) p.fitness = clamp(p.fitness + v, 20, 100); }
      else if (cx.per[k] != null) cx.per[k] = clamp(cx.per[k] + v, 0, 100);
      else if (cx.rel[k] != null) cx.rel[k] = clamp(cx.rel[k] + v, 0, 100);
      else return;
      if (LBL[k]) out.push(LBL[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)));
    });
    return out.join(', ');
  };
  X.ctx = function (st) {
    var pc = st.pc, cx = X.ensure(st), p = C.player(st), c = C.club(st);
    var share = p && !p.youth && st.phase === 'season' && st.week > 2 ? p.stats.apps / Math.max(1, st.week * 0.92) : null;
    return { st: st, pc: pc, cx: cx, p: p, c: c, age: p ? p.age : 0, youth: !!(p && p.youth), pro: !!(p && !p.youth), lg: c ? c.league : 0, name: p ? W.playerName(p) : '', first: p ? p.first : '',
      ph: cx.phase, ag: R.ag ? R.ag.current(st) : null, fa: R.fa ? R.fa.current(st) : null, rank: p && !p.youth ? C.squadRank(st, p) : 0, share: share, form: p ? p.form || 6 : 6, inj: !!(p && p.inj), sw: X.SW, hb: HB,
      sec: R.pf ? R.pf.security(st).lvl : 3, rival: X.person(st, 'rival'), friend: X.person(st, 'friend'), captP: X.person(st, 'capt'), season: st.phase === 'season' };
  };

  // ---------- Bezugspersonen (Kapitän, Rivale, Freund, Mentor) aus dem echten Kader ----------
  X.person = function (st, kind) { var cx = st.pc.cx; return cx ? cx.ppl.filter(function (x) { return x.kind === kind && st.players[x.pid]; })[0] || null : null; };
  X.updatePeople = function (st, force) {
    var pc = st.pc, cx = pc.cx, p = C.player(st); if (!cx || !p || !p.clubId) return;
    var sq = W.squad(st, p.clubId).filter(function (x) { return x.id !== p.id; });
    var keep = cx.ppl.filter(function (x) { var q = st.players[x.pid]; return q && q.clubId === p.clubId; });
    function has(k) { return keep.some(function (x) { return x.kind === k; }); }
    if (!has('capt') && sq.length) { var cap = sq.slice().sort(function (a, b) { return (b.age * 1.5 + b.ovr) - (a.age * 1.5 + a.ovr); })[0]; keep.push({ kind: 'capt', pid: cap.id, name: W.playerName(cap), v: cx.rel.capt, since: st.season }); }
    if (!has('rival')) { var rv = sq.filter(function (x) { return x.pos === p.pos && Math.abs(x.age - p.age) <= 6; }).sort(function (a, b) { return Math.abs(a.ovr - p.ovr) - Math.abs(b.ovr - p.ovr); })[0]; if (rv) keep.push({ kind: 'rival', pid: rv.id, name: W.playerName(rv), v: 40, since: st.season }); }
    if (!has('friend')) { var fr = sq.filter(function (x) { return x.pos !== p.pos && Math.abs(x.age - p.age) <= 3 && !keep.some(function (k) { return k.pid === x.id; }); }); if (fr.length) { var f = R.pick(fr); keep.push({ kind: 'friend', pid: f.id, name: W.playerName(f), v: 65, since: st.season }); } }
    if (!has('mentor') && p.age <= 22) { var mt = sq.filter(function (x) { return x.age >= 29 && !keep.some(function (k) { return k.pid === x.id; }); }).sort(function (a, b) { return b.ovr - a.ovr; })[0]; if (mt) keep.push({ kind: 'mentor', pid: mt.id, name: W.playerName(mt), v: 55, since: st.season }); }
    // frühere Rivalen anderer Vereine bleiben als „alte Rivalität“ im Gedächtnis
    cx.ppl.forEach(function (x) { if (keep.indexOf(x) < 0 && x.kind === 'rival' && x.v < 30 && st.players[x.pid]) { x.kind = 'oldrival'; keep.push(x); } else if (keep.indexOf(x) < 0 && x.kind === 'oldrival' && st.players[x.pid]) keep.push(x); });
    var capt = keep.filter(function (x) { return x.kind === 'capt'; })[0]; if (capt) capt.v = cx.rel.capt;
    cx.ppl = keep;
  };
  X.pplRel = function (st, kind, d) { var x = X.person(st, kind); if (!x) return; x.v = clamp(x.v + d, 0, 100); if (kind === 'capt') st.pc.cx.rel.capt = x.v; };

  // ---------- Interaktionen mit Bezugspersonen ----------
  // Je Person eine Aktion pro Woche, insgesamt höchstens zwei pro Woche. Ergebnis hängt von Persönlichkeit und aktuellem Verhältnis ab.
  X.PPL_MAX = 2;
  function pAttr(p, keys, d) { keys.forEach(function (k) { if (p.attr && p.attr[k] != null && (k !== 'gk' || p.pos === 'TW')) p.attr[k] = clamp(p.attr[k] + d, 10, 99); }); if (p.pos === 'TW' && p.attr && p.attr.gk != null && keys.indexOf('gk') < 0) p.attr.gk = clamp(p.attr.gk + d * 0.6, 10, 99); if (W.recalc) W.recalc(p); }
  function ch(q) { return Math.random() < clamp(q, 0.05, 0.95); }
  X.PPL_ACTS = {
    capt: [
      { k: 'talk', ic: 'coffee', l: 'Gespräch unter vier Augen', d: 'Über die Mannschaft und deine Rolle reden. Stärkt Vertrauen und Führung.', fx: function (st, x, c) { var g = ch(0.6 + c.cx.per.team / 250 + (x.v - 50) / 200); return g ? { v: 7, e: { lead: 1, mates: 1 }, m: x.name + ' nimmt sich Zeit. „Gut, dass du kommst – so etwas merke ich mir.“' } : { v: 2, m: x.name + ' hört zu, wirkt aber mit den Gedanken woanders.' }; } },
      { k: 'help', ic: 'users', l: 'Mannschaftsabend mitorganisieren', d: 'Kostet etwas Zeit und Geld, bringt das Team zusammen.', cost: 120, fx: function (st, x) { return { v: 8, e: { mates: 3, team: 1, stress: 1 }, m: 'Der Abend ist ein Erfolg. ' + x.name + ': „Genau solche Leute brauchen wir.“' }; } },
      { k: 'back', ic: 'shield', l: 'Um Rückendeckung beim Trainer bitten', d: 'Klappt nur, wenn er dir vertraut (Verhältnis ab 60).', need: 60, fx: function (st, x) { var g = ch(0.45 + (x.v - 60) / 60); return g ? { v: 1, e: { coach: 4 }, m: x.name + ' legt beim Trainer ein gutes Wort für dich ein.' } : { v: -4, m: x.name + ' winkt ab: „Das musst du selbst regeln.“' }; } }
    ],
    rival: [
      { k: 'extra', ic: 'dumbbell', l: 'Gemeinsame Extraschicht', d: 'Konkurrenz belebt – ihr treibt euch gegenseitig an. Kostet Frische.', fx: function (st, x, c) { pAttr(c.p, ['tec', 'sho'], 0.25); var g = ch(0.5 + c.cx.per.team / 200); return { v: g ? 8 : 3, e: { fit: -4, coach: 1 }, m: g ? 'Ihr pusht euch bis zum Schluss – und klatscht danach ab.' : 'Hartes Duell. ' + x.name + ' geht wortlos in die Kabine – aber du bist besser geworden.' }; } },
      { k: 'respect', ic: 'star', l: 'Respekt zeigen', d: 'Nach seinem guten Spiel ehrlich gratulieren.', fx: function (st, x, c) { var g = ch(0.55 + (x.v - 40) / 120 + c.cx.per.team / 300); return g ? { v: 7, e: { team: 1, mates: 1 }, m: x.name + ' ist überrascht – und bedankt sich ehrlich.' } : { v: 1, e: { conf: -1 }, m: x.name + ' nickt nur knapp. Immerhin ein Anfang.' }; } },
      { k: 'clear', ic: 'handshake', l: 'Aussprache suchen', d: 'Offenes Gespräch über die Konkurrenz. Kann viel bringen – oder alles schlimmer machen.', fx: function (st, x, c) { var g = ch(0.4 + c.cx.per.team / 200 + c.cx.per.lead / 300 + (x.v < 30 ? 0.05 : 0)); return g ? { v: 16, e: { mates: 2, stress: -1 }, chron: 'Aussprache mit ' + x.name + ' – ihr zieht jetzt an einem Strang.', m: 'Ihr redet lange. Am Ende steht fest: Konkurrenz ja, Feindschaft nein.' } : { v: -6, e: { stress: 2 }, m: 'Das Gespräch kippt. ' + x.name + ': „Du willst doch nur meinen Platz.“' }; } }
    ],
    friend: [
      { k: 'dinner', ic: 'utensils', l: 'Zusammen essen gehen', d: 'Abschalten vom Sport.', cost: 80, fx: function (st, x) { return { v: 8, e: { morale: 3, stress: -2 }, m: 'Ein langer Abend mit ' + x.name + ' – genau das hat gefehlt.' }; } },
      { k: 'games', ic: 'dices', l: 'Spieleabend bei dir', d: 'Konsole, Karten, Pizza. Billig und entspannend.', cost: 25, fx: function (st, x) { return { v: 5, e: { stress: -2, mates: 1 }, m: x.name + ' bringt noch zwei Teamkollegen mit. Ihr lacht viel.' }; } },
      { k: 'listen', ic: 'heart-pulse', l: 'Nach seinen Sorgen fragen', d: 'Ein echter Freund hört zu.', fx: function (st, x, c) { var g = ch(0.65 + c.cx.per.team / 300); return { v: g ? 9 : 4, e: { team: 1 }, m: g ? x.name + ' öffnet sich – ' + R.pick(['Ärger um den Vertrag', 'Heimweh', 'Zweifel an der eigenen Form', 'Stress zu Hause']) + '. Er ist froh, dass du fragst.' : x.name + ': „Alles gut, wirklich.“ Er weiß aber, dass du da bist.' }; } }
    ],
    mentor: [
      { k: 'advice', ic: 'brain', l: 'Um Rat fragen', d: 'Erfahrung weitergeben lassen – stärkt Selbstvertrauen und Spielverständnis.', fx: function (st, x, c) { pAttr(c.p, ['pas', 'tec'], 0.15); return { v: 5, e: { conf: 2 }, m: x.name + ': „In deinem Alter habe ich denselben Fehler gemacht …“ – du nimmst viel mit.' }; } },
      { k: 'video', ic: 'eye', l: 'Gemeinsame Videoanalyse', d: 'Szenen deiner letzten Spiele zusammen durchgehen. Der Trainer sieht den Einsatz.', fx: function (st, x, c) { pAttr(c.p, ['def', 'pas'], 0.15); return { v: 5, e: { coach: 2, disc: 1 }, m: 'Zwei Stunden Video. ' + x.name + ' zeigt dir Laufwege, die du nie bemerkt hast.' }; } },
      { k: 'thanks', ic: 'sparkles', l: 'Danke sagen (kleines Geschenk)', d: 'Zeigen, dass du die Hilfe schätzt.', cost: 60, fx: function (st, x) { return { v: 10, e: { team: 1 }, m: x.name + ' ist gerührt: „Dafür nicht. Mach einfach weiter so.“' }; } }
    ],
    oldrival: [
      { k: 'msg', ic: 'mail', l: 'Versöhnliche Nachricht schreiben', d: 'Alte Geschichten hinter sich lassen.', fx: function (st, x, c) { var g = ch(0.45 + c.cx.per.team / 250); return g ? { v: 14, e: { stress: -1 }, m: x.name + ' antwortet: „Schon vergessen. Viel Erfolg dir!“' } : { v: -3, m: 'Keine Antwort. Manche Rivalitäten dauern länger.' }; } },
      { k: 'pub', ic: 'megaphone', l: 'Ihn öffentlich loben', d: 'Ein faires Wort in einem Interview. Gut fürs Medienbild.', fx: function (st, x) { return { v: 8, e: { press: 2, pop: 1 }, m: 'Dein Lob für ' + x.name + ' wird viel zitiert – fair und souverän.' }; } }
    ]
  };
  X.pplCost = function (st, a) { return a.cost ? Math.round(a.cost * (HB ? 0.6 : 1)) : 0; };
  X.pplState = function (st) { var cx = st.pc.cx, t = tick(st); if (!cx.pplW || cx.pplW.t !== t) cx.pplW = { t: t, n: 0 }; return cx.pplW; };
  // Prüfung: warum (noch) nicht? Rückgabe: Text oder ''
  X.pplBlock = function (st, x, a) {
    var w = X.pplState(st), t = tick(st);
    if (!st.players[x.pid]) return 'nicht mehr erreichbar';
    if (x.iw === t) return 'diese Woche schon getroffen';
    if (w.n >= X.PPL_MAX) return 'diese Woche keine Zeit mehr';
    if (a && a.need && x.v < a.need) return 'Verhältnis zu schwach (ab ' + a.need + ')';
    if (a && X.pplCost(st, a) && (st.pc.cash || 0) < X.pplCost(st, a)) return 'zu wenig Geld';
    return '';
  };
  X.pplDo = function (st, pid, k) {
    var cx = X.ensure(st), p = C.player(st), x = cx && cx.ppl.filter(function (y) { return String(y.pid) === String(pid); })[0]; if (!x || !p) return { ok: false, why: 'Person nicht gefunden' };
    var a = (X.PPL_ACTS[x.kind] || []).filter(function (y) { return y.k === k; })[0]; if (!a) return { ok: false, why: 'Unbekannte Aktion' };
    var why = X.pplBlock(st, x, a); if (why) return { ok: false, why: why };
    var cost = X.pplCost(st, a); if (cost) { if (R.pf) R.pf.book(st, -cost, 'Freizeit & Privatleben'); else st.pc.cash -= cost; }
    var r = a.fx(st, x, X.ctx(st)) || {}, v0 = x.v;
    x.v = clamp(x.v + (r.v || 0), 0, 100); if (x.kind === 'capt') cx.rel.capt = x.v;
    x.iw = tick(st); x.n = (x.n || 0) + 1; X.pplState(st).n++;
    var fx = X.eff(st, r.e || {});
    if (r.chron) X.chron(st, 'team', '🤝', 'Bezugsperson', r.chron, 2);
    else if (x.v >= 80 && v0 < 80) X.chron(st, 'freund', '💬', 'Enges Verhältnis', 'Zu ' + x.name + ' hast du jetzt ein besonders gutes Verhältnis.', 2);
    return { ok: true, msg: r.m || '', dv: Math.round(x.v - v0), fx: fx, cost: cost, name: x.name };
  };
  // Wöchentlich: gute Beziehungen zahlen sich aus, vernachlässigte kühlen langsam ab
  X.pplWeek = function (st) {
    var cx = st.pc.cx, p = C.player(st), t = tick(st); if (!cx || !p) return;
    cx.ppl.forEach(function (x) {
      if (!st.players[x.pid]) return;
      var idle = t - (x.iw != null ? x.iw : (x.t0 != null ? x.t0 : (x.t0 = t)));
      if (idle > 6 && x.v > 50 && x.kind !== 'rival' && x.kind !== 'oldrival') x.v = clamp(x.v - 0.4, 0, 100);
      if (x.kind === 'friend' && x.v >= 75) p.morale = clamp(p.morale + 0.6, 0, 100);
      if (x.kind === 'mentor' && x.v >= 70 && Math.random() < 0.3) pAttr(p, ['tec', 'pas'], 0.04);
      if (x.kind === 'capt' && x.v >= 70) cx.rel.mates = clamp(cx.rel.mates + 0.2, 0, 100);
      if (x.kind === 'rival' && x.v < 20) cx.per.stress = clamp(cx.per.stress + 0.3, 0, 100);
      if (x.kind === 'capt') cx.rel.capt = x.v;
    });
  };

  // ---------- Karrierephasen (dynamisch, ohne feste Zeiten) ----------
  X.PHASES = ['Jugendspieler', 'Nachwuchstalent', 'Übergang zu den Profis', 'Jungprofi', 'Etablierter Profi', 'Spitzenspieler', 'Erfahrener Profi', 'Karriereausklang'];
  X.PHASE_TXT = ['Erste Vereinserfahrungen – Schule, Training, Jugendliga.', 'Auswahlmannschaften und Sichtungen: Die ersten Augen sind auf dich gerichtet.', 'Der Sprung in den Erwachsenenbereich steht an.', 'Kampf um Einsatzzeiten bei den Profis.',
    'Stammplatz – und erste große Karriereentscheidungen.', 'Titel, Nationalmannschaft, internationale Bühne.', 'Erfahrung zählt – Leistung, Verletzungen und Vertragsfragen.', 'Die letzten Verträge, der Abschied, vielleicht eine Trainerkarriere.'];
  X.computePhase = function (st) {
    var pc = st.pc, p = C.player(st); if (!p) return 0;
    var last = pc.seasons.filter(function (s) { return !s.youth; }).slice(-1)[0], natO = W.fromMoneyScale ? W.fromMoneyScale(st, C.CFG.natOvr) : C.CFG.natOvr;
    var share = p.stats.apps / Math.max(1, (st.phase === 'season' ? st.week : 0) * 0.92);
    if (st.phase !== 'season' || st.week < 6) share = last ? last.apps / 30 : 0;
    if (p.youth) return p.age <= 16 && p.ovr < 50 && !X.mem(st, 'sel') ? 0 : (p.ovr >= (C.club(st) ? R.avg(W.squad(st, p.clubId).filter(function (x) { return !x.youth; }), function (x) { return x.ovr; }) - 6 : 99) || p.age >= 18 ? 2 : 1);
    if (p.age >= 33 || (p.age >= 31 && last && last.ovr > p.ovr + 2)) return 7;
    if (p.age >= 30) return 6;
    if (p.ovr >= natO - 1 || (pc.fame >= 60 && share > 0.5)) return 5;
    if (share >= 0.55 && p.age >= 21) return 4;
    if ((p.career ? p.career.apps : 0) < 12) return 2;
    return 3;
  };

  // ---------- Wochenplanung ----------
  // Zeitbudget je Woche: 10 Einheiten. Mannschaftstraining ist fest (4), Schule für Minderjährige ebenfalls (2).
  X.BUDGET = 10;
  X.ACTS = {
    team: { n: 'Mannschaftstraining', ic: 'users', c: 4, fixed: true, d: 'Pflicht. Grundlage für Entwicklung und Trainervertrauen.' },
    extra: { n: 'Zusatztraining', ic: 'dumbbell', c: 2, d: 'Schnellere Entwicklung, aber mehr Belastung und Verletzungsrisiko.', dev: 0.22, fit: -5, load: 8, coach: 0.4, inj: 0.012 },
    video: { n: 'Videoanalyse & Taktik', ic: 'monitor-play', c: 1, d: 'Der Trainer sieht den Einsatz, etwas bessere Entwicklung.', dev: 0.05, coach: 0.8 },
    regen: { n: 'Regeneration', ic: 'bed', c: 1, d: 'Frische zurück, Stress sinkt.', fit: 5, load: -10, stress: -1.5 },
    physio: { n: 'Physiotherapie', ic: 'stethoscope', c: 1, d: 'Schnellere Heilung, weniger Verletzungsrisiko.', heal: 0.35, inj: -0.006, fit: 2 },
    teamev: { n: 'Teamveranstaltung', ic: 'party-popper', c: 1, d: 'Stärkt Beziehungen zur Mannschaft, kostet Erholung.', mates: 0.8, capt: 0.4, fit: -2, team: 0.15 },
    school: { n: 'Schule / Ausbildung', ic: 'graduation-cap', c: 2, d: 'Abschluss und zweites Standbein. Für Minderjährige Pflicht.', edu: 1, family: 0.4, disc: 0.1 },
    agent: { n: 'Beratergespräch', ic: 'briefcase', c: 1, d: 'Hält den Draht zum Berater, bringt Infos über Vereine.', agent: 1 },
    media: { n: 'Medienauftritte', ic: 'mic', c: 1, d: 'Bekanntheit und Medienansehen steigen, kleine Gage. Der Trainer sieht es kritisch.', fame: 0.5, press: 0.6, coach: -0.25, cash: 0.08, dev: -0.03 },
    sponsor: { n: 'Sponsorentermine', ic: 'badge-dollar-sign', c: 1, d: 'Pflegt Sponsoren (mehr Einnahmen), kostet Zeit.', spons: 1, fame: 0.2, dev: -0.02 },
    finance: { n: 'Finanzen selbst verwalten', ic: 'wallet', c: 1, d: 'Zeit für Depot, Konten und Verträge. Ohne Berater nötig, sonst wachsen Fehler und Stress.', fin: 1 },
    private: { n: 'Freizeit & Privatleben', ic: 'heart', c: 1, d: 'Familie, Freunde, Erholung. Laune hoch, Stress runter.', family: 0.8, stress: -2, morale: 2 }
  };
  X.PRESETS = {
    ausgewogen: { n: 'Ausgewogen', a: { extra: 1, video: 1, regen: 1, private: 1, finance: 1 } },
    leistung: { n: 'Volle Leistung', a: { extra: 2, video: 1, regen: 1 } },
    regeneration: { n: 'Regeneration', a: { regen: 2, physio: 1, private: 2 } },
    medien: { n: 'Medien & Sponsoren', a: { media: 2, sponsor: 1, private: 1, finance: 1 } },
    team: { n: 'Mannschaft & Familie', a: { teamev: 2, private: 2, video: 1 } }
  };
  X.presetPlan = function (k, st) {
    var a = R.clone((X.PRESETS[k] || X.PRESETS.ausgewogen).a); a.team = 1;
    var p = st && C.player(st); if (p && p.age < 18) { a.school = 1; X.fitPlan(a); }
    return a;
  };
  X.planCost = function (a) { var n = 0; Object.keys(a).forEach(function (k) { if (X.ACTS[k]) n += X.ACTS[k].c * a[k]; }); return n; };
  X.fitPlan = function (a) { // überschreitet das Budget? → freiwillige Aktivitäten kürzen
    var order = ['media', 'sponsor', 'teamev', 'finance', 'private', 'extra', 'video', 'regen', 'physio', 'agent'];
    while (X.planCost(a) > X.BUDGET) { var k = order.filter(function (x) { return a[x] > 0; })[0]; if (!k) break; a[k]--; if (!a[k]) delete a[k]; }
    return a;
  };
  X.setPlan = function (st, k, d) {
    var cx = X.ensure(st), a = cx.plan.a, act = X.ACTS[k], p = C.player(st); if (!act || act.fixed) return { ok: false };
    if (k === 'school' && p && p.age < 18 && d < 0 && (a.school || 0) <= 1) return { ok: false, why: 'Für Minderjährige ist die Schule Pflicht.' };
    var n = clamp((a[k] || 0) + d, 0, 4); var b = R.clone(a); b[k] = n; if (!n) delete b[k];
    if (X.planCost(b) > X.BUDGET) return { ok: false, why: 'Das Zeitbudget der Woche ist voll.' };
    cx.plan.a = b; cx.plan.preset = null; return { ok: true };
  };
  X.usePreset = function (st, k) { var cx = X.ensure(st); cx.plan.preset = k; cx.plan.a = X.presetPlan(k, st); };
  // Gesamtwirkung der Woche (ersetzt den alten Wochenfokus)
  X.planFx = function (st) {
    var cx = st.pc.cx, a = (cx && cx.plan.a) || { team: 1 }, f = { dev: 0, fit: 0, trust: 0, fame: 0, inj: 0, cash: 0, mor: 0 }, p = C.player(st);
    Object.keys(a).forEach(function (k) {
      var x = X.ACTS[k], n = a[k]; if (!x || !n) return;
      f.dev += (x.dev || 0) * n; f.fit += (x.fit || 0) * n; f.trust += (x.coach || 0) * n; f.fame += (x.fame || 0) * n * 2; f.inj += (x.inj || 0) * n; f.cash += (x.cash || 0) * n; f.mor += (x.morale || 0) * n;
    });
    if (p && p.inj) { f.dev = Math.min(f.dev, 0); f.inj = 0; }
    f.inj = Math.max(0, f.inj); f.n = 'Wochenplan';
    if (cx) { f.dev += (cx.per.disc - 50) / 600 + (cx.per.amb - 50) / 700 - Math.max(0, cx.per.stress - 60) / 300; }
    return f;
  };

  // ---------- Ereignis-Engine ----------
  // Ereignis: { id, cat, pack, ic, w, prio, cd, once, inbox, exp, def, follow, sport, when(ctx), ti, t(ctx,data), o:[{ l, hint, req(ctx), fx(st,ctx,data) → Text }] }
  X.REG = {}; X.PACKS = {}; X.CATS = { sport: 'Sportliche Entwicklung', trainer: 'Trainer', team: 'Mannschaft', rival: 'Rivalitäten', freund: 'Freundschaften', verletzung: 'Verletzungen', sichtung: 'Talentsichtungen', vertrag: 'Verträge',
    berater: 'Berater', transfer: 'Transfers', medien: 'Medien', sponsor: 'Sponsoren', familie: 'Familie & Ausbildung', nati: 'Nationalmannschaft', krise: 'Vereinskrisen', highlight: 'Karrierehöhepunkte', finanzen: 'Finanzen', finberater: 'Finanzberatung' };
  X.add = function (pack, list) { X.PACKS[pack] = (X.PACKS[pack] || []).concat(list.map(function (e) { return e.id; })); list.forEach(function (e) { e.pack = pack; X.REG[e.id] = e; }); };
  X.roll = function (st, base, mods) { var p = base; (mods || []).forEach(function (m) { p += m; }); return R.rand() < clamp(p, 0.04, 0.94); };
  X.later = function (st, weeks, id, data) { st.pc.cx.mem.arcs.push({ due: tick(st) + Math.max(1, weeks), id: id, data: data || {} }); };
  X.chron = function (st, cat, ic, ti, x, imp, img) { var cx = X.ensure(st); cx.chron.unshift({ s: st.season, w: st.week, t: tick(st), cat: cat, ic: ic || '•', ti: ti, x: x || '', imp: imp || 1, img: img || undefined }); if (cx.chron.length > 400) cx.chron.length = 400; };
  X.eligible = function (st, e, ctx) {
    var mem = st.pc.cx.mem, t = tick(st);
    if (e.follow) return false;
    if (e.sport && e.sport !== (HB ? 'hb' : 'fb')) return false;
    if (e.once && mem.seen[e.id] != null) return false;
    if (mem.seen[e.id] != null && t - mem.seen[e.id] < (e.cd || 40)) return false;
    try { return !e.when || !!e.when(ctx); } catch (er) { return false; }
  };
  X.optsFor = function (e, ctx) { var r = []; e.o.forEach(function (o, i) { var ok = true; try { ok = !o.req || o.req(ctx); } catch (er) { ok = false; } if (ok) r.push(i); }); return r; };
  // Ereignis auslösen: als Ereigniskarte (Popup) oder im Posteingang „Offene Entscheidungen“
  X.fire = function (st, id, data, forceInbox) {
    var e = X.REG[id], cx = X.ensure(st); if (!e) return null; data = data || {};
    var ctx = X.ctx(st), opts = X.optsFor(e, ctx); if (!opts.length) return null;
    var txt; try { txt = e.t(ctx, data); } catch (er) { if (typeof console !== 'undefined') console.error(er); return null; }
    var item = { uid: cx.uid++, id: id, data: data, t0: tick(st), exp: tick(st) + (e.exp || 3), opts: opts, txt: txt, ti: typeof e.ti === 'function' ? e.ti(ctx, data) : e.ti };
    cx.mem.seen[id] = tick(st); cx.mem.cats[e.cat] = tick(st); cx.mem.lastDec = tick(st);
    if (e.inbox || forceInbox || st.pendingEvent) { cx.inbox.push(item); return item; }
    cx.inbox.push(item);
    st.pendingEvent = { custom: { t: (item.ti ? item.ti + ': ' : '') + item.txt, ic: e.ic || X.SW.icon, cx: item.uid, o: opts.map(function (i) { var o = e.o[i]; return { l: o.l, hint: o.hint, plusAct: { k: 'pc', e: 'cx', uid: item.uid, i: i } }; }) } };
    return item;
  };
  X.resolve = function (st, uid, i) {
    var cx = X.ensure(st), item = cx.inbox.filter(function (x) { return x.uid === uid; })[0]; if (!item) return 'Diese Entscheidung ist nicht mehr offen.';
    var e = X.REG[item.id], o = e && e.o[i]; cx.inbox = cx.inbox.filter(function (x) { return x !== item; });
    if (st.pendingEvent && st.pendingEvent.custom && st.pendingEvent.custom.cx === uid) st.pendingEvent = null;
    if (!o) return 'Okay.';
    var ctx = X.ctx(st), msg = '';
    try { msg = o.fx ? o.fx(st, ctx, item.data) || '' : ''; } catch (er) { if (typeof console !== 'undefined') console.error(er); msg = ''; }
    cx.mem.hist.unshift({ t: tick(st), s: st.season, w: st.week, id: item.id, i: i, l: o.l }); if (cx.mem.hist.length > 300) cx.mem.hist.length = 300;
    if (e.chron !== false && (e.prio >= 1 || e.chron)) X.chron(st, e.cat, e.ic, item.ti || X.CATS[e.cat] || 'Entscheidung', o.l + (msg ? ' – ' + msg : ''), e.prio >= 2 ? 3 : 2);
    return msg || (o.l + '.');
  };
  X.openItems = function (st) { var cx = X.ensure(st); return cx ? cx.inbox.slice() : []; };
  X.expire = function (st) { // abgelaufene Posteingangs-Entscheidungen: Standardwahl (meist „abwarten/ablehnen“)
    var cx = st.pc.cx, t = tick(st);
    cx.inbox.slice().forEach(function (it) {
      if (it.exp > t) return; if (st.pendingEvent && st.pendingEvent.custom && st.pendingEvent.custom.cx === it.uid) return;
      var e = X.REG[it.id], d = e && e.def != null ? e.def : (it.opts[it.opts.length - 1]);
      if (it.opts.indexOf(d) < 0) d = it.opts[it.opts.length - 1];
      var m = X.resolve(st, it.uid, d); news(st, 'Keine Antwort: ' + (it.ti || 'Entscheidung'), 'Die Frist ist abgelaufen – ' + m);
    });
  };

  // ---------- Karriere-Regisseur ----------
  // Bewertet Ruhephasen, offene Handlungsbögen, Kategorien-Abwechslung und Plausibilität. Greift nie in Spielergebnisse ein.
  X.director = function (st) {
    var cx = X.ensure(st), t = tick(st), mem = cx.mem, ctx = X.ctx(st);
    // 1. fällige Handlungsbögen zuerst
    var due = mem.arcs.filter(function (a) { return a.due <= t; });
    for (var i = 0; i < due.length; i++) {
      var a = due[i], e = X.REG[a.id];
      mem.arcs.splice(mem.arcs.indexOf(a), 1);
      if (!e) continue;
      var ok = true; try { ok = !e.when || e.when(ctx, a.data); } catch (er) { ok = false; }
      if (ok && !st.pendingEvent) { X.fire(st, a.id, a.data); return 'arc'; }
      if (ok) { X.fire(st, a.id, a.data, true); return 'arc'; }
    }
    if (st.pendingEvent) return null;
    // 2. Ruhe bewerten
    var quiet = t - (mem.lastDec || 0), inSeason = st.phase === 'season';
    var p = (inSeason ? 0.12 : 0.07) + Math.max(0, quiet - 2) * 0.06;
    if (quiet >= 7) p = 1; // nie wochenlang nur „Weiter“
    if (cx.inbox.length >= 3) p *= 0.3;
    if (R.rand() > p) return null;
    // 3. plausible Kandidaten, gewichtet nach Abwechslung und Lage
    var pool = Object.keys(X.REG).map(function (k) { return X.REG[k]; }).filter(function (e) { return X.eligible(st, e, ctx); });
    if (!pool.length) return null;
    var e2 = R.weighted(pool, function (e) {
      var last = mem.cats[e.cat], fresh = last == null ? 1.6 : clamp((t - last) / 8, 0.15, 1.6);
      return (e.w || 1) * fresh * (1 + (e.prio || 0) * 0.5);
    });
    X.fire(st, e2.id, {});
    return e2.id;
  };

  // ---------- Wöchentlicher Ablauf ----------
  X.weekly = function (st) {
    var cx = X.ensure(st), pc = st.pc, p = C.player(st); if (!cx || !p) return;
    var a = cx.plan.a || {}, per = cx.per, rel = cx.rel;
    // Wochenplan: Wirkungen, die nicht schon im Basismodul stecken
    Object.keys(a).forEach(function (k) {
      var x = X.ACTS[k], n = a[k]; if (!x || !n) return;
      if (x.stress) per.stress = clamp(per.stress + x.stress * n, 0, 100);
      if (x.mates) { rel.mates = clamp(rel.mates + x.mates * n, 0, 100); X.pplRel(st, 'friend', 0.5 * n); }
      if (x.capt) X.pplRel(st, 'capt', x.capt * n);
      if (x.team) per.team = clamp(per.team + x.team * n, 0, 100);
      if (x.family) rel.family = clamp(rel.family + x.family * n, 0, 100);
      if (x.disc) per.disc = clamp(per.disc + x.disc * n, 0, 100);
      if (x.edu) cx.edu = Math.min(100, (cx.edu || 0) + x.edu * n);
      if (x.press) per.media = clamp(per.media + x.press * n * 0.5, 0, 100);
      if (x.heal && p.inj && p.inj.weeks > 1 && R.chance(x.heal * n)) p.inj.weeks--;
    });
    if (!a.private && !a.regen) per.stress = clamp(per.stress + 0.6, 0, 100);
    // Persönlichkeit driftet mit Form, Einsatzzeit und Lage
    var form = p.form || 6;
    per.conf = clamp(per.conf + (form - 6) * 0.5 - Math.max(0, per.stress - 55) * 0.04 + (55 - per.conf) * 0.02, 5, 100);
    per.pop = clamp(per.pop + (pc.fame - per.pop) * 0.02 + (rel.fans - 50) * 0.002, 0, 100);
    rel.fans = clamp(rel.fans + (form - 6) * 0.3 + (50 - rel.fans) * 0.01, 0, 100);
    rel.press = clamp(rel.press + (per.media - rel.press) * 0.05, 0, 100);
    rel.mates = clamp(rel.mates + (per.team - 55) * 0.01 + (50 - rel.mates) * 0.01, 0, 100);
    rel.board = clamp(rel.board + (pc.trust - 50) * 0.005 + (50 - rel.board) * 0.01, 0, 100);
    per.lead = clamp(per.lead + (p.age >= 25 ? 0.05 : 0) + (rel.mates - 50) * 0.002, 0, 100);
    if (p.age >= 18 && p.age <= 20 && (cx.edu || 0) >= 60 && !pc.ms.edu) C.milestone(st, 'edu', 'Schulabschluss geschafft', 'Ein zweites Standbein neben dem Sport.');
    // Stress drückt auf Laune (gedeckelt, im Profil sichtbar)
    if (per.stress > 60) p.morale = clamp(p.morale - (per.stress - 60) * 0.05, 0, 100);
    // Bezugspersonen, Kapitänsamt
    if (st.week % 8 === 1 || !cx.ppl.length) X.updatePeople(st);
    X.pplWeek(st);
    if (!cx.captain && !p.youth && p.age >= 25 && per.lead >= 62 && pc.trust >= 70 && rel.mates >= 60 && st.phase === 'preseason') { cx.captain = true; C.milestone(st, 'captain', 'Kapitän!', 'Die Mannschaft wählt ' + W.playerName(p) + ' zum Kapitän.'); X.chron(st, 'highlight', '©', 'Kapitänsbinde', 'Die Mannschaft vertraut dir.', 3); }
    // Phase
    var ph = X.computePhase(st);
    if (ph !== cx.phase) { var old = cx.phase; cx.phase = ph; if (ph > old || ph === 7) X.chron(st, 'sport', '📖', 'Neues Kapitel: ' + X.PHASES[ph], X.PHASE_TXT[ph], 2); }
    // Ziele
    var done = cx.goalsDone; cx.prof.goals.forEach(function (g) { var G = X.GOALS[g]; if (G && !done[g] && G.ok(st, p, pc)) { done[g] = st.season; news(st, '🎯 Karriereziel erreicht', G.n); X.chron(st, 'highlight', '🎯', 'Karriereziel erreicht', G.n, 3); per.conf = clamp(per.conf + 5, 0, 100); } });
    X.expire(st);
  };
  X.seasonEnd = function (st) {
    var cx = X.ensure(st), pc = st.pc, s = pc.seasons[pc.seasons.length - 1]; if (!cx || !s) return;
    X.chron(st, 'sport', '📅', 'Saison ' + s.season + '/' + String(s.season + 1).slice(2), s.club + (s.youth ? ' (Jugend)' : '') + ': ' + s.apps + ' Spiele, ' + s.goals + ' ' + X.SW.goals + (s.r ? ', Ø ' + String(s.r).replace('.', ',') : '') + (s.pos ? ', Platz ' + s.pos : ''), 1);
    (pc.titles || []).forEach(function (ti) { if (ti.indexOf(String(s.season)) >= 0 && !X.mem(st, 'tc_' + ti)) { X.mem(st, 'tc_' + ti, 1); X.chron(st, 'highlight', '🏆', ti, '', 3); } });
  };
  X.start = function (st, o) {
    var cx = X.ensure(st), p = C.player(st); if (!cx || !o) return;
    var pr = cx.prof;
    if (o.nat) pr.nat = String(o.nat).slice(0, 30); if (o.home) pr.home = String(o.home).slice(0, 40);
    if (o.height) pr.height = clamp(+o.height || pr.height, 155, 215);
    if (o.build && X.BUILDS[o.build]) pr.build = o.build; if (o.style && X.STYLES[o.style]) pr.style = o.style;
    pr.pos2 = (o.pos2 || []).filter(function (k) { return D.posWeights[k] && k !== p.pos; }).slice(0, 2);
    pr.str = (o.str || []).filter(function (k) { return X.TRAITS[k]; }).slice(0, 2); pr.weak = (o.weak || []).filter(function (k) { return X.TRAITS[k] && pr.str.indexOf(k) < 0; }).slice(0, 2);
    pr.goals = (o.goals || ['top', 'nat']).filter(function (k) { return X.GOALS[k]; }).slice(0, 3); if (!pr.goals.length) pr.goals = ['top'];
    if (o.per) Object.keys(o.per).forEach(function (k) { if (cx.per[k] != null) cx.per[k] = clamp(+o.per[k], 10, 90); });
    // Körperbau, Spielstil, Stärken/Schwächen wirken auf die Startwerte (die Gesamtstärke bleibt fast gleich)
    if (p && p.attr) {
      var mods = {}; function add(m, f) { Object.keys(m || {}).forEach(function (k) { if (k !== 'n' && k !== 'a') mods[k] = (mods[k] || 0) + m[k] * (f || 1); }); }
      add(X.BUILDS[pr.build]); add(X.STYLES[pr.style].a);
      pr.str.forEach(function (k) { mods[k] = (mods[k] || 0) + 4; }); pr.weak.forEach(function (k) { mods[k] = (mods[k] || 0) - 4; });
      if (p.pos !== 'TW') Object.keys(mods).forEach(function (k) { if (p.attr[k] != null && k !== 'gk') p.attr[k] = clamp(p.attr[k] + mods[k], 15, 95); });
      W.recalc(p);
    }
    cx.plan.a = X.presetPlan('ausgewogen', st);
    X.updatePeople(st, true);
    cx.phase = X.computePhase(st);
    X.chron(st, 'sport', '🌱', 'Die Karriere beginnt', W.playerName(p) + ', ' + p.age + ' Jahre, aus ' + (pr.home || pr.nat) + ' – ' + X.PHASE_TXT[cx.phase], 3);
  };

  // ---------- Einbindung ----------
  C.focusFx = function (st) { return st.pc && st.pc.cx ? X.planFx(st) : (C.FOCUS[st.pc.focus] || C.FOCUS.normal); };
  var baseBias = C.lineupBias;
  C.lineupBias = function (st, p) { var b = baseBias(st, p), cx = st.pc.cx; if (!cx) return b; return clamp(b + (cx.per.conf - 55) / 900 + (cx.per.disc - 50) / 1200, 0.72, 1.32); };
  C.director = function (st) { X.ensure(st); X.director(st); };
  C.on.weekly.push(X.weekly);
  C.on.seasonEnd.push(X.seasonEnd);
  C.on.start.push(X.start);
  C.on.newSeason.push(function (st) { X.ensure(st); X.updatePeople(st, true); var p = C.player(st); if (p && p.age >= 18 && st.pc.cx.plan.a.school && st.pc.cx.plan.preset) st.pc.cx.plan.a = X.presetPlan(st.pc.cx.plan.preset, st); });
  C.on.retire.push(function (st) { if (st.pc.cx) X.chron(st, 'highlight', '👋', 'Karriereende', st.pc.final ? st.pc.final.name + ': ' + st.pc.final.apps + ' Spiele, ' + st.pc.final.goals + ' ' + X.SW.goals : '', 3); });
  // Wechsel mitschreiben
  var baseCheck = C.checkClub;
  C.checkClub = function (st, p) { var old = st.pc.club; baseCheck(st, p); if (st.pc.cx && p.clubId && p.clubId !== old) { var c = st.clubs[p.clubId]; X.chron(st, 'transfer', '🔁', 'Wechsel zu ' + c.name, (st.clubs[old] ? 'Von ' + st.clubs[old].short + '. ' : '') + 'Neues Umfeld, neuer Trainer.', 3); X.mem(st, 'moves', 1); st.pc.cx.mem.flags.lastMove = st.season; X.updatePeople(st, true); st.pc.cx.rel.capt = 50; st.pc.cx.rel.mates = 50; st.pc.cx.rel.board = 55; } };
})(RFM);
