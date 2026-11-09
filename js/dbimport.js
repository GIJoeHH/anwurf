// ANWURF! – Spielerdaten aktualisieren (echte Spielwelt)
// Liest CSV-Dateien in zwei Formaten:
//   • ANWURF-Format: ANWURF_*_Spieler.csv (+ optional ANWURF_*_Vereine.csv)
//   • Original-EA-Datensatz: players.csv (EA_FC_ANALYSIS, Spalten overall_rating, club, league …) – daraus
//     werden 1. Bundesliga, 2. Bundesliga und 3. Liga übernommen
// und erzeugt daraus eine Datenbank im Format von data_real.js. Diese kann
//   • für neue Karrieren gespeichert werden (dieses Gerät) und
//   • in eine laufende Karriere übernommen werden (Stärken, Wechsel, neue und abgewanderte Spieler).
// Wird auch vom Werkzeug tools/update_real_db.sh verwendet (gleiche Logik für Upload und Skript).
(function (R) {
  var D = R.data, W = R.world;
  var DI = R.dbimport = {};
  var STORE_KEY = 'anwurf_realdb';

  var PLAYER_COLS = ['extId', 'first', 'last', 'dob', 'age', 'nat', 'club', 'posA', 'altA', 'posEA', 'ovr', 'schnelligkeit', 'schuss', 'passspiel', 'dribbling', 'verteidigung', 'physis', 'ausdauer', 'ballkontrolle', 'kurzpass', 'abschluss', 'defensivbewusstsein', 'keeper_hechten', 'keeper_fangen', 'keeper_abstoss', 'keeper_stellungsspiel', 'keeper_reflexe', 'foot', 'skills', 'weakFoot'];
  var CLUB_COLS = ['name', 'short', 'city', 'color1', 'color2', 'league', 'fans', 'avgOvr', 'bestOvr', 'players', 'source'];
  var ATTR_ANP = ['schnelligkeit_ea', 'schuss_ea', 'passspiel_ea', 'dribbling_ea', 'verteidigung_ea', 'physis_ea', 'ausdauer_ea', 'ballkontrolle_ea', 'kurzpass_ea', 'abschluss_ea', 'defensivbewusstsein_ea', 'keeper_hechten_ea', 'keeper_fangen_ea', 'keeper_abstoss_ea', 'keeper_stellungsspiel_ea', 'keeper_reflexe_ea'];
  var ATTR_EA = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physicality', 'power_stamina', 'skill_ball_control', 'attacking_short_passing', 'attacking_finishing', 'defending_awareness', 'goalkeeping_diving', 'goalkeeping_handling', 'goalkeeping_kicking', 'goalkeeping_positioning', 'goalkeeping_reflexes'];
  var EA_POS = { GK: 'TW', CB: 'IV', LB: 'AV', RB: 'AV', LWB: 'AV', RWB: 'AV', CDM: 'DM', CM: 'ZM', CAM: 'OM', LM: 'FL', RM: 'FL', LW: 'FL', RW: 'FL', ST: 'ST', CF: 'ST' };
  // Ligen im EA-Datensatz → ANWURF-Liga
  DI.EA_LEAGUES = { 'Bundesliga': 1, 'Bundesliga 2': 2, '2. Bundesliga': 2, '3. Liga': 3 };
  DI.EA_URL = 'https://raw.githubusercontent.com/LakshmiKanth11/EA_FC_ANALYSIS/main/EA_FC_PLAYERS_DATASET_AND_%20DASHBOARD/data/players.csv';

  // ---------- CSV ----------
  DI.parseCSV = function (text) {
    text = String(text || '').replace(/^﻿/, '');
    var first = text.slice(0, text.indexOf('\n') > 0 ? text.indexOf('\n') : text.length);
    var sep = (first.split(';').length > first.split(',').length) ? ';' : ',';
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
        else cur += ch;
      } else if (ch === '"') q = true;
      else if (ch === sep) { row.push(cur); cur = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cur); cur = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
      } else cur += ch;
    }
    if (cur !== '' || row.length) { row.push(cur); if (row.length > 1 || row[0] !== '') rows.push(row); }
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim(); });
    return rows.slice(1).map(function (r) { var o = {}; head.forEach(function (h, j) { o[h] = r[j] != null ? r[j].trim() : ''; }); return o; });
  };
  DI.kind = function (rows) {
    if (!rows.length) return null;
    var k = rows[0];
    if ('position_anpfiff' in k && 'gesamtstaerke' in k) return 'anpfiff';
    if ('anzahl_spieler' in k && 'verein' in k) return 'anpfiffClubs';
    if ('overall_rating' in k && 'club' in k && 'league' in k) return 'ea';
    return null;
  };

  // ---------- Hilfen ----------
  function num(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
  function isoDate(s) { // 25-04-1995 → 1995-04-25; ISO bleibt
    s = String(s || '').trim();
    var m = /^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})$/.exec(s);
    if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
  }
  function ageAt(dob, stamp) {
    if (!dob || !stamp) return 0;
    var a = +stamp.slice(0, 4) - +dob.slice(0, 4);
    if (stamp.slice(5) < dob.slice(5)) a--;
    return a;
  }
  // Anzeigename in Vor- und Nachname zerlegen (wie die Namen im Spiel dargestellt werden)
  DI.splitName = function (disp, first, last) {
    disp = String(disp || '').trim(); first = String(first || '').trim(); last = String(last || '').trim();
    if (!disp) disp = (first + ' ' + last).trim();
    if (disp === (first + ' ' + last).trim()) return [first, last];
    var t = disp.split(/\s+/);
    if (t.length === 1) return ['', disp];
    var lt = {}; last.split(/\s+/).forEach(function (x) { lt[x] = 1; });
    for (var i = 1; i < t.length; i++) {
      if (t.slice(i).every(function (x) { return lt[x]; }) && !lt[t[0]]) return [t.slice(0, i).join(' '), t.slice(i).join(' ')];
    }
    return ['', disp];
  };
  function anpAlt(main, list) { // EA-Nebenpositionen → ANWURF-Kürzel (ohne Hauptposition, ohne Doppelte)
    var out = [];
    String(list || '').split(/[\s,]+/).forEach(function (x) { var a = EA_POS[x]; if (a && a !== main && out.indexOf(a) < 0) out.push(a); });
    return out.join(' ');
  }
  // Bekannte Vereine (aktuelle Datenbank) – liefert Stammdaten (Kurzname, Stadt, Farben, Fans) und Namenszuordnung
  function knownClubs() {
    var RD = D.real, out = { byName: {}, bySource: {} };
    if (!RD || !RD.clubs) return out;
    var cc = {}; RD.clubCols.forEach(function (k, i) { cc[k] = i; });
    RD.clubs.forEach(function (r) {
      var o = { name: r[cc.name], short: r[cc.short], city: r[cc.city], color1: r[cc.color1], color2: r[cc.color2], fans: r[cc.fans], source: cc.source != null ? r[cc.source] : '' };
      out.byName[o.name] = o; if (o.source) out.bySource[o.source] = o;
    });
    return out;
  }

  // ---------- Umwandeln ----------
  // files: [{ name, text }] → { ok, db, report: { format, errors, warnings, stats } }
  DI.convert = function (files) {
    var errors = [], warnings = [], players = [], clubInfo = {}, format = [], stamp = '';
    var known = knownClubs();
    files.forEach(function (f) {
      var rows = DI.parseCSV(f.text), kind = DI.kind(rows);
      if (!kind) { errors.push('„' + f.name + '“: unbekanntes Format (erwartet: ANWURF-Spieler-CSV, ANWURF-Vereins-CSV oder EA-players.csv)'); return; }
      format.push(kind === 'ea' ? 'EA-Originaldaten' : kind === 'anpfiff' ? 'ANWURF-Spieler' : 'ANWURF-Vereine');
      if (kind === 'anpfiffClubs') {
        rows.forEach(function (c) { clubInfo[c.verein] = { league: num(c.liga_id), source: c.verein_quelle || '' }; });
        return;
      }
      rows.forEach(function (r) {
        var p;
        if (kind === 'anpfiff') {
          var nm = DI.splitName(r.spielername, r.vorname, r.nachname);
          stamp = stamp || isoDate(r.datenstand_iso);
          p = { extId: num(r.player_id), first: nm[0], last: nm[1], dob: isoDate(r.geburtsdatum_iso), age: num(r.alter_am_stichtag), nat: r.nationalitaet, club: r.verein, source: r.verein_quelle || '', league: num(r.liga_id), posA: r.position_anpfiff, altA: r.nebenpositionen_anpfiff, posEA: r.position_ea, ovr: num(r.gesamtstaerke), attrs: ATTR_ANP.map(function (k) { return num(r[k]); }), foot: (r.starker_fuss || 'R').charAt(0), skills: num(r.skills_sterne), weakFoot: num(r.schwacher_fuss_sterne) };
        } else {
          var lg = DI.EA_LEAGUES[r.league];
          if (!lg || (r.gender && !/^men/i.test(r.gender))) return;
          var st_ = isoDate(r.snapshot_date); stamp = stamp || st_;
          var nm2 = DI.splitName(r.common_name || '', r.first_name, r.last_name);
          var kc = known.bySource[r.club] || known.byName[r.club];
          var dob = isoDate(r.birthdate);
          p = { extId: num(r.player_id), first: nm2[0], last: nm2[1], dob: dob, age: ageAt(dob, st_), nat: r.nationality, club: kc ? kc.name : r.club, source: r.club, league: lg, posA: EA_POS[r.position] || 'ZM', altA: anpAlt(EA_POS[r.position], r.alternate_positions), posEA: r.position, ovr: num(r.overall_rating), attrs: ATTR_EA.map(function (k) { return num(r[k]); }), foot: (r.preferred_foot || 'R').charAt(0), skills: num(r.skill_moves), weakFoot: num(r.weak_foot) };
        }
        players.push(p);
      });
    });
    if (!players.length && !errors.length) errors.push('Keine Spielerdaten gefunden (die Vereins-CSV allein reicht nicht).');

    // Dubletten (gleiche Spieler-ID oder gleicher Name + Geburtsdatum) entfernen
    var seen = {}, seenP = {}, uniq = [], dup = 0;
    players.forEach(function (p) {
      var key = (p.first + ' ' + p.last).toLowerCase() + '|' + p.dob;
      if (!p.extId || seen[p.extId] || (p.dob && seenP[key])) { dup++; return; }
      if (p.ovr < 1 || p.ovr > 99) { warnings.push('Ungültige Gesamtstärke bei ' + p.first + ' ' + p.last + ' – übersprungen'); return; }
      seen[p.extId] = 1; if (p.dob) seenP[key] = 1; uniq.push(p);
    });
    if (dup) warnings.push(dup + ' doppelte Spielereinträge wurden ignoriert.');

    // Vereine
    var clubs = {}, order = [];
    uniq.forEach(function (p) {
      var ci = clubInfo[p.club];
      if (ci && ci.league && ci.league !== p.league) warnings.push(p.first + ' ' + p.last + ': Liga laut Spielerliste ' + p.league + ', laut Vereinsliste ' + ci.league + ' – Vereinsliste gilt.');
      if (!clubs[p.club]) { clubs[p.club] = { name: p.club, league: ci && ci.league ? ci.league : 0, votes: {}, source: (ci && ci.source) || p.source || '', players: [] }; order.push(p.club); }
      var cl = clubs[p.club]; cl.players.push(p); cl.votes[p.league] = (cl.votes[p.league] || 0) + 1;
    });
    // Liga eines Vereins: laut Vereinsliste, sonst die Liga der meisten seiner Spieler
    order.forEach(function (n) { var c = clubs[n]; if (!c.league) c.league = +Object.keys(c.votes).sort(function (a, b) { return c.votes[b] - c.votes[a]; })[0]; });
    var perLeague = { 1: 0, 2: 0, 3: 0 };
    order.forEach(function (n) { var c = clubs[n]; perLeague[c.league] = (perLeague[c.league] || 0) + 1; });
    [1, 2, 3].forEach(function (l) {
      if (!perLeague[l]) errors.push('Liga ' + l + ' hat keine Vereine.');
      else if (perLeague[l] % 2) errors.push('Liga ' + l + ' hat ' + perLeague[l] + ' Vereine – für den Spielplan wird eine gerade Anzahl gebraucht.');
    });
    order.forEach(function (n) {
      var c = clubs[n], gk = c.players.filter(function (p) { return p.posA === 'TW'; }).length;
      if (c.players.length < 16) warnings.push(n + ': nur ' + c.players.length + ' Spieler (die KI füllt zum Saisonwechsel auf).');
      if (gk < 1) errors.push(n + ': kein Torwart im Kader.');
      if (!known.byName[n] && !known.bySource[c.source]) warnings.push('Neuer Verein ohne Stammdaten: ' + n + ' (Farben/Fans geschätzt, im Editor änderbar).');
    });
    // Sortierung wie in der Vereinsliste: nach Liga, dann Name (Zeichencode-Reihenfolge, damit die Vereinsnummern stabil bleiben)
    order.sort(function (a, b) { return clubs[a].league - clubs[b].league || (a < b ? -1 : a > b ? 1 : 0); });
    var clubRows = order.map(function (n) {
      var c = clubs[n], k = known.byName[n] || known.bySource[c.source] || {};
      var ovrs = c.players.map(function (p) { return p.ovr; });
      return [n, k.short || n.replace(/^(1\.\s*)?(FC|SV|VfL|VfB|SC|TSV|SG|SSV|FSV|SpVgg|TSG)\s+/, '').slice(0, 14), k.city || n, k.color1 || '#64748b', k.color2 || '#ffffff', c.league, k.fans || { 1: 30000, 2: 16000, 3: 5000 }[c.league], Math.round(R.avg(ovrs) * 10) / 10, Math.max.apply(null, ovrs), c.players.length, c.source];
    });
    var idx = {}; order.forEach(function (n, i) { idx[n] = i; });
    var playerRows = [];
    order.forEach(function (n) { clubs[n].players.forEach(function (p) { playerRows.push([p.extId, p.first, p.last, p.dob, p.age, p.nat, idx[n], p.posA, p.altA, p.posEA, p.ovr].concat(p.attrs).concat([p.foot === 'L' ? 'L' : 'R', p.skills, p.weakFoot])); }); });
    stamp = stamp || new Date().toISOString().slice(0, 10);
    var season = +stamp.slice(5, 7) >= 7 ? +stamp.slice(0, 4) : +stamp.slice(0, 4) - 1;
    var db = {
      source: (format.indexOf('EA-Originaldaten') >= 0 ? 'EA SPORTS FC (Originaldaten)' : 'ANWURF-CSV') + ', Datenstand ' + stamp,
      season: season, stamp: stamp, clubCols: CLUB_COLS, clubs: clubRows,
      derbies: (D.real && D.real.derbies) || [], playerCols: PLAYER_COLS, players: playerRows
    };
    var stats = { clubs: clubRows.length, players: playerRows.length, leagues: perLeague, stamp: stamp, duplicates: dup };
    return { ok: !errors.length, db: errors.length ? null : db, report: { format: format.join(' + '), errors: errors, warnings: warnings, stats: stats } };
  };

  // ---------- Datenbank für neue Karrieren (dieses Gerät) ----------
  DI.builtIn = D.real || null;
  // Speichert die Daten für neue Karrieren; false = nur für diese Sitzung (Speicher nicht verfügbar)
  DI.saveOverride = function (db) { D.real = db; try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); return true; } catch (e) { return false; } };
  DI.hasOverride = function () { return !!DI.override(); };
  DI.clearOverride = function () { try { localStorage.removeItem(STORE_KEY); } catch (e) {} D.real = DI.builtIn; };
  DI.override = function () { try { var s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  // Beim Start: hochgeladene Daten verwenden, solange sie nicht älter sind als die mitgelieferten
  DI.loadOverride = function () {
    var o = DI.override(); if (!o || !o.players) return;
    var builtStamp = (DI.builtIn && DI.builtIn.stamp) || '2026-09-12';
    if ((o.stamp || '') >= builtStamp) D.real = o; else DI.clearOverride();
  };
  if (typeof localStorage !== 'undefined') DI.loadOverride();

  // ---------- In eine laufende Karriere übernehmen ----------
  // Eigener Kader bleibt unangetastet; Spieler wechseln nie automatisch zum eigenen Verein.
  DI.applyToCareer = function (st, db, dryRun) {
    var rep = { updated: 0, moved: [], added: 0, removed: 0, untouchedOwn: 0, unknownClubs: [], ownTargets: 0 };
    if (st.world !== 'real') { rep.notReal = true; return rep; }
    var userId = st.manager.unemployed ? null : st.manager.clubId;
    var byName = {}; Object.keys(st.clubs).forEach(function (k) { var c = st.clubs[k]; byName[c.realName || c.name] = c; if (!byName[c.name]) byName[c.name] = c; });
    var cc = {}; db.clubCols.forEach(function (k, i) { cc[k] = i; });
    var byExt = {}; Object.keys(st.players).forEach(function (k) { var p = st.players[k]; if (p.extId) byExt[p.extId] = p; });
    var inData = {}, touched = {};
    var unknown = {};
    db.players.forEach(function (row) {
      var c = W.realRow(row, db.playerCols), clubRow = db.clubs[c.club], target = byName[clubRow[cc.name]] || null;
      if (!target) unknown[clubRow[cc.name]] = 1;
      inData[c.extId] = 1;
      var p = byExt[c.extId];
      if (p) {
        if (userId && p.clubId === userId) { rep.untouchedOwn++; return; }
        if (p.ovr !== c.ovr || p.posDetail !== c.posA) { rep.updated++; if (!dryRun) { W.applyRealRating(p, c); p.pot = Math.max(p.pot, p.ovr); p.value = W.marketValue(p); } }
        var dest = target && target.id !== userId ? target.id : (target ? p.clubId : null);
        if (target && target.id === userId) rep.ownTargets++;
        if (dest !== p.clubId) {
          rep.moved.push({ name: W.playerName(p), from: p.clubId ? st.clubs[p.clubId].short : 'vereinslos', to: dest ? st.clubs[dest].short : 'vereinslos' });
          if (!dryRun) {
            if (p.clubId) touched[p.clubId] = 1;
            if (dest) { touched[dest] = 1; R.transfers.executeTransfer(st, p, st.clubs[dest], 0, Math.max(p.wage, W.fairWage(p)), R.randInt(2, 4)); }
            else { R.editor.movePlayer(st, p, null); p.freeSince = st.season; }
          }
        }
      } else {
        rep.added++;
        if (!dryRun) {
          var np = W.importPlayer(st, row, db.playerCols, target && target.id !== userId ? target.id : null);
          if (!np.clubId) np.freeSince = st.season; else touched[np.clubId] = 1;
        }
      }
    });
    // Nicht mehr in den Daten (z. B. ins Ausland gewechselt): verlassen die Spielwelt – außer im eigenen Kader
    Object.keys(byExt).forEach(function (ext) {
      var p = byExt[ext];
      if (inData[ext] || !p.clubId || p.clubId === userId) return;
      rep.removed++;
      if (!dryRun) { touched[p.clubId] = 1; R.editor.deletePlayer(st, p.id); }
    });
    rep.unknownClubs = Object.keys(unknown);
    if (!dryRun) {
      Object.keys(touched).forEach(function (id) { var c = st.clubs[id]; if (c && !c.userControlled) { c.manualLineup = false; if (R.match && R.match.autoBest) R.match.autoBest(st, c); } });
      st.realDataStamp = db.stamp;
      R.season.news(st, 'Spielerdaten aktualisiert (Stand ' + db.stamp.split('-').reverse().join('.') + ')',
        rep.updated + ' Stärken angepasst, ' + rep.moved.length + ' Wechsel, ' + rep.added + ' neue Spieler, ' + rep.removed + ' Abgänge aus der Liga. Ihr eigener Kader blieb unverändert.', 'transfer');
    }
    return rep;
  };
  // Gibt es neuere Daten als die, mit denen die Karriere zuletzt abgeglichen wurde?
  DI.careerOutdated = function (st) {
    return !!(st && st.world === 'real' && D.real && D.real.stamp && (st.realDataStamp || '2026-09-12') < D.real.stamp);
  };
})(RFM);
