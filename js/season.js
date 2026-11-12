// ANWURF! – Saisonablauf: Spielplan, Spieltage, DHB-Pokal, Aufstiegsrunde, Saisonwechsel, Karriere
(function (R) {
  var D = R.data, W = R.world, E = R.econ, M = R.match, T = R.transfers;
  var S = R.season = {};

  // Pokalrunden: Qualifikation (Vorbereitung Woche 3) und 1. Runde (Woche 4), danach Spielwochen der Liga.
  // -1 = Vorbereitung Woche 3, 0 = Vorbereitung Woche 4, sonst Spielwoche
  S.CUP_WEEKS = [-1, 0, 7, 12, 20, 27, 31];
  S.CUP_FINAL = 6;
  S.PREP_WEEKS = 4;      // Saisonvorbereitung
  S.WINTER_AFTER = 17;   // Winterpause (EM/WM-Pause) nach dem 17. Spieltag …
  S.WINTER_WEEKS = 6;    // … für 6 Wochen
  // Pokalrunde dieser Woche (Index) oder -1
  S.cupRoundNow = function (st) {
    if (st.phase === 'preseason') { var pw = st.prep || 1; return pw === S.PREP_WEEKS - 1 ? 0 : pw === S.PREP_WEEKS ? 1 : -1; }
    // offene Runden aus der Vorbereitung im nächsten Ligaspiel nachholen
    if (st.phase === 'season' && st.cup && st.cup.rounds.length <= 2 && !st.cup.rounds[st.cup.rounds.length - 1].ties.every(function (t) { return t.winner; })) return st.cup.rounds.length - 1;
    if (st.phase === 'season') { var w = st.week + 1, i = S.CUP_WEEKS.indexOf(w); return w >= 1 && i > 1 ? i : -1; }
    return -1;
  };
  // Kalendertext: „Vorbereitung 2/4“, „7. Spieltag“, „Winterpause 3/6“
  S.calText = function (st, short) {
    if (st.phase === 'preseason') return (short ? 'Vorb. ' : 'Vorbereitung ') + (st.prep || 1) + '/' + S.PREP_WEEKS;
    if (st.phase === 'winter') return (short ? 'Winter ' : 'Winterpause ') + (st.winter || 1) + '/' + S.WINTER_WEEKS;
    if (st.phase === 'season') return short ? st.week + '/34' : st.week + '. Spieltag';
    return st.phase === 'releg' ? 'Aufstiegsrunde' : 'Saisonende';
  };
  S.fxLabel = function (st, fx) {
    if (fx.comp === 'league') return (st.week + 1) + '. Spieltag';
    if (fx.comp === 'friendly') return 'Testspiel (' + S.calText(st) + ')';
    if (fx.comp === 'releg') return 'Aufstiegsrunde';
    var ci = S.cupRoundNow(st); return 'DHB-Pokal – ' + (st.cup.rounds[ci] ? st.cup.rounds[ci].name : '');
  };
  S.isBreak = function (st) { return st.phase === 'preseason' || st.phase === 'winter'; };
  // Wochen-Schlüssel für die Planung der Vorbereitung/Winterpause
  S.breakKey = function (st) { return st.phase === 'winter' ? 'w' + (st.winter || 1) : 'p' + (st.prep || 1); };
  S.CUP_NAMES = ['Qualifikation', '1. Runde', '2. Runde', 'Achtelfinale', 'Viertelfinale', 'Halbfinale', 'Finale'];
  S.CUP_PRIZE = [5000, 10000, 20000, 40000, 80000, 150000, 300000];
  // Ligaprämien je Spielklasse (1. bis letzter Platz)
  S.LEAGUE_PRIZE = { 1: [1200000, 300000], 2: [300000, 80000], 3: [60000, 15000] };
  S.prizeFor = function (key) { return S.LEAGUE_PRIZE[D.leagueTier[key]]; };

  S.news = function (st, title, text, type) {
    st.news.unshift({ season: st.season, week: st.week, title: title, text: text || '', type: type || 'info' });
    if (st.news.length > 120) st.news.length = 120;
  };
  S.achieve = function (st, key) {
    if (st.achievements[key]) return false;
    st.achievements[key] = { season: st.season, week: st.week, cheat: !!st.cheatUsed };
    S.news(st, 'Erfolg freigeschaltet: ' + D.achievements[key][0], D.achievements[key][1], 'achievement');
    st.toast = { text: '🏆 ' + D.achievements[key][0] };
    return true;
  };
  S.userClub = function (st) { return st.manager.unemployed ? null : st.clubs[st.manager.clubId]; };

  // Spielwochen je Saison (34). Die Staffeln der 3. Liga (16 Vereine = 30 Spieltage) haben spielfreie Wochen.
  S.SEASON_WEEKS = 34;
  S.weekPlan = function (nRounds) {
    var W_ = S.SEASON_WEEKS, diff = nRounds - W_, special = {};
    if (diff !== 0) {
      // Sonderwochen gleichmäßig verteilen, möglichst nicht in Pokalwochen und nicht in der Winterpause (16–18)
      var cand = [];
      for (var w = 3; w <= W_ - 1; w++) if (S.CUP_WEEKS.indexOf(w) < 0 && (w < 16 || w > 18)) cand.push(w);
      var k = Math.min(Math.abs(diff), cand.length);
      for (var i = 0; i < k; i++) special[cand[Math.floor((i + 0.5) * cand.length / k)]] = true;
    }
    var plan = [], r = 0;
    for (var wk = 1; wk <= W_; wk++) {
      var n = special[wk] ? (diff > 0 ? 2 : 0) : 1, md = [];
      for (var j = 0; j < n && r < nRounds; j++) md.push(r++);
      plan.push(md);
    }
    while (r < nRounds) plan[W_ - 1].push(r++); // Sicherheitsnetz
    return plan;
  };
  // Spieltage (Indizes in lg.fixtures), die in Spielwoche „week“ (1-basiert) stattfinden
  S.roundsOf = function (st, l, week) {
    var lg = st.leagues[l];
    if (!lg.weeks) return week >= 1 && week <= lg.fixtures.length ? [week - 1] : [];
    return lg.weeks[week - 1] || [];
  };
  // Anzahl der Spieltage bis einschließlich Spielwoche „week“
  S.roundsUpTo = function (st, l, week) {
    var n = 0; for (var w = 1; w <= week; w++) n += S.roundsOf(st, l, w).length; return n;
  };
  S.leagueSize = function (st, l) { return st.leagues[l] ? st.leagues[l].clubIds.length : 18; };

  // Doppelrunde (Kreismethode): jede Mannschaft hat gleich viele Heim- und Auswärtsspiele
  S.makeSchedule = function (ids) {
    var teams = R.shuffle(ids.slice()), n = teams.length, rounds = [];
    var fixed = teams[0], rot = teams.slice(1);
    for (var r = 0; r < n - 1; r++) {
      var md = [], cur = [fixed].concat(rot);
      for (var i = 0; i < n / 2; i++) {
        var a = cur[i], b = cur[n - 1 - i];
        var home = (i === 0) ? (r % 2 === 0 ? a : b) : (i % 2 === 0 ? a : b); // Heim/Auswärts wechseln sich ab
        md.push({ h: home, a: home === a ? b : a, r: null });
      }
      rounds.push(md);
      rot.unshift(rot.pop());
    }
    var second = rounds.map(function (md) { return md.map(function (f) { return { h: f.a, a: f.h, r: null }; }); });
    return rounds.concat(second);
  };

  S.table = function (st, lvl, mode, uptoWeek) {
    var lg = st.leagues[lvl], rows = {};
    lg.clubIds.forEach(function (id) { rows[id] = { id: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] }; });
    var lim = uptoWeek || lg.fixtures.length;
    for (var w = 0; w < lim && w < lg.fixtures.length; w++) {
      lg.fixtures[w].forEach(function (f) {
        if (!f.r) return;
        var h = rows[f.h], a = rows[f.a]; if (!h || !a) return;
        var hg = f.r.hg, ag = f.r.ag;
        // Handball: 2 Punkte für einen Sieg, 1 für ein Unentschieden
        if (mode !== 'away') { h.p++; h.gf += hg; h.ga += ag; if (hg > ag) { h.w++; h.pts += 2; h.form.push('S'); } else if (hg === ag) { h.d++; h.pts++; h.form.push('U'); } else { h.l++; h.form.push('N'); } }
        if (mode !== 'home') { a.p++; a.gf += ag; a.ga += hg; if (ag > hg) { a.w++; a.pts += 2; a.form.push('S'); } else if (hg === ag) { a.d++; a.pts++; a.form.push('U'); } else { a.l++; a.form.push('N'); } }
        if (mode === 'home') { a.form.push(ag > hg ? 'S' : ag === hg ? 'U' : 'N'); }
        if (mode === 'away') { h.form.push(hg > ag ? 'S' : hg === ag ? 'U' : 'N'); }
      });
    }
    var arr = Object.keys(rows).map(function (k) { var r = rows[k]; var c = st.clubs[k]; if (!mode && c && c.pointsPenalty) r.pts -= c.pointsPenalty; r.pen = (!mode && c) ? c.pointsPenalty || 0 : 0; return r; });
    if (mode === 'form') {
      arr.forEach(function (r) { var f = r.form.slice(-5); r.pts = R.sum(f, function (x) { return x === 'S' ? 2 : x === 'U' ? 1 : 0; }); r.p = f.length; });
    }
    arr.sort(function (a, b) { return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || (st.clubs[a.id].name < st.clubs[b.id].name ? -1 : 1); });
    return arr;
  };

  S.startSeason = function (st, first) {
    D.leagueKeys.forEach(function (l) {
      if (!st.leagues[l]) st.leagues[l] = { level: D.leagueTier[l], key: l, name: D.leagueNames[l], clubIds: [], fixtures: [] };
      st.leagues[l].clubIds = W.clubsInLeague(st, l).map(function (c) { return c.id; });
      st.leagues[l].fixtures = S.makeSchedule(st.leagues[l].clubIds);
      st.leagues[l].weeks = S.weekPlan(st.leagues[l].fixtures.length);
    });
    S.drawCup(st, 0);
    st.releg = null; st.week = 0; st.phase = 'preseason'; st.prep = 1; st.winter = 0; st.campDone = false; st.winterCampDone = false;
    // Abstiegs-/Ligaklausel: Gehälter über der Obergrenze der neuen Liga werden gekappt
    if (W.capWage && !first) Object.keys(st.players).forEach(function (id) {
      var p = st.players[id], c = p && p.clubId ? st.clubs[p.clubId] : null; if (!c || !p.wage) return;
      var cap = W.wageCap(c); if (p.wage <= cap) return;
      if (c.userControlled) S.news(st, 'Ligaklausel: Gehalt von ' + W.playerName(p) + ' angepasst', 'Wegen der Ligazugehörigkeit sinkt sein Jahresgehalt von ' + R.fmtMoney(p.wage) + ' auf ' + R.fmtMoney(cap) + '.', 'finanz');
      p.wage = cap;
    });
    var keep = {}; Object.keys(st.plan || {}).forEach(function (k) { if (k.charAt(0) === 'p' && !st.plan[k].done) keep[k] = st.plan[k]; }); st.plan = keep;
    // Saisonziele / Vorstandserwartung
    D.leagueKeys.forEach(function (l) {
      var cl = W.clubsInLeague(st, l).map(function (c) { M.autoBest(st, c); return { c: c, s: M.squadStrength(st, c) }; }).sort(function (a, b) { return b.s - a.s; });
      cl.forEach(function (x, i) { x.c.expectedPos = i + 1; x.c.leagueSize = cl.length; });
    });
    var uc = S.userClub(st);
    if (uc) {
      st.manager.boardTarget = S.targetFor(uc);
      st.manager.transferBudget = Math.max(0, Math.round(uc.cash * 0.45 / 5000) * 5000);
      S.ensureSponsors(st, uc);
    }
    Object.keys(st.clubs).forEach(function (k) { var c = st.clubs[k]; c.fin.season = {}; c.attendanceHist = []; if (!c.userControlled) S.aiSponsors(st, c); });
  };

  S.targetFor = function (club) {
    var e = club.expectedPos || 9, n = club.leagueSize || 18;
    if (club.league === 3) { // 3. Liga: Nur der Staffelsieger erreicht die Aufstiegsrunde, abgestiegen wird nicht
      if (e <= 2) return { pos: 1, text: 'Staffelsieg (Aufstiegsrunde)' };
      if (e <= 5) return { pos: 5, text: 'Spitzengruppe' };
      if (e <= 10) return { pos: 10, text: 'Gesichertes Mittelfeld' };
      return { pos: n, text: 'Ruhige Saison' };
    }
    if (e <= 2) return { pos: 2, text: club.league === 1 ? 'Meisterschaft' : 'Aufstieg' };
    if (e <= 6) return { pos: 6, text: club.league === 1 ? 'Oberes Tabellendrittel' : 'Aufstiegskampf' };
    if (e <= 12) return { pos: 12, text: 'Gesichertes Mittelfeld' };
    return { pos: club.league === 3 ? n : n - 3, text: club.league === 3 ? 'Ruhige Saison' : 'Klassenerhalt' };
  };

  // ---------- Pokal ----------
  // Nach einer gespielten Pokalrunde: nächste Runde auslosen bzw. Pokalsieger ehren
  S.advanceCup = function (st) {
    if (!st.cup || !st.cup.rounds.length || st.cup.winner) return;
    var n = st.cup.rounds.length, last = st.cup.rounds[n - 1];
    if (!last.ties.every(function (t) { return t.winner; })) return;
    if (n < S.CUP_NAMES.length) S.drawCup(st, n); else S.cupFinished(st);
  };
  S.drawCup = function (st, round) {
    if (round === 0) {
      var all = Object.keys(st.clubs);
      // Freilose für die Qualifikation: alle Bundesligisten, dann Zweitligisten, damit die 1. Runde genau 64 Teams hat (100 Teams → 28 Freilose)
      var nBye = R.clamp(128 - all.length, 0, all.length);
      var l1 = R.shuffle(all.filter(function (id) { return st.clubs[id].league === 1; }));
      var l2 = R.shuffle(all.filter(function (id) { return st.clubs[id].league === 2; }));
      var byes = l1.concat(l2).slice(0, nBye);
      var rest = R.shuffle(all.filter(function (id) { return byes.indexOf(id) < 0; }));
      st.cup = { rounds: [], byes: byes, winner: null, alive: all.slice() };
      st.cup.rounds.push({ name: S.CUP_NAMES[0], week: S.CUP_WEEKS[0], ties: S.pairCup(st, rest) });
      return;
    }
    var prev = st.cup.rounds[round - 1];
    var adv = prev.ties.map(function (t) { return t.winner; });
    if (round === 1) adv = adv.concat(st.cup.byes);
    st.cup.rounds.push({ name: S.CUP_NAMES[round], week: S.CUP_WEEKS[round], ties: S.pairCup(st, R.shuffle(adv), round === S.CUP_FINAL) });
  };
  S.pairCup = function (st, ids, final) {
    var ties = [];
    for (var i = 0; i + 1 < ids.length; i += 2) {
      var a = ids[i], b = ids[i + 1];
      if (!final && st.clubs[a].league < st.clubs[b].league) { var t = a; a = b; b = t; } // Unterklassige haben Heimrecht
      ties.push({ h: a, a: b, r: null, winner: null, neutral: !!final });
    }
    return ties;
  };

  // ---------- Spieltag vorbereiten ----------
  // Liefert alle Partien der Woche; Partien mit Beteiligung des Nutzers werden markiert.
  S.prepareWeek = function (st) {
    var list = [], uc = st.manager.unemployed ? null : st.manager.clubId;
    if (st.phase === 'preseason' || st.phase === 'season' || st.phase === 'winter') {
      var week = st.week + 1;
      if (st.phase === 'season' && week > S.SEASON_WEEKS) return { list: [], week: week };
      var ci = S.cupRoundNow(st);
      if (ci >= 0 && st.cup.rounds[ci]) st.cup.rounds[ci].ties.forEach(function (t, i) {
        list.push({ key: 'C-' + ci + '-' + i, comp: ci === S.CUP_FINAL ? 'final' : 'cup', h: t.h, a: t.a, neutral: t.neutral, extraTime: true });
      });
      // Testspiel aus dem Vorbereitungsplan des Nutzers
      if (S.isBreak(st) && uc) {
        var pl = st.plan && st.plan[S.breakKey(st)];
        if (pl && pl.type === 'test' && st.clubs[pl.opp] && !list.some(function (x) { return x.h === uc || x.a === uc; }))
          list.push({ key: 'F-' + S.breakKey(st), comp: 'friendly', h: pl.home ? uc : pl.opp, a: pl.home ? pl.opp : uc });
      }
      if (st.phase === 'season') D.leagueKeys.forEach(function (l) {
        S.roundsOf(st, l, week).forEach(function (r) {
          st.leagues[l].fixtures[r].forEach(function (f, i) { list.push({ key: 'L-' + l + '-' + r + '-' + i, comp: 'league', h: f.h, a: f.a }); });
        });
      });
    } else if (st.phase === 'releg') {
      st.releg.forEach(function (rg, i) {
        var leg = rg.legs[st.relegLeg];
        var agg = st.relegLeg === 1 ? [rg.legs[0].r.ag, rg.legs[0].r.hg] : null; // aus Sicht des Heimteams im Rückspiel
        list.push({ key: 'R-' + i + '-' + st.relegLeg, comp: 'releg', h: leg.h, a: leg.a, extraTime: st.relegLeg === 1, aggregate: agg });
      });
    }
    list.forEach(function (x) { x.user = (x.h === uc || x.a === uc); });
    return { list: list };
  };

  S.createMatch = function (st, fx) {
    var m = M.create(st, fx.h, fx.a, { comp: fx.comp, neutral: fx.neutral, extraTime: fx.extraTime, aggregate: fx.aggregate });
    m.key = fx.key;
    return m;
  };

  // ---------- Woche abschließen ----------
  // played: { key: fertiges Match-Objekt } (vom Nutzer live gespielte Partien)
  S.completeWeek = function (st, played) {
    played = played || {};
    var prep = S.prepareWeek(st);
    var results = [];
    var suspendedAtStart = {};
    var ucPlan = S.userClub(st); if (ucPlan && R.stadium) R.stadium.ensure(ucPlan); // Hallenplan für den eigenen Verein
    Object.keys(st.players).forEach(function (id) { if (st.players[id].susp > 0) suspendedAtStart[id] = true; });
    var isLeagueWeek = st.phase === 'season';
    if (isLeagueWeek) st.week++;
    st.tick = (st.tick || 0) + 1; // fortlaufende Kalenderwoche (auch Vorbereitung/Winterpause)
    if (E.seasonSales) E.seasonSales(st); // alte Spielstände: Dauerkarten/Logen nachträglich (anteilig)
    if (R.realty) R.realty.tick(st); // Immobilien: Monatsbuchungen am Monatsende (idempotent je Kalenderwoche)

    prep.list.forEach(function (fx) {
      var m = played[fx.key];
      if (!m) { m = S.createMatch(st, fx); M.simulate(m); }
      m.st = st;
      var home = st.clubs[fx.h], away = st.clubs[fx.a];
      // Zuschauer & Einnahmen
      var att;
      if (fx.comp === 'friendly') {
        // Testspiel: kleine Kulisse, kleine Einnahme, keine Tabellen/Sperren
        att = E.attendance(st, home, away, 'friendly');
        if (home.userControlled) E.matchdayIncome(st, home, att);
      } else if (fx.neutral) {
        // Endspiel beim Final Four in Hamburg
        att = { total: 13000, ticket: 400000, cater: 60000, parking: 0, capacity: 13300, parts: {} };
        [home, away].forEach(function (c) { c.cash += 180000; E.book(c, 'Eintrittsgelder', 180000); });
      } else {
        att = E.attendance(st, home, away, fx.comp);
        E.matchdayIncome(st, home, att);
        if (home.userControlled) S.guestAftermath(st, home, away, att, fx);
        home.attendanceHist.push(att.total);
        home.congestion = (home.congestion || 0) * 0.8 + att.congestion * 0.2;
        home.lastDemand = att.demand;
        home.freeTickets = 0; home.blockedArea = 0;
        if (att.total > home.records.attendance) home.records.attendance = att.total;
      }
      m.attendance = att.total; m.attInfo = att;
      M.finalize(m);
      var sum = M.summary(m);
      var resH = sum.hg - sum.ag;
      if (fx.comp !== 'friendly') {
        E.fanGrowthWeekly(st, home, resH, fx.neutral ? null : att);
        E.fanGrowthWeekly(st, away, -resH, null);
        S.storeResult(st, fx, sum, m);
      } else S.friendlyAftermath(st, fx, sum, m);
      results.push({ fx: fx, sum: sum, match: m });
      if (fx.user && fx.comp !== 'friendly') S.userMatchAftermath(st, fx, sum, m);
    });
    // Nach dem Spieltag: Sperren abbauen (nur wer zu Beginn gesperrt war)
    Object.keys(suspendedAtStart).forEach(function (id) { var p = st.players[id]; if (p && p.susp > 0) p.susp--; });

    if (st.phase === 'season') {
      S.weeklyUpdate(st);
      S.advanceCup(st);
      if (st.week >= S.SEASON_WEEKS) S.toRelegation(st);
      else if (st.week === S.WINTER_AFTER) {
        st.phase = 'winter'; st.winter = 1; st.winterCampDone = false;
        S.news(st, 'Winterpause!', 'Nach dem ' + S.WINTER_AFTER + '. Spieltag ruht der Ball für ' + S.WINTER_WEEKS + ' Wochen. Zeit für Trainingslager, Testspiele und Transfers (Transferfenster bis einschließlich 19. Spieltag).', 'liga');
      }
    } else if (st.phase === 'preseason' || st.phase === 'winter') {
      S.breakWeek(st);
      if (st.phase === 'preseason') S.advanceCup(st); // nach der Qualifikation sofort die 1. Runde auslosen
      if (st.phase === 'preseason') {
        if ((st.prep || 1) >= S.PREP_WEEKS) {
          S.advanceCup(st);
          st.phase = 'season'; st.week = 0;
          E.seasonSales(st); // Dauerkarten & Logen für die neue Saison
          S.news(st, 'Die Saison beginnt!', 'Die Vorbereitung ist abgeschlossen – am Wochenende steigt der 1. Spieltag. Das Transferfenster ist noch bis einschließlich 3. Spieltag offen.', 'liga');
        } else st.prep = (st.prep || 1) + 1;
      } else {
        if ((st.winter || 1) >= S.WINTER_WEEKS) { st.phase = 'season'; S.news(st, 'Die Rückrunde beginnt!', 'Ende der Winterpause. Das Transferfenster schließt nach dem 19. Spieltag.', 'liga'); }
        else st.winter = (st.winter || 1) + 1;
      }
    } else if (st.phase === 'releg') {
      st.relegLeg++;
      Object.keys(st.clubs).forEach(function (k) { S.trainingWeek(st, st.clubs[k]); });
      if (st.relegLeg >= 2) S.finishRelegation(st);
    }
    T.checkTrials(st); // Probezeit von Nachwuchsspielern abgelaufen?
    st.lastResults = results.map(function (r) { return { key: r.fx.key, comp: r.fx.comp, h: r.fx.h, a: r.fx.a, hg: r.sum.hg, ag: r.sum.ag, pens: r.sum.pens, user: r.fx.user }; });
    st.rngState = R.rng.state;
    return results;
  };

  S.storeResult = function (st, fx, sum, m) {
    var parts = fx.key.split('-');
    if (parts[0] === 'L') { st.leagues[+parts[1]].fixtures[+parts[2]][+parts[3]].r = sum; }
    else if (parts[0] === 'C') {
      var ci = +parts[1], tie = st.cup.rounds[ci].ties[+parts[2]];
      tie.r = sum;
      tie.winner = (sum.pens ? (sum.pens[0] > sum.pens[1]) : (sum.hg > sum.ag)) ? tie.h : tie.a;
      var winner = st.clubs[tie.winner];
      winner.cash += S.CUP_PRIZE[ci]; E.book(winner, 'Prämien', S.CUP_PRIZE[ci]);
    } else if (parts[0] === 'R') {
      var rg = st.releg[+parts[1]], leg = rg.legs[+parts[2]];
      leg.r = sum;
      if (+parts[2] === 1) {
        var lowerGoals = rg.legs[0].r.hg + (leg.h === rg.lower ? sum.hg : sum.ag);
        var upperGoals = rg.legs[0].r.ag + (leg.h === rg.upper ? sum.hg : sum.ag);
        if (sum.pens) rg.winner = (sum.pens[0] > sum.pens[1]) ? leg.h : leg.a;
        else rg.winner = lowerGoals > upperGoals ? rg.lower : rg.upper;
      }
    }
  };

  S.userMatchAftermath = function (st, fx, sum, m) {
    var uc = S.userClub(st); if (!uc) return;
    var side = fx.h === uc.id ? 0 : 1;
    var my = side === 0 ? sum.hg : sum.ag, op = side === 0 ? sum.ag : sum.hg;
    var won = sum.pens ? (sum.pens[side] > sum.pens[1 - side]) : my > op;
    if (won) S.achieve(st, 'firstWin');
    // Nachwuchskönig: fünf Eigengewächse eingesetzt
    var hg = Object.keys(m.played).filter(function (pid) { return m.played[pid] === side && W.isHomegrown(st.players[pid]); }).length;
    if (hg >= 5) S.achieve(st, 'youth');
    // Zeitung
    var H = st.clubs[fx.h], A = st.clubs[fx.a];
    var late = m.events.filter(function (e) { return e.type === 'goal' && e.min >= 59; }).pop();
    var winner = sum.hg > sum.ag ? H : sum.ag > sum.hg ? A : null, loser = winner === H ? A : H;
    var tpl;
    if (!winner) tpl = R.pick(D.headlinesDraw);
    else if (late && late.side === (winner === H ? 0 : 1) && Math.abs(sum.hg - sum.ag) === 1) tpl = R.pick(D.headlinesLate);
    else tpl = R.pick(D.headlinesWin);
    var head = tpl.replace(/\{W\}/g, winner ? winner.short.toUpperCase() : '').replace(/\{L\}/g, loser ? loser.short.toUpperCase() : '')
      .replace(/\{H\}/g, H.short.toUpperCase()).replace(/\{A\}/g, A.short.toUpperCase()).replace(/\{S\}/g, sum.hg + ':' + sum.ag).replace(/\{T\}/g, 'TRAINER');
    // Beste Werfer beider Teams statt aller Torschützen (im Handball fallen 50–70 Tore)
    var scorers = (sum.sc || []).slice(0, 4).map(function (x) { var p = st.players[x[0]]; return (p ? p.last : '?') + ' (' + x[1] + ')'; }).join(', ');
    S.news(st, head, (fx.comp === 'league' ? st.week + '. Spieltag' : fx.comp === 'releg' ? 'Aufstiegsrunde' : 'DHB-Pokal') + ': ' + H.name + ' – ' + A.name + ' ' + sum.hg + ':' + sum.ag + (sum.pens ? ' (n. 7m ' + sum.pens[0] + ':' + sum.pens[1] + ')' : '') + '. ' + (scorers ? 'Beste Werfer: ' + scorers + '. ' : '') + 'Zuschauer: ' + R.fmtNum(m.attendance || 0) + '.', 'match');
    // Vertrauen des Vorstands
    var exp = uc.expectedPos || 9;
    var oppC = st.clubs[side === 0 ? fx.a : fx.h];
    var expectWin = (oppC.expectedPos || 9) > exp + 3 && oppC.league >= uc.league;
    var delta = won ? (expectWin ? 2 : 4) : (my === op && !sum.pens ? (expectWin ? -1.5 : 1) : (expectWin ? -5 : -2.5));
    st.manager.trust = R.clamp(st.manager.trust + delta, 0, 100);
    st.lastUserMatch = { key: fx.key, comp: fx.comp, h: fx.h, a: fx.a, sum: sum, att: m.attInfo, ratings: m.rating, side: side, events: m.events.filter(function (e) { return e.type !== 'save' && e.type !== 'miss'; }).slice(-80).map(function (e) { return { min: e.min, type: e.type, side: e.side, text: e.text }; }), stats: { poss: m.stats.poss, shots: m.stats.shots, onT: m.stats.onTarget, chances: m.stats.chances, corners: m.stats.corners, fouls: m.stats.fouls, saves: m.stats.saves, twoMin: m.stats.twoMin, fastBreaks: m.stats.fastBreaks, turnovers: m.stats.turnovers }, goals: m.goals, assists: m.assists, motm: m.motm, headline: head };
  };

  // ---------- Wöchentliche Prozesse ----------
  // Gästefans: Abnutzung des Gästeblocks, Schäden (z. B. zerstörte Toilette) als Ereigniskarte
  S.guestAftermath = function (st, home, away, att, fx) {
    var g = att.guests || 0; if (!g || !R.stadium) return;
    R.stadium.ensure(home);
    var plan = home.stadium, mu = E.matchup(st, home, away), derby = mu.derby >= 0.4, lgF = { 1: 1.3, 2: 1, 3: 0.8 }[home.league] || 1;
    // Fanfreundschaft: viele Gäste, aber friedlich – keine Abnutzung, keine Randale
    if (!mu.friend) plan.wear = Math.min(100, (plan.wear || 0) + g / 360 * (1 + mu.derby * 1.4) * (fx.comp === 'friendly' ? 0.3 : 1));
    home.guestStats = { season: st.season, last: g, demand: att.guestDemand, cap: att.guestCap, short: att.guestDemand > att.guestCap * 1.15 && g >= att.guestCap * 0.97 };
    var san = E.level(home, 'sanitaer') ? home.fac.sanitaer || 0 : 0;
    var p = Math.min(0.35, g / 200 * 0.014 * (1 + mu.derby * 1.7) * lgF * (1 + plan.wear / 45) * (1 - san * 0.12));
    if (mu.friend) return;
    if (st.pendingEvent || fx.comp === 'friendly' || !R.chance(p)) return;
    var type = S.forceDamageType || (R.chance(0.6) ? 'wc' : R.stadium.guestType(home) === 'steh' ? 'zaun' : 'sitze');
    var dmg = R.round({ wc: 600 + san * 900, zaun: 900, sitze: 400 }[type] * (1 + g / 500) * (derby ? 1.5 : 1), 100);
    var A = away.short;
    var texts = {
      wc: 'Nach dem Spiel gegen ' + away.name + ' ist die Toilettenanlage im Gästeblock ein Trümmerfeld: Waschbecken herausgerissen, Kabinen eingetreten, Spülkästen verschwunden. Schaden: ' + R.fmtMoney(dmg) + '.',
      zaun: 'Gästefans von ' + A + ' haben den Zaun im Gästeblock niedergerissen und Pyrotechnik gezündet. Schaden: ' + R.fmtMoney(dmg) + '.',
      sitze: 'Im Gästeblock wurden nach dem Spiel gegen ' + A + ' reihenweise Sitzschalen herausgerissen. Schaden: ' + R.fmtMoney(dmg) + '.'
    };
    st.pendingEvent = { custom: { t: texts[type], ic: type === 'wc' ? '🚽' : type === 'zaun' ? '🚧' : '💺', o: [
      { l: 'Sofort reparieren lassen', cash: -dmg, wear: -15 },
      { l: 'Rechnung an ' + A + ' schicken', lottery: [[0.55, 0, A + ' übernimmt die Kosten zähneknirschend.'], [0.45, -Math.round(dmg * 1.15), A + ' weigert sich – Sie zahlen plus Anwaltskosten.']] },
      { l: type === 'wc' ? 'Dixi-Klos aufstellen, später sanieren' : 'Notdürftig flicken', cash: -Math.round(dmg * 0.3), fans: -0.3, wear: 10 }
    ] } };
    S.news(st, (type === 'wc' ? 'Toiletten zerstört! ' : 'Randale im Gästeblock! ') + A + '-Anhang wütet', texts[type], 'event');
  };

  // Woche in Vorbereitung/Winterpause: kein Ligaspiel, keine laufenden Finanzen (die laufen über die 34 Spielwochen),
  // aber Training, Trainingslager, Bauarbeiten, Transfers, Märkte und Ereignisse
  S.breakWeek = function (st) {
    var uc = S.userClub(st), key = S.breakKey(st);
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      E.progressConstruction(st, c);
      S.trainingWeek(st, c);
      if (!c.userControlled) { T.aiWeekly(st, c, st.phase === 'preseason' ? 0.6 : 0.35); if (st.phase === 'preseason' && (st.prep || 1) === 1) S.aiSponsors(st, c); }
      else if (st.manager.role === 'gf') S.aiCoachDuties(st, c);
    });
    if (uc) {
      if (st.manager.role === 'trainer' || !S.planOwnerIsUser(st)) S.autoPlan(st, uc);
      var pl = st.plan && st.plan[key];
      if (pl && pl.type === 'camp' && !pl.done) { var r = S.applyCamp(st, uc, pl.camp, true); pl.done = true; pl.result = r.ok ? 'ok' : r.why; if (!r.ok) S.news(st, 'Trainingslager abgesagt', r.why, 'training'); }
    }
    E.updateMarkets(st);
    if (R.deals) R.deals.weekly(st);
    if (uc) {
      T.generateOffersForUser(st, uc);
      S.maybeEvent(st, uc);
      S.checkAchievements(st, uc);
      if (st.manager.role !== 'manager') S.autoDelegate(st, uc);
    }
    if (st.manager.unemployed) S.careerWeek(st);
  };
  // Wer plant Vorbereitung/Winterpause? Manager und Geschäftsführer selbst, beim Trainer die Vereinsführung
  S.planOwnerIsUser = function (st) { return st.manager.role !== 'trainer'; };
  // Testspiel-Gegner: Vorschläge (stärker/ähnlich/schwächer)
  S.friendlyOpponents = function (st, club) {
    var all = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return c.id !== club.id; });
    all.sort(function (a, b) { return b.reputation - a.reputation; });
    var me = all.filter(function (c) { return c.league === club.league; });
    var up = all.filter(function (c) { return c.league < club.league || (c.league === club.league && c.reputation > club.reputation + 8); });
    var down = all.filter(function (c) { return c.league > club.league || (c.league === club.league && c.reputation < club.reputation - 8); });
    var pick = function (arr, n, off) { var out = []; for (var i = 0; i < arr.length && out.length < n; i++) { var c = arr[(i + (off || 0)) % arr.length]; if (out.indexOf(c) < 0) out.push(c); } return out; };
    var seed = (st.season * 7 + (st.phase === 'winter' ? 3 : 0)) % 11;
    var res = pick(up.slice(0, 12), 3, seed).concat(pick(me, 3, seed)).concat(pick(down.slice(-20), 3, seed));
    return res.filter(function (c, i) { return res.indexOf(c) === i; });
  };
  S.planWeeks = function (st) {
    var keys = [];
    if (st.phase === 'preseason' || st.phase === 'seasonEnd') for (var i = 1; i <= S.PREP_WEEKS; i++) keys.push({ k: 'p' + i, n: 'Vorbereitung Woche ' + i, cup: i >= S.PREP_WEEKS - 1, past: st.phase === 'preseason' && i < (st.prep || 1) });
    if (st.phase === 'winter' || (st.phase === 'season' && st.week < S.WINTER_AFTER)) for (var j = 1; j <= S.WINTER_WEEKS; j++) keys.push({ k: 'w' + j, n: 'Winterpause Woche ' + j, past: st.phase === 'winter' && j < (st.winter || 1) });
    return keys;
  };
  S.setPlan = function (st, key, item) {
    st.plan = st.plan || {};
    var old = st.plan[key];
    if (old && old.done) return { ok: false, why: 'Diese Woche ist schon vorbei.' };
    if (item && item.type === 'camp') {
      var isW = key.charAt(0) === 'w';
      var other = Object.keys(st.plan).filter(function (k) { return k !== key && k.charAt(0) === key.charAt(0) && st.plan[k] && st.plan[k].type === 'camp'; });
      if (other.length) return { ok: false, why: 'Pro ' + (isW ? 'Winterpause' : 'Vorbereitung') + ' ist ein Trainingslager möglich.' };
      if ((isW ? st.winterCampDone : st.campDone) && !(old && old.type === 'camp')) return { ok: false, why: 'Trainingslager bereits absolviert.' };
    }
    if (item && item.type === 'test' && (key === 'p' + S.PREP_WEEKS || key === 'p' + (S.PREP_WEEKS - 1))) return { ok: false, why: 'In dieser Woche steht eine Pokalrunde an.' };
    if (item) st.plan[key] = item; else delete st.plan[key];
    return { ok: true };
  };
  // Automatische Planung (Trainer-Rolle bzw. falls der Nutzer nichts geplant hat, nur für die Trainer-Rolle)
  S.autoPlan = function (st, club) {
    st.plan = st.plan || {};
    var pre = st.phase === 'preseason' ? 'p' : 'w', n = pre === 'p' ? S.PREP_WEEKS : S.WINTER_WEEKS;
    if (Object.keys(st.plan).some(function (k) { return k.charAt(0) === pre; })) return;
    var camp = D.camps.filter(function (c) { return c.cost < club.cash * 0.05; }).pop() || D.camps[0];
    var opps = S.friendlyOpponents(st, club);
    for (var i = 1; i <= n; i++) {
      var k = pre + i;
      if (i === 2) st.plan[k] = { type: 'camp', camp: camp.id };
      else if (!(pre === 'p' && i >= S.PREP_WEEKS - 1) && opps.length) st.plan[k] = { type: 'test', opp: opps[(i * 2) % opps.length].id, home: i % 2 === 1 };
    }
  };
  // Nach einem Testspiel: Teamchemie, keine Statistik
  S.friendlyAftermath = function (st, fx, sum, m) {
    [fx.h, fx.a].forEach(function (id) { var c = st.clubs[id]; if (c) c.chemistry = Math.min(100, (c.chemistry || 50) + 1.2); });
    var uc = S.userClub(st);
    if (fx.user && uc) {
      var H = st.clubs[fx.h], A = st.clubs[fx.a];
      S.news(st, 'Testspiel: ' + H.short + ' – ' + A.short + ' ' + sum.hg + ':' + sum.ag, 'Zuschauer: ' + R.fmtNum(m.attendance || 0) + '. Die Mannschaft sammelt Spielpraxis, die Teamchemie wächst.', 'match');
      st.lastUserMatch = { key: fx.key, comp: fx.comp, h: fx.h, a: fx.a, sum: sum, att: m.attInfo, ratings: m.rating, side: fx.h === uc.id ? 0 : 1, events: m.events.filter(function (e) { return e.type !== 'save' && e.type !== 'miss'; }).slice(-80).map(function (e) { return { min: e.min, type: e.type, side: e.side, text: e.text }; }), stats: { poss: m.stats.poss, shots: m.stats.shots, onT: m.stats.onTarget, chances: m.stats.chances, corners: m.stats.corners, fouls: m.stats.fouls, saves: m.stats.saves, twoMin: m.stats.twoMin, fastBreaks: m.stats.fastBreaks, turnovers: m.stats.turnovers }, goals: m.goals, assists: m.assists, motm: m.motm, headline: 'TESTSPIEL: ' + H.short.toUpperCase() + ' ' + sum.hg + ':' + sum.ag + ' ' + A.short.toUpperCase() };
    }
  };

  S.weeklyUpdate = function (st, light) {
    var uc = S.userClub(st);
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      E.weeklyFinance(st, c);
      E.progressConstruction(st, c);
      S.trainingWeek(st, c);
      if (!c.userControlled || (st.manager.role === 'trainer' && c.userControlled)) S.aiBusiness(st, c);
      if (!c.userControlled) { T.aiWeekly(st, c, st.phase === 'preseason' ? 0.6 : 0.25); S.aiYouth(st, c); }
      else if (st.manager.role === 'gf') S.aiCoachDuties(st, c);
      if (c.userControlled && c.cityAutoBuild && st.manager.role !== 'trainer') S.autoCity(st, c);
    });
    E.updateMarkets(st);
    if (R.deals) R.deals.weekly(st);
    // Verlauf für Diagramme (nur eigener Verein)
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k]; if (!c.userControlled) return;
      c.hist = c.hist || [];
      c.hist.push({ s: st.season, w: st.week, cash: Math.round(c.cash), pos: st.week > 0 ? E.leaguePos(st, c) : null, fans: c.fans });
      if (c.hist.length > 160) c.hist.splice(0, c.hist.length - 160);
    });
    if (uc) {
      T.generateOffersForUser(st, uc);
      S.maybeEvent(st, uc);
      S.checkAchievements(st, uc);
      if (!light) S.boardCheck(st, uc);
      if (st.manager.role !== 'manager') S.autoDelegate(st, uc);
    }
    if (st.manager.unemployed) S.careerWeek(st);
    S.leagueNews(st);
  };

  // Training: Fitness, Entwicklung, Verletzungsheilung
  S.trainingWeek = function (st, club) {
    var focus = club.training || 'technik';
    var trainQ = 0.8 + E.level(club, 'training').q * 0.08 + [-0.1, 0, 0.1][club.budgets.trainorg] + ((club.coach ? club.coach.quality : 50) - 50) * 0.003 + E.staffLvl(club, 'co') * 0.03;
    var youthQ = 0.75 + E.level(club, 'jugend').q * 0.12 + (club.coach && club.coach.profile === 'Jugendförderung' ? 0.15 : 0);
    var med = E.level(club, 'medizin').q;
    var weekNo = Math.max(1, st.week);
    var focusAttr = { fitness: ['sta', 'spd'], taktik: ['pas', 'def'], angriff: ['sho', 'tec'], defensive: ['def', 'sta'], technik: ['tec', 'pas'], regeneration: [] }[focus];
    var growthF = focus === 'regeneration' ? 0.4 : 1;
    var recover = 14 + (focus === 'regeneration' ? 9 : 0) - (focus === 'fitness' ? 4 : 0) + med * 1.5 + E.staffLvl(club, 'fitness') * 1.5 + E.staffLvl(club, 'ernaehrung');
    var moraleTarget = 65 + ((D.training[focus] && D.training[focus].mor) || 0) + E.staffLvl(club, 'assistent') * 2, injF = E.injuryStaffF(club);
    if (E.staffLvl(club, 'assistent')) club.chemistry = Math.min(100, club.chemistry + E.staffLvl(club, 'assistent') * 0.15);
    if (focus === 'taktik') club.trainingBonus = 0.02;
    if (focus === 'angriff' || focus === 'defensive') club.trainingBonus = 0.008;
    for (var id in st.players) {
      var p = st.players[id];
      if (p.clubId !== club.id) continue;
      // Heilung
      if (p.inj) {
        var heal = 1 + (R.chance(med * 0.07 + E.staffLvl(club, 'reha') * 0.07) && p.inj.total < 12 ? 1 : 0);
        p.inj.weeks -= heal;
        if (p.inj.weeks <= 0) { p.inj = null; p.fitness = Math.min(p.fitness, 70); }
        continue;
      }
      p.fitness = R.clamp(p.fitness + recover, 0, 100);
      p.morale += (moraleTarget - p.morale) * 0.08;
      // Trainingsverletzung (selten; Prävention durch Medizin)
      if (focus !== 'regeneration' && R.chance(0.0025 * (focus === 'fitness' ? 1.6 : 1) * (1 - med * 0.08) * injF * (0.6 + p.risk))) {
        p.inj = M.rollInjury(st, p, med); p.inj.weeks = Math.min(p.inj.weeks, 4); p.inj.total = p.inj.weeks; p.inj.type += ' (Training)';
        if (club.userControlled) S.news(st, 'Trainingsunfall: ' + W.playerName(p), p.inj.type + ', ' + p.inj.weeks + ' Wochen Pause.', 'medizin');
      }
      // Entwicklung
      var gap = p.pot - W.overallFor(p, p.pos);
      var ageF = p.age <= 19 ? 1.35 : p.age <= 22 ? 1.1 : p.age <= 25 ? 0.65 : p.age <= 28 ? 0.3 : 0.1;
      var playF = p.youth ? 0.85 : 0.75 + 0.5 * Math.min(1, p.stats.apps / weekNo);
      var q = p.youth ? youthQ : trainQ;
      if (gap > 0) {
        var g = gap * 0.0075 * ageF * playF * q * growthF;
        var w = D.posWeights[p.pos];
        D.attrKeys.forEach(function (k, i) {
          var share = w[i] + (focusAttr.indexOf(k) >= 0 ? 0.25 : 0);
          if (share > 0) p.attr[k] = Math.min(99, p.attr[k] + g * share * 1.6);
        });
      }
      if (focus === 'fitness') p.attr.sta = Math.min(99, p.attr.sta + 0.02);
      if (p.age >= 30) {
        var dec = 0.012 * (p.age - 29);
        p.attr.spd = Math.max(1, p.attr.spd - dec * 1.5); p.attr.sta = Math.max(1, p.attr.sta - dec);
        p.attr.tec = Math.max(1, p.attr.tec - dec * 0.3);
        if (p.pos === 'TW') p.attr.gk = Math.max(1, p.attr.gk - dec * 0.4);
      }
      W.recalc(p);
    }
  };

  S.applyCamp = function (st, club, campId) {
    var c = D.camps.filter(function (x) { return x.id === campId; })[0], winter = st.phase === 'winter';
    if (!c || (winter ? st.winterCampDone : st.campDone)) return { ok: false, why: 'Trainingslager bereits absolviert' };
    if (!S.isBreak(st)) return { ok: false, why: 'Trainingslager nur in der Vorbereitung und in der Winterpause' };
    if (club.cash < c.cost) return { ok: false, why: 'Nicht genug Geld für das Trainingslager in ' + c.name };
    club.cash -= c.cost; E.book(club, 'Trainingslager', -c.cost);
    if (winter) st.winterCampDone = true; else st.campDone = true;
    var msg = c.desc;
    W.squad(st, club.id).forEach(function (p) {
      p.morale = R.clamp(p.morale + c.mor, 0, 100);
      p.attr.sta = Math.min(99, p.attr.sta + c.fit * 0.15); W.recalc(p);
    });
    club.chemistry = R.clamp(club.chemistry + c.chem * 2, 0, 100);
    club.reputation = R.clamp(club.reputation + (c.pr > 4 ? 1 : 0), 1, 100);
    var ev = R.rand();
    if (ev < 0.25) {
      var p = R.pick(W.squad(st, club.id));
      var evs = [p.last + ' hat sich beim Beachvolleyball den Knöchel verstaucht.', p.last + ' gewinnt das interne Karaoke-Turnier. Die Moral steigt!', 'Der Mannschaftsbus hatte eine Panne. Drei Stunden Wartezeit am Rastplatz.', p.last + ' hat heimlich Nachtisch bestellt. Der Fitnesstrainer ist außer sich.'];
      var i = R.randInt(0, 3);
      msg += ' ' + evs[i];
      if (i === 0) { p.inj = { type: 'Verstauchung', weeks: 1, total: 1 }; }
      if (i === 1) W.squad(st, club.id).forEach(function (q) { q.morale = Math.min(100, q.morale + 3); });
    }
    S.news(st, 'Trainingslager in ' + c.name + ' beendet', msg, 'training');
    return { ok: true, text: msg };
  };

  // KI-Geschäftsführung (für KI-Vereine und Trainer-Rolle)
  S.aiBusiness = function (st, club) {
    // Sponsoren
    if (st.week % 6 === 0 || st.phase === 'preseason') S.aiSponsors(st, club);
    // Schulden abbauen
    var debt = E.debt(club);
    if (debt > 0 && club.cash > E.revenueEstimate(st, club) * 0.3) E.repayLoan(st, club, Math.min(debt, club.cash * 0.3));
    if (club.cash < -E.revenueEstimate(st, club) * 0.15 && E.creditLimit(st, club) > 0) E.takeLoan(st, club, Math.min(E.creditLimit(st, club), -club.cash));
    // Ticketpreise anpassen: hohe Auslastung → teurer
    if (st.week % 4 === 0 && club.attendanceHist.length) {
      var avg = R.avg(club.attendanceHist.slice(-3)), cap = E.capacity(club);
      var ref = E.refPrices[club.league];
      ['steh', 'sitz'].forEach(function (k) {
        if (avg > cap * 0.95) club.tickets[k] = Math.min(Math.round(ref[k] * 1.6), club.tickets[k] + 1);
        else if (avg < cap * 0.7) club.tickets[k] = Math.max(Math.round(ref[k] * 0.6), club.tickets[k] - 1);
      });
      club.avgAttendance = avg;
    }
    // Ausbau (selten, nur mit Polster)
    if (R.chance(0.05)) {
      var rev = E.revenueEstimate(st, club);
      var reserve = rev * 0.25;
      var options = [];
      var cap = E.capacity(club), demand = club.lastDemand || 0;
      if (demand > cap * 1.05 && !(R.stadium && R.stadium.has(club))) options.push(club.fac.sitz <= club.fac.steh ? 'sitz' : 'steh');
      if (E.transportCap(club) < cap * 0.8) options.push(R.pick(['oepnv', 'parken', 'strasse']));
      options.push(R.pick(['medizin', 'jugend', 'training', 'dach', 'sanitaer', 'hosp', 'fanshop', 'restaurant', 'museum', R.stadium && R.stadium.has(club) ? 'video' : 'vip', 'licht']));
      for (var i = 0; i < options.length; i++) {
        var pv = E.buildPreview(st, club, options[i]);
        if (!pv) continue;
        if (club.cash - pv.cost > reserve && pv.cost < rev * 0.5 && E.canBuild(st, club, options[i]).ok) { E.startBuild(st, club, options[i]); break; }
      }
    }
  };
  // Automatische Verwaltung der Wirtschaftsbetriebe (Nutzeroption)
  S.autoCity = function (st, club) {
    if (st.week % 2 || club.construction.length >= 3) return;
    var best = null;
    ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe', 'solar'].forEach(function (k) {
      var pv = E.buildPreview(st, club, k);
      if (!pv || !E.canBuild(st, club, k).ok || pv.surplus <= 0 || !pv.payback || pv.payback > 9) return;
      if (club.cash - pv.cost < E.revenueEstimate(st, club) * 0.2) return;
      if (!best || pv.payback < best.pv.payback) best = { k: k, pv: pv };
    });
    if (best) { E.startBuild(st, club, best.k); S.news(st, 'Automatischer Ausbau: ' + best.pv.name, 'Die Betriebsleitung investiert ' + R.fmtMoney(best.pv.cost) + ' (Amortisation ca. ' + best.pv.payback.toFixed(1) + ' Jahre).', 'bau'); }
  };
  S.aiSponsors = function (st, club) {
    E.ensureBande(st, club);
    var have = {}; club.sponsors.forEach(function (s) { have[s.cat] = true; });
    Object.keys(D.sponsorCategories).forEach(function (cat) {
      if (cat === 'bande') { E.bandeFree(club).forEach(function (id) { club.sponsors.push(E.bandeOffer(st, club, id)); }); return; }
      if (have[cat]) return;
      if (cat === 'namensrechte' && !club.userControlled && R.chance(0.5)) return;
      var offers = E.sponsorOffers(st, club, cat);
      offers.sort(function (a, b) { return b.amount - a.amount; });
      club.sponsors.push(offers[0]);
    });
  };
  S.ensureSponsors = function (st, club) {
    // Offene Sponsorenkategorien → Angebote in den Posteingang
    E.ensureBande(st, club); club.bandeOff = {};
    var have = {}; club.sponsors.forEach(function (s) { have[s.cat] = true; });
    st.inbox = st.inbox.filter(function (o) { return o.type !== 'sponsor'; });
    Object.keys(D.sponsorCategories).forEach(function (cat) {
      if (cat === 'bande') { var fr = E.bandeFree(club).length; if (fr && st.manager.role !== 'trainer') st.inbox.push({ id: W.nextId(st, 'offer'), type: 'sponsor', cat: 'bande', offers: [], free: fr, season: st.season, week: st.week }); return; }
      if (have[cat]) return;
      if (st.manager.role === 'trainer') return;
      st.inbox.push({ id: W.nextId(st, 'offer'), type: 'sponsor', cat: cat, offers: E.sponsorOffers(st, club, cat), season: st.season, week: st.week });
    });
  };
  S.acceptSponsor = function (st, inboxId, idx) {
    var o = st.inbox.filter(function (x) { return x.id === inboxId; })[0];
    var uc = S.userClub(st); if (!o || !uc) return;
    var s = o.offers[idx];
    uc.sponsors = uc.sponsors.filter(function (x) { return x.cat !== s.cat; });
    uc.sponsors.push(s);
    st.inbox.splice(st.inbox.indexOf(o), 1);
    S.news(st, 'Neuer ' + D.sponsorCategories[s.cat] + ': ' + s.name, R.fmtMoney(s.amount) + ' pro Saison, Laufzeit ' + s.years + ' Jahr(e).', 'finanzen');
  };

  // KI-Trainer für die Geschäftsführer-Rolle
  S.aiCoachDuties = function (st, club) {
    var prof = club.coach ? club.coach.profile : 'Ausgewogen';
    var tired = R.avg(W.squad(st, club.id), function (p) { return p.fitness; });
    if (!club.trainingByUser) club.training = tired < 80 ? 'regeneration' : prof === 'Offensiv' ? 'angriff' : prof === 'Defensiv' ? 'defensive' : prof === 'Erfahrener Taktiker' ? 'taktik' : 'technik';
    // Jugend hochziehen
    W.youthOf(st, club.id).forEach(function (p) { if (p.ovr >= R.avg(W.squad(st, club.id), function (x) { return x.ovr; }) - 6 && W.squad(st, club.id).length < 26) p.youth = false; });
  };
  // Automatische Aufgaben, die nicht in der Rolle des Spielers liegen
  S.autoDelegate = function (st, club) {
    if (st.manager.role === 'trainer') {
      // KI-Geschäftsführung: Sponsoren bereits in aiBusiness. Budgets normal halten.
      if (club.cash < 0) Object.keys(club.budgets).forEach(function (k) { club.budgets[k] = Math.min(club.budgets[k], 1); });
    }
  };

  S.aiYouth = function (st, club) {
    if (st.week !== 20) return;
    var squad = W.squad(st, club.id), avg = R.avg(squad, function (p) { return p.ovr; });
    W.youthOf(st, club.id).forEach(function (p) {
      if ((p.ovr >= avg - 8 || p.pot >= avg + 8) && squad.length < 26) { p.youth = false; p.wage = Math.max(p.wage, Math.round(W.capWage(W.fairWage(p) * 0.7, club) / 500) * 500); }
    });
  };

  S.maybeEvent = function (st, club) {
    if (st.pendingEvent || st.week < 2) return;
    var f = W.diffSettings[st.settings.difficulty].events;
    if (!R.chance(0.085 * f)) return;
    var chaos = st.settings.difficulty === 'chaos' && R.chance(0.4);
    var pool = chaos ? D.chaosEvents : D.events;
    st.pendingEvent = { chaos: chaos, idx: R.randInt(0, pool.length - 1) };
  };
  S.resolveEvent = function (st, optIdx) {
    var pe = st.pendingEvent; if (!pe) return null;
    var ev = pe.custom || (pe.chaos ? D.chaosEvents : D.events)[pe.idx], o = ev.o[optIdx], club = S.userClub(st);
    if (o.wear && club && club.stadium) club.stadium.wear = R.clamp((club.stadium.wear || 0) + o.wear, 0, 100);
    st.pendingEvent = null;
    if (!club) return null;
    var msg = o.l + '.';
    var cash = o.cash || 0, mor = o.mor || 0, fans = o.fans || 0;
    if (o.chance != null && R.chance(o.chance)) { msg = o.alt; cash = cash < 0 ? cash : -Math.abs(cash || 50000); mor = -Math.abs(mor); }
    if (o.lottery) { var r = R.rand(), acc = 0; for (var i = 0; i < o.lottery.length; i++) { acc += o.lottery[i][0]; if (r <= acc) { cash += o.lottery[i][1]; msg = o.lottery[i][2]; break; } } }
    if (cash) { club.cash += cash; E.book(club, 'Sonstiges', cash); }
    if (mor) W.squad(st, club.id).forEach(function (p) { p.morale = R.clamp(p.morale + mor, 0, 100); });
    if (fans) club.fans = Math.round(club.fans * (1 + fans / 100));
    if (o.rep) club.reputation = R.clamp(club.reputation + o.rep, 1, 100);
    if (o.youth) { var y = W.genYouth(st, club, E.level(club, 'jugend').q + 1); y.pot = Math.min(95, y.pot + 5); msg += ' ' + W.playerName(y) + ' (' + y.age + ', ' + y.pos + ') ist jetzt in der Jugend.'; }
    S.news(st, 'Entscheidung: ' + ev.t.slice(0, 60) + (ev.t.length > 60 ? '…' : ''), msg, 'event');
    return msg;
  };

  S.checkAchievements = function (st, club) {
    if (E.capacity(club) >= 10000) S.achieve(st, 'stadium');
    if (club.cash >= 5000000) S.achieve(st, 'millionaire');
    if ((club.tradeProfit || 0) >= 100000) S.achieve(st, 'stocks');
    if ((club.fac.medizin || 1) >= 6) S.achieve(st, 'clinic');
    if ((club.fac.oepnv || 1) >= 6) S.achieve(st, 'ubahn');
  };

  S.leagueNews = function (st) {
    if (st.phase !== 'season' || st.week % 3 !== 0) return;
    var l = R.pick(D.leagueKeys), t = S.table(st, l);
    var leader = st.clubs[t[0].id];
    var heads = [leader.short + ' grüßt von der Tabellenspitze der ' + D.leagueNames[l], 'Fans von ' + st.clubs[t[t.length - 1].id].short + ' fordern Trainerwechsel'];
    var scorers = S.topScorers(st, l, 1)[0];
    if (scorers && scorers.stats.goals > 15) heads.push(scorers.last + ' (' + st.clubs[scorers.clubId].short + ') führt die Torschützenliste mit ' + scorers.stats.goals + ' Treffern an');
    S.news(st, R.pick(heads), '', 'liga');
  };

  S.topScorers = function (st, lvl, n, key) {
    key = key || 'goals';
    var arr = [];
    for (var id in st.players) { var p = st.players[id]; if (p.clubId && W.lk(st.clubs[p.clubId]) === lvl && p.stats[key] > 0) arr.push(p); }
    arr.sort(function (a, b) { return b.stats[key] - a.stats[key] || a.stats.apps - b.stats.apps; });
    return arr.slice(0, n || 20);
  };

  // ---------- Vorstand / Entlassung ----------
  S.boardCheck = function (st, club) {
    var mg = st.manager;
    if (st.week < 6 || !mg.canBeFired || mg.founder) { mg.pressure = 0; return; }
    var pos = E.leaguePos(st, club), target = mg.boardTarget ? mg.boardTarget.pos : 12;
    var sportBad = pos > target + 4;
    var finBad = club.cash < -E.revenueEstimate(st, club) * 0.25;
    var badness = 0;
    if (mg.role !== 'gf' && sportBad) badness += 1;
    if (mg.role !== 'trainer' && finBad) badness += 1;
    if (mg.role === 'gf') mg.trust = R.clamp(mg.trust + (finBad ? -2 : 0.5), 0, 100);
    if (badness && mg.trust < 35) {
      if (mg.warnings < 2 && (st.week - (mg.lastWarnWeek || -10)) >= 4) {
        mg.warnings++; mg.lastWarnWeek = st.week;
        S.news(st, mg.warnings === 1 ? 'Der Vorstand ist besorgt' : 'Letzte Warnung des Vorstands!', mg.warnings === 1 ? 'Die Ergebnisse entsprechen nicht den Erwartungen (' + mg.boardTarget.text + ').' : 'Ohne schnelle Besserung wird der Vorstand handeln.', 'vorstand');
        st.toast = { text: '⚠️ Warnung des Vorstands (' + mg.warnings + '/2)' };
      } else if (mg.warnings >= 2 && mg.trust < 20 && (st.week - mg.lastWarnWeek) >= 3) {
        S.fireManager(st, sportBad ? 'Sportliche Talfahrt: Platz ' + pos + ' statt Ziel „' + mg.boardTarget.text + '“' : 'Wirtschaftliche Schieflage');
      }
    }
  };

  S.fireManager = function (st, reason) {
    var mg = st.manager, club = st.clubs[mg.clubId];
    club.userControlled = false;
    club.coach = W.genCoach(30 + club.tier * 60, club.league);
    var h = mg.history[mg.history.length - 1]; h.to = st.season; h.fired = true; h.reason = reason;
    mg.unemployed = true; mg.firedReason = reason; mg.reputation = R.clamp(mg.reputation - 6, 5, 100);
    mg.offers = []; mg.jobWeeks = 0; mg.warnings = 0;
    S.news(st, 'ENTLASSEN! ' + club.short + ' trennt sich von ' + mg.name, reason, 'vorstand');
    S.generateJobOffers(st, 2);
  };

  // Mindestens zwei annehmbare Angebote – notfalls werden neue Vakanzen geschaffen
  S.generateJobOffers = function (st, min) {
    var mg = st.manager, rep = mg.reputation;
    var lastClub = mg.history.length ? mg.history[mg.history.length - 1].clubId : null;
    var cands = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) {
      return c.id !== lastClub && !c.userControlled && Math.abs(c.reputation - rep) < 30 && !mg.offers.some(function (o) { return o.clubId === c.id; });
    });
    // Bevorzugt Vereine mit Trainerproblemen (schlechter Tabellenplatz)
    cands.forEach(function (c) { c._score = (st.week > 3 ? E.leaguePos(st, c) : 9) + R.rand() * 6 - Math.abs(c.reputation - rep) / 5; });
    cands.sort(function (a, b) { return b._score - a._score; });
    while (mg.offers.length < Math.max(min, 2) && cands.length) {
      var c = cands.shift();
      var role = R.pick(['manager', 'manager', 'trainer', 'gf']);
      mg.offers.push({ clubId: c.id, role: role, week: st.week, season: st.season, text: c.short + ' sucht nach der Trennung vom bisherigen ' + (role === 'gf' ? 'Geschäftsführer' : 'Trainer') + ' einen Nachfolger.' });
    }
    if (mg.offers.length < 2) {
      // Fallback: beliebiger Verein der 3. Liga
      W.clubsInTier(st, 3).filter(function (c) { return !mg.offers.some(function (o) { return o.clubId === c.id; }) && c.id !== lastClub; }).slice(0, 2 - mg.offers.length)
        .forEach(function (c) { mg.offers.push({ clubId: c.id, role: 'manager', week: st.week, season: st.season, text: c.short + ' wagt einen Neuanfang.' }); });
    }
  };
  S.careerWeek = function (st) {
    var mg = st.manager; mg.jobWeeks++;
    mg.offers = mg.offers.filter(function (o) { return st.season === o.season && st.week - o.week < 6; });
    S.generateJobOffers(st, 2 + (R.chance(0.3) ? 1 : 0));
  };
  S.applyForJob = function (st, clubId) {
    var mg = st.manager, c = st.clubs[clubId];
    if (!c || c.userControlled) return { ok: false };
    var p = R.clamp(0.75 - (c.reputation - mg.reputation) / 40, 0.05, 0.95);
    if (R.chance(p)) {
      mg.offers.push({ clubId: c.id, role: 'manager', week: st.week, season: st.season, text: c.short + ' hat Ihre Bewerbung positiv beantwortet!' });
      return { ok: true, text: c.name + ' lädt Sie zum Gespräch ein – ein Angebot liegt vor!' };
    }
    return { ok: false, text: c.name + ' hat abgesagt: „Wir suchen jemanden mit mehr Erfahrung.“' };
  };
  S.acceptJob = function (st, idx) {
    var mg = st.manager, o = mg.offers[idx]; if (!o) return;
    var club = st.clubs[o.clubId];
    if (!mg.unemployed) { var oc = st.clubs[mg.clubId]; oc.userControlled = false; var h0 = mg.history[mg.history.length - 1]; h0.to = st.season; }
    club.userControlled = true; club.manualLineup = false;
    mg.clubId = club.id; mg.role = o.role; mg.unemployed = false; mg.offers = []; mg.trust = 55; mg.warnings = 0; mg.firedReason = null;
    mg.canBeFired = true; mg.founder = false;
    mg.history.push({ clubId: club.id, club: club.name, from: st.season, to: null, role: o.role, titles: [] });
    mg.boardTarget = S.targetFor(club);
    mg.transferBudget = Math.max(0, Math.round(club.cash * 0.4 / 5000) * 5000);
    club.history.push({ season: st.season, type: 'trainer', text: mg.name + ' übernimmt (' + S.roleName(o.role) + ')' });
    S.news(st, mg.name + ' übernimmt bei ' + club.name, 'Neue Aufgabe als ' + S.roleName(o.role) + '.', 'karriere');
  };
  S.roleName = function (r) { return { manager: 'Manager', trainer: 'Trainer', gf: 'Geschäftsführer' }[r]; };

  // ---------- Pokal / Relegation / Saisonende ----------
  S.cupFinished = function (st) {
    var fin = st.cup.rounds[S.CUP_FINAL].ties[0];
    st.cup.winner = fin.winner;
    var w = st.clubs[fin.winner];
    w.titles.cup++; w.history.push({ season: st.season, type: 'titel', text: 'Pokalsieger' });
    w.reputation = R.clamp(w.reputation + 3, 1, 100); w.fans = Math.round(w.fans * 1.05);
    S.news(st, 'POKALSIEG! ' + w.name + ' gewinnt den DHB-Pokal!', 'Finale beim Final Four in Hamburg: ' + st.clubs[fin.h].short + ' – ' + st.clubs[fin.a].short + ' ' + fin.r.hg + ':' + fin.r.ag + (fin.r.pens ? ' (n. 7m ' + fin.r.pens[0] + ':' + fin.r.pens[1] + ')' : '') + '. Die Pokalübergabe wird frenetisch gefeiert.', 'titel');
    st.hall.cups.push({ season: st.season, club: w.name, clubId: w.id });
    if (w.userControlled) { S.achieve(st, 'cup'); st.manager.reputation = R.clamp(st.manager.reputation + 5, 0, 100); st.manager.history[st.manager.history.length - 1].titles.push('Pokal ' + st.season); }
  };

  // Saisonende: Abschlusstabellen aller Ligen; die vier Staffelsieger der 3. Liga spielen in der Aufstiegsrunde
  // (zwei Duelle mit Hin- und Rückspiel) die zwei Aufsteiger in die 2. Bundesliga aus.
  S.toRelegation = function (st) {
    st.finalTables = {}; st.finalRows = {};
    D.leagueKeys.forEach(function (l) { var t = S.table(st, l); st.finalTables[l] = t.map(function (r) { return r.id; }); st.finalRows[l] = t; });
    var champs = R.shuffle([3, 4, 5, 6].map(function (l) { return st.finalTables[l][0]; }).filter(Boolean));
    st.releg = [];
    for (var i = 0; i + 1 < champs.length; i += 2) {
      var a = champs[i], b = champs[i + 1];
      st.releg.push({ type: 'aufstieg', upper: a, lower: b, legs: [{ h: b, a: a, r: null }, { h: a, a: b, r: null }], winner: null, levels: [2, 3] });
    }
    st.phase = 'releg'; st.relegLeg = 0;
    S.news(st, 'Die Saison ist beendet – jetzt kommt die Aufstiegsrunde!', st.releg.map(function (rg) { return st.clubs[rg.lower].short + ' gegen ' + st.clubs[rg.upper].short; }).join(' und ') + ': Die Sieger steigen in die 2. Bundesliga auf.', 'liga');
  };

  S.finishRelegation = function (st) {
    st.phase = 'seasonEnd'; st.plan = {}; // Vorbereitung der neuen Saison kann jetzt geplant werden
    st.seasonSummary = S.buildSummary(st);
  };

  S.buildSummary = function (st) {
    var ft = st.finalTables, sum = { season: st.season, champions: {}, promoted: [], relegated: [], releg: [], cup: st.cup.winner, scorers: {}, players: {} };
    D.leagueKeys.forEach(function (l) {
      sum.champions[l] = ft[l][0];
      var sc = S.topScorers(st, l, 1)[0]; sum.scorers[l] = sc ? { id: sc.id, name: W.playerName(sc), club: st.clubs[sc.clubId].short, goals: sc.stats.goals } : null;
      var best = null, bv = 0;
      for (var id in st.players) { var p = st.players[id]; if (p.clubId && W.lk(st.clubs[p.clubId]) === l && p.stats.apps >= 18) { var v = p.stats.rsum / p.stats.apps + p.stats.goals * 0.004; if (v > bv) { bv = v; best = p; } } }
      sum.players[l] = best ? { id: best.id, name: W.playerName(best), club: st.clubs[best.clubId].short, avg: (best.stats.rsum / best.stats.apps).toFixed(2) } : null;
    });
    sum.promoted = [ft[2][0], ft[2][1]].concat(st.releg.map(function (rg) { return rg.winner; }).filter(Boolean));
    var n1 = ft[1].length, n2 = ft[2].length;
    sum.relegated = [ft[1][n1 - 2], ft[1][n1 - 1], ft[2][n2 - 2], ft[2][n2 - 1]];
    st.releg.forEach(function (rg) { sum.releg.push({ upper: rg.upper, lower: rg.lower, winner: rg.winner }); });
    return sum;
  };

  // Neue Saison: Auf-/Abstieg, Prämien, Altern, Verträge, Jugend, KI-Kader
  S.newSeason = function (st) {
    var ft = st.finalTables, sum = st.seasonSummary || S.buildSummary(st);
    var uc = S.userClub(st), mg = st.manager;
    var oldLeague = uc ? uc.league : null, userPos = uc ? ft[W.lk(uc)].indexOf(uc.id) + 1 : null;

    // Prämien, Historie, Sponsorenboni
    D.leagueKeys.forEach(function (l) {
      var tier = D.leagueTier[l];
      ft[l].forEach(function (id, i) {
        var c = st.clubs[id], pr = S.prizeFor(l);
        var prize = Math.round(pr[0] - (pr[0] - pr[1]) * i / Math.max(1, ft[l].length - 1));
        c.cash += prize; E.book(c, 'Prämien', prize);
        var row = st.finalRows[l][i];
        c.history.push({ season: st.season, type: 'saison', league: l, pos: i + 1, pts: row.pts, gf: row.gf, ga: row.ga });
        c.lastPos = i + 1;
        // Ewige Tabelle
        var at = st.allTime[id] || (st.allTime[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, seasons: 0, l1: 0 });
        at.p += row.p; at.w += row.w; at.d += row.d; at.l += row.l; at.gf += row.gf; at.ga += row.ga; at.seasons++;
        if (l === 1) { at.pts += row.w * 2 + row.d; at.l1++; }
        c.sponsors.forEach(function (s) {
          var bonus = 0;
          if (i + 1 <= s.topN) bonus += s.bonusTop;
          if (i === 0 && l === 1) bonus += s.bonusTitle;
          if (l > 1 && i < (tier === 3 ? 1 : 2)) bonus += s.bonusPromo;
          if (bonus) { c.cash += bonus; E.book(c, 'Sponsorenboni', bonus); }
          s.years--;
        });
        c.sponsors = c.sponsors.filter(function (s) { return s.years > 0; });
        // Reputation & Fans
        var expected = c.expectedPos || 9;
        c.reputation = R.clamp(Math.round(c.reputation + (expected - (i + 1)) * 0.35 + ({ 1: 72, 2: 48, 3: 30 }[tier] - c.reputation) * 0.06), 1, 100);
        c.fans = R.clamp(Math.round(c.fans * (1 + (expected - (i + 1)) * 0.006 + [-0.01, 0, 0.015][c.budgets.marketing])), 300, 40000);
        c.pointsPenalty = 0;
        c.fin.last = c.fin.season;
        c.avgAttendance = c.attendanceHist.length ? R.avg(c.attendanceHist) : c.avgAttendance;
      });
      var champ = st.clubs[ft[l][0]];
      champ.history.push({ season: st.season, type: 'titel', text: l === 1 ? 'Deutscher Meister' : 'Meister ' + D.leagueNames[l] });
      if (l === 1) { champ.titles.league++; champ.reputation = R.clamp(champ.reputation + 3, 1, 100); champ.fans = Math.round(champ.fans * 1.06); st.hall.champions.push({ season: st.season, club: champ.name, clubId: champ.id }); }
      if (sum.scorers[l]) st.hall.topScorers.push({ season: st.season, league: l, name: sum.scorers[l].name, club: sum.scorers[l].club, goals: sum.scorers[l].goals });
    });

    // Auf- und Abstieg: Bundesliga 2 runter / 2 hoch, 2. Bundesliga 2 runter, aus der 3. Liga steigen die zwei
    // Sieger der Aufstiegsrunde auf. Absteiger in die 3. Liga kommen in die frei gewordenen Staffeln (Region bevorzugt).
    function move(id, to, why) {
      var c = st.clubs[id], from = c.league; c.league = to;
      if (to === 3) c.newInTier3 = true;
      if (to < from) { c.titles.promo++; c.history.push({ season: st.season, type: 'aufstieg', text: 'Aufstieg in die ' + D.tierNames[to] + (why ? ' (' + why + ')' : '') }); c.fans = Math.round(c.fans * 1.08); }
      else c.history.push({ season: st.season, type: 'abstieg', text: 'Abstieg in die ' + D.tierNames[to] + (why ? ' (' + why + ')' : '') });
    }
    var n1 = ft[1].length, n2 = ft[2].length, leagueBefore = {};
    Object.keys(st.clubs).forEach(function (k) { leagueBefore[k] = st.clubs[k].league; });
    move(ft[2][0], 1); move(ft[2][1], 1); move(ft[1][n1 - 2], 2); move(ft[1][n1 - 1], 2);
    move(ft[2][n2 - 2], 3); move(ft[2][n2 - 1], 3);
    st.releg.forEach(function (rg) { if (rg.winner) move(rg.winner, 2, 'Aufstiegsrunde'); });
    // Zwangsabstieg: eine Liga tiefer, der beste nicht aufgestiegene Verein der unteren Liga rückt nach
    Object.keys(st.clubs).forEach(function (k) {
      var fc = st.clubs[k]; if (!fc.forcedRelegation) return;
      fc.forcedRelegation = false;
      if (fc.league >= 3 || fc.league > leagueBefore[fc.id]) return; // bereits sportlich abgestiegen
      var from = fc.league, lower = from + 1;
      var pool = lower === 3 ? [3, 4, 5, 6].map(function (l) { return ft[l][1]; }) : ft[lower];
      var up = pool.filter(function (id) { return id && st.clubs[id].league === lower; })[0];
      move(fc.id, lower, 'Zwangsabstieg');
      if (up) move(up, from, 'Nachrücker');
      S.news(st, 'Zwangsabstieg: ' + fc.short + ' muss in die ' + D.tierNames[lower], up ? st.clubs[up].short + ' rückt nach.' : '', 'liga');
    });
    S.balanceStaffeln(st);

    // Lizenz: hohe Überschuldung → Punktabzug
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k], net = c.cash + c.savings - E.debt(c);
      if (net < -E.revenueEstimate(st, c) * 0.6) {
        c.pointsPenalty = 6;
        S.news(st, 'Lizenzauflagen: 6 Punkte Abzug für ' + c.short, 'Die Überschuldung hat Konsequenzen.', 'finanzen');
        if (!c.userControlled) { var best = W.squad(st, c.id).sort(function (a, b) { return b.value - a.value; })[0]; var b = best && T.findAIBuyer(st, best, c); if (b) T.executeTransfer(st, best, b, Math.min(T.feeCap(b), best.value), best.wage, 3); }
      }
    });

    // Managerbewertung & Reputation
    if (uc) {
      var target = mg.boardTarget ? mg.boardTarget.pos : 12;
      var deltaRep = (target - userPos) * 0.6;
      if (uc.league < oldLeague) { deltaRep += 6; S.achieve(st, 'promotion'); mg.history[mg.history.length - 1].titles.push('Aufstieg ' + st.season); }
      if (uc.league > oldLeague) deltaRep -= 5;
      if (oldLeague === 1 && userPos === 1) { deltaRep += 10; S.achieve(st, 'champion'); mg.history[mg.history.length - 1].titles.push('Meister ' + st.season); }
      if (uc.cash < 0) deltaRep -= 2;
      mg.reputation = R.clamp(Math.round(mg.reputation + deltaRep), 0, 100);
      mg.lastRating = { pos: userPos, target: target, delta: Math.round(deltaRep), text: userPos <= target ? 'Saisonziel erreicht' : 'Saisonziel verfehlt' };
      mg.trust = R.clamp(mg.trust + (target - userPos) * 3, 0, 100);
      mg.seasonsPlayed++;
      if (mg.seasonsPlayed >= 10) S.achieve(st, 'seasons10');
      if (mg.canBeFired && !mg.founder && userPos > target + 6 && mg.trust < 30) {
        S.fireManager(st, 'Saisonziel klar verfehlt (Platz ' + userPos + ', Ziel: ' + mg.boardTarget.text + ')');
      }
    }

    // Saisonarchiv
    st.history.push({ season: st.season, champions: sum.champions, cup: sum.cup, promoted: sum.promoted, relegated: sum.relegated, scorers: sum.scorers, userClub: uc ? uc.id : null, userPos: userPos, userLeague: oldLeague, userKey: uc ? (oldLeague < 3 ? oldLeague : null) : null });

    // Vereinbarte Wechsel zur neuen Saison (vor dem Vertragsablauf, damit niemand dazwischenfunkt)
    T.executePending(st, true);
    // Spieler: Verträge, Altern, Karriereende
    T.pickTopLeavers(st);
    Object.keys(st.clubs).forEach(function (k) { var c = st.clubs[k]; if (!c.userControlled) T.aiRenewals(st, c); });
    T.returnLoans(st);
    var retired = 0;
    Object.keys(st.players).forEach(function (id) {
      var p = st.players[id];
      p.age++;
      if (p.stats.apps || p.stats.goals) { p.hist = (p.hist || []).concat([{ s: st.season, c: p.clubId ? st.clubs[p.clubId].short : '-', a: p.stats.apps, g: p.stats.goals }]).slice(-12); }
      p.stats = { apps: 0, goals: 0, assists: 0, yc: 0, rc: 0, rsum: 0 }; p.yellow = 0;
      if (p.clubId) {
        p.contract--;
        if (p.contract < 0) p.contract = 0;
        if (p.contract === 0 && !p.youth) {
          var club = st.clubs[p.clubId];
          if (club.userControlled && !p.renewing) { S.news(st, W.playerName(p) + ' verlässt den Verein', 'Der Vertrag ist ausgelaufen.', 'transfer'); }
          T.release(st, p);
        }
        if (p.youth && p.contract === 0) p.contract = 2;
      }
      var retireP = p.age >= 38 ? 1 : p.age >= 35 ? 0.45 : p.age >= 33 ? 0.15 : 0;
      if (!p.clubId && p.age >= 32) retireP += 0.4;
      if (R.chance(retireP)) {
        if (p.clubId) { var cl = st.clubs[p.clubId]; if (p.career.apps > 250 || p.career.goals > 80) cl.legends.push({ name: W.playerName(p), apps: p.career.apps, goals: p.career.goals, season: st.season }); T.release(st, p); }
        delete st.players[id]; retired++;
        return;
      }
      if (!p.clubId && p.freeSince != null && st.season - p.freeSince >= 1 && p.ovr < 50) { delete st.players[id]; }
    });

    // Jugend: Neuzugänge, Abgänge 19+
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k], q = E.level(c, 'jugend').q;
      var n = 2 + (q >= 2 ? 1 : 0) + (q >= 4 ? 1 : 0) + (c.budgets.scouting === 2 ? 1 : 0) + (c.youthBoost || 0); c.youthBoost = 0;
      for (var i = 0; i < n; i++) W.genYouth(st, c, q);
      W.youthOf(st, c.id).forEach(function (p) {
        if (p.age >= 20) {
          var squad = W.squad(st, c.id);
          if (!c.userControlled && (p.ovr >= R.avg(squad, function (x) { return x.ovr; }) - 10 || p.pot > 70) && squad.length < 20) p.youth = false;
          else if (!c.userControlled || p.age >= 21) { if (c.userControlled) S.news(st, W.playerName(p) + ' verlässt die Jugend', 'Zu alt für das Nachwuchszentrum – er sucht einen neuen Verein.', 'jugend'); T.release(st, p); }
        }
      });
      if (c.userControlled) S.news(st, 'Neuer Nachwuchsjahrgang', n + ' Talente sind ins Nachwuchsleistungszentrum gekommen.', 'jugend');
    });

    // KI-Kader auffüllen (vertragslose Spieler oder neue Spieler)
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      if (c.userControlled) { S.emergencySignings(st, c); return; }
      // KI-Vereine investieren überschüssiges Kapital (Personal, Infrastruktur, Rücklagen der Gesellschafter)
      var revEst = E.revenueEstimate(st, c);
      if (c.cash > revEst * 0.8) { var excess = Math.round((c.cash - revEst * 0.8) * 0.5); c.cash -= excess; E.book(c, 'Investitionen & Ausschüttung', -excess); }
      var squad = W.squad(st, c.id);
      var avg = squad.length ? R.avg(squad.slice().sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 10), function (p) { return p.ovr; }) : 50;
      var target = 40 + c.tier * 38;
      var leagueMean = S.leagueMean(st, c.league);
      var genMean = (avg * 0.5 + leagueMean * 0.5);
      if (avg < target - 6) genMean += 2;
      var need = { TW: 2, AUS: 4, RUE: 6, KRS: 3 };
      Object.keys(need).forEach(function (pos) {
        var have = squad.filter(function (p) { return p.pos === pos; }).length;
        while (have < need[pos]) {
          var fa = T.freeAgents(st).filter(function (p) { return p.pos === pos && p.ovr >= genMean - 6 && p.ovr <= genMean + 6 && p.age <= 31; })[0];
          if (fa) { T.executeTransfer(st, fa, c, 0, R.round(W.fairWage(fa), 500), R.randInt(1, 3)); }
          else W.genPlayer(st, pos, R.clamp(R.gauss(genMean - 1, 4), 30, 88), R.randInt(19, 28), c.id);
          have++;
        }
      });
      // Trainerwechsel bei schlechter Saison
      if ((c.lastPos || 9) >= (c.league === 3 ? 14 : 15) && R.chance(0.5)) { c.coach = W.genCoach(30 + c.tier * 60 + R.randInt(-10, 10), c.league); c.history.push({ season: st.season, type: 'trainer', text: 'Neuer Trainer: ' + c.coach.name }); }
      // Stärke-Tier passt sich der Liga an (KI-Vereine verändern sich)
      c.tier = R.clamp(c.tier * 0.85 + ({ 1: 0.82, 2: 0.55, 3: 0.35 }[c.league]) * 0.15 + (c.reputation - 50) / 2000, 0.15, 1);
    });

    st.season++;
    S.startSeason(st);
    if (uc && !mg.unemployed) { S.news(st, 'Saison ' + st.season + '/' + String(st.season + 1).slice(2) + ' – Saisonvorbereitung', 'Saisonziel des Vorstands: ' + mg.boardTarget.text + '. Transferbudget: ' + R.fmtMoney(mg.transferBudget) + '.', 'vorstand'); }
    if (mg.unemployed) S.generateJobOffers(st, 2);
    st.seasonSummary = null;
    st.rngState = R.rng.state;
  };

  // Durchschnittliche Stammspielerstärke je Spielklasse (wird beim Start der Karriere festgehalten, damit
  // nachrückende Spieler zum Niveau der Spielwelt passen)
  S.leagueMean = function (st, l) { return (st.leagueMean && st.leagueMean[l]) || { 1: 70, 2: 60, 3: 52 }[l]; };

  // Staffeln der 3. Liga ausgleichen: neue Drittligisten (Absteiger) kommen in die Staffeln mit den wenigsten
  // Vereinen, bei Gleichstand bevorzugt in ihre Heimatregion (club.region). Jede Staffel behält so 16 Vereine.
  S.balanceStaffeln = function (st) {
    var t3 = W.clubsInTier(st, 3), cnt = [0, 0, 0, 0];
    t3.forEach(function (c) { if (!c.newInTier3) cnt[c.staffel || 0]++; });
    t3.filter(function (c) { return c.newInTier3; }).forEach(function (c) {
      var best = 0;
      for (var i = 1; i < 4; i++) if (cnt[i] < cnt[best] || (cnt[i] === cnt[best] && i === c.region)) best = i;
      if (cnt[c.region || 0] === cnt[best]) best = c.region || 0;
      c.staffel = best; cnt[best]++; c.newInTier3 = false;
    });
  };

  // Notverpflichtungen, falls der Kader des Nutzers zu klein wird (keine Sackgasse)
  S.emergencySignings = function (st, club) {
    var squad = W.squad(st, club.id), signed = [];
    var need = { TW: 2, AUS: 3, RUE: 4, KRS: 2 };
    var mean = squad.length ? R.avg(squad, function (p) { return p.ovr; }) - 3 : S.leagueMean(st, club.league) - 4;
    function add(pos) {
      var fa = T.freeAgents(st).filter(function (p) { return p.pos === pos && p.age <= 32; }).sort(function (a, b) { return Math.abs(a.ovr - mean) - Math.abs(b.ovr - mean); })[0];
      var p = fa && Math.abs(fa.ovr - mean) < 10 ? fa : null;
      if (p) T.executeTransfer(st, p, club, 0, R.round(W.fairWage(p), 500), 1);
      else { p = W.genPlayer(st, pos, R.clamp(mean, 30, 85), R.randInt(20, 30), club.id); p.contract = 1; }
      signed.push(W.playerName(p) + ' (' + pos + ')');
    }
    Object.keys(need).forEach(function (pos) { var have = W.squad(st, club.id).filter(function (p) { return p.pos === pos; }).length; while (have++ < need[pos]) add(pos); });
    while (W.squad(st, club.id).length < 14) add(R.pick(['AUS', 'RUE', 'RUE', 'KRS']));
    if (signed.length) S.news(st, 'Notverpflichtungen: Kader aufgefüllt', 'Damit der Spielbetrieb gesichert ist, wurden Einjahresverträge abgeschlossen: ' + signed.join(', ') + '.', 'transfer');
    club.manualLineup = false;
  };

  // Ein „Klick auf NÄCHSTER SPIELTAG“ ohne Live-Spiel (für Schnellmodus und Tests)
  S.advance = function (st) {
    if (st.phase === 'seasonEnd') { S.newSeason(st); return 'newSeason'; }
    S.completeWeek(st, {});
    return st.phase;
  };
})(RFM);
