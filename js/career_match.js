// Interaktive Spielsituationen der Spielerkarriere (ohne 3D-Grafik). Die bestehende Spielberechnung läuft Minute für
// Minute weiter; an geplanten Momenten entscheidet der Spieler. Jede Szene ersetzt eine reguläre Chance der Simulation
// (m.pcSkip), Tore, Paraden, Karten, Verletzungen und Noten werden direkt im Spielobjekt verbucht – dadurch bleiben
// Endergebnis, Statistiken und Bewertungen konsistent. Keine Entscheidung garantiert Erfolg.
(function (R) {
  var D = R.data, W = R.world, M = R.match, C = R.pc, X = R.cx;
  var CM = R.cm = {};
  var HB = X.HB, clamp = X.clamp;
  CM.MODES = { schnell: { n: 'Schnell', d: 'Nur entscheidende Spielsituationen.' }, standard: { n: 'Standard', d: 'Etwa 3–5 Situationen pro Spiel.' }, intensiv: { n: 'Intensiv', d: 'Etwa 6–10 Situationen pro Spiel.' }, aus: { n: 'Nur Ergebnis', d: 'Keine interaktiven Spiele – die Simulation entscheidet.' } };
  var FULL = HB ? (M.FULL || 60) : 90;
  CM.CAL = HB ? 1 : 0.78;

  // ---------- Spiel-API (sportartneutral) ----------
  var A = CM.A = {};
  function nm(p) { return p ? p.last : 'Unbekannt'; }
  A.ev = function (m, type, side, text, pid, pid2, extra) { var e = { min: m.minute, type: type, side: side, text: text, pid: pid || null, pid2: pid2 || null, pc: true }; if (extra) for (var k in extra) e[k] = extra[k]; m.events.push(e); return e; };
  A.rate = function (m, pid, d) { if (pid && m.rating[pid] != null) m.rating[pid] = clamp(m.rating[pid] + d, 1, 10); };
  A.fit = function (m, pid, d) { if (m.fit[pid] != null) m.fit[pid] = clamp(m.fit[pid] + d, 20, 100); };
  A.mot = function (m, s, d) { m.mot[s] = clamp((m.mot[s] || 0) + d, -0.08, 0.08); };
  A.on = function (m, s, pid) { return m.onPitch[s].indexOf(pid) >= 0; };
  A.gk = function (m, s) { var st = m.st; for (var i = 0; i < m.onPitch[s].length; i++) { var p = m.onPitch[s][i] && st.players[m.onPitch[s][i]]; if (p && p.pos === 'TW') return p; } return null; };
  A.mates = function (m, s, exclId) { var st = m.st; return m.onPitch[s].filter(function (id) { return id && id !== exclId; }).map(function (id) { return st.players[id]; }).filter(function (p) { return p && p.pos !== 'TW'; }); };
  A.mate = function (m, s, exclId, key) { var ms = A.mates(m, s, exclId); if (!ms.length) return null; return R.weighted(ms, function (p) { return Math.pow(p.attr[key || 'sho'], 1.6); }); };
  A.cond = function (m, p) { var fit = m.fit[p.id] != null ? m.fit[p.id] : p.fitness; return (0.72 + 0.28 * fit / 100) * (0.94 + 0.08 * (p.morale || 60) / 100) * (0.97 + 0.06 * (p.form || 6) / 10); };
  A.def = function (m, s) { var ms = m.onPitch[s].map(function (id) { return id && m.st.players[id]; }).filter(Boolean); return ms.length ? R.avg(ms, function (p) { return p.attr.def; }) : 50; };
  A.goal = function (m, s, sh, as, kind, text) {
    var o = 1 - s, st = m.st, gk = A.gk(m, o);
    m.score[s]++; m.stats.onTarget[s]++;
    m.goals[sh.id] = (m.goals[sh.id] || 0) + 1; A.rate(m, sh.id, HB ? (kind === 'seven' ? 0.22 : 0.32) : 1.0);
    if (as) { m.assists[as.id] = (m.assists[as.id] || 0) + 1; A.rate(m, as.id, HB ? 0.15 : 0.6); }
    if (gk) { A.rate(m, gk.id, HB ? -0.07 : -0.3); if (HB) m.faced[gk.id] = (m.faced[gk.id] || 0) + 1; }
    if (HB) { if (kind === 'seven') m.stats.sevenGoals[s]++; m.run[s]++; m.run[o] = 0; m.ball = o; }
    A.ev(m, 'goal', s, (text || 'TOR! ' + nm(sh) + ' trifft!') + (as ? (HB ? ' Zuspiel: ' : ' Vorlage: ') + nm(as) + '.' : '') + ' ' + m.score[0] + ':' + m.score[1], sh.id, as ? as.id : null, { pen: kind === 'pen' || kind === 'seven', score: m.score.slice(), kind: kind });
    return 'goal';
  };
  A.save = function (m, s, sh, text) {
    var o = 1 - s, gk = A.gk(m, o); m.stats.onTarget[s]++;
    if (gk) { A.rate(m, gk.id, HB ? 0.16 : 0.25); if (HB) { m.stats.saves[o]++; m.saves[gk.id] = (m.saves[gk.id] || 0) + 1; m.faced[gk.id] = (m.faced[gk.id] || 0) + 1; } }
    A.rate(m, sh.id, HB ? -0.08 : -0.1); if (HB) m.ball = o;
    A.ev(m, 'save', s, text || ('Parade von ' + nm(gk) + '!'), sh.id, gk ? gk.id : null); return 'save';
  };
  A.miss = function (m, s, sh, text) { A.rate(m, sh.id, HB ? -0.12 : -0.15); if (HB) m.ball = 1 - s; A.ev(m, 'miss', s, text || (nm(sh) + ' verfehlt das Ziel.'), sh.id); return 'miss'; };
  // Abschluss: Wahrscheinlichkeit aus Fähigkeiten, Zustand, Torwart, Psyche; Ergebnis Tor/Parade/vorbei
  A.shot = function (m, x, sh, base, keys, kind, txt) {
    if (!sh) return 'none';
    var s = x.s, o = 1 - s, gk = A.gk(m, o);
    var q = 0; keys.forEach(function (k) { q += sh.attr[k[0]] * k[1]; });
    var gq = gk ? gk.attr.gk * A.cond(m, gk) : 25;
    var p = base + (q * A.cond(m, sh) - gq) / (HB ? 220 : 260) + (sh.id === x.p.id ? A.psy(x) : 0);
    if (m.pc && sh.id === m.pc.pid) p *= CM.CAL; // Kalibrierung: Szenen sollen im Mittel so viele Tore bringen wie die reine Simulation
    p = clamp(p, 0.04, 0.92);
    if (kind === 'pen' || kind === 'seven') p = A.penP(sh, gk, A.cond(m, sh), gk ? A.cond(m, gk) : 1, sh.id === x.p.id ? A.psy(x) * 1.5 : 0); // Strafwurf: reale Quoten (Fußball ~78 %, Handball ~76 %)
    m.stats.shots[s]++; m.stats.chances[s]++;
    x.lastP = p;
    if (m.pc && sh.id === m.pc.pid) { m.pcOwn = m.pcOwn || [0, 0]; m.pcOwn[s]++; }
    if (R.rand() < p) return A.goal(m, s, sh, txt && txt.as || null, kind, txt && txt.g);
    if (gk && R.rand() < (HB ? 0.72 : 0.55)) return A.save(m, s, sh, txt && txt.s);
    return A.miss(m, s, sh, txt && txt.m);
  };
  // Verwandlungsquote Elfmeter/7-Meter: Grundwert, Schützenqualität, Torwart, Ermüdung, Nerven – Spanne etwa 55–95 %
  A.penP = function (sh, gk, cS, cG, nerve) { var q = sh.attr.sho * 0.75 + sh.attr.tec * 0.25, g = gk ? gk.attr.gk * (cG || 1) : 40;
    return clamp((HB ? 0.76 : 0.78) + (q - 65) / (HB ? 260 : 250) - (g - 65) / (HB ? 450 : 500) - (1 - (cS || 1)) * 0.25 + (nerve || 0), HB ? 0.5 : 0.55, 0.95); };
  A.psy = function (x) { var cx = x.cx; return (cx.per.conf - 55) / 450 - Math.max(0, cx.per.stress - 50) / 600 + (x.pc.trust - 50) / 1500 + ((x.club && x.club.chemistry || 50) - 50) / 2500; };
  A.yellow = function (m, s, p, text) {
    if (HB) { var idx = m.onPitch[s].indexOf(p.id); if (idx < 0) return; m.onPitch[s][idx] = null; m.twoMins[p.id] = (m.twoMins[p.id] || 0) + 1; m.stats.twoMin[s]++; A.rate(m, p.id, -0.35); var third = m.twoMins[p.id] >= 3; m.susp2[s].push({ pid: p.id, idx: idx, until: m.minute + 2, out: third }); if (third) { m.sentOff[p.id] = true; A.ev(m, 'red', s, 'Dritte Zeitstrafe – ' + nm(p) + ' ist disqualifiziert!', p.id); } else A.ev(m, 'yellow', s, text || ('Zwei Minuten für ' + nm(p) + '!'), p.id, null, { twomin: true }); return; }
    m.yellows[p.id] = (m.yellows[p.id] || 0) + 1; A.rate(m, p.id, -0.3);
    if (m.yellows[p.id] >= 2) A.red(m, s, p, 'Gelb-Rot für ' + nm(p) + '!'); else A.ev(m, 'yellow', s, text || ('Gelb für ' + nm(p) + '.'), p.id);
  };
  A.red = function (m, s, p, text) {
    var idx = m.onPitch[s].indexOf(p.id); if (idx >= 0) m.onPitch[s][idx] = null; m.sentOff[p.id] = true; A.rate(m, p.id, HB ? -1.2 : -1.5);
    if (HB) { m.redDirect[p.id] = true; m.stats.twoMin[s]++; if (idx >= 0) m.susp2[s].push({ pid: p.id, idx: idx, until: m.minute + 2, out: true }); }
    A.ev(m, 'red', s, text || ('Rot für ' + nm(p) + '!'), p.id);
  };
  A.subOff = function (m, s, p, forced) {
    var st = m.st, idx = m.onPitch[s].indexOf(p.id); if (idx < 0) return false;
    var cands = m.bench[s].map(function (id) { return st.players[id]; }).filter(function (q) { return q && !m.sentOff[q.id] && !m.injured[q.id] && (q.pos === 'TW') === (p.pos === 'TW'); });
    if (!cands.length || m.subsLeft[s] <= 0) { if (forced) m.onPitch[s][idx] = null; return false; }
    cands.sort(function (a, b) { return b.ovr - a.ovr; });
    return M.substitute(m, s, p.id, cands[0].id);
  };
  A.injure = function (m, s, p, text) { var st = m.st, med = D.facilities.medizin.levels[st.clubs[m.clubs[s]].fac.medizin || 1].q; m.injured[p.id] = M.rollInjury(st, p, med); A.ev(m, 'injury', s, (text || (nm(p) + ' verletzt sich.')) + ' Diagnose: ' + m.injured[p.id].type + '.', p.id); A.subOff(m, s, p, true); };
  A.oppAttack = function (m, x, base) { // gefährlicher Gegenangriff (ersetzt eine Chance des Gegners)
    var o = 1 - x.s, sh = A.mate(m, o, null, 'sho'); if (!sh) return 'none';
    var r = A.shot(m, { s: o, p: { id: -1 }, cx: x.cx, pc: x.pc }, sh, base, [['sho', 0.7], ['tec', 0.3]], 'open', { g: 'Gegentor! ' + nm(sh) + ' nutzt die Lücke.' });
    return r;
  };
  A.skip = function (m, s, n) { m.pcSkip = m.pcSkip || [0, 0]; m.pcSkip[s] += n == null ? 1 : n; };

  // ---------- Kontext ----------
  CM.ctx = function (m) {
    var st = m.st, pc = st.pc, p = C.player(st), s = m.ntSide != null ? m.ntSide : m.played[p.id] != null ? m.played[p.id] : (m.clubs[0] === p.clubId ? 0 : 1);
    return { st: st, m: m, s: s, o: 1 - s, p: p, pc: pc, cx: pc.cx, min: m.minute, diff: m.score[s] - m.score[1 - s], on: A.on(m, s, p.id), bench: m.bench[s].indexOf(p.id) >= 0, gk: A.gk(m, 1 - s), club: st.clubs[m.clubs[s]], opp: st.clubs[m.clubs[1 - s]], fit: m.fit[p.id] != null ? m.fit[p.id] : p.fitness, late: m.minute >= FULL - (HB ? 6 : 10), isGK: p.pos === 'TW', sp: !!X.mem(st, 'setPieces') };
  };
  function att(x) { return x.on && !x.isGK; }
  // Situationsprüfungen: Szenen dürfen nur behaupten, was im Spiel wirklich passiert (ist)
  function freshGoal(x) { var m = x.m, ev = null; for (var i = m.events.length - 1; i >= 0; i--) { if (m.events[i].type === 'goal') { ev = m.events[i]; break; } } return !!(ev && ev.pid === x.p.id && ev.side === x.s && m.minute - (ev.min || 0) <= 2 && m.pc.celeb !== i); }
  function canOff(x) { var m = x.m, s = x.s; return m.subsLeft[s] > 0 && m.bench[s].some(function (id) { var q = m.st.players[id]; return q && !m.sentOff[id] && !m.injured[id] && (q.pos === 'TW') === (x.p.pos === 'TW'); }); }
  function canOn(x) { var m = x.m, s = x.s; return m.subsLeft[s] > 0 && m.onPitch[s].some(function (id) { var q = id && m.st.players[id]; return q && q.pos === x.p.pos; }); }
  function offOrStay(m, x, txt) { if (A.subOff(m, x.s, x.p)) return 'sub'; A.ev(m, 'info', x.s, txt || ('Kein Wechsel mehr möglich – ' + nm(x.p) + ' bleibt auf dem Feld.'), x.p.id); return 'ok'; }
  function gkOn(x) { return x.on && x.isGK; }

  // ---------- Fußball ----------
  var FB = [
    { id: 'fb_pen', key: true, w: 1, when: att, t: function (x) { return 'Elfmeter für ' + x.club.short + '! ' + (x.sp ? 'Du bist der etatmäßige Schütze.' : 'Der Ball liegt da – nimmst du ihn dir?'); },
      o: [{ l: 'Selbst schießen', fx: function (m, x) { A.skip(m, x.s); var r = A.shot(m, x, x.p, 0.66, [['sho', 0.8], ['tec', 0.2]], 'pen', { g: 'Elfmeter verwandelt! ' + nm(x.p) + ' bleibt eiskalt.', s: 'Gehalten! Der Torwart ahnt die Ecke.', m: nm(x.p) + ' setzt den Elfmeter neben das Tor!' }); X.mem(x.st, 'pensTaken', 1); if (r !== 'goal' && !x.sp) X.eff(x.st, { mates: -2 }); return r; } },
        { l: 'Einem Mitspieler überlassen', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); var r = A.shot(m, x, mt, 0.66, [['sho', 0.8], ['tec', 0.2]], 'pen', { g: 'Elfmeter verwandelt von ' + nm(mt) + '.' }); X.eff(x.st, { mates: 2, team: 1 }); return r; } }] },
    { id: 'fb_1v1', key: true, w: 1.3, when: att, t: function (x) { return 'Du bist durch! Nur noch der Torwart vor dir – rechts läuft ein Mitspieler völlig frei mit.'; },
      o: [{ l: 'Alleingang', hint: 'riskant', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.34, [['sho', 0.5], ['tec', 0.3], ['spd', 0.2]], 'open', { g: 'TOR! ' + nm(x.p) + ' umkurvt den Torwart!' }); } },
        { l: 'Querpass', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); if (R.rand() < clamp(0.55 + (x.p.attr.pas - 60) / 200, 0.3, 0.85)) return A.shot(m, x, mt, 0.5, [['sho', 0.7], ['tec', 0.3]], 'open', { as: x.p }); A.ev(m, 'miss', x.s, 'Der Querpass von ' + nm(x.p) + ' wird abgefangen.', x.p.id); A.rate(m, x.p.id, -0.1); return 'lost'; } }] },
    { id: 'fb_freekick', w: 1, when: att, t: function () { return 'Freistoß, 22 Meter, halblinks. Die Mauer steht.'; },
      o: [{ l: 'Direkt aufs Tor', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.1, [['sho', 0.6], ['tec', 0.4]], 'fk', { g: 'Freistoß-Tor! ' + nm(x.p) + ' zirkelt ihn in den Winkel!' }); } },
        { l: 'Flanke in den Strafraum', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'def'); return A.shot(m, x, mt, 0.14, [['sho', 0.4], ['def', 0.3], ['sta', 0.3]], 'head', { as: x.p, g: 'Kopfballtor durch ' + nm(mt) + '!' }); } },
        { l: 'Kurz ausführen', fx: function (m, x) { A.rate(m, x.p.id, 0.05); return 'safe'; } }] },
    { id: 'fb_tired', w: 1, when: function (x) { return x.on && x.fit < 62 && x.min > 55; }, t: function (x) { return 'Deine Beine sind schwer (Frische ' + Math.round(x.fit) + '). Der Trainer schaut fragend herüber.'; },
      o: [{ l: 'Weiterspielen', hint: 'Verletzungsrisiko', fx: function (m, x) { if (R.chance(0.08 + (60 - x.fit) / 200)) { A.injure(m, x.s, x.p, nm(x.p) + ' greift sich an den Oberschenkel.'); return 'injury'; } X.eff(x.st, { coach: 1 }); A.fit(m, x.p.id, -2); return 'ok'; } },
        { l: 'Auswechslung anbieten', fx: function (m, x) { X.eff(x.st, { coach: 1 }); return offOrStay(m, x, 'Der Trainer hat keinen Wechsel mehr – ' + nm(x.p) + ' muss durchhalten.'); } }] },
    { id: 'fb_subbed', w: 0.8, when: function (x) { return x.on && x.min >= 60 && x.min <= 80 && m_rating(x) < 6.4 && !x.m.pc.used.fb_bench && canOff(x); }, t: function () { return 'Die Tafel geht hoch – deine Nummer. Du wirst ausgewechselt.'; },
      o: [{ l: 'Akzeptieren, abklatschen', fx: function (m, x) { A.subOff(m, x.s, x.p); X.eff(x.st, { coach: 2, mates: 1 }); return 'sub'; } },
        { l: 'Unzufriedenheit zeigen', hint: 'Trainer verärgert', fx: function (m, x) { A.subOff(m, x.s, x.p); X.mem(x.st, 'subProtest', 1); X.eff(x.st, { coach: -6, fame: 0.5 }); return 'sub'; } }] },
    { id: 'fb_provoke', w: 0.9, when: function (x) { return x.on; }, t: function () { return 'Dein Gegenspieler provoziert dich seit Minuten mit Sprüchen und kleinen Fouls.'; },
      o: [{ l: 'Ignorieren', fx: function (m, x) { X.eff(x.st, { disc: 1 }); return 'ok'; } }, { l: 'Zurückgeben', hint: 'Kartenrisiko', fx: function (m, x) { if (R.chance(0.35 - x.cx.per.disc / 400)) { A.yellow(m, x.s, x.p); return 'card'; } A.mot(m, x.s, 0.01); return 'ok'; } }, { l: 'Schiedsrichter ansprechen', fx: function (m, x) { if (R.chance(0.4)) { var op = A.mate(m, x.o, null, 'def'); if (op) A.yellow(m, x.o, op, 'Gelb für ' + nm(op) + ' nach wiederholtem Foulspiel.'); return 'ok'; } return 'ok'; } }] },
    { id: 'fb_ref', w: 0.8, when: function (x) { return x.on; }, t: function () { return 'Der Schiedsrichter gibt einen umstrittenen Freistoß gegen euch.'; },
      o: [{ l: 'Protestieren', fx: function (m, x) { if (R.chance(0.3)) { A.yellow(m, x.s, x.p, 'Gelb wegen Meckerns für ' + nm(x.p) + '.'); return 'card'; } return 'ok'; } }, { l: 'Akzeptieren, weiter', fx: function (m, x) { X.eff(x.st, { disc: 1 }); return 'ok'; } }] },
    { id: 'fb_tactic', w: 1, when: att, t: function () { return 'Der Trainer will, dass du dich an der Mittellinie hältst. Du siehst aber Räume nach vorne.'; },
      o: [{ l: 'Vorgabe befolgen', fx: function (m, x) { X.eff(x.st, { coach: 2 }); A.rate(m, x.p.id, 0.05); return 'ok'; } }, { l: 'Eigeninitiative', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.5)) return A.shot(m, x, x.p, 0.22, [['sho', 0.6], ['tec', 0.4]], 'open'); X.eff(x.st, { coach: -3 }); return A.oppAttack(m, x, 0.2); } }] },
    { id: 'fb_error', w: 0.7, when: function (x) { return x.on && m_rating(x) < 6; }, t: function () { return 'Dein Fehlpass hat fast ein Gegentor eingeleitet. Wie spielst du weiter?'; },
      o: [{ l: 'Sicher, einfache Bälle', fx: function (m, x) { errEv(m, x); A.rate(m, x.p.id, 0.05); X.eff(x.st, { conf: -1 }); return 'ok'; } }, { l: 'Jetzt erst recht – riskant', fx: function (m, x) { errEv(m, x); if (R.rand() < 0.45 + A.psy(x)) { A.rate(m, x.p.id, 0.3); X.eff(x.st, { conf: 2 }); return 'ok'; } A.rate(m, x.p.id, -0.3); return A.oppAttack(m, x, 0.18); } }] },
    { id: 'fb_behind', key: true, w: 1, when: function (x) { return x.on && x.diff < 0 && x.min >= 60; }, t: function () { return 'Rückstand, die Zeit läuft. Stürmst du mit nach vorne?'; },
      o: [{ l: 'Offensiver agieren', fx: function (m, x) { A.mot(m, x.s, 0.02); A.skip(m, x.s); if (R.chance(0.55)) return A.shot(m, x, x.p, 0.22, [['sho', 0.6], ['tec', 0.4]], 'open'); return A.oppAttack(m, x, 0.18); } }, { l: 'Ordnung halten', fx: function (m, x) { X.eff(x.st, { coach: 1 }); return 'ok'; } }] },
    { id: 'fb_injured_mate', w: 0.6, when: function (x) { return x.on; }, t: function () { return 'Ein Mitspieler liegt nach einem Zweikampf am Boden. Du hast den Ball.'; },
      o: [{ l: 'Ball ins Aus spielen', fx: function (m, x) { X.eff(x.st, { mates: 3, fans: 1 }); return 'ok'; } }, { l: 'Weiterspielen', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.4)) { var r = A.shot(m, x, x.p, 0.25, [['sho', 0.7], ['tec', 0.3]], 'open'); X.eff(x.st, { mates: -3, press: -2 }); return r; } X.eff(x.st, { mates: -3 }); return 'ok'; } }] },
    { id: 'fb_header', w: 1, when: att, t: function () { return 'Ecke! Du läufst in den Fünfmeterraum, der Ball kommt.'; },
      o: [{ l: 'Kopfball aufs Tor', fx: function (m, x) { A.skip(m, x.s); m.stats.corners[x.s]++; return A.shot(m, x, x.p, 0.18, [['sho', 0.4], ['def', 0.3], ['sta', 0.3]], 'head', { g: 'Kopfballtor! ' + nm(x.p) + ' steigt am höchsten!' }); } }, { l: 'Ablegen', fx: function (m, x) { A.skip(m, x.s); m.stats.corners[x.s]++; var mt = A.mate(m, x.s, x.p.id, 'sho'); return A.shot(m, x, mt, 0.2, [['sho', 0.7], ['tec', 0.3]], 'open', { as: x.p }); } }] },
    { id: 'fb_longshot', w: 0.9, when: att, t: function () { return 'Der Ball springt dir 25 Meter vor dem Tor vor die Füße. Niemand greift an.'; },
      o: [{ l: 'Abziehen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.04, [['sho', 0.8], ['tec', 0.2]], 'long', { g: 'Wahnsinn! ' + nm(x.p) + ' trifft aus der Distanz!' }); } }, { l: 'Weiterspielen', fx: function (m, x) { A.rate(m, x.p.id, 0.05); return 'ok'; } }] },
    { id: 'fb_dribble', w: 0.9, when: att, t: function () { return 'Zwei Gegenspieler vor dir, dahinter freier Raum.'; },
      o: [{ l: 'Dribbling', fx: function (m, x) { if (R.rand() < clamp(0.35 + (x.p.attr.tec + x.p.attr.spd - 2 * A.def(m, x.o)) / 200 + A.psy(x), 0.1, 0.8)) { A.skip(m, x.s); A.rate(m, x.p.id, 0.2); return A.shot(m, x, x.p, 0.25, [['sho', 0.6], ['tec', 0.4]], 'open', { g: 'Was für ein Solo! ' + nm(x.p) + ' trifft!' }); } A.rate(m, x.p.id, -0.15); return 'lost'; } }, { l: 'Abspielen', fx: function (m, x) { A.rate(m, x.p.id, 0.05); return 'ok'; } }] },
    { id: 'fb_counter', w: 1, when: att, t: function () { return 'Ballgewinn! Drei gegen zwei im Konter.'; },
      o: [{ l: 'Tempo, selbst abschließen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.3, [['sho', 0.5], ['spd', 0.3], ['tec', 0.2]], 'open'); } }, { l: 'Ausspielen', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); return A.shot(m, x, mt, 0.3, [['sho', 0.7], ['tec', 0.3]], 'open', { as: x.p }); } }, { l: 'Absichern', fx: function (m, x) { X.eff(x.st, { coach: 1 }); return 'ok'; } }] },
    { id: 'fb_lastmin', key: true, w: 1.2, when: function (x) { return x.on && x.late && x.diff === 1; }, t: function (x) { return (x.min >= 90 ? 'Nachspielzeit' : 'Schlussphase, ' + x.min + '. Minute') + ' – ihr führt knapp. Du hast den Ball an der Eckfahne.'; },
      o: [{ l: 'Zeit spielen', fx: function (m, x) { A.skip(m, x.o); A.rate(m, x.p.id, 0.1); return 'ok'; } }, { l: 'Auf das Tor gehen', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.5)) return A.shot(m, x, x.p, 0.22, [['sho', 0.6], ['tec', 0.4]], 'open'); return A.oppAttack(m, x, 0.2); } }] },
    { id: 'fb_tackle', key: true, w: 1, when: function (x) { return x.on && !x.isGK && (x.p.pos === 'ABW' || x.p.pos === 'MIT'); }, t: function () { return 'Konter des Gegners! Du bist der letzte Mann, der Stürmer zieht an dir vorbei.'; },
      o: [{ l: 'Notbremse', hint: 'Rot möglich', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.45)) { A.red(m, x.s, x.p, 'Notbremse! Rot für ' + nm(x.p) + '.'); return 'red'; } A.yellow(m, x.s, x.p, 'Taktisches Foul – Gelb für ' + nm(x.p) + '.'); return 'card'; } }, { l: 'Sauber nachsetzen', fx: function (m, x) { A.skip(m, x.o); if (R.rand() < clamp(0.4 + (x.p.attr.def + x.p.attr.spd - 120) / 200, 0.15, 0.75)) { A.rate(m, x.p.id, 0.3); A.ev(m, 'info', x.s, 'Starke Grätsche von ' + nm(x.p) + '!', x.p.id); return 'ok'; } return A.oppAttack(m, x, 0.35); } }, { l: 'Laufen lassen, Torwart vertrauen', fx: function (m, x) { A.skip(m, x.o); return A.oppAttack(m, x, 0.32); } }] },
    { id: 'fb_dive', w: 0.45, when: att, t: function () { return 'Im Strafraum spürst du eine leichte Berührung.'; },
      o: [{ l: 'Fallen lassen', hint: 'Elfmeter oder Gelb', fx: function (m, x) { A.skip(m, x.s); var pen = clamp(0.28 + (x.p.attr.tec - 60) / 300, 0.2, 0.4);
          if (R.chance(pen)) { A.ev(m, 'info', x.s, 'Der Schiedsrichter zeigt auf den Punkt – Elfmeter nach Foul an ' + nm(x.p) + '!', x.p.id); X.eff(x.st, { press: -1 }); return A.shot(m, x, x.p, 0.74, [['sho', 0.8], ['tec', 0.2]], 'pen'); }
          if (R.chance(0.45)) { A.yellow(m, x.s, x.p, 'Schwalbe! Gelb für ' + nm(x.p) + '.'); X.eff(x.st, { press: -3 }); return 'card'; }
          A.ev(m, 'info', x.s, 'Kein Pfiff – ' + nm(x.p) + ' liegt am Boden, der Ball ist weg.', x.p.id); A.rate(m, x.p.id, -0.1); return 'ok'; } },
        { l: 'Auf den Beinen bleiben', hint: 'Abschluss, fair', fx: function (m, x) { A.skip(m, x.s); A.rate(m, x.p.id, 0.05); return A.shot(m, x, x.p, 0.2, [['sho', 0.7], ['tec', 0.3]], 'open'); } }] },
    { id: 'fb_celebrate', w: 0.6, follow: true, when: function (x) { return x.on && freshGoal(x); }, t: function (x) { return 'Dein Tor zum ' + x.m.score[0] + ':' + x.m.score[1] + '! ' + (x.s === 1 ? 'Die gegnerische Kurve hat dich die ganze Zeit ausgepfiffen.' : 'Das Stadion bebt – wohin läufst du?'); },
      o: [{ l: 'Jubel vor der Gegnerkurve', req: function (x) { return x.s === 1; }, hint: 'Kartenrisiko', fx: function (m, x) { if (R.chance(0.35)) { A.yellow(m, x.s, x.p, 'Gelb für provokanten Torjubel.'); X.eff(x.st, { fans: 3, press: -2 }); return 'card'; } X.eff(x.st, { fans: 3, press: -2 }); return 'ok'; } }, { l: 'Ab in die Fankurve', req: function (x) { return x.s === 0; }, fx: function (m, x) { X.eff(x.st, { fans: 3 }); return 'ok'; } }, { l: 'Zum Trainer laufen', fx: function (m, x) { X.eff(x.st, { coach: 3, mates: 1 }); return 'ok'; } }] },
    { id: 'fb_cross', w: 0.9, when: att, t: function () { return 'Du bist auf dem Flügel durch. Flanke oder selbst nach innen?'; },
      o: [{ l: 'Flanken', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); return A.shot(m, x, mt, 0.18, [['sho', 0.6], ['def', 0.2], ['sta', 0.2]], 'head', { as: x.p }); } }, { l: 'Nach innen ziehen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.16, [['sho', 0.6], ['tec', 0.4]], 'open'); } }] },
    { id: 'fb_volley', w: 0.7, when: att, t: function () { return 'Der Ball fällt dir nach einer abgewehrten Ecke perfekt auf den Fuß.'; },
      o: [{ l: 'Volley!', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.12, [['sho', 0.5], ['tec', 0.5]], 'volley', { g: 'Traumtor per Volley von ' + nm(x.p) + '!' }); } }, { l: 'Erst annehmen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.15, [['sho', 0.7], ['tec', 0.3]], 'open'); } }] },
    { id: 'fb_gk_pen', key: true, w: 1, when: gkOn, t: function () { return 'Elfmeter gegen euch. Der Schütze legt sich den Ball zurecht.'; },
      o: [{ l: 'Nach links', fx: function (m, x) { return gkPen(m, x, 0); } }, { l: 'Nach rechts', fx: function (m, x) { return gkPen(m, x, 1); } }, { l: 'Stehen bleiben', fx: function (m, x) { return gkPen(m, x, 2); } }] },
    { id: 'fb_gk_out', w: 1, when: gkOn, t: function () { return 'Steilpass hinter die Abwehr. Der Stürmer läuft allein auf dich zu.'; },
      o: [{ l: 'Herauslaufen', fx: function (m, x) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'sho'); if (R.rand() < clamp(0.45 + (x.p.attr.gk - sh.attr.sho) / 150 + (x.p.attr.spd - 50) / 300, 0.15, 0.8)) { A.rate(m, x.p.id, 0.35); A.ev(m, 'save', x.o, nm(x.p) + ' ist vor dem Stürmer am Ball!', sh.id, x.p.id); return 'save'; } if (R.chance(0.15)) { A.red(m, x.s, x.p, 'Notbremse durch Torwart ' + nm(x.p) + ' – Rot!'); return 'red'; } return A.goal(m, x.o, sh, null, 'open', 'Tor! ' + nm(sh) + ' umkurvt den herauslaufenden Torwart.'); } },
        { l: 'Auf der Linie bleiben', fx: function (m, x) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'sho'); return A.shot(m, { s: x.o, p: { id: -1 }, cx: x.cx, pc: x.pc }, sh, 0.42, [['sho', 0.7], ['tec', 0.3]], 'open'); } }] },
    { id: 'fb_gk_dist', w: 0.6, when: gkOn, t: function () { return 'Du hast den Ball sicher. Der Gegner presst hoch.'; },
      o: [{ l: 'Langer Abschlag', fx: function (m, x) { A.rate(m, x.p.id, 0.02); return 'ok'; } }, { l: 'Flach aufbauen', fx: function (m, x) { if (R.chance(0.15)) { A.rate(m, x.p.id, -0.3); return A.oppAttack(m, x, 0.35); } A.rate(m, x.p.id, 0.1); X.eff(x.st, { coach: 1 }); return 'ok'; } }] },
    { id: 'fb_block', w: 0.9, when: function (x) { return x.on && x.p.pos === 'ABW'; }, t: function () { return 'Schussposition für den Gegner an der Strafraumgrenze.'; },
      o: [{ l: 'Ins Schussbein werfen', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.5 + (x.p.attr.def - 60) / 150)) { A.rate(m, x.p.id, 0.3); A.ev(m, 'info', x.s, nm(x.p) + ' blockt mit vollem Einsatz!', x.p.id); if (R.chance(0.05)) A.injure(m, x.s, x.p); return 'ok'; } return A.oppAttack(m, x, 0.15); } }, { l: 'Passweg zustellen', fx: function (m, x) { A.skip(m, x.o); return R.chance(0.5) ? 'ok' : A.oppAttack(m, x, 0.12); } }] },
    { id: 'fb_offside', w: 0.7, when: function (x) { return x.on && x.p.pos === 'ABW'; }, t: function () { return 'Die gegnerischen Stürmer lauern an der Abwehrkette.'; },
      o: [{ l: 'Abseitsfalle stellen', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.6)) { A.ev(m, 'info', x.s, 'Abseits! Die Falle schnappt zu.', x.p.id); A.rate(m, x.p.id, 0.15); return 'ok'; } return A.oppAttack(m, x, 0.38); } }, { l: 'Zurücklaufen', fx: function (m, x) { A.skip(m, x.o); return R.chance(0.65) ? 'ok' : A.oppAttack(m, x, 0.15); } }] },
    { id: 'fb_bench', w: 1, bench: true, when: function (x) { return x.bench && x.min >= 55 && x.m.pc.benchOK && canOn(x); }, t: function () { return 'Der Co-Trainer winkt: Mach dich warm, gleich kommst du rein.'; },
      o: [{ l: 'Intensiv aufwärmen', fx: function (m, x) { if (!subOn(m, x)) return 'ok'; A.rate(m, x.p.id, 0.1); X.eff(x.st, { coach: 1 }); return 'on'; } }, { l: 'Locker bleiben', fx: function (m, x) { return subOn(m, x) ? 'on' : 'ok'; } }] },
    { id: 'fb_heat', w: 0.5, when: function (x) { return x.on && x.fit < 75; }, t: function () { return 'Krämpfe in der Wade. Die Trinkpause steht an.'; },
      o: [{ l: 'Trinken, dehnen, weiter', fx: function (m, x) { A.fit(m, x.p.id, 4); return 'ok'; } }, { l: 'Auf die Zähne beißen', fx: function (m, x) { if (R.chance(0.12)) { A.injure(m, x.s, x.p, 'Muskelkrampf bei ' + nm(x.p) + '.'); return 'injury'; } return 'ok'; } }] },
    { id: 'fb_argue', w: 0.6, when: function (x) { return x.on; }, t: function () { return 'Ein Mitspieler schimpft lautstark, weil du ihn nicht angespielt hast.'; },
      o: [{ l: 'Entschuldigend abwinken', fx: function (m, x) { X.eff(x.st, { mates: 2 }); return 'ok'; } }, { l: 'Zurückschimpfen', fx: function (m, x) { A.mot(m, x.s, -0.01); X.eff(x.st, { mates: -3 }); return 'ok'; } }] },
    { id: 'fb_fans', w: 0.4, when: function (x) { return x.on && m_rating(x) >= 7; }, t: function () { return 'Die Fans singen deinen Namen.'; },
      o: [{ l: 'Applaudieren', fx: function (m, x) { X.eff(x.st, { fans: 3, conf: 2 }); return 'ok'; } }, { l: 'Fokussiert bleiben', fx: function (m, x) { A.rate(m, x.p.id, 0.05); return 'ok'; } }] },
    { id: 'fb_armband', w: 0.4, when: function (x) { return x.on && x.p.age >= 24 && x.cx.per.lead >= 45; }, t: function () { return 'Die Mannschaft wirkt verunsichert. Der Kapitän ruft dir zu: „Übernimm du das Kommando!“'; },
      o: [{ l: 'Kommando übernehmen', fx: function (m, x) { A.mot(m, x.s, 0.01); X.eff(x.st, { lead: 3 }); return 'ok'; } }, { l: 'Weitergeben', fx: function () { return 'ok'; } }] }
  ];
  function errEv(m, x) { A.ev(m, 'info', x.s, 'Fehlpass von ' + nm(x.p) + ' – beinahe das Gegentor.', x.p.id); }
  function m_rating(x) { return x.m.rating[x.p.id] || 6; }
  function gkPen(m, x, dir) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'sho'), sd = R.randInt(0, 2), p = clamp(0.86 + (sh.attr.sho - x.p.attr.gk) / 400, 0.65, 0.95); if (dir === sd && R.rand() < 0.38 + (x.p.attr.gk - 60) / 250) { A.rate(m, x.p.id, 0.8); m.stats.shots[x.o]++; A.save(m, x.o, sh, 'GEHALTEN! ' + nm(x.p) + ' ahnt die Ecke!'); X.eff(x.st, { conf: 4, fans: 3 }); return 'save'; } m.stats.shots[x.o]++; if (R.rand() < p) return A.goal(m, x.o, sh, null, 'pen', 'Elfmeter verwandelt von ' + nm(sh) + '.'); return A.miss(m, x.o, sh, nm(sh) + ' schießt den Elfmeter vorbei!'); }
  function subOn(m, x) { var st = m.st, s = x.s, out = m.onPitch[s].map(function (id) { return id && st.players[id]; }).filter(function (q) { return q && q.pos === x.p.pos; }).sort(function (a, b) { return (m.fit[a.id] || 0) - (m.fit[b.id] || 0); })[0]; return !!(out && m.subsLeft[s] > 0 && M.substitute(m, s, out.id, x.p.id)); }

  // ---------- Handball ----------
  var HBS = [
    { id: 'hb_seven', key: true, w: 1, when: att, t: function () { return 'Siebenmeter! Der Strich wartet.'; },
      o: [{ l: 'Selbst werfen', fx: function (m, x) { A.skip(m, x.s); var r = A.shot(m, x, x.p, 0.74, [['sho', 0.7], ['tec', 0.3]], 'seven', { g: nm(x.p) + ' verwandelt den Siebenmeter.', s: 'Siebenmeter gehalten!', m: 'Pfosten! ' + nm(x.p) + ' vergibt vom Strich.' }); X.mem(x.st, 'pensTaken', 1); return r; } }, { l: 'Dem Spezialisten überlassen', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); X.eff(x.st, { mates: 2 }); return A.shot(m, x, mt, 0.74, [['sho', 0.7], ['tec', 0.3]], 'seven'); } }] },
    { id: 'hb_back', key: true, w: 1.3, when: function (x) { return att(x) && x.p.pos === 'RUE'; }, t: function () { return 'Angriff über den Rückraum. Die Abwehr steht offensiv, am Kreis ist eine Lücke.'; },
      o: [{ l: 'Rückraumwurf', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.4, [['sho', 0.8], ['sta', 0.2]], 'back'); } }, { l: 'Durchbruch', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.2)) { A.ev(m, 'info', x.s, 'Foul an ' + nm(x.p) + ' – Siebenmeter!'); return A.shot(m, x, A.mate(m, x.s, null, 'sho'), 0.74, [['sho', 0.7], ['tec', 0.3]], 'seven'); } return A.shot(m, x, x.p, 0.48, [['tec', 0.5], ['spd', 0.3], ['sho', 0.2]], 'breakthrough'); } }, { l: 'Kreisanspiel', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'def'); if (R.rand() < 0.5 + (x.p.attr.pas - 55) / 150) return A.shot(m, x, mt, 0.6, [['sho', 0.6], ['def', 0.4]], 'pivot', { as: x.p }); A.ev(m, 'info', x.s, 'Der Pass an den Kreis wird abgefangen.'); m.stats.turnovers[x.s]++; m.ball = x.o; return 'lost'; } }] },
    { id: 'hb_timeout', w: 1, when: function (x) { return x.on && x.min > 20 && x.m.timeouts[x.s] > 0; }, t: function () { return 'Auszeit. Der Trainer zeichnet einen Spielzug auf die Taktiktafel – du hast eine andere Idee.'; },
      o: [{ l: 'Spielzug befolgen', fx: function (m, x) { teamTimeout(m, x); A.mot(m, x.s, 0.01); X.eff(x.st, { coach: 2 }); return 'ok'; } }, { l: 'Eigene Idee vorschlagen', fx: function (m, x) { teamTimeout(m, x); if (R.chance(0.5 + (x.pc.trust - 50) / 200)) { A.mot(m, x.s, 0.02); X.eff(x.st, { coach: 1, lead: 2 }); return 'ok'; } X.eff(x.st, { coach: -3 }); return 'ok'; } }] },
    { id: 'hb_last', key: true, w: 1.5, when: function (x) { return x.on && x.late && Math.abs(x.diff) <= 1 && !x.isGK; }, t: function (x) { var left = Math.max(1, FULL - x.min); return 'Schlussphase, ' + (x.diff === 0 ? 'Gleichstand' : x.diff > 0 ? 'ein Tor vorne' : 'ein Tor hinten') + ' – noch ' + (left === 1 ? 'eine Minute' : left + ' Minuten') + '. Ihr habt den Ball.'; },
      o: [{ l: 'Selbst werfen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.38, [['sho', 0.7], ['tec', 0.3]], 'back', { g: 'Mit der Schlusssirene! ' + nm(x.p) + ' trifft!' }); } }, { l: 'Einstudierter Spielzug', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); return A.shot(m, x, mt, 0.45, [['sho', 0.6], ['tec', 0.4]], 'wing', { as: x.p }); } }, { l: 'Ball halten', req: function (x) { return x.diff > 0; }, fx: function (m, x) { A.skip(m, x.s); A.skip(m, x.o); return 'ok'; } }] },
    { id: 'hb_passive', w: 1, when: att, t: function () { return 'Der Schiedsrichter hebt den Arm – Zeitspiel droht.'; },
      o: [{ l: 'Riskanter Abschluss', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.28, [['sho', 0.7], ['tec', 0.3]], 'back'); } }, { l: 'Weiter aufbauen', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.5)) { A.ev(m, 'info', x.s, 'Zeitspiel abgepfiffen – Ballverlust.'); m.stats.turnovers[x.s]++; m.ball = x.o; return 'lost'; } return A.shot(m, x, A.mate(m, x.s, null, 'sho'), 0.35, [['sho', 0.7], ['tec', 0.3]], 'back'); } }] },
    { id: 'hb_after2', w: 0.9, when: function (x) { return x.on && (x.m.twoMins[x.p.id] || 0) >= 1; }, t: function () { return 'Du hast schon eine Zeitstrafe. Der Kreisläufer drückt gegen dich.'; },
      o: [{ l: 'Defensiver agieren', fx: function (m, x) { A.skip(m, x.o); return R.chance(0.5) ? 'ok' : A.oppAttack(m, x, 0.55); } }, { l: 'Weiter aggressiv', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.35)) { A.yellow(m, x.s, x.p); return 'card'; } A.rate(m, x.p.id, 0.2); A.ev(m, 'info', x.s, 'Ballgewinn durch ' + nm(x.p) + '!'); return 'ok'; } }] },
    { id: 'hb_hurt', w: 0.8, when: function (x) { return x.on && x.fit < 70; }, t: function () { return 'Dein Knöchel schmerzt nach einem Zusammenprall. Weitermachen?'; },
      o: [{ l: 'Weiterspielen wollen', hint: 'Risiko', fx: function (m, x) { if (R.chance(0.18)) { A.injure(m, x.s, x.p); return 'injury'; } X.eff(x.st, { coach: 2, fans: 1 }); return 'ok'; } }, { l: 'Behandeln lassen', fx: function (m, x) { A.fit(m, x.p.id, 8); return offOrStay(m, x, nm(x.p) + ' wird kurz an der Seitenlinie behandelt.'); } }] },
    { id: 'hb_pos', w: 0.6, when: function (x) { return x.on && x.p.pos !== 'TW'; }, t: function () { return 'Der Trainer will dich für den Rest des Spiels auf einer anderen Position sehen.'; },
      o: [{ l: 'Akzeptieren', fx: function (m, x) { X.eff(x.st, { coach: 3 }); A.rate(m, x.p.id, -0.05); return 'ok'; } }, { l: 'Ablehnen', fx: function (m, x) { X.eff(x.st, { coach: -5 }); return 'ok'; } }] },
    { id: 'hb_provoke', w: 0.8, when: function (x) { return x.on; }, t: function () { return 'Der Gegenspieler zieht dich am Trikot und flüstert Sprüche.'; },
      o: [{ l: 'Provozieren', hint: 'Zeitstrafe möglich', fx: function (m, x) { if (R.chance(0.3)) { A.yellow(m, x.s, x.p); return 'card'; } var op = A.mate(m, x.o, null, 'def'); if (op && R.chance(0.35)) { A.yellow(m, x.o, op); return 'ok'; } return 'ok'; } }, { l: 'Deeskalieren', fx: function (m, x) { X.eff(x.st, { disc: 1 }); return 'ok'; } }] },
    { id: 'hb_over', w: 1, when: function (x) { return x.on && x.m.susp2[x.o].length > 0; }, t: function () { return 'Überzahl! Der Gegner hat einen Mann weniger.'; },
      o: [{ l: 'Schnell spielen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.5, [['sho', 0.6], ['spd', 0.4]], 'fast'); } }, { l: 'Geduldig ausspielen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, A.mate(m, x.s, x.p.id, 'sho'), 0.58, [['sho', 0.7], ['tec', 0.3]], 'wing'); } }] },
    { id: 'hb_under', w: 1, when: function (x) { return x.on && x.m.susp2[x.s].length > 0; }, t: function () { return 'Unterzahl. Wie überbrückt ihr die zwei Minuten?'; },
      o: [{ l: 'Lange Angriffe, Zeit nehmen', fx: function (m, x) { A.skip(m, x.o); return R.chance(0.55) ? 'ok' : A.oppAttack(m, x, 0.55); } }, { l: 'Siebter Feldspieler, Torwart raus', hint: 'leeres Tor', fx: function (m, x) { A.skip(m, x.s); var r = A.shot(m, x, x.p, 0.5, [['sho', 0.7], ['tec', 0.3]], 'back'); if (r !== 'goal' && R.chance(0.4)) { var sh = A.mate(m, x.o, null, 'sho'); if (sh) { m.stats.shots[x.o]++; A.goal(m, x.o, sh, null, 'open', 'Wurf ins leere Tor! ' + nm(sh) + ' trifft über das ganze Feld.'); } } return r; } }] },
    { id: 'hb_fast', w: 1.2, when: att, t: function () { return 'Ballgewinn! Tempogegenstoß, du läufst mit einem Mitspieler.'; },
      o: [{ l: 'Selbst vollenden', fx: function (m, x) { A.skip(m, x.s); m.stats.fastBreaks[x.s]++; return A.shot(m, x, x.p, 0.72, [['sho', 0.5], ['spd', 0.5]], 'fast'); } }, { l: 'Doppelpass', fx: function (m, x) { A.skip(m, x.s); m.stats.fastBreaks[x.s]++; if (R.chance(0.15)) { A.ev(m, 'info', x.s, 'Der Doppelpass misslingt.'); m.stats.turnovers[x.s]++; return 'lost'; } return A.shot(m, x, A.mate(m, x.s, x.p.id, 'spd'), 0.78, [['sho', 0.5], ['spd', 0.5]], 'fast', { as: x.p }); } }] },
    { id: 'hb_wing', w: 0.9, when: function (x) { return att(x) && x.p.pos === 'AUS'; }, t: function () { return 'Du fliegst von außen in den Kreis. Spitzer Winkel.'; },
      o: [{ l: 'Dreher', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.4, [['tec', 0.6], ['sho', 0.4]], 'wing'); } }, { l: 'Kempa-Anspiel', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'tec'); return A.shot(m, x, mt, R.chance(0.6) ? 0.55 : 0.1, [['tec', 0.6], ['sho', 0.4]], 'wing', { as: x.p, g: 'Kempa-Trick! ' + nm(mt) + ' vollendet in der Luft!' }); } }] },
    { id: 'hb_block', w: 1, when: function (x) { return x.on && !x.isGK; }, t: function () { return 'Der gegnerische Rückraumspieler setzt zum Sprungwurf an.'; },
      o: [{ l: 'Block stellen', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.35 + (x.p.attr.def - 55) / 150)) { A.rate(m, x.p.id, 0.25); A.ev(m, 'info', x.s, 'Geblockt von ' + nm(x.p) + '!'); m.ball = x.s; return 'ok'; } return A.oppAttack(m, x, 0.5); } }, { l: 'Stürmerfoul ziehen', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.35)) { A.ev(m, 'info', x.s, 'Stürmerfoul! ' + nm(x.p) + ' steht goldrichtig.'); A.rate(m, x.p.id, 0.2); m.ball = x.s; return 'ok'; } if (R.chance(0.3)) { A.yellow(m, x.s, x.p); return 'card'; } return A.oppAttack(m, x, 0.55); } }] },
    { id: 'hb_steal', w: 0.9, when: function (x) { return x.on && !x.isGK; }, t: function () { return 'Du lauerst auf einen Querpass des Gegners.'; },
      o: [{ l: 'Herausspringen', fx: function (m, x) { A.skip(m, x.o); if (R.chance(0.35 + (x.p.attr.spd - 55) / 150)) { A.ev(m, 'info', x.s, 'Ballgewinn durch ' + nm(x.p) + '!'); m.stats.turnovers[x.o]++; A.skip(m, x.s); return A.shot(m, x, x.p, 0.72, [['sho', 0.5], ['spd', 0.5]], 'fast'); } return A.oppAttack(m, x, 0.6); } }, { l: 'Position halten', fx: function (m, x) { A.skip(m, x.o); return R.chance(0.45) ? 'ok' : A.oppAttack(m, x, 0.48); } }] },
    { id: 'hb_ref', w: 0.6, when: function (x) { return x.on; }, t: function () { return 'Schrittfehler gegen dich – eine klare Fehlentscheidung.'; },
      o: [{ l: 'Lautstark protestieren', fx: function (m, x) { if (R.chance(0.3)) { A.yellow(m, x.s, x.p, 'Zwei Minuten wegen Meckerns für ' + nm(x.p) + '!'); return 'card'; } return 'ok'; } }, { l: 'Hinnehmen', fx: function (m, x) { X.eff(x.st, { disc: 1 }); return 'ok'; } }] },
    { id: 'hb_tired', w: 0.8, when: function (x) { return x.on && x.fit < 60; }, t: function () { return 'Die Luft ist raus. Ein kurzer Wechsel auf die Bank?'; },
      o: [{ l: 'Kurz raus', fx: function (m, x) { return offOrStay(m, x); } }, { l: 'Weiter', fx: function (m, x) { A.rate(m, x.p.id, -0.05); X.eff(x.st, { coach: 1 }); return 'ok'; } }] },
    { id: 'hb_empty', w: 0.8, when: function (x) { return x.on && !x.isGK && x.diff >= 1 && x.min >= 40; }, t: function () { return 'Der Gegner spielt mit dem siebten Feldspieler – das Tor ist leer. Du hast den Ball in der eigenen Hälfte.'; },
      o: [{ l: 'Aufs leere Tor werfen', fx: function (m, x) { A.skip(m, x.s); m.stats.shots[x.s]++; if (R.rand() < 0.45 + (x.p.attr.sho - 60) / 150) return A.goal(m, x.s, x.p, null, 'open', nm(x.p) + ' trifft über das ganze Feld ins leere Tor!'); return A.miss(m, x.s, x.p, 'Knapp am leeren Tor vorbei!'); } }, { l: 'Sicher aufbauen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, A.mate(m, x.s, null, 'sho'), 0.5, [['sho', 0.7], ['tec', 0.3]], 'back'); } }] },
    { id: 'hb_screen', key: true, w: 1.1, when: function (x) { return att(x) && x.p.pos === 'KRS'; }, t: function () { return 'Der Rückraum zieht an. Du kannst eine Sperre stellen.'; },
      o: [{ l: 'Sperre stellen und abrollen', fx: function (m, x) { A.skip(m, x.s); if (R.rand() < 0.55 + (x.p.attr.tec - 55) / 160) return A.shot(m, x, x.p, 0.56, [['sho', 0.5], ['def', 0.3], ['tec', 0.2]], 'pivot'); A.ev(m, 'info', x.s, 'Der Ball an den abrollenden ' + nm(x.p) + ' wird abgefangen.'); m.stats.turnovers[x.s]++; m.ball = x.o; return 'lost'; } },
        { l: 'Sperre halten – Wurf für den Rückraum', fx: function (m, x) { A.skip(m, x.s); var mt = A.mate(m, x.s, x.p.id, 'sho'); return A.shot(m, x, mt, 0.46, [['sho', 0.8], ['sta', 0.2]], 'back', { as: x.p }); } },
        { l: 'Sperre lösen und am Kreis anbieten', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.5, [['sho', 0.6], ['def', 0.4]], 'pivot'); } }] },
    { id: 'hb_pivot', w: 1, when: function (x) { return att(x) && x.p.pos === 'KRS'; }, t: function () { return 'Du bekommst den Ball am Kreis, ein Abwehrspieler hängt an dir.'; },
      o: [{ l: 'Drehen und werfen', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.58, [['sho', 0.5], ['def', 0.3], ['tec', 0.2]], 'pivot'); } }, { l: 'Siebenmeter herausholen', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.5)) { var op = A.mate(m, x.o, null, 'def'); if (op && R.chance(0.4)) A.yellow(m, x.o, op); return A.shot(m, x, A.mate(m, x.s, null, 'sho'), 0.74, [['sho', 0.7], ['tec', 0.3]], 'seven'); } A.ev(m, 'info', x.s, 'Kein Pfiff. Ballverlust.'); m.ball = x.o; return 'lost'; } }] },
    { id: 'hb_gk_seven', key: true, w: 1, when: gkOn, t: function () { return 'Siebenmeter gegen euch. Der Schütze fixiert dich.'; },
      o: [{ l: 'Früh bewegen', fx: function (m, x) { return gk7(m, x, 0.3); } }, { l: 'Stehen bleiben', fx: function (m, x) { return gk7(m, x, 0.22); } }, { l: 'Schütze anstarren, spät reagieren', fx: function (m, x) { return gk7(m, x, 0.26 + (x.cx.per.conf - 55) / 300); } }] },
    { id: 'hb_gk_fast', w: 0.8, when: gkOn, t: function () { return 'Du fängst einen verunglückten Pass ab – der Linksaußen sprintet schon los.'; },
      o: [{ l: 'Langer Pass', fx: function (m, x) { A.skip(m, x.s); if (R.chance(0.65)) return A.shot(m, x, A.mate(m, x.s, null, 'spd'), 0.75, [['sho', 0.5], ['spd', 0.5]], 'fast', { as: x.p }); A.ev(m, 'info', x.s, 'Der lange Pass landet beim Gegner.'); return 'lost'; } }, { l: 'Kurz zur schnellen Mitte', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, A.mate(m, x.s, null, 'sho'), 0.45, [['sho', 0.7], ['tec', 0.3]], 'back'); } }] },
    { id: 'hb_gk_wing', w: 0.8, when: gkOn, t: function () { return 'Der Außen fliegt in den Kreis.'; },
      o: [{ l: 'Kurzes Eck zu', fx: function (m, x) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'tec'); return A.shot(m, { s: x.o, p: { id: -1 }, cx: x.cx, pc: x.pc }, sh, R.chance(0.5) ? 0.35 : 0.6, [['tec', 0.6], ['sho', 0.4]], 'wing'); } }, { l: 'Langes Eck zu', fx: function (m, x) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'tec'); return A.shot(m, { s: x.o, p: { id: -1 }, cx: x.cx, pc: x.pc }, sh, R.chance(0.5) ? 0.35 : 0.6, [['tec', 0.6], ['sho', 0.4]], 'wing'); } }] },
    { id: 'hb_subbed', w: 0.6, when: function (x) { return x.on && x.min > 35 && m_rating(x) < 6.3 && !x.m.pc.used.hb_bench && canOff(x); }, t: function () { return 'Der Trainer nimmt dich vom Feld.'; },
      o: [{ l: 'Akzeptieren', fx: function (m, x) { A.subOff(m, x.s, x.p); X.eff(x.st, { coach: 2 }); return 'sub'; } }, { l: 'Meckern', fx: function (m, x) { A.subOff(m, x.s, x.p); X.mem(x.st, 'subProtest', 1); X.eff(x.st, { coach: -6 }); return 'sub'; } }] },
    { id: 'hb_capt', w: 0.4, when: function (x) { return x.on && x.p.age >= 24 && x.cx.per.lead >= 45; }, t: function () { return 'Die Mannschaft wirkt verunsichert und schaut zu dir.'; },
      o: [{ l: 'Kommando übernehmen', fx: function (m, x) { A.mot(m, x.s, 0.015); X.eff(x.st, { lead: 3 }); return 'ok'; } }, { l: 'Den Spielmacher machen lassen', fx: function () { return 'ok'; } }] },
    { id: 'hb_injured_mate', w: 0.5, when: function (x) { return x.on; }, t: function () { return 'Ein Mitspieler bleibt nach einem Foul liegen. Ihr seid im Angriff.'; },
      o: [{ l: 'Ball abgeben, Behandlung ermöglichen', fx: function (m, x) { X.eff(x.st, { mates: 3 }); return 'ok'; } }, { l: 'Angriff zu Ende spielen', fx: function (m, x) { A.skip(m, x.s); X.eff(x.st, { mates: -2 }); return A.shot(m, x, x.p, 0.42, [['sho', 0.7], ['tec', 0.3]], 'back'); } }] },
    { id: 'hb_show', w: 0.6, when: function (x) { return x.on && x.diff >= 6; }, t: function () { return 'Hohe Führung. Die Halle will Show sehen.'; },
      o: [{ l: 'Trickwurf', fx: function (m, x) { A.skip(m, x.s); var r = A.shot(m, x, x.p, 0.32, [['tec', 0.8], ['sho', 0.2]], 'wing', { g: 'Spektakel! ' + nm(x.p) + ' mit dem Kempa-Dreher!' }); X.eff(x.st, { fans: 2 }); if (r !== 'goal') X.eff(x.st, { coach: -2 }); return r; } }, { l: 'Seriös bleiben', fx: function (m, x) { X.eff(x.st, { coach: 1 }); return 'ok'; } }] },
    { id: 'hb_behind', key: true, w: 1, when: function (x) { return x.on && x.diff <= -3 && x.min > 40; }, t: function () { return 'Deutlicher Rückstand. Forderst du eine offensive Abwehr?'; },
      o: [{ l: 'Offensive Deckung fordern', fx: function (m, x) { A.mot(m, x.s, 0.02); A.skip(m, x.o); if (R.chance(0.45)) { A.skip(m, x.s); return A.shot(m, x, A.mate(m, x.s, null, 'spd'), 0.72, [['sho', 0.5], ['spd', 0.5]], 'fast'); } return A.oppAttack(m, x, 0.62); } }, { l: 'Ruhig weiterspielen', fx: function () { return 'ok'; } }] },
    { id: 'hb_bench', w: 1, bench: true, when: function (x) { return x.bench && x.min >= 15 && x.m.pc.benchOK && canOn(x); }, t: function () { return 'Der Trainer zeigt auf dich: rein für die Abwehr.'; },
      o: [{ l: 'Sofort Vollgas', fx: function (m, x) { if (!subOn(m, x)) return 'ok'; A.rate(m, x.p.id, 0.1); return 'on'; } }, { l: 'Erst die Anweisungen hören', fx: function (m, x) { if (!subOn(m, x)) return 'ok'; X.eff(x.st, { coach: 1 }); return 'on'; } }] },
    { id: 'hb_hip', w: 0.8, when: function (x) { return att(x) && x.p.pos === 'RUE'; }, t: function () { return 'Die Abwehr erwartet den Sprungwurf.'; },
      o: [{ l: 'Hüftwurf', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.42, [['tec', 0.5], ['sho', 0.5]], 'back'); } }, { l: 'Schlagwurf aus dem Stand', fx: function (m, x) { A.skip(m, x.s); return A.shot(m, x, x.p, 0.36, [['sho', 0.9], ['tec', 0.1]], 'back'); } }] },
    { id: 'hb_fans', w: 0.4, when: function (x) { return x.on && m_rating(x) >= 7; }, t: function () { return 'Die Halle feiert deine starke Leistung.'; },
      o: [{ l: 'Publikum anheizen', fx: function (m, x) { A.mot(m, x.s, 0.01); X.eff(x.st, { fans: 3 }); return 'ok'; } }, { l: 'Konzentriert bleiben', fx: function (m, x) { A.rate(m, x.p.id, 0.05); return 'ok'; } }] },
    { id: 'hb_to_call', w: 0.5, when: function (x) { return x.on && x.cx.per.lead >= 40 && x.m.run[x.o] >= 3; }, t: function () { return 'Der Gegner hat drei Tore in Folge erzielt. Du winkst Richtung Bank.'; },
      o: [{ l: 'Auszeit fordern', fx: function (m, x) { if (m.timeouts[x.s] > 0) { m.timeouts[x.s]--; m.run[x.o] = 0; A.mot(m, x.s, 0.015); A.ev(m, 'tactic', x.s, 'Auszeit auf Wunsch der Mannschaft.'); } return 'ok'; } }, { l: 'Selbst Ruhe reinbringen', fx: function (m, x) { X.eff(x.st, { lead: 2 }); return 'ok'; } }] }
  ];
  function teamTimeout(m, x) { if (M.driveOn && m.timeouts[x.s] > 0) M.driveOn(m, x.s); }
  function gk7(m, x, saveP) { A.skip(m, x.o); var sh = A.mate(m, x.o, null, 'sho'); m.stats.shots[x.o]++; m.stats.chances[x.o]++; var p = clamp(saveP * 0.75 + (x.p.attr.gk - sh.attr.sho) / 350, 0.06, 0.4); if (R.rand() < p) { A.save(m, x.o, sh, 'Siebenmeter gehalten! ' + nm(x.p) + ' wird gefeiert!'); A.rate(m, x.p.id, 0.25); X.eff(x.st, { conf: 3 }); return 'save'; } if (R.chance(0.05)) return A.miss(m, x.o, sh, 'Pfosten!'); return A.goal(m, x.o, sh, null, 'seven', nm(sh) + ' verwandelt den Siebenmeter.'); }

  CM.SITS = HB ? HBS : FB; CM.FB = FB; CM.HBS = HBS;

  // ---------- Ablauf ----------
  CM.mode = function (st) { var cx = X.ensure(st); return cx ? cx.mm || 'standard' : 'standard'; };
  CM.setMode = function (st, k) { if (CM.MODES[k]) X.ensure(st).mm = k; };
  CM.plan = function (m, st, mode) {
    var p = C.player(st); mode = mode || CM.mode(st);
    var n = mode === 'schnell' ? R.randInt(1, 2) : mode === 'intensiv' ? R.randInt(6, 10) : R.randInt(3, 5);
    var at = []; for (var i = 0; i < n; i++) at.push(R.randInt(4, FULL - 1)); at.sort(function (a, b) { return a - b; });
    // Einwechslung nur so oft, wie die Simulation sie auch vorsehen würde (abhängig vom Trainervertrauen)
    var benchOK = R.chance(clamp(0.22 + (st.pc.trust - 50) / 160, 0.08, 0.5));
    m.pc = { pid: p.id, mode: mode, at: at, used: {}, log: [], n: n, benchOK: benchOK };
    return m.pc;
  };
  // Nächste Situation, sobald eine geplante Minute erreicht ist (sonst null)
  CM.next = function (m) {
    var pc = m.pc; if (!pc || m.finished) return null;
    var fol = CM.follow(m); if (fol) return fol;
    if (!pc.at.length || pc.at[0] > m.minute) return null;
    pc.at.shift();
    var x = CM.ctx(m); if (m.sentOff[x.p.id] || m.injured[x.p.id]) { pc.at = []; return null; }
    if (!x.on && !x.bench) return null;
    var owed = m.pcOwn ? m.pcOwn[x.s] : 0; // noch nicht verrechnete eigene Abschlüsse
    var pool = CM.SITS.filter(function (s) { if (pc.used[s.id] || s.follow) return false; if (owed >= (HB ? 3 : 1) && s.when === att) return false; if (pc.mode === 'schnell' && !s.key) return false; if (!!s.bench !== !!(x.bench && !x.on)) return false; try { return s.when(x); } catch (e) { return false; } });
    if (!pool.length && pc.mode === 'schnell') pool = CM.SITS.filter(function (s) { return !pc.used[s.id] && !s.bench && !s.follow && x.on && (function () { try { return s.when(x); } catch (e) { return false; } })(); });
    if (!pool.length) return null;
    var s = R.weighted(pool, function (q) { return (q.w || 1) * (q.key && x.late ? 1.6 : 1); });
    return CM.inst(m, s, x);
  };
  CM.inst = function (m, s, x) {
    m.pc.used[s.id] = 1;
    var opts = []; s.o.forEach(function (o, i) { var ok = true; try { ok = !o.req || o.req(x); } catch (e) { ok = false; } if (ok) opts.push(i); });
    return { id: s.id, min: m.minute, t: s.t(x), opts: opts, labels: opts.map(function (i) { return { i: i, l: s.o[i].l, hint: s.o[i].hint }; }) };
  };
  // Reaktion direkt nach einem eigenen Tor (nicht im Schnellmodus); sonst nichts
  CM.follow = function (m) {
    var pc = m.pc; if (pc.mode === 'schnell') return null;
    var p = C.player(m.st); if (!p || m.sentOff[p.id] || m.injured[p.id]) return null;
    var x = CM.ctx(m), s = CM.SITS.filter(function (q) { return q.follow && !pc.used[q.id]; }).filter(function (q) { try { return q.when(x); } catch (e) { return false; } })[0];
    if (!s) return null;
    var gi = -1; for (var i = m.events.length - 1; i >= 0; i--) if (m.events[i].type === 'goal') { gi = i; break; }
    pc.celeb = gi; if (!R.chance(0.6)) return null;
    return CM.inst(m, s, x);
  };
  CM.choose = function (m, inst, i) {
    var s = CM.SITS.filter(function (q) { return q.id === inst.id; })[0]; if (!s || inst.opts.indexOf(i) < 0) return null;
    var x = CM.ctx(m), before = m.score.slice(), r = s.o[i].fx(m, x) || 'ok';
    var entry = { min: m.minute, id: s.id, t: inst.t, l: s.o[i].l, r: r, score: m.score.slice(), p: x.lastP != null ? Math.round(x.lastP * 100) : null };
    m.pc.log.push(entry);
    var goalNow = m.score[x.s] > before[x.s];
    if (goalNow && x.late && Math.abs(m.score[x.s] - m.score[x.o]) <= 1 && (m.goals[x.p.id] || 0) > 0 && m.events[m.events.length - 1].pid === x.p.id) X.chron(x.st, 'highlight', '⏱️', 'Spätes Tor gegen ' + x.opp.short, 'In der ' + m.minute + '. Minute zum ' + m.score[x.s] + ':' + m.score[x.o] + '.', 3);
    return entry;
  };
  CM.RESULT_TXT = { goal: 'Tor!', save: 'Gehalten', miss: 'Vorbei', lost: 'Ballverlust', card: 'Karte', red: 'Platzverweis', injury: 'Verletzung', sub: 'Ausgewechselt', on: 'Eingewechselt', ok: 'Erledigt', safe: 'Sicher', none: '–' };
  // Spielbericht der Szenen merken (nach dem Abpfiff)
  CM.wrap = function (st, m) {
    if (!m.pc) return; var cx = X.ensure(st), s = m.ntSide != null ? m.ntSide : m.clubs[0] === C.player(st).clubId ? 0 : 1;
    cx.lastMatch = { season: st.season, week: st.week, home: st.clubs[m.clubs[0]].short, away: st.clubs[m.clubs[1]].short, score: m.score.slice(), side: s, rating: m.rating[m.pc.pid] || null, goals: m.goals[m.pc.pid] || 0, decisions: m.pc.log.slice(0, 12), mode: m.pc.mode, nt: m.ntSide != null };
    X.mem(st, 'scenes', m.pc.log.length);
  };
  // Automatischer Durchlauf (Tests, Simulationen, Auto-Modus): wählt nach Strategie
  CM.autoPlay = function (m, st, policy) {
    CM.plan(m, st, 'standard'); m.st = st;
    while (!m.finished) { M.step(m); var inst = CM.next(m); if (inst) { var i = policy ? policy(inst) : inst.opts[R.randInt(0, inst.opts.length - 1)]; CM.choose(m, inst, i); } }
    CM.wrap(st, m); return m;
  };
  // Woche mit eigenem Spiel: welches Spiel betrifft den eigenen Spieler?
  CM.fixture = function (st) {
    var p = C.player(st); if (!p || p.youth || !p.clubId) return null;
    var prep = R.season.prepareWeek(st); return prep.list.filter(function (fx) { return (fx.h === p.clubId || fx.a === p.clubId) && fx.comp !== 'friendly'; })[0] || null;
  };
})(RFM);
