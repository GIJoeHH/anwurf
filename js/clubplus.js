// Vereinsausbau: TV-Vertrag, Vereinsphilosophie für die Jugend, Jugendligen, Talentförderung,
// Leihverträge mit Einsatzgarantie und Betreuung, Karriereende mit Rolle im Verein.
// Die Logik ist in ANPFIFF! und ANWURF! gleich – nur CFG unterscheidet sich je Sportart (hier: Handball).
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season;
  var P = R.plus = {};
  var CFG = P.CFG = { spread: 40, goals: 26, teamSize: 7, youthName: { u19: 'A-Jugend-Liga (U19)', u17: 'B-Jugend-Liga (U17)' }, tv: ['SportPlus', 'Arena Live', 'Sportkanal 24', 'MatchStream', 'Hallen TV', 'Siebenmeter Media'] };
  var K = D.MONEY || 1;
  function tick(st) { return st.tick || 0; }
  function uc(st) { return S.userClub(st); }
  function host(st) { return uc(st) || (R.pc && R.pc.active(st) ? R.pc.club(st) : null); } // Verein mit Jugendliga-Ansicht (Manager oder eigener Spieler)
  function isHost(st, c) { return c && (c.userControlled || (R.pc && R.pc.active(st) && R.pc.club(st) === c)); }
  function lk(c) { return W.lk ? W.lk(c) : c.league; }
  function news(st, t, x, cat) { if (S.news) S.news(st, t, x, cat || 'verein'); }
  function poisson(l) { if (l > 30) return Math.max(0, Math.round(R.gauss(l, Math.sqrt(l)))); var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= R.rand(); } while (p > L); return k - 1; }

  // =====================================================================
  // TV-Vertrag
  // =====================================================================
  P.TV_KINDS = {
    fix: { n: 'Festvertrag', d: 'Fester Betrag, 1 Saison. Planbar und ohne Risiko.' },
    erfolg: { n: 'Erfolgsvertrag', d: 'Niedrigere Grundsumme, dafür Prämie nach Tabellenplatz am Saisonende (bis +40 %).' },
    lang: { n: 'Langzeitvertrag', d: '3 Saisons, Handgeld bei Unterschrift. Schutz bei Abstieg (mind. 80 % der heutigen Summe), aber gedeckelt bei Aufstieg (höchstens 130 %).' }
  };
  P.tvBase = function (club) { return D.leagueTV[club.league] || 0; };
  P.tvActive = function (st, club) { var d = club.tvDeal; return d && d.until >= st.season ? d : null; };
  // TV-Gelder dieser Saison (Grundlage der Wochenraten)
  P.tvSeason = function (st, club) {
    var base = P.tvBase(club), d = club.userControlled ? P.tvActive(st, club) : null;
    if (!d) return base;
    if (d.kind === 'lang') { var L0 = D.leagueTV[d.league0] || base; return Math.round(R.clamp(base * d.f, L0 * 0.8, L0 * 1.3)); }
    return Math.round(base * d.f);
  };
  P.tvOffers = function (st, club) {
    if (club.tvOffers && club.tvOffers.season === st.season && club.tvOffers.list.length) return club.tvOffers.list;
    var base = P.tvBase(club), rep = (club.reputation || 50) / 100, names = R.shuffle(CFG.tv.slice());
    var adm = club.budgets && club.budgets.admin === 2 ? 0.02 : club.budgets && club.budgets.admin === 0 ? -0.02 : 0;
    var list = [
      { id: 'fix', kind: 'fix', name: names[0], f: Math.round((1 + rep * 0.08 + adm + R.randRange(-0.01, 0.02)) * 1000) / 1000, years: 1, bonus: 0, hand: 0 },
      { id: 'erfolg', kind: 'erfolg', name: names[1], f: Math.round((0.85 + adm) * 1000) / 1000, years: 1, bonus: 0.4, hand: 0 },
      { id: 'lang', kind: 'lang', name: names[2], f: Math.round((1.02 + rep * 0.04 + adm) * 1000) / 1000, years: 3, bonus: 0, hand: Math.round(base * (0.06 + rep * 0.04) / 1000) * 1000 }
    ];
    list.forEach(function (o) { o.seasonValue = Math.round(base * o.f); });
    club.tvOffers = { season: st.season, list: list };
    return list;
  };
  P.signTv = function (st, club, id) {
    var o = P.tvOffers(st, club).filter(function (x) { return x.id === id; })[0]; if (!o) return null;
    if (P.tvActive(st, club)) return null;
    club.tvDeal = { kind: o.kind, name: o.name, f: o.f, bonus: o.bonus, years: o.years, from: st.season, until: st.season + o.years - 1, league0: club.league };
    if (o.hand) { club.cash += o.hand; E.book(club, 'TV-Gelder', o.hand); }
    club.tvOffers = null;
    news(st, 'TV-Vertrag mit ' + o.name, P.TV_KINDS[o.kind].n + ' bis ' + (club.tvDeal.until + 1) + (o.hand ? ', Handgeld ' + R.fmtMoney(o.hand) : '') + '.', 'finanzen');
    return club.tvDeal;
  };
  // Erfolgsprämie am Saisonende
  P.tvSeasonEnd = function (st, club) {
    var d = P.tvActive(st, club); if (!d || d.kind !== 'erfolg' || !st.finalTables) return 0;
    var ft = st.finalTables[lk(club)] || [], i = ft.indexOf(club.id); if (i < 0) return 0;
    var share = ft.length > 1 ? 1 - i / (ft.length - 1) : 1, amt = Math.round(P.tvBase(club) * d.bonus * share / 1000) * 1000;
    if (amt > 0) { club.cash += amt; E.book(club, 'TV-Gelder', amt); news(st, 'TV-Erfolgsprämie: ' + R.fmtMoney(amt), d.name + ' zahlt für Platz ' + (i + 1) + '.', 'finanzen'); }
    return amt;
  };

  // =====================================================================
  // Vereinsphilosophie (Spielsystem und Grundtaktik für alle Jugendteams)
  // =====================================================================
  P.planOf = function (club) { return club.youthPlan || null; };
  P.setPlan = function (st, club, plan) {
    if (!plan) { club.youthPlan = null; return null; }
    club.youthPlan = { formation: plan.formation, style: +plan.style, pressing: +plan.pressing, tempo: +plan.tempo, since: club.youthPlan && club.youthPlan.formation === plan.formation ? club.youthPlan.since : st.season };
    return club.youthPlan;
  };
  // Passt die Philosophie zur Profimannschaft? 0..1
  P.planMatch = function (club) {
    var y = club.youthPlan, t = club.tactic; if (!y || !t) return 0;
    var m = 0; if (y.formation === t.formation) m += 0.5; if (y.style === t.style) m += 0.2; if (y.pressing === t.pressing) m += 0.15; if (y.tempo === t.tempo) m += 0.15;
    return m;
  };
  // Je länger eine Philosophie gilt, desto besser sitzt sie (bis 3 Saisons)
  P.planYears = function (st, club) { var y = club.youthPlan; return y ? Math.min(3, st.season - (y.since || st.season) + 1) : 0; };
  P.planBias = function (club) {
    var y = club.youthPlan; if (!y) return [];
    var a = [];
    if (y.style >= 2) a.push('sho', 'tec'); else if (y.style === 0) a.push('def');
    if (y.pressing === 2) a.push('sta', 'spd');
    if (y.tempo === 2) a.push('spd', 'pas'); else if (y.tempo === 0) a.push('pas', 'tec');
    return a;
  };
  P.youthBias = function (st, club, p, g) {
    var a = P.planBias(club); if (!a.length || !(g > 0)) return;
    a.forEach(function (k) { if (p.attr[k] != null && k !== 'gk') p.attr[k] = Math.min(99, p.attr[k] + g * 0.35); });
  };

  // =====================================================================
  // Talentförderung (Einzelspieler und ganze Jugend)
  // =====================================================================
  P.PUSH = {
    pros: { n: 'Training mit den Profis', d: 'Ein Talent trainiert 4 Wochen bei der ersten Mannschaft mit (höchstens 3 gleichzeitig).', weeks: 4, f: 0.25, max: 3 },
    mentor: { n: 'Einzeltraining mit einem Profi', d: 'Ein Profi derselben Position betreut ein Talent 6 Wochen lang. Je stärker der Profi, desto mehr lernt das Talent.', weeks: 6, f: 0.3 },
    balljungen: { n: 'Einsatz als Wischer und Balljungen', d: 'Die ganze Jugend erlebt 2 Wochen lang die Heimspiele hautnah am Spielfeldrand: Motivation, Moral und etwas mehr Fans. Danach 3 Wochen Pause.', weeks: 2, f: 0.08, cool: 5 },
    profitrainer: { n: 'Profitrainer trainiert die Jugend', d: 'Der Cheftrainer leitet eine Woche das Jugendtraining. Großer Schub für alle Talente, die Profis trainieren in der Woche etwas weniger effektiv. Danach 5 Wochen Pause.', weeks: 1, f: 0.35, cool: 6 }
  };
  P.pushState = function (club) { return club.yAct || (club.yAct = {}); };
  P.teamPushActive = function (st, club, k) { var a = P.pushState(club)[k]; return !!(a && a.until > tick(st)); };
  P.teamPushReady = function (st, club, k) { var a = P.pushState(club)[k]; return !a || a.ready <= tick(st); };
  P.prosCount = function (st, club) { return W.youthOf(st, club.id).filter(function (p) { return p.yb && p.yb.k === 'pros' && p.yb.until > tick(st); }).length; };
  P.pushPlayer = function (st, club, p, k, mentorId) {
    var d = P.PUSH[k]; if (!d || !p || !p.youth || p.clubId !== club.id) return { ok: false, why: 'Nicht möglich.' };
    if (p.yb && p.yb.until > tick(st)) return { ok: false, why: W.playerName(p) + ' wird bereits gefördert.' };
    if (k === 'pros' && P.prosCount(st, club) >= d.max) return { ok: false, why: 'Es trainieren schon ' + d.max + ' Talente bei den Profis mit.' };
    var mentor = null;
    if (k === 'mentor') {
      mentor = st.players[mentorId];
      if (!mentor || mentor.clubId !== club.id || mentor.youth) return { ok: false, why: 'Bitte einen Profi wählen.' };
      var busy = W.youthOf(st, club.id).some(function (y) { return y.yb && y.yb.k === 'mentor' && y.yb.mentor === mentor.id && y.yb.until > tick(st); });
      if (busy) return { ok: false, why: W.playerName(mentor) + ' betreut schon ein Talent.' };
    }
    p.yb = { k: k, until: tick(st) + d.weeks, mentor: mentor ? mentor.id : null, f: d.f + (mentor ? R.clamp((mentor.ovr - 60) / 150, -0.1, 0.2) : 0) };
    p.morale = R.clamp((p.morale || 60) + 6, 0, 100);
    if (mentor) mentor.morale = R.clamp((mentor.morale || 60) + 2, 0, 100);
    return { ok: true };
  };
  P.pushTeam = function (st, club, k) {
    var d = P.PUSH[k]; if (!d || !d.cool) return { ok: false, why: 'Nicht möglich.' };
    if (!P.teamPushReady(st, club, k)) return { ok: false, why: 'Erst wieder in ' + (P.pushState(club)[k].ready - tick(st)) + ' Woche(n) möglich.' };
    P.pushState(club)[k] = { until: tick(st) + d.weeks, ready: tick(st) + d.cool };
    W.youthOf(st, club.id).forEach(function (p) { p.morale = R.clamp((p.morale || 60) + (k === 'balljungen' ? 8 : 5), 0, 100); });
    if (k === 'balljungen') club.fans = Math.round((club.fans || 0) * 1.002);
    return { ok: true };
  };

  // =====================================================================
  // Entwicklungsfaktor (wird im Wochentraining je Spieler angewendet)
  // =====================================================================
  P.devF = function (st, club, p) {
    var f = 1, t = tick(st);
    if (p.youth) {
      if (club.youthPlan) f += 0.04 + 0.02 * P.planYears(st, club) + 0.06 * P.planMatch(club);
      if (p.yb && p.yb.until > t) f += p.yb.f || 0;
      if (P.teamPushActive(st, club, 'profitrainer')) f += P.PUSH.profitrainer.f;
      if (P.teamPushActive(st, club, 'balljungen')) f += P.PUSH.balljungen.f;
      f += P.alumniF(club, 'jugendtrainer');
      var ys = p.ys && p.ys.s === st.season ? p.ys : null, yl = st.ylg && st.ylg.season === st.season ? st.ylg : null;
      if (ys && yl) { var g = yl.groups[P.groupOf(p)]; if (g && g.round) f += 0.06 * Math.min(1, ys.a / g.round); }
    } else {
      if (P.teamPushActive(st, club, 'profitrainer')) f -= 0.1;
      f += P.alumniF(club, 'cotrainer');
      if (p.loan && p.loan.care && p.loan.care.plan === st.season) f += 0.12;
    }
    return Math.max(0.3, f) * (R.pc && R.pc.isPc(st, p) && !st.pc.retired ? R.pc.devF(st, p) : 1);
  };
  // Aufstellungsgewicht der KI: Leihspieler mit Einsatzgarantie spielen bevorzugt
  P.lineupBias = function (st, club, p) {
    if (R.pc && st.pc && !st.pc.retired && p.id === st.pc.pid) return R.pc.lineupBias(st, p);
    if (club.userControlled || !p.loan || !p.loan.role) return 1;
    var r = P.LOAN_ROLES[p.loan.role]; if (!r) return 1;
    var b = r.bias; if (p.loan.care && p.loan.care.demand === st.season) b += 0.08;
    if (p.loan.minApps && p.stats && p.stats.apps <= P.loanDue(st, p)) b += 0.3; // Einsatzgarantie einhalten
    return 1 + b;
  };

  // =====================================================================
  // Jugendligen
  // =====================================================================
  P.GROUPS = ['u19', 'u17'];
  P.groupOf = function (p) { return p.age >= 18 ? 'u19' : 'u17'; };
  P.ylClubs = function (st, club) {
    var all = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return c.id !== club.id && !c.foreign && c.league; });
    all.sort(function (a, b) { return Math.abs(a.league - club.league) - Math.abs(b.league - club.league) || Math.abs((a.reputation || 50) - (club.reputation || 50)) - Math.abs((b.reputation || 50) - (club.reputation || 50)) || (a.id < b.id ? -1 : 1); });
    return [club.id].concat(all.slice(0, 11).map(function (c) { return c.id; }));
  };
  function rr(ids) {
    var a = ids.slice(); if (a.length % 2) a.push(null);
    var n = a.length, rounds = [];
    for (var r = 0; r < n - 1; r++) {
      var md = [];
      for (var i = 0; i < n / 2; i++) { var h = a[i], g = a[n - 1 - i]; if (h && g) md.push(r % 2 ? [g, h] : [h, g]); }
      rounds.push(md); a.splice(1, 0, a.pop());
    }
    return rounds.concat(rounds.map(function (md) { return md.map(function (f) { return [f[1], f[0]]; }); }));
  }
  P.ensureYL = function (st) {
    var club = host(st); if (!club) return null;
    if (st.ylg && st.ylg.season === st.season && st.ylg.club === club.id) return st.ylg;
    var ids = P.ylClubs(st, club), y = { season: st.season, club: club.id, groups: {} };
    P.GROUPS.forEach(function (g, gi) {
      var order = gi ? ids.slice().reverse() : ids.slice(), tab = {};
      ids.forEach(function (id) { tab[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
      y.groups[g] = { name: CFG.youthName[g], ids: ids, sched: rr(order), round: 0, tab: tab, last: [] };
    });
    st.ylg = y;
    return y;
  };
  P.ylStrength = function (st, club, g) {
    var n = CFG.teamSize, list = W.youthOf(st, club.id).filter(function (p) { return P.groupOf(p) === g && !p.inj; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, n);
    var fill = 30 + (E.level(club, 'jugend').q || 0) * 4 + (club.league === 1 ? 4 : club.league === 2 ? 2 : 0), sum = 0;
    for (var i = 0; i < n; i++) sum += list[i] ? list[i].ovr : fill - 4;
    var s = sum / n;
    if (club.userControlled) {
      if (club.youthPlan) s += 1 + P.planYears(st, club) * 0.5 + P.planMatch(club) * 1.5;
      if (P.teamPushActive(st, club, 'profitrainer')) s += 2;
      if (P.teamPushActive(st, club, 'balljungen')) s += 0.8;
    }
    return { s: s, xi: list };
  };
  P.ylPlayRound = function (st, y, g) {
    var G = y.groups[g]; if (!G || G.round >= G.sched.length) return;
    var md = G.sched[G.round], cache = {};
    function str(id) { return cache[id] || (cache[id] = P.ylStrength(st, st.clubs[id], g)); }
    md.forEach(function (f) {
      var a = str(f[0]), b = str(f[1]), d = (a.s - b.s) / CFG.spread;
      var ga = poisson(CFG.goals * Math.exp(d + 0.08)), gb = poisson(CFG.goals * Math.exp(-d));
      var A = G.tab[f[0]], B = G.tab[f[1]];
      A.p++; B.p++; A.gf += ga; A.ga += gb; B.gf += gb; B.ga += ga;
      if (ga > gb) { A.w++; B.l++; A.pts += 3; } else if (ga < gb) { B.w++; A.l++; B.pts += 3; } else { A.d++; B.d++; A.pts++; B.pts++; }
      [[f[0], a, ga], [f[1], b, gb]].forEach(function (x) {
        var c = st.clubs[x[0]]; if (!isHost(st, c)) return;
        x[1].xi.forEach(function (p) { if (!p.ys || p.ys.s !== st.season) p.ys = { s: st.season, a: 0, g: 0 }; p.ys.a++; });
        var pool = x[1].xi.slice(); while (pool.length < CFG.teamSize) pool.push(null); // aufgefüllte Plätze treffen auch
        for (var k = 0; k < x[2]; k++) { var pl = R.weighted(pool, function (p) { return p ? 1 + Math.max(0, p.attr.sho - 30) / 10 : 2.5; }); if (pl) pl.ys.g++; }
        G.last.unshift({ r: G.round + 1, h: f[0], a: f[1], gh: ga, ga: gb }); G.last = G.last.slice(0, 6);
      });
    });
    G.round++;
  };
  P.ylTable = function (st, g) {
    var y = P.ensureYL(st); if (!y) return [];
    var G = y.groups[g];
    return G.ids.map(function (id) { var t = G.tab[id]; return { id: id, p: t.p, w: t.w, d: t.d, l: t.l, gf: t.gf, ga: t.ga, pts: t.pts }; })
      .sort(function (a, b) { return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || (a.id < b.id ? -1 : 1); });
  };
  P.ylWeekly = function (st) {
    if (st.phase !== 'season') return;
    var y = P.ensureYL(st); if (!y) return;
    P.GROUPS.forEach(function (g) {
      var G = y.groups[g], target = Math.min(G.sched.length, Math.round(st.week * G.sched.length / S.SEASON_WEEKS));
      while (G.round < target) P.ylPlayRound(st, y, g);
    });
  };
  P.ylSeasonEnd = function (st) {
    var y = st.ylg, club = host(st); if (!y || y.season !== st.season || !club || y.club !== club.id) return;
    P.GROUPS.forEach(function (g) { var G = y.groups[g]; while (G.round < G.sched.length) P.ylPlayRound(st, y, g); });
    st.ylgHist = st.ylgHist || [];
    P.GROUPS.forEach(function (g) {
      var t = P.ylTable(st, g), pos = t.map(function (r) { return r.id; }).indexOf(club.id) + 1, champ = t[0] && t[0].id;
      st.ylgHist.push({ season: st.season, g: g, champ: champ, pos: pos });
      if (champ === club.id) {
        club.reputation = R.clamp((club.reputation || 50) + 1, 1, 100);
        W.youthOf(st, club.id).filter(function (p) { return P.groupOf(p) === g; }).forEach(function (p) { p.pot = Math.min(96, p.pot + 1); p.morale = R.clamp((p.morale || 60) + 10, 0, 100); });
        news(st, CFG.youthName[g] + ': Meister!', 'Die Jugend von ' + club.short + ' holt den Titel. Alle Spieler dieses Jahrgangs legen beim Potenzial zu.', 'jugend');
      } else news(st, CFG.youthName[g] + ': Platz ' + pos, 'Meister wurde ' + (st.clubs[champ] ? st.clubs[champ].short : '–') + '.', 'jugend');
    });
    st.ylgHist = st.ylgHist.slice(-20);
  };

  // =====================================================================
  // Leihen: Einsatzrolle verhandeln, Betreuung, Bilanz bei Rückkehr
  // =====================================================================
  P.LOAN_ROLES = {
    stamm: { n: 'Stammspieler', min: 0.65, bias: 0.12, need: 1.5, d: 'Spielt fast immer (mind. 65 % der Ligaspiele).' },
    rotation: { n: 'Rotationsspieler', min: 0.4, bias: 0.06, need: 0, d: 'Regelmäßige Einsätze (mind. 40 % der Ligaspiele).' },
    ergaenzung: { n: 'Ergänzungsspieler', min: 0, bias: 0, need: -2, d: 'Keine Einsatzgarantie.' }
  };
  P.SHARES = [0.5, 0.75, 1];
  P.minApps = function (role) { var r = P.LOAN_ROLES[role]; return r ? Math.round(r.min * S.SEASON_WEEKS) : 0; };
  // Interessierte Vereine mit ihrer Einschätzung des Spielers
  P.loanCandidates = function (st, p) {
    var from = st.clubs[p.clubId]; if (!from) return [];
    var list = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (x) { return !x.userControlled && !x.foreign && x.league && x.id !== from.id && W.squad(st, x.id).length < 27; });
    list = list.map(function (x) {
      var same = W.squad(st, x.id).filter(function (q) { return q.pos === p.pos; }).sort(function (a, b) { return b.ovr - a.ovr; });
      var avg = same.length ? R.avg(same.slice(0, Math.max(1, Math.ceil(same.length / 2))), function (q) { return q.ovr; }) : p.ovr - 5;
      return { id: x.id, club: x, gap: p.ovr - avg, rank: same.filter(function (q) { return q.ovr > p.ovr; }).length + 1 };
    }).filter(function (o) { return o.gap > -9; });
    list.sort(function (a, b) { return Math.abs(a.gap - 2) - Math.abs(b.gap - 2) || b.club.league - a.club.league; });
    var out = [], seen = {};
    list.forEach(function (o) { if (out.length < 4 && !seen[o.club.league + ':' + (o.gap > 2 ? 'a' : 'b')]) { seen[o.club.league + ':' + (o.gap > 2 ? 'a' : 'b')] = 1; out.push(o); } });
    list.forEach(function (o) { if (out.length < 4 && out.indexOf(o) < 0) out.push(o); });
    return out;
  };
  // Verhandlung: akzeptiert der Verein die geforderte Rolle und Gehaltsaufteilung?
  P.loanAccept = function (st, p, toClub, role, share) {
    var same = W.squad(st, toClub.id).filter(function (q) { return q.pos === p.pos; }).sort(function (a, b) { return b.ovr - a.ovr; });
    var avg = same.length ? R.avg(same.slice(0, Math.max(1, Math.ceil(same.length / 2))), function (q) { return q.ovr; }) : p.ovr - 5;
    var score = (p.ovr - avg) / 2.5 - P.LOAN_ROLES[role].need + (share - 0.5) * 6 + (p.age <= 21 ? 0.5 : 0);
    var ok = score >= 0;
    var why = ok ? toClub.short + ' akzeptiert: ' + W.playerName(p) + ' kommt als ' + P.LOAN_ROLES[role].n + '.'
      : toClub.short + ' lehnt ab: ' + (role === 'stamm' ? 'Eine Stammplatzgarantie gibt es dafür nicht.' : 'Zu teuer für einen Spieler, der nicht sicher spielt.') + ' Weniger Einsatzzeit fordern oder mehr Gehalt übernehmen.';
    return { ok: ok, score: score, why: why };
  };
  P.loanOut = function (st, p, toClub, role, share) {
    var acc = P.loanAccept(st, p, toClub, role, share); if (!acc.ok) return acc;
    R.transfers.loanPlayer(st, p, toClub, share);
    p.loan.until = st.phase === 'preseason' || (st.phase === 'season' && st.week <= S.WINTER_AFTER) ? st.season : st.season + 1; // bis Saisonende (in der Rückrunde: bis Ende der nächsten Saison)
    p.loan.role = role; p.loan.minApps = P.minApps(role); p.loan.ovr0 = p.ovr; p.loan.pot0 = p.pot; p.loan.start = st.season; p.loan.care = {};
    news(st, 'Leihe: ' + W.playerName(p) + ' zu ' + toClub.name, P.LOAN_ROLES[role].n + (p.loan.minApps ? ' (mind. ' + p.loan.minApps + ' Einsätze)' : '') + ', ' + toClub.short + ' zahlt ' + Math.round(share * 100) + ' % des Gehalts.', 'transfer');
    return acc;
  };
  P.loanedOut = function (st, club) { return Object.keys(st.players).map(function (k) { return st.players[k]; }).filter(function (p) { return p.loan && p.loan.from === club.id && p.clubId !== club.id; }); };
  // Soll-Einsätze bis heute
  P.loanDue = function (st, p) { if (!p.loan || !p.loan.minApps) return 0; var w = st.phase === 'season' ? st.week : st.phase === 'preseason' ? 0 : S.SEASON_WEEKS; return Math.floor(p.loan.minApps * w / S.SEASON_WEEKS); };
  P.CARE = {
    call: { n: 'Anrufen und motivieren', d: 'Moral +8. Alle 3 Wochen möglich.', cool: 3 },
    visit: { n: 'Spiel vor Ort besuchen', d: 'Moral +5 und genauer Leistungsbericht. Alle 6 Wochen möglich.', cool: 6 },
    plan: { n: 'Individuellen Trainingsplan schicken', d: 'Der Spieler entwickelt sich für den Rest der Saison besser. Einmal je Saison.', season: true, cost: 15000 },
    demand: { n: 'Mehr Einsatzzeit einfordern', d: 'Nur wenn der Leihverein hinter der vereinbarten Einsatzzahl liegt. Der Spieler spielt danach häufiger. Einmal je Saison.', season: true }
  };
  P.careReady = function (st, p, k) {
    var c = p.loan && p.loan.care || {}, d = P.CARE[k];
    if (d.season) return c[k] !== st.season;
    return c[k] == null || tick(st) - c[k] >= d.cool;
  };
  P.loanCare = function (st, club, p, k) {
    if (!p.loan || p.loan.from !== club.id) return { ok: false, why: 'Kein Leihspieler des Vereins.' };
    var d = P.CARE[k]; if (!d) return { ok: false, why: 'Unbekannte Aktion.' };
    if (!P.careReady(st, p, k)) return { ok: false, why: d.season ? 'Diese Saison schon erledigt.' : 'Gerade erst gemacht – bitte etwas warten.' };
    var c = p.loan.care = p.loan.care || {}, msg = '';
    if (k === 'call') { p.morale = R.clamp((p.morale || 60) + 8, 0, 100); msg = W.playerName(p) + ' freut sich über den Anruf.'; }
    if (k === 'visit') { p.morale = R.clamp((p.morale || 60) + 5, 0, 100); msg = 'Bericht: Stärke ' + p.ovr + ' (' + (p.ovr - (p.loan.ovr0 || p.ovr) >= 0 ? '+' : '') + (p.ovr - (p.loan.ovr0 || p.ovr)) + ' seit Leihbeginn), Potenzial ' + p.pot + ', ' + p.stats.apps + ' Einsätze.'; }
    if (k === 'plan') { var cost = Math.round(d.cost * K / 1000) * 1000; club.cash -= cost; E.book(club, 'Trainer & Personal', -cost); msg = 'Der Trainingsplan ist unterwegs (' + R.fmtMoney(cost) + ').'; }
    if (k === 'demand') {
      if (p.stats.apps >= P.loanDue(st, p)) return { ok: false, why: 'Der Leihverein hält die Absprache ein (' + p.stats.apps + ' von ' + P.loanDue(st, p) + ' Soll-Einsätzen).' };
      msg = st.clubs[p.clubId].short + ' sagt mehr Einsatzzeit zu.';
    }
    c[k] = d.season ? st.season : tick(st);
    return { ok: true, msg: msg };
  };
  P.loanRecall = function (st, club, p) {
    if (!p.loan || p.loan.from !== club.id) return { ok: false, why: 'Kein Leihspieler.' };
    if (st.phase !== 'winter') return { ok: false, why: 'Vorzeitige Rückholung nur in der Winterpause.' };
    var to = st.clubs[p.clubId]; P.loanReport(st, p); p.clubId = club.id; p.loan = null;
    news(st, W.playerName(p) + ' kehrt vorzeitig zurück', 'Die Leihe bei ' + (to ? to.short : '–') + ' wurde in der Winterpause beendet.', 'transfer');
    return { ok: true };
  };
  P.loanReport = function (st, p) {
    var L = p.loan, from = st.clubs[L.from], to = st.clubs[p.clubId]; if (!from || !from.userControlled) return null;
    var d = p.ovr - (L.ovr0 != null ? L.ovr0 : p.ovr), txt = W.playerName(p) + ' kommt von ' + (to ? to.short : '–') + ' zurück: ' + p.stats.apps + ' Einsätze, Stärke ' + p.ovr + ' (' + (d >= 0 ? '+' : '') + d + ').';
    if (L.minApps && p.stats.apps < L.minApps && st.phase !== 'winter') {
      var comp = Math.round(p.wage * 0.25 / 1000) * 1000;
      from.cash += comp; E.book(from, 'Transfers', comp); if (to) { to.cash -= comp; E.book(to, 'Transfers', -comp); }
      txt += ' Vereinbart waren ' + L.minApps + ' Einsätze – ' + (to ? to.short : 'der Leihverein') + ' zahlt ' + R.fmtMoney(comp) + ' Ausgleich.';
      p.morale = R.clamp((p.morale || 60) - 8, 0, 100);
    } else if (L.minApps) { txt += ' Die Einsatzgarantie wurde eingehalten.'; p.morale = R.clamp((p.morale || 60) + 5, 0, 100); }
    news(st, 'Leihbilanz: ' + W.playerName(p), txt, 'transfer');
    (st.loanHist = st.loanHist || []).push({ season: st.season, pid: p.id, name: W.playerName(p), to: to ? to.short : '–', apps: p.stats.apps, min: L.minApps || 0, d: d });
    st.loanHist = st.loanHist.slice(-30);
    return txt;
  };
  // vor der Rückkehr zum Saisonende
  P.beforeReturnLoans = function (st) {
    Object.keys(st.players).forEach(function (id) { var p = st.players[id]; if (p.loan && st.season >= p.loan.until && p.loan.ovr0 != null) P.loanReport(st, p); });
  };

  // =====================================================================
  // Karriereende und Rolle im Verein
  // =====================================================================
  P.ROLES = {
    jugendtrainer: { n: 'Jugendtrainer', d: 'Die Talente entwickeln sich schneller.', ic: 'graduation-cap' },
    cotrainer: { n: 'Co-Trainer', d: 'Die Profis entwickeln sich etwas schneller.', ic: 'dumbbell' },
    botschafter: { n: 'Markenbotschafter', d: 'Jede Saison etwas mehr Ansehen und Fans.', ic: 'megaphone' }
  };
  P.alumni = function (club) { return club.alumni || (club.alumni = []); };
  P.alumniF = function (club, role) { var f = 0; (club.alumni || []).forEach(function (a) { if (a.role === role) f += a.f; }); return Math.min(0.25, f); };
  P.alumniWage = function (club) { return R.sum(club.alumni || [], function (a) { return a.wage || 0; }); };
  P.clubApps = function (st, p, club) { var n = (p.stats && p.stats.apps) || 0; (p.hist || []).forEach(function (h) { if (h.c === club.short) n += h.a || 0; }); return n; };
  P.isSpecial = function (st, p, club) { return P.clubApps(st, p, club) >= 100 || p.ovr >= 72 || (p.homegrown && p.homeClub === club.id) || club.captain === p.id || (p.career && p.career.apps >= 300); };
  P.canTalkRetire = function (st, p) { var c = uc(st); return !!(c && p.clubId === c.id && !p.youth && !p.loan && p.age >= 31 && p.contract <= 1 && p.retireAfter !== st.season); };
  P.retireEvent = function (st, p, own) {
    var club = uc(st), sp = P.isSpecial(st, p, club), apps = P.clubApps(st, p, club);
    var t = (own ? 'Sie sprechen mit ' + W.playerName(p) + ' über die Zukunft. ' : W.playerName(p) + ' (' + p.age + ') möchte seine Karriere nach dieser Saison beenden. ') +
      (apps ? apps + ' Einsätze für ' + club.short + '. ' : '') + (sp ? 'Er ist ein besonderer Spieler für den Verein und könnte eine Aufgabe übernehmen.' : 'Wie reagiert der Verein?');
    var o = [{ l: own ? 'Karriereende zum Saisonende vereinbaren' : 'Entscheidung respektieren', plusAct: { k: 'retire', pid: p.id } },
      { l: 'Ein weiteres Jahr anbieten', hint: 'Er überlegt es sich vielleicht', plusAct: { k: 'extend', pid: p.id } }];
    if (sp) Object.keys(P.ROLES).forEach(function (r) { o.push({ l: 'Karriereende, danach ' + P.ROLES[r].n, hint: P.ROLES[r].d, plusAct: { k: 'retire', pid: p.id, role: r } }); });
    if (own) o.push({ l: 'Doch nicht – weiterspielen lassen', plusAct: { k: 'none' } });
    return { custom: { t: t, ic: '👋', o: o } };
  };
  P.act = function (st, club, a) {
    var p = a.pid && st.players[a.pid];
    if (a.k === 'none') return 'Alles bleibt, wie es ist.';
    if (!p) return null;
    if (a.k === 'retire') { p.retireAfter = st.season; p.retireRole = a.role || null; return W.playerName(p) + ' beendet nach der Saison seine Karriere' + (a.role ? ' und wird ' + P.ROLES[a.role].n + '.' : '.'); }
    if (a.k === 'extend') {
      var yes = R.chance(p.age >= 36 ? 0.25 : p.age >= 34 ? 0.45 : 0.65);
      if (yes) { p.retireAfter = null; p.contract = Math.max(p.contract, 2); p.wage = Math.round(p.wage * 0.85 / 1000) * 1000; return W.playerName(p) + ' hängt noch ein Jahr dran (Gehalt −15 %).'; }
      p.retireAfter = st.season; return W.playerName(p) + ' bleibt bei seiner Entscheidung und hört nach der Saison auf.';
    }
    return null;
  };
  P.retireQueue = function (st) { return st.retireQ || (st.retireQ = []); };
  P.retireCheck = function (st) {
    var club = uc(st); if (!club || st.phase !== 'season' || st.week !== S.SEASON_WEEKS - 6) return;
    W.squad(st, club.id).forEach(function (p) {
      if (p.youth || p.loan || p.contract > 1 || p.age < 32 || p.retireAsked === st.season || p.renewing) return;
      p.retireAsked = st.season;
      var pr = p.age >= 36 ? 0.9 : p.age >= 35 ? 0.75 : p.age >= 34 ? 0.55 : p.age >= 33 ? 0.4 : 0.25;
      if (R.chance(pr)) { p.retireAfter = st.season; P.retireQueue(st).push(p.id); }
    });
  };
  P.flushRetireQueue = function (st) {
    var q = P.retireQueue(st);
    while (q.length && !st.pendingEvent) {
      var p = st.players[q.shift()];
      if (p && p.retireAfter === st.season && p.clubId === (uc(st) || {}).id) { st.pendingEvent = P.retireEvent(st, p, false); news(st, W.playerName(p) + ' denkt ans Karriereende', 'Der Vertrag läuft aus. Der Verein muss reagieren.', 'verein'); }
    }
  };
  // Saisonende: Karriereenden vollziehen, neue Aufgaben im Verein
  P.doRetirements = function (st) {
    var club = uc(st); if (!club) return;
    Object.keys(st.players).forEach(function (id) {
      var p = st.players[id];
      if (p.retireAfter !== st.season || p.clubId !== club.id) return;
      if (p.career && (p.career.apps > 250 || p.career.goals > 80) && club.legends) club.legends.push({ name: W.playerName(p), apps: p.career.apps, goals: p.career.goals, season: st.season });
      if (p.retireRole && P.ROLES[p.retireRole]) {
        var q = R.clamp((p.ovr - 50) / 25, 0.3, 1.4), f = Math.round((p.retireRole === 'botschafter' ? 1 : p.retireRole === 'jugendtrainer' ? 0.08 : 0.04) * q * 1000) / 1000;
        P.alumni(club).push({ id: 'A' + p.id, name: W.playerName(p), role: p.retireRole, f: f, q: Math.round(q * 100), wage: Math.round(Math.max(20000 * K, p.wage * 0.2) / 1000) * 1000, since: st.season + 1, apps: P.clubApps(st, p, club) });
      }
      news(st, W.playerName(p) + ' beendet seine Karriere', (p.retireRole ? 'Er bleibt dem Verein als ' + P.ROLES[p.retireRole].n + ' erhalten.' : 'Danke für alles!'), 'verein');
      R.transfers.release(st, p); delete st.players[id];
    });
  };
  P.dismissAlumni = function (st, club, id) { club.alumni = (club.alumni || []).filter(function (a) { return a.id !== id; }); };
  P.alumniSeason = function (st, club) {
    (club.alumni || []).forEach(function (a) { if (a.role === 'botschafter') { club.reputation = R.clamp((club.reputation || 50) + a.f, 1, 100); club.fans = Math.round((club.fans || 0) * (1 + 0.01 * a.f)); } });
  };

  // =====================================================================
  // Eigener Spieler in der Jugend
  // =====================================================================
  P.createYouth = function (st, club, o) {
    var pos = o.pos && D.posWeights[o.pos] ? o.pos : Object.keys(D.posWeights)[1];
    var age = R.clamp(+o.age || 16, 15, 19), ovr = R.clamp(+o.ovr || 45, 25, 75);
    var p = W.genPlayer(st, pos, ovr, age, club.id);
    if (o.first) p.first = String(o.first).slice(0, 30); if (o.last) p.last = String(o.last).slice(0, 30);
    p.youth = true; p.homegrown = true; p.homeClub = club.id; p.contract = 3; p.custom = true;
    p.pot = R.clamp(Math.round(+o.pot || ovr + 20), p.ovr, 99);
    p.wage = Math.max(8000 * K, Math.round(W.fairWage(p) * 0.5 / 1000) * 1000);
    W.recalc(p);
    return p;
  };

  // =====================================================================
  // Haken in den Spielablauf
  // =====================================================================
  P.weekly = function (st) {
    P.ylWeekly(st);
    var club = uc(st); if (!club) return;
    P.retireCheck(st);
    P.flushRetireQueue(st);
  };
  P.seasonEnd = function (st) { // vor dem Altern / Saisonwechsel
    var club = uc(st);
    P.ylSeasonEnd(st);
    if (club) { P.tvSeasonEnd(st, club); P.doRetirements(st); }
  };
  P.newSeason = function (st) { // nach st.season++
    var club = uc(st); if (!club) return;
    P.alumniSeason(st, club);
    var d = club.tvDeal; if (d && d.until < st.season) { club.tvDeal = null; news(st, 'TV-Vertrag ausgelaufen', 'Der Vertrag mit ' + d.name + ' ist beendet. Ab sofort gilt die normale Zentralvermarktung – neue Angebote im Vereinsmanagement.', 'finanzen'); }
    W.youthOf(st, club.id).forEach(function (p) { if (p.yb && p.yb.until <= tick(st)) p.yb = null; });
  };
})(RFM);
