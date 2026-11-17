// Posteingang der Zentrale: Ereignisse (Ereigniskarten, Rechtsfälle) und Börsenmeldungen als E-Mails,
// wichtige Meldungen deutlich markiert. Dazu die Auswahl im Spielbericht, wenn der Verein in einer Woche
// mehrere Spiele hatte (z. B. Europapokal und Liga). Diese Datei ist in beiden Spielen identisch.
(function (R) {
  var D = R.data, S = R.season, U = R.ui, esc = R.esc;
  if (!U) return;

  function eventOf(st) { var pe = st.pendingEvent; if (!pe) return null; return pe.custom || (pe.chaos ? D.chaosEvents : D.events)[pe.idx] || null; }
  function short(t, n) { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + ' …' : t; }
  function when(m) { return m.season === U.st.season ? (m.week ? m.week + '. Spieltag' : 'Vorbereitung') : 'Saison ' + m.season; }
  // Anzahl ungelesener wichtiger Meldungen (für die Zahl im Menü)
  U.mailCount = function (st) {
    return (st.pendingEvent ? 1 : 0) + (st.inbox || []).filter(function (m) { return m.type === 'mail' && m.important && !m.read; }).length;
  };
  // HTML für den Posteingang: offene Ereigniskarte zuerst, dann wichtige, dann übrige Mails
  U.mailItems = function (st) {
    var h = '', n = 0, ev = eventOf(st);
    if (ev) {
      n++;
      var legal = !!(ev.legal || (st.pendingEvent.custom && st.pendingEvent.custom.legal));
      h += '<div class="msg msg-imp"><div class="ic-tile bad">' + (ev.ic ? '<span style="font-size:20px;line-height:1">' + esc(ev.ic) + '</span>' : U.lc(legal ? 'scale' : 'mail', 20)) + '</div><div class="msg-b"><b><span class="tag imp">Wichtig</span> ' + (legal ? 'Rechtsabteilung: Entscheidung nötig' : 'Ereignis: Entscheidung nötig') + '</b><span>' + esc(short(ev.t, 170)) + (ev.st ? ' <em class="muted">' + esc(ev.st) + '</em>' : '') + '</span></div><button class="primary sm" data-act="mailEvent">Entscheiden</button></div>';
    }
    var mails = (st.inbox || []).filter(function (m) { return m.type === 'mail'; }).sort(function (a, b) { return (b.important ? 1 : 0) - (a.important ? 1 : 0) || (b.tick || 0) - (a.tick || 0); });
    mails.forEach(function (m) {
      if (!m.read) n++;
      var bad = m.tone === 'bad', good = m.tone === 'good';
      h += '<div class="msg' + (m.important ? ' msg-imp' : '') + (m.read ? ' msg-read' : '') + '"><div class="ic-tile ' + (bad ? 'bad' : good ? 'ok' : 'info') + '">' + U.lc(m.icon || 'mail', 20) + '</div><div class="msg-b"><b>' + (m.important ? '<span class="tag imp">Wichtig</span> ' : '') + esc(m.title) + ' <span class="muted small">· ' + esc(when(m)) + '</span></b><span>' + esc(m.text) + '</span></div><div class="row" style="gap:6px">' +
        (m.kind === 'markt' ? '<button class="sm" data-act="mailMarket" data-id="' + m.id + '">' + (U.mailMarketTab(m) === 'krypto' ? 'Zu den Kryptos' : 'Zur Börse') + '</button>' : '') + '<button class="sm ghost" data-act="mailDel" data-id="' + m.id + '" title="Mail löschen">' + U.lc('x', 14) + '</button></div></div>';
    });
    return { n: n, html: h };
  };
  U.acts.mailEvent = function () { U.showEvent(); };
  U.acts.mailDel = function (d) { var st = U.st; st.inbox = st.inbox.filter(function (m) { return m.id !== d.id; }); U.render(); };
  // Sprungziel einer Börsenmail: Krypto-Crash/-Boom (oder Mail zu einer Kryptowährung) → Kryptos, sonst Aktien
  U.mailMarketTab = function (m) {
    if (m && /^c(crash|boom)$/.test(m.mk || '')) return 'krypto';
    if (m && m.sym && (D.cryptos || []).some(function (c) { return c.id === m.sym; })) return 'krypto';
    return 'aktien';
  };
  U.acts.mailMarket = function (d) { var st = U.st, tab = 'aktien'; st.inbox.forEach(function (m) { if (m.id === d.id) { m.read = true; tab = U.mailMarketTab(m); } }); U.go('bank', { tab: tab }); };
  // Erledigte Ereigniskarte als (normale) Mail festhalten
  U.mailEventDone = function (st, ev, opt, msg) {
    if (!ev || !R.econ.addMail) return;
    R.econ.addMail(st, { kind: 'ereignis', icon: ev.legal ? 'scale' : 'check', title: 'Erledigt: ' + short(ev.t, 60), text: 'Ihre Entscheidung: ' + (opt ? opt.l : '–') + (msg ? ' – ' + msg : ''), read: true });
  };

  // ---------- Spielbericht: Auswahl bei mehreren Spielen in einer Woche ----------
  U.reportList = function (st) {
    var l = (st.lastUserMatches || []).filter(Boolean);
    return l.length ? l : (st.lastUserMatch ? [st.lastUserMatch] : []);
  };
  U.reportHead = function (st, list, idx) {
    var lm = list[idx];
    var kicker = lm && lm.label ? '<div class="rp-kicker">' + U.compEmblem(lm.kind || 'league', 26) + '<b>' + esc(lm.label) + '</b></div>' : '';
    var tabs = list.length > 1 ? '<div class="seg" style="margin-bottom:12px">' + list.map(function (m, i) {
      var H = st.clubs[m.h], A = st.clubs[m.a];
      return '<button class="sm ' + (i === idx ? 'on' : '') + '" data-act="reportPick" data-i="' + i + '">' + esc((m.label || '').split(' – ')[0]) + ': ' + esc(H ? H.short : '?') + ' ' + m.sum.hg + ':' + m.sum.ag + ' ' + esc(A ? A.short : '?') + '</button>';
    }).join('') + '</div>' : '';
    return kicker + tabs;
  };
  U.acts.reportPick = function (d) { U.p.m = +d.i; U.render(); };
})(RFM);
