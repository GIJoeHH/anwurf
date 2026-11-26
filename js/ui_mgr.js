// Managerkarriere 3.0 – Oberfläche (gemeinsam für ANPFIFF und ANWURF)
// Gesprächsfenster mit Bildzuständen und sichtbaren Reaktionen, Abstellungs-/Rückkehrberichte mit Entscheidungen,
// Menüs „Nationalspieler“, „Kabine“, „Umfeld“ (Fans/Medien/Vorstand/Sponsoren/Stab/Berater), „Vereinsgedächtnis“, „Privatleben“.
(function (R) {
  'use strict';
  var U = R.ui, MX = R.mx, MN = R.mnt, S = R.season, W = R.world, D = R.data, NT = R.nt;
  if (!U || !MX) return;
  var esc = R.esc, money = R.fmtMoney, HB = MX.HB, TM = MX.TERM;
  function on(st) { return MX.on(st); }
  function tick(st) { return st.tick || 0; }
  function bar(v, col) { return U.bar(v, 100, col || (v < 30 ? 'var(--red)' : v > 70 ? 'var(--green)' : '')); }
  function row(l, v, extra, inv) { return '<tr><td>' + esc(l) + '</td><td style="width:46%">' + (inv ? bar(v, v > 60 ? 'var(--red)' : v < 30 ? 'var(--green)' : 'var(--amber)') : bar(v)) + '</td><td class="num">' + Math.round(v) + '</td>' + (extra != null ? '<td class="muted small">' + esc(extra) + '</td>' : '') + '</tr>'; }
  function lc(n, s) { return U.lc ? U.lc(n, s || 16) : ''; }
  function flagName(code) { return MN ? MN.natName(code) : code; }

  if (typeof document !== 'undefined' && !document.getElementById('mx-style')) {
    var css = document.createElement('style'); css.id = 'mx-style';
    css.textContent = [
      '.mx-badge{display:inline-block;font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:99px;border:1px solid var(--line);background:var(--bg2);margin-left:6px;vertical-align:middle}',
      '.mx-badge.krise{border-color:var(--red);color:var(--red)}.mx-badge.wichtig{border-color:var(--amber);color:var(--amber)}.mx-badge.highlight{border-color:var(--green);color:var(--green)}',
      '.mx-state{position:absolute;top:8px;left:8px;background:rgba(0,0,0,.55);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:99px}',
      '.mx-feed li{display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:13px}.mx-feed li b{white-space:nowrap}',
      '.mx-chron li{display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--line)}.mx-chron .ic{font-size:20px;flex:0 0 28px;text-align:center}',
      '.mx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}',
      '.mx-it{border:1px solid var(--line);border-radius:10px;padding:10px;background:var(--panel2);margin-bottom:8px}.mx-it .acts{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px}',
      '.mx-st{font-size:11px;padding:1px 7px;border-radius:99px;margin-right:4px;border:1px solid var(--line)}.mx-st.gefeiert{color:var(--green);border-color:var(--green)}.mx-st.verletzt,.mx-st.erschöpft{color:var(--red);border-color:var(--red)}.mx-st.frustriert,.mx-st.enttäuscht{color:var(--amber);border-color:var(--amber)}',
      '.mx-pl{cursor:pointer;color:var(--text)}.mx-pl:hover{text-decoration:underline}.mx-tbl td,.mx-tbl th{padding:5px 6px}.mx-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}',
      '@media (max-width:640px){.mx-grid{grid-template-columns:1fr}.mx-hide-s{display:none}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // ---------- Szenenbilder mit Zuständen (a Beginn · b Angebot/Entwicklung · c Gegenangebot/Kampf · d Konflikt · e Einigung/Erfolg · f Abbruch) ----------
  var SCN = { presse: ['#831843', '#ec4899', '🎙️'], vertrag: ['#334155', '#64748b', '✍️'], kabine: ['#1f2937', '#475569', '🧥'], talent: ['#065f46', '#10b981', '🌱'], staff: ['#1e3a8a', '#3b82f6', '📋'], medizin: ['#7f1d1d', '#ef4444', '🩺'],
    fans: ['#7c2d12', '#f97316', '📣'], ultras: ['#450a0a', '#dc2626', '🔥'], fanprotest: ['#3f3f46', '#ef4444', '🪧'], social: ['#312e81', '#6366f1', '📱'], vorstand: ['#1e293b', '#0ea5e9', '🏛️'], sponsor: ['#713f12', '#eab308', '💼'],
    stadionbau: ['#44403c', '#f59e0b', '🏗️'], trainerkrise: ['#18181b', '#71717a', '🌩️'], entlassung: ['#0f172a', '#334155', '📦'], meister: ['#78350f', '#facc15', '🏆'], abstieg: ['#1c1917', '#57534e', '⬇️'],
    nominierung: ['#14532d', '#22c55e', '📨'], ntjubel: ['#14532d', '#facc15', '🌟'], ntverletzt: ['#7f1d1d', '#f97316', '🩹'], rueckkehr: ['#1e3a8a', '#14b8a6', '🧳'], date: ['#881337', '#f43f5e', '🌹'], familie: ['#134e4a', '#14b8a6', '🏡'], buero: ['#1e293b', '#0ea5e9', '🏛️'] };
  var STN = { a: 'Beginn', b: 'Entwicklung', c: 'Verhandlung', d: 'Konflikt', e: 'Einigung', f: 'Abbruch' };
  var STX = { a: '', b: '💬', c: '⚖️', d: '⚡', e: '🤝', f: '🚪' };
  // eigene Ereignisfotos (ohne echte Wappen/Marken/Personen) – je Szene, Zustand als Einblendung
  var PHOTO = { presse: ['img/events/ev_press_conference_01', ['webp', 'jpg']], vertrag: ['img/events/ev_contract_signing_01', ['avif', 'jpg']], fans: ['img/events/ev_fanclub_meeting_01', ['webp', 'jpg']], date: ['img/events/ev_first_date_01', ['avif', 'jpg']],
    kabine: ['img/events/ev_locker_down_01', ['avif', 'jpg']], trainerkrise: ['img/events/ev_locker_down_01', ['avif', 'jpg']], talent: ['img/events/ev_academy_training_01', ['avif', 'jpg']], ntjubel: ['img/events/ev_stadium_night_01', ['avif', 'jpg']], meister: ['img/events/ev_stadium_night_01', ['avif', 'jpg']] };
  MX.SCENES = SCN;
  U.mxSvg = function (scene, state) {
    var s = SCN[scene] || SCN.buero, id = 'mx' + Math.floor(Math.random() * 1e6), dark = state === 'd' || state === 'f', ok = state === 'e';
    var emo = s[2]; if (scene === 'talent' && HB) emo = '🤾';
    return '<svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + s[0] + '"/><stop offset="1" stop-color="' + (dark ? '#111827' : ok ? '#16a34a' : s[1]) + '"/></linearGradient></defs>' +
      '<rect width="320" height="140" fill="url(#' + id + ')"/><circle cx="260" cy="20" r="70" fill="#fff" opacity="' + (ok ? '.14' : '.07') + '"/><circle cx="40" cy="140" r="60" fill="#000" opacity=".12"/><rect x="0" y="104" width="320" height="36" fill="#000" opacity=".15"/>' +
      '<text x="' + (STX[state] ? 140 : 160) + '" y="86" text-anchor="middle" font-size="58">' + emo + '</text>' + (STX[state] ? '<text x="218" y="70" text-anchor="middle" font-size="36">' + STX[state] + '</text>' : '') + '</svg>';
  };
  U.mxImg = function (img, cls, cap) {
    img = img || {}; var ph = PHOTO[img.scene], src = img.src ? [img.src, ['webp', 'jpg']] : ph, pic = '';
    if (src) { var fm = src[1], last = fm[fm.length - 1]; pic = '<picture>' + fm.slice(0, -1).map(function (f) { return '<source type="image/' + f + '" srcset="' + esc(src[0] + '.' + f) + '">'; }).join('') + '<img src="' + esc(src[0] + '.' + last) + '" alt="' + esc(img.alt || '') + '" loading="lazy" decoding="async" onerror="this.parentNode.style.display=\'none\'"' + (img.state === 'd' || img.state === 'f' ? ' style="filter:grayscale(.6) brightness(.8)"' : '') + '></picture>'; }
    var stl = img.state && img.state !== 'a' ? '<span class="mx-state">' + (STX[img.state] || '') + ' ' + esc(STN[img.state] || '') + '</span>' : '';
    return '<div class="' + (cls || 'lf-img') + '" role="img" aria-label="' + esc(img.alt || '') + '">' + U.mxSvg(img.scene, img.state) + pic + stl + (cap || '') + '</div>';
  };

  // ---------- Gesprächsfenster ----------
  function chips(list) { return list && list.length ? '<div class="lf-chips">' + list.map(function (c) { return '<span class="lf-chip ' + (c.pos ? 'pos' : c.neg ? 'neg' : '') + '">' + esc(c.t) + '</span>'; }).join('') + '</div>' : ''; }
  var IMPN = { normal: '', wichtig: 'Wichtig', krise: 'Krise', highlight: 'Höhepunkt' };
  function key(st) { var d = MX.active(st); return d ? d.id + ':' + d.t0 : ''; }
  U.mxPending = function (st) { return on(st) && MX.pending(st); };
  U.mxShow = function () {
    var st = U.st, v = MX.view(st); if (!v) return;
    U._mxSeen = key(st);
    var steps = ''; for (var i = 1; i <= v.max; i++) steps += '<i class="' + (i <= v.step ? 'on' : '') + '"></i>';
    var h = U.mxImg(v.img, 'lf-img', '<div class="cap"><div>' + esc(v.title || 'Gespräch') + (IMPN[v.imp] ? '<span class="mx-badge ' + v.imp + '">' + IMPN[v.imp] + '</span>' : '') + '</div><span>' + (v.done ? 'Abgeschlossen' : 'Runde ' + v.step + ' von ' + v.max) + '</span></div>');
    h += '<div class="lf-steps">' + steps + '</div>';
    h += '<div class="lf-who"><div class="av">' + esc(v.who.ic || '👤') + '</div><div><b>' + esc(v.who.n || '') + '</b><div class="muted small">' + esc(v.who.role || '') + '</div></div></div>';
    if (v.react && (v.react.txt || v.react.eff.length)) h += '<div class="lf-react">' + (v.react.txt ? esc(v.react.txt) : '<span class="muted">Reaktion</span>') + chips(v.react.eff) + '</div>';
    if (!v.done) {
      h += '<div class="lf-say">' + esc(v.say || '') + '</div><div class="lf-opts">' + v.opts.map(function (o) { return '<button data-act="mxPick" data-i="' + o.i + '">' + esc(o.l) + (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') + '</button>'; }).join('') + '</div>';
    } else {
      h += '<div class="panel" style="margin-top:10px"><b>Ergebnis</b><p class="small">' + esc(v.sum || 'Das Gespräch ist beendet.') + '</p><ol class="lf-log">' + v.log.map(function (x) { return '<li><b>' + esc(x.a) + '</b>' + (x.r ? ' – ' + esc(x.r) : '') + (x.eff ? ' <span class="muted">(' + esc(x.eff) + ')</span>' : '') + '</li>'; }).join('') + '</ol><p class="muted small">Die Beteiligten merken sich deine Aussagen und Zusagen.</p></div>';
    }
    var more = MX.ensure(st).dq.length;
    var foot = v.done ? '<button class="primary" data-act="mxClose">' + (more ? 'Weiter (' + more + ' weitere)' : 'Schließen') + '</button>' : (v.imp === 'normal' ? '<button class="ghost" data-act="mxAuto" title="Der Assistent antwortet mit der zurückhaltenden Standardoption">Assistent entscheidet</button>' : '') + '<button class="ghost" data-act="closeModal" title="Das Gespräch bleibt offen">Später</button>';
    U.modal(esc({ medien: 'Medien', vertrag: 'Verhandlung', vorstand: 'Vereinsführung', fans: 'Fans', nati: 'Nationalmannschaft', privat: 'Privatleben', stab: 'Trainerstab', sponsoren: 'Sponsoren', infrastruktur: 'Infrastruktur', nachwuchs: 'Nachwuchs', transfer: 'Transfers', kabine: 'Kabine', karriere: 'Karriere' }[v.cat] || 'Gespräch'), h, foot, true);
  };
  U.acts.mxPick = function (d) { MX.pick(U.st, +d.i); U.autosave(); U.mxShow(); };
  U.acts.mxAuto = function () { MX.autoRun(U.st); U.autosave(); U.mxShow(); };
  U.acts.mxClose = function () { var st = U.st; MX.close(st); U.closeModal(); U.autosave(); U.render(); if (st.manager && st.manager.unemployed) { U.go('karriere'); return; } if (U.mxPending(st)) setTimeout(U.mxShow, 250); else setTimeout(function () { if (U.afterWeekPopups) U.afterWeekPopups(); }, 250); };
  U.acts.mxResume = function () { U.mxShow(); };

  // ---------- Länderspielberichte ----------
  var STATEN = { gefeiert: 'gefeiert', enttäuscht: 'enttäuscht', erschöpft: 'erschöpft', verletzt: 'verletzt', frustriert: 'frustrierter Reservespieler', normal: 'ohne Auffälligkeiten' };
  function repHtml(st, rep, inline) {
    var h = '';
    if (rep.k === 'preview') {
      h += '<p class="small">' + esc(rep.label || 'Länderspielpause') + ': ' + rep.items.length + ' Spieler deines Kaders sind abgestellt.</p>';
      h += '<div class="mx-scroll"><table class="t small mx-tbl"><tr><th>Spieler</th><th>Team</th><th class="num">Fitness</th><th class="num mx-hide-s">Form</th><th class="num mx-hide-s">Einsätze</th><th class="mx-hide-s">Nationaltrainer</th></tr>' + rep.items.map(function (it) { return '<tr><td><b>' + esc(it.name) + '</b>' + (it.first ? ' <span class="mx-badge highlight">erstmals</span>' : '') + '</td><td>' + esc(flagName(it.code)) + (it.lvl !== 'A' ? ' ' + it.lvl : '') + '</td><td class="num">' + it.fit + '</td><td class="num mx-hide-s">' + (+it.form).toFixed(1) + '</td><td class="num mx-hide-s">' + it.caps + '</td><td class="mx-hide-s">' + esc(it.coach) + (it.style ? ' <span class="muted">(' + esc(it.style.n || '') + ')</span>' : '') + '</td></tr>'; }).join('') + '</table></div>';
      h += '<p class="muted small">Abgestellte Spieler fehlen im Vereinstraining und, wenn sich die Termine überschneiden, auch in Pflichtspielen. Nach der Rückkehr kannst du über Belastung und Einsatz entscheiden.</p>';
      return h;
    }
    if (rep.games.length) h += '<p class="small"><b>Spiele:</b> ' + rep.games.map(function (g) { return esc(flagName(g.code)) + ' ' + esc(g.label || '') + ' ' + esc(g.res || ''); }).join(' · ') + '</p>';
    rep.items.forEach(function (it) {
      var p = st.players[it.pid], done = rep.done[it.pid];
      h += '<div class="mx-it"><div class="row between"><b>' + esc(it.name) + '</b><span class="muted small">' + esc(flagName(it.code)) + (it.lvl !== 'A' ? ' ' + it.lvl : '') + '</span></div>' +
        '<div class="small" style="margin:4px 0">' + it.states.map(function (s) { return '<span class="mx-st ' + s + '">' + esc(STATEN[s] || s) + '</span>'; }).join('') + '</div>' +
        '<div class="small muted">' + it.apps + ' Einsätze (' + it.starts + ' von Beginn), ' + it.mins + ' Min., ' + it.goals + (HB ? ' Tore' : ' Tore') + ', ' + it.assists + ' Vorlagen' + (it.rts.length ? ', Ø-Note ' + (it.rts.reduce(function (a, b) { return a + b; }, 0) / it.rts.length).toFixed(1) : '') +
        ' · Fitness ' + it.fit0 + ' → ' + (p ? Math.round(p.fitness) : '–') + (it.inj ? ' · <span class="neg">' + esc(it.inj.type) + ' (' + it.inj.weeks + ' Wo.)</span>' : '') + (it.best ? ' · Turnier: ' + esc(it.best) : '') + '</div>';
      if (done) h += '<div class="small" style="margin-top:6px">✔ Entschieden: ' + esc((MN.ACTIONS[done] || {}).l || done) + '</div>';
      else if (p && p.clubId === (S.userClub(st) || {}).id) h += '<div class="acts">' + Object.keys(MN.ACTIONS).filter(function (k) { return !(k === 'youth' && p.age <= 21); }).map(function (k) { return '<button class="sm" data-act="mxRepAct" data-r="' + rep.id + '" data-p="' + it.pid + '" data-k="' + k + '" title="' + esc(MN.ACTIONS[k].d) + '">' + esc(MN.ACTIONS[k].l) + '</button>'; }).join('') + '</div>';
      h += '</div>';
    });
    if (!rep.items.length) h += '<p class="muted small">Keine Spieler deines Kaders waren im Einsatz.</p>';
    return h;
  }
  U.mxReport = function (rep) {
    var st = U.st; rep = rep || MN.unseen(st); if (!rep) return; rep.seen = true;
    var ttl = rep.k === 'preview' ? 'Abstellungsbericht' : rep.k === 'tour' ? 'Turnierbericht' : 'Rückkehrbericht';
    var img = rep.k === 'preview' ? 'nominierung' : rep.items.some(function (i) { return i.states.indexOf('verletzt') >= 0; }) ? 'ntverletzt' : rep.items.some(function (i) { return i.states.indexOf('gefeiert') >= 0; }) ? 'ntjubel' : 'rueckkehr';
    U._mxRep = rep.id;
    U.modal(lc('flag') + ' ' + ttl, U.mxImg(MX.img(img, rep.k === 'preview' ? 'a' : 'b'), 'lf-img', '<div class="cap"><div>' + esc(rep.label || ttl) + '</div><span>Saison ' + rep.s + ', Woche ' + rep.w + '</span></div>') + '<div style="margin-top:10px">' + repHtml(st, rep) + '</div>', '<button class="ghost" data-act="mxGoNati">Zur Übersicht</button><button class="primary" data-act="mxRepClose">Weiter</button>', true);
  };
  U.acts.mxRepAct = function (d) {
    var st = U.st, r = MN.act(st, d.r, d.p, d.k); U.autosave();
    var rep = st.mnt.reports.filter(function (x) { return x.id === d.r; })[0];
    if (d.k === 'talk' && U.mxPending(st)) { U.closeModal(); U.mxShow(); return; }
    if (U.screen === 'mxnati' && U._mxRep !== d.r) { U.render(); if (r && r.msg) U.toast(r.msg, 3500); return; }
    U.mxReport(rep); if (r && r.msg) { var b = document.querySelector('#modal .mx-it'); var n = document.createElement('div'); n.className = 'lf-react'; n.innerHTML = esc(r.msg) + chips(r.fx); var box = document.querySelector('#modal .dlg-b') || (b && b.parentNode); if (box) box.insertBefore(n, box.firstChild.nextSibling); }
  };
  U.acts.mxRepClose = function () { U.closeModal(); U._mxRep = null; U.render(); setTimeout(function () { if (U.afterWeekPopups) U.afterWeekPopups(); }, 200); };
  U.acts.mxGoNati = function () { U.closeModal(); U.go('mxnati'); };

  // ---------- Ablauf: nach der Woche, Autoweiter, Nächster Spieltag ----------
  var baseAfter = U.afterWeekPopups;
  U.afterWeekPopups = function () {
    var st = U.st;
    if (on(st)) {
      if (U.showCelebration && st.celebrations && st.celebrations.length) return baseAfter && baseAfter.apply(this, arguments);
      if (st.pendingEvent || (S.planEventOpen && S.planEventOpen(st))) return baseAfter && baseAfter.apply(this, arguments);
      if (MN && MN.unseen(st)) { U.mxReport(); return; }
      if (U.mxPending(st)) { U.mxShow(); return; }
    }
    if (baseAfter) return baseAfter.apply(this, arguments);
  };
  function stopWorthy(st) { // Autoweiter: Normale Gespräche erledigt der Assistent, Wichtiges stoppt
    if (!on(st)) return false;
    var g = 0; while (MX.pending(st) && g++ < 10) { var d = MX.active(st); if (d.imp !== 'normal') return true; MX.autoRun(st); MX.close(st); }
    if (MN && st.mnt) { var r = MN.unseen(st); while (r) { var imp = r.k !== 'preview' && r.items.some(function (i) { return i.states.indexOf('verletzt') >= 0 || i.states.indexOf('gefeiert') >= 0; }); if (imp) return true; r.seen = true; r = MN.unseen(st); } }
    return false;
  }
  var baseFinish = U.finishWeek;
  U.finishWeek = function () {
    var r = baseFinish.apply(this, arguments), st = U.st;
    if (U.autoRun && st && stopWorthy(st)) { U.autoRun = false; setTimeout(function () { U.render(); if (U.afterWeekPopups) U.afterWeekPopups(); }, 50); }
    return r;
  };
  var baseNext = U.acts.next;
  U.acts.next = function () {
    var st = U.st;
    if (on(st) && !U.busy && !U.liveActive && U.screen !== 'bericht') {
      if (MN && MN.unseen(st)) { U.mxReport(); return; }
      var d = MX.active(st); if (d && !d.done && (d.imp === 'krise' || U._mxSeen !== key(st))) { U.mxShow(); return; }
    }
    return baseNext.apply(this, arguments);
  };

  // ---------- Navigation ----------
  var baseNav = U.navItems;
  U.navItems = function () {
    var list = baseNav(), st = U.st; if (!on(st)) return list; MX.ensure(st);
    function after(id, item) { var i = -1; list.forEach(function (it, k) { if (it[0] === id) i = k; }); if (i >= 0) list.splice(i + 1, 0, item); else list.push(item); }
    var ntN = MN && st.mnt ? st.mnt.reports.filter(function (r) { return r.k !== 'preview' && r.items.some(function (it) { return !r.done[it.pid]; }); }).length : 0;
    after('mannschaft', ['mxnati', 'flag', 'Nationalspieler', ntN]);
    after('mxnati', ['mxkabine', 'users', 'Kabine', MX.openPromises(st).length ? 0 : 0]);
    after('verein', ['mxumfeld', 'megaphone', 'Umfeld & Medien', MX.pending(st) ? 1 : 0]);
    after('geschichte', ['mxgedaechtnis', 'book-open', 'Vereinsgedächtnis']);
    after('karriere', ['mxprivat', 'heart', 'Privatleben']);
    return list;
  };
  function resume(st) { var v = MX.pending(st) && MX.view(st); return v ? '<div class="help" style="margin-bottom:12px">' + lc('message-circle', 15) + ' Offenes Gespräch: <b>' + esc(v.title) + '</b>' + (IMPN[v.imp] ? '<span class="mx-badge ' + v.imp + '">' + IMPN[v.imp] + '</span>' : '') + ' <button class="sm primary" data-act="mxResume">Fortsetzen</button></div>' : ''; }
  function seg(scr, tab, list) { return '<div class="seg" style="margin:4px 0 14px;flex-wrap:wrap">' + list.map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="' + scr + '" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  if (!U.acts.tab) U.acts.tab = function (d) { U.go(d.s, { tab: d.tab }); };

  // ---------- Nationalspieler ----------
  U.screens.mxnati = function () {
    var st = U.st, club = S.userClub(st), m = MN ? MN.ensure(st) : null, h = '<h1>' + lc('flag', 22) + ' Nationalspieler</h1>' + resume(st);
    if (!m) return h + '<p>Modul nicht verfügbar.</p>';
    var sq = W.squad(st, club.id), rows = sq.map(function (p) { var pr = m.pl[p.id], code = pr && pr.code || (MN.code(st, p)); return { p: p, pr: pr, code: code, call: MN.isCalled(st, p.id) }; }).filter(function (x) { return x.pr && (x.pr.caps || x.call || Object.keys(x.pr.y || {}).length); });
    var next = NT.CFG.windows.filter(function (w) { return w > st.week; })[0];
    h += '<div class="grid g2"><div class="panel"><h2>Kalender</h2><p class="small">' + (st.mnt.tour && !st.mnt.tour.done ? '<b>' + esc(st.mnt.tour.name) + '</b> läuft – Spieler mit Turniernominierung sind abwesend.<br>' : '') + (next ? 'Nächste Länderspielpause nach dem ' + next + '. Spieltag.' : 'Keine weitere Länderspielpause in dieser Saison.') + '</p><p class="muted small">Länderspiele werden mit der Spiel-Engine simuliert. Kurzfristig wirken sie auf Fitness, Form und Moral; langfristig auf Erfahrung, Marktwert und Bekanntheit.</p></div>';
    h += '<div class="panel"><h2>Überblick</h2><table class="t small"><tr><td>Nationalspieler (A)</td><td class="num">' + rows.filter(function (x) { return x.pr.caps; }).length + '</td></tr><tr><td>Aktuell nominiert</td><td class="num">' + rows.filter(function (x) { return x.call; }).length + '</td></tr><tr><td>Länderspieleinsätze diese Saison</td><td class="num">' + (m.seasonCaps || 0) + '</td></tr><tr><td>Titel mit Nationalteams</td><td class="num">' + st.mx.chron.filter(function (c) { return c.ti && /Titel mit der Nationalmannschaft|Turniersieg/.test(c.ti); }).length + '</td></tr></table></div></div>';
    h += '<div class="panel" style="margin-top:12px"><h2>Spieler</h2>' + (rows.length ? '<div class="mx-scroll"><table class="t small mx-tbl"><tr><th>Spieler</th><th>Land</th><th>Status</th><th class="num">Länderspiele</th><th class="num mx-hide-s">Tore</th><th class="num mx-hide-s">Ø</th><th class="mx-hide-s">Jugend</th></tr>' +
      rows.sort(function (a, b) { return b.pr.caps - a.pr.caps; }).map(function (x) { var pr = x.pr; return '<tr><td><b class="mx-pl" data-act="playerInfo" data-id="' + x.p.id + '">' + esc(x.p.first + ' ' + x.p.last) + '</b></td><td>' + esc(flagName(x.code)) + '</td><td>' + (x.p.ntAway ? '<span class="mx-st erschöpft">abwesend</span>' : x.call ? '<span class="mx-st gefeiert">nominiert ' + (x.call === 'A' ? '' : x.call) + '</span>' : '<span class="muted">–</span>') + '</td><td class="num">' + pr.caps + '</td><td class="num mx-hide-s">' + pr.goals + '</td><td class="num mx-hide-s">' + (pr.caps ? (pr.rsum / pr.caps).toFixed(1) : '–') + '</td><td class="mx-hide-s small">' + Object.keys(pr.y || {}).map(function (l) { return l + ' (' + pr.y[l].caps + ')'; }).join(', ') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted small">Noch keine Nationalspieler im Kader.</p>') + '</div>';
    var reps = m.reports.slice(0, 6);
    if (reps.length) h += '<div class="panel" style="margin-top:12px"><h2>Berichte</h2>' + reps.map(function (r) { var open = r.k !== 'preview' && r.items.some(function (it) { return !r.done[it.pid]; }); return '<details' + (open ? ' open' : '') + '><summary><b>' + esc(r.k === 'preview' ? 'Abstellung' : r.k === 'tour' ? 'Turnier' : 'Rückkehr') + '</b> · ' + esc(r.label || '') + ' <span class="muted small">(' + r.s + ', Wo. ' + r.w + ')</span>' + (open ? ' <span class="mx-badge wichtig">Entscheidung offen</span>' : '') + '</summary>' + repHtml(st, r) + '</details>'; }).join('') + '</div>';
    // Nationaltrainer-Karriere
    var job = st.mx.ntJob;
    if (job) {
      var cand = MN.candidates(st, job.code).slice(0, 40), man = m.manual[job.code] || [];
      h += '<div class="panel" style="margin-top:12px"><h2>' + lc('award') + ' Nationaltrainer ' + esc(flagName(job.code)) + '</h2><p class="small">Seit ' + job.since + ' · Vertrauen des Verbands ' + Math.round(job.trust) + '/100. Wähle bis zu ' + (HB ? 16 : 23) + ' Spieler. Ohne Auswahl nominiert dein Trainerteam nach Leistung.</p>' +
        '<div class="mx-scroll"><table class="t small mx-tbl"><tr><th></th><th>Spieler</th><th>Pos.</th><th class="num">Stärke</th><th class="mx-hide-s">Verein</th></tr>' + cand.map(function (p) { var c = st.clubs[p.clubId]; return '<tr><td><input type="checkbox" data-act="mxNtPick" data-id="' + p.id + '"' + (man.indexOf(p.id) >= 0 ? ' checked' : '') + '></td><td>' + esc(p.first + ' ' + p.last) + '</td><td>' + p.pos + '</td><td class="num">' + p.ovr + '</td><td class="mx-hide-s">' + esc(c ? c.short || c.name : 'vereinslos') + '</td></tr>'; }).join('') + '</table></div><p><button class="sm ghost" data-act="mxNtClear">Auswahl zurücksetzen</button> <button class="sm ghost" data-act="mxNtQuit">Amt niederlegen</button></p></div>';
    }
    return h;
  };
  U.acts.mxNtPick = function (d) { var st = U.st, j = st.mx.ntJob; if (!j) return; var m = MN.ensure(st), l = m.manual[j.code] = m.manual[j.code] || [], i = l.indexOf(d.id); if (i >= 0) l.splice(i, 1); else if (l.length < (HB ? 16 : 23)) l.push(d.id); U.autosave(); U.render(); };
  U.acts.mxNtClear = function () { var st = U.st, j = st.mx.ntJob; if (j) MN.ensure(st).manual[j.code] = []; U.render(); };
  U.acts.mxNtQuit = function () { U.confirm('Amt niederlegen', 'Willst du das Amt als Nationaltrainer wirklich niederlegen?', function () { MN.quitJob(U.st); U.autosave(); U.render(); }); };

  // ---------- Kabine ----------
  U.screens.mxkabine = function () {
    var st = U.st, mx = MX.ensure(st), kb = MX.kabine(st), sq = MX.squad(st), h = '<h1>' + lc('users', 22) + ' Kabine</h1>' + resume(st);
    MX.computeRoles(st);
    h += '<div class="grid g2"><div class="panel"><h2>Stimmung</h2><table class="t small">' + row('Kabinenstimmung', kb.v) + '</table><ul class="small" style="margin-top:8px">' + kb.f.map(function (f) { return '<li class="' + (f[1] > 0 ? 'pos' : f[1] < 0 ? 'neg' : '') + '">' + (f[1] > 0 ? '+' : '') + Math.round(f[1]) + ' · ' + esc(f[0]) + '</li>'; }).join('') + '</ul></div>';
    var pr = MX.openPromises(st), cf = mx.mem.conf.filter(function (x) { return !x.done; });
    h += '<div class="panel"><h2>Zusagen & Konflikte</h2>' + (pr.length ? '<ul class="small">' + pr.map(function (x) { var wl = x.due - tick(st); return '<li><b>' + esc(x.name) + '</b>: ' + esc(x.txt) + ' <span class="muted">(' + (wl > 0 ? 'noch ' + wl + ' Wo.' : 'fällig') + (x.need ? ', ' + x.need + ' Einsätze' : '') + ')</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Keine offenen Zusagen.</p>') +
      (cf.length ? '<h3 style="margin-top:10px;font-size:14px">Offene Konflikte</h3><ul class="small">' + cf.map(function (c) { return '<li class="neg">' + esc(c.txt) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="muted small">Gebrochene Zusagen schaden dem Vertrauen dauerhaft – illoyale Spieler äußern dann Wechselwünsche.</p></div></div>';
    h += '<div class="panel" style="margin-top:12px"><h2>Hierarchie & Persönlichkeiten</h2><div class="mx-scroll"><table class="t small mx-tbl"><tr><th>Spieler</th><th>Rolle</th><th class="num">Moral</th><th class="num">Vertrauen</th><th class="mx-hide-s">Bekannte Eigenschaften</th></tr>' +
      sq.slice().sort(function (a, b) { return (mx.roles[b.id] ? 1 : 0) - (mx.roles[a.id] ? 1 : 0) || b.ovr - a.ovr; }).map(function (p) { var r = mx.roles[p.id], q = MX.pers(p), rec = MX.pl(st, p); var tr = Object.keys(MX.TRAITS).filter(function (k) { return !MX.HIDDEN[k] || rec.known[k]; }).filter(function (k) { return q[k] >= 15 || q[k] <= 5; }).map(function (k) { return (q[k] >= 15 ? '↑ ' : '↓ ') + MX.TRAITS[k]; }); return '<tr><td><b class="mx-pl" data-act="playerInfo" data-id="' + p.id + '">' + esc(p.first + ' ' + p.last) + '</b></td><td>' + (r ? (MX.ROLE_IC[r] || '') + ' ' + esc(MX.ROLE_N[r]) : '<span class="muted">–</span>') + '</td><td class="num">' + Math.round(p.morale) + '</td><td class="num">' + Math.round(rec.rel) + '</td><td class="mx-hide-s muted">' + esc(tr.join(', ') || '–') + (MX.GOALS[q.goal] ? ' · Ziel: ' + esc(MX.GOALS[q.goal]) : '') + '</td></tr>'; }).join('') + '</table></div><p class="muted small">Loyalität, Disziplin, Führungsqualität, Konfliktbereitschaft und Belastbarkeit zeigen sich erst durch Ereignisse.</p></div>';
    return h;
  };

  // ---------- Umfeld & Medien ----------
  U.screens.mxumfeld = function () {
    var st = U.st, mx = MX.ensure(st), tab = (U.p && U.p.tab) || 'fans', club = S.userClub(st), ps = mx.people, id = MX.ident(st, club);
    var h = '<h1>' + lc('megaphone', 22) + ' Umfeld & Medien</h1>' + resume(st) + seg('mxumfeld', tab, [['fans', 'Fans'], ['medien', 'Medien & Feed'], ['vorstand', 'Vorstand'], ['sponsoren', 'Sponsoren'], ['stab', 'Trainerstab'], ['berater', 'Berater & Vereine'], ['opt', 'Einstellungen']]);
    if (tab === 'fans') {
      h += '<div class="grid g2"><div class="panel"><h2>Fangruppen</h2><table class="t small">' + row('Gesamtstimmung', MX.fanMood(st)) + Object.keys(MX.FANG).map(function (k) { return row(MX.FANG[k], mx.fans[k]); }).join('') + '</table></div>';
      h += '<div class="panel"><h2>Vereinsidentität: ' + esc(id.label) + '</h2><table class="t small">' + row('Tradition', id.trad) + row('Nachwuchs', id.youth) + row('Regionale Verwurzelung', id.region) + row('Erwartungen', id.expect) + row('Finanzkraft', id.money) + row('Ambition', id.ambition) + row('Toleranz bei Verkäufen', id.sell) + '</table>' +
        '<h3 style="margin-top:10px;font-size:14px">Ansprechpartner</h3><table class="t small">' + ['fanClubs', 'ultras', 'fanProj'].map(function (k) { return row(ps[k].name + ' (' + ps[k].role + ')', ps[k].v); }).join('') + '</table></div></div>';
    } else if (tab === 'medien') {
      h += '<div class="grid g2"><div class="panel"><h2>Journalisten</h2><table class="t small">' + row('Öffentliches Ansehen', mx.media) + ps.jrn.map(function (j) { return row(j.name + ' – ' + j.outlet, j.v, j.type); }).join('') + '</table><p class="muted small">Reporter merken sich deine Aussagen und greifen sie später wieder auf.</p></div>';
      var said = mx.mem.said.filter(function (s) { return !/^prom_/.test(s.k); }).slice(0, 8);
      h += '<div class="panel"><h2>Deine Aussagen</h2>' + (said.length ? '<ul class="small">' + said.map(function (s) { return '<li>„' + esc(s.txt) + '“ <span class="muted">(' + s.s + ', Wo. ' + s.w + ')</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Noch keine öffentlichen Aussagen.</p>') + '</div></div>';
      h += '<div class="panel" style="margin-top:12px"><h2>Social Media & Schlagzeilen</h2>' + (mx.feed.length ? '<ul class="mx-feed" style="list-style:none;padding:0;margin:0">' + mx.feed.slice(0, 30).map(function (f) { return '<li><b>' + esc(f.who) + '</b><span>' + esc(f.txt) + (f.react ? ' <span class="muted">(Reaktion: ' + esc({ statement: 'Stellungnahme', interview: 'Interview', dementi: 'Dementi', support: 'Unterstützung', accept: 'Kritik akzeptiert', silence: 'Schweigen' }[f.react] || f.react) + ')</span>' : '') + '</span><span class="muted small" style="margin-left:auto">' + f.s + '/' + f.w + '</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Noch keine Beiträge.</p>') + '</div>';
      h += '<p><button class="sm" data-act="mxPress">Pressekonferenz einberufen</button></p>';
    } else if (tab === 'vorstand') {
      var keys = ['pres', 'ceo', 'sd', 'ar'].concat(ps.inv ? ['inv'] : []);
      h += '<div class="grid g2"><div class="panel"><h2>Vereinsführung</h2><table class="t small">' + row('Vertrauen des Vorstands', st.manager.trust || 50) + keys.map(function (k) { return row(ps[k].name + ' (' + ps[k].role + ')', ps[k].v, ps[k].style); }).join('') + '</table></div>';
      var ag = mx.mem.agree.slice(0, 8);
      h += '<div class="panel"><h2>Vereinbarungen</h2>' + (ag.length ? '<ul class="small">' + ag.map(function (a) { return '<li><b>' + a.s + ':</b> ' + esc(a.txt) + (a.done ? (a.hit || (a.got != null && a.got >= a.pts) ? ' <span class="pos">✔ erfüllt</span>' : ' <span class="neg">✘ verfehlt</span>') : ' <span class="muted">(läuft)</span>') + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Noch keine Vereinbarungen.</p>') + '<p class="muted small">Saisonziele werden im Zielgespräch verhandelt und am Saisonende nach dieser Vereinbarung bewertet.</p></div></div>';
    } else if (tab === 'sponsoren') {
      var sp = MX.mainSponsor(st);
      h += '<div class="panel"><h2>Hauptsponsor: ' + esc(sp ? sp.name : '–') + '</h2><table class="t small">' + row('Zufriedenheit', mx.spons.v) + '</table>' + (mx.spons.goals.length ? '<h3 style="margin-top:10px;font-size:14px">Ziele dieser Saison</h3><ul class="small">' + mx.spons.goals.map(function (g) { var d = MX.SGOALS[g.k]; var ok = d.ok(st); return '<li><b>' + esc(d.n) + '</b>: ' + esc(d.d) + ' – Bonus ' + money(g.bonus) + ' <span class="' + (ok ? 'pos' : 'muted') + '">' + (g.done != null ? (g.done ? '✔ ausgezahlt' : '✘ verfehlt') : ok ? '✔ aktuell erreicht' : 'offen') + '</span></li>'; }).join('') + '</ul><p class="muted small">Boni werden am Saisonende genau einmal als „Sponsoring“ gebucht.</p>' : '<p class="muted small">Keine Zusatzziele vereinbart.</p>') + '</div>';
    } else if (tab === 'stab') {
      h += '<div class="panel"><h2>Trainerstab</h2><div class="mx-scroll"><table class="t small mx-tbl"><tr><th>Name</th><th>Funktion</th><th class="num">Kompetenz</th><th class="num">Zufriedenheit</th><th class="mx-hide-s">Philosophie</th><th class="mx-hide-s">Ehrgeiz</th></tr>' + MX.staffList(st).map(function (s) { return '<tr><td>' + esc(s.name) + '</td><td>' + esc(s.role) + '</td><td class="num">' + Math.round(s.comp) + '</td><td class="num">' + Math.round(s.v) + '</td><td class="mx-hide-s">' + esc(s.idea) + '</td><td class="mx-hide-s">' + (s.amb >= 14 ? 'hoch' : s.amb >= 9 ? 'mittel' : 'gering') + '</td></tr>'; }).join('') + '</table></div>' + (mx.hist.staff.length ? '<p class="small muted">Ehemalige: ' + mx.hist.staff.map(function (x) { return esc(x.n) + ' (' + esc(x.role) + ', ' + x.s + (x.to ? ' → ' + esc(x.to) : '') + ')'; }).join(', ') + '</p>' : '') + '</div>';
    } else if (tab === 'berater') {
      h += '<div class="grid g2"><div class="panel"><h2>Spielerberater</h2><table class="t small">' + mx.agents.map(function (a) { return row(a.name + ' (' + MX.ATYPES[a.type] + ')', a.v, a.deals + ' Abschlüsse'); }).join('') + '</table></div>';
      var rel = Object.keys(mx.rel).map(function (k) { return { c: st.clubs[k], v: mx.rel[k] }; }).filter(function (x) { return x.c; }).sort(function (a, b) { return Math.abs(b.v - 50) - Math.abs(a.v - 50); }).slice(0, 12);
      h += '<div class="panel"><h2>Beziehungen zu anderen Vereinen</h2>' + (rel.length ? '<table class="t small">' + rel.map(function (x) { return row(x.c.name, x.v); }).join('') + '</table>' : '<p class="muted small">Noch keine besonderen Beziehungen.</p>') + '<p class="muted small">Gute Beziehungen erleichtern Transfers und Leihen, schlechte verteuern sie.</p></div></div>';
    } else {
      h += '<div class="panel"><h2>Ereignisdichte</h2><p class="small">Wie oft sollen Geschichten rund um den Verein entstehen?</p><div class="seg">' + [['ruhig', 'Ruhig'], ['normal', 'Normal'], ['lebendig', 'Lebendig']].map(function (x) { return '<button class="' + (mx.opt.density === x[0] ? 'on' : '') + '" data-act="mxOpt" data-k="density" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        '<p class="small" style="margin-top:12px"><label><input type="checkbox" data-act="mxOpt" data-k="autoMinor"' + (mx.opt.autoMinor ? ' checked' : '') + '> Gewöhnliche Gespräche automatisch vom Assistenten erledigen lassen</label></p><p class="muted small">Wichtige Entscheidungen, Krisen und Höhepunkte erscheinen immer. Beim Autoweiter beantwortet der Assistent gewöhnliche Gespräche mit der zurückhaltenden Standardoption.</p></div>';
    }
    return h;
  };
  U.acts.mxOpt = function (d) { var mx = MX.ensure(U.st); if (d.k === 'autoMinor') mx.opt.autoMinor = !mx.opt.autoMinor; else mx.opt[d.k] = d.v; U.autosave(); U.render(); };
  U.acts.mxPress = function () { var st = U.st; if (!MX.cool(st, 'manualPress', 3)) { U.toast('Die nächste Pressekonferenz ist erst in einigen Wochen sinnvoll.'); return; } MX.setCool(st, 'manualPress'); MX.start(st, 'press', MX.pressTopics(st, true, 'auf eigenen Wunsch'), { prio: 5, manual: 1 }); U.mxShow(); };

  // ---------- Vereinsgedächtnis ----------
  U.screens.mxgedaechtnis = function () {
    var st = U.st, mx = MX.ensure(st), f = (U.p && U.p.tab) || 'alle', h = '<h1>' + lc('book-open', 22) + ' Vereinsgedächtnis</h1>';
    var seas = mx.hist.seasons.slice().reverse();
    h += '<div class="grid g2"><div class="panel"><h2>Saisons unter deiner Leitung</h2>' + (seas.length ? '<div class="mx-scroll"><table class="t small mx-tbl"><tr><th>Saison</th><th>Verein</th><th class="num">Platz</th><th class="mx-hide-s">Bester Spieler</th></tr>' + seas.map(function (s) { return '<tr><td>' + s.s + '</td><td>' + esc(s.club || '') + '</td><td class="num">' + (s.pos || '–') + '</td><td class="mx-hide-s">' + esc(s.top ? s.top.n + ' (' + s.top.g + (HB ? ' Tore' : ' Tore') + ')' : '') + '</td></tr>'; }).join('') + '</table></div>' : '<p class="muted small">Die erste Saison läuft.</p>') + '</div>';
    var leg = MX.legends(st);
    h += '<div class="panel"><h2>Legenden & Rekorde</h2>' + (leg.length ? '<ul class="small">' + leg.slice(0, 10).map(function (l) { return '<li><b>' + esc(l.n) + '</b> – ' + l.seasons + ' Saisons, ' + l.apps + ' Spiele, ' + l.goals + ' Tore' + (l.hg ? ', Eigengewächs' : '') + (l.nt ? ', ' + l.nt + ' Länderspiele' : '') + '</li>'; }).join('') + '</ul>' : '<p class="muted small">Noch keine Vereinslegenden.</p>') +
      (mx.hist.records.unbeaten ? '<p class="small">Längste Serie ohne Niederlage: ' + mx.hist.records.unbeaten.v + ' Spiele (' + mx.hist.records.unbeaten.s + ')</p>' : '') +
      (mx.hist.titles.length ? '<p class="small"><b>Titel & Meilensteine:</b> ' + mx.hist.titles.map(function (t) { return esc(t.t) + ' (' + t.s + ')'; }).join(', ') + '</p>' : '') +
      (mx.hist.youthSales.length ? '<p class="small"><b>Verkaufte Eigengewächse:</b> ' + mx.hist.youthSales.slice(-8).map(function (y) { return esc(y.name) + ' (' + money(y.fee) + ')'; }).join(', ') + '</p>' : '') +
      (mx.hist.builds.length ? '<p class="small"><b>Bauprojekte:</b> ' + mx.hist.builds.map(function (b) { return esc(b.n) + ' (' + b.s + ')'; }).join(', ') + '</p>' : '') +
      (mx.hist.moves.length ? '<p class="small"><b>Stationen:</b> ' + mx.hist.moves.map(function (x) { return esc(x.fromName) + ' → ' + esc(x.toName) + ' (' + x.s + ')'; }).join(', ') + '</p>' : '') + '</div></div>';
    h += '<div class="panel" style="margin-top:12px"><h2>Chronik</h2>' + seg('mxgedaechtnis', f, [['alle', 'Alle'], ['wichtig', 'Nur Wichtiges']]) + '<ul class="mx-chron" style="list-style:none;padding:0;margin:0">' + mx.chron.filter(function (c) { return f !== 'wichtig' || c.imp >= 2; }).slice(0, 80).map(function (c) { return '<li><span class="ic">' + esc(c.ic) + '</span><div><b>' + esc(c.ti) + '</b> <span class="muted small">' + c.s + ', Woche ' + c.w + '</span><div class="small">' + esc(c.x) + '</div></div></li>'; }).join('') + '</ul></div>';
    return h;
  };

  // ---------- Privatleben ----------
  U.screens.mxprivat = function () {
    var st = U.st, lf = MX.ensure(st).life, pt = lf.partner, h = '<h1>' + lc('heart', 22) + ' Privatleben</h1>' + resume(st);
    h += '<div class="grid g2"><div class="panel"><h2>Befinden</h2><table class="t small">' + row('Stress', lf.stress, null, true) + (pt ? row('Beziehung zu ' + pt.name.split(' ')[0], pt.v) : '') + '</table><p class="muted small">Hoher Stress wirkt auf deine Ausstrahlung in der Kabine. Zeit für Privates senkt ihn – kostet aber Präsenz im Verein.</p></div>';
    h += '<div class="panel"><h2>Beziehung</h2>';
    if (pt) h += '<div class="lf-card"><h3>' + esc(pt.name) + '</h3><div class="muted small">' + esc(pt.job) + '</div><div class="lf-stage">' + MX.LSTAGE.slice(1).map(function (s, i) { return '<span class="' + (i + 1 === pt.stage ? 'on' : i + 1 < pt.stage ? 'done' : '') + '">' + esc(s) + '</span>'; }).join('') + '</div></div>';
    else if (lf.cands.length) h += '<p class="small">Du hast die Nummer von <b>' + esc(lf.cands[0].name) + '</b> (' + esc(lf.cands[0].job) + ').</p>';
    else h += '<p class="muted small">Single. Bei Galas, im Café oder bei Freunden ergeben sich manchmal Begegnungen.</p>';
    var can = (pt || lf.cands.length) && tick(st) - lf.lastDate >= 2;
    h += '<p><button class="sm primary" data-act="mxDate"' + (can ? '' : ' disabled') + '>' + (pt ? 'Gemeinsamen Abend planen' : 'Zu einem Date einladen') + '</button>' + (pt ? ' <button class="sm" data-act="mxTalk">Aussprache</button>' : '') + '</p>' + (!can && (pt || lf.cands.length) ? '<p class="muted small">Der nächste freie Abend ist in einigen Tagen.</p>' : '') + '</div></div>';
    if (lf.exes.length) h += '<div class="panel" style="margin-top:12px"><h2>Frühere Beziehungen</h2><ul class="small">' + lf.exes.map(function (x) { return '<li>' + esc(x.name) + ' (' + x.s + ') – ' + esc(x.why || '') + '</li>'; }).join('') + '</ul></div>';
    return h;
  };
  U.acts.mxDate = function () { var st = U.st; MX.start(st, 'life_date', {}, { prio: 6, manual: 1 }); U.mxShow(); };
  U.acts.mxTalk = function () { var st = U.st; if (!MX.cool(st, 'lifeTalk', 3)) { U.toast('Ihr habt erst kürzlich miteinander gesprochen.'); return; } MX.setCool(st, 'lifeTalk'); MX.start(st, 'life_partner_talk', {}, { prio: 6, manual: 1 }); U.mxShow(); };
})(RFM);
