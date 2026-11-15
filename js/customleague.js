// Eigene Liga: Beim Gründen eines Vereins kann die echte Liga (z. B. Jugend- oder Kreisliga) mit der eigenen
// Mannschaft eingelesen werden – aus PDF-Spielberichten von handball.net, aus kopiertem Text (Tabelle, Kader im
// Format „Nummer Name“ wie in der Handball-Live-App) oder per Hand. Alles passiert NUR auf diesem Gerät: Die Daten
// landen ausschließlich im lokalen Spielstand, nichts davon ist im veröffentlichten Spiel (GitHub) enthalten.
// Die Liga läuft als 4. Spielklasse (Ligaschlüssel 7) unter der 3. Liga: Meister steigt auf, der schwächste
// Staffel-Letzte der 3. Liga steigt ab.
(function (R) {
  var D = R.data, CL = R.customLeague = {};
  CL.KEY = 7; CL.TIER = 4;
  var base = { keys: D.leagueKeys.slice(), tier4: D.tierNames[4] };

  // ---------- Liga im Datenmodell an-/abmelden (je Spielstand) ----------
  CL.activate = function (st) {
    var cfg = st && st.customLeague, i = D.leagueKeys.indexOf(CL.KEY);
    if (!cfg) {
      if (i >= 0) D.leagueKeys.splice(i, 1);
      delete D.leagueNames[CL.KEY]; delete D.leagueShort[CL.KEY]; delete D.leagueTier[CL.KEY];
      D.tierNames[CL.TIER] = base.tier4 || 'Amateurliga';
      return false;
    }
    if (i < 0) D.leagueKeys.push(CL.KEY);
    D.leagueNames[CL.KEY] = cfg.name || 'Eigene Liga';
    D.leagueShort[CL.KEY] = cfg.short || CL.shortName(cfg.name || 'Eigene Liga');
    D.leagueTier[CL.KEY] = CL.TIER;
    D.tierNames[CL.TIER] = cfg.name || 'Eigene Liga';
    return true;
  };
  CL.active = function () { return D.leagueKeys.indexOf(CL.KEY) >= 0; };

  // ---------- Namen ----------
  var PREFIX = /^(HSG|SG|TSV|TV|TuS|TuRa|SV|SC|HC|HSV|VfL|VfB|MTV|ETV|THW|ASV|ESV|FSV|BSV|DJK|SpVgg|TSG|HG|JSG|MSG|HT|TG|TB|SSV|PSV|FC|TSC|USC|SVG|SGH|1\.|FTSV|Eintracht|Turnerschaft|Spvg\.?)$/i;
  CL.cityOf = function (name) {
    var t = String(name || '').replace(/\s+/g, ' ').trim().split(' ').filter(function (w) { return !PREFIX.test(w) && !/^(I{1,3}|IV|V|\d+)$/.test(w) && !/^\d/.test(w); });
    return (t[0] || String(name || 'Neustadt')).replace(/[^A-Za-zÄÖÜäöüß\-]/g, '') || 'Neustadt';
  };
  CL.shortName = function (name) {
    var all = String(name || '').replace(/\s+/g, ' ').trim(), t = all.split(' ');
    var core = t.filter(function (w) { return !PREFIX.test(w); });
    var s = (core.length ? core : t).join(' ');
    if (s.length <= 14) return s;
    var roman = /\s(I{1,3}|IV|V|\d)$/.exec(s), suf = roman ? ' ' + roman[1] : '';
    var main = suf ? s.slice(0, -suf.length) : s;
    return (main.slice(0, 14 - suf.length).trim() + suf).trim();
  };
  // „Nachname, Vorname“ oder „Vorname Nachname“
  CL.splitName = function (n) {
    n = String(n || '').replace(/\s+/g, ' ').trim();
    if (n.indexOf(',') > 0) { var p = n.split(','); return { first: (p.slice(1).join(' ').trim() || '–'), last: p[0].trim() }; }
    var t = n.split(' ');
    return t.length > 1 ? { first: t.slice(0, -1).join(' '), last: t[t.length - 1] } : { first: '', last: n || '?' };
  };
  function norm(s) { return String(s || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]/g, ''); }
  CL.norm = norm;

  // ---------- Texteingaben ----------
  // Mannschaftsliste: eine pro Zeile; kopierte Tabellen werden toleriert (Platz vorne, Zahlen hinten werden entfernt)
  CL.parseTeams = function (text) {
    var out = [], seen = {};
    String(text || '').split(/\r?\n/).forEach(function (l) {
      l = l.replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();
      l = l.replace(/^\d{1,2}\s*[.)]?\s+/, '');                 // Tabellenplatz
      l = l.replace(/\s+[-+]?\d+([:\/]\d+)?(\s.*)?$/, '');      // Spiele, Tore, Punkte …
      l = l.replace(/\s*\((a\.\s*K\.|aK|zg\.?)\)\s*$/i, '').trim();
      if (l.length < 3 || !/[A-Za-zÄÖÜäöü]{2}/.test(l)) return;
      if (/^(mannschaft|team|verein|pl\.?|platz|tabelle|punkte|tore|spiele)\b/i.test(l)) return;
      var k = norm(l); if (seen[k]) return; seen[k] = true;
      out.push(l.slice(0, 40));
    });
    return out;
  };
  // Kader: „Nummer Name [Position]“ je Zeile (Format der Handball-Live-App), Nummer und Position optional
  CL.parseRoster = function (text) {
    var out = [];
    String(text || '').split(/\r?\n/).forEach(function (l) {
      l = l.replace(/\t/g, ' ').replace(/[;|]/g, ' ').replace(/\s+/g, ' ').trim(); if (!l) return;
      var m = /^#?(\d{1,3})[.:)]?\s+(.+)$/.exec(l), nr = null, rest = l;
      if (m) { nr = +m[1]; rest = m[2]; }
      var tok = rest.split(' '), pos = null, goals = 0;
      // Position am Ende (TW, RL, KM …) und optional Tore als letzte Zahl
      if (tok.length > 1 && /^\d{1,3}$/.test(tok[tok.length - 1])) goals = +tok.pop();
      if (tok.length > 1 && R.ocr && R.ocr.normPos(tok[tok.length - 1]) && tok[tok.length - 1].length <= 11) { pos = R.ocr.normPos(tok.pop()); }
      var name = tok.join(' ').trim();
      if (!/[A-Za-zÄÖÜäöüß]/.test(name)) return;
      out.push({ nr: nr, name: name.slice(0, 40), pos: pos, goals: goals, games: goals ? 1 : 0 });
    });
    return out;
  };
  CL.rosterText = function (list) { return (list || []).map(function (p) { return (p.nr != null ? p.nr + ' ' : '') + p.name + (p.pos ? ' ' + p.pos : ''); }).join('\n'); };

  // ---------- PDF-Spielbericht von handball.net (Textpositionen aus pdf.js; gleiche Logik wie Handball-Live) ----------
  CL.parseReport = function (pages) {
    var Rp = { meta: {}, roster: { heim: [], gast: [] } }, cur = null;
    var metaLabels = { nr: 'Spielnummer', datum: 'Datum', heim: 'Heimmannschaft', gast: 'Gastmannschaft', endstand: 'Endstand', klasse: 'Spielklasse', ort: 'Spielort' };
    pages.forEach(function (pg) {
      var it = pg.items.filter(function (i) { return i.s && i.s.trim(); }).map(function (i) { return { x: i.x, y: i.y, s: i.s.trim() }; });
      Object.keys(metaLabels).forEach(function (k) {
        if (Rp.meta[k]) return;
        var a = it.filter(function (i) { return i.s === metaLabels[k]; })[0]; if (!a) return;
        var v = it.filter(function (i) { return Math.abs(i.y - a.y) < 3 && i.x > a.x + 5; }).sort(function (p, q) { return p.x - q.x; })[0];
        if (v) Rp.meta[k] = v.s;
      });
      var sorted = it.slice().sort(function (a, b) { return b.y - a.y || a.x - b.x; }), lines = [];
      sorted.forEach(function (i) { var l = lines.filter(function (l) { return Math.abs(l.y - i.y) < 3; })[0]; if (l) l.items.push(i); else lines.push({ y: i.y, items: [i] }); });
      lines.forEach(function (l) { l.items.sort(function (a, b) { return a.x - b.x; }); });
      lines.forEach(function (l) {
        var f = l.items[0], h = /^(Heim|Gast):\s*(.*)$/.exec(f.s);
        if (h) { cur = h[1].toLowerCase(); return; }
        if (f.s === 'Spielverlauf' || f.s === 'Team') { cur = null; return; }
        if (!cur) return;
        var name = l.items.filter(function (i) { return i.x > f.x + 8 && i.x < f.x + 350 && /[A-Za-zÄÖÜäöüß]/.test(i.s); })[0];
        if (!name || f.x > 90 || l.y < 32) return;
        if (/^\d{1,3}$/.test(f.s)) {
          var rest = l.items.filter(function (i) { return i.x > name.x + 100; });
          var tore = rest.filter(function (i) { return /^\d+$/.test(i.s); })[0];
          Rp.roster[cur].push({ nr: +f.s, name: name.s, goals: tore ? +tore.s : 0 });
        }
      });
    });
    return Rp;
  };
  var PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';
  function loadScript(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error('PDF-Leser konnte nicht geladen werden (Internetverbindung?)')); }; document.head.appendChild(s); }); }
  CL.ensurePdf = function () {
    if (window.pdfjsLib && window.pdfjsWorker) return Promise.resolve();
    return (window.pdfjsLib ? Promise.resolve() : loadScript(PDFJS + 'pdf.min.js')).then(function () { return window.pdfjsWorker ? null : loadScript(PDFJS + 'pdf.worker.min.js'); })
      .then(function () { window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js'; });
  };
  CL.readPdf = function (file) {
    return CL.ensurePdf().then(function () { return file.arrayBuffer(); }).then(function (buf) {
      return window.pdfjsLib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, disableFontFace: true, verbosity: 0 }).promise;
    }).then(function (doc) {
      var pages = [], chain = Promise.resolve();
      for (var i = 1; i <= doc.numPages; i++) (function (n) {
        chain = chain.then(function () { return doc.getPage(n); }).then(function (pg) { return pg.getTextContent(); })
          .then(function (tc) { pages.push({ items: tc.items.map(function (x) { return { x: x.transform[4], y: x.transform[5], s: x.str }; }) }); });
      })(i);
      return chain.then(function () { return CL.parseReport(pages); });
    });
  };

  // ---------- Sammeln: mehrere Spielberichte zu Liga + Kadern zusammenführen ----------
  CL.emptyDraft = function () { return { name: '', teams: [], rosters: {}, own: '', ownRoster: '', age: 18, reports: 0, teamsText: '' }; };
  CL.addTeam = function (dr, name) {
    name = String(name || '').replace(/\s+/g, ' ').trim(); if (!name) return null;
    var k = norm(name), hit = dr.teams.filter(function (t) { return norm(t) === k; })[0];
    if (hit) return hit;
    dr.teams.push(name.slice(0, 40)); return name.slice(0, 40);
  };
  CL.addReport = function (dr, rep) {
    var m = rep.meta || {}, found = 0;
    if (!dr.name && m.klasse) dr.name = m.klasse.slice(0, 40);
    ['heim', 'gast'].forEach(function (side) {
      var team = CL.addTeam(dr, m[side]); if (!team) return;
      var list = dr.rosters[team] || (dr.rosters[team] = []);
      (rep.roster[side] || []).forEach(function (p) {
        var k = norm(p.name), hit = list.filter(function (q) { return norm(q.name) === k; })[0];
        if (hit) { hit.goals += p.goals || 0; hit.games++; if (p.nr != null) hit.nr = p.nr; }
        else list.push({ nr: p.nr, name: p.name, goals: p.goals || 0, games: 1 });
        found++;
      });
    });
    dr.reports++;
    return found;
  };
  // Prüfen, ob der Entwurf spielbar ist
  CL.check = function (dr) {
    var errs = [];
    if (!dr) return ['Keine Liga angelegt.'];
    if (dr.teams.length < 4) errs.push('Mindestens 4 Mannschaften nötig (eine pro Zeile).');
    if (dr.teams.length > 20) errs.push('Höchstens 20 Mannschaften.');
    if (!dr.own || dr.teams.indexOf(dr.own) < 0) errs.push('Bitte die eigene Mannschaft auswählen.');
    return errs;
  };
  // Endgültige Ligadaten für W.newGame
  CL.finalize = function (dr) {
    var own = CL.parseRoster(dr.ownRoster), byName = {};
    (dr.rosters[dr.own] || []).forEach(function (p) { byName[norm(p.name)] = p; });
    own.forEach(function (p) { var o = byName[norm(p.name)]; if (o) { p.goals = o.goals; p.games = o.games; if (p.nr == null) p.nr = o.nr; } });
    if (!own.length) own = (dr.rosters[dr.own] || []).map(function (p) { return { nr: p.nr, name: p.name, goals: p.goals, games: p.games, pos: null }; });
    return {
      name: (dr.name || 'Eigene Liga').slice(0, 40), age: R.clamp(+dr.age || 18, 8, 45),
      teams: dr.teams.map(function (t) { return { name: t, short: CL.shortName(t), own: t === dr.own, players: t === dr.own ? own : (dr.rosters[t] || []).map(function (p) { return { nr: p.nr, name: p.name, goals: p.goals, games: p.games }; }) }; })
    };
  };

  // ---------- Spielwelt: Vereine und Spieler der eigenen Liga anlegen (aus W.newGame) ----------
  var PALETTE = [['#dc2626', '#ffffff'], ['#1d4ed8', '#ffffff'], ['#16a34a', '#ffffff'], ['#111827', '#facc15'], ['#7c3aed', '#ffffff'], ['#ea580c', '#111827'], ['#0891b2', '#ffffff'], ['#be123c', '#fde68a'], ['#15803d', '#fef08a'], ['#1e3a8a', '#f97316'], ['#334155', '#ffffff'], ['#b91c1c', '#111827']];
  function hash(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100003; return h; }
  CL.nextIdx = function (st) { var mx = 0; Object.keys(st.clubs).forEach(function (k) { var n = parseInt(k.slice(1), 10); if (n > mx) mx = n; }); return mx; };
  CL.makeClubs = function (st, cfg, ncOwn) {
    var W = R.world, idx = CL.nextIdx(st), own = null;
    cfg.teams.forEach(function (t) {
      var col = PALETTE[hash(t.name) % PALETTE.length];
      var row = [t.name, t.short, CL.cityOf(t.name), col[0], col[1], CL.TIER, 0.06 + (hash(t.name + 'q') % 10) / 100, 250 + hash(t.name + 'f') % 500, 0, null, 250];
      if (t.own && ncOwn) row = [ncOwn.name || t.name, ncOwn.short || t.short, ncOwn.city || CL.cityOf(t.name), ncOwn.color1 || col[0], ncOwn.color2 || col[1], CL.TIER, 0.12, 400, 0, null, 250];
      var c = W.makeClub(st, row, idx++);
      c.custom = true; c.customRoster = (t.players || []).length > 0; c.realName = t.name;
      c.stadiumName = (c.short.length < 12 ? c.short : c.city) + '-Halle';
      if (t.own) own = c;
    });
    return own;
  };
  // Positionen: Torhüter nach typischen Nummern, Feldspieler nach Toren verteilt (später im Editor änderbar)
  var FIELD = ['RUE', 'RUE', 'AUS', 'RUE', 'KRS', 'AUS', 'RUE', 'AUS', 'KRS', 'RUE', 'AUS', 'RUE', 'AUS', 'KRS', 'RUE'];
  CL.makePlayers = function (st, club, list, cfg) {
    var W = R.world, mean = R.season.leagueMean(st, CL.TIER), age = cfg.age || 18;
    var withPos = list.filter(function (p) { return p.pos; }).length;
    var keepers = list.filter(function (p) { return p.pos === 'TW'; });
    if (!keepers.length && !withPos) keepers = list.filter(function (p) { return [1, 12, 16, 20, 30, 33].indexOf(p.nr) >= 0 && !(p.goals > 0); }).slice(0, 3);
    if (!keepers.length) keepers = list.slice().sort(function (a, b) { return (a.goals / Math.max(1, a.games)) - (b.goals / Math.max(1, b.games)); }).slice(0, 1);
    var field = list.filter(function (p) { return keepers.indexOf(p) < 0; }).sort(function (a, b) { return (b.goals / Math.max(1, b.games)) - (a.goals / Math.max(1, a.games)); });
    var avg = R.avg(field, function (p) { return p.goals / Math.max(1, p.games); }) || 0;
    function make(p, pos) {
      var gpg = p.goals / Math.max(1, p.games);
      var ovr = pos === 'TW' ? R.gauss(mean, 3) : mean + R.clamp((gpg - avg) * 2.2, -6, 10) + R.gauss(0, 2);
      var pl = W.genPlayer(st, pos, R.clamp(Math.round(ovr), 20, 80), R.clamp(Math.round(R.gauss(age, 1.2)), Math.max(8, age - 2), age + 3), club.id);
      var nm = CL.splitName(p.name); pl.first = nm.first; pl.last = nm.last;
      if (p.nr != null) pl.shirt = p.nr;
      pl.imported = true; pl.contract = R.randInt(1, 3);
      if (W.recalc) W.recalc(pl);
      return pl;
    }
    keepers.forEach(function (p) { make(p, 'TW'); });
    field.forEach(function (p, i) { make(p, p.pos && p.pos !== 'TW' ? p.pos : FIELD[i % FIELD.length]); });
  };
  // Kader auffüllen (mind. 2 TW, 14 Spieler); Vereine ohne Kader bekommen einen erzeugten Kader
  CL.fillSquad = function (st, club, cfg) {
    var W = R.world, mean = R.season.leagueMean(st, CL.TIER), age = cfg.age || 18;
    var need = { TW: 2, AUS: 3, RUE: 4, KRS: 2 }, sq = W.squad(st, club.id);
    Object.keys(need).forEach(function (pos) { var have = sq.filter(function (p) { return p.pos === pos; }).length; while (have++ < need[pos]) W.genPlayer(st, pos, R.clamp(Math.round(R.gauss(mean - 1, 3)), 20, 80), R.clamp(Math.round(R.gauss(age, 1.2)), Math.max(8, age - 2), age + 3), club.id); });
    while (W.squad(st, club.id).length < 14) W.genPlayer(st, R.pick(['RUE', 'AUS', 'KRS', 'RUE']), R.clamp(Math.round(R.gauss(mean - 1, 3)), 20, 80), R.clamp(Math.round(R.gauss(age, 1.2)), Math.max(8, age - 2), age + 3), club.id);
  };
  CL.populate = function (st, cfg) {
    var W = R.world;
    st.leagueMean = st.leagueMean || {};
    st.leagueMean[CL.TIER] = Math.round((st.leagueMean[3] || 52) - 10);
    cfg.teams.forEach(function (t) {
      var c = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (x) { return x.custom && x.realName === t.name; })[0];
      if (!c) return;
      if (t.players && t.players.length) CL.makePlayers(st, c, t.players, cfg);
      CL.fillSquad(st, c, cfg);
    });
  };

  // ---------- Saisonende: Meister steigt auf, schwächster Staffel-Letzter der 3. Liga steigt ab ----------
  CL.downFrom3 = function (st) {
    var rows = [3, 4, 5, 6].map(function (l) { var r = st.finalRows && st.finalRows[l]; return r && r.length ? r[r.length - 1] : null; }).filter(Boolean);
    rows.sort(function (a, b) { return (a.pts / Math.max(1, a.p)) - (b.pts / Math.max(1, b.p)) || (a.gf - a.ga) - (b.gf - b.ga); });
    return rows.length ? rows[0].id : null;
  };
})(RFM);
