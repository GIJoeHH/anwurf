// Finanzberatung in der Spielerkarriere: Anbietergruppen mit fiktiven Unternehmen, individuelle Berater mit
// (teils verborgenen) Qualitätswerten, Vergütungsmodelle, Betreuungsformen mit Vollmacht, Empfehlungen mit
// Entscheidungsmechanik, Produkte (Fondskorb aus der bestehenden Börse, Bausparvertrag, Versicherungspolice),
// Sparplan, Historie und Beraterwechsel. Beratungsqualität wirkt auf Auswahl, Streuung, Kosten und Risiko – nie auf Kurse.
(function (R) {
  var D = R.data, W = R.world, S = R.season, C = R.pc, E = R.econ, X = R.cx, PF = R.pf;
  var FA = R.fa = {};
  var clamp = X.clamp, MT = 4;
  function tick(st) { return st.tick || 0; }
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'finanzen'); }
  function rnd(v, s) { s = s || 100; return Math.round(v / s) * s; }

  FA.ATTR = { fach: 'Fachkompetenz', qual: 'Beratungsqualität', unab: 'Unabhängigkeit', trans: 'Transparenz', ehr: 'Ehrlichkeit', prod: 'Produktkenntnisse', kap: 'Kapitalmarktkompetenz', immo: 'Immobilienkompetenz', vers: 'Versicherungskenntnisse', lang: 'Langfristige Kundenorientierung', eigen: 'Eigeninteresse & Provisionsorientierung' };
  FA.SERV = { analyse: 'Analyse der Finanzsituation', budget: 'Budgetplanung & Ausgabenkontrolle', reserve: 'Aufbau einer Liquiditätsreserve', strategie: 'Anlagestrategie', depot: 'Betreuung des Aktienportfolios', krypto: 'Risikomanagement Krypto', immo: 'Prüfung von Immobilieninvestitionen', finanz: 'Finanzierungsberatung', vers: 'Versicherungs- & Absicherungsanalyse', ende: 'Finanzplanung Karriereende', verm: 'Langfristige Vermögensplanung' };
  // Anbietergruppen (alle Unternehmen fiktiv). Die Gruppe prägt Vergütung und Schwerpunkte, die Qualität entscheidet der einzelne Berater.
  FA.GROUPS = {
    ganz: { n: 'Ganzheitliche Finanzplanung', model: 'Provision auf Fonds, ganzheitlicher Ansatz', firms: ['Klarvermögen Finanzplanung', 'Lebensplan Consulting', 'Kompass Vermögensplanung'], b: { fach: 66, qual: 66, unab: 50, trans: 60, ehr: 64, prod: 70, kap: 64, immo: 50, vers: 60, lang: 68, eigen: 48 }, fee: { up: 0.03, ong: 0.004, mon: 0 }, serv: ['analyse', 'budget', 'reserve', 'strategie', 'depot', 'ende', 'verm', 'vers'], prods: ['fonds', 'police'] },
    vertrieb: { n: 'Allfinanz-Vertrieb', model: 'Provision je Produktabschluss', firms: ['Meridian Allfinanz', 'Vorsorgewerk Union', 'Sicherheitskontor Plus'], b: { fach: 52, qual: 48, unab: 28, trans: 42, ehr: 52, prod: 58, kap: 46, immo: 48, vers: 66, lang: 48, eigen: 72 }, fee: { up: 0.05, ong: 0.004, mon: 0 }, serv: ['analyse', 'vers', 'finanz', 'reserve', 'ende'], prods: ['bauspar', 'police', 'fonds'] },
    bank: { n: 'Bank / Sparkasse', model: 'Produktkosten, Depotgebühren, Finanzierungen', firms: ['Stadtsparkasse am Fluss', 'Hansebank Privatkunden', 'Volks- und Raiffeisenbank Mittelland'], b: { fach: 56, qual: 52, unab: 36, trans: 50, ehr: 60, prod: 60, kap: 54, immo: 62, vers: 50, lang: 56, eigen: 55 }, fee: { up: 0.025, ong: 0.006, mon: 15 }, serv: ['analyse', 'strategie', 'depot', 'finanz', 'immo', 'reserve'], prods: ['fonds', 'bauspar'] },
    honorar: { n: 'Unabhängige Honorarberatung', model: 'Festes Honorar, keine Provisionen', firms: ['Honorarkanzlei Weitblick', 'Faktenbasiert Finanzberatung', 'Unabhängig & Klar'], b: { fach: 70, qual: 64, unab: 85, trans: 84, ehr: 74, prod: 60, kap: 70, immo: 56, vers: 56, lang: 74, eigen: 15 }, fee: { up: 0, ong: 0, mon: 450 }, serv: ['analyse', 'budget', 'reserve', 'strategie', 'krypto', 'immo', 'finanz', 'vers', 'ende', 'verm'], prods: ['fonds'] },
    vv: { n: 'Vermögensverwaltung / Family Office', model: 'Jährliche Verwaltungsgebühr auf das verwaltete Vermögen', firms: ['Alpenhaus Vermögensverwaltung', 'Lindmeyer Family Office', 'Nordkap Capital Partners'], b: { fach: 76, qual: 70, unab: 60, trans: 64, ehr: 70, prod: 70, kap: 80, immo: 70, vers: 54, lang: 70, eigen: 36 }, fee: { up: 0, ong: 0.012, mon: 0 }, minNw: 500000, serv: ['analyse', 'strategie', 'depot', 'krypto', 'immo', 'verm', 'ende'], prods: ['fonds'] }
  };
  FA.MODES = { begleitet: { n: 'Begleitete Finanzplanung', d: 'Der Berater entwickelt Empfehlungen, du triffst die wesentlichen Entscheidungen.' }, umfassend: { n: 'Umfassende Betreuung', d: 'Der Berater verwaltet innerhalb der erteilten Befugnisse laufend und informiert über wichtige Entwicklungen.' } };
  var FN = ['Thomas', 'Katrin', 'Michael', 'Birgit', 'Andreas', 'Nadine', 'Holger', 'Simone', 'Jörg', 'Melanie', 'Oliver', 'Claudia', 'Rainer', 'Tanja', 'Daniela'];
  var LN = ['Kessler', 'Brandt', 'Wiegand', 'Hoffmeister', 'Lorenz', 'Seidel', 'Graf', 'Marquardt', 'Böhm', 'Fischer', 'Reuter', 'Kühne', 'Pohl', 'Stein', 'Arndt'];

  FA.genDb = function () {
    var db = [], n = 0;
    Object.keys(FA.GROUPS).forEach(function (g) {
      var G = FA.GROUPS[g];
      G.firms.forEach(function (firm) {
        var a = {}; Object.keys(G.b).forEach(function (k) { a[k] = Math.round(clamp(R.gauss(G.b[k], 15), 5, 97)); });
        var feeF = R.randRange(0.75, 1.3);
        db.push({ id: 'F' + (++n), n: R.pick(FN) + ' ' + R.pick(LN), firm: firm, g: g, a: a, fee: { up: Math.round(G.fee.up * feeF * 1000) / 1000, ong: Math.round(G.fee.ong * feeF * 10000) / 10000, mon: rnd(G.fee.mon * feeF, 5) }, rep: clamp(Math.round((a.fach + a.qual) / 40 + R.randRange(-1, 1)), 1, 5), serv: G.serv.filter(function () { return R.chance(0.85); }), clients: R.randInt(30, 400) });
      });
    });
    return db;
  };
  FA.ensure = function (st) { var pc = st.pc; if (!pc) return null; if (!pc.fa) pc.fa = { db: FA.genDb(), cur: null, con: null, trust: 50, known: {}, hist: [], prods: [], plan: null, rec: null }; return pc.fa; };
  FA.get = function (st, id) { return FA.ensure(st).db.filter(function (a) { return a.id === id; })[0] || null; };
  FA.current = function (st) { var f = st.pc && st.pc.fa; return f && f.cur ? FA.get(st, f.cur) : null; };
  FA.quality = function (a) { var x = a.a; return Math.round((x.fach * 1.2 + x.qual + x.ehr + x.lang + x.kap * 0.8 + x.trans * 0.5 - x.eigen * 0.8) / 4.7 + 10); };
  FA.know = function (st, id, k, lvl) { var f = FA.ensure(st), m = f.known[id] = f.known[id] || {}; if ((m[k] || 0) < lvl) m[k] = lvl; };
  FA.shown = function (st, a, k) { var lv = (FA.ensure(st).known[a.id] || {})[k] || 0, v = a.a[k]; if (lv >= 2) return String(v); if (lv === 1) return v >= 67 ? 'eher hoch' : v >= 40 ? 'mittel' : 'eher niedrig'; return '?'; };
  FA.delegated = function (st) { var f = st.pc && st.pc.fa; return !!(f && f.con && (f.con.mode === 'umfassend' || R.chance(0.5))); };
  FA.trust = function (st, d, why) { var f = FA.ensure(st); f.trust = clamp(f.trust + d, 0, 100); if (why) FA.log(st, 'Vertrauen', why + ' (' + (d > 0 ? '+' : '') + d + ')'); };
  FA.log = function (st, k, txt, amt) { var f = FA.ensure(st); f.hist.unshift({ t: tick(st), s: st.season, w: st.week, k: k, txt: txt, amt: amt || 0, aid: f.cur }); if (f.hist.length > 200) f.hist.length = 200; };

  // ---------- Vertrag ----------
  FA.available = function (st) { var nw = PF.netWorth(st); return FA.ensure(st).db.filter(function (a) { var G = FA.GROUPS[a.g]; return !G.minNw || nw >= G.minNw; }); };
  FA.sign = function (st, id, mode, power) {
    var f = FA.ensure(st), a = FA.get(st, id); if (!a) return { ok: false, why: 'Nicht verfügbar.' };
    if (PF.minor(st)) return { ok: false, why: 'Eine Finanzberatung gibt es erst ab 18 – bis dahin verwalten deine Eltern das Geld.' };
    var G = FA.GROUPS[a.g]; if (G.minNw && PF.netWorth(st) < G.minNw) return { ok: false, why: 'Mindestvermögen ' + R.fmtMoney(G.minNw) + '.' };
    if (f.cur) FA.cancel(st, true);
    f.cur = a.id; f.con = { start: tick(st), mode: FA.MODES[mode] ? mode : 'begleitet', power: { trade: !!power }, fee: R.clone(a.fee) }; f.trust = 50;
    FA.know(st, a.id, 'trans', 1);
    FA.log(st, 'Vertrag', 'Beratungsvertrag mit ' + a.n + ' (' + a.firm + '), ' + FA.MODES[f.con.mode].n + (power ? ', mit Handelsvollmacht' : ', ohne Vollmacht'));
    X.chron(st, 'finberater', '🧮', 'Finanzberatung: ' + a.firm, a.n + ' · ' + FA.GROUPS[a.g].n + ' · ' + FA.MODES[f.con.mode].n, 2);
    PF.ensure(st).mode = f.con.mode;
    X.later(st, 2, 'fa_analysis', {});
    return { ok: true };
  };
  FA.cancel = function (st, silent) {
    var f = FA.ensure(st), a = FA.current(st); if (!a) return { ok: false };
    FA.log(st, 'Kündigung', 'Zusammenarbeit mit ' + a.n + ' beendet. Abgeschlossene Produkte laufen weiter.');
    if (!silent) X.chron(st, 'finberater', '✂️', 'Finanzberater gekündigt', a.n + ' (' + a.firm + ')', 1);
    f.cur = null; f.con = null; f.rec = null; PF.ensure(st).mode = 'self'; return { ok: true };
  };
  FA.setPower = function (st, on) { var f = FA.ensure(st); if (f.con) { f.con.power.trade = !!on; FA.log(st, 'Vollmacht', on ? 'Handelsvollmacht erteilt' : 'Handelsvollmacht entzogen'); } };
  FA.setMode = function (st, m) { var f = FA.ensure(st); if (f.con && FA.MODES[m]) { f.con.mode = m; PF.ensure(st).mode = m; } };
  FA.aum = function (st) { return PF.stocks(st) + PF.crypto(st) + FA.productsValue(st); };
  FA.monthlyCost = function (st) { var f = st.pc && st.pc.fa, a = FA.current(st); if (!a || !f.con) return 0; return Math.round(f.con.fee.mon + FA.aum(st) * f.con.fee.ong / 12); };

  // ---------- Produkte ----------
  FA.PRODS = { fonds: 'Investmentfonds (Aktienkorb)', bauspar: 'Bausparvertrag', police: 'Fondsgebundene Versicherungspolice', sparplan: 'Sparplan' };
  FA.productsValue = function (st) { var f = st.pc && st.pc.fa; return f ? R.sum(f.prods, function (p) { return p.val; }) : 0; };
  FA.openProduct = function (st, k, amount, comm, note) {
    var f = FA.ensure(st), pr = { id: 'P' + tick(st) + f.prods.length, k: k, n: FA.PRODS[k], val: 0, paid: 0, t0: tick(st), aid: f.cur, note: note || '' };
    if (k === 'bauspar') { pr.val = rnd(amount * 0.985, 10); pr.paid = amount; PF.book(st, -amount, 'Bausparvertrag'); }
    if (k === 'police') { pr.prem = rnd(amount, 10); pr.paid = 0; }
    f.prods.push(pr);
    if (comm) { PF.book(st, -comm, 'Abschlussprovision'); }
    FA.log(st, 'Produkt', pr.n + ' abgeschlossen' + (comm ? ', Abschlusskosten ' + R.fmtMoney(comm) : ''), comm);
    return pr;
  };
  FA.closeProduct = function (st, id) {
    var f = FA.ensure(st), pr = f.prods.filter(function (x) { return x.id === id; })[0]; if (!pr) return { ok: false };
    var age = (tick(st) - pr.t0) / 52, back = pr.k === 'police' ? pr.val * clamp(0.65 + age * 0.06, 0.65, 0.97) : pr.val * 0.98;
    PF.book(st, Math.round(back), 'Produktauflösung'); f.prods = f.prods.filter(function (x) { return x !== pr; });
    FA.log(st, 'Kündigung', pr.n + ' aufgelöst, Rückkauf ' + R.fmtMoney(Math.round(back)) + ' (eingezahlt ' + R.fmtMoney(Math.round(pr.paid)) + ')');
    return { ok: true, back: back, loss: pr.paid - back };
  };

  // ---------- Empfehlungen: Strategie aus Sicht des Beraters ----------
  // Ergebnis: Ziel (Reserve, Aktienkorb, Kryptoanteil, Produkte), Umschichtungsbetrag, Kosten, Streuung, Risikoeignung
  FA.stockPool = function (st) { return D.stocks.filter(function (s) { return !s.club && st.market.stocks[s.id]; }).map(function (s) { return s.id; }); };
  FA.propose = function (st, a) {
    var m = PF.monthly(st), liq = PF.liquid(st), stocks = PF.stocks(st), crypto = PF.crypto(st), x = a.a, p = C.player(st);
    var fixed = Math.max(1000, m.fixed), total = liq + stocks + crypto;
    var reserveM = clamp(Math.round(4 + x.qual / 12 + x.lang / 25 + R.gauss(0, (100 - x.fach) / 25)), 2, 18);
    var reserve = fixed * reserveM;
    var cryptoT = clamp((x.eigen > 65 ? 0.08 : 0.03) + (100 - x.lang) / 900 + R.gauss(0, 0.02), 0, 0.25) * total;
    var nStocks = clamp(Math.round(2 + x.kap / 13 + R.gauss(0, 1)), 1, FA.stockPool(st).length);
    var invest = Math.max(0, total - reserve - cryptoT);
    var prods = [];
    var G = FA.GROUPS[a.g];
    if (G.prods.indexOf('bauspar') >= 0 && x.eigen > 55 && R.chance(0.4 + x.eigen / 300)) prods.push({ k: 'bauspar', amt: rnd(Math.min(invest * 0.25, 60000), 1000) });
    if (G.prods.indexOf('police') >= 0 && x.eigen > 50 && R.chance(0.3 + x.eigen / 250)) prods.push({ k: 'police', amt: rnd(Math.max(150, (p ? p.wage : 30000) * 0.012 / 12 * (1 + x.eigen / 60)), 10) });
    var prodSum = R.sum(prods, function (q) { return q.k === 'bauspar' ? q.amt : 0; });
    var stockT = Math.max(0, invest - prodSum);
    var move = Math.max(0, stockT - stocks) + Math.max(0, crypto - cryptoT) + prodSum;
    var upCost = Math.max(0, stockT - stocks) * a.fee.up + R.sum(prods, function (q) { return q.k === 'bauspar' ? q.amt * 0.016 : q.k === 'police' ? q.amt * 12 * 5 * 0.04 : 0; });
    var ongCost = (stockT + cryptoT + prodSum) * a.fee.ong + a.fee.mon * 12 + R.sum(prods, function (q) { return q.k === 'police' ? q.amt * 12 * 0.025 : 0; });
    // objektive Bewertung (für zweite Meinung / Prüfung)
    var ideal = { reserve: fixed * 9, crypto: 0.03 * total, n: 8 };
    var suit = 100 - Math.abs(reserveM - 9) * 4 - Math.max(0, cryptoT / Math.max(1, total) - 0.05) * 300 - Math.max(0, 6 - nStocks) * 6 - upCost / Math.max(1, move) * 300 - prods.length * 8;
    return { t: tick(st), aid: a.id, reserveM: reserveM, reserve: rnd(reserve, 1000), cryptoT: rnd(cryptoT, 100), nStocks: nStocks, stockT: rnd(stockT, 1000), prods: prods, move: rnd(move, 1000), upCost: rnd(upCost, 10), ongCost: rnd(ongCost, 10), suit: Math.round(clamp(suit, 0, 100)), total: total, claim: FA.claimText(a, suit) };
  };
  FA.claimText = function (a, suit) {
    var x = a.a, honest = x.ehr + x.trans > 120;
    if (honest && suit < 50) return 'Ich schlage das so vor – ehrlich gesagt sind die Kosten nicht ganz gering, prüfen Sie das gern.';
    if (suit >= 70) return 'Breit gestreut, ausreichende Reserve, überschaubare Kosten. Das passt zu Ihrer Lage.';
    return x.eigen > 65 ? 'Ein Rundum-sorglos-Paket, das alle unsere erfolgreichen Sportler haben. Die Rendite spricht für sich!' : 'Eine solide Lösung für Ihre Situation.';
  };
  // Umsetzen (Anteil 1 = vollständig, 0.5 = teilweise). Nur echte Transaktionen über die bestehenden Märkte.
  FA.execute = function (st, rec, share) {
    if (!rec) return 'Keine Empfehlung.'; share = share == null ? 1 : share;
    var w = PF.wallet(st), done = [], cost = 0, a = FA.get(st, rec.aid);
    // 1. Kryptoanteil auf Ziel reduzieren
    var cr = PF.crypto(st);
    if (cr > rec.cryptoT) { var cut = (cr - rec.cryptoT) * share; Object.keys(w.portfolio).filter(function (s) { return !!st.market.crypto[s]; }).forEach(function (s) { if (cut <= 0) return; var v = w.portfolio[s].qty * E.price(st, s), q = Math.min(w.portfolio[s].qty, Math.ceil(Math.min(v, cut) / E.price(st, s))); var r = PF.sell(st, s, q); if (r.ok) { cut -= r.revenue; } }); done.push('Krypto reduziert'); }
    // 2. Produkte
    rec.prods.forEach(function (q) { if (q.k === 'bauspar') { var amt = rnd(q.amt * share, 100); if (amt > 0 && PF.liquid(st) > amt) { FA.openProduct(st, 'bauspar', amt, rnd(amt * 0.016, 10), 'Empfehlung ' + (a ? a.n : '')); done.push('Bausparvertrag'); } } else if (q.k === 'police' && share >= 1) { var c = rnd(q.amt * 12 * 5 * 0.04, 10); FA.openProduct(st, 'police', q.amt, c, 'Empfehlung ' + (a ? a.n : '')); done.push('Versicherungspolice'); } });
    // 3. Aktienkorb kaufen (Streuung nach Beraterqualität), Reserve bleibt stehen
    var buyAmt = Math.min(Math.max(0, rec.stockT - PF.stocks(st)) * share, Math.max(0, PF.liquid(st) - rec.reserve * 0.8));
    if (buyAmt > 500) {
      var pool = FA.stockPool(st).sort(function () { return R.rand() - 0.5; }).slice(0, rec.nStocks), per = buyAmt / pool.length;
      pool.forEach(function (s) { var r = PF.buy(st, s, per, 'fa'); if (r.ok) cost += 0; });
      var fee = rnd(buyAmt * (a ? a.fee.up : 0), 10); if (fee) { PF.book(st, -fee, 'Ausgabeaufschlag / Beratungsgebühr'); cost += fee; }
      done.push('Aktienkorb aus ' + pool.length + ' Werten (' + R.fmtMoney(Math.round(buyAmt)) + ')');
    }
    FA.log(st, 'Umsetzung', (share >= 1 ? 'Vollständig' : 'Teilweise') + ' umgesetzt: ' + (done.join(', ') || 'keine Änderung'), cost);
    var f = FA.ensure(st); f.lastExec = { t: tick(st), suit: rec.suit, nw: PF.netWorth(st) }; X.later(st, 26, 'fa_review_half', { suit: rec.suit, nw: PF.netWorth(st) });
    return done.length ? done.join(', ') + '.' : 'Keine Änderung nötig.';
  };
  FA.second = function (st, rec) { // unabhängige zweite Meinung
    var cost = rnd(Math.max(600, PF.liquid(st) * 0.002), 50); PF.book(st, -cost, 'Beratungskosten');
    var a = FA.get(st, rec.aid); if (a) { FA.know(st, a.id, 'qual', 1); FA.know(st, a.id, 'eigen', 1); if (rec.suit < 45) { FA.know(st, a.id, 'ehr', 1); FA.trust(st, -8, 'Zweite Meinung kritisch'); } else FA.trust(st, 3, 'Zweite Meinung bestätigt'); }
    return 'Zweite Meinung (' + R.fmtMoney(cost) + '): Eignung ' + rec.suit + '/100. ' + (rec.suit >= 70 ? 'Solider Vorschlag.' : rec.suit >= 45 ? 'Brauchbar, aber verbesserungsfähig: ' + FA.weak(rec) : 'Nicht zu empfehlen: ' + FA.weak(rec));
  };
  FA.weak = function (rec) { var w = []; if (rec.reserveM < 5) w.push('zu geringe Reserve'); if (rec.reserveM > 14) w.push('zu viel ungenutztes Geld'); if (rec.cryptoT / Math.max(1, rec.total) > 0.06) w.push('zu hoher Kryptoanteil'); if (rec.nStocks < 5) w.push('zu wenig gestreut (' + rec.nStocks + ' Werte)'); if (rec.upCost > rec.move * 0.025) w.push('hohe Abschlusskosten'); if (rec.prods.length) w.push('teure Provisionsprodukte (' + rec.prods.map(function (q) { return FA.PRODS[q.k]; }).join(', ') + ')'); return (w.join(', ') || 'kleinere Details') + '.'; };
  FA.costCheck = function (st, rec) { var a = FA.get(st, rec.aid); if (a) FA.know(st, a.id, 'trans', 2); return 'Kosten: einmalig ' + R.fmtMoney(rec.upCost) + ', laufend ' + R.fmtMoney(rec.ongCost) + ' pro Jahr. Risiko: Kryptoanteil ' + Math.round(rec.cryptoT / Math.max(1, rec.total) * 100) + ' %, Streuung ' + rec.nStocks + ' Aktien, Reserve ' + rec.reserveM + ' Monate.' + (a && a.a.trans < 45 ? ' Die Unterlagen erwähnen Provisionen nur im Kleingedruckten.' : ''); };
  // Strategievergleich: aktueller Stand vs. Empfehlung vs. Lehrbuch
  FA.compare = function (st, rec) {
    var m = PF.monthly(st), tot = PF.liquid(st) + PF.stocks(st) + PF.crypto(st), w = PF.wallet(st);
    var nOwn = Object.keys(w.portfolio).filter(function (s) { return !st.market.crypto[s]; }).length;
    var cur = { n: 'Aktueller Stand', reserveM: Math.round(PF.liquid(st) / Math.max(1, m.fixed) * 10) / 10, crypto: Math.round(PF.crypto(st) / Math.max(1, tot) * 100), stocks: nOwn, cost: FA.monthlyCost(st) * 12 };
    var rows = [cur];
    if (rec) rows.push({ n: 'Empfehlung ' + (FA.get(st, rec.aid) || {}).n, reserveM: rec.reserveM, crypto: Math.round(rec.cryptoT / Math.max(1, rec.total) * 100), stocks: rec.nStocks, cost: rec.ongCost, once: rec.upCost });
    rows.push({ n: 'Lehrbuch (zur Orientierung)', reserveM: 9, crypto: 3, stocks: 8, cost: 0 });
    return rows;
  };
  FA.onTrade = function (st, sym, cost, via) { if (via === 'fa' || via === 'tipp') return; var f = FA.ensure(st); f.selfTrades = (f.selfTrades || 0) + 1; };
  FA.loanCheck = function (st, k, amount) {
    var a = FA.current(st); if (!a) return null; var m = PF.monthly(st);
    var heavy = amount > m.inSum * 12 * 0.8;
    if (heavy && a.a.fach + a.a.lang > 120) { news(st, 'Warnung deines Finanzberaters', a.n + ' rät von diesem Kredit ab: Die Belastung passt nicht zu deinem Einkommen.'); FA.know(st, a.id, 'lang', 1); }
    if (heavy && a.a.eigen > 70 && a.a.lang < 45) { news(st, 'Dein Finanzberater', a.n + ' findet den Kredit „eine gute Idee – Schulden sind steuerlich clever“.'); }
    return null;
  };

  // ---------- Laufender Betrieb (monatlich) ----------
  FA.weekly = function (st) {
    var f = FA.ensure(st), a = FA.current(st), t = tick(st); if (!f) return;
    if (t % MT !== 0 || f.lastM === t) return; f.lastM = t;
    // Produkte entwickeln sich (Police folgt teilweise dem Aktienmarkt, hohe laufende Kosten)
    var idx = E.marketIndex ? E.marketIndex(st) : 0, prev = f.lastIdx || idx; f.lastIdx = idx; var mkt = prev ? idx / prev - 1 : 0;
    f.prods.forEach(function (pr) {
      if (pr.k === 'bauspar') pr.val *= 1 + 0.003 / 12;
      if (pr.k === 'police') { if (PF.liquid(st) > pr.prem) { PF.book(st, -pr.prem, 'Versicherungsbeiträge'); pr.paid += pr.prem; pr.val += pr.prem * ((t - pr.t0) / 52 < 5 ? 0.72 : 0.96); } pr.val *= 1 + mkt * 0.6 - 0.025 / 12; }
    });
    // Sparplan
    if (f.plan && f.plan.amt > 0 && PF.liquid(st) > f.plan.amt * 2) { var pool = FA.stockPool(st), per = f.plan.amt / Math.max(1, pool.length); pool.slice(0, 8).forEach(function (s) { PF.buy(st, s, Math.max(per, f.plan.amt / 8), 'fa'); }); f.plan.n = (f.plan.n || 0) + 1; }
    if (!a) return;
    // Honorar & Verwaltungsgebühren
    var cost = FA.monthlyCost(st); if (cost) PF.book(st, -cost, 'Finanzberatung');
    // Umfassende Betreuung mit Vollmacht: Berater handelt selbst (Qualität bestimmt Disziplin und Häufigkeit)
    if (f.con.mode === 'umfassend' && f.con.power.trade && R.chance(a.a.eigen > 65 ? 0.35 : 0.15)) {
      var rec = FA.propose(st, a); FA.execute(st, rec, 0.5); news(st, 'Bericht deines Finanzberaters', a.n + ' hat dein Depot umgeschichtet (Vollmacht). Details unter „Meine Finanzen“.');
    }
    if (f.con.mode === 'umfassend' && !f.con.power.trade && R.chance(0.05)) X.fire(st, 'fa_power', {}, true);
    // Vertrauen entwickelt sich mit dem tatsächlichen Verhalten
    if (R.chance(0.04)) { FA.know(st, a.id, R.pick(Object.keys(FA.ATTR)), 1); }
    // Ereignisse
    var c = st.pc.cx; if (c && c.inbox.filter(function (x) { return X.REG[x.id] && X.REG[x.id].pack === 'finberater'; }).length >= 2) return;
    var acts = ['fa_strategy', 'fa_reserve', 'fa_budget', 'fa_crypto', 'fa_insure', 'fa_bauspar', 'fa_police', 'fa_churn', 'fa_hidden', 'fa_tax', 'fa_retire', 'fa_conflict', 'fa_sparplan', 'fa_annual', 'fa_steuermodell', 'fa_realty'];
    if (R.chance(0.35)) { var ctx = X.ctx(st), pool2 = acts.map(function (k) { return X.REG[k]; }).filter(function (e) { return e && X.eligible(st, Object.assign({}, e, { follow: false }), ctx); }); if (pool2.length) X.fire(st, R.pick(pool2).id, {}, true); }
  };
  C.on.weekly.push(FA.weekly);
  // Produktwerte zählen zum Nettovermögen
  var baseNw = PF.netWorth; PF.netWorth = function (st) { return baseNw(st) + (st.pc ? FA.productsValue(st) : 0); };

  // ---------- Beratungsereignisse ----------
  function fan(c) { return c.fa ? c.fa.n : 'Dein Finanzberater'; }
  function recOf(st) { var f = FA.ensure(st), a = FA.current(st); if (!a) return null; if (!f.rec || tick(st) - f.rec.t > 6) f.rec = FA.propose(st, a); return f.rec; }
  function stdOpts(after) {
    return [
      { l: 'Vollständig umsetzen', fx: function (st) { var r = recOf(st); var m = FA.execute(st, r, 1); FA.ensure(st).rec = null; return m; } },
      { l: 'Nur teilweise umsetzen', fx: function (st) { var r = recOf(st); var m = FA.execute(st, r, 0.5); FA.ensure(st).rec = null; return m; } },
      { l: 'Zweite Meinung einholen', fx: function (st) { var r = recOf(st); X.later(st, 1, after || 'fa_strategy_again', {}); return FA.second(st, r); } },
      { l: 'Kosten und Risiken genauer prüfen', fx: function (st) { var r = recOf(st); X.later(st, 1, after || 'fa_strategy_again', {}); return FA.costCheck(st, r); } },
      { l: 'Ablehnen', fx: function (st, c) { FA.log(st, 'Abgelehnt', 'Empfehlung abgelehnt'); FA.ensure(st).rec = null; if (c.fa && c.fa.a.eigen > 70) FA.trust(st, -2); return 'Abgelehnt.'; } },
      { l: 'Den Finanzberater wechseln', fx: function (st) { FA.cancel(st); X.setFlag(st, 'faMarket', 1); return 'Gekündigt – vergleiche die Anbieter unter „Meine Finanzen“.'; } }
    ];
  }
  function has(c) { return !!c.fa; }
  function nwAbove(c, v) { return PF.netWorth(c.st) > v * (D.MONEY || 1) * 0 + v; }
  X.add('finberater', [
    { id: 'fa_first', cat: 'finberater', ic: '📇', once: true, when: function (c) { return !c.fa && c.age >= 18 && PF.liquid(c.st) + PF.stocks(c.st) > 60000; }, ti: 'Finanzberater klopfen an', t: function () { return 'Mit dem ersten richtigen Geld melden sich Banken, Vertriebe, Honorarberater und Vermögensverwalter. Unter „Meine Finanzen“ kannst du Anbieter vergleichen – oder alles selbst verwalten.'; },
      o: [{ l: 'Anbieter vergleichen', fx: function (st) { X.setFlag(st, 'faMarket', 1); return 'Die Übersicht liegt unter „Meine Finanzen“.'; } }, { l: 'Ich verwalte alles selbst', fx: function (st) { return X.eff(st, { conf: 1 }) + '. Plane dafür Zeit im Wochenplan ein.'; } }] },
    { id: 'fa_analysis', cat: 'finberater', ic: '🔍', follow: true, inbox: true, ti: 'Analyse deiner Finanzsituation', t: function (c) { var s = PF.security(c.st); return fan(c) + ' hat deine Finanzen analysiert: Sicherheitsstufe „' + PF.LEVELS[s.lvl] + '“, Reserve ' + s.months + ' Monate, freier Cashflow ' + R.fmtMoney(s.cf) + '/Monat. ' + (c.fa && c.fa.a.qual > 60 ? 'Die Analyse ist gründlich und verständlich.' : 'Die Analyse bleibt an der Oberfläche.'); },
      o: [{ l: 'Danke – her mit der Strategie', fx: function (st, c) { if (c.fa) FA.know(st, c.fa.id, 'qual', 1); X.later(st, 1, 'fa_strategy_again', {}); return 'Der Vorschlag folgt.'; } }, { l: 'Erst einmal nichts ändern', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_strategy', cat: 'finberater', ic: '📊', inbox: true, exp: 4, cd: 26, follow: true, when: has, ti: 'Neue Anlagestrategie', t: function (c) { var r = recOf(c.st); return fan(c) + ' schlägt vor, ' + R.fmtMoney(r.move) + ' umzuschichten: Reserve ' + r.reserveM + ' Monate, Aktienkorb mit ' + r.nStocks + ' Werten, Krypto ' + R.fmtMoney(r.cryptoT) + (r.prods.length ? ', dazu ' + r.prods.map(function (q) { return FA.PRODS[q.k]; }).join(' und ') : '') + '. „' + r.claim + '“'; }, o: stdOpts() },
    { id: 'fa_strategy_again', cat: 'finberater', ic: '📊', follow: true, inbox: true, exp: 4, when: has, ti: 'Die Anlagestrategie', t: function (c) { var r = recOf(c.st); return 'Zurück zur Empfehlung von ' + fan(c) + ': ' + R.fmtMoney(r.move) + ' umschichten (einmalige Kosten ' + R.fmtMoney(r.upCost) + ', laufend ' + R.fmtMoney(r.ongCost) + '/Jahr). Wie entscheidest du?'; }, o: stdOpts('fa_strategy_last') },
    { id: 'fa_strategy_last', cat: 'finberater', ic: '📊', follow: true, inbox: true, exp: 4, when: has, ti: 'Letzte Entscheidung zur Strategie', t: function (c) { var r = recOf(c.st); return 'Alle Informationen liegen vor (Eignung laut Prüfung: ' + r.suit + '/100). Entscheide dich.'; }, o: stdOpts('fa_strategy_last').filter(function (o, i) { return i !== 2 && i !== 3; }) },
    { id: 'fa_review_half', cat: 'finberater', ic: '🧾', follow: true, ti: 'Ein halbes Jahr danach', t: function (c, d) { var dn = PF.netWorth(c.st) - (d.nw || 0); return 'Bilanz der umgesetzten Strategie: Nettovermögen ' + (dn >= 0 ? '+' : '') + R.fmtMoney(Math.round(dn)) + '. Die Märkte entscheiden über die Kurse – ob die Strategie gut war, zeigen Streuung und Kosten (Eignung ' + d.suit + '/100).'; },
      o: [{ l: 'Zufrieden', fx: function (st, c, d) { if (c.fa) { FA.trust(st, d.suit >= 60 ? 5 : 1); FA.know(st, c.fa.id, 'kap', 1); } return 'Weiter so.'; } }, { l: 'Unzufrieden – Gespräch suchen', fx: function (st, c, d) { if (!c.fa) return ''; FA.know(st, c.fa.id, 'ehr', 1); if (c.fa.a.ehr > 60) { FA.trust(st, 2, 'Ehrliche Aufarbeitung'); return 'Er erklärt offen, was gut lief und was nicht.'; } FA.trust(st, -4, 'Schönfärberei'); return 'Er redet die Zahlen schön.'; } }] },
    { id: 'fa_reserve', cat: 'finberater', ic: '🛟', follow: true, inbox: true, cd: 40, when: function (c) { return has(c) && PF.security(c.st).months < 6; }, ti: 'Liquiditätsreserve aufbauen', t: function (c) { return fan(c) + ': „Ihre Reserve reicht nur für ' + PF.security(c.st).months + ' Monate. Ich empfehle, monatlich 15 % des Nettogehalts auf das Tagesgeld zu legen.“'; },
      o: [{ l: 'Machen wir', fx: function (st, c) { var m = PF.monthly(st); PF.save(st, m.inc['Nettogehalt'] * 0.6); if (c.fa) FA.trust(st, 3, 'Sinnvoller Rat'); FA.log(st, 'Reserve', 'Tagesgeld aufgestockt'); return 'Tagesgeld aufgestockt.'; } }, { l: 'Später', fx: function () { return 'Vertagt.'; } }] },
    { id: 'fa_budget', cat: 'finberater', ic: '🧮', follow: true, inbox: true, cd: 50, when: function (c) { return has(c) && PF.monthly(c.st).cf < 0; }, ti: 'Budgetplanung', t: function (c) { var m = PF.monthly(c.st); return fan(c) + ': „Sie geben jeden Monat ' + R.fmtMoney(-m.cf) + ' mehr aus, als hereinkommt. Größter Posten: ' + Object.keys(m.exp).sort(function (a, b) { return m.exp[b] - m.exp[a]; })[0] + '.“'; },
      o: [{ l: 'Lebensstil eine Stufe senken', fx: function (st) { var f = PF.ensure(st), o = ['extrem', 'luxus', 'komfortabel', 'bescheiden', 'wg'], i = o.indexOf(f.life); if (i >= 0 && i < 4) PF.setLife(st, o[i + 1]); FA.log(st, 'Budget', 'Lebensstil gesenkt'); return 'Neuer Lebensstil: ' + PF.LIFE[PF.ensure(st).life].n + '.'; } }, { l: 'Auto verkaufen', req: function (c) { return c.st.pc.fin.car !== 'keins'; }, fx: function (st) { var f = PF.ensure(st), price = PF.CARS[f.car].price * 0.55; PF.book(st, Math.round(price), 'Autoverkauf'); f.car = 'keins'; return 'Auto verkauft.'; } }, { l: 'Passt schon', fx: function (st) { return X.eff(st, { stress: 2 }); } }] },
    { id: 'fa_crypto', cat: 'finberater', ic: '🪙', follow: true, inbox: true, cd: 40, when: function (c) { var t = PF.netWorth(c.st); return has(c) && t > 0 && PF.crypto(c.st) / t > 0.15; }, ti: 'Kryptorisiko', t: function (c) { var a = c.fa; return a.a.kap + a.a.lang > 120 ? fan(c) + ': „Ihr Kryptoanteil ist für Ihre Lage viel zu hoch. Ich empfehle, auf höchstens 5 % zu reduzieren.“' : fan(c) + ': „Krypto läuft doch – nachkaufen?“'; },
      o: [{ l: 'Auf 5 % reduzieren', fx: function (st) { var w = PF.wallet(st), t = PF.netWorth(st), cut = PF.crypto(st) - t * 0.05; Object.keys(w.portfolio).filter(function (s) { return !!st.market.crypto[s]; }).forEach(function (s) { if (cut <= 0) return; var q = Math.min(w.portfolio[s].qty, Math.ceil(cut / E.price(st, s))); var r = PF.sell(st, s, q); if (r.ok) cut -= r.revenue; }); FA.log(st, 'Krypto', 'Kryptoanteil reduziert'); return 'Reduziert.'; } }, { l: 'Halten', fx: function () { return 'Du hältst.'; } }] },
    { id: 'fa_insure', cat: 'finberater', ic: '🛡️', follow: true, inbox: true, cd: 80, when: function (c) { return has(c) && c.pro && !c.st.pc.fin.ins.bu; }, ti: 'Absicherungsanalyse', t: function (c) { return fan(c) + ': „Eine schwere Verletzung kann Ihre Karriere beenden. Eine Sportinvaliditätsversicherung kostet ' + R.fmtMoney(Math.round(c.p.wage * 0.012 / 12)) + ' im Monat.“' + (c.fa.a.vers < 45 ? ' (Die Unterlagen wirken lückenhaft.)' : ''); },
      o: [{ l: 'Abschließen', fx: function (st, c) { PF.setIns(st, 'bu', true); FA.log(st, 'Versicherung', 'Sportinvaliditätsversicherung abgeschlossen'); if (c.fa) FA.know(st, c.fa.id, 'vers', 1); return 'Abgesichert.'; } }, { l: 'Brauche ich nicht', fx: function () { return 'Kein Abschluss.'; } }] },
    { id: 'fa_bauspar', cat: 'finberater', ic: '🏦', follow: true, inbox: true, cd: 70, when: function (c) { return has(c) && c.fa.a.eigen > 55 && FA.GROUPS[c.fa.g].prods.indexOf('bauspar') >= 0 && PF.liquid(c.st) > 30000; }, ti: 'Bausparvertrag', t: function (c) { var amt = rnd(Math.min(PF.liquid(c.st) * 0.3, 50000), 1000); return fan(c) + ' empfiehlt einen Bausparvertrag über ' + R.fmtMoney(amt * 2) + ' (Einzahlung ' + R.fmtMoney(amt) + '): „Sicher und staatlich gefördert!“ Abschlussgebühr 1,6 %, Guthabenzins 0,3 %.'; },
      o: [{ l: 'Abschließen', fx: function (st) { var amt = rnd(Math.min(PF.liquid(st) * 0.3, 50000), 1000); FA.openProduct(st, 'bauspar', amt, rnd(amt * 2 * 0.016, 10)); return 'Abgeschlossen.'; } }, { l: 'Wofür brauche ich das?', fx: function (st, c) { FA.know(st, c.fa.id, 'eigen', 1); if (c.fa.a.ehr > 60) return 'Er gibt zu: Ohne konkreten Bauwunsch lohnt es sich kaum.'; return 'Die Antwort bleibt vage.'; } }, { l: 'Ablehnen', fx: function () { return 'Abgelehnt.'; } }] },
    { id: 'fa_police', cat: 'finberater', ic: '📑', follow: true, inbox: true, cd: 70, when: function (c) { return has(c) && c.pro && c.fa.a.eigen > 50 && FA.GROUPS[c.fa.g].prods.indexOf('police') >= 0; }, ti: 'Fondsgebundene Rentenpolice', t: function (c) { var prem = rnd(Math.max(200, c.p.wage * 0.02 / 12), 10); return fan(c) + ' empfiehlt eine Rentenpolice für ' + R.fmtMoney(prem) + ' im Monat: „Die Altersvorsorge der Profis.“ Abschlusskosten und laufende Kosten stehen auf Seite 14.'; },
      o: [{ l: 'Abschließen', fx: function (st, c) { var prem = rnd(Math.max(200, c.p.wage * 0.02 / 12), 10); FA.openProduct(st, 'police', prem, rnd(prem * 12 * 5 * 0.04, 10)); return 'Abgeschlossen. Die Abschlusskosten wurden sofort fällig.'; } }, { l: 'Seite 14 lesen', fx: function (st, c) { FA.know(st, c.fa.id, 'trans', 1); return 'Abschlusskosten 4 % der Beitragssumme von fünf Jahren, laufende Kosten 2,5 % pro Jahr. Ein breiter Aktienkorb wäre deutlich günstiger.'; } }, { l: 'Ablehnen', fx: function () { return 'Abgelehnt.'; } }] },
    { id: 'fa_churn', cat: 'finberater', ic: '🔁', follow: true, inbox: true, cd: 60, when: function (c) { return has(c) && c.fa.a.eigen > 60 && c.fa.a.lang < 55 && c.st.pc.fa.prods.length > 0; }, ti: 'Umdeckung empfohlen', t: function (c) { return fan(c) + ': „Ihr alter Vertrag ist überholt. Kündigen Sie, ich habe ein neues, besseres Produkt!“'; },
      o: [{ l: 'Umstellen', fx: function (st) { var f = FA.ensure(st), pr = f.prods[0], r = FA.closeProduct(st, pr.id); var k = pr.k === 'police' ? 'police' : 'bauspar'; FA.openProduct(st, k, k === 'police' ? pr.prem || 200 : Math.max(1000, r.back * 0.9), rnd((pr.prem || r.back) * (k === 'police' ? 2.4 : 0.016), 10)); X.mem(st, 'churn', 1); return 'Umgestellt – Rückkaufverlust ' + R.fmtMoney(Math.round(r.loss)) + ' und neue Abschlusskosten.'; } }, { l: 'Was kostet mich das?', fx: function (st, c) { FA.know(st, c.fa.id, 'eigen', 2); FA.trust(st, -6, 'Umdeckung mit Kosten'); return 'Rückkaufverlust plus neue Provision – ein Geschäft vor allem für den Berater.'; } }, { l: 'Nein', fx: function () { return 'Bleibt, wie es ist.'; } }] },
    { id: 'fa_hidden', cat: 'finberater', ic: '🔦', follow: true, inbox: true, cd: 80, when: function (c) { return has(c) && c.fa.a.trans < 50; }, ti: 'Die Kostenaufstellung', t: function (c) { var y = FA.monthlyCost(c.st) * 12 + R.sum(c.st.pc.fa.prods, function (p) { return p.k === 'police' ? (p.prem || 0) * 12 * 0.3 : 0; }); return 'Die jährliche Kostenaufstellung ist da: ' + R.fmtMoney(Math.round(y)) + ' für Beratung und Produkte. Davon war in den Gesprächen nie die Rede.'; },
      o: [{ l: 'Berater zur Rede stellen', fx: function (st, c) { FA.know(st, c.fa.id, 'trans', 2); FA.know(st, c.fa.id, 'ehr', 1); if (c.fa.a.ehr > 55) { FA.trust(st, -2); return 'Er entschuldigt sich und senkt die Gebühr.'; } FA.trust(st, -10, 'Kosten verschwiegen'); return 'Er verweist auf das Kleingedruckte.'; } }, { l: 'Kündigen', fx: function (st) { FA.cancel(st); return 'Gekündigt.'; } }] },
    { id: 'fa_tax', cat: 'finberater', ic: '📉', follow: true, inbox: true, cd: 90, when: function (c) { return has(c) && c.pro && c.p.wage > 120000; }, ti: 'Steuerplanung', t: function (c) { return fan(c) + ' schlägt vor, Verluste im Depot steuerlich mit Gewinnen zu verrechnen und Belege für Werbungskosten sauber zu sammeln.'; },
      o: [{ l: 'Gerne', fx: function (st, c) { var s = rnd(c.p.wage * (c.fa.a.fach / 100) * 0.01, 100); PF.book(st, s, 'Steuererstattung'); if (c.fa) FA.know(st, c.fa.id, 'fach', 1); return 'Erstattung: ' + R.fmtMoney(s) + '.'; } }, { l: 'Kein Interesse', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_retire', cat: 'finberater', ic: '🌅', follow: true, inbox: true, cd: 100, when: function (c) { return has(c) && c.age >= 27; }, ti: 'Planung für das Karriereende', t: function (c) { var s = PF.security(c.st), m = PF.monthly(c.st), need = Math.max(0, (m.fixed - m.passive) * 12 * 40); return fan(c) + ': „Nach dem Karriereende fällt Ihr Gehalt weg. Für Ihren heutigen Lebensstil bräuchten Sie rund ' + R.fmtMoney(rnd(need, 10000)) + ' Vermögen. Aktuell: ' + R.fmtMoney(Math.round(s.nw)) + '.“'; },
      o: [{ l: 'Sparplan einrichten', fx: function (st, c) { var m = PF.monthly(st); FA.ensure(st).plan = { amt: rnd(Math.max(200, m.inc['Nettogehalt'] * 0.2), 50) }; FA.log(st, 'Sparplan', 'Monatlich ' + R.fmtMoney(FA.ensure(st).plan.amt)); return 'Sparplan eingerichtet: ' + R.fmtMoney(FA.ensure(st).plan.amt) + ' pro Monat in einen Aktienkorb.'; } }, { l: 'Lebensstil anpassen', fx: function (st) { var f = PF.ensure(st), o = ['extrem', 'luxus', 'komfortabel', 'bescheiden', 'wg'], i = o.indexOf(f.life); if (i >= 0 && i < 4) PF.setLife(st, o[i + 1]); return 'Lebensstil gesenkt.'; } }, { l: 'Später', fx: function () { return 'Vertagt.'; } }] },
    { id: 'fa_conflict', cat: 'finberater', ic: '⚖️', follow: true, inbox: true, cd: 90, when: function (c) { return has(c) && c.fa.a.unab < 45; }, ti: 'Hausprodukte', t: function (c) { return 'Dir fällt auf: Alle Fonds, die ' + fan(c) + ' empfiehlt, stammen aus dem eigenen Haus.'; },
      o: [{ l: 'Nachfragen', fx: function (st, c) { FA.know(st, c.fa.id, 'unab', 2); if (c.fa.a.trans > 55) return 'Er bestätigt offen: Er darf nur Hausprodukte vermitteln.'; FA.trust(st, -5, 'Hausprodukte verschwiegen'); return 'Er weicht aus.'; } }, { l: 'Egal, solange es läuft', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_sparplan', cat: 'finberater', ic: '🌱', follow: true, inbox: true, cd: 80, when: function (c) { return has(c) && !c.st.pc.fa.plan && PF.monthly(c.st).cf > 1000; }, ti: 'Sparplan', t: function (c) { return fan(c) + ' schlägt einen monatlichen Sparplan in einen breit gestreuten Aktienkorb vor.'; },
      o: [{ l: 'Einrichten (10 % des Nettos)', fx: function (st) { var m = PF.monthly(st); FA.ensure(st).plan = { amt: rnd(m.inc['Nettogehalt'] * 0.1, 50) }; return 'Sparplan: ' + R.fmtMoney(FA.ensure(st).plan.amt) + '/Monat.'; } }, { l: 'Einrichten (25 % des Nettos)', fx: function (st) { var m = PF.monthly(st); FA.ensure(st).plan = { amt: rnd(m.inc['Nettogehalt'] * 0.25, 50) }; return 'Sparplan: ' + R.fmtMoney(FA.ensure(st).plan.amt) + '/Monat.'; } }, { l: 'Nein danke', fx: function () { return 'Kein Sparplan.'; } }] },
    { id: 'fa_annual', cat: 'finberater', ic: '📅', follow: true, inbox: true, cd: 45, when: function (c) { return has(c) && c.st.phase === 'preseason'; }, ti: 'Jahresgespräch', t: function (c) { var f = PF.ensure(c.st), h = f.hist, y = h.length > 13 ? h[h.length - 1].nw - h[h.length - 14].nw : 0; var honest = c.fa.a.ehr > 55; return fan(c) + ' präsentiert die Jahresbilanz: Nettovermögen ' + (honest ? (y >= 0 ? '+' : '') + R.fmtMoney(Math.round(y)) : '„deutlich im Plus“') + '. ' + (honest ? 'Die Kosten nennt er ungefragt.' : 'Zu den Kosten sagt er nichts.'); },
      o: [{ l: 'Zufrieden', fx: function (st, c) { FA.know(st, c.fa.id, 'ehr', 1); FA.trust(st, 2); return 'Weiter wie bisher.'; } }, { l: 'Genaue Zahlen verlangen', fx: function (st, c) { FA.know(st, c.fa.id, 'trans', 2); return 'Laufende Kosten: ' + R.fmtMoney(FA.monthlyCost(st) * 12) + ' pro Jahr.'; } }, { l: 'Betreuungsform ändern', fx: function (st) { var f = FA.ensure(st); FA.setMode(st, f.con.mode === 'umfassend' ? 'begleitet' : 'umfassend'); return 'Neu: ' + FA.MODES[f.con.mode].n + '.'; } }] },
    { id: 'fa_steuermodell', cat: 'finberater', ic: '🏚️', follow: true, inbox: true, cd: 120, when: function (c) { return has(c) && c.fa.a.eigen > 65 && c.pro && c.p.wage > 100000; }, ti: '„Steuersparimmobilie“', t: function (c) { return fan(c) + ' bietet eine Neubauwohnung als Steuersparmodell an: 100 % finanziert, „die Steuer zahlt die Rate“. Der Kaufpreis liegt deutlich über dem Marktwert.'; },
      o: [{ l: 'Kaufen', fx: function (st) { var r = PF.buyHome(st, 'wohnung', true, 0.2); if (!r.ok) return r.why; r.home.price = rnd(r.home.price * 1.25, 1000); r.home.idx0 = PF.regionIdx(st) * 1.25; X.mem(st, 'steuermodell', 1); return 'Gekauft – der Marktwert liegt rund 20 % unter dem Kaufpreis.'; } }, { l: 'Unabhängig prüfen lassen', fx: function (st, c) { PF.book(st, -900, 'Gutachten'); FA.know(st, c.fa.id, 'eigen', 2); FA.know(st, c.fa.id, 'ehr', 1); FA.trust(st, -12, 'Überteuertes Steuersparmodell'); return 'Das Gutachten: deutlich überteuert, hohe Vertriebsprovision.'; } }, { l: 'Ablehnen', fx: function () { return 'Abgelehnt.'; } }] },
    { id: 'fa_realty', cat: 'finberater', ic: '🏢', follow: true, inbox: true, cd: 60, when: function (c) { return has(c) && R.realty && (R.realty.ensure(c.st).offers || []).length && PF.netWorth(c.st) > 400000; }, ti: 'Immobilieninvestition prüfen', t: function (c) { var o = R.realty.ensure(c.st).offers.slice().sort(function (a, b) { return b.netYield - a.netYield; })[0]; return fan(c) + ' hat das Angebot „' + o.name + '“ geprüft: Nettorendite ' + (o.netYield * 100).toFixed(1).replace('.', ',') + ' %, Eigenkapitalbedarf ' + R.fmtMoney(o.equityNeed) + '. ' + (c.fa.a.immo > 60 ? (o.risk >= 3 ? 'Er rät wegen des Risikos ab.' : 'Er hält es für solide.') : 'Er findet es „interessant“.'); },
      o: [{ l: 'Zum Immobilienmarkt', fx: function (st, c) { FA.know(st, c.fa.id, 'immo', 1); X.setFlag(st, 'reMarket', 1); return 'Angebote unter „Meine Finanzen → Anlageimmobilien“.'; } }, { l: 'Kein Interesse', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_power', cat: 'finberater', ic: '🖊️', follow: true, inbox: true, cd: 30, when: has, ti: 'Vollmacht gewünscht', t: function (c) { return fan(c) + ': „Für die umfassende Betreuung brauche ich eine Handelsvollmacht. Ohne sie darf ich keine Wertpapiergeschäfte für Sie ausführen.“'; },
      o: [{ l: 'Vollmacht erteilen', fx: function (st) { FA.setPower(st, true); return 'Vollmacht erteilt – du wirst über Umschichtungen informiert.'; } }, { l: 'Keine Vollmacht', fx: function (st) { FA.setMode(st, 'begleitet'); return 'Weiter als begleitete Finanzplanung.'; } }] },
    { id: 'fa_crash', cat: 'finberater', ic: '🌪️', cd: 30, w: 1.2, when: function (c) { return PF.stocks(c.st) + PF.crypto(c.st) > 20000 && (c.st.pc.fin.drawdown || 0) > 0.2; }, ti: 'Kurssturz im Depot', t: function (c) { return 'Dein Vermögen ist ' + Math.round((c.st.pc.fin.drawdown || 0) * 100) + ' % unter seinem Höchststand. ' + (c.fa ? fan(c) + (c.fa.a.lang > 60 ? ' rät: „Ruhe bewahren, die Streuung trägt.“' : ' rät hektisch zum Verkauf.') : 'Was tust du?'); },
      o: [{ l: 'Halten', fx: function (st) { return X.eff(st, { stress: 2 }); } }, { l: 'Alles verkaufen', fx: function (st) { var w = PF.wallet(st); Object.keys(w.portfolio).forEach(function (s) { if (w.portfolio[s]) PF.sell(st, s, w.portfolio[s].qty); }); FA.log(st, 'Panikverkauf', 'Depot im Kurssturz aufgelöst'); return X.eff(st, { stress: -3 }) + '. Verluste realisiert.'; } }, { l: 'Nachkaufen', req: function (c) { return PF.liquid(c.st) > 10000; }, fx: function (st) { var pool = FA.stockPool(st).slice(0, 6), amt = PF.liquid(st) * 0.15; pool.forEach(function (s) { PF.buy(st, s, amt / pool.length, 'self'); }); return 'Nachgekauft.'; } }] },
    { id: 'fa_honorar_check', cat: 'finberater', ic: '🔬', cd: 120, when: function (c) { return !!c.fa && c.fa.g !== 'honorar' && PF.netWorth(c.st) > 150000; }, ti: 'Angebot: Depot-Check', t: function () { return 'Eine unabhängige Honorarkanzlei bietet einen einmaligen Depot- und Vertragscheck für 900 € an.'; },
      o: [{ l: 'Check machen', fx: function (st, c) { PF.book(st, -900, 'Beratungskosten'); var a = c.fa; FA.know(st, a.id, 'eigen', 1); FA.know(st, a.id, 'qual', 1); var q = FA.quality(a); return q >= 60 ? 'Ergebnis: ordentlich aufgestellt, Kosten im Rahmen.' : 'Ergebnis: zu teuer, zu wenig gestreut, unnötige Produkte.'; } }, { l: 'Nicht nötig', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_vv_offer', cat: 'finberater', ic: '🏛️', cd: 150, when: function (c) { return PF.netWorth(c.st) > 1500000 && (!c.fa || c.fa.g !== 'vv'); }, ti: 'Ein Family Office meldet sich', t: function () { return 'Ein Family Office bietet an, dein Vermögen ganzheitlich zu verwalten: 1,2 % pro Jahr, Mindestvermögen 500.000 €.'; },
      o: [{ l: 'Anbieter ansehen', fx: function (st) { X.setFlag(st, 'faMarket', 1); return 'Unter „Meine Finanzen“ findest du die Vermögensverwalter.'; } }, { l: 'Kein Bedarf', fx: function () { return 'Okay.'; } }] },
    { id: 'fa_leaves', cat: 'finberater', ic: '👋', cd: 200, w: 0.3, when: has, ti: 'Dein Berater wechselt den Arbeitgeber', t: function (c) { return fan(c) + ' wechselt zu einem anderen Haus und fragt, ob du mitkommst.'; },
      o: [{ l: 'Mitgehen', fx: function (st, c) { var g = R.pick(Object.keys(FA.GROUPS)); c.fa.g = g; c.fa.firm = R.pick(FA.GROUPS[g].firms); return 'Neuer Arbeitgeber: ' + c.fa.firm + '.'; } }, { l: 'Bei der Firma bleiben (neuer Berater)', fx: function (st, c) { var nb = FA.ensure(st).db.filter(function (x) { return x.firm === c.fa.firm && x.id !== c.fa.id; })[0]; if (nb) { FA.ensure(st).cur = nb.id; return 'Neuer Ansprechpartner: ' + nb.n + '.'; } FA.cancel(st); return 'Die Betreuung endet.'; } }] },
    { id: 'fa_saves', cat: 'finberater', ic: '🙌', cd: 100, when: function (c) { return has(c) && c.fa.a.lang + c.fa.a.ehr > 135 && PF.loansDebt(c.st) > 0; }, ti: 'Dein Berater bremst', t: function (c) { return fan(c) + ' empfiehlt, den teuren Konsumentenkredit vorzeitig zu tilgen – obwohl er daran nichts verdient.'; },
      o: [{ l: 'Tilgen', fx: function (st, c) { var l = PF.ensure(st).loans[0]; var r = l ? PF.repayLoan(st, l.id) : { ok: false }; FA.trust(st, 5, 'Uneigennütziger Rat'); FA.know(st, c.fa.id, 'lang', 2); return r.ok ? 'Kredit getilgt.' : 'Dafür reicht das Geld noch nicht.'; } }, { l: 'Später', fx: function () { return 'Vertagt.'; } }] },
    { id: 'fa_agent_coop', cat: 'finberater', ic: '🤝', cd: 120, when: function (c) { return has(c) && !!c.ag; }, ti: 'Spieler- und Finanzberater', t: function (c) { return an2(c) + ' und ' + fan(c) + ' wollen sich abstimmen: Vertragsprämien sollen direkt in die Finanzplanung fließen.' + (c.ag.a.comm > 70 && c.fa.a.eigen > 60 ? ' Du hörst, dass beide sich gegenseitig Kunden zuschieben.' : ''); },
      o: [{ l: 'Zusammenarbeit erlauben', fx: function (st, c) { if (c.ag.a.comm > 70 && c.fa.a.eigen > 60) { X.mem(st, 'advisorRing', 1); return 'Sie arbeiten zusammen – zu ihrem Vorteil?'; } FA.trust(st, 2); if (R.ag) R.ag.trust(st, 2); return 'Die Abstimmung spart dir Zeit.'; } }, { l: 'Strikt getrennt halten', fx: function () { return 'Jeder bleibt in seinem Bereich.'; } }] }
  ]);
  function an2(c) { return c.ag ? c.ag.n : 'Dein Spielerberater'; }
})(RFM);
