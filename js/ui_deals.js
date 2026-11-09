// ANWURF! – Oberfläche: Großereignisse (Eilmeldung, Entscheidung, Verhandlung, Abrechnung)
(function (R) {
  var D = R.data, E = R.econ, X = R.deals, U = R.ui;
  var esc = R.esc, money = R.fmtMoney;

  function sign(v) { v = Math.round(v * 10) / 10; return (v > 0 ? '+' : '') + String(v).replace('.', ','); }
  function cls(v) { return v > 0 ? 'pos' : v < 0 ? 'neg' : ''; }
  function moodText(v) { return v <= -8 ? 'deutlich negativ' : v <= -3 ? 'eher negativ' : v < 3 ? 'neutral' : v < 8 ? 'eher positiv' : 'sehr positiv'; }

  U.dealSel = function () {
    var o = U.st.deal;
    if (!U._dsel || U._dsel.id !== (o && o.id)) {
      var t = o ? X.type(o.type) : null;
      U._dsel = { id: o && o.id, measures: {}, promise: 'keine', demands: {}, tab: 'entscheidung' };
      if (t) t.fit.slice(0, 2).forEach(function (k) { U._dsel.measures[k] = true; });
    }
    return U._dsel;
  };
  U.selMeasures = function () { var s = U.dealSel(); return Object.keys(s.measures).filter(function (k) { return s.measures[k]; }); };

  U.showDeal = function () {
    var st = U.st, o = st.deal; if (!o) return;
    st.dealPopup = false;
    var c = st.clubs[o.club], t = X.type(o.type), pv = X.preview(st, o), sel = U.dealSel(), can = U.can('business');
    var ms = U.selMeasures(), opts = { measures: ms, promise: sel.promise };
    var evA = X.evaluate(st, o, 'A', opts);
    var impact = !o.days ? 'Kein Einfluss auf den Spielbetrieb.' : o.conflict ? '<span class="neg">⚠️ Terminkonflikt: In den nächsten Wochen ist kein Termin ohne eigenes Heimspiel frei. Eine kürzere Veranstaltung verhandeln oder ablehnen.</span>' : o.mode === 'block' ? 'Rund um den ' + o.eventWeek + '. Spieltag (Heimspiel) – beim Heimspiel sind Teile der Halle gesperrt (−20 % Kapazität).' : 'Termin rund um den ' + o.eventWeek + '. Spieltag (Auswärtsspiel) – kein Heimspiel betroffen. Training auf dem Nebenplatz.';
    var h = '<div class="newspaper" style="margin-bottom:12px"><div class="mast">EILMELDUNG</div><div class="head">' + esc(t.title) + '</div><p>' + esc(t.offer) + '</p><p><b>Geboten werden ' + money(o.amount) + '.</b> Das entspricht ' + Math.round(pv.pct * 100) + ' % Ihres jährlichen Vereinsbudgets (' + money(o.budget) + ').</p><p>' + esc(t.fans) + '</p></div>';
    h += '<div class="grid g2"><table class="t small"><tr><td>Angebotssumme</td><td class="num"><b>' + money(o.amount) + '</b></td></tr><tr><td>Anteil am Jahresbudget</td><td class="num">' + Math.round(pv.pct * 100) + ' %</td></tr><tr><td>Voraussichtliche Zusatzkosten</td><td class="num neg">−' + money(pv.extraCost) + '</td></tr><tr><td>Zusatzerlöse Vereinsstadt</td><td class="num pos">+' + money(pv.cityTotal) + '</td></tr><tr><td><b>Geschätzter Nettogewinn</b></td><td class="num"><b>' + money(pv.net) + '</b></td></tr><tr><td>Benötigte Veranstaltungstage</td><td class="num">' + (o.days || 'keine Hallensperrung') + '</td></tr><tr><td>Frist zur Entscheidung</td><td class="num">bis ' + o.deadline + '. Spieltag</td></tr></table>' +
      '<table class="t small"><tr><td>Spielbetrieb</td><td style="white-space:normal">' + impact + '</td></tr><tr><td>Erwartete Fanreaktion</td><td class="' + cls(evA.fan) + '">' + moodText(evA.fan) + ' (' + sign(evA.fan) + ' bei sofortiger Annahme)</td></tr><tr><td>Öffentliche Wahrnehmung</td><td class="' + cls(evA.pub) + '">' + moodText(evA.pub) + ' (' + sign(evA.pub) + ')</td></tr><tr><td>Risiken</td><td style="white-space:normal">' + esc(t.risks) + (pv.traffic ? ' <span class="warn">Ihre Verkehrsanbindung reicht für ' + R.fmtNum(pv.visitors) + ' Besucher nicht aus.</span>' : '') + '</td></tr><tr><td>Fanvertrauen / Wahrnehmung</td><td>' + Math.round(c.fanTrust) + ' / ' + Math.round(c.publicImage) + '</td></tr></table></div>';
    h += '<details style="margin:10px 0"><summary class="small">Vertragsbedingungen, Chancen und Konflikte</summary><p class="small"><b>Bedingungen:</b> ' + esc(t.terms.replace('{D}', o.days)) + '</p><p class="small"><b>Chancen:</b> ' + esc(t.chances) + '</p><p class="small"><b>Interessenkonflikte:</b> ' + esc(t.conflicts) + '</p><p class="small"><b>Öffentlichkeit:</b> ' + esc(t.pub) + '</p>' + (o.negotiated ? '<p class="small"><b>Nachverhandelt:</b> ' + (Object.keys(o.mods).map(function (k) { return X.demands[k]; }).join(', ') || 'keine Änderungen') + '</p>' : '') + '</details>';
    if (!can) { U.modal('Großangebot', h + '<p class="muted">Die KI-Geschäftsführung entscheidet.</p>', '<button data-act="closeModal">OK</button>', true); return; }
    h += '<div class="seg" style="margin-bottom:10px"><button class="' + (sel.tab === 'entscheidung' ? 'on' : '') + '" data-act="dealTab" data-v="entscheidung">Entscheidung</button><button class="' + (sel.tab === 'verhandeln' ? 'on' : '') + '" data-act="dealTab" data-v="verhandeln"' + (o.negotiated ? ' disabled' : '') + '>Nachverhandeln' + (o.negotiated ? ' (erledigt)' : '') + '</button></div>';
    if (sel.tab === 'verhandeln') {
      h += '<div class="panel"><h3>Ihre Forderungen</h3>' + Object.keys(X.demands).map(function (k) { return '<label class="row small" style="margin:4px 0"><input type="checkbox" data-chg="dealDemand" data-k="' + k + '"' + (sel.demands[k] ? ' checked' : '') + '> ' + esc(X.demands[k]) + (k === 'kuerzer' && o.conflict ? ' <span class="warn">(löst den Terminkonflikt)</span>' : '') + '</label>'; }).join('') +
        '<p class="muted small">Je mehr und je härter die Forderungen, desto größer das Risiko. Scheitert die Verhandlung, kann das Angebot verloren gehen. Nur ein Versuch möglich.</p><button class="primary" data-act="dealNegotiate">Forderungen stellen</button></div>';
    } else {
      h += '<div class="grid g2"><div class="panel"><h3>Fanmaßnahmen <span class="muted small">(für Option C und D)</span></h3>' + Object.keys(X.measures).map(function (k) {
        var m = X.measures[k], fit = t.fit.indexOf(k) >= 0;
        return '<label class="row small" style="margin:3px 0;flex-wrap:nowrap"><input type="checkbox" data-chg="dealMeasure" data-k="' + k + '"' + (sel.measures[k] ? ' checked' : '') + '><span>' + (fit ? '⭐ ' : '') + esc(m.n) + ' <span class="muted">– ' + money(m.pct * o.amount) + ' · ' + esc(m.d) + '</span></span></label>';
      }).join('') + '<p class="muted small">⭐ = passt besonders gut zu diesem Ereignis (stärkere Wirkung).</p></div>' +
        '<div class="panel"><h3>Zusage in der Kommunikation <span class="muted small">(für B und D)</span></h3><select data-chg="dealPromise" style="width:100%">' + Object.keys(X.promises).filter(function (k) { return k !== 'schulden' || E.debt(c) > 0; }).map(function (k) { return '<option value="' + k + '"' + (sel.promise === k ? ' selected' : '') + '>' + esc(X.promises[k].n) + '</option>'; }).join('') + '</select>' +
        '<p class="muted small">Zusagen erhöhen die Glaubwürdigkeit (aktuell ' + Math.round(X.credibility(st, c, sel.promise) * 100) + ' %). Sie werden gespeichert und überprüft: Wer sie innerhalb von 20 Wochen einhält, gewinnt zusätzlich Ansehen – gebrochene Zusagen schaden deutlich.</p></div></div>';
      var rows = [['A', 'Sofort annehmen'], ['B', 'Annehmen + offensiv kommunizieren'], ['C', 'Annehmen + Fans beteiligen'], ['D', 'Das Gesamtpaket'], ['F', 'Ablehnen']];
      h += '<table class="t" style="margin-top:10px"><tr><th>Option</th><th class="num">Zusätzliche Ausgaben</th><th class="num">Vereinserlös (netto)</th><th class="num">Fanvertrauen</th><th class="num">Öffentlichkeit</th><th></th></tr>' + rows.map(function (r) {
        var ev = X.evaluate(st, o, r[0], opts), dis = (r[0] !== 'F' && o.conflict) || ((r[0] === 'C' || r[0] === 'D') && !ms.length);
        var net = r[0] === 'F' ? 0 : pv.net - ev.cost;
        return '<tr><td><b>' + r[0] + '</b> – ' + r[1] + '</td><td class="num">' + money(ev.cost) + '</td><td class="num">' + money(net) + '</td><td class="num ' + cls(ev.fan) + '">' + sign(ev.fan) + '</td><td class="num ' + cls(ev.pub) + '">' + sign(ev.pub) + '</td><td><button class="sm ' + (r[0] === 'D' ? 'primary' : r[0] === 'F' ? 'danger' : '') + '" data-act="dealDecide" data-v="' + r[0] + '"' + (dis ? ' disabled' : '') + '>Wählen</button></td></tr>';
      }).join('') + '</table><p class="muted small">Die Werte sind Prognosen. Kommunikation wirkt nur, wenn sie glaubwürdig ist – eine schlecht aufgenommene Kampagne kann zusätzliche Kritik auslösen. Wiederholte umstrittene Deals verstärken negative Reaktionen.</p>';
    }
    U.modal('Eilmeldung – Großangebot', h, '<button data-act="dealLater">Später entscheiden</button>', true);
  };
  U.acts.dealTab = function (d) { U.dealSel().tab = d.v; U.showDeal(); };
  U.acts.dealMeasure = function (d, el) { U.dealSel().measures[d.k] = el.checked; U.showDeal(); };
  U.acts.dealPromise = function (d, el) { U.dealSel().promise = el.value; U.showDeal(); };
  U.acts.dealDemand = function (d, el) { U.dealSel().demands[d.k] = el.checked; };
  U.acts.dealLater = function () { U.closeModal(); U.render(); };
  U.acts.showDeal = function () { U.showDeal(); };
  U.acts.dealNegotiate = function () {
    var sel = U.dealSel(), dem = Object.keys(sel.demands).filter(function (k) { return sel.demands[k]; });
    var r = X.negotiate(U.st, dem);
    if (!r.ok) { U.toast(r.why); return; }
    sel.tab = 'entscheidung';
    if (r.withdrawn) { U.closeModal(); U.modal('Verhandlung gescheitert', '<p>' + esc(r.text) + '</p>', '<button class="primary" data-act="closeModal">Schade</button>'); U.render(); return; }
    U.toast(r.text, 3500); U.showDeal();
  };
  U.acts.dealDecide = function (d) {
    var st = U.st, o = st.deal, t = X.type(o.type), sel = U.dealSel();
    var r = X.decide(st, d.v, { measures: U.selMeasures(), promise: sel.promise });
    if (!r.ok) { U.toast(r.why, 3500); return; }
    U.closeModal(); U.render();
    var msg = d.v === 'F' ? 'Sie haben abgelehnt. Fanvertrauen ' + sign(r.reaction.fan) + ', Öffentlichkeit ' + sign(r.reaction.pub) + '.' :
      'Zugesagt! Fanvertrauen ' + sign(r.reaction.fan) + ', Öffentlichkeit ' + sign(r.reaction.pub) + '.' + (r.text ? ' ' + r.text : '') + (o.status === 'scheduled' ? ' Die Veranstaltung findet rund um den ' + o.eventWeek + '. Spieltag statt.' : '');
    if (st.dealReport) { U.toast(msg, 4500); U.showDealReport(); return; }
    U.modal(d.v === 'F' ? 'Angebot abgelehnt' : t.head, '<p>' + esc(msg) + '</p>', '<button class="primary" data-act="closeModal">OK</button>');
  };
  U.showDealReport = function () {
    var st = U.st, r = st.dealReport; if (!r) return;
    st.dealReport = null;
    var h = '<div class="newspaper" style="margin-bottom:12px"><div class="mast">ABRECHNUNG</div><div class="head">' + esc(r.headline) + '</div></div><table class="t">' + r.lines.map(function (l) { return '<tr><td>' + esc(l[0]) + '</td><td class="num ' + cls(l[1]) + '">' + (l[1] > 0 ? '+' : '') + money(l[1]) + '</td></tr>'; }).join('') + '<tr><td><b>Nettoergebnis</b></td><td class="num ' + cls(r.net) + '"><b>' + (r.net > 0 ? '+' : '') + money(r.net) + '</b></td></tr></table>' +
      '<h3 style="margin-top:12px">Weitere Auswirkungen</h3><ul class="small"><li>Fanvertrauen: <span class="' + cls(r.fan) + '">' + sign(r.fan) + '</span></li><li>Öffentliche Wahrnehmung: <span class="' + cls(r.pub) + '">' + sign(r.pub) + '</span></li>' + (r.pitch ? '<li>Bodenzustand: <span class="neg">' + r.pitch + '</span> (erholt sich in den nächsten Wochen)</li>' : '') + r.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>';
    U.modal(esc(r.title), h, '<button class="primary" data-act="closeModal">Weiter</button>', true);
  };
  // Nach jedem Spieltag: Ereigniskarte → Abrechnung → neues Großangebot
  U.afterWeekPopups = function () {
    var st = U.st;
    if (st.pendingEvent) { U.showEvent(); return; }
    if (st.dealReport) { U.showDealReport(); return; }
    if (st.deal && st.dealPopup) { U.showDeal(); return; }
    if (st.marketAlerts && st.marketAlerts.length) { U.showMarketAlerts(); return; }
  };
  // Börsenereignisse (Crash, Kurssprünge, Rekordhöhen)
  U.showMarketAlerts = function () {
    var st = U.st, a = st.marketAlerts || []; st.marketAlerts = [];
    if (!a.length) return;
    var bad = a.some(function (x) { return /crash/.test(x.k); });
    U.modal(bad ? '📉 Börsen-Eilmeldung' : '📈 Börsen-Eilmeldung', '<div class="market-alerts">' + a.map(function (x) {
      return '<div class="ma ' + (/crash/.test(x.k) ? 'neg' : 'pos') + '"><span class="ma-ic">' + x.ic + '</span><div><b>' + esc(x.t) + '</b><div class="small">' + esc(x.x) + '</div></div></div>';
    }).join('') + '</div>', '<button data-act="closeModal">OK</button><button class="primary" data-act="maGo">Zur Börse</button>');
  };
  U.acts.maGo = function () { U.closeModal(); U.go('bank', { tab: 'aktien' }); };

  // Übersicht im Vereinsmanagement
  U.dealPanel = function (c) {
    var st = U.st;
    X.ensure(c);
    var h = '<div class="panel" style="margin-top:14px"><h2>Image & Großereignisse</h2><div class="grid g3">' +
      '<div><div class="row between small"><span>Fanvertrauen</span><b>' + Math.round(c.fanTrust) + '/100</b></div>' + U.bar(c.fanTrust, 100, c.fanTrust < 40 ? '#ef4444' : c.fanTrust < 55 ? '#f5b301' : '#22c55e') + '<p class="muted small">Wirkt auf Zuschauer, Fanbindung, Merchandising und die Akzeptanz neuer Projekte.</p></div>' +
      '<div><div class="row between small"><span>Öffentliche Wahrnehmung</span><b>' + Math.round(c.publicImage) + '/100</b></div>' + U.bar(c.publicImage, 100, '#3b82f6') + '<p class="muted small">Wirkt auf Sponsoreninteresse, Reputation, Bauzuschüsse und Sonderangebote.</p></div>' +
      '<div><div class="row between small"><span>Bodenzustand</span><b>' + Math.round(c.pitch) + '/100</b></div>' + U.bar(c.pitch, 100, '#16a34a') + '<p class="muted small">Leidet unter Großveranstaltungen, senkt die Hallenattraktivität.</p></div></div>';
    if (st.deal && st.deal.club === c.id) h += '<div class="help" style="margin-top:10px">📰 Offenes Großangebot: <b>' + esc(X.type(st.deal.type).name) + '</b> über ' + money(st.deal.amount) + ' – Frist bis zum ' + st.deal.deadline + '. Spieltag. <button class="sm primary" data-act="showDeal">Ansehen</button></div>';
    var sch = st.dealsScheduled.filter(function (o) { return o.club === c.id; });
    if (sch.length) h += '<p class="small">Geplant: ' + sch.map(function (o) { return esc(X.type(o.type).name) + ' (rund um den ' + o.eventWeek + '. Spieltag)'; }).join(', ') + '</p>';
    var cms = c.commitments.slice(-6).reverse();
    if (cms.length) h += '<h3 style="margin-top:10px">Zusagen</h3>' + cms.map(function (cm) { return '<div class="small">' + (cm.status === 'open' ? '⏳' : cm.status === 'kept' ? '✅' : '❌') + ' ' + esc(cm.text) + (cm.status === 'open' ? ' <span class="muted">(noch ' + Math.max(0, cm.deadline - X.gw(st)) + ' Wochen)</span>' : '') + '</div>'; }).join('');
    var log = st.dealLog.filter(function (l) { return l.club === c.id; }).slice(0, 10);
    if (log.length) h += '<h3 style="margin-top:10px">Historie</h3><table class="t small">' + log.map(function (l) { return '<tr><td>' + l.season + ' / ' + l.week + '.</td><td>' + esc(X.type(l.type).name) + '</td><td>' + esc({ A: 'sofort angenommen', B: 'mit Kommunikation', C: 'mit Fanvorteilen', D: 'Gesamtpaket', F: 'abgelehnt' }[l.decision] || l.decision) + '</td><td class="num">' + money(l.net) + '</td><td class="num ' + cls(l.fan) + '">Fans ' + sign(l.fan) + '</td><td class="num ' + cls(l.pub) + '">Image ' + sign(l.pub) + '</td></tr>'; }).join('') + '</table>';
    else h += '<p class="muted small" style="margin-top:10px">Noch keine Großangebote. Sie kommen selten und überraschend – größere Stadien, bessere Infrastruktur und ein guter Ruf machen sie wahrscheinlicher.</p>';
    return h + '</div>';
  };
})(RFM);
