// ANWURF! – Oberfläche: Vereinsmanagement, Stadion, Vereinsstadt, Bank & Finanzen
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;

  // ---------- Vereinsmanagement (Kacheln, Details in Fenstern) ----------
  var SP_IC = { haupt: '🏆', trikot: '👕', aermel: '🎽', ausruester: '👟', namensrechte: '🏟️', bande: '📢' };
  var BUD_IC = { admin: '🗄️', marketing: '📣', fans: '🤝', scouting: '🔭', trainorg: '📅' };
  var BUD_FX = {
    admin: ['Sponsorenkonditionen', 'Bessere Verträge mit Sponsoren (bis +6 %).'],
    marketing: ['Fanwachstum & Sponsoren', 'Mehr neue Fans pro Saison und etwas höhere Sponsorenangebote.'],
    fans: ['Zuschauer & Fanbindung', 'Mehr Zuschauer, stabileres Fanvertrauen.'],
    scouting: ['Talente & Potenzial', 'Genauere Potenzialangaben; auf „Premium“ ein zusätzliches Talent je Jahrgang.'],
    trainorg: ['Spielerentwicklung', 'Training wirkt bis zu 10 % besser bzw. schlechter.']
  };
  U.stars = function (n, max) { var s = ''; for (var i = 1; i <= max; i++) s += i <= n ? '★' : '<span class="off">★</span>'; return '<span class="stars">' + s + '</span>'; };
  // Cheftrainer: Ist der Nutzer Manager oder Trainer, steht sein eigener Name an der Seitenlinie
  U.coachName = function (c) {
    var st = U.st;
    if (c && c.userControlled && st && !st.manager.unemployed && (st.manager.role === 'manager' || st.manager.role === 'trainer')) return st.manager.name;
    return c && c.coach ? c.coach.name : '–';
  };
  // Firmenlogo (selbst gezeichnet aus dem Namen – keine echten Marken)
  var LOGO_IC = [[/versicher|optimus|insolvenz/i, '🛡️'], [/brauerei|bier|brauhaus/i, '🍺'], [/bäcker|backer/i, '🥨'], [/auto|kfz|turbo|rastst/i, '🚗'], [/energie|solar|strom|flutlicht|elektro/i, '⚡'], [/telekom/i, '📡'], [/software|pixel|tech/i, '💻'], [/logistik|spedition|versand/i, '🚚'], [/wasser|quell/i, '💧'], [/wurst|würst|kartoffel|pommes|nudel|feinkost/i, '🍽️'], [/kredit|sparkasse|bank/i, '💶'], [/möbel/i, '🛋️'], [/optik|brille/i, '👓'], [/reise/i, '✈️'], [/schuh/i, '👟'], [/friseur|haar/i, '✂️'], [/zahn/i, '🦷'], [/baumarkt|schraube/i, '🔨'], [/kohle|stahl/i, '⚙️'], [/getränk/i, '🥤']];
  var LOGO_COL = [['#1d4ed8', '#60a5fa'], ['#b91c1c', '#f87171'], ['#047857', '#34d399'], ['#7c3aed', '#c4b5fd'], ['#c2410c', '#fdba74'], ['#0f766e', '#5eead4'], ['#a16207', '#fde047'], ['#be185d', '#f9a8d4'], ['#334155', '#cbd5e1']];
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  U.brandLogo = function (name, size, isKit) {
    size = size || 64; name = String(name || '?');
    var h = hashStr(name), col = LOGO_COL[h % LOGO_COL.length], shape = (h >> 4) % 3, ic = isKit ? '👕' : '';
    if (!ic) for (var i = 0; i < LOGO_IC.length; i++) if (LOGO_IC[i][0].test(name)) { ic = LOGO_IC[i][1]; break; }
    var words = name.replace(/[&.,]/g, ' ').split(/\s+/).filter(function (w) { return w && !/^(AG|GmbH|SE|und|&|Zum|Der|Die|Das|Holding)$/i.test(w); });
    var ini = esc(((words[0] || '?').charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase());
    var id = 'lg' + h, bg = shape === 0 ? '<rect x="4" y="4" width="92" height="92" rx="22" fill="url(#' + id + ')"/>' : shape === 1 ? '<circle cx="50" cy="50" r="46" fill="url(#' + id + ')"/>' : '<path d="M50 4 L92 18 V52 Q92 82 50 96 Q8 82 8 52 V18 Z" fill="url(#' + id + ')"/>';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" aria-label="' + esc(name) + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + col[1] + '"/><stop offset="1" stop-color="' + col[0] + '"/></linearGradient></defs>' + bg +
      '<path d="M14 30 Q50 10 86 30" stroke="rgba(255,255,255,.35)" stroke-width="3" fill="none"/>' +
      (ic ? '<text x="50" y="50" font-size="30" text-anchor="middle">' + ic + '</text><text x="50" y="84" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" font-family="-apple-system,system-ui,sans-serif" letter-spacing="1">' + ini + '</text>' : '<text x="50" y="64" font-size="34" font-weight="900" text-anchor="middle" fill="#fff" font-family="Menlo,monospace">' + ini + '</text>') + '</svg>';
  };

  U.screens.verein = function () {
    var st = U.st, c = U.club();
    var h = '<h1 class="row" style="gap:10px">' + U.crest(c, 34) + 'Vereinsmanagement</h1>' + U.roleNote('business');
    // Sponsoren
    h += '<div class="sec-h">🤝 Sponsoren <span class="tv" style="margin-left:auto;color:var(--text)">' + money(E.sponsorTotal(c)) + '/J.</span></div><div class="tiles">' + Object.keys(D.sponsorCategories).map(function (cat) {
      var s = c.sponsors.filter(function (x) { return x.cat === cat; })[0], off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0];
      return '<div class="tile' + (s ? '' : ' empty') + '" data-act="sponsorOpen" data-k="' + cat + '">' + (off ? '<span class="tb">' + off.offers.length + ' Angebote</span>' : '') +
        '<div class="row-ic"><span class="ti">' + SP_IC[cat] + '</span><div><div class="tt">' + D.sponsorCategories[cat] + '</div><div class="ts">' + (s ? s.years + ' J. Laufzeit' : 'offen') + '</div></div></div>' +
        (s ? '<div class="row-ic">' + U.brandLogo(s.name, 34, cat === 'ausruester') + '<span class="ts" style="color:var(--text)">' + esc(s.name) + '</span></div><div class="tv">' + money(s.amount) + '</div>' : '<div class="ts">Antippen: Angebote vergleichen</div>') + '</div>';
    }).join('') + '</div>';
    // Trainerteam
    var lvlSum = 0; Object.keys(D.staff).forEach(function (k) { lvlSum += E.staffLvl(c, k); });
    h += '<div class="sec-h">📋 Trainerteam <span class="ts" style="margin-left:auto">Personalkosten ' + money((c.coach ? c.coach.wage : 0) + E.staffWages(c)) + '/J.</span></div><div class="tiles">' +
      '<div class="tile" data-act="coachOpen"><div class="row-ic"><span class="ti">🧑‍💼</span><div><div class="tt">Cheftrainer</div><div class="ts">' + esc(c.coach.profile) + '</div></div></div><div class="tt" style="font-size:15px">' + esc(U.coachName(c)) + '</div><div class="tv">' + U.stars(Math.round(c.coach.quality / 20), 5) + '</div></div>' +
      Object.keys(D.staff).map(function (k) {
        var s = c.staff && c.staff[k], l = s ? s.lvl : 0;
        return '<div class="tile' + (l ? '' : ' empty') + '" data-act="staffOpen" data-k="' + k + '"><div class="row-ic"><span class="ti">' + D.staff[k].ic + '</span><div><div class="tt">' + D.staff[k].n + '</div><div class="ts">' + (s ? esc(s.name) : 'nicht besetzt') + '</div></div></div><div class="tv">' + U.stars(l, 3) + (s ? ' <span class="ts">' + money(s.wage) + '</span>' : '') + '</div></div>';
      }).join('') + '</div>';
    // Verwaltung
    h += '<div class="sec-h">🏢 Verwaltung</div><div class="tiles">' + Object.keys(D.budgetAreas).map(function (a) {
      return '<div class="tile" data-act="budgetOpen" data-k="' + a + '"><div class="row-ic"><span class="ti">' + BUD_IC[a] + '</span><div><div class="tt">' + D.budgetAreas[a] + '</div><div class="ts">' + BUD_FX[a][0] + '</div></div></div><div class="tv">' + D.budgetLevels[c.budgets[a]] + ' <span class="ts">' + money(E.budgetCost(c, a)) + '</span></div></div>';
    }).join('') + '</div>';
    // Vereinsdaten
    h += '<div class="sec-h">📊 Verein</div><div class="grid g4">' + U.ikpi('star', 'Reputation', Math.round(c.reputation) + '/100', '', U.bar(c.reputation)) + U.ikpi('fans', 'Fanbasis', R.fmtNum(c.fans)) +
      U.ikpi('trophy', 'Titel', c.titles.league + ' · ' + c.titles.cup + ' · ' + c.titles.promo, '', '<div class="ts muted small">Meister · Pokal · Aufstiege</div>') + U.ikpi('stadium', 'Zuschauerrekord', R.fmtNum(c.records.attendance)) + '</div>';
    h += U.dealPanel(c);
    return h;
  };
  // Sponsorenfenster: bestehender Vertrag bzw. drei Angebote nebeneinander
  U.acts.sponsorOpen = function (d) {
    var st = U.st, c = U.club(), cat = d.k, can = U.can('business');
    var s = c.sponsors.filter(function (x) { return x.cat === cat; })[0], off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0];
    if (!s && !off && can) { U.acts.sponsorSearch({ k: cat }, true); off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0]; }
    var title = SP_IC[cat] + ' ' + D.sponsorCategories[cat], h = '';
    function rows(x) { return [['Pro Jahr', x.amount], ['Laufzeit', x.years], ['Gesamtwert', x.amount * x.years], ['Bonus Top-' + x.topN, x.bonusTop], ['Bonus Aufstieg', x.bonusPromo], ['Bonus Meister', x.bonusTitle]]; }
    if (s) {
      h += '<div class="cmp"><div class="cmp-card best"><div class="logo">' + U.brandLogo(s.name, 84, cat === 'ausruester') + '</div><b>' + esc(s.name) + '</b><span class="tag green">Laufender Vertrag</span><table>' + rows(s).map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + (r[0] === 'Laufzeit' ? r[1] + ' J.' : money(r[1])) + '</td></tr>'; }).join('') + '</table></div></div><p class="muted small" style="margin-top:10px">Läuft der Vertrag aus, können Sie hier neue Angebote einholen.</p>';
      U.modal(title, h, '<button class="primary" data-act="closeModal">Schließen</button>');
      return;
    }
    if (!off) { U.modal(title, '<p class="muted">Keine Angebote.</p>'); return; }
    var all = off.offers.map(rows), best = all[0].map(function (r, j) { return Math.max.apply(null, all.map(function (x) { return x[j][1]; })); });
    var bestTotal = Math.max.apply(null, off.offers.map(function (x) { return x.amount * x.years; }));
    h += '<div class="cmp">' + off.offers.map(function (x, i) {
      return '<div class="cmp-card' + (x.amount * x.years === bestTotal ? ' best' : '') + '"><div class="logo">' + U.brandLogo(x.name, 84, cat === 'ausruester') + '</div><b>' + esc(x.name) + '</b><table>' + all[i].map(function (r, j) { return '<tr><td>' + r[0] + '</td><td class="' + (r[1] === best[j] && j !== 1 ? 'top' : '') + '">' + (j === 1 ? r[1] + ' J.' : money(r[1])) + '</td></tr>'; }).join('') + '</table>' +
        (can ? '<button class="primary" data-act="sponsorPick" data-id="' + off.id + '" data-i="' + i + '">Unterschreiben</button>' : '') + '</div>';
    }).join('') + '</div><p class="muted small" style="margin-top:10px">★ = bester Wert. Höhe der Angebote: Liga, Ruf, Fanbasis, Erfolg; Verwaltung und Marketing auf „Premium“ verbessern die Konditionen.</p>';
    U.modal(title + ' – Angebote vergleichen', h, (can ? '<button data-act="sponsorRefresh" data-k="' + cat + '">Neue Angebote einholen</button>' : '') + '<button data-act="closeModal">Später</button>', true);
  };
  U.acts.sponsorPick = function (d) { S.acceptSponsor(U.st, d.id, +d.i); U.closeModal(); U.render(); U.toast('Vertrag unterschrieben!'); };
  U.acts.sponsorSearch = function (d, silent) {
    var st = U.st, c = U.club();
    st.inbox = st.inbox.filter(function (o) { return !(o.type === 'sponsor' && o.cat === d.k); });
    st.inbox.push({ id: W.nextId(st, 'offer'), type: 'sponsor', cat: d.k, offers: E.sponsorOffers(st, c, d.k), season: st.season, week: st.week });
    if (!silent) U.render();
  };
  U.acts.sponsorRefresh = function (d) { U.acts.sponsorSearch(d, true); U.acts.sponsorOpen(d); U.render(); };
  // Verwaltungsbudget-Fenster
  U.acts.budgetOpen = function (d) {
    var c = U.club(), a = d.k, can = U.can('business');
    var h = '<p class="small">' + BUD_FX[a][1] + '</p><div class="cmp">' + D.budgetLevels.map(function (l, i) {
      var old = c.budgets[a]; c.budgets[a] = i; var cost = E.budgetCost(c, a); c.budgets[a] = old;
      return '<div class="cmp-card' + (c.budgets[a] === i ? ' best' : '') + '"><div class="ti" style="font-size:34px">' + ['🪙', '💼', '💎'][i] + '</div><b>' + l + '</b><div class="tv mono">' + money(cost) + '/J.</div><div class="ts small muted">' + ['Spart Geld, leichte Nachteile', 'Ausgewogen', 'Teuer, spürbare Vorteile'][i] + '</div>' +
        (c.budgets[a] === i ? '<span class="tag green">aktiv</span>' : can ? '<button class="primary sm" data-act="budgetSet" data-k="' + a + '" data-v="' + i + '">Wählen</button>' : '') + '</div>';
    }).join('') + '</div>';
    U.modal(BUD_IC[a] + ' ' + D.budgetAreas[a], h, '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.budgetSet = function (d) { U.club().budgets[d.k] = +d.v; U.acts.budgetOpen(d); U.render(); };
  U.acts.budget = U.acts.budgetSet;
  // Trainerstab-Fenster
  U.acts.staffOpen = function (d) {
    var st = U.st, c = U.club(), k = d.k, def = D.staff[k], cur = E.staffLvl(c, k), can = U.can('business') || U.can('sport');
    var h = '<p class="small">' + def.d + ' <b>Wirkung:</b> ' + def.eff + '.</p><div class="cmp">' + D.staffLevels.map(function (l, i) {
      return '<div class="cmp-card' + (cur === i ? ' best' : '') + '"><div>' + U.stars(i, 3) + '</div><b>' + l + '</b><div class="tv mono">' + (i ? money(E.staffWageFor(c, i)) + '/J.' : '–') + '</div>' +
        (cur === i ? '<span class="tag green">' + (i ? esc(c.staff[k].name) : 'aktuell') + '</span>' : can ? '<button class="' + (i ? 'primary' : '') + ' sm" data-act="staffSet" data-k="' + k + '" data-v="' + i + '">' + (i ? (cur ? 'Wechseln' : 'Einstellen') : 'Entlassen') + '</button>' : '') + '</div>';
    }).join('') + '</div><p class="muted small" style="margin-top:10px">Bei einem Wechsel oder einer Entlassung fällt eine Abfindung von einem Vierteljahresgehalt an.</p>';
    U.modal(def.ic + ' ' + def.n, h, '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.staffSet = function (d) { var r = E.setStaff(U.st, U.club(), d.k, +d.v); if (r.ok) U.toast(+d.v ? D.staff[d.k].n + ' ' + r.s.name + ' eingestellt.' : D.staff[d.k].n + ' entlassen.'); U.acts.staffOpen(d); U.render(); };
  U.acts.coachOpen = function () {
    var st = U.st, c = U.club(), own = U.coachName(c) !== c.coach.name;
    var h = '<div class="row" style="gap:16px;flex-wrap:nowrap"><div class="ti" style="font-size:56px">🧑‍💼</div><div><h3 style="margin:0">' + esc(U.coachName(c)) + '</h3><div class="muted small">' + (own ? 'Sie stehen selbst an der Seitenlinie.' : 'Cheftrainer') + '</div>' +
      '<table class="t small" style="margin-top:8px"><tr><td>Spielphilosophie</td><td>' + esc(c.coach.profile) + '</td></tr><tr><td>Trainerqualität</td><td>' + U.stars(Math.round(c.coach.quality / 20), 5) + ' (' + c.coach.quality + ')</td></tr><tr><td>Gehalt</td><td>' + money(c.coach.wage) + '/J.</td></tr></table></div></div>' +
      (own ? '<p class="muted small" style="margin-top:10px">Philosophie und Qualität beschreiben das sportliche Know-how Ihres Teams. Mit Co-, Reha- und Fitnesstrainern verbessern Sie es weiter.</p>' : '');
    U.modal('Cheftrainer', h, (st.manager.role === 'gf' ? '<button data-act="coachMarket">Trainer wechseln</button>' : '') + '<button class="primary" data-act="closeModal">Schließen</button>');
  };
  U.acts.coachMarket = function () {
    var st = U.st, c = U.club();
    U.coachOffers = U.coachOffers || [0, 1, 2, 3].map(function () { return W.genCoach(R.clamp(30 + c.tier * 60 + R.randInt(-15, 20), 20, 95), c.league); });
    var comp = Math.round(c.coach.wage * 0.5);
    U.modal('Trainermarkt', '<p class="small">Abfindung für den aktuellen Trainer: ' + money(comp) + '</p><div class="cmp">' + U.coachOffers.map(function (k, i) { return '<div class="cmp-card"><div class="ti" style="font-size:40px">🧑‍💼</div><b>' + esc(k.name) + '</b><div class="small muted">' + k.age + ' Jahre · ' + esc(k.profile) + '</div><div>' + U.stars(Math.round(k.quality / 20), 5) + '</div><div class="tv mono">' + money(k.wage) + '/J.</div><button class="sm primary" data-act="hireCoach" data-i="' + i + '">Einstellen</button></div>'; }).join('') + '</div>', '<button data-act="closeModal">Abbrechen</button>', true);
  };
  U.acts.hireCoach = function (d) {
    var st = U.st, c = U.club(), k = U.coachOffers[+d.i], comp = Math.round(c.coach.wage * 0.5);
    c.cash -= comp; E.book(c, 'Abfindungen', -comp);
    c.history.push({ season: st.season, type: 'trainer', text: 'Neuer Trainer: ' + k.name });
    S.news(st, c.short + ' präsentiert neuen Trainer', k.name + ' (' + k.profile + ') übernimmt.', 'verein');
    c.coach = k; U.coachOffers = null; U.closeModal(); U.render();
  };

  // ---------- Stadion ----------
  U.screens.stadion = function () {
    var st = U.st, c = U.club(), tab = U.p.tab || 'plan';
    if (R.stadium && c) R.stadium.ensure(c);
    var parts = E.capacityParts(c), att = E.attractiveness(c), tcap = E.transportCap(c);
    var avg = c.attendanceHist.length ? R.avg(c.attendanceHist) : 0;
    var h = '<h1 class="row" style="gap:10px">' + U.crest(c, 34) + esc(c.stadiumName) + '</h1>' + U.roleNote('business');
    h += '<div class="grid g4" style="margin-bottom:14px">' + U.ikpi('stadium', 'Kapazität', R.fmtNum(E.capacity(c))) + U.ikpi('star', 'Attraktivität', att + '/100', '', U.bar(att, 100, '#fbbf24')) + U.ikpi('traffic', 'Verkehrskapazität', R.fmtNum(tcap) + ' Fans') + U.ikpi('fans', 'Ø Zuschauer', avg ? R.fmtNum(avg) : '–', '', U.fillBar(avg ? avg / E.capacity(c) * 100 : 0)) + '</div>';
    h += '<div class="grid g21"><div>' + U.gfx.stadiumView(c) + '<p class="muted small">Tipp: Klicken Sie auf Tribünen, Hallenlicht oder Videowürfel für Details.</p></div><div class="grid">';
    // Ticketpreise
    var ref = E.refPrices[c.league], fakeAway = st.clubs[st.leagues[W.lk(c)].clubIds.filter(function (x) { return x !== c.id; })[0]];
    var est = E.attendance(st, c, fakeAway, 'league');
    h += '<div class="panel"><h2>Eintrittspreise</h2>' + ['steh', 'sitz', 'vip'].map(function (k) {
      return '<div class="row between" style="margin-bottom:6px"><span>' + { steh: 'Stehplatz', sitz: 'Sitzplatz', vip: parts.biz ? 'Logen (Business 35 %)' : 'VIP' }[k] + ' <span class="muted small">(' + R.fmtNum(parts[k]) + ' Plätze, üblich ~' + ref[k] + ' €)</span></span><span><input type="number" style="width:80px" data-chg="ticket" data-k="' + k + '" value="' + c.tickets[k] + '" min="1"' + (U.can('business') ? '' : ' disabled') + '> €</span></div>';
    }).join('') + '<div class="help small">Prognose gegen einen Durchschnittsgegner: <b>' + R.fmtNum(est.total) + '</b> Zuschauer (' + Math.round(est.total / Math.max(1, est.capacity) * 100) + ' %), Erlös ' + money(est.ticket + est.cater + est.parking) + ', Nachfrage ' + R.fmtNum(est.demand) + ', Zufriedenheit ' + est.satisfaction + '/100' + (est.congestion > 0.05 ? '<br><span class="warn">⚠️ Verkehrsengpass: Staus kosten Zuschauer und Fanzufriedenheit.</span>' : '') + '</div></div>';
    h += '<div class="panel"><h2>Zuschauerverlauf</h2>' + (c.attendanceHist.length > 1 ? U.sparkline(c.attendanceHist, 300, 90, '#3b82f6') : '<p class="muted small">Noch keine Heimspiele.</p>') + '<p class="muted small">Rekord: ' + R.fmtNum(c.records.attendance) + '</p></div></div></div>';
    h += '<div class="seg" style="margin:16px 0 12px">' + [['plan', 'Hallenplan (Tribünen)'], ['stadion', 'Ausstattung'], ['infra', 'Verkehrsinfrastruktur']].map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="stadion" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    var effects = { steh: 'Mehr günstige Plätze – mehr Stimmung.', sitz: 'Mehr Sitzplätze: höhere Erlöse, mehr Komfort.', dach: 'Komfort und Attraktivität.', vip: 'Hohe Erlöse pro Platz, Hospitality.', licht: 'Abendspiele und Attraktivität.', video: 'Attraktivität.', rasen: 'Attraktivität und Spielqualität.', sanitaer: 'Zufriedenheit der Zuschauer.', hosp: 'Höherer Umsatz pro Zuschauer.', technik: 'Moderner Komfort.', oepnv: 'Transportiert viele Fans – ersetzt Parkplatzbedarf. Große Projekte mit städtischem Zuschuss.', strasse: 'Begrenzt, wie viele Autos ankommen können.', parken: 'Parkplätze bringen Parkgebühren, benötigen aber eine gute Straße.' };
    if (tab === 'plan') h += U.stadiumPlanPanel(st, c);
    else h += '<div class="grid g3">' + D.facilityOrder[tab === 'infra' ? 'infra' : 'stadion'].filter(function (k) { return !(R.stadium && R.stadium.has(c) && E.PLAN_KEYS.indexOf(k) >= 0); }).map(function (k) { return U.facilityCard(k, { effect: effects[k] }); }).join('') + '</div>';
    if (tab === 'infra') h += '<div class="help" style="margin-top:12px">Verkehrskapazität = ÖPNV (' + R.fmtNum(E.level(c, 'oepnv').fans) + ') + min(Parkplätze × 2,6 = ' + R.fmtNum(E.level(c, 'parken').cars * 2.6) + ', Straße = ' + R.fmtNum(E.level(c, 'strasse').fans) + '). Sie müssen nicht alle drei Zweige ausbauen – eine starke S-Bahn ersetzt viele Parkplätze.</div>';
    return h;
  };
  U.acts.ticket = function (d, el) { if (!U.can('business')) return; U.club().tickets[d.k] = R.clamp(Math.round(+el.value || 1), 1, 2000); U.render(); };
  U.acts.stadiumPart = function (d) {
    var k = d.k; if (!k || !D.facilities[k]) return;
    if (R.stadium && R.stadium.has(U.club()) && E.PLAN_KEYS.indexOf(k) >= 0) { U.go('stadion', { tab: 'plan' }); return; }
    U.modal(D.facilities[k].name, U.facilityCard(k), '<button data-act="closeModal">Schließen</button>');
  };
  U.acts['nav-stadion'] = function () { U.go('stadion'); };

  // ---------- Hallenplan: Grundriss mit Sektoren ----------
  U.stadiumPlanSVG = function (c, sel) {
    var SP = R.stadium, plan = c.stadium, W_ = 640, H_ = 470, px0 = 190, px1 = 450, py0 = 165, py1 = 305, gap = 8, B = 36;
    var s = '<svg class="splan" viewBox="0 0 ' + W_ + ' ' + H_ + '" style="width:100%;display:block">';
    s += '<rect x="0" y="0" width="' + W_ + '" height="' + H_ + '" rx="12" fill="#0d1a2e"/>';
    // Handballfeld (40 × 20 m) mit 6-m-Kreis und gestrichelter 9-m-Linie
    var pmY = (py0 + py1) / 2, pr6 = (py1 - py0) * 0.3, pr9 = (py1 - py0) * 0.45;
    s += '<rect x="' + px0 + '" y="' + py0 + '" width="' + (px1 - px0) + '" height="' + (py1 - py0) + '" fill="#1d4ed8" stroke="#e9f5ea" stroke-width="2"/>';
    s += '<line x1="' + (px0 + px1) / 2 + '" y1="' + py0 + '" x2="' + (px0 + px1) / 2 + '" y2="' + py1 + '" stroke="#e9f5ea" stroke-width="1.5"/>';
    [[px0, 1], [px1, -1]].forEach(function (e) {
      s += '<path d="M ' + e[0] + ' ' + (pmY - pr6 - 8) + ' A ' + pr6 + ' ' + pr6 + ' 0 0 ' + (e[1] > 0 ? 1 : 0) + ' ' + e[0] + ' ' + (pmY + pr6 + 8) + '" fill="#f97316" fill-opacity=".85" stroke="#e9f5ea" stroke-width="1.5"/>';
      s += '<path d="M ' + e[0] + ' ' + (pmY - pr9 - 8) + ' A ' + pr9 + ' ' + pr9 + ' 0 0 ' + (e[1] > 0 ? 1 : 0) + ' ' + e[0] + ' ' + (pmY + pr9 + 8) + '" fill="none" stroke="#e9f5ea" stroke-width="1.2" stroke-dasharray="5 4"/>';
      s += '<rect x="' + (e[1] > 0 ? e[0] - 5 : e[0]) + '" y="' + (pmY - 10) + '" width="5" height="20" fill="#f8fafc" stroke="#ef4444" stroke-width="1"/>';
    });
    function band(id, ti, size, type) {
      var sec = SP.sec(id), d0 = gap + ti * B, d1 = d0 + B * size - 2, r;
      var i, n;
      if (sec.side === 'N' || sec.side === 'S') { i = +id.charAt(1) - 1; n = 3; var w = (px1 - px0) / n, x = px0 + i * w + 2; r = sec.side === 'N' ? [x, py0 - d1, w - 4, d1 - d0] : [x, py1 + d0, w - 4, d1 - d0]; }
      else if (sec.side === 'W' || sec.side === 'E') { i = +id.charAt(1) - 1; n = 2; var hh = (py1 - py0) / n, y = py0 + i * hh + 2; r = sec.side === 'W' ? [px0 - d1, y, d1 - d0, hh - 4] : [px1 + d0, y, d1 - d0, hh - 4]; }
      else { var sx = id.charAt(1) === 'W' ? -1 : 1, sy = id.charAt(0) === 'N' ? -1 : 1, cx = sx < 0 ? px0 : px1, cy = sy < 0 ? py0 : py1, dd = d1 - d0 + B * 0; r = [sx < 0 ? cx - d1 : cx + d0, sy < 0 ? cy - d1 : cy + d0, d1 - d0, d1 - d0]; if (ti > 0) { r = [sx < 0 ? cx - d1 : cx + gap, sy < 0 ? cy - d1 : cy + gap, d1 - gap, d1 - gap]; } }
      return r;
    }
    var secIds = SP.SECTORS.map(function (x) { return x.id; });
    secIds.forEach(function (id) {
      var sec = SP.sec(id), tiers = plan.sectors[id].tiers, job = SP.jobOf(plan, id), on = sel === id, guest = plan.guest === id;
      var g = '<g class="iso-click splan-sec' + (on ? ' on' : '') + '" data-act="planSel" data-k="' + id + '"><title>' + esc(sec.n) + '</title>';
      // leere Fläche (klickbar)
      var e = band(id, 0, 1, 'steh'); g += '<rect x="' + e[0] + '" y="' + e[1] + '" width="' + e[2] + '" height="' + e[3] + '" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.18)" stroke-dasharray="4 3"/>';
      for (var ti = tiers.length - 1; ti >= 0; ti--) {
        var t = tiers[ti], r = band(id, ti, t.size, t.type), col = SP.TYPES[t.type].col;
        g += '<rect x="' + r[0].toFixed(1) + '" y="' + r[1].toFixed(1) + '" width="' + Math.max(1, r[2]).toFixed(1) + '" height="' + Math.max(1, r[3]).toFixed(1) + '" rx="3" fill="' + col + '" stroke="' + (on ? '#fbbf24' : '#0d1a2e') + '" stroke-width="' + (on ? 2.5 : 1.2) + '"' + (job && job.tier === ti ? ' opacity=".55"' : '') + '/>';
      }
      if (job) { var jr = band(id, job.tier, 1, job.type); g += '<rect x="' + jr[0] + '" y="' + jr[1] + '" width="' + jr[2] + '" height="' + jr[3] + '" fill="url(#hatch)" stroke="#f5b301" stroke-width="1.5" stroke-dasharray="5 3"/>'; }
      var lab = band(id, 0, Math.max(1, tiers.length) * 0.999 / 1, 'steh'), cap = SP.secCap(plan, id).total;
      var lx = lab[0] + lab[2] / 2, ly = lab[1] + lab[3] / 2;
      if (sec.side === 'N') ly = py0 - gap - 13; if (sec.side === 'S') ly = py1 + gap + 16; if (sec.side === 'W') lx = px0 - gap - 17; if (sec.side === 'E') lx = px1 + gap + 17;
      if (sec.side !== 'C') g += '<text x="' + lx + '" y="' + ly + '" text-anchor="middle" font-size="11" font-weight="800" fill="#fff" style="paint-order:stroke" stroke="#0d1a2e" stroke-width="3">' + id + (guest ? ' · <tspan fill="#fca5a5">GÄSTE</tspan>' : cap ? ' · ' + R.fmtNum(cap) : '') + '</text>';
      if (guest) { var gr = band(id, 0, 1, 'steh'); g += '<rect x="' + (gr[0] - 2) + '" y="' + (gr[1] - 2) + '" width="' + (gr[2] + 4) + '" height="' + (gr[3] + 4) + '" fill="none" stroke="#ef4444" stroke-width="2.5"/>' + (sec.side === 'C' ? '<text x="' + (gr[0] + gr[2] / 2) + '" y="' + (gr[1] + gr[3] / 2 + 4) + '" text-anchor="middle" font-size="9" font-weight="900" fill="#fecaca" style="paint-order:stroke" stroke="#7f1d1d" stroke-width="3">GÄSTE</text>' : ''); }
      s += g + '</g>';
    });
    s += '<defs><pattern id="hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="rgba(245,179,1,.15)"/><line x1="0" y1="0" x2="0" y2="8" stroke="#f5b301" stroke-width="3"/></pattern></defs>';
    // Legende
    var lx2 = 14; Object.keys(SP.TYPES).forEach(function (k) { s += '<rect x="' + lx2 + '" y="' + (H_ - 22) + '" width="12" height="12" rx="2" fill="' + SP.TYPES[k].col + '"/><text x="' + (lx2 + 16) + '" y="' + (H_ - 12) + '" font-size="11" fill="#cbd5e1">' + SP.TYPES[k].n + '</text>'; lx2 += 96; });
    s += '<text x="' + (W_ - 14) + '" y="' + (H_ - 12) + '" font-size="11" fill="#9fb0d0" text-anchor="end">innen Unterrang · außen Oberränge</text>';
    s += '<text x="' + (px0 + px1) / 2 + '" y="20" text-anchor="middle" font-size="12" font-weight="800" fill="#9fb0d0" letter-spacing="1">HAUPTTRIBÜNE</text><text x="' + (px0 + px1) / 2 + '" y="' + (H_ - 34) + '" text-anchor="middle" font-size="12" font-weight="800" fill="#9fb0d0" letter-spacing="1">GEGENGERADE</text>';
    return s + '</svg>';
  };
  U.stadiumPlanPanel = function (st, c) {
    var SP = R.stadium, plan = SP.ensure(c), sel = U.p.sec || plan.guest || 'N2', sec = SP.sec(sel), can = U.can('business');
    var parts = SP.parts(c), full = SP.parts(c, { live: false }), gs = c.guestStats;
    var h = '<div class="grid g21"><div class="panel">' + U.stadiumPlanSVG(c, sel) + '<p class="muted small" style="margin-top:6px">Sektor antippen, um ihn auszubauen. 2 Sektoren je Torseite, 3 je Längsseite, 4 Ecken; bis zu 3 Ränge (Ecken 2). Die Hallebild passt sich automatisch an.</p></div><div class="grid" style="align-content:start">';
    h += '<div class="panel"><h2>Kapazität</h2><div class="grid g2">' + U.ikpi('fans', 'Stehplätze', R.fmtNum(parts.steh)) + U.ikpi('stadium', 'Sitzplätze', R.fmtNum(parts.sitz)) + U.ikpi('stocks', 'Business', R.fmtNum(parts.business)) + U.ikpi('star', 'Logenplätze', R.fmtNum(parts.loge)) + '</div>' +
      (full.steh + full.sitz + full.vip > parts.steh + parts.sitz + parts.vip ? '<p class="small warn" style="margin-top:6px">🚧 Wegen Umbau gesperrt: ' + R.fmtNum(full.steh + full.sitz + full.vip - parts.steh - parts.sitz - parts.vip) + ' Plätze</p>' : '') +
      '<p class="small" style="margin-top:6px">Gästeblock: <b>' + esc(SP.sec(plan.guest).n) + '</b> · ' + R.fmtNum(SP.guestCap(c)) + ' Plätze' + (gs && gs.season === st.season ? ' · zuletzt ' + R.fmtNum(gs.last) + ' Gästefans' + (gs.short ? ' <span class="warn">(zu klein – Nachfrage ' + R.fmtNum(gs.demand) + ')</span>' : '') : '') + '</p>' +
      '<div class="row between small"><span>Abnutzung Gästeblock</span><b>' + Math.round(plan.wear || 0) + ' %</b></div>' + U.bar(plan.wear || 0, 100, (plan.wear || 0) > 60 ? '#ef4444' : (plan.wear || 0) > 30 ? '#f5b301' : '#22c55e') +
      (can && (plan.wear || 0) >= 5 ? '<button class="sm" style="margin-top:6px" data-act="planRepair">Gästeblock sanieren (' + money(SP.repairCost(c)) + ')</button>' : '') +
      '<p class="muted small" style="margin-top:6px">Je höher die Liga und je größer der Gegner, desto mehr Gästefans reisen an – mehr Einnahmen, aber auch mehr Abnutzung und Randale-Gefahr. Gute Sanitäranlagen und eine regelmäßige Sanierung senken das Risiko.</p></div>';
    // Sektor-Details
    var tiers = plan.sectors[sel].tiers, job = SP.jobOf(plan, sel), cap = SP.secCap(plan, sel);
    h += '<div class="panel"><div class="panel-h"><h2>' + esc(sec.n) + ' <span class="muted small">' + sel + '</span></h2><b class="mono">' + R.fmtNum(cap.total) + ' Plätze</b></div>';
    h += tiers.length ? '<table class="t small">' + tiers.map(function (t, ti) { return '<tr><td>' + SP.TIER_NAMES[ti] + '</td><td>' + SP.TYPES[t.type].ic + ' ' + SP.TYPES[t.type].n + '</td><td class="num">' + Math.round(t.size * 100) + ' %</td><td class="num">' + R.fmtNum(SP.tierCap(sec, ti, t.type, t.size)) + '</td></tr>'; }).join('') + '</table>' : '<p class="muted small">Noch keine Tribüne – hier ist nur Hallenboden.</p>';
    if (job) h += '<div class="help small" style="margin-top:8px">🚧 Im Bau: <b>' + esc(job.n) + '</b> – noch ' + job.weeks + ' von ' + job.total + ' Wochen.' + U.bar(job.total - job.weeks, job.total, '#f5b301') + '</div>';
    if (plan.guest !== sel && tiers.length && can) h += '<button class="sm" style="margin-top:8px" data-act="planGuest" data-k="' + sel + '">🔴 Als Gästeblock festlegen</button>';
    if (can && !job) {
      var opts = SP.options(st, c, sel);
      if (opts.length) h += '<h3 style="margin-top:12px">Ausbau planen</h3><div class="plan-opts">' + opts.map(function (o, i) {
        var afford = c.cash >= o.cost;
        return '<div class="plan-opt"><div><b>' + esc(o.n) + '</b><div class="muted small">' + (o.cap ? (o.cap > 0 ? '+' : '') + R.fmtNum(o.cap) + ' Plätze · ' : '') + o.weeks + ' Wochen Bauzeit' + (o.action === 'convert' || o.action === 'grow' ? ' · Rang während des Umbaus gesperrt' : '') + '</div></div><button class="sm ' + (afford ? 'primary' : '') + '" data-act="planBuild" data-k="' + sel + '" data-v="' + i + '"' + (afford ? '' : ' disabled') + '>' + (o.cost ? money(o.cost) : 'Kostenlos') + '</button></div>';
      }).join('') + '</div>';
    }
    h += '</div></div></div>';
    if (plan.jobs.length) h += '<div class="panel" style="margin-top:14px"><h2>Laufende Tribünen-Bauprojekte</h2>' + plan.jobs.map(function (j) { return '<div class="row between small" style="margin-bottom:6px"><span>' + esc(SP.sec(j.sec).n) + ': ' + esc(j.n) + '</span><span class="muted">noch ' + j.weeks + ' Wo.</span></div>' + U.bar(j.total - j.weeks, j.total, '#f5b301'); }).join('') + '</div>';
    return h;
  };
  U.acts.planSel = function (d) { U.p.sec = d.k; U.render(); };
  U.acts.planGuest = function (d) { if (R.stadium.setGuest(U.club(), d.k)) U.toast('Gästeblock: ' + R.stadium.sec(d.k).n); U.render(); };
  U.acts.planRepair = function () { var r = R.stadium.repair(U.club()); U.toast(r.ok ? 'Gästeblock saniert (' + money(r.cost) + ').' : r.why); U.render(); };
  U.acts.planBuild = function (d) {
    var st = U.st, c = U.club(), o = R.stadium.options(st, c, d.k)[+d.v]; if (!o) return;
    U.confirm('Hallenausbau', '<p><b>' + esc(R.stadium.sec(d.k).n) + '</b>: ' + esc(o.n) + '</p><p>Kosten ' + money(o.cost) + ' · Bauzeit ' + o.weeks + ' Wochen' + (o.cap ? ' · ' + (o.cap > 0 ? '+' : '') + R.fmtNum(o.cap) + ' Plätze' : '') + '</p>', function () {
      var r = R.stadium.start(st, c, d.k, +d.v); U.closeModal(); U.toast(r.ok ? 'Baustart: ' + r.opt.n : r.why); U.render();
    });
  };

  // ---------- Vereinsstadt ----------
  U.screens.stadt = function () {
    var st = U.st, c = U.club();
    var keys = ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe', 'solar', 'geschaeft'];
    var rev = 0, up = 0;
    keys.forEach(function (k) { rev += E.buildingRevenue(st, c, k); var l = E.level(c, k); up += l ? l.up : 0; });
    var h = '<h1 class="row" style="gap:10px">' + U.crest(c, 34) + 'Vereinsstadt</h1>' + U.roleNote('business') + '<div class="grid g4" style="margin-bottom:14px">' + U.ikpi('city', 'Einnahmen Betriebe', money(rev) + '/J.') + U.ikpi('debt', 'Betriebskosten', money(up) + '/J.') + U.ikpi('growth', 'Überschuss', money(rev - up) + '/J.', rev - up < 0 ? 'neg' : 'pos') + U.ikpi('energy', 'Energieersparnis', Math.round(E.energySave(c) * 100) + ' %') + '</div>';
    h += U.gfx.cityView(c);
    h += '<div class="row" style="margin:12px 0"><label class="row"><input type="checkbox" data-chg="cityAuto"' + (c.cityAutoBuild ? ' checked' : '') + (U.can('business') ? '' : ' disabled') + '> Wirtschaftsbetriebe automatisch verwalten (KI baut rentable Betriebe selbstständig aus)</label>' +
      '<span class="muted small">Preisniveau:</span><div class="seg">' + ['Günstig', 'Normal', 'Gehoben'].map(function (l, i) { return '<button class="sm ' + ((c.cityPrice == null ? 1 : c.cityPrice) === i ? 'on' : '') + '" data-act="cityPrice" data-v="' + i + '"' + (U.can('business') ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div></div>';
    h += '<div class="panel tight" style="margin-bottom:14px">' + U.table('cityT', [
      { k: 'n', l: 'Betrieb', f: function (r) { return esc(r.n); } }, { k: 'lvl', l: 'Stufe', num: true, f: function (r) { return r.lvl + '/' + r.max; } },
      { k: 'rev', l: 'Einnahmen/J.', num: true, f: function (r) { return money(r.rev); } }, { k: 'up', l: 'Kosten/J.', num: true, f: function (r) { return money(r.up); } },
      { k: 'net', l: 'Überschuss', num: true, f: function (r) { return '<span class="' + (r.net < 0 ? 'neg' : 'pos') + '">' + money(r.net) + '</span>'; } },
      { k: 'syn', l: 'Synergie', num: true, f: function (r) { return r.syn ? '+' + Math.round(r.syn * 100) + ' %' : '–'; } }
    ], keys.map(function (k) { var l = E.level(c, k), r = E.buildingRevenue(st, c, k); return { id: k, n: D.facilities[k].name, lvl: c.fac[k] || 0, max: D.facilities[k].levels.length - 1, rev: r, up: l ? l.up : 0, net: r - (l ? l.up : 0), syn: E.synergy(c, k) }; }), { click: 'cityPlotRow' }) + '</div>';
    h += '<h2>Sportliche Einrichtungen in der Vereinsstadt</h2><div class="grid g3">' + ['training', 'jugend', 'medizin'].map(function (k) { return U.facilityCard(k); }).join('') + '</div>';
    h += '<div class="help" style="margin-top:12px">Synergien (gedeckelt auf +30 %): Museum + Fanshop · Hotel + Eventhalle · Restaurant + VIP-Logen · U-Bahn + Museum · Parkhäuser + Eventhalle · Fan-Erlebniswelt + Fanshop. Nicht jede Investition ist automatisch rentabel – Erträge hängen von Fans, Erfolg und Auslastung ab.</div>';
    if (c.fac.museum > 0) h += U.museumPanel(c);
    return h;
  };
  U.acts.cityPlot = function (d) { var k = d.k; U.modal(D.facilities[k].name, U.facilityCard(k, { effect: k === 'museum' ? 'Das Museum dokumentiert automatisch die Vereinsgeschichte.' : '' }), '<button data-act="closeModal">Schließen</button>'); };
  U.acts.cityPlotRow = function (d) { U.acts.cityPlot({ k: d.id }); };
  U.acts.cityAuto = function (d, el) { U.club().cityAutoBuild = el.checked; U.toast(el.checked ? 'Die KI verwaltet jetzt die Wirtschaftsbetriebe.' : 'Automatik aus.'); };
  U.acts.cityPrice = function (d) { U.club().cityPrice = +d.v; U.render(); };
  U.museumPanel = function (c) {
    var h = '<div class="panel" style="margin-top:14px"><h2>🏛️ Vereinsmuseum – Chronik</h2><div class="grid g2"><div>';
    var items = c.history.filter(function (x) { return x.type !== 'saison' && x.type !== 'bau'; }).slice(-14).reverse();
    h += items.length ? items.map(function (x) { return '<div class="mus-item"><b>' + x.season + '</b> – ' + esc(x.text) + '</div>'; }).join('') : '<p class="muted">Die Geschichte wird noch geschrieben …</p>';
    h += '</div><div><h3>Rekorde</h3><table class="t small"><tr><td>Rekordtransfer (Kauf)</td><td>' + (c.records.transferIn ? esc(c.records.transferIn.name) + ' – ' + money(c.records.transferIn.fee) : '–') + '</td></tr><tr><td>Rekordtransfer (Verkauf)</td><td>' + (c.records.transferOut ? esc(c.records.transferOut.name) + ' – ' + money(c.records.transferOut.fee) : '–') + '</td></tr><tr><td>Zuschauerrekord</td><td>' + R.fmtNum(c.records.attendance) + '</td></tr><tr><td>Titel</td><td>' + c.titles.league + '× Meister, ' + c.titles.cup + '× Pokal, ' + c.titles.promo + '× Aufstieg</td></tr></table>';
    h += '<h3 style="margin-top:10px">Vereinslegenden</h3>' + (c.legends.length ? c.legends.slice(-8).map(function (l) { return '<div class="small">⭐ ' + esc(l.name) + ' – ' + l.apps + ' Spiele, ' + l.goals + ' Tore</div>'; }).join('') : '<p class="muted small">Noch keine Legenden.</p>');
    h += '<h3 style="margin-top:10px">Hallengeschichte</h3>' + (c.stadiumHist.length ? c.stadiumHist.slice(-6).map(function (s) { return '<div class="small">' + s.season + ': ' + esc(s.name) + '</div>'; }).join('') : '<p class="muted small">Noch keine Ausbauten.</p>');
    return h + '</div></div></div>';
  };

  // ---------- Bank & Finanzen ----------
  U.screens.bank = function () {
    var st = U.st, c = U.club(), can = U.can('business'), tab = U.p.tab || 'bank';
    var h = '<h1>Bank & Finanzen</h1>' + U.roleNote('business');
    var debt = E.debt(c), stocksV = E.portfolioValue(st, c, 'stocks'), cryptoV = E.portfolioValue(st, c, 'crypto');
    var last = c.fin.season, inc = 0, exp = 0;
    Object.keys(last).forEach(function (k) { if (['Kreditaufnahme', 'Tilgung', 'Kapitalanlagen'].indexOf(k) >= 0) return; if (last[k] > 0) inc += last[k]; else exp += last[k]; });
    var weeks = Math.max(1, st.week);
    h += U.bankHero(st, c);
    h += '<div class="seg" style="margin-bottom:12px">' + [['bank', 'Kredite & Tagesgeld'], ['aktien', 'Aktienmarkt'], ['krypto', 'Kryptowährungen'], ['bilanz', 'Finanzbericht']].map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="bank" data-tab="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'bank') {
      h += U.forecastPanel(st, c, false);
      var rate = E.loanRate(st, c), lim = E.creditLimit(st, c);
      h += '<div class="grid g2"><div class="panel"><h2>Kredite</h2><table class="t"><tr><td>Zinskosten/Jahr</td><td class="num neg">' + money(R.sum(c.loans, function (l) { return l.amount * l.rate; })) + '</td></tr></table>' +
        (can ? '<div class="row" style="margin-top:10px"><input type="number" id="loanAmt" placeholder="Betrag in €" step="100000" style="width:150px"><button class="primary" data-act="loanTake">Kredit aufnehmen</button><button data-act="loanRepay">Tilgen</button><button data-act="loanRepayAll">Alles zurückzahlen</button></div>' : '') +
        '<p class="muted small">Der Zinssatz hängt von Bonität und Verschuldung ab. Ein negativer Kontostand kostet 12 % Dispozinsen. Hohe Überschuldung führt am Saisonende zu Punktabzug.</p></div>';
      var il = (c.interestLog || []).filter(function (x) { return x.s === st.season; });
      h += '<div class="panel"><h2>Tagesgeld</h2><p class="muted small">Variabler Zinssatz (aktuell ' + (st.savingsRate * 100).toFixed(2).replace('.', ',') + ' %), jederzeit verfügbar. Die Zinsen werden <b>monatlich</b> (alle ' + E.INTEREST_MONTH + ' Spielwochen) dem Girokonto gutgeschrieben.</p>' +
        '<div class="grid g3" style="margin-bottom:8px">' + U.ikpi('piggy', 'Guthaben', money(c.savings)) + U.ikpi('coins', 'Aufgelaufene Zinsen', money(c.interestAccrued || 0), 'pos', '<div class="small muted">Gutschrift nach dem ' + E.nextInterestWeek(st) + '. Spieltag</div>') + U.ikpi('growth', 'Zinsen diese Saison', money(R.sum(il, function (x) { return x.a; })), 'pos', '<div class="small muted">ca. ' + money(c.savings * st.savingsRate * E.INTEREST_MONTH / E.WEEKS) + ' pro Monat</div>') + '</div>' +
        (il.length ? '<table class="t small" style="margin-bottom:8px"><tr><th>Gutschrift</th><th class="num">Betrag</th></tr>' + il.slice(-6).reverse().map(function (x) { return '<tr><td>nach dem ' + x.w + '. Spieltag</td><td class="num pos">+' + money(x.a) + '</td></tr>'; }).join('') + '</table>' : '') + (can ? '<div class="row"><input type="number" id="savAmt" placeholder="Betrag in €" step="100000" style="width:150px"><button class="primary" data-act="savIn">Einzahlen</button><button data-act="savOut">Auszahlen</button></div>' : '') + '</div></div>';
      h += '<div class="grid g21" style="margin-top:14px"><div class="panel"><div class="panel-h"><h2>Kontoverlauf</h2><span class="muted small">letzte ' + Math.min(40, (c.hist || []).length) + ' Wochen</span></div>' + U.lineChart(U.hist(c, 'cash', 40), { h: 130, color: c.cash < 0 ? '#ef4444' : '#22c55e', zero: true, fmt: money }) + '</div>' +
        '<div class="panel"><h2>Diese Saison</h2><div class="grid">' + U.ikpi('growth', 'Einnahmen', money(inc), 'pos') + U.ikpi('debt', 'Ausgaben', money(exp), 'neg') + U.ikpi('coins', 'Ø pro Woche', money((inc + exp) / weeks), U.moneyCls(inc + exp)) + '</div></div></div>';
    }
    if (tab === 'aktien' || tab === 'krypto') {
      E.ensureMarkets(st);
      var defs = tab === 'aktien' ? D.stocks : D.cryptos, mk = tab === 'aktien' ? st.market.stocks : st.market.crypto, range = U.p.range || 52;
      h += '<div class="row" style="margin-bottom:12px;gap:10px"><div class="help" style="flex:1;margin:0">' + (tab === 'aktien' ? '📈 Fiktiver Aktienmarkt – Kurse ändern sich wöchentlich, 0,5 % Gebühr pro Kauf/Verkauf. Börsencrashs kommen in unregelmäßigen Abständen und drücken alle Kurse – danach erholen sie sich meist langsam.' : '🪙 Fiktive Kryptowährungen – extrem schwankend: Kurssprünge, Crashs und Spekulationsblasen jederzeit möglich. Kein Echtgeld.') + '</div>' +
        '<div class="seg">' + [[26, '6 Mon.'], [52, '1 Jahr'], [104, '2 Jahre']].map(function (x) { return '<button class="sm ' + (range === x[0] ? 'on' : '') + '" data-act="chartRange" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div><div class="grid g2">';
      defs.forEach(function (sd) {
        var m = mk[sd.id], pf = c.portfolio[sd.id], hist = m.hist.slice(-range - 1), first = hist[0], chg = (m.price / first - 1) * 100;
        var val = pf ? pf.qty * m.price : 0, buyIn = pf ? pf.cost / pf.qty : null;
        var bvb = sd.club ? E.bvbClub(st) : null, stake = sd.club ? E.bvbStake(st, c) : 0;
        if (sd.club && (!bvb || bvb.id === c.id)) return;
        h += '<div class="panel"' + (sd.club ? ' style="border-color:#c9a400"' : '') + '><div class="panel-h"><h3 class="row" style="gap:8px">' + (sd.club && bvb ? U.crest(bvb, 24) : '') + esc(sd.club && bvb ? bvb.name + ' (Aktie)' : sd.name) + ' <span class="muted small">' + sd.id + '</span></h3><b class="mono" style="font-size:18px">' + U.fmtPrice(m.price) + '</b></div>' +
          U.priceChart(m, { range: range, buyIn: buyIn, h: 170 }) +
          '<div class="chart-meta"><span>' + ({ 26: '6 Monate', 52: '12 Monate', 104: '24 Monate' }[range]) + ': <b class="' + (chg >= 0 ? 'pos' : 'neg') + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(1) + ' %</b></span><span>Tief ' + U.fmtPrice(Math.min.apply(null, hist)) + ' · Hoch ' + U.fmtPrice(Math.max.apply(null, hist)) + '</span></div>' +
          (sd.club && bvb ? '<div style="margin-top:8px"><div class="row between small"><span>Ihr Anteil: <b>' + (stake * 100).toFixed(2).replace('.', ',') + ' %</b></span><span class="muted">Mehrheit ab 50 % · ' + R.fmtNum(sd.shares) + ' Aktien</span></div><div class="stake"><i style="width:' + Math.min(100, stake * 100) + '%"></i></div>' +
            (bvb.takenOverBy === c.id ? '<div class="small pos" style="margin-top:4px">✔ Übernommen – der Verein steigt zum Saisonende ab.</div>' : '<div class="small muted" style="margin-top:4px">Mit der Aktienmehrheit übernehmen Sie alle Spieler und das Vermögen von ' + esc(bvb.short) + ' – der Verein muss zwangsweise absteigen. Große Käufe treiben den Kurs. Mehrheit bei aktuellem Kurs: ca. ' + money(Math.max(0, sd.shares * 0.5001 - (pf ? pf.qty : 0)) * m.price) + '.</div>') + '</div>' : '') +
          (pf ? '<div class="small" style="margin-top:6px">Bestand: <b>' + R.fmtNum(pf.qty) + '</b> · Einstieg Ø ' + U.fmtPrice(buyIn) + ' · Wert ' + money(val) + ' · <span class="' + (val - pf.cost >= 0 ? 'pos' : 'neg') + '">' + (val - pf.cost >= 0 ? '+' : '') + money(val - pf.cost) + '</span></div>' : '') +
          (can ? '<div class="row" style="margin-top:8px"><input type="number" id="q_' + sd.id + '" placeholder="Stück" style="width:120px" min="1"><button class="sm primary" data-act="assetBuy" data-k="' + sd.id + '">Kaufen</button><button class="sm" data-act="assetSell" data-k="' + sd.id + '">Verkaufen</button><span class="muted small">max. ' + R.fmtNum(Math.floor(c.cash / (m.price * 1.005))) + ' Stück</span></div>' : '') + '</div>';
      });
      h += '</div>';
    }
    if (tab === 'bilanz') h += U.forecastPanel(st, c, true) + U.financeReport(c);
    return h;
  };
  // Bilanzprognose bis Saisonende
  U.forecastPanel = function (st, c, full) {
    var f = E.forecast(st, c);
    var past = (c.hist || []).filter(function (x) { return x.s === st.season && x.cash != null; }).map(function (x) { return x.cash; });
    if (past.length && Math.abs(past[past.length - 1] - c.cash) > 1) past.push(c.cash); // Änderungen seit dem letzten Spieltag
    var diff = f.endCash - c.cash;
    var h = '<div class="panel forecast" style="margin-bottom:14px"><div class="panel-h"><h2>📊 Bilanzprognose bis Saisonende</h2><span class="muted small">' +
      (f.weeksLeft ? 'noch ' + f.weeksLeft + ' Spielwochen · ' + f.homeGames + ' Heimspiele' : 'Saison beendet') + '</span></div>';
    h += '<div class="grid g4" style="margin-bottom:10px">' +
      U.ikpi('bank', 'Kontostand heute', money(c.cash), U.moneyCls(c.cash)) +
      U.ikpi('growth', 'Erw. Einnahmen', '+' + money(f.income), 'pos') +
      U.ikpi('debt', 'Erw. Ausgaben', money(f.expense), 'neg') +
      U.ikpi(f.endCash < 0 ? 'debt' : 'piggy', 'Prognose Saisonende', money(f.endCash), f.endCash < 0 ? 'neg' : 'pos', '<div class="small ' + (diff < 0 ? 'neg' : 'pos') + '">' + (diff >= 0 ? '▲ +' : '▼ ') + money(diff) + '</div>') + '</div>';
    h += U.forecastChart(past, f.path, { h: full ? 200 : 160 });
    if (f.endCash < 0) h += '<div class="small neg" style="margin-top:6px">⚠ Ohne Gegenmaßnahmen rutscht das Konto bis Saisonende ins Minus – Dispozinsen (12 %) und am Saisonende Punktabzug drohen.</div>';
    if (full) {
      var keys = Object.keys(f.lines).filter(function (k) { return Math.round(f.lines[k]) !== 0; });
      var inc = keys.filter(function (k) { return f.lines[k] > 0; }).sort(function (a, b) { return f.lines[b] - f.lines[a]; });
      var exp = keys.filter(function (k) { return f.lines[k] < 0; }).sort(function (a, b) { return f.lines[a] - f.lines[b]; });
      var mx = Math.max(f.income, -f.expense) || 1;
      h += '<div class="grid g2" style="margin-top:12px"><div><h3 class="pos">Noch zu erwarten: Einnahmen <span class="mono">' + money(f.income) + '</span></h3>' + U.hbars(inc.map(function (k) { return { k: k, v: f.lines[k] }; }), mx, '#22c55e') + '</div>' +
        '<div><h3 class="neg">Noch zu erwarten: Ausgaben <span class="mono">' + money(f.expense) + '</span></h3>' + U.hbars(exp.map(function (k) { return { k: k, v: f.lines[k] }; }), mx, '#ef4444') + '</div></div>';
      h += '<p class="muted small" style="margin-top:8px">Hochrechnung mit den aktuellen Gehältern, Sponsoren, Eintrittspreisen und Gegnern; Liga-Prämie und Sponsorenboni nach aktuellem Tabellenplatz (' + f.pos + '.). Nicht enthalten: Pokalspiele, Transfers, neue Bauprojekte und Kursänderungen bei Aktien/Krypto.</p>';
    } else h += '<div class="row between small" style="margin-top:6px"><span class="muted">Einnahmen, Ausgaben und Details im Finanzbericht</span><button class="sm" data-act="tab" data-s="bank" data-tab="bilanz">Details ›</button></div>';
    return h + '</div>';
  };
  U.acts.chartRange = function (d) { U.p.range = +d.v; U.render(); };
  // Kursdiagramm: Fläche, Linie, Achsen, Einstiegslinie, Crash-/Übernahme-Markierungen
  U.priceChart = function (m, o) {
    o = o || {}; var W_ = 560, H = o.h || 170, L = 58, Rr = 10, T = 12, B = 22;
    // Tageskurse (5 je Spielwoche), falls vorhanden – sonst Wochenkurse
    var TK = m.ticks && m.ticks.length === m.hist.length * E.TICKS ? E.TICKS : 1, all = TK > 1 ? m.ticks : m.hist;
    var weeks = Math.min(o.range || 52, m.hist.length), off = Math.max(0, all.length - weeks * TK), hist = all.slice(off);
    if (TK > 1 && Math.abs(hist[hist.length - 1] - m.price) > 1e-9) hist = hist.concat([m.price]); // Kursänderung durch eigene Käufe
    if (hist.length < 2) hist = [hist[0] || m.price, m.price];
    var vals = hist.concat(o.buyIn ? [o.buyIn] : []), mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    if (mx - mn < mx * 0.02) { mx *= 1.01; mn *= 0.99; }
    var pad = (mx - mn) * 0.08; mn -= pad; mx += pad;
    var x = function (i) { return L + (W_ - L - Rr) * i / Math.max(1, hist.length - 1); }, y = function (v) { return T + (H - T - B) * (1 - (v - mn) / (mx - mn)); };
    var up = hist[hist.length - 1] >= hist[0], col = up ? '#22c55e' : '#ef4444', id = 'pc' + Math.floor(Math.random() * 1e9);
    var pts = hist.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var svg = '<svg viewBox="0 0 ' + W_ + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".35"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 3; g++) { var gv = mn + (mx - mn) * g / 3, gy = y(gv); svg += '<line x1="' + L + '" y1="' + gy.toFixed(1) + '" x2="' + (W_ - Rr) + '" y2="' + gy.toFixed(1) + '" stroke="#2a3b60" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (gy + 4).toFixed(1) + '" font-size="13" fill="#9fb0d0" text-anchor="end">' + U.fmtPrice(gv).replace(' €', '') + '</text>'; }
    var n = hist.length; [[0, 'vor ' + weeks + ' Wo.'], [Math.floor((n - 1) / 2), ''], [n - 1, 'heute']].forEach(function (t) { if (t[1]) svg += '<text x="' + x(t[0]).toFixed(1) + '" y="' + (H - 5) + '" font-size="12" fill="#9fb0d0" text-anchor="' + (t[0] === 0 ? 'start' : 'end') + '">' + t[1] + '</text>'; });
    svg += '<polygon points="' + x(0).toFixed(1) + ',' + (H - B) + ' ' + pts + ' ' + x(n - 1).toFixed(1) + ',' + (H - B) + '" fill="url(#' + id + ')"/><polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + (TK > 1 ? 1.6 : 2) + '" stroke-linejoin="round"/>';
    if (o.buyIn) { var by = y(o.buyIn); svg += '<line x1="' + L + '" y1="' + by.toFixed(1) + '" x2="' + (W_ - Rr) + '" y2="' + by.toFixed(1) + '" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="5 4"/><text x="' + (L + 4) + '" y="' + (by - 4).toFixed(1) + '" font-size="12" fill="#fbbf24">Ihr Einstieg ' + U.fmtPrice(o.buyIn) + '</text>'; }
    (m.marks || []).forEach(function (k) { var i = k.i * TK + TK - 1 - off; if (i < 0 || i >= n) return; var mx_ = x(i), my = y(hist[i]); svg += '<circle cx="' + mx_.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1.5"/><text x="' + mx_.toFixed(1) + '" y="' + Math.min(H - B - 4, my + 16).toFixed(1) + '" font-size="12" font-weight="700" fill="#fca5a5" text-anchor="middle">' + esc(k.t) + '</text>'; });
    svg += '<circle cx="' + x(n - 1).toFixed(1) + '" cy="' + y(hist[n - 1]).toFixed(1) + '" r="4" fill="' + col + '"/></svg>';
    return '<div class="chart-box">' + svg + '</div>';
  };
  U.fmtPrice = function (p) { return p >= 100 ? p.toFixed(0) + ' €' : p >= 1 ? p.toFixed(2).replace('.', ',') + ' €' : p.toFixed(4).replace('.', ',') + ' €'; };
  U.financeReport = function (c) {
    function block(fin, title) {
      if (!fin) return '<div class="panel"><h2>' + title + '</h2><p class="muted">Noch keine Daten.</p></div>';
      var keys = Object.keys(fin).filter(function (k) { return Math.round(fin[k]) !== 0; });
      var inc = keys.filter(function (k) { return fin[k] > 0; }).sort(function (a, b) { return fin[b] - fin[a]; }), exp = keys.filter(function (k) { return fin[k] < 0; }).sort(function (a, b) { return fin[a] - fin[b]; });
      var ti = R.sum(inc, function (k) { return fin[k]; }), te = R.sum(exp, function (k) { return fin[k]; });
      var mx = Math.max(ti, -te) || 1;
      return '<div class="panel"><h2>' + title + '</h2>' +
        '<div class="fin-split"><div style="flex:' + Math.max(1, ti) + ';background:#22c55e"></div><div style="flex:' + Math.max(1, -te) + ';background:#ef4444"></div></div>' +
        '<h3 class="pos" style="margin-top:10px">Einnahmen <span class="mono">' + money(ti) + '</span></h3>' + U.hbars(inc.map(function (k) { return { k: k, v: fin[k] }; }), mx, '#22c55e') +
        '<h3 class="neg" style="margin-top:12px">Ausgaben <span class="mono">' + money(te) + '</span></h3>' + U.hbars(exp.map(function (k) { return { k: k, v: fin[k] }; }), mx, '#ef4444') +
        '<div class="row between" style="margin-top:12px;border-top:1px solid var(--line);padding-top:8px"><b>Saldo</b><b class="mono ' + (ti + te < 0 ? 'neg' : 'pos') + '">' + money(ti + te) + '</b></div></div>';
    }
    return '<div class="grid g2">' + block(c.fin.season, 'Laufende Saison') + block(c.fin.last, 'Vorsaison') + '</div>';
  };
  U.acts.bankSign = function () {
    var st = U.st, r = E.bankCheat(st, U.club());
    if (!r) return;
    var el = document.querySelector('.director-sign');
    if (el) { el.classList.remove('wobble'); void el.offsetWidth; el.classList.add('wobble'); }
    U.renderTop();
    if (U.cheatSessionSt !== st) {
      // erster Klick dieser Sitzung: Spruch
      U.cheatSessionSt = st;
      U.modal('🔐 Geheimer Buchhaltungskeller', r.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '<p class="pos"><b>+' + money(r.paid) + '</b> wurden Ihrem Vereinskonto gutgeschrieben.</p><p class="muted small">Jeder weitere Klick aufs Schild bringt einen zufälligen Betrag zwischen 100.000 € und 5 Mio. € (je höher, desto seltener).' + (r.first ? ' Dieser Spielstand ist jetzt als „mit Cheat“ markiert. Der Cheat kann in den Einstellungen deaktiviert werden.' : '') + '</p>', '<button class="primary" data-act="closeModal">Danke, Herr Buchungsfehler!</button>');
    } else {
      U.toast((r.jackpot ? '🎰 JACKPOT! ' : r.paid >= 2000000 ? '💰 ' : '') + '+' + money(r.paid) + ' · Kontostand ' + money(U.club().cash));
      var k = document.querySelector('#main .rw-cash'); if (k) k.textContent = money(U.club().cash);
    }
  };
  function amt(id) { var el = document.getElementById(id); return el ? +el.value || 0 : 0; }
  U.acts.loanTake = function () { var r = E.takeLoan(U.st, U.club(), amt('loanAmt')); U.toast(r.ok ? 'Kredit aufgenommen (' + (r.rate * 100).toFixed(1) + ' %)' : r.why); U.render(); };
  U.acts.loanRepay = function () { var r = E.repayLoan(U.st, U.club(), amt('loanAmt')); U.toast(r.ok ? 'Getilgt: ' + money(r.amount) : r.why); U.render(); };
  U.acts.loanRepayAll = function () { var r = E.repayLoan(U.st, U.club(), 1e15); U.toast(r.ok ? 'Getilgt: ' + money(r.amount) : r.why); U.render(); };
  U.acts.savIn = function () { U.toast(E.deposit(U.club(), amt('savAmt')) ? 'Eingezahlt.' : 'Nicht möglich.'); U.render(); };
  U.acts.savOut = function () { U.toast(E.withdraw(U.club(), amt('savAmt')) ? 'Ausgezahlt.' : 'Nicht möglich.'); U.render(); };
  U.acts.assetBuy = function (d) {
    var st = U.st, c = U.club(), r = E.buyAsset(st, c, d.k, amt('q_' + d.k)); U.toast(r.ok ? 'Gekauft für ' + money(r.cost) : r.why); U.render();
    var bv = d.k === 'BVB' ? E.bvbClub(st) : null;
    if (r.ok && r.takeover && bv && !bv.takenOverBy) {
      var n = W.squad(st, bv.id).length + W.youthOf(st, bv.id).length;
      U.modal('🟡 Aktienmehrheit erreicht!', '<div class="row" style="gap:16px;flex-wrap:nowrap">' + U.crest(bv, 80) + '<div><p>Sie besitzen jetzt <b>' + (E.bvbStake(st, c) * 100).toFixed(1).replace('.', ',') + ' %</b> der Aktien von <b>' + esc(bv.name) + '</b>.</p><p>Bei einer Übernahme wechseln alle <b>' + n + ' Spieler</b> und das Vereinsvermögen (<b>' + money(Math.max(0, bv.cash + bv.savings)) + '</b>) zu ' + esc(c.name) + '. ' + esc(bv.short) + ' muss zum Saisonende zwangsweise absteigen.</p></div></div>',
        '<button data-act="closeModal">Noch nicht</button><button class="primary" data-act="bvbTakeover">Übernahme durchführen</button>');
    }
  };
  U.acts.bvbTakeover = function () {
    var r = E.takeoverBVB(U.st, U.club()); U.closeModal();
    if (!r.ok) { U.toast(r.why); return; }
    if (U.autosave) U.autosave(); U.render();
    U.modal('Übernahme abgeschlossen', '<p>' + r.players + ' Spieler und ' + money(r.cash) + ' gehören jetzt Ihrem Verein. ' + esc(r.club.short) + ' steigt zum Saisonende zwangsweise ab.</p><p class="muted small">Tipp: Ihr Kader ist jetzt riesig – unter „Mannschaft“ und auf dem Transfermarkt können Sie Spieler verkaufen.</p>', '<button class="primary" data-act="closeModal">Weiter</button>');
  };
  U.acts.assetSell = function (d) { var r = E.sellAsset(U.st, U.club(), d.k, amt('q_' + d.k) || 1e12); U.toast(r.ok ? 'Verkauft: ' + money(r.revenue) + ' (' + (r.profit >= 0 ? '+' : '') + money(r.profit) + ')' : r.why); U.render(); };
})(RFM);
