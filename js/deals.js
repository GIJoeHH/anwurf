// ANWURF! – Großereignisse & moralische Zwickmühlen
// Seltene Großangebote mit Fanvertrauen, öffentlicher Wahrnehmung, Verhandlung, Zusagen und Abrechnung.
(function (R) {
  var D = R.data, W = R.world, E = R.econ;
  var X = R.deals = {};

  // ---------- Fanmaßnahmen ----------
  X.measures = {
    freikarten: { n: 'Kostenlose Eintrittskarten', pct: 0.05, fan: 4, pub: 1, d: '2.000 Freikarten für das nächste Heimspiel' },
    dauerkarte: { n: 'Vergünstigte Dauerkarten', pct: 0.06, fan: 5, pub: 0, d: 'Ticketpreise −10 % für die nächsten 8 Heimspiele' },
    trikot: { n: 'Kostenloses Trikot für Mitglieder', pct: 0.05, fan: 4, pub: 1, d: 'Mehr Trikots in der Halle, Fanshop-Effekt später positiv' },
    wlan: { n: 'Kostenloses Hallen-WLAN', pct: 0.03, fan: 2, pub: 1, d: 'Hallenattraktivität dauerhaft +1' },
    jugend: { n: 'Investition in die Jugendabteilung', pct: 0.08, fan: 3, pub: 3, d: 'Ein zusätzliches Talent im nächsten Jahrgang' },
    fankurve: { n: 'Modernisierung der Fankurve', pct: 0.10, fan: 6, pub: 1, d: 'Hallenattraktivität dauerhaft +3' },
    fanfest: { n: 'Kostenloses Fan-Fest', pct: 0.03, fan: 3, pub: 1, d: 'Großes Fest vor der Halle' },
    shoprabatt: { n: 'Preisnachlässe im Fanshop', pct: 0.03, fan: 2, pub: 0, d: '−15 % im Fanshop für 6 Wochen' },
    familie: { n: 'Zusätzliche Familienangebote', pct: 0.04, fan: 3, pub: 2, d: 'Familienblock, Kinderbetreuung, günstige Familientickets' }
  };
  // ---------- Überprüfbare Zusagen bei Kommunikation ----------
  X.promises = {
    keine: { n: 'Keine konkrete Zusage', cred: 0 },
    jugend: { n: 'Die Einnahmen finanzieren den Ausbau des Nachwuchszentrums', cred: 0.12, keys: ['jugend'] },
    stadion: { n: 'Die Einnahmen fließen in den Hallenausbau', cred: 0.1, keys: ['steh', 'sitz', 'dach', 'sanitaer', 'hosp'] },
    schulden: { n: 'Die Einnahmen werden zum Schuldenabbau verwendet', cred: 0.1, debt: true }
  };
  X.demands = {
    mehr: 'Höhere Zahlung (+15 %)', kuerzer: 'Kürzere Veranstaltung (−2 Tage, −12 % Erlös)', kurve: 'Fankurve bleibt ausgenommen (−5 % Erlös)',
    rasen: 'Veranstalter garantiert Wiederherstellung des Hallenbodens', fanfinanz: 'Veranstalter finanziert Fanvorteile', sponsor: 'Zusätzliche Sponsorenleistungen'
  };

  // ---------- Die zehn Ereignistypen ----------
  // range: Basiserlös [min,max]; pct: Anteil am Jahresbudget (Obergrenze); days: Hallentage; pitch: Bodenschaden
  // fanA/pubA: Reaktion bei sofortiger Annahme; fanR/pubR: bei Ablehnung; city-Faktoren für Hotel/Gastro/Shop/Museum/Parken
  X.types = [
    { id: 'kongress', w: 1, title: 'DER GROSSE KONGRESS!', name: 'Internationaler Religionskongress', minCap: 3000, minRep: 25, days: 4, pitch: 6, range: [120000, 600000], pctMode: true, pct: 0.35,
      fanA: -12, pubA: -5, fanR: 2, pubR: 0, cost: 0.03, comm: 0.03, visitors: 0.95, hotel: 1.6, food: 1.0, shop: 0.1, museum: 0.4, park: 1.2,
      offer: 'Der Veranstalter eines internationalen Jahreskongresses einer großen Glaubensgemeinschaft (z. B. Jahreskongress der Zeugen Jehovas) möchte Ihre Halle für einen mehrtägigen Kongress mieten.',
      terms: 'Exklusive Nutzung der Halle und der Parkflächen für {D} Tage, keine Bandenwerbung und kein Alkoholausschank während des Kongresses, Reinigung durch den Veranstalter.',
      chances: 'Sehr hoher Mieterlös, volle Hotels, Gastronomie an mehreren Tagen.',
      conflicts: 'Die Halle ist mehrere Tage gesperrt, das Verkehrsaufkommen ist hoch, und andere Veranstaltungen sowie Werbepartner werden eingeschränkt.',
      fans: 'Fanvertreter äußern Bedenken wegen der Sperrung des Geländes, des Verkehrs und der kommerziellen Nutzung „ihrer“ Halle.',
      pub: 'Die Lokalpolitik lobt die Einnahmen für die Region, Anwohner fürchten Staus.',
      risks: 'Verkehrsprobleme bei schlechter Anbindung, Bodenverschleiß.', fit: ['freikarten', 'fanfest', 'familie'],
      head: 'DREI MILLIONEN FÜR EIN WOCHENENDE – DER RASEN HAT NOCH NICHT ZUGESTIMMT.', endTitle: 'DER MILLIONEN-KONGRESS IST BEENDET' },
    { id: 'film', w: 1, title: 'HOLLYWOOD RUFT AN!', name: 'Hollywood-Blockbuster als Filmkulisse', minCap: 1600, minRep: 20, days: 3, pitch: 4, range: [80000, 500000], pct: 0.5,
      fanA: 2, pubA: 6, fanR: -1, pubR: -1, cost: 0.03, comm: 0.02, visitors: 0.1, hotel: 1.2, food: 0.6, shop: 0.8, museum: 1.2, park: 0.2,
      offer: 'Ein Hollywood-Studio möchte Ihre Halle als Kulisse für das Finale eines Sportblockbusters nutzen – inklusive Massenszene mit Statisten.',
      terms: '{D} Drehtage, Umbauten an der Haupttribüne, Geheimhaltung, Nennung des Vereins im Abspann.',
      chances: 'Weltweite Aufmerksamkeit, Fanshop-Sonderedition, Museum bekommt Requisiten.',
      conflicts: 'Absperrungen auf dem Gelände, Kunstschnee auf dem Hallenboden, Paparazzi vor dem Trainingsplatz.',
      fans: 'Die meisten Fans sind begeistert – einige fürchten um die Ruhe vor Heimspielen.',
      pub: 'Medien berichten bundesweit positiv.', risks: 'Bodenschäden durch Kunstschnee und Kameras.', fit: ['fanfest', 'freikarten', 'trikot'],
      head: 'HOLLYWOOD KOMMT! TRAINER FRAGT, OB DER NEUE STÜRMER MITGEBRACHT WIRD.', endTitle: 'DIE DREHARBEITEN SIND ABGESCHLOSSEN' },
    { id: 'konzert', w: 1, title: 'MEGASTAR WILL IHRE HALLE!', name: 'Hallenkonzerte eines internationalen Superstars', minCap: 5000, minRep: 35, req: { oepnv: 3 }, days: 3, pitch: 12, range: [200000, 800000], pct: 0.5,
      fanA: -4, pubA: 4, fanR: 0, pubR: -1, cost: 0.07, comm: 0.03, visitors: 1.0, hotel: 2.0, food: 1.6, shop: 0.5, museum: 0.3, park: 1.5,
      offer: 'Ein internationaler Superstar plant mehrere ausverkaufte Hallenkonzerte und möchte dafür Ihre Arena mieten.',
      terms: '{D} Tage inklusive Bühnenauf- und -abbau, Bühne auf dem Hallenboden, Feuerwerk, Zusatzflächen für Catering.',
      chances: 'Riesiger Mieterlös, volle Hotels und Restaurants, Parkhäuser ausgelastet.',
      conflicts: 'Bühne und Zuschauer auf dem Hallenboden, Lärm und Verkehr für Anwohner.',
      fans: 'Gemischte Gefühle: Musikfans jubeln, der Fanblock sorgt sich um den Hallenboden.',
      pub: 'Die Stadt freut sich über Touristen, Anwohner beschweren sich über Lärm.', risks: 'Starker Bodenschaden, Verkehrsprobleme ohne gute ÖPNV-Anbindung.', fit: ['fankurve', 'freikarten', 'shoprabatt'],
      head: 'MEGASTAR IM HALLE – MEHR PYROTECHNIK ALS BEIM LETZTEN DERBY.', endTitle: 'DIE KONZERTE SIND VORBEI' },
    { id: 'esports', w: 1, title: 'E-SPORTS-WM IN DER HALLE!', name: 'Internationale E-Sports-Meisterschaft', minCap: 3000, minRep: 25, req: { technik: 1 }, days: 3, pitch: 2, range: [100000, 400000], pct: 0.45,
      fanA: -3, pubA: 3, fanR: 1, pubR: 0, cost: 0.05, comm: 0.03, visitors: 0.6, hotel: 1.3, food: 1.0, shop: 0.4, museum: 0.2, park: 0.8,
      offer: 'Ein E-Sports-Veranstalter möchte das Finale einer internationalen Meisterschaft in Ihrer Halle austragen.',
      terms: '{D} Tage, Bühne mit Bodenabdeckung, Glasfaserausbau auf Kosten des Veranstalters.',
      chances: 'Junges Publikum, internationale Streams, moderne Außendarstellung.',
      conflicts: 'Traditionsfans sehen den Handballtempel zweckentfremdet.',
      fans: 'Ältere Fans schütteln den Kopf, die Jugend feiert.', pub: 'Tech- und Lifestylemedien berichten positiv.', risks: 'Geringer Bodenschaden.', fit: ['wlan', 'jugend', 'familie'],
      head: 'DIE ZUKUNFT DES SPORTS? TORWART ÜBT SCHON MAL DIE CONTROLLER-PARADE.', endTitle: 'DIE E-SPORTS-WM IST ENTSCHIEDEN' },
    { id: 'tech', w: 1, title: 'WELTPREMIERE IN DER HALLE!', name: 'Globale Produktpremiere eines Technologiekonzerns', minCap: 4000, minRep: 40, req: { technik: 2 }, days: 2, pitch: 3, range: [200000, 600000], pct: 0.45,
      fanA: -2, pubA: 5, fanR: 0, pubR: -1, cost: 0.05, comm: 0.02, visitors: 0.5, hotel: 1.5, food: 0.9, shop: 0.2, museum: 0.3, park: 0.8,
      offer: 'Ein Technologiekonzern will sein neuestes Produkt mit einer globalen Live-Show in Ihrer Halle präsentieren.',
      terms: '{D} Tage, Lichtshow, Projektionen auf die Tribünen, strenge Geheimhaltung.',
      chances: 'Weltweite Live-Übertragung, Imagegewinn, Kontakte zu Geschäftspartnern.',
      conflicts: 'Kommerzialisierung der Halle, Sperrzonen.', fans: 'Die Fans sind eher gleichgültig – solange das Wappen nicht verschwindet.',
      pub: 'Wirtschaftsmedien loben den modernen Verein.', risks: 'Kaum Risiken, kleine Bodenschäden.', fit: ['wlan', 'familie', 'freikarten'],
      head: 'TECH-GIGANT IM HALLE – DAS FLUTLICHT HAT JETZT EIN UPDATE.', endTitle: 'DIE PRODUKTPREMIERE IST VORBEI' },
    { id: 'auto', w: 1, title: 'PS-SHOW AUF DEM HALLENBODEN!', name: 'Präsentation einer neuen Fahrzeugreihe', minCap: 2000, minRep: 25, req: { parken: 3 }, days: 2, pitch: 8, range: [150000, 500000], pct: 0.45,
      fanA: -3, pubA: 3, fanR: 1, pubR: 0, cost: 0.04, comm: 0.03, visitors: 0.35, hotel: 1.0, food: 0.8, shop: 0.2, museum: 0.2, park: 2.0,
      offer: 'Ein Automobilhersteller möchte seine neue Fahrzeugreihe mit einer Show in der Halle präsentieren – Testfahrten auf dem Parkplatz inklusive.',
      terms: '{D} Tage, Fahrzeuge auf dem Hallenboden, Nutzung aller Parkflächen.',
      chances: 'Hoher Erlös, Parkeinnahmen, möglicher Folgesponsor.', conflicts: 'Fahrzeuge auf dem heiligen Hallenboden.',
      fans: 'Der Fanblock fragt, ob der Hallenboden jetzt Reifenspuren bekommt.', pub: 'Positive Wirtschaftspresse.', risks: 'Deutlicher Bodenschaden.', fit: ['fankurve', 'fanfest', 'familie'],
      head: 'PS-PREMIERE AUF DEM RASEN – PLATZWART SUCHT NOCH SEINE NERVEN.', endTitle: 'DIE FAHRZEUGPREMIERE IST BEENDET' },
    { id: 'doku', w: 1, title: 'STREAMING-DOKU ÜBER IHREN VEREIN!', name: 'Exklusive Vereinsdokumentation', minCap: 0, minRep: 45, days: 0, pitch: 0, range: [200000, 600000], pct: 0.4,
      fanA: 3, pubA: 7, fanR: -1, pubR: -2, cost: 0.02, comm: 0.02, visitors: 0, hotel: 0, food: 0, shop: 1.5, museum: 1.0, park: 0,
      offer: 'Eine große Streamingplattform möchte eine exklusive Dokuserie über eine Saison Ihres Vereins produzieren – mit Kameras in Kabine und Geschäftsstelle.',
      terms: 'Drehgenehmigung für die laufende Saison, Zugang zur Kabine, Vorabprüfung durch den Verein.',
      chances: 'Internationale Bekanntheit, neue Fans, Fanshop-Boom.', conflicts: 'Kameras in der Kabine stören die Mannschaft.',
      fans: 'Die Fans sind neugierig und stolz.', pub: 'Sehr positive Medienresonanz.', risks: 'Kurzfristig sinkende Moral der Mannschaft.', fit: ['trikot', 'fanfest', 'jugend'],
      head: 'KAMERAS IN DER KABINE – KAPITÄN VERLANGT VORHER EINEN FRISEUR.', endTitle: 'DIE DOKU-DREHARBEITEN SIND ABGESCHLOSSEN' },
    { id: 'influencer', w: 1, title: 'INFLUENCER-TURNIER IN DER HALLE!', name: 'Großes Influencer-Handballturnier', minCap: 1000, minRep: 15, days: 1, pitch: 5, range: [150000, 400000], pct: 0.45,
      fanA: -6, pubA: 2, fanR: 2, pubR: 0, cost: 0.04, comm: 0.03, visitors: 0.8, hotel: 0.6, food: 1.2, shop: 1.2, museum: 0.3, park: 1.0,
      offer: 'Bekannte Influencer wollen in Ihrer Halle ein großes Handballturnier mit Livestream veranstalten.',
      terms: '{D} Tag, Nutzung der Kabinen, Einblendung der Vereinslogos im Stream.',
      chances: 'Millionen Zuschauer im Stream, junge Zielgruppe, Fanshop-Verkäufe.', conflicts: 'Traditionsfans sehen den Verein als Kulisse für Selbstdarstellung.',
      fans: 'Der Fanblock kündigt einen kreativen Protest an.', pub: 'Gemischte Medienreaktionen.', risks: 'Shitstorm bei schlechter Kommunikation.', fit: ['freikarten', 'shoprabatt', 'jugend'],
      head: 'INFLUENCER-CUP IM HALLE – FANKURVE FILMT ZURÜCK.', endTitle: 'DAS INFLUENCER-TURNIER IST VORBEI' },
    { id: 'naming', w: 0.7, title: 'KONZERN WILL IHREN HALLENNAMEN!', name: 'Verkauf des historischen Hallennamens', minCap: 0, minRep: 30, days: 0, pitch: 0, range: [80000, 1500000], pctMode: true, pct: 0.30,
      fanA: -15, pubA: 1, fanR: 4, pubR: 1, cost: 0.01, comm: 0.03, visitors: 0, hotel: 0, food: 0, shop: 0, museum: 0, park: 0,
      offer: 'Ein Konzern bietet eine Einmalzahlung, um Ihre Halle für drei Spielzeiten nach sich zu benennen.',
      terms: 'Umbenennung für 3 Saisons, neue Beschilderung, Logo auf allen Tickets.',
      chances: 'Sehr hohe Einmalzahlung ohne Hallensperrung.', conflicts: 'Der traditionsreiche Name verschwindet.',
      fans: 'Fans drohen, den neuen Namen niemals auszusprechen.', pub: 'Wirtschaftsmedien nennen den Deal clever, Traditionalisten sind empört.', risks: 'Starker Vertrauensverlust bei den Fans.', fit: ['fankurve', 'dauerkarte', 'familie'],
      head: 'HALLENAME VERKAUFT – FANS SUCHEN IHRE HEIMAT AUF GOOGLE MAPS.', endTitle: 'DER NAMENSDEAL IST UNTERSCHRIEBEN' },
    { id: 'festival', w: 1, title: 'FOOD- UND KULTURFESTIVAL!', name: 'Internationales Food- und Kulturfestival', minCap: 400, minRep: 10, req: { strasse: 2 }, days: 3, pitch: 7, range: [100000, 400000], pct: 0.45,
      fanA: 1, pubA: 4, fanR: 0, pubR: -1, cost: 0.05, comm: 0.02, visitors: 0.7, hotel: 1.0, food: 2.2, shop: 0.6, museum: 0.6, park: 1.2,
      offer: 'Ein Veranstalter möchte ein großes internationales Food- und Kulturfestival auf Ihrer Hallegelände ausrichten.',
      terms: '{D} Tage, Stände auf dem Vorplatz und Teilen des Hallenbodens, Bühne für Kulturprogramm.',
      chances: 'Viele Besucher, Gastronomie- und Hotelerlöse, positives Image.', conflicts: 'Gelände und Parkplätze belegt.',
      fans: 'Die Fans freuen sich auf gutes Essen – und hoffen auf Bratwurst.', pub: 'Sehr positive Resonanz in der Stadt.', risks: 'Bodenschäden durch Stände.', fit: ['fanfest', 'familie', 'freikarten'],
      head: 'BRATWURST TRIFFT BAO-BUN – DIE STEHKURVE WIRD ZUR SCHLEMMERMEILE.', endTitle: 'DAS FESTIVAL IST VORBEI' }
  ];
  X.type = function (id) { return X.types.filter(function (t) { return t.id === id; })[0]; };
  X.partners = ['NovaTech', 'Titan Motors', 'Sternwerk Energie', 'Vortex Media', 'Hanse Logistik', 'Gigant Versicherung', 'Prisma Telekom'];

  X.gw = function (st) { return st.season * 50 + st.week; };
  X.ensure = function (c) {
    if (c.fanTrust == null) c.fanTrust = 60;
    if (c.publicImage == null) c.publicImage = 50;
    if (c.pitch == null) c.pitch = 100;
    if (c.attBonus == null) c.attBonus = 0;
    c.dealHistory = c.dealHistory || []; c.commitments = c.commitments || []; c.dealLast = c.dealLast || {};
  };
  X.ensureAll = function (st) {
    Object.keys(st.clubs).forEach(function (k) { X.ensure(st.clubs[k]); });
    st.dealsScheduled = st.dealsScheduled || []; st.dealLog = st.dealLog || [];
    if (st.deal === undefined) st.deal = null;
  };
  X.budget = function (st, c) { return Math.max(100000, E.revenueEstimate(st, c)); };
  X.recentControversial = function (st, c) {
    var g = X.gw(st);
    return c.dealHistory.filter(function (h) { return g - h.gw < 100 && h.controversial; }).length;
  };
  X.credibility = function (st, c, promise) {
    var cr = 0.45 + c.publicImage / 200 + c.fanTrust / 400 - (c.brokenPromises || 0) * 0.15 - X.recentControversial(st, c) * 0.08;
    if (promise && X.promises[promise]) cr += X.promises[promise].cred;
    return R.clamp(cr, 0.1, 0.95);
  };
  function adj(st, c, v) { // negative Reaktionen werden durch geringes Vertrauen und wiederholte Deals verstärkt
    if (v >= 0) return v;
    return v * (1.3 - c.fanTrust / 200) * (1 + 0.25 * X.recentControversial(st, c));
  }
  X.change = function (c, fan, pub) {
    c.fanTrust = R.clamp(c.fanTrust + fan, 0, 100);
    c.publicImage = R.clamp(c.publicImage + pub, 0, 100);
  };

  X.eligible = function (st, c, t) {
    X.ensure(c);
    if (E.capacity(c) < t.minCap || c.reputation < t.minRep) return false;
    if (t.req) for (var k in t.req) if ((c.fac[k] || 0) < t.req[k]) return false;
    if (c.dealLast[t.id] != null && X.gw(st) - c.dealLast[t.id] < 150) return false; // ca. 3 Saisons Pause
    if (t.id === 'naming' && c.namingUntil && c.namingUntil > st.season) return false;
    return true;
  };

  // Termin finden: bevorzugt Wochen mit Auswärtsspiel; kurze Events (≤2 Tage) auch rund um ein Heimspiel
  X.findWeek = function (st, c, days, from) {
    from = from || st.week + 2;
    if (!days) return { week: st.week + 1, mode: 'none' };
    var block = null;
    for (var w = from; w <= Math.min(R.season.SEASON_WEEKS - 1, from + 5); w++) {
      var rounds = R.season.roundsOf(st, W.lk(c), w);
      var home = rounds.some(function (r) { return st.leagues[W.lk(c)].fixtures[r].some(function (f) { return f.h === c.id; }); });
      var cupIdx = R.season.CUP_WEEKS.indexOf(w), cupHome = false;
      if (cupIdx >= 0 && st.cup.rounds[cupIdx]) cupHome = st.cup.rounds[cupIdx].ties.some(function (t) { return t.h === c.id; });
      if (!home && !cupHome) return { week: w, mode: 'away' };
      if (!block && days <= 2 && !cupHome) block = { week: w, mode: 'block' };
    }
    return block;
  };

  X.generate = function (st, c, t) {
    var budget = X.budget(st, c), amount;
    var sizeF = R.clamp((budget - 300000) / 4500000, 0, 1);
    if (t.pctMode) {
      var share = 0.06 + (t.pct - 0.06) * Math.pow(R.rand(), 2.2); // hohe Prozentwerte sind selten
      amount = Math.min(budget * share, t.range[1] * (0.4 + 0.6 * sizeF + 0.15));
    } else {
      amount = (t.range[0] + (t.range[1] - t.range[0]) * (0.2 + 0.8 * sizeF) * R.randRange(0.65, 1.1));
      amount = Math.min(amount, budget * Math.min(t.pct, 0.3) * R.randRange(0.7, 1), t.range[1]);
    }
    amount = Math.max(R.round(amount, 5000), 10000);
    var slot = X.findWeek(st, c, t.days);
    return {
      id: W.nextId(st, 'deal'), type: t.id, club: c.id, amount: amount, base: amount, budget: budget, days: t.days,
      week: st.week, season: st.season, deadline: st.week + 2, eventWeek: slot ? slot.week : null, mode: slot ? slot.mode : null,
      conflict: !slot, negotiated: false, mods: {}, status: 'offer',
      partner: t.id === 'naming' ? R.pick(X.partners) : null
    };
  };

  // Vorschau: Zusatzkosten, Nettogewinn, Erwartungen
  X.preview = function (st, o) {
    var c = st.clubs[o.club], t = X.type(o.type);
    var visitors = Math.round(E.capacity(c) * t.visitors);
    var cost = o.amount * t.cost + (t.pitch && !o.mods.rasen ? t.pitch * Math.max(1, o.days) * 300 * (c.league === 1 ? 2 : 1) : 0);
    var traffic = visitors > E.transportCap(c) && t.visitors > 0.3;
    if (traffic) cost += o.amount * 0.02;
    var city = X.cityBonus(st, c, t, o);
    return { visitors: visitors, extraCost: Math.round(cost), cityTotal: Math.round(R.sum(city, function (x) { return x[1]; })), city: city, net: Math.round(o.amount - cost + R.sum(city, function (x) { return x[1]; })), traffic: traffic, pct: o.amount / o.budget };
  };
  X.cityBonus = function (st, c, t, o) {
    var days = Math.max(1, o.days), out = [];
    var f = c.fac;
    if (f.hotel && t.hotel) out.push(['Zusätzliche Hotelerlöse', Math.round(f.hotel * t.hotel * days * 2200)]);
    if (f.restaurant && t.food) out.push(['Zusätzliche Restauranterlöse', Math.round(f.restaurant * t.food * days * 900)]);
    if (f.cafe && t.food) out.push(['Zusätzliche Café-Erlöse', Math.round(f.cafe * t.food * days * 300)]);
    if (f.fanshop && t.shop) out.push(['Fanshop-Sonderaktion', Math.round(f.fanshop * t.shop * 1200 * (0.85 + c.fanTrust / 333))]);
    if (f.museum && t.museum) out.push(['Museumsbesuche & Führungen', Math.round(f.museum * t.museum * days * 400)]);
    var lvP = E.level(c, 'parken');
    if (t.park && lvP.fee) out.push(['Zusätzliche Parkeinnahmen', Math.round(Math.min(lvP.cars, E.capacity(c) * t.visitors / 2.6) * lvP.fee * days * Math.min(1, t.park))]);
    if (f.eventhalle && days >= 2) out.push(['Begleitprogramm in der Eventhalle', Math.round(f.eventhalle * 2500)]);
    return out;
  };

  // Reaktionen und Kosten je Entscheidung (ohne Zufall – Rückschlag wird bei Ausführung gewürfelt)
  X.evaluate = function (st, o, decision, opts) {
    opts = opts || {};
    var c = st.clubs[o.club], t = X.type(o.type), m = o.mods;
    var fanA = t.fanA * (m.kuerzer ? 0.7 : 1) * (m.kurve ? 0.7 : 1), pubA = t.pubA + (m.sponsor ? 2 : 0);
    var fanBase = adj(st, c, fanA), measures = (opts.measures || []).filter(function (k) { return X.measures[k]; });
    var mSum = 0, mPub = 0, mCost = 0;
    measures.forEach(function (k) { var ms = X.measures[k], fit = t.fit.indexOf(k) >= 0 ? 1.5 : 1; mSum += ms.fan * fit; mPub += ms.pub; mCost += ms.pct * o.amount; });
    mSum = Math.min(14, mSum * 0.7);
    if (m.fanfinanz) mSum += 3;
    var cred = X.credibility(st, c, opts.promise);
    var commCost = Math.round(o.amount * (t.comm || 0.03));
    var r = { fan: 0, pub: 0, cost: 0, commCost: 0, measureCost: 0, cred: cred };
    if (decision === 'A') { r.fan = fanBase; r.pub = pubA; }
    if (decision === 'B') { r.fan = fanBase < 0 ? fanBase * 0.45 : fanBase + 1; r.pub = pubA + 6 * cred - 1; r.commCost = commCost; }
    if (decision === 'C') { r.fan = (fanBase < 0 ? fanBase * 0.7 : fanBase) + mSum; r.pub = pubA * 0.8 + mPub; r.measureCost = mCost; }
    if (decision === 'D') { r.fan = (fanBase < 0 ? fanBase * 0.35 : fanBase) + mSum + 1; r.pub = pubA + 6 * cred + mPub + 1; r.commCost = commCost; r.measureCost = mCost; }
    if (decision === 'F') { r.fan = t.fanR; r.pub = t.pubR; }
    if (m.fanfinanz) r.measureCost = Math.max(0, r.measureCost - o.amount * 0.03);
    r.cost = Math.round(r.commCost + r.measureCost);
    r.fan = Math.round(r.fan * 10) / 10; r.pub = Math.round(r.pub * 10) / 10;
    return r;
  };

  // Entscheidung des Spielers: A sofort, B Kommunikation, C Fanvorteile, D Gesamtpaket, F ablehnen
  X.decide = function (st, decision, opts) {
    var o = st.deal; opts = opts || {};
    if (!o || o.status !== 'offer') return { ok: false, why: 'Kein offenes Angebot' };
    return X.apply(st, o, decision, opts, true);
  };
  X.apply = function (st, o, decision, opts, isUser) {
    var c = st.clubs[o.club], t = X.type(o.type);
    if (decision !== 'F' && o.conflict) return { ok: false, why: 'Terminkonflikt mit dem Spielplan – bitte eine kürzere Veranstaltung verhandeln oder ablehnen.' };
    if ((decision === 'C' || decision === 'D') && !(opts.measures && opts.measures.length)) return { ok: false, why: 'Bitte mindestens eine Fanmaßnahme auswählen.' };
    var r = X.evaluate(st, o, decision, opts), text = '';
    if ((decision === 'B' || decision === 'D') && R.rand() > r.cred * 1.1) {
      r.fan -= 3; r.pub -= 3; r.backfire = true;
      text = 'Die Kampagne wirkt unglaubwürdig – Fans und Medien reagieren zusätzlich verärgert.';
    }
    X.change(c, r.fan, r.pub);
    if (r.cost) { c.cash -= r.cost; E.book(c, 'Großereignis-Maßnahmen', -r.cost); }
    if (decision !== 'F') {
      (opts.measures || []).forEach(function (k) { X.applyMeasure(st, c, k); });
      if ((decision === 'B' || decision === 'D') && opts.promise && opts.promise !== 'keine') {
        var pr = X.promises[opts.promise];
        c.commitments.push({ id: W.nextId(st, 'promise'), type: opts.promise, text: pr.n, deadline: X.gw(st) + 20, startDebt: E.debt(c), amount: o.amount, levels: pr.keys ? pr.keys.map(function (k) { return c.fac[k] || 0; }) : null, status: 'open' });
      }
      c.dealHistory.push({ gw: X.gw(st), season: st.season, type: t.id, decision: decision, controversial: t.fanA < 0 && decision === 'A' });
      c.dealLast[t.id] = X.gw(st);
      o.status = 'scheduled'; o.decision = decision; o.reaction = r; o.opts = opts;
      st.dealsScheduled.push(o);
      if (o.eventWeek == null || o.eventWeek <= st.week || o.mode === 'none' || !isUser) X.execute(st, o);
    } else {
      o.status = 'rejected'; o.decision = 'F'; o.reaction = r;
      c.dealLast[t.id] = X.gw(st) - 75; // abgelehnt: kürzere Sperre
      st.dealLog.unshift({ season: st.season, week: st.week, club: c.id, type: t.id, amount: o.amount, decision: 'F', net: 0, fan: r.fan, pub: r.pub });
    }
    if (st.deal === o) st.deal = null;
    if (c.userControlled) R.season.news(st, decision === 'F' ? 'Angebot abgelehnt: ' + t.name : t.head, decision === 'F' ? c.name + ' verzichtet auf ' + R.fmtMoney(o.amount) + '.' : c.name + ' sagt zu: ' + R.fmtMoney(o.amount) + (o.eventWeek && o.mode !== 'none' ? ', Termin rund um den ' + o.eventWeek + '. Spieltag.' : '.') + (text ? ' ' + text : ''), 'deal');
    return { ok: true, reaction: r, text: text };
  };

  X.applyMeasure = function (st, c, k) {
    if (k === 'freikarten') c.freeTickets = (c.freeTickets || 0) + 400;
    if (k === 'dauerkarte') c.ticketPromo = 8;
    if (k === 'trikot') c.shirtBoost = 10;
    if (k === 'wlan') c.attBonus = Math.min(8, c.attBonus + 1);
    if (k === 'jugend') c.youthBoost = (c.youthBoost || 0) + 1;
    if (k === 'fankurve') c.attBonus = Math.min(8, c.attBonus + 3);
    if (k === 'shoprabatt') c.shopPromo = 6;
  };

  // Nachverhandeln: Erfolg hängt von Anzahl/Härte der Forderungen und der Wahrnehmung ab
  X.negotiate = function (st, demands) {
    var o = st.deal; if (!o || o.status !== 'offer' || o.negotiated) return { ok: false, why: 'Nicht möglich' };
    var c = st.clubs[o.club], t = X.type(o.type);
    demands = (demands || []).filter(function (d) { return X.demands[d]; });
    if (!demands.length) return { ok: false, why: 'Bitte mindestens eine Forderung wählen.' };
    var p = R.clamp(0.85 - 0.1 * demands.length - (demands.indexOf('mehr') >= 0 ? 0.15 : 0) + (c.publicImage - 50) / 300, 0.1, 0.95);
    o.negotiated = true;
    if (R.rand() < p) {
      demands.forEach(function (d) {
        o.mods[d] = true;
        if (d === 'mehr') o.amount = R.round(o.amount * 1.15, 5000);
        if (d === 'kuerzer' && o.days > 0) { o.days = Math.max(1, o.days - 2); o.amount = R.round(o.amount * 0.88, 5000); }
        if (d === 'kurve') o.amount = R.round(o.amount * 0.95, 5000);
      });
      if (o.conflict || o.mods.kuerzer) { var slot = X.findWeek(st, c, o.days); if (slot) { o.eventWeek = slot.week; o.mode = slot.mode; o.conflict = false; } }
      o.deadline = Math.max(o.deadline, st.week + 1);
      return { ok: true, success: true, text: 'Der Veranstalter akzeptiert Ihre Forderungen.' };
    }
    if (R.chance(0.5)) {
      o.status = 'withdrawn'; st.deal = null;
      st.dealLog.unshift({ season: st.season, week: st.week, club: c.id, type: t.id, amount: o.amount, decision: 'zurückgezogen', net: 0, fan: 0, pub: 0 });
      R.season.news(st, 'Verhandlungen geplatzt: ' + t.name, 'Der Veranstalter hat sein Angebot zurückgezogen.', 'deal');
      return { ok: true, success: false, withdrawn: true, text: 'Der Veranstalter ist verärgert und zieht das Angebot zurück!' };
    }
    return { ok: true, success: false, text: 'Der Veranstalter lehnt Änderungen ab – das ursprüngliche Angebot steht noch.' };
  };

  // Durchführung und vollständige Abrechnung
  X.execute = function (st, o) {
    var c = st.clubs[o.club], t = X.type(o.type), pv = X.preview(st, o), r = o.reaction || { fan: 0, pub: 0, commCost: 0, measureCost: 0 };
    var lines = [['Veranstaltungserlös', o.amount]];
    if (r.commCost) lines.push(['Kommunikationskosten', -r.commCost]);
    if (r.measureCost) lines.push(['Fanmaßnahmen', -Math.round(r.measureCost)]);
    pv.city.forEach(function (x) { lines.push(x); });
    lines.push(['Zusätzliche Betriebskosten', -pv.extraCost]);
    var extraFan = 0, extraPub = 0, notes = [];
    if (pv.traffic) { extraFan -= 2; extraPub -= 2; notes.push('Verkehrschaos rund um die Halle – die Anbindung war überlastet.'); }
    else if (t.visitors > 0.5 && (c.fac.oepnv || 1) >= 4) { extraPub += 1; notes.push('Dank guter ÖPNV-Anbindung lief die Anreise reibungslos.'); }
    var pitchLoss = 0;
    if (t.pitch && !o.mods.rasen) { pitchLoss = Math.round(t.pitch * Math.max(1, o.days) / 2); c.pitch = Math.max(30, c.pitch - pitchLoss); }
    if (o.mode === 'block') { c.blockedArea = 1; notes.push('Beim nächsten Heimspiel sind Teile der Halle noch gesperrt.'); }
    if (t.id === 'naming') {
      if (!c.originalStadiumName) c.originalStadiumName = c.stadiumName;
      c.stadiumName = o.partner + ' Arena'; c.namingUntil = st.season + 3;
      notes.push('Die Halle heißt bis ' + (st.season + 3) + ' „' + c.stadiumName + '“.');
    }
    if (t.id === 'doku') { W.squad(st, c.id).forEach(function (p) { p.morale = Math.max(0, p.morale - 3); }); c.fans = Math.round(c.fans * 1.02); notes.push('Die Kameras in der Kabine kosten etwas Moral – dafür wächst die Fanbasis.'); }
    var cityAdd = R.sum(pv.city, function (x) { return x[1]; });
    c.cash += o.amount - pv.extraCost + cityAdd;
    E.book(c, 'Großereignisse', o.amount); E.book(c, 'Großereignis-Kosten', -pv.extraCost); if (cityAdd) E.book(c, 'Vereinsstadt (Events)', cityAdd);
    X.change(c, extraFan, extraPub);
    var net = Math.round(o.amount - pv.extraCost + cityAdd - (r.commCost || 0) - (r.measureCost || 0));
    var positive = (r.fan + extraFan) > 0;
    var headline = o.decision === 'D' && positive ? 'MILLIONENDEAL MIT FINGERSPITZENGEFÜHL – VEREIN INVESTIERT IN SEINE FANS.' :
      o.decision === 'C' && positive ? 'FANS PROFITIEREN VOM GROSSEVENT – KURVE ZEIGT SICH VERSÖHNT.' :
      cityAdd > 15000 ? 'FANSHOP MELDET REKORDUMSATZ – DER SCHATZMEISTER WEINT VOR GLÜCK.' :
      (r.fan + extraFan) < -6 ? 'KASSE VOLL, KURVE LEER? FANS FÜHLEN SICH ÜBERGANGEN.' : t.head;
    o.status = 'done';
    st.dealsScheduled = st.dealsScheduled.filter(function (x) { return x !== o; });
    var report = { title: t.endTitle, club: c.id, type: t.id, lines: lines, net: net, fan: Math.round((r.fan + extraFan) * 10) / 10, pub: Math.round((r.pub + extraPub) * 10) / 10, pitch: -pitchLoss, notes: notes, headline: headline, season: st.season, week: st.week };
    st.dealLog.unshift({ season: st.season, week: st.week, club: c.id, type: t.id, amount: o.amount, decision: o.decision, net: net, fan: report.fan, pub: report.pub });
    if (st.dealLog.length > 200) st.dealLog.length = 200;
    if (c.userControlled) { st.dealReport = report; R.season.news(st, headline, t.endTitle + ': Nettoergebnis ' + R.fmtMoney(net) + '.', 'deal'); }
    else if (o.amount >= 250000) R.season.news(st, c.short + ': ' + t.name, 'Erlös rund ' + R.fmtMoney(o.amount) + '.', 'deal');
    return report;
  };

  // KI-Entscheidung (KI-Vereine und KI-Geschäftsführung bei Trainer-Rolle)
  X.aiDecide = function (st, o) {
    var c = st.clubs[o.club], t = X.type(o.type);
    if (o.conflict) return X.apply(st, o, 'F', {}, false);
    var big = W.squad(st, c.id).length && t.id === 'doku' && st.week > 25; // sportlicher Kalender: Doku nicht in der Endphase
    if (big) return X.apply(st, o, 'F', {}, false);
    var dec = (t.fanA <= -5 || c.fanTrust < 45) ? 'D' : 'B';
    return X.apply(st, o, dec, { measures: t.fit.slice(0, 2), promise: 'keine' }, false);
  };

  // Wöchentliche Prüfung
  X.weekly = function (st) {
    X.ensureAll(st);
    var g = X.gw(st);
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      c.pitch = Math.min(100, c.pitch + 2 + (c.fac.rasen || 0) * 1.5);
      if (c.ticketPromo > 0) c.ticketPromo--; if (c.shopPromo > 0) c.shopPromo--; if (c.shirtBoost > 0) c.shirtBoost--;
      // Langsame Rückkehr zur Normalität (Auswirkungen bleiben lange spürbar)
      c.fanTrust += (60 - c.fanTrust) * 0.015; c.publicImage += (50 - c.publicImage) * 0.012;
      // Öffentliche Wahrnehmung → Reputation
      c.repAcc = (c.repAcc || 0) + (c.publicImage - 50) / 2500;
      if (Math.abs(c.repAcc) >= 1) { c.reputation = R.clamp(c.reputation + Math.trunc(c.repAcc), 1, 100); c.repAcc -= Math.trunc(c.repAcc); }
      if (c.namingUntil && st.season >= c.namingUntil && c.originalStadiumName) { c.stadiumName = c.originalStadiumName; c.originalStadiumName = null; c.namingUntil = null; if (c.userControlled) R.season.news(st, 'Der alte Hallenname ist zurück!', 'Die Fans feiern die Rückkehr des traditionsreichen Namens.', 'deal'); X.change(c, 4, 1); }
      X.checkCommitments(st, c);
    });
    // Geplante Veranstaltungen ausführen
    st.dealsScheduled.slice().forEach(function (o) { if (o.status === 'scheduled' && (o.eventWeek == null || st.week >= o.eventWeek || st.season > o.season)) X.execute(st, o); });
    // Frist abgelaufen
    if (st.deal && st.deal.status === 'offer' && (st.week > st.deal.deadline || st.season > st.deal.season)) {
      var t0 = X.type(st.deal.type), c0 = st.clubs[st.deal.club];
      st.dealLog.unshift({ season: st.season, week: st.week, club: c0.id, type: t0.id, amount: st.deal.amount, decision: 'verfallen', net: 0, fan: 0, pub: -1 });
      X.change(c0, 0, -1); c0.dealLast[t0.id] = g - 75;
      R.season.news(st, 'Frist verstrichen: ' + t0.name, 'Der Veranstalter ist in eine andere Halle gegangen.', 'deal');
      st.deal = null;
    }
    if (st.phase !== 'season' || st.week < 1 || st.week > 30) return;
    Object.keys(st.clubs).forEach(function (k) {
      var c = st.clubs[k];
      if (c.userControlled && st.manager.unemployed) return;
      if (c.userControlled && (st.deal || st.dealsScheduled.some(function (o) { return o.club === c.id; }))) return;
      var last = c.dealHistory.length ? c.dealHistory[c.dealHistory.length - 1].gw : -99;
      if (c.lastOfferGw != null && g - c.lastOfferGw < 3) return;
      var factor = 0.5 + c.reputation / 200 + c.publicImage / 250 + (E.capacity(c) > 6000 ? 0.15 : 0) + (c.league === 1 ? 0.1 : 0);
      if (!R.chance((c.userControlled ? 0.042 : 0.03) * factor)) return;
      var pool = X.types.filter(function (t) { return X.eligible(st, c, t); });
      if (!pool.length) return;
      var t = R.weighted(pool, function (x) { return x.w; });
      var o = X.generate(st, c, t);
      c.lastOfferGw = g; c.offerCount = (c.offerCount || 0) + 1;
      if (!c.userControlled) { X.aiDecide(st, o); return; }
      if (st.manager.role === 'trainer') {
        var res = X.aiDecide(st, o);
        R.season.news(st, 'Info der Geschäftsführung: ' + t.name, 'Angebot über ' + R.fmtMoney(o.amount) + ' – Entscheidung: ' + ({ B: 'angenommen mit Kommunikation', D: 'angenommen mit Gesamtpaket', F: 'abgelehnt' }[o.decision] || o.decision) + '.' + (t.days ? ' Die Halle ist ' + t.days + ' Tag(e) belegt' + (o.eventWeek ? ' (rund um den ' + o.eventWeek + '. Spieltag)' : '') + '; Training findet auf dem Nebenplatz statt.' : '') + (t.pitch && o.decision !== 'F' ? ' Der Hallenboden wird leiden.' : ''), 'deal');
        return;
      }
      st.deal = o; st.dealPopup = true;
      R.season.news(st, 'EILMELDUNG: ' + t.title, t.name + ' – Angebot über ' + R.fmtMoney(o.amount) + '. Entscheidung bis zum ' + o.deadline + '. Spieltag.', 'deal');
    });
  };

  X.checkCommitments = function (st, c) {
    if (!c.commitments || !c.commitments.length) return;
    var g = X.gw(st);
    c.commitments.forEach(function (cm) {
      if (cm.status !== 'open') return;
      var pr = X.promises[cm.type], done = false;
      if (pr.keys) done = pr.keys.some(function (k, i) { return (c.fac[k] || 0) > cm.levels[i] || c.construction.some(function (b) { return b.key === k; }); });
      if (pr.debt) done = E.debt(c) <= Math.max(0, cm.startDebt - cm.amount * 0.5) || E.debt(c) === 0;
      if (done) {
        cm.status = 'kept'; X.change(c, 4, 5);
        if (c.userControlled) R.season.news(st, 'Wort gehalten! ' + c.short + ' setzt Versprechen um', cm.text + ' – Fans und Öffentlichkeit honorieren die Glaubwürdigkeit.', 'deal');
      } else if (g > cm.deadline) {
        cm.status = 'broken'; c.brokenPromises = (c.brokenPromises || 0) + 1; X.change(c, -8, -6);
        if (c.userControlled) R.season.news(st, 'VERSPROCHEN, GEBROCHEN – FANS ERINNERN AN ALTE ZUSAGEN', cm.text + ' – davon ist nichts zu sehen.', 'deal');
      }
    });
  };
})(RFM);
