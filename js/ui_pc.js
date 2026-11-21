// Oberfläche der Spielerkarriere: Start im Karriere-Assistenten, Kopfzeile, Navigation und „Mein Spieler“.
(function (R) {
  var D = R.data, W = R.world, S = R.season, U = R.ui, C = R.pc;
  var esc = R.esc, money = R.fmtMoney;
  function on(st) { return !!(R.pc && C.active(st)); }
  function pct(v) { return Math.round(v) + ' %'; }

  // ---------- Rechte, Kopfzeile, Navigation ----------
  var baseCan = U.can;
  U.can = function (area) { var st = U.st; if (st && st.manager && st.manager.role === 'player') return false; return baseCan(area); };
  var baseGo = U.go;
  U.go = function (screen, params) {
    if (U.st && on(U.st) && ['zentrale', 'bericht', 'karriere', 'mannschaft', 'training', 'nachwuchs'].indexOf(screen) >= 0) screen = 'pkarriere';
    return baseGo(screen, params);
  };
  var baseTop = U.renderTop;
  U.renderTop = function () {
    var st = U.st; if (!on(st)) return baseTop();
    var p = C.player(st), c = C.club(st), pc = st.pc, el = document.getElementById('topbar');
    function chip(icon, label, val, opt) { return '<div class="tb-chip' + (opt ? ' opt' : '') + '">' + U.lc(icon, 18) + '<div><span>' + label + '</span><b>' + val + '</b></div></div>'; }
    var sub = st.phase === 'seasonEnd' ? 'Neue Saison' : S.isBreak(st) ? 'Nächste Woche' : 'Nächster Spieltag';
    el.innerHTML = '<div class="tb-club">' + (c ? U.crest(c, 40) : '') + '<div><div class="name">' + esc(W.playerName(p)) + '</div><div class="sub">' + (c ? esc(c.short) + ' · ' + (p.youth ? 'Jugend' : D.leagueNames[c.league]) : 'vereinslos') + ' · Saison ' + st.season + '/' + String(st.season + 1).slice(2) + '</div></div></div>' +
      chip('gauge', 'Stärke', p.ovr) +
      chip('calendar-days', S.isBreak(st) ? 'Woche' : 'Spieltag', S.calText(st, true)) +
      chip('handshake', 'Vertrauen', Math.round(pc.trust)) +
      chip('star', 'Bekanntheit', Math.round(pc.fame), true) +
      chip('wallet', 'Vermögen', money(pc.cash), true) +
      '<div class="tb-spacer"></div>' +
      (U.autoRun ? '<button class="sm danger" data-act="autoStop">' + U.lc('square', 14) + 'Automatik stoppen</button>' : '<button class="sm ghost" data-act="autoStart" title="Wochen automatisch durchspielen, bis etwas Wichtiges passiert">' + U.lc('fast-forward', 15) + 'Auto</button>') +
      '<button class="btn-next" data-act="next"' + (U.busy ? ' disabled' : '') + '><span class="bn-txt">Weiter<small>' + sub + '</small></span>' + U.lc('chevron-right', 20) + '</button>';
  };
  var baseNav = U.navItems;
  U.navItems = function () {
    var st = U.st; if (!on(st)) return baseNav();
    return [['pkarriere', 'user-round', 'Mein Spieler', st.pc.offers.length, 'Karriere'], ['liga', 'chart-column', 'Liga & Statistiken', 0, 'Wettbewerb'], ['einstellungen', 'settings', 'Einstellungen', 0, 'System']];
  };
  var baseZ = U.screens.zentrale;
  U.screens.zentrale = function () { return on(U.st) ? U.screens.pkarriere() : baseZ(); };

  // ---------- Karriere-Assistent ----------
  U.pcChoice = function (w) { return U.choice('mode', 'player', w.mode, U.lc('shirt', 15) + ' Spielerkarriere', 'Du bist ein junger Spieler: Training, Lebensstil, Verträge und Wechsel bestimmst du. Nach dem Karriereende geht es als Manager weiter.'); };
  var baseWiz = U.screens.wizard;
  U.screens.wizard = function () {
    var w = U.wiz; if (w.mode !== 'player' || w.step < 3) return baseWiz();
    w.pc = w.pc || { first: 'Max', last: 'Mustermann', pos: Object.keys(D.posWeights).filter(function (k) { return k !== 'TW'; }).slice(-1)[0], talent: 'gross', youth: true };
    var o = w.pc, st = U.wizPreview(), c = st.clubs[w.clubId];
    var h = '<div class="title-screen" style="align-items:flex-start"><div class="title-box" style="width:min(1100px,100%);text-align:left"><h1>Neue Spielerkarriere</h1><div class="wiz-step">' + ['Karrieremodus', 'Startverein', 'Dein Spieler', 'Start'].map(function (s, i) { return '<span class="' + (w.step === i + 1 ? 'on' : '') + '">' + (i + 1) + '. ' + s + '</span>'; }).join('') + '</div>';
    if (w.step === 3) {
      h += '<div class="panel"><h2>Dein Spieler</h2><div class="grid g2">' +
        U.field('Vorname', '<input type="text" data-inp="pcWiz" data-k="first" value="' + esc(o.first) + '" maxlength="30">') +
        U.field('Nachname', '<input type="text" data-inp="pcWiz" data-k="last" value="' + esc(o.last) + '" maxlength="30">') + '</div>' +
        U.field('Position', '<div class="seg">' + Object.keys(D.posWeights).map(function (k) { return '<button class="' + (o.pos === k ? 'on' : '') + '" data-act="pcWizSet" data-k="pos" data-v="' + k + '">' + esc(D.posNames[k] || k) + '</button>'; }).join('') + '</div>') + '</div>' +
        '<div class="panel" style="margin-top:14px"><h2>Talent</h2><div class="grid g3">' +
        ['normal', 'gross', 'wunder'].map(function (k) { var t = C.TALENT[k]; return pchoice('talent', k, o.talent, t.n, { normal: 'Solide Anlagen – mit Fleiß wird ein Profi daraus.', gross: 'Das Zeug zum Erstligaspieler.', wunder: 'Ein Ausnahmetalent. Alle schauen auf dich.' }[k]); }).join('') + '</div></div>' +
        '<div class="panel" style="margin-top:14px"><h2>Einstieg</h2><div class="grid g2">' +
        pchoice('youth', '1', o.youth ? '1' : '0', U.lc('graduation-cap', 15) + ' Mit 16 in der Jugend', 'Du spielst in der Jugendliga von ' + esc(c ? c.short : 'deinem Verein') + ' und kämpfst um den Profivertrag.') +
        pchoice('youth', '0', o.youth ? '1' : '0', U.lc('shirt', 15) + ' Mit 18 im Profikader', 'Direkt bei den Profis – aber erst einmal hinten an.') + '</div></div>';
      h += '<div class="row" style="margin-top:18px"><button data-act="wizBack">← Zurück</button><div class="tb-spacer"></div><button class="primary" data-act="wizNext">Weiter →</button></div>';
    } else {
      h += '<div class="panel"><h2>Zusammenfassung</h2><p><b>' + esc(o.first + ' ' + o.last) + '</b> · ' + esc(D.posNames[o.pos] || o.pos) + ' · ' + esc(C.TALENT[o.talent].n) + ' · ' + (o.youth ? '16 Jahre, Jugend' : '18 Jahre, Profikader') + ' bei <b>' + esc(c ? c.name : '–') + '</b></p>' +
        '<p class="muted small">Die Spiele bestreitet die KI. Ob du spielst, hängt von deiner Stärke, deiner Form und dem Vertrauen des Trainers ab. Jede Woche wählst du deinen Fokus, triffst Entscheidungen und verhandelst Verträge.</p></div>' +
        '<div class="panel" style="margin-top:14px"><h2>Schwierigkeitsgrad</h2><div class="grid g4">' +
        U.choice('difficulty', 'einsteiger', w.difficulty, 'Einsteiger', 'Weniger schwere Verletzungen.') + U.choice('difficulty', 'normal', w.difficulty, 'Normal', 'Ausgewogen.') + U.choice('difficulty', 'schwer', w.difficulty, 'Schwer', 'Stärkere Konkurrenz.') + U.choice('difficulty', 'chaos', w.difficulty, 'Chaos-Modus', 'Mehr verrückte Ereignisse.') + '</div></div>';
      h += '<div class="row" style="margin-top:18px"><button data-act="wizBack">← Zurück</button><div class="tb-spacer"></div><button class="primary" data-act="pcStart" style="padding:12px 24px;font-size:15px">' + U.lc('ball', 15) + ' Karriere starten</button></div>';
    }
    return h + '</div></div>';
  };
  function pchoice(k, v, cur, title, text) { return '<div class="choice ' + (cur === v ? 'on' : '') + '" data-act="pcWizSet" data-k="' + k + '" data-v="' + v + '"><h3>' + title + '</h3><div class="muted small">' + text + '</div></div>'; }
  U.acts.pcWiz = function (d, el) { U.wiz.pc[d.k] = el.value; };
  U.acts.pcWizSet = function (d) { U.wiz.pc[d.k] = d.k === 'youth' ? d.v === '1' : d.v; U.render(); };
  U.acts.pcStart = function () {
    var w = U.wiz, o = w.pc;
    document.getElementById('main').innerHTML = '<div class="title-screen"><div class="logo" style="font-size:24px">Die Spielwelt wird erschaffen …</div></div>';
    setTimeout(function () {
      U.st = W.newGame({ seed: w.seed, world: w.world, difficulty: w.difficulty, managerName: o.first + ' ' + o.last, role: 'manager', canBeFired: true, mode: 'existing', clubId: w.clubId });
      if (R.crests) R.crests.applyLibrary(U.st);
      U.st.settings.difficulty = w.difficulty;
      U.st.planEvent = null;
      C.start(U.st, { first: o.first, last: o.last, pos: o.pos, clubId: w.clubId, talent: o.talent, youth: o.youth });
      U.wiz = null; U.autosave(); U.go('pkarriere');
      var c = C.club(U.st);
      U.modal('Willkommen, ' + esc(o.first) + '!', '<div class="row" style="gap:16px;flex-wrap:nowrap">' + U.crest(c, 80) + '<div><h3>' + esc(c.name) + '</h3><p>Deine Karriere beginnt ' + (o.youth ? 'in der Jugend' : 'im Profikader') + '. Wähle jede Woche deinen Fokus, sammle Vertrauen beim Trainer und arbeite dich nach oben.</p><p class="muted small">Mit „Weiter“ geht es Woche für Woche voran. Angebote und Entscheidungen findest du unter „Mein Spieler“.</p></div></div>', '<button class="primary" data-act="closeModal">Los geht’s</button>');
    }, 30);
  };

  // ---------- Mein Spieler ----------
  U.screens.pkarriere = function () {
    var st = U.st, pc = st.pc;
    if (!pc) return '<h1>Mein Spieler</h1><p class="muted">Keine Spielerkarriere aktiv.</p>';
    if (pc.retired) return '<h1>Spielerkarriere beendet</h1>' + finalPanel(st) + '<div class="row" style="margin-top:12px"><button class="primary" data-act="nav" data-s="karriere">Zur Managerkarriere</button></div>';
    var p = C.player(st), c = C.club(st), f = C.FOCUS[pc.focus];
    if (pc.offers.length) pc.offersSeen = pc.offerSeason;
    var h = '<h1>Mein Spieler</h1>';
    // Steckbrief
    h += '<div class="grid g21"><div class="panel"><div class="row" style="gap:16px;flex-wrap:nowrap;align-items:center">' + (c ? U.crest(c, 72) : '') + '<div style="min-width:0"><h2 style="margin:0">' + esc(W.playerName(p)) + ' ' + U.posTag(p.pos) + '</h2>' +
      '<div class="muted">' + p.age + ' Jahre · ' + esc(D.posNames[p.pos] || p.pos) + ' · ' + (c ? U.clubLink(c) + ' (' + (p.youth ? 'Jugend' : D.leagueNames[c.league]) + ')' : 'vereinslos') + '</div>' +
      '<div class="small" style="margin-top:4px">' + (p.youth ? 'Jugendvertrag' : 'Vertrag bis ' + (st.season + p.contract)) + ' · Gehalt ' + money(p.wage) + '/Jahr' + (pc.agent ? ' · mit Berater' : '') + '</div></div></div>' +
      '<div class="grid g4" style="margin-top:12px">' + U.kpi('Stärke', U.ovrBadge(p.ovr)) + U.kpi('Potenzial', talentStars(p)) + U.kpi('Form', (p.form || 6).toFixed(1).replace('.', ',')) + U.kpi('Kaderplatz', p.youth ? 'Jugend' : C.squadRank(st, p) + '. auf ' + esc(p.pos)) + '</div>' +
      '<table class="t small" style="margin-top:10px"><tr><td>Vertrauen des Trainers</td><td style="width:45%">' + U.bar(pc.trust) + '</td><td class="num">' + Math.round(pc.trust) + '</td></tr><tr><td>Bekanntheit</td><td>' + U.bar(pc.fame) + '</td><td class="num">' + Math.round(pc.fame) + '</td></tr><tr><td>Fitness</td><td>' + U.bar(p.fitness) + '</td><td class="num">' + Math.round(p.fitness) + '</td></tr><tr><td>Laune</td><td>' + U.bar(p.morale) + '</td><td class="num">' + Math.round(p.morale) + '</td></tr></table>' +
      (p.inj ? '<div class="help" style="margin-top:8px">' + U.lc('stethoscope', 14) + ' Verletzt: ' + esc(p.inj.type) + ' – noch ' + p.inj.weeks + ' Woche(n).</div>' : '') +
      '<div class="row" style="margin-top:10px"><button data-act="playerInfo" data-id="' + p.id + '">' + U.lc('user-round', 15) + ' Spielerprofil</button>' + (p.youth ? '<button data-act="pcAskPro">' + U.lc('pencil', 15) + ' Nach Profivertrag fragen</button>' : '') + (p.age >= 30 ? '<button class="danger" data-act="pcRetire">Karriere beenden</button>' : '') + '</div></div>';
    // Saison
    var log = pc.log.filter(function (x) { return x.s === st.season; });
    h += '<div class="panel"><h2>Saison ' + st.season + '/' + String(st.season + 1).slice(2) + '</h2><div class="grid g3">' + U.kpi('Spiele', p.stats.apps) + U.kpi(R.pc.CFG.goalWord, p.stats.goals) + U.kpi('Ø Note', p.stats.apps ? C.avgRating(p).toFixed(1).replace('.', ',') : '–') + '</div>' +
      (p.youth && p.ys && p.ys.s === st.season ? '<p class="small muted" style="margin-top:8px">Jugendliga: ' + p.ys.a + ' Spiele, ' + p.ys.g + ' ' + esc(R.pc.CFG.goalWord) + '</p>' : '') +
      (log.length ? '<table class="t small" style="margin-top:8px"><tr><th>Woche</th><th>Verein</th><th class="num">Note</th><th class="num">' + esc(R.pc.CFG.goalWord) + '</th></tr>' + log.slice(0, 8).map(function (x) { return '<tr><td>' + x.w + '</td><td>' + esc(x.c) + '</td><td class="num"><b>' + String(x.r).replace('.', ',') + '</b></td><td class="num">' + (x.g || '') + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small" style="margin-top:8px">' + (p.youth ? 'Noch kein Einsatz bei den Profis.' : 'Noch kein Pflichtspieleinsatz in dieser Saison.') + '</p>') + '</div></div>';
    if (p.youth && R.plus && R.plus.ylTable) h += ylPanel(st, p);
    // Fokus
    h += '<div class="panel" style="margin-top:14px"><h2>Wochenfokus</h2><p class="muted small">Gilt jede Woche, bis du ihn änderst. Aktuell: <b>' + esc(f.n) + '</b></p><div class="grid g3">' +
      Object.keys(C.FOCUS).map(function (k) { var x = C.FOCUS[k]; return '<div class="choice ' + (pc.focus === k ? 'on' : '') + '" data-act="pcFocus" data-k="' + k + '"><h3>' + esc(x.n) + '</h3><div class="muted small">' + esc(x.d) + '</div></div>'; }).join('') + '</div></div>';
    // Angebote
    h += '<div class="panel" style="margin-top:14px"><h2>Verträge & Angebote</h2>';
    if (pc.moving) { var to = st.clubs[pc.moving.to]; h += '<p>' + U.lc('arrow-left-right', 15) + ' Wechsel zu <b>' + esc(to.name) + '</b> zur neuen Saison ist vereinbart.</p>'; }
    else if (!pc.offers.length) h += '<p class="muted small">Zurzeit keine Angebote. Ab der Rückrunde melden sich Vereine – öfter mit Berater, guter Form und hoher Bekanntheit.</p>';
    else h += '<div class="scroll"><table class="t"><tr><th>Verein</th><th>Rolle</th><th class="num">Gehalt/Jahr</th><th class="num">Laufzeit</th><th class="num">Ablöse</th><th></th></tr>' + pc.offers.map(function (o) {
      var oc = st.clubs[o.clubId];
      return '<tr><td>' + U.clubLink(oc, true) + ' <span class="muted small">' + D.leagueNames[oc.league] + '</span></td><td>' + (o.renew ? 'Verlängerung' : esc(o.role)) + '</td><td class="num">' + money(o.wage) + '</td><td class="num">' + o.years + ' J.</td><td class="num">' + (o.renew ? '–' : o.fee ? money(o.fee) : 'ablösefrei') + '</td><td class="num"><button class="sm primary" data-act="pcAccept" data-id="' + o.id + '">Annehmen</button> <button class="sm" data-act="pcDecline" data-id="' + o.id + '">Ablehnen</button></td></tr>';
    }).join('') + '</table></div>';
    h += '</div>';
    // Meilensteine & Karriere
    var ms = Object.keys(pc.ms).map(function (k) { return pc.ms[k]; }).sort(function (a, b) { return a.s - b.s || a.w - b.w; });
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Meilensteine</h2>' + (ms.length ? '<ul class="small" style="margin:0;padding-left:18px">' + ms.map(function (m) { return '<li>' + esc(m.t || '') + ' <span class="muted">(' + m.s + ')</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Noch keine – das Profidebüt wartet.</p>') +
      ((pc.titles || []).length ? '<h3 style="margin-top:10px">' + U.lc('trophy', 15) + ' Titel</h3><p class="small">' + pc.titles.map(esc).join(' · ') + '</p>' : '') + (pc.nat ? '<p class="small">' + esc(R.pc.CFG.nat) + ': ' + pc.nat + ' Berufungen</p>' : '') + '</div>' +
      '<div class="panel"><h2>Karriere</h2>' + careerTable(st, p) + '</div></div>';
    return h;
  };
  function ylPanel(st, p) {
    var g = R.plus.groupOf(p), t = R.plus.ylTable(st, g), y = st.ylg; if (!t.length || !y) return '';
    return '<div class="panel" style="margin-top:14px"><h2>' + esc(y.groups[g].name) + '</h2><div class="scroll"><table class="t small yl-t"><tr><th>#</th><th>Verein</th><th class="num">S-U-N</th><th class="num">Tore</th><th class="num">Pkt.</th></tr>' + t.map(function (r, i) {
      var c = st.clubs[r.id]; return '<tr' + (c.id === p.clubId ? ' class="sel"' : '') + '><td>' + (i + 1) + '</td><td>' + U.crest(c, 16) + ' ' + esc(c.short) + '</td><td class="num">' + r.w + '-' + r.d + '-' + r.l + '</td><td class="num">' + r.gf + ':' + r.ga + '</td><td class="num"><b>' + r.pts + '</b></td></tr>';
    }).join('') + '</table></div></div>';
  }
  function talentStars(p) { var n = Math.max(1, Math.min(5, Math.round((p.pot - 55) / 8))); return '<span title="Geschätztes Potenzial">' + '★★★★★'.slice(0, n) + '<span class="muted">' + '★★★★★'.slice(n) + '</span></span>'; }
  function careerTable(st, p) {
    var rows = st.pc.seasons.slice().reverse();
    var tot = '<p class="small">Gesamt: <b>' + (p ? p.career.apps : 0) + '</b> Pflichtspiele, <b>' + (p ? p.career.goals : 0) + '</b> ' + esc(R.pc.CFG.goalWord) + '</p>';
    if (!rows.length) return tot + '<p class="muted small">Die erste Saison läuft.</p>';
    return tot + '<div class="scroll" style="max-height:260px"><table class="t small"><tr><th>Saison</th><th>Verein</th><th class="num">Sp.</th><th class="num">' + esc(R.pc.CFG.goalWord.slice(0, 1)) + '.</th><th class="num">Note</th><th class="num">Stärke</th></tr>' + rows.map(function (s) {
      return '<tr><td>' + s.season + '/' + String(s.season + 1).slice(2) + '</td><td>' + esc(s.club) + (s.youth ? ' <span class="muted">(Jgd.)</span>' : s.league ? ' <span class="muted">' + esc(D.leagueNames[s.league] || '') + (s.pos ? ', Pl. ' + s.pos : '') + '</span>' : '') + '</td><td class="num">' + s.apps + '</td><td class="num">' + s.goals + '</td><td class="num">' + (s.r ? String(s.r).replace('.', ',') : '–') + '</td><td class="num">' + s.ovr + '</td></tr>';
    }).join('') + '</table></div>';
  }
  function finalPanel(st) {
    var pc = st.pc, f = pc.final || {};
    return '<div class="panel"><h2>' + esc(f.name || 'Dein Spieler') + '</h2><p>' + (f.apps || 0) + ' Pflichtspiele, ' + (f.goals || 0) + ' ' + esc(R.pc.CFG.goalWord) + ', Karriereende mit ' + (f.age || '–') + ' Jahren.</p>' + ((pc.titles || []).length ? '<p>' + U.lc('trophy', 15) + ' ' + pc.titles.map(esc).join(' · ') + '</p>' : '') + careerTable(st, null) + '</div>';
  }
  U.acts.pcFocus = function (d) { C.setFocus(U.st, d.k); U.autosave(); U.render(); };
  U.acts.pcAccept = function (d) {
    var st = U.st, o = st.pc.offers.filter(function (x) { return x.id === d.id; })[0]; if (!o) return;
    var c = st.clubs[o.clubId];
    U.confirm(o.renew ? 'Vertrag verlängern' : 'Wechsel zu ' + c.short, (o.renew ? 'Vertrag bei ' + c.name + ' um ' + o.years + ' Jahre verlängern, ' : 'Zur neuen Saison zu ' + c.name + ' wechseln, ' + o.years + ' Jahre, ') + money(o.wage) + ' pro Jahr?', function () { var r = C.acceptOffer(st, d.id); U.toast(r.ok ? r.msg : r.why, 4000); U.autosave(); U.render(); });
  };
  U.acts.pcDecline = function (d) { C.declineOffer(U.st, d.id); U.render(); };
  U.acts.pcAskPro = function () { var r = C.askPromotion(U.st); U.toast(r.ok ? 'Profivertrag! Du gehörst jetzt zum Profikader.' : r.why, 4500); U.autosave(); U.render(); };
  U.acts.pcRetire = function () { U.confirm('Karriere beenden', 'Willst du deine Spielerkarriere jetzt beenden? Danach geht es als Manager weiter – die ersten Jobangebote kommen in den nächsten Wochen.', function () { C.retire(U.st); U.autosave(); U.go('karriere'); }); };
})(RFM);
