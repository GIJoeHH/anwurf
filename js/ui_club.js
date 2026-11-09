// ANWURF! – Oberfläche: Vereinsmanagement, Stadion, Vereinsstadt, Bank & Finanzen
(function (R) {
  var D = R.data, W = R.world, E = R.econ, S = R.season, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;

  // ---------- Vereinsmanagement (Kacheln, Details in Fenstern) ----------
  var SP_IC = { haupt: 'trophy', trikot: 'shirt', aermel: 'medal', ausruester: 'activity', namensrechte: 'stadium', bande: 'megaphone' };
  var BUD_IC = { admin: 'receipt', marketing: 'megaphone', fans: 'handshake', scouting: 'scan-search', trainorg: 'calendar-days' };
  var STAFF_IC = { co: 'users', reha: 'heart-pulse', fitness: 'dumbbell', ernaehrung: 'utensils', assistent: 'briefcase' };
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
  var LOGO_IC = [[/versicher|optimus|insolvenz/i, 'shield'], [/brauerei|bier|brauhaus|getränk|wasser|quell/i, 'coffee'], [/bäcker|backer|wurst|würst|kartoffel|pommes|nudel|feinkost/i, 'utensils'], [/auto|kfz|turbo|rastst/i, 'car'], [/energie|solar|strom|flutlicht|elektro/i, 'zap'], [/telekom|software|pixel|tech/i, 'activity'], [/logistik|spedition|versand/i, 'bus'], [/kredit|sparkasse|bank/i, 'landmark'], [/möbel|baumarkt|schraube/i, 'hammer'], [/optik|brille/i, 'eye'], [/reise/i, 'map-pin'], [/schuh/i, 'activity'], [/friseur|haar|zahn/i, 'sparkles'], [/kohle|stahl/i, 'factory']];
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
      (ic ? '<g transform="translate(32,18) scale(1.5)" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (R.ICONS[ic === '👕' ? 'shirt' : ic] || '') + '</g><text x="50" y="84" font-size="15" font-weight="900" text-anchor="middle" fill="#fff" font-family="-apple-system,system-ui,sans-serif" letter-spacing="1">' + ini + '</text>' : '<text x="50" y="64" font-size="34" font-weight="900" text-anchor="middle" fill="#fff" font-family="Inter,-apple-system,sans-serif">' + ini + '</text>') + '</svg>';
  };

  U.screens.verein = function () {
    var st = U.st, c = U.club(), can = U.can('business');
    var h = '<div class="page-h"><div><h1 class="row" style="gap:10px">' + U.crest(c, 32) + 'Vereinsmanagement</h1><div class="page-sub">Sponsoren, Trainerteam und Verwaltung von ' + esc(c.name) + '</div></div></div>' + U.roleNote('business');
    // Sponsoren
    h += '<div class="sec-h">' + U.lc('handshake', 17) + ' Sponsoren <span style="margin-left:auto">' + money(E.sponsorTotal(c)) + ' pro Saison</span></div><div class="cards3">' + Object.keys(D.sponsorCategories).map(function (cat) {
      var s = c.sponsors.filter(function (x) { return x.cat === cat; })[0], off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0];
      var status = off ? '<span class="pill warn">' + off.offers.length + ' Angebote offen</span>' : s ? (s.years <= 1 ? '<span class="pill warn">läuft aus</span>' : '<span class="pill ok">aktiv</span>') : '<span class="pill">offen</span>';
      var bonus = s ? [s.bonusTop ? 'Top-' + s.topN + ': ' + money(s.bonusTop) : '', s.bonusPromo ? 'Aufstieg: ' + money(s.bonusPromo) : '', s.bonusTitle ? 'Meister: ' + money(s.bonusTitle) : ''].filter(Boolean) : [];
      return '<div class="ccard' + (s ? '' : ' empty') + (off ? ' attn' : '') + '" data-act="sponsorOpen" data-k="' + cat + '" tabindex="0" role="button"><div class="cc-top"><div class="ic-tile ' + (s ? 'ok' : 'neutral') + '">' + U.lc(SP_IC[cat], 19) + '</div><div class="cc-t"><b>' + D.sponsorCategories[cat] + '</b><span>' + (s ? s.years + ' J. Laufzeit' : 'kein Vertrag') + '</span></div>' + status + '</div>' +
        (s ? '<div class="cc-brand">' + U.brandLogo(s.name, 36, cat === 'ausruester') + '<span>' + esc(s.name) + '</span></div><div class="cc-val"><b>' + money(s.amount) + '</b><small>/Saison</small></div>' + (bonus.length ? '<div class="cc-sub">Prämien: ' + bonus.join(' · ') + '</div>' : '')
          : '<div class="cc-sub">' + (off ? 'Angebote vergleichen und unterschreiben' : can ? 'Antippen, um Angebote einzuholen' : 'Noch kein Sponsor') + '</div>') + '</div>';
    }).join('') + '</div>';
    // Trainerteam
    h += '<div class="sec-h">' + U.lc('users', 17) + ' Trainerteam <span style="margin-left:auto">Personalkosten ' + money((c.coach ? c.coach.wage : 0) + E.staffWages(c)) + ' pro Saison</span></div><div class="cards3">' +
      '<div class="ccard" data-act="coachOpen" tabindex="0" role="button"><div class="cc-top"><div class="ic-tile ok">' + U.lc('user-round', 19) + '</div><div class="cc-t"><b>Cheftrainer</b><span>' + esc(c.coach.profile) + '</span></div>' + U.stars(Math.round(c.coach.quality / 20), 5) + '</div><div class="cc-name">' + esc(U.coachName(c)) + '</div><div class="cc-sub">Taktik, Aufstellung und Trainingsarbeit · ' + money(c.coach.wage) + '/Saison</div></div>' +
      Object.keys(D.staff).map(function (k) {
        var s = c.staff && c.staff[k], l = s ? s.lvl : 0;
        return '<div class="ccard' + (l ? '' : ' empty') + '" data-act="staffOpen" data-k="' + k + '" tabindex="0" role="button"><div class="cc-top"><div class="ic-tile ' + (l ? 'ok' : 'neutral') + '">' + U.lc(STAFF_IC[k], 19) + '</div><div class="cc-t"><b>' + D.staff[k].n + '</b><span>' + (l ? D.staffLevels[l] : 'Vakanz') + '</span></div>' + U.stars(l, 3) + '</div>' +
          '<div class="cc-name">' + (s ? esc(s.name) : '<span class="muted">nicht besetzt</span>') + '</div><div class="cc-sub">' + esc(D.staff[k].eff) + (s ? ' · ' + money(s.wage) + '/Saison' : '') + '</div>' + (!l && (can || U.can('sport')) ? '<button class="sm secondary cc-btn" data-act="staffOpen" data-k="' + k + '">' + U.lc('user-plus', 14) + 'Einstellen</button>' : '') + '</div>';
      }).join('') + '</div>';
    // Verwaltung: Budgetstufen direkt wählbar
    h += '<div class="sec-h">' + U.lc('briefcase', 17) + ' Verwaltung &amp; Budgets <span style="margin-left:auto">' + money(Object.keys(D.budgetAreas).reduce(function (n, a) { return n + E.budgetCost(c, a); }, 0)) + ' pro Saison</span></div><div class="cards3">' + Object.keys(D.budgetAreas).map(function (a) {
      return '<div class="ccard bud"><div class="cc-top" data-act="budgetOpen" data-k="' + a + '"><div class="ic-tile">' + U.lc(BUD_IC[a], 19) + '</div><div class="cc-t"><b>' + D.budgetAreas[a] + '</b><span>' + BUD_FX[a][0] + '</span></div><b class="cc-cost">' + money(E.budgetCost(c, a)) + '</b></div><div class="cc-sub">' + BUD_FX[a][1] + '</div>' +
        '<div class="seg cc-seg">' + D.budgetLevels.map(function (l, i) { return '<button class="sm ' + (c.budgets[a] === i ? 'on' : '') + '" data-act="budgetQuick" data-k="' + a + '" data-v="' + i + '"' + (can ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div></div>';
    }).join('') + '</div>';
    // Vereinsdaten
    h += '<div class="sec-h">' + U.lc('shield', 17) + ' Verein</div><div class="grid g4">' + U.ikpi('star', 'Reputation', Math.round(c.reputation) + '/100', '', U.bar(c.reputation, 100, 'var(--act)')) + U.ikpi('users', 'Fanbasis', R.fmtNum(c.fans)) +
      U.ikpi('trophy', 'Titel', c.titles.league + ' · ' + c.titles.cup + ' · ' + c.titles.promo, '', '<div class="small muted">Meister · Pokal · Aufstiege</div>') + U.ikpi('ticket', 'Zuschauerrekord', R.fmtNum(c.records.attendance)) + '</div>';
    h += U.dealPanel(c);
    return h;
  };
  // Sponsorenfenster: bestehender Vertrag bzw. drei Angebote nebeneinander
  U.acts.sponsorOpen = function (d) {
    var st = U.st, c = U.club(), cat = d.k, can = U.can('business');
    var s = c.sponsors.filter(function (x) { return x.cat === cat; })[0], off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0];
    if (!s && !off && can) { U.acts.sponsorSearch({ k: cat }, true); off = st.inbox.filter(function (o) { return o.type === 'sponsor' && o.cat === cat; })[0]; }
    var title = U.lc(SP_IC[cat], 17) + ' ' + D.sponsorCategories[cat], h = '';
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
      return '<div class="cmp-card' + (c.budgets[a] === i ? ' best' : '') + '"><div class="ic-tile ' + ['neutral', '', 'ok'][i] + '" style="margin:0 auto">' + U.lc(['coins', 'briefcase', 'gem'][i], 20) + '</div><b>' + l + '</b><div class="tv mono">' + money(cost) + '/J.</div><div class="ts small muted">' + ['Spart Geld, leichte Nachteile', 'Ausgewogen', 'Teuer, spürbare Vorteile'][i] + '</div>' +
        (c.budgets[a] === i ? '<span class="tag green">aktiv</span>' : can ? '<button class="primary sm" data-act="budgetSet" data-k="' + a + '" data-v="' + i + '">Wählen</button>' : '') + '</div>';
    }).join('') + '</div>';
    U.modal(U.lc(BUD_IC[a], 17) + ' ' + D.budgetAreas[a], h, '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.budgetSet = function (d) { U.club().budgets[d.k] = +d.v; U.acts.budgetOpen(d); U.render(); };
  U.acts.budget = U.acts.budgetSet;
  U.acts.budgetQuick = function (d) { if (!U.can('business')) return; U.club().budgets[d.k] = +d.v; U.render(); };
  // Trainerstab-Fenster
  U.acts.staffOpen = function (d) {
    var st = U.st, c = U.club(), k = d.k, def = D.staff[k], cur = E.staffLvl(c, k), can = U.can('business') || U.can('sport');
    var h = '<p class="small">' + def.d + ' <b>Wirkung:</b> ' + def.eff + '.</p><div class="cmp">' + D.staffLevels.map(function (l, i) {
      return '<div class="cmp-card' + (cur === i ? ' best' : '') + '"><div>' + U.stars(i, 3) + '</div><b>' + l + '</b><div class="tv mono">' + (i ? money(E.staffWageFor(c, i)) + '/J.' : '–') + '</div>' +
        (cur === i ? '<span class="tag green">' + (i ? esc(c.staff[k].name) : 'aktuell') + '</span>' : can ? '<button class="' + (i ? 'primary' : '') + ' sm" data-act="staffSet" data-k="' + k + '" data-v="' + i + '">' + (i ? (cur ? 'Wechseln' : 'Einstellen') : 'Entlassen') + '</button>' : '') + '</div>';
    }).join('') + '</div><p class="muted small" style="margin-top:10px">Bei einem Wechsel oder einer Entlassung fällt eine Abfindung von einem Vierteljahresgehalt an.</p>';
    U.modal(U.lc(STAFF_IC[k], 17) + ' ' + def.n, h, '<button data-act="closeModal">Schließen</button>', true);
  };
  U.acts.staffSet = function (d) { var r = E.setStaff(U.st, U.club(), d.k, +d.v); if (r.ok) U.toast(+d.v ? D.staff[d.k].n + ' ' + r.s.name + ' eingestellt.' : D.staff[d.k].n + ' entlassen.'); U.acts.staffOpen(d); U.render(); };
  U.acts.coachOpen = function () {
    var st = U.st, c = U.club(), own = U.coachName(c) !== c.coach.name;
    var h = '<div class="row" style="gap:16px;flex-wrap:nowrap"><div class="ic-tile ok" style="width:64px;height:64px">' + U.lc('user-round', 32) + '</div><div><h3 style="margin:0">' + esc(U.coachName(c)) + '</h3><div class="muted small">' + (own ? 'Sie stehen selbst an der Seitenlinie.' : 'Cheftrainer') + '</div>' +
      '<table class="t small" style="margin-top:8px"><tr><td>Spielphilosophie</td><td>' + esc(c.coach.profile) + '</td></tr><tr><td>Trainerqualität</td><td>' + U.stars(Math.round(c.coach.quality / 20), 5) + ' (' + c.coach.quality + ')</td></tr><tr><td>Gehalt</td><td>' + money(c.coach.wage) + '/J.</td></tr></table></div></div>' +
      (own ? '<p class="muted small" style="margin-top:10px">Philosophie und Qualität beschreiben das sportliche Know-how Ihres Teams. Mit Co-, Reha- und Fitnesstrainern verbessern Sie es weiter.</p>' : '');
    U.modal('Cheftrainer', h, (st.manager.role === 'gf' ? '<button data-act="coachMarket">Trainer wechseln</button>' : '') + '<button class="primary" data-act="closeModal">Schließen</button>');
  };
  U.acts.coachMarket = function () {
    var st = U.st, c = U.club();
    // Vier Kandidaten in unterschiedlichen Preisklassen: günstig, solide, gut und ein Spitzentrainer (4–5 Sterne)
    var base = 30 + c.tier * 60;
    U.coachOffers = U.coachOffers || [R.randInt(-18, -8), R.randInt(-4, 6), R.randInt(10, 20), null].map(function (dq) {
      return W.genCoach(dq == null ? R.randInt(Math.min(94, Math.max(78, Math.round(base + 15))), 99) : R.clamp(base + dq, 20, 92), c.league);
    }).sort(function (a2, b2) { return a2.quality - b2.quality; });
    var comp = Math.round(c.coach.wage * 0.5);
    U.modal('Trainermarkt', '<p class="small">Abfindung für den aktuellen Trainer: ' + money(comp) + '</p><div class="cmp">' + U.coachOffers.map(function (k, i) { return '<div class="cmp-card"><div class="ic-tile" style="margin:0 auto">' + U.lc('user-round', 22) + '</div><b>' + esc(k.name) + '</b><div class="small muted">' + k.age + ' Jahre · ' + esc(k.profile) + '</div><div>' + U.stars(Math.round(k.quality / 20), 5) + '</div><div class="tv mono">' + money(k.wage) + '/J.</div><button class="sm primary" data-act="hireCoach" data-i="' + i + '">Einstellen</button></div>'; }).join('') + '</div>', '<button data-act="closeModal">Abbrechen</button>', true);
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
    h += U.stadiumStage(st, c);
    h += '<div class="grid g2" style="margin-top:14px">';
    // Ticketpreise
    var ref = E.refPrices[c.league], fakeAway = st.clubs[st.leagues[W.lk(c)].clubIds.filter(function (x) { return x !== c.id; })[0]];
    var est = E.attendance(st, c, fakeAway, 'league');
    h += '<div class="panel"><h2>Eintrittspreise</h2>' + ['steh', 'sitz', 'vip'].map(function (k) {
      return '<div class="row between" style="margin-bottom:6px"><span>' + { steh: 'Stehplatz', sitz: 'Sitzplatz', vip: parts.biz ? 'Logen (Business 35 %)' : 'VIP' }[k] + ' <span class="muted small">(' + R.fmtNum(parts[k]) + ' Plätze, üblich ~' + ref[k] + ' €)</span></span><span><input type="number" style="width:80px" data-chg="ticket" data-k="' + k + '" value="' + c.tickets[k] + '" min="1"' + (U.can('business') ? '' : ' disabled') + '> €</span></div>';
    }).join('') + '<div class="help small">Prognose gegen einen Durchschnittsgegner: <b>' + R.fmtNum(est.total) + '</b> Zuschauer (' + Math.round(est.total / Math.max(1, est.capacity) * 100) + ' %), Erlös ' + money(est.ticket + est.cater + est.parking) + ', Nachfrage ' + R.fmtNum(est.demand) + ', Zufriedenheit ' + est.satisfaction + '/100' + (est.congestion > 0.05 ? '<br><span class="warn">⚠️ Verkehrsengpass: Staus kosten Zuschauer und Fanzufriedenheit.</span>' : '') + '</div></div>';
    h += '<div class="panel"><h2>Zuschauerverlauf</h2>' + (c.attendanceHist.length > 1 ? U.sparkline(c.attendanceHist, 300, 90, '#3b82f6') : '<p class="muted small">Noch keine Heimspiele.</p>') + '<p class="muted small">Rekord: ' + R.fmtNum(c.records.attendance) + '</p></div></div>';
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

  // Hallenplan (Tribünenplan, Ausbauvorschau) und Hallenansicht: siehe ui_stadium.js

  // ---------- Vereinsstadt ----------
  U.screens.stadt = function () {
    var st = U.st, c = U.club();
    var keys = ['fanshop', 'restaurant', 'cafe', 'hotel', 'museum', 'eventhalle', 'erlebnis', 'gewerbe', 'solar', 'geschaeft'];
    var rev = 0, up = 0;
    keys.forEach(function (k) { rev += E.buildingRevenue(st, c, k); var l = E.level(c, k); up += l ? l.up : 0; });
    var h = '<h1 class="row" style="gap:10px">' + U.crest(c, 34) + 'Vereinsstadt</h1>' + U.roleNote('business') + '<div class="grid g4" style="margin-bottom:14px">' + U.ikpi('city', 'Einnahmen Betriebe', money(rev) + '/J.') + U.ikpi('debt', 'Betriebskosten', money(up) + '/J.') + U.ikpi('growth', 'Überschuss', money(rev - up) + '/J.', rev - up < 0 ? 'neg' : 'pos') + U.ikpi('energy', 'Energieersparnis', Math.round(E.energySave(c) * 100) + ' %') + '</div>';
    h += U.cityStage(st, c);
    h += '<div class="row" style="margin:12px 0"><label class="row"><input type="checkbox" data-chg="cityAuto"' + (c.cityAutoBuild ? ' checked' : '') + (U.can('business') ? '' : ' disabled') + '> Wirtschaftsbetriebe automatisch verwalten (KI baut rentable Betriebe selbstständig aus)</label>' +
      '<span class="muted small">Preisniveau:</span><div class="seg">' + ['Günstig', 'Normal', 'Gehoben'].map(function (l, i) { return '<button class="sm ' + ((c.cityPrice == null ? 1 : c.cityPrice) === i ? 'on' : '') + '" data-act="cityPrice" data-v="' + i + '"' + (U.can('business') ? '' : ' disabled') + '>' + l + '</button>'; }).join('') + '</div></div>';
    h += '<div class="panel tight" style="margin-bottom:14px">' + U.table('cityT', [
      { k: 'n', l: 'Betrieb', f: function (r) { return esc(r.n); } }, { k: 'lvl', l: 'Stufe', num: true, f: function (r) { return r.lvl + '/' + r.max + (U.isBuilding(c, r.id) ? ' ' + U.buildMark() : ''); } },
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
    var st = U.st, c = U.club(), can = U.can('business'), tab = U.p.tab || 'uebersicht';
    if (tab === 'bank') tab = 'kredit';
    var debt = E.debt(c), stocksV = E.portfolioValue(st, c, 'stocks'), cryptoV = E.portfolioValue(st, c, 'crypto'), net = c.cash + c.savings + stocksV + cryptoV - debt;
    var h = '<div class="page-h"><div><h1>Bank &amp; Finanzen</h1><div class="page-sub">Vereinsbank ' + esc(c.city) + ' · Konto von ' + esc(c.name) + '</div></div><div class="row"><span class="pill ' + (net < 0 ? 'bad' : 'ok') + '">' + U.lc('wallet', 13) + 'Nettovermögen ' + money(net) + '</span></div></div>' + U.roleNote('business');
    h += '<div class="seg" style="margin-bottom:16px">' + [['uebersicht', 'Übersicht', 'landmark'], ['kredit', 'Kredite & Tagesgeld', 'piggy-bank'], ['aktien', 'Aktienmarkt', 'chart-line'], ['krypto', 'Kryptowährungen', 'bitcoin'], ['bilanz', 'Finanzbericht', 'receipt']].map(function (x) { return '<button class="' + (tab === x[0] ? 'on' : '') + '" data-act="tab" data-s="bank" data-tab="' + x[0] + '">' + U.lc(x[2], 15) + x[1] + '</button>'; }).join('') + '</div>';
    if (tab === 'uebersicht') {
      var lim = E.creditLimit(st, c), rate = E.loanRate(st, c);
      var row = function (ic, l, v, cls, sub, tone) { return '<div class="fin-row"><div class="ic-tile ' + (tone || '') + '">' + U.lc(ic, 19) + '</div><div class="fin-l"><span>' + l + '</span>' + (sub ? '<small>' + sub + '</small>' : '') + '</div><b class="' + (cls || '') + '">' + v + '</b></div>'; };
      var labels = st.settings.cheatEnabled ? [{ x: -13, y: 21.35, z: 2.6, html: 'BANKDIREKTOR', cls: 'director-sign', act: 'bankSign' }] : [];
      h += '<div class="bank-hero"><div class="panel tight bank-img">' + (R.s3d ? R.s3d.host('bank', { kind: 'bank', model: R.stadiumModel.build(c), cam: 'bank', labels: labels, interactive: true, ratio: '16/10',
        fallback: '<div class="bank-fb">' + U.lc('landmark', 48) + '<b>Vereinsbank ' + esc(c.city) + '</b>' + (st.settings.cheatEnabled ? '<div class="director-sign static" data-act="bankSign">BANKDIREKTOR</div>' : '') + '</div>' }) : '') + '</div>';
      h += '<div class="panel"><div class="panel-h"><h2>' + U.lc('landmark', 17) + ' Finanzstatus</h2><span class="muted small">' + esc(c.name) + '</span></div>' +
        row('wallet', 'Girokonto', '<span data-cash>' + money(c.cash) + '</span>', c.cash < 0 ? 'neg' : '', c.cash < 0 ? 'Dispozins 12 %' : '', c.cash < 0 ? 'bad' : '') +
        row('piggy-bank', 'Tagesgeld', money(c.savings), '', (st.savingsRate * 100).toFixed(2).replace('.', ',') + ' % Zins', 'ok') +
        row('chart-line', 'Wertpapiervermögen', money(stocksV), '', Object.keys(c.portfolio).filter(function (k) { return D.stocks.some(function (s) { return s.id === k; }); }).length + ' Positionen') +
        row('bitcoin', 'Kryptowährungen', money(cryptoV), '', 'hohe Schwankungen', 'warn') +
        row('credit-card', 'Kreditschulden', debt ? '−' + money(debt) : money(0), debt ? 'neg' : '', c.loans.length ? c.loans.length + ' Kredit(e)' : 'schuldenfrei', debt ? 'bad' : 'neutral') +
        '<div class="fin-total">' + row('gem', 'Nettofinanzvermögen', money(net), net < 0 ? 'neg' : 'pos', 'Konto + Tagesgeld + Depot − Kredite', net < 0 ? 'bad' : 'ok') + '</div>' +
        row('banknote', 'Freier Kreditrahmen', money(lim), '', 'Zinssatz für neue Kredite ' + (rate * 100).toFixed(1).replace('.', ',') + ' %', 'neutral') + '</div></div>';
      h += U.forecastPanel(st, c, false);
      var last = c.fin.season, inc = 0, exp = 0, weeks = Math.max(1, st.week);
      Object.keys(last).forEach(function (k) { if (['Kreditaufnahme', 'Tilgung', 'Kapitalanlagen'].indexOf(k) >= 0) return; if (last[k] > 0) inc += last[k]; else exp += last[k]; });
      h += '<div class="grid g21"><div class="panel"><div class="panel-h"><h2>' + U.lc('chart-line', 17) + ' Kontoverlauf</h2><span class="muted small">letzte ' + Math.min(40, (c.hist || []).length) + ' Wochen</span></div>' + U.lineChart(U.hist(c, 'cash', 40), { h: 130, color: c.cash < 0 ? '#E35E63' : '#18B979', zero: true, fmt: money, empty: 'Verlauf ab dem 2. Spieltag' }) + '</div>' +
        '<div class="panel"><h2>' + U.lc('receipt', 17) + ' Diese Saison</h2><div class="grid">' + U.ikpi('trending-up', 'Einnahmen', money(inc), 'pos') + U.ikpi('trending-down', 'Ausgaben', money(exp), 'neg') + U.ikpi('coins', 'Ø pro Woche', money((inc + exp) / weeks), U.moneyCls(inc + exp)) + '</div></div></div>';
    }
    if (tab === 'kredit') {
      var rate2 = E.loanRate(st, c), lim2 = E.creditLimit(st, c), zins = R.sum(c.loans, function (l) { return l.amount * l.rate; });
      var il = (c.interestLog || []).filter(function (x) { return x.s === st.season; });
      h += '<div class="grid g2"><div class="panel fin-card"><div class="panel-h"><h2>' + U.lc('credit-card', 17) + ' Kredite</h2><span class="pill ' + (debt ? 'bad' : 'ok') + '">' + (debt ? 'verschuldet' : 'schuldenfrei') + '</span></div>' +
        '<div class="fc-grid"><div><span>Aktuelle Kreditsumme</span><b class="' + (debt ? 'neg' : '') + '">' + money(debt) + '</b></div><div><span>Zinssatz (neu)</span><b>' + (rate2 * 100).toFixed(1).replace('.', ',') + ' %</b></div><div><span>Freier Kreditrahmen</span><b>' + money(lim2) + '</b></div><div><span>Zinsbelastung</span><b class="' + (zins ? 'neg' : '') + '">' + money(zins) + '<small>/J.</small></b></div></div>' +
        (c.loans.length ? '<table class="t small" style="margin-top:10px"><tr><th>Kredit</th><th class="num">Betrag</th><th class="num">Zins</th><th class="num">seit</th></tr>' + c.loans.map(function (l, i) { return '<tr><td>Kredit ' + (i + 1) + '</td><td class="num">' + money(l.amount) + '</td><td class="num">' + (l.rate * 100).toFixed(1).replace('.', ',') + ' %</td><td class="num">' + l.since + '</td></tr>'; }).join('') + '</table>' : '') +
        (can ? '<div class="fc-act"><label class="f">Betrag (€)<input type="number" id="loanAmt" placeholder="z. B. 1.000.000" step="100000"></label><div class="row"><button class="primary" data-act="loanTake">' + U.lc('plus', 15) + 'Kredit aufnehmen</button><button data-act="loanRepay">Teiltilgung</button><button class="ghost" data-act="loanRepayAll">Vollständig zurückzahlen</button></div></div>' : '') +
        '<p class="muted small">Der Zinssatz hängt von Bonität und Verschuldung ab. Ein negativer Kontostand kostet 12 % Dispozinsen. Hohe Überschuldung führt am Saisonende zu Punktabzug.</p></div>';
      h += '<div class="panel fin-card"><div class="panel-h"><h2>' + U.lc('piggy-bank', 17) + ' Tagesgeld</h2><span class="pill ok">' + (st.savingsRate * 100).toFixed(2).replace('.', ',') + ' % p. a.</span></div>' +
        '<div class="fc-grid"><div><span>Guthaben</span><b>' + money(c.savings) + '</b></div><div><span>Zinssatz (variabel)</span><b>' + (st.savingsRate * 100).toFixed(2).replace('.', ',') + ' %</b></div><div><span>Aufgelaufene Zinsen</span><b class="pos">' + money(c.interestAccrued || 0) + '</b><small>Gutschrift nach dem ' + E.nextInterestWeek(st) + '. Spieltag</small></div><div><span>Zinsen diese Saison</span><b class="pos">' + money(R.sum(il, function (x) { return x.a; })) + '</b><small>ca. ' + money(c.savings * st.savingsRate * E.INTEREST_MONTH / E.WEEKS) + ' pro Monat</small></div></div>' +
        (il.length ? '<table class="t small" style="margin-top:10px"><tr><th>Gutschrift</th><th class="num">Betrag</th></tr>' + il.slice(-5).reverse().map(function (x) { return '<tr><td>nach dem ' + x.w + '. Spieltag</td><td class="num pos">+' + money(x.a) + '</td></tr>'; }).join('') + '</table>' : '') +
        (can ? '<div class="fc-act"><label class="f">Betrag (€)<input type="number" id="savAmt" placeholder="z. B. 500.000" step="100000"></label><div class="row"><button class="primary" data-act="savIn">' + U.lc('plus', 15) + 'Geld einzahlen</button><button data-act="savOut">' + U.lc('minus', 15) + 'Geld auszahlen</button></div></div>' : '') +
        '<p class="muted small">Jederzeit verfügbar. Die Zinsen werden monatlich (alle ' + E.INTEREST_MONTH + ' Spielwochen) dem Girokonto gutgeschrieben.</p></div></div>';
    }
    if (tab === 'aktien' || tab === 'krypto') h += U.marketView(st, c, tab, can);
    if (tab === 'bilanz') h += U.forecastPanel(st, c, true) + U.financeReport(c);
    return h;
  };
  // Aktien- und Kryptokarten (gleiches Designsystem; Krypto mit Volatilitätshinweis)
  var RANGES = [[26, '6 Mon.'], [52, '1 Jahr'], [104, '2 Jahre']];
  function chgOver(m, weeks) { var h = m.hist, n = Math.min(weeks, h.length - 1); var first = h[h.length - 1 - n]; return first ? (m.price / first - 1) * 100 : 0; }
  function pct(v) { return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1).replace('.', ',') + ' %'; }
  U.marketView = function (st, c, tab, can) {
    E.ensureMarkets(st);
    var defs = tab === 'aktien' ? D.stocks : D.cryptos, mk = tab === 'aktien' ? st.market.stocks : st.market.crypto, range = U.p.range || 52, crypto = tab === 'krypto';
    var depot = 0, cost = 0; defs.forEach(function (sd) { var pf = c.portfolio[sd.id]; if (pf && mk[sd.id]) { depot += pf.qty * mk[sd.id].price; cost += pf.cost; } });
    var h = '<div class="mkt-head"><div class="help" style="margin:0;flex:1">' + U.lc(crypto ? 'triangle-alert' : 'info', 15) + ' ' + (crypto ? 'Fiktive Kryptowährungen – extrem schwankend: Kurssprünge, Crashs und Spekulationsblasen jederzeit möglich. Kein Echtgeld.' : 'Fiktiver Aktienmarkt – Kurse ändern sich wöchentlich, 0,5 % Gebühr pro Kauf/Verkauf. Börsencrashs kommen unregelmäßig und drücken alle Kurse.') + '</div>' +
      '<div class="mkt-depot"><span>Depotwert</span><b>' + money(depot) + '</b><em class="' + (depot - cost >= 0 ? 'pos' : 'neg') + '">' + (cost ? (depot - cost >= 0 ? '+' : '') + money(depot - cost) : '–') + '</em></div>' +
      '<div class="seg">' + RANGES.map(function (x) { return '<button class="sm ' + (range === x[0] ? 'on' : '') + '" data-act="chartRange" data-v="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div><div class="mkt-grid">';
    defs.forEach(function (sd) {
      var m = mk[sd.id]; if (!m) return;
      var pf = c.portfolio[sd.id], hist = m.hist.slice(-range - 1), chg = chgOver(m, range), wk = chgOver(m, 1);
      var val = pf ? pf.qty * m.price : 0, buyIn = pf ? pf.cost / pf.qty : null;
      var bvb = sd.club ? E.bvbClub(st) : null, stake = sd.club ? E.bvbStake(st, c) : 0;
      if (sd.club && (!bvb || bvb.id === c.id)) return;
      var rl = { 26: '6 Monate', 52: '12 Monate', 104: '24 Monate' }[range];
      h += '<div class="panel mkt-card' + (sd.club ? ' club' : '') + '"><div class="mkt-top"><div class="mkt-name">' + (sd.club && bvb ? U.crest(bvb, 28) : '<div class="ic-tile ' + (crypto ? 'warn' : '') + '">' + U.lc(crypto ? 'coins' : 'factory', 18) + '</div>') + '<div><b>' + esc(sd.club && bvb ? bvb.name + ' (Aktie)' : sd.name) + '</b><span>' + sd.id + (crypto ? ' · Volatilität ' + (sd.vol > 0.2 ? 'extrem' : 'hoch') : '') + '</span></div></div>' +
        '<div class="mkt-price"><b>' + U.fmtPrice(m.price) + '</b><span class="' + (wk >= 0 ? 'pos' : 'neg') + '">' + pct(wk) + ' <small>Woche</small></span></div></div>' +
        U.priceChart(m, { range: range, buyIn: buyIn, h: 170 }) +
        '<div class="chart-meta"><span>' + rl + ': <b class="' + (chg >= 0 ? 'pos' : 'neg') + '">' + pct(chg) + '</b></span><span>Tief ' + U.fmtPrice(Math.min.apply(null, hist)) + ' · Hoch ' + U.fmtPrice(Math.max.apply(null, hist)) + '</span></div>' +
        (sd.club && bvb ? '<div style="margin-top:8px"><div class="row between small"><span>Ihr Anteil: <b>' + (stake * 100).toFixed(2).replace('.', ',') + ' %</b></span><span class="muted">Mehrheit ab 50 % · ' + R.fmtNum(sd.shares) + ' Aktien</span></div><div class="stake"><i style="width:' + Math.min(100, stake * 100) + '%"></i></div>' +
          (bvb.takenOverBy === c.id ? '<div class="small pos" style="margin-top:4px">Übernommen – der Verein steigt zum Saisonende ab.</div>' : '<div class="small muted" style="margin-top:4px">Mit der Aktienmehrheit übernehmen Sie alle Spieler und das Vermögen von ' + esc(bvb.short) + ' – der Verein muss zwangsweise absteigen. Große Käufe treiben den Kurs. Mehrheit bei aktuellem Kurs: ca. ' + money(Math.max(0, sd.shares * 0.5001 - (pf ? pf.qty : 0)) * m.price) + '.</div>') + '</div>' : '') +
        '<div class="mkt-hold"><div><span>Bestand</span><b>' + (pf ? R.fmtNum(pf.qty) : '–') + '</b></div><div><span>Depotwert</span><b>' + (pf ? money(val) : '–') + '</b></div><div><span>Gewinn/Verlust</span><b class="' + (pf ? (val - pf.cost >= 0 ? 'pos' : 'neg') : '') + '">' + (pf ? (val - pf.cost >= 0 ? '+' : '') + money(val - pf.cost) : '–') + '</b></div><div><span>Einstieg Ø</span><b>' + (pf ? U.fmtPrice(buyIn) : '–') + '</b></div></div>' +
        (can ? (function () {
          var eur = U.p.tradeMode === 'eur', maxQ = Math.floor(Math.max(0, c.cash) / (m.price * 1.005));
          return '<div class="mkt-act"><div class="seg seg-xs"><button class="sm ' + (eur ? '' : 'on') + '" data-act="tradeMode" data-v="qty">Stück</button><button class="sm ' + (eur ? 'on' : '') + '" data-act="tradeMode" data-v="eur">€</button></div>' +
            '<input type="number" id="q_' + sd.id + '" placeholder="' + (eur ? 'Betrag in €' : 'Stück') + '" min="1" data-pad data-mult' + (eur ? ' data-money' : '') + '>' +
            '<button class="sm primary" data-act="assetBuy" data-k="' + sd.id + '">Kaufen</button><button class="sm" data-act="assetSell" data-k="' + sd.id + '"' + (pf ? '' : ' disabled') + '>Verkaufen</button><button class="sm ghost" data-act="assetDetail" data-k="' + sd.id + '" data-t="' + tab + '">Details</button>' +
            '<span class="muted small">max. ' + (eur ? money(Math.max(0, c.cash)) : R.fmtNum(maxQ) + ' Stück') + '</span></div>';
        })() : '') + '</div>';
    });
    return h + '</div>';
  };
  // Detailansicht eines Wertpapiers: alle Zeiträume, großer Chart
  U.acts.assetDetail = function (d) {
    var st = U.st, c = U.club(), crypto = d.t === 'krypto', mk = crypto ? st.market.crypto : st.market.stocks, m = mk[d.k], sd = (crypto ? D.cryptos : D.stocks).filter(function (x) { return x.id === d.k; })[0], pf = c.portfolio[d.k];
    var h = '<div class="mkt-price" style="margin-bottom:10px"><b style="font-size:26px">' + U.fmtPrice(m.price) + '</b></div><div class="pp-kpis">' + RANGES.concat([[1, '1 Woche']]).map(function (x) { var v = chgOver(m, x[0]); return '<div><span>' + x[1] + '</span><b class="' + (v >= 0 ? 'pos' : 'neg') + '">' + pct(v) + '</b></div>'; }).join('') +
      '<div><span>Bestand</span><b>' + (pf ? R.fmtNum(pf.qty) : '–') + '</b></div><div><span>Depotwert</span><b>' + (pf ? money(pf.qty * m.price) : '–') + '</b></div></div><div class="sub-h">Kursverlauf 2 Jahre</div>' + U.priceChart(m, { range: 104, buyIn: pf ? pf.cost / pf.qty : null, h: 220 }) +
      '<p class="muted small">Alle Kurse stammen aus der gespeicherten Marktsimulation und ändern sich nur mit den Spielwochen.</p>';
    U.drawer(esc(sd ? sd.name : d.k) + ' <span class="muted small">' + d.k + '</span>', h, '<button class="ghost" data-act="closeModal">Schließen</button>');
  };
  // Bilanzprognose bis Saisonende (Controlling): Werte aus E.forecast, nachvollziehbare Rechnung
  var FC_IC = { 'Eintrittsgelder': 'ticket', 'TV-Gelder': 'zap', 'Sponsoren': 'handshake', 'Sponsorenboni': 'handshake', 'Hallengastronomie': 'utensils', 'Parkgebühren': 'circle-parking', 'Prämien': 'trophy', 'Zinserträge': 'piggy-bank', 'Spielergehälter': 'shirt', 'Trainer & Personal': 'users', 'Verwaltung & Budgets': 'briefcase', 'Unterhalt Anlagen': 'hammer', 'Kreditzinsen': 'credit-card', 'Nachwuchsgehälter': 'graduation-cap' };
  U.finIcon = function (k) {
    if (FC_IC[k]) return FC_IC[k];
    if (/stadt|shop|hotel|museum|café|cafe|restaurant|event|gewerbe/i.test(k)) return 'building-2';
    if (/merch/i.test(k)) return 'store'; if (/zins|kredit/i.test(k)) return 'credit-card'; if (/gehalt|lohn/i.test(k)) return 'users'; if (/bau|unterhalt/i.test(k)) return 'hammer'; if (/medizin/i.test(k)) return 'stethoscope'; if (/jugend|nachwuchs/i.test(k)) return 'graduation-cap'; if (/transfer|ablöse/i.test(k)) return 'arrow-left-right';
    return 'circle-dollar-sign';
  };
  U.forecastPanel = function (st, c, full) {
    var f = E.forecast(st, c);
    var pastE = (c.hist || []).filter(function (x) { return x.s === st.season && x.cash != null; });
    var past = pastE.map(function (x) { return x.cash; }), pastW = pastE.map(function (x) { return x.w; });
    if (past.length && Math.abs(past[past.length - 1] - c.cash) > 1) { past.push(c.cash); pastW.push(st.week); }
    var diff = f.endCash - c.cash;
    var h = '<div class="panel forecast" style="margin-bottom:16px"><div class="panel-h"><h2>' + U.lc('chart-line', 17) + ' Bilanzprognose bis Saisonende</h2><span class="muted small">' +
      (f.weeksLeft ? 'noch ' + f.weeksLeft + ' Spielwochen · ' + f.homeGames + ' Heimspiele' : 'Saison beendet') + '</span></div>';
    h += '<div class="grid g4" style="margin-bottom:12px">' +
      U.ikpi('wallet', 'Kontostand heute', money(c.cash), U.moneyCls(c.cash)) +
      U.ikpi('trending-up', 'Erwartete Einnahmen', '+' + money(f.income), 'pos') +
      U.ikpi('trending-down', 'Erwartete Ausgaben', money(f.expense), 'neg') +
      U.ikpi(f.endCash < 0 ? 'triangle-alert' : 'flag', 'Kontostand Saisonende', money(f.endCash), f.endCash < 0 ? 'neg' : '', '<div class="small ' + (diff < 0 ? 'neg' : 'pos') + '">' + (diff >= 0 ? '+' : '') + money(diff) + ' gegenüber heute</div>') + '</div>';
    // Unsicherheit: wächst mit der Wurzel der Restwochen (Schwankung der Spieltagseinnahmen)
    var gate = (f.lines['Eintrittsgelder'] || 0) + (f.lines['Hallengastronomie'] || 0) + (f.lines['Parkgebühren'] || 0), sigma = f.homeGames ? gate / f.homeGames * 0.18 : 0;
    h += U.liqChart(past, pastW, f.path, { h: full ? 230 : 180, from: f.from, sigma: sigma, seasonEnd: f.seasonEnd });
    h += '<div class="fc-eq"><span>Heute <b>' + money(c.cash) + '</b></span><i>+</i><span>Einnahmen <b class="pos">' + money(f.income) + '</b></span><i>−</i><span>Ausgaben <b class="neg">' + money(-f.expense) + '</b></span><i>=</i><span>Saisonende <b class="' + (f.endCash < 0 ? 'neg' : '') + '">' + money(f.endCash) + '</b></span></div>';
    if (f.endCash < 0) h += '<div class="msg-warn small" style="margin-top:8px">' + U.lc('triangle-alert', 15) + ' Ohne Gegenmaßnahmen rutscht das Konto bis Saisonende ins Minus – Dispozinsen (12 %) und am Saisonende Punktabzug drohen.</div>';
    if (full) {
      var keys = Object.keys(f.lines).filter(function (k) { return Math.round(f.lines[k]) !== 0; });
      var inc = keys.filter(function (k) { return f.lines[k] > 0; }).sort(function (a, b) { return f.lines[b] - f.lines[a]; });
      var exp = keys.filter(function (k) { return f.lines[k] < 0; }).sort(function (a, b) { return f.lines[a] - f.lines[b]; });
      var mx = Math.max(f.income, -f.expense) || 1;
      h += '<div class="grid g2" style="margin-top:14px"><div class="fc-col"><div class="fc-col-h"><span>' + U.lc('trending-up', 16) + 'Noch zu erwartende Einnahmen</span><b class="pos">' + money(f.income) + '</b></div>' + U.hbars(inc.map(function (k) { return { k: k, v: f.lines[k] }; }), mx, 'var(--ok)', true) + '</div>' +
        '<div class="fc-col"><div class="fc-col-h"><span>' + U.lc('trending-down', 16) + 'Noch zu erwartende Ausgaben</span><b class="neg">' + money(f.expense) + '</b></div>' + U.hbars(exp.map(function (k) { return { k: k, v: f.lines[k] }; }), mx, 'var(--bad)', true) + '</div></div>';
      // Einmalige Investitionen getrennt von laufenden Kosten
      var once = ['Bauprojekte', 'Transferausgaben', 'Handgelder', 'Abfindungen'].map(function (k) { return [k, (c.fin.season || {})[k] || 0]; }).filter(function (x) { return Math.round(x[1]) !== 0; });
      var jobs = (c.construction || []).length + ((c.stadium && c.stadium.jobs) || []).length;
      h += '<div class="fc-once"><div class="sub-h" style="margin-top:14px">Einmalige Investitionen (bereits gebucht, nicht in der Prognose)</div>' + (once.length ? '<div class="fc-once-row">' + once.map(function (x) { return '<span>' + U.lc(U.finIcon(x[0]), 14) + esc(x[0]) + ' <b class="neg">' + money(x[1]) + '</b></span>'; }).join('') + '</div>' : '<div class="muted small">In dieser Saison noch keine.</div>') +
        (jobs ? '<div class="muted small" style="margin-top:6px">' + jobs + ' laufende Bauprojekt(e): Baukosten wurden beim Baustart bezahlt; höhere laufende Kosten wirken erst nach Fertigstellung.</div>' : '') + '</div>';
      h += '<p class="muted small" style="margin-top:10px">Hochrechnung mit den aktuellen Gehältern, Sponsoren, Eintrittspreisen und Gegnern; Liga-Prämie und Sponsorenboni nach aktuellem Tabellenplatz (' + f.pos + '.). Nicht enthalten: Pokalspiele, Transfers, neue Bauprojekte und Kursänderungen bei Aktien/Krypto. Das Band um die Prognose zeigt die übliche Schwankung der Zuschauereinnahmen.</p>';
    } else h += '<div class="row between small" style="margin-top:8px"><span class="muted">Einnahmen, Ausgaben und Details im Finanzbericht</span><button class="sm" data-act="tab" data-s="bank" data-tab="bilanz">Finanzbericht ' + U.lc('chevron-right', 14) + '</button></div>';
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
    var pad = (mx - mn) * 0.08; mn = Math.max(0, mn - pad); mx += pad; // Kurse nie unter 0
    var x = function (i) { return L + (W_ - L - Rr) * i / Math.max(1, hist.length - 1); }, y = function (v) { return T + (H - T - B) * (1 - (v - mn) / (mx - mn)); };
    var up = hist[hist.length - 1] >= hist[0], col = up ? '#18B979' : '#E35E63', id = 'pc' + Math.floor(Math.random() * 1e9);
    var pts = hist.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); }).join(' ');
    var svg = '<svg viewBox="0 0 ' + W_ + ' ' + H + '"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".35"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>';
    for (var g = 0; g <= 3; g++) { var gv = mn + (mx - mn) * g / 3, gy = y(gv); svg += '<line x1="' + L + '" y1="' + gy.toFixed(1) + '" x2="' + (W_ - Rr) + '" y2="' + gy.toFixed(1) + '" stroke="#22365A" stroke-width="1"/><text x="' + (L - 6) + '" y="' + (gy + 4).toFixed(1) + '" font-size="12.5" fill="#9CAFC9" text-anchor="end">' + U.fmtPrice(gv).replace(' €', '') + '</text>'; }
    var n = hist.length; [[0, 'vor ' + weeks + ' Wo.'], [Math.floor((n - 1) / 2), ''], [n - 1, 'heute']].forEach(function (t) { if (t[1]) svg += '<text x="' + x(t[0]).toFixed(1) + '" y="' + (H - 5) + '" font-size="12" fill="#9fb0d0" text-anchor="' + (t[0] === 0 ? 'start' : 'end') + '">' + t[1] + '</text>'; });
    svg += '<polygon points="' + x(0).toFixed(1) + ',' + (H - B) + ' ' + pts + ' ' + x(n - 1).toFixed(1) + ',' + (H - B) + '" fill="url(#' + id + ')"/><polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + (TK > 1 ? 1.6 : 2) + '" stroke-linejoin="round"/>';
    if (o.buyIn) { var by = y(o.buyIn); svg += '<line x1="' + L + '" y1="' + by.toFixed(1) + '" x2="' + (W_ - Rr) + '" y2="' + by.toFixed(1) + '" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="5 4"/><text x="' + (L + 4) + '" y="' + (by - 4).toFixed(1) + '" font-size="12" fill="#fbbf24">Ihr Einstieg ' + U.fmtPrice(o.buyIn) + '</text>'; }
    (m.marks || []).forEach(function (k) { var i = k.i * TK + TK - 1 - off; if (i < 0 || i >= n) return; var mx_ = x(i), my = y(hist[i]); svg += '<circle cx="' + mx_.toFixed(1) + '" cy="' + my.toFixed(1) + '" r="4.5" fill="#ef4444" stroke="#fff" stroke-width="1.5"/><text x="' + mx_.toFixed(1) + '" y="' + Math.min(H - B - 4, my + 16).toFixed(1) + '" font-size="12" font-weight="700" fill="#fca5a5" text-anchor="middle">' + esc(k.t) + '</text>'; });
    svg += '<circle cx="' + x(n - 1).toFixed(1) + '" cy="' + y(hist[n - 1]).toFixed(1) + '" r="4" fill="' + col + '"/>';
    var step = Math.max(1, Math.round(n / 52)), zw = (W_ - L - Rr) / Math.max(1, n - 1) * step;
    for (var ti = 0; ti < n; ti += step) { var wAgo = Math.round((n - 1 - ti) / TK); svg += '<rect class="tipzone" data-tip="' + (wAgo ? 'vor ' + wAgo + ' Wo.' : 'heute') + ': ' + esc(U.fmtPrice(hist[ti])) + '" x="' + (x(ti) - zw / 2).toFixed(1) + '" y="' + T + '" width="' + zw.toFixed(1) + '" height="' + (H - T - B) + '" fill="transparent"/>'; }
    svg += '</svg>';
    return '<div class="chart-box">' + svg + '</div>';
  };
  U.fmtPrice = function (p) { return p >= 100 ? R.fmtNum(p) + ' €' : p >= 1 ? p.toFixed(2).replace('.', ',') + ' €' : p >= 0.001 ? p.toFixed(4).replace('.', ',') + ' €' : p.toPrecision(2).replace('.', ',') + ' €'; };
  U.financeReport = function (c) {
    function block(fin, title) {
      if (!fin) return '<div class="panel"><h2>' + title + '</h2>' + U.empty('receipt', 'Noch keine Daten.') + '</div>';
      var keys = Object.keys(fin).filter(function (k) { return Math.round(fin[k]) !== 0; });
      var inc = keys.filter(function (k) { return fin[k] > 0; }).sort(function (a, b) { return fin[b] - fin[a]; }), exp = keys.filter(function (k) { return fin[k] < 0; }).sort(function (a, b) { return fin[a] - fin[b]; });
      var ti = R.sum(inc, function (k) { return fin[k]; }), te = R.sum(exp, function (k) { return fin[k]; });
      var mx = Math.max(ti, -te) || 1;
      return '<div class="panel"><div class="panel-h"><h2>' + U.lc('receipt', 17) + ' ' + title + '</h2><b class="' + (ti + te < 0 ? 'neg' : 'pos') + '">Saldo ' + money(ti + te) + '</b></div>' +
        '<div class="fin-split"><div style="flex:' + Math.max(1, ti) + ';background:var(--ok)"></div><div style="flex:' + Math.max(1, -te) + ';background:var(--bad)"></div></div>' +
        '<div class="fc-col-h" style="margin-top:12px"><span>' + U.lc('trending-up', 16) + 'Einnahmen</span><b class="pos">' + money(ti) + '</b></div>' + U.hbars(inc.map(function (k) { return { k: k, v: fin[k] }; }), mx, 'var(--ok)', true) +
        '<div class="fc-col-h" style="margin-top:14px"><span>' + U.lc('trending-down', 16) + 'Ausgaben</span><b class="neg">' + money(te) + '</b></div>' + U.hbars(exp.map(function (k) { return { k: k, v: fin[k] }; }), mx, 'var(--bad)', true) + '</div>';
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
      U.modal(U.lc('lock', 16) + ' Geheimer Buchhaltungskeller', r.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '<p class="pos"><b>+' + money(r.paid) + '</b> wurden Ihrem Vereinskonto gutgeschrieben.</p><p class="muted small">Jeder weitere Klick aufs Schild bringt einen zufälligen Betrag zwischen 100.000 € und 5 Mio. € (je höher, desto seltener).' + (r.first ? ' Dieser Spielstand ist jetzt als „mit Cheat“ markiert. Der Cheat kann in den Einstellungen deaktiviert werden.' : '') + '</p>', '<button class="primary" data-act="closeModal">Danke, Herr Buchungsfehler!</button>');
    } else {
      U.toast((r.jackpot ? '🎰 JACKPOT! ' : r.paid >= 2000000 ? '💰 ' : '') + '+' + money(r.paid) + ' · Kontostand ' + money(U.club().cash));
      var k = document.querySelector('#main [data-cash]'); if (k) k.textContent = money(U.club().cash);
    }
  };
  function amt(id) { var el = document.getElementById(id); return el ? +el.value || 0 : 0; }
  U.acts.loanTake = function () { var r = E.takeLoan(U.st, U.club(), amt('loanAmt')); U.toast(r.ok ? 'Kredit aufgenommen (' + (r.rate * 100).toFixed(1) + ' %)' : r.why); U.render(); };
  U.acts.loanRepay = function () { var r = E.repayLoan(U.st, U.club(), amt('loanAmt')); U.toast(r.ok ? 'Getilgt: ' + money(r.amount) : r.why); U.render(); };
  U.acts.loanRepayAll = function () { var r = E.repayLoan(U.st, U.club(), 1e15); U.toast(r.ok ? 'Getilgt: ' + money(r.amount) : r.why); U.render(); };
  U.acts.savIn = function () { U.toast(E.deposit(U.club(), amt('savAmt')) ? 'Eingezahlt.' : 'Nicht möglich.'); U.render(); };
  U.acts.savOut = function () { U.toast(E.withdraw(U.club(), amt('savAmt')) ? 'Ausgezahlt.' : 'Nicht möglich.'); U.render(); };
  // Ordergröße: Stückzahl oder Eurobetrag (wird in ganze Stück umgerechnet, inkl. 0,5 % Gebühr beim Kauf)
  function orderQty(st, c, k, sell) {
    var v = amt('q_' + k); if (U.p.tradeMode !== 'eur') return v;
    var price = E.price(st, k); if (!price || !v) return 0;
    return Math.floor(v / (price * (sell ? 1 : 1.005)));
  }
  U.acts.tradeMode = function (d) { U.p.tradeMode = d.v; U.render(); };
  U.acts.assetBuy = function (d) {
    var st = U.st, c = U.club(), q = orderQty(st, c, d.k, false);
    if (U.p.tradeMode === 'eur' && amt('q_' + d.k) && !q) { U.toast('Betrag reicht nicht für ein Stück'); return; }
    var r = E.buyAsset(st, c, d.k, q); U.toast(r.ok ? 'Gekauft: ' + R.fmtNum(r.qty || q) + ' Stück für ' + money(r.cost) : r.why); U.render();
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
  U.acts.assetSell = function (d) { var q = orderQty(U.st, U.club(), d.k, true); if (U.p.tradeMode === 'eur' && amt('q_' + d.k) && !q) { U.toast('Betrag reicht nicht für ein Stück'); return; } var r = E.sellAsset(U.st, U.club(), d.k, q || 1e12); U.toast(r.ok ? 'Verkauft: ' + money(r.revenue) + ' (' + (r.profit >= 0 ? '+' : '') + money(r.profit) + ')' : r.why); U.render(); };
})(RFM);
