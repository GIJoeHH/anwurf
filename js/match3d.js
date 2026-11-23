// Live-Spiel in 3D – gemeinsame Datei für ANPFIFF! und ANWURF! (Sportart über SM.GEO.pitchL). Nutzt Stadion bzw.
// Halle des Heimvereins aus stadium3d.js und legt Spieler, Ball und Effekte darüber. Die Spielabläufe kommen
// unverändert aus U.animLoop (ui_match.js); dieses Modul zeichnet nur. ui_match.js liefert Weltkoordinaten in Metern
// (M3.map): X = Länge (Mittellinie 0), Z = Breite (+ = vordere Seitenlinie, Kameraseite), Y = Höhe.
// Handball: TV-Kamera schräg von oben hinter dem Angriff. Fußball: Tribünenkamera von der Haupttribüne.
(function (R) {
  'use strict';
  var M3 = R.m3d = {}, T = typeof THREE !== 'undefined' ? THREE : null;
  var SMG = R.stadiumModel && R.stadiumModel.GEO, FB = !!(SMG && SMG.pitchL > 60);
  var KEY = FB ? 'anpfiff.match3d' : 'anwurf.match3d';
  M3.FB = FB;
  // Ansichtskoordinaten → Welt: Handball x −10…10 (hinten→vorne), y 0…40 (Heimtor→Gasttor); Fußball x 0…1 (hinten→vorne), y 0…1 (Heim spielt nach rechts: Länge = 1 − y)
  M3.map = FB ? function (x, y) { return [(0.5 - y) * 105, (x - 0.5) * 68]; } : function (x, y) { return [y - 20, x]; };
  M3.pref = function () { try { return localStorage.getItem(KEY) || '3d'; } catch (e) { return '3d'; } };
  M3.setPref = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
  M3.available = function () { return !!(T && R.s3d && R.s3d.supported && R.s3d.supported() && R.s3d._sceneFor && R.stadiumModel); };
  M3.on = function () { return M3.pref() === '3d' && M3.available(); };

  var rd = null, stage = null; // ein eigener WebGL-Kontext ohne Schattenkarten (läuft 60× pro Sekunde)
  function renderer() {
    if (rd) return rd;
    var hq = R.s3d.hq ? R.s3d.hq() : true;
    rd = new T.WebGLRenderer({ antialias: hq, powerPreference: 'high-performance' });
    rd.outputEncoding = T.sRGBEncoding; rd.toneMapping = T.ACESFilmicToneMapping; rd.toneMappingExposure = 1.12;
    rd.shadowMap.enabled = false; rd.setPixelRatio(1);
    return rd;
  }
  function hsh(str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function lin(hex) { var c = new T.Color(hex); return c.convertSRGBToLinear ? c.convertSRGBToLinear() : c; } // satte Trikotfarben (Farben sind sRGB)
  function shade(hex, f) { var c = new T.Color(hex); if (f < 1) c.multiplyScalar(f); else c.lerp(new T.Color('#ffffff'), f - 1); return c; }
  var SKIN = ['#f1c9a5', '#e0ac85', '#c68a62', '#a8714d', '#7a4e33', '#5a3825'], HAIR = ['#1f1610', '#3b2a1c', '#6b4a2b', '#a77b46', '#d6b27a', '#111111'];

  // ---------- Spielerfigur (einfache Grundformen, Gelenke für Lauf- und Wurfbewegung) ----------
  var GEO = null;
  function geo() {
    if (GEO) return GEO;
    GEO = {
      leg: new T.CylinderGeometry(0.075, 0.06, 0.5, 8).translate(0, -0.25, 0),
      shin: new T.CylinderGeometry(0.062, 0.05, 0.46, 8).translate(0, -0.23, 0),
      shoe: new T.BoxGeometry(0.11, 0.08, 0.26).translate(0, -0.04, 0.05),
      shorts: new T.CylinderGeometry(0.2, 0.22, 0.3, 10),
      torso: new T.CapsuleGeometry(0.2, 0.36, 4, 10),
      arm: new T.CylinderGeometry(0.055, 0.048, 0.56, 7).translate(0, -0.28, 0),
      head: new T.SphereGeometry(0.115, 14, 10),
      hair: new T.SphereGeometry(0.12, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
      blob: new T.CircleGeometry(0.42, 18).rotateX(-Math.PI / 2),
      ring: new T.RingGeometry(0.5, 0.66, 40).rotateX(-Math.PI / 2),
      ball: new T.SphereGeometry(0.17, 16, 12)
    };
    return GEO;
  }
  function numTex(n, fill, txt) {
    var c = document.createElement('canvas'); c.width = 64; c.height = 64; var g = c.getContext('2d');
    g.fillStyle = fill; g.fillRect(0, 0, 64, 64); g.fillStyle = txt; g.font = '900 40px -apple-system, Helvetica, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n || ''), 32, 35);
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t;
  }
  function figure(kit, gk, pid, shirt) {
    var G = geo(), h = hsh(pid), root = new T.Group();
    var shirtCol = gk ? kit.gk : kit.fill, shortsCol = gk ? '#1f2937' : (kit.stroke || '#ffffff');
    var mShirt = new T.MeshStandardMaterial({ color: lin(shirtCol), roughness: 0.62, emissive: lin(shirtCol), emissiveIntensity: 0.18 }), mShorts = new T.MeshStandardMaterial({ color: lin(shortsCol), roughness: 0.7 });
    var mSkin = new T.MeshStandardMaterial({ color: lin(SKIN[h % SKIN.length]), roughness: 0.75 }), mHair = new T.MeshStandardMaterial({ color: lin(HAIR[(h >> 4) % HAIR.length]), roughness: 0.9 });
    var mShoe = new T.MeshStandardMaterial({ color: lin((h >> 8) % 3 ? '#f8fafc' : '#111827'), roughness: 0.5 }), mSock = new T.MeshStandardMaterial({ color: lin(shortsCol), roughness: 0.7 });
    var body = new T.Group(); root.add(body);
    function limb(geoA, geoB, mA, mB, x, y) { var hip = new T.Group(); hip.position.set(x, y, 0); var up = new T.Mesh(geoA, mA); hip.add(up); var knee = new T.Group(); knee.position.y = -0.5; hip.add(knee); var lo = new T.Mesh(geoB, mB); knee.add(lo); body.add(hip); return { hip: hip, knee: knee, lo: knee }; }
    var legL = limb(G.leg, G.shin, mSkin, mSock, -0.1, 0.98), legR = limb(G.leg, G.shin, mSkin, mSock, 0.1, 0.98);
    [legL, legR].forEach(function (l) { var sh = new T.Mesh(G.shoe, mShoe); sh.position.y = -0.46; l.knee.add(sh); });
    var shorts = new T.Mesh(G.shorts, mShorts); shorts.position.y = 0.98; body.add(shorts);
    var torso = new T.Mesh(G.torso, mShirt); torso.position.y = 1.36; torso.scale.set(1, 1, 0.68); body.add(torso);
    // Rückennummer
    var nm = new T.Mesh(new T.PlaneGeometry(0.26, 0.26), new T.MeshBasicMaterial({ map: numTex(shirt, shirtCol, gk ? '#111' : (kit.text || '#fff')), transparent: false }));
    nm.position.set(0, 1.4, -0.142); nm.rotation.y = Math.PI; body.add(nm);
    function arm(x) { var sh = new T.Group(); sh.position.set(x, 1.6, 0); var a = new T.Mesh(G.arm, mShirt); sh.add(a); var el = new T.Group(); el.position.y = -0.3; sh.add(el); var fa = new T.Mesh(G.arm, mSkin); fa.scale.y = 0.85; el.add(fa); body.add(sh); return { sh: sh, el: el }; }
    var armL = arm(-0.25), armR = arm(0.25);
    var head = new T.Mesh(G.head, mSkin); head.position.y = 1.83; body.add(head);
    var hair = new T.Mesh(G.hair, mHair); hair.position.y = 1.85; body.add(hair);
    var blob = new T.Mesh(G.blob, BLOB); blob.position.y = 0.075; root.add(blob);
    var k = 1.04 + ((h >> 12) % 12) / 100; body.scale.setScalar(k * (FB ? 1.25 : 1)); blob.scale.setScalar(FB ? 1.25 : 1); // Körpergröße 1,77–1,98 m
    return { root: root, body: body, legL: legL, legR: legR, armL: armL, armR: armR, ph: (h % 100) / 16, yaw: 0, last: null, mats: [mShirt, mShorts, mSkin, mHair, mShoe, mSock, nm.material] };
  }
  var BLOB = null;

  // ---------- Bühne: Halle + Figuren ----------
  M3.begin = function (st, m, kits) {
    if (!M3.on()) return null;
    try {
      var H = st.clubs[m.clubs[0]], key = H.id + '|' + (R.s3d.hq() ? 1 : 0);
      if (!stage || stage.key !== key) {
        if (stage) dispose(stage);
        var model = R.stadiumModel.build(H), sc = R.s3d._sceneFor({ kind: 'lite', model: model, noPlayers: true, noShadow: true });
        var scene = sc.scene; scene.fog = null; if (!FB) scene.background = new T.Color('#0b1220');
        scene.traverse(function (o) { if (o.isLight && o.castShadow) o.castShadow = false; });
        var spot = new T.DirectionalLight('#fff7e8', 0.55); spot.position.set(0, 40, 12); scene.add(spot); scene.add(spot.target);
        var amb = new T.HemisphereLight('#ffffff', '#55606e', 0.5); scene.add(amb);
        stage = { key: key, scene: scene, model: model, cam: new T.PerspectiveCamera(40, 16 / 9, 0.3, 900), actors: {}, actorKey: '', camT: null, camP: null, trail: [] };
      }
      // Figuren neu, wenn sich Begegnung oder Trikots ändern
      var ak = m.clubs.join('|') + '|' + kits[0].fill + kits[1].fill;
      if (stage.actorKey !== ak) {
        clearActors(stage); stage.actorKey = ak;
        BLOB = BLOB || new T.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.32, depthWrite: false });
        var G = geo();
        stage.ball = new T.Mesh(G.ball, new T.MeshStandardMaterial({ color: FB ? '#ffffff' : '#f5e6b8', roughness: 0.55, emissive: FB ? '#444444' : '#3a2a0a', emissiveIntensity: 0.25 })); if (FB) stage.ball.scale.setScalar(1.5); // Fußball: aus der Tribünenentfernung gut sichtbar
        var seam = new T.Mesh(new T.TorusGeometry(0.171, 0.015, 6, 24), new T.MeshStandardMaterial({ color: FB ? '#111827' : '#c2410c', roughness: 0.6 })); stage.ball.add(seam);
        var seam2 = seam.clone(); seam2.rotation.y = Math.PI / 2; stage.ball.add(seam2);
        stage.ballBlob = new T.Mesh(new T.CircleGeometry(FB ? 0.3 : 0.16, 14).rotateX(-Math.PI / 2), BLOB);
        stage.ring = new T.Mesh(G.ring, new T.MeshBasicMaterial({ color: '#f8fafc', transparent: true, opacity: 0.7, depthWrite: false }));
        stage.ringHl = new T.Mesh(G.ring, new T.MeshBasicMaterial({ color: '#facc15', transparent: true, opacity: 0.95, depthWrite: false }));
        stage.trail = [];
        for (var i = 0; i < 9; i++) { var tm = new T.Mesh(G.ball, new T.MeshBasicMaterial({ color: '#fde68a', transparent: true, opacity: 0.5 * (1 - i / 9), depthWrite: false })); tm.scale.setScalar(0.9 - i * 0.07); tm.visible = false; stage.trail.push(tm); }
        stage.grp = new T.Group(); stage.grp.add(stage.ball, stage.ballBlob, stage.ring, stage.ringHl); stage.trail.forEach(function (t) { stage.grp.add(t); });
        stage.scene.add(stage.grp); stage.hist = [];
      }
      stage.kits = kits; stage.st = st;
      return stage;
    } catch (e) { if (typeof console !== 'undefined') console.warn('3D-Liveansicht nicht verfügbar', e); stage = null; return null; }
  };
  function clearActors(S) {
    Object.keys(S.actors).forEach(function (k) { var a = S.actors[k]; S.scene.remove(a.root); a.mats.forEach(function (mt) { if (mt.map) mt.map.dispose(); mt.dispose(); }); });
    S.actors = {}; if (S.grp) { S.scene.remove(S.grp); S.grp = null; }
  }
  function dispose(S) { clearActors(S); S.scene.traverse(function (o) { if (o.geometry && o.geometry !== GEO) o.geometry.dispose(); }); }
  M3.reset = function () { if (stage) dispose(stage); stage = null; if (rd) { rd.dispose(); if (rd.forceContextLoss) rd.forceContextLoss(); rd = null; } };

  function actor(S, it) {
    var key = it.side + ':' + it.pid, a = S.actors[key];
    if (!a) { var p = S.st.players[it.pid]; a = S.actors[key] = figure(S.kits[it.side], it.gk, it.pid, p && p.shirt); S.scene.add(a.root); }
    return a;
  }
  function damp(cur, tgt, k) { return cur + (tgt - cur) * k; }
  function angLerp(a, b, k) { var d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * k; }

  // d: { list:[{side,i,pid,P:{x,y},gk}], ball:{x,y,h}, holder:'side:i'|null, shooter:'side:i'|null, shot:{side,t}|null,
  //      att: angreifende Seite, now, dt, hl: pid, run }
  M3.frame = function (S, ctx, Wd, Ht, d) {
    var r = renderer(), dt = d.dt || 0.016;
    if (r.domElement.width !== Wd || r.domElement.height !== Ht) r.setSize(Wd, Ht, false);
    var seen = {}, bw = M3.map(d.ball.x, d.ball.y), ballW = new T.Vector3(bw[0], d.ball.h, bw[1]), holderA = null, hlA = null, near = 2.2;
    d.list.forEach(function (it) {
      var a = actor(S, it); seen[it.side + ':' + it.pid] = 1; a.root.visible = true;
      var w = M3.map(it.P.x, it.P.y), X = w[0], Z = w[1];
      var vx = 0, vz = 0; if (a.last) { vx = (X - a.last[0]) / Math.max(1e-3, dt); vz = (Z - a.last[1]) / Math.max(1e-3, dt); } a.last = [X, Z];
      var sp = Math.hypot(vx, vz); a.sp = damp(a.sp || 0, Math.min(8, sp), Math.min(1, dt * 8));
      a.root.position.set(X, 0, Z);
      // Blickrichtung: beim Laufen in Laufrichtung, sonst zum Ball
      var face = a.sp > 1.2 ? Math.atan2(vx, vz) : Math.atan2(ballW.x - X, ballW.z - Z);
      a.yaw = angLerp(a.yaw, face, Math.min(1, dt * 7)); a.root.rotation.y = a.yaw;
      // Laufzyklus
      var amp = Math.min(1, a.sp / 5), f = d.run ? dt * (5 + a.sp * 1.6) : 0; a.ph += f;
      var sw = Math.sin(a.ph) * 0.75 * amp;
      a.legL.hip.rotation.x = sw; a.legR.hip.rotation.x = -sw;
      a.legL.knee.rotation.x = Math.max(0, -Math.sin(a.ph - 0.6)) * 1.0 * amp + 0.08; a.legR.knee.rotation.x = Math.max(0, Math.sin(a.ph - 0.6)) * 1.0 * amp + 0.08;
      a.armL.sh.rotation.x = -sw * 0.8; a.armR.sh.rotation.x = sw * 0.8; a.armL.el.rotation.x = -0.4 - amp * 0.5; a.armR.el.rotation.x = -0.4 - amp * 0.5;
      a.armL.sh.rotation.z = 0.12; a.armR.sh.rotation.z = -0.12;
      a.body.position.y = Math.abs(Math.cos(a.ph)) * 0.05 * amp;
      // Abwehr: Arme hoch, leicht in den Knien
      if (it.def && !it.gk) { a.armL.sh.rotation.x = -2.3; a.armR.sh.rotation.x = -2.3; a.armL.sh.rotation.z = 0.35; a.armR.sh.rotation.z = -0.35; a.armL.el.rotation.x = -0.2; a.armR.el.rotation.x = -0.2; }
      // Torwart: breite Grundstellung
      if (it.gk) { a.armL.sh.rotation.z = 0.9; a.armR.sh.rotation.z = -0.9; a.armL.sh.rotation.x = -0.6; a.armR.sh.rotation.x = -0.6; a.legL.hip.rotation.z = 0.18; a.legR.hip.rotation.z = -0.18; }
      var k = it.side + ':' + it.i;
      // Wurfarm / Sprungwurf
      if (d.shooter === k && d.shot) {
        var ts = (d.now - d.shot.t) / 1000, jump = ts > 0.05 && ts < 0.75 ? Math.sin((ts - 0.05) / 0.7 * Math.PI) : 0;
        a.body.position.y = jump * (d.shot.kind === 'seven' ? 0.05 : 0.55); a.armR.sh.rotation.x = ts < 0.3 ? -2.9 : -1.2; a.armR.el.rotation.x = ts < 0.3 ? -1.2 : -0.1; a.legL.hip.rotation.x = -0.9 * jump; a.legL.knee.rotation.x = 1.2 * jump;
        a.yaw = Math.atan2(d.goalX - X, -Z * 0.6); a.root.rotation.y = a.yaw;
      } else if (d.holder === k) { a.armR.sh.rotation.x = -0.9; a.armR.el.rotation.x = -1.1; }
      // Torwart reagiert auf den Wurf
      if (it.gk && d.shot && d.shot.side !== it.side) { var tg = (d.now - d.shot.t - 450) / 1000; if (tg > 0 && tg < 0.6) { var dv = Math.sin(tg / 0.6 * Math.PI); a.body.rotation.z = (d.shot.gx || 1) > 0 ? -0.9 * dv : 0.9 * dv; a.armL.sh.rotation.x = -2.8; a.armR.sh.rotation.x = -2.8; } else a.body.rotation.z = 0; }
      if (d.holder === k) holderA = a; if (d.hl && it.pid === d.hl) hlA = a;
      if (d.holder === 'auto' && !d.shot && !it.gk) { var dn = Math.hypot(X - ballW.x, Z - ballW.z); if (dn < near) { near = dn; holderA = a; } } // Fußball: Spieler am Ball
    });
    Object.keys(S.actors).forEach(function (k) { if (!seen[k]) S.actors[k].root.visible = false; });
    // Ball, Schatten, Schweif
    S.ball.position.copy(ballW); S.ball.rotation.x += dt * 6; S.ball.rotation.z += dt * 3; S.ballBlob.position.set(ballW.x, 0.07, ballW.z);
    var hist = S.hist; hist.unshift(ballW.clone()); if (hist.length > 20) hist.pop();
    var speed = hist.length > 2 ? hist[0].distanceTo(hist[2]) / (2 * dt) : 0, fastBall = speed > 7;
    S.trail.forEach(function (t, i) { var hp = hist[(i + 1) * 2]; t.visible = !!(fastBall && hp); if (hp) t.position.copy(hp); });
    // Ring unter dem Ballführenden (weiß) und unter dem eigenen Spieler (gelb, Karrieremodus)
    var pulse = 1 + Math.sin(d.now / 180) * 0.06;
    S.ring.visible = !!holderA && !d.shot; if (holderA) { S.ring.position.set(holderA.root.position.x, 0.08, holderA.root.position.z); S.ring.scale.setScalar(pulse); }
    S.ringHl.visible = !!hlA; if (hlA === holderA) S.ring.visible = false; if (hlA) { S.ringHl.position.set(hlA.root.position.x, 0.085, hlA.root.position.z); S.ringHl.scale.setScalar(1.08 * pulse); }
    // Kamera: Übertragungsperspektive schräg von oben, hinter dem angreifenden Team, folgt dem Ball
    var dir = d.goalX < 0 ? -1 : 1, cam = S.cam, tgtP, tgtT, fov, close = 0;
    if (FB) {
      // Tribünenkamera: feste Position auf Höhe der Mittellinie (vordere Haupttribüne), schwenkt und zoomt mit dem Ball
      var fx = Math.max(-34, Math.min(34, ballW.x * 0.9)), fz = ballW.z * 0.3 - 2;
      if (d.shot) { close = Math.min(1, (d.now - d.shot.t) / 1000 * 2.2); fx = damp(fx, dir * 40, close * 0.7); }
      tgtT = new T.Vector3(fx, 0, fz); tgtP = new T.Vector3(fx * 0.6, 18 - close * 3, (SMG ? SMG.Iy : 40) + 3); fov = 28 - close * 6;
    } else {
    var hall = S.model.hall || { x: 30, y: 22 }, roofH = S.model.roofH || 12;
    var tx = Math.max(-12, Math.min(12, ballW.x * 0.8 + dir * 2)), tz = ballW.z * 0.35 - 0.5;
    if (d.shot) { var st2 = (d.now - d.shot.t) / 1000; close = Math.min(1, st2 * 2.2); tx = damp(tx, dir * 15.5, close * 0.85); tz = damp(tz, 0, close * 0.6); }
    var dist = 19 - close * 5.5, el = 0.62 - close * 0.08, side = -dir * (5 + close * 1.5);
    var cy = Math.min(Math.sin(el) * dist, Math.max(5, roofH - 1.2)), cz = Math.min(Math.cos(el) * dist, Math.max(12, hall.y - 1.5));
    tgtP = new T.Vector3(tx + side, cy, tz + cz); tgtT = new T.Vector3(tx, 0.6, tz); fov = 40 - close * 4;
    }
    var kk = 1 - Math.exp(-dt * (d.shot ? 3.2 : 1.8));
    if (!S.camP) { S.camP = tgtP.clone(); S.camT = tgtT.clone(); } else { S.camP.lerp(tgtP, kk); S.camT.lerp(tgtT, kk); }
    cam.aspect = Wd / Ht; cam.fov = fov; cam.position.copy(S.camP); cam.lookAt(S.camT); cam.updateProjectionMatrix();
    r.render(S.scene, cam);
    ctx.drawImage(r.domElement, 0, 0, Wd, Ht);
    // Projektion für 2D-Beschriftungen
    var v = new T.Vector3();
    return function (x, y, h) { var q = M3.map(x, y); v.set(q[0], h || 0, q[1]).project(cam); var dd = cam.position.distanceTo(new T.Vector3(q[0], h || 0, q[1])); return { x: (v.x + 1) / 2 * Wd, y: (1 - v.y) / 2 * Ht, s: 16 / Math.max(4, dd), vis: v.z < 1 }; };
  };
})(RFM);
