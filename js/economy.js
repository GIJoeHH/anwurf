// ANWURF! – Wirtschaft: Stadion, Zuschauer, Vereinsstadt, Bank, Märkte
(function (R) {
  var D = R.data, W = R.world;
  var E = R.econ = {};

  function lv(club, key) { var f = D.facilities[key]; return f.levels[club.fac[key] != null ? club.fac[key] : (f.min || 0)]; }
  E.level = lv;
  E.WEEKS = 34; // Wirtschaftsjahr = 34 Spielwochen

  function plan(club) { return R.stadium && R.stadium.has(club); }
  E.capacity = function (club) { var p = E.capacityParts(club); return p.steh + p.sitz + p.vip; };
  E.capacityParts = function (club) { if (plan(club)) { var q = R.stadium.parts(club); return { steh: q.steh, sitz: q.sitz, vip: q.vip, biz: q.business }; } return { steh: lv(club, 'steh').cap, sitz: lv(club, 'sitz').cap, vip: lv(club, 'vip').vip }; };
  E.PLAN_KEYS = ['steh', 'sitz', 'vip']; // ersetzt durch den Hallenplan
  // Gästeblock: Kapazität (Hallenplan) bzw. 8 % der Stehplätze/Sitzplätze bei Vereinen ohne Plan
  E.guestCap = function (club) { if (plan(club)) return R.stadium.guestCap(club); var p = E.capacityParts(club); return Math.round((p.steh + p.sitz) * 0.08); };
  E.transportCap = function (club) {
    return lv(club, 'oepnv').fans + Math.min(lv(club, 'parken').cars * 2.6, lv(club, 'strasse').fans);
  };

  // Hallenattraktivität 0..100 (Komfort, Ausstattung, Erreichbarkeit, Umfeld)
  E.attractiveness = function (club) {
    var a = 10;
    ['dach', 'licht', 'video', 'rasen', 'sanitaer', 'hosp', 'technik'].forEach(function (k) { a += lv(club, k).att || 0; });
    ['oepnv', 'strasse', 'parken'].forEach(function (k) { a += lv(club, k).att || 0; });
    var parts = E.capacityParts(club), cap = parts.steh + parts.sitz + parts.vip;
    a += cap ? 5 * (parts.sitz + parts.vip) / cap : 0;
    a += Math.min(12, (club.fac.fanshop || 0) * 0.8 + (club.fac.restaurant || 0) * 0.8 + (club.fac.cafe || 0) * 0.5 + (club.fac.museum || 0) * 0.6 + (club.fac.erlebnis || 0) * 0.8);
    a -= Math.min(10, (club.congestion || 0) * 10);
    a += club.attBonus || 0;
    if (club.pitch != null && club.pitch < 100) a -= (100 - club.pitch) / 8; // Bodenzustand nach Großereignissen
    return R.clamp(Math.round(a), 0, 100);
  };

  E.refPrices = { 1: { steh: 13, sitz: 26, vip: 140 }, 2: { steh: 10, sitz: 17, vip: 75 }, 3: { steh: 7, sitz: 11, vip: 35 } };
  function priceFactor(price, ref) { var r = Math.max(0.1, price / ref); return R.clamp(Math.pow(r, -1.35), 0.05, 1.8); }

  E.leaguePos = function (st, club) {
    var t = R.season.table(st, W.lk(club));
    for (var i = 0; i < t.length; i++) if (t[i].id === club.id) return i + 1;
    return 9;
  };

  // Sportliche Nachfrage 0.5..1.6
  E.sportFactor = function (st, club) {
    var pos = st.week >= 3 ? E.leaguePos(st, club) : (club.lastPos || 9);
    var n = (st.leagues[W.lk(club)] && st.leagues[W.lk(club)].clubIds.length) || 18;
    var f = 0.78 + 0.45 * (1 - (pos - 1) / (n - 1));
    var form = club.form || [];
    f += R.sum(form.slice(-5), function (r) { return r === 'S' ? 0.025 : r === 'N' ? -0.02 : 0; });
    if (st.week > 22 && (pos <= 3 || pos >= n - 2)) f += 0.08; // Aufstiegs-/Abstiegskampf
    f += Math.min(0.15, (club.titles.league * 0.03 + club.titles.cup * 0.01));
    return R.clamp(f, 0.5, 1.6);
  };

  // Zuschauerberechnung für ein Heimspiel
  E.attendance = function (st, home, away, comp) {
    var leagueF = { 1: 1.0, 2: 0.82, 3: 0.66 }[home.league];
    var sport = E.sportFactor(st, home);
    var oppF = 0.88 + (away ? away.reputation : 50) / 100 * 0.3;
    var derby = away && home.rivals.indexOf(away.id) >= 0 ? 1.35 : 1;
    var compF = comp === 'cup' ? 1.05 : comp === 'releg' ? 1.4 : comp === 'final' ? 2 : comp === 'friendly' ? 0.22 : 1;
    var attr = E.attractiveness(home);
    var attrF = 0.7 + 0.5 * (1 - Math.exp(-attr / 35));
    var fanCare = [0.97, 1, 1.04][home.budgets.fans];
    var mkt = [0.98, 1, 1.03][home.budgets.marketing];
    var trustF = 0.9 + (home.fanTrust != null ? home.fanTrust : 60) / 500; // Fanvertrauen
    var promoF = home.ticketPromo > 0 ? 1.05 : 1;
    var demand = home.fans * 1.05 * leagueF * sport * oppF * derby * compF * attrF * fanCare * mkt * trustF * promoF;
    var parts = E.capacityParts(home), ref = E.refPrices[home.league], prices = home.tickets;
    if (home.blockedArea && comp !== 'final') { parts = { steh: Math.round(parts.steh * 0.8), sitz: Math.round(parts.sitz * 0.8), vip: parts.vip, biz: parts.biz }; }
    // Gästefans: je höher die Liga und je größer/besser der Gegner, desto mehr reisen an (Derby: noch mehr)
    var gDemand = 0, gCap = 0, gType = 'steh', guests = 0;
    if (away && comp !== 'final') {
      var lgF = { 1: 0.05, 2: 0.034, 3: 0.022 }[home.league] || 0.02;
      gDemand = away.fans * lgF * (0.55 + away.reputation / 110) * (derby > 1 ? 1.8 : 1) * (comp === 'cup' ? 1.25 : comp === 'releg' ? 1.6 : comp === 'friendly' ? 0.15 : 1) * (0.85 + E.sportFactor(st, away) * 0.15);
      gCap = E.guestCap(home); if (home.blockedArea) gCap = Math.round(gCap * 0.8);
      gType = plan(home) ? R.stadium.guestType(home) : 'steh';
      var gk = gType === 'sitz' || gType === 'steh' ? gType : 'sitz';
      gCap = Math.min(gCap, parts[gk] || 0);
      guests = Math.round(Math.min(gCap, gDemand * priceFactor(prices[gk], ref[gk])));
      parts = { steh: parts.steh - (gk === 'steh' ? gCap : 0), sitz: parts.sitz - (gk === 'sitz' ? gCap : 0), vip: parts.vip, biz: parts.biz };
      gType = gk;
    }
    var capNorm = parts.steh + parts.sitz || 1;
    var res = { steh: 0, sitz: 0, vip: 0 };
    ['steh', 'sitz'].forEach(function (k) {
      var share = parts[k] / capNorm;
      var d = demand * share * priceFactor(prices[k], ref[k]) * (k === 'sitz' ? 0.95 : 1.05);
      res[k] = Math.round(Math.min(parts[k], d));
    });
    // Logen (VIP-Preis) und Business-Plätze (35 % des VIP-Preises, breitere Nachfrage)
    var bizCap = parts.biz || 0, logeCap = parts.vip - bizCap;
    var vipD = logeCap * (0.45 + home.reputation / 140) * sport * priceFactor(prices.vip, ref.vip) * (comp === 'final' ? 1.5 : 1);
    var bizD = bizCap * (0.35 + home.reputation / 180) * sport * priceFactor(prices.vip, ref.vip) * (comp === 'final' ? 1.5 : 1);
    var resLoge = Math.round(Math.min(logeCap, vipD)), resBiz = Math.round(Math.min(bizCap, bizD));
    res.vip = resLoge + resBiz;
    var total = res.steh + res.sitz + res.vip + guests;
    // Verkehr: Engpass → Staus, Zuschauerverlust, Unzufriedenheit
    var tcap = E.transportCap(home);
    var congestion = 0;
    if (total > tcap) {
      var lost = (total - tcap) * 0.45;
      congestion = R.clamp((total - tcap) / Math.max(1, total), 0, 1);
      var keep = (total - lost) / total;
      res.steh = Math.round(res.steh * keep); res.sitz = Math.round(res.sitz * keep); resLoge = Math.round(resLoge * keep); resBiz = Math.round(resBiz * keep); res.vip = resLoge + resBiz; guests = Math.round(guests * keep);
      total = res.steh + res.sitz + res.vip + guests;
    }
    var transitShare = Math.min(0.75, lv(home, 'oepnv').fans / Math.max(1, total));
    var carsUsed = Math.min(lv(home, 'parken').cars, total * (1 - transitShare) / 2.6);
    var ticket = (res.steh * prices.steh + res.sitz * prices.sitz) * (home.ticketPromo > 0 ? 0.9 : 1) + resLoge * prices.vip + resBiz * prices.vip * 0.35 + guests * prices[gType];
    if (home.freeTickets) { var ft = Math.min(home.freeTickets, res.steh + res.sitz); ticket -= ft * prices.steh; }
    var cater = total * (3 + (lv(home, 'hosp').att || 0) * 0.5) + resLoge * 40 + resBiz * 15;
    var parking = carsUsed * (lv(home, 'parken').fee || 0);
    return { total: total, parts: res, guests: guests, guestDemand: Math.round(gDemand), guestCap: gCap, capacity: E.capacity(home), ticket: ticket, cater: cater, parking: parking, congestion: congestion, demand: Math.round(demand), satisfaction: R.clamp(Math.round(100 - congestion * 120 - Math.max(0, (prices.steh / ref.steh - 1) * 40)), 0, 100) };
  };

  // ---------- Vereinsstadt ----------
  E.synergy = function (club, key) {
    var f = club.fac, s = 0;
    if (key === 'fanshop') s = (f.museum || 0) * 0.04 + (f.erlebnis || 0) * 0.05;
    if (key === 'hotel') s = (f.eventhalle || 0) * 0.08 + Math.max(0, lv(club, 'oepnv').att - 2) * 0.03;
    if (key === 'restaurant') s = (f.vip || 0) * 0.04 + (f.eventhalle || 0) * 0.03;
    if (key === 'museum') s = Math.max(0, (f.oepnv || 1) - 3) * 0.06 + (f.hotel || 0) * 0.02;
    if (key === 'eventhalle') s = Math.max(0, (f.parken || 1) - 3) * 0.07 + (f.hotel || 0) * 0.03;
    if (key === 'erlebnis') s = (f.fanshop || 0) * 0.03;
    if (key === 'cafe') s = (f.museum || 0) * 0.03;
    return Math.min(0.3, s); // gedeckelt
  };
  E.demandFactor = function (st, club, key) {
    var sport = st ? E.sportFactor(st, club) : 1;
    var avgAtt = club.avgAttendance || E.capacity(club) * 0.7;
    var f = 1;
    switch (key) {
      case 'fanshop': f = Math.pow(club.fans / 5000, 0.5) * (0.8 + club.reputation / 250) * sport * (0.85 + (club.fanTrust != null ? club.fanTrust : 60) / 400) * (club.shopPromo > 0 ? 0.9 : 1) * (club.shirtBoost > 0 ? 1.05 : 1); break;
      case 'restaurant': f = Math.pow(avgAtt / 3000, 0.5); break;
      case 'cafe': f = Math.pow(club.fans / 4000, 0.5); break;
      case 'hotel': f = 0.55 + club.reputation / 300 + (club.league === 1 ? 0.15 : 0); break;
      case 'museum': f = Math.pow(club.fans / 5000, 0.5) * (0.7 + Math.min(0.5, club.titles.league * 0.06 + club.titles.cup * 0.03 + club.titles.promo * 0.02 + club.tradition / 300)); break;
      case 'eventhalle': f = 0.75 + (club.fac.strasse || 1) * 0.04; break;
      case 'erlebnis': f = Math.pow(club.fans / 4000, 0.5) * sport; break;
      case 'gewerbe': f = 0.7 + (club.fac.strasse || 1) * 0.04 + (club.fac.oepnv || 1) * 0.03; break;
      default: f = 1;
    }
    return R.clamp(f, 0.25, 2.2) * (1 + E.synergy(club, key));
  };
  E.buildingRevenue = function (st, club, key, level) {
    var l = D.facilities[key].levels[level == null ? club.fac[key] : level];
    if (!l || !l.rev) return 0;
    return l.rev * E.demandFactor(st, club, key) * [0.88, 1, 1.1][club.cityPrice == null ? 1 : club.cityPrice];
  };

  E.energySave = function (club) { return lv(club, 'solar').save || 0; };
  E.upkeepTotal = function (club) {
    var sum = 0;
    var pl = plan(club);
    Object.keys(D.facilities).forEach(function (k) { if (pl && E.PLAN_KEYS.indexOf(k) >= 0) return; var l = lv(club, k); if (l) sum += l.up; });
    if (pl) sum += R.stadium.upkeep(club);
    return sum * (1 - E.energySave(club));
  };
  E.budgetCost = function (club, area) {
    var base = { 1: 1100000, 2: 380000, 3: 110000 }[club.league] * D.MONEY;
    return base * [0.55, 1, 1.7][club.budgets[area]];
  };
  E.wageTotal = function (st, club) {
    var w = 0; for (var id in st.players) { var p = st.players[id]; if (p.clubId === club.id) w += p.wage; }
    return w + (club.coach ? club.coach.wage : 0) + E.staffWages(club);
  };
  // Trainerstab
  E.staffLvl = function (club, k) { return club && club.staff && club.staff[k] ? club.staff[k].lvl : 0; };
  E.staffWageFor = function (club, lvl) { return Math.round(D.staffWage.factor[lvl] * D.staffWage.base[club.league] / 1000) * 1000; };
  E.staffWages = function (club) { var w = 0; if (club.staff) Object.keys(club.staff).forEach(function (k) { w += club.staff[k].wage || 0; }); return w; };
  E.setStaff = function (st, club, k, lvl) {
    if (!D.staff[k] || lvl < 0 || lvl > 3) return { ok: false };
    club.staff = club.staff || {};
    var cur = club.staff[k];
    if (cur && cur.lvl > 0 && lvl !== cur.lvl) { var comp = Math.round(cur.wage * 0.25); club.cash -= comp; E.book(club, 'Abfindungen', -comp); }
    if (!lvl) { delete club.staff[k]; return { ok: true }; }
    club.staff[k] = { lvl: lvl, wage: E.staffWageFor(club, lvl), name: R.pick(D.firstNames) + ' ' + R.pick(D.lastNames) };
    return { ok: true, s: club.staff[k] };
  };
  // Verletzungsrisiko-Faktor durch Fitnesstrainer und Ernährungsberater
  E.injuryStaffF = function (club) { return 1 - E.staffLvl(club, 'fitness') * 0.05 - E.staffLvl(club, 'ernaehrung') * 0.03; };
  E.sponsorTotal = function (club) { return R.sum(club.sponsors, function (s) { return s.amount; }); };

  // Wirtschaftlichkeitsrechnung vor einem Ausbau
  E.buildPreview = function (st, club, key) {
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    var next = f.levels[cur + 1];
    if (!next) return null;
    var cost = next.cost * (1 - E.subRate(club, next));
    var revNow = E.buildingRevenue(st, club, key, cur), revNext = E.buildingRevenue(st, club, key, cur + 1);
    var upNow = f.levels[cur] ? f.levels[cur].up : 0;
    var addRev = revNext - revNow, addCost = next.up - upNow;
    if (key === 'steh' || key === 'sitz' || key === 'vip') {
      var avgPrice = key === 'vip' ? club.tickets.vip : club.tickets[key];
      var capAdd = key === 'vip' ? next.vip - f.levels[cur].vip : next.cap - f.levels[cur].cap;
      var demandRoom = Math.max(0, (club.lastDemand || club.avgAttendance || 0) - E.capacity(club));
      addRev = Math.min(capAdd, demandRoom + capAdd * 0.15) * avgPrice * 17;
    }
    if (key === 'parken') addRev = (next.cars - f.levels[cur].cars) * 0.5 * (next.fee || 0) * 17;
    var surplus = addRev - addCost;
    return { name: next.n, cost: cost, subsidy: next.cost * E.subRate(club, next), weeks: next.wk, addRev: addRev, addCost: addCost, surplus: surplus, payback: surplus > 0 ? cost / surplus : null };
  };

  // Öffentliche Zuschüsse hängen von der öffentlichen Wahrnehmung ab
  E.subRate = function (club, lvl) { if (!lvl || !lvl.sub) return 0; return Math.min(0.5, lvl.sub * (0.8 + (club.publicImage != null ? club.publicImage : 50) / 250)); };
  // Gleichzeitige Bauvorhaben (Ausbaustufen + Tribünenprojekte in der Halleplan)
  // Begrenzung nur in der Halle (Ausstattung, Verkehr, Tribünen in der Halleplan): max. 10 gleichzeitig.
  // Vereinsstadt und Abteilungen (Medizin, Jugend, Training) sind unbegrenzt.
  E.MAX_BUILDS = 10;
  E.STADIUM_GROUPS = ['stadion', 'infra'];
  E.isStadiumKey = function (key) { return E.STADIUM_GROUPS.indexOf(D.facilities[key].group) >= 0; };
  E.buildCount = function (club) { return club.construction.filter(function (c) { return E.isStadiumKey(c.key); }).length + (club.stadium && club.stadium.jobs ? club.stadium.jobs.length : 0); };
  E.canBuild = function (st, club, key) {
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    if (!f.levels[cur + 1]) return { ok: false, why: 'Höchste Stufe erreicht' };
    if (club.construction.some(function (c) { return c.key === key; })) return { ok: false, why: 'Wird bereits ausgebaut' };
    if (E.isStadiumKey(key) && E.buildCount(club) >= E.MAX_BUILDS) return { ok: false, why: 'Maximal ' + E.MAX_BUILDS + ' Bauvorhaben in der Halle gleichzeitig' };
    var cost = f.levels[cur + 1].cost * (1 - E.subRate(club, f.levels[cur + 1]));
    if (club.cash < cost) return { ok: false, why: 'Nicht genug Geld (' + R.fmtMoney(cost) + ')' };
    return { ok: true, cost: cost };
  };
  E.startBuild = function (st, club, key) {
    var c = E.canBuild(st, club, key);
    if (!c.ok) return c;
    var f = D.facilities[key], cur = club.fac[key] != null ? club.fac[key] : (f.min || 0);
    var next = f.levels[cur + 1];
    club.cash -= c.cost;
    E.book(club, 'Bauprojekte', -c.cost);
    club.construction.push({ key: key, to: cur + 1, weeks: Math.max(1, next.wk), total: Math.max(1, next.wk), cost: c.cost });
    club.history.push({ season: st.season, type: 'bau', text: 'Baubeginn: ' + next.n + ' (' + R.fmtMoney(c.cost) + ')' });
    return { ok: true };
  };
  E.progressConstruction = function (st, club) {
    var done = [];
    if (R.stadium) R.stadium.progress(st, club);
    club.construction.forEach(function (c) { c.weeks--; if (c.weeks <= 0) done.push(c); });
    done.forEach(function (c) {
      club.fac[c.key] = c.to;
      club.construction.splice(club.construction.indexOf(c), 1);
      var n = D.facilities[c.key].levels[c.to].n;
      club.stadiumHist.push({ season: st.season, week: st.week, key: c.key, level: c.to, name: n });
      if (club.userControlled) R.season.news(st, 'Bauprojekt abgeschlossen: ' + n, club.name + ' feiert die Fertigstellung. ' + D.facilities[c.key].name + ' jetzt Stufe ' + c.to + '.', 'bau');
      if (c.cost >= 500000) club.history.push({ season: st.season, type: 'bau', text: 'Fertigstellung: ' + n });
    });
    return done;
  };

  // ---------- Buchhaltung ----------
  E.book = function (club, cat, amount) {
    var s = club.fin.season; s[cat] = (s[cat] || 0) + amount;
  };

  // Bank
  E.debt = function (club) { return R.sum(club.loans, function (l) { return l.amount; }); };
  E.facilityValue = function (club) {
    var v = 0;
    var pl = plan(club);
    Object.keys(D.facilities).forEach(function (k) { if (pl && E.PLAN_KEYS.indexOf(k) >= 0) return; var f = D.facilities[k], cur = club.fac[k] || 0; for (var i = 1; i <= cur; i++) if (f.levels[i]) v += f.levels[i].cost; });
    if (pl) v += R.stadium.value(club);
    return v;
  };
  E.revenueEstimate = function (st, club) {
    var tv = D.leagueTV[club.league];
    var att = (club.avgAttendance || E.capacity(club) * 0.6) * 17 * (club.tickets.steh + club.tickets.sitz) / 2;
    return tv + E.sponsorTotal(club) + att;
  };
  E.creditLimit = function (st, club) {
    return Math.max(0, R.round(E.revenueEstimate(st, club) * 0.6 + E.facilityValue(club) * 0.25 - E.debt(club), 5000));
  };
  E.loanRate = function (st, club) {
    var rev = E.revenueEstimate(st, club) || 1;
    var ratio = (E.debt(club) - Math.max(0, club.cash)) / rev;
    return R.clamp(0.035 + Math.max(0, ratio) * 0.06 + (club.cash < 0 ? 0.03 : 0), 0.035, 0.16);
  };
  E.takeLoan = function (st, club, amount) {
    amount = Math.round(amount);
    if (amount <= 0) return { ok: false, why: 'Ungültiger Betrag' };
    if (amount > E.creditLimit(st, club)) return { ok: false, why: 'Kreditrahmen überschritten' };
    var rate = E.loanRate(st, club);
    club.loans.push({ amount: amount, rate: rate, since: st.season });
    club.cash += amount;
    E.book(club, 'Kreditaufnahme', amount);
    return { ok: true, rate: rate };
  };
  E.repayLoan = function (st, club, amount) {
    amount = Math.min(Math.round(amount), E.debt(club), Math.max(0, club.cash));
    if (amount <= 0) return { ok: false, why: 'Kein Betrag tilgbar' };
    var left = amount;
    club.loans.sort(function (a, b) { return b.rate - a.rate; });
    club.loans.forEach(function (l) { var x = Math.min(l.amount, left); l.amount -= x; left -= x; });
    club.loans = club.loans.filter(function (l) { return l.amount > 0.5; });
    club.cash -= amount;
    E.book(club, 'Tilgung', -amount);
    return { ok: true, amount: amount };
  };
  E.deposit = function (club, amount) { amount = Math.min(Math.round(amount), Math.max(0, club.cash)); if (amount <= 0) return false; club.cash -= amount; club.savings += amount; return true; };
  E.withdraw = function (club, amount) { amount = Math.min(Math.round(amount), club.savings); if (amount <= 0) return false; club.savings -= amount; club.cash += amount; return true; };

  // Märkte
  E.marketDef = function (sym) { return D.stocks.concat(D.cryptos).filter(function (s) { return s.id === sym; })[0]; };
  E.price = function (st, sym) { var m = st.market.stocks[sym] || st.market.crypto[sym]; return m ? m.price : 0; };
  E.HIST = 104; // Kursverlauf: zwei Jahre (Wochenwerte)
  // Fehlende Märkte ergänzen (ältere Spielstände, neue Werte wie die BVB-Aktie)
  // Vorgeschichte eines Kurses (52 Wochen Zufallsweg, endet beim Startkurs) – eigener Zufall, die Spielwelt bleibt unberührt
  E.seedHist = function (s, salt) {
    var x = 0; for (var i = 0; i < s.id.length; i++) x = (x * 31 + s.id.charCodeAt(i)) >>> 0; x = (x + (salt || 0)) >>> 0 || 1;
    var rnd = function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    var out = [s.price], p = s.price;
    for (var w = 0; w < 51; w++) { var g = (rnd() + rnd() + rnd() - 1.5) * 1.4; p = p / Math.exp(s.drift + s.vol * g); out.unshift(p); }
    return out;
  };
  E.TICKS = 5; // Handelstage pro Spielwoche (für die Kurscharts)
  // Kleiner eigener Zufallsgenerator (verändert den Spielzufall nicht)
  function mrng(str) {
    var x = 2166136261; for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } x = x || 1;
    return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  }
  function mgauss(rnd) { return (rnd() + rnd() + rnd() + rnd() - 2) * 1.732; }
  // Tagesverlauf zwischen zwei Wochenkursen (Brownsche Brücke im Log-Raum, endet genau beim Wochenkurs)
  E.dayTicks = function (a, b, vol, rnd) {
    var n = E.TICKS, sd = vol * 0.8 / Math.sqrt(n), walk = [0], out = [];
    for (var i = 1; i <= n; i++) walk.push(walk[i - 1] + sd * mgauss(rnd));
    var la = Math.log(a), lb = Math.log(b);
    for (var j = 1; j <= n; j++) { var t = j / n; out.push(+Math.exp(la + (lb - la) * t + walk[j] - t * walk[n]).toPrecision(6)); }
    return out;
  };
  E.buildTicks = function (s, m, salt) {
    var rnd = mrng(s.id + ':' + salt), t = [];
    for (var i = 0; i < m.hist.length; i++) t = t.concat(E.dayTicks(i ? m.hist[i - 1] : m.hist[0] * Math.exp(s.vol * mgauss(rnd) * 0.5), m.hist[i], s.vol, rnd));
    m.ticks = t;
  };
  E.ensureMarkets = function (st) {
    st.market = st.market || { stocks: {}, crypto: {} };
    function fix(s, bucket) {
      var m = bucket[s.id];
      if (!m) m = bucket[s.id] = { price: s.price, hist: E.seedHist(s, st.seed) };
      // Kurze Kurshistorie (ältere Spielstände): Vorgeschichte ergänzen, die beim ersten bekannten Kurs endet
      if (m.hist.length < 52 && !m.backfilled) {
        var pre = E.seedHist({ id: s.id, price: m.hist[0] || m.price, vol: s.vol, drift: s.drift }, st.seed).slice(0, 52 - m.hist.length);
        m.hist = pre.concat(m.hist); if (m.marks) m.marks.forEach(function (k) { k.i += pre.length; });
        m.backfilled = true; m.ticks = null;
      }
      if (!m.ticks || m.ticks.length !== m.hist.length * E.TICKS) E.buildTicks(s, m, st.seed);
    }
    D.stocks.forEach(function (s) { fix(s, st.market.stocks); });
    D.cryptos.forEach(function (s) { fix(s, st.market.crypto); });
  };
  // Verein hinter der Vereinsaktie (echte Welt: Borussia Dortmund, fiktive Welt: Verein aus Dortmund)
  E.bvbClub = function (st) { return null; }; // ANWURF!: keine börsennotierte Vereinsaktie (kein Handballverein ist an der Börse)
  // Neuen Kurs anhängen; marks = besondere Ereignisse (Crash, Übernahme) für die Chartanzeige
  E.marketPush = function (m, mark, st, sym) {
    var prev = m.hist[m.hist.length - 1] || m.price, def = sym && E.marketDef(sym);
    m.hist.push(m.price);
    if (m.ticks) m.ticks = m.ticks.concat(E.dayTicks(prev, m.price, def ? def.vol : 0.05, mrng((sym || '') + ':' + (st ? st.seed + ':' + st.season + ':' + st.week + ':' + m.hist.length : m.hist.length))));
    if (m.hist.length > E.HIST) { m.hist.shift(); if (m.ticks) m.ticks.splice(0, E.TICKS); if (m.marks) { m.marks.forEach(function (k) { k.i--; }); m.marks = m.marks.filter(function (k) { return k.i >= 0; }); } }
    if (mark) { m.marks = m.marks || []; m.marks.push({ i: m.hist.length - 1, t: mark }); }
  };
  E.updateMarkets = function (st) {
    E.ensureMarkets(st);
    var chaos = st.settings.difficulty === 'chaos' ? 1.5 : 1;
    // Börsencrash in unregelmäßigen Abständen (ca. alle 1–2 Saisons), danach langsame Erholung
    var crash = R.chance(0.022 * chaos) ? R.randRange(0.12, 0.32) : 0;
    if (crash) st.news.unshift({ season: st.season, week: st.week, title: 'BÖRSENCRASH! Kurse brechen um bis zu ' + Math.round(crash * 100) + ' % ein', text: 'Panikverkäufe an allen Märkten. Mutige kaufen jetzt billig nach …', type: 'markt' });
    var alerts = [];
    if (crash) alerts.push({ k: 'crash', ic: '📉', t: 'Börsencrash!', x: 'Panikverkäufe an allen Märkten – die Kurse brechen um bis zu ' + Math.round(crash * 100) + ' % ein. Kryptowährungen trifft es besonders hart. Danach erholen sich die Kurse meist langsam.' });
    st.market.recovery = crash ? crash * 0.5 : (st.market.recovery || 0) * 0.9;
    var bvb = E.bvbClub(st);
    D.stocks.forEach(function (s) {
      var m = st.market.stocks[s.id];
      var shock = R.chance(0.01) ? R.randRange(-0.2, 0.15) : 0;
      var r = s.drift + s.vol * chaos * R.gauss(0, 1) + shock + (st.market.recovery || 0) * 0.08;
      if (crash) r -= crash * R.randRange(0.7, 1.15);
      if (s.club && bvb && st.week > 0) { // Vereinsaktie folgt dem sportlichen Erfolg
        var pos = E.leaguePos(st, bvb), n = st.leagues[W.lk(bvb)].clubIds.length;
        r += (0.5 - (pos - 1) / (n - 1)) * 0.012 - (bvb.league - 1) * 0.01;
        if (bvb.form && bvb.form.length) r += bvb.form[bvb.form.length - 1] === 'S' ? 0.01 : bvb.form[bvb.form.length - 1] === 'N' ? -0.01 : 0;
      }
      m.price = Math.max(s.club ? 0.2 : 0.5, m.price * Math.exp(r));
      E.marketPush(m, crash ? 'Crash' : null, st, s.id);
    });
    D.cryptos.forEach(function (s) {
      var m = st.market.crypto[s.id];
      var r = s.drift + s.vol * chaos * R.gauss(0, 1);
      if (R.chance(0.03)) { var dn = R.randRange(0.3, 0.6); r -= dn; st.news.unshift({ season: st.season, week: st.week, title: s.name + ' crasht!', text: 'Panik an den Kryptomärkten.', type: 'markt' }); alerts.push({ k: 'ccrash', ic: '🪙', t: s.name + ' crasht!', x: 'Panik an den Kryptomärkten: ' + s.name + ' verliert binnen einer Woche rund ' + Math.round((1 - Math.exp(-dn)) * 100) + ' %.', sym: s.id }); }
      else if (R.chance(0.03)) { var up = R.randRange(0.3, 0.7); r += up; st.news.unshift({ season: st.season, week: st.week, title: s.name + ' explodiert!', text: 'Spekulationsblase oder Revolution?', type: 'markt' }); alerts.push({ k: 'cboom', ic: '🚀', t: s.name + ' explodiert!', x: 'Spekulationsblase oder Revolution? ' + s.name + ' legt binnen einer Woche rund ' + Math.round((Math.exp(up) - 1) * 100) + ' % zu.', sym: s.id }); }
      // Mean-Reversion gegen Extremwerte
      r -= 0.02 * Math.log(m.price / s.price);
      if (crash) r -= crash * R.randRange(1.2, 1.8);
      m.price = Math.max(0.0005, m.price * Math.exp(r));
      E.marketPush(m, crash ? 'Crash' : null, st, s.id);
    });
    st.savingsRate = R.clamp(st.savingsRate + R.gauss(0, 0.001), 0.005, 0.04);
    E.marketRecords(st, alerts);
    if (alerts.length) { st.marketAlerts = (st.marketAlerts || []).concat(alerts).slice(-8); }
  };
  // Rekordhöhen: Marktindex (Aktien), einzelne Werte im eigenen Depot, Depotwert des eigenen Vereins
  E.marketIndex = function (st) {
    var lg = 0, n = 0;
    D.stocks.forEach(function (s) { if (s.club) return; var m = st.market.stocks[s.id]; if (m) { lg += Math.log(m.price / s.price); n++; } });
    return n ? Math.round(1000 * Math.exp(lg / n)) : 1000;
  };
  E.marketRecords = function (st, alerts) {
    var mk = st.market, idx = E.marketIndex(st);
    if (mk.indexAth == null) mk.indexAth = idx;
    if (idx > mk.indexAth * 1.005) {
      if (!mk.indexAthTick || (st.tick || 0) - mk.indexAthTick >= 4) alerts.push({ k: 'ath', ic: '🏛', t: 'Rekordhoch am Aktienmarkt!', x: 'Der ANWURF-Aktienindex steigt auf ' + R.fmtNum(idx) + ' Punkte – so hoch stand er noch nie. Die Stimmung an der Börse ist euphorisch.' });
      mk.indexAth = idx; mk.indexAthTick = st.tick || 0;
    }
    var uc = R.season.userClub(st); if (!uc) return;
    Object.keys(uc.portfolio).forEach(function (sym) {
      var m = mk.stocks[sym] || mk.crypto[sym], def = E.marketDef(sym); if (!m || !def) return;
      var ath = Math.max.apply(null, m.hist.slice(0, -1));
      if (m.price > ath * 1.01 && (!m.athTick || (st.tick || 0) - m.athTick >= 4)) {
        m.athTick = st.tick || 0;
        alerts.push({ k: 'pfath', ic: '⭐', t: def.name + ' auf Rekordhoch', x: 'Ihr Depotwert ' + def.name + ' notiert bei ' + (m.price >= 1 ? m.price.toFixed(2).replace('.', ',') : m.price.toFixed(4).replace('.', ',')) + ' € – höher als je zuvor in den letzten zwei Jahren. Ihr Bestand ist jetzt ' + R.fmtMoney(uc.portfolio[sym].qty * m.price) + ' wert.' });
      }
    });
    var pv = E.portfolioValue(st, uc);
    if (pv >= 5000 && pv > (uc.pfAth || 0) * 1.03) {
      if (uc.pfAth && (!uc.pfAthTick || (st.tick || 0) - uc.pfAthTick >= 4)) alerts.push({ k: 'pfrec', ic: '💼', t: 'Depot auf Rekordstand!', x: 'Ihr Wertpapierdepot ist jetzt ' + R.fmtMoney(pv) + ' wert – so viel wie nie zuvor.' });
      uc.pfAth = pv; uc.pfAthTick = st.tick || 0;
    }
  };
  E.buyAsset = function (st, club, sym, qty) {
    E.ensureMarkets(st);
    qty = Math.floor(qty); var price = E.price(st, sym), def = E.marketDef(sym);
    if (qty <= 0 || !price) return { ok: false, why: 'Ungültige Menge' };
    if (def && def.club) {
      var bv = E.bvbClub(st); if (!bv) return { ok: false, why: 'Diese Aktie wird in dieser Spielwelt nicht gehandelt' };
      if (bv.id === club.id) return { ok: false, why: 'Eigene Vereinsaktien können Sie nicht kaufen' };
      var have = club.portfolio[sym] ? club.portfolio[sym].qty : 0;
      qty = Math.min(qty, def.shares - have);
      if (qty <= 0) return { ok: false, why: 'Alle Aktien gehören bereits Ihnen' };
    }
    // Große Käufe der Vereinsaktie treiben den Kurs; gehandelt wird zum Mittel aus altem und neuem Kurs
    var impact = def && def.club ? Math.min(0.5, qty / def.shares * 0.9) : 0;
    var cost = qty * price * (1 + impact / 2) * 1.005;
    if (cost > club.cash) return { ok: false, why: 'Nicht genug Geld' };
    var pf = club.portfolio[sym] || { qty: 0, cost: 0 };
    pf.qty += qty; pf.cost += cost; club.portfolio[sym] = pf; club.cash -= cost;
    E.book(club, 'Kapitalanlagen', -cost);
    if (impact) st.market.stocks[sym].price *= 1 + impact;
    return { ok: true, cost: cost, takeover: def && def.club ? E.bvbStake(st, club) > 0.5 : false };
  };
  E.bvbStake = function (st, club) { var d = E.marketDef('BVB'), pf = club.portfolio.BVB; return pf && d ? pf.qty / d.shares : 0; };
  // Übernahme: alle Spieler, das Vermögen und die Vereinsanlagen-Werte gehen an den Käufer, der Verein steigt zwangsweise ab
  E.takeoverBVB = function (st, club) {
    var bv = E.bvbClub(st); if (!bv || bv.id === club.id || bv.takenOverBy) return { ok: false, why: 'Übernahme nicht möglich' };
    if (E.bvbStake(st, club) <= 0.5) return { ok: false, why: 'Keine Mehrheit' };
    var moved = 0;
    Object.keys(st.players).forEach(function (id) {
      var p = st.players[id]; if (p.clubId !== bv.id) return;
      if (bv.lineup) bv.lineup = bv.lineup.map(function (x) { return x === p.id ? null : x; });
      p.clubId = club.id; p.listed = false; p.joined = st.season; moved++;
      st.transfers.unshift({ season: st.season, week: st.week, pid: p.id, name: W.playerName(p), from: bv.name, fromId: bv.id, to: club.name, toId: club.id, fee: 0, loan: false });
    });
    bv.lineup = []; bv.bench = []; bv.manualLineup = false;
    var cash = Math.max(0, Math.round(bv.cash + bv.savings));
    club.cash += cash; E.book(club, 'Übernahme ' + bv.short, cash); bv.cash = 0; bv.savings = 0;
    // Aktien bleiben als Beteiligung bestehen, der Kurs bricht ein
    var m = st.market.stocks.BVB; m.price *= 0.35; E.marketPush(m, 'Übernahme', st, 'BVB');
    bv.takenOverBy = club.id; bv.forcedRelegation = true; bv.reputation = Math.max(10, bv.reputation - 25);
    bv.history.push({ season: st.season, type: 'abstieg', text: 'Übernahme durch ' + club.name + ' – Zwangsabstieg zum Saisonende' });
    // Damit der Spielbetrieb weiterläuft: Notkader aus Amateuren
    var mean = R.season.leagueMean(st, Math.min(3, bv.league + 1)) - 10;
    [['TW', 2], ['AUS', 6], ['RUE', 6], ['KRS', 4]].forEach(function (pp) { for (var i = 0; i < pp[1]; i++) { var np = W.genPlayer(st, pp[0], R.clamp(R.gauss(mean, 3), 30, 80), R.randInt(19, 30), bv.id); np.contract = 1; } });
    R.match.autoBest(st, bv);
    R.season.news(st, 'SENSATION: ' + club.name + ' übernimmt ' + bv.name + '!', moved + ' Spieler und ' + R.fmtMoney(cash) + ' wechseln den Besitzer. ' + bv.short + ' muss zum Saisonende zwangsweise absteigen.', 'transfer');
    return { ok: true, players: moved, cash: cash, club: bv };
  };
  E.sellAsset = function (st, club, sym, qty) {
    var pf = club.portfolio[sym]; qty = Math.floor(Math.min(qty, pf ? pf.qty : 0));
    if (qty <= 0) return { ok: false, why: 'Keine Anteile' };
    var sd = E.marketDef(sym), impact = sd && sd.club ? Math.min(0.5, qty / sd.shares * 0.9) : 0;
    var price = E.price(st, sym), revenue = qty * price * (1 - impact / 2) * 0.995;
    if (impact) st.market.stocks[sym].price *= 1 - impact;
    var costPart = pf.cost * qty / pf.qty;
    pf.qty -= qty; pf.cost -= costPart; club.cash += revenue;
    if (pf.qty <= 0) delete club.portfolio[sym];
    E.book(club, 'Kapitalanlagen', revenue);
    club.tradeProfit = (club.tradeProfit || 0) + (revenue - costPart);
    return { ok: true, revenue: revenue, profit: revenue - costPart };
  };
  E.portfolioValue = function (st, club, kind) {
    var v = 0;
    Object.keys(club.portfolio).forEach(function (sym) {
      var isCrypto = !!st.market.crypto[sym];
      if (kind === 'stocks' && isCrypto) return; if (kind === 'crypto' && !isCrypto) return;
      v += club.portfolio[sym].qty * E.price(st, sym);
    });
    return v;
  };

  // Geheimer Cheat: das Schild „BANKDIREKTOR“
  // Jeder Klick bringt einen Zufallsbetrag. Ob ein Spruch erscheint, entscheidet die Oberfläche (nur beim ersten Klick je Sitzung).
  E.CHEAT_AMOUNT = 50000;
  // Zufallsbetrag je Klick (Wahrscheinlichkeit in %): halbe ANPFIFF!-Werte – am häufigsten 50.000 €, höchstens 2,5 Mio. €
  E.CHEAT_TABLE = [[50000, 35], [100000, 15], [125000, 12], [250000, 10], [375000, 8], [500000, 7], [750000, 6], [1000000, 5], [2500000, 2]];
  E.cheatAmount = function (rnd) {
    var x = (rnd == null ? Math.random() : rnd) * 100, acc = 0;
    for (var i = 0; i < E.CHEAT_TABLE.length; i++) { acc += E.CHEAT_TABLE[i][1]; if (x < acc) return E.CHEAT_TABLE[i][0]; }
    return E.CHEAT_TABLE[0][0];
  };
  E.bankCheat = function (st, club, rnd) {
    if (!st.settings.cheatEnabled || !club) return null;
    var firstEver = !st.cheatUsed, amt = E.cheatAmount(rnd); // eigener Zufall (Math.random), der Spielzufall bleibt unberührt
    st.cheatClicks = (st.cheatClicks || 0) + 1;
    club.cash += amt; E.book(club, 'Sonstiges', amt);
    st.cheatUsed = true; st.cheatTotal = (st.cheatTotal || 0) + amt;
    R.season.achieve(st, 'bankdirector');
    return {
      paid: amt, first: firstEver, jackpot: amt >= 2500000,
      lines: firstEver ? ['Sie haben versehentlich den geheimen Buchhaltungskeller geöffnet.', 'Herr Buchungsfehler hat eine Überweisung gefunden, die offenbar seit 1991 auf Bearbeitung wartet.']
        : [R.pick(D.cheatMessages)]
    };
  };

  // Wöchentliche Finanzen (laufende Einnahmen/Ausgaben, ohne Spieltagseinnahmen)
  E.weeklyFinance = function (st, club) {
    var r = E.weeklyLines(st, club), total = 0;
    // Tagesgeldzinsen laufen wöchentlich auf und werden monatlich (alle 4 Spielwochen) dem Girokonto gutgeschrieben
    var zins = r['Zinserträge'] || 0; delete r['Zinserträge'];
    Object.keys(r).forEach(function (k) { total += r[k]; E.book(club, k, r[k]); });
    club.cash += total;
    club.interestAccrued = (club.interestAccrued || 0) + zins;
    var paid = E.interestPayday(st) ? E.payInterest(st, club) : 0;
    if (zins) r['Zinserträge'] = zins;
    return { lines: r, total: total + paid, interestPaid: paid };
  };
  E.INTEREST_MONTH = 4; // Spielwochen je Zinsmonat
  E.interestPayday = function (st) { return st.phase === 'season' && (st.week % E.INTEREST_MONTH === 0 || st.week >= R.season.SEASON_WEEKS); };
  E.nextInterestWeek = function (st) { var w = st.phase === 'season' ? st.week : 0, n = (Math.floor(w / E.INTEREST_MONTH) + 1) * E.INTEREST_MONTH; return Math.min(n, R.season.SEASON_WEEKS); };
  E.payInterest = function (st, club) {
    var amt = Math.round(club.interestAccrued || 0); club.interestAccrued = 0;
    if (!amt) return 0;
    club.cash += amt; E.book(club, 'Zinserträge', amt);
    club.interestLog = (club.interestLog || []).concat([{ s: st.season, w: st.week, a: amt }]).slice(-12);
    return amt;
  };
  // Laufende Wochenposten (ohne Buchung) – Grundlage für Buchung und Prognose
  E.weeklyLines = function (st, club) {
    var n = E.WEEKS, diff = W.diffSettings[st.settings.difficulty];
    var costF = club.userControlled ? (0.9 + 0.1 * diff.econ) : 1;
    var lines = {};
    function add(cat, v) { lines[cat] = (lines[cat] || 0) + v; }
    add('TV-Gelder', D.leagueTV[club.league] / n);
    add('Sponsoren', E.sponsorTotal(club) / n);
    var city = 0;
    ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe'].forEach(function (k) { city += E.buildingRevenue(st, club, k); });
    add('Vereinsstadt', city / n);
    var wages = 0, youthW = 0;
    for (var id in st.players) { var p = st.players[id]; if (p.clubId === club.id) { if (p.youth) youthW += p.wage; else wages += p.wage; } }
    add('Spielergehälter', -wages / n);
    add('Nachwuchsgehälter', -youthW / n);
    add('Trainer & Personal', -((club.coach ? club.coach.wage : 0) + E.staffWages(club) + { 1: 1500000, 2: 500000, 3: 150000 }[club.league] * D.MONEY) / n);
    add('Unterhalt Anlagen', -E.upkeepTotal(club) * costF / n);
    var budgets = 0; Object.keys(D.budgetAreas).forEach(function (a) { budgets += E.budgetCost(club, a); });
    add('Verwaltung & Budgets', -budgets * costF / n);
    var debt = E.debt(club);
    if (debt > 0) add('Kreditzinsen', -R.sum(club.loans, function (l) { return l.amount * l.rate; }) / n);
    if (club.cash < 0) add('Dispozinsen', club.cash * 0.12 / n);
    if (club.savings > 0) add('Zinserträge', club.savings * st.savingsRate / n);
    Object.keys(lines).forEach(function (k) { lines[k] = Math.round(lines[k]); });
    return lines;
  };

  // Bilanzprognose bis Saisonende: laufende Posten × Restwochen, Heimspiel-Einnahmen der restlichen
  // Ligaspiele (aktuelle Preise, Nachfrage und Gegner), Liga-Prämie und Sponsorenboni nach aktuellem Tabellenplatz.
  // Nicht enthalten: Pokal, Transfers, neue Bauprojekte, Kursänderungen.
  E.forecast = function (st, club) {
    var S = R.season, total = S.SEASON_WEEKS;
    var from = st.phase === 'preseason' ? 0 : st.phase === 'season' ? st.week : total;
    var weekly = E.weeklyLines(st, club), wk = 0;
    Object.keys(weekly).forEach(function (k) { wk += weekly[k]; });
    var lines = {}, path = [club.cash], cash = club.cash, homeGames = 0;
    function add(k, v) { lines[k] = (lines[k] || 0) + v; }
    var acc = Math.round(club.interestAccrued || 0); // bereits aufgelaufene, noch nicht gutgeschriebene Zinsen
    if (acc && from < total) { add('Zinserträge', acc); cash += acc; }
    for (var w = from + 1; w <= total; w++) {
      Object.keys(weekly).forEach(function (k) { add(k, weekly[k]); });
      var wkCash = wk;
      if (st.leagues[W.lk(club)]) S.roundsOf(st, W.lk(club), w).forEach(function (r) {
        (st.leagues[W.lk(club)].fixtures[r] || []).forEach(function (f) {
          if (f.h !== club.id) return;
          var a = E.attendance(st, club, st.clubs[f.a], 'league'), t = Math.round(a.ticket), g = Math.round(a.cater), pk = Math.round(a.parking);
          add('Eintrittsgelder', t); add('Hallengastronomie', g); add('Parkgebühren', pk);
          wkCash += t + g + pk; homeGames++;
        });
      });
      cash += wkCash; path.push(cash);
    }
    // Saisonende
    var pos = E.leaguePos(st, club), lg = st.leagues[W.lk(club)], n = lg ? lg.clubIds.length : 18, end = 0;
    var pr = S.LEAGUE_PRIZE[club.league];
    if (pr && from < total + 1) {
      var prize = Math.round(pr[0] - (pr[0] - pr[1]) * (pos - 1) / Math.max(1, n - 1)); add('Prämien', prize); end += prize;
      club.sponsors.forEach(function (s) {
        var b = 0; if (pos <= s.topN) b += s.bonusTop || 0; if (pos === 1 && club.league === 1) b += s.bonusTitle || 0; if (club.league > 1 && pos <= (club.league === 3 ? 1 : 2)) b += s.bonusPromo || 0;
        if (b) { add('Sponsorenboni', b); end += b; }
      });
    }
    if (end) { cash += end; path.push(cash); }
    var inc = 0, exp = 0;
    Object.keys(lines).forEach(function (k) { if (lines[k] > 0) inc += lines[k]; else exp += lines[k]; });
    return { weeksLeft: Math.max(0, total - from), from: from, homeGames: homeGames, lines: lines, income: inc, expense: exp, endCash: cash, path: path, pos: pos, seasonEnd: end };
  };

  E.matchdayIncome = function (st, club, att) {
    var inc = Math.round(att.ticket), cat = Math.round(att.cater), park = Math.round(att.parking);
    club.cash += inc + cat + park;
    E.book(club, 'Eintrittsgelder', inc); E.book(club, 'Hallengastronomie', cat); E.book(club, 'Parkgebühren', park);
    return inc + cat + park;
  };

  E.fanGrowthWeekly = function (st, club, result, att) {
    var g = result > 0 ? 0.0018 : result < 0 ? -0.0012 : 0.0002;
    g += [-0.0004, 0, 0.0006][club.budgets.marketing] + [-0.0004, 0, 0.0005][club.budgets.fans];
    if (att && att.congestion > 0.1) g -= att.congestion * 0.004;
    if (att && att.total >= att.capacity * 0.98) g += 0.0004; // ausverkauft: Hype
    g += [0.0003, 0, -0.0003][club.cityPrice == null ? 1 : club.cityPrice];
    g += ((club.fanTrust != null ? club.fanTrust : 60) - 60) * 0.00002;
    club.fans = R.clamp(Math.round(club.fans * (1 + g)), 300, 40000);
  };

  // Sponsorenangebote für offene Kategorien
  E.sponsorOffers = function (st, club, cat) {
    var adminF = [0.95, 1, 1.06][club.budgets.admin] * [0.97, 1, 1.05][club.budgets.marketing];
    var out = [];
    for (var i = 0; i < 3; i++) { var s = W.genSponsor(st, club, cat); s.amount = R.round(s.amount * adminF * R.randRange(0.85, 1.15), 1000); out.push(s); }
    return out;
  };
})(RFM);
