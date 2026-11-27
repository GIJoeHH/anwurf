// Nationalmannschaft 2.0 – Ereignisse, Handlungsbögen A–H und mehrstufige Dialoge (gemeinsam für ANPFIFF und ANWURF).
// A Durchbruch · B Konkurrenzkampf · C Kapitänsamt · D Turnierheld · E Fehlschuss & öffentlicher Druck ·
// F Verein gegen Verband · G Familie gegen Turnier · H Abschied und Comeback.
// Bedingungen lesen nur den echten Zustand (st.pc.nt): kein Ereignis behauptet etwas, das nicht passiert ist.
(function (R) {
  var X = R.cx, C = R.pc, L = R.life, NT = R.nt, W = R.world; if (!X || !NT) return;
  var HB = X.HB, clamp = X.clamp, SW = X.SW;
  function tick(st) { return st.tick || 0; }
  function ch(p) { return R.rand() < p; }
  function fn(n) { return String(n && n.name != null ? n.name : n || '').split(' ')[0]; }
  // ---------- Zustandsprüfungen ----------
  function IN(c) { return !!(c.pro && c.nt && c.nt.status === 'squad' && !c.nt.retired); }
  function CAPS(c, a, b) { return !!(c.nt && c.nt.caps >= a && (b == null || c.nt.caps <= b)); }
  function RECENT(c, k, w) { var l = c.nt && c.nt.last; return !!(l && l.kind === k && tick(c.st) - l.t <= (w || 2)); }
  function RES(c) { var r = c.nt && c.nt.lastRes; return r && tick(c.st) - r.t <= 1 && r.kind !== 'youth' ? r : null; }
  function TOUR(c) { var t = c.nt && c.nt.tour; return !!(t && !t.done && t.own && t.squad && t.squad.inSq && t.s === c.st.season && NT.away(c.st) >= 3); }
  function TEND(c, w) { var l = c.nt && c.nt.last; return l && l.kind === 'tourEnd' && tick(c.st) - l.t <= (w || 2) ? l : null; }
  function TK(c) { var t = c.nt && c.nt.tour; return t ? t.s + t.k : 'x'; }
  function coach(c) { return c.nt.coach.name; }
  function PP(c, k) { return c.nt.people[k].name; }
  function ptn(c) { var l = c.st.pc.cx.life; return l && l.partner && l.partner.stage >= 3 ? l.partner : null; }
  function kids(c) { var l = c.st.pc.cx.life; return l ? l.kids || [] : []; }
  function nat(c) { return NT.own(c.st).name; }
  function tname(c) { var t = c.nt.tour; return t ? t.name : 'das Turnier'; }
  function opp(c, r) { var n = NT.nat((r || RES(c) || {}).opp); return n ? n.name : 'den Gegner'; }
  function goalW(n) { return n === 1 ? SW.goal : SW.goals; }
  // ---------- Wirkungen (inkl. Nationalteam-Beziehungen) ----------
  var NL = { nt: 'Vertrauen Nationaltrainer', ntc: 'Draht zum Nationaltrainer', p_capt: 'Kapitän (NT)', p_rival: 'Konkurrent (NT)', p_friend: 'Freund im NT', p_talent: 'Talent (NT)' };
  function E(st, o) {
    var nt = NT.ensure(st), rest = {}, out = [];
    Object.keys(o || {}).forEach(function (k) {
      var v = o[k]; if (!v) return;
      if (k === 'nt') nt.trust = clamp(nt.trust + v, 0, 100);
      else if (k === 'ntc') nt.coach.v = clamp((nt.coach.v || 50) + v, 0, 100);
      else if (k.indexOf('p_') === 0) { var pp = nt.people[k.slice(2)]; if (!pp) return; pp.v = clamp(pp.v + v, 0, 100); }
      else { rest[k] = v; return; }
      out.push(NL[k] + ' ' + (v > 0 ? '+' : '−') + Math.abs(Math.round(v)));
    });
    var r = L && L.eff ? L.eff(st, rest) : X.eff(st, rest); if (r) out.unshift(r);
    return out.join(', ');
  }
  function T(txt, eff) { return txt + (eff ? ' (' + eff + ')' : ''); }
  function later(st, w, id, d) { X.later(st, w, id, d || {}); }
  function chron(st, ic, ti, x, imp, img) { X.chron(st, 'nati', ic, ti, x, imp || 1, img); }
  function ev(id, ic, when, ti, t, o, x) { var e = { id: id, cat: 'nati', ic: ic, when: when, ti: ti, t: t, o: o, cd: 60 }; for (var k in x || {}) e[k] = x[k]; return e; }
  function F(id, ic, ti, t, o, x) { var e = ev(id, ic, null, ti, t, o, x); e.follow = true; return e; }
  function pay(st, amt, cat) { if (R.pf && R.pf.book) R.pf.book(st, amt, cat); else C.pay(st, amt, cat); }

  // =====================================================================================
  // 1) Nominierung und Entwicklung (Bogen A: Durchbruch) – 22
  // =====================================================================================
  X.add('nati', [
    ev('n_scout_tribune', '🔭', function (c) { return c.pro && c.nt && !c.nt.ms.call && RECENT(c, 'watch', 3); }, 'Besuch auf der Tribüne', function (c) { return 'Nationaltrainer ' + coach(c) + ' sitzt beim Spiel auf der Tribüne. Kameras zeigen ihn, wie er sich Notizen macht – angeblich über dich.'; },
      [{ l: 'Konzentriert bleiben', fx: function (st) { return E(st, { conf: 2, nt: 2 }); } }, { l: 'Jetzt erst recht glänzen wollen', fx: function (st) { return ch(0.5) ? T('Du spielst stark, er nickt beim Rausgehen.', E(st, { nt: 4, conf: 3 })) : T('Du verkrampfst sichtbar.', E(st, { nt: -1, stress: 3 })); } }], { cd: 40, prio: 1 }),
    ev('n_extended', '📋', function (c) { return c.pro && c.nt && !IN(c) && RECENT(c, 'watch', 3); }, 'Erweiterter Kader', function (c) { return 'Du stehst auf der erweiterten Liste von ' + coach(c) + ', aber nicht im endgültigen Aufgebot. Die Zeitung schreibt: „Er klopft an.“'; },
      [{ l: 'Geduldig weiterarbeiten', fx: function (st) { return E(st, { disc: 2, nt: 2 }); } }, { l: 'Öffentlich Ansprüche anmelden', fx: function (st) { return ch(0.35) ? T('Der Druck wirkt – man spricht über dich.', E(st, { fame: 2, nt: 1 })) : T('Im Verband kommt das nicht gut an.', E(st, { nt: -3, media: 1 })); } }], { cd: 50, prio: 1 }),
    ev('n_expert_debate', '📺', function (c) { return c.pro && c.nt && c.nt.caps < 3 && !IN(c) && c.form >= 7 && c.st.phase === 'season'; }, 'Talkshow-Debatte', function (c) { return 'In einer Fußball-Talkshow wird diskutiert, ob ' + c.name + ' nicht längst ins Nationalteam gehört. Ein Experte: „Die Form spricht für ihn.“'.replace('Fußball', HB ? 'Handball' : 'Fußball'); },
      [{ l: 'Freuen, aber still bleiben', fx: function (st) { return E(st, { conf: 3 }); } }, { l: 'Selbst im Fernsehen auftreten', fx: function (st) { return E(st, { fame: 2, media: 3, stress: 2 }); } }], { cd: 80 }),
    ev('n_watch_form_dip', '📉', function (c) { return c.pro && c.nt && c.nt.status === 'dropped' && RECENT(c, 'dropped', 3); }, 'Aus dem Kader gestrichen', function (c) { return coach(c) + ' verzichtet diesmal auf dich. Die offizielle Begründung: „Formschwankungen. Die Tür bleibt offen.“'; },
      [{ l: 'Anrufen und nachfragen', fx: function (st) { return ch(0.6) ? T('Er erklärt dir offen, was er sehen will.', E(st, { ntc: 4, nt: 2 })) : T('Er bleibt kurz angebunden.', E(st, { ntc: -1 })); } }, { l: 'Antwort auf dem Platz geben', fx: function (st) { return E(st, { disc: 3, conf: -1 }); } }, { l: 'Enttäuschung öffentlich machen', fx: function (st) { return E(st, { media: 2, nt: -4, ntc: -4, fame: 1 }); } }], { cd: 30, prio: 2 }),
    ev('n_recall', '🔁', function (c) { return IN(c) && RECENT(c, 'recall', 3); }, 'Zurück im Kader', function (c) { return 'Nach der Pause nominiert dich ' + coach(c) + ' wieder. „Er hat im Verein die richtige Antwort gegeben.“'; },
      [{ l: 'Dankbar und demütig', fx: function (st) { return E(st, { nt: 3, ntc: 2 }); } }, { l: '„Ich war nie weg.“', fx: function (st) { return E(st, { conf: 3, media: 1, ntc: -1 }); } }], { cd: 30, prio: 2 }),
    ev('n_role_up', '📈', function (c) { return IN(c) && ['Stammspieler', 'Leistungsträger'].indexOf(c.nt.role) >= 0 && CAPS(c, 4) && !X.mem(c.st, 'ntRoleUp' + c.nt.role); }, 'Neue Rolle im Nationalteam', function (c) { return coach(c) + ' sagt dir im Einzelgespräch, dass du ab jetzt als ' + c.nt.role + ' eingeplant bist.'; },
      [{ l: 'Verantwortung annehmen', fx: function (st, c) { X.mem(st, 'ntRoleUp' + c.nt.role, 1); chron(st, '📈', 'Neue Rolle: ' + c.nt.role, 'Im Nationalteam fest eingeplant.', 2); return E(st, { conf: 4, lead: 2 }); } }, { l: 'Bescheiden bleiben', fx: function (st, c) { X.mem(st, 'ntRoleUp' + c.nt.role, 1); return E(st, { team: 3, p_capt: 3 }); } }], { cd: 40, prio: 1 }),
    ev('n_perspective', '🌱', function (c) { return IN(c) && c.nt.role === 'Perspektivspieler'; }, 'Perspektivspieler', function (c) { return 'Du bist der jüngste im Kader. ' + coach(c) + ': „Du sollst lernen, zuschauen, Fragen stellen. Deine Zeit kommt.“'; },
      [{ l: 'Den Routiniers zuhören', fx: function (st) { return E(st, { p_capt: 4, team: 2 }); } }, { l: 'Im Training auffallen', fx: function (st) { return ch(0.5) ? T('Der Co-Trainer lobt deine Intensität.', E(st, { nt: 4 })) : T('Ein harter Zweikampf mit einem Stammspieler sorgt für dicke Luft.', E(st, { p_capt: -3, nt: 1 })); } }], { cd: 50 }),
    ev('n_youth_call', '🎽', function (c) { return c.nt && c.nt.ms.youth && !X.mem(c.st, 'ntYouthEv') && c.age <= 21; }, 'Junioren-Nationalteam', function (c) { return 'Dein erstes Spiel für eine Jugend-Nationalmannschaft liegt hinter dir. Der Trainer der Junioren schreibt: „So kann es weitergehen.“'; },
      [{ l: 'Ziel: A-Nationalteam', fx: function (st) { X.mem(st, 'ntYouthEv', 1); return E(st, { amb: 3, conf: 3 }); } }, { l: 'Schritt für Schritt', fx: function (st) { X.mem(st, 'ntYouthEv', 1); return E(st, { disc: 3 }); } }], { prio: 1 }),
    ev('n_youth_captain', '©️', function (c) { return c.nt && c.age <= 21 && Object.keys(c.nt.youth).some(function (k) { return c.nt.youth[k].caps >= 6; }) && !X.mem(c.st, 'ntYCapt'); }, 'Kapitän der Junioren', function () { return 'Der Juniorentrainer möchte dir die Kapitänsbinde geben. Eine Ehre – und viel Verantwortung neben Schule bzw. Verein.'; },
      [{ l: 'Annehmen', fx: function (st) { X.mem(st, 'ntYCapt', 1); chron(st, '©️', 'Kapitän der Junioren', 'Kapitänsbinde in der Jugend-Nationalmannschaft.', 2); return E(st, { lead: 6, stress: 2 }); } }, { l: 'Lieber auf das eigene Spiel konzentrieren', fx: function (st) { X.mem(st, 'ntYCapt', 1); return E(st, { conf: 1 }); } }]),
    ev('n_youth_dropped', '🎒', function (c) { return c.youth && c.nt && Object.keys(c.nt.youth).length && !RES(c) && c.form < 5.4; }, 'Nicht im Junioren-Kader', function () { return 'Für den nächsten Lehrgang der Junioren stehst du nicht auf der Liste. Deine Eltern sind enttäuschter als du.'; },
      [{ l: 'Mit den Eltern reden', fx: function (st) { return E(st, { family: 3, stress: -2 }); } }, { l: 'Extra-Schichten im Training', fx: function (st) { return E(st, { disc: 3, fit: -2 }); } }], { cd: 120 }),
    ev('n_dual_nation', '🌍', function (c) { return c.pro && c.nt && c.nt.caps === 0 && c.age <= 23 && c.p.ovr >= 60 && !X.mem(c.st, 'ntDual') && ch(0.3); }, 'Anfrage eines anderen Verbands', function () { return 'Ein anderer Verband hat erfahren, dass deine Großmutter von dort stammt, und möchte dich einladen. Wer einmal ein Pflichtspiel bestreitet, ist festgelegt.'; },
      [{ l: 'Höflich absagen – ich warte auf mein Land', fx: function (st) { X.mem(st, 'ntDual', 1); return E(st, { amb: 2, fam: 2 }); } }, { l: 'Bedenkzeit erbitten', fx: function (st) { X.mem(st, 'ntDual', 1); return T('Die Meldung sickert durch – plötzlich interessiert sich auch dein Verband stärker für dich.', E(st, { nt: 4, media: 1 })); } }], { w: 0.4, once: true }),
    ev('n_position_test', '🧪', function (c) { return IN(c) && c.nt.caps >= 2 && c.nt.coach.style === 'system'; }, 'Neue Position im System', function (c) { return coach(c) + ' will dich im Länderspiel auf einer ungewohnten Position testen – sein System braucht dort einen Spieler mit deinen Stärken.'; },
      [{ l: 'Offen dafür sein', fx: function (st) { return ch(0.55) ? T('Es klappt erstaunlich gut.', E(st, { nt: 5, conf: 2 })) : T('Du wirkst verloren, aber er rechnet dir die Bereitschaft an.', E(st, { nt: 1, conf: -2 })); } }, { l: 'Lieber auf meiner Position', fx: function (st) { return E(st, { nt: -2, conf: 1 }); } }], { cd: 120 }),
    ev('n_stats_meeting', '📊', function (c) { return IN(c) && CAPS(c, 3); }, 'Video-Analyse beim Verband', function (c) { return 'Die Analysten des Verbands zeigen dir 40 Szenen aus deinen letzten Länderspielen. Einige sind schmeichelhaft, andere nicht.'; },
      [{ l: 'Kritik annehmen', fx: function (st) { return E(st, { disc: 3, nt: 2 }); } }, { l: 'Verteidigen, was ich gemacht habe', fx: function (st) { return E(st, { conf: 2, ntc: -1 }); } }], { cd: 100 }),
    ev('n_breakthrough_game', '🌟', function (c) { var r = RES(c); return IN(c) && r && r.played && r.rating >= (HB ? 8.3 : 7.8); }, 'Glanzauftritt im Nationaltrikot', function (c) { var r = RES(c) || { rating: 7.8 }; return 'Gegen ' + opp(c) + ' warst du einer der Besten auf dem Platz (Note ' + (r.rating || 7.8).toFixed(1) + '). Die Zeitung titelt: „Ein neuer Fixpunkt?“'.replace('Platz', SW.venue === 'Halle' ? 'Feld' : 'Platz'); },
      [{ l: 'Genießen', fx: function (st) { return E(st, { conf: 4, fame: 2, nt: 2 }); } }, { l: 'Gleich wieder auf den Verein konzentrieren', fx: function (st) { return E(st, { coach: 3, disc: 2 }); } }], { cd: 20, prio: 1 }),
    ev('n_bad_game', '😓', function (c) { var r = RES(c); return IN(c) && r && r.played && r.rating < (HB ? 6.4 : 5.8); }, 'Schwaches Länderspiel', function (c) { return 'Gegen ' + opp(c) + ' lief wenig zusammen. ' + coach(c) + ' nimmt dich nach dem Spiel kurz beiseite.'; },
      [{ l: 'Fehler offen ansprechen', fx: function (st) { return E(st, { ntc: 3, conf: -1 }); } }, { l: 'Kopf hoch, nächstes Spiel', fx: function (st) { return E(st, { conf: 1, nt: -1 }); } }], { cd: 20, prio: 1 }),
    ev('n_first_goal_fx', '⚽', function (c) { return c.nt && c.nt.ms.goal && tick(c.st) - c.nt.ms.goal.t <= 1; }, 'Das erste Länderspieltor', function (c) { return 'Dein erstes ' + SW.goal + ' für ' + nat(c) + '! Dein Handy hat 200 neue Nachrichten. Der Zeugwart legt dir den Spielball in den Spind.'; },
      [{ l: 'Ball den Eltern schenken', fx: function (st) { return E(st, { fam: 5, family: 4 }); } }, { l: 'Ball signieren lassen und behalten', fx: function (st) { return E(st, { conf: 3, p_capt: 2 }); } }], { prio: 3, once: true }),
    ev('n_caps_jubilee', '🎖️', function (c) { return c.nt && [10, 25, 50, 75, 100].indexOf(c.nt.caps) >= 0 && RES(c) && RES(c).played; }, 'Länderspiel-Jubiläum', function (c) { return c.nt.caps + '. Länderspiel! Der Verband überreicht dir vor dem Anpfiff ein Ehrentrikot.'; },
      [{ l: 'Der Familie widmen', fx: function (st) { return E(st, { fam: 4, f_fam: 2 }); } }, { l: 'Den Fans danken', fx: function (st) { return E(st, { fans: 3, f_club: 2 }); } }], { cd: 10, prio: 2 }),
    ev('n_development_plan', '🧭', function (c) { return IN(c) && c.age <= 24 && c.nt.caps <= 10; }, 'Entwicklungsplan', function (c) { return 'Der Verband bietet dir einen individuellen Entwicklungsplan an – Athletik, Videoanalyse, Mentalcoach. Dein Vereinstrainer hat eigene Pläne.'; },
      [{ l: 'Verbandsplan annehmen', fx: function (st) { var p = C.player(st); p.attr.sta = Math.min(99, p.attr.sta + 1); W.recalc(p); return E(st, { nt: 3, coach: -2 }); } }, { l: 'Beim Vereinsplan bleiben', fx: function (st) { return E(st, { coach: 3, nt: -1 }); } }], { cd: 150 }),
    ev('n_mentor_veteran', '🧓', function (c) { return IN(c) && c.age <= 23 && c.nt.caps >= 1; }, 'Ein Routinier nimmt dich unter die Fittiche', function (c) { return PP(c, 'capt') + ' setzt sich beim Essen neben dich. „Wenn du was brauchst – frag. Ich war auch mal der Neue.“'; },
      [{ l: 'Dankend annehmen', fx: function (st) { return E(st, { p_capt: 6, conf: 2 }); } }, { l: 'Lieber eigenständig bleiben', fx: function (st) { return E(st, { conf: 1, p_capt: -1 }); } }], { cd: 200 }),
    ev('n_minutes_matter', '⏱️', function (c) { return IN(c) && c.share != null && c.share < 0.45 && c.st.phase === 'season' && c.st.week > 8; }, 'Kaum Spielzeit im Verein', function (c) { return coach(c) + ' lässt ausrichten: „Wer im Verein nicht spielt, wird es bei mir schwer haben.“'; },
      [{ l: 'Mit dem Vereinstrainer sprechen', fx: function (st) { return ch(0.45) ? T('Er verspricht dir mehr Einsätze.', E(st, { coach: 2, conf: 2 })) : T('Er bleibt bei seiner Rangordnung.', E(st, { coach: -1, stress: 2 })); } }, { l: 'Wechsel prüfen', fx: function (st) { if (R.ag) X.fire(st, 'ag_interest', {}, true); return E(st, { coach: -3 }); } }], { cd: 60 }),
    ev('n_league_matters', '🏟️', function (c) { return c.pro && c.nt && c.lg >= 2 && c.p.ovr >= (NT.threshold(c.st, c.p.pos, 'A').cut || 99) - 2 && !IN(c); }, 'Die falsche Liga?', function (c) { return 'Ein Journalist fragt dich, ob du in der ' + (c.lg === 2 ? 'zweiten' : 'dritten') + ' Liga überhaupt eine Chance auf das Nationalteam hast.'; },
      [{ l: '„Leistung setzt sich durch.“', fx: function (st) { return E(st, { conf: 2, media: 1 }); } }, { l: '„Vielleicht muss ich wechseln.“', fx: function (st) { return E(st, { board: -4, fans: -2, amb: 2 }); } }], { cd: 120 }),
    ev('n_injury_cancel', '🩼', function (c) { return c.pro && c.nt && RECENT(c, 'injOut', 2); }, 'Absage verletzungsbedingt', function (c) { return 'Wegen deiner Verletzung musst du beim Nationalteam absagen. ' + coach(c) + ' schreibt: „Werd gesund, wir planen mit dir.“'; },
      [{ l: 'Mit voller Kraft in die Reha', fx: function (st) { return E(st, { disc: 2, nt: 1 }); } }, { l: 'Frust schieben', fx: function (st) { return E(st, { stress: 3, well: -2 }); } }], { cd: 30, prio: 1 })
  ]);

  // =====================================================================================
  // 2) Nationaltrainer und Mitspieler (Bögen B Konkurrenz, C Kapitän) – 22
  // =====================================================================================
  X.add('nati', [
    ev('n_rival_intro', '⚔️', function (c) { return IN(c) && c.nt.caps >= 1 && !X.mem(c.st, 'ntRival'); }, 'Der Konkurrent', function (c) { return PP(c, 'rival') + ' spielt auf deiner Position und hat den Stammplatz. Beim ersten Training gibt er dir nur knapp die Hand.'; },
      [{ l: 'Respektvoll bleiben', fx: function (st) { X.mem(st, 'ntRival', 1); later(st, R.randInt(8, 16), 'n_rival_duel'); return E(st, { p_rival: 4, team: 2 }); } }, { l: 'Kampfansage', fx: function (st) { X.mem(st, 'ntRival', 1); later(st, R.randInt(6, 12), 'n_rival_duel'); return E(st, { p_rival: -6, conf: 3 }); } }], { prio: 1 }),
    F('n_rival_duel', '🥊', 'Duell um den Stammplatz', function (c) { return 'Im Abschlusstraining vor dem Länderspiel sollen du und ' + PP(c, 'rival') + ' im direkten Vergleich zeigen, wer beginnt.'; },
      [{ l: 'Alles reinwerfen', fx: function (st, c) { var win = ch(clamp(0.45 + (c.p.ovr - NT.threshold(st, c.p.pos, 'A').start) / 20, 0.15, 0.8)); if (win) { later(st, R.randInt(10, 20), 'n_rival_resolve', { won: 1 }); return T('Du überzeugst – ' + PP(c, 'rival') + ' schaut finster.', E(st, { nt: 5, p_rival: -3 })); } later(st, R.randInt(10, 20), 'n_rival_resolve', { won: 0 }); return T('Heute war er besser.', E(st, { nt: 1, conf: -2 })); } },
        { l: 'Fair spielen, ihm Tipps geben', fx: function (st) { later(st, R.randInt(10, 20), 'n_rival_resolve', { won: 0, fair: 1 }); return E(st, { p_rival: 6, team: 3 }); } }]),
    F('n_rival_resolve', '🤝', 'Konkurrenz entschieden?', function (c, d) { return d.fair ? PP(c, 'rival') + ' kommt nach dem Training zu dir: „Du bist ein guter Typ. Lass uns das sportlich austragen.“' : d.won ? 'In der Presse heißt es, du hättest ' + PP(c, 'rival') + ' den Rang abgelaufen. Er äußert sich gereizt.' : PP(c, 'rival') + ' bleibt vorerst vorne. Du musst weiter Geduld haben.'; },
      [{ l: 'Beziehung klären', fx: function (st) { return E(st, { p_rival: 6, team: 2 }); } }, { l: 'Weiter Druck machen', fx: function (st) { return E(st, { conf: 2, nt: 2, p_rival: -2 }); } }]),
    ev('n_friend_roommate', '🛏️', function (c) { return IN(c) && c.nt.caps >= 1; }, 'Zimmerpartner', function (c) { return 'Im Teamhotel teilst du dir das Zimmer mit ' + PP(c, 'friend') + '. Ihr redet bis tief in die Nacht über Familie, Vereine und die Zukunft.'; },
      [{ l: 'Freundschaft pflegen', fx: function (st) { return E(st, { p_friend: 6, well: 2, fit: -1 }); } }, { l: 'Früh schlafen', fx: function (st) { return E(st, { fit: 2, p_friend: 1 }); } }], { cd: 120 }),
    ev('n_talent_cocky', '😎', function (c) { return IN(c) && c.nt.caps >= 8 && c.age >= 25; }, 'Das freche Talent', function (c) { return PP(c, 'talent') + ', gerade 20, kommt zu spät zur Besprechung und lacht darüber. Einige Spieler schauen dich an.'; },
      [{ l: 'Ihn zur Seite nehmen', fx: function (st) { return E(st, { lead: 4, p_talent: 3 }); } }, { l: 'Das ist Sache des Trainers', fx: function (st) { return E(st, { p_talent: 1 }); } }, { l: 'Vor allen zurechtweisen', fx: function (st) { return E(st, { lead: 2, p_talent: -6, p_capt: 2 }); } }], { cd: 150 }),
    ev('n_captain_offer', '©️', function (c) { return IN(c) && !c.nt.captain && c.nt.caps >= 30 && c.age >= 26 && ['Stammspieler', 'Leistungsträger', 'Führungsspieler'].indexOf(c.nt.role) >= 0 && c.cx.per.lead >= 45; }, 'Die Kapitänsbinde', function (c) { return PP(c, 'capt') + ' hört nach dem Turnier auf. ' + coach(c) + ' bittet dich ins Büro: „Ich möchte, dass du unser neuer Kapitän wirst.“'; },
      [{ l: 'Mit Stolz annehmen', fx: function (st, c) { c.nt.captain = true; c.nt.role = 'Kapitän'; C.milestone(st, 'ntCapt', 'Kapitän der Nationalmannschaft!', ''); chron(st, '©️', 'Kapitän der Nationalmannschaft', 'Ernannt von ' + coach(c) + '.', 3, 'nt_anthem'); return E(st, { lead: 8, fame: 4, stress: 3 }); } },
        { l: 'Ablehnen – ich führe lieber ohne Binde', fx: function (st) { return E(st, { team: 3, ntc: -2 }); } }], { once: true, prio: 2 }),
    ev('n_captain_speech', '📣', function (c) { return IN(c) && c.nt.captain && (TOUR(c) || RES(c)); }, 'Kabinenansprache', function () { return 'Als Kapitän sollst du vor dem Spiel ein paar Worte an die Mannschaft richten.'; },
      [{ l: 'Emotional, mit Familie und Herkunft', fx: function (st) { return E(st, { team: 4, lead: 2 }); } }, { l: 'Kurz und taktisch', fx: function (st) { return E(st, { disc: 2, ntc: 2 }); } }, { l: 'Einem Jungen das Wort geben', fx: function (st) { return E(st, { p_talent: 5, team: 2 }); } }], { cd: 40 }),
    ev('n_coach_talk', '🗣️', function (c) { return IN(c) && c.nt.benchRun >= 2; }, 'Unter vier Augen', function (c) { return 'Du saßt zuletzt nur auf der Bank. ' + coach(c) + ' bittet dich zu einem Spaziergang am Teamhotel.'; },
      [{ l: 'Ehrlich sagen, dass ich spielen will', fx: function (st) { return ch(0.55) ? T('Er verspricht dir das nächste Spiel von Beginn an.', E(st, { nt: 6, ntc: 3 })) : T('Er bleibt bei seiner Linie.', E(st, { ntc: -2, stress: 2 })); } }, { l: 'Rolle akzeptieren', fx: function (st) { return E(st, { team: 3, ntc: 3 }); } }], { cd: 40, prio: 1 }),
    ev('n_coach_style', '🎯', function (c) { return c.pro && c.nt && c.nt.coachChange && tick(c.st) - c.nt.coachChange.t <= 3; }, 'Neuer Nationaltrainer', function (c) { return c.nt.coachChange.old + ' ist weg, ' + coach(c) + ' übernimmt. Er ' + NT.STYLES[c.nt.coach.style] + '. Alles beginnt von vorn.'; },
      [{ l: 'Ihn anrufen und vorstellen', fx: function (st) { return E(st, { ntc: 6, nt: 2 }); } }, { l: 'Abwarten', fx: function (st) { return E(st, { disc: 1 }); } }], { prio: 2, cd: 20 }),
    ev('n_coach_criticism', '🧊', function (c) { return IN(c) && c.nt.critic >= 2; }, 'Öffentliche Kritik vom Trainer', function (c) { return coach(c) + ' sagt auf der Pressekonferenz: „Von ihm erwarte ich mehr.“ Dein Name fällt ausdrücklich.'; },
      [{ l: 'Persönlich klären', fx: function (st) { return E(st, { ntc: 3, stress: 1 }); } }, { l: 'Zurückschießen', fx: function (st) { return E(st, { ntc: -8, nt: -5, media: 2, fans: 1 }); } }, { l: 'Schweigen und arbeiten', fx: function (st) { return E(st, { disc: 3 }); } }], { cd: 60 }),
    ev('n_coach_praise', '👏', function (c) { return IN(c) && c.nt.streak >= 2; }, 'Lob vom Nationaltrainer', function (c) { return coach(c) + ' in der Pressekonferenz: „Er ist im Moment unverzichtbar.“'; },
      [{ l: 'Bodenständig bleiben', fx: function (st) { return E(st, { team: 2, nt: 2 }); } }, { l: 'Selbstbewusst bestätigen', fx: function (st) { return E(st, { conf: 4, fame: 1 }); } }], { cd: 50 }),
    ev('n_coach_tactics', '🗂️', function (c) { return IN(c) && c.nt.caps >= 10 && (c.nt.coach.v || 50) >= 60; }, 'Mitsprache bei der Taktik', function (c) { return coach(c) + ' fragt dich nach deiner Meinung zur Spielidee gegen den nächsten Gegner.'; },
      [{ l: 'Offen meine Ideen nennen', fx: function (st) { return E(st, { ntc: 3, lead: 3 }); } }, { l: '„Sie sind der Trainer.“', fx: function (st) { return E(st, { ntc: 1 }); } }], { cd: 120 }),
    ev('n_team_clique', '👥', function (c) { return IN(c) && c.nt.caps >= 5; }, 'Grüppchen im Team', function () { return 'Im Teamhotel sitzen die Spieler der großen Vereine immer an einem Tisch, der Rest an einem anderen. Die Stimmung leidet.'; },
      [{ l: 'Tische mischen vorschlagen', fx: function (st) { return E(st, { team: 4, lead: 3 }); } }, { l: 'Mich raushalten', fx: function (st) { return E(st, { team: -1 }); } }], { cd: 150 }),
    ev('n_team_prank', '😂', function (c) { return IN(c) && c.nt.caps >= 2; }, 'Streich im Teamhotel', function (c) { return PP(c, 'friend') + ' hat dir Rasierschaum in die Schuhe gefüllt. Das ganze Team wartet auf deine Reaktion.'; },
      [{ l: 'Mitlachen und Rache planen', fx: function (st) { return E(st, { p_friend: 4, team: 3 }); } }, { l: 'Genervt reagieren', fx: function (st) { return E(st, { p_friend: -3, team: -2 }); } }], { cd: 200 }),
    ev('n_initiation', '🎤', function (c) { return IN(c) && c.nt.caps <= 2 && c.nt.caps >= 1 && !X.mem(c.st, 'ntSong'); }, 'Das Neulingslied', function () { return 'Tradition: Jeder Neue muss beim Abendessen auf einem Stuhl ein Lied singen.'; },
      [{ l: 'Voller Einsatz, schief und laut', fx: function (st) { X.mem(st, 'ntSong', 1); return E(st, { team: 5, p_capt: 3 }); } }, { l: 'Schnell und leise durch', fx: function (st) { X.mem(st, 'ntSong', 1); return E(st, { team: 1 }); } }], { prio: 1 }),
    ev('n_veteran_farewell', '🎗️', function (c) { return IN(c) && TEND(c, 3) && c.nt.caps >= 5; }, 'Abschied eines Routiniers', function (c) { return PP(c, 'capt') + ' verkündet nach dem Turnier seinen Rücktritt aus dem Nationalteam. In der Kabine wird es still.'; },
      [{ l: 'Eine Rede halten', fx: function (st) { return E(st, { lead: 4, team: 3, p_capt: 4 }); } }, { l: 'Persönlich danken', fx: function (st) { return E(st, { p_capt: 6 }); } }], { cd: 400 }),
    ev('n_mate_injured', '🚑', function (c) { return IN(c) && TOUR(c); }, 'Mitspieler fällt aus', function (c) { return PP(c, 'friend') + ' hat sich im Training verletzt und muss das Turnier verlassen. Er packt weinend seine Tasche.'; },
      [{ l: 'Ihn zum Flughafen begleiten', fx: function (st) { return E(st, { p_friend: 8, fit: -1 }); } }, { l: 'Trikot mit seiner Nummer zum Spiel', fx: function (st) { return E(st, { team: 4, fans: 2 }); } }], { cd: 300 }),
    ev('n_mate_conflict', '💥', function (c) { var r = RES(c); return IN(c) && r && r.lost; }, 'Streit nach der Niederlage', function (c) { return 'Nach dem ' + (RES(c).res.join(':')) + ' gegen ' + opp(c) + ' wirft ' + PP(c, 'rival') + ' dir in der Kabine einen Fehler vor.'; },
      [{ l: 'Sachlich bleiben', fx: function (st) { return E(st, { team: 2, p_rival: 2 }); } }, { l: 'Laut zurückgeben', fx: function (st) { return E(st, { p_rival: -6, team: -3, conf: 1 }); } }, { l: 'Kapitän einschalten', fx: function (st) { return E(st, { p_capt: 2, team: 1 }); } }], { cd: 60 }),
    ev('n_mate_club_rival', '🔥', function (c) { return IN(c) && c.nt.caps >= 3; }, 'Rivale aus der Liga', function () { return 'Im Nationalteam spielst du mit einem Spieler zusammen, mit dem du dir in der Liga regelmäßig harte Duelle lieferst. Die Medien warten auf Zoff.'; },
      [{ l: 'Demonstrativ zusammen frühstücken', fx: function (st) { return E(st, { team: 3, media: 2 }); } }, { l: 'Professionell Abstand halten', fx: function (st) { return E(st, { team: 0.5 }); } }], { cd: 250 }),
    ev('n_coach_loyalty', '🫱', function (c) { return IN(c) && (c.nt.coach.v || 50) >= 70 && c.nt.critic >= 1; }, 'Der Trainer hält zu dir', function (c) { return 'Trotz der Kritik in den Medien stellt sich ' + coach(c) + ' öffentlich hinter dich.'; },
      [{ l: 'Danken – das zahle ich zurück', fx: function (st) { var nt = NT.ensure(st); nt.critic = Math.max(0, nt.critic - 1); return E(st, { ntc: 4, conf: 3 }); } }], { cd: 120 }),
    ev('n_coach_sacked_talk', '📰', function (c) { return IN(c) && c.nt.critic >= 3 && !c.nt.coachChange; }, 'Trainer unter Druck', function (c) { return 'Nach schwachen Ergebnissen wackelt ' + coach(c) + '. Ein Funktionär fragt dich vertraulich nach der Stimmung im Team.'; },
      [{ l: 'Hinter dem Trainer stehen', fx: function (st) { return E(st, { ntc: 6 }); } }, { l: 'Ehrlich Probleme benennen', fx: function (st) { if (ch(0.4)) NT.changeCoach(st, 'nach anhaltender Kritik'); return E(st, { lead: 2, ntc: -4 }); } }], { cd: 200 }),
    ev('n_team_bonding', '🚣', function (c) { return TOUR(c); }, 'Teambuilding im Turnierquartier', function () { return 'Der freie Nachmittag: Raften, Grillen oder einfach Ruhe auf dem Zimmer?'; },
      [{ l: 'Raften mit allen', fx: function (st) { return E(st, { team: 4, fit: -2 }); } }, { l: 'Grillen und Karten spielen', fx: function (st) { return E(st, { team: 3, well: 2 }); } }, { l: 'Ruhe und Telefonat nach Hause', fx: function (st) { return E(st, { fit: 2, fam: 3 }); } }], { cd: 15 })
  ]);

  // =====================================================================================
  // 3) Wettbewerbe und Turniere (Bogen D Turnierheld) – 27
  // =====================================================================================
  X.add('nati', [
    ev('n_tour_squad', '📜', function (c) { var t = c.nt && c.nt.tour; return t && t.own && t.squad && tick(c.st) - (c.nt.lastCall || {}).t <= 1 && NT.away(c.st) >= 3 && !X.mem(c.st, 'tsq' + t.s + t.k); }, 'Im Turnierkader!', function (c) { return 'Dein Name steht im Aufgebot für die ' + tname(c) + '. Du sitzt mit dem Handy auf dem Sofa und liest die Liste dreimal.'; },
      [{ l: 'Familie anrufen', fx: function (st, c) { X.mem(st, 'tsq' + TK(c), 1); chron(st, '📜', 'Im Kader für die ' + tname(c), 'Rolle: ' + c.nt.role + '.', 3, 'nt_call'); return E(st, { fam: 5, well: 4 }); } }, { l: 'Still genießen', fx: function (st, c) { X.mem(st, 'tsq' + TK(c), 1); chron(st, '📜', 'Im Kader für die ' + tname(c), 'Rolle: ' + c.nt.role + '.', 3, 'nt_call'); return E(st, { conf: 4 }); } }], { prio: 3, cd: 5 }),
    ev('n_tour_missed', '💔', function (c) { var t = c.nt && c.nt.tour; return c.pro && t && t.own && t.squad && !t.squad.inSq && t.squad.why === 'nicht nominiert' && !X.mem(c.st, 'tmiss' + t.s + t.k) && c.st.pc.nt.cal.some(function (e) { return e.kind === 'tour' && e.sq === t.squad; }); }, 'Nicht im Turnierkader', function (c) { return coach(c) + ' hat dich für die ' + tname(c) + ' nicht nominiert. Du siehst die Bekanntgabe im Fernsehen.'; },
      [{ l: 'Dem Team trotzdem Glück wünschen', fx: function (st, c) { X.mem(st, 'tmiss' + TK(c), 1); return E(st, { media: 3, nt: 2, well: -3 }); } }, { l: 'Urlaub buchen und abschalten', fx: function (st, c) { X.mem(st, 'tmiss' + TK(c), 1); return E(st, { stress: -5, well: 2, nt: -1 }); } }, { l: 'Enttäuscht schweigen', fx: function (st, c) { X.mem(st, 'tmiss' + TK(c), 1); return E(st, { well: -4 }); } }], { prio: 3, cd: 5 }),
    ev('n_tour_arrival', '🏨', function (c) { return TOUR(c) && !X.mem(c.st, 'tarr' + TK(c)); }, 'Ankunft im Turnierquartier', function (c) { return 'Polizeieskorte, Fans an der Straße, ein Hotel abgeschirmt von der Welt. Die ' + tname(c) + ' beginnt.'; },
      [{ l: 'Sofort ins Training', fx: function (st, c) { X.mem(st, 'tarr' + TK(c), 1); return E(st, { disc: 2, nt: 1 }); } }, { l: 'Erst ankommen, Zimmer einrichten', fx: function (st, c) { X.mem(st, 'tarr' + TK(c), 1); return E(st, { well: 2, stress: -2 }); } }], { prio: 3, cd: 5, scene: 'nt_hotel' }),
    ev('n_tour_opening', '🎬', function (c) { var r = RES(c); return TOUR(c) && r && /1\. Gruppenspiel/.test(r.label); }, 'Auftakt geschafft', function (c) { var r = RES(c); return 'Das erste Turnierspiel gegen ' + opp(c) + ' endet ' + r.res.join(':') + '. ' + (r.won ? 'Ein Start nach Maß.' : r.lost ? 'Jetzt steht ihr unter Druck.' : 'Alles noch offen.'); },
      [{ l: 'Fokus auf das nächste Spiel', fx: function (st) { return E(st, { disc: 2 }); } }, { l: 'Mit den Fans feiern bzw. trösten', fx: function (st) { return E(st, { fans: 3, fit: -1 }); } }], { prio: 2, cd: 5 }),
    ev('n_tour_group_final', '🧮', function (c) { var t = c.nt && c.nt.tour; return TOUR(c) && t.rounds.length === 3 && t.rounds[1].done && !t.rounds[2].done; }, 'Endspiel in der Gruppe', function (c) { return 'Vor dem letzten Gruppenspiel rechnen die Zeitungen alle Konstellationen durch. Ein Punkt könnte reichen – oder auch nicht.'; },
      [{ l: 'Auf Sieg spielen wollen', fx: function (st) { return E(st, { conf: 2, stress: 2 }); } }, { l: 'Ruhe bewahren', fx: function (st) { return E(st, { stress: -2 }); } }], { prio: 2, cd: 5 }),
    ev('n_tour_ko_through', '🎉', function (c) { var r = RES(c); return TOUR(c) && r && r.won && /finale/i.test(r.label) && !/Finale$/.test(r.label); }, 'Eine Runde weiter!', function (c) { var r = RES(c); return r.label.split(' · ')[1] + ' gewonnen: ' + r.res.join(':') + (r.pens ? ' (i.E. ' + r.pens.join(':') + ')' : '') + ' gegen ' + opp(c) + '. Das ganze Land feiert.'; },
      [{ l: 'Mit dem Team feiern', fx: function (st) { return E(st, { team: 3, fit: -2, well: 3 }); } }, { l: 'Regenerieren', fx: function (st) { return E(st, { fit: 3 }); } }], { prio: 2, cd: 2 }),
    ev('n_tour_out', '😢', function (c) { var l = TEND(c); return l && l.inSq && l.best !== 'W' && l.best !== 'F'; }, 'Das Turnier ist vorbei', function (c) { var l = TEND(c); return 'Aus im ' + { G: 'Vorrunde', R16: 'Achtelfinale', QF: 'Viertelfinale', SF: 'Halbfinale' }[l.best] + '. Im Bus zum Flughafen spricht niemand.'; },
      [{ l: 'Dem Team Mut zusprechen', fx: function (st) { return E(st, { lead: 3, team: 2, well: -2 }); } }, { l: 'Allein mit den Gedanken', fx: function (st) { return E(st, { well: -4, stress: 2 }); } }, { l: 'Sofort nach Hause zur Familie', fx: function (st) { return E(st, { fam: 4, well: 1 }); } }], { prio: 3, scene: 'nt_out' }),
    ev('n_tour_final_lost', '🥈', function (c) { var l = TEND(c); return l && l.inSq && l.best === 'F'; }, 'Im Finale verloren', function () { return 'Silber. Die Medaille fühlt sich schwer an. Auf der Tribüne weinen eure Fans – vor Stolz und Enttäuschung.'; },
      [{ l: 'Medaille um den Hals lassen', fx: function (st) { return E(st, { conf: 2, fans: 3 }); } }, { l: 'Medaille sofort abnehmen', fx: function (st) { return E(st, { media: -2, amb: 3 }); } }], { prio: 3, once: false, cd: 10, scene: 'nt_out' }),
    ev('n_tour_won', '🏆', function (c) { var l = TEND(c); return l && l.inSq && l.best === 'W'; }, 'Titelgewinn!', function (c) { return 'Ihr habt es geschafft! Konfetti, Tränen, der Pokal in deinen Händen. Du rufst als Erstes ' + (ptn(c) ? fn(ptn(c)) : 'deine Eltern') + ' an.'; },
      [{ l: 'Die ganze Nacht feiern', fx: function (st) { return E(st, { well: 8, fit: -5, team: 4 }); } }, { l: 'Pokal mit ins Hotelbett', fx: function (st) { return E(st, { well: 6, media: 2 }); } }], { prio: 4, scene: 'nt_title' }),
    ev('n_tour_parade', '🚌', function (c) { var l = TEND(c, 4); return l && l.inSq && (l.best === 'W' || l.best === 'F'); }, 'Empfang in der Heimat', function (c) { var l = TEND(c, 4); return 'Hunderttausende warten auf euch. ' + (l.best === 'W' ? 'Ihr zeigt den Pokal vom Balkon.' : 'Trotz Finalniederlage werdet ihr gefeiert wie Sieger.'); },
      [{ l: 'Ans Mikrofon', fx: function (st) { return E(st, { fame: 3, fans: 4, f_gel: 3 }); } }, { l: 'Lieber im Hintergrund', fx: function (st) { return E(st, { team: 2 }); } }], { prio: 2, cd: 10, scene: 'nt_fans' }),
    ev('n_qual_clinched', '✅', function (c) { return IN(c) && RECENT(c, 'qualified', 2); }, 'Qualifikation geschafft', function (c) { return nat(c) + ' fährt zur ' + NT.CFG.tours[c.nt.last.tour].n + '! Im Kabinengang wird gesungen.'; },
      [{ l: 'Mitsingen', fx: function (st) { return E(st, { team: 3, well: 3 }); } }, { l: 'Gedanklich schon beim Turnierkader', fx: function (st) { return E(st, { amb: 3, stress: 1 }); } }], { prio: 2 }),
    ev('n_qual_failed', '🚫', function (c) { return c.pro && c.nt && c.nt.caps > 0 && RECENT(c, 'qualFailed', 2); }, 'Qualifikation verpasst', function (c) { return nat(c) + ' ist beim großen Turnier nicht dabei. Die Medien sprechen von einer Blamage.'; },
      [{ l: 'Verantwortung übernehmen', fx: function (st) { return E(st, { media: 2, lead: 2, well: -3 }); } }, { l: 'Den Verband kritisieren', fx: function (st) { return E(st, { ntc: -5, fans: 2 }); } }], { prio: 2 }),
    ev('n_playoff', '🎲', function (c) { return IN(c) && RECENT(c, 'playoff', 3); }, 'Alles oder nichts: Play-off', function (c) { return 'Ein einziges Spiel gegen ' + NT.nat(c.nt.qual.playoff.opp).name + ' entscheidet über das Turnier. Das Land hält den Atem an.'; },
      [{ l: 'Druck als Antrieb', fx: function (st) { return E(st, { conf: 3, stress: 3 }); } }, { l: 'Normal vorbereiten', fx: function (st) { return E(st, { disc: 2 }); } }], { prio: 2 }),
    ev('n_league_end', '📋', function (c) { return IN(c) && RECENT(c, 'leagueEnd', 2); }, NT.CFG.leagueName + ' abgeschlossen', function (c) { return 'Die Gruppe ist gespielt: Platz ' + c.nt.last.pl + '. ' + (c.nt.last.pl === 1 ? 'Gruppensieg – und eine Prämie vom Verband.' : 'Für das nächste Mal muss mehr kommen.'); },
      [{ l: 'Abhaken', fx: function (st) { return E(st, { disc: 1 }); } }], { prio: 1 }),
    ev('n_friendly_experiment', '🧪', function (c) { var r = RES(c); return IN(c) && r && r.kind === 'friendly'; }, 'Testspiel ohne Wert?', function () { return 'Nach dem Testspiel fragen Journalisten, ob solche Spiele mitten in der Saison überhaupt Sinn ergeben.'; },
      [{ l: '„Jedes Länderspiel zählt.“', fx: function (st) { return E(st, { nt: 1, media: 1 }); } }, { l: '„Für die Vereine ist es eine Belastung.“', fx: function (st) { return E(st, { coach: 2, ntc: -2 }); } }], { cd: 80 }),
    ev('n_away_atmosphere', '📢', function (c) { var r = RES(c); return IN(c) && r && r.played && /Qualifikation|Nations|Serie/.test(r.label); }, 'Hexenkessel auswärts', function (c) { return 'Beim Spiel gegen ' + opp(c) + ' pfeifen 50.000 Zuschauer bei jeder deiner Ballberührungen. Danach fragt man dich nach dem Gefühl.'.replace('50.000', HB ? '12.000' : '50.000'); },
      [{ l: '„Das hat mich angestachelt.“', fx: function (st) { return E(st, { conf: 3 }); } }, { l: '„Ehrlich gesagt war es einschüchternd.“', fx: function (st) { return E(st, { media: 2, conf: -1 }); } }], { cd: 120 }),
    ev('n_hero_goal', '🦸', function (c) { var r = RES(c); return IN(c) && r && r.played && r.goals >= (HB ? 6 : 2) && r.won; }, 'Matchwinner', function (c) { var r = RES(c); return r.goals + ' ' + goalW(r.goals) + ' gegen ' + opp(c) + '! Die Fans skandieren deinen Namen.'; },
      [{ l: 'Kurve abklatschen', fx: function (st) { return E(st, { fans: 4, f_gel: 3, fame: 2 }); } }, { l: 'Dem Team danken', fx: function (st) { return E(st, { team: 3, fame: 1 }); } }], { cd: 20, prio: 2, scene: 'nt_goal' }),
    ev('n_hero_tour', '🌠', function (c) { var t = c.nt && c.nt.tour; return TOUR(c) && t.goals >= (HB ? 15 : 3); }, 'Turnierheld', function (c) { return 'Mit ' + c.nt.tour.goals + ' ' + goalW(c.nt.tour.goals) + ' bist du einer der besten Torschützen der ' + tname(c) + '. Internationale Klubs fragen bei deinem Berater an.'; },
      [{ l: 'Konzentriert bleiben', fx: function (st) { return E(st, { disc: 3, value: 6 }); } }, { l: 'Berater verhandeln lassen', fx: function (st) { if (R.ag) X.fire(st, 'ag_interest', {}, true); return E(st, { value: 10, coach: -2 }); } }], { cd: 30 }),
    ev('n_pens_scored', '🎯', function (c) { var ps = c.nt && c.nt.penShot; return IN(c) && ps && tick(c.st) - ps.t <= 1 && ps.sc && ps.won; }, 'Eiskalt vom Punkt', function () { return 'Du hast im Elfmeterschießen getroffen – und dein Team ist weiter. Ein Video deines Anlaufs geht um die Welt.'.replace('Elfmeterschießen', HB ? 'Siebenmeterwerfen' : 'Elfmeterschießen').replace('Elfmeter', SW.pen); },
      [{ l: 'Jubel genießen', fx: function (st) { return E(st, { conf: 4, fame: 2 }); } }, { l: 'Dem Torwart danken', fx: function (st) { return E(st, { team: 3 }); } }], { cd: 10, prio: 3, scene: 'nt_pen' }),
    ev('n_pens_missed', '💔', function (c) { var ps = c.nt && c.nt.penShot; return IN(c) && ps && tick(c.st) - ps.t <= 1 && !ps.sc && !ps.won; }, 'Der verschossene ' + (HB ? 'Siebenmeter' : 'Elfmeter'), function (c) { return 'Dein Versuch im Entscheidungsschießen war nicht drin. ' + nat(c) + ' ist raus' + (c.nt.penShot.tour ? ' aus der ' + tname(c) : '') + '. Du sinkst auf den Rasen.'.replace('Rasen', HB ? 'Hallenboden' : 'Rasen'); },
      [{ l: 'Vor die Kameras treten', fx: function (st) { later(st, 1, 'n_pressure_social', { pen: 1 }); return E(st, { media: 4, well: -6, stress: 6 }); } }, { l: 'Wortlos in die Kabine', fx: function (st) { later(st, 1, 'n_pressure_social', { pen: 1 }); return E(st, { media: -3, well: -8, stress: 8 }); } }], { cd: 5, prio: 4, scene: 'nt_out' }),
    ev('n_tour_sleepless', '🌙', function (c) { return TOUR(c); }, 'Schlaflose Nacht', function (c) { return 'Vor dem nächsten Turnierspiel liegst du wach. Die Klimaanlage summt, das Handy blinkt.'; },
      [{ l: 'Handy aus, Musik an', fx: function (st) { return E(st, { stress: -3, fit: 1 }); } }, { l: 'Mit dem Mentaltrainer sprechen', fx: function (st) { return E(st, { stress: -4, conf: 2 }); } }, { l: 'Kommentare lesen', fx: function (st) { return E(st, { stress: 4, conf: -2 }); } }], { cd: 20 }),
    ev('n_tour_heat', '🌡️', function (c) { return TOUR(c) && c.nt.tour.where === 'summer'; }, 'Hitze im Turnierland', function () { return 'Über 30 Grad beim Training. Die Ärzte warnen vor Überlastung.'; },
      [{ l: 'Trainingsumfang reduzieren', fx: function (st) { return E(st, { fit: 3, nt: -1 }); } }, { l: 'Durchziehen', fx: function (st) { return E(st, { fit: -4, nt: 2 }); } }], { cd: 60 }),
    ev('n_tour_travel', '✈️', function (c) { return TOUR(c); }, 'Reisestrapazen', function () { return 'Zwischen zwei Spielorten liegen 1.400 Kilometer. Der Flug hat Verspätung, das Hotel ist laut.'; },
      [{ l: 'Schlafen, wo es geht', fx: function (st) { return E(st, { fit: 2 }); } }, { l: 'Beim Team-Quiz mitmachen', fx: function (st) { return E(st, { team: 2, fit: -1 }); } }], { cd: 40, scene: 'nt_travel' }),
    ev('n_opp_star', '⭐', function (c) { return TOUR(c) && c.nt.tour.rounds.length > 3; }, 'Duell mit einem Weltstar', function () { return 'Im nächsten K.-o.-Spiel triffst du auf einen der besten Spieler der Welt. Die Presse vergleicht euch beide.'; },
      [{ l: '„Ich habe vor niemandem Angst.“', fx: function (st) { return E(st, { conf: 3, media: 1 }); } }, { l: '„Er ist ein Vorbild.“', fx: function (st) { return E(st, { media: 2 }); } }], { cd: 60 }),
    ev('n_tour_ref', '🟨', function (c) { var r = RES(c); return TOUR(c) && r && r.lost; }, 'Ärger über den Schiedsrichter', function () { return 'Nach der Niederlage diskutiert das ganze Land eine strittige Szene. Ein Mikrofon wird dir hingehalten.'; },
      [{ l: 'Sachlich bleiben', fx: function (st) { return E(st, { media: 2 }); } }, { l: 'Klare Worte gegen den Schiedsrichter', fx: function (st) { return E(st, { fans: 3, media: -3, stress: 2 }); } }], { cd: 30 }),
    ev('n_youth_tour', '🏅', function (c) { return c.nt && c.age <= 21 && Object.keys(c.nt.youth).some(function (k) { return c.nt.youth[k].caps >= 4; }) && !X.mem(c.st, 'ntYTour'); }, 'Junioren-Turnier', function () { return 'Mit den Junioren fährst du zu einem internationalen Turnier. Scouts aus ganz Europa sitzen auf der Tribüne.'; },
      [{ l: 'Glänzen wollen', fx: function (st) { X.mem(st, 'ntYTour', 1); return ch(0.5) ? T('Du spielst ein starkes Turnier.', E(st, { fame: 3, value: 6 })) : T('Es läuft durchwachsen.', E(st, { conf: -1 })); } }, { l: 'Mannschaftsdienlich spielen', fx: function (st) { X.mem(st, 'ntYTour', 1); return E(st, { team: 3, coach: 1 }); } }], { once: true }),
    ev('n_tour_draw', '🎱', function (c) { var t = c.nt && c.nt.tour; return IN(c) && t && t.own && !t.done && !t.rounds[0].done && !X.mem(c.st, 'draw' + t.s + t.k) && NT.away(c.st) < 3; }, 'Die Gruppenauslosung', function (c) { var t = c.nt.tour, g = t.groups.filter(function (g) { return g.indexOf(c.nt.code) >= 0; })[0] || []; return 'Die Gruppe für die ' + tname(c) + ' steht: ' + g.filter(function (x) { return x !== c.nt.code; }).map(function (x) { return NT.nat(x).name; }).join(', ') + '.'; },
      [{ l: '„Machbar.“', fx: function (st, c) { X.mem(st, 'draw' + TK(c), 1); return E(st, { conf: 1 }); } }, { l: '„Eine Hammergruppe.“', fx: function (st, c) { X.mem(st, 'draw' + TK(c), 1); return E(st, { media: 1 }); } }], { prio: 1 })
  ]);

  // =====================================================================================
  // 4) Medien, soziale Netzwerke, Fans (Bogen E Druck) – 22
  // =====================================================================================
  X.add('nati', [
    F('n_pressure_social', '📱', 'Shitstorm', function (c, d) { return 'Seit ' + (d.pen ? 'dem verschossenen Versuch' : 'dem Spiel') + ' explodieren deine Kanäle: tausende Kommentare, manche unter der Gürtellinie.'; },
      [{ l: 'Kommentare deaktivieren', fx: function (st) { later(st, R.randInt(1, 3), 'n_pressure_threat'); return E(st, { stress: -2, pop: -2 }); } }, { l: 'Ein ehrliches Video posten', fx: function (st) { return ch(0.6) ? T('Die Stimmung kippt – viele stellen sich hinter dich.', E(st, { pop: 5, well: 3 })) : T('Es hilft nur wenig.', E(st, { stress: 3 })); } }, { l: 'Berater übernehmen lassen', fx: function (st) { return E(st, { stress: -3, media: -1 }); } }], { scene: 'nt_phone' }),
    F('n_pressure_threat', '🛡️', 'Drohungen', function () { return 'Unter den Nachrichten sind echte Drohungen – auch gegen deine Familie. Die Polizei empfiehlt Schutzmaßnahmen.'; },
      [{ l: 'Anzeige erstatten, Sicherheitsdienst', fx: function (st) { if (R.pf && R.pf.book) R.pf.book(st, -(HB ? 1500 : 8000), 'Sicherheit'); later(st, R.randInt(6, 12), 'n_pressure_heal'); return E(st, { stress: -3, fam: 2 }); } }, { l: 'Familie für ein paar Tage wegbringen', fx: function (st) { later(st, R.randInt(6, 12), 'n_pressure_heal'); return E(st, { fam: 3, stress: 2, well: -2 }); } }, { l: 'Öffentlich machen', fx: function (st) { later(st, R.randInt(6, 12), 'n_pressure_heal'); return E(st, { pop: 6, media: 3, stress: 2 }); } }]),
    F('n_pressure_heal', '🌤️', 'Die Wende', function () { return 'Wochen später schreibt dir ein kleiner Junge: „Du bist trotzdem mein Held.“ Dazu ein selbstgemaltes Bild.'; },
      [{ l: 'Ihn zum Training einladen', fx: function (st) { return E(st, { well: 6, pop: 4, f_fam: 4 }); } }, { l: 'Bild über den Schreibtisch hängen', fx: function (st) { return E(st, { well: 4, conf: 3 }); } }]),
    ev('n_media_headline', '🗞️', function (c) { var r = RES(c); return IN(c) && r && r.played && (r.rating >= (HB ? 8 : 7.5) || r.rating < (HB ? 6.4 : 5.9)); }, 'Schlagzeile', function (c) { var r = RES(c); return r.rating >= (HB ? 8 : 7.5) ? 'Die größte Zeitung des Landes titelt mit deinem Namen: „' + c.p.last.toUpperCase() + ' – DER UNTERSCHIEDSSPIELER!“' : 'Die Zeitung hat dir eine Note 5 gegeben und schreibt „Ein Totalausfall“.'; },
      [{ l: 'Nicht lesen', fx: function (st) { return E(st, { stress: -1 }); } }, { l: 'Ausschneiden bzw. als Motivation nutzen', fx: function (st) { return E(st, { conf: 2, amb: 1 }); } }], { cd: 30 }),
    ev('n_media_interview', '🎙️', function (c) { return IN(c) && (TOUR(c) || c.nt.caps >= 5); }, 'Exklusiv-Interview', function () { return 'Ein großes Magazin will ein langes Interview über dich und das Nationalteam. Fragen über das Privatleben sind angekündigt.'; },
      [{ l: 'Offen erzählen', fx: function (st) { return E(st, { media: 5, pop: 3, stress: 2 }); } }, { l: 'Nur über Sport sprechen', fx: function (st) { return E(st, { media: 2 }); } }, { l: 'Absagen', fx: function (st) { return E(st, { media: -2, stress: -1 }); } }], { cd: 100 }),
    ev('n_media_anthem', '🎶', function (c) { return IN(c) && c.nt.caps >= 2; }, 'Die Hymnen-Frage', function () { return 'Ein Kommentator kritisiert, dass einige Spieler die Hymne nicht mitsingen. Man fragt dich nach deiner Haltung.'; },
      [{ l: '„Jeder zeigt Stolz auf seine Art.“', fx: function (st) { return E(st, { team: 2, media: 1 }); } }, { l: '„Ich singe immer mit.“', fx: function (st) { return E(st, { fans: 2 }); } }], { cd: 300, w: 0.5 }),
    ev('n_social_viral', '🔥', function (c) { var r = RES(c); return IN(c) && r && r.played && r.goals >= 1; }, 'Viral', function () { return 'Dein Torjubel im Nationaltrikot wird millionenfach geteilt. Plötzlich folgen dir Leute aus aller Welt.'; },
      [{ l: 'Signature-Jubel daraus machen', fx: function (st) { return E(st, { pop: 4, sponsor: 3 }); } }, { l: 'Gelassen bleiben', fx: function (st) { return E(st, { pop: 2 }); } }], { cd: 80, scene: 'nt_phone' }),
    ev('n_social_fake', '🤥', function (c) { return IN(c) && c.nt.caps >= 3; }, 'Falschmeldung', function (c) { return 'Ein Account verbreitet, du hättest im Teamhotel mit ' + PP(c, 'rival') + ' gestritten. Nichts davon stimmt.'; },
      [{ l: 'Gemeinsames Foto posten', fx: function (st) { return E(st, { p_rival: 3, pop: 2 }); } }, { l: 'Ignorieren', fx: function (st) { return E(st, { stress: 1 }); } }], { cd: 200 }),
    ev('n_fans_autographs', '✍️', function (c) { return IN(c) && (TOUR(c) || RES(c)); }, 'Autogrammjäger am Teamhotel', function () { return 'Am Hotelzaun warten Kinder mit Trikots und Stiften. Der Bus fährt in fünf Minuten.'; },
      [{ l: 'Jeden einzelnen bedienen', fx: function (st) { return E(st, { f_fam: 4, fans: 2, fit: -1 }); } }, { l: 'Winken und einsteigen', fx: function (st) { return E(st, { f_fam: -1 }); } }], { cd: 50, scene: 'nt_fans' }),
    ev('n_fans_letter', '💌', function (c) { return IN(c) && c.nt.caps >= 3; }, 'Ein besonderer Fanbrief', function () { return 'Eine ältere Dame schreibt dir: Ihr verstorbener Mann habe jedes Länderspiel geschaut – du warst sein Lieblingsspieler.'; },
      [{ l: 'Handschriftlich antworten', fx: function (st) { return E(st, { well: 3, pop: 2 }); } }, { l: 'Trikot schicken', fx: function (st) { return E(st, { well: 2, f_fam: 2 }); } }], { cd: 250 }),
    // seltene romantische Kontaktaufnahme – bewusst selten und ohne Pflicht
    ev('n_fans_admirer', '🌹', function (c) { return IN(c) && c.nt.caps >= 5 && !ptn(c) && ch(0.25); }, 'Nachricht einer Bewunderin', function () { return 'Unter den tausenden Nachrichten nach dem Länderspiel ist eine, die dich zum Schmunzeln bringt: witzig, klug, ohne Fanfare – und mit einer Einladung auf einen Kaffee.'; },
      [{ l: 'Antworten', fx: function (st) { if (L && L.newCand) { var x = L.newCand(st); x.stage = 1; x.v = 55; x.note = 'Hat nach einem Länderspiel geschrieben.'; } return E(st, { well: 2 }); } }, { l: 'Nett bedanken, mehr nicht', fx: function (st) { return E(st, { pop: 1 }); } }], { cd: 400, w: 0.25 }),
    ev('n_fans_pitch', '🏃', function (c) { var r = RES(c); return IN(c) && r && r.played && r.won; }, 'Flitzer', function () { return 'Ein Fan stürmt aufs Feld, um dich zu umarmen. Die Ordner sind nicht schnell genug.'; },
      [{ l: 'Umarmung erwidern', fx: function (st) { return E(st, { pop: 3, media: 1 }); } }, { l: 'Ordner rufen', fx: function (st) { return E(st, { pop: -1 }); } }], { cd: 300, w: 0.4 }),
    ev('n_media_ex_coach', '📺', function (c) { return IN(c) && c.nt.caps >= 10 && c.nt.critic >= 1; }, 'TV-Experte gegen dich', function () { return 'Ein ehemaliger Nationalspieler, heute TV-Experte, nennt dich „überschätzt“.'; },
      [{ l: 'Locker kontern', fx: function (st) { return ch(0.5) ? T('Die Antwort sitzt – das Netz feiert dich.', E(st, { pop: 3, media: 1 })) : T('Es wirkt dünnhäutig.', E(st, { media: -2 })); } }, { l: 'Nicht reagieren', fx: function (st) { return E(st, { disc: 2 }); } }], { cd: 200 }),
    ev('n_media_doc', '🎥', function (c) { return IN(c) && TOUR(c); }, 'Doku-Kamerateam', function () { return 'Ein Streaming-Dienst dreht eine Doku über das Turnier. Das Team soll Kameras sogar in der Kabine zulassen.'; },
      [{ l: 'Offen sein', fx: function (st) { return E(st, { pop: 4, stress: 2 }); } }, { l: 'Grenzen ziehen', fx: function (st) { return E(st, { team: 2, media: -1 }); } }], { cd: 300 }),
    ev('n_media_press_conf', '🎤', function (c) { return TOUR(c); }, 'Pressekonferenz im Turnier', function () { return 'Du sitzt neben dem Nationaltrainer auf dem Podium. Die erste Frage zielt auf eine Schwäche deiner Mannschaft.'; },
      [{ l: 'Diplomatisch', fx: function (st) { return E(st, { media: 3, ntc: 2 }); } }, { l: 'Selbstbewusst', fx: function (st) { return E(st, { conf: 2, media: 1 }); } }, { l: 'Humorvoll', fx: function (st) { return ch(0.6) ? T('Der Saal lacht, die Szene geht viral.', E(st, { pop: 4 })) : T('Der Witz kommt falsch an.', E(st, { media: -2 })); } }], { cd: 20, scene: 'nt_press' }),
    ev('n_fans_home_club', '🏠', function (c) { return IN(c) && RES(c) && c.c; }, 'Stolz im Verein', function (c) { return 'Beim nächsten Heimspiel feiern die Fans von ' + c.c.short + ' dich mit einem Banner: „Unser Nationalspieler!“'; },
      [{ l: 'Zur Kurve gehen', fx: function (st) { return E(st, { fans: 4, f_club: 3 }); } }], { cd: 200 }),
    ev('n_fans_jersey', '👕', function (c) { return IN(c) && c.nt.caps >= 5 && c.st.pc.fame >= 35; }, 'Trikot-Bestseller', function () { return 'Dein Nationaltrikot ist das meistverkaufte im Fanshop. Der Ausrüster meldet sich.'; },
      [{ l: 'Freuen', fx: function (st) { return E(st, { sponsor: 4, fame: 1 }); } }], { cd: 300 }),
    ev('n_media_rumor_retire', '❓', function (c) { return IN(c) && c.age >= 31 && c.nt.caps >= 30; }, 'Rücktrittsgerüchte', function () { return 'Eine Zeitung behauptet, du würdest nach dem nächsten Turnier zurücktreten.'; },
      [{ l: 'Klar dementieren', fx: function (st) { return E(st, { media: 1, nt: 1 }); } }, { l: 'Offen lassen', fx: function (st) { return E(st, { media: 2, stress: 1 }); } }], { cd: 200 }),
    ev('n_social_charity', '🤲', function (c) { return IN(c) && c.st.pc.fame >= 25; }, 'Spendenaufruf', function () { return 'Nach einer Naturkatastrophe im Land fragen Fans, ob die Nationalspieler helfen.'; },
      [{ l: 'Großzügig spenden', fx: function (st) { pay(st, -(HB ? 2000 : 25000), 'Spende'); return E(st, { pop: 5, fans: 3, well: 2 }); } }, { l: 'Benefizspiel organisieren', fx: function (st) { return E(st, { pop: 4, lead: 2, fit: -2 }); } }, { l: 'Still privat spenden', fx: function (st) { pay(st, -(HB ? 1000 : 10000), 'Spende'); return E(st, { well: 2 }); } }], { cd: 400, w: 0.5 }),
    ev('n_media_politics', '🏛️', function (c) { return IN(c) && TOUR(c); }, 'Politische Frage', function () { return 'Ein Reporter fragt dich nach der Menschenrechtslage im Gastgeberland.'; },
      [{ l: 'Klare Haltung', fx: function (st) { return E(st, { media: 2, pop: 2, ntc: -1 }); } }, { l: '„Ich konzentriere mich auf den Sport.“', fx: function (st) { return E(st, { media: -1 }); } }], { cd: 400, w: 0.5 }),
    ev('n_fan_kid_mascot', '🧒', function (c) { return IN(c) && RES(c) && RES(c).played; }, 'Einlaufkind', function () { return 'Das Einlaufkind an deiner Hand zitterte vor Aufregung. Nach dem Spiel steht es mit seinen Eltern am Spielertunnel.'; },
      [{ l: 'Trikot schenken', fx: function (st) { return E(st, { f_fam: 4, well: 2 }); } }, { l: 'Selfie', fx: function (st) { return E(st, { f_fam: 2 }); } }], { cd: 250 })
  ]);

  // =====================================================================================
  // 5) Familie, Beziehung und Abwesenheit (Bogen G) – 22
  // =====================================================================================
  X.add('nati', [
    ev('n_fam_kid_birthday', '🎂', function (c) { return TOUR(c) && kids(c).length; }, 'Geburtstag zu Hause', function (c) { var k = kids(c)[0]; return fn(k) + ' hat Geburtstag – und du bist mitten im Turnier. Per Video siehst du die Torte mit deinem Trikot darauf.'; },
      [{ l: 'Lange Videoschalte, Training später', fx: function (st) { return E(st, { fam: 6, partner: 3, nt: -1 }); } }, { l: 'Kurz anrufen, dann Fokus', fx: function (st) { return E(st, { fam: -2, partner: -3 }); } }, { l: 'Überraschungspaket schicken lassen', fx: function (st) { pay(st, -300, 'Geschenke'); return E(st, { fam: 4 }); } }], { cd: 60, prio: 2, scene: 'nt_phone' }),
    ev('n_fam_birth_tour', '👶', function (c) { var lf = c.st.pc.cx.life; return TOUR(c) && lf && lf.preg && lf.preg.due - tick(c.st) <= 2; }, 'Geburt während des Turniers', function (c) { return fn(ptn(c) || { name: 'Deine Partnerin' }) + ' ruft an: Die Wehen haben eingesetzt – Tausende Kilometer entfernt spielst du in zwei Tagen ein Turnierspiel.'; },
      [{ l: 'Sofort nach Hause fliegen', fx: function (st, c) { var nt = NT.ensure(st); nt.cal.forEach(function (e) { if (e.kind === 'tour' && !e.played && e.slot === NT.slot(st)) e.useOv = 'out'; }); chron(st, '👶', 'Heimflug zur Geburt', 'Mitten im Turnier – für die Familie.', 3); return E(st, { partner: 10, fam: 8, nt: -2, well: 6 }); } },
        { l: 'Bleiben – Videocall im Kreißsaal', fx: function (st) { return E(st, { partner: -10, fam: -5, nt: 2, stress: 5 }); } },
        { l: 'Mit dem Trainer sprechen', fx: function (st, c) { var ok = (c.nt.coach.v || 50) >= 50 || ch(0.5); if (ok) { var nt = NT.ensure(st); nt.cal.forEach(function (e) { if (e.kind === 'tour' && !e.played && e.slot === NT.slot(st)) e.useOv = 'bench'; }); return T('Er gibt dir zwei Tage frei – zurück zum Spiel, dann von der Bank.', E(st, { partner: 6, ntc: 4 })); } return T('Er bittet dich, zu bleiben.', E(st, { partner: -6, stress: 4 })); } }], { prio: 4, once: false, cd: 20 }),
    ev('n_fam_partner_lonely', '💭', function (c) { return TOUR(c) && ptn(c); }, 'Allein zu Hause', function (c) { return fn(ptn(c)) + ' schreibt: „Ich freu mich für dich. Aber ich fühle mich gerade ziemlich allein mit allem.“'; },
      [{ l: 'Jeden Abend anrufen', fx: function (st) { return E(st, { partner: 5, fit: -1 }); } }, { l: 'Zum Spiel einfliegen lassen', fx: function (st) { pay(st, -(HB ? 800 : 2500), 'Reisen'); return E(st, { partner: 7 }); } }, { l: '„Es sind nur ein paar Wochen.“', fx: function (st) { return E(st, { partner: -5 }); } }], { cd: 40, prio: 1, scene: 'nt_phone' }),
    ev('n_fam_partner_stadium', '🏟️', function (c) { return TOUR(c) && ptn(c); }, 'Im Stadion', function (c) { return fn(ptn(c)) + ' sitzt beim Turnierspiel auf der Tribüne. Die Kamera zeigt sie in Großaufnahme.'.replace('Stadion', SW.venue); },
      [{ l: 'Herz-Geste nach dem Spiel', fx: function (st) { return E(st, { partner: 5, pop: 2 }); } }, { l: 'Lieber unauffällig', fx: function (st) { return E(st, { partner: 1 }); } }], { cd: 60 }),
    ev('n_fam_parents_proud', '👪', function (c) { return IN(c) && c.nt.caps >= 1 && c.nt.caps <= 3; }, 'Die Eltern', function () { return 'Deine Eltern waren beim Länderspiel. Dein Vater hat, so sagt deine Mutter, die ganze Hymne lang geweint.'; },
      [{ l: 'Abendessen mit ihnen', fx: function (st) { return E(st, { fam: 6, well: 3 }); } }], { once: true, prio: 2 }),
    ev('n_fam_grandparent', '🕯️', function (c) { return IN(c) && (RES(c) || TOUR(c)) && ch(0.3); }, 'Schlechte Nachricht von zu Hause', function () { return 'Deine Großmutter liegt im Krankenhaus. Es steht nicht gut. Du bist beim Nationalteam.'; },
      [{ l: 'Abreisen', fx: function (st) { var nt = NT.ensure(st); nt.cal.forEach(function (e) { if (!e.played && e.slot === NT.slot(st)) e.useOv = 'out'; }); return E(st, { fam: 8, nt: -1, well: -3 }); } }, { l: 'Bleiben und ihr das Spiel widmen', fx: function (st) { return E(st, { fam: -2, conf: 2, stress: 4 }); } }], { cd: 600, w: 0.3 }),
    ev('n_fam_tickets', '🎟️', function (c) { return IN(c) && TOUR(c); }, 'Karten für die Familie', function () { return 'Jeder Spieler bekommt vier Freikarten. Deine Familie, Freunde und ehemalige Mitspieler wollen zusammen etwa 20.'; },
      [{ l: 'Zusätzliche Karten kaufen', fx: function (st) { pay(st, -(HB ? 600 : 2400), 'Tickets'); return E(st, { fam: 4, well: 1 }); } }, { l: 'Nur die engste Familie', fx: function (st) { return E(st, { fam: 2, friend: -2 }); } }], { cd: 60 }),
    ev('n_fam_partner_career', '💼', function (c) { return IN(c) && ptn(c) && NT.away(c.st) > 0; }, 'Ihre Karriere', function (c) { return fn(ptn(c)) + ' hat ein wichtiges Jobangebot in einer anderen Stadt – und du bist ständig unterwegs: Verein, Nationalteam, Reisen.'; },
      [{ l: 'Sie unterstützen', fx: function (st) { return E(st, { partner: 6, stress: 2 }); } }, { l: 'Bitten, noch zu warten', fx: function (st) { return E(st, { partner: -6 }); } }], { cd: 400, w: 0.5 }),
    ev('n_fam_holiday_short', '🏖️', function (c) { var l = TEND(c, 3); return l && l.inSq && ptn(c); }, 'Kurzer Urlaub', function (c) { return 'Nach dem Turnier bleiben nur zehn Tage bis zum Trainingsstart. ' + fn(ptn(c)) + ' hatte sich drei Wochen gewünscht.'; },
      [{ l: 'Später einsteigen (Verein fragen)', fx: function (st) { return E(st, { partner: 6, coach: -3, fit: 4 }); } }, { l: 'Zehn Tage, intensiv', fx: function (st) { return E(st, { partner: 2, fit: 2 }); } }], { cd: 50 }),
    ev('n_fam_kid_school', '🏫', function (c) { return IN(c) && kids(c).some(function (k) { return c.st.season - k.born >= 6; }); }, 'Papa im Fernsehen', function (c) { var k = kids(c).filter(function (k) { return c.st.season - k.born >= 6; })[0]; return 'In der Schule sind alle neidisch: ' + fn(k) + ' hat stolz dein Nationaltrikot angezogen. Aber ' + fn(k) + ' fragt auch: „Warum bist du so oft weg?“'; },
      [{ l: 'Zur Schule kommen und erzählen', fx: function (st) { return E(st, { fam: 6, fit: -1 }); } }, { l: 'Ein Wochenende nur für die Kinder', fx: function (st) { return E(st, { fam: 5, ap: -1 }); } }], { cd: 300 }),
    ev('n_fam_video_call', '📹', function (c) { return TOUR(c) && (ptn(c) || kids(c).length); }, 'Videoanruf nach dem Spiel', function () { return 'Nach dem Spiel ist es spät. Zu Hause wartet man auf deinen Anruf.'; },
      [{ l: 'Anrufen, auch wenn ich müde bin', fx: function (st) { return E(st, { partner: 3, fam: 2, fit: -1 }); } }, { l: 'Nur kurze Nachricht', fx: function (st) { return E(st, { partner: -2 }); } }], { cd: 20, scene: 'nt_phone' }),
    ev('n_fam_reunion', '🤗', function (c) { var l = TEND(c, 2); return l && l.inSq; }, 'Wiedersehen', function (c) { return 'Am Flughafen warten ' + (ptn(c) ? fn(ptn(c)) : 'deine Eltern') + (kids(c).length ? ' und die Kinder' : '') + '. Endlich zu Hause.'; },
      [{ l: 'Handy für zwei Tage aus', fx: function (st) { return E(st, { partner: 5, fam: 5, stress: -5 }); } }], { cd: 40, prio: 2, scene: 'nt_home' }),
    ev('n_fam_jealous_fame', '😒', function (c) { return IN(c) && ptn(c) && c.st.pc.fame >= 40; }, 'Im Schatten', function (c) { return fn(ptn(c)) + ' wird nur noch als „die Partnerin des Nationalspielers“ vorgestellt. Das nervt sie.'; },
      [{ l: 'Öffentlich über ihre Arbeit sprechen', fx: function (st) { return E(st, { partner: 5 }); } }, { l: 'Verständnis zeigen', fx: function (st) { return E(st, { partner: 3 }); } }], { cd: 300 }),
    ev('n_fam_sibling', '👦', function (c) { return IN(c) && c.nt.caps >= 1; }, 'Der kleine Bruder', function () { return 'Dein jüngerer Bruder spielt auch – in der Kreisliga. Er fragt, ob du mal zum Training kommst. Dein Kalender ist voll.'; },
      [{ l: 'Termin freimachen', fx: function (st) { return E(st, { fam: 6, ap: -1 }); } }, { l: 'Auf später verschieben', fx: function (st) { return E(st, { fam: -2 }); } }], { cd: 400, w: 0.5 }),
    ev('n_fam_wedding_clash', '💍', function (c) { return IN(c) && NT.away(c.st) > 0; }, 'Hochzeit eines Freundes', function () { return 'Dein bester Freund aus Kindertagen heiratet – genau am Länderspieltag. Du solltest Trauzeuge sein.'; },
      [{ l: 'Beim Verband um Freigabe bitten', fx: function (st) { return ch(0.35) ? T('Ausnahmsweise darf er dich einen Tag freistellen.', E(st, { friend: 8, nt: -1 })) : T('Abgelehnt. Du schreibst eine Rede per Video.', E(st, { friend: -3 })); } }, { l: 'Absagen', fx: function (st) { return E(st, { friend: -6 }); } }], { cd: 500, w: 0.4 }),
    ev('n_fam_partner_pressure', '🌧️', function (c) { return IN(c) && ptn(c) && (c.nt.critic >= 2 || (c.nt.penShot && !c.nt.penShot.sc && tick(c.st) - c.nt.penShot.t <= 4)); }, 'Auch sie wird angefeindet', function (c) { return 'Unter Fotos von ' + fn(ptn(c)) + ' stehen hässliche Kommentare. Sie hat Angst, aus dem Haus zu gehen.'; },
      [{ l: 'Bei ihr bleiben, Termin absagen', fx: function (st) { return E(st, { partner: 7, ap: -1, media: -1 }); } }, { l: 'Anwalt einschalten', fx: function (st) { pay(st, -(HB ? 800 : 4000), 'Rechtsberatung'); return E(st, { partner: 4, stress: -1 }); } }], { cd: 200 }),
    ev('n_fam_kid_ill', '🤒', function (c) { return NT.away(c.st) > 0 && IN(c) && kids(c).length; }, 'Krankes Kind', function (c) { return fn(kids(c)[0]) + ' hat hohes Fieber. ' + (ptn(c) ? fn(ptn(c)) + ' ist allein und erschöpft.' : 'Die Großeltern kümmern sich.'); },
      [{ l: 'Einen Tag später anreisen', fx: function (st) { return E(st, { fam: 6, partner: 4, nt: -2 }); } }, { l: 'Pünktlich zum Lehrgang', fx: function (st) { return E(st, { partner: -4, stress: 3 }); } }], { cd: 200 }),
    ev('n_fam_mum_tv', '📺', function (c) { var r = RES(c); return IN(c) && r && r.played; }, 'Mama vor dem Fernseher', function () { return 'Deine Mutter schickt dir nach jedem Länderspiel eine Sprachnachricht mit ihrer persönlichen Spielanalyse. Heute ist sie fünf Minuten lang.'; },
      [{ l: 'Ganz anhören und lachen', fx: function (st) { return E(st, { fam: 3, well: 2 }); } }], { cd: 300 }),
    ev('n_fam_home_town', '🏘️', function (c) { return IN(c) && c.nt.caps >= 10; }, 'Ehrung in der Heimatstadt', function (c) { return 'Deine Heimatstadt ' + (c.cx.prof.home || '') + ' will dich als Nationalspieler ehren – mit Eintrag ins Goldene Buch.'; },
      [{ l: 'Hinfahren', fx: function (st) { return E(st, { fam: 4, pop: 3, ap: -1 }); } }, { l: 'Freundlich absagen', fx: function (st) { return E(st, { pop: -1 }); } }], { once: true }),
    ev('n_fam_partner_support', '💪', function (c) { return IN(c) && ptn(c) && (c.nt.status === 'dropped' || RECENT(c, 'dropped', 3)); }, 'Rückhalt', function (c) { return fn(ptn(c)) + ' merkt, wie sehr dich die Nicht-Nominierung trifft, und kocht dein Lieblingsessen.'; },
      [{ l: 'Darüber reden', fx: function (st) { return E(st, { partner: 4, well: 4, stress: -3 }); } }, { l: 'Lieber ablenken', fx: function (st) { return E(st, { well: 2 }); } }], { cd: 100 }),
    ev('n_fam_goal_dedication', '🤟', function (c) { var r = RES(c); return IN(c) && r && r.goals >= 1 && (kids(c).length || ptn(c)); }, 'Torjubel für die Familie', function () { return 'Du hast im Länderspiel getroffen. Welchen Jubel zeigst du?'; },
      [{ l: 'Daumenlutschen für die Kinder', fx: function (st) { return E(st, { fam: 4 }); } }, { l: 'Herz für die Partnerin', fx: function (st) { return E(st, { partner: 4 }); } }, { l: 'Auf das Wappen zeigen', fx: function (st) { return E(st, { fans: 3 }); } }], { cd: 60 }),
    ev('n_fam_holiday_cancel', '🧳', function (c) { return IN(c) && c.st.phase === 'season' && c.st.week >= 30 && c.nt.tour && !c.nt.tour.done && c.nt.tour.own; }, 'Urlaub storniert', function () { return 'Der Familienurlaub fällt wegen des Turniers aus. Die Stornogebühr ist da, die Kinder sind traurig.'; },
      [{ l: 'Urlaub nach dem Turnier nachholen', fx: function (st) { pay(st, -(HB ? 500 : 1800), 'Stornogebühr'); return E(st, { fam: 2 }); } }], { cd: 300 })
  ]);

  // =====================================================================================
  // 6) Prämien und Sponsoren – 16
  // =====================================================================================
  X.add('nati', [
    ev('n_bonus_dispute', '💶', function (c) { var t = c.nt && c.nt.tour; return IN(c) && t && t.own && !t.done && !X.mem(c.st, 'bonusDisp' + t.s + t.k) && NT.away(c.st) < 3; }, 'Prämienstreit', function (c) { return 'Der Mannschaftsrat verhandelt mit dem Verband über die Turnierprämien. ' + PP(c, 'capt') + ' fragt, ob du hart bleiben willst.'; },
      [{ l: 'Hart bleiben', fx: function (st, c) { X.mem(st, 'bonusDisp' + TK(c), 1); if (ch(0.5)) { NT.PRIZE_BONUS = 1.1; return T('Der Verband legt 10 % drauf. Die Presse findet das gierig.', E(st, { media: -3, team: 2 })); } return T('Der Verband bleibt hart.', E(st, { media: -2 })); } }, { l: 'Einigung empfehlen', fx: function (st, c) { X.mem(st, 'bonusDisp' + TK(c), 1); return E(st, { media: 2, ntc: 2 }); } }, { l: 'Prämie für Jugendarbeit spenden', fx: function (st, c) { X.mem(st, 'bonusDisp' + TK(c), 1); X.mem(st, 'ntDonate', 1); return E(st, { pop: 5, fans: 3 }); } }], { prio: 1 }),
    ev('n_bonus_paid', '🧾', function (c) { var l = c.nt && c.nt.payLog && c.nt.payLog[0]; return IN(c) && l && /Turnierprämie|Qualifikationsprämie/.test(l.txt) && tick(c.st) - l.t <= 1; }, 'Prämie überwiesen', function (c) { var l = c.nt.payLog[0]; return l.txt + ': brutto ' + R.fmtMoney(l.gross) + ', nach Abgaben ' + R.fmtMoney(l.net) + ' auf deinem Konto.'; },
      [{ l: 'Anlegen', fx: function (st) { return E(st, { disc: 1 }); } }, { l: 'Team-Essen spendieren', fx: function (st) { pay(st, -(HB ? 400 : 3000), 'Einladung'); return E(st, { team: 3 }); } }, { l: 'Teil an die Eltern', fx: function (st, c) { pay(st, -Math.round(c.nt.payLog[0].net * 0.2), 'Familie'); return E(st, { fam: 6 }); } }], { cd: 5, prio: 1 }),
    ev('n_sponsor_campaign', '📸', function (c) { return IN(c) && c.nt.caps >= 5 && c.st.pc.fame >= 30; }, 'Werbekampagne zum Turnier', function () { return 'Ein Getränkehersteller will dich für die Turnier-Kampagne. Fotoshooting an einem freien Tag.'; },
      [{ l: 'Zusagen', fx: function (st) { pay(st, HB ? 6000 : 60000, 'Werbung'); return E(st, { sponsor: 4, stress: 2, ap: -1 }); } }, { l: 'Absagen – Fokus', fx: function (st) { return E(st, { nt: 1 }); } }], { cd: 300 }),
    ev('n_sponsor_conflict', '⚖️', function (c) { return IN(c) && c.st.pc.fame >= 30; }, 'Sponsorenkonflikt', function () { return 'Dein persönlicher Schuhausrüster ist nicht der Ausrüster des Verbands. Bei Pressekonferenzen sollst du dessen Logo abkleben.'.replace('Schuhausrüster', HB ? 'Schuhausrüster' : 'Schuhausrüster'); },
      [{ l: 'Regeln einhalten', fx: function (st) { return E(st, { ntc: 2, sponsor: -2 }); } }, { l: 'Logo zeigen', fx: function (st) { pay(st, -(HB ? 1000 : 10000), 'Strafe Verband'); return E(st, { sponsor: 4, ntc: -4 }); } }], { cd: 400 }),
    ev('n_sponsor_bonus_clause', '📑', function (c) { return IN(c) && c.nt.caps === 1 && R.ag && R.ag.current(c.st); }, 'Prämienklausel', function () { return 'Dein Berater hat in einem Sponsorvertrag eine Klausel für Länderspiele versteckt. Jetzt wird sie fällig.'; },
      [{ l: 'Kassieren', fx: function (st) { pay(st, HB ? 3000 : 25000, 'Sponsor-Bonus'); return E(st, { agent: 3 }); } }], { once: true }),
    ev('n_tax_advice', '🧮', function (c) { return c.nt && c.nt.bonus >= (HB ? 5000 : 50000) && !X.mem(c.st, 'ntTax'); }, 'Steuerfrage', function () { return 'Deine Finanzberatung weist darauf hin, dass Prämien voll versteuert werden müssen. Es gebe „Gestaltungsspielräume“.'; },
      [{ l: 'Sauber versteuern', fx: function (st) { X.mem(st, 'ntTax', 1); return E(st, { disc: 2 }); } }, { l: 'Riskantes Modell', fx: function (st) { X.mem(st, 'ntTax', 1); if (ch(0.3)) { pay(st, -(HB ? 4000 : 40000), 'Steuernachzahlung'); return T('Das Finanzamt erkennt das Modell nicht an.', E(st, { media: -3, stress: 4 })); } pay(st, HB ? 1000 : 10000, 'Steuerersparnis'); return 'Diesmal geht es durch.'; } }], { once: true }),
    ev('n_sponsor_kids', '🧸', function (c) { return IN(c) && c.st.pc.fame >= 40 && kids(c).length; }, 'Werbung mit der Familie?', function () { return 'Ein Babyartikel-Hersteller möchte dich mit deinen Kindern für eine Kampagne zum Turnier.'; },
      [{ l: 'Nein – die Kinder bleiben privat', fx: function (st) { return E(st, { fam: 4, partner: 3 }); } }, { l: 'Zusagen', fx: function (st) { pay(st, HB ? 5000 : 50000, 'Werbung'); return E(st, { partner: -4, pop: 2 }); } }], { cd: 500 }),
    ev('n_brand_value', '📈', function (c) { var l = TEND(c, 3); return l && l.inSq && (l.best === 'W' || l.best === 'F' || l.best === 'SF'); }, 'Marktwert steigt', function () { return 'Nach dem starken Turnier steigt dein Marktwert. Dein Berater ruft an: „Jetzt ist der Moment.“'; },
      [{ l: 'Gespräche führen lassen', fx: function (st) { if (R.ag) X.fire(st, 'ag_interest', {}, true); return E(st, { value: 12, coach: -2 }); } }, { l: 'Erst durchatmen', fx: function (st) { return E(st, { value: 8, stress: -2 }); } }], { cd: 30 }),
    ev('n_endorse_watch', '⌚', function (c) { return IN(c) && c.nt.caps >= 20 && c.st.pc.fame >= 50; }, 'Luxusuhr-Botschafter', function () { return 'Ein Uhrenhersteller will dich als Botschafter. Gut bezahlt, aber die Fans kritisieren solche Deals gern.'; },
      [{ l: 'Annehmen', fx: function (st) { pay(st, HB ? 8000 : 120000, 'Werbung'); return E(st, { fans: -2, sponsor: 5 }); } }, { l: 'Ablehnen', fx: function (st) { return E(st, { fans: 1 }); } }], { cd: 500 }),
    ev('n_bonus_share_staff', '🤝', function (c) { var l = TEND(c, 3); return l && l.inSq && (l.best === 'W' || l.best === 'F'); }, 'Prämie für die Betreuer', function (c) { return 'Die Physios, Köche und Zeugwarte bekommen keine Turnierprämie. ' + PP(c, 'capt') + ' schlägt vor, dass die Spieler zusammenlegen.'; },
      [{ l: 'Großzügig beteiligen', fx: function (st) { pay(st, -(HB ? 1000 : 10000), 'Spende Betreuer'); return E(st, { team: 5, pop: 2 }); } }, { l: 'Symbolischer Betrag', fx: function (st) { pay(st, -(HB ? 200 : 2000), 'Spende Betreuer'); return E(st, { team: 1 }); } }], { cd: 100 }),
    ev('n_bonus_first', '🎁', function (c) { return c.nt && c.nt.payLog && c.nt.payLog.length >= 1 && !X.mem(c.st, 'ntBonus1'); }, 'Die erste Länderspielprämie', function (c) { var l = c.nt.payLog[c.nt.payLog.length - 1]; return 'Auf dem Konto: ' + l.txt + ' über ' + R.fmtMoney(l.net) + ' (nach Abgaben). Kein riesiger Betrag – aber ein symbolischer.'; },
      [{ l: 'Etwas Besonderes kaufen', fx: function (st) { X.mem(st, 'ntBonus1', 1); return E(st, { well: 3 }); } }, { l: 'Rahmen lassen (Kontoauszug)', fx: function (st) { X.mem(st, 'ntBonus1', 1); return E(st, { well: 2, fam: 1 }); } }], { prio: 1 }),
    ev('n_sponsor_social', '📲', function (c) { return IN(c) && c.st.pc.fame >= 25 && TOUR(c); }, 'Sponsoren-Posts im Turnier', function () { return 'Deine Sponsoren erwarten während des Turniers Posts. Der Verband hat strenge Regeln.'; },
      [{ l: 'Absprache mit dem Medienteam', fx: function (st) { return E(st, { sponsor: 2, ntc: 1 }); } }, { l: 'Einfach posten', fx: function (st) { return ch(0.5) ? T('Ärger mit dem Verband.', E(st, { ntc: -3, sponsor: 3 })) : T('Niemand stört sich daran.', E(st, { sponsor: 3 })); } }], { cd: 200 }),
    ev('n_bonus_club_cut', '🏦', function (c) { return IN(c) && c.nt.caps >= 5 && c.c; }, 'Abstellungsgebühr für den Verein', function (c) { return 'Der Verband zahlt ' + c.c.short + ' für jede deiner Abstellungen eine Entschädigung. Der Sportvorstand bedankt sich – und hofft, dass du gesund zurückkommst.'; },
      [{ l: 'Verständnis zeigen', fx: function (st) { return E(st, { board: 3 }); } }], { cd: 400 }),
    ev('n_fan_merch', '🧣', function (c) { return IN(c) && c.st.pc.fame >= 45; }, 'Eigene Fan-Kollektion', function () { return 'Der Verband will eine Fanschal-Edition mit deinem Namen. Der Erlös geht zur Hälfte an eine Stiftung deiner Wahl.'; },
      [{ l: 'Kinderhilfe wählen', fx: function (st) { return E(st, { pop: 4, f_fam: 3 }); } }, { l: 'Jugendfußball wählen', fx: function (st) { return E(st, { pop: 3, f_club: 2 }); } }], { cd: 600 }),
    ev('n_bonus_hidden', '🕵️', function (c) { return IN(c) && c.nt.caps >= 8; }, 'Ungewöhnliches Angebot', function () { return 'Ein Unbekannter bietet dir Geld für „Insider-Infos“ zur Aufstellung des nächsten Länderspiels. Offensichtlich Wettbetrug.'; },
      [{ l: 'Sofort melden', fx: function (st) { return E(st, { ntc: 5, disc: 3 }); } }, { l: 'Ignorieren', fx: function (st) { return E(st, { stress: 1 }); } }], { cd: 900, w: 0.3 }),
    ev('n_sponsor_title', '🏆', function (c) { return c.nt && c.nt.titles.length && tick(c.st) - (c.nt.last || {}).t <= 5 && !X.mem(c.st, 'spT' + (c.nt.titles[0] || {}).s); }, 'Titelprämie vom Sponsor', function (c) { return 'Nach dem Titel überweist dein persönlicher Sponsor eine Siegprämie und will einen Werbespot mit dem Pokal.'; },
      [{ l: 'Annehmen', fx: function (st, c) { X.mem(st, 'spT' + (c.nt.titles[0] || {}).s, 1); pay(st, HB ? 10000 : 150000, 'Sponsor-Titelprämie'); return E(st, { sponsor: 6 }); } }], { prio: 2 })
  ]);

  // =====================================================================================
  // 7) Vereinskonflikte, Krisen, Rücktritt, Comeback (Bögen F, H) – 17
  // =====================================================================================
  X.add('nati', [
    ev('n_club_vs_nt', '⚔️', function (c) { return IN(c) && NT.away(c.st) > 0 || (IN(c) && RES(c) && RES(c).played && c.st.phase === 'season'); }, 'Verein gegen Verband', function (c) { return 'Dein Vereinstrainer ist sauer: Du kommst vom Länderspiel müde zurück, am Wochenende geht es um wichtige Punkte für ' + (c.c ? c.c.short : 'den Verein') + '.'; },
      [{ l: 'Am Wochenende trotzdem spielen wollen', fx: function (st) { return E(st, { coach: 3, fit: -3 }); } }, { l: 'Pause vorschlagen', fx: function (st) { return E(st, { coach: -2, fit: 4 }); } }, { l: 'Beide Trainer telefonieren lassen', fx: function (st) { return ch(0.6) ? T('Sie einigen sich auf einen Belastungsplan.', E(st, { coach: 2, ntc: 2 })) : T('Das Telefonat endet im Streit.', E(st, { coach: -2, ntc: -2, stress: 3 })); } }], { cd: 60 }),
    ev('n_club_fake_injury', '🤕', function (c) { return IN(c) && c.c && c.st.phase === 'season' && c.st.week >= 25 && NT.away(c.st) > 0; }, 'Absage auf Druck des Vereins?', function () { return 'Im Abstiegs- bzw. Titelkampf deutet dein Verein an, eine „kleine Blessur“ könnte dir ein paar Tage Pause verschaffen.'; },
      [{ l: 'Ablehnen – ich fahre', fx: function (st) { return E(st, { nt: 3, board: -4, coach: -2 }); } }, { l: 'Mitmachen', fx: function (st) { var nt = NT.ensure(st); nt.cal.forEach(function (e) { if (!e.played && e.slot === NT.slot(st)) e.useOv = 'out'; }); if (ch(0.35)) { return T('Es fliegt auf. Der Verband ist außer sich.', E(st, { nt: -12, ntc: -10, media: -5 })); } return T('Niemand fragt nach.', E(st, { board: 4, nt: -3 })); } }], { cd: 300, w: 0.6 }),
    ev('n_club_injury_return', '🩹', function (c) { return c.pro && c.nt && c.nt.last && c.nt.last.kind === 'injured' && tick(c.st) - c.nt.last.t <= 2; }, 'Verletzt vom Länderspiel zurück', function (c) { return 'Du kommst mit einer Verletzung vom Nationalteam zurück. Bei ' + (c.c ? c.c.short : 'deinem Verein') + ' ist die Stimmung frostig.'; },
      [{ l: 'Verein beschwichtigen', fx: function (st) { return E(st, { coach: 2, board: 2 }); } }, { l: '„Das kann überall passieren.“', fx: function (st) { return E(st, { coach: -2, board: -3 }); } }], { prio: 2 }),
    ev('n_crisis_slump', '🌀', function (c) { return IN(c) && c.nt.streak <= -2; }, 'Formkrise im Nationalteam', function () { return 'Drei schwache Länderspiele in Folge. Die Experten fordern deine Ausbootung.'; },
      [{ l: 'Mentaltrainer engagieren', fx: function (st) { pay(st, -(HB ? 1500 : 6000), 'Mentaltraining'); var nt = NT.ensure(st); nt.streak = 0; return E(st, { conf: 5, stress: -4 }); } }, { l: 'Freiwillig eine Pause anbieten', fx: function (st) { var nt = NT.ensure(st); nt.streak = 0; return E(st, { media: 3, nt: -4, stress: -5 }); } }, { l: 'Weitermachen', fx: function (st) { return E(st, { stress: 3 }); } }], { cd: 60, prio: 1 }),
    ev('n_crisis_scandal', '🍾', function (c) { return TOUR(c) && c.cx.per.disc < 45; }, 'Nach dem Zapfenstreich', function () { return 'Ein paar Spieler wollen sich nach der Ausgangssperre noch an die Hotelbar schleichen.'; },
      [{ l: 'Mitgehen', fx: function (st) { if (ch(0.4)) { NT.ensure(st).critic++; return T('Ein Foto landet in der Zeitung. Der Trainer tobt.', E(st, { nt: -8, media: -5, team: 2 })); } return T('Niemand merkt etwas.', E(st, { team: 3, fit: -2 })); } }, { l: 'Auf dem Zimmer bleiben', fx: function (st) { return E(st, { disc: 3, fit: 1 }); } }, { l: 'Den Kapitän informieren', fx: function (st) { return E(st, { p_capt: 4, team: -3 }); } }], { cd: 200 }),
    ev('n_retire_thought', '🤔', function (c) { var nt = c.nt; return IN(c) && c.age >= 31 && nt.caps >= 25 && (TEND(c, 4) || nt.benchRun >= 3); }, 'Gedanken an den Rücktritt', function (c) { return 'Mit ' + c.age + ' Jahren und ' + c.nt.caps + ' Länderspielen fragst du dich, ob die Doppelbelastung noch Sinn ergibt.'; },
      [{ l: 'Gespräch mit dem Nationaltrainer', fx: function (st) { if (L && L.start && !L.active(st)) L.start(st, 'nt_retire', {}); return ''; } }, { l: 'Weitermachen, solange ich gebraucht werde', fx: function (st) { return E(st, { amb: 2 }); } }], { cd: 100, prio: 1 }),
    ev('n_retire_fans', '👋', function (c) { return c.nt && c.nt.retired && tick(c.st) - c.nt.retired.t <= 3; }, 'Abschied von den Fans', function (c) { return 'Der Verband lädt dich zu einem offiziellen Abschied vor dem nächsten Länderspiel ein – nach ' + c.nt.retired.caps + ' Spielen.'; },
      [{ l: 'Mit Familie aufs Feld', fx: function (st) { chron(st, '👋', 'Offizieller Abschied', 'Ehrenrunde vor vollem Haus.', 3, 'nt_retire'); return E(st, { fam: 5, pop: 4, well: 4 }); } }, { l: 'Ohne großes Aufsehen', fx: function (st) { return E(st, { well: 2 }); } }], { prio: 3 }),
    ev('n_comeback_call', '📞', function (c) { var nt = c.nt; return c.pro && nt && nt.retired && c.st.season - nt.retired.s >= 1 && c.p.ovr >= (NT.threshold(c.st, c.p.pos, 'A').cut || 99) && c.age <= 35; }, 'Der Nationaltrainer ruft an', function (c) { return coach(c) + ' am Telefon: „Wir haben Verletzungssorgen. Ich weiß, du bist zurückgetreten. Aber kannst du dir ein Comeback vorstellen?“'; },
      [{ l: 'Ja – ein letztes Mal', fx: function (st) { NT.unretire(st); return E(st, { nt: 8, amb: 4, fam: -2 }); } }, { l: 'Nein, mein Entschluss steht', fx: function (st) { return E(st, { fam: 3, ntc: -2 }); } }, { l: 'Nur für das große Turnier', fx: function (st) { NT.unretire(st); X.mem(st, 'ntLastDance', 1); return E(st, { nt: 6, media: 3 }); } }], { cd: 200, prio: 2 }),
    ev('n_comeback_doubt', '🧐', function (c) { return IN(c) && c.nt.comebackFrom && tick(c.st) - c.nt.comebackFrom.t <= 80 && RES(c); }, 'Comeback in der Kritik', function () { return 'Einige Junge fühlen sich übergangen – und ein Kolumnist schreibt: „Rücktritt vom Rücktritt? Peinlich.“'; },
      [{ l: 'Mit Leistung antworten', fx: function (st) { return E(st, { disc: 3, conf: 2 }); } }, { l: 'Den Jungen Mut machen', fx: function (st) { return E(st, { p_talent: 5, team: 3 }); } }], { cd: 300 }),
    ev('n_last_dance', '💃', function (c) { var l = TEND(c, 3); return l && l.inSq && X.mem(c.st, 'ntLastDance') && !(c.nt.retired); }, 'Der letzte Tanz', function () { return 'Das Turnier ist vorbei – so wie versprochen war es dein letztes.'; },
      [{ l: 'Endgültig zurücktreten', fx: function (st) { NT.retire(st, 'Abschied nach dem letzten Turnier'); return E(st, { well: 4, fam: 4 }); } }, { l: 'Doch weitermachen', fx: function (st) { X.mem(st, 'ntLastDance', -1); return E(st, { media: -2, amb: 2 }); } }], { prio: 2 }),
    ev('n_crisis_burnout', '🔋', function (c) { return IN(c) && c.cx.per.stress >= 70; }, 'Am Limit', function () { return 'Verein, Nationalteam, Reisen, Medien – du schläfst kaum noch. Der Teamarzt rät zu einer Länderspielpause.'; },
      [{ l: 'Pause beim Verband beantragen', fx: function (st) { var nt = NT.ensure(st); nt.cal.forEach(function (e) { if (!e.played && e.slot === NT.slot(st)) e.useOv = 'out'; }); return E(st, { stress: -10, nt: -3, well: 4 }); } }, { l: 'Zähne zusammenbeißen', fx: function (st) { return E(st, { stress: 4, fit: -3 }); } }], { cd: 100 }),
    ev('n_crisis_doping', '🧪', function (c) { return IN(c) && c.nt.caps >= 5; }, 'Dopingkontrolle', function () { return 'Unangekündigte Kontrolle um sechs Uhr morgens im Teamhotel. Ein Routineablauf – aber du hast am Vortag ein Erkältungsmittel genommen.'; },
      [{ l: 'Arzt sofort informieren', fx: function (st) { return T('Alles gemeldet, alles in Ordnung.', E(st, { disc: 2 })); } }, { l: 'Nichts sagen', fx: function (st) { if (ch(0.15)) { NT.ensure(st).critic += 2; return T('Ein Wert ist auffällig – nach Prüfung entlastet, aber die Schlagzeilen bleiben.', E(st, { media: -6, stress: 6 })); } return 'Kein Befund.'; } }], { cd: 600, w: 0.4 }),
    ev('n_crisis_red', '🟥', function (c) { var r = RES(c); return IN(c) && r && r.lost && r.played && r.rating < (HB ? 6 : 5.5); }, 'Sündenbock', function (c) { return 'Nach der Niederlage gegen ' + opp(c) + ' machen dich die Medien zum Hauptschuldigen.'; },
      [{ l: 'Fehler einräumen', fx: function (st) { return E(st, { media: 3, conf: -2 }); } }, { l: 'Team schützen und auf mich nehmen', fx: function (st) { return E(st, { team: 4, lead: 2, stress: 3 }); } }], { cd: 60 }),
    ev('n_crisis_switch_coach', '🔄', function (c) { return c.pro && c.nt && c.nt.status === 'dropped' && c.nt.coachChange && tick(c.st) - c.nt.coachChange.t <= 6; }, 'Neue Chance unter neuem Trainer', function (c) { return 'Unter ' + coach(c) + ' beginnt die Kaderplanung neu. Er ' + NT.STYLES[c.nt.coach.style] + '.'; },
      [{ l: 'Bewerben mit Leistung', fx: function (st) { return E(st, { disc: 2, nt: 3 }); } }], { prio: 1 }),
    ev('n_crisis_injury_risk', '⚠️', function (c) { return c.pro && c.nt && c.nt.riskHit && tick(c.st) - c.nt.riskHit.t <= 2; }, 'Das Risiko hat sich gerächt', function (c) { return 'Der Muskel hat nicht gehalten. Diagnose: Faserriss, ' + c.nt.riskHit.w + ' Wochen Pause – auch für den Verein.'; },
      [{ l: 'Verantwortung übernehmen', fx: function (st) { return E(st, { coach: -3, board: -3, media: 1 }); } }, { l: 'Dem Nationaltrainer Vorwürfe machen', fx: function (st) { return E(st, { ntc: -6, coach: 1 }); } }], { prio: 3 }),
    ev('n_crisis_switch_nation', '🛂', function (c) { return c.pro && c.nt && c.nt.caps === 0 && c.age >= 25 && c.p.ovr >= 70 && !X.mem(c.st, 'ntSwitch'); }, 'Verbandswechsel?', function () { return 'Weil du nie ein Pflichtspiel bestritten hast, könntest du über die Herkunft deiner Familie noch für ein anderes Land spielen. Ein kleinerer Verband wirbt um dich.'; },
      [{ l: 'Treu bleiben', fx: function (st) { X.mem(st, 'ntSwitch', 1); return E(st, { fam: 2 }); } }, { l: 'Angebot annehmen', fx: function (st) { X.mem(st, 'ntSwitch', 1); var nt = NT.ensure(st), low = NT.NATIONS.filter(function (n) { return n.q < 0.62 && n.code !== nt.code; }); var nn = low[R.randInt(0, low.length - 1)]; nt.code = nn.code; nt.season = null; nt.people = null; nt.cutMem = {}; nt.trust = 60; NT.newSeason(st); chron(st, '🛂', 'Verbandswechsel', 'Ab sofort spielst du für ' + nn.name + '.', 3); return T('Ab sofort spielst du für ' + nn.name + '.', E(st, { fam: -3, media: 3 })); } }], { once: true, w: 0.3 })
  ]);

  // =====================================================================================
  // Begleitereignisse nach der ersten Einladung (Kette, über X.later)
  // =====================================================================================
  X.add('nati', [
    F('n_fc_clubcoach', '📋', 'Dein Vereinstrainer gratuliert', function (c) { return 'Im Vereinstraining klatscht dich der Trainer ab: „Verdient. Aber komm mir gesund zurück – wir brauchen dich am Wochenende.“'; },
      [{ l: 'Versprechen', fx: function (st) { return E(st, { coach: 3 }); } }]),
    F('n_fc_team', '🍾', 'Kabinenparty', function () { return 'Die Mitspieler im Verein haben eine Torte mit Nationalflagge besorgt. Ein paar sind sichtlich neidisch.'; },
      [{ l: 'Runde ausgeben', fx: function (st) { pay(st, -(HB ? 200 : 1000), 'Einladung'); return E(st, { mates: 4 }); } }, { l: 'Danke sagen, bescheiden bleiben', fx: function (st) { return E(st, { mates: 2, team: 1 }); } }]),
    F('n_fc_press', '🎙️', 'Erste Pressekonferenz beim Verband', function () { return 'Zum ersten Mal sitzt du vor dem Logo des Verbands. 40 Journalisten. Die erste Frage: „Welche Ziele haben Sie?“'; },
      [{ l: '„Lernen und meine Chance nutzen.“', fx: function (st) { return E(st, { media: 3 }); } }, { l: '„Ich will spielen, nicht zuschauen.“', fx: function (st) { return E(st, { media: 1, conf: 3, ntc: -1 }); } }], { scene: 'nt_press' }),
    F('n_fc_fans', '📣', 'Die Fans', function () { return 'In den sozialen Netzwerken gratulieren dir tausende Fans. Einige Rivalenfans spotten.'; },
      [{ l: 'Persönliches Dankesvideo', fx: function (st) { return E(st, { pop: 4, f_gel: 2 }); } }, { l: 'Kurzer Post', fx: function (st) { return E(st, { pop: 1 }); } }], { scene: 'nt_phone' }),
    F('n_fc_agent', '💼', 'Der Berater', function () { return 'Dein Berater ruft an: „Mit der Nominierung steigt dein Marktwert. Wir sollten über den Vertrag reden.“'; },
      [{ l: 'Verhandeln lassen', fx: function (st) { return E(st, { value: 8, coach: -1 }); } }, { l: 'Jetzt nicht', fx: function (st) { return E(st, { value: 4 }); } }]),
    F('n_fc_family', '🏡', 'Zu Hause', function (c) { return (ptn(c) ? fn(ptn(c)) + ' hat Sekt kaltgestellt.' : 'Deine Eltern haben Freunde eingeladen.') + ' Alle wollen wissen, wie der Anruf war.'; },
      [{ l: 'Alles dreimal erzählen', fx: function (st) { return E(st, { fam: 5, partner: 4, well: 3 }); } }]),
    F('n_fc_travel', '🧳', 'Anreise zum Lehrgang', function () { return 'Du packst die Tasche für den ersten Lehrgang. Was nimmst du mit, was lässt du zu Hause?'; },
      [{ l: 'Eigenes Kissen und Kopfhörer', fx: function (st) { return E(st, { fit: 2 }); } }, { l: 'Nur das Nötigste – ich will frei sein', fx: function (st) { return E(st, { conf: 1 }); } }], { scene: 'nt_travel' })
  ]);

  // =====================================================================================
  // Mehrstufige Dialoge
  // =====================================================================================
  if (L && L.addDlg) {
    function endI(d, r, e) { return { r: r, e: e || {}, end: true }; }
    function follow(st) { ['n_fc_clubcoach', 'n_fc_team', 'n_fc_press', 'n_fc_fans', 'n_fc_agent', 'n_fc_family', 'n_fc_travel'].forEach(function (id, i) { later(st, 1 + Math.floor(i / 2), id); }); }
    L.addDlg([{
      id: 'nt_firstcall', cat: 'nati', ic: '📞', scene: 'nt_call', title: 'Der Anruf des Nationaltrainers', max: 2, imp: 3,
      who: function (c) { return { n: c.nt.coach.name, role: 'Nationaltrainer · ' + NT.own(c.st).name, ic: '🦅', kind: 'coach' }; },
      nodes: {
        start: { say: function (c, d) { return 'Dein Handy klingelt, unbekannte Nummer. „Hallo, hier ist ' + c.nt.coach.name + '. Ich wollte es dir persönlich sagen: Du bist im Kader für ' + (d.label || 'die nächsten Länderspiele') + '. Glückwunsch.“'; },
          opts: [
            { l: 'Sprachlos – „Danke… wirklich?“', hint: 'Ehrliche Freude', fx: function (st) { return { r: '„Ja, wirklich“, lacht er. „Du hast es dir verdient.“', e: { well: 6, conf: 3, ntc: 3 }, next: 'role' }; } },
            { l: 'Euphorisch jubeln', hint: 'Emotional', fx: function (st) { return { r: 'Du schreist so laut, dass er das Handy vom Ohr nehmen muss. Er lacht mit.', e: { well: 8, ntc: 2 }, next: 'role' }; } },
            { l: 'Ruhig und professionell', hint: 'Seriös', fx: function (st) { return { r: '„Gut, so mag ich das“, sagt er sachlich.', e: { disc: 3, ntc: 4 }, next: 'role' }; } },
            { l: 'Selbstbewusst: „Wurde auch Zeit.“', hint: 'Riskant', fx: function (st) { return { r: 'Kurze Stille. „Dann zeig mir, dass du recht hast.“', e: { conf: 5, ntc: -3 }, next: 'role' }; } },
            { l: 'Zögernd: „Bin ich wirklich so weit?“', hint: 'Bescheiden', fx: function (st) { return { r: '„Sonst hätte ich nicht angerufen.“', e: { conf: -1, ntc: 3, team: 2 }, next: 'role' }; } }] },
        role: { say: function (c) { var ro = c.nt.role || 'Ergänzungsspieler'; return '„Ich plane dich zunächst als ' + ro + ' ein. Wir haben starke Konkurrenz auf deiner Position, ' + c.nt.people.rival.name + ' ist gesetzt. Was erwartest du dir?“'; },
          opts: [
            { l: '„Ich will lernen und meine Chance nutzen.“', fx: function (st, c, d) { follow(st); return endI(d, 'Er wirkt zufrieden. „Genau das will ich hören.“ Danach rufst du sofort zu Hause an.', { nt: 3 }); } },
            { l: '„Ich will spielen.“', fx: function (st, c, d) { follow(st); return endI(d, '„Dann überzeug mich im Training.“ Ein Satz, der hängen bleibt.', { conf: 2, amb: 2 }); } },
            { l: '„Wo sehen Sie mich in Ihrem System?“', fx: function (st, c, d) { follow(st); return endI(d, 'Er erklärt dir fünf Minuten lang seine Idee. Du verstehst, worauf es ankommt.', { nt: 2, ntc: 3 }); } }] }
      },
      sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
    }, {
      id: 'nt_debut', cat: 'nati', ic: '🎶', scene: 'nt_anthem', title: 'Das erste Länderspiel', max: 2, imp: 3,
      who: function (c) { return { n: c.nt.people.capt.name, role: 'Kapitän · ' + NT.own(c.st).name, ic: '©️', kind: 'mate' }; },
      nodes: {
        start: { say: function (c, d) { return 'Nach dem Abpfiff (' + d.res + ' gegen ' + d.opp + ') legt dir der Kapitän den Arm um die Schulter: „Und? Wie war die Hymne?“' + (d.g ? ' Du hast sogar getroffen.' : ''); },
          opts: [
            { l: '„Gänsehaut. Ich hab fast geweint.“', fx: function () { return { r: '„Das geht jedem so. Mir heute noch.“', e: { p_capt: 5, well: 4 }, next: 'shirt' }; } },
            { l: '„Ich war komplett im Tunnel.“', fx: function () { return { r: '„Gut so. Genieß es trotzdem später.“', e: { conf: 3 }, next: 'shirt' }; } },
            { l: '„Ich hab an meine Familie gedacht.“', fx: function () { return { r: 'Er nickt. „Ruf sie gleich an.“', e: { fam: 5 }, next: 'shirt' }; } }] },
        shirt: { say: function () { return 'In der Kabine liegt dein erstes Nationaltrikot. Was machst du damit?'; },
          opts: [
            { l: 'Eltern schenken', fx: function (st, c, d) { return endI(d, 'Deine Mutter lässt es rahmen.', { fam: 5 }); } },
            { l: 'Mit dem Gegenspieler tauschen', fx: function (st, c, d) { return endI(d, 'Ein Erinnerungsstück an ' + d.opp + '.', { team: 1, pop: 1 }); } },
            { l: 'Behalten, ungewaschen', fx: function (st, c, d) { return endI(d, 'Es kommt in eine Box. Vielleicht für immer.', { well: 3 }); } }] }
      },
      sum: function (st, c, d, s) { return 'Debüt gegen ' + d.opp + ' (' + d.res + ').'; }
    }, {
      // Die entscheidende Woche – Nationalteam, Gesundheit, Beziehung und Karriere in einer Entscheidung
      id: 'nt_decisive', cat: 'nati', ic: '⏳', scene: 'nt_stadium', title: 'Die entscheidende Woche', max: 2, imp: 3,
      who: function (c) { return { n: c.nt.coach.name, role: 'Nationaltrainer · ' + NT.own(c.st).name, ic: '🦅', kind: 'coach' }; },
      nodes: {
        start: { say: function (c, d) { var pt = ptn(c), ag = R.ag && R.ag.current(c.st);
          return d.round + ' der ' + d.tour + ' gegen ' + d.opp + '. Seit dem letzten Spiel zieht es im Oberschenkel – eine leichte Muskelverletzung, sagt der Physio. ' + c.nt.coach.name + ' will dich trotzdem in der Startelf: „Ohne dich wird es schwer.“' + (pt ? ' Zu Hause ist ' + fn(pt) + ' angespannt: „Riskier nicht deine Gesundheit für ein Spiel.“' : '') + (ag ? ' Dein Berater ' + ag.n + ' meldet sich: „Ein starkes K.-o.-Spiel kann deinen Marktwert deutlich steigern.“' : ' Dein Umfeld weiß: Ein starkes K.-o.-Spiel kann deinen Marktwert deutlich steigern.'); },
          opts: [
            { l: 'Ich will unbedingt spielen', hint: 'Startelf · hohes Verletzungsrisiko · Beziehung belastet', fx: function (st, c, d) { NT.setDecision(st, d.key, 'start', 0.32); return { r: 'Du sagst zu. ' + c.nt.coach.name + ' klopft dir auf die Schulter. Der Physio schüttelt leise den Kopf.', e: { nt: 6, ntc: 5, partner: -6, stress: 4 }, next: 'after' }; } },
            { l: 'Erst ärztlich untersuchen lassen', hint: 'MRT entscheidet · kleines Risiko', fx: function (st, c, d) { if (ch(0.55)) { NT.setDecision(st, d.key, 'start', 0.08); return { r: 'Das MRT zeigt nur eine Verhärtung. Grünes Licht – mit Tape und Spritze.', e: { nt: 2, partner: 2 }, next: 'after' }; } NT.setDecision(st, d.key, 'out', 0); var p = C.player(st); if (!p.inj) p.inj = { type: 'Muskelfaserriss (Untersuchung)', weeks: 2, total: 2 }; return { r: 'Das MRT zeigt einen kleinen Faserriss. Kein Einsatz – die Ärzte haben dir womöglich eine lange Pause erspart.', e: { nt: -2, partner: 4, well: -3 }, next: 'after' }; } },
            { l: 'Mit meiner Familie sprechen', hint: 'Beziehung stärken · Einsatz von der Bank', req: function (c) { return !!(ptn(c) || kids(c).length || c.cx.rel.family > 30); }, fx: function (st, c, d) { NT.setDecision(st, d.key, 'bench', 0.14); return { r: (ptn(c) ? fn(ptn(c)) : 'Deine Familie') + ' hört lange zu. Am Ende einigt ihr euch: spielen ja – aber nicht um jeden Preis. Du bittest den Trainer, von der Bank zu kommen.', e: { partner: 7, fam: 5, stress: -3, ntc: -1 }, next: 'after' }; } },
            { l: 'Mit dem Nationaltrainer verhandeln (Kurzeinsatz)', hint: 'Hängt vom Draht zum Trainer ab', fx: function (st, c, d) { var v = c.nt.coach.v || 50; if (ch(clamp(0.3 + (v - 50) / 80, 0.15, 0.85))) { NT.setDecision(st, d.key, 'bench', 0.12); return { r: 'Er überlegt lange. „Gut. Du kommst in der zweiten Halbzeit, wenn wir dich brauchen.“', e: { ntc: 3, partner: 3 }, next: 'after' }; } NT.setDecision(st, d.key, 'start', 0.26); return { r: '„Ich brauche dich von Anfang an. Keine Kompromisse.“ Du fügst dich.', e: { ntc: -3, stress: 4, partner: -3 }, next: 'after' }; } }] },
        after: { say: function (c, d) { return 'Die Entscheidung ist gefallen. Am Abend vor dem Spiel blinkt dein Handy.'; },
          opts: [
            { l: 'Nach Hause schreiben', fx: function (st, c, d) { return endI(d, 'Eine kurze Antwort: „Pass auf dich auf. Wir sind bei dir.“', { partner: 2, fam: 2 }); } },
            { l: 'Handy weglegen, Fokus', fx: function (st, c, d) { return endI(d, 'Du schläfst überraschend gut.', { fit: 2, conf: 1 }); } }] }
      },
      sum: function (st, c, d, s) { return 'Vor dem ' + d.round + ': ' + (s.log[0] ? s.log[0].a : '') + '.'; }
    }, {
      id: 'nt_retire', cat: 'nati', ic: '👋', scene: 'nt_retire', title: 'Gespräch über den Rücktritt', max: 2, imp: 3,
      who: function (c) { return { n: c.nt.coach.name, role: 'Nationaltrainer · ' + NT.own(c.st).name, ic: '🦅', kind: 'coach' }; },
      nodes: {
        start: { say: function (c) { return 'Du erzählst ' + c.nt.coach.name + ' von deinen Gedanken. Er hört zu. „' + c.nt.caps + ' Länderspiele. Ich respektiere jede Entscheidung. Aber ich sehe dich noch nicht am Ende.“'; },
          opts: [
            { l: 'Rücktritt erklären', fx: function (st, c, d) { NT.retire(st, 'Fokus auf Verein und Familie'); return endI(d, 'Er reicht dir die Hand. „Danke für alles.“', { fam: 5, stress: -6, well: 3 }); } },
            { l: 'Noch bis zum nächsten Turnier', fx: function (st, c, d) { X.mem(st, 'ntLastDance', 1); return endI(d, '„Dann machen wir das Beste draus.“', { amb: 3, ntc: 4 }); } },
            { l: 'Weitermachen', fx: function (st, c, d) { return endI(d, 'Er lächelt. „Gut. Ich brauche dich.“', { nt: 4, ntc: 3 }); } }] }
      },
      sum: function (st, c, d, s) { return s.log.length ? s.log[s.log.length - 1].r : ''; }
    }]);
  }
  // „Die entscheidende Woche“ auslösen: K.-o.-Spiel im Turnier, Stammspieler, leichte Blessur (zufällig, höchstens einmal je Turnier)
  NT.setDecision = function (st, key, use, risk) { var e = NT.ensure(st).cal.filter(function (x) { return x.key === key; })[0]; if (e) { e.useOv = use; e.risk = risk; } };
  NT.decisiveCheck = function (st) {
    var nt = st.pc && st.pc.nt; if (!nt || !L || !L.start || L.active(st)) return false;
    var t = nt.tour; if (!t || t.done || !t.own) return false;
    var e = nt.cal.filter(function (x) { return x.kind === 'tour' && x.ko && !x.played && x.slot === NT.slot(st) && NT.roundReady(st, x); })[0];
    if (!e || !e.sq || !e.sq.inSq || (e.sq.use !== 'start') || X.mem(st, 'decisive' + t.s + t.k)) return false;
    if (!(e.tr === 'QF' || e.tr === 'SF' || e.tr === 'F') || !ch(e.tr === 'QF' ? 0.45 : 0.3)) return false;
    X.mem(st, 'decisive' + t.s + t.k, 1);
    L.start(st, 'nt_decisive', { key: e.key, round: NT.ROUND_N[e.tr], tour: t.name, opp: NT.nat(e.opp).name });
    return true;
  };
  var baseMark = NT.markAway;
  NT.markAway = function (st) { var r = baseMark(st); try { NT.decisiveCheck(st); } catch (er) { if (typeof console !== 'undefined') console.error(er); } return r; };
  // =====================================================================================
  // Gespräche: Nationaltrainer, Verband, Arzt der Nationalmannschaft (Zweitmeinung auch für den Verein)
  // =====================================================================================
  if (L && L.addDlg) {
    var nEnd = function (r, e) { return { r: r, e: e || {}, end: true }; };
    NT.talkBlock = function (st, k) { var nt = NT.ensure(st); if (!nt) return 'nicht verfügbar'; nt.talkT = nt.talkT || {}; var cd = { ntcoach: 3, ntfed: 4, ntdoc: 3 }[k] || 3, t = nt.talkT[k];
      if (k !== 'ntcoach' && !nt.caps && nt.status !== 'squad') return 'erst nach der ersten Nominierung';
      if (t != null && tick(st) - t < cd) return 'wieder in ' + (cd - (tick(st) - t)) + ' Wo.'; return ''; };
    NT.docName = function (st) { var nt = NT.ensure(st); return nt.docName || (nt.docName = 'Prof. Dr. ' + (L.name ? L.name() : 'Berger')); };
    var mark = function (st, k) { var nt = NT.ensure(st); nt.talkT = nt.talkT || {}; nt.talkT[k] = tick(st); };
    var blockInit = function (k) { return function (st, c, d, s) { var why = NT.talkBlock(st, k); if (why) { s.done = true; s.sum = 'Gerade nicht möglich: ' + why + '.'; return; } mark(st, k); }; };
    L.addDlg([{
      id: 'ntcoach', cat: 'nati', ic: '🦅', scene: 'trainer', title: 'Gespräch mit dem Nationaltrainer', max: 2,
      init: blockInit('ntcoach'),
      who: function (c) { return { n: c.nt.coach.name, role: 'Nationaltrainer · ' + NT.own(c.st).name, ic: '🦅', kind: 'coach' }; },
      nodes: {
        start: { say: function (c) { var nt = c.nt; return nt.status === 'squad' ? '„Schön, dass du dich meldest. Worum geht es?“' : '„Ich beobachte dich, keine Sorge. Was möchtest du wissen?“'; },
          opts: function (c) { var nt = c.nt, o = [];
            o.push({ l: nt.status === 'squad' ? 'Was erwarten Sie von mir?' : 'Was fehlt mir zur Nominierung?', fx: function (st, c2) { var p = c2.p, f = p.form || 6, tips = [];
              if (f < 6.6) tips.push('konstant bessere Leistungen im Verein'); if (c2.share != null && c2.share < 0.6) tips.push('mehr Einsatzminuten'); if (nt.trust < 50) tips.push('Vertrauen – zeig dich im Training'); if (!tips.length) tips.push('genau so weitermachen');
              return nEnd('„Ehrlich gesagt: ' + tips.join(', ') + '. Dann sprechen wir uns wieder.“', { ntc: 3, nt: 1 }); } });
            if (nt.status === 'squad') o.push({ l: 'Ich will mehr Spielzeit.', hint: 'Riskant, wenn das Vertrauen fehlt', fx: function (st) { if (ch(0.25 + nt.trust / 160)) return nEnd('„Das gefällt mir – Ehrgeiz. Du bekommst deine Minuten, wenn du im Training überzeugst.“', { nt: 4, conf: 2 }); return nEnd('„Spielzeit verdient man sich. Bei mir zählt Leistung, nicht Ansprüche.“ Der Ton wird kühler.', { nt: -4, ntc: -3, stress: 2 }); } });
            o.push({ l: 'Ich stehe bereit – auch auf ungewohnter Position.', fx: function () { return nEnd('„Solche Spieler brauche ich. Das merke ich mir.“', { nt: 3, ntc: 2, stress: 1 }); } });
            o.push({ l: 'Wie sehen Sie das Spielsystem?', fx: function () { return nEnd('Er nimmt sich Zeit und erklärt seine Idee. Du verstehst besser, worauf es ankommt.', { ntc: 4, disc: 1 }); } });
            return o; } }
      },
      sum: function (st, c, d, s) { return s.sum || (s.log.length ? s.log[s.log.length - 1].r : ''); }
    }, {
      id: 'ntfed', cat: 'nati', ic: '🏛️', scene: 'vorstand', title: 'Termin beim Verband', max: 2,
      init: blockInit('ntfed'),
      who: function (c) { var nt = c.nt; return { n: nt.fedName || (nt.fedName = (L.name ? L.name() : 'Sportdirektor')), role: 'Sportdirektor · Verband ' + NT.own(c.st).name, ic: '🏛️', kind: 'board' }; },
      nodes: {
        start: { say: function (c) { return '„Danke, dass Sie vorbeikommen. Der Verband legt Wert auf gute Zusammenarbeit mit den Spielern. Was liegt Ihnen am Herzen?“'; },
          opts: [
            { l: 'Bei einem Sozialprojekt des Verbands mitmachen', fx: function (st, c) { var nt = c.nt; nt.fed = clamp((nt.fed || 50) + 6, 0, 100); C.addFame(st, 1); return nEnd('Du besuchst mit dem Verband eine Schule und kickst mit den Kindern. Die Bilder gehen durch die Medien.', { pop: 3, media: 2, nt: 1 }); } },
            { l: 'Prämienregelung ansprechen', fx: function (st, c) { var nt = c.nt; if (ch(0.3 + (nt.fed || 50) / 250)) { nt.fed = clamp((nt.fed || 50) + 1, 0, 100); return nEnd('„Wir prüfen das mit dem Mannschaftsrat.“ Er klingt offen – die Mitspieler danken dir.', { p_capt: 3, lead: 1 }); } nt.fed = clamp((nt.fed || 50) - 4, 0, 100); return nEnd('„Die Prämien sind ausverhandelt.“ Beim Verband gilt man jetzt als schwierig.', { nt: -1, stress: 1 }); } },
            { l: 'Belastung und Terminplanung kritisieren', fx: function (st, c) { var nt = c.nt; nt.fed = clamp((nt.fed || 50) - 3, 0, 100); return nEnd('Er notiert sich deine Punkte. Dein Vereinstrainer hört später davon – und rechnet es dir an.', { coach: 2, stress: -1, nt: -1 }); } },
            { l: 'Über die Zukunft im Nationalteam sprechen', fx: function (st, c) { var nt = c.nt; return nEnd(nt.caps >= 30 ? '„Sie sind ein Gesicht dieser Mannschaft. Wann Sie aufhören, entscheiden Sie – wir hätten Sie gern noch lange dabei.“' : '„Der Weg ist offen. Leistung entscheidet – und der Trainer.“', { conf: 1 }); } }] }
      },
      sum: function (st, c, d, s) { return s.sum || (s.log.length ? s.log[s.log.length - 1].r : ''); }
    }, {
      id: 'ntdoc', cat: 'verletzung', ic: '🩺', scene: 'medizin', title: 'Arzt der Nationalmannschaft', max: 2,
      init: blockInit('ntdoc'),
      who: function (c) { return { n: NT.docName(c.st), role: 'Arzt der Nationalmannschaft · Zweitmeinung', ic: '🩺', kind: 'doctor' }; },
      nodes: {
        start: { say: function (c) { return c.p.inj ? '„Ich habe mir die Bilder angesehen: ' + c.p.inj.type + ', ' + c.p.inj.weeks + ' Wochen laut Verein. Lassen Sie mich selbst untersuchen.“' : '„Keine Verletzung – gut so. Wir können trotzdem etwas für Ihre Belastbarkeit tun.“'; },
          opts: function (c) { return c.p.inj ? [
            { l: 'Zweitmeinung einholen (vom Verband bezahlt)', fx: function (st, c2) { var p = c2.p, r = R.rand(); if (r < 0.45 && p.inj.weeks > 1) { var w = p.inj.weeks > 6 && r < 0.15 ? 2 : 1; p.inj.weeks -= w; return nEnd('Die Diagnose ist günstiger als befürchtet: ' + w + ' Woche' + (w > 1 ? 'n' : '') + ' weniger Pause. Dein Vereinsarzt passt den Reha-Plan an.', { conf: 2, stress: -2 }); } if (r > 0.9) { p.inj.weeks += 1; return nEnd('„Ich würde eher vorsichtiger sein – eine Woche länger.“ Lieber jetzt als ein Rückfall.', { stress: 1 }); } return nEnd('Die Diagnose des Vereins wird bestätigt. Immerhin weißt du jetzt sicher Bescheid.', { stress: -1 }); } },
            { l: 'Reha-Plan abstimmen lassen', fx: function (st) { if (L.life) L.life(st).relapse = 0; return nEnd('Er telefoniert mit dem Vereinsarzt. Das Rückfallrisiko sinkt.', { stress: -2, coach: 1 }); } }] : [
            { l: 'Leistungsdiagnostik auf Verbandsniveau', fx: function (st) { if (L.life) L.life(st).med.dx = tick(st) + 8; return nEnd('Laktat, Muskelscans, Schlafanalyse – die Daten gehen an deinen Verein. Das Verletzungsrisiko sinkt in den nächsten Wochen.', { fit: 3, coach: 1 }); } },
            { l: 'Danke, alles gut', fx: function () { return nEnd('„Melden Sie sich jederzeit.“'); } }]; } }
      },
      sum: function (st, c, d, s) { return s.sum || (s.log.length ? s.log[s.log.length - 1].r : ''); }
    }]);
    // Zweitmeinung im Verein: in der medizinischen Abteilung, sobald man Nationalspieler ist
    if (L.BLD && L.BLD.medizin) L.BLD.medizin.acts.push({ k: 'ntdoc', n: 'Zweitmeinung beim Arzt der Nationalmannschaft', d: 'Top-Mediziner des Verbands', ap: 0, dlg: 'ntdoc', req: function (c) { var nt = c.st.pc.nt; return !!(nt && (nt.caps || nt.status === 'squad')); } });
  }
})(RFM);
