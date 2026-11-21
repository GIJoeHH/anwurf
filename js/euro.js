// Europapokal: Meister-Liga (Plätze 1–4 aus acht Ländern) und Top-Liga (Plätze 5–8).
// Modus: 8 Gruppen à 4 Mannschaften mit Hin- und Rückspiel, die besten zwei jeder Gruppe erreichen das Achtelfinale,
// danach Viertelfinale, Halbfinale und Finale. Fußball: Finale an wechselndem Ort. Handball: Halbfinale und Finale als
// Final-4-Wochenende an wechselndem Ort. Diese Datei ist in beiden Spielen identisch, die Daten stehen in data_euro.js.
//
// Ausländische Vereine stehen NICHT im Spielstand: Sie werden bei Bedarf aus den festen Daten erzeugt und als
// nicht aufzählbare Einträge in st.clubs / st.players eingehängt. Dadurch finden alle Nachschlagezugriffe sie
// (st.clubs[id]), während Schleifen über alle Vereine, Transfers, Finanzen und das Speichern sie nicht sehen.
(function (R) {
  var D = R.data, W = R.world, M = R.match, E = R.econ, S = R.season, C = D.euro;
  var X = R.euro = {};
  if (!C) return;
  X.COMPS = ['ml', 'tl'];
  X.NAMES = { ml: 'Meister-Liga', tl: 'Top-Liga' };
  X.GROUP_WEEKS = [3, 5, 8, 10, 13, 15];
  X.ROUNDS = C.final4
    ? [{ n: 'Achtelfinale', w: [21, 22] }, { n: 'Viertelfinale', w: [25, 26] }, { n: 'Halbfinale', w: [33], neutral: true, f4: true }, { n: 'Finale', day2: true, neutral: true, f4: true }]
    : [{ n: 'Achtelfinale', w: [21, 22] }, { n: 'Viertelfinale', w: [25, 26] }, { n: 'Halbfinale', w: [28, 29] }, { n: 'Finale', w: [33], neutral: true }];
  X.GROUP_LETTERS = 'ABCDEFGH';
  D.achievements.meisterliga = ['Europas Thron', 'Gewinne die Meister-Liga.'];
  D.achievements.topliga = ['Europapokalsieger', 'Gewinne die Top-Liga.'];

  // ---------- Feste Daten der ausländischen Vereine ----------
  X.defs = {}; X.byCountry = {};
  (function () {
    var n = 0;
    C.countries.forEach(function (co) {
      X.byCountry[co.k] = co.clubs.map(function (r, i) {
        var id = 'x' + co.k + (i + 1);
        X.defs[id] = { id: id, name: r[0], short: r[1], city: r[2], colors: [r[3], r[4]], q: r[5], fans: r[6], wiki: r[7], country: co.k, countryName: co.n,
          geo: [co.geo[0] + ((i * 37) % 10 - 5) * 0.12, co.geo[1] + ((i * 53) % 10 - 5) * 0.15], idx: n++ };
        return id;
      });
    });
  })();
  X.ids = Object.keys(X.defs);
  X.isForeign = function (id) { return !!X.defs[id]; };
  X.logo = function (d) { var L = R.logos, st = R.ui && R.ui.st; return L && (!st || L.enabled(st)) ? L.get(d.name) : null; };
  // Name → Wikipedia-Titel für das Nachladen der Vereinslogos (js/logos.js)
  X.logoCatalog = function () { var out = {}; X.ids.forEach(function (id) { out[X.defs[id].name] = X.defs[id].wiki; }); return out; };
  // Vereinslogos auf diesem Gerät laden (nur auf ausdrücklichen Wunsch, nie Teil der veröffentlichten App):
  // 1. Artikelbild des deutschen Wikipedia-Artikels, 2. sonst Suche in der englischen Wikipedia.
  // Gespeichert wird in derselben lokalen Logo-Bibliothek wie die Sponsorenlogos (js/logos.js).
  X.LOGO_SIZE = 60; // klein halten: die Logos teilen sich den Browser-Speicher mit den Spielständen
  X.loadLogos = function (onStep) {
    var L = R.logos;
    if (!L || typeof fetch === 'undefined') return Promise.resolve({ ok: 0, total: 0, error: 'offline' });
    var lib = L.lib(), todo = X.ids.map(function (id) { return X.defs[id]; }).filter(function (d) { return !L.get(d.name); }), done = 0, ok = 0, thumb = {};
    if (!todo.length) return Promise.resolve({ ok: 0, total: 0 });
    function api(lang) { return 'https://' + lang + '.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&piprop=thumbnail&pithumbsize=' + X.LOGO_SIZE + '&pilicense=any&redirects=1'; }
    function getJSON(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }); }
    function toDataURL(blob) { return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(blob); }); }
    function image(url) {
      return fetch(url).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
        .then(function (b) { if (!/^image\//.test(b.type) || b.size < 200 || b.size > 400000) throw new Error('Kein gültiges Bild'); return toDataURL(b); });
    }
    function batch(titles) {
      return getJSON(api('de') + '&titles=' + encodeURIComponent(titles.join('|'))).then(function (j) {
        var q = j.query || {}, map = {};
        (q.normalized || []).forEach(function (n) { map[n.to] = n.from; });
        (q.redirects || []).forEach(function (n) { map[n.to] = map[n.from] || n.from; });
        Object.keys(q.pages || {}).forEach(function (k) { var p = q.pages[k]; if (p.thumbnail) thumb[map[p.title] || p.title] = p.thumbnail.source; });
      }).catch(function () {});
    }
    function search(d) {
      var term = d.name + (C.sport === 'handball' ? ' handball' : ' football club');
      return getJSON(api('en') + '&generator=search&gsrlimit=1&gsrsearch=' + encodeURIComponent(term)).then(function (j) {
        var pg = (j.query && j.query.pages) || {}, k = Object.keys(pg)[0]; return k && pg[k].thumbnail ? pg[k].thumbnail.source : null;
      }).catch(function () { return null; });
    }
    var chunks = []; for (var i = 0; i < todo.length; i += 40) chunks.push(todo.slice(i, i + 40).map(function (d) { return d.wiki; }));
    return chunks.reduce(function (p, ch) { return p.then(function () { return batch(ch); }); }, Promise.resolve()).then(function () {
      return todo.reduce(function (p, d) {
        return p.then(function () {
          return (thumb[d.wiki] ? Promise.resolve(thumb[d.wiki]) : search(d)).then(function (url) {
            if (!url) return false;
            return image(url).then(function (data) { lib.items[d.name] = { data: data, src: url, club: true, t: Date.now() }; ok++; L.save(); return true; });
          }).catch(function () { return false; }).then(function (good) { done++; if (onStep) onStep(done, todo.length, d.name, good); });
        });
      }, Promise.resolve());
    }).then(function () { return { ok: ok, total: todo.length }; });
  };
  // Schlanke Anzeige-Daten (Name, Farben, Wappen) ohne Kader – für Tabellen und Turnierbaum
  var infoCache = {};
  X.info = function (st, id) {
    var d = X.defs[id]; if (!d) return st.clubs[id];
    var o = infoCache[id];
    if (!o) {
      o = infoCache[id] = { id: id, name: d.name, short: d.short, city: d.city, colors: d.colors, crest: { shape: d.idx % 4, symbol: 0 }, foreign: true, country: d.country, countryName: d.countryName, league: 1, rivals: [] };
      Object.defineProperty(o, 'crestImage', { enumerable: true, get: function () { return X.logo(d); } });
    }
    return o;
  };
  X.countryOf = function (st, id) { return X.defs[id] ? X.defs[id].countryName : C.home.n; };

  // Vornamen/Nachnamen je Land, damit die Kader der Gegner nicht deutsch klingen
  var NAMES = {
    EN: ['James,Harry,Jack,Oliver,Ben,Luke,Kyle,Declan,Mason,Reece,Jordan,Marcus,Callum,Conor,Aaron', 'Walker,Stones,Foster,Barnes,Hughes,Marsh,Cooper,Bennett,Parker,Reid,Shaw,Carter,Mills,Dawson,Kane,Rice,Wright,Brooks,Hayes,Turner,Ward,Gibbs,Palmer,Howe'],
    ES: ['Pablo,Sergio,Álvaro,Dani,Marcos,Iker,Javi,Carlos,Raúl,Diego,Hugo,Mikel,Adrián,Rodrigo,Unai', 'García,Martínez,López,Sánchez,Navarro,Torres,Ruiz,Moreno,Vidal,Castro,Herrera,Ortega,Molina,Serrano,Blanco,Vega,Iglesias,Rubio,Pascual,Gil,Soler,Prieto,Campos,Bravo'],
    IT: ['Marco,Luca,Andrea,Matteo,Federico,Nicolò,Alessandro,Davide,Lorenzo,Simone,Giacomo,Riccardo,Stefano,Antonio,Gianluca', 'Rossi,Bianchi,Romano,Colombo,Ricci,Marino,Greco,Bruno,Gallo,Conti,De Luca,Mancini,Costa,Giordano,Rizzo,Lombardi,Moretti,Barbieri,Fontana,Santoro,Mariani,Rinaldi,Caruso,Ferrara'],
    FR: ['Lucas,Hugo,Théo,Antoine,Kylian,Mathieu,Julien,Florian,Adrien,Jordan,Ousmane,Moussa,Benjamin,Nicolas,Rayan', 'Martin,Bernard,Dubois,Moreau,Laurent,Girard,Roux,Fournier,Lambert,Bonnet,Mercier,Blanc,Guerin,Faure,Renard,Diallo,Traoré,Camara,Perrin,Marchand,Leroy,Garnier,Chevalier,Robin'],
    NL: ['Daan,Luuk,Sven,Jesper,Thijs,Bram,Stijn,Ruben,Jordy,Joey,Wout,Teun,Mats,Milan,Noa', 'de Jong,de Vries,van Dijk,Bakker,Janssen,Visser,Smit,Meijer,de Boer,Mulder,Bos,Vos,Peters,Hendriks,Dekker,Brouwer,de Wit,Dijkstra,Kok,Jacobs,Vermeer,van Leeuwen,Koster,Schouten'],
    PT: ['João,Rui,Diogo,Bruno,Bernardo,Gonçalo,Rafael,Nuno,Pedro,André,Tiago,Ricardo,Fábio,Vítor,Renato', 'Silva,Santos,Ferreira,Pereira,Oliveira,Costa,Rodrigues,Martins,Sousa,Fernandes,Gonçalves,Gomes,Lopes,Marques,Almeida,Ribeiro,Carvalho,Pinto,Teixeira,Moreira,Correia,Mendes,Nunes,Neves'],
    BE: ['Kevin,Thibaut,Yannick,Dries,Jan,Thomas,Axel,Youri,Leander,Hans,Timothy,Zeno,Arthur,Charles,Maxim', 'Peeters,Janssens,Maes,Jacobs,Mertens,Willems,Claes,Goossens,Wouters,De Smet,Dubois,Lambert,Dupont,Vermeulen,Hermans,Aerts,Michiels,Segers,Smets,Leroy,Claeys,Martens,Pauwels,De Backer'],
    DK: ['Mikkel,Magnus,Rasmus,Mads,Niklas,Emil,Simon,Lasse,Jacob,Henrik,Morten,Kasper,Anders,Frederik,Oliver', 'Hansen,Nielsen,Jensen,Pedersen,Andersen,Christensen,Larsen,Sørensen,Rasmussen,Jørgensen,Petersen,Madsen,Kristensen,Olsen,Thomsen,Poulsen,Johansen,Møller,Mortensen,Knudsen,Lund,Holm,Kjær,Gade'],
    HU: ['Bence,Máté,Dominik,Gergő,Ádám,Balázs,Péter,Zoltán,Richárd,Dávid,Miklós,Bendegúz,Zsolt,Patrik,Roland', 'Nagy,Kovács,Tóth,Szabó,Horváth,Varga,Kiss,Molnár,Németh,Farkas,Balogh,Papp,Lakatos,Takács,Juhász,Mészáros,Simon,Rácz,Fekete,Szilágyi,Bánhidi,Lékai,Ancsin,Bodó'],
    PL: ['Michał,Piotr,Kamil,Paweł,Arkadiusz,Szymon,Maciej,Tomasz,Adam,Jakub,Krzysztof,Mateusz,Bartosz,Przemysław,Dawid', 'Nowak,Kowalski,Wiśniewski,Wójcik,Kowalczyk,Kamiński,Lewandowski,Zieliński,Szymański,Woźniak,Dąbrowski,Kozłowski,Jankowski,Mazur,Krawczyk,Piotrowski,Grabowski,Pawłowski,Michalski,Król,Wieczorek,Jabłoński,Syprzak,Moryto'],
    SE: ['Albin,Jim,Felix,Lukas,Andreas,Hampus,Max,Oscar,Jonathan,Linus,Niclas,Mattias,Simon,Emil,Viktor', 'Andersson,Johansson,Karlsson,Nilsson,Eriksson,Larsson,Olsson,Persson,Svensson,Gustafsson,Pettersson,Jonsson,Lindberg,Lindström,Axelsson,Berg,Lundgren,Bergström,Sandberg,Forsberg,Ekberg,Wanne,Palicka,Gottfridsson']
  };
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Eigener Zufallsstrom: der Europapokal verschiebt den übrigen Spielzufall nicht
  function withRng(st, fn) { var keep = R.rng.state, e = st.euro; R.rng.state = (e.rs >>> 0) || 1; try { return fn(); } finally { e.rs = R.rng.state; R.rng.state = keep; } }
  function isolated(seed, fn) { var keep = R.rng.state; R.rng.state = (seed >>> 0) || 1; try { return fn(); } finally { R.rng.state = keep; } }

  // ---------- Ausländische Vereine einhängen ----------
  X.attach = function (st) {
    if (!st || !st.clubs || !st.players) return;
    if (Object.prototype.hasOwnProperty.call(st.clubs, X.ids[0])) return;
    X.ids.forEach(function (id) {
      Object.defineProperty(st.clubs, id, { enumerable: false, configurable: true, get: function () { return X.materialize(st, id); } });
    });
  };
  X.detach = function (st) {
    X.ids.forEach(function (id) {
      var d = Object.getOwnPropertyDescriptor(st.clubs, id);
      if (d && d.value && d.value.squadIds) d.value.squadIds.forEach(function (pid) { delete st.players[pid]; });
      delete st.clubs[id];
    });
  };
  X.targetStrength = function (st, id) { var e = st.euro; return e && e.str && e.str[id] != null ? e.str[id] : X.baseStrength(st, X.defs[id].q); };
  X.baseStrength = function (st, q) {
    var b = X.band(st); return b.med + b.span * q;
  };
  X.band = function (st) {
    var e = st.euro; if (e && e.band) return e.band;
    var s = W.clubsInLeague(st, 1).map(function (c) { return M.squadStrength(st, c); }).sort(function (a, b) { return b - a; });
    var top = s[0] || 75, med = s[Math.floor(s.length / 2)] || 68;
    return { top: top, med: med, span: Math.max(3, top - med) };
  };
  // Verein samt Kader erzeugen (fester Zufallsstrom je Verein → nach dem Laden wieder derselbe Kader)
  X.materialize = function (st, id) {
    var def = X.defs[id], target = X.targetStrength(st, id);
    var built = isolated(hash(id) ^ (st.seed || 1), function () {
      var seed0 = R.rng.state, tier = R.clamp(0.55 + def.q * 0.4, 0.2, 1);
      function gen(mean) {
        R.rng.state = seed0;
        var tmp = { clubs: {}, players: {}, nextIds: {}, world: st.world, season: st.season, settings: st.settings, seed: st.seed, euroScratch: true };
        var club = W.makeClub(tmp, [def.name, def.short, def.city, def.colors[0], def.colors[1], 1, tier, def.fans], def.idx);
        W.genSquad(tmp, club, mean);
        return { club: club, tmp: tmp, s: M.squadStrength(tmp, club) };
      }
      var g = gen(target);
      if (Math.abs(g.s - target) > 0.4) g = gen(target + (target - g.s));
      // Namen aus dem Land des Vereins
      var nm = NAMES[def.country];
      if (nm) { var fn = nm[0].split(','), ln = nm[1].split(','); Object.keys(g.tmp.players).forEach(function (k) { var p = g.tmp.players[k]; p.first = R.pick(fn); p.last = R.pick(ln); }); }
      return g;
    });
    var club = built.club, squad = Object.keys(built.tmp.players).map(function (k) { return built.tmp.players[k]; }).filter(function (p) { return !p.youth; });
    club.id = id; club.foreign = true; club.country = def.country; club.countryName = def.countryName; club.geo = def.geo; club.league = 1;
    club.expectedPos = R.clamp(Math.round(9 - def.q * 8), 1, 18); club.leagueSize = 18; club.fans = def.fans; club.rivals = []; club.friends = [];
    club.reputation = R.clamp(Math.round(62 + def.q * 34), 20, 99);
    club.squadIds = squad.map(function (p, i) {
      p.id = id + 'p' + (i + 1); p.clubId = id; p.foreignClub = true; p.homegrown = false; p.listed = false;
      Object.defineProperty(st.players, p.id, { enumerable: false, configurable: true, writable: true, value: p });
      return p.id;
    });
    Object.defineProperty(club, 'crestImage', { enumerable: true, configurable: true, get: function () { return X.logo(def); }, set: function () {} });
    Object.defineProperty(st.clubs, id, { enumerable: false, configurable: true, writable: true, value: club });
    return club;
  };

  // ---------- Saisonstart: Teilnehmer und Gruppen ----------
  X.homeQualifiers = function (st) {
    var l1 = W.clubsInLeague(st, 1), set = {}; l1.forEach(function (c) { set[c.id] = 1; });
    var ft = st.finalTables && st.finalTables[1], ids = [];
    if (ft && st.history && st.history.length) ids = ft.filter(function (id) { return set[id]; }).slice(0, 8);
    if (ids.length < 8) {
      // erste Saison bzw. Lücken: nach Kaderstärke auffüllen
      l1.slice().sort(function (a, b) { return M.squadStrength(st, b) - M.squadStrength(st, a); }).forEach(function (c) { if (ids.length < 8 && ids.indexOf(c.id) < 0) ids.push(c.id); });
    }
    // Pokalsieger: automatisch in der Top-Liga (Platz 8 rückt dafür heraus), wenn er nicht ohnehin dabei ist
    var lastH = st.history && st.history.length ? st.history[st.history.length - 1] : null, cw = lastH && lastH.cup;
    X.cupQual = null;
    if (cw && st.clubs[cw] && !st.clubs[cw].foreign && ids.length >= 8 && ids.slice(0, 8).indexOf(cw) < 0) { ids = ids.slice(0, 7).concat([cw]); X.cupQual = cw; }
    return ids;
  };
  X.venueIdx = function (season, k) { return ((season || 0) * 3 + (k === 'tl' ? 7 : 0)) % C.venues.length; };
  X.venue = function (st, k) { var c = st.euro && st.euro[k], v = C.venues[c && c.venue != null ? c.venue : X.venueIdx(st.season, k)]; return { name: v[0], city: v[1], country: v[2], cap: v[3] }; };
  function earnText(st, id) { var g = S.compEarn(st, 'euro').gate; return S.earnText(X.earned(st, id), g); }
  function pay(st, id, amount) { if (X.defs[id] || !(amount > 0)) return; var c = st.clubs[id]; if (!c) return; amount = Math.round(amount); c.cash += amount; E.book(c, 'Prämien', amount); var e = st.euro; if (e) { e.earn = e.earn || {}; e.earn[id] = (e.earn[id] || 0) + amount; } }
  function groupFixtures(t) {
    var a = t[0], b = t[1], c = t[2], d = t[3];
    return [[[a, d], [b, c]], [[c, a], [d, b]], [[a, b], [d, c]], [[b, a], [c, d]], [[a, c], [b, d]], [[d, a], [c, b]]]
      .map(function (md) { return md.map(function (f) { return { h: f[0], a: f[1], r: null }; }); });
  }
  X.startSeason = function (st) {
    var hist = (st.euro && st.euro.hist) || [];
    X.detach(st);
    if (W.clubsInLeague(st, 1).length < 8) { st.euro = { season: st.season, off: true, hist: hist }; return; }
    var ger = X.homeQualifiers(st);
    st.euro = { season: st.season, rs: hash('euro' + st.season) ^ (st.seed || 1), str: {}, hist: hist };
    st.euro.band = X.band(st);
    st.euro.cupQ = X.cupQual || null;
    if (st.euro.cupQ && S.news) S.news(st, 'Pokalsieger in der Top-Liga', st.clubs[st.euro.cupQ].name + ' spielt als Pokalsieger in der Top-Liga. Der Achte der Liga ist dafür nicht dabei.', 'liga');
    withRng(st, function () {
      var e = st.euro, lists = { ml: [ger.slice(0, 4)], tl: [ger.slice(4, 8)] };
      C.countries.forEach(function (co) {
        var ranked = X.byCountry[co.k].map(function (id) { return { id: id, v: X.defs[id].q + R.gauss(0, 0.16) }; }).sort(function (a, b) { return b.v - a.v; }).map(function (x) { return x.id; });
        ranked.forEach(function (id) { e.str[id] = Math.round((X.baseStrength(st, X.defs[id].q) + R.gauss(0, 0.5)) * 10) / 10; });
        lists.ml.push(ranked.slice(0, 4)); lists.tl.push(ranked.slice(4, 8));
      });
      X.COMPS.forEach(function (k) {
        // Je Gruppe vier Vereine aus vier verschiedenen Ländern, je einer aus jedem Setztopf (Platz im Heimatland)
        var cs = R.shuffle(lists[k].slice()), off = R.shuffle([0, 1, 2, 3, 4, 5, 6, 7]).slice(0, 4), groups = [];
        for (var g = 0; g < 8; g++) {
          var ids = []; for (var r = 0; r < 4; r++) ids.push(cs[(g + off[r]) % 8][r]);
          ids = R.shuffle(ids);
          groups.push({ ids: ids, md: groupFixtures(ids) });
        }
        e[k] = { key: k, teams: [].concat.apply([], lists[k]), groups: groups, ko: [], winner: null, venue: X.venueIdx(st.season, k) };
      });
    });
    X.attach(st);
    X.COMPS.forEach(function (k) { st.euro[k].teams.forEach(function (id) { pay(st, id, C.prize[k].start); }); });
    var uc = S.userClub(st), mine = uc && X.compOf(st, uc.id);
    if (mine) {
      var gi = X.groupOf(st, mine, uc.id), g = st.euro[mine].groups[gi], v = X.venue(st, mine);
      S.news(st, X.NAMES[mine] + ': ' + uc.short + ' in Gruppe ' + X.GROUP_LETTERS[gi],
        'Die Gegner: ' + g.ids.filter(function (id) { return id !== uc.id; }).map(function (id) { var t = X.info(st, id); return t.name + ' (' + X.countryOf(st, id) + ')'; }).join(', ') +
        '. Startprämie: ' + R.fmtMoney(C.prize[mine].start) + '. ' + (C.final4 ? 'Das Final 4 steigt in ' : 'Das Finale steigt in ') + v.city + ' (' + v.name + ').', 'liga');
    }
  };
  // Ältere Spielstände ohne Europapokal: vor dem ersten Gruppenspieltag nachträglich starten, sonst ab der nächsten Saison
  X.ensure = function (st) {
    if (!st || !st.clubs) return;
    if (!st.euro || st.euro.season !== st.season) {
      if (st.phase === 'preseason' || (st.phase === 'season' && st.week < X.GROUP_WEEKS[0] - 1)) X.startSeason(st);
      else st.euro = { season: st.season, off: true, hist: (st.euro && st.euro.hist) || [] };
    }
    X.attach(st);
  };
  X.active = function (st) { return !!(st.euro && !st.euro.off && st.euro.season === st.season); };
  X.compOf = function (st, id) { if (!X.active(st)) return null; return st.euro.ml.teams.indexOf(id) >= 0 ? 'ml' : st.euro.tl.teams.indexOf(id) >= 0 ? 'tl' : null; };
  X.groupOf = function (st, k, id) { var gs = st.euro[k].groups; for (var i = 0; i < gs.length; i++) if (gs[i].ids.indexOf(id) >= 0) return i; return -1; };

  // ---------- Tabelle einer Gruppe ----------
  X.table = function (st, k, gi) {
    var g = st.euro[k].groups[gi], rows = {};
    g.ids.forEach(function (id) { rows[id] = { id: id, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }; });
    g.md.forEach(function (md) { md.forEach(function (f) {
      if (!f.r) return; var h = rows[f.h], a = rows[f.a];
      h.p++; a.p++; h.gf += f.r.hg; h.ga += f.r.ag; a.gf += f.r.ag; a.ga += f.r.hg;
      if (f.r.hg > f.r.ag) { h.w++; a.l++; } else if (f.r.hg < f.r.ag) { a.w++; h.l++; } else { h.d++; a.d++; }
    }); });
    var win = D.euro.sport === 'handball' ? 2 : 3;
    return g.ids.map(function (id) { var r = rows[id]; r.pts = r.w * win + r.d; return r; })
      .sort(function (a, b) { return b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf || (X.info(st, a.id).name < X.info(st, b.id).name ? -1 : 1); });
  };
  X.groupsDone = function (st, k) { return st.euro[k].groups.every(function (g) { return g.md.every(function (md) { return md.every(function (f) { return f.r; }); }); }); };

  // ---------- Spiele der Woche ----------
  X.legsOf = function (ri) { var d = X.ROUNDS[ri]; return d.w && d.w.length === 2 ? 2 : 1; };
  // week: Spielwoche (Standard: die kommende Woche); day2: Finaltag des Final 4
  X.weekFixtures = function (st, day2, week) {
    var out = []; if (!X.active(st) || st.phase !== 'season') return out;
    var e = st.euro; week = week || st.week + 1;
    X.COMPS.forEach(function (k) {
      var c = e[k], gi = day2 ? -1 : X.GROUP_WEEKS.indexOf(week);
      if (gi >= 0) c.groups.forEach(function (g, gx) { g.md[gi].forEach(function (f, fi) {
        if (!f.r) out.push({ key: 'E-' + k + '-g-' + gx + '-' + gi + '-' + fi, comp: 'euro', euro: k, h: f.h, a: f.a, grp: gx, md: gi });
      }); });
      c.ko.forEach(function (rd, ri) {
        var def = X.ROUNDS[ri], leg = day2 ? (def.day2 ? 0 : -1) : (def.w ? def.w.indexOf(week) : -1), legs = X.legsOf(ri);
        if (leg < 0) return;
        rd.ties.forEach(function (t, ti) {
          if (t.r[leg] || t.winner) return;
          var second = leg === 1;
          out.push({ key: 'E-' + k + '-k-' + ri + '-' + ti + '-' + leg, comp: 'euro', euro: k, h: second ? t.a : t.h, a: second ? t.h : t.a, round: ri, leg: leg, legs: legs,
            neutral: !!def.neutral, venue: def.neutral ? X.venue(st, k) : null, extraTime: second || legs === 1, aggregate: second && t.r[0] ? [t.r[0].ag, t.r[0].hg] : null });
        });
      });
    });
    return out;
  };
  // Final 4 (Handball): Finale als eigener Finaltag direkt nach dem Halbfinale
  X.finalOpen = function (st) {
    if (!C.final4 || !X.active(st)) return false;
    return X.COMPS.some(function (k) { var rd = st.euro[k].ko[3]; return rd && !rd.ties[0].winner; });
  };
  X.label = function (st, fx) {
    var n = X.NAMES[fx.euro];
    if (fx.grp != null) return n + ' – Gruppe ' + X.GROUP_LETTERS[fx.grp] + ', ' + (fx.md + 1) + '. Spieltag';
    var d = X.ROUNDS[fx.round];
    if (d.f4) return n + ' – Final 4, ' + d.n;
    return n + ' – ' + d.n + (fx.legs === 2 ? (fx.leg ? ', Rückspiel' : ', Hinspiel') : '');
  };
  // Was es in diesem Spiel zu verdienen gibt (für die Spielankündigung)
  X.prizeText = function (fx) {
    var P = C.prize[fx.euro];
    if (fx.grp != null) return 'Sieg ' + R.fmtMoney(P.win) + ' · Unentschieden ' + R.fmtMoney(P.draw);
    if (fx.round === 3) return 'Titelprämie ' + R.fmtMoney(P.title);
    if (fx.legs === 2 && fx.leg === 0) return 'Weiterkommen ' + R.fmtMoney(P.ko[fx.round + 1]);
    return 'Weiterkommen ' + R.fmtMoney(P.ko[fx.round + 1]);
  };
  X.earned = function (st, id) { return (st.euro && st.euro.earn && st.euro.earn[id]) || 0; };
  X.shortLabel = function (fx) { return fx.euro === 'ml' ? 'ML' : 'TL'; };

  // ---------- Ergebnis eintragen ----------
  X.store = function (st, key, sum) {
    var p = key.split('-'), k = p[1], c = st.euro[k], r = { hg: sum.hg, ag: sum.ag }, P = C.prize[k];
    if (sum.pens) r.pens = sum.pens;
    if (p[2] === 'g') {
      var f = c.groups[+p[3]].md[+p[4]][+p[5]]; f.r = r;
      if (r.hg === r.ag) { pay(st, f.h, P.draw); pay(st, f.a, P.draw); } else pay(st, r.hg > r.ag ? f.h : f.a, P.win);
      return;
    }
    var ri = +p[3], t = c.ko[ri].ties[+p[4]], leg = +p[5];
    t.r[leg] = r;
    if (X.legsOf(ri) === 1) {
      if (r.hg === r.ag && !r.pens) r.pens = withRng(st, C.shootout);
      t.winner = (r.pens ? r.pens[0] > r.pens[1] : r.hg > r.ag) ? t.h : t.a;
    } else if (leg === 1) {
      // Rückspiel: Heimrecht hat t.a
      var ga = t.r[0].ag + r.hg, gh = t.r[0].hg + r.ag;
      if (ga === gh && !r.pens) r.pens = withRng(st, C.shootout);
      t.winner = ga !== gh ? (ga > gh ? t.a : t.h) : (r.pens[0] > r.pens[1] ? t.a : t.h);
    }
  };
  X.strengthOf = function (st, id) { return X.defs[id] ? X.targetStrength(st, id) : M.squadStrength(st, st.clubs[id]); };
  // Alle noch offenen Europapokalspiele der Woche als Schnellergebnis (Spiele des Nutzers sind dann schon eingetragen)
  X.simWeek = function (st, day2, week) {
    if (!X.active(st)) return [];
    var res = [];
    X.weekFixtures(st, day2, week).forEach(function (fx) {
      var r = withRng(st, function () { return C.quick(X.strengthOf(st, fx.h), X.strengthOf(st, fx.a), fx.neutral); });
      X.store(st, fx.key, r); res.push({ fx: fx, r: r });
    });
    X.advance(st);
    return res;
  };

  // ---------- Runden weiterführen ----------
  X.advance = function (st) {
    if (!X.active(st)) return;
    X.COMPS.forEach(function (k) {
      var c = st.euro[k]; if (c.winner) return;
      if (!c.ko.length) { if (X.groupsDone(st, k)) X.drawKO(st, k, 0); return; }
      var ri = c.ko.length - 1;
      if (!c.ko[ri].ties.every(function (t) { return t.winner; })) return;
      if (ri < 3) X.drawKO(st, k, ri + 1); else X.finished(st, k);
    });
  };
  X.drawKO = function (st, k, ri) {
    var c = st.euro[k], def = X.ROUNDS[ri], ties = [], uc = S.userClub(st), legs = X.legsOf(ri);
    function tie(h, a) { return { h: h, a: a, r: legs === 2 ? [null, null] : [null], winner: null }; }
    withRng(st, function () {
      if (ri === 0) {
        // Gruppensieger gegen einen Gruppenzweiten einer anderen Gruppe; der Gruppensieger hat im Rückspiel Heimrecht
        var first = [], second = [], shift = R.randInt(1, 7);
        c.groups.forEach(function (g, gi) { var t = X.table(st, k, gi); first.push(t[0].id); second.push(t[1].id); });
        for (var g = 0; g < 8; g++) ties.push(tie(second[(g + shift) % 8], first[g]));
        c.out = c.out || {};
      } else {
        var adv = R.shuffle(c.ko[ri - 1].ties.map(function (t) { return t.winner; }));
        for (var i = 0; i + 1 < adv.length; i += 2) ties.push(tie(adv[i], adv[i + 1]));
      }
    });
    c.ko.push({ name: def.n, ties: ties });
    ties.forEach(function (t) { pay(st, t.h, C.prize[k].ko[ri]); pay(st, t.a, C.prize[k].ko[ri]); });
    if (!uc || c.teams.indexOf(uc.id) < 0) return;
    var mine = ties.filter(function (t) { return t.h === uc.id || t.a === uc.id; })[0], n = X.NAMES[k], v = X.venue(st, k);
    if (mine) {
      var opp = X.info(st, mine.h === uc.id ? mine.a : mine.h);
      S.news(st, n + ': ' + def.n + ' gegen ' + opp.short + '!', uc.name + ' trifft im ' + def.n + ' der ' + n + ' auf ' + opp.name + ' (' + X.countryOf(st, opp.id) + '). ' +
        (def.neutral ? 'Gespielt wird ' + (def.f4 ? 'beim Final 4 ' : '') + 'in ' + v.city + ' (' + v.name + ', ' + R.fmtNum(v.cap) + ' Plätze). ' : legs === 2 ? (mine.a === uc.id ? 'Das Rückspiel findet zu Hause statt. ' : 'Das Hinspiel findet zu Hause statt. ') : '') +
        'Wir haben das ' + def.n + ' erreicht – die Prämie von ' + R.fmtMoney(C.prize[k].ko[ri]) + ' wurde überwiesen.', 'liga');
    } else if (ri === 0) {
      var gi = X.groupOf(st, k, uc.id), pos = X.table(st, k, gi).map(function (r) { return r.id; }).indexOf(uc.id) + 1;
      S.news(st, n + ': Aus in der Gruppenphase', uc.name + ' beendet die Gruppe ' + X.GROUP_LETTERS[gi] + ' auf Platz ' + pos + ' und scheidet aus dem Europapokal aus. Unsere Reise endet leider in der Gruppenphase. ' + earnText(st, uc.id), 'liga');
    } else {
      var lost = c.ko[ri - 1].ties.filter(function (t) { return t.h === uc.id || t.a === uc.id; })[0];
      if (lost) S.news(st, n + ': Endstation ' + X.ROUNDS[ri - 1].n, uc.name + ' scheidet im ' + X.ROUNDS[ri - 1].n + ' gegen ' + X.info(st, lost.winner).name + ' aus. Unsere Reise endet leider ' + S.inRound(X.ROUNDS[ri - 1].n) + '. ' + earnText(st, uc.id), 'liga');
    }
  };
  X.finished = function (st, k) {
    var c = st.euro[k], fin = c.ko[3].ties[0], w = X.info(st, fin.winner), l = X.info(st, fin.winner === fin.h ? fin.a : fin.h), r = fin.r[0], v = X.venue(st, k), n = X.NAMES[k];
    c.winner = fin.winner;
    pay(st, fin.winner, C.prize[k].title);
    st.hall.euro = st.hall.euro || [];
    st.hall.euro.push({ season: st.season, comp: k, club: w.name, clubId: w.id, city: v.city });
    st.euro.hist.push({ season: st.season, comp: k, club: w.name, city: v.city });
    S.news(st, n.toUpperCase() + ': ' + w.name + ' triumphiert in ' + v.city + '!', 'Finale in ' + v.name + ': ' + X.info(st, fin.h).short + ' – ' + X.info(st, fin.a).short + ' ' + r.hg + ':' + r.ag +
      (r.pens ? ' (' + C.shootoutText + ' ' + r.pens[0] + ':' + r.pens[1] + ')' : '') + '. ' + l.name + ' bleibt nur der zweite Platz.', 'titel');
    var uc = S.userClub(st);
    if (uc && (fin.h === uc.id || fin.a === uc.id)) {
      if (fin.winner === uc.id) S.news(st, n + ': Titelprämie überwiesen', 'Für den Titel wurden ' + R.fmtMoney(C.prize[k].title) + ' überwiesen. ' + earnText(st, uc.id), 'liga');
      else S.news(st, n + ': Unsere Reise endet erst im Finale', 'Im Endspiel war gegen ' + w.name + ' Schluss – trotzdem eine Saison zum Erinnern. ' + earnText(st, uc.id), 'liga');
      if (S.celebrate) { var wonF = fin.winner === uc.id, oppId = fin.h === uc.id ? fin.a : fin.h;
        S.celebrate(st, { kind: k, win: wonF, club: uc.id, opp: oppId, oppName: X.info(st, oppId).name, res: S.resFor(r, fin.h === uc.id), city: v.city, prize: wonF ? C.prize[k].title : 0, earn: X.earned(st, uc.id) + S.compEarn(st, 'euro').gate }); }
    }
    if (X.defs[fin.winner]) return;
    var club = st.clubs[fin.winner];
    club.titles.euro = (club.titles.euro || 0) + 1;
    club.history.push({ season: st.season, type: 'titel', text: n + '-Sieger' });
    if (club.userControlled) {
      S.achieve(st, k === 'ml' ? 'meisterliga' : 'topliga');
      st.manager.reputation = R.clamp(st.manager.reputation + (k === 'ml' ? 10 : 6), 0, 100);
      var mh = st.manager.history[st.manager.history.length - 1]; if (mh && mh.titles) mh.titles.push(n + ' ' + st.season);
    }
  };

  // Stand des Nutzers in seinem Wettbewerb: { k, text }
  X.userStatus = function (st) {
    var uc = S.userClub(st), k = uc && X.compOf(st, uc.id); if (!k) return null;
    var c = st.euro[k], text;
    if (c.winner === uc.id) text = 'Sieger';
    else if (!c.ko.length) { var gi = X.groupOf(st, k, uc.id), pos = X.table(st, k, gi).map(function (r) { return r.id; }).indexOf(uc.id) + 1; text = 'Gruppe ' + X.GROUP_LETTERS[gi] + ' · Platz ' + pos; }
    else {
      var last = -1; c.ko.forEach(function (rd, ri) { if (rd.ties.some(function (t) { return t.h === uc.id || t.a === uc.id; })) last = ri; });
      if (last < 0) text = 'In der Gruppenphase ausgeschieden';
      else { var t = c.ko[last].ties.filter(function (x) { return x.h === uc.id || x.a === uc.id; })[0]; text = t.winner && t.winner !== uc.id ? 'Im ' + X.ROUNDS[last].n + ' ausgeschieden' : X.ROUNDS[last].n; }
    }
    return { k: k, text: text };
  };
})(RFM);
