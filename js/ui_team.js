// ANWURF! – Oberfläche: Zentrale, Mannschaft, Spieler, Training, Nachwuchs, Medizin, Transfermarkt
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, M = R.match, T = R.transfers, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;

  // ---------- Zentrale ----------
  U.screens.zentrale = function () {
    var st = U.st, c = U.club(); if (!c) return U.screens.karriere();
    var mg = st.manager, pos = E.leaguePos(st, c), t = S.table(st, W.lk(c)), row = t.filter(function (r) { return r.id === c.id; })[0];
    var avgAtt = c.attendanceHist.length ? R.avg(c.attendanceHist) : 0, cap = E.capacity(c);
    var trustF = Math.round(c.fanTrust != null ? c.fanTrust : 60), util = avgAtt ? Math.round(avgAtt / cap * 100) : 0;
    var posHist = U.hist(c, 'pos', 34), cashHist = U.hist(c, 'cash', 34);
    var h = '<h1>Zentrale</h1><div class="grid g4 kpi-row" style="margin-bottom:14px">' +
      U.ikpi('trophy', 'Tabellenplatz', st.week ? pos + '. <span class="small muted">(' + row.pts + ' Pkt.)</span>' : '–', '', U.lineChart(posHist, { h: 44, color: '#f5c542', invert: true, min: 1, max: t.length, empty: 'Verlauf ab dem 2. Spieltag' })) +
      U.ikpi('coins', 'Kontostand', money(c.cash), U.moneyCls(c.cash), '<div class="row" style="gap:8px;flex-wrap:nowrap;align-items:flex-end">' + U.moneyArt(c.cash, 76, 44) + '<div style="flex:1;min-width:0">' + U.lineChart(cashHist, { h: 44, color: c.cash < 0 ? '#ef4444' : '#22c55e', empty: '–' }) + '</div></div>') +
      U.ikpi('fans', 'Fanbasis', R.fmtNum(c.fans), '', '<div class="row between small muted"><span>Fanvertrauen</span><b class="mono" style="color:var(--text)">' + trustF + '</b></div>' + U.bar(trustF, 100, trustF < 35 ? '#ef4444' : trustF < 60 ? '#f5b301' : '#22c55e')) +
      U.ikpi('stadium', 'Ø Zuschauer', avgAtt ? R.fmtNum(avgAtt) : '–', '', '<div class="row between small muted"><span>Auslastung</span><b class="mono" style="color:var(--text)">' + (avgAtt ? util + ' %' : '–') + '</b></div>' + U.fillBar(util, util > 90 ? '#22c55e' : util > 60 ? '#f5b301' : '#ef4444')) + '</div>';
    if (R.dbimport && R.dbimport.careerOutdated(st) && !U.realDbLater) h += '<div class="help" style="margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span>🔄 <b>Neue Spielerdaten verfügbar</b> (Stand ' + esc(D.real.stamp.split('-').reverse().join('.')) + '): Wechsel, neue Spieler und aktuelle Stärken. Ihr eigener Kader bleibt unverändert.</span><span class="tb-spacer"></span><button class="primary sm" data-act="realDbCareer">Ansehen &amp; übernehmen</button><button class="sm" data-act="realDbLater">Später</button></div>';
    h += '<div class="grid g21"><div class="grid">';
    // Posteingang
    var inbox = st.inbox.filter(function (o) { return o.type === 'offer' || o.type === 'sponsor'; });
    if (st.deal && st.deal.club === c.id) h += '<div class="panel" style="border-color:var(--amber)"><div class="row between"><div><h2>📰 Eilmeldung: Großangebot</h2><div>' + esc(R.deals.type(st.deal.type).name) + ' – <b>' + money(st.deal.amount) + '</b> · Frist bis zum ' + st.deal.deadline + '. Spieltag</div></div><button class="primary" data-act="showDeal">Entscheiden</button></div></div>';
    if (inbox.length) {
      h += '<div class="panel"><h2>Posteingang (' + inbox.length + ')</h2>';
      inbox.forEach(function (o) {
        if (o.type === 'offer') {
          var p = st.players[o.pid], b = st.clubs[o.from]; if (!p || !b) return;
          h += '<div class="news-item row between"><div><div class="h">Angebot für ' + esc(W.playerName(p)) + ' (' + p.pos + ', ' + p.ovr + ')</div><div class="tx">' + esc(b.name) + ' bietet <b>' + money(o.amount) + '</b> (Marktwert ' + money(p.value) + ')</div></div>' +
            (U.can('business') || U.can('sport') ? '<div class="row"><button class="sm primary" data-act="offerAccept" data-id="' + o.id + '">Annehmen</button><button class="sm" data-act="offerCounter" data-id="' + o.id + '">+15 % fordern</button><button class="sm danger" data-act="offerDecline" data-id="' + o.id + '">Ablehnen</button></div>' : '') + '</div>';
        } else {
          h += '<div class="news-item row between"><div><div class="h">Sponsorenangebote: ' + D.sponsorCategories[o.cat] + '</div><div class="tx">' + o.offers.length + ' Angebote liegen vor.</div></div><button class="sm primary" data-act="nav" data-s="verein">Ansehen</button></div>';
        }
      });
      h += '</div>';
    }
    // Nächstes Spiel
    var prep = S.prepareWeek(st), nx = prep.list.filter(function (x) { return x.user; });
    h += '<div class="panel"><div class="panel-h"><h2>Nächstes Spiel</h2><button class="sm" data-act="nav" data-s="spieltag">Spieltagsvorbereitung</button></div>';
    if (nx.length) nx.forEach(function (fx) {
      var H = st.clubs[fx.h], A = st.clubs[fx.a];
      h += '<div class="row" style="justify-content:center;gap:18px;padding:8px 0"><div class="row" style="flex-direction:column;gap:4px;width:180px">' + U.crest(H, 54) + '<b>' + esc(H.name) + '</b><span class="muted small">' + (W.lk(H) === W.lk(c) ? E.leaguePos(st, H) + '. Platz' : D.leagueNames[W.lk(H)]) + '</span></div><div class="mono" style="font-size:22px;font-weight:900">VS</div><div class="row" style="flex-direction:column;gap:4px;width:180px">' + U.crest(A, 54) + '<b>' + esc(A.name) + '</b><span class="muted small">' + (W.lk(A) === W.lk(c) ? E.leaguePos(st, A) + '. Platz' : D.leagueNames[W.lk(A)]) + '</span></div></div><p class="muted small" style="text-align:center">' + S.fxLabel(st, fx) + (H.rivals.indexOf(A.id) >= 0 ? ' · <span class="warn">DERBY!</span>' : '') + '</p>';
    });
    else h += '<p class="muted">' + (st.phase === 'seasonEnd' ? 'Die Saison ist beendet.' : (S.isBreak(st) ? S.calText(st) + ' – diese Woche kein Spiel. ' + (U.can('business') ? '<a href="#" data-act="nav" data-s="training">Testspiel oder Trainingslager planen ›</a>' : '') : 'Diese Woche kein Spiel für Ihren Verein.')) + '</p>';
    h += '</div>';
    // Zeitung
    h += '<div class="panel"><h2>Handball-Zeitung</h2>' + st.news.slice(0, 12).map(function (n) {
      return '<div class="news-item"><div class="h">' + esc(n.title) + '</div>' + (n.text ? '<div class="tx">' + esc(n.text) + '</div>' : '') + '<div class="muted small">Saison ' + n.season + ' · ' + (n.week ? n.week + '. Spieltag' : 'Vorbereitung') + '</div></div>';
    }).join('') + '</div>';
    h += '</div><div class="grid">';
    // Stadion-Vorschau
    h += '<div class="panel tight thumb-panel" data-act="nav" data-s="stadion" title="Zur Halle">' + U.gfx.stadiumThumb(c) + '<div class="thumb-cap"><b>' + esc(c.stadiumName) + '</b><span>' + R.fmtNum(cap) + ' Plätze</span></div></div>';
    // Vorstand
    var trust = Math.round(mg.trust);
    h += '<div class="panel"><h2>Vorstand</h2><p>Saisonziel: <b>' + esc(mg.boardTarget ? mg.boardTarget.text : '–') + '</b></p>' +
      (mg.founder ? '<p class="muted small">Als Vereinsgründer können Sie nicht entlassen werden.</p>' : '<div class="row between small"><span>Vertrauen</span><span>' + trust + '%</span></div>' + U.bar(trust, 100, trust < 30 ? '#ef4444' : trust < 50 ? '#f5b301' : '#22c55e') + (mg.warnings ? '<p class="warn small">⚠️ Warnungen: ' + mg.warnings + '/2</p>' : '') + (!mg.canBeFired ? '<p class="muted small">Entlassungen sind deaktiviert.</p>' : '')) +
      (st.manager.role === 'trainer' ? '<p class="small">Transferbudget: <b>' + money(mg.transferBudget || 0) + '</b></p>' : '') + '</div>';
    // Tabelle
    h += '<div class="panel"><div class="panel-h"><h2>' + D.leagueNames[W.lk(c)] + '</h2><button class="sm" data-act="nav" data-s="liga">Alle Tabellen</button></div>' + U.miniTable(st, W.lk(c), c.id) + '</div>';
    // Baustellen
    if (c.construction.length) h += '<div class="panel"><h2>Baustellen</h2>' + c.construction.map(function (b) { return '<div class="small" style="margin-bottom:8px">' + esc(D.facilities[b.key].levels[b.to].n) + ' <span class="muted">(' + b.weeks + ' Wo.)</span>' + U.bar(b.total - b.weeks, b.total, '#f5b301') + '</div>'; }).join('') + '</div>';
    // Letzte Ergebnisse
    if (st.lastResults) {
      var mine = st.lastResults.filter(function (r) { return r.user; });
      if (mine.length) h += '<div class="panel"><h2>Letztes Spiel</h2>' + mine.map(function (r) { return '<div class="row between"><span>' + esc(st.clubs[r.h].short) + ' – ' + esc(st.clubs[r.a].short) + '</span><b class="mono">' + r.hg + ':' + r.ag + (r.pens ? ' n.7m' : '') + '</b></div>'; }).join('') + '<button class="sm" style="margin-top:8px" data-act="nav" data-s="bericht">Spielbericht</button></div>';
    }
    h += '</div></div>';
    return h;
  };
  U.miniTable = function (st, lvl, hl) {
    var t = S.table(st, lvl), idx = t.findIndex(function (r) { return r.id === hl; });
    var from = Math.max(0, Math.min(t.length - 8, idx - 3));
    return '<table class="t">' + t.slice(from, from + 8).map(function (r, i) {
      var c = st.clubs[r.id], n = from + i + 1;
      return '<tr class="' + (r.id === hl ? 'me' : '') + '"><td class="num">' + n + '</td><td>' + U.crest(c, 16) + ' ' + esc(c.short) + '</td><td class="num">' + r.p + '</td><td class="num">' + (r.gf - r.ga) + '</td><td class="num"><b>' + r.pts + '</b></td></tr>';
    }).join('') + '</table>';
  };
  U.acts.offerAccept = function (d) { var r = T.acceptOffer(U.st, d.id); if (!r.ok) U.toast(r.why || 'Nicht möglich'); else U.toast('Transfer abgeschlossen!'); U.render(); };
  U.acts.offerDecline = function (d) { U.st.inbox = U.st.inbox.filter(function (o) { return o.id !== d.id; }); U.render(); };
  U.acts.offerCounter = function (d) {
    var st = U.st, o = st.inbox.filter(function (x) { return x.id === d.id; })[0]; if (!o) return;
    var b = st.clubs[o.from], p = st.players[o.pid];
    var want = R.round(o.amount * 1.15, 5000);
    if (b.cash > want && R.chance(o.amount < p.value * 1.1 ? 0.65 : 0.35)) { o.amount = want; U.toast(b.short + ' akzeptiert die Forderung: ' + money(want)); }
    else { st.inbox = st.inbox.filter(function (x) { return x.id !== d.id; }); U.toast(b.short + ' zieht das Angebot zurück.'); }
    U.render();
  };

  // ---------- Mannschaft ----------
  U.screens.mannschaft = function () {
    var st = U.st, c = U.club(), tab = U.p.tab || 'aufstellung';
    var h = '<h1>Mannschaft</h1>' + U.roleNote('sport') + '<div class="seg" style="margin-bottom:14px">' + [['aufstellung', 'Aufstellung'], ['kader', 'Kader'], ['vertraege', 'Verträge']].map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="mannschaft" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'aufstellung') h += U.lineupView(c);
    if (tab === 'kader') h += '<div class="panel tight"><div class="scroll" style="max-height:none">' + U.squadTable(W.squad(st, c.id), 'kader') + '</div></div>';
    if (tab === 'vertraege') {
      var sq = W.squad(st, c.id).sort(function (a, b) { return a.contract - b.contract; });
      h += '<div class="help" style="margin-bottom:10px">Spieler mit auslaufendem Vertrag (0–1 Jahre) verlassen den Verein am Saisonende ablösefrei, wenn nicht verlängert wird.</div><div class="panel tight">' + U.table('vertr', [
        { k: 'last', l: 'Spieler', f: function (p) { return esc(W.playerName(p)); } }, { k: 'pos', l: 'Pos', f: function (p) { return U.posTag(p.pos); } }, { k: 'age', l: 'Alter', num: true },
        { k: 'ovr', l: 'Stärke', num: true, f: function (p) { return U.ovrBadge(p.ovr); } }, { k: 'wage', l: 'Gehalt/Jahr', num: true, f: function (p) { return money(p.wage); } },
        { k: 'contract', l: 'Vertrag', num: true, f: function (p) { return '<span class="' + (p.contract <= 1 ? 'warn' : '') + '">' + p.contract + ' J.</span>'; } },
        { k: 'x', l: '', nosort: true, f: function (p) { return '<button class="sm" data-act="renew" data-id="' + p.id + '">Verlängern</button>'; } }
      ], sq) + '</div>';
    }
    return h;
  };
  U.acts.tab = function (d) { U.go(d.s, Object.assign({}, U.p, { tab: d.tab })); };

  U.squadTable = function (players, id, opts) {
    opts = opts || {};
    var st = U.st;
    var cols = [
      { k: 'last', l: 'Name', v: function (p) { return p.last; }, f: function (p) { return (st.favs && st.favs[p.id] ? '★ ' : '') + esc(W.playerName(p)) + (p.homegrown ? ' <span title="Eigengewächs">🌱</span>' : '') + (p.loan ? ' <span class="tag">Leihe</span>' : '') + (p.trial ? ' <span class="tag" title="Nachwuchsspieler auf Probe">Probe</span>' : ''); } },
      { k: 'pos', l: 'Pos', f: function (p) { return U.posTag(p.pos) + (p.alt.length ? ' <span class="muted small">' + p.alt.join('/') + '</span>' : ''); } },
      { k: 'age', l: 'Alter', num: true }, { k: 'ovr', l: 'Stärke', num: true, f: function (p) { return U.ovrBadge(p.ovr); } },
      { k: 'pot', l: 'Pot.', num: true, f: function (p) { return U.potText(p); } }
    ];
    if (opts.club) cols.push({ k: 'club', l: 'Verein', v: function (p) { return p.clubId ? st.clubs[p.clubId].short : 'zzz'; }, f: function (p) { return p.clubId ? U.crest(st.clubs[p.clubId], 16) + ' ' + esc(st.clubs[p.clubId].short) + ' <span class="muted small">L' + st.clubs[p.clubId].league + '</span>' : '<span class="tag green">vereinslos</span>'; } });
    if (!opts.market) cols.push({ k: 'form', l: 'Form', num: true, f: function (p) { return p.form.toFixed(1); } }, { k: 'fitness', l: 'Fitness', v: function (p) { return p.fitness; }, f: function (p) { return U.bar(p.fitness, 100, p.fitness < 70 ? '#f5b301' : null); } }, { k: 'morale', l: 'Moral', num: true, f: function (p) { return Math.round(p.morale); } });
    cols.push({ k: 'value', l: 'Marktwert', num: true, f: function (p) { return money(p.value); } }, { k: 'wage', l: 'Gehalt', num: true, f: function (p) { return money(p.wage); } }, { k: 'contract', l: 'Vertr.', num: true });
    if (!opts.market) cols.push({ k: 'goals', l: 'Tore', num: true, v: function (p) { return p.stats.goals; }, f: function (p) { return p.stats.goals; } }, { k: 'apps', l: 'Sp.', num: true, v: function (p) { return p.stats.apps; }, f: function (p) { return p.stats.apps; } });
    cols.push({ k: 'status', l: 'Status', v: function (p) { return (p.inj ? 2 : 0) + (p.susp ? 1 : 0); }, f: function (p) { return U.statusTags(p); } });
    return U.table(id, cols, players, { click: 'playerInfo', sort: { k: 'ovr', d: -1 } });
  };
  U.potText = function (p) {
    var c = U.club(), sc = c ? c.budgets.scouting : 1;
    if (p.clubId === (c && c.id) || sc === 2) return p.pot;
    var spread = sc === 0 ? 8 : 4, lo = Math.max(p.ovr, p.pot - spread), hi = Math.min(99, p.pot + spread);
    return '<span class="muted">' + Math.round((lo + p.pot) / 2) + '–' + Math.round((hi + p.pot) / 2) + '</span>';
  };
  U.statusTags = function (p) {
    var t = '';
    if (p.inj) t += '<span class="tag red" title="' + esc(p.inj.type) + '">✚ ' + p.inj.weeks + ' Wo.</span> ';
    if (p.susp > 0) t += '<span class="tag red">Gesperrt ' + p.susp + '</span> ';
    if (p.listed) t += '<span class="tag amber">Transferliste</span> ';
    if (p.yellow >= 4) t += '<span class="tag amber">4 Gelbe</span>';
    return t;
  };

  // Aufstellung mit Spielfeld, Klick-Tausch und Drag-and-drop
  U.lineupView = function (c) {
    var st = U.st, can = U.can('sport');
    if (!D.formations[c.tactic.formation]) c.tactic.formation = '6:0';
    if (!c.lineup || c.lineup.length !== D.formations[c.tactic.formation].length || !c.manualLineup) M.autoBest(st, c); else M.validateLineup(st, c);
    var slots = D.formations[c.tactic.formation], sel = U.lsel || {};
    var styleHelp = ['Kompakt stehen, wenig Risiko – weniger Tore auf beiden Seiten.', 'Ausgewogenes Spiel zwischen Angriff und Abwehr.', 'Mehr Druck nach vorne, etwas anfälliger hinten.', 'Alles nach vorne! Viele Chancen – aber hinten offen wie ein Scheunentor.'];
    var h = '<div class="panel" style="margin-bottom:14px"><div class="grid g2"><div><h2>Abwehrsystem</h2><div class="seg" style="flex-wrap:wrap">' + Object.keys(D.formations).map(function (f) { return '<button class="' + (f === c.tactic.formation ? 'on' : '') + '" data-act="setFormation" data-v="' + f + '"' + (can ? '' : ' disabled') + '>' + f + '</button>'; }).join('') + '</div><p class="muted small" style="margin:6px 0 0">' + esc((D.formationInfo[c.tactic.formation] || {}).d || '') + '</p></div>' +
      '<div><h2>Spielstil</h2><div class="seg" style="flex-wrap:wrap">' + M.STYLE.map(function (l, i) { return '<button class="' + (c.tactic.style === i ? 'on' : '') + '" data-act="clubTactic" data-k="style" data-v="' + i + '"' + (can ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div><p class="muted small" style="margin:6px 0 0">' + styleHelp[c.tactic.style] + '</p></div></div></div>';
    h += '<div class="grid g12"><div class="panel"><div class="panel-h"><h2>Aufstellung · ' + c.tactic.formation + '</h2><span class="muted small">' + M.STYLE[c.tactic.style] + '</span></div>';
    // Handballfeld: oben der gegnerische Torraum (Angriffsaufstellung), unten das eigene Tor
    h += '<div class="pitch court" id="pitchArea"><div class="line zone" style="left:27%;width:46%;top:-17%;height:34%;border-radius:50%"></div><div class="line" style="left:14%;width:72%;top:-27%;height:54%;border-radius:50%;border-style:dashed"></div><div class="line goal" style="left:43%;width:14%;top:0;height:1.6%"></div><div class="line" style="left:0;right:0;top:72%;height:0"></div><div class="line zone" style="left:35%;width:30%;bottom:-9%;height:18%;border-radius:50%"></div><div class="line goal" style="left:45%;width:10%;bottom:0;height:1.4%"></div>';
    slots.forEach(function (s, i) {
      var p = st.players[c.lineup[i]];
      var x = 6 + s[1] * 0.88, y = 94 - s[2] * 0.86;
      var rr = p ? Math.round(W.roleRating(p, s[0])) : 0;
      var warn = p && p.pos !== s[0] && p.alt.indexOf(s[0]) < 0;
      h += '<div class="token ' + (p ? '' : 'empty ') + (sel.slot === i ? 'sel ' : '') + (warn ? 'warn' : '') + '" style="left:' + x + '%;top:' + y + '%" data-act="lineSlot" data-i="' + i + '" data-drag="slot:' + i + '" data-drop="slot:' + i + '"><div class="dot" style="background:' + c.colors[0] + ';color:' + c.colors[1] + '">' + (p ? rr : s[0]) + '</div><div class="nm">' + (p ? esc(p.last) + (c.captain === p.id ? ' (C)' : '') : s[0]) + '</div></div>';
    });
    h += '</div><div class="row" style="margin-top:10px">' + (can ? '<button class="primary" data-act="autoLineup">⚡ Automatische beste Sieben</button>' : '') + '<label class="row small"><input type="checkbox" data-chg="manualToggle"' + (c.manualLineup ? '' : ' checked') + (can ? '' : ' disabled') + '> Aufstellung vor jedem Spiel automatisch</label></div><p class="muted small">Klicken Sie zwei Spieler nacheinander an (oder ziehen Sie sie), um sie zu tauschen. Rote Umrandung = Spieler auf fremder Position. Im Spiel wird fliegend gewechselt: Die Ersatzbank (bis zu 9 Spieler, 16 im Spieltagskader) kommt laufend zum Einsatz.</p></div>';
    // Bank & Reserve
    var squad = W.squad(st, c.id), inXI = {}, onBench = {};
    c.lineup.forEach(function (id) { inXI[id] = 1; }); c.bench.forEach(function (id) { onBench[id] = 1; });
    function prow(p, zone) {
      return '<tr class="click ' + (sel.pid === p.id ? 'sel' : '') + '" data-act="linePid" data-id="' + p.id + '" data-drag="pid:' + p.id + '" data-drop="pid:' + p.id + '"><td>' + U.posTag(p.pos) + '</td><td>' + esc(W.playerName(p)) + (p.trial ? ' <span class="tag" title="Nachwuchsspieler auf Probe">Probe</span>' : '') + '</td><td class="num">' + U.ovrBadge(p.ovr) + '</td><td>' + U.bar(p.fitness, 100, p.fitness < 70 ? '#f5b301' : null) + '</td><td>' + U.statusTags(p) + '</td></tr>';
    }
    h += '<div class="grid"><div class="panel"><h2>Ersatzbank</h2><table class="t">' + c.bench.map(function (id) { return st.players[id] ? prow(st.players[id]) : ''; }).join('') + '</table></div>';
    h += '<div class="panel"><h2>Nicht im Kader</h2><table class="t">' + squad.filter(function (p) { return !inXI[p.id] && !onBench[p.id]; }).sort(function (a, b) { return b.ovr - a.ovr; }).map(function (p) { return prow(p); }).join('') + '</table></div>';
    var xi = c.lineup.map(function (id) { return st.players[id]; }).filter(Boolean);
    function sp(key, label) { return U.field(label, '<select data-chg="setPiece" data-k="' + key + '"' + (can ? '' : ' disabled') + '>' + xi.map(function (p) { return '<option value="' + p.id + '"' + (c[key] === p.id ? ' selected' : '') + '>' + esc(W.playerName(p)) + '</option>'; }).join('') + '</select>'); }
    h += '<div class="panel"><h2>Rollen & Taktik</h2><div class="grid g2">' + sp('captain', 'Kapitän') + sp('pen', '7-Meter-Werfer') + sp('fk', 'Freiwurf-Spezialist') + sp('corner', 'Spielmacher') + '</div>' + U.tacticControls(c.tactic, 'clubTactic', can) + '</div></div></div>';
    U.after = U.bindDrag;
    return h;
  };
  U.tacticControls = function (t, act, can) {
    function seg(key, labels) { return '<div style="margin-top:10px"><div class="muted small">' + { style: 'Spielweise', pressing: 'Abwehrverhalten', tempo: 'Tempo' }[key] + '</div><div class="seg">' + labels.map(function (l, i) { return '<button class="' + (t[key] === i ? 'on' : '') + '" data-act="' + act + '" data-k="' + key + '" data-v="' + i + '"' + (can ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div></div>'; }
    return seg('style', M.STYLE) + seg('pressing', M.PRESS) + seg('tempo', M.TEMPO);
  };
  U.acts.clubTactic = function (d) { if (!U.can('sport')) return; U.club().tactic[d.k] = +d.v; U.render(); };
  U.acts.setFormation = function (d) { if (!U.can('sport')) return; var c = U.club(); c.tactic.formation = d.v; if (!c.manualLineup) M.autoBest(U.st, c); U.render(); };
  U.acts.formation = function (d, el) { var c = U.club(); c.tactic.formation = el.value; if (!c.manualLineup) M.autoBest(U.st, c); U.render(); };
  U.acts.autoLineup = function () { var c = U.club(); M.autoBest(U.st, c); c.manualLineup = false; U.lsel = null; U.render(); U.toast('Beste Sieben aufgestellt.'); };
  U.acts.manualToggle = function (d, el) { var c = U.club(); c.manualLineup = !el.checked; if (el.checked) M.autoBest(U.st, c); U.render(); };
  U.acts.setPiece = function (d, el) { var c = U.club(); c[d.k] = el.value; if (d.k === 'captain') c.captainManual = true; c.manualLineup = true; };
  U.lineSwap = function (a, b) {
    if (!U.can('sport')) return;
    var c = U.club();
    function loc(x) { if (x.slot != null) return { list: c.lineup, i: x.slot }; var i = c.lineup.indexOf(x.pid); if (i >= 0) return { list: c.lineup, i: i }; i = c.bench.indexOf(x.pid); if (i >= 0) return { list: c.bench, i: i }; return { list: null, pid: x.pid }; }
    var la = loc(a), lb = loc(b);
    var va = la.list ? la.list[la.i] : la.pid, vb = lb.list ? lb.list[lb.i] : lb.pid;
    if (va === vb) return;
    if (la.list) la.list[la.i] = vb || null; if (lb.list) lb.list[lb.i] = va || null;
    c.bench = c.bench.filter(Boolean);
    if (c.bench.length > 9) c.bench.length = 9;
    c.manualLineup = true;
    M.autoSetPieces(U.st, c);
  };
  U.acts.lineSlot = function (d) { U.lineClick({ slot: +d.i }); };
  U.acts.linePid = function (d) { U.lineClick({ pid: d.id }); };
  U.lineClick = function (x) {
    if (U._dragged) { U._dragged = false; return; }
    if (!U.lsel) { U.lsel = x; U.render(); return; }
    var a = U.lsel; U.lsel = null; U.lineSwap(a, x); U.render();
  };
  U.bindDrag = function () {
    var drag = null;
    document.querySelectorAll('[data-drag]').forEach(function (el) {
      el.addEventListener('pointerdown', function (e) { drag = { src: el.dataset.drag, x: e.clientX, y: e.clientY, el: el }; });
    });
    document.onpointermove = function (e) { if (drag && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 8) { drag.moved = true; drag.el.classList.add('dragging'); } };
    // Touch: Wenn der Browser die Geste zum Scrollen übernimmt, Ziehen abbrechen
    document.onpointercancel = function () { if (drag) { drag.el.classList.remove('dragging'); drag = null; } };
    document.onpointerup = function (e) {
      if (!drag) return;
      var d = drag; drag = null; d.el.classList.remove('dragging');
      if (!d.moved) return;
      var tgt = document.elementFromPoint(e.clientX, e.clientY); tgt = tgt && tgt.closest('[data-drop]');
      if (!tgt || tgt.dataset.drop === d.src) return;
      function parse(s) { var p = s.split(':'); return p[0] === 'slot' ? { slot: +p[1] } : { pid: p[1] }; }
      U._dragged = true; setTimeout(function () { U._dragged = false; }, 50);
      U.lsel = null; U.lineSwap(parse(d.src), parse(tgt.dataset.drop)); U.render();
    };
  };

  // ---------- Spieler-Detail ----------
  U.acts.playerInfo = function (d) { U.showPlayer(d.id); };
  U.showPlayer = function (id) {
    var st = U.st, p = st.players[id]; if (!p) return;
    var c = U.club(), own = c && p.clubId === c.id, club = p.clubId ? st.clubs[p.clubId] : null;
    var h = '<div class="grid g2"><div><div class="row" style="gap:12px;flex-wrap:nowrap">' + (p.photo ? '<img src="' + p.photo + '" style="width:72px;height:72px;object-fit:cover;border-radius:8px">' : '<div style="width:72px;height:72px;border-radius:8px;background:#22345a;display:flex;align-items:center;justify-content:center;font-size:30px">👤</div>') +
      '<div><div style="font-size:18px;font-weight:800">' + esc(W.playerName(p)) + '</div><div class="muted">' + U.posTag(p.pos) + ' ' + p.alt.join('/') + ' · ' + p.age + ' Jahre · ' + (club ? esc(club.name) : 'vereinslos') + '</div>' + (p.extId ? '<div class="muted small">' + [p.posDetail ? { TW: 'Torwart', IV: 'Innenverteidiger', AV: 'Außenverteidiger', DM: 'Defensives Mittelfeld', ZM: 'Zentrales Mittelfeld', OM: 'Offensives Mittelfeld', FL: 'Flügel', ST: 'Stürmer' }[p.posDetail] || p.posDetail : '', p.nat ? esc(p.nat) : '', p.foot ? (p.foot === 'L' ? 'Linksfuß' : 'Rechtsfuß') : ''].filter(Boolean).join(' · ') + '</div>' : '') + '<div style="margin-top:6px">Stärke ' + U.ovrBadge(p.ovr) + ' Potenzial ' + U.potText(p) + '</div></div></div>';
    h += '<table class="t" style="margin-top:12px">' + D.attrKeys.map(function (k) { var v = p.attr[k]; return (k === 'gk' && p.pos !== 'TW') ? '' : '<tr><td>' + D.attrNames[k] + '</td><td class="num" style="width:40px">' + Math.round(v) + '</td><td style="width:50%">' + U.bar(v, 99) + '</td></tr>'; }).join('') + '</table></div><div>';
    h += '<table class="t"><tr><td>Marktwert</td><td class="num">' + money(p.value) + '</td></tr><tr><td>Gehalt</td><td class="num">' + money(p.wage) + '/Jahr</td></tr><tr><td>Vertrag</td><td class="num">' + p.contract + ' Jahr(e)</td></tr><tr><td>Form / Fitness / Moral</td><td class="num">' + p.form.toFixed(1) + ' / ' + Math.round(p.fitness) + ' / ' + Math.round(p.morale) + '</td></tr>' +
      '<tr><td>Saison: Spiele / Tore / Vorlagen</td><td class="num">' + p.stats.apps + ' / ' + p.stats.goals + ' / ' + p.stats.assists + '</td></tr><tr><td>Ø Note</td><td class="num">' + (p.stats.apps ? (p.stats.rsum / p.stats.apps).toFixed(2) : '–') + '</td></tr><tr><td>Karriere: Spiele / Tore</td><td class="num">' + p.career.apps + ' / ' + p.career.goals + '</td></tr>' +
      (p.inj ? '<tr><td>Verletzung</td><td class="num neg">' + esc(p.inj.type) + ', ' + p.inj.weeks + ' Wo.</td></tr>' : '') + (p.susp ? '<tr><td>Sperre</td><td class="num neg">' + p.susp + ' Spiel(e)</td></tr>' : '') + '</table>';
    if (c && !own && p.clubId) {
      var mine = W.squad(st, c.id).filter(function (x) { return x.pos === p.pos; }).sort(function (a, b) { return b.ovr - a.ovr; })[0];
      if (mine) h += '<div class="help" style="margin-top:10px">Kadervergleich: Ihr bester ' + D.posNames[p.pos] + ' ist ' + esc(W.playerName(mine)) + ' (' + mine.ovr + ').</div>';
    }
    if (p.hist && p.hist.length) h += '<div class="small muted" style="margin-top:8px">Historie: ' + p.hist.slice(-6).map(function (x) { return x.s + ' ' + esc(x.c) + ' ' + x.a + '/' + x.g; }).join(' · ') + '</div>';
    h += '</div></div>';
    var f = '';
    if (own) {
      if (U.canYouth()) f += p.youth ? '<button class="primary" data-act="promoteYouth" data-id="' + p.id + '">In die 1. Mannschaft …</button>' : p.trial ? '<button class="primary" data-act="promoteYouth" data-id="' + p.id + '">Profivertrag …</button><button data-act="youthBack" data-id="' + p.id + '">Zurück in die Jugend</button>' : '';
      f += '<button data-act="toggleList" data-id="' + p.id + '">' + (p.listed ? 'Von Transferliste nehmen' : 'Auf Transferliste') + '</button><button data-act="renew" data-id="' + p.id + '">Vertrag verlängern</button><button data-act="loanOut" data-id="' + p.id + '">Ausleihen</button><button class="danger" data-act="releasePlayer" data-id="' + p.id + '">Entlassen</button>';
    } else if (c) {
      st.favs = st.favs || {};
      f += '<button data-act="fav" data-id="' + p.id + '">' + (st.favs[p.id] ? '★ Favorit' : '☆ Favorit') + '</button>';
      if (!p.clubId) f += '<button class="primary" data-act="buyStart" data-id="' + p.id + '">Vertrag anbieten</button>';
      else if (!st.clubs[p.clubId].userControlled) f += '<button data-act="loanIn" data-id="' + p.id + '">Ausleihen</button><button class="primary" data-act="buyStart" data-id="' + p.id + '">Angebot abgeben</button>';
    }
    U.modal('Spieler', h, f + '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.fav = function (d) { var st = U.st; st.favs = st.favs || {}; if (st.favs[d.id]) delete st.favs[d.id]; else st.favs[d.id] = 1; U.showPlayer(d.id); };
  // Nachwuchs → 1. Mannschaft: zur Probe oder mit Profivertrag (jederzeit, auch außerhalb des Transferfensters)
  U.canYouth = function () { return U.can('sport') || U.can('business'); };
  U.acts.promoteYouth = function (d) {
    var st = U.st, p = st.players[d.id], T_ = R.transfers, wage = T_.youthProWage(p);
    var h = '<p><b>' + esc(W.playerName(p)) + '</b> (' + p.pos + ', ' + p.age + ' J., Stärke ' + p.ovr + ', Potenzial ' + p.pot + ')</p>' +
      '<div class="grid g2">' +
      (p.youth ? '<div class="panel"><h3>🧪 Zur Probe</h3><p class="small">Trainiert und spielt ' + T_.TRIAL_WEEKS + ' Wochen bei den Profis mit, behält sein Jugendgehalt (' + money(p.wage) + '/Jahr). Danach entscheiden Sie: Profivertrag – sonst kehrt er automatisch in die Jugend zurück.</p><button class="primary" data-act="youthTrial" data-id="' + p.id + '">Zur Probe hochziehen</button></div>' : '<div class="panel"><h3>🧪 Auf Probe</h3><p class="small">Noch ' + Math.max(0, p.trial.until - (st.tick || 0)) + ' Woche(n) Probezeit. Danach geht er zurück in die Jugend, wenn er keinen Vertrag bekommt.</p></div>') +
      '<div class="panel"><h3>✍️ Profivertrag</h3>' + U.field('Jahresgehalt (€)', '<input type="number" id="ypW" value="' + wage + '" step="5000" data-money>') + U.field('Laufzeit (Jahre)', '<select id="ypY">' + [1, 2, 3, 4, 5].map(function (y) { return '<option' + (y === 3 ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select>') +
      '<p class="muted small">Vorschlag: ' + money(wage) + '/Jahr (60 % eines marktüblichen Gehalts). Eigengewächse unterschreiben ohne Verhandlung.</p><button class="primary" data-act="youthPro" data-id="' + p.id + '">Profivertrag unterschreiben</button></div></div>' +
      '<p class="muted small">Beides ist jederzeit möglich – auch außerhalb des Transferfensters.</p>';
    U.modal('In die 1. Mannschaft', h, '<button data-act="closeModal">Abbrechen</button>', true);
  };
  U.acts.youthTrial = function (d) { var p = U.st.players[d.id], r = R.transfers.youthTrial(U.st, p); U.closeModal(); U.render(); U.toast(r.ok ? W.playerName(p) + ' trainiert ' + R.transfers.TRIAL_WEEKS + ' Wochen zur Probe bei den Profis.' : r.why); if (U.autosave) U.autosave(); };
  U.acts.youthPro = function (d) {
    var p = U.st.players[d.id], w = +(document.getElementById('ypW') || {}).value || 0, y = +(document.getElementById('ypY') || {}).value || 3;
    var r = R.transfers.youthPro(U.st, p, y, w); U.closeModal(); U.render(); U.toast(r.ok ? W.playerName(p) + ': Profivertrag bis ' + (U.st.season + p.contract) + '.' : r.why); if (U.autosave) U.autosave();
  };
  U.acts.youthBack = function (d) { var p = U.st.players[d.id], r = R.transfers.youthBack(U.st, p); U.closeModal(); U.render(); U.toast(r.ok ? W.playerName(p) + ' ist zurück in der Jugend.' : r.why); };
  U.acts.toggleList = function (d) {
    var p = U.st.players[d.id];
    if (p.listed) { p.listed = false; p.asking = 0; U.closeModal(); U.render(); return; }
    U.modal('Transferliste', '<p>' + esc(W.playerName(p)) + ' auf die Transferliste setzen. Marktwert: ' + money(p.value) + '</p>' + U.field('Geforderte Ablöse (€)', '<input type="number" id="askIn" value="' + p.value + '" step="50000">'), '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="listConfirm" data-id="' + p.id + '">Auf Liste setzen</button>');
  };
  U.acts.listConfirm = function (d) { var p = U.st.players[d.id]; p.listed = true; p.asking = Math.max(0, +document.getElementById('askIn').value || p.value); U.closeModal(); U.render(); U.toast('Auf der Transferliste. Angebote erscheinen in der Zentrale.'); };
  U.acts.releasePlayer = function (d) {
    var p = U.st.players[d.id], comp = Math.round(p.wage * p.contract * 0.5);
    U.confirm('Spieler entlassen', esc(W.playerName(p)) + ' entlassen? Abfindung: ' + money(comp) + '.', function () { T.release(U.st, p); U.render(); });
  };
  U.acts.loanOut = function (d) {
    var st = U.st, p = st.players[d.id], c = U.club();
    var cands = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (x) { return !x.userControlled && x.league >= c.league && W.squad(st, x.id).length < 26; });
    if (!cands.length) { U.toast('Kein Verein interessiert.'); return; }
    var to = R.pick(cands.filter(function (x) { return x.league === Math.min(3, c.league + (p.ovr < 60 ? 1 : 0)); }).concat(cands));
    U.confirm('Ausleihe', esc(to.name) + ' würde ' + esc(W.playerName(p)) + ' für eine Saison ausleihen und 50 % des Gehalts übernehmen.', function () { T.loanPlayer(st, p, to, 0.5); U.closeModal(); U.render(); U.toast('Leihgeschäft abgeschlossen.'); });
  };
  U.acts.loanIn = function (d) {
    var st = U.st, p = st.players[d.id], from = st.clubs[p.clubId], c = U.club();
    var rank = W.squad(st, from.id).sort(function (a, b) { return b.ovr - a.ovr; }).indexOf(p);
    if (rank < 14 || !T.windowOpen(st)) { U.toast(!T.windowOpen(st) ? 'Transferfenster geschlossen.' : from.short + ' gibt Stammspieler nicht ab.'); return; }
    var fee = R.round(p.value * 0.1, 5000);
    U.confirm('Ausleihe', 'Leihgebühr ' + money(fee) + ', Sie zahlen das volle Gehalt (' + money(p.wage) + '/Jahr) für eine Saison.', function () {
      if (c.cash < fee) { U.toast('Nicht genug Geld.'); return; }
      c.cash -= fee; from.cash += fee; E.book(c, 'Transferausgaben', -fee);
      p.loan = { from: from.id, until: st.season + 1 }; T.executeTransfer(st, p, c, 0, p.wage, p.contract, { loan: true });
      U.closeModal(); U.render(); U.toast('Leihe abgeschlossen.');
    });
  };

  // ---------- Verhandlungen (Kauf & Verlängerung) ----------
  U.acts.buyStart = function (d) {
    var st = U.st, p = st.players[d.id], c = U.club();
    if (T.isPending(st, p)) { U.toast('Mit diesem Spieler ist bereits ein Wechsel vereinbart.'); return; }
    if (!T.willingness(st, p, c)) { U.modal('Kein Interesse', '<p>' + esc(W.playerName(p)) + ' möchte nicht zu ' + esc(c.short) + ' wechseln – die Liga oder der Ruf des Vereins passen nicht.</p>'); return; }
    U.nego = { future: !!p.clubId && !T.windowOpen(st), pid: p.id, stage: p.clubId ? 'fee' : 'contract', fee: p.clubId ? R.round(p.value, 50000) : 0, wage: T.wageDemand(st, p, c), years: 3, signOn: 0, bonus: 0, msg: '', rounds: 0 };
    U.showNego();
  };
  U.acts.renew = function (d) {
    var st = U.st, p = st.players[d.id], c = U.club();
    U.nego = { pid: p.id, stage: 'contract', renew: true, wage: R.round(Math.max(p.wage, T.wageDemand(st, p, c) * 0.95), 1000), years: 2, signOn: 0, bonus: 0, msg: '', rounds: 0 };
    U.showNego();
  };
  U.showNego = function () {
    var st = U.st, n = U.nego, p = st.players[n.pid], c = U.club(), h = '', f = '';
    var budgetInfo = st.manager.role === 'trainer' ? '<p class="small">Ihr Transferbudget: <b>' + money(st.manager.transferBudget || 0) + '</b></p>' : '<p class="small">Kontostand: <b>' + money(c.cash) + '</b></p>';
    h += '<p><b>' + esc(W.playerName(p)) + '</b> (' + p.pos + ', ' + p.age + ' J., Stärke ' + p.ovr + ') · Marktwert ' + money(p.value) + '</p>' + budgetInfo;
    if (n.future) h += '<div class="help" style="margin-bottom:8px">🗓 Das Transferfenster ist geschlossen. Sie verhandeln einen <b>Wechsel zur neuen Saison</b>: Der Spieler kommt zum Start der Saisonvorbereitung, Ablöse und Handgeld werden erst dann fällig.</div>';
    if (n.stage === 'fee') {
      h += '<h3>Schritt 1: Ablöse mit ' + esc(st.clubs[p.clubId].name) + '</h3>' + U.field('Ihr Angebot (€)', '<input type="number" id="feeIn" value="' + n.fee + '" step="50000">');
      f = '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="negoFee">Angebot abgeben</button>';
    } else if (n.stage === 'contract') {
      h += '<h3>' + (n.renew ? 'Vertragsverlängerung' : 'Schritt 2: Vertrag mit dem Spieler') + '</h3><div class="grid g2">' +
        U.field('Jahresgehalt (€)', '<input type="number" id="wIn" value="' + n.wage + '" step="5000">') + U.field('Laufzeit (Jahre)', '<select id="yIn">' + [1, 2, 3, 4, 5].map(function (y) { return '<option' + (y === n.years ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select>') +
        U.field('Handgeld (€, einmalig)', '<input type="number" id="sIn" value="' + n.signOn + '" step="10000">') + U.field('Erfolgsbonus (€/Saison)', '<input type="number" id="bIn" value="' + n.bonus + '" step="10000">') + '</div>';
      f = '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="negoContract">Vertrag anbieten</button>';
    } else if (n.stage === 'medical') {
      h += '<h3>Medizincheck</h3><div class="help">' + esc(n.medical.text) + ' <span class="muted">(Zuverlässigkeit ca. ' + n.medical.reliability + ' %)</span></div>';
      f = '<button class="danger" data-act="negoAbort">Transfer abbrechen</button>' + (n.medical.found ? '<button data-act="negoRenegotiate">Ablöse neu verhandeln (−20 %)</button>' : '') + '<button class="primary" data-act="negoFinish">Transfer durchführen</button>';
    } else if (n.stage === 'done') {
      h += '<div class="help">✅ ' + esc(n.msg) + '</div>'; f = '<button class="primary" data-act="closeModal">Super!</button>';
    }
    if (n.msg && n.stage !== 'done') h += '<div class="help" style="margin-top:10px">' + esc(n.msg) + '</div>';
    U.modal(n.renew ? 'Vertragsverhandlung' : 'Transferverhandlung', h, f);
  };
  U.acts.negoFee = function () {
    var st = U.st, n = U.nego, p = st.players[n.pid], c = U.club();
    n.fee = Math.max(0, Math.round(+document.getElementById('feeIn').value || 0));
    var budget = st.manager.role === 'trainer' ? st.manager.transferBudget : c.cash;
    if (n.fee > budget) { n.msg = 'Das übersteigt Ihr verfügbares Budget.'; return U.showNego(); }
    n.rounds++;
    var r = T.evaluateOffer(st, p, n.fee, c);
    if (r.result === 'accept') { n.stage = 'contract'; n.msg = st.clubs[p.clubId].short + ' akzeptiert die Ablöse von ' + money(n.fee) + '. Jetzt mit dem Spieler verhandeln.'; }
    else if (r.result === 'counter') { if (n.rounds >= 4) { n.msg = 'Der Verein bricht die Verhandlungen ab.'; n.stage = 'done'; n.msg = 'Keine Einigung – ' + st.clubs[p.clubId].short + ' hat die Gespräche beendet.'; } else { n.fee = r.amount; n.msg = 'Gegenangebot: ' + money(r.amount) + '. Eingetragen – erneut abgeben, um anzunehmen.'; } }
    else n.msg = r.text;
    U.showNego();
  };
  U.acts.negoContract = function () {
    var st = U.st, n = U.nego, p = st.players[n.pid], c = U.club();
    n.wage = Math.round(+document.getElementById('wIn').value || 0); n.years = +document.getElementById('yIn').value; n.signOn = Math.round(+document.getElementById('sIn').value || 0); n.bonus = Math.round(+document.getElementById('bIn').value || 0);
    n.rounds++;
    var r = T.negotiate(st, p, c, n);
    if (r.result === 'accept') {
      if (n.renew) { p.wage = n.wage; p.contract = n.years; p.bonus = n.bonus; if (n.signOn) { c.cash -= n.signOn; E.book(c, 'Handgelder', -n.signOn); } p.morale = Math.min(100, p.morale + 8); n.stage = 'done'; n.msg = W.playerName(p) + ' verlängert bis ' + (st.season + n.years) + '.'; U.render(); if (U.autosave) U.autosave(); }
      else {
        var med = T.medicalCheck(st, c, p);
        if (med) { n.medical = med; n.stage = 'medical'; }
        else return U.acts.negoFinish();
      }
    } else if (r.result === 'counter') { n.wage = r.wage; n.years = r.years; n.msg = r.text + ' Vorschlag eingetragen.'; if (n.rounds > 5) { n.stage = 'done'; n.msg = W.playerName(p) + ' hat keine Lust mehr auf Verhandlungen.'; } }
    else n.msg = r.text;
    U.showNego();
  };
  U.acts.negoFinish = function () {
    var st = U.st, n = U.nego, p = st.players[n.pid], c = U.club();
    if (n.future) { T.addPending(st, p, c, n); n.stage = 'done'; n.msg = W.playerName(p) + ' wechselt zur neuen Saison zu ' + c.name + '.'; U.showNego(); U.render(); return; }
    if (c.cash < n.fee + n.signOn && st.manager.role !== 'trainer') { n.msg = 'Nicht genug Geld auf dem Konto.'; n.stage = 'done'; return U.showNego(); }
    T.executeTransfer(st, p, c, n.fee, n.wage, n.years, { signOn: n.signOn, bonus: n.bonus });
    if (st.manager.role === 'trainer') st.manager.transferBudget = Math.max(0, (st.manager.transferBudget || 0) - n.fee - n.signOn);
    n.stage = 'done'; n.msg = W.playerName(p) + ' wechselt zu ' + c.name + '!';
    U.showNego(); U.render();
  };
  U.acts.negoAbort = function () { U.nego.stage = 'done'; U.nego.msg = 'Transfer abgebrochen.'; U.showNego(); };
  U.acts.negoRenegotiate = function () {
    var n = U.nego, st = U.st, p = st.players[n.pid];
    if (R.chance(0.6)) { n.fee = R.round(n.fee * 0.8, 10000); n.msg = 'Der Verein akzeptiert die reduzierte Ablöse: ' + money(n.fee) + '.'; n.medical.found = false; }
    else { n.stage = 'done'; n.msg = st.clubs[p.clubId].short + ' lehnt die Nachverhandlung ab. Transfer geplatzt.'; }
    U.showNego();
  };

  // ---------- Transfermarkt ----------
  U.mf = { q: '', pos: '', league: '', club: '', ageMin: 16, ageMax: 40, ovrMin: 0, potMin: 0, valueMax: 0, wageMax: 0, contractMax: 9, status: 'all', reach: false };
  U.screens.transfer = function () {
    var st = U.st, f = U.mf, c = U.club();
    var ws = T.windowStatus(st);
    var h = '<h1>Transfermarkt</h1><div class="row" style="margin-bottom:10px"><span class="tag ' + (ws.open ? 'green' : 'red') + '" title="' + esc(T.WINDOW_TEXT) + '">' + esc(ws.text) + '</span>' + (st.manager.role === 'trainer' ? '<span class="muted">Transferbudget: <b>' + money(st.manager.transferBudget || 0) + '</b></span>' : '<span class="muted">Kontostand: <b>' + money(c.cash) + '</b></span>') + '<span class="muted small">Kader: ' + W.squad(st, c.id).length + ' Spieler</span></div>';
    h += '<div class="panel" style="margin-bottom:12px"><div class="row">' +
      '<input type="text" placeholder="🔎 Name suchen" data-inp="mf" data-k="q" value="' + esc(f.q) + '" style="width:180px">' +
      U.sel('pos', [['', 'Alle Positionen']].concat(D.positions.map(function (p) { return [p, D.posNames[p]]; }))) +
      U.sel('league', [['', 'Alle Ligen'], ['1', 'Bundesliga'], ['2', '2. Bundesliga'], ['3', '3. Liga']]) +
      U.sel('club', [['', 'Alle Vereine']].concat(Object.keys(st.clubs).map(function (k) { return [k, st.clubs[k].name]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); }))) +
      U.sel('status', [['all', 'Alle Spieler'], ['listed', 'Transferliste'], ['free', 'Vertragslos'], ['loan', 'Leihkandidaten'], ['expiring', 'Auslaufende Verträge'], ['young', 'Talente (≤ 21)'], ['fav', 'Favoriten']]) +
      '</div><div class="row" style="margin-top:8px">' +
      U.num('ageMin', 'Alter ab') + U.num('ageMax', 'bis') + U.num('ovrMin', 'Stärke ab') + U.num('potMin', 'Potenzial ab') + U.num('valueMax', 'Marktwert bis (Mio.)') + U.num('wageMax', 'Gehalt bis (Tsd.)') + U.num('contractMax', 'Vertrag bis (J.)') +
      '<label class="row small" style="gap:6px"><input type="checkbox" data-chg="mfReach"' + (f.reach ? ' checked' : '') + '> Nur erreichbare Spieler</label>' +
      '<button data-act="mfReset">Filter zurücksetzen</button></div></div>';
    var pend = (st.pendingTransfers || []).filter(function (x) { return x.to === c.id; });
    if (pend.length) h += '<div class="panel" style="margin-bottom:12px"><h2>📝 Vereinbart zur neuen Saison</h2>' + pend.map(function (x) { var p = st.players[x.pid]; return p ? '<div class="news-item row between"><div><div class="h">' + esc(W.playerName(p)) + ' (' + p.pos + ', ' + p.ovr + ')</div><div class="tx">' + (x.from && st.clubs[x.from] ? esc(st.clubs[x.from].name) + ' · ' : '') + 'Ablöse ' + money(x.fee) + ' · ' + money(x.wage) + '/Jahr · ' + x.years + ' J.</div></div><button class="sm danger" data-act="pendCancel" data-id="' + p.id + '">Zurückziehen</button></div>' : ''; }).join('') + '</div>';
    var list = [];
    st.favs = st.favs || {};
    for (var id in st.players) {
      var p = st.players[id];
      if (p.youth || p.retired || p.clubId === c.id) continue;
      if (f.q && (p.first + ' ' + p.last).toLowerCase().indexOf(f.q.toLowerCase()) < 0) continue;
      if (f.pos && p.pos !== f.pos) continue;
      if (f.league && (!p.clubId || st.clubs[p.clubId].league !== +f.league)) continue;
      if (f.club && p.clubId !== f.club) continue;
      if (p.age < f.ageMin || p.age > f.ageMax || p.ovr < f.ovrMin || p.pot < f.potMin) continue;
      if (f.valueMax && p.value > f.valueMax * 1e6) continue;
      if (f.wageMax && p.wage > f.wageMax * 1000) continue;
      if (p.contract > f.contractMax) continue;
      if (f.status === 'listed' && !p.listed) continue;
      if (f.status === 'free' && p.clubId) continue;
      if (f.status === 'expiring' && (p.contract > 1 || !p.clubId)) continue;
      if (f.status === 'young' && p.age > 21) continue;
      if (f.status === 'fav' && !st.favs[p.id]) continue;
      if (f.status === 'loan' && (!p.clubId || p.ovr > R.avg(W.squad(st, p.clubId), function (x) { return x.ovr; }) - 2)) continue;
      if (f.reach && !T.reachable(st, p, c)) continue;
      list.push(p);
    }
    var total = list.length;
    var ss = U.sortState.market;
    if (!ss) list.sort(function (a, b) { return b.ovr - a.ovr; });
    h += '<div class="panel tight"><div class="scroll" style="max-height:62vh">' + U.squadTable(list.slice(0, ss ? 2000 : 250), 'market', { market: true, club: true }) + '</div></div><p class="muted small">' + total + ' Spieler gefunden' + (total > 250 && !ss ? ' (die besten 250 werden angezeigt – Filter oder Sortierung nutzen)' : '') + '. Klick auf einen Spieler öffnet Details, Angebot und Kadervergleich.</p>';
    return h;
  };
  U.sel = function (k, opts) { return '<select data-chg="mfSel" data-k="' + k + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(U.mf[k]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
  U.num = function (k, l) { return '<label class="f" style="width:96px">' + l + '<input type="number" data-chg="mfNum" data-k="' + k + '" value="' + U.mf[k] + '"></label>'; };
  U.acts.mfSel = function (d, el) { U.mf[d.k] = el.value; U.render(); };
  U.acts.mfReach = function (d, el) { U.mf.reach = el.checked; U.render(); };
  U.acts.pendCancel = function (d) { T.cancelPending(U.st, d.id); U.toast('Vereinbarung zurückgezogen.'); U.render(); };
  U.acts.mfNum = function (d, el) { U.mf[d.k] = +el.value || 0; U.render(); };
  U.acts.mf = function (d, el) { U.mf.q = el.value; clearTimeout(U._mft); U._mft = setTimeout(function () { U.render(); var i = document.querySelector('[data-inp=mf]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); };
  U.acts.mfReset = function () { U.mf = { q: '', pos: '', league: '', club: '', ageMin: 16, ageMax: 40, ovrMin: 0, potMin: 0, valueMax: 0, wageMax: 0, contractMax: 9, status: 'all' }; U.sortState.market = null; U.render(); };

  // ---------- Training ----------
  U.screens.training = function () {
    var st = U.st, c = U.club(), gf = st.manager.role === 'gf', can = U.can('sport') || gf;
    var h = '<h1>Training</h1>';
    if (gf) h += '<div class="help" style="margin-bottom:12px">🤝 <b>Mitspracherecht des Geschäftsführers:</b> ' + (c.trainingByUser ? 'Sie geben den Trainingsschwerpunkt vor – ' + esc(U.coachName(c)) + ' und sein Stab setzen ihn um.' : esc(U.coachName(c)) + ' wählt den Schwerpunkt selbst. Tippen Sie auf eine Kachel, um ihn vorzugeben.') +
      (c.trainingByUser ? ' <button class="sm" data-act="trainingToCoach">Wieder dem Trainer überlassen</button>' : '') + '</div>';
    h += U.planPanel(st, c) + '<div class="sec-h">🏋️ Trainingsschwerpunkt <span class="ts" style="margin-left:auto">gilt jede Woche, bis Sie ihn ändern</span></div><div class="tiles big">';
    var arrows = function (v) { return v === 0 ? '<span class="arr nu">●</span>' : '<span class="arr ' + (v > 0 ? 'up' : 'dn') + '">' + (v > 0 ? '▲' : '▼').repeat(Math.abs(v)) + '</span>'; };
    Object.keys(D.training).forEach(function (k) {
      var t = D.training[k];
      h += '<div class="tile ' + (c.training === k ? 'on' : '') + (can ? '' : ' ro') + '" ' + (can ? 'data-act="setTraining" data-k="' + k + '"' : '') + '><div class="row-ic"><span class="ti" style="font-size:40px">' + t.ic + '</span><div><div class="tt" style="font-size:16px">' + t.n + '</div><div class="ts">' + (c.training === k ? '✔ aktiv' : 'Fördert: ' + t.attrs) + '</div></div></div>' +
        '<div class="ts">' + t.d + '</div><div class="fx-row">' + Object.keys(D.trainingFx).map(function (f) { return '<div class="fx' + (f === 'inj' ? ' inv' : '') + '" title="' + D.trainingFx[f][1] + '"><b>' + D.trainingFx[f][0] + '</b>' + arrows(t.fx[f]) + ({ mor: 'Moral', fit: 'Fitness', fresh: 'Frische', inj: 'Verletz.', dev: 'Entwickl.' })[f] + '</div>'; }).join('') + '</div></div>';
    });
    var sq = W.squad(st, c.id);
    h += '</div><p class="muted small" style="margin-top:8px">▲ steigt · ▼ sinkt · ● neutral. Bei der Verletzungsgefahr ist ▼ gut (grün). Trainingszentrum: <b>' + esc(E.level(c, 'training').n) + '</b> · Trainingsorganisation: <b>' + D.budgetLevels[c.budgets.trainorg] + '</b> · Trainer: <b>' + esc(U.coachName(c)) + '</b>' + (E.staffLvl(c, 'co') ? ' · Co-Trainer ' + U.stars(E.staffLvl(c, 'co'), 3) : '') + (E.staffLvl(c, 'fitness') ? ' · Fitnesstrainer ' + U.stars(E.staffLvl(c, 'fitness'), 3) : '') + '</p>';
    var avgFit = Math.round(R.avg(sq, function (p) { return p.fitness; })), avgMor = Math.round(R.avg(sq, function (p) { return p.morale; })), injN = sq.filter(function (p) { return p.inj; }).length;
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>Zustand der Mannschaft</h2><div class="grid g2">' + U.ikpi('energy', 'Ø Frische', avgFit, '', U.bar(avgFit, 100, avgFit < 70 ? '#ef4444' : avgFit < 85 ? '#f5b301' : '#22c55e')) + U.ikpi('heart', 'Ø Moral', avgMor, '', U.bar(avgMor, 100, '#a78bfa')) + U.ikpi('fans', 'Teamchemie', Math.round(c.chemistry), '', U.bar(c.chemistry)) + U.ikpi('heart', 'Verletzte', injN, injN > 3 ? 'neg' : '') + '</div></div>';
    h += '<div class="panel"><h2>Trainingslager-Ziele</h2>' + D.camps.map(function (cp) { return '<div class="news-item"><div class="h">' + cp.name + ' – ' + money(cp.cost) + '</div><div class="tx">' + cp.desc + '</div></div>'; }).join('') + '<p class="muted small">Gebucht wird im Vorbereitungs- bzw. Winterpausenplan oben (je ein Trainingslager pro Pause, dauert eine Woche).</p></div></div>';
    return h;
  };
  U.acts.setTraining = function (d) { var c = U.club(); c.training = d.k; if (U.st.manager.role === 'gf') c.trainingByUser = true; U.render(); U.toast('Trainingsschwerpunkt: ' + D.training[d.k].n); };
  U.acts.trainingToCoach = function () { U.club().trainingByUser = false; S.aiCoachDuties(U.st, U.club()); U.render(); U.toast('Der Trainer entscheidet wieder selbst.'); };
  // Vorbereitungs-/Winterpausenplan: je Woche Training, Testspiel oder Trainingslager
  U.planPanel = function (st, c) {
    var weeks = S.planWeeks(st); if (!weeks.length) return '';
    var can = S.planOwnerIsUser(st) && U.can('business') || st.manager.role === 'manager';
    var cur = S.isBreak(st) ? S.breakKey(st) : null, opps = S.friendlyOpponents(st, c), plan = st.plan || {};
    var title = weeks[0].k.charAt(0) === 'p' ? 'Saisonvorbereitung planen' : 'Winterpause planen';
    var h = '<div class="panel" style="margin-bottom:14px"><div class="panel-h"><h2>🗓 ' + title + '</h2><span class="muted small">' + (can ? 'Planung: Sie (' + S.roleName(st.manager.role) + ')' : 'Planung: Vereinsführung') + '</span></div><table class="t plan-t"><tr><th>Woche</th><th>Programm</th><th></th></tr>';
    weeks.forEach(function (w) {
      var it = plan[w.k], past = w.past || (it && it.done), now = cur === w.k;
      var desc = w.cup ? '🏆 1. Pokalrunde' + (it && it.type === 'camp' ? ' + ' : '') : '';
      if (it && it.type === 'test') { var o = st.clubs[it.opp]; desc += '🤾 Testspiel ' + (it.home ? 'gegen ' : 'bei ') + (o ? esc(o.name) : '?') + (o ? ' <span class="muted small">(' + D.leagueNames[W.lk(o)] + ')</span>' : ''); }
      else if (it && it.type === 'camp') { var cp = D.camps.filter(function (x) { return x.id === it.camp; })[0]; desc += '🏕 Trainingslager ' + (cp ? cp.name + ' (' + money(cp.cost) + ')' : ''); }
      else if (!w.cup) desc = '<span class="muted">🏋️ Nur Training</span>';
      var ctrl = '';
      if (can && !past) {
        ctrl = '<select data-chg="planSet" data-k="' + w.k + '"><option value="">Nur Training</option>' +
          (w.cup ? '' : '<optgroup label="Testspiel (Heim)">' + opps.map(function (o) { return '<option value="test:' + o.id + ':1"' + (it && it.type === 'test' && it.opp === o.id && it.home ? ' selected' : '') + '>' + esc(o.short) + ' · ' + D.leagueNames[W.lk(o)] + '</option>'; }).join('') + '</optgroup><optgroup label="Testspiel (Auswärts)">' + opps.map(function (o) { return '<option value="test:' + o.id + ':0"' + (it && it.type === 'test' && it.opp === o.id && !it.home ? ' selected' : '') + '>bei ' + esc(o.short) + '</option>'; }).join('') + '</optgroup>') +
          '<optgroup label="Trainingslager">' + D.camps.map(function (cp) { return '<option value="camp:' + cp.id + '"' + (it && it.type === 'camp' && it.camp === cp.id ? ' selected' : '') + '>' + cp.name + ' · ' + money(cp.cost) + '</option>'; }).join('') + '</optgroup></select>';
      }
      h += '<tr class="' + (now ? 'plan-now' : past ? 'muted' : '') + '"><td>' + (now ? '▶ ' : past ? '✓ ' : '') + esc(w.n) + '</td><td>' + desc + '</td><td class="num">' + ctrl + '</td></tr>';
    });
    h += '</table><p class="muted small" style="margin-top:6px">Testspiele bringen Spielpraxis und Teamchemie (keine Tabellen, keine Sperren, kleine Einnahme bei Heimspielen). Trainingslager stärken Fitness, Moral und Teamchemie. Ungeplante Wochen sind reine Trainingswochen.</p></div>';
    return h;
  };
  U.acts.planSet = function (d, el) {
    var v = el.value, item = null;
    if (v.indexOf('test:') === 0) { var a = v.split(':'); item = { type: 'test', opp: a[1], home: a[2] === '1' }; }
    else if (v.indexOf('camp:') === 0) item = { type: 'camp', camp: v.slice(5) };
    var r = S.setPlan(U.st, d.k, item);
    if (!r.ok) U.toast(r.why); U.render();
  };
  U.acts.camp = function (d) { var r = S.applyCamp(U.st, U.club(), d.k); if (!r.ok) U.toast(r.why); else U.modal('Trainingslager', '<p>' + esc(r.text) + '</p>', '<button class="primary" data-act="closeModal">OK</button>'); U.render(); };

  // ---------- Ausbaukarte (gemeinsam für Abteilungen, Stadion, Stadt) ----------
  U.facilityCard = function (key, opts) {
    opts = opts || {};
    var st = U.st, c = U.club(), f = D.facilities[key], lvl = c.fac[key] != null ? c.fac[key] : (f.min || 0), cur = f.levels[lvl], max = f.levels.length - 1;
    var pv = E.buildPreview(st, c, key), can = E.canBuild(st, c, key), b = c.construction.filter(function (x) { return x.key === key; })[0];
    var h = '<div class="panel"><div class="panel-h"><h3>' + f.name + '</h3><span class="tag">Stufe ' + lvl + '/' + max + '</span></div><div><b>' + esc(cur ? cur.n : '—') + '</b>' + (cur && cur.up ? ' <span class="muted small">· Unterhalt ' + money(cur.up) + '/Saison</span>' : '') + '</div>';
    if (opts.extra) h += opts.extra;
    if (b) h += '<div class="small warn" style="margin-top:8px">🏗️ Im Bau: ' + esc(f.levels[b.to].n) + ' – noch ' + b.weeks + ' Wochen</div>' + U.bar(b.total - b.weeks, b.total, '#f5b301');
    else if (pv) {
      h += '<div class="small" style="margin-top:8px;border-top:1px solid var(--line);padding-top:8px">Nächste Stufe: <b>' + esc(pv.name) + '</b><table class="t small"><tr><td>Investition</td><td class="num">' + money(pv.cost) + (pv.subsidy ? ' <span class="pos">(Zuschuss ' + money(pv.subsidy) + ')</span>' : '') + '</td></tr><tr><td>Bauzeit</td><td class="num">' + pv.weeks + ' Wochen</td></tr>' +
        (pv.addRev ? '<tr><td>Zus. Einnahmen</td><td class="num pos">+' + money(pv.addRev) + '/J.</td></tr>' : '') + '<tr><td>Zus. Kosten</td><td class="num neg">−' + money(pv.addCost) + '/J.</td></tr>' +
        (pv.addRev ? '<tr><td>Überschuss</td><td class="num ' + (pv.surplus >= 0 ? 'pos' : 'neg') + '">' + money(pv.surplus) + '/J.</td></tr><tr><td>Amortisation</td><td class="num">' + (pv.payback ? 'ca. ' + pv.payback.toFixed(1).replace('.', ',') + ' Jahre' : 'nicht rentabel') + '</td></tr>' : '') + '</table>' +
        (opts.effect ? '<div class="muted small">' + opts.effect + '</div>' : '') +
        (U.can('business') ? '<button class="primary sm" style="margin-top:6px" data-act="build" data-k="' + key + '"' + (can.ok ? '' : ' disabled title="' + esc(can.why) + '"') + '>Ausbauen</button>' + (!can.ok ? ' <span class="muted small">' + esc(can.why) + '</span>' : '') : '') + '</div>';
    } else h += '<div class="pos small" style="margin-top:8px">✔ Höchste Ausbaustufe erreicht</div>';
    return h + '</div>';
  };
  U.acts.build = function (d) {
    var st = U.st, c = U.club(), pv = E.buildPreview(st, c, d.k);
    U.confirm('Bauauftrag', 'Bauauftrag für <b>' + esc(pv.name) + '</b> erteilen? Kosten ' + money(pv.cost) + ', Bauzeit ' + pv.weeks + ' Wochen.', function () {
      var r = E.startBuild(st, c, d.k); if (!r.ok) U.toast(r.why); else { U.toast('Bauauftrag erteilt!'); S.news(st, 'Spatenstich: ' + pv.name, c.name + ' investiert ' + money(pv.cost) + '.', 'bau'); }
      U.render();
    });
  };

  // ---------- Nachwuchs ----------
  U.screens.nachwuchs = function () {
    var st = U.st, c = U.club(), youth = W.youthOf(st, c.id);
    var h = '<h1>Nachwuchsleistungszentrum</h1><div class="grid g12"><div class="grid">' + U.facilityCard('jugend', { effect: 'Höhere Stufen: bessere Talente, schnellere Entwicklung, mehr Talente pro Jahrgang.' }) +
      '<div class="panel"><h2>Info</h2><p class="small">Jedes Jahr zum Saisonwechsel kommen neue Talente (16–18 Jahre). Mit 21 müssen sie in den Profikader übernommen werden oder gehen. Scouting-Budget „Premium“ bringt ein zusätzliches Talent.</p><p class="small">Selbst ausgebildete Spieler sind mit 🌱 markiert.</p></div></div>';
    h += '<div class="panel tight"><div style="padding:12px 14px 0"><h2>Jugendspieler (' + youth.length + ')</h2></div>' + U.table('youth', [
      { k: 'last', l: 'Name', f: function (p) { return esc(W.playerName(p)); } }, { k: 'pos', l: 'Pos', f: function (p) { return U.posTag(p.pos); } }, { k: 'age', l: 'Alter', num: true },
      { k: 'ovr', l: 'Stärke', num: true, f: function (p) { return U.ovrBadge(p.ovr); } }, { k: 'pot', l: 'Potenzial', num: true, f: function (p) { return U.ovrBadge(p.pot); } },
      { k: 'x', l: '', nosort: true, f: function (p) { return U.canYouth() ? '<button class="sm primary" data-act="promoteYouth" data-id="' + p.id + '">In die 1. Mannschaft …</button>' : ''; } }
    ], youth, { click: 'playerInfo', sort: { k: 'pot', d: -1 } }) + '</div>';
    var trial = W.squad(st, c.id).filter(function (p) { return p.trial; });
    if (trial.length) h += '<div class="panel" style="margin-top:14px"><h2>🧪 Zur Probe bei den Profis (' + trial.length + ')</h2>' + trial.map(function (p) { var left = Math.max(0, p.trial.until - (st.tick || 0)); return '<div class="news-item row between"><div><div class="h">' + esc(W.playerName(p)) + ' (' + p.pos + ', ' + p.age + ' J., ' + p.ovr + '/' + p.pot + ')</div><div class="tx">noch ' + left + ' Woche' + (left === 1 ? '' : 'n') + ' Probezeit</div></div>' + (U.canYouth() ? '<div class="row"><button class="sm primary" data-act="promoteYouth" data-id="' + p.id + '">Profivertrag …</button><button class="sm" data-act="youthBack" data-id="' + p.id + '">Zurück</button></div>' : '') + '</div>'; }).join('') + '</div>';
    h += '</div>';
    return h;
  };

  // ---------- Medizinische Abteilung ----------
  U.screens.medizin = function () {
    var st = U.st, c = U.club(), lvl = c.fac.medizin || 1;
    var inj = W.squad(st, c.id).filter(function (p) { return p.inj; }).concat(W.youthOf(st, c.id).filter(function (p) { return p.inj; }));
    var q = E.level(c, 'medizin').q;
    var h = '<h1>Medizinische Abteilung</h1>' + (U.gfx.medView ? '<div style="margin-bottom:14px">' + U.gfx.medView(c) + '</div>' : '') + '<div class="grid g12"><div class="grid">' + U.facilityCard('medizin', { extra: D.medicalQuotes[lvl] ? '<p class="muted" style="font-style:italic">' + D.medicalQuotes[lvl] + '</p>' : '', effect: 'Bessere Prävention, schnellere Heilung und zuverlässigere Medizinchecks bei Transfers (ab Stufe 2).' }) +
      '<div class="panel"><h2>Wirkung</h2><table class="t small"><tr><td>Verletzungsprävention</td><td class="num">−' + Math.round(q * 6) + ' %</td></tr><tr><td>Kürzere Ausfallzeiten</td><td class="num">−' + Math.round(q * 6) + ' %</td></tr><tr><td>Regeneration pro Woche</td><td class="num">+' + (q * 1.5).toFixed(1) + '</td></tr><tr><td>Medizincheck</td><td class="num">' + (q >= 1 ? Math.round((0.35 + q * 0.13) * 100) + ' % zuverlässig' : 'nicht verfügbar') + '</td></tr></table><p class="muted small">Der Begriff „Schamane“ ist humorvoll gemeint – die Berechnungen bleiben realistisch. Schwere Verletzungen heilen nie sofort.</p></div></div>';
    h += '<div class="panel tight"><div style="padding:12px 14px 0"><h2>Verletzte Spieler (' + inj.length + ')</h2></div>' + U.table('inj', [
      { k: 'last', l: 'Spieler', f: function (p) { return esc(W.playerName(p)); } }, { k: 'pos', l: 'Pos', f: function (p) { return U.posTag(p.pos); } },
      { k: 'type', l: 'Diagnose', v: function (p) { return p.inj.type; }, f: function (p) { return esc(p.inj.type); } },
      { k: 'w', l: 'Ausfall', num: true, v: function (p) { return p.inj.weeks; }, f: function (p) { return p.inj.weeks + ' Wo.'; } },
      { k: 'pr', l: 'Heilung', v: function (p) { return 1 - p.inj.weeks / p.inj.total; }, f: function (p) { return U.bar(p.inj.total - p.inj.weeks, p.inj.total); } }
    ], inj, { click: 'playerInfo' }) + '</div></div>';
    return h;
  };
})(RFM);
