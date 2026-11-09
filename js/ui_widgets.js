// ANWURF! – Grafik-Bausteine: Symbole (Lucide), Kennzahl-Karten, Geldstapel, Verlaufsdiagramme, Anzeigen, Retro-Bankfenster
(function (R) {
  var E = R.econ, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  var uid = 0;

  // Linien-Symbole (Lucide, js/icons.js). Alte Namen werden auf das einheitliche Symbolset abgebildet.
  var ALIAS = { fans: 'users', heart: 'heart-pulse', bank: 'landmark', debt: 'credit-card', piggy: 'piggy-bank', stocks: 'chart-line', traffic: 'car', city: 'building-2', energy: 'zap', growth: 'trending-up', ball: 'target', home: 'house' };
  var TONE = { trophy: 'warn', star: 'warn', coins: 'warn', heart: 'bad', debt: 'bad', growth: 'ok', energy: 'ok', piggy: 'ok' };
  U.lc = function (name, size, cls) {
    var n = ALIAS[name] || name, body = (R.ICONS && R.ICONS[n]) || (R.ICONS && R.ICONS.info) || '';
    size = size || 18;
    return '<svg class="lc' + (cls ? ' ' + cls : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' + body + '</svg>';
  };
  U.icon = function (name, size) { return U.lc(name, size ? Math.round(size * 0.8) : 20); };
  U.iconTone = function (name) { return TONE[name] || ''; };
  // Kennzahl-Karte: Symbol in getönter Kachel, Beschriftung, Wert, optional Grafik darunter
  U.ikpi = function (icon, label, value, cls, extra) {
    return '<div class="kpi ikpi"><div class="ikpi-top"><div class="ikpi-ic ' + U.iconTone(icon) + '">' + U.lc(icon, 21) + '</div><div><div class="l">' + label + '</div><div class="v ' + (cls || '') + '">' + value + '</div></div></div>' + (extra ? '<div class="ikpi-x">' + extra + '</div>' : '') + '</div>';
  };
  // Leerzustand mit Symbol und Text (statt großer leerer Flächen)
  U.empty = function (icon, text) { return '<div class="empty-state">' + U.lc(icon || 'info', 20) + '<span>' + text + '</span></div>'; };

  // ---------- Geldstapel: Banknoten-Bündel & Münzen, wächst mit dem Kontostand ----------
  U.moneyArt = function (cash, w, h) {
    w = w || 120; h = h || 70;
    var id = 'm' + (uid++);
    if (cash < 0) { // leerer Tresor mit Spinnweben
      return '<svg class="money-art" viewBox="0 0 120 70" width="' + w + '" height="' + h + '"><rect x="30" y="8" width="60" height="56" rx="4" fill="#475569" stroke="#1e293b" stroke-width="2"/><rect x="36" y="14" width="48" height="44" rx="2" fill="#1e293b"/><path d="M36 14l14 10M36 14l6 16M36 14l18 2" stroke="#cbd5e1" stroke-width=".6"/><circle cx="76" cy="36" r="5" fill="none" stroke="#94a3b8" stroke-width="2"/><text x="60" y="44" font-size="16" text-anchor="middle" fill="#ef4444" font-weight="900" font-family="Menlo,monospace">−€</text></svg>';
    }
    var n = Math.max(1, Math.min(14, Math.round(Math.log10(Math.max(cash, 1e4)) * 3 - 11))); // ~1 bei 50 Tsd., 14 bei 100 Mio.
    var s = '<svg class="money-art" viewBox="0 0 120 70" width="' + w + '" height="' + h + '"><defs><linearGradient id="' + id + 'n" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#9fe3b4"/><stop offset="1" stop-color="#3fa565"/></linearGradient></defs>';
    s += '<ellipse cx="60" cy="64" rx="56" ry="5" fill="rgba(0,0,0,.25)"/>';
    // Bündel als Stapel (max. 3 Säulen)
    var cols = Math.min(3, Math.ceil(n / 5)), per = Math.ceil(n / cols);
    for (var c = 0; c < cols; c++) {
      var x = 8 + c * 30, cnt = Math.min(per, n - c * per);
      for (var i = 0; i < cnt; i++) {
        var y = 56 - i * 6;
        s += '<g transform="translate(' + x + ',' + y + ')"><path d="M0 4 L12 0 L36 4 L24 8 Z" fill="url(#' + id + 'n)" stroke="#1f6b3a" stroke-width=".6"/><path d="M0 4 L24 8 L24 11 L0 7 Z" fill="#2f8a50"/><path d="M24 8 L36 4 L36 7 L24 11 Z" fill="#237040"/><path d="M8 3.2 L20 5.6" stroke="#f5f5dc" stroke-width="2.2"/><text x="18" y="6" font-size="3.6" fill="#14532d" font-weight="900" text-anchor="middle" transform="skewX(-20)">€</text></g>';
      }
    }
    // Münzstapel rechts
    var coins = Math.min(8, 2 + Math.floor(n / 2));
    for (var k = 0; k < coins; k++) { var cy = 60 - k * 3.2; s += '<ellipse cx="104" cy="' + (cy + 1.2) + '" rx="10" ry="3.4" fill="#b8860b"/><ellipse cx="104" cy="' + cy + '" rx="10" ry="3.4" fill="#f7d354" stroke="#a87c0c" stroke-width=".5"/>'; }
    s += '<text x="104" y="' + (61 - (coins - 1) * 3.2) + '" font-size="4.5" text-anchor="middle" fill="#8a6a12" font-weight="900">€</text>';
    return s + '</svg>';
  };

  // ---------- Liniendiagramm mit Fläche ----------
  // opts: { w, h, color, invert (Tabellenplatz), min, max, fmt, labels:[first,last], zero }
  U.lineChart = function (vals, opts) {
    opts = opts || {}; var w = opts.w || 300, h = opts.h || 90, col = opts.color || '#22c55e', pad = 4, id = 'lc' + (uid++);
    vals = vals.filter(function (v) { return v != null && !isNaN(v); });
    if (vals.length < 2) return '<div class="chart-empty muted small">' + (opts.empty || 'Noch zu wenige Daten – der Verlauf erscheint nach den ersten Spieltagen.') + '</div>';
    var mn = opts.min != null ? opts.min : Math.min.apply(null, vals), mx = opts.max != null ? opts.max : Math.max.apply(null, vals);
    var rmn = Math.min.apply(null, vals), rmx = Math.max.apply(null, vals);
    if (opts.zero) { mn = Math.min(mn, 0); mx = Math.max(mx, 0); }
    if (mx === mn) { mx += 1; mn -= 1; }
    function X(i) { return pad + i / (vals.length - 1) * (w - 2 * pad); }
    function Y(v) { var t = (v - mn) / (mx - mn); if (opts.invert) t = 1 - t; return h - pad - t * (h - 2 * pad); }
    var line = vals.map(function (v, i) { return f1(X(i)) + ',' + f1(Y(v)); }).join(' ');
    var base = opts.invert ? pad : h - pad;
    var s = '<svg class="line-chart" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" style="width:100%;height:' + h + 'px"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="' + (opts.invert ? 1 : 0) + '" y2="' + (opts.invert ? 0 : 1) + '"><stop offset="0" stop-color="' + col + '" stop-opacity=".45"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 1; g < 4; g++) s += '<line x1="0" x2="' + w + '" y1="' + f1(h * g / 4) + '" y2="' + f1(h * g / 4) + '" stroke="rgba(255,255,255,.06)"/>';
    if (opts.zero && mn < 0) s += '<line x1="0" x2="' + w + '" y1="' + f1(Y(0)) + '" y2="' + f1(Y(0)) + '" stroke="#ef4444" stroke-dasharray="3 3" stroke-width=".8"/>';
    s += '<polygon points="' + f1(X(0)) + ',' + base + ' ' + line + ' ' + f1(X(vals.length - 1)) + ',' + base + '" fill="url(#' + id + ')"/>';
    s += '<polyline points="' + line + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>';
    s += '<circle cx="' + f1(X(vals.length - 1)) + '" cy="' + f1(Y(vals[vals.length - 1])) + '" r="3" fill="' + col + '" stroke="#0b1220" stroke-width="1"/>';
    s += '</svg>';
    if (opts.fmt) s += '<div class="row between small muted" style="margin-top:2px"><span>' + (opts.leftLabel || '') + '</span><span>' + (opts.invert ? 'Bester: ' + opts.fmt(rmn) : 'Tief ' + opts.fmt(rmn) + ' · Hoch ' + opts.fmt(rmx) + ' · Jetzt ' + opts.fmt(vals[vals.length - 1])) + '</span></div>';
    return s;
  };
  // ---------- Bilanzprognose: Kontostand bisher (durchgezogen) + Prognose bis Saisonende (gestrichelt) ----------
  // ---------- Liquiditätsdiagramm: Ist (durchgezogen), Prognose (gestrichelt), Unsicherheitsband, Achsen, Tooltip ----------
  // past: Kontostände dieser Saison, pastW: zugehörige Spielwochen, future: Prognosepfad ab heute (E.forecast().path)
  U.liqChart = function (past, pastW, future, o) {
    o = o || {}; var mainW = (typeof document !== 'undefined' && document.getElementById('main')) ? document.getElementById('main').clientWidth - 90 : 680; var w = Math.max(520, Math.min(1500, mainW)), h = o.h || 200, L = 86, Rr = 16, T = 14, B = 28; // Breite = verfügbarer Platz → Schrift bleibt lesbar
    past = past.filter(function (v) { return v != null && !isNaN(v); });
    if (!past.length) { past = [future[0]]; pastW = [o.from || 0]; }
    var k = past.length - 1, all = past.concat(future.slice(1)), n = all.length;
    var hasEnd = o.seasonEnd ? 1 : 0, nWeeks = future.length - 1 - hasEnd;
    var weekOf = function (i) { return i <= k ? pastW[i] : (o.from || 0) + Math.min(i - k, nWeeks); };
    var band = all.map(function (v, i) { var s = i <= k ? 0 : (o.sigma || 0) * Math.sqrt(Math.min(i - k, nWeeks)); return [v - s, v + s]; });
    var lo = Math.min.apply(null, band.map(function (b) { return b[0]; })), hi = Math.max.apply(null, band.map(function (b) { return b[1]; }));
    if (hi - lo < Math.max(Math.abs(hi), 1) * 0.08) { var mid = (hi + lo) / 2, r0 = Math.max(Math.abs(mid) * 0.06, 50000); lo = mid - r0; hi = mid + r0; }
    var pd = (hi - lo) * 0.08; hi += pd; lo -= pd;
    function X(i) { return L + (w - L - Rr) * i / Math.max(1, n - 1); }
    function Y(v) { return T + (h - T - B) * (1 - (v - lo) / (hi - lo)); }
    var end = all[n - 1], col = end < 0 ? '#E35E63' : end >= past[k] ? '#18B979' : '#E9B44B', id = 'lq' + (uid++);
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" class="liq"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3C95E5" stop-opacity=".28"/><stop offset="1" stop-color="#3C95E5" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 4; g++) { var gv = lo + (hi - lo) * g / 4; s += '<line x1="' + L + '" x2="' + (w - Rr) + '" y1="' + f1(Y(gv)) + '" y2="' + f1(Y(gv)) + '" stroke="#22365A"/><text x="' + (L - 8) + '" y="' + f1(Y(gv) + 4) + '" font-size="11.5" fill="#9CAFC9" text-anchor="end">' + esc(R.fmtMoney(gv)) + '</text>'; }
    if (lo < 0 && hi > 0) s += '<line x1="' + L + '" x2="' + (w - Rr) + '" y1="' + f1(Y(0)) + '" y2="' + f1(Y(0)) + '" stroke="#E35E63" stroke-dasharray="4 3"/>';
    // Zeitachse: Spielwochen
    var ticks = []; for (var i = 0; i < n; i++) { var wv = weekOf(i); if (i === 0 || i === k || i === n - 1 || (wv % 8 === 0 && Math.abs(i - k) > 2 && i < n - 4 && i > 2)) ticks.push(i); }
    ticks.forEach(function (i) { var lbl = i === k ? 'heute' : i === n - 1 ? 'Saisonende' : (weekOf(i) ? weekOf(i) + '. Wo.' : 'Start'); s += '<line x1="' + f1(X(i)) + '" x2="' + f1(X(i)) + '" y1="' + (h - B) + '" y2="' + (h - B + 4) + '" stroke="#2B4161"/><text x="' + f1(X(i)) + '" y="' + (h - 8) + '" font-size="11.5" fill="' + (i === k ? '#EDF4FC' : i === n - 1 ? col : '#9CAFC9') + '" text-anchor="' + (i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle') + '"' + (i === n - 1 ? ' font-weight="700"' : '') + '>' + lbl + '</text>'; });
    // Ist-Fläche + Linie
    var pp = past.map(function (v, i) { return f1(X(i)) + ',' + f1(Y(v)); }).join(' ');
    if (k > 0) s += '<polygon points="' + f1(X(0)) + ',' + (h - B) + ' ' + pp + ' ' + f1(X(k)) + ',' + (h - B) + '" fill="url(#' + id + ')"/><polyline points="' + pp + '" fill="none" stroke="#3C95E5" stroke-width="2.4" stroke-linejoin="round"/>';
    // Unsicherheitsband + Prognose
    if (o.sigma) { var up = [], dn = []; for (var j = k; j < n; j++) { up.push(f1(X(j)) + ',' + f1(Y(band[j][1]))); dn.unshift(f1(X(j)) + ',' + f1(Y(band[j][0]))); } s += '<polygon points="' + up.concat(dn).join(' ') + '" fill="' + col + '" fill-opacity=".12"/>'; }
    var fp = all.slice(k).map(function (v, i2) { return f1(X(k + i2)) + ',' + f1(Y(v)); }).join(' ');
    s += '<polyline points="' + fp + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-dasharray="7 5" stroke-linejoin="round"/>';
    s += '<line x1="' + f1(X(k)) + '" x2="' + f1(X(k)) + '" y1="' + T + '" y2="' + (h - B) + '" stroke="#EDF4FC" stroke-opacity=".25"/>';
    s += '<circle cx="' + f1(X(k)) + '" cy="' + f1(Y(past[k])) + '" r="4.5" fill="#3C95E5" stroke="#0B1426" stroke-width="1.5"/><circle cx="' + f1(X(n - 1)) + '" cy="' + f1(Y(end)) + '" r="5" fill="' + col + '" stroke="#0B1426" stroke-width="1.5"/>';
    // Tooltip-Zonen je Woche
    var zw = (w - L - Rr) / Math.max(1, n - 1);
    for (var t = 0; t < n; t++) {
      var tip = (t === n - 1 && hasEnd ? 'Saisonende inkl. Prämien' : t <= k ? (t === k ? 'Heute' : weekOf(t) + '. Spielwoche') + ' · Ist' : weekOf(t) + '. Spielwoche · Prognose') + ': ' + R.fmtMoney(all[t]) + (t > k && o.sigma ? ' (±' + R.fmtMoney(band[t][1] - all[t]) + ')' : '');
      s += '<rect class="tipzone" data-tip="' + esc(tip) + '" data-cx="' + f1(X(t)) + '" data-cy="' + f1(Y(all[t])) + '" x="' + f1(X(t) - zw / 2) + '" y="' + T + '" width="' + f1(zw) + '" height="' + (h - T - B) + '" fill="transparent"/>';
    }
    return '<div class="chart-box liq-box">' + s + '</svg><div class="liq-legend"><span><i class="lg-ist"></i>Ist</span><span><i class="lg-prog" style="border-color:' + col + '"></i>Prognose</span>' + (o.sigma ? '<span><i class="lg-band" style="background:' + col + '"></i>Unsicherheitsbereich</span>' : '') + '</div></div>';
  };
  U.forecastChart = function (past, future, opts) { return U.liqChart(past, past.map(function (v, i) { return i; }), future, opts); };
  // Tooltip für Diagramme (Maus und Touch)
  if (typeof document !== 'undefined') {
    var tipEl = null;
    var showTip = function (e) {
      var z = e.target && e.target.closest ? e.target.closest('.tipzone') : null;
      if (!z) { if (tipEl) tipEl.style.display = 'none'; return; }
      if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'chart-tip'; document.body.appendChild(tipEl); }
      tipEl.textContent = z.getAttribute('data-tip'); tipEl.style.display = 'block';
      var x = e.clientX, y = e.clientY;
      tipEl.style.left = Math.min(window.innerWidth - tipEl.offsetWidth - 8, x + 12) + 'px'; tipEl.style.top = Math.max(8, y - 34) + 'px';
    };
    document.addEventListener('mousemove', showTip);
    document.addEventListener('pointerdown', showTip);
  }
  // ---------- Balken (horizontal, für Finanzbericht) ----------
  U.hbars = function (items, total, col, icons) {
    return items.map(function (it) {
      var pct = total ? Math.abs(it.v) / total * 100 : 0;
      return '<div class="hbar"><div class="hbar-l"><span>' + (icons && U.finIcon ? U.lc(U.finIcon(it.k), 14) + ' ' : '') + esc(it.k) + '</span><b class="mono">' + money(it.v) + '</b></div><div class="hbar-t"><div style="width:' + f1(Math.max(1.5, pct)) + '%;background:' + col + '"></div></div></div>';
    }).join('');
  };
  // ---------- Halbkreis-Anzeige ----------
  U.gauge = function (pct, label, col, size) {
    size = size || 110; pct = R.clamp(pct || 0, 0, 100); col = col || (pct < 35 ? '#ef4444' : pct < 60 ? '#f5b301' : '#22c55e');
    var r = 40, cx = 50, cy = 50, a = Math.PI * (1 - pct / 100), x = cx + Math.cos(a) * r, y = cy - Math.sin(a) * r;
    return '<svg class="gauge" viewBox="0 0 100 60" width="' + size + '" height="' + (size * 0.6) + '"><path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#24345a" stroke-width="9" stroke-linecap="round"/><path d="M10 50 A40 40 0 0 1 ' + f1(x) + ' ' + f1(y) + '" fill="none" stroke="' + col + '" stroke-width="9" stroke-linecap="round"/><text x="50" y="47" text-anchor="middle" font-size="16" font-weight="900" fill="#e6ecf7" font-family="Menlo,monospace">' + Math.round(pct) + '</text>' + (label ? '<text x="50" y="58" text-anchor="middle" font-size="7.5" fill="#8ea0c2">' + esc(label) + '</text>' : '') + '</svg>';
  };
  // Hallen-Auslastung als gefüllte Tribüne
  U.fillBar = function (pct, col) {
    pct = R.clamp(pct || 0, 0, 100); col = col || '#22c55e';
    var s = '<svg viewBox="0 0 100 16" preserveAspectRatio="none" style="width:100%;height:14px;display:block"><rect width="100" height="16" rx="3" fill="#24345a"/>';
    for (var i = 0; i < 20; i++) { var on = i < pct / 5; s += '<rect x="' + (1 + i * 4.95) + '" y="2" width="4" height="12" rx="1" fill="' + (on ? col : '#2f4370') + '"/>'; }
    return s + '</svg>';
  };

  // ---------- Verlauf aus der Vereinshistorie ----------
  U.hist = function (c, key, n) { var h = (c.hist || []).filter(function (x) { return x[key] != null; }); return h.slice(-(n || 40)).map(function (x) { return x[key]; }); };

  // ---------- Retro-Bankfenster (Säulenfassade, Fenster mit blauen Titelleisten) ----------
  U.bankHero = function (st, c) {
    var debt = E.debt(c), stocksV = E.portfolioValue(st, c, 'stocks'), cryptoV = E.portfolioValue(st, c, 'crypto'), total = c.cash + c.savings + stocksV + cryptoV - debt;
    var rate = E.loanRate(st, c), lim = E.creditLimit(st, c);
    var facade = '<svg class="bank-facade" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="bkSky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#3f8fd6"/><stop offset="1" stop-color="#a9d3f2"/></linearGradient><linearGradient id="bkCol" x1="0" x2="1"><stop offset="0" stop-color="#b08d55"/><stop offset=".45" stop-color="#f3e2b8"/><stop offset="1" stop-color="#9c7a45"/></linearGradient></defs>' +
      '<rect width="900" height="300" fill="url(#bkSky)"/><g fill="#fff" opacity=".85"><ellipse cx="140" cy="40" rx="70" ry="16"/><ellipse cx="190" cy="32" rx="40" ry="14"/><ellipse cx="720" cy="56" rx="90" ry="18"/><ellipse cx="660" cy="48" rx="44" ry="13"/></g>' +
      '<polygon points="40,118 450,58 860,118" fill="#d9bf86" stroke="#8a6a32" stroke-width="2"/><polygon points="90,112 450,70 810,112" fill="#c7a86c"/><rect x="40" y="118" width="820" height="20" fill="#e7d3a3"/><rect x="40" y="136" width="820" height="6" fill="#a88a55"/>';
    for (var i = 0; i < 9; i++) { var x = 62 + i * 96; facade += '<rect x="' + (x - 6) + '" y="142" width="44" height="10" fill="#e7d3a3"/><rect x="' + x + '" y="152" width="32" height="128" fill="url(#bkCol)"/>' + [6, 13, 20, 26].map(function (dx) { return '<line x1="' + (x + dx) + '" y1="154" x2="' + (x + dx) + '" y2="278" stroke="rgba(90,60,20,.25)" stroke-width="1"/>'; }).join('') + '<rect x="' + (x - 6) + '" y="278" width="44" height="10" fill="#d9bf86"/>'; }
    facade += '<rect x="0" y="286" width="900" height="14" fill="#8a6a42"/><g opacity=".35"><rect x="0" y="0" width="900" height="300" fill="#c79a52" style="mix-blend-mode:multiply"/></g></svg>';
    var row = function (l, v, cls) { return '<tr><td>' + l + '</td><td class="num ' + (cls || '') + '">' + v + '</td></tr>'; };
    var h = '<div class="bank-scene">' + facade +
      (st.settings.cheatEnabled ? '<div class="director-sign" data-act="bankSign" title="">BANKDIREKTOR</div>' : '') +
      '<div class="rw"><div class="rw-title">Vereinsbank ' + esc(c.city) + '</div><div class="rw-body">' +
      '<div class="rw-grid"><div class="rw-art">' + U.moneyArt(c.cash, 220, 128) + '<div class="rw-cash ' + (c.cash < 0 ? 'neg' : '') + '">' + money(c.cash) + '</div></div>' +
      '<div><div class="rw-h">FINANZSTATUS</div><div class="rw-name">' + esc(c.name) + '</div><table class="rw-t"><tr><th>Konto</th><th class="num">€</th></tr>' +
      row('Girokonto', money(c.cash), c.cash < 0 ? 'neg' : '') + row('Tagesgeld', money(c.savings)) + row('Aktien / Krypto', money(stocksV + cryptoV)) + row('Kredite', debt ? '−' + money(debt) : money(0), debt ? 'neg' : '') +
      '<tr class="rw-sum"><td>Gesamtvermögen</td><td class="num ' + (total < 0 ? 'neg' : '') + '">' + money(total) + '</td></tr></table></div></div>' +
      '<div class="rw-grid rw-lower"><div><div class="rw-h">KREDIT</div><table class="rw-t">' + row('Aufgenommen', money(debt)) + row('Kreditrahmen frei', money(lim)) + row('Zinssatz', (rate * 100).toFixed(1).replace('.', ',') + ' %') + '</table></div>' +
      '<div><div class="rw-h">TAGESGELD</div><table class="rw-t">' + row('Zinssatz', (st.savingsRate * 100).toFixed(2).replace('.', ',') + ' %') + row('Guthaben', money(c.savings)) + row('Zinsen/Monat', money(c.savings * st.savingsRate * E.INTEREST_MONTH / E.WEEKS)) + row('Aufgelaufen', money(c.interestAccrued || 0)) + '</table></div></div>' +
      '</div></div></div>';
    return h;
  };
})(RFM);
