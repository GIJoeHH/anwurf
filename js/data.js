// ANWURF! – Stammdaten (Ligen, Positionen, Hallenausbau, Ereignisse)
(function (R) {
  var D = R.data = {};
  // Geldfaktor gegenüber der Fußball-Vorlage: Handball-Etats sind etwa ein Zehntel so groß
  var K = D.MONEY = 0.1;
  // Spieler auf dem Feld (1 Torwart + 6 Feldspieler) und im Spieltagskader
  D.ONCOURT = 7; D.MATCHDAY = 16;

  D.firstNames = ['Lukas','Jonas','Leon','Finn','Paul','Felix','Max','Tim','Jan','Niklas','Moritz','Tom','Ben','Elias','Noah','Luca','David','Julian','Fabian','Kevin','Dennis','Marco','Sven','Tobias','Florian','Patrick','Sebastian','Stefan','Thomas','Michael','Daniel','Marcel','Philipp','Jannik','Robin','Dominik','Kai','Lars','Timo','Mats','Erik','Hannes','Ole','Malte','Henrik','Jakob','Simon','Nico','Andreas','Christian','Kilian','Lennart','Torben','Joshua','Marvin','Pascal','Till','Jannis','Hendrik','Johannes','Rune','Kjell','Bjarne','Lasse','Jesper','Mikkel','Magnus','Rasmus','Mathias','Emil','Oskar','Viktor','Gustav','Anders','Niklas','Hampus','Albin','Ludvig','Sigvaldi','Gisli','Aron','Ómar','Viggó','Ivan','Luka','Domagoj','Marko','Nikola','Stefan','Blaž','Jure','Aleix','Pol','Joan','Dika','Nedim','Hugo','Ludovic','Kentin','Thibaud','Kamil','Bartosz','Michał','Ondřej','Tomáš','Mahmoud','Ahmed'];
  D.lastNames = ['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Schulz','Hoffmann','Koch','Richter','Klein','Wolf','Schröder','Neumann','Schwarz','Braun','Zimmermann','Krüger','Hartmann','Lange','Werner','Krause','Lehmann','Köhler','Herrmann','König','Walter','Kaiser','Fuchs','Peters','Lang','Scholz','Möller','Jung','Hahn','Vogel','Friedrich','Keller','Günther','Frank','Berger','Roth','Beck','Lorenz','Baumann','Franke','Albrecht','Ludwig','Winter','Kraus','Martin','Vogt','Stein','Jäger','Otto','Sommer','Seidel','Brandt','Haas','Graf','Kuhn','Pohl','Engel','Horn','Busch','Bergmann','Voigt','Arnold','Pfeiffer','Hansen','Jensen','Nielsen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Johansson','Karlsson','Lindberg','Nilsson','Svensson','Berg','Haugen','Solberg','Johannessen','Gudmundsson','Jónsson','Magnússon','Sigurdsson','Horvat','Kovačević','Babić','Jurić','Petrović','Marić','Novak','Kos','Zorman','García','Pérez','Fernández','Dubois','Petit','Lefèvre','Nowak','Kowalski','Wiśniewski','Dvořák','Novotný','Kristensen','Thomsen','Brinkmann','Ahlers','Tiedemann','Rademacher','Bolte','Kuhlmann','Hagedorn','Petersen','Clausen','Jacobsen','Frahm','Thiessen','Bendixen','Lorenzen'];

  // 54 fiktive Vereine: [Name, Kurzname, Stadt, Farbe1, Farbe2, Liga, Stärke-Tier 0..1, Fans]
  D.clubs = [
    ['FC Hafenstadt 1899','Hafenstadt','Hamburg','#1d4ed8','#ffffff',1,0.95,62000],
    ['Borussia Rheinfeld','Rheinfeld','Köln','#dc2626','#ffffff',1,0.88,55000],
    ['SV Isarblau München','Isarblau','München','#2563eb','#e5e7eb',1,1.00,70000],
    ['Eintracht Mainau','Mainau','Frankfurt','#111827','#dc2626',1,0.86,50000],
    ['VfB Neckartal','Neckartal','Stuttgart','#ffffff','#b91c1c',1,0.84,52000],
    ['Spree Union Berlin','Spree Union','Berlin','#b91c1c','#facc15',1,0.80,45000],
    ['Hertha Havelland','Havelland','Berlin','#1e3a8a','#ffffff',1,0.78,48000],
    ['Werder Weserau','Weserau','Bremen','#15803d','#ffffff',1,0.79,44000],
    ['Fortuna Rheinhafen','Rheinhafen','Düsseldorf','#dc2626','#ffffff',1,0.74,40000],
    ['TSV Leinetal Hannover','Leinetal','Hannover','#065f46','#111827',1,0.72,38000],
    ['Ruhrpott 04','Ruhrpott','Gelsenkirchen','#1d4ed8','#ffffff',1,0.83,60000],
    ['Schwarzgelb Westfalia','Westfalia','Dortmund','#facc15','#111827',1,0.93,66000],
    ['SC Breisgau','Breisgau','Freiburg','#b91c1c','#111827',1,0.73,30000],
    ['FC Franken Nürnberg','Franken','Nürnberg','#7f1d1d','#ffffff',1,0.70,36000],
    ['Alemannia Dreiländereck','Dreiländereck','Aachen','#facc15','#111827',1,0.66,28000],
    ['1. FC Pfalzberg','Pfalzberg','Kaiserslautern','#b91c1c','#ffffff',1,0.68,34000],
    ['Sachsen Leipzig 1902','Sachsen','Leipzig','#ffffff','#dc2626',1,0.82,35000],
    ['Hansa Ostseeküste','Ostseeküste','Rostock','#1d4ed8','#ffffff',1,0.65,27000],

    ['Dynamo Elbflorenz','Elbflorenz','Dresden','#facc15','#111827',2,0.62,32000],
    ['KSV Hessenkassel','Hessenkassel','Kassel','#dc2626','#1d4ed8',2,0.55,15000],
    ['Arminia Teutoburg','Teutoburg','Bielefeld','#1d4ed8','#111827',2,0.58,22000],
    ['VfL Kanalstadt','Kanalstadt','Bochum','#1d4ed8','#ffffff',2,0.60,25000],
    ['MSV Rheinduisburg','Duisburg','Duisburg','#1d4ed8','#ffffff',2,0.56,20000],
    ['SpVgg Kleeblatt','Kleeblatt','Fürth','#15803d','#ffffff',2,0.54,12000],
    ['Karlsruher Fächer SC','Fächer','Karlsruhe','#1d4ed8','#ffffff',2,0.59,24000],
    ['SV Darmstadt Lilien','Lilien','Darmstadt','#1d4ed8','#ffffff',2,0.53,14000],
    ['FC Erzgebirge','Erzgebirge','Aue','#7c3aed','#ffffff',2,0.50,11000],
    ['Holstein Förde','Förde','Kiel','#1d4ed8','#dc2626',2,0.57,15000],
    ['SC Ostwestfalen','Ostwestfalen','Paderborn','#1d4ed8','#111827',2,0.52,13000],
    ['Jahn Donaustrudel','Donaustrudel','Regensburg','#b91c1c','#ffffff',2,0.49,10000],
    ['FC Magdeburg Elbe','Elbe','Magdeburg','#1d4ed8','#ffffff',2,0.55,21000],
    ['Braunschweiger Löwen','Löwen','Braunschweig','#facc15','#1d4ed8',2,0.56,20000],
    ['SV Saarland 03','Saarland','Saarbrücken','#1d4ed8','#111827',2,0.51,14000],
    ['1. FC Oberpfalz','Oberpfalz','Amberg','#16a34a','#ffffff',2,0.47,8000],
    ['Preußen Münsterland','Münsterland','Münster','#15803d','#111827',2,0.50,13000],
    ['TuS Koblenz Deutsches Eck','Dt. Eck','Koblenz','#1d4ed8','#ffffff',2,0.46,8000],

    ['Rot-Weiß Ruhrwiese','Ruhrwiese','Essen','#dc2626','#ffffff',3,0.44,16000],
    ['SC Hafen Lübeck','Lübeck','Lübeck','#15803d','#ffffff',3,0.38,7000],
    ['VfR Neckarbrücke','Neckarbrücke','Mannheim','#1d4ed8','#dc2626',3,0.41,9000],
    ['SV Wehen Taunus','Taunus','Wiesbaden','#dc2626','#111827',3,0.40,6000],
    ['FC Viktoria Domstadt','Domstadt','Köln','#dc2626','#ffffff',3,0.36,5000],
    ['Hallescher Saale FC','Saale','Halle','#dc2626','#ffffff',3,0.39,9000],
    ['Erfurter Blumenstadt','Blumenstadt','Erfurt','#dc2626','#ffffff',3,0.37,8000],
    ['SV Ostfriesland','Ostfriesland','Emden','#facc15','#1d4ed8',3,0.30,4000],
    ['Kickers Mainbogen','Mainbogen','Offenbach','#dc2626','#ffffff',3,0.42,10000],
    ['SpVgg Unterhaching Vorstadt','Vorstadt','München','#dc2626','#1d4ed8',3,0.33,3500],
    ['Energie Lausitz','Lausitz','Cottbus','#dc2626','#ffffff',3,0.40,10000],
    ['FC Ingolstadt Schanzer','Schanzer','Ingolstadt','#111827','#dc2626',3,0.38,6000],
    ['SG Moorhausen','Moorhausen','Oldenburg','#1d4ed8','#ffffff',3,0.32,5000],
    ['Zwickauer Schwäne','Schwäne','Zwickau','#dc2626','#ffffff',3,0.31,5000],
    ['VfB Ostalb','Ostalb','Aalen','#111827','#ffffff',3,0.29,3500],
    ['Würzburger Kickers Main','Würzburg','Würzburg','#dc2626','#ffffff',3,0.35,6000],
    ['TSV Sechzig Giesing','Giesing','München','#1d4ed8','#ffffff',3,0.43,14000],
    ['SC Verl Heidekraut','Heidekraut','Verl','#111827','#ffffff',3,0.28,3000]
  ];

  // Derby-Paare (Kurznamen)
  D.derbies = [['Hafenstadt','Westfalia'],['Spree Union','Havelland'],['Isarblau','Giesing'],['Isarblau','Vorstadt'],['Giesing','Vorstadt'],['Ruhrpott','Westfalia'],['Rheinfeld','Rheinhafen'],['Rheinfeld','Domstadt'],['Kanalstadt','Ruhrpott'],['Duisburg','Ruhrwiese'],['Kanalstadt','Ruhrwiese'],['Mainau','Lilien'],['Mainau','Mainbogen'],['Franken','Kleeblatt'],['Elbflorenz','Sachsen'],['Löwen','Leinetal'],['Elbe','Saale'],['Neckartal','Fächer'],['Teutoburg','Ostwestfalen'],['Weserau','Hafenstadt'],['Lübeck','Förde'],['Ostseeküste','Förde'],['Erzgebirge','Schwäne'],['Breisgau','Fächer'],['Pfalzberg','Saarland']];

  // Ligen: Schlüssel 1 = Bundesliga, 2 = 2. Bundesliga, 3–6 = die vier Staffeln der 3. Liga (Spielklasse 3)
  D.leagueNames = { 1: 'Bundesliga', 2: '2. Bundesliga', 3: '3. Liga Nord-Ost', 4: '3. Liga Nord-West', 5: '3. Liga Süd-West', 6: '3. Liga Süd' };
  D.leagueShort = { 1: 'HBL', 2: '2. HBL', 3: 'Nord-Ost', 4: 'Nord-West', 5: 'Süd-West', 6: 'Süd' };
  D.tierNames = { 1: 'Bundesliga', 2: '2. Bundesliga', 3: '3. Liga' };
  D.staffeln = ['Nord-Ost', 'Nord-West', 'Süd-West', 'Süd'];
  D.leagueKeys = [1, 2, 3, 4, 5, 6];
  D.leagueTier = { 1: 1, 2: 2, 3: 3, 4: 3, 5: 3, 6: 3 };
  D.leagueTV = { 1: 1300000, 2: 300000, 3: 50000 }; // TV-Gelder je Saison (Basis)
  D.leagueTicketBase = { 1: 1.0, 2: 0.65, 3: 0.40 };

  D.positions = ['TW', 'AUS', 'RUE', 'KRS'];
  D.posNames = { TW: 'Torwart', AUS: 'Außen', RUE: 'Rückraum', KRS: 'Kreis' };
  D.posShort = { TW: 'TW', AUS: 'AU', RUE: 'RR', KRS: 'KM' };
  // Genaue Position (Spielerkarte): LA/RA = Außen, RL/RM/RR = Rückraum, KM = Kreismitte
  D.posDetailNames = { TW: 'Torwart', LA: 'Linksaußen', RA: 'Rechtsaußen', RL: 'Rückraum links', RM: 'Rückraum Mitte', RR: 'Rückraum rechts', KM: 'Kreisläufer' };

  // Abwehrsysteme: 7 Plätze (Torwart + 6 Feldspieler) mit Rolle und Position in der Angriffsaufstellung
  // (x: 0..100 links→rechts, y: 0..100 eigenes Tor→gegnerisches Tor). def/att: Wirkung in der Match-Engine.
  D.formations = {
    '6:0': [['TW',50,6],['AUS',8,88],['RUE',24,62],['RUE',50,56],['RUE',76,62],['AUS',92,88],['KRS',50,84]],
    '5:1': [['TW',50,6],['AUS',8,88],['RUE',24,62],['RUE',50,56],['RUE',76,62],['AUS',92,88],['KRS',50,84]],
    '3:2:1': [['TW',50,6],['AUS',8,88],['RUE',24,62],['RUE',50,56],['RUE',76,62],['AUS',92,88],['KRS',50,84]],
    '4:2': [['TW',50,6],['AUS',8,88],['RUE',24,62],['RUE',50,56],['RUE',76,62],['AUS',92,88],['KRS',50,84]],
    '6:0 + 2 Kreisläufer': [['TW',50,6],['AUS',8,88],['RUE',30,60],['RUE',70,60],['AUS',92,88],['KRS',38,84],['KRS',62,84]]
  };
  D.formationInfo = {
    '6:0': { def: 1.04, att: 1.0, steal: 0.9, d: 'Sechs Abwehrspieler auf einer Linie: kompakt gegen Kreis und Durchbrüche, anfälliger für Rückraumwürfe.' },
    '5:1': { def: 1.0, att: 1.0, steal: 1.1, d: 'Ein vorgezogener Spieler stört den Spielaufbau. Ausgewogen.' },
    '3:2:1': { def: 0.97, att: 1.02, steal: 1.35, d: 'Offensive Abwehr: viele Ballgewinne und Tempogegenstöße, aber Lücken am Kreis.' },
    '4:2': { def: 0.98, att: 1.0, steal: 1.2, d: 'Zwei Spieler decken die gefährlichsten Rückraumschützen offensiv.' },
    '6:0 + 2 Kreisläufer': { def: 1.03, att: 0.98, steal: 0.9, d: 'Im Angriff zwei Kreisläufer statt drei Rückraumspielern: stark am Kreis, weniger Fernwürfe.' }
  };

  // Attributgewichte je Position: tec, pas, sho, def, spd, sta, gk
  D.posWeights = {
    TW:  [0.04, 0.04, 0, 0.04, 0.05, 0.08, 0.75],
    AUS: [0.18, 0.07, 0.32, 0.08, 0.25, 0.10, 0],
    RUE: [0.20, 0.25, 0.30, 0.10, 0.05, 0.10, 0],
    KRS: [0.16, 0.06, 0.22, 0.34, 0.07, 0.15, 0]
  };
  D.attrKeys = ['tec', 'pas', 'sho', 'def', 'spd', 'sta', 'gk'];
  D.attrNames = { tec: 'Technik', pas: 'Spielverständnis', sho: 'Wurf', def: 'Abwehr', spd: 'Tempo', sta: 'Athletik', gk: 'Torwart' };

  D.injuries = [
    { n: 'Prellung', min: 1, max: 2, w: 38 },
    { n: 'Fingerverletzung', min: 1, max: 3, w: 18 },
    { n: 'Zerrung', min: 1, max: 3, w: 18 },
    { n: 'Umgeknickt (Sprunggelenk)', min: 2, max: 5, w: 12 },
    { n: 'Schulterverletzung', min: 4, max: 9, w: 7 },
    { n: 'Bänderriss', min: 5, max: 10, w: 4 },
    { n: 'Kreuzbandriss', min: 20, max: 32, w: 3 }
  ];

  D.coachProfiles = ['Offensiv', 'Defensiv', 'Ausgewogen', 'Jugendförderung', 'Erfahrener Taktiker'];

  // ---------- Ausbausysteme ----------
  // Jede Stufe: n=Name, cost=Baukosten, wk=Bauzeit (Wochen), up=laufende Kosten/Saison, plus Effektwerte
  function L(n, cost, wk, up, extra) { var o = { n: n, cost: cost, wk: wk, up: up }; for (var k in extra) o[k] = extra[k]; return o; }
  D.facilities = {
    // Stadion
    steh: { name: 'Stehplätze', group: 'stadion', levels: [
      L('Keine Stehplätze', 0, 0, 0, { cap: 0 }), L('Stehstufen', 150000, 3, 10000, { cap: 1500 }), L('Stehblock', 600000, 6, 30000, { cap: 4000 }),
      L('Stehtribüne', 1800000, 10, 70000, { cap: 8000 }), L('Große Fantribüne', 4500000, 16, 140000, { cap: 13000 }), L('Doppelte Fantribüne', 9000000, 22, 240000, { cap: 19000 }), L('Legendäre Wand', 15000000, 28, 380000, { cap: 25000 })] },
    sitz: { name: 'Sitzplätze', group: 'stadion', levels: [
      L('Klappstühle am Spielfeldrand', 0, 0, 5000, { cap: 500 }), L('Kleine Sitztribüne', 400000, 5, 25000, { cap: 2500 }), L('Haupttribüne', 1500000, 9, 70000, { cap: 6000 }),
      L('Zwei Sitztribünen', 4500000, 14, 160000, { cap: 12000 }), L('Rundum-Sitzplätze', 10000000, 22, 320000, { cap: 20000 }), L('Großarena', 20000000, 32, 560000, { cap: 32000 }), L('Weltklasse-Arena', 35000000, 44, 900000, { cap: 45000 })] },
    dach: { name: 'Klima & Lüftung', group: 'stadion', levels: [
      L('Fenster auf', 0, 0, 0, { att: 0 }), L('Lüftungsanlage', 500000, 6, 20000, { att: 5 }), L('Klimaanlage', 2000000, 12, 60000, { att: 10 }), L('Klimatisierte Komfort-Arena', 6000000, 20, 140000, { att: 15 })] },
    vip: { name: 'VIP-Logen', group: 'stadion', levels: [
      L('Keine Logen', 0, 0, 0, { vip: 0 }), L('4 Logen', 300000, 4, 20000, { vip: 48 }), L('10 Logen', 1000000, 8, 50000, { vip: 120 }), L('24 Logen', 3000000, 12, 120000, { vip: 300 }), L('48 Logen', 7000000, 18, 250000, { vip: 600 }), L('80 Logen + Business-Club', 14000000, 26, 450000, { vip: 1000 })] },
    licht: { name: 'Hallenlicht & Show', group: 'stadion', levels: [
      L('Neonröhren', 0, 0, 0, { att: 0 }), L('Helle Hallenbeleuchtung', 250000, 3, 15000, { att: 3 }), L('TV-taugliche LED-Beleuchtung', 900000, 6, 40000, { att: 6 }), L('LED-Lichtshow mit Einlaufshow', 2500000, 8, 50000, { att: 9 })] },
    video: { name: 'Videowände', group: 'stadion', levels: [
      L('Anzeigetafel per Hand', 0, 0, 0, { att: 0 }), L('Elektronische Anzeigetafel', 300000, 3, 15000, { att: 3 }), L('Videowürfel unter dem Hallendach', 1500000, 6, 50000, { att: 6 })] },
    rasen: { name: 'Hallenboden', group: 'stadion', levels: [
      L('Alter Linoleumboden', 0, 0, 10000, { att: 0, play: 0 }), L('Schwingboden', 150000, 2, 30000, { att: 2, play: 1 }), L('Parkettboden', 800000, 4, 70000, { att: 4, play: 2 }), L('Mobiler Profi-Sportboden', 2000000, 6, 120000, { att: 5, play: 3 }), L('LED-Glasboden', 3000000, 8, 180000, { att: 8, play: 3 })] },
    sanitaer: { name: 'Sanitäranlagen', group: 'stadion', levels: [
      L('Dixi-Klos', 0, 0, 5000, { att: 0 }), L('Toilettenhäuschen', 120000, 2, 15000, { att: 3 }), L('Moderne Sanitärblöcke', 500000, 4, 35000, { att: 6 }), L('Premium-Sanitär', 1500000, 6, 60000, { att: 8 })] },
    hosp: { name: 'Hospitality & Gastronomie', group: 'stadion', levels: [
      L('Keine', 0, 0, 0, { att: 0 }), L('Imbissstände', 200000, 3, 20000, { att: 3 }), L('Gastro-Umlauf', 1200000, 8, 70000, { att: 6 }), L('Premium-Hospitality', 4000000, 14, 160000, { att: 9 })] },
    technik: { name: 'Hallentechnik', group: 'stadion', levels: [
      L('Analog', 0, 0, 0, { att: 0 }), L('Digitale Einlasskontrolle', 300000, 3, 20000, { att: 2 }), L('Hallen-WLAN & App', 1500000, 6, 60000, { att: 4 }), L('Smart-Arena', 5000000, 12, 150000, { att: 6 })] },

    // Verkehr (Stufe 1 = Grundausstattung)
    oepnv: { name: 'Öffentlicher Nahverkehr', group: 'infra', min: 1, levels: [
      null, L('Einfache Bushaltestelle', 0, 0, 5000, { fans: 1200, att: 0 }), L('Verstärkter Busverkehr', 300000, 4, 40000, { fans: 3500, att: 1 }),
      L('Busbahnhof mit Shuttle', 1500000, 10, 90000, { fans: 8000, att: 2 }), L('Straßenbahnanschluss', 7000000, 22, 160000, { fans: 16000, att: 3, sub: 0.3 }),
      L('S-Bahn-Station', 20000000, 36, 250000, { fans: 30000, att: 4, sub: 0.35 }), L('Eigener U-Bahnhof an der Arena', 50000000, 56, 400000, { fans: 55000, att: 6, sub: 0.4 })] },
    strasse: { name: 'Straßenanbindung', group: 'infra', min: 1, levels: [
      null, L('Schotterweg', 0, 0, 3000, { fans: 2500, att: 0 }), L('Asphaltierte Zufahrtsstraße', 250000, 3, 15000, { fans: 6000, att: 1 }),
      L('Ausgebaute Hauptstraße', 1200000, 8, 35000, { fans: 12000, att: 2 }), L('Mehrspurige Zufahrt', 4000000, 16, 70000, { fans: 22000, att: 3 }),
      L('Schnellstraßenanschluss', 12000000, 28, 120000, { fans: 35000, att: 3, sub: 0.25 }), L('Autobahnanschluss', 30000000, 44, 200000, { fans: 50000, att: 4, sub: 0.3 })] },
    parken: { name: 'Parkplätze', group: 'infra', min: 1, levels: [
      null, L('Parken am Straßenrand', 0, 0, 0, { cars: 400, att: 0, fee: 0 }), L('Schotterparkplatz', 150000, 2, 10000, { cars: 1500, att: 1, fee: 3 }),
      L('Asphaltierter Hallenparkplatz', 800000, 5, 30000, { cars: 4000, att: 2, fee: 5 }), L('Großparkplatz mit Parkleitsystem', 3000000, 10, 70000, { cars: 8000, att: 3, fee: 6 }),
      L('Moderne Parkhäuser', 9000000, 20, 160000, { cars: 14000, att: 4, fee: 8 }), L('Verkehrsleitzentrum mit Parkhäusern', 20000000, 32, 280000, { cars: 22000, att: 5, fee: 10 })] },

    // Abteilungen
    medizin: { name: 'Medizinische Abteilung', group: 'abteilung', min: 1, levels: [
      null, L('Der Vereinsschamane', 0, 0, 40000, { q: 0 }), L('Vereinsarzt', 300000, 4, 150000, { q: 1 }), L('Medizinische Abteilung', 1200000, 8, 400000, { q: 2 }),
      L('Modernes Medizinzentrum', 4000000, 14, 900000, { q: 3 }), L('Sportmedizinisches Leistungszentrum', 10000000, 22, 1600000, { q: 4 }), L('Vereins-Privatklinik', 25000000, 34, 2800000, { q: 5 })] },
    jugend: { name: 'Nachwuchsleistungszentrum', group: 'abteilung', min: 1, levels: [
      null, L('Schulturnhalle', 0, 0, 50000, { q: 0 }), L('Jugendakademie', 600000, 6, 250000, { q: 1 }), L('Regionales Leistungszentrum', 2500000, 12, 700000, { q: 2 }),
      L('Nachwuchsleistungszentrum', 7000000, 20, 1500000, { q: 3 }), L('Eliteakademie', 18000000, 30, 2800000, { q: 4 })] },
    training: { name: 'Trainingszentrum', group: 'abteilung', min: 1, levels: [
      null, L('Eine Trainingshalle', 0, 0, 30000, { q: 0 }), L('Zwei Hallen & Kraftraum', 500000, 5, 120000, { q: 1 }), L('Trainingszentrum mit Athletikbereich', 2000000, 10, 350000, { q: 2 }),
      L('Modernes Trainingszentrum', 6000000, 18, 700000, { q: 3 }), L('High-Performance-Campus', 15000000, 28, 1300000, { q: 4 })] },
    geschaeft: { name: 'Geschäftsstelle', group: 'stadt', min: 1, levels: [
      null, L('Vereinsheim', 0, 0, 20000, { q: 0, rev: 0 }), L('Bürocontainer', 200000, 3, 50000, { q: 1, rev: 0 }), L('Geschäftsstelle', 1500000, 10, 120000, { q: 2, rev: 0 }), L('Repräsentative Zentrale', 6000000, 20, 250000, { q: 3, rev: 0 })] },

    // Vereinsstadt (rev = Basiserlös/Saison bei Referenznachfrage)
    fanshop: { name: 'Fanshop & Merchandising', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Fanartikelstand', 80000, 2, 30000, { rev: 70000 }), L('Fanshop an der Halle', 500000, 5, 150000, { rev: 360000 }),
      L('Großer offizieller Fanshop', 2000000, 10, 500000, { rev: 1080000 }), L('Fanshop mit Onlineshop', 5000000, 14, 1300000, { rev: 2700000 }), L('Internationales Merchandising-Center', 14000000, 24, 3500000, { rev: 6600000 })] },
    restaurant: { name: 'Hallengastronomie', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Würstchenbude', 30000, 1, 15000, { rev: 40000 }), L('Mehrere Kioske', 250000, 3, 90000, { rev: 220000 }),
      L('Großes Hallenrestaurant', 1200000, 8, 400000, { rev: 710000 }), L('Restaurant mit VIP-Lounge', 3500000, 12, 900000, { rev: 1650000 }), L('Erlebnisrestaurant mit Eventbereich', 8000000, 18, 1800000, { rev: 3220000 })] },
    cafe: { name: 'Vereinscafé', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Kleines Café', 60000, 2, 40000, { rev: 90000 }), L('Modernes Vereinscafé', 350000, 4, 130000, { rev: 260000 }),
      L('Großes Fan-Café', 1000000, 7, 300000, { rev: 600000 }), L('Fan-Treffpunkt mit Veranstaltungsraum', 2500000, 10, 600000, { rev: 1200000 })] },
    hotel: { name: 'Vereinshotel', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Kleine Pension', 600000, 8, 200000, { rev: 340000 }), L('Einfaches Vereinshotel', 2500000, 14, 700000, { rev: 1080000 }),
      L('Drei-Sterne-Hotel', 7000000, 22, 1800000, { rev: 2700000 }), L('Vier-Sterne-Sporthotel', 16000000, 30, 3800000, { rev: 5580000 }), L('Exklusives Vereins- und Konferenzhotel', 35000000, 40, 7500000, { rev: 10350000 })] },
    museum: { name: 'Vereinsmuseum', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Kleine Ausstellung', 100000, 3, 40000, { rev: 60000 }), L('Vereinsmuseum', 800000, 8, 180000, { rev: 260000 }),
      L('Interaktives Museum', 3000000, 14, 500000, { rev: 760000 }), L('Große Erlebniswelt', 8000000, 22, 1200000, { rev: 1760000 }), L('Handball-Erlebniszentrum', 18000000, 30, 2500000, { rev: 3600000 })] },
    eventhalle: { name: 'Eventhalle', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Mehrzweckhalle', 3000000, 14, 600000, { rev: 990000 }), L('Eventhalle', 10000000, 24, 1600000, { rev: 2700000 }), L('Großarena für Konzerte', 25000000, 36, 3500000, { rev: 5850000 })] },
    erlebnis: { name: 'Fan-Erlebniswelt', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Kinderspielplatz & Wurfwand', 150000, 3, 60000, { rev: 140000 }), L('Fan-Erlebniswelt', 1500000, 10, 400000, { rev: 760000 }), L('Fan-Erlebnispark', 6000000, 20, 1300000, { rev: 2210000 })] },
    solar: { name: 'Solaranlage', group: 'stadt', levels: [
      L('—', 0, 0, 0, { save: 0 }), L('Solardach auf der Halle', 400000, 4, 10000, { save: 0.04 }), L('Solardächer & Speicher', 1500000, 8, 30000, { save: 0.08 }), L('Energiepark', 4500000, 14, 60000, { save: 0.12 })] },
    gewerbe: { name: 'Gewerbepark', group: 'stadt', levels: [
      L('—', 0, 0, 0, { rev: 0 }), L('Bürocontainer zur Miete', 1000000, 8, 150000, { rev: 300000 }), L('Kleiner Gewerbehof', 4000000, 16, 500000, { rev: 990000 }),
      L('Gewerbepark', 10000000, 26, 1100000, { rev: 2250000 }), L('Business-Quartier', 25000000, 40, 2400000, { rev: 5040000 })] }
  };
  // Handball-Skalierung: Kosten/Erlöse ×K, Hallenplätze ×0,2, Logenplätze ×0,3, Verkehr ×0,2
  Object.keys(D.facilities).forEach(function (k) {
    var kk = k === 'steh' || k === 'sitz' || k === 'vip' ? 0.2 : K; // Plätze: gleicher Preis je Platz wie im Original (Ticketpreise sind nicht skaliert)
    D.facilities[k].levels.forEach(function (lv) {
      if (!lv) return;
      ['cost', 'up', 'rev'].forEach(function (x) { if (lv[x]) lv[x] = Math.round(lv[x] * kk / 1000) * 1000; });
      if (lv.cap) lv.cap = Math.round(lv.cap * 0.2 / 50) * 50;
      if (lv.vip) lv.vip = Math.round(lv.vip * 0.3);
      if (lv.fans) lv.fans = Math.round(lv.fans * 0.2 / 50) * 50;
      if (lv.cars) lv.cars = Math.round(lv.cars * 0.2 / 50) * 50;
    });
  });
  D.facilityOrder = {
    stadion: ['steh', 'sitz', 'dach', 'vip', 'licht', 'video', 'rasen', 'sanitaer', 'hosp', 'technik'],
    infra: ['oepnv', 'strasse', 'parken'],
    abteilung: ['medizin', 'jugend', 'training'],
    stadt: ['geschaeft', 'fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'solar', 'gewerbe']
  };
  D.medicalQuotes = {
    1: '„Was nicht von allein heilt, bekommt einen Kräutertee.“',
    6: '„Hier werden sogar die Ausreden des Trainers untersucht.“'
  };

  D.budgetAreas = { admin: 'Verwaltung', marketing: 'Marketing', fans: 'Fanbetreuung', scouting: 'Scouting', trainorg: 'Trainingsorganisation' };
  D.budgetLevels = ['Sparsam', 'Normal', 'Premium'];

  D.sponsorCategories = { haupt: 'Hauptsponsor', trikot: 'Trikotsponsor', aermel: 'Ärmelsponsor', ausruester: 'Ausrüster', namensrechte: 'Hallennamensrechte', bande: 'Bandenwerbung' };
  D.sponsorShare = { haupt: 0.38, trikot: 0.2, aermel: 0.07, ausruester: 0.15, namensrechte: 0.12, bande: 0.08 };
  D.sponsorNames = ['Nordstern Versicherungen','Oma Ernas Kartoffelsalat AG','Kredit Hai & Söhne','Würstchen-Walter Holding','Insolvenzberatung Optimus','Rheinstahl Logistik','Alpenquell Mineralwasser','Hanse Telekom','Brauerei Zum Goldenen Siebenmeter','Turbo-Autohaus Krause','Bäckerei Zeitspiel','Sparkasse Sonnenschein','Elektro Hallenlicht GmbH','Getränke Gerd','Möbelhaus Gemütlich','Kohle & Stahl AG','Pixelwerk Software','Friseur Haarscharf daneben','Pommes Paradies','Baumarkt Schraube Locker','Reisebüro Auswärtssieg','Nudel-Nobbi Feinkost','Schuhhaus Sprungwurf','Bierdeckel Brauhaus','Solarpark Sonnenseite','Kfz-Werkstatt Harzfinger','Optiker Scharfblick','Versandhaus Tempogegenstoß','Zahnarztpraxis Lückenfüller','Wurstfabrik Siebenmeterstrich','Spedition Fernwurf','Energieversorger Strompass','Autobahn Raststätte 60:00','Brillenhaus Videobeweis'];
  D.kitBrands = ['Wurfwerk', 'Harzhammer', 'Retro Sports', 'Kempagott', 'Tornado Athletics', 'Dreher & Co.'];

  D.camps = [
    { id: 'harz', name: 'Harz', cost: 6000, fit: 6, mor: 2, chem: 1, pr: 0, desc: 'Günstig, gute Fitnessentwicklung, viel Regen.' },
    { id: 'tirol', name: 'Tirol', cost: 18000, fit: 7, mor: 4, chem: 3, pr: 1, desc: 'Höhenluft, Bergläufe und Kaiserschmarrn.' },
    { id: 'mallorca', name: 'Mallorca', cost: 25000, fit: 3, mor: 7, chem: 6, pr: 2, desc: 'Mittlere Kosten, Teamchemie und Moral.' },
    { id: 'dubai', name: 'Dubai', cost: 90000, fit: 4, mor: 9, chem: 4, pr: 6, desc: 'Sehr teuer, hoher Komfort, Motivation und Öffentlichkeitswirkung.' }
  ];

  // fx: Wirkung pro Woche (−2 … +2) auf Moral, Fitness (langfristig), Frische (kurzfristig), Verletzungsgefahr, Entwicklung
  // mor: Moral-Zielwert-Verschiebung, die das Training tatsächlich bewirkt (season.js)
  D.training = {
    fitness: { n: 'Fitness', ic: '🏃', d: 'Athletik und Tempo steigen langfristig – kostet kurzfristig Frische.', fx: { mor: -1, fit: 2, fresh: -2, inj: 1, dev: 1 }, attrs: 'Athletik, Tempo', mor: -2 },
    taktik: { n: 'Taktik', ic: '🧠', d: 'Bessere Abstimmung: +2 % Bonus im nächsten Spiel.', fx: { mor: 0, fit: 0, fresh: 0, inj: 0, dev: 1 }, attrs: 'Spielverständnis, Abwehr', mor: 0 },
    angriff: { n: 'Angriff', ic: '🤾', d: 'Wurf und Technik werden verbessert. Macht Spaß.', fx: { mor: 1, fit: 0, fresh: 0, inj: 0, dev: 2 }, attrs: 'Wurf, Technik', mor: 2 },
    defensive: { n: 'Defensive', ic: '🛡️', d: 'Beinarbeit und Abwehrverhalten werden verbessert.', fx: { mor: 0, fit: 1, fresh: 0, inj: 0, dev: 2 }, attrs: 'Abwehr, Athletik', mor: 0 },
    technik: { n: 'Technik', ic: '🎯', d: 'Ballbehandlung und Zusammenspiel werden verbessert.', fx: { mor: 1, fit: 0, fresh: 0, inj: 0, dev: 2 }, attrs: 'Technik, Spielverständnis', mor: 1 },
    regeneration: { n: 'Regeneration', ic: '🧘', d: 'Schnelle Erholung, keine Trainingsverletzungen, kaum Entwicklung.', fx: { mor: 2, fit: -1, fresh: 2, inj: -2, dev: -2 }, attrs: '–', mor: 3 }
  };
  D.trainingFx = { mor: ['😊', 'Moral'], fit: ['💪', 'Fitness'], fresh: ['⚡', 'Frische'], inj: ['🩹', 'Verletzungsgefahr'], dev: ['📈', 'Entwicklung'] };

  // Trainerstab (zusätzlich zum Cheftrainer); Gehalt je Stufe = Faktor × Ligabasis
  D.staff = {
    co: { n: 'Co-Trainer', ic: '📋', d: 'Bessere Trainingsarbeit und Spielvorbereitung.', eff: '+3 % Trainingswirkung und etwas bessere Spielleistung je Stufe' },
    reha: { n: 'Reha-Trainer', ic: '🩹', d: 'Verletzte Spieler kehren schneller zurück.', eff: '−7 % Ausfallzeit je Stufe' },
    fitness: { n: 'Fitnesstrainer', ic: '💪', d: 'Mehr Frische, weniger Muskelverletzungen.', eff: '+1,5 Erholung pro Woche, −5 % Verletzungsrisiko je Stufe' },
    ernaehrung: { n: 'Ernährungsberater', ic: '🥗', d: 'Bessere Regeneration durch richtige Ernährung.', eff: '+1 Erholung pro Woche, −3 % Verletzungsrisiko je Stufe' },
    assistent: { n: 'Teamassistent', ic: '🗂️', d: 'Reibungslose Abläufe, gute Stimmung im Team.', eff: '+2 Moral-Zielwert und Teamchemie je Stufe' }
  };
  D.staffLevels = ['Nicht besetzt', 'Einsteiger', 'Erfahren', 'Spitzenkraft'];
  D.staffWage = { factor: [0, 1, 2.6, 6], base: { 1: 14000, 2: 5500, 3: 2200 } };

  D.stocks = [
    { id: 'STB', name: 'Hallenbau AG', price: 42, vol: 0.05, drift: 0.002 },
    { id: 'GSI', name: 'Global Sports Industries', price: 118, vol: 0.04, drift: 0.0015 },
    { id: 'TFS', name: 'TechFuture SE', price: 76, vol: 0.08, drift: 0.003 },
    { id: 'NSE', name: 'Nordstern Energie', price: 31, vol: 0.035, drift: 0.001 },
    { id: 'WWH', name: 'Würstchen-Walter Holding', price: 12, vol: 0.06, drift: 0.0008 },
    { id: 'RSL', name: 'Rheinstahl Logistik', price: 55, vol: 0.045, drift: 0.0012 },
    { id: 'HSP', name: 'Harz & Sport Pharma', price: 23, vol: 0.05, drift: 0.0012 }
  ];
  D.cryptos = [
    { id: 'HAND', name: 'HandCoin', price: 2.5, vol: 0.18, drift: 0.004 },
    { id: 'HALL', name: 'HallenToken', price: 0.8, vol: 0.22, drift: 0.003 },
    { id: 'MOON', name: 'MoonBall', price: 0.05, vol: 0.35, drift: 0.002 }
  ];

  D.cheatMessages = [
    'Der Praktikant hat wieder zwei Nullen zu viel eingetragen.',
    'Ein Fax aus dem Jahr 1991 wurde endlich bearbeitet.',
    'Die Bank verwechselt Ihren Verein mit einem Champions-League-Sieger.',
    'Unsere Buchhaltung kennt nur Haben.',
    'Niemand weiß, woher das Geld kommt. Aber der Hallenausbau kann weitergehen.'
  ];

  // Ereigniskarten: Optionen mit Effekten (cash, mor = Moral, fans = Fanbasis-%, rep)
  D.events = [
    { t: 'Die Mannschaft beschwert sich über das Essen.', o: [
      { l: 'Neuen Koch einstellen', cash: -8000, mor: 6 }, { l: 'Beschwerde ignorieren', mor: -6 }, { l: 'Gemeinsamen Pizzaabend organisieren', cash: -400, mor: 3 }] },
    { t: 'Ein Sponsor beschwert sich, dass sein Logo im TV kaum zu sehen ist.', o: [
      { l: 'Größere Bandenwerbung spendieren', cash: -6000, rep: 1 }, { l: 'Sponsor vertrösten', cash: -15000, chance: 0.4, alt: 'Der Sponsor kürzt seine Zahlung.' }, { l: 'Logo zusätzlich auf den Hallenboden kleben', cash: -500 }] },
    { t: 'Fans protestieren lautstark gegen die Ticketpreise.', o: [
      { l: 'Freibier beim nächsten Heimspiel', cash: -3000, fans: 1, mor: 1 }, { l: 'Preise verteidigen', fans: -2 }, { l: 'Offenen Fanabend veranstalten', cash: -800, fans: 0.5 }] },
    { t: 'Ein anonymer Gönner möchte dem Verein Geld spenden – unter der Bedingung, dass das Maskottchen umbenannt wird in „Herr Knausrig“.', o: [
      { l: 'Annehmen', cash: 25000, fans: -0.5 }, { l: 'Ablehnen', rep: 1 }] },
    { t: 'Der Bauleiter meldet: Auf der Baustelle wurde ein alter Tresor gefunden.', o: [
      { l: 'Öffnen lassen', cash: 0, lottery: [[0.5, 12000, 'Im Tresor: alte Eintrittskarten und 12.000 € in bar!'], [0.5, -2000, 'Im Tresor: ein Wurstbrot von 1974. Der Schlüsseldienst kostet 2.000 €.']] },
      { l: 'Dem Museum schenken', rep: 1, fans: 0.3 }] },
    { t: 'Die Lokalzeitung kritisiert die Spielweise der Mannschaft als „Zeitlupen-Handball für Schlafwandler“.', o: [
      { l: 'Pressekonferenz geben', mor: 2 }, { l: 'Zeitung boykottieren', rep: -1, mor: 3 }, { l: 'Redakteur zum Training einladen', cash: -200, rep: 1 }] },
    { t: 'Ein Spieler möchte mit seiner Band in der Halbzeitpause auftreten.', o: [
      { l: 'Klar, Bühne frei!', mor: 4, fans: 0.3, chance: 0.3, alt: 'Der Auftritt war so schief, dass drei Zuschauer früher gingen.' }, { l: 'Lieber nicht', mor: -2 }] },
    { t: 'Ein Hersteller von Energydrinks bietet kostenlose Kisten für die Kabine an.', o: [
      { l: 'Annehmen', mor: 2, cash: 2000 }, { l: 'Ablehnen – nur Leitungswasser!', mor: -1 }] },
    { t: 'Die Stadt fragt, ob der Verein beim Stadtfest einen Stand betreibt.', o: [
      { l: 'Ja, mit Siebenmeterwerfen', cash: 1500, fans: 0.8 }, { l: 'Keine Zeit', fans: -0.3 }] },
    { t: 'Der Zeugwart hat versehentlich alle Trikots bei 90 °C gewaschen.', o: [
      { l: 'Neue Trikots bestellen', cash: -4000 }, { l: 'Bauchfrei spielen', mor: -3, fans: 0.5 }] },
    { t: 'Ein Influencer will ein Video in der Halle drehen.', o: [
      { l: 'Gegen Gebühr erlauben', cash: 3500, rep: 0 }, { l: 'Kostenlos erlauben', fans: 1 }, { l: 'Ablehnen' }] },
    { t: 'Ein Wasserrohrbruch hat über Nacht den Hallenboden geflutet.', o: [
      { l: 'Notdienst rufen', cash: -2500 }, { l: 'Wasserball-Training ansetzen', fans: 0.8, mor: -1 }] },
    { t: 'Ein Talent aus der Kreisliga hat beim Probetraining überzeugt.', o: [
      { l: 'Sofort in die Jugend holen', cash: -1500, youth: true }, { l: 'Kein Interesse' }] }
  ];
  D.chaosEvents = [
    { t: 'Ein Heißluftballon ist auf dem Hallendach gelandet. Der Pilot will nicht mehr weg.', o: [
      { l: 'Als Co-Trainer einstellen', cash: -2000, mor: 4 }, { l: 'Ballon versteigern', cash: 4500 }] },
    { t: 'Das Vereinsmaskottchen ist mit der Mannschaftskasse durchgebrannt.', o: [
      { l: 'Privatdetektiv beauftragen', cash: -3000, lottery: [[0.5, 15000, 'Gefunden! Das Maskottchen saß in einer Eisdiele.'], [0.5, 0, 'Spurlos verschwunden.']] }, { l: 'Neues Maskottchen casten', cash: -6000, fans: 0.5 }] },
    { t: 'Ein Wahrsager prophezeit dem Verein eine glorreiche Zukunft – gegen Gebühr.', o: [
      { l: 'Bezahlen', cash: -5000, mor: 5 }, { l: 'Vom Gelände jagen', mor: -2 }] }
  ];

  D.speeches = [
    { id: 'normal', t: '„Spielt einfach euren Handball!“', mot: 0.01 },
    { id: 'druck', t: '„Heute will ich zwei Punkte sehen!“', mot: 0.03, risk: true },
    { id: 'underdog', t: '„Wir sind Außenseiter, aber nicht chancenlos!“', mot: 0.02, underdog: true },
    { id: 'derby', t: '„Das ist ein Derby. Gebt alles!“', mot: 0.04, derby: true }
  ];
  D.halftimeTalks = [
    { id: 'lob', t: 'Loben', mot: 0.02 }, { id: 'kritik', t: 'Kritisieren', mot: 0.03, risk: true },
    { id: 'ruhe', t: 'Beruhigen', mot: 0.01 }, { id: 'motiv', t: 'Motivieren', mot: 0.025 }
  ];

  D.achievements = {
    firstWin: ['Erster Sieg', 'Gewinne dein erstes Pflichtspiel.'],
    promotion: ['Aufstiegsheld', 'Steige in eine höhere Liga auf.'],
    champion: ['Meistermacher', 'Werde Deutscher Meister.'],
    cup: ['Pokalheld', 'Gewinne den Pokal.'],
    transfer: ['Transferfuchs', 'Verkaufe einen Spieler für mehr als das Doppelte seines Kaufpreises.'],
    youth: ['Nachwuchskönig', 'Setze fünf selbst ausgebildete Spieler in einem Spiel ein.'],
    stadium: ['Hallenmogul', 'Erreiche eine Hallenkapazität von 10.000 Plätzen.'],
    stocks: ['Börsenguru', 'Erziele 100.000 € Gewinn mit Aktien oder Krypto.'],
    millionaire: ['Vereinsmillionär', 'Habe 5 Mio. € auf dem Konto.'],
    bankdirector: ['Der Bankdirektor kennt mich persönlich', 'Finde den geheimen Buchhaltungskeller.'],
    clinic: ['Chefarzt', 'Baue die Vereins-Privatklinik.'],
    ubahn: ['Nächster Halt: Arena', 'Baue den eigenen U-Bahnhof an der Arena.'],
    seasons10: ['Urgestein', 'Spiele zehn Saisons.']
  };

  D.headlinesWin = ['{W} SIEGT {S} – {T} SPRICHT VON CHARAKTERTEST', '{W} LÄSST {L} KEINE CHANCE', 'VERDIENTER {S}-ERFOLG FÜR {W}', '{W} JUBELT – {L} RATLOS', 'GALA VON {W}! {L} GEHT UNTER'];
  D.headlinesDraw = ['PUNKTETEILUNG ZWISCHEN {H} UND {A}', 'REMIS! {H} UND {A} TRENNEN SICH {S}', 'KEIN SIEGER IM DUELL {H} GEGEN {A}'];
  D.headlinesLate = ['{W} SIEGT IN LETZTER SEKUNDE – TRAINER SPRICHT VON CHARAKTERTEST', 'DRAMA! {W} TRIFFT MIT DER SCHLUSSSIRENE'];
})(RFM);
