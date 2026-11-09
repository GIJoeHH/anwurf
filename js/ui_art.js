// ANWURF! – Illustrierte Grafiken (Stadion, Vereinsstadt, Medizin) im weichen Iso-Stil
// Ersetzt die Voxel-Ansichten aus ui_gfx.js: Verläufe, geschwungene Dächer, Glasfassaden, Publikum, runde Bäume.
// Alle Ausbaustufen sind sichtbar; Klickflächen (data-act stadiumPart / cityPlot / nav-stadion) bleiben erhalten.
(function (R) {
  var U = R.ui, D = R.data, E = R.econ, G = U.gfx, esc = R.esc;

  // ---------- Farben & Zufall ----------
  function h2r(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function r2h(c) { return '#' + c.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function shade(h, f) { var c = h2r(h); return r2h(f >= 1 ? c.map(function (v) { return v + (255 - v) * (f - 1); }) : c.map(function (v) { return v * f; })); }
  function mix(a, b, t) { var x = h2r(a), y = h2r(b); return r2h(x.map(function (v, i) { return v + (y[i] - v) * t; })); }
  function lum(hex) { var c = h2r(hex); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function rng(seed) { var s = (seed >>> 0) || 7; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hsh(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function f(n) { return (Math.round(n * 10) / 10).toString(); }
  function lvl(c, k) { var fd = D.facilities[k]; return c.fac[k] != null ? c.fac[k] : (fd.min || 0); }

  // ---------- Szene mit Tiefensortierung ----------
  function Scene(S, ox, oy, idp) { this.S = S; this.ox = ox; this.oy = oy; this.items = []; this.defs = {}; this.id = idp || ('a' + Math.floor(Math.random() * 1e6)); this.n = 0; }
  Scene.prototype.P = function (x, y, z) {
    var p = [this.ox + (x - y) * this.S * 0.866, this.oy + (x + y) * this.S * 0.5 - (z || 0) * this.S];
    if (this.fitOn) { var b = this.bb || (this.bb = [1e9, 1e9, -1e9, -1e9]); if (p[0] < b[0]) b[0] = p[0]; if (p[1] < b[1]) b[1] = p[1]; if (p[0] > b[2]) b[2] = p[0]; if (p[1] > b[3]) b[3] = p[1]; }
    return p;
  };
  // Bildausschnitt: Bodenplatte bestimmt den Rahmen (plus Rand oben für Dächer, Masten, Tafeln)
  Scene.prototype.ground = function (x0, y0, x1, y1, fill, sky) {
    this.fitOn = true; var g = this.poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], fill); this.fitOn = false;
    this.add(-999, g); this.sky = sky;
  };
  Scene.prototype.pts = function (arr) { var s = this; return arr.map(function (p) { var q = s.P(p[0], p[1], p[2]); return f(q[0]) + ',' + f(q[1]); }).join(' '); };
  Scene.prototype.add = function (depth, svg) { this.items.push({ d: depth, n: this.n++, s: svg }); };
  Scene.prototype.grad = function (c1, c2, vert) {
    var k = 'g' + (c1 + c2 + (vert ? 'v' : 'h')).replace(/[^a-z0-9]/gi, ''), id = this.id + k;
    if (!this.defs[k]) this.defs[k] = '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vert ? 0 : 1) + '" y2="' + (vert ? 1 : 0) + '"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient>';
    return 'url(#' + id + ')';
  };
  Scene.prototype.poly = function (arr, fill, extra) { return '<polygon points="' + this.pts(arr) + '" fill="' + fill + '"' + (extra ? ' ' + extra : '') + '/>'; };
  Scene.prototype.crowd = function (c1, c2) {
    var k = 'cr' + (c1 + c2).replace(/[^a-z0-9]/gi, ''), id = this.id + k;
    if (!this.defs[k]) {
      var r = rng(hsh(k)), cols = [c1, c2, '#f1f5f9', '#fde68a', '#fca5a5', c1, '#94a3b8', c2, '#1e293b'], dots = '';
      for (var i = 0; i < 46; i++) dots += '<circle cx="' + f(r() * 14) + '" cy="' + f(r() * 10) + '" r="' + f(0.7 + r() * 0.6) + '" fill="' + cols[Math.floor(r() * cols.length)] + '"/>';
      this.defs[k] = '<pattern id="' + id + '" width="14" height="10" patternUnits="userSpaceOnUse"><rect width="14" height="10" fill="' + shade(c1, 0.45) + '"/>' + dots + '</pattern>';
    }
    return 'url(#' + id + ')';
  };
  Scene.prototype.render = function (w, h, cls) {
    this.items.sort(function (a, b) { return a.d - b.d || a.n - b.n; });
    var vb = '0 0 ' + w + ' ' + h, bg = '';
    if (this.bb) { var b = this.bb, padX = (b[2] - b[0]) * 0.02, top = (b[3] - b[1]) * (this.topPad || 0.16); vb = f(b[0] - padX) + ' ' + f(b[1] - top) + ' ' + f(b[2] - b[0] + 2 * padX) + ' ' + f(b[3] - b[1] + top + padX); bg = '<rect x="' + f(b[0] - padX) + '" y="' + f(b[1] - top) + '" width="' + f(b[2] - b[0] + 2 * padX) + '" height="' + f(b[3] - b[1] + top + padX) + '" fill="' + this.grad(this.sky || '#9fd0ff', '#e6f4ff', true) + '"/>'; }
    var defs = Object.keys(this.defs).map(function (k) { return this.defs[k]; }, this).join('') +
      '<filter id="' + this.id + 'sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '<radialGradient id="' + this.id + 'glow"><stop offset="0" stop-color="#fff7cc" stop-opacity=".9"/><stop offset="1" stop-color="#fff7cc" stop-opacity="0"/></radialGradient>';
    return '<svg class="' + (cls || 'art-svg') + '" viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + bg + this.items.map(function (i) { return i.s; }).join('') + '</svg>';
  };
  function clickG(svg, act, key, title) { return '<g class="iso-click" data-act="' + act + '" data-k="' + key + '">' + svg + (title ? '<title>' + esc(title) + '</title>' : '') + '</g>'; }

  // ---------- Grundformen ----------
  // Quader mit Verlaufsflächen; o: { top, side, win:[rows,cols,color], glass, roof }
  function box(sc, x, y, z, w, d, h, col, o) {
    o = o || {};
    var top = o.top || shade(col, 1.18), fA = shade(col, 0.72), fB = shade(col, 0.92), s = '';
    s += sc.poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], sc.grad(fA, shade(fA, 0.82), true));
    s += sc.poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], sc.grad(fB, shade(fB, 0.85), true));
    if (o.win) s += windows(sc, x, y, z, w, d, h, o.win[0], o.win[1], o.win[2] || '#bfe3ff', o.glass);
    s += sc.poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], top, 'stroke="rgba(255,255,255,.25)" stroke-width=".6"');
    if (o.parapet) s += sc.poly([[x, y, z + h], [x + w, y, z + h], [x + w, y, z + h + 0.25], [x, y, z + h + 0.25]], shade(col, 1.25));
    return s;
  }
  // Fensterraster auf den beiden sichtbaren Fassaden
  function windows(sc, x, y, z, w, d, h, rows, cols, wc, glass) {
    var s = '', gh = h / rows;
    for (var r = 0; r < rows; r++) {
      var z0 = z + r * gh + gh * 0.22, z1 = z + (r + 1) * gh - gh * 0.18;
      var cw = w / cols, cd = d / Math.max(1, Math.round(cols * d / w));
      for (var i = 0; i < cols; i++) { var a = x + i * cw + cw * 0.15, b = x + (i + 1) * cw - cw * 0.15; s += sc.poly([[a, y + d, z0], [b, y + d, z0], [b, y + d, z1], [a, y + d, z1]], glass ? sc.grad('#dff3ff', '#6aa8d8', true) : wc, 'opacity=".9"'); }
      var nd = Math.max(1, Math.round(cols * d / w));
      for (var j = 0; j < nd; j++) { var a2 = y + j * (d / nd) + (d / nd) * 0.15, b2 = y + (j + 1) * (d / nd) - (d / nd) * 0.15; s += sc.poly([[x + w, a2, z0], [x + w, b2, z0], [x + w, b2, z1], [x + w, a2, z1]], glass ? sc.grad('#c8e6fb', '#4f86b8', true) : shade(wc, 0.85), 'opacity=".9"'); }
    }
    return s;
  }
  function flat(sc, x, y, w, d, fill, z, extra) { return sc.poly([[x, y, z || 0], [x + w, y, z || 0], [x + w, y + d, z || 0], [x, y + d, z || 0]], fill, extra); }
  function shadowRect(sc, x, y, w, d, off) { off = off || 1.2; return sc.poly([[x + off, y + off * 0.3, 0], [x + w + off * 1.6, y + off * 0.3, 0], [x + w + off * 1.6, y + d + off, 0], [x + off, y + d + off, 0]], 'rgba(0,0,0,.22)', 'filter="url(#' + sc.id + 'sh)"'); }
  function tree(sc, x, y, k, col) {
    k = k || 1; col = col || '#3f8f3a';
    var p = sc.P(x, y, 0), r = 1.6 * k * sc.S, t = sc.P(x, y, 2.6 * k);
    var s = '<ellipse cx="' + f(p[0] + r * 0.5) + '" cy="' + f(p[1] + r * 0.12) + '" rx="' + f(r * 1.05) + '" ry="' + f(r * 0.45) + '" fill="rgba(0,0,0,.2)"/>' +
      '<rect x="' + f(p[0] - r * 0.12) + '" y="' + f(t[1]) + '" width="' + f(r * 0.24) + '" height="' + f(p[1] - t[1]) + '" fill="#6b4a2b"/>' +
      '<circle cx="' + f(t[0]) + '" cy="' + f(t[1] - r * 0.3) + '" r="' + f(r) + '" fill="' + sc.grad(shade(col, 1.35), shade(col, 0.7), true) + '"/>' +
      '<circle cx="' + f(t[0] - r * 0.35) + '" cy="' + f(t[1] - r * 0.75) + '" r="' + f(r * 0.38) + '" fill="rgba(255,255,255,.18)"/>';
    sc.add(x + y + 0.5, s);
  }
  function person(sc, x, y, col, depth) {
    var p = sc.P(x, y, 0), s = sc.S * 0.18;
    sc.add(depth != null ? depth : x + y, '<rect x="' + f(p[0] - s) + '" y="' + f(p[1] - s * 4.2) + '" width="' + f(s * 2) + '" height="' + f(s * 3.2) + '" rx="' + f(s * 0.8) + '" fill="' + col + '"/><circle cx="' + f(p[0]) + '" cy="' + f(p[1] - s * 5) + '" r="' + f(s * 0.95) + '" fill="#f1c9a5"/>');
  }
  function crowdArea(sc, x, y, w, d, n, cols, seed) { var r = rng(seed || 3); for (var i = 0; i < n; i++) person(sc, x + r() * w, y + r() * d, cols[Math.floor(r() * cols.length)]); }
  // Auto entlang x (axis 0) oder y (axis 1)
  function car(sc, x, y, col, axis, depth) {
    var L = 2.2, W = 1.1, s = '';
    var w = axis ? W : L, d = axis ? L : W;
    s += box(sc, x, y, 0.15, w, d, 0.55, col, { top: shade(col, 1.2) });
    s += box(sc, x + (axis ? 0.12 : 0.5), y + (axis ? 0.5 : 0.12), 0.7, axis ? W - 0.24 : 1.1, axis ? 1.1 : W - 0.24, 0.42, '#cfe6f7', { top: shade(col, 1.1) });
    sc.add(depth != null ? depth : x + y + 1, s);
  }
  function bus(sc, x, y, col, axis, len) {
    len = len || 5; var w = axis ? 1.5 : len, d = axis ? len : 1.5;
    sc.add(x + y + 2, box(sc, x, y, 0.2, w, d, 1.7, col || '#f8fafc', { top: '#e2e8f0', win: [1, Math.round(len), '#1e3a5f'] }));
  }
  // Beschriftungstafel wie in den Beispielbildern (dunkelblau, weiße Schrift)
  function label(sc, x, y, z, title, sub, depth, opts) {
    opts = opts || {}; var p = sc.P(x, y, z), fs = opts.size || 11, w = Math.max(title.length * fs * 0.74, sub ? sub.length * fs * 0.52 : 0) + 18, h = sub ? fs * 2.6 : fs * 1.8;
    var s = '<g' + (opts.click ? ' class="iso-click" data-act="' + opts.click + '" data-k="' + opts.key + '"' : '') + '><line x1="' + f(p[0]) + '" y1="' + f(p[1]) + '" x2="' + f(p[0]) + '" y2="' + f(p[1] - 10) + '" stroke="#e2e8f0" stroke-width="1"/>' +
      '<rect x="' + f(p[0] - w / 2) + '" y="' + f(p[1] - 10 - h) + '" width="' + f(w) + '" height="' + f(h) + '" rx="4" fill="' + (opts.bg || '#14284f') + '" stroke="#e2e8f0" stroke-width="1.2"/>' +
      '<text x="' + f(p[0]) + '" y="' + f(p[1] - 10 - h + fs * 1.25) + '" font-size="' + fs + '" font-weight="800" fill="#fff" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif" letter-spacing=".4">' + esc(title) + '</text>' +
      (sub ? '<text x="' + f(p[0]) + '" y="' + f(p[1] - 10 - h + fs * 2.25) + '" font-size="' + f(fs * 0.78) + '" fill="#cbd5e1" text-anchor="middle" font-family="-apple-system,system-ui,sans-serif">' + esc(sub) + '</text>' : '') + '</g>';
    sc.add(depth != null ? depth : 9999, s);
  }

  // ---------- Halle ----------
  // Aufgeschnittene Arena: hinten zwei hohe Wände, vorn nur eine niedrige Brüstung, damit Spielfeld und Ränge sichtbar sind.
  // Grundfläche X..X+34 × Y..Y+52 (wie früher die Halle), Spielfeld 20 × 40 in der Mitte. Liefert Höhe/Ausmaß für Beschriftungen.
  function stadium(sc, c, X, Y, opts) {
    opts = opts || {};
    var c1 = c.colors[0], c2 = c.colors[1];
    var sitz = lvl(c, 'sitz'), steh = lvl(c, 'steh'), dach = lvl(c, 'dach'), vip = lvl(c, 'vip'), licht = lvl(c, 'licht'), video = lvl(c, 'video'), boden = lvl(c, 'rasen'), hosp = lvl(c, 'hosp'), san = lvl(c, 'sanitaer'), tech = lvl(c, 'technik');
    var click = opts.click, base = X + Y, M = opts.compact ? 7 : 14;
    function wrap(svg, key) { return click ? clickG(svg, click, key, D.facilities[key].name + ': ' + D.facilities[key].levels[lvl(c, key)].n) : svg; }
    var cap = E.capacity(c), crowdFill = sc.crowd(c1, c2), fanFill = sc.crowd(c1, shade(c1, 0.6)), seatCol = mix(c1, '#334155', 0.45);
    var CX0 = X + 7, CY0 = Y + 6, CW = 20, CL = 40;                  // Spielfeld
    var H = 7 + Math.min(12, sitz * 1.1 + steh * 0.6);               // Wandhöhe wächst mit der Halle
    var BX0 = X - 1, BY0 = Y - 1, BX1 = X + 35, BY1 = Y + 53;          // Gebäude
    // Vorplatz
    sc.add(base - 60, flat(sc, X - M, Y - M, 34 + 2 * M, 52 + 2 * M, sc.grad('#c9cfd8', '#aeb6c2', true), 0, 'stroke="#e5e7eb" stroke-width=".8"'));
    sc.add(base - 55, shadowRect(sc, BX0, BY0, BX1 - BX0, BY1 - BY0, 2.5));
    // Hallenboden (Innenraum) und Spielfeld
    var floorCol = ['#9aa58c', '#c9a46c', '#d8a45b', '#f97316', '#0f1b33'][boden], courtCol = ['#7f9a6f', '#b98a4f', '#c98f45', '#1d4ed8', '#12305e'][boden];
    var fl = flat(sc, BX0, BY0, BX1 - BX0, BY1 - BY0, shade(floorCol, 0.8), 0.01);
    fl += flat(sc, CX0 - 2, CY0 - 2, CW + 4, CL + 4, floorCol, 0.02);
    if (boden === 2) for (var pq = 0; pq < 12; pq++) fl += flat(sc, CX0 - 2 + pq * (CW + 4) / 12, CY0 - 2, (CW + 4) / 24, CL + 4, 'rgba(120,70,20,.12)', 0.025);
    fl += flat(sc, CX0, CY0, CW, CL, courtCol, 0.03);
    var Lw = 'stroke="#f8fafc" stroke-width="1.1"', ln = '';
    ln += sc.poly([[CX0, CY0, 0.05], [CX0 + CW, CY0, 0.05], [CX0 + CW, CY0 + CL, 0.05], [CX0, CY0 + CL, 0.05]], 'none', Lw);
    ln += sc.poly([[CX0, CY0 + CL / 2, 0.05], [CX0 + CW, CY0 + CL / 2, 0.05]], 'none', Lw);
    function arc(gy, dir, r, dash) { var pts = []; for (var t = 0; t <= 20; t++) { var a = Math.PI * t / 20; pts.push([CX0 + CW / 2 + Math.cos(a) * (r + 1.5) * (t === 0 || t === 20 ? 1 : 1), gy + dir * Math.sin(a) * r, 0.05]); } return '<polyline points="' + sc.pts(pts) + '" fill="' + (dash ? 'none' : 'rgba(255,255,255,.12)') + '" stroke="#f8fafc" stroke-width="1"' + (dash ? ' stroke-dasharray="3 3"' : '') + '/>'; }
    ln += arc(CY0, 1, 6, false) + arc(CY0, 1, 9, true) + arc(CY0 + CL, -1, 6, false) + arc(CY0 + CL, -1, 9, true);
    sc.add(base - 40, wrap(fl + ln, 'rasen'));
    // Tore
    [[CY0, -1], [CY0 + CL, 1]].forEach(function (g) {
      var y0 = g[0], y1 = g[0] + g[1] * 1.2;
      var gs = sc.poly([[CX0 + CW / 2 - 1.5, y0, 0], [CX0 + CW / 2 + 1.5, y0, 0], [CX0 + CW / 2 + 1.5, y0, 2], [CX0 + CW / 2 - 1.5, y0, 2]], 'rgba(255,255,255,.18)', 'stroke="#ef4444" stroke-width="1.6" stroke-dasharray="2 1.6"');
      gs += sc.poly([[CX0 + CW / 2 - 1.5, y1, 0], [CX0 + CW / 2 + 1.5, y1, 0], [CX0 + CW / 2 + 1.5, y0, 2], [CX0 + CW / 2 - 1.5, y0, 2]], 'rgba(255,255,255,.25)', 'stroke="#e2e8f0" stroke-width=".6"');
      sc.add(base - 30 + (g[1] > 0 ? 30 : 0), gs);
    });
    var pr = rng(hsh(c.id + 'pl'));
    for (var q = 0; q < 14; q++) person(sc, CX0 + 2 + pr() * (CW - 4), CY0 + 3 + pr() * (CL - 6), q < 7 ? c1 : '#e5e7eb', base - 25);
    // Hintere Wände (innen sichtbar)
    var wallIn = sc.grad(tech >= 2 ? '#eef2f7' : '#d9dee6', tech >= 2 ? '#b6c2d3' : '#a3adbb', true);
    var wl = sc.poly([[BX0, BY0, 0], [BX0, BY1, 0], [BX0, BY1, H], [BX0, BY0, H]], wallIn) + sc.poly([[BX0, BY0, 0], [BX1, BY0, 0], [BX1, BY0, H], [BX0, BY0, H]], wallIn);
    wl += sc.poly([[BX0 - 0.6, BY0 - 0.6, H], [BX1, BY0 - 0.6, H], [BX1, BY0, H], [BX0, BY0, H], [BX0, BY1, H], [BX0 - 0.6, BY1, H]], '#64748b');
    if (tech >= 1) wl += '<polyline points="' + sc.pts([[BX0 + 0.05, BY1, H * 0.78], [BX0 + 0.05, BY0 + 0.05, H * 0.78], [BX1, BY0 + 0.05, H * 0.78]]) + '" fill="none" stroke="' + c1 + '" stroke-width="' + (tech >= 3 ? 3 : 2) + '"/>';
    if (tech >= 3) wl += '<polyline points="' + sc.pts([[BX0 + 0.05, BY1, H * 0.86], [BX0 + 0.05, BY0 + 0.05, H * 0.86], [BX1, BY0 + 0.05, H * 0.86]]) + '" fill="none" stroke="#7dd3fc" stroke-width="1.6"/>';
    sc.add(base - 70, wrap(wl, 'technik'));
    // Klima & Lüftung: Lüftungsrohre an der Wand
    if (dach > 0) {
      var dct = '';
      for (var di = 0; di < dach; di++) { var dz = H - 0.8 - di * 0.9; dct += sc.poly([[BX0 + 0.2, BY0 + 2, dz], [BX0 + 0.2, BY1 - 2, dz], [BX0 + 0.2, BY1 - 2, dz + 0.55], [BX0 + 0.2, BY0 + 2, dz + 0.55]], sc.grad('#e2e8f0', '#94a3b8', true)); dct += sc.poly([[BX0 + 2, BY0 + 0.2, dz], [BX1 - 2, BY0 + 0.2, dz], [BX1 - 2, BY0 + 0.2, dz + 0.55], [BX0 + 2, BY0 + 0.2, dz + 0.55]], sc.grad('#f1f5f9', '#94a3b8', true)); }
      sc.add(base - 69, wrap(dct, 'dach'));
    }
    // Ränge: Stufen, die vom Spielfeld weg ansteigen
    function stepsX(x0, dir, rows, ya, yb, fill, key, dep) { // Längsseiten (x-Richtung)
      var out = '';
      for (var r = 0; r < rows; r++) { var xs = dir < 0 ? x0 - (r + 1) * 0.95 : x0 + r * 0.95; out += box(sc, xs, ya, 0, 0.95, yb - ya, 0.6 + r * 0.62, seatCol, { top: fill }); }
      sc.add(dep, wrap(out, key));
    }
    function stepsY(y0, dir, rows, xa, xb, fill, key, dep) { // Stirnseiten (hinter den Toren)
      var out = '';
      for (var r = 0; r < rows; r++) { var ys = dir < 0 ? y0 - (r + 1) * 0.95 : y0 + r * 0.95; out += box(sc, xa, ys, 0, xb - xa, 0.95, 0.6 + r * 0.62, seatCol, { top: fill }); }
      sc.add(dep, wrap(out, key));
    }
    var rowsS = Math.min(6, 1 + sitz), rowsF = Math.min(5, steh);
    // hinten links (Haupttribüne) und hinten rechts (Fanblock hinter dem Tor)
    // Stufen hinter einer Seite werden von außen nach innen gezeichnet, damit die vorderen Reihen oben liegen
    (function () { var out = ''; for (var r = rowsS - 1; r >= 0; r--) out += box(sc, CX0 - 2.4 - (r + 1) * 0.95, CY0 + 1, 0, 0.95, CL - 2, 0.6 + r * 0.62, seatCol, { top: sitz === 0 ? '#8b5a2b' : crowdFill }); sc.add(base - 20, wrap(out, 'sitz')); })();
    if (rowsF) (function () { var out = ''; for (var r = rowsF - 1; r >= 0; r--) out += box(sc, CX0, CY0 - 2.6 - (r + 1) * 0.95, 0, CW, 0.95, 0.6 + r * 0.62, seatCol, { top: fanFill }); if (steh >= 4) out += sc.poly([[CX0 + 2, CY0 - 2.8 - rowsF * 0.95, 0.6 + (rowsF - 1) * 0.62 + 0.05], [CX0 + CW - 2, CY0 - 2.8 - rowsF * 0.95, 0.6 + (rowsF - 1) * 0.62 + 0.05], [CX0 + CW - 2, CY0 - 2.8 - rowsF * 0.95, 0.6 + (rowsF - 1) * 0.62 + 1.8], [CX0 + 2, CY0 - 2.8 - rowsF * 0.95, 0.6 + (rowsF - 1) * 0.62 + 1.8]], sc.grad(c1, c2, false), 'opacity=".9"'); sc.add(base - 21, wrap(out, 'steh')); })();
    // vorn: Gegengerade (ab Stufe 2) und zweiter Fanblock (ab Stufe 3)
    if (sitz >= 2) { var out2 = ''; for (var r2 = 0; r2 < Math.min(5, sitz - 1); r2++) out2 += box(sc, CX0 + CW + 2.4 + r2 * 0.95, CY0 + 1, 0, 0.95, CL - 2, 0.6 + r2 * 0.62, seatCol, { top: crowdFill }); sc.add(base + 5, wrap(out2, 'sitz')); }
    if (steh >= 3) { var out3 = ''; for (var r3 = 0; r3 < Math.min(4, steh - 2); r3++) out3 += box(sc, CX0, CY0 + CL + 2.6 + r3 * 0.95, 0, CW, 0.95, 0.6 + r3 * 0.62, seatCol, { top: fanFill }); sc.add(base + 6, wrap(out3, 'steh')); }
    // Logen (VIP) als Glasband an der Wand über der Haupttribüne
    if (vip > 0) {
      var vz = Math.max(4.2, 0.6 + rowsS * 0.62 + 1.2), vn = Math.min(10, 2 + vip * 2), vs = '';
      for (var v = 0; v < vn; v++) { var vy0 = CY0 + 2 + v * (CL - 4) / vn; vs += sc.poly([[BX0 + 0.1, vy0, vz], [BX0 + 0.1, vy0 + (CL - 4) / vn - 0.5, vz], [BX0 + 0.1, vy0 + (CL - 4) / vn - 0.5, vz + 1.6], [BX0 + 0.1, vy0, vz + 1.6]], sc.grad('#e0f2fe', '#38bdf8', true), 'stroke="#0f172a" stroke-width=".5"'); }
      sc.add(base - 65, wrap(vs, 'vip'));
    }
    // Hallenlicht: Traverse mit Strahlern über dem Feld
    if (licht > 0) {
      var lz = H - 0.3, ls = '';
      ls += sc.poly([[CX0 + 2, CY0 + 4, lz], [CX0 + 2, CY0 + CL - 4, lz]], 'none', 'stroke="#94a3b8" stroke-width="1.6"') + sc.poly([[CX0 + CW - 2, CY0 + 4, lz], [CX0 + CW - 2, CY0 + CL - 4, lz]], 'none', 'stroke="#94a3b8" stroke-width="1.6"');
      var nl = licht * 4;
      for (var li = 0; li < nl; li++) { var ly = CY0 + 5 + li * (CL - 10) / Math.max(1, nl - 1); [CX0 + 2, CX0 + CW - 2].forEach(function (lx) { var lp = sc.P(lx, ly, lz); ls += '<rect x="' + f(lp[0] - sc.S * 0.5) + '" y="' + f(lp[1] - sc.S * 0.2) + '" width="' + f(sc.S) + '" height="' + f(sc.S * 0.5) + '" rx="1" fill="' + (licht >= 3 ? ['#f0abfc', '#93c5fd', '#fde68a'][li % 3] : '#fffbe6') + '"/>'; if (licht >= 2) ls += '<circle cx="' + f(lp[0]) + '" cy="' + f(lp[1]) + '" r="' + f(sc.S * 1.8) + '" fill="url(#' + sc.id + 'glow)" opacity=".55"/>'; }); }
      sc.add(base + 40, wrap(ls, 'licht'));
    }
    // Anzeigetafel an der Stirnwand bzw. Videowürfel über dem Mittelkreis
    if (video >= 1) {
      var sv;
      if (video >= 2) {
        var vx = CX0 + CW / 2 - 2.2, vy = CY0 + CL / 2 - 2.2, vz2 = H - 4.6;
        sv = sc.poly([[vx + 2.2, vy + 2.2, vz2 + 4.4], [vx + 2.2, vy + 2.2, H - 0.2]], 'none', 'stroke="#64748b" stroke-width="1"') + box(sc, vx, vy, vz2, 4.4, 4.4, 3.4, '#111827', { top: '#374151' });
        sv += sc.poly([[vx + 4.4, vy + 0.3, vz2 + 0.4], [vx + 4.4, vy + 4.1, vz2 + 0.4], [vx + 4.4, vy + 4.1, vz2 + 3], [vx + 4.4, vy + 0.3, vz2 + 3]], sc.grad('#1d4ed8', '#0ea5e9', true)) + sc.poly([[vx + 0.3, vy + 4.4, vz2 + 0.4], [vx + 4.1, vy + 4.4, vz2 + 0.4], [vx + 4.1, vy + 4.4, vz2 + 3], [vx + 0.3, vy + 4.4, vz2 + 3]], sc.grad(c1, shade(c1, 0.6), true));
        sc.add(base + 45, wrap(sv, 'video'));
      } else {
        var ax = X + 12, az = H - 3.6;
        sv = sc.poly([[ax, BY0 + 0.1, az], [ax + 10, BY0 + 0.1, az], [ax + 10, BY0 + 0.1, az + 2.6], [ax, BY0 + 0.1, az + 2.6]], '#111827', 'stroke="#475569" stroke-width="1"');
        var ap = sc.P(ax + 5, BY0 + 0.1, az + 0.9);
        sv += '<text x="' + f(ap[0]) + '" y="' + f(ap[1]) + '" font-size="' + f(sc.S * 1.3) + '" font-weight="900" fill="#fbbf24" text-anchor="middle" font-family="Menlo,monospace">' + esc(c.short.slice(0, 8).toUpperCase()) + ' 30:28</text>';
        sc.add(base - 64, wrap(sv, 'video'));
      }
    }
    // Vordere Brüstung (Außenfassade, niedrig aufgeschnitten) mit Eingängen
    var fz = 1.4, facade = sc.grad(tech >= 2 ? '#dbe4ef' : '#c3ccd8', tech >= 2 ? '#6b7f99' : '#56637a', true);
    var fr = sc.poly([[BX1, BY0, 0], [BX1, BY1, 0], [BX1, BY1, fz], [BX1, BY0, fz]], facade) + sc.poly([[BX0, BY1, 0], [BX1, BY1, 0], [BX1, BY1, fz], [BX0, BY1, fz]], facade);
    fr += sc.poly([[BX1, BY0, fz], [BX1, BY1, fz], [BX0, BY1, fz], [BX0, BY1, fz + 0.15], [BX1 + 0.2, BY1 + 0.2, fz + 0.15], [BX1 + 0.2, BY0, fz + 0.15]], '#e2e8f0');
    for (var dI = 0; dI < 6; dI++) { var dy = BY0 + 5 + dI * 8.5; fr += sc.poly([[BX1 + 0.02, dy, 0], [BX1 + 0.02, dy + 1.6, 0], [BX1 + 0.02, dy + 1.6, 1.1], [BX1 + 0.02, dy, 1.1]], tech >= 2 ? sc.grad('#dff3ff', '#6aa8d8', true) : '#334155'); }
    if (tech >= 1) fr += '<polyline points="' + sc.pts([[BX1 + 0.03, BY0, fz * 0.75], [BX1 + 0.03, BY1, fz * 0.75], [BX0, BY1 + 0.03, fz * 0.75]]) + '" fill="none" stroke="' + c1 + '" stroke-width="2"/>';
    sc.add(base + 60, wrap(fr, 'technik'));
    // Kioske, Gastronomie, Sanitär rund um die Halle
    var kn = Math.min(8, hosp * 2 + san), kr = rng(hsh(c.id + 'k'));
    for (var k = 0; k < kn; k++) {
      var side = k % 2, kx = side ? BX1 + 3 + kr() : X - 6 + k * 5.5, ky = side ? Y - 4 + k * 7 : BY1 + 3 + kr();
      var kc = k < hosp * 2 ? ['#dc2626', '#f59e0b', '#2563eb', '#16a34a'][k % 4] : '#64748b';
      sc.add(kx + ky + 63, wrap(box(sc, kx, ky, 0, 3, 2.4, 2.2, '#f8fafc', { top: kc }) + sc.poly([[kx - 0.3, ky + 2.4, 2.2], [kx + 3.3, ky + 2.4, 2.2], [kx + 3.3, ky + 3.1, 1.7], [kx - 0.3, ky + 3.1, 1.7]], kc), k < hosp * 2 ? 'hosp' : 'sanitaer'));
    }
    // Fans auf dem Vorplatz
    crowdArea(sc, X - M + 2, BY1 + (opts.compact ? 2 : 6), 34 + 2 * M - 6, opts.compact ? 3 : 6, (opts.compact ? 8 : 16) + Math.min(40, Math.round(cap / 300)), [c1, c1, c2, '#334155'], hsh(c.id + 'fans'));
    return { top: H + 3, cap: cap };
  }

  // ---------- Verkehr: Straße, Parkplätze, ÖPNV ----------
  function infra(sc, c, a) {
    var str = lvl(c, 'strasse'), park = lvl(c, 'parken'), oep = lvl(c, 'oepnv');
    var x0 = a.x0, x1 = a.x1, ry = a.roadY, wRoad = [0, 2.6, 3.4, 4.4, 6, 7.5, 9][str];
    // Straße
    var road = flat(sc, x0, ry, x1 - x0, wRoad, str === 1 ? sc.grad('#c8b48a', '#a8946a', true) : sc.grad('#4b5563', '#374151', true), 0.01);
    if (str >= 2) { var lanes = Math.max(1, Math.round(wRoad / 3)); for (var l = 1; l < lanes + (str >= 5 ? 1 : 0); l++) road += sc.poly([[x0, ry + wRoad * l / (lanes + (str >= 5 ? 1 : 0)), 0.03], [x1, ry + wRoad * l / (lanes + (str >= 5 ? 1 : 0)), 0.03]], 'none', 'stroke="#f8fafc" stroke-width="1" stroke-dasharray="7 6"'); }
    if (str >= 5) road += sc.poly([[x0, ry + wRoad / 2, 0.04], [x1, ry + wRoad / 2, 0.04]], 'none', 'stroke="#94a3b8" stroke-width="2.2"');
    sc.add(-500, clickG(road, 'stadiumPart', 'strasse', D.facilities.strasse.levels[str].n));
    var cr = rng(hsh(c.id + 'cars')), carCols = ['#ef4444', '#3b82f6', '#f8fafc', '#111827', '#f59e0b', '#10b981', '#64748b', '#a855f7'];
    for (var i = 0; i < 3 + str * 2; i++) car(sc, x0 + 4 + cr() * (x1 - x0 - 8), ry + 0.4 + (i % 2) * Math.max(0, wRoad - 1.6) * 0.6, carCols[i % carCols.length], 0, ry + x0 + i * 0.01 + 200);
    if (str >= 6) label(sc, x1 - 8, ry + wRoad / 2, 0.5, 'A' + (10 + hsh(c.city) % 90), 'Autobahnanschluss', -400, { size: 9, bg: '#1d4ed8' });
    // Parkplätze
    var px = a.parkX, py = a.parkY, pw = [0, 8, 12, 16, 20, 22, 26][park], pd = [0, 4, 8, 10, 14, 14, 16][park];
    if (park === 1) { for (var j = 0; j < 6; j++) car(sc, x0 + 6 + j * 3, ry - 1.5, carCols[j % 8], 0); }
    else if (park >= 2) {
      var lot = flat(sc, px, py, pw, pd, park === 2 ? sc.grad('#bfae8a', '#a39270', true) : sc.grad('#6b7280', '#4b5563', true), 0.02, 'stroke="#e5e7eb" stroke-width=".6"');
      for (var r2 = 0; r2 < Math.floor(pd / 3.4); r2++) for (var k2 = 0; k2 < Math.floor(pw / 1.5); k2++) if (park >= 3) lot += sc.poly([[px + k2 * 1.5 + 0.2, py + 0.6 + r2 * 3.4, 0.03], [px + k2 * 1.5 + 0.2, py + 2.6 + r2 * 3.4, 0.03]], 'none', 'stroke="#f8fafc" stroke-width=".7"');
      sc.add(-450, clickG(lot, 'stadiumPart', 'parken', D.facilities.parken.levels[park].n));
      var pr2 = rng(hsh(c.id + 'pk'));
      for (var r3 = 0; r3 < Math.floor(pd / 3.4); r3++) for (var k3 = 0; k3 < Math.floor(pw / 1.5); k3++) if (pr2() < 0.78) car(sc, px + k3 * 1.5 + 0.25, py + 0.5 + r3 * 3.4, carCols[Math.floor(pr2() * 8)], 1, py + px + r3 + 100);
      if (park >= 5) { // Parkhäuser
        var nG = park === 5 ? 1 : 2;
        for (var gI = 0; gI < nG; gI++) { var gx = px + pw + 2 + gI * 10, gy = py; var gs = box(sc, gx, gy, 0, 8, pd, 5.5, '#9ca3af', { top: '#6b7280' }); for (var lv = 1; lv < 4; lv++) gs += sc.poly([[gx, gy + pd, lv * 1.4], [gx + 8, gy + pd, lv * 1.4], [gx + 8, gy, lv * 1.4]], 'none', 'stroke="#e5e7eb" stroke-width="1.4"'); sc.add(gx + gy + pd, clickG(gs, 'stadiumPart', 'parken', 'Parkhaus')); }
        label(sc, px + pw + 6, py + pd / 2, 6.5, 'FAN PARKING', 'Zone A–' + 'CDEF'.charAt(park - 3), py + px + 60, { size: 9 });
      }
    }
    // ÖPNV
    var tx = a.transitX, ty = a.transitY;
    if (oep >= 1 && oep <= 3) {
      var st = box(sc, tx, ty, 0, 4 + oep * 2, 1.6, 2.6, '#e2e8f0', { top: '#2563eb' });
      sc.add(tx + ty + 2, clickG(st, 'stadiumPart', 'oepnv', D.facilities.oepnv.levels[oep].n));
      for (var b = 0; b < oep; b++) bus(sc, tx + b * 6.5, ty + 2.4, b % 2 ? '#fbbf24' : '#f8fafc', 0, 5.5);
      if (oep === 3) label(sc, tx + 4, ty, 3.5, 'BUSBAHNHOF', 'Shuttle zur Halle', tx + ty + 50, { size: 8.5 });
    } else if (oep >= 4) {
      var railY = a.railY, rail = flat(sc, x0, railY, x1 - x0, 2.2, '#57534e', 0.02);
      for (var tI = 0; tI < (x1 - x0) / 1.6; tI++) rail += sc.poly([[x0 + tI * 1.6, railY + 0.2, 0.04], [x0 + tI * 1.6, railY + 2, 0.04]], 'none', 'stroke="#a8a29e" stroke-width="1"');
      rail += sc.poly([[x0, railY + 0.6, 0.06], [x1, railY + 0.6, 0.06]], 'none', 'stroke="#d6d3d1" stroke-width="1.2"') + sc.poly([[x0, railY + 1.6, 0.06], [x1, railY + 1.6, 0.06]], 'none', 'stroke="#d6d3d1" stroke-width="1.2"');
      sc.add(-480, clickG(rail, 'stadiumPart', 'oepnv', D.facilities.oepnv.levels[oep].n));
      var trainCol = oep === 4 ? '#facc15' : oep === 5 ? '#dc2626' : '#2563eb', cars = oep === 4 ? 2 : 4;
      for (var w = 0; w < cars; w++) sc.add(x0 + 10 + w * 7 + railY + 5, box(sc, x0 + 10 + w * 7.2, railY + 0.3, 0.3, 7, 1.6, 2.2, trainCol, { top: '#e5e7eb', win: [1, 4, '#1e3a5f'] }));
      var hx = tx, hy = railY - 4.5, hall = oep === 6 ? box(sc, hx, hy, 0, 10, 3.4, 3.6, '#e0f2fe', { glass: true, win: [1, 5], top: '#1d4ed8' }) : box(sc, hx, hy, 0, 12, 3, 2.4, '#e5e7eb', { top: oep === 5 ? '#16a34a' : '#f59e0b' });
      sc.add(hx + hy + 3, clickG(hall, 'stadiumPart', 'oepnv', D.facilities.oepnv.levels[oep].n));
      label(sc, hx + 5, hy + 1.5, 4.5, oep === 4 ? 'STRASSENBAHN' : oep === 5 ? 'S-BAHN' : 'U-BAHN', 'Halt: Arena', hx + hy + 60, { size: 9, bg: oep === 6 ? '#1d4ed8' : oep === 5 ? '#15803d' : '#14284f' });
    }
  }

  // ---------- Hallenansicht ----------
  G.stadiumView = function (club) {
    var sc = new Scene(6.6, 470, 150, 'st' + club.id);
    sc.ground(-22, -22, 64, 80, sc.grad('#7cc35b', '#4f9a3e', true), '#9fd0ff'); sc.topPad = 0.1;
    var info = stadium(sc, club, 4, 6, { click: 'stadiumPart' });
    infra(sc, club, { x0: -22, x1: 64, roadY: 74, parkX: 40, parkY: 56, transitX: -20, transitY: 69, railY: -21 });
    var tr = rng(hsh(club.id + 't'));
    [[-19, -14], [-19, -4], [-20, 8], [-19, 20], [-20, 32], [-19, 44], [-18, 56], [58, -16], [60, -6], [58, 6], [60, 18], [58, 30], [60, 42], [-12, -19], [0, -19], [14, -19], [28, -19], [42, -19], [54, -19]].forEach(function (p) { tree(sc, p[0] + tr() * 2, p[1] + tr() * 2, 0.9 + tr() * 0.4); });
    label(sc, 21, 32, info.top + 8, String(club.stadiumName || 'Halle').toUpperCase(), 'Heimat von ' + club.name + ' · ' + R.fmtNum(info.cap) + ' Plätze', 9000, { size: 12 });
    return '<div class="iso-wrap stadium-bg art">' + sc.render(940, 620) + '</div>';
  };
  G.stadiumThumb = function (club) {
    var sc = new Scene(4.2, 205, 70, 'sth' + club.id);
    sc.ground(-14, -14, 52, 72, sc.grad('#7cc35b', '#4f9a3e', true), '#a7d5ff');
    stadium(sc, club, 4, 6, {});
    [[-10, 0], [-10, 20], [-10, 40], [48, 0], [48, 24], [48, 48]].forEach(function (p) { tree(sc, p[0], p[1], 0.9); });
    return '<div class="iso-wrap thumb art">' + sc.render(420, 310) + '</div>';
  };

  // ---------- Vereinsstadt ----------
  // Gebäude je Betrieb und Ausbaustufe (moderner Illustrationsstil)
  var BLD = {
    geschaeft: function (sc, x, y, w, d, l, c) { var hgt = [0, 2.6, 2.4, 5, 9][l]; return l === 2 ? box(sc, x + 1, y + 1, 0, w - 3, d - 3, 2.4, '#f59e0b', { win: [1, 3, '#1e293b'] }) : box(sc, x + 0.5, y + 0.5, 0, w - 1.5, d - 1.5, hgt, l >= 3 ? '#e2e8f0' : '#d6c3a5', { win: [Math.max(1, Math.round(hgt / 2.2)), 4], glass: l >= 4, top: l >= 4 ? c.colors[0] : null, parapet: l >= 3 }); },
    gewerbe: function (sc, x, y, w, d, l) { var s = ''; for (var i = 0; i < Math.min(4, l + 1); i++) s += box(sc, x + 0.5 + i * (w / 4.2), y + 0.8, 0, w / 4.6, d - 2, 2 + l * 1.3 + (i % 2) * 1.5, ['#cbd5e1', '#94a3b8', '#e2e8f0'][i % 3], { win: [Math.max(1, l), 2], glass: l >= 3 }); return s; },
    solar: function (sc, x, y, w, d, l) { var s = '', n = l * 4; for (var i = 0; i < n; i++) { var px = x + 0.6 + (i % 6) * (w - 1) / 6, py = y + 0.6 + Math.floor(i / 6) * 2.6; s += sc.poly([[px, py, 0.6], [px + (w - 1) / 6.5, py, 0.6], [px + (w - 1) / 6.5, py + 1.8, 1.4], [px, py + 1.8, 1.4]], sc.grad('#1e3a8a', '#3b82f6', true), 'stroke="#cbd5e1" stroke-width=".6"'); } return s; },
    training: function (sc, x, y, w, d, l, c) { var s = '', n = Math.min(4, l + 1); for (var i = 0; i < n; i++) { var px = x + 0.5 + (i % 2) * (w / 2), py = y + 0.5 + Math.floor(i / 2) * (d / 2); s += flat(sc, px, py, w / 2 - 1, d / 2 - 1, sc.grad('#4ade80', '#16a34a', true), 0.02, 'stroke="#f0fdf4" stroke-width=".8"'); } if (l >= 3) s += box(sc, x + w - 4, y + d - 3, 0, 3.5, 2.5, 2.4 + l * 0.4, '#e2e8f0', { win: [1, 2], glass: l >= 4, top: c.colors[0] }); return s; },
    jugend: function (sc, x, y, w, d, l, c) { return flat(sc, x + 0.5, y + 0.5, w - 1, d * 0.55, sc.grad('#4ade80', '#16a34a', true), 0.02, 'stroke="#f0fdf4" stroke-width=".8"') + box(sc, x + 1, y + d * 0.6, 0, w - 2, d * 0.36, 1.8 + l * 1.1, l >= 3 ? '#f1f5f9' : '#e7d7bd', { win: [Math.max(1, l - 1), 5], glass: l >= 4, top: l >= 3 ? c.colors[0] : null }); },
    medizin: function (sc, x, y, w, d, l) { return medBuilding(sc, x, y, w, d, l); },
    fanshop: function (sc, x, y, w, d, l, c) { return box(sc, x + 0.5, y + 0.5, 0, w - 1, d - 1, 1.6 + l * 0.7, l >= 3 ? '#f8fafc' : '#fde68a', { win: [1, 3], glass: l >= 3, top: c.colors[0] }) + sc.poly([[x + 0.3, y + d - 0.5, 1.4 + l * 0.5], [x + w - 0.3, y + d - 0.5, 1.4 + l * 0.5], [x + w - 0.3, y + d + 0.4, 1.0 + l * 0.5], [x + 0.3, y + d + 0.4, 1.0 + l * 0.5]], c.colors[0]); },
    restaurant: function (sc, x, y, w, d, l) { return box(sc, x + 0.5, y + 0.5, 0, w - 1, d - 1, 1.4 + l * 0.7, l >= 3 ? '#fef3c7' : '#fca5a5', { win: [1, 4, '#fde68a'], top: '#b45309' }); },
    cafe: function (sc, x, y, w, d, l) { var s = box(sc, x + 0.8, y + 0.8, 0, w - 2, d - 2.4, 1.6 + l * 0.6, '#ede9fe', { win: [1, 2, '#fde68a'], top: '#7c3aed' }); for (var i = 0; i < l + 1; i++) { var p = sc.P(x + 1 + i * 1.6, y + d - 0.8, 1.6); s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sc.S * 0.8) + '" fill="' + ['#ef4444', '#f8fafc', '#22c55e'][i % 3] + '"/>'; } return s; },
    hotel: function (sc, x, y, w, d, l, c) { return box(sc, x + 0.5, y + 0.5, 0, w - 1, d - 1, 3 + l * 3, l >= 3 ? '#e2e8f0' : '#f5e6c8', { win: [1 + l * 2, 4], glass: l >= 4, top: l >= 4 ? c.colors[0] : null, parapet: true }); },
    museum: function (sc, x, y, w, d, l, c) { var s = box(sc, x + 0.5, y + 0.5, 0, w - 1, d - 1, 2 + l * 0.9, '#f5f5f4', { top: l >= 4 ? c.colors[0] : '#d6d3d1' }); for (var i = 0; i < 6; i++) { var cx = x + 1 + i * (w - 2) / 5.5; s += box(sc, cx, y + d - 0.9, 0, 0.4, 0.4, 2 + l * 0.9, '#ffffff'); } return s; },
    eventhalle: function (sc, x, y, w, d, l, c) { var cx = x + w / 2, cy = y + d / 2, rx = w / 2 - 0.5, ry = d / 2 - 0.5, hh = 2 + l * 1.8, s = '', top = [], bot = []; for (var t = 0; t <= 40; t++) { var a = t / 40 * Math.PI * 2; top.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, hh]); } for (var u = 0; u <= 20; u++) { var b = -Math.PI * 0.25 + u / 20 * Math.PI; bot.push([cx + Math.cos(b) * rx, cy + Math.sin(b) * ry, 0]); } s += sc.poly(bot.concat(bot.slice().reverse().map(function (p) { return [p[0], p[1], hh]; })), sc.grad('#cbd5e1', '#64748b', true)); s += sc.poly(top, sc.grad('#f8fafc', l >= 3 ? c.colors[0] : '#94a3b8', true), 'stroke="#e2e8f0" stroke-width="1"'); return s; },
    erlebnis: function (sc, x, y, w, d, l, c) { var s = flat(sc, x + 0.5, y + 0.5, w - 1, d - 1, sc.grad('#bbf7d0', '#86efac', true), 0.02); if (l >= 1) s += box(sc, x + 1, y + 1, 0, 2, 2, 1.2, '#f59e0b') + box(sc, x + 4, y + 1.5, 0, 1.4, 1.4, 2, '#ef4444'); if (l >= 2) s += box(sc, x + w - 5, y + d - 4, 0, 4, 3, 2.6, '#e0f2fe', { glass: true, win: [1, 2], top: c.colors[0] }); if (l >= 3) { var p = sc.P(x + w / 2, y + d / 2, 6); s += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sc.S * 4.2) + '" fill="none" stroke="#f8fafc" stroke-width="2.4"/><circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(sc.S * 0.6) + '" fill="#f8fafc"/>'; for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; s += '<line x1="' + f(p[0]) + '" y1="' + f(p[1]) + '" x2="' + f(p[0] + Math.cos(a) * sc.S * 4.2) + '" y2="' + f(p[1] + Math.sin(a) * sc.S * 4.2) + '" stroke="#e2e8f0" stroke-width="1"/><circle cx="' + f(p[0] + Math.cos(a) * sc.S * 4.2) + '" cy="' + f(p[1] + Math.sin(a) * sc.S * 4.2) + '" r="' + f(sc.S * 0.55) + '" fill="' + ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][i % 4] + '"/>'; } } return s; }
  };
  // Medizinisches Gebäude je Stufe (auch für die Medizin-Seite)
  function medBuilding(sc, x, y, w, d, l) {
    var s = '';
    if (l <= 1) { // Schamanenzelt mit Kräutergarten
      var p0 = sc.P(x + w * 0.45, y + d * 0.5, 0), top = sc.P(x + w * 0.45, y + d * 0.5, 4.2), r = sc.S * 2.8;
      s += flat(sc, x + 0.5, y + 0.5, w - 1, d - 1, sc.grad('#a3d977', '#6aa84f', true), 0.02);
      s += '<path d="M' + f(p0[0] - r) + ' ' + f(p0[1]) + ' L' + f(top[0]) + ' ' + f(top[1]) + ' L' + f(p0[0] + r) + ' ' + f(p0[1]) + ' Q' + f(p0[0]) + ' ' + f(p0[1] + r * 0.5) + ' ' + f(p0[0] - r) + ' ' + f(p0[1]) + 'Z" fill="' + sc.grad('#d6a35c', '#8a5a2b', false) + '" stroke="#5b3a1a" stroke-width="1"/>';
      s += '<path d="M' + f(top[0]) + ' ' + f(top[1]) + ' l-6 -8 M' + f(top[0]) + ' ' + f(top[1]) + ' l5 -9" stroke="#5b3a1a" stroke-width="1.6"/><path d="M' + f(p0[0] - r * 0.25) + ' ' + f(p0[1] + 1) + ' L' + f(top[0]) + ' ' + f(top[1] + r * 0.8) + ' L' + f(p0[0] + r * 0.25) + ' ' + f(p0[1] + 1) + 'Z" fill="#3b2410"/>';
      for (var i = 0; i < 5; i++) { var hp = sc.P(x + w - 2.5 + (i % 2) * 1.2, y + 1.5 + i * 1.3, 0); s += '<circle cx="' + f(hp[0]) + '" cy="' + f(hp[1] - 3) + '" r="' + f(sc.S * 0.6) + '" fill="' + ['#16a34a', '#a3e635', '#65a30d'][i % 3] + '"/>'; }
      var fp = sc.P(x + 2, y + d - 2, 0); s += '<circle cx="' + f(fp[0]) + '" cy="' + f(fp[1]) + '" r="' + f(sc.S * 0.7) + '" fill="#f97316"/><circle cx="' + f(fp[0]) + '" cy="' + f(fp[1] - 2) + '" r="' + f(sc.S * 0.4) + '" fill="#fde047"/>';
      return s;
    }
    var hgt = [0, 0, 2.6, 4, 6, 9, 13][l], col = l <= 2 ? '#fef3c7' : '#f8fafc';
    s += box(sc, x + 0.5, y + 0.5, 0, w - 1.5, d - 1.5, hgt, col, { win: [Math.max(1, Math.round(hgt / 2.2)), l >= 4 ? 5 : 3], glass: l >= 4, parapet: l >= 3, top: l >= 5 ? '#e2e8f0' : null });
    var cp = sc.P(x + w - 1, y + d * 0.35, hgt * 0.6), cs = sc.S * 1.1;
    s += '<rect x="' + f(cp[0] - cs) + '" y="' + f(cp[1] - cs * 0.35) + '" width="' + f(cs * 2) + '" height="' + f(cs * 0.7) + '" fill="#dc2626"/><rect x="' + f(cp[0] - cs * 0.35) + '" y="' + f(cp[1] - cs) + '" width="' + f(cs * 0.7) + '" height="' + f(cs * 2) + '" fill="#dc2626"/>';
    if (l >= 6) { var hp2 = sc.P(x + w * 0.45, y + d * 0.45, hgt + 0.05), rr = sc.S * 2.2; s += '<ellipse cx="' + f(hp2[0]) + '" cy="' + f(hp2[1]) + '" rx="' + f(rr) + '" ry="' + f(rr * 0.55) + '" fill="#334155" stroke="#f8fafc" stroke-width="1.2"/><text x="' + f(hp2[0]) + '" y="' + f(hp2[1] + 4) + '" font-size="' + f(sc.S * 1.6) + '" font-weight="900" fill="#fbbf24" text-anchor="middle" font-family="sans-serif">H</text>'; }
    return s;
  }
  var PLOTS = {
    geschaeft: [-34, -37, 11, 10], gewerbe: [-12, -37, 17, 10], solar: [10, -37, 15, 10],
    training: [-34, -21, 15, 14], jugend: [-34, -4, 15, 13], medizin: [-34, 13, 14, 12],
    fanshop: [-4, 53, 9, 7], restaurant: [8, 53, 11, 7], cafe: [22, 53, 8, 7],
    hotel: [56, -37, 11, 10], museum: [56, -22, 12, 10], eventhalle: [56, -8, 14, 13], erlebnis: [56, 10, 14, 13]
  };
  G.cityPlots = PLOTS;
  G.cityView = function (club) {
    var sc = new Scene(5.4, 540, 150, 'ct' + club.id);
    sc.ground(-40, -46, 76, 80, sc.grad('#83c766', '#559e42', true), '#a7d5ff');
    // Straßen
    function road(x, y, w, d) { sc.add(-600, flat(sc, x, y, w, d, '#4b5563', 0.01) + (w > d ? sc.poly([[x, y + d / 2, 0.03], [x + w, y + d / 2, 0.03]], 'none', 'stroke="#f8fafc" stroke-width="1" stroke-dasharray="6 6"') : sc.poly([[x + w / 2, y, 0.03], [x + w / 2, y + d, 0.03]], 'none', 'stroke="#f8fafc" stroke-width="1" stroke-dasharray="6 6"'))); }
    road(-40, -25.5, 116, 2.4); road(-18.5, -40, 2.4, 116); road(52, -40, 2.4, 116); road(-40, 49.5, 116, 2.4);
    // Stadion in der Mitte (klickbar → Stadion)
    // verkleinert (Maßstab je nach Hallengröße), Mittelpunkt bei (24, 13)
    var big = lvl(club, 'sitz') >= 5, k = big ? 0.5 : 0.62, S2 = sc.S * k, tgt = sc.P(24, 13, 0);
    var sIn = new Scene(S2, tgt[0] - (17 - 26) * S2 * 0.866, tgt[1] - 43 * S2 * 0.5, sc.id); sIn.defs = sc.defs;
    stadium(sIn, club, 0, 0, { compact: true });
    sc.add(-100, clickG(sIn.items.sort(function (a, b) { return a.d - b.d || a.n - b.n; }).map(function (i) { return i.s; }).join(''), 'nav-stadion', '', 'Zur Halle'));
    // Betriebe
    Object.keys(PLOTS).forEach(function (key) {
      var pl = PLOTS[key], x = pl[0], y = pl[1], w = pl[2], d = pl[3], fd = D.facilities[key], l = lvl(club, key), max = fd.levels.length - 1;
      var b = club.construction.filter(function (q) { return q.key === key; })[0];
      var nm = fd.name.split(' ')[0].replace('Nachwuchsleistungszentrum', 'Nachwuchs').replace('Medizinische', 'Medizin');
      if (l <= 0 && !b) {
        sc.add(x + y - 2, clickG(flat(sc, x + 0.4, y + 0.4, w - 0.8, d - 0.8, 'rgba(255,255,255,.12)', 0.02, 'stroke="#f0fdf4" stroke-width="1.2" stroke-dasharray="4 3"'), 'cityPlot', key, fd.name + ': Bauplatz'));
        label(sc, x + w / 2, y + d / 2, 0.3, '+ ' + nm.toUpperCase(), 'Bauplatz', x + y + 500, { size: 8, bg: '#3f6212', click: 'cityPlot', key: key });
        return;
      }
      var s = flat(sc, x, y, w, d, sc.grad('#d1d5db', '#b8bec8', true), 0.01) + shadowRect(sc, x + 0.5, y + 0.5, w - 1.5, d - 1.5, 1.4) + (l > 0 ? BLD[key](sc, x, y, w, d, l, club) : '');
      if (b) { var cp = sc.P(x + w - 1.5, y + 1, 0), ct = sc.P(x + w - 1.5, y + 1, 9); s += '<line x1="' + f(cp[0]) + '" y1="' + f(cp[1]) + '" x2="' + f(ct[0]) + '" y2="' + f(ct[1]) + '" stroke="#f59e0b" stroke-width="2.4"/><line x1="' + f(ct[0] - 30) + '" y1="' + f(ct[1]) + '" x2="' + f(ct[0] + 18) + '" y2="' + f(ct[1]) + '" stroke="#f59e0b" stroke-width="2.4"/>'; }
      sc.add(x + y + w + d, clickG(s, 'cityPlot', key, fd.name + ': ' + (l > 0 ? fd.levels[l].n + ' (Stufe ' + l + '/' + max + ')' : 'im Bau')));
      label(sc, x + w / 2, y + d / 2, 3 + l * 1.4, nm.toUpperCase(), b ? 'Bau: noch ' + b.weeks + ' Wo.' : 'Stufe ' + l + '/' + max, x + y + 600, { size: 8, click: 'cityPlot', key: key });
    });
    // Häuser am Rand, Bäume, Autos, Menschen
    var r = rng(hsh(club.id + 'city')), hc = ['#fde68a', '#fecaca', '#bfdbfe', '#ddd6fe', '#e7e5e4', '#bbf7d0'];
    for (var hx = -38; hx < 74; hx += 5.6) { if (Math.abs(hx + 17) < 3 || Math.abs(hx - 53) < 3 || (hx > -6 && hx < 31)) continue; var hh = 2 + r() * 3.5; sc.add(hx + 62, box(sc, hx, 62 + r(), 0, 4.2, 4.2, hh, hc[Math.floor(r() * hc.length)], { win: [Math.max(1, Math.round(hh / 1.8)), 2], top: r() < 0.5 ? '#b45309' : '#64748b' })); }
    for (var t = 0; t < 26; t++) tree(sc, -39 + r() * 114, -40 + r() * 2, 0.8 + r() * 0.4);
    [[-20, 20], [-20, 32], [-20, 8], [55, 36], [55, 44], [72, 40], [72, -8], [72, 8], [-38, 36], [-38, 44]].forEach(function (p) { tree(sc, p[0], p[1], 1); });
    var carCols = ['#ef4444', '#3b82f6', '#f8fafc', '#111827', '#f59e0b', '#10b981'];
    for (var ci = 0; ci < 10; ci++) car(sc, -36 + r() * 106, -25.1 + (ci % 2) * 1.1, carCols[ci % 6], 0);
    for (var cj = 0; cj < 6; cj++) car(sc, -18.1 + (cj % 2) * 1.1, -30 + r() * 100, carCols[(cj + 2) % 6], 1);
    infra(sc, club, { x0: -40, x1: 76, roadY: 71, parkX: 34, parkY: 53, transitX: -36, transitY: 66, railY: -43 });
    return '<div class="iso-wrap city-bg art">' + sc.render(1060, 700) + '</div>';
  };

  // ---------- Medizinische Abteilung ----------
  G.medView = function (club) {
    var l = lvl(club, 'medizin'), sc = new Scene(9, 300, 70, 'md' + club.id + l);
    sc.ground(-8, -8, 26, 26, sc.grad('#86cf6a', '#58a144', true), '#bfe3ff'); sc.topPad = 0.32;
    sc.add(-50, flat(sc, -2, -2, 20, 18, sc.grad('#e5e7eb', '#cbd5e1', true), 0.01));
    sc.add(10, shadowRect(sc, 0, 0, 16, 14, 1.6) + medBuilding(sc, 0, 0, 16, 14, l));
    if (l >= 3) sc.add(40, box(sc, 13, 15.5, 0, 4.2, 2, 1.8, '#f8fafc', { top: '#ef4444', win: [1, 2, '#1e3a5f'] }));
    [[-6, -4], [-6, 6], [-6, 16], [22, -4], [22, 8], [10, 22], [0, 22]].forEach(function (p) { tree(sc, p[0], p[1], 0.9); });
    crowdArea(sc, 2, 15, 8, 3, l * 2, ['#f8fafc', '#93c5fd', '#fca5a5'], 9);
    label(sc, 8, 7, [0, 4.6, 3.4, 5, 7, 10, 14][l] + 2, D.facilities.medizin.levels[l].n.toUpperCase(), 'Stufe ' + l + '/6', 9000, { size: 11 });
    return '<div class="art" style="max-width:620px;margin:0 auto">' + sc.render(600, 300) + '</div>';
  };
})(RFM);
