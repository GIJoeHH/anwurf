// ANWURF! – Echte Sponsorenlogos (nur für den privaten Gebrauch)
// Die Logos werden NICHT mit dem Spiel ausgeliefert. Sie werden auf dem jeweiligen Gerät aus Wikidata
// (Eigenschaft P154 „Logo“) bzw. Wikimedia Commons geladen und lokal gespeichert (localStorage „anwurf_sponsorlogos“).
// Markenrechte liegen bei den jeweiligen Unternehmen; ohne geladenes Logo zeigt das Spiel ein neutrales Platzhalterlogo.
(function (R) {
  var LG = R.logos = {}, D = R.data;
  LG.KEY = 'anwurf_sponsorlogos';
  LG.WIDTH = 200;
  var lib = null;
  function store() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } }
  LG.lib = function () {
    if (lib) return lib;
    lib = { items: {}, tried: 0 };
    var ls = store(); if (ls) { try { var x = JSON.parse(ls.getItem(LG.KEY) || 'null'); if (x && x.items) lib = x; } catch (e) { /* defekt → neu */ } }
    return lib;
  };
  LG.save = function () { var ls = store(); if (!ls) return false; try { ls.setItem(LG.KEY, JSON.stringify(LG.lib())); return true; } catch (e) { return false; } };
  // Alle echten Firmen (Name → Wikipedia-Titel) aus den Sponsorenkategorien
  LG.catalog = function () {
    var out = {}, rs = D.realSponsors || {};
    Object.keys(rs).forEach(function (cat) { rs[cat].forEach(function (s) { out[s.n] = s.w || s.n; }); });
    return out;
  };
  LG.get = function (name) { var it = LG.lib().items[name]; return it && it.data ? it.data : null; };
  LG.status = function () { var cat = LG.catalog(), names = Object.keys(cat), have = names.filter(function (n) { return LG.get(n); }); return { total: names.length, loaded: have.length, missing: names.filter(function (n) { return !LG.get(n); }) }; };
  LG.enabled = function (st) { return !st || !st.settings || st.settings.realSponsors !== false; };

  // Bestes Logo einer Wikidata-Entität: bevorzugter Rang, sonst das aktuelle (ohne Enddatum), sonst das letzte
  LG.pickClaim = function (claims) {
    var c = (claims || []).filter(function (x) { return x.mainsnak && x.mainsnak.datavalue; });
    if (!c.length) return null;
    var pref = c.filter(function (x) { return x.rank === 'preferred'; })[0];
    var cur = c.filter(function (x) { return x.rank !== 'deprecated' && !(x.qualifiers && x.qualifiers.P582); });
    return (pref || cur[cur.length - 1] || c[c.length - 1]).mainsnak.datavalue.value;
  };
  function getJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
  function toDataURL(blob) { return new Promise(function (ok, bad) { var fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.onerror = bad; fr.readAsDataURL(blob); }); }
  // Wikipedia-Titel → Wikidata-ID (Weiterleitungen werden aufgelöst)
  LG.resolve = function (titles) {
    var url = 'https://de.wikipedia.org/w/api.php?action=query&prop=pageprops&ppprop=wikibase_item&redirects=1&format=json&origin=*&titles=' + encodeURIComponent(titles.join('|'));
    return getJSON(url).then(function (j) {
      var map = {}, ids = {};
      ((j.query && j.query.normalized) || []).forEach(function (n) { map[n.to] = n.from; });
      ((j.query && j.query.redirects) || []).forEach(function (n) { map[n.to] = map[n.from] || n.from; });
      Object.keys((j.query && j.query.pages) || {}).forEach(function (k) { var p = j.query.pages[k], orig = map[p.title] || p.title; if (p.pageprops && p.pageprops.wikibase_item) ids[orig] = p.pageprops.wikibase_item; });
      return ids;
    });
  };
  LG.logoFiles = function (qids) {
    return getJSON('https://www.wikidata.org/w/api.php?action=wbgetentities&props=claims&format=json&origin=*&ids=' + qids.join('|')).then(function (w) {
      var out = {}; qids.forEach(function (q) { var e = w.entities && w.entities[q]; out[q] = e && e.claims ? LG.pickClaim(e.claims.P154) : null; }); return out;
    });
  };
  LG.fetchImage = function (file) {
    return getJSON('https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|mime&iiurlwidth=' + LG.WIDTH + '&format=json&origin=*&titles=' + encodeURIComponent('File:' + file)).then(function (j) {
      var pages = (j.query && j.query.pages) || {}, p = pages[Object.keys(pages)[0]], ii = p && p.imageinfo && p.imageinfo[0];
      if (!ii) throw new Error('Datei nicht gefunden');
      return fetch(ii.thumburl || ii.url);
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
      .then(function (b) { if (!/^image\//.test(b.type) || b.size < 200 || b.size > 400000) throw new Error('Kein gültiges Bild'); return toDataURL(b); });
  };
  // Fehlende Logos laden. onStep(done, total, name, ok)
  LG.loadMissing = function (onStep, force) {
    var cat = LG.catalog(), names = Object.keys(cat).filter(function (n) { return force || !LG.get(n); }), L = LG.lib(), done = 0, ok = 0;
    if (!names.length) return Promise.resolve({ ok: 0, total: 0 });
    if (typeof fetch === 'undefined') return Promise.resolve({ ok: 0, total: names.length, error: 'offline' });
    var titles = names.map(function (n) { return cat[n]; }), chunks = [];
    for (var i = 0; i < titles.length; i += 45) chunks.push(titles.slice(i, i + 45));
    var byTitle = {};
    return chunks.reduce(function (p, ch) { return p.then(function () { return LG.resolve(ch).then(function (ids) { Object.keys(ids).forEach(function (t) { byTitle[t] = ids[t]; }); }); }); }, Promise.resolve())
      .then(function () { var q = Object.keys(byTitle).map(function (t) { return byTitle[t]; }); var parts = []; for (var k = 0; k < q.length; k += 45) parts.push(q.slice(k, k + 45)); var files = {}; return parts.reduce(function (p, ch) { return p.then(function () { return LG.logoFiles(ch).then(function (f) { Object.keys(f).forEach(function (x) { files[x] = f[x]; }); }); }); }, Promise.resolve()).then(function () { return files; }); })
      .then(function (files) {
        return names.reduce(function (p, n) {
          return p.then(function () {
            var q = byTitle[cat[n]], file = q && files[q];
            var step = file ? LG.fetchImage(file).then(function (data) { L.items[n] = { data: data, file: file, qid: q, t: Date.now() }; ok++; LG.save(); return true; }) : Promise.resolve(false);
            return step.catch(function () { return false; }).then(function (good) { done++; if (onStep) onStep(done, names.length, n, good); });
          });
        }, Promise.resolve());
      })
      .then(function () { L.tried = Date.now(); LG.save(); return { ok: ok, total: names.length }; });
  };
  // Einmal am Tag still im Hintergrund fehlende Logos nachladen (nur online)
  LG.autoLoad = function (st, onDone) {
    if (!LG.enabled(st) || typeof navigator === 'undefined' || navigator.onLine === false) return;
    var L = LG.lib(), s = LG.status(); if (!s.missing.length || Date.now() - (L.tried || 0) < 20 * 3600 * 1000 || LG._running) return;
    LG._running = true;
    LG.loadMissing().then(function (r) { LG._running = false; if (onDone && r.ok) onDone(r); }, function () { LG._running = false; });
  };
  LG.clear = function () { lib = { items: {}, tried: 0 }; LG.save(); };
})(RFM);
