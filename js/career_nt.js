// Nationalmannschaft 2.0 – die zweite Karriere des eigenen Spielers (gemeinsam für ANPFIFF und ANWURF).
// Nationalteams entstehen wie die Europapokal-Gegner als echte Kader (nicht gespeichert, je Saison deterministisch
// erzeugt). Länderspiele laufen über dieselbe Match-Engine (und interaktiv über das Matchcenter der Spielerkarriere).
// Kalender: Abstellungsfenster unter der Woche in der Saison (Qualifikation/Nations Cup/Testspiele), große Turniere
// in der Sommervorbereitung (Fußball: EM/WM; Handball: Olympia) bzw. in der Winterpause (Handball: EM/WM im Januar).
// Nominierung nach Form, Liga, Einsatzzeit, Konkurrenz auf der Position, Trainervertrauen, Länderspielbilanz und
// Potenzial – nie automatisch nach Gesamtstärke. Prämien werden je Bedingung genau einmal gebucht.
(function (R) {
  var X = R.cx, C = R.pc, W = R.world, M = R.match, S = R.season, D = R.data, L = R.life;
  if (!X || !C || !M || !S || !W) return;
  var HB = X.HB, clamp = X.clamp;
  var NT = R.nt = {};
  function tick(st) { return st.tick || 0; }
  function ch(p) { return R.rand() < p; }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function isolated(seed, fn) { var keep = R.rng.state; R.rng.state = (seed >>> 0) || 1; try { return fn(); } finally { R.rng.state = keep; } }
  function money(v) { return R.fmtMoney ? R.fmtMoney(v) : Math.round(v) + ' €'; }
  function pick(a) { return a[Math.floor(R.rand() * a.length)]; }

  // ---------- Nationen ----------
  // [Kürzel, Name, Stärke 0–1, Kontinent, Namenspool]
  var FBN = [['DE', 'Deutschland', .87, 'EU', 'de'], ['FR', 'Frankreich', .93, 'EU', 'fr'], ['ES', 'Spanien', .92, 'EU', 'es'], ['EN', 'England', .91, 'EU', 'en'], ['PT', 'Portugal', .88, 'EU', 'pt'],
    ['NL', 'Niederlande', .85, 'EU', 'nl'], ['IT', 'Italien', .85, 'EU', 'it'], ['BE', 'Belgien', .81, 'EU', 'nl'], ['HR', 'Kroatien', .8, 'EU', 'bal'], ['DK', 'Dänemark', .75, 'EU', 'nor'], ['CH', 'Schweiz', .73, 'EU', 'de'],
    ['AT', 'Österreich', .72, 'EU', 'de'], ['TR', 'Türkei', .7, 'EU', 'tr'], ['PL', 'Polen', .66, 'EU', 'sla'], ['RS', 'Serbien', .66, 'EU', 'bal'], ['SE', 'Schweden', .66, 'EU', 'nor'], ['NO', 'Norwegen', .66, 'EU', 'nor'],
    ['UA', 'Ukraine', .64, 'EU', 'sla'], ['CZ', 'Tschechien', .63, 'EU', 'sla'], ['HU', 'Ungarn', .62, 'EU', 'hu'], ['SC', 'Schottland', .58, 'EU', 'en'], ['GR', 'Griechenland', .56, 'EU', 'gr'], ['RO', 'Rumänien', .56, 'EU', 'ro'],
    ['SK', 'Slowakei', .54, 'EU', 'sla'], ['WA', 'Wales', .54, 'EU', 'en'], ['SI', 'Slowenien', .52, 'EU', 'bal'], ['IE', 'Irland', .52, 'EU', 'en'], ['AL', 'Albanien', .48, 'EU', 'bal'], ['FI', 'Finnland', .46, 'EU', 'nor'], ['IS', 'Island', .45, 'EU', 'nor'],
    ['BR', 'Brasilien', .91, 'SA', 'pt'], ['AR', 'Argentinien', .92, 'SA', 'es'], ['UY', 'Uruguay', .77, 'SA', 'es'], ['CO', 'Kolumbien', .75, 'SA', 'es'], ['EC', 'Ecuador', .66, 'SA', 'es'],
    ['US', 'USA', .7, 'NA', 'en'], ['MX', 'Mexiko', .68, 'NA', 'es'], ['CA', 'Kanada', .62, 'NA', 'en'], ['JP', 'Japan', .72, 'AS', 'jp'], ['KR', 'Südkorea', .67, 'AS', 'kr'], ['IR', 'Iran', .62, 'AS', 'ar'], ['AU', 'Australien', .6, 'AS', 'en'], ['SA', 'Saudi-Arabien', .55, 'AS', 'ar'],
    ['MA', 'Marokko', .77, 'AF', 'ar'], ['SN', 'Senegal', .73, 'AF', 'fr'], ['CI', 'Elfenbeinküste', .66, 'AF', 'fr'], ['NG', 'Nigeria', .64, 'AF', 'en'], ['EG', 'Ägypten', .6, 'AF', 'ar']];
  var HBN = [['DK', 'Dänemark', .94, 'EU', 'nor'], ['FR', 'Frankreich', .93, 'EU', 'fr'], ['DE', 'Deutschland', .88, 'EU', 'de'], ['ES', 'Spanien', .86, 'EU', 'es'], ['SE', 'Schweden', .86, 'EU', 'nor'], ['NO', 'Norwegen', .85, 'EU', 'nor'],
    ['HR', 'Kroatien', .84, 'EU', 'bal'], ['PT', 'Portugal', .8, 'EU', 'pt'], ['HU', 'Ungarn', .78, 'EU', 'hu'], ['IS', 'Island', .76, 'EU', 'nor'], ['SI', 'Slowenien', .74, 'EU', 'bal'], ['AT', 'Österreich', .7, 'EU', 'de'],
    ['NL', 'Niederlande', .68, 'EU', 'nl'], ['PL', 'Polen', .66, 'EU', 'sla'], ['CH', 'Schweiz', .66, 'EU', 'de'], ['CZ', 'Tschechien', .64, 'EU', 'sla'], ['RS', 'Serbien', .64, 'EU', 'bal'], ['MK', 'Nordmazedonien', .62, 'EU', 'bal'],
    ['ME', 'Montenegro', .58, 'EU', 'bal'], ['IT', 'Italien', .58, 'EU', 'it'], ['FO', 'Färöer', .56, 'EU', 'nor'], ['RO', 'Rumänien', .55, 'EU', 'ro'], ['BA', 'Bosnien-Herzegowina', .55, 'EU', 'bal'], ['SK', 'Slowakei', .54, 'EU', 'sla'],
    ['UA', 'Ukraine', .52, 'EU', 'sla'], ['GR', 'Griechenland', .5, 'EU', 'gr'], ['LT', 'Litauen', .46, 'EU', 'sla'], ['BE', 'Belgien', .45, 'EU', 'nl'], ['TR', 'Türkei', .44, 'EU', 'tr'],
    ['EG', 'Ägypten', .72, 'AF', 'ar'], ['TN', 'Tunesien', .58, 'AF', 'ar'], ['DZ', 'Algerien', .5, 'AF', 'ar'], ['BR', 'Brasilien', .6, 'SA', 'pt'], ['AR', 'Argentinien', .56, 'SA', 'es'], ['CL', 'Chile', .45, 'SA', 'es'],
    ['QA', 'Katar', .56, 'AS', 'ar'], ['JP', 'Japan', .52, 'AS', 'jp'], ['BH', 'Bahrain', .5, 'AS', 'ar'], ['KR', 'Südkorea', .48, 'AS', 'kr'], ['US', 'USA', .4, 'NA', 'en']];
  NT.NATIONS = (HB ? HBN : FBN).map(function (r) { return { code: r[0], name: r[1], q: r[2], conf: r[3], pool: r[4] }; });
  // Trikotfarben je Nation (neutral erzeugt, keine Verbandslogos)
  var PAL = [['#f8fafc', '#111827'], ['#1d4ed8', '#f8fafc'], ['#dc2626', '#f8fafc'], ['#f97316', '#111827'], ['#16a34a', '#f8fafc'], ['#facc15', '#1e3a8a'], ['#7c3aed', '#f8fafc'], ['#0ea5e9', '#f8fafc'], ['#111827', '#facc15'], ['#b91c1c', '#facc15'], ['#065f46', '#fde68a'], ['#be123c', '#f8fafc']];
  NT.colors = function (code) { return PAL[hash('col' + code) % PAL.length]; };
  // ---------- Länderflaggen (vereinfachte, selbst gezeichnete Nationalflaggen als SVG – keine Verbandswappen) ----------
  var FLAG = (function () {
    var W_ = 30, H_ = 20;
    function r(x, y, w, h, c) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>'; }
    function Hs(cols, wts) { wts = wts || cols.map(function () { return 1; }); var t = wts.reduce(function (a, b) { return a + b; }, 0), y = 0; return cols.map(function (c, i) { var h = H_ * wts[i] / t, o = r(0, y, W_, h + 0.05, c); y += h; return o; }).join(''); }
    function Vs(cols, wts) { wts = wts || cols.map(function () { return 1; }); var t = wts.reduce(function (a, b) { return a + b; }, 0), x = 0; return cols.map(function (c, i) { var w = W_ * wts[i] / t, o = r(x, 0, w + 0.05, H_, c); x += w; return o; }).join(''); }
    function NC(bg, cr, inn) { return r(0, 0, W_, H_, bg) + r(8, 0, 5, H_, cr) + r(0, 7.5, W_, 5, cr) + (inn ? r(9.5, 0, 2, H_, inn) + r(0, 9, W_, 2, inn) : ''); }
    function star(cx, cy, R, c, rot) { var p = [], i, a; rot = rot || -90; for (i = 0; i < 10; i++) { a = (rot + i * 36) * Math.PI / 180; var rr = i % 2 ? R * 0.42 : R; p.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2)); } return '<polygon points="' + p.join(' ') + '" fill="' + c + '"/>'; }
    function circ(cx, cy, R, c) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="' + c + '"/>'; }
    function cres(cx, cy, R, c, bg, dx) { return circ(cx, cy, R, c) + circ(cx + (dx || R * 0.3), cy, R * 0.8, bg); }
    function stripes(n, a, b) { var h = H_ / n, o = ''; for (var i = 0; i < n; i++) o += r(0, i * h, W_, h + 0.05, i % 2 ? b : a); return o; }
    function serr(bg, c) { var o = r(0, 0, W_, H_, bg) + r(0, 0, 8, H_, '#fff'), p = ['8,0'], n = 9, h = H_ / n; for (var i = 0; i < n; i++) { p.push('11,' + (i * h + h / 2).toFixed(2)); p.push('8,' + ((i + 1) * h).toFixed(2)); } return o + '<polygon points="' + p.join(' ') + ' 8,20 8,0" fill="#fff"/>'; }
    var red = '#d52b1e';
    var D = {
      DE: Hs(['#000', '#dd0000', '#ffce00']), FR: Vs(['#002395', '#fff', '#ed2939']), ES: Hs(['#aa151b', '#f1bf00', '#aa151b'], [1, 2, 1]),
      EN: r(0, 0, 30, 20, '#fff') + r(12.5, 0, 5, 20, '#ce1124') + r(0, 7.5, 30, 5, '#ce1124'),
      PT: Vs(['#006600', '#ff0000'], [2, 3]) + circ(12, 10, 4, '#ffcc00') + circ(12, 10, 2.4, '#ff0000'),
      NL: Hs(['#ae1c28', '#fff', '#21468b']), IT: Vs(['#009246', '#fff', '#ce2b37']), BE: Vs(['#000', '#fae042', '#ed2939']),
      HR: Hs(['#ff0000', '#fff', '#171796']) + r(12, 5, 6, 7, '#fff') + r(12, 5, 2, 2, '#ff0000') + r(16, 5, 2, 2, '#ff0000') + r(14, 7, 2, 2, '#ff0000') + r(12, 9, 2, 2, '#ff0000') + r(16, 9, 2, 2, '#ff0000') + r(14, 11, 2, 1, '#ff0000'),
      DK: NC('#c8102e', '#fff'), CH: r(0, 0, 30, 20, '#da291c') + r(13, 4, 4, 12, '#fff') + r(9, 8, 12, 4, '#fff'),
      AT: Hs(['#ed2939', '#fff', '#ed2939']), TR: r(0, 0, 30, 20, '#e30a17') + cres(11, 10, 5, '#fff', '#e30a17', 1.3) + star(18, 10, 2.4, '#fff', 0),
      PL: Hs(['#fff', '#dc143c']), RS: Hs(['#c6363c', '#0c4076', '#fff']), SE: NC('#006aa7', '#fecc00'), NO: NC('#ba0c2f', '#fff', '#00205b'),
      UA: Hs(['#0057b7', '#ffd700']), CZ: Hs(['#fff', '#d7141a']) + '<polygon points="0,0 15,10 0,20" fill="#11457e"/>', HU: Hs(['#ce2939', '#fff', '#477050']),
      SC: r(0, 0, 30, 20, '#005eb8') + '<path d="M0,0 L30,20 M30,0 L0,20" stroke="#fff" stroke-width="3.2"/>',
      GR: stripes(9, '#0d5eaf', '#fff') + r(0, 0, 11.1, 11.1, '#0d5eaf') + r(4.45, 0, 2.2, 11.1, '#fff') + r(0, 4.45, 11.1, 2.2, '#fff'),
      RO: Vs(['#002b7f', '#fcd116', '#ce1126']), SK: Hs(['#fff', '#0b4ea2', '#ee1c25']) + '<path d="M7,5 h7 v6 q0,4 -3.5,5.5 q-3.5,-1.5 -3.5,-5.5z" fill="#ee1c25" stroke="#fff" stroke-width=".6"/>' + r(10, 7, 1, 6, '#fff') + r(8.5, 8.5, 4, 1, '#fff'),
      WA: Hs(['#fff', '#00b140']) + '<path d="M8,13 q3,-6 8,-5 l3,-2 l1,2 l3,0 l-2,2 q1,4 -4,5 l2,2 l-3,0 l-2,-2 q-3,1 -6,-2z" fill="#d30731"/>',
      SI: Hs(['#fff', '#005da4', '#ed1c24']) + '<path d="M6,3.5 h6 v4 q0,3 -3,4 q-3,-1 -3,-4z" fill="#005da4" stroke="#ed1c24" stroke-width=".6"/>',
      IE: Vs(['#169b62', '#fff', '#ff883e']), AL: r(0, 0, 30, 20, '#e41e20') + '<path d="M15,4 l-6,-1 l3,4 l-4,1 l4,2 l-2,4 l4,-2 l1,4 l1,-4 l4,2 l-2,-4 l4,-2 l-4,-1 l3,-4z" fill="#000"/>',
      FI: NC('#fff', '#002f6c'), IS: NC('#02529c', '#fff', '#dc1e35'),
      BR: r(0, 0, 30, 20, '#009c3b') + '<polygon points="15,2.5 27,10 15,17.5 3,10" fill="#ffdf00"/>' + circ(15, 10, 4.2, '#002776') + '<path d="M11,9 q4,-1.5 8,1.2" stroke="#fff" stroke-width=".7" fill="none"/>',
      AR: Hs(['#74acdf', '#fff', '#74acdf']) + circ(15, 10, 2, '#f6b40e'),
      UY: stripes(9, '#fff', '#0038a8') + r(0, 0, 11, 11.1, '#fff') + circ(5.5, 5.5, 3, '#fcd116'),
      CO: Hs(['#fcd116', '#003893', '#ce1126'], [2, 1, 1]), EC: Hs(['#ffdd00', '#034ea2', '#ed1c24'], [2, 1, 1]) + circ(15, 9, 2.4, '#7a5c2e') + circ(15, 9, 1.4, '#6cace4'),
      US: stripes(13, '#b22234', '#fff') + r(0, 0, 12, 10.8, '#3c3b6e') + [2, 6, 10].map(function (x) { return [2.2, 5.4, 8.6].map(function (y) { return star(x, y, 1, '#fff'); }).join(''); }).join(''),
      MX: Vs(['#006847', '#fff', '#ce1126']) + circ(15, 10, 2.3, '#8c5a2b'),
      CA: Vs(['#d52b1e', '#fff', '#d52b1e'], [1, 2, 1]) + '<path d="M15,4 l1,2.5 l1.5,-.8 l-.5,3 l2,-1.5 l.5,1.3 l2,-.3 l-1,2 l1,.6 l-4,2.8 l.3,1.4 h-2.6 v2.5 h-.4 v-2.5 h-2.6 l.3,-1.4 l-4,-2.8 l1,-.6 l-1,-2 l2,.3 l.5,-1.3 l2,1.5 l-.5,-3 l1.5,.8z" fill="#d52b1e"/>',
      JP: r(0, 0, 30, 20, '#fff') + circ(15, 10, 6, '#bc002d'),
      KR: r(0, 0, 30, 20, '#fff') + '<path d="M10,10 a5,5 0 0 1 10,0z" fill="#cd2e3a"/><path d="M10,10 a5,5 0 0 0 10,0z" fill="#0047a0"/>' + circ(12.5, 10, 2.5, '#cd2e3a') + circ(17.5, 10, 2.5, '#0047a0') +
        [[3,3],[3,4.4],[23,15],[23,16.4],[23,3],[3,15]].map(function (q) { return r(q[0], q[1], 4, 0.8, '#000'); }).join(''),
      IR: Hs(['#239f40', '#fff', '#da0000']) + circ(15, 10, 1.8, '#da0000'),
      AU: r(0, 0, 30, 20, '#012169') + r(0, 0, 15, 10, '#012169') + '<path d="M0,0 L15,10 M15,0 L0,10" stroke="#fff" stroke-width="2"/><path d="M0,0 L15,10 M15,0 L0,10" stroke="#c8102e" stroke-width=".7"/>' + r(6, 0, 3, 10, '#fff') + r(0, 3.5, 15, 3, '#fff') + r(6.8, 0, 1.4, 10, '#c8102e') + r(0, 4.3, 15, 1.4, '#c8102e') + star(7.5, 15, 2, '#fff') + star(22, 5, 1.1, '#fff') + star(25, 9, 1.1, '#fff') + star(22, 16, 1.1, '#fff') + star(19, 10, 1.1, '#fff'),
      SA: r(0, 0, 30, 20, '#006c35') + '<path d="M8,8 h14" stroke="#fff" stroke-width="1.2"/><path d="M8,13 h13 l2,-1" stroke="#fff" stroke-width=".9" fill="none"/>',
      MA: r(0, 0, 30, 20, '#c1272d') + '<polygon points="15,5 16.5,13.5 9.2,8.3 20.8,8.3 13.5,13.5" fill="none" stroke="#006233" stroke-width=".9"/>',
      SN: Vs(['#00853f', '#fdef42', '#e31b23']) + star(15, 10, 2.6, '#00853f'), CI: Vs(['#f77f00', '#fff', '#009e60']), NG: Vs(['#008751', '#fff', '#008751']),
      EG: Hs(['#ce1126', '#fff', '#000']) + circ(15, 10, 1.6, '#c09300'),
      MK: r(0, 0, 30, 20, '#d20000') + '<path d="M0,0 L30,20 M30,0 L0,20 M15,0 V20 M0,10 H30" stroke="#ffe600" stroke-width="2.2"/>' + circ(15, 10, 3.2, '#ffe600') + circ(15, 10, 2.4, '#ffe600'),
      ME: r(0, 0, 30, 20, '#c40308') + '<rect x="1" y="1" width="28" height="18" fill="none" stroke="#d4af3a" stroke-width="1.2"/>' + '<path d="M15,5 l-4,-1 l2,4 l-3,1 l4,2 l1,4 l1,-4 l4,-2 l-3,-1 l2,-4z" fill="#d4af3a"/>',
      FO: NC('#fff', '#0065bd', '#ef303e'),
      BA: r(0, 0, 30, 20, '#002395') + '<polygon points="9,0 23,0 23,14" fill="#fecb00"/>' + [0, 1, 2, 3, 4, 5].map(function (i) { return star(7 + i * 2.6, 1.5 + i * 2.6, 1, '#fff'); }).join(''),
      LT: Hs(['#fdb913', '#006a44', '#c1272d']),
      TN: r(0, 0, 30, 20, '#e70013') + circ(15, 10, 5, '#fff') + cres(15, 10, 3.6, '#e70013', '#fff', 1) + star(16.3, 10, 1.7, '#e70013', 0),
      DZ: Vs(['#006233', '#fff']) + cres(15, 10, 4.2, '#d21034', '#fff', 1.2) + star(16.8, 10, 1.9, '#d21034', 0),
      CL: Hs(['#fff', '#d52b1e']) + r(0, 0, 10, 10, '#0039a6') + star(5, 5, 2.4, '#fff'),
      QA: serr('#8a1538'), BH: serr('#ce1126')
    };
    return function (code) { return D[code] || null; };
  })();
  NT.flagSvg = function (code, w) { var b = FLAG(String(code || '').split(' ')[0]); if (!b) return ''; return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"' + (w ? ' width="' + w + '" height="' + Math.round(w * 2 / 3) + '"' : '') + ' preserveAspectRatio="xMidYMid slice">' + b + '</svg>'; };
  NT.flagUri = function (code) { var s = NT.flagSvg(code); return s ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) : null; };
  NT.nat = function (code) { return NT.NATIONS.filter(function (n) { return n.code === code; })[0] || null; };
  NT.byName = function (name) { return NT.NATIONS.filter(function (n) { return n.name === name; })[0] || null; };
  var POOLS = {
    de: ['Jonas,Leon,Luca,Felix,Niklas,Tim,Jan,Lukas,Paul,Julian,Florian,Moritz,Kai,Fabian,Simon', 'Müller,Schmidt,Wagner,Becker,Hoffmann,Koch,Richter,Wolf,Neumann,Krüger,Hartmann,Lange,Werner,Brandt,Vogel'],
    fr: ['Lucas,Hugo,Théo,Antoine,Mathieu,Julien,Florian,Adrien,Moussa,Benjamin,Nicolas,Rayan,Kevin,Bastien,Yanis', 'Martin,Bernard,Dubois,Moreau,Laurent,Girard,Roux,Fournier,Lambert,Bonnet,Mercier,Diallo,Camara,Faure,Blanc'],
    es: ['Pablo,Sergio,Álvaro,Dani,Marcos,Iker,Javi,Carlos,Raúl,Diego,Hugo,Mikel,Adrián,Rodrigo,Unai', 'García,Martínez,López,Sánchez,Navarro,Torres,Ruiz,Moreno,Vidal,Castro,Herrera,Ortega,Molina,Romero,Gil'],
    en: ['James,Harry,Jack,Oliver,Ben,Luke,Kyle,Declan,Mason,Reece,Jordan,Marcus,Callum,Conor,Aaron', 'Walker,Stones,Foster,Barnes,Hughes,Marsh,Cooper,Bennett,Parker,Reid,Shaw,Carter,Mills,Dawson,Evans'],
    pt: ['João,Rui,Diogo,Bruno,Bernardo,Gonçalo,Rafael,Nuno,Pedro,André,Tiago,Ricardo,Fábio,Vítor,Lucas', 'Silva,Santos,Ferreira,Pereira,Oliveira,Costa,Rodrigues,Martins,Sousa,Fernandes,Gomes,Lopes,Carvalho,Almeida,Ribeiro'],
    nl: ['Daan,Luuk,Sven,Jesper,Thijs,Bram,Stijn,Ruben,Jordy,Wout,Teun,Mats,Milan,Kevin,Arthur', 'de Jong,de Vries,van Dijk,Bakker,Janssen,Visser,Smit,Meijer,de Boer,Mulder,Peeters,Maes,Claes,Wouters,Dekker'],
    it: ['Marco,Luca,Andrea,Matteo,Federico,Nicolò,Alessandro,Davide,Lorenzo,Simone,Giacomo,Riccardo,Stefano,Antonio,Gianluca', 'Rossi,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Bruno,Gallo,Conti,Esposito,Ferri,Leone,Costa,Rinaldi'],
    nor: ['Mikkel,Magnus,Rasmus,Mads,Emil,Simon,Lasse,Jacob,Henrik,Kasper,Anders,Oscar,Hampus,Viktor,Aron', 'Hansen,Nielsen,Jensen,Pedersen,Andersson,Johansson,Larsen,Olsen,Eriksson,Lindberg,Berg,Holm,Dahl,Gunnarsson,Strand'],
    bal: ['Luka,Ivan,Marko,Nikola,Stefan,Domagoj,Filip,Dušan,Aleksandar,Mateo,Josip,Igor,Vuk,Andrej,Dino', 'Horvat,Kovač,Petrović,Jovanović,Babić,Marić,Novak,Perić,Ilić,Knežević,Božić,Pavlović,Vuković,Radić,Lukić'],
    sla: ['Michał,Piotr,Kamil,Tomáš,Jakub,Ondřej,Maciej,Adam,Dawid,Pavel,Andrij,Lukáš,Oleksandr,Martin,Patrik', 'Nowak,Kowalski,Novák,Svoboda,Dvořák,Wiśniewski,Kamiński,Horák,Shevchenko,Kovalenko,Zieliński,Král,Bondar,Mazur,Hrubý'],
    hu: ['Bence,Máté,Dominik,Ádám,Balázs,Péter,Zoltán,Dávid,Richárd,Patrik,Roland,Zsolt,Gergő,Miklós,Kristóf', 'Nagy,Kovács,Tóth,Szabó,Horváth,Varga,Kiss,Molnár,Németh,Farkas,Balogh,Papp,Takács,Juhász,Lakatos'],
    tr: ['Emre,Burak,Mert,Can,Kerem,Arda,Hakan,Ozan,Cenk,Yusuf,Okan,Barış,Serdar,Kaan,Efe', 'Yılmaz,Kaya,Demir,Şahin,Çelik,Yıldız,Aydın,Öztürk,Arslan,Doğan,Kılıç,Aslan,Koç,Kurt,Özdemir'],
    gr: ['Giorgos,Nikos,Kostas,Dimitris,Giannis,Christos,Vasilis,Thanasis,Panagiotis,Manolis', 'Papadopoulos,Georgiou,Nikolaou,Pappas,Vlachos,Oikonomou,Makris,Stavrou,Antoniou,Dimou'],
    ro: ['Andrei,Alexandru,Ionuț,Răzvan,Florin,Cristian,Mihai,Vlad,Bogdan,Darius', 'Popescu,Ionescu,Stan,Dumitru,Stoica,Munteanu,Rusu,Marin,Matei,Lazăr'],
    jp: ['Takumi,Daichi,Kaoru,Ritsu,Wataru,Hiroki,Kenta,Yuto,Shogo,Ayase', 'Tanaka,Suzuki,Takahashi,Watanabe,Ito,Nakamura,Kobayashi,Kato,Yamamoto,Sato'],
    kr: ['Min-jae,Heung-min,Jae-sung,Seung-ho,Ui-jo,Hee-chan,Kang-in,Woo-young,Ji-sung,Hyun-woo', 'Kim,Lee,Park,Choi,Jung,Kang,Cho,Yoon,Jang,Hwang'],
    ar: ['Mohamed,Ahmed,Youssef,Omar,Karim,Hakim,Ali,Hamza,Achraf,Sofiane,Ayoub,Mahmoud,Salem,Nayef,Reza', 'Ben Ali,Haddad,Mansour,Saleh,El Amrani,Hassan,Nasser,Karimi,Rahimi,Ziyech,Belkadi,Farouk,Taha,Mahrez,Aziz']
  };

  // ---------- Konfiguration (Sportart-spezifisch) ----------
  NT.CFG = HB ? {
    windows: [4, 9, 14, 21, 26, 31], squad: { TW: 2, AUS: 4, RUE: 7, KRS: 3 }, youth: ['U17', 'U19', 'U21'], youthAge: { U17: 17, U19: 19, U21: 21 },
    tours: { EM: { n: 'Europameisterschaft', teams: 24, conf: 'EU', when: 'winter' }, WM: { n: 'Weltmeisterschaft', teams: 24, quota: { EU: 14, AF: 3, SA: 3, AS: 3, NA: 1 }, when: 'winter' }, OL: { n: 'Olympische Spiele', teams: 12, quota: { EU: 7, AF: 1, SA: 2, AS: 2 }, when: 'summer' } },
    leagueName: 'Länderspiel-Serie'
  } : {
    windows: [4, 8, 12, 16, 21, 26, 30], squad: { TW: 3, ABW: 8, MIT: 8, STU: 4 }, youth: ['U15', 'U16', 'U17', 'U18', 'U19', 'U20', 'U21'], youthAge: { U15: 15, U16: 16, U17: 17, U18: 18, U19: 19, U20: 20, U21: 21 },
    tours: { EM: { n: 'Europameisterschaft', teams: 24, conf: 'EU', when: 'summer' }, WM: { n: 'Weltmeisterschaft', teams: 24, quota: { EU: 11, SA: 4, NA: 2, AS: 3, AF: 4 }, when: 'summer' } },
    leagueName: 'Nations Cup'
  };
  // Prämien (brutto) – Fußball und Handball bewusst in unterschiedlichen Größenordnungen; Faktor je Verband (Stärke)
  NT.PRIZE = HB ? { call: 400, cap: 300, win: 800, qual: 4000, tour: 2500, round: { R16: 3000, QF: 5000, SF: 9000, F: 14000, W: 30000 }, league: 1500 }
    : { call: 4000, cap: 3000, win: 9000, qual: 50000, tour: 30000, round: { R16: 40000, QF: 60000, SF: 100000, F: 150000, W: 250000 }, league: 20000 };
  NT.TAX = 0.42; // vereinfachte Abgaben auf Prämien
  NT.ROUND_N = { G1: '1. Gruppenspiel', G2: '2. Gruppenspiel', G3: '3. Gruppenspiel', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale', F: 'Finale' };
  NT.ROLES = ['Perspektivspieler', 'Reservespieler', 'Ergänzungsspieler', 'Einwechselspieler', 'Stammspieler', 'Leistungsträger', 'Führungsspieler', 'Kapitän'];
  var COACH_FIRST = ['Hans', 'Rudi', 'Joachim', 'Thomas', 'Ralf', 'Markus', 'Christian', 'Uwe', 'Matthias', 'Stefan', 'Bernd', 'Frank'];
  var COACH_LAST = ['Brehm', 'Kessler', 'Lindner', 'Albrecht', 'Hauser', 'Sommer', 'Reinhardt', 'Seidel', 'Kühn', 'Böhm', 'Graf', 'Engel'];
  NT.STYLES = { jung: 'setzt auf junge Spieler', erfahrung: 'vertraut erfahrenen Kräften', form: 'nominiert streng nach Form', system: 'sucht Spieler für sein System' };

  // ---------- Zustand ----------
  NT.ensure = function (st) {
    var pc = st.pc; if (!pc || !pc.cx) return null;
    if (!pc.nt) {
      var own = NT.byName((pc.cx.prof || {}).nat) || NT.byName('Deutschland');
      pc.nt = { v: 1, code: own.code, caps: 0, goals: 0, assists: 0, rsum: 0, starts: 0, capt: 0, pens: [0, 0], trust: 50, youth: {}, tours: [], titles: [], hist: [], paid: {}, ms: {},
        coach: null, people: null, cal: [], season: null, qual: null, tour: null, last: null, retired: null, status: 'none', role: '', watch: 0, absent: 0, streak: 0, critic: 0, bonus: 0, lastCall: null, prevQual: null };
      // Migration: alte Zählung „Berufungen“ als Länderspiele übernehmen
      if (pc.nat > 0) { pc.nt.caps = pc.nat; pc.nt.status = 'squad'; pc.nt.ms.first = { s: st.season, w: st.week }; }
    }
    var nt = pc.nt; if (!nt.coach) nt.coach = NT.newCoach(st);
    if (!nt.people) { var used = {}, mk = function (k) { var n, g = 0; do { n = NT.name(st, k + g); g++; } while ((used[n] || used[n.split(' ')[1]]) && g < 30); used[n] = 1; used[n.split(' ')[1]] = 1; return n; };
      nt.people = { capt: { name: mk('capt'), v: 55 }, rival: { name: mk('rival'), v: 45 }, friend: { name: mk('friend'), v: 60 }, talent: { name: mk('talent'), v: 50 } }; }
    if (nt.swap) { pc.trust = nt.swap.club; nt.swap = null; } // abgebrochenes Länderspiel (z. B. Neuladen) – Trainervertrauen zurücktauschen
    return nt;
  };
  NT.own = function (st) { return NT.nat(NT.ensure(st).code); };
  NT.name = function (st, salt) { var own = NT.own ? (st.pc.nt ? NT.nat(st.pc.nt.code) : null) : null, pl = POOLS[(own || {}).pool || 'de'] || POOLS.de; return isolated(hash(salt + ':' + st.season + ':' + R.rand()), function () { return pick(pl[0].split(',')) + ' ' + pick(pl[1].split(',')); }); };
  NT.newCoach = function (st) { var ks = Object.keys(NT.STYLES); return { name: pick(COACH_FIRST) + ' ' + pick(COACH_LAST), style: pick(ks), since: st.season, v: 50 }; };
  NT.stats = function (st) { var nt = NT.ensure(st); return { caps: nt.caps, goals: nt.goals, assists: nt.assists, avg: nt.caps ? nt.rsum / Math.max(1, nt.starts + (nt.caps - nt.starts)) : 0 }; };

  // ---------- Kalender ----------
  NT.slot = function (st) {
    if (st.phase === 'season') return 's' + (st.week + 1);
    if (st.phase === 'preseason') return 'p' + (st.prep || 1);
    if (st.phase === 'winter') return 'w' + (st.winter || 1);
    return null;
  };
  // Turnier in dieser Saison? FB: Sommer (Vorbereitung) in geraden Saisons (EM/WM im Wechsel); HB: jeden Winter (EM/WM), Olympia im Sommer alle 4 Jahre
  NT.tourFor = function (season, where) {
    if (HB) { if (where === 'winter') return season % 2 ? 'EM' : 'WM'; if (where === 'summer') return season % 4 === 0 ? 'OL' : null; return null; }
    if (where === 'summer') return season % 2 ? null : (season % 4 === 2 ? 'WM' : 'EM'); return null;
  };
  NT.ref = function (st) { // Bezugsstärke: Spitzenvereine der höchsten Liga
    var cache = NT._ref; if (cache && cache.s === st.season && cache.w === st.world) return cache.v;
    var l1 = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return c.league === 1 && !c.foreign && !c.nt; });
    var v = l1.length ? R.avg(l1.map(function (c) { return M.squadStrength(st, c); }).sort(function (a, b) { return b - a; }).slice(0, 4), function (x) { return x; }) : 70;
    NT._ref = { s: st.season, w: st.world, v: v }; return v;
  };
  NT.target = function (st, code, lvl) {
    var n = NT.nat(code) || { q: .6 }, ref = NT.ref(st), t = ref + (n.q - 0.8) * (HB ? 15 : 24);
    if (lvl && lvl !== 'A') { var a = NT.CFG.youthAge[lvl] || 21; t = t - (22 - a) * (HB ? 3.2 : 3.6) - 4; }
    return t;
  };
  // Nationalteam (Kader) erzeugen – nicht gespeichert, je Saison/Stufe gleich
  NT.teamId = function (code, lvl) { return 'nt_' + code + '_' + (lvl || 'A'); };
  NT.team = function (st, code, lvl) {
    lvl = lvl || 'A'; var id = NT.teamId(code, lvl), have = st.clubs[id]; if (have && have.ntSeason === st.season) { if (!have.crestImage && NT.flagUri(code)) have.crestImage = NT.flagUri(code); return have; }
    if (have) NT.drop(st, id);
    var nat = NT.nat(code) || { name: code, q: .6, pool: 'de' }, target = NT.target(st, code, lvl);
    var built = isolated(hash(id + ':' + st.season) ^ (st.seed || 1), function () {
      var tmp = { clubs: {}, players: {}, nextIds: {}, world: st.world, season: st.season, settings: st.settings, seed: st.seed, euroScratch: true };
      var col = NT.colors(code), club = W.makeClub(tmp, [nat.name + (lvl === 'A' ? '' : ' ' + lvl), nat.code + (lvl === 'A' ? '' : ' ' + lvl), nat.name, col[0], col[1], 1, 0.8, 50000], hash(code) % 40);
      W.genSquad(tmp, club, target);
      var s0 = M.squadStrength(tmp, club); if (Math.abs(s0 - target) > 0.6) { Object.keys(tmp.players).forEach(function (k) { var p = tmp.players[k]; D.attrKeys.forEach(function (a) { p.attr[a] = clamp(Math.round(p.attr[a] + (target - s0)), 1, 99); }); W.recalc(p); }); }
      var pl = POOLS[nat.pool] || POOLS.de, fn = pl[0].split(','), ln = pl[1].split(',');
      Object.keys(tmp.players).forEach(function (k) { var p = tmp.players[k]; p.first = pick(fn); p.last = pick(ln); if (lvl !== 'A') p.age = clamp((NT.CFG.youthAge[lvl] || 21) - R.randInt(0, 1), 15, 22); });
      return { club: club, tmp: tmp };
    });
    var club = built.club; if (NT.flagUri(code)) club.crestImage = NT.flagUri(code); var squad = Object.keys(built.tmp.players).map(function (k) { return built.tmp.players[k]; }).filter(function (p) { return !p.youth; });
    club.id = id; club.nt = code; club.ntLvl = lvl; club.ntSeason = st.season; club.foreign = true; club.league = 0; club.rivals = []; club.friends = []; club.country = code; club.countryName = nat.name; club.stadiumName = 'Nationalstadion';
    club.squadIds = squad.map(function (p, i) {
      p.id = id + 'p' + (i + 1); p.clubId = id; p.foreignClub = true; p.ntPseudo = true; p.homegrown = false; p.listed = false;
      Object.defineProperty(st.players, p.id, { enumerable: false, configurable: true, writable: true, value: p });
      return p.id;
    });
    // Bezugspersonen im eigenen Team tragen gleichbleibende Namen
    var nt = st.pc && st.pc.nt, me = C.player(st);
    if (nt && code === nt.code && lvl === 'A' && me) {
      var same = squad.filter(function (p) { return p.pos === me.pos; }).sort(function (a, b) { return b.ovr - a.ovr; }), rest = squad.slice().sort(function (a, b) { return b.ovr - a.ovr; });
      function nm(p, n) { if (p && n) { var i = n.indexOf(' '); p.first = n.slice(0, i); p.last = n.slice(i + 1); p.ntRole = 1; } }
      nm(same[0], nt.people.rival.name); nm(rest.filter(function (p) { return p !== same[0]; })[0], nt.people.capt.name);
      nm(rest.filter(function (p) { return p !== same[0] && p.age <= 23; })[0], nt.people.talent.name); nm(rest.filter(function (p) { return p !== same[0] && !p.ntRole; })[3], nt.people.friend.name);
    }
    Object.defineProperty(st.clubs, id, { enumerable: false, configurable: true, writable: true, value: club });
    return club;
  };
  // Nationalspieler kommen ausgeruht aus ihren Vereinen (Pseudokader erholen sich nicht im Wochenlauf)
  NT.refresh = function (st, club) { W.squad(st, club.id).forEach(function (p) { if (p.ntPseudo) { p.fitness = Math.max(p.fitness || 0, 94); p.inj = null; p.susp = 0; p.morale = clamp(p.morale || 60, 45, 80); p.form = clamp(p.form || 6, 5, 7.5); } }); };
  NT.drop = function (st, id) { var c = st.clubs[id]; if (c && c.squadIds) c.squadIds.forEach(function (pid) { delete st.players[pid]; }); delete st.clubs[id]; };

  // ---------- Saisonplanung ----------
  function conf(code) { return (NT.nat(code) || {}).conf || 'EU'; }
  function rankedOthers(st, filt, salt) { return isolated(hash(salt + st.season) ^ (st.seed || 1), function () { return NT.NATIONS.filter(filt).map(function (n) { return { n: n, v: n.q + R.gauss(0, 0.06) }; }).sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.n.code; }); }); }
  NT.drawGroup = function (st, own) { // Qualifikationsgruppe: eigenes Team + je ein Team aus drei Lostöpfen
    var eu = NT.NATIONS.filter(function (n) { return n.conf === conf(own) && n.code !== own; }).sort(function (a, b) { return b.q - a.q; }), k = Math.ceil(eu.length / 3);
    return isolated(hash('grp' + st.season + own) ^ (st.seed || 1), function () { return [own, pick(eu.slice(0, k)).code, pick(eu.slice(k, 2 * k)).code, pick(eu.slice(2 * k)).code]; });
  };
  function rr(g) { return [[g[0], g[1]], [g[2], g[3]], [g[0], g[2]], [g[3], g[1]], [g[3], g[0]], [g[1], g[2]], [g[1], g[0]], [g[3], g[2]], [g[2], g[0]], [g[1], g[3]], [g[0], g[3]], [g[2], g[1]]]; }
  NT.newSeason = function (st) {
    var nt = NT.ensure(st); if (!nt || nt.season === st.season) return nt;
    // Abschluss der Vorsaison: Qualifikationsergebnis sichern
    if (nt.qual && nt.qual.s !== st.season) { nt.prevQual = { s: nt.qual.s, tour: nt.qual.tour, ok: NT.qualOk(st, nt.qual), place: NT.qualPlace(nt.qual), playoff: nt.qual.playoff || null }; }
    nt.season = st.season; nt.cal = nt.cal.filter(function (e) { return false; }); nt.qual = null; nt.tour = nt.tour && !nt.tour.done ? nt.tour : null;
    var own = nt.code, W2 = NT.CFG.windows, next = NT.nextTour(st);
    // Qualifikation (bzw. Nations Cup) für das nächste Turnier
    var g = NT.drawGroup(st, own), q = { s: st.season, tour: next, group: g, tab: {}, fx: [], playoff: null };
    g.forEach(function (c) { q.tab[c] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    var pairs = rr(g).slice(0, 12); // 6 Spieltage à 2 Spiele
    for (var md = 0; md < 6; md++) {
      var wk = W2[md] || W2[W2.length - 1];
      [pairs[md * 2], pairs[md * 2 + 1]].forEach(function (pr) { q.fx.push({ md: md, slot: 's' + wk, h: pr[0], a: pr[1], res: null }); });
    }
    nt.qual = q;
    q.fx.forEach(function (f, i) { if (f.h === own || f.a === own) nt.cal.push({ key: st.season + '-q' + i, slot: f.slot, kind: next ? 'qual' : 'league', lvl: 'A', opp: f.h === own ? f.a : f.h, home: f.h === own, label: (next ? 'Qualifikation ' + NT.CFG.tours[next].n : NT.CFG.leagueName) + ' · ' + (f.md + 1) + '. Spieltag', qi: i, played: false }); });
    // übrige Fenster: Testspiele (FB 7. Fenster; ggf. Play-off)
    W2.slice(6).forEach(function (wk, i) { nt.cal.push({ key: st.season + '-f' + i, slot: 's' + wk, kind: 'friendly', lvl: 'A', opp: NT.friendlyOpp(st, i), home: i % 2 === 0, label: 'Testspiel', played: false }); });
    // Jugend: Testspiele in denselben Fenstern
    W2.forEach(function (wk, i) { nt.cal.push({ key: st.season + '-y' + i, slot: 's' + wk, kind: 'youth', lvl: 'Y', opp: NT.friendlyOpp(st, 10 + i), home: i % 2 === 1, label: 'Jugend-Länderspiel', played: false }); });
    // Turniere dieser Saison
    // Turniere dieser Saison: erst das Sommerturnier; das Winterturnier wird angelegt, sobald kein anderes mehr läuft
    var ks = NT.tourFor(st.season, 'summer'); if (ks) NT.setupTour(st, ks, 'summer'); else NT.winterTour(st);
    return nt;
  };
  NT.winterTour = function (st) {
    var nt = NT.ensure(st), k = NT.tourFor(st.season, 'winter'); if (!k) return null;
    if (nt.tour && nt.tour.s === st.season && nt.tour.where === 'winter') return nt.tour;
    if (nt.tour && !nt.tour.done) return null;
    return NT.setupTour(st, k, 'winter');
  };
  NT.nextTour = function (st) { // Turnier, für das in dieser Saison qualifiziert wird
    if (HB) return NT.tourFor(st.season + 1, 'winter');
    return NT.tourFor(st.season + 1, 'summer');
  };
  NT.friendlyOpp = function (st, i) { var own = NT.ensure(st).code, l = NT.NATIONS.filter(function (n) { return n.code !== own; }); return isolated(hash('fr' + st.season + i) ^ (st.seed || 1), function () { return pick(l).code; }); };
  NT.qualPlace = function (q) { var t = NT.table(q); return t.map(function (r) { return r.code; }).indexOf(q.group[0]) + 1; };
  NT.table = function (q) { return Object.keys(q.tab).map(function (k) { var r = q.tab[k]; return { code: k, p: r.p, w: r.w, d: r.d, l: r.l, gf: r.gf, ga: r.ga, pts: r.pts }; }).sort(function (a, b) { return (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf) || (a.code < b.code ? -1 : 1); }); };
  NT.qualOk = function (st, q) {
    if (!q || !q.tour) return false; var pl = NT.qualPlace(q), k = q.tour;
    if (q.playoff && q.playoff.res) return q.playoff.won;
    if (k === 'EM') return pl <= 2; if (k === 'WM') return pl === 1 || (HB && pl <= 2);
    return false;
  };

  // ---------- Turniere ----------
  NT.setupTour = function (st, k, where) {
    var nt = NT.ensure(st), cfg = NT.CFG.tours[k]; if (!cfg) return null;
    var own = nt.code, pq = nt.prevQual, ownIn;
    if (k === 'OL') ownIn = !!(nt.tours[0] && nt.tours[0].s >= st.season - 1 && ['W', 'F', 'SF'].indexOf(nt.tours[0].best) >= 0) || (pq && pq.place === 1 && NT.own(st).q >= 0.8);
    else if (pq && pq.tour === k) ownIn = pq.ok;
    else ownIn = rankedOthers(st, function (n) { return n.conf === conf(own); }, 'mig' + k).indexOf(own) < (k === 'EM' ? 14 : 6); // alter Spielstand ohne Qualifikation: nach Stärke
    var teams = [], quota = cfg.quota || {}; if (cfg.conf) quota[cfg.conf] = cfg.teams;
    if (ownIn) teams.push(own);
    Object.keys(quota).forEach(function (cf) { var need = quota[cf] - teams.filter(function (c) { return conf(c) === cf; }).length; rankedOthers(st, function (n) { return n.conf === cf && n.code !== own; }, k + cf).slice(0, Math.max(0, need)).forEach(function (c) { teams.push(c); }); });
    teams = teams.slice(0, cfg.teams);
    var ng = cfg.teams / 4, groups = []; var pots = teams.slice().sort(function (a, b) { return NT.nat(b).q - NT.nat(a).q; });
    isolated(hash('tg' + k + st.season) ^ (st.seed || 1), function () { for (var gi = 0; gi < ng; gi++) groups.push([]); for (var p = 0; p < 4; p++) { var pot = pots.slice(p * ng, (p + 1) * ng); pot.sort(function () { return R.rand() - 0.5; }); pot.forEach(function (c, i) { groups[i].push(c); }); } });
    var tab = {}; teams.forEach(function (c) { tab[c] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    var pre = where === 'winter' ? 'w' : 'p', slots = cfg.teams === 12 ? { G1: 1, G2: 1, G3: 2, QF: 2, SF: 3, F: 3 } : (where === 'winter' ? { G1: 1, G2: 1, G3: 2, R16: 2, QF: 3, SF: 4, F: 4 } : { G1: 1, G2: 1, G3: 2, R16: 2, QF: 3, SF: 3, F: 4 });
    var t = { k: k, s: st.season, name: cfg.n + ' ' + (st.season + (where === 'winter' ? 1 : 0)), where: where, teams: teams, groups: groups, tab: tab, rounds: [], own: ownIn, done: false, best: null, champ: null, slots: {}, squad: null };
    Object.keys(slots).forEach(function (r) { t.slots[r] = pre + slots[r]; });
    ['G1', 'G2', 'G3'].forEach(function (r, md) {
      var fx = []; groups.forEach(function (g) { var pr = [[[0, 1], [2, 3]], [[0, 2], [3, 1]], [[3, 0], [1, 2]]][md]; pr.forEach(function (x) { fx.push({ h: g[x[0]], a: g[x[1]], res: null }); }); });
      t.rounds.push({ r: r, slot: t.slots[r], fx: fx, done: false });
    });
    nt.tour = t;
    if (ownIn) NT.calTourRound(st, t, t.rounds[0]), NT.calTourRound(st, t, t.rounds[1]), NT.calTourRound(st, t, t.rounds[2]);
    return t;
  };
  NT.calTourRound = function (st, t, rd) {
    var nt = NT.ensure(st), own = nt.code;
    rd.fx.forEach(function (f, i) { if (f.h === own || f.a === own) nt.cal.push({ key: t.s + '-' + t.k + '-' + rd.r, slot: rd.slot, kind: 'tour', lvl: 'A', opp: f.h === own ? f.a : f.h, home: f.h === own, label: t.name + ' · ' + NT.ROUND_N[rd.r], tr: rd.r, fi: i, ko: rd.r.charAt(0) !== 'G', played: false }); });
  };
  NT.groupTable = function (t, g) { var q = { tab: {} }; g.forEach(function (c) { q.tab[c] = t.tab[c]; }); return NT.table(q); };
  NT.advance = function (st, t) { // nächste K.-o.-Runde aus beendeter Runde
    var last = t.rounds[t.rounds.length - 1]; if (!last.done) return null;
    var order = ['G3', 'R16', 'QF', 'SF', 'F'], nx = { G3: t.teams.length === 12 ? 'QF' : 'R16', R16: 'QF', QF: 'SF', SF: 'F' }[last.r];
    if (!nx) { t.done = true; NT.tourEnd(st, t); return null; }
    var adv = [];
    if (last.r === 'G3') {
      var tabs = t.groups.map(function (g) { return NT.groupTable(t, g); }), firsts = tabs.map(function (x) { return x[0].code; }), seconds = tabs.map(function (x) { return x[1].code; });
      var need = (nx === 'QF' ? 8 : 16) - firsts.length - seconds.length, thirds = tabs.map(function (x) { return x[2]; }).sort(function (a, b) { return (b.pts - a.pts) || ((b.gf - b.ga) - (a.gf - a.ga)) || (b.gf - a.gf); }).slice(0, need).map(function (x) { return x.code; });
      var pool = firsts.concat(seconds, thirds); var hi = pool.slice(0, pool.length / 2), lo = pool.slice(pool.length / 2).reverse();
      var fx = hi.map(function (c, i) { return { h: c, a: lo[i], res: null }; });
      t.out = t.teams.filter(function (c) { return pool.indexOf(c) < 0; });
      t.rounds.push({ r: nx, slot: t.slots[nx], fx: fx, done: false });
    } else {
      var win = last.fx.map(function (f) { return f.w; }), fx2 = []; for (var i = 0; i < win.length; i += 2) fx2.push({ h: win[i], a: win[i + 1], res: null });
      t.rounds.push({ r: nx, slot: t.slots[nx], fx: fx2, done: false });
    }
    var rd = t.rounds[t.rounds.length - 1], own = NT.ensure(st).code;
    if (t.own && rd.fx.some(function (f) { return f.h === own || f.a === own; })) NT.calTourRound(st, t, rd);
    return rd;
  };
  NT.tourEnd = function (st, t) {
    var nt = NT.ensure(st), own = nt.code, fin = t.rounds[t.rounds.length - 1]; t.champ = fin.fx[0] && fin.fx[0].w;
    if (!t.own) { NT.news(st, t.name + ': ' + (NT.nat(t.champ) || {}).name + ' gewinnt den Titel', NT.own(st).name + ' war nicht qualifiziert.'); return; }
    var best = 'G'; t.rounds.forEach(function (rd) { if (rd.fx.some(function (f) { return f.h === own || f.a === own; })) best = rd.r; });
    if (t.champ === own) best = 'W';
    t.best = best; var me = t.squad && t.squad.inSq;
    nt.tours.unshift({ s: t.s, name: t.name, best: best, inSq: !!me, apps: t.apps || 0, goals: t.goals || 0 });
    if (best === 'W' && me) { nt.titles.unshift({ s: t.s, name: t.name }); C.milestone(st, 'ntTitle' + t.s, 'Titel: ' + t.name + '!', 'Du bist ' + (t.k === 'WM' ? 'Weltmeister' : t.k === 'EM' ? 'Europameister' : 'Olympiasieger') + '!'); if (st.pc.titles) st.pc.titles.push(t.name); }
    var bn = { G: 'Vorrunde', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale', F: 'Finale', W: 'Titel' }[best];
    if (me) {
      X.chron(st, 'nati', best === 'W' ? '🏆' : best === 'F' ? '🥈' : '🦅', t.name, best === 'W' ? 'Titelgewinn mit ' + NT.own(st).name + '!' : 'Aus im ' + bn + '.', best === 'W' || best === 'F' ? 3 : 2, best === 'W' ? 'nt_title' : 'nt_out');
      var key = 'tour' + t.s + t.k, P = NT.PRIZE, f = NT.fac(st), sum = P.tour; ['R16', 'QF', 'SF', 'F', 'W'].forEach(function (r) { if (NT.reached(best, r, t)) sum += P.round[r]; });
      NT.pay(st, key, sum * f * (NT.PRIZE_BONUS || 1), 'Turnierprämie ' + t.name + ' (' + bn + ')'); NT.PRIZE_BONUS = 1;
      C.addFame(st, best === 'W' ? 8 : best === 'F' ? 5 : best === 'SF' ? 3 : 1);
    }
    NT.news(st, t.name + ': ' + (best === 'W' ? NT.own(st).name + ' holt den Titel!' : NT.own(st).name + ' scheidet im ' + bn + ' aus'), 'Weltmeister bzw. Turniersieger: ' + (NT.nat(t.champ) || {}).name + '.');
    nt.last = { kind: 'tourEnd', best: best, s: t.s, k: t.k, inSq: !!me, t: tick(st) };
    NT.storyAfterTour(st, t, best, me);
    // Trainerwechsel nach Enttäuschung
    if ((best === 'G' || best === 'R16') && ch(0.45)) NT.changeCoach(st, 'nach dem frühen Turnier-Aus');
  };
  NT.reached = function (best, r, t) { var ord = ['G', 'R16', 'QF', 'SF', 'F', 'W']; if (t.teams.length === 12 && r === 'R16') return false; return ord.indexOf(best) >= ord.indexOf(r); };
  NT.changeCoach = function (st, why) { var nt = NT.ensure(st), old = nt.coach; nt.coach = NT.newCoach(st); nt.trust = clamp(45 + (nt.trust - 50) * 0.3, 20, 80); nt.coachChange = { t: tick(st), old: old.name, why: why }; NT.news(st, 'Neuer Nationaltrainer: ' + nt.coach.name, old.name + ' muss ' + why + ' gehen. ' + nt.coach.name + ' ' + NT.STYLES[nt.coach.style] + '.'); X.chron(st, 'nati', '🔄', 'Neuer Nationaltrainer', nt.coach.name + ' übernimmt (' + NT.STYLES[nt.coach.style] + ').', 2); };
  NT.storyAfterTour = function (st, t, best, me) { var nt = NT.ensure(st); nt.story = { k: 'tour', best: best, me: !!me, t: tick(st), name: t.name, final: best === 'F', won: best === 'W' }; };

  // ---------- Nominierung ----------
  NT.posSlots = function (pos) { return NT.CFG.squad[pos] || 3; };
  NT.starters = function (pos) { var f = D.formations && D.formations[HB ? Object.keys(D.formations)[0] : '4-4-2'] || null, n = 0; if (f) f.forEach(function (s) { if (s[0] === pos) n++; }); return n || (pos === 'TW' ? 1 : 2); };
  NT.eff = function (st, p, lvl) { // Nominierungswert – Leistung, nicht nur Gesamtstärke
    var nt = NT.ensure(st), pc = st.pc, c = C.club(st), lg = c ? c.league : 3, apps = p.stats ? p.stats.apps : 0, wk = st.phase === 'season' ? Math.max(1, st.week) : 34;
    var share = apps / (wk * 0.92), avgR = p.stats && p.stats.apps ? p.stats.rsum / p.stats.apps : (HB ? 7.2 : 6.6);
    var ls = (pc.seasons || [])[(pc.seasons || []).length - 1]; // Vorbereitung/Saisonstart: Leistung der Vorsaison zählt
    if (!(st.phase === 'season' && st.week > 5) && ls && !ls.youth) { var w2 = st.phase === 'season' ? st.week / 6 : 0; share = share * w2 + (ls.apps / 32) * (1 - w2); avgR = avgR * w2 + (ls.r || avgR) * (1 - w2); lg = ls.league || lg; }
    else if (!(st.phase === 'season' && st.week > 3)) share = 0.6;
    var rN = HB ? (avgR - 7.3) * 2.5 : (avgR - 6.6) * 3;
    var e = p.ovr + clamp(((p.form || 6) - 6) * 1.6, -5, 5) + clamp(rN, -4, 4) + (lg === 1 ? 0 : lg === 2 ? -2.5 : -6) + (share < 0.35 ? -4 : share < 0.6 ? -1.5 : share > 0.85 ? 1 : 0);
    e += clamp((nt.trust - 50) / 9, -4, 4);
    if (nt.caps >= 3) e += clamp((nt.rsum / nt.caps - (HB ? 7.2 : 6.6)) * 2, -3, 3);
    if (p.age <= 22) e += clamp(((p.pot || p.ovr) - p.ovr) / 6, 0, 3) * (nt.coach.style === 'jung' ? 1.5 : 1);
    if (nt.coach.style === 'erfahrung') e += nt.caps >= 15 ? 2 : -1;
    if (nt.coach.style === 'form') e += clamp(((p.form || 6) - 6) * 1.2, -3, 3);
    if (nt.critic > 0) e -= Math.min(2, nt.critic * 0.5);
    return e + R.gauss(0, 1);
  };
  NT.threshold = function (st, pos, lvl) {
    if (lvl && lvl !== 'A') { // Jugend: die besten ihres Jahrgangs im Land
      var a = NT.CFG.youthAge[lvl] || 21, list = []; for (var id in st.players) { var x = st.players[id]; if (x.age === a || x.age === a - 1) list.push(x.ovr); }
      list.sort(function (x, y) { return y - x; }); var q = NT.own(st).q, k = Math.max(2, Math.round(list.length * clamp(0.06 - (q - 0.7) * 0.08, 0.02, 0.09)));
      return list.length ? list[Math.min(list.length - 1, k)] : 50;
    }
    var club = NT.team(st, NT.ensure(st).code, 'A'), same = W.squad(st, club.id).filter(function (p) { return p.pos === pos; }).map(function (p) { return p.ovr; }).sort(function (a, b) { return b - a; });
    var k2 = NT.posSlots(pos), nt = NT.ensure(st), raw = same[Math.min(same.length - 1, k2 - 1)] || 60, mem = nt.cutMem = nt.cutMem || {}, mk = pos, prev = mem[mk];
    // geglättet über die Saisons (Kader ändern sich nicht sprunghaft)
    if (!prev || prev.s !== st.season) { mem[mk] = { s: st.season, v: prev ? Math.round((prev.v * 0.5 + raw * 0.5) * 10) / 10 : raw }; }
    return { cut: mem[mk].v, start: same[Math.min(same.length - 1, NT.starters(pos) - 1)] || 70, list: same };
  };
  NT.youthLvl = function (st, p) { var ys = NT.CFG.youth, A = NT.CFG.youthAge; for (var i = 0; i < ys.length; i++) if (p.age <= A[ys[i]]) return ys[i]; return null; };
  NT.decide = function (st, e) { // Kaderentscheidung für einen Termin (einmal je Lehrgang/Turnier)
    var nt = NT.ensure(st), p = C.player(st); if (!p) return null;
    if (e.sq) return e.sq;
    var blockKey = e.kind === 'tour' ? 'tour' + (nt.tour ? nt.tour.s + nt.tour.k : '') : e.slot + e.kind;
    if (nt.block && nt.block.k === blockKey && e.kind !== 'youth') { e.sq = nt.block.sq; return e.sq; }
    var sq = { inSq: false, role: '', use: 'out', why: '' };
    if (e.kind === 'youth') {
      var yl = NT.youthLvl(st, p);
      if (!yl || nt.status === 'squad' || p.inj) sq.why = !yl ? 'zu alt' : p.inj ? 'verletzt' : 'A-Kader';
      else { var thr = NT.threshold(st, p.pos, yl), ef = p.ovr + clamp(((p.form || 6) - 6), -3, 3) + R.gauss(0, 1.2); sq.lvl = yl; if (ef >= thr) { sq.inSq = true; sq.use = ef >= thr + 3 ? 'start' : ch(0.6) ? 'start' : 'bench'; sq.role = ef >= thr + 3 ? 'Stammspieler' : 'Ergänzungsspieler'; } else sq.why = 'nicht nominiert'; }
      e.sq = sq; e.lvl = sq.lvl || 'U21'; return sq;
    }
    if (nt.retired) { sq.why = 'zurückgetreten'; }
    else if (p.youth && p.age < 17) sq.why = 'zu jung';
    else if (p.inj && p.inj.weeks >= 1) { sq.why = 'verletzt'; if (nt.status === 'squad') nt.last = { kind: 'injOut', t: tick(st) }; }
    else {
      var th = NT.threshold(st, p.pos, 'A'), ef2 = NT.eff(st, p, 'A');
      sq.eff = Math.round(ef2 * 10) / 10; sq.cut = th.cut;
      if (ef2 >= th.cut) {
        sq.inSq = true; var rank = th.list.filter(function (v) { return v > ef2; }).length, ks = NT.starters(p.pos);
        var role = rank < ks ? (nt.caps >= 60 && p.age >= 28 ? 'Führungsspieler' : nt.caps >= 25 && nt.caps && nt.rsum / nt.caps >= (HB ? 7.6 : 6.9) ? 'Leistungsträger' : 'Stammspieler') : rank < ks + 1 ? 'Einwechselspieler' : rank < ks + 2 ? 'Ergänzungsspieler' : (p.age <= 21 && nt.caps < 3 ? 'Perspektivspieler' : 'Reservespieler');
        if (nt.captain && rank < ks) role = 'Kapitän';
        sq.role = role; sq.use = rank < ks ? (ch(0.9) ? 'start' : 'bench') : role === 'Einwechselspieler' ? 'bench' : role === 'Ergänzungsspieler' ? (ch(0.75) ? 'bench' : 'out') : ch(0.45) ? 'bench' : 'out';
        if (e.kind === 'friendly' && rank >= ks && ch(0.35)) sq.use = 'start'; // Testspiele: Chance für Herausforderer
      } else { sq.why = 'nicht nominiert'; if (ef2 >= th.cut - 2.5) { sq.watch = true; nt.watch = (nt.watch || 0) + 1; } }
    }
    nt.block = { k: blockKey, sq: sq }; e.sq = sq; if (e.kind === 'tour' && nt.tour) nt.tour.squad = sq;
    NT.afterDecision(st, e, sq);
    return sq;
  };
  NT.afterDecision = function (st, e, sq) {
    var nt = NT.ensure(st), p = C.player(st), wasIn = nt.status === 'squad';
    if (sq.inSq) {
      nt.status = 'squad'; nt.role = sq.role; nt.lastCall = { s: st.season, slot: e.slot, t: tick(st) }; nt.watch = 0;
      NT.pay(st, 'call' + e.key, NT.PRIZE.call * NT.fac(st), 'Abstellungsprämie Nationalmannschaft');
      if (!nt.ms.call) { nt.ms.call = { s: st.season, w: st.week, t: tick(st) }; nt.last = { kind: 'firstCall', t: tick(st) }; X.chron(st, 'nati', '📞', 'Die erste Einladung', 'Nationaltrainer ' + nt.coach.name + ' beruft dich in den Kader.', 3, 'nt_call'); if (L && L.start) L.start(st, 'nt_firstcall', { label: e.label }); NT.news(st, 'Erstmals nominiert: ' + W.playerName(p), nt.coach.name + ' beruft ' + W.playerName(p) + ' für ' + e.label + '.'); }
      else if (!wasIn) { nt.last = { kind: nt.retired ? 'comeback' : 'recall', t: tick(st) }; NT.news(st, W.playerName(p) + ' zurück im Nationalteam', 'Nationaltrainer ' + nt.coach.name + ' nominiert ihn wieder.'); }
      else NT.news(st, 'Nominiert: ' + e.label, 'Deine Rolle: ' + sq.role + '.');
    } else {
      if (wasIn && sq.why === 'nicht nominiert') { nt.status = 'dropped'; nt.last = { kind: 'dropped', t: tick(st), form: p.form || 6 }; NT.news(st, 'Nicht nominiert', nt.coach.name + ' verzichtet diesmal auf ' + W.playerName(p) + '.'); }
      if (sq.watch && !wasIn) nt.last = { kind: 'watch', t: tick(st) };
    }
  };
  NT.fac = function (st) { var q = NT.own(st).q; return 0.55 + 0.6 * q; };
  NT.pay = function (st, key, amt, cat) { // genau einmal je Bedingung, vereinfacht versteuert
    var nt = NT.ensure(st); amt = Math.round(amt); if (nt.paid[key] || !(amt > 0)) return 0; nt.paid[key] = tick(st) || 1;
    var net = Math.round(amt * (1 - NT.TAX)); if (R.pf && R.pf.book) R.pf.book(st, net, 'Nationalmannschaftsprämie'); else C.pay(st, net, 'Nationalmannschaftsprämie');
    nt.bonus = (nt.bonus || 0) + net; nt.payLog = (nt.payLog || []); nt.payLog.unshift({ s: st.season, t: tick(st), txt: cat, gross: Math.round(amt), net: net }); if (nt.payLog.length > 40) nt.payLog.length = 40;
    return net;
  };
  NT.news = function (st, t, x) { if (S.news) S.news(st, t, x, 'nati'); };

  // ---------- Länderspiele ----------
  NT.entriesNow = function (st) { var nt = NT.ensure(st), sl = NT.slot(st); if (!nt || !sl) return []; NT.newSeason(st); return nt.cal.filter(function (e) { return e.slot === sl && !e.played; }); };
  NT.pending = function (st) { // nächstes eigenes Spiel dieser Woche mit eigenem Einsatz (für das Matchcenter)
    var p = C.player(st); if (!p) return null; var list = NT.entriesNow(st);
    for (var i = 0; i < list.length; i++) { var e = list[i]; if (e.kind === 'tour' && !NT.roundReady(st, e)) continue; var sq = NT.decide(st, e); if (sq && sq.inSq && (e.useOv || sq.use) !== 'out' && !p.inj && !(p.susp > 0)) return e; }
    return null;
  };
  NT.roundReady = function (st, e) { var t = NT.ensure(st).tour; if (!t) return false; var rd = t.rounds.filter(function (r) { return r.r === e.tr; })[0]; if (!rd || rd.done) return false; var i = t.rounds.indexOf(rd); return i === 0 || t.rounds[i - 1].done; };
  NT.createMatch = function (st, e) {
    var nt = NT.ensure(st), p = C.player(st), lvl = e.kind === 'youth' ? (e.lvl || 'U21') : 'A';
    var a = NT.team(st, nt.code, lvl), b = NT.team(st, e.opp, lvl), home = e.home && e.kind !== 'tour'; NT.refresh(st, a); NT.refresh(st, b);
    var m = M.create(st, home ? a.id : b.id, home ? b.id : a.id, { comp: 'friendly', neutral: e.kind === 'tour', extraTime: !!e.ko });
    m.st = st; m.nt = { key: e.key, kind: e.kind, lvl: lvl }; var s = home ? 0 : 1; m.ntSide = s;
    var sq = e.sq || {}, use = e.useOv || sq.use;
    if (sq.inSq && p && !p.inj) {
      if (use === 'start') { var ix = m.onPitch[s].indexOf(m.onPitch[s].filter(function (id) { return id && st.players[id] && st.players[id].pos === p.pos; }).slice(-1)[0]); if (ix < 0) ix = m.onPitch[s].length - 1; var old = m.onPitch[s][ix]; delete m.played[old]; delete m.rating[old]; m.onPitch[s][ix] = p.id; m.played[p.id] = s; m.rating[p.id] = 6; m.fit[p.id] = p.fitness; }
      else if (use === 'bench') { var bi = m.bench[s].length - 1; if (bi < 0) m.bench[s].push(p.id); else m.bench[s][bi] = p.id; m.fit[p.id] = p.fitness; }
    }
    if (nt.captain && use === 'start') m.ntCapt = true;
    return m;
  };
  NT.swapIn = function (st, m) { var nt = NT.ensure(st); if (nt.swap) return; nt.swap = { club: st.pc.trust }; st.pc.trust = nt.trust; m.ntSwap = true; };
  NT.swapOut = function (st, m) { var nt = NT.ensure(st); if (!nt.swap) return; nt.trust = clamp(st.pc.trust, 0, 100); st.pc.trust = nt.swap.club; nt.swap = null; };
  NT.play = function (st, e) { // automatisch (ohne Matchcenter) – Entscheidungen nach Persönlichkeit
    var m = NT.createMatch(st, e), p = C.player(st), inv = m.played[p.id] != null || m.bench[m.ntSide].indexOf(p.id) >= 0;
    if (inv && R.cm && R.cm.autoPlay) { NT.swapIn(st, m); R.cm.autoPlay(m, st, R.cm.rulePolicy ? R.cm.rulePolicy(st) : null); }
    else M.simulate(m);
    return NT.finish(st, m, e.key);
  };
  NT.finish = function (st, m, key) {
    var nt = NT.ensure(st), e = nt.cal.filter(function (x) { return x.key === key; })[0]; if (!e || e.played) { NT.swapOut(st, m); return null; }
    NT.swapOut(st, m);
    var p = C.player(st), s = m.ntSide, mine = m.score[s], their = m.score[1 - s], pens = m.pens ? [m.pens[s], m.pens[1 - s]] : null;
    var won = mine > their || (pens && pens[0] > pens[1]), lost = mine < their || (pens && pens[0] < pens[1]);
    // Elfmeterschießen: Schützen sind die fünf besten Schützen auf dem Feld
    if (pens && p && m.onPitch[s].indexOf(p.id) >= 0 && e.kind !== 'youth') { var shs = m.onPitch[s].filter(Boolean).map(function (id) { return st.players[id]; }).filter(Boolean).sort(function (a, b) { return b.attr.sho - a.attr.sho; }); var pr = shs.indexOf(p); if (pr >= 0 && pr < 5) { var sc = won ? ch(0.88) : ch(0.5); nt.pens[0]++; if (sc) nt.pens[1]++; nt.penShot = { t: tick(st), sc: sc, won: !!won, label: e.label, ko: !!e.ko, tour: e.kind === 'tour' }; } }
    M.finalize(m); // Fitness, Form, Moral, Verletzungen (Testspiel-Regeln: keine Vereinssperren)
    e.played = true; e.res = [mine, their]; e.pens = pens; e.won = !!won; e.lost = !!lost;
    var playedMe = p && m.played[p.id] != null, out = { e: e, played: playedMe, goals: 0, rating: null, won: won, lost: lost };
    if (p && playedMe) {
      var g = m.goals[p.id] || 0, as = m.assists[p.id] || 0, rt = m.rating[p.id] || 6;
      out.goals = g; out.rating = rt;
      p.fitness = clamp(p.fitness - (e.kind === 'tour' ? 3 : 5), 20, 100); // Reise und Belastung
      if (e.kind === 'youth') { var y = nt.youth[e.lvl] = nt.youth[e.lvl] || { caps: 0, goals: 0 }; y.caps++; y.goals += g; if (!nt.ms.youth) { nt.ms.youth = { s: st.season, lvl: e.lvl }; X.chron(st, 'nati', '🎽', 'Erstes Spiel für die ' + e.lvl, 'Debüt in der Jugend-Nationalmannschaft gegen ' + NT.nat(e.opp).name + '.', 2, 'nt_youth'); } }
      else {
        nt.caps++; nt.goals += g; nt.assists += as; nt.rsum += rt; if (e.sq && (e.useOv || e.sq.use) === 'start') nt.starts++;
        if (m.ntCapt) nt.capt++; st.pc.nat = nt.caps;
        var started = m.onPitch[s].indexOf(p.id) >= 0 || (e.useOv || e.sq.use) === 'start', base = HB ? (started ? 7.7 : 7.1) : (started ? 6.5 : 6.0);
        nt.trust = clamp(nt.trust + (rt - base) * 3 + (g ? 1.5 : 0) + 0.4, 5, 98); // jeder Einsatz bringt etwas Vertrauen
        NT.pay(st, 'cap' + e.key, NT.PRIZE.cap * NT.fac(st), 'Einsatzprämie Länderspiel');
        if (nt.caps === 1) { nt.ms.debut = { s: st.season, w: st.week, opp: e.opp, t: tick(st) }; nt.last = { kind: 'debut', t: tick(st) }; C.milestone(st, 'nat', 'Erstes Länderspiel!', 'Debüt für ' + NT.own(st).name + ' gegen ' + NT.nat(e.opp).name + '.'); X.chron(st, 'nati', '🎶', 'Das erste Länderspiel', 'Nationalhymne, Gänsehaut – Debüt gegen ' + NT.nat(e.opp).name + ' (' + mine + ':' + their + ').', 3, 'nt_anthem'); if (L && L.start) L.start(st, 'nt_debut', { opp: NT.nat(e.opp).name, res: mine + ':' + their, g: g }); C.addFame(st, 3); }
        if (g && !nt.ms.goal) { nt.ms.goal = { s: st.season, opp: e.opp, t: tick(st) }; C.milestone(st, 'ntGoal', 'Erstes Länderspieltor!', 'Gegen ' + NT.nat(e.opp).name + '.'); X.chron(st, 'nati', '⚽', 'Erstes Länderspieltor', 'Tor im Nationaltrikot gegen ' + NT.nat(e.opp).name + '.', 3, 'nt_goal'); }
        [10, 25, 50, 75, 100, 150].forEach(function (n) { if (nt.caps === n) { C.milestone(st, 'ntCaps' + n, n + ' Länderspiele!', ''); X.chron(st, 'nati', '🎖️', n + '. Länderspiel', 'Jubiläum im Nationaltrikot.', 2); } });
        C.addFame(st, 0.6 + g * (HB ? 0.15 : 0.8)); nt.lastRt = rt; nt.streak = rt >= (HB ? 7.8 : 7) ? Math.max(1, nt.streak + 1) : rt < (HB ? 6.6 : 6) ? Math.min(-1, nt.streak - 1) : 0;
        var t = nt.tour; if (e.kind === 'tour' && t) { t.apps = (t.apps || 0) + 1; t.goals = (t.goals || 0) + g; }
      }
      if (e.risk && !p.inj && ch(e.risk)) { var wk = R.randInt(3, 6); p.inj = { type: 'Muskelfaserriss (Länderspiel)', weeks: wk, total: wk }; out.riskHit = true; nt.riskHit = { t: tick(st), w: wk }; }
      if (m.injured[p.id]) { if (p.inj) { p.inj.type = (p.inj.type || 'Verletzung') + ' (Länderspiel)'; } nt.last = { kind: 'injured', t: tick(st) }; }
    } else if (p && e.sq && e.sq.inSq && e.kind !== 'youth') { nt.benchRun = (nt.benchRun || 0) + 1; nt.trust = clamp(nt.trust - 0.5, 5, 98); }
    if (playedMe) nt.benchRun = 0;
    if (e.kind !== 'youth' && e.sq && e.sq.inSq && won) NT.pay(st, 'win' + e.key, (e.kind === 'friendly' ? NT.PRIZE.win * 0.35 : NT.PRIZE.win) * NT.fac(st), 'Siegprämie Länderspiel');
    if (e.kind !== 'youth') { nt.hist.unshift({ s: st.season, t: tick(st), opp: e.opp, res: [mine, their], pens: pens, kind: e.kind, label: e.label, me: playedMe, g: out.goals, r: out.rating }); if (nt.hist.length > 80) nt.hist.length = 80; }
    // Wettbewerb fortschreiben
    if (e.kind === 'qual' || e.kind === 'league') { var q = nt.qual, f = q && q.fx[e.qi]; if (f) { f.res = e.home ? [mine, their] : [their, mine]; NT.tabAdd(q.tab, f); NT.simQualMd(st, f.md); } }
    if (e.kind === 'playoff') { nt.qual.playoff.res = [mine, their]; nt.qual.playoff.won = !!won; }
    if (e.kind === 'tour') { var tt = nt.tour, rd = tt && tt.rounds.filter(function (r) { return r.r === e.tr; })[0]; if (rd) { var fx = rd.fx[e.fi]; fx.res = e.home ? [mine, their] : [their, mine]; fx.pens = pens ? (e.home ? pens : [pens[1], pens[0]]) : null; fx.w = won ? nt.code : e.opp; if (!e.ko) NT.tabAdd(tt.tab, fx); NT.simRound(st, tt, rd); } }
    if (e.kind !== 'youth' && !playedMe && e.sq && e.sq.inSq) out.bench = true;
    NT.criticUpdate(st, e, out);
    nt.lastRes = { key: e.key, label: e.label, opp: e.opp, res: [mine, their], pens: pens, played: playedMe, goals: out.goals, rating: out.rating, won: !!won, lost: !!lost, t: tick(st), kind: e.kind };
    return out;
  };
  NT.criticUpdate = function (st, e, out) {
    var nt = NT.ensure(st); if (e.kind === 'youth') return;
    if (out.lost && out.played && out.rating != null && out.rating < (HB ? 6.8 : 6.2)) nt.critic = Math.min(6, (nt.critic || 0) + 1);
    else if (out.won && out.played && out.rating >= (HB ? 7.8 : 7)) nt.critic = Math.max(0, (nt.critic || 0) - 1);
    if (e.kind === 'tour' && e.ko && out.lost && out.played) nt.koOut = { t: tick(st), label: e.label, pens: !!e.pens };
  };
  NT.tabAdd = function (tab, f) {
    var h = tab[f.h], a = tab[f.a]; if (!h || !a || !f.res) return; var x = f.res[0], y = f.res[1];
    h.p++; a.p++; h.gf += x; h.ga += y; a.gf += y; a.ga += x;
    if (x > y) { h.w++; a.l++; h.pts += HB ? 2 : 3; } else if (x < y) { a.w++; h.l++; a.pts += HB ? 2 : 3; } else { h.d++; a.d++; h.pts++; a.pts++; }
  };
  function simFx(st, f, lvl, ko) {
    var a = NT.team(st, f.h, lvl), b = NT.team(st, f.a, lvl); NT.refresh(st, a); NT.refresh(st, b); var m = M.create(st, a.id, b.id, { comp: 'friendly', neutral: true, extraTime: !!ko }); m.st = st; M.simulate(m);
    f.res = m.score.slice(); f.pens = m.pens ? m.pens.slice() : null; f.w = f.res[0] > f.res[1] || (f.pens && f.pens[0] > f.pens[1]) ? f.h : f.a; return f;
  }
  NT.simQualMd = function (st, md) { var q = NT.ensure(st).qual; q.fx.forEach(function (f) { if (f.md === md && !f.res) { simFx(st, f, 'A', false); NT.tabAdd(q.tab, f); } }); if (md === 5) NT.qualDone(st); };
  NT.qualDone = function (st) {
    var nt = NT.ensure(st), q = nt.qual; if (!q || q.closed) return; q.closed = true;
    var pl = NT.qualPlace(q), name = q.tour ? NT.CFG.tours[q.tour].n : NT.CFG.leagueName;
    var wasIn = nt.lastCall && nt.lastCall.s === q.s;
    if (!q.tour) { if (pl === 1 && wasIn) NT.pay(st, 'league' + q.s, NT.PRIZE.league * NT.fac(st), 'Prämie ' + NT.CFG.leagueName + '-Gruppensieg'); NT.news(st, NT.CFG.leagueName + ': Platz ' + pl, NT.own(st).name + ' beendet die Gruppe auf Rang ' + pl + '.'); nt.last = { kind: 'leagueEnd', pl: pl, t: tick(st) }; return; }
    var needPO = (q.tour === 'EM' && pl === 3) || (q.tour === 'WM' && !HB && pl === 2);
    if (needPO && !HB) { // Play-off im letzten Fenster (statt Testspiel)
      var fr = nt.cal.filter(function (e) { return e.kind === 'friendly' && !e.played; })[0];
      var opp = rankedOthers(st, function (n) { return n.conf === 'EU' && n.code !== nt.code && q.group.indexOf(n.code) < 0; }, 'po').slice(6, 14)[R.randInt(0, 7)];
      if (fr) { fr.kind = 'playoff'; fr.opp = opp; fr.label = 'Play-off ' + name; fr.ko = true; fr.home = true; q.playoff = { opp: opp, res: null, won: false }; NT.news(st, 'Play-off um die ' + name, NT.own(st).name + ' muss gegen ' + NT.nat(opp).name + ' nachsitzen.'); nt.last = { kind: 'playoff', t: tick(st) }; return; }
    }
    var ok = NT.qualOk(st, q);
    NT.news(st, ok ? NT.own(st).name + ' qualifiziert sich für die ' + name + '!' : NT.own(st).name + ' verpasst die ' + name, 'Abschluss der Qualifikationsgruppe: Platz ' + pl + '.');
    if (ok && nt.status === 'squad' && wasIn) { NT.pay(st, 'qual' + q.s, NT.PRIZE.qual * NT.fac(st), 'Qualifikationsprämie ' + name); X.chron(st, 'nati', '✅', 'Qualifiziert für die ' + name, 'Platz ' + pl + ' in der Gruppe.', 2); }
    nt.last = { kind: ok ? 'qualified' : 'qualFailed', t: tick(st), tour: q.tour };
  };
  NT.simRound = function (st, t, rd) {
    rd.fx.forEach(function (f) { if (!f.res) { simFx(st, f, 'A', rd.r.charAt(0) !== 'G'); if (rd.r.charAt(0) === 'G') NT.tabAdd(t.tab, f); } });
    rd.done = true; NT.advance(st, t);
  };
  // Woche vor dem Vereinsspiel: offene Länderspiele (z. B. ohne Matchcenter) und übrige Turnierspiele
  NT.preWeek = function (st) {
    var nt = NT.ensure(st); if (!nt || st.pc.retired) return;
    var sl = NT.slot(st); if (!sl) return; NT.newSeason(st);
    var guard = 0;
    while (guard++ < 12) {
      var list = nt.cal.filter(function (e) { return e.slot === sl && !e.played && (e.kind !== 'tour' || NT.roundReady(st, e)); });
      if (!list.length) break;
      var e = list[0]; NT.decide(st, e); NT.play(st, e);
    }
    // Turnierrunden dieser Woche ohne eigenes Team (ausgeschieden/nicht qualifiziert)
    var t = nt.tour; if (t && !t.done) { var g2 = 0; while (g2++ < 8) { var rd = t.rounds.filter(function (r) { return !r.done && r.slot === sl; })[0]; if (!rd) break; var ownOpen = nt.cal.some(function (e) { return e.kind === 'tour' && e.tr === rd.r && !e.played; }); if (ownOpen) break; NT.simRound(st, t, rd); } }
    if (t && t.done && t.s !== st.season - 0 && false) nt.tour = null;
  };
  // Abwesenheit: weniger freie Termine im Privatleben (Turnier = deutlich weniger)
  NT.away = function (st) { var nt = st.pc && st.pc.nt; if (!nt) return 0; var sl = NT.slot(st), n = 0, t = nt.tour; (nt.cal || []).forEach(function (e) { if (e.slot !== sl || e.kind === 'youth') return; if (e.kind === 'tour') { if (t && t.squad && t.squad.inSq) n = 3; } else if (e.sq && e.sq.inSq) n = Math.max(n, 1); }); return n; };
  if (L && L.refreshAp) { var baseAp = L.refreshAp; L.refreshAp = function (st) { var lf = L.life(st), was = lf && lf.apWeek; baseAp(st); if (lf && lf.apWeek !== was) { var a = NT.away(st); if (a) lf.ap = Math.max(1, lf.ap - a); } }; }

  // ---------- Rücktritt / Rückkehr ----------
  NT.retire = function (st, why) {
    var nt = NT.ensure(st); if (nt.retired) return false; nt.retired = { s: st.season, t: tick(st), why: why || 'persönliche Gründe', caps: nt.caps }; nt.status = 'retired';
    X.chron(st, 'nati', '👋', 'Rücktritt aus der Nationalmannschaft', nt.caps + ' Länderspiele, ' + nt.goals + ' ' + X.SW.goals + '. Grund: ' + nt.retired.why + '.', 3, 'nt_retire');
    NT.news(st, 'Rücktritt aus dem Nationalteam', W.playerName(C.player(st)) + ' beendet nach ' + nt.caps + ' Länderspielen seine internationale Karriere.'); nt.last = { kind: 'retired', t: tick(st) }; return true;
  };
  NT.unretire = function (st) { var nt = NT.ensure(st); if (!nt.retired) return false; nt.comebackFrom = nt.retired; nt.retired = null; nt.status = 'none'; nt.trust = Math.max(nt.trust, 52); X.chron(st, 'nati', '🔁', 'Rückkehr ins Nationalteam', 'Du stehst wieder zur Verfügung.', 2); return true; };

  // ---------- Einbindung ----------
  var baseComplete = S.completeWeek;
  S.completeWeek = function (st, played) {
    var on = st.pc && C.active && C.active(st) && st.pc.cx;
    if (on) { try { NT.preWeek(st); } catch (er) { if (typeof console !== 'undefined') console.error(er); } }
    var brk = st.phase === 'preseason' || st.phase === 'winter';
    var r = baseComplete(st, played);
    if (on) { try { if (brk && C.active(st)) NT.breakDirector(st); NT.markAway(st); } catch (er2) { if (typeof console !== 'undefined') console.error(er2); } }
    return r;
  };
  // In Vorbereitung und Winterpause läuft die Karriere-Regie nicht – Turniere finden aber genau dann statt.
  // Eigene, kleine Regie nur für Nationalteam-Ereignisse (fällige Handlungsbögen zuerst).
  NT.breakDirector = function (st) {
    var cx = X.ensure(st); if (!cx || st.pendingEvent) return null; var t = tick(st), mem = cx.mem, ctx = X.ctx(st);
    var due = mem.arcs.filter(function (a) { var e = X.REG[a.id]; return a.due <= t && e && e.pack === 'nati'; })[0];
    if (due) { mem.arcs.splice(mem.arcs.indexOf(due), 1); var okA = true; try { okA = !X.REG[due.id].when || X.REG[due.id].when(ctx, due.data); } catch (er) { okA = false; } if (okA) { X.fire(st, due.id, due.data); return due.id; } }
    var pool = (X.PACKS.nati || []).map(function (id) { return X.REG[id]; }).filter(function (e) { return X.eligible(st, e, ctx); });
    if (!pool.length) return null;
    var top = pool.filter(function (e) { return (e.prio || 0) >= 2; });
    if (!top.length && !ch(NT.away(st) >= 3 ? 0.55 : 0.2)) return null;
    var e2 = R.weighted(top.length ? top : pool, function (e) { return (e.w || 1) * (1 + (e.prio || 0) * 0.5); });
    X.fire(st, e2.id, {}); return e2.id;
  };
  // Turnierwochen: Spieler ist beim Nationalteam und fehlt dem Verein (keine Doppelbuchung)
  NT.markAway = function (st) {
    var p = C.player(st); if (!p || !st.pc.nt) return false; NT.newSeason(st); if (st.phase !== 'preseason') NT.winterTour(st);
    var sl = NT.slot(st), away = false;
    st.pc.nt.cal.forEach(function (e) { if (e.slot === sl && !e.played && (e.kind !== 'tour' || NT.roundReady(st, e) || e.tr === 'G1')) { var sq = NT.decide(st, e); if (sq && sq.inSq && e.kind === 'tour') away = true; } }); // Kader wird vor der Woche bekanntgegeben
    if (away) p.ntAway = 1; else delete p.ntAway; return away;
  };
  var baseNew = S.newSeason;
  S.newSeason = function (st) { var r = baseNew.apply(this, arguments); if (st.pc && st.pc.cx && C.active(st)) { try { NT.newSeason(st); NT.markAway(st); } catch (er) { if (typeof console !== 'undefined') console.error(er); } } return r; };
  // CM: Seite des eigenen Spielers im Länderspiel (Vereinszugehörigkeit passt dort nicht)
  // Kontext für Ereignisse
  var baseCtx = X.ctx;
  X.ctx = function (st) {
    var c = baseCtx(st); var nt = st.pc && st.pc.cx ? NT.ensure(st) : null; c.nt = nt;
    if (nt) { c.ntIn = nt.status === 'squad'; c.ntCaps = nt.caps; c.ntLast = nt.last && tick(st) - nt.last.t <= 3 ? nt.last.kind : null; c.ntTour = nt.tour && !nt.tour.done && nt.tour.own ? nt.tour : null; c.ntCoach = nt.coach; c.ntPpl = nt.people; c.ntRole = nt.role; c.ntAway = NT.away(st); c.nation = NT.own(st).name; c.kids = st.pc.cx.life ? st.pc.cx.life.kids : []; c.ptn = st.pc.cx.life ? st.pc.cx.life.partner : null; }
    return c;
  };
  // Szenen der Bild-Engine (zustandsabhängige Motive; echte Fotos können über L.IMG ergänzt werden)
  if (L && L.SCENES) {
    var PH = { nt_press: ['ev_press_conference'], nt_out: ['ev_locker_down'], nt_fans: ['ev_fanclub_meeting'] };
    ['nt_call', 'nt_travel', 'nt_hotel', 'nt_train', 'nt_anthem', 'nt_goal', 'nt_pen', 'nt_cheer', 'nt_out', 'nt_press', 'nt_phone', 'nt_home', 'nt_title', 'nt_fans', 'nt_retire', 'nt_youth', 'nt_stadium'].forEach(function (k) { L.SCENES[k] = { all: PH[k] || [], fb: k === 'nt_stadium' ? ['ev_stadium_night'] : [], svg: k }; });
    // Szenenbilder mit Zuständen: Eröffnung, Reaktion, Abschluss (bis echte Fotos vorliegen als SVG-Varianten)
    var baseImg = L.sceneImg;
    L.sceneImg = function (scene, state) { var r = baseImg(scene, state); if (r && r.svg && /^nt_/.test(r.svg)) r = { svg: r.svg + (state === 'closing' ? '_c' : state === 'response' ? '_r' : ''), alt: r.alt }; return r; };
  }
  // geplante Fotomotive (Prompts für spätere Bilder; bis dahin SVG-Szenenbilder)
  NT.IMG_TODO = ['Anruf des Nationaltrainers', 'Erste Nominierung', 'Ankunft im Trainingslager', 'Mannschaftshotel', 'Nationalmannschaftstraining', 'Erstes Länderspiel', 'Nationalhymne', 'Tor im Nationaltrikot', 'Entscheidender Strafstoß', 'Jubel mit der Nationalmannschaft', 'WM-/EM-Spiel', 'Enttäuschung nach dem Ausscheiden', 'Kritische Pressekonferenz', 'Telefonat mit der Familie', 'Wiedersehen nach dem Turnier', 'Internationaler Titelgewinn', 'Empfang durch die Fans', 'Rücktritt aus der Nationalmannschaft'];
})(RFM);
