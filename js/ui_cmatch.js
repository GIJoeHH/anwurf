// Spielerkarriere 3.0 – Matchcenter für den eigenen Spieler. Nutzt die Bühne des Manager-Matchcenters (Canvas-Arena,
// Spielstand, Statistik, Ticker aus ui_match.js) und ergänzt: Hervorhebung des eigenen Spielers, Spieler-Statistikpanel,
// zentrale Entscheidungs-Einblendung über dem Spielfeld und 5 Geschwindigkeiten (Langsam, Normal, Schnell,
// Nur Schlüsselszenen, Sofort – dann werden Entscheidungen regelbasiert nach Persönlichkeit aufgelöst).
// Die Simulation bleibt dieselbe (R.match.step + R.cm): Ergebnisse werden nie manipuliert.
(function (R) {
  var U = R.ui, C = R.pc, X = R.cx, CM = R.cm, M = R.match, W = R.world, S = R.season, D = R.data;
  if (!U || !CM || !X) return;
  var esc = R.esc, HB = X.HB;
  U.CM_SPEEDS = [['slow', 'Langsam', 950], ['normal', 'Normal', 340], ['fast', 'Schnell', 110], ['key', 'Nur Schlüsselszenen', 14], ['instant', 'Sofort', 0]];
  function spd(k) { return U.CM_SPEEDS.filter(function (x) { return x[0] === k; })[0] || U.CM_SPEEDS[1]; }

  if (typeof document !== 'undefined' && !document.getElementById('cm-style')) {
    var css = document.createElement('style'); css.id = 'cm-style';
    css.textContent = [
      '.cm-ov{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(5,10,20,.55);animation:cxIn .2s ease-out}',
      '.cm-ov .card{max-width:560px;width:100%;background:var(--panel);border:2px solid var(--amber);border-radius:12px;padding:14px 16px;box-shadow:0 10px 40px rgba(0,0,0,.5)}',
      '.cm-ov .card h3{margin:2px 0 8px;font-size:16px}.cm-ov .opts{display:grid;gap:7px}.cm-ov .opts button{text-align:left;padding:10px 12px;font-size:14px}',
      '.cm-res{position:absolute;z-index:6;left:50%;top:14px;transform:translateX(-50%);background:var(--panel);border:1px solid var(--line);border-left:4px solid var(--c,var(--blue));border-radius:8px;padding:8px 12px;font-size:13.5px;max-width:90%;animation:cxIn .2s ease-out}',
      '.cm-head-fix .mch-team b,.cm-head-fix .mch-team span{display:block}',
      '.cm-speed{display:flex;gap:4px;flex-wrap:wrap}.cm-speed button.on{background:var(--green2);color:#fff;font-weight:700}',
      '.cm-me{display:flex;gap:10px;align-items:center;margin-bottom:8px}.cm-me .dot{width:14px;height:14px;border-radius:50%;background:#facc15;box-shadow:0 0 0 3px rgba(250,204,21,.35)}',
      '.cm-kick{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:rgba(5,10,20,.28)}',
      '.cm-kick button{font-size:20px;font-weight:800;padding:14px 30px;border-radius:999px;box-shadow:0 8px 30px rgba(0,0,0,.5);display:flex;gap:8px;align-items:center}',
      '.cm-left{display:grid;gap:var(--s4);align-content:start;min-width:0}.cm-left .mc-flow{margin:0}',
      '@media (max-width:640px){.cm-kick button{font-size:17px;padding:11px 22px}.cm-ov .card{padding:10px}.cm-ov .opts button{font-size:13px;padding:8px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // Eigener Spieler: gelber, pulsierender Ring und Namensschild über der Figur
  U.hlDraw = function (ctx, x, y, s, now) {
    var sc = 0.75 + s * 0.45, r = 11 * sc + Math.sin(now / 220) * 1.5;
    ctx.save(); ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y + 1, r, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke();
    var lbl = U.st && C.player(U.st) ? C.player(U.st).last : 'Du';
    ctx.font = '700 ' + Math.round(12 + 3 * s) + 'px Inter, -apple-system, sans-serif'; ctx.textAlign = 'center';
    var w = ctx.measureText(lbl).width + 12, ty = y - 36 * sc;
    ctx.fillStyle = 'rgba(250,204,21,.95)'; ctx.fillRect(x - w / 2, ty - 13, w, 17); ctx.fillStyle = '#111'; ctx.fillText(lbl, x, ty);
    ctx.restore();
  };

  function live(g, st) {
    var m = g.m, H = st.clubs[m.clubs[0]], A = st.clubs[m.clubs[1]];
    if (!U.live || U.live.m !== m) U.live = { queue: [g.fx], idx: 0, played: {}, m: m, anim: U.initAnim(m), kits: U.matchKits(H, A), paused: true, flash: null, hold: 0, shown: 0, lastEv: m.events.length, hl: C.player(st).id, career: true };
    return U.live;
  }
  function stopTimer(g) { if (g && g.timer) { clearTimeout(g.timer); g.timer = null; } if (U.live && U.pcm && U.live.m === U.pcm.m) U.live.paused = true; }
  function ratingTxt(v) { return v ? v.toFixed(1).replace('.', ',') : '–'; }
  function playerPanel(st, g) {
    var m = g.m, s = g.s, p = C.player(st), pid = p.id, cx = st.pc.cx;
    var inj = m.injured[pid], off = m.sentOff[pid], onP = m.onPitch[s].indexOf(pid) >= 0;
    var acts = m.events.filter(function (e) { return e.pid === pid || e.pid2 === pid; }).length;
    function row(l, v) { return '<tr><td>' + l + '</td><td class="num">' + v + '</td></tr>'; }
    return '<div class="cm-me"><span class="dot"></span><div><b>' + esc(W.playerName(p)) + '</b><div class="muted small">' + esc((D.posNames && D.posNames[p.pos]) || p.pos) + ' · gelb markiert auf dem Feld</div></div></div><table class="t small">' +
      row('Status', inj ? '<span class="cx-pill bad">verletzt</span>' : off ? '<span class="cx-pill bad">vom Platz</span>' : onP ? '<span class="cx-pill ok">auf dem Feld</span>' : m.bench[s].indexOf(pid) >= 0 ? '<span class="cx-pill">Bank</span>' : '<span class="cx-pill">ausgewechselt</span>') +
      row('Note', '<b>' + ratingTxt(m.rating[pid]) + '</b>') + row(esc(X.SW.goals), m.goals[pid] || 0) + row('Vorlagen', m.assists[pid] || 0) + row('Aktionen im Ticker', acts) +
      row('Frische', Math.round(m.fit[pid] != null ? m.fit[pid] : p.fitness) + ' %') + row('Selbstvertrauen', Math.round(cx.per.conf)) + row('Trainervertrauen', Math.round(st.pc.trust)) +
      (HB ? row('Zeitstrafen', m.twoMins[pid] || 0) : row('Karten', m.yellows[pid] ? '🟨'.repeat(Math.min(2, m.yellows[pid])) : '–')) +
      row('Entscheidungen', m.pc.log.length + (m.pc.at.length ? ' <span class="muted">(noch ~' + m.pc.at.length + ')</span>' : '')) + '</table>';
  }
  function overlay(st, g) {
    if (g.inst) return '<div class="cm-ov"><div class="card"><div class="muted small">' + g.inst.min + '. Minute · Deine Entscheidung</div><h3>' + esc(g.inst.t) + '</h3><div class="opts">' + g.inst.labels.map(function (o) { return '<button data-act="cmPick" data-i="' + o.i + '">' + esc(o.l) + (o.hint ? ' <span class="muted small">(' + esc(o.hint) + ')</span>' : '') + '</button>'; }).join('') + '</div><p class="muted small" style="margin:8px 0 0">Erfolg hängt von Fähigkeiten, Frische, Selbstvertrauen und Gegner ab.</p></div></div>';
    var m = g.m, res = '', kick = '';
    if (!g.timer && !m.finished) kick = '<div class="cm-kick"><button class="primary" data-act="cmRun">' + U.lc('play', 22) + (m.minute ? ' Weiter' : ' Anpfiff') + '</button></div>';
    else if (m.finished) kick = '<div class="cm-kick"><button class="primary" data-act="cmDone">' + U.lc('check', 22) + ' Spieltag abschließen</button></div>';
    if (g.last && Date.now() - (g.lastT || 0) < 4000) res = '<div class="cm-res" style="--c:' + (g.last.r === 'goal' ? 'var(--green)' : ['card', 'red', 'injury'].indexOf(g.last.r) >= 0 ? 'var(--red)' : 'var(--blue)') + '"><b>' + esc(g.last.l) + '</b> → ' + esc(CM.RESULT_TXT[g.last.r] || g.last.r) + (g.last.p != null ? ' <span class="muted small">(ca. ' + g.last.p + ' %)</span>' : '') + '</div>';
    return res + kick;
  }
  function controls(st, g) {
    var m = g.m;
    if (m.finished) return '<button class="primary" data-act="cmDone">' + U.lc('check', 15) + ' Spieltag abschließen</button>';
    return (g.timer ? '<button data-act="cmPause">' + U.lc('pause', 15) + ' Pause</button>' : '<button class="primary" data-act="cmRun"' + (g.inst ? ' disabled' : '') + '>' + U.lc('play', 15) + (m.minute ? ' Weiter' : ' Anpfiff') + '</button>') +
      '<div class="cm-speed">' + U.CM_SPEEDS.map(function (x) { return '<button class="sm ' + (g.speed === x[0] ? 'on' : '') + '" data-act="cmSpeed" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  function refresh(st, g) {
    var el = function (id) { return document.getElementById(id); };
    if (el('cmPlayer')) el('cmPlayer').innerHTML = playerPanel(st, g);
    if (el('cmOv')) el('cmOv').innerHTML = overlay(st, g);
    if (el('cmCtl')) el('cmCtl').innerHTML = controls(st, g);
  }
  function compName(st, fx) { if (fx && fx.label) return fx.label; return fx && fx.comp && fx.comp !== 'league' && S.fxLabel ? S.fxLabel(st, fx) : (st.week + 1) + '. Spieltag'; }

  U.screens.pspiel = function () {
    var st = U.st, g = U.pcm; if (!g) return U.screens.pkarriere();
    if (!g.speed) { var ds = st.settings.cmSpeed; g.speed = ds && ds !== 'instant' ? ds : st.settings.matchSpeed === 'schnell' ? 'fast' : 'normal'; } // „Sofort“ gilt nur für das laufende Spiel
    var m = g.m, L = live(g, st), H = st.clubs[m.clubs[0]], A = st.clubs[m.clubs[1]];
    var h = '<div class="page-h"><div><h1>Matchcenter</h1><div class="page-sub">' + esc(g.fx.nt ? 'Länderspiel' : (D.leagueNames[H.league] || '')) + ' · ' + esc(H.stadiumName) + ' · Spielerkarriere</div></div></div>';
    h += '<div class="mc-head panel cm-head-fix"><div class="mch-team">' + U.crest(H, 64) + '<div><b>' + esc(H.name) + '</b><span>HEIM</span></div></div>' +
      '<div class="mc-score"><span class="mc-live" id="mcLive">LIVE · ' + esc(compName(st, g.fx)).toUpperCase() + '</span><b><span id="sbH">0</span><i>:</i><span id="sbA">0</span></b><em id="sbMin">0. Minute</em></div>' +
      '<div class="mch-team r"><div><b>' + esc(A.name) + '</b><span>GAST</span></div>' + U.crest(A, 64) + '</div></div>';
    var flow = '<div class="panel mc-flow"><div class="mc-flow-h"><div><div class="sub-h" style="margin-top:0">Spielverlauf</div><div class="mc-last" id="mcLast"><b>0\'</b><span>Gleich geht es los.</span></div></div><div class="row" id="cmCtl" style="gap:8px;flex-wrap:wrap">' + controls(st, g) + '</div></div><div class="ticker mc-ticker" id="ticker"></div></div>';
    h += '<div class="mc-grid"><div class="cm-left"><div class="panel tight mc-stage"><div style="position:relative"><canvas id="pitchCv" class="mc-canvas" width="1120" height="600"></canvas><div id="flashBox"></div><div id="cmOv">' + overlay(st, g) + '</div></div></div>' + flow + '</div>';
    h += '<div class="grid" style="align-content:start"><div class="panel"><h2>Deine Werte im Spiel</h2><div id="cmPlayer">' + playerPanel(st, g) + '</div></div>' +
      '<div class="panel"><h2>Spielstatistik</h2><div class="mc-stats">' + (HB ? [['stShots', 'Würfe', '0 : 0'], ['stSv', 'Paraden', '0 : 0'], ['stCh', '7-Meter', '0 : 0'], ['stPoss', 'Zeitstrafen', '0 : 0'], ['stTo', 'Auszeiten übrig', '0 : 0']] : [['stPoss', 'Ballbesitz', '50 : 50'], ['stShots', 'Torschüsse', '0 : 0'], ['stCh', 'Chancen', '0 : 0'], ['stYel', 'Gelbe Karten', '0 : 0']]).map(function (x) { return '<div class="mc-stat"><span>' + x[1] + '</span><b id="' + x[0] + '">' + x[2] + '</b><i class="mc-sbar"><em id="' + x[0] + 'B" style="width:50%"></em></i></div>'; }).join('') + '</div></div></div></div>';
    U.after = function () { L.paused = !g.timer && !g.inst; U.liveUpdate([], true); U.animLoop(); markMine(); };
    return h;
  };
  function markMine() { // eigene Aktionen im Ticker hervorheben
    var g = U.pcm, tk = document.getElementById('ticker'); if (!g || !tk) return;
    var p = C.player(U.st), nm = p ? p.last : null; if (!nm) return;
    Array.prototype.forEach.call(tk.children, function (d) { if (d.textContent.indexOf(nm) >= 0) d.style.background = 'color-mix(in srgb,#facc15 16%,transparent)'; });
  }

  function step(g, st) {
    var m = g.m, L = live(g, st), before = m.stats.possTicks.slice();
    M.step(m);
    L.anim.poss = m.stats.possTicks[0] > before[0] ? 0 : 1;
    var news = m.events.slice(L.lastEv); L.lastEv = m.events.length;
    var slowish = g.speed === 'slow' || g.speed === 'normal', key = g.speed === 'key', hold = 0, pid = C.player(st).id;
    news.forEach(function (e) {
      if (e.type === 'goal') { var mine = e.pid === pid; L.flash = { t: Date.now(), side: e.side, mine: mine ? (C.player(st).first + ' ' + C.player(st).last) : null }; hold = mine ? (slowish ? 3200 : 2400) : HB ? (g.speed === 'slow' ? 1000 : slowish ? 450 : key ? 300 : 150) : slowish ? 2000 : key ? 1600 : 700; U.animShot(L.anim, e.side, true, e); } // eigenes Tor: längere Einblendung mit Namen
      else if ((e.type === 'save' || e.type === 'miss') && slowish) { U.animShot(L.anim, e.side, false, e); hold = Math.max(hold, HB ? (g.speed === 'slow' ? 500 : 0) : g.speed === 'slow' ? 800 : 500); } // Handball: ~55 Tore und viele Würfe je Spiel – kurze Pausen, sonst dauert ein Spiel mehrere Minuten
      else if (e.type === 'chance') U.animAttack(L.anim, e.side);
      else if (e.type === 'red') hold = Math.max(hold, slowish ? 1100 : 500);
      if (key && (e.pid === pid || e.pid2 === pid) && e.type !== 'info') hold = Math.max(hold, HB ? 700 : 1300);
    });
    U.liveUpdate(news); markMine();
    return hold;
  }
  function loop() {
    var g = U.pcm, st = U.st; if (!g) return; var m = g.m;
    if (m.finished) { stopTimer(g); refresh(st, g); U.liveUpdate([]); return; }
    var hold = step(g, st), inst = CM.next(m);
    if (inst) {
      if (g.speed === 'instant') { var e = CM.choose(m, inst, CM.rulePolicy(st)(inst)); g.auto = (g.auto || 0) + 1; g.last = e; g.lastT = Date.now(); }
      else { stopTimer(g); g.inst = inst; g.last = null; U.live.paused = false; refresh(st, g); return; }
    }
    if (m.finished) { stopTimer(g); refresh(st, g); U.liveUpdate([]); return; }
    if (U.screen === 'pspiel') { var pl = document.getElementById('cmPlayer'); if (pl && (m.minute % 3 === 0 || hold)) refresh(st, g); }
    var ms = spd(g.speed)[2]; if (HB && g.speed === 'normal') ms = 250; else if (HB && g.speed === 'slow') ms = 700;
    g.timer = setTimeout(loop, hold || ms);
  }
  function runInstant(g, st) { // Sofort: bis zum Abpfiff, Entscheidungen nach Regeln
    var m = g.m, pol = CM.rulePolicy(st), L = live(g, st);
    while (!m.finished) { M.step(m); var inst = g.inst || CM.next(m); g.inst = null; if (inst) { var e = CM.choose(m, inst, pol(inst)); g.auto = (g.auto || 0) + 1; g.last = e; g.lastT = Date.now(); } }
    L.lastEv = m.events.length; stopTimer(g); U.render();
  }
  U.acts.cmRun = function () { var g = U.pcm; if (!g || g.timer || g.inst) return; if (g.speed === 'instant') { runInstant(g, U.st); return; } live(g, U.st).paused = false; g.timer = setTimeout(loop, 10); refresh(U.st, g); };
  U.acts.cmPause = function () { var g = U.pcm; stopTimer(g); refresh(U.st, g); U.liveUpdate([]); };
  U.acts.cmSpeed = function (d) {
    var g = U.pcm, st = U.st; if (!g) return; g.speed = d.v; if (d.v !== 'instant') st.settings.cmSpeed = d.v;
    if (d.v === 'instant') { stopTimer(g); runInstant(g, st); return; }
    refresh(st, g);
  };
  U.acts.cmFast = function () { U.acts.cmSpeed({ v: 'fast' }); };
  U.acts.cmSim = function () { var g = U.pcm; if (g) runInstant(g, U.st); };
  U.acts.cmPick = function (d) {
    var g = U.pcm, st = U.st; if (!g || !g.inst) return;
    var e = CM.choose(g.m, g.inst, +d.i); g.inst = null; g.last = e; g.lastT = Date.now();
    U.liveUpdate(g.m.events.slice(U.live.lastEv)); U.live.lastEv = g.m.events.length; refresh(st, g);
    setTimeout(function () { if (U.pcm === g && !g.inst && !g.m.finished && !g.timer) U.acts.cmRun(); }, 1400);
  };
  var baseDone = U.acts.cmDone;
  U.acts.cmDone = function () { var g = U.pcm; if (g) stopTimer(g); cancelAnimationFrame(U._raf); U.live = null; baseDone(); };
})(RFM);
