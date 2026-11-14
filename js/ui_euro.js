// Oberfläche: Europapokal (Meister-Liga, Top-Liga) und die Spielankündigung je Wettbewerb.
// Diese Datei ist in beiden Spielen identisch.
(function (R) {
  var D = R.data, W = R.world, S = R.season, X = R.euro, U = R.ui, C = D.euro, esc = R.esc, money = R.fmtMoney;
  if (!C || !U) return;

  // ---------- Wettbewerbs-Embleme (eigene Zeichnungen, keine fremden Marken) ----------
  U.compEmblem = function (kind, size) {
    size = size || 56;
    var g = '';
    if (kind === 'ml') {
      var stars = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4, x = 32 + Math.sin(a) * 21, y = 32 - Math.cos(a) * 21; stars += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.3" fill="#ffe27a"/>'; }
      g = '<circle cx="32" cy="32" r="30" fill="#0d1f6b" stroke="#9db4ff" stroke-width="2"/>' + stars + '<path d="M32 16l4.6 10.2 11.1 1.2-8.3 7.5 2.4 10.9L32 40.2l-9.8 5.6 2.4-10.9-8.3-7.5 11.1-1.2z" fill="#ffffff"/>';
    } else if (kind === 'tl') {
      g = '<path d="M32 2l26 15v30L32 62 6 47V17z" fill="#b84a12" stroke="#ffc38f" stroke-width="2"/><path d="M19 40l13-22 13 22h-7.5L32 29.5 26.500 40z" fill="#ffffff"/><rect x="18" y="44" width="28" height="4" rx="2" fill="#ffd9b8"/>';
    } else if (kind === 'cup') {
      g = '<circle cx="32" cy="32" r="30" fill="#5b3a08" stroke="#e8b931" stroke-width="2"/><path d="M21 16h22l-2 15q-1.500 8-9 10-7.500-2-9-10z" fill="#f4cf55"/><path d="M21 20h-7v5q0 8 9 8M43 20h7v5q0 8-9 8" fill="none" stroke="#f4cf55" stroke-width="3"/><rect x="29" y="40" width="6" height="6" fill="#f4cf55"/><rect x="23" y="46" width="18" height="4" rx="1.500" fill="#f4cf55"/>';
    } else if (kind === 'releg') {
      g = '<circle cx="32" cy="32" r="30" fill="#6b1524" stroke="#ff9aa5" stroke-width="2"/><path d="M22 36l10-12 10 12M22 46l10-12 10 12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (kind === 'friendly') {
      g = '<circle cx="32" cy="32" r="30" fill="#33425c" stroke="#9cafc9" stroke-width="2"/><path d="M20 33l8 8 16-17" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
    } else {
      g = '<circle cx="32" cy="32" r="30" fill="#0f5a37" stroke="#5fe0a6" stroke-width="2"/><rect x="18" y="20" width="28" height="5" rx="2.500" fill="#ffffff"/><rect x="18" y="29.500" width="22" height="5" rx="2.500" fill="#c9f3df"/><rect x="18" y="39" width="16" height="5" rx="2.500" fill="#8fe3bd"/>';
    }
    return '<svg class="cb-svg" width="' + size + '" height="' + size + '" viewBox="0 0 64 64" aria-hidden="true">' + g + '</svg>';
  };
  U.compKind = function (fx) { return fx.comp === 'euro' ? fx.euro : fx.comp === 'cup' || fx.comp === 'final' ? 'cup' : fx.comp === 'releg' ? 'releg' : fx.comp === 'friendly' ? 'friendly' : 'league'; };
  U.leagueNameOf = function (c) { return D.leagueNames[W.lk ? W.lk(c) : c.league] || ''; };
  // Ankündigung eines Spiels: je Wettbewerb eigene Farbe, eigenes Emblem und die wichtigsten Angaben
  U.compBanner = function (st, fx, compact) {
    var c = U.club(), kind = U.compKind(fx), H = st.clubs[fx.h], A = st.clubs[fx.a];
    var kicker = { league: 'Liga', cup: 'Pokal', ml: 'Europapokal', tl: 'Europapokal', releg: 'Entscheidungsspiel', friendly: 'Testspiel' }[kind], name, round, mode = '';
    if (kind === 'league') { name = U.leagueNameOf(c || H); round = (st.week + 1) + '. Spieltag'; mode = 'Punktspiel'; }
    else {
      var parts = S.fxLabel(st, fx).split(' – ');
      name = parts[0]; round = parts.slice(1).join(' – ') || (kind === 'releg' ? (st.relegLeg === 0 ? 'Hinspiel' : 'Rückspiel') : '');
      if (kind === 'friendly') { round = name.replace(/^Testspiel\s*/, '').replace(/[()]/g, ''); name = 'Testspiel'; mode = 'ohne Wertung'; }
      else if (fx.grp != null) mode = 'Gruppenphase · Platz 1 und 2 erreichen das Achtelfinale';
      else if (fx.aggregate) mode = 'Hinspiel ' + fx.aggregate[1] + ':' + fx.aggregate[0] + ' · bei Gleichstand Verlängerung';
      else if (fx.legs === 2) mode = 'Hin- und Rückspiel';
      else if (fx.extraTime) mode = 'K.-o.-Spiel · bei Gleichstand Verlängerung';
    }
    var place = fx.neutral ? (fx.venue ? fx.venue.name + ', ' + fx.venue.city : 'Neutraler Platz') : (H.foreign ? H.city + ' (' + H.countryName + ')' : H.stadiumName);
    var where = fx.neutral ? 'Neutraler Ort' : c && fx.h === c.id ? 'Heimspiel' : 'Auswärtsspiel';
    return '<div class="cb cb-' + kind + (compact ? ' compact' : '') + '">' + U.compEmblem(kind, compact ? 40 : 58) +
      '<div class="cb-main"><div class="cb-kicker">' + esc(kicker) + '</div><div class="cb-name">' + esc(name) + '</div><div class="cb-round">' + esc(round) + '</div></div>' +
      '<div class="cb-facts"><span>' + U.lc('map-pin', 14) + esc(place) + '</span><span>' + U.lc(fx.neutral ? 'flag' : 'shield', 14) + where + '</span>' + (mode && !compact ? '<span>' + U.lc('trophy', 14) + esc(mode) + '</span>' : '') + (fx.comp === 'euro' ? '<span>' + U.lc('wallet', 14) + esc(X.prizeText(fx)) + '</span>' : '') + '</div></div>';
  };
  // Kurzinfo zum Europapokalspiel für die Spielvorschau: Gruppentabelle bzw. Stand nach dem Hinspiel
  U.euroPreview = function (st, fx) {
    var c = U.club();
    if (fx.grp != null) return '<div class="eu-mini"><div class="eu-mini-h">Gruppe ' + X.GROUP_LETTERS[fx.grp] + '</div>' + groupTable(st, fx.euro, fx.grp, c) + '</div>';
    if (fx.aggregate) return '<p class="muted small">Hinspiel: ' + esc(st.clubs[fx.a].short) + ' – ' + esc(st.clubs[fx.h].short) + ' <b>' + fx.aggregate[1] + ':' + fx.aggregate[0] + '</b>. Steht es nach beiden Spielen unentschieden, gibt es Verlängerung.</p>';
    return '<p class="muted small">' + esc(st.clubs[fx.h].name) + ' (' + esc(X.countryOf(st, fx.h)) + ') gegen ' + esc(st.clubs[fx.a].name) + ' (' + esc(X.countryOf(st, fx.a)) + ').</p>';
  };

  // ---------- Bildschirm „Europapokal“ ----------
  function team(st, id, size, right) {
    var t = X.info(st, id), cr = U.crest(t, size || 18), nm = '<span class="eu-nm">' + esc(t.short || t.name) + '</span>';
    return '<span class="eu-team' + (right ? ' r' : '') + '" title="' + esc(t.name + ' · ' + X.countryOf(st, id)) + '">' + (right ? nm + cr : cr + nm) + '</span>';
  }
  function code(st, id) { return X.defs[id] ? X.defs[id].country : C.home.k; }
  function score(r) { return r ? r.hg + ':' + r.ag : '–:–'; }
  function groupTable(st, k, gi, c) {
    var done = X.groupsDone(st, k);
    return '<table class="t small eu-t"><thead><tr><th></th><th class="l">Verein</th><th>Sp</th><th>S</th><th>U</th><th>N</th><th>Tore</th><th>Pkt</th></tr></thead><tbody>' + X.table(st, k, gi).map(function (r, i) {
      return '<tr class="' + (c && r.id === c.id ? 'me ' : '') + (i < 2 ? 'q' : '') + '"><td class="pl"><i></i>' + (i + 1) + '</td><td class="l">' + team(st, r.id, 18) + '<em>' + code(st, r.id) + '</em></td><td>' + r.p + '</td><td>' + r.w + '</td><td>' + r.d + '</td><td>' + r.l + '</td><td>' + r.gf + ':' + r.ga + '</td><td><b>' + r.pts + '</b></td></tr>';
    }).join('') + '</tbody></table>' + (done ? '' : '');
  }
  function groupGames(st, k, gi, c) {
    var g = st.euro[k].groups[gi];
    return '<table class="t small eu-g">' + g.md.map(function (md, mi) {
      return md.map(function (f, fi) { return '<tr class="' + (c && (f.h === c.id || f.a === c.id) ? 'me' : '') + '">' + (fi === 0 ? '<td class="muted" rowspan="2">' + (mi + 1) + '.</td>' : '') + '<td class="r">' + team(st, f.h, 16, true) + '</td><td class="num"><b>' + score(f.r) + '</b></td><td>' + team(st, f.a, 16) + '</td></tr>'; }).join('');
    }).join('') + '</table>';
  }
  function tieRow(st, t, ri, c) {
    var legs = X.legsOf(ri), mine = c && (t.h === c.id || t.a === c.id), res;
    if (legs === 2) {
      var a = t.r[0], b = t.r[1];
      res = '<span class="eu-legs"><b>' + score(a) + '</b><b>' + (b ? b.ag + ':' + b.hg : '–:–') + '</b></span>' + (b && b.pens ? '<small>' + C.shootoutText + ' ' + b.pens[1] + ':' + b.pens[0] + '</small>' : '');
    } else res = '<span class="eu-legs"><b>' + score(t.r[0]) + '</b></span>' + (t.r[0] && t.r[0].pens ? '<small>' + C.shootoutText + ' ' + t.r[0].pens[0] + ':' + t.r[0].pens[1] + '</small>' : '');
    return '<div class="eu-tie' + (mine ? ' me' : '') + '"><div class="' + (t.winner === t.h ? 'win' : t.winner ? 'out' : '') + '">' + team(st, t.h, 20) + '</div><div class="eu-res">' + res + '</div><div class="' + (t.winner === t.a ? 'win' : t.winner ? 'out' : '') + '">' + team(st, t.a, 20, true) + '</div></div>';
  }
  U.screens.europa = function () {
    var st = U.st, c = U.club(), h = '<div class="page-h"><div><h1>Europapokal</h1><div class="page-sub">Meister-Liga und Top-Liga · Saison ' + st.season + '/' + String(st.season + 1).slice(2) + '</div></div></div>';
    X.ensure(st);
    var hall = (st.hall.euro || []).slice().reverse();
    if (!X.active(st)) {
      return h + '<div class="panel">' + U.empty('trophy', 'In dieser Saison findet für diesen Spielstand noch kein Europapokal statt. Mit der nächsten Saison starten Meister-Liga (Plätze 1–4 der 1. Liga) und Top-Liga (Plätze 5–8).') + '</div>';
    }
    var own = c ? X.compOf(st, c.id) : null, k = U.p.k || own || 'ml', view = U.p.v || (st.euro[k].ko.length ? 'ko' : 'gruppen'), comp = st.euro[k], v = X.venue(st, k), P = C.prize[k], us = X.userStatus(st);
    h += '<div class="row" style="margin-bottom:12px;gap:10px"><div class="seg">' + X.COMPS.map(function (x) { return '<button class="sm ' + (k === x ? 'on' : '') + '" data-act="euroTab" data-k="' + x + '">' + X.NAMES[x] + (own === x ? ' ★' : '') + '</button>'; }).join('') + '</div>' +
      '<div class="seg">' + [['gruppen', 'Gruppenphase'], ['ko', 'K.-o.-Runde'], ['info', 'Modus & Prämien'], ['sieger', 'Siegerliste']].map(function (x) { return '<button class="sm ' + (view === x[0] ? 'on' : '') + '" data-act="euroTab" data-k="' + k + '" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    // Kopf des Wettbewerbs
    h += '<div class="cb cb-' + k + '">' + U.compEmblem(k, 58) + '<div class="cb-main"><div class="cb-kicker">Europapokal</div><div class="cb-name">' + X.NAMES[k] + '</div><div class="cb-round">' +
      (comp.winner ? 'Sieger: ' + esc(X.info(st, comp.winner).name) : comp.ko.length ? comp.ko[comp.ko.length - 1].name : 'Gruppenphase') + '</div></div><div class="cb-facts"><span>' + U.lc('map-pin', 14) + (C.final4 ? 'Final 4: ' : 'Finale: ') + esc(v.name) + ', ' + esc(v.city) + ' (' + esc(v.country) + ')</span><span>' + U.lc('users', 14) + R.fmtNum(v.cap) + ' Plätze</span>' +
      (us && us.k === k ? '<span>' + U.lc('shield', 14) + esc(c.short) + ': ' + esc(us.text) + '</span><span>' + U.lc('wallet', 14) + 'Prämien bisher: ' + money(X.earned(st, c.id)) + '</span>' : '') + '</div></div>';
    if (view === 'gruppen') {
      var myG = own === k ? X.groupOf(st, k, c.id) : -1, order = comp.groups.map(function (g, i) { return i; });
      if (myG >= 0) { order.splice(order.indexOf(myG), 1); order.unshift(myG); }
      h += '<div class="eu-groups">' + order.map(function (gi) {
        return '<div class="panel tight eu-group' + (gi === myG ? ' mine' : '') + '"><h2>Gruppe ' + X.GROUP_LETTERS[gi] + '</h2>' + groupTable(st, k, gi, c) +
          '<details' + (gi === myG ? ' open' : '') + '><summary>Spiele</summary>' + groupGames(st, k, gi, c) + '</details></div>';
      }).join('') + '</div><p class="muted small">Die ersten beiden jeder Gruppe erreichen das Achtelfinale. Gruppenspieltage: Spielwochen ' + X.GROUP_WEEKS.join(', ') + '.</p>';
    } else if (view === 'ko') {
      if (!comp.ko.length) h += '<div class="panel">' + U.empty('trophy', 'Die K.-o.-Runde wird nach dem 6. Gruppenspieltag ausgelost: Gruppensieger gegen Gruppenzweite, der Gruppensieger hat im Rückspiel Heimrecht.') + '</div>';
      else h += '<div class="eu-ko">' + comp.ko.map(function (rd, ri) {
        var d = X.ROUNDS[ri], sub = d.neutral ? esc(v.name) + ', ' + esc(v.city) : X.legsOf(ri) === 2 ? 'Hinspiel · Rückspiel (Wochen ' + d.w.join(' und ') + ')' : '';
        return '<div class="panel tight eu-round"><h2>' + (d.f4 && ri === 2 ? 'Final 4 · ' : '') + rd.name + '</h2><div class="muted small eu-sub">' + sub + '</div>' + rd.ties.map(function (t) { return tieRow(st, t, ri, c); }).join('') + '</div>';
      }).join('') + '</div>';
    } else if (view === 'info') {
      var row = function (a, b) { return '<tr><td>' + a + '</td><td class="num">' + b + '</td></tr>'; };
      h += '<div class="grid g2"><div class="panel"><h2>Modus</h2><ul class="eu-list"><li><b>Teilnehmer:</b> ' + (k === 'ml' ? 'Plätze 1–4' : 'Plätze 5–8') + ' der Vorsaison aus acht Ländern (' + [C.home.n].concat(C.countries.map(function (x) { return x.n; })).join(', ') + ').</li>' +
        '<li><b>Gruppenphase:</b> 8 Gruppen mit je 4 Mannschaften, Hin- und Rückspiel. In jeder Gruppe spielen vier Vereine aus vier Ländern.</li>' +
        '<li><b>K.-o.-Runde:</b> Die besten zwei jeder Gruppe erreichen das Achtelfinale. Achtel- und Viertelfinale ' + (C.final4 ? '' : 'sowie Halbfinale ') + 'mit Hin- und Rückspiel.</li>' +
        (C.final4 ? '<li><b>Final 4:</b> Halbfinale und Finale an einem Wochenende, in dieser Saison in ' + esc(v.city) + ' (' + esc(v.name) + '). Der Ort wechselt jedes Jahr.</li>'
                  : '<li><b>Finale:</b> ein Spiel an wechselndem Ort, in dieser Saison in ' + esc(v.city) + ' (' + esc(v.name) + ').</li>') + '</ul></div>' +
        '<div class="panel"><h2>Prämien ' + X.NAMES[k] + '</h2><table class="t small">' + row('Startprämie', money(P.start)) + row('Sieg in der Gruppe', money(P.win)) + row('Unentschieden in der Gruppe', money(P.draw)) +
        X.ROUNDS.map(function (d, i) { return row('Einzug ' + (d.f4 && i === 2 ? 'ins Final 4' : 'ins ' + d.n), money(P.ko[i])); }).join('') + row('Titelgewinn', money(P.title)) + '</table>' +
        '<p class="muted small" style="margin-top:8px">Dazu kommen die Zuschauereinnahmen der Heimspiele.</p></div></div>';
      h += U.euroLogoPanel();
    } else {
      h += '<div class="panel"><h2>Siegerliste</h2>' + (hall.length ? '<table class="t">' + hall.map(function (x) { return '<tr><td>' + x.season + '/' + String(x.season + 1).slice(2) + '</td><td>' + X.NAMES[x.comp] + '</td><td><b>' + esc(x.club) + '</b></td><td class="muted">' + (C.final4 ? 'Final 4 in ' : 'Finale in ') + esc(x.city || '') + '</td></tr>'; }).join('') + '</table>' : U.empty('trophy', 'Noch kein Europapokalsieger.')) + '</div>';
    }
    return h;
  };
  U.acts.euroTab = function (d) { U.go('europa', { k: d.k, v: d.v }); };
  // Vereinslogos: nur auf diesem Gerät laden (wie die Sponsorenlogos), nie Teil der veröffentlichten App
  U.euroLogoPanel = function () {
    var L = R.logos; if (!L) return '';
    var cat = X.logoCatalog(), names = Object.keys(cat), have = names.filter(function (n) { return L.get(n); }).length;
    return '<div class="panel" style="margin-top:14px"><h2>Vereinslogos</h2><p class="muted small">Die Logos der europäischen Vereine werden nicht mit dem Spiel ausgeliefert. Sie können auf diesem Gerät aus der Wikipedia geladen werden (nur für den privaten Gebrauch, Markenrechte bei den Vereinen). Ohne Logo zeigt das Spiel ein neutrales Wappen in den Vereinsfarben.</p>' +
      '<div class="row"><button class="primary" data-act="euroLogos">' + U.lc('image', 15) + ' Vereinslogos laden</button><span class="muted small" id="euroLogoStat">' + have + ' von ' + names.length + ' geladen' + (L.enabled(U.st) ? '' : ' · echte Logos sind in den Einstellungen ausgeschaltet') + '</span></div></div>';
  };
  U.acts.euroLogos = function () {
    var L = R.logos, stat = document.getElementById('euroLogoStat'); if (!L || U._euroLogoRun) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { U.toast('Keine Internetverbindung.'); return; }
    U._euroLogoRun = true;
    X.loadLogos(function (done, total, name) { if (stat) stat.textContent = 'Lade ' + done + ' / ' + total + ' · ' + name; }).then(function (r) {
      U._euroLogoRun = false; U.toast(r.error ? 'Logos konnten nicht geladen werden.' : r.ok + ' Logos geladen.'); if (U.screen === 'europa') U.render();
    }, function () { U._euroLogoRun = false; U.toast('Logos konnten nicht geladen werden.'); });
  };
})(RFM);
