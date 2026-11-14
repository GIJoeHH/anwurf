// ANWURF! – Oberfläche: Kern, Navigation, Dialoge, Start & Karriere-Assistent
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, M = R.match;
  var U = R.ui = { st: null, screen: 'start', p: {}, screens: {}, acts: {}, sortState: {} };
  var esc = R.esc, money = R.fmtMoney;
  U.esc = esc;

  // ---------- Grundfunktionen ----------
  U.club = function () { return U.st && !U.st.manager.unemployed ? U.st.clubs[U.st.manager.clubId] : null; };
  U.can = function (area) {
    var st = U.st; if (!st || st.manager.unemployed) return false;
    var r = st.manager.role;
    if (area === 'sport') return r !== 'gf';
    if (area === 'business') return r !== 'trainer';
    return true;
  };
  U.roleNote = function (area) {
    if (U.can(area)) return '';
    return '<div class="help" style="margin-bottom:12px">' + (area === 'sport' ? '🤖 Dieser Bereich wird vom KI-Trainer (' + esc(U.club().coach.name) + ', ' + esc(U.club().coach.profile) + ') verwaltet. Sie können alles einsehen.' : '🤖 Dieser Bereich wird von der KI-Geschäftsführung verwaltet. Sie können alles einsehen.') + '</div>';
  };
  U.go = function (screen, params) { U.screen = screen; U.p = params || {}; U.render(); var m = document.getElementById('main'); if (m) m.scrollTop = 0; };
  // ---------- Private Original-Logos (Web-App: einmal importierte Datei daten/ANWURF_Logos.json) ----------
  var LOGO_KEY = 'anwurf_logos', logoDone = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
  U.storedLogos = function () { try { var v = JSON.parse(localStorage.getItem(LOGO_KEY) || 'null'); return v && v.logos ? v : null; } catch (e) { return null; } };
  U.applyLogos = function (st, force) {
    var L = U.storedLogos(); if (!st || !L) return 0;
    if (!force && logoDone && logoDone.has(st)) return 0;
    var n = 0; Object.keys(st.clubs).forEach(function (k) { var c = st.clubs[k], u = L.logos[c.name]; if (u && c.logoUrl !== u && !c.crestImage) { c.logoUrl = u; n++; } });
    if (logoDone) logoDone.add(st); return n;
  };
  U.acts.importLogos = function () {
    U.pickFile('.json,application/json', function (text) {
      try {
        var d = JSON.parse(text);
        if (!d || d.format !== 'anwurf-logos' || !d.logos) throw new Error('Das ist keine ANWURF!-Logo-Datei (daten/ANWURF_Logos.json).');
        try { localStorage.setItem(LOGO_KEY, JSON.stringify({ stamp: d.stamp, logos: d.logos })); } catch (e) { throw new Error('Der Browser erlaubt kein Speichern (privates Fenster?).'); }
        var n = U.applyLogos(U.st, true); if (U.st) U.autosave();
        U.toast(Object.keys(d.logos).length + ' Original-Logos importiert' + (U.st ? ' – ' + n + ' im laufenden Spiel ergänzt.' : '.')); U.render();
      } catch (e) { U.modal('Logo-Import fehlgeschlagen', '<p>' + esc(e.message) + '</p>'); }
    });
  };
  U.acts.removeLogos = function () {
    var L = U.storedLogos(); try { localStorage.removeItem(LOGO_KEY); } catch (e) {}
    if (U.st && L) {
      var real = R.data.real, li = real ? real.clubCols.indexOf('logo') : -1, orig = {};
      if (real) real.clubs.forEach(function (r) { if (r[li]) orig[r[0]] = r[li]; });
      Object.keys(U.st.clubs).forEach(function (k) { var c = U.st.clubs[k]; if (L.logos[c.name] && c.logoUrl === L.logos[c.name]) { if (orig[c.name]) c.logoUrl = orig[c.name]; else delete c.logoUrl; } });
      U.autosave();
    }
    U.toast('Importierte Logos entfernt.'); U.render();
  };
  U.render = function () {
    if (U.st) U.applyLogos(U.st);
    if (R.logos && U.st && !U._logoAuto) { U._logoAuto = true; setTimeout(function () { R.logos.autoLoad(U.st, function () { if (U.screen === 'verein') U.render(); }); }, 4000); }
    var app = document.getElementById('app');
    var inGame = !!U.st && ['start', 'wizard', 'load'].indexOf(U.screen) < 0;
    app.classList.toggle('nogame', !inGame);
    if (inGame) { U.renderTop(); U.renderNav(); }
    var fn = U.screens[U.screen] || U.screens.zentrale;
    var html;
    try { html = fn(); } catch (e) { console.error(e); html = '<div class="panel"><h2>Fehler</h2><pre class="small">' + esc(e.stack || e) + '</pre></div>'; }
    document.getElementById('main').innerHTML = html;
    if (R.s3d) { try { R.s3d.mountAll(document.getElementById('main')); } catch (e) { console.error(e); } }
    if (U.after) { var a = U.after; U.after = null; a(); }
    if (U.st && U.st.toast) { U.toast(U.st.toast.text); U.st.toast = null; }
  };
  U.toast = function (text, ms) {
    var t = document.getElementById('toast'); t.textContent = text; t.classList.remove('hidden');
    clearTimeout(U._tt); U._tt = setTimeout(function () { t.classList.add('hidden'); }, ms || 2600);
  };
  U.modal = function (title, body, footer, wide) {
    var m = document.getElementById('modal');
    m.innerHTML = '<div class="dlg' + (wide ? ' wide' : '') + '" role="dialog" aria-label="' + esc(String(title).replace(/<[^>]+>/g, '')) + '"><div class="dlg-h"><span>' + title + '</span><button class="sm ghost" data-act="closeModal" aria-label="Schließen">' + (U.lc ? U.lc('x', 16) : '✕') + '</button></div><div class="dlg-b">' + body + '</div>' + (footer ? '<div class="dlg-f">' + footer + '</div>' : '') + '</div>';
    m.classList.remove('drawer'); m.classList.remove('hidden');
  };
  // Seitliches Detailpanel (z. B. Spielerprofil) – gleiche Bedienung wie ein Dialog
  U.drawer = function (title, body, footer) { U.modal(title, body, footer); document.getElementById('modal').classList.add('drawer'); };
  U.closeModal = function () { var m = document.getElementById('modal'); m.classList.add('hidden'); m.classList.remove('drawer'); m.innerHTML = ''; U.modalLock = false; };
  U.acts.closeModal = function () { if (!U.modalLock) U.closeModal(); };
  U.confirm = function (title, text, onYes) {
    U._confirmYes = onYes;
    U.modal(title, '<p>' + text + '</p>', '<button data-act="closeModal">Abbrechen</button><button class="primary" data-act="confirmYes">OK</button>');
  };
  U.acts.confirmYes = function () { var f = U._confirmYes; U.closeModal(); if (f) f(); };

  // Ereignisdelegation – Fehler in einer Aktion werden angezeigt, statt still zu verpuffen (und ein gesperrtes Fenster wird freigegeben)
  U.runAct = function (fn, el, e) {
    try { fn(el.dataset, el, e); }
    catch (err) { if (typeof console !== 'undefined') console.error(err); U.modalLock = false; U.toast('Fehler: ' + ((err && err.message) || err), 6000); }
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = U.acts[el.dataset.act];
    if (fn) { e.preventDefault(); U.runAct(fn, el, e); }
  });
  document.addEventListener('change', function (e) {
    var el = e.target.closest('[data-chg]');
    if (!el) return;
    var fn = U.acts[el.dataset.chg];
    if (fn) U.runAct(fn, el, e);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !document.getElementById('modal').classList.contains('hidden')) U.acts.closeModal();
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('nav-item')) { e.preventDefault(); e.target.click(); return; } // Tastaturbedienung der Navigation
    if (e.key === ' ' && U.screen === 'match' && U.acts.matchPause && e.target.tagName !== 'INPUT') { e.preventDefault(); U.acts.matchPause(); }
  });
  document.addEventListener('input', function (e) {
    var el = e.target.closest('[data-inp]');
    if (el && U.acts[el.dataset.inp]) U.runAct(U.acts[el.dataset.inp], el, e);
  });

  // ---------- Grafische Helfer ----------
  U.crest = function (club, size) {
    size = size || 36;
    if (club.crestImage) return '<span style="display:inline-block;width:' + size + 'px;height:' + size + 'px"><img class="crest-img" src="' + club.crestImage + '" alt=""></span>';
    // Original-Logo (Bundesliga/2. Bundesliga): wird aus dem Netz geladen; ohne Verbindung erscheint das erzeugte Wappen
    if (club.logoUrl && !(U.st && U.st.settings && U.st.settings.noLogos) && !club._logoNoUrl) {
      var gen = U.crest({ id: club.id, short: club.short, colors: club.colors, crest: club.crest, _logoNoUrl: true }, size);
      return '<span class="crest-logo" style="width:' + size + 'px;height:' + size + 'px"><img class="crest-img" src="' + esc(club.logoUrl) + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add(\'fail\')">' + gen + '</span>';
    }
    var c1 = club.colors[0], c2 = club.colors[1], sh = club.crest.shape % 4, sy = club.crest.symbol % 6;
    var shapes = ['M50 4 L92 16 L88 60 Q80 86 50 98 Q20 86 12 60 L8 16 Z', 'M50 4 A46 46 0 1 1 49.9 4 Z', 'M50 2 L96 50 L50 98 L4 50 Z', 'M10 8 H90 V70 Q90 90 50 98 Q10 90 10 70 Z'];
    var initials = esc(club.short.replace(/[^A-Za-zÄÖÜ]/g, '').slice(0, 2).toUpperCase());
    var symbols = [
      '<text x="50" y="62" font-size="30" font-weight="900" text-anchor="middle" fill="' + c2 + '" font-family="Menlo,monospace">' + initials + '</text>',
      '<path d="M50 22 L57 42 L78 42 L61 55 L68 76 L50 63 L32 76 L39 55 L22 42 L43 42 Z" fill="' + c2 + '"/>',
      '<circle cx="50" cy="52" r="22" fill="#fff" stroke="#111" stroke-width="2"/><path d="M50 38 L60 46 L56 58 L44 58 L40 46 Z" fill="#111"/>',
      '<rect x="36" y="10" width="10" height="90" fill="' + c2 + '"/><rect x="56" y="10" width="10" height="90" fill="' + c2 + '"/>',
      '<path d="M20 40 L50 64 L80 40 L80 54 L50 78 L20 54 Z" fill="' + c2 + '"/>',
      '<path d="M26 66 L26 36 L38 50 L50 30 L62 50 L74 36 L74 66 Z" fill="' + c2 + '"/>'
    ];
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" style="flex:none"><defs><clipPath id="cp' + club.id + sh + '"><path d="' + shapes[sh] + '"/></clipPath></defs><path d="' + shapes[sh] + '" fill="' + c1 + '" stroke="#0b1220" stroke-width="5"/><g clip-path="url(#cp' + club.id + sh + ')">' + symbols[sy] + '</g><path d="' + shapes[sh] + '" fill="none" stroke="' + c2 + '" stroke-width="3" opacity=".8"/></svg>';
  };
  U.clubLink = function (c, withCrest) { return '<span class="row" style="gap:6px;display:inline-flex;flex-wrap:nowrap;cursor:pointer" data-act="clubInfo" data-id="' + c.id + '">' + (withCrest ? U.crest(c, 18) : '') + esc(c.name) + '</span>'; };
  U.posTag = function (p) { return '<span class="tag ' + p + '" title="' + (D.posNames[p] || p) + '">' + (D.posShort[p] || p) + '</span>'; };
  U.ovrBadge = function (v) {
    var col = v >= 80 ? '#16a34a' : v >= 70 ? '#4d9e2b' : v >= 60 ? '#a2a21a' : v >= 50 ? '#b3741d' : '#9b3a2a';
    return '<span class="ovr" style="background:' + col + '">' + Math.round(v) + '</span>';
  };
  U.bar = function (v, max, col) { return '<div class="bar"><i style="width:' + R.clamp(v / (max || 100) * 100, 0, 100) + '%;' + (col ? 'background:' + col : '') + '"></i></div>'; };
  U.formDots = function (arr) { return '<span class="form-dots">' + (arr || []).slice(-5).map(function (f) { return '<span class="' + f + '">' + f + '</span>'; }).join('') + '</span>'; };
  U.kpi = function (l, v, cls) { return '<div class="kpi"><div class="l">' + l + '</div><div class="v ' + (cls || '') + '">' + v + '</div></div>'; };
  U.moneyCls = function (v) { return v < 0 ? 'neg' : ''; };
  U.sparkline = function (arr, w, h, col) {
    w = w || 300; h = h || 80; if (!arr || arr.length < 2) return '<svg width="' + w + '" height="' + h + '"></svg>';
    var mn = Math.min.apply(null, arr), mx = Math.max.apply(null, arr), rg = mx - mn || 1;
    var pts = arr.map(function (v, i) { return (i / (arr.length - 1) * (w - 4) + 2).toFixed(1) + ',' + (h - 4 - (v - mn) / rg * (h - 8)).toFixed(1); });
    var up = arr[arr.length - 1] >= arr[0];
    col = col || (up ? '#22c55e' : '#ef4444');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="chart" preserveAspectRatio="none" style="height:' + h + 'px"><polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2"/><polygon points="2,' + h + ' ' + pts.join(' ') + ' ' + (w - 2) + ',' + h + '" fill="' + col + '" opacity=".12"/></svg>';
  };
  // Sortierbare Tabellen: cols = [{k, l, num, f(row), v(row)}]
  U.table = function (id, cols, rows, opts) {
    opts = opts || {};
    var ss = U.sortState[id] || opts.sort || null;
    if (ss) {
      var col = cols.filter(function (c) { return c.k === ss.k; })[0];
      if (col) rows = rows.slice().sort(function (a, b) { var va = col.v ? col.v(a) : a[col.k], vb = col.v ? col.v(b) : b[col.k]; if (typeof va === 'string') return ss.d * va.localeCompare(vb); return ss.d * ((va || 0) - (vb || 0)); });
    }
    var h = '<table class="t"><thead><tr>' + cols.map(function (c) {
      var arrow = ss && ss.k === c.k ? (ss.d > 0 ? ' ▲' : ' ▼') : '';
      return '<th class="' + (c.nosort ? '' : 'sort ') + (c.num ? 'num' : '') + '" ' + (c.nosort ? '' : 'data-act="sortTable" data-id="' + id + '" data-k="' + c.k + '"') + '>' + c.l + arrow + '</th>';
    }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r, i) {
      var cls = opts.rowClass ? opts.rowClass(r, i) : '';
      h += '<tr class="' + cls + (opts.click ? ' click' : '') + '"' + (opts.click ? ' data-act="' + opts.click + '" data-id="' + (r.id || '') + '"' : '') + '>' + cols.map(function (c) {
        return '<td class="' + (c.num ? 'num' : '') + '">' + (c.f ? c.f(r, i) : esc(r[c.k])) + '</td>';
      }).join('') + '</tr>';
    });
    if (!rows.length) h += '<tr><td colspan="' + cols.length + '" class="muted">Keine Einträge</td></tr>';
    return h + '</tbody></table>';
  };
  U.acts.sortTable = function (d) {
    var cur = U.sortState[d.id];
    U.sortState[d.id] = { k: d.k, d: cur && cur.k === d.k ? -cur.d : -1 };
    U.render();
  };

  // ---------- Kopfzeile & Navigation ----------
  U.renderTop = function () {
    var st = U.st, c = U.club(), el = document.getElementById('topbar');
    var nextSub = st.phase === 'seasonEnd' ? 'Neue Saison' : st.phase === 'releg' ? 'Relegation' : S.isBreak(st) ? 'Nächste Woche' : 'Nächster Spieltag';
    function chip(icon, label, val, cls, opt) { return '<div class="tb-chip' + (opt ? ' opt' : '') + '">' + U.lc(icon, 18) + '<div><span>' + label + '</span><b class="' + (cls || '') + '">' + val + '</b></div></div>'; }
    var nextBtn = function (sub) { return '<button class="btn-next" data-act="next"' + (U.busy ? ' disabled' : '') + '><span class="bn-txt">Weiter<small>' + sub + '</small></span>' + U.lc('chevron-right', 20) + '</button>'; };
    if (!c) {
      el.innerHTML = '<div class="tb-club"><div><div class="name">' + esc(st.manager.name) + ' – vereinslos</div><div class="sub">Saison ' + st.season + '/' + String(st.season + 1).slice(2) + ' · ' + S.calText(st) + '</div></div></div><div class="tb-spacer"></div>' + nextBtn(st.phase === 'seasonEnd' ? 'Neue Saison' : 'Woche abwarten');
      return;
    }
    var pos = E.leaguePos(st, c);
    var squad = W.squad(st, c.id);
    var strength = Math.round(M.squadStrength(st, c));
    var mood = Math.round(R.avg(squad, function (p) { return p.morale; }));
    var prep = S.prepareWeek(st), nxt = prep.list.filter(function (x) { return x.user; })[0];
    var opp = nxt ? st.clubs[nxt.h === c.id ? nxt.a : nxt.h] : null;
    el.innerHTML = '<div class="tb-club">' + U.crest(c, 40) + '<div><div class="name">' + esc(c.name) + (st.cheatUsed ? ' <span class="cheat-tag" title="Spielstand mit Cheat">CHEAT</span>' : '') + '</div><div class="sub">' + D.leagueNames[W.lk(c)] + ' · ' + S.roleName(st.manager.role) + ' · Saison ' + st.season + '/' + String(st.season + 1).slice(2) + '</div></div></div>' +
      chip('trophy', 'Tabellenplatz', st.week > 0 ? pos + '.' : '–') +
      chip('calendar-days', S.isBreak(st) ? 'Woche' : 'Spieltag', S.calText(st, true)) +
      chip('wallet', 'Kontostand', money(c.cash), c.cash < 0 ? 'neg' : '') +
      chip('users', 'Fanbasis', R.fmtNum(c.fans || 0), '', true) +
      chip('gauge', 'Stärke · Moral', strength + ' · ' + mood, '', true) +
      chip('shield', 'Nächster Gegner', opp ? esc(opp.short) + (nxt.comp !== 'league' ? ' (' + (nxt.comp === 'releg' ? 'AR' : nxt.comp === 'friendly' ? 'Test' : 'Pokal') + ')' : '') + (nxt.h === c.id ? ' · H' : ' · A') : '—', '', true) +
      '<div class="tb-spacer"></div>' +
      (U.autoRun ? '<button class="sm danger" data-act="autoStop">' + U.lc('square', 14) + 'Automatik stoppen</button>' : '<button class="sm ghost" data-act="autoStart" title="Spieltage automatisch mit Sofortergebnis durchspielen, bis etwas Wichtiges passiert">' + U.lc('fast-forward', 15) + 'Auto</button>') +
      nextBtn(nextSub);
  };
  U.navItems = function () {
    var st = U.st, offers = st.inbox.filter(function (o) { return o.type === 'offer'; }).length, sp = st.inbox.filter(function (o) { return o.type === 'sponsor'; }).length;
    var items = [['zentrale', 'layout-dashboard', 'Zentrale', offers + sp, 'Sport'], ['mannschaft', 'shirt', 'Mannschaft'], ['transfer', 'arrow-left-right', 'Transfermarkt'], ['training', 'dumbbell', 'Training'], ['nachwuchs', 'graduation-cap', 'Nachwuchs'], ['medizin', 'stethoscope', 'Medizin'],
      ['verein', 'briefcase', 'Vereinsmanagement', sp, 'Verein'], ['stadion', 'stadium', 'Halle'], ['stadt', 'building-2', 'Vereinsstadt'], ['bank', 'landmark', 'Bank & Finanzen'],
      ['spieltag', 'calendar-days', 'Spieltag', 0, 'Wettbewerb'], ['liga', 'chart-column', 'Liga & Statistiken'], ['geschichte', 'trophy', 'Vereinsgeschichte'], ['karriere', 'user-round', 'Managerkarriere', st.manager.unemployed ? st.manager.offers.length : 0], ['editor', 'pencil', 'Editor', 0, 'System'], ['einstellungen', 'settings', 'Einstellungen']];
    if (st.manager.unemployed) items = items.filter(function (i) { return ['liga', 'karriere', 'editor', 'einstellungen'].indexOf(i[0]) >= 0; });
    return items;
  };
  U.renderNav = function () {
    var cur = U.screen;
    var map = { bericht: 'spieltag', match: 'spieltag', saisonende: 'liga', spieler: 'mannschaft' };
    document.getElementById('nav').innerHTML = U.navItems().map(function (i) {
      return (i[4] ? '<div class="nav-group">' + i[4] + '</div>' : '') + '<div class="nav-item ' + ((map[cur] || cur) === i[0] ? 'active' : '') + '" data-act="nav" data-s="' + i[0] + '" tabindex="0" role="link"><span class="ic">' + U.lc(i[1], 18) + '</span>' + i[2] + (i[3] ? '<span class="badge">' + i[3] + '</span>' : '') + '</div>';
    }).join('') + '<div class="nav-sep"></div><div class="nav-item" data-act="saveQuick" tabindex="0" role="button"><span class="ic">' + U.lc('save', 18) + '</span>Speichern</div>' + (R.webapp && R.webapp.dirty() ? '<div class="nav-item nav-cloud" data-act="cloudSync" tabindex="0" role="button" title="Spielstand für Mac und iPad-App in den iCloud-Ordner „Spielstände“ sichern"><span class="ic">☁︎</span>Nicht in iCloud gesichert</div>' : '') + '<div class="nav-item" data-act="toTitle" tabindex="0" role="button"><span class="ic">' + U.lc('log-out', 18) + '</span>Hauptmenü</div>';
  };
  U.acts.nav = function (d) { if (U.screen === 'match' && U.liveActive) { U.toast('Das Spiel läuft – bitte erst beenden.'); return; } U.go(d.s); };

  // ---------- Spielablauf: NÄCHSTER SPIELTAG ----------
  U.acts.next = function () {
    var st = U.st;
    if (U.busy || U.liveActive) return;
    if (st.pendingEvent) { U.showEvent(); return; }
    if (st.phase === 'seasonEnd') {
      if (U.screen !== 'saisonende') { U.go('saisonende'); return; }
      S.newSeason(st); U.autosave(); U.go(st.manager.unemployed ? 'karriere' : 'zentrale'); U.toast('Neue Saison ' + st.season + '/' + String(st.season + 1).slice(2) + ' – Saisonvorbereitung!'); return;
    }
    var prep = S.prepareWeek(st), mine = prep.list.filter(function (x) { return x.user; });
    if (mine.length && st.settings.matchSpeed !== 'sofort' && !U.autoRun) { U.startLive(mine); return; }
    U.finishWeek({});
  };
  U.finishWeek = function (played) {
    var st = U.st;
    U.busy = true;
    try { S.completeWeek(st, played); } catch (e) { console.error(e); U.busy = false; U.modal('Fehler', '<pre class="small">' + esc(e.stack || e) + '</pre>'); return; }
    U.busy = false;
    U.autosave();
    if (U.autoRun) return;
    if (st.phase === 'seasonEnd') U.go('saisonende');
    else if (st.manager.unemployed) U.go('karriere');
    else if (st.lastUserMatch && st.lastResults && st.lastResults.some(function (r) { return r.user; })) U.go('bericht');
    else U.go('zentrale');
    setTimeout(function () { if (U.afterWeekPopups) U.afterWeekPopups(); }, 300);
  };
  U.acts.autoStart = function () {
    U.autoRun = true; U.renderTop();
    (function loop() {
      if (!U.autoRun) return;
      var st = U.st;
      if (st.pendingEvent || (st.deal && U.can('business')) || st.dealReport || st.phase === 'seasonEnd' || (st.manager.unemployed && st.manager.offers.length) || st.inbox.some(function (o) { return o.type === 'sponsor'; }) && st.manager.role !== 'trainer') {
        U.autoRun = false; U.render(); if (U.afterWeekPopups) U.afterWeekPopups(); if (st.phase === 'seasonEnd') U.go('saisonende'); return;
      }
      U.finishWeek({});
      U.renderTop();
      if (U.screen === 'zentrale' || U.screen === 'liga') U.render();
      setTimeout(loop, 250);
    })();
  };
  U.acts.autoStop = function () { U.autoRun = false; U.render(); };

  U.autosave = function () {
    if (!U.st) return;
    R.save.save(U.st, 'autosave').then(function (r) { if (r && r.ok === false) U.toast('Autosave fehlgeschlagen: ' + (r.error || '')); }).catch(function (e) { console.warn(e); });
  };
  U.acts.saveQuick = function () { U.showSaveDialog(); };
  U.acts.toTitle = function () { U.confirm('Hauptmenü', 'Zum Hauptmenü zurückkehren? Der letzte Autosave bleibt erhalten.', function () { U.autosave(); U.autoRun = false; U.go('start'); }); };

  // Ereigniskarten
  U.showEvent = function () {
    var pe = U.st.pendingEvent; if (!pe) return;
    var ev = pe.custom || (pe.chaos ? D.chaosEvents : D.events)[pe.idx];
    U.modalLock = true;
    U.modal('Ereigniskarte', '<div class="event-card">' + (ev.ic ? '<div style="font-size:42px;line-height:1;margin-bottom:6px">' + ev.ic + '</div>' : '') + esc(ev.t) + (ev.st ? '<div class="event-status">' + esc(ev.st) + '</div>' : '') + '</div>', ev.o.map(function (o, i) {
      var eff = []; if (o.cash) eff.push((o.cash > 0 ? '+' : '') + money(o.cash)); if (o.mor) eff.push('Moral ' + (o.mor > 0 ? '+' : '') + o.mor); if (o.fans) eff.push('Fans ' + (o.fans > 0 ? '+' : '') + o.fans + '%');
      if (o.hint) return '<button data-act="eventPick" data-i="' + i + '">' + esc(o.l) + ' <span class="muted small">(' + esc(o.hint) + ')</span></button>';
      return '<button data-act="eventPick" data-i="' + i + '">' + esc(o.l) + (eff.length ? ' <span class="muted small">(' + eff.join(', ') + (o.chance || o.lottery ? ', Risiko' : '') + ')</span>' : (o.lottery ? ' <span class="muted small">(Risiko)</span>' : '')) + '</button>';
    }).join(''));
  };
  U.acts.eventPick = function (d) {
    var msg = S.resolveEvent(U.st, +d.i);
    U.closeModal(); U.render(); if (msg) U.toast(msg, 4000);
    setTimeout(function () { if (U.afterWeekPopups) U.afterWeekPopups(); }, 400);
  };

  // ---------- Startbildschirm ----------
  U.screens.start = function () {
    return '<div class="title-screen"><div class="title-box"><img class="title-logo" src="icons/icon-512.png" alt="ANWURF!-Logo"><div class="logo">ANWURF!<small>DER HANDBALL GEHÖRT DIR</small><span class="logo-sub">Von der Schulturnhalle zum Handballimperium</span></div>' +
      '<div class="menu-btns">' + (U.st ? '<button class="primary" data-act="resume" style="display:flex;align-items:center;justify-content:center;gap:10px">' + (U.club() ? U.crest(U.club(), 26) : '') + '▶ Weiterspielen' + (U.club() ? ' <span style="font-weight:400;opacity:.85">· ' + esc(U.club().short) + '</span>' : '') + '</button>' : '') +
      '<button class="' + (U.st ? '' : 'primary') + '" data-act="newCareer">Neue Karriere</button><button data-act="loadScreen">Spielstand laden</button><button data-act="importSave">Spielstand importieren</button>' + '' + '</div>' +
      '<p class="muted small" style="margin-top:26px" id="storeInfo">' + (R.save.isNative ? '💾 Spielstände werden im iCloud-Sync-Ordner gespeichert.' : '💾 Browser-Modus: Spielstände liegen in diesem Browser. Zum Abgleich mit Mac/iPad: Speichern → „In iCloud sichern“ bzw. „Spielstand importieren“.' + (R.save.lastSync() ? ' Zuletzt in iCloud gesichert: ' + new Date(R.save.lastSync()).toLocaleString('de-DE') + '.' : '')) + '</p>' +
      '<p class="muted small">' + R.versionText(true) + '</p></div></div>';
  };
  U.acts.resume = function () { U.go('zentrale'); };
  U.acts.newCareer = function () { U.wiz = { step: 1, mode: null, world: W.hasRealWorld() ? 'real' : 'fiktiv', difficulty: 'normal', role: 'manager', canBeFired: true, name: 'Daniel', seed: Date.now() % 2147483647, nc: { name: 'HC Neustadt 2026', short: 'Neustadt', city: 'Neustadt', color1: '#16a34a', color2: '#ffffff', stadium: 'Sporthalle am Bahndamm', capital: 150000, crestShape: 0, crestSymbol: 1 } }; U.go('wizard'); };
  U.acts.loadScreen = function () { U.go('load'); };

  U.screens.load = function () {
    R.save.list().then(function (list) {
      var el = document.getElementById('slotList'); if (!el) return;
      list.sort(function (a, b) { return (b.saved || '').localeCompare(a.saved || ''); });
      el.innerHTML = list.length ? U.table('slots', [
        { k: 'slot', l: 'Slot', f: function (r) { return esc(r.slot === 'autosave' ? 'Autosave' : r.slot); } }, { k: 'club', l: 'Verein', f: function (r) { return esc(r.club) + (r.cheat ? ' <span class="cheat-tag">CHEAT</span>' : '') + (r.pending ? ' <span class="tag amber">wird aus iCloud geladen…</span>' : ''); } },
        { k: 'manager', l: 'Manager' }, { k: 'season', l: 'Saison', f: function (r) { return r.season + '/' + String(r.season + 1).slice(2) + ', ' + (r.phase === 'preseason' ? 'Vorbereitung' : r.phase === 'winter' ? 'Winterpause' : r.week + '. Spieltag'); } },
        { k: 'saved', l: 'Gespeichert', f: function (r) { return r.saved ? new Date(r.saved).toLocaleString('de-DE') : ''; } },
        { k: 'x', l: '', nosort: true, f: function (r) { return '<button class="sm primary" data-act="loadSlot" data-slot="' + esc(r.slot) + '">Laden</button> <button class="sm danger" data-act="delSlot" data-slot="' + esc(r.slot) + '">Löschen</button>'; } }
      ], list) : '<p class="muted">Noch keine Spielstände vorhanden.</p>';
    });
    R.save.storageInfo().then(function (i) { var el = document.getElementById('storePath'); if (el) el.textContent = i.path || ''; });
    return '<div class="title-screen"><div class="title-box" style="text-align:left"><h1>Spielstand laden</h1><div class="panel"><div id="slotList">Lade …</div><p class="muted small" id="storePath"></p></div><div class="row" style="margin-top:14px"><button data-act="toStart">← Zurück</button><button data-act="importSave">Datei importieren</button></div></div></div>';
  };
  U.acts.toStart = function () { U.go('start'); };
  U.acts.loadSlot = function (d) {
    R.save.load(d.slot).then(function (st) { U.st = st; U.autoRun = false; U.go(st.phase === 'seasonEnd' ? 'saisonende' : st.manager.unemployed ? 'karriere' : 'zentrale'); U.toast('Spielstand geladen.'); })
      .catch(function (e) { U.modal('Laden fehlgeschlagen', '<p>' + esc(e.message) + '</p><p class="muted">Der Spielstand wurde nicht verändert.</p>'); });
  };
  U.acts.delSlot = function (d) { U.confirm('Spielstand löschen', 'Spielstand „' + esc(d.slot) + '“ wirklich löschen? Das kann nicht rückgängig gemacht werden.', function () { R.save.remove(d.slot).then(function () { U.render(); }); }); };
  U.acts.importSave = function () {
    U.pickFile('.json,application/json', function (text) {
      try { U.st = R.save.parse(text); U.go('zentrale'); U.toast('Spielstand importiert.'); U.autosave(); if (!R.save.isNative && R.save.markSynced) R.save.markSynced(); }
      catch (e) { U.modal('Import fehlgeschlagen', '<p>' + esc(e.message) + '</p>'); }
    });
  };
  U.pickFile = function (accept, cb, asDataUrl) {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = accept;
    inp.onchange = function () { var f = inp.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { cb(rd.result, f); }; if (asDataUrl) rd.readAsDataURL(f); else rd.readAsText(f); };
    inp.click();
  };
  U.showSaveDialog = function () {
    var slots = ['Spielstand 1', 'Spielstand 2', 'Spielstand 3', 'Spielstand 4', 'Spielstand 5'];
    U.modal('Speichern', '<p class="muted">Nach jedem Spieltag wird automatisch gespeichert. Zusätzlich können Sie hier manuell sichern.</p><div class="grid g2">' + slots.map(function (s) { return '<button data-act="saveSlot" data-slot="' + s + '">💾 ' + s + '</button>'; }).join('') + '</div>' +
      (R.save.isNative ? '' : '<p class="muted small" style="margin-top:12px">☁︎ <b>In iCloud sichern</b> speichert den Spielstand als <i>autosave.json</i> + <i>autosave.meta</i>. ' + (R.save.isTouch ? 'Im Teilen-Menü „In Dateien sichern“ wählen → iCloud Drive › Privat › DH › KI › Handball-Manager-Anwurf › <b>Spielstände</b> → Sichern (bei Nachfrage „Ersetzen“).' : 'Die beiden Dateien aus dem Download-Ordner nach iCloud Drive › … › Handball-Manager-Anwurf › <b>Spielstände</b> verschieben.') + ' Danach in der Mac-App „Weiterspielen“.</p>'),
      (R.save.isNative ? '' : '<button class="primary" data-act="syncExport">☁︎ In iCloud sichern</button>') + '<button data-act="exportSave">Als JSON-Datei exportieren</button><button data-act="closeModal">Schließen</button>');
  };
  U.acts.saveSlot = function (d) { R.save.save(U.st, d.slot).then(function (r) { U.closeModal(); U.toast(r && r.ok === false ? 'Fehler: ' + r.error : 'Gespeichert: ' + d.slot); }); };
  U.acts.syncExport = function () {
    R.save.syncExport(U.st, 'autosave').then(function (r) { if (r && r.aborted) return; U.closeModal(); U.toast(r && r.how === 'download' ? 'autosave.json + autosave.meta heruntergeladen – bitte in den Ordner „Spielstände“ verschieben.' : 'In iCloud gesichert.'); });
  };
  U.acts.exportSave = function () {
    var c = U.club(); U.st.rngState = R.rng.state;
    R.save.exportFile('Anwurf_' + (c ? c.short.replace(/\W+/g, '') : 'Karriere') + '_' + U.st.season + '_ST' + U.st.week + '.json', JSON.stringify(U.st)).then(function () { U.toast('Export abgeschlossen.'); });
  };

  // ---------- Karriere-Assistent ----------
  U.wizPreview = function () {
    if (!U.wiz.preview) { U.wiz.preview = W.newGame({ seed: U.wiz.seed, difficulty: U.wiz.difficulty, clubId: 'c1', world: U.wiz.world }); if (R.crests) R.crests.applyLibrary(U.wiz.preview); U.applyLogos(U.wiz.preview, true); }
    return U.wiz.preview;
  };
  U.clubFacts = function (st, c) {
    var str = Math.round(M.squadStrength(st, c));
    var infra = Math.round(R.avg(['oepnv', 'strasse', 'parken', 'medizin', 'jugend', 'training'], function (k) { return c.fac[k] / (D.facilities[k].levels.length - 1); }) * 100);
    var t = S.targetFor(c);
    var diff = c.expectedPos <= 4 ? 'Leicht' : c.expectedPos <= 9 ? 'Mittel' : c.expectedPos <= 14 ? 'Schwer' : 'Sehr schwer';
    return { str: str, infra: infra, target: t.text, diff: diff };
  };
  U.roleChoices = function (w) {
    return '<div class="grid g3">' +
      U.choice('role', 'manager', w.role, '👔 Manager', 'Klassischer Komplettmodus: Sport und Wirtschaft. Empfohlen.') +
      U.choice('role', 'trainer', w.role, '📋 Trainer', 'Aufstellung, Training, Taktik, Transferwünsche. Die KI-Geschäftsführung verwaltet die Finanzen.') +
      U.choice('role', 'gf', w.role, '💼 Geschäftsführer', 'Finanzen, Halle, Vereinsstadt, Bank. Ein KI-Trainer übernimmt das Sportliche.') + '</div>';
  };
  U.screens.wizard = function () {
    var w = U.wiz, h = '';
    var steps = ['Karrieremodus', 'Verein', w.mode === 'found' ? 'Gründung & Rolle' : 'Rolle', 'Start'];
    h += '<div class="title-screen" style="align-items:flex-start"><div class="title-box" style="width:min(1100px,100%);text-align:left"><h1>Neue Karriere</h1><div class="wiz-step">' + steps.map(function (s, i) { return '<span class="' + (w.step === i + 1 ? 'on' : '') + '">' + (i + 1) + '. ' + s + '</span>'; }).join('') + '</div>';
    if (w.step === 1) {
      h += '<div class="grid g3">' +
        U.choice('mode', 'existing', w.mode, '🏟️ Verein übernehmen', 'Übernehmen Sie einen beliebigen Verein aus Bundesliga, 2. Bundesliga oder 3. Liga.') +
        U.choice('mode', 'found', w.mode, '🛠️ Eigenen Verein gründen', 'Präsident + Geschäftsführer + Trainer in einer Person. Start in der 3. Liga, unkündbar.') +
        U.choice('mode', 'project', w.mode, '🚀 Vom Drittligisten zum Spitzenclub', 'Schnellstart mit einem schwachen Drittligisten als Aufbauprojekt.') + '</div>';
      if (W.hasRealWorld()) h += '<div class="panel" style="margin-top:14px"><h2>Spielwelt 2026/27</h2><p class="small">🇩🇪 <b>100 echte Vereine</b>: Bundesliga (18), 2. Bundesliga (18) und 3. Liga in vier Staffeln (Nord-Ost, Nord-West, Süd-West, Süd mit je 16) – mit ' + R.fmtNum(D.real.players.length) + ' echten Spielern. Daten: ' + esc(D.real.source) + '.</p></div>';
      h += '<div class="row" style="margin-top:18px"><button data-act="toStart">← Zurück</button><div class="tb-spacer"></div><button class="primary" data-act="wizNext"' + (w.mode ? '' : ' disabled') + '>Weiter →</button></div>';
    } else if (w.step === 2) {
      var st = U.wizPreview();
      if (w.mode === 'found') {
        h += '<div class="panel"><h2>Welcher Drittligist wird ersetzt?</h2><p class="muted small">Ihr neuer Verein übernimmt den Platz in der 3. Liga (in derselben Staffel), damit jede Staffel weiterhin 16 Mannschaften hat.' + (st.world === 'real' ? ' Die Spieler des ersetzten Vereins werden vertragslos und stehen auf dem Transfermarkt.' : '') + '</p><select data-chg="wizReplace">' + W.clubsInTier(st, 3).map(function (c) { return '<option value="' + c.id + '"' + (w.replace === c.id ? ' selected' : '') + '>' + esc(c.name) + ' (' + esc(c.city) + ')</option>'; }).join('') + '</select></div>';
        if (!w.replace) w.replace = W.clubsInTier(st, 3)[0].id;
      } else {
        var lv = w.mode === 'project' ? [3] : D.leagueKeys;
        lv.forEach(function (l) {
          var cl = w.mode === 'project' ? W.clubsInTier(st, 3) : W.clubsInLeague(st, l);
          if (w.mode === 'project') cl = cl.sort(function (a, b) { return (a.tier + a.cash / 1e6) - (b.tier + b.cash / 1e6); }).slice(0, 8);
          h += '<div class="panel" style="margin-bottom:12px"><h2>' + (w.mode === 'project' ? '3. Liga – Aufbauprojekte' : D.leagueNames[l]) + '</h2><div class="scroll" style="max-height:340px">' + U.table('wiz' + l, [
            { k: 'name', l: 'Verein', f: function (c) { return '<span class="row" style="gap:6px;flex-wrap:nowrap">' + U.crest(c, 20) + esc(c.name) + '</span>'; } },
            { k: 'str', l: 'Kader', num: true, v: function (c) { return M.squadStrength(st, c); }, f: function (c) { return U.ovrBadge(M.squadStrength(st, c)); } },
            { k: 'cash', l: 'Finanzen', num: true, f: function (c) { return money(c.cash); } },
            { k: 'cap', l: 'Halle', num: true, v: function (c) { return E.capacity(c); }, f: function (c) { return R.fmtNum(E.capacity(c)); } },
            { k: 'inf', l: 'Infrastruktur', v: function (c) { return U.clubFacts(st, c).infra; }, f: function (c) { return U.bar(U.clubFacts(st, c).infra); } },
            { k: 'reputation', l: 'Ruf', num: true },
            { k: 'tg', l: 'Saisonziel', v: function (c) { return c.expectedPos; }, f: function (c) { return esc(U.clubFacts(st, c).target); } },
            { k: 'df', l: 'Schwierigkeit', v: function (c) { return c.expectedPos; }, f: function (c) { return esc(U.clubFacts(st, c).diff); } }
          ], cl, { click: 'wizPickClub', rowClass: function (c) { return c.id === w.clubId ? 'sel' : ''; } }) + '</div></div>';
        });
      }
      h += '<div class="row" style="margin-top:18px"><button data-act="wizBack">← Zurück</button><div class="tb-spacer"></div>' + (w.clubId && w.mode !== 'found' ? '<span class="muted">Gewählt: <b>' + esc(st.clubs[w.clubId].name) + '</b></span>' : '') + '<button class="primary" data-act="wizNext"' + (w.mode === 'found' || w.clubId ? '' : ' disabled') + '>Weiter →</button></div>';
    } else if (w.step === 3) {
      if (w.mode === 'found') {
        var nc = w.nc, prevClub = { id: 'prev', short: nc.short || 'FC', colors: [nc.color1, nc.color2], crest: { shape: nc.crestShape, symbol: nc.crestSymbol }, crestImage: nc.crestImage || null };
        h += '<div class="grid g21"><div class="panel"><h2>Ihr Verein</h2><div class="grid g2">' +
          U.field('Vereinsname', '<input type="text" data-inp="wizNc" data-k="name" value="' + esc(nc.name) + '" maxlength="40">') +
          U.field('Kurzname', '<input type="text" data-inp="wizNc" data-k="short" value="' + esc(nc.short) + '" maxlength="14">') +
          U.field('Heimatstadt', '<input type="text" data-inp="wizNc" data-k="city" value="' + esc(nc.city) + '" maxlength="30">') +
          U.field('Hallenname', '<input type="text" data-inp="wizNc" data-k="stadium" value="' + esc(nc.stadium) + '" maxlength="40">') +
          U.field('Vereinsfarben', '<div class="row"><input type="color" data-chg="wizNcC" data-k="color1" value="' + nc.color1 + '"><input type="color" data-chg="wizNcC" data-k="color2" value="' + nc.color2 + '"></div>') +
          U.field('Startkapital: <b id="capLbl">' + money(nc.capital) + '</b>', '<input type="range" min="50000" max="500000" step="10000" value="' + nc.capital + '" data-inp="wizCap">') +
          U.field('Wappenform', '<div class="seg">' + ['Schild', 'Kreis', 'Raute', 'Wappen'].map(function (n, i) { return '<button class="' + (nc.crestShape === i ? 'on' : '') + '" data-act="wizCrest" data-k="crestShape" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div>') +
          U.field('Wappensymbol', '<div class="seg">' + ['Initialen', 'Stern', 'Ball', 'Streifen', 'Winkel', 'Krone'].map(function (n, i) { return '<button class="' + (nc.crestSymbol === i ? 'on' : '') + '" data-act="wizCrest" data-k="crestSymbol" data-v="' + i + '">' + n + '</button>'; }).join('') + '</div>') +
          '</div><div class="row" style="margin-top:10px"><button data-act="wizCrestImg">🖼️ Eigenes Wappenbild hochladen</button>' + (nc.crestImage ? '<button data-act="wizCrestImgDel">Bild entfernen</button>' : '') + '</div><p class="help" style="margin-top:12px">Als Gründer und Präsident können Sie nicht entlassen werden. Start mit kleiner Halle, Schotterweg, Würstchenbude und Vereinsschamane.</p></div>' +
          '<div class="panel" style="text-align:center"><h2>Vorschau</h2><div id="crestPrev">' + U.crest(prevClub, 140) + '</div><div style="font-weight:800;font-size:18px;margin-top:10px" id="namePrev">' + esc(nc.name) + '</div></div></div>' +
          '<div class="panel" style="margin-top:14px"><h2>Spielmodus: Ihre Rolle</h2><p class="muted small">Als Präsident bestimmen Sie selbst, welche Aufgaben Sie übernehmen. Den Rest erledigt die KI. Die Rolle können Sie später unter „Karriere“ jederzeit wechseln.</p>' + U.roleChoices(w) + '</div>';
      } else {
        h += '<h2>Spielmodus: Ihre Rolle</h2>' + U.roleChoices(w) +
          '<div class="panel" style="margin-top:14px"><h2>Kann ich entlassen werden?</h2><div class="seg"><button class="' + (w.canBeFired ? 'on' : '') + '" data-act="wizFire" data-v="1">Ja</button><button class="' + (!w.canBeFired ? 'on' : '') + '" data-act="wizFire" data-v="0">Nein</button></div><p class="muted small">Eine Entlassung beendet nie die Karriere – es gibt immer neue Jobangebote.</p></div>';
      }
      h += '<div class="row" style="margin-top:18px"><button data-act="wizBack">← Zurück</button><div class="tb-spacer"></div><button class="primary" data-act="wizNext">Weiter →</button></div>';
    } else if (w.step === 4) {
      h += '<div class="panel"><h2>Schwierigkeitsgrad</h2><div class="grid g4">' +
        U.choice('difficulty', 'einsteiger', w.difficulty, 'Einsteiger', 'Mehr Startbudget, leichtere Verhandlungen, weniger schwere Verletzungen.') +
        U.choice('difficulty', 'normal', w.difficulty, 'Normal', 'Ausgewogene sportliche und wirtschaftliche Simulation.') +
        U.choice('difficulty', 'schwer', w.difficulty, 'Schwer', 'Knappere Finanzen, stärkere Konkurrenz, strengere Ziele.') +
        U.choice('difficulty', 'chaos', w.difficulty, 'Chaos-Modus', 'Mehr verrückte Ereignisse und Retro-Überraschungen.') + '</div></div>' +
        '<div class="panel" style="margin-top:14px"><h2>Ihr Name</h2><input type="text" data-inp="wizName" value="' + esc(w.name) + '" maxlength="30"></div>';
      h += '<div class="row" style="margin-top:18px"><button data-act="wizBack">← Zurück</button><div class="tb-spacer"></div><button class="primary" data-act="wizStart" style="padding:12px 24px;font-size:15px">🤾 Karriere starten</button></div>';
    }
    return h + '</div></div>';
  };
  U.choice = function (key, val, cur, title, text) { return '<div class="choice ' + (cur === val ? 'on' : '') + '" data-act="wizSet" data-k="' + key + '" data-v="' + val + '"><h3>' + title + '</h3><div class="muted small">' + text + '</div></div>'; };
  U.field = function (label, inner) { return '<div class="f"><span>' + label + '</span>' + inner + '</div>'; };
  U.acts.wizSet = function (d) { U.wiz[d.k] = d.v; if (d.k === 'mode') U.wiz.clubId = null; if (d.k === 'difficulty') U.wiz.preview = null; // Vereins-IDs bleiben gleich → gewählter Verein bleibt erhalten
    if (d.k === 'world') { U.wiz.preview = null; U.wiz.clubId = null; U.wiz.replace = null; } U.render(); };
  U.acts.wizNext = function () { U.wiz.step++; U.render(); };
  U.acts.wizBack = function () { U.wiz.step--; U.render(); };
  U.acts.wizPickClub = function (d) { U.wiz.clubId = d.id; U.render(); };
  U.acts.wizReplace = function (d, el) { U.wiz.replace = el.value; };
  U.acts.wizFire = function (d) { U.wiz.canBeFired = d.v === '1'; U.render(); };
  U.acts.wizName = function (d, el) { U.wiz.name = el.value; };
  U.acts.wizNc = function (d, el) { U.wiz.nc[d.k] = el.value; var n = document.getElementById('namePrev'); if (n && d.k === 'name') n.textContent = el.value; };
  U.acts.wizNcC = function (d, el) { U.wiz.nc[d.k] = el.value; U.render(); };
  U.acts.wizCap = function (d, el) { U.wiz.nc.capital = +el.value; document.getElementById('capLbl').textContent = money(+el.value); };
  U.acts.wizCrest = function (d) { U.wiz.nc[d.k] = +d.v; U.wiz.nc.crestImage = null; U.render(); };
  U.acts.wizCrestImg = function () { U.pickFile('image/*', function (url) { U.resizeImage(url, 160, function (small) { U.wiz.nc.crestImage = small; U.render(); }); }, true); };
  U.acts.wizCrestImgDel = function () { U.wiz.nc.crestImage = null; U.render(); };
  U.acts.wizStart = function () {
    var w = U.wiz;
    var main = document.getElementById('main'); main.innerHTML = '<div class="title-screen"><div class="logo" style="font-size:24px">Die Spielwelt wird erschaffen …</div></div>';
    setTimeout(function () {
      var opts = { seed: w.seed, world: w.world, difficulty: w.difficulty, managerName: w.name || 'Manager', role: w.role, canBeFired: w.canBeFired };
      if (w.mode === 'found') { opts.mode = 'found'; opts.replaceClubId = w.replace; opts.newClub = w.nc; }
      else { opts.mode = 'existing'; opts.clubId = w.clubId; }
      U.st = W.newGame(opts);
      if (R.crests) R.crests.applyLibrary(U.st);
      U.applyLogos(U.st, true);
      U.st.settings.difficulty = w.difficulty;
      U.wiz = null;
      U.autosave();
      U.go('zentrale');
      U.welcome();
    }, 30);
  };
  U.welcome = function () {
    var st = U.st, c = U.club();
    U.modal('Willkommen, ' + esc(st.manager.name) + '!', '<div class="row" style="gap:16px;flex-wrap:nowrap">' + U.crest(c, 80) + '<div><h3>' + esc(c.name) + '</h3><p>Rolle: <b>' + S.roleName(st.manager.role) + '</b>' + (st.manager.founder ? ' (als Vereinsgründer und Präsident – unkündbar)' : '') + '</p><p>Saisonziel des Vorstands: <b>' + esc(st.manager.boardTarget.text) + '</b></p></div></div>' +
      '<div class="help" style="margin-top:12px"><b>So geht’s:</b> Mit <b>NÄCHSTER SPIELTAG</b> oben rechts geht es weiter. Die beste Sieben wird automatisch aufgestellt – unter <b>Mannschaft</b> können Sie selbst eingreifen. In der <b>Saisonvorbereitung</b> lohnt sich ein Blick auf Sponsoren (Zentrale/Vereinsmanagement), Trainingslager und den Transfermarkt.</div>',
      '<button class="primary" data-act="closeModal">Los geht’s!</button>');
  };

  U.boot = function () {
    U.render();
    R.save.list().then(function (list) {
      var auto = list.filter(function (s) { return s.slot === 'autosave'; })[0];
      if (auto && !U.st) {
        var el = document.querySelector('.menu-btns');
        if (el) el.insertAdjacentHTML('afterbegin', '<button class="primary" data-act="loadSlot" data-slot="autosave">▶ Weiterspielen (' + esc(auto.club) + ', ' + auto.season + ')</button>');
      }
    }).catch(function () {});
  };
})(RFM);
