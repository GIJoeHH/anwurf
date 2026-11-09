// ANWURF! – Isometrische Grafiken (Stadion, Vereinsstadt, Vorschaubilder) als SVG
// Stil: detailreiche Iso-Diorama-Optik (Tribünen mit Publikum, Dächer, Flutlicht, Voxel-Stadt).
(function (R) {
  var D = R.data, U = R.ui;
  var G = U.gfx = {};

  // ---------- Farb- und Zufallshelfer (eigener Zufall, beeinflusst die Spiel-RNG nicht) ----------
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgb2hex(r, g, b) { return '#' + ((1 << 24) + (Math.round(R.clamp(r, 0, 255)) << 16) + (Math.round(R.clamp(g, 0, 255)) << 8) + Math.round(R.clamp(b, 0, 255))).toString(16).slice(1); }
  function shade(hex, f) { var c = hex2rgb(hex); return rgb2hex(c[0] * f, c[1] * f, c[2] * f); }
  function mix(a, b, t) { var x = hex2rgb(a), y = hex2rgb(b); return rgb2hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); }
  function lum(hex) { var c = hex2rgb(hex); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function prng(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  G.shade = shade; G.mix = mix; G.lum = lum;
  var esc = function (s) { return U.esc(s); };
  function f1(n) { return n.toFixed(1); }

  // Tiefenbänder
  var GROUND = -100000, MARK = -90000, SHADOW = -80000, OVER = 100000;

  // ---------- Iso-Szene ----------
  function Scene(scale, ox, oy) { this.s = scale; this.ox = ox; this.oy = oy; this.items = []; this.defs = {}; this.n = 0; this.bbox = null; }
  Scene.prototype.p = function (x, y, z) { return [this.ox + (x - y) * 0.866 * this.s, this.oy + (x + y) * 0.5 * this.s - (z || 0) * this.s]; };
  Scene.prototype.pts = function (arr) { return arr.map(function (q) { return f1(q[0]) + ',' + f1(q[1]); }).join(' '); };
  Scene.prototype.poly = function (pts, fill, extra) { return '<polygon points="' + this.pts(pts) + '" fill="' + fill + '" ' + (extra || '') + '/>'; };
  Scene.prototype.add = function (depth, svg) { this.items.push({ d: depth, n: this.n++, svg: svg }); };
  Scene.prototype.def = function (id, svg) { this.defs[id] = svg; return 'url(#' + id + ')'; };
  // Tiefe für Objekte außerhalb des Hallens (dahinter / davor)
  Scene.prototype.dep = function (x, y, w, d) {
    var b = this.bbox, s = x + y + (w || 0) / 2 + (d || 0) / 2;
    if (!b) return s;
    if (y + (d || 0) <= b[1] + 0.01 || x + (w || 0) <= b[0] + 0.01) return s - 2000;
    if (y >= b[3] - 0.01 || x >= b[2] - 0.01) return s + 2000;
    return s;
  };
  var EDGE = 'stroke="rgba(0,0,0,.28)" stroke-width="0.5" stroke-linejoin="round"';

  // Quader mit Schatten, Fenstern, Klickbereich
  Scene.prototype.box = function (x, y, z, w, d, h, col, o) {
    o = o || {};
    var P = this.p.bind(this), s = '', st = o.stroke || EDGE;
    s += this.poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], o.right || shade(col, 0.74), st);
    s += this.poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.left || shade(col, 0.88), st);
    s += this.poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], o.top || col, st);
    if (o.windows && h > 0.9) s += this.windows(x, y, z, w, d, h, o);
    if (o.svg) s += o.svg;
    if (o.click) s = '<g class="iso-click" data-act="' + o.click + '" data-k="' + (o.key || '') + '">' + s + (o.title ? '<title>' + esc(o.title) + '</title>' : '') + '</g>';
    this.add(o.depth != null ? o.depth : this.dep(x, y, w, d) + z * 0.001, s);
    if (o.shadow !== false && z < 0.3 && h > 0.5) this.shadow(x, y, w, d, h);
  };
  Scene.prototype.shadow = function (x, y, w, d, h) {
    var P = this.p.bind(this), L = Math.min(h * 0.55, 6);
    this.add(SHADOW + this.n, this.poly([P(x, y, 0), P(x + w + L, y, 0), P(x + w + L, y + d, 0), P(x, y + d, 0)], 'rgba(10,20,30,.22)'));
  };
  // Fensterraster auf den beiden sichtbaren Seiten
  Scene.prototype.windows = function (x, y, z, w, d, h, o) {
    var P = this.p.bind(this), s = '', fh = o.floor || 0.9, gap = o.winGap || 0.9, rnd = prng(hash(x + ':' + y + ':' + h)), lit = o.lit != null ? o.lit : 0.35;
    var wc = o.windows, litc = o.litCol || '#ffe7a3';
    for (var fz = z + fh * 0.45; fz < z + h - fh * 0.35; fz += fh) {
      for (var fy = y + gap * 0.4; fy < y + d - gap * 0.35; fy += gap) {
        var c = rnd() < lit ? litc : wc;
        s += this.poly([P(x + w + 0.01, fy, fz), P(x + w + 0.01, fy + gap * 0.5, fz), P(x + w + 0.01, fy + gap * 0.5, fz + fh * 0.5), P(x + w + 0.01, fy, fz + fh * 0.5)], c);
      }
      for (var fx = x + gap * 0.4; fx < x + w - gap * 0.35; fx += gap) {
        var c2 = rnd() < lit ? litc : wc;
        s += this.poly([P(fx, y + d + 0.01, fz), P(fx + gap * 0.5, y + d + 0.01, fz), P(fx + gap * 0.5, y + d + 0.01, fz + fh * 0.5), P(fx, y + d + 0.01, fz + fh * 0.5)], c2);
      }
    }
    return s;
  };
  // Satteldach auf einem Quader (First entlang x oder y)
  Scene.prototype.gable = function (x, y, z, w, d, h, col, axis, depth) {
    var P = this.p.bind(this), s = '';
    if (axis === 'y') {
      var mx = x + w / 2;
      s += this.poly([P(x, y, z), P(mx, y, z + h), P(mx, y + d, z + h), P(x, y + d, z)], shade(col, 1.08), EDGE);
      s += this.poly([P(x, y + d, z), P(x + w, y + d, z), P(mx, y + d, z + h)], shade(col, 0.8), EDGE);
      s += this.poly([P(mx, y, z + h), P(x + w, y, z), P(x + w, y + d, z), P(mx, y + d, z + h)], shade(col, 0.86), EDGE);
    } else {
      var my = y + d / 2;
      s += this.poly([P(x, y, z), P(x + w, y, z), P(x + w, my, z + h), P(x, my, z + h)], shade(col, 1.1), EDGE);
      s += this.poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, my, z + h)], shade(col, 0.72), EDGE);
      s += this.poly([P(x, my, z + h), P(x + w, my, z + h), P(x + w, y + d, z), P(x, y + d, z)], shade(col, 0.92), EDGE);
      for (var t = 0.25; t < 1; t += 0.25) { var a = P(x, my + (y + d - my) * t, z + h * (1 - t)), b = P(x + w, my + (y + d - my) * t, z + h * (1 - t)); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="rgba(0,0,0,.18)" stroke-width=".5"/>'; }
    }
    this.add(depth != null ? depth : this.dep(x, y, w, d) + (z + h) * 0.001 + 0.0005, s);
  };
  Scene.prototype.flat = function (x, y, w, d, col, depth, extra, z) {
    var P = this.p.bind(this); z = z || 0;
    this.add(depth != null ? depth : GROUND + this.n, this.poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], col, extra || ''));
  };
  Scene.prototype.quad = function (pts, col, depth, extra) { var P = this.p.bind(this); this.add(depth, this.poly(pts.map(function (q) { return P(q[0], q[1], q[2] || 0); }), col, extra || '')); };
  Scene.prototype.line = function (a, b, col, wd, depth, dash, extra) {
    var p1 = this.p(a[0], a[1], a[2] || 0), p2 = this.p(b[0], b[1], b[2] || 0);
    this.add(depth != null ? depth : MARK + this.n, '<line x1="' + f1(p1[0]) + '" y1="' + f1(p1[1]) + '" x2="' + f1(p2[0]) + '" y2="' + f1(p2[1]) + '" stroke="' + col + '" stroke-width="' + wd + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + ' stroke-linecap="round" ' + (extra || '') + '/>');
  };
  Scene.prototype.ring = function (cx, cy, r, z, col, wd, depth, fill) {
    var P = this.p.bind(this), pts = [];
    for (var i = 0; i < 32; i++) { var a = i / 32 * Math.PI * 2; pts.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); }
    this.add(depth != null ? depth : MARK + this.n, '<polygon points="' + this.pts(pts) + '" fill="' + (fill || 'none') + '" stroke="' + col + '" stroke-width="' + wd + '"/>');
  };
  Scene.prototype.text = function (x, y, z, txt, depth, size, col) {
    var q = this.p(x, y, z);
    this.add(depth != null ? depth : OVER + this.n, '<text x="' + f1(q[0]) + '" y="' + f1(q[1]) + '" font-size="' + (size || 10) + '" fill="' + (col || '#fff') + '" text-anchor="middle" font-family="Menlo,monospace" font-weight="800" style="paint-order:stroke;stroke:#0b1220;stroke-width:3px">' + esc(txt) + '</text>');
  };
  // Beschriftungstafel (dunkelblaues Schild wie auf Infografiken)
  Scene.prototype.label = function (x, y, z, txt, sub, opts) {
    opts = opts || {};
    var q = this.p(x, y, z), fs = opts.size || 9.5, w = Math.max(txt.length * fs * 0.64, sub ? sub.length * fs * 0.5 : 0) + 14, h = sub ? fs * 2.6 : fs * 1.75;
    var s = '<g' + (opts.click ? ' class="iso-click" data-act="' + opts.click + '" data-k="' + (opts.key || '') + '"' : '') + ' transform="translate(' + f1(q[0]) + ',' + f1(q[1]) + ')">' +
      '<line x1="0" y1="0" x2="0" y2="-6" stroke="#e8eef8" stroke-width="1"/>' +
      '<rect x="' + f1(-w / 2) + '" y="' + f1(-6 - h) + '" width="' + f1(w) + '" height="' + f1(h) + '" rx="2" fill="' + (opts.bg || '#14244a') + '" stroke="#e8eef8" stroke-width="1.1"/>' +
      '<text x="0" y="' + f1(-6 - h + fs * 1.2) + '" font-size="' + fs + '" fill="#fff" text-anchor="middle" font-family="Menlo,monospace" font-weight="800" letter-spacing=".5">' + esc(txt) + '</text>' +
      (sub ? '<text x="0" y="' + f1(-6 - h + fs * 2.25) + '" font-size="' + (fs * 0.78) + '" fill="' + (opts.subCol || '#9fd3ff') + '" text-anchor="middle" font-family="Menlo,monospace" font-weight="700">' + esc(sub) + '</text>' : '') + '</g>';
    this.add(OVER + 500 + q[1] * 0.01, s);
  };
  Scene.prototype.render = function (w, h, extraDefs) {
    this.items.sort(function (a, b) { return a.d - b.d || a.n - b.n; });
    var defs = Object.keys(this.defs).map(function (k) { return this.defs[k]; }, this).join('') + (extraDefs || '');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg"><defs>' + defs + '</defs>' + this.items.map(function (i) { return i.svg; }).join('') + '</svg>';
  };
  G.Scene = Scene;

  // ---------- Muster & Kleinteile ----------
  // Publikum: bunte Punkte in Vereinsfarben auf Sitzfarbe
  function crowdPattern(sc, base, c1, c2, density) {
    var id = 'cr' + hash(base + c1 + c2 + density);
    if (sc.defs[id]) return 'url(#' + id + ')';
    var rnd = prng(hash(id)), s = '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="12" height="9"><rect width="12" height="9" fill="' + base + '"/>';
    var cols = [c1, c1, c2, '#f2c9a0', '#e8b48a', '#c98a5e', '#ffffff', '#2b2b2b', c1, mix(c1, '#ffffff', 0.4)];
    for (var i = 0; i < 26; i++) { if (rnd() > density) continue; var x = (i % 6) * 2 + rnd() * 0.6, y = Math.floor(i / 6) * 2.1 + rnd() * 0.5; s += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="1.5" height="1.6" fill="' + cols[Math.floor(rnd() * cols.length)] + '"/>'; }
    return sc.def(id, s + '</pattern>');
  }
  function grassPattern(sc, col) {
    var id = 'gr' + hash(col);
    if (sc.defs[id]) return 'url(#' + id + ')';
    var rnd = prng(hash(id)), s = '<pattern id="' + id + '" patternUnits="userSpaceOnUse" width="14" height="14"><rect width="14" height="14" fill="' + col + '"/>';
    for (var i = 0; i < 9; i++) s += '<rect x="' + f1(rnd() * 13) + '" y="' + f1(rnd() * 13) + '" width="1.2" height="1.2" fill="' + shade(col, rnd() < 0.5 ? 0.88 : 1.12) + '"/>';
    return sc.def(id, s + '</pattern>');
  }
  // Zypresse / Laubbaum (Hallenumfeld)
  function tree(sc, x, y, k, kind, depth) {
    k = k || 1;
    var b = sc.p(x, y, 0), s = sc.s * k, rnd = prng(hash(x + ',' + y));
    var g = sc.def('treeG', '<radialGradient id="treeG" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#8fd16a"/><stop offset=".55" stop-color="#3f9a3c"/><stop offset="1" stop-color="#1f5e2a"/></radialGradient>');
    var svg = '<ellipse cx="' + f1(b[0] + s * 0.9) + '" cy="' + f1(b[1]) + '" rx="' + f1(s * 1.3) + '" ry="' + f1(s * 0.45) + '" fill="rgba(10,20,30,.25)"/>' +
      '<rect x="' + f1(b[0] - s * 0.12) + '" y="' + f1(b[1] - s * 1.1) + '" width="' + f1(s * 0.24) + '" height="' + f1(s * 1.1) + '" fill="#6b4a2a"/>';
    if (kind === 'round') svg += '<circle cx="' + f1(b[0]) + '" cy="' + f1(b[1] - s * 1.9) + '" r="' + f1(s * 1.15) + '" fill="' + g + '" stroke="#1d4d24" stroke-width=".6"/>';
    else svg += '<ellipse cx="' + f1(b[0]) + '" cy="' + f1(b[1] - s * 2.3) + '" rx="' + f1(s * (0.75 + rnd() * 0.15)) + '" ry="' + f1(s * 1.7) + '" fill="' + g + '" stroke="#1d4d24" stroke-width=".6"/>';
    sc.add(depth != null ? depth : sc.dep(x, y, 0.5, 0.5), '<g>' + svg + '</g>');
  }
  G.tree = tree;
  // Voxel-Baum (Stadtansicht)
  function voxTree(sc, x, y, k, depth) {
    k = k || 1; var rnd = prng(hash('v' + x + ',' + y)), g = ['#3f8f3a', '#4ea845', '#357a32'][Math.floor(rnd() * 3)];
    var d0 = depth != null ? depth : sc.dep(x, y, 1, 1);
    sc.box(x + 0.35 * k, y + 0.35 * k, 0, 0.35 * k, 0.35 * k, 1.1 * k, '#7a5532', { depth: d0, shadow: false });
    sc.box(x - 0.2 * k, y - 0.2 * k, 1 * k, 1.5 * k, 1.5 * k, 1.3 * k, g, { depth: d0 + 0.001, shadow: false, top: shade(g, 1.15) });
    sc.box(x + 0.15 * k, y + 0.1 * k, 2.3 * k, 0.9 * k, 0.9 * k, 0.8 * k, shade(g, 1.08), { depth: d0 + 0.002, shadow: false, top: shade(g, 1.25) });
    sc.shadow(x - 0.2 * k, y - 0.2 * k, 1.5 * k, 1.5 * k, 2.5 * k);
  }
  G.voxTree = voxTree;
  // Auto (Iso-Quader mit Kabine)
  function car(sc, x, y, axis, col, depth, k) {
    k = k || 1; var Lc = 1.5 * k, W = 0.75 * k;
    var w = axis === 'y' ? W : Lc, d = axis === 'y' ? Lc : W, dd = depth != null ? depth : sc.dep(x, y, w, d);
    sc.box(x, y, 0.1, w, d, 0.4 * k, col, { depth: dd, shadow: false });
    sc.box(x + (axis === 'y' ? 0.06 * k : 0.35 * k), y + (axis === 'y' ? 0.35 * k : 0.06 * k), 0.5 * k, axis === 'y' ? W - 0.12 * k : Lc * 0.5, axis === 'y' ? Lc * 0.5 : W - 0.12 * k, 0.3 * k, '#cfe3f5', { depth: dd + 0.001, shadow: false, top: shade(col, 1.1), left: '#5b7896', right: '#46607c' });
  }
  G.car = car;
  function bus(sc, x, y, col, depth, len) {
    len = len || 4; var dd = depth != null ? depth : sc.dep(x, y, len, 1.1);
    sc.box(x, y, 0.15, len, 1.1, 1.3, col, { depth: dd, windows: '#1e2d40', floor: 0.9, winGap: 0.7, lit: 0, top: shade(col, 1.1) });
  }
  // Menschen als winzige Figuren
  function people(sc, x, y, w, d, n, cols, depth) {
    var rnd = prng(hash('p' + x + y + n)), s = '';
    for (var i = 0; i < n; i++) { var q = sc.p(x + rnd() * w, y + rnd() * d, 0); var c = cols[Math.floor(rnd() * cols.length)]; s += '<rect x="' + f1(q[0] - 0.9) + '" y="' + f1(q[1] - 3.4) + '" width="1.8" height="2.6" fill="' + c + '"/><rect x="' + f1(q[0] - 0.7) + '" y="' + f1(q[1] - 4.6) + '" width="1.4" height="1.3" fill="#f0c7a0"/>'; }
    sc.add(depth != null ? depth : sc.dep(x, y, w, d), '<g>' + s + '</g>');
  }
  G.people = people;
  // Kran für Baustellen
  function crane(sc, x, y, label, k) {
    k = k || 1;
    var base = sc.p(x, y, 0), top = sc.p(x, y, 10 * k), sx = sc.s;
    var mast = '';
    for (var i = 0; i < 10; i++) { var a = sc.p(x, y, i * k), b = sc.p(x, y, (i + 1) * k); mast += '<line x1="' + f1(a[0] - 1.6) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0] + 1.6) + '" y2="' + f1(b[1]) + '" stroke="#d99a00" stroke-width=".6"/>'; }
    sc.add(sc.dep(x, y, 1, 1) + 30, '<g><rect x="' + f1(base[0] - 2) + '" y="' + f1(top[1]) + '" width="4" height="' + f1(base[1] - top[1]) + '" fill="none" stroke="#f5b301" stroke-width="1.2"/>' + mast +
      '<g class="crane" style="transform-origin:' + f1(top[0]) + 'px ' + f1(top[1]) + 'px"><line x1="' + f1(top[0] - 2.2 * sx) + '" y1="' + f1(top[1]) + '" x2="' + f1(top[0] + 6 * sx) + '" y2="' + f1(top[1]) + '" stroke="#f5b301" stroke-width="2.4"/><rect x="' + f1(top[0] - 2.4 * sx) + '" y="' + f1(top[1] - 1) + '" width="' + f1(0.9 * sx) + '" height="' + f1(0.9 * sx) + '" fill="#555"/><line x1="' + f1(top[0] + 4.6 * sx) + '" y1="' + f1(top[1]) + '" x2="' + f1(top[0] + 4.6 * sx) + '" y2="' + f1(top[1] + 2.6 * sx) + '" stroke="#ddd" stroke-width=".8"/><rect x="' + f1(top[0] + 4.1 * sx) + '" y="' + f1(top[1] + 2.6 * sx) + '" width="' + f1(sx) + '" height="' + f1(sx * 0.6) + '" fill="#8a8f99"/></g>' +
      (label ? '<text x="' + f1(base[0]) + '" y="' + f1(base[1] + 11) + '" font-size="9" fill="#f5b301" text-anchor="middle" font-family="Menlo,monospace" font-weight="800" style="paint-order:stroke;stroke:#000;stroke-width:3px">' + esc(label) + '</text>' : '') + '</g>');
  }
  G.crane = crane;
  function building(club, key) { return club.construction.filter(function (c) { return c.key === key; })[0]; }
  // Bodenplatte als Diorama mit Erd-/Ziegelkante
  function plate(sc, x, y, w, d, col) {
    var P = sc.p.bind(sc), t = 1.6;
    sc.add(GROUND - 5000, sc.poly([P(x + w, y, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x + w, y, -t)], '#7a4a2c', EDGE) + sc.poly([P(x, y + d, 0), P(x + w, y + d, 0), P(x + w, y + d, -t), P(x, y + d, -t)], '#93593a', EDGE));
    var s = '';
    for (var i = 0; i <= w; i += 2.2) { var a = P(x + i, y + d, 0), b = P(x + i, y + d, -t); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>'; }
    for (var j = 0; j <= d; j += 2.2) { var a2 = P(x + w, y + j, 0), b2 = P(x + w, y + j, -t); s += '<line x1="' + f1(a2[0]) + '" y1="' + f1(a2[1]) + '" x2="' + f1(b2[0]) + '" y2="' + f1(b2[1]) + '" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>'; }
    var m1 = P(x, y + d, -t / 2), m2 = P(x + w, y + d, -t / 2), m3 = P(x + w, y, -t / 2);
    s += '<polyline points="' + f1(m1[0]) + ',' + f1(m1[1]) + ' ' + f1(m2[0]) + ',' + f1(m2[1]) + ' ' + f1(m3[0]) + ',' + f1(m3[1]) + '" fill="none" stroke="rgba(0,0,0,.22)" stroke-width=".6"/>';
    sc.add(GROUND - 4999, s);
    sc.flat(x, y, w, d, grassPattern(sc, col), GROUND - 4000);
  }
  G.plate = plate;

  // ---------- Verkehr: Straße, Parkplatz, Nahverkehr ----------
  // a: { x0, x1, roadY, railY, parkX, transitX, zebraX, labels }
  G.infra = function (sc, club, a) {
    var st = club.fac.strasse || 1, pk = club.fac.parken || 1, op = club.fac.oepnv || 1;
    var len = a.x1 - a.x0, ry = a.roadY;
    var roadW = [0, 2, 2.6, 3.2, 4.4, 5.4, 6.6][st];
    if (st === 1) {
      sc.flat(a.x0, ry, len, roadW, '#9b8463', GROUND + 10);
      var rnd = prng(7); for (var i = 0; i < 40; i++) sc.flat(a.x0 + rnd() * len, ry + rnd() * (roadW - 0.4), 0.4, 0.3, '#6e5b42', GROUND + 11);
    } else {
      sc.flat(a.x0, ry - 0.6, len, 0.6, '#b9bcc4', GROUND + 9); sc.flat(a.x0, ry + roadW, len, 0.6, '#b9bcc4', GROUND + 9);
      sc.flat(a.x0, ry, len, roadW, '#474c58', GROUND + 10);
      var lanes = st >= 4 ? (st >= 6 ? 4 : 3) : 2;
      for (var l = 1; l < lanes; l++) sc.line([a.x0, ry + roadW * l / lanes], [a.x1, ry + roadW * l / lanes], '#e8e8e8', 0.8, MARK + 1, '5 5');
      if (a.zebraX != null) for (var zx = 0; zx < roadW - 0.3; zx += 0.55) sc.flat(a.zebraX, ry + zx + 0.15, 2.2, 0.3, '#f2f2f2', MARK + 2);
      for (var lx = a.x0 + 3; lx < a.x1; lx += 9) { var lb = sc.p(lx, ry - 0.4, 0), lt = sc.p(lx, ry - 0.4, 3.2); sc.add(sc.dep(lx, ry - 0.5, 0.2, 0.2), '<line x1="' + f1(lb[0]) + '" y1="' + f1(lb[1]) + '" x2="' + f1(lt[0]) + '" y2="' + f1(lt[1]) + '" stroke="#5c6370" stroke-width="1"/><circle cx="' + f1(lt[0]) + '" cy="' + f1(lt[1]) + '" r="1.4" fill="#ffe9a8"/>'); }
      if (st >= 6) { sc.box(a.x1 - 6, ry - 3, 0, 0.2, 0.2, 3.4, '#666'); sc.box(a.x1 - 7.4, ry - 3.1, 2.8, 2.8, 0.2, 1.4, '#1d4ed8'); sc.text(a.x1 - 6, ry - 3, 4.6, 'A', OVER, 10, '#fff'); }
    }
    // fahrende Autos
    var cars = Math.min(7, st + 1), cc = ['#e74c3c', '#f1c40f', '#ecf0f1', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
    for (var c = 0; c < cars; c++) {
      var lane = roadW * (c % 2 ? 0.28 : 0.68), p0 = sc.p(a.x0 + 1, ry + lane, 0.2), p1 = sc.p(a.x1 - 2, ry + lane, 0.2), w = 9, hgt = 4.2;
      sc.add(OVER - 1000 + c, '<g class="car" style="--dx:' + f1(p1[0] - p0[0]) + 'px;--dy:' + f1(p1[1] - p0[1]) + 'px;animation-delay:-' + (c * 1.9) + 's;animation-duration:' + (8 + c % 3 * 2) + 's"><rect x="' + f1(p0[0] - w / 2) + '" y="' + f1(p0[1] - hgt) + '" width="' + w + '" height="' + hgt + '" rx="1.5" fill="' + cc[c] + '" stroke="rgba(0,0,0,.4)" stroke-width=".5"/><rect x="' + f1(p0[0] - 2) + '" y="' + f1(p0[1] - hgt - 2) + '" width="5" height="2.4" rx=".8" fill="#bcd6ee"/></g>');
    }
    // Parkplatz
    var px = a.parkX, py = ry + roadW + 1.2, pc = ['#c0392b', '#2980b9', '#ecf0f1', '#f39c12', '#27ae60', '#8e44ad', '#34495e'];
    if (pk === 1) { for (var k = 0; k < 7; k++) car(sc, a.x0 + 4 + k * 2.6, ry + roadW + 0.15, 'x', pc[k % 7]); }
    else {
      var pw = [0, 0, 10, 13, 16, 17, 19][pk], pd = [0, 0, 6, 7, 8, 9, 10][pk];
      sc.flat(px, py, pw, pd, pk === 2 ? '#9a8a6c' : '#545a66', GROUND + 20);
      if (pk >= 3) for (var bx = px + 0.4; bx < px + pw - 0.5; bx += 1.3) { sc.line([bx, py + 0.2], [bx, py + 2.2], '#e6e6e6', 0.5, MARK + 3); sc.line([bx, py + pd - 2.2], [bx, py + pd - 0.2], '#e6e6e6', 0.5, MARK + 3); }
      var n = [0, 0, 7, 12, 18, 14, 16][pk], rnd2 = prng(31 + pk);
      for (var q = 0; q < n; q++) { var row = q % 2, col = Math.floor(q / 2); if (0.5 + col * 2.6 > pw - 1.5) break; car(sc, px + 0.5 + col * 2.6 + (row ? 1.3 : 0), py + (row ? pd - 1.8 : 0.3), 'y', pc[Math.floor(rnd2() * 7)]); }
      if (pk >= 4) { sc.box(px + pw - 0.8, py - 0.8, 0, 0.25, 0.25, 3, '#888'); sc.box(px + pw - 2.2, py - 0.85, 2.6, 2.2, 0.15, 1.1, '#1d4ed8'); sc.text(px + pw - 1.1, py - 0.8, 3.3, 'P', OVER, 9, '#fff'); }
      if (pk >= 5) { // Parkhäuser mit Decks
        var nh = pk >= 6 ? 2 : 1;
        for (var hh = 0; hh < nh; hh++) {
          var hx = px + 1 + hh * 8.5, hy = py + 2.6, hw = 7.5, hd = pd - 2.8, hd0 = sc.dep(hx, hy, hw, hd);
          for (var dk = 0; dk < 4; dk++) { sc.box(hx, hy, dk * 1.1, hw, hd, 0.25, '#a7adb8', { depth: hd0 + dk * 0.01, shadow: dk === 0 }); if (dk < 3) for (var cx = 0; cx < 4; cx++) sc.box(hx + 0.6 + cx * 1.8, hy + hd - 1.2, dk * 1.1 + 0.25, 1.2, 0.7, 0.45, pc[(cx + dk) % 7], { depth: hd0 + dk * 0.01 + 0.005, shadow: false }); }
          sc.box(hx + hw - 1.2, hy - 0.2, 0, 1.2, 1.2, 4.6, '#d9dde4', { depth: hd0 + 0.1 });
        }
      }
      if (a.labels) sc.label(px + pw / 2, py + pd / 2, pk >= 5 ? 5.5 : 1.5, 'PARKEN', D.facilities.parken.levels[pk].n);
    }
    // Nahverkehr
    var tx = a.transitX, ty = a.railY;
    if (op >= 4) { // Schienen mit Schwellen
      sc.flat(a.x0, ty, len, 2.4, '#7d6b5a', GROUND + 12);
      for (var sx = a.x0; sx < a.x1; sx += 0.7) sc.line([sx, ty + 0.3], [sx, ty + 2.1], '#5a4636', 0.7, MARK + 4);
      sc.line([a.x0, ty + 0.75], [a.x1, ty + 0.75], '#d1d5db', 0.7, MARK + 5); sc.line([a.x0, ty + 1.65], [a.x1, ty + 1.65], '#d1d5db', 0.7, MARK + 5);
      if (op === 4) { for (var ox = a.x0 + 2; ox < a.x1; ox += 8) { var o0 = sc.p(ox, ty - 0.2, 0), o1 = sc.p(ox, ty - 0.2, 3.6); sc.add(sc.dep(ox, ty - 0.3, 0.2, 0.2), '<line x1="' + f1(o0[0]) + '" y1="' + f1(o0[1]) + '" x2="' + f1(o1[0]) + '" y2="' + f1(o1[1]) + '" stroke="#6b7280" stroke-width="1"/>'); } sc.line([a.x0, ty + 1.2, 3.4], [a.x1, ty + 1.2, 3.4], '#444', 0.5, sc.dep(a.x0, ty, len, 2.4) + 1); }
      // Zug (fährt hin und her)
      var tcol = op === 4 ? '#d6332c' : op === 5 ? '#e8742a' : '#1d4ed8', cars2 = op === 4 ? 2 : 3;
      var t0 = sc.p(a.x0 + 2, ty + 0.4, 0), t1 = sc.p(a.x1 - 6 - cars2 * 5.4, ty + 0.4, 0);
      var trainSc = new Scene(sc.s, sc.ox, sc.oy);
      for (var tc = 0; tc < cars2; tc++) trainSc.box(a.x0 + 2 + tc * 5.4, ty + 0.4, 0.3, 5, 1.6, 1.8, tcol, { windows: '#dff1ff', floor: 1.2, winGap: 0.8, lit: 0, top: '#9aa3ad', shadow: false });
      trainSc.items.sort(function (p, q2) { return p.d - q2.d || p.n - q2.n; });
      sc.add(sc.dep(a.x0, ty, len, 2.4) + 0.5, '<g class="car" style="--dx:' + f1(t1[0] - t0[0]) + 'px;--dy:' + f1(t1[1] - t0[1]) + 'px;animation-duration:14s;animation-direction:alternate;animation-timing-function:ease-in-out">' + trainSc.items.map(function (i) { return i.svg; }).join('') + '</g>');
    }
    if (op === 1) { // Bushaltestelle
      sc.box(tx, ry - 1.6, 0, 2.2, 0.9, 1.5, '#9fb4cf', { top: '#c7d4e6' }); sc.box(tx + 2.6, ry - 1, 0, 0.15, 0.15, 2, '#666'); sc.box(tx + 2.3, ry - 1.05, 2, 0.7, 0.2, 0.6, '#f5b301');
    }
    if (op >= 2 && op <= 3) {
      if (op === 3) { for (var pl = 0; pl < 4; pl++) sc.box(tx + 0.4 + pl * 2.7, ry - 2.1, 0, 0.2, 0.2, 2.2, '#888'); sc.box(tx, ry - 5, 2.2, 9, 3.4, 0.25, '#f5b301', { top: '#fcd34d' }); }
      bus(sc, tx + 0.5, ry - 1.4, '#f5b301'); if (op === 3) bus(sc, tx + 4.8, ry - 4.4, '#2563eb');
      if (a.labels && op === 3) sc.label(tx + 4.5, ry - 3, 3, 'BUSBAHNHOF');
    }
    if (op === 5) { // S-Bahn-Station mit rotem Bahnsteigdach
      sc.box(tx, ty + 2.5, 0, 14, 1.8, 0.5, '#c8c8c0', { top: '#d8d4c4' });
      for (var sp = 0; sp < 5; sp++) sc.box(tx + 0.5 + sp * 3.2, ty + 3.1, 0.5, 0.18, 0.18, 2.2, '#2f5f3a');
      sc.box(tx - 0.3, ty + 2.4, 2.7, 14.6, 2, 0.25, '#c8423a', { top: '#d9564a' });
      sc.box(tx + 4, ty + 4.6, 0, 6, 3, 2.6, '#e9e2cf', { windows: '#5b7aa0', lit: 0.2 }); sc.gable(tx + 4, ty + 4.6, 2.6, 6, 3, 1.2, '#9fb59a', 'x');
      if (a.labels) sc.label(tx + 7, ty + 6, 4, 'S-BAHN', 'Stadion');
    }
    if (op === 6) { // U-Bahnhof an der Arena
      sc.box(tx, ty + 2.6, 0, 10, 4.2, 2.8, '#e5e9f0', { windows: '#6aa7e8', lit: 0.1, winGap: 1.1 });
      sc.box(tx + 3.5, ty + 2.4, 2.8, 3, 0.6, 1.8, '#1d4ed8', { top: '#3b6fe8' }); sc.text(tx + 5, ty + 2.6, 4.2, 'U', OVER, 13, '#fff');
      if (a.labels) sc.label(tx + 5, ty + 5, 5.5, 'U-BAHN', 'Hallenbahnhof');
    }
    ['strasse', 'parken', 'oepnv'].forEach(function (key) { var b = building(club, key); if (b) crane(sc, key === 'parken' ? px + 4 : key === 'oepnv' ? tx + 3 : a.x0 + len / 2, key === 'strasse' ? ry - 1.5 : key === 'parken' ? py + 3 : ty - 1, 'Bau: ' + D.facilities[key].name, 0.8); });
  };

  // ---------- Stadion ----------
  // Spielfeld X..X+PL, Y..Y+PW. Hinten (N, W) sieht man die Sitzreihen, vorne (S, E) die Fassade.
  G.stadium = function (sc, club, X, Y, k, opts) {
    opts = opts || {};
    var f = club.fac, c1 = club.colors[0], c2 = club.colors[1];
    var PL = 30 * k, PW = 19 * k, g = 1.6 * k;
    var sitz = f.sitz || 0, steh = f.steh || 0, dach = f.dach || 0, vip = f.vip || 0, licht = f.licht || 0, video = f.video || 0, rasen = f.rasen || 0;
    var seatCol = lum(c1) > 0.85 ? c2 : c1; if (lum(seatCol) > 0.85) seatCol = '#2f5fb3';
    var concrete = '#d8d3c6', concreteD = '#b9b3a3', roofCol = '#7ea8de', roofHi = '#b5d0f2';
    var sides = {};
    function dims(Lv) { return { L: Lv, D: (1.6 + Lv * 0.95) * k, H: (0.9 + Lv * 0.62) * k }; }
    sides.N = dims(Math.max(1, Math.min(6, sitz + 1))); sides.N.kind = sitz === 0 ? 'holz' : 'sitz'; sides.N.roof = dach >= 1;
    if (steh > 0) { sides.W = dims(steh); sides.W.kind = steh === 1 ? 'huegel' : steh === 2 ? 'wall' : 'steh'; sides.W.roof = dach >= 2 && steh >= 3; }
    if (steh >= 4) { sides.E = dims(steh - 2); sides.E.kind = 'steh'; sides.E.roof = dach >= 3; }
    else if (sitz >= 5) { sides.E = dims(sitz - 3); sides.E.kind = 'sitz'; sides.E.roof = dach >= 3; }
    if (sitz >= 3) { sides.S = dims(sitz - 1); sides.S.kind = 'sitz'; sides.S.roof = dach >= 2; }
    // Hallenplan (Sektoren/Ränge): Tribünenhöhe je Seite aus den Rängen, Art aus dem vorherrschenden Platztyp
    var corners = null, SPm = R.stadium;
    if (SPm && SPm.has(club)) {
      sides = {}; corners = {};
      var roofSide = { N: dach >= 1, S: dach >= 2, W: dach >= 2, E: dach >= 3 };
      ['N', 'S', 'W', 'E'].forEach(function (sd) {
        var pr = SPm.sideProfile(club, sd); if (pr.depth <= 0) return;
        var Lv = Math.max(1, Math.min(7, Math.round(pr.depth * 2.2)));
        var kind = pr.type === 'steh' ? (pr.depth < 0.5 ? 'huegel' : pr.depth < 0.9 ? 'wall' : 'steh') : 'sitz';
        sides[sd] = dims(Lv); sides[sd].kind = kind; sides[sd].roof = roofSide[sd] && pr.depth >= 0.6;
      });
      if (!sides.N) { sides.N = dims(1); sides.N.kind = 'holz'; sides.N.roof = false; }
      ['NW', 'NE', 'SW', 'SE'].forEach(function (id) { corners[id] = club.stadium.sectors[id].tiers.length > 0; });
      var lg = SPm.sideProfile(club, 'N').loge + SPm.sideProfile(club, 'S').loge;
      vip = lg <= 0 ? 0 : Math.max(1, Math.min(5, Math.round(lg * 1.6)));
    }
    var dN = sides.N.D, dW = sides.W ? sides.W.D : 0, dE = sides.E ? sides.E.D : 0, dS = sides.S ? sides.S.D : 0;
    var bb = [X - g - dW - 1.5 * k, Y - g - dN - 1.5 * k, X + PL + g + dE + 1.5 * k, Y + PW + g + dS + 1.5 * k];
    if (opts.register !== false) sc.bbox = bb;
    var BACK = -1500, PITCH = -900, FRONT = 600;
    // Vorplatz (Umlauf)
    sc.flat(bb[0], bb[1], bb[2] - bb[0], bb[3] - bb[1], '#cfc8b8', GROUND + 100, EDGE);
    // Rasen mit Schachbrett-Mähmuster
    var gA = ['#7a9a45', '#3f9e45', '#38a447', '#35a84c'][rasen], gB = shade(gA, 1.12);
    sc.flat(X - g + 0.4 * k, Y - g + 0.4 * k, PL + 2 * g - 0.8 * k, PW + 2 * g - 0.8 * k, '#2e7d3a', GROUND + 200);
    var nx = 12, ny = 8;
    for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) sc.flat(X + i * PL / nx, Y + j * PW / ny, PL / nx, PW / ny, (i + j) % 2 ? gA : gB, GROUND + 201);
    if (rasen === 0) { var rr = prng(5); for (var b2 = 0; b2 < 14; b2++) sc.flat(X + rr() * PL, Y + rr() * PW, 1.2 * k, 0.8 * k, '#8b7a4a', GROUND + 202); }
    // Linien
    var lw = 0.9, wc = '#ffffff';
    function Ln(a, b) { sc.line(a, b, wc, lw, MARK + 10); }
    Ln([X, Y], [X + PL, Y]); Ln([X, Y + PW], [X + PL, Y + PW]); Ln([X, Y], [X, Y + PW]); Ln([X + PL, Y], [X + PL, Y + PW]); Ln([X + PL / 2, Y], [X + PL / 2, Y + PW]);
    sc.ring(X + PL / 2, Y + PW / 2, PW * 0.17, 0, wc, lw, MARK + 10);
    var pbD = PL * 0.157, pbW = PW * 0.6, gbD = PL * 0.052, gbW = PW * 0.27;
    [[X, 1], [X + PL, -1]].forEach(function (e) {
      var ex = e[0], s = e[1];
      Ln([ex, Y + (PW - pbW) / 2], [ex + s * pbD, Y + (PW - pbW) / 2]); Ln([ex + s * pbD, Y + (PW - pbW) / 2], [ex + s * pbD, Y + (PW + pbW) / 2]); Ln([ex, Y + (PW + pbW) / 2], [ex + s * pbD, Y + (PW + pbW) / 2]);
      Ln([ex, Y + (PW - gbW) / 2], [ex + s * gbD, Y + (PW - gbW) / 2]); Ln([ex + s * gbD, Y + (PW - gbW) / 2], [ex + s * gbD, Y + (PW + gbW) / 2]); Ln([ex, Y + (PW + gbW) / 2], [ex + s * gbD, Y + (PW + gbW) / 2]);
    });
    // Tore mit Netz
    [[X, -1], [X + PL, 1]].forEach(function (e) {
      var ex = e[0], s = e[1], y0 = Y + PW * 0.44, y1 = Y + PW * 0.56, h = 0.9 * k, dpt = 0.7 * k * s;
      sc.quad([[ex, y0, h], [ex, y1, h], [ex + dpt, y1, 0], [ex + dpt, y0, 0]], 'rgba(255,255,255,.35)', PITCH, 'stroke="#fff" stroke-width=".4"');
      sc.line([ex, y0, 0], [ex, y0, h], '#fff', 1.4, PITCH + 1); sc.line([ex, y1, 0], [ex, y1, h], '#fff', 1.4, PITCH + 1); sc.line([ex, y0, h], [ex, y1, h], '#fff', 1.4, PITCH + 1);
    });
    // Spieler beim Training
    var pr = prng(hash(club.id || 'x'));
    for (var pp = 0; pp < 10; pp++) { var ppx = X + 2 + pr() * (PL - 4), ppy = Y + 1 + pr() * (PW - 2), q = sc.p(ppx, ppy, 0), pc = pp < 6 ? c1 : '#f2f2f2'; sc.add(PITCH + 5, '<g><ellipse cx="' + f1(q[0] + 1.5) + '" cy="' + f1(q[1]) + '" rx="2.4" ry=".9" fill="rgba(0,0,0,.25)"/><rect x="' + f1(q[0] - 1.3) + '" y="' + f1(q[1] - 5) + '" width="2.6" height="3.4" fill="' + pc + '" stroke="rgba(0,0,0,.4)" stroke-width=".3"/><rect x="' + f1(q[0] - 1) + '" y="' + f1(q[1] - 1.8) + '" width="2" height="1.8" fill="#222"/><circle cx="' + f1(q[0]) + '" cy="' + f1(q[1] - 6.2) + '" r="1.2" fill="#f0c7a0"/></g>'); }
    var ball = sc.p(X + PL * 0.53, Y + PW * 0.48, 0); sc.add(PITCH + 6, '<circle cx="' + f1(ball[0]) + '" cy="' + f1(ball[1] - 0.8) + '" r="1.1" fill="#fff" stroke="#333" stroke-width=".3"/>');
    // Werbebanden
    var ads = [c1, '#ffffff', '#1d4ed8', '#f5b301', c2, '#e11d48'];
    function boards(x0, y0, x1, y1, depth) {
      var n = 8, dx = (x1 - x0) / n, dy = (y1 - y0) / n;
      for (var b = 0; b < n; b++) { var ax = x0 + dx * b, ay = y0 + dy * b; sc.quad([[ax, ay, 0], [ax + dx, ay + dy, 0], [ax + dx, ay + dy, 0.45 * k], [ax, ay, 0.45 * k]], ads[b % ads.length], depth + b * 0.01, 'stroke="rgba(0,0,0,.35)" stroke-width=".4"'); }
    }
    boards(X - 0.3 * k, Y - g * 0.6, X + PL + 0.3 * k, Y - g * 0.6, PITCH - 10);
    boards(X - g * 0.6, Y, X - g * 0.6, Y + PW, PITCH - 9);
    boards(X - 0.3 * k, Y + PW + g * 0.6, X + PL + 0.3 * k, Y + PW + g * 0.6, PITCH + 50);
    boards(X + PL + g * 0.6, Y, X + PL + g * 0.6, Y + PW, PITCH + 51);

    function clickWrap(svg, key) { if (!opts.click) return '<g>' + svg + '</g>'; return '<g class="iso-click" data-act="' + opts.click + '" data-k="' + key + '"><title>' + esc(D.facilities[key].name + ': ' + D.facilities[key].levels[f[key]].n) + '</title>' + svg + '</g>'; }
    function seg(a, b, col, wd) { return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + col + '" stroke-width="' + wd + '"/>'; }
    // --- Tribüne hinten (Sitzreihen sichtbar) ---
    function backStand(side, s, depth) {
      var P = sc.p.bind(sc), z0 = 0.45 * k, D0 = s.D, H = s.H, out = '';
      var key = s.kind === 'sitz' || s.kind === 'holz' ? 'sitz' : 'steh';
      var ext = side === 'N' ? (s.L >= 3 ? 1.2 * k : 0) : 0;
      var map = side === 'N' ? function (u, v, z) { return P(X - ext + u, Y - g - v, z); } : function (u, v, z) { return P(X - g - v, Y + u, z); };
      var len = side === 'N' ? PL + 2 * ext : PW;
      var base = s.kind === 'holz' ? '#8a5a32' : s.kind === 'huegel' ? '#5e9a48' : s.kind === 'wall' ? '#a39b8a' : s.kind === 'steh' ? '#8d8676' : shade(seatCol, 0.8);
      var fill = s.kind === 'huegel' ? grassPattern(sc, '#5e9a48') : crowdPattern(sc, base, c1, c2, s.kind === 'holz' ? 0.35 : s.kind === 'wall' ? 0.5 : s.kind === 'steh' ? 0.95 : 0.8);
      if (s.kind !== 'huegel') out += sc.poly([map(0, D0 + 0.3 * k, 0), map(len, D0 + 0.3 * k, 0), map(len, D0 + 0.3 * k, H + 0.5 * k), map(0, D0 + 0.3 * k, H + 0.5 * k)], concreteD, EDGE) +
        sc.poly([map(0, D0, H + 0.5 * k), map(len, D0, H + 0.5 * k), map(len, D0 + 0.3 * k, H + 0.5 * k), map(0, D0 + 0.3 * k, H + 0.5 * k)], concrete, EDGE);
      out += sc.poly([map(0, 0, z0), map(len, 0, z0), map(len, D0, H), map(0, D0, H)], fill, EDGE);
      if (s.kind !== 'huegel') {
        var rows = Math.round(3 + s.L * 1.6);
        for (var r = 1; r < rows; r++) { var t = r / rows; out += seg(map(0, D0 * t, z0 + (H - z0) * t), map(len, D0 * t, z0 + (H - z0) * t), 'rgba(0,0,0,.22)', 0.5); }
        for (var u = 3 * k; u < len - 1; u += 4.5 * k) out += seg(map(u, 0, z0), map(u, D0, H), s.kind === 'sitz' ? '#e8a23a' : '#d9d4c6', 1.6);
      }
      out += sc.poly([map(0, -0.15 * k, 0), map(len, -0.15 * k, 0), map(len, -0.15 * k, z0), map(0, -0.15 * k, z0)], s.kind === 'huegel' ? '#4f8a3c' : concrete, EDGE);
      out += sc.poly([map(len, 0, 0), map(len, 0, z0), map(len, D0, H), map(len, D0 + 0.3 * k, H + 0.5 * k), map(len, D0 + 0.3 * k, 0)], s.kind === 'huegel' ? '#3f7a32' : shade(concrete, 0.78), EDGE);
      if (s.kind === 'sitz' || s.kind === 'steh') for (var fl = 2 * k, fi = 0; fl < len; fl += 7 * k, fi++) { var fb = map(fl, D0 + 0.15 * k, H + 0.5 * k), ft = map(fl, D0 + 0.15 * k, H + 2.2 * k); out += seg(fb, ft, '#666', 0.6) + '<polygon points="' + f1(ft[0]) + ',' + f1(ft[1]) + ' ' + f1(ft[0] + 5) + ',' + f1(ft[1] + 1.5) + ' ' + f1(ft[0]) + ',' + f1(ft[1] + 3) + '" fill="' + (fi % 2 ? c2 : c1) + '" stroke="rgba(0,0,0,.3)" stroke-width=".3"/>'; }
      sc.add(depth, clickWrap(out, key));
      if (s.roof) {
        var rz = H + 1.9 * k, vF = D0 * 0.12, vB = D0 + 0.5 * k, bump = [0, 0.38, 0.55, 0.38, 0], o2 = '';
        for (var st2 = 0; st2 < 4; st2++) {
          var va = vB - (vB - vF) * st2 / 4, vb = vB - (vB - vF) * (st2 + 1) / 4, za = rz + bump[st2] * k - st2 * 0.1 * k, zb = rz + bump[st2 + 1] * k - (st2 + 1) * 0.1 * k;
          o2 += sc.poly([map(-0.6 * k, va, za), map(len + 0.6 * k, va, za), map(len + 0.6 * k, vb, zb), map(-0.6 * k, vb, zb)], st2 % 2 ? roofCol : roofHi, EDGE);
        }
        for (var rb = 0; rb <= len + 0.1; rb += 3 * k) { var pts = []; for (var st3 = 0; st3 <= 4; st3++) { var vv = vB - (vB - vF) * st3 / 4; pts.push(map(rb, vv, rz + bump[st3] * k - st3 * 0.1 * k)); } o2 += '<polyline points="' + sc.pts(pts) + '" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".6"/>'; }
        o2 += sc.poly([map(-0.6 * k, vF, rz - 0.4 * k), map(len + 0.6 * k, vF, rz - 0.4 * k), map(len + 0.6 * k, vF, rz - 0.75 * k), map(-0.6 * k, vF, rz - 0.75 * k)], shade(roofCol, 0.7), EDGE);
        for (var su = 0; su <= len; su += 6 * k) o2 += seg(map(su, vB, 0), map(su, vB, rz), '#8e96a3', 1.2);
        sc.add(depth + 5, clickWrap(o2, 'dach'));
      }
    }
    // --- Tribüne vorne (Fassade sichtbar) ---
    function frontStand(side, s, depth) {
      var P = sc.p.bind(sc), D0 = s.D, H = s.H, out = '';
      var map = side === 'S' ? function (u, v, z) { return P(X + u, Y + PW + g + v, z); } : function (u, v, z) { return P(X + PL + g + v, Y + u, z); };
      var len = side === 'S' ? PL : PW, key = s.kind === 'sitz' ? 'sitz' : 'steh';
      var base = s.kind === 'steh' ? '#8d8676' : shade(seatCol, 0.8), fill = crowdPattern(sc, base, c1, c2, s.kind === 'steh' ? 0.95 : 0.8);
      out += sc.poly([map(0, 0, 0.45 * k), map(len, 0, 0.45 * k), map(len, D0, H), map(0, D0, H)], fill, EDGE);
      var fz = H + 0.5 * k, fv = D0 + 0.3 * k;
      out += sc.poly([map(0, fv, 0), map(len, fv, 0), map(len, fv, fz), map(0, fv, fz)], concrete, EDGE);
      out += sc.poly([map(0, D0, fz), map(len, D0, fz), map(len, fv, fz), map(0, fv, fz)], shade(concrete, 1.05), EDGE);
      out += sc.poly([map(0, fv + 0.01, fz - 0.55 * k), map(len, fv + 0.01, fz - 0.55 * k), map(len, fv + 0.01, fz - 0.2 * k), map(0, fv + 0.01, fz - 0.2 * k)], lum(c1) > 0.85 ? c2 : c1);
      for (var u = 1.5 * k; u < len; u += 2.2 * k) out += seg(map(u, fv + 0.02, 0.1), map(u, fv + 0.02, fz - 0.6 * k), shade(concrete, 0.8), 1.4);
      for (var e = 2.5 * k; e < len - 1; e += 7 * k) out += sc.poly([map(e, fv + 0.02, 0), map(e + 1.6 * k, fv + 0.02, 0), map(e + 1.6 * k, fv + 0.02, Math.min(1.4 * k, fz * 0.5)), map(e, fv + 0.02, Math.min(1.4 * k, fz * 0.5))], '#3a3f4a');
      out += sc.poly([map(len, 0, 0), map(len, 0, 0.45 * k), map(len, D0, H), map(len, D0, fz), map(len, fv, fz), map(len, fv, 0)], shade(concrete, 0.78), EDGE);
      sc.add(depth, clickWrap(out, key));
      if (s.roof) {
        var rz = H + 1.9 * k, vF = D0 * 0.15, vB = D0 + 0.5 * k, bump = [0, 0.4, 0.6, 0.4, 0], o2 = '';
        for (var su = 0; su <= len; su += 2.6 * k) o2 += seg(map(su, vB, fz), map(su, vB, rz), '#9aa6b8', 1.3);
        for (var st2 = 0; st2 < 4; st2++) {
          var va = vF + (vB - vF) * st2 / 4, vb = vF + (vB - vF) * (st2 + 1) / 4;
          o2 += sc.poly([map(-0.5 * k, va, rz + bump[st2] * k), map(len + 0.5 * k, va, rz + bump[st2] * k), map(len + 0.5 * k, vb, rz + bump[st2 + 1] * k), map(-0.5 * k, vb, rz + bump[st2 + 1] * k)], st2 % 2 ? roofCol : roofHi, EDGE);
        }
        for (var rb = 0; rb <= len + 0.1; rb += 2.6 * k) { var pts = []; for (var st3 = 0; st3 <= 4; st3++) pts.push(map(rb, vF + (vB - vF) * st3 / 4, rz + bump[st3] * k)); o2 += '<polyline points="' + sc.pts(pts) + '" fill="none" stroke="rgba(255,255,255,.6)" stroke-width=".6"/>'; }
        var gp = []; for (var st4 = 0; st4 <= 4; st4++) gp.push(map(len + 0.5 * k, vF + (vB - vF) * st4 / 4, rz + bump[st4] * k)); gp.push(map(len + 0.5 * k, vB, rz - 0.3 * k)); gp.push(map(len + 0.5 * k, vF, rz - 0.3 * k));
        o2 += '<polygon points="' + sc.pts(gp) + '" fill="' + shade(roofCol, 0.7) + '" ' + EDGE + '/>';
        sc.add(depth + 5, clickWrap(o2, 'dach'));
      }
    }
    function corner(x, y, w, d, h, depth) { sc.box(x, y, 0, w, d, h, concrete, { depth: depth, top: crowdPattern(sc, shade(seatCol, 0.8), c1, c2, 0.8), shadow: false }); }
    function cOn(id, a, b) { return corners ? corners[id] && sides[a] && sides[b] : sitz >= 4 && sides[a] && sides[b]; }
    if (cOn('NW', 'N', 'W')) corner(X - g - dW, Y - g - dN, dW, dN, Math.min(sides.N.H, sides.W.H), BACK - 10);
    backStand('N', sides.N, BACK);
    if (cOn('NE', 'N', 'E')) corner(X + PL + g, Y - g - dN, dE, dN, Math.min(sides.N.H, sides.E.H), BACK + 40);
    if (sides.W) backStand('W', sides.W, BACK + 20);
    if (cOn('SW', 'W', 'S')) corner(X - g - dW, Y + PW + g, dW, dS, Math.min(sides.W.H, sides.S.H), BACK + 60);
    if (sides.E) frontStand('E', sides.E, FRONT);
    if (sides.S) frontStand('S', sides.S, FRONT + 20);
    if (cOn('SE', 'E', 'S')) corner(X + PL + g, Y + PW + g, dE, dS, Math.min(sides.E.H, sides.S.H), FRONT + 40);
    // VIP-Logen als Glasband in der Haupttribüne
    if (vip > 0) {
      var N = sides.N, vw = PL * (0.25 + vip * 0.1), vt = 0.55, vz = 0.45 * k + (N.H - 0.45 * k) * vt;
      sc.box(X + (PL - vw) / 2, Y - g - N.D * vt - 0.6 * k, vz - 0.2 * k, vw, 0.8 * k, (0.7 + vip * 0.12) * k, '#1f2a3d', { depth: BACK + 2, windows: '#3b5b86', litCol: '#ffd56b', lit: 0.6, floor: 0.7 * k, winGap: 0.8 * k, click: opts.click, key: 'vip', title: 'VIP-Logen: ' + D.facilities.vip.levels[vip].n, shadow: false });
    }
    // Flutlicht
    function mast(mx, my, depth, h) {
      var b0 = sc.p(mx, my, 0), t0 = sc.p(mx, my, h), w = 2.6 * sc.s * k * 0.45, s = '';
      s += seg(b0, t0, '#aab2bf', f1(1.2 + k));
      if (licht >= 2) {
        s += '<rect x="' + f1(t0[0] - w) + '" y="' + f1(t0[1] - w * 0.8) + '" width="' + f1(w * 2) + '" height="' + f1(w * 1.3) + '" fill="#e8edf3" stroke="#555" stroke-width=".6"/>';
        for (var a = 0; a < 4; a++) for (var b = 0; b < 3; b++) s += '<rect x="' + f1(t0[0] - w + 1 + a * (w * 2 - 2) / 4) + '" y="' + f1(t0[1] - w * 0.8 + 1 + b * (w * 1.3 - 2) / 3) + '" width="' + f1((w * 2 - 2) / 4 - 0.8) + '" height="' + f1((w * 1.3 - 2) / 3 - 0.8) + '" fill="' + (licht === 3 ? '#dff3ff' : '#fff6c9') + '"/>';
        if (licht === 3) s += '<circle cx="' + f1(t0[0]) + '" cy="' + f1(t0[1]) + '" r="' + f1(w * 2.4) + '" fill="#d6eeff" opacity=".18"/>';
      } else s += '<rect x="' + f1(t0[0] - 3) + '" y="' + f1(t0[1] - 2) + '" width="6" height="3" fill="#fff3b0" stroke="#555" stroke-width=".5"/>';
      sc.add(depth, clickWrap(s, 'licht'));
    }
    if (licht > 0) {
      var mh = (licht >= 2 ? 14 : 8) * k, off = 2.2 * k;
      mast(bb[0] + off, bb[1] + off, BACK - 20, mh);
      mast(bb[2] - off, bb[1] + off, BACK + 50, mh);
      if (licht >= 2) { mast(bb[0] + off, bb[3] - off, BACK + 70, mh); mast(bb[2] - off, bb[3] - off, FRONT + 60, mh); }
    }
    // Anzeigetafel / Videowände (hinter der Haupttribüne)
    function screen(x, y, z, w, h, depth, big) {
      var P = sc.p.bind(sc), s = '';
      s += seg(P(x + w * 0.2, y, 0), P(x + w * 0.2, y, z), '#7b8494', 1.4) + seg(P(x + w * 0.8, y, 0), P(x + w * 0.8, y, z), '#7b8494', 1.4);
      s += sc.poly([P(x, y, z), P(x + w, y, z), P(x + w, y, z + h), P(x, y, z + h)], '#111827', 'stroke="#64748b" stroke-width="1"');
      if (big) s += sc.poly([P(x + 0.3, y + 0.01, z + 0.3), P(x + w - 0.3, y + 0.01, z + 0.3), P(x + w - 0.3, y + 0.01, z + h - 0.3), P(x + 0.3, y + 0.01, z + h - 0.3)], '#1e3a8a');
      s += seg(P(x + w * 0.15, y, z + h * 0.62), P(x + w * 0.45, y, z + h * 0.62), big ? '#7dffa8' : '#f5f5f5', big ? 2.2 : 1.4);
      s += seg(P(x + w * 0.55, y, z + h * 0.62), P(x + w * 0.85, y, z + h * 0.62), big ? '#fcd34d' : '#f5f5f5', big ? 2.2 : 1.4);
      if (big) s += seg(P(x + w * 0.2, y, z + h * 0.32), P(x + w * 0.8, y, z + h * 0.32), '#93c5fd', 1.2);
      sc.add(depth, clickWrap(s, 'video'));
    }
    if (video === 0) screen(X + PL * 0.72, bb[1] + 0.8 * k, 1.4 * k, 3 * k, 1.4 * k, BACK - 15, false);
    else { screen(X + PL * 0.62, bb[1] + 0.6 * k, sides.N.H + 0.8 * k, 7 * k, 3.4 * k, BACK - 15, true); if (video >= 2) screen(X + PL * 0.08, bb[1] + 0.6 * k, sides.N.H + 0.8 * k, 7 * k, 3.4 * k, BACK - 14, true); }
    // Kioske & Sanitär am Umlauf (vorne)
    var nk = (f.hosp || 0) + (f.sanitaer || 0);
    for (var kk = 0; kk < nk; kk++) {
      var kx = X + 1 * k + kk * 4.2 * k, ky = bb[3] - 1.3 * k, isS = kk % 2 === 1;
      if (kx > X + PL) break;
      sc.box(kx, ky, 0, 2.6 * k, 1.1 * k, 1.1 * k, isS ? '#5ba4d6' : '#e8dcc0', { depth: FRONT + 100 + kk, click: opts.click, key: isS ? 'sanitaer' : 'hosp', title: isS ? 'Sanitäranlagen' : 'Gastronomie', shadow: false });
      sc.box(kx - 0.2 * k, ky - 0.1 * k, 1.1 * k, 3 * k, 1.4 * k, 0.25 * k, isS ? '#2563eb' : '#e2622d', { depth: FRONT + 100.5 + kk, shadow: false });
    }
    // Technik: Antenne mit Blinklicht
    if ((f.technik || 0) >= 2) { var ta = sc.p(X + PL * 0.5, Y - g - sides.N.D - 0.2 * k, sides.N.H + 0.5 * k), tb = sc.p(X + PL * 0.5, Y - g - sides.N.D - 0.2 * k, sides.N.H + 3 * k); sc.add(BACK + 8, seg(ta, tb, '#ddd', 1) + '<circle class="blink" cx="' + f1(tb[0]) + '" cy="' + f1(tb[1]) + '" r="1.8" fill="#ef4444"/>'); }
    // Besucher auf dem Vorplatz
    people(sc, bb[0] + 1, bb[3] - 1.2 * k, bb[2] - bb[0] - 2, 1, 24, [c1, c2, '#334155', '#e11d48', '#f5f5f5'], FRONT + 200);
    // Baustellen
    ['steh', 'sitz', 'dach', 'vip', 'licht', 'video', 'rasen', 'sanitaer', 'hosp', 'technik'].forEach(function (key, i) { var b = building(club, key); if (b) crane(sc, i % 2 ? bb[2] - 1 : bb[0] + 1, bb[1] + (bb[3] - bb[1]) * (0.2 + 0.15 * (i % 4)), opts.labels ? 'Bau: ' + D.facilities[key].name : '', k * 0.9); });
    if (R.stadium && R.stadium.has(club)) club.stadium.jobs.slice(0, 3).forEach(function (j, i) { var sd = R.stadium.sec(j.sec).side, cx = sd === 'W' ? bb[0] + 1 : sd === 'E' ? bb[2] - 1 : X + PL * (0.25 + 0.25 * i), cy = sd === 'N' ? bb[1] + 1 : sd === 'S' ? bb[3] - 1 : Y + PW / 2; crane(sc, cx, cy, opts.labels ? 'Bau: ' + R.stadium.sec(j.sec).n : '', k * 0.9); });
    if (opts.labels) sc.label(X + PL / 2, Y - g - dN, sides.N.H + (sides.N.roof ? 3 : 1.5) * k, club.stadiumName.toUpperCase(), 'Kapazität ' + R.fmtNum(R.econ.capacity(club)), { size: 10.5 });
    return bb;
  };

  // ---------- Hallenansicht ----------
  G.stadiumView = function (club) {
    var sc = new Scene(6.4, 458, 190);
    plate(sc, -20, -20, 84, 80, '#4f8f3e');
    G.stadium(sc, club, 4, 4, 1.25, { click: 'stadiumPart', labels: true });
    G.infra(sc, club, { x0: -20, x1: 64, roadY: 45, railY: -18.5, parkX: 38, transitX: -16, zebraX: 20, labels: true });
    [[-17, -6], [-17, 2], [-17, 10], [-17, 18], [-17, 26], [-15, 36], [60, -12], [60, -4], [61, 4], [60, 12], [61, 20], [60, 28], [0, -14], [8, -14], [16, -14], [44, -14], [52, -14], [-12, 41], [-6, 41], [30, 41]].forEach(function (t, i) { tree(sc, t[0], t[1], 1.1, i % 3 === 1 ? 'round' : 'cone'); });
    return '<div class="iso-wrap stadium-bg">' + sc.render(940, 610) + '</div>';
  };
  // kleines Vorschaubild (Zentrale)
  G.stadiumThumb = function (club) {
    var sc = new Scene(4, 185, 100);
    plate(sc, -9, -9, 66, 50, '#4f8f3e');
    G.stadium(sc, club, 2, 2, 1.1, {});
    [[-7, -5], [-7, 6], [-7, 18], [-7, 30], [54, -6], [54, 6], [54, 18], [54, 30]].forEach(function (t) { tree(sc, t[0], t[1], 1, 'cone'); });
    return '<div class="iso-wrap thumb">' + sc.render(420, 310) + '</div>';
  };

  // ---------- Vereinsstadt (Voxel-Stil) ----------
  G.cityPlots = {
    geschaeft: [-33, -27, 10, 9], gewerbe: [-1, -27, 17, 9], solar: [20, -27, 15, 9],
    training: [-33, -12, 15, 13], jugend: [-33, 5, 15, 12], medizin: [-33, 21, 13, 10],
    fanshop: [-2, 37, 9, 7], restaurant: [10, 37, 10, 7], cafe: [23, 37, 7, 7],
    hotel: [50, -27, 10, 10], museum: [50, -12, 12, 10], eventhalle: [50, 3, 14, 12], erlebnis: [50, 20, 14, 12]
  };
  function pitchSmall(sc, x, y, w, d, col) {
    col = col || '#3fa34d';
    sc.flat(x, y, w, d, col, GROUND + 300, 'stroke="#fff" stroke-width=".8"');
    for (var i = 1; i < 6; i += 2) sc.flat(x + i * w / 6, y, w / 6, d, shade(col, 1.08), GROUND + 301);
    sc.line([x + w / 2, y], [x + w / 2, y + d], '#fff', 0.7, MARK + 20); sc.ring(x + w / 2, y + d / 2, Math.min(w, d) * 0.16, 0, '#fff', 0.7, MARK + 20);
    [x, x + w].forEach(function (gx) { var dd = sc.dep(gx, y, 0.1, d); sc.line([gx, y + d * 0.42, 0], [gx, y + d * 0.42, 0.8], '#fff', 1.1, dd); sc.line([gx, y + d * 0.58, 0], [gx, y + d * 0.58, 0.8], '#fff', 1.1, dd); sc.line([gx, y + d * 0.42, 0.8], [gx, y + d * 0.58, 0.8], '#fff', 1.1, dd); });
  }
  function awning(sc, x, y, z, w, c1, c2, depth) {
    var P = sc.p.bind(sc), s = '', n = Math.max(3, Math.round(w / 0.8));
    for (var i = 0; i < n; i++) s += sc.poly([P(x + i * w / n, y, z), P(x + (i + 1) * w / n, y, z), P(x + (i + 1) * w / n, y + 1, z - 0.5), P(x + i * w / n, y + 1, z - 0.5)], i % 2 ? c1 : c2, 'stroke="rgba(0,0,0,.2)" stroke-width=".4"');
    sc.add(depth, s);
  }
  function parasol(sc, x, y, col) {
    var b = sc.p(x, y, 0), t = sc.p(x, y, 1.6), r = sc.s * 0.9;
    sc.add(sc.dep(x, y, 0.3, 0.3) + 0.5, '<line x1="' + f1(b[0]) + '" y1="' + f1(b[1]) + '" x2="' + f1(t[0]) + '" y2="' + f1(t[1]) + '" stroke="#555" stroke-width=".8"/><ellipse cx="' + f1(t[0]) + '" cy="' + f1(t[1]) + '" rx="' + f1(r) + '" ry="' + f1(r * 0.5) + '" fill="' + col + '" stroke="rgba(0,0,0,.3)" stroke-width=".5"/>');
  }
  function ox(o, extra) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; }); return r; }
  // Gebäude-Archetypen je Betrieb und Ausbaustufe (liefern die Gebäudehöhe für die Beschriftung)
  var ARCH = {
    geschaeft: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { sc.box(x + 2, y + 2, 0, 5, 4, 1.8, '#e6d7b5', ox(o, { windows: '#6b8cb5', lit: 0.3 })); sc.gable(x + 2, y + 2, 1.8, 5, 4, 1.4, '#b5523b', 'x'); return 3.4; }
      if (l === 2) { sc.box(x + 1, y + 2, 0, 4, 2, 1.4, '#3b82c4', o); sc.box(x + 5.2, y + 2, 0, 4, 2, 1.4, '#e3a72f', o); sc.box(x + 2.5, y + 2.2, 1.4, 4, 2, 1.4, '#7fb069', ox(o, { shadow: false })); return 3; }
      if (l === 3) { sc.box(x + 1, y + 1.5, 0, 7, 5, 4, '#d9cfb8', ox(o, { windows: '#5c7aa3', lit: 0.3 })); sc.box(x + 1, y + 1.5, 4, 7, 5, 0.3, '#8a8f99', { shadow: false }); return 4.6; }
      sc.box(x + 1, y + 1, 0, 8, 6, 2.5, '#cfd6e2', ox(o, { windows: '#4f7fb8', lit: 0.3 })); sc.box(x + 3, y + 2, 2.5, 5, 4, 6, '#9fc3e8', ox(o, { windows: '#2c4f80', lit: 0.4, winGap: 0.7, shadow: false })); sc.box(x + 3, y + 2, 8.5, 5, 4, 0.5, c.colors[0], { shadow: false }); sc.shadow(x + 3, y + 2, 5, 4, 9); return 9.5;
    },
    gewerbe: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { sc.box(x + 2, y + 3, 0, 4, 2, 1.4, '#8a94a6', o); sc.box(x + 7, y + 3, 0, 4, 2, 1.4, '#a37b4f', o); return 2; }
      var n = l === 2 ? 1 : l === 3 ? 2 : 3, hgt = 3.4;
      for (var i = 0; i < n; i++) { var bx = x + 0.6 + i * 5.3; sc.box(bx, y + 1.5, 0, 4.8, 6, 2.4, '#b7bfcc', o); for (var t = 0; t < 3; t++) sc.gable(bx, y + 1.5 + t * 2, 2.4, 4.8, 2, 0.8, '#7c8698', 'x'); }
      if (l >= 4) { sc.box(x + 13.2, y + 1, 0, 3.5, 3.5, 7, '#cbd5e1', ox(o, { windows: '#3d6aa8', lit: 0.4 })); hgt = 7.5; }
      return hgt;
    },
    solar: function (sc, x, y, w, d, l, c, o) {
      var rows = Math.min(6, l * 2), P = sc.p.bind(sc);
      for (var r = 0; r < rows; r++) for (var cc = 0; cc < (l >= 3 ? 4 : 3); cc++) {
        var px = x + 0.6 + cc * 3.6, py = y + 0.6 + r * 1.4;
        sc.add(sc.dep(px, py, 3, 1), '<g class="iso-click" data-act="cityPlot" data-k="solar">' + sc.poly([P(px, py + 1, 0.3), P(px + 3, py + 1, 0.3), P(px + 3, py, 1), P(px, py, 1)], '#2a4fa8', 'stroke="#cfd8e6" stroke-width=".5"') + '</g>');
      }
      if (l >= 3) sc.box(x + w - 3, y + d - 3, 0, 2.4, 2, 1.6, '#e5e7eb', o);
      return 1.6;
    },
    training: function (sc, x, y, w, d, l, c, o) {
      pitchSmall(sc, x + 0.5, y + 0.5, 9, 5.5);
      if (l >= 2) pitchSmall(sc, x + 0.5, y + 6.8, 9, 5.5);
      if (l >= 2) { sc.box(x + 10.3, y + 1, 0, 4, 3.5, 1.6, '#d7d2c4', ox(o, { windows: '#5c7aa3' })); sc.gable(x + 10.3, y + 1, 1.6, 4, 3.5, 1, '#7d8a99', 'y'); }
      if (l >= 4) sc.box(x + 10.3, y + 5.5, 0, 4, 6, 2.4, '#e6edf5', ox(o, { windows: '#3d6aa8', lit: 0.3 }));
      if (l >= 5) sc.box(x + 10.3, y + 5.5, 2.4, 4, 6, 0.4, c.colors[0], { shadow: false });
      return l >= 4 ? 3.2 : 2.8;
    },
    jugend: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { sc.flat(x + 1, y + 1, 9, 6, '#a88a5a', GROUND + 300, 'stroke="#d9c79c" stroke-width=".6"'); sc.line([x + 1, y + 3.5, 0], [x + 1, y + 3.5, 0.6], '#fff', 1, sc.dep(x, y, 1, 7)); sc.line([x + 10, y + 3.5, 0], [x + 10, y + 3.5, 0.6], '#fff', 1, sc.dep(x + 10, y, 1, 7)); people(sc, x + 2, y + 2, 7, 4, 6, ['#e11d48', '#2563eb', '#f5b301']); return 1; }
      pitchSmall(sc, x + 0.5, y + 0.5, 9, 5.5, '#4caf50');
      sc.box(x + 10.2, y + 0.8, 0, 4.3, 4, 1.4 + l * 0.6, '#f0e6d2', ox(o, { windows: '#5c7aa3', lit: 0.3 }));
      if (l >= 3) pitchSmall(sc, x + 0.5, y + 6.5, 9, 5, '#4caf50');
      if (l >= 4) sc.box(x + 10.2, y + 6, 0, 4.3, 5, 2.2, '#e2d6bf', ox(o, { windows: '#5c7aa3', lit: 0.4 }));
      if (l >= 5) sc.box(x + 10.2, y + 6, 2.2, 4.3, 5, 1.6, '#d8c9ac', ox(o, { windows: '#5c7aa3', lit: 0.5, shadow: false }));
      return 1.4 + l * 0.6 + 0.5;
    },
    medizin: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { // Schamanenzelt mit Lagerfeuer
        var P = sc.p.bind(sc), cx = x + 5, cy = y + 4, r = 2, hgt = 3.4;
        var s = sc.poly([P(cx - r, cy + r, 0), P(cx + r, cy + r, 0), P(cx, cy, hgt)], '#b07a46', EDGE) + sc.poly([P(cx + r, cy - r, 0), P(cx + r, cy + r, 0), P(cx, cy, hgt)], '#8a5a30', EDGE) + sc.poly([P(cx - 0.5, cy + r, 0), P(cx + 0.5, cy + r, 0), P(cx, cy + r * 0.5, 1.2)], '#3a2a1a');
        var tp = P(cx, cy, hgt + 0.8); s += '<circle cx="' + f1(tp[0]) + '" cy="' + f1(tp[1]) + '" r="2" fill="#cbd5e1" opacity=".7"/><circle cx="' + f1(tp[0] + 2) + '" cy="' + f1(tp[1] - 4) + '" r="2.8" fill="#cbd5e1" opacity=".5"/>';
        var fp = P(cx + 2.6, cy + 2.6, 0); s += '<circle cx="' + f1(fp[0]) + '" cy="' + f1(fp[1] - 1) + '" r="1.6" fill="#f59e0b"/><circle cx="' + f1(fp[0]) + '" cy="' + f1(fp[1] - 1.8) + '" r=".9" fill="#fde047"/>';
        sc.add(sc.dep(x, y, w, d), '<g class="iso-click" data-act="cityPlot" data-k="medizin">' + s + '</g>'); sc.shadow(cx - r, cy - r, r * 2, r * 2, 2);
        return 4.2;
      }
      var hw = Math.min(4 + l, w - 2), hd = Math.min(4 + l * 0.6, d - 2), hh = 1.2 + l * 0.9;
      sc.box(x + 1, y + 1, 0, hw, hd, hh, '#f3f6fa', ox(o, { windows: '#7fb3e0', lit: 0.2 }));
      var top = sc.p(x + 1 + hw / 2, y + 1 + hd / 2, hh + 0.05);
      sc.add(sc.dep(x + 1, y + 1, hw, hd) + 0.01, '<text x="' + f1(top[0]) + '" y="' + f1(top[1] + 4) + '" font-size="13" fill="#e11d48" text-anchor="middle" font-weight="900">✚</text>');
      if (l >= 4) { sc.box(x + 1.2, y + d - 1.6, 0, 2.6, 1.3, 1.2, '#ffffff', { top: '#f8fafc' }); sc.box(x + 1.2, y + d - 1.6, 1.2, 2.6, 1.3, 0.2, '#e11d48', { shadow: false }); }
      if (l >= 6) sc.ring(x + 1 + hw / 2, y + 1 + hd / 2, 1.2, hh + 0.1, '#f5b301', 1, sc.dep(x + 1, y + 1, hw, hd) + 0.02);
      return hh + 1;
    },
    fanshop: function (sc, x, y, w, d, l, c, o) {
      var c1 = c.colors[0], c2 = c.colors[1];
      if (l === 1) { sc.box(x + 2, y + 2, 0, 3, 2, 1.3, '#e8dcc0', o); awning(sc, x + 2, y + 4, 1.6, 3, c1, c2, sc.dep(x + 2, y + 2, 3, 2) + 0.5); return 2.2; }
      var bw = Math.min(w - 1, 3 + l * 1.3), bd = Math.min(d - 2, 3 + l * 0.5), bh = 1.4 + l * 0.6;
      sc.box(x + 0.5, y + 1, 0, bw, bd, bh, l >= 4 ? '#f2f4f8' : '#ece6d6', ox(o, { windows: '#5c7aa3', lit: 0.6, litCol: '#ffe08a' }));
      awning(sc, x + 0.5, y + 1 + bd, Math.min(1.6, bh * 0.6), bw, c1, c2, sc.dep(x, y, w, d) + 0.5);
      sc.box(x + 0.5, y + 1, bh, bw, 0.25, 0.9, c1, { shadow: false, depth: sc.dep(x, y, w, d) + 0.6 });
      return bh + 1.2;
    },
    restaurant: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { // Würstchenbude mit Grillrauch
        sc.box(x + 2, y + 2, 0, 3, 2, 1.4, '#c0392b', o); awning(sc, x + 2, y + 4, 1.7, 3, '#fff', '#c0392b', sc.dep(x + 2, y + 2, 3, 2) + 0.5);
        var sm = sc.p(x + 3.5, y + 3, 2.2); sc.add(OVER - 100, '<circle cx="' + f1(sm[0]) + '" cy="' + f1(sm[1]) + '" r="2" fill="#e5e7eb" opacity=".6"/><circle cx="' + f1(sm[0] + 2) + '" cy="' + f1(sm[1] - 4) + '" r="2.6" fill="#e5e7eb" opacity=".4"/>'); return 2.4;
      }
      if (l === 2) { for (var i = 0; i < 3; i++) sc.box(x + 0.8 + i * 3, y + 2, 0, 2.2, 1.8, 1.4, ['#e39a3b', '#16a085', '#c0392b'][i], o); return 2; }
      var bw = Math.min(w - 1, 4 + l), bd = Math.min(d - 2.5, 3.5 + l * 0.3), bh = 1.4 + l * 0.5;
      sc.box(x + 0.5, y + 0.6, 0, bw, bd, bh, '#f1e3c8', ox(o, { windows: '#6b4a2a', lit: 0.8, litCol: '#ffd27a' }));
      sc.gable(x + 0.5, y + 0.6, bh, bw, bd, 1, '#8b3a2a', 'x');
      for (var p = 0; p < Math.min(4, l); p++) parasol(sc, x + 1.5 + p * 2.2, y + d - 1, p % 2 ? '#e11d48' : '#f5f5f5');
      return bh + 1.4;
    },
    cafe: function (sc, x, y, w, d, l, c, o) {
      var bw = 4 + Math.min(l, 2) * 0.5, bh = 1.4 + l * 0.35;
      sc.box(x + 1, y + 1, 0, bw, 3, bh, '#e8d5b0', ox(o, { windows: '#5a3d22', lit: 0.8, litCol: '#ffd27a' }));
      sc.gable(x + 1, y + 1, bh, bw, 3, 0.9, '#6b4a2a', 'y');
      for (var p = 0; p < Math.min(3, l + 1); p++) parasol(sc, x + 1.5 + p * 1.8, y + 5.6, p % 2 ? c.colors[0] : '#fde68a');
      return bh + 1.2;
    },
    hotel: function (sc, x, y, w, d, l, c, o) {
      if (l === 1) { sc.box(x + 2, y + 2, 0, 5, 4, 2.2, '#efe2c8', ox(o, { windows: '#6b8cb5', lit: 0.4, floor: 1.1 })); sc.gable(x + 2, y + 2, 2.2, 5, 4, 1.5, '#a0412d', 'x'); return 4; }
      var hh = [0, 0, 3.6, 5.4, 8, 11][l], bw = l >= 4 ? 6 : 5;
      sc.box(x + 1.5, y + 1.5, 0, bw, 5, hh, l >= 4 ? '#c9d6ea' : '#d9cdb8', ox(o, { windows: '#3d5f8f', lit: 0.5 }));
      sc.box(x + 1.5, y + 1.5, hh, bw, 5, 0.4, '#4b5563', { shadow: false });
      if (l >= 5) sc.box(x + 1.5, y + 7, 0, 8, 2.5, 2, '#e5e7eb', ox(o, { windows: '#3d5f8f', lit: 0.6 }));
      return hh + 0.8;
    },
    museum: function (sc, x, y, w, d, l, c, o) {
      var bw = Math.min(w - 1, 5 + l), bd = Math.min(d - 1.5, 4 + l * 0.6), hh = 1.6 + l * 0.35, d0 = sc.dep(x, y, w, d);
      sc.box(x + 0.6, y + 0.6, 0, bw, bd, 0.4, '#d6ceb8', ox(o, { top: '#e6dfcb', depth: d0 }));
      sc.box(x + 0.9, y + 0.9, 0.4, bw - 0.6, bd - 0.9, hh, '#efe8d5', ox(o, { windows: '#7a6a4a', lit: 0.2, winGap: 1.2, depth: d0 + 0.1, shadow: false }));
      for (var i = 0; i < Math.round(bw / 1.1); i++) sc.box(x + 1.1 + i * 1.1, y + bd - 0.1, 0.4, 0.35, 0.35, hh, '#fbf6e9', { shadow: false, depth: d0 + 0.3 });
      sc.gable(x + 0.6, y + 0.4, 0.4 + hh, bw, bd + 0.2, 1.1, '#cfc4a5', 'x', d0 + 0.4);
      sc.shadow(x + 0.6, y + 0.6, bw, bd, hh + 1.5);
      return hh + 2.2;
    },
    eventhalle: function (sc, x, y, w, d, l, c, o) {
      var bw = Math.min(w - 1, 6 + l * 2.4), bd = Math.min(d - 1, 5 + l * 2), hh = 1.6 + l * 0.8, P = sc.p.bind(sc);
      sc.box(x + 0.5, y + 0.5, 0, bw, bd, hh, '#8a76c4', ox(o, { windows: '#3b2f66', lit: 0.3, winGap: 1.3 }));
      var s = '', bump = [0, 0.7, 1, 0.7, 0], rh = l * 0.6;
      for (var i = 0; i < 4; i++) { var ya = y + 0.5 + bd * i / 4, yb = y + 0.5 + bd * (i + 1) / 4; s += sc.poly([P(x + 0.5, ya, hh + bump[i] * rh), P(x + 0.5 + bw, ya, hh + bump[i] * rh), P(x + 0.5 + bw, yb, hh + bump[i + 1] * rh), P(x + 0.5, yb, hh + bump[i + 1] * rh)], i % 2 ? '#b8c4d8' : '#d6deea', EDGE); }
      var gp = []; for (var j = 0; j <= 4; j++) gp.push(P(x + 0.5 + bw, y + 0.5 + bd * j / 4, hh + bump[j] * rh)); gp.push(P(x + 0.5 + bw, y + 0.5 + bd, hh)); gp.push(P(x + 0.5 + bw, y + 0.5, hh));
      s += '<polygon points="' + sc.pts(gp) + '" fill="' + shade('#8a76c4', 0.7) + '" ' + EDGE + '/>';
      sc.add(sc.dep(x + 0.5, y + 0.5, bw, bd) + 0.01, '<g class="iso-click" data-act="cityPlot" data-k="eventhalle">' + s + '</g>');
      return hh + rh + 1;
    },
    erlebnis: function (sc, x, y, w, d, l, c, o) {
      sc.flat(x + 0.5, y + 0.5, w - 1, d - 1, '#e9d8a6', GROUND + 300);
      sc.box(x + 1, y + 1, 0, 1.2, 1.2, 1.6, '#e11d48', o); sc.box(x + 3, y + 1.2, 0, 2, 0.4, 1.6, '#2563eb', o); sc.box(x + 1.2, y + 3.4, 0, 1, 1, 1, '#f5b301', o);
      people(sc, x + 1, y + 1, w - 2, d - 2, 8 + l * 6, ['#e11d48', '#2563eb', '#f5b301', '#16a34a', '#fff']);
      if (l >= 2) { // Riesenrad (dreht sich)
        var cx = x + w - 4, cy = y + 3, hb = sc.p(cx, cy, 0), hc = sc.p(cx, cy, 4.2), r = sc.s * 3.2;
        var s = '<line x1="' + f1(hb[0] - 6) + '" y1="' + f1(hb[1]) + '" x2="' + f1(hc[0]) + '" y2="' + f1(hc[1]) + '" stroke="#64748b" stroke-width="1.4"/><line x1="' + f1(hb[0] + 6) + '" y1="' + f1(hb[1]) + '" x2="' + f1(hc[0]) + '" y2="' + f1(hc[1]) + '" stroke="#64748b" stroke-width="1.4"/><g class="wheel" style="transform-origin:' + f1(hc[0]) + 'px ' + f1(hc[1]) + 'px"><circle cx="' + f1(hc[0]) + '" cy="' + f1(hc[1]) + '" r="' + f1(r) + '" fill="none" stroke="#e2e8f0" stroke-width="1.4"/>';
        for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2, ex = hc[0] + Math.cos(a) * r, ey = hc[1] + Math.sin(a) * r; s += '<line x1="' + f1(hc[0]) + '" y1="' + f1(hc[1]) + '" x2="' + f1(ex) + '" y2="' + f1(ey) + '" stroke="#cbd5e1" stroke-width=".6"/><rect x="' + f1(ex - 2) + '" y="' + f1(ey - 1.5) + '" width="4" height="3" fill="' + ['#e11d48', '#f5b301', '#2563eb', '#16a34a'][i % 4] + '"/>'; }
        sc.add(sc.dep(cx - 1, cy - 1, 2, 2) + 1, s + '</g>');
      }
      if (l >= 3) { // Achterbahn
        var pts = []; for (var t = 0; t <= 24; t++) { var u = t / 24; pts.push(sc.p(x + 1 + u * (w - 7), y + d - 2 - Math.sin(u * Math.PI * 2) * 1.5, 0.8 + Math.abs(Math.sin(u * Math.PI * 1.5)) * 3)); }
        sc.add(sc.dep(x, y + d - 4, w, 4) + 1, '<polyline points="' + sc.pts(pts) + '" fill="none" stroke="#e11d48" stroke-width="1.6"/>');
      }
      return l >= 2 ? 8 : 2.2;
    }
  };
  // Füllhäuser (Wohnviertel am Rand)
  function house(sc, x, y, rnd) {
    var w = 3 + Math.floor(rnd() * 2), d = 3 + Math.floor(rnd() * 2), h = 1.6 + Math.floor(rnd() * 3) * 0.9;
    var walls = ['#e7d6b8', '#d9b99a', '#c9a27e', '#e5ddd0', '#b8a48c'], roofs = ['#a65c42', '#8b5a3c', '#b77b5a', '#7a6a5a'];
    sc.box(x, y, 0, w, d, h, walls[Math.floor(rnd() * walls.length)], { windows: '#5f6f86', lit: 0.25, floor: 0.9, winGap: 1 });
    sc.gable(x, y, h, w, d, 1 + rnd() * 0.5, roofs[Math.floor(rnd() * roofs.length)], rnd() < 0.5 ? 'x' : 'y');
  }
  G.cityView = function (club) {
    var sc = new Scene(5.8, 512, 240);
    plate(sc, -36, -36, 104, 100, '#5c9a45');
    G.stadium(sc, club, 3, 5, 1, { click: 'nav-stadion', labels: false });
    function road(x, y, w, d) { sc.flat(x - 0.4, y - 0.4, w + 0.8, d + 0.8, '#b9bcc4', GROUND + 50); sc.flat(x, y, w, d, '#4a4f5b', GROUND + 51); if (w > d) sc.line([x, y + d / 2], [x + w, y + d / 2], '#e5e5e5', 0.6, MARK + 1, '4 4'); else sc.line([x + w / 2, y], [x + w / 2, y + d], '#e5e5e5', 0.6, MARK + 1, '4 4'); }
    road(-36, -16, 104, 2); road(-17, -36, 2, 81); road(45, -36, 2, 81);
    [[-17, -16], [45, -16]].forEach(function (c) { for (var i = 0; i < 4; i++) { sc.flat(c[0] - 2.4, c[1] + i * 0.5 + 0.05, 2, 0.28, '#f2f2f2', MARK + 2); sc.flat(c[0] + 2.4, c[1] + i * 0.5 + 0.05, 2, 0.28, '#f2f2f2', MARK + 2); } });
    G.infra(sc, club, { x0: -36, x1: 68, roadY: 46, railY: -35, parkX: 34, transitX: -14, zebraX: 16, labels: true });
    Object.keys(G.cityPlots).forEach(function (key) {
      var pl = G.cityPlots[key], x = pl[0], y = pl[1], w = pl[2], d = pl[3];
      var f = D.facilities[key], lvl = club.fac[key] != null ? club.fac[key] : (f.min || 0), max = f.levels.length - 1, b = building(club, key);
      var title = f.name + ': ' + (lvl > 0 ? f.levels[lvl].n + ' (Stufe ' + lvl + '/' + max + ')' : 'noch nicht gebaut');
      sc.flat(x, y, w, d, lvl > 0 ? '#6aa653' : '#7aa862', GROUND + 200, 'stroke="rgba(255,255,255,.35)" stroke-width=".6"');
      var short = f.name.split(' ')[0].replace('Nachwuchsleistungszentrum', 'Nachwuchs').replace('Medizinische', 'Medizin').toUpperCase();
      if (lvl <= 0 && !b) {
        sc.flat(x + 0.6, y + 0.6, w - 1.2, d - 1.2, 'rgba(255,255,255,.06)', GROUND + 201, 'stroke="#eef6e4" stroke-width="1" stroke-dasharray="3 3" class="iso-click" data-act="cityPlot" data-k="' + key + '"');
        sc.label(x + w / 2, y + d / 2, 0.5, '+ ' + short, 'Bauplatz', { click: 'cityPlot', key: key, bg: '#3b4a2f', size: 8.5 });
        return;
      }
      var o = { click: 'cityPlot', key: key, title: title };
      var hgt = lvl > 0 ? ARCH[key](sc, x, y, w, d, lvl, club, o) : 0;
      sc.flat(x, y, w, d, 'rgba(0,0,0,0)', GROUND + 202, 'class="iso-click" data-act="cityPlot" data-k="' + key + '"');
      if (lvl > 0) sc.label(x + w / 2, y + d / 2, hgt + 0.6, short, 'Stufe ' + lvl + '/' + max, { click: 'cityPlot', key: key, size: 8 });
      if (b) crane(sc, x + w - 1.5, y + 1, 'Bau ' + b.weeks + ' Wo.', 0.8);
    });
    var rnd = prng(hash(club.id + 'city'));
    var pkw = [0, 0, 10, 13, 16, 17, 19][club.fac.parken || 1];
    for (var hx = -34; hx < 64; hx += 5.2) { if (hx > -19 && hx < -12) continue; if (hx > 42 && hx < 48) continue; if ((club.fac.parken || 1) > 1 && hx > 34 - 5 && hx < 34 + pkw + 1) continue; house(sc, hx, 54 + (club.fac.strasse >= 5 ? 1.5 : 0), rnd); }
    for (var t = 0; t < 22; t++) voxTree(sc, -35 + rnd() * 102, -14.2 + rnd(), 0.7);
    [[-19.5, 34], [-19.5, 24], [-19.5, 14], [-19.5, 4], [-19.5, -6], [43, 34], [43, 24], [43, 14], [43, 4], [43, -6], [66, -20], [66, 0], [66, 20], [66, 36]].forEach(function (p) { voxTree(sc, p[0], p[1], 0.9); });
    return '<div class="iso-wrap city-bg">' + sc.render(1040, 660) + '</div>';
  };
})(RFM);
