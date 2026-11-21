// Persönliche Finanzen der Spielerkarriere: Privatkonto, Steuern, Prämien, Sponsoren, Lebensstil, Wohnen,
// Kredite und Dispo, finanzielle Sicherheit und Finanzstress. Aktien und Kryptowährungen laufen über die
// bestehende Börse (E.buyAsset/E.sellAsset), Anlageimmobilien über das bestehende Immobilienmodul (R.realty)
// – das Privatvermögen ist dafür ein eigenes „Konto“ (wallet) mit derselben Struktur wie ein Vereinskonto.
(function (R) {
  var D = R.data, W = R.world, S = R.season, C = R.pc, E = R.econ, X = R.cx, RE = R.realty;
  var PF = R.pf = {};
  var HB = X.HB, clamp = X.clamp, MT = 4;
  function tick(st) { return st.tick || 0; }
  function news(st, t, x) { if (S.news) S.news(st, t, x, 'finanzen'); }
  function rnd(v, s) { s = s || 100; return Math.round(v / s) * s; }

  // ---------- Steuern und Abgaben (vereinfachte, länderspezifisch konfigurierbare Modelle) ----------
  PF.TAX = {
    Deutschland: { br: [[12000, 0], [62000, 0.30], [280000, 0.42], [1e15, 0.45]], soc: 0.20, socCap: 90000, cap: 0.264, n: 'Einkommensteuer progressiv (0/30/42/45 %), Sozialabgaben 20 % bis 90.000 €, Abgeltungsteuer 26,4 % auf Kursgewinne' },
    'Österreich': { br: [[13000, 0], [60000, 0.35], [1000000, 0.50], [1e15, 0.55]], soc: 0.18, socCap: 85000, cap: 0.275, n: 'Vereinfachtes österreichisches Modell' },
    Schweiz: { br: [[18000, 0], [80000, 0.20], [250000, 0.30], [1e15, 0.38]], soc: 0.12, socCap: 150000, cap: 0, n: 'Vereinfachtes Schweizer Modell (keine Kapitalgewinnsteuer)' }
  };
  PF.taxCfg = function (st) { var n = st.pc && st.pc.cx ? st.pc.cx.prof.nat : 'Deutschland'; return PF.TAX[n] || PF.TAX.Deutschland; };
  PF.taxOf = function (st, gross) {
    var T = PF.taxCfg(st), tax = 0, lo = 0;
    T.br.forEach(function (b) { if (gross > lo) tax += (Math.min(gross, b[0]) - lo) * b[1]; lo = b[0]; });
    return tax + Math.min(gross, T.socCap) * T.soc;
  };
  PF.effRate = function (st, gross) { return gross > 0 ? PF.taxOf(st, gross) / gross : 0; };

  // ---------- Lebensstil, Wohnen, Auto, Versicherungen ----------
  PF.LIFE = {
    eltern: { n: 'Bei den Eltern', m: 250, prest: -1, d: 'Nur für Minderjährige: Taschengeld, kaum Kosten.' },
    wg: { n: 'WG / kleine Wohnung', m: 850, prest: -0.5, d: 'Günstig wohnen, wenig Komfort – typisch für junge Profis mit kleinem Gehalt.' },
    bescheiden: { n: 'Bescheiden', m: 1900, prest: -0.3, d: 'Niedrige Ausgaben, viel finanzieller Spielraum, wenig Prestige.' },
    komfortabel: { n: 'Komfortabel', m: 4200, prest: 0, d: 'Ausgewogen, angemessener Lebensstandard.' },
    luxus: { n: 'Luxuriös', m: 13000, prest: 0.4, d: 'Mehr Prestige und öffentliche Aufmerksamkeit, aber hohe Fixkosten.' },
    extrem: { n: 'Extrem luxuriös', m: 42000, prest: 0.8, d: 'Sehr hohe Fixkosten – abhängig von lukrativen Verträgen.' }
  };
  PF.HOUSING_SHARE = 0.38; // Anteil Miete am Lebensstil – entfällt mit eigenem Haus
  PF.CARS = { keins: { n: 'Kein Auto', m: 0, price: 0 }, klein: { n: 'Kleinwagen', m: 350, price: 18000 }, mittel: { n: 'Mittelklasse', m: 650, price: 45000 }, sport: { n: 'Sportwagen', m: 2200, price: 160000 }, luxus: { n: 'Luxuslimousine', m: 4800, price: 320000 } };
  PF.INS = { haft: { n: 'Haftpflicht & Hausrat', m: 40, d: 'Schützt vor teuren Schadensfällen.' }, bu: { n: 'Sportinvaliditätsversicherung', mPct: 0.012, d: 'Zahlt bei einem verletzungsbedingten Karriereende das Doppelte des letzten Jahresgehalts.' }, pflege: { n: 'Private Zusatzversicherung', m: 180, d: 'Bessere Behandlung, schnellere Termine (kürzere Ausfallzeiten).' } };
  PF.HOMES = { wohnung: { n: 'Eigentumswohnung', base: 420000, rentY: 0.032 }, haus: { n: 'Einfamilienhaus', base: 850000, rentY: 0.028 }, villa: { n: 'Villa', base: 3200000, rentY: 0.022 } };
  PF.LOANS = { konsum: { n: 'Konsumentenkredit', spread: 0.045, years: 5 }, auto: { n: 'Autofinanzierung', spread: 0.025, years: 4 } };

  PF.ensure = function (st) {
    var pc = st.pc; if (!pc) return null;
    if (!pc.fin) {
      var p = C.player(st), minor = p && p.age < 18;
      pc.fin = { w: { id: 'PCW', name: 'Privatvermögen', short: 'Privat', cash: pc.cash || 0, savings: 0, portfolio: {}, fin: { season: {} }, loans: [], league: 3, tickets: { steh: 0, sitz: 0 } },
        life: minor ? 'eltern' : 'bescheiden', car: 'keins', ins: { haft: true }, homes: [], loans: [], spons: [], hist: [], ledger: [], last: { a: 0, g: 0 }, lastMonth: tick(st), tip: null, missed: 0, peak: 0, homeId: null, mode: 'self' };
    }
    var f = pc.fin; f.w.fin = f.w.fin || { season: {} }; f.w.loans = f.w.loans || [];
    return f;
  };
  PF.wallet = function (st) { return PF.ensure(st).w; };
  PF.book = function (st, amt, cat) { var w = PF.wallet(st); amt = Math.round(amt); w.cash += amt; E.book(w, cat || (amt >= 0 ? 'Einnahmen' : 'Ausgaben'), amt); st.pc.cash = w.cash; };
  PF.minor = function (st) { var p = C.player(st); return !!(p && p.age < 18); };

  // ---------- Vermögen ----------
  PF.stocks = function (st) { return E.portfolioValue(st, PF.wallet(st), 'stocks'); };
  PF.crypto = function (st) { return E.portfolioValue(st, PF.wallet(st), 'crypto'); };
  PF.realty = function (st) { var w = PF.wallet(st); if (!RE) return { value: 0, debt: 0, cfY: 0, rentY: 0, costY: 0, debtServiceY: 0 }; RE.ensure(st); return RE.portfolio(st, w); };
  PF.homesValue = function (st) { return R.sum(PF.ensure(st).homes, function (h) { return h.value; }); };
  PF.homesDebt = function (st) { return R.sum(PF.ensure(st).homes, function (h) { return h.loan ? h.loan.bal : 0; }); };
  PF.loansDebt = function (st) { return R.sum(PF.ensure(st).loans, function (l) { return l.amount; }); };
  PF.liquid = function (st) { var w = PF.wallet(st); return w.cash + w.savings; };
  PF.netWorth = function (st) {
    if (!st.pc) return 0; var rp = PF.realty(st);
    return PF.liquid(st) + PF.stocks(st) + PF.crypto(st) + PF.homesValue(st) + rp.value - PF.homesDebt(st) - rp.debt - PF.loansDebt(st);
  };
  PF.debt = function (st) { return PF.homesDebt(st) + PF.realty(st).debt + PF.loansDebt(st) + Math.max(0, -PF.wallet(st).cash); };

  // ---------- Monatliche Rechnung (Prognose für Cockpit und Sicherheit) ----------
  PF.monthly = function (st) {
    var f = PF.ensure(st), p = C.player(st), pc = st.pc, out = { inc: {}, exp: {} };
    var gross = p ? p.wage : 0, spY = R.sum(f.spons, function (s) { return s.y; });
    var net = gross + spY - PF.taxOf(st, gross + spY);
    out.inc['Nettogehalt'] = Math.round((gross - PF.taxOf(st, gross)) / 12);
    if (PF.sideJob(st)) out.inc['Nebenjob (netto)'] = PF.sideJob(st);
    if (spY) out.inc['Sponsoring (netto)'] = Math.round((net - (gross - PF.taxOf(st, gross))) / 12);
    var rp = PF.realty(st); if (rp.rentY) out.inc['Mieten (Anlageimmobilien)'] = Math.round(rp.rentY / 12);
    f.homes.forEach(function (h) { if (h.k === 'rent') out.inc['Mieten (Wohnungen)'] = (out.inc['Mieten (Wohnungen)'] || 0) + Math.round(h.rentY / 12); });
    var L = PF.LIFE[f.life] || PF.LIFE.komfortabel, own = f.homes.some(function (h) { return h.id === f.homeId; });
    out.exp['Lebenshaltung'] = Math.round(L.m * (own ? 1 - PF.HOUSING_SHARE : 1));
    if (PF.CARS[f.car].m) out.exp['Auto'] = PF.CARS[f.car].m;
    var ins = 0; Object.keys(f.ins).forEach(function (k) { if (!f.ins[k]) return; var I = PF.INS[k]; ins += I.m || Math.round(gross * I.mPct / 12); }); if (ins) out.exp['Versicherungen'] = ins;
    var hl = R.sum(f.homes, function (h) { return (h.loan ? h.loan.pay : 0) + h.value * 0.01 / 12; }); if (hl) out.exp['Wohneigentum (Rate & Instandhaltung)'] = Math.round(hl);
    if (rp.costY || rp.debtServiceY) out.exp['Anlageimmobilien (Kosten & Raten)'] = Math.round((rp.costY + rp.debtServiceY) / 12);
    var ll = R.sum(f.loans, function (l) { return l.pay; }); if (ll) out.exp['Kreditraten'] = Math.round(ll);
    var ag = pc.ag && pc.ag.con; if (ag && ag.fee && p) out.exp['Spielerberater'] = Math.round(p.wage * ag.fee / 12);
    if (R.fa) { var fc = R.fa.monthlyCost(st); if (fc) out.exp['Finanzberatung'] = fc; }
    if (f.w.cash < 0) out.exp['Dispozinsen'] = Math.round(-f.w.cash * 0.11 / 12);
    out.inSum = R.sum(Object.keys(out.inc), function (k) { return out.inc[k]; });
    out.exSum = R.sum(Object.keys(out.exp), function (k) { return out.exp[k]; });
    out.cf = out.inSum - out.exSum; out.fixed = out.exSum;
    out.passive = (out.inc['Mieten (Anlageimmobilien)'] || 0) + (out.inc['Mieten (Wohnungen)'] || 0);
    return out;
  };

  // ---------- Finanzielle Sicherheit (objektiv) und Finanzstress (subjektiv) ----------
  PF.LEVELS = ['', 'Finanziell unabhängig', 'Sehr sicher', 'Stabil', 'Angespannt', 'Kritisch', 'Existenzgefährdet'];
  PF.LEVEL_TXT = ['', 'Kapital und nachhaltige Einnahmen tragen den Lebensunterhalt langfristig.', 'Hohe Reserven, geringe Verpflichtungen.', 'Einkommen deckt die Ausgaben, angemessene Rücklagen.', 'Begrenzte Reserven oder hohe Verpflichtungen.', 'Drohende Liquiditätsprobleme, abhängig von kurzfristigen Einnahmen.', 'Zahlungsunfähigkeit droht oder ist eingetreten.'];
  PF.odLimit = function (st) { var p = C.player(st); if (!p || p.youth || PF.minor(st)) return 0; return rnd((p.wage - PF.taxOf(st, p.wage)) / 12 * 2, 1000); };
  PF.security = function (st) {
    if (!st.pc || !st.pc.fin) return { lvl: 3, months: 0 };
    var m = PF.monthly(st), p = C.player(st), w = PF.wallet(st), liq = PF.liquid(st);
    var semi = liq + PF.stocks(st) * 0.75 + PF.crypto(st) * 0.4;
    var fixed = Math.max(1, m.fixed), gap = Math.max(1, fixed - m.passive);
    var months = semi / gap, nw = PF.netWorth(st);
    var contract = p && !p.youth ? p.contract : 0;
    var debtService = (m.exp['Kreditraten'] || 0) + (m.exp['Wohneigentum (Rate & Instandhaltung)'] || 0) + (m.exp['Anlageimmobilien (Kosten & Raten)'] || 0);
    var dsr = debtService / Math.max(1, m.inSum);
    var vol = (PF.crypto(st) + PF.stocks(st) * 0.5) / Math.max(1, Math.abs(nw) + 1);
    var lvl;
    if (w.cash < -PF.odLimit(st) - 1 || (liq < 0 && m.cf < 0 && semi <= 0)) lvl = 6;
    else if ((months < 2 && m.cf < 0) || (contract <= 0 && months < 4 && !(p && p.youth)) || dsr > 0.75) lvl = 5;
    else if (months < 6 || m.cf < 0 || dsr > 0.45) lvl = 4;
    else if (m.passive >= fixed && nw >= fixed * 12 * 15) lvl = 1;
    else if (months >= 36 && dsr < 0.25) lvl = 2;
    else lvl = 3;
    var cx = st.pc.cx, per = cx ? cx.per : { conf: 50, disc: 50 };
    var stress = clamp([0, 2, 8, 18, 40, 65, 90][lvl] + vol * 30 + (contract <= 1 && !(p && p.youth) ? 10 : 0) + (st.pc.fin.drawdown || 0) * 40 - (per.conf - 50) / 5 - (per.disc - 50) / 8, 0, 100);
    return { lvl: lvl, months: Math.round(months * 10) / 10, cf: m.cf, dsr: dsr, vol: vol, stress: Math.round(stress), nw: nw, liq: liq, m: m };
  };

  // ---------- Sponsoren ----------
  PF.addSponsor = function (st, o) { var f = PF.ensure(st); f.spons.push({ n: o.n, y: rnd(o.y, 100), until: tick(st) + (o.weeks || 52) }); X.chron(st, 'sponsor', '🤝', 'Sponsorvertrag: ' + o.n, R.fmtMoney(o.y) + ' pro Jahr', 2); };

  // ---------- Wöchentlicher Ablauf ----------
  // Gehalt kommt über C.pay (Basismodul) brutto herein und wird hier versteuert verbucht
  C.pay = function (st, amt, cat) {
    if (!st.pc) return; PF.ensure(st); var p = C.player(st);
    var gross = (p ? p.wage : 0) + R.sum(st.pc.fin.spons, function (s) { return s.y; });
    var r = PF.effRate(st, gross);
    PF.book(st, amt, cat === 'Gehalt' ? 'Gehalt (brutto)' : cat || 'Einnahmen');
    if (r > 0 && amt > 0) PF.book(st, -amt * r, 'Steuern & Abgaben');
  };
  PF.weekly = function (st) {
    var f = PF.ensure(st), p = C.player(st), pc = st.pc, w = f.w; if (!p) return;
    var t = tick(st), cx = pc.cx;
    // Prämien: Einsatz und Tore (Liga), Nationalmannschaft
    var da = p.stats.apps - f.last.a, dg = p.stats.goals - f.last.g; if (da < 0) { da = p.stats.apps; dg = p.stats.goals; }
    if (!p.youth && (da > 0 || dg > 0)) { var b = da * p.wage * 0.004 + dg * p.wage * (HB ? 0.0012 : 0.006); if (b > 0) C.pay(st, rnd(b, 10), 'Prämien'); }
    f.last = { a: p.stats.apps, g: p.stats.goals };
    var sj = PF.sideJob(st); if (sj) PF.book(st, Math.round(sj * 12 / 52), 'Nebenjob');
    if (pc.nat > (f.natPaid || 0)) { C.pay(st, (pc.nat - (f.natPaid || 0)) * (HB ? 1500 : 12000), 'Nationalmannschaftsprämie'); f.natPaid = pc.nat; }
    // Sponsoren
    f.spons = f.spons.filter(function (s) { return s.until > t; });
    f.spons.forEach(function (s) { C.pay(st, s.y / E.WEEKS, 'Sponsoring'); });
    var plan = cx && cx.plan.a || {};
    if (plan.sponsor && !f.spons.length && pc.fame >= 18 && R.chance(0.04 * plan.sponsor)) PF.addSponsor(st, { n: R.pick(['Regionaler Autohändler', 'Energydrink-Marke', 'Sportuhren-Hersteller', 'Bäckereikette', 'Versicherungsagentur']), y: Math.max(2000, p.wage * (0.03 + pc.fame / 900)), weeks: 52 });
    // Monatsende: Lebenshaltung, Kredite, Wohneigentum, Dispo
    if (t > 0 && t % MT === 0 && f.lastMonth !== t) { f.lastMonth = t; PF.month(st); }
    // Selbstverwaltung kostet Zeit: ohne Planeinheit oder Berater häufen sich kleine Fehler
    if (!plan.finance && !(R.fa && R.fa.delegated(st)) && (PF.stocks(st) + PF.crypto(st) + f.homes.length * 1e5) > 20000 && R.chance(0.05)) { X.eff(st, { stress: 2 }); if (R.chance(0.3)) PF.book(st, -rnd(Math.max(150, PF.liquid(st) * 0.002), 10), 'Gebühren & Versäumnisse'); }
    // Finanzstress fließt (gedeckelt) in die Persönlichkeit
    var sec = PF.security(st); f.sec = sec.lvl; f.stress = sec.stress;
    if (cx) { var target = sec.stress * 0.6 + cx.per.stress * 0.4; cx.per.stress = clamp(cx.per.stress + clamp((target - cx.per.stress) * 0.15, -2, 3), 0, 100); }
    if (sec.lvl >= 5 && !X.mem(st, 'secWarn' + st.season)) { X.mem(st, 'secWarn' + st.season, 1); X.chron(st, 'finanzen', '⚠️', 'Finanzen: ' + PF.LEVELS[sec.lvl], PF.LEVEL_TXT[sec.lvl], 3); news(st, 'Finanzielle Engpässe', PF.LEVEL_TXT[sec.lvl]); }
    // Lebensstil: Prestige und Aufmerksamkeit
    var L = PF.LIFE[f.life]; if (L && cx && L.prest) { cx.per.pop = clamp(cx.per.pop + L.prest * 0.1, 0, 100); if (L.prest > 0) C.addFame(st, L.prest * 0.04); }
    // Verlauf
    if (t % MT === 0) { var nw = PF.netWorth(st); f.peak = Math.max(f.peak || 0, nw); f.drawdown = f.peak > 50000 ? clamp((f.peak - nw) / f.peak, 0, 1) : 0; f.hist.push({ t: t, s: st.season, nw: Math.round(nw), liq: Math.round(PF.liquid(st)), debt: Math.round(PF.debt(st)) }); if (f.hist.length > 700) f.hist.splice(0, f.hist.length - 700); }
    pc.cash = w.cash;
  };
  PF.month = function (st) {
    var f = PF.ensure(st), p = C.player(st), m = PF.monthly(st), w = f.w;
    var L = PF.LIFE[f.life], own = f.homes.some(function (h) { return h.id === f.homeId; });
    PF.book(st, -Math.round(L.m * (own ? 1 - PF.HOUSING_SHARE : 1)), 'Lebenshaltung');
    if (PF.CARS[f.car].m) PF.book(st, -PF.CARS[f.car].m, 'Auto');
    Object.keys(f.ins).forEach(function (k) { if (!f.ins[k]) return; var I = PF.INS[k]; PF.book(st, -(I.m || Math.round((p ? p.wage : 0) * I.mPct / 12)), 'Versicherungen'); });
    // Wohneigentum: Rate (Zins/Tilgung), Instandhaltung, Wert folgt dem Immobilienmarkt der Region
    var idx = PF.regionIdx(st);
    f.homes.forEach(function (h) {
      if (h.loan && h.loan.bal > 0) { var z = h.loan.bal * h.loan.rate / 12, tl = Math.min(h.loan.bal, Math.max(0, h.loan.pay - z)); h.loan.bal -= tl; PF.book(st, -Math.round(z), 'Zinsen Wohneigentum'); PF.book(st, -Math.round(tl), 'Tilgung Wohneigentum'); if (h.loan.bal < 1) h.loan = null; }
      PF.book(st, -Math.round(h.value * 0.01 / 12), 'Instandhaltung');
      if (h.k === 'rent') { var occ = h.vacant > 0 ? 0 : 1; if (h.vacant > 0) h.vacant--; if (occ) PF.book(st, Math.round(h.rentY / 12), 'Mieteinnahmen'); }
      h.value = rnd(h.price * idx / h.idx0, 1000);
      if (R.chance(0.012)) { var dmg = rnd(h.value * R.randRange(0.004, 0.02), 100); PF.book(st, -dmg, 'Reparaturen'); news(st, 'Reparatur: ' + h.n, 'Unerwartete Kosten: ' + R.fmtMoney(dmg) + '.'); }
      if (h.k === 'rent' && !h.vacant && R.chance(0.01)) { h.vacant = R.randInt(1, 4); news(st, 'Mietausfall: ' + h.n, 'Der Mieter ist ausgezogen. ' + h.vacant + ' Monat(e) Leerstand.'); }
    });
    f.loans.forEach(function (l) { var z = l.amount * l.rate / 12, tl = Math.min(l.amount, Math.max(0, l.pay - z)); l.amount -= tl; PF.book(st, -Math.round(z + tl), 'Kreditraten'); });
    f.loans = f.loans.filter(function (l) { return l.amount > 1; }); w.loans = f.loans;
    if (w.cash < 0) PF.book(st, -Math.round(-w.cash * 0.11 / 12), 'Dispozinsen');
    // Zahlungsunfähigkeit droht: Notverkäufe in fester Reihenfolge, Lebensstil sinkt
    if (w.cash < -PF.odLimit(st)) PF.emergency(st);
  };
  PF.regionIdx = function (st) { if (!RE) return 1; var re = RE.ensure(st), ks = Object.keys(re.regions); return ks.length ? R.avg(ks, function (k) { return re.regions[k].idx; }) : 1; };
  PF.emergency = function (st) {
    var f = PF.ensure(st), w = f.w, lim = -PF.odLimit(st), sold = [];
    function need() { return w.cash < lim; }
    Object.keys(w.portfolio).filter(function (s) { return !!st.market.crypto[s]; }).concat(Object.keys(w.portfolio).filter(function (s) { return !st.market.crypto[s]; })).forEach(function (sym) {
      if (!need() || !w.portfolio[sym]) return; var r = PF.sell(st, sym, w.portfolio[sym].qty); if (r.ok) sold.push(sym);
    });
    f.homes.filter(function (h) { return h.k === 'rent'; }).concat(f.homes.filter(function (h) { return h.k !== 'rent'; })).forEach(function (h) { if (need()) { PF.sellHome(st, h.id, true); sold.push(h.n); } });
    if (need() && RE) RE.propsOf(st, w).forEach(function (pr) { if (need()) { RE.sell(st, w, pr.id); sold.push(pr.name); } });
    var order = ['extrem', 'luxus', 'komfortabel', 'bescheiden', 'wg']; if (need() && order.indexOf(f.life) >= 0 && f.life !== 'wg') f.life = order[order.indexOf(f.life) + 1];
    if (need() && f.car !== 'keins') f.car = 'keins';
    f.missed++;
    X.chron(st, 'finanzen', '🆘', 'Notverkäufe', sold.length ? 'Verkauft: ' + sold.join(', ') + '.' : 'Nichts mehr zu verkaufen. Lebensstil reduziert.', 3);
    news(st, 'Finanzielle Notlage', 'Das Konto ist über dem Dispo. ' + (sold.length ? 'Notverkäufe: ' + sold.join(', ') + '.' : 'Der Lebensstil musste reduziert werden.'));
    X.eff(st, { stress: 12, conf: -4 });
  };
  PF.seasonEnd = function (st) {
    var f = PF.ensure(st), p = C.player(st), pc = st.pc, w = f.w, s = pc.seasons[pc.seasons.length - 1];
    if (p && s && !p.youth) {
      if ((pc.titles || []).some(function (t) { return t === 'Meister ' + st.season; })) C.pay(st, rnd(p.wage * 0.15, 1000), 'Meisterprämie');
      if ((pc.titles || []).some(function (t) { return t === 'Pokalsieger ' + st.season; })) C.pay(st, rnd(p.wage * 0.08, 1000), 'Pokalprämie');
      var prev = pc.seasons[pc.seasons.length - 2]; if (prev && !prev.youth && s.clubId === prev.clubId && s.league && prev.league && s.pos && s.pos <= 2 && s.league > 1 && st.clubs[s.clubId] && st.clubs[s.clubId].league < s.league) C.pay(st, rnd(p.wage * 0.1, 1000), 'Aufstiegsprämie');
    }
    f.ledger.push({ season: st.season, b: R.clone(w.fin.season) }); if (f.ledger.length > 30) f.ledger.shift();
    w.fin.season = {};
  };

  // ---------- Handlungen ----------
  PF.setLife = function (st, k) { var f = PF.ensure(st); if (!PF.LIFE[k]) return { ok: false }; if (k === 'eltern' && !PF.minor(st)) return { ok: false, why: 'Nur für Minderjährige.' }; if (PF.minor(st) && k !== 'eltern' && k !== 'bescheiden' && k !== 'wg') return { ok: false, why: 'Mit unter 18 wohnst du noch bei deinen Eltern.' }; var old = f.life; f.life = k; if (old !== k) X.chron(st, 'finanzen', '🏷️', 'Lebensstil: ' + PF.LIFE[k].n, PF.LIFE[k].d, 1); return { ok: true }; };
  PF.setCar = function (st, k, finance) {
    var f = PF.ensure(st), K2 = PF.CARS[k]; if (!K2) return { ok: false }; if (PF.minor(st) && k !== 'keins') return { ok: false, why: 'Erst ab 18.' };
    if (K2.price && !finance) { if (PF.liquid(st) < K2.price) return { ok: false, why: 'Nicht genug Geld – Finanzierung möglich.' }; PF.book(st, -K2.price, 'Autokauf'); }
    if (K2.price && finance) { var r = PF.takeLoan(st, 'auto', K2.price); if (!r.ok) return r; PF.book(st, -K2.price, 'Autokauf'); }
    f.car = k; return { ok: true };
  };
  PF.setIns = function (st, k, on) { var f = PF.ensure(st); if (!PF.INS[k]) return; f.ins[k] = !!on; };
  // Kredite (Bonität aus Einkommen, Vertragslaufzeit, Vermögen und Belastung)
  PF.credit = function (st) {
    var p = C.player(st), m = PF.monthly(st), nw = PF.netWorth(st), liq = PF.liquid(st), f = PF.ensure(st);
    if (!p || PF.minor(st)) return { score: 0, grade: '–', max: 0, rate: 0, why: 'Kredite erst ab 18 Jahren.' };
    var s = 520 + clamp(p.contract, 0, 4) * 45 + clamp(m.cf / Math.max(1, m.inSum), -0.5, 0.6) * 220 + clamp(liq / Math.max(1, m.fixed * 6), 0, 2) * 60 + clamp(nw / Math.max(1, p.wage), -1, 3) * 30 - f.missed * 60 - (p.youth ? 80 : 0) - (p.age > 32 ? 40 : 0);
    s = Math.round(clamp(s, 150, 980));
    var grade = s >= 820 ? 'A' : s >= 700 ? 'B' : s >= 580 ? 'C' : s >= 460 ? 'D' : 'E';
    var base = RE ? RE.ensure(st).rate : 0.035;
    return { score: s, grade: grade, max: s < 460 ? 0 : rnd(Math.max(0, m.inSum * 12 * (s - 400) / 900 - PF.loansDebt(st)), 1000), spread: s >= 820 ? 0 : s >= 700 ? 0.01 : s >= 580 ? 0.025 : 0.05, base: base };
  };
  PF.takeLoan = function (st, k, amount) {
    var f = PF.ensure(st), T = PF.LOANS[k], cr = PF.credit(st); amount = rnd(amount, 100);
    if (!T || !(amount > 0)) return { ok: false, why: 'Ungültig.' };
    if (amount > cr.max) return { ok: false, why: cr.why || ('Die Bank genehmigt höchstens ' + R.fmtMoney(cr.max) + ' (Bonität ' + cr.grade + ').') };
    if (R.fa) { var w2 = R.fa.loanCheck(st, k, amount); if (w2 && w2.block) return { ok: false, why: w2.why }; }
    var rate = cr.base + T.spread + cr.spread, n = T.years * 12, i = rate / 12, pay = amount * i / (1 - Math.pow(1 + i, -n));
    f.loans.push({ id: 'L' + tick(st) + f.loans.length, k: k, n: T.n, amount: amount, rate: rate, pay: Math.round(pay), start: tick(st) }); f.w.loans = f.loans;
    if (k === 'konsum') PF.book(st, amount, 'Kreditauszahlung');
    X.chron(st, 'finanzen', '🏦', T.n, R.fmtMoney(amount) + ' zu ' + (rate * 100).toFixed(1).replace('.', ',') + ' %, Rate ' + R.fmtMoney(Math.round(pay)) + '/Monat', 1);
    return { ok: true, rate: rate, pay: pay };
  };
  PF.repayLoan = function (st, id) { var f = PF.ensure(st), l = f.loans.filter(function (x) { return x.id === id; })[0]; if (!l) return { ok: false }; if (PF.liquid(st) < l.amount) return { ok: false, why: 'Nicht genug Geld.' }; PF.book(st, -Math.round(l.amount * 1.01), 'Sondertilgung'); f.loans = f.loans.filter(function (x) { return x !== l; }); f.w.loans = f.loans; return { ok: true }; };
  PF.save = function (st, amt) { var w = PF.wallet(st); amt = Math.min(rnd(amt, 100), Math.max(0, w.cash)); if (amt <= 0) return; w.cash -= amt; w.savings += amt; st.pc.cash = w.cash; };
  PF.unsave = function (st, amt) { var w = PF.wallet(st); amt = Math.min(rnd(amt, 100), w.savings); if (amt <= 0) return; w.savings -= amt; w.cash += amt; st.pc.cash = w.cash; };

  // Börse über das bestehende Marktmodell (Transaktionskosten im Kurs, Abgeltungsteuer auf realisierte Gewinne)
  // Wie im Managerspiel jederzeit handelbar; Minderjährige über ein Junior-Depot mit Zustimmung der Eltern
  PF.canTrade = function (st) { return true; };
  PF.buy = function (st, sym, amountEur, via) {
    if (!PF.canTrade(st)) return { ok: false, why: 'Wertpapiere und Kryptowährungen erst ab 18 Jahren.' };
    var price = E.price(st, sym); if (!price) return { ok: false, why: 'Unbekannter Wert.' };
    var qty = Math.floor(amountEur / (price * 1.006)); if (price < 5 && qty < 1) qty = 0;
    return PF.buyQty(st, sym, qty, via);
  };
  // Kauf nach Stückzahl über dieselbe Marktlogik wie im Managerspiel (0,5 % Gebühr, Kurs der aktuellen Woche)
  PF.buyQty = function (st, sym, qty, via) {
    if (!PF.canTrade(st)) return { ok: false, why: 'Handel nicht möglich.' };
    var r = E.buyAsset(st, PF.wallet(st), sym, qty); st.pc.cash = PF.wallet(st).cash;
    if (r.ok && R.fa) R.fa.onTrade(st, sym, r.cost, via);
    return r;
  };
  PF.sell = function (st, sym, qty) {
    var w = PF.wallet(st), r = E.sellAsset(st, w, sym, qty);
    if (r.ok && r.profit > 0) { var tax = r.profit * PF.taxCfg(st).cap; if (tax > 0) PF.book(st, -tax, 'Abgeltungsteuer'); }
    st.pc.cash = w.cash; return r;
  };
  PF.investTip = function (st, share) {
    if (!PF.canTrade(st)) return 'Mit unter 18 Jahren geht das nicht.';
    var syms = Object.keys(st.market.crypto); if (!syms.length) return 'Keine Kryptowährung verfügbar.';
    var sym = syms.sort(function (a, b) { var A = D.cryptos.filter(function (x) { return x.id === a; })[0] || {}, B = D.cryptos.filter(function (x) { return x.id === b; })[0] || {}; return (B.vol || 0) - (A.vol || 0); })[0];
    var amt = Math.max(0, PF.liquid(st) * share); if (amt < 100) return 'Kein Geld zum Investieren.';
    var r = PF.buy(st, sym, amt, 'tipp'); if (!r.ok) return r.why;
    PF.ensure(st).tip = { sym: sym, cost: r.cost, qty: Math.floor(amt / (E.price(st, sym) * 1.006)) };
    return R.fmtMoney(Math.round(r.cost)) + ' in ' + ((E.marketDef(sym) || {}).name || sym) + ' investiert.';
  };
  PF.tipResult = function (st) { var t = PF.ensure(st).tip; if (!t || !t.cost) return 0; return (t.qty * E.price(st, t.sym) - t.cost) / t.cost; };

  // Wohneigentum (privat genutzt) und vermietete Wohnungen – Preise folgen dem regionalen Immobilienindex
  PF.homeOffer = function (st, kind, rent) { var H = PF.HOMES[kind], idx = PF.regionIdx(st); var price = rnd(H.base * idx * (rent ? 0.6 : 1), 5000); return { kind: kind, n: (rent ? 'Vermietete ' : '') + H.n, price: price, fees: rnd(price * 0.09, 100), rentY: rent ? rnd(price * H.rentY * 1.25, 100) : 0 }; };
  PF.buyHome = function (st, kind, rent, eqShare) {
    if (PF.minor(st)) return { ok: false, why: 'Erst ab 18 Jahren.' };
    var f = PF.ensure(st), o = PF.homeOffer(st, kind, rent), eq = Math.max(o.fees + o.price * 0.2, Math.min(PF.liquid(st), (o.price + o.fees) * (eqShare || 0.3)));
    if (PF.liquid(st) < eq) return { ok: false, why: 'Eigenkapital fehlt: mindestens 20 % plus Nebenkosten (' + R.fmtMoney(o.fees + o.price * 0.2) + ').' };
    var loanAmt = Math.max(0, o.price + o.fees - eq), cr = PF.credit(st), rate = (RE ? RE.ensure(st).rate : 0.035) + 0.003 + cr.spread;
    var pay = loanAmt ? loanAmt * (rate + 0.025) / 12 : 0;
    var m = PF.monthly(st);
    if (loanAmt && (pay > (m.inSum + o.rentY / 12) * 0.45 || cr.score < 460)) return { ok: false, why: 'Die Bank lehnt ab: Die Rate (' + R.fmtMoney(Math.round(pay)) + '/Monat) wäre zu hoch für dein Einkommen.' };
    if (R.fa) { var w2 = R.fa.loanCheck(st, 'haus', loanAmt); if (w2 && w2.block) return { ok: false, why: w2.why }; }
    PF.book(st, -Math.round(eq), 'Immobilienkauf (Eigenkapital & Nebenkosten)');
    var h = { id: 'H' + tick(st) + f.homes.length, kind: kind, k: rent ? 'rent' : 'own', n: o.n, price: o.price, value: o.price, idx0: PF.regionIdx(st), rentY: o.rentY, vacant: 0, bought: tick(st), loan: loanAmt ? { bal: loanAmt, rate: rate, pay: Math.round(pay) } : null };
    f.homes.push(h); if (!rent && !f.homeId) f.homeId = h.id;
    X.chron(st, 'finanzen', '🏡', (rent ? 'Wohnung zur Vermietung: ' : 'Eigenes Zuhause: ') + o.n, R.fmtMoney(o.price) + (loanAmt ? ', Darlehen ' + R.fmtMoney(Math.round(loanAmt)) + ' zu ' + (rate * 100).toFixed(2).replace('.', ',') + ' %' : ', bar bezahlt'), 2);
    return { ok: true, home: h };
  };
  PF.sellHome = function (st, id, forced) {
    var f = PF.ensure(st), h = f.homes.filter(function (x) { return x.id === id; })[0]; if (!h) return { ok: false };
    var val = h.value * (forced ? 0.9 : 0.975), bal = h.loan ? h.loan.bal * 1.02 : 0;
    PF.book(st, Math.round(val - bal), 'Immobilienverkauf');
    f.homes = f.homes.filter(function (x) { return x !== h; }); if (f.homeId === id) f.homeId = null;
    X.chron(st, 'finanzen', '🏷️', 'Verkauft: ' + h.n, R.fmtMoney(Math.round(val)) + (val >= h.price ? ' (Gewinn ' : ' (Verlust ') + R.fmtMoney(Math.round(Math.abs(val - h.price))) + ')' + (forced ? ' – Notverkauf' : ''), 2);
    return { ok: true, gain: val - h.price };
  };

  // ---------- Anbindung an das bestehende Immobilienmodul ----------
  if (RE) {
    var baseRev = RE.annualRevenue;
    RE.annualRevenue = function (st, club) { if (club && club.id === 'PCW') { var m = PF.monthly(st); return Math.max(20000, m.inSum * 12); } return baseRev(st, club); };
    var baseMonth = RE.month;
    RE.month = function (st, k) {
      baseMonth(st, k);
      if (st.pc && C.active(st) && st.pc.fin) {
        var w = st.pc.fin.w, re = st.realty;
        if (re.props.some(function (p) { return p.club === 'PCW'; }) || re.loans.some(function (l) { return l.club === 'PCW'; })) RE.monthClub(st, w, k);
        if (!R.season.userClub(st) && !PF.minor(st)) RE.refreshMarket(st, w);
        st.pc.cash = w.cash;
      }
    };
    var baseEvent = RE.event;
    RE.event = function (st, title, text, tone, k, kind, club) { baseEvent(st, title, text, tone, k, kind, club); if (club && club.id === 'PCW') news(st, title, text); };
  }
  // ---------- Einbindung in die Karriere ----------
  C.on.weekly.push(PF.weekly);
  C.on.seasonEnd.push(PF.seasonEnd);
  // Nebenjob: Handballprofis mit sehr kleinem Gehalt arbeiten nebenher (Teilzeit, Ausbildung, Studium)
  PF.sideJob = function (st) { var p = C.player(st); return HB && p && !p.youth && !PF.minor(st) && p.wage < 24000 ? 900 : 0; };
  PF.lifeFor = function (st) { var p = C.player(st); if (!p) return 'bescheiden'; var net = (p.wage - PF.taxOf(st, p.wage)) / 12 + PF.sideJob(st); return net * 0.6 >= PF.LIFE.komfortabel.m ? 'komfortabel' : net * 0.75 >= PF.LIFE.bescheiden.m ? 'bescheiden' : 'wg'; };
  // Startausstattung passend zum Einkommen (danach passt sich der Lebensstil nicht mehr von selbst an)
  PF.fitStart = function (st) {
    var f = PF.ensure(st), p = C.player(st); if (!p || PF.minor(st)) return;
    var net = (p.wage - PF.taxOf(st, p.wage)) / 12;
    f.life = PF.lifeFor(st);
    f.car = net + PF.sideJob(st) >= 2300 ? 'klein' : 'keins';
  };
  C.on.start.push(function (st) { PF.ensure(st); PF.fitStart(st); });
  C.on.newSeason.push(function (st) { var f = PF.ensure(st); if (!PF.minor(st) && f.life === 'eltern') { f.life = PF.lifeFor(st); X.chron(st, 'familie', '🔑', 'Die erste eigene Wohnung', 'Mit 18 ziehst du bei deinen Eltern aus.', 2); } });
  C.on.retire.push(function (st) {
    var f = st.pc.fin; if (!f) return;
    if (f.ins.bu && X.mem(st, 'careerInjury') && st.pc.final) { var pay = (st.pc.final.wage || 0) * 2; if (pay) PF.book(st, pay, 'Versicherungsleistung'); }
    st.pc.finalNw = Math.round(PF.netWorth(st));
  });

  // ---------- Finanzereignisse ----------
  function f$(c) { return c.st.pc.fin; }
  X.add('finanzen', [
    { id: 'fi_car', cat: 'finanzen', ic: '🏎️', cd: 60, when: function (c) { return c.pro && c.age >= 19 && f$(c) && (f$(c).car === 'klein' || f$(c).car === 'keins') && c.pc.fame >= 15; }, ti: 'Das Traumauto', t: function () { return 'Die Mitspieler fahren dicke Autos. Ein Händler bietet dir einen Sportwagen mit „Sportlerrabatt“ und Finanzierung an.'; },
      o: [{ l: 'Kaufen (finanziert)', hint: 'hohe Fixkosten', fx: function (st) { var r = PF.setCar(st, 'sport', true); return r.ok ? X.eff(st, { pop: 3, mates: 2 }) + '. Neue Monatsrate.' : r.why; } }, { l: 'Bar kaufen, wenn es geht', fx: function (st) { var r = PF.setCar(st, 'sport', false); return r.ok ? X.eff(st, { pop: 3 }) : r.why; } }, { l: 'Bleibt beim Alten', fx: function (st) { return X.eff(st, { disc: 2 }); } }] },
    { id: 'fi_friend_loan', cat: 'finanzen', ic: '🤲', cd: 80, when: function (c) { return c.age >= 19 && PF.liquid(c.st) > 15000; }, ti: 'Ein Freund braucht Geld', t: function (c) { var a = rnd(Math.min(PF.liquid(c.st) * 0.2, 60000), 1000); return 'Ein alter Schulfreund bittet dich um ' + R.fmtMoney(a) + ' für seine Firmengründung.'; },
      o: [{ l: 'Geld leihen', fx: function (st) { var a = rnd(Math.min(PF.liquid(st) * 0.2, 60000), 1000); PF.book(st, -a, 'Privatdarlehen'); X.later(st, R.randInt(20, 50), 'fi_friend_back', { a: a, ok: R.chance(0.55) }); return X.eff(st, { family: 2 }); } }, { l: 'Freundlich ablehnen', fx: function (st) { return X.eff(st, { family: -2 }); } }] },
    { id: 'fi_friend_back', cat: 'finanzen', ic: '💌', follow: true, ti: 'Das Privatdarlehen', t: function (c, d) { return d.ok ? 'Dein Freund zahlt die ' + R.fmtMoney(d.a) + ' zurück – mit einer Flasche Champagner als Zinsen.' : 'Die Firma deines Freundes ist pleite. Das Geld ist weg.'; },
      o: [{ l: 'Weiter', fx: function (st, c, d) { if (d.ok) { PF.book(st, d.a, 'Rückzahlung Privatdarlehen'); return X.eff(st, { family: 3 }); } return X.eff(st, { stress: 3 }); } }] },
    { id: 'fi_tax', cat: 'finanzen', ic: '🧾', cd: 100, when: function (c) { return c.pro && c.p.wage > 150000; }, ti: 'Post vom Finanzamt', t: function () { return 'Eine Steuerprüfung findet Unstimmigkeiten bei deinen Werbeeinnahmen. Nachzahlung fällig.'; },
      o: [{ l: 'Zahlen', fx: function (st, c) { var a = rnd(c.p.wage * R.randRange(0.02, 0.06), 100); PF.book(st, -a, 'Steuernachzahlung'); return 'Nachzahlung: ' + R.fmtMoney(a) + '.'; } }, { l: 'Steuerberater einschalten', fx: function (st, c) { var a = rnd(c.p.wage * R.randRange(0.005, 0.03), 100), fee = rnd(c.p.wage * 0.004, 100); PF.book(st, -(a + fee), 'Steuernachzahlung'); return 'Mit Berater: ' + R.fmtMoney(a) + ' Nachzahlung + ' + R.fmtMoney(fee) + ' Honorar.'; } }] },
    { id: 'fi_lifestyle_peer', cat: 'finanzen', ic: '🥂', cd: 70, when: function (c) { return c.pro && f$(c) && (f$(c).life === 'bescheiden' || f$(c).life === 'komfortabel') && c.p.wage > 200000; }, ti: 'Leben wie ein Star?', t: function () { return 'Ein Teamkollege lädt in seine Villa ein: „Du verdienst doch genug – gönn dir was!“'; },
      o: [{ l: 'Lebensstil hochfahren (luxuriös)', fx: function (st) { PF.setLife(st, 'luxus'); return X.eff(st, { pop: 4, mates: 2 }) + '. Die Fixkosten steigen deutlich.'; } }, { l: 'Bewusst sparsam bleiben', fx: function (st) { return X.eff(st, { disc: 3, mates: -1 }); } }] },
    { id: 'fi_tabloid', cat: 'medien', ic: '📸', cd: 50, when: function (c) { return f$(c) && (f$(c).life === 'luxus' || f$(c).life === 'extrem'); }, ti: 'Boulevard', t: function () { return 'Ein Boulevardblatt zeigt Fotos deines Luxuslebens – nach einer Niederlage.'; },
      o: [{ l: 'Ignorieren', fx: function (st) { return X.eff(st, { fans: -4, press: -2 }); } }, { l: 'Spende ankündigen', fx: function (st, c) { var a = rnd(Math.max(2000, c.p.wage * 0.01), 100); PF.book(st, -a, 'Spenden'); return X.eff(st, { fans: 4, press: 3 }) + '. Spende ' + R.fmtMoney(a) + '.'; } }] },
    { id: 'fi_parents', cat: 'familie', ic: '👵', cd: 120, when: function (c) { return c.age >= 22 && PF.liquid(c.st) > 40000; }, ti: 'Die Eltern', t: function () { return 'Das Dach deiner Eltern muss saniert werden. Sie fragen vorsichtig, ob du helfen kannst.'; },
      o: [{ l: 'Selbstverständlich', fx: function (st) { var a = rnd(Math.min(35000, PF.liquid(st) * 0.3), 100); PF.book(st, -a, 'Familie'); return X.eff(st, { family: 10, stress: -3 }) + ' (' + R.fmtMoney(a) + ')'; } }, { l: 'Einen Teil übernehmen', fx: function (st) { var a = rnd(Math.min(12000, PF.liquid(st) * 0.1), 100); PF.book(st, -a, 'Familie'); return X.eff(st, { family: 4 }); } }, { l: 'Gerade nicht möglich', fx: function (st) { return X.eff(st, { family: -6 }); } }] },
    { id: 'fi_rate_up', cat: 'finanzen', ic: '📈', cd: 60, when: function (c) { return f$(c) && f$(c).homes.some(function (h) { return h.loan && h.loan.bal > 0; }) && RE && RE.ensure(c.st).rate > 0.04; }, ti: 'Anschlussfinanzierung', t: function () { return 'Die Zinsbindung für dein Wohneigentum läuft aus – die Bauzinsen sind gestiegen.'; },
      o: [{ l: 'Neue Konditionen akzeptieren', fx: function (st) { var r = RE.ensure(st).rate + 0.004; PF.ensure(st).homes.forEach(function (h) { if (h.loan) { h.loan.rate = r; h.loan.pay = Math.round(h.loan.bal * (r + 0.025) / 12); } }); return 'Neuer Zins ' + (r * 100).toFixed(2).replace('.', ',') + ' %. Die Rate steigt.'; } }, { l: 'Sondertilgung leisten', req: function (c) { return PF.liquid(c.st) > 50000; }, fx: function (st) { var h = PF.ensure(st).homes.filter(function (x) { return x.loan; })[0]; var a = Math.min(h.loan.bal, PF.liquid(st) * 0.4); PF.book(st, -Math.round(a), 'Sondertilgung'); h.loan.bal -= a; var r = RE.ensure(st).rate + 0.004; h.loan.rate = r; h.loan.pay = Math.round(h.loan.bal * (r + 0.025) / 12); return 'Restschuld gesenkt um ' + R.fmtMoney(Math.round(a)) + '.'; } }] },
    { id: 'fi_bargain', cat: 'finanzen', ic: '🏘️', cd: 70, when: function (c) { return c.age >= 20 && PF.liquid(c.st) > 120000; }, ti: 'Immobilie unter Wert', t: function () { return 'Ein Bekannter bietet dir eine vermietete Wohnung 15 % unter Marktwert an – Entscheidung bis morgen.'; },
      o: [{ l: 'Zuschlagen', fx: function (st) { var r = PF.buyHome(st, 'wohnung', true, 0.35); if (r.ok) { r.home.price = rnd(r.home.price * 1.15, 1000); return 'Gekauft – ein echtes Schnäppchen.'; } return r.why; } }, { l: 'Ohne Prüfung kaufe ich nichts', fx: function (st) { return X.eff(st, { disc: 2 }); } }] },
    { id: 'fi_crypto_hype', cat: 'finanzen', ic: '🪙', cd: 60, when: function (c) { return c.age >= 18 && PF.liquid(c.st) > 10000; }, ti: 'Krypto-Fieber in der Kabine', t: function () { return 'Die halbe Mannschaft redet nur noch über Kryptowährungen. Ein Mitspieler hat angeblich sein Geld verdreifacht.'; },
      o: [{ l: 'Kräftig einsteigen', hint: 'hohes Risiko', fx: function (st) { return PF.investTip(st, 0.35); } }, { l: 'Kleiner Betrag zum Ausprobieren', fx: function (st) { return PF.investTip(st, 0.05); } }, { l: 'Nicht mein Ding', fx: function () { return 'Du bleibst entspannt.'; } }] },
    { id: 'fi_pressure_offer', cat: 'finanzen', ic: '😰', cd: 40, when: function (c) { return c.sec >= 5 && c.pc.offers.length > 0; }, ti: 'Finanzieller Druck', t: function () { return 'Das Konto ist knapp, die Raten laufen weiter. Die vorliegenden Angebote fühlen sich plötzlich ganz anders an.'; },
      o: [{ l: 'Lebensstil sofort reduzieren', fx: function (st) { var f = PF.ensure(st), o = ['extrem', 'luxus', 'komfortabel', 'bescheiden', 'wg'], i = o.indexOf(f.life); if (i >= 0 && i < 4) f.life = o[i + 1]; return 'Lebensstil: ' + PF.LIFE[f.life].n + '.'; } }, { l: 'Anlagen verkaufen', fx: function (st) { var w = PF.wallet(st), n = 0; Object.keys(w.portfolio).forEach(function (s) { if (w.portfolio[s]) { PF.sell(st, s, w.portfolio[s].qty); n++; } }); return n ? 'Depot aufgelöst.' : 'Nichts zu verkaufen.'; } }, { l: 'Das bestbezahlte Angebot wird es', fx: function (st) { return X.eff(st, { stress: -4, amb: -2 }); } }] },
    { id: 'fi_free_choice', cat: 'finanzen', ic: '🕊️', once: true, when: function (c) { return c.age >= 31 && c.sec === 1; }, ti: 'Finanzielle Freiheit', t: function (c) { return 'Du bist finanziell unabhängig. Das Geld muss nicht mehr entscheiden: Bleiben beim Lieblingsverein zu weniger Gehalt, ein letztes Abenteuer – oder früher aufhören?'; },
      o: [{ l: 'Beim Verein bleiben, auch für weniger Geld', fx: function (st, c) { if (!c.c) return ''; var o = { id: 'own' + tick(st), clubId: c.p.clubId, renew: true, wage: rnd(c.p.wage * 0.75, 1000), years: 2 }; st.pc.offers.push(o); if (R.ag) R.ag.enrich(st, o); return X.eff(st, { fans: 8, board: 6 }) + '. Verlängerung zu reduzierten Bezügen liegt vor.'; } }, { l: 'Früh die Karriere beenden können', fx: function (st) { X.setFlag(st, 'earlyRetire', 1); return 'Der Knopf „Karriere beenden“ steht dir jederzeit offen.'; } }, { l: 'Einfach weiterspielen', fx: function () { return 'Mit freiem Kopf spielt es sich leichter.'; } }] },
    { id: 'fi_vacancy', cat: 'finanzen', ic: '🏚️', cd: 40, when: function (c) { return f$(c) && f$(c).homes.some(function (h) { return h.k === 'rent'; }); }, ti: 'Mieter zahlt nicht', t: function () { return 'Der Mieter deiner Wohnung zahlt seit zwei Monaten nicht.'; },
      o: [{ l: 'Anwalt einschalten', fx: function (st) { PF.book(st, -1800, 'Rechtskosten'); return 'Räumungsklage läuft. Drei Monate ohne Miete.'; } }, { l: 'Ratenzahlung anbieten', fx: function (st) { return R.chance(0.6) ? 'Der Mieter zahlt in Raten zurück.' : 'Er zahlt trotzdem nicht. Ärgerlich.'; } }] }
  ]);
})(RFM);
