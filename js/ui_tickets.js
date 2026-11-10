// ANPFIFF! / ANWURF! – Ticketpreise & Zuschauerprognose
// Prognose je Platzart (z. B. „Sitzplatz 50 € → 20.000 von 50.000 belegt“) für das nächste Heimspiel und die
// kommenden Heimspiele. Auslastung aus Fanbasis, Erfolg, eigenem Tabellenplatz, Tabellenplatz des Gegners,
// Derby-Brisanz (Entfernung bis 150 km) und Fanfreundschaften. Alle Zahlen kommen direkt aus E.attendance.
(function (R) {
  var U = R.ui, E = R.econ, S = R.season, esc = R.esc, money = R.fmtMoney, num = function (v) { return R.fmtNum(Math.round(v)); };
  var NAMES = { steh: 'Stehplatz', sitz: 'Sitzplatz', vip: 'Logen & Business' };

  // Kommende Heimspiele (Liga) mit Gegner
  U.nextHomeGames = function (st, c, n) {
    var out = [], lg = st.leagues[c.league]; if (!lg) return out;
    var from = st.phase === 'season' ? st.week + 1 : 1;
    for (var w = from; w <= S.SEASON_WEEKS && out.length < n; w++) S.roundsOf(st, c.league, w).forEach(function (r) { (lg.fixtures[r] || []).forEach(function (f) { if (f.h === c.id && out.length < n) out.push({ week: w, opp: st.clubs[f.a], comp: 'league' }); }); });
    return out;
  };
  function badge(mu) {
    if (mu.friend) return '<span class="pill ok">' + U.lc('handshake', 12) + 'Fanfreundschaft</span>';
    if (mu.derby > 0) return '<span class="pill ' + (mu.derby >= 0.6 ? 'bad' : 'warn') + '">' + U.lc('zap', 12) + esc(mu.label) + ' · ' + mu.km + ' km</span>';
    return '<span class="muted small">' + mu.km + ' km</span>';
  }
  function bar(sold, cap, col) { var p = cap ? sold / cap : 0; return '<div class="tk-bar"><i style="width:' + Math.min(100, p * 100).toFixed(1) + '%;background:' + (col || (p > 0.95 ? '#22c55e' : p > 0.7 ? '#84cc16' : p > 0.45 ? '#f5b301' : '#ef4444')) + '"></i></div>'; }

  U.ticketPanel = function (st, c) {
    var games = U.nextHomeGames(st, c, 6), can = U.can('business');
    var g0 = games[0] || { opp: st.clubs[st.leagues[c.league].clubIds.filter(function (x) { return x !== c.id; })[0]], comp: 'league', week: null };
    var h = '<div class="panel tk-panel"><div class="panel-h"><h2>' + U.lc('ticket', 17) + ' Ticketpreise & Zuschauerprognose</h2><span class="muted small">Eintrittsgelder sind eine der wichtigsten Einnahmequellen</span></div>';
    h += '<div id="tkLive">' + live(st, c, g0, can) + '</div>';
    // Kommende Heimspiele
    if (games.length) {
      h += '<h3 style="margin-top:14px">Kommende Heimspiele</h3><table class="t small tk-games"><tr><th>Spieltag</th><th>Gegner</th><th>Begegnung</th><th class="num">Prognose</th><th>Auslastung</th><th class="num">Gäste</th><th class="num">Erlös</th></tr>' +
        games.map(function (g) {
          var a = E.attendance(st, c, g.opp, g.comp), mu = a.matchup;
          return '<tr><td>' + g.week + '.</td><td>' + U.crest(g.opp, 18) + ' ' + esc(g.opp.short) + ' <span class="muted">(' + (a.oppPos || '–') + '.)</span></td><td>' + badge(mu) + '</td><td class="num">' + num(a.total) + ' / ' + num(a.capacity) + '</td><td style="min-width:110px">' + bar(a.total, a.capacity) + '</td><td class="num">' + num(a.guests) + (a.guestQuota ? ' <span class="muted">/ ' + num(a.guestQuota) + '</span>' : '') + '</td><td class="num">' + money(a.ticket + a.cater + a.parking) + '</td></tr>';
        }).join('') + '</table>';
    }
    h += '<p class="muted small" style="margin-top:8px">Der Gastverein erhält 10 % der Tickets (Gästeblöcke im Stadionplan, auch mehrere). Braucht er sie nicht alle, kaufen eigene Fans den Rest – außer im Derby: Dort bleibt die Pufferzone aus Sicherheitsgründen leer. Fanfreundschaften bringen viele Zuschauer und bleiben friedlich (keine Randale, keine Abnutzung im Gästeblock).</p></div>';
    return h;
  };
  function live(st, c, g, can) {
    var a = E.attendance(st, c, g.opp, g.comp), mu = a.matchup, caps = E.capacityParts(c), ref = E.refPrices[c.league];
    var gk = a.guestType, capFor = function (k) { return k === 'vip' ? caps.vip : caps[k] - (k === gk ? a.guestCap : 0); };
    var h = '<div class="tk-head"><div>' + (g.week ? '<b>Nächstes Heimspiel · ' + g.week + '. Spieltag</b>' : '<b>Prognose</b>') + '<div class="row" style="gap:8px;align-items:center;margin-top:4px">' + U.crest(c, 26) + '<span>' + esc(c.short) + ' – ' + esc(g.opp.name) + '</span>' + U.crest(g.opp, 26) + badge(mu) + '</div></div>' +
      '<div class="tk-total"><span>Gesamt</span><b>' + num(a.total) + '</b><small>von ' + num(a.capacity) + ' Plätzen · ' + Math.round(a.total / Math.max(1, a.capacity) * 100) + ' %</small>' + bar(a.total, a.capacity) + '</div></div>';
    h += '<div class="tk-rows">' + ['steh', 'sitz', 'vip'].map(function (k) {
      var cap = capFor(k), sold = a.parts[k] - (k === gk ? a.homeInGuest : 0);
      return '<div class="tk-row"><div class="tk-l"><b>' + NAMES[k] + '</b><small class="muted">üblich ~' + ref[k] + ' €' + (k === 'vip' && caps.biz ? ' · Business zahlt 35 %' : '') + '</small></div>' +
        '<label class="tk-price">' + (can ? '<input type="number" min="1" max="2000" value="' + c.tickets[k] + '" data-inp="tkPrice" data-k="' + k + '">' : '<b>' + c.tickets[k] + '</b>') + ' €</label>' +
        '<div class="tk-f"><div class="tk-txt"><b>' + num(sold) + '</b> von ' + num(cap) + ' belegt <span class="muted">(' + Math.round(sold / Math.max(1, cap) * 100) + ' %)</span></div>' + bar(sold, cap) + '</div></div>';
    }).join('') +
      (a.guestCap ? '<div class="tk-row guest"><div class="tk-l"><b>Gästeblock</b><small class="muted">10 %-Kontingent · ' + NAMES[gk] + 'preis</small></div><div class="tk-price"><b>' + c.tickets[gk] + ' €</b></div><div class="tk-f"><div class="tk-txt"><b>' + num(a.guests) + '</b> Gäste von ' + num(a.guestCap) + ' Tickets' +
        (a.homeInGuest ? ' · <span class="pos">' + num(a.homeInGuest) + ' an eigene Fans verkauft</span>' : '') + (a.guestEmpty && !a.guestFreeOk ? ' · <span class="warn">' + num(a.guestEmpty) + ' bleiben leer (Derby-Sicherheit)</span>' : '') + (a.guestBlocks < a.guestQuota ? ' · <span class="warn">Gästeblöcke kleiner als 10 %</span>' : '') + '</div>' + bar(a.guests + a.homeInGuest, a.guestCap, '#ef4444') + '</div></div>' : '') + '</div>';
    // Einflussfaktoren
    var f = a.factors, pos = st.week >= 3 ? E.leaguePos(st, c) : (c.lastPos || '–');
    var fx = [['users', 'Fanbasis', num(f.fans) + ' Fans'], ['trophy', 'Erfolg & Form', 'Faktor ' + f.sport.toFixed(2).replace('.', ',')], ['chart-column', 'Eigener Tabellenplatz', pos + '.'], ['shield', 'Gegner', esc(g.opp.short) + ' · Platz ' + (a.oppPos || '–') + ' · ×' + f.opp.toFixed(2).replace('.', ',')],
      ['zap', mu.friend ? 'Fanfreundschaft' : 'Derby-Brisanz', mu.friend ? '×' + f.friend.toFixed(2).replace('.', ',') + ' · friedlich' : mu.derby ? Math.round(mu.derby * 100) + ' % · ×' + f.derby.toFixed(2).replace('.', ',') + ' (' + mu.km + ' km)' : 'kein Derby (' + mu.km + ' km)'], ['star', 'Stadionattraktivität', '×' + f.attr.toFixed(2).replace('.', ',')]];
    h += '<div class="tk-fx">' + fx.map(function (x) { return '<div><span class="ic-tile">' + U.lc(x[0], 15) + '</span><div><small>' + x[1] + '</small><b>' + x[2] + '</b></div></div>'; }).join('') + '</div>';
    h += '<div class="tk-sum"><div><small>Eintritt</small><b>' + money(a.ticket) + '</b></div><div><small>Gastronomie</small><b>' + money(a.cater) + '</b></div><div><small>Parken</small><b>' + money(a.parking) + '</b></div><div><small>Erlös gesamt</small><b class="pos">' + money(a.ticket + a.cater + a.parking) + '</b></div><div><small>Zufriedenheit</small><b>' + a.satisfaction + '/100</b></div></div>';
    if (a.congestion > 0.05) h += '<div class="note warn">' + U.lc('triangle-alert', 14) + ' Verkehrsengpass: ' + Math.round(a.congestion * 100) + ' % der Anreisenden stehen im Stau – Verkehrsinfrastruktur ausbauen.</div>';
    // Preis-Erlös-Kurve für die Platzart mit dem größten Anteil
    var k = U.tkCurve || (caps.sitz >= caps.steh ? 'sitz' : 'steh');
    h += curve(st, c, g, k);
    return h;
  }
  function curve(st, c, g, k) {
    var base = c.tickets[k], ref = E.refPrices[c.league][k], pts = [], best = null;
    for (var i = 0; i <= 24; i++) {
      var p = Math.max(1, Math.round(ref * (0.4 + i * 0.075)));
      var old = c.tickets[k]; c.tickets[k] = p; var a = E.attendance(st, c, g.opp, g.comp); c.tickets[k] = old;
      var rev = a.ticket; pts.push({ p: p, rev: rev, att: a.total }); if (!best || rev > best.rev) best = pts[pts.length - 1];
    }
    var W = 520, H = 120, L = 54, mxR = Math.max.apply(null, pts.map(function (x) { return x.rev; })) || 1, mxA = Math.max.apply(null, pts.map(function (x) { return x.att; })) || 1, mnP = pts[0].p, mxP = pts[pts.length - 1].p;
    var X = function (p) { return L + (p - mnP) / Math.max(1, mxP - mnP) * (W - L - 8); }, Yr = function (v) { return 8 + (1 - v / mxR) * (H - 26); }, Ya = function (v) { return 8 + (1 - v / mxA) * (H - 26); };
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" class="tk-curve"><polyline fill="none" stroke="#22c55e" stroke-width="2.2" points="' + pts.map(function (x) { return X(x.p).toFixed(1) + ',' + Yr(x.rev).toFixed(1); }).join(' ') + '"/><polyline fill="none" stroke="#60a5fa" stroke-width="1.6" stroke-dasharray="4 3" points="' + pts.map(function (x) { return X(x.p).toFixed(1) + ',' + Ya(x.att).toFixed(1); }).join(' ') + '"/>' +
      '<line x1="' + X(base) + '" x2="' + X(base) + '" y1="6" y2="' + (H - 18) + '" stroke="#fbbf24" stroke-width="1.5"/><text x="' + X(base) + '" y="' + (H - 6) + '" font-size="10" fill="#fbbf24" text-anchor="middle">aktuell ' + base + ' €</text>' +
      '<circle cx="' + X(best.p) + '" cy="' + Yr(best.rev) + '" r="4" fill="#22c55e"/><text x="' + L + '" y="' + (H - 6) + '" font-size="10" fill="#94a3b8">' + mnP + ' €</text><text x="' + (W - 8) + '" y="' + (H - 6) + '" font-size="10" fill="#94a3b8" text-anchor="end">' + mxP + ' €</text>' +
      '<text x="' + (L - 6) + '" y="14" font-size="10" fill="#94a3b8" text-anchor="end">' + money(mxR) + '</text></svg>';
    return '<div class="tk-curve-box"><div class="row between"><b class="small">Preis-Erlös-Kurve</b><div class="seg">' + ['steh', 'sitz', 'vip'].map(function (x) { return '<button class="sm ' + (x === k ? 'on' : '') + '" data-act="tkCurve" data-k="' + x + '">' + NAMES[x] + '</button>'; }).join('') + '</div></div>' + svg +
      '<div class="rt-legend"><span><i style="background:#22c55e"></i>Eintrittserlös</span><span><i style="background:#60a5fa"></i>Zuschauer gesamt</span><span><i style="background:#fbbf24"></i>aktueller Preis</span></div>' +
      '<p class="small">Erlösoptimum für ' + NAMES[k] + ' bei etwa <b>' + best.p + ' €</b> (' + money(best.rev) + ' Eintritt, ' + num(best.att) + ' Zuschauer). Niedrigere Preise füllen das Stadion und steigern Stimmung und Gastronomie.</p></div>';
  }
  function refreshLive() {
    var st = U.st, c = U.club(), games = U.nextHomeGames(st, c, 1), g0 = games[0] || { opp: st.clubs[st.leagues[c.league].clubIds.filter(function (x) { return x !== c.id; })[0]], comp: 'league', week: null };
    var box = document.getElementById('tkLive'); if (!box) return;
    var act = document.activeElement, key = act && act.dataset ? act.dataset.k : null, pos = act && act.selectionStart;
    box.innerHTML = live(st, c, g0, U.can('business'));
    if (key) { var el = box.querySelector('input[data-k="' + key + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { /* number-Felder */ } } }
  }
  U.acts.tkPrice = function (d, el) { if (!U.can('business')) return; var v = Math.round(+el.value); if (!(v >= 1)) return; U.club().tickets[d.k] = R.clamp(v, 1, 2000); clearTimeout(U._tkT); U._tkT = setTimeout(refreshLive, 180); };
  U.acts.tkCurve = function (d) { U.tkCurve = d.k; refreshLive(); };
})(RFM);
