// Privatleben 2.0 – Ausgehen, neue Bekanntschaften und parallele (heimliche) Beziehungen trotz fester Partnerschaft.
// Jede heimliche Beziehung kostet Zeit und Nerven (Stress, weniger Zeit für die Partnerperson) und kann auffliegen –
// durch die Partnerperson, durch eine der anderen Personen oder über die Boulevardpresse. Ein Skandal wirkt mehrere Wochen
// auf Stress, Moral, Form, Medienansehen, Fans und das Vertrauen des Trainers. Gemeinsam für beide Sportarten.
(function (R) {
  var L = R.life, P = L && L.pt, X = R.cx, C = R.pc, S = R.season; if (!P) return;
  function tick(st) { return st.tick || 0; }
  function ch(p) { return R.rand() < p; }
  function fn(x) { return x ? String(x.name).split(' ')[0] : ''; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  var A = P.AFF = {};

  A.list = function (st) { var lf = L.life(st); return lf ? lf.cands.filter(function (x) { return x.aff; }) : []; };
  A.dating = function (st) { var lf = L.life(st); return lf && lf.partner ? lf.cands.filter(function (x) { return !x.aff && x.stage >= 1; }) : []; };
  A.get = function (st, id) { return L.life(st).cands.filter(function (x) { return x.id === id; })[0] || null; };
  A.risk = function (st) { // Entdeckungsrisiko pro Woche (0–1)
    var lf = L.life(st), n = A.list(st).length, d = A.dating(st).length, pt = lf.partner, pc = st.pc; if (!n && !d) return 0;
    var r = 0.03 * n + 0.012 * d + (n >= 2 ? 0.03 * (n - 1) : 0) + pc.fame / 2500 + (pt && pt.stage >= 4 && !pt.ld ? 0.02 : 0) + (lf.suspect && lf.suspect > tick(st) ? 0.05 : 0) + (lf.affOut && tick(st) - lf.affOut <= 1 ? 0.02 : 0);
    return clamp(r, 0, 0.45);
  };
  A.riskTxt = function (st) { var r = A.risk(st); return r >= 0.12 ? 'hoch' : r >= 0.06 ? 'mittel' : r > 0 ? 'gering' : '–'; };

  // Neue Bekanntschaften dürfen nicht aus der Liste rutschen, solange eine heimliche Beziehung läuft
  var baseCand = L.newCand;
  L.newCand = function (st) { var keep = A.list(st).slice(), x = baseCand(st), lf = L.life(st); keep.forEach(function (y) { if (lf.cands.indexOf(y) < 0) lf.cands.unshift(y); }); return x; };
  // „Feste Beziehung“ mit einer weiteren Person, während schon eine Partnerschaft besteht → heimliche Beziehung
  var baseMake = L.makePartner;
  L.makePartner = function (st, x) {
    var lf = L.life(st);
    if (lf.partner && lf.partner !== x) {
      if (x.aff) return x;
      P.ensure(st, x); x.aff = true; x.stage = 3; x.since = tick(st); x.stageT = tick(st); x.v = Math.max(60, x.v); x.lastD = tick(st); x.d0 = x.dates || 0;
      X.chron(st, 'familie', '🤫', 'Heimliche Beziehung', 'Du triffst dich heimlich mit ' + x.name + ' – obwohl du mit ' + lf.partner.name + ' zusammen bist.', 1, 'date');
      X.eff(st, { stress: 3 });
      return x;
    }
    if (x.aff) { x.aff = false; }
    return baseMake(st, x);
  };
  // Nach einer Trennung sind heimliche Beziehungen nicht mehr heimlich: man datet einfach weiter
  var baseBreak = L.breakup;
  L.breakup = function (st, why) { baseBreak(st, why); A.list(st).forEach(function (x) { x.aff = false; x.stage = 2; x.t = tick(st); }); };

  A.official = function (st, id) { // offiziell machen: bisherige Partnerschaft endet
    var x = A.get(st, id), lf = L.life(st); if (!x) return null;
    var old = lf.partner; if (old) { L.breakup(st, 'du hast dich für ' + x.name + ' entschieden'); L.eff(st, { well: -4 }); }
    x.aff = false; var y = A.get(st, id) || x; L.makePartner(st, y); return y;
  };
  A.end = function (st, id, why) {
    var lf = L.life(st), x = A.get(st, id); if (!x) return;
    lf.cands = lf.cands.filter(function (y) { return y.id !== id; });
    if (x.aff) X.chron(st, 'familie', '🚪', 'Heimliche Beziehung beendet', why || ('Du hast die Sache mit ' + x.name + ' beendet.'), 1);
    X.eff(st, { stress: x.aff ? 2 : 0 });
  };
  A.endAll = function (st) { A.list(st).forEach(function (x) { A.end(st, x.id, 'Du hast die Sache mit ' + x.name + ' beendet.'); }); };

  // Skandal: mehrwöchige Folgen für Kopf und Sport
  A.scandal = function (st, press, who) {
    var lf = L.life(st), p = C.player(st), t = tick(st); lf.scandal = { t: t, until: t + (press ? 8 : 4), press: !!press };
    X.eff(st, { stress: press ? 16 : 10, conf: -5, media: press ? -12 : 0, pop: press ? -8 : 0, coach: press ? -4 : 0, mates: press ? -2 : 0, family: -4 });
    L.eff(st, { well: -12, f_fam: press ? -10 : 0, f_krit: press ? -6 : 0, sponsor: press ? -8 : 0 });
    if (p) { p.morale = clamp(p.morale - (press ? 18 : 10), 0, 100); p.form = Math.max(4, (p.form || 6) - (press ? 0.5 : 0.25)); }
    if (press) {
      var nm = p ? R.world.playerName(p) : 'Profi';
      X.chron(st, 'medien', '📰', 'Boulevard: Liebeschaos', '„Doppelleben bei ' + nm + '?“ – die Klatschpresse berichtet groß über deine Beziehungen.', 3, 'presse');
      if (S && S.news) S.news(st, 'Boulevard-Schlagzeile um ' + nm, 'Berichte über mehrere Beziehungen gleichzeitig sorgen für Wirbel. Der Verein ist not amused.', 'medien');
      if (L.remember) L.remember(st, 'scandal', 'Beziehungsskandal in der Presse', 'Boulevard');
    }
  };
  A.weekly = function (st) {
    var lf = L.life(st), pc = st.pc, p = C.player(st); if (!lf || !p || pc.retired) return;
    var t = tick(st), sc = lf.scandal;
    if (sc && sc.until > t) { X.eff(st, { stress: sc.press ? 2 : 1, media: sc.press ? -1 : 0 }); p.morale = clamp(p.morale - (sc.press ? 2 : 1), 0, 100); }
    var aff = A.list(st), pt = lf.partner;
    aff.forEach(function (x) { // jede heimliche Beziehung will gepflegt werden
      if ((x.dates || 0) > (x.d0 || 0)) { x.d0 = x.dates; x.lastD = t; }
      x.t = t; x.v = clamp(x.v - (t - (x.lastD || t) > 3 ? 2.5 : 0.8), 0, 100);
      if (x.v < 35) { A.end(st, x.id, x.name + ' hat genug vom Versteckspiel und meldet sich nicht mehr.'); P.feed && pt && P.feed(st, '🚪 ' + fn(x) + ' hat die heimliche Beziehung beendet.'); }
    });
    aff = A.list(st); if (!aff.length && !A.dating(st).length) return;
    X.eff(st, { stress: 1.2 * aff.length + 0.3 * A.dating(st).length });
    if (pt) { var pp = P.partner(st); pp.neg += 0.7 * aff.length; }
    if (L.active(st) || !ch(A.risk(st))) return;
    // aufgeflogen
    var pool = aff.length ? aff : A.dating(st), x = pool[Math.floor(R.rand() * pool.length)];
    var byPartner = pt && (ch(0.6) || pool.length < 2), press = ch(Math.min(0.85, pc.fame / 110 + (x.pub >= 65 ? 0.15 : 0) + (aff.length >= 2 ? 0.15 : 0)));
    if (byPartner) L.start(st, 'aff_caught', { cid: x.id, press: press ? 1 : 0, n: pool.length });
    else { var y = pool.filter(function (z) { return z !== x; })[0] || null; L.start(st, 'aff_found', { cid: x.id, oid: y ? y.id : '', press: press ? 1 : 0 }); }
    A.scandal(st, press, byPartner ? 'partner' : 'aff');
  };
  C.on.weekly.push(A.weekly);

  function X2(st, d) { return A.get(st, d.cid) || { name: 'jemand', id: '' }; }
  function endI(d, r, e, img) { if (img) d.img = img; return { r: r, e: e || {}, end: true }; }
  // Die Partnerperson erfährt davon
  L.addDlg([{
    id: 'aff_caught', cat: 'familie', ic: '💥', chron: true, imp: 3, max: 3, title: 'Aufgeflogen',
    init: function (st, c, d, s) { if (!L.life(st).partner || !A.get(st, d.cid)) s.done = true; },
    scene: function (c, d) { return 'pt_' + (d.img || 'conflict'); },
    who: function (c) { var p = L.life(c.st).partner; return { n: p ? p.name : '?', role: p ? 'Partnerperson' : '', ic: '💔', kind: 'partner', look: p ? p.look : null }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner, x = X2(c.st, d); return (d.press ? fn(p) + ' wirft dir die Zeitung hin. Auf der Titelseite: du und ' + fn(x) + '. ' : fn(p) + ' hält dir dein Handy hin – Nachrichten von ' + fn(x) + '. ') + '„Wer ist ' + fn(x) + '? Und wie lange geht das schon?“' + (d.n >= 2 ? ' Kurz darauf kommt heraus: Es gibt nicht nur eine.' : ''); },
        opts: [
          { l: 'Ehrlich gestehen und um Verzeihung bitten', fx: function (st, c, d) { var p = P.partner(st), x = X2(st, d), n = A.list(st).length;
            var stay = clamp((p.v - 30) / 100 + (p.confl === 'harmonie' ? 0.15 : 0) + (p.stage >= 6 ? 0.08 : 0) - (n - 1) * 0.15 - (d.press ? 0.15 : 0), 0.04, 0.55);
            if (ch(stay)) { p.v = Math.max(12, p.v - 35); p.neg += 6; P.open(st, 'trust'); P.mem(st, 'betrayal', 'Vertrauensbruch', 'die Sache mit ' + fn(x)); d.img = 'thought'; return { r: fn(p) + ' weint lange. Dann leise: „Ich weiß nicht, ob ich dir je wieder vertrauen kann. Aber ich will es versuchen – wenn das sofort aufhört.“', e: { stress: 4 }, next: 'cut' }; }
            L.breakup(st, 'Vertrauensbruch – die Affäre mit ' + x.name); return endI(d, fn(p) + ' packt noch am selben Abend die Sachen. „Es ist vorbei.“', { stress: 8, well: -8 }, 'farewell'); } },
          { l: 'Alles abstreiten', fx: function (st, c, d) { var p = P.partner(st), x = X2(st, d), lf = L.life(st);
            if (d.press || ch(0.55) || (lf.suspect && lf.suspect > tick(st))) { L.breakup(st, 'Lügen und Betrug (' + x.name + ')'); return endI(d, 'Die Beweise sind eindeutig. „Du lügst mir ins Gesicht?“ ' + fn(p) + ' geht – endgültig.', { stress: 10, well: -10, conf: -3 }, 'farewell'); }
            p.v = Math.max(10, p.v - 18); lf.suspect = tick(st) + 16; return endI(d, fn(p) + ' glaubt dir nicht ganz. Das Misstrauen bleibt – beim nächsten Mal gibt es keine Ausrede.', { stress: 5 }, 'thought'); } },
          { l: function (c, d) { return 'Zu ' + fn(X2(c.st, d)) + ' stehen und dich trennen'; }, fx: function (st, c, d) { var x = X2(st, d), p = L.life(st).partner; var y = A.official(st, x.id); return endI(d, 'Du sagst ' + fn(p) + ' die Wahrheit und gehst. Ab jetzt bist du offiziell mit ' + fn(y) + ' zusammen.', { stress: 6, well: -3 }, 'farewell'); } }] },
      cut: { say: function (c, d) { return '„Beendest du es? Jetzt, vor meinen Augen?“'; },
        opts: [
          { l: 'Ja. Ich beende alles sofort.', fx: function (st, c, d) { A.endAll(st); L.life(st).suspect = tick(st) + 30; return endI(d, 'Du schreibst die Nachricht vor ' + fn(L.life(st).partner) + 's Augen. Der Weg zurück wird lang.', { partner: 2, stress: 2 }, 'reconcile'); } },
          { l: 'Ich brauche Zeit.', fx: function (st, c, d) { L.breakup(st, 'kein klares Ende der Affäre'); return endI(d, '„Dann hast du dich entschieden.“ Die Tür fällt ins Schloss.', { stress: 6, well: -6 }, 'farewell'); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    // Eine der anderen Personen findet heraus, dass es eine feste Partnerschaft (oder noch jemanden) gibt
    id: 'aff_found', cat: 'familie', ic: '💥', chron: true, imp: 2, max: 2, title: 'Es kommt heraus',
    init: function (st, c, d, s) { if (!A.get(st, d.cid)) s.done = true; },
    scene: function (c, d) { return 'pt_' + (d.img || 'conflict'); },
    who: function (c, d) { var x = X2(c.st, d); P.ensure(c.st, x); return { n: x.name, role: 'heimliche Beziehung', ic: '🤫', kind: 'partner', look: x.look || null }; },
    nodes: {
      start: { say: function (c, d) { var x = X2(c.st, d), y = d.oid ? A.get(c.st, d.oid) : null, p = L.life(c.st).partner; return fn(x) + ': „' + (p ? 'Du bist mit ' + fn(p) + ' zusammen?!' : '') + (y ? (p ? ' Und dann auch noch ' : 'Es gibt auch noch ') + fn(y) + '?!' : '') + ' Für wen hältst du mich?“' + (d.press ? ' Wenig später steht die Geschichte in der Zeitung.' : ''); },
        opts: [
          { l: 'Entschuldigen und es beenden', fx: function (st, c, d) { var x = X2(st, d); A.end(st, x.id, fn(x) + ' hat von deinem Doppelleben erfahren – es ist aus.'); return endI(d, fn(x) + ' blockiert deine Nummer.', { stress: 2 }, 'farewell'); } },
          { l: function (c, d) { return L.life(c.st).partner ? 'Ich trenne mich für dich' : 'Ich entscheide mich für dich'; }, fx: function (st, c, d) { var x = X2(st, d); if (d.oid) A.end(st, d.oid, 'Du hast dich gegen ' + ((A.get(st, d.oid) || {}).name || 'die andere Person') + ' entschieden.'); var y = A.official(st, x.id); return endI(d, 'Du entscheidest dich für ' + fn(y) + '. Die bisherige Beziehung ist vorbei – und alle wissen davon.', { stress: 5 }, 'reconcile'); } },
          { l: 'Lügen: „Das ist längst vorbei.“', fx: function (st, c, d) { var x = X2(st, d); x.v = Math.max(20, x.v - 15); L.life(st).suspect = tick(st) + 12; return endI(d, fn(x) + ' glaubt dir – vorerst. Das Versteckspiel wird noch riskanter.', { stress: 4 }, 'thought'); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);

  // Lockere Affären beim Ausgehen – auch mehrere gleichzeitig, mit oder ohne feste Partnerschaft.
  // Laufend: Spaß, aber Stress und weniger Frische. Fliegt etwas auf (Partnerin, eine der Frauen, Presse), wird es teuer:
  // Ansehen, Stress, Frische, Wohlbefinden, Medien, Familie und (normale) Fans leiden deutlich.
  A.flings = function (st) { var lf = L.life(st); return lf.flings || (lf.flings = []); };
  A.flingOpen = function (st) { return A.flings(st).filter(function (f) { return f.on; }); };
  A.flingRisk = function (st) {
    var lf = L.life(st), n = A.flingOpen(st).length; if (!n) return 0;
    return clamp(0.03 * n + 0.035 * (n - 1) + st.pc.fame / 2000 + (lf.partner ? 0.02 : 0) + (lf.suspect && lf.suspect > tick(st) ? 0.05 : 0), 0, 0.4);
  };
  A.flingRiskTxt = function (st) { var r = A.flingRisk(st); return r >= 0.12 ? 'hoch' : r >= 0.06 ? 'mittel' : r > 0 ? 'gering' : '–'; };
  A.flingAdd = function (st, name) { var t = tick(st), f = { name: name, t: t, last: t, on: true, meets: 1, pub: R.randInt(20, 95) }; A.flings(st).push(f); return f; };
  A.flingEnd = function (st, name) { A.flingOpen(st).forEach(function (f) { if (!name || f.name === name) f.on = false; }); };
  // Folgen, wenn es herauskommt (how: { press, frau, partner })
  A.flingExposed = function (st, how, names) {
    var lf = L.life(st), p = C.player(st), t = tick(st), pr = !!how.press, n = (names || []).length || 1;
    var k = pr ? 1 : how.frau ? 0.75 : 0.6, m = 1 + Math.min(2, n - 1) * 0.2;
    lf.scandal = { t: t, until: t + (pr ? 8 : 4), press: pr, fling: 1 };
    lf.flingHit = { t: t, press: pr, frau: !!how.frau, partner: !!how.partner };
    X.eff(st, { stress: Math.round(16 * k * m), fit: -Math.round(14 * k * m), pop: -Math.round(10 * k * m), fame: -(pr ? 3 : 1), media: pr ? -12 : -2, conf: -3, coach: pr ? -3 : 0 });
    L.eff(st, { well: -Math.round(18 * k * m), fam: -Math.round(10 * k), f_fam: -Math.round(12 * k * m), f_gel: -Math.round(8 * k * m), sponsor: pr ? -6 : 0 });
    if (p) { p.morale = clamp(p.morale - Math.round(14 * k), 0, 100); p.form = Math.max(4, (p.form || 6) - (pr ? 0.4 : 0.2)); }
    var nm = p ? R.world.playerName(p) : 'Profi', who = (names || []).join(', ');
    X.chron(st, pr ? 'medien' : 'familie', pr ? '📰' : '💥', pr ? 'Boulevard: Frauengeschichten' : 'Affäre aufgeflogen',
      pr ? '„Die Frauen des ' + nm + '“ – die Klatschpresse berichtet über deine Affären' + (who ? ' (' + who + ')' : '') + '.' : 'Deine Affären' + (who ? ' (' + who + ')' : '') + ' sind aufgeflogen – das Gerede ist groß.', 3, pr ? 'presse' : 'date');
    if (pr && S && S.news) S.news(st, 'Boulevard-Schlagzeile um ' + nm, 'Berichte über mehrere Frauengeschichten sorgen für Wirbel. Familienfans und Sponsoren reagieren verstimmt.', 'medien');
    if (pr && L.remember) L.remember(st, 'scandal', 'Affären in der Boulevardpresse', 'Boulevard');
  };
  A.flingWeekly = function (st) {
    var lf = L.life(st), pc = st.pc; if (!lf || pc.retired || !lf.flings) return;
    var t = tick(st); lf.flings = lf.flings.filter(function (f) { return f.on || t - f.t <= 40; });
    A.flingOpen(st).forEach(function (f) { if (t - f.last > 6) f.on = false; }); // ohne Treffen schläft es ein
    var open = A.flingOpen(st), n = open.length; if (!n) return;
    // laufende Belastung: mehr Spaß, aber weniger Schlaf und Ruhe
    X.eff(st, { stress: 1.2 * n + (n >= 3 ? 1.5 : 0), fit: -(1.2 * n + (n >= 3 ? 1 : 0)) });
    L.eff(st, { well: Math.min(2, 0.8 * n) - (n >= 3 ? 1 : 0) });
    if (lf.partner) P.partner(st).neg += 0.6 * n;
    if (L.active(st) || !ch(A.flingRisk(st))) return;
    var f = open[Math.floor(R.rand() * n)], pt = lf.partner;
    var press = ch(Math.min(0.7, pc.fame / 110 + (f.pub >= 70 ? 0.1 : 0) + (n >= 3 ? 0.1 : 0)));
    var byPartner = !!pt && ch(0.5), byFrau = !byPartner && n >= 2 && (ch(0.6) || !press);
    if (!byPartner && !byFrau && !press) return; // single, nur eine Affäre, keiner interessiert sich
    var names = byFrau || press ? open.map(function (x) { return x.name; }) : [f.name];
    if (press) open.forEach(function (x) { x.pub = 100; });
    A.flingExposed(st, { press: press, frau: byFrau, partner: byPartner || (press && !!pt) }, names);
    if (pt && (byPartner || press)) { f.on = false; L.start(st, 'fling_caught', { name: f.name, press: press ? 1 : 0, n: n }); }
    else if (byFrau) { var o = open.filter(function (x) { return x !== f; }); L.start(st, 'fling_clash', { name: f.name, other: o.map(function (x) { return x.name; }).join(' und '), press: press ? 1 : 0 }); }
    else L.start(st, 'fling_press', { names: names.join(', ') });
  };
  C.on.weekly.push(A.flingWeekly);
  L.addDlg([{
    id: 'fling_night', cat: 'familie', ic: '🍸', scene: 'date', title: 'Spät in der Bar', max: 3, imp: 1,
    who: function (c, d) { return { n: d.name, role: 'Bekanntschaft in der Bar', ic: '🍸', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner, n = A.flingOpen(c.st).length; return 'Es ist spät. ' + fn(d) + ' flirtet schon den ganzen Abend mit dir, jetzt beugt sie sich zu dir: „Kommst du noch mit zu mir?“ ' + (p ? fn(p) + ' glaubt, du bist mit den Jungs unterwegs.' : n ? 'Es wäre nicht die einzige Frau, mit der du gerade etwas laufen hast.' : ''); },
        opts: [
          { l: 'Mitgehen', hint: 'Spaß, aber Stress, weniger Frische und Entdeckungsrisiko', fx: function (st, c, d) { var pt = L.life(st).partner; A.flingAdd(st, d.name); if (pt) P.partner(st).neg += 2;
            X.chron(st, 'familie', '🍸', 'Affäre', 'Eine Nacht mit ' + d.name + (pt ? ' – ' + fn(pt) + ' darf davon nichts erfahren.' : '.'), 1, 'date');
            return endI(d, pt ? 'Am Morgen schleichst du dich raus. Auf dem Handy: drei Nachrichten von ' + fn(pt) + '. Das schlechte Gewissen fährt mit.' : 'Eine lange Nacht. ' + fn(d) + ' schreibt dir am Morgen: „Bis bald?“', pt ? { well: 3, stress: 3, fit: -3 } : { well: 4, stress: 1, fit: -3 }); } },
          { l: 'Flirten, Nummer tauschen, allein nach Hause', fx: function (st, c, d) { var lf = L.life(st); if (lf.partner && ch(0.2)) { P.partner(st).neg += 3; lf.suspect = tick(st) + 8; return endI(d, 'Ein Bekannter von ' + fn(lf.partner) + ' hat euch an der Bar gesehen. Zu Hause gibt es Fragen.', { stress: 3 }); } return endI(d, 'Ein harmloser Flirt – du gehst allein nach Hause.', { well: 1 }); } },
          { l: function (c) { return L.life(c.st).partner ? 'Abblocken – du bist vergeben' : 'Freundlich absagen'; }, fx: function (st, c, d) { var pp = P.partner(st); if (pp) pp.v = Math.min(100, pp.v + 2); return endI(d, '„Schade.“ ' + fn(d) + ' zuckt mit den Schultern. Du fährst nach Hause und schläfst aus.', { well: 1, stress: -1, fit: 1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'fling_again', cat: 'familie', ic: '📱', scene: 'date', title: 'Nachricht am Abend', max: 4, imp: 1,
    init: function (st, c, d, s) { if (!A.flingOpen(st).some(function (f) { return f.name === d.name; })) s.done = true; },
    who: function (c, d) { return { n: d.name, role: 'Affäre', ic: '📱', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var n = A.flingOpen(c.st).length; return fn(d) + ' schreibt: „Lust, heute noch vorbeizukommen?“' + (n >= 2 ? ' Parallel laufen gerade ' + n + ' Geschichten – den Überblick zu behalten wird anstrengend.' : ''); },
        opts: [
          { l: 'Hinfahren', hint: 'Spaß, aber Stress und Frische −', fx: function (st, c, d) { var f = A.flingOpen(st).filter(function (x) { return x.name === d.name; })[0]; if (f) { f.last = tick(st); f.meets++; } if (L.life(st).partner) P.partner(st).neg += 1.5; return endI(d, 'Wieder ein später Abend bei ' + fn(d) + '. Der Wecker morgen wird brutal.', { well: 3, stress: 2, fit: -3 }); } },
          { l: 'Schluss machen', fx: function (st, c, d) { A.flingEnd(st, d.name); return endI(d, '„Okay. War schön mit dir.“ Ein bisschen Wehmut – und ein bisschen Erleichterung.', { stress: -2, well: -1 }); } },
          { l: 'Nicht antworten', fx: function (st, c, d) { return endI(d, 'Du legst das Handy weg. ' + fn(d) + ' wird sich wieder melden – oder auch nicht.', {}); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'fling_clash', cat: 'familie', ic: '💥', chron: true, imp: 3, max: 3, title: 'Die Frauen wissen voneinander',
    who: function (c, d) { return { n: d.name, role: 'Affäre', ic: '💥', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { return fn(d) + ' steht vor deiner Tür, das Handy in der Hand: „Ich weiß von ' + d.other + '. Wie viele sind es noch?“' + (d.press ? ' Die Geschichte steht inzwischen auch in der Zeitung.' : ' Im Freundeskreis wird bereits geredet.'); },
        opts: [
          { l: 'Mit allen Schluss machen', fx: function (st, c, d) { A.flingEnd(st); return endI(d, 'Du beendest alles. Ruhe kehrt ein – aber das Gerede bleibt noch eine Weile.', { stress: -3, well: -2 }, 'farewell'); } },
          { l: function (c, d) { return 'Bei ' + fn(d) + ' bleiben, die anderen beenden'; }, fx: function (st, c, d) { A.flingOpen(st).forEach(function (f) { if (f.name !== d.name) f.on = false; }); if (ch(0.5)) { A.flingEnd(st, d.name); return endI(d, '„Zu spät.“ ' + fn(d) + ' dreht sich um und geht. Am Ende stehst du ohne alle da.', { stress: 3, well: -4 }, 'farewell'); } return endI(d, fn(d) + ' zögert – und bleibt. Vorerst.', { stress: 1 }); } },
          { l: 'Schulterzucken: „Wir haben nie über Exklusivität geredet.“', fx: function (st, c, d) { A.flingOpen(st).forEach(function (f) { if (ch(0.6)) f.on = false; }); return endI(d, 'Ehrlich, aber kalt. Einige sind weg, und der Ruf als Frauenheld hängt dir an.', { pop: -3, f_fam: -3, stress: 2 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'fling_press', cat: 'medien', ic: '📰', chron: true, imp: 3, max: 3, title: 'Schlagzeilen über deine Affären',
    who: function () { return { n: 'Boulevardpresse', role: 'Medien', ic: '📰', kind: 'interview' }; },
    nodes: {
      start: { say: function (c, d) { return 'Fotos von dir mit ' + d.names + ' – mitten in der Nacht, vor Bars und Hotels. Die Boulevardpresse fragt nach einem Statement.'; },
        opts: [
          { l: 'Öffentlich entschuldigen', fx: function (st, c, d) { return endI(d, 'Du entschuldigst dich bei Fans und Familie. Ein Teil glaubt dir, die Häme bleibt.', { media: 3, f_fam: 4, fam: 3, stress: 2 }); } },
          { l: '„Das ist meine Privatsache.“', fx: function (st, c, d) { return endI(d, 'Kurz und knapp. Die Presse findet dich arrogant, die Familienfans schütteln den Kopf.', { media: -3, f_fam: -2, conf: 1 }); } },
          { l: 'Schweigen und abtauchen', fx: function (st, c, d) { return endI(d, 'Du sagst nichts. Die Geschichte läuft ein paar Tage, dann wird es leiser.', { stress: 1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'fling_caught', cat: 'familie', ic: '💥', chron: true, imp: 3, max: 2, title: 'Die Affäre fliegt auf',
    init: function (st, c, d, s) { if (!L.life(st).partner) s.done = true; },
    scene: function (c, d) { return 'pt_' + (d.img || 'conflict'); },
    who: function (c) { var p = L.life(c.st).partner; return { n: p ? p.name : '?', role: p ? 'Partnerperson' : '', ic: '💔', kind: 'partner', look: p ? p.look : null }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner; return (d.press ? fn(p) + ' knallt dir die Zeitung auf den Tisch: Fotos von dir und ' + fn(d) + ' vor einer Bar, mitten in der Nacht. ' : fn(p) + ' hält dir dein Handy hin. Eine Nachricht von ' + fn(d) + ': „War schön neulich. Wiederholen?“ ') + '„Erklär mir das. Sofort.“'; },
        opts: [
          { l: 'Gestehen: „Es war nur eine Nacht. Es tut mir leid.“', fx: function (st, c, d) { var p = P.partner(st);
            var stay = clamp((p.v - 35) / 100 + (p.confl === 'harmonie' ? 0.1 : 0) + (p.stage >= 6 ? 0.08 : 0) - (d.press ? 0.15 : 0) - ((d.n || 1) - 1) * 0.15, 0.05, 0.5);
            if (ch(stay)) { p.v = Math.max(10, p.v - 30); p.neg += 8; P.open(st, 'trust'); P.mem(st, 'betrayal', 'Vertrauensbruch', 'die Nacht mit ' + fn(d)); d.img = 'thought'; return endI(d, fn(p) + ' schreit, weint, schweigt tagelang. Dann: „Ein einziges Mal noch – und ich bin weg.“ Die Beziehung steckt in einer tiefen Krise.', { stress: 10, well: -8 }); }
            L.breakup(st, 'Seitensprung mit ' + d.name); return endI(d, '„Eine Nacht? Das ändert gar nichts.“ ' + fn(p) + ' zieht noch am selben Abend aus.', { stress: 14, well: -12 }, 'farewell'); } },
          { l: 'Alles abstreiten', fx: function (st, c, d) { var p = P.partner(st), lf = L.life(st);
            if (d.press || ch(0.5) || (lf.suspect && lf.suspect > tick(st))) { L.breakup(st, 'Lügen nach dem Seitensprung (' + d.name + ')'); return endI(d, '„Du lügst mir ins Gesicht?!“ Die Beweise sind eindeutig – ' + fn(p) + ' beendet die Beziehung.', { stress: 16, well: -12, conf: -3 }, 'farewell'); }
            p.v = Math.max(8, p.v - 15); p.neg += 5; lf.suspect = tick(st) + 16; return endI(d, fn(p) + ' glaubt dir nicht wirklich. Ab jetzt wird jede Nachricht auf deinem Handy beobachtet.', { stress: 8 }, 'thought'); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);

  // Ausgehen ist jederzeit möglich – auch in einer Beziehung (dann mit Flirt- und Affärenrisiko)
  A.goOut = function (st) {
    var r = L.spend(st, 1, 60); if (!r.ok) return r;
    var lf = L.life(st), cx = st.pc.cx, pt = lf.partner;
    if (pt) { lf.affOut = tick(st); P.partner(st).neg += 0.5; }
    var fo = A.flingOpen(st); if (fo.length && ch(0.35)) { L.ensure(st).dlg = null; L.start(st, 'fling_again', { name: fo[Math.floor(R.rand() * fo.length)].name }); return { ok: true, dlg: true }; }
    if (ch((pt ? 0.3 : 0.25) + (cx.per.conf - 50) / 300)) { L.ensure(st).dlg = null; L.start(st, 'fling_night', { name: L.name('a') }); return { ok: true, dlg: true }; }
    if (ch(0.45 + (cx.per.conf - 50) / 200 - (pt ? 0.1 : 0))) { var x = L.newCand(st); L.ensure(st).dlg = null; L.start(st, 'meet', { cid: x.id, where: pt ? 'Beim Ausgehen ohne ' + fn(pt) : 'Beim Ausgehen mit Freunden' }); return { ok: true, dlg: true }; }
    L.eff(st, { well: 2, stress: -1 }); if (lf.friends[0]) lf.friends[0].v = Math.min(100, lf.friends[0].v + 3);
    return { ok: true, txt: 'Ein netter Abend mit Freunden – heute ohne neue Bekanntschaft. Wohlbefinden +2, Stress −1' };
  };
})(RFM);
