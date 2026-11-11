// ANWURF! – Oberfläche: Spieltagsvorbereitung, Live-Spiel (2D), Spielbericht, Saisonabschluss
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, M = R.match, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;
  U.speech = 'normal';

  // ---------- Spieltagsvorbereitung ----------
  // ---------- Spieltag: Vorbereitung (Aufstellung · Vorschau · Spielinfos) ----------
  var SPOS = { LA: [-8.2, 1.6], RL: [-5.2, 9.6], RM: [0, 10.6], RR: [5.2, 9.6], RA: [8.2, 1.6], KM: [0, 6.6], KM2: [2.4, 6.6], TW: [0, 16.4] };
  function hashStr(s) { var h = 7; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  // Aufstellung als halbes Handballfeld (Angriff aufs obere Tor): LA, RL, RM, RR, RA, Kreis – Torwart unten
  U.courtLineup = function (st, c) {
    var form = c.tactic.formation, roles = form === '6:0 + 2 Kreisläufer' ? ['TW', 'LA', 'RL', 'RR', 'RA', 'KM', 'KM2'] : ['TW', 'LA', 'RL', 'RM', 'RR', 'RA', 'KM'];
    var pos2 = form === '6:0 + 2 Kreisläufer' ? { RL: [-3.8, 9.8], RR: [3.8, 9.8], KM: [-2.4, 6.6] } : {};
    var W_ = 20, H_ = 20, s = '<svg class="court-lineup" viewBox="-11 -1.6 22 21" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="-11" y="-1.6" width="22" height="21" fill="#16294a"/><rect x="-10" y="0" width="20" height="' + H_ + '" fill="#2f7de0" stroke="#f8fafc" stroke-width=".14"/>';
    var z6 = [], z9 = [], n = 16;
    function zone(r, out) { for (var k = 0; k <= n; k++) { var t = Math.PI / 2 * k / n; out.push([-1.5 - Math.cos(t) * r, Math.sin(t) * r]); } for (var k2 = 0; k2 <= n; k2++) { var t2 = Math.PI / 2 * (1 - k2 / n); out.push([1.5 + Math.cos(t2) * r, Math.sin(t2) * r]); } }
    zone(6, z6); zone(9, z9); z9 = z9.filter(function (p) { return Math.abs(p[0]) <= 10; });
    var P = function (a) { return a.map(function (p) { return p[0].toFixed(2) + ',' + p[1].toFixed(2); }).join(' '); };
    s += '<polygon points="' + P(z6) + '" fill="#1e4fae" stroke="#f8fafc" stroke-width=".14"/><polyline points="' + P(z9) + '" fill="none" stroke="#f8fafc" stroke-width=".12" stroke-dasharray=".5 .4"/>';
    s += '<line x1="-.5" y1="7" x2=".5" y2="7" stroke="#fff" stroke-width=".14"/><line x1="-10" y1="20" x2="10" y2="20" stroke="#f8fafc" stroke-width=".14"/>';
    for (var g = 0; g < 6; g++) s += '<rect x="' + (-1.5 + g * 0.5) + '" y="-.55" width=".5" height=".55" fill="' + (g % 2 ? '#fff' : '#dc2626') + '"/>';
    roles.forEach(function (r, i) {
      var p = st.players[c.lineup[i]], xy = pos2[r] || SPOS[r]; if (!xy) return;
      var x = xy[0], y = xy[1], gk = r === 'TW';
      s += '<g class="cl-p" data-act="nav" data-s="mannschaft"><circle cx="' + x + '" cy="' + y + '" r=".95" fill="' + (gk ? '#facc15' : '#dc2626') + '" stroke="#fff" stroke-width=".16"/>' +
        '<text x="' + x + '" y="' + (y + 0.36) + '" text-anchor="middle" font-size=".95" font-weight="800" fill="' + (gk ? '#111' : '#fff') + '">' + (p && p.shirt ? p.shirt : r) + '</text>' +
        (p ? '<rect x="' + (x - 2.3) + '" y="' + (y + 1.15) + '" width="4.6" height="1.15" rx=".25" fill="rgba(11,20,38,.85)"/><text x="' + x + '" y="' + (y + 2) + '" text-anchor="middle" font-size=".75" font-weight="700" fill="#fff">' + esc(p.last.slice(0, 12)) + '</text>' : '') +
        '<text x="' + x + '" y="' + (y - 1.2) + '" text-anchor="middle" font-size=".6" font-weight="800" fill="#bfdbfe">' + (r === 'KM2' ? 'KM' : r) + '</text></g>';
    });
    return s + '</svg>';
  };
  function formLetters(arr) { return '<span class="form-letters">' + (arr || []).slice(-5).map(function (f) { var k = { W: 'S', D: 'U', L: 'N' }[f] || f; return '<b class="' + (k === 'S' ? 'pos' : k === 'N' ? 'neg' : 'warn') + '">' + k + '</b>'; }).join('') + '</span>'; }
  function clubRow(st, x) {
    var lk = W.lk(x), t = st.leagues[lk] ? S.table(st, lk) : [], r = t.filter(function (q) { return q.id === x.id; })[0] || { gf: 0, ga: 0, form: [] }, pos = t.indexOf(r) + 1;
    return { gf: r.gf, ga: r.ga, diff: r.gf - r.ga, pos: st.week && pos ? pos + '.' : '–', form: r.form.length ? r.form : (x.form || []) };
  }
  function h2h(st, A, B) {
    var out = []; Object.keys(st.leagues).forEach(function (k) { (st.leagues[k].fixtures || []).forEach(function (wk) { wk.forEach(function (f) { if (f.r && ((f.h === A.id && f.a === B.id) || (f.h === B.id && f.a === A.id))) out.push(f); }); }); });
    return out;
  }
  U.screens.spieltag = function () {
    var st = U.st, c = U.club();
    var prep = S.prepareWeek(st), mine = prep.list.filter(function (x) { return x.user; });
    var h = '<div class="page-h"><div><h1>Spieltag</h1><div class="page-sub">' + esc(c.name) + ' · ' + D.leagueNames[W.lk(c)] + ' · Saison ' + st.season + '/' + String(st.season + 1).slice(2) + ' · ' + S.calText(st) + '</div></div></div>';
    if (st.phase === 'seasonEnd') return h + '<div class="panel"><p>Die Saison ist beendet.</p><button class="primary" data-act="nav" data-s="saisonende">Zum Saisonabschluss</button></div>';
    if (!mine.length) return h + '<div class="panel">' + U.empty('calendar-days', 'Ihr Verein hat in dieser Woche kein Spiel.') + '<div class="row" style="justify-content:flex-end;margin-top:10px"><button class="primary" data-act="next">Weiter ' + U.lc('chevron-right', 16) + '</button></div></div>';
    var fx = mine[0], H = st.clubs[fx.h], A = st.clubs[fx.a], opp = fx.h === c.id ? A : H, can = U.can('sport');
    [H, A].forEach(function (x) { if (!x.userControlled || !x.manualLineup) M.autoBest(st, x); });
    var tab = U.p.stab || 'aufstellung', vtab = U.p.vtab || 'vorschau';
    var title = fx.comp === 'league' ? D.leagueNames[W.lk(c)] + ' – ' + (st.week + 1) + '. Spieltag' : fx.comp === 'releg' ? 'Aufstiegsrunde – ' + (st.relegLeg === 0 ? 'Hinspiel' : 'Rückspiel') : S.fxLabel(st, fx);
    // Linke Spalte: Aufstellung / Taktik / Teamansprache / Analyse
    var left = '<div class="panel md-left"><div class="seg seg-tabs">' + [['aufstellung', 'Aufstellung'], ['taktik', 'Taktik'], ['ansprache', 'Teamansprache'], ['analyse', 'Analyse']].map(function (x) { return '<button class="sm ' + (tab === x[0] ? 'on' : '') + '" data-act="mdTab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'aufstellung') {
      left += '<div class="md-court">' + U.courtLineup(st, c) + '</div><div class="row md-court-ctl"><span class="muted small">Spielsystem</span><select data-chg="formation"' + (can ? '' : ' disabled') + '>' + Object.keys(D.formations).map(function (f) { return '<option' + (c.tactic.formation === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>' +
        (can ? '<button class="primary sm" data-act="autoLineup">' + U.lc('zap', 14) + 'Beste Aufstellung</button>' : '') + '</div><p class="muted small" style="margin:6px 0 0">' + esc(D.formationInfo[c.tactic.formation].d) + ' Spieler antippen: Aufstellung bearbeiten.</p>';
    } else if (tab === 'taktik') left += can ? U.tacticControls(c.tactic, 'clubTactic', true) : U.roleNote('sport');
    else if (tab === 'ansprache') left += can ? D.speeches.map(function (s) { return '<div class="choice ' + (U.speech === s.id ? 'on' : '') + '" style="margin-bottom:6px;padding:9px" data-act="pickSpeech" data-k="' + s.id + '">' + esc(s.t) + '</div>'; }).join('') : U.roleNote('sport');
    else {
      var keyP = W.squad(st, opp.id).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 4), so = M.squadStrength(st, opp), sc = M.squadStrength(st, c);
      left += '<div class="help">' + esc(opp.short) + ' spielt meist <b>' + esc(opp.tactic.formation) + '</b>, Trainertyp „' + esc(opp.coach.profile) + '“. ' + (so > sc + 3 ? 'Klar favorisiert – kompakt stehen, Tempo rausnehmen.' : so < sc - 3 ? 'Sie sind Favorit – mit hohem Tempo und Gegenstößen Druck machen.' : 'Ein Duell auf Augenhöhe.') + '</div>' +
        '<h3 style="margin-top:10px">Schlüsselspieler ' + esc(opp.short) + '</h3><table class="t small">' + keyP.map(function (p) { return '<tr><td>' + esc(W.playerName(p)) + '</td><td>' + U.posTag(p.pos) + '</td><td class="num">' + U.ovrBadge(p.ovr) + '</td></tr>'; }).join('') + '</table>';
    }
    left += '</div>';
    // Mitte: Begegnung mit Vorschau / Direktvergleich / Statistiken / Berichte
    var rH = clubRow(st, H), rA = clubRow(st, A), est = fx.neutral ? null : E.attendance(st, H, A, fx.comp);
    var ref = R.pick ? null : null, rs = hashStr(fx.key || (H.id + A.id + st.week)), refName = D.firstNames[rs % D.firstNames.length] + ' ' + D.lastNames[(rs >>> 5) % D.lastNames.length];
    var mid = '<div class="panel md-mid"><div class="md-title">' + esc(title).toUpperCase() + (H.rivals.indexOf(A.id) >= 0 ? ' <span class="pill warn">Derby</span>' : '') + '</div>' +
      '<div class="md-teams"><div>' + U.crest(H, 52) + '<b>' + esc(H.name) + '</b></div><span>–</span><div>' + U.crest(A, 52) + '<b>' + esc(A.name) + '</b></div></div>' +
      '<div class="seg seg-tabs">' + [['vorschau', 'Vorschau'], ['h2h', 'Direktvergleich'], ['stats', 'Statistiken'], ['berichte', 'Berichte']].map(function (x) { return '<button class="sm ' + (vtab === x[0] ? 'on' : '') + '" data-act="mdVTab" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (vtab === 'vorschau') {
      mid += '<div class="md-facts"><div>' + U.lc('stadium', 18) + '<span><b>' + esc(fx.neutral ? 'Barclays Arena Hamburg' : H.stadiumName) + '</b><small>' + (est ? R.fmtNum(est.capacity) + ' Plätze · erwartet ' + R.fmtNum(est.total) : 'Final Four') + '</small></span></div><div>' + U.lc('calendar-days', 18) + '<span><b>' + (fx.comp === 'league' ? (st.week + 1) + '. Spieltag' : esc(S.fxLabel(st, fx))) + '</b><small>19:30 Uhr</small></span></div><div>' + U.lc('flag', 18) + '<span><b>SR: ' + esc(refName) + '</b><small>Schiedsrichtergespann</small></span></div></div>' +
        '<table class="t md-cmp"><thead><tr><th>' + U.crest(H, 18) + ' ' + esc(H.short) + '</th><th></th><th style="text-align:right">' + esc(A.short) + ' ' + U.crest(A, 18) + '</th></tr></thead>' +
        [['Tore', rH.gf, rA.gf], ['Gegentore', rH.ga, rA.ga], ['Tordifferenz', (rH.diff > 0 ? '+' : '') + rH.diff, (rA.diff > 0 ? '+' : '') + rA.diff], ['Tabellenplatz', rH.pos, rA.pos]].map(function (r) { return '<tr><td><b>' + r[1] + '</b></td><td class="muted" style="text-align:center">' + r[0] + '</td><td style="text-align:right"><b>' + r[2] + '</b></td></tr>'; }).join('') +
        '<tr><td>' + formLetters(rH.form) + '</td><td class="muted" style="text-align:center">Form</td><td style="text-align:right">' + formLetters(rA.form) + '</td></tr></table>';
    } else if (vtab === 'h2h') {
      var hh = h2h(st, H, A);
      mid += hh.length ? '<table class="t">' + hh.map(function (f) { return '<tr><td>' + esc(st.clubs[f.h].short) + ' – ' + esc(st.clubs[f.a].short) + '</td><td class="num"><b>' + f.r.hg + ':' + f.r.ag + '</b></td></tr>'; }).join('') + '</table>' : U.empty('history', 'In dieser Saison noch kein Direktvergleich.');
    } else if (vtab === 'stats') {
      var row = function (l, a1, b1) { return '<tr><td><b>' + a1 + '</b></td><td class="muted" style="text-align:center">' + l + '</td><td style="text-align:right"><b>' + b1 + '</b></td></tr>'; };
      var inj = function (x) { return W.squad(st, x.id).filter(function (p) { return p.inj || p.susp > 0; }).length; };
      mid += '<table class="t md-cmp">' + row('Stärke (Sieben)', Math.round(M.squadStrength(st, H)), Math.round(M.squadStrength(st, A))) + row('Abwehrsystem', esc(H.tactic.formation), esc(A.tactic.formation)) + row('Trainer', esc(U.coachName(H)), esc(U.coachName(A))) + row('Ausfälle', inj(H), inj(A)) + row('Teamchemie', Math.round(H.chemistry), Math.round(A.chemistry)) + '</table>';
    } else {
      var lr = (st.lastResults || []).filter(function (r) { return r.h === H.id || r.a === H.id || r.h === A.id || r.a === A.id; });
      mid += lr.length ? '<table class="t">' + lr.map(function (r) { return '<tr><td>' + esc(st.clubs[r.h].short) + ' – ' + esc(st.clubs[r.a].short) + '</td><td class="num"><b>' + r.hg + ':' + r.ag + '</b></td></tr>'; }).join('') + '</table>' : U.empty('newspaper', 'Noch keine Spielberichte aus dieser Saison.');
    }
    mid += '</div>';
    // Rechte Spalte: Spielinfos und Start
    var info = [];
    [c, opp].forEach(function (x) {
      W.squad(st, x.id).forEach(function (p) {
        if (p.susp > 0) info.push(['ban', 'warn', esc(p.last) + ' (' + esc(x.short) + ') ist gesperrt.']);
        else if (p.inj) info.push(['cross', 'neg', esc(p.last) + ' (' + esc(x.short) + ', ' + esc(p.pos) + ') fällt aus' + (p.inj.type ? ' – ' + esc(p.inj.type) : '') + '.']);
        else if (x === c && p.fitness < 72 && c.lineup.indexOf(p.id) >= 0) info.push(['triangle-alert', 'warn', esc(p.last) + ' ist angeschlagen (Fitness ' + Math.round(p.fitness) + ' %).']);
      });
    });
    var cap = st.players[c.captain]; if (cap && !cap.inj && !(cap.susp > 0)) info.unshift(['info', 'act', 'Kapitän ' + esc(cap.last) + ' ist einsatzbereit.']);
    var hh2 = h2h(st, H, A); if (hh2.length) { var wOpp = hh2.filter(function (f) { var og = f.h === opp.id ? f.r.hg - f.r.ag : f.r.ag - f.r.hg; return og > 0; }).length; info.push(['chart-column', 'act', esc(opp.short) + ' gewann ' + wOpp + ' der letzten ' + hh2.length + ' Duelle.']); }
    if (!info.length) info.push(['check', 'pos', 'Alle Spieler einsatzbereit.']);
    var right = '<div class="panel md-right"><h2 class="md-h">Spielinfos</h2><div class="md-info">' + info.slice(0, 6).map(function (x) { return '<div><span class="ic-' + x[1] + '">' + U.lc(x[0], 17) + '</span><span>' + x[2] + '</span></div>'; }).join('') + '</div>' +
      '<div class="md-speed"><span class="muted small">Spielgeschwindigkeit</span><div class="seg">' + [['normal', 'Normal'], ['schnell', 'Schnell'], ['sofort', 'Sofort']].map(function (x) { return '<button class="sm ' + (st.settings.matchSpeed === x[0] ? 'on' : '') + '" data-act="setSpeed" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
      '<button class="primary md-start" data-act="next">' + U.lc('play', 18) + ' Spiel starten</button></div>';
    return h + '<div class="matchday">' + left + mid + right + '</div>';
  };
  U.acts.mdTab = function (d) { U.p.stab = d.v; U.render(); };
  U.acts.mdVTab = function (d) { U.p.vtab = d.v; U.render(); };
  U.acts.pickSpeech = function (d) { U.speech = d.k; U.render(); };
  U.acts.setSpeed = function (d) { U.st.settings.matchSpeed = d.v; U.render(); };

  // ---------- Live-Spiel ----------
  // Zuschauerzeile Heim/Gäste (Anzeigetafel, Vorschau)
  U.attLine = function (att, H, A, cls) {
    if (!att || att.guests == null) return '';
    var home = Math.max(0, att.total - att.guests);
    return '<div class="' + cls + '"><em>' + U.lc('users', 13) + ' <b>' + R.fmtNum(att.total) + '</b> Zuschauer' + (att.total >= (att.capacity || 1e9) * 0.98 ? ' · ausverkauft' : '') + '</em><span>' + esc(H.short) + ' ' + R.fmtNum(home) + ' · ' + esc(A.short) + ' ' + R.fmtNum(att.guests) + '</span></div>';
  };
  U.startLive = function (fixtures) { U.live = { queue: fixtures, idx: 0, played: {} }; U.liveNext(); };
  U.liveNext = function () {
    var st = U.st, L = U.live, fx = L.queue[L.idx];
    var m = S.createMatch(st, fx);
    m.userLive = true;
    var side = m.userSide;
    if (side >= 0 && U.can('sport')) { var sp = D.speeches.filter(function (s) { return s.id === U.speech; })[0]; if (sp) M.applySpeech(m, side, sp, false); }
    L.att = fx.neutral ? null : E.attendance(st, st.clubs[m.clubs[0]], st.clubs[m.clubs[1]], fx.comp === 'friendly' ? 'friendly' : fx.comp);
    L.m = m; L.paused = false; L.halftimeDone = false; L.lastEv = m.events.length; L.shown = 0; L.anim = U.initAnim(m); L.flash = null;
    U.liveActive = true;
    U.go('match');
    U.liveSchedule();
  };
  U.liveSpeedMs = function () { var s = U.st.settings.matchSpeed; return s === 'normal' ? 1500 : s === 'schnell' ? 260 : 0; };
  U.liveSchedule = function () {
    var L = U.live; clearTimeout(L.timer);
    if (!L || L.paused || L.m.finished) return;
    var ms = U.liveSpeedMs();
    if (!ms) { U.acts.matchSkip(); return; }
    L.timer = setTimeout(U.liveTick, L.hold ? L.hold : ms);
    L.hold = 0;
  };
  U.liveTick = function () {
    var L = U.live, m = L.m; if (!L || L.paused) return;
    var before = m.stats.possTicks.slice();
    M.step(m);
    L.anim.poss = m.stats.possTicks[0] > before[0] ? 0 : 1;
    var news = m.events.slice(L.lastEv); L.lastEv = m.events.length;
    var normal = U.st.settings.matchSpeed === 'normal';
    news.forEach(function (e) {
      if (e.type === 'goal') { L.flash = { t: Date.now(), side: e.side }; L.hold = normal ? 1000 : 260; U.animShot(L.anim, e.side, true, e); U.beep(880, 0.12); }
      else if ((e.type === 'save' || e.type === 'miss') && normal) { U.animShot(L.anim, e.side, false, e); }
      else if (e.type === 'chance') U.animAttack(L.anim, e.side);
      else if (e.type === 'red') { L.hold = normal ? 1200 : 400; }
    });
    U.liveUpdate(news);
    var userCoach = m.userSide >= 0 && U.can('sport');
    if (m.half === 2 && !L.halftimeDone && m.minute === M.HALF + 1) { L.halftimeDone = true; if (userCoach) { L.paused = true; U.showHalftime(); return; } }
    if (m.needSub && userCoach) { L.paused = true; U.showLiveTactics('Verletzung! Bitte wechseln Sie einen Spieler ein.'); return; }
    if (m.finished) { U.liveEnd(); return; }
    U.liveSchedule();
  };
  U.liveEnd = function () {
    var L = U.live; clearTimeout(L.timer);
    U.liveUpdate([]);
    var btn = document.getElementById('liveCtl');
    var more = L.idx + 1 < L.queue.length;
    if (btn) btn.innerHTML = '<button class="primary" data-act="liveContinue">' + (more ? 'Weiter zum nächsten Spiel ▶' : 'Zum Spielbericht ▶') + '</button>';
    U.beep(440, 0.4);
  };
  U.acts.liveContinue = function () {
    var L = U.live; L.played[L.m.key] = L.m; L.idx++;
    if (L.idx < L.queue.length) { U.liveNext(); return; }
    U.liveActive = false; cancelAnimationFrame(U._raf);
    var played = L.played; U.live = null;
    U.finishWeek(played);
  };
  U.acts.matchPause = function () {
    var L = U.live; if (!L || L.m.finished) return;
    L.paused = !L.paused;
    if (!L.paused) { U.closeModal(); U.liveSchedule(); } else if (L.m.userSide >= 0 && U.can('sport')) U.showLiveTactics();
    U.liveUpdate([]);
  };
  U.acts.matchSkip = function () {
    var L = U.live; if (!L) return; clearTimeout(L.timer);
    var m = L.m;
    m.autoSub = true;
    while (!m.finished) M.step(m);
    L.lastEv = m.events.length; U.go('match'); U.liveEnd();
  };
  U.acts.matchSpeed = function (d) { U.st.settings.matchSpeed = d.v; if (d.v === 'sofort') U.acts.matchSkip(); else U.liveUpdate([]); };

  // Trikotfarben fürs Live-Spiel: Heim in Vereinsfarben, Gast weicht bei ähnlichen Farben auf Zweitfarbe
  // bzw. Ausweichtrikot (Weiß oder Dunkel) aus – nie mehr „Rot gegen Rot“
  function rgb(h) { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h.replace(/(.)/g, '$1$1'); var n = parseInt(h, 16) || 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function cdist(a, b) { var x = rgb(a), y = rgb(b), rm = (x[0] + y[0]) / 2, dr = x[0] - y[0], dg = x[1] - y[1], db = x[2] - y[2]; return Math.sqrt((2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db); }
  function lum(h) { var c = rgb(h); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000; }
  U.matchKits = function (H, A) {
    var hk = { fill: H.colors[0], stroke: H.colors[1] || '#ffffff' };
    var MIN = 190, cand = [[A.colors[0], A.colors[1]], [A.colors[1], A.colors[0]], ['#ffffff', A.colors[0]], ['#111827', A.colors[0]], ['#facc15', '#111827'], ['#0ea5e9', '#ffffff']];
    var ak = null;
    for (var i = 0; i < cand.length && !ak; i++) if (cand[i][0] && cdist(cand[i][0], hk.fill) >= MIN && cdist(cand[i][0], hk.stroke) >= 90) ak = { fill: cand[i][0], stroke: cand[i][1] || '#ffffff', alt: i > 0 };
    if (!ak) ak = { fill: lum(hk.fill) > 140 ? '#111827' : '#ffffff', stroke: A.colors[0], alt: true };
    if (cdist(ak.stroke, ak.fill) < 80) ak.stroke = lum(ak.fill) > 140 ? '#111827' : '#ffffff';
    [hk, ak].forEach(function (k) { k.text = lum(k.fill) > 150 ? '#111' : '#fff'; });
    hk.gk = '#111111'; ak.gk = cdist('#111111', ak.fill) < 120 || cdist('#111111', hk.fill) < 120 ? '#a3e635' : '#f97316';
    if (cdist(hk.gk, ak.fill) < 120 || cdist(hk.gk, hk.fill) < 120) hk.gk = '#7c3aed';
    return [hk, ak];
  };
  U.screens.match = function () {
    var L = U.live; if (!L) return U.screens.spieltag();
    var st = U.st, m = L.m, H = st.clubs[m.clubs[0]], A = st.clubs[m.clubs[1]], K = L.kits = U.matchKits(H, A);
    var h = '<div class="match-grid"><div style="position:relative"><canvas id="pitchCv" class="match-canvas" width="680" height="1000"></canvas><div id="flashBox"></div></div><div class="grid" style="align-content:start">';
    h += '<div class="scoreboard"><div class="sb-top"><span>' + esc(m.neutral ? 'Final Four · Hamburg' : H.stadiumName).toUpperCase() + '</span><span id="sbMin">0\'</span></div>' + U.attLine(L.att, H, A, 'sb-att') +
      '<div class="sb-row" style="background:' + K[0].fill + ';color:' + K[0].text + ';box-shadow:inset 6px 0 0 ' + K[0].stroke + '"><span>' + esc(H.short) + '</span><span class="g" id="sbH">0</span></div>' +
      '<div class="sb-row" style="background:' + K[1].fill + ';color:' + K[1].text + ';box-shadow:inset 6px 0 0 ' + K[1].stroke + '"><span>' + esc(A.short) + (K[1].alt ? ' <small style="opacity:.7;font-size:10px">Ausweichtrikot</small>' : '') + '</span><span class="g" id="sbA">0</span></div></div>';
    h += '<div class="panel" style="padding:10px"><div class="row" id="liveCtl"><button data-act="matchPause" id="pauseBtn">⏸ Pause</button><div class="seg">' + [['normal', 'Normal'], ['schnell', 'Schnell'], ['sofort', 'Sofort']].map(function (x) { return '<button class="sm ' + (st.settings.matchSpeed === x[0] ? 'on' : '') + '" data-act="matchSpeed" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div><button data-act="matchSkip">⏭ Überspringen</button>' + (m.userSide >= 0 && U.can('sport') ? '<button data-act="liveTactics">🔁 Wechsel/Taktik</button><button data-act="liveDrive" id="toBtn">⏱ Auszeit</button>' : '<span class="muted small">' + (m.userSide >= 0 ? 'Als Geschäftsführer verfolgen Sie das Spiel von der Tribüne.' : '') + '</span>') + '</div></div>';
    h += '<div class="panel" style="padding:10px"><div class="row between small"><span>Würfe</span><span id="stShots">0 : 0</span></div><div class="row between small"><span>Paraden</span><span id="stSv">0 : 0</span></div><div class="row between small"><span>7-Meter</span><span id="stCh">0 : 0</span></div><div class="row between small"><span>Zeitstrafen</span><span id="stPoss">0 : 0</span></div><div class="row between small"><span>Auszeiten übrig</span><span id="stTo">3 : 3</span></div></div>';
    h += '<div class="ticker" id="ticker"></div></div></div>';
    U.after = function () { U.liveUpdate([], true); U.animLoop(); };
    return h;
  };
  U.liveUpdate = function (news, full) {
    var L = U.live; if (!L) return; var m = L.m;
    var g = function (id) { return document.getElementById(id); };
    if (!g('sbMin')) return;
    g('sbMin').textContent = (m.finished ? 'ENDE ' : '') + Math.min(m.minute, m.maxMinute) + '\'' + (L.paused && !m.finished ? ' ⏸' : '');
    g('sbH').textContent = m.score[0] + (m.pens ? ' (' + m.pens[0] + ')' : ''); g('sbA').textContent = m.score[1] + (m.pens ? ' (' + m.pens[1] + ')' : '');
    g('stPoss').textContent = m.stats.twoMin[0] + ' : ' + m.stats.twoMin[1];
    g('stShots').textContent = m.stats.shots[0] + ' : ' + m.stats.shots[1]; g('stCh').textContent = m.stats.corners[0] + ' : ' + m.stats.corners[1];
    g('stSv').textContent = m.stats.saves[0] + ' : ' + m.stats.saves[1]; g('stTo').textContent = m.timeouts[0] + ' : ' + m.timeouts[1];
    var tb = g('toBtn'); if (tb) tb.disabled = m.finished || m.timeouts[m.userSide] <= 0;
    var pb = g('pauseBtn'); if (pb) pb.textContent = L.paused ? '▶ Weiter' : '⏸ Pause';
    var tk = g('ticker');
    if (full) L.shown = 0;
    var list = m.events.slice(L.shown || 0); L.shown = m.events.length;
    var important = { goal: 1, red: 1, injury: 1, sub: 1, ht: 1, ft: 1, kickoff: 1, et: 1, pens: 1, tactic: 1, speech: 1, yellow: 1, info: 1, save: 1, miss: 1, chance: 1 };
    var quick = U.st.settings.matchSpeed !== 'normal';
    var html = list.filter(function (e) { return important[e.type] && !(quick && (e.type === 'chance' || e.type === 'miss')); }).map(function (e) {
      var cls = e.type === 'goal' ? 'goal' : e.type === 'yellow' ? 'card-y' : e.type === 'red' ? 'card-r' : e.type === 'injury' ? 'inj' : '';
      return '<div class="' + cls + '"><span class="m">' + e.min + '\'</span>' + (e.type === 'yellow' ? (e.twomin ? '⏱ ' : '🟨 ') : e.type === 'red' ? '🟥 ' : e.type === 'goal' ? '🤾 ' : e.type === 'injury' ? '✚ ' : e.type === 'sub' ? '🔁 ' : '') + esc(e.text) + '</div>';
    }).reverse().join('');
    if (full) tk.innerHTML = html; else if (html) tk.insertAdjacentHTML('afterbegin', html);
    if (L.flash && Date.now() - L.flash.t < 300) {
      var fb = g('flashBox'); var club = U.st.clubs[m.clubs[L.flash.side]];
      fb.innerHTML = '<div class="goal-flash">TOR!<br><span style="font-size:22px">' + esc(club.short) + '</span></div>';
      setTimeout(function () { if (fb) fb.innerHTML = ''; }, 1500);
    }
  };
  U.showHalftime = function () {
    U.modalLock = true;
    var m = U.live.m;
    U.modal('Halbzeit – ' + m.score[0] + ':' + m.score[1], '<p>Was sagen Sie Ihrer Mannschaft in der Kabine?</p><div class="grid g2">' + D.halftimeTalks.map(function (t) { return '<button data-act="htTalk" data-k="' + t.id + '">' + esc(t.t) + '</button>'; }).join('') + '</div>', '<button data-act="htTalk" data-k="">Nichts sagen</button><button data-act="htTactics">Wechsel/Taktik</button>');
  };
  U.acts.htTalk = function (d) {
    var m = U.live.m; if (d.k) M.applySpeech(m, m.userSide, D.halftimeTalks.filter(function (t) { return t.id === d.k; })[0], true);
    U.closeModal(); U.live.paused = false; U.liveUpdate(m.events.slice(-1)); U.liveSchedule();
  };
  U.acts.htTactics = function () { U.closeModal(); U.showLiveTactics(); };
  U.acts.liveTactics = function () { var L = U.live; if (!L || L.m.finished) return; L.paused = true; clearTimeout(L.timer); U.showLiveTactics(); U.liveUpdate([]); };
  U.showLiveTactics = function (msg) {
    var st = U.st, L = U.live, m = L.m, s = m.userSide, slots = D.formations[m.tactic[s].formation];
    U.modalLock = !!m.needSub;
    var h = (msg ? '<div class="help" style="margin-bottom:10px">' + esc(msg) + '</div>' : '') + '<div class="grid g2"><div><h3>Auf dem Feld <span class="muted small">(Wechsel unbegrenzt · Auszeiten: ' + m.timeouts[s] + ')</span></h3><table class="t">' + m.onPitch[s].map(function (pid, i) {
      if (!pid) return '<tr><td>' + slots[i][0] + '</td><td class="muted" colspan="3">— unbesetzt —</td></tr>';
      var p = st.players[pid];
      return '<tr class="click ' + (U.subOut === pid ? 'sel' : '') + '" data-act="subOut" data-id="' + pid + '"><td>' + slots[i][0] + '</td><td>' + esc(W.shortName(p)) + (m.injured[pid] ? ' <span class="tag red">verletzt</span>' : '') + (m.yellows[pid] ? ' 🟨' : '') + (m.twoMins[pid] ? ' ⏱' + (m.twoMins[pid] > 1 ? '×' + m.twoMins[pid] : '') : '') + '</td><td>' + U.bar(m.fit[pid], 100, m.fit[pid] < 65 ? '#f5b301' : null) + '</td><td class="num">' + (m.rating[pid] || 6).toFixed(1) + '</td></tr>';
    }).join('') + '</table></div><div><h3>Bank</h3><table class="t">' + m.bench[s].map(function (pid) {
      var p = st.players[pid];
      return '<tr class="click" data-act="subIn" data-id="' + pid + '"><td>' + U.posTag(p.pos) + '</td><td>' + esc(W.shortName(p)) + '</td><td class="num">' + U.ovrBadge(p.ovr) + '</td></tr>';
    }).join('') + '</table><p class="muted small">Erst einen Spieler auf dem Feld, dann einen von der Bank anklicken. Ausgewechselte Spieler können wieder rein.</p></div></div>';
    h += '<div style="margin-top:12px"><b>Abwehrsystem</b> <select data-chg="liveFormation">' + Object.keys(D.formations).map(function (f) { return '<option' + (f === m.tactic[s].formation ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select> <button data-act="liveDrive"' + (m.timeouts[s] > 0 ? '' : ' disabled') + '>⏱ Team-Timeout (' + m.timeouts[s] + ')</button></div>' + U.tacticControls(m.tactic[s], 'liveTac', true);
    U.modal('Wechsel & Taktik – ' + m.minute + '. Minute', h, m.needSub && m.subsLeft[s] > 0 ? '<button data-act="liveResume" disabled>Weiterspielen</button>' : '<button class="primary" data-act="liveResume">▶ Weiterspielen</button>', true);
  };
  U.acts.subOut = function (d) { U.subOut = d.id; U.showLiveTactics(); };
  U.acts.subIn = function (d) {
    var m = U.live.m;
    if (!U.subOut) { U.toast('Zuerst den Spieler auf dem Platz wählen.'); return; }
    if (!M.substitute(m, m.userSide, U.subOut, d.id)) U.toast('Wechsel nicht möglich.');
    U.subOut = null; U.showLiveTactics(); U.liveUpdate(m.events.slice(-1));
  };
  U.acts.liveFormation = function (d, el) { var m = U.live.m; M.changeFormation(m, m.userSide, el.value); U.live.anim = U.initAnim(m, U.live.anim); U.showLiveTactics(); };
  U.acts.liveTac = function (d) { var m = U.live.m; M.changeTactic(m, m.userSide, d.k, +d.v); U.showLiveTactics(); };
  U.acts.liveDrive = function () { var m = U.live.m; if (M.driveOn(m, m.userSide)) U.toast('Team-Timeout! Die Mannschaft sammelt sich.'); else U.toast('Keine Auszeit mehr übrig.'); U.liveUpdate(m.events.slice(-1)); var md = document.getElementById('modal'); if (U.live.paused && md && !md.classList.contains('hidden')) U.showLiveTactics(); };
  U.acts.liveResume = function () {
    var m = U.live.m;
    if (m.needSub) { if (m.subsLeft[m.userSide] <= 0) { var i = m.onPitch[m.userSide].indexOf(m.needSub.pid); if (i >= 0) m.onPitch[m.userSide][i] = null; m.needSub = null; } else return; }
    U.modalLock = false; U.closeModal(); U.live.paused = false; U.liveUpdate(m.events.slice(-3)); U.liveSchedule();
  };

  // ---------- 2D-Live-Ansicht (Canvas, Draufsicht) ----------
  // Handballtypische Choreografie statt Gewusel: Jeder Angreifer hat seine feste Position (LA, RL, RM, RR, RA, Kreis).
  // Der Ball läuft mit Druck von links nach rechts und zurück; der Ballführende stößt in die Lücke, kreuzt mit dem
  // Nebenmann oder geht ins 1:1 und spielt dann ab. Der Kreisläufer wandert mit dem Ball. Die Abwehr steht im gewählten
  // System (6:0, 5:1, 3:2:1, 4:2), verschiebt zum Ball, der Abwehrspieler am Ball tritt heraus.
  // Rechnen in Metern im „Angriffsrahmen“: x quer (links aus Sicht des Angreifers negativ), d = Abstand zur Torlinie
  // des angegriffenen Tores. Erst zum Zeichnen wird in Feldkoordinaten (20 × 40 m, Heim greift nach oben an) umgerechnet.
  var ROLE_BASE = { LA: [-8.6, 1.3], RL: [-5.2, 9.4], RM: [0, 10.4], RR: [5.2, 9.4], RA: [8.6, 1.3], KM: [0, 6.4] };
  var ROLE_BASE2 = { LA: [-8.6, 1.3], RL: [-3.6, 9.8], RR: [3.6, 9.8], RA: [8.6, 1.3], KM: [-2.2, 6.4], KM2: [2.2, 6.4] };
  var DEF = { // Abwehrposition je Rolle (eigener Blick: links negativ), d = Abstand zum eigenen Tor
    '6:0': { LA: [-7.6, 6.6], RL: [-4.6, 6.8], KM: [-1.5, 6.4], RM: [1.5, 6.4], KM2: [1.5, 6.4], RR: [4.6, 6.8], RA: [7.6, 6.6] },
    '5:1': { LA: [-7.6, 6.6], RL: [-3.8, 6.7], KM: [0, 6.4], RR: [3.8, 6.7], RA: [7.6, 6.6], RM: [0, 10.2], KM2: [0, 10.2] },
    '3:2:1': { LA: [-7.2, 6.5], KM: [0, 6.3], RA: [7.2, 6.5], RL: [-4.2, 9.0], RR: [4.2, 9.0], RM: [0, 10.8], KM2: [0, 10.8] },
    '4:2': { LA: [-6.6, 6.6], KM: [-2.1, 6.4], RM: [2.1, 6.4], KM2: [2.1, 6.4], RA: [6.6, 6.6], RL: [-3.6, 9.4], RR: [3.6, 9.4] }
  };
  function rolesOf(form) { return form === '6:0 + 2 Kreisläufer' ? ['TW', 'LA', 'RL', 'RR', 'RA', 'KM', 'KM2'] : ['TW', 'LA', 'RL', 'RM', 'RR', 'RA', 'KM']; }
  function defForm(form) { return DEF[form] ? form : '6:0'; }
  U.initAnim = function (m, prev) {
    var a = prev || { pos: {}, ball: { x: 0, y: 20 }, poss: 0, cur: m.ball || 0, holder: 3, dir: 1, phase: 'transit', t0: 0, flight: null, shot: null, cross: null, push: [0, 0], next1on1: false, q: [], acts: 0 };
    a.roles = [0, 1].map(function (s) { return rolesOf(m.tactic[s].formation); });
    a.def = [0, 1].map(function (s) { return defForm(m.tactic[s].formation); });
    return a;
  };
  // Die Spielberechnung liefert pro Takt eine ganze Spielminute. Die Ansicht spielt ruhige, eigene Angriffe und baut
  // Würfe aus der Berechnung in den nächsten Angriff des richtigen Teams ein (Warteschlange je Seite, max. 2).
  U.animAttack = function (a, side) { if (side === a.cur) a.next1on1 = true; };
  U.animShot = function (a, side, goal, e) { a.q = a.q || []; var mine = a.q.filter(function (x) { return x.side === side; }); if (mine.length >= 2) a.q.splice(a.q.indexOf(mine[0]), 1); a.q.push({ side: side, goal: goal, pid: e && e.pid, kind: e && e.kind }); };
  U.animLoop = function () {
    cancelAnimationFrame(U._raf);
    var cv = document.getElementById('pitchCv'); if (!cv || !U.live) return;
    var ctx = cv.getContext('2d'), Wd = cv.width, Ht = cv.height;
    var L = U.live, m = L.m, st = U.st, a = L.anim, last = Date.now(), clock = 0;
    var MG = 26, CW = Wd - 2 * MG, CL = Ht - 2 * MG, MPP = CL / 40;
    function SX(x) { return Wd / 2 + x * MPP; } function SY(y) { return MG + y * MPP; }
    // Angriffsrahmen → Feld (Heim = Seite 0 greift das obere Tor an)
    function toField(side, x, d) { return side === 0 ? { x: x, y: d } : { x: -x, y: 40 - d }; }
    function zonePts(r) { var pts = [], n = 18; for (var k = 0; k <= n; k++) { var t = Math.PI / 2 * k / n; pts.push([-1.5 - Math.cos(t) * r, Math.sin(t) * r]); } for (var k2 = 0; k2 <= n; k2++) { var t2 = Math.PI / 2 * (1 - k2 / n); pts.push([1.5 + Math.cos(t2) * r, Math.sin(t2) * r]); } return pts.filter(function (p) { return Math.abs(p[0]) <= 10; }); }
    var Z6 = zonePts(6), Z9 = zonePts(9);
    function drawPitch() {
      ctx.fillStyle = '#16294a'; ctx.fillRect(0, 0, Wd, Ht);
      ctx.fillStyle = '#2f7de0'; ctx.fillRect(MG, MG, CW, CL);
      ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 3; ctx.strokeRect(MG, MG, CW, CL);
      ctx.beginPath(); ctx.moveTo(MG, SY(20)); ctx.lineTo(MG + CW, SY(20)); ctx.stroke();
      ctx.beginPath(); ctx.arc(SX(0), SY(20), 2 * MPP, 0, 7); ctx.stroke();
      [0, 40].forEach(function (gl) {
        var dir = gl === 0 ? 1 : -1;
        ctx.beginPath(); Z6.forEach(function (p, i) { var X = SX(p[0]), Y = SY(gl + dir * p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
        ctx.lineTo(SX(Z6[Z6.length - 1][0]), SY(gl)); ctx.lineTo(SX(Z6[0][0]), SY(gl)); ctx.closePath(); ctx.fillStyle = '#1e4fae'; ctx.fill();
        ctx.beginPath(); Z6.forEach(function (p, i) { var X = SX(p[0]), Y = SY(gl + dir * p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
        ctx.save(); ctx.setLineDash([12, 9]); ctx.beginPath(); Z9.forEach(function (p, i) { var X = SX(p[0]), Y = SY(gl + dir * p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore();
        ctx.fillStyle = '#fff'; ctx.fillRect(SX(-0.5), SY(gl + dir * 7) - 1.5, MPP, 3); ctx.fillRect(SX(-0.08), SY(gl + dir * 4) - 1.5, 0.16 * MPP, 3);
        // Tor 3 m, rot-weiß, mit Netz
        var gy = SY(gl), depth = dir * -0.9 * MPP;
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(SX(-1.5), Math.min(gy, gy + depth), 3 * MPP, Math.abs(depth));
        for (var s = 0; s < 6; s++) { ctx.fillStyle = s % 2 ? '#fff' : '#dc2626'; ctx.fillRect(SX(-1.5 + s * 0.5), gy - 2, 0.5 * MPP, 4); }
      });
      [-4.5, 4.5].forEach(function (x) { ctx.fillStyle = '#fff'; ctx.fillRect(SX(x) - 1.5, MG - 6, 3, 12); ctx.fillRect(SX(x) - 1.5, MG + CL - 6, 3, 12); });
    }
    function lerp(p, q, f) { return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f }; }
    function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
    // Ballkreislauf: Reihenfolge der Ballträger von links nach rechts (ohne Torwart und Kreis)
    function carriers(s) { var R = a.roles[s], out = []; R.forEach(function (r, i) { if (r !== 'TW' && r.indexOf('KM') < 0 && m.onPitch[s][i]) out.push(i); }); out.sort(function (i, j) { return base(s, R[i])[0] - base(s, R[j])[0]; }); return out; }
    function base(s, role) { var B = a.roles[s].indexOf('KM2') >= 0 ? ROLE_BASE2 : ROLE_BASE; return B[role] || [0, 10]; }
    function newPossession(now) {
      var c = carriers(a.cur); a.holder = c[Math.floor(c.length / 2)] || c[0]; a.dir = Math.random() < 0.5 ? 1 : -1;
      a.phase = 'transit'; a.t0 = now; a.start = now; a.flight = null; a.cross = null; a.action = null; a.acts = 0; a.maxActs = 3 + Math.floor(Math.random() * 3);
    }
    function switchPoss(now) { a.cur = 1 - a.cur; newPossession(now); }
    function nextReceiver(s) {
      var c = carriers(s), k = c.indexOf(a.holder);
      if (k < 0) return c[0];
      if (Math.random() < 0.12) { var piv = a.roles[s].indexOf('KM'); if (piv >= 0 && m.onPitch[s][piv]) return piv; } // Anspiel an den Kreis
      var n = k + a.dir; if (n < 0 || n >= c.length) { a.dir = -a.dir; n = k + a.dir; }
      if (Math.random() < 0.1 && c[n + a.dir] != null) n += a.dir; // weiter Pass über eine Station
      return c[Math.max(0, Math.min(c.length - 1, n))];
    }
    function startAction(now) {
      var s = a.cur, role = a.roles[s][a.holder] || 'RM', r = Math.random(), wing = role === 'LA' || role === 'RA';
      a.action = a.next1on1 ? '1on1' : wing ? (r < 0.75 ? 'stoss' : 'hold') : (r < 0.62 ? 'stoss' : r < 0.8 ? 'kreuz' : r < 0.9 ? '1on1' : 'hold');
      a.next1on1 = false; a.phase = 'act'; a.t0 = now; a.dur = a.action === '1on1' ? 1.1 : a.action === 'kreuz' ? 1.0 : 0.75;
      a.cross = null;
      if (a.action === 'kreuz') { var c = carriers(s), k = c.indexOf(a.holder), nb = c[k + a.dir] != null ? c[k + a.dir] : c[k - a.dir]; if (nb != null && (a.roles[s][nb] || '').charAt(0) === 'R') a.cross = { i: a.holder, j: nb }; else a.action = 'stoss'; }
    }
    // Zielposition je Spieler (Angriffsrahmen der angreifenden Seite)
    function attackTarget(s, i, now) {
      var role = a.roles[s][i], b = base(s, role), x = b[0], d = b[1];
      if (role === 'TW') return { x: 0, d: 38.6 };
      var ballX = a.ballAF ? a.ballAF.x : 0;
      if (role.indexOf('KM') === 0) { x = Math.max(-4.5, Math.min(4.5, b[0] + ballX * 0.55)); d = 6.4 + Math.sin(now / 900 + i) * 0.25; return { x: x, d: d }; }
      if (a.shot && i === a.holder) { var ts = ease((now - a.shot.t) / 400), wingS = role === 'LA' || role === 'RA'; if (a.shot.kind === 'seven') return { x: 0, d: 7.2 }; return wingS ? { x: x * 0.82, d: 2.6 * ts + d } : { x: x * (1 - 0.2 * ts), d: Math.max(6.6, d - 2.6 * ts) }; }
      if (a.phase === 'act' && i === a.holder) {
        var t = ease((now - a.t0) / 1000 / a.dur), gap = x > 0.3 ? -1 : x < -0.3 ? 1 : (Math.random() < 0.5 ? -1 : 1);
        if (a.action === 'stoss') { if (role === 'LA' || role === 'RA') return { x: x * (1 - 0.14 * t), d: d + 1.4 * t }; return { x: x + gap * 0.9 * t, d: d - 2.2 * t }; }
        if (a.action === '1on1') return { x: x + gap * 1.3 * t, d: Math.max(7.2, d - 3.2 * t) };
        if (a.action === 'kreuz' && a.cross) { var nb = base(s, a.roles[s][a.cross.j]); return { x: x + (nb[0] - x) * 0.65 * t, d: d - 1.6 * t }; }
      }
      if (a.phase === 'act' && a.cross && i === a.cross.j) { var t2 = ease((now - a.t0) / 1000 / a.dur), hb = base(s, a.roles[s][a.cross.i]); return { x: x + (hb[0] - x) * 0.55 * t2, d: d + 0.6 - 1.2 * t2 }; }
      // Anbieten: der nächste Passempfänger läuft schon leicht an
      if (a.flight && a.flight.to === i) return { x: x, d: d - 0.8 };
      return { x: x, d: d };
    }
    function defendTarget(s, i, now, att) {
      var role = a.roles[s][i], ballX = a.ballAF ? a.ballAF.x : 0, ballD = a.ballAF ? a.ballAF.d : 10;
      if (role === 'TW') return { x: Math.max(-1.2, Math.min(1.2, ballX * 0.16)), d: 0.7 };
      var P = DEF[a.def[s]][role] || [0, 6.5], x = -P[0], d = P[1]; // eigener Blick → Angriffsrahmen (gespiegelt)
      var front = d > 8.5;
      x += ballX * (front ? 0.55 : 0.28); // Verschieben zum Ball
      // Abwehrspieler am Ball tritt heraus
      if (a.nearDef === i && ballD < 12 && ballD > 5) { x += (ballX - x) * 0.5; d = Math.max(d, Math.min(ballD - 1.1, d + 2)); }
      return { x: Math.max(-9.4, Math.min(9.4, x)), d: d };
    }
    function frame() {
      if (!U.live || !document.getElementById('pitchCv')) return;
      var real = Date.now(), dt = Math.min(0.1, (real - last) / 1000); last = real;
      var fast = st.settings.matchSpeed === 'schnell', run = !L.paused && !m.finished;
      if (run) clock += dt * 1000 * (fast ? 1.8 : 1); var now = clock;
      drawPitch();
      if (a.cur == null) a.cur = 0;
      if (a.start == null) newPossession(now);
      var s = a.cur, o = 1 - s;
      // Ballablauf eines Angriffs: Umschalten → 3–5 Aktionen (Stoßen, Kreuzen, 1:1, Pass) → Abschluss oder Ballverlust
      if (run && !a.shot) {
        if (a.phase === 'transit' && now - a.t0 > 1900) startAction(now);
        else if (a.phase === 'act' && now - a.t0 > a.dur * 1000) {
          a.acts++;
          var mineQ = (a.q || []).filter(function (x) { return x.side === s; })[0], otherQ = (a.q || []).some(function (x) { return x.side === o; });
          if (a.acts >= a.maxActs || (otherQ && a.acts >= 2)) {
            if (mineQ) { a.q.splice(a.q.indexOf(mineQ), 1); var si = mineQ.pid ? m.onPitch[s].indexOf(mineQ.pid) : -1; if (si >= 0 && a.roles[s][si] !== 'TW') a.holder = si; a.shot = { side: s, goal: mineQ.goal, t: now, kind: mineQ.kind }; }
            else switchPoss(now); // Ballverlust / technischer Fehler
          } else {
            var to = a.cross ? a.cross.j : nextReceiver(s);
            a.flight = { from: a.holder, to: to, t0: now, dur: 330 + Math.random() * 120 }; a.phase = 'pass';
          }
        } else if (a.phase === 'pass' && a.flight && now - a.flight.t0 > a.flight.dur) { a.holder = a.flight.to; a.flight = null; startAction(now); }
      }
      // Wurf aus der Spielberechnung: Schütze wirft, danach wechselt der Ballbesitz
      if (a.shot && now - a.shot.t > 1150) { a.shot = null; switchPoss(now); s = a.cur; o = 1 - s; }
      // Zielpositionen berechnen
      var T = [{}, {}];
      [s, o].forEach(function (side) { m.onPitch[side].forEach(function (pid, i) { if (pid) T[side][i] = side === s ? attackTarget(side, i, now) : null; }); });
      // Ball im Angriffsrahmen bestimmen (für Verschieben/Kreis)
      var hp = a.pos[s + ':' + a.holder];
      if (hp) { var hf = s === 0 ? { x: hp.x, d: hp.y } : { x: -hp.x, d: 40 - hp.y }; a.ballAF = hf; }
      // nächster Abwehrspieler zum Ball
      var best = 99; a.nearDef = -1;
      m.onPitch[o].forEach(function (pid, i) { if (!pid || a.roles[o][i] === 'TW') return; var P = DEF[a.def[o]][a.roles[o][i]] || [0, 6.5], dx = Math.abs(-P[0] - (a.ballAF ? a.ballAF.x : 0)); if (dx < best) { best = dx; a.nearDef = i; } });
      m.onPitch[o].forEach(function (pid, i) { if (pid) T[o][i] = defendTarget(o, i, now); });
      // Bewegen (begrenzte Laufgeschwindigkeit, damit Umschalten sichtbar bleibt)
      var kits = L.kits || U.matchKits(st.clubs[m.clubs[0]], st.clubs[m.clubs[1]]);
      var drawList = [];
      [0, 1].forEach(function (side) {
        m.onPitch[side].forEach(function (pid, i) {
          if (!pid || !T[side][i]) return;
          var tf = side === s ? toField(s, T[side][i].x, T[side][i].d) : toField(s, T[side][i].x, T[side][i].d);
          var key = side + ':' + i, P = a.pos[key] || (a.pos[key] = { x: tf.x, y: tf.y });
          if (run) { var dx = tf.x - P.x, dy = tf.y - P.y, dist = Math.hypot(dx, dy), vmax = (fast ? 13 : 7.5) * dt; if (dist > vmax) { dx *= vmax / dist; dy *= vmax / dist; } P.x += dx * Math.min(1, dt * 9); P.y += dy * Math.min(1, dt * 9); if (dist > 3) { P.x += dx * 0.4; P.y += dy * 0.4; } }
          drawList.push({ side: side, i: i, pid: pid, P: P, gk: a.roles[side][i] === 'TW' });
        });
      });
      // Ballposition
      var bpos;
      if (a.shot) {
        var sh = a.shot, sp = a.pos[sh.side + ':' + a.holder] || a.ball;
        var gl = sh.side === 0 ? 0 : 40, gx = sh.goal ? (Math.random() < 0.5 ? -1 : 1) * 0.9 : (Math.random() < 0.5 ? -1 : 1) * 1.9;
        if (!sh.gx) sh.gx = gx; var tt = ease((now - sh.t - 250) / 420);
        bpos = lerp(sp, { x: sh.gx, y: gl + (sh.side === 0 ? 0.2 : -0.2) }, tt);
      } else if (a.flight) {
        var f1 = a.pos[s + ':' + a.flight.from], f2 = a.pos[s + ':' + a.flight.to];
        bpos = f1 && f2 ? lerp(f1, f2, Math.min(1, (now - a.flight.t0) / a.flight.dur)) : a.ball;
      } else bpos = a.pos[s + ':' + a.holder] ? { x: a.pos[s + ':' + a.holder].x + 0.35, y: a.pos[s + ':' + a.holder].y - (s === 0 ? 0.35 : -0.35) } : a.ball;
      a.ball = { x: bpos.x, y: bpos.y };
      // Zeichnen: erst Abwehr, dann Angriff, Namen ohne Überlappung (zeilenweise versetzt)
      var normal = st.settings.matchSpeed === 'normal';
      drawList.sort(function (p, q) { return (p.side === s) - (q.side === s); });
      drawList.forEach(function (it) {
        var x = SX(it.P.x), y = SY(it.P.y), kit = kits[it.side], p = st.players[it.pid];
        ctx.beginPath(); ctx.arc(x, y + 3, 14, 0, 7); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fillStyle = it.gk ? kit.gk : kit.fill; ctx.fill();
        ctx.lineWidth = 3; ctx.strokeStyle = it.gk ? kit.fill : kit.stroke; ctx.stroke();
        ctx.fillStyle = it.gk ? '#111' : kit.text; ctx.font = '800 12px Inter, -apple-system, Helvetica, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(p && p.shirt ? String(p.shirt) : (a.roles[it.side][it.i] || ''), x, y + 0.5);
        if (normal && p && it.side === s) { var nm = p.last.slice(0, 11); ctx.font = '700 11px Inter, -apple-system, Helvetica, Arial'; var tw = ctx.measureText(nm).width + 8; ctx.fillStyle = 'rgba(11,20,38,.78)'; ctx.fillRect(x - tw / 2, y + 16, tw, 15); ctx.fillStyle = '#fff'; ctx.fillText(nm, x, y + 24); }
      });
      // Ball
      var bx = SX(a.ball.x), by = SY(a.ball.y);
      ctx.beginPath(); ctx.arc(bx, by, 6.5, 0, 7); ctx.fillStyle = '#fde047'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#111'; ctx.stroke();
      ctx.textBaseline = 'alphabetic';
      if (L.paused && !m.finished) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, Wd, Ht); ctx.fillStyle = '#fff'; ctx.font = '800 46px Inter, Helvetica'; ctx.textAlign = 'center'; ctx.fillText('PAUSE', Wd / 2, Ht / 2); }
      if (m.finished) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(0, Ht / 2 - 50, Wd, 100); ctx.fillStyle = '#fff'; ctx.font = '800 42px Inter, Helvetica'; ctx.textAlign = 'center'; ctx.fillText('ENDE  ' + m.score[0] + ':' + m.score[1], Wd / 2, Ht / 2 + 15); }
      U._raf = requestAnimationFrame(frame);
    }
    frame();
  };
  // Optionale Retro-Soundeffekte
  U.beep = function (freq, dur) {
    if (!U.st || !U.st.settings.sound) return;
    try {
      U._ac = U._ac || new (window.AudioContext || window.webkitAudioContext)();
      var o = U._ac.createOscillator(), g = U._ac.createGain(); o.type = 'square'; o.frequency.value = freq; g.gain.value = 0.05;
      o.connect(g); g.connect(U._ac.destination); o.start(); o.stop(U._ac.currentTime + (dur || 0.15));
    } catch (e) {}
  };

  // ---------- Spielbericht ----------
  U.screens.bericht = function () {
    var st = U.st, lm = st.lastUserMatch;
    if (!lm) return '<h1>Spielbericht</h1><p class="muted">Noch kein Spiel absolviert.</p>';
    var H = st.clubs[lm.h], A = st.clubs[lm.a], s = lm.sum;
    var h = '<h1>Spielbericht</h1><div class="grid g21"><div class="grid">';
    h += '<div class="panel"><div class="row" style="justify-content:center;gap:24px"><div style="text-align:center;width:200px">' + U.crest(H, 60) + '<div><b>' + esc(H.name) + '</b></div></div><div class="mono" style="font-size:44px;font-weight:900">' + s.hg + ':' + s.ag + '</div><div style="text-align:center;width:200px">' + U.crest(A, 60) + '<div><b>' + esc(A.name) + '</b></div></div></div>' + (s.pens ? '<p style="text-align:center">nach 7-Meter-Werfen ' + s.pens[0] + ':' + s.pens[1] + '</p>' : '') +
      '<div class="grid g2" style="margin-top:10px">' + [0, 1].map(function (side) { return '<table class="t small"><tr><th colspan="2">Torschützen</th></tr>' + (s.sc || []).filter(function (x) { return x[2] === side; }).map(function (x) { var p = st.players[x[0]]; return '<tr><td>' + esc(p ? W.shortName(p) : '?') + '</td><td class="num"><b>' + x[1] + '</b></td></tr>'; }).join('') + '</table>'; }).join('') + '</div>' +
      (s.ev.length ? '<table class="t small" style="margin-top:8px">' + s.ev.map(function (e) { var p = st.players[e.p]; return '<tr><td class="num" style="width:40px">' + e.m + '\'</td><td>' + (e.t === 'red' ? '🟥 Disqualifikation' : '✚ Verletzung') + '</td><td style="text-align:' + (e.s === 0 ? 'left' : 'right') + '">' + esc(p ? W.playerName(p) : '?') + '</td></tr>'; }).join('') + '</table>' : '') + '</div>';
    var stt = lm.stats;
    h += '<div class="panel"><h2>Statistik</h2><table class="t">' + [['Würfe', stt.shots[0], stt.shots[1]], ['Wurfquote', Math.round(s.hg / Math.max(1, stt.shots[0]) * 100) + ' %', Math.round(s.ag / Math.max(1, stt.shots[1]) * 100) + ' %'], ['Paraden', (stt.saves || [0, 0])[0], (stt.saves || [0, 0])[1]], ['7-Meter', stt.corners[0], stt.corners[1]], ['Tempogegenstöße', (stt.fastBreaks || [0, 0])[0], (stt.fastBreaks || [0, 0])[1]], ['Zeitstrafen', (stt.twoMin || [0, 0])[0], (stt.twoMin || [0, 0])[1]], ['Fehlwürfe & Ballverluste', stt.shots[0] - s.hg + (stt.turnovers || [0, 0])[0], stt.shots[1] - s.ag + (stt.turnovers || [0, 0])[1]]].map(function (r) { return '<tr><td class="num" style="width:30%">' + r[1] + '</td><td style="text-align:center" class="muted">' + r[0] + '</td><td class="num" style="width:30%;text-align:left">' + r[2] + '</td></tr>'; }).join('') + '</table></div>';
    // Noten
    var rows = Object.keys(lm.ratings).map(function (pid) { var p = st.players[pid]; return p ? { id: pid, p: p, r: lm.ratings[pid], side: p.clubId === lm.h ? 0 : 1 } : null; }).filter(Boolean);
    h += '<div class="panel"><h2>Spielerbewertungen</h2><div class="grid g2">' + [0, 1].map(function (side) {
      return '<table class="t">' + rows.filter(function (r) { return r.side === side; }).sort(function (a, b) { return b.r - a.r; }).map(function (r) { return '<tr class="click" data-act="playerInfo" data-id="' + r.id + '"><td>' + U.posTag(r.p.pos) + '</td><td>' + esc(W.shortName(r.p)) + (lm.motm === r.id ? ' ⭐' : '') + (lm.goals[r.id] ? ' <span class="muted small">' + lm.goals[r.id] + ' Tore</span>' : '') + '</td><td class="num"><b>' + r.r.toFixed(1) + '</b></td></tr>'; }).join('') + '</table>';
    }).join('') + '</div></div></div><div class="grid" style="align-content:start">';
    // Zeitung
    var article = U.articleText(lm);
    h += '<div class="newspaper"><div class="mast">DER KREISLÄUFER · SPORTTEIL</div><div class="head">' + esc(lm.headline) + '</div><p>' + esc(article) + '</p></div>';
    if (lm.att) h += '<div class="panel"><h2>Zuschauer & Umsatz</h2><table class="t small"><tr><td>Zuschauer</td><td class="num">' + R.fmtNum(lm.att.total) + ' / ' + R.fmtNum(lm.att.capacity || 0) + '</td></tr>' + (lm.att.guests != null ? '<tr><td>' + U.lc('home', 13) + ' Heimfans (' + esc(H.short) + ')</td><td class="num">' + R.fmtNum(lm.att.total - lm.att.guests) + '</td></tr><tr><td>' + U.lc('bus', 13) + ' Gästefans (' + esc(A.short) + ')</td><td class="num">' + R.fmtNum(lm.att.guests) + '</td></tr>' : '') + (lm.att.ticket != null && lm.h === st.manager.clubId ? '<tr><td>Ticketerlöse</td><td class="num">' + money(lm.att.ticket) + '</td></tr><tr><td>Gastronomie</td><td class="num">' + money(lm.att.cater) + '</td></tr><tr><td>Parken</td><td class="num">' + money(lm.att.parking) + '</td></tr><tr><td>Zufriedenheit</td><td class="num">' + lm.att.satisfaction + '/100</td></tr>' : '<tr><td colspan="2" class="muted">Auswärtsspiel – Einnahmen beim Gastgeber.</td></tr>') + '</table></div>';
    // Weitere Ergebnisse
    var c = U.club();
    if (c && st.lastResults) {
      var others = st.lastResults.filter(function (r) { return !r.user && (r.comp !== 'league' || W.lk(st.clubs[r.h]) === W.lk(c)); });
      h += '<div class="panel"><h2>Weitere Ergebnisse</h2><table class="t small">' + others.slice(0, 14).map(function (r) { return '<tr><td>' + esc(st.clubs[r.h].short) + '</td><td class="num"><b>' + r.hg + ':' + r.ag + '</b>' + (r.pens ? ' n.7m' : '') + '</td><td>' + esc(st.clubs[r.a].short) + '</td></tr>'; }).join('') + '</table></div>';
    }
    return h + '</div></div>';
  };
  U.articleText = function (lm) {
    var st = U.st, H = st.clubs[lm.h], A = st.clubs[lm.a], s = lm.sum, stt = lm.stats || {};
    var t = 'Vor ' + R.fmtNum(lm.att ? lm.att.total : 0) + ' Zuschauern ' + (lm.att && lm.att.guests > 0 ? '(davon ' + R.fmtNum(lm.att.guests) + ' Gästefans) ' : '') + (s.hg === s.ag ? 'trennten sich ' + H.short + ' und ' + A.short + ' ' + s.hg + ':' + s.ag + '. ' : 'setzte sich ' + (s.hg > s.ag ? H.short : A.short) + ' mit ' + Math.max(s.hg, s.ag) + ':' + Math.min(s.hg, s.ag) + ' durch. ');
    var top = (s.sc || [])[0], tp = top && st.players[top[0]]; if (tp) t += 'Bester Werfer war ' + W.playerName(tp) + ' mit ' + top[1] + ' Toren. ';
    var ht = (lm.events || []).filter(function (e) { return e.type === 'ht'; })[0]; if (ht) t += ht.text.replace('Halbzeit! Es steht', 'Zur Pause stand es').replace('.', '') + '. ';
    if (Math.abs(s.hg - s.ag) <= 1 && s.hg !== s.ag) t += 'Bis zur Schlusssirene blieb es eine Zitterpartie. ';
    var mp = st.players[lm.motm]; if (mp) t += 'Bester Spieler: ' + W.playerName(mp) + ' (Note ' + (lm.ratings[lm.motm] || 0).toFixed(1) + '). ';
    if (stt.saves) { var gs = stt.saves[0] >= stt.saves[1] ? 0 : 1; if (stt.saves[gs] >= 14) t += 'Die Torhüter von ' + (gs === 0 ? H.short : A.short) + ' kamen auf ' + stt.saves[gs] + ' Paraden. '; }
    if (stt.twoMin && stt.twoMin[0] + stt.twoMin[1] >= 8) t += 'Die Schiedsrichter verteilten ' + (stt.twoMin[0] + stt.twoMin[1]) + ' Zeitstrafen. ';
    var reds = s.ev.filter(function (e) { return e.t === 'red'; }); if (reds.length) t += 'Für Aufregung sorgte ' + (reds.length > 1 ? reds.length + ' Disqualifikationen' : 'eine Disqualifikation') + '. ';
    var inj = s.ev.filter(function (e) { return e.t === 'injury'; }); if (inj.length) { var ip = st.players[inj[0].p]; t += 'Bitter: ' + (ip ? ip.last : '') + ' musste verletzt raus. '; }
    return t;
  };


  // ---------- Saisonabschluss ----------
  U.screens.saisonende = function () {
    var st = U.st, sum = st.seasonSummary;
    if (!sum) return '<h1>Saisonabschluss</h1><p class="muted">Die Saison läuft noch.</p>';
    var c = U.club(), mg = st.manager;
    var h = '<h1>Saisonabschluss ' + sum.season + '/' + String(sum.season + 1).slice(2) + '</h1><div class="grid g3">';
    [1, 2, 3].forEach(function (l) {
      var ch = st.clubs[sum.champions[l]];
      h += '<div class="panel" style="text-align:center"><h2>Meister ' + D.leagueNames[l] + '</h2>' + U.crest(ch, 70) + '<h3 style="margin-top:6px">🏆 ' + esc(ch.name) + '</h3>' + (sum.scorers[l] ? '<p class="small">Torschützenkönig: <b>' + esc(sum.scorers[l].name) + '</b> (' + esc(sum.scorers[l].club) + ', ' + sum.scorers[l].goals + ' Tore)</p>' : '') + (sum.players[l] ? '<p class="small">Spieler der Saison: <b>' + esc(sum.players[l].name) + '</b> (' + esc(sum.players[l].club) + ', Ø ' + sum.players[l].avg + ')</p>' : '') + '</div>';
    });
    h += '</div><div class="grid g3" style="margin-top:14px">';
    h += '<div class="panel"><h2>Aufsteiger</h2>' + sum.promoted.map(function (id) { return '<div>⬆️ ' + esc(st.clubs[id].name) + '</div>'; }).join('') + sum.releg.filter(function (r) { return r.winner === r.lower; }).map(function (r) { return '<div>⬆️ ' + esc(st.clubs[r.lower].name) + ' <span class="muted small">(Relegation)</span></div>'; }).join('') + '</div>';
    h += '<div class="panel"><h2>Absteiger</h2>' + sum.relegated.map(function (id) { return '<div>⬇️ ' + esc(st.clubs[id].name) + '</div>'; }).join('') + sum.releg.filter(function (r) { return r.winner === r.lower; }).map(function (r) { return '<div>⬇️ ' + esc(st.clubs[r.upper].name) + ' <span class="muted small">(Relegation)</span></div>'; }).join('') + '</div>';
    h += '<div class="panel"><h2>Pokal & Relegation</h2><p>🏆 Pokalsieger: <b>' + esc(st.clubs[sum.cup].name) + '</b></p>' + st.releg.map(function (r) { return '<div class="small">' + esc(st.clubs[r.lower].short) + ' – ' + esc(st.clubs[r.upper].short) + ': ' + r.legs[0].r.hg + ':' + r.legs[0].r.ag + ' / ' + r.legs[1].r.ag + ':' + r.legs[1].r.hg + (r.legs[1].r.pens ? ' (i.E.)' : '') + ' → <b>' + esc(st.clubs[r.winner].short) + '</b></div>'; }).join('') + '</div></div>';
    if (c) {
      var pos = st.finalTables[c.league].indexOf(c.id) + 1, target = mg.boardTarget ? mg.boardTarget.pos : 12;
      var fin = c.fin.season, saldo = R.sum(Object.keys(fin).filter(function (k) { return ['Kreditaufnahme', 'Tilgung'].indexOf(k) < 0; }), function (k) { return fin[k]; });
      h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Ihre Bilanz</h2><table class="t"><tr><td>Abschlussplatz</td><td class="num"><b>' + pos + '.</b> ' + D.leagueNames[W.lk(c)] + '</td></tr><tr><td>Saisonziel</td><td class="num">' + esc(mg.boardTarget ? mg.boardTarget.text : '–') + ' ' + (pos <= target ? '<span class="pos">✔ erreicht</span>' : '<span class="neg">✘ verfehlt</span>') + '</td></tr><tr><td>Managerreputation</td><td class="num">' + mg.reputation + '/100</td></tr><tr><td>Finanzbilanz der Saison</td><td class="num ' + (saldo < 0 ? 'neg' : 'pos') + '">' + money(saldo) + '</td></tr><tr><td>Kontostand</td><td class="num">' + money(c.cash) + '</td></tr><tr><td>Fanbasis</td><td class="num">' + R.fmtNum(c.fans) + '</td></tr><tr><td>Hallenkapazität</td><td class="num">' + R.fmtNum(E.capacity(c)) + '</td></tr></table></div>' +
        '<div class="panel"><h2>Ausblick</h2><p>Mit dem Saisonwechsel altern alle Spieler, Verträge laufen aus, neue Talente kommen ins Nachwuchszentrum und die KI-Vereine bauen ihre Kader um.</p>' + (W.squad(st, c.id).filter(function (p) { return p.contract <= 1; }).length ? '<p class="warn">⚠️ ' + W.squad(st, c.id).filter(function (p) { return p.contract <= 1; }).length + ' Spieler mit auslaufendem Vertrag – jetzt noch verlängern!</p><button data-act="tab" data-s="mannschaft" data-tab="vertraege">Zu den Verträgen</button>' : '') + '</div></div>';
    }
    h += '<div style="margin-top:16px;text-align:right"><button class="btn-next" data-act="next">NEUE SAISON STARTEN ▶</button></div>';
    return h;
  };
})(RFM);
