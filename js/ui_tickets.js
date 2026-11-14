// ANWURF! / ANPFIFF! – Ticketpreise, Dauerkarten & Zuschauerprognose
// Prognose je Platzart (z. B. „Sitzplatz 50 € → 20.000 von 50.000 belegt“) für das nächste Heimspiel und die
// kommenden Heimspiele. Auslastung aus Fanbasis, Erfolg, eigenem Tabellenplatz, Tabellenplatz des Gegners,
// Derby-Brisanz (Entfernung bis 150 km) und Fanfreundschaften. Alle Zahlen kommen direkt aus E.attendance.
// Platzarten: Stehplatz, Sitzplatz, Business-Seat (Tribünenplatz mit Essen im Halleninneren, Preis je Spiel),
// Loge (Privatraum für 12 Gäste mit eigenem Catering, Saisonmiete). Dauerkarten für Steh- und Sitzplätze mit Limit.
(function (R) {
  var U = R.ui, E = R.econ, S = R.season, esc = R.esc, money = R.fmtMoney, num = function (v) { return R.fmtNum(Math.round(v)); };
  var NAMES = { steh: 'Stehplatz', sitz: 'Sitzplatz', biz: 'Business-Seat', loge: 'Loge', dksteh: 'Dauerkarte Steh', dksitz: 'Dauerkarte Sitz' };
  var DESC = { steh: 'Tageskarte je Spiel', sitz: 'Tageskarte je Spiel', biz: 'Tribünenplatz inkl. Essen im Halleninneren · je Spiel', loge: 'Privatraum für ' + E.LOGE_SEATS + ' Gäste, eigenes Catering · Saisonmiete' };
  function lk(c) { return R.world.lk ? R.world.lk(c) : c.league; } // ANWURF!: 3. Liga in Staffeln
  function shortMoney(v) { v = Math.round(v); return v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 0 : 1).replace('.', ',') + ' Mio' : v >= 1e4 ? Math.round(v / 1000) + ' Tsd' : R.fmtNum(v); }
  function shortNum(v) { return v >= 1e4 ? Math.round(v / 1000) + ' Tsd' : R.fmtNum(Math.round(v)); }

  // Kommende Heimspiele (Liga) mit Gegner
  U.nextHomeGames = function (st, c, n) {
    var out = [], lg = st.leagues[lk(c)]; if (!lg) return out;
    var from = st.phase === 'season' ? st.week + 1 : 1;
    for (var w = from; w <= S.SEASON_WEEKS && out.length < n; w++) S.roundsOf(st, lk(c), w).forEach(function (r) { (lg.fixtures[r] || []).forEach(function (f) { if (f.h === c.id && out.length < n) out.push({ week: w, opp: st.clubs[f.a], comp: 'league' }); }); });
    return out;
  };
  function badge(mu) {
    if (mu.friend) return '<span class="pill ok">' + U.lc('handshake', 12) + 'Fanfreundschaft</span>';
    if (mu.derby > 0) return '<span class="pill ' + (mu.derby >= 0.6 ? 'bad' : 'warn') + '">' + U.lc('zap', 12) + esc(mu.label) + ' · ' + mu.km + ' km</span>';
    return '<span class="muted small">' + mu.km + ' km</span>';
  }
  function bar(sold, cap, col, hold) {
    var p = cap ? sold / cap : 0, hp = cap && hold ? Math.min(sold, hold) / cap : 0;
    return '<div class="tk-bar">' + (hp ? '<i style="width:' + (hp * 100).toFixed(1) + '%;background:#a78bfa;float:left;border-radius:6px 0 0 6px"></i>' : '') + '<i style="width:' + Math.max(0, Math.min(100, (p - hp) * 100)).toFixed(1) + '%;background:' + (col || (p > 0.95 ? '#22c55e' : p > 0.7 ? '#84cc16' : p > 0.45 ? '#f5b301' : '#ef4444')) + (hp ? ';float:left;border-radius:0 6px 6px 0' : '') + '"></i></div>';
  }
  function nextGame(st, c) {
    var games = U.nextHomeGames(st, c, 1);
    return games[0] || { opp: st.clubs[st.leagues[lk(c)].clubIds.filter(function (x) { return x !== c.id; })[0]], comp: 'league', week: null };
  }

  U.ticketPanel = function (st, c) {
    E.ensureTix(c);
    var games = U.nextHomeGames(st, c, 6), can = U.can('business');
    var h = '<div class="panel tk-panel"><div class="panel-h"><h2>' + U.lc('ticket', 17) + ' Ticketpreise & Zuschauerprognose</h2><span class="muted small">Eintrittsgelder sind eine der wichtigsten Einnahmequellen</span></div>';
    h += '<div id="tkLive">' + live(st, c, nextGame(st, c), can) + '</div>';
    if (games.length) {
      h += '<h3 style="margin-top:14px">Kommende Heimspiele</h3><table class="t small tk-games"><tr><th>Spieltag</th><th>Gegner</th><th>Begegnung</th><th class="num">Prognose</th><th>Auslastung</th><th class="num">Gäste</th><th class="num">Erlös je Spiel</th></tr>' +
        games.map(function (g) {
          var a = E.attendance(st, c, g.opp, g.comp), mu = a.matchup;
          return '<tr><td>' + g.week + '.</td><td>' + U.crest(g.opp, 18) + ' ' + esc(g.opp.short) + ' <span class="muted">(' + (a.oppPos || '–') + '.)</span></td><td>' + badge(mu) + '</td><td class="num">' + num(a.total) + ' / ' + num(a.capacity) + '</td><td style="min-width:110px">' + bar(a.total, a.capacity) + '</td><td class="num">' + num(a.guests) + (a.guestQuota ? ' <span class="muted">/ ' + num(a.guestQuota) + '</span>' : '') + '</td><td class="num">' + money(a.ticket + a.cater + a.parking) + '</td></tr>';
        }).join('') + '</table>';
    }
    h += '<p class="muted small" style="margin-top:8px">Der Gastverein erhält 10 % der Tickets (Gästeblöcke im Hallenplan, auch mehrere). Braucht er sie nicht alle, kaufen eigene Fans den Rest – außer im Derby: Dort bleibt die Pufferzone aus Sicherheitsgründen leer. Fanfreundschaften bringen viele Zuschauer und bleiben friedlich. Dauerkarten und Logen werden vor dem 1. Spieltag verkauft und sofort bezahlt; der Erlös je Spiel enthält nur Tageskarten, Business-Seats, Gastronomie und Parken.</p></div>';
    return h;
  };

  // ---------- Preiskurven ----------
  // Einzelpreis-Kurve: Erlös und Besucher der gewählten Platzart (andere Preise und Dauerkarten bleiben fest)
  function sweep(st, c, g, k, a0) {
    var ref = E.refPrices[c.league][k], pts = [], old = c.tickets[k], hold = { steh: a0.holders.steh, sitz: a0.holders.sitz }, logen = a0.holders.logen;
    var lo = Math.max(1, ref * 0.3), hi = Math.max(ref * 2.6, old * 1.3), N = 36;
    for (var i = 0; i <= N; i++) {
      var p = lo + (hi - lo) * i / N; p = k === 'loge' ? R.round(p, 500) : p >= 100 ? R.round(p, 5) : Math.max(1, Math.round(p));
      if (pts.length && pts[pts.length - 1].p === p) continue;
      if (k === 'loge') { var n = E.logeRented(st, c, p); pts.push({ p: p, rev: n * p, att: n, cap: a0.logeBoxes }); continue; }
      c.tickets[k] = p;
      var a = E.attendance(st, c, g.opp, g.comp, { holders: hold, logen: logen });
      if (k === 'biz') pts.push({ p: p, rev: a.resBiz * p, att: a.resBiz, cap: a.bizCap });
      else pts.push({ p: p, rev: a.dayTk[k] * p, att: a.parts[k], cap: a.capK[k] });
    }
    c.tickets[k] = old;
    return pts;
  }
  // Dauerkarten-Kurve: Saisonerlös der Platzart (Dauerkarten + verbleibende Tageskarten) je Dauerkartenpreis
  function sweepST(c, k, base) {
    var sx = c.seasonTix[k], single = c.tickets[k] * base.games, pts = [], lo = Math.max(10, single * 0.25), hi = Math.max(single * 1.25, sx.price * 1.2), N = 36;
    for (var i = 0; i <= N; i++) {
      var p = R.round(lo + (hi - lo) * i / N, 5); if (pts.length && pts[pts.length - 1].p === p) continue;
      var r = E.stSeasonRevenue(c, k, base, p, sx.limit); pts.push({ p: p, rev: r.total, att: r.sold, cap: Math.round((base.cap[k] || 0) * E.ST_MAX_SHARE), st: r.stRev });
    }
    return pts;
  }
  // Kennzahlen einer Kurve: Optimum, optimaler Bereich (≥ 97 % des Höchsterlöses), „volles Haus bis“
  function analyse(pts) {
    var best = pts[0]; pts.forEach(function (x) { if (x.rev > best.rev) best = x; });
    var good = pts.filter(function (x) { return x.rev >= best.rev * 0.97; }), full = pts.filter(function (x) { return x.cap && x.att >= x.cap * 0.99; });
    var maxAtt = pts[0]; pts.forEach(function (x) { if (x.att > maxAtt.att) maxAtt = x; });
    var peak = pts.filter(function (x) { return x.att >= maxAtt.att * 0.995; });
    return { best: best, lo: good[0].p, hi: good[good.length - 1].p, full: full.length ? full[full.length - 1] : null, maxAtt: peak[peak.length - 1] };
  }
  function eur(k, p) { return (k === 'loge' || k.indexOf('dk') === 0 ? R.fmtNum(p) : p) + ' €'; }
  function chart(pts, an, cur, k, attLabel) {
    var W = 620, H = 190, L = 58, Rr = 50, T = 12, B = 34, iw = W - L - Rr, ih = H - T - B;
    var mxR = Math.max.apply(null, pts.map(function (x) { return x.rev; })) || 1, mxA = Math.max(1, Math.max.apply(null, pts.map(function (x) { return Math.max(x.att, x.cap || 0); })));
    var mnP = pts[0].p, mxP = pts[pts.length - 1].p;
    var X = function (p) { return L + (R.clamp(p, mnP, mxP) - mnP) / Math.max(1, mxP - mnP) * iw; }, Yr = function (v) { return T + (1 - v / mxR) * ih; }, Ya = function (v) { return T + (1 - v / mxA) * ih; };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" class="tk-curve" font-family="inherit">';
    // optimaler Bereich
    s += '<rect x="' + X(an.lo).toFixed(1) + '" y="' + T + '" width="' + Math.max(3, X(an.hi) - X(an.lo)).toFixed(1) + '" height="' + ih + '" fill="#22c55e" opacity=".14"/>';
    // Raster und Achsen (links Erlös, rechts Besucher)
    for (var i = 0; i <= 4; i++) {
      var y = T + ih * i / 4;
      s += '<line x1="' + L + '" x2="' + (L + iw) + '" y1="' + y + '" y2="' + y + '" stroke="#94a3b8" stroke-opacity=".15"/>' +
        '<text x="' + (L - 6) + '" y="' + (y + 3.5) + '" font-size="10" fill="#4ade80" text-anchor="end">' + shortMoney(mxR * (1 - i / 4)) + '</text>' +
        '<text x="' + (L + iw + 6) + '" y="' + (y + 3.5) + '" font-size="10" fill="#93c5fd">' + shortNum(mxA * (1 - i / 4)) + '</text>';
    }
    for (var j = 0; j <= 5; j++) { var pp = mnP + (mxP - mnP) * j / 5, xx = X(pp); s += '<line x1="' + xx + '" x2="' + xx + '" y1="' + (T + ih) + '" y2="' + (T + ih + 4) + '" stroke="#94a3b8"/><text x="' + xx + '" y="' + (T + ih + 15) + '" font-size="10" fill="#94a3b8" text-anchor="' + (j === 0 ? 'start' : j === 5 ? 'end' : 'middle') + '">' + eur(k, Math.round(pp)) + '</text>'; }
    var capV = pts[0].cap; if (capV) s += '<line x1="' + L + '" x2="' + (L + iw) + '" y1="' + Ya(capV) + '" y2="' + Ya(capV) + '" stroke="#93c5fd" stroke-opacity=".5" stroke-dasharray="2 3"/>';
    s += '<polyline fill="none" stroke="#60a5fa" stroke-width="1.8" stroke-dasharray="5 3" points="' + pts.map(function (x) { return X(x.p).toFixed(1) + ',' + Ya(x.att).toFixed(1); }).join(' ') + '"/>';
    s += '<polyline fill="none" stroke="#22c55e" stroke-width="2.4" points="' + pts.map(function (x) { return X(x.p).toFixed(1) + ',' + Yr(x.rev).toFixed(1); }).join(' ') + '"/>';
    if (an.full) s += '<line x1="' + X(an.full.p) + '" x2="' + X(an.full.p) + '" y1="' + T + '" y2="' + (T + ih) + '" stroke="#60a5fa" stroke-width="1.2" stroke-dasharray="3 3"/>';
    s += '<line x1="' + X(cur) + '" x2="' + X(cur) + '" y1="' + T + '" y2="' + (T + ih) + '" stroke="#fbbf24" stroke-width="1.6"/>';
    s += '<circle cx="' + X(an.best.p) + '" cy="' + Yr(an.best.rev) + '" r="4.5" fill="#22c55e" stroke="#0b1220" stroke-width="1.5"/>';
    s += '<text x="' + (L + iw / 2) + '" y="' + (H - 3) + '" font-size="10" fill="#94a3b8" text-anchor="middle">Preis</text></svg>';
    return s + '<div class="rt-legend"><span><i style="background:#22c55e"></i>Erlös</span><span><i style="background:#60a5fa"></i>' + attLabel + '</span><span><i style="background:rgba(34,197,94,.35)"></i>optimaler Preisbereich</span><span><i style="background:#fbbf24"></i>aktueller Preis</span>' + (an.full ? '<span><i style="background:#60a5fa;opacity:.6"></i>volles Haus bis</span>' : '') + '</div>';
  }
  function keysFor(a0) { return ['steh', 'sitz'].concat(a0.bizCap ? ['biz'] : [], a0.logeBoxes ? ['loge'] : [], ['dksteh', 'dksitz']); }
  function curveOf(st, c, g, a0, k, base) { var dk = k.indexOf('dk') === 0, kk = dk ? k.slice(2) : k, pts = dk ? sweepST(c, kk, base) : sweep(st, c, g, kk, a0); return { dk: dk, kk: kk, pts: pts, an: analyse(pts), cur: dk ? c.seasonTix[kk].price : c.tickets[kk] }; }
  function curveBox(st, c, g, a0, k, base) {
    var cv = curveOf(st, c, g, a0, k, base), an = cv.an, kk = cv.kk, dk = cv.dk, cur = cv.cur, unit = kk === 'loge' ? 'Logen' : dk ? 'Dauerkarten' : 'Zuschauer';
    var h = '<div class="tk-curve-box"><div class="row between" style="flex-wrap:wrap;gap:6px"><b class="small">Preis-Erlös-Kurve · ' + NAMES[k] + '</b><div class="seg">' + keysFor(a0).map(function (x) { return '<button class="sm ' + (x === k ? 'on' : '') + '" data-act="tkCurve" data-k="' + x + '">' + NAMES[x] + '</button>'; }).join('') + '</div></div>';
    h += chart(cv.pts, an, cur, k, unit + (kk === 'loge' ? ' vermietet' : dk ? ' verkauft' : ' (' + NAMES[kk] + ')'));
    var per = kk === 'loge' || dk ? ' je Saison' : ' je Spiel';
    h += '<div class="tk-opt"><div><small>Optimaler Preisbereich</small><b class="pos">' + eur(k, an.lo) + (an.hi !== an.lo ? ' – ' + eur(k, an.hi) : '') + '</b></div>' +
      '<div><small>Erlösoptimum</small><b>' + eur(k, an.best.p) + '</b><span class="muted small">' + money(an.best.rev) + per + ' · ' + num(an.best.att) + ' ' + unit + '</span></div>' +
      '<div><small>Meiste ' + unit + '</small><b>' + (an.full ? 'bis ' + eur(k, an.full.p) : (an.maxAtt.p > cv.pts[0].p ? 'bis ' : '') + eur(k, an.maxAtt.p)) + '</b><span class="muted small">' + (an.full ? 'ausverkauft (' + num(an.full.cap) + ')' : num(an.maxAtt.att) + ' von ' + num(an.maxAtt.cap) + ' – nicht ausverkauft') + '</span></div>' +
      '<div><small>Aktuell</small><b style="color:#fbbf24">' + eur(k, cur) + '</b><span class="muted small">' + (cur < an.lo ? 'unter dem Optimum' : cur > an.hi ? 'über dem Optimum' : 'im optimalen Bereich') + '</span></div></div>';
    h += '<p class="muted small" style="margin:6px 0 0">' + (dk ? 'Saisonerlös dieser Platzart = Dauerkarten + verbleibende Tageskarten (Durchschnittsspiel). Billige Dauerkarten verdrängen teurere Tageskarten, sichern aber Einnahmen und volle Ränge auch gegen schwache Gegner.' : kk === 'loge' ? 'Logen werden für die ganze Saison vermietet. Der Erlös fließt vor dem 1. Spieltag.' : 'Grüner Bereich: Erlös mindestens 97 % des Optimums. Niedrigere Preise füllen die Halle und steigern Stimmung, Fanwachstum und Gastronomie.') + '</p></div>';
    return h;
  }
  // Übersicht: Preisempfehlung je Platzart
  function recoTable(st, c, g, a0, base) {
    return '<h3 style="margin-top:14px">' + U.lc('target', 15) + ' Preisempfehlung je Platzart</h3><div class="tk-scroll"><table class="t small tk-reco"><tr><th>Platzart</th><th class="num">Aktuell</th><th class="num">Meiste Besucher</th><th class="num">Optimaler Bereich</th><th class="num">Optimum</th><th class="num">Erlös im Optimum</th></tr>' +
      keysFor(a0).map(function (k) {
        var cv = curveOf(st, c, g, a0, k, base), an = cv.an, cls = cv.cur < an.lo || cv.cur > an.hi ? 'warn' : 'pos';
        return '<tr><td><b>' + NAMES[k] + '</b></td><td class="num ' + cls + '">' + eur(k, cv.cur) + '</td><td class="num">' + (an.full ? 'voll bis ' + eur(k, an.full.p) : eur(k, an.maxAtt.p)) + '</td><td class="num pos">' + eur(k, an.lo) + (an.hi !== an.lo ? ' – ' + eur(k, an.hi) : '') + '</td><td class="num"><b>' + eur(k, an.best.p) + '</b></td><td class="num">' + money(an.best.rev) + (cv.kk === 'loge' || cv.dk ? ' / Saison' : ' / Spiel') + '</td></tr>';
      }).join('') + '</table></div>';
  }

  // ---------- Dauerkarten & Logen ----------
  function seasonBox(st, c, a0, base, can) {
    var sx = c.seasonTix, sold = sx.sold && sx.sold.season === st.season ? sx.sold : null, pre = st.phase === 'preseason';
    var h = '<h3 style="margin-top:14px">' + U.lc('calendar-check', 15) + ' Dauerkarten & Logen</h3>';
    h += '<div class="note small" style="margin-bottom:8px">' + (sold ? U.lc('lock', 13) + ' Verkauf für diese Saison abgeschlossen: <b>' + num(sold.steh + sold.sitz) + '</b> Dauerkarten (' + money(sold.stRev) + ') und <b>' + sold.logen + '</b> Logen (' + money(sold.logeRev) + '). Neue Preise und Limits gelten für den Verkauf vor der nächsten Saison.' : pre ? U.lc('info', 13) + ' Der Verkauf läuft in der Vorbereitung und wird zum 1. Spieltag abgerechnet – Preise und Limits jetzt festlegen.' : U.lc('info', 13) + ' Der nächste Verkauf startet in der Vorbereitung der neuen Saison.') + '</div>';
    h += '<div class="tk-rows">' + ['steh', 'sitz'].map(function (k) {
      var r = E.stSeasonRevenue(c, k, base, sx[k].price, sx[k].limit), cap = Math.round((base.cap[k] || 0) * E.ST_MAX_SHARE), dem = Math.round(E.stDemand(c, k, base, sx[k].price));
      var disc = 1 - sx[k].price / Math.max(1, c.tickets[k] * base.games);
      return '<div class="tk-row dk"><div class="tk-l"><b>' + NAMES['dk' + k] + '</b><small class="muted">' + base.games + ' Heimspiele · ' + (disc >= 0 ? Math.round(disc * 100) + ' % Rabatt' : Math.round(-disc * 100) + ' % teurer') + ' ggü. Tageskarten</small></div>' +
        '<div class="tk-price col">' + (can ? '<label><input type="number" min="10" max="20000" value="' + sx[k].price + '" data-inp="tkSt" data-k="' + k + '" data-f="price"> €</label><label class="small muted">Limit <input type="number" min="0" placeholder="∞" title="Leer lassen = unbegrenzt" value="' + (sx[k].limit == null ? '' : sx[k].limit) + '" data-inp="tkSt" data-k="' + k + '" data-f="limit"></label>' : '<b>' + num(sx[k].price) + ' €</b><small>Limit ' + (sx[k].limit == null ? 'unbegrenzt' : num(sx[k].limit)) + '</small>') + '</div>' +
        '<div class="tk-f"><div class="tk-txt">' + (sold ? 'verkauft <b>' + num(sold[k]) + '</b> · ' : '') + 'Prognose <b>' + num(r.sold) + '</b> Dauerkarten · <b>' + money(r.stRev) + '</b> <span class="muted">(Nachfrage ' + num(dem) + ' · höchstens ' + num(cap) + ' = 85 % der Plätze' + (sx[k].limit != null ? ' · Limit ' + num(sx[k].limit) : '') + ')</span></div>' + bar(r.sold, cap, '#a78bfa') + '</div></div>';
    }).join('');
    if (a0.logeBoxes) {
      var n = E.logeRented(st, c, c.tickets.loge);
      h += '<div class="tk-row dk"><div class="tk-l"><b>Logen</b><small class="muted">Saisonmiete je Loge (' + E.LOGE_SEATS + ' Plätze)</small></div><div class="tk-price"><b>' + num(c.tickets.loge) + ' €</b></div><div class="tk-f"><div class="tk-txt">' + (sold ? 'vermietet <b>' + sold.logen + '</b> · ' : '') + 'Prognose <b>' + n + '</b> von ' + a0.logeBoxes + ' Logen · <b>' + money(n * c.tickets.loge) + '</b> je Saison</div>' + bar(n, a0.logeBoxes, '#eab308') + '</div></div>';
    }
    return h + '</div><p class="muted small" style="margin-top:6px">Dauerkarten-Inhaber haben ihren Platz bei jedem Heimspiel sicher (lila im Balken), Tageskarten gibt es nur für die übrigen Plätze. Mit dem Limit begrenzt du den Verkauf, damit genug teurere Tageskarten bleiben (leer = unbegrenzt).</p>';
  }

  function live(st, c, g, can) {
    var a = E.attendance(st, c, g.opp, g.comp), mu = a.matchup, caps = E.capacityParts(c), ref = E.refPrices[c.league], base = E.tixBase(st, c);
    var gk = a.guestType;
    var h = '<div class="tk-head"><div>' + (g.week ? '<b>Nächstes Heimspiel · ' + g.week + '. Spieltag</b>' : '<b>Prognose</b>') + '<div class="row" style="gap:8px;align-items:center;margin-top:4px">' + U.crest(c, 26) + '<span>' + esc(c.short) + ' – ' + esc(g.opp.name) + '</span>' + U.crest(g.opp, 26) + badge(mu) + '</div></div>' +
      '<div class="tk-total"><span>Gesamt</span><b>' + num(a.total) + '</b><small>von ' + num(a.capacity) + ' Plätzen · ' + Math.round(a.total / Math.max(1, a.capacity) * 100) + ' %</small>' + bar(a.total, a.capacity) + '</div></div>';
    var rows = ['steh', 'sitz'].map(function (k) {
      var cap = a.capK[k], sold = a.parts[k] - (k === gk ? a.homeInGuest : 0), hold = Math.min(cap, a.holders[k] || 0);
      return '<div class="tk-row"><div class="tk-l"><b>' + NAMES[k] + '</b><small class="muted">' + DESC[k] + ' · üblich ~' + ref[k] + ' €</small></div>' +
        '<label class="tk-price">' + (can ? '<input type="number" min="1" max="5000" value="' + c.tickets[k] + '" data-inp="tkPrice" data-k="' + k + '">' : '<b>' + c.tickets[k] + '</b>') + ' €</label>' +
        '<div class="tk-f"><div class="tk-txt"><b>' + num(sold) + '</b> von ' + num(cap) + ' belegt <span class="muted">(' + Math.round(sold / Math.max(1, cap) * 100) + ' %' + (hold ? ' · davon ' + num(hold) + ' Dauerkarten' + (a.holders.sold ? '' : ' (Prognose)') : '') + ')</span></div>' + bar(sold, cap, null, hold) + '</div></div>';
    });
    if (a.bizCap) rows.push('<div class="tk-row"><div class="tk-l"><b>' + U.lc('briefcase', 13) + ' Business-Seats</b><small class="muted">' + DESC.biz + ' · üblich ~' + ref.biz + ' €</small></div>' +
      '<label class="tk-price">' + (can ? '<input type="number" min="1" max="5000" value="' + c.tickets.biz + '" data-inp="tkPrice" data-k="biz">' : '<b>' + c.tickets.biz + '</b>') + ' €</label>' +
      '<div class="tk-f"><div class="tk-txt"><b>' + num(a.resBiz) + '</b> von ' + num(a.bizCap) + ' belegt <span class="muted">(' + Math.round(a.resBiz / Math.max(1, a.bizCap) * 100) + ' %)</span></div>' + bar(a.resBiz, a.bizCap) + '</div></div>');
    if (a.logeBoxes) rows.push('<div class="tk-row"><div class="tk-l"><b>' + U.lc('crown', 13) + ' Logen</b><small class="muted">' + DESC.loge + ' · üblich ~' + num(ref.loge) + ' €</small></div>' +
      '<label class="tk-price">' + (can ? '<input type="number" min="1000" max="2000000" step="1000" value="' + c.tickets.loge + '" data-inp="tkPrice" data-k="loge">' : '<b>' + num(c.tickets.loge) + '</b>') + ' €</label>' +
      '<div class="tk-f"><div class="tk-txt"><b>' + (a.holders.logen || 0) + '</b> von ' + a.logeBoxes + ' Logen vermietet' + (a.holders.sold ? '' : ' <span class="muted">(Prognose)</span>') + ' <span class="muted">· ' + num(a.resLoge) + ' Gäste je Spiel</span></div>' + bar(a.holders.logen || 0, a.logeBoxes, '#eab308') + '</div></div>');
    if (a.guestCap) rows.push('<div class="tk-row guest"><div class="tk-l"><b>Gästeblock</b><small class="muted">10 %-Kontingent · ' + NAMES[gk] + 'preis</small></div><div class="tk-price"><b>' + c.tickets[gk] + ' €</b></div><div class="tk-f"><div class="tk-txt"><b>' + num(a.guests) + '</b> Gäste von ' + num(a.guestCap) + ' Tickets' +
      (a.homeInGuest ? ' · <span class="pos">' + num(a.homeInGuest) + ' an eigene Fans verkauft</span>' : '') + (a.guestEmpty && !a.guestFreeOk ? ' · <span class="warn">' + num(a.guestEmpty) + ' bleiben leer (Derby-Sicherheit)</span>' : '') + (a.guestBlocks < a.guestQuota ? ' · <span class="warn">Gästeblöcke kleiner als 10 %</span>' : '') + '</div>' + bar(a.guests + a.homeInGuest, a.guestCap, '#ef4444') + '</div></div>');
    h += '<div class="tk-rows">' + rows.join('') + '</div>';
    // Einflussfaktoren
    var f = a.factors, pos = st.week >= 3 ? E.leaguePos(st, c) : (c.lastPos || '–');
    var fx = [['users', 'Fanbasis', num(f.fans) + ' Fans'], ['trophy', 'Erfolg & Form', 'Faktor ' + f.sport.toFixed(2).replace('.', ',')], ['chart-column', 'Eigener Tabellenplatz', pos + '.'], ['shield', 'Gegner', esc(g.opp.short) + ' · Platz ' + (a.oppPos || '–') + ' · ×' + f.opp.toFixed(2).replace('.', ',')],
      ['zap', mu.friend ? 'Fanfreundschaft' : 'Derby-Brisanz', mu.friend ? '×' + f.friend.toFixed(2).replace('.', ',') + ' · friedlich' : mu.derby ? Math.round(mu.derby * 100) + ' % · ×' + f.derby.toFixed(2).replace('.', ',') + ' (' + mu.km + ' km)' : 'kein Derby (' + mu.km + ' km)'], ['star', 'Hallenattraktivität', '×' + f.attr.toFixed(2).replace('.', ',')]];
    h += '<div class="tk-fx">' + fx.map(function (x) { return '<div><span class="ic-tile">' + U.lc(x[0], 15) + '</span><div><small>' + x[1] + '</small><b>' + x[2] + '</b></div></div>'; }).join('') + '</div>';
    h += '<div class="tk-sum"><div><small>Eintritt (Tageskarten, Business)</small><b>' + money(a.ticket) + '</b></div><div><small>Gastronomie</small><b>' + money(a.cater) + '</b></div><div><small>Parken</small><b>' + money(a.parking) + '</b></div><div><small>Erlös je Spiel</small><b class="pos">' + money(a.ticket + a.cater + a.parking) + '</b></div><div><small>Zufriedenheit</small><b>' + a.satisfaction + '/100</b></div></div>';
    if (a.congestion > 0.05) h += '<div class="note warn">' + U.lc('triangle-alert', 14) + ' Verkehrsengpass: ' + Math.round(a.congestion * 100) + ' % der Anreisenden stehen im Stau – Verkehrsinfrastruktur ausbauen.</div>';
    var k = U.tkCurve || (caps.sitz >= caps.steh ? 'sitz' : 'steh');
    if ((k === 'biz' && !a.bizCap) || (k === 'loge' && !a.logeBoxes) || !NAMES[k]) k = 'sitz';
    h += curveBox(st, c, g, a, k, base);
    h += recoTable(st, c, g, a, base);
    h += seasonBox(st, c, a, base, can);
    return h;
  }
  function refreshLive() {
    var st = U.st, c = U.club(), box = document.getElementById('tkLive'); if (!box) return;
    var act = document.activeElement, ds = act && act.dataset ? act.dataset : {}, pos = act && act.selectionStart;
    box.innerHTML = live(st, c, nextGame(st, c), U.can('business'));
    if (ds.inp) { var el = box.querySelector('input[data-inp="' + ds.inp + '"][data-k="' + ds.k + '"]' + (ds.f ? '[data-f="' + ds.f + '"]' : '')); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) { /* number-Felder */ } } }
  }
  U.acts.tkPrice = function (d, el) { if (!U.can('business')) return; var v = Math.round(+el.value); if (!(v >= 1)) return; U.club().tickets[d.k] = R.clamp(v, 1, d.k === 'loge' ? 2000000 : 5000); clearTimeout(U._tkT); U._tkT = setTimeout(refreshLive, 250); };
  U.acts.tkSt = function (d, el) {
    if (!U.can('business')) return; var sx = E.ensureTix(U.club())[d.k];
    if (d.f === 'limit') { if (el.value === '') sx.limit = null; else { var l = Math.round(+el.value); if (!(l >= 0)) return; sx.limit = l; } }
    else { var v = Math.round(+el.value); if (!(v >= 10)) return; sx.price = R.clamp(v, 10, 20000); }
    clearTimeout(U._tkT); U._tkT = setTimeout(refreshLive, 250);
  };
  U.acts.tkCurve = function (d) { U.tkCurve = d.k; refreshLive(); };
})(RFM);
