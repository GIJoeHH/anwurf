// ANWURF! – Europapokal: Vereine, Final-4-Orte und Prämien
// Meister-Liga (Plätze 1–4 der acht Länder) und Top-Liga (Plätze 5–8). Deutschland stellt die Vereine der eigenen 1. Liga.
// Halbfinale und Finale werden an einem Final-4-Wochenende an wechselnden Orten quer durch Europa gespielt.
// Vereinsnamen sind echte Namen; Vereinslogos werden NICHT mitgeliefert, sondern wie die Sponsorenlogos auf dem
// jeweiligen Gerät aus Wikidata/Wikimedia Commons geladen (js/logos.js). Ohne geladenes Logo zeigt das Spiel ein neutrales Wappen.
// Spalten je Verein: Name, Kurzname, Stadt, Farbe 1, Farbe 2, Stärke (0 = Mittelfeld der 1. Liga, 1 = deutsche Spitze), Fans, Wikipedia-Titel
(function (R) {
  var D = R.data, K = D.MONEY || 1;
  D.euro = {
    sport: 'handball',
    final4: true,
    home: { k: 'DE', n: 'Deutschland' },
    countries: [
      { k: 'FR', n: 'Frankreich', geo: [47.0, 2.5], clubs: [
        ['Paris Saint-Germain', 'Paris SG', 'Paris', '#004170', '#da291c', 1.0, 4000, 'Paris Saint-Germain (Handball)'],
        ['HBC Nantes', 'Nantes', 'Nantes', '#6f2c91', '#ffffff', 0.9, 5500, 'HBC Nantes'],
        ['Montpellier Handball', 'Montpellier', 'Montpellier', '#1b3f8b', '#f58220', 0.75, 3500, 'Montpellier Handball'],
        ['Fenix Toulouse', 'Toulouse', 'Toulouse', '#e4002b', '#111111', 0.3, 3000, 'Fenix Toulouse Handball'],
        ['USAM Nîmes', 'Nîmes', 'Nîmes', '#00843d', '#ffffff', 0.25, 3200, 'USAM Nîmes'],
        ['Chambéry Savoie', 'Chambéry', 'Chambéry', '#ffd100', '#111111', 0.25, 3800, 'Chambéry Savoie HB'],
        ['Pays d’Aix UC', 'Aix', 'Aix-en-Provence', '#111111', '#f7a600', 0.25, 3500, 'Pays d’Aix UC Handball'],
        ['Saint-Raphaël Var', 'St-Raphaël', 'Saint-Raphaël', '#005baa', '#ffffff', 0.2, 2200, 'Saint-Raphaël Var Handball']
      ] },
      { k: 'ES', n: 'Spanien', geo: [40.2, -3.6], clubs: [
        ['FC Barcelona', 'Barcelona', 'Barcelona', '#a50044', '#004d98', 1.15, 6500, 'FC Barcelona (Handball)'],
        ['Bidasoa Irún', 'Irún', 'Irún', '#ffd100', '#005baa', 0.25, 2200, 'CD Bidasoa'],
        ['BM Granollers', 'Granollers', 'Granollers', '#005baa', '#ffffff', 0.25, 3000, 'BM Granollers'],
        ['BM Logroño La Rioja', 'Logroño', 'Logroño', '#8a1538', '#ffffff', 0.15, 2600, 'CB Ciudad de Logroño'],
        ['Ademar León', 'León', 'León', '#ffffff', '#00843d', 0.15, 3500, 'Ademar León'],
        ['BM Torrelavega', 'Torrelavega', 'Torrelavega', '#e4002b', '#ffffff', 0.1, 2500, 'BM Torrelavega'],
        ['Helvetia Anaitasuna', 'Anaitasuna', 'Pamplona', '#00843d', '#ffffff', 0.0, 2500, 'SCDR Anaitasuna'],
        ['BM Cuenca', 'Cuenca', 'Cuenca', '#e4002b', '#111111', -0.1, 1800, 'BM Ciudad Encantada']
      ] },
      { k: 'DK', n: 'Dänemark', geo: [56.0, 9.6], clubs: [
        ['Aalborg Håndbold', 'Aalborg', 'Aalborg', '#e4002b', '#ffffff', 1.0, 5000, 'Aalborg Håndbold'],
        ['GOG', 'GOG', 'Gudme', '#ffd100', '#e4002b', 0.7, 2600, 'GOG (Handball)'],
        ['Skjern Håndbold', 'Skjern', 'Skjern', '#00843d', '#ffffff', 0.4, 2800, 'Skjern Håndbold'],
        ['Bjerringbro-Silkeborg', 'Silkeborg', 'Silkeborg', '#005baa', '#ffffff', 0.4, 2800, 'Bjerringbro-Silkeborg'],
        ['Fredericia HK', 'Fredericia', 'Fredericia', '#e4002b', '#ffffff', 0.4, 2300, 'Fredericia HK'],
        ['Mors-Thy Håndbold', 'Mors-Thy', 'Nykøbing Mors', '#005baa', '#ffd100', 0.25, 2000, 'Mors-Thy Håndbold'],
        ['SønderjyskE', 'Sønderjyske', 'Sønderborg', '#75b2dd', '#111111', 0.2, 2000, 'SønderjyskE Håndbold'],
        ['Ribe-Esbjerg HH', 'Esbjerg', 'Esbjerg', '#111111', '#ffd100', 0.2, 2400, 'Ribe-Esbjerg HH']
      ] },
      { k: 'HU', n: 'Ungarn', geo: [47.1, 19.0], clubs: [
        ['Veszprém KC', 'Veszprém', 'Veszprém', '#e4002b', '#ffffff', 1.05, 5000, 'KC Veszprém'],
        ['Pick Szeged', 'Szeged', 'Szeged', '#005baa', '#ffffff', 0.85, 6500, 'SC Szeged'],
        ['Tatabánya KC', 'Tatabánya', 'Tatabánya', '#005baa', '#ffffff', 0.25, 2500, 'Tatabánya KC'],
        ['Ferencváros Budapest', 'Ferencváros', 'Budapest', '#00843d', '#ffffff', 0.2, 2000, 'Ferencváros Budapest (Handball)'],
        ['Balatonfüredi KSE', 'Balatonfüred', 'Balatonfüred', '#ffd100', '#005baa', 0.1, 1500, 'Balatonfüredi KSE'],
        ['Csurgói KK', 'Csurgó', 'Csurgó', '#e4002b', '#005baa', 0.0, 1200, 'Csurgói KK'],
        ['Gyöngyösi KK', 'Gyöngyös', 'Gyöngyös', '#005baa', '#ffd100', -0.1, 1200, 'Gyöngyösi KK'],
        ['Dabas KC', 'Dabas', 'Dabas', '#005baa', '#ffffff', -0.2, 1000, 'Dabas KC']
      ] },
      { k: 'PL', n: 'Polen', geo: [52.0, 19.4], clubs: [
        ['KS Kielce', 'Kielce', 'Kielce', '#ffd100', '#005baa', 0.9, 4200, 'KS Kielce'],
        ['Wisła Płock', 'Płock', 'Płock', '#005baa', '#ffffff', 0.85, 5000, 'Wisła Płock (Handball)'],
        ['Górnik Zabrze', 'Zabrze', 'Zabrze', '#005baa', '#e4002b', 0.2, 2000, 'Górnik Zabrze (Handball)'],
        ['Azoty-Puławy', 'Puławy', 'Puławy', '#005baa', '#ffd100', 0.2, 2500, 'KS Azoty-Puławy'],
        ['Ostrovia Ostrów', 'Ostrów', 'Ostrów Wielkopolski', '#e4002b', '#ffffff', 0.1, 2500, 'KPR Ostrovia Ostrów Wielkopolski'],
        ['Wybrzeże Gdańsk', 'Gdańsk', 'Danzig', '#005baa', '#ffffff', 0.05, 2000, 'Wybrzeże Gdańsk'],
        ['Chrobry Głogów', 'Głogów', 'Głogów', '#ffd100', '#111111', 0.0, 1800, 'Chrobry Głogów (Handball)'],
        ['MKS Kalisz', 'Kalisz', 'Kalisz', '#005baa', '#ffd100', 0.0, 2500, 'MKS Kalisz']
      ] },
      { k: 'SE', n: 'Schweden', geo: [58.4, 14.6], clubs: [
        ['IK Sävehof', 'Sävehof', 'Partille', '#ffd100', '#111111', 0.45, 2500, 'IK Sävehof'],
        ['Ystads IF', 'Ystad', 'Ystad', '#ffffff', '#005baa', 0.4, 2500, 'Ystads IF'],
        ['IFK Kristianstad', 'Kristianstad', 'Kristianstad', '#f58220', '#ffffff', 0.4, 4500, 'IFK Kristianstad'],
        ['Hammarby IF', 'Hammarby', 'Stockholm', '#00843d', '#ffffff', 0.25, 1800, 'Hammarby IF HF'],
        ['Alingsås HK', 'Alingsås', 'Alingsås', '#e4002b', '#ffffff', 0.2, 1800, 'Alingsås HK'],
        ['HK Malmö', 'Malmö', 'Malmö', '#005baa', '#ffffff', 0.2, 2000, 'HK Malmö'],
        ['IFK Skövde', 'Skövde', 'Skövde', '#005baa', '#ffffff', 0.2, 2200, 'IFK Skövde'],
        ['Önnereds HK', 'Önnered', 'Göteborg', '#111111', '#ffd100', 0.1, 1500, 'Önnereds HK']
      ] },
      { k: 'PT', n: 'Portugal', geo: [39.6, -8.3], clubs: [
        ['Sporting Lissabon', 'Sporting', 'Lissabon', '#008057', '#ffffff', 0.85, 2500, 'Sporting Lissabon (Handball)'],
        ['FC Porto', 'Porto', 'Porto', '#00428c', '#ffffff', 0.6, 2000, 'FC Porto (Handball)'],
        ['Benfica Lissabon', 'Benfica', 'Lissabon', '#e83030', '#ffffff', 0.55, 2000, 'Benfica Lissabon (Handball)'],
        ['ABC Braga', 'Braga', 'Braga', '#ffd100', '#111111', 0.15, 1500, 'ABC Braga'],
        ['Águas Santas', 'Águas Santas', 'Maia', '#005baa', '#ffffff', 0.05, 1000, 'Águas Santas'],
        ['Marítimo Funchal', 'Marítimo', 'Funchal', '#00843d', '#e4002b', -0.05, 1000, 'CS Marítimo'],
        ['Belenenses Lissabon', 'Belenenses', 'Lissabon', '#005baa', '#ffffff', -0.1, 1000, 'Belenenses Lissabon'],
        ['Póvoa AC', 'Póvoa', 'Póvoa de Varzim', '#005baa', '#ffd100', -0.15, 900, 'Póvoa Andebol Clube']
      ] }
    ],
    // Wechselnde Final-4-Orte quer durch Europa (Name, Stadt, Land, Plätze)
    venues: [
      ['Lanxess Arena', 'Köln', 'Deutschland', 19750], ['MVM Dome', 'Budapest', 'Ungarn', 20000], ['Accor Arena', 'Paris', 'Frankreich', 15600],
      ['Royal Arena', 'Kopenhagen', 'Dänemark', 12500], ['Palau Sant Jordi', 'Barcelona', 'Spanien', 16500], ['Tauron Arena', 'Krakau', 'Polen', 15000],
      ['Scandinavium', 'Göteborg', 'Schweden', 12000], ['MEO Arena', 'Lissabon', 'Portugal', 12500], ['Barclays Arena', 'Hamburg', 'Deutschland', 13000],
      ['Jyske Bank Boxen', 'Herning', 'Dänemark', 15000], ['Wiener Stadthalle', 'Wien', 'Österreich', 11000], ['Arena Zagreb', 'Zagreb', 'Kroatien', 15200],
      ['Atlas Arena', 'Łódź', 'Polen', 13800], ['Telenor Arena', 'Oslo', 'Norwegen', 15000], ['ZAG-Arena', 'Hannover', 'Deutschland', 10700],
      ['WiZink Center', 'Madrid', 'Spanien', 15000]
    ],
    cupVenue: ['Lanxess Arena', 'Köln', 'Deutschland', 19750], // Final 4 im deutschen Pokal
    gatePerSeat: 14,
    prize: {
      ml: { start: 150000, win: 25000, draw: 10000, ko: [50000, 80000, 120000, 150000], title: 250000 },
      tl: { start: 50000, win: 10000, draw: 4000, ko: [15000, 25000, 40000, 60000], title: 100000 }
    },
    // Schnellergebnis für Spiele ohne eigene Beteiligung
    quick: function (sh, sa, neutral) {
      var d = (sh - sa) * 0.84 + (neutral ? 0 : 1.3), base = R.gauss(30, 2.4);
      return { hg: Math.max(14, Math.round(base + d / 2 + R.gauss(0, 2.6))), ag: Math.max(14, Math.round(base - d / 2 + R.gauss(0, 2.6))) };
    },
    shootout: function () { var a = R.randInt(3, 5), b = R.randInt(2, 4); if (a === b) a++; return R.chance(0.5) ? [a, b] : [b, a]; },
    shootoutText: 'n. 7m'
  };
})(RFM);
