// ANWURF! – Original-Vereinswappen über OpenLigaDB zuordnen
// Ablauf: Teamlisten der 1. Bundesliga, 2. Bundesliga und 3. Liga abrufen → mit den Vereinen der Spielwelt
// abgleichen (gespeicherte Team-ID → exakter Name → bekannte Aliasse → normalisierter Name; unscharfe Suche nur
// als Vorschlag) → Bilder laden und prüfen → als Bild im Spielstand speichern (funktioniert danach offline).
// Rechte: Wappen sind Marken der Vereine. Herkunft und Lizenzlage werden je Wappen angezeigt; nicht frei
// lizenzierte Wappen werden nur nach ausdrücklicher Zustimmung (private Nutzung) übernommen, sonst bleibt das
// neutrale, im Spiel erzeugte Wappen. Wappen werden nie in die veröffentlichte Web-App eingebaut.
(function (R) {
  var CR = R.crests = {};
  CR.API = 'https://api.openligadb.de/getavailableteams/';
  CR.LEAGUES = { 1: 'bl1', 2: 'bl2', 3: 'bl3' };
  CR.LIB_KEY = 'anwurf_crests';
  CR.SIZE = 128;

  // Bekannte abweichende Schreibweisen (OpenLigaDB, Kurzformen, englische Namen) → Vereinsname im Spiel
  CR.ALIASES = {
    'SV 07 Elversberg': 'SV Elversberg', 'TSG Hoffenheim': 'TSG 1899 Hoffenheim', '1899 Hoffenheim': 'TSG 1899 Hoffenheim', 'Hoffenheim': 'TSG 1899 Hoffenheim',
    'DSC Arminia Bielefeld': 'Arminia Bielefeld', 'Dynamo Dresden': 'SG Dynamo Dresden', 'Energie Cottbus': 'FC Energie Cottbus',
    'VfL Bochum': 'VfL Bochum 1848', 'Fortuna Köln': 'SC Fortuna Köln', 'Hansa Rostock': 'FC Hansa Rostock', 'Jahn Regensburg': 'SSV Jahn Regensburg',
    'Preußen Münster': 'SC Preußen Münster', 'Viktoria Köln': 'FC Viktoria Köln', 'Würzburger Kickers': 'FC Würzburger Kickers',
    'Waldhof Mannheim': 'SV Waldhof Mannheim', 'Wehen Wiesbaden': 'SV Wehen Wiesbaden', 'Sonnenhof Großaspach': 'SG Sonnenhof Großaspach',
    'Greuther Fürth': 'SpVgg Greuther Fürth', 'Heidenheim': '1. FC Heidenheim 1846', '1. FC Heidenheim': '1. FC Heidenheim 1846',
    'Union Berlin': '1. FC Union Berlin', 'Mainz 05': '1. FSV Mainz 05', 'Bayer Leverkusen': 'Bayer 04 Leverkusen', 'Gladbach': 'Borussia Mönchengladbach',
    "M'gladbach": 'Borussia Mönchengladbach', 'Bayern München': 'FC Bayern München', 'Schalke 04': 'FC Schalke 04', 'Werder Bremen': 'SV Werder Bremen',
    'St. Pauli': 'FC St. Pauli', 'Darmstadt 98': 'SV Darmstadt 98', 'Saarbrücken': '1. FC Saarbrücken', 'Ingolstadt': 'FC Ingolstadt 04',
    // Englische Namen
    'Bayern Munich': 'FC Bayern München', 'FC Bayern Munich': 'FC Bayern München', 'Cologne': '1. FC Köln', 'FC Cologne': '1. FC Köln', '1. FC Cologne': '1. FC Köln',
    'Borussia Monchengladbach': 'Borussia Mönchengladbach', 'Bayer Leverkusen 04': 'Bayer 04 Leverkusen', 'Hertha Berlin': 'Hertha BSC', 'Nuremberg': '1. FC Nürnberg',
    '1. FC Nuremberg': '1. FC Nürnberg', 'Hanover 96': 'Hannover 96', 'Fortuna Dusseldorf': 'Fortuna Düsseldorf', 'Dusseldorf': 'Fortuna Düsseldorf',
    'Munster': 'SC Preußen Münster', 'Preussen Munster': 'SC Preußen Münster', 'Saarbrucken': '1. FC Saarbrücken', 'Wurzburger Kickers': 'FC Würzburger Kickers',
    'Furth': 'SpVgg Greuther Fürth', 'Greuther Furth': 'SpVgg Greuther Fürth', 'Hamburg': 'Hamburger SV', 'Hamburg SV': 'Hamburger SV', 'Stuttgart': 'VfB Stuttgart',
    'Wolfsburg': 'VfL Wolfsburg', 'Freiburg': 'SC Freiburg', 'Augsburg': 'FC Augsburg', 'Frankfurt': 'Eintracht Frankfurt', 'Leipzig': 'RB Leipzig', 'RasenBallsport Leipzig': 'RB Leipzig'
  };

  // ---------- Namen vergleichen ----------
  CR.fold = function (s) { // Kleinbuchstaben, Umlaute ausgeschrieben, Satzzeichen weg
    return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[éèê]/g, 'e').replace(/[áàâ]/g, 'a').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  };
  var NOISE = { fc: 1, sv: 1, vfl: 1, vfb: 1, sc: 1, tsv: 1, sg: 1, ssv: 1, fsv: 1, spvgg: 1, tsg: 1, dsc: 1, bsc: 1, ev: 1, e: 1, v: 1, '1': 1 };
  CR.key = function (s) { // „1. FC Heidenheim 1846“ → „heidenheim“, „VfB Stuttgart II“ → „stuttgart ii“
    return CR.fold(s).split(' ').filter(function (t) { return t && !NOISE[t] && !/^(18|19|20)\d\d$/.test(t) && !/^0\d$/.test(t); }).join(' ');
  };
  function bigrams(s) { var a = []; s = ' ' + s + ' '; for (var i = 0; i < s.length - 1; i++) a.push(s.substr(i, 2)); return a; }
  CR.similarity = function (a, b) { // Dice-Koeffizient auf Buchstabenpaaren, 0..1
    a = CR.key(a); b = CR.key(b); if (!a || !b) return 0; if (a === b) return 1;
    var x = bigrams(a), y = bigrams(b), m = {}, hit = 0;
    y.forEach(function (g) { m[g] = (m[g] || 0) + 1; });
    x.forEach(function (g) { if (m[g]) { hit++; m[g]--; } });
    return 2 * hit / (x.length + y.length);
  };

  // ---------- Abgleich ----------
  // teams: { 1: [...], 2: [...], 3: [...] } (OpenLigaDB-Objekte mit teamId, teamName, shortName, teamIconUrl)
  // Liefert je Verein eine Zeile mit Status: id | exakt | alias | normalisiert | vorschlag | mehrdeutig | liga | fehlt
  CR.match = function (st, teams) {
    var clubs = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; });
    var all = []; [1, 2, 3].forEach(function (l) { (teams[l] || []).forEach(function (t) { all.push({ t: t, league: l }); }); });
    var byId = {}; all.forEach(function (x) { byId[x.t.teamId] = x; });
    var used = {}, rows = {};
    function nameOf(c) { return c.realName || c.name; }
    function assign(c, x, status) { rows[c.id] = { clubId: c.id, team: x.t, apiLeague: x.league, status: status, candidates: [] }; used[x.t.teamId] = c.id; }
    // 1) gespeicherte Team-ID
    clubs.forEach(function (c) { var x = c.oldbId && byId[c.oldbId]; if (x && !used[x.t.teamId]) assign(c, x, 'id'); });
    // 2) exakter Name, 3) Alias (auch Kurzname der API)
    [['exakt', function (x, c) { return x.t.teamName === nameOf(c) || x.t.teamName === c.name; }],
     ['alias', function (x, c) { return CR.ALIASES[x.t.teamName] === nameOf(c) || (x.t.shortName && CR.ALIASES[x.t.shortName] === nameOf(c)); }]].forEach(function (step) {
      clubs.forEach(function (c) {
        if (rows[c.id]) return;
        var hits = all.filter(function (x) { return !used[x.t.teamId] && step[1](x, c); });
        if (hits.length === 1) assign(c, hits[0], step[0]);
        else if (hits.length > 1) rows[c.id] = { clubId: c.id, team: null, status: 'mehrdeutig', candidates: hits.map(function (h) { return h.t; }) };
      });
    });
    // 4) normalisierter Name, nur innerhalb derselben Liga und nur eindeutig
    clubs.forEach(function (c) {
      if (rows[c.id]) return;
      var k = CR.key(nameOf(c));
      var hits = all.filter(function (x) { return !used[x.t.teamId] && x.league === c.league && (CR.key(x.t.teamName) === k || (x.t.shortName && CR.key(x.t.shortName) === k)); });
      if (hits.length === 1) assign(c, hits[0], 'normalisiert');
    });
    // 5) Unscharfe Suche → nur Vorschläge (müssen bestätigt werden)
    clubs.forEach(function (c) {
      if (rows[c.id]) return;
      var scored = all.filter(function (x) { return !used[x.t.teamId]; }).map(function (x) {
        var s = Math.max(CR.similarity(x.t.teamName, nameOf(c)), x.t.shortName ? CR.similarity(x.t.shortName, c.short) : 0) + (x.league === c.league ? 0.08 : 0);
        return { x: x, s: s };
      }).filter(function (o) { return o.s >= 0.45; }).sort(function (a, b) { return b.s - a.s; });
      if (!scored.length) { rows[c.id] = { clubId: c.id, team: null, status: 'fehlt', candidates: [] }; return; }
      var top = scored[0], amb = scored.length > 1 && scored[1].s > top.s - 0.1;
      rows[c.id] = { clubId: c.id, team: amb ? null : top.x.t, apiLeague: top.x.league, status: amb ? 'mehrdeutig' : 'vorschlag', score: top.s, candidates: scored.slice(0, 4).map(function (o) { return o.x.t; }) };
    });
    // Liga prüfen: sichere Zuordnungen mit abweichender Liga müssen bestätigt werden
    Object.keys(rows).forEach(function (id) { var r = rows[id], c = st.clubs[id]; if (r.team && r.apiLeague && r.apiLeague !== c.league && r.status !== 'id' && r.status !== 'vorschlag') r.status = 'liga'; });
    var list = clubs.map(function (c) {
      var r = rows[c.id]; r.club = c; r.league = c.league; r.needsConfirm = ['vorschlag', 'mehrdeutig', 'liga'].indexOf(r.status) >= 0;
      if (r.team) r.license = CR.license(r.team.teamIconUrl);
      return r;
    }).sort(function (a, b) { return a.league - b.league || a.club.name.localeCompare(b.club.name, 'de'); });
    var usedIds = {}; list.forEach(function (r) { if (r.team && !r.needsConfirm) usedIds[r.team.teamId] = 1; });
    return { rows: list, unused: all.filter(function (x) { return !usedIds[x.t.teamId]; }).map(function (x) { return x.t; }), counts: CR.counts(teams) };
  };
  CR.counts = function (teams) { return { 1: (teams[1] || []).length, 2: (teams[2] || []).length, 3: (teams[3] || []).length }; };
  // Doppelte Vergabe prüfen (gleiche Team-ID oder gleiche Bildadresse bei zwei Vereinen)
  CR.duplicates = function (rows) {
    var ids = {}, urls = {}, dup = [];
    rows.forEach(function (r) { if (!r.team) return; var i = r.team.teamId, u = r.team.teamIconUrl; if (ids[i]) dup.push(r.club.name + ' / ' + ids[i] + ': gleiche Team-ID ' + i); else ids[i] = r.club.name; if (u) { if (urls[u]) dup.push(r.club.name + ' / ' + urls[u] + ': gleiche Bildadresse'); else urls[u] = r.club.name; } });
    return dup;
  };

  // Lizenzlage nach Bildquelle (nur Orientierung – Markenrechte liegen immer beim Verein)
  CR.license = function (url) {
    url = String(url || '');
    if (/upload\.wikimedia\.org\/wikipedia\/commons\//.test(url)) return { free: true, label: 'Wikimedia Commons', note: 'freie Datei (meist gemeinfreies Textlogo); Markenrecht beim Verein' };
    if (/upload\.wikimedia\.org\/wikipedia\/(de|en)\//.test(url)) return { free: false, label: 'Wikipedia (nicht frei)', note: 'nur unter Fair-Use in der Wikipedia erlaubt – nur private Nutzung' };
    if (!url) return { free: false, label: 'keine Grafik', note: '' };
    return { free: false, label: 'Lizenz unbekannt', note: (url.match(/^https?:\/\/([^\/]+)/) || [, 'unbekannte Quelle'])[1] + ' – nur private Nutzung' };
  };

  // ---------- Abrufen (Browser / App) ----------
  function timeout(ms, p) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('Zeitüberschreitung')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
  CR.fetchTeams = function (season) {
    var out = {}, errors = [];
    return Promise.all([1, 2, 3].map(function (l) {
      return timeout(15000, fetch(CR.API + CR.LEAGUES[l] + '/' + season)).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        if (!Array.isArray(j)) throw new Error('unerwartete Antwort');
        out[l] = j.filter(function (t) { return t && t.teamId && t.teamName; }).map(function (t) { return { teamId: t.teamId, teamName: t.teamName, shortName: t.shortName || '', teamIconUrl: t.teamIconUrl || '' }; });
      }).catch(function (e) { errors.push((l === 1 ? '1. Bundesliga' : l === 2 ? '2. Bundesliga' : '3. Liga') + ': ' + (e && e.message === 'Failed to fetch' ? 'keine Verbindung' : e.message)); out[l] = []; });
    })).then(function () { return { teams: out, errors: errors }; });
  };
  // Bild laden, prüfen und als PNG (128 × 128, transparent) zurückgeben
  CR.loadImage = function (url) {
    if (!url) return Promise.reject(new Error('keine Bildadresse'));
    return timeout(20000, fetch(url, { mode: 'cors' })).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var ct = (r.headers.get('content-type') || '').toLowerCase();
      if (ct && ct.indexOf('image/') !== 0) throw new Error('kein Bild (' + ct.split(';')[0] + ')');
      return r.blob();
    }).then(function (blob) {
      if (!blob.size) throw new Error('leere Datei');
      return new Promise(function (res, rej) {
        var obj = URL.createObjectURL(blob), img = new Image();
        img.onload = function () {
          try {
            var S = CR.SIZE, cv = document.createElement('canvas'); cv.width = S; cv.height = S;
            var w = img.naturalWidth || S, h = img.naturalHeight || S, f = Math.min(S / w, S / h), dw = Math.round(w * f), dh = Math.round(h * f);
            var ctx = cv.getContext('2d'); ctx.drawImage(img, Math.round((S - dw) / 2), Math.round((S - dh) / 2), dw, dh);
            var px = ctx.getImageData(0, 0, S, S).data, vis = 0; for (var i = 3; i < px.length; i += 16) if (px[i] > 20) vis++;
            URL.revokeObjectURL(obj);
            if (vis < 40) return rej(new Error('Bild ist leer'));
            res(cv.toDataURL('image/png'));
          } catch (e) { URL.revokeObjectURL(obj); rej(new Error('Bild nicht lesbar')); }
        };
        img.onerror = function () { URL.revokeObjectURL(obj); rej(new Error('Bildformat nicht lesbar')); };
        img.src = obj;
      });
    }).catch(function (e) { throw new Error(e && e.message === 'Failed to fetch' ? 'nicht erreichbar' : (e && e.message) || 'Fehler'); });
  };
  // Alle Bilder der Zuordnung laden (je 6 gleichzeitig); onProgress(done, total)
  CR.loadAll = function (rows, onProgress) {
    var list = rows.filter(function (r) { return r.team && r.team.teamIconUrl; }), done = 0, i = 0;
    return new Promise(function (resolve) {
      if (!list.length) return resolve();
      function next() {
        if (i >= list.length) return;
        var r = list[i++];
        CR.loadImage(r.team.teamIconUrl).then(function (img) { r.img = img; r.imgError = null; }, function (e) { r.img = null; r.imgError = e.message; })
          .then(function () { done++; if (onProgress) onProgress(done, list.length); if (done === list.length) resolve(); else next(); });
      }
      for (var k = 0; k < 6; k++) next();
    });
  };

  // ---------- Speichern ----------
  // Wappen beim Verein im Spielstand ablegen (offline verfügbar) und Team-ID dauerhaft merken
  CR.applyRow = function (st, r) {
    var c = st.clubs[r.clubId]; if (!c || !r.team) return false;
    c.oldbId = r.team.teamId;
    if (r.img) {
      c.crestImage = r.img; c.crestManual = false;
      c.crestSrc = { provider: 'OpenLigaDB', teamId: r.team.teamId, teamName: r.team.teamName, url: r.team.teamIconUrl, license: r.license ? r.license.label : '', fetched: new Date().toISOString().slice(0, 10) };
    }
    CR.libPut(c);
    return true;
  };
  CR.hasManual = function (c) { return !!(c.crestImage && (c.crestManual || !c.crestSrc)); };
  // Bibliothek auf diesem Gerät (für neue Karrieren): Vereinsname → Wappen + Team-ID
  CR.lib = function () { try { return JSON.parse(localStorage.getItem(CR.LIB_KEY) || '{}'); } catch (e) { return {}; } };
  CR.libPut = function (c) {
    try { var l = CR.lib(); l[c.realName || c.name] = { teamId: c.oldbId || null, img: c.crestImage || null, src: c.crestSrc || null, manual: !!c.crestManual }; localStorage.setItem(CR.LIB_KEY, JSON.stringify(l)); return true; } catch (e) { return false; }
  };
  CR.libRemove = function (c) { try { var l = CR.lib(); delete l[c.realName || c.name]; localStorage.setItem(CR.LIB_KEY, JSON.stringify(l)); } catch (e) {} };
  // Neue Karriere: gespeicherte Wappen übernehmen
  CR.applyLibrary = function (st) {
    if (!st || typeof localStorage === 'undefined') return 0;
    var l = CR.lib(), n = 0;
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k], e = l[c.realName || c.name]; if (!e) return;
      if (e.teamId) c.oldbId = e.teamId;
      if (e.img && !c.crestImage) { c.crestImage = e.img; c.crestSrc = e.src; c.crestManual = !!e.manual; n++; }
    });
    return n;
  };
})(RFM);
