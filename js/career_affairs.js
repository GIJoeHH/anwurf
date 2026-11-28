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
    // Nur geflirtet / Nummer getauscht, aber nichts passiert: eigene, mildere Szene statt „Affäre aufgeflogen“
    if (byPartner && !x.aff && !(x.night > 0)) { L.start(st, 'flirt_caught', { cid: x.id, press: press ? 1 : 0 }); if (press) X.eff(st, { media: -3, stress: 3 }); else X.eff(st, { stress: 2 }); return; }
    if (byPartner) L.start(st, 'aff_caught', { cid: x.id, press: press ? 1 : 0, n: pool.length });
    else { var y = pool.filter(function (z) { return z !== x; })[0] || null; L.start(st, 'aff_found', { cid: x.id, oid: y ? y.id : '', press: press ? 1 : 0 }); }
    A.scandal(st, press, byPartner ? 'partner' : 'aff');
  };
  C.on.weekly.push(A.weekly);

  function X2(st, d) { return A.get(st, d.cid) || { name: 'jemand', id: '' }; }
  function endI(d, r, e, img) { if (img) d.img = img; return { r: r, e: e || {}, end: true }; }
  // Die Partnerperson erfährt davon
  L.addDlg([{
    // Die Partnerperson entdeckt einen Flirt bzw. eine getauschte Nummer – es ist aber nichts passiert
    id: 'flirt_caught', cat: 'familie', ic: '📱', imp: 2, max: 2, title: 'Wer ist das?',
    init: function (st, c, d, s) { if (!L.life(st).partner || !A.get(st, d.cid)) s.done = true; },
    scene: function (c, d) { return 'pt_' + (d.img || 'conflict'); },
    who: function (c) { var p = L.life(c.st).partner; return { n: p ? p.name : '?', role: p ? 'Partnerperson' : '', ic: '📱', kind: 'partner', look: p ? p.look : null }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner, x = X2(c.st, d); return (d.press ? 'Ein Klatschportal zeigt ein Foto von dir und ' + fn(x) + ' an einer Bar. ' : fn(p) + ' hat auf deinem Handy Nachrichten von ' + fn(x) + ' gesehen. ') + '„Wer ist ' + fn(x) + '? Läuft da was?“ Passiert ist nichts – aber das muss ' + fn(p) + ' dir erst einmal glauben.'; },
        opts: [
          { l: 'Ehrlich erklären: „Nur geflirtet, da war nichts.“', fx: function (st, c, d) { var p = P.partner(st), x = X2(st, d);
            if (ch(clamp(0.75 + (p.v - 50) / 200 - (d.press ? 0.1 : 0), 0.55, 0.95))) { p.v = Math.max(10, p.v - 4); p.neg += 1; return endI(d, fn(p) + ' atmet durch. „Okay. Ich glaube dir. Aber lösch die Nummer.“ Du tust es.', { stress: 2 }, 'thought'); }
            p.v = Math.max(10, p.v - 10); p.neg += 3; L.life(st).suspect = tick(st) + 8; return endI(d, fn(p) + ' bleibt skeptisch: „Nur geflirtet? Das fühlt sich trotzdem mies an.“ Ein paar Tage ist die Stimmung frostig – aber ihr bleibt zusammen.', { stress: 4 }, 'thought'); } },
          { l: function (c, d) { return 'Entschuldigen und den Kontakt zu ' + fn(X2(c.st, d)) + ' löschen'; }, fx: function (st, c, d) { var p = P.partner(st), x = X2(st, d); A.end(st, x.id); p.v = Math.max(10, p.v - 2); p.neg = Math.max(0, p.neg - 1);
            return endI(d, 'Du löschst den Kontakt vor ' + fn(p) + 's Augen und entschuldigst dich. „Danke. Das war mir wichtig.“', { partner: 1, stress: 1 }, 'reconcile'); } },
          { l: 'Abwiegeln: „Ist doch nichts dabei.“', fx: function (st, c, d) { var p = P.partner(st); p.v = Math.max(10, p.v - 7); p.neg += 3; L.life(st).suspect = tick(st) + 10; return endI(d, '„Für dich vielleicht nicht.“ ' + fn(p) + ' ist gekränkt. Ihr redet heute nicht mehr viel.', { stress: 3 }, 'thought'); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
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
  // Aus einer Affäre kann mehr werden: sie wird zur echten Bekanntschaft („Erste Dates“) – als Single der Weg zur Beziehung
  A.flingToCand = function (st, name) {
    var f = A.flingOpen(st).filter(function (x) { return x.name === name; })[0]; if (!f) return null; f.on = false;
    var x = L.newCand(st); x.name = f.name; x.g = 'a'; x.stage = 2; x.v = clamp(60 + f.meets * 3, 60, 78); x.dates = f.meets; x.fling = 1; x.school = f.school || 0; x.t = tick(st);
    X.chron(st, 'familie', '💞', 'Mehr als eine Affäre', 'Aus der Sache mit ' + f.name + ' wird mehr – ihr datet jetzt richtig.', 1, 'date');
    return x;
  };
  A.flingMeet = function (st, name) { // selbst melden: kostet einen Termin
    if (!A.flingOpen(st).some(function (f) { return f.name === name; })) return { ok: false, why: 'Diese Affäre läuft nicht mehr.' };
    if (L.active(st)) return { ok: false, why: 'Erst das laufende Gespräch beenden.' };
    var r = L.spend(st, 1, 0); if (!r.ok) return r;
    L.ensure(st).dlg = null; L.start(st, 'fling_again', { name: name, own: 1 }); return { ok: true, dlg: true };
  };
  A.flingAsk = function (st, name) { // will sie auch mehr?
    var f = A.flingOpen(st).filter(function (x) { return x.name === name; })[0]; if (!f) return { ok: false };
    var n = A.flingOpen(st).length, p = clamp(0.45 + f.meets * 0.08 + (st.pc.cx.per.conf - 50) / 250 - (n - 1) * 0.08 - (f.pub >= 100 ? 0.15 : 0), 0.15, 0.85);
    if (ch(p)) return { ok: true, x: A.flingToCand(st, name) };
    f.last = tick(st); return { ok: false, no: true };
  };
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
          { l: 'Flirten, Nummer tauschen, allein nach Hause', fx: function (st, c, d) { var lf = L.life(st); if (!lf.cands.some(function (y) { return y.name === d.name; })) { var nc = L.newCand(st); nc.name = d.name; nc.g = 'a'; nc.stage = 1; nc.v = Math.max(nc.v, 55); nc.where = 'Bar'; } if (lf.partner && ch(0.2)) { P.partner(st).neg += 3; lf.suspect = tick(st) + 8; return endI(d, 'Ein Bekannter von ' + fn(lf.partner) + ' hat euch an der Bar gesehen. Zu Hause gibt es Fragen.', { stress: 3 }); } return endI(d, 'Ein harmloser Flirt – du gehst allein nach Hause.', { well: 1 }); } },
          { l: function (c) { return L.life(c.st).partner ? 'Abblocken – du bist vergeben' : 'Freundlich absagen'; }, fx: function (st, c, d) { var pp = P.partner(st); if (pp) pp.v = Math.min(100, pp.v + 2); return endI(d, '„Schade.“ ' + fn(d) + ' zuckt mit den Schultern. Du fährst nach Hause und schläfst aus.', { well: 1, stress: -1, fit: 1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'fling_again', cat: 'familie', ic: '📱', scene: 'date', title: 'Nachricht am Abend', max: 4, imp: 1,
    init: function (st, c, d, s) { if (!A.flingOpen(st).some(function (f) { return f.name === d.name; })) s.done = true; },
    who: function (c, d) { return { n: d.name, role: 'Affäre', ic: '📱', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var n = A.flingOpen(c.st).length; return (d.own ? 'Du schreibst ' + fn(d) + ': „Lust auf heute Abend?“ Die Antwort kommt schnell: „Komm vorbei.“' : fn(d) + ' schreibt: „Lust, heute noch vorbeizukommen?“') + (n >= 2 ? ' Parallel laufen gerade ' + n + ' Geschichten – den Überblick zu behalten wird anstrengend.' : ''); },
        opts: [
          { l: 'Hinfahren', hint: 'Spaß, aber Stress und Frische −', fx: function (st, c, d) { var f = A.flingOpen(st).filter(function (x) { return x.name === d.name; })[0]; if (f) { f.last = tick(st); f.meets++; } if (L.life(st).partner) P.partner(st).neg += 1.5; return endI(d, 'Wieder ein später Abend bei ' + fn(d) + '. Der Wecker morgen wird brutal.', { well: 3, stress: 2, fit: -3 }); } },
          { l: 'Mehr daraus machen – richtig daten', hint: function (c) { return L.life(c.st).partner ? 'Wird zum heimlichen Kontakt neben der Beziehung' : 'Kann eine feste Beziehung werden'; }, fx: function (st, c, d) { var r = A.flingAsk(st, d.name);
            if (r.ok) return endI(d, fn(d) + ' lächelt: „Ehrlich gesagt hab ich auf diese Frage gewartet.“ Ab jetzt seid ihr mehr als eine Affäre.', { well: 4, stress: -1 });
            return endI(d, fn(d) + ' lacht: „Lass es uns locker halten, okay?“ Ihr bleibt bei dem, was es ist.', { conf: -1 }); } },
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
          { l: function (c, d) { return 'Bei ' + fn(d) + ' bleiben, die anderen beenden'; }, fx: function (st, c, d) { A.flingOpen(st).forEach(function (f) { if (f.name !== d.name) f.on = false; }); if (ch(0.5)) { A.flingEnd(st, d.name); return endI(d, '„Zu spät.“ ' + fn(d) + ' dreht sich um und geht. Am Ende stehst du ohne alle da.', { stress: 3, well: -4 }, 'farewell'); } A.flingToCand(st, d.name); return endI(d, fn(d) + ' zögert – und bleibt. Aus der Affäre wird etwas Ernstes, vorerst auf Bewährung.', { stress: 1 }); } },
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

  // Bekanntschaften: zwischen den Dates passiert auch etwas – schreiben, einladen, eine Nacht, Klartext reden; sie melden sich auch selbst
  function money(v) { return R.fmtMoney ? R.fmtMoney(v) : v + ' €'; }
  function cnd(st, d) { return A.get(st, d.cid) || { id: '', name: d.name || 'Sie', v: 50, dates: 0, stage: 1, sport: 50, gone: 1 }; } // Platzhalter, falls sie inzwischen weg ist
  function cOut(st, x, why) { var lf = L.life(st); lf.cands = lf.cands.filter(function (y) { return y !== x; }); if (why) X.chron(st, 'familie', '🍂', 'Kontakt eingeschlafen', why, 1); }
  function together(st, x) { // feste Beziehung (oder heimlich, falls schon vergeben)
    if (x.gone) return '';
    var pt = L.life(st).partner; L.makePartner(st, x); return pt ? 'Ihr trefft euch ab jetzt heimlich – ' + fn(pt) + ' darf nichts merken.' : 'Ihr seid jetzt offiziell ein Paar.';
  }
  L.addDlg([{
    id: 'cand_chat', cat: 'familie', ic: '💬', scene: 'date', title: function (c, d) { var x = cnd(c.st, d); return 'Nachricht an ' + fn(x); }, max: 2, imp: 1,
    init: function (st, c, d, s) { if (cnd(st, d).gone) s.done = true; },
    who: function (c, d) { var x = cnd(c.st, d); return { n: x ? x.name : '?', role: x ? (L.STAGES[x.stage] || 'Bekanntschaft') + ' · ' + x.job : '', ic: '💬', kind: 'partner', look: x ? x.look : null }; },
    nodes: {
      start: { say: function (c, d) { var x = cnd(c.st, d); return x ? 'Du öffnest den Chat mit ' + fn(x) + '. Interesse: ' + Math.round(x.v) + '/100. ' + (x.dates ? 'Ihr hattet schon ' + x.dates + ' Date' + (x.dates > 1 ? 's' : '') + '.' : 'Ihr kennt euch erst kurz.') : ''; },
        opts: [
          { l: 'Flirten', fx: function (st, c, d) { var x = cnd(st, d), t = tick(st), fresh = x.msgT !== t; x.msgT = t; if (fresh) x.v = clamp(x.v + 4, 0, 100);
            if (fresh && ch(0.3)) { x.v = clamp(x.v + 2, 0, 100); return endI(d, fn(x) + ' antwortet mit drei Emojis – und: „Wann sehen wir uns endlich?“', { well: 2 }); }
            return endI(d, fresh ? 'Ihr schreibt bis spät in die Nacht.' : fn(x) + ' antwortet knapp – ihr habt heute schon viel geschrieben.', fresh ? { well: 1 } : {}); } },
          { l: 'Zum nächsten Heimspiel einladen', fx: function (st, c, d) { var x = cnd(st, d); if (x.match === tick(st)) return endI(d, 'Die Einladung steht schon.', {}); x.match = tick(st); x.v = clamp(x.v + (x.sport >= 50 ? 6 : 2), 0, 100);
            return endI(d, x.sport >= 50 ? fn(x) + ' ist begeistert: „Ich hol mir ein Trikot!“' : fn(x) + ': „Ich hab keine Ahnung von Sport – aber für dich komm ich.“', { well: 1 }); } },
          { l: 'Noch spontan bei ihr vorbeischauen (1 Termin)', req: function (c, d) { var x = cnd(c.st, d); return !!x && (x.dates || 0) >= 1 && x.v >= 55; }, hint: 'Kann die Nacht werden – oder zu schnell sein',
            fx: function (st, c, d) { var x = cnd(st, d), r = L.spend(st, 1, 0); if (!r.ok) return endI(d, r.why, {}); var pt = L.life(st).partner;
              if (ch(0.4 + (x.v - 55) / 60)) { x.v = clamp(x.v + 7, 0, 100); x.night = (x.night || 0) + 1; x.dates = (x.dates || 0) + 1; if (pt) { P.partner(st).neg += 2; if (ch(0.15)) L.life(st).suspect = tick(st) + 8; }
                return endI(d, 'Aus „nur kurz vorbeischauen“ wird eine lange Nacht. ' + fn(x) + ' schläft noch, als du dich rausschleichst.', { well: 3, stress: pt ? 2 : 0, fit: -2 }); }
              x.v = clamp(x.v - 3, 0, 100); return endI(d, fn(x) + ' macht nur kurz die Tür auf: „Heute nicht – aber schön, dass du da bist.“', { conf: -1 }); } },
          { l: 'Fragen, was das zwischen euch ist', req: function (c, d) { var x = cnd(c.st, d); return !!x && (x.dates || 0) >= 2 && !x.aff; },
            fx: function (st, c, d) { var x = cnd(st, d); if (ch(0.4 + (x.v - 60) / 50 + (x.night ? 0.08 : 0))) { var t = together(st, x); return endI(d, fn(x) + ' grinst: „Ich dachte schon, du fragst nie.“ ' + t, { well: 5, stress: L.life(st).partner ? 3 : -1 }); }
              x.v = clamp(x.v - 4, 0, 100); return endI(d, fn(x) + ' zögert: „Ich mag dich – aber lass uns nichts überstürzen.“', { conf: -1 }); } },
          { l: 'Kontakt einschlafen lassen', fx: function (st, c, d) { var x = cnd(st, d); cOut(st, x, 'Der Kontakt zu ' + x.name + ' ist eingeschlafen.'); return endI(d, 'Du antwortest nicht mehr. Irgendwann schreibt ' + fn(x) + ' auch nicht mehr.', {}); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'cand_ping', cat: 'familie', ic: '📱', scene: 'date', title: function (c, d) { var x = cnd(c.st, d); return fn(x) + ' meldet sich'; }, max: 2, imp: 1,
    init: function (st, c, d, s) { if (cnd(st, d).gone) s.done = true; },
    who: function (c, d) { var x = cnd(c.st, d); return { n: x ? x.name : '?', role: x ? (L.STAGES[x.stage] || 'Bekanntschaft') : '', ic: '📱', kind: 'partner', look: x ? x.look : null }; },
    nodes: {
      start: { say: function (c, d) { var x = cnd(c.st, d), f = fn(x);
          return { party: f + ': „Samstag feiere ich Geburtstag – kommst du? Meine Freunde wollen dich unbedingt kennenlernen.“',
            tickets: f + ': „Mein Bruder ist riesiger Fan von euch … meinst du, du könntest zwei Karten besorgen?“',
            clarity: f + ': „Wir treffen uns jetzt schon eine Weile. Ich muss wissen, woran ich bei dir bin.“',
            jealous: f + ': „Ich hab dich neulich mit einer anderen gesehen. Was läuft da?“',
            miss: f + ': „Hey, du meldest dich gar nicht mehr. Alles okay?“' }[d.k] || ''; },
        opts: function (c, d) { var k = d.k;
          if (k === 'party') return [{ l: 'Hingehen', fx: function (st, c2, d2) { var x = cnd(st, d2); x.v = clamp(x.v + 7, 0, 100); return endI(d2, 'Ein großartiger Abend – ' + fn(x) + 's Freunde mögen dich.', { well: 3, stress: -1, fit: -1 }); } },
            { l: 'Absagen – Spiel am Wochenende', fx: function (st, c2, d2) { var x = cnd(st, d2); x.v = clamp(x.v - 4, 0, 100); return endI(d2, '„Schade. Dann eben ein anderes Mal.“', { disc: 1 }); } }];
          if (k === 'tickets') return [{ l: 'Karten besorgen (' + money(120) + ')', fx: function (st, c2, d2) { var x = cnd(st, d2); if (R.pf) R.pf.book(st, -120, 'Freizeit & Privatleben'); x.v = clamp(x.v + 6, 0, 100); return endI(d2, 'Ihr Bruder schickt ein Selfie aus dem Stadion. ' + fn(x) + ' ist gerührt.', { well: 1 }); } },
            { l: 'Leider nicht möglich', fx: function (st, c2, d2) { var x = cnd(st, d2); x.v = clamp(x.v - 2, 0, 100); return endI(d2, '„Okay, kein Problem.“ Klingt ein bisschen enttäuscht.', {}); } }];
          if (k === 'clarity') return [{ l: 'Eine feste Beziehung', fx: function (st, c2, d2) { var x = cnd(st, d2); var t = together(st, x); return endI(d2, fn(x) + ' fällt dir um den Hals. ' + t, { well: 5 }); } },
            { l: 'Lieber locker bleiben', fx: function (st, c2, d2) { var x = cnd(st, d2); x.v = clamp(x.v - 8, 0, 100); if (ch(0.35)) { cOut(st, x, x.name + ' wollte mehr – du nicht. Es ist vorbei.'); return endI(d2, '„Dann ist das nichts für mich.“ ' + fn(x) + ' zieht einen Schlussstrich.', { stress: 2 }, 'farewell'); } return endI(d2, '„Okay … ich überleg es mir.“', { stress: 1 }); } },
            { l: 'Ehrlich sein und es beenden', fx: function (st, c2, d2) { var x = cnd(st, d2); cOut(st, x, 'Du hast die Sache mit ' + x.name + ' beendet.'); return endI(d2, 'Es tut kurz weh, aber es ist ehrlich.', { stress: -1 }, 'farewell'); } }];
          if (k === 'jealous') return [{ l: 'Erklären: „Nur eine Bekannte.“', fx: function (st, c2, d2) { var x = cnd(st, d2); if (ch(0.55)) { x.v = clamp(x.v - 3, 0, 100); return endI(d2, fn(x) + ' glaubt dir – halbwegs.', { stress: 1 }); } x.v = clamp(x.v - 10, 0, 100); return endI(d2, '„Klar. Nur eine Bekannte.“ Die Stimmung ist im Keller.', { stress: 3 }); } },
            { l: 'Offen sagen, dass du noch andere datest', fx: function (st, c2, d2) { var x = cnd(st, d2); if (ch(0.5)) { cOut(st, x, x.name + ' will nicht eine von mehreren sein.'); return endI(d2, '„Dann ohne mich.“', { stress: 2 }, 'farewell'); } x.v = clamp(x.v - 4, 0, 100); return endI(d2, '„Wenigstens bist du ehrlich. Aber streng dich an.“', {}); } }];
          return [{ l: 'Treffen ausmachen', fx: function (st, c2, d2) { var x = cnd(st, d2); x.v = clamp(x.v + 4, 0, 100); return endI(d2, 'Ihr verabredet euch für nächste Woche.', { well: 1 }); } },
            { l: 'Ehrlich sagen, dass es nicht passt', fx: function (st, c2, d2) { var x = cnd(st, d2); cOut(st, x, 'Du hast den Kontakt zu ' + x.name + ' beendet.'); return endI(d2, '„Schade. Mach’s gut.“', {}, 'farewell'); } }]; } }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);
  A.candWeekly = function (st) {
    var lf = L.life(st), p = C.player(st); if (!lf || !p || st.pc.retired || L.active(st)) return;
    var t = tick(st), pool = lf.cands.filter(function (x) { return x.stage >= 1 && !x.aff; }); if (!pool.length || !ch(Math.min(0.25, 0.08 * pool.length))) return;
    var x = pool[Math.floor(R.rand() * pool.length)], ks = ['party', 'tickets', 'miss'];
    if ((x.dates || 0) >= 3) ks.push('clarity', 'clarity');
    if (pool.length >= 2 || A.flingOpen(st).length) ks.push('jealous');
    if (t - (x.lastD || x.t || t) <= 2) ks = ks.filter(function (k) { return k !== 'miss'; });
    L.start(st, 'cand_ping', { cid: x.id, k: ks[Math.floor(R.rand() * ks.length)] });
  };
  C.on.weekly.push(A.candWeekly);

  // Alte Schulfreundin meldet sich – kann Freundschaft, Beziehung oder Affäre werden
  A.schoolWhere = ['Beim Klassentreffen in ', 'Bei einem Heimatbesuch in ', 'Nach Jahren schreibt dir eine alte Schulfreundin aus '];
  A.schoolStart = function (st, how) {
    var lf = L.life(st), home = ((st.pc.cx || {}).prof || {}).home || 'der Heimat', n = L.name('a');
    lf.schoolT = tick(st); L.ensure(st).dlg = null;
    L.start(st, 'school_friend', { name: n, where: how != null ? how : R.randInt(0, 2), home: home }); return n;
  };
  A.schoolWeekly = function (st) {
    var lf = L.life(st), p = C.player(st); if (!lf || !p || st.pc.retired || L.active(st)) return;
    if (p.age < 20 || p.age > 36 || (lf.schoolT != null && tick(st) - lf.schoolT < 90)) return;
    if (ch(0.006)) A.schoolStart(st);
  };
  C.on.weekly.push(A.schoolWeekly);
  L.addDlg([{
    id: 'school_friend', cat: 'familie', ic: '🎒', scene: 'date', title: 'Eine alte Schulfreundin', max: 3, imp: 1,
    who: function (c, d) { return { n: d.name, role: 'Schulfreundin aus ' + d.home, ic: '🎒', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner, w = A.schoolWhere[d.where] || A.schoolWhere[0];
        return w + d.home + (d.where === 2 ? ': ' + d.name + '. „Ich sehe dich ständig im Fernsehen – erinnerst du dich noch an mich?“' : ' triffst du ' + d.name + ' wieder – ihr saßt früher nebeneinander.') + ' Ihr redet stundenlang über alte Zeiten, und es fühlt sich an, als wäre kaum Zeit vergangen.' + (p ? ' ' + fn(p) + ' kennt sie nicht.' : ''); },
        opts: [
          { l: 'Wiedersehen – mal schauen, was daraus wird', hint: function (c) { return L.life(c.st).partner ? 'Heimlicher Kontakt neben der Beziehung' : 'Kann eine Beziehung werden'; }, fx: function (st, c, d) {
            var x = L.newCand(st); x.name = d.name; x.g = 'a'; x.stage = 1; x.v = 66; x.job = x.job || 'Bekannte'; x.school = 1; x.note = 'Alte Schulfreundin aus ' + d.home + '.';
            if (L.life(st).partner) P.partner(st).neg += 1;
            X.chron(st, 'familie', '🎒', 'Alte Schulfreundin', 'Wiedersehen mit ' + d.name + ' aus ' + d.home + '.', 1, 'date');
            return endI(d, 'Ihr verabredet euch für nächste Woche. Auf dem Heimweg grinst du vor dich hin.', { well: 3 }); } },
          { l: 'Es knistert wie früher – mit zu ihr', hint: 'Affäre: Spaß, aber Stress, Frische − und Entdeckungsrisiko', fx: function (st, c, d) { var pt = L.life(st).partner, f = A.flingAdd(st, d.name); f.school = 1; if (pt) P.partner(st).neg += 2;
            X.chron(st, 'familie', '🎒', 'Affäre', 'Eine Nacht mit ' + d.name + ', der alten Schulfreundin' + (pt ? ' – ' + fn(pt) + ' darf davon nichts erfahren.' : '.'), 1, 'date');
            return endI(d, 'Was früher nie passiert ist, passiert jetzt. ' + fn(d) + ' schreibt am Morgen: „Das hätten wir schon vor zehn Jahren tun sollen.“', { well: 4, stress: pt ? 3 : 1, fit: -3 }); } },
          { l: 'Gute Freunde bleiben', fx: function (st, c, d) { var lf = L.life(st); if (lf.friends.length < 8) lf.friends.push({ id: 'fr' + (lf.uid++), name: d.name, kind: 'heimat', v: 64, since: st.season, last: tick(st), note: 'Alte Schulfreundin aus ' + d.home + '.' });
            return endI(d, 'Ihr bleibt in Kontakt – eine Freundin aus alten Zeiten tut gut.', { well: 2, stress: -1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);

  // Ausgehen ist jederzeit möglich – auch in einer Beziehung (dann mit Flirt- und Affärenrisiko)
  A.goOut = function (st) {
    var r = L.spend(st, 1, 60); if (!r.ok) return r;
    var lf = L.life(st), cx = st.pc.cx, pt = lf.partner;
    if (pt) { lf.affOut = tick(st); P.partner(st).neg += 0.5; }
    var lfs = L.life(st); if ((lfs.schoolT == null || tick(st) - lfs.schoolT > 60) && cx.prof && ch(0.1)) { A.schoolStart(st, 0); return { ok: true, dlg: true }; }
    var fo = A.flingOpen(st); if (fo.length && ch(0.35)) { L.ensure(st).dlg = null; L.start(st, 'fling_again', { name: fo[Math.floor(R.rand() * fo.length)].name }); return { ok: true, dlg: true }; }
    if (ch(0.4 + (cx.per.conf - 50) / 300)) { L.ensure(st).dlg = null; L.start(st, 'fling_night', { name: L.name('a') }); return { ok: true, dlg: true }; }
    if (ch(0.45 + (cx.per.conf - 50) / 200 - (pt ? 0.1 : 0))) { var x = L.newCand(st); L.ensure(st).dlg = null; L.start(st, 'meet', { cid: x.id, where: pt ? 'Beim Ausgehen ohne ' + fn(pt) : 'Beim Ausgehen mit Freunden' }); return { ok: true, dlg: true }; }
    L.eff(st, { well: 2, stress: -1 }); if (lf.friends[0]) lf.friends[0].v = Math.min(100, lf.friends[0].v + 3);
    return { ok: true, txt: 'Ein netter Abend mit Freunden – heute ohne neue Bekanntschaft. Wohlbefinden +2, Stress −1' };
  };

  // ---------- Spontane Anfragen (Instagram, Dating-App) und Zufallstreffen – im Alltag und auf Auswärtsfahrten ----------
  var SPOTS = ['Im Supermarkt an der Kasse', 'Beim Bäcker am Sonntagmorgen', 'Im Fitnessstudio', 'Im Wartezimmer beim Arzt', 'Auf einer Vernissage', 'Beim Joggen im Park', 'Im Café um die Ecke', 'Auf der Hochzeit von Freunden', 'Im Zug nach Hause', 'Auf einem Konzert', 'Im Waschsalon, weil die Maschine streikt', 'Beim Italiener, als der Tisch doppelt vergeben ist'];
  var AWAY = { bar: 'Am Abend vor dem Spiel in der Hotelbar in {city}', lobby: 'In der Lobby des Mannschaftshotels in {city}', fruehst: 'Beim Frühstück im Mannschaftshotel in {city}', flug: 'Auf dem Flug nach {city} sitzt du am Gang – neben dir', zug: 'Auf der Zugfahrt nach {city} im Speisewagen', rast: 'Beim Halt an der Raststätte auf der Fahrt nach {city}' };
  var CURFEW = { bar: 1, lobby: 1 };
  var DM_INSTA = ['Starkes Spiel am Wochenende! Darf ich dich mal auf einen Kaffee einladen? ☕', 'Ich glaube, wir haben gemeinsame Freunde … Lust, mal was trinken zu gehen?', 'Sorry für die direkte Nachricht – aber dein Lächeln beim Interview war ansteckend 😊', 'Ich bin neu in der Stadt und kenne kaum jemanden. Zeigst du mir dein Lieblingscafé?', 'Hab dich letzte Woche im Park gesehen und mich nicht getraut, Hallo zu sagen. Also jetzt: Hallo! 👋'];
  var DM_APP = ['Hey! Dein Profil hat mich neugierig gemacht. Bist du das wirklich? 😄', 'Endlich mal jemand, der früh aufsteht. Sonntag Frühstück?', 'Ich mag deine Bilder vom Wandern. Wohin geht die nächste Tour?', 'Ich gebe zu: Ich hab dich erkannt. Aber ich frage trotzdem ganz normal – Lust auf ein Date?'];
  function sCand(st, d) { var lf = L.life(st); return lf ? lf.cands.filter(function (x) { return x.id === d.cid; })[0] || null : null; }
  function drop(st, d) { var lf = L.life(st); lf.cands = lf.cands.filter(function (y) { return y.id !== d.cid; }); }
  function pickA(a) { return a[Math.floor(R.rand() * a.length)]; }
  // Herkunft einer Bekanntschaft für die Kontaktlisten
  L.srcTag = function (x) { var t = { insta: '📸 Instagram', app: '💘 Dating-App', away: '🧳 Auswärtsfahrt', zufall: '🍀 Zufall' }[x && x.src]; return t ? ' · ' + t : ''; };
  A.awayGame = function (st) { // Auswärtsspiel des eigenen Vereins in dieser Woche → Stadt
    var p = C.player(st); if (!p || !p.clubId) return null;
    var r = (st.lastResults || []).filter(function (x) { return x.a === p.clubId && x.comp !== 'friendly'; })[0]; if (!r) return null;
    var h = st.clubs[r.h] || (R.euro && R.euro.info ? R.euro.info(st, r.h) : null);
    return { city: (h && (h.city || h.short || h.name)) || 'der Auswärtsstadt', euro: r.comp === 'euro' };
  };
  // Wurf ohne den Zufallsgenerator des Spiels zu verbrauchen (sonst verschiebt sich jede spätere Zufallsentscheidung)
  function hroll(st, k) { var str = (st.seed || 0) + ':' + k + ':' + tick(st) + ':' + (st.season || 0), h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return (h % 100000) / 100000; }
  A.spontWeekly = function (st) {
    var lf = L.life(st), pc = st.pc, p = C.player(st); if (!lf || !p || pc.retired || p.age < 17 || L.active(st)) return;
    var t = tick(st); if (lf.spT != null && t - lf.spT < 3) return; // höchstens alle drei Wochen eine spontane Begegnung
    var pt = lf.partner, fame = pc.fame || 0, away = A.awayGame(st), x;
    if (away && hroll(st, 'away') < (pt ? 0.07 : 0.14)) {
      var keys = Object.keys(AWAY).filter(function (k) { return away.euro || k !== 'flug' || ch(0.4); }), k = pickA(keys);
      x = L.newCand(st); x.src = 'away'; x.note = 'Kennengelernt auf der Auswärtsfahrt nach ' + away.city + '.';
      L.start(st, 'sp_away', { cid: x.id, spot: k, city: away.city });
    } else if (hroll(st, 'dm') < (pt ? 0.035 : 0.07) + fame / 1200) {
      var app = !pt && ch(0.5);
      x = L.newCand(st); x.src = app ? 'app' : 'insta'; x.note = app ? 'Match in der Dating-App.' : 'Hat dir auf Instagram geschrieben.';
      var fake = ch(0.1 + fame / 900) ? pickA(['fan', 'presse', 'fake']) : '';
      L.start(st, 'sp_dm', { cid: x.id, src: x.src, msg: pickA(app ? DM_APP : DM_INSTA), fake: fake });
    } else if (hroll(st, 'zufall') < (pt ? 0.02 : 0.045)) {
      x = L.newCand(st); x.src = 'zufall'; L.start(st, 'meet', { cid: x.id, where: pickA(SPOTS) });
    } else return;
    lf.spT = t;
  };
  C.on.weekly.push(A.spontWeekly);
  L.addDlg([{
    id: 'sp_dm', cat: 'familie', init: function (st, c, d, s) { if (!sCand(st, d)) s.done = true; }, ic: '📱', scene: 'date', max: 3, imp: 1,
    title: function (c, d) { return d.src === 'app' ? 'Neues Match in der Dating-App' : 'Nachricht auf Instagram'; },
    who: function (c, d) { var x = sCand(c.st, d); return { n: x ? x.name : '?', role: (d.src === 'app' ? 'Match · ' : 'Instagram · ') + (x ? x.job : ''), ic: '📱', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var x = sCand(c.st, d), pt = L.life(c.st).partner; if (!x) return 'Die Nachricht ist verschwunden.';
          return (d.src === 'app' ? 'Die Dating-App meldet ein Match: ' + x.name + ' (' + x.job + '), mag ' + x.intr.join(' und ') + '. Die erste Nachricht: „' + d.msg + '“'
            : 'Eine Direktnachricht auf Instagram von ' + x.name + ' (' + x.job + ', mag ' + x.intr.join(' und ') + '): „' + d.msg + '“') + (pt ? ' ' + fn(pt) + ' sitzt neben dir auf dem Sofa.' : ''); },
        opts: [
          { l: 'Zurückschreiben und ein Treffen vorschlagen', hint: function (c) { return L.life(c.st).partner ? 'Heimlicher Kontakt neben der Beziehung – Entdeckungsrisiko' : ''; }, fx: function (st, c, d) {
            var x = sCand(st, d), lf = L.life(st), pt = lf.partner; if (!x) return endI(d, 'Die Nachricht ist verschwunden.');
            if (d.fake) { drop(st, d);
              if (d.fake === 'presse') { if (pt) { P.partner(st).neg += 2; lf.suspect = tick(st) + 6; } return endI(d, 'Beim Treffen sitzt dir ein Reporter gegenüber – das Profil war ein Köder. Am nächsten Tag steht „Was macht der Profi beim Blind Date?“ online.', { media: -4, stress: 3, conf: -1 }); }
              if (d.fake === 'fan') return endI(d, 'Am Treffpunkt wartet ein Fan mit Trikot und Edding. Kein Date – aber ein freundliches Selfie.', { well: 1 });
              return endI(d, 'Niemand kommt. Kurz darauf ist das Profil gelöscht – ein Fake-Account. Du kommst dir ziemlich blöd vor.', { conf: -2 }); }
            if (ch(clamp(0.45 + c.cx.per.conf / 250 + (x.v - 50) / 80, 0.1, 0.9))) { x.stage = 1; x.v = Math.max(x.v, 58); if (pt) { P.partner(st).neg += 1; lf.affOut = tick(st); }
              return endI(d, fn(x) + ' antwortet sofort: „Sehr gern! Wann hast du Zeit?“' + (pt ? ' Du legst das Handy mit dem Display nach unten.' : ''), { well: 2, conf: 1 }); }
            x.v -= 6; return endI(d, fn(x) + ' antwortet erst nach Tagen: „Mal schauen … ich melde mich.“', { conf: -1 }); } },
          { l: 'Locker hin und her schreiben', hint: function (c) { return L.life(c.st).partner ? 'Kann zum heimlichen Kontakt werden – Entdeckungsrisiko' : 'Neue Bekanntschaft'; }, fx: function (st, c, d) { var x = sCand(st, d); if (!x) return endI(d, '');
            if (d.fake) { drop(st, d); return endI(d, 'Nach ein paar Nachrichten wird es merkwürdig – das Profil fragt nach Interna aus der Kabine. Du blockierst es.', { conf: -1 }); }
            x.v = clamp(x.v + 5, 0, 100); if (x.v >= 55) x.stage = 1; return endI(d, 'Ihr schreibt ein paar Abende lang hin und her. ' + (x.stage ? fn(x) + ' fragt, ob ihr euch mal seht.' : 'Mal sehen, was daraus wird.'), { well: 1 }); } },
          { l: function (c) { return L.life(c.st).partner ? 'Freundlich antworten: „Ich bin vergeben.“' : 'Nicht reagieren'; }, fx: function (st, c, d) { var pp = P.partner(st); drop(st, d); if (pp) pp.v = Math.min(100, pp.v + 1); return endI(d, pp ? 'Kurz und klar. ' + fn(pp) + ' bekommt davon nichts mit – und das ist gut so.' : 'Du wischst die Nachricht weg.', {}); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    id: 'sp_away', cat: 'familie', init: function (st, c, d, s) { if (!sCand(st, d)) s.done = true; }, ic: '🧳', scene: 'date', max: 3, imp: 1,
    title: function (c, d) { return 'Begegnung auf der Auswärtsfahrt'; },
    who: function (c, d) { var x = sCand(c.st, d); return { n: x ? x.name : '?', role: x ? x.job : '', ic: '🧳', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var x = sCand(c.st, d), pt = L.life(c.st).partner; if (!x) return '';
          return (AWAY[d.spot] || 'Auf der Auswärtsfahrt nach {city}').replace('{city}', d.city) + ' kommst du mit ' + x.name + ' (' + x.job + ') ins Gespräch. ' + (x.sport >= 55 ? fn(x) + ' erkennt dich sofort.' : fn(x) + ' hat keine Ahnung, wer du bist.') +
            (CURFEW[d.spot] ? ' Der Trainer hat Zapfenstreich um 23 Uhr angesetzt, es ist kurz vor elf.' : '') + (pt ? ' Zu Hause wartet ' + fn(pt) + '.' : ''); },
        opts: function (c, d) {
          var o = [{ l: 'Nummern tauschen', hint: function (c) { return L.life(c.st).partner ? 'Kann zum heimlichen Kontakt werden – Entdeckungsrisiko' : 'Neue Bekanntschaft'; }, fx: function (st, c2, d2) { var x = sCand(st, d2); if (!x) return endI(d2, ''); x.stage = 1; x.v = Math.max(x.v, 56); x.where = 'Auswärtsfahrt'; if (L.life(st).partner) P.partner(st).neg += 0.5; return endI(d2, fn(x) + ' tippt die Nummer in dein Handy: „Melde dich, wenn du wieder in der Stadt bist.“', { well: 2 }); } }];
          if (CURFEW[d.spot]) {
            o.push({ l: 'Noch einen Drink – Zapfenstreich hin oder her', hint: 'Ärger mit dem Trainer möglich', fx: function (st, c2, d2) { var x = sCand(st, d2); if (!x) return endI(d2, ''); x.stage = 1; x.v = clamp(x.v + 8, 0, 100); if (L.life(st).partner) P.partner(st).neg += 1;
              if (ch(0.35)) return endI(d2, 'Um halb eins steht der Co-Trainer an der Bar. Am nächsten Morgen gibt es eine Ansage vor der ganzen Mannschaft.', { coach: -4, disc: -2, stress: 2, fit: -2 });
              return endI(d2, 'Ihr redet bis nach Mitternacht. Niemand hat es gemerkt – nur der Wecker ist gnadenlos.', { well: 3, fit: -2 }); } });
            o.push({ l: 'Mit aufs Zimmer nehmen', hint: 'Affäre – Entdeckungs- und Trainerrisiko', fx: function (st, c2, d2) { var x = sCand(st, d2), pt = L.life(st).partner; if (!x) return endI(d2, ''); A.flingAdd(st, x.name); drop(st, d2); if (pt) P.partner(st).neg += 2;
              X.chron(st, 'familie', '🏨', 'Affäre im Hotel', 'Eine Nacht mit ' + x.name + ' in ' + d2.city + (pt ? ' – ' + fn(pt) + ' darf davon nichts erfahren.' : '.'), 1, 'date');
              if (ch(0.25)) return endI(d2, 'Auf dem Flur läuft dir der Mannschaftskapitän über den Weg. Er sagt nichts – aber der Trainer erfährt es trotzdem.', { coach: -5, mates: -2, stress: 4, fit: -3 });
              return endI(d2, 'Am Morgen ist ' + fn(x) + ' schon weg, nur ein Zettel mit Herz liegt da. Beim Abschlusstraining fehlen dir ein paar Prozent.', { well: 3, stress: pt ? 3 : 1, fit: -3 }); } });
          } else o.push({ l: 'Die ganze Fahrt über quatschen', hint: function (c) { return L.life(c.st).partner ? 'Kann zum heimlichen Kontakt werden – Entdeckungsrisiko' : 'Neue Bekanntschaft'; }, fx: function (st, c2, d2) { var x = sCand(st, d2); if (!x) return endI(d2, ''); x.stage = 1; x.v = clamp(x.v + 10, 0, 100); if (L.life(st).partner) P.partner(st).neg += 1; return endI(d2, 'Die Fahrt vergeht wie im Flug. Beim Aussteigen fragt ' + fn(x) + ': „Sehen wir uns wieder?“', { well: 3 }); } });
          o.push({ l: 'Höflich bleiben – Fokus auf das Spiel', fx: function (st, c2, d2) { drop(st, d2); var pp = P.partner(st); if (pp) pp.v = Math.min(100, pp.v + 1); return endI(d2, 'Du verabschiedest dich und gehst früh schlafen. Der Kopf ist frei fürs Spiel.', { disc: 1, fit: 1 }); } });
          return o; } }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);

  // ---------- Dating-App selbst öffnen (einmal pro Woche) – und was passiert, wenn die Partnerperson das Profil entdeckt ----------
  // lf.app = { on, t (zuletzt benutzt), n (Nutzungen), single (Profil stammt aus der Single-Zeit), m (Matches) }
  A.appFree = function (st) { var lf = L.life(st); return !!lf && (lf.appT == null || tick(st) - lf.appT >= 1); };
  A.appOn = function (st) { var lf = L.life(st); return lf && lf.app && lf.app.on ? lf.app : null; };
  A.appDel = function (st) { var lf = L.life(st); if (lf && lf.app) lf.app.on = false; };
  A.appRisk = function (st) { // Wahrscheinlichkeit pro Woche, dass die Partnerperson das Profil findet
    var lf = L.life(st), a = A.appOn(st), pt = lf && lf.partner; if (!a || !pt) return 0;
    var t = tick(st), fresh = t - (a.t || 0);
    var r = (a.single && !a.pt ? 0.025 : 0.05) + Math.min(5, a.n || 1) * 0.01 + Math.min(3, a.m || 0) * 0.015 + (st.pc.fame || 0) / 2500 +
      (pt.stage >= 4 && !pt.ld ? 0.03 : 0) + (lf.suspect && lf.suspect > t ? 0.05 : 0) + (lf.phoneOpen && lf.phoneOpen > t ? 0.15 : 0) + (fresh <= 2 ? 0.02 : 0);
    if (fresh > 12) r *= 0.5;
    return clamp(r, 0, 0.4);
  };
  A.appRiskTxt = function (st) { var r = A.appRisk(st); return r >= 0.12 ? 'hoch' : r >= 0.06 ? 'mittel' : r > 0 ? 'gering' : '–'; };
  // Offene Handys verraten auch heimliche Beziehungen schneller
  var baseRisk = A.risk;
  A.risk = function (st) { var lf = L.life(st), r = baseRisk(st); return r && lf.phoneOpen && lf.phoneOpen > tick(st) ? clamp(r + 0.08, 0, 0.5) : r; };
  function addCand(st, x) {
    var lf = L.life(st); if (lf.cands.indexOf(x) < 0) lf.cands.push(x);
    while (lf.cands.length > 5) {
      var drp = lf.cands.filter(function (y) { return !y.stage && !y.aff && y !== x; })[0] || lf.cands.filter(function (y) { return y.stage === 1 && !y.aff && y !== x; }).sort(function (a, b) { return a.v - b.v; })[0];
      if (!drp) break; lf.cands.splice(lf.cands.indexOf(drp), 1);
    }
    return x;
  }
  A.openApp = function (st) {
    var lf = L.life(st), p = C.player(st); if (!lf || !p) return { ok: false, why: 'Gerade nicht möglich.' };
    if (p.age < 18) return { ok: false, why: 'Dating-Apps gibt es erst ab 18.' };
    var cur = L.active(st); if (cur && !cur.done) return { ok: false, why: 'Erst das laufende Gespräch beenden.' };
    if (!A.appFree(st)) return { ok: false, why: 'Diese Woche hast du schon geswipt. Nächste Woche gibt es neue Profile.' };
    lf.appT = tick(st);
    var keep = lf.cands.slice(), prof = [];
    for (var i = 0; i < 3; i++) { var x = L.newCand(st); x.src = 'app'; x.where = 'Dating-App'; x.note = 'Match in der Dating-App.'; prof.push(x); }
    lf.cands = keep; // die Profile sind erst nach einem Match echte Kontakte
    L.ensure(st).dlg = null; L.start(st, 'app_swipe', { prof: prof });
    return { ok: true, dlg: true };
  };
  function used(st, m) { // Nutzung merken; in einer Beziehung mit Sofort-Risiko (Benachrichtigung, während die Partnerperson daneben sitzt)
    var lf = L.life(st), pt = lf.partner, t = tick(st), a = lf.app && lf.app.on ? lf.app : (lf.app = { on: true, n: 0, m: 0, single: !pt, t0: t });
    a.t = t; a.n = (a.n || 0) + 1; a.m = (a.m || 0) + (m || 0); if (pt) { a.pt = 1; a.single = false; lf.suspect = Math.max(lf.suspect || 0, t + 4); }
    if (pt && hroll(st, 'appnow' + a.n) < 0.06 + (st.pc.fame || 0) / 1500 + (pt.stage >= 4 && !pt.ld ? 0.04 : 0)) L.start(st, 'app_found', { how: 'notif' });
  }
  function appProf(d) { return (d.prof || []).filter(function (x) { return !x.gone; }); }
  function matchChance(st, c, x, f) { return clamp(0.32 + c.cx.per.conf / 300 + (x.v - 50) / 70 + (st.pc.fame || 0) / 400, 0.1, 0.85) * (f || 1); }
  function matched(st, x) { x.stage = 1; x.v = Math.max(x.v, 56); x.t = tick(st); addCand(st, x); if (L.life(st).partner) P.partner(st).neg += 1; }
  L.addDlg([{
    id: 'app_swipe', cat: 'familie', ic: '💘', scene: 'date', title: 'Dating-App', max: 2, imp: 1, chron: false,
    who: function (c) { var pt = L.life(c.st).partner; return { n: 'Dating-App', role: pt ? 'Profil unter anderem Namen' : 'Dein Profil', ic: '💘', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var pt = L.life(c.st).partner, a = A.appOn(c.st);
          return (pt ? (a && a.pt ? 'Dein geheimes Profil unter anderem Namen ist noch online – ' : a ? 'Dein altes Profil aus der Single-Zeit ist noch online – ' : 'Du legst dir heimlich ein Profil unter anderem Namen an – ') + fn(pt) + ' darf davon nichts wissen. ' : '') +
            'Drei Profile in deiner Nähe: ' + appProf(d).map(function (x) { return x.name + ' (' + x.job + ', mag ' + x.intr.join(' und ') + ')'; }).join(' · ') + '.'; },
        opts: function (c, d) {
          var pt = L.life(c.st).partner, hint = pt ? 'Heimlich – Entdeckungsrisiko' : '';
          var o = appProf(d).map(function (x) {
            return { l: '💘 ' + fn(x) + ' liken', hint: hint, fx: function (st, c2, d2) { var y = appProf(d2).filter(function (z) { return z.id === x.id; })[0] || x;
              if (ch(matchChance(st, c2, y))) { matched(st, y); used(st, 1); return endI(d2, 'Match! ' + fn(y) + ' schreibt: „Hey! Dein Profil hat mich neugierig gemacht. Kaffee diese Woche?“' + (pt ? ' Du stellst das Handy schnell auf lautlos.' : ''), pt ? { stress: 2, well: 1 } : { well: 2, conf: 1 }); }
              used(st, 0); return endI(d2, 'Kein Match – ' + fn(y) + ' hat weitergewischt.', { conf: -1 }); } };
          });
          o.push({ l: 'Allen dreien ein Like geben', hint: pt ? 'Heimlich – Entdeckungsrisiko' : 'Weniger Chancen je Person', fx: function (st, c2, d2) {
            var hit = appProf(d2).filter(function (y) { return ch(matchChance(st, c2, y, 0.6)); }); hit.forEach(function (y) { matched(st, y); }); used(st, hit.length);
            return endI(d2, hit.length ? 'Match mit ' + hit.map(fn).join(' und ') + '! Jetzt heißt es: Nachrichten beantworten.' : 'Kein einziges Match. Vielleicht wirkt das Profil zu sehr nach Mannschaftsfoto.', hit.length ? { well: 1 } : { conf: -1 }); } });
          if (pt && A.appOn(c.st)) o.push({ l: 'Profil löschen und die App deinstallieren', fx: function (st, c2, d2) { A.appDel(st); return endI(d2, 'Weg damit. Das Risiko ist kleiner – ganz verschwunden ist es nicht, solange es Screenshots gibt.', { stress: -1 }); } });
          o.push({ l: 'App wieder schließen', fx: function (st, c2, d2) { return endI(d2, 'Du legst das Handy weg.', {}); } });
          return o; } }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }, {
    // Eskalation: Die Partnerperson entdeckt das Dating-Profil (Benachrichtigung, Freundin, Handy, Presse)
    id: 'app_found', cat: 'familie', ic: '💥', chron: true, imp: 3, max: 4, title: 'Das Dating-Profil',
    init: function (st, c, d, s) { var lf = L.life(st); if (!lf.partner) { s.done = true; return; } var a = lf.app || {}; d.single = a.single && !a.pt ? 1 : 0; d.k = lf.appCaught || 0; d.m = a.m || 0;
      var mt = lf.cands.filter(function (x) { return x.src === 'app' && x.stage >= 1; })[0]; d.mn = mt ? mt.name : ''; lf.appCaught = d.k + 1;
      if (d.how === 'press') { var pl = C.player(st), nm = pl ? R.world.playerName(pl) : 'Profi', t = tick(st); lf.scandal = { t: t, until: t + 5, press: true };
        X.eff(st, { stress: 10, media: -8, pop: -5, coach: -2 }); L.eff(st, { f_fam: -6, sponsor: -4 }); if (pl) pl.morale = clamp(pl.morale - 10, 0, 100);
        if (S && S.news) S.news(st, 'Boulevard: Geheimes Dating-Profil von ' + nm, 'Der Profi ist vergeben – und trotzdem in einer Dating-App unterwegs. Die Klatschpresse hat Screenshots.', 'medien');
        if (L.remember) L.remember(st, 'scandal', 'Geheimes Dating-Profil in der Boulevardpresse', 'Boulevard'); }
      else X.eff(st, { stress: 6 });
      X.chron(st, 'familie', '💘', 'Dating-Profil entdeckt', fn(lf.partner) + ' hat dein Profil in der Dating-App gefunden' + (d.how === 'press' ? ' – über die Boulevardpresse.' : '.'), 2, 'date'); },
    scene: function (c, d) { return 'pt_' + (d.img || 'conflict'); },
    who: function (c) { var p = L.life(c.st).partner; return { n: p ? p.name : '?', role: p ? L.STAGES[p.stage] : '', ic: '💔', kind: 'partner', look: p ? p.look : null }; },
    nodes: {
      start: { say: function (c, d) { var p = L.life(c.st).partner, n = fn(p), wed = p && p.stage >= 6;
          var t = { notif: 'Dein Handy liegt auf dem Tisch, als der Bildschirm aufleuchtet: „💘 Neues Match!“ ' + n + ' hat es gesehen. Ganz leise: „Was. Ist. Das.“',
            friend: n + ' kommt nach Hause und hält dir das Handy vors Gesicht – ein Screenshot. „Meine Freundin hat dich in der Dating-App gefunden. Unter falschem Namen. Erklär mir das.“',
            phone: n + ' sucht auf deinem Handy ein Urlaubsfoto – und findet die Dating-App. Dein Profil, ' + (d.m ? d.m + (d.m === 1 ? ' Match' : ' Matches') : 'Likes') + ', offene Chats. „Ernsthaft?!“',
            press: 'Die Schlagzeile ist überall: „Vergeben – und trotzdem auf der Suche? Profi mit geheimem Dating-Profil“. ' + n + ' hat den Artikel gelesen, bevor du überhaupt aufgestanden bist.' }[d.how] || (n + ' hat dein Dating-Profil gefunden.');
          return t + (wed ? ' „Wir sind verheiratet!“' : '') + (d.k ? ' „Und das nicht zum ersten Mal. Du hattest es mir versprochen!“' : ''); },
        opts: [
          { l: 'Ehrlich zugeben und die App vor den Augen löschen', fx: function (st, c, d) { var p = P.partner(st), lf = L.life(st); A.appDel(st);
            var stay = clamp((p.v - 25) / 100 + (p.confl === 'harmonie' ? 0.1 : 0) + (p.stage >= 6 ? 0.08 : 0) - d.k * 0.25 - (d.how === 'press' ? 0.1 : 0) - A.dating(st).length * 0.08 + (d.single ? 0.15 : 0), 0.03, 0.65);
            if (ch(stay)) { p.v = Math.max(10, p.v - (d.single ? 10 : 20)); p.neg += 4; P.mem(st, 'betrayal', 'Vertrauensbruch', 'die Sache mit der Dating-App'); d.img = 'thought'; return { r: 'Du löschst das Profil, während ' + fn(p) + ' zusieht. Lange Stille. Dann: „Gut. Aber so einfach ist das nicht.“', e: { stress: 3 }, next: 'terms' }; }
            L.breakup(st, 'das geheime Dating-Profil'); lf.suspect = 0; return endI(d, '„Löschen? Das ändert nichts daran, dass du gesucht hast.“ ' + fn(p) + ' packt noch am selben Abend die Sachen.', { stress: 8, well: -8 }, 'farewell'); } },
          { l: function (c, d) { return d.single ? 'Erklären: „Das ist mein alter Account von früher!“' : 'Ausrede: „Das war nur aus Neugier, ich schwöre.“'; }, fx: function (st, c, d) { var p = P.partner(st), lf = L.life(st);
            var ok = clamp((d.single ? 0.65 : 0.25) - d.k * 0.2 + (p.v - 50) / 200, 0, 0.8); if (d.how === 'press' && !d.single) ok = 0;
            if (ch(ok)) { A.appDel(st); p.v = Math.max(10, p.v - 6); lf.suspect = tick(st) + 12; return endI(d, fn(p) + ' mustert dich lange. „Dann lösch ihn. Jetzt.“ Du tust es. Das Misstrauen bleibt.', { stress: 4 }, 'thought'); }
            p.v = Math.max(5, p.v - 12); return { r: '„Neugier?“ ' + fn(p) + ' greift nach deinem Handy …', e: { stress: 5 }, next: 'escal' }; } },
          { l: function (c, d) { return d.how === 'friend' ? 'Gegenangriff: „Und was macht deine Freundin in einer Dating-App?!“' : d.how === 'press' ? 'Gegenangriff: „Glaubst du jetzt dem Boulevard mehr als mir?!“' : 'Gegenangriff: „Du schnüffelst in meinem Handy?!“'; },
            hint: 'Eskaliert den Streit', fx: function (st, c, d) { var p = P.partner(st); p.v = Math.max(5, p.v - 15); p.neg += 6;
            if (ch(clamp(0.3 + d.k * 0.3 - (p.stage >= 6 ? 0.1 : 0), 0.1, 0.9))) { L.breakup(st, 'der Streit um das Dating-Profil'); return endI(d, 'Es wird laut. Sehr laut. Irgendwann knallt die Tür – und ' + fn(p) + ' kommt nicht zurück.', { stress: 10, well: -10 }, 'farewell'); }
            return { r: 'Es fliegen Worte, die man nicht zurücknehmen kann. Die Nachbarn klopfen an die Wand.', e: { stress: 8, well: -4 }, next: 'cold' }; } },
          { l: 'Schluss machen – vielleicht ist es besser so', fx: function (st, c, d) { L.breakup(st, 'du hast nach dem Dating-Profil Schluss gemacht'); return endI(d, 'Ehrlicher als alles andere heute Abend. Trotzdem tut es weh.', { stress: 6, well: -5 }, 'farewell'); } }] },
      escal: { say: function (c, d) { var p = L.life(c.st).partner, wed = p && p.stage >= 4;
          return fn(p) + ' scrollt durch deine Chats. ' + (d.mn ? 'Da ist ' + d.mn.split(' ')[0] + ': „Freu mich auf Freitag 😘“. ' : 'Flirts, Herzchen, ein vorgeschlagenes Treffen. ') + '„Nur aus Neugier? Die letzte Nachricht ist von gestern!“ Das Handy fliegt aufs Sofa.' + (wed ? ' „Ich will dich heute nicht in dieser Wohnung haben.“' : ''); },
        opts: [
          { l: 'Um Verzeihung bitten: „Ich lösche alles. Bitte.“', fx: function (st, c, d) { var p = P.partner(st); A.appDel(st); L.life(st).cands.filter(function (x) { return x.src === 'app' && !x.aff; }).forEach(function (x) { A.end(st, x.id); });
            if (ch(clamp((p.v - 20) / 140 - d.k * 0.2 + (p.stage >= 6 ? 0.08 : 0), 0.03, 0.45))) { p.v = Math.max(8, p.v - 15); p.neg += 6; P.mem(st, 'betrayal', 'Vertrauensbruch', 'die Chats aus der Dating-App'); d.img = 'thought'; return { r: 'Tränen, Schweigen, noch mehr Tränen. Gegen Morgen: „Ich bin noch nicht fertig mit dir. Aber wenn, dann gibt es Regeln.“', e: { stress: 5, well: -4 }, next: 'terms' }; }
            L.breakup(st, 'Lügen um das Dating-Profil'); return endI(d, '„Erst lügst du, dann bettelst du.“ ' + fn(p) + ' geht – endgültig.', { stress: 10, well: -10, conf: -3 }, 'farewell'); } },
          { l: 'Weiter abstreiten', hint: 'Fast sicher das Ende', fx: function (st, c, d) { var p = L.life(st).partner, home = p && p.stage >= 4; L.breakup(st, 'dreiste Lügen um das Dating-Profil');
            return endI(d, home ? 'Als du vom Training kommst, stehen deine Sachen in Kartons vor der Tür. Das Schloss ist ausgetauscht.' : fn(p) + ' blockiert deine Nummer. Auf Instagram ist von euch kein Foto mehr übrig.', { stress: 14, well: -12, conf: -4, mates: home ? -1 : 0 }, 'farewell'); } },
          { l: 'Erst einmal raus – bei einem Teamkollegen schlafen', fx: function (st, c, d) { var p = P.partner(st); p.v = Math.max(5, p.v - 8); L.life(st).suspect = tick(st) + 16;
            return endI(d, 'Zwei Nächte auf der Couch eines Mitspielers. In der Kabine wird getuschelt, ' + fn(p) + ' antwortet nur einsilbig. Das Thema ist nicht vorbei.', { stress: 7, well: -6, fit: -2, mates: -1 }, 'thought'); } }] },
      terms: { say: function (c, d) { return '„Wenn wir weitermachen, dann nicht einfach so. Was bist du bereit zu tun?“'; },
        opts: [
          { l: 'Handy offenlegen – keine Geheimnisse mehr', hint: 'Heimliche Kontakte fliegen dann schneller auf', fx: function (st, c, d) { var lf = L.life(st); lf.phoneOpen = tick(st) + 26; lf.suspect = tick(st) + 20; A.appDel(st);
            return endI(d, 'Du gibst ' + fn(lf.partner) + ' deinen Code. Es fühlt sich an wie eine Kontrolle – und wie ein Anfang.', { partner: 6, stress: 2 }, 'reconcile'); } },
          { l: 'Paartherapie vorschlagen (400 €)', req: function (c) { return !R.pf || R.pf.liquid(c.st) >= 400; }, fx: function (st, c, d) { var p = P.partner(st); if (R.pf) R.pf.book(st, -400, 'Freizeit & Privatleben'); P.open(st, 'trust'); L.life(st).suspect = tick(st) + 12;
            return endI(d, '„Okay. Wir versuchen es.“ Die erste Sitzung ist unangenehm ehrlich – aber ihr redet wieder miteinander.', { partner: 10, stress: -2, well: 2 }, 'reconcile'); } },
          { l: '„Ich lasse mich nicht kontrollieren.“', fx: function (st, c, d) { var p = P.partner(st);
            if (ch(0.45 + d.k * 0.2)) { L.breakup(st, 'kein Einsehen nach dem Dating-Profil'); return endI(d, '„Dann gibt es nichts mehr zu besprechen.“ Die Tür fällt ins Schloss.', { stress: 8, well: -8 }, 'farewell'); }
            p.v = Math.max(5, p.v - 10); return endI(d, 'Ihr bleibt zusammen – irgendwie. Die Stimmung zu Hause ist eisig.', { stress: 5, partner: -2 }, 'thought'); } }] },
      cold: { say: function (c, d) { var p = L.life(c.st).partner; return '„Ich brauche Abstand.“ ' + fn(p) + ' packt eine Tasche. „Ich schlafe ein paar Tage woanders. Ruf mich nicht an.“'; },
        opts: [
          { l: 'Hinterherlaufen und um Verzeihung bitten', fx: function (st, c, d) { var p = P.partner(st); A.appDel(st);
            if (ch(clamp((p.v - 15) / 120, 0.05, 0.5))) { d.img = 'thought'; return { r: fn(p) + ' bleibt im Treppenhaus stehen. „Sag mir, warum ich bleiben sollte.“', e: { stress: 2 }, next: 'terms' }; }
            p.v = Math.max(5, p.v - 5); return endI(d, 'Die Haustür fällt zu. Drei Tage später kommt eine kurze Nachricht: „Wir reden, wenn ich so weit bin.“', { stress: 5, well: -5 }, 'thought'); } },
          { l: 'Gehen lassen', fx: function (st, c, d) { var p = P.partner(st), lf = L.life(st); p.v = Math.max(5, p.v - 8); lf.suspect = tick(st) + 20;
            if (P.feed) P.feed(st, '💘 ' + fn(p) + ' wohnt nach dem Streit um die Dating-App ein paar Tage bei Freunden.');
            if (p.v < 18) { L.breakup(st, 'Funkstille nach dem Streit um das Dating-Profil'); return endI(d, 'Aus ein paar Tagen wird eine Woche. Dann holt ' + fn(p) + ' die restlichen Sachen ab.', { stress: 8, well: -8 }, 'farewell'); }
            return endI(d, 'Die Wohnung ist still. Zu still. Beim Training bist du mit dem Kopf woanders.', { stress: 6, well: -6, fit: -1 }, 'thought'); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);
  A.appWeekly = function (st) {
    var lf = L.life(st), pc = st.pc; if (!lf || pc.retired || !lf.partner || !A.appOn(st) || L.active(st)) return;
    if (!ch(A.appRisk(st))) return;
    var fame = pc.fame || 0, r = R.rand(), how = r < Math.min(0.3, fame / 250) ? 'press' : r < 0.55 ? 'phone' : r < 0.8 ? 'friend' : 'notif';
    L.start(st, 'app_found', { how: how });
  };
  C.on.weekly.push(A.appWeekly);

  // ---------- Hintergrundgespräch mit Journalistinnen und Journalisten (off the record) ----------
  // Bei Journalistinnen kann geflirtet werden – oder sie flirten selbst: ernst gemeint oder als Masche, um an Interna zu kommen.
  function jOf(st, d) { return L.jrn(st, 'j_' + d.j) || L.life(st).jrn[0]; }
  function jCand(st, j) { var lf = L.life(st), x = lf.cands.filter(function (y) { return y.name === j.name; })[0]; if (!x) { x = L.newCand(st); x.name = j.name; x.g = 'a'; x.job = 'Journalismus'; } x.where = 'Hintergrundgespräch (' + j.outlet + ')'; x.stage = Math.max(1, x.stage || 0); x.v = Math.max(x.v, 60); x.t = tick(st); return x; }
  function badPress(st, j, why) {
    var pt = L.life(st).partner, nm = C.player(st) ? R.world.playerName(C.player(st)) : 'Profi';
    X.chron(st, 'medien', '📰', 'Peinliche Schlagzeile', j.outlet + ': ' + why, 3, 'presse');
    if (S && S.news) S.news(st, j.outlet + ' über ' + nm, why, 'medien');
    if (pt) { var pp = P.partner(st); pp.neg += 3; lf2(st).suspect = tick(st) + 8; }
    return pt ? { media: -8, pop: -3, coach: -2, board: -4, f_fam: -5, partner: -8, stress: 6 } : { media: -8, pop: -3, coach: -2, board: -4, f_fam: -5, stress: 4 };
  }
  function lf2(st) { return L.life(st); }
  L.addDlg([{
    id: 'pressbg', cat: 'medien', ic: '☕', scene: 'presse', title: 'Hintergrundgespräch', max: 4,
    init: function (st, c, d, s) { var j = jOf(st, d); if (!j) { s.done = true; return; } d.j = j.type; d.fem = L.fem(j.name) ? 1 : 0;
      // schon privat bekannt (Partnerin, Kontakt, Affäre, Ex)? Dann kein Flirt wie mit einer Fremden
      var lf = L.life(st), pt = lf.partner;
      if (pt && pt.name === j.name) { d.rel = 'pt'; s.node = 'rel_pt'; return; }
      if (lf.cands.some(function (y) { return y.name === j.name; }) || A.flings(st).some(function (f) { return f.on && f.name === j.name; })) { d.rel = 'known'; s.node = 'rel_known'; return; }
      if ((lf.exes || []).some(function (y) { return y.name === j.name; })) { d.rel = 'ex'; s.node = 'rel_ex'; return; }
      // flirtet sie von sich aus? ernst gemeint oder Masche (Boulevard eher Masche)
      if (d.fem && ch(0.3 + (st.pc.fame || 0) / 300)) { d.her = 1; d.real = ch(j.type === 'boul' ? 0.3 : j.type === 'krit' ? 0.45 : 0.6) ? 1 : 0; s.node = 'her'; } },
    who: function (c, d) { var j = jOf(c.st, d); return j ? { n: j.name, role: L.JTYPES[j.type] + ' · ' + j.outlet, ic: '☕', kind: 'press' } : { n: 'Presse', role: '' }; },
    nodes: {
      start: { say: function (c, d) { var j = jOf(c.st, d); return 'Ein Kaffee abseits der Kameras mit ' + fn(j) + ' (' + j.outlet + '). „Alles off the record – ich will nur verstehen, wie du tickst.“'; },
        opts: function (c, d) { var o = [
          { l: 'Offen über Sport und Ziele reden', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, fn(j) + ' schreibt kaum mit, hört aber genau zu. „Danke. So versteht man dich besser.“', { ['j_' + j.type]: 7, media: 2 }); } },
          { l: 'Freundlich, aber nur Floskeln', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, 'Höflich, ohne Inhalt. ' + fn(j) + ' lächelt etwas gelangweilt.', { ['j_' + j.type]: 1 }); } }];
          if (d.fem) o.push({ l: 'Mit ihr flirten', hint: 'Kann gut ankommen – oder in der Zeitung landen', fx: function (st, c, d) { var j = jOf(st, d);
            if (ch(clamp(0.35 + (c.cx.per.conf - 50) / 200 + (j.v - 50) / 150 + (j.type === 'krit' ? -0.1 : 0) + Math.min(0.1, (st.pc.fame || 0) / 400), 0.1, 0.8))) { return { r: fn(j) + ' lacht und hält deinem Blick stand. „Du weißt schon, dass ich das eigentlich nicht darf?“ Sie klappt den Notizblock zu.', e: { conf: 1, ['j_' + j.type]: 4 }, next: 'match' }; }
            return endI(d, fn(j) + ' zieht die Augenbrauen hoch. „Ernsthaft?“ Zwei Tage später steht es in der Zeitung: plumpe Anmache im Hintergrundgespräch.', Object.assign({ ['j_' + j.type]: -15 }, badPress(st, j, 'Profi baggert Journalistin beim Interview an – im Verein ist man verärgert.')), 'thought'); } });
          return o; } },
      rel_pt: { say: function (c, d) { var j = jOf(c.st, d); return 'Off the record mit der eigenen Partnerin – merkwürdig. ' + fn(j) + ' legt den Block weg. „Soll ich dich jetzt interviewen – oder fragst du, ob ich über dich schreibe?“'; },
        opts: [
          { l: 'Ihr eine exklusive Info stecken', hint: 'Mitspieler könnten Bevorzugung wittern', fx: function (st, c, d) { var j = jOf(st, d); if (ch(0.4)) { X.chron(st, 'medien', '📰', 'Vetternwirtschaft?', j.outlet + ' hat die Info zuerst – von der eigenen Partnerin des Profis.', 2, 'presse'); return endI(d, 'Die Story läuft groß. In der Kabine wird gefragt, warum ausgerechnet ' + j.outlet + ' alles zuerst weiß.', { ['j_' + j.type]: 8, mates: -4, coach: -3, media: -2, partner: 2, stress: 3 }); }
            return endI(d, fn(j) + ' landet einen Scoop. Zu Hause gibt es Sekt – und du hoffst, dass niemand nachfragt.', { ['j_' + j.type]: 8, media: 2, partner: 3 }); } },
          { l: 'Bitten, die Berichterstattung über deinen Verein abzugeben', fx: function (st, c, d) { var j = jOf(st, d); return ch(0.6) ? endI(d, fn(j) + ': „Ich spreche mit der Ressortleitung. Ist wohl besser so.“', { partner: 3, ['j_' + j.type]: -2 }) : endI(d, fn(j) + ': „Das ist mein Job. Ich lasse mir nicht vorschreiben, worüber ich schreibe.“', { partner: -4 }); } },
          { l: 'Lieber über etwas anderes reden', fx: function (st, c, d) { return endI(d, 'Ihr redet über alles außer Sport. Ein schöner Abend – aber kein Hintergrundgespräch.', { partner: 4, well: 2, stress: -2 }); } }] },
      rel_known: { say: function (c, d) { var j = jOf(c.st, d), sec = !!L.life(c.st).partner; return sec ? 'Offiziell ein Hintergrundgespräch, in Wahrheit ein heimliches Wiedersehen. ' + fn(j) + ' flüstert: „Hier kennt uns jeder. Pass auf, wie du mich ansiehst.“' : fn(j) + ' grinst über den Rand der Kaffeetasse. „Heute beruflich – oder darf ich das Diktiergerät gleich ausmachen?“'; },
        opts: [
          { l: 'Das Treffen privat fortsetzen', hint: function (c) { return L.life(c.st).partner ? 'Entdeckungsrisiko' : ''; }, fx: function (st, c, d) { var j = jOf(st, d), x = jCand(st, j), pt = L.life(st).partner; x.v = Math.min(100, x.v + 6); A.flings(st).forEach(function (f) { if (f.on && f.name === j.name) { f.last = tick(st); f.meets = (f.meets || 0) + 1; } });
            if (pt) { lf2(st).suspect = tick(st) + 3; if (ch(0.15)) { X.chron(st, 'familie', '📸', 'Gesehen', 'Ein Fotograf erwischt dich mit ' + j.name + ' (' + j.outlet + ').', 2, 'date'); P.partner(st).neg += 3; return endI(d, 'Vor ihrer Haustür blitzt eine Kamera. Das könnte Ärger geben.', { media: -4, stress: 6, partner: -6 }); } }
            return endI(d, pt ? 'Ein gestohlener Abend. Niemand hat etwas gemerkt – diesmal.' : 'Aus dem Kaffee wird ein langer Abend. Über den Verein redet ihr kaum.', pt ? { well: 2, stress: 2 } : { well: 4, stress: -2 }, 'date'); } },
          { l: 'Strikt beruflich bleiben', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, fn(j) + ' spielt mit. „Dann eben Profi und Reporterin.“ Ein sachliches Gespräch.', { ['j_' + j.type]: 4, media: 1 }); } },
          { l: 'Die Sache beenden', fx: function (st, c, d) { var j = jOf(st, d), lf = L.life(st); lf.cands = lf.cands.filter(function (y) { return y.name !== j.name; }); A.flingEnd(st, j.name); return endI(d, fn(j) + ' klappt den Block zu. „Verstanden.“ Über dich schreibt sie ab jetzt sehr kühl.', { ['j_' + j.type]: -10, stress: 2 }); } }] },
      rel_ex: { say: function (c, d) { var j = jOf(c.st, d); return 'Ein Kaffee mit der Ex – beruflich. ' + fn(j) + ' bleibt kühl. „Also. Was willst du mir erzählen?“'; },
        opts: [
          { l: 'Professionell und fair bleiben', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, 'Es ist seltsam, aber es funktioniert. Ihr seid beide Profis.', { ['j_' + j.type]: 5, stress: 1 }); } },
          { l: 'Fragen, ob es noch eine Chance gibt', fx: function (st, c, d) { var j = jOf(st, d); if (ch(0.25)) { jCand(st, j); return endI(d, fn(j) + ' schweigt lange. „Vielleicht. Ruf mich an – aber nicht im Dienst.“', { well: 2 }); } return endI(d, '„Das ist vorbei.“ Der Artikel danach ist auffallend spitz.', { ['j_' + j.type]: -6, media: -2, stress: 3 }); } }] },
      her: { say: function (c, d) { var j = jOf(c.st, d); return fn(j) + ' rückt näher, lacht über jeden deiner Witze und berührt wie zufällig deinen Arm. „Wir könnten das ja mal ohne Diktiergerät fortsetzen – bei einem Glas Wein?“'; },
        opts: [
          { l: 'Darauf eingehen', fx: function (st, c, d) { return { r: 'Am Abend sitzt ihr in einer kleinen Weinbar. ' + (d.real ? 'Sie erzählt von sich, fragt nach dir – nicht nach dem Verein.' : 'Nach dem zweiten Glas wird sie neugierig: „Sag mal, wie ist das eigentlich wirklich zwischen dem Trainer und der Mannschaft? Und stimmt das mit dem Kapitän?“'), next: d.real ? 'match' : 'leak' }; } },
          { l: 'Höflich abblocken', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, 'Du bleibst professionell. ' + fn(j) + ' nimmt es sportlich: „Schade. Aber fair.“', { ['j_' + j.type]: d.real ? -2 : 1, partner: 1 }); } },
          { l: 'Nachfragen: „Ist das ernst gemeint – oder willst du eine Story?“', fx: function (st, c, d) { var j = jOf(st, d);
            if (d.real) return { r: fn(j) + ' wird rot. „Ganz ehrlich? Ernst gemeint. Die Story ist mir heute egal.“', e: { ['j_' + j.type]: 2 }, next: 'match' };
            return endI(d, fn(j) + ' lacht ertappt. „Einen Versuch war es wert.“ Masche durchschaut – du gibst nichts preis.', { conf: 2, ['j_' + j.type]: -3 }); } }] },
      leak: { say: function (c, d) { return '„Komm schon, nur unter uns.“ Sie schenkt nach und wartet.'; },
        opts: [
          { l: 'Ein bisschen aus der Kabine plaudern', fx: function (st, c, d) { var j = jOf(st, d), nm = C.player(st) ? R.world.playerName(C.player(st)) : 'Profi';
            X.chron(st, 'medien', '📰', 'Interna in der Zeitung', j.outlet + ' druckt Interna aus der Kabine – die Quelle bist du.', 3, 'presse');
            if (S && S.news) S.news(st, 'Interna aus der Kabine', j.outlet + ' berichtet über Streit zwischen Trainer und Mannschaft. Im Verein sucht man die undichte Stelle – und landet bei ' + nm + '.', 'medien');
            var pt = L.life(st).partner; if (pt) P.partner(st).neg += 2;
            return endI(d, 'Drei Tage später steht alles in der Zeitung. Die Mitspieler wissen sofort, woher es kommt. ' + fn(j) + ' meldet sich nie wieder privat – es war eine Masche.', { mates: -9, capt: -6, coach: -6, board: -5, media: -2, ['j_' + j.type]: 6, stress: 6, partner: pt ? -4 : 0 }, 'thought'); } },
          { l: 'Lachen: „Über die Kabine rede ich nicht.“', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, fn(j) + ' verliert schnell das Interesse und bestellt die Rechnung. Da ging es wohl nie um dich.', { conf: 1, ['j_' + j.type]: -4 }); } }] },
      match: { say: function (c, d) { var pt = L.life(c.st).partner; return 'Zwischen euch knistert es.' + (pt ? ' Zu Hause wartet ' + fn(pt) + '.' : '') + ' Wie geht es weiter?'; },
        opts: [
          { l: 'Nummern tauschen und ein Date ausmachen', hint: function (c) { return L.life(c.st).partner ? 'Heimlicher Kontakt neben der Beziehung' : 'Kann eine Beziehung werden'; }, fx: function (st, c, d) { var j = jOf(st, d), x = jCand(st, j); return endI(d, fn(j) + ' tippt ihre Nummer in dein Handy. „Aber nicht in der Kabine rumerzählen.“ Ihr seht euch wieder.', { well: 2 }, 'date'); } },
          { l: 'Mit zu ihr', hint: 'Affäre – Spaß, aber Entdeckungsrisiko', fx: function (st, c, d) { var j = jOf(st, d), pt = L.life(st).partner; if (!A.flings(st).some(function (f) { return f.on && f.name === j.name; })) A.flingAdd(st, j.name); if (pt) P.partner(st).neg += 2;
            X.chron(st, 'familie', '🍷', 'Affäre', 'Eine Nacht mit ' + j.name + ' (' + j.outlet + ')' + (pt ? ' – ' + fn(pt) + ' darf davon nichts erfahren.' : '.'), 1, 'date');
            return endI(d, 'Eine lange Nacht. Am Morgen grinst ' + fn(j) + ': „Das bleibt garantiert off the record.“', pt ? { well: 3, stress: 3, fit: -3 } : { well: 4, stress: 1, fit: -3 }); } },
          { l: 'Lieber professionell bleiben', fx: function (st, c, d) { var j = jOf(st, d); return endI(d, 'Ihr belasst es bei einem guten Gespräch. ' + fn(j) + ' respektiert das.', { ['j_' + j.type]: 3, partner: 1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
  }]);
})(RFM);
