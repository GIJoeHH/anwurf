// Privatleben 2.0 – Oberfläche: Partnerkarte in „Mein Leben“ (reden, Aktivitäten, Zukunft, Vorhaben, Neuigkeiten),
// gleichbleibendes Porträt aus dem Aussehen der Person, stimmungsabhängige Szenenbilder (Begrüßung, entspannt, romantisch,
// nachdenklich, Meinungsverschiedenheit, Versöhnung, gemeinsamer Erfolg, Abschied). Gemeinsam für beide Sportarten.
(function (R) {
  var U = R.ui, L = R.life, P = L && L.pt, C = R.pc; if (!U || !P) return;
  var esc = R.esc, money = R.fmtMoney;
  function fn(x) { return x ? String(x.name).split(' ')[0] : ''; }
  function tick(st) { return st.tick || 0; }

  if (typeof document !== 'undefined' && !document.getElementById('pt-style')) {
    var css = document.createElement('style'); css.id = 'pt-style';
    css.textContent = [
      '.pt-head{display:flex;gap:12px;align-items:center}.pt-head h3{margin:0}.pt-por{flex:0 0 auto;border-radius:50%;overflow:hidden;background:var(--panel2);border:1px solid var(--line)}.pt-por svg{display:block}',
      '.lf-who .av.pt{padding:0;overflow:hidden}.lf-who .av.pt svg{width:44px;height:44px}',
      '.pt-sec{margin-top:10px}.pt-sec h4{margin:0 0 6px;font-size:13px;color:var(--muted)}',
      '.pt-acts{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}.pt-acts button{text-align:left;display:flex;flex-direction:column;gap:2px}.pt-acts button span{font-size:11px;opacity:.75}',
      '.pt-feed{list-style:none;padding:0;margin:0}.pt-feed li{padding:4px 0;border-bottom:1px solid var(--line);font-size:13px}.pt-feed li:last-child{border-bottom:0}.pt-feed .w{color:var(--muted);font-size:11px;margin-right:6px}',
      '.pt-know{display:flex;flex-wrap:wrap;gap:4px}.pt-know span{font-size:11px;padding:2px 8px;border-radius:99px;background:var(--panel2);border:1px solid var(--line)}',
      '.pt-mode{display:flex;gap:4px;align-items:center;font-size:12px}'
    ].join('');
    document.head.appendChild(css);
  }

  // ---------- Porträt: immer dieselbe Person (Hautton, Haarfarbe, Frisur, Brille, Augen aus „look“) ----------
  U.ptPortrait = function (look, size) {
    var l = look || { s: '#e8b996', h: '#5a3a22', st: 1, g: false, e: 0 }, z = size || 56, hair = l.h, skin = l.s;
    var back = ['<path d="M14 34 Q12 12 32 10 Q52 12 50 34 L52 58 L12 58 Z" fill="' + hair + '"/>', '', '<circle cx="32" cy="9" r="7" fill="' + hair + '"/>',
      '<g fill="' + hair + '"><circle cx="17" cy="24" r="7"/><circle cx="47" cy="24" r="7"/><circle cx="15" cy="34" r="6"/><circle cx="49" cy="34" r="6"/></g>', '<path d="M14 30 Q14 12 32 11 Q50 12 50 30 L50 42 L14 42 Z" fill="' + hair + '"/>'][l.st % 5];
    var top = ['<path d="M17 26 Q20 13 32 13 Q44 13 47 26 Q40 19 32 20 Q24 19 17 26 Z" fill="' + hair + '"/>', '<path d="M17 25 Q18 12 32 12 Q46 12 47 25 Q42 18 32 18 Q22 18 17 25 Z" fill="' + hair + '"/>',
      '<path d="M17 26 Q19 13 32 13 Q45 13 47 26 Q41 17 32 17 Q23 17 17 26 Z" fill="' + hair + '"/>', '<g fill="' + hair + '"><circle cx="22" cy="17" r="6"/><circle cx="32" cy="14" r="7"/><circle cx="42" cy="17" r="6"/></g>',
      '<path d="M16 27 Q18 12 32 12 Q46 12 48 27 L44 22 Q32 16 20 22 Z" fill="' + hair + '"/>'][l.st % 5];
    var eyes = ['<circle cx="26" cy="31" r="1.8"/><circle cx="38" cy="31" r="1.8"/>', '<path d="M24 31 q2 -2 4 0 M36 31 q2 -2 4 0" stroke="#2b1d14" stroke-width="1.6" fill="none"/>', '<ellipse cx="26" cy="31" rx="1.6" ry="2.2"/><ellipse cx="38" cy="31" rx="1.6" ry="2.2"/>'][(l.e || 0) % 3];
    var gl = l.g ? '<g fill="none" stroke="#1f2937" stroke-width="1.4"><circle cx="26" cy="31" r="4.6"/><circle cx="38" cy="31" r="4.6"/><path d="M30.6 31 h2.8"/></g>' : '';
    return '<svg viewBox="0 0 64 64" width="' + z + '" height="' + z + '" aria-hidden="true"><rect width="64" height="64" fill="#cbd5e1" opacity=".35"/>' + back +
      '<path d="M14 64 Q16 48 32 48 Q48 48 50 64 Z" fill="#475569"/><rect x="28" y="40" width="8" height="9" fill="' + skin + '"/>' +
      '<ellipse cx="32" cy="31" rx="14" ry="16" fill="' + skin + '"/>' + top + '<g fill="#2b1d14">' + eyes + '</g>' + gl +
      '<path d="M27 38 Q32 42 37 38" stroke="#7c2d12" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="23" cy="36" r="2.2" fill="#f87171" opacity=".25"/><circle cx="41" cy="36" r="2.2" fill="#f87171" opacity=".25"/></svg>';
  };

  // ---------- Stimmungsbilder für Partnergespräche ----------
  var MOOD = { pt_greet: ['#0f766e', '#5eead4', '👋'], pt_relaxed: ['#1e3a8a', '#60a5fa', '☕'], pt_romantic: ['#881337', '#fb7185', '🌹'], pt_thought: ['#334155', '#94a3b8', '💭'],
    pt_conflict: ['#7f1d1d', '#f97316', '⚡'], pt_reconcile: ['#14532d', '#86efac', '🤝'], pt_success: ['#78350f', '#facc15', '🥂'], pt_farewell: ['#312e81', '#a5b4fc', '🚉'] };
  U.PT_MOOD = MOOD;
  var baseSvg = U.lifeSvg;
  U.lifeSvg = function (name) {
    var m = MOOD[name]; if (!m) return baseSvg(name);
    var id = 'p' + Math.floor(Math.random() * 1e6);
    return '<svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + m[0] + '"/><stop offset="1" stop-color="' + m[1] + '"/></linearGradient></defs>' +
      '<rect width="320" height="140" fill="url(#' + id + ')"/><circle cx="270" cy="24" r="64" fill="#fff" opacity=".08"/><circle cx="36" cy="132" r="58" fill="#000" opacity=".12"/><rect x="0" y="108" width="320" height="32" fill="#000" opacity=".14"/>' +
      '<g opacity=".9"><circle cx="128" cy="62" r="13" fill="#fff" opacity=".28"/><path d="M106 108 Q110 80 128 80 Q146 80 150 108 Z" fill="#fff" opacity=".22"/><circle cx="192" cy="62" r="13" fill="#fff" opacity=".28"/><path d="M170 108 Q174 80 192 80 Q210 80 214 108 Z" fill="#fff" opacity=".22"/></g>' +
      '<text x="160" y="58" text-anchor="middle" font-size="40">' + m[2] + '</text></svg>';
  };

  // ---------- Partnerkarte ----------
  function know(st, pt) { // Persönlichkeit ist verborgen und zeigt sich mit der Zeit
    var n = Object.keys(pt.used || {}).length, ph = P.phase(st, pt), out = [esc(pt.job), 'mag ' + esc((pt.intr || []).join(', '))];
    if (n >= 3 || ph >= 5) out.push(esc(P.PERS[pt.pers] || ''));
    if (n >= 6 || ph >= 6) out.push(pt.sport >= 62 ? 'fiebert beim Sport mit' : pt.sport < 40 ? 'kann mit Sport wenig anfangen' : 'interessiert sich für deinen Sport');
    if (n >= 9 || ph >= 7) out.push(esc(P.CONFL[pt.confl] || ''));
    if (n >= 12) out.push(pt.pub < 45 ? 'meidet die Öffentlichkeit' : 'hat kein Problem mit Medien');
    if (ph >= 6) out.push('Ziel: ' + esc(pt.goal || ''));
    return '<div class="pt-know">' + out.filter(Boolean).map(function (x) { return '<span>' + x + '</span>'; }).join('') + '</div>';
  }
  var TH_TXT = { promo: 'Beförderung feiern', joboffer: 'Jobangebot besprechen', exam: 'Prüfungsphase', examres: 'Prüfungsergebnis', grad: 'Studienabschluss', workstress: 'Stress im Beruf', course: 'Weiterbildung', success: 'Beruflicher Erfolg',
    setback: 'Berufliche Enttäuschung', famduty: 'Familie braucht Unterstützung', ownTrip: 'Eigene Reise', bizplan: 'Idee zur Selbstständigkeit', quarrel: 'Ungeklärter Streit', sunday: 'Versprochener freier Sonntag', promise_eve: 'Versprochener fester Abend',
    coachp: 'Gespräch mit dem Trainer angekündigt', agentp: 'Gespräch mit dem Berater angekündigt', settle: 'Ankommen in der neuen Stadt', newjob: 'Jobsuche in der neuen Stadt', ldlife: 'Fernbeziehung', inj: 'Deine Verletzung', sacrifice: 'Abgelehntes Jobangebot' };
  U.ptCard = function (st, pt) {
    P.ensure(st, pt); var lf = L.life(st), ph = P.phase(st, pt), h = '<div class="lf-card">';
    h += '<div class="pt-head"><div class="pt-por">' + U.ptPortrait(pt.look, 56) + '</div><div><h3>' + esc(pt.name) + '</h3><div class="muted small">' + esc(P.PHASES[ph] || '') + (pt.ld ? ' · Fernbeziehung' : '') + ' · seit ' + esc(String(pt.sinceS || st.season)) + '</div></div></div>';
    h += '<div class="pt-sec">' + know(st, pt) + '</div>';
    h += '<table class="t small" style="margin-top:8px"><tr><td>Beziehung</td><td style="width:50%">' + U.bar(pt.v, 100, pt.v < 30 ? 'var(--red)' : pt.v > 70 ? 'var(--green)' : '') + '</td><td class="num">' + Math.round(pt.v) + '</td></tr></table>';
    if (pt.neg >= 6) h += '<p class="small neg">' + U.lc('triangle-alert', 14) + ' ' + esc(fn(pt)) + ' wünscht sich mehr gemeinsame Zeit.</p>';
    else if (pt.neg >= 3) h += '<p class="small muted">' + esc(fn(pt)) + ' hat dich in letzter Zeit etwas vermisst.</p>';
    if (lf.preg) h += '<p class="small">🤰 Ihr erwartet ein Kind – noch etwa ' + Math.max(1, lf.preg.due - tick(st)) + ' Wochen.</p>';
    h += '<div class="row" style="gap:6px;flex-wrap:wrap;margin-top:8px"><button class="sm primary" data-act="ptTalk">' + U.lc('heart-pulse', 14) + ' Mit ' + esc(fn(pt)) + ' reden</button>';
    var dec = P.decisions(st); dec.forEach(function (t) { h += '<button class="sm" data-act="ptDec" data-id="' + esc(t.id) + '">' + esc(t.ic || '🔭') + ' ' + esc(t.title || 'Zukunft besprechen') + '</button>'; });
    h += '<button class="sm ghost" data-act="ptBreak" style="margin-left:auto">' + U.lc('log-out', 14) + ' ' + (pt.stage >= 6 ? 'Scheidung' : 'Beziehung beenden') + '</button>';
    h += '</div>';
    // Aktivitäten
    h += '<div class="pt-sec"><h4>Gemeinsam etwas unternehmen</h4><div class="pt-acts">' + Object.keys(P.ACTS).map(function (k) {
      var a = P.ACTS[k], na = P.actAvail(st, k), last = pt.acts.slice(0, 3).indexOf(k) >= 0;
      return '<button class="sm" data-act="ptAct" data-k="' + k + '"' + (na ? ' disabled title="' + esc(na) + '"' : '') + '>' + a.ic + ' ' + esc(a.n) + '<span>' + (a.ap ? a.ap + ' Termin' + (a.ap > 1 ? 'e' : '') : 'kein Termin') + (a.cost ? ' · ' + money(a.cost) : '') + (last ? ' · zuletzt gemacht' : '') + '</span></button>';
    }).join('') + '</div></div>';
    // Vorhaben und offene Themen
    var td = P.todos(st), open = Object.keys(pt.th || {}).filter(function (k) { return pt.th[k] && !pt.th[k].done && TH_TXT[k]; });
    if (td.length || open.length) {
      h += '<div class="pt-sec"><h4>Offene Themen</h4><ul class="pt-feed">' + td.map(function (x) { return '<li>📌 ' + esc(x.l) + ' <button class="sm" data-act="ptTodo" data-k="' + esc(x.k) + '">Jetzt</button></li>'; }).join('') +
        open.filter(function (k) { return !td.some(function (x) { return x.k === k; }); }).map(function (k) { return '<li>💬 ' + esc(TH_TXT[k]) + '</li>'; }).join('') + '</ul></div>';
    }
    // Neuigkeiten und Erinnerungen
    var fd = (lf.ptFeed || []).slice(0, 5);
    if (fd.length) h += '<div class="pt-sec"><h4>Zuletzt</h4><ul class="pt-feed">' + fd.map(function (x) { return '<li><span class="w">S' + x.s + ' · W' + (x.w || 0) + '</span>' + esc(x.txt) + '</li>'; }).join('') + '</ul></div>';
    var mm = (pt.hist || []).slice(0, 5);
    if (mm.length) h += '<div class="pt-sec"><h4>Gemeinsame Erinnerungen</h4><div class="pt-know">' + mm.map(function (x) { return '<span>' + esc(x.txt) + ' · ' + x.s + '</span>'; }).join('') + '</div></div>';
    // Ausgehen, weitere Bekanntschaften, heimliche Beziehungen
    var A = P.AFF;
    if (A) {
      var aff = A.list(st), oth = lf.cands.filter(function (x) { return !x.aff; }), sc = lf.scandal && lf.scandal.until > tick(st) ? lf.scandal : null;
      h += '<div class="pt-sec"><h4>Weitere Kontakte</h4>';
      if (sc) h += '<p class="small neg">' + U.lc('triangle-alert', 14) + (sc.press ? ' Skandal in der Presse – das belastet dich noch einige Wochen (Stress, Moral, Form, Trainer).' : ' Der Krach wirkt nach – Stress und Moral leiden noch.') + '</p>';
      h += aff.concat(oth).map(function (x) {
        return '<div class="cx-row" style="margin-bottom:6px;align-items:center"><div class="pt-por">' + U.ptPortrait(x.look, 34) + '</div><div style="flex:1"><b>' + esc(x.name) + '</b> <span class="muted small">' + (x.aff ? '🤫 heimliche Beziehung' : esc(L.STAGES[x.stage] || 'Bekanntschaft')) + ' · ' + esc(x.job) + '</span>' + U.bar(x.v, 100) + '</div>' +
          (x.stage >= 1 ? '<button class="sm" data-act="dlgStart" data-dlg="date" data-cid="' + esc(x.id) + '" data-ap="1">Date (1 Termin)</button>' : '<button class="sm" data-act="dlgStart" data-dlg="meet" data-cid="' + esc(x.id) + '">Ansprechen</button>') +
          (x.aff ? '<button class="sm" data-act="ptAffOff" data-id="' + esc(x.id) + '" title="Die Partnerschaft mit ' + esc(fn(pt)) + ' endet">Offiziell machen</button>' : '') +
          '<button class="sm ghost" data-act="ptAffEnd" data-id="' + esc(x.id) + '">Beenden</button></div>';
      }).join('');
      if (aff.length || A.dating(st).length) h += '<p class="small ' + (A.risk(st) >= 0.06 ? 'neg' : 'muted') + '">Entdeckungsrisiko: <b>' + A.riskTxt(st) + '</b> · Heimlichkeit kostet Nerven (Stress) und Zeit für ' + esc(fn(pt)) + '. Fliegt es auf, drohen Trennung, Schlagzeilen und Folgen auf dem Platz.</p>';
      h += U.flingBox(st);
      h += '<button class="sm" data-act="lfGoOut">Ausgehen (1 Termin, ' + money(60) + ')</button></div>';
    }
    var mode = lf.ptMode || 'normal';
    h += '<div class="pt-sec pt-mode"><span class="muted">Privatleben:</span><button class="sm ' + (mode === 'normal' ? 'primary' : '') + '" data-act="ptMode" data-m="normal">Normal</button><button class="sm ' + (mode === 'wenig' ? 'primary' : '') + '" data-act="ptMode" data-m="wenig" title="Kleine Alltagsmomente laufen automatisch, nur wichtige Gespräche erscheinen">Nur Wichtiges</button></div>';
    return h + '</div>';
  };

  // ---------- Aktionen ----------
  function after(st, r) { U.autosave(); if (L.active(st) && !L.active(st).done) { U.showDlg(); U.render(); } else U.render(); return r; }
  U.acts.ptTalk = function () {
    var st = U.st, cur = L.active(st); if (cur && !cur.done) { U.showDlg(); return; }
    var r = P.talk(st); if (r && r.moment) { U.toast(r.moment, 3500); after(st); return; } after(st);
  };
  U.acts.ptAct = function (d) {
    var st = U.st, r = P.doAct(st, d.k);
    if (!r.ok) { U.toast(r.why || 'Gerade nicht möglich.', 3500); return; }
    if (r.txt) U.toast(r.txt, 4000); after(st);
  };
  U.acts.lfGoOut = function () {
    var st = U.st, r = P.AFF ? P.AFF.goOut(st) : { ok: false }; if (!r.ok) { U.toast(r.why || 'Gerade nicht möglich.', 4000); return; }
    U.autosave(); if (r.dlg) { U.showDlg(); U.render(); return; } U.render(); U.showResult('Abend in der Stadt', r.txt, 'freunde');
  };
  // Beziehung jederzeit selbst beenden (Kinder bleiben, Scheidung kostet Geld)
  U.acts.ptBreak = function () {
    var st = U.st, lf = L.life(st), pt = lf.partner; if (!pt) return;
    var wed = pt.stage >= 6, kids = (lf.kids || []).length;
    if (typeof confirm === 'function' && !confirm((wed ? 'Die Scheidung von ' : 'Die Beziehung mit ') + pt.name + ' wirklich beenden?' + (wed ? ' Anwalt und Unterhalt kosten Geld.' : '') + (kids ? ' Die Kinder bleiben Teil deines Lebens.' : '') + ' Das belastet dich einige Wochen.')) return;
    L.breakup(st, 'du hast die Beziehung beendet'); if (R.cx && R.cx.eff) R.cx.eff(st, { well: -4, stress: 2 });
    if (L.remember) try { L.remember(st, 'trennung', 'Du hast dich von ' + pt.name + ' getrennt.', pt.name); } catch (e) {}
    U.toast((wed ? 'Geschieden von ' : 'Getrennt von ') + fn(pt) + '.', 4000); U.autosave(); U.render();
  };
  U.flingBox = function (st) {
    var A = P.AFF; if (!A || !A.flingOpen) return ''; var fo = A.flingOpen(st); if (!fo.length) return '';
    return '<div style="margin:6px 0"><b class="small">🍸 Lockere Affären (' + fo.length + ')</b>' + fo.map(function (f) { return '<div class="cx-row small" style="align-items:center;gap:6px;margin-top:4px"><span style="flex:1">' + esc(f.name) + ' <span class="muted">· ' + f.meets + '× getroffen</span></span><button class="sm ghost" data-act="ptFlingEnd" data-n="' + esc(f.name) + '">Beenden</button></div>'; }).join('') +
      '<p class="small ' + (A.flingRisk(st) >= 0.06 ? 'neg' : 'muted') + '">Entdeckungsrisiko: <b>' + A.flingRiskTxt(st) + '</b> · Jede Affäre kostet pro Woche Stress und Frische. Fliegt es auf (Partnerin, eine der Frauen oder Presse), sinken Ansehen, Frische, Wohlbefinden, Medien, Familie und Fans deutlich.</p></div>';
  };
  U.acts.ptFlingEnd = function (d) { var st = U.st; P.AFF.flingEnd(st, d.n); U.toast('Affäre mit ' + String(d.n).split(' ')[0] + ' beendet.', 3000); U.autosave(); U.render(); };
  U.acts.ptAffEnd = function (d) { var st = U.st, x = P.AFF.get(st, d.id); if (!x) return; P.AFF.end(st, d.id); U.toast('Kontakt zu ' + fn(x) + ' beendet.', 3000); U.autosave(); U.render(); };
  U.acts.ptAffOff = function (d) {
    var st = U.st, x = P.AFF.get(st, d.id), pt = L.life(st).partner; if (!x) return;
    if (typeof confirm === 'function' && !confirm('Mit ' + x.name + ' offiziell zusammen sein? Die Beziehung mit ' + (pt ? pt.name : '') + ' endet dann.')) return;
    P.AFF.official(st, d.id); P.AFF.scandal(st, st.pc.fame >= 45, 'aff'); U.toast('Du bist jetzt offiziell mit ' + fn(x) + ' zusammen.', 4000); U.autosave(); U.render();
  };
  U.acts.ptDec = function (d) { var st = U.st; P.start(st, d.id); after(st); };
  U.acts.ptMode = function (d) { var st = U.st; L.life(st).ptMode = d.m === 'wenig' ? 'wenig' : 'normal'; U.toast(d.m === 'wenig' ? 'Kleine Momente laufen jetzt automatisch – du siehst nur wichtige Gespräche.' : 'Privatleben wieder in normaler Taktung.', 3000); U.autosave(); U.render(); };
  U.acts.ptTodo = function (d) {
    var st = U.st, x = P.todos(st).filter(function (y) { return y.k === d.k; })[0]; if (!x) return;
    if (x.dlg && L.DLG[x.dlg]) U.acts.dlgStart({ dlg: x.dlg }); else U.toast(x.l, 3000);
  };
})(RFM);
