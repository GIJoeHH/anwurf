// ANWURF! – Wirtschaft: Stadion, Zuschauer, Vereinsstadt, Bank, Märkte
(function (R) {
  var D = R.data, W = R.world;
  var E = R.econ = {};

  function lv(club, key) { var f = D.facilities[key]; return f.levels[club.fac[key] != null ? club.fac[key] : (f.min || 0)]; }
  E.level = lv;
  E.WEEKS = 34; // Wirtschaftsjahr = 34 Spielwochen

  function plan(club) { return R.stadium && R.stadium.has(club); }
  E.capacity = function (club) { var p = E.capacityParts(club); return p.steh + p.sitz + p.vip; };
  E.capacityParts = function (club) { if (plan(club)) { var q = R.stadium.parts(club); return { steh: q.steh, sitz: q.sitz, vip: q.vip, biz: q.business }; } return { steh: lv(club, 'steh').cap, sitz: lv(club, 'sitz').cap, vip: lv(club, 'vip').vip }; };
  E.PLAN_KEYS = ['steh', 'sitz', 'vip']; // ersetzt durch den Hallenplan
  // Gästeblock: Kapazität (Hallenplan) bzw. 8 % der Stehplätze/Sitzplätze bei Vereinen ohne Plan
  E.guestCap = function (club) { if (plan(club)) return R.stadium.guestCap(club); var p = E.capacityParts(club); return Math.round((p.steh + p.sitz) * 0.08); };
  E.transportCap = function (club) {
    return lv(club, 'oepnv').fans + Math.min(lv(club, 'parken').cars * 2.6, lv(club, 'strasse').fans);
  };

  // Hallenattraktivität 0..100 (Komfort, Ausstattung, Erreichbarkeit, Umfeld)
  E.attractiveness = function (club) {
    var a = 10;
    ['dach', 'licht', 'video', 'rasen', 'sanitaer', 'hosp', 'technik'].forEach(function (k) { a += lv(club, k).att || 0; });
    ['oepnv', 'strasse', 'parken'].forEach(function (k) { a += lv(club, k).att || 0; });
    var parts = E.capacityParts(club), cap = parts.steh + parts.sitz + parts.vip;
    a += cap ? 5 * (parts.sitz + parts.vip) / cap : 0;
    a += Math.min(12, (club.fac.fanshop || 0) * 0.8 + (club.fac.restaurant || 0) * 0.8 + (club.fac.cafe || 0) * 0.5 + (club.fac.museum || 0) * 0.6 + (club.fac.erlebnis || 0) * 0.8);
    a -= Math.min(10, (club.congestion || 0) * 10);
    a += club.attBonus || 0;
    if (club.pitch != null && club.pitch < 100) a -= (100 - club.pitch) / 8; // Bodenzustand nach Großereignissen
    return R.clamp(Math.round(a), 0, 100);
  };

  // ---------- Entfernung, Derbys, Fanfreundschaften ----------
  E.DERBY_KM = 150;
  E.geo = function (club) { if (club.geo) return club.geo; var g = D.cityGeo && D.cityGeo[club.city]; if (g) return g; var h = 0, s = String(club.city || club.name); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return [48 + (h % 600) / 100, 6.5 + ((h >> 10) % 750) / 100]; };
  E.distance = function (a, b) {
    var p = E.geo(a), q = E.geo(b), rad = Math.PI / 180, dLat = (q[0] - p[0]) * rad, dLon = (q[1] - p[1]) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(p[0] * rad) * Math.cos(q[0] * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  };
  // Fanfreundschaften einmal je Spielwelt festlegen (bekannte zuerst, dann feste Zufallspaare > 150 km, keine Rivalen)
  E.ensureFriends = function (st) {
    if (st.friendsInit && st.friendsV === D.fanFriendsV) return;
    var first = !st.friendsInit;
    var clubs = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }), byShort = {};
    clubs.forEach(function (c) { c.friends = c.friends || []; byShort[c.short] = c; });
    function link(a, b) { if (!a || !b || a === b || a.friends.indexOf(b.id) >= 0 || (a.rivals || []).indexOf(b.id) >= 0) return; a.friends.push(b.id); b.friends.push(a.id); }
    (D.fanFriends || []).forEach(function (f) { link(byShort[f[0]], byShort[f[1]]); });
    st.friendsV = D.fanFriendsV;
    if (!first) return; // ältere Spielstände: nur die bekannten Paare ergänzen
    var seed = 0; String(st.seed || 1).split('').forEach(function (ch) { seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; });
    var rnd = function () { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; // eigener Zufall: verändert den Spielverlauf nicht
    clubs.forEach(function (a) {
      if (a.friends.length || rnd() < 0.45) return;
      var cand = clubs.filter(function (b) { return b !== a && !b.friends.length && E.distance(a, b) > E.DERBY_KM && (a.rivals || []).indexOf(b.id) < 0; });
      if (cand.length) link(a, cand[Math.floor(rnd() * cand.length)]);
    });
    st.friendsInit = true;
  };
  // Begegnung: Derby-Brisanz 0..1 (bis 150 km, je kürzer desto brisanter; Erzrivalen mindestens 0,7), Fanfreundschaft
  E.matchup = function (st, home, away) {
    if (!away) return { km: 0, derby: 0, friend: false, rival: false };
    if (st) E.ensureFriends(st);
    var km = E.distance(home, away), rival = (home.rivals || []).indexOf(away.id) >= 0, friend = (home.friends || []).indexOf(away.id) >= 0;
    var d = km <= E.DERBY_KM ? Math.pow(1 - km / E.DERBY_KM, 1.3) : 0;
    if (rival) d = Math.max(d, 0.7);
    if (friend) d = 0; // befreundete Fanlager: kein Derby-Feeling, sondern friedliche Stimmung
    var label = friend ? 'Fanfreundschaft' : d > 0 && home.city === away.city ? 'Stadtderby' : d >= 0.75 || rival ? 'Erzrivale' : d >= 0.4 ? 'Brisantes Derby' : d > 0 ? 'Regionalduell' : '';
    return { km: Math.round(km), derby: Math.round(d * 100) / 100, friend: friend, rival: rival, label: label };
  };
  E.GUEST_QUOTA = 0.10; // der Gastverein erhält 10 % der Stadiontickets

  // Referenzpreise je Liga: Steh/Sitz/Business pro Spiel, Loge = Saisonmiete je Loge (Privatraum in der Halle für 12 Gäste mit eigenem Catering)
  E.refPrices = { 1: { steh: 13, sitz: 26, biz: 50, loge: 30000, vip: 140 }, 2: { steh: 10, sitz: 17, biz: 27, loge: 15000, vip: 75 }, 3: { steh: 7, sitz: 11, biz: 13, loge: 7000, vip: 35 } };
  function priceFactor(price, ref, floor) { var r = Math.max(0.1, price / ref); return R.clamp(Math.pow(r, -1.35), floor || 0, 1.8); }
  // Geheimer Cheat „Kartenhai“: Bei aktivierten Cheats kaufen beim eigenen Verein immer noch 5 % der Nachfrage – egal, wie absurd der Preis ist.
  // Wird das an einem echten Spieltag genutzt, ist der Spielstand als „mit Cheat“ markiert (wie beim Bankdirektor).
  E.SHARK_FLOOR = 0.05;
  E.markShark = function (st, club, inc) {
    var first = !st.sharkGames; st.sharkGames = (st.sharkGames || 0) + 1; st.cheatUsed = true;
    if (R.season && R.season.achieve) R.season.achieve(st, 'kartenhai');
    if (first && R.season && R.season.news) R.season.news(st, 'Kartenhai! ' + club.short + ' verkauft Tickets zu Mondpreisen', 'Trotz astronomischer Eintrittspreise kommen immer noch Zuschauer – ' + R.fmtMoney(inc) + ' Eintritt an einem Spieltag. Dieser Spielstand ist jetzt als „mit Cheat“ markiert. Abschalten lässt sich der Cheat in den Einstellungen.', 'finanz');
  };
  E.priceFactor = priceFactor;
  E.LOGE_SEATS = 12; // Plätze je Loge
  E.HOME_GAMES = 17; // Liga-Heimspiele je Saison
  E.ST_MAX_SHARE = 0.85; // höchstens 85 % einer Platzart als Dauerkarten (Rest bleibt für Tageskarten)
  E.logeBoxes = function (club) { var v = E.capacityParts(club), seats = v.vip - (v.biz || 0); return seats > 0 ? Math.max(1, Math.floor(seats / E.LOGE_SEATS)) : 0; };
  // Ticketdaten ergänzen (alte Spielstände: ein gemeinsamer VIP-Preis → Business je Spiel + Logen-Saisonmiete)
  E.ensureTix = function (club) {
    var t = club.tickets, ref = E.refPrices[club.league] || E.refPrices[3];
    if (t.biz == null) t.biz = Math.max(5, Math.round((t.vip || ref.vip) * 0.35));
    if (t.loge == null) t.loge = R.round((t.vip || ref.vip) / ref.vip * ref.loge, 1000);
    if (!club.seasonTix) club.seasonTix = { steh: { price: R.round(t.steh * E.HOME_GAMES * 0.8, 5), limit: null }, sitz: { price: R.round(t.sitz * E.HOME_GAMES * 0.8, 5), limit: null }, sold: null };
    return club.seasonTix;
  };
  // Durchschnittliche Tageskarten-Nachfrage je Platzart über die Liga-Heimspiele (ohne Dauerkarten)
  E.tixBase = function (st, club) {
    var lk = W.lk(club), lg = st.leagues[lk], opps = [];
    if (lg) for (var w = 1; w <= R.season.SEASON_WEEKS; w++) R.season.roundsOf(st, lk, w).forEach(function (r) { (lg.fixtures[r] || []).forEach(function (f) { if (f.h === club.id) opps.push(st.clubs[f.a]); }); });
    if (!opps.length && lg) opps = lg.clubIds.filter(function (x) { return x !== club.id; }).map(function (x) { return st.clubs[x]; });
    var step = Math.max(1, Math.floor(opps.length / 6)), smp = opps.filter(function (o, i) { return i % step === 0; }).slice(0, 6), b = { steh: 0, sitz: 0, cap: { steh: 0, sitz: 0 }, games: lg ? Math.max(1, lg.clubIds.length - 1) : E.HOME_GAMES }; // Heimspiele je Saison (Staffelgröße)
    smp.forEach(function (o) { var a = E.attendance(st, club, o, 'league', { holders: { steh: 0, sitz: 0 }, logen: 0 }); b.steh += a.dem.steh / smp.length; b.sitz += a.dem.sitz / smp.length; b.cap = a.capK; });
    b.steh = Math.round(b.steh); b.sitz = Math.round(b.sitz);
    return b;
  };
  // Dauerkarten-Nachfrage je Platzart: treue Fans; entscheidend ist der Rabatt gegenüber 17 Tageskarten
  // (20 % Rabatt → 60 % der Stammnachfrage; teurer als 17 Tageskarten kauft niemand eine Dauerkarte)
  E.ST_OVERLAP = 0.6; // ein Dauerkarten-Inhaber wäre im Schnitt bei 60 % der Spiele ohnehin mit Tageskarte gekommen
  E.stDemand = function (club, k, base, price) {
    var single = Math.max(1, club.tickets[k] * (base.games || E.HOME_GAMES)), disc = 1 - price / single;
    var loyal = 0.85 + (club.fanTrust != null ? club.fanTrust : 60) / 400;
    return Math.max(0, base[k] * 0.6 * loyal * Math.pow(R.clamp((disc + 0.05) / 0.25, 0, 1.6), 0.8));
  };
  E.stSold = function (club, k, base, price, limit) {
    var cap = Math.round((base.cap[k] || 0) * E.ST_MAX_SHARE), n = Math.min(cap, Math.round(E.stDemand(club, k, base, price)));
    if (limit != null && limit >= 0) n = Math.min(n, Math.round(limit));
    return Math.max(0, n);
  };
  // Saisonerlös einer Platzart bei Dauerkartenpreis p: Dauerkarten + verbleibende Tageskarten (Durchschnittsspiel)
  E.stSeasonRevenue = function (club, k, base, price, limit) {
    var n = E.stSold(club, k, base, price, limit), cap = base.cap[k] || 0;
    var single = Math.min(Math.max(0, cap - n), Math.max(0, base[k] - n * E.ST_OVERLAP));
    return { sold: n, stRev: n * price, dayRev: single * club.tickets[k] * base.games, total: n * price + single * club.tickets[k] * base.games, perGame: Math.min(cap, n + single) };
  };
  // Logen: Saisonmiete, Nachfrage aus Ansehen und sportlicher Lage
  E.logeDemand = function (st, club, price) {
    var boxes = E.logeBoxes(club), ref = (E.refPrices[club.league] || E.refPrices[3]).loge;
    return Math.max(0, boxes * (0.45 + club.reputation / 140) * E.sportFactor(st, club) * priceFactor(price, ref));
  };
  E.logeRented = function (st, club, price) { return Math.min(E.logeBoxes(club), Math.round(E.logeDemand(st, club, price))); };
  // Verkaufsprognose für die kommende Saison (vor dem 1. Spieltag)
  var quoteCache = {};
  E.seasonQuote = function (st, club, base) {
    var sx = E.ensureTix(club), t = club.tickets, caps = E.capacityParts(club);
    var key = club.id + '|' + st.season + '|' + st.tick + '|' + t.steh + '|' + t.sitz + '|' + t.loge + '|' + sx.steh.price + '|' + sx.steh.limit + '|' + sx.sitz.price + '|' + sx.sitz.limit + '|' + caps.steh + '|' + caps.sitz + '|' + caps.vip + '|' + club.fans + '|' + club.reputation;
    if (!base && quoteCache[key]) return quoteCache[key];
    base = base || E.tixBase(st, club);
    var q = { steh: E.stSold(club, 'steh', base, sx.steh.price, sx.steh.limit), sitz: E.stSold(club, 'sitz', base, sx.sitz.price, sx.sitz.limit), logen: E.logeRented(st, club, t.loge), base: base };
    q.stRev = q.steh * sx.steh.price + q.sitz * sx.sitz.price; q.logeRev = q.logen * t.loge;
    quoteCache = {}; quoteCache[key] = q;
    return q;
  };
  // Gilt der Verkauf schon für diese Saison? Sonst Prognose (Vorbereitung) bzw. nichts (Saisonende)
  E.seasonHolders = function (st, club) {
    var sx = E.ensureTix(club);
    if (sx.sold && sx.sold.season === st.season) return { steh: sx.sold.steh, sitz: sx.sold.sitz, logen: sx.sold.logen, sold: true };
    if (st.phase === 'preseason') { var q = E.seasonQuote(st, club); return { steh: q.steh, sitz: q.sitz, logen: q.logen, sold: false }; }
    return { steh: 0, sitz: 0, logen: 0, sold: false };
  };
  // Dauerkarten- und Logenverkauf vor dem 1. Spieltag (alle Vereine). Alte Spielstände mitten in der Saison: anteilig.
  E.seasonSales = function (st) {
    if (st.phase === 'preseason' || st.phase === 'seasonEnd') return;
    var frac = st.week <= 1 ? 1 : R.clamp((R.season.SEASON_WEEKS - st.week + 1) / R.season.SEASON_WEEKS, 0, 1);
    Object.keys(st.clubs).forEach(function (id) {
      var c = st.clubs[id]; if (!c || !c.tickets || !st.leagues[W.lk(c)]) return;
      var sx = E.ensureTix(c); if (sx.sold && sx.sold.season === st.season) return;
      if (!c.userControlled) { sx.steh.price = R.round(c.tickets.steh * E.HOME_GAMES * 0.8, 5); sx.sitz.price = R.round(c.tickets.sitz * E.HOME_GAMES * 0.8, 5); }
      var q = E.seasonQuote(st, c, E.tixBase(st, c));
      var stRev = Math.round(q.stRev * frac), lRev = Math.round(q.logeRev * frac);
      sx.sold = { season: st.season, steh: q.steh, sitz: q.sitz, logen: q.logen, pSteh: sx.steh.price, pSitz: sx.sitz.price, pLoge: c.tickets.loge, stRev: stRev, logeRev: lRev };
      c.cash += stRev + lRev;
      if (stRev) E.book(c, 'Dauerkarten', stRev);
      if (lRev) E.book(c, 'Logenvermietung', lRev);
      if (c.userControlled && R.season.news) R.season.news(st, 'Dauerkartenverkauf abgeschlossen', R.fmtNum(q.steh + q.sitz) + ' Dauerkarten (' + R.fmtMoney(stRev) + ') und ' + q.logen + ' Logen (' + R.fmtMoney(lRev) + ') verkauft.', 'finanz');
    });
  };

  E.leaguePos = function (st, club) {
    var t = R.season.table(st, W.lk(club));
    for (var i = 0; i < t.length; i++) if (t[i].id === club.id) return i + 1;
    return 9;
  };

  // Sportliche Nachfrage 0.5..1.6
  E.sportFactor = function (st, club) {
    var pos = st.week >= 3 ? E.leaguePos(st, club) : (club.lastPos || 9);
    var n = (st.leagues[W.lk(club)] && st.leagues[W.lk(club)].clubIds.length) || 18;
    var f = 0.78 + 0.45 * (1 - (pos - 1) / (n - 1));
    var form = club.form || [];
    f += R.sum(form.slice(-5), function (r) { return r === 'S' ? 0.025 : r === 'N' ? -0.02 : 0; });
    if (st.week > 22 && (pos <= 3 || pos >= n - 2)) f += 0.08; // Aufstiegs-/Abstiegskampf
    f += Math.min(0.15, (club.titles.league * 0.03 + club.titles.cup * 0.01));
    return R.clamp(f, 0.5, 1.6);
  };

  // Zuschauerberechnung für ein Heimspiel
  E.attendance = function (st, home, away, comp, opts) {
    opts = opts || {}; E.ensureTix(home);
    var shark = false, sharkF = home.userControlled && st.settings && st.settings.cheatEnabled ? E.SHARK_FLOOR : 0;
    function pfx(p, r) { if (sharkF && priceFactor(p, r) < sharkF) shark = true; return priceFactor(p, r, sharkF); }
    var leagueF = { 1: 1.0, 2: 0.82, 3: 0.66 }[home.league];
    var sport = E.sportFactor(st, home);
    var mu = E.matchup(st, home, away), nOpp = (st.leagues[home.league] && st.leagues[home.league].clubIds.length) || 18;
    var oppPos = away && away.league === home.league && st.week >= 3 ? E.leaguePos(st, away) : (away ? (away.lastPos || 9) + (away.league - home.league) * 6 : 9);
    var oppPosF = 1 + 0.14 * (1 - R.clamp((oppPos - 1) / (nOpp - 1), 0, 1.4)) - 0.05; // Tabellenplatz des Gegners
    var oppF = (0.88 + (away ? away.reputation : 50) / 100 * 0.3) * oppPosF;
    var derby = 1 + 0.5 * mu.derby, friendF = mu.friend ? 1.18 : 1;
    var compF = comp === 'cup' ? 1.05 : comp === 'releg' ? 1.4 : comp === 'final' ? 2 : comp === 'friendly' ? 0.22 : 1;
    var attr = E.attractiveness(home);
    var attrF = 0.7 + 0.5 * (1 - Math.exp(-attr / 35));
    var fanCare = [0.97, 1, 1.04][home.budgets.fans];
    var mkt = [0.98, 1, 1.03][home.budgets.marketing];
    var trustF = 0.9 + (home.fanTrust != null ? home.fanTrust : 60) / 500; // Fanvertrauen
    var promoF = home.ticketPromo > 0 ? 1.05 : 1;
    var demand = home.fans * 1.05 * leagueF * sport * oppF * derby * friendF * compF * attrF * fanCare * mkt * trustF * promoF;
    var parts = E.capacityParts(home), ref = E.refPrices[home.league], prices = home.tickets;
    if (home.blockedArea && comp !== 'final') { parts = { steh: Math.round(parts.steh * 0.8), sitz: Math.round(parts.sitz * 0.8), vip: parts.vip, biz: parts.biz }; }
    // Gästefans: je höher die Liga und je größer/besser der Gegner, desto mehr reisen an (Derby: noch mehr)
    var gDemand = 0, gCap = 0, gType = 'steh', guests = 0, guestFree = 0, guestFreeOk = false, guestQuota = 0, guestBlocks = 0, homeInGuest = 0;
    if (away && comp !== 'final') {
      var lgF = { 1: 0.05, 2: 0.034, 3: 0.022 }[home.league] || 0.02;
      gDemand = away.fans * lgF * (0.55 + away.reputation / 110) * (1 + 1.2 * mu.derby) * (mu.friend ? 1.6 : 1) * (1.15 - Math.min(0.45, mu.km / 1600)) * (comp === 'cup' ? 1.25 : comp === 'releg' ? 1.6 : comp === 'friendly' ? 0.15 : 1) * (0.85 + E.sportFactor(st, away) * 0.15);
      var blocks = E.guestCap(home); if (home.blockedArea) blocks = Math.round(blocks * 0.8);
      gType = plan(home) ? R.stadium.guestType(home) : ((parts.steh || 0) > 0 ? 'steh' : 'sitz');
      var gk = gType === 'sitz' || gType === 'steh' ? gType : 'sitz';
      blocks = Math.min(blocks, parts[gk] || 0);
      var quota = Math.round((parts.steh + parts.sitz) * E.GUEST_QUOTA); // Pflichtkontingent 10 % für den Gastverein
      gCap = Math.min(blocks, quota);
      guests = Math.round(Math.min(gCap, gDemand * pfx(prices[gk], ref[gk])));
      // Nicht benötigte Gästetickets dürfen eigene Fans kaufen – außer im Derby (Sicherheitsrisiko, Pufferzone bleibt leer)
      guestFree = Math.max(0, gCap - guests); guestFreeOk = mu.derby <= 0 && comp !== 'friendly';
      guestQuota = quota; guestBlocks = blocks;
      parts = { steh: parts.steh - (gk === 'steh' ? gCap : 0), sitz: parts.sitz - (gk === 'sitz' ? gCap : 0), vip: parts.vip, biz: parts.biz };
      gType = gk;
    }
    var capNorm = parts.steh + parts.sitz || 1;
    var res = { steh: 0, sitz: 0, vip: 0 }, dem = {}, capK = { steh: parts.steh, sitz: parts.sitz };
    // Dauerkarten-Inhaber haben ihren Platz sicher; Tageskarten nur für die übrige Nachfrage
    var sh = comp === 'friendly' ? { steh: 0, sitz: 0, logen: 0 } : opts.holders ? { steh: opts.holders.steh || 0, sitz: opts.holders.sitz || 0, logen: opts.logen != null ? opts.logen : null } : E.seasonHolders(st, home);
    var dayTk = { steh: 0, sitz: 0 };
    ['steh', 'sitz'].forEach(function (k) {
      var share = parts[k] / capNorm;
      var d = demand * share * pfx(prices[k], ref[k]) * (k === 'sitz' ? 0.95 : 1.05);
      dem[k] = d;
      var hold = Math.min(parts[k], sh[k] || 0);
      res[k] = Math.round(Math.min(parts[k], hold + Math.max(0, d - hold * E.ST_OVERLAP)));
      dayTk[k] = Math.max(0, res[k] - hold);
      // übrige Nachfrage füllt freie Gästetickets (gleiche Platzart)
      if (guestFreeOk && k === gType && d > res[k]) { var extra = Math.round(Math.min(guestFree - homeInGuest, d - res[k])); if (extra > 0) { res[k] += extra; dayTk[k] += extra; homeInGuest += extra; } }
    });
    // Business-Seats (Tribünenplatz mit Essen im Stadioninneren, Preis je Spiel) und Logen (Privaträume, Saisonmiete)
    var bizCap = parts.biz || 0, logeCap = parts.vip - bizCap;
    var bizD = bizCap * (0.35 + home.reputation / 180) * sport * pfx(prices.biz, ref.biz) * (comp === 'final' ? 1.5 : 1) * (comp === 'friendly' ? 0.3 : 1);
    var logenN = sh.logen != null ? sh.logen : E.logeRented(st, home, prices.loge);
    var resLoge = Math.round(Math.min(logeCap, logenN * E.LOGE_SEATS * (comp === 'friendly' ? 0.4 : 0.92))), resBiz = Math.round(Math.min(bizCap, bizD));
    dem.biz = bizD; dem.loge = logenN;
    res.vip = resLoge + resBiz;
    var total = res.steh + res.sitz + res.vip + guests;
    // Verkehr: Engpass → Staus, Zuschauerverlust, Unzufriedenheit
    var tcap = E.transportCap(home);
    var congestion = 0;
    if (total > tcap) {
      var lost = (total - tcap) * 0.45;
      congestion = R.clamp((total - tcap) / Math.max(1, total), 0, 1);
      var keep = (total - lost) / total;
      res.steh = Math.round(res.steh * keep); res.sitz = Math.round(res.sitz * keep); dayTk.steh = Math.round(dayTk.steh * keep); dayTk.sitz = Math.round(dayTk.sitz * keep); resLoge = Math.round(resLoge * keep); resBiz = Math.round(resBiz * keep); res.vip = resLoge + resBiz; guests = Math.round(guests * keep);
      total = res.steh + res.sitz + res.vip + guests;
    }
    var transitShare = Math.min(0.75, lv(home, 'oepnv').fans / Math.max(1, total));
    var carsUsed = Math.min(lv(home, 'parken').cars, total * (1 - transitShare) / 2.6);
    // Eintritt je Spiel: nur Tageskarten und Business (Dauerkarten und Logen werden vor der Saison bezahlt)
    var promoF = home.ticketPromo > 0 ? 0.9 : 1;
    var ticket = (dayTk.steh * prices.steh + dayTk.sitz * prices.sitz) * promoF + resBiz * prices.biz + guests * prices[gType];
    if (home.freeTickets) { var ft = Math.min(home.freeTickets, dayTk.steh + dayTk.sitz); ticket -= ft * prices.steh * promoF; }
    var cater = total * (3 + (lv(home, 'hosp').att || 0) * 0.5) + resLoge * 40 + resBiz * 15;
    var parking = carsUsed * (lv(home, 'parken').fee || 0);
    return { matchup: mu, shark: shark && dayTk.steh + dayTk.sitz + resBiz + guests > 0, oppPos: oppPos, guestQuota: guestQuota, guestBlocks: guestBlocks, guestType: gType, homeInGuest: homeInGuest, guestFreeOk: guestFreeOk, guestEmpty: Math.max(0, gCap - guests - homeInGuest),
      factors: { fans: home.fans, league: leagueF, sport: sport, opp: oppF, oppPos: oppPosF, derby: derby, friend: friendF, comp: compF, attr: attrF }, prices: { steh: prices.steh, sitz: prices.sitz, biz: prices.biz, loge: prices.loge }, dem: dem, capK: capK, holders: sh, dayTk: dayTk, resBiz: resBiz, resLoge: resLoge, bizCap: bizCap, logeCap: logeCap, logeBoxes: E.logeBoxes(home),
      total: total, parts: res, guests: guests, guestDemand: Math.round(gDemand), guestCap: gCap, capacity: E.capacity(home), ticket: ticket, cater: cater, parking: parking, congestion: congestion, demand: Math.round(demand), satisfaction: R.clamp(Math.round(100 - congestion * 120 - Math.max(0, (prices.steh / ref.steh - 1) * 40)), 0, 100) };
  };

  // ---------- Vereinsstadt ----------
  E.synergy = function (club, key) {
    var f = club.fac, s = 0;
    if (key === 'fanshop') s = (f.museum || 0) * 0.04 + (f.erlebnis || 0) * 0.05;
    if (key === 'hotel') s = (f.eventhalle || 0) * 0.08 + Math.max(0, lv(club, 'oepnv').att - 2) * 0.03;
    if (key === 'restaurant') s = (f.vip || 0) * 0.04 + (f.eventhalle || 0) * 0.03;
    if (key === 'museum') s = Math.max(0, (f.oepnv || 1) - 3) * 0.06 + (f.hotel || 0) * 0.02;
    if (key === 'eventhalle') s = Math.max(0, (f.parken || 1) - 3) * 0.07 + (f.hotel || 0) * 0.03;
    if (key === 'erlebnis') s = (f.fanshop || 0) * 0.03;
    if (key === 'cafe') s = (f.museum || 0) * 0.03;
    return Math.min(0.3, s); // gedeckelt
  };
  E.demandFactor = function (st, club, key) {
    var sport = st ? E.sportFactor(st, club) : 1;
    var avgAtt = club.avgAttendance || E.capacity(club) * 0.7;
    var f = 1;
    switch (key) {
      case 'fanshop': f = Math.pow(club.fans / 5000, 0.5) * (0.8 + club.reputation / 250) * sport * (0.85 + (club.fanTrust != null ? club.fanTrust : 60) / 400) * (club.shopPromo > 0 ? 0.9 : 1) * (club.shirtBoost > 0 ? 1.05 : 1); break;
      case 'restaurant': f = Math.pow(avgAtt / 3000, 0.5); break;
      case 'cafe': f = Math.pow(club.fans / 4000, 0.5); break;
      case 'hotel': f = 0.55 + club.reputation / 300 + (club.league === 1 ? 0.15 : 0); break;
      case 'museum': f = Math.pow(club.fans / 5000, 0.5) * (0.7 + Math.min(0.5, club.titles.league * 0.06 + club.titles.cup * 0.03 + club.titles.promo * 0.02 + club.tradition / 300)); break;
      case 'eventhalle': f = 0.75 + (club.fac.strasse || 1) * 0.04; break;
      case 'erlebnis': f = Math.pow(club.fans / 4000, 0.5) * sport; break;
      case 'gewerbe': f = 0.7 + (club.fac.strasse || 1) * 0.04 + (club.fac.oepnv || 1) * 0.03; break;
      default: f = 1;
    }
    return R.clamp(f, 0.25, 2.2) * (1 + E.synergy(club, key));
  };
  E.buildingRevenue = function (st, club, key, level) {
    var l = D.facilities[key].levels[level == null ? club.fac[key] : level];
    if (!l || !l.rev) return 0;
    return l.rev * E.demandFactor(st, club, key) * [0.88, 1, 1.1][club.cityPrice == null ? 1 : club.cityPrice];
  };

  E.energySave = function (club) { return lv(club, 'solar').save || 0; };
  E.upkeepTotal = function (club) {
    var sum = 0;
    var pl = plan(club);
    Object.keys(D.facilities).forEach(function (k) { if (pl && E.PLAN_KEYS.indexOf(k) >= 0) return; var l = lv(club, k); if (l) sum += l.up; });
    if (pl) sum += R.stadium.upkeep(club);
    return sum * (1 - E.energySave(club));
  };
  E.budgetCost = function (club, area) {
    var base = { 1: 1100000, 2: 380000, 3: 110000 }[club.league] * D.MONEY;
    return base * [0.55, 1, 1.7][club.budgets[area]];
  };
  E.wageTotal = function (st, club) {
    var w = 0; for (var id in st.players) { var p = st.players[id]; if (p.clubId === club.id) w += p.wage; }
    return w + (club.coach ? club.coach.wage : 0) + E.staffWages(club);
  };
  // Trainerstab
  E.staffLvl = function (club, k) { return club && club.staff && club.staff[k] ? club.staff[k].lvl : 0; };
  E.staffWageFor = function (club, lvl) { return Math.round(D.staffWage.factor[lvl] * D.staffWage.base[club.league] / 1000) * 1000; };
  E.staffWages = function (club) { var w = 0; if (club.staff) Object.keys(club.staff).forEach(function (k) { w += club.staff[k].wage || 0; }); return w; };
  E.setStaff = function (st, club, k, lvl) {
    if (!D.staff[k] || lvl < 0 || lvl > 3) return { ok: false };
    club.staff = club.staff || {};
    var cur = club.staff[k];
    if (cur && cur.lvl > 0 && lvl !== cur.lvl) { var comp = Math.round(cur.wage * 0.25); club.cash -= comp; E.book(club, 'Abfindungen', -comp); }
    // Entlassung: Kündigungsschutzklage möglich (seltener mit gutem Hausanwalt)
    if (cur && cur.lvl > 0 && !lvl && club.userControlled && R.season && R.season.legalQueue && (R.season.forceLegalQueue || R.chance(0.35 * (1 - Math.min(0.6, R.season.legalPrev(club)))))) R.season.legalQueue(st, { type: 'kuendigung', owner: club.id, name: cur.name, role: D.staff[k].n, amount: Math.round(cur.wage * R.randRange(0.5, 1)) });
    if (!lvl) { delete club.staff[k]; return { ok: true }; }
    club.staff[k] = { lvl: lvl, wage: E.staffWageFor(club, lvl), name: R.pick(D.firstNames) + ' ' + R.pick(D.lastNames) };
    return { ok: true, s: club.staff[k] };
  };
  // ---------- Rechtsanwälte: Stufen vom Jura-Studenten bis zur Top-Kanzlei ----------
  // win = Bonus auf die Erfolgsaussicht, f = Jahreshonorar (× Ligabasis), caseF = Fallhonorar (Anteil am Streitwert), prev = weniger Ärger durch Vertragsprüfung
  E.LAWYERS = [
    { n: 'Keine Rechtsvertretung', d: 'Bei Streitigkeiten muss kurzfristig und teuer eine Kanzlei gesucht werden.', win: 0, f: 0, caseF: 0, prev: 0 },
    { n: 'Jura-Student', d: 'Engagierter Student im 5. Semester. Günstig, motiviert – aber noch ohne Zulassung und Erfahrung.', win: 0.07, f: 0.15, caseF: 0.03, prev: 0.03 },
    { n: 'Einzelanwalt', d: 'Allgemeinanwalt aus der Stadt mit Schwerpunkt Vertrags- und Arbeitsrecht.', win: 0.15, f: 0.45, caseF: 0.05, prev: 0.07 },
    { n: 'Fachanwalt für Sportrecht', d: 'Kennt Verbandsstatuten, Spielerverträge und Sportgerichte aus dem Effeff.', win: 0.24, f: 1.2, caseF: 0.07, prev: 0.12 },
    { n: 'Wirtschaftskanzlei', d: 'Team aus mehreren Partnern für Bau-, Arbeits-, Marken- und Vertragsrecht.', win: 0.32, f: 2.6, caseF: 0.08, prev: 0.17 },
    { n: 'Top-Kanzlei', d: 'Internationale Großkanzlei – gewinnt fast alles, prüft jeden Vertrag vorab und kostet entsprechend.', win: 0.4, f: 5, caseF: 0.1, prev: 0.22 }
  ];
  E.LAWYER_ADHOC = { win: 0.05, caseF: 0.25 }; // ohne Hausanwalt: kurzfristig beauftragte Kanzlei
  var LAW_FIRMS = ['Hartwig Brenner & Partner', 'Lindqvist Albers International', 'Steinfeld Rosen Rechtsanwälte', 'Dr. Kranz & Kollegen', 'Wolters Behrendt LLP', 'Falkenrath Sommer Partners'];
  E.lawyerLvl = function (club) { return club && club.lawyer ? club.lawyer.lvl || 0 : 0; };
  E.lawyerWageFor = function (club, lvl) { return Math.round(E.LAWYERS[lvl].f * D.staffWage.base[club.league] / 100) * 100; };
  E.lawyerName = function (lvl) {
    var fn = R.pick(D.firstNames), ln = R.pick(D.lastNames), l2 = R.pick(D.lastNames);
    return [null, 'stud. iur. ' + fn + ' ' + ln, 'Kanzlei ' + ln, ln + ' & ' + l2 + ' Sportrecht', ln + ' ' + l2 + ' Wirtschaftsanwälte', R.pick(LAW_FIRMS)][lvl];
  };
  E.setLawyer = function (st, club, lvl) {
    if (lvl < 0 || lvl >= E.LAWYERS.length) return { ok: false };
    var cur = club.lawyer;
    if (cur && cur.lvl > 0 && lvl !== cur.lvl) { var comp = Math.round(cur.wage * 0.25); club.cash -= comp; E.book(club, 'Rechtsberatung', -comp); } // Kündigung: Vierteljahreshonorar
    if (!lvl) { club.lawyer = null; return { ok: true }; }
    club.lawyer = { lvl: lvl, wage: E.lawyerWageFor(club, lvl), name: E.lawyerName(lvl) };
    return { ok: true, s: club.lawyer };
  };
  // Verletzungsrisiko-Faktor durch Fitnesstrainer und Ernährungsberater
  E.injuryStaffF = function (club) { return 1 - E.staffLvl(club, 'fitness') * 0.05 - E.staffLvl(club, 'ernaehrung') * 0.03; };
  E.sponsorTotal = function (club) { return R.sum(club.sponsors, function (s) { return s.amount; }); };

  // Wirtschaftlichkeitsrechnung vor einem Ausbau
  E.buildPreview = function (st, club, key) {
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    var next = f.levels[cur + 1];
    if (!next) return null;
    var cost = next.cost * (1 - E.subRate(club, next));
    var revNow = E.buildingRevenue(st, club, key, cur), revNext = E.buildingRevenue(st, club, key, cur + 1);
    var upNow = f.levels[cur] ? f.levels[cur].up : 0;
    var addRev = revNext - revNow, addCost = next.up - upNow;
    if (key === 'steh' || key === 'sitz' || key === 'vip') {
      var avgPrice = key === 'vip' ? (club.tickets.loge || 60000) / E.LOGE_SEATS / E.HOME_GAMES : club.tickets[key];
      var capAdd = key === 'vip' ? next.vip - f.levels[cur].vip : next.cap - f.levels[cur].cap;
      var demandRoom = Math.max(0, (club.lastDemand || club.avgAttendance || 0) - E.capacity(club));
      addRev = Math.min(capAdd, demandRoom + capAdd * 0.15) * avgPrice * 17;
    }
    if (key === 'parken') addRev = (next.cars - f.levels[cur].cars) * 0.5 * (next.fee || 0) * 17;
    var surplus = addRev - addCost;
    return { name: next.n, cost: cost, subsidy: next.cost * E.subRate(club, next), weeks: next.wk, addRev: addRev, addCost: addCost, surplus: surplus, payback: surplus > 0 ? cost / surplus : null };
  };

  // Öffentliche Zuschüsse hängen von der öffentlichen Wahrnehmung ab
  E.subRate = function (club, lvl) { if (!lvl || !lvl.sub) return 0; return Math.min(0.5, lvl.sub * (0.8 + (club.publicImage != null ? club.publicImage : 50) / 250)); };
  // Gleichzeitige Bauvorhaben (Ausbaustufen + Tribünenprojekte in der Halleplan)
  // Begrenzung nur für die Halle selbst (Ausstattung und Tribünen im Hallenplan): max. 10 gleichzeitig.
  // Verkehrsinfrastruktur (ÖPNV, Straße, Parkplätze) liegt außerhalb der Halle und ist – wie Vereinsstadt und
  // Abteilungen (Medizin, Jugend, Training) – nicht begrenzt.
  E.MAX_BUILDS = 10;
  E.STADIUM_GROUPS = ['stadion'];
  E.isStadiumKey = function (key) { return E.STADIUM_GROUPS.indexOf(D.facilities[key].group) >= 0; };
  E.buildCount = function (club) { return club.construction.filter(function (c) { return E.isStadiumKey(c.key); }).length + (club.stadium && club.stadium.jobs ? club.stadium.jobs.length : 0); };
  E.canBuild = function (st, club, key) {
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    if (!f.levels[cur + 1]) return { ok: false, why: 'Höchste Stufe erreicht' };
    if (club.construction.some(function (c) { return c.key === key; })) return { ok: false, why: 'Wird bereits ausgebaut' };
    if (E.isStadiumKey(key) && E.buildCount(club) >= E.MAX_BUILDS) return { ok: false, why: 'Maximal ' + E.MAX_BUILDS + ' Bauvorhaben in der Halle gleichzeitig' };
    var cost = f.levels[cur + 1].cost * (1 - E.subRate(club, f.levels[cur + 1]));
    if (club.cash < cost) return { ok: false, why: 'Nicht genug Geld (' + R.fmtMoney(cost) + ')' };
    return { ok: true, cost: cost };
  };
  E.startBuild = function (st, club, key) {
    var c = E.canBuild(st, club, key);
    if (!c.ok) return c;
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    var next = f.levels[cur + 1];
    club.cash -= c.cost;
    E.book(club, 'Bauprojekte', -c.cost);
    club.construction.push({ key: key, to: cur + 1, weeks: Math.max(1, next.wk), total: Math.max(1, next.wk), cost: c.cost });
    club.history.push({ season: st.season, type: 'bau', text: 'Baubeginn: ' + next.n + ' (' + R.fmtMoney(c.cost) + ')' });
    return { ok: true };
  };
  E.progressConstruction = function (st, club) {
    var done = [];
    if (R.stadium) R.stadium.progress(st, club);
    club.construction.forEach(function (c) { c.weeks--; if (c.weeks <= 0) done.push(c); });
    done.forEach(function (c) {
      club.fac[c.key] = c.to;
      club.construction.splice(club.construction.indexOf(c), 1);
      var n = D.facilities[c.key].levels[c.to].n;
      club.stadiumHist.push({ season: st.season, week: st.week, key: c.key, level: c.to, name: n });
      if (club.userControlled) R.season.news(st, 'Bauprojekt abgeschlossen: ' + n, club.name + ' feiert die Fertigstellung. ' + D.facilities[c.key].name + ' jetzt Stufe ' + c.to + '.', 'bau');
      if (c.cost >= 500000) club.history.push({ season: st.season, type: 'bau', text: 'Fertigstellung: ' + n });
    });
    return done;
  };

  // ---------- Buchhaltung ----------
  E.book = function (club, cat, amount) {
    var s = club.fin.season; s[cat] = (s[cat] || 0) + amount;
  };

  // Bank
  E.debt = function (club) { return R.sum(club.loans, function (l) { return l.amount; }); };
  E.facilityValue = function (club) {
    var v = 0;
    var pl = plan(club);
    Object.keys(D.facilities).forEach(function (k) { if (pl && E.PLAN_KEYS.indexOf(k) >= 0) return; var f = D.facilities[k], cur = club.fac[k] || 0; for (var i = 1; i <= cur; i++) if (f.levels[i]) v += f.levels[i].cost; });
    if (pl) v += R.stadium.value(club);
    return v;
  };
  E.revenueEstimate = function (st, club) {
    var tv = D.leagueTV[club.league];
    var att = (club.avgAttendance || E.capacity(club) * 0.6) * 17 * (club.tickets.steh + club.tickets.sitz) / 2;
    return tv + E.sponsorTotal(club) + att;
  };
  E.creditLimit = function (st, club) {
    return Math.max(0, R.round(E.revenueEstimate(st, club) * 0.6 + E.facilityValue(club) * 0.25 - E.debt(club), 5000));
  };
  E.loanRate = function (st, club) {
    var rev = E.revenueEstimate(st, club) || 1;
    var ratio = (E.debt(club) - Math.max(0, club.cash)) / rev;
    return R.clamp(0.035 + Math.max(0, ratio) * 0.06 + (club.cash < 0 ? 0.03 : 0), 0.035, 0.16);
  };
  E.takeLoan = function (st, club, amount) {
    amount = Math.round(+amount);
    if (!(amount > 0)) return { ok: false, why: 'Ungültiger Betrag' };
    if (amount > E.creditLimit(st, club)) return { ok: false, why: 'Kreditrahmen überschritten' };
    var rate = E.loanRate(st, club);
    club.loans.push({ amount: amount, rate: rate, since: st.season });
    club.cash += amount;
    E.book(club, 'Kreditaufnahme', amount);
    return { ok: true, rate: rate };
  };
  E.repayLoan = function (st, club, amount) {
    amount = Math.min(Math.round(amount), E.debt(club), Math.max(0, club.cash));
    if (!(amount > 0)) return { ok: false, why: 'Kein Betrag tilgbar' };
    var left = amount;
    club.loans.sort(function (a, b) { return b.rate - a.rate; });
    club.loans.forEach(function (l) { var x = Math.min(l.amount, left); l.amount -= x; left -= x; });
    club.loans = club.loans.filter(function (l) { return l.amount > 0.5; });
    club.cash -= amount;
    E.book(club, 'Tilgung', -amount);
    return { ok: true, amount: amount };
  };
  E.deposit = function (club, amount) { amount = Math.min(Math.round(amount), Math.max(0, club.cash)); if (!(amount > 0)) return false; club.cash -= amount; club.savings += amount; return true; };
  E.withdraw = function (club, amount) { amount = Math.min(Math.round(amount), club.savings); if (!(amount > 0)) return false; club.savings -= amount; club.cash += amount; return true; };

  // Märkte
  E.marketDef = function (sym) { return D.stocks.concat(D.cryptos).filter(function (s) { return s.id === sym; })[0]; };
  E.price = function (st, sym) { var m = st.market.stocks[sym] || st.market.crypto[sym]; return m ? m.price : 0; };
  E.HIST = 104; // Kursverlauf: zwei Jahre (Wochenwerte)
  // Fehlende Märkte ergänzen (ältere Spielstände, neue Werte wie die BVB-Aktie)
  // Vorgeschichte eines Kurses (52 Wochen Zufallsweg, endet beim Startkurs) – eigener Zufall, die Spielwelt bleibt unberührt
  E.seedHist = function (s, salt) {
    var x = 0; for (var i = 0; i < s.id.length; i++) x = (x * 31 + s.id.charCodeAt(i)) >>> 0; x = (x + (salt || 0)) >>> 0 || 1;
    var rnd = function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    var out = [s.price], p = s.price;
    for (var w = 0; w < 51; w++) { var g = (rnd() + rnd() + rnd() - 1.5) * 1.4; p = p / Math.exp(s.drift + s.vol * g); out.unshift(p); }
    return out;
  };
  E.TICKS = 5; // Handelstage pro Spielwoche (für die Kurscharts)
  // Kleiner eigener Zufallsgenerator (verändert den Spielzufall nicht)
  function mrng(str) {
    var x = 2166136261; for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } x = x || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  function mgauss(rnd) { return (rnd() + rnd() + rnd() + rnd() - 2) * 1.732; }
  // Tagesverlauf zwischen zwei Wochenkursen (Brownsche Brücke im Log-Raum, endet genau beim Wochenkurs)
  E.dayTicks = function (a, b, vol, rnd) {
    var n = E.TICKS, sd = vol * 0.8 / Math.sqrt(n), walk = [0], out = [];
    for (var i = 1; i <= n; i++) walk.push(walk[i - 1] + sd * mgauss(rnd));
    var la = Math.log(a), lb = Math.log(b);
    for (var j = 1; j <= n; j++) { var t = j / n; out.push(+Math.exp(la + (lb - la) * t + walk[j] - t * walk[n]).toPrecision(6)); }
    return out;
  };
  E.buildTicks = function (s, m, salt) {
    var rnd = mrng(s.id + ':' + salt), t = [];
    for (var i = 0; i < m.hist.length; i++) t = t.concat(E.dayTicks(i ? m.hist[i - 1] : m.hist[0] * Math.exp(s.vol * mgauss(rnd) * 0.5), m.hist[i], s.vol, rnd));
    m.ticks = t;
  };
  E.ensureMarkets = function (st) {
    st.market = st.market || { stocks: {}, crypto: {} };
    function fix(s, bucket) {
      var m = bucket[s.id];
      if (!m) m = bucket[s.id] = { price: s.price, hist: E.seedHist(s, st.seed) };
      // Kurze Kurshistorie (ältere Spielstände): Vorgeschichte ergänzen, die beim ersten bekannten Kurs endet
      if (m.hist.length < 52 && !m.backfilled) {
        var pre = E.seedHist({ id: s.id, price: m.hist[0] || m.price, vol: s.vol, drift: s.drift }, st.seed).slice(0, 52 - m.hist.length);
        m.hist = pre.concat(m.hist); if (m.marks) m.marks.forEach(function (k) { k.i += pre.length; });
        m.backfilled = true; m.ticks = null;
      }
      if (!m.ticks || m.ticks.length !== m.hist.length * E.TICKS) E.buildTicks(s, m, st.seed);
    }
    D.stocks.forEach(function (s) { fix(s, st.market.stocks); });
    D.cryptos.forEach(function (s) { fix(s, st.market.crypto); });
  };
  // Verein hinter der Vereinsaktie (echte Welt: Borussia Dortmund, fiktive Welt: Verein aus Dortmund)
  E.bvbClub = function (st) { return null; }; // ANWURF!: keine börsennotierte Vereinsaktie (kein Handballverein ist an der Börse)
  // Neuen Kurs anhängen; marks = besondere Ereignisse (Crash, Übernahme) für die Chartanzeige
  E.marketPush = function (m, mark, st, sym) {
    var prev = m.hist[m.hist.length - 1] || m.price, def = sym && E.marketDef(sym);
    m.hist.push(m.price);
    if (m.ticks) m.ticks = m.ticks.concat(E.dayTicks(prev, m.price, def ? def.vol : 0.05, mrng((sym || '') + ':' + (st ? st.seed + ':' + st.season + ':' + st.week + ':' + m.hist.length : m.hist.length))));
    if (m.hist.length > E.HIST) { m.hist.shift(); if (m.ticks) m.ticks.splice(0, E.TICKS); if (m.marks) { m.marks.forEach(function (k) { k.i--; }); m.marks = m.marks.filter(function (k) { return k.i >= 0; }); } }
    if (mark) { m.marks = m.marks || []; m.marks.push({ i: m.hist.length - 1, t: mark }); }
  };
  E.updateMarkets = function (st) {
    E.ensureMarkets(st);
    var chaos = st.settings.difficulty === 'chaos' ? 1.5 : 1;
    // Börsencrash in unregelmäßigen Abständen (ca. alle 1–2 Saisons), danach langsame Erholung
    var crash = R.chance(0.022 * chaos) ? R.randRange(0.12, 0.32) : 0;
    if (crash) st.news.unshift({ season: st.season, week: st.week, title: 'BÖRSENCRASH! Kurse brechen um bis zu ' + Math.round(crash * 100) + ' % ein', text: 'Panikverkäufe an allen Märkten. Mutige kaufen jetzt billig nach …', type: 'markt' });
    var alerts = [];
    if (crash) alerts.push({ k: 'crash', ic: '📉', t: 'Börsencrash!', x: 'Panikverkäufe an allen Märkten – die Kurse brechen um bis zu ' + Math.round(crash * 100) + ' % ein. Kryptowährungen trifft es besonders hart. Danach erholen sich die Kurse meist langsam.' });
    st.market.recovery = crash ? crash * 0.5 : (st.market.recovery || 0) * 0.9;
    var bvb = E.bvbClub(st);
    D.stocks.forEach(function (s) {
      var m = st.market.stocks[s.id];
      var shock = R.chance(0.01) ? R.randRange(-0.2, 0.15) : 0;
      var r = s.drift + s.vol * chaos * R.gauss(0, 1) + shock + (st.market.recovery || 0) * 0.08;
      if (crash) r -= crash * R.randRange(0.7, 1.15);
      if (s.club && bvb && st.week > 0) { // Vereinsaktie folgt dem sportlichen Erfolg
        var pos = E.leaguePos(st, bvb), n = st.leagues[W.lk(bvb)].clubIds.length;
        r += (0.5 - (pos - 1) / (n - 1)) * 0.012 - (bvb.league - 1) * 0.01;
        if (bvb.form && bvb.form.length) r += bvb.form[bvb.form.length - 1] === 'S' ? 0.01 : bvb.form[bvb.form.length - 1] === 'N' ? -0.01 : 0;
      }
      m.price = Math.max(s.club ? 0.2 : 0.5, m.price * Math.exp(r));
      E.marketPush(m, crash ? 'Crash' : null, st, s.id);
    });
    D.cryptos.forEach(function (s) {
      var m = st.market.crypto[s.id];
      var r = s.drift + s.vol * chaos * R.gauss(0, 1);
      if (R.chance(0.03)) { var dn = R.randRange(0.3, 0.6); r -= dn; st.news.unshift({ season: st.season, week: st.week, title: s.name + ' crasht!', text: 'Panik an den Kryptomärkten.', type: 'markt' }); alerts.push({ k: 'ccrash', ic: '🪙', t: s.name + ' crasht!', x: 'Panik an den Kryptomärkten: ' + s.name + ' verliert binnen einer Woche rund ' + Math.round((1 - Math.exp(-dn)) * 100) + ' %.', sym: s.id }); }
      else if (R.chance(0.03)) { var up = R.randRange(0.3, 0.7); r += up; st.news.unshift({ season: st.season, week: st.week, title: s.name + ' explodiert!', text: 'Spekulationsblase oder Revolution?', type: 'markt' }); alerts.push({ k: 'cboom', ic: '🚀', t: s.name + ' explodiert!', x: 'Spekulationsblase oder Revolution? ' + s.name + ' legt binnen einer Woche rund ' + Math.round((Math.exp(up) - 1) * 100) + ' % zu.', sym: s.id }); }
      // Mean-Reversion gegen Extremwerte
      r -= 0.02 * Math.log(m.price / s.price);
      if (crash) r -= crash * R.randRange(1.2, 1.8);
      m.price = Math.max(0.0005, m.price * Math.exp(r));
      E.marketPush(m, crash ? 'Crash' : null, st, s.id);
    });
    st.savingsRate = R.clamp(st.savingsRate + R.gauss(0, 0.001), 0.005, 0.04);
    E.marketRecords(st, alerts);
    if (alerts.length) { st.marketAlerts = (st.marketAlerts || []).concat(alerts).slice(-8); }
  };
  // Rekordhöhen: Marktindex (Aktien), einzelne Werte im eigenen Depot, Depotwert des eigenen Vereins
  E.marketIndex = function (st) {
    var lg = 0, n = 0;
    D.stocks.forEach(function (s) { if (s.club) return; var m = st.market.stocks[s.id]; if (m) { lg += Math.log(m.price / s.price); n++; } });
    return n ? Math.round(1000 * Math.exp(lg / n)) : 1000;
  };
  E.marketRecords = function (st, alerts) {
    var mk = st.market, idx = E.marketIndex(st);
    if (mk.indexAth == null) mk.indexAth = idx;
    if (idx > mk.indexAth * 1.005) {
      if (!mk.indexAthTick || (st.tick || 0) - mk.indexAthTick >= 4) alerts.push({ k: 'ath', ic: '🏛', t: 'Rekordhoch am Aktienmarkt!', x: 'Der ANWURF-Aktienindex steigt auf ' + R.fmtNum(idx) + ' Punkte – so hoch stand er noch nie. Die Stimmung an der Börse ist euphorisch.' });
      mk.indexAth = idx; mk.indexAthTick = st.tick || 0;
    }
    var uc = R.season.userClub(st); if (!uc) return;
    Object.keys(uc.portfolio).forEach(function (sym) {
      var m = mk.stocks[sym] || mk.crypto[sym], def = E.marketDef(sym); if (!m || !def) return;
      var ath = Math.max.apply(null, m.hist.slice(0, -1));
      if (m.price > ath * 1.01 && (!m.athTick || (st.tick || 0) - m.athTick >= 4)) {
        m.athTick = st.tick || 0;
        alerts.push({ k: 'pfath', ic: '⭐', t: def.name + ' auf Rekordhoch', x: 'Ihr Depotwert ' + def.name + ' notiert bei ' + (m.price >= 1 ? m.price.toFixed(2).replace('.', ',') : m.price.toFixed(4).replace('.', ',')) + ' € – höher als je zuvor in den letzten zwei Jahren. Ihr Bestand ist jetzt ' + R.fmtMoney(uc.portfolio[sym].qty * m.price) + ' wert.' });
      }
    });
    var pv = E.portfolioValue(st, uc);
    if (pv >= 5000 && pv > (uc.pfAth || 0) * 1.03) {
      if (uc.pfAth && (!uc.pfAthTick || (st.tick || 0) - uc.pfAthTick >= 4)) alerts.push({ k: 'pfrec', ic: '💼', t: 'Depot auf Rekordstand!', x: 'Ihr Wertpapierdepot ist jetzt ' + R.fmtMoney(pv) + ' wert – so viel wie nie zuvor.' });
      uc.pfAth = pv; uc.pfAthTick = st.tick || 0;
    }
  };
  E.buyAsset = function (st, club, sym, qty) {
    E.ensureMarkets(st);
    qty = Math.floor(qty); var price = E.price(st, sym), def = E.marketDef(sym);
    if (!(qty > 0) || !price) return { ok: false, why: 'Ungültige Menge' };
    if (def && def.club) {
      var bv = E.bvbClub(st); if (!bv) return { ok: false, why: 'Diese Aktie wird in dieser Spielwelt nicht gehandelt' };
      if (bv.id === club.id) return { ok: false, why: 'Eigene Vereinsaktien können Sie nicht kaufen' };
      var have = club.portfolio[sym] ? club.portfolio[sym].qty : 0;
      qty = Math.min(qty, def.shares - have);
      if (qty <= 0) return { ok: false, why: 'Alle Aktien gehören bereits Ihnen' };
    }
    // Große Käufe der Vereinsaktie treiben den Kurs; gehandelt wird zum Mittel aus altem und neuem Kurs
    var impact = def && def.club ? Math.min(0.5, qty / def.shares * 0.9) : 0;
    var cost = qty * price * (1 + impact / 2) * 1.005;
    if (cost > club.cash) return { ok: false, why: 'Nicht genug Geld' };
    var pf = club.portfolio[sym] || { qty: 0, cost: 0 };
    pf.qty += qty; pf.cost += cost; club.portfolio[sym] = pf; club.cash -= cost;
    E.book(club, 'Kapitalanlagen', -cost);
    if (impact) st.market.stocks[sym].price *= 1 + impact;
    return { ok: true, cost: cost, takeover: def && def.club ? E.bvbStake(st, club) > 0.5 : false };
  };
  E.bvbStake = function (st, club) { var d = E.marketDef('BVB'), pf = club.portfolio.BVB; return pf && d ? pf.qty / d.shares : 0; };
  // Übernahme: alle Spieler, das Vermögen und die Vereinsanlagen-Werte gehen an den Käufer, der Verein steigt zwangsweise ab
  E.takeoverBVB = function (st, club) {
    var bv = E.bvbClub(st); if (!bv || bv.id === club.id || bv.takenOverBy) return { ok: false, why: 'Übernahme nicht möglich' };
    if (E.bvbStake(st, club) <= 0.5) return { ok: false, why: 'Keine Mehrheit' };
    var moved = 0;
    Object.keys(st.players).forEach(function (id) {
      var p = st.players[id]; if (p.clubId !== bv.id) return;
      if (bv.lineup) bv.lineup = bv.lineup.map(function (x) { return x === p.id ? null : x; });
      p.clubId = club.id; p.listed = false; p.joined = st.season; moved++;
      st.transfers.unshift({ season: st.season, week: st.week, pid: p.id, name: W.playerName(p), from: bv.name, fromId: bv.id, to: club.name, toId: club.id, fee: 0, loan: false });
    });
    bv.lineup = []; bv.bench = []; bv.manualLineup = false;
    var cash = Math.max(0, Math.round(bv.cash + bv.savings));
    club.cash += cash; E.book(club, 'Übernahme ' + bv.short, cash); bv.cash = 0; bv.savings = 0;
    // Aktien bleiben als Beteiligung bestehen, der Kurs bricht ein
    var m = st.market.stocks.BVB; m.price *= 0.35; E.marketPush(m, 'Übernahme', st, 'BVB');
    bv.takenOverBy = club.id; bv.forcedRelegation = true; bv.reputation = Math.max(10, bv.reputation - 25);
    bv.history.push({ season: st.season, type: 'abstieg', text: 'Übernahme durch ' + club.name + ' – Zwangsabstieg zum Saisonende' });
    // Damit der Spielbetrieb weiterläuft: Notkader aus Amateuren
    var mean = R.season.leagueMean(st, Math.min(3, bv.league + 1)) - 10;
    [['TW', 2], ['AUS', 6], ['RUE', 6], ['KRS', 4]].forEach(function (pp) { for (var i = 0; i < pp[1]; i++) { var np = W.genPlayer(st, pp[0], R.clamp(R.gauss(mean, 3), 30, 80), R.randInt(19, 30), bv.id); np.contract = 1; } });
    R.match.autoBest(st, bv);
    R.season.news(st, 'SENSATION: ' + club.name + ' übernimmt ' + bv.name + '!', moved + ' Spieler und ' + R.fmtMoney(cash) + ' wechseln den Besitzer. ' + bv.short + ' muss zum Saisonende zwangsweise absteigen.', 'transfer');
    return { ok: true, players: moved, cash: cash, club: bv };
  };
  E.sellAsset = function (st, club, sym, qty) {
    var pf = club.portfolio[sym]; qty = Math.floor(Math.min(qty, pf ? pf.qty : 0));
    if (!(qty > 0)) return { ok: false, why: 'Keine Anteile' };
    var sd = E.marketDef(sym), impact = sd && sd.club ? Math.min(0.5, qty / sd.shares * 0.9) : 0;
    var price = E.price(st, sym), revenue = qty * price * (1 - impact / 2) * 0.995;
    if (impact) st.market.stocks[sym].price *= 1 - impact;
    var costPart = pf.cost * qty / pf.qty;
    pf.qty -= qty; pf.cost -= costPart; club.cash += revenue;
    if (pf.qty <= 0) delete club.portfolio[sym];
    E.book(club, 'Kapitalanlagen', revenue);
    club.tradeProfit = (club.tradeProfit || 0) + (revenue - costPart);
    return { ok: true, revenue: revenue, profit: revenue - costPart };
  };
  E.portfolioValue = function (st, club, kind) {
    var v = 0;
    Object.keys(club.portfolio).forEach(function (sym) {
      var isCrypto = !!st.market.crypto[sym];
      if (kind === 'stocks' && isCrypto) return; if (kind === 'crypto' && !isCrypto) return;
      v += club.portfolio[sym].qty * E.price(st, sym);
    });
    return v;
  };

  // Geheimer Cheat: das Schild „BANKDIREKTOR“
  // Jeder Klick bringt einen Zufallsbetrag. Ob ein Spruch erscheint, entscheidet die Oberfläche (nur beim ersten Klick je Sitzung).
  E.CHEAT_AMOUNT = 50000;
  // Zufallsbetrag je Klick (Wahrscheinlichkeit in %): halbe ANPFIFF!-Werte – am häufigsten 50.000 €, höchstens 2,5 Mio. €
  E.CHEAT_TABLE = [[50000, 35], [100000, 15], [125000, 12], [250000, 10], [375000, 8], [500000, 7], [750000, 6], [1000000, 5], [2500000, 2]];
  E.cheatAmount = function (rnd) {
    var x = (rnd == null ? Math.random() : rnd) * 100, acc = 0;
    for (var i = 0; i < E.CHEAT_TABLE.length; i++) { acc += E.CHEAT_TABLE[i][1]; if (x < acc) return E.CHEAT_TABLE[i][0]; }
    return E.CHEAT_TABLE[0][0];
  };
  E.bankCheat = function (st, club, rnd) {
    if (!st.settings.cheatEnabled || !club) return null;
    var firstEver = !st.cheatUsed, amt = E.cheatAmount(rnd); // eigener Zufall (Math.random), der Spielzufall bleibt unberührt
    st.cheatClicks = (st.cheatClicks || 0) + 1;
    club.cash += amt; E.book(club, 'Sonstiges', amt);
    st.cheatUsed = true; st.cheatTotal = (st.cheatTotal || 0) + amt;
    R.season.achieve(st, 'bankdirector');
    return {
      paid: amt, first: firstEver, jackpot: amt >= 2500000,
      lines: firstEver ? ['Sie haben versehentlich den geheimen Buchhaltungskeller geöffnet.', 'Herr Buchungsfehler hat eine Überweisung gefunden, die offenbar seit 1991 auf Bearbeitung wartet.']
        : [R.pick(D.cheatMessages)]
    };
  };

  // Wöchentliche Finanzen (laufende Einnahmen/Ausgaben, ohne Spieltagseinnahmen)
  E.weeklyFinance = function (st, club) {
    var r = E.weeklyLines(st, club), total = 0;
    // Tagesgeldzinsen laufen wöchentlich auf und werden monatlich (alle 4 Spielwochen) dem Girokonto gutgeschrieben
    var zins = r['Zinserträge'] || 0; delete r['Zinserträge'];
    Object.keys(r).forEach(function (k) { total += r[k]; E.book(club, k, r[k]); });
    club.cash += total;
    club.interestAccrued = (club.interestAccrued || 0) + zins;
    var paid = E.interestPayday(st) ? E.payInterest(st, club) : 0;
    if (zins) r['Zinserträge'] = zins;
    return { lines: r, total: total + paid, interestPaid: paid };
  };
  E.INTEREST_MONTH = 4; // Spielwochen je Zinsmonat
  E.interestPayday = function (st) { return st.phase === 'season' && (st.week % E.INTEREST_MONTH === 0 || st.week >= R.season.SEASON_WEEKS); };
  E.nextInterestWeek = function (st) { var w = st.phase === 'season' ? st.week : 0, n = (Math.floor(w / E.INTEREST_MONTH) + 1) * E.INTEREST_MONTH; return Math.min(n, R.season.SEASON_WEEKS); };
  E.payInterest = function (st, club) {
    var amt = Math.round(club.interestAccrued || 0); club.interestAccrued = 0;
    if (!amt) return 0;
    club.cash += amt; E.book(club, 'Zinserträge', amt);
    club.interestLog = (club.interestLog || []).concat([{ s: st.season, w: st.week, a: amt }]).slice(-12);
    return amt;
  };
  // Laufende Wochenposten (ohne Buchung) – Grundlage für Buchung und Prognose
  E.weeklyLines = function (st, club) {
    var n = E.WEEKS, diff = W.diffSettings[st.settings.difficulty];
    var costF = club.userControlled ? (0.9 + 0.1 * diff.econ) : 1;
    var lines = {};
    function add(cat, v) { lines[cat] = (lines[cat] || 0) + v; }
    add('TV-Gelder', D.leagueTV[club.league] / n);
    add('Sponsoren', E.sponsorTotal(club) / n);
    var city = 0;
    ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe'].forEach(function (k) { city += E.buildingRevenue(st, club, k); });
    add('Vereinsstadt', city / n);
    var wages = 0, youthW = 0;
    for (var id in st.players) { var p = st.players[id]; if (p.clubId === club.id) { if (p.youth) youthW += p.wage; else wages += p.wage; } }
    add('Spielergehälter', -wages / n);
    add('Nachwuchsgehälter', -youthW / n);
    add('Trainer & Personal', -((club.coach ? club.coach.wage : 0) + E.staffWages(club) + { 1: 1500000, 2: 500000, 3: 150000 }[club.league] * D.MONEY) / n);
    if (club.lawyer && club.lawyer.wage) add('Rechtsberatung', -club.lawyer.wage / n);
    add('Unterhalt Anlagen', -E.upkeepTotal(club) * costF / n);
    var budgets = 0; Object.keys(D.budgetAreas).forEach(function (a) { budgets += E.budgetCost(club, a); });
    add('Verwaltung & Budgets', -budgets * costF / n);
    var debt = E.debt(club);
    if (debt > 0) add('Kreditzinsen', -R.sum(club.loans, function (l) { return l.amount * l.rate; }) / n);
    if (club.cash < 0) add('Dispozinsen', club.cash * 0.12 / n);
    if (club.savings > 0) add('Zinserträge', club.savings * st.savingsRate / n);
    Object.keys(lines).forEach(function (k) { lines[k] = Math.round(lines[k]); });
    return lines;
  };

  // Bilanzprognose bis Saisonende: laufende Posten × Restwochen, Heimspiel-Einnahmen der restlichen
  // Ligaspiele (aktuelle Preise, Nachfrage und Gegner), Liga-Prämie und Sponsorenboni nach aktuellem Tabellenplatz.
  // Nicht enthalten: Pokal, Transfers, neue Bauprojekte, Kursänderungen.
  E.forecast = function (st, club) {
    var S = R.season, total = S.SEASON_WEEKS;
    var from = st.phase === 'preseason' ? 0 : st.phase === 'season' ? st.week : total;
    var weekly = E.weeklyLines(st, club), wk = 0;
    Object.keys(weekly).forEach(function (k) { wk += weekly[k]; });
    var lines = {}, path = [club.cash], cash = club.cash, homeGames = 0;
    function add(k, v) { lines[k] = (lines[k] || 0) + v; }
    if (st.phase === 'preseason' && st.leagues[W.lk(club)]) { var sq = E.seasonHolders(st, club), sxq = E.ensureTix(club); if (!sq.sold) { var dkR = Math.round(sq.steh * sxq.steh.price + sq.sitz * sxq.sitz.price), lgR = Math.round(sq.logen * club.tickets.loge); if (dkR) add('Dauerkarten', dkR); if (lgR) add('Logenvermietung', lgR); cash += dkR + lgR; } }
    var acc = Math.round(club.interestAccrued || 0); // bereits aufgelaufene, noch nicht gutgeschriebene Zinsen
    if (acc && from < total) { add('Zinserträge', acc); cash += acc; }
    for (var w = from + 1; w <= total; w++) {
      Object.keys(weekly).forEach(function (k) { add(k, weekly[k]); });
      var wkCash = wk;
      if (st.leagues[W.lk(club)]) S.roundsOf(st, W.lk(club), w).forEach(function (r) {
        (st.leagues[W.lk(club)].fixtures[r] || []).forEach(function (f) {
          if (f.h !== club.id) return;
          var a = E.attendance(st, club, st.clubs[f.a], 'league'), t = Math.round(a.ticket), g = Math.round(a.cater), pk = Math.round(a.parking);
          add('Eintrittsgelder', t); add('Hallengastronomie', g); add('Parkgebühren', pk);
          wkCash += t + g + pk; homeGames++;
        });
      });
      cash += wkCash; path.push(cash);
    }
    // Saisonende
    var pos = E.leaguePos(st, club), lg = st.leagues[W.lk(club)], n = lg ? lg.clubIds.length : 18, end = 0;
    var pr = S.LEAGUE_PRIZE[club.league];
    if (pr && from < total + 1) {
      var prize = Math.round(pr[0] - (pr[0] - pr[1]) * (pos - 1) / Math.max(1, n - 1)); add('Prämien', prize); end += prize;
      club.sponsors.forEach(function (s) {
        var b = 0; if (pos <= s.topN) b += s.bonusTop || 0; if (pos === 1 && club.league === 1) b += s.bonusTitle || 0; if (club.league > 1 && pos <= (club.league === 3 ? 1 : 2)) b += s.bonusPromo || 0;
        if (b) { add('Sponsorenboni', b); end += b; }
      });
    }
    if (end) { cash += end; path.push(cash); }
    // Immobilien: Mieten, Kosten, Zinsen, Tilgung und Bauauszahlungen zu den tatsächlichen Monatsenden im Zeitraum
    if (R.realty && st.realty && (st.realty.props.some(function (p) { return p.club === club.id; }) || st.realty.loans.some(function (l) { return l.club === club.id; }))) {
      var rf = R.realty.forecast(st, club, Math.max(0, total - from));
      if (rf.rent) add('Mieteinnahmen', rf.rent); if (rf.cost) add('Immobilienkosten', -rf.cost); if (rf.zins) add('Immobilienzinsen', -rf.zins); if (rf.tilg) add('Tilgung Immobilien', -rf.tilg); if (rf.bau) add('Bauprojekte Immobilien', -rf.bau);
      var dr = rf.rent - rf.cost - rf.zins - rf.tilg - rf.bau; cash += dr; path.push(cash);
    }
    var inc = 0, exp = 0;
    Object.keys(lines).forEach(function (k) { if (lines[k] > 0) inc += lines[k]; else exp += lines[k]; });
    return { weeksLeft: Math.max(0, total - from), from: from, homeGames: homeGames, lines: lines, income: inc, expense: exp, endCash: cash, path: path, pos: pos, seasonEnd: end };
  };

  E.matchdayIncome = function (st, club, att) {
    var inc = Math.round(att.ticket), cat = Math.round(att.cater), park = Math.round(att.parking);
    if (att.shark && club.userControlled) E.markShark(st, club, inc);
    club.cash += inc + cat + park;
    E.book(club, 'Eintrittsgelder', inc); E.book(club, 'Hallengastronomie', cat); E.book(club, 'Parkgebühren', park);
    return inc + cat + park;
  };

  E.fanGrowthWeekly = function (st, club, result, att) {
    var g = result > 0 ? 0.0018 : result < 0 ? -0.0012 : 0.0002;
    g += [-0.0004, 0, 0.0006][club.budgets.marketing] + [-0.0004, 0, 0.0005][club.budgets.fans];
    if (att && att.congestion > 0.1) g -= att.congestion * 0.004;
    if (att && att.total >= att.capacity * 0.98) g += 0.0004; // ausverkauft: Hype
    g += [0.0003, 0, -0.0003][club.cityPrice == null ? 1 : club.cityPrice];
    g += ((club.fanTrust != null ? club.fanTrust : 60) - 60) * 0.00002;
    club.fans = R.clamp(Math.round(club.fans * (1 + g)), 300, 40000);
  };

  // Sponsorenangebote für offene Kategorien
  // ---------- Bandenwerbung: 20 einzeln vermietbare Banden ----------
  // G = Gegengerade (TV-Seite, 6), H = Haupttribüne (6), L/R = hinter dem linken/rechten Tor (je 4: 2 links, 2 rechts vom Tor)
  E.BANDE_SIDES = { G: 'Gegengerade (TV-Seite)', H: 'Haupttribünenseite', L: 'Hinter dem linken Tor', R: 'Hinter dem rechten Tor' };
  E.BANDE_SLOTS = (function () {
    var out = [], i;
    for (i = 1; i <= 6; i++) out.push({ id: 'G' + i, side: 'G', w: i === 3 || i === 4 ? 1.45 : i === 2 || i === 5 ? 1.25 : 1.05 });
    for (i = 1; i <= 6; i++) out.push({ id: 'H' + i, side: 'H', w: i === 3 || i === 4 ? 1.1 : i === 2 || i === 5 ? 1.0 : 0.85 });
    ['L', 'R'].forEach(function (t) { for (var j = 1; j <= 4; j++) out.push({ id: t + j, side: t, w: j === 2 || j === 3 ? 0.85 : 0.7 }); });
    return out;
  })();
  var BANDE_W = E.BANDE_SLOTS.reduce(function (n, s) { return n + s.w; }, 0);
  E.bandeSlot = function (id) { return E.BANDE_SLOTS.filter(function (s) { return s.id === id; })[0]; };
  E.bandeLabel = function (id) {
    var s = E.bandeSlot(id); if (!s) return id;
    var n = +id.slice(1);
    if (s.side === 'L' || s.side === 'R') return E.BANDE_SIDES[s.side] + ' · ' + (n <= 2 ? 'links' : 'rechts') + ' vom Tor (' + id + ')';
    return E.BANDE_SIDES[s.side] + ' · Bande ' + n + ' (' + id + ')';
  };
  E.bandeOf = function (club) { return club.sponsors.filter(function (s) { return s.cat === 'bande' && s.slot; }); };
  E.bandeFree = function (club) {
    var used = {}; E.bandeOf(club).forEach(function (s) { used[s.slot] = 1; });
    return E.BANDE_SLOTS.filter(function (s) { return !used[s.id]; }).map(function (s) { return s.id; });
  };
  function bandeScale(s, slot, f) {
    s.slot = slot; s.amount = Math.max(500, R.round(s.amount * f, 500));
    ['bonusTop', 'bonusPromo', 'bonusTitle'].forEach(function (k) { s[k] = R.round((s[k] || 0) * f, 500); });
    return s;
  }
  E.bandeOffer = function (st, club, slot, adminF) {
    var sl = E.bandeSlot(slot), s = W.genSponsor(st, club, 'bande');
    return bandeScale(s, slot, sl.w / BANDE_W * (adminF || 1) * R.randRange(0.9, 1.1));
  };
  E.bandeOffers = function (st, club, slot) {
    var adminF = [0.95, 1, 1.06][club.budgets.admin] * [0.97, 1, 1.05][club.budgets.marketing], out = [];
    for (var i = 0; i < 3; i++) out.push(E.bandeOffer(st, club, slot, adminF));
    return out;
  };
  // Ältere Spielstände / Editor: ein Bandenvertrag ohne Platz wird auf alle freien Banden verteilt
  // spread: neue Spielwelt – jede Bande an eine eigene Firma; sonst (alter Vertrag) behalten alle Banden den Vertragspartner
  E.ensureBande = function (st, club, spread) {
    if (!club || !club.sponsors) return;
    var loose = club.sponsors.filter(function (s) { return s.cat === 'bande' && !s.slot; });
    if (!loose.length) return;
    club.sponsors = club.sponsors.filter(function (s) { return !(s.cat === 'bande' && !s.slot); });
    var src = loose[0], free = E.bandeFree(club);
    free.forEach(function (id) {
      var sl = E.bandeSlot(id), f = sl.w / BANDE_W;
      // jede Bande an eine eigene Firma (erst wenn alle Namen vergeben sind, wiederholen sie sich)
      var nm = spread && id !== free[0] && W.genSponsor ? W.genSponsor(st, club, 'bande').name : src.name;
      club.sponsors.push(bandeScale({ id: W.nextId(st, 'sponsor'), cat: 'bande', name: nm, amount: src.amount, years: src.years, topN: src.topN, bonusTop: src.bonusTop, bonusPromo: src.bonusPromo, bonusTitle: src.bonusTitle }, id, f));
    });
  };
  // Pakete: eine Firma mietet mehrere freie Banden (ganze Seite, Paare, alle freien) mit Mengenrabatt
  E.bandeGroupName = function (ids) {
    if (ids.length === 20) return 'Alle 20 Banden';
    var sides = {}; ids.forEach(function (id) { (sides[id[0]] = sides[id[0]] || []).push(id); });
    return Object.keys(sides).map(function (k) { var l = sides[k], full = E.BANDE_SLOTS.filter(function (s) { return s.side === k; }).length === l.length; return E.BANDE_SIDES[k] + (full ? ' komplett' : ' (' + l.join(', ') + ')'); }).join(' + ');
  };
  E.bandePackages = function (st, club) {
    var free = E.bandeFree(club), cands = [], seen = {};
    function add(ids) { if (ids.length < 2) return; var k = ids.join(','); if (seen[k]) return; seen[k] = 1; cands.push(ids); }
    ['G', 'H', 'L', 'R'].forEach(function (side) {
      var l = free.filter(function (id) { return id[0] === side; }); add(l);
      for (var i = 0; i + 1 < l.length; i++) if (+l[i + 1].slice(1) === +l[i].slice(1) + 1 && !((side === 'L' || side === 'R') && l[i].slice(1) === '2')) add([l[i], l[i + 1]]);
    });
    var ends = free.filter(function (id) { return id[0] === 'L' || id[0] === 'R'; }); if (ends.length >= 4) add(ends);
    if (free.length >= 4) add(free);
    cands.sort(function (a, b) { return b.length - a.length; });
    var pick = cands.slice(0, 2).concat(R.shuffle(cands.slice(2)).slice(0, 2)), adminF = [0.95, 1, 1.06][club.budgets.admin] * [0.97, 1, 1.05][club.budgets.marketing];
    return pick.map(function (ids) {
      var s = W.genSponsor(st, club, 'bande'), wsum = ids.reduce(function (n, id) { return n + E.bandeSlot(id).w; }, 0), disc = 1 - Math.min(0.12, ids.length * 0.012);
      var total = Math.max(1000, R.round(s.amount * wsum / BANDE_W * adminF * disc * R.randRange(0.92, 1.08), 1000));
      return { name: s.name, slots: ids, total: total, per: Math.round(total / ids.length), years: s.years, topN: s.topN, disc: Math.round((1 - disc) * 100) };
    });
  };
  E.signBandePackage = function (st, club, pkg) {
    var free = E.bandeFree(club); if (!pkg || !pkg.slots.every(function (id) { return free.indexOf(id) >= 0; })) return { ok: false, why: 'Banden nicht mehr frei' };
    var wsum = pkg.slots.reduce(function (n, id) { return n + E.bandeSlot(id).w; }, 0), pid = W.nextId(st, 'sponsor');
    pkg.slots.forEach(function (id) {
      E.signBande(st, club, id, { id: W.nextId(st, 'sponsor'), cat: 'bande', name: pkg.name, amount: Math.round(pkg.total * E.bandeSlot(id).w / wsum), years: pkg.years, topN: pkg.topN, bonusTop: 0, bonusPromo: 0, bonusTitle: 0, pkg: pid, pkgN: pkg.slots.length, pkgTotal: pkg.total });
    });
    return { ok: true };
  };
  E.signBande = function (st, club, slot, offer) {
    if (!E.bandeSlot(slot) || !offer) return { ok: false };
    club.sponsors = club.sponsors.filter(function (s) { return !(s.cat === 'bande' && s.slot === slot); });
    offer.slot = slot; offer.cat = 'bande'; club.sponsors.push(offer);
    if (club.bandeOff) delete club.bandeOff[slot];
    return { ok: true };
  };
  E.sponsorOffers = function (st, club, cat) {
    var adminF = [0.95, 1, 1.06][club.budgets.admin] * [0.97, 1, 1.05][club.budgets.marketing];
    var out = [];
    for (var i = 0; i < 3; i++) { var s = W.genSponsor(st, club, cat); s.amount = R.round(s.amount * adminF * R.randRange(0.85, 1.15), 1000); out.push(s); }
    return out;
  };
})(RFM);
