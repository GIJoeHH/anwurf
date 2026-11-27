// Nationalmannschaft 2.0 – Oberfläche (gemeinsam für ANPFIFF und ANWURF):
// Menüpunkt „Nationalmannschaft“ (Status, Trainer, Rolle, Termine, Tabellen/Turnierbaum, Statistik, Prämien, Beziehungen, Historie),
// interaktive Länderspiele im Matchcenter der Spielerkarriere und zustandsabhängige Szenenbilder.
(function (R) {
  var U = R.ui, NT = R.nt, C = R.pc, X = R.cx, CM = R.cm, L = R.life, S = R.season; if (!U || !NT || !C) return;
  var esc = R.esc, money = R.fmtMoney, HB = X.HB, SW = X.SW;
  function on(st) { return !!(st && st.pc && st.pc.cx && C.active(st)); }
  function nn(code) { var n = NT.nat(code); return n ? n.name : code; }
  // kleine Länderflagge vor dem Namen
  function nf(code) { var sv = NT.flagSvg && NT.flagSvg(code); return (sv ? '<span style="display:inline-block;width:18px;height:12px;vertical-align:-1px;margin-right:5px;border-radius:2px;overflow:hidden;box-shadow:0 0 0 1px rgba(0,0,0,.15)">' + sv.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ') + '</span>' : '') + esc(nn(code)); }
  function num(v, d) { return v == null ? '–' : Number(v).toFixed(d || 0).replace('.', ','); }

  if (typeof document !== 'undefined' && !document.getElementById('nt-style')) {
    var css = document.createElement('style'); css.id = 'nt-style';
    css.textContent = [
      '.nt-hero{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.nt-hero .flag{width:64px;height:44px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.25)}',
      '.nt-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px;margin-top:10px}.nt-kpis div{background:var(--panel2,rgba(127,127,127,.08));border-radius:10px;padding:8px 10px}.nt-kpis span{display:block;font-size:11px;opacity:.7}.nt-kpis b{font-size:18px}',
      '.nt-role{display:flex;gap:4px;flex-wrap:wrap;margin-top:8px}.nt-role i{font-style:normal;font-size:11px;padding:3px 7px;border-radius:999px;background:rgba(127,127,127,.12)}.nt-role i.on{background:var(--accent,#2563eb);color:#fff}',
      '.nt-cal td.me{font-weight:700}.nt-tag{font-size:11px;padding:2px 6px;border-radius:6px;background:rgba(127,127,127,.15)}.nt-tag.in{background:#16a34a;color:#fff}.nt-tag.out{background:#9ca3af;color:#fff}',
      '.nt-bracket{display:flex;gap:10px;overflow-x:auto;padding-bottom:6px}.nt-bracket .rd{min-width:150px}.nt-bracket .m{border:1px solid rgba(127,127,127,.25);border-radius:8px;padding:4px 6px;margin:4px 0;font-size:12px}.nt-bracket .m.me{border-color:var(--accent,#2563eb)}.nt-bracket .w{font-weight:700}',
      '.nt-grp{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}.nt-grp table{width:100%;table-layout:auto}.nt-grp td,.nt-grp th{white-space:nowrap}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // ---------- Szenenbilder (SVG, je Zustand: Eröffnung / Reaktion / Abschluss) ----------
  var NTS = { nt_call: ['#0f172a', '#2563eb', '📞', '📱', '🥹'], nt_travel: ['#1e293b', '#38bdf8', '✈️', '🧳', '🏨'], nt_hotel: ['#312e81', '#818cf8', '🏨', '🛏️', '🌙'], nt_train: ['#065f46', '#10b981', HB ? '🤾' : '⚽', '💪', '🧊'],
    nt_anthem: ['#7c2d12', '#f59e0b', '🎶', '🫡', '🥲'], nt_goal: ['#14532d', '#22c55e', HB ? '🤾' : '⚽', '🙌', '🥳'], nt_pen: ['#1f2937', '#6b7280', '🎯', '😮‍💨', '⚖️'], nt_cheer: ['#78350f', '#facc15', '🙌', '🎉', '🥇'],
    nt_out: ['#1f2937', '#475569', '😞', '🫂', '🌧️'], nt_press: ['#831843', '#ec4899', '🎙️', '📸', '📰'], nt_phone: ['#0c4a6e', '#0ea5e9', '📱', '💬', '❤️'], nt_home: ['#134e4a', '#14b8a6', '🏡', '🤗', '🛋️'],
    nt_title: ['#713f12', '#facc15', '🏆', '🎊', '🥂'], nt_fans: ['#7c2d12', '#f97316', '📣', '🧣', '🎆'], nt_retire: ['#334155', '#94a3b8', '👋', '🎖️', '🌅'], nt_youth: ['#065f46', '#34d399', '🎽', '🌱', '⭐'], nt_stadium: ['#14532d', '#22c55e', '🏟️', '🔥', '🌌'] };
  var baseSvg = U.lifeSvg;
  U.lifeSvg = function (name) {
    var key = String(name || ''), st2 = /_r$/.test(key) ? 1 : /_c$/.test(key) ? 2 : 0, base = key.replace(/_(r|c)$/, ''), d = NTS[base]; if (!d) return baseSvg(name);
    var id = 'n' + Math.floor(Math.random() * 1e6), c1 = d[0], c2 = d[1], emo = d[2 + st2];
    return '<svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + (st2 === 2 ? c1 : c2) + '"/></linearGradient></defs>' +
      '<rect width="320" height="140" fill="url(#' + id + ')"/><circle cx="' + (60 + st2 * 100) + '" cy="24" r="66" fill="#fff" opacity=".08"/><rect x="0" y="104" width="320" height="36" fill="#000" opacity=".16"/>' +
      '<g opacity=".35"><rect x="24" y="22" width="44" height="28" rx="3" fill="#fff"/><rect x="24" y="22" width="44" height="9" fill="' + c2 + '"/></g>' +
      '<text x="160" y="86" text-anchor="middle" font-size="58">' + emo + '</text></svg>';
  };

  // ---------- Navigation ----------
  var baseNav = U.navItems;
  U.navItems = function () {
    var list = baseNav(), st = U.st; if (!on(st)) return list;
    var i = -1; list.forEach(function (it, k) { if (it[0] === 'pmedien') i = k; });
    var nt = NT.ensure(st), badge = NT.pending(st) && !(U.pcm && U.pcm.fx && U.pcm.fx.nt) ? 1 : 0, item = ['pnati', 'flag', 'Nationalmannschaft', badge, ''];
    if (i >= 0) list.splice(i + 1, 0, item); else list.push(item);
    return list;
  };

  // ---------- Länderspiel interaktiv ----------
  var baseNext = U.acts.next;
  U.acts.next = function () {
    var st = U.st;
    if (on(st) && !U.pcm && !U.busy && !U.autoRun && !st.pendingEvent && CM && CM.mode(st) !== 'aus' && U.screen !== 'bericht' && !(S.planEventOpen && S.planEventOpen(st))) {
      var e = NT.pending(st);
      if (e) { U.ntStart(st, e); return; }
    }
    return baseNext.apply(this, arguments);
  };
  U.ntStart = function (st, e) {
    // läuft das Länderspiel schon? dann zurück ins laufende Spiel statt neu anpfeifen
    if (U.pcm) { U.go('pspiel'); return; }
    // nach einem Neuladen mitten im Spiel: nicht neu starten, sondern das Ergebnis simulieren
    if (e.live) { NT.play(st, e); U.autosave(); U.render(); U.toast('Das Länderspiel wurde zu Ende simuliert.'); return; }
    var m = NT.createMatch(st, e), p = C.player(st), s = m.ntSide;
    if (m.played[p.id] == null && m.bench[s].indexOf(p.id) < 0) { NT.play(st, e); U.autosave(); U.render(); return; }
    NT.swapIn(st, m); CM.plan(m, st);
    e.live = true; U.autosave();
    U.pcm = { m: m, fx: { key: 'nt_' + e.key, ntKey: e.key, nt: true, h: m.clubs[0], a: m.clubs[1], comp: 'nt', neutral: e.kind === 'tour', label: e.label }, s: s, inst: null, last: null, fast: false };
    U.go('pspiel');
  };
  U.ntAfter = function (res) {
    var st = U.st; U.render(); if (!res) return;
    var e = res.e, nt = NT.ensure(st), r = e.res.join(':') + (e.pens ? ' (i.E. ' + e.pens.join(':') + ')' : '');
    var msg = e.label + ' gegen ' + nn(e.opp) + ': ' + r + '. ' + (res.played ? 'Deine Note: ' + num(res.rating, 1) + (res.goals ? ', ' + res.goals + ' ' + (res.goals === 1 ? SW.goal : SW.goals) : '') + '. ' : 'Kein Einsatz. ') + (res.riskHit ? 'Der Muskel hat nicht gehalten – Faserriss. ' : '') + 'Länderspiele: ' + nt.caps + '.';
    if (U.dlgPending && U.dlgPending(st) && U.showDlg) { setTimeout(function () { U.showDlg(); }, 250); return; } // z. B. Debüt-Dialog enthält das Ergebnis bereits
    setTimeout(function () { U.showResult(res.won ? 'Sieg für ' + NT.own(st).name : res.lost ? 'Niederlage' : 'Unentschieden', msg, res.won ? 'nt_cheer' : res.lost ? 'nt_out' : 'nt_stadium'); }, 200);
  };
  U.acts.ntPlay = function () { var st = U.st, e = NT.pending(st); if (e) U.ntStart(st, e); else U.toast('Diese Woche steht kein Länderspiel mit dir an.'); };
  U.acts.ntRetire = function () { U.confirm('Rücktritt aus der Nationalmannschaft', 'Willst du deine internationale Karriere wirklich beenden? Eine Rückkehr ist später nur auf Einladung des Nationaltrainers möglich.', function () { NT.retire(U.st, 'eigene Entscheidung'); U.autosave(); U.render(); }); };
  U.acts.ntTab = function (d) { U.ntTab = d.t; U.render(); };

  // ---------- Bildschirm ----------
  function flag(code) { var sv = NT.flagSvg && NT.flagSvg(code); if (sv) return '<div class="flag" style="overflow:hidden;padding:0" title="' + esc((NT.nat(code) || {}).name || code) + '">' + sv.replace('<svg ', '<svg style="width:100%;height:100%;display:block" ') + '</div>'; var c = NT.colors(code); return '<div class="flag" style="background:' + c[0] + ';color:' + c[1] + '">' + esc(code) + '</div>'; }
  function calRow(st, e) {
    var sq = e.sq, tag = !sq ? '<span class="nt-tag">offen</span>' : sq.inSq ? '<span class="nt-tag in">' + esc(sq.role || 'nominiert') + '</span>' : '<span class="nt-tag out">' + esc(sq.why || 'nicht dabei') + '</span>';
    var when = e.slot.charAt(0) === 's' ? e.slot.slice(1) + '. Woche' : e.slot.charAt(0) === 'p' ? 'Vorbereitung ' + e.slot.slice(1) : 'Winterpause ' + e.slot.slice(1);
    var res = e.played ? '<b>' + e.res.join(':') + (e.pens ? ' i.E.' : '') + '</b>' : '';
    return '<tr><td>' + esc(when) + '</td><td>' + esc(e.label) + (e.lvl && e.lvl !== 'A' ? ' (' + esc(e.lvl) + ')' : '') + '</td><td>' + (e.kind === 'tour' ? 'vs. ' : e.home ? 'vs. ' : '@ ') + nf(e.opp) + '</td><td>' + tag + '</td><td class="num">' + res + '</td></tr>';
  }
  function table(rows, own, compact) {
    return '<table class="t small"><tr><th>#</th><th>Team</th><th class="num">Sp</th>' + (compact ? '' : '<th class="num">S-U-N</th>') + '<th class="num">Tore</th><th class="num">Pkt</th></tr>' + rows.map(function (r, i) {
      return '<tr' + (r.code === own ? ' style="font-weight:700"' : '') + '><td>' + (i + 1) + '</td><td>' + nf(r.code) + '</td><td class="num">' + r.p + '</td>' + (compact ? '' : '<td class="num">' + r.w + '-' + r.d + '-' + r.l + '</td>') + '<td class="num">' + r.gf + ':' + r.ga + '</td><td class="num">' + r.pts + '</td></tr>';
    }).join('') + '</table>';
  }
  function bracket(t, own) {
    var ko = t.rounds.filter(function (r) { return r.r.charAt(0) !== 'G'; });
    if (!ko.length) return '<p class="muted small">Die K.-o.-Runde beginnt nach der Gruppenphase.</p>';
    return '<div class="nt-bracket">' + ko.map(function (rd) {
      return '<div class="rd"><div class="sub-h" style="margin-top:0">' + esc(NT.ROUND_N[rd.r]) + '</div>' + rd.fx.map(function (f) {
        var me = f.h === own || f.a === own, r = f.res ? f.res.join(':') + (f.pens ? ' (' + f.pens.join(':') + ' i.E.)' : '') : '–';
        return '<div class="m' + (me ? ' me' : '') + '"><div class="' + (f.w === f.h ? 'w' : '') + '">' + nf(f.h) + '</div><div class="' + (f.w === f.a ? 'w' : '') + '">' + nf(f.a) + '</div><div class="muted">' + r + '</div></div>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  }
  U.screens.pnati = function () {
    var st = U.st; if (!on(st)) return '<h1>Nationalmannschaft</h1><p class="muted">Nur in der Spielerkarriere verfügbar.</p>';
    var nt = NT.ensure(st), own = NT.own(st), p = C.player(st), tab = U.ntTab || 'status';
    NT.newSeason(st);
    var avg = nt.caps ? nt.rsum / nt.caps : null, pend = NT.pending(st);
    var stat = nt.retired ? 'Zurückgetreten (' + nt.retired.s + ')' : nt.status === 'squad' ? 'Im Kader' : nt.status === 'dropped' ? 'Zuletzt nicht nominiert' : nt.caps ? 'Ehemaliger Nationalspieler' : 'Noch nicht nominiert';
    var h = '<div class="page-h"><div><h1>Nationalmannschaft</h1><div class="page-sub">' + esc(own.name) + ' · ' + esc(nt.coach.name) + ' (' + esc(NT.STYLES[nt.coach.style]) + ')</div></div>' +
      (pend ? '<div><button class="primary" data-act="ntPlay">' + U.lc('play', 15) + (U.pcm && U.pcm.fx && U.pcm.fx.nt ? ' Zurück zum laufenden Länderspiel' : ' Zum Länderspiel') + '</button></div>' : '') + '</div>';
    h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:10px">' + [['status', 'Übersicht'], ['termine', 'Termine'], ['wettbewerb', 'Wettbewerbe'], ['statistik', 'Statistik'], ['praemien', 'Prämien'], ['historie', 'Historie']].map(function (x) { return '<button class="' + (tab === x[0] ? 'primary' : '') + '" data-act="ntTab" data-t="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'status') {
      h += '<div class="grid g2"><div class="panel"><div class="nt-hero">' + flag(nt.code) + '<div><h2 style="margin:0">' + esc(stat) + '</h2><div class="muted small">' + (nt.role ? 'Rolle: ' + esc(nt.role) : 'Keine Rolle') + (nt.captain ? ' · Kapitän' : '') + '</div></div></div>' +
        '<div class="nt-role">' + NT.ROLES.map(function (r) { return '<i class="' + (r === nt.role ? 'on' : '') + '">' + esc(r) + '</i>'; }).join('') + '</div>' +
        '<div class="nt-kpis"><div><span>Länderspiele</span><b>' + nt.caps + '</b></div><div><span>' + esc(SW.goals) + '</span><b>' + nt.goals + '</b></div><div><span>Vorlagen</span><b>' + nt.assists + '</b></div><div><span>Ø Note</span><b>' + num(avg, 2) + '</b></div><div><span>Startelf</span><b>' + nt.starts + '</b></div><div><span>Titel</span><b>' + nt.titles.length + '</b></div></div>' +
        (nt.retired ? '' : '<p class="muted small" style="margin-top:10px">Die Nominierung hängt von Form, Liga, Einsatzzeit, Verletzungen, der Konkurrenz auf deiner Position (' + esc(p.pos) + '), dem System und Vertrauen des Nationaltrainers sowie deiner Länderspielbilanz ab – nicht allein von der Gesamtstärke.</p>') + '</div>';
      var tb = function (k, l, ic) { var why = NT.talkBlock ? NT.talkBlock(st, k) : ''; return '<button class="sm' + (why ? ' ghost' : '') + '" data-act="dlgStart" data-dlg="' + k + '"' + (why ? ' disabled title="' + esc(why) + '"' : '') + '>' + U.lc(ic, 14) + ' ' + esc(l) + (why ? ' <span class="muted">(' + esc(why) + ')</span>' : '') + '</button>'; };
      var talks = NT.talkBlock && !nt.retired ? '<div class="panel" style="margin-bottom:12px"><h2>' + U.lc('handshake', 17) + ' Gespräche</h2><div class="row" style="gap:6px;flex-wrap:wrap">' + tb('ntcoach', 'Nationaltrainer ' + nt.coach.name, 'users') + tb('ntfed', 'Verband / Sportdirektor', 'landmark') + tb('ntdoc', 'Arzt der Nationalmannschaft', 'stethoscope') + '</div><p class="muted small" style="margin-top:6px">Der Verbandsarzt steht dir als Zweitmeinung auch bei Verletzungen im Verein zur Verfügung (auch über die medizinische Abteilung im Vereinsgelände).</p></div>' : '';
      h += talks + '<div class="panel"><h2>' + U.lc('users', 17) + ' Beziehungen</h2><table class="t small">' +
        '<tr><td>Vertrauen ' + esc(nt.coach.name) + '</td><td style="width:45%">' + U.bar(nt.trust, 100) + '</td><td class="num">' + Math.round(nt.trust) + '</td></tr>' +
        '<tr><td>Persönlicher Draht</td><td>' + U.bar(nt.coach.v || 50, 100) + '</td><td class="num">' + Math.round(nt.coach.v || 50) + '</td></tr>' +
        [['capt', 'Kapitän'], ['rival', 'Konkurrent'], ['friend', 'Freund im Team'], ['talent', 'Talent']].map(function (k) { var x = nt.people[k[0]]; return '<tr><td>' + esc(x.name) + ' <span class="muted">(' + k[1] + ')</span></td><td>' + U.bar(x.v, 100) + '</td><td class="num">' + Math.round(x.v) + '</td></tr>'; }).join('') + '</table>' +
        (nt.coachChange ? '<p class="muted small">Trainerwechsel: ' + esc(nt.coachChange.old) + ' → ' + esc(nt.coach.name) + ' (' + esc(nt.coachChange.why) + ').</p>' : '') +
        (!nt.retired && nt.caps >= 1 ? '<div class="row" style="margin-top:8px"><button data-act="ntRetire">Rücktritt erklären</button></div>' : '') + '</div></div>';
      var next = nt.cal.filter(function (e) { return !e.played; }).slice(0, 4);
      h += '<div class="panel" style="margin-top:12px"><h2>' + U.lc('calendar-days', 17) + ' Nächste Termine</h2>' + (next.length ? '<table class="t small nt-cal">' + next.map(function (e) { return calRow(st, e); }).join('') + '</table>' : '<p class="muted small">Keine offenen Termine in dieser Saison.</p>') +
        '<p class="muted small">Länderspiele finden unter der Woche statt: Müdigkeit und Verletzungen wirken im Verein weiter. Während eines Turniers fehlst du deinem Verein und hast weniger freie Termine.</p></div>';
    } else if (tab === 'termine') {
      h += '<div class="panel"><h2>Kalender ' + st.season + '</h2><table class="t small nt-cal"><tr><th>Wann</th><th>Wettbewerb</th><th>Gegner</th><th>Kader</th><th class="num">Ergebnis</th></tr>' + nt.cal.map(function (e) { return calRow(st, e); }).join('') + '</table></div>';
    } else if (tab === 'wettbewerb') {
      var q = nt.qual;
      if (q) h += '<div class="panel"><h2>' + esc(q.tour ? 'Qualifikation ' + NT.CFG.tours[q.tour].n : NT.CFG.leagueName) + '</h2>' + table(NT.table(q), nt.code) + (q.playoff ? '<p class="small">Play-off gegen ' + nf(q.playoff.opp) + (q.playoff.res ? ': ' + q.playoff.res.join(':') + (q.playoff.won ? ' – qualifiziert!' : ' – ausgeschieden.') : ' steht noch aus.') + '</p>' : '') + '</div>';
      var t = nt.tour;
      if (t) {
        h += '<div class="panel" style="margin-top:12px"><h2>' + U.lc('trophy', 17) + ' ' + esc(t.name) + (t.done ? ' – Sieger: ' + nf(t.champ) : '') + '</h2>' + (t.own ? '' : '<p class="muted small">' + esc(own.name) + ' ist nicht qualifiziert.</p>');
        h += '<div class="nt-grp">' + t.groups.map(function (g, i) { return '<div><div class="sub-h" style="margin-top:0">Gruppe ' + String.fromCharCode(65 + i) + '</div>' + table(NT.groupTable(t, g), nt.code, true) + '</div>'; }).join('') + '</div>';
        h += '<div class="sub-h">K.-o.-Runde</div>' + bracket(t, nt.code) + '</div>';
      }
      if (!q && !t) h += '<p class="muted">Noch keine Wettbewerbe in dieser Saison.</p>';
    } else if (tab === 'statistik') {
      var ys = Object.keys(nt.youth);
      h += '<div class="grid g2"><div class="panel"><h2>A-Nationalmannschaft</h2><table class="t small">' +
        '<tr><td>Länderspiele</td><td class="num">' + nt.caps + '</td></tr><tr><td>davon Startelf</td><td class="num">' + nt.starts + '</td></tr><tr><td>' + esc(SW.goals) + '</td><td class="num">' + nt.goals + '</td></tr><tr><td>Vorlagen</td><td class="num">' + nt.assists + '</td></tr>' +
        '<tr><td>Ø Note</td><td class="num">' + num(avg, 2) + '</td></tr><tr><td>Als Kapitän</td><td class="num">' + nt.capt + '</td></tr><tr><td>' + esc(SW.pen) + 'schießen (verwandelt/angetreten)</td><td class="num">' + nt.pens[1] + '/' + nt.pens[0] + '</td></tr>' +
        '<tr><td>Turniere</td><td class="num">' + nt.tours.filter(function (x) { return x.inSq; }).length + '</td></tr></table>' +
        '<p class="muted small">Getrennt von den Vereinsstatistiken.</p></div><div class="panel"><h2>Junioren</h2>' + (ys.length ? '<table class="t small"><tr><th>Team</th><th class="num">Spiele</th><th class="num">' + esc(SW.goals) + '</th></tr>' + ys.map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num">' + nt.youth[k].caps + '</td><td class="num">' + nt.youth[k].goals + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Keine Juniorenländerspiele.</p>') + '</div></div>';
      var rec = nt.hist.filter(function (x) { return x.me; });
      if (rec.length) { var best = rec.slice().sort(function (a, b) { return (b.r || 0) - (a.r || 0); })[0]; h += '<div class="panel" style="margin-top:12px"><h2>Rekorde</h2><p class="small">Bestes Länderspiel: Note ' + num(best.r, 1) + ' gegen ' + nf(best.opp) + ' (' + best.res.join(':') + ', ' + best.s + '). Meiste ' + esc(SW.goals) + ' in einem Spiel: ' + Math.max.apply(null, rec.map(function (x) { return x.g || 0; })) + '.</p></div>'; }
    } else if (tab === 'praemien') {
      var P = NT.PRIZE, f = NT.fac(st);
      h += '<div class="grid g2"><div class="panel"><h2>Ausgezahlt</h2><p>Gesamt nach Abgaben: <b>' + money(nt.bonus || 0) + '</b></p>' + ((nt.payLog || []).length ? '<table class="t small"><tr><th>Saison</th><th>Anlass</th><th class="num">Brutto</th><th class="num">Netto</th></tr>' + nt.payLog.map(function (x) { return '<tr><td>' + x.s + '</td><td>' + esc(x.txt) + '</td><td class="num">' + money(x.gross) + '</td><td class="num">' + money(x.net) + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Prämien.</p>') + '</div>' +
        '<div class="panel"><h2>Prämienordnung ' + esc(own.name) + '</h2><table class="t small">' +
        [['Abstellung je Lehrgang', P.call], ['Einsatz je Länderspiel', P.cap], ['Sieg (Pflichtspiel; Testspiel 35 %)', P.win], ['Qualifikation', P.qual], ['Turnierteilnahme', P.tour], ['Achtelfinale', P.round.R16], ['Viertelfinale', P.round.QF], ['Halbfinale', P.round.SF], ['Finale', P.round.F], ['Titel', P.round.W]].map(function (x) { return '<tr><td>' + x[0] + '</td><td class="num">' + money(Math.round(x[1] * f)) + '</td></tr>'; }).join('') +
        '</table><p class="muted small">Brutto, je Bedingung genau einmal; vereinfacht mit ' + Math.round(NT.TAX * 100) + ' % Abgaben versteuert und im Finanzcockpit als „Nationalmannschaftsprämie“ gebucht.</p></div></div>';
    } else {
      h += '<div class="grid g2"><div class="panel"><h2>Turniere</h2>' + (nt.tours.length ? '<table class="t small"><tr><th>Turnier</th><th>Abschneiden</th><th class="num">Spiele</th><th class="num">' + esc(SW.goals) + '</th></tr>' + nt.tours.map(function (x) { return '<tr><td>' + esc(x.name) + '</td><td>' + esc({ G: 'Vorrunde', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale', F: 'Finale', W: 'Titel' }[x.best] || '') + (x.inSq ? '' : ' <span class="muted">(ohne dich)</span>') + '</td><td class="num">' + (x.apps || 0) + '</td><td class="num">' + (x.goals || 0) + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Turniere.</p>') + '</div>' +
        '<div class="panel"><h2>Meilensteine</h2><ul class="small">' + [nt.ms.youth && 'Erstes Juniorenländerspiel (' + nt.ms.youth.s + ', ' + nt.ms.youth.lvl + ')', nt.ms.call && 'Erste Nominierung (' + nt.ms.call.s + ')', nt.ms.debut && 'Debüt gegen ' + nn(nt.ms.debut.opp) + ' (' + nt.ms.debut.s + ')', nt.ms.goal && 'Erstes Länderspieltor gegen ' + nn(nt.ms.goal.opp) + ' (' + nt.ms.goal.s + ')'].concat(nt.titles.map(function (t) { return '🏆 ' + t.name; })).filter(Boolean).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>';
      h += '<div class="panel" style="margin-top:12px"><h2>Länderspiele</h2>' + (nt.hist.length ? '<table class="t small"><tr><th>Saison</th><th>Wettbewerb</th><th>Gegner</th><th class="num">Ergebnis</th><th class="num">Note</th><th class="num">' + esc(SW.goals) + '</th></tr>' + nt.hist.slice(0, 40).map(function (x) { return '<tr><td>' + x.s + '</td><td>' + esc(x.label) + '</td><td>' + nf(x.opp) + '</td><td class="num">' + x.res.join(':') + (x.pens ? ' i.E.' : '') + '</td><td class="num">' + (x.me ? num(x.r, 1) : '–') + '</td><td class="num">' + (x.me ? x.g || 0 : '') + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Länderspiele.</p>') + '</div>';
      var ch = X.ensure(st).chron.filter(function (x) { return x.cat === 'nati'; }).slice(0, 20);
      if (ch.length) h += '<div class="panel" style="margin-top:12px"><h2>Chronik</h2><table class="t small">' + ch.map(function (x) { return '<tr><td>' + esc(x.ic) + '</td><td>' + x.s + '</td><td><b>' + esc(x.ti) + '</b> ' + esc(x.x || '') + '</td></tr>'; }).join('') + '</table></div>';
    }
    return h;
  };
})(RFM);
