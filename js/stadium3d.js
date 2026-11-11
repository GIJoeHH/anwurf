// ANWURF! – 3D-Darstellung (Three.js r149, lokal in vendor/) für Hallenansicht, Ausbauvorschau, Zentrale und Vereinsstadt
// Alles wird aus dem gemeinsamen Modell (stadium_model.js) erzeugt: Hallengeometrie ausschließlich aus m.parts,
// Campus aus SM.city(). Die Ansichten unterscheiden sich nur durch Kamera und Umfang (Welt bzw. nur Halle).
// Die Halle ist von außen „aufgeschnitten“: Die Dachhaut ist nur von unten sichtbar, von oben blickt man durch das
// Fachwerk auf Spielfeld und Tribünen.
// Ein einziger WebGL-Kontext rendert nacheinander in die 2D-Leinwände der sichtbaren Ansichten (iPad-schonend),
// gezeichnet wird nur bei Änderungen. Beschriftungen bleiben HTML (Overlay), nichts wird ins Bild eingebrannt.
(function (R) {
  var SM = R.stadiumModel, D = R.data;
  var S3 = R.s3d = {};
  var T = typeof THREE !== 'undefined' ? THREE : null;
  if (T && T.ColorManagement) T.ColorManagement.legacyMode = false; // Farben korrekt in sRGB umrechnen (sonst blass)
  var DEG = Math.PI / 180;

  // ---------- Einstellungen ----------
  S3.quality = function () { try { return localStorage.getItem('anwurf.gfx') || 'hoch'; } catch (e) { return 'hoch'; } };
  S3.setQuality = function (q) { try { localStorage.setItem('anwurf.gfx', q); } catch (e) {} S3.reset(); };
  S3.supported = function () {
    if (!T || typeof document === 'undefined') return false;
    if (S3._sup != null) return S3._sup;
    try { var c = document.createElement('canvas'); S3._sup = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { S3._sup = false; }
    return S3._sup;
  };
  function hq() { return S3.quality() !== 'reduziert'; }

  // ---------- Zufall ----------
  function rng(seed) { var s = (seed >>> 0) || 7; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hsh(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function shade(hex, f) { var n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; function c(v) { v = f >= 1 ? v + (255 - v) * (f - 1) : v * f; return Math.max(0, Math.min(255, Math.round(v))); } return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')'; }

  // ---------- Texturen (Canvas, einmal erzeugt und geteilt) ----------
  var TEX = {};
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(key, w, h, draw, opts) {
    if (TEX[key]) return TEX[key];
    var c = canvas(w, h), g = c.getContext('2d'); draw(g, w, h);
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; if (!opts || !opts.linear) t.encoding = T.sRGBEncoding;
    t.anisotropy = hq() ? 8 : 2; TEX[key] = t; return t;
  }
  function noise(g, w, h, n, a, r) { for (var i = 0; i < n; i++) { g.fillStyle = 'rgba(' + (r() < 0.5 ? '0,0,0' : '255,255,255') + ',' + (a * r()) + ')'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); } }
  // Sitzreihen mit Publikum: 16 m (u) × 12 m (v), Reihen à 0,8 m, Treppenaufgänge
  function seatTex(type, col, dens, guest, alt) {
    var key = 'seat|' + type + '|' + col + '|' + dens + '|' + (guest ? 1 : 0) + '|' + alt;
    return tex(key, 256, 256, function (g, w, h) {
      var r = rng(hsh(key)), rows = 15, rh = h / rows;
      var base = type === 'steh' ? '#8b8780' : type === 'business' ? '#3a3f47' : type === 'loge' ? '#2b2f36' : col;
      var crowdCols = guest ? ['#d4d4d8', '#b91c1c', '#111827', '#e5e7eb', '#7f1d1d'] : [alt, alt, col, col, col, '#111827', '#f8fafc', '#1f2937', '#6b7280'];
      for (var i = 0; i < rows; i++) {
        var y = i * rh;
        g.fillStyle = type === 'steh' ? (i % 2 ? '#86827a' : '#918d85') : shade(base, i % 2 ? 0.92 : 1.0); g.fillRect(0, y, w, rh);
        g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, w, 2.2); // Stufenkante
        if (type !== 'steh') { g.fillStyle = 'rgba(0,0,0,.18)'; for (var sx = 0; sx < w; sx += 5) g.fillRect(sx, y + 3, 1, rh - 5); } // Sitzschalen
        else if (i % 4 === 2) { g.fillStyle = '#c9c4ba'; g.fillRect(0, y + rh * 0.5, w, 1.2); } // Wellenbrecher
        for (var px = 14; px < w - 2; px += 4.3) {
          if (r() > dens) continue;
          var pc = crowdCols[Math.floor(r() * crowdCols.length)];
          g.fillStyle = pc; g.fillRect(px + r(), y + rh * 0.35, 3.2, rh * 0.5);
          g.fillStyle = ['#f1c7a5', '#d8a27c', '#8d5a3b', '#f3d6bd'][Math.floor(r() * 4)]; g.fillRect(px + 0.6 + r(), y + rh * 0.12, 2.1, 2.4);
        }
      }
      g.fillStyle = '#a7a39b'; g.fillRect(0, 0, 11, h); g.fillStyle = 'rgba(0,0,0,.25)'; for (var j = 0; j < rows; j++) g.fillRect(0, j * rh + rh / 2, 11, 1); // Treppe
      noise(g, w, h, 900, 0.08, r);
    });
  }
  // Hallenboden 49 × 27 m (Innenraum bis zu den Tribünen) mit Handballfeld 40 × 20 m; q = Stufe „Hallenboden“
  function courtTex(q, emis) {
    var G = SM.GEO, IW = 2 * G.Ix, IH = 2 * G.Iy, s = 1024 / IW, w = 1024, h = Math.round(IH * s), cg = SM.courtGeo();
    return tex('court|' + q + '|' + (emis ? 1 : 0), w, h, function (g) {
      var r = rng(7 + q), cx = w / 2, cy = h / 2, fc = SM.FLOOR_COL[Math.min(SM.FLOOR_COL.length - 1, q)];
      function X(x) { return cx + x * s; } function Y(y) { return cy + y * s; }
      function zonePath(z, sx) { g.beginPath(); z.forEach(function (p, i) { if (i) g.lineTo(X(p[0]), Y(p[1])); else g.moveTo(X(p[0]), Y(p[1])); }); }
      if (emis) { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); }
      else {
        g.fillStyle = fc[1]; g.fillRect(0, 0, w, h);
        if (q === 2 || q === 1) { // Holz bzw. Schwingboden: Dielen
          for (var y = 0; y < h; y += s * 0.14 * 8) for (var x = (Math.floor(y) % 3) * 40; x < w; x += s * 2.4) { g.fillStyle = q === 2 ? shade('#c99558', 0.9 + r() * 0.2) : shade('#a9bcd0', 0.95 + r() * 0.1); g.fillRect(x, y, s * 2.4 - 1, s * 0.14 * 8 - 1); }
        }
        g.fillStyle = q === 2 ? 'rgba(232,170,96,.55)' : fc[0]; g.fillRect(X(-20), Y(-10), 40 * s, 20 * s);
        if (q === 0) { // alter Mehrzweckboden: verblasste Fremdlinien (Basketball, Volleyball, Badminton)
          g.lineWidth = 2; [['rgba(230,180,40,.45)', 14, 7.5], ['rgba(200,60,60,.4)', 9, 4.5], ['rgba(40,120,200,.35)', 6.7, 3]].forEach(function (l) { g.strokeStyle = l[0]; g.strokeRect(X(-l[1]), Y(-l[2]), 2 * l[1] * s, 2 * l[2] * s); g.beginPath(); g.moveTo(X(0), Y(-l[2])); g.lineTo(X(0), Y(l[2])); g.stroke(); });
          for (var k = 0; k < 90; k++) { g.fillStyle = 'rgba(60,60,40,' + (0.05 + r() * 0.1) + ')'; g.beginPath(); g.ellipse(r() * w, r() * h, 4 + r() * 22, 3 + r() * 10, r() * 3, 0, 7); g.fill(); }
        }
        // Torräume dunkler
        [-1, 1].forEach(function (sx, i) { var z = cg.z6[i]; zonePath(z); g.lineTo(X(sx * 20), Y(z[z.length - 1][1])); g.lineTo(X(sx * 20), Y(z[0][1])); g.closePath(); g.fillStyle = q === 2 ? 'rgba(29,78,216,.55)' : q >= 4 ? 'rgba(14,30,70,.9)' : q === 3 ? '#1e4fae' : 'rgba(30,60,140,.35)'; g.fill(); });
        if (q === 3) { g.fillStyle = 'rgba(255,255,255,.04)'; for (var b = 0; b < 40; b++) g.fillRect(X(-20) + b * s, Y(-10), s * 0.5, 20 * s); }
        if (q >= 4) { var gr = g.createRadialGradient(cx, cy, 10, cx, cy, w * 0.6); gr.addColorStop(0, 'rgba(56,189,248,.18)'); gr.addColorStop(1, 'rgba(56,189,248,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); for (var gx = 0; gx < w; gx += s * 2) { g.fillStyle = 'rgba(148,197,255,.05)'; g.fillRect(gx, 0, 1, h); } for (var gy = 0; gy < h; gy += s * 2) { g.fillStyle = 'rgba(148,197,255,.05)'; g.fillRect(0, gy, w, 1); } }
        noise(g, w, h, 3000, q >= 3 ? 0.03 : 0.06, r);
      }
      // Linien
      var lc = q >= 4 ? '#7dd3fc' : q === 0 ? 'rgba(245,245,235,.8)' : '#f8fafc', lw = Math.max(2, s * 0.08);
      g.strokeStyle = lc; g.lineWidth = lw; if (q >= 4) { g.shadowColor = '#38bdf8'; g.shadowBlur = emis ? 14 : 6; }
      g.strokeRect(X(-20), Y(-10), 40 * s, 20 * s);
      g.beginPath(); g.moveTo(X(0), Y(-10)); g.lineTo(X(0), Y(10)); g.stroke();
      g.beginPath(); g.arc(X(0), Y(0), 2 * s, 0, 7); g.stroke();
      [-1, 1].forEach(function (sx, i) {
        zonePath(cg.z6[i]); g.stroke();
        g.setLineDash([s * 0.15 * 4, s * 0.15 * 3]); zonePath(cg.z9[i]); g.stroke(); g.setLineDash([]);
        g.beginPath(); g.moveTo(X(sx * 13), Y(-0.5)); g.lineTo(X(sx * 13), Y(0.5)); g.stroke();
        g.beginPath(); g.moveTo(X(sx * 16), Y(-0.08)); g.lineTo(X(sx * 16), Y(0.08)); g.stroke();
        g.beginPath(); g.moveTo(X(sx * 4.5), Y(-10.15)); g.lineTo(X(sx * 4.5), Y(-9.85)); g.stroke();
      });
      g.shadowBlur = 0;
      if (!emis && q >= 3) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '900 ' + Math.round(s * 1.1) + 'px -apple-system, Helvetica, Arial'; g.textAlign = 'center'; g.fillText('ANWURF!', X(0), Y(11.9)); }
    });
  }
  function windowTex(kind) {
    // Fassaden: 8×8 Felder; map = Tagesfarbe, emissive = beleuchtete Fenster am Abend
    var cfg = {
      office: { bg: '#2c4258', frame: '#a9b6c4', pane: '#4f7396', lit: 0.28, ww: 0.9, wh: 0.74 },
      hotel: { bg: '#d9cdb8', frame: '#cfc3ad', pane: '#3a4654', lit: 0.62, ww: 0.5, wh: 0.62 },
      clinic: { bg: '#eef1f4', frame: '#e3e7ec', pane: '#4b6a86', lit: 0.5, ww: 0.9, wh: 0.42 },
      brick: { bg: '#8a5a44', frame: '#7a4c38', pane: '#2f3a44', lit: 0.45, ww: 0.42, wh: 0.58 },
      concrete: { bg: '#b8b4ac', frame: '#aaa69e', pane: '#3b4652', lit: 0.4, ww: 0.55, wh: 0.55 },
      stadium: { bg: '#1f3347', frame: '#8796a6', pane: '#35546f', lit: 0.7, ww: 0.95, wh: 0.8 },
      sheet: { bg: '#c9ced4', frame: '#b8bec5', pane: '#4b5a68', lit: 0.0, ww: 0.0, wh: 0.0 },
      dark: { bg: '#1e2a44', frame: '#25324f', pane: '#3a4b66', lit: 0.0, ww: 0.0, wh: 0.0 },
      clad: { bg: '#9aa3ad', frame: '#8d96a0', pane: '#55606c', lit: 0.0, ww: 0.0, wh: 0.0 },
      stone: { bg: '#cdbfa8', frame: '#c4b59c', pane: '#3b4450', lit: 0.3, ww: 0.3, wh: 0.7 }
    }[kind];
    function draw(emis) {
      return function (g, w, h) {
        var n = 8, cw = w / n, ch = h / n, r = rng(hsh(kind));
        g.fillStyle = emis ? '#000' : cfg.bg; g.fillRect(0, 0, w, h);
        if (kind === 'stadium') {
          if (emis) { g.fillStyle = 'rgba(255,200,130,.85)'; g.fillRect(0, h * 0.62, w, h * 0.3); g.fillStyle = 'rgba(255,215,160,.45)'; g.fillRect(0, h * 0.18, w, h * 0.22); for (var fx = 0; fx < w; fx += 16) { g.fillStyle = '#000'; g.fillRect(fx, 0, 4, h); } }
          else { var gr2 = g.createLinearGradient(0, 0, 0, h); gr2.addColorStop(0, '#5d7896'); gr2.addColorStop(1, '#2a3d55'); g.fillStyle = gr2; g.fillRect(0, 0, w, h); for (var fx2 = 0; fx2 < w; fx2 += 16) { g.fillStyle = '#c9d1db'; g.fillRect(fx2, 0, 4, h); } g.fillStyle = '#c9d1db'; g.fillRect(0, h * 0.58, w, 5); g.fillRect(0, h * 0.14, w, 4); noise(g, w, h, 400, 0.05, r); }
          return;
        }
        if (kind === 'clad') { if (!emis) { for (var x = 0; x < w; x += 8) { g.fillStyle = x % 16 ? '#a8b0b9' : '#8f98a2'; g.fillRect(x, 0, 6, h); } noise(g, w, h, 600, 0.06, r); } return; }
        if (kind === 'sheet') { if (!emis) { for (var x1 = 0; x1 < w; x1 += 12) { g.fillStyle = '#cfd4da'; g.fillRect(x1, 0, 8, h); g.fillStyle = '#aeb5bd'; g.fillRect(x1 + 8, 0, 4, h); } noise(g, w, h, 500, 0.05, r); } return; }
        if (kind === 'dark') { if (!emis) { for (var x2 = 0; x2 < w; x2 += 16) { g.fillStyle = '#1f2c48'; g.fillRect(x2, 0, 14, h); g.fillStyle = '#2b3a5c'; g.fillRect(x2 + 14, 0, 2, h); } noise(g, w, h, 400, 0.05, r); } return; }
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
          var x0 = i * cw + cw * (1 - cfg.ww) / 2, y0 = j * ch + ch * (1 - cfg.wh) / 2, lit = r() < cfg.lit;
          if (emis) { if (lit) { g.fillStyle = r() < 0.8 ? 'rgba(255,205,140,' + (0.55 + r() * 0.45) + ')' : 'rgba(190,220,255,.7)'; g.fillRect(x0, y0, cw * cfg.ww, ch * cfg.wh); } }
          else { g.fillStyle = cfg.frame; g.fillRect(i * cw, j * ch, cw, 2); g.fillStyle = shade(cfg.pane, 0.85 + r() * 0.3); g.fillRect(x0, y0, cw * cfg.ww, ch * cfg.wh); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x0, y0, cw * cfg.ww * 0.4, ch * cfg.wh); }
        }
        if (!emis) noise(g, w, h, 500, 0.05, r);
      };
    }
    return { map: tex('win|' + kind, 256, 256, draw(false)), em: tex('wine|' + kind, 256, 256, draw(true)) };
  }
  function simpleTex(key, base, draw) { return tex(key, 256, 256, function (g, w, h) { g.fillStyle = base; g.fillRect(0, 0, w, h); draw(g, w, h, rng(hsh(key))); }); }
  function textTex(key, txt, bg, fg, w, h) { return tex(key, w || 512, h || 128, function (g, W, H) { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; var fs = Math.round(H * 0.56); g.font = '900 ' + fs + 'px -apple-system, Helvetica, Arial, sans-serif'; var tw = g.measureText(txt).width; if (tw > W * 0.92) { fs = Math.floor(fs * W * 0.92 / tw); g.font = '900 ' + fs + 'px -apple-system, Helvetica, Arial, sans-serif'; } g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, W / 2, H / 2 + 2); }); }
  function skyTex() {
    return tex('sky', 64, 512, function (g, w, h) {
      var gr = g.createLinearGradient(0, 0, 0, h);
      gr.addColorStop(0, '#0f1c38'); gr.addColorStop(0.32, '#2e4677'); gr.addColorStop(0.47, '#8a7fa0'); gr.addColorStop(0.53, '#f0a467'); gr.addColorStop(0.58, '#f7c48b'); gr.addColorStop(0.62, '#59607a'); gr.addColorStop(1, '#2a2e3a');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
  }

  // ---------- Materialien ----------
  var MATS = null;
  function mats(m) {
    var key = m.colors.join('|') + '|' + hq() + '|' + m.levels.rasen + '|' + m.flood.level;
    if (MATS && MATS._key === key) return MATS;
    var M = MATS = { _key: key }, std = function (o) { var x = new T.MeshStandardMaterial(o); x.side = T.DoubleSide; return x; };
    var w;
    M.concrete = std({ color: '#b4afa6', roughness: 0.92, map: simpleTex('concrete', '#b9b4ab', function (g, W, H, r) { noise(g, W, H, 3000, 0.1, r); g.fillStyle = 'rgba(0,0,0,.08)'; for (var y = 0; y < H; y += 32) g.fillRect(0, y, W, 1); }) });
    M.concreteDark = std({ color: '#77736d', roughness: 0.95 });
    M.steel = std({ color: '#d5dae1', metalness: 0.75, roughness: 0.32 });
    M.steelDark = std({ color: '#3d4552', metalness: 0.6, roughness: 0.45 });
    M.roof = std({ color: '#f1f3f5', roughness: 0.45, metalness: 0.1, map: simpleTex('roof', '#eef0f2', function (g, W, H, r) { g.fillStyle = 'rgba(80,90,100,.12)'; for (var x = 0; x < W; x += 16) g.fillRect(x, 0, 2, H); noise(g, W, H, 800, 0.05, r); }) });
    M.roofUnder = std({ color: '#5d6672', roughness: 0.7, metalness: 0.3 });
    M.roofClear = new T.MeshStandardMaterial({ color: '#dfe9f2', transparent: true, opacity: 0.38, roughness: 0.15, metalness: 0.2, side: T.DoubleSide, depthWrite: false });
    w = windowTex('stadium'); M.glassFacade = std({ color: '#ffffff', map: w.map, emissiveMap: w.em, emissive: '#ffd59a', emissiveIntensity: 1.1, metalness: 0.55, roughness: 0.18 });
    w = windowTex('clad'); M.clad = std({ color: '#ffffff', map: w.map, metalness: 0.55, roughness: 0.4 });
    w = windowTex('sheet'); M.sheet = std({ color: '#ffffff', map: w.map, metalness: 0.45, roughness: 0.45 });
    w = windowTex('dark'); M.darkClad = std({ color: '#ffffff', map: w.map, metalness: 0.5, roughness: 0.45 });
    M.foyerGlass = std({ color: '#9fb4c6', metalness: 0.6, roughness: 0.08, emissive: '#ffd39a', emissiveIntensity: 0.85 });
    M.ceiling = new T.MeshStandardMaterial({ color: '#1a2233', roughness: 0.9, side: T.FrontSide, transparent: true, opacity: 0.985 }); // nur von unten sichtbar
    M.hallFloor = std({ color: '#3a4250', roughness: 0.85 });
    M.netMat = new T.MeshStandardMaterial({ color: '#f1f5f9', transparent: true, opacity: 0.55, roughness: 0.9, side: T.DoubleSide, depthWrite: false });
    M.postRed = std({ color: '#dc2626', roughness: 0.4 });
    M.ledBlue = new T.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 1.6, side: T.DoubleSide });
    M.hvac = std({ color: '#9aa3ad', metalness: 0.5, roughness: 0.5 });
    M._noCast = { sheet: 1, clad: 1, darkClad: 1, glassFacade: 1, band: 1 }; // Hallenwände werfen keinen Schatten in den Innenraum
    M.vipGlass = std({ color: '#7d93a8', metalness: 0.8, roughness: 0.1, emissive: '#ffcf8f', emissiveIntensity: 0.55 });
    M.band = new T.MeshStandardMaterial({ color: m.colors[0], emissive: m.colors[0], emissiveIntensity: 1.4, side: T.DoubleSide });
    M.led = new T.MeshBasicMaterial({ map: textTex('led|' + m.colors.join(), 'ANWURF!  ·  ' + 'HEIMSIEG', m.colors[0], m.colors[1] === '#ffffff' ? '#ffffff' : m.colors[1], 1024, 64), side: T.DoubleSide });
    M.ads = std({ color: '#ffffff', roughness: 0.6, map: textTex('ads', 'STADTWERKE  ·  BRAUEREI  ·  AUTOHAUS', '#f8fafc', '#1e3a8a', 1024, 64) });
    M.screen = new T.MeshBasicMaterial({ color: '#ffffff', toneMapped: false, map: tex('screen|' + m.colors.join(), 512, 220, function (g, W, H) { var gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#0b1424'); gr.addColorStop(1, shade(m.colors[0], 0.6)); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#fff'; g.font = '900 96px -apple-system, Helvetica, Arial'; g.textAlign = 'center'; g.fillText('28 : 26', W / 2, H * 0.62); g.font = '700 30px -apple-system, Helvetica, Arial'; g.fillStyle = 'rgba(255,255,255,.8)'; g.fillText('HEIM  ·  GAST   59:48', W / 2, H * 0.88); }) });
    M.screen.side = T.DoubleSide;
    M.board = std({ color: '#1f2937', roughness: 0.6 });
    var q = m.levels.rasen;
    M.pitch = std({ map: courtTex(q), roughness: q >= 4 ? 0.12 : q >= 2 ? 0.45 : 0.75, metalness: q >= 4 ? 0.4 : 0, emissive: '#ffffff', emissiveMap: courtTex(q, true), emissiveIntensity: q >= 4 ? 1.2 : 0.25 + m.flood.level * 0.08 });
    M.ground = std({ color: '#ffffff', roughness: 1, map: (function () { var t = simpleTex('ground', '#3e5a30', function (g, W, H, r) { for (var i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,50,20,.18)' : 'rgba(120,140,70,.15)'; g.fillRect(r() * W, r() * H, 3, 3); } }); t.repeat.set(1, 1); return t; })() });
    M.asphalt = std({ color: '#ffffff', roughness: 0.9, map: simpleTex('asphalt', '#3d4046', function (g, W, H, r) { noise(g, W, H, 4000, 0.12, r); g.fillStyle = '#e5e7eb'; for (var y = 0; y < H; y += 64) g.fillRect(W / 2 - 3, y, 6, 34); g.fillRect(8, 0, 4, H); g.fillRect(W - 12, 0, 4, H); }) });
    M.paving = std({ color: '#ffffff', roughness: 0.85, map: simpleTex('paving', '#8a857d', function (g, W, H, r) { for (var y = 0; y < H; y += 16) for (var x = 0; x < W; x += 16) { g.fillStyle = shade('#8c867d', 0.88 + r() * 0.2); g.fillRect(x + 1, y + 1, 14, 14); } }) });
    M.lot = std({ color: '#ffffff', roughness: 0.9, map: simpleTex('lot', '#45484e', function (g, W, H, r) { noise(g, W, H, 3000, 0.1, r); g.fillStyle = '#d1d5db'; for (var x = 0; x <= W; x += 32) { g.fillRect(x, 0, 2, 96); g.fillRect(x, H - 96, 2, 96); } }) });
    M.gravel = std({ color: '#ffffff', roughness: 1, map: simpleTex('gravel', '#8d7f69', function (g, W, H, r) { noise(g, W, H, 9000, 0.25, r); }) });
    M.water = std({ color: '#2d5571', metalness: 0.7, roughness: 0.12 });
    M.trainingGrass = std({ color: '#ffffff', roughness: 0.95, map: tex('tgrass', 512, 352, function (g, W, H) { g.fillStyle = '#3f8a3d'; g.fillRect(0, 0, W, H); for (var i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#3a7f39' : '#449243'; g.fillRect(i * W / 12, 0, W / 12 + 1, H); } g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; g.strokeRect(10, 10, W - 20, H - 20); g.beginPath(); g.moveTo(W / 2, 10); g.lineTo(W / 2, H - 10); g.stroke(); g.beginPath(); g.arc(W / 2, H / 2, 40, 0, 7); g.stroke(); g.strokeRect(10, H / 2 - 70, 70, 140); g.strokeRect(W - 80, H / 2 - 70, 70, 140); }) });
    M.track = std({ color: '#a8432f', roughness: 0.9 });
    M.turf = std({ color: '#86b8a0', roughness: 0.9, map: M.trainingGrass.map });
    M.crossRed = std({ color: '#d31f2a', roughness: 0.5, emissive: '#b91c1c', emissiveIntensity: 0.35 });
    M.lawnDark = std({ color: '#3d6b2f', roughness: 1 });
    M.heli = std({ roughness: 0.8, map: tex('heli', 128, 128, function (g, W, H) { g.fillStyle = '#2b3036'; g.fillRect(0, 0, W, H); g.strokeStyle = '#facc15'; g.lineWidth = 6; g.beginPath(); g.arc(W / 2, H / 2, 50, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.font = '900 64px Helvetica'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', W / 2, H / 2 + 3); }) });
    M.lawn = std({ color: '#ffffff', roughness: 1, map: simpleTex('lawn', '#47703a', function (g, W, H, r) { for (var i = 0; i < 3000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(25,45,18,.2)' : 'rgba(140,170,80,.14)'; g.fillRect(r() * W, r() * H, 2, 2); } }) });
    M.white = std({ color: '#f8fafc', roughness: 0.5 });
    M.clubCol = std({ color: m.colors[0], roughness: 0.5 });
    M.clubAlt = std({ color: m.colors[1], roughness: 0.5 });
    M.site = new T.MeshStandardMaterial({ color: '#f59e0b', transparent: true, opacity: 0.38, roughness: 0.6, side: T.DoubleSide, depthWrite: false });
    M.crane = std({ color: '#f5b301', metalness: 0.3, roughness: 0.5 });
    M.hl = new T.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.32, side: T.DoubleSide, depthWrite: false });
    M.solar = std({ color: '#1e3a8a', metalness: 0.85, roughness: 0.18 });
    M.rail = std({ color: '#5b5048', roughness: 0.9 });
    M.tent = std({ color: m.colors[0], roughness: 0.7 });
    ['office', 'hotel', 'clinic', 'brick', 'concrete', 'stone'].forEach(function (k) { var t = windowTex(k); M['f_' + k] = std({ color: '#ffffff', map: t.map, emissiveMap: t.em, emissive: '#ffd59a', emissiveIntensity: k === 'office' ? 1.0 : 0.9, metalness: k === 'office' ? 0.5 : 0.05, roughness: k === 'office' ? 0.2 : 0.8 }); });
    M.roofTop = std({ color: '#55595f', roughness: 0.9 });
    M.roofTile = std({ color: '#9b4a33', roughness: 0.85 });
    M.glassWarm = std({ color: '#8fa6b8', metalness: 0.7, roughness: 0.08, emissive: '#ffc77a', emissiveIntensity: 0.9 });
    M.glow = new T.SpriteMaterial({ map: tex('glow', 128, 128, function (g, W, H) { var gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2); gr.addColorStop(0, 'rgba(255,255,245,1)'); gr.addColorStop(0.25, 'rgba(255,250,225,.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }), blending: T.AdditiveBlending, depthWrite: false, transparent: true });
    M.lamp = new T.MeshBasicMaterial({ color: '#fffbea' });
    return M;
  }
  function seatMat(m, type, guest, busy) {
    var dens = Math.round((busy ? 0 : m.attendance) * 4) / 4, k = 'sm|' + type + '|' + guest + '|' + busy + '|' + dens + '|' + m.colors.join();
    MATS[k] = MATS[k] || new T.MeshStandardMaterial({ map: seatTex(type, m.colors[0], busy ? 0 : Math.min(0.95, dens), guest, m.colors[1]), roughness: 0.85, side: T.DoubleSide, color: busy ? '#9ca3af' : '#ffffff' });
    return MATS[k];
  }

  // ---------- Geometrie-Sammler (fasst alles je Material zu einem Mesh zusammen) ----------
  function Builder() { this.g = {}; }
  Builder.prototype.buf = function (k) { return this.g[k] || (this.g[k] = { p: [], uv: [] }); };
  Builder.prototype.tri = function (k, a, b, c, ua, ub, uc) { var B = this.buf(k); B.p.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); B.uv.push(ua[0], ua[1], ub[0], ub[1], uc[0], uc[1]); };
  Builder.prototype.quad = function (k, a, b, c, d, uv) { uv = uv || [[0, 0], [1, 0], [1, 1], [0, 1]]; this.tri(k, a, b, c, uv[0], uv[1], uv[2]); this.tri(k, a, c, d, uv[0], uv[2], uv[3]); };
  // Quader: Mitte (x,z), Grundfläche w×d, ab Höhe y0, Höhe h, Drehung rot (Grad); tile = Texturfeld in Metern
  Builder.prototype.box = function (k, x, z, w, d, y0, h, rot, o) {
    o = o || {}; var c = Math.cos((rot || 0) * DEG), s = Math.sin((rot || 0) * DEG), tw = o.tw || 32, th = o.th || 28.8;
    function P(dx, dz, y) { return [x + dx * c - dz * s, y, z + dx * s + dz * c]; }
    var hw = w / 2, hd = d / 2, y1 = y0 + h;
    var c0 = [P(-hw, -hd, y0), P(hw, -hd, y0), P(hw, hd, y0), P(-hw, hd, y0)], c1 = [P(-hw, -hd, y1), P(hw, -hd, y1), P(hw, hd, y1), P(-hw, hd, y1)];
    var side = [[0, 1, w], [1, 2, d], [2, 3, w], [3, 0, d]];
    for (var i = 0; i < 4; i++) { var a = side[i][0], b = side[i][1], L = side[i][2] / tw, H = h / th, v0 = (o.v0 || 0); this.quad(o.side || k, c0[a], c0[b], c1[b], c1[a], [[0, v0], [L, v0], [L, v0 + H], [0, v0 + H]]); }
    if (o.top !== false) this.quad(o.topKey || k, c1[0], c1[1], c1[2], c1[3], [[0, 0], [w / 16, 0], [w / 16, d / 16], [0, d / 16]]);
  };
  // Prisma mit Satteldach
  Builder.prototype.gable = function (k, x, z, w, d, y0, h, rot) {
    var c = Math.cos((rot || 0) * DEG), s = Math.sin((rot || 0) * DEG);
    function P(dx, dz, y) { return [x + dx * c - dz * s, y, z + dx * s + dz * c]; }
    var hw = w / 2, hd = d / 2, y1 = y0 + h;
    this.quad(k, P(-hw, -hd, y0), P(hw, -hd, y0), P(hw, 0, y1), P(-hw, 0, y1)); this.quad(k, P(-hw, hd, y0), P(hw, hd, y0), P(hw, 0, y1), P(-hw, 0, y1));
    this.tri(k, P(-hw, -hd, y0), P(-hw, hd, y0), P(-hw, 0, y1), [0, 0], [1, 0], [0.5, 1]); this.tri(k, P(hw, -hd, y0), P(hw, hd, y0), P(hw, 0, y1), [0, 0], [1, 0], [0.5, 1]);
  };
  Builder.prototype.flush = function (group, M, shadows) {
    var self = this;
    Object.keys(this.g).forEach(function (k) {
      var B = self.g[k]; if (!B.p.length) return;
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(B.p, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(B.uv, 2)); geo.computeVertexNormals();
      var mat = typeof k === 'string' && M[k] ? M[k] : M._dyn[k];
      var mesh = new T.Mesh(geo, mat); mesh.castShadow = shadows && !mat.transparent && !(M._noCast && M._noCast[k]); mesh.receiveShadow = shadows; group.add(mesh);
    });
    this.g = {};
  };
  function P3(p, y) { return [p[0], y, p[1]]; }
  function lenAlong(line) { var L = [0]; for (var i = 1; i < line.length; i++) L.push(L[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])); return L; }
  // Fläche zwischen zwei gleich langen Polylinien (Ränge, Dächer)
  function strip(B, k, inner, outer, hIn, hOut, tu, tv) {
    var Li = lenAlong(inner), depth = Math.hypot(outer[0][0] - inner[0][0], outer[0][1] - inner[0][1]);
    for (var i = 0; i < inner.length - 1; i++) {
      var u0 = Li[i] / tu, u1 = Li[i + 1] / tu, v1 = depth / tv;
      B.quad(k, P3(inner[i], hIn), P3(inner[i + 1], hIn), P3(outer[i + 1], hOut), P3(outer[i], hOut), [[u0, 0], [u1, 0], [u1, v1], [u0, v1]]);
    }
  }
  function wall(B, k, line, y0, y1, tu, tv, off) {
    var L = lenAlong(line);
    for (var i = 0; i < line.length - 1; i++) {
      var a = line[i], b = line[i + 1];
      if (off) { a = push(a, off); b = push(b, off); }
      B.quad(k, P3(a, y0), P3(b, y0), P3(b, y1), P3(a, y1), [[L[i] / tu, y0 / tv], [L[i + 1] / tu, y0 / tv], [L[i + 1] / tu, y1 / tv], [L[i] / tu, y1 / tv]]);
    }
  }
  function push(p, off) { var l = Math.hypot(p[0], p[1]) || 1; return [p[0] + p[0] / l * off, p[1] + p[1] / l * off]; }

  // ---------- Stadion aus der Bauteilliste ----------
  function buildStadium(group, m, M, o) {
    var B = new Builder(), sh = hq() && !o.noShadow; M._dyn = M._dyn || {};
    var hl = o.highlight || [];
    m.parts.forEach(function (p) {
      if (p.kind === 'tier') {
        var sk = 'seat|' + p.type + '|' + (p.guest ? 1 : 0) + '|' + (p.busy ? 1 : 0);
        M._dyn[sk] = seatMat(m, p.type, p.guest, p.busy);
        strip(B, sk, p.inner, p.outer, p.hIn, p.hOut, 16, 12);
        wall(B, 'concrete', p.inner, 0, p.hIn, 8, 8, -0.15);                // Vorderkante/Brüstung
        wall(B, 'concreteDark', p.outer, 0, p.hOut, 8, 8);                  // Rückwand (innen verdeckt)
        [[p.inner[0], p.outer[0]], [p.inner[p.inner.length - 1], p.outer[p.outer.length - 1]]].forEach(function (e) {
          B.quad('concrete', P3(e[0], 0), P3(e[0], p.hIn), P3(e[1], p.hOut), P3(e[1], 0), [[0, 0], [0, p.hIn / 8], [1.4, p.hOut / 8], [1.4, 0]]);
        });
        if (hl.indexOf(p.sec) >= 0) strip(B, 'hl', p.inner.map(function (q) { return q; }), p.outer, p.hIn + 0.4, p.hOut + 0.4, 16, 12);
      } else if (p.kind === 'fascia') {
        wall(B, p.vip ? 'vipGlass' : 'concrete', p.line, p.hBot, p.hTop, 8, 3.2, -0.25);
        if (p.vip) wall(B, 'band', p.line, p.hTop - 0.35, p.hTop, 8, 1, -0.3);
      } else if (p.kind === 'back') {
        var fk = p.style === 'inner' ? 'concreteDark' : p.style === 'glass' ? 'glassFacade' : p.style === 'clad' ? 'clad' : 'concrete';
        wall(B, fk, p.line, 0, p.h, p.style === 'glass' ? 20 : 16, p.style === 'glass' ? Math.max(8, p.h) : 12, 0.3);
        if (p.style === 'glass') wall(B, 'band', p.line, p.h - 1.4, p.h - 0.6, 8, 1, 0.45);
        if (p.style === 'open') { // sichtbare Stahlstützen
          var L = lenAlong(p.line), tot = L[L.length - 1];
          for (var u = 4; u < tot; u += 10) { var q = along(p.line, L, u); B.box('steelDark', q[0], q[1], 0.6, 0.6, 0, p.h, 0, { top: false }); }
        }
      } else if (p.kind === 'roof') {
        var h = p.h, front = p.inner, back = p.outer;
        // hinterer Teil Membran (opak), vorderer Teil lichtdurchlässig (Polycarbonat) – Ränge bleiben sichtbar
        var midF = front.map(function (q, i) { return [q[0] + (back[i][0] - q[0]) * 0.42, q[1] + (back[i][1] - q[1]) * 0.42]; }), hm = h + 1.6 - 1.6 * 0.42;
        strip(B, 'roof', midF, back, hm, h, 16, 16);
        strip(B, 'roofUnder', midF, back, hm - 1.2, h - 1.0, 16, 16);
        strip(B, 'roofClear', front, midF, h + 1.6, hm, 16, 16);
        wall(B, p.led || p.modern ? 'band' : 'steel', front, h + 0.4, h + 1.6, 8, 1);
        wall(B, 'steel', back, h - 1.0, h, 8, 1);
        // Stützen an der Rückseite, Fachwerkträger auf dem Dach
        var Lb = lenAlong(back), tb = Lb[Lb.length - 1], Lf = lenAlong(front), tf = Lf[Lf.length - 1];
        for (var u2 = 3; u2 < tb; u2 += 14) { var q2 = along(back, Lb, u2); B.box('steel', q2[0], q2[1], 0.9, 0.9, 0, h, 0, { top: false }); }
        for (var f = 0.04; f < 1; f += 8 / Math.max(8, tb)) {
          var a = along(front, Lf, f * tf), b = along(back, Lb, f * tb);
          beam(B, 'steel', [a[0], h + 1.7, a[1]], [b[0], h + 0.15, b[1]], 0.45);
        }
        if (p.led) for (var u3 = 6; u3 < tf; u3 += 18) { var q3 = along(front, Lf, u3); o.lamps.push([q3[0], h - 0.2, q3[1], 9]); }
      } else if (p.kind === 'site') {
        strip(B, 'site', p.inner, p.outer, p.hIn + 0.2, p.hOut + 0.2, 16, 12);
        wall(B, 'site', p.outer, 0, p.hOut + 0.2, 8, 8, 0.4);
        var c = SM.centroid(p.outer), dir = Math.atan2(c[1], c[0]);
        var cx = c[0] + Math.cos(dir) * 10, cz = c[1] + Math.sin(dir) * 10, ch = Math.max(30, p.hOut + 22);
        B.box('crane', cx, cz, 1.8, 1.8, 0, ch, 0, {});
        beam(B, 'crane', [cx + Math.cos(dir) * 12, ch, cz + Math.sin(dir) * 12], [cx - Math.cos(dir) * 34, ch, cz - Math.sin(dir) * 34], 1.1);
        B.box('concreteDark', cx + Math.cos(dir) * 9, cz + Math.sin(dir) * 9, 3, 3, ch - 2, 2, dir / DEG, {});
      } else if (p.kind === 'mast') {
        var mh = p.h, isPole = p.type === 'pole';
        B.box('steel', p.x, p.y, isPole ? 0.5 : 1.3, isPole ? 0.5 : 1.3, 0, mh, 0, { top: false });
        var ang = Math.atan2(-p.y, -p.x) / DEG, hx = p.x + Math.cos(ang * DEG) * 1.5, hz = p.y + Math.sin(ang * DEG) * 1.5;
        B.box('steelDark', hx, hz, isPole ? 1.4 : 2.2, isPole ? 3 : 9, mh - (isPole ? 1.5 : 5), isPole ? 1.6 : 5, ang, {});
        B.box('lamp', hx + Math.cos(ang * DEG) * 1.2, hz + Math.sin(ang * DEG) * 1.2, 0.2, isPole ? 2.6 : 8.4, mh - (isPole ? 1.3 : 4.6), isPole ? 1.2 : 4.2, ang, { top: false });
        o.lamps.push([hx + Math.cos(ang * DEG) * 2, mh - (isPole ? 0.7 : 2.5), hz + Math.sin(ang * DEG) * 2, isPole ? 10 : 26]);
      } else if (p.kind === 'screen') {
        if (p.cube) { // Videowürfel unter dem Hallendach: vier Bildschirme, Rahmen, Abhängung
          var cz = p.z, cw = p.w, chh = p.hgt;
          B.box('steelDark', 0, 0, cw + 0.4, cw + 0.4, cz - 0.3, chh + 0.6, 0, {});
          [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) {
            var o2 = cw / 2 + 0.22;
            if (d[1]) B.quad('screen', [-cw / 2 * d[1], cz, o2 * d[1]], [cw / 2 * d[1], cz, o2 * d[1]], [cw / 2 * d[1], cz + chh, o2 * d[1]], [-cw / 2 * d[1], cz + chh, o2 * d[1]]);
            else B.quad('screen', [o2 * d[0], cz, cw / 2 * d[0]], [o2 * d[0], cz, -cw / 2 * d[0]], [o2 * d[0], cz + chh, -cw / 2 * d[0]], [o2 * d[0], cz + chh, cw / 2 * d[0]]);
          });
          B.box('ledBlue', 0, 0, cw + 0.5, cw + 0.5, cz - 0.45, 0.18, 0, {});
          [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) { B.box('steelDark', q[0] * cw / 2.4, q[1] * cw / 2.4, 0.12, 0.12, cz + chh + 0.3, m.roofH - cz - chh - 0.3, 0, { top: false }); });
        } else {
          B.box('steelDark', p.x, p.y, 0.5, p.w + 0.5, p.z - 0.25, p.hgt + 0.5, 0, {});
          var fx = p.x + 0.3;
          B.quad(p.live ? 'screen' : 'board', [fx, p.z, p.y + p.w / 2], [fx, p.z, p.y - p.w / 2], [fx, p.z + p.hgt, p.y - p.w / 2], [fx, p.z + p.hgt, p.y + p.w / 2]);
        }
      } else if (p.kind === 'boards') {
        var bx = p.x, by = p.y, k = p.led ? 'led' : 'ads';
        [[[-bx, by], [bx, by]], [[-bx, by], [-bx, -by + 4]], [[bx, -by + 4], [bx, by]]].forEach(function (s) {
          var len = Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]);
          B.quad(k, P3(s[0], 0.05), P3(s[1], 0.05), P3(s[1], p.h), P3(s[0], p.h), [[0, 0], [len / 30, 0], [len / 30, 1], [0, 1]]);
        });
      } else if (p.kind === 'bench') { // Auswechselbänke und Kampfgericht
        [-8.5, 8.5].forEach(function (bx2) { B.box('steelDark', bx2, p.y - 0.6, 7, 0.6, 0, 0.5, 0, {}); B.box('clubCol', bx2, p.y - 0.85, 7, 0.15, 0.5, 0.6, 0, {}); });
        B.box('white', 0, p.y - 0.7, 3.4, 0.9, 0, 0.8, 0, {}); B.box('led', 0, p.y - 0.24, 3.4, 0.04, 0.05, 0.75, 0, { top: false });
      } else if (p.kind === 'pitch') {
        var G0 = SM.GEO;
        B.quad('pitch', [-G0.Ix, 0.06, -G0.Iy], [G0.Ix, 0.06, -G0.Iy], [G0.Ix, 0.06, G0.Iy], [-G0.Ix, 0.06, G0.Iy], [[0, 1], [1, 1], [1, 0], [0, 0]]);
        [-1, 1].forEach(function (sx) { // Handballtore 3 × 2 m, rot-weiß, mit Netz
          var gx = sx * 20;
          for (var sy = -1; sy <= 1; sy += 2) for (var sg = 0; sg < 5; sg++) B.box(sg % 2 ? 'white' : 'postRed', gx + sx * 0.04, sy * 1.54, 0.08, 0.08, sg * 0.4, 0.4, 0, { top: sg === 4 });
          for (var sg2 = 0; sg2 < 8; sg2++) B.box(sg2 % 2 ? 'white' : 'postRed', gx + sx * 0.04, -1.5 + sg2 * 0.375 + 0.1875, 0.08, 0.375, 1.96, 0.08, 0, {});
          var bx3 = gx + sx * 1.0;
          B.quad('netMat', [gx, 2, -1.5], [bx3, 1.2, -1.5], [bx3, 1.2, 1.5], [gx, 2, 1.5]);
          B.quad('netMat', [bx3, 0, -1.5], [bx3, 1.2, -1.5], [bx3, 1.2, 1.5], [bx3, 0, 1.5]);
          [-1.5, 1.5].forEach(function (zz) { B.quad('netMat', [gx, 0, zz], [bx3, 0, zz], [bx3, 1.2, zz], [gx, 2, zz]); });
        });
      } else if (p.kind === 'hall') {
        buildHallShell(B, p, m, o);
      } else if (p.kind === 'trusses' && !o.noRoof) {
        var th = p.h;
        p.xs.forEach(function (x0) { // Fachwerkträger quer über die Halle (Nord–Süd)
          beam(B, 'steel', [x0, th - 0.25, -p.y], [x0, th - 0.25, p.y], 0.35);
          beam(B, 'steel', [x0, th - 2.0, -p.y + 1.5], [x0, th - 2.0, p.y - 1.5], 0.28);
          for (var zz2 = -p.y + 1.5; zz2 < p.y - 1.5; zz2 += 3) beam(B, 'steel', [x0, th - 2.0, zz2], [x0, th - 0.3, zz2 + 1.5], 0.12);
          if (p.light) for (var lz = -10; lz <= 10; lz += p.light >= 2 ? 5 : 10) { B.box('lamp', x0, lz, 1.0, 1.0, th - 2.5, 0.25, 0, {}); if (Math.abs(x0) < 26) o.lamps.push([x0, th - 2.6, lz, p.light >= 3 ? 5 : 3.5]); }
        });
        beam(B, 'steel', [-p.xs[p.xs.length - 1] - 3, th - 0.25, 0], [p.xs[p.xs.length - 1] + 3, th - 0.25, 0], 0.3);
        if (p.led) [-1, 1].forEach(function (sy) { B.box('ledBlue', 0, sy * (p.y - 2), 2 * Math.abs(p.xs[0]) + 4, 0.12, th - 2.2, 0.12, 0, {}); });
      }
    });
    // Innenraum: Hallenboden zwischen Spielfeld und Tribünen, Umlauf
    var hb0 = m.hall;
    B.quad('hallFloor', [-hb0.x, 0.03, -hb0.y], [hb0.x, 0.03, -hb0.y], [hb0.x, 0.03, hb0.y], [-hb0.x, 0.03, hb0.y], [[0, 0], [6, 0], [6, 4], [0, 4]]);
    B.flush(group, M, sh);
    // Spieler (7 gegen 7) und zwei Schiedsrichter
    var r = rng(hsh(m.club)), pg = new T.CapsuleGeometry(0.24, 1.3, 2, 6), pls = new T.InstancedMesh(pg, new T.MeshStandardMaterial({ roughness: 0.6 }), 16), mm = new T.Matrix4(), col = new T.Color();
    // Heim greift das Westtor an: Außen, Rückraum, Kreis; Gäste in 6:0-Abwehr; Torhüter
    var att = [[-13.5, -8.5], [-11.5, -4.5], [-10.5, 0.5], [-11.8, 5], [-13.8, 8.6], [-15.2, 1.6], [17.5, 0]];
    var def = [[-14.2, -7], [-14.6, -3.8], [-14.8, -1.2], [-14.7, 1.4], [-14.5, 4.2], [-14.1, 7], [-19.3, 0]];
    for (var i = 0; i < 16; i++) {
      var home = i < 7, f = home ? att[i] : i < 14 ? def[i - 7] : null, x, z;
      if (f) { x = f[0] + (r() - 0.5) * 0.8; z = f[1] + (r() - 0.5) * 0.8; } else { x = i === 14 ? -6 : -16; z = i === 14 ? 9.6 : -10.6; }
      mm.makeTranslation(x, 0.95, z); pls.setMatrixAt(i, mm);
      pls.setColorAt(i, col.set(i >= 14 ? '#111827' : i === 6 ? '#facc15' : i === 13 ? '#22c55e' : home ? m.colors[0] : '#e5e7eb'));
    }
    pls.castShadow = sh; group.add(pls);
    // Flutlicht-Leuchten (Glühen) und Pitch-Ausleuchtung
    o.lamps.forEach(function (l) { var s = new T.Sprite(M.glow); s.position.set(l[0], l[1], l[2]); s.scale.set(l[3], l[3], 1); group.add(s); });
    return { top: Math.max(m.roofH, m.areas.N.top, m.areas.S.top, m.areas.W.top, m.areas.E.top) };
  }
  // Hallenhülle: Fassade je Stufe, Dachhaut (nur von unten sichtbar), Attika, Foyer mit Glas, Technikanbau mit Lüftung
  function buildHallShell(B, p, m, o) {
    var H = p.h, out = p.outline.concat([p.outline[0]]), fk = { sheet: 'sheet', clad: 'clad', dark: 'darkClad', glass: 'darkClad' }[p.facade] || 'clad';
    for (var i = 0; i < out.length - 1; i++) {
      var a = out[i], b = out[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var south = a[1] === p.y && b[1] === p.y, glassBand = p.stage >= 4 ? 0.55 : p.stage >= 2 ? 0.28 : 0;
      var gTop = glassBand ? H * glassBand : 0;
      if (glassBand) B.quad('glassFacade', P3(a, 0), P3(b, 0), P3(b, gTop), P3(a, gTop), [[0, 0], [len / 20, 0], [len / 20, gTop / 8], [0, gTop / 8]]);
      B.quad(fk, P3(a, gTop), P3(b, gTop), P3(b, H + 0.9), P3(a, H + 0.9), [[0, gTop / 12], [len / 16, gTop / 12], [len / 16, (H + 0.9) / 12], [0, (H + 0.9) / 12]]);
      if (p.stage >= 5) B.quad('band', P3(a, H + 0.2), P3(b, H + 0.2), P3(b, H + 0.6), P3(a, H + 0.6)); // LED-Lichtband
      if (p.stage >= 4) B.quad('band', P3(a, gTop), P3(b, gTop), P3(b, gTop + 0.35), P3(a, gTop + 0.35));
      if (!south && p.stage <= 3) for (var u = 3; u < len - 2; u += 6) { var t2 = u / len, wx = a[0] + (b[0] - a[0]) * t2, wz = a[1] + (b[1] - a[1]) * t2; B.box('glassWarm', wx, wz, Math.abs(b[0] - a[0]) > 0.1 ? 3.6 : 0.2, Math.abs(b[0] - a[0]) > 0.1 ? 0.2 : 3.6, H - 3.2, 1.6, 0, {}); }
    }
    // Dachhaut als Decke (Front zeigt nach unten → von oben unsichtbar = Schnittansicht) und Attika-Kante oben
    var c = p.outline, ctr = [0, 0];
    if (!o.noRoof) for (var k = 0; k < c.length; k++) { var n = c[(k + 1) % c.length]; B.tri('ceiling', [ctr[0], H, ctr[1]], [c[k][0], H, c[k][1]], [n[0], H, n[1]], [0, 0], [1, 0], [0, 1]); }
    for (var k = 0; k < c.length; k++) { var a2 = c[k], b2 = c[(k + 1) % c.length], ia = [a2[0] * 0.985, a2[1] * 0.985], ib = [b2[0] * 0.985, b2[1] * 0.985]; B.quad('steelDark', P3(a2, H + 0.9), P3(b2, H + 0.9), P3(ib, H + 0.9), P3(ia, H + 0.9)); }
    // Foyer (Süden) mit Vordach und Schriftzug
    var fw = p.x * 1.24, fd = p.foyer, fh = p.foyerH;
    B.box(p.stage >= 2 ? 'glassFacade' : 'glassWarm', 0, p.y + fd / 2, fw, fd, 0, fh, 0, { topKey: 'roofTop', tw: 20, th: fh });
    B.box('steelDark', 0, p.y + fd + 2, Math.min(fw, 16), 4.5, fh * 0.62, 0.35, 0, {});
    var nm = String(p.name || 'Sporthalle').toUpperCase(), sw = Math.min(2 * p.x - 6, Math.max(12, nm.length * 1.25)), shh = Math.min(3.2, sw / 4.5);
    sign(B, 'sgHall|' + nm + '|' + m.colors.join(), nm, '#0b1424', '#f8fafc', 0, p.y + 0.3, Math.min(H - shh - 0.8, Math.max(fh + 1.2, H * 0.6)), sw, shh, 0);
    MATS._dyn['sgClub|' + m.colors.join()] = MATS._dyn['sgClub|' + m.colors.join()] || new T.MeshStandardMaterial({ color: m.colors[0], emissive: m.colors[0], emissiveIntensity: 0.7, side: T.DoubleSide });
    B.box('sgClub|' + m.colors.join(), -p.x * 0.75, p.y + 0.4, 3.2, 0.3, H * 0.5, 3.6, 0, {});
    // Technikanbau (Norden) mit Lüftungsgeräten je Stufe „Klima & Lüftung“
    var an = p.annex;
    B.box('concrete', 0, -p.y - an.d / 2, 2 * an.w, an.d, 0, an.h, 0, { topKey: 'roofTop' });
    for (var hv = 0; hv <= p.hvac; hv++) { B.box('hvac', -an.w + 5 + hv * 7, -p.y - an.d / 2, 4.5, 3, an.h, 1.8, 0, {}); }
    if (p.hvac >= 2) beam(B, 'hvac', [-an.w + 5, an.h + 1.2, -p.y - an.d / 2], [-an.w + 5, H - 1.5, -p.y + 0.2], 0.9);
  }
  function G() { return SM.GEO; }
  function along(line, L, u) { for (var i = 1; i < line.length; i++) if (L[i] >= u || i === line.length - 1) { var t = (u - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); t = Math.max(0, Math.min(1, t)); return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t]; } return line[0]; }
  // Balken zwischen zwei Punkten (rechteckiger Querschnitt)
  function beam(B, k, a, b, t) {
    var dx = b[0] - a[0], dz = b[2] - a[2], L = Math.hypot(dx, dz) || 1, nx = -dz / L * t / 2, nz = dx / L * t / 2;
    B.quad(k, [a[0] + nx, a[1], a[2] + nz], [b[0] + nx, b[1], b[2] + nz], [b[0] + nx, b[1] + t, b[2] + nz], [a[0] + nx, a[1] + t, a[2] + nz]);
    B.quad(k, [a[0] - nx, a[1], a[2] - nz], [b[0] - nx, b[1], b[2] - nz], [b[0] - nx, b[1] + t, b[2] - nz], [a[0] - nx, a[1] + t, a[2] - nz]);
    B.quad(k, [a[0] + nx, a[1] + t, a[2] + nz], [b[0] + nx, b[1] + t, b[2] + nz], [b[0] - nx, b[1] + t, b[2] - nz], [a[0] - nx, a[1] + t, a[2] - nz]);
  }

  // ---------- Instanzen: Bäume, Autos, Menschen ----------
  function Inst() { this.trees = []; this.cars = []; this.people = []; this.panels = []; this.parasols = []; }
  function flushInst(group, I, m, sh) {
    var mm = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), pos = new T.Vector3(), col = new T.Color(), up = new T.Vector3(0, 1, 0);
    function mk(geo, mat, list, fn) {
      if (!list.length) return; var im = new T.InstancedMesh(geo, mat, list.length);
      list.forEach(function (it, i) { fn(it, i); im.setMatrixAt(i, mm); if (it.c) im.setColorAt(i, col.set(it.c)); });
      im.castShadow = sh; im.receiveShadow = sh; group.add(im);
    }
    var crown = new T.IcosahedronGeometry(1, 1), trunk = new T.CylinderGeometry(0.25, 0.35, 1, 5);
    mk(crown, new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), I.trees, function (t) { q.setFromAxisAngle(up, t.a || 0); mm.compose(pos.set(t.x, t.h * 0.62, t.z), q, sc.set(t.r, t.h * 0.45, t.r)); });
    mk(trunk, new T.MeshStandardMaterial({ color: '#5a4636', roughness: 1 }), I.trees, function (t) { mm.compose(pos.set(t.x, t.h * 0.2, t.z), q.identity(), sc.set(1, t.h * 0.4, 1)); });
    var carG = new T.BoxGeometry(4.4, 1.35, 1.85); carG.translate(0, 0.75, 0);
    mk(carG, new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.6 }), I.cars, function (c) { q.setFromAxisAngle(up, c.a); mm.compose(pos.set(c.x, c.y || 0, c.z), q, sc.set(c.l || 1, 1, 1)); });
    var cabG = new T.BoxGeometry(2.3, 0.6, 1.65); cabG.translate(-0.2, 1.7, 0);
    mk(cabG, new T.MeshStandardMaterial({ color: '#1f2937', roughness: 0.15, metalness: 0.8 }), I.cars.filter(function (c) { return !c.l; }), function (c) { q.setFromAxisAngle(up, c.a); mm.compose(pos.set(c.x, c.y || 0, c.z), q, sc.set(1, 1, 1)); });
    var pG = new T.CylinderGeometry(0.28, 0.32, 1.7, 5); pG.translate(0, 0.85, 0);
    mk(pG, new T.MeshStandardMaterial({ roughness: 0.8 }), I.people, function (p) { mm.compose(pos.set(p.x, p.y || 0, p.z), q.identity(), sc.set(1, 1, 1)); });
    var sG = new T.BoxGeometry(1, 0.12, 1);
    mk(sG, MATS.solar, I.panels, function (p) { q.setFromAxisAngle(new T.Vector3(1, 0, 0), -0.45); mm.compose(pos.set(p.x, p.y || 1.2, p.z), q, sc.set(p.w, 1, p.d)); });
    var umb = new T.ConeGeometry(1.6, 0.8, 8); umb.translate(0, 2.4, 0);
    mk(umb, new T.MeshStandardMaterial({ roughness: 0.8 }), I.parasols, function (p) { mm.compose(pos.set(p.x, p.y || 0, p.z), q.identity(), sc.set(1, 1, 1)); });
  }
  function treeAt(I, r, x, z, k) { I.trees.push({ x: x, z: z, h: (7 + r() * 6) * (k || 1), r: (2.6 + r() * 1.6) * (k || 1), a: r() * 6, c: ['#2f5a2a', '#3b6b30', '#2c5230', '#4a7337', '#365f2c'][Math.floor(r() * 5)] }); }
  var CAR_COLS = ['#e5e7eb', '#111827', '#9ca3af', '#1e3a8a', '#7f1d1d', '#f8fafc', '#374151', '#a3a3a3', '#0f766e', '#ca8a04'];
  function carRow(I, r, x0, z0, x1, z1, gap, a, fill, y) { var L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / gap); for (var i = 0; i < n; i++) if (r() < fill) { var t = (i + 0.5) / n; I.cars.push({ x: x0 + (x1 - x0) * t, z: z0 + (z1 - z0) * t, a: a, c: CAR_COLS[Math.floor(r() * CAR_COLS.length)], y: y }); } }

  // ---------- Umgebung um das Stadion (Vorplatz, Bäume, Zuschauer) ----------
  function buildPlaza(group, m, M, I, r, big) {
    var B = new Builder(), ex = m.extent, px = ex.x + 12, pz = ex.y + 12;
    B.quad('paving', [-px, 0.02, -pz], [px, 0.02, -pz], [px, 0.02, pz], [-px, 0.02, pz], [[0, 0], [px / 8, 0], [px / 8, pz / 8], [0, pz / 8]]);
    B.flush(group, M, hq());
    // Zuschauer auf dem Vorplatz (Spieltag)
    var n = Math.round((hq() ? 900 : 300) * Math.max(0.3, m.attendance)), cols = [m.colors[0], m.colors[0], m.colors[1], '#1f2937', '#e5e7eb', '#6b7280'];
    for (var i = 0; i < n; i++) {
      var side = r(), x, z;
      if (side < 0.5) { x = (r() * 2 - 1) * px; z = (r() < 0.5 ? -1 : 1) * (ex.y + 2 + r() * 9); } else { z = (r() * 2 - 1) * pz; x = (r() < 0.5 ? -1 : 1) * (ex.x + 2 + r() * 9); }
      I.people.push({ x: x, z: z, c: cols[Math.floor(r() * cols.length)] });
    }
    for (var t = -px; t <= px; t += 13) { treeAt(I, r, t, -pz + 3, 0.8); treeAt(I, r, t, pz - 3, 0.8); }
    for (t = -pz + 13; t <= pz - 13; t += 13) { treeAt(I, r, -px + 3, t, 0.8); treeAt(I, r, px - 3, t, 0.8); }
    if (!big) { var B2 = new Builder(); B2.quad('ground', [-600, 0, -600], [600, 0, -600], [600, 0, 600], [-600, 0, 600], [[0, 0], [24, 0], [24, 24], [0, 24]]); B2.flush(group, M, hq()); }
  }

  // ---------- Vereinscampus: Gebäude je Betrieb und Stufe ----------
  function buildCity(group, m, M, I, r, blds) {
    var B = new Builder(), heights = {}, road = SM.CITY_ROAD, sh = hq();
    var lv = {}; blds.forEach(function (b) { lv[b.key] = b.level; });
    // Boden, Stadionring, Zufahrten
    B.quad('ground', [-1400, 0, -1400], [1400, 0, -1400], [1400, 0, 1400], [-1400, 0, 1400], [[0, 0], [56, 0], [56, 56], [0, 56]]);
    roadSeg(B, -road.x, -road.y, road.x, -road.y, road.w); roadSeg(B, road.x, -road.y, road.x, road.y, road.w); roadSeg(B, road.x, road.y, -road.x, road.y, road.w); roadSeg(B, -road.x, road.y, -road.x, -road.y, road.w);
    // Campus innerhalb des Rings: Rasen mit gepflasterten Wegen vom Vorplatz zum Ring
    B.quad('lawn', [-road.x + 7, 0.012, -road.y + 7], [road.x - 7, 0.012, -road.y + 7], [road.x - 7, 0.012, road.y - 7], [-road.x + 7, 0.012, road.y - 7], [[0, 0], [20, 0], [20, 17], [0, 17]]);
    [[0, -1, 14], [0, 1, 14], [-1, 0, 10], [1, 0, 10]].forEach(function (w) { var ex = m.extent; if (w[0]) B.quad('paving', [w[0] * (ex.x + 10), 0.02, -w[2]], [w[0] * (road.x - 6), 0.02, -w[2]], [w[0] * (road.x - 6), 0.02, w[2]], [w[0] * (ex.x + 10), 0.02, w[2]], [[0, 0], [8, 0], [8, 2], [0, 2]]); else B.quad('paving', [-w[2], 0.02, w[1] * (ex.y + 10)], [w[2], 0.02, w[1] * (ex.y + 10)], [w[2], 0.02, w[1] * (road.y - 6)], [-w[2], 0.02, w[1] * (road.y - 6)], [[0, 0], [2, 0], [2, 8], [0, 8]]); });
    // Hauptstraße (Straßenanbindung) und Verbindung zum Ring
    var sl = lv.strasse || 1, sw = [0, 7, 9, 14, 20, 26, 32][sl];
    if (sl <= 1) B.quad('gravel', [-700, 0.03, 312 - sw / 2], [700, 0.03, 312 - sw / 2], [700, 0.03, 312 + sw / 2], [-700, 0.03, 312 + sw / 2], [[0, 0], [60, 0], [60, 1], [0, 1]]);
    else { roadSeg(B, -900, 312, 900, 312, sw); if (sl >= 5) { B.quad('concrete', [-900, 0.06, 311.3], [900, 0.06, 311.3], [900, 0.06, 312.7], [-900, 0.06, 312.7]); } }
    roadSeg(B, -150, road.y, -150, 312, sl >= 3 ? 12 : 9); roadSeg(B, 150, road.y, 150, 312, sl >= 4 ? 12 : 8); roadSeg(B, 0, -road.y, 0, -320, 10);
    if (sl >= 6) { roadSeg(B, 150, 290, 330, 230, 10); roadSeg(B, 330, 230, 380, 140, 10); }
    carRow(I, r, -880, 304, 880, 304, 26, 0, sl >= 2 ? 0.55 : 0.1); carRow(I, r, -880, 320, 880, 320, 26, Math.PI, sl >= 2 ? 0.5 : 0.1);
    // Bäume entlang des Rings
    for (var t = -road.x; t <= road.x; t += 16) { treeAt(I, r, t, -road.y - 13, 1); treeAt(I, r, t, road.y + 13, 1); }
    for (t = -road.y; t <= road.y; t += 16) { treeAt(I, r, -road.x - 13, t, 1); treeAt(I, r, road.x + 13, t, 1); }
    carRow(I, r, -road.x + 10, -road.y - 3, road.x - 10, -road.y - 3, 9, 0, 0.35); carRow(I, r, road.x - 10, road.y + 3, -road.x + 10, road.y + 3, 9, Math.PI, 0.35);
    carRow(I, r, road.x + 3, -road.y + 10, road.x + 3, road.y - 10, 9, Math.PI / 2, 0.35); carRow(I, r, -road.x - 3, road.y - 10, -road.x - 3, -road.y + 10, 9, -Math.PI / 2, 0.35);
    blds.forEach(function (b) { heights[b.key] = (BUILD[b.key] || function () { return 0; })(B, b, I, r, M, m) || 0; });
    // Umgebende Stadt und Fluss im Norden
    B.quad('water', [-1400, 0.05, -760], [1400, 0.05, -760], [1400, 0.05, -620], [-1400, 0.05, -620]);
    var n = 0, maxR = hq() ? 1250 : 820, kinds = ['f_brick', 'f_concrete', 'f_office', 'f_brick', 'f_concrete'];
    for (var gx = -1300; gx <= 1300; gx += 70) for (var gz = -1300; gz <= 1300; gz += 70) {
      var ax = Math.abs(gx), az = Math.abs(gz);
      if ((ax < 420 && az < 380) || (gz > -790 && gz < -590) || Math.hypot(gx, gz) > maxR) continue;
      if (Math.abs(gz - 312) < 40 || ax < 30) continue;
      var w = 34 + r() * 22, d = 30 + r() * 24, near = Math.hypot(gx, gz), h = 9 + r() * (near > 700 ? 34 : 20) + (r() < 0.06 ? 40 : 0);
      var k = kinds[Math.floor(r() * kinds.length)];
      B.box(k, gx + r() * 10, gz + r() * 10, w, d, 0, h, 0, { topKey: 'roofTop' }); n++;
      if (r() < 0.5) treeAt(I, r, gx + 32, gz + 30, 1);
    }
    // Querstraßen der Stadt
    for (var sx = -1330; sx <= 1330; sx += 140) if (Math.abs(sx) > 400) { roadSeg(B, sx, -1300, sx, -800, 9); roadSeg(B, sx, -560, sx, 1300, 9); }
    for (var sz = -1295; sz <= 1300; sz += 140) if (Math.abs(sz) > 380 && (sz < -790 || sz > -590)) roadSeg(B, -1300, sz, 1300, sz, 9);
    B.flush(group, M, sh);
    return heights;
  }
  function roadSeg(B, x0, z0, x1, z1, w) {
    var L = Math.hypot(x1 - x0, z1 - z0), nx = -(z1 - z0) / L * w / 2, nz = (x1 - x0) / L * w / 2;
    B.quad('asphalt', [x0 + nx, 0.04, z0 + nz], [x0 - nx, 0.04, z0 - nz], [x1 - nx, 0.04, z1 - nz], [x1 + nx, 0.04, z1 + nz], [[0, 0], [1, 0], [1, L / 18], [0, L / 18]]);
  }
  function pitchAt(B, x, z, w, d, rot) { var c = Math.cos(rot * DEG), s = Math.sin(rot * DEG); function P(dx, dz) { return [x + dx * c - dz * s, 0.07, z + dx * s + dz * c]; } B.quad('trainingGrass', P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)); }
  function sign(B, key, txt, bg, fg, x, z, y, w, h, rot) {
    MATS._dyn[key] = MATS._dyn[key] || new T.MeshStandardMaterial({ map: textTex(key, txt, bg, fg, 512, 128), emissive: '#ffffff', emissiveMap: textTex(key, txt, bg, fg, 512, 128), emissiveIntensity: 0.6, side: T.DoubleSide });
    var c = Math.cos(rot * DEG), s = Math.sin(rot * DEG);
    B.quad(key, [x - w / 2 * c, y, z - w / 2 * s], [x + w / 2 * c, y, z + w / 2 * s], [x + w / 2 * c, y + h, z + w / 2 * s], [x - w / 2 * c, y + h, z - w / 2 * s], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  }
  // Jede Funktion baut ein glaubwürdiges Gebäude in seinem festen Bauplatz und gibt die Gebäudehöhe zurück
  var BUILD = {
    geschaeft: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y;
      if (l <= 1) { B.box('f_brick', x, z, 18, 11, 0, 4.2, 0, { side: 'f_brick', top: false, tw: 16, th: 14 }); B.gable('roofTile', x, z, 19, 12, 4.2, 3.2, 0); return 8; }
      if (l === 2) { for (var i = 0; i < 3; i++) B.box(i % 2 ? 'clad' : 'concrete', x - 14 + i * 13.5, z, 12, 3.2, 0, 3, 0, {}); B.box('clad', x, z + 5, 12, 3.2, 3, 3, 0, {}); return 7; }
      if (l === 3) { B.box('f_office', x, z, 46, 24, 0, 13, 0, { topKey: 'roofTop' }); B.box('clubCol', x, z + 12.3, 46, 0.4, 13, 1.2, 0, {}); sign(B, 'sgGS', 'GESCHÄFTSSTELLE', '#0b1424', '#ffffff', x, z + 12.6, 9, 22, 2.2, 0); return 15; }
      B.box('f_office', x - 12, z, 26, 24, 0, 34, 0, { topKey: 'roofTop' }); B.box('f_office', x + 16, z + 4, 34, 22, 0, 12, 0, { topKey: 'roofTop' });
      B.box('band', x - 12, z, 26.4, 24.4, 34, 1.4, 0, {}); sign(B, 'sgHQ', m.name ? 'VEREINSZENTRALE' : 'ZENTRALE', m.colors[0], '#ffffff', x - 12, z + 12.3, 29, 20, 3, 0);
      for (var j = 0; j < 6; j++) treeAt(I, r, x - 30 + j * 12, z + 18, 0.8);
      return 36;
    },
    training: function (B, b, I, r, M, m) {
      var l = Math.max(1, b.level), x = b.x, z = b.y, n = Math.min(4, l);
      var spots = [[-50, -24], [30, -24], [-50, 30], [30, 30]];
      for (var i = 0; i < n; i++) { pitchAt(B, x + spots[i][0] - 10, z + spots[i][1] - 2, 70, 46, 0); if (l >= 3) [[-35, -23], [35, -23], [-35, 23], [35, 23]].forEach(function (p) { B.box('steel', x + spots[i][0] - 10 + p[0], z + spots[i][1] - 2 + p[1], 0.4, 0.4, 0, 14, 0, {}); }); }
      if (l >= 2) B.box(l >= 4 ? 'f_office' : 'f_concrete', x + 78, z - 20, 18, l >= 4 ? 40 : 22, 0, l >= 4 ? 10 : 5, 0, { topKey: 'roofTop' });
      if (l >= 5) { var hall = new T.Mesh(new T.CylinderGeometry(22, 22, 70, 24, 1, true, 0, Math.PI), M.roof); hall.rotation.z = Math.PI / 2; hall.rotation.y = 0; hall.position.set(x + 78, 0, z + 34); hall.scale.set(1, 1, 0.55); hall.rotation.set(0, Math.PI / 2, Math.PI / 2); hall.castShadow = hq(); group_(hall); }
      for (var k = 0; k < 8; k++) treeAt(I, r, x - 92 + k * 24, z - 57, 1);
      return l >= 4 ? 12 : 6;
    },
    // Nachwuchsleistungszentrum: wächst stufenweise auf demselben Gelände (Plätze im Norden, Gebäudezeile im Süden)
    jugend: function (B, b, I, r, M, m) {
      var l = Math.max(1, b.level), x = b.x, z = b.y, P = [[-40, -36], [26, -36], [-40, 10], [26, 10]];
      function pitch(i, turf) { var p = P[i]; B.quad(turf ? 'turf' : 'trainingGrass', [x + p[0] - 29, 0.07, z + p[1] - 19], [x + p[0] + 29, 0.07, z + p[1] - 19], [x + p[0] + 29, 0.07, z + p[1] + 19], [x + p[0] - 29, 0.07, z + p[1] + 19]);
        B.box('white', x + p[0] - 28, z + p[1], 0.25, 4.5, 0, 1.8, 0, {}); B.box('white', x + p[0] + 28, z + p[1], 0.25, 4.5, 0, 1.8, 0, {});
        if (l >= 2) [[-30, -20], [30, -20], [-30, 20], [30, 20]].forEach(function (q) { B.box('steel', x + p[0] + q[0], z + p[1] + q[1], 0.35, 0.35, 0, 12, 0, { top: false }); B.box('lamp', x + p[0] + q[0], z + p[1] + q[1], 1.6, 0.4, 11.4, 0.9, 0, {}); }); }
      function fence() { var w = b.w / 2 - 2, d = 30; B.box('steelDark', x, z - 58, b.w - 6, 0.12, 0, 2.6, 0, { top: false }); B.box('steelDark', x - w, z - 22, 0.12, 72, 0, 2.6, 0, { top: false }); B.box('steelDark', x + w, z - 22, 0.12, 72, 0, 2.6, 0, { top: false }); }
      if (l === 1) {
        B.quad('gravel', [x - 69, 0.06, z - 55], [x - 11, 0.06, z - 55], [x - 11, 0.06, z - 17], [x - 69, 0.06, z - 17]);
        B.box('white', x - 68, z - 36, 0.25, 4.5, 0, 1.8, 0, {}); B.box('white', x - 12, z - 36, 0.25, 4.5, 0, 1.8, 0, {});
        B.box('f_brick', x - 50, z + 44, 14, 9, 0, 3.2, 0, { top: false, tw: 16, th: 14 }); B.gable('roofTile', x - 50, z + 44, 15, 10, 3.2, 2.6, 0);
        for (var t = 0; t < 6; t++) treeAt(I, r, x - 70 + t * 24, z + 58, 0.8);
        return 6;
      }
      pitch(0, false); if (l >= 3) pitch(1, false); if (l >= 4) pitch(2, true); if (l >= 5) pitch(3, true);
      fence();
      // Akademiegebäude: Stufe 2 Flachbau, Stufe 3 Erweiterung, Stufe 4/5 mehrgeschossige Akademie mit Glasfront
      if (l === 2) B.box('f_concrete', x - 40, z + 46, 34, 14, 0, 6, 0, { topKey: 'roofTop' });
      if (l === 3) { B.box('f_concrete', x - 40, z + 46, 34, 14, 0, 6, 0, { topKey: 'roofTop' }); B.box('f_office', x - 8, z + 46, 28, 14, 0, 9, 0, { topKey: 'roofTop' }); B.box('roof', x - 40, z + 12, 36, 4, 2.6, 0.4, 0, {}); }
      if (l >= 4) {
        B.box('f_office', x - 28, z + 46, 54, 16, 0, 11, 0, { topKey: 'roofTop' });
        B.box('glassWarm', x - 28, z + 37.6, 22, 1.4, 0, 4, 0, {});
        B.box('band', x - 28, z + 46, 54.4, 16.4, 10.4, 0.6, 0, { top: false });
        sign(B, 'sgNLZ2', 'NLZ', m.colors[0], '#ffffff', x - 46, z + 37.8, 6.2, 8, 3.2, 0);
        B.box('f_hotel', x + 40, z + 46, 28, 14, 0, l >= 5 ? 24 : 14, 0, { topKey: 'roofTop', tw: 24, th: 20.4 });
      }
      if (l >= 5) {
        var hg = new T.CylinderGeometry(15, 15, 34, 24, 1, false, 0, Math.PI); hg.rotateZ(Math.PI / 2); var hall = new T.Mesh(hg, M.roof); hall.position.set(x + 8, 0, z + 46); hall.scale.set(1, 0.7, 1); hall.castShadow = hq(); group_(hall);
        B.box('glassWarm', x + 8, z + 37, 30, 1, 0, 6, 0, { top: false });
        for (var s = 0; s < 6; s++) I.panels.push({ x: x - 50 + s * 9, z: z + 46, w: 8, d: 3.5, y: 11.6 });
      }
      for (var k = 0; k < 7; k++) treeAt(I, r, x - 72 + k * 24, z + 60, 0.85);
      for (var pp = 0; pp < 14 + l * 6; pp++) I.people.push({ x: x - 60 + r() * 120, z: z - 50 + r() * 70, c: r() < 0.6 ? m.colors[0] : '#f8fafc' });
      return l >= 5 ? 24 : l >= 4 ? 14 : l === 3 ? 9 : 6;
    },
    // Medizinische Abteilung: vom Schamanenzelt bis zur Privatklinik, immer am selben Standort (Front Richtung Stadion)
    medizin: function (B, b, I, r, M, m) {
      var l = Math.max(1, b.level), x = b.x, z = b.y;
      function cross(cx, cz, y, s) { B.box('crossRed', cx, cz, s, 0.3, y - s * 0.17, s * 0.34, 0, {}); B.box('crossRed', cx, cz, s * 0.34, 0.3, y - s / 2, s, 0, {}); }
      if (l === 1) {
        B.gable('tent', x, z, 7, 6, 0, 3.4, 90); B.box('concreteDark', x + 7, z - 2, 1.2, 1.2, 0, 0.4, 0, {});
        for (var g = 0; g < 4; g++) B.box('lawnDark', x - 10 + g * 3.2, z + 7, 2.4, 6, 0, 0.35, 0, {});
        treeAt(I, r, x - 14, z - 6, 0.9); treeAt(I, r, x + 14, z + 8, 0.8);
        return 4;
      }
      var main = [0, 0, [14, 10, 4.5], [28, 16, 8], [36, 20, 12], [36, 20, 12], [30, 22, 24]][l], fz = z - main[1] / 2 - 0.35;
      B.box(l >= 4 ? 'f_clinic' : 'f_clinic', x, z, main[0], main[1], 0, main[2], 0, { topKey: 'roofTop', tw: 24, th: 20 });
      if (l >= 3) B.box('glassWarm', x, fz + 0.2, main[0] * 0.9, 0.4, 0, 3.6, 0, { top: false });
      if (l >= 4) { B.box('steel', x, fz - 3, 14, 6, 4.2, 0.4, 0, {}); B.box('glassWarm', x, fz - 0.6, 10, 1.6, 0, 4, 0, {}); I.cars.push({ x: x - 16, z: fz - 8, a: 0, c: '#f8fafc', l: 1.25 }); }
      if (l >= 5) { B.box('f_clinic', x + 26, z + 4, 18, 28, 0, 12, 0, { topKey: 'roofTop', tw: 24, th: 20 }); B.box('lawn', x, z, main[0] * 0.8, main[1] * 0.7, main[2], 0.4, 0, {}); }
      if (l === 6) { B.box('f_clinic', x - 26, z + 4, 18, 28, 0, 10, 0, { topKey: 'roofTop', tw: 24, th: 20 }); B.quad('heli', [x - 8, main[2] + 0.1, z - 8], [x + 8, main[2] + 0.1, z - 8], [x + 8, main[2] + 0.1, z + 8], [x - 8, main[2] + 0.1, z + 8]); I.cars.push({ x: x + 16, z: fz - 8, a: 0, c: '#f8fafc', l: 1.25 }); }
      cross(x + main[0] / 2 - 3, fz - 0.05, main[2] - 0.6, l >= 4 ? 3.2 : 2.2);
      sign(B, 'sgMED' + l, ['', '', 'VEREINSARZT', 'PHYSIOTHERAPIE', 'MEDIZINZENTRUM', 'SPORTMEDIZIN', 'PRIVATKLINIK'][l], '#ffffff', '#b91c1c', x - (l >= 4 ? 4 : 2), fz - 0.1, main[2] - (l >= 4 ? 2.8 : 2), Math.min(20, main[0] * 0.55), l >= 4 ? 2 : 1.4, 0);
      for (var t2 = 0; t2 < 5; t2++) treeAt(I, r, x - 30 + t2 * 15, z + main[1] / 2 + 8, 0.8);
      return main[2] + (l === 6 ? 2 : 1);
    },
    hotel: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      if (l === 1) { B.box('f_hotel', x, z, 24, 12, 0, 9, 0, { top: false, tw: 16, th: 14 }); B.gable('roofTile', x, z, 25, 13, 9, 4, 0); return 13; }
      var fl = [0, 3, 5, 8, 12, 15][l], h = fl * 3.4, w = [0, 0, 40, 52, 58, 62][l];
      B.box('f_hotel', x, z - 4, w, 16, 0, h, 0, { topKey: 'roofTop', tw: 24, th: 20.4 });
      B.box('glassWarm', x, z + 7, w * 0.8, 8, 0, 5, 0, { topKey: 'roofTop' });
      B.box('steel', x, z + 13, 14, 4, 4.4, 0.4, 0, {});
      sign(B, 'sgHOT', 'VEREINSHOTEL', '#1f2937', '#fde68a', x, z + 4.1, h - 3, 20, 2.6, 0);
      if (l >= 4) { B.box('glassWarm', x, z - 4, w * 0.5, 12, h, 3.5, 0, { topKey: 'roofTop' }); }
      if (l >= 5) { B.box('f_office', x - 20, z + 18, 26, 14, 0, 8, 0, { topKey: 'roofTop' }); B.quad('water', [x + 8, 0.08, z + 14], [x + 30, 0.08, z + 14], [x + 30, 0.08, z + 22], [x + 8, 0.08, z + 22]); }
      return h + (l >= 4 ? 4 : 1);
    },
    fanshop: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      if (l === 1) { B.box('white', x, z, 6, 4, 0, 2.6, 0, {}); B.box('tent', x, z + 2.6, 7, 2.4, 2.6, 0.3, 0, {}); return 4; }
      var s = [0, 0, [14, 18, 5], [18, 26, 7], [22, 32, 10], [26, 40, 13]][l];
      B.box('glassWarm', x, z, s[0], s[1], 0, s[2], 0, { topKey: 'roofTop' });
      B.box('clubCol', x, z, s[0] + 0.6, s[1] + 0.6, s[2] - 1.6, 1.6, 0, { topKey: 'roofTop' });
      sign(B, 'sgFS', 'FANSHOP', m.colors[0], '#ffffff', x + s[0] / 2 + 0.4, z, s[2] - 1.4, Math.min(16, s[1] * 0.7), 1.3, 90);
      if (l >= 5) B.box('band', x, z, s[0] + 0.8, s[1] + 0.8, s[2] * 0.5, 0.6, 0, { top: false });
      return s[2] + 1;
    },
    restaurant: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      if (l <= 2) { for (var i = 0; i < (l === 1 ? 1 : 3); i++) { B.box('white', x - 10 + i * 10, z, 4.5, 3, 0, 2.6, 0, {}); B.box('tent', x - 10 + i * 10, z + 1.6, 5, 1.6, 2.6, 0.3, 0, {}); } return 4; }
      var rad = [0, 0, 0, 10, 12, 13][l], fl = l >= 4 ? 2 : 1;
      for (var f = 0; f < fl; f++) { var c = new T.Mesh(new T.CylinderGeometry(rad - f * 2, rad - f * 2, 4.2, 28), M.glassWarm); c.position.set(x, 2.1 + f * 4.4, z); c.castShadow = hq(); group_(c); var d = new T.Mesh(new T.CylinderGeometry(rad - f * 2 + 1.6, rad - f * 2 + 1.6, 0.6, 28), M.white); d.position.set(x, 4.5 + f * 4.4, z); d.castShadow = hq(); group_(d); }
      for (var k = 0; k < 8; k++) I.parasols.push({ x: x - rad - 4 + (k % 4) * 4, z: z + rad + 2 + Math.floor(k / 4) * 4, c: k % 2 ? '#f8fafc' : m.colors[0] });
      sign(B, 'sgRS', 'STADIONRESTAURANT', '#0b1424', '#fde68a', x, z + rad + 0.3, 4.6, 14, 1.3, 0);
      return fl * 4.4 + 1;
    },
    cafe: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      var s = [0, [8, 6, 3], [14, 10, 4.2], [18, 12, 7.5], [22, 16, 8]][l];
      B.box(l === 1 ? 'f_brick' : 'glassWarm', x, z, s[0], s[1], 0, s[2], 0, { topKey: 'roofTop' });
      B.box('roof', x, z + s[1] / 2 + 1.5, s[0] + 2, 3.5, s[2] - 0.6, 0.3, 0, {});
      for (var k = 0; k < 3 + l * 2; k++) I.parasols.push({ x: x - s[0] / 2 + 1 + (k % 5) * 3.6, z: z + s[1] / 2 + 5 + Math.floor(k / 5) * 3.6, c: k % 2 ? '#fef3c7' : m.colors[0] });
      sign(B, 'sgCF', 'VEREINSCAFÉ', '#3f2d20', '#fde68a', x, z + s[1] / 2 + 0.25, s[2] - 1.6, Math.min(10, s[0] * 0.8), 1.1, 0);
      return s[2] + 1;
    },
    museum: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      if (l === 1) { B.box('clad', x, z, 14, 6, 0, 3.2, 0, {}); return 4; }
      var s = [0, 0, [32, 22, 8], [40, 26, 10], [56, 36, 13], [64, 40, 15]][l];
      B.box('f_stone', x, z, s[0], s[1], 0, s[2], 0, { topKey: 'roofTop', tw: 24, th: 16 });
      // schräg auskragendes Dach
      B.quad('roof', [x - s[0] / 2 - 2, s[2], z - s[1] / 2 - 2], [x + s[0] / 2 + 2, s[2] + 3, z - s[1] / 2 - 2], [x + s[0] / 2 + 2, s[2] + 3, z + s[1] / 2 + 4], [x - s[0] / 2 - 2, s[2], z + s[1] / 2 + 4]);
      if (l >= 3) B.box('glassWarm', x + s[0] / 2 - 8, z + s[1] / 2 + 3, 14, 6, 0, s[2] - 2, 0, { topKey: 'roofTop' });
      if (l >= 5) B.box('f_stone', x - s[0] / 2 + 6, z - 4, 10, 10, 0, s[2] + 12, 0, { topKey: 'roofTop', tw: 24, th: 16 });
      sign(B, 'sgMU', 'VEREINSMUSEUM', '#1c1917', '#e7e5e4', x - 4, z + s[1] / 2 + 0.3, s[2] - 3, 16, 1.6, 0);
      return s[2] + (l >= 5 ? 13 : 4);
    },
    eventhalle: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      var s = [0, [64, 42, 10], [92, 60, 15], [112, 74, 20]][l];
      var base = new T.Mesh(new T.CylinderGeometry(1, 1, s[2], 40), M.clad); base.scale.set(s[0] / 2, 1, s[1] / 2); base.position.set(x, s[2] / 2, z); base.castShadow = hq(); base.receiveShadow = hq(); group_(base);
      var dome = new T.Mesh(new T.SphereGeometry(1, 40, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.roof); dome.scale.set(s[0] / 2 + 1, s[2] * 0.45, s[1] / 2 + 1); dome.position.set(x, s[2], z); dome.castShadow = hq(); group_(dome);
      var band = new T.Mesh(new T.CylinderGeometry(1, 1, 1.4, 40, 1, true), l >= 2 ? M.band : M.glassWarm); band.scale.set(s[0] / 2 + 0.3, 1, s[1] / 2 + 0.3); band.position.set(x, s[2] * 0.62, z); group_(band);
      var foyer = new T.Mesh(new T.CylinderGeometry(1, 1, 5, 40, 1, true, -0.6, 1.2), M.glassWarm); foyer.scale.set(s[0] / 2 + 3, 1, s[1] / 2 + 3); foyer.position.set(x, 2.5, z); group_(foyer);
      sign(B, 'sgEH', 'EVENTHALLE', '#0b1424', '#ffffff', x, z - s[1] / 2 - 1.5, s[2] * 0.75, 22, 2.6, 0);
      return s[2] * 1.45;
    },
    erlebnis: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return 0;
      B.quad('paving', [x - b.w / 2, 0.05, z - b.d / 2], [x + b.w / 2, 0.05, z - b.d / 2], [x + b.w / 2, 0.05, z + b.d / 2], [x - b.w / 2, 0.05, z + b.d / 2]);
      if (l === 1) { B.box('clubCol', x - 8, z, 6, 0.3, 0, 3, 0, {}); for (var i = 0; i < 6; i++) B.box(i % 2 ? 'clubAlt' : 'tent', x + 4 + (i % 3) * 4, z - 4 + Math.floor(i / 3) * 6, 2, 2, 0, 1.2 + (i % 3), 0, {}); return 4; }
      var dome = new T.Mesh(new T.SphereGeometry(l >= 3 ? 11 : 7, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), l >= 3 ? M.glassWarm : M.roof); dome.position.set(x - 14, 0, z); dome.castShadow = hq(); group_(dome);
      var ring = new T.Mesh(new T.TorusGeometry(l >= 3 ? 11.2 : 7.2, 0.35, 6, 40), M.band); ring.rotation.x = Math.PI / 2; ring.position.set(x - 14, 0.4, z); group_(ring);
      var f = new T.Mesh(new T.CylinderGeometry(6, 6, 0.6, 24), M.water); f.position.set(x + 14, 0.3, z); group_(f);
      if (l >= 3) for (var k = 0; k < 4; k++) { var arc = new T.Mesh(new T.TorusGeometry(5, 0.3, 6, 24, Math.PI), M.band); arc.position.set(x + 2 + k * 5, 0, z - 10); group_(arc); }
      return l >= 3 ? 12 : 8;
    },
    solar: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      var rows = [0, 3, 7, 11][l], cols = [0, 4, 6, 8][l];
      for (var i = 0; i < rows; i++) for (var j = 0; j < cols; j++) I.panels.push({ x: x - b.w / 2 + 10 + j * 12, z: z - b.d / 2 + 8 + i * 8.5, w: 11, d: 4.2, y: 1.4 });
      if (l >= 2) for (var k = 0; k < l; k++) B.box('white', x + b.w / 2 - 8, z - 30 + k * 9, 12, 3, 0, 3, 0, {});
      if (l >= 3) [[-60, -20], [-60, 30]].forEach(function (p) { var tw = new T.Mesh(new T.CylinderGeometry(1.1, 1.8, 70, 10), M.white); tw.position.set(x + p[0], 35, z + p[1]); tw.castShadow = hq(); group_(tw); for (var a = 0; a < 3; a++) { var bl = new T.Mesh(new T.BoxGeometry(0.6, 26, 1.6), M.white); bl.geometry.translate(0, 13, 0); bl.position.set(x + p[0], 70, z + p[1] + 1.5); bl.rotation.z = a * 2.094 + 0.3; group_(bl); } });
      return l >= 3 ? 70 : 4;
    },
    gewerbe: function (B, b, I, r, M, m) {
      var l = b.level, x = b.x, z = b.y; if (!l) return plot(B, b);
      var defs = [[], [[-30, 0, 14, 10, 6, 'clad']], [[-30, -15, 26, 18, 10, 'f_concrete'], [10, 12, 26, 18, 10, 'f_concrete']],
        [[-38, -24, 30, 22, 14, 'f_office'], [6, -24, 30, 22, 18, 'f_office'], [-38, 20, 30, 22, 12, 'f_concrete'], [6, 20, 30, 22, 14, 'f_office']],
        [[-40, -26, 30, 22, 18, 'f_office'], [0, -26, 26, 22, 24, 'f_office'], [-40, 22, 30, 24, 14, 'f_office'], [0, 22, 26, 24, 16, 'f_concrete'], [38, -4, 22, 22, 52, 'f_office']]][l];
      var top = 0; defs.forEach(function (d) { B.box(d[5], x + d[0], z + d[1], d[2], d[3], 0, d[4], 0, { topKey: 'roofTop' }); top = Math.max(top, d[4]); });
      for (var k = 0; k < l * 3; k++) treeAt(I, r, x - 55 + k * 9, z + 46, 0.8);
      return top + 1;
    },
    parken: function (B, b, I, r, M, m) {
      var l = Math.max(1, b.level), x = b.x, z = b.y, road = SM.CITY_ROAD;
      if (l === 1) return 2;
      var lot = function (cx, cz, w, d, mat, fill) { B.quad(mat, [cx - w / 2, 0.05, cz - d / 2], [cx + w / 2, 0.05, cz - d / 2], [cx + w / 2, 0.05, cz + d / 2], [cx - w / 2, 0.05, cz + d / 2], [[0, 0], [w / 16, 0], [w / 16, d / 16], [0, d / 16]]); for (var rr = cz - d / 2 + 3; rr < cz + d / 2 - 2; rr += 8) carRow(I, r, cx - w / 2 + 2, rr, cx + w / 2 - 2, rr, 2.6, Math.PI / 2, fill); };
      lot(x, z, l >= 4 ? 128 : 96, l >= 4 ? 96 : 70, l === 2 ? 'gravel' : 'lot', 0.6 * m.attendance + 0.2);
      if (l >= 4) lot(330, 160, 80, 60, 'lot', 0.5);
      if (l >= 5) { [[x + 0, z - 6], [330, 160]].forEach(function (p, i) { if (i && l < 6) return; for (var f = 0; f < 4; f++) { B.box('concrete', p[0], p[1], 56, 34, f * 3.2, 0.4, 0, {}); carRow(I, r, p[0] - 26, p[1] - 8, p[0] + 26, p[1] - 8, 2.6, Math.PI / 2, 0.7, f * 3.2 + 0.4); carRow(I, r, p[0] - 26, p[1] + 8, p[0] + 26, p[1] + 8, 2.6, Math.PI / 2, 0.7, f * 3.2 + 0.4); } for (var c = -2; c <= 2; c++) B.box('concreteDark', p[0] + c * 13, p[1], 0.8, 30, 0, 12.8, 0, { top: false }); B.box('concrete', p[0], p[1], 56, 34, 12.8, 0.6, 0, {}); sign(B, 'sgP', 'P', '#1d4ed8', '#ffffff', p[0] - 28.4, p[1], 9, 3.2, 3.2, 90); }); }
      if (l >= 6) B.box('f_office', x + 52, z - 46, 18, 14, 0, 9, 0, { topKey: 'roofTop' });
      return l >= 5 ? 14 : 3;
    },
    oepnv: function (B, b, I, r, M, m) {
      var l = Math.max(1, b.level), x = b.x, z = b.y, road = SM.CITY_ROAD;
      B.box('steel', -road.x - 10, 20, 2, 6, 0, 2.6, 0, {}); B.box('glassWarm', -road.x - 10.8, 20, 0.2, 5.4, 0, 2.2, 0, {}); // Haltestelle
      if (l >= 2) for (var i = 0; i < Math.min(4, l); i++) I.cars.push({ x: -road.x - 4, z: -10 + i * 16, a: Math.PI / 2, c: '#f5f5f4', l: 2.7 });
      if (l >= 3) { B.box('roof', x + 10, z, 22, 60, 5, 0.6, 0, {}); for (var k = -2; k <= 2; k++) B.box('steel', x + 10, z + k * 13, 0.6, 0.6, 0, 5, 0, {}); }
      if (l >= 4) { // Gleise Nord–Süd
        [x - 28, x - 22].forEach(function (gx) { B.quad('rail', [gx - 1.5, 0.08, -900], [gx + 1.5, 0.08, -900], [gx + 1.5, 0.08, 900], [gx - 1.5, 0.08, 900], [[0, 0], [1, 0], [1, 100], [0, 100]]); });
        B.box('white', x - 28, z + 30, 2.8, l >= 5 ? 70 : 32, 0.3, 3.3, 0, {}); B.box('clubCol', x - 28, z + 30, 2.85, l >= 5 ? 70 : 32, 1.2, 0.6, 0, { top: false });
      }
      if (l >= 5) { B.box('concrete', x - 12, z, 8, 120, 0, 1, 0, {}); B.box('roof', x - 12, z, 12, 100, 6, 0.8, 0, {}); B.box('f_office', x + 22, z - 52, 26, 18, 0, 10, 0, { topKey: 'roofTop' }); sign(B, 'sgS', 'S  STADION', '#15803d', '#ffffff', x + 22, z - 42.8, 7, 14, 2.2, 0); }
      if (l >= 6) { [[150, -150], [-150, 150]].forEach(function (p) { B.box('glassWarm', p[0], p[1], 10, 6, 0, 3.6, 0, { topKey: 'roofTop' }); sign(B, 'sgU', 'U', '#1d4ed8', '#ffffff', p[0], p[1], 4.2, 2.6, 2.6, 0); }); }
      return l >= 5 ? 12 : l >= 3 ? 6 : 3;
    },
    strasse: function () { return 1; }
  };
  // Vereinsbank: Glasturm mit Sockelbau, Vordach, Vorplatz und Straße (gleiche Licht- und Materialwelt wie Stadion/Stadt)
  // Messingschild der (fiktiven) Vereinsbank: Logo „VB“ mit Löwenkopf-Raute, darunter BANKDIREKTOR
  function bankPlaqueTex(city) {
    return tex('bankPlaque|' + city, 512, 384, function (g, W, H) {
      var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#e9cf86'); gr.addColorStop(0.5, '#c9a24a'); gr.addColorStop(1, '#8a6a22');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#5c4510'; g.lineWidth = 10; g.strokeRect(10, 10, W - 20, H - 20); g.strokeStyle = 'rgba(255,240,190,.7)'; g.lineWidth = 3; g.strokeRect(24, 24, W - 48, H - 48);
      // Logo: Raute mit zwei Säulen und Giebel (Bankgebäude), Monogramm
      var cx = W / 2, cy = 128; g.fillStyle = '#0b1f3d'; g.beginPath(); g.moveTo(cx, cy - 86); g.lineTo(cx + 86, cy); g.lineTo(cx, cy + 86); g.lineTo(cx - 86, cy); g.closePath(); g.fill();
      g.strokeStyle = '#f3dc93'; g.lineWidth = 6; g.stroke();
      g.fillStyle = '#f3dc93'; g.beginPath(); g.moveTo(cx - 44, cy - 14); g.lineTo(cx, cy - 46); g.lineTo(cx + 44, cy - 14); g.closePath(); g.fill();
      [-30, -10, 10, 30].forEach(function (dx) { g.fillRect(cx + dx - 5, cy - 10, 10, 44); }); g.fillRect(cx - 46, cy + 36, 92, 9);
      g.fillStyle = '#2a1d02'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '900 50px -apple-system, Helvetica, Arial'; g.fillText('VEREINSBANK', cx, 280);
      var ct = String(city || '').toUpperCase(); g.font = '700 ' + (ct.length > 16 ? 26 : 32) + 'px -apple-system, Helvetica, Arial'; g.fillText(ct, cx, 330);
      for (var i = 0; i < 600; i++) { g.fillStyle = 'rgba(255,255,255,' + Math.random() * 0.06 + ')'; g.fillRect(Math.random() * W, Math.random() * H, 2, 1); }
    });
  }
  function buildBank(group, m, M, I, r, cfg) {
    var B = new Builder(); M._dyn = M._dyn || {}; _grp = group;
    B.quad('ground', [-500, 0, -500], [500, 0, -500], [500, 0, 500], [-500, 0, 500], [[0, 0], [20, 0], [20, 20], [0, 20]]);
    B.quad('paving', [-60, 0.02, -30], [60, 0.02, -30], [60, 0.02, 34], [-60, 0.02, 34], [[0, 0], [15, 0], [15, 8], [0, 8]]);
    roadSeg(B, -500, 46, 500, 46, 16); roadSeg(B, 70, -500, 70, 38, 12);
    carRow(I, r, -480, 42, 480, 42, 14, 0, 0.45); carRow(I, r, 480, 50, -480, 50, 14, Math.PI, 0.45);
    // Turm
    B.box('f_office', -6, -6, 30, 24, 10, 52, 0, { topKey: 'roofTop', tw: 20, th: 18 });
    B.box('band', -6, -6, 30.4, 24.4, 61.5, 1.2, 0, {});
    B.box('steelDark', -6, -6, 22, 16, 62, 4, 0, { topKey: 'roofTop' });
    // Sockel mit Glasfront und Vordach
    B.box('glassWarm', 0, 6, 64, 30, 0, 10, 0, { topKey: 'roofTop' });
    B.box('steel', 0, 22.5, 36, 7, 7.2, 0.6, 0, {});
    B.box('steelDark', -16, 25, 0.5, 0.5, 0, 7.2, 0, { top: false }); B.box('steelDark', 16, 25, 0.5, 0.5, 0, 7.2, 0, { top: false });
    sign(B, 'sgBANK', 'VEREINSBANK', '#0b1424', '#e8eef8', 0, 21.15, 8.0, 20, 1.6, 0);
    // Messingschild im Erdgeschoss links neben dem Vordach (anklickbar, wenn der Cheat aktiv ist)
    {
      var pl = new T.Mesh(new T.PlaneGeometry(7.2, 5.4), new T.MeshStandardMaterial({ map: bankPlaqueTex(cfg && cfg.city), metalness: 0.65, roughness: 0.32, emissive: '#5a4512', emissiveIntensity: 0.35 }));
      pl.position.set(-25, 3.9, 21.08); if (cfg && cfg.plaque) pl.userData.act = cfg.plaque; group.add(pl);
      B.box('steelDark', -25, 21.03, 7.6, 0.06, 1.0, 5.8, 0, {});
    }
    // Nachbargebäude
    [[-78, -12, 30, 34, 26, 'f_concrete'], [78, -40, 28, 30, 34, 'f_brick'], [-90, -70, 40, 30, 44, 'f_office'], [40, -90, 36, 30, 60, 'f_office'], [-30, -110, 50, 30, 30, 'f_brick']].forEach(function (b) { B.box(b[5], b[0], b[1], b[2], b[3], 0, b[4], 0, { topKey: 'roofTop' }); });
    for (var i = 0; i < 9; i++) { treeAt(I, r, -56 + i * 14, 32, 0.8); }
    for (var k = 0; k < 70; k++) I.people.push({ x: -50 + r() * 100, z: 24 + r() * 8, c: ['#1f2937', '#e5e7eb', '#6b7280', m.colors[0], '#334155'][Math.floor(r() * 5)] });
    B.flush(group, M, hq());
    return { tower: 62, front: 21.2 };
  }
  // Einzelnes Gebäude auf seinem Bauplatz (für Stufen-Vorschaubilder): gleiche Bauregel wie in der Vereinsstadt
  function buildFocus(group, m, M, I, r, f) {
    var B = new Builder(), sl = SM.CITY_SLOTS[f.key], hts = {}; _grp = group; M._dyn = M._dyn || {};
    B.quad('lawn', [sl.x - 260, 0, sl.y - 220], [sl.x + 260, 0, sl.y - 220], [sl.x + 260, 0, sl.y + 220], [sl.x - 260, 0, sl.y + 220], [[0, 0], [20, 0], [20, 17], [0, 17]]);
    roadSeg(B, sl.x - 260, sl.y + sl.d / 2 + 16, sl.x + 260, sl.y + sl.d / 2 + 16, 10);
    for (var t = -2; t <= 2; t++) { treeAt(I, r, sl.x + t * (sl.w / 4), sl.y - sl.d / 2 - 14, 1); treeAt(I, r, sl.x - sl.w / 2 - 14, sl.y + t * (sl.d / 5), 1); treeAt(I, r, sl.x + sl.w / 2 + 14, sl.y + t * (sl.d / 5), 1); }
    hts[f.key] = BUILD[f.key](B, { key: f.key, x: sl.x, y: sl.y, w: sl.w, d: sl.d, level: f.level }, I, r, M, m) || 0;
    B.flush(group, M, hq());
    return hts;
  }
  var _grp = null; function group_(o) { o.receiveShadow = hq(); _grp.add(o); }
  function plot(B, b) { // leerer Bauplatz mit Bauzaun
    B.quad('gravel', [b.x - b.w / 2, 0.04, b.y - b.d / 2], [b.x + b.w / 2, 0.04, b.y - b.d / 2], [b.x + b.w / 2, 0.04, b.y + b.d / 2], [b.x - b.w / 2, 0.04, b.y + b.d / 2], [[0, 0], [b.w / 30, 0], [b.w / 30, b.d / 30], [0, b.d / 30]]);
    [[b.x, b.y - b.d / 2, b.w, 0.15], [b.x, b.y + b.d / 2, b.w, 0.15], [b.x - b.w / 2, b.y, 0.15, b.d], [b.x + b.w / 2, b.y, 0.15, b.d]].forEach(function (f) { B.box('white', f[0], f[1], f[2], f[3], 0, 1.8, 0, { top: false }); });
    return 2;
  }

  // ---------- Szene ----------
  function sceneFor(cfg) {
    var m = cfg.model, M = mats(m), scene = new T.Scene(), r = rng(hsh(m.club + '|' + cfg.kind));
    M._dyn = M._dyn || {};
    scene.background = skyTex();
    var big = cfg.kind === 'world';
    scene.fog = new T.Fog('#6d6577', big ? 700 : 450, big ? 2300 : 1400);
    var hemi = new T.HemisphereLight('#8ea6d8', '#3a2c22', 0.42); scene.add(hemi);
    var sun = new T.DirectionalLight('#ffad70', 1.55); sun.position.set(-460, 150, 210); scene.add(sun); scene.add(sun.target);
    var fill = new T.DirectionalLight('#7f95d6', 0.22); fill.position.set(300, 200, -300); scene.add(fill);
    if (m.flood.level) { var fl = new T.DirectionalLight('#fff6e6', 0.18 + m.flood.level * 0.08); fl.position.set(0, 300, 40); scene.add(fl); }
    if (hq()) {
      sun.castShadow = true; var S = big ? 420 : 170; var touch = (navigator.maxTouchPoints || 0) > 1, ms = big && !touch ? 4096 : 2048; sun.shadow.mapSize.set(ms, ms); // iPad: kleinere Schattenkarte spart Grafikspeicher
      sun.shadow.camera.left = -S; sun.shadow.camera.right = S; sun.shadow.camera.top = S; sun.shadow.camera.bottom = -S; sun.shadow.camera.near = 10; sun.shadow.camera.far = 1500; sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.6;
    }
    var group = new T.Group(); scene.add(group); _grp = group;
    var I = new Inst();
    if (cfg.kind === 'bank') { var hb = buildBank(group, m, M, I, r, cfg); flushInst(group, I, m, hq()); return { scene: scene, heights: hb }; }
    if (cfg.kind === 'focus') { var hf = buildFocus(group, m, M, I, r, cfg.focus); flushInst(group, I, m, hq()); return { scene: scene, heights: hf }; }
    var o = { highlight: cfg.highlight || [], lamps: [], noRoof: !!cfg.noRoof }, info = buildStadium(group, m, M, o);
    buildPlaza(group, m, M, I, r, big);
    var heights = big ? buildCity(group, m, M, I, r, cfg.buildings || []) : {};
    flushInst(group, I, m, hq());
    heights.__stadium = info.top;
    return { scene: scene, heights: heights };
  }

  // ---------- Kameras ----------
  var VIEWS = {}; // Kamerastand je Ansicht (bleibt beim Neuzeichnen erhalten)
  S3.view = function (key) { return VIEWS[key]; };
  function camDefaults(cfg) {
    var m = cfg.model, ex = m.extent, cam = cfg.cam;
    if (cam === 'stadt') return { az: -22, el: 34, dist: 760, tx: 0, ty: 0, tz: 25, fov: 34 };
    if (cam === 'bank') return { az: -22, el: 12, dist: 128, tx: -4, ty: 17, tz: 6, fov: 36 };
    if (cam === 'focus' && cfg.focus) { var sl = SM.CITY_SLOTS[cfg.focus.key]; return { az: -32, el: 30, dist: Math.max(sl.w, sl.d) * 1.55 + 50, tx: sl.x, ty: 4, tz: sl.y + 4, fov: 34 }; }
    if (cam === 'innen') return { az: 0, el: 0, dist: 0, fov: 66, inside: true, yaw: 0, pitch: 8 }; // Standpunkt Mittelkreis, Rundumblick
    if (cam === 'vorschau' && cfg.noRoof) { var dv = Math.max(ex.x * 1.25, ex.y * 1.6) * 1.6 + (m.roofH || 8) * 0.6; return { az: -24, el: 56, dist: dv, tx: -12, ty: 2, tz: 3, fov: 34 }; } // Ausbauvorschau ohne Dach: steiler von oben
    // Halle schräg von oben (Schnittansicht): Blick durch das Dachtragwerk auf Feld und Tribünen
    var d = Math.max(ex.x * 1.25, ex.y * 1.6) * (cfg.kind === 'world' ? 2.3 : 1.85) + (m.roofH || 8) * 0.8;
    return { az: -24, el: 42, dist: d, tx: cfg.kind === 'world' ? -6 : 0, ty: 2, tz: 3, fov: 34 };
  }
  function placeCamera(camera, v, cfg) {
    camera.fov = v.fov; camera.near = v.inside ? 0.2 : 1; camera.far = 4000;
    if (v.inside) {
      // Am Mittelkreis in Augenhöhe stehen und sich frei um 360° umsehen
      var y = 1.75, z = 0;
      camera.position.set(0, y, z);
      var yaw = v.yaw * DEG, pitch = v.pitch * DEG;
      camera.lookAt(Math.sin(yaw) * 100, y + Math.tan(pitch) * 100, z - Math.cos(yaw) * 100);
    } else {
      var az = v.az * DEG, el = v.el * DEG;
      camera.position.set(v.tx + Math.sin(az) * Math.cos(el) * v.dist, v.ty + Math.sin(el) * v.dist, v.tz + Math.cos(az) * Math.cos(el) * v.dist);
      camera.lookAt(v.tx, v.ty, v.tz);
    }
    camera.updateProjectionMatrix();
  }

  // ---------- Renderer (ein WebGL-Kontext für alle Ansichten) ----------
  var renderer = null, CACHE = {}, ORDER = [], pending = {}, live = {};
  function getRenderer() {
    if (renderer) return renderer;
    renderer = new T.WebGLRenderer({ antialias: hq(), preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = hq(); renderer.shadowMap.type = T.PCFSoftShadowMap;
    return renderer;
  }
  function disposeScene(sc) { sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); }
  S3.reset = function () {
    Object.keys(CACHE).forEach(function (k) { disposeScene(CACHE[k].scene); }); CACHE = {}; ORDER = [];
    if (MATS) { Object.keys(MATS).forEach(function (k) { var x = MATS[k]; if (x && x.dispose) x.dispose(); }); MATS = null; }
    Object.keys(TEX).forEach(function (k) { TEX[k].dispose(); }); TEX = {}; S3._env = null; SNAPS = {};
    if (renderer) { renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss(); renderer = null; }
  };
  function hashOf(cfg) { var m = cfg.model; return cfg.kind + '|' + (cfg.noRoof ? 'nr|' : '') + (cfg.plaque || '') + '|' + (cfg.city || '') + '|' + hq() + '|' + JSON.stringify(m.parts) + '|' + JSON.stringify(m.levels) + '|' + m.colors + '|' + Math.round(m.attendance * 4) + '|' + JSON.stringify((cfg.buildings || []).map(function (b) { return b.level; })) + '|' + (cfg.highlight || []).join() + '|' + (cfg.kind === 'focus' && cfg.focus ? cfg.focus.key + cfg.focus.level : ''); }
  function getScene(cfg) {
    var h = hashOf(cfg), k = cfg.kind + ':' + h.length + ':' + hsh(h);
    if (!CACHE[k]) {
      var t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
      CACHE[k] = sceneFor(cfg); CACHE[k].buildMs = Math.round((typeof performance !== 'undefined' ? performance.now() : 0) - t0);
      ORDER.push(k);
      while (ORDER.length > 3) { var old = ORDER.shift(); disposeScene(CACHE[old].scene); delete CACHE[old]; }
    }
    S3.lastBuildMs = CACHE[k].buildMs;
    return CACHE[k];
  }

  // HTML-Platzhalter: die Ansicht wird nach dem Rendern der Seite gezeichnet (S3.mountAll)
  S3.host = function (key, cfg) {
    if (!S3.supported()) return cfg.fallback || '<div class="s3d-fallback muted">3D-Grafik ist auf diesem Gerät nicht verfügbar.</div>';
    pending[key] = cfg;
    return '<div class="s3d-wrap"><div class="s3d s3d-' + cfg.kind + '" data-s3d="' + key + '" style="aspect-ratio:' + (cfg.ratio || '16/9') + '">' +
      '<canvas class="s3d-cv"></canvas><div class="s3d-labels"></div>' +
      (cfg.interactive ? '<div class="s3d-hint">' + (cfg.cam === 'innen' ? 'Ziehen zum Umsehen – 360° vom Mittelkreis · Zoom mit Mausrad/zwei Fingern' : 'Ziehen zum Drehen · Zoom mit Mausrad/zwei Fingern') + '</div>' : '') + '</div>' + (cfg.overlay || '') + '</div>';
  };
  S3.mountAll = function (root) {
    var keys = Object.keys(pending); live = {};
    keys.forEach(function (key) { var el = (root || document).querySelector('[data-s3d="' + key + '"]'); if (el) { live[key] = { el: el, cfg: pending[key] }; setup(key, el, pending[key]); } });
    pending = {};
    keys.forEach(function (key) { if (live[key]) draw(key); });
    if (pendingSnaps.length) setTimeout(runSnaps, 30);
  };
  // Standbild einer Ansicht (z. B. Ausbaustufen-Vergleich): einmal rendern, als Bild zwischenspeichern
  var SNAPS = {}, pendingSnaps = [];
  S3.snapHost = function (cfg, ratio) {
    if (!S3.supported()) return cfg.fallback || '';
    var k = hashOf(cfg) + '|' + cfg.cam, id = 'sn' + hsh(k);
    if (SNAPS[k]) return '<img class="s3d-snap" style="aspect-ratio:' + (ratio || '16/10') + '" src="' + SNAPS[k] + '" alt="">';
    pendingSnaps.push({ k: k, id: id, cfg: cfg });
    return '<img class="s3d-snap loading" style="aspect-ratio:' + (ratio || '16/10') + '" data-snap="' + id + '" alt="">';
  };
  function runSnaps() {
    var job = pendingSnaps.shift(); if (!job) return;
    try {
      if (!SNAPS[job.k]) {
        var rd = getRenderer(), sc = sceneFor(job.cfg), cam = new T.PerspectiveCamera(34, 16 / 10, 1, 4000), w = 480, h = 300;
        if (S3._env) sc.scene.environment = S3._env;
        placeCamera(cam, camDefaults(job.cfg), job.cfg); rd.setPixelRatio(1); rd.setSize(w, h, false); rd.render(sc.scene, cam);
        SNAPS[job.k] = rd.domElement.toDataURL('image/jpeg', 0.86); disposeScene(sc.scene);
      }
      document.querySelectorAll('img[data-snap="' + job.id + '"]').forEach(function (im) { im.src = SNAPS[job.k]; im.classList.remove('loading'); });
    } catch (e) { console.warn(e); }
    setTimeout(runSnaps, 0);
  }
  S3.redrawAll = function () { Object.keys(live).forEach(function (k) { if (live[k].el.isConnected) draw(k); }); };
  function setup(key, el, cfg) {
    var v = VIEWS[key + ':' + cfg.cam]; if (!v || cfg.resetView) v = VIEWS[key + ':' + cfg.cam] = camDefaults(cfg);
    if (!cfg.interactive) return;
    var cv = el.querySelector('.s3d-cv'), pts = {}, last = null, pinch = null;
    cv.style.touchAction = 'none';
    var down = null;
    cv.addEventListener('pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (er) {} pts[e.pointerId] = [e.clientX, e.clientY]; last = [e.clientX, e.clientY]; down = [e.clientX, e.clientY]; var ids = Object.keys(pts); if (ids.length === 2) pinch = dist2(); el.classList.add('drag'); });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) return; pts[e.pointerId] = [e.clientX, e.clientY];
      var ids = Object.keys(pts);
      if (ids.length === 2 && pinch) { var d = dist2(); zoom(pinch / d); pinch = d; return; }
      var dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY];
      if (v.inside) { v.yaw = ((v.yaw - dx * 0.22) % 360 + 360) % 360; v.pitch = Math.max(-35, Math.min(50, v.pitch + dy * 0.15)); }
      else { v.az -= dx * 0.25; v.el = Math.max(14, Math.min(72, v.el + dy * 0.18)); }
      schedule(key);
    });
    function up(e) {
      delete pts[e.pointerId]; if (Object.keys(pts).length < 2) pinch = null; if (!Object.keys(pts).length) el.classList.remove('drag');
      if (e.type === 'pointerup' && down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) pick(key, el, e); // Klick ohne Ziehen
      down = null;
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoom(Math.exp(e.deltaY * 0.0012)); }, { passive: false });
    function dist2() { var a = Object.keys(pts).map(function (k) { return pts[k]; }); return Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]) || 1; }
    function zoom(f) { if (v.inside) { v.fov = Math.max(30, Math.min(75, v.fov * f)); } else { var d0 = camDefaults(cfg).dist; v.dist = Math.max(d0 * 0.4, Math.min(d0 * 1.8, v.dist * f)); } schedule(key); }
  }
  // Anklickbare 3D-Objekte (userData.act): Strahl von der Kamera durch den Klickpunkt
  var ray = null;
  S3._pick = function (key, x, y) { var L = live[key]; if (L) return pick(key, L.el, { clientX: x, clientY: y }); return 'nolive'; };
  function pick(key, el, e) {
    var L = live[key]; if (!L) return; var entry = getScene(L.cfg); if (!entry) return;
    var hits = []; entry.scene.traverse(function (o) { if (o.userData && o.userData.act) hits.push(o); }); if (!hits.length) return 'nohits:' + !!L.cfg.plaque;
    var rc = el.getBoundingClientRect(), cam = new T.PerspectiveCamera(35, rc.width / rc.height, 1, 4000);
    placeCamera(cam, VIEWS[key + ':' + L.cfg.cam], L.cfg); cam.updateMatrixWorld(); entry.scene.updateMatrixWorld();
    ray = ray || new T.Raycaster(); ray.setFromCamera({ x: (e.clientX - rc.left) / rc.width * 2 - 1, y: -((e.clientY - rc.top) / rc.height * 2 - 1) }, cam);
    var hit = ray.intersectObjects(hits, false)[0]; if (!hit) return 'miss';
    var act = hit.object.userData.act; if (R.ui && R.ui.acts && R.ui.acts[act]) R.ui.acts[act]({ k: hit.object.userData.k }, el);
    hit.object.scale.set(0.94, 0.94, 1); schedule(key); setTimeout(function () { hit.object.scale.set(1, 1, 1); schedule(key); }, 140); // kurzes „Drücken“
  };
  var raf = {};
  function schedule(key) { if (raf[key]) return; raf[key] = requestAnimationFrame(function () { raf[key] = 0; draw(key); }); }
  var camera = null;
  function draw(key) {
    var L = live[key]; if (!L || !L.el.isConnected) return;
    var el = L.el, cfg = L.cfg, w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    var t0 = performance.now();
    var rd = getRenderer(), entry = getScene(cfg), pr = Math.min(window.devicePixelRatio || 1, hq() ? 2 : 1);
    if (!S3._env && hq()) { try { var pm = new T.PMREMGenerator(rd); var sky = skyTex(); sky.mapping = T.EquirectangularReflectionMapping; S3._env = pm.fromEquirectangular(sky).texture; pm.dispose(); } catch (e) { S3._env = null; } }
    if (entry.scene.environment !== (S3._env || null)) { entry.scene.environment = S3._env || null; entry.scene.traverse(function (o) { if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = o.material.metalness > 0.3 ? 0.9 : 0.25; }); }
    camera = camera || new T.PerspectiveCamera(35, 1, 1, 4000);
    camera.aspect = w / h; placeCamera(camera, VIEWS[key + ':' + cfg.cam], cfg);
    rd.setPixelRatio(1); rd.setSize(Math.round(w * pr), Math.round(h * pr), false);
    rd.render(entry.scene, camera);
    var cv = el.querySelector('.s3d-cv'); if (cv.width !== Math.round(w * pr)) cv.width = Math.round(w * pr); if (cv.height !== Math.round(h * pr)) cv.height = Math.round(h * pr);
    cv.getContext('2d').drawImage(rd.domElement, 0, 0);
    labels(el, cfg, entry, w, h);
    S3.lastDrawMs = Math.round(performance.now() - t0);
    el.setAttribute('data-ms', S3.lastDrawMs); el.setAttribute('data-build-ms', entry.buildMs);
  }
  var vtmp = null;
  function labels(el, cfg, entry, w, h) {
    var box = el.querySelector('.s3d-labels'); if (!cfg.labels) { box.innerHTML = ''; return; }
    vtmp = vtmp || new T.Vector3();
    if (box.childElementCount !== cfg.labels.length) box.innerHTML = cfg.labels.map(function (l) { return '<div class="s3d-lbl ' + (l.cls || '') + '"' + (l.act ? ' data-act="' + l.act + '"' + (l.k ? ' data-k="' + l.k + '"' : '') : '') + '>' + l.html + '</div>'; }).join('');
    cfg.labels.forEach(function (l, i) {
      var y = l.bld ? (entry.heights[l.bld] || 6) + 4 : l.z;
      vtmp.set(l.x, y, l.y).project(camera);
      var node = box.children[i], vis = vtmp.z < 1 && Math.abs(vtmp.x) < 1.02 && Math.abs(vtmp.y) < 1.05;
      node.style.display = vis ? '' : 'none';
      if (vis) { node.style.left = ((vtmp.x + 1) / 2 * w).toFixed(1) + 'px'; node.style.top = ((1 - vtmp.y) / 2 * h).toFixed(1) + 'px'; }
    });
  }
  if (typeof window !== 'undefined') {
    var rt = 0; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(S3.redrawAll, 120); });
  }
})(RFM);
