// ANPFIFF! / ANWURF! – Immobilieninvestments & Immobilienfinanzierung
// Eigene Anlageklasse unter „Bank & Finanzen“: Bestandsimmobilien kaufen, Freiflächen erwerben, neu bauen,
// mit Annuitätendarlehen finanzieren, vermieten, modernisieren und verkaufen.
//
// Kalender: Die Immobilienwirtschaft läuft auf der fortlaufenden Kalenderwoche st.tick (auch in Vorbereitung,
// Winterpause und über Saisonwechsel). 4 Wochen = 1 Monat, 12 Monate = 1 Jahr. Mieten, Kosten und Kreditraten
// werden einmal je Monat gebucht (Monatsende = tick % 4 === 0). Jede Verarbeitung merkt sich die zuletzt
// verarbeitete Woche (re.lastTick) – ein wiederholter Simulationsschritt bucht nichts doppelt.
// Alle Zufallswerte kommen aus dem gespeicherten Spiel-Zufallsgenerator: Speichern/Laden erzeugt keine neuen Angebote.
(function (R) {
  var D = R.data, RE = R.realty = {};
  var MT = RE.MONTH_TICKS = 4;

  // ---------- Spielparameter (Balancing) ----------
  RE.P = {
    feesBuy: { grunderwerb: 0.05, notar: 0.015, makler: 0.03 },  // Kaufnebenkosten (vor Abschluss ausgewiesen)
    feesLand: { grunderwerb: 0.05, notar: 0.015, makler: 0 },
    saleCost: 0.025,                    // Verkaufsnebenkosten
    ltv: { wohn: 1.0, gewerbe: 0.72, land: 0.5 }, // Beleihung in % des Kaufpreises/der Projektkosten; Nebenkosten immer Eigenkapital
    baseRate: 0.036,                    // Startniveau Bauzins (10 Jahre fest)
    fixAdj: { 5: -0.002, 10: 0, 15: 0.0025, 20: 0.004 },
    useAdj: { wohn: 0, gewerbe: 0.003, land: 0.012 },
    maxPromoDiscount: 0.015,            // Zinsrabatte gesamt höchstens 1,5 Prozentpunkte
    sonderMax: 0.05,                    // Sondertilgung je Vertragsjahr (5 % der Ursprungssumme)
    penaltyPerYear: 0.01, penaltyMax: 0.05, // Vorfälligkeitsentschädigung bei Ablösung in der Zinsbindung
    minDSCR: 1.05,                      // Mindest-Schuldendienstdeckung (Netto-Miete / Rate)
    exposure: 3.5,                      // Immobilienkredite gesamt ≤ 3,5 × Jahresumsatz des Vereins
    offers: 9                           // Angebote gleichzeitig am Markt
  };
  // Fiktive Immobilienmärkte: Kaufpreisniveau (€/m²), Mietrendite, Wachstum p.a., Leerstand, Schwankung, Nachfrage
  RE.REGIONS = {
    zentrum: { n: 'Metropole · Zentrum', short: 'Großstadtzentrum', pqm: 5200, yieldW: 0.043, yieldG: 0.052, growth: 0.025, vac: 0.02, vol: 0.010, demand: 0.92, districts: ['Altstadt-Nord', 'Domviertel', 'Kaufmannsquartier', 'Hafenkante', 'Theaterplatz'] },
    rand: { n: 'Metropole · Stadtrand', short: 'Großstadtrandlage', pqm: 3600, yieldW: 0.051, yieldG: 0.060, growth: 0.020, vac: 0.03, vol: 0.008, demand: 0.85, districts: ['Lindenhof', 'Am Stadtwald', 'Gartenstadt-Süd', 'Neue Mitte West', 'Mühlenbach'] },
    mittel: { n: 'Mittelstadt', short: 'Mittelstadt', pqm: 2500, yieldW: 0.059, yieldG: 0.068, growth: 0.012, vac: 0.05, vol: 0.007, demand: 0.75, districts: ['Burgstadt Innenstadt', 'Talheim', 'Am Marktplatz', 'Bahnhofsviertel', 'Rosenau'] },
    wachstum: { n: 'Wachstumsregion', short: 'Wachstumsregion', pqm: 3100, yieldW: 0.056, yieldG: 0.064, growth: 0.032, vac: 0.03, vol: 0.013, demand: 0.88, districts: ['Technologiepark Ost', 'Seeufer-Quartier', 'Neustadt am Campus', 'Flughafenring', 'Weinbergsiedlung'] },
    schwach: { n: 'Strukturschwache Region', short: 'Strukturschwache Region', pqm: 1300, yieldW: 0.083, yieldG: 0.094, growth: -0.004, vac: 0.10, vol: 0.011, demand: 0.55, districts: ['Zechenkolonie', 'Altes Stahlviertel', 'Grenzweg', 'Kanalstraße', 'Hüttenstadt'] }
  };
  RE.KINDS = {
    mfh: { n: 'Mehrfamilienhaus', use: 'wohn', mode: 'bestand', ic: 'house' },
    mfhNeu: { n: 'Mehrfamilienhaus (Neubau)', use: 'wohn', mode: 'neubau', ic: 'construction' },
    buero: { n: 'Bürogebäude', use: 'gewerbe', mode: 'bestand', ic: 'building-2' },
    bueroNeu: { n: 'Büro- & Geschäftshaus (Neubau)', use: 'gewerbe', mode: 'neubau', ic: 'construction' },
    land: { n: 'Freifläche / Brachland', use: 'land', mode: 'land', ic: 'map-pin' }
  };
  RE.STANDARDS = {
    einfach: { n: 'Einfach', cost: 0.82, rent: 0.86, growth: -0.004, risk: 0, demand: -0.04 },
    modern: { n: 'Modern', cost: 1, rent: 1, growth: 0, risk: 0, demand: 0 },
    premium: { n: 'Premium', cost: 1.28, rent: 1.2, growth: 0.006, risk: 1, demand: 0.02, green: true }
  };
  RE.STRATEGIES = {
    sparsam: { n: 'Sparsam', cost: 0.003, cond: -0.32, rent: -0.01 },
    normal: { n: 'Normal', cost: 0.0062, cond: -0.04, rent: 0 },
    premium: { n: 'Premium', cost: 0.011, cond: 0.22, rent: 0.012 }
  };
  RE.MODERN = {
    energie: { n: 'Energetische Sanierung', cost: 0.09, months: 5, cond: 12, rent: 0.05, value: 0.07, green: true },
    fassade: { n: 'Fassadenmodernisierung', cost: 0.04, months: 3, cond: 10, rent: 0.02, value: 0.035 },
    ausstattung: { n: 'Neue Ausstattung', cost: 0.05, months: 3, cond: 8, rent: 0.04, value: 0.04 },
    technik: { n: 'Technische Gebäudesanierung', cost: 0.06, months: 4, cond: 16, rent: 0.01, value: 0.045 },
    gemeinschaft: { n: 'Gemeinschaftsflächen', cost: 0.02, months: 2, cond: 4, rent: 0.015, value: 0.015 }
  };
  RE.PHASES = ['Grundstück & Vorbereitung', 'Fundament', 'Rohbau', 'Fassade & Dach', 'Innenausbau', 'Fertigstellung'];
  RE.PHASE_AT = [0, 0.1, 0.25, 0.55, 0.75, 0.95];
  RE.phaseOf = function (p) { var i = 0; for (var k = 0; k < RE.PHASE_AT.length; k++) if (p >= RE.PHASE_AT[k]) i = k; return i; };
  RE.BANKS = { wohn: ['Vereinsbank', 'Nord Kapital', 'Wohnbau Kredit', 'Stadtsparkasse'], gewerbe: ['Business Real Estate Finance', 'Vereinsbank', 'Nord Kapital'], land: ['Vereinsbank', 'Stadtsparkasse'] };
  var NAMES = {
    wohn: ['Wohnpark', 'Residenz', 'Quartier', 'Höfe', 'Lindenhaus', 'Stadtvillen', 'Wohnhof', 'Gartenhaus'],
    gewerbe: ['Business Center', 'Office Tower', 'Bürohaus', 'Campus', 'Forum', 'Kontor', 'Atrium', 'Werkhof'],
    land: ['Brachfläche', 'Baufeld', 'Grundstück', 'Areal']
  };

  // ---------- Zustand ----------
  RE.ensure = function (st) {
    if (st.realty && st.realty.v) return st.realty;
    // Migration: bestehende Spielstände erhalten einen leeren Immobilienbereich (keine anderen Werte werden verändert)
    var regions = {};
    Object.keys(RE.REGIONS).forEach(function (k) { regions[k] = { idx: 1, rent: 1, demand: RE.REGIONS[k].demand, shock: 0 }; });
    st.realty = { v: 1, seq: 1, lastTick: st.tick || 0, rate: RE.P.baseRate, eco: 0, regions: regions, offers: [], props: [], loans: [], promos: [], events: [], hist: [], usedPromos: {} };
    return st.realty;
  };
  function nid(re, p) { return p + (re.seq++); }
  RE.monthIdx = function (st) { return Math.floor((st.tick || 0) / MT); };
  RE.isMonthEnd = function (tick) { return tick > 0 && tick % MT === 0; };
  RE.dateText = function (st, tick) { var m = Math.floor(tick / MT); var y = Math.floor(m / 12), mm = m % 12; return ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'][(mm + 6) % 12] + ' ' + ((st.startSeason || 2026) + y + (mm + 6 >= 12 ? 1 : 0)); };
  RE.propsOf = function (st, club) { return RE.ensure(st).props.filter(function (p) { return p.club === club.id; }); };
  RE.loansOf = function (st, club) { return RE.ensure(st).loans.filter(function (l) { return l.club === club.id; }); };
  RE.loanOf = function (st, prop) { return RE.ensure(st).loans.filter(function (l) { return l.prop === prop.id; })[0] || null; };

  // ---------- Annuitätendarlehen (ein Modell für Rechner, Angebot und Vertrag) ----------
  // terms: { principal, rate (p.a.), mode: 'tilgung'|'laufzeit', tilg (p.a., bei mode tilgung), months (bei mode laufzeit) }
  RE.annuity = function (t) {
    var P = t.principal, i = t.rate / 12;
    if (P <= 0) return 0;
    if (t.mode === 'laufzeit') { var n = Math.max(1, t.months); return i === 0 ? P / n : P * i / (1 - Math.pow(1 + i, -n)); }
    return P * (t.rate + t.tilg) / 12; // anfängliche Annuität aus Sollzins + Anfangstilgung
  };
  // Restschuld nach k Monatsraten (geschlossene Formel, identisch zur monatlichen Verbuchung)
  RE.balanceAfter = function (P, rate, A, k) {
    var i = rate / 12; if (k <= 0) return P;
    if (i === 0) return Math.max(0, P - A * k);
    var q = Math.pow(1 + i, k); return Math.max(0, P * q - A * (q - 1) / i);
  };
  // Tilgungsplan Jahr für Jahr (für Rechner und Diagramm)
  RE.schedule = function (P, rate, A, years, extraYear) {
    var out = [], B = P, i = rate / 12;
    for (var y = 1; y <= years && B > 0.5; y++) {
      var zins = 0, tilg = 0;
      for (var m = 0; m < 12 && B > 0.5; m++) { var z = B * i, t = Math.min(B, A - z); if (t < 0) t = 0; zins += z; tilg += t; B -= t; }
      if (extraYear && B > 0) { var x = Math.min(B, extraYear); B -= x; tilg += x; }
      out.push({ year: y, zins: zins, tilg: tilg, rest: Math.max(0, B) });
    }
    return out;
  };
  RE.monthsToRepay = function (P, rate, A) { var i = rate / 12; if (A <= P * i) return Infinity; if (i === 0) return Math.ceil(P / A); return Math.ceil(-Math.log(1 - P * i / A) / Math.log(1 + i)); };

  // ---------- Sonderaktionen ----------
  RE.PROMO_TYPES = {
    wohnoffensive: { t: 'WOHNRAUM-OFFENSIVE – DIE VEREINSBANK FINANZIERT GÜNSTIG!', bank: 'Vereinsbank', uses: ['wohn'], modes: ['bestand', 'neubau'], disc: 0.014, ltvAdd: 0, fix: 15, feeCut: 0, weeks: 8, txt: 'Sonderzins für Wohnimmobilien, bis 15 Jahre Zinsbindung.' },
    gewerbe: { t: 'BÜROIMMOBILIEN IM ANGEBOT – GESCHÄFTSBANK SENKT DIE ZINSEN!', bank: 'Business Real Estate Finance', uses: ['gewerbe'], modes: ['bestand', 'neubau'], disc: 0.010, ltvAdd: 0.05, fix: 20, feeCut: 1, weeks: 8, txt: 'Reduzierter Sollzins, höhere Beleihung, keine Bearbeitungsgebühr, lange Zinsbindung.' },
    neubau: { t: 'NEUBAU-FÖRDERWOCHEN – STAATLICHES FÖRDERPROGRAMM', bank: 'Förderbank', uses: ['wohn'], modes: ['neubau'], disc: 0.012, ltvAdd: 0, fix: 10, feeCut: 1, weeks: 6, txt: 'Günstige Förderkredite für neue Wohngebäude.' },
    wettbewerb: { t: 'BANKENWETTBEWERB – KREDITGEBER UNTERBIETEN SICH', bank: 'Nord Kapital', uses: ['wohn', 'gewerbe'], modes: ['bestand', 'neubau', 'land'], disc: 0.004, ltvAdd: 0, fix: 0, feeCut: 0, weeks: 8, txt: 'Alle Immobilienkredite werden etwas günstiger.' },
    nachhaltig: { t: 'NACHHALTIGKEITSBONUS FÜR ENERGIEEFFIZIENTE GEBÄUDE', bank: 'Stadtsparkasse', uses: ['wohn', 'gewerbe'], modes: ['bestand', 'neubau'], disc: 0.006, ltvAdd: 0, fix: 0, feeCut: 0, weeks: 10, green: true, txt: 'Bessere Konditionen für energetisch hochwertige Gebäude (Premium-Neubau oder energetisch saniert).' }
  };
  RE.activePromos = function (st) { var re = RE.ensure(st), t = st.tick || 0; return re.promos.filter(function (p) { return p.start <= t && p.end > t; }); };
  RE.promoFits = function (pr, use, mode, green) { var T = RE.PROMO_TYPES[pr.type]; return T.uses.indexOf(use) >= 0 && T.modes.indexOf(mode) >= 0 && (!T.green || green); };

  // ---------- Bonität ----------
  RE.annualRevenue = function (st, club) { return Math.max(500000, R.econ.revenueEstimate(st, club)); };
  RE.portfolio = function (st, club) {
    var props = RE.propsOf(st, club), loans = RE.loansOf(st, club), v = 0, d = 0, rentY = 0, rentSollY = 0, costY = 0, debtY = 0, units = 0, occW = 0, occN = 0;
    props.forEach(function (p) {
      v += p.value; if (p.status === 'bestand') { var m = RE.monthly(st, p); rentY += m.rent * 12; rentSollY += m.soll * 12; costY += m.cost * 12; occW += p.occ * m.soll; occN += m.soll; }
    });
    loans.forEach(function (l) { d += l.balance; debtY += l.annuity * 12; });
    return { count: props.length, value: v, debt: d, equity: v - d, rentY: rentY, rentSollY: rentSollY, costY: costY, debtServiceY: debtY, cfY: rentY - costY - debtY, occ: occN ? occW / occN : 0, yieldNet: v ? (rentY - costY) / v : 0, props: props, loans: loans };
  };
  RE.credit = function (st, club) {
    var E = R.econ, rev = RE.annualRevenue(st, club), pf = RE.portfolio(st, club), clubDebt = E.debt(club);
    var liq = club.cash + club.savings, score = 600;
    score += R.clamp(liq / rev, -0.5, 1) * 160;
    score -= R.clamp((clubDebt + pf.debt) / (rev * 4), 0, 1.5) * 220;
    score += R.clamp(pf.equity / Math.max(1, pf.value || 1), 0, 1) * (pf.value ? 90 : 0);
    score += R.clamp((pf.rentY - pf.costY) / Math.max(1, pf.debtServiceY || 1) - 1, -0.5, 0.8) * (pf.debtServiceY ? 120 : 0);
    if (club.cash < 0) score -= 120;
    score = Math.round(R.clamp(score, 150, 1000));
    var grade = score >= 850 ? 'A+' : score >= 760 ? 'A' : score >= 680 ? 'A−' : score >= 600 ? 'B+' : score >= 520 ? 'B' : score >= 440 ? 'C' : 'D';
    var adj = score >= 760 ? -0.003 : score >= 600 ? 0 : score >= 440 ? 0.006 : 0.015;
    return { score: score, grade: grade, adj: adj, limit: Math.round(rev * RE.P.exposure + Math.max(0, liq) * 0.5), revenue: rev, used: pf.debt }; // Kreditlinie: 3,5 × Umsatz + 50 % der Liquidität
  };

  // Konditionen für ein Objekt (Sonderaktion wird automatisch berücksichtigt, Rabatte gedeckelt)
  RE.terms = function (st, club, o, fix) {
    var re = RE.ensure(st), use = o.use, mode = o.mode, green = !!o.green, cr = RE.credit(st, club);
    var rate = re.rate + (RE.P.fixAdj[fix] || 0) + (RE.P.useAdj[use] || 0) + cr.adj + (o.risk >= 3 ? 0.004 : 0);
    var ltv = RE.P.ltv[use] || 0.6, disc = 0, promo = null, fee = 0.005;
    RE.activePromos(st).forEach(function (pr) {
      if (!RE.promoFits(pr, use, mode, green)) return; var T = RE.PROMO_TYPES[pr.type];
      if (!promo || T.disc > RE.PROMO_TYPES[promo.type].disc) promo = pr;
      disc += T.disc;
    });
    disc = Math.min(RE.P.maxPromoDiscount, disc);
    if (promo) { var T = RE.PROMO_TYPES[promo.type]; ltv = Math.min(1, ltv + T.ltvAdd); if (T.feeCut) fee = 0; }
    if (re.flaute) ltv = Math.max(0.4, ltv - 0.1);
    if (o.risk >= 3) ltv = Math.min(ltv, 0.6);
    return { rate: Math.max(0.006, rate - disc), normal: rate, disc: disc, ltv: ltv, fee: fee, promo: promo ? promo.id : null, promoName: promo ? RE.PROMO_TYPES[promo.type].t : null, bank: promo ? RE.PROMO_TYPES[promo.type].bank : RE.BANKS[use][0], credit: cr };
  };

  // ---------- Angebote ----------
  function rnd(a, b) { return R.randRange(a, b); }
  RE.fees = function (o) { var f = o.mode === 'land' ? RE.P.feesLand : RE.P.feesBuy, base = o.mode === 'neubau' ? o.land : o.price; return { grunderwerb: Math.round(base * f.grunderwerb), notar: Math.round(base * f.notar), makler: Math.round(base * f.makler), total: Math.round(base * (f.grunderwerb + f.notar + f.makler)) }; };
  RE.genOffer = function (st, club, opts) {
    opts = opts || {};
    var re = RE.ensure(st), keys = Object.keys(RE.REGIONS), rk = opts.region || R.pick(keys), rg = RE.REGIONS[rk], rs = re.regions[rk];
    var kinds = ['mfh', 'mfh', 'mfh', 'buero', 'buero', 'mfhNeu', 'bueroNeu', 'land'], kk = opts.kind || R.pick(kinds), K = RE.KINDS[kk];
    // Größe passend zur Finanzkraft: kleine Vereine sehen vor allem kleine Objekte
    var power = Math.max(1, (club.cash + club.savings) / 1e6 + RE.annualRevenue(st, club) / 8e6);
    var sizeF = R.clamp(Math.exp(rnd(-1.1, 1.1)) * Math.sqrt(power) * 0.6, 0.25, 9);
    var o = { id: nid(re, 'O'), kind: kk, use: K.use, mode: K.mode, region: rk, district: R.pick(rg.districts), risk: 1, born: st.tick || 0, expires: (st.tick || 0) + R.randInt(6, 16) };
    o.name = R.pick(NAMES[K.use]) + ' ' + R.pick(['Am Park', 'Nord', 'Süd', 'Mitte', 'Sonnenhang', 'Am Wasser', 'Lindenallee', 'Ost', 'West', 'Rheinblick', 'Am Ring', 'Eichenweg']);
    var pqm = rg.pqm * rs.idx * (K.use === 'gewerbe' ? 1.12 : 1);
    if (K.mode === 'land') {
      o.sqm = Math.round(1200 * sizeF / 50) * 50 + 400; o.price = R.round(o.sqm * pqm * 0.32, 5000); o.year = null; o.cond = 0; o.units = 0;
      o.rentY = 0; o.occ = 0; o.risk = rg.vac > 0.06 ? 2 : 1; o.maint = Math.round(o.price * 0.002);
      o.buildUse = R.chance(0.6) ? 'wohn' : 'gewerbe';
    } else {
      var sqm = Math.round((K.use === 'wohn' ? 1100 : 1600) * sizeF / 10) * 10 + 400;
      o.sqm = sqm; o.units = K.use === 'wohn' ? Math.max(4, Math.round(sqm / 72)) : 0;
      var y = K.use === 'wohn' ? rg.yieldW : rg.yieldG;
      if (K.mode === 'bestand') {
        o.year = R.randInt(1958, 2021); o.cond = Math.round(R.clamp(40 + (o.year - 1958) * 0.7 + rnd(-15, 15), 25, 98));
        o.price = R.round(sqm * pqm * (0.72 + o.cond / 300), 10000);
        o.occ = R.clamp(1 - rg.vac * rnd(0.4, 1.8) - (100 - o.cond) / 900, 0.6, 1);
        o.rentY = Math.round(o.price * y * rnd(0.9, 1.12) / 1000) * 1000; // Soll-Jahresmiete bei Vollvermietung
        o.maint = Math.round(o.price * (0.004 + (100 - o.cond) / 10000));
        o.risk = (rg.vac >= 0.08 ? 1 : 0) + (K.use === 'gewerbe' ? 1 : 0) + (o.cond < 50 ? 1 : 0) + 1; o.risk = Math.min(3, o.risk);
      } else {
        o.year = null; o.cond = 100; o.months = K.use === 'wohn' ? R.clamp(Math.round(9 + sizeF * 3 + rnd(0, 4)), 9, 24) : R.clamp(Math.round(12 + sizeF * 3.5 + rnd(0, 5)), 12, 30);
        o.land = R.round(sqm * pqm * 0.22, 5000); o.build = R.round(sqm * (K.use === 'wohn' ? 3300 : 3700) * (0.85 + rs.idx * 0.15), 10000);
        o.price = o.land + o.build; o.occ = 0;
        o.rentY = Math.round(o.price * (y + 0.004) * rnd(0.95, 1.1) / 1000) * 1000;
        o.maint = Math.round(o.price * 0.003); o.preLet = K.use === 'gewerbe' ? R.round(rnd(0.1, 0.6), 0.05) : 0;
        o.risk = K.use === 'gewerbe' ? 2 + (o.preLet < 0.3 ? 1 : 0) : 2;
      }
    }
    o.green = false;
    if (opts.distress) { o.price = R.round(o.price * 0.78, 10000); o.cond = Math.max(20, (o.cond || 50) - 18); o.risk = 3; o.distress = true; o.name = 'Notverkauf: ' + o.name; o.expires = (st.tick || 0) + 4; o.rentY = Math.round(o.rentY * 0.92); }
    RE.offerFigures(st, club, o);
    return o;
  };
  // Kennzahlen eines Angebots (für Karten, Filter und Sortierung)
  RE.offerFigures = function (st, club, o) {
    var f = RE.fees(o), invest = (o.mode === 'neubau' ? o.price : o.price) + f.total;
    o.feesTotal = f.total;
    var netRent = o.rentY * (o.mode === 'bestand' ? o.occ : 0.95);
    var costs = o.maint + o.rentY * 0.07;
    o.grossYield = o.price ? o.rentY / o.price : 0;
    o.netYield = invest ? (netRent - costs) / invest : 0;
    var T = RE.terms(st, club, o, 10), loan = Math.round(o.price * T.ltv);
    o.equityNeed = invest - loan;
    var A = RE.annuity({ principal: loan, rate: T.rate, mode: 'tilgung', tilg: 0.02 });
    o.cfMonth = Math.round((netRent - costs) / 12 - A);
    return o;
  };
  RE.refreshMarket = function (st, club) {
    var re = RE.ensure(st), t = st.tick || 0;
    re.offers = re.offers.filter(function (o) { if (o.expires <= t) return false; return !R.chance(0.06); }); // Frist abgelaufen oder ein anderer Käufer schlägt zu
    while (re.offers.length < RE.P.offers) re.offers.push(RE.genOffer(st, club));
    re.offers.forEach(function (o) { RE.offerFigures(st, club, o); });
  };

  // ---------- Finanzierung prüfen (Ablehnung immer mit Begründung) ----------
  // fin: { equity (eingesetztes Eigenkapital inkl. Nebenkosten), fix, mode, tilg, months, standard (Neubau) }
  RE.quote = function (st, club, o, fin) {
    fin = fin || {};
    var fix = +fin.fix || 10, T = RE.terms(st, club, o, fix), f = RE.fees(o), std = RE.STANDARDS[fin.standard || 'modern'];
    var price = o.mode === 'neubau' ? o.land + Math.round(o.build * std.cost) : o.price;
    var total = price + f.total, maxLoan = Math.round(price * T.ltv);
    var equity = fin.equity != null && isFinite(+fin.equity) ? Math.min(total, Math.max(0, Math.round(fin.equity))) : Math.max(f.total, total - maxLoan);
    var loan = Math.max(0, total - equity);
    var feeAmt = Math.round(loan * T.fee);
    var terms = { principal: loan, rate: T.rate, mode: fin.mode === 'laufzeit' ? 'laufzeit' : 'tilgung', tilg: fin.tilg != null && isFinite(+fin.tilg) ? +fin.tilg : 0.02, months: (+fin.years || 25) * 12 };
    var A = RE.annuity(terms);
    var rentY = o.rentY * (o.mode === 'neubau' ? std.rent : 1), occ = o.mode === 'bestand' ? o.occ : 0.95;
    var rentM = rentY * occ / 12, costM = (o.maint + rentY * 0.07) / 12;
    var restFix = RE.balanceAfter(loan, T.rate, A, fix * 12);
    var sched = RE.schedule(loan, T.rate, A, Math.min(40, Math.max(fix, terms.mode === 'laufzeit' ? terms.months / 12 : 30)));
    var y1 = sched[0] || { zins: 0, tilg: 0 };
    var dscr = A > 0 ? (rentM - costM) / A : Infinity;
    var q = { price: price, fees: f, total: total, equity: equity, loan: loan, maxLoan: maxLoan, fee: feeAmt, rate: T.rate, normalRate: T.normal, disc: T.disc, promo: T.promo, promoName: T.promoName, bank: T.bank, ltv: T.ltv,
      fix: fix, terms: terms, annuity: A, zinsY1: y1.zins, tilgY1: y1.tilg, restFix: restFix, rentM: rentM, costM: costM, cfM: rentM - costM - A, dscr: dscr, schedule: sched, credit: T.credit, reasons: [] };
    // Kreditentscheidung
    var cr = T.credit, cash = club.cash, needCash = equity + feeAmt;
    if (equity < f.total) q.reasons.push('Die Kaufnebenkosten (' + R.fmtMoney(f.total) + ') müssen aus Eigenkapital bezahlt werden.');
    if (loan > maxLoan + f.total * 0 && loan > Math.round(price * T.ltv)) q.reasons.push('Die Bank finanziert höchstens ' + Math.round(T.ltv * 100) + ' % des ' + (o.mode === 'neubau' ? 'Projektvolumens' : 'Kaufpreises') + ' (' + R.fmtMoney(maxLoan) + '). Mehr Eigenkapital einsetzen.');
    if (needCash > cash) q.reasons.push('Nicht genug Liquidität: benötigt ' + R.fmtMoney(needCash) + ', auf dem Girokonto sind ' + R.fmtMoney(cash) + '.');
    else if (cash - needCash < Math.min(500000, RE.annualRevenue(st, club) * 0.04)) q.reasons.push('Die Liquidität des Vereins wäre gefährdet – nach dem Kauf blieben nur ' + R.fmtMoney(cash - needCash) + ' auf dem Konto.');
    if (cr.used + loan > cr.limit) q.reasons.push('Die Verschuldung wäre zu hoch: Immobilienkredite insgesamt höchstens ' + R.fmtMoney(cr.limit) + ' (3,5 × Jahresumsatz + 50 % der Liquidität).');
    if (loan > 0 && o.mode === 'bestand' && dscr < RE.P.minDSCR) q.reasons.push('Der erwartete Cashflow reicht nicht: Schuldendienstdeckung ' + dscr.toFixed(2).replace('.', ',') + ' (mindestens ' + RE.P.minDSCR.toFixed(2).replace('.', ',') + ').');
    if (loan > 0 && o.risk >= 3 && loan / Math.max(1, price) > 0.6) q.reasons.push('Das Objekt erscheint der Bank zu riskant für eine Beleihung über 60 %.');
    if (loan > 0 && cr.score < 380) q.reasons.push('Die Bonität des Vereins (' + cr.grade + ', ' + cr.score + ' Punkte) reicht für neue Immobilienkredite nicht aus. Bestehende Schulden reduzieren.');
    if (terms.mode === 'tilgung' && (terms.tilg < 0.01 || terms.tilg > 0.1)) q.reasons.push('Die Anfangstilgung muss zwischen 1 % und 10 % liegen.');
    q.ok = !q.reasons.length;
    return q;
  };

  // ---------- Kauf / Projektstart ----------
  RE.buy = function (st, club, offerId, fin) {
    var re = RE.ensure(st), o = re.offers.filter(function (x) { return x.id === offerId; })[0];
    if (!o) return { ok: false, why: 'Das Angebot ist nicht mehr verfügbar.' };
    var q = RE.quote(st, club, o, fin);
    if (!q.ok) return { ok: false, why: q.reasons.join(' '), quote: q };
    var t = st.tick || 0, std = fin && fin.standard || 'modern', E = R.econ;
    var p = { id: nid(re, 'I'), club: club.id, name: o.name.replace(/^Notverkauf: /, ''), kind: o.kind, use: o.use, mode: o.mode, region: o.region, district: o.district, year: o.year, sqm: o.sqm, units: o.units,
      cost: q.price, fees: q.fees.total, bought: t, value: o.mode === 'neubau' ? o.land : q.price, base: o.mode === 'neubau' ? o.land : q.price, idx0: re.regions[o.region].idx,
      cond: o.cond, condBuy: o.cond, occ: o.mode === 'bestand' ? o.occ : 0, sollY: o.mode === 'neubau' ? Math.round(o.rentY * RE.STANDARDS[std].rent) : o.rentY, strategy: 'normal', status: o.mode === 'bestand' ? 'bestand' : o.mode === 'land' ? 'land' : 'bau',
      standard: o.mode === 'neubau' ? std : null, green: std === 'premium' && o.mode === 'neubau', maint: o.maint, risk: o.risk, rentTick: t, mods: [], hist: [], seed: Math.floor(R.rand() * 1e6) };
    // Buchung: Kasse sinkt um Eigenkapital (inkl. Nebenkosten) und Bearbeitungsgebühr – der finanzierte Teil fließt direkt an den Verkäufer
    var cashOut = (o.mode === 'neubau' ? o.land + q.fees.total : q.total) - (o.mode === 'neubau' ? 0 : q.loan);
    if (o.mode === 'neubau') {
      // Neubau: Grundstück + Nebenkosten sofort (zuerst aus Eigenkapital), Baukosten über die Bauphasen
      var build = q.price - o.land, eqLeft = Math.max(0, q.equity - o.land - q.fees.total);
      var landLoan = Math.max(0, o.land + q.fees.total - q.equity);
      cashOut = o.land + q.fees.total - landLoan;
      p.build = { total: build, paid: 0, months: o.months, done: 0, eqLeft: eqLeft, loanLeft: q.loan - landLoan, preLet: o.preLet || 0, phase: 0, startTick: t };
      q.drawNow = landLoan;
    }
    club.cash -= cashOut + q.fee;
    E.book(club, 'Immobilienkäufe', -cashOut); if (q.fee) E.book(club, 'Immobilienkosten', -q.fee);
    re.props.push(p);
    if (q.loan > 0) {
      var drawn = o.mode === 'neubau' ? q.drawNow : q.loan;
      var l = { id: nid(re, 'K'), club: club.id, prop: p.id, bank: q.bank, principal: q.loan, drawn: drawn, balance: drawn, rate: q.rate, normalRate: q.normalRate, promo: q.promo, promoName: q.promoName,
        mode: q.terms.mode, tilg: q.terms.tilg, months: q.terms.months, fix: q.fix, start: t, fixEnd: t + q.fix * 12 * MT, annuity: o.mode === 'neubau' ? 0 : Math.round(q.annuity * 100) / 100,
        sonderYear: -1, sonderUsed: 0, interestPaid: 0, principalPaid: 0, refiNote: false, auto: true };
      re.loans.push(l);
      if (q.promo) re.usedPromos[q.promo] = (re.usedPromos[q.promo] || 0) + 1;
    }
    re.offers = re.offers.filter(function (x) { return x.id !== o.id; });
    RE.snapshot(st, club, true);
    R.season.news(st, (o.mode === 'neubau' ? 'Spatenstich: ' : o.mode === 'land' ? 'Grundstück erworben: ' : 'Immobilie gekauft: ') + p.name, R.fmtMoney(q.price) + ' · ' + RE.REGIONS[o.region].n + ' (' + o.district + ')' + (q.loan ? ' · Darlehen ' + R.fmtMoney(q.loan) + ' zu ' + (q.rate * 100).toFixed(2).replace('.', ',') + ' %' + (q.promo ? ' (Sonderaktion)' : '') : ' · ohne Kredit'), 'finanzen');
    return { ok: true, prop: p, quote: q };
  };
  // Bauprojekt auf eigener Freifläche starten
  RE.buildOnLand = function (st, club, propId, opts) {
    var re = RE.ensure(st), p = re.props.filter(function (x) { return x.id === propId && x.club === club.id; })[0];
    if (!p || p.status !== 'land') return { ok: false, why: 'Keine bebaubare Freifläche.' };
    var use = opts && opts.use || 'wohn', std = opts && opts.standard || 'modern', S = RE.STANDARDS[std];
    var sqm = Math.round(p.sqm * (use === 'wohn' ? 1.6 : 2.0)), cost = R.round(sqm * (use === 'wohn' ? 3300 : 3700) * S.cost * (0.85 + re.regions[p.region].idx * 0.15), 10000);
    var o = { mode: 'neubau', use: use, green: std === 'premium', risk: 2, price: cost, land: 0, build: cost, rentY: 0, maint: 0 };
    var rg = RE.REGIONS[p.region], rentY = Math.round((cost + p.value) * ((use === 'wohn' ? rg.yieldW : rg.yieldG) + 0.006) * S.rent / 1000) * 1000;
    var T = RE.terms(st, club, o, opts && opts.fix || 10), loan = Math.min(Math.round(cost * T.ltv), Math.max(0, Math.round(opts && opts.loan != null ? opts.loan : cost * T.ltv)));
    var eq = cost - loan;
    if (club.cash < Math.min(eq, cost * 0.15) + 200000) return { ok: false, why: 'Für den Baustart wird Eigenkapital benötigt (mind. ' + R.fmtMoney(Math.min(eq, cost * 0.15) + 200000) + ' auf dem Konto).' };
    var cr = RE.credit(st, club); if (cr.used + loan > cr.limit) return { ok: false, why: 'Die Verschuldung wäre zu hoch (Grenze ' + R.fmtMoney(cr.limit) + ').' };
    var months = use === 'wohn' ? R.clamp(Math.round(9 + sqm / 900), 9, 24) : R.clamp(Math.round(12 + sqm / 800), 12, 30);
    p.kind = use === 'wohn' ? 'mfhNeu' : 'bueroNeu'; p.use = use; p.mode = 'neubau'; p.status = 'bau'; p.standard = std; p.green = std === 'premium'; p.sqm = sqm; p.units = use === 'wohn' ? Math.round(sqm / 72) : 0;
    p.sollY = rentY; p.cond = 100; p.cost = p.value + cost; p.maint = Math.round(cost * 0.003);
    p.build = { total: cost, paid: 0, months: months, done: 0, eqLeft: eq, loanLeft: loan, preLet: use === 'gewerbe' ? 0.2 : 0, phase: 0, startTick: st.tick || 0 };
    if (loan > 0) re.loans.push({ id: nid(re, 'K'), club: club.id, prop: p.id, bank: T.bank, principal: loan, drawn: 0, balance: 0, rate: T.rate, normalRate: T.normal, promo: T.promo, promoName: T.promoName, mode: 'tilgung', tilg: 0.02, months: 300, fix: opts && opts.fix || 10, start: st.tick || 0, fixEnd: (st.tick || 0) + (opts && opts.fix || 10) * 12 * MT, annuity: 0, sonderYear: -1, sonderUsed: 0, interestPaid: 0, principalPaid: 0, refiNote: false, auto: true });
    R.season.news(st, 'Baustart auf eigener Fläche: ' + p.name, RE.STANDARDS[std].n + ' · ' + R.fmtMoney(cost) + ' · ' + months + ' Monate Bauzeit', 'finanzen');
    return { ok: true, prop: p, months: months, cost: cost };
  };

  // ---------- Monatswerte eines Objekts ----------
  RE.condF = function (cond) { return 0.82 + cond / 100 * 0.2; };
  RE.monthly = function (st, p) {
    var re = RE.ensure(st), rs = re.regions[p.region], S = RE.STRATEGIES[p.strategy || 'normal'];
    if (p.status === 'land') return { soll: 0, rent: 0, cost: Math.round(p.value * 0.002 / 12), mgmt: 0, maint: 0 };
    if (p.status === 'bau') return { soll: 0, rent: 0, cost: 0, mgmt: 0, maint: 0 };
    var busy = (p.mods || []).length ? 0.85 : 1; // während Modernisierung eingeschränkt vermietbar
    var soll = p.sollY / 12, rent = soll * p.occ * busy;
    var maint = p.value * S.cost / 12, mgmt = soll * 0.07; // nicht umlegbare Kosten + Verwaltung/Versicherung
    return { soll: soll, rent: rent, cost: maint + mgmt, mgmt: mgmt, maint: maint };
  };

  // ---------- Verkauf ----------
  RE.saleQuote = function (st, club, p) {
    var re = RE.ensure(st), l = RE.loanOf(st, p), t = st.tick || 0;
    var mkt = re.flaute ? 0.94 : 1, occF = p.status === 'bestand' ? 0.9 + p.occ * 0.1 : p.status === 'bau' ? 0.85 : 1;
    var price = Math.round(p.value * mkt * occF / 1000) * 1000, cost = Math.round(price * RE.P.saleCost);
    var bal = l ? l.balance : 0, yearsLeft = l ? Math.max(0, (l.fixEnd - t) / (12 * MT)) : 0;
    var pen = l && yearsLeft > 0 ? Math.round(bal * Math.min(RE.P.penaltyMax, RE.P.penaltyPerYear * yearsLeft)) : 0;
    var buildOpen = p.status === 'bau' ? Math.max(0, p.build.total - p.build.paid) : 0;
    if (p.status === 'bau') price = Math.round((p.value + p.build.paid) * 0.85 / 1000) * 1000, cost = Math.round(price * RE.P.saleCost);
    return { price: price, cost: cost, balance: bal, penalty: pen, net: price - cost - bal - pen, yearsLeft: yearsLeft, buildOpen: buildOpen };
  };
  RE.sell = function (st, club, propId) {
    var re = RE.ensure(st), p = re.props.filter(function (x) { return x.id === propId && x.club === club.id; })[0];
    if (!p) return { ok: false, why: 'Objekt nicht gefunden' };
    var q = RE.saleQuote(st, club, p), E = R.econ, l = RE.loanOf(st, p);
    club.cash += q.price - q.cost; E.book(club, 'Immobilienverkäufe', q.price); E.book(club, 'Immobilienkosten', -q.cost);
    if (l) { club.cash -= q.balance + q.penalty; E.book(club, 'Tilgung Immobilien', -q.balance); if (q.penalty) E.book(club, 'Immobilienzinsen', -q.penalty); re.loans = re.loans.filter(function (x) { return x !== l; }); }
    re.props = re.props.filter(function (x) { return x !== p; });
    RE.snapshot(st, club, true);
    R.season.news(st, 'Immobilie verkauft: ' + p.name, 'Verkaufspreis ' + R.fmtMoney(q.price) + ' · nach Kosten und Kreditablösung ' + (q.net >= 0 ? '+' : '') + R.fmtMoney(q.net) + ' für das Vereinskonto.', 'finanzen');
    return { ok: true, quote: q };
  };

  // ---------- Sondertilgung, Strategie, Modernisierung ----------
  RE.sonderInfo = function (st, l) { var y = Math.floor(((st.tick || 0) - l.start) / (12 * MT)); var used = l.sonderYear === y ? l.sonderUsed : 0; return { year: y, max: Math.max(0, Math.round(l.principal * RE.P.sonderMax - used)), used: used }; };
  RE.sondertilgung = function (st, club, loanId, amount) {
    var re = RE.ensure(st), l = re.loans.filter(function (x) { return x.id === loanId && x.club === club.id; })[0];
    if (!l) return { ok: false, why: 'Kredit nicht gefunden' };
    var inf = RE.sonderInfo(st, l), a = Math.min(Math.round(amount), inf.max, l.balance, Math.max(0, club.cash));
    if (!(a > 0)) return { ok: false, why: inf.max <= 0 ? 'Sondertilgungsrahmen für dieses Vertragsjahr ausgeschöpft (5 % p.a.).' : 'Kein Betrag möglich.' };
    l.balance -= a; l.principalPaid += a; club.cash -= a; R.econ.book(club, 'Tilgung Immobilien', -a);
    if (l.sonderYear !== inf.year) { l.sonderYear = inf.year; l.sonderUsed = 0; } l.sonderUsed += a;
    if (l.balance < 1) RE.closeLoan(st, l);
    return { ok: true, amount: a };
  };
  RE.closeLoan = function (st, l) { var re = RE.ensure(st); re.loans = re.loans.filter(function (x) { return x !== l; }); };
  RE.setStrategy = function (st, club, propId, s) { var p = RE.propsOf(st, club).filter(function (x) { return x.id === propId; })[0]; if (!p || !RE.STRATEGIES[s]) return false; p.strategy = s; return true; };
  RE.modernCost = function (p, k) { return Math.round(p.value * RE.MODERN[k].cost / 1000) * 1000; };
  RE.modernize = function (st, club, propId, k) {
    var p = RE.propsOf(st, club).filter(function (x) { return x.id === propId; })[0], M = RE.MODERN[k];
    if (!p || !M || p.status !== 'bestand') return { ok: false, why: 'Nur bei vermieteten Bestandsobjekten möglich.' };
    if ((p.mods || []).some(function (m) { return m.k === k; })) return { ok: false, why: 'Diese Modernisierung läuft bereits.' };
    if (k === 'energie' && p.green) return { ok: false, why: 'Das Gebäude ist bereits energetisch saniert.' };
    var c = RE.modernCost(p, k); if (club.cash < c) return { ok: false, why: 'Nicht genug Geld (' + R.fmtMoney(c) + ').' };
    club.cash -= c; R.econ.book(club, 'Immobilienkosten', -c);
    p.mods = (p.mods || []).concat([{ k: k, left: M.months, cost: c }]);
    p.value += Math.round(c * 0.5); // aktivierter Anteil
    return { ok: true, cost: c };
  };

  // ---------- Simulation ----------
  // Wird einmal je Kalenderwoche aufgerufen (season.js). Wiederholte Aufrufe derselben Woche bewirken nichts.
  RE.tick = function (st) {
    var re = RE.ensure(st), t = st.tick || 0, uc = R.season.userClub(st);
    if (uc && !re.offers.length) RE.refreshMarket(st, uc);
    if (t <= re.lastTick) return false;
    for (var k = re.lastTick + 1; k <= t; k++) {
      re.lastTick = k;
      RE.weekly(st, k);
      if (RE.isMonthEnd(k)) RE.month(st, k);
    }
    return true;
  };
  RE.weekly = function (st, k) {
    var re = st.realty;
    re.promos = re.promos.filter(function (p) { return p.end > k - 52; }); // Historie ein Jahr behalten
  };
  RE.month = function (st, k) {
    var re = st.realty, uc = R.season.userClub(st), mi = Math.floor(k / MT), E = R.econ;
    // Zinsniveau: langsamer Zufallspfad, gelegentliche Zinswende
    re.rate = R.clamp(re.rate + R.randRange(-0.0006, 0.0006), 0.012, 0.075);
    if (R.chance(0.012)) { var up = R.chance(0.5), d = R.randRange(0.004, 0.008) * (up ? 1 : -1); re.rate = R.clamp(re.rate + d, 0.012, 0.075); RE.event(st, 'Zinswende', 'Die Bauzinsen ' + (up ? 'steigen' : 'sinken') + ' deutlich auf ' + (re.rate * 100).toFixed(2).replace('.', ',') + ' % (10 Jahre fest). Neue Kredite werden ' + (up ? 'teurer' : 'günstiger') + ', bestehende Verträge behalten ihre Konditionen.', up ? 'bad' : 'good', k); }
    // Konjunktur
    re.eco = R.clamp(re.eco * 0.96 + R.randRange(-0.08, 0.08), -1, 1);
    if (re.flaute && k >= re.flaute) { re.flaute = 0; RE.event(st, 'Ende der Wirtschaftsflaute', 'Die Banken verlangen wieder die üblichen Sicherheiten.', 'good', k); }
    if (!re.flaute && R.chance(0.008)) { re.flaute = k + MT * R.randInt(4, 9); RE.event(st, 'Wirtschaftsflaute', 'Immobilienpreise geben nach, Banken verlangen höhere Sicherheiten (Beleihung −10 Prozentpunkte).', 'bad', k); Object.keys(re.regions).forEach(function (rk) { re.regions[rk].idx *= R.randRange(0.95, 0.98); }); }
    // Regionale Märkte: ruhig, Zinsniveau und Konjunktur wirken mit
    Object.keys(re.regions).forEach(function (rk) {
      var rg = RE.REGIONS[rk], s = re.regions[rk];
      var drift = rg.growth / 12 - (re.rate - RE.P.baseRate) * 0.04 + re.eco * 0.0008 + s.shock / 12 - (re.flaute ? 0.0015 : 0);
      s.idx = R.clamp(s.idx * (1 + drift + R.randRange(-rg.vol, rg.vol) / 3.5), 0.5, 3);
      s.rent = R.clamp(s.rent * (1 + rg.growth / 18 + R.randRange(-0.0015, 0.0018)), 0.6, 2.5);
      s.shock *= 0.9; s.demand = R.clamp(s.demand + (rg.demand - s.demand) * 0.1 + R.randRange(-0.01, 0.01), 0.3, 1);
    });
    if (R.chance(0.03)) RE.marketEvent(st, k);
    // Sonderaktionen
    var active = RE.activePromos(st);
    if (active.length < 2 && R.chance(0.09)) {
      var types = Object.keys(RE.PROMO_TYPES).filter(function (ty) { return !active.some(function (a) { return a.type === ty; }); }), ty = R.pick(types), T = RE.PROMO_TYPES[ty];
      var pr = { id: nid(re, 'A'), type: ty, start: k, end: k + T.weeks, title: T.t };
      re.promos.push(pr);
      RE.event(st, 'Sonderaktion: ' + T.bank, T.t + ' ' + T.txt + ' Gültig für ' + T.weeks + ' Wochen.', 'good', k, 'promo');
    }
    if (uc) {
      if (R.chance(0.05)) { var dist = RE.genOffer(st, uc, { distress: true }); re.offers.push(dist); RE.event(st, 'Notverkauf', dist.name.replace('Notverkauf: ', '') + ' wird besonders günstig angeboten – aber mit erhöhtem Risiko. Angebot nur 4 Wochen.', 'info', k); }
      RE.refreshMarket(st, uc);
    }
    // Objekte und Kredite je Verein
    var clubs = {}; re.props.forEach(function (p) { clubs[p.club] = 1; }); re.loans.forEach(function (l) { clubs[l.club] = 1; });
    Object.keys(clubs).forEach(function (cid) { var c = st.clubs[cid]; if (c) RE.monthClub(st, c, k); });
    if (uc && st.manager.role === 'trainer') RE.aiInvest(st, uc, k);
    if (uc) RE.snapshot(st, uc, false, k);
  };
  RE.monthClub = function (st, club, k) {
    var re = st.realty, E = R.econ, sum = { rent: 0, cost: 0, zins: 0, tilg: 0, bau: 0 };
    RE.propsOf(st, club).forEach(function (p) {
      var rs = re.regions[p.region], rg = RE.REGIONS[p.region], S = RE.STRATEGIES[p.strategy || 'normal'];
      if (p.status === 'bau') return RE.buildMonth(st, club, p, k, sum);
      if (p.status === 'land') { var lm = RE.monthly(st, p); sum.cost += lm.cost; p.value = Math.round(p.base * rs.idx / p.idx0); return; }
      var m = RE.monthly(st, p);
      sum.rent += m.rent; sum.cost += m.cost;
      // Zustand nach Instandhaltungsstrategie
      p.cond = R.clamp(p.cond + S.cond + (p.cond < 60 && p.strategy === 'normal' ? 0.08 : 0), 0, 100);
      if (p.strategy === 'sparsam' && R.chance(0.012 + (100 - p.cond) / 4000)) { var dmg = Math.round(p.value * R.randRange(0.01, 0.03) / 1000) * 1000; sum.cost += dmg; p.cond = Math.max(0, p.cond - 6); RE.event(st, 'Wasserschaden: ' + p.name, 'Die sparsame Instandhaltung rächt sich: Reparatur ' + R.fmtMoney(dmg) + '.', 'bad', k); }
      // Vermietung tendiert zur Zielquote (Region, Zustand, Standard)
      var target = R.clamp(1 - rg.vac * (1.6 - rs.demand) - (100 - p.cond) / 700 + (p.standard ? RE.STANDARDS[p.standard].demand : 0) + (p.use === 'gewerbe' ? re.eco * 0.03 - 0.02 : 0), 0.45, 0.99);
      p.occ = R.clamp(p.occ + (target - p.occ) * (p.use === 'gewerbe' ? 0.06 : 0.12) + R.randRange(-0.006, 0.006), 0.2, 1);
      // Modernisierungen
      (p.mods || []).forEach(function (md) { md.left--; if (md.left <= 0) { var M = RE.MODERN[md.k]; p.cond = Math.min(100, p.cond + M.cond); p.sollY = Math.round(p.sollY * (1 + M.rent)); p.base = Math.round(p.base * (1 + M.value)); if (M.green) p.green = true; RE.event(st, 'Modernisierung fertig: ' + p.name, M.n + ' abgeschlossen. Zustand ' + Math.round(p.cond) + '/100, Sollmiete ' + R.fmtMoney(p.sollY) + '/Jahr.', 'good', k); } });
      p.mods = (p.mods || []).filter(function (md) { return md.left > 0; });
      // Mietanpassung einmal im Jahr (nicht jede Woche)
      if (k - p.rentTick >= 12 * MT) { p.rentTick = k; var adj = (rs.rent - 1) * 0.35 + (p.cond - 70) / 2000 + S.rent; p.sollY = Math.round(p.sollY * R.clamp(1 + rg.growth * 0.8 + adj * 0.1, 0.97, 1.05)); }
      // Wert: an die Region gekoppelt, Zustand wirkt mit
      p.value = Math.round(p.base * (rs.idx / p.idx0) * (RE.condF(p.cond) / RE.condF(p.condBuy != null ? p.condBuy : (p.condBuy = p.cond))) / 1000) * 1000;
      if (R.chance(0.012)) RE.propEvent(st, club, p, k);
    });
    // Kredite: Zins und Tilgung getrennt, Annuität fest während der Zinsbindung
    RE.loansOf(st, club).forEach(function (l) {
      if (l.balance <= 0.5) return;
      var p = re.props.filter(function (x) { return x.id === l.prop; })[0];
      if (p && p.status === 'bau') { var zb = l.balance * l.rate / 12; sum.zins += zb; l.interestPaid += zb; return; } // Bauzeit: nur Bereitstellungs-/Bauzinsen
      var z = l.balance * l.rate / 12, tl = Math.min(l.balance, Math.max(0, l.annuity - z));
      l.balance -= tl; l.interestPaid += z; l.principalPaid += tl; sum.zins += z; sum.tilg += tl;
      if (!l.refiNote && l.fixEnd - k <= 3 * MT && l.balance > 1) { l.refiNote = true; RE.event(st, 'Zinsbindung endet bald: ' + (p ? p.name : l.id), 'In ' + Math.max(1, Math.round((l.fixEnd - k) / MT)) + ' Monat(en) endet die Zinsbindung. Restschuld ' + R.fmtMoney(l.balance) + '. Anschlussfinanzierung, Sondertilgung oder Verkauf möglich – sonst organisiert die Vereinsbank automatisch eine Anschlussfinanzierung (10 Jahre) zum dann gültigen Zins.', 'info', k, null, club); }
      if (k >= l.fixEnd && l.balance > 1) RE.refinance(st, club, l, 10, k);
      if (l.balance <= 0.5) { RE.closeLoan(st, l); RE.event(st, 'Darlehen getilgt', (p ? p.name : 'Immobilie') + ' ist schuldenfrei.', 'good', k, null, club); }
    });
    ['rent', 'cost', 'zins', 'tilg'].forEach(function (x) { sum[x] = Math.round(sum[x]); });
    club.cash += sum.rent - sum.cost - sum.zins - sum.tilg;
    if (sum.rent) E.book(club, 'Mieteinnahmen', sum.rent);
    if (sum.cost) E.book(club, 'Immobilienkosten', -sum.cost);
    if (sum.zins) E.book(club, 'Immobilienzinsen', -sum.zins);
    if (sum.tilg) E.book(club, 'Tilgung Immobilien', -sum.tilg);
    club.realtyLast = { k: k, rent: sum.rent, cost: sum.cost, zins: sum.zins, tilg: sum.tilg, bau: Math.round(sum.bau) };
    return sum;
  };
  RE.refinance = function (st, club, l, years, k) {
    var re = st.realty, T = RE.terms(st, club, { use: (re.props.filter(function (x) { return x.id === l.prop; })[0] || {}).use || 'wohn', mode: 'bestand', risk: 1 }, years);
    var old = l.rate; l.rate = T.normal; l.normalRate = T.normal; l.promo = null; l.promoName = null; l.fix = years; l.start = k; l.fixEnd = k + years * 12 * MT; l.principal = l.balance; l.refiNote = false; l.sonderYear = -1; l.sonderUsed = 0;
    l.annuity = Math.round(RE.annuity({ principal: l.balance, rate: l.rate, mode: 'tilgung', tilg: Math.max(0.02, l.tilg || 0.02) }) * 100) / 100;
    RE.event(st, 'Anschlussfinanzierung', 'Neue Zinsbindung ' + years + ' Jahre: ' + (old * 100).toFixed(2).replace('.', ',') + ' % → ' + (l.rate * 100).toFixed(2).replace('.', ',') + ' %. Neue Rate ' + R.fmtMoney(l.annuity) + '/Monat.', l.rate > old ? 'bad' : 'good', k, null, club);
  };
  // Baufortschritt: Auszahlungen nach Baufortschritt, zuerst Eigenkapital, dann Darlehen
  RE.buildMonth = function (st, club, p, k, sum) {
    var b = p.build, l = RE.loanOf(st, p), E = R.econ;
    if (b.hold > 0) { b.hold--; return; }
    b.done++;
    var share = Math.min(b.total - b.paid, Math.round(b.total / b.months));
    if (b.done >= b.months) share = b.total - b.paid;
    var fromEq = Math.min(share, b.eqLeft), fromLoan = share - fromEq;
    if (fromLoan > b.loanLeft) { fromEq += fromLoan - b.loanLeft; fromLoan = b.loanLeft; } // Mehrkosten trägt der Verein
    b.eqLeft -= Math.min(b.eqLeft, fromEq); b.loanLeft -= fromLoan; b.paid += share;
    club.cash -= fromEq; if (fromEq) E.book(club, 'Bauprojekte Immobilien', -fromEq);
    if (l && fromLoan) { l.drawn += fromLoan; l.balance += fromLoan; }
    sum.bau += share;
    p.value = p.base + Math.round(b.paid * 0.92);
    var prog = b.paid / b.total, ph = RE.phaseOf(prog);
    if (ph !== b.phase) b.phase = ph;
    // seltene Bauereignisse
    if (b.done < b.months && R.chance(0.045)) {
      var r = R.rand();
      if (r < 0.35) { var m = R.randInt(1, 3); b.months += m; RE.event(st, 'Bauverzögerung: ' + p.name, 'Lieferengpässe – die Fertigstellung verschiebt sich um ' + m + ' Monat(e).', 'bad', k, null, club); }
      else if (r < 0.6) { var add = Math.round(b.total * R.randRange(0.04, 0.1) / 1000) * 1000; b.total += add; b.eqLeft += add; RE.event(st, 'Baukosten steigen: ' + p.name, 'Gestiegene Materialkosten: +' + R.fmtMoney(add) + ' (aus Eigenmitteln).', 'bad', k, null, club); }
      else if (r < 0.8) { var save = Math.round((b.total - b.paid) * R.randRange(0.03, 0.06) / 1000) * 1000; b.total -= save; b.eqLeft = Math.max(0, b.eqLeft - save); RE.event(st, 'Günstiger Einkauf: ' + p.name, 'Die Bauleitung spart ' + R.fmtMoney(save) + ' beim Materialeinkauf.', 'good', k, null, club); }
      else { b.preLet = Math.min(1, (b.preLet || 0) + 0.25); RE.event(st, 'Erfolgreiche Vorvermietung: ' + p.name, 'Bereits ' + Math.round(b.preLet * 100) + ' % der Flächen sind vor Fertigstellung vermietet.', 'good', k, null, club); }
    }
    if (b.paid >= b.total) {
      p.status = 'bestand'; p.base = p.value = Math.round((p.base + b.total) * (p.standard === 'premium' ? 1.03 : 1) / 1000) * 1000; p.idx0 = st.realty.regions[p.region].idx; p.condBuy = 100; p.cond = 100;
      p.occ = R.clamp(Math.max(b.preLet || 0, p.use === 'wohn' ? 0.8 : 0.45) + R.randRange(0, 0.1), 0, 1); p.year = (st.startSeason || 2026) + Math.floor(k / (12 * MT)); p.rentTick = k;
      if (l) { l.annuity = Math.round(RE.annuity({ principal: l.balance, rate: l.rate, mode: l.mode, tilg: l.tilg, months: l.months }) * 100) / 100; l.principal = l.balance; }
      delete p.build;
      RE.event(st, 'Fertigstellung: ' + p.name, 'Das Gebäude ist fertig. Vermietungsstart mit ' + Math.round(p.occ * 100) + ' % Belegung. Wert ' + R.fmtMoney(p.value) + '.', 'good', k, null, club);
    }
  };
  RE.propEvent = function (st, club, p, k) {
    var wohn = p.use === 'wohn', r = R.rand();
    if (wohn) {
      if (r < 0.3) { p.occ = Math.max(0.5, p.occ - 0.08); RE.event(st, 'Mieterwechsel: ' + p.name, 'Mehrere Wohnungen werden frei. Die Vermietung dauert einige Monate.', 'bad', k, null, club); }
      else if (r < 0.55) { var c = Math.round(p.value * R.randRange(0.005, 0.015) / 1000) * 1000; club.cash -= c; R.econ.book(club, 'Immobilienkosten', -c); RE.event(st, 'Reparatur: ' + p.name, 'Heizungsausfall – Reparatur ' + R.fmtMoney(c) + '.', 'bad', k, null, club); }
      else if (r < 0.8) { p.occ = Math.min(1, p.occ + 0.05); RE.event(st, 'Hohe Nachfrage: ' + p.name, 'Lange Warteliste – die Wohnungen sind schnell vermietet.', 'good', k, null, club); }
      else { st.realty.regions[p.region].shock += 0.01; RE.event(st, 'Stadtteil im Aufwind: ' + p.district, 'Neue Cafés und Schulen – die Lage gewinnt an Attraktivität.', 'good', k, null, club); }
    } else {
      if (r < 0.3) { p.occ = Math.max(0.25, p.occ - R.randRange(0.15, 0.3)); RE.event(st, 'Großmieter kündigt: ' + p.name, 'Ein großer Mieter zieht aus – mehrere Etagen stehen leer.', 'bad', k, null, club); }
      else if (r < 0.6) { p.occ = Math.min(1, p.occ + 0.15); RE.event(st, 'Neuer langfristiger Mietvertrag: ' + p.name, 'Ein Unternehmen mietet für 10 Jahre zusätzliche Flächen.', 'good', k, null, club); }
      else if (r < 0.8) { p.cond = Math.max(0, p.cond - 10); RE.event(st, 'Modernisierungsbedarf: ' + p.name, 'Neue Brandschutzauflagen – der Zustand sinkt, eine Modernisierung lohnt sich.', 'bad', k, null, club); }
      else { p.occ = Math.min(1, p.occ + 0.1); st.realty.regions[p.region].shock += 0.008; RE.event(st, 'Neuer Unternehmensstandort', 'Ein Konzern siedelt sich in ' + p.district + ' an – starke Nachfrage nach Büroflächen.', 'good', k, null, club); }
    }
  };
  RE.marketEvent = function (st, k) {
    var re = st.realty, rk = R.pick(Object.keys(re.regions)), s = re.regions[rk], rg = RE.REGIONS[rk], r = R.rand();
    if (r < 0.25) { s.shock += 0.02; s.demand = Math.min(1, s.demand + 0.06); RE.event(st, 'Stadt wächst stark', rg.n + ': höhere Wohnungsnachfrage, steigende Immobilienwerte.', 'good', k); }
    else if (r < 0.45) { s.shock -= 0.025; s.demand = Math.max(0.3, s.demand - 0.08); RE.event(st, 'Großer Arbeitgeber schließt', rg.n + ': schlechtere Nachfrage, größeres Leerstandsrisiko.', 'bad', k); }
    else if (r < 0.65) { s.shock += 0.015; RE.event(st, 'Neue Bahnverbindung', rg.n + ': Die Lage wird attraktiver.', 'good', k); }
    else if (r < 0.82) { re.eco = Math.max(-1, re.eco - 0.3); RE.event(st, 'Homeoffice-Trend', 'Die Nachfrage nach Büroflächen sinkt spürbar.', 'bad', k); re.props.forEach(function (p) { if (p.use === 'gewerbe' && p.status === 'bestand') p.occ = Math.max(0.3, p.occ - 0.04); }); }
    else { re.eco = Math.min(1, re.eco + 0.35); RE.event(st, 'Wirtschaftlicher Aufschwung', 'Unternehmen expandieren – höhere Gewerbenachfrage.', 'good', k); }
  };
  RE.event = function (st, title, text, tone, k, kind, club) {
    var re = st.realty; re.events.unshift({ t: k != null ? k : st.tick, title: title, text: text, tone: tone || 'info', kind: kind || null });
    re.events = re.events.slice(0, 40);
    var uc = R.season.userClub(st);
    if (uc && (!club || club === uc) && (RE.propsOf(st, uc).length || kind === 'promo' || /Zinswende|Notverkauf/.test(title))) R.season.news(st, title, text, 'finanzen');
  };
  // Monatlicher Verlauf (echte gespeicherte Simulationsdaten für die Diagramme)
  RE.snapshot = function (st, club, replace, k) {
    var re = RE.ensure(st), pf = RE.portfolio(st, club), last = club.realtyLast || {};
    var row = { t: k != null ? k : (st.tick || 0), v: pf.value, d: pf.debt, e: pf.equity, r: last.k === k ? last.rent : Math.round(pf.rentY / 12), cf: last.k === k ? last.rent - last.cost - last.zins - last.tilg : Math.round(pf.cfY / 12), o: Math.round(pf.occ * 1000) / 10 };
    var h = club.realtyHist = club.realtyHist || [];
    if (h.length && h[h.length - 1].t === row.t) h[h.length - 1] = row; else if (!replace || !h.length || h[h.length - 1].t !== row.t) h.push(row);
    if (h.length > 240) h.splice(0, h.length - 240);
  };
  // KI-Geschäftsführung (Trainer-Rolle): vorsichtige Käufe, nur mit großem Liquiditätspolster
  RE.aiInvest = function (st, club, k) {
    var re = st.realty, rev = RE.annualRevenue(st, club);
    if (club.cash < rev * 0.6 || RE.propsOf(st, club).length >= 4 || !R.chance(0.15)) return;
    var cands = re.offers.filter(function (o) { return o.mode === 'bestand' && o.risk <= 2 && o.equityNeed < club.cash * 0.35; }).sort(function (a, b) { return b.netYield - a.netYield; });
    for (var i = 0; i < cands.length; i++) { var q = RE.quote(st, club, cands[i], {}); if (q.ok && q.dscr >= 1.2) { RE.buy(st, club, cands[i].id, {}); break; } }
  };

  // ---------- Prognose bis Saisonende (tatsächliche Zahlungszeitpunkte: Monatsenden im Zeitraum) ----------
  RE.forecast = function (st, club, weeksLeft) {
    var re = RE.ensure(st), t = st.tick || 0, months = 0;
    for (var k = t + 1; k <= t + weeksLeft; k++) if (RE.isMonthEnd(k)) months++;
    var rent = 0, cost = 0, zins = 0, tilg = 0, bau = 0;
    RE.propsOf(st, club).forEach(function (p) {
      var m = RE.monthly(st, p); rent += m.rent; cost += m.cost;
      if (p.status === 'bau') { var b = p.build, left = Math.max(0, b.months - b.done), mm = Math.min(months, left); bau += Math.min(b.eqLeft, (b.total - b.paid) * (left ? mm / left : 0)); }
    });
    RE.loansOf(st, club).forEach(function (l) {
      var B = l.balance, A = l.annuity, i = l.rate / 12;
      for (var m = 0; m < months && B > 0.5; m++) { var z = B * i; zins += z; if (A > 0) { var tl = Math.min(B, Math.max(0, A - z)); tilg += tl; B -= tl; } }
    });
    return { months: months, rent: Math.round(rent * months), cost: Math.round(cost * months), zins: Math.round(zins), tilg: Math.round(tilg), bau: Math.round(bau) };
  };
})(RFM);
