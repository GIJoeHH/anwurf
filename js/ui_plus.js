// Oberfläche zum Vereinsausbau: TV-Vertrag, Nachwuchs (Jugendligen, Vereinsphilosophie, Förderung, Trainerstab),
// Leihspieler mit Betreuung, Leihverhandlung und Gespräch zum Karriereende. In beiden Spielen gleich.
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, M = R.match, U = R.ui, P = R.plus, esc = R.esc, money = R.fmtMoney;
  if (!U || !P) return;
  function tick(st) { return st.tick || 0; }
  function pill(t, cls) { return '<span class="pill ' + (cls || '') + '">' + t + '</span>'; }
  function lname(c) { return (c && D.leagueNames[W.lk ? W.lk(c) : c.league]) || ''; }
  function pct(f) { return (f >= 0 ? '+' : '') + Math.round(f * 100) + ' %'; }

  // =====================================================================
  // TV-Vertrag
  // =====================================================================
  U.tvCard = function (st, c) {
    var d = P.tvActive(st, c), v = P.tvSeason(st, c);
    return '<div class="ccard' + (d ? '' : ' attn') + '" data-act="tvOpen" tabindex="0" role="button"><div class="cc-top"><div class="ic-tile ' + (d ? 'ok' : 'neutral') + '">' + U.lc('megaphone', 19) + '</div><div class="cc-t"><b>TV-Vertrag</b><span>' + (d ? P.TV_KINDS[d.kind].n + ' bis ' + (d.until + 1) : 'Zentralvermarktung') + '</span></div>' + (d ? pill(d.until === st.season ? 'läuft aus' : 'aktiv', d.until === st.season ? 'warn' : 'ok') : pill('Angebote', 'warn')) + '</div>' +
      (d ? '<div class="cc-name">' + esc(d.name) + '</div>' : '') + '<div class="cc-val"><b>' + money(v) + '</b><small>/Saison</small></div><div class="cc-sub">' + (d ? esc(P.TV_KINDS[d.kind].d) : 'Eigenen TV-Deal verhandeln: fest, erfolgsabhängig oder langfristig') + '</div></div>';
  };
  U.acts.tvOpen = function () {
    var st = U.st, c = U.club(), can = U.can('business'), d = P.tvActive(st, c), base = P.tvBase(c);
    var h = '<p class="small">Ohne eigenen Vertrag erhält der Verein die Standard-Zentralvermarktung der Liga: <b>' + money(base) + '</b> pro Saison. Ausgezahlt wird wie bei den Sponsoren in 34 Wochenraten nach den Spieltagen.</p>';
    if (d) {
      h += '<div class="plus-card on"><h3>' + U.lc('megaphone', 15) + ' ' + esc(d.name) + ' · ' + P.TV_KINDS[d.kind].n + '</h3><p class="small">' + esc(P.TV_KINDS[d.kind].d) + '</p><p class="small">Laufzeit bis Saison ' + d.until + '/' + String(d.until + 1).slice(2) + ' · diese Saison <b>' + money(P.tvSeason(st, c)) + '</b>' + (d.kind === 'erfolg' ? ' + Prämie nach Tabellenplatz (bis ' + money(Math.round(base * d.bonus)) + ')' : '') + '</p></div>';
      U.modal(U.lc('megaphone', 16) + ' TV-Vertrag', h, '<button class="primary" data-act="closeModal">Schließen</button>');
      return;
    }
    var offers = P.tvOffers(st, c);
    h += '<div class="cmp">' + offers.map(function (o) {
      var K = P.TV_KINDS[o.kind];
      return '<div class="cmp-card' + (o.kind === 'fix' ? ' best' : '') + '"><b>' + esc(o.name) + '</b><span class="tag">' + K.n + '</span><table>' +
        '<tr><td>Pro Saison</td><td>' + money(o.seasonValue) + '</td></tr><tr><td>Laufzeit</td><td>' + o.years + ' J.</td></tr>' +
        (o.bonus ? '<tr><td>Prämie (Platz 1)</td><td>' + money(Math.round(base * o.bonus)) + '</td></tr>' : '') + (o.hand ? '<tr><td>Handgeld</td><td>' + money(o.hand) + '</td></tr>' : '') +
        '</table><p class="small muted">' + esc(K.d) + '</p>' + (can ? '<button class="primary" data-act="tvSign" data-k="' + o.id + '">Unterschreiben</button>' : '') + '</div>';
    }).join('') + '</div>';
    U.modal(U.lc('megaphone', 16) + ' TV-Vertrag – Angebote', h, '<button data-act="closeModal">Später</button>', true);
  };
  U.acts.tvSign = function (d) { var r = P.signTv(U.st, U.club(), d.k); U.closeModal(); U.render(); U.toast(r ? 'TV-Vertrag unterschrieben.' : 'Nicht möglich.'); };

  // =====================================================================
  // Nachwuchs: Reiter
  // =====================================================================
  var baseNachwuchs = U.screens.nachwuchs._base || U.screens.nachwuchs;
  var YT = [['kader', 'users', 'Talente'], ['ligen', 'trophy', 'Jugendligen'], ['philosophie', 'target', 'Vereinsphilosophie'], ['foerderung', 'sparkles', 'Förderung'], ['stab', 'graduation-cap', 'Ehemalige im Verein']];
  U.screens.nachwuchs = function () {
    var tab = U.p.ytab || 'kader';
    var bar = '<div class="seg" style="margin:0 0 14px">' + YT.map(function (t) { return '<button class="' + (tab === t[0] ? 'on' : '') + '" data-act="yTab" data-k="' + t[0] + '">' + U.lc(t[1], 14) + ' ' + t[2] + '</button>'; }).join('') + '</div>';
    if (tab === 'kader') {
      var h = baseNachwuchs();
      var cut = h.indexOf('<div class="panel tight">');
      var own = U.canYouth() ? '<div class="row" style="margin:0 0 10px;gap:8px"><button class="secondary" data-act="yOwnNew">' + U.lc('user-plus', 15) + ' Eigenen Spieler in die Jugend</button><span class="muted small">Z. B. dich selbst – spielt dann in der Jugendliga mit.</span></div>' : '';
      return cut > 0 ? h.slice(0, cut) + bar + own + h.slice(cut) : bar + own + h;
    }
    var st = U.st, c = U.club();
    var head = '<div class="page-h"><div><h1 class="row" style="gap:10px">' + U.lc('graduation-cap', 26) + ' Nachwuchs</h1><div class="page-sub">' + esc(c.name) + ' · Ausbildung, Jugendligen und Förderung</div></div></div>' + bar;
    return head + ({ ligen: yLeagues, philosophie: yPlan, foerderung: yPush, stab: yStaff }[tab])(st, c);
  };
  U.screens.nachwuchs._base = baseNachwuchs;
  U.acts.yTab = function (d) { U.p.ytab = d.k; U.render(); };

  // ---------- Jugendligen ----------
  function yLeagues(st, c) {
    var y = P.ensureYL(st), h = '<div class="grid g2">';
    P.GROUPS.forEach(function (g) {
      var G = y.groups[g], t = P.ylTable(st, g), me = t.map(function (r) { return r.id; }).indexOf(c.id) + 1, str = P.ylStrength(st, c, g);
      h += '<div class="panel tight"><div class="panel-h" style="padding:14px 16px 0"><h2>' + U.lc('trophy', 17) + ' ' + esc(G.name) + '</h2>' + pill('Platz ' + me, me <= 3 ? 'ok' : me >= t.length - 2 ? 'bad' : '') + '</div>' +
        '<p class="muted small" style="padding:0 16px">Spieltag ' + G.round + ' von ' + G.sched.length + ' · Teamstärke ' + Math.round(str.s) + ' · ' + str.xi.length + (str.xi.length === 1 ? ' eigener Spieler' : ' eigene Spieler') + ' im Jahrgang</p>' +
        '<div style="overflow-x:auto"><table class="t yl-t"><tr><th>#</th><th>Verein</th><th class="num">S-U-N</th><th class="num">Tore</th><th class="num">Pkt</th></tr>' +
        t.map(function (r, i) { var cl = st.clubs[r.id]; return '<tr class="' + (r.id === c.id ? 'yl-me' : '') + '"><td>' + (i + 1) + '</td><td>' + (cl ? U.crest(cl, 16) + ' ' + esc(cl.short) : '–') + '</td><td class="num">' + r.w + '-' + r.d + '-' + r.l + '</td><td class="num">' + r.gf + ':' + r.ga + '</td><td class="num"><b>' + r.pts + '</b></td></tr>'; }).join('') + '</table></div>';
      if (G.last.length) h += '<div class="small" style="padding:8px 16px">' + G.last.map(function (m) { var a = st.clubs[m.h], b = st.clubs[m.a]; return m.r + '. ' + esc(a ? a.short : '') + ' – ' + esc(b ? b.short : '') + ' <b>' + m.gh + ':' + m.ga + '</b>'; }).join(' · ') + '</div>';
      var pl = W.youthOf(st, c.id).filter(function (p) { return P.groupOf(p) === g && p.ys && p.ys.s === st.season; }).sort(function (a, b) { return b.ys.g - a.ys.g || b.ys.a - a.ys.a; }).slice(0, 5);
      if (pl.length) h += '<div class="small" style="padding:0 16px 12px"><b>Beste Spieler:</b> ' + pl.map(function (p) { return esc(W.playerName(p)) + ' (' + p.ys.a + ' Sp., ' + p.ys.g + ' T.)'; }).join(' · ') + '</div>';
      h += '</div>';
    });
    h += '</div>';
    var hist = (st.ylgHist || []).slice().reverse().slice(0, 8);
    if (hist.length) h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('medal', 17) + ' Frühere Spielzeiten</h2>' + hist.map(function (x) { var ch = st.clubs[x.champ]; return '<div class="small">' + x.season + '/' + String(x.season + 1).slice(2) + ' · ' + esc(P.CFG.youthName[x.g]) + ': Platz ' + x.pos + (x.champ === c.id ? ' ' + pill('Meister', 'ok') : ' · Meister ' + esc(ch ? ch.short : '–')) + '</div>'; }).join('') + '</div>';
    h += '<p class="muted small" style="margin-top:10px">Wer in der Jugendliga regelmäßig spielt, entwickelt sich schneller. Die Teamstärke hängt von den Talenten, dem Nachwuchszentrum, der Vereinsphilosophie und der Förderung ab.</p>';
    return h;
  }

  // ---------- Vereinsphilosophie ----------
  function yPlan(st, c) {
    var y = c.youthPlan, t = c.tactic, can = U.canYouth(), dr = (U.yPlanDraft && U.yPlanDraft.cid === c.id && U.yPlanDraft) || (U.yPlanDraft = y ? { formation: y.formation, style: y.style, pressing: y.pressing, tempo: y.tempo } : { formation: t.formation, style: t.style, pressing: t.pressing, tempo: t.tempo }); dr.cid = c.id;
    function seg(k, labels) { return '<div style="margin-top:10px"><div class="muted small">' + { style: 'Spielweise', pressing: M.PRESS[1] === 'Normal' && M.PRESS[0] === 'Abwartend' ? 'Abwehrverhalten' : 'Pressing', tempo: 'Tempo' }[k] + '</div><div class="seg">' + labels.map(function (l, i) { return '<button class="' + (+dr[k] === i ? 'on' : '') + '" data-act="yPlanSet" data-k="' + k + '" data-v="' + i + '"' + (can ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div></div>'; }
    var f = y ? 0.04 + 0.02 * P.planYears(st, c) + 0.06 * P.planMatch(c) : 0;
    var h = '<div class="grid g2"><div class="panel"><h2>' + U.lc('target', 17) + ' Abwehrsystem und Grundtaktik der Jugend</h2><p class="small">Alle Jugendmannschaften spielen und trainieren nach diesem Konzept. Talente lernen das System von klein auf und kommen besser ausgebildet bei den Profis an.</p>' +
      '<div class="muted small">Abwehrsystem</div><select data-chg="yPlanForm"' + (can ? '' : ' disabled') + '>' + Object.keys(D.formations).map(function (k) { return '<option value="' + k + '"' + (dr.formation === k ? ' selected' : '') + '>' + k + '</option>'; }).join('') + '</select>' +
      seg('style', M.STYLE) + seg('pressing', M.PRESS) + seg('tempo', M.TEMPO) +
      (can ? '<div class="row" style="margin-top:14px;gap:8px"><button class="primary" data-act="yPlanSave">' + U.lc('check', 15) + ' Philosophie festlegen</button><button data-act="yPlanCopy">Von den Profis übernehmen</button>' + (y ? '<button class="ghost" data-act="yPlanOff">Aufheben</button>' : '') + '</div>' : '') + '</div>';
    h += '<div class="panel"><h2>' + U.lc('trending-up', 17) + ' Wirkung</h2>' + (y ? '<p>Aktuell: <b>' + esc(y.formation) + '</b>, ' + M.STYLE[y.style] + ', ' + M.PRESS[y.pressing] + ', ' + M.TEMPO[y.tempo] + ' · seit ' + y.since + '/' + String(y.since + 1).slice(2) + '</p>' : '<p class="muted">Noch keine Vereinsphilosophie festgelegt.</p>') +
      '<table class="t"><tr><td>Entwicklung der Talente</td><td class="num"><b class="pos">' + pct(f) + '</b></td></tr>' +
      '<tr><td>Passt zu den Profis</td><td class="num">' + Math.round(P.planMatch(c) * 100) + ' %</td></tr><tr><td>Eingespielt (Jahre)</td><td class="num">' + P.planYears(st, c) + ' / 3</td></tr></table>' +
      '<ul class="small"><li>Grundbonus +4 %, je Jahr mit gleichem System +2 % (bis 3 Jahre).</li><li>Je mehr die Philosophie der Taktik der Profis entspricht, desto mehr (+6 % bei voller Übereinstimmung).</li><li>Die Grundtaktik fördert passende Fähigkeiten: offensiv → Abschluss und Technik, hohes ' + (M.PRESS[0] === 'Abwartend' ? 'aggressives Abwehrverhalten' : 'Pressing') + ' → Ausdauer und Tempo, schnelles Spiel → Tempo und Passspiel.</li><li>Die Jugendteams werden in der Jugendliga stärker.</li></ul></div></div>';
    return h;
  }
  U.acts.yPlanForm = function (d, el) { U.yPlanDraft.formation = el.value; };
  U.acts.yPlanSet = function (d) { U.yPlanDraft[d.k] = +d.v; U.render(); };
  U.acts.yPlanCopy = function () { var t = U.club().tactic; U.yPlanDraft = { cid: U.club().id, formation: t.formation, style: t.style, pressing: t.pressing, tempo: t.tempo }; U.render(); };
  U.acts.yPlanSave = function () { P.setPlan(U.st, U.club(), U.yPlanDraft); U.render(); U.toast('Vereinsphilosophie festgelegt.'); };
  U.acts.yPlanOff = function () { P.setPlan(U.st, U.club(), null); U.yPlanDraft = null; U.render(); U.toast('Vereinsphilosophie aufgehoben.'); };

  // ---------- Förderung ----------
  function yPush(st, c) {
    var can = U.canYouth(), t = tick(st), youth = W.youthOf(st, c.id).sort(function (a, b) { return b.pot - a.pot; });
    var h = '<div class="plus-grid" style="margin-bottom:14px">' + ['balljungen', 'profitrainer'].map(function (k) {
      var d = P.PUSH[k], a = P.pushState(c)[k], act = P.teamPushActive(st, c, k), ready = P.teamPushReady(st, c, k);
      return '<div class="plus-card' + (act ? ' on' : '') + '"><h3>' + U.lc(k === 'balljungen' ? 'flag' : 'users', 15) + ' ' + d.n + '</h3><p class="small muted">' + esc(d.d) + '</p>' +
        (act ? pill('läuft noch ' + (a.until - t) + ' Wo.', 'ok') : ready ? (can ? '<button class="primary sm" data-act="yTeamPush" data-k="' + k + '">Ganze Jugend</button>' : '') : pill('wieder in ' + (a.ready - t) + ' Wo.')) + '</div>';
    }).join('') + '</div>';
    h += '<div class="panel tight"><div class="panel-h" style="padding:14px 16px 0"><h2>' + U.lc('sparkles', 17) + ' Einzelne Talente fördern</h2><span class="muted small">Bei den Profis: ' + P.prosCount(st, c) + ' / ' + P.PUSH.pros.max + '</span></div>' +
      '<p class="small muted" style="padding:0 16px">' + esc(P.PUSH.pros.d) + ' ' + esc(P.PUSH.mentor.d) + '</p>';
    h += youth.length ? '<table class="t"><tr><th>Talent</th><th>Pos</th><th class="num">Alter</th><th class="num">Stärke/Pot.</th><th class="num">Entwicklung</th><th>Förderung</th><th></th></tr>' + youth.map(function (p) {
      var on = p.yb && p.yb.until > t, m = on && p.yb.mentor && st.players[p.yb.mentor];
      return '<tr><td><a data-act="playerInfo" data-id="' + p.id + '"><b>' + esc(W.playerName(p)) + '</b></a></td><td>' + U.posTag(p.pos) + '</td><td class="num">' + p.age + '</td><td class="num">' + p.ovr + ' / ' + p.pot + '</td><td class="num">' + pct(P.devF(st, c, p) - 1) + '</td>' +
        '<td>' + (on ? pill(P.PUSH[p.yb.k].n + (m ? ' (' + esc(m.last) + ')' : '') + ' · ' + (p.yb.until - t) + ' Wo.', 'ok') : '<span class="muted small">–</span>') + '</td>' +
        '<td style="white-space:normal;min-width:150px">' + (can && !on ? '<div class="plus-acts"><button class="sm" data-act="yPros" data-id="' + p.id + '">Mit Profis trainieren</button><button class="sm" data-act="yMentor" data-id="' + p.id + '">Einzeltraining …</button></div>' : '') + '</td></tr>';
    }).join('') + '</table>' : '<div style="padding:16px">' + U.empty('graduation-cap', 'Keine Talente in der Jugend.') + '</div>';
    return h + '</div>';
  }
  U.acts.yTeamPush = function (d) { var r = P.pushTeam(U.st, U.club(), d.k); U.render(); U.toast(r.ok ? P.PUSH[d.k].n + ': los geht’s!' : r.why); };
  U.acts.yPros = function (d) { var st = U.st, r = P.pushPlayer(st, U.club(), st.players[d.id], 'pros'); U.render(); U.toast(r.ok ? 'Trainiert jetzt 4 Wochen bei den Profis mit.' : r.why); };
  U.acts.yMentor = function (d) {
    var st = U.st, c = U.club(), p = st.players[d.id];
    var pros = W.squad(st, c.id).filter(function (x) { return x.pos === p.pos && !x.youth; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 6);
    if (!pros.length) pros = W.squad(st, c.id).filter(function (x) { return !x.youth; }).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 6);
    U.modal('Einzeltraining für ' + esc(W.playerName(p)), '<p class="small">Welcher Profi betreut ' + esc(p.first) + ' sechs Wochen lang?</p><div class="opt-list">' + pros.map(function (x) { return '<button class="opt-card" data-act="yMentorGo" data-id="' + p.id + '" data-m="' + x.id + '"><b>' + esc(W.playerName(x)) + '</b> <span class="muted">' + x.pos + ', ' + x.age + ' J., Stärke ' + x.ovr + '</span></button>'; }).join('') + '</div>', '<button data-act="closeModal">Abbrechen</button>');
  };
  U.acts.yMentorGo = function (d) { var st = U.st, r = P.pushPlayer(st, U.club(), st.players[d.id], 'mentor', d.m); U.closeModal(); U.render(); U.toast(r.ok ? 'Einzeltraining vereinbart.' : r.why); };

  // ---------- Ehemalige im Verein ----------
  function yStaff(st, c) {
    var al = P.alumni(c), can = U.can('business');
    var h = '<div class="panel"><h2>' + U.lc('graduation-cap', 17) + ' Ehemalige Spieler mit Aufgabe im Verein</h2><p class="small muted">Besondere Spieler (viele Einsätze für den Verein, Eigengewächse, Kapitäne oder Topspieler) können nach dem Karriereende eine Rolle übernehmen. Das Gespräch startet automatisch gegen Saisonende oder über „Karriereende besprechen“ im Spielerprofil (ab 31 Jahren mit auslaufendem Vertrag).</p>';
    h += al.length ? '<table class="t"><tr><th>Name</th><th>Aufgabe</th><th class="num">Wirkung</th><th class="num">Gehalt</th><th class="num">seit</th><th></th></tr>' + al.map(function (a) {
      var R0 = P.ROLES[a.role]; return '<tr><td><b>' + esc(a.name) + '</b>' + (a.apps ? ' <span class="muted small">' + a.apps + ' Einsätze</span>' : '') + '</td><td>' + U.lc(R0.ic, 14) + ' ' + R0.n + '</td><td class="num">' + (a.role === 'botschafter' ? '+' + a.f + ' Ansehen/Saison' : pct(a.f)) + '</td><td class="num">' + money(a.wage) + '</td><td class="num">' + a.since + '</td><td>' + (can ? '<button class="sm ghost" data-act="alumniOff" data-k="' + a.id + '">Trennen</button>' : '') + '</td></tr>';
    }).join('') + '</table>' : U.empty('users', 'Noch niemand. Wer seine Karriere bei Ihnen beendet, kann hier Jugendtrainer, Co-Trainer oder Markenbotschafter werden.');
    var cand = W.squad(st, c.id).filter(function (p) { return P.canTalkRetire(st, p); });
    if (cand.length) h += '<h3 style="margin-top:14px">Spieler vor dem Karriereende</h3>' + cand.map(function (p) { return '<div class="row between small" style="padding:4px 0"><span><b>' + esc(W.playerName(p)) + '</b> · ' + p.age + ' J. · ' + P.clubApps(st, p, c) + ' Einsätze' + (P.isSpecial(st, p, c) ? ' ' + pill('besonderer Spieler', 'ok') : '') + '</span>' + (can ? '<button class="sm" data-act="retireTalk" data-id="' + p.id + '">Gespräch führen</button>' : '') + '</div>'; }).join('');
    var soon = W.squad(st, c.id).filter(function (p) { return p.retireAfter === st.season; });
    if (soon.length) h += '<h3 style="margin-top:14px">Beenden zum Saisonende ihre Karriere</h3>' + soon.map(function (p) { return '<div class="small">' + esc(W.playerName(p)) + (p.retireRole ? ' → ' + P.ROLES[p.retireRole].n : '') + '</div>'; }).join('');
    return h + '</div>';
  }
  U.acts.alumniOff = function (d) { U.confirm('Trennen', 'Die Zusammenarbeit beenden?', function () { P.dismissAlumni(U.st, U.club(), d.k); U.render(); }); };
  U.acts.retireTalk = function (d) {
    var st = U.st, p = st.players[d.id]; if (!p || !P.canTalkRetire(st, p)) return;
    if (st.pendingEvent) { U.toast('Erst die offene Ereigniskarte entscheiden.'); return; }
    st.pendingEvent = P.retireEvent(st, p, true); U.closeModal(); U.showEvent();
  };

  // ---------- Eigener Spieler in der Jugend ----------
  U.acts.yOwnNew = function () {
    var pos = Object.keys(D.posWeights);
    U.modal(U.lc('user-plus', 16) + ' Eigenen Spieler in die Jugend', '<p class="small">Der Spieler kommt ins Nachwuchszentrum und spielt in der passenden Jugendliga (bis 17 Jahre B-Jugend, ab 18 A-Jugend).</p>' +
      U.field('Vorname', '<input type="text" id="yoFirst" maxlength="30" value="">') + U.field('Nachname', '<input type="text" id="yoLast" maxlength="30" value="">') +
      U.field('Position', '<select id="yoPos">' + pos.map(function (k) { return '<option value="' + k + '">' + esc((D.posNames && D.posNames[k]) || k) + '</option>'; }).join('') + '</select>') +
      U.field('Alter', '<input type="number" id="yoAge" min="15" max="19" value="16">') + U.field('Stärke (25–75)', '<input type="number" id="yoOvr" min="25" max="75" value="45">') + U.field('Potenzial (bis 99)', '<input type="number" id="yoPot" min="30" max="99" value="75">'),
      '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="yOwnGo">Anlegen</button>');
  };
  U.acts.yOwnGo = function () {
    function v(id) { var e = document.getElementById(id); return e ? e.value : ''; }
    if (!v('yoLast').trim()) { U.toast('Bitte einen Nachnamen eingeben.'); return; }
    var p = P.createYouth(U.st, U.club(), { first: v('yoFirst').trim(), last: v('yoLast').trim(), pos: v('yoPos'), age: v('yoAge'), ovr: v('yoOvr'), pot: v('yoPot') });
    U.closeModal(); U.render(); U.toast(W.playerName(p) + ' ist jetzt in der Jugend (' + (P.groupOf(p) === 'u19' ? 'A' : 'B') + '-Jugend).');
  };

  // =====================================================================
  // Leihspieler
  // =====================================================================
  U.screens.leihen = function () {
    var st = U.st, c = U.club(), can = U.canYouth(), list = P.loanedOut(st, c);
    var h = '<div class="page-h"><div><h1 class="row" style="gap:10px">' + U.lc('refresh-cw', 26) + ' Leihspieler</h1><div class="page-sub">Verliehene Spieler betreuen – damit sie stärker zurückkommen</div></div></div>';
    h += '<div class="panel tight"><div class="panel-h" style="padding:14px 16px 0"><h2>' + U.lc('arrow-up-right', 17) + ' Verliehen (' + list.length + ')</h2><span class="muted small">Ausleihen über das Spielerprofil („Ausleihen“)</span></div>';
    h += list.length ? '<table class="t"><tr><th>Spieler</th><th>Leihverein</th><th>Rolle</th><th class="num">Einsätze</th><th class="num">Stärke</th><th class="num">Moral</th></tr>' + list.map(function (p) {
      var L = p.loan, to = st.clubs[p.clubId], due = P.loanDue(st, p), d = p.ovr - (L.ovr0 != null ? L.ovr0 : p.ovr), behind = L.minApps && p.stats.apps < due;
      var acts = can ? Object.keys(P.CARE).map(function (k) { var ok = P.careReady(st, p, k) && (k !== 'demand' || behind); return '<button class="sm" data-act="loanCare" data-id="' + p.id + '" data-k="' + k + '"' + (ok ? '' : ' disabled') + ' title="' + esc(P.CARE[k].d) + '">' + { call: 'Anrufen', visit: 'Besuchen', plan: 'Trainingsplan', demand: 'Einsatzzeit fordern' }[k] + '</button>'; }).join('') + (st.phase === 'winter' ? '<button class="sm ghost" data-act="loanRecall" data-id="' + p.id + '">Zurückholen</button>' : '') : '';
      return '<tr><td><a data-act="playerInfo" data-id="' + p.id + '"><b>' + esc(W.playerName(p)) + '</b></a> <span class="muted small">' + p.pos + ', ' + p.age + ' J.</span></td><td>' + (to ? U.crest(to, 16) + ' ' + esc(to.short) + ' <span class="muted small">' + esc(lname(to)) + '</span>' : '–') + '</td>' +
        '<td>' + (L.role ? P.LOAN_ROLES[L.role].n : '–') + '<div class="muted small">bis Saisonende ' + L.until + '/' + String(L.until + 1).slice(2) + '</div></td><td class="num"><span class="' + (behind ? 'neg' : 'pos') + '">' + p.stats.apps + '</span>' + (L.minApps ? ' <span class="muted small">Soll ' + due + ' / ' + L.minApps + '</span>' : '') + '</td>' +
        '<td class="num">' + p.ovr + (L.ovr0 != null ? ' <span class="' + (d > 0 ? 'pos' : d < 0 ? 'neg' : 'muted') + ' small">(' + (d >= 0 ? '+' : '') + d + ')</span>' : '') + '</td><td class="num">' + Math.round(p.morale || 0) + '</td></tr>' + (acts ? '<tr class="plus-sub"><td colspan="6"><div class="plus-acts">' + acts + '</div></td></tr>' : '');
    }).join('') + '</table>' : '<div style="padding:16px">' + U.empty('refresh-cw', 'Kein Spieler verliehen. Junge Spieler ohne Einsatzzeit entwickeln sich bei einem Leihverein mit Einsatzgarantie besser.') + '</div>';
    h += '</div><div class="grid g2" style="margin-top:14px"><div class="panel"><h2>' + U.lc('info', 17) + ' So kommen Leihspieler stärker zurück</h2><ul class="small"><li><b>Einsatzzeit</b> ist der wichtigste Faktor: Wer spielt, entwickelt sich bis zu 50 % schneller. Bei der Leihe deshalb eine Rolle mit Mindest-Einsätzen vereinbaren.</li><li><b>Trainingsplan:</b> einmal je Saison, beschleunigt die Entwicklung.</li><li><b>Anrufen und Besuchen</b> halten die Moral hoch.</li><li>Liegt der Leihverein unter der vereinbarten Einsatzzahl, kann einmal je Saison mehr Einsatzzeit gefordert werden. Wird die Garantie am Saisonende verfehlt, zahlt der Leihverein einen Ausgleich.</li><li>In der Winterpause kann ein Spieler vorzeitig zurückgeholt werden.</li></ul></div>';
    var hist = (st.loanHist || []).slice().reverse().slice(0, 10);
    h += '<div class="panel"><h2>' + U.lc('clock', 17) + ' Leihbilanzen</h2>' + (hist.length ? hist.map(function (x) { return '<div class="small">' + x.season + ' · <b>' + esc(x.name) + '</b> bei ' + esc(x.to) + ': ' + x.apps + (x.min ? '/' + x.min : '') + ' Einsätze, Stärke ' + (x.d >= 0 ? '+' : '') + x.d + '</div>'; }).join('') : '<p class="muted small">Noch keine abgeschlossenen Leihen.</p>') + '</div></div>';
    var inn = W.squad(st, c.id).filter(function (p) { return p.loan && p.loan.from !== c.id; });
    if (inn.length) h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('arrow-down-right', 17) + ' Ausgeliehen von anderen Vereinen (' + inn.length + ')</h2>' + inn.map(function (p) { var f = st.clubs[p.loan.from]; return '<div class="small"><a data-act="playerInfo" data-id="' + p.id + '"><b>' + esc(W.playerName(p)) + '</b></a> · von ' + esc(f ? f.short : '–') + ' bis Saisonende</div>'; }).join('') + '</div>';
    return h;
  };
  U.acts.loanCare = function (d) { var st = U.st, r = P.loanCare(st, U.club(), st.players[d.id], d.k); U.render(); U.toast(r.ok ? r.msg : r.why, 4000); };
  U.acts.loanRecall = function (d) { var st = U.st, p = st.players[d.id]; U.confirm('Zurückholen', esc(W.playerName(p)) + ' vorzeitig zurückholen?', function () { var r = P.loanRecall(st, U.club(), p); U.render(); U.toast(r.ok ? 'Spieler ist zurück.' : r.why); }); };

  // ---------- Leihverhandlung (ersetzt die Sofort-Leihe) ----------
  U.acts.loanOut = function (d) {
    var st = U.st, p = st.players[d.id];
    var cands = P.loanCandidates(st, p);
    if (!cands.length) { U.toast('Kein Verein interessiert.'); return; }
    U.loanNego = { pid: p.id, to: cands[0].id, role: cands[0].gap > 3 ? 'stamm' : 'rotation', share: 0.5, msg: '', cands: cands.map(function (x) { return x.id; }) };
    loanModal();
  };
  function loanModal() {
    var st = U.st, n = U.loanNego, p = st.players[n.pid];
    var cands = P.loanCandidates(st, p).filter(function (x) { return n.cands.indexOf(x.id) >= 0; });
    var h = '<p class="small">Wohin soll ' + esc(W.playerName(p)) + ' (' + p.pos + ', ' + p.age + ' J., Stärke ' + p.ovr + ') ausgeliehen werden? Vereinbaren Sie eine Rolle – wer regelmäßig spielt, kommt stärker zurück.</p>';
    h += '<div class="opt-list">' + cands.map(function (x) {
      var cl = x.club, exp = x.gap > 3 ? 'Stammspieler' : x.gap > -2 ? 'Rotation' : 'Ergänzung';
      return '<button class="opt-card' + (n.to === x.id ? ' on' : '') + '" data-act="loanTo" data-k="' + x.id + '"' + (n.to === x.id ? ' style="border-color:var(--ok,#22c55e)"' : '') + '>' + U.crest(cl, 18) + ' <b>' + esc(cl.name) + '</b> <span class="muted">' + esc(lname(cl)) + ' · Platz ' + x.rank + ' auf seiner Position · Einschätzung: ' + exp + '</span></button>';
    }).join('') + '</div>';
    h += '<div style="margin-top:10px"><div class="muted small">Rolle beim Leihverein</div><div class="seg">' + Object.keys(P.LOAN_ROLES).map(function (k) { return '<button class="' + (n.role === k ? 'on' : '') + '" data-act="loanRole" data-k="' + k + '">' + P.LOAN_ROLES[k].n + '</button>'; }).join('') + '</div><div class="small muted">' + esc(P.LOAN_ROLES[n.role].d) + (P.minApps(n.role) ? ' Mindestens ' + P.minApps(n.role) + ' Ligaspiele.' : '') + '</div></div>';
    h += '<div style="margin-top:10px"><div class="muted small">Der Leihverein zahlt vom Gehalt (' + money(p.wage) + '/Saison)</div><div class="seg">' + P.SHARES.map(function (s) { return '<button class="' + (n.share === s ? 'on' : '') + '" data-act="loanShare" data-v="' + s + '">' + Math.round(s * 100) + ' %</button>'; }).join('') + '</div><div class="small muted">Je mehr Gehalt Sie selbst übernehmen, desto eher sagt der Verein eine Einsatzgarantie zu.</div></div>';
    if (n.msg) h += '<div class="note ' + (n.ok ? 'ok' : 'bad') + '" style="margin-top:10px">' + esc(n.msg) + '</div>';
    U.modal(U.lc('refresh-cw', 16) + ' Leihgeschäft verhandeln', h, '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="loanAsk">Anfragen</button>', true);
  }
  U.acts.loanTo = function (d) { U.loanNego.to = d.k; U.loanNego.msg = ''; loanModal(); };
  U.acts.loanRole = function (d) { U.loanNego.role = d.k; U.loanNego.msg = ''; loanModal(); };
  U.acts.loanShare = function (d) { U.loanNego.share = +d.v; U.loanNego.msg = ''; loanModal(); };
  U.acts.loanAsk = function () {
    var st = U.st, n = U.loanNego, p = st.players[n.pid], to = st.clubs[n.to];
    var r = P.loanOut(st, p, to, n.role, n.share);
    if (!r.ok) { n.msg = r.why; n.ok = false; loanModal(); return; }
    U.closeModal(); U.loanNego = null; U.render(); U.toast(r.why, 4000);
  };
})(RFM);
