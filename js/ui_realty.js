// ANPFIFF! / ANWURF! – Oberfläche Immobilien (Bank & Finanzen → Immobilien)
// Untermenüs: Portfolio, Immobilienmarkt, Bauprojekte, Finanzierung. Alle Zahlen kommen aus R.realty (keine Vorschau-Sonderrechnungen).
(function (R) {
  var U = R.ui, RE = R.realty, E = R.econ, esc = R.esc || function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (v) { return R.fmtMoney(v); };
  var pct = function (v, d) { return (v * 100).toFixed(d == null ? 1 : d).replace('.', ',') + ' %'; };
  var num = function (v) { return R.fmtNum(Math.round(v)); };
  var RISK = ['', 'Gering', 'Mittel', 'Erhöht'], RISKC = ['', 'ok', 'warn', 'bad'];

  // ---------- Architekturillustration (Wohn-/Bürogebäude, Bauphasen) ----------
  function hsh(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  U.realtyArt = function (o, w, h, phase) {
    w = w || 320; h = h || 150;
    var seed = hsh(o.id || o.name), use = o.use, land = o.mode === 'land' || o.status === 'land', id = 'ra' + seed % 100000;
    var dusk = seed % 3 === 0, floors = use === 'gewerbe' ? 6 + seed % 5 : 4 + seed % 3, ph = phase == null ? 6 : phase;
    var sky = dusk ? ['#1d2b4f', '#e9a46b'] : ['#5b9ad8', '#d7e9f7'];
    var g = '<svg viewBox="0 0 320 150" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<linearGradient id="' + id + 's" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + sky[0] + '"/><stop offset="1" stop-color="' + sky[1] + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'f" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="' + (use === 'gewerbe' ? '#5d7fa6' : (seed % 2 ? '#efe6d8' : '#f3f1ec')) + '"/><stop offset="1" stop-color="' + (use === 'gewerbe' ? '#29425f' : (seed % 2 ? '#c9b89d' : '#cfcac0')) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#4f8a43"/><stop offset="1" stop-color="#2d5a2a"/></linearGradient></defs>' +
      '<rect width="320" height="150" fill="url(#' + id + 's)"/>' +
      '<path d="M0 104 L40 92 L70 98 L110 86 L150 96 L200 84 L250 95 L320 88 V150 H0Z" fill="' + (dusk ? '#2c3b5e' : '#9fb7cf') + '" opacity=".55"/>' +
      '<rect y="118" width="320" height="32" fill="url(#' + id + 'g)"/><rect y="128" width="320" height="8" fill="#6b7280" opacity=".7"/>';
    var bx = 92, bw = use === 'gewerbe' ? 130 : 150, fh = use === 'gewerbe' ? 11 : 13, top = 118 - floors * fh;
    if (land) {
      g += '<rect x="60" y="112" width="200" height="12" fill="#a68a5b"/><path d="M60 112 h200" stroke="#f5b301" stroke-dasharray="6 4" stroke-width="2"/>' +
        '<rect x="150" y="80" width="2.5" height="34" fill="#5b4632"/><rect x="128" y="74" width="48" height="16" rx="2" fill="#f8fafc"/><text x="152" y="85" font-size="8" font-weight="800" text-anchor="middle" fill="#1f2937" font-family="system-ui">ZU VERKAUFEN</text>';
    } else {
      var built = ph >= 6 ? 1 : RE.PHASE_AT[ph] + 0.1;
      if (ph <= 1) { g += '<rect x="' + (bx - 10) + '" y="110" width="' + (bw + 20) + '" height="10" fill="#8b7355"/>' + (ph === 1 ? '<rect x="' + bx + '" y="108" width="' + bw + '" height="6" fill="#9ca3af"/>' : ''); }
      else {
        var shownFloors = ph >= 3 ? floors : Math.max(1, Math.round(floors * 0.6)), sTop = 118 - shownFloors * fh;
        g += '<rect x="' + bx + '" y="' + sTop + '" width="' + bw + '" height="' + (118 - sTop) + '" fill="' + (ph === 2 ? '#a3a3a3' : 'url(#' + id + 'f)') + '"/>';
        if (ph >= 3) g += '<rect x="' + (bx - 4) + '" y="' + (sTop - 5) + '" width="' + (bw + 8) + '" height="6" fill="' + (use === 'gewerbe' ? '#1e293b' : '#475569') + '"/>';
        for (var f = 0; f < shownFloors; f++) {
          var y = 118 - (f + 1) * fh + 2;
          if (use === 'gewerbe') {
            g += '<rect x="' + (bx + 4) + '" y="' + y + '" width="' + (bw - 8) + '" height="' + (fh - 4) + '" fill="' + (ph >= 4 ? (dusk && (seed + f) % 3 ? '#ffd28a' : '#9cc8ec') : '#6b7280') + '" opacity="' + (ph >= 4 ? 0.9 : 0.5) + '"/>';
            for (var c = 1; c < 8; c++) g += '<rect x="' + (bx + 4 + c * (bw - 8) / 8) + '" y="' + y + '" width="1.2" height="' + (fh - 4) + '" fill="#1e293b" opacity=".6"/>';
          } else {
            for (var c2 = 0; c2 < 7; c2++) {
              var wx = bx + 8 + c2 * ((bw - 16) / 7), lit = dusk && (seed + f * 7 + c2) % 3 === 0;
              g += '<rect x="' + wx + '" y="' + (y + 1) + '" width="' + ((bw - 16) / 7 - 6) + '" height="' + (fh - 6) + '" fill="' + (ph >= 4 ? (lit ? '#ffd28a' : '#7fa9cf') : '#4b5563') + '"/>';
              if (ph >= 5 && f > 0 && c2 % 2 === 0) g += '<rect x="' + (wx - 2) + '" y="' + (y + fh - 5) + '" width="' + ((bw - 16) / 7 - 2) + '" height="2.2" fill="#e5e7eb"/>';
            }
          }
        }
        if (ph < 6) { // Gerüst und Kran
          for (var sx = bx - 3; sx <= bx + bw + 3; sx += 12) g += '<rect x="' + sx + '" y="' + (sTop - 4) + '" width="1.2" height="' + (122 - sTop) + '" fill="#d97706" opacity=".85"/>';
          for (var sy = sTop; sy < 118; sy += fh) g += '<rect x="' + (bx - 4) + '" y="' + sy + '" width="' + (bw + 8) + '" height="1.2" fill="#d97706" opacity=".85"/>';
        }
      }
      if (ph < 6) g += '<rect x="248" y="22" width="4" height="98" fill="#f59e0b"/><rect x="170" y="22" width="110" height="3.5" fill="#f59e0b"/><rect x="200" y="25" width="1" height="' + (30 + (seed % 30)) + '" fill="#334155"/><rect x="196" y="' + (55 + (seed % 30)) + '" width="9" height="6" fill="#64748b"/>';
      void built;
    }
    for (var t = 0; t < 6; t++) { var tx = 12 + t * 56 + (seed >> t) % 14; if (tx > bx - 14 && tx < bx + bw + 6) continue; g += '<rect x="' + (tx - 1) + '" y="110" width="2.4" height="10" fill="#6b4f2a"/><circle cx="' + tx + '" cy="104" r="' + (8 + (seed >> (t + 3)) % 4) + '" fill="#3f7d3a"/>'; }
    if (!land && ph >= 6) for (var cc = 0; cc < 3; cc++) g += '<rect x="' + (20 + cc * 120 + (seed >> cc) % 30) + '" y="129" width="14" height="5" rx="1.5" fill="' + ['#e11d48', '#f8fafc', '#2563eb', '#111827'][(seed >> (cc + 2)) % 4] + '"/>';
    return g + '</svg>';
  };

  // ---------- Liniendiagramm aus gespeicherten Monatswerten ----------
  U.rtChart = function (rows, series, o) {
    o = o || {}; var W = 560, H = o.h || 170, L = 62, Rr = 10, T = 12, B = 22;
    if (!rows || rows.length < 2) return '<div class="empty-state">' + U.lc('chart-line', 18) + '<span>' + (o.empty || 'Noch keine Verlaufsdaten – die Werte werden monatlich gespeichert.') + '</span></div>';
    var all = []; series.forEach(function (s) { rows.forEach(function (r) { var v = s.f(r); if (isFinite(v)) all.push(v); }); });
    var mn = Math.min.apply(null, all.concat(o.zero ? [0] : [])), mx = Math.max.apply(null, all);
    if (mx - mn < 1) { mx += 1; mn -= 1; } var pad = (mx - mn) * 0.08; mx += pad; if (!o.zero || mn < 0) mn -= pad;
    var X = function (i) { return L + i / (rows.length - 1) * (W - L - Rr); }, Y = function (v) { return T + (1 - (v - mn) / (mx - mn)) * (H - T - B); };
    var g = '<svg class="rt-chart" viewBox="0 0 ' + W + ' ' + H + '" width="100%" preserveAspectRatio="none">';
    for (var k = 0; k <= 4; k++) { var v = mn + (mx - mn) * k / 4, y = Y(v); g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + y + '" y2="' + y + '" stroke="rgba(148,163,184,.15)"/><text x="' + (L - 6) + '" y="' + (y + 3) + '" font-size="10" text-anchor="end" fill="#94a3b8">' + (o.fmt ? o.fmt(v) : money(v)) + '</text>'; }
    if (mn < 0 && mx > 0) g += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="rgba(226,232,240,.4)"/>';
    series.forEach(function (s) {
      var pts = rows.map(function (r, i) { return X(i).toFixed(1) + ',' + Y(s.f(r)).toFixed(1); });
      if (s.fill) g += '<polygon points="' + X(0) + ',' + Y(Math.max(mn, 0)) + ' ' + pts.join(' ') + ' ' + X(rows.length - 1) + ',' + Y(Math.max(mn, 0)) + '" fill="' + s.col + '" opacity=".12"/>';
      g += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.col + '" stroke-width="2.2" stroke-linejoin="round"/>';
    });
    var lab = o.labels || function (r, i) { return i; }, step = Math.max(1, Math.ceil(rows.length / 6));
    rows.forEach(function (r, i) { if (i % step === 0 || i === rows.length - 1) g += '<text x="' + X(i) + '" y="' + (H - 6) + '" font-size="10" text-anchor="middle" fill="#94a3b8">' + esc(lab(r, i)) + '</text>'; });
    g += '</svg><div class="rt-legend">' + series.map(function (s) { return '<span><i style="background:' + s.col + '"></i>' + s.n + '</span>'; }).join('') + '</div>';
    return g;
  };

  // ---------- Hauptpanel ----------
  var SUBS = [['portfolio', 'Portfolio', 'briefcase'], ['markt', 'Immobilienmarkt', 'store'], ['bau', 'Bauprojekte', 'construction'], ['finanz', 'Finanzierung', 'calculator']];
  U.realtyPanel = function (st, c) {
    RE.ensure(st); if (!st.realty.offers.length) RE.refreshMarket(st, c);
    var sub = U.p.rtab || 'portfolio', can = U.can('business');
    var h = '<div class="seg rt-sub">' + SUBS.map(function (x) { return '<button class="' + (sub === x[0] ? 'on' : '') + '" data-act="rtTab" data-k="' + x[0] + '">' + U.lc(x[2], 14) + x[1] + '</button>'; }).join('') + '</div>';
    if (!can) h += '<div class="note" style="margin-bottom:12px">' + U.lc('info', 15) + ' Als Trainer siehst du das Immobilienvermögen. Investitionen trifft die Geschäftsführung (KI) – vorsichtig und nur mit ausreichend Liquidität.</div>';
    h += promoBanners(st, c);
    if (sub === 'portfolio') h += portfolio(st, c, can);
    else if (sub === 'markt') h += market(st, c, can);
    else if (sub === 'bau') h += projects(st, c, can);
    else h += financing(st, c, can);
    return h;
  };
  U.acts.rtTab = function (d) { U.p.rtab = d.k; U.render(); };

  function promoBanners(st, c) {
    var act = RE.activePromos(st); if (!act.length) return '';
    return '<div class="rt-promos">' + act.map(function (p) {
      var T = RE.PROMO_TYPES[p.type], left = p.end - (st.tick || 0);
      return '<div class="rt-promo"><div class="rt-promo-art">' + U.realtyArt({ id: p.id, use: T.uses[0], mode: 'bestand' }, 160, 80) + '</div><div class="rt-promo-b"><span class="pill ok">' + U.lc('badge-percent', 13) + 'Sonderaktion · noch ' + left + ' Wo.</span><b>' + esc(T.t) + '</b><small>' + esc(T.txt) + ' Zinsrabatt ' + pct(T.disc, 2) + (T.ltvAdd ? ' · Beleihung +' + Math.round(T.ltvAdd * 100) + ' %' : '') + (T.fix ? ' · bis ' + T.fix + ' J. Zinsbindung' : '') + '</small></div>' +
        '<button class="sm primary" data-act="rtTab" data-k="markt">Zum Angebot ' + U.lc('chevron-right', 14) + '</button></div>';
    }).join('') + '</div>';
  }

  // ---------- Portfolio ----------
  function portfolio(st, c, can) {
    var pf = RE.portfolio(st, c), hist = c.realtyHist || [], stocksV = E.portfolioValue(st, c, 'stocks'), cryptoV = E.portfolioValue(st, c, 'crypto');
    var h = '<div class="grid g4 rt-kpis">' +
      U.ikpi('wallet', 'Freies Vereinskapital', money(c.cash), c.cash < 0 ? 'neg' : '') +
      U.ikpi('building-2', 'Immobilienvermögen', money(pf.value)) +
      U.ikpi('landmark', 'Immobilienkredite', money(pf.debt), pf.debt ? 'neg' : '') +
      U.ikpi('key-round', 'Immobilien-Eigenkapital', money(pf.equity), '', '<span class="muted small">Wert − Restschuld · keine Liquidität</span>') +
      U.ikpi('coins', 'Bruttomiete / Jahr', money(pf.rentY)) +
      U.ikpi('chart-column', 'Netto-Cashflow / Jahr', money(pf.cfY), pf.cfY < 0 ? 'neg' : 'pos') +
      U.ikpi('users', 'Ø Auslastung', pf.count ? pct(pf.occ) : '–') +
      U.ikpi('percent', 'Ø Nettorendite', pf.value ? pct(pf.yieldNet, 2) : '–') + '</div>';
    if (!pf.count) h += '<div class="panel rt-empty"><div class="rt-hero">' + U.realtyArt({ id: 'hero1', use: 'wohn', mode: 'bestand' }) + U.realtyArt({ id: 'hero2', use: 'gewerbe', mode: 'bestand' }) + '</div><h2>Baue ein wertstabiles Immobilienportfolio auf</h2><p class="muted">Kaufe Mehrfamilienhäuser und Bürogebäude, erwirb Freiflächen oder baue selbst – finanziert mit Eigenkapital und Immobilienkrediten. Die Mieteinnahmen fließen monatlich in die Vereinskasse.</p><button class="primary" data-act="rtTab" data-k="markt">' + U.lc('store', 15) + ' Zum Immobilienmarkt</button></div>';
    else {
      h += '<div class="panel"><div class="panel-h"><h2>' + U.lc('briefcase', 17) + ' Immobilienportfolio (' + pf.count + ' Objekte)</h2></div><div class="rt-cards">' + pf.props.map(function (p) { return propCard(st, c, p); }).join('') + '</div></div>';
      var lab = function (r) { return RE.dateText(st, r.t); };
      h += '<div class="grid g2"><div class="panel"><h2>Vermögen, Restschuld und Eigenkapital</h2>' + U.rtChart(hist, [{ n: 'Immobilienvermögen', col: '#60a5fa', f: function (r) { return r.v; }, fill: true }, { n: 'Restschuld', col: '#f87171', f: function (r) { return r.d; } }, { n: 'Eigenkapital', col: '#22c55e', f: function (r) { return r.e; } }], { labels: lab, zero: true }) + '</div>' +
        '<div class="panel"><h2>Mieteinnahmen und Netto-Cashflow (Monat)</h2>' + U.rtChart(hist, [{ n: 'Mieteinnahmen', col: '#22c55e', f: function (r) { return r.r; }, fill: true }, { n: 'Netto-Cashflow', col: '#fbbf24', f: function (r) { return r.cf; } }], { labels: lab }) + '</div></div>' +
        '<div class="panel"><h2>Vermietungsquote</h2>' + U.rtChart(hist, [{ n: 'Vermietungsquote', col: '#a78bfa', f: function (r) { return r.o; } }], { labels: lab, h: 120, fmt: function (v) { return Math.round(v) + ' %'; } }) + '</div>';
    }
    // Vermögensdarstellung
    var liquid = c.cash + c.savings, other = stocksV + cryptoV + pf.value, liab = E.debt(c) + pf.debt;
    h += '<div class="panel"><h2>' + U.lc('scale', 17) + ' Vermögensdarstellung</h2><div class="grid g3 rt-bal">' +
      '<div><h3>Liquide Mittel</h3>' + row('Girokonto', c.cash) + row('Tagesgeld', c.savings) + row('Summe', liquid, 'b') + '</div>' +
      '<div><h3>Weitere Vermögenswerte</h3>' + row('Aktien', stocksV) + row('Kryptowährungen', cryptoV) + row('Immobilien', pf.value) + row('Summe', other, 'b') + '</div>' +
      '<div><h3>Verbindlichkeiten</h3>' + row('Vereinskredite', -E.debt(c)) + row('Immobilienkredite', -pf.debt) + row('Summe', -liab, 'b') + '</div></div>' +
      '<div class="rt-net"><span>Nettovermögen</span><b class="' + (liquid + other - liab < 0 ? 'neg' : 'pos') + '">' + money(liquid + other - liab) + '</b><small class="muted">Immobilienwerte sind kein frei verfügbares Guthaben.</small></div></div>';
    return h;
  }
  function row(l, v, cls) { return '<div class="rt-row ' + (cls || '') + '"><span>' + l + '</span><b class="' + (v < 0 ? 'neg' : '') + '">' + money(v) + '</b></div>'; }
  function propCard(st, c, p) {
    var m = RE.monthly(st, p), l = RE.loanOf(st, p), K = RE.KINDS[p.kind], rg = RE.REGIONS[p.region];
    var fin = l ? (l.annuity || l.balance * l.rate / 12) : 0, cf = m.rent - m.cost - fin, dv = p.value - (p.status === 'bau' ? p.base + p.build.paid : p.cost);
    var ph = p.status === 'bau' ? RE.phaseOf(p.build.paid / p.build.total) : 6;
    return '<div class="rt-card" data-act="rtProp" data-k="' + p.id + '" role="button" tabindex="0"><div class="rt-art">' + U.realtyArt(p, 320, 140, ph) + '<span class="rt-tag">' + U.lc(K.ic, 12) + esc(K.n) + '</span>' + (p.status === 'bau' ? '<span class="rt-tag2 warn">Im Bau</span>' : p.status === 'land' ? '<span class="rt-tag2">Freifläche</span>' : '') + '</div>' +
      '<div class="rt-cb"><b>' + esc(p.name) + '</b><div class="muted small">' + U.lc('map-pin', 12) + esc(p.district) + ' · ' + esc(rg.short) + '</div>' +
      '<div class="rt-grid">' +
      cell(p.status === 'bau' ? 'Projektkosten' : 'Kaufpreis', money(p.cost)) + cell('Marktwert', money(p.value) + ' <small class="' + (dv >= 0 ? 'pos' : 'neg') + '">' + (dv >= 0 ? '+' : '') + pct(dv / Math.max(1, p.status === 'bau' ? p.base + p.build.paid : p.cost), 1) + '</small>') +
      cell(p.use === 'wohn' ? 'Wohnungen' : 'Fläche', p.use === 'wohn' && p.units ? p.units + ' WE' : num(p.sqm) + ' m²') + cell('Vermietung', p.status === 'bestand' ? pct(p.occ, 0) : '–') +
      cell('Sollmiete / Mon.', p.status === 'bestand' ? money(m.soll) : '–') + cell('Ist-Miete / Mon.', p.status === 'bestand' ? money(m.rent) : '–') +
      cell('Bewirtschaftung', money(-m.cost)) + cell('Finanzierung', fin ? money(-fin) : '–') +
      cell('Netto-Cashflow', '<span class="' + (cf < 0 ? 'neg' : 'pos') + '">' + money(cf) + '</span>') + cell('Restschuld', l ? money(l.balance) : '0 €') +
      '</div></div></div>';
  }
  function cell(l, v) { return '<div><span>' + l + '</span><b>' + v + '</b></div>'; }

  // Detailansicht eines Objekts
  U.acts.rtProp = function (d) {
    var st = U.st, c = U.club(), p = RE.propsOf(st, c).filter(function (x) { return x.id === d.k; })[0]; if (!p) return;
    var can = U.can('business'), m = RE.monthly(st, p), l = RE.loanOf(st, p), K = RE.KINDS[p.kind], q = RE.saleQuote(st, c, p);
    var ph = p.status === 'bau' ? RE.phaseOf(p.build.paid / p.build.total) : 6;
    var h = '<div class="rt-detail"><div class="rt-art big">' + U.realtyArt(p, 640, 240, ph) + '</div><div class="muted small" style="margin:6px 0">' + esc(K.n) + ' · ' + esc(p.district) + ' · ' + esc(RE.REGIONS[p.region].n) + (p.year ? ' · Baujahr ' + p.year : '') + (p.green ? ' · <span class="pos">energetisch hochwertig</span>' : '') + '</div>';
    h += '<div class="grid g2"><div><h3>Wirtschaftlichkeit (Monat)</h3>' + row('Ist-Miete', m.rent) + row('Bewirtschaftung & Verwaltung', -m.cost) + (l ? row('Zinsanteil (aktuell)', -l.balance * l.rate / 12) + row('Tilgungsanteil (aktuell)', -Math.max(0, (l.annuity || 0) - l.balance * l.rate / 12)) : '') + row('Netto-Cashflow', m.rent - m.cost - (l ? (l.annuity || l.balance * l.rate / 12) : 0), 'b') +
      '<p class="muted small">Tilgung ist ein Liquiditätsabfluss und senkt die Restschuld – kein Wertverlust.</p></div>';
    h += '<div><h3>Objekt</h3>' + row('Marktwert', p.value) + row(p.status === 'bau' ? 'Projektkosten' : 'Kaufpreis', p.cost) + '<div class="rt-row"><span>Zustand</span><b>' + Math.round(p.cond || 0) + ' / 100</b></div>' + U.bar(p.cond || 0, 100, (p.cond || 0) < 50 ? '#ef4444' : (p.cond || 0) < 70 ? '#f5b301' : '#22c55e') +
      (p.status === 'bestand' ? '<div class="rt-row"><span>Vermietung</span><b>' + pct(p.occ, 0) + '</b></div>' : '') + '</div></div>';
    if (l) {
      var si = RE.sonderInfo(st, l);
      h += '<h3>Immobiliendarlehen ' + esc(l.id) + ' · ' + esc(l.bank) + '</h3><div class="grid g3 small">' + cell('Restschuld', money(l.balance)) + cell('Sollzins', pct(l.rate, 2) + (l.promo ? ' <span class="pill ok">Sonderaktion</span>' : '')) + cell('Rate / Monat', l.annuity ? money(l.annuity) : 'Bauzinsen') + cell('Zinsbindung bis', RE.dateText(st, l.fixEnd)) + cell('Gezahlte Zinsen', money(l.interestPaid)) + cell('Getilgt', money(l.principalPaid)) + '</div>' +
        (can ? '<div class="row" style="margin-top:8px;gap:8px;flex-wrap:wrap"><input type="number" id="rtSonder" min="0" step="10000" max="' + si.max + '" value="' + Math.min(si.max, Math.max(0, Math.floor(c.cash / 10000) * 10000)) + '" style="width:150px"><button class="sm" data-act="rtSonder" data-k="' + l.id + '" data-p="' + p.id + '"' + (si.max <= 0 ? ' disabled' : '') + '>Sondertilgung</button><span class="muted small">Rahmen dieses Vertragsjahr: ' + money(si.max) + ' (5 % p.a.)</span></div>' : '');
    }
    if (can && p.status === 'bestand') {
      h += '<h3>Instandhaltungsstrategie</h3><div class="seg">' + Object.keys(RE.STRATEGIES).map(function (k) { return '<button class="sm ' + ((p.strategy || 'normal') === k ? 'on' : '') + '" data-act="rtStrat" data-k="' + p.id + '" data-v="' + k + '">' + RE.STRATEGIES[k].n + '</button>'; }).join('') + '</div><p class="muted small">Sparsam: geringe Kosten, Zustand sinkt, Schadensrisiko. Normal: stabil. Premium: höhere Kosten, besserer Zustand und attraktivere Mieten.</p>';
      h += '<h3>Modernisierung</h3><div class="opt-list">' + Object.keys(RE.MODERN).map(function (k) { var M = RE.MODERN[k], run = (p.mods || []).filter(function (x) { return x.k === k; })[0]; return '<button class="opt-card" data-act="rtMod" data-k="' + p.id + '" data-v="' + k + '"' + (run || (k === 'energie' && p.green) ? ' disabled' : '') + '><b>' + M.n + '</b><span>' + (run ? 'läuft · noch ' + run.left + ' Mon.' : M.months + ' Mon. · Miete +' + Math.round(M.rent * 100) + ' % · Wert +' + pct(M.value, 1)) + '</span><em>' + money(RE.modernCost(p, k)) + '</em></button>'; }).join('') + '</div>';
    }
    if (can && p.status === 'land') h += '<h3>Bebauung</h3><p class="small">Auf dieser Freifläche (' + num(p.sqm) + ' m²) kannst du ein Mehrfamilienhaus oder ein Büro- und Geschäftshaus errichten.</p><div class="row" style="gap:8px"><button class="sm primary" data-act="rtBuildLand" data-k="' + p.id + '" data-u="wohn">' + U.lc('house', 14) + ' Wohnhaus bauen</button><button class="sm primary" data-act="rtBuildLand" data-k="' + p.id + '" data-u="gewerbe">' + U.lc('building-2', 14) + ' Bürohaus bauen</button></div>';
    if (can) h += '<h3>Verkauf</h3><div class="grid g3 small">' + cell('Verkaufspreis', money(q.price)) + cell('Verkaufsnebenkosten', money(-q.cost)) + cell('Kreditablösung', money(-q.balance)) + cell('Vorfälligkeitsentschädigung', money(-q.penalty)) + cell('Erlös für den Verein', '<span class="' + (q.net < 0 ? 'neg' : 'pos') + '">' + money(q.net) + '</span>') + '</div>';
    h += '</div>';
    U.modal(U.lc(K.ic, 16) + ' ' + esc(p.name), h, (can ? '<button class="danger" data-act="rtSell" data-k="' + p.id + '">Verkaufen</button>' : '') + '<button class="primary" data-act="closeModal">Schließen</button>', true);
  };
  U.acts.rtStrat = function (d) { RE.setStrategy(U.st, U.club(), d.k, d.v); U.acts.rtProp({ k: d.k }); U.render(); };
  U.acts.rtMod = function (d) { var r = RE.modernize(U.st, U.club(), d.k, d.v); U.toast(r.ok ? 'Modernisierung beauftragt (' + money(r.cost) + ').' : r.why); U.acts.rtProp({ k: d.k }); U.render(); };
  U.acts.rtSonder = function (d) { var el = document.getElementById('rtSonder'), r = RE.sondertilgung(U.st, U.club(), d.k, +(el && el.value) || 0); U.toast(r.ok ? 'Sondertilgung ' + money(r.amount) + ' gebucht.' : r.why); U.acts.rtProp({ k: d.p }); U.render(); };
  U.acts.rtSell = function (d) {
    var st = U.st, c = U.club(), p = RE.propsOf(st, c).filter(function (x) { return x.id === d.k; })[0]; if (!p) return; var q = RE.saleQuote(st, c, p);
    U.confirm('Immobilie verkaufen', '<p><b>' + esc(p.name) + '</b> für ' + money(q.price) + ' verkaufen?</p><p>Nach Verkaufsnebenkosten, Kreditablösung' + (q.penalty ? ' und Vorfälligkeitsentschädigung' : '') + ' erhält der Verein <b class="' + (q.net < 0 ? 'neg' : 'pos') + '">' + money(q.net) + '</b>.</p>', function () { var r = RE.sell(st, c, d.k); U.closeModal(); U.toast(r.ok ? 'Verkauft: ' + p.name : r.why); U.render(); });
  };
  U.acts.rtBuildLand = function (d) {
    var st = U.st, c = U.club();
    var body = '<p>Baustandard wählen:</p><div class="opt-list">' + Object.keys(RE.STANDARDS).map(function (k) { var S = RE.STANDARDS[k]; return '<button class="opt-card" data-act="rtBuildLandGo" data-k="' + d.k + '" data-u="' + d.u + '" data-v="' + k + '"><b>' + S.n + '</b><span>Kosten ×' + S.cost.toFixed(2).replace('.', ',') + ' · Miete ×' + S.rent.toFixed(2).replace('.', ',') + '</span><em>' + (k === 'premium' ? 'bessere Wertentwicklung, mehr Risiko' : k === 'einfach' ? 'günstig, geringere Attraktivität' : 'ausgewogen') + '</em></button>'; }).join('') + '</div><p class="muted small">Finanzierung: bis zur Beleihungsgrenze über die Vereinsbank (10 Jahre fest, 2 % Tilgung). Auszahlung nach Baufortschritt, zuerst Eigenkapital.</p>';
    U.modal(U.lc('construction', 16) + ' Bauprojekt starten', body, '<button data-act="closeModal">Abbrechen</button>');
  };
  U.acts.rtBuildLandGo = function (d) { var r = RE.buildOnLand(U.st, U.club(), d.k, { use: d.u, standard: d.v, fix: 10 }); U.closeModal(); U.toast(r.ok ? 'Baustart! ' + money(r.cost) + ', ' + r.months + ' Monate.' : r.why); U.p.rtab = 'bau'; U.render(); };

  // ---------- Immobilienmarkt ----------
  function market(st, c, can) {
    var re = st.realty, f = U.p.rtf || {}, list = re.offers.slice();
    if (f.mode) list = list.filter(function (o) { return f.mode === 'kauf' ? o.mode === 'bestand' : f.mode === 'neubau' ? o.mode === 'neubau' : o.mode === 'land'; });
    if (f.use) list = list.filter(function (o) { return o.use === f.use; });
    if (f.region) list = list.filter(function (o) { return o.region === f.region; });
    if (f.risk) list = list.filter(function (o) { return o.risk <= +f.risk; });
    if (f.eq) list = list.filter(function (o) { return o.equityNeed <= +f.eq; });
    var sorts = { rendite: function (a, b) { return b.netYield - a.netYield; }, preis: function (a, b) { return a.price - b.price; }, ek: function (a, b) { return a.equityNeed - b.equityNeed; }, risiko: function (a, b) { return a.risk - b.risk; }, cf: function (a, b) { return b.cfMonth - a.cfMonth; } };
    list.sort(sorts[f.sort || 'rendite']);
    var sel = function (k, opts) { return '<select data-chg="rtFilter" data-k="' + k + '">' + opts.map(function (o) { return '<option value="' + o[0] + '"' + (String(f[k] || '') === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>'; };
    var cr = RE.credit(st, c);
    var h = '<div class="grid g4 rt-kpis">' + U.ikpi('wallet', 'Freies Kapital', money(c.cash), c.cash < 0 ? 'neg' : '') + U.ikpi('landmark', 'Verfügbare Kreditlinie', money(Math.max(0, cr.limit - cr.used)), '', '<span class="muted small">von ' + money(cr.limit) + '</span>') +
      U.ikpi('construction', 'Laufende Projekte', String(RE.propsOf(st, c).filter(function (p) { return p.status === 'bau'; }).length)) + U.ikpi('percent', 'Bauzins (10 J. fest)', pct(re.rate + cr.adj, 2), '', '<span class="muted small">Bonität ' + cr.grade + '</span>') + '</div>';
    h += '<div class="panel"><div class="panel-h"><h2>' + U.lc('store', 17) + ' Aktuelle Investitionsangebote (' + list.length + ')</h2><span class="muted small">Der Markt wechselt monatlich – Angebote verschwinden, wenn andere Käufer zuschlagen.</span></div>' +
      '<div class="rt-filters">' + sel('mode', [['', 'Alle Arten'], ['kauf', 'Kauf (Bestand)'], ['neubau', 'Neubau'], ['land', 'Freifläche']]) + sel('use', [['', 'Wohn & Gewerbe'], ['wohn', 'Wohnimmobilie'], ['gewerbe', 'Geschäftsimmobilie']]) +
      sel('region', [['', 'Alle Regionen']].concat(Object.keys(RE.REGIONS).map(function (k) { return [k, RE.REGIONS[k].short]; }))) + sel('risk', [['', 'Jedes Risiko'], ['1', 'nur gering'], ['2', 'bis mittel']]) +
      sel('eq', [['', 'Jeder EK-Bedarf'], ['1000000', 'EK bis 1 Mio. €'], ['3000000', 'EK bis 3 Mio. €'], ['10000000', 'EK bis 10 Mio. €']]) + sel('sort', [['rendite', 'Sortieren: Rendite'], ['preis', 'Sortieren: Preis'], ['ek', 'Sortieren: Eigenkapitalbedarf'], ['risiko', 'Sortieren: Risiko'], ['cf', 'Sortieren: Cashflow']]) + '</div>';
    h += list.length ? '<div class="rt-cards">' + list.map(function (o) { return offerCard(st, c, o, can); }).join('') + '</div>' : U.empty('search', 'Keine Angebote für diese Filter.');
    h += '</div>';
    // Vergleichstabelle
    if (list.length) h += '<div class="panel"><h2>' + U.lc('scale', 17) + ' Objekte im Vergleich</h2><table class="t small"><tr><th>Objekt</th><th>Art</th><th>Region</th><th class="num">Preis / Baukosten</th><th class="num">Rendite netto</th><th class="num">Belegung</th><th class="num">EK-Bedarf</th><th>Risiko</th></tr>' +
      list.map(function (o) { return '<tr><td>' + esc(o.name) + '</td><td>' + esc(RE.KINDS[o.kind].n) + '</td><td>' + esc(RE.REGIONS[o.region].short) + '</td><td class="num">' + money(o.price) + '</td><td class="num ' + (o.netYield >= 0.04 ? 'pos' : '') + '">' + (o.mode === 'land' ? '–' : pct(o.netYield, 2)) + '</td><td class="num">' + (o.mode === 'bestand' ? pct(o.occ, 0) : '–') + '</td><td class="num">' + money(o.equityNeed) + '</td><td><span class="pill ' + RISKC[o.risk] + '">' + RISK[o.risk] + '</span></td></tr>'; }).join('') + '</table><p class="muted small">EK-Bedarf = Kaufnebenkosten + nicht finanzierbarer Anteil bei regulärer Beleihung (Wohnen bis 100 %, Gewerbe 72 %).</p></div>';
    return h;
  }
  U.acts.rtFilter = function (d, el) { U.p.rtf = U.p.rtf || {}; U.p.rtf[d.k] = el.value; U.render(); };
  function offerCard(st, c, o, can) {
    var K = RE.KINDS[o.kind], left = o.expires - (st.tick || 0);
    var rows = o.mode === 'land' ? [['Kaufpreis', money(o.price)], ['Fläche', num(o.sqm) + ' m²'], ['Nebenkosten', money(o.feesTotal)], ['Bebaubar als', o.buildUse === 'wohn' ? 'Wohnen' : 'Gewerbe']]
      : o.mode === 'neubau' ? [['Baukosten (gesamt)', money(o.price)], ['Bauzeit', o.months + ' Monate'], ['Erw. Miete / Mon.', money(o.rentY / 12)], ['Erw. Rendite netto', pct(o.netYield, 2)]]
        : [['Kaufpreis', money(o.price)], ['Belegung', pct(o.occ, 0)], ['Erw. Miete / Mon.', money(o.rentY * o.occ / 12)], ['Erw. Rendite netto', pct(o.netYield, 2)]];
    return '<div class="rt-card offer' + (o.distress ? ' distress' : '') + '"><div class="rt-art">' + U.realtyArt(o, 320, 140, o.mode === 'neubau' ? 2 : 6) + '<span class="rt-tag">' + U.lc(K.ic, 12) + esc(K.n) + '</span><span class="rt-tag2">' + (o.mode === 'bestand' ? 'Bestandsobjekt' : o.mode === 'neubau' ? 'Bauprojekt' : 'Grundstück') + '</span></div>' +
      '<div class="rt-cb"><b>' + esc(o.name) + '</b><div class="muted small">' + U.lc('map-pin', 12) + esc(o.district) + ' · ' + esc(RE.REGIONS[o.region].short) + (o.year ? ' · Bj. ' + o.year : '') + '</div><div class="rt-grid">' + rows.map(function (r) { return cell(r[0], r[1]); }).join('') +
      cell('EK-Bedarf', money(o.equityNeed)) + cell('Risikostufe', '<span class="pill ' + RISKC[o.risk] + '">' + RISK[o.risk] + '</span>') + '</div>' +
      '<div class="row between" style="margin-top:8px"><span class="muted small">' + U.lc('clock', 12) + ' noch ' + left + ' Wo.</span>' + (can ? '<button class="sm primary" data-act="rtOffer" data-k="' + o.id + '">' + (o.mode === 'neubau' ? 'Projekt prüfen' : 'Prüfen & kaufen') + ' ' + U.lc('chevron-right', 13) + '</button>' : '') + '</div></div></div>';
  }

  // Kaufdialog: 1. Objekt, 2. Wirtschaftlichkeit, 3. Finanzierung, 4. Bestätigen
  U.acts.rtOffer = function (d) {
    var st = U.st, c = U.club(), o = st.realty.offers.filter(function (x) { return x.id === d.k; })[0]; if (!o) return;
    var q0 = RE.quote(st, c, o, { fix: 10 });
    U.rtBuy = { id: o.id, fin: { fix: 10, mode: 'tilgung', tilg: 0.02, equity: q0.equity, standard: 'modern', years: 25 } };
    U.modal(U.lc(RE.KINDS[o.kind].ic, 16) + ' ' + esc(o.name), '<div id="rtBuyBody">' + buyBody(st, c, o) + '</div>', '<button data-act="closeModal">Abbrechen</button><button class="primary" id="rtBuyGo" data-act="rtBuyGo">Kauf bestätigen</button>', true);
    updBuy();
  };
  function buyBody(st, c, o) {
    var b = U.rtBuy, f = b.fin, fees = RE.fees(o);
    var h = '<div class="rt-buy"><div class="rt-art big">' + U.realtyArt(o, 640, 200, o.mode === 'neubau' ? 2 : 6) + '</div>';
    h += '<div class="rt-steps"><span class="on">1 Objekt</span><span class="on">2 Wirtschaftlichkeit</span><span class="on">3 Finanzierung</span><span>4 Bestätigen</span></div>';
    h += '<div class="grid g2"><div><h3>Objekt & Kaufnebenkosten</h3>' + row(o.mode === 'neubau' ? 'Grundstück' : 'Kaufpreis', o.mode === 'neubau' ? o.land : o.price) + (o.mode === 'neubau' ? '<div class="rt-row"><span>Baukosten (Standard)</span><b id="rtBuild">–</b></div>' : '') +
      row('Grunderwerbsteuer (5 %)', fees.grunderwerb) + row('Notar & Grundbuch (1,5 %)', fees.notar) + (fees.makler ? row('Makler (3 %)', fees.makler) : '') + '<div class="rt-row b"><span>Gesamtkapitalbedarf</span><b id="rtTotal">–</b></div>' +
      '<p class="muted small">Kaufnebenkosten werden immer aus Eigenkapital bezahlt.</p></div>';
    h += '<div><h3>Finanzierung</h3>' +
      (o.mode === 'neubau' ? '<label class="rt-f">Baustandard <select data-chg="rtBuyF" data-k="standard">' + Object.keys(RE.STANDARDS).map(function (k) { return '<option value="' + k + '"' + (f.standard === k ? ' selected' : '') + '>' + RE.STANDARDS[k].n + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="rt-f">Eigenkapital (€) <input type="number" step="10000" min="0" value="' + Math.round(f.equity) + '" data-inp="rtBuyF" data-k="equity"></label>' +
      '<label class="rt-f">Zinsbindung <select data-chg="rtBuyF" data-k="fix">' + [5, 10, 15, 20].map(function (y) { return '<option value="' + y + '"' + (+f.fix === y ? ' selected' : '') + '>' + y + ' Jahre</option>'; }).join('') + '</select></label>' +
      '<label class="rt-f">Tilgung <select data-chg="rtBuyF" data-k="tilgsel">' + ['0.01', '0.015', '0.02', '0.03', '0.04', '0.05', 'L20', 'L25', 'L30'].map(function (v) { var on = v.charAt(0) === 'L' ? (f.mode === 'laufzeit' && +v.slice(1) === +f.years) : (f.mode !== 'laufzeit' && Math.abs(+v - f.tilg) < 1e-9); return '<option value="' + v + '"' + (on ? ' selected' : '') + '>' + (v.charAt(0) === 'L' ? 'Volltilgung in ' + v.slice(1) + ' Jahren' : pct(+v, 1) + ' Anfangstilgung') + '</option>'; }).join('') + '</select></label>' +
      '</div></div><div id="rtBuyRes"></div></div>';
    return h;
  }
  U.acts.rtBuyF = function (d, el) {
    var f = U.rtBuy.fin;
    if (d.k === 'tilgsel') { if (el.value.charAt(0) === 'L') { f.mode = 'laufzeit'; f.years = +el.value.slice(1); } else { f.mode = 'tilgung'; f.tilg = +el.value; } }
    else if (d.k === 'standard') { f.standard = el.value; }
    else f[d.k] = +el.value;
    updBuy();
  };
  function updBuy() {
    var st = U.st, c = U.club(), b = U.rtBuy, o = st.realty.offers.filter(function (x) { return x.id === b.id; })[0], box = document.getElementById('rtBuyRes'); if (!o || !box) return;
    var q = RE.quote(st, c, o, b.fin);
    var set = function (id, v) { var e = document.getElementById(id); if (e) e.textContent = v; };
    set('rtTotal', money(q.total)); if (o.mode === 'neubau') set('rtBuild', money(q.price - o.land));
    var h = '<div class="grid g2" style="margin-top:10px"><div class="rt-result"><h3>Ergebnis (live)</h3>' +
      row('Eigenkapital', q.equity) + row('Darlehensbetrag', q.loan) + '<div class="rt-row"><span>Sollzins' + (q.promo ? ' <span class="pill ok">Sonderaktion</span>' : '') + '</span><b>' + pct(q.rate, 2) + (q.disc ? ' <small class="muted"><s>' + pct(q.normalRate, 2) + '</s></small>' : '') + '</b></div>' +
      row('Monatliche Rate', -q.annuity) + row('Zinsen im 1. Jahr', -q.zinsY1) + row('Tilgung im 1. Jahr', -q.tilgY1) + row('Restschuld nach ' + q.fix + ' Jahren', q.restFix) + (q.fee ? row('Bearbeitungsgebühr', -q.fee) : '') + '</div>' +
      '<div class="rt-result"><h3>Erwarteter Betrieb (Monat)</h3>' + row('Erwartete Mieteinnahmen', q.rentM) + row('Bewirtschaftungskosten', -q.costM) + row('Darlehensrate', -q.annuity) + row('Erwarteter Cashflow', q.cfM, 'b') +
      '<div class="rt-row"><span>Schuldendienstdeckung (DSCR)</span><b class="' + (q.dscr >= 1.2 ? 'pos' : q.dscr >= 1 ? '' : 'neg') + '">' + (isFinite(q.dscr) ? q.dscr.toFixed(2).replace('.', ',') : '–') + '</b></div>' + (o.mode === 'neubau' ? '<p class="muted small">Mieten erst nach Fertigstellung; während der Bauzeit fallen nur Bauzinsen an.</p>' : '') + '</div></div>';
    h += '<div class="panel tight" style="margin-top:10px"><h3>Restschuld, Zins- und Tilgungsanteil</h3>' + U.rtChart(q.schedule.map(function (s) { return s; }), [{ n: 'Restschuld', col: '#22c55e', f: function (r) { return r.rest; }, fill: true }, { n: 'Zinsen p.a.', col: '#f87171', f: function (r) { return r.zins; } }, { n: 'Tilgung p.a.', col: '#60a5fa', f: function (r) { return r.tilg; } }], { labels: function (r) { return 'J' + r.year; }, zero: true, h: 150 }) + '</div>';
    h += q.ok ? '<div class="note ok">' + U.lc('circle-check', 15) + ' Die ' + esc(q.bank) + ' bewilligt die Finanzierung (Bonität ' + q.credit.grade + ', ' + q.credit.score + '/1000).</div>'
      : '<div class="note bad">' + U.lc('circle-x', 15) + ' <b>Finanzierung abgelehnt:</b><ul>' + q.reasons.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul><span class="small">Möglich: mehr Eigenkapital einsetzen, ein kleineres Objekt wählen, andere Tilgung/Zinsbindung oder bestehende Schulden reduzieren.</span></div>';
    box.innerHTML = h;
    var go = document.getElementById('rtBuyGo'); if (go) { go.disabled = !q.ok; go.textContent = (o.mode === 'neubau' ? 'Projekt starten · ' : o.mode === 'land' ? 'Grundstück kaufen · ' : 'Kauf bestätigen · ') + money(q.equity + q.fee) + ' Eigenkapital'; }
  }
  U.acts.rtBuyGo = function () {
    var st = U.st, c = U.club(), b = U.rtBuy; if (!b) return;
    var r = RE.buy(st, c, b.id, b.fin); if (!r.ok) { U.toast(r.why); return; }
    U.closeModal(); U.rtBuy = null; U.p.rtab = r.prop.status === 'bau' ? 'bau' : 'portfolio'; U.toast((r.prop.status === 'bau' ? 'Projekt gestartet: ' : 'Gekauft: ') + r.prop.name); U.render();
  };

  // ---------- Bauprojekte ----------
  function projects(st, c, can) {
    var ps = RE.propsOf(st, c), bau = ps.filter(function (p) { return p.status === 'bau'; }), land = ps.filter(function (p) { return p.status === 'land'; });
    var h = '';
    if (!bau.length && !land.length) h += '<div class="panel">' + U.empty('construction', 'Keine laufenden Bauprojekte. Im Immobilienmarkt findest du Neubauprojekte und Freiflächen zur späteren Bebauung.') + '<button class="primary" style="margin-top:10px" data-act="rtTab" data-k="markt">Zum Immobilienmarkt</button></div>';
    bau.forEach(function (p) {
      var b = p.build, prog = b.paid / b.total, ph = RE.phaseOf(prog), left = Math.max(0, b.months - b.done) + (b.hold || 0), l = RE.loanOf(st, p);
      h += '<div class="panel rt-proj"><div class="grid g21"><div><div class="rt-art big">' + U.realtyArt(p, 640, 220, ph) + '</div></div><div><h2>' + esc(p.name) + '</h2><div class="muted small">' + esc(RE.KINDS[p.kind].n) + ' · ' + esc(RE.STANDARDS[p.standard || 'modern'].n) + ' · ' + esc(p.district) + '</div>' +
        '<div class="rt-row b" style="margin-top:8px"><span>Baufortschritt</span><b>' + Math.round(prog * 100) + ' %</b></div>' + U.bar(prog * 100, 100, '#f5b301') +
        '<div class="rt-row"><span>Verbleibende Bauzeit</span><b>' + left + ' Monat(e)</b></div>' + row('Baukosten gesamt', b.total) + row('Bereits ausgezahlt', b.paid) + row('Davon offen (Eigenkapital)', b.eqLeft) + (l ? row('Darlehen abgerufen', l.drawn) : '') +
        (b.preLet ? '<div class="rt-row"><span>Vorvermietung</span><b>' + pct(b.preLet, 0) + '</b></div>' : '') + '</div></div>' +
        '<div class="rt-phases">' + RE.PHASES.map(function (n, i) { return '<div class="' + (i < ph ? 'done' : i === ph ? 'now' : '') + '"><i>' + (i < ph ? U.lc('check', 12) : i + 1) + '</i><span>' + n + '</span></div>'; }).join('') + '</div></div>';
    });
    land.forEach(function (p) {
      h += '<div class="panel rt-proj"><div class="grid g21"><div class="rt-art big">' + U.realtyArt(p, 640, 200) + '</div><div><h2>' + esc(p.name) + '</h2><div class="muted small">Freifläche · ' + num(p.sqm) + ' m² · ' + esc(p.district) + '</div>' + row('Wert', p.value) + row('Kosten / Monat', -RE.monthly(st, p).cost) +
        (can ? '<div class="row" style="gap:8px;margin-top:10px"><button class="sm primary" data-act="rtBuildLand" data-k="' + p.id + '" data-u="wohn">Wohnhaus bauen</button><button class="sm primary" data-act="rtBuildLand" data-k="' + p.id + '" data-u="gewerbe">Bürohaus bauen</button></div>' : '') + '</div></div></div>';
    });
    return h;
  }

  // ---------- Finanzierung: Rechner, Bankangebote, laufende Darlehen, Bonität ----------
  function financing(st, c, can) {
    var cr = RE.credit(st, c), pf = RE.portfolio(st, c), re = st.realty;
    var cl = U.rtCalc = U.rtCalc || { price: 6000000, fees: 0.095, equity: 1200000, rate: null, tilg: 0.02, mode: 'tilgung', years: 25, fix: 10, sonder: 0, rentM: 25000, costM: 4500 };
    var A0 = pf.loans.reduce(function (s, l) { return s + (l.annuity || 0); }, 0), avgRate = pf.debt ? pf.loans.reduce(function (s, l) { return s + l.rate * l.balance; }, 0) / pf.debt : 0;
    var h = '<div class="grid g4 rt-kpis">' + U.ikpi('percent', 'Eigenkapitalquote Immobilien', pf.value ? pct(pf.equity / pf.value, 1) : '–') + U.ikpi('landmark', 'Offener Darlehensrahmen', money(Math.max(0, cr.limit - cr.used)), '', U.bar(cr.used, cr.limit || 1, '#22c55e') + '<span class="muted small">von ' + money(cr.limit) + '</span>') +
      U.ikpi('key-round', 'Ø Sollzins', pf.debt ? pct(avgRate, 2) : '–') + U.ikpi('calendar', 'Monatliche Annuität', money(A0), '', '<span class="muted small">Zins + Tilgung, gesamt</span>') + '</div>';
    // Rechner
    h += '<div class="grid g2"><div class="panel"><h2>' + U.lc('calculator', 17) + ' Finanzierungsrechner</h2><div class="rt-calc">' +
      inp('Immobilienpreis / Projektkosten (€)', 'price', cl.price, 50000) + inp('Kaufnebenkosten (%)', 'feesPct', Math.round(cl.fees * 1000) / 10, 0.5) + inp('Eigenkapital (€)', 'equity', cl.equity, 50000) +
      inp('Sollzins (% p.a.)', 'ratePct', ((cl.rate != null ? cl.rate : re.rate + cr.adj) * 100).toFixed(2), 0.05) +
      '<label class="rt-f">Tilgung <select data-chg="rtCalcF" data-k="tilgsel">' + ['0.01', '0.015', '0.02', '0.03', '0.04', '0.05', 'L15', 'L20', 'L25', 'L30'].map(function (v) { var on = v.charAt(0) === 'L' ? (cl.mode === 'laufzeit' && +v.slice(1) === cl.years) : (cl.mode !== 'laufzeit' && Math.abs(+v - cl.tilg) < 1e-9); return '<option value="' + v + '"' + (on ? ' selected' : '') + '>' + (v.charAt(0) === 'L' ? 'Volltilgung in ' + v.slice(1) + ' Jahren' : pct(+v, 1) + ' Anfangstilgung') + '</option>'; }).join('') + '</select></label>' +
      '<label class="rt-f">Zinsbindung <select data-chg="rtCalcF" data-k="fix">' + [5, 10, 15, 20].map(function (y) { return '<option value="' + y + '"' + (cl.fix === y ? ' selected' : '') + '>' + y + ' Jahre</option>'; }).join('') + '</select></label>' +
      inp('Sondertilgung pro Jahr (€)', 'sonder', cl.sonder, 10000) + inp('Erwartete Miete / Monat (€)', 'rentM', cl.rentM, 1000) + inp('Laufende Kosten / Monat (€)', 'costM', cl.costM, 500) +
      '</div></div><div class="panel"><h2>Ergebnis (live)</h2><div id="rtCalcRes">' + calcRes(st, c) + '</div></div></div>';
    // Bankangebote
    var o = { use: 'wohn', mode: 'bestand', risk: 1 }, og = { use: 'gewerbe', mode: 'bestand', risk: 1 };
    h += '<div class="grid g2"><div class="panel"><h2>' + U.lc('landmark', 17) + ' Angebote der Immobilienbanken</h2><table class="t small"><tr><th>Bank</th><th>Objekt</th><th class="num">Sollzins</th><th class="num">Bindung</th><th class="num">Beleihung</th><th class="num">Gebühr</th></tr>' +
      [[o, 10, 'Vereinsbank'], [o, 15, 'Nord Kapital'], [o, 10, 'Wohnbau Kredit'], [og, 15, 'Business Real Estate Finance'], [og, 10, 'Vereinsbank']].map(function (x, i) {
        var T = RE.terms(st, c, x[0], x[1]), bump = [0, 0.0012, 0.0024, 0, 0.0015][i];
        return '<tr><td><b>' + (T.promo ? esc(T.bank) : x[2]) + '</b></td><td>' + (x[0].use === 'wohn' ? 'Wohnimmobilie' : 'Gewerbeimmobilie') + '</td><td class="num ' + (T.promo ? 'pos' : '') + '">' + pct(T.rate + (T.promo ? 0 : bump), 2) + (T.promo ? ' <span class="pill ok">Aktion</span>' : '') + '</td><td class="num">' + x[1] + ' J.</td><td class="num">' + Math.round(T.ltv * 100) + ' %</td><td class="num">' + pct(T.fee, 2) + '</td></tr>';
      }).join('') + '</table><p class="muted small">Konditionen werden beim Kauf eines Objekts automatisch angewendet und im Kreditvertrag gespeichert. Abgeschlossene Kredite behalten ihren Zins.</p></div>';
    // Bonität
    h += '<div class="panel"><h2>' + U.lc('shield', 17) + ' Finanzierungsregeln & Bonität</h2>' +
      '<div class="rt-row b"><span>Vereins-Bonität</span><b>' + cr.grade + ' <small class="muted">(' + cr.score + ' / 1.000)</small></b></div>' + U.bar(cr.score, 1000, cr.score >= 600 ? '#22c55e' : cr.score >= 440 ? '#f5b301' : '#ef4444') +
      '<div class="rt-row"><span>Beleihung (LTV) gesamt</span><b>' + (pf.value ? pct(pf.debt / pf.value, 1) : '–') + '</b></div>' +
      '<div class="rt-row"><span>Kreditlinie genutzt</span><b>' + pct(cr.limit ? pf.debt / cr.limit : 0, 0) + ' <small class="muted">von ' + money(cr.limit) + '</small></b></div>' +
      '<ul class="rt-rules"><li>' + U.lc('check', 13) + ' Kaufnebenkosten immer aus Eigenkapital</li><li>' + U.lc('check', 13) + ' Wohnimmobilien regulär bis 100 % des Kaufpreises</li><li>' + U.lc('check', 13) + ' Büroimmobilien bis 72 %, Freiflächen bis 50 %</li><li>' + U.lc('check', 13) + ' Kreditlinie: 3,5 × Jahresumsatz + 50 % der Liquidität</li><li>' + U.lc('check', 13) + ' Schuldendienstdeckung (DSCR) mindestens 1,05</li><li>' + U.lc('check', 13) + ' Sondertilgung bis 5 % der Darlehenssumme pro Vertragsjahr</li><li>' + U.lc('check', 13) + ' Zinsrabatte aus Sonderaktionen höchstens 1,5 Prozentpunkte</li></ul></div></div>';
    // Laufende Darlehen
    h += '<div class="panel"><h2>' + U.lc('receipt', 17) + ' Laufende Immobiliendarlehen (' + pf.loans.length + ')</h2>' + (pf.loans.length ? '<table class="t small"><tr><th>Objekt</th><th>Bank</th><th class="num">Restschuld</th><th class="num">Zins</th><th class="num">Rate / Monat</th><th>Zinsbindung</th><th>Status</th></tr>' +
      pf.loans.map(function (l) { var p = st.realty.props.filter(function (x) { return x.id === l.prop; })[0]; return '<tr data-act="rtProp" data-k="' + (p ? p.id : '') + '" style="cursor:pointer"><td>' + esc(p ? p.name : l.id) + '</td><td>' + esc(l.bank) + '</td><td class="num">' + money(l.balance) + '</td><td class="num">' + pct(l.rate, 2) + (l.promo ? ' ★' : '') + '</td><td class="num">' + (l.annuity ? money(l.annuity) : 'Bauzinsen') + '</td><td>' + l.fix + ' J. (bis ' + RE.dateText(st, l.fixEnd) + ')</td><td><span class="pill ' + (p && p.status === 'bau' ? 'warn' : 'ok') + '">' + (p && p.status === 'bau' ? 'Bauphase' : 'Läuft') + '</span></td></tr>'; }).join('') + '</table>' : U.empty('receipt', 'Noch keine Immobilienkredite.')) + '</div>';
    return h;
  }
  function inp(l, k, v, step) { return '<label class="rt-f">' + l + ' <input type="number" step="' + step + '" value="' + v + '" data-inp="rtCalcF" data-k="' + k + '"></label>'; }
  U.acts.rtCalcF = function (d, el) {
    var cl = U.rtCalc, v = +el.value;
    if (d.k === 'tilgsel') { if (el.value.charAt(0) === 'L') { cl.mode = 'laufzeit'; cl.years = +el.value.slice(1); } else { cl.mode = 'tilgung'; cl.tilg = +el.value; } }
    else if (d.k === 'feesPct') cl.fees = v / 100; else if (d.k === 'ratePct') cl.rate = v / 100; else if (d.k === 'fix') cl.fix = v; else cl[d.k] = v;
    var box = document.getElementById('rtCalcRes'); if (box) box.innerHTML = calcRes(U.st, U.club());
  };
  function calcRes(st, c) {
    var cl = U.rtCalc, cr = RE.credit(st, c), rate = cl.rate != null ? cl.rate : st.realty.rate + cr.adj;
    var total = cl.price * (1 + cl.fees), P = Math.max(0, total - cl.equity), terms = { principal: P, rate: rate, mode: cl.mode, tilg: cl.tilg, months: cl.years * 12 };
    var A = RE.annuity(terms), sched = RE.schedule(P, rate, A, cl.mode === 'laufzeit' ? cl.years : 35, cl.sonder);
    var rest = sched[Math.min(sched.length, cl.fix) - 1], restFix = rest ? rest.rest : 0, y1 = sched[0] || { zins: 0, tilg: 0 };
    var dscr = A ? (cl.rentM - cl.costM) / A : Infinity;
    var h = row('Gesamter Finanzierungsbedarf', total) + row('Darlehensbetrag', P) + row('Monatliche Rate', -A) + row('Zinsen im 1. Jahr', -y1.zins) + row('Tilgung im 1. Jahr', -y1.tilg) + row('Restschuld nach ' + cl.fix + ' Jahren', restFix) +
      row('Erwartete Mieteinnahmen / Monat', cl.rentM) + row('Laufende Betriebskosten / Monat', -cl.costM) + row('Erwarteter Cashflow / Monat', cl.rentM - cl.costM - A, 'b') +
      '<div class="rt-row"><span>Schuldendienstdeckungsgrad</span><b class="' + (dscr >= 1.2 ? 'pos' : dscr >= 1 ? '' : 'neg') + '">' + (isFinite(dscr) ? dscr.toFixed(2).replace('.', ',') : '–') + '</b></div>';
    var eqRows = sched.map(function (s, i) { return { year: s.year, rest: s.rest, zins: s.zins, tilg: s.tilg, eq: cl.price * Math.pow(1.015, s.year) - s.rest }; });
    h += U.rtChart(eqRows, [{ n: 'Restschuld', col: '#f87171', f: function (r) { return r.rest; } }, { n: 'Eigenkapital im Objekt (Wert +1,5 % p.a.)', col: '#22c55e', f: function (r) { return r.eq; }, fill: true }, { n: 'Zinsanteil p.a.', col: '#fbbf24', f: function (r) { return r.zins; } }, { n: 'Tilgungsanteil p.a.', col: '#60a5fa', f: function (r) { return r.tilg; } }], { labels: function (r) { return 'J' + r.year; }, zero: true, h: 160 });
    return h + '<p class="muted small">Gleiches Rechenmodell wie im Kreditvertrag (Annuität: Darlehen × Monatszins / (1 − (1 + Monatszins)^−Monate) bzw. Sollzins + Anfangstilgung).</p>';
  }
})(RFM);
