// Spielerkarriere 3.0 – Oberfläche: zentrales Gesprächsfenster (mehrstufig, mit Bild, Person, sichtbarer Reaktion
// und Zusammenfassung), Ergebnisfenster für Entscheidungen, „Mein Leben“, Vereinsgelände (vorhandene Einrichtungen
// über die Vereinsstadt-Ansicht), „Fans & Medien“, erweiterte Chronik mit Filtern. Gemeinsam für beide Sportarten.
(function (R) {
  var U = R.ui, L = R.life, X = R.cx, C = R.pc, D = R.data, W = R.world, AG = R.ag, FA = R.fa, PF = R.pf, SM = R.stadiumModel, S3 = R.s3d;
  if (!U || !L || !X) return;
  var esc = R.esc, money = R.fmtMoney, HB = X.HB;
  function on(st) { return !!(st && st.pc && C.active(st) && !st.pc.retired); }
  function tick(st) { return st.tick || 0; }
  function fn(x) { return x ? String(x.name).split(' ')[0] : ''; }
  function bar(v, col) { return U.bar(v, 100, col || (v < 30 ? 'var(--red)' : v > 70 ? 'var(--green)' : '')); }

  if (typeof document !== 'undefined' && !document.getElementById('lf-style')) {
    var css = document.createElement('style'); css.id = 'lf-style';
    css.textContent = [
      '.lf-img{position:relative;width:100%;aspect-ratio:16/7;max-height:30vh;border-radius:10px;overflow:hidden;background:var(--bg2)}.lf-img svg,.lf-img picture,.lf-img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}',
      '.lf-img .cap{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;background:linear-gradient(transparent,rgba(0,0,0,.72));color:#fff;font-weight:800;font-size:16px;display:flex;justify-content:space-between;align-items:flex-end;gap:8px}.lf-img .cap span{font-size:12px;font-weight:600;opacity:.9}',
      '.lf-who{display:flex;gap:10px;align-items:center;margin:12px 0 8px}.lf-who .av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;background:var(--panel2);border:1px solid var(--line);flex:0 0 44px}',
      '.lf-say{background:var(--panel2);border:1px solid var(--line);border-radius:12px 12px 12px 3px;padding:12px 14px;font-size:14.5px;line-height:1.45}',
      '.lf-react{border-left:3px solid var(--amber);padding:6px 10px;margin:10px 0;font-size:13.5px;background:color-mix(in srgb,var(--amber) 8%,transparent);border-radius:0 8px 8px 0;animation:cxIn .25s ease-out}',
      '.lf-chips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.lf-chip{font-size:11.5px;padding:2px 8px;border-radius:99px;border:1px solid var(--line);background:var(--bg2)}.lf-chip.pos{border-color:var(--green);color:var(--green)}.lf-chip.neg{border-color:var(--red);color:var(--red)}',
      '.lf-opts{display:grid;gap:7px;margin-top:12px}.lf-opts button{text-align:left;padding:10px 12px;font-size:14px;line-height:1.3}.lf-opts .hint{font-size:11px;color:var(--amber);margin-left:6px}',
      '.lf-steps{display:flex;gap:3px;margin-top:8px}.lf-steps i{flex:1;height:5px;border-radius:3px;background:var(--bg2)}.lf-steps i.on{background:var(--green2)}',
      '.lf-log{font-size:12.5px;margin-top:10px}.lf-log li{margin-bottom:5px}',
      '.lf-card{border:1px solid var(--line);border-radius:10px;padding:12px;background:var(--panel2);margin-bottom:10px}.lf-card h3{margin:0 0 4px;font-size:15px}',
      '.lf-stage{display:flex;gap:3px;margin:8px 0}.lf-stage span{flex:1;font-size:10px;text-align:center;padding:4px 2px;border-radius:4px;background:var(--bg2);color:var(--muted);border:1px solid var(--line)}.lf-stage span.on{background:var(--green2);color:#fff;font-weight:700}.lf-stage span.done{color:var(--text);border-color:var(--green2)}',
      '.lf-ap{display:inline-flex;gap:4px;align-items:center}.lf-ap i{width:12px;height:12px;border-radius:50%;background:var(--green2)}.lf-ap i.off{background:var(--bg2);border:1px solid var(--line)}',
      '.lf-bld{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}.lf-bld .lf-card{cursor:pointer}.lf-bld .lf-card:hover{border-color:var(--green2)}',
      '.lf-filter{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:12px}.lf-filter select{max-width:100%}',
      '.lf-thumb{width:84px;aspect-ratio:16/10;border-radius:6px;overflow:hidden;position:relative;flex:0 0 84px;background:var(--bg2)}.lf-thumb svg,.lf-thumb img,.lf-thumb picture{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}',
      '@media (max-width:640px){.lf-img{aspect-ratio:16/9}.lf-opts button{font-size:13.5px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  // ---------- Bilder: echte Assets (AVIF/WebP + JPG-Rückfall, lazy) oder SVG-Szenenbild ----------
  var SC = { trainer: ['#1e3a8a', '#3b82f6', '📋'], vertrag: ['#334155', '#64748b', '✍️'], presse: ['#831843', '#ec4899', '🎙️'], fans: ['#7c2d12', '#f97316', '📣'], date: ['#881337', '#f43f5e', '🌹'], familie: ['#134e4a', '#14b8a6', '🏡'],
    freunde: ['#4c1d95', '#a855f7', '🤝'], kabine: ['#1f2937', '#475569', '🧥'], stadion: ['#14532d', '#22c55e', '🏟️'], training: ['#065f46', '#10b981', '⚽'], medizin: ['#7f1d1d', '#ef4444', '🩺'], buero: ['#1e293b', '#0ea5e9', '🏛️'],
    finanzen: ['#713f12', '#eab308', '🧮'], feier: ['#78350f', '#facc15', '🎉'], partner: ['#881337', '#f43f5e', '💞'] };
  U.lifeSvg = function (name) {
    var s = SC[name] || SC.buero, id = 'g' + Math.floor(Math.random() * 1e6), emo = name === 'training' && HB ? '🤾' : s[2];
    return '<svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + s[0] + '"/><stop offset="1" stop-color="' + s[1] + '"/></linearGradient></defs>' +
      '<rect width="320" height="140" fill="url(#' + id + ')"/><circle cx="260" cy="20" r="70" fill="#fff" opacity=".07"/><circle cx="40" cy="140" r="60" fill="#000" opacity=".12"/><rect x="0" y="104" width="320" height="36" fill="#000" opacity=".15"/>' +
      '<text x="160" y="86" text-anchor="middle" font-size="58">' + emo + '</text></svg>';
  };
  U.lifeImg = function (img, cls, cap) {
    img = img || {}; var svg = U.lifeSvg(img.svg || (img.fallback || 'svg:buero').replace('svg:', ''));
    var pic = '';
    if (img.src) {
      var fm = img.fmt || ['jpg'], last = fm[fm.length - 1];
      pic = '<picture>' + fm.slice(0, -1).map(function (f) { return '<source type="image/' + f + '" srcset="' + esc(img.src + '.' + f) + '">'; }).join('') + '<img src="' + esc(img.src + '.' + last) + '" alt="' + esc(img.alt || '') + '" loading="lazy" decoding="async" onerror="this.parentNode.style.display=\'none\'"></picture>';
    }
    return '<div class="' + (cls || 'lf-img') + '"' + (img.src ? '' : ' role="img" aria-label="' + esc(img.alt || '') + '"') + '>' + svg + pic + (cap || '') + '</div>';
  };

  // ---------- Gesprächsfenster ----------
  function dlgKey(st) { var s = L.active(st); return s ? s.id + ':' + s.t0 + ':' + (s.data.oid || s.data.cid || s.data.friend || s.data.topic || '') : ''; }
  U.dlgPending = function (st) { var s = on(st) && L.active(st); return !!(s && !s.done && U._dlgSeen !== dlgKey(st)); };
  function chips(list) { return list && list.length ? '<div class="lf-chips">' + list.map(function (c) { return '<span class="lf-chip ' + (c.pos ? 'pos' : c.neg ? 'neg' : '') + '">' + esc(c.t) + '</span>'; }).join('') + '</div>' : ''; }
  U.showDlg = function () {
    var st = U.st, v = L.view(st); if (!v) return;
    U._dlgSeen = dlgKey(st);
    var steps = ''; for (var i = 1; i <= v.max; i++) steps += '<i class="' + (i <= v.step ? 'on' : '') + '"></i>';
    var h = U.lifeImg(v.img, 'lf-img', '<div class="cap"><div>' + esc(v.title || 'Gespräch') + '</div><span>' + (v.done ? 'Abgeschlossen' : 'Runde ' + v.step + ' von ' + v.max) + '</span></div>');
    h += '<div class="lf-steps">' + steps + '</div>';
    h += '<div class="lf-who">' + (v.who.look && U.ptPortrait ? '<div class="av pt">' + U.ptPortrait(v.who.look, 44) + '</div>' : '<div class="av">' + esc(v.who.ic || '👤') + '</div>') + '<div><b>' + esc(v.who.n) + '</b><div class="muted small">' + esc(v.who.role || '') + '</div></div></div>';
    if (v.react && (v.react.txt || v.react.eff.length)) h += '<div class="lf-react">' + (v.react.txt ? esc(v.react.txt) : '<span class="muted">Reaktion</span>') + chips(v.react.eff) + '</div>';
    if (!v.done) {
      h += '<div class="lf-say">' + esc(v.say || '') + '</div><div class="lf-opts">' + v.opts.map(function (o) { return '<button data-act="dlgPick" data-i="' + o.i + '">' + esc(o.l) + (o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '') + '</button>'; }).join('') + '</div>';
      if (!v.opts.length) h += '<p class="muted small">Keine Antwortmöglichkeit – das Gespräch endet.</p>';
    } else {
      h += '<div class="panel" style="margin-top:10px"><b>Zusammenfassung</b><p class="small">' + esc(v.sum || 'Das Gespräch ist beendet.') + '</p><ol class="lf-log">' + v.log.map(function (x) { return '<li><b>' + esc(x.a) + '</b>' + (x.r ? ' – ' + esc(x.r) : '') + (x.eff ? ' <span class="muted">(' + esc(x.eff) + ')</span>' : '') + '</li>'; }).join('') + '</ol><p class="muted small">Gespeichert in der Chronik. Getroffene Aussagen merken sich die Beteiligten.</p></div>';
    }
    var foot = v.done ? '<button class="primary" data-act="dlgClose">Schließen</button>' : '<button class="ghost" data-act="dlgCancel" title="Verklickt? Das Gespräch endet sofort und ohne Folgen.">Gespräch abbrechen</button><button class="ghost" data-act="closeModal" title="Das Gespräch bleibt bis zu 3 Wochen offen">Später fortsetzen</button>';
    U.modal(esc(v.cat === 'vertrag' ? 'Verhandlung' : 'Gespräch'), h, foot, true);
  };
  U.acts.dlgStart = function (d) {
    var st = U.st, data = {}; Object.keys(d).forEach(function (k) { if (k !== 'act' && k !== 'dlg') data[k] = isNaN(+d[k]) || d[k] === '' ? d[k] : +d[k]; });
    if (d.oid) data.oid = d.oid; if (d.friend) data.friend = d.friend; if (d.cid) data.cid = d.cid;
    var cur = L.active(st);
    var same = cur && cur.id === d.dlg && Object.keys(d).every(function (k) { return ['act', 'dlg', 'ap', 'cost'].indexOf(k) >= 0 || String(cur.data[k]) === String(d[k]); });
    if (cur && !cur.done && same) { U.showDlg(); return; } // dasselbe Gespräch fortsetzen
    if (cur) { var cx0 = st.pc.cx; cx0.dlg = null; } // anderes Gespräch gewählt: offenes Gespräch ohne weitere Wirkung beenden
    if (d.ap) { var r = L.spend(st, +d.ap, +(d.cost || 0)); if (!r.ok) { U.toast(r.why, 4000); return; } }
    var s = L.start(st, d.dlg, data); if (!s) { U.toast('Gerade nicht möglich.'); return; }
    if (s.done) { var v = L.view(st); L.close(st); U.toast((v && v.sum) || 'Gerade nicht möglich.', 4500); U.render(); return; }
    U.autosave(); U.showDlg();
  };
  U.acts.dlgPick = function (d) { L.pick(U.st, +d.i); U.autosave(); U.showDlg(); };
  U.acts.dlgClose = function () { L.close(U.st); U.closeModal ? U.closeModal() : document.getElementById('modal').classList.add('hidden'); U.autosave(); U.render(); if (U.dlgPending(U.st)) setTimeout(U.showDlg, 300); };
  U.acts.dlgResume = function () { U.showDlg(); };
  U.acts.dlgCancel = function () { // Verklickt: Gespräch ohne jede Wirkung beenden
    var st = U.st, cur = L.active(st); if (cur) { st.pc.cx.dlg = null; U._dlgSeen = null; }
    U.closeModal(); U.autosave(); U.render(); U.toast('Gespräch abgebrochen – ohne Folgen.', 3000);
  };

  // ---------- Ergebnisfenster statt kurzer Meldung (Entscheidungen, Aktivitäten) ----------
  function parseFx(msg) { var out = [], re = /([A-ZÄÖÜ][A-Za-zÄÖÜäöüß&\- ]{1,30}?) ([+−]\d+(?: %)?)/g, m; while ((m = re.exec(msg))) out.push({ t: m[1].trim() + ' ' + m[2], pos: m[2][0] === '+' && !/Stress/.test(m[1]), neg: m[2][0] === '−' || (/Stress/.test(m[1]) && m[2][0] === '+') }); return out; }
  U.showResult = function (title, msg, scene) {
    var fx = parseFx(msg || ''), txt = String(msg || '').replace(/([A-ZÄÖÜ][A-Za-zÄÖÜäöüß&\- ]{1,30}?) ([+−]\d+(?: %)?)(, )?/g, '').trim();
    U.modal(esc(title || 'Ergebnis'), (scene ? U.lifeImg(L.sceneImg(scene), 'lf-img') : '') + '<div class="lf-react" style="margin-top:' + (scene ? 10 : 0) + 'px">' + esc(txt || 'Erledigt.') + chips(fx) + '</div>', '<button class="primary" data-act="closeModal">Weiter</button>');
  };
  var CATSCENE = { trainer: 'trainer', team: 'kabine', freund: 'freunde', verletzung: 'medizin', vertrag: 'vertrag', berater: 'vertrag', transfer: 'vertrag', medien: 'presse', sponsor: 'vertrag', familie: 'familie', finanzen: 'finanzen', finberater: 'finanzen', sport: 'training', sichtung: 'training', krise: 'kabine', highlight: 'feier', nati: 'stadion' };
  var basePick = U.acts.cxPick;
  U.acts.cxPick = function (d) {
    var st = U.st, it = X.ensure(st).inbox.filter(function (x) { return x.uid === +d.uid; })[0], e = it && X.REG[it.id];
    if (!it) return basePick(d);
    var msg = X.resolve(st, +d.uid, +d.i); U.autosave(); U.render();
    U.showResult(it.ti || 'Entscheidung', msg, e ? CATSCENE[e.cat] : null);
  };

  // ---------- Hilfen ----------
  function apDots(st) { var lf = L.life(st), n = L.apLeft(st), tot = Math.max(n, 4 + ['private', 'partner', 'friends', 'family', 'fans'].reduce(function (s, k) { return s + ((st.pc.cx.plan.a || {})[k] || 0); }, 0)); var h = '<span class="lf-ap" title="Freie Termine diese Woche">'; for (var i = 0; i < tot; i++) h += '<i class="' + (i < n ? '' : 'off') + '"></i>'; return h + '</span> <b>' + n + '</b> frei'; }
  function btn(lbl, dlg, data, cls, extra) { var a = ' data-act="dlgStart" data-dlg="' + dlg + '"'; Object.keys(data || {}).forEach(function (k) { a += ' data-' + k + '="' + esc(String(data[k])) + '"'; }); return '<button class="sm ' + (cls || '') + '"' + a + (extra || '') + '>' + lbl + '</button>'; }
  function resume(st) { var s = L.active(st); return s && !s.done ? '<div class="help" style="margin-bottom:12px">' + U.lc('megaphone', 15) + ' Ein Gespräch ist noch offen: <b>' + esc(L.view(st).title || '') + '</b> <button class="sm primary" data-act="dlgResume">Fortsetzen</button> <button class="sm ghost" data-act="dlgCancel">Abbrechen</button></div>' : ''; }

  // ---------- Neue Wochenplan-Aktivitäten (Zeitbudget) ----------
  X.ACTS.partner = { n: 'Zeit mit der Partnerperson', ic: 'heart', c: 1, d: 'Pflegt die Beziehung (+1 freier Termin).', morale: 1, stress: -1 };
  X.ACTS.friends = { n: 'Freunde treffen', ic: 'users', c: 1, d: 'Freundschaften pflegen (+1 freier Termin).', morale: 1 };
  X.ACTS.family = { n: 'Familienzeit', ic: 'house', c: 1, d: 'Familie & Kinder (+1 freier Termin).', family: 0.6, stress: -1 };
  X.ACTS.fans = { n: 'Fan- & Öffentlichkeitstermine', ic: 'megaphone', c: 1, d: 'Fantreffen, Autogramme, Vereinsarbeit (+1 freier Termin).', fame: 0.2 };

  // ---------- Mein Leben ----------
  U.screens.pleben = function () {
    var st = U.st, cx = L.ensure(st), lf = cx.life, p = C.player(st), pt = lf.partner;
    var h = '<h1>Mein Leben</h1>' + resume(st);
    h += '<div class="grid g2"><div class="panel"><h2>' + U.lc('heart-pulse', 17) + ' Wie geht es dir?</h2><table class="t small">' +
      '<tr><td>Wohlbefinden</td><td style="width:50%">' + bar(lf.well) + '</td><td class="num">' + Math.round(lf.well) + '</td></tr>' +
      '<tr><td>Zufriedenheit</td><td>' + bar(cx.per.sat) + '</td><td class="num">' + Math.round(cx.per.sat) + '</td></tr>' +
      '<tr><td>Stress</td><td>' + bar(cx.per.stress, cx.per.stress > 60 ? 'var(--red)' : '') + '</td><td class="num">' + Math.round(cx.per.stress) + '</td></tr>' +
      '<tr><td>Familie</td><td>' + bar(cx.rel.family) + '</td><td class="num">' + Math.round(cx.rel.family) + '</td></tr></table>' +
      '<p class="small" style="margin-top:8px">Termine diese Woche: ' + apDots(st) + '</p><p class="muted small">Mehr freie Termine gibt es über Freizeit, Partnerschaft, Freunde, Familie oder Fantermine im <a href="#" data-act="nav" data-s="pwoche">Wochenplan</a>. Karriere und Privatleben konkurrieren um dasselbe Zeitbudget.</p></div>';
    // Partnerschaft
    h += '<div class="panel"><h2>' + U.lc('heart-pulse', 17) + ' Partnerschaft</h2>';
    if (pt && U.ptCard) h += U.ptCard(st, pt); // Privatleben 2.0
    else if (pt) {
      h += '<div class="lf-card"><h3>' + esc(pt.name) + '</h3><div class="muted small">' + esc(pt.job) + ' · mag ' + esc(pt.intr.join(', ')) + ' · Ziel: ' + esc(pt.goal) + '</div>' +
        '<div class="lf-stage">' + L.STAGES.slice(1).map(function (s, i) { return '<span class="' + (i + 1 === pt.stage ? 'on' : i + 1 < pt.stage ? 'done' : '') + '">' + esc(s) + '</span>'; }).join('') + '</div>' +
        '<table class="t small"><tr><td>Beziehung</td><td style="width:50%">' + bar(pt.v) + '</td><td class="num">' + Math.round(pt.v) + '</td></tr></table>' +
        (pt.crisis ? '<p class="small neg">' + U.lc('triangle-alert', 14) + ' Krise: ' + esc(fn(pt)) + ' fühlt sich vernachlässigt.</p>' : '') +
        (lf.preg ? '<p class="small">🤰 Ihr erwartet ein Kind – noch etwa ' + Math.max(1, lf.preg.due - tick(st)) + ' Wochen.</p>' : '') +
        '<p class="muted small">Wünscht sich ' + (pt.time >= 60 ? 'viel gemeinsame Zeit' : 'Verlässlichkeit') + ', Umzugsbereitschaft ' + (pt.move >= 60 ? 'hoch' : pt.move >= 35 ? 'mittel' : 'gering') + ', Kinderwunsch ' + (pt.kids >= 65 ? 'stark' : pt.kids >= 40 ? 'offen' : 'gering') + '.</p>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' + btn('Date planen (1 Termin)', 'date', { ap: 1 }, 'primary') + btn('Gespräch führen', 'partner_talk', {}) + (pt.crisis ? btn('Krise ansprechen', 'partner_talk', { topic: 'crisis' }, 'danger') : '') + '</div></div>';
    } else {
      h += '<p class="small">Du bist ' + (lf.exes.length ? 'wieder ' : '') + 'Single. Neue Menschen lernst du über Freizeit, Freunde und Termine kennen.</p>';
      h += lf.cands.length ? lf.cands.map(function (x) { return '<div class="lf-card"><h3>' + esc(x.name) + ' <span class="muted small">' + esc(L.STAGES[x.stage]) + '</span></h3><div class="muted small">' + esc(x.job) + ' · mag ' + esc(x.intr.join(', ')) + '</div><table class="t small"><tr><td>Interesse</td><td style="width:50%">' + bar(x.v) + '</td><td class="num">' + Math.round(x.v) + '</td></tr></table>' + (x.stage >= 1 ? btn('Date vorschlagen (1 Termin)', 'date', { cid: x.id, ap: 1 }, 'primary') : btn('Ansprechen', 'meet', { cid: x.id })) + '</div>'; }).join('') : '<p class="muted small">Gerade niemand in Sicht.</p>';
      if (U.flingBox) h += U.flingBox(st);
      if (p.age >= 17) h += '<button class="sm" data-act="lfGoOut">Ausgehen (1 Termin, ' + money(60) + ')</button>';
    }
    if (lf.exes.length) h += '<p class="muted small" style="margin-top:8px">Frühere Beziehungen: ' + lf.exes.map(function (e) { return esc(e.name) + ' (' + e.s + ')'; }).join(', ') + '</p>';
    h += '</div></div>';
    // Familie & Kinder
    h += '<div class="grid g2" style="margin-top:14px"><div class="panel"><h2>' + U.lc('house', 17) + ' Familie</h2>' + lf.fam.map(function (f, i) { return '<div class="cx-row" style="margin-bottom:8px;align-items:center"><span class="cx-tile" style="--c:#14b8a6">🏡</span><div style="flex:1"><b>' + esc(f.name) + '</b> <span class="muted small">' + esc(f.rel) + '</span>' + bar(f.v) + '</div>' + btn('Melden', 'family', { i: i }) + '</div>'; }).join('');
    h += lf.kids.length ? '<h3 style="margin-top:12px">Kinder</h3>' + lf.kids.map(function (k) { var a = L.kidAge(st, k); return '<div class="cx-row" style="margin-bottom:6px"><span class="cx-tile" style="--c:#14b8a6">' + (a < 3 ? '👶' : a < 12 ? '🧒' : '🧑') + '</span><div><b>' + esc(k.name) + '</b><div class="muted small">' + a + ' Jahre' + (a >= 6 && a < 18 ? ' · Schulkind' : '') + '</div></div></div>'; }).join('') : (pt && pt.stage >= 4 ? '<p class="muted small">' + (lf.planKids ? 'Ihr wünscht euch Kinder.' : 'Familienplanung besprecht ihr im Gespräch mit ' + esc(fn(pt)) + '.') + '</p>' : '');
    h += '</div>';
    // Freunde
    h += '<div class="panel"><h2>' + U.lc('users', 17) + ' Freunde</h2>' + (lf.friends.length ? lf.friends.map(function (f) { return '<div class="cx-row" style="margin-bottom:8px;align-items:center"><span class="cx-tile" style="--c:#a855f7">🤝</span><div style="flex:1"><b>' + esc(f.name) + '</b> <span class="muted small">' + esc(L.FRK[f.kind] || '') + '</span>' + bar(f.v) + '<div class="muted small">' + esc(f.note || '') + (f.v < 30 ? ' Ihr habt euch auseinandergelebt.' : '') + '</div></div>' + btn('Treffen', 'friend', { friend: f.id }) + '</div>'; }).join('') : '<p class="muted small">Noch keine engen Freunde.</p>') + '</div></div>';
    // Gedächtnis
    var pr = L.promises(st).slice(0, 10);
    h += '<div class="panel" style="margin-top:14px"><h2>' + U.lc('bookmark', 17) + ' Was du gesagt und versprochen hast</h2>' + (pr.length ? '<ul class="small">' + pr.map(function (x) { return '<li><b>' + esc(x.txt) + '</b> <span class="muted">– ' + esc(x.who || '') + ', Saison ' + x.s + ', Woche ' + (x.w || 0) + '</span></li>'; }).join('') + '</ul><p class="muted small">Trainer, Presse, Fans und Familie greifen solche Aussagen später wieder auf.</p>' : '<p class="muted small">Noch keine Aussagen gespeichert.</p>') + '</div>';
    return h;
  };
  U.acts.lfGoOut = function () {
    var st = U.st, r = L.spend(st, 1, 60); if (!r.ok) { U.toast(r.why, 4000); return; }
    var lf = L.life(st), cx = st.pc.cx;
    if (R.rand() < 0.45 + (cx.per.conf - 50) / 200) { var x = L.newCand(st); st.pc.cx.dlg = null; L.start(st, 'meet', { cid: x.id, where: 'Beim Ausgehen mit Freunden' }); U.autosave(); U.showDlg(); return; }
    L.eff(st, { well: 2, stress: -1 }); if (lf.friends[0]) lf.friends[0].v = Math.min(100, lf.friends[0].v + 3);
    U.autosave(); U.render(); U.showResult('Abend in der Stadt', 'Ein netter Abend mit Freunden – heute ohne neue Bekanntschaft. Wohlbefinden +2, Stress −1', 'freunde');
  };

  // ---------- Vereinsgelände (vorhandene Einrichtungen, keine eigene Infrastruktur-Datenbank) ----------
  var BMAP = { training: 'training', jugend: 'jugend', medizin: 'medizin', geschaeft: 'geschaeft' };
  U.screens.pverein = function () {
    var st = U.st, c = C.club(st), p = C.player(st); if (!c) return '<h1>Vereinsgelände</h1><p class="muted">Du bist gerade ohne Verein.</p>';
    var h = '<h1>Vereinsgelände ' + esc(c.short) + '</h1>' + resume(st) + '<p class="small">Termine diese Woche: ' + apDots(st) + ' · Gebäude antippen für Aktivitäten. Ausstattung und Wirkung richten sich nach dem tatsächlichen Ausbau des Vereins.</p>';
    if (SM && S3 && U.gfx && U.gfx.cityView) {
      var m = SM.build(c), blds = SM.city(c);
      var labels = blds.filter(function (b) { return b.key !== 'strasse'; }).map(function (b) { var act = BMAP[b.key]; return { x: b.x, y: b.y, bld: b.key, html: '<b>' + esc(b.name) + '</b><span>' + (b.level ? (act ? 'Aktivitäten · ' : '') + 'Stufe ' + b.level + '/' + b.max : 'nicht vorhanden') + '</span>', cls: b.level ? (act ? 'main' : '') : 'empty', act: 'pcBld', k: b.key }; });
      labels.push({ x: 0, y: 0, z: Math.max(m.roofH, m.areas.N.top) + 10, html: '<b>' + esc(c.stadiumName) + '</b><span>Fans · Presse · Autogramme</span>', cls: 'main', act: 'pcBld', k: 'stadion' });
      try { h += '<div class="stage3d city">' + S3.host('pcity', { kind: 'world', model: m, buildings: blds, cam: 'stadt', labels: labels, interactive: true, ratio: '16/9', fallback: U.gfx.cityView(c) }) + '</div>'; } catch (er) { if (typeof console !== 'undefined') console.error(er); }
    }
    h += '<div class="lf-bld" style="margin-top:14px">' + Object.keys(L.BLD).map(function (k) {
      var B = L.BLD[k], fk = k === 'stadion' ? null : k, l = fk && c.fac ? (c.fac[fk] || 0) : 1, f = fk && D.facilities[fk], ln = f && f.levels[l] ? f.levels[l].n : (k === 'stadion' ? c.stadiumName : '');
      return '<div class="lf-card" data-act="pcBld" data-k="' + k + '"><h3>' + B.ic + ' ' + esc(B.n) + '</h3><div class="muted small">' + esc(ln || 'nicht vorhanden') + (f ? ' · Stufe ' + l + '/' + (f.levels.length - 1) : '') + (L.life(st).visits[k] ? ' · ' + L.life(st).visits[k] + '× besucht' : '') + '</div><div class="small" style="margin-top:6px">' + B.acts.map(function (a) { return esc(a.n); }).join(' · ') + '</div></div>';
    }).join('') + '</div>';
    return h;
  };
  U.acts.pcBld = function (d) {
    var st = U.st, k = d.k, B = L.BLD[k], c = L.ctx(st);
    if (!B) { var f = D.facilities[k], cl = C.club(st), l = cl && cl.fac ? (cl.fac[k] || 0) : 0; U.modal(esc(f ? f.name : k), '<p>' + (l ? 'Ausbaustufe ' + l + ': <b>' + esc(f.levels[l].n) + '</b>.' : 'Diese Einrichtung hat der Verein (noch) nicht.') + '</p><p class="muted small">Als Spieler kannst du hier nichts ausbauen – das entscheidet die Vereinsführung.</p>', '<button data-act="closeModal">Schließen</button>'); return; }
    var acts = B.acts.filter(function (a) { try { return !a.req || a.req(c); } catch (er) { return false; } });
    var fk = k === 'stadion' ? null : k, cl2 = C.club(st), lv = fk && cl2.fac ? (cl2.fac[fk] || 0) : 1, img = L.sceneImg(k === 'training' ? 'training' : k === 'jugend' ? 'jugend' : k === 'medizin' ? 'medizin' : k === 'stadion' ? 'stadion' : 'vorstand');
    var body = U.lifeImg(img, 'lf-img', '<div class="cap"><div>' + B.ic + ' ' + esc(B.n) + '</div><span>' + (fk ? 'Stufe ' + lv : '') + '</span></div>') + '<p class="small" style="margin-top:8px">Freie Termine: ' + apDots(st) + '</p>' +
      (fk && lv < 1 ? '<p class="neg small">Diese Einrichtung gibt es im Verein nicht.</p>' : '<div class="lf-opts">' + acts.map(function (a) { return '<button data-act="pcBldAct" data-b="' + k + '" data-k="' + a.k + '"><b>' + esc(a.n) + '</b> <span class="muted small">– ' + esc(a.d) + (a.ap ? ' · ' + a.ap + ' Termin' : ' · Gespräch') + '</span></button>'; }).join('') + '</div>');
    U.modal(esc(B.n), body, '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.pcBldAct = function (d) {
    var st = U.st, r = L.bldAct(st, d.b, d.k); if (!r.ok) { U.toast(r.why, 4000); return; }
    U.autosave(); if (r.dlg) { U.showDlg(); return; }
    var a = L.BLD[d.b].acts.filter(function (x) { return x.k === d.k; })[0]; U.render(); U.showResult(a.n, a.d + ' – erledigt. ' + (r.txt || ''), d.b === 'stadion' ? 'fans' : d.b === 'medizin' ? 'medizin' : 'training');
  };

  // ---------- Fans & Medien ----------
  U.screens.pmedien = function () {
    var st = U.st, cx = L.ensure(st), lf = cx.life, pc = st.pc, c = L.ctx(st);
    var h = '<h1>Fans & Medien</h1>' + resume(st);
    h += '<div class="grid g2"><div class="panel"><h2>' + U.lc('megaphone', 17) + ' Fangruppen</h2><table class="t small">' + Object.keys(L.FANS).map(function (k) { return '<tr><td>' + esc(L.FANS[k]) + '</td><td style="width:50%">' + bar(lf.fans[k]) + '</td><td class="num">' + Math.round(lf.fans[k]) + '</td></tr>'; }).join('') + '</table>' +
      (lf.protest ? '<p class="small neg">' + U.lc('triangle-alert', 14) + ' Teile der Fanszene sind unzufrieden und planen Proteste.</p>' : '') +
      '<p class="muted small">Fangruppen reagieren unterschiedlich: Was Ultras gefällt, kann Familienfans oder die Vereinsführung verärgern.</p>' +
      '<div class="row" style="gap:6px;flex-wrap:wrap">' + btn('Fanclub-Treffen (1 Termin)', 'fans', { grp: 'club', ap: 1 }) + btn('Familien- & Jugendfans (1 Termin)', 'fans', { grp: 'fam', ap: 1 }) + (c.pro ? btn('Treffen mit den Ultras (1 Termin)', 'fans', { grp: 'ultras', ap: 1 }) : '') + '</div></div>';
    h += '<div class="panel"><h2>' + U.lc('newspaper', 17) + ' Journalisten</h2>' + lf.jrn.map(function (j) { var q = j.quotes[0]; return '<div class="lf-card"><b>' + esc(j.name) + '</b> <span class="muted small">' + esc(j.outlet) + ' · ' + esc(L.JTYPES[j.type]) + '</span>' + bar(j.v) + (q ? '<div class="small" style="margin-top:4px">Zuletzt zitiert: „' + esc(q.txt) + '“ <span class="muted">(Saison ' + q.s + ')</span></div>' : '<div class="muted small">Hat dich noch nicht zitiert.</div>') + '</div>'; }).join('') +
      '<table class="t small"><tr><td>Medienansehen</td><td style="width:50%">' + bar(cx.per.media) + '</td><td class="num">' + Math.round(cx.per.media) + '</td></tr><tr><td>Bekanntheit</td><td>' + bar(pc.fame) + '</td><td class="num">' + Math.round(pc.fame) + '</td></tr></table>' +
      '<div class="row" style="gap:6px">' + (c.pro && pc.fame >= 5 ? btn('Pressekonferenz geben', 'press', {}, 'primary') : '<span class="muted small">Pressekonferenzen gibt es, sobald du bei den Profis bekannter bist.</span>') + '</div></div></div>';
    return h;
  };

  // ---------- Beziehungen: Gespräche direkt führen ----------
  var basePbez = U.screens.pbez;
  U.screens.pbez = function () {
    var st = U.st, c = L.ctx(st), h = basePbez();
    var talk = '<div class="panel" style="margin-bottom:14px"><h2>' + U.lc('handshake', 17) + ' Gespräche führen</h2><p class="muted small">Mehrstufige Gespräche mit Reaktionen. Dein Gegenüber merkt sich, was du sagst.</p><div class="row" style="gap:6px;flex-wrap:wrap">' +
      (c.youth ? btn('Jugendtrainer', 'youthcoach', {}) : btn('Trainer', 'coach', {}, 'primary')) + (AG && AG.current(st) ? btn('Spielerberater', 'agent', {}) : '') + (c.pro ? btn('Vereinsführung', 'board', {}) : '') + btn('Mannschaftsarzt', 'doctor', {}) + btn('Finanzberatung', 'finadv', {}) + btn('Familie', 'family', { i: 0 }) + '</div></div>';
    return h.replace('</h1>', '</h1>' + resume(st) + talk);
  };
  // ---------- Verträge: Verhandlung im Gespräch ----------
  var basePber = U.screens.pberater;
  U.screens.pberater = function () {
    var h = basePber();
    return h.replace(/<button class="sm primary" data-act="pcAccept" data-id="([^"]+)">/g, '<button class="sm" data-act="dlgStart" data-dlg="negotiate" data-oid="$1">' + U.lc('handshake', 14) + ' Im Gespräch verhandeln</button>$&');
  };
  // ---------- Karriere-Zentrale: Leben & Termine kompakt ----------
  var baseHome = U.screens.pkarriere;
  U.screens.pkarriere = function () {
    var st = U.st, h = baseHome(); if (!on(st)) return h;
    var lf = L.life(st), pt = lf.partner;
    var strip = '<div class="panel" style="margin-top:14px"><div class="panel-h"><h2>' + U.lc('heart-pulse', 17) + ' Leben & Termine</h2><span class="small">' + apDots(st) + '</span></div><div class="row small" style="gap:14px;flex-wrap:wrap">' +
      '<span>Wohlbefinden <b>' + Math.round(lf.well) + '</b></span><span>Zufriedenheit <b>' + Math.round(st.pc.cx.per.sat) + '</b></span><span>' + (pt ? 'Partnerschaft: <b>' + esc(fn(pt)) + '</b> (' + esc(L.STAGES[pt.stage]) + ')' : 'Single') + '</span>' + (lf.kids.length ? '<span>Kinder: <b>' + lf.kids.length + '</b></span>' : '') +
      '<span>Fans: <b>' + Math.round(st.pc.cx.rel.fans) + '</b></span></div><div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap"><button class="sm" data-act="nav" data-s="pleben">Mein Leben</button><button class="sm" data-act="nav" data-s="pverein">Vereinsgelände</button><button class="sm" data-act="nav" data-s="pmedien">Fans & Medien</button></div></div>';
    return resume(st) + h.replace(/(<div class="panel" style="margin-top:14px"><h2>[^<]*<svg[^]*?<\/svg> Umfeld<\/h2>)/, strip + '$1') + (h.indexOf(' Umfeld</h2>') < 0 ? strip : '');
  };

  // ---------- Chronik mit Filtern (Kategorie, Saison, Wichtigkeit) und Bildern ----------
  var CATCOL = { sport: '#22c55e', trainer: '#3b82f6', team: '#06b6d4', rival: '#ef4444', freund: '#a855f7', verletzung: '#f97316', sichtung: '#eab308', vertrag: '#64748b', berater: '#0ea5e9', transfer: '#8b5cf6', medien: '#ec4899', sponsor: '#f59e0b', familie: '#14b8a6', nati: '#dc2626', krise: '#b91c1c', highlight: '#facc15', finanzen: '#ca8a04', finberater: '#0891b2', meilenstein: '#facc15' };
  U.chronF = U.chronF || { cat: '', s: '', imp: 0 };
  U.screens.pchronik = function () {
    var st = U.st, cx = X.ensure(st), F = U.chronF;
    var cats = {}, seas = {}; cx.chron.forEach(function (x) { cats[x.cat] = (cats[x.cat] || 0) + 1; seas[x.s] = 1; });
    var list = cx.chron.filter(function (x) { return (!F.cat || x.cat === F.cat) && (!F.s || String(x.s) === String(F.s)) && (x.imp || 1) >= F.imp; });
    var h = '<h1>Karriere-Chronik</h1><div class="lf-filter"><label class="small">Bereich <select data-chg="chronF" data-k="cat"><option value="">Alle (' + cx.chron.length + ')</option>' + Object.keys(cats).map(function (k) { return '<option value="' + k + '"' + (F.cat === k ? ' selected' : '') + '>' + esc(X.CATS[k] || k) + ' (' + cats[k] + ')</option>'; }).join('') + '</select></label>' +
      '<label class="small">Saison <select data-chg="chronF" data-k="s"><option value="">Alle</option>' + Object.keys(seas).sort(function (a, b) { return b - a; }).map(function (s) { return '<option value="' + s + '"' + (String(F.s) === s ? ' selected' : '') + '>' + s + '/' + String(+s + 1).slice(2) + '</option>'; }).join('') + '</select></label>' +
      '<label class="small">Wichtigkeit <select data-chg="chronF" data-k="imp"><option value="0">Alle</option><option value="2"' + (F.imp == 2 ? ' selected' : '') + '>Wichtig</option><option value="3"' + (F.imp == 3 ? ' selected' : '') + '>Nur Höhepunkte</option></select></label><span class="muted small">' + list.length + ' Einträge</span></div>';
    if (!list.length) return h + '<p class="muted">Keine Einträge für diese Auswahl.</p>';
    var by = {}; list.forEach(function (x) { (by[x.s] = by[x.s] || []).push(x); });
    Object.keys(by).sort(function (a, b) { return b - a; }).forEach(function (s) {
      h += '<div class="cx-season">SAISON ' + s + '/' + String(+s + 1).slice(2) + '</div><div class="cx-chron">' + by[s].map(function (x) {
        var img = x.img ? L.sceneImg(x.img) : null;
        return '<div class="it ' + ((x.imp || 1) >= 3 ? 'big' : '') + '" style="--c:' + (CATCOL[x.cat] || '#3b82f6') + '"><div class="cx-row">' + (img ? U.lifeImg(img, 'lf-thumb') : '') + '<div><div class="t">' + esc(x.ic || '') + ' ' + esc(x.ti) + ' <span class="muted small">Woche ' + (x.w || 0) + ' · ' + esc(X.CATS[x.cat] || x.cat) + '</span></div><div class="small muted">' + esc(x.x || '') + '</div></div></div></div>';
      }).join('') + '</div>';
    });
    return h;
  };
  U.acts.chronF = function (d, el) { U.chronF[d.k] = d.k === 'imp' ? +el.value : el.value; U.render(); };
})(RFM);
