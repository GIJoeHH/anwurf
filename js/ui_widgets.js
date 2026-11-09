// ANWURF! – Grafik-Bausteine: Symbole, Geldstapel, Verlaufsdiagramme, Anzeigen, Retro-Bankfenster
(function (R) {
  var E = R.econ, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;
  function f1(n) { return (Math.round(n * 10) / 10).toString(); }
  var uid = 0;

  // ---------- Symbole (eigene SVGs, farbig) ----------
  var ICONS = {
    trophy: '<path d="M7 3h10v3h3v2a4 4 0 0 1-4 4h-.3A5 5 0 0 1 13 14.8V17h3v3H8v-3h3v-2.2A5 5 0 0 1 8.3 12H8a4 4 0 0 1-4-4V6h3V3zm-1 5a2 2 0 0 0 2 2V8H6zm12 0h-2v2a2 2 0 0 0 2-2z" fill="#f5c542" stroke="#8a6a12" stroke-width=".8"/>',
    coins: '<ellipse cx="9" cy="17" rx="6" ry="2.4" fill="#d4a017"/><rect x="3" y="12" width="12" height="5" fill="#e8b923"/><ellipse cx="9" cy="12" rx="6" ry="2.4" fill="#f7d354" stroke="#a87c0c" stroke-width=".6"/><ellipse cx="15" cy="10" rx="6" ry="2.4" fill="#d4a017"/><rect x="9" y="5" width="12" height="5" fill="#e8b923"/><ellipse cx="15" cy="5" rx="6" ry="2.4" fill="#f7d354" stroke="#a87c0c" stroke-width=".6"/><text x="15" y="7" font-size="4.6" text-anchor="middle" font-weight="900" fill="#8a6a12">€</text>',
    fans: '<circle cx="7" cy="8" r="3" fill="#f2c9a0"/><path d="M2 20c0-4 2.5-7 5-7s5 3 5 7z" fill="#e11d48"/><circle cx="17" cy="8" r="3" fill="#e8b48a"/><path d="M12 20c0-4 2.5-7 5-7s5 3 5 7z" fill="#2563eb"/><circle cx="12" cy="6" r="3.2" fill="#f0c7a0"/><path d="M6.5 21c0-4.5 2.6-8 5.5-8s5.5 3.5 5.5 8z" fill="#22c55e"/>',
    stadium: '<ellipse cx="12" cy="14" rx="10" ry="6" fill="#94a3b8"/><ellipse cx="12" cy="13" rx="10" ry="6" fill="#cbd5e1" stroke="#64748b" stroke-width=".6"/><ellipse cx="12" cy="13" rx="6.5" ry="3.6" fill="#22a447"/><line x1="12" y1="9.4" x2="12" y2="16.6" stroke="#fff" stroke-width=".6"/><path d="M3 9l2-5M21 9l-2-5" stroke="#64748b" stroke-width="1"/><circle cx="5" cy="4" r="1.2" fill="#fde68a"/><circle cx="19" cy="4" r="1.2" fill="#fde68a"/>',
    heart: '<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="#ef4444" stroke="#7f1d1d" stroke-width=".8"/>',
    bank: '<path d="M12 2l10 5H2z" fill="#c9a24a"/><rect x="3" y="8" width="18" height="2" fill="#e5d3a1"/><g fill="#efe3c0"><rect x="4.5" y="10" width="2.4" height="8"/><rect x="9" y="10" width="2.4" height="8"/><rect x="13" y="10" width="2.4" height="8"/><rect x="17.2" y="10" width="2.4" height="8"/></g><rect x="2" y="18" width="20" height="3" fill="#a8885a"/>',
    debt: '<rect x="3" y="6" width="18" height="13" rx="2" fill="#7f1d1d"/><rect x="3" y="9" width="18" height="2.6" fill="#1f2937"/><path d="M6 15h6" stroke="#fca5a5" stroke-width="1.4"/><circle cx="18" cy="5" r="4" fill="#ef4444"/><path d="M16.3 5h3.4" stroke="#fff" stroke-width="1.4"/>',
    piggy: '<ellipse cx="12" cy="13" rx="8" ry="6" fill="#f9a8d4" stroke="#9d174d" stroke-width=".7"/><circle cx="17" cy="11" r=".9" fill="#831843"/><rect x="10" y="6.4" width="4" height="1.2" rx=".5" fill="#831843"/><rect x="7" y="17.5" width="2.2" height="3" fill="#f472b6"/><rect x="14" y="17.5" width="2.2" height="3" fill="#f472b6"/><ellipse cx="20.5" cy="13" rx="1.6" ry="1.9" fill="#f472b6"/><circle cx="12" cy="3.5" r="2" fill="#f7d354" stroke="#a87c0c" stroke-width=".5"/>',
    stocks: '<rect x="2" y="3" width="20" height="18" rx="2" fill="#0f172a"/><polyline points="4,17 8,12 11,14 15,8 20,6" fill="none" stroke="#22c55e" stroke-width="2"/><polygon points="20,6 17,5.5 19.5,9" fill="#22c55e"/>',
    star: '<path d="M12 2l3 6.6 7 .8-5.2 4.8 1.4 7L12 17.8 5.8 21.2l1.4-7L2 9.4l7-.8z" fill="#fbbf24" stroke="#92400e" stroke-width=".8"/>',
    traffic: '<rect x="2" y="13" width="20" height="5" rx="1" fill="#475569"/><path d="M4 15.5h3M10 15.5h3M16 15.5h3" stroke="#fff" stroke-width=".8"/><rect x="5" y="7" width="9" height="5" rx="1.5" fill="#ef4444"/><rect x="7" y="8" width="5" height="2.2" fill="#bfdbfe"/><circle cx="7" cy="12.4" r="1.3" fill="#111"/><circle cx="12.4" cy="12.4" r="1.3" fill="#111"/>',
    city: '<rect x="2" y="10" width="6" height="11" fill="#c9a27e"/><path d="M2 10l3-3 3 3z" fill="#a65c42"/><rect x="9" y="4" width="6" height="17" fill="#8fa1cf"/><rect x="16" y="8" width="6" height="13" fill="#d9cfb8"/><g fill="#fde68a"><rect x="10.3" y="6" width="1.4" height="1.4"/><rect x="12.6" y="6" width="1.4" height="1.4"/><rect x="10.3" y="9" width="1.4" height="1.4"/><rect x="12.6" y="12" width="1.4" height="1.4"/><rect x="17.3" y="10" width="1.4" height="1.4"/><rect x="19.4" y="13" width="1.4" height="1.4"/></g>',
    energy: '<path d="M13 2L4 14h7l-2 8 9-12h-7z" fill="#facc15" stroke="#854d0e" stroke-width=".8"/>',
    growth: '<rect x="3" y="14" width="4" height="7" fill="#60a5fa"/><rect x="10" y="9" width="4" height="12" fill="#3b82f6"/><rect x="17" y="4" width="4" height="17" fill="#1d4ed8"/>',
    ball: '<circle cx="12" cy="12" r="9.5" fill="#fff" stroke="#111" stroke-width=".9"/><path d="M12 7.5l3.6 2.6-1.4 4.3H9.8L8.4 10.1z" fill="#111"/><path d="M12 7.5V2.6M15.6 10.1l4.6-1.5M14.2 14.4l2.8 3.9M9.8 14.4L7 18.3M8.4 10.1L3.8 8.6" stroke="#111" stroke-width=".9"/>'
  };
  U.icon = function (name, size) { size = size || 24; return '<svg class="ic-svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>'; };
  // KPI-Kachel mit Symbol und optionaler Grafik darunter
  U.ikpi = function (icon, label, value, cls, extra) {
    return '<div class="kpi ikpi"><div class="ikpi-top"><div class="ikpi-ic">' + U.icon(icon, 30) + '</div><div><div class="l">' + label + '</div><div class="v ' + (cls || '') + '">' + value + '</div></div></div>' + (extra ? '<div class="ikpi-x">' + extra + '</div>' : '') + '</div>';
  };

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
  U.forecastChart = function (past, future, opts) {
    opts = opts || {}; var w = 640, h = opts.h || 190, L = 84, Rr = 14, T = 14, B = 24;
    past = past.filter(function (v) { return v != null && !isNaN(v); });
    if (!past.length) past = [future[0]];
    var all = past.concat(future.slice(1)), n = all.length, k = past.length - 1;
    var mn = Math.min.apply(null, all), mx = Math.max.apply(null, all);
    if (mn < 0 && mx > 0) { /* Nulllinie sichtbar */ } else if (mx - mn < Math.abs(mx) * 0.1) { var c0 = (mx + mn) / 2, r0 = Math.max(Math.abs(c0) * 0.06, 50000); mn = c0 - r0; mx = c0 + r0; }
    var pd = (mx - mn) * 0.1; mx += pd; mn -= pd;
    function X(i) { return L + (w - L - Rr) * i / Math.max(1, n - 1); }
    function Y(v) { return T + (h - T - B) * (1 - (v - mn) / (mx - mn)); }
    var end = all[n - 1], col = end < 0 ? '#ef4444' : end >= past[k] ? '#22c55e' : '#f5b301', id = 'fc' + (uid++);
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" style="width:100%;display:block"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 3; g++) { var gv = mn + (mx - mn) * g / 3; s += '<line x1="' + L + '" x2="' + (w - Rr) + '" y1="' + f1(Y(gv)) + '" y2="' + f1(Y(gv)) + '" stroke="#2a3b60"/><text x="' + (L - 6) + '" y="' + f1(Y(gv) + 4) + '" font-size="12" fill="#9fb0d0" text-anchor="end">' + esc(R.fmtMoney(gv)) + '</text>'; }
    if (mn < 0 && mx > 0) s += '<line x1="' + L + '" x2="' + (w - Rr) + '" y1="' + f1(Y(0)) + '" y2="' + f1(Y(0)) + '" stroke="#ef4444" stroke-dasharray="4 3"/><text x="' + (w - Rr - 4) + '" y="' + f1(Y(0) - 4) + '" font-size="11" fill="#fca5a5" text-anchor="end">0 €</text>';
    // Zukunftsbereich hinterlegen
    s += '<rect x="' + f1(X(k)) + '" y="' + T + '" width="' + f1(X(n - 1) - X(k)) + '" height="' + (h - T - B) + '" fill="rgba(245,179,1,.05)"/>';
    var pp = past.map(function (v, i) { return f1(X(i)) + ',' + f1(Y(v)); }).join(' ');
    var fp = all.slice(k).map(function (v, i) { return f1(X(k + i)) + ',' + f1(Y(v)); }).join(' ');
    var base = f1(Y(mn < 0 && mx > 0 ? 0 : mn));
    s += '<polygon points="' + f1(X(k)) + ',' + base + ' ' + fp + ' ' + f1(X(n - 1)) + ',' + base + '" fill="url(#' + id + ')"/>';
    if (past.length > 1) s += '<polyline points="' + pp + '" fill="none" stroke="#7dd3fc" stroke-width="2.2" stroke-linejoin="round"/>';
    s += '<polyline points="' + fp + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-dasharray="7 5" stroke-linejoin="round"/>';
    s += '<line x1="' + f1(X(k)) + '" x2="' + f1(X(k)) + '" y1="' + T + '" y2="' + (h - B) + '" stroke="#e6ecf7" stroke-opacity=".35"/>';
    s += '<circle cx="' + f1(X(k)) + '" cy="' + f1(Y(past[k])) + '" r="4.5" fill="#7dd3fc" stroke="#0b1220" stroke-width="1.5"/>';
    s += '<circle cx="' + f1(X(n - 1)) + '" cy="' + f1(Y(end)) + '" r="5" fill="' + col + '" stroke="#0b1220" stroke-width="1.5"/>';
    s += '<text x="' + f1(X(k)) + '" y="' + (h - 7) + '" font-size="12" fill="#e6ecf7" text-anchor="' + (k === 0 ? 'start' : 'middle') + '">heute</text>';
    if (k > 0) s += '<text x="' + L + '" y="' + (h - 7) + '" font-size="12" fill="#9fb0d0">' + esc(opts.startLabel || 'Saisonstart') + '</text>';
    s += '<text x="' + (w - Rr) + '" y="' + (h - 7) + '" font-size="12" fill="' + col + '" text-anchor="end" font-weight="700">Saisonende</text>';
    return '<div class="chart-box">' + s + '</svg></div>';
  };
  // ---------- Balken (horizontal, für Finanzbericht) ----------
  U.hbars = function (items, total, col) {
    return items.map(function (it) {
      var pct = total ? Math.abs(it.v) / total * 100 : 0;
      return '<div class="hbar"><div class="hbar-l"><span>' + esc(it.k) + '</span><b class="mono">' + money(it.v) + '</b></div><div class="hbar-t"><div style="width:' + f1(Math.max(1.5, pct)) + '%;background:' + col + '"></div></div></div>';
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
