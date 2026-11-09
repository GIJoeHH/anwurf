// ANWURF! – Datenbankeditor, Import/Export, OCR-Textauswertung
(function (R) {
  var D = R.data, W = R.world;
  var ED = R.editor = {};

  function setOvr(p, target) {
    target = R.clamp(+target, 1, 99);
    for (var i = 0; i < 4; i++) {
      var d = target - W.overallFor(p, p.pos);
      D.attrKeys.forEach(function (k) { p.attr[k] = R.clamp(p.attr[k] + d, 1, 99); });
    }
    W.recalc(p);
  }
  ED.updatePlayer = function (st, id, f) {
    var p = st.players[id]; if (!p) return { ok: false };
    ['first', 'last'].forEach(function (k) { if (f[k] != null && String(f[k]).trim()) p[k] = String(f[k]).trim().slice(0, 30); });
    if (f.age != null) p.age = R.clamp(parseInt(f.age, 10) || p.age, 15, 45);
    if (f.birthYear != null) p.age = R.clamp(st.season - parseInt(f.birthYear, 10), 15, 45);
    if (f.pos && D.positions.indexOf(f.pos) >= 0) p.pos = f.pos;
    if (f.alt != null) p.alt = (Array.isArray(f.alt) ? f.alt : String(f.alt).split(/[ ,]+/)).filter(function (x) { return D.positions.indexOf(x) >= 0 && x !== p.pos; });
    if (f.attr) D.attrKeys.forEach(function (k) { if (f.attr[k] != null && !isNaN(+f.attr[k])) p.attr[k] = R.clamp(+f.attr[k], 1, 99); });
    W.recalc(p);
    if (f.ovrTarget != null && !isNaN(+f.ovrTarget)) setOvr(p, f.ovrTarget);
    if (f.pot != null && !isNaN(+f.pot)) p.pot = R.clamp(+f.pot, p.ovr, 99);
    if (f.wage != null && !isNaN(+f.wage)) p.wage = Math.max(0, Math.round(+f.wage));
    if (f.contract != null && !isNaN(+f.contract)) p.contract = R.clamp(parseInt(f.contract, 10), 0, 6);
    if (f.clubId !== undefined && f.clubId !== p.clubId) ED.movePlayer(st, p, f.clubId || null);
    p.value = W.marketValue(p);
    if (f.value != null && !isNaN(+f.value) && +f.value > 0) p.value = Math.round(+f.value);
    return { ok: true, p: p };
  };
  ED.movePlayer = function (st, p, clubId) {
    var old = p.clubId && st.clubs[p.clubId];
    if (old) { old.lineup = (old.lineup || []).map(function (x) { return x === p.id ? null : x; }); old.bench = (old.bench || []).filter(function (x) { return x !== p.id; }); old.manualLineup = false; }
    p.clubId = clubId && st.clubs[clubId] ? clubId : null;
    if (p.clubId) st.clubs[p.clubId].manualLineup = false;
  };
  ED.createPlayer = function (st, clubId, f) {
    var pos = D.positions.indexOf(f.pos) >= 0 ? f.pos : 'RUE';
    var p = W.genPlayer(st, pos, R.clamp(+f.ovr || 55, 1, 99), R.clamp(+f.age || 24, 15, 45), clubId && st.clubs[clubId] ? clubId : null);
    if (f.first) p.first = String(f.first).slice(0, 30);
    if (f.last) p.last = String(f.last).slice(0, 30);
    if (f.pot) p.pot = R.clamp(+f.pot, p.ovr, 99);
    p.imported = !!f.imported;
    if (clubId && st.clubs[clubId]) st.clubs[clubId].manualLineup = false;
    return p;
  };
  ED.deletePlayer = function (st, id) {
    var p = st.players[id]; if (!p) return false;
    ED.movePlayer(st, p, null);
    delete st.players[id];
    st.inbox = st.inbox.filter(function (o) { return o.pid !== id; });
    return true;
  };
  ED.updateClub = function (st, id, f) {
    var c = st.clubs[id]; if (!c) return { ok: false };
    ['name', 'short', 'city', 'stadiumName'].forEach(function (k) { if (f[k] != null && String(f[k]).trim()) c[k] = String(f[k]).trim().slice(0, 40); });
    if (f.color1) c.colors[0] = f.color1; if (f.color2) c.colors[1] = f.color2;
    if (f.crestShape != null) c.crest.shape = +f.crestShape; if (f.crestSymbol != null) c.crest.symbol = +f.crestSymbol;
    if (f.crestImage !== undefined) c.crestImage = f.crestImage || null;
    if (f.fans != null && !isNaN(+f.fans)) c.fans = R.clamp(Math.round(+f.fans), 500, 200000);
    if (f.reputation != null && !isNaN(+f.reputation)) c.reputation = R.clamp(Math.round(+f.reputation), 1, 100);
    if (f.cash != null && !isNaN(+f.cash)) c.cash = Math.round(+f.cash);
    if (f.capacityLevel) Object.keys(f.capacityLevel).forEach(function (k) { if (D.facilities[k]) c.fac[k] = R.clamp(+f.capacityLevel[k], D.facilities[k].min || 0, D.facilities[k].levels.length - 1); });
    if (f.fac) Object.keys(f.fac).forEach(function (k) { if (D.facilities[k]) c.fac[k] = R.clamp(+f.fac[k], D.facilities[k].min || 0, D.facilities[k].levels.length - 1); });
    // Ligawechsel nur in der Saisonvorbereitung, damit Spielpläne konsistent bleiben
    if (f.league && +f.league !== c.league) {
      if (st.phase !== 'preseason') return { ok: false, why: 'Ligawechsel nur in der Saisonvorbereitung möglich' };
      var other = W.clubsInLeague(st, +f.league).sort(function (a, b) { return a.reputation - b.reputation; })[0];
      if (other) { other.league = c.league; }
      c.league = +f.league;
      R.season.startSeason(st);
    }
    return { ok: true };
  };

  // ---------- Sponsoren ----------
  ED.sponsorFields = ['name', 'cat', 'amount', 'years', 'bonusTop', 'topN', 'bonusPromo', 'bonusTitle'];
  ED.updateSponsor = function (st, clubId, sid, f) {
    var c = st.clubs[clubId]; if (!c) return { ok: false };
    var s = c.sponsors.filter(function (x) { return x.id === sid; })[0]; if (!s) return { ok: false, why: 'Sponsor nicht gefunden' };
    if (f.name != null && String(f.name).trim()) s.name = String(f.name).trim().slice(0, 50);
    if (f.cat && D.sponsorCategories[f.cat]) {
      if (f.cat !== s.cat) c.sponsors = c.sponsors.filter(function (x) { return x === s || x.cat !== f.cat; });
      s.cat = f.cat;
    }
    ['amount', 'bonusTop', 'bonusPromo', 'bonusTitle'].forEach(function (k) { if (f[k] != null && !isNaN(+f[k])) s[k] = Math.max(0, Math.round(+f[k])); });
    if (f.years != null && !isNaN(+f.years)) s.years = R.clamp(parseInt(f.years, 10), 1, 10);
    if (f.topN != null && !isNaN(+f.topN)) s.topN = R.clamp(parseInt(f.topN, 10), 1, 18);
    return { ok: true, s: s };
  };
  ED.addSponsor = function (st, clubId, cat, f) {
    var c = st.clubs[clubId]; if (!c || !D.sponsorCategories[cat]) return { ok: false };
    c.sponsors = c.sponsors.filter(function (x) { return x.cat !== cat; });
    var s = W.genSponsor(st, c, cat);
    c.sponsors.push(s);
    if (f) ED.updateSponsor(st, clubId, s.id, f);
    st.inbox = st.inbox.filter(function (o) { return !(o.type === 'sponsor' && o.cat === cat && c.userControlled); });
    return { ok: true, s: s };
  };
  ED.deleteSponsor = function (st, clubId, sid) {
    var c = st.clubs[clubId]; if (!c) return false;
    var n = c.sponsors.length; c.sponsors = c.sponsors.filter(function (x) { return x.id !== sid; });
    return c.sponsors.length < n;
  };
  ED.setSponsorPool = function (st, text, kits) {
    var names = String(text || '').split(/\r?\n/).map(function (x) { return x.trim().slice(0, 50); }).filter(Boolean);
    if (kits) st.kitPool = names; else st.sponsorPool = names;
    return names.length;
  };

  // ---------- Datenbank Export/Import (getrennt von Spielständen) ----------
  ED.exportDB = function (st) {
    var clubs = Object.keys(st.clubs).map(function (k) {
      var c = st.clubs[k];
      return { id: c.id, name: c.name, short: c.short, city: c.city, colors: c.colors, crest: c.crest, crestImage: c.crestImage || null, league: c.league, reputation: c.reputation, fans: c.fans, cash: c.cash, stadiumName: c.stadiumName, fac: c.fac, sponsors: c.sponsors };
    });
    var players = Object.keys(st.players).map(function (k) {
      var p = st.players[k];
      return { id: p.id, first: p.first, last: p.last, age: p.age, pos: p.pos, alt: p.alt, attr: p.attr, pot: p.pot, wage: p.wage, contract: p.contract, clubId: p.clubId, youth: p.youth, photo: p.photo || null };
    });
    return { format: 'RFM-DB', version: 1, created: new Date().toISOString(), season: st.season, clubs: clubs, players: players, sponsorPool: st.sponsorPool || null, kitPool: st.kitPool || null };
  };
  ED.validateDB = function (db) {
    var errors = [];
    if (!db || db.format !== 'RFM-DB') errors.push('Kein RFM-Datenbankformat');
    if (!db || !Array.isArray(db.clubs)) errors.push('Vereinsliste fehlt');
    if (!db || !Array.isArray(db.players)) errors.push('Spielerliste fehlt');
    if (errors.length) return errors;
    var ids = {};
    db.clubs.forEach(function (c, i) { if (!c.id || !c.name) errors.push('Verein #' + (i + 1) + ' ohne ID/Name'); ids[c.id] = 1; });
    db.players.forEach(function (p, i) {
      if (!p.last) errors.push('Spieler #' + (i + 1) + ' ohne Nachnamen');
      if (D.positions.indexOf(p.pos) < 0) errors.push('Spieler ' + (p.last || i) + ': ungültige Position ' + p.pos);
      if (p.clubId && !ids[p.clubId]) errors.push('Spieler ' + (p.last || i) + ': unbekannter Verein ' + p.clubId);
    });
    return errors.slice(0, 20);
  };
  // Datenbank in einen laufenden Spielstand übernehmen (nur Stammdaten, Spielplan bleibt erhalten)
  ED.importDB = function (st, db) {
    var errs = ED.validateDB(db); if (errs.length) return { ok: false, errors: errs };
    db.clubs.forEach(function (c) {
      var t = st.clubs[c.id]; if (!t) return;
      ED.updateClub(st, c.id, { name: c.name, short: c.short, city: c.city, color1: c.colors && c.colors[0], color2: c.colors && c.colors[1], fans: c.fans, reputation: c.reputation, stadiumName: c.stadiumName, fac: c.fac, crestImage: c.crestImage });
      if (Array.isArray(c.sponsors)) {
        t.sponsors = [];
        c.sponsors.forEach(function (s) { if (s && D.sponsorCategories[s.cat]) { var r = ED.addSponsor(st, c.id, s.cat); ED.updateSponsor(st, c.id, r.s.id, s); } });
      }
    });
    if (Array.isArray(db.sponsorPool)) st.sponsorPool = db.sponsorPool.slice(0, 300);
    if (Array.isArray(db.kitPool)) st.kitPool = db.kitPool.slice(0, 100);
    var n = 0;
    db.players.forEach(function (p) {
      var ex = st.players[p.id];
      if (ex) { ED.updatePlayer(st, p.id, { first: p.first, last: p.last, age: p.age, pos: p.pos, alt: p.alt, attr: p.attr, pot: p.pot, wage: p.wage, contract: p.contract, clubId: p.clubId }); }
      else { var np = ED.createPlayer(st, p.clubId, { first: p.first, last: p.last, pos: p.pos, age: p.age, ovr: 55 }); if (p.attr) ED.updatePlayer(st, np.id, { attr: p.attr, pot: p.pot }); }
      n++;
    });
    return { ok: true, players: n };
  };
  ED.exportCSV = function (st, clubId) {
    var rows = [['Vorname', 'Nachname', 'Alter', 'Position', 'Stärke', 'Potenzial', 'Technik', 'Passspiel', 'Abschluss', 'Defensive', 'Tempo', 'Kondition', 'Torwart', 'Marktwert', 'Gehalt', 'Vertrag', 'Verein']];
    Object.keys(st.players).forEach(function (k) {
      var p = st.players[k];
      if (clubId && p.clubId !== clubId) return;
      rows.push([p.first, p.last, p.age, p.pos, p.ovr, p.pot].concat(D.attrKeys.map(function (a) { return Math.round(p.attr[a]); })).concat([p.value, p.wage, p.contract, p.clubId ? st.clubs[p.clubId].name : '']));
    });
    return rows.map(function (r) { return r.map(function (v) { v = String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(';'); }).join('\n');
  };
  ED.importCSV = function (st, text, clubId) {
    var lines = String(text || '').split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length < 2) return { ok: false, errors: ['Keine Datenzeilen gefunden'] };
    var n = 0, errors = [];
    lines.slice(1).forEach(function (l, i) {
      var c = l.split(';');
      if (c.length < 5 || !c[1]) { errors.push('Zeile ' + (i + 2) + ' unvollständig'); return; }
      var pos = R.ocr.normPos(c[3]) || 'RUE';
      ED.createPlayer(st, clubId, { first: c[0], last: c[1], age: +c[2] || 24, pos: pos, ovr: +c[4] || 55, pot: +c[5] || 0, imported: true });
      n++;
    });
    return { ok: n > 0, players: n, errors: errors };
  };

  // ---------- OCR-Textauswertung (Text kommt von Apple Vision in der Mac-App oder Tesseract im Browser) ----------
  var O = R.ocr = {};
  var POS = { TW: 'TW', T: 'TW', G: 'TW', GK: 'TW', TOR: 'TW', TORWART: 'TW', TORHÜTER: 'TW',
    AUS: 'AUS', AU: 'AUS', LA: 'AUS', RA: 'AUS', LW: 'AUS', RW: 'AUS', LINKSAUSSEN: 'AUS', RECHTSAUSSEN: 'AUS', LINKSAUßEN: 'AUS', RECHTSAUßEN: 'AUS', AUSSEN: 'AUS', AUßEN: 'AUS', FLÜGEL: 'AUS',
    RUE: 'RUE', RÜ: 'RUE', RL: 'RUE', RM: 'RUE', RR: 'RUE', LB: 'RUE', CB: 'RUE', RB: 'RUE', RÜCKRAUM: 'RUE', SPIELMACHER: 'RUE', MITTE: 'RUE', BACK: 'RUE',
    KRS: 'KRS', KM: 'KRS', KL: 'KRS', K: 'KRS', P: 'KRS', PIVOT: 'KRS', KREIS: 'KRS', KREISLÄUFER: 'KRS', KREISLAEUFER: 'KRS' };
  O.normPos = function (t) { return POS[String(t || '').toUpperCase().replace(/[^A-ZÄÖÜ]/g, '')] || null; };
  O.parseText = function (text) {
    var rows = [];
    String(text || '').split(/\r?\n/).forEach(function (line) {
      var tokens = line.replace(/[|,;:\t]/g, ' ').split(/\s+/).filter(Boolean);
      if (!tokens.length) return;
      var nums = [], names = [], pos = null, odd = 0;
      tokens.forEach(function (t, i) {
        var clean = t.replace(/[.()\[\]]/g, '');
        if (/^\d{1,3}$/.test(clean)) { nums.push({ v: +clean, i: i }); return; }
        var ps = O.normPos(clean);
        if (ps && !pos && clean.length <= 11) { pos = ps; return; }
        if (/^[A-Za-zÄÖÜäöüßÀ-ÿ'\-]{2,}$/.test(clean)) { names.push(clean); return; }
        odd++;
      });
      if (!names.length) return;
      var shirt = null;
      if (nums.length && nums[0].i === 0 && nums.length >= 2) shirt = nums.shift().v;
      else if (nums.length === 1 && nums[0].i === 0) shirt = nums.shift().v;
      var ovr = nums.length ? nums[0].v : null, age = nums.length > 1 ? nums[1].v : null;
      var unsure = [];
      if (!pos) unsure.push('Position');
      if (ovr == null || ovr < 1 || ovr > 99) { unsure.push('Stärke'); ovr = null; }
      if (age != null && (age < 15 || age > 45)) { unsure.push('Alter'); age = null; }
      if (names.length < 2) unsure.push('Vorname');
      if (odd > 0) unsure.push('Unlesbare Zeichen');
      rows.push({ shirt: shirt, pos: pos || 'RUE', first: names.length > 1 ? names.slice(0, -1).join(' ') : '', last: names[names.length - 1], ovr: ovr || 55, age: age || 24, unsure: unsure, include: unsure.length < 3 });
    });
    return rows;
  };
})(RFM);
