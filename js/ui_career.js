// Oberfläche des interaktiven Karrieremodus (ANPFIFF & ANWURF): Karriere-Zentrale, Wochenplan, Spieltag mit
// Entscheidungssituationen, Spielerprofil, Beziehungen, Berater & Verträge, Meine Finanzen (inkl. Finanzberatung),
// Karriere-Chronik und erweiterter Charakter-Assistent. Baut auf ui_pc.js auf.
(function (R) {
  var D = R.data, W = R.world, S = R.season, U = R.ui, C = R.pc, X = R.cx, AG = R.ag, PF = R.pf, FA = R.fa, CM = R.cm, E = R.econ;
  if (!X || !U) return;
  var esc = R.esc, money = R.fmtMoney, HB = X.HB;
  function on(st) { return !!(st && st.pc && C.active(st)); }
  function tick(st) { return st.tick || 0; }
  function num(v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('de-DE'); }
  function pct(v) { return Math.round(v * 100) + ' %'; }
  function sgn(v) { return (v > 0 ? '+' : v < 0 ? '−' : '±') + money(Math.abs(v)); }
  var ICMAP = { 'monitor-play': 'eye', bed: 'bed-double', 'party-popper': 'sparkles', 'badge-dollar-sign': 'circle-dollar-sign', mic: 'megaphone', heart: 'heart-pulse' };
  function ic(n, s) { return U.lc(ICMAP[n] || n, s || 16); }
  var CATCOL = { sport: '#22c55e', trainer: '#3b82f6', team: '#06b6d4', rival: '#ef4444', freund: '#a855f7', verletzung: '#f97316', sichtung: '#eab308', vertrag: '#64748b', berater: '#0ea5e9', transfer: '#8b5cf6', medien: '#ec4899', sponsor: '#f59e0b', familie: '#14b8a6', nati: '#dc2626', krise: '#b91c1c', highlight: '#facc15', finanzen: '#10b981', finberater: '#0d9488', meilenstein: '#facc15' };

  // ---------- Stile (einmalig eingefügt, nutzen die Farbvariablen des Spiels) ----------
  if (typeof document !== 'undefined' && !document.getElementById('cx-style')) {
    var css = document.createElement('style'); css.id = 'cx-style';
    css.textContent = [
      '.cx-hero{display:flex;gap:16px;align-items:center;flex-wrap:wrap;background:linear-gradient(135deg,var(--panel2),var(--panel));border:1px solid var(--line);border-radius:12px;padding:16px}',
      '.cx-phases{display:flex;gap:4px;margin-top:10px;flex-wrap:wrap}.cx-phases span{flex:1 1 60px;font-size:10.5px;text-align:center;padding:5px 3px;border-radius:5px;background:var(--bg2);color:var(--muted);border:1px solid var(--line)}',
      '.cx-phases span.done{color:var(--text);border-color:var(--green2)}.cx-phases span.on{background:var(--green2);color:#fff;font-weight:700}',
      '.cx-card{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel2);margin-bottom:10px;border-left:4px solid var(--c,var(--blue))}',
      '.cx-card h3{margin:0 0 4px;font-size:15px}.cx-card .opts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}',
      '.cx-tile{display:inline-flex;width:38px;height:38px;border-radius:9px;align-items:center;justify-content:center;font-size:21px;flex:0 0 38px;background:color-mix(in srgb,var(--c,#3b82f6) 22%,transparent)}',
      '.cx-row{display:flex;gap:10px;align-items:flex-start}.cx-row>div{min-width:0}',
      '.cx-chron{border-left:2px solid var(--line);margin-left:18px;padding-left:16px}.cx-chron .it{position:relative;margin:0 0 12px}.cx-chron .it:before{content:"";position:absolute;left:-23px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--c,#3b82f6)}',
      '.cx-chron .it.big .t{font-weight:800;font-size:15px}.cx-season{font-weight:800;margin:14px 0 8px;color:var(--muted);letter-spacing:.04em}',
      '.cx-score{display:flex;align-items:center;justify-content:center;gap:18px;padding:12px;border-radius:12px;background:var(--bg2);border:1px solid var(--line)}.cx-score .sc{font-size:40px;font-weight:900;font-family:var(--mono);min-width:120px;text-align:center}',
      '.cx-ticker{max-height:430px;overflow:auto;font-size:13px}.cx-ticker div{padding:5px 6px;border-bottom:1px solid var(--line)}.cx-ticker .me{background:color-mix(in srgb,var(--green) 13%,transparent)}.cx-ticker .goal{font-weight:700}',
      '.cx-scene{border:2px solid var(--amber);border-radius:12px;padding:16px;background:color-mix(in srgb,var(--amber) 10%,var(--panel));animation:cxIn .25s ease-out}',
      '.cx-scene .opts{display:grid;gap:8px;margin-top:12px}.cx-scene .opts button{text-align:left;padding:11px 12px;font-size:14px}',
      '@keyframes cxIn{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}',
      '.cx-plan td{vertical-align:middle}.cx-plan .pm{display:inline-flex;gap:4px;align-items:center}.cx-plan .pm b{min-width:18px;text-align:center}',
      '.cx-lvl{display:flex;gap:3px}.cx-lvl i{flex:1;height:10px;border-radius:3px;background:var(--bg2);border:1px solid var(--line)}.cx-lvl i.on{background:var(--c)}',
      '.cx-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px}.cx-tabs button.on{background:var(--green2);color:#fff;font-weight:700}',
      '.cx-attr td:first-child{color:var(--muted)}.cx-pill{display:inline-block;padding:2px 8px;border-radius:99px;font-size:11.5px;background:var(--bg2);border:1px solid var(--line);margin:2px}',
      '.cx-pill.ok{border-color:var(--green);color:var(--green)}.cx-pill.bad{border-color:var(--red);color:var(--red)}.cx-pill.warn{border-color:var(--amber);color:var(--amber)}',
      '.cx-field{width:100%;max-width:100%}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // ---------- Navigation, Kopfzeile ----------
  var baseNav = U.navItems;
  U.navItems = function () {
    var st = U.st; if (!on(st)) return baseNav();
    var cx = X.ensure(st), open = cx.inbox.length;
    return [['pkarriere', 'layout-dashboard', 'Karriere-Zentrale', open, 'Karriere'], ['pwoche', 'calendar-days', 'Wochenplan', 0, 'Karriere'], ['pprofil', 'user-round', 'Spielerprofil', 0, 'Karriere'],
      ['pbez', 'users', 'Beziehungen', 0, 'Umfeld'], ['pberater', 'briefcase', 'Berater & Verträge', st.pc.offers.length, 'Umfeld'], ['pfin', 'wallet', 'Meine Finanzen', 0, 'Umfeld'], ['pchronik', 'bookmark', 'Karriere-Chronik', 0, 'Umfeld'],
      ['liga', 'chart-column', 'Liga & Statistiken', 0, 'Wettbewerb'], ['einstellungen', 'settings', 'Einstellungen', 0, 'System']];
  };
  var baseTop = U.renderTop;
  U.renderTop = function () {
    var st = U.st; if (!on(st) || st.pc.retired) return baseTop();
    var p = C.player(st), c = C.club(st), pc = st.pc, el = document.getElementById('topbar'); if (!p || !el) return baseTop();
    function chip(icon, label, val, opt) { return '<div class="tb-chip' + (opt ? ' opt' : '') + '">' + U.lc(icon, 18) + '<div><span>' + label + '</span><b>' + val + '</b></div></div>'; }
    var fx = (st.phase === 'season' || st.phase === 'preseason') && CM.fixture(st), sub = st.phase === 'seasonEnd' ? 'Neue Saison' : fx ? (CM.mode(st) === 'aus' ? 'Spieltag' : 'Zum Spiel') : 'Nächste Woche';
    if (U.pcm) sub = 'Zurück zum Spiel';
    el.innerHTML = '<div class="tb-club">' + (c ? U.crest(c, 40) : '') + '<div><div class="name">' + esc(W.playerName(p)) + '</div><div class="sub">' + esc(X.PHASES[pc.cx.phase] || '') + ' · ' + (c ? esc(c.short) : 'vereinslos') + ' · Saison ' + st.season + '/' + String(st.season + 1).slice(2) + '</div></div></div>' +
      chip('gauge', 'Stärke', p.ovr) + chip('calendar-days', S.isBreak(st) ? 'Woche' : 'Spieltag', S.calText(st, true)) + chip('handshake', 'Trainer', Math.round(pc.trust)) +
      chip('activity', 'Form', (p.form || 6).toFixed(1).replace('.', ','), true) + chip('wallet', 'Nettovermögen', money(Math.round(PF.netWorth(st))), true) +
      '<div class="tb-spacer"></div>' + (pc.cx.inbox.length ? '<button class="sm" data-act="nav" data-s="pkarriere" title="Offene Entscheidungen">' + U.lc('mail', 14) + ' ' + pc.cx.inbox.length + '</button>' : '') +
      (U.autoRun ? '<button class="sm danger" data-act="autoStop">' + U.lc('square', 14) + 'Stopp</button>' : '<button class="sm ghost" data-act="autoStart" title="Gewöhnliche Wochen überspringen – stoppt bei Entscheidungen, Angeboten und Saisonende">' + U.lc('fast-forward', 15) + 'Auto</button>') +
      '<button class="btn-next" data-act="next"' + (U.busy ? ' disabled' : '') + '><span class="bn-txt">Weiter<small>' + sub + '</small></span>' + U.lc('chevron-right', 20) + '</button>';
  };

  // ---------- Bausteine ----------
  function tile(cat, emo) { return '<span class="cx-tile" style="--c:' + (CATCOL[cat] || '#3b82f6') + '">' + (emo || '•') + '</span>'; }
  function barRow(lbl, v, extra) { return '<tr><td>' + lbl + '</td><td style="width:50%">' + U.bar(v, 100, v < 30 ? 'var(--red)' : v > 70 ? 'var(--green)' : '') + '</td><td class="num">' + Math.round(v) + (extra || '') + '</td></tr>'; }
  function weeksLeft(st, t) { var w = Math.max(0, t - tick(st)); return w <= 1 ? 'diese Woche' : 'noch ' + w + ' Wochen'; }
  function inboxCard(st, it) {
    var e = X.REG[it.id] || {};
    return '<div class="cx-card" style="--c:' + (CATCOL[e.cat] || '#3b82f6') + '"><div class="cx-row">' + tile(e.cat, e.ic) + '<div><h3>' + esc(it.ti || X.CATS[e.cat] || 'Entscheidung') + '</h3><div class="small">' + esc(it.txt) + '</div><div class="muted small" style="margin-top:4px">' + esc(X.CATS[e.cat] || '') + ' · Antwort ' + weeksLeft(st, it.exp) + '</div>' +
      '<div class="opts">' + it.opts.map(function (i) { var o = e.o[i]; return '<button class="sm" data-act="cxPick" data-uid="' + it.uid + '" data-i="' + i + '">' + esc(o.l) + (o.hint ? ' <span class="muted small">(' + esc(o.hint) + ')</span>' : '') + '</button>'; }).join('') + '</div></div></div></div>';
  }
  U.acts.cxPick = function (d) { var st = U.st, msg = X.resolve(st, +d.uid, +d.i); U.toast(msg, 4500); U.autosave(); U.render(); };
  function phaseTrack(cx) { return '<div class="cx-phases">' + X.PHASES.map(function (n, i) { return '<span class="' + (i === cx.phase ? 'on' : i < cx.phase ? 'done' : '') + '" title="' + esc(X.PHASE_TXT[i]) + '">' + esc(n) + '</span>'; }).join('') + '</div>'; }
  function compName(fx) { return fx.comp === 'cup' ? 'Pokal' : fx.comp === 'league' ? 'Liga' : fx.comp === 'euro' || /euro|cl|el/i.test(fx.comp) ? 'Europapokal' : fx.comp; }
  function levelBar(lvl) { var col = ['', '#22c55e', '#4ade80', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][lvl]; var h = '<div class="cx-lvl">'; for (var i = 6; i >= 1; i--) h += '<i class="' + (i >= lvl ? 'on' : '') + '" style="--c:' + col + '"></i>'; return h + '</div>'; }

  // ---------- Karriere-Zentrale ----------
  var oldProfile = U.screens.pkarriere;
  U.screens.pkarriere = function () {
    var st = U.st, pc = st && st.pc; if (!pc) return '<h1>Karriere</h1><p class="muted">Keine Spielerkarriere aktiv.</p>';
    if (pc.retired) return oldProfile();
    var cx = X.ensure(st), p = C.player(st), c = C.club(st); if (!p) return oldProfile();
    var h = '<h1>Karriere-Zentrale</h1>';
    h += '<div class="cx-hero">' + (c ? U.crest(c, 76) : '') + '<div style="flex:1;min-width:220px"><div class="muted small">Kapitel ' + (cx.phase + 1) + ' von 8</div><h2 style="margin:2px 0">' + esc(X.PHASES[cx.phase]) + '</h2><div class="small">' + esc(X.PHASE_TXT[cx.phase]) + '</div>' + phaseTrack(cx) + '</div>' +
      '<div class="grid g2" style="min-width:240px;gap:8px">' + U.kpi('Stärke', U.ovrBadge(p.ovr)) + U.kpi('Form', (p.form || 6).toFixed(1).replace('.', ',')) + U.kpi('Frische', Math.round(p.fitness)) + U.kpi('Trainer', Math.round(pc.trust)) + '</div></div>';
    // Nächster Termin
    var fx = (st.phase === 'season' || st.phase === 'preseason') && CM.fixture(st), nextTxt;
    if (st.phase === 'seasonEnd') nextTxt = 'Die Saison ist vorbei – weiter geht es mit der neuen Saison.';
    else if (p.youth) nextTxt = 'Jugendwoche: Training, Schule und Jugendliga. Der Profikader ist das Ziel.';
    else if (fx) { var o = st.clubs[fx.h === p.clubId ? fx.a : fx.h]; nextTxt = compName(fx) + ': ' + (fx.h === p.clubId ? 'Heimspiel gegen ' : 'Auswärts bei ') + '<b>' + esc(o.name) + '</b>. ' + (p.inj ? 'Du bist verletzt.' : p.susp > 0 ? 'Du bist gesperrt.' : 'Kaderplatz: ' + C.squadRank(st, p) + '. auf deiner Position.'); }
    else nextTxt = 'Keine Partie in dieser Woche.';
    h += '<div class="grid g21" style="margin-top:14px"><div>';
    h += '<div class="panel"><h2>' + U.lc('calendar-days', 17) + ' Diese Woche</h2><p>' + nextTxt + '</p>' +
      '<div class="row" style="gap:8px;align-items:center"><span class="muted small">Spielsituationen:</span><div class="seg">' + Object.keys(CM.MODES).map(function (k) { return '<button class="' + (CM.mode(st) === k ? 'on' : '') + '" data-act="cxMode" data-k="' + k + '" title="' + esc(CM.MODES[k].d) + '">' + esc(CM.MODES[k].n) + '</button>'; }).join('') + '</div></div>' +
      '<p class="muted small" style="margin-top:6px">' + esc(CM.MODES[CM.mode(st)].d) + ' Wochenplan: <b>' + esc(cx.plan.preset ? X.PRESETS[cx.plan.preset].n : 'Eigener Plan') + '</b> · <a href="#" data-act="nav" data-s="pwoche">ändern</a></p></div>';
    // Offene Entscheidungen
    var items = X.openItems(st);
    h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('mail', 17) + ' Offene Entscheidungen' + (items.length ? ' (' + items.length + ')' : '') + '</h2>' + (items.length ? items.map(function (it) { return inboxCard(st, it); }).join('') : '<p class="muted small">Nichts offen. Neue Nachrichten von Berater, Verein und Umfeld erscheinen hier – ohne Antwort gilt nach Ablauf der Frist die zurückhaltendste Option.</p>') + '</div>';
    // Letztes Spiel
    var lm = cx.lastMatch;
    if (lm) {
      h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('ball', 17) + ' Letztes Spiel: ' + esc(lm.home) + ' – ' + esc(lm.away) + ' ' + lm.score[0] + ':' + lm.score[1] + '</h2><p class="small">Note <b>' + (lm.rating ? lm.rating.toFixed(1).replace('.', ',') : '–') + '</b> · ' + lm.goals + ' ' + esc(X.SW.goals) + ' · ' + lm.decisions.length + ' Entscheidungen</p>' +
        (lm.decisions.length ? '<table class="t small">' + lm.decisions.map(function (d) { return '<tr><td class="num">' + d.min + '.</td><td>' + esc(d.l) + '</td><td>' + esc(CM.RESULT_TXT[d.r] || d.r) + (d.p != null ? ' <span class="muted">(' + d.p + ' %)</span>' : '') + '</td><td class="num">' + d.score[0] + ':' + d.score[1] + '</td></tr>'; }).join('') + '</table>' : '') + '</div>';
    }
    h += '</div><div>';
    // Ziele
    h += '<div class="panel"><h2>' + U.lc('target', 17) + ' Persönliche Ziele</h2>' + cx.prof.goals.map(function (k) { var g = X.GOALS[k], ok = cx.goalsDone[k] || (g && g.ok(st, p, pc)); return '<div class="row" style="gap:8px;margin-bottom:6px">' + (ok ? U.lc('circle-check', 16, 'ok') : U.lc('circle-dot', 16)) + '<span class="small">' + esc(g ? g.n : k) + '</span></div>'; }).join('') + '</div>';
    // Finanzen kurz
    var sec = PF.security(st);
    h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('wallet', 17) + ' Finanzen</h2><div class="grid g2">' + U.kpi('Nettovermögen', money(Math.round(sec.nw))) + U.kpi('Monatl. Saldo', sgn(sec.cf)) + '</div><div style="margin-top:8px">' + levelBar(sec.lvl) + '<div class="small" style="margin-top:4px"><b>' + esc(PF.LEVELS[sec.lvl]) + '</b> · Reserve ' + num(sec.months, 1) + ' Monate</div></div><div class="row" style="margin-top:8px"><button class="sm" data-act="nav" data-s="pfin">Zu meinen Finanzen</button></div></div>';
    // Berater kurz
    var a = AG.current(st), fa = FA.current(st);
    h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('briefcase', 17) + ' Umfeld</h2><p class="small">' + (a ? 'Spielerberater: <b>' + esc(a.n) + '</b> (' + esc(a.firm) + '), Vertrauen ' + Math.round(pc.ag.trust) : 'Kein Spielerberater – du verhandelst selbst.') + '<br>' + (fa ? 'Finanzberater: <b>' + esc(fa.n) + '</b> (' + esc(fa.firm) + ')' : 'Keine Finanzberatung – du verwaltest dein Geld selbst.') + '</p>' + (pc.offers.length ? '<p><b>' + pc.offers.length + ' Vertragsangebot(e)</b> liegen vor. <a href="#" data-act="nav" data-s="pberater">Ansehen</a></p>' : '') + '</div>';
    // Chronik kurz
    var ch = cx.chron.slice(-5).reverse();
    h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('bookmark', 17) + ' Zuletzt</h2>' + (ch.length ? ch.map(function (x) { return '<div class="cx-row small" style="margin-bottom:6px">' + tile(x.cat, x.ic) + '<div><b>' + esc(x.ti) + '</b><div class="muted">' + esc(x.x || '') + '</div></div></div>'; }).join('') : '<p class="muted small">Die Chronik füllt sich mit deiner Karriere.</p>') + '<div class="row"><button class="sm" data-act="nav" data-s="pchronik">Ganze Chronik</button></div></div>';
    h += '</div></div>';
    return h;
  };
  U.acts.cxMode = function (d) { CM.setMode(U.st, d.k); U.autosave(); U.render(); U.renderTop(); };

  // ---------- Wochenplan ----------
  U.screens.pwoche = function () {
    var st = U.st, cx = X.ensure(st), a = cx.plan.a, used = X.planCost(a), p = C.player(st), f = X.planFx(st);
    var h = '<h1>Wochenplan</h1><p class="muted">Jede Woche hast du ' + X.BUDGET + ' Zeiteinheiten. Der Plan gilt, bis du ihn änderst – gewöhnliche Wochen laufen damit automatisch durch.</p>';
    h += '<div class="panel"><h2>Vorlagen</h2><div class="row" style="gap:6px;flex-wrap:wrap">' + Object.keys(X.PRESETS).map(function (k) { return '<button class="' + (cx.plan.preset === k ? 'primary' : '') + '" data-act="cxPreset" data-k="' + k + '">' + esc(X.PRESETS[k].n) + '</button>'; }).join('') + '</div></div>';
    h += '<div class="grid g21" style="margin-top:14px"><div class="panel"><h2>Aktivitäten <span class="muted small">' + used + ' / ' + X.BUDGET + ' Einheiten</span></h2>' + U.bar(used, X.BUDGET, used >= X.BUDGET ? 'var(--amber)' : '') +
      '<table class="t cx-plan" style="margin-top:10px">' + Object.keys(X.ACTS).map(function (k) {
        var x = X.ACTS[k], n = k === 'team' ? 1 : (a[k] || 0), minor = p && p.age < 18;
        if (k === 'agent' && !AG.current(st)) return '';
        return '<tr><td style="width:34px">' + ic(x.ic, 18) + '</td><td><b>' + esc(x.n) + '</b> <span class="muted small">(' + x.c + ' Einh.)</span><div class="muted small">' + esc(x.d) + '</div></td><td class="num">' + (x.fixed || (k === 'school' && minor && n <= 1) ? '<b>' + n + '×</b> <span class="muted small">Pflicht</span>' : '<span class="pm"><button class="sm" data-act="cxPlan" data-k="' + k + '" data-d="-1"' + (n ? '' : ' disabled') + '>−</button><b>' + n + '</b><button class="sm" data-act="cxPlan" data-k="' + k + '" data-d="1">+</button></span>') + '</td></tr>';
      }).join('') + '</table></div>';
    function eff(l, v, unit, good) { var cls = v === 0 ? '' : (v > 0) === good ? 'ok' : 'bad'; return '<tr><td>' + l + '</td><td class="num"><span class="cx-pill ' + cls + '">' + (v > 0 ? '+' : '') + unit(v) + '</span></td></tr>'; }
    h += '<div class="panel"><h2>Wirkung pro Woche</h2><table class="t small">' +
      eff('Entwicklung', f.dev, function (v) { return Math.round(v * 100) + ' %'; }, true) + eff('Frische', f.fit, function (v) { return Math.round(v); }, true) + eff('Trainervertrauen', f.trust, function (v) { return v.toFixed(1).replace('.', ','); }, true) +
      eff('Bekanntheit', f.fame, function (v) { return v.toFixed(1).replace('.', ','); }, true) + eff('Verletzungsrisiko', f.inj * 100, function (v) { return v.toFixed(1).replace('.', ',') + ' %-Pkt.'; }, false) + '</table>' +
      '<p class="muted small" style="margin-top:8px">Persönlichkeit wirkt mit: Disziplin und Ehrgeiz verbessern die Entwicklung, hoher Stress bremst sie. Aktuell: Disziplin ' + Math.round(cx.per.disc) + ', Ehrgeiz ' + Math.round(cx.per.amb) + ', Stress ' + Math.round(cx.per.stress) + '.</p>' +
      (p && p.inj ? '<div class="help">' + U.lc('stethoscope', 14) + ' Verletzt: Physiotherapie beschleunigt die Heilung, Training bringt diese Woche nichts.</div>' : '') + '</div></div>';
    return h;
  };
  U.acts.cxPlan = function (d) { var r = X.setPlan(U.st, d.k, +d.d); if (!r.ok && r.why) U.toast(r.why); U.autosave(); U.render(); };
  U.acts.cxPreset = function (d) { X.usePreset(U.st, d.k); U.autosave(); U.render(); };

  // ---------- Spieltag (interaktiv) ----------
  var baseNext = U.acts.next;
  U.acts.next = function () {
    var st = U.st;
    if (!on(st) || st.pc.retired || U.busy) return baseNext();
    if (U.pcm) { U.go('pspiel'); return; }
    if (st.pendingEvent || (st.phase !== 'season' && st.phase !== 'preseason') || U.screen === 'bericht' || (S.planEventOpen && S.planEventOpen(st))) return baseNext();
    var fx = CM.fixture(st), p = C.player(st);
    if (fx && CM.mode(st) !== 'aus' && !U.autoRun && p && !p.inj && !(p.susp > 0)) {
      var m = S.createMatch(st, fx), s = fx.h === p.clubId ? 0 : 1;
      if (m.played[p.id] != null || m.bench[s].indexOf(p.id) >= 0) { CM.plan(m, st); U.pcm = { m: m, fx: fx, s: s, inst: null, last: null, fast: false }; U.go('pspiel'); return; }
      U.toast('Du stehst diesmal nicht im Spieltagskader.', 3500);
    }
    baseNext();
  };
  var TICK_IC = { goal: HB ? '🤾' : '⚽', save: '🧤', miss: '↗️', yellow: '🟨', red: '🟥', injury: '🚑', sub: '🔁', chance: '⚡', tactic: '📋', kickoff: '🏁', info: '•', half: '⏸️', end: '🏁', timeout: '⏱️' };
  function tickerLine(m, e, pid) { var me = e.pid === pid || e.pid2 === pid; return '<div class="' + (me ? 'me ' : '') + (e.type === 'goal' ? 'goal' : '') + '"><span class="muted">' + (e.min || 0) + '\'</span> ' + (e.twomin ? '⏱️' : TICK_IC[e.type] || '•') + ' ' + esc(e.text || '') + '</div>'; }
  function coachLine(m, s, pc) {
    var diff = m.score[s] - m.score[1 - s], late = m.minute > (HB ? 45 : 70);
    var t = diff < 0 && late ? 'Mehr Risiko! Wir brauchen ein Tor.' : diff > 0 && late ? 'Ergebnis verwalten, keine unnötigen Fehler.' : diff < 0 ? 'Geduld, wir kommen zurück. Bleib bei deinen Aufgaben.' : 'Kompakt bleiben und die Chancen nutzen.';
    return t + (pc.trust < 35 ? ' (Der Trainer beobachtet dich kritisch.)' : pc.trust > 70 ? ' (Der Trainer setzt auf dich.)' : '');
  }
  function fieldSvg() { // kleine Spielfeld-Illustration
    if (HB) return '<svg viewBox="0 0 200 100" width="100%" height="70" aria-hidden="true"><rect x="2" y="2" width="196" height="96" rx="6" fill="#c9773c" opacity=".35" stroke="currentColor" stroke-opacity=".4"/><line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" stroke-opacity=".5"/><path d="M2 20 A 30 30 0 0 1 2 80" fill="none" stroke="currentColor" stroke-opacity=".5"/><path d="M198 20 A 30 30 0 0 0 198 80" fill="none" stroke="currentColor" stroke-opacity=".5"/></svg>';
    return '<svg viewBox="0 0 200 100" width="100%" height="70" aria-hidden="true"><rect x="2" y="2" width="196" height="96" rx="6" fill="#16a34a" opacity=".35" stroke="currentColor" stroke-opacity=".4"/><line x1="100" y1="2" x2="100" y2="98" stroke="currentColor" stroke-opacity=".5"/><circle cx="100" cy="50" r="14" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="2" y="28" width="22" height="44" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="176" y="28" width="22" height="44" fill="none" stroke="currentColor" stroke-opacity=".5"/></svg>';
  }
  U.screens.pspiel = function () {
    var st = U.st, g = U.pcm; if (!g) return U.screens.pkarriere();
    var m = g.m, s = g.s, p = C.player(st), H = st.clubs[m.clubs[0]], A = st.clubs[m.clubs[1]], pid = p.id;
    var full = HB ? 60 : 90, inj = m.injured[pid], off = m.sentOff[pid], onP = m.onPitch[s].indexOf(pid) >= 0;
    var h = '<div class="cx-score">' + U.crest(H, 54) + '<div style="text-align:center"><div class="muted small">' + esc(H.short) + ' – ' + esc(A.short) + ' · ' + esc(compName(g.fx)) + '</div><div class="sc">' + m.score[0] + ':' + m.score[1] + '</div><div class="small"><b>' + (m.finished ? 'Abpfiff' : m.minute + '. Minute') + '</b></div></div>' + U.crest(A, 54) + '</div>';
    h += '<div style="margin:8px 0">' + U.bar(Math.min(m.minute, full), full) + '</div>';
    h += '<div class="grid g21"><div>';
    if (g.inst) {
      h += '<div class="cx-scene"><div class="muted small">' + g.inst.min + '. Minute · Entscheidung</div><h2 style="margin:4px 0 6px">' + esc(g.inst.t) + '</h2><div class="opts">' + g.inst.labels.map(function (o) { return '<button data-act="cmPick" data-i="' + o.i + '">' + esc(o.l) + (o.hint ? ' <span class="muted small">(' + esc(o.hint) + ')</span>' : '') + '</button>'; }).join('') + '</div><p class="muted small" style="margin-top:10px">Die Erfolgsaussichten hängen von Fähigkeiten, Frische, Form, Selbstvertrauen, Gegner, Trainervertrauen und Teamchemie ab. Nichts ist garantiert.</p></div>';
    } else if (m.finished) {
      var lg = m.pc.log;
      h += '<div class="panel"><h2>Spielbericht</h2><p>Endstand <b>' + m.score[0] + ':' + m.score[1] + '</b>. Deine Note: <b>' + (m.rating[pid] ? m.rating[pid].toFixed(1).replace('.', ',') : '–') + '</b>' + (m.goals[pid] ? ', ' + m.goals[pid] + ' ' + esc(m.goals[pid] === 1 ? X.SW.goal : X.SW.goals) : '') + (m.assists[pid] ? ', ' + m.assists[pid] + ' Vorlage(n)' : '') + '.</p>' +
        (lg.length ? '<table class="t small">' + lg.map(function (d) { return '<tr><td class="num">' + d.min + '.</td><td>' + esc(d.l) + '</td><td>' + esc(CM.RESULT_TXT[d.r] || d.r) + (d.p != null ? ' <span class="muted">(' + d.p + ' %)</span>' : '') + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Keine Entscheidungssituationen in diesem Spiel.</p>') +
        '<div class="row" style="margin-top:12px"><button class="primary" data-act="cmDone">' + U.lc('check', 15) + ' Spieltag abschließen</button></div></div>';
    } else {
      if (g.last) h += '<div class="cx-card" style="--c:' + (g.last.r === 'goal' ? 'var(--green)' : ['card', 'red', 'injury'].indexOf(g.last.r) >= 0 ? 'var(--red)' : 'var(--blue)') + '"><b>' + esc(g.last.l) + '</b> → ' + esc(CM.RESULT_TXT[g.last.r] || g.last.r) + (g.last.p != null ? ' <span class="muted small">(Erfolgschance etwa ' + g.last.p + ' %)</span>' : '') + '</div>';
      h += '<div class="panel"><div class="row" style="gap:8px;flex-wrap:wrap">' + (g.timer ? '<button data-act="cmPause">' + U.lc('pause', 15) + ' Pause</button>' : '<button class="primary" data-act="cmRun">' + U.lc('play', 15) + (m.minute ? ' Weiter' : ' Anpfiff') + '</button>') +
        '<button data-act="cmFast">' + U.lc('fast-forward', 15) + (g.fast ? ' Normal' : ' Schneller') + '</button><button data-act="cmSim" title="Ohne weitere Entscheidungen zu Ende spielen">' + U.lc('timer', 15) + ' Rest simulieren</button></div>' +
        '<p class="muted small" style="margin-top:8px">' + (m.pc.at.length ? 'Noch etwa ' + m.pc.at.length + ' Situation(en) können auf dich zukommen.' : 'Keine weiteren Entscheidungen geplant.') + '</p></div>';
    }
    h += '<div class="panel" style="margin-top:12px"><h2>Live-Ticker</h2><div class="cx-ticker">' + m.events.slice().reverse().slice(0, 40).map(function (e) { return tickerLine(m, e, pid); }).join('') + '</div></div></div>';
    h += '<div><div class="panel">' + fieldSvg() + '<h2 style="margin-top:6px">' + esc(W.playerName(p)) + '</h2><table class="t small">' +
      '<tr><td>Status</td><td class="num">' + (inj ? '<span class="cx-pill bad">verletzt</span>' : off ? '<span class="cx-pill bad">vom Platz gestellt</span>' : onP ? '<span class="cx-pill ok">auf dem Feld</span>' : m.bench[s].indexOf(pid) >= 0 ? '<span class="cx-pill">auf der Bank</span>' : '<span class="cx-pill">ausgewechselt</span>') + '</td></tr>' +
      '<tr><td>Note</td><td class="num"><b>' + (m.rating[pid] ? m.rating[pid].toFixed(1).replace('.', ',') : '–') + '</b></td></tr>' + barRow('Frische', m.fit[pid] != null ? m.fit[pid] : p.fitness) + barRow('Selbstvertrauen', st.pc.cx.per.conf) + barRow('Trainervertrauen', st.pc.trust) +
      '<tr><td>' + esc(X.SW.goals) + '</td><td class="num">' + (m.goals[pid] || 0) + '</td></tr>' + (HB ? '<tr><td>Zeitstrafen</td><td class="num">' + (m.twoMins[pid] || 0) + '</td></tr>' : '<tr><td>Karten</td><td class="num">' + (m.yellows[pid] ? '🟨'.repeat(Math.min(2, m.yellows[pid])) : '–') + '</td></tr>') + '</table>' +
      '<div class="help" style="margin-top:10px">' + U.lc('megaphone', 14) + ' <b>Trainer:</b> ' + esc(coachLine(m, s, st.pc)) + '</div></div>' +
      '<div class="panel" style="margin-top:12px"><h2>Statistik</h2><table class="t small"><tr><td>' + (HB ? 'Würfe' : 'Schüsse') + '</td><td class="num">' + m.stats.shots[0] + ' – ' + m.stats.shots[1] + '</td></tr><tr><td>Aufs Tor</td><td class="num">' + m.stats.onTarget[0] + ' – ' + m.stats.onTarget[1] + '</td></tr>' + (HB ? '<tr><td>Paraden</td><td class="num">' + m.stats.saves[0] + ' – ' + m.stats.saves[1] + '</td></tr><tr><td>Zeitstrafen</td><td class="num">' + m.stats.twoMin[0] + ' – ' + m.stats.twoMin[1] + '</td></tr>' : '') + '</table></div></div></div>';
    return h;
  };
  function stopTimer(g) { if (g && g.timer) { clearTimeout(g.timer); g.timer = null; } }
  function stepLoop() {
    var g = U.pcm; if (!g) return; var m = g.m;
    if (m.finished) { stopTimer(g); U.render(); return; }
    M_step(m); var inst = CM.next(m);
    if (inst) { stopTimer(g); g.inst = inst; g.last = null; U.render(); return; }
    if (m.finished) { stopTimer(g); U.render(); return; }
    if (U.screen === 'pspiel') U.render();
    g.timer = setTimeout(stepLoop, g.fast ? 25 : 140);
  }
  function M_step(m) { R.match.step(m); }
  U.acts.cmRun = function () { var g = U.pcm; if (!g || g.timer) return; g.last = null; g.timer = setTimeout(stepLoop, 10); U.render(); };
  U.acts.cmPause = function () { stopTimer(U.pcm); U.render(); };
  U.acts.cmFast = function () { var g = U.pcm; if (g) g.fast = !g.fast; U.render(); };
  U.acts.cmSim = function () { var g = U.pcm; if (!g) return; stopTimer(g); g.m.pc.at = []; g.inst = null; while (!g.m.finished) M_step(g.m); U.render(); };
  U.acts.cmPick = function (d) { var g = U.pcm; if (!g || !g.inst) return; var e = CM.choose(g.m, g.inst, +d.i); g.inst = null; g.last = e; U.render(); setTimeout(function () { if (U.pcm === g && !g.inst && !g.m.finished && !g.timer) U.acts.cmRun(); }, 1300); };
  U.acts.cmDone = function () {
    var g = U.pcm, st = U.st; if (!g) return; stopTimer(g);
    CM.wrap(st, g.m); var played = {}; played[g.fx.key] = g.m; U.pcm = null;
    U.finishWeek(played);
  };

  // ---------- Automatik: gewöhnliche Wochen überspringen ----------
  var baseAuto = U.acts.autoStart;
  U.acts.autoStart = function () {
    var st = U.st; if (!on(st) || st.pc.retired) return baseAuto();
    U.autoRun = true; U.renderTop();
    var n0 = X.ensure(st).inbox.length;
    (function loop() {
      if (!U.autoRun) return; var st2 = U.st, pc = st2.pc;
      var stop = st2.pendingEvent || st2.phase === 'seasonEnd' || pc.retired || X.ensure(st2).inbox.length > n0 || (pc.offers.length && pc.offersSeen !== pc.offerSeason) || (st2.celebrations && st2.celebrations.length);
      if (stop) { U.autoRun = false; U.render(); U.renderTop(); if (st2.pendingEvent) setTimeout(U.showEvent, 200); else if (st2.phase === 'seasonEnd') U.go('saisonende'); return; }
      U.finishWeek({}); n0 = Math.min(n0, X.ensure(st2).inbox.length); U.renderTop(); if (U.screen === 'pkarriere') U.render();
      setTimeout(loop, 220);
    })();
  };
  var baseFinish = U.finishWeek;
  U.finishWeek = function (played) {
    var st = U.st; baseFinish(played);
    if (on(st) && !U.autoRun && st.pendingEvent && !document.querySelector('#modal:not(.hidden)')) setTimeout(function () { if (U.st.pendingEvent) U.showEvent(); }, 450);
  };

  // ---------- Spielerprofil ----------
  U.screens.pprofil = function () {
    var st = U.st, cx = X.ensure(st), p = C.player(st); if (!p) return oldProfile();
    var pr = cx.prof, h = oldProfile();
    var extra = '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Steckbrief</h2><table class="t small cx-attr">' +
      '<tr><td>Nationalität</td><td>' + esc(pr.nat) + '</td></tr><tr><td>Heimatort</td><td>' + esc(pr.home || '–') + '</td></tr>' +
      '<tr><td>Positionen</td><td>' + esc(D.posNames[p.pos] || p.pos) + (pr.pos2.length ? ' <span class="muted">(auch ' + pr.pos2.map(function (k) { return esc(D.posNames[k] || k); }).join(', ') + ')</span>' : '') + '</td></tr>' +
      '<tr><td>Größe / Körperbau</td><td>' + pr.height + ' cm · ' + esc((X.BUILDS[pr.build] || {}).n || pr.build) + '</td></tr><tr><td>Spielstil</td><td>' + esc((X.STYLES[pr.style] || {}).n || pr.style) + '</td></tr>' +
      '<tr><td>Stärken</td><td>' + (pr.str.map(function (k) { return '<span class="cx-pill ok">' + esc(X.TRAITS[k]) + '</span>'; }).join('') || '–') + '</td></tr><tr><td>Schwächen</td><td>' + (pr.weak.map(function (k) { return '<span class="cx-pill bad">' + esc(X.TRAITS[k]) + '</span>'; }).join('') || '–') + '</td></tr>' +
      '<tr><td>Ausbildung</td><td>' + (cx.edu >= 100 ? 'Abschluss' : Math.round(cx.edu) + ' %') + '</td></tr>' + (cx.captain ? '<tr><td>Rolle</td><td><span class="cx-pill ok">Kapitän</span></td></tr>' : '') + '</table></div>' +
      '<div class="panel"><h2>Persönlichkeit</h2><table class="t small">' + Object.keys(X.PER).map(function (k) { return barRow(esc(X.PER[k]), cx.per[k]); }).join('') + '</table><p class="muted small">Deine Entscheidungen verändern diese Werte – und damit, welche Möglichkeiten sich später eröffnen.</p></div></div>';
    return h + extra;
  };

  // ---------- Beziehungen ----------
  var KIND = { capt: 'Kapitän', rival: 'Positionsrivale', friend: 'Freund im Team', mentor: 'Mentor', oldrival: 'Alte Rivalität' };
  U.screens.pbez = function () {
    var st = U.st, cx = X.ensure(st), pc = st.pc;
    var h = '<h1>Beziehungen</h1><div class="grid g2"><div class="panel"><h2>Dein Umfeld</h2><table class="t small">' + barRow('Trainer', pc.trust) + Object.keys(cx.rel).map(function (k) { return barRow(esc(X.REL[k] || k), cx.rel[k]); }).join('') +
      (AG.current(st) ? barRow('Spielerberater', pc.ag.trust) : '') + (FA.current(st) ? barRow('Finanzberater', pc.fa.trust) : '') + '</table></div>';
    h += '<div class="panel"><h2>Bezugspersonen</h2>' + (cx.ppl.length ? cx.ppl.map(function (x) { var q = st.players[x.pid]; return '<div class="cx-row" style="margin-bottom:10px">' + tile(x.kind === 'rival' || x.kind === 'oldrival' ? 'rival' : x.kind === 'friend' ? 'freund' : 'team', { capt: '©️', rival: '⚔️', friend: '🤝', mentor: '🧭', oldrival: '🗡️' }[x.kind]) + '<div style="flex:1"><b>' + esc(x.name) + '</b> <span class="muted small">' + esc(KIND[x.kind] || x.kind) + (q ? ' · ' + q.age + ' J. · ' + esc(D.posNames[q.pos] || q.pos) + ' · Stärke ' + q.ovr : '') + '</span>' + U.bar(x.v) + '</div></div>'; }).join('') : '<p class="muted small">Noch keine engen Bezugspersonen.</p>') + '</div></div>';
    var notes = [];
    if (X.mem(st, 'captCrit') >= 2) notes.push('Du hast den Kapitän mehrfach öffentlich kritisiert – er wird dich bei Abstimmungen nicht unterstützen.');
    if (X.mem(st, 'subProtest') >= 2) notes.push('Deine Proteste bei Auswechslungen sind dem Trainer in Erinnerung geblieben.');
    if (cx.rel.family < 35) notes.push('Das Verhältnis zur Familie ist angespannt – als Minderjähriger brauchst du ihre Zustimmung zu Verträgen.');
    if (cx.rel.press < 30) notes.push('Die Medien berichten kritisch über dich.');
    if (cx.rel.fans > 75) notes.push('Die Fans stehen voll hinter dir.');
    h += '<div class="panel" style="margin-top:14px"><h2>Was dein Umfeld nicht vergisst</h2>' + (notes.length ? '<ul class="small">' + notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Bisher keine nachwirkenden Konflikte.</p>') + '</div>';
    return h;
  };

  // ---------- Berater & Verträge ----------
  var REC = { accept: ['Annehmen', 'ok'], reject: ['Ablehnen', 'bad'], neutral: ['Neutral', 'warn'] };
  function stars(n) { return '★★★★★'.slice(0, n) + '<span class="muted">' + '★★★★★'.slice(n) + '</span>'; }
  function agAttrTable(st, a) { return '<table class="t small cx-attr">' + Object.keys(AG.ATTR).map(function (k) { return '<tr><td>' + esc(AG.ATTR[k]) + '</td><td class="num">' + esc(AG.shown(st, a, k)) + '</td></tr>'; }).join('') + '</table><p class="muted small">„?“ = noch unbekannt. Eigenschaften zeigen sich mit der Zeit, durch Nachfragen und zweite Meinungen.</p>'; }
  U.screens.pberater = function () {
    var st = U.st, pc = st.pc, p = C.player(st), ag = AG.ensure(st), a = AG.current(st), r = AG.rules(st);
    var h = '<h1>Berater & Verträge</h1>';
    // Angebote
    h += '<div class="panel"><h2>' + U.lc('pen-line', 17) + ' Vertragsangebote</h2>';
    if (pc.offers.length) pc.offersSeen = pc.offerSeason;
    if (pc.moving) h += '<p>' + U.lc('arrow-left-right', 15) + ' Wechsel zu <b>' + esc(st.clubs[pc.moving.to].name) + '</b> zur neuen Saison ist vereinbart.</p>';
    else if (!pc.offers.length) h += '<p class="muted small">Zurzeit keine Angebote. Ab der Rückrunde melden sich Vereine – öfter mit Berater, guter Form und hoher Bekanntheit.</p>' + (p && p.youth ? '<button data-act="pcAskPro">' + U.lc('pencil', 15) + ' Nach Profivertrag fragen</button>' : '');
    else h += pc.offers.map(function (o) {
      AG.enrich(st, o); var oc = st.clubs[o.clubId], rec = o.rec;
      return '<div class="cx-card" style="--c:' + (o.renew ? 'var(--green)' : 'var(--blue)') + '"><div class="cx-row">' + U.crest(oc, 44) + '<div style="flex:1"><h3>' + esc(oc.name) + ' <span class="muted small">' + esc(D.leagueNames[oc.league] || '') + ' · ' + (o.renew ? 'Vertragsverlängerung' : esc(o.role)) + '</span></h3>' +
        '<div class="small"><b>' + money(o.wage) + '</b>/Jahr' + (o.wage0 && o.wage !== o.wage0 ? ' <span class="muted">(ursprünglich ' + money(o.wage0) + ')</span>' : '') + ' · ' + o.years + ' Jahre · ' + (o.renew ? 'keine Ablöse' : o.fee ? 'Ablöse ' + money(o.fee) : 'ablösefrei') + '</div>' +
        (o.chk && o.chk.info ? '<div class="small">Einsatzchancen: <b>' + esc(o.info.chance) + '</b>' + (o.chk.second ? ' (Rang ' + o.info.rank + ', geprüft)' : '') + '</div>' : '') +
        (o.cl && o.cl.length ? '<div class="small">' + (o.chk && o.chk.clauses ? 'Klauseln: ' + o.cl.map(function (k) { return '<span class="cx-pill ' + (k === 'ausstieg' ? 'ok' : 'warn') + '">' + esc(AG.CLAUSES[k]) + '</span>'; }).join('') : '<span class="cx-pill warn">' + o.cl.length + ' Klausel(n) ungeprüft</span>') + '</div>' : '') +
        (rec ? '<div class="help" style="margin-top:6px">' + U.lc('briefcase', 14) + ' <b>' + esc(a ? a.n : 'Berater') + ':</b> <span class="cx-pill ' + REC[rec.r][1] + '">' + REC[rec.r][0] + '</span> „' + esc(rec.txt) + '“' + (rec.flagged.length ? ' Hinweis auf: ' + rec.flagged.map(function (k) { return esc(AG.CLAUSES[k]); }).join('; ') + '.' : '') + '</div>' : (a ? '' : '<div class="muted small" style="margin-top:4px">Ohne Berater: Du prüfst und verhandelst selbst.</div>')) +
        '<div class="opts row" style="gap:6px;flex-wrap:wrap;margin-top:8px">' + (o.chk && o.chk.info ? '' : '<button class="sm" data-act="agInfo" data-id="' + o.id + '">Einsatzchancen erfragen</button>') + (o.chk && o.chk.coach ? '' : '<button class="sm" data-act="agCoach" data-id="' + o.id + '">Mit dem Trainer sprechen</button>') + (o.chk && o.chk.second ? '' : '<button class="sm" data-act="agSecond" data-id="' + o.id + '">Zweite Meinung (Anwalt)</button>') +
        ((o.negN || 0) < 2 ? ['moderat', 'hoch', 'extrem'].map(function (l) { return '<button class="sm" data-act="agNeg" data-id="' + o.id + '" data-l="' + l + '">Nachverhandeln: ' + l + '</button>'; }).join('') : '') +
        '<button class="sm primary" data-act="pcAccept" data-id="' + o.id + '">Annehmen</button><button class="sm" data-act="pcDecline" data-id="' + o.id + '">Ablehnen</button></div></div></div></div>';
    }).join('');
    h += '</div>';
    // Aktueller Berater
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>' + U.lc('briefcase', 17) + ' Dein Spielerberater</h2>';
    if (a) {
      var left = Math.max(0, ag.con.until - tick(st));
      h += '<div class="cx-row">' + tile('berater', '💼') + '<div><b>' + esc(a.n) + '</b> · ' + esc(a.firm) + '<div class="muted small">' + esc(AG.TYPES[a.ty].n) + ' · Ruf ' + stars(a.rep) + '</div></div></div>' +
        '<table class="t small" style="margin-top:8px"><tr><td>Vertrag</td><td class="num">noch ' + Math.ceil(left / 52 * 10) / 10 + ' Jahre</td></tr><tr><td>Gehaltsbeteiligung</td><td class="num">' + pct(ag.con.fee) + (ag.con.minor ? ' (minderjährig: ruht)' : '') + '</td></tr><tr><td>Transferprovision (zahlt der Verein)</td><td class="num">' + pct(ag.con.tf || a.tf) + '</td></tr>' +
        barRow('Vertrauen', ag.trust) + '</table>' + '<div class="row" style="gap:8px;margin-top:8px;align-items:center"><span class="small">Verhandlungsvollmacht: <b>' + (ag.con.power ? 'erteilt' : 'nicht erteilt') + '</b></span><button class="sm" data-act="agPower">' + (ag.con.power ? 'Entziehen' : 'Erteilen') + '</button></div>' +
        '<p class="muted small">Ohne Vollmacht darf der Berater nichts verbindlich abschließen – er bereitet vor, du entscheidest.</p>' + agAttrTable(st, a) +
        '<div class="row" style="margin-top:8px"><button class="sm danger" data-act="agFire">Berater kündigen' + (AG.fireCost(st) ? ' (Abfindung ' + money(AG.fireCost(st)) + ')' : '') + '</button></div>';
    } else h += '<p class="small">Du vertrittst dich selbst: keine Provisionen, aber schwächere Verhandlungsposition und weniger Informationen über Vereine.</p>' + (p && p.age < r.minorAge ? '<p class="muted small">Minderjährig: Beraterverträge brauchen die Zustimmung deiner Eltern und dürfen keine Vergütung vorsehen.</p>' : '');
    h += '<p class="muted small" style="margin-top:8px">Regeln (' + esc(C.CFG.sport) + '): Beraterverträge höchstens ' + r.maxYears + ' Jahre, Gehaltsbeteiligung höchstens ' + pct(r.maxFee) + '.</p></div>';
    // Markt / Vergleich
    var mk = AG.market(st);
    h += '<div class="panel"><h2>' + U.lc('users', 17) + ' Berater, die dich vertreten wollen</h2>' + (mk.length ? '<div class="scroll"><table class="t small"><tr><th>Berater</th><th>Typ</th><th>Ruf</th><th class="num">Beteiligung</th><th class="num">Ehrlichkeit</th><th class="num">Netzwerk</th><th></th></tr>' + mk.map(function (x) { var t = AG.terms(st, x); return '<tr><td><b>' + esc(x.n) + '</b><div class="muted">' + esc(x.firm) + '</div></td><td>' + esc(AG.TYPES[x.ty].n) + '</td><td>' + stars(x.rep) + '</td><td class="num">' + pct(t.fee) + '</td><td class="num">' + esc(AG.shown(st, x, 'hon')) + '</td><td class="num">' + esc(AG.shown(st, x, 'net')) + '</td><td class="num"><button class="sm" data-act="agView" data-id="' + x.id + '">Profil</button></td></tr>'; }).join('') + '</table></div>' : '<p class="muted small">Noch interessiert sich niemand. Mit Leistungen und Bekanntheit wächst das Interesse.</p>') + '</div></div>';
    // Empfehlungen & Verlauf
    var recs = ag.recs.slice(0, 10);
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Empfehlungen & ob du ihnen gefolgt bist</h2>' + (recs.length ? '<table class="t small"><tr><th>Saison</th><th>Verein</th><th>Rat</th><th>Gefolgt</th><th>Ergebnis</th></tr>' + recs.map(function (x) { var c2 = st.clubs[x.club]; return '<tr><td>' + x.s + '</td><td>' + esc(c2 ? c2.short : '?') + '</td><td><span class="cx-pill ' + REC[x.r][1] + '">' + REC[x.r][0] + '</span></td><td>' + (x.followed == null ? '–' : x.followed ? 'ja' : 'nein') + '</td><td>' + esc(x.res || '') + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Empfehlungen.</p>') + '</div>' +
      '<div class="panel"><h2>Verlauf</h2>' + (ag.hist.length ? '<ul class="small">' + ag.hist.slice(-12).reverse().map(function (x) { return '<li>' + (x.n ? esc(x.n) + ': ' + esc(x.why || '') : esc(x.why || '')) + (x.d ? ' <span class="muted">(' + (x.d > 0 ? '+' : '') + x.d + ')</span>' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Noch nichts passiert.</p>') + '</div></div>';
    return h;
  };
  function offerMsg(t) { U.toast(t, 5500); U.autosave(); U.render(); }
  U.acts.agInfo = function (d) { offerMsg(AG.askInfo(U.st, d.id)); };
  U.acts.agCoach = function (d) { offerMsg(AG.talkCoach(U.st, d.id)); };
  U.acts.agSecond = function (d) { offerMsg(AG.secondOpinion(U.st, d.id)); };
  U.acts.agNeg = function (d) { offerMsg(AG.negotiate(U.st, d.id, d.l).msg); };
  U.acts.agPower = function () { var ag = AG.ensure(U.st); AG.setPower(U.st, !(ag.con && ag.con.power)); U.autosave(); U.render(); };
  U.acts.agFire = function () { U.confirm('Berater kündigen', 'Vertrag vorzeitig beenden?' + (AG.fireCost(U.st) ? ' Die Abfindung beträgt ' + money(AG.fireCost(U.st)) + '.' : ''), function () { var r = AG.fire(U.st); U.toast(r.ok ? 'Der Vertrag ist beendet.' : r.why); U.autosave(); U.render(); }); };
  U.acts.agView = function (d) {
    var st = U.st, a = AG.get(st, d.id); if (!a) return; var t = AG.terms(st, a), pi = AG.publicInfo(st, a);
    U.modal('Berater: ' + esc(a.n), '<p><b>' + esc(a.firm) + '</b> · ' + esc(pi.type) + ' · Ruf ' + stars(a.rep) + '</p><p class="help">„' + esc(a.self) + '“</p>' +
      '<p class="small">Konditionen: ' + t.years + ' Jahre, Gehaltsbeteiligung ' + pct(t.fee) + ', Transferprovision ' + pct(t.tf) + (t.minor ? ' – als Minderjähriger ohne Vergütung, Eltern müssen zustimmen.' : '') + '</p>' +
      (pi.clients.length ? '<p class="small">Klienten u. a.: ' + pi.clients.map(function (c) { return esc(c.name) + ' (' + esc(st.clubs[c.clubId] ? st.clubs[c.clubId].short : '?') + ')'; }).join(', ') + '</p>' : '') + agAttrTable(st, a),
      '<button data-act="closeModal">Schließen</button><button data-act="agSign" data-id="' + a.id + '" data-p="0">Unterschreiben</button><button class="primary" data-act="agSign" data-id="' + a.id + '" data-p="1">Unterschreiben mit Vollmacht</button>', true);
  };
  U.acts.agSign = function (d) { var r = AG.sign(U.st, d.id, { power: d.p === '1' }); U.closeModal(); U.toast(r.ok ? 'Neuer Berater unter Vertrag.' : r.why, 4500); U.autosave(); U.render(); };

  // ---------- Meine Finanzen ----------
  U.pfTab = U.pfTab || 'cockpit';
  U.acts.pfTab = function (d) { U.pfTab = d.k; U.render(); };
  U.screens.pfin = function () {
    var st = U.st, tabs = { cockpit: 'Cockpit', leben: 'Lebensstil & Absicherung', anlage: 'Konten & Anlagen', immo: 'Immobilien', kredit: 'Kredite', berat: 'Finanzberatung' };
    var h = '<h1>Meine Finanzen</h1><div class="cx-tabs">' + Object.keys(tabs).map(function (k) { return '<button class="sm ' + (U.pfTab === k ? 'on' : '') + '" data-act="pfTab" data-k="' + k + '">' + esc(tabs[k]) + '</button>'; }).join('') + '</div>';
    return h + (FIN[U.pfTab] || FIN.cockpit)(st);
  };
  var FIN = {};
  FIN.cockpit = function (st) {
    var f = PF.ensure(st), w = f.w, m = PF.monthly(st), sec = PF.security(st), rp = PF.realty(st), cx = X.ensure(st);
    var h = '<div class="grid g4">' + U.kpi('Kontostand', money(Math.round(w.cash)), w.cash < 0 ? 'neg' : '') + U.kpi('Tagesgeld', money(Math.round(w.savings))) + U.kpi('Aktien', money(Math.round(PF.stocks(st)))) + U.kpi('Krypto', money(Math.round(PF.crypto(st)))) +
      U.kpi('Immobilien', money(Math.round(PF.homesValue(st) + rp.value))) + U.kpi('Produkte (Beratung)', money(Math.round(FA.productsValue(st)))) + U.kpi('Verbindlichkeiten', money(Math.round(PF.debt(st)))) + U.kpi('Nettovermögen', '<b>' + money(Math.round(sec.nw)) + '</b>') + '</div>';
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Finanzielle Sicherheit</h2>' + levelBar(sec.lvl) + '<h3 style="margin:8px 0 2px">Stufe ' + sec.lvl + ': ' + esc(PF.LEVELS[sec.lvl]) + '</h3><p class="small">' + esc(PF.LEVEL_TXT[sec.lvl]) + '</p>' +
      '<table class="t small"><tr><td>Reserve (Monate Fixkosten)</td><td class="num">' + num(sec.months, 1) + '</td></tr><tr><td>Monatlicher Saldo</td><td class="num">' + sgn(sec.cf) + '</td></tr><tr><td>Schuldendienst / Einkommen</td><td class="num">' + pct(sec.dsr) + '</td></tr><tr><td>Anteil schwankender Anlagen</td><td class="num">' + pct(Math.min(1, sec.vol)) + '</td></tr>' +
      barRow('Finanzstress (subjektiv)', sec.stress) + '</table><p class="muted small">Die Stufe wird objektiv aus Reserven, Saldo, Schulden und Vertragslage berechnet. Der Stress hängt zusätzlich von Persönlichkeit und Kursschwankungen ab – er wirkt begrenzt auf Konzentration und Entwicklung.</p></div>';
    var rows = function (o, sign) { return Object.keys(o).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num">' + (sign < 0 ? '−' : '') + money(Math.abs(o[k])) + '</td></tr>'; }).join(''); };
    h += '<div class="panel"><h2>Monatsrechnung (Prognose)</h2><table class="t small"><tr><th>Einnahmen</th><th></th></tr>' + rows(m.inc, 1) + '<tr><th>Ausgaben</th><th></th></tr>' + rows(m.exp, -1) + '<tr><td><b>Saldo</b></td><td class="num"><b>' + sgn(m.cf) + '</b></td></tr></table>' +
      '<p class="muted small">Steuern: vereinfachtes Modell (' + esc(cx.prof.nat === 'Österreich' || cx.prof.nat === 'Schweiz' ? cx.prof.nat : 'Deutschland') + ', effektiv etwa ' + pct(PF.effRate(st, (C.player(st) || { wage: 0 }).wage)) + '). Prämien kommen zusätzlich hinzu.</p></div></div>';
    var hist = f.hist.map(function (x) { return x.nw; });
    h += '<div class="panel" style="margin-top:14px"><h2>Vermögensentwicklung</h2>' + U.lineChart(hist, { w: 700, h: 140, zero: true, empty: 'Der Verlauf erscheint nach den ersten Monaten.' }) + '</div>';
    return h;
  };
  FIN.leben = function (st) {
    var f = PF.ensure(st), minor = PF.minor(st);
    var h = '<div class="panel"><h2>Lebensstil</h2><p class="muted small">Der Lebensstil passt sich nicht automatisch an dein Gehalt an – du entscheidest. Teurer bringt Prestige und Aufmerksamkeit, aber auch Fixkosten.</p><div class="grid g3">' +
      Object.keys(PF.LIFE).map(function (k) { var L = PF.LIFE[k]; if (k === 'eltern' && !minor) return ''; return '<div class="choice ' + (f.life === k ? 'on' : '') + '" data-act="pfLife" data-k="' + k + '"><h3>' + esc(L.n) + '</h3><div class="small">' + money(L.m) + ' / Monat</div><div class="muted small">' + esc(L.d) + '</div></div>'; }).join('') + '</div></div>';
    h += '<div class="panel" style="margin-top:14px"><h2>Auto</h2><table class="t small"><tr><th>Modell</th><th class="num">Preis</th><th class="num">Unterhalt/Monat</th><th></th></tr>' + Object.keys(PF.CARS).map(function (k) { var K = PF.CARS[k]; return '<tr><td>' + esc(K.n) + (f.car === k ? ' <span class="cx-pill ok">aktuell</span>' : '') + '</td><td class="num">' + (K.price ? money(K.price) : '–') + '</td><td class="num">' + money(K.m) + '</td><td class="num">' + (f.car === k ? '' : '<button class="sm" data-act="pfCar" data-k="' + k + '" data-f="0">' + (K.price ? 'Bar kaufen' : 'Wählen') + '</button>' + (K.price ? ' <button class="sm" data-act="pfCar" data-k="' + k + '" data-f="1">Finanzieren</button>' : '')) + '</td></tr>'; }).join('') + '</table></div>';
    h += '<div class="panel" style="margin-top:14px"><h2>Absicherung</h2><table class="t small">' + Object.keys(PF.INS).map(function (k) { var I = PF.INS[k]; return '<tr><td><b>' + esc(I.n) + '</b><div class="muted">' + esc(I.d) + '</div></td><td class="num">' + (I.m ? money(I.m) : pct(I.mPct) + ' des Gehalts') + '/Monat</td><td class="num"><button class="sm ' + (f.ins[k] ? 'primary' : '') + '" data-act="pfIns" data-k="' + k + '">' + (f.ins[k] ? 'abgeschlossen' : 'abschließen') + '</button></td></tr>'; }).join('') + '</table></div>';
    return h;
  };
  FIN.anlage = function (st) {
    var w = PF.wallet(st), can = PF.canTrade(st);
    var h = '<div class="grid g2"><div class="panel"><h2>Konto & Tagesgeld</h2><table class="t small"><tr><td>Girokonto</td><td class="num">' + money(Math.round(w.cash)) + '</td></tr><tr><td>Tagesgeld</td><td class="num">' + money(Math.round(w.savings)) + '</td></tr><tr><td>Dispolimit</td><td class="num">' + money(PF.odLimit(st)) + '</td></tr></table>' +
      '<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="sm" data-act="pfSave" data-v="10000">10.000 aufs Tagesgeld</button><button class="sm" data-act="pfSave" data-v="all">Alles aufs Tagesgeld</button><button class="sm" data-act="pfUnsave" data-v="10000">10.000 abheben</button><button class="sm" data-act="pfUnsave" data-v="all">Alles abheben</button></div></div>';
    h += '<div class="panel"><h2>Depot</h2><p class="small">Gleicher Markt wie im Managerspiel: Wochenkurse, Börsencrashs, 0,5 % Gebühr pro Kauf und Verkauf, Kauf nach Stück oder Eurobetrag. Realisierte Gewinne werden vereinfacht versteuert (Abgeltungsteuer).</p>' + (PF.minor(st) ? '<p class="muted small">' + U.lc('info', 13) + ' Du bist noch nicht volljährig: Gehandelt wird über ein Junior-Depot, deine Eltern zeichnen mit.</p>' : '') + (FA.current(st) && FA.ensure(st).con.power.trade ? '<p class="muted small">Dein Finanzberater hat eine Handelsvollmacht und kann innerhalb seiner Befugnisse handeln.</p>' : '') + '</div></div>';
    var sub = U.p.mk === 'krypto' ? 'krypto' : 'aktien';
    h += '<div class="seg" style="margin:14px 0">' + [['aktien', 'Aktienmarkt', 'chart-line'], ['krypto', 'Kryptowährungen', 'bitcoin']].map(function (x) { return '<button class="' + (sub === x[0] ? 'on' : '') + '" data-act="pfMk" data-v="' + x[0] + '">' + U.lc(x[2], 15) + x[1] + '</button>'; }).join('') + '</div>';
    h += U.marketView(st, w, sub, can, { noClub: true, w: 'pc', acts: { buy: 'pfAssetBuy', sell: 'pfAssetSell', detail: 'assetDetail' } });
    return h;
  };
  FIN.immo = function (st) {
    var f = PF.ensure(st), w = PF.wallet(st), minor = PF.minor(st);
    var h = '<div class="panel"><h2>Deine Immobilien</h2>' + (f.homes.length ? '<table class="t small"><tr><th>Objekt</th><th class="num">Kaufpreis</th><th class="num">Wert</th><th class="num">Darlehen</th><th class="num">Miete/Jahr</th><th></th></tr>' + f.homes.map(function (x) { return '<tr><td>' + esc(x.n) + (f.homeId === x.id ? ' <span class="cx-pill ok">Wohnsitz</span>' : '') + (x.vacant > 0 ? ' <span class="cx-pill warn">Leerstand</span>' : '') + '</td><td class="num">' + money(x.price) + '</td><td class="num">' + money(Math.round(x.value)) + '</td><td class="num">' + (x.loan ? money(Math.round(x.loan.bal)) : '–') + '</td><td class="num">' + (x.rentY ? money(x.rentY) : '–') + '</td><td class="num"><button class="sm" data-act="pfSellHome" data-id="' + x.id + '">Verkaufen</button></td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch kein Wohneigentum.</p>') + '</div>';
    if (minor) return h + '<p class="muted">Immobilien erst ab 18 Jahren.</p>';
    h += '<div class="panel" style="margin-top:14px"><h2>Wohneigentum kaufen</h2><p class="muted small">Preise folgen dem regionalen Immobilienindex. Mindestens 20 % Eigenkapital plus Nebenkosten; die Bank prüft die Rate gegen dein Einkommen.</p><table class="t small"><tr><th>Angebot</th><th class="num">Preis</th><th class="num">Nebenkosten</th><th class="num">Miete/Jahr</th><th></th></tr>' +
      ['wohnung', 'haus', 'villa'].map(function (k) { return [false, true].map(function (rent) { var o = PF.homeOffer(st, k, rent); return '<tr><td>' + esc(o.n) + '</td><td class="num">' + money(o.price) + '</td><td class="num">' + money(o.fees) + '</td><td class="num">' + (o.rentY ? money(o.rentY) : 'selbst bewohnt') + '</td><td class="num"><button class="sm" data-act="pfBuyHome" data-k="' + k + '" data-r="' + (rent ? 1 : 0) + '">Kaufen</button></td></tr>'; }).join(''); }).join('') + '</table></div>';
    // Anlageimmobilien aus dem bestehenden Immobilienmarkt
    if (R.realty) {
      var re = R.realty.ensure(st); if (!re.offers || !re.offers.length) R.realty.refreshMarket(st, w);
      var rp = PF.realty(st);
      h += '<div class="panel" style="margin-top:14px"><h2>Anlageimmobilien (Immobilienmarkt)</h2>' + (rp.count ? '<p class="small">Bestand: ' + rp.count + ' Objekt(e), Wert ' + money(Math.round(rp.value)) + ', Darlehen ' + money(Math.round(rp.debt)) + ', Cashflow ' + sgn(Math.round(rp.cfY)) + '/Jahr.</p>' : '') +
        '<table class="t small"><tr><th>Objekt</th><th class="num">Preis</th><th></th></tr>' + (re.offers || []).slice(0, 6).map(function (o) { var q = R.realty.quote(st, w, o, {}); return '<tr><td>' + esc(o.name) + '<div class="muted">' + esc(o.region || '') + (q.ok ? '' : ' · ' + esc((q.reasons || []).join(' '))) + '</div></td><td class="num">' + money(o.price || o.land || 0) + '</td><td class="num"><button class="sm" data-act="pfRealty" data-id="' + o.id + '"' + (q.ok ? '' : ' disabled') + '>Kaufen (finanziert)</button></td></tr>'; }).join('') + '</table></div>';
    }
    return h;
  };
  FIN.kredit = function (st) {
    var f = PF.ensure(st), cr = PF.credit(st);
    var h = '<div class="grid g2"><div class="panel"><h2>Bonität</h2>' + (cr.why ? '<p class="muted">' + esc(cr.why) + '</p>' : '<div class="grid g3">' + U.kpi('Score', cr.score) + U.kpi('Note', cr.grade) + U.kpi('Kreditrahmen', money(cr.max)) + '</div><p class="muted small">Die Bonität hängt von Vertragslaufzeit, monatlichem Saldo, Reserven, Vermögen und verpassten Zahlungen ab.</p>') + '</div>';
    h += '<div class="panel"><h2>Kredit aufnehmen</h2>' + (cr.why ? '' : '<div class="row" style="gap:6px;flex-wrap:wrap">' + [10000, 50000, 200000].map(function (v) { return '<button class="sm" data-act="pfLoan" data-v="' + v + '">' + money(v) + ' Konsumentenkredit</button>'; }).join('') + '</div><p class="muted small">Zinssatz: Leitzins ' + pct(cr.base) + ' + Aufschlag je nach Bonität.</p>') + '</div></div>';
    h += '<div class="panel" style="margin-top:14px"><h2>Laufende Kredite</h2>' + (f.loans.length ? '<table class="t small"><tr><th>Kredit</th><th class="num">Restschuld</th><th class="num">Zins</th><th class="num">Rate/Monat</th><th></th></tr>' + f.loans.map(function (l) { return '<tr><td>' + esc(l.n) + '</td><td class="num">' + money(Math.round(l.amount)) + '</td><td class="num">' + (l.rate * 100).toFixed(1).replace('.', ',') + ' %</td><td class="num">' + money(l.pay) + '</td><td class="num"><button class="sm" data-act="pfRepay" data-id="' + l.id + '">Sondertilgung</button></td></tr>'; }).join('') + '</table>' : '<p class="muted small">Keine Kredite.</p>') + (f.missed ? '<p class="small" style="color:var(--red)">Verpasste Zahlungen: ' + f.missed + '</p>' : '') + '</div>';
    return h;
  };
  function faAttr(st, a) { return '<table class="t small cx-attr">' + Object.keys(FA.ATTR).map(function (k) { return '<tr><td>' + esc(FA.ATTR[k]) + '</td><td class="num">' + esc(FA.shown(st, a, k)) + '</td></tr>'; }).join('') + '</table>'; }
  FIN.berat = function (st) {
    var fa = FA.ensure(st), a = FA.current(st), h = '';
    if (PF.minor(st)) return '<p class="muted">Finanzberatung erst ab 18 Jahren – bis dahin verwalten deine Eltern das Geld.</p>';
    if (a) {
      var G = FA.GROUPS[a.g], con = fa.con;
      h += '<div class="grid g2"><div class="panel"><h2>Dein Finanzberater</h2><div class="cx-row">' + tile('finberater', '🧮') + '<div><b>' + esc(a.n) + '</b> · ' + esc(a.firm) + '<div class="muted small">' + esc(G.n) + ' · ' + esc(G.model) + '</div></div></div>' +
        '<div style="margin-top:10px"><div class="muted small">Betreuung</div><div class="seg">' + Object.keys(FA.MODES).map(function (k) { return '<button class="' + (con.mode === k ? 'on' : '') + '" data-act="faMode" data-k="' + k + '">' + esc(FA.MODES[k].n) + '</button>'; }).join('') + '</div></div>' +
        '<div class="row" style="gap:8px;margin-top:8px;align-items:center"><span class="small">Handelsvollmacht: <b>' + (con.power.trade ? 'erteilt' : 'nicht erteilt') + '</b></span><button class="sm" data-act="faPower">' + (con.power.trade ? 'Entziehen' : 'Erteilen') + '</button></div>' +
        '<p class="small" style="margin:8px 0 4px">Kosten: ' + ([con.fee.up ? pct(con.fee.up) + ' Ausgabeaufschlag' : '', con.fee.ong ? (con.fee.ong * 100).toFixed(2).replace('.', ',') + ' % p. a.' : '', con.fee.mon ? money(con.fee.mon) + '/Monat' : ''].filter(Boolean).join(' · ') || 'keine') + ' – derzeit ' + money(FA.monthlyCost(st)) + '/Monat</p>' +
        '<table class="t small">' + barRow('Vertrauen', fa.trust) + '</table>' +
        '<p class="muted small">' + esc(FA.MODES[con.mode].d) + ' Ohne Vollmacht gibt es keine Transaktionen ohne deine Zustimmung.</p>' + faAttr(st, a) + '<div class="row" style="margin-top:8px"><button class="sm danger" data-act="faCancel">Zusammenarbeit beenden</button></div></div>';
      // Strategie
      var rec = fa.rec;
      h += '<div class="panel"><h2>Anlagestrategie</h2>' + (rec ? '<p class="help">„' + esc(rec.claim) + '“</p><table class="t small"><tr><td>Liquiditätsreserve</td><td>' + rec.reserveM + ' Monate (' + money(rec.reserve) + ')</td></tr><tr><td>Aktienkorb</td><td>' + rec.nStocks + ' Werte, Ziel ' + money(rec.stockT) + '</td></tr><tr><td>Kryptoanteil</td><td>' + money(rec.cryptoT) + '</td></tr>' +
        (rec.prods.length ? '<tr><td>Produkte</td><td>' + rec.prods.map(function (q) { return esc(FA.PRODS[q.k]) + ' (' + money(q.amt) + (q.k === 'police' ? '/Monat' : '') + ')'; }).join(', ') + '</td></tr>' : '') + '<tr><td>Umschichtung</td><td>' + money(rec.move) + '</td></tr></table>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="sm primary" data-act="faDo" data-k="full">Vollständig umsetzen</button><button class="sm" data-act="faDo" data-k="part">Teilweise umsetzen</button><button class="sm" data-act="faDo" data-k="second">Zweite Meinung</button><button class="sm" data-act="faDo" data-k="cost">Kosten & Risiken prüfen</button><button class="sm" data-act="faDo" data-k="no">Ablehnen</button><button class="sm" data-act="faSwitch">Berater wechseln</button></div>' +
        '<h3 style="margin-top:12px">Strategievergleich</h3><div class="scroll"><table class="t small"><tr><th></th><th class="num">Reserve (Mon.)</th><th class="num">Krypto %</th><th class="num">Aktien</th><th class="num">Kosten/Jahr</th></tr>' + FA.compare(st, rec).map(function (r) { return '<tr><td>' + esc(r.n) + '</td><td class="num">' + r.reserveM + '</td><td class="num">' + r.crypto + '</td><td class="num">' + r.stocks + '</td><td class="num">' + money(Math.round(r.cost)) + (r.once ? ' + ' + money(Math.round(r.once)) + ' einmalig' : '') + '</td></tr>'; }).join('') + '</table></div>'
        : '<p class="small">Noch keine aktuelle Empfehlung.</p><button class="sm primary" data-act="faAsk">Strategie anfordern</button>') + '</div></div>';
      h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Abgeschlossene Produkte</h2>' + (fa.prods.length ? '<table class="t small"><tr><th>Produkt</th><th class="num">Eingezahlt</th><th class="num">Wert</th><th></th></tr>' + fa.prods.map(function (q) { return '<tr><td>' + esc(q.n) + '</td><td class="num">' + money(Math.round(q.paid)) + '</td><td class="num">' + money(Math.round(q.val)) + '</td><td class="num"><button class="sm" data-act="faClose" data-id="' + q.id + '">Auflösen</button></td></tr>'; }).join('') + '</table>' : '<p class="muted small">Keine.</p>') + '</div>' +
        '<div class="panel"><h2>Beratungshistorie</h2>' + (fa.hist.length ? '<ul class="small">' + fa.hist.slice(0, 14).map(function (x) { return '<li><b>' + esc(x.k) + '</b> (' + x.s + '/' + x.w + '): ' + esc(x.txt) + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Noch leer.</p>') + '</div></div>';
    } else h += '<div class="panel"><h2>Selbstverwaltung</h2><p class="small">Du verwaltest dein Geld selbst: keine Beratungskosten, aber die Zeit dafür fehlt im Wochenplan (Aktivität „Finanzen selbst verwalten“), und Fehler passieren leichter.</p></div>';
    // Markt nach Anbietergruppe
    var av = FA.available(st);
    h += '<div class="panel" id="faMarket" style="margin-top:14px"><h2>Anbieter vergleichen</h2><p class="muted small">Alle Unternehmen sind fiktiv. Die Anbietergruppe prägt Vergütung und Schwerpunkte – wie gut die Beratung ist, entscheidet der einzelne Berater. Eigenschaften zeigen sich erst mit der Zeit.</p>' +
      Object.keys(FA.GROUPS).map(function (g) { var G = FA.GROUPS[g], list = av.filter(function (x) { return x.g === g; }); if (!list.length) return '<p class="small muted"><b>' + esc(G.n) + '</b>: ab ' + money(G.minNw || 0) + ' Vermögen.</p>'; return '<h3 style="margin:12px 0 4px">' + esc(G.n) + ' <span class="muted small">' + esc(G.model) + '</span></h3><table class="t small">' + list.map(function (x) { return '<tr><td><b>' + esc(x.n) + '</b> · ' + esc(x.firm) + (x.id === fa.cur ? ' <span class="cx-pill ok">dein Berater</span>' : '') + '<div class="muted">Ruf ' + stars(x.rep) + ' · ' + x.serv.length + ' Leistungen · Transparenz ' + esc(FA.shown(st, x, 'trans')) + '</div></td><td class="num">' + (x.fee.up ? pct(x.fee.up) + ' Aufschlag ' : '') + (x.fee.ong ? (x.fee.ong * 100).toFixed(2).replace('.', ',') + ' % p. a. ' : '') + (x.fee.mon ? money(x.fee.mon) + '/Mon.' : '') + '</td><td class="num">' + (x.id === fa.cur ? '' : '<button class="sm" data-act="faView" data-id="' + x.id + '">Profil</button>') + '</td></tr>'; }).join('') + '</table>'; }).join('') + '</div>';
    return h;
  };
  function fmsg(t) { U.toast(t, 5000); U.autosave(); U.render(); U.renderTop(); }
  U.acts.pfLife = function (d) { var r = PF.setLife(U.st, d.k); if (r && r.ok === false && r.why) U.toast(r.why); U.autosave(); U.render(); };
  U.acts.pfCar = function (d) { var r = PF.setCar(U.st, d.k, d.f === '1'); fmsg(r.ok ? 'Erledigt.' : r.why); };
  U.acts.pfIns = function (d) { var f = PF.ensure(U.st); PF.setIns(U.st, d.k, !f.ins[d.k]); U.autosave(); U.render(); };
  U.acts.pfSave = function (d) { var w = PF.wallet(U.st); PF.save(U.st, d.v === 'all' ? w.cash : +d.v); U.autosave(); U.render(); U.renderTop(); };
  U.acts.pfUnsave = function (d) { var w = PF.wallet(U.st); PF.unsave(U.st, d.v === 'all' ? w.savings : +d.v); U.autosave(); U.render(); U.renderTop(); };
  U.acts.pfMk = function (d) { U.p.mk = d.v; U.render(); };
  function ordQty(st, k, sell) { var el = document.getElementById('q_' + k), v = el ? +el.value || 0 : 0; if (U.p.tradeMode !== 'eur') return { raw: v, q: Math.floor(v) }; var pr = E.price(st, k); return { raw: v, q: pr && v ? Math.floor(v / (pr * (sell ? 1 : 1.005))) : 0 }; }
  U.acts.pfAssetBuy = function (d) {
    var st = U.st, o = ordQty(st, d.k, false);
    if (!o.raw) { U.toast(U.p.tradeMode === 'eur' ? 'Bitte einen Betrag eingeben.' : 'Bitte eine Stückzahl eingeben.'); return; }
    if (!o.q) { U.toast('Betrag reicht nicht für ein Stück'); return; }
    var r = PF.buyQty(st, d.k, o.q); fmsg(r.ok ? 'Gekauft: ' + num(o.q) + ' Stück für ' + money(Math.round(r.cost)) + '.' : r.why || 'Nicht möglich.');
  };
  U.acts.pfAssetSell = function (d) {
    var st = U.st, w = PF.wallet(st), pf = w.portfolio[d.k], o = ordQty(st, d.k, true);
    function go(n) { var r = PF.sell(st, d.k, n); fmsg(r.ok ? 'Verkauft für ' + money(Math.round(r.revenue)) + ' (' + (r.profit >= 0 ? '+' : '') + money(Math.round(r.profit)) + ').' : r.why || 'Nicht möglich.'); }
    if (!o.raw) { U.confirm('Alles verkaufen?', 'Keine Menge eingegeben. Die gesamte Position (' + num(pf ? pf.qty : 0) + ' Stück) verkaufen?', function () { go(1e12); }); return; }
    if (!o.q) { U.toast('Betrag reicht nicht für ein Stück'); return; }
    go(o.q);
  };
  U.acts.pfBuy = function (d) { var r = PF.buy(U.st, d.s, +d.v); fmsg(r.ok ? 'Gekauft für ' + money(Math.round(r.cost)) + '.' : r.why || 'Nicht möglich.'); };
  U.acts.pfSell = function (d) { var w = PF.wallet(U.st), q = w.portfolio[d.s] ? w.portfolio[d.s].qty : 0; var r = PF.sell(U.st, d.s, q); fmsg(r.ok ? 'Verkauft für ' + money(Math.round(r.revenue)) + '.' : r.why || 'Nicht möglich.'); };
  U.acts.pfBuyHome = function (d) { var st = U.st, o = PF.homeOffer(st, d.k, d.r === '1'); U.confirm('Immobilie kaufen', esc(o.n) + ' für ' + money(o.price) + ' zzgl. ' + money(o.fees) + ' Nebenkosten kaufen? Der Rest wird über ein Darlehen finanziert.', function () { var r = PF.buyHome(st, d.k, d.r === '1'); fmsg(r.ok ? 'Gekauft!' : r.why); }); };
  U.acts.pfSellHome = function (d) { U.confirm('Immobilie verkaufen', 'Zum aktuellen Marktwert verkaufen (abzüglich Kosten)?', function () { var r = PF.sellHome(U.st, d.id); fmsg(r.ok ? 'Verkauft.' : 'Nicht möglich.'); }); };
  U.acts.pfRealty = function (d) { var st = U.st, w = PF.wallet(st); var r = R.realty.buy(st, w, d.id, {}); st.pc.cash = w.cash; fmsg(r.ok ? 'Objekt gekauft.' : r.why); };
  U.acts.pfLoan = function (d) { var r = PF.takeLoan(U.st, 'konsum', +d.v); fmsg(r.ok ? 'Kredit ausgezahlt, Rate ' + money(Math.round(r.pay)) + '/Monat.' : r.why); };
  U.acts.pfRepay = function (d) { var r = PF.repayLoan(U.st, d.id); fmsg(r.ok ? 'Kredit getilgt.' : r.why || 'Nicht möglich.'); };
  U.acts.faMode = function (d) { FA.setMode(U.st, d.k); U.autosave(); U.render(); };
  U.acts.faPower = function () { var f = FA.ensure(U.st); FA.setPower(U.st, !(f.con && f.con.power.trade)); U.autosave(); U.render(); };
  U.acts.faCancel = function () { U.confirm('Finanzberatung beenden', 'Zusammenarbeit beenden? Abgeschlossene Produkte laufen weiter.', function () { FA.cancel(U.st); fmsg('Beendet.'); }); };
  U.acts.faAsk = function () { var st = U.st, a = FA.current(st); if (!a) return; FA.ensure(st).rec = FA.propose(st, a); FA.log(st, 'Empfehlung', 'Neue Anlagestrategie vorgelegt'); U.autosave(); U.render(); };
  U.acts.faDo = function (d) {
    var st = U.st, fa = FA.ensure(st), rec = fa.rec; if (!rec) return;
    if (d.k === 'full') { fmsg(FA.execute(st, rec, 1)); fa.rec = null; }
    else if (d.k === 'part') { fmsg(FA.execute(st, rec, 0.5)); fa.rec = null; }
    else if (d.k === 'second') fmsg(FA.second(st, rec));
    else if (d.k === 'cost') fmsg(FA.costCheck(st, rec));
    else { fa.rec = null; FA.log(st, 'Abgelehnt', 'Empfehlung abgelehnt'); FA.trust(st, -1); fmsg('Empfehlung abgelehnt.'); }
    U.autosave(); U.render();
  };
  U.acts.faSwitch = function () { var el = document.getElementById('faMarket'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  U.acts.faClose = function (d) { U.confirm('Produkt auflösen', 'Vorzeitig auflösen? Bei Policen gibt es oft deutlich weniger zurück als eingezahlt.', function () { var r = FA.closeProduct(U.st, d.id); fmsg(r.ok ? 'Aufgelöst: ' + money(Math.round(r.back)) + ' zurück.' : 'Nicht möglich.'); }); };
  U.acts.faView = function (d) {
    var st = U.st, a = FA.get(st, d.id); if (!a) return; var G = FA.GROUPS[a.g];
    U.modal('Finanzberatung: ' + esc(a.firm), '<p><b>' + esc(a.n) + '</b> · ' + esc(G.n) + ' · Ruf ' + stars(a.rep) + ' · ' + a.clients + ' Mandanten</p><p class="small">' + esc(G.model) + '. Kosten: ' + (a.fee.up ? pct(a.fee.up) + ' Ausgabeaufschlag, ' : '') + (a.fee.ong ? (a.fee.ong * 100).toFixed(2).replace('.', ',') + ' % p. a., ' : '') + (a.fee.mon ? money(a.fee.mon) + '/Monat' : '') + '</p>' +
      '<p class="small">Leistungen: ' + a.serv.map(function (k) { return '<span class="cx-pill">' + esc(FA.SERV[k]) + '</span>'; }).join('') + '</p>' + faAttr(st, a),
      '<button data-act="closeModal">Schließen</button><button data-act="faSign" data-id="' + a.id + '" data-m="begleitet" data-p="0">Begleitet, ohne Vollmacht</button><button class="primary" data-act="faSign" data-id="' + a.id + '" data-m="umfassend" data-p="1">Umfassend, mit Vollmacht</button>', true);
  };
  U.acts.faSign = function (d) { var r = FA.sign(U.st, d.id, d.m, d.p === '1'); U.closeModal(); fmsg(r.ok ? 'Beratungsvertrag geschlossen. Die Analyse folgt in den nächsten Wochen.' : r.why); };

  // ---------- Karriere-Chronik ----------
  U.chronCat = U.chronCat || '';
  U.acts.chronCat = function (d) { U.chronCat = d.k; U.render(); };
  U.screens.pchronik = function () {
    var st = U.st, cx = X.ensure(st), list = cx.chron.filter(function (x) { return !U.chronCat || x.cat === U.chronCat; });
    var cats = {}; cx.chron.forEach(function (x) { cats[x.cat] = (cats[x.cat] || 0) + 1; });
    var h = '<h1>Karriere-Chronik</h1><div class="cx-tabs"><button class="sm ' + (!U.chronCat ? 'on' : '') + '" data-act="chronCat" data-k="">Alles (' + cx.chron.length + ')</button>' + Object.keys(cats).map(function (k) { return '<button class="sm ' + (U.chronCat === k ? 'on' : '') + '" data-act="chronCat" data-k="' + k + '">' + esc(X.CATS[k] || (k === 'meilenstein' ? 'Meilensteine' : k)) + ' (' + cats[k] + ')</button>'; }).join('') + '</div>';
    if (!list.length) return h + '<p class="muted">Noch keine Einträge.</p>';
    var bySeason = {}; list.forEach(function (x) { (bySeason[x.s] = bySeason[x.s] || []).push(x); });
    Object.keys(bySeason).sort(function (a, b) { return b - a; }).forEach(function (s) {
      h += '<div class="cx-season">SAISON ' + s + '/' + String(+s + 1).slice(2) + '</div><div class="cx-chron">' + bySeason[s].slice().reverse().map(function (x) { return '<div class="it ' + (x.imp >= 3 ? 'big' : '') + '" style="--c:' + (CATCOL[x.cat] || '#3b82f6') + '"><div class="t">' + (x.ic || '') + ' ' + esc(x.ti) + '</div><div class="small muted">' + (x.w ? 'Woche ' + x.w + ' · ' : '') + esc(x.x || '') + '</div></div>'; }).join('') + '</div>';
    });
    return h;
  };

  // ---------- Erweiterter Charakter-Assistent ----------
  var TEMPER = { ehrgeizig: { n: 'Ehrgeizig', d: 'Will immer mehr – treibt sich an, eckt aber an.', per: { amb: 76, conf: 62, team: 48 } }, teamplayer: { n: 'Teamplayer', d: 'Stellt die Mannschaft über sich.', per: { team: 74, lead: 40, amb: 52 } },
    lautsprecher: { n: 'Lautsprecher', d: 'Selbstbewusst, medienwirksam, manchmal undiszipliniert.', per: { conf: 72, media: 60, disc: 42, lead: 45 } }, ruhig: { n: 'Ruhig & diszipliniert', d: 'Konzentriert, nervenstark, wenig Aufsehen.', per: { disc: 70, stress: 12, media: 42 } } };
  var baseWiz = U.screens.wizard;
  U.screens.wizard = function () {
    var w = U.wiz, h = baseWiz(); if (!w || w.mode !== 'player' || w.step !== 3) return h;
    var o = w.pc; o.nat = o.nat || 'Deutschland'; o.home = o.home != null ? o.home : ''; o.pos2 = o.pos2 || []; o.height = o.height || (HB ? 190 : 182); o.build = o.build || 'athletisch'; o.style = o.style || Object.keys(X.STYLES)[1]; o.str = o.str || []; o.weak = o.weak || []; o.goals = o.goals || ['top', 'nat']; o.temper = o.temper || 'teamplayer';
    function tog(k, v, cur, lbl) { return '<button class="' + (cur.indexOf(v) >= 0 ? 'on' : '') + '" data-act="pcWizTog" data-k="' + k + '" data-v="' + v + '">' + esc(lbl) + '</button>'; }
    var ex = '<div class="panel" style="margin-top:14px"><h2>Herkunft & Körper</h2><div class="grid g3">' +
      U.field('Nationalität', '<select data-chg="pcWizSel" data-k="nat" class="cx-field">' + X.NATS.map(function (n) { return '<option' + (o.nat === n ? ' selected' : '') + '>' + esc(n) + '</option>'; }).join('') + '</select>') +
      U.field('Heimatort', '<input type="text" data-inp="pcWiz" data-k="home" value="' + esc(o.home) + '" maxlength="40" placeholder="z. B. deine Stadt" class="cx-field">') +
      U.field('Größe (cm)', '<input type="number" data-inp="pcWiz" data-k="height" value="' + o.height + '" min="155" max="215" class="cx-field">') + '</div>' +
      U.field('Körperbau', '<div class="seg">' + Object.keys(X.BUILDS).map(function (k) { return '<button class="' + (o.build === k ? 'on' : '') + '" data-act="pcWizSet" data-k="build" data-v="' + k + '">' + esc(X.BUILDS[k].n) + '</button>'; }).join('') + '</div>') +
      U.field('Nebenpositionen (bis 2)', '<div class="seg">' + Object.keys(D.posWeights).filter(function (k) { return k !== o.pos; }).map(function (k) { return tog('pos2', k, o.pos2, D.posNames[k] || k); }).join('') + '</div>') + '</div>' +
      '<div class="panel" style="margin-top:14px"><h2>Spielweise & Persönlichkeit</h2>' +
      U.field('Spielstil', '<div class="seg">' + Object.keys(X.STYLES).map(function (k) { return '<button class="' + (o.style === k ? 'on' : '') + '" data-act="pcWizSet" data-k="style" data-v="' + k + '">' + esc(X.STYLES[k].n) + '</button>'; }).join('') + '</div>') +
      U.field('Stärken (bis 2)', '<div class="seg">' + Object.keys(X.TRAITS).map(function (k) { return tog('str', k, o.str, X.TRAITS[k]); }).join('') + '</div>') +
      U.field('Schwächen (bis 2)', '<div class="seg">' + Object.keys(X.TRAITS).map(function (k) { return tog('weak', k, o.weak, X.TRAITS[k]); }).join('') + '</div>') +
      '<div class="grid g4" style="margin-top:8px">' + Object.keys(TEMPER).map(function (k) { var T = TEMPER[k]; return '<div class="choice ' + (o.temper === k ? 'on' : '') + '" data-act="pcWizSet" data-k="temper" data-v="' + k + '"><h3>' + esc(T.n) + '</h3><div class="muted small">' + esc(T.d) + '</div></div>'; }).join('') + '</div></div>' +
      '<div class="panel" style="margin-top:14px"><h2>Persönliche Ziele (bis 3)</h2><div class="seg">' + Object.keys(X.GOALS).map(function (k) { return tog('goals', k, o.goals, X.GOALS[k].n); }).join('') + '</div><p class="muted small">Stärken und Schwächen verschieben die Startwerte (+/−), die Gesamtstärke bleibt fast gleich. Karrieren können auch scheitern.</p></div>';
    var anchor = '<div class="row" style="margin-top:18px"><button data-act="wizBack">';
    var i = h.lastIndexOf(anchor); return i >= 0 ? h.slice(0, i) + ex + h.slice(i) : h + ex;
  };
  U.acts.pcWizTog = function (d) {
    var o = U.wiz.pc, arr = o[d.k] = o[d.k] || [], max = d.k === 'goals' ? 3 : 2, i = arr.indexOf(d.v);
    if (i >= 0) arr.splice(i, 1); else { if (arr.length >= max) arr.shift(); arr.push(d.v); }
    if (d.k === 'str') o.weak = (o.weak || []).filter(function (k) { return arr.indexOf(k) < 0; }); if (d.k === 'weak') o.str = (o.str || []).filter(function (k) { return arr.indexOf(k) < 0; });
    U.render();
  };
  U.acts.pcWizSel = function (d, el) { U.wiz.pc[d.k] = el.value; };
  // Start: alle Charakterfelder an C.start übergeben
  U.pcStartOpts = function (o, clubId) { var so = {}; Object.keys(o).forEach(function (k) { so[k] = o[k]; }); so.clubId = clubId; so.height = +o.height || undefined; if (TEMPER[o.temper]) so.per = TEMPER[o.temper].per; return so; };
})(RFM);
