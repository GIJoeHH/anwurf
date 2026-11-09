// ANWURF! – Match-Engine Handball (Angriff für Angriff, 2 × 30 Minuten)
// Jede Minute hat jede Mannschaft in der Regel einen Angriff. Ein Angriff endet mit Tor, Parade, Fehlwurf,
// Ballverlust (oft mit Tempogegenstoß des Gegners) oder einem 7-Meter. Dazu kommen Zeitstrafen (2 Minuten
// Unterzahl, nach der dritten Disqualifikation), Verletzungen, Ermüdung, fliegende Wechsel und Team-Timeouts.
(function (R) {
  var D = R.data, W = R.world;
  var M = R.match = {};
  var N = D.ONCOURT;            // 7 Spieler auf dem Feld
  var BENCH = D.MATCHDAY - N;   // 9 Auswechselspieler

  M.STYLE = ['Defensiv', 'Gemischt', 'Offensiv', 'Brutale Offensive'];
  M.PRESS = ['Abwartend', 'Normal', 'Aggressiv']; // Abwehrverhalten
  M.TEMPO = ['Ruhig', 'Normal', 'Tempospiel'];
  M.TIMEOUTS = 3;               // Team-Timeouts je Spiel
  M.HALF = 30; M.FULL = 60; M.OT = 10;

  function available(p) { return p && !p.inj && p.susp <= 0; }
  M.available = available;
  function slotsOf(club) { return D.formations[club.tactic.formation] || D.formations['6:0']; }
  M.slotsOf = slotsOf;

  // Automatische beste Sieben: berücksichtigt Stärke, Position, Fitness, Verletzungen, Sperren
  M.autoBest = function (st, club) {
    if (!D.formations[club.tactic.formation]) club.tactic.formation = '6:0';
    var squad = W.squad(st, club.id).filter(available);
    var slots = slotsOf(club);
    var order = slots.map(function (s, i) { return i; }).sort(function (a, b) {
      var pr = { TW: 0, RUE: 1, KRS: 2, AUS: 3 }; return pr[slots[a][0]] - pr[slots[b][0]];
    });
    var used = {}, lineup = new Array(slots.length);
    order.forEach(function (i) {
      var role = slots[i][0], best = null, bestV = -1, want = M.slotDetail(slots[i]);
      squad.forEach(function (p) {
        if (used[p.id]) return;
        var v = W.roleRating(p, role) * (0.55 + 0.45 * p.fitness / 100) * (p.posDetail === want ? 1.04 : 1);
        if (v > bestV) { bestV = v; best = p; }
      });
      if (best) { used[best.id] = 1; lineup[i] = best.id; } else lineup[i] = null;
    });
    club.lineup = lineup;
    var rest = squad.filter(function (p) { return !used[p.id]; }).sort(function (a, b) { return b.ovr * b.fitness - a.ovr * a.fitness; });
    var bench = [];
    var gk = rest.filter(function (p) { return p.pos === 'TW'; })[0];
    if (gk) bench.push(gk.id);
    // je Position mindestens ein Ersatzmann, dann nach Stärke auffüllen
    ['RUE', 'AUS', 'KRS', 'RUE', 'AUS'].forEach(function (pos) { var p = rest.filter(function (x) { return x.pos === pos && bench.indexOf(x.id) < 0; })[0]; if (p && bench.length < BENCH) bench.push(p.id); });
    rest.forEach(function (p) { if (bench.length < BENCH && bench.indexOf(p.id) < 0) bench.push(p.id); });
    club.bench = bench;
    M.autoSetPieces(st, club);
  };

  // Genaue Position eines Platzes (Linksaußen links, Rechtsaußen rechts, Rückraum links/Mitte/rechts)
  M.slotDetail = function (sl) { var r = sl[0], x = sl[1]; return r === 'TW' ? 'TW' : r === 'KRS' ? 'KM' : r === 'AUS' ? (x < 50 ? 'LA' : 'RA') : (x < 40 ? 'RL' : x > 60 ? 'RR' : 'RM'); };
  // Kapitän und 7-Meter-Werfer (pen); fk/corner bleiben aus Kompatibilitätsgründen (Freiwurf-Spezialist)
  M.autoSetPieces = function (st, club) {
    var xi = club.lineup.map(function (id) { return st.players[id]; }).filter(Boolean);
    if (!xi.length) return;
    function best(fn) { return xi.slice().sort(function (a, b) { return fn(b) - fn(a); })[0].id; }
    if (club.captainManual && xi.some(function (p) { return p.id === club.captain; })) {} else club.captain = best(function (p) { return p.age * 2 + p.ovr; });
    if (!(club.pen && xi.some(function (p) { return p.id === club.pen; }))) club.pen = best(function (p) { return p.pos === 'TW' ? 0 : p.attr.sho + p.attr.tec * 0.6 + (p.pos === 'AUS' ? 3 : 0); });
    if (!(club.fk && xi.some(function (p) { return p.id === club.fk; }))) club.fk = best(function (p) { return p.pos === 'TW' ? 0 : p.attr.sho * (p.pos === 'RUE' ? 1.1 : 0.9) + p.attr.tec * 0.4; });
    if (!(club.corner && xi.some(function (p) { return p.id === club.corner; }))) club.corner = best(function (p) { return p.pos === 'TW' ? 0 : p.attr.pas + p.attr.tec * 0.5; });
  };

  // Aufstellung prüfen: verletzte/gesperrte/fremde Spieler ersetzen
  M.validateLineup = function (st, club) {
    if (!D.formations[club.tactic.formation]) club.tactic.formation = '6:0';
    var slots = slotsOf(club);
    if (!club.lineup || club.lineup.length !== slots.length) { M.autoBest(st, club); return; }
    var bad = club.lineup.some(function (id) { var p = st.players[id]; return !p || p.clubId !== club.id || p.youth || !available(p); });
    var dup = club.lineup.filter(function (id, i, a) { return id && a.indexOf(id) !== i; }).length > 0;
    if (bad || dup) {
      var used = {};
      club.lineup = club.lineup.map(function (id) { var p = st.players[id]; if (p && p.clubId === club.id && !p.youth && available(p) && !used[id]) { used[id] = 1; return id; } return null; });
      var pool = W.squad(st, club.id).filter(function (p) { return available(p) && !used[p.id]; });
      club.lineup = club.lineup.map(function (id, i) {
        if (id) return id;
        var role = slots[i][0];
        pool.sort(function (a, b) { return W.roleRating(b, role) * b.fitness - W.roleRating(a, role) * a.fitness; });
        var p = pool.shift(); return p ? p.id : null;
      });
    }
    club.bench = (club.bench || []).filter(function (id) { var p = st.players[id]; return p && p.clubId === club.id && !p.youth && available(p) && club.lineup.indexOf(id) < 0; });
    if (club.bench.length < 5) {
      W.squad(st, club.id).filter(function (p) { return available(p) && club.lineup.indexOf(p.id) < 0 && club.bench.indexOf(p.id) < 0; })
        .sort(function (a, b) { return b.ovr - a.ovr; }).forEach(function (p) { if (club.bench.length < BENCH) club.bench.push(p.id); });
    }
    if (club.bench.length > BENCH) club.bench.length = BENCH;
    M.autoSetPieces(st, club);
  };

  function cond(m, p) {
    var fit = m.fit[p.id];
    return (0.72 + 0.28 * fit / 100) * (0.94 + 0.08 * p.morale / 100) * (0.97 + 0.06 * p.form / 10);
  }

  M.teamStrength = function (m, side) {
    var st = m.st, t = m.tactic[side], club = st.clubs[m.clubs[side]];
    var slots = D.formations[t.formation] || D.formations['6:0'];
    var att = 0, aw = 0, mid = 0, mw = 0, def = 0, dw = 0, gk = 30, n = 0;
    var WA = { TW: 0, AUS: 0.9, RUE: 1, KRS: 0.75 }, WM = { TW: 0.1, AUS: 0.4, RUE: 1, KRS: 0.4 }, WD = { TW: 0, AUS: 0.6, RUE: 0.85, KRS: 1 };
    m.onPitch[side].forEach(function (pid, i) {
      if (!pid) return;
      var p = st.players[pid], role = slots[i][0], r = W.roleRating(p, role) * cond(m, p);
      n++;
      if (role === 'TW') { gk = r; return; }
      att += r * WA[role]; aw += WA[role]; mid += r * WM[role]; mw += WM[role]; def += r * WD[role]; dw += WD[role];
    });
    att = aw ? att / aw : 20; mid = mw ? mid / mw : 20; def = dw ? def / dw : 20;
    var numF = Math.pow(Math.max(1, n) / N, 1.1); // Unterzahl wiegt schwer
    var info = D.formationInfo[t.formation] || { def: 1, att: 1 };
    var styleA = [0.94, 1, 1.05, 1.1][t.style], styleD = [1.06, 1, 0.96, 0.9][t.style];
    var pressD = [0.98, 1, 1.03][t.pressing];
    var coachF = 0.96 + (club.coach ? club.coach.quality : 50) / 100 * 0.08 + R.econ.staffLvl(club, 'co') * 0.004;
    var home = (side === 0 && !m.neutral) ? 1.035 : 1; // Heimvorteil (Halle, Publikum)
    var mot = 1 + (m.mot[side] || 0) + (club.trainingBonus || 0) + (club.chemistry - 50) / 2500 + (m.drive[side] > 0 ? 0.03 : 0);
    var f = numF * coachF * home * mot * (m.dayForm ? m.dayForm[side] : 1);
    return { att: att * styleA * info.att * f, mid: mid * f, def: def * styleD * pressD * info.def * f, gk: gk * (n ? 1 : 0.5) * home * (m.dayForm ? m.dayForm[side] : 1), n: n };
  };

  M.create = function (st, homeId, awayId, opts) {
    opts = opts || {};
    var h = st.clubs[homeId], a = st.clubs[awayId];
    [h, a].forEach(function (c) {
      var userCoach = c.userControlled && st.manager.role !== 'gf';
      if (userCoach && c.manualLineup) M.validateLineup(st, c); else M.autoBest(st, c);
      if (!userCoach) M.aiTactic(st, c, c === h ? a : h, c === h);
    });
    var m = {
      st: st, clubs: [homeId, awayId], comp: opts.comp || 'league', neutral: !!opts.neutral, minute: 0, finished: false,
      score: [0, 0], events: [], stats: { possTicks: [0, 0], shots: [0, 0], onTarget: [0, 0], chances: [0, 0], fouls: [0, 0], corners: [0, 0], saves: [0, 0], twoMin: [0, 0], fastBreaks: [0, 0], turnovers: [0, 0], sevenGoals: [0, 0] },
      onPitch: [h.lineup.slice(), a.lineup.slice()], bench: [h.bench.slice(), a.bench.slice()], subsLeft: [99, 99], subWindows: [99, 99],
      tactic: [R.clone(h.tactic), R.clone(a.tactic)], mot: [0, 0], fit: {}, yellows: {}, sentOff: {}, injured: {}, played: {}, rating: {},
      goals: {}, assists: {}, saves: {}, faced: {}, twoMins: {}, redDirect: {}, susp2: [[], []], timeouts: [M.TIMEOUTS, M.TIMEOUTS], run: [0, 0], teamYellow: [0, 0],
      extraTime: opts.extraTime || false, aggregate: opts.aggregate || null, pens: null, maxMinute: M.FULL, half: 1,
      derby: h.rivals.indexOf(a.id) >= 0, dayForm: [R.clamp(R.gauss(1, 0.05), 0.87, 1.13), R.clamp(R.gauss(1, 0.05), 0.87, 1.13)], userSide: h.userControlled ? 0 : (a.userControlled ? 1 : -1), drive: [0, 0], ball: R.chance(0.5) ? 0 : 1
    };
    [0, 1].forEach(function (s) {
      m.onPitch[s].concat(m.bench[s]).forEach(function (pid) { if (pid) { m.fit[pid] = st.players[pid].fitness; } });
      m.onPitch[s].forEach(function (pid) { if (pid) { m.played[pid] = s; m.rating[pid] = 6.0; } });
    });
    if (m.derby) { m.mot[0] += 0.01; m.mot[1] += 0.01; }
    m.events.push({ min: 0, type: 'kickoff', side: -1, text: 'Anwurf! ' + h.name + ' gegen ' + a.name + (m.derby ? ' – Derbyzeit in der Halle!' : '') });
    return m;
  };

  M.aiTactic = function (st, club, opp, home) {
    var my = M.squadStrength(st, club), op = M.squadStrength(st, opp);
    var d = my - op + (home ? 2 : -2);
    var prof = club.coach ? club.coach.profile : 'Ausgewogen';
    var style = d > 6 ? 2 : d < -7 ? 0 : 1;
    if (prof === 'Offensiv' && style < 3) style++;
    if (prof === 'Defensiv' && style > 0) style--;
    club.tactic.style = R.clamp(style, 0, 3);
    club.tactic.pressing = prof === 'Erfahrener Taktiker' ? (d > 0 ? 2 : 1) : 1;
    club.tactic.tempo = prof === 'Offensiv' ? 2 : 1;
    if (!D.formations[club.tactic.formation]) club.tactic.formation = '6:0';
  };

  M.squadStrength = function (st, club) {
    var ids = club.lineup && club.lineup.length === slotsOf(club).length ? club.lineup : null;
    var ps = ids ? ids.map(function (id) { return st.players[id]; }).filter(Boolean) : W.squad(st, club.id).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, N);
    return R.avg(ps, function (p) { return p.ovr; });
  };

  function slotRole(m, side, i) { var sl = D.formations[m.tactic[side].formation] || D.formations['6:0']; return sl[i] ? sl[i][0] : 'RUE'; }
  function pickPlayer(m, side, wfn) {
    var st = m.st, cands = [];
    m.onPitch[side].forEach(function (pid, i) { if (pid) cands.push({ p: st.players[pid], role: slotRole(m, side, i) }); });
    if (!cands.length) return null;
    return R.weighted(cands, function (c) { return wfn(c.p, c.role); }).p;
  }
  function goalkeeper(m, side) {
    for (var i = 0; i < m.onPitch[side].length; i++) if (slotRole(m, side, i) === 'TW' && m.onPitch[side][i]) return m.st.players[m.onPitch[side][i]];
    return null;
  }
  M.goalkeeper = goalkeeper;
  function name(p) { return p ? p.last : 'Unbekannt'; }
  function ev(m, type, side, text, pid, pid2, extra) {
    var e = { min: m.minute, type: type, side: side, text: text, pid: pid || null, pid2: pid2 || null };
    if (extra) for (var k in extra) e[k] = extra[k];
    m.events.push(e); return e;
  }
  function addRating(m, pid, d) { if (pid && m.rating[pid] != null) m.rating[pid] = R.clamp(m.rating[pid] + d, 1, 10); }

  var C = {
    back: ['TOR! {P} hämmert den Ball aus dem Rückraum ins Netz!', 'Sprungwurf {P} – drin!', '{P} trifft aus neun Metern!', 'Unhaltbar! {P} zieht aus dem Rückraum ab.', '{P} mit dem Aufsetzer – Tor!'],
    pivot: ['{P} setzt sich am Kreis durch und trifft!', 'Anspiel an den Kreis, {P} dreht sich – Tor!', '{P} fängt den Ball am Kreis und versenkt!'],
    wing: ['{P} fliegt von außen in den Kreis – Tor!', 'Dreher von {P}! Der Torwart ist chancenlos.', '{P} trifft aus spitzem Winkel!', 'Kempa-Trick! {P} vollendet in der Luft!'],
    breakthrough: ['{P} bricht durch die Abwehr und trifft!', 'Starker Durchbruch von {P} – Tor!'],
    fast: ['Tempogegenstoß! {P} läuft allein auf das Tor zu und trifft!', 'Konter über {P} – Tor!', '{P} vollendet die erste Welle!'],
    seven: ['{P} verwandelt den 7-Meter sicher.', '7-Meter {P} – drin!', 'Eiskalt vom Strich: {P}.'],
    save: ['Parade von {G}!', '{G} pariert stark!', 'Glanztat von {G}!', '{G} ist mit dem Fuß dran!', '{G} fischt den Ball aus dem Winkel!'],
    sevenSave: ['{G} hält den 7-Meter!', '7-Meter pariert – {G} wird gefeiert!'],
    miss: ['{P} wirft knapp vorbei.', 'Pfosten! {P} hat Pech.', 'Drüber! {P} verzieht.', 'Latte! {P} trifft nur das Aluminium.'],
    block: ['{P} scheitert am Abwehrblock.', 'Geblockt! {P} kommt nicht durch.'],
    steal: ['Ballgewinn durch {P}!', '{P} fängt den Pass ab!', 'Stürmerfoul – Ballbesitz für den Gegner.', 'Schrittfehler! Der Ball ist weg.'],
    twomin: ['Zwei Minuten für {P}!', 'Zeitstrafe gegen {P} – Unterzahl!', '{P} muss für zwei Minuten raus.'],
    red: ['ROT! {P} wird disqualifiziert!', 'Rote Karte für {P} nach grobem Foul!'],
    yellow: ['Gelbe Karte für {P}.', 'Verwarnung für {P}.'],
    injury: ['{P} bleibt liegen und muss behandelt werden.', 'Oh nein, {P} hat sich verletzt!'],
    sub: ['Wechsel: {P} kommt für {Q}.', '{P} kommt für {Q} aufs Feld.']
  };
  function txt(arr, P, Q) { return R.pick(arr).replace('{P}', P).replace('{G}', P).replace('{Q}', Q || ''); }

  function scored(m, side, shooter, assister, kind, gkp) {
    var opp = 1 - side, st = m.st;
    m.score[side]++; m.stats.onTarget[side]++;
    m.goals[shooter.id] = (m.goals[shooter.id] || 0) + 1;
    addRating(m, shooter.id, kind === 'seven' ? 0.22 : 0.32);
    if (assister) { m.assists[assister.id] = (m.assists[assister.id] || 0) + 1; addRating(m, assister.id, 0.15); }
    if (gkp) { m.faced[gkp.id] = (m.faced[gkp.id] || 0) + 1; addRating(m, gkp.id, -0.07); }
    if (kind === 'seven') m.stats.sevenGoals[side]++;
    m.run[side]++; m.run[opp] = 0;
    var lib = { back: C.back, pivot: C.pivot, wing: C.wing, breakthrough: C.breakthrough, fast: C.fast, seven: C.seven }[kind] || C.back;
    ev(m, 'goal', side, txt(lib, name(shooter)) + (assister && kind !== 'seven' && kind !== 'fast' ? ' Zuspiel: ' + name(assister) + '.' : '') + ' ' + m.score[0] + ':' + m.score[1], shooter.id, assister ? assister.id : null, { pen: kind === 'seven', fast: kind === 'fast', kind: kind, score: m.score.slice() });
    m.ball = opp;
  }
  function saved(m, side, shooter, gkp, seven) {
    var opp = 1 - side;
    m.stats.onTarget[side]++; m.stats.saves[opp]++;
    m.saves[gkp.id] = (m.saves[gkp.id] || 0) + 1; m.faced[gkp.id] = (m.faced[gkp.id] || 0) + 1;
    addRating(m, gkp.id, seven ? 0.4 : 0.16); addRating(m, shooter.id, -0.08);
    ev(m, 'save', side, txt(seven ? C.sevenSave : C.save, name(gkp)), shooter.id, gkp.id);
    m.ball = opp;
  }

  // Tempogegenstoß nach Ballgewinn oder schneller Parade
  function fastBreak(m, side, starter) {
    var opp = 1 - side, st = m.st;
    var shooter = pickPlayer(m, side, function (p, role) { return role === 'TW' ? 0 : (role === 'AUS' ? 4 : role === 'RUE' ? 1.2 : 0.8) * Math.pow(p.attr.spd, 1.5); });
    if (!shooter) return;
    m.stats.shots[side]++; m.stats.chances[side]++; m.stats.fastBreaks[side]++;
    var gkp = goalkeeper(m, opp);
    var q = (shooter.attr.sho * 0.5 + shooter.attr.spd * 0.3 + shooter.attr.tec * 0.2) * cond(m, shooter);
    var pGoal = 0.8 * R.clamp(Math.pow(q / Math.max(15, gkp ? gkp.attr.gk * cond(m, gkp) : 15), 0.5), 0.8, 1.15);
    if (!gkp) pGoal = 0.97;
    if (R.rand() < pGoal) scored(m, side, shooter, starter && starter !== shooter ? starter : null, 'fast', gkp);
    else if (gkp && R.chance(0.75)) saved(m, side, shooter, gkp, false);
    else { addRating(m, shooter.id, -0.12); ev(m, 'miss', side, txt(C.miss, name(shooter)), shooter.id); m.ball = opp; }
  }

  // 7-Meter
  function sevenMeter(m, side) {
    var opp = 1 - side, st = m.st, club = st.clubs[m.clubs[side]];
    var taker = st.players[club.pen];
    if (!taker || m.onPitch[side].indexOf(taker.id) < 0) taker = pickPlayer(m, side, function (p, role) { return role === 'TW' ? 0 : Math.pow(p.attr.sho + p.attr.tec * 0.5, 2); });
    if (!taker) return;
    m.stats.shots[side]++; m.stats.chances[side]++; m.stats.corners[side]++;
    var gkp = goalkeeper(m, opp);
    var p = gkp ? R.clamp(0.75 + (taker.attr.sho - 65) / 400 - (gkp.attr.gk * cond(m, gkp) - 65) / 450, 0.55, 0.9) : 0.98;
    ev(m, 'chance', side, '7-Meter für ' + st.clubs[m.clubs[side]].short + '! ' + name(taker) + ' tritt an …', taker.id, null, { pen: true });
    if (R.rand() < p) scored(m, side, taker, null, 'seven', gkp);
    else if (gkp && R.chance(0.8)) saved(m, side, taker, gkp, true);
    else { addRating(m, taker.id, -0.25); ev(m, 'miss', side, '7-Meter an den Pfosten! ' + name(taker) + ' vergibt.', taker.id); m.ball = opp; }
  }

  // Zeitstrafe: Spieler 2 Minuten draußen (Unterzahl), nach der dritten Zeitstrafe disqualifiziert
  function twoMinutes(m, s, p, reason) {
    var idx = m.onPitch[s].indexOf(p.id); if (idx < 0) return;
    m.onPitch[s][idx] = null;
    m.twoMins[p.id] = (m.twoMins[p.id] || 0) + 1; m.stats.twoMin[s]++;
    addRating(m, p.id, -0.35);
    var third = m.twoMins[p.id] >= 3;
    m.susp2[s].push({ pid: p.id, idx: idx, until: m.minute + 2, out: third });
    if (third) { m.sentOff[p.id] = true; addRating(m, p.id, -0.6); ev(m, 'red', s, 'Dritte Zeitstrafe – ' + name(p) + ' ist disqualifiziert!', p.id); }
    else ev(m, 'yellow', s, (reason ? reason + ' ' : '') + txt(C.twomin, name(p)), p.id, null, { twomin: true });
  }
  function redCard(m, s, p) {
    var idx = m.onPitch[s].indexOf(p.id); if (idx < 0) return;
    m.onPitch[s][idx] = null; m.sentOff[p.id] = true; m.redDirect[p.id] = true; m.stats.twoMin[s]++;
    m.susp2[s].push({ pid: p.id, idx: idx, until: m.minute + 2, out: true });
    addRating(m, p.id, -1.2);
    ev(m, 'red', s, txt(C.red, name(p)), p.id);
  }
  // Abgelaufene Zeitstrafen: Spieler kehrt zurück bzw. ein Ersatzmann füllt die Lücke
  function expireSuspensions(m) {
    [0, 1].forEach(function (s) {
      m.susp2[s] = m.susp2[s].filter(function (x) {
        if (x.until > m.minute) return true;
        if (m.onPitch[s][x.idx]) return false;
        if (!x.out && !m.injured[x.pid]) { m.onPitch[s][x.idx] = x.pid; ev(m, 'info', s, name(m.st.players[x.pid]) + ' ist nach der Zeitstrafe zurück – wieder komplett.'); }
        else fillSlot(m, s, x.idx);
        return false;
      });
    });
  }
  function fillSlot(m, s, idx) {
    var st = m.st, role = slotRole(m, s, idx);
    var cands = m.bench[s].map(function (id) { return st.players[id]; }).filter(function (p) { return p && !m.sentOff[p.id] && !m.injured[p.id]; });
    if (!cands.length) return;
    cands.sort(function (a, b) { return W.roleRating(b, role) * m.fit[b.id] - W.roleRating(a, role) * m.fit[a.id]; });
    var p = cands[0];
    m.bench[s].splice(m.bench[s].indexOf(p.id), 1);
    m.onPitch[s][idx] = p.id; m.played[p.id] = s; if (m.rating[p.id] == null) m.rating[p.id] = 6.0;
    if (m.fit[p.id] == null) m.fit[p.id] = p.fitness;
    ev(m, 'sub', s, name(p) + ' kommt aufs Feld.', p.id);
  }

  // Ein Angriff der Mannschaft „side“
  function attack(m, side, S) {
    var opp = 1 - side, st = m.st, t = m.tactic;
    m.stats.possTicks[side]++;
    var ratio = R.clamp(Math.pow(S[side].att / Math.max(10, S[opp].def), 1.05), 0.6, 1.6);
    var oinfo = D.formationInfo[t[opp].formation] || { steal: 1 };
    var tempo = t[side].tempo;
    // Ballverlust (technischer Fehler, abgefangener Pass, Stürmerfoul)
    var pTO = 0.15 * oinfo.steal * [0.9, 1, 1.12][tempo] * [0.92, 1, 1.12][t[opp].pressing] / Math.pow(ratio, 0.45) * (S[side].n < N ? 1.15 : 1);
    if (R.rand() < pTO) {
      m.stats.turnovers[side]++;
      var stealer = pickPlayer(m, opp, function (p, role) { return role === 'TW' ? 0.05 : (p.attr.def + p.attr.spd) / 2; });
      var loser = pickPlayer(m, side, function (p, role) { return role === 'TW' ? 0.02 : role === 'RUE' ? 2 : 1; });
      if (loser) addRating(m, loser.id, -0.1);
      if (stealer) addRating(m, stealer.id, 0.12);
      m.ball = opp;
      if (R.chance(0.42 + (t[opp].tempo - 1) * 0.12)) {
        ev(m, 'info', opp, txt(C.steal, name(stealer)), stealer ? stealer.id : null);
        fastBreak(m, opp, stealer);
      }
      return;
    }
    // Foul mit 7-Meter
    var pressF = [0.85, 1, 1.25][t[opp].pressing] * (m.derby ? 1.1 : 1);
    if (R.rand() < 0.07 * pressF * Math.pow(ratio, 0.5)) {
      m.stats.fouls[opp]++;
      if (R.chance(0.33)) { var fouler = pickPlayer(m, opp, function (p, role) { return role === 'TW' ? 0 : role === 'KRS' ? 2 : 1; }); if (fouler) twoMinutes(m, opp, fouler, 'Klare Torchance verhindert:'); }
      sevenMeter(m, side);
      return;
    }
    // Zeitstrafe ohne 7-Meter (Foul im Angriffsaufbau)
    if (R.rand() < 0.03 * pressF) {
      m.stats.fouls[opp]++;
      var f2 = pickPlayer(m, opp, function (p, role) { return role === 'TW' ? 0 : (role === 'KRS' ? 2 : 1) * (110 - p.attr.def / 2); });
      if (f2) { if (R.chance(0.04)) redCard(m, opp, f2); else twoMinutes(m, opp, f2); }
    } else if (m.teamYellow[opp] < 3 && R.rand() < 0.012 * pressF) {
      var fy = pickPlayer(m, opp, function (p, role) { return role === 'TW' ? 0 : 1; });
      if (fy && !m.yellows[fy.id]) { m.yellows[fy.id] = 1; m.teamYellow[opp]++; ev(m, 'info', opp, txt(C.yellow, name(fy)), fy.id); }
    }
    // Wurf
    m.stats.shots[side]++;
    var shooter = pickPlayer(m, side, function (p, role) { return ({ TW: 0, AUS: 1.7, RUE: 2.6, KRS: 1.8 })[role] * Math.pow(p.attr.sho, 1.2) / 100; });
    if (!shooter) return;
    var role = 'RUE';
    m.onPitch[side].forEach(function (pid, i) { if (pid === shooter.id) role = slotRole(m, side, i); });
    var kind = role === 'AUS' ? 'wing' : role === 'KRS' ? 'pivot' : (R.chance(0.25) ? 'breakthrough' : 'back');
    var base = { back: 0.5, breakthrough: 0.64, wing: 0.6, pivot: 0.7 }[kind];
    var assister = (kind === 'pivot' || kind === 'wing' || R.chance(0.35)) && R.chance(0.7) ? pickPlayer(m, side, function (p, r2) { return p === shooter || r2 === 'TW' ? 0 : (r2 === 'RUE' ? 3 : 1) * p.attr.pas; }) : null;
    var gkp = goalkeeper(m, opp);
    var q = (shooter.attr.sho * 0.7 + shooter.attr.tec * 0.3) * cond(m, shooter);
    var gkv = gkp ? gkp.attr.gk * cond(m, gkp) * (S[opp].gk / Math.max(1, gkp.attr.gk * cond(m, gkp))) : 10;
    var pGoal = base * R.clamp(Math.pow(q * Math.pow(ratio, 0.3) / Math.max(15, gkv), 0.6), 0.68, 1.3) * [1.02, 1, 0.98][tempo] * (S[opp].n < N ? 1.12 : 1);
    if (!gkp) pGoal = 0.95;
    pGoal = Math.min(0.93, pGoal);
    if (R.rand() < pGoal) scored(m, side, shooter, assister, kind, gkp);
    else if (kind === 'back' && R.chance(0.22)) {
      var blocker = pickPlayer(m, opp, function (p, r2) { return r2 === 'TW' ? 0 : p.attr.def; });
      if (blocker) addRating(m, blocker.id, 0.1);
      addRating(m, shooter.id, -0.06);
      if (R.chance(0.12)) ev(m, 'miss', side, txt(C.block, name(shooter)), shooter.id);
      m.ball = R.chance(0.6) ? opp : side;
    } else if (gkp && R.chance(0.72)) {
      saved(m, side, shooter, gkp, false);
      if (R.chance(0.1 + (t[opp].tempo - 1) * 0.05)) fastBreak(m, opp, gkp);
    } else {
      addRating(m, shooter.id, -0.12);
      if (R.chance(0.6)) ev(m, 'miss', side, txt(C.miss, name(shooter)), shooter.id);
      m.ball = opp;
    }
  }

  M.step = function (m) {
    if (m.finished) return;
    var st = m.st;
    m.minute++;
    if (m.minute === M.HALF + 1 && m.half === 1) { m.half = 2; ev(m, 'ht', -1, 'Halbzeit! Es steht ' + m.score[0] + ':' + m.score[1] + '.'); m.ball = 1 - m.ball; }
    expireSuspensions(m);
    var S = [M.teamStrength(m, 0), M.teamStrength(m, 1)];
    var t = m.tactic;
    // Angriffe dieser Minute: beide Mannschaften, Tempospiel bringt mehr Angriffe
    var first = m.ball, order = [first, 1 - first];
    order.forEach(function (side) {
      var tempoF = [0.9, 1, 1.1][t[side].tempo] * (m.minute > M.FULL ? 0.95 : 1);
      if (R.rand() < 0.86 * tempoF) attack(m, side, S);
    });
    // Verletzungen, Ermüdung
    [0, 1].forEach(function (s) {
      var med = D.facilities.medizin.levels[st.clubs[m.clubs[s]].fac.medizin || 1].q;
      var diffInj = R.world.diffSettings[st.settings.difficulty].injury;
      if (R.rand() < 0.0026 * [0.9, 1, 1.2][t[1 - s].pressing] * (1 - med * 0.06) * diffInj * R.econ.injuryStaffF(st.clubs[m.clubs[s]])) {
        var ip = pickPlayer(m, s, function (p, role) { return (role === 'TW' ? 0.2 : 1) * (0.5 + p.risk + (100 - m.fit[p.id]) / 50 + (p.age > 30 ? 0.3 : 0)); });
        if (ip) {
          m.injured[ip.id] = M.rollInjury(st, ip, med);
          ev(m, 'injury', s, txt(C.injury, name(ip)) + ' Diagnose: ' + m.injured[ip.id].type + '.', ip.id);
          var isUser = m.userSide === s && st.manager.role !== 'gf' && m.userLive;
          if (!isUser || m.autoSub) autoReplace(m, s, ip.id, true);
          else m.needSub = { side: s, pid: ip.id };
        }
      }
      var fat = 0.2 * [0.85, 1, 1.25][t[s].pressing] * [0.85, 1, 1.2][t[s].tempo];
      m.onPitch[s].forEach(function (pid, i) {
        if (!pid) return;
        var p = st.players[pid], gk = slotRole(m, s, i) === 'TW';
        m.fit[pid] = Math.max(20, m.fit[pid] - fat * (gk ? 0.35 : 1) * (1.4 - p.attr.sta / 100));
      });
      // Erholung auf der Bank (fliegende Wechsel)
      m.bench[s].forEach(function (pid) { if (m.fit[pid] != null) m.fit[pid] = Math.min(st.players[pid] ? st.players[pid].fitness : 100, m.fit[pid] + 0.6); });
      if (m.drive[s] > 0) m.drive[s]--;
    });
    // KI: Rotation, Torwartwechsel, Timeouts
    [0, 1].forEach(function (s) {
      var isUser = m.userSide === s && m.userLive && st.manager.role !== 'gf';
      if (isUser && !m.autoSub) return;
      aiCoach(m, s);
    });
    // Spielende
    if (m.minute >= m.maxMinute) {
      var tied = isDrawForKO(m);
      if (m.extraTime && tied && m.aggregate) { penalties(m); }
      else if (m.maxMinute === M.FULL && m.extraTime && tied) { m.maxMinute = M.FULL + M.OT; ev(m, 'et', -1, 'Verlängerung! Nach 60 Minuten steht es ' + m.score[0] + ':' + m.score[1] + ' – es geht in 2 × 5 Minuten Verlängerung.'); return; }
      else if (m.extraTime && tied) penalties(m);
      m.finished = true;
      ev(m, 'ft', -1, 'Schlusssirene! Endstand ' + m.score[0] + ':' + m.score[1] + (m.pens ? ' (n. 7m ' + m.pens[0] + ':' + m.pens[1] + ')' : '') + '.');
    }
  };

  function aiCoach(m, s) {
    var st = m.st;
    // Team-Timeout bei einem Lauf des Gegners
    if (m.run[1 - s] >= 3 && m.timeouts[s] > 0 && m.minute < m.maxMinute - 1 && R.chance(0.6)) { M.driveOn(m, s); m.run[1 - s] = 0; }
    // Torwartwechsel bei schwacher Quote
    var gk = goalkeeper(m, s);
    if (gk && m.minute >= 15 && (m.faced[gk.id] || 0) >= 10 && (m.saves[gk.id] || 0) / m.faced[gk.id] < 0.2 && !m.gkSwapped) {
      var alt = m.bench[s].map(function (id) { return st.players[id]; }).filter(function (p) { return p && p.pos === 'TW'; })[0];
      if (alt) { M.substitute(m, s, gk.id, alt.id); m.gkSwapped = true; }
    }
    // Rotation: müde Feldspieler gegen frische Kräfte
    if (m.minute >= 8 && m.minute <= m.maxMinute - 2 && R.chance(0.22)) {
      var tired = m.onPitch[s].filter(Boolean).map(function (pid) { return st.players[pid]; })
        .filter(function (p) { return p.pos !== 'TW'; }).sort(function (a, b) { return m.fit[a.id] - m.fit[b.id]; })[0];
      if (tired && m.fit[tired.id] < 80) autoReplace(m, s, tired.id, false, 8);
    }
  }

  function isDrawForKO(m) {
    if (m.aggregate) return m.score[0] + m.aggregate[0] === m.score[1] + m.aggregate[1];
    return m.score[0] === m.score[1];
  }
  // 7-Meter-Werfen: je fünf Würfe, danach im Wechsel bis zur Entscheidung
  function penalties(m) {
    var st = m.st, p = [0, 0];
    var gks = [goalkeeper(m, 0), goalkeeper(m, 1)];
    for (var r = 0; r < 5 || p[0] === p[1]; r++) {
      [0, 1].forEach(function (s) {
        var shooters = m.onPitch[s].concat(m.bench[s]).filter(Boolean).map(function (id) { return st.players[id]; }).filter(function (x) { return x && x.pos !== 'TW' && !m.sentOff[x.id]; }).sort(function (a, b) { return b.attr.sho - a.attr.sho; });
        var sh = shooters[r % Math.max(1, shooters.length)], g = gks[1 - s];
        var pr = 0.74 + (sh ? (sh.attr.sho - 65) / 400 : 0) - (g ? (g.attr.gk - 65) / 450 : 0);
        if (R.rand() < pr) p[s]++;
      });
      if (r > 30) { p[0]++; break; }
    }
    m.pens = p;
    ev(m, 'pens', -1, '7-Meter-Werfen! ' + st.clubs[m.clubs[p[0] > p[1] ? 0 : 1]].name + ' gewinnt ' + p[0] + ':' + p[1] + '!');
  }
  function autoReplace(m, s, outId, forced, minGain) {
    var st = m.st, idx = m.onPitch[s].indexOf(outId);
    if (idx < 0) return;
    var role = slotRole(m, s, idx);
    var cands = m.bench[s].map(function (id) { return st.players[id]; }).filter(function (p) { return p && !m.sentOff[p.id] && !m.injured[p.id] && (role === 'TW') === (p.pos === 'TW'); });
    if (!cands.length) { if (forced) { m.onPitch[s][idx] = null; ev(m, 'info', s, name(st.players[outId]) + ' kann nicht weitermachen – kein Ersatz auf der Bank!'); } return; }
    cands.sort(function (a, b) { return W.roleRating(b, role) * m.fit[b.id] - W.roleRating(a, role) * m.fit[a.id]; });
    var inP = cands[0], outP = st.players[outId];
    if (!forced && minGain && W.roleRating(inP, role) * m.fit[inP.id] < W.roleRating(outP, role) * m.fit[outId] + minGain * 10) return;
    M.substitute(m, s, outId, inP.id, !forced);
  }
  // Wechsel (im Handball beliebig oft, der ausgewechselte Spieler geht zurück auf die Bank)
  M.substitute = function (m, s, outId, inId, quiet) {
    var st = m.st, idx = m.onPitch[s].indexOf(outId);
    if (idx < 0 || m.subsLeft[s] <= 0) return false;
    var bi = m.bench[s].indexOf(inId); if (bi < 0) return false;
    m.bench[s].splice(bi, 1);
    m.onPitch[s][idx] = inId;
    if (!m.injured[outId] && !m.sentOff[outId]) m.bench[s].push(outId);
    m.played[inId] = s; if (m.rating[inId] == null) m.rating[inId] = 6.0;
    if (m.fit[inId] == null) m.fit[inId] = st.players[inId].fitness;
    if (!quiet || R.chance(0.25)) ev(m, 'sub', s, txt(C.sub, name(st.players[inId]), name(st.players[outId])), inId, outId);
    if (m.needSub && m.needSub.pid === outId) m.needSub = null;
    return true;
  };
  // Abwehrsystem während des Spiels ändern (Spieler bleiben in Reihenfolge)
  M.changeFormation = function (m, s, formation) {
    m.tactic[s].formation = formation;
    ev(m, 'tactic', s, 'Umstellung auf ' + formation + (formation.indexOf('Kreis') >= 0 ? '' : '-Abwehr') + '!');
  };
  M.changeTactic = function (m, s, key, val) {
    m.tactic[s][key] = val;
    var labels = { style: M.STYLE, pressing: M.PRESS, tempo: M.TEMPO }[key];
    var names = { style: 'Spielweise', pressing: 'Abwehrverhalten', tempo: 'Tempo' }[key];
    ev(m, 'tactic', s, names + ' jetzt: ' + labels[val] + '.');
  };
  // Team-Timeout (höchstens drei je Spiel): kurzer Motivationsschub, Lauf des Gegners wird unterbrochen
  M.driveOn = function (m, s) {
    if (m.timeouts[s] <= 0) return false;
    m.timeouts[s]--; m.drive[s] = 4; m.mot[s] += 0.004; m.run[1 - s] = 0; m.ball = s;
    ev(m, 'tactic', s, 'Team-Timeout ' + m.st.clubs[m.clubs[s]].short + '! Der Trainer stellt die grüne Karte auf den Tisch (noch ' + m.timeouts[s] + ').');
    return true;
  };

  M.applySpeech = function (m, s, speech, half) {
    var st = m.st, club = st.clubs[m.clubs[s]];
    var my = M.squadStrength(st, club), op = M.squadStrength(st, st.clubs[m.clubs[1 - s]]);
    var morale = R.avg(m.onPitch[s].filter(Boolean).map(function (id) { return st.players[id]; }), function (p) { return p.morale; });
    var eff = speech.mot;
    if (speech.underdog) eff = my < op - 2 ? 0.04 : -0.005;
    if (speech.derby) eff = m.derby ? 0.05 : 0.005;
    if (speech.risk) eff = morale > 60 ? eff * 1.2 : -0.01;
    if (half && speech.id === 'lob') eff = m.score[s] >= m.score[1 - s] ? 0.025 : -0.005;
    if (half && speech.id === 'ruhe') eff = m.score[s] < m.score[1 - s] ? 0.02 : 0.01;
    eff += R.randRange(-0.008, 0.008);
    m.mot[s] += eff;
    ev(m, 'speech', s, (half ? 'Halbzeitansprache: ' : 'Kabinenansprache: ') + speech.t + (eff > 0.02 ? ' Die Spieler wirken hochmotiviert!' : eff < 0 ? ' Das kam nicht gut an …' : ''));
    return eff;
  };

  M.rollInjury = function (st, p, medQ) {
    var diff = R.world.diffSettings[st.settings.difficulty].injury;
    var inj = R.weighted(D.injuries, function (x) { return x.w * (x.min >= 6 ? diff : 1); });
    var weeks = R.randInt(inj.min, inj.max);
    var reha = p && p.clubId && st.clubs[p.clubId] ? R.econ.staffLvl(st.clubs[p.clubId], 'reha') : 0;
    weeks = Math.max(inj.min > 10 ? Math.ceil(inj.min * 0.8) : 1, Math.round(weeks * (1 - medQ * 0.06) * (1 - reha * 0.07)));
    return { type: inj.n, weeks: weeks, total: weeks };
  };

  M.simulate = function (m) { while (!m.finished) M.step(m); return m; };

  // Ergebnis auf Spieler und Vereine übertragen
  M.finalize = function (m) {
    var st = m.st;
    var possTotal = m.stats.possTicks[0] + m.stats.possTicks[1] || 1;
    m.stats.poss = [Math.round(m.stats.possTicks[0] / possTotal * 100), 0]; m.stats.poss[1] = 100 - m.stats.poss[0];
    var res = [m.score[0] - m.score[1], m.score[1] - m.score[0]];
    if (m.pens) res = [m.pens[0] - m.pens[1], m.pens[1] - m.pens[0]];
    var countsForStats = m.comp === 'league';
    Object.keys(m.played).forEach(function (pid) {
      var p = st.players[pid], s = m.played[pid];
      if (!p) return;
      var rt = m.rating[pid] + (res[s] > 0 ? 0.4 : res[s] < 0 ? -0.3 : 0);
      if (p.pos === 'TW' && m.faced[pid] >= 8) rt += ((m.saves[pid] || 0) / m.faced[pid] - 0.3) * 4; // Paradenquote
      if (p.pos === 'KRS' && m.score[1 - s] <= 24) rt += 0.3; // starke Abwehr
      rt = R.clamp(Math.round(rt * 10) / 10, 1, 10);
      m.rating[pid] = rt;
      p.fitness = Math.round(m.fit[pid]);
      p.form = R.clamp(p.form * 0.7 + (rt - 1) * 0.3 * 10 / 9, 1, 10);
      p.morale = R.clamp(p.morale + (res[s] > 0 ? 3 : res[s] < 0 ? -3 : 0), 0, 100);
      if (countsForStats) {
        p.stats.apps++; p.stats.rsum += rt; p.stats.goals += m.goals[pid] || 0; p.stats.assists += m.assists[pid] || 0;
        p.stats.saves = (p.stats.saves || 0) + (m.saves[pid] || 0);
        p.career.apps++; p.career.goals += m.goals[pid] || 0; p.career.assists += m.assists[pid] || 0;
      } else if (m.comp !== 'friendly') {
        p.stats.cupGoals = (p.stats.cupGoals || 0) + (m.goals[pid] || 0);
      }
      if (m.comp === 'friendly') { if (m.injured[pid]) { p.inj = m.injured[pid]; p.inj.weeks = Math.min(p.inj.weeks, 3); p.inj.total = p.inj.weeks; } return; } // Testspiel: keine Sperren
      if (m.twoMins[pid]) p.stats.yc += m.twoMins[pid]; // Zeitstrafen
      if (m.sentOff[pid]) { p.stats.rc++; if (m.redDirect[pid]) p.susp = Math.max(p.susp, R.chance(0.7) ? 1 : 2); } // Rote Karte mit Bericht → Sperre
      if (m.injured[pid]) { p.inj = m.injured[pid]; p.stats.injuries = (p.stats.injuries || 0) + 1; }
    });
    // Unbenutzte Kaderspieler verlieren leicht Moral (Spielpraxis)
    [0, 1].forEach(function (s) {
      var club = st.clubs[m.clubs[s]];
      club.form = (club.form || []).concat([res[s] > 0 ? 'S' : res[s] < 0 ? 'N' : 'U']).slice(-6);
      W.squad(st, club.id).forEach(function (p) { if (m.played[p.id] == null && p.ovr > 50 && p.morale > 30) p.morale -= 0.6; });
      club.trainingBonus = 0;
    });
    // Bester Spieler
    var best = null, bv = -1;
    Object.keys(m.rating).forEach(function (pid) { if (m.rating[pid] > bv) { bv = m.rating[pid]; best = pid; } });
    m.motm = best;
    m.st = null; // Referenz lösen für Speicherung
    return m;
  };

  // Kompaktes Ergebnisobjekt für Spielpläne / Speicherung. Tore werden je Spieler zusammengefasst (sc),
  // einzelne Ereignisse nur für Rote Karten und Verletzungen gespeichert.
  M.summary = function (m) {
    var sc = Object.keys(m.goals).map(function (pid) { return [pid, m.goals[pid], m.played[pid]]; }).sort(function (a, b) { return b[1] - a[1]; });
    return {
      hg: m.score[0], ag: m.score[1], pens: m.pens, poss: m.stats.poss, shots: m.stats.shots, onT: m.stats.onTarget,
      ev: m.events.filter(function (e) { return e.type === 'red' || e.type === 'injury'; })
        .map(function (e) { return { m: e.min, t: e.type, s: e.side, p: e.pid, a: e.pid2 }; }),
      sc: sc, motm: m.motm, att: m.attendance || 0
    };
  };
})(RFM);
