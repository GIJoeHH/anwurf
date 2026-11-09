// ANWURF! – Oberfläche: Liga & Statistiken, Managerkarriere, Editor (inkl. OCR), Einstellungen
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, M = R.match, T = R.transfers, ED = R.editor, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;

  U.acts.clubInfo = function (d) {
    var st = U.st, c = st.clubs[d.id]; if (!c) return;
    var sq = W.squad(st, c.id).sort(function (a, b) { return b.ovr - a.ovr; });
    U.modal(esc(c.name), '<div class="row" style="gap:16px;flex-wrap:nowrap">' + U.crest(c, 90) + '<table class="t small"><tr><td>Liga</td><td>' + D.leagueNames[W.lk(c)] + (st.week ? ' · ' + E.leaguePos(st, c) + '. Platz' : '') + '</td></tr><tr><td>Stadt / Halle</td><td>' + esc(c.city) + ' · ' + esc(c.stadiumName) + ' (' + R.fmtNum(E.capacity(c)) + ')</td></tr><tr><td>Fans / Ruf</td><td>' + R.fmtNum(c.fans) + ' / ' + c.reputation + '</td></tr><tr><td>Trainer</td><td>' + esc(U.coachName(c)) + ' (' + esc(c.coach.profile) + ')</td></tr><tr><td>Titel</td><td>' + c.titles.league + '× Meister, ' + c.titles.cup + '× Pokal</td></tr><tr><td>Kaderstärke</td><td>' + U.ovrBadge(M.squadStrength(st, c)) + '</td></tr>' + (c.rivals.length ? '<tr><td>Rivalen</td><td>' + c.rivals.map(function (r) { return esc(st.clubs[r].short); }).join(', ') + '</td></tr>' : '') + '</table></div><h3 style="margin-top:12px">Kader</h3><div class="scroll" style="max-height:300px">' + U.squadTable(sq, 'ci' + c.id, { market: true }) + '</div>', '<button data-act="closeModal">Schließen</button>', true);
  };

  // ---------- Liga & Statistiken ----------
  U.screens.liga = function () {
    var st = U.st, c = U.club(), tab = U.p.tab || 'tabelle', lvl = U.p.l || (c ? W.lk(c) : 1);
    var tabs = [['tabelle', 'Tabellen'], ['spielplan', 'Spielplan'], ['pokal', 'DHB-Pokal'], ['torjaeger', 'Torschützen'], ['vorlagen', 'Vorlagen'], ['spieler', 'Spielerranglisten'], ['zuschauer', 'Zuschauer'], ['finanzen', 'Vereinsfinanzen'], ['transfers', 'Transfers'], ['ewig', 'Ewige Tabelle'], ['titel', 'Titel & Hall of Fame']];
    var h = '<h1>Liga & Statistiken</h1><div class="row" style="margin-bottom:12px"><div class="seg">' + tabs.map(function (x) { return '<button class="sm ' + (tab === x[0] ? 'on' : '') + '" data-act="ligaTab" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
    var lsel = '<div class="seg" style="margin-bottom:10px;flex-wrap:wrap">' + D.leagueKeys.map(function (l) { return '<button class="sm ' + (lvl === l ? 'on' : '') + '" data-act="ligaLvl" data-l="' + l + '">' + (l < 3 ? D.leagueNames[l] : '3. Liga ' + D.leagueShort[l]) + '</button>'; }).join('') + '</div>';
    if (tab === 'tabelle') {
      var mode = U.p.mode || '';
      h += lsel + ' <div class="seg" style="margin-bottom:10px">' + [['', 'Gesamt'], ['home', 'Heim'], ['away', 'Auswärts'], ['form', 'Form (5 Spiele)']].map(function (x) { return '<button class="sm ' + (mode === x[0] ? 'on' : '') + '" data-act="ligaMode" data-m="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      var t = S.table(st, lvl, mode || null);
      h += '<div class="panel tight">' + U.table('tab' + lvl + mode, [
        { k: 'n', l: '#', num: true, nosort: true, f: function (r, i) { return i + 1; } },
        { k: 'club', l: 'Verein', nosort: true, f: function (r) { return U.clubLink(st.clubs[r.id], true) + (r.pen ? ' <span class="tag red">−' + r.pen + '</span>' : ''); } },
        { k: 'p', l: 'Sp', num: true, nosort: true }, { k: 'w', l: 'S', num: true, nosort: true }, { k: 'd', l: 'U', num: true, nosort: true }, { k: 'l', l: 'N', num: true, nosort: true },
        { k: 'g', l: 'Tore', num: true, nosort: true, f: function (r) { return r.gf + ':' + r.ga; } }, { k: 'gd', l: 'Diff', num: true, nosort: true, f: function (r) { return r.gf - r.ga; } },
        { k: 'pts', l: 'Punkte', num: true, nosort: true, f: function (r) { return '<b>' + r.pts + '</b>:' + Math.max(0, 2 * r.p - r.pts - (r.pen || 0)); } }, { k: 'form', l: 'Form', nosort: true, f: function (r) { return U.formDots(r.form); } }
      ], t, { rowClass: function (r, i) { var z = !mode ? (lvl === 2 && i < 2 ? 'zone-up' : lvl >= 3 && i === 0 ? 'zone-rel' : lvl < 3 && i >= t.length - 2 ? 'zone-down' : '') : ''; return z + (c && r.id === c.id ? ' me' : ''); } }) + '</div><p class="muted small">Grün = Aufstieg, Gelb = Aufstiegsrunde (die vier Staffelsieger spielen zwei Aufsteiger aus), Rot = Abstieg. Sieg 2 Punkte, Unentschieden 1 Punkt. Aus der 3. Liga steigt niemand ab.</p>';
    }
    if (tab === 'spielplan') {
      var nMd = st.leagues[lvl].fixtures.length, playedMd = S.roundsUpTo(st, lvl, st.week);
      var md = U.p.md != null ? Math.min(U.p.md, nMd - 1) : Math.max(0, Math.min(nMd - 1, st.phase === 'season' ? playedMd - 1 : st.phase === 'preseason' ? 0 : nMd - 1));
      h += lsel + '<div class="row" style="margin-bottom:10px"><button class="sm" data-act="ligaMd" data-md="' + Math.max(0, md - 1) + '">◀</button><b>' + (md + 1) + '. Spieltag</b><span class="muted small">von ' + nMd + '</span><button class="sm" data-act="ligaMd" data-md="' + Math.min(nMd - 1, md + 1) + '">▶</button>' + (c ? '<button class="sm" data-act="ligaOwn">Eigener Spielplan</button>' : '') + '</div>';
      if (U.p.own && c) {
        h += '<div class="panel tight"><table class="t">' + st.leagues[W.lk(c)].fixtures.map(function (mdx, i) { var f = mdx.filter(function (x) { return x.h === c.id || x.a === c.id; })[0]; if (!f) return ''; return '<tr class="' + (S.roundsOf(st, W.lk(c), st.week).indexOf(i) >= 0 ? 'me' : '') + '"><td class="num">' + (i + 1) + '.</td><td>' + (f.h === c.id ? 'H' : 'A') + '</td><td>' + esc(st.clubs[f.h === c.id ? f.a : f.h].name) + '</td><td class="num">' + (f.r ? '<b>' + f.r.hg + ':' + f.r.ag + '</b>' : '–:–') + '</td></tr>'; }).join('') + '</table></div>';
      } else h += '<div class="panel tight"><table class="t">' + st.leagues[lvl].fixtures[md].map(function (f) { return '<tr class="' + (c && (f.h === c.id || f.a === c.id) ? 'me' : '') + '"><td style="text-align:right">' + esc(st.clubs[f.h].name) + ' ' + U.crest(st.clubs[f.h], 16) + '</td><td class="num" style="text-align:center;width:70px"><b>' + (f.r ? f.r.hg + ':' + f.r.ag : '–:–') + '</b></td><td>' + U.crest(st.clubs[f.a], 16) + ' ' + esc(st.clubs[f.a].name) + '</td><td class="muted small">' + (f.r ? R.fmtNum(f.r.att) + ' Zuschauer' : '') + '</td></tr>'; }).join('') + '</table></div>';
    }
    if (tab === 'pokal') {
      h += st.cup.rounds.map(function (rd) { return '<div class="panel" style="margin-bottom:10px"><h2>' + rd.name + ' <span class="muted small">(Spieltag ' + rd.week + ')</span></h2><table class="t">' + rd.ties.map(function (tt) { return '<tr class="' + (c && (tt.h === c.id || tt.a === c.id) ? 'me' : '') + '"><td style="text-align:right;' + (tt.winner === tt.h ? 'font-weight:800' : '') + '">' + esc(st.clubs[tt.h].name) + ' <span class="muted small">L' + st.clubs[tt.h].league + '</span></td><td class="num" style="text-align:center;width:90px">' + (tt.r ? tt.r.hg + ':' + tt.r.ag + (tt.r.pens ? ' (' + tt.r.pens[0] + ':' + tt.r.pens[1] + ' n.7m)' : '') : '–:–') + '</td><td style="' + (tt.winner === tt.a ? 'font-weight:800' : '') + '"><span class="muted small">L' + st.clubs[tt.a].league + '</span> ' + esc(st.clubs[tt.a].name) + '</td></tr>'; }).join('') + '</table>' + (rd.name === '1. Runde' ? '<p class="muted small">Freilose: ' + st.cup.byes.map(function (id) { return esc(st.clubs[id].short); }).join(', ') + '</p>' : '') + '</div>'; }).join('') + (st.cup.winner ? '<div class="panel"><h2>🏆 Pokalsieger: ' + esc(st.clubs[st.cup.winner].name) + '</h2></div>' : '');
    }
    if (tab === 'torjaeger' || tab === 'vorlagen') {
      var key = tab === 'torjaeger' ? 'goals' : 'assists';
      h += lsel + '<div class="panel tight">' + U.table('tj' + key + lvl, [
        { k: 'n', l: '#', num: true, nosort: true, f: function (p, i) { return i + 1; } }, { k: 'name', l: 'Spieler', nosort: true, f: function (p) { return esc(W.playerName(p)); } },
        { k: 'club', l: 'Verein', nosort: true, f: function (p) { return esc(st.clubs[p.clubId].short); } }, { k: 'pos', l: 'Pos', nosort: true, f: function (p) { return U.posTag(p.pos); } },
        { k: 'apps', l: 'Spiele', num: true, nosort: true, f: function (p) { return p.stats.apps; } }, { k: key, l: tab === 'torjaeger' ? 'Tore' : 'Vorlagen', num: true, nosort: true, f: function (p) { return '<b>' + p.stats[key] + '</b>'; } }
      ], S.topScorers(st, lvl, 30, key), { click: 'playerInfo' }) + '</div>';
    }
    if (tab === 'spieler') {
      var arr = []; for (var id in st.players) { var p = st.players[id]; if (p.clubId && W.lk(st.clubs[p.clubId]) === lvl && p.stats.apps >= Math.max(3, Math.floor(st.week / 3))) arr.push(p); }
      arr.sort(function (a, b) { return b.stats.rsum / b.stats.apps - a.stats.rsum / a.stats.apps; });
      h += lsel + '<div class="panel tight">' + U.table('rk' + lvl, [
        { k: 'n', l: '#', num: true, nosort: true, f: function (p, i) { return i + 1; } }, { k: 'name', l: 'Spieler', nosort: true, f: function (p) { return esc(W.playerName(p)); } },
        { k: 'club', l: 'Verein', nosort: true, f: function (p) { return esc(st.clubs[p.clubId].short); } }, { k: 'pos', l: 'Pos', nosort: true, f: function (p) { return U.posTag(p.pos); } },
        { k: 'ovr', l: 'Stärke', num: true, nosort: true, f: function (p) { return U.ovrBadge(p.ovr); } }, { k: 'apps', l: 'Spiele', num: true, nosort: true, f: function (p) { return p.stats.apps; } },
        { k: 'avg', l: 'Ø Note', num: true, nosort: true, f: function (p) { return '<b>' + (p.stats.rsum / p.stats.apps).toFixed(2) + '</b>'; } }
      ], arr.slice(0, 40), { click: 'playerInfo' }) + '</div>';
    }
    if (tab === 'zuschauer') {
      var rows = Object.keys(st.clubs).map(function (k) { var x = st.clubs[k]; return { id: k, c: x, avg: x.attendanceHist.length ? R.avg(x.attendanceHist) : 0, cap: E.capacity(x), rec: x.records.attendance }; });
      h += '<div class="panel tight">' + U.table('zus', [
        { k: 'c', l: 'Verein', v: function (r) { return r.c.name; }, f: function (r) { return U.clubLink(r.c, true); } }, { k: 'lg', l: 'Liga', num: true, v: function (r) { return r.c.league; }, f: function (r) { return r.c.league; } },
        { k: 'avg', l: 'Ø Zuschauer', num: true, f: function (r) { return R.fmtNum(r.avg); } }, { k: 'cap', l: 'Kapazität', num: true, f: function (r) { return R.fmtNum(r.cap); } },
        { k: 'q', l: 'Auslastung', num: true, v: function (r) { return r.avg / r.cap; }, f: function (r) { return Math.round(r.avg / r.cap * 100) + ' %'; } }, { k: 'rec', l: 'Rekord', num: true, f: function (r) { return R.fmtNum(r.rec); } }
      ], rows, { sort: { k: 'avg', d: -1 }, rowClass: function (r) { return c && r.id === c.id ? 'me' : ''; } }) + '</div>';
    }
    if (tab === 'finanzen') {
      var fr = Object.keys(st.clubs).map(function (k) { var x = st.clubs[k]; return { id: k, c: x, cash: x.cash, debt: E.debt(x), net: x.cash + x.savings - E.debt(x), wages: E.wageTotal(st, x), spons: E.sponsorTotal(x) }; });
      h += '<div class="panel tight">' + U.table('fin', [
        { k: 'c', l: 'Verein', v: function (r) { return r.c.name; }, f: function (r) { return U.clubLink(r.c, true); } }, { k: 'lg', l: 'Liga', num: true, v: function (r) { return r.c.league; }, f: function (r) { return r.c.league; } },
        { k: 'cash', l: 'Kontostand', num: true, f: function (r) { return '<span class="' + U.moneyCls(r.cash) + '">' + money(r.cash) + '</span>'; } }, { k: 'debt', l: 'Schulden', num: true, f: function (r) { return money(r.debt); } },
        { k: 'net', l: 'Vermögen', num: true, f: function (r) { return money(r.net); } }, { k: 'wages', l: 'Gehälter/J.', num: true, f: function (r) { return money(r.wages); } }, { k: 'spons', l: 'Sponsoren/J.', num: true, f: function (r) { return money(r.spons); } }
      ], fr, { sort: { k: 'net', d: -1 }, rowClass: function (r) { return c && r.id === c.id ? 'me' : ''; } }) + '</div>';
    }
    if (tab === 'transfers') {
      h += '<div class="panel tight"><div class="scroll">' + U.table('trf', [
        { k: 'season', l: 'Saison', num: true }, { k: 'week', l: 'ST', num: true }, { k: 'name', l: 'Spieler' }, { k: 'from', l: 'Von' }, { k: 'to', l: 'Nach' },
        { k: 'fee', l: 'Ablöse', num: true, f: function (r) { return r.loan ? 'Leihe' : r.fee ? money(r.fee) : 'ablösefrei'; } }
      ], st.transfers.slice(0, 300), { rowClass: function (r) { return c && (r.toId === c.id || r.fromId === c.id) ? 'me' : ''; } }) + '</div></div>';
    }
    if (tab === 'ewig') {
      var at = Object.keys(st.allTime).map(function (k) { var r = st.allTime[k]; return Object.assign({ id: k }, r); });
      h += '<div class="panel tight">' + (at.length ? U.table('ewig', [
        { k: 'c', l: 'Verein', v: function (r) { return st.clubs[r.id].name; }, f: function (r) { return U.clubLink(st.clubs[r.id], true); } }, { k: 'l1', l: 'Saisons 1. Liga', num: true }, { k: 'seasons', l: 'Saisons ges.', num: true },
        { k: 'p', l: 'Spiele', num: true }, { k: 'w', l: 'S', num: true }, { k: 'd', l: 'U', num: true }, { k: 'l', l: 'N', num: true }, { k: 'gf', l: 'Tore', num: true, f: function (r) { return r.gf + ':' + r.ga; } }, { k: 'pts', l: 'Punkte (1. Liga)', num: true }
      ], at, { sort: { k: 'pts', d: -1 } }) : '<p class="muted" style="padding:12px">Die ewige Tabelle füllt sich nach der ersten Saison.</p>') + '</div>';
    }
    if (tab === 'titel') {
      h += '<div class="grid g3"><div class="panel"><h2>Deutsche Meister</h2>' + (st.hall.champions.length ? st.hall.champions.slice().reverse().map(function (x) { return '<div>' + x.season + ': <b>' + esc(x.club) + '</b></div>'; }).join('') : '<p class="muted">–</p>') + '</div>' +
        '<div class="panel"><h2>Pokalsieger</h2>' + (st.hall.cups.length ? st.hall.cups.slice().reverse().map(function (x) { return '<div>' + x.season + ': <b>' + esc(x.club) + '</b></div>'; }).join('') : '<p class="muted">–</p>') + '</div>' +
        '<div class="panel"><h2>Torschützenkönige 1. Liga</h2>' + (st.hall.topScorers.filter(function (x) { return x.league === 1; }).slice().reverse().map(function (x) { return '<div>' + x.season + ': <b>' + esc(x.name) + '</b> (' + esc(x.club) + ', ' + x.goals + ')</div>'; }).join('') || '<p class="muted">–</p>') + '</div></div>' + U.hallOfFame();
    }
    return h;
  };
  U.hallOfFame = function () {
    var st = U.st;
    var rich = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).sort(function (a, b) { return (b.cash + b.savings) - (a.cash + a.savings); })[0];
    var recT = st.transfers.slice().sort(function (a, b) { return b.fee - a.fee; })[0];
    var recA = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).sort(function (a, b) { return b.records.attendance - a.records.attendance; })[0];
    var scorer = null; for (var id in st.players) { var p = st.players[id]; if (!scorer || p.career.goals > scorer.career.goals) scorer = p; }
    return '<div class="panel" style="margin-top:14px"><h2>Hall of Fame' + (st.cheatUsed ? ' <span class="cheat-tag">mit Cheat-Spielstand</span>' : '') + '</h2><table class="t"><tr><td>Rekordtransfer</td><td>' + (recT ? esc(recT.name) + ' (' + esc(recT.from) + ' → ' + esc(recT.to) + ', ' + money(recT.fee) + ', ' + recT.season + ')' : '–') + '</td></tr><tr><td>Rekordtorjäger (aktiv)</td><td>' + (scorer ? esc(W.playerName(scorer)) + ' – ' + scorer.career.goals + ' Tore' : '–') + '</td></tr><tr><td>Zuschauerrekord</td><td>' + (recA ? esc(recA.name) + ' – ' + R.fmtNum(recA.records.attendance) : '–') + '</td></tr><tr><td>Größtes Vereinsvermögen</td><td>' + esc(rich.name) + ' – ' + money(rich.cash + rich.savings) + '</td></tr><tr><td>Erfolgreichste Managerkarriere</td><td>' + esc(st.manager.name) + ' – Reputation ' + st.manager.reputation + ', ' + R.sum(st.manager.history, function (h) { return h.titles.length; }) + ' Titel/Aufstiege</td></tr></table></div>';
  };
  U.acts.ligaTab = function (d) { U.go('liga', { tab: d.tab, l: U.p.l }); };
  U.acts.ligaLvl = function (d) { U.go('liga', Object.assign({}, U.p, { l: +d.l })); };
  U.acts.ligaMode = function (d) { U.go('liga', Object.assign({}, U.p, { mode: d.m })); };
  U.acts.ligaMd = function (d) { U.go('liga', Object.assign({}, U.p, { md: +d.md, own: false })); };
  U.acts.ligaOwn = function () { U.go('liga', Object.assign({}, U.p, { own: !U.p.own })); };

  // ---------- Managerkarriere ----------
  // Bankdirektor-Cheat entdeckt? (erst dann erscheinen Hinweise darauf)
  U.cheatDiscovered = function (st) { return !!(st && (st.cheatUsed || st.cheatClicks > 0 || (st.achievements && st.achievements.bankdirector))); };
  U.screens.karriere = function () {
    var st = U.st, mg = st.manager, c = U.club();
    var h = '<h1 class="row" style="gap:10px">' + (c ? U.crest(c, 34) : '') + 'Managerkarriere</h1>';
    if (mg.unemployed) {
      h += '<div class="panel" style="margin-bottom:14px;border-color:var(--amber)"><h2>Vereinslos</h2><p>Entlassungsgrund: <b>' + esc(mg.firedReason || '–') + '</b></p><p class="muted small">Die Spielwelt läuft weiter. Mit „WOCHE ABWARTEN“ kommen neue Angebote – oder bewerben Sie sich selbst.</p></div>';
      h += '<div class="panel" style="margin-bottom:14px"><h2>Stellenangebote (' + mg.offers.length + ')</h2>' + mg.offers.map(function (o, i) {
        var oc = st.clubs[o.clubId];
        return '<div class="news-item row between"><div class="row" style="flex-wrap:nowrap">' + U.crest(oc, 36) + '<div><div class="h">' + esc(oc.name) + ' – ' + S.roleName(o.role) + '</div><div class="tx">' + D.leagueNames[W.lk(oc)] + ', ' + (st.week ? E.leaguePos(st, oc) + '. Platz, ' : '') + 'Kontostand ' + money(oc.cash) + ', Kader ' + Math.round(M.squadStrength(st, oc)) + '. ' + esc(o.text) + '</div></div></div><button class="primary" data-act="acceptJob" data-i="' + i + '">Annehmen</button></div>';
      }).join('') + '</div>';
      h += '<div class="panel" style="margin-bottom:14px"><h2>Initiativbewerbung</h2><div class="row"><select id="applyClub">' + Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).sort(function (a, b) { return a.league - b.league || a.name.localeCompare(b.name); }).map(function (x) { return '<option value="' + x.id + '">' + esc(x.name) + ' (L' + x.league + ', Ruf ' + x.reputation + ')</option>'; }).join('') + '</select><button data-act="applyJob">Bewerben</button></div></div>';
    }
    h += '<div class="grid g2"><div class="panel"><h2>' + esc(mg.name) + '</h2><table class="t"><tr><td>Managerreputation</td><td class="num">' + mg.reputation + '/100 ' + U.bar(mg.reputation) + '</td></tr><tr><td>Aktuelle Rolle</td><td class="num">' + (c ? S.roleName(mg.role) + ' bei ' + esc(c.name) : 'vereinslos') + '</td></tr><tr><td>Saisons</td><td class="num">' + mg.seasonsPlayed + '</td></tr><tr><td>Entlassbar</td><td class="num">' + (mg.founder ? 'nein (Vereinsgründer)' : mg.canBeFired ? 'ja' : 'nein') + '</td></tr>' + (mg.lastRating ? '<tr><td>Letzte Bewertung</td><td class="num">' + esc(mg.lastRating.text) + ' (Platz ' + mg.lastRating.pos + ', ' + (mg.lastRating.delta >= 0 ? '+' : '') + mg.lastRating.delta + ')</td></tr>' : '') + '</table>' +
      (c && !mg.founder ? '<button class="danger sm" style="margin-top:10px" data-act="resign">Zurücktreten</button>' : '') +
      (c && mg.founder ? '<h3 style="margin-top:14px">Spielmodus wechseln</h3><p class="muted small">Als Präsident Ihres eigenen Vereins legen Sie fest, welche Aufgaben Sie selbst übernehmen.</p><div class="seg">' + [['manager', '👔 Manager'], ['trainer', '📋 Trainer'], ['gf', '💼 Geschäftsführer']].map(function (r) { return '<button class="' + (mg.role === r[0] ? 'on' : '') + '" data-act="setRole" data-v="' + r[0] + '">' + r[1] + '</button>'; }).join('') + '</div>' : '') + '</div>';
    h += '<div class="panel"><h2>Stationen</h2><table class="t">' + mg.history.slice().reverse().map(function (x) { var hc = st.clubs[x.clubId]; return '<tr><td>' + x.from + '–' + (x.to || 'heute') + '</td><td>' + (hc ? U.crest(hc, 18) + ' ' : '') + esc(x.club) + '</td><td>' + S.roleName(x.role) + '</td><td class="small">' + (x.titles.length ? x.titles.map(esc).join(', ') : '') + (x.fired ? ' <span class="neg">entlassen</span>' : '') + '</td></tr>'; }).join('') + '</table></div></div>';
    // Achievements
    var ach = st.achievements, cheatKnown = U.cheatDiscovered(st);
    // Das Cheat-Achievement bleibt verborgen, bis der Bankdirektor entdeckt wurde
    var achKeys = Object.keys(D.achievements).filter(function (k) { return k !== 'bankdirector' || cheatKnown; });
    h += '<div class="panel" style="margin-top:14px"><h2>Achievements (' + achKeys.filter(function (k) { return ach[k]; }).length + '/' + achKeys.length + ')</h2><div class="grid g3">' + achKeys.map(function (k) {
      var a = ach[k];
      return '<div class="kpi" style="opacity:' + (a ? 1 : 0.45) + '"><div class="l">' + (a ? '🏆' : '🔒') + ' ' + esc(D.achievements[k][0]) + (a && a.cheat ? ' <span class="cheat-tag">Cheat</span>' : '') + '</div><div class="small muted" style="margin-top:4px">' + esc(D.achievements[k][1]) + (a ? ' · ' + a.season : '') + '</div></div>';
    }).join('') + '</div>' + (cheatKnown ? '<p class="muted small">Achievements, die in einem Spielstand mit genutztem Cheat erreicht wurden, werden separat gekennzeichnet.</p>' : '') + '</div>';
    // Saisonarchiv
    if (st.history.length) h += '<div class="panel" style="margin-top:14px"><h2>Saisonarchiv</h2><table class="t">' + st.history.slice().reverse().map(function (x) { return '<tr><td>' + x.season + '</td><td>Meister: <b>' + esc(st.clubs[x.champions[1]].name) + '</b></td><td>Pokal: ' + esc(st.clubs[x.cup].name) + '</td><td>' + (x.userClub ? esc(st.clubs[x.userClub].short) + ': ' + x.userPos + '. in L' + x.userLeague : '') + '</td></tr>'; }).join('') + '</table></div>';
    return h;
  };
  U.acts.acceptJob = function (d) { S.acceptJob(U.st, +d.i); U.autosave(); U.go('zentrale'); U.toast('Willkommen beim neuen Verein!'); };
  U.acts.applyJob = function () { var r = S.applyForJob(U.st, document.getElementById('applyClub').value); U.toast(r.text || 'Bewerbung verschickt', 3500); U.render(); };
  U.acts.setRole = function (d) {
    var mg = U.st.manager; if (!mg.founder || mg.role === d.v) return;
    mg.role = d.v; var hx = mg.history[mg.history.length - 1]; if (hx) hx.role = d.v;
    S.news(U.st, mg.name + ' ist jetzt ' + S.roleName(d.v), d.v === 'manager' ? 'Der Präsident übernimmt wieder alle Bereiche selbst.' : d.v === 'trainer' ? 'Die KI-Geschäftsführung kümmert sich um die Finanzen.' : 'Ein KI-Trainer übernimmt das Sportliche.', 'karriere');
    U.render(); U.toast('Rolle: ' + S.roleName(d.v)); U.autosave();
  };
  U.acts.resign = function () {
    U.confirm('Rücktritt', 'Wirklich zurücktreten? Sie erhalten danach neue Jobangebote, der Verein wird von der KI übernommen.', function () {
      var st = U.st, mg = st.manager, c = U.club();
      c.userControlled = false; mg.unemployed = true; mg.firedReason = 'Rücktritt auf eigenen Wunsch'; mg.offers = [];
      mg.history[mg.history.length - 1].to = st.season;
      S.news(st, mg.name + ' tritt bei ' + c.short + ' zurück', '', 'karriere');
      S.generateJobOffers(st, 2); U.go('karriere');
    });
  };

  // ---------- Editor ----------
  U.screens.editor = function () {
    var st = U.st, tab = U.p.tab || 'vereine';
    var h = '<h1>Datenbankeditor</h1><div class="seg" style="margin-bottom:12px">' + [['vereine', 'Vereine'], ['spieler', 'Spieler'], ['sponsoren', 'Sponsoren'], ['wappen', 'Wappen'], ['ocr', 'Screenshot-Import (OCR)'], ['daten', 'Import / Export']].map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="editor" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var clubOpts = function (sel, withNone) { return (withNone ? '<option value="">— vereinslos —</option>' : '') + Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).sort(function (a, b) { return a.league - b.league || a.name.localeCompare(b.name); }).map(function (c) { return '<option value="' + c.id + '"' + (c.id === sel ? ' selected' : '') + '>' + esc(c.name) + ' (L' + c.league + ')</option>'; }).join(''); };
    if (tab === 'vereine') {
      var cid = U.p.cid || st.manager.clubId || 'c1', c = st.clubs[cid];
      h += '<div class="row" style="margin-bottom:10px"><select data-chg="edClub">' + clubOpts(cid) + '</select></div><div class="grid g21"><div class="panel"><div class="grid g2">' +
        U.field('Vereinsname', '<input type="text" id="ec_name" value="' + esc(c.name) + '">') + U.field('Kurzname', '<input type="text" id="ec_short" value="' + esc(c.short) + '">') +
        U.field('Stadt', '<input type="text" id="ec_city" value="' + esc(c.city) + '">') + U.field('Hallenname', '<input type="text" id="ec_stadiumName" value="' + esc(c.stadiumName) + '">') +
        U.field('Farben', '<div class="row"><input type="color" id="ec_color1" value="' + c.colors[0] + '"><input type="color" id="ec_color2" value="' + c.colors[1] + '"></div>') +
        U.field('Liga (nur in der Saisonvorbereitung)', '<select id="ec_league">' + [1, 2, 3].map(function (l) { return '<option' + (l === c.league ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select>') +
        U.field('Fanbasis', '<input type="number" id="ec_fans" value="' + c.fans + '">') + U.field('Reputation (1–100)', '<input type="number" id="ec_reputation" value="' + c.reputation + '">') +
        U.field('Kontostand (€)', '<input type="number" id="ec_cash" value="' + Math.round(c.cash) + '">') +
        '</div><h3 style="margin-top:14px">Wappen</h3><p class="muted small">Klick auf Form oder Symbol übernimmt die Änderung sofort.' + (c.crestImage ? ' <b>Aktuell ist ein eigenes Wappenbild aktiv</b> – Form/Symbol ersetzen es.' : '') + '</p>' +
        U.field('Wappenform', '<div class="seg">' + ['Schild', 'Kreis', 'Raute', 'Wappen'].map(function (n, i) { return '<button class="' + (!c.crestImage && c.crest.shape === i ? 'on' : '') + '" data-act="edCrestSet" data-id="' + cid + '" data-k="crestShape" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div>') +
        U.field('Wappensymbol', '<div class="seg">' + ['Initialen', 'Stern', 'Ball', 'Streifen', 'Winkel', 'Krone'].map(function (n, i) { return '<button class="' + (!c.crestImage && c.crest.symbol === i ? 'on' : '') + '" data-act="edCrestSet" data-id="' + cid + '" data-k="crestSymbol" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div>') +
        '<div class="row" style="margin-top:8px"><button data-act="edCrestImg" data-id="' + cid + '">🖼️ Eigenes Wappenbild hochladen</button>' + (c.crestImage ? '<button data-act="edCrestDel" data-id="' + cid + '">Wappenbild entfernen</button>' : '') + '</div><h3 style="margin-top:14px">Infrastruktur</h3><div class="grid g3">' + ['steh', 'sitz', 'vip', 'oepnv', 'strasse', 'parken', 'medizin', 'jugend', 'training'].map(function (k) { return U.field(D.facilities[k].name, '<select id="ef_' + k + '">' + D.facilities[k].levels.map(function (l, i) { return l ? '<option value="' + i + '"' + (c.fac[k] === i ? ' selected' : '') + '>' + i + ' – ' + esc(l.n) + '</option>' : ''; }).join('') + '</select>'); }).join('') +
        '</div><div class="row" style="margin-top:14px"><button class="primary" data-act="edClubSave" data-id="' + cid + '">Speichern</button><button data-act="edClubExport" data-id="' + cid + '">Verein als JSON exportieren</button></div></div><div class="panel" style="text-align:center">' + U.crest(c, 150) + '<h3>' + esc(c.name) + '</h3></div></div>';
    }
    if (tab === 'spieler') {
      var pc = U.p.pc != null ? U.p.pc : (st.manager.clubId || 'c1');
      var list = Object.keys(st.players).map(function (k) { return st.players[k]; }).filter(function (p) { return pc === '' ? !p.clubId : p.clubId === pc; });
      h += '<div class="row" style="margin-bottom:10px"><select data-chg="edPlayerClub">' + clubOpts(pc, true) + '</select><button class="primary" data-act="edNewPlayer">+ Neuer Spieler</button></div>';
      h += '<div class="panel tight"><div class="scroll">' + U.table('edp', [
        { k: 'last', l: 'Name', f: function (p) { return esc(W.playerName(p)) + (p.youth ? ' <span class="tag">Jugend</span>' : ''); } }, { k: 'pos', l: 'Pos', f: function (p) { return U.posTag(p.pos); } },
        { k: 'age', l: 'Alter', num: true }, { k: 'ovr', l: 'Stärke', num: true }, { k: 'pot', l: 'Pot.', num: true }, { k: 'wage', l: 'Gehalt', num: true, f: function (p) { return money(p.wage); } }, { k: 'contract', l: 'Vertr.', num: true }
      ], list, { click: 'edPlayer', sort: { k: 'ovr', d: -1 } }) + '</div></div>';
    }
    if (tab === 'sponsoren') {
      var sc = U.p.cid || st.manager.clubId || 'c1', scl = st.clubs[sc];
      h += '<div class="row" style="margin-bottom:10px"><select data-chg="edSpClub">' + clubOpts(sc) + '</select><span class="muted small">Summe: <b>' + money(E.sponsorTotal(scl)) + '</b>/Saison</span></div>';
      h += '<div class="panel tight"><table class="t"><tr><th>Kategorie</th><th>Name</th><th class="num">€/Saison</th><th class="num">Jahre</th><th class="num">Top-N</th><th class="num">Bonus Top-N</th><th class="num">Bonus Aufstieg</th><th class="num">Bonus Meister</th><th></th></tr>' + Object.keys(D.sponsorCategories).map(function (cat) {
        var s = scl.sponsors.filter(function (x) { return x.cat === cat; })[0];
        if (!s) return '<tr><td class="muted">' + D.sponsorCategories[cat] + '</td><td colspan="7" class="muted">— kein Vertrag —</td><td><button class="sm primary" data-act="edSpAdd" data-id="' + sc + '" data-k="' + cat + '">+ Vertrag anlegen</button></td></tr>';
        function inp(k, w, num) { return '<input type="' + (num ? 'number' : 'text') + '" id="sp_' + s.id + '_' + k + '" value="' + esc(s[k]) + '" style="width:' + w + 'px">'; }
        return '<tr><td>' + D.sponsorCategories[cat] + '</td><td>' + inp('name', 210) + '</td><td class="num">' + inp('amount', 110, 1) + '</td><td class="num">' + inp('years', 50, 1) + '</td><td class="num">' + inp('topN', 50, 1) + '</td><td class="num">' + inp('bonusTop', 95, 1) + '</td><td class="num">' + inp('bonusPromo', 95, 1) + '</td><td class="num">' + inp('bonusTitle', 95, 1) + '</td><td><button class="sm primary" data-act="edSpSave" data-id="' + sc + '" data-k="' + s.id + '">Speichern</button> <button class="sm danger" data-act="edSpDel" data-id="' + sc + '" data-k="' + s.id + '">Löschen</button></td></tr>';
      }).join('') + '</table></div>';
      h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Sponsoren-Namensliste</h2><p class="muted small">Aus dieser Liste werden neue Sponsorenangebote für alle Vereine erzeugt (ein Name pro Zeile). Leer lassen = Standardliste.</p><textarea id="spPool" rows="12" style="width:100%">' + esc((st.sponsorPool && st.sponsorPool.length ? st.sponsorPool : D.sponsorNames).join('\n')) + '</textarea><div class="row" style="margin-top:8px"><button class="primary" data-act="edSpPool">Liste speichern</button><button data-act="edSpPoolReset">Standard wiederherstellen</button></div></div>' +
        '<div class="panel"><h2>Ausrüster-Marken</h2><textarea id="kitPool" rows="12" style="width:100%">' + esc((st.kitPool && st.kitPool.length ? st.kitPool : D.kitBrands).join('\n')) + '</textarea><div class="row" style="margin-top:8px"><button class="primary" data-act="edKitPool">Liste speichern</button></div></div></div>';
    }
    if (tab === 'ocr') {
      var o = U.ocrState || {};
      h += '<div class="panel" style="margin-bottom:12px"><h2>Mannschaftsliste aus Screenshot oder Foto</h2><ol class="small muted"><li>Bild auswählen</li><li>Text wird lokal erkannt' + (R.save.isNative ? ' (Apple Vision, offline)' : ' (Tesseract – benötigt beim ersten Mal Internet)') + '</li><li>Namen, Positionen und Zahlen werden extrahiert</li><li>Unsichere Werte sind markiert und können korrigiert werden</li><li>Erst nach Bestätigung wird importiert</li></ol><div class="row"><button class="primary" data-act="ocrPick">🖼️ Bild auswählen</button><button data-act="ocrManual">Manuelle Eingabe</button><span class="muted small">' + esc(o.status || '') + '</span></div></div>';
      if (o.rows) {
        h += '<div class="panel"><div class="row between" style="margin-bottom:8px"><h2>Erkannte Spieler (' + o.rows.length + ')</h2><div class="row">Ziel: <select id="ocrClub">' + clubOpts(st.manager.clubId) + '</select><button class="primary" data-act="ocrImport">Ausgewählte importieren</button><button data-act="ocrAddRow">+ Zeile</button></div></div><table class="t"><tr><th>✓</th><th>Vorname</th><th>Nachname</th><th>Pos</th><th>Stärke</th><th>Alter</th><th>Hinweise</th></tr>' + o.rows.map(function (r, i) {
          function inp(k, w, type) { return '<input type="' + (type || 'text') + '" data-inp="ocrEdit" data-i="' + i + '" data-k="' + k + '" value="' + esc(r[k]) + '" style="width:' + w + 'px;' + (r.unsure.some(function (u) { return (k === 'pos' && u === 'Position') || (k === 'ovr' && u === 'Stärke') || (k === 'age' && u === 'Alter') || (k === 'first' && u === 'Vorname'); }) ? 'border-color:#f5b301' : '') + '">'; }
          return '<tr><td><input type="checkbox" data-chg="ocrInc" data-i="' + i + '"' + (r.include ? ' checked' : '') + '></td><td>' + inp('first', 110) + '</td><td>' + inp('last', 130) + '</td><td><select data-chg="ocrPos" data-i="' + i + '">' + D.positions.map(function (p) { return '<option' + (p === r.pos ? ' selected' : '') + '>' + p + '</option>'; }).join('') + '</select></td><td>' + inp('ovr', 60, 'number') + '</td><td>' + inp('age', 60, 'number') + '</td><td class="small warn">' + (r.unsure.length ? '⚠️ unsicher: ' + r.unsure.join(', ') : '') + '</td></tr>';
        }).join('') + '</table>' + (o.raw ? '<details style="margin-top:10px"><summary class="muted small">Erkannter Rohtext</summary><pre class="small" style="white-space:pre-wrap">' + esc(o.raw) + '</pre></details>' : '') + '</div>';
      }
    }
    if (tab === 'wappen') h += U.crestPanel();
    if (tab === 'daten') {
      h += '<div class="panel" style="margin-bottom:14px"><h2>🔄 Echte Spielerdaten</h2><p class="small">Die Kader stammen aus der HBL-Datenschnittstelle (Bundesliga, 2. Bundesliga) und von handball.net (3. Liga). Stand: <b>' + esc(D.real ? D.real.stamp : '–') + '</b>. Aktualisieren lassen sie sich am Mac mit <code>tools/update_real_db.sh</code> (siehe LIESMICH). Die neuen Daten gelten dann für neue Karrieren.</p></div>';
      h += '<div class="grid g2"><div class="panel"><h2>Spielerdatenbank</h2><p class="muted small">Datenbanken (Vereine &amp; Spieler) werden getrennt von Spielständen verwaltet. Importierte Daten werden vorher geprüft.</p><div class="grid"><button data-act="dbExport">Gesamtdatenbank als JSON exportieren</button><button data-act="dbImport">Datenbank (JSON) importieren</button><button data-act="csvExport">Alle Spieler als CSV exportieren</button><button data-act="csvImport">Spieler aus CSV importieren (in eigenen Verein)</button></div></div>' +
        '<div class="panel"><h2>Spielstand</h2><div class="grid"><button data-act="exportSave">Spielstand als JSON exportieren</button><button data-act="importSave">Spielstand importieren</button></div><p class="muted small">CSV-Format: Vorname;Nachname;Alter;Position;Stärke;Potenzial (Semikolon-getrennt, erste Zeile = Überschrift).</p></div></div>';
    }
    return h;
  };
  U.acts.edSpClub = function (d, el) { U.go('editor', { tab: 'sponsoren', cid: el.value }); };
  U.acts.edSpAdd = function (d) { ED.addSponsor(U.st, d.id, d.k); U.render(); U.toast('Vertrag angelegt – Werte anpassen und speichern.'); };
  U.acts.edSpDel = function (d) { U.confirm('Sponsor löschen', 'Diesen Sponsorenvertrag entfernen?', function () { ED.deleteSponsor(U.st, d.id, d.k); U.render(); }); };
  U.acts.edSpSave = function (d) {
    var f = {}; ED.sponsorFields.forEach(function (k) { var el = document.getElementById('sp_' + d.k + '_' + k); if (el) f[k] = el.value; });
    var r = ED.updateSponsor(U.st, d.id, d.k, f); U.toast(r.ok ? 'Sponsor gespeichert.' : (r.why || 'Fehler')); U.render();
  };
  U.acts.edSpPool = function () { var n = ED.setSponsorPool(U.st, document.getElementById('spPool').value); U.toast(n + ' Sponsorennamen gespeichert.'); };
  U.acts.edSpPoolReset = function () { U.st.sponsorPool = null; U.render(); U.toast('Standardliste wiederhergestellt.'); };
  U.acts.edKitPool = function () { var n = ED.setSponsorPool(U.st, document.getElementById('kitPool').value, true); U.toast(n + ' Marken gespeichert.'); };
  U.acts.edClub = function (d, el) { U.go('editor', { tab: 'vereine', cid: el.value }); };
  U.acts.edClubSave = function (d) {
    var g = function (k) { var el = document.getElementById(k); return el ? el.value : null; };
    var fac = {}; ['steh', 'sitz', 'vip', 'oepnv', 'strasse', 'parken', 'medizin', 'jugend', 'training'].forEach(function (k) { fac[k] = +g('ef_' + k); });
    var cl = U.st.clubs[d.id]; if (cl && cl.stadium && ['steh', 'sitz', 'vip'].some(function (k) { return fac[k] !== cl.fac[k]; })) cl.stadium = null; // Hallenplan aus den neuen Stufen neu aufbauen
    var r = ED.updateClub(U.st, d.id, { name: g('ec_name'), short: g('ec_short'), city: g('ec_city'), stadiumName: g('ec_stadiumName'), color1: g('ec_color1'), color2: g('ec_color2'), fans: g('ec_fans'), reputation: g('ec_reputation'), cash: g('ec_cash'), fac: fac, league: +g('ec_league') });
    U.toast(r.ok ? 'Verein gespeichert.' : r.why); U.render();
  };
  U.resizeImage = function (dataUrl, max, cb) {
    var img = new Image(); img.onload = function () { var s = Math.min(1, max / Math.max(img.width, img.height)); var cv = document.createElement('canvas'); cv.width = Math.round(img.width * s); cv.height = Math.round(img.height * s); cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); cb(cv.toDataURL('image/png')); };
    img.onerror = function () { U.toast('Bild konnte nicht gelesen werden.'); }; img.src = dataUrl;
  };
  U.acts.edCrestImg = function (d) { U.pickFile('image/*', function (url) { U.resizeImage(url, 160, function (small) { ED.updateClub(U.st, d.id, { crestImage: small }); var cc = U.st.clubs[d.id]; cc.crestManual = true; cc.crestSrc = null; if (R.crests) R.crests.libPut(cc); U.render(); U.toast('Wappenbild übernommen.'); U.autosave && U.autosave(); }); }, true); };
  U.acts.edCrestSet = function (d) { var f = { crestImage: null }; f[d.k] = +d.v; ED.updateClub(U.st, d.id, f); U.render(); U.autosave && U.autosave(); };
  U.acts.edCrestDel = function (d) { ED.updateClub(U.st, d.id, { crestImage: null }); var cc = U.st.clubs[d.id]; cc.crestManual = false; cc.crestSrc = null; if (R.crests) R.crests.libRemove(cc); U.render(); };
  U.acts.edClubExport = function (d) {
    var st = U.st, db = ED.exportDB(st);
    db.clubs = db.clubs.filter(function (c) { return c.id === d.id; }); db.players = db.players.filter(function (p) { return p.clubId === d.id; });
    R.save.exportFile('Anwurf_Verein_' + st.clubs[d.id].short.replace(/\W+/g, '') + '.json', JSON.stringify(db, null, 1));
  };
  U.acts.edPlayerClub = function (d, el) { U.go('editor', { tab: 'spieler', pc: el.value }); };
  U.acts.edNewPlayer = function () { var p = ED.createPlayer(U.st, U.p.pc != null ? U.p.pc : U.st.manager.clubId, { first: 'Neuer', last: 'Spieler', pos: 'RUE', ovr: 55, age: 22 }); U.render(); U.acts.edPlayer({ id: p.id }); };
  U.acts.edPlayer = function (d) {
    var st = U.st, p = st.players[d.id];
    var clubs = '<option value="">— vereinslos —</option>' + Object.keys(st.clubs).map(function (k) { return '<option value="' + k + '"' + (p.clubId === k ? ' selected' : '') + '>' + esc(st.clubs[k].name) + '</option>'; }).join('');
    var h = '<div class="grid g3">' + U.field('Vorname', '<input type="text" id="ep_first" value="' + esc(p.first) + '">') + U.field('Nachname', '<input type="text" id="ep_last" value="' + esc(p.last) + '">') + U.field('Geburtsjahr', '<input type="number" id="ep_birthYear" value="' + (st.season - p.age) + '">') +
      U.field('Position', '<select id="ep_pos">' + D.positions.map(function (x) { return '<option' + (x === p.pos ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select>') + U.field('Nebenpositionen (z. B. MIT STU)', '<input type="text" id="ep_alt" value="' + esc(p.alt.join(' ')) + '">') + U.field('Verein', '<select id="ep_clubId">' + clubs + '</select>') +
      U.field('Gesamtstärke (passt Attribute an)', '<input type="number" id="ep_ovr" value="' + p.ovr + '">') + U.field('Potenzial', '<input type="number" id="ep_pot" value="' + p.pot + '">') + U.field('Marktwert (€)', '<input type="number" id="ep_value" value="' + p.value + '">') +
      U.field('Gehalt (€/Jahr)', '<input type="number" id="ep_wage" value="' + p.wage + '">') + U.field('Vertragslaufzeit (Jahre)', '<input type="number" id="ep_contract" value="' + p.contract + '">') + '</div><h3 style="margin-top:12px">Attribute</h3><div class="grid g4">' +
      D.attrKeys.map(function (k) { return U.field(D.attrNames[k], '<input type="number" id="ea_' + k + '" value="' + Math.round(p.attr[k]) + '">'); }).join('') + '</div>';
    U.modal('Spieler bearbeiten', h, '<button class="danger" data-act="edPlayerDel" data-id="' + p.id + '">Löschen</button><button data-act="edPhoto" data-id="' + p.id + '">Foto importieren</button><button data-act="closeModal">Abbrechen</button><button class="primary" data-act="edPlayerSave" data-id="' + p.id + '">Speichern</button>', true);
  };
  U.acts.edPlayerSave = function (d) {
    var st = U.st, p = st.players[d.id], g = function (k) { return document.getElementById(k).value; };
    var attr = {}; D.attrKeys.forEach(function (k) { attr[k] = +g('ea_' + k); });
    var attrChanged = D.attrKeys.some(function (k) { return Math.round(p.attr[k]) !== attr[k]; });
    var f = { first: g('ep_first'), last: g('ep_last'), birthYear: g('ep_birthYear'), pos: g('ep_pos'), alt: g('ep_alt'), clubId: g('ep_clubId') || null, pot: +g('ep_pot'), wage: +g('ep_wage'), contract: +g('ep_contract') };
    if (attrChanged) f.attr = attr;
    var newOvr = +g('ep_ovr'); if (newOvr !== p.ovr && !attrChanged) f.ovrTarget = newOvr;
    var val = +g('ep_value'); if (val !== p.value) f.value = val;
    ED.updatePlayer(st, d.id, f);
    U.closeModal(); U.render(); U.toast('Spieler gespeichert.');
  };
  U.acts.edPlayerDel = function (d) { U.confirm('Spieler löschen', 'Diesen Spieler endgültig aus der Datenbank löschen?', function () { ED.deletePlayer(U.st, d.id); U.render(); }); };
  U.acts.edPhoto = function (d) { U.pickFile('image/*', function (url) { U.resizeImage(url, 160, function (small) { U.st.players[d.id].photo = small; U.toast('Foto gespeichert.'); }); }, true); };
  U.acts.dbExport = function () { R.save.exportFile('Anwurf_Datenbank_' + U.st.season + '.json', JSON.stringify(ED.exportDB(U.st))); };
  U.acts.dbImport = function () {
    U.pickFile('.json,application/json', function (text) {
      var db; try { db = JSON.parse(text); } catch (e) { U.modal('Import fehlgeschlagen', '<p>Keine gültige JSON-Datei.</p>'); return; }
      var errs = ED.validateDB(db);
      if (errs.length) { U.modal('Validierung fehlgeschlagen', '<p>Die Datenbank wurde nicht importiert:</p><ul>' + errs.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>'); return; }
      U.confirm('Datenbank importieren', db.clubs.length + ' Vereine und ' + db.players.length + ' Spieler übernehmen? Bestehende Einträge mit gleicher ID werden überschrieben.', function () { var r = ED.importDB(U.st, db); U.toast(r.ok ? r.players + ' Spieler importiert.' : 'Fehler'); U.render(); });
    });
  };
  U.acts.csvExport = function () { R.save.exportFile('Anwurf_Spieler_' + U.st.season + '.csv', '﻿' + ED.exportCSV(U.st), 'text/csv'); };
  U.acts.csvImport = function () {
    U.pickFile('.csv,text/csv,text/plain', function (text) {
      var r = ED.importCSV(U.st, text, U.st.manager.clubId);
      U.modal('CSV-Import', '<p>' + (r.players || 0) + ' Spieler importiert.</p>' + (r.errors && r.errors.length ? '<ul class="small warn">' + r.errors.slice(0, 10).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul>' : ''));
      U.render();
    });
  };
  // ---------- Echte Spielerdaten aktualisieren (CSV-Upload) ----------
  U.pickFiles = function (accept, cb) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept; inp.multiple = true;
    inp.onchange = function () {
      var list = Array.prototype.slice.call(inp.files || []), out = [], left = list.length; if (!left) return;
      list.forEach(function (f, i) { var rd = new FileReader(); rd.onload = function () { out[i] = { name: f.name, text: rd.result }; if (--left === 0) cb(out); }; rd.onerror = function () { if (--left === 0) cb(out.filter(Boolean)); }; rd.readAsText(f, 'utf-8'); });
    };
    inp.click();
  };
  function fmtStamp(s) { return s ? s.split('-').reverse().join('.') : '–'; }
  U.realDbPanel = function () {
    var DI = R.dbimport; if (!DI || !D.real) return '';
    var ov = DI.hasOverride();
    return '<div class="panel" style="margin-bottom:14px"><h2>🔄 Echte Spielerdaten aktualisieren</h2>' +
      '<p class="small">Aktuell: <b>' + D.real.clubs.length + ' Vereine, ' + R.fmtNum(D.real.players.length) + ' Spieler</b>, Datenstand <b>' + fmtStamp(D.real.stamp) + '</b> (' + esc(D.real.source) + ')' + (ov ? ' – <b>hochgeladene Daten</b>' : ' – mitgelieferte Daten') + '.</p>' +
      '<p class="muted small">Nach einem Transferfenster neue CSV-Dateien wählen: entweder <b>ANWURF-Spieler-CSV</b> (gern zusammen mit der Vereins-CSV, beide markieren) oder die <b>Original-EA-Datei players.csv</b> (daraus werden 1. Bundesliga, 2. Bundesliga und 3. Liga übernommen). Vor dem Übernehmen siehst du eine Vorschau mit allen Änderungen.</p>' +
      '<div class="row"><button class="primary" data-act="realDbPick">📂 CSV-Dateien wählen …</button>' + (ov ? '<button data-act="realDbReset">Mitgelieferte Daten wiederherstellen</button>' : '') + '</div></div>';
  };
  U.acts.realDbPick = function () {
    U.pickFiles('.csv,text/csv,text/plain', function (files) {
      U.realDbPending = R.dbimport.convert(files);
      U.showRealDbPreview(U.realDbPending, false);
    });
  };
  // res: Ergebnis von DI.convert; careerOnly: Daten sind schon gespeichert, nur die Karriere abgleichen
  U.showRealDbPreview = function (res, careerOnly) {
    var rp = res.report, st = U.st, h = '';
    if (!careerOnly) {
      h += '<p class="small">Erkannt: <b>' + esc(rp.format || '–') + '</b></p>';
      if (rp.errors.length) h += '<div class="help" style="border-color:#ef4444"><b>Nicht übernommen – bitte die Datei prüfen:</b><ul class="small">' + rp.errors.slice(0, 12).map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div>';
      if (res.ok) {
        var s = rp.stats;
        h += '<table class="t"><tr><td>Datenstand</td><td class="num"><b>' + fmtStamp(s.stamp) + '</b></td></tr><tr><td>Vereine</td><td class="num">' + s.clubs + ' (1. Liga ' + s.leagues[1] + ' · 2. Liga ' + s.leagues[2] + ' · 3. Liga ' + s.leagues[3] + ')</td></tr><tr><td>Spieler</td><td class="num">' + R.fmtNum(s.players) + '</td></tr></table>';
      }
      if (rp.warnings.length) h += '<ul class="small muted" style="margin-top:8px">' + rp.warnings.slice(0, 8).map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('') + (rp.warnings.length > 8 ? '<li>… und ' + (rp.warnings.length - 8) + ' weitere Hinweise</li>' : '') + '</ul>';
    }
    var footer = '<button data-act="closeModal">' + (res.ok ? 'Abbrechen' : 'Schließen') + '</button>';
    if (res.ok) {
      var real = st && st.world === 'real';
      if (real) {
        var d = R.dbimport.applyToCareer(st, res.db, true);
        h += '<h3 style="margin-top:12px">Änderungen in Ihrer laufenden Karriere</h3><table class="t"><tr><td>Stärke oder Position geändert</td><td class="num">' + d.updated + '</td></tr><tr><td>Vereinswechsel</td><td class="num">' + d.moved.length + '</td></tr><tr><td>Neue Spieler</td><td class="num">' + d.added + '</td></tr><tr><td>Verlassen die Liga (nicht mehr in den Daten)</td><td class="num">' + d.removed + '</td></tr><tr><td>Eigener Kader (bleibt unverändert)</td><td class="num">' + d.untouchedOwn + ' Spieler</td></tr></table>' +
          (d.moved.length ? '<div class="small muted" style="margin-top:6px">' + d.moved.slice(0, 12).map(function (m) { return esc(m.name) + ': ' + esc(m.from) + ' → ' + esc(m.to); }).join(' · ') + (d.moved.length > 12 ? ' · …' : '') + '</div>' : '') +
          (d.ownTargets ? '<p class="small muted">' + d.ownTargets + ' Spieler sind in Wirklichkeit zu Ihrem Verein gewechselt – sie bleiben bei ihrem bisherigen Verein und können auf dem Transfermarkt verpflichtet werden.</p>' : '') +
          (d.unknownClubs.length ? '<p class="small muted">Vereine, die es in Ihrer Karriere nicht gibt (ihre Spieler werden vertragslos): ' + esc(d.unknownClubs.join(', ')) + '</p>' : '');
        footer += (careerOnly ? '' : '<button data-act="realDbSaveOnly">Nur für neue Karrieren</button>') + '<button class="primary" data-act="realDbApply">' + (careerOnly ? 'In Karriere übernehmen' : 'Übernehmen (Karriere + neue Karrieren)') + '</button>';
      } else {
        h += '<p class="small muted" style="margin-top:10px">' + (st ? 'Ihre laufende Karriere spielt mit fiktiven Vereinen und bleibt unverändert. ' : '') + 'Die Daten gelten für jede <b>neue Karriere</b> auf diesem Gerät.</p>';
        footer += '<button class="primary" data-act="realDbSaveOnly">Für neue Karrieren speichern</button>';
      }
    }
    U.realDbPending = res;
    U.modal(careerOnly ? 'Neue Spielerdaten übernehmen' : 'Spielerdaten aktualisieren', h, footer, true);
  };
  U.acts.realDbSaveOnly = function () {
    var res = U.realDbPending; if (!res || !res.ok) return;
    var stored = R.dbimport.saveOverride(res.db);
    U.closeModal(); U.render();
    U.toast(stored ? 'Neue Spielerdaten gespeichert – sie gelten für neue Karrieren.' : 'Daten übernommen, konnten aber nicht dauerhaft gespeichert werden (nur bis zum Neustart).');
  };
  U.acts.realDbApply = function () {
    var res = U.realDbPending; if (!res || !res.ok) return;
    if (res.db !== D.real) R.dbimport.saveOverride(res.db);
    var rp = R.dbimport.applyToCareer(U.st, res.db, false);
    U.closeModal(); if (U.autosave) U.autosave(); U.render();
    U.toast('Spielerdaten übernommen: ' + rp.moved.length + ' Wechsel, ' + rp.added + ' neue Spieler, ' + rp.updated + ' Stärken angepasst.');
  };
  U.acts.realDbCareer = function () {
    U.showRealDbPreview({ ok: true, db: D.real, report: { format: '', errors: [], warnings: [], stats: {} } }, true);
  };
  U.acts.realDbLater = function () { U.realDbLater = true; U.render(); };
  U.acts.realDbReset = function () {
    U.confirm('Mitgelieferte Daten wiederherstellen', 'Die hochgeladenen Spielerdaten auf diesem Gerät verwerfen? Neue Karrieren starten dann wieder mit den mitgelieferten Daten. Laufende Karrieren bleiben unverändert.', function () { R.dbimport.clearOverride(); U.render(); U.toast('Mitgelieferte Daten werden wieder verwendet.'); });
  };

  // ---------- Original-Vereinswappen (OpenLigaDB) ----------
  var CREST_STATUS = {
    id: ['green', 'Team-ID'], exakt: ['green', 'exakt'], alias: ['green', 'Alias'], normalisiert: ['green', 'Name normalisiert'],
    vorschlag: ['yellow', 'Vorschlag – bitte bestätigen'], mehrdeutig: ['yellow', 'mehrdeutig – bitte wählen'], liga: ['yellow', 'Liga weicht ab – bitte bestätigen'], fehlt: ['red', 'kein passender Verein']
  };
  function crestState(c) {
    if (c.crestImage && c.crestSrc) return ['green', 'Original (' + esc(c.crestSrc.license || c.crestSrc.provider) + ')'];
    if (c.crestImage) return ['yellow', 'eigenes Bild'];
    if (c.oldbId) return ['', 'zugeordnet, neutrales Wappen'];
    return ['', 'neutrales Wappen'];
  }
  U.crestPanel = function () {
    var st = U.st, clubs = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).sort(function (a, b) { return a.league - b.league || a.name.localeCompare(b.name, 'de'); });
    var cnt = { 1: 0, 2: 0, 3: 0 }, withImg = 0, orig = 0, ids = 0;
    clubs.forEach(function (c) { cnt[c.league]++; if (c.crestImage) withImg++; if (c.crestSrc) orig++; if (c.oldbId) ids++; });
    var nLogo = clubs.filter(function (c) { return c.logoUrl; }).length;
    var h = '<div class="panel" style="margin-bottom:14px"><h2>🛡️ Vereinslogos</h2>' +
      '<p class="small">Die ' + nLogo + ' Vereine der Bundesliga und 2. Bundesliga zeigen ihre <b>Original-Logos</b>. Sie werden beim Anzeigen von der HBL-Bilddatenbank geladen; ohne Internet erscheint das im Spiel erzeugte Wappen. Für die Vereine der 3. Liga können Sie unten mit „🖼️ Bild“ ein eigenes Logo hochladen. Es wird im Spielstand gespeichert und funktioniert offline. Unter Einstellungen lassen sich die Original-Logos abschalten.</p>' +
      '<p class="muted small">Rechte: Vereinswappen sind Marken der Vereine. Frei lizenzierte Dateien (Wikimedia Commons) werden vorausgewählt; Wappen mit unklarer oder nicht freier Lizenz nur, wenn Sie bestätigen, dass Sie sie ausschließlich privat in Ihrem Spiel nutzen. Alle anderen behalten das neutrale, im Spiel erzeugte Wappen. Wappen werden nie in die veröffentlichte Web-App eingebaut.</p>' +
      '<div class="row"><span class="muted small">' + clubs.length + ' Vereine (Bundesliga ' + cnt[1] + ' · 2. Bundesliga ' + cnt[2] + ' · 3. Liga ' + cnt[3] + ') · ' + nLogo + ' Original-Logos · ' + withImg + ' eigene Bilder</span></div></div>';
    h += '<div class="panel tight"><table class="t"><tr><th></th><th>Verein</th><th>Liga</th><th>OpenLigaDB</th><th>Wappen</th><th></th></tr>' + clubs.map(function (c) {
      var s = crestState(c);
      return '<tr><td>' + U.crest(c, 30) + '</td><td>' + esc(c.name) + '</td><td>' + c.league + '</td><td class="small">' + (c.oldbId ? 'ID ' + c.oldbId : '<span class="muted">–</span>') + '</td><td><span class="tag ' + s[0] + '">' + s[1] + '</span></td>' +
        '<td style="white-space:nowrap"><button class="sm" data-act="edCrestImg" data-id="' + c.id + '" title="Eigenes Wappenbild hochladen">🖼️ Bild</button>' + (c.crestImage ? ' <button class="sm" data-act="edCrestDel" data-id="' + c.id + '" title="Neutrales Wappen verwenden">✕</button>' : '') + '</td></tr>';
    }).join('') + '</table></div>';
    return h;
  };
  function crestProgress(text) { var el = document.getElementById('crestProg'); if (el) el.textContent = text; }
  U.acts.crestAuto = function () {
    var st = U.st, CR = R.crests;
    U.modal('Original-Vereinswappen', '<p id="crestProg">Lade Vereinslisten von OpenLigaDB …</p>', '<button data-act="closeModal">Abbrechen</button>');
    CR.fetchTeams(st.season).then(function (res) {
      var total = res.teams[1].length + res.teams[2].length + res.teams[3].length;
      if (!total) { U.modal('Keine Verbindung', '<p>Die Vereinslisten konnten nicht geladen werden:</p><ul class="small">' + res.errors.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul><p class="small">Ihre Wappen bleiben unverändert. Sie können Wappen jederzeit einzeln über „🖼️ Bild“ importieren.</p>'); return; }
      var m = CR.match(st, res.teams);
      m.errors = res.errors; m.privateOk = false;
      crestProgress('Lade und prüfe Wappen … 0/' + m.rows.filter(function (r) { return r.team; }).length);
      CR.loadAll(m.rows, function (d, n) { crestProgress('Lade und prüfe Wappen … ' + d + '/' + n); }).then(function () {
        m.rows.forEach(function (r) { r.sel = U.crestDefaultSel(r, false); });
        U.crestPrev = m; U.showCrestPreview();
      });
    });
  };
  U.crestDefaultSel = function (r, privateOk) {
    return !!(r.team && r.img && !r.needsConfirm && (r.license && r.license.free || privateOk) && !R.crests.hasManual(r.club));
  };
  U.showCrestPreview = function () {
    var m = U.crestPrev, CR = R.crests, dup = CR.duplicates(m.rows.filter(function (r) { return r.sel; }));
    var cnt = m.counts, ok = cnt[1] === 18 && cnt[2] === 18 && cnt[3] === 20;
    var h = '<p class="small">OpenLigaDB: 1. Bundesliga <b>' + cnt[1] + '</b> · 2. Bundesliga <b>' + cnt[2] + '</b> · 3. Liga <b>' + cnt[3] + '</b> Vereine' + (ok ? ' ✔' : ' <span class="neg">(erwartet 18 / 18 / 20)</span>') + '</p>' +
      (m.errors.length ? '<p class="small neg">Teilweise nicht geladen: ' + m.errors.map(esc).join(' · ') + '</p>' : '') +
      (dup.length ? '<p class="small neg">Doppelt vergeben: ' + dup.map(esc).join(' · ') + '</p>' : '') +
      '<label class="row small" style="gap:8px;margin:6px 0 10px"><input type="checkbox" data-chg="crestPrivate"' + (m.privateOk ? ' checked' : '') + '> Ich nutze die Wappen ausschließlich privat in meinem Spiel – auch Wappen mit unklarer oder nicht freier Lizenz übernehmen</label>' +
      '<div class="scroll" style="max-height:52vh"><table class="t"><tr><th>✓</th><th>Neu</th><th>Bisher</th><th>Verein</th><th>L</th><th>OpenLigaDB</th><th>Zuordnung</th><th>Lizenz / Bild</th></tr>' + m.rows.map(function (r, i) {
        var c = r.club, s = CREST_STATUS[r.status] || ['', r.status];
        var cand = r.candidates && r.candidates.length && r.needsConfirm ? '<select class="sm" data-chg="crestCand" data-i="' + i + '"><option value="">– wählen –</option>' + r.candidates.map(function (t) { return '<option value="' + t.teamId + '"' + (r.team && r.team.teamId === t.teamId ? ' selected' : '') + '>' + esc(t.teamName) + '</option>'; }).join('') + '</select>' : '';
        var img = r.img ? '<img src="' + r.img + '" style="width:30px;height:30px;object-fit:contain">' : '<span class="muted">–</span>';
        var lic = r.team ? (r.imgError ? '<span class="neg">✘ ' + esc(r.imgError) + '</span>' : '<span class="' + (r.license.free ? 'pos' : 'warn') + '">' + esc(r.license.label) + '</span>') : '';
        return '<tr><td><input type="checkbox" data-chg="crestSel" data-i="' + i + '"' + (r.sel ? ' checked' : '') + (r.team && r.img ? '' : ' disabled') + '></td><td>' + img + '</td><td>' + U.crest(c, 30) + (CR.hasManual(c) ? '<div class="small warn">eigenes</div>' : '') + '</td><td>' + esc(c.name) + '</td><td>' + c.league + '</td>' +
          '<td class="small">' + (r.team ? esc(r.team.teamName) + ' <span class="muted">(' + r.team.teamId + (r.apiLeague && r.apiLeague !== c.league ? ', Liga ' + r.apiLeague : '') + ')</span>' : '') + cand + '</td><td><span class="tag ' + s[0] + '">' + s[1] + '</span></td><td class="small">' + lic + '</td></tr>';
      }).join('') + '</table></div>' +
      '<p class="muted small" style="margin-top:8px">Vorausgewählt sind sichere Zuordnungen mit gültigem Bild und freier Lizenz. Vorschläge und mehrdeutige Treffer übernehmen Sie, indem Sie den Verein wählen und das Häkchen setzen. Eigene Wappen werden nur ersetzt, wenn Sie sie ausdrücklich anhaken. Nicht übernommene Vereine behalten ihr bisheriges bzw. das neutrale Wappen.</p>';
    var n = m.rows.filter(function (r) { return r.sel; }).length;
    U.modal('Vorschau: Vereinswappen zuordnen', h, '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="crestApply"' + (dup.length ? ' disabled' : '') + '>' + n + ' Wappen übernehmen</button>', true);
  };
  U.acts.crestPrivate = function (d, el) { var m = U.crestPrev; m.privateOk = el.checked; m.rows.forEach(function (r) { r.sel = U.crestDefaultSel(r, m.privateOk); }); U.showCrestPreview(); };
  U.acts.crestSel = function (d, el) { var r = U.crestPrev.rows[+d.i]; r.sel = el.checked; if (el.checked && r.needsConfirm) r.confirmed = true; U.showCrestPreview(); };
  U.acts.crestCand = function (d, el) {
    var r = U.crestPrev.rows[+d.i], t = r.candidates.filter(function (x) { return String(x.teamId) === el.value; })[0];
    r.team = t || null; r.img = null; r.imgError = null; r.sel = false; r.license = t ? R.crests.license(t.teamIconUrl) : null;
    if (!t) { U.showCrestPreview(); return; }
    R.crests.loadImage(t.teamIconUrl).then(function (img) { r.img = img; }, function (e) { r.imgError = e.message; }).then(function () { U.showCrestPreview(); });
  };
  U.acts.crestApply = function () {
    var st = U.st, m = U.crestPrev, CR = R.crests, applied = 0, idsOnly = 0, placeholder = 0, failed = [], open = [];
    m.rows.forEach(function (r) {
      if (r.sel && r.team && r.img) { CR.applyRow(st, r); applied++; return; }
      // Sichere Zuordnung ohne Bildübernahme: Team-ID trotzdem dauerhaft speichern
      if (r.team && !r.needsConfirm) { st.clubs[r.clubId].oldbId = r.team.teamId; CR.libPut(st.clubs[r.clubId]); idsOnly++; }
      if (r.team && r.imgError) failed.push(r.club.short);
      else if (r.needsConfirm && !r.sel) open.push(r.club.short);
      else if (r.team && r.img && !r.sel && !CR.hasManual(r.club)) placeholder++;
    });
    U.crestPrev = null; if (U.autosave) U.autosave();
    U.go('editor', { tab: 'wappen' });
    U.modal('Wappen gespeichert', '<table class="t"><tr><td>Originalwappen übernommen</td><td class="num"><b>' + applied + '</b></td></tr><tr><td>Neutrales Wappen behalten (Lizenz nicht bestätigt oder abgewählt)</td><td class="num">' + placeholder + '</td></tr><tr><td>Bild fehlerhaft – bitte manuell importieren</td><td class="num">' + failed.length + '</td></tr><tr><td>Offen (Bestätigung fehlt)</td><td class="num">' + open.length + '</td></tr></table>' +
      (failed.length ? '<p class="small">Fehlerhaft: ' + failed.map(esc).join(', ') + '</p>' : '') + (open.length ? '<p class="small">Offen: ' + open.map(esc).join(', ') + '</p>' : '') +
      '<p class="muted small">Die OpenLigaDB-Team-IDs sind bei den Vereinen gespeichert. Die Wappen gelten auch für neue Karrieren auf diesem Gerät. Die Übersicht unten zeigt alle Vereine; einzelne Wappen können Sie mit „🖼️ Bild“ ersetzen oder mit „✕“ entfernen.</p>');
  };

  // OCR
  U.acts.ocrPick = function () {
    U.pickFile('image/*', function (url) {
      U.ocrState = { status: 'Texterkennung läuft …' }; U.render();
      R.save.ocr(url).then(function (text) {
        var rows = [];
        try { rows = R.ocr.parseText(text); } catch (e) { rows = []; }
        U.ocrState = { rows: rows, raw: text, status: rows.length ? rows.length + ' Zeilen erkannt – bitte prüfen.' : 'Keine Spielerdaten erkannt. Bitte manuell eingeben.' };
        if (!rows.length) U.ocrState.rows = [U.emptyRow()];
        U.render();
      }).catch(function (e) { U.ocrState = { status: (e && e.message) || 'Texterkennung fehlgeschlagen', rows: [U.emptyRow()] }; U.render(); });
    }, true);
  };
  U.emptyRow = function () { return { first: '', last: '', pos: 'RUE', ovr: 55, age: 24, unsure: ['Manuell'], include: true }; };
  U.acts.ocrManual = function () { U.ocrState = { rows: [U.emptyRow()], status: 'Manuelle Eingabe' }; U.render(); };
  U.acts.ocrAddRow = function () { U.ocrState.rows.push(U.emptyRow()); U.render(); };
  U.acts.ocrEdit = function (d, el) { var r = U.ocrState.rows[+d.i]; r[d.k] = el.type === 'number' ? +el.value : el.value; };
  U.acts.ocrInc = function (d, el) { U.ocrState.rows[+d.i].include = el.checked; };
  U.acts.ocrPos = function (d, el) { U.ocrState.rows[+d.i].pos = el.value; };
  U.acts.ocrImport = function () {
    var club = document.getElementById('ocrClub').value, n = 0;
    U.ocrState.rows.forEach(function (r) { if (!r.include || !String(r.last).trim()) return; ED.createPlayer(U.st, club, { first: r.first, last: r.last, pos: r.pos, ovr: R.clamp(+r.ovr || 55, 1, 99), age: R.clamp(+r.age || 24, 15, 45), imported: true }); n++; });
    U.ocrState = { status: n + ' Spieler importiert.' }; U.render(); U.toast(n + ' Spieler importiert.');
  };

  // ---------- Einstellungen ----------
  U.screens.einstellungen = function () {
    var st = U.st, s = st.settings;
    R.save.storageInfo().then(function (i) { var el = document.getElementById('storeInfo2'); if (el) el.textContent = i.path || ''; });
    return '<h1>Einstellungen</h1><div class="grid g2"><div class="panel"><h2>Spiel</h2><table class="t"><tr><td>Standard-Spielgeschwindigkeit</td><td><div class="seg">' + [['normal', 'Normal'], ['schnell', 'Schnell'], ['sofort', 'Sofort']].map(function (x) { return '<button class="sm ' + (s.matchSpeed === x[0] ? 'on' : '') + '" data-act="setSpeed2" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></td></tr>' +
      '<tr><td>Retro-Soundeffekte</td><td><input type="checkbox" data-chg="setOpt" data-k="sound"' + (s.sound ? ' checked' : '') + '></td></tr>' +
      '<tr><td>Original-Vereinslogos anzeigen <span class="muted small">(werden aus dem Netz geladen)</span></td><td><input type="checkbox" data-chg="setOptInv" data-k="noLogos"' + (s.noLogos ? '' : ' checked') + '></td></tr>' +
      (U.cheatDiscovered(st) ? '<tr><td>Bankdirektor-Cheat aktiv</td><td><input type="checkbox" data-chg="setOpt" data-k="cheatEnabled"' + (s.cheatEnabled ? ' checked' : '') + '></td></tr>' : '') +
      '<tr><td>Schwierigkeitsgrad</td><td>' + W.diffSettings[s.difficulty].name + '</td></tr>' + (U.cheatDiscovered(st) ? '<tr><td>Spielstand mit Cheat</td><td>' + (st.cheatUsed ? '<span class="cheat-tag">JA</span> (' + money(st.cheatTotal || 0) + ')' : 'nein') + '</td></tr>' : '') + '</table></div>' +
      '<div class="panel"><h2>Speichern & Synchronisieren</h2><p class="small" id="storeInfo2"></p><div class="grid"><button data-act="saveQuick">Manuell speichern …</button><button data-act="exportSave">Spielstand exportieren</button><button data-act="importSave">Spielstand importieren</button></div><p class="muted small">Tipp: In der Mac-App liegen alle Spielstände im iCloud-Ordner „Spielstände“ – so können Sie abwechselnd auf MacBook und iMac spielen. Bitte das Spiel nicht gleichzeitig auf beiden Geräten geöffnet haben.</p></div></div>' +
      '<div class="panel" style="margin-top:14px"><h2>Kurzanleitung</h2><p class="small">1. <b>NÄCHSTER SPIELTAG</b> spielt die nächste Runde. 2. <b>Mannschaft</b>: Aufstellung per Klick oder Ziehen. 3. <b>Transfermarkt</b>: Filtern, Spieler anklicken, Angebot abgeben. 4. <b>Halle / Vereinsstadt</b>: Ausbauen mit Wirtschaftlichkeitsrechnung. 5. <b>Bank</b>: Kredite, Tagesgeld, Aktien &amp; Krypto. ⏩ <b>Auto</b> spielt mehrere Spieltage am Stück. Leertaste pausiert das Live-Spiel.</p></div>';
  };
  U.acts.setSpeed2 = function (d) { U.st.settings.matchSpeed = d.v; U.render(); };
  U.acts.setOpt = function (d, el) { U.st.settings[d.k] = el.checked; U.render(); };
  U.acts.setOptInv = function (d, el) { U.st.settings[d.k] = !el.checked; U.render(); };
})(RFM);
