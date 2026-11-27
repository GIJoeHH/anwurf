// Managerkarriere 3.0 – Gespräche, Handlungsbögen und Vereins-Regisseur (gemeinsam für ANPFIFF und ANWURF)
// Der Regisseur beobachtet Form, Ziele, Kabine, Verletzungen, Vertrauen, Fans, Finanzen, Transfers und Länderspiele und
// löst passende Geschichten aus bzw. setzt laufende Bögen fort. Er greift nie in Spielergebnisse ein.
// Anti-Wiederholung: Abklingzeiten je Ereignis und Kategorie, Vorrang für Fortsetzungen, bewusst ruhige Wochen.
(function (R) {
  'use strict';
  var W = R.world, S = R.season, E = R.econ || R.economy, D = R.data, T = R.transfers, MX = R.mx, MN = R.mnt;
  if (!MX) return;
  var HB = MX.HB, TM = MX.TERM, clamp = MX.clamp, tick = MX.tick, hash = MX.hash, hr = MX.hr, pname = MX.pname, money = MX.money, fx = MX.fx;
  function P(st, c) { return st.players[c.pid]; }
  function lgF(st) { var c = S.userClub(st); return ({ 1: 1, 2: 0.4, 3: 0.15 }[c ? c.league : 2] || 0.2) * (D.MONEY || 1); }
  function cash(st, base) { return R.round(base * lgF(st), D.MONEY ? 100 : 1000); }
  function who(st, p, extra) { var r = st.mx.roles[p.id]; return { n: pname(p), role: p.pos + ' · ' + p.age + ' J.' + (r ? ' · ' + MX.ROLE_N[r] : '') + (extra ? ' · ' + extra : ''), ic: MX.ROLE_IC[r] || '👤' }; }
  function person(st, k) { var x = st.mx.people[k]; return x ? { n: x.name, role: x.role, ic: MX.PERSON_IC[k] || '👤' } : { n: '', role: '' }; }
  function staffWho(st, k) { var s = MX.staffP(st, k); return s ? { n: s.name, role: s.role, ic: '📋' } : { n: 'Trainerteam', role: '', ic: '📋' }; }
  function O(l, go, x) { var o = { l: l, go: go }; if (x) for (var k in x) o[k] = x[k]; return o; }
  function end(r, e, extra) { var o = { r: r, e: e || [], end: true }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function nx(r, e, next, extra) { var o = { r: r, e: e || [], next: next }; if (extra) for (var k in extra) o[k] = extra[k]; return o; }
  function cl(st) { return S.userClub(st); }
  function pos(st) { var c = cl(st); return c && st.week > 0 ? E.leaguePos(st, c) : null; }
  function tgt(st) { var b = st.manager.boardTarget; return b ? b.pos : 9; }
  function A(arr) { return arr; }
  var add = MX.addDlg;

  // ============================================================================================
  // SPIELER & KABINE
  // ============================================================================================
  add('bench_talk', function (st, c) {
    var p = P(st, c); return { title: 'Gesprächsbedarf: ' + (p ? p.last : ''), cat: 'kabine', imp: 'wichtig', img: 'kabine', max: 3, ic: '😤', who: p ? who(st, p) : null,
      nodes: {
        start: { say: '„Trainer, ich gebe im Training alles. Aber seit ' + (c.n || 4) + ' Spielen sitze ich nur draußen. Ich will wissen, woran ich bin.“', opts: [
          O('Mehr Spielzeit zusagen', function () { MX.promise(st, { k: 'mins', pid: p.id, weeks: 6, need: 3 }); return nx('„Das nehme ich ernst. Ich werde es mir merken.“', fx(st, { mor: [p.id, 8], rel: [p.id, 6] }), 'how', { img: 'b' }); }, { hint: 'Zusage: 3 Einsätze in 6 Wochen' }),
          O('Konkurrenzsituation offen erklären', function () { var q = MX.pers(p); var ok = q.conf >= 10 || q.team >= 12; return nx(ok ? '„Ehrlich gesagt hilft mir das. Ich will mich durchbeißen.“' : '„Erklärungen kenne ich. Ich brauche Minuten.“', fx(st, { mor: [p.id, ok ? 3 : -4], rel: [p.id, ok ? 5 : -3] }), 'how'); }),
          O('Positionswechsel anbieten', function () { var alt = HB ? { RUE: 'AUS', AUS: 'RUE', KRS: 'RUE' } : { MIT: 'ABW', ABW: 'MIT', STU: 'MIT' }, np = alt[p.pos]; if (np && p.alt.indexOf(np) < 0) p.alt.push(np); return nx(np ? '„' + np + '? Probieren wir es. Hauptsache spielen.“' : '„Auf meiner Position gibt es keine Alternative.“', fx(st, { mor: [p.id, np ? 4 : -1] }), 'how'); }),
          O('Eine Leihe prüfen', function () { MX.promise(st, { k: 'loan', pid: p.id, weeks: 14 }); return nx('„Eine Leihe … ja, Spielpraxis wäre gut für mich.“', fx(st, { mor: [p.id, 3], rel: [p.id, 2] }), 'how'); }, { hint: 'Zusage: Leihe bis zum Fensterende' }),
          O('Transfer ermöglichen', function () { p.listed = true; return end('„Dann suche ich mir einen neuen Verein. Danke für die Offenheit.“', fx(st, { mor: [p.id, 2], kab: -1 }), { img: 'f' }); })
        ] },
        how: { say: '„Und wie geht es jetzt konkret weiter?“', opts: [
          O('Im Training wird er weiter beobachtet', function () { return end('„Okay. Ich zeige es Ihnen.“', fx(st, { mor: [p.id, 1] })); }, { def: true }),
          O('Zeitnah ein Startelfeinsatz in Aussicht stellen', function () { MX.promise(st, { k: 'start', pid: p.id, weeks: 4 }); return end('„Das ist ein Wort.“', fx(st, { mor: [p.id, 4], rel: [p.id, 4] })); }, { hint: 'Zusage: Stammplatz 4 Wochen' }),
          O('Erst einmal die Klappe halten und arbeiten', function () { return end('„Wie Sie meinen.“ (Er verlässt den Raum ohne Gruß.)', fx(st, { mor: [p.id, -6], rel: [p.id, -8], kab: -1 }), { img: 'd' }); })
        ] }
      } };
  });
  add('pen_conflict', function (st, c) {
    var cap = st.players[c.cap], nw = st.players[c.nw], club = cl(st); return { title: 'Wer schießt die ' + TM.pen + '?', cat: 'kabine', imp: 'wichtig', img: 'kabine', max: 3, ic: '🎯', who: cap ? who(st, cap, 'bisheriger ' + TM.penS) : null,
      nodes: {
        start: { say: '„Ich habe jahrelang die ' + TM.pen + ' geschossen. Jetzt nimmt ' + (nw ? nw.last : 'der Neue') + ' einfach den Ball – und keiner sagt etwas. So geht das nicht.“', opts: [
          O('Hierarchie klären: Du bleibst Schütze', function () { club.pen = cap.id; club.penManual = true; MX.promise(st, { k: 'pen', pid: cap.id, weeks: 10 }); return nx('„Danke. Das musste geklärt werden.“', fx(st, { mor: [[cap.id, 8], [nw.id, -6]], rel: [cap.id, 6] }), 'nw'); }),
          O('Leistungsprinzip: der Treffsicherere schießt', function () { var best = (cap.attr.sho || 0) >= (nw.attr.sho || 0) ? cap : nw; club.pen = best.id; club.penManual = true; return nx(best === cap ? '„Fair. Dann zeige ich es eben.“' : '„Wenn Sie meinen … ich akzeptiere es, gefallen tut es mir nicht.“', fx(st, { mor: [best === cap ? [cap.id, 4] : [cap.id, -5]], rel: [cap.id, best === cap ? 3 : -4] }), 'nw'); }),
          O('Rolle aufwerten statt Schützenamt', function () { return nx('„Mehr Verantwortung in der Kabine … gut, das ist mir auch wichtig.“', fx(st, { mor: [cap.id, 2], rel: [cap.id, 4], kab: 1 }), 'nw'); }),
          O('Darüber diskutiere ich nicht', function () { st.mx.mem.conf.push({ id: 'cf' + tick(st) + cap.id, k: 'pen', pid: cap.id, t: tick(st), txt: 'Schützenrolle ungeklärt', done: false }); return end('„Verstanden.“ Die Stimmung ist frostig.', fx(st, { mor: [cap.id, -8], rel: [cap.id, -10], kab: -3 }), { img: 'd' }); })
        ] },
        nw: { who: nw ? who(st, nw, 'Neuzugang') : null, say: '„Ich wollte niemandem etwas wegnehmen. Ich will nur helfen.“', opts: [
          O('Erklären, dass Respekt vor der Hierarchie zählt', function () { return end('„Verstanden. Ich spreche selbst noch mit ihm.“', fx(st, { kab: 2, mor: [nw.id, 1] }), { img: 'e' }); }, { def: true }),
          O('Ihn in seiner Selbstsicherheit bestärken', function () { MX.reveal(st, nw, 'conf', 'übernimmt Verantwortung'); return end('„Danke, Trainer.“', fx(st, { mor: [nw.id, 4], kab: -1 })); })
        ] }
      } };
  });
  add('diva', function (st, c) {
    var p = P(st, c); return { title: 'Der Superstar stellt Forderungen', cat: 'kabine', imp: 'wichtig', img: 'kabine', max: 3, ic: '💎', who: who(st, p),
      nodes: {
        start: { say: '„Ich bin der Spieler, um den sich hier alles drehen sollte. Ich will eine freie Rolle und bei der Aufstellung mitreden.“', opts: [
          O('Sonderrolle gewähren', function () { MX.reveal(st, p, 'fight', 'stellt Ansprüche'); return nx('„So gefällt mir das.“ In der Kabine wird getuschelt.', fx(st, { mor: [p.id, 10], kab: -4, rel: [p.id, 6] }), 'team', { img: 'b' }); }),
          O('Die Mannschaft steht über jedem Einzelnen', function () { var q = MX.pers(p); if (q.loy <= 8) MX.pl(st, p).wish = 'wechsel'; return nx('„Dann wundern Sie sich nicht, wenn ich mir Gedanken mache.“', fx(st, { mor: [p.id, -8], kab: 3, rel: [p.id, -6] }), 'team', { img: 'd' }); }),
          O('Kompromiss: Führungsrolle mit Pflichten', function () { return nx('„Mehr Verantwortung – aber dann auch mehr Freiheit auf dem Feld. Deal.“', fx(st, { mor: [p.id, 5], kab: 1, rel: [p.id, 4] }), 'team', { img: 'e' }); }, { def: true }),
          O('Mannschaftsrat einberufen', function () { var lead = MX.squad(st).filter(function (x) { return st.mx.roles[x.id] === 'lead' || st.mx.roles[x.id] === 'kap'; }).length; return nx(lead ? 'Die Führungsspieler machen ihm klar, wo die Grenzen sind.' : 'Ohne starke Führungsspieler verläuft das Treffen im Sand.', fx(st, { kab: lead ? 3 : -1, mor: [p.id, lead ? -2 : 1] }), 'team'); })
        ] },
        team: { who: { n: 'Mannschaft', role: 'Kabine', ic: '👥' }, say: 'Die Mannschaft hat mitbekommen, worum es ging. Wie kommunizierst du die Entscheidung?', opts: [
          O('Offen in der Kabine ansprechen', function () { return end('Klare Worte – die meisten nicken.', fx(st, { kab: 2 })); }, { def: true }),
          O('Unter vier Augen belassen', function () { return end('Gerüchte machen die Runde.', fx(st, { kab: -1 })); })
        ] }
      } };
  });
  add('transfer_wish', function (st, c) {
    var p = P(st, c), ag = MX.agentOf(st, p); return { title: 'Wechselwunsch: ' + p.last, cat: 'transfer', imp: 'wichtig', img: 'vertrag', max: 3, ic: '✈️', who: who(st, p),
      nodes: {
        start: { say: '„' + (c.why || 'Ich glaube, ich brauche eine neue Herausforderung.') + ' Ich möchte wechseln.“', opts: [
          O('Ablehnen – Vertrag ist Vertrag', function () { return nx('„Dann spiele ich eben weiter. Aber glücklich bin ich nicht.“', fx(st, { mor: [p.id, -10], rel: [p.id, -6], kab: -1 }), 'agent', { img: 'd' }); }),
          O('Auf die Transferliste setzen', function () { p.listed = true; return end('„Danke, dass Sie mir keine Steine in den Weg legen.“', fx(st, { mor: [p.id, 5], rel: [p.id, 3] }), { img: 'f' }); }),
          O('Perspektive aufzeigen (Stammplatz)', function () { MX.promise(st, { k: 'start', pid: p.id, weeks: 8 }); return nx('„Wenn das wirklich so kommt … dann bleibe ich.“', fx(st, { mor: [p.id, 6], rel: [p.id, 5] }), 'agent'); }, { hint: 'Zusage: Stammplatz 8 Wochen', def: true }),
          O('Gehaltserhöhung anbieten', function () { var add = R.round(p.wage * 0.15, 1000); p.wage += add; p.contract = Math.max(p.contract, 2); return nx('„Das ist ein Zeichen der Wertschätzung.“', fx(st, { mor: [p.id, 8], rel: [p.id, 4], kab: -1 }).concat([{ t: 'Gehalt +' + money(add) + '/Saison', neg: true }]), 'agent', { img: 'e' }); })
        ] },
        agent: { who: { n: ag.name, role: 'Berater (' + MX.ATYPES[ag.type] + ')', ic: '🕴️' }, say: '„Wir sollten im Gespräch bleiben. Mein Klient hat Optionen.“', opts: [
          O('Gesprächsbereitschaft signalisieren', function () { return end('„Gut. Ich melde mich.“', fx(st, { agent: [ag.id, 4] })); }, { def: true }),
          O('Grenzen klar aufzeigen', function () { return end('„Das wird meinem Klienten nicht gefallen.“', fx(st, { agent: [ag.id, -6] })); })
        ] }
      } };
  });
  add('captain_unrest', function (st, c) {
    var p = P(st, c), club = cl(st); return { title: 'Unruhe um den Kapitän', cat: 'kabine', imp: 'krise', img: 'kabine', max: 3, ic: '©️', who: who(st, p),
      nodes: {
        start: { say: 'Der Kapitän ist unzufrieden – und mehrere Spieler stehen hinter ihm. „So, wie es gerade läuft, kann es nicht weitergehen.“', opts: [
          O('Einzelgespräch suchen', function () { return nx('„Endlich hört mir jemand zu.“', fx(st, { mor: [p.id, 6], rel: [p.id, 8], kab: 2 }), 'next'); }, { def: true }),
          O('Kapitänsamt entziehen', function () { var alt = MX.squad(st).filter(function (x) { return x.id !== p.id; }).sort(function (a, b) { return (MX.pers(b).lead + b.age / 3) - (MX.pers(a).lead + a.age / 3); })[0]; if (alt) { club.captain = alt.id; club.captainManual = true; } return end((alt ? alt.last + ' trägt jetzt die Binde. ' : '') + p.last + ' ist bedient – einige Mitspieler auch.', fx(st, { mor: [p.id, -15], rel: [p.id, -15], kab: -4 }), { img: 'd' }); }),
          O('Mannschaftsrat einberufen', function () { return nx('Im Mannschaftsrat werden Probleme offen angesprochen.', fx(st, { kab: 3, mor: [p.id, 2] }), 'next', { img: 'e' }); }),
          O('Öffentlich den Rücken stärken', function () { MX.say(st, 'press_backs_captain', 'Unser Kapitän hat mein volles Vertrauen.', p.last); return nx('Die Presse greift das Signal auf.', fx(st, { mor: [p.id, 5], media: 2 }), 'next'); })
        ] },
        next: { say: 'Was soll konkret passieren?', opts: [
          O('Trainingsinhalte gemeinsam anpassen', function () { return end('Die Spieler fühlen sich gehört.', fx(st, { kab: 3, team: 2 })); }, { def: true }),
          O('An der eigenen Linie festhalten', function () { return end('Du bleibst bei deiner Linie. Der Ton wird rauer.', fx(st, { kab: -2, rel: [p.id, -4] })); })
        ] }
      } };
  });
  add('leader_mediates', function (st, c) {
    var p = P(st, c), cf = st.mx.mem.conf.filter(function (x) { return !x.done; })[0]; return { title: p.last + ' schlichtet', cat: 'kabine', imp: 'normal', img: 'kabine', max: 2, ic: '🧭', who: who(st, p),
      nodes: { start: { say: '„Ich habe mit den Jungs gesprochen. Der Streit ' + (cf ? '(' + cf.txt + ') ' : '') + 'ist ausgeräumt – wenn Sie das unterstützen.“', opts: [
        O('Danken und Verantwortung übertragen', function () { if (cf) cf.done = true; MX.reveal(st, p, 'lead', 'schlichtet Konflikte'); return end('Die Kabine rückt zusammen.', fx(st, { kab: 4, rel: [p.id, 6], mor: [p.id, 4] }), { img: 'e' }); }, { def: true }),
        O('Lieber selbst moderieren', function () { if (cf) cf.done = true; return end('Du übernimmst – das kostet Zeit, wirkt aber.', fx(st, { kab: 2, stress: 3 })); })
      ] } } };
  });
  add('mentor', function (st, c) {
    var m = st.players[c.mid], y = st.players[c.yid]; return { title: 'Ein Mentor für ' + y.last, cat: 'nachwuchs', imp: 'normal', img: 'talent', max: 2, ic: '🎓', who: who(st, m),
      nodes: { start: { say: '„Der Kleine (' + y.last + ') hat was. Ich würde mich gern um ihn kümmern – Extraschichten, Videoanalyse, das volle Programm.“', opts: [
        O('Sehr gerne – offiziell als Mentor', function () { st.mx.mentor = { m: m.id, y: y.id, until: tick(st) + 16 }; return end('Die beiden sieht man jetzt oft gemeinsam auf dem Platz.', fx(st, { mor: [[m.id, 5], [y.id, 6]], kab: 1 }), { img: 'e' }); }, { def: true }),
        O('Er soll sich auf sich selbst konzentrieren', function () { return end('„Wie Sie meinen.“', fx(st, { mor: [m.id, -3] })); })
      ] } } };
  });
  add('disappointing_signing', function (st, c) {
    var p = P(st, c); return { title: 'Teurer Neuzugang in der Kritik', cat: 'transfer', imp: 'normal', img: 'presse', max: 2, ic: '📉', who: who(st, p, 'kam für ' + money(c.fee)),
      nodes: { start: { say: 'Fans und Medien sprechen von einem Fehleinkauf. ' + p.last + ' wirkt verunsichert.', opts: [
        O('Öffentlich Rückendeckung geben', function () { MX.say(st, 'press_backs_' + p.id, 'Er braucht Zeit, ich vertraue ihm.', p.last); return end('„Danke, Trainer.“ Die Kritiker bleiben skeptisch.', fx(st, { mor: [p.id, 8], rel: [p.id, 6], media: -1 })); }, { def: true }),
        O('Leistung einfordern – auch öffentlich', function () { return end('Klare Ansage. ' + p.last + ' wirkt getroffen.', fx(st, { mor: [p.id, -6], fans: 1, media: 1 })); }),
        O('Zur Not im nächsten Fenster wieder abgeben', function () { p.listed = true; return end('Er steht auf der Transferliste – der Verlust wäre hoch.', fx(st, { mor: [p.id, -10], kab: -1 })); })
      ] } } };
  });

  // ============================================================================================
  // NACHWUCHS
  // ============================================================================================
  add('youth_pro', function (st, c) {
    var p = P(st, c), ag = MX.agentOf(st, p); return { title: 'Talent fordert Profivertrag', cat: 'nachwuchs', imp: 'wichtig', img: 'talent', max: 2, ic: '🌱', who: who(st, p, 'Nachwuchs'),
      nodes: { start: { say: '„Ich will Profi werden – hier. Aber ' + ag.name + ' sagt, andere Vereine hätten schon angefragt.“', opts: [
        O('Profivertrag anbieten', function () { var w = T.youthProWage ? T.youthProWage(p) : R.round(p.wage * 1.5, 1000); if (T.youthPro) T.youthPro(st, p, 3, w); else { p.youth = false; p.contract = 3; p.wage = w; } return end('Unterschrift! ' + p.last + ' gehört jetzt zum Profikader.', fx(st, { mor: [p.id, 12], fans: { long: 2 } }), { img: 'e' }); }, { def: true }),
        O('Um Geduld bitten – Förderung zusagen', function () { MX.promise(st, { k: 'youth', pid: p.id, weeks: 24, need: 3 }); return end('„Ein Jahr noch. Aber dann will ich spielen.“', fx(st, { mor: [p.id, 2], rel: [p.id, 3] })); }, { hint: 'Zusage: Profieinsätze bis Saisonende' }),
        O('Er soll sich erst beweisen', function () { var q = MX.pers(p); if (q.loy < 10) MX.pl(st, p).wish = 'wechsel'; return end('„Dann schaue ich mich um.“', fx(st, { mor: [p.id, -8], rel: [p.id, -6] }), { img: 'f' }); })
      ] } } };
  });
  add('youth_discover', function (st, c) {
    var club = cl(st), s = MX.staffP(st, 'jugend'); return { title: 'Überraschendes Talent entdeckt', cat: 'nachwuchs', imp: 'normal', img: 'talent', max: 2, ic: '🔎', who: staffWho(st, 'jugend'),
      nodes: { start: { say: '„Wir haben bei einem Sichtungsturnier einen Rohdiamanten gesehen. ' + (c.age || 15) + ' Jahre, unglaubliche Spielintelligenz. Sollen wir ihn holen?“', opts: [
        O('Sofort ins Leistungszentrum holen', function () { var y = W.genYouth(st, club, (E.level(club, 'jugend').q || 1) + 1); y.pot = Math.min(95, y.pot + 8); y.age = Math.min(y.age, 16); MX.event(st, 'talent', { pid: y.id }); return end(pname(y) + ' (' + y.age + ', ' + y.pos + ', Potenzial ' + y.pot + ') ist jetzt im Nachwuchs.', fx(st, { staff: ['jugend', 4], cash: [-cash(st, 15000), 'Jugend'] }), { img: 'e' }); }, { def: true }),
        O('Erst weiter beobachten', function () { return end('„In Ordnung – hoffentlich schnappt ihn niemand weg.“', fx(st, { staff: ['jugend', -2] })); })
      ] } } };
  });
  add('youth_discipline', function (st, c) {
    var p = P(st, c); return { title: 'Disziplinprobleme', cat: 'nachwuchs', imp: 'normal', img: 'kabine', max: 2, ic: '⏰', who: staffWho(st, 'jugend'),
      nodes: { start: { say: '„' + p.last + ' kommt ständig zu spät und hat die Teamregeln verletzt. Wie reagieren wir?“', opts: [
        O('Geldstrafe und klares Gespräch', function () { MX.reveal(st, p, 'dis', 'Regelverstöße'); return end('Er hat verstanden – vorerst.', fx(st, { mor: [p.id, -4], kab: 1 })); }, { def: true }),
        O('Suspendieren (ein Spiel)', function () { p.susp = Math.max(p.susp, 1); return end('Ein deutliches Signal an alle.', fx(st, { mor: [p.id, -8], kab: 2 })); }),
        O('Einen erfahrenen Spieler als Paten einsetzen', function () { var m = MX.squad(st).filter(function (x) { return x.age >= 29 && MX.pers(x).team >= 12; })[0]; if (m) st.mx.mentor = { m: m.id, y: p.id, until: tick(st) + 12 }; return end(m ? m.last + ' kümmert sich um ihn.' : 'Leider findet sich niemand.', fx(st, { mor: [p.id, 2] })); })
      ] } } };
  });
  add('youth_breakthrough', function (st, c) {
    var p = P(st, c); return { title: 'Der Durchbruch: ' + p.last, cat: 'nachwuchs', imp: 'highlight', img: 'talent', max: 2, ic: '🚀', who: who(st, p),
      nodes: { start: { say: p.first + ' ' + p.last + ' (' + p.age + ') hat sich in die Mannschaft gespielt: ' + p.stats.apps + ' Einsätze, Note ' + (p.stats.apps ? (p.stats.rsum / p.stats.apps).toFixed(1) : '–') + '. Die Medien überschlagen sich.', opts: [
        O('Öffentlich loben', function () { return end('„Er ist ein Produkt unserer Arbeit.“ Die Fans sind stolz.', fx(st, { mor: [p.id, 8], fans: { long: 4, clubs: 2 }, media: 3 }), { img: 'e' }); }),
        O('Ball flach halten', function () { return end('„Er steht am Anfang.“ Ein kluger Schachzug, finden viele.', fx(st, { mor: [p.id, 3], rel: [p.id, 4] })); }, { def: true }),
        O('Vertrag langfristig verlängern', function () { var add = R.round(W.fairWage(p) * 0.4, 1000); p.wage = Math.max(p.wage, add + p.wage * 0.6); p.contract = Math.max(p.contract, 4); return end('Langfristig gebunden! Die Fans feiern.', fx(st, { mor: [p.id, 10], fans: { long: 5 } }), { img: 'e' }); })
      ] } } };
  });
  add('youth_leave', function (st, c) {
    var p = P(st, c); return { title: p.last + ' denkt an Abschied', cat: 'nachwuchs', imp: 'normal', img: 'talent', max: 2, ic: '🚪', who: who(st, p),
      nodes: { start: { say: '„Ich bin im Verein groß geworden. Aber ich bekomme keine Chance. Vielleicht ist es Zeit zu gehen.“', opts: [
        O('Zusage: Einsätze in den nächsten Wochen', function () { MX.promise(st, { k: 'mins', pid: p.id, weeks: 8, need: 3 }); return end('„Dann gebe ich noch einmal alles.“', fx(st, { mor: [p.id, 6] })); }, { def: true }),
        O('Leihe zu einem kleineren Verein', function () { MX.promise(st, { k: 'loan', pid: p.id, weeks: 14 }); return end('„Spielpraxis – ja, das wäre gut.“', fx(st, { mor: [p.id, 3] })); }),
        O('Wechsel erlauben', function () { p.listed = true; return end('Ein Eigengewächs auf der Transferliste – die Langjährigen murren.', fx(st, { fans: { long: -3 } })); })
      ] } } };
  });
  add('youth_return', function (st, c) {
    var p = P(st, c), club = cl(st); return { title: 'Rückkehr eines Eigengewächses?', cat: 'transfer', imp: 'normal', img: 'vertrag', max: 2, ic: '🔁', who: who(st, p, 'vereinslos'),
      nodes: { start: { say: '„Ich habe hier das Fußballspielen gelernt. Wenn Sie mich wollen, komme ich zurück.“', opts: [
        O('Zurückholen (ablösefrei)', function () { if (!T.windowOpen(st)) return end('Das Transferfenster ist geschlossen – im nächsten Fenster gerne.', []); var w = Math.max(W.fairWage(p) * 0.85, 10000); T.executeTransfer(st, p, club, 0, R.round(w, 1000), 2); p.homeClub = club.id; return end('Er ist zurück! Die Langjährigen sind begeistert.', fx(st, { fans: { long: 5, active: 2 } }), { img: 'e' }); }, { def: true }),
        O('Kein Bedarf', function () { return end('Er wünscht dem Verein trotzdem alles Gute.', []); })
      ] } } };
  });

  // ============================================================================================
  // VERTRÄGE, BERATER, TRANSFERS (Bildzustände: a Beginn, b Angebot, c Gegenangebot, d Konflikt, e Einigung, f Abbruch)
  // ============================================================================================
  add('contract_talk', function (st, c) {
    var p = P(st, c), ag = MX.agentOf(st, p), fair = W.fairWage(p), ask = R.round(Math.max(p.wage * (1.15 + (ag.type === 'hart' ? 0.15 : ag.type === 'top' ? 0.2 : 0)), fair * (ag.type === 'prov' ? 1.15 : 1.05)), 1000);
    c.ask = c.ask || ask;
    function cnt() { if (!c.off) c.off = R.round((p.wage + c.ask) / 2, 1000); return R.round((c.off + c.ask) / 2 + (ag.type === 'hart' ? R.round(c.ask * 0.03, 1000) : 0), 1000); }
    function sign(w, yrs, msg) { var old = p.wage; if (!isFinite(w) || w <= 0) w = c.ask; p.wage = R.round(w, 1000); p.contract = Math.max(p.contract, yrs); ag.deals++; return end(msg + ' Neues Gehalt ' + money(p.wage) + ' (vorher ' + money(old) + '), Vertrag bis ' + (st.season + p.contract) + '.', fx(st, { mor: [p.id, 8], rel: [p.id, 5], agent: [ag.id, 5] }), { img: 'e' }); }
    return { title: 'Vertragsgespräch: ' + p.last, cat: 'vertrag', imp: 'wichtig', img: 'vertrag', max: 4, ic: '✍️', who: { n: ag.name, role: 'Berater von ' + p.last + ' (' + MX.ATYPES[ag.type] + ')', ic: '🕴️' },
      nodes: {
        start: { img: 'a', say: '„' + (c.why || 'Mein Klient hat sich glänzend entwickelt.') + ' Wir erwarten ' + money(c.ask) + ' pro Saison und vier Jahre Laufzeit.“', opts: [
          O('Forderung annehmen', function () { return sign(c.ask, 4, 'Einigung ohne Feilschen.'); }, { hint: money(c.ask) }),
          O('Eigenes Angebot machen (' + money(R.round((p.wage + c.ask) / 2, 1000)) + ')', function () { c.off = R.round((p.wage + c.ask) / 2, 1000); return nx('„Das ist ein Anfang …“', [], 'counter', { img: 'b' }); }, { def: true }),
          O('Zunächst ablehnen', function () { return nx('„Dann haben wir ein Problem.“', fx(st, { agent: [ag.id, -5] }), 'conflict', { img: 'd' }); })
        ] },
        counter: { img: 'c', say: function () { return '„Wir kommen Ihnen entgegen: ' + money(cnt()) + ', drei Jahre. Das ist unser letztes Wort.“'; }, opts: [
          O('Einschlagen', function () { return sign(cnt(), 3, 'Handschlag – Einigung.'); }, { def: true }),
          O('Bei meinem Angebot bleiben', function () { var acc = ag.type === 'lang' || MX.pers(p).loy >= 13 || hr('ct' + p.id + tick(st), 1) < 0.35; return acc ? sign(c.off, 3, '„Mein Klient will bleiben – akzeptiert.“') : nx('„Dann reden wir nicht weiter.“', fx(st, { agent: [ag.id, -6] }), 'conflict', { img: 'd' }); }),
          O('Leistungsbezogene Prämien statt Fixgehalt', function () { p.bonus = (p.bonus || 0) + R.round(c.ask * 0.1, 1000); return sign(c.off, 3, 'Kompromiss mit Prämienmodell.'); })
        ] },
        conflict: { img: 'd', say: '„Andere Vereine stehen Schlange. Wenn hier nichts passiert, verlängert mein Klient nicht.“', opts: [
          O('Doch noch nachgeben', function () { return sign(c.ask * 1.03, 3, 'Teuer erkauft, aber unterschrieben.'); }),
          O('Gespräche abbrechen', function () { MX.pl(st, p).wish = MX.pers(p).loy < 12 ? 'wechsel' : null; st.mx.mem.conf.push({ id: 'cf' + tick(st) + p.id, k: 'contract', pid: p.id, t: tick(st), txt: 'Vertragspoker gescheitert', done: false }); MX.event(st, 'contract_fail', { pid: p.id }); return end('Abbruch. Die Fronten sind verhärtet.', fx(st, { mor: [p.id, -10], rel: [p.id, -8], agent: [ag.id, -10] }), { img: 'f' }); }, { def: true }),
          O('Direkt mit dem Spieler sprechen', function () { var q = MX.pers(p); return q.loy >= 11 ? sign(R.round((p.wage + c.ask) / 2, 1000), 3, p.last + ': „Ich will bleiben.“') : end('„Das regelt mein Berater.“ Abbruch.', fx(st, { rel: [p.id, -4], agent: [ag.id, -8] }), { img: 'f' }); })
        ] }
      } };
  });
  add('poach', function (st, c) {
    var p = P(st, c), rc = st.clubs[c.cid]; return { title: rc.short + ' wirbt um ' + p.last, cat: 'transfer', imp: 'normal', img: 'vertrag', max: 2, ic: '🧲', who: who(st, p),
      nodes: { start: { say: 'Laut Medienberichten hat ' + rc.name + ' hinter deinem Rücken Kontakt zu ' + p.last + ' aufgenommen. Wie reagierst du?', opts: [
        O('Beschwerde beim Verein einlegen', function () { return end(rc.short + ' dementiert halbherzig. Das Verhältnis ist angespannt.', fx(st, { crel: [rc.id, -10], media: 1 })); }),
        O('Spieler mit Vertragsverlängerung binden', function () { MX.start(st, 'contract_talk', { pid: p.id, why: 'Es gibt konkretes Interesse anderer Vereine.' }, { prio: 1 }); return end('Ein Vertragsgespräch wird angesetzt.', fx(st, { rel: [p.id, 3] })); }, { def: true }),
        O('Gelassen bleiben', function () { return end('„Wer gut ist, ist begehrt.“ Die Fans hätten sich mehr Kampf gewünscht.', fx(st, { fans: { long: -1 } })); })
      ] } } };
  });
  add('offer_star', function (st, c) {
    var p = P(st, c), rc = st.clubs[c.cid]; return { title: 'Spitzenverein will ' + p.last, cat: 'transfer', imp: 'wichtig', img: 'vertrag', max: 2, ic: '💰', who: who(st, p),
      nodes: { start: { say: rc.name + ' bietet ' + money(c.amount) + ' für ' + p.last + '. Der Spieler ist geschmeichelt. Die Fans erwarten, dass der Verein sein Talent hält.', opts: [
        O('Angebot prüfen (liegt im Posteingang)', function () { return end('Das Angebot liegt in der Zentrale – du entscheidest dort.', fx(st, { mor: [p.id, 3] })); }, { def: true }),
        O('Öffentlich: „Unverkäuflich“', function () { MX.say(st, 'unverkaeuflich_' + p.id, p.last + ' ist unverkäuflich.', p.last); st.inbox = st.inbox.filter(function (o) { return !(o.type === 'offer' && o.pid === p.id); }); return end('Klare Kante – die Fans jubeln. ' + p.last + ' ist hin- und hergerissen.', fx(st, { fans: 4, mor: [p.id, MX.pers(p).loy >= 12 ? 3 : -6] })); }),
        O('Gespräch mit dem Spieler suchen', function () { var q = MX.pers(p); return end(q.goal === 'ausland' || q.amb >= 15 ? '„Das ist mein Traumverein …“' : '„Ich fühle mich hier wohl.“', fx(st, { rel: [p.id, 4] })); })
      ] } } };
  });
  add('agent_offer', function (st, c) {
    var p = P(st, c), ag = st.mx.agents.filter(function (a) { return a.id === c.aid; })[0] || st.mx.agents[0], club = cl(st), w = R.round(W.fairWage(p) * (ag.type === 'prov' ? 1.1 : 0.95), 1000); return { title: 'Berater bietet Spieler an', cat: 'transfer', imp: 'normal', img: 'vertrag', max: 2, ic: '🕴️', who: { n: ag.name, role: 'Berater (' + MX.ATYPES[ag.type] + ')', ic: '🕴️' },
      nodes: { start: { say: '„Ich habe da jemanden für Sie: ' + pname(p) + ', ' + p.age + ', ' + p.pos + ', Stärke ' + p.ovr + ', vereinslos. ' + money(w) + ' Gehalt – und meine Provision.“', opts: [
        O('Verpflichten (' + money(w) + ', 2 Jahre)', function () { if (!T.windowOpen(st)) return end('Das Transferfenster ist geschlossen.', []); var fee = R.round(w * (ag.type === 'prov' ? 0.5 : 0.25), 1000); var e = fx(st, { cash: [-fee, 'Beraterhonorare'], agent: [ag.id, 6] }); T.executeTransfer(st, p, club, 0, w, 2); return end(pname(p) + ' unterschreibt.', e, { img: 'e' }); }, { req: function () { return T.canSell ? W.squad(st, club.id).length < 34 : true; } }),
        O('Kein Interesse', function () { return end('„Schade. Ich habe noch andere Kontakte.“', fx(st, { agent: [ag.id, -2] })); }, { def: true })
      ] } } };
  });

  // ============================================================================================
  // NATIONALMANNSCHAFT
  // ============================================================================================
  add('nt_return_talk', function (st, c) {
    var p = P(st, c), s = c.st0, nat = MN ? MN.natName(c.code) : ''; var say = { gefeiert: '„Was für Tage! Ich fühle mich gerade unschlagbar.“', enttäuscht: '„Das tut weh. Ich brauche ein paar Tage, um das zu verdauen.“', erschöpft: '„Ehrlich gesagt bin ich platt. Die Reise, die Spiele …“', verletzt: '„Es zwickt. Die Ärzte beim Verband haben mich trotzdem spielen lassen.“', frustriert: '„Ich saß nur draußen. Ich weiß nicht, was der Nationaltrainer von mir will.“', normal: '„Gute Reise, alles in Ordnung.“' }[s] || '„Alles gut.“';
    return { title: 'Zurück von der Nationalmannschaft', cat: 'nati', imp: 'normal', img: s === 'verletzt' ? 'ntverletzt' : s === 'gefeiert' ? 'ntjubel' : 'rueckkehr', max: 2, ic: '🏳️', who: who(st, p, nat),
      nodes: { start: { say: say, opts: [
        O('Anerkennung zeigen', function () { return end('„Danke, Trainer.“', fx(st, { mor: [p.id, s === 'gefeiert' ? 3 : 5], rel: [p.id, 4] })); }, { def: true }),
        O('Konzentration auf den Verein einfordern', function () { return end(s === 'gefeiert' ? '„Klar, Boden behalten.“' : '„Verstanden.“', fx(st, { mor: [p.id, s === 'gefeiert' ? 0 : -3], kab: 1 })); }),
        O('Mehr Verantwortung im Verein anbieten', function () { return end('„Das motiviert mich.“', fx(st, { mor: [p.id, 6], rel: [p.id, 5] })); }, { req: function () { return s === 'frustriert' || s === 'enttäuscht'; } })
      ] } } };
  });
  add('nt_first_call', function (st, c) {
    var p = P(st, c); return { title: 'Erstmals Nationalspieler: ' + p.last, cat: 'nati', imp: 'highlight', img: 'nominierung', max: 2, ic: '📨', who: who(st, p),
      nodes: { start: { say: '„Ich wurde nominiert! Für ' + (MN ? MN.natName(c.code) : 'mein Land') + '! Ich kann es kaum glauben.“', opts: [
        O('Herzlich gratulieren', function () { return end('Ein besonderer Moment – die ganze Kabine gratuliert.', fx(st, { mor: [p.id, 10], kab: 2, rel: [p.id, 5] }), { img: 'b' }); }, { def: true }),
        O('Gratulieren und an Bodenhaftung erinnern', function () { return end('„Keine Sorge, ich bleibe derselbe.“', fx(st, { mor: [p.id, 6], rel: [p.id, 3] })); }),
        O('Belastung ansprechen', function () { MX.promise(st, { k: 'nati', pid: p.id, weeks: 20 }); return end('Ihr vereinbart, die Belastung gemeinsam im Blick zu behalten.', fx(st, { mor: [p.id, 5], rel: [p.id, 6] })); }, { hint: 'Zusage: Unterstützung beim Nationalmannschaftsziel' })
      ] } } };
  });
  add('nt_injury_conflict', function (st, c) {
    var p = P(st, c), code = (MN && MN.P(st, p.id).code) || '', s = MX.staffP(st, 'arzt'); return { title: 'Verletzt von der Länderspielreise', cat: 'nati', imp: 'wichtig', img: 'ntverletzt', max: 3, ic: '🩹', who: staffWho(st, 'arzt'),
      nodes: {
        start: { say: '„' + p.last + ' ist mit einer Verletzung zurückgekommen: ' + (p.inj ? p.inj.type + ', ' + p.inj.weeks + ' Woche(n)' : 'Beschwerden') + '. Nach unseren Daten war die Belastung beim Verband zu hoch.“', opts: [
          O('Medizinische Daten beim Verband anfordern', function () { return nx('Die Daten kommen schleppend. Der Verband verweist auf die eigenen Ärzte.', [], 'fed'); }, { def: true }),
          O('Öffentlich Kritik am Verband üben', function () { if (MN) st.mnt.coachRel[code] = clamp((st.mnt.coachRel[code] == null ? 50 : st.mnt.coachRel[code]) - 12, 0, 100); return nx('Die Schlagzeile sitzt. Der Verband reagiert gereizt.', fx(st, { fans: 2, media: -1 }), 'fed', { img: 'b' }); }),
          O('Intern klären, Ersatz aus dem Nachwuchs fördern', function () { var y = MX.squad(st).concat(W.youthOf ? W.youthOf(st, cl(st).id) : []).filter(function (x) { return x.age <= 21 && x.pos === p.pos; }).sort(function (a, b) { return b.pot - a.pot; })[0]; if (y) { MX.event(st, 'chance', { pid: y.id, for: p.id }); y.morale = clamp(y.morale + 6, 0, 100); } return end(y ? pname(y) + ' bekommt seine Chance.' : 'Kein Talent auf dieser Position – der Kader wird improvisieren müssen.', fx(st, { kab: 1 })); })
        ] },
        fed: { who: { n: MN ? MN.coach(st, code).name : 'Nationaltrainer', role: 'Nationaltrainer ' + (MN ? MN.natName(code) : ''), ic: '🏳️' }, say: '„Wir haben jederzeit verantwortungsvoll gehandelt. Aber reden wir über die Zukunft.“', opts: [
          O('Gemeinsame Belastungssteuerung vereinbaren', function () { if (MN) { MN.P(st, p.id).care = st.season; st.mnt.coachRel[code] = clamp((st.mnt.coachRel[code] == null ? 50 : st.mnt.coachRel[code]) + 6, 0, 100); } return end('Abmachung: ' + p.last + ' wird dosierter eingesetzt.', fx(st, { rel: [p.id, 4] }), { img: 'e' }); }, { def: true }),
          O('Auf Abstellungsregeln pochen', function () { return end('Formell korrekt – das Verhältnis bleibt kühl.', []); })
        ] }
      } };
  });
  add('nt_hero', function (st, c) {
    var p = P(st, c), ag = MX.agentOf(st, p); return { title: 'Der gefeierte Nationalspieler', cat: 'nati', imp: 'wichtig', img: 'ntjubel', max: 2, ic: '🌟', who: who(st, p),
      nodes: { start: { say: p.last + ' kehrt als gefeierter Held zurück. Selbstvertrauen auf dem Höhepunkt – die ersten Vereine fragen an, ' + ag.name + ' ruft bereits an.', opts: [
        O('Vertragsgespräch vorziehen', function () { MX.start(st, 'contract_talk', { pid: p.id, why: 'Nach den Länderspielen ist mein Klient international gefragt.' }, { prio: 1 }); return end('Das Gespräch mit dem Berater steht an.', fx(st, { rel: [p.id, 4] })); }, { req: function () { return p.contract <= 2; } }),
        O('Ruhe bewahren, Fokus Verein', function () { return end('„Klar, Trainer.“ Der Berater ist weniger begeistert.', fx(st, { agent: [ag.id, -3], mor: [p.id, 2] })); }, { def: true }),
        O('Öffentlich feiern', function () { return end('Ein Fest für die Fans – und ein Schaufenster für Interessenten.', fx(st, { fans: 3, media: 2, mor: [p.id, 4] })); })
      ] } } };
  });
  add('nt_bench', function (st, c) {
    var p = P(st, c); return { title: 'Frust nach der Länderspielreise', cat: 'nati', imp: 'normal', img: 'rueckkehr', max: 2, ic: '🪑', who: who(st, p),
      nodes: { start: { say: '„Wieder nur auf der Bank. Beim Verband vertraut man mir nicht. Ich brauche hier mehr Spielpraxis, um mich aufzudrängen.“', opts: [
        O('Mehr Einsätze zusagen', function () { MX.promise(st, { k: 'mins', pid: p.id, weeks: 6, need: 4 }); return end('„Das hilft mir enorm.“', fx(st, { mor: [p.id, 6], rel: [p.id, 5] })); }, { hint: 'Zusage: 4 Einsätze in 6 Wochen' }),
        O('Über die Rolle im Verein sprechen', function () { return end('„Okay, ich konzentriere mich auf den Verein.“', fx(st, { mor: [p.id, 2] })); }, { def: true }),
        O('Kontakt zum Nationaltrainer suchen', function () { var code = MN ? MN.P(st, p.id).code : ''; if (MN) st.mnt.coachRel[code] = clamp((st.mnt.coachRel[code] == null ? 50 : st.mnt.coachRel[code]) + 2, 0, 100); return end('Der Nationaltrainer verspricht, ' + p.last + ' genauer zu beobachten.', fx(st, { mor: [p.id, 3] })); })
      ] } } };
  });
  add('nt_coach_change', function (st, c) {
    var p = P(st, c); return { title: 'Neuer Nationaltrainer – Platz verloren', cat: 'nati', imp: 'normal', img: 'rueckkehr', max: 2, ic: '🔄', who: who(st, p),
      nodes: { start: { say: '„Unter ' + c.neu + ' bin ich nicht mehr dabei. Er setzt auf andere Typen. Ich will mehr Spielpraxis und mich neu empfehlen.“', opts: [
        O('Stammplatz-Perspektive geben', function () { MX.promise(st, { k: 'start', pid: p.id, weeks: 8 }); return end('„Dann zeige ich es ihm.“', fx(st, { mor: [p.id, 5], rel: [p.id, 4] })); }),
        O('Trösten und Geduld empfehlen', function () { return end('„Ja … wahrscheinlich haben Sie recht.“', fx(st, { mor: [p.id, 2] })); }, { def: true })
      ] } } };
  });
  add('nt_job_offer', function (st, c) {
    return { title: 'Angebot: Nationaltrainer ' + MN.natName(c.code), cat: 'karriere', imp: 'highlight', img: 'nominierung', max: 2, ic: '🌍', who: { n: 'Verbandspräsidium', role: MN.natName(c.code), ic: '🏛️' },
      nodes: {
        start: { say: '„Ihre Arbeit hat uns beeindruckt. Wir möchten Ihnen die Nationalmannschaft anvertrauen – zusätzlich zu Ihrem Verein, wenn Ihr Präsident zustimmt.“', opts: [
          O('Annehmen (Doppelrolle)', function () { MN.takeJob(st, c.code); return nx('Der Präsident deines Vereins ist skeptisch: „Terminüberschneidungen dürfen nicht zu unseren Lasten gehen.“', fx(st, { mrep: 4, pres: -6, board: -3 }), 'club'); }),
          O('Ablehnen – voller Fokus auf den Verein', function () { return end('Der Präsident ist erleichtert.', fx(st, { pres: 5, board: 2 })); }, { def: true })
        ] },
        club: { who: person(st, 'pres'), say: '„Wie wollen Sie beides unter einen Hut bekommen?“', opts: [
          O('Co-Trainer übernimmt bei Turnieren', function () { return end('„Gut. Wir beobachten das genau.“', fx(st, { staff: ['co', 5] })); }, { def: true }),
          O('Die Doppelrolle stärkt auch den Verein', function () { return end('„Wir werden sehen.“', fx(st, { pres: -2, media: 2 })); })
        ] }
      } };
  });

  // ============================================================================================
  // TRAINERSTAB
  // ============================================================================================
  add('staff_offer', function (st, c) {
    var s = MX.staffP(st, c.k), club = cl(st), cs = club.staff && club.staff[c.k]; if (!s) return null; return { title: s.name + ' hat ein Angebot', cat: 'stab', imp: 'wichtig', img: 'staff', max: 2, ic: '📋', who: { n: s.name, role: s.role, ic: '📋' },
      nodes: { start: { say: '„' + (c.rc || 'Ein anderer Verein') + ' will mich als Cheftrainer. Das reizt mich. Was meinen Sie?“', opts: [
        O('Ziehen lassen', function () { if (cs) delete club.staff[c.k]; st.mx.hist.staff.push({ s: st.season, n: s.name, role: s.role, to: c.rc }); return end(s.name + ' verabschiedet sich mit Dank. Die Stelle ist frei.', fx(st, { kab: -1 }), { img: 'f' }); }),
        O('Über eine Vertragsverlängerung sprechen', function () { if (cs) { cs.wage = R.round(cs.wage * 1.3, 1000); } s.loy = Math.min(20, s.loy + 3); s.yrs = 3; return end('Er bleibt – für 30 % mehr Gehalt.', fx(st, { staff: [c.k, 8] }).concat([{ t: 'Personalkosten +30 %', neg: true }]), { img: 'e' }); }, { def: true }),
        O('Kompetenzen erweitern', function () { s.extra = 1; if (cs && cs.lvl < 3) { cs.lvl++; cs.wage = E.staffWageFor(club, cs.lvl); } s.v = clamp(s.v + 10, 0, 100); return end('Mehr Verantwortung: ' + s.name + ' steigt auf und bleibt.', fx(st, { staff: [c.k, 6] }), { img: 'e' }); }),
        O('Nachfolgelösung vorbereiten', function () { st.mx.succ = { k: c.k, t: tick(st) }; return end('Du lässt ihn gehen, sobald ein Nachfolger bereitsteht – der Übergang verläuft reibungslos.', fx(st, { staff: [c.k, 2] })); })
      ] } } };
  });
  add('staff_advice', function (st, c) {
    var club = cl(st), topic = c.topic, s = MX.staffP(st, c.k) || { name: 'Trainerteam', role: '' };
    var T0 = {
      tactic: ['„Wir verlieren zu viele Bälle im Aufbau. Ich würde das Training auf Taktik umstellen.“', function () { club.training = 'taktik'; return 'Trainingsschwerpunkt: Taktik.'; }],
      intensity: ['„Die Jungs sind müde. Eine Woche Regeneration würde guttun.“', function () { club.training = 'regeneration'; return 'Trainingsschwerpunkt: Regeneration.'; }],
      injury: ['„Das Verletzungsrisiko steigt. Wir sollten rotieren und die Medizin stärken.“', function () { MX.squad(st).forEach(function (p) { p.fitness = clamp(p.fitness + 3, 0, 100); }); return 'Mehr Rotation – etwas frischere Spieler.'; }],
      youth: ['„Zwei Talente sind so weit. Lassen Sie sie mit den Profis trainieren.“', function () { (W.youthOf ? W.youthOf(st, club.id) : []).slice(0, 2).forEach(function (y) { y.morale = clamp(y.morale + 6, 0, 100); }); return 'Talente trainieren mit den Profis.'; }],
      mood: ['„Die Stimmung kippt. Ein Teamabend würde helfen.“', function () { fx(st, { kab: 3, cash: [-cash(st, 8000), 'Sonstiges'] }); return 'Teamabend organisiert.'; }]
    }[topic] || ['„Alles im grünen Bereich.“', function () { return 'Kein Handlungsbedarf.'; }];
    return { title: 'Mitarbeitergespräch: ' + s.role, cat: 'stab', imp: 'normal', img: 'staff', max: 2, ic: '🗣️', who: { n: s.name, role: s.role, ic: '📋' },
      nodes: { start: { say: T0[0], opts: [
        O('Empfehlung umsetzen', function () { var m = T0[1](); return end(m, fx(st, { staff: [c.k, 4] })); }, { def: true }),
        O('Ablehnen – ich sehe das anders', function () { return end('„Sie sind der Chef.“', fx(st, { staff: [c.k, -4] })); })
      ] } } };
  });
  add('staff_conflict', function (st, c) {
    var a = MX.staffP(st, c.a), b = MX.staffP(st, c.b); if (!a || !b) return null; return { title: 'Streit im Trainerstab', cat: 'stab', imp: 'wichtig', img: 'staff', max: 2, ic: '⚡', who: { n: a.name + ' & ' + b.name, role: a.role + ' / ' + b.role, ic: '📋' },
      nodes: { start: { say: a.name + ' (' + a.idea + ') und ' + b.name + ' (' + b.idea + ') geraten über die Ausrichtung aneinander. Die Spieler bekommen es mit.', opts: [
        O('Für ' + a.name.split(' ')[0] + ' entscheiden', function () { return end('Klare Linie – ' + b.name + ' ist verstimmt.', fx(st, { staff: [[c.a, 6], [c.b, -10]][0] }).concat(fx(st, { staff: [c.b, -10] }))); }),
        O('Für ' + b.name.split(' ')[0] + ' entscheiden', function () { return end('Klare Linie – ' + a.name + ' ist verstimmt.', fx(st, { staff: [c.b, 6] }).concat(fx(st, { staff: [c.a, -10] }))); }),
        O('Beide an einen Tisch holen', function () { return end('Ein langer Abend – am Ende steht ein gemeinsamer Plan.', fx(st, { staff: [c.a, 3] }).concat(fx(st, { staff: [c.b, 3], kab: 1, stress: 3 }))); }, { def: true })
      ] } } };
  });
  add('doctor_warning', function (st, c) {
    var club = cl(st); return { title: 'Warnung der medizinischen Abteilung', cat: 'stab', imp: 'normal', img: 'medizin', max: 2, ic: '🩺', who: staffWho(st, 'arzt'),
      nodes: { start: { say: '„' + c.n + ' Spieler sind im roten Bereich. Wenn wir so weitermachen, droht eine Verletzungswelle.“', opts: [
        O('Rotation anordnen', function () { MX.squad(st).filter(function (p) { return p.fitness < 75; }).forEach(function (p) { p.fitness = clamp(p.fitness + 6, 0, 100); }); return end('Mehr Rotation in den nächsten Spielen.', fx(st, { staff: ['arzt', 4] })); }, { def: true }),
        O('In die Medizin investieren', function () { var cst = cash(st, 60000); MX.squad(st).forEach(function (p) { p.risk = Math.max(0, (p.risk || 0) - 0.05); }); return end('Neue Geräte und zusätzliche Physiotherapie.', fx(st, { cash: [-cst, 'Medizin'], staff: ['arzt', 6] })); }),
        O('Keine Zeit für Schonung', function () { return end('„Auf Ihre Verantwortung.“', fx(st, { staff: ['arzt', -6] })); })
      ] } } };
  });

  // ============================================================================================
  // FANS
  // ============================================================================================
  add('fan_meeting', function (st, c) {
    return { title: 'Fanclub-Treffen', cat: 'fans', imp: 'normal', img: 'fans', max: 3, ic: '🧣', who: person(st, 'fanClubs'),
      nodes: {
        start: { say: '„Schön, dass Sie gekommen sind. Die Mitglieder haben viele Fragen – zuerst: Wie sieht der Plan für den Rest der Saison aus?“', opts: [
          O('Offen über Ziele und Probleme reden', function () { MX.say(st, 'fans_open', 'Offene Worte beim Fanclub-Treffen'); return nx('Applaus – Offenheit kommt an.', fx(st, { fans: { clubs: 5, long: 2 }, fanClubs: 4 }), 'q2'); }, { def: true }),
          O('Große Ziele verkünden', function () { MX.say(st, 'fans_bigtalk', 'Große Ziele beim Fanclub-Treffen'); return nx('Jubel im Saal. Daran wirst du gemessen werden.', fx(st, { fans: { clubs: 6, casual: 2 } }), 'q2'); }),
          O('Zurückhaltend bleiben', function () { return nx('Höflicher Applaus.', fx(st, { fans: { clubs: 1 } }), 'q2'); })
        ] },
        q2: { say: '„Und was ist mit den Eigengewächsen? Wir wollen Jungs aus der Region sehen.“', opts: [
          O('Nachwuchsförderung zusagen', function () { MX.say(st, 'fans_youth', 'Zusage: Nachwuchs fördern'); return end('Die Langjährigen nicken zufrieden.', fx(st, { fans: { long: 4, clubs: 2 } })); }, { def: true }),
          O('Leistung entscheidet, nicht Herkunft', function () { return end('Ehrlich, aber nicht jeder ist begeistert.', fx(st, { fans: { long: -2, casual: 1 } })); })
        ] }
      } };
  });
  add('autograph', function (st, c) {
    return { title: c.open ? 'Öffentliche Trainingseinheit' : 'Autogrammstunde', cat: 'fans', imp: 'normal', img: 'fans', max: 1, ic: '✍️', who: { n: 'Fanbetreuung', role: 'Verein', ic: '🧣' },
      nodes: { start: { say: c.open ? 'Die Fanbetreuung schlägt ein öffentliches Training vor – Hunderte Fans würden kommen.' : 'Ein großes Einkaufszentrum lädt zur Autogrammstunde ein.', opts: [
        O('Zusagen', function () { return end('Viele strahlende Gesichter – besonders die Familien.', fx(st, { fans: { family: 5, casual: 3 }, team: -1 })); }, { def: true }),
        O('Absagen – Fokus Training', function () { return end('Verständlich, aber eine verpasste Chance.', fx(st, { fans: { family: -2 } })); })
      ] } } };
  });
  add('ultras_talk', function (st, c) {
    var club = cl(st); return { title: 'Gespräch mit der aktiven Fanszene', cat: 'fans', imp: 'wichtig', img: 'ultras', max: 4, ic: '📣', who: person(st, 'ultras'),
      nodes: {
        start: { say: '„Wir unterstützen die Mannschaft jede Woche, egal wo. Aber wir haben Themen: Choreografien, Pyrotechnik, Stadionverbote. Hören Sie uns zu?“', opts: [
          O('Zuhören und ernst nehmen', function () { return nx('„Das ist mehr, als wir von vielen gewohnt sind.“', fx(st, { ultras: 6, fans: { ultras: 3, active: 2 } }), 'pyro'); }, { def: true }),
          O('Grenzen von Anfang an klarmachen', function () { return nx('„Dann wissen wir ja, woran wir sind.“', fx(st, { ultras: -4 }), 'pyro'); })
        ] },
        pyro: { say: '„Pyro gehört für viele zur Fankultur. Wie stehen Sie dazu?“', opts: [
          O('Legale Choreos voll unterstützen, Pyro bleibt verboten', function () { MX.say(st, 'pyro_line', 'Choreos ja, Pyro nein'); return nx('Eine Haltung, mit der man arbeiten kann.', fx(st, { ultras: 2, fanProj: 3 }), 'bans'); }, { def: true }),
          O('Pilotprojekt für kontrolliertes Abbrennen beim Verband anregen', function () { MX.say(st, 'pyro_pilot', 'Pilotprojekt Pyro angeregt'); return nx('Die Szene ist begeistert, der Vorstand weniger.', fx(st, { ultras: 8, fans: { ultras: 4 }, pres: -3 }), 'bans'); }),
          O('Null Toleranz – jedes Vergehen wird verfolgt', function () { MX.say(st, 'pyro_zero', 'Null Toleranz bei Pyro'); return nx('Pfiffe. Die Familienfans begrüßen es.', fx(st, { ultras: -8, fans: { ultras: -5, family: 3 } }), 'bans'); })
        ] },
        bans: { say: '„Und die Stadionverbote? Einige sind aus unserer Sicht ungerecht.“', opts: [
          O('Einzelfallprüfung mit dem Fanprojekt anbieten', function () { return nx('Ein Kompromiss, der Vertrauen schafft.', fx(st, { ultras: 4, fanProj: 5 }), 'close'); }, { def: true }),
          O('Das ist Sache von Polizei und Verein', function () { return nx('„Typisch.“', fx(st, { ultras: -3 }), 'close'); })
        ] },
        close: { say: '„Was nehmen wir mit?“', opts: [
          O('Regelmäßige Treffen vereinbaren', function () { MX.say(st, 'ultras_regular', 'Regelmäßige Treffen mit der Szene'); return end('Ein Anfang. Die Kurve wird es honorieren.', fx(st, { fans: { active: 3, ultras: 2 } }), { img: 'e' }); }, { def: true }),
          O('Unverbindlich verabschieden', function () { return end('Man geht auseinander, ohne viel erreicht zu haben.', []); })
        ] }
      } };
  });
  add('pyro', function (st, c) {
    var sev = c.sev, fine = cash(st, sev === 'gefährlich' ? 90000 : sev === 'Regelverstoß' ? 35000 : 0); return { title: sev === 'legal' ? 'Große Choreografie' : 'Pyrotechnik im ' + TM.arena, cat: 'fans', imp: sev === 'gefährlich' ? 'krise' : 'normal', img: 'ultras', max: 2, ic: sev === 'legal' ? '🎨' : '🔥', who: person(st, sev === 'legal' ? 'ultras' : 'fanProj'),
      nodes: { start: { say: sev === 'legal' ? 'Die Kurve hat eine beeindruckende, genehmigte Choreografie gezeigt. Bilder gehen viral.' : sev === 'Regelverstoß' ? 'Im Gästespiel wurden Bengalos gezündet. Niemand wurde verletzt, aber das Sportgericht ermittelt (' + money(fine) + ' drohen).' : 'Beim Heimspiel flogen Raketen in Richtung eines Nachbarblocks. Zwei Ordner wurden leicht verletzt. Strafe: ' + money(fine) + '.', opts: sev === 'legal' ? [
        O('Öffentlich danken', function () { return end('Die Szene fühlt sich wertgeschätzt.', fx(st, { ultras: 5, fans: { active: 3, ultras: 3 }, media: 1 })); }, { def: true }),
        O('Kein Kommentar', function () { return end('Schade um die Chance.', []); })
      ] : [
        O('Strafe zahlen, Dialog mit dem Fanprojekt', function () { return end('Die Strafe wird gezahlt, Gespräche folgen.', fx(st, { cash: [-fine, 'Verbandsstrafen'], fanProj: 4 })); }, { def: true }),
        O('Täter ermitteln und Regress fordern', function () { return end('Die Szene ist empört, die Familienfans begrüßen es.', fx(st, { cash: [-Math.round(fine * 0.6), 'Verbandsstrafen'], ultras: -8, fans: { family: 3, ultras: -4 } })); }),
        O('Sicherheitskonzept überarbeiten', function () { return end('Mehr Ordner, klare Abläufe.', fx(st, { cash: [-fine - cash(st, 20000), 'Verbandsstrafen'], fans: { family: 2 } })); }, { req: function () { return sev === 'gefährlich'; } })
      ] } } };
  });
  add('fan_protest', function (st, c) {
    var tg = c.target || 'sport'; return { title: tg === 'board' ? 'Protest gegen die Vereinsführung' : tg === 'transfer' ? 'Fans kritisieren Transfers' : 'Fanproteste', cat: 'fans', imp: 'krise', img: 'fanprotest', max: 3, ic: '🪧', who: person(st, 'fanClubs'),
      nodes: {
        start: { say: tg === 'board' ? 'Spruchbänder gegen den Präsidenten, Pfiffe gegen den Aufsichtsrat. Die Fans fordern Mitsprache.' : tg === 'transfer' ? 'Nach dem Verkauf von ' + (c.n || 'einem Publikumsliebling') + ' hängt ein Banner: „Ausverkauf stoppen!“' : 'Nach der Niederlagenserie stehen hundert Fans vor dem Trainingsgelände. Die Stimmung ist angespannt.', opts: [
          O('Rausgehen und das Gespräch suchen', function () { return nx('Du stellst dich den Fragen – das wird respektiert.', fx(st, { fans: { active: 4, clubs: 3 }, stress: 4 }), 'q', { img: 'c' }); }, { def: true }),
          O('Statement über die Vereinsmedien', function () { return nx('Distanziert, aber sachlich.', fx(st, { fans: 1 }), 'q'); }),
          O('Ignorieren', function () { return end('Der Protest verlagert sich in die Kurve.', fx(st, { fans: { active: -4, ultras: -4 } }), { img: 'd' }); })
        ] },
        q: { say: tg === 'board' ? '„Stehen Sie auf unserer Seite oder auf der des Präsidenten?“' : '„Was ändert sich jetzt konkret?“', opts: tg === 'board' ? [
          O('Vermitteln: gemeinsames Treffen organisieren', function () { return end('Ein Fan-Dialog mit dem Vorstand wird vereinbart.', fx(st, { fans: 3, pres: 1, fanClubs: 4 }), { img: 'e' }); }, { def: true }),
          O('Loyal zum Präsidenten', function () { return end('Der Präsident dankt dir, die Kurve nicht.', fx(st, { pres: 5, fans: { active: -4, ultras: -4 } })); }),
          O('Verständnis für die Fans äußern', function () { return end('Jubel in der Kurve, Kälte im Vorstand.', fx(st, { fans: { active: 5, ultras: 5 }, pres: -6, board: -2 })); })
        ] : [
          O('Klare sportliche Maßnahmen ankündigen', function () { MX.say(st, 'protest_measures', 'Maßnahmen angekündigt'); return end('Man gibt dir Zeit – noch.', fx(st, { fans: 2 })); }, { def: true }),
          O('Um Unterstützung bitten', function () { return end('Einige applaudieren. „Gemeinsam da raus.“', fx(st, { fans: { long: 3, clubs: 2 } })); })
        ] }
      } };
  });
  add('ticket_debate', function (st, c) {
    return { title: 'Diskussion um Eintrittspreise', cat: 'fans', imp: 'normal', img: 'fans', max: 2, ic: '🎟️', who: person(st, 'fanClubs'),
      nodes: { start: { say: '„Für Familien wird der Stadionbesuch zu teuer. Und die Stehplätze dürfen nicht weniger werden.“', opts: [
        O('Familienrabatt einführen', function () { return end('Mehr Familien im ' + TM.arena + ' – weniger Einnahmen pro Ticket.', fx(st, { fans: { family: 7, casual: 2 }, cash: [-cash(st, 60000), 'Ticketing'], ceo: -2 })); }),
        O('Stehplatzkontingent garantieren', function () { MX.say(st, 'stehplatz', 'Stehplatzgarantie'); return end('Die Kurve feiert die Zusage.', fx(st, { fans: { active: 5, ultras: 5 }, ceo: -1 })); }, { def: true }),
        O('Preise sind marktgerecht', function () { return end('Der Geschäftsführer nickt, die Fanclubs nicht.', fx(st, { fans: { family: -3, clubs: -2 }, ceo: 3 })); })
      ] } } };
  });
  add('crisis_support', function (st, c) {
    return { title: 'Die Fans stehen hinter der Mannschaft', cat: 'fans', imp: 'highlight', img: 'fans', max: 1, ic: '💪', who: person(st, 'fanClubs'),
      nodes: { start: { say: 'Trotz der schwierigen Phase organisieren die Fanclubs einen Unterstützungsmarsch zum Training. „Wir sind da – gerade jetzt.“', opts: [
        O('Mit der Mannschaft rausgehen und danken', function () { return end('Gänsehaut. Die Spieler sind tief beeindruckt.', fx(st, { team: 6, kab: 4, fans: { clubs: 3, long: 3 } }), { img: 'e' }); }, { def: true })
      ] } } };
  });
  add('threat', function (st, c) {
    var p = c.pid ? st.players[c.pid] : null; return { title: 'Bedrohungen nach der Krise', cat: 'fans', imp: 'krise', img: 'fanprotest', max: 3, ic: '⚠️', who: { n: 'Sicherheitsbeauftragter', role: 'Verein', ic: '🛡️' },
      nodes: {
        start: { say: (p ? 'Gegen ' + pname(p) + ' sind in sozialen Netzwerken persönliche Drohungen eingegangen.' : 'Gegen dich sind persönliche Drohungen eingegangen.') + ' Einige wenige Personen überschreiten jede Grenze. Wie gehen wir vor?', opts: [
          O('Polizei und Behörden einschalten', function () { return nx('Die Polizei nimmt die Ermittlungen auf.', fx(st, { stress: -2 }), 'more'); }, { def: true }),
          O('Professionelle Sicherheitsmaßnahmen veranlassen', function () { return nx('Personenschutz und Zugangskontrollen am Trainingsgelände.', fx(st, { cash: [-cash(st, 40000), 'Sicherheit'], stress: -3 }), 'more'); }),
          O('Vereinsführung informieren', function () { return nx('Der Präsident stellt sich öffentlich hinter euch.', fx(st, { pres: 3 }), 'more'); })
        ] },
        more: { say: 'Was soll zusätzlich geschehen?', opts: [
          O(p ? 'Den Spieler persönlich unterstützen' : 'Familie schützen und Abstand nehmen', function () { return end('Beistand zählt in solchen Momenten.', p ? fx(st, { mor: [p.id, 6], rel: [p.id, 10] }) : fx(st, { stress: -4, partner: 3 })); }, { def: true }),
          O('Öffentliche Stellungnahme: Gewalt hat keinen Platz', function () { return end('Breite Solidarität – auch aus der eigenen Kurve.', fx(st, { media: 4, fans: 2 })); }),
          O('Mit den Fanvertretungen sprechen', function () { return end('Die Fanszene distanziert sich deutlich von den Tätern.', fx(st, { fanClubs: 4, ultras: 2, fans: 2 })); })
        ] }
      } };
  });

  // ============================================================================================
  // MEDIEN: Pressekonferenzen (mehrstufig, Reporterpersönlichkeiten, Bezug auf frühere Aussagen) & Social Media
  // ============================================================================================
  function jrn(st, c) { var j = st.mx.people.jrn.filter(function (x) { return x.id === c.jid; })[0] || st.mx.people.jrn[0]; return j; }
  function lastRes(st) { var l = st.mx.last || {}; return l; }
  var QT = {
    form: function (st) { var l = lastRes(st); return l.streak >= 2 ? 'Drei Punkte, gute Stimmung – wie erklären Sie den Aufschwung?' : l.streak <= -2 ? 'Wieder nicht gewonnen. Was läuft schief?' : 'Wie bewerten Sie die Leistung zuletzt?'; },
    goal: function (st) { return 'Was ist realistisch in dieser Saison? Der Vorstand spricht von „' + (st.manager.boardTarget ? st.manager.boardTarget.text : 'einer ordentlichen Saison') + '“.'; },
    crisis: function (st) { return 'Haben Sie noch das Vertrauen des Vorstands? Und das der Mannschaft?'; },
    player: function (st, c) { var p = st.players[c.pid]; return p ? 'Wie zufrieden sind Sie mit ' + pname(p) + '?' : 'Wer hat Sie zuletzt besonders überzeugt?'; },
    rumour: function (st, c) { var p = st.players[c.rp]; return p ? 'Es heißt, ' + pname(p) + ' habe ein Angebot. Bleibt er?' : 'Gibt es Wechselgerüchte im Kader?'; },
    derby: function (st, c) { var o = st.clubs[c.opp]; return 'Am Wochenende steht das Derby gegen ' + (o ? o.short : 'den Rivalen') + ' an. Was sagen Sie den Fans?'; },
    nt: function (st) { var n = MN ? MN.mine(st).length : 0; return n ? n + ' Spieler sind bei Nationalmannschaften. Fürchten Sie die Belastung?' : 'Warum hat Ihr Kader so wenige Nationalspieler?'; },
    youth: function () { return 'Wann sehen wir mehr Talente aus dem eigenen Nachwuchs?'; },
    board: function (st) { return 'Wie ist Ihr Verhältnis zu Präsident ' + st.mx.people.pres.name + '?'; },
    ref: function (st, c) { var s = c.refS; return s ? '„' + s.txt + '“ – das sagten Sie in Woche ' + s.w + ' der Saison ' + s.s + '. Stehen Sie noch dazu?' : 'Sie haben vor einiger Zeit große Töne gespuckt. Bereuen Sie das?'; },
    follow: function () { return 'Sie weichen aus. Ich frage noch einmal ganz direkt.'; },
    tactic: function () { return 'Kritiker sagen, Ihre Taktik sei zu berechenbar. Ihre Antwort?'; },
    title: function () { return 'Sie stehen oben. Ist der Titel jetzt Pflicht?'; },
    releg: function () { return 'Abstiegsplatz. Wie wollen Sie die Klasse halten?'; }
  };
  // Antworttöne je Thema: sachlich, offensiv, ausweichend, emotional
  function tones(st, c, topic) {
    var j = jrn(st, c), ty = j.type, out = [];
    function eff(tone) {
      var m = { sachlich: { media: ty === 'seriös' ? 3 : 1, board: 0.5 }, offensiv: { media: ty === 'Boulevard' ? 3 : -1, team: topic === 'crisis' || topic === 'form' ? 2 : 0, fans: 1 }, ausweichend: { media: ty === 'provokant' || ty === 'Boulevard' ? -3 : -1 }, emotional: { media: ty === 'Fan-Podcast' || ty === 'Boulevard' ? 2 : -1, fans: 2 } }[tone];
      m.jrn = [j.id, tone === 'sachlich' ? (ty === 'seriös' ? 4 : 1) : tone === 'ausweichend' ? -3 : tone === 'offensiv' ? (ty === 'Boulevard' ? 3 : -1) : (ty === 'Fan-Podcast' ? 4 : 0)];
      return m;
    }
    function opt(l, tone, extra, react) { out.push(O(l, function () { var spec = eff(tone); if (extra) for (var k in extra) spec[k] = (spec[k] || 0) + extra[k]; var e = fx(st, spec); c.tones = (c.tones || []).concat([tone]); j.quotes.unshift({ t: tick(st), txt: l, topic: topic }); if (j.quotes.length > 12) j.quotes.length = 12; if (tone === 'ausweichend' && (ty === 'provokant' || ty === 'Boulevard') && c.qs[c.i + 1] !== 'follow' && topic !== 'follow') c.qs.splice(c.i + 1, 0, 'follow'); if (react && react.say) MX.say(st, react.say, l, j.outlet); c.i++; var done = c.i >= c.qs.length; var rt = j.name.split(' ')[0] + ' (' + j.outlet + '): ' + (react && react.r || reactTxt(ty, tone)); return done ? end(rt, e, { sum: headline(st, c, j) }) : nx(rt, e, 'q'); }, tone === 'sachlich' ? { def: true } : null)); }
    if (topic === 'goal') { opt('„Wir denken von Spiel zu Spiel.“', 'sachlich'); opt('„Wir wollen ganz nach oben – Punkt.“', 'offensiv', { fans: 2, board: -0.5 }, { say: 'press_goal_high' }); opt('„Fragen Sie den Vorstand.“', 'ausweichend', { pres: -2 }); opt('„Ich träume von diesem Verein ganz oben.“', 'emotional', null, { say: 'press_goal_dream' }); }
    else if (topic === 'crisis') { opt('„Ich spüre das Vertrauen und arbeite jeden Tag hart.“', 'sachlich'); opt('„Die Mannschaft lebt, das sieht jeder, der hinschaut.“', 'offensiv', { kab: 1 }); opt('„Dazu sage ich nichts.“', 'ausweichend'); opt('„Ich lasse mich hier nicht kaputtschreiben!“', 'emotional', { media: -2, fans: 1 }, { say: 'press_outburst' }); }
    else if (topic === 'player') { var p = st.players[c.pid]; opt('„Er ist auf einem guten Weg.“', 'sachlich', p ? null : null); opt('„Er ist einer der Besten der Liga.“', 'offensiv'); opt('„Ich spreche nicht über Einzelne.“', 'ausweichend'); opt('„Ich erwarte von ihm deutlich mehr.“', 'emotional', null, { say: p ? 'press_crit_' + p.id : 'press_crit' }); if (p) { var last = out.length; out[last - 3].go = wrapGo(out[last - 3].go, function () { fx(st, { mor: [p.id, 3] }); }); out[last - 1].go = wrapGo(out[last - 1].go, function () { fx(st, { mor: [p.id, -6], rel: [p.id, -5] }); MX.reveal(st, p, 'conf', 'reagiert auf öffentliche Kritik'); }); } }
    else if (topic === 'rumour') { var rp = st.players[c.rp]; opt('„Er hat Vertrag, wir planen mit ihm.“', 'sachlich', null, { say: rp ? 'press_keep_' + rp.id : 'press_keep' }); opt('„Unverkäuflich!“', 'offensiv', { fans: 2 }, { say: rp ? 'unverkaeuflich_' + rp.id : 'unverk' }); opt('„Gerüchte kommentiere ich nicht.“', 'ausweichend'); opt('„Bei einem unmoralischen Angebot denken wir nach.“', 'emotional', { fans: -3 }); }
    else if (topic === 'ref') { opt('„Ja – und ich stehe auch heute dazu.“', 'offensiv', { fans: 1 }); opt('„Die Lage hat sich geändert, das gebe ich zu.“', 'sachlich', { media: 1 }); opt('„Das war aus dem Zusammenhang gerissen.“', 'ausweichend', { media: -1 }); }
    else if (topic === 'follow') { opt('„Gut: Klare Antwort – wir halten an unserem Weg fest.“', 'sachlich'); opt('„Ich habe alles gesagt.“', 'ausweichend', { media: -2 }); }
    else if (topic === 'derby') { opt('„Ein Spiel wie jedes andere – mit drei Punkten.“', 'sachlich'); opt('„Wir werden sie in ihrem eigenen ' + TM.arena + ' schlagen!“', 'offensiv', { fans: 3, team: 1 }, { say: 'press_derby' }); opt('„Fragen Sie mich nach dem Spiel.“', 'ausweichend'); opt('„Für unsere Fans ist das das Spiel des Jahres.“', 'emotional', { fans: 3 }); }
    else if (topic === 'board') { opt('„Professionell und vertrauensvoll.“', 'sachlich', { pres: 1 }); opt('„Ich hätte mir mehr Unterstützung gewünscht.“', 'offensiv', { pres: -5, fans: 1 }, { say: 'press_board_crit' }); opt('„Kein Kommentar.“', 'ausweichend'); }
    else if (topic === 'youth') { opt('„Wenn sie so weit sind, spielen sie.“', 'sachlich'); opt('„Schon bald – versprochen.“', 'emotional', { fans: { long: 3 } }, { say: 'press_youth_promise' }); opt('„Wir brauchen jetzt Erfahrung.“', 'offensiv', { fans: { long: -2 } }); }
    else if (topic === 'nt') { opt('„Wir steuern die Belastung gemeinsam mit den Verbänden.“', 'sachlich'); opt('„Ich hätte lieber alle hier.“', 'offensiv', { media: -1 }); opt('„Länderspiele sind eine Auszeichnung.“', 'emotional'); }
    else { opt('„Wir arbeiten konzentriert weiter.“', 'sachlich'); opt('„Wer uns abschreibt, wird sich wundern.“', 'offensiv', { team: 1 }); opt('„Kein Kommentar.“', 'ausweichend'); opt('„Ich bin stolz auf diese Mannschaft.“', 'emotional', { team: 2 }); }
    return out;
  }
  function wrapGo(go, extra) { return function () { extra(); return go.apply(this, arguments); }; }
  function reactTxt(ty, tone) {
    var T0 = { seriös: { sachlich: 'Der Reporter notiert zufrieden.', offensiv: 'Hochgezogene Augenbrauen.', ausweichend: 'Ein skeptischer Blick.', emotional: '„Bleiben wir sachlich.“' }, Boulevard: { sachlich: 'Gähnen in der ersten Reihe.', offensiv: 'Die Kameras klicken – das wird die Schlagzeile.', ausweichend: '„Das reicht uns nicht!“', emotional: 'Perfektes Futter für morgen.' }, 'Taktik-Analyst': { sachlich: 'Eine Nachfrage zur Raumaufteilung folgt.', offensiv: 'Er lächelt wissend.', ausweichend: 'Er schreibt etwas Langes mit.', emotional: 'Er wartet auf Fakten.' }, 'Fan-Podcast': { sachlich: 'Respektvolles Nicken.', offensiv: 'Applaus aus der Ecke.', ausweichend: 'Enttäuschung.', emotional: '„Das werden unsere Hörer lieben.“' }, provokant: { sachlich: 'Er setzt sofort nach.', offensiv: '„Mutig!“', ausweichend: '„So kommen Sie nicht davon.“', emotional: 'Er hat, was er wollte.' } };
    return (T0[ty] || T0.seriös)[tone];
  }
  function headline(st, c, j) {
    var t = c.tones || [], off = t.filter(function (x) { return x === 'offensiv'; }).length, emo = t.filter(function (x) { return x === 'emotional'; }).length, ev = t.filter(function (x) { return x === 'ausweichend'; }).length;
    var h = ev >= 2 ? 'Trainer mauert auf der Pressekonferenz' : off >= 2 ? 'Kampfansage: „Wer uns abschreibt, wird sich wundern“' : emo >= 2 ? 'Emotionaler Auftritt des Trainers' : 'Sachlicher Auftritt, klare Worte';
    MX.feedAdd(st, { who: j.outlet, txt: h, kind: 'media' });
    return 'Schlagzeile (' + j.outlet + '): „' + h + '“. ' + t.length + ' Fragen beantwortet.';
  }
  add('press', function (st, c) {
    var big = !!c.big, js = st.mx.people.jrn; if (!c.qs) c.qs = ['form']; if (c.i == null) c.i = 0; if (c.j0 == null) c.j0 = hash(String(c.jid || 'j0')) % js.length;
    if (big) c.jid = js[(c.j0 + c.i) % js.length].id; // Pressekonferenz: Reporter wechseln sich ab
    function q() { var t = c.qs[Math.min(c.i, c.qs.length - 1)]; return QT[t] ? QT[t](st, c) : QT.form(st, c); }
    function op() { return tones(st, c, c.qs[Math.min(c.i, c.qs.length - 1)]); }
    return { title: big ? 'Pressekonferenz' + (c.why ? ': ' + c.why : '') : 'Interview', cat: 'medien', imp: big ? 'wichtig' : 'normal', img: 'presse', max: c.qs.length, ic: '🎤', noChron: true,
      who: function () { var jj = jrn(st, c); return { n: jj.name, role: jj.outlet + ' (' + jj.type + ')', ic: '🎤' }; },
      nodes: { start: { say: q, opts: op }, q: { say: q, opts: op } } };
  });
  MX.pressTopics = function (st, big, why) {
    var l = st.mx.last || {}, ps = pos(st), qs = ['form'], club = cl(st);
    if (l.streak <= -3) qs.push('crisis'); if (ps && ps <= 2 && st.week > 8) qs.push('title'); if (ps && club && ps >= (st.leagues[club.league] ? st.leagues[club.league].clubIds.length - 2 : 16) && st.week > 10) qs.push('releg');
    var hot = MX.squad(st).sort(function (a, b) { return (b.stats.goals || 0) - (a.stats.goals || 0); })[0]; var cx = {};
    if (hot) { qs.push('player'); cx.pid = hot.id; }
    var offer = (st.inbox || []).filter(function (o) { return o.type === 'offer'; })[0]; if (offer) { qs.push('rumour'); cx.rp = offer.pid; }
    var ref = MX.saidAny(st, /^press_goal_high|^press_derby|^press_youth_promise|^unverkaeuflich_/, 30); if (ref && (l.streak <= -2 || (ps && ps > tgt(st) + 2))) { qs.push('ref'); cx.refS = ref; }
    if (MN && MN.mine(st).length) qs.push('nt'); qs.push(R.pick(['goal', 'youth', 'board', 'tactic']));
    var n = big ? 5 + Math.min(5, Math.floor((qs.length) / 2) + (l.streak <= -3 ? 2 : 0)) : 3 + (hash('pn' + tick(st)) % 3);
    while (qs.length < n) qs.push(R.pick(['goal', 'youth', 'board', 'tactic', 'form']));
    cx.qs = qs.slice(0, n); cx.big = !!big; cx.why = why || ''; cx.jid = 'j' + (hash('pj' + tick(st)) % 5); cx.i = 0; return cx;
  };
  add('social', function (st, c) {
    var f = st.mx.feed.filter(function (x) { return x.id === c.fid; })[0] || { txt: c.txt || '', who: '' }, p = c.pid ? st.players[c.pid] : null;
    return { title: 'Social Media: Reaktion?', cat: 'medien', imp: 'normal', img: 'social', max: 2, ic: '📱', who: { n: f.who || 'Netz', role: 'Social Media', ic: '📱' },
      nodes: {
        start: { say: '„' + f.txt + '“ – der Beitrag verbreitet sich schnell. Reagierst du?', opts: [
          O('Stellungnahme veröffentlichen', function () { f.react = 'statement'; return nx('Sachlich und klar – die Diskussion beruhigt sich.', fx(st, { media: 2 }), 'after'); }, { def: true }),
          O('Interview geben', function () { f.react = 'interview'; MX.start(st, 'press', MX.pressTopics(st, false), { prio: 0 }); return end('Ein Interview wird angesetzt.', []); }),
          O('Gerücht dementieren', function () { f.react = 'dementi'; if (c.pid) MX.say(st, 'dementi_' + c.pid, 'Gerücht um ' + (p ? p.last : '') + ' dementiert'); return nx('Dementi raus. Man wird dich daran messen.', fx(st, { fans: 2 }), 'after'); }, { req: function () { return c.kind === 'rumour'; } }),
          O('Spieler öffentlich unterstützen', function () { f.react = 'support'; return nx('Rückendeckung für ' + p.last + ' – die Mannschaft registriert es.', fx(st, { mor: [p.id, 6], rel: [p.id, 5], kab: 1 }), 'after'); }, { req: function () { return !!p; } }),
          O('Kritik akzeptieren', function () { f.react = 'accept'; return nx('Selbstkritik kommt an – auch wenn manche Häme folgt.', fx(st, { fans: 2, media: 1 }), 'after'); }),
          O('Bewusst schweigen', function () { f.react = 'silence'; return end('Das Thema verläuft sich – oder auch nicht.', fx(st, { media: -1 })); })
        ] },
        after: { say: 'Die Kommentare überschlagen sich. Willst du nachlegen?', opts: [
          O('Nein, das reicht', function () { return end('Die Community diskutiert weiter, die Wogen glätten sich.', []); }, { def: true }),
          O('Persönliche Antwort an Kritiker', function () { return end('Riskant – die einen feiern dich, die anderen werfen dir Dünnhäutigkeit vor.', fx(st, { media: -1, fans: 1 })); })
        ] }
      } };
  });

  // ============================================================================================
  // VEREINSFÜHRUNG, SPONSOREN, INFRASTRUKTUR
  // ============================================================================================
  add('board_goals', function (st, c) {
    var mg = st.manager, b = mg.boardTarget || { pos: 9, text: 'Mittelfeld' }, mx = st.mx, pres = mx.people.pres, club = cl(st), id = MX.ident(st, club) || {};
    if (c.dem == null) c.dem = Math.max(1, b.pos - (pres.style === 'ungeduldig' || id.ambition >= 75 ? 2 : 0));
    function grant() { if (c.grant == null) { var ok = club.cash > 0 && (st.mx.people.ceo.style !== 'kaufmännisch vorsichtig' || club.cash > E.revenueEstimate(st, club) * 0.3); c.grant = ok ? cash(st, 2500000) : 0; } return c.grant; }
    function agree(posv, txt, extra) { mg.boardTarget = { pos: posv, text: txt }; mx.mem.agree.unshift({ k: 'target', s: st.season, pos: posv, txt: txt, extra: extra || null, t: tick(st) }); }
    return { title: 'Saisonzielgespräch mit dem Vorstand', cat: 'vorstand', imp: 'wichtig', img: 'vorstand', max: 3, ic: '🎯', who: person(st, 'pres'),
      nodes: {
        start: { say: '„Wir erwarten in dieser Saison Platz ' + c.dem + ' oder besser (' + b.text + '). Wie sehen Sie das?“', opts: [
          O('Ziel akzeptieren', function () { agree(c.dem, c.dem < b.pos ? 'Platz ' + c.dem + ' (ehrgeizig)' : b.text); return end('„Sehr gut. Daran werden wir Sie messen.“', fx(st, { pres: 4, board: 2 }), { img: 'e' }); }, { def: true }),
          O('Zusätzliche Mittel verlangen', function () { return nx('Der Präsident schaut zum Geschäftsführer.', [], 'money'); }),
          O('Realistische Zielkorrektur vorschlagen', function () { var np = Math.min(c.dem + 3, (st.leagues[club.league] ? st.leagues[club.league].clubIds.length : 18) - 2); var ok = pres.style !== 'ungeduldig' || pres.v >= 60; if (ok) { agree(np, 'Platz ' + np + ' (korrigiert)'); return end('„Einverstanden – aber dann ohne Ausreden.“', fx(st, { pres: -1 }), { img: 'c' }); } agree(c.dem, b.text); return end('„Nein. Das Ziel bleibt.“', fx(st, { pres: -4, board: -2 }), { img: 'd' }); }),
          O('Auf Nachwuchsspieler setzen', function () { var np = c.dem + 2; agree(np, 'Platz ' + np + ' + Nachwuchs', { youth: 2 }); MX.say(st, 'board_youth', 'Vereinbarung: Nachwuchs einbauen'); return end('„Ein mutiger Weg. Mindestens zwei Eigengewächse sollen regelmäßig spielen.“', fx(st, { pres: 1, sd: 4, fans: { long: 2 } })); }),
          O('Konflikt riskieren: Ziel ist unrealistisch', function () { agree(c.dem, b.text, { conflict: 1 }); mx.mem.conf.push({ id: 'cfb' + tick(st), k: 'board', t: tick(st), txt: 'Streit um das Saisonziel', done: false }); return end('„Dann sind wir uns uneinig. Das Ziel bleibt bestehen.“', fx(st, { pres: -8, board: -4 }), { img: 'd' }); })
        ] },
        money: { who: person(st, 'ceo'), say: function () { var ok = grant() > 0; return ok ? '„Wir könnten ' + money(c.grant) + ' zusätzlich bereitstellen. Dann erwarten wir aber Platz ' + Math.max(1, c.dem - 1) + '.“' : '„Die Kassenlage gibt das nicht her. Tut mir leid.“'; }, opts: [
          O('Annehmen – mit höherem Ziel', function () { if (!grant()) return end('Ohne Mittel bleibt das Ziel bestehen.', [], {}); var np = Math.max(1, c.dem - 1); mg.boardTarget = { pos: np, text: 'Platz ' + np + ' (mit Zusatzmitteln)' }; mx.mem.agree.unshift({ k: 'target', s: st.season, pos: np, txt: mg.boardTarget.text, extra: { grant: c.grant }, t: tick(st) }); return end('Zusätzliches Budget gebucht. Die Erwartungen steigen.', fx(st, { cash: [c.grant, 'Zuschuss Gesellschafter'], ceo: 2 }), { img: 'e' }); }, { req: function () { return grant() > 0; }, def: true }),
          O('Verzichten – Ziel wie besprochen', function () { mg.boardTarget = { pos: c.dem, text: b.text }; mx.mem.agree.unshift({ k: 'target', s: st.season, pos: c.dem, txt: b.text, t: tick(st) }); return end('„In Ordnung.“', fx(st, { ceo: 1 })); })
        ] }
      } };
  });
  add('board_crisis', function (st, c) {
    var mg = st.manager, mx = st.mx; return { title: 'Krisensitzung', cat: 'vorstand', imp: 'krise', img: 'vorstand', max: 5, ic: '🚨', who: person(st, 'pres'),
      nodes: {
        start: { img: 'c', say: '„Platz ' + (pos(st) || '?') + ', ' + Math.abs((mx.last || {}).streak || 0) + ' Spiele ohne Sieg. Die Fans protestieren, die Sponsoren rufen an. Ich will Ihren Plan hören.“', opts: [
          O('Taktische Umstellung präsentieren', function () { cl(st).training = 'taktik'; return nx('„Konkret. Das gefällt mir.“', fx(st, { pres: 4, board: 3 }), 'ceo'); }, { def: true }),
          O('Mehr Zeit einfordern', function () { return nx('„Zeit ist das, was wir am wenigsten haben.“', fx(st, { pres: -2 }), 'ceo'); }),
          O('Die Spieler in die Pflicht nehmen', function () { return nx('„Das ist auch Ihre Mannschaft.“', fx(st, { board: 1, team: -3, kab: -2 }), 'ceo'); })
        ] },
        ceo: { who: person(st, 'ceo'), say: '„Bei einem Abstieg brechen uns ' + money(cash(st, 9000000)) + ' an Einnahmen weg. Brauchen wir Verstärkungen?“', opts: [
          O('Ja – ein, zwei gezielte Transfers', function () { return nx('„Wir prüfen den Spielraum.“', fx(st, { ceo: 1 }), 'ar'); }, { def: true }),
          O('Nein – der Kader ist gut genug', function () { return nx('„Hoffentlich behalten Sie recht.“', fx(st, { ceo: -1 }), 'ar'); })
        ] },
        ar: { who: person(st, 'ar'), say: '„Der Aufsichtsrat fragt: Erreicht der Trainer die Mannschaft noch?“', opts: [
          O('Ja – die Kabine steht', function () { var k = MX.kabine(st).v; return nx(k >= 55 ? 'Die Zahlen zur Kabinenstimmung stützen das.' : 'Die Stimmungswerte sprechen eine andere Sprache.', fx(st, { ar: k >= 55 ? 4 : -5, board: k >= 55 ? 2 : -3 }), 'final'); }, { def: true }),
          O('Ehrlich: Es gibt Probleme, aber ich löse sie', function () { return nx('„Ehrlichkeit wissen wir zu schätzen.“', fx(st, { ar: 2 }), 'final'); })
        ] },
        final: { say: '„Wir geben Ihnen eine letzte Chance. Wie lautet Ihr Versprechen?“', opts: [
          O('Sechs Punkte aus den nächsten drei Spielen', function () { mx.mem.agree.unshift({ k: 'ultimatum', s: st.season, t: tick(st), pts: HB ? 4 : 6, games: 3, w0: st.week, txt: (HB ? 4 : 6) + ' Punkte aus 3 Spielen' }); return end('Ultimatum vereinbart. Der Druck ist enorm.', fx(st, { board: 3, stress: 6 }), { img: 'd' }); }, { def: true }),
          O('Kein Versprechen – nur harte Arbeit', function () { return end('„Wir werden sehen.“ Eisige Stille.', fx(st, { board: -4 })); }),
          O('Vertrauensfrage stellen', function () { if ((mg.trust || 0) < 22 && mg.canBeFired) { S.fireManager(st, 'Vertrauensfrage in der Krisensitzung verloren'); return end('Der Vorstand entzieht dir das Vertrauen. Du bist entlassen.', [], { img: 'e', sum: 'Entlassen nach verlorener Vertrauensfrage.' }); } return end('Der Vorstand stellt sich geschlossen hinter dich!', fx(st, { board: 10, pres: 6, kab: 3 }), { img: 'e' }); }, { hint: 'Risiko: Entlassung möglich' })
        ] }
      } };
  });
  add('finance_crisis', function (st, c) {
    var club = cl(st), sq = MX.squad(st).slice().sort(function (a, b) { return b.value - a.value; }); return { title: 'Finanzielle Schieflage', cat: 'vorstand', imp: 'krise', img: 'vorstand', max: 2, ic: '📉', who: person(st, 'ceo'),
      nodes: { start: { say: '„Unser Kontostand: ' + money(club.cash) + '. Ohne Gegenmaßnahmen droht Ärger mit der Lizenzierung.“', opts: [
        O('Wertvollsten Spieler auf die Liste setzen', function () { var p = sq[0]; if (p) p.listed = true; return end((p ? pname(p) : 'Der Spieler') + ' steht zum Verkauf – die Fans sind entsetzt.', fx(st, { ceo: 5, fans: { long: -3, active: -2 }, kab: -2 })); }),
        O('Kosten senken (Budgets reduzieren)', function () { if (club.budgets) Object.keys(club.budgets).forEach(function (k) { club.budgets[k] = Math.max(0, club.budgets[k] - 1); }); return end('Alle Budgets sinken eine Stufe.', fx(st, { ceo: 3, team: -1 })); }, { def: true }),
        O('Investorengespräch vorschlagen', function () { var amt = cash(st, 3000000); return end('Ein regionaler Unternehmer hilft mit ' + money(amt) + ' – gegen Mitsprache.', fx(st, { cash: [amt, 'Zuschuss Gesellschafter'], fans: { active: -3, ultras: -3 }, ar: -2 })); }),
        O('Fan-Anleihe auflegen', function () { var amt = cash(st, 1200000) * (MX.fanMood(st) / 60); return end('Die Fans zeichnen ' + money(Math.round(amt)) + '.', fx(st, { cash: [Math.round(amt), 'Fan-Anleihe'], fans: { long: 2 } })); })
      ] } } };
  });
  add('board_strategy', function (st, c) {
    var club = cl(st), id = MX.ident(st, club); return { title: 'Langfristige Vereinsstrategie', cat: 'vorstand', imp: 'normal', img: 'vorstand', max: 2, ic: '🧭', who: person(st, 'ar'),
      nodes: { start: { say: '„Der Aufsichtsrat möchte die Ausrichtung der nächsten Jahre festlegen. Wo sehen Sie den Schwerpunkt?“', opts: [
        O('Nachwuchsarbeit', function () { id.youth = clamp(id.youth + 8, 0, 100); MX.say(st, 'strat_youth', 'Strategie: Nachwuchs'); return end('Beschlossen: Der Verein setzt auf eigene Talente.', fx(st, { sd: 4, fans: { long: 3 } })); }, { def: true }),
        O('Infrastruktur', function () { MX.say(st, 'strat_infra', 'Strategie: Infrastruktur'); return end('Beschlossen: Ausbau von ' + TM.arena + ' und Trainingszentrum hat Vorrang.', fx(st, { ceo: 3 })); }),
        O('Sportlicher Erfolg sofort', function () { id.ambition = clamp(id.ambition + 8, 0, 100); MX.say(st, 'strat_success', 'Strategie: Sofortiger Erfolg'); return end('Beschlossen – die Erwartungen steigen.', fx(st, { pres: 3, fans: { casual: 2 } })); })
      ] } } };
  });
  add('board_praise', function (st, c) {
    return { title: 'Der Präsident bedankt sich', cat: 'vorstand', imp: 'normal', img: 'vorstand', max: 1, ic: '🤝', who: person(st, 'pres'),
      nodes: { start: { say: '„Seit ' + c.n + ' Saisons arbeiten wir vertrauensvoll zusammen. Danke dafür. Wenn Sie etwas brauchen – sagen Sie es.“', opts: [
        O('Bitte um Investition in den Nachwuchs', function () { return end('Zusage: zusätzliche Mittel für das Leistungszentrum.', fx(st, { cash: [cash(st, 300000), 'Zuschuss Gesellschafter'], pres: 2 })); }, { def: true }),
        O('Einfach danken', function () { return end('Ein herzlicher Händedruck.', fx(st, { pres: 4, board: 2 })); })
      ] } } };
  });
  add('board_conflict', function (st, c) {
    return { title: 'Streit mit der Vereinsführung', cat: 'vorstand', imp: 'krise', img: 'vorstand', max: 2, ic: '⚡', who: person(st, c.who || 'pres'),
      nodes: { start: { img: 'd', say: '„' + (c.txt || 'Ihre öffentlichen Aussagen über den Vorstand waren unprofessionell.') + '“', opts: [
        O('Entschuldigen', function () { st.mx.mem.conf.forEach(function (x) { if (x.k === 'board') x.done = true; }); return end('Die Wogen glätten sich.', fx(st, { pres: 6, board: 3, media: -1 })); }, { def: true }),
        O('Standhaft bleiben', function () { return end('Das Verhältnis bleibt angespannt.', fx(st, { pres: -6, board: -3, fans: 1 })); }),
        O('Aufsichtsrat einschalten', function () { var a = st.mx.people.ar; return end(a.v >= 50 ? 'Der Aufsichtsrat vermittelt erfolgreich.' : 'Der Aufsichtsrat stellt sich hinter den Präsidenten.', fx(st, a.v >= 50 ? { pres: 2, board: 2 } : { board: -4, ar: -2 })); })
      ] } } };
  });
  add('sponsor_event', function (st, c) {
    var sp = MX.mainSponsor(st) || { name: 'Hauptsponsor' }; return { title: 'Termin beim Hauptsponsor', cat: 'sponsoren', imp: 'normal', img: 'sponsor', max: 2, ic: '🤝', who: { n: sp.name, role: 'Hauptsponsor', ic: '💼' },
      nodes: { start: { say: '„Wir veranstalten ' + (c.region ? 'ein Regionalfest' : 'einen Kundenabend') + ' und würden uns freuen, wenn Sie und zwei Spieler kommen.“', opts: [
        O('Zusagen (mit zwei Spielern)', function () { if (c.region) st.mx.spons.region = (st.mx.spons.region || 0) + 1; else st.mx.spons.events = (st.mx.spons.events || 0) + 1; MX.squad(st).slice(0, 2).forEach(function (p) { p.fitness = clamp(p.fitness - 2, 0, 100); }); return end('Ein gelungener Abend – der Sponsor ist begeistert.', fx(st, { spons: 6, stress: 2 })); }, { def: true }),
        O('Allein hingehen', function () { if (c.region) st.mx.spons.region = (st.mx.spons.region || 0) + 1; else st.mx.spons.events = (st.mx.spons.events || 0) + 0.5; return end('Höflich, aber nicht ganz, was man sich erhofft hatte.', fx(st, { spons: 2, stress: 2 })); }),
        O('Absagen', function () { return end('Der Sponsor ist verschnupft.', fx(st, { spons: -5 })); })
      ] } } };
  });
  add('sponsor_pressure', function (st, c) {
    var sp = MX.mainSponsor(st) || { name: 'Hauptsponsor' }; return { title: 'Der Hauptsponsor macht Druck', cat: 'sponsoren', imp: 'wichtig', img: 'sponsor', max: 2, ic: '📞', who: { n: sp.name, role: 'Hauptsponsor', ic: '💼' },
      nodes: { start: { img: 'd', say: '„Unsere Marke steht für Erfolg. Die aktuelle Situation schadet uns. Wir erwarten eine Reaktion.“', opts: [
        O('Sportlichen Plan erläutern', function () { return end('„Wir geben Ihnen Zeit – begrenzt.“', fx(st, { spons: 3 })); }, { def: true }),
        O('Zusätzliche Werbetermine anbieten', function () { st.mx.spons.events = (st.mx.spons.events || 0) + 1; return end('Der Sponsor ist besänftigt, die Spieler weniger.', fx(st, { spons: 6, team: -2 })); }),
        O('Sportliche Entscheidungen treffe ich', function () { return end('„Wir behalten uns Schritte vor.“', fx(st, { spons: -8 })); })
      ] } } };
  });
  add('sponsor_support', function (st, c) {
    var sp = MX.mainSponsor(st) || { name: 'Hauptsponsor' }, amt = cash(st, c.k === 'youth' ? 400000 : 700000); return { title: c.k === 'youth' ? 'Sponsor fördert den Nachwuchs' : 'Sponsor unterstützt den Ausbau', cat: 'sponsoren', imp: 'normal', img: 'sponsor', max: 1, ic: '🎁', who: { n: sp.name, role: 'Hauptsponsor', ic: '💼' },
      nodes: { start: { say: '„Wir würden ' + money(amt) + ' für ' + (c.k === 'youth' ? 'das Nachwuchsleistungszentrum' : 'das laufende Bauprojekt') + ' beisteuern – mit unserem Logo daran.“', opts: [
        O('Annehmen', function () { return end('Die Förderung ist gebucht.', fx(st, { cash: [amt, 'Sponsoring'], spons: 4, fans: { active: c.k === 'youth' ? 0 : -2 } })); }, { def: true }),
        O('Ablehnen – keine Logos am Nachwuchs', function () { return end('Die Traditionalisten applaudieren.', fx(st, { spons: -3, fans: { long: 2, active: 2 } })); })
      ] } } };
  });
  add('sponsor_loss', function (st, c) {
    var sp = MX.mainSponsor(st); return { title: 'Hauptsponsor droht mit Ausstieg', cat: 'sponsoren', imp: 'krise', img: 'sponsor', max: 2, ic: '🚪', who: { n: sp ? sp.name : 'Hauptsponsor', role: 'Hauptsponsor', ic: '💼' },
      nodes: { start: { img: 'f', say: '„Wir prüfen, den Vertrag nicht zu verlängern. Die Zusammenarbeit entspricht nicht unseren Erwartungen.“', opts: [
        O('Persönliches Krisengespräch, mehr Präsenz zusagen', function () { st.mx.spons.events = (st.mx.spons.events || 0) + 1; return end('Der Sponsor bleibt vorerst – unter Beobachtung.', fx(st, { spons: 12, stress: 3 }), { img: 'e' }); }, { def: true }),
        O('Ziehen lassen und neue Partner suchen', function () { if (sp) sp.years = Math.min(sp.years || 1, 1); return end('Der Vertrag läuft zum Saisonende aus.', fx(st, { spons: -5, ceo: -3 })); })
      ] } } };
  });
  add('build_issue', function (st, c) {
    var club = cl(st), b = club.construction[0], n = b && D.facilities[b.key] ? D.facilities[b.key].levels[b.to].n : 'Bauprojekt', extra = R.round((b ? b.cost : 1e6) * 0.15, D.MONEY ? 100 : 1000);
    return { title: c.k === 'delay' ? 'Bauverzögerung' : 'Bau wird teurer', cat: 'infrastruktur', imp: 'normal', img: 'stadionbau', max: 2, ic: '🏗️', who: person(st, 'ceo'),
      nodes: { start: { img: c.k === 'delay' ? 'd' : 'b', say: c.k === 'delay' ? '„Beim Projekt „' + n + '“ fehlen Fachkräfte. Es drohen zwei Wochen Verzug.“' : '„Die Baupreise sind gestiegen. „' + n + '“ kostet ' + money(extra) + ' mehr.“', opts: c.k === 'delay' ? [
        O('Mehrkosten für Zusatzschichten zahlen', function () { return end('Der Zeitplan hält.', fx(st, { cash: [-Math.round(extra / 3), 'Bau'] })); }),
        O('Verzögerung akzeptieren', function () { if (b) b.weeks += 2; return end('Zwei Wochen später fertig.', []); }, { def: true })
      ] : [
        O('Mehrkosten tragen', function () { return end('Das Projekt läuft weiter wie geplant.', fx(st, { cash: [-extra, 'Bau'] })); }, { def: true }),
        O('Abgespeckt bauen (länger, günstiger)', function () { if (b) b.weeks += 3; return end('Der Bau dauert drei Wochen länger, kostet aber nicht mehr.', []); }),
        O('Sponsor um Unterstützung bitten', function () { var ok = st.mx.spons.v >= 55; return end(ok ? 'Der Sponsor übernimmt die Hälfte.' : 'Der Sponsor winkt ab – der Verein zahlt.', fx(st, { cash: [-(ok ? Math.round(extra / 2) : extra), 'Bau'], spons: ok ? -2 : -1 })); })
      ] } } };
  });
  add('build_grant', function (st, c) {
    var amt = cash(st, 900000); return { title: 'Attraktives Förderangebot', cat: 'infrastruktur', imp: 'normal', img: 'stadionbau', max: 1, ic: '🏛️', who: { n: 'Stadtverwaltung', role: 'Sportförderung', ic: '🏛️' },
      nodes: { start: { say: '„Das Land fördert Sportinfrastruktur. Wir könnten ' + money(amt) + ' bereitstellen – Bedingung: Das Nachwuchsleistungszentrum wird für Schulen geöffnet.“', opts: [
        O('Annehmen', function () { return end('Förderbescheid erhalten.', fx(st, { cash: [amt, 'Fördermittel'], fans: { family: 3 }, media: 2 })); }, { def: true }),
        O('Ablehnen', function () { return end('Die Stadt ist enttäuscht.', fx(st, { media: -1 })); })
      ] } } };
  });
  add('build_done', function (st, c) {
    return { title: 'Einweihung: ' + c.n, cat: 'infrastruktur', imp: 'highlight', img: 'stadionbau', max: 1, ic: '🎉', who: person(st, 'pres'),
      nodes: { start: { img: 'e', say: 'Das Projekt „' + c.n + '“ ist fertig. Der Präsident lädt zur feierlichen Eröffnung.', opts: [
        O('Mit Fans und Sponsoren feiern', function () { return end('Ein Fest für den ganzen Verein.', fx(st, { fans: 3, spons: 3, pres: 3 })); }, { def: true })
      ] } } };
  });

  // ============================================================================================
  // VEREINSKRISE (5 Phasen) & POSITIVE BÖGEN
  // ============================================================================================
  add('crisis_unrest', function (st, c) {
    var p = P(st, c) || MX.squad(st)[0]; return { title: 'Unruhe in der Mannschaft', cat: 'kabine', imp: 'krise', img: 'trainerkrise', max: 3, ic: '🌩️', who: who(st, p),
      nodes: {
        start: { img: 'b', say: '„Einige Jungs zweifeln an den Trainingsmethoden. Und an der Aufstellung. Ich sage das nicht gern, aber jemand muss es tun.“', opts: [
          O('Offene Mannschaftssitzung', function () { return nx('Es wird laut – aber ehrlich.', fx(st, { kab: 3, stress: 3 }), 'two', { img: 'd' }); }, { def: true }),
          O('Kritik zurückweisen', function () { return nx('Die Spieler ziehen sich zurück.', fx(st, { kab: -4, rel: [p.id, -6] }), 'two'); }),
          O('Training anpassen', function () { cl(st).training = 'technik'; return nx('Neue Reize im Training.', fx(st, { kab: 2, team: 1 }), 'two'); })
        ] },
        two: { say: 'Wie geht es weiter?', opts: [
          O('Führungsspieler stärker einbinden', function () { return end('Die Hierarchie hilft, die Stimmung zu stabilisieren.', fx(st, { kab: 2 }), { img: 'e' }); }, { def: true }),
          O('Disziplin durchsetzen', function () { return end('Strenge Regeln – kurzfristig Ruhe.', fx(st, { kab: -1, team: -1 })); })
        ] }
      } };
  });
  add('turnaround', function (st, c) {
    return { title: 'Die sportliche Wende!', cat: 'kabine', imp: 'highlight', img: 'trainerkrise', max: 1, ic: '📈', who: person(st, 'pres'),
      nodes: { start: { img: 'e', say: 'Zwei Siege in Folge – die Krise scheint überstanden. Der Präsident ruft an: „Ich wusste, dass wir zusammen da rauskommen.“', opts: [
        O('Der Mannschaft danken', function () { return end('Erleichterung überall. Das Vertrauen ist zurück.', fx(st, { board: 6, pres: 4, team: 4, kab: 4, fans: 4, stress: -8 })); }, { def: true })
      ] } } };
  });
  add('crisis_final', function (st, c) {
    return { title: 'Letzte Warnung', cat: 'vorstand', imp: 'krise', img: 'entlassung', max: 1, ic: '⏳', who: person(st, 'pres'),
      nodes: { start: { img: 'a', say: '„Die Situation ist untragbar. Wenn sich in den nächsten Wochen nichts ändert, müssen wir handeln.“', opts: [
        O('Verstanden', function () { return end('Der Druck ist auf dem Höhepunkt.', fx(st, { board: -6, stress: 8 })); }, { def: true }),
        O('Gelassen reagieren', function () { return end('„Ihre Gelassenheit möchte ich haben.“', fx(st, { board: -8, stress: 3 })); })
      ] } } };
  });
  add('win_streak', function (st, c) {
    return { title: 'Siegesserie!', cat: 'kabine', imp: 'highlight', img: 'meister', max: 1, ic: '🔥', who: { n: 'Mannschaft', role: c.n + ' Siege in Folge', ic: '👥' },
      nodes: { start: { say: c.n + ' Siege in Folge – die Stadt ist im Fieber. Wie gehst du damit um?', opts: [
        O('Bodenständig bleiben', function () { return end('„Nächstes Spiel, nächste Aufgabe.“ Die Mannschaft bleibt fokussiert.', fx(st, { kab: 2 })); }, { def: true }),
        O('Prämie für die Mannschaft', function () { return end('Die Spieler feiern dich.', fx(st, { team: 5, cash: [-cash(st, 150000), 'Prämien'] })); }),
        O('Selbstbewusst die Ziele erhöhen', function () { MX.say(st, 'press_goal_high', 'Wir wollen ganz nach oben', 'Siegesserie'); return end('Die Fans träumen – die Erwartung steigt.', fx(st, { fans: 4, board: 1 })); })
      ] } } };
  });
  add('injury_wave', function (st, c) {
    return { title: 'Verletzungswelle', cat: 'stab', imp: 'wichtig', img: 'medizin', max: 2, ic: '🚑', who: staffWho(st, 'arzt'),
      nodes: { start: { say: '„' + c.n + ' Spieler fallen aus' + (c.nt ? ', einige davon nach der Länderspielpause' : '') + '. Wir müssen reagieren.“', opts: [
        O('Talente aus dem Nachwuchs hochziehen', function () { var ys = (W.youthOf ? W.youthOf(st, cl(st).id) : []).sort(function (a, b) { return b.ovr - a.ovr; }).slice(0, 2); ys.forEach(function (y) { y.morale = clamp(y.morale + 8, 0, 100); MX.event(st, 'chance', { pid: y.id }); }); return end(ys.length ? ys.map(pname).join(' und ') + ' trainieren bei den Profis.' : 'Keine Talente verfügbar.', fx(st, { fans: { long: 2 } })); }, { def: true }),
        O('Trainingsbelastung senken', function () { cl(st).training = 'regeneration'; return end('Regenerationsschwerpunkt – weniger Risiko.', fx(st, { staff: ['arzt', 3] })); }),
        O('Medizinische Abteilung verstärken', function () { MX.squad(st).forEach(function (p) { if (p.inj && p.inj.weeks > 1) p.inj.weeks--; }); return end('Zusätzliche Physiotherapeuten verkürzen die Ausfälle.', fx(st, { cash: [-cash(st, 80000), 'Medizin'] })); })
      ] } } };
  });
  add('releg_fight', function (st, c) {
    return { title: 'Abstiegskampf', cat: 'kabine', imp: 'krise', img: 'abstieg', max: 2, ic: '⚔️', who: { n: 'Mannschaft', role: 'Kabine', ic: '👥' },
      nodes: { start: { say: 'Platz ' + c.pos + ' nach dem ' + st.week + '. Spieltag. Die Mannschaft schaut dich an. Welche Ansprache hältst du?', opts: [
        O('Wir gegen alle!', function () { return end('Trotz und Wut – die Mannschaft rückt zusammen.', fx(st, { team: 4, kab: 3 })); }, { def: true }),
        O('Ruhig und analytisch', function () { return end('Klare Aufgaben, weniger Panik.', fx(st, { kab: 2 })); }),
        O('Kurztrainingslager anordnen', function () { return end('Drei Tage Abgeschiedenheit.', fx(st, { kab: 3, team: 2, cash: [-cash(st, 50000), 'Trainingslager'] })); })
      ] } } };
  });
  add('season_review', function (st, c) {
    return { title: 'Saisonbilanz mit dem Vorstand', cat: 'vorstand', imp: c.good ? 'highlight' : 'wichtig', img: c.good ? 'meister' : 'vorstand', max: 1, ic: c.good ? '🏆' : '📋', who: person(st, 'pres'),
      nodes: { start: { say: c.txt, opts: [ O(c.good ? 'Danke – auf die nächste Saison!' : 'Verstanden', function () { return end(c.good ? 'Ein starkes Jahr für den Verein.' : 'Daraus lernen wir.', []); }, { def: true }) ] } } };
  });

  // ============================================================================================
  // PRIVATLEBEN DES MANAGERS (Daten & Beziehung)
  // ============================================================================================
  // Begegnungsorte und spontane Nachrichten (wie im Spielermodus: Kontaktliste, Dates, heimliche Beziehungen)
  var MEET_TXT = { gala: 'Bei der Sponsorengala sitzt ihr nebeneinander. Ihr lacht über dieselben schlechten Reden.', cafe: 'Im Café um die Ecke vom Trainingsgelände kommt ihr ins Gespräch – über alles außer ' + TM.sport + '.', freunde: 'Beim Abendessen bei Freunden ist auch {n} eingeladen.', charity: 'Beim Charity-Lauf lauft ihr die letzten Kilometer gemeinsam.',
    super: 'Im Supermarkt greift ihr nach derselben letzten Packung Pasta.', gym: 'Im Fitnessstudio um sechs Uhr morgens seid ihr die Einzigen auf den Laufbändern.', kunst: 'Auf einer Vernissage steht ihr ratlos vor demselben Bild.', hochzeit: 'Auf der Hochzeit eines alten Freundes landet ihr am selben Tisch.', zug: 'Im Zug zurück von einer Tagung ist nur noch der Platz neben {n} frei.', hund: 'Im Park verheddern sich eure Hundeleinen – und dann redet ihr eine halbe Stunde.' };
  var AWAY_TXT = { bar: 'Am Abend vor dem Spiel in {city} sitzt du noch an der Hotelbar. Neben dir: {n}.', lobby: 'In der Lobby des Mannschaftshotels in {city} wartest du auf den Bus – und kommst mit {n} ins Gespräch.', flug: 'Auf dem Flug nach {city} sitzt du neben {n}.', zug: 'Im Speisewagen auf dem Weg nach {city} teilst du dir den Tisch mit {n}.', fruehst: 'Beim Frühstück im Hotel in {city} gibt es nur noch einen freien Platz – bei {n}.' };
  var DM = { insta: ['Starke Pressekonferenz! Darf ich dich mal auf einen Kaffee einladen? ☕', 'Wir waren beide auf der Benefizgala, oder? Lust, mal was trinken zu gehen?', 'Sorry für die direkte Nachricht – aber du wirkst an der Seitenlinie viel lockerer als im Fernsehen 😊', 'Ich bin neu in der Stadt. Zeigst du mir, wo man hier gut essen kann?'],
    app: ['Hey! Bist du das wirklich – der Trainer? 😄', 'Endlich jemand, der auch früh aufsteht. Sonntag Frühstück?', 'Dein Profil sagt „wenig Zeit, viel Humor“. Klingt ehrlich. Kaffee?', 'Ich gebe zu: Ich hab dich erkannt. Ich frage trotzdem ganz normal – Lust auf ein Date?'] };
  function fnm(x) { return x ? x.name.split(' ')[0] : ''; }
  function lifeGain(x, v) { x.v = clamp((x.v || 50) + v, 0, 100); return { t: fnm(x) + ' ' + (v >= 0 ? '+' : '−') + Math.abs(v), pos: v > 0, neg: v < 0 }; }
  function keepCand(st, cd, stage, v) { var c = MX.cand(st, cd.id) || MX.addCand(st, cd); c.stage = Math.max(c.stage || 0, stage); if (v) c.v = Math.max(c.v, v); return c; }
  add('life_meet', function (st, c) {
    var cd = c.cand, lf = st.mx.life, pt = lf.partner; if (!cd) return null;
    var say = (MEET_TXT[cd.where] || 'Ihr kommt ins Gespräch.').replace('{n}', fnm(cd)) + ' ' + cd.name + ' arbeitet als ' + cd.job + ' und mag ' + (cd.intr || []).join(' und ') + '.' + (pt ? ' Zu Hause wartet ' + fnm(pt) + '.' : '');
    return { title: 'Eine Begegnung', cat: 'privat', imp: 'normal', img: 'date', max: 2, ic: '✨', who: { n: cd.name, role: cd.job + (MX.CSRC[cd.src || cd.where] ? ' · ' + MX.CSRC[cd.src || cd.where] : ''), ic: '🙂' },
      nodes: { start: { say: say, opts: [
        O('Nummern austauschen', function () { keepCand(st, cd, 1, 55); if (pt) { pt.v = clamp(pt.v - 1, 0, 100); } return end('Ein Lächeln. Mal sehen, was daraus wird.', fx(st, { stress: -3 })); }, { def: !pt }),
        O('Spontan auf einen Drink einladen', function () { if (hr('md' + cd.id, 4) < 0.35 + (cd.v - 50) / 60) { var k = keepCand(st, cd, 1, 62); k.dates = (k.dates || 0) + 1; if (pt) { MX.makePartner(st, k); return end('Aus einem Drink werden drei. Ihr verabredet euch wieder – heimlich.', [lifeGain(k, 4)].concat(fx(st, { stress: 3 }))); } return end(fnm(cd) + ' sagt ja. Ein Abend, der viel zu schnell vorbei ist.', [lifeGain(k, 6)].concat(fx(st, { stress: -4 }))); } return end(fnm(cd) + ' lacht: „Heute nicht – aber schreib mir.“', (keepCand(st, cd, 0), [])); }, { hint: pt ? 'Heimlich – Entdeckungsrisiko' : '' }),
        O(pt ? 'Abblocken – du bist vergeben' : 'Freundlich bleiben, kein Interesse', function () { if (pt) return end('Kurz und klar. Ein gutes Gefühl.', fx(st, { partner: 2 })); return end('Ein netter Abend – mehr nicht.', []); }, { def: !!pt }),
        O('Keine Zeit – der Job geht vor', function () { return end('Wieder ein Abend mit Videoanalyse.', fx(st, { stress: 2 })); })
      ] } } };
  });
  add('life_dm', function (st, c) {
    var cd = c.cand, lf = st.mx.life, pt = lf.partner; if (!cd) return null; var app = c.src === 'app';
    return { title: app ? 'Neues Match in der Dating-App' : 'Nachricht auf Instagram', cat: 'privat', imp: 'normal', img: 'date', max: 2, ic: '📱', who: { n: cd.name, role: (app ? 'Match · ' : 'Instagram · ') + cd.job, ic: '📱' },
      nodes: { start: { say: (app ? 'Die Dating-App meldet ein Match: ' + cd.name + ' (' + cd.job + '), mag ' + cd.intr.join(' und ') + '. Erste Nachricht: „' + c.msg + '“' : 'Eine Direktnachricht von ' + cd.name + ' (' + cd.job + '): „' + c.msg + '“') + (pt ? ' ' + fnm(pt) + ' sitzt neben dir.' : ''), opts: [
        O('Zurückschreiben und ein Treffen vorschlagen', function () {
          if (c.fake === 'presse') { if (pt) lf.suspect = tick(st) + 6; return end('Am Treffpunkt sitzt ein Boulevardreporter – das Profil war ein Köder. „Trainer beim Blind Date“ steht am nächsten Tag online.', fx(st, { media: -5, stress: 4, partner: pt ? -4 : 0 })); }
          if (c.fake === 'fake') return end('Niemand kommt. Kurz darauf ist das Profil gelöscht – ein Fake-Account.', fx(st, { stress: 2 }));
          if (c.fake === 'fan') return end('Am Treffpunkt wartet ein Fan mit Schal und drei Aufstellungsvorschlägen. Kein Date – aber ein ehrliches Gespräch über die Abwehr.', fx(st, { fans: 1 }));
          if (hr('dm' + cd.id, 5) < 0.5 + (cd.v - 50) / 70) { var k = keepCand(st, cd, 1, 58); if (pt) MX.makePartner(st, k); return end(fnm(cd) + ' antwortet sofort: „Sehr gern! Wann hast du Zeit?“' + (pt ? ' Du legst das Handy mit dem Display nach unten.' : ''), fx(st, { stress: pt ? 2 : -2 })); }
          keepCand(st, cd, 0); return end(fnm(cd) + ' antwortet erst nach Tagen: „Mal schauen …“', []); }, { def: !pt, hint: pt ? 'Heimlicher Kontakt – Entdeckungsrisiko' : '' }),
        O('Locker hin und her schreiben', function () { if (c.fake) return end('Nach ein paar Nachrichten fragt das Profil nach der Aufstellung. Du blockierst es.', []); var k = keepCand(st, cd, 0); k.v = clamp(k.v + 5, 0, 100); if (k.v >= 55) k.stage = 1; return end('Ein paar Abende lang schreibt ihr hin und her.' + (k.stage ? ' ' + fnm(k) + ' fragt nach einem Treffen.' : ''), []); }),
        O(pt ? 'Antworten: „Ich bin vergeben.“' : 'Nicht reagieren', function () { return end(pt ? 'Kurz und klar.' : 'Du wischst die Nachricht weg.', pt ? fx(st, { partner: 1 }) : []); }, { def: !!pt })
      ] } } };
  });
  add('life_away', function (st, c) {
    var cd = c.cand, lf = st.mx.life, pt = lf.partner; if (!cd) return null; var late = c.spot === 'bar' || c.spot === 'lobby';
    var opts = [O('Nummern tauschen', function () { keepCand(st, cd, 1, 56); return end(fnm(cd) + ' tippt die Nummer in dein Handy: „Melde dich, wenn du wieder in der Stadt bist.“', fx(st, { stress: -2 })); }, { def: !pt })];
    if (late) {
      opts.push(O('Noch einen Drink – trotz Spiel morgen', function () { var k = keepCand(st, cd, 1, 60); lifeGain(k, 6); if (pt) MX.makePartner(st, k); if (hr('aw' + cd.id, 2) < 0.3) return end('Um halb eins kommt der Kapitän an die Bar – und schaut dich lange an. Am nächsten Tag tuschelt die Kabine.', fx(st, { kab: -2, stress: 3, media: pt ? -2 : 0 })); return end('Ihr redet bis nach Mitternacht. Niemand hat es gemerkt.', fx(st, { stress: -3 })); }, { hint: 'Kabine und Presse könnten es mitbekommen' + (pt ? ' · heimlich' : '') }));
      opts.push(O('Mit aufs Zimmer nehmen', function () { var k = keepCand(st, cd, 1, 64); k.dates = (k.dates || 0) + 1; if (pt) MX.makePartner(st, k); else MX.chron(st, '🏨', 'Eine Nacht in ' + c.city, 'Mit ' + cd.name + '.', 1);
        if (hr('awz' + cd.id, 3) < 0.25) { lf.suspect = tick(st) + 8; return end('Ein Fotograf vor dem Hotel hat euch erwischt. Noch ist nichts erschienen – aber die Redaktion hat angerufen.', fx(st, { media: -4, stress: 6 })); }
        return end('Am Morgen ist ' + fnm(cd) + ' schon weg, nur ein Zettel liegt da. Bei der Mannschaftsbesprechung bist du nicht ganz bei der Sache.', fx(st, { stress: pt ? 4 : 1 })); }, { hint: pt ? 'Heimliche Beziehung – Entdeckungsrisiko' : 'Fotografen und Kabine sind nie weit' }));
    } else opts.push(O('Die ganze Fahrt über reden', function () { var k = keepCand(st, cd, 1, 58); lifeGain(k, 8); return end('Die Fahrt vergeht wie im Flug. Beim Aussteigen: „Sehen wir uns wieder?“', fx(st, { stress: -3 })); }));
    opts.push(O('Höflich bleiben – Fokus auf das Spiel', function () { return end('Du gehst früh auf dein Zimmer und schaust noch einmal die Gegneranalyse durch.', fx(st, { stress: 1, partner: pt ? 1 : 0 })); }, { def: !!pt }));
    return { title: 'Begegnung auf der Auswärtsfahrt', cat: 'privat', imp: 'normal', img: 'date', max: 2, ic: '🧳', who: { n: cd.name, role: cd.job + ' · ' + MX.CSRC.away, ic: '🧳' },
      nodes: { start: { say: (AWAY_TXT[c.spot] || 'Auf der Fahrt nach {city} lernst du {n} kennen.').replace('{city}', c.city).replace('{n}', cd.name) + ' ' + fnm(cd) + ' ist ' + cd.job + (cd.football >= 6 ? ' und erkennt dich sofort.' : ' und hat keine Ahnung, wer du bist.') + (late ? ' Morgen ist Anpfiff.' : '') + (pt ? ' Zu Hause wartet ' + fnm(pt) + '.' : ''), opts: opts } } };
  });
  add('life_date', function (st, c) {
    var lf = st.mx.life, x = (c.cid && MX.cand(st, c.cid)) || lf.partner || (lf.cands || []).filter(function (y) { return (y.stage || 0) >= 1; })[0] || lf.cands[0]; if (!x) return null;
    var isP = x === lf.partner, gain = function (v) { return lifeGain(x, v); };
    var role = x.job + (isP ? ' · ' + MX.LSTAGE[x.stage || 1] : x.aff ? ' · heimlich' : ' · Date ' + ((x.dates || 0) + 1));
    function hit(k) { return (x.intr || []).indexOf(k) >= 0; }
    var endOpts = [];
    if (!isP && !lf.partner && (x.dates || 0) >= 1 && x.v >= 58) endOpts.push(O('Eine feste Beziehung vorschlagen', function () { lf.lastDate = tick(st); x.dates = (x.dates || 0) + 1; if (hr('fb' + x.id + x.dates, 6) < 0.45 + (x.v - 58) / 50) { MX.makePartner(st, x); x.stage = 2; lf.status = 'partner'; MX.chron(st, '❤️', 'Feste Beziehung', 'Mit ' + x.name + '.', 2); return end(fnm(x) + ' sagt Ja. Ihr seid jetzt ein Paar.', fx(st, { stress: -6 })); } x.v = clamp(x.v - 4, 0, 100); return end(fnm(x) + ': „Ich brauche noch etwas Zeit.“', []); }, { def: true }));
    endOpts.push(O('Ein nächstes Treffen vorschlagen', function () {
      lf.lastDate = tick(st); lf.dates++; x.dates = (x.dates || 0) + 1; x.lastD = tick(st);
      if (isP) { if (x.stage === 1 && x.v >= 65 && lf.dates >= 3) { x.stage = 2; lf.status = 'partner'; MX.chron(st, '❤️', 'Feste Beziehung', 'Mit ' + x.name + '.', 2); } return end('Ihr seid euch nähergekommen.', fx(st, { stress: -4 })); }
      x.stage = Math.max(x.stage || 0, 1);
      if (lf.partner && !x.aff) { MX.makePartner(st, x); return end('Ihr verabredet euch wieder – heimlich.', fx(st, { stress: 2 })); }
      if (x.aff) return end('Das nächste heimliche Treffen ist ausgemacht.', fx(st, { stress: 1 }));
      return end(x.v >= 55 ? fnm(x) + ' freut sich schon.' : 'Vielleicht beim nächsten Mal.', fx(st, { stress: -4 })); }, { def: !endOpts.length }));
    endOpts.push(O('Früh nach Hause – morgen ist Training', function () { lf.lastDate = tick(st); return end('Pflichtbewusst. Ein bisschen schade.', [gain(-2)]); }));
    return { title: 'Date mit ' + fnm(x), cat: 'privat', imp: 'normal', img: 'date', max: 3, ic: x.aff ? '🤫' : '🍷', who: { n: x.name, role: role, ic: '🙂' },
      nodes: {
        start: { say: 'Wohin soll es gehen? ' + fnm(x) + ' mag ' + (x.intr || ['gutes Essen']).join(' und ') + '.' + (x.aff ? ' Hauptsache, niemand erkennt euch.' : ''), opts: [
          O('Kleines italienisches Restaurant', function () { return nx('Gemütlich, gutes Essen.', [gain(hit('Kochen') ? 6 : 3)], 'talk'); }, { def: true }),
          O('Spaziergang am Fluss', function () { return nx('Ruhig – endlich mal kein Handy.', [gain(hit('Wandern') || hit('Laufen') ? 7 : 4)].concat(fx(st, { stress: -3 })), 'talk'); }),
          O('Konzert oder Ausstellung', function () { return nx(hit('Musik') || hit('Kunst') || hit('Tanzen') ? fnm(x) + ' strahlt – genau das Richtige.' : 'Ein schöner Abend.', [gain(hit('Musik') || hit('Kunst') || hit('Tanzen') ? 8 : 3)], 'talk'); }),
          O('Logenplatz beim eigenen Heimspiel', function () { var fan = (x.football || 5) >= 6; if (x.aff) lf.suspect = tick(st) + 4; return nx(fan ? 'Begeisterung! „So nah dran war ich noch nie.“' : 'Höfliches Interesse … der Abend gehört eher dem Verein.', [gain(fan ? 5 : -3)], 'talk'); }, { hint: x.aff ? 'Viele Kameras im Stadion' : '' })
        ] },
        talk: { say: 'Worüber redet ihr?', opts: [
          O('Über ' + fnm(x) + 's Arbeit', function () { return nx('Du hörst zu – das kommt an.', [gain(5)], 'end'); }, { def: true }),
          O('Über den Verein', function () { return nx((x.football || 5) >= 6 ? 'Lebhafte Diskussion über Taktik.' : 'Ein Blick auf die Uhr …', [gain((x.football || 5) >= 6 ? 3 : -4)], 'end'); }),
          O('Über Träume und Pläne', function () { return nx('Ein tiefes Gespräch. Es fühlt sich richtig an.', [gain(6)], 'end'); })
        ] },
        end: { say: 'Der Abend geht zu Ende. ' + fnm(x) + ' wirkt ' + (x.v >= 65 ? 'sehr glücklich' : x.v >= 50 ? 'zufrieden' : 'nachdenklich') + '.', opts: endOpts }
      } };
  });
  add('life_aff_caught', function (st, c) {
    var lf = st.mx.life, pt = lf.partner, x = MX.cand(st, c.cid);
    if (pt && x && !c.ps) { c.ps = { name: pt.name, stage: pt.stage || 1, v: pt.v }; c.xs = { id: x.id, name: x.name }; }
    if (c.ps && (!pt || !x || pt === x)) { pt = c.ps; x = x || c.xs; } // nach Trennung/Entscheidung bleibt die Antwort sichtbar
    if (!pt || !x) return null;
    return { title: c.press ? 'Boulevard: Doppelleben?' : 'Aufgeflogen', cat: 'privat', imp: 'wichtig', img: 'familie', max: 1, ic: c.press ? '📰' : '💔', who: { n: pt.name, role: MX.LSTAGE[pt.stage || 1], ic: '💔' },
      nodes: { start: { say: (c.press ? 'Die Klatschpresse zeigt Fotos von dir und ' + x.name + '. „Trainer mit Doppelleben?“ – ' : 'Eine Nachricht von ' + fnm(x) + ' leuchtet auf deinem Handy auf, ') + fnm(pt) + ' hat es gesehen: „Wer ist ' + fnm(x) + '? Und sag mir jetzt die Wahrheit.“', opts: [
        O('Alles gestehen und um Verzeihung bitten', function () { MX.candEnd(st, x.id, 'Du hast die Sache mit ' + x.name + ' beendet.'); MX.affs(st).forEach(function (y) { MX.candEnd(st, y.id); }); if (pt.v >= 55 || pt.stage >= 4) return end('Eine lange, schmerzhafte Nacht. ' + fnm(pt) + ' gibt euch noch eine Chance – unter Bedingungen.', fx(st, { partner: -25, stress: 10, media: c.press ? -8 : 0, mrep: c.press ? -2 : 0 })); MX.breakup(st, 'Die Affäre mit ' + x.name + ' ist aufgeflogen.'); return end(fnm(pt) + ' packt noch in der Nacht die Koffer.', fx(st, { stress: 8, media: c.press ? -8 : 0, mrep: c.press ? -2 : 0 })); }, { def: true }),
        O('Alles abstreiten', function () { if (!c.press && hr('deny' + tick(st), 2) < 0.45) { lf.suspect = tick(st) + 12; return end('„Nur eine Bekannte aus dem Fitnessstudio.“ ' + fnm(pt) + ' glaubt dir – vorerst.', fx(st, { partner: -8, stress: 6 })); } MX.breakup(st, 'Gelogen – und erwischt.'); return end('Die Lüge hält keine fünf Minuten. ' + fnm(pt) + ' geht.', fx(st, { stress: 12, media: c.press ? -10 : 0, mrep: c.press ? -3 : 0 })); }),
        O('Dich für ' + fnm(x) + ' entscheiden', function () { MX.affOfficial(st, x.id); return end('Es ist vorbei mit ' + fnm(pt) + '. Ab jetzt gehört ' + fnm(x) + ' offiziell zu deinem Leben.', fx(st, { stress: 8, media: c.press ? -6 : 0 })); })
      ] } } };
  });
  // Proaktiv über „Privatleben“: ausgehen oder die Dating-App öffnen (je einmal pro Woche)
  MEET_TXT.bar = 'An der Bar bestellt {n} denselben Drink wie du – und muss lachen.'; MEET_TXT.wein = 'In der Weinbar teilt ihr euch notgedrungen den letzten freien Tisch.'; MEET_TXT.club = 'Auf der Tanzfläche wirst du angerempelt – {n} entschuldigt sich mit einem Lächeln.';
  MX.outFree = function (st) { var lf = st.mx.life; return lf.outT == null || tick(st) - lf.outT >= 1; };
  MX.appFree = function (st) { var lf = st.mx.life; return lf.appT == null || tick(st) - lf.appT >= 1; };
  add('life_out', function (st, c) {
    var lf = st.mx.life, pt = lf.partner, l = st.mx.last || {}, bad = (l.streak || 0) <= -2;
    function out(kind, label) {
      lf.outT = tick(st); var k = hr('out' + kind + tick(st) + (st.seed || 0), 1), fan = hr('outf' + tick(st) + (st.seed || 0), 2), spec = { stress: kind === 'home' ? -2 : -5 };
      if (pt && kind !== 'team' && kind !== 'home') spec.partner = -1;
      if (kind === 'home') return end('Sofa, Tee, eine alte Doku. Auch mal schön.', fx(st, spec));
      if (kind === 'team') { spec.kab = 1; return end('Ein lockerer Abend mit dem Trainerteam. Gut fürs Klima – geflirtet wird heute nicht.', fx(st, spec)); }
      if ((bad && fan < 0.4) || (kind === 'club' && fan < 0.15)) { spec.fans = -3; spec.media = -2; return end(bad ? 'Ein Handyvideo macht die Runde: Der Trainer feiert – nach ' + Math.abs(l.streak) + ' Niederlagen in Folge. Die Fans sind nicht amüsiert.' : 'Fotos von dir auf der Tanzfläche landen im Netz. „Hat der Trainer nichts Besseres zu tun?“', fx(st, spec)); }
      if ((lf.cands || []).length < 4 && k < { bar: 0.5, wein: 0.4, club: 0.6 }[kind] - (pt ? 0.15 : 0)) { var cd = MX.newCand(st, kind); cd.src = 'out'; MX.start(st, 'life_meet', { cand: cd }, { prio: 6 }); return end(label + ' – und dann kommst du mit jemandem ins Gespräch …', fx(st, spec)); }
      return end(label + '. Heute ohne neue Bekanntschaft, aber der Kopf ist frei.', fx(st, spec));
    }
    return { title: 'Ausgehen', cat: 'privat', imp: 'normal', img: 'date', max: 1, ic: '🍸', who: { n: 'Freier Abend', role: pt ? 'ohne ' + fnm(pt) : 'Single', ic: '🍸' },
      nodes: { start: { say: 'Ein freier Abend. Wohin geht es?' + (pt ? ' ' + fnm(pt) + ' hat heute eigene Pläne.' : '') + (bad ? ' Nach der Niederlagenserie schauen allerdings viele genau hin.' : ''), opts: [
        O('Mit Freunden in eine Bar', function () { return out('bar', 'Ein langer Abend mit alten Freunden'); }),
        O('Weinbar in der Altstadt', function () { return out('wein', 'Ruhige Musik, guter Wein'); }),
        O('In einen Club – mal richtig feiern', function () { return out('club', 'Bis spät in die Nacht auf der Tanzfläche'); }, { hint: 'Fotos und Handyvideos – Fans und Medien könnten es mitbekommen' }),
        O('Afterwork mit dem Trainerteam', function () { return out('team', ''); }),
        O('Doch lieber zu Hause bleiben', function () { return out('home', ''); }, { def: true })
      ] } } };
  });
  add('life_app', function (st, c) {
    var lf = st.mx.life, pt = lf.partner, cs = c.cands || []; if (!cs.length) return null;
    function like(cd, f) { return hr('app' + cd.id, 9) < clamp(0.35 + (cd.v - 50) / 60 + ((st.manager.reputation || 40) - 40) / 300, 0.1, 0.85) * (f || 1); }
    // Nutzung merken (lf.app); in einer Beziehung kann es sofort auffliegen – das Gespräch folgt direkt danach
    function used(m) { var t = tick(st), a = lf.app && lf.app.on ? lf.app : (lf.app = { on: true, n: 0, m: 0, single: !pt, t0: t }); lf.appT = t; a.t = t; a.n = (a.n || 0) + 1; a.m = (a.m || 0) + (m || 0);
      if (pt) { a.pt = 1; a.single = false; lf.suspect = Math.max(lf.suspect || 0, t + 6); if (hr('appl' + t + (st.seed || 0), 4) < 0.08 + (st.manager.reputation || 40) / 700 + (pt.stage >= 3 ? 0.04 : 0)) return true; } return false; }
    function leakEnd(txt) { MX.start(st, 'life_app_found', { how: hr('applh' + tick(st), 5) < 0.5 ? 'fan' : 'notif' }, { prio: 8 }); return end(txt + ' Dann leuchtet dein Handy auf – und ' + fnm(pt) + ' sitzt direkt daneben.', fx(st, { stress: 4 })); }
    var opts = cs.map(function (cd) {
      return O('💘 ' + fnm(cd) + ' liken', function () { var hit = like(cd), leak = used(hit ? 1 : 0), txt;
        if (hit) { keepCand(st, cd, 1, 56); txt = 'Match! ' + fnm(cd) + ' schreibt: „Hey! Dein Profil hat mich neugierig gemacht. Kaffee diese Woche?“'; }
        else txt = 'Kein Match – ' + fnm(cd) + ' hat weitergewischt.';
        return leak ? leakEnd(txt) : end(txt, fx(st, { stress: -1 })); }, { hint: pt ? 'Heimlich – Entdeckungsrisiko' : '' });
    });
    opts.push(O('Allen dreien ein Like geben', function () { var hit = cs.filter(function (cd) { return like(cd, 0.6); }), leak = used(hit.length);
      hit.forEach(function (cd) { keepCand(st, cd, 1, 55); });
      var txt = hit.length ? 'Match mit ' + hit.map(fnm).join(' und ') + '! Jetzt heißt es: Nachrichten beantworten.' : 'Kein einziges Match. Vielleicht wirkt das Profil zu sehr nach Pressekonferenz.';
      return leak ? leakEnd(txt) : end(txt, []); }, { hint: pt ? 'Heimlich – Entdeckungsrisiko' : 'Weniger Chancen je Person' }));
    if (pt && lf.app && lf.app.on) opts.push(O('Profil löschen und die App deinstallieren', function () { lf.app.on = false; lf.appT = tick(st); return end('Weg damit. Das Risiko ist kleiner – ganz verschwunden ist es nicht, solange es Screenshots gibt.', fx(st, { stress: -1 })); }));
    opts.push(O('App wieder schließen', function () { return end('Du legst das Handy weg.', []); }, { def: true }));
    return { title: 'Dating-App', cat: 'privat', imp: 'normal', img: 'date', max: 1, ic: '💘', who: { n: 'Dating-App', role: pt ? 'Profil unter anderem Namen' : 'Dein Profil', ic: '💘' },
      nodes: { start: { say: (pt ? (lf.app && lf.app.on && lf.app.pt ? 'Dein geheimes Profil unter anderem Namen ist noch online – ' : lf.app && lf.app.on ? 'Dein altes Profil aus der Single-Zeit ist noch online – ' : 'Du legst dir heimlich ein Profil unter anderem Namen an – ') + fnm(pt) + ' darf davon nichts wissen. ' : '') + 'Drei Profile in deiner Nähe: ' + cs.map(function (cd) { return cd.name + ' (' + cd.job + ', mag ' + cd.intr.join(' und ') + ')'; }).join(' · ') + '.', opts: opts } } };
  });
  // Eskalation: Partnerin/Partner entdeckt das Dating-Profil (Benachrichtigung, Freundin, Fangruppe, Handy, Boulevard)
  MX.appOn = function (st) { var lf = st.mx.life; return lf.app && lf.app.on ? lf.app : null; };
  MX.appRisk = function (st) {
    var lf = st.mx.life, a = MX.appOn(st), pt = lf.partner; if (!a || !pt) return 0; var t = tick(st), fresh = t - (a.t || 0);
    var r = (a.single && !a.pt ? 0.025 : 0.05) + Math.min(5, a.n || 1) * 0.01 + Math.min(3, a.m || 0) * 0.015 + (st.manager.reputation || 40) / 2500 + (pt.stage >= 3 && !pt.ld ? 0.03 : 0) + (lf.suspect > t ? 0.05 : 0) + (lf.phoneOpen > t ? 0.15 : 0) + (fresh <= 2 ? 0.02 : 0);
    return clamp(fresh > 12 ? r * 0.5 : r, 0, 0.4);
  };
  add('life_app_found', function (st, c) {
    var lf = st.mx.life, pt = lf.partner || c.ps; if (!pt) return null; // nach einer Trennung im Gespräch bleibt die Ansicht (Reaktion) erhalten
    if (c.k == null) { c.ps = { name: pt.name, stage: pt.stage || 1, v: pt.v, job: pt.job }; var a = lf.app || {}; c.k = lf.appCaught || 0; c.single = a.single && !a.pt ? 1 : 0; c.m = a.m || 0; var mt = (lf.cands || []).filter(function (y) { return (y.src === 'app' || y.where === 'app') && (y.stage || 0) >= 1; })[0]; c.mn = mt ? mt.name : ''; lf.appCaught = c.k + 1;
      MX.chron(st, '💘', 'Dating-Profil entdeckt', fnm(pt) + ' hat dein Profil in der Dating-App gefunden' + (c.how === 'press' ? ' – über die Boulevardpresse.' : '.'), 2);
      if (c.how === 'press') fx(st, { media: -8, fans: -2, spons: -3, stress: 8 }); else if (c.how === 'fan') fx(st, { media: -3, stress: 5 }); else fx(st, { stress: 5 }); }
    var n = fnm(pt), wed = pt.stage >= 5, home = pt.stage >= 3;
    function brk(why, txt, spec) { MX.breakup(st, why); if (lf.app) lf.app.on = false; return end(txt, fx(st, spec || { stress: 8 }), { img: 'f' }); }
    function del() { if (lf.app) lf.app.on = false; }
    var intro = { notif: 'Dein Handy liegt auf dem Tisch, als der Bildschirm aufleuchtet: „💘 Neues Match!“ ' + n + ' hat es gesehen. Ganz leise: „Was. Ist. Das.“',
      fan: 'Ein Screenshot deines Profils kursiert in einer Fangruppe – „Ist das nicht unser Trainer?“. ' + n + ' hat ihn auch bekommen und hält dir das Handy hin.',
      friend: n + ' kommt nach Hause und knallt das Handy auf den Tisch: „Meine Freundin hat dich in der Dating-App gefunden. Unter falschem Namen. Erklär mir das.“',
      phone: n + ' sucht auf deinem Handy ein Foto vom Urlaub – und findet die Dating-App. Dein Profil, ' + (c.m ? c.m + (c.m === 1 ? ' Match' : ' Matches') : 'Likes') + ', offene Chats. „Ernsthaft?!“',
      press: 'Die Schlagzeile ist überall: „Vergeben – und trotzdem auf der Suche? Trainer mit geheimem Dating-Profil“. ' + n + ' hat es vor dir gelesen.' }[c.how] || (n + ' hat dein Dating-Profil gefunden.');
    return { title: 'Das Dating-Profil', cat: 'privat', imp: 'wichtig', img: 'familie', max: 3, ic: c.how === 'press' ? '📰' : '💥', who: { n: pt.name, role: MX.LSTAGE[pt.stage || 1], ic: '💔' },
      nodes: {
        start: { say: intro + (wed ? ' „Wir sind verheiratet!“' : '') + (c.k ? ' „Und das nicht zum ersten Mal. Du hattest es mir versprochen!“' : ''), opts: [
          O('Ehrlich zugeben und die App vor den Augen löschen', function () { del(); var stay = clamp((pt.v - 25) / 100 + (wed ? 0.08 : 0) - c.k * 0.25 - (c.how === 'press' ? 0.1 : 0) - MX.affs(st).length * 0.1 + (c.single ? 0.15 : 0), 0.03, 0.65);
            if (hr('apf1' + tick(st) + (st.seed || 0), 1) < stay) return nx('Du löschst das Profil, während ' + n + ' zusieht. Lange Stille. Dann: „Gut. Aber so einfach ist das nicht.“', fx(st, { partner: c.single ? -10 : -20, stress: 3 }), 'terms', { img: 'e' });
            return brk('das geheime Dating-Profil', '„Löschen? Das ändert nichts daran, dass du gesucht hast.“ ' + n + ' packt noch am selben Abend die Sachen.', { stress: 10 }); }, { def: true }),
          O(c.single ? 'Erklären: „Das ist mein alter Account von früher!“' : 'Ausrede: „Das war nur aus Neugier, ich schwöre.“', function () { var ok = clamp((c.single ? 0.65 : 0.25) - c.k * 0.2 + (pt.v - 50) / 200, 0, 0.8); if (c.how === 'press' && !c.single) ok = 0;
            if (hr('apf2' + tick(st) + (st.seed || 0), 2) < ok) { del(); lf.suspect = tick(st) + 12; return end(n + ' mustert dich lange. „Dann lösch ihn. Jetzt.“ Du tust es. Das Misstrauen bleibt.', fx(st, { partner: -6, stress: 4 })); }
            return nx('„Neugier?“ ' + n + ' greift nach deinem Handy …', fx(st, { partner: -12, stress: 5 }), 'escal'); }),
          O(c.how === 'friend' ? 'Gegenangriff: „Und was macht deine Freundin in einer Dating-App?!“' : c.how === 'press' || c.how === 'fan' ? 'Gegenangriff: „Glaubst du jetzt irgendwelchen Screenshots mehr als mir?!“' : 'Gegenangriff: „Du schnüffelst in meinem Handy?!“', function () {
            if (hr('apf3' + tick(st) + (st.seed || 0), 3) < clamp(0.3 + c.k * 0.3 - (wed ? 0.1 : 0), 0.1, 0.9)) return brk('der Streit um das Dating-Profil', 'Es wird laut. Sehr laut. Irgendwann knallt die Tür – und ' + n + ' kommt nicht zurück.', { stress: 12 });
            return nx('Es fliegen Worte, die man nicht zurücknehmen kann. Die Nachbarn klopfen an die Wand.', fx(st, { partner: -15, stress: 8 }), 'cold', { img: 'd' }); }, { hint: 'Eskaliert den Streit' }),
          O('Schluss machen – vielleicht ist es besser so', function () { return brk('du hast nach dem Dating-Profil Schluss gemacht', 'Ehrlicher als alles andere heute Abend. Trotzdem tut es weh.', { stress: 6 }); })
        ] },
        escal: { say: n + ' scrollt durch deine Chats. ' + (c.mn ? 'Da ist ' + c.mn.split(' ')[0] + ': „Freu mich auf Freitag 😘“. ' : 'Flirts, Herzchen, ein vorgeschlagenes Treffen. ') + '„Nur aus Neugier? Die letzte Nachricht ist von gestern!“ Das Handy fliegt aufs Sofa.' + (home ? ' „Ich will dich heute nicht in dieser Wohnung haben.“' : ''), opts: [
          O('Um Verzeihung bitten: „Ich lösche alles. Bitte.“', function () { del(); (lf.cands || []).filter(function (y) { return (y.src === 'app' || y.where === 'app') && !y.aff; }).forEach(function (y) { MX.candEnd(st, y.id); });
            if (hr('apf4' + tick(st) + (st.seed || 0), 4) < clamp((pt.v - 20) / 140 - c.k * 0.2 + (wed ? 0.08 : 0), 0.03, 0.45)) return nx('Tränen, Schweigen, noch mehr Tränen. Gegen Morgen: „Ich bin noch nicht fertig mit dir. Aber wenn, dann gibt es Regeln.“', fx(st, { partner: -15, stress: 5 }), 'terms', { img: 'e' });
            return brk('Lügen um das Dating-Profil', '„Erst lügst du, dann bettelst du.“ ' + n + ' geht – endgültig.', { stress: 12 }); }, { def: true }),
          O('Weiter abstreiten', function () { return brk('dreiste Lügen um das Dating-Profil', home ? 'Als du vom Training kommst, stehen deine Sachen in Kartons vor der Tür. Das Schloss ist ausgetauscht.' : n + ' blockiert deine Nummer. Auf Instagram ist von euch kein Foto mehr übrig.', { stress: 15, kab: home ? -1 : 0 }); }, { hint: 'Fast sicher das Ende' }),
          O('Erst einmal raus – im Hotel schlafen', function () { lf.suspect = tick(st) + 16; return end('Zwei Nächte im Hotel neben dem Trainingsgelände. Der Zeugwart hat dich gesehen – die Kabine tuschelt. ' + n + ' antwortet nur einsilbig.', fx(st, { partner: -8, stress: 7, kab: -1, cash: [-(D.MONEY ? 30 : 300), 'Privat'] })); })
        ] },
        terms: { say: '„Wenn wir weitermachen, dann nicht einfach so. Was bist du bereit zu tun?“', opts: [
          O('Handy offenlegen – keine Geheimnisse mehr', function () { del(); lf.phoneOpen = tick(st) + 26; lf.suspect = tick(st) + 20; return end('Du gibst ' + n + ' deinen Code. Es fühlt sich an wie eine Kontrolle – und wie ein Anfang.', fx(st, { partner: 6, stress: 2 })); }, { hint: 'Heimliche Kontakte fliegen dann schneller auf', def: true }),
          O('Paartherapie vorschlagen', function () { lf.suspect = tick(st) + 12; return end('„Okay. Wir versuchen es.“ Die erste Sitzung ist unangenehm ehrlich – aber ihr redet wieder miteinander.', fx(st, { partner: 10, stress: -2, cash: [-(D.MONEY ? 60 : 600), 'Privat'] })); }),
          O('„Ich lasse mich nicht kontrollieren.“', function () { if (hr('apf5' + tick(st) + (st.seed || 0), 5) < 0.45 + c.k * 0.2) return brk('kein Einsehen nach dem Dating-Profil', '„Dann gibt es nichts mehr zu besprechen.“ Die Tür fällt ins Schloss.', { stress: 8 });
            return end('Ihr bleibt zusammen – irgendwie. Die Stimmung zu Hause ist eisig.', fx(st, { partner: -12, stress: 5 })); })
        ] },
        cold: { say: '„Ich brauche Abstand.“ ' + n + ' packt eine Tasche. „Ich schlafe ein paar Tage woanders. Ruf mich nicht an.“', opts: [
          O('Hinterherlaufen und um Verzeihung bitten', function () { del(); if (hr('apf6' + tick(st) + (st.seed || 0), 6) < clamp((pt.v - 15) / 120, 0.05, 0.5)) return nx(n + ' bleibt im Treppenhaus stehen. „Sag mir, warum ich bleiben sollte.“', fx(st, { stress: 2 }), 'terms', { img: 'e' });
            return end('Die Haustür fällt zu. Drei Tage später kommt eine kurze Nachricht: „Wir reden, wenn ich so weit bin.“', fx(st, { partner: -5, stress: 5 })); }, { def: true }),
          O('Gehen lassen', function () { lf.suspect = tick(st) + 20; if (pt.v < 26) return brk('Funkstille nach dem Streit um das Dating-Profil', 'Aus ein paar Tagen wird eine Woche. Dann holt ' + n + ' die restlichen Sachen ab.', { stress: 8 });
            return end('Die Wohnung ist still. Zu still. Bei der Videoanalyse bist du mit dem Kopf woanders.', fx(st, { partner: -8, stress: 6, kab: -1 })); })
        ] }
      } };
  });
  add('life_partner_talk', function (st, c) {
    var lf = st.mx.life, pt = lf.partner; if (!pt) return null; return { title: 'Gespräch mit ' + pt.name.split(' ')[0], cat: 'privat', imp: 'wichtig', img: 'familie', max: 2, ic: '🏠', who: { n: pt.name, role: MX.LSTAGE[pt.stage] + ' · ' + pt.job, ic: '❤️' },
      nodes: { start: { say: '„Du bist kaum noch da. Und wenn, dann denkst du an den Verein. Ich fühle mich allein.“', opts: [
        O('Feste freie Abende versprechen', function () { MX.say(st, 'life_promise', 'Freie Abende versprochen'); lf.promiseT = tick(st); return end('„Ich nehme dich beim Wort.“', fx(st, { partner: 8, stress: -2 })); }, { def: true }),
        O('Erklären, dass es gerade die Krise ist', function () { return end('„Es ist immer irgendeine Krise.“', fx(st, { partner: -3 })); }),
        O('Kurzurlaub in der Länderspielpause planen', function () { return end('Zwei Tage Ostsee – nur ihr beide.', fx(st, { partner: 10, stress: -8, cash: [-(D.MONEY ? 80 : 800), 'Privat'] })); })
      ] } } };
  });
  add('life_stage', function (st, c) {
    var lf = st.mx.life, pt = lf.partner; if (!pt) return null; var next = pt.stage + 1, lbl = { 3: 'Zusammenziehen', 4: 'Heiratsantrag', 5: 'Hochzeit' }[next];
    return { title: lbl + '?', cat: 'privat', imp: 'highlight', img: 'familie', max: 1, ic: '💍', who: { n: pt.name, role: MX.LSTAGE[pt.stage], ic: '❤️' },
      nodes: { start: { say: next === 3 ? '„Wollen wir zusammenziehen?“' : next === 4 ? 'Du denkst über einen Heiratsantrag nach. Der Ring liegt schon in der Schublade.' : 'Die Hochzeit steht an – mitten in der Saison?', opts: [
        O('Ja!', function () { pt.stage = next; lf.status = next >= 5 ? 'verheiratet' : next === 4 ? 'verlobt' : 'partner'; MX.chron(st, next === 5 ? '💒' : next === 4 ? '💍' : '🏡', MX.LSTAGE[next], 'Mit ' + pt.name + '.', next >= 4 ? 3 : 2); return end('Ein großer Schritt.', fx(st, { partner: 10, stress: -5 })); }, { def: true }),
        O('Noch nicht', function () { return end('„Okay … dann eben später.“', fx(st, { partner: -6 })); })
      ] } } };
  });
  add('life_move', function (st, c) {
    var lf = st.mx.life, pt = lf.partner; if (!pt) return null; return { title: 'Neuer Verein – neue Stadt?', cat: 'privat', imp: 'wichtig', img: 'familie', max: 1, ic: '📦', who: { n: pt.name, role: MX.LSTAGE[pt.stage], ic: '❤️' },
      nodes: { start: { say: '„Du hast in ' + c.city + ' unterschrieben. Und was wird aus uns? Ich habe hier meinen Job.“', opts: [
        O('Gemeinsam umziehen', function () { var ok = pt.v >= 55 || pt.stage >= 4; if (!ok) { MX.breakup(st, 'Umzug nach ' + c.city + ' – getrennte Wege.'); return end('Ihr geht getrennte Wege.', fx(st, { stress: 10 })); } return end('Ihr wagt den Neuanfang zusammen.', fx(st, { partner: 4 })); }, { def: true }),
        O('Fernbeziehung versuchen', function () { pt.ld = 1; return end('Viele Kilometer, viele Telefonate.', fx(st, { partner: -4, stress: 4 })); })
      ] } } };
  });

  // ============================================================================================
  // REGISSEUR
  // ============================================================================================
  // Ereignistabelle: { id, dlg, cat, cd (Wochen), w (Gewicht), when(st) → ctx | null }
  var EV = [];
  function ev(id, cat, cd, w, when, dlg) { EV.push({ id: id, cat: cat, cd: cd, w: w, when: when, dlg: dlg || id }); }
  MX.EV = EV;
  function sq(st) { return MX.squad(st); }
  ev('bench_talk', 'kabine', 6, 3, function (st) { var c = sq(st).filter(function (p) { var r = MX.pl(st, p); return r.bench >= 4 && MX.pers(p).amb >= 11 && tick(st) - r.last > 10 && !MX.openPromises(st, p.id).length; })[0]; return c ? { pid: c.id, n: MX.pl(st, c).bench } : null; });
  ev('pen_conflict', 'kabine', 30, 4, function (st) { var club = cl(st), l = st.mx.last; if (!club || !club.pen || !l.pen || l.pen === club.pen) return null; var nw = st.players[club.pen], old = st.players[l.pen]; if (!nw || !old || nw.joined !== st.season || old.clubId !== club.id || (club.captain !== old.id && MX.pers(old).amb < 13)) return null; return { cap: old.id, nw: nw.id }; });
  ev('diva', 'kabine', 20, 2, function (st) { var c = sq(st).filter(function (p) { return st.mx.roles[p.id] === 'diva'; })[0]; return c && st.week > 4 ? { pid: c.id } : null; });
  ev('transfer_wish', 'transfer', 10, 3, function (st) { var c = sq(st).filter(function (p) { var r = MX.pl(st, p); return r.wish === 'wechsel' && !p.listed; })[0]; if (c) { MX.pl(st, c).wish = null; return { pid: c.id, why: 'Mir wurde zu viel versprochen und zu wenig gehalten.' }; } return null; });
  ev('captain_unrest', 'kabine', 16, 3, function (st) { var club = cl(st), p = club && st.players[club.captain]; if (!p || p.clubId !== club.id) return null; var r = MX.pl(st, p); return (p.morale < 40 || r.rel < 30) && st.mx.last.streak <= -2 ? { pid: p.id } : null; });
  ev('leader_mediates', 'kabine', 12, 3, function (st) { if (!st.mx.mem.conf.some(function (c) { return !c.done; })) return null; var l = sq(st).filter(function (p) { var r = st.mx.roles[p.id]; return (r === 'lead' || r === 'glue' || r === 'kap') && MX.pers(p).lead >= 13; })[0]; return l ? { pid: l.id } : null; });
  ev('mentor', 'nachwuchs', 30, 1.5, function (st) { if (st.mx.mentor && st.mx.mentor.until > tick(st)) return null; var m = sq(st).filter(function (p) { return p.age >= 30 && MX.pers(p).team >= 13; })[0], y = sq(st).filter(function (p) { return p.age <= 20 && p.pot - p.ovr >= 8; })[0]; return m && y ? { mid: m.id, yid: y.id } : null; });
  ev('disappointing_signing', 'transfer', 30, 2, function (st) { var club = cl(st); var t = (st.transfers || []).filter(function (x) { return x.toId === club.id && x.season === st.season && x.fee > 0; }).sort(function (a, b) { return b.fee - a.fee; })[0]; if (!t || st.week < 8) return null; var p = st.players[t.pid]; if (!p || p.clubId !== club.id || !p.stats.apps || p.stats.rsum / p.stats.apps > (HB ? 6.8 : 6.3)) return null; return { pid: p.id, fee: t.fee }; });
  ev('youth_pro', 'nachwuchs', 16, 2, function (st) { var club = cl(st), y = (W.youthOf ? W.youthOf(st, club.id) : []).filter(function (p) { return p.age >= 17 && p.pot >= 70 && !MX.openPromises(st, p.id).length; }).sort(function (a, b) { return b.pot - a.pot; })[0]; return y ? { pid: y.id } : null; });
  ev('youth_discover', 'nachwuchs', 40, 1, function (st) { return st.phase === 'season' && cl(st).fac && (cl(st).fac.jugend || 1) >= 2 ? { age: 15 } : null; });
  ev('youth_discipline', 'nachwuchs', 30, 1, function (st) { var y = sq(st).concat(W.youthOf ? W.youthOf(st, cl(st).id) : []).filter(function (p) { return p.age <= 20 && MX.pers(p).dis <= 5; })[0]; return y ? { pid: y.id } : null; });
  ev('youth_breakthrough', 'nachwuchs', 60, 6, function (st) { var y = sq(st).filter(function (p) { return p.age <= 21 && p.stats.apps >= 6 && p.stats.rsum / p.stats.apps >= (HB ? 7.3 : 6.9) && !st.mx.cd['bt' + p.id]; })[0]; if (y) { st.mx.cd['bt' + y.id] = tick(st); return { pid: y.id }; } return null; });
  ev('youth_leave', 'nachwuchs', 20, 1.5, function (st) { var y = sq(st).filter(function (p) { return p.homegrown && p.age <= 22 && MX.pl(st, p).bench >= 6 && !p.listed && !MX.openPromises(st, p.id).length; })[0]; return y ? { pid: y.id } : null; });
  ev('youth_return', 'transfer', 40, 2, function (st) { var club = cl(st); if (!T.windowOpen(st)) return null; var f = T.freeAgents(st).filter(function (p) { var h = st.mx.hist.pl[p.id]; return h && h.hg && h.cid === club.id && p.age <= 33; })[0]; return f ? { pid: f.id } : null; });
  ev('contract_talk', 'vertrag', 12, 2, function (st) { var c = sq(st).filter(function (p) { return p.contract <= 1 && p.ovr >= MX.starters(st).slice(-1)[0].ovr && !MX.recent(st, 'contract_fail', 12).some(function (e) { return e.d.pid === p.id; }); })[0]; return c && st.week >= 6 ? { pid: c.id, why: 'Der Vertrag meines Klienten läuft aus.' } : null; });
  ev('poach', 'transfer', 14, 1.5, function (st) { var top = MX.starters(st)[hash('po' + tick(st)) % 4]; if (!top) return null; var rivals = (cl(st).rivals || []).filter(function (id) { return st.clubs[id] && !st.clubs[id].userControlled; }); var rc = rivals[0] || Object.keys(st.clubs).filter(function (k) { var c = st.clubs[k]; return !c.userControlled && !c.foreign && c.league <= cl(st).league; })[hash('pc' + tick(st)) % 10]; return rc ? { pid: top.id, cid: rc } : null; });
  ev('agent_offer', 'transfer', 10, 1.5, function (st) { if (!T.windowOpen(st)) return null; var club = cl(st), worst = MX.starters(st).slice(-1)[0], f = T.freeAgents(st).filter(function (p) { return p.age <= 31 && worst && p.ovr >= worst.ovr - 4; }).sort(function (a, b) { return b.ovr - a.ovr; })[0]; return f ? { pid: f.id, aid: st.mx.agents[hash('ao' + f.id) % st.mx.agents.length].id } : null; });
  ev('staff_offer', 'stab', 40, 1.5, function (st) { var club = cl(st); var k = club.staff && club.staff.co && club.staff.co.lvl >= 2 ? 'co' : null; if (!k) return null; var s = MX.staffP(st, k); if (!s || s.amb < 12) return null; var rc = Object.keys(st.clubs).filter(function (x) { var c = st.clubs[x]; return !c.userControlled && !c.foreign && c.league >= club.league; })[hash('so' + st.season) % 12]; return { k: k, rc: rc ? st.clubs[rc].name : 'Ein Zweitligist' }; });
  ev('staff_advice', 'stab', 6, 2.5, function (st) { var club = cl(st), l = st.mx.last, tired = sq(st).filter(function (p) { return p.fitness < 70; }).length, inj = sq(st).filter(function (p) { return p.inj; }).length, k = MX.kabine(st).v; var topic = tired >= 5 ? 'intensity' : inj >= 3 ? 'injury' : k < 45 ? 'mood' : l.streak <= -2 ? 'tactic' : (W.youthOf ? W.youthOf(st, club.id) : []).some(function (y) { return y.ovr >= 55; }) ? 'youth' : null; if (!topic) return null; var key = { intensity: 'fitness', injury: 'arzt', mood: 'assistent', tactic: 'co', youth: 'jugend' }[topic]; if (!MX.staffP(st, key)) key = 'co'; if (!MX.staffP(st, key)) key = 'coach'; return { topic: topic, k: key }; });
  ev('staff_conflict', 'stab', 40, 1, function (st) { var l = MX.staffList(st).filter(function (s) { return s.k !== 'coach'; }); if (l.length < 2) return null; var a = l[0], b = l.filter(function (x) { return x.idea !== a.idea; })[0]; return b && st.mx.last.streak <= -2 ? { a: a.k, b: b.k } : null; });
  ev('doctor_warning', 'stab', 10, 2, function (st) { var n = sq(st).filter(function (p) { return p.fitness < 66; }).length; return n >= 4 ? { n: n } : null; });
  ev('fan_meeting', 'fans', 12, 1.5, function (st) { return st.phase === 'season' ? {} : null; });
  ev('autograph', 'fans', 12, 1.2, function (st) { return { open: hash('ag' + tick(st)) % 2 === 0 }; });
  ev('ultras_talk', 'fans', 26, 1.2, function (st) { return st.mx.fans.ultras < 50 || st.mx.people.ultras.v < 45 || hash('ut' + st.season) % 3 === 0 ? {} : null; });
  ev('pyro', 'fans', 10, 1.2, function (st) { var r = hr('py' + tick(st), 1), u = st.mx.fans.ultras; var sev = r < 0.5 ? 'legal' : r < 0.85 + (u < 35 ? 0.05 : 0) ? 'Regelverstoß' : 'gefährlich'; if (sev === 'gefährlich' && !(u < 40 && st.mx.last.streak <= -2)) sev = 'Regelverstoß'; return { sev: sev }; });
  ev('ticket_debate', 'fans', 30, 1, function (st) { return st.mx.fans.family < 52 || st.mx.fans.active < 50 ? {} : null; });
  ev('board_protest', 'fans', 26, 2, function (st) { return st.mx.people.pres.v < 35 && st.mx.fans.active < 45 ? { target: 'board' } : null; }, 'fan_protest');
  ev('crisis_support', 'fans', 30, 3, function (st) { return st.mx.last.streak <= -3 && MX.fanMood(st) >= 55 && st.mx.fans.long >= 60 ? {} : null; });
  ev('threat', 'fans', 60, 4, function (st) { var l = st.mx.last; if (!(l.streak <= -6 && MX.fanMood(st) < 25 && (pos(st) || 0) > tgt(st) + 5)) return null; var p = MX.starters(st)[0]; return { pid: hr('th' + tick(st), 1) < 0.5 && p ? p.id : null }; });
  ev('press', 'medien', 4, 2.5, function (st) { return st.phase === 'season' ? MX.pressTopics(st, false) : null; });
  ev('social', 'medien', 5, 2, function (st) { var f = st.mx.feed.filter(function (x) { return x.hot && !x.react && tick(st) - x.t <= 2; })[0]; return f ? { fid: f.id, kind: f.kind, pid: f.pid || null } : null; });
  ev('finance_crisis', 'vorstand', 16, 6, function (st) { var c = cl(st); return c.cash < -E.revenueEstimate(st, c) * 0.12 ? {} : null; });
  ev('board_strategy', 'vorstand', 80, 1, function (st) { return st.season % 2 === 0 && st.week >= 10 ? {} : null; });
  ev('board_praise', 'vorstand', 60, 2, function (st) { var mv = st.mx.hist.seasons.filter(function (s) { return s.cid === cl(st).id; }).length; return mv >= 3 && (st.manager.trust || 0) >= 72 && st.mx.people.pres.v >= 65 ? { n: mv } : null; });
  ev('board_conflict', 'vorstand', 20, 3, function (st) { var s = MX.said(st, 'press_board_crit', 8); return (s && st.mx.people.pres.v < 50) || (st.mx.people.pres.v < 25) ? { txt: s ? 'Ihre öffentliche Kritik am Vorstand („' + s.txt + '“) war ein Affront.' : 'So kann die Zusammenarbeit nicht weitergehen.' } : null; });
  ev('sponsor_event', 'sponsoren', 8, 1.5, function (st) { return MX.mainSponsor(st) ? { region: hash('se' + tick(st)) % 3 === 0 } : null; });
  ev('sponsor_pressure', 'sponsoren', 16, 2, function (st) { return st.mx.last.streak <= -3 && MX.mainSponsor(st) ? {} : null; });
  ev('sponsor_support', 'sponsoren', 40, 1, function (st) { var c = cl(st); return st.mx.spons.v >= 60 ? { k: c.construction && c.construction.length ? 'build' : 'youth' } : null; });
  ev('sponsor_loss', 'sponsoren', 30, 4, function (st) { return st.mx.spons.v < 25 && MX.mainSponsor(st) ? {} : null; });
  ev('build_issue', 'infrastruktur', 12, 2, function (st) { var c = cl(st); return c.construction && c.construction.length && c.construction[0].weeks >= 3 ? { k: hash('bi' + tick(st)) % 2 ? 'delay' : 'cost' } : null; });
  ev('build_grant', 'infrastruktur', 60, 0.8, function (st) { return {}; });
  ev('injury_wave', 'stab', 8, 5, function (st) { var n = sq(st).filter(function (p) { return p.inj && p.inj.weeks >= 1; }).length; return n >= 4 ? { n: n, nt: MX.recent(st, 'nt_injury', 2).length > 0 } : null; });
  ev('releg_fight', 'kabine', 8, 3, function (st) { var c = cl(st), n = st.leagues[c.league] ? st.leagues[c.league].clubIds.length : 18, p = pos(st); return st.week >= 18 && p && p >= n - 2 && c.league < 3 ? { pos: p } : null; });
  ev('life_meet', 'privat', 10, 0.8, function (st) { var lf = st.mx.life; return (lf.cands || []).length < 4 && lf.stress < 80 && (!lf.partner || hr('lm' + tick(st), 1) < 0.3) ? { cand: MX.newCand(st, ['gala', 'cafe', 'freunde', 'charity', 'super', 'gym', 'kunst', 'hochzeit', 'zug', 'hund'][hash('lmw' + tick(st)) % 10]) } : null; });
  // Spontane Anfragen über Instagram und Dating-App (die App nur ohne feste Beziehung)
  ev('life_dm', 'privat', 8, 0.7, function (st) { var lf = st.mx.life; if ((lf.cands || []).length >= 4 || lf.stress >= 85 || (lf.partner && hr('ld' + tick(st), 1) > 0.35)) return null; var app = !lf.partner && hr('la' + tick(st), 2) < 0.5, cd = MX.newCand(st, app ? 'app' : 'insta'); cd.src = app ? 'app' : 'insta'; var f = hr('lf' + tick(st), 3), rp = (st.manager.reputation || 40) / 900; return { cand: cd, src: cd.src, msg: DM[cd.src][hash('lmsg' + tick(st)) % DM[cd.src].length], fake: f < 0.05 + rp ? 'presse' : f < 0.09 + rp ? 'fake' : f < 0.13 + rp ? 'fan' : '' }; });
  // Begegnungen auf Auswärtsfahrten (Hotel, Flug, Zug) – nach einem Auswärtsspiel der Woche
  ev('life_away', 'privat', 8, 1, function (st) { var lf = st.mx.life, club = cl(st); if (!club || (lf.cands || []).length >= 4) return null; var r = (st.lastResults || []).filter(function (x) { return x.a === club.id && x.comp !== 'friendly'; })[0]; if (!r || hr('aw' + tick(st), 1) > (lf.partner ? 0.25 : 0.5)) return null;
    var h = st.clubs[r.h] || (R.euro && R.euro.info ? R.euro.info(st, r.h) : null), spots = r.comp === 'euro' ? ['bar', 'lobby', 'flug', 'fruehst'] : ['bar', 'lobby', 'zug', 'fruehst'], cd = MX.newCand(st, 'away'); cd.src = 'away';
    return { cand: cd, spot: spots[hash('sp' + tick(st)) % spots.length], city: (h && (h.city || h.short || h.name)) || 'der Auswärtsstadt' }; });
  ev('life_partner_talk', 'privat', 10, 2, function (st) { var lf = st.mx.life; return lf.partner && lf.stress >= 65 && lf.partner.v < 55 ? {} : null; });
  ev('life_stage', 'privat', 16, 1.5, function (st) { var pt = st.mx.life.partner; return pt && pt.stage >= 2 && pt.stage < 5 && pt.v >= 72 && tick(st) - (pt.stageT || pt.since) >= 20 ? {} : null; });

  // Reaktionen auf konkrete Ereignisse (haben Vorrang vor allgemeinen Ereignissen)
  function reactive(st) {
    var mx = st.mx, out = [];
    MX.recent(st, 'nt_first', 1).forEach(function (e) { if (MX.cool(st, 'ntf' + e.d.pid, 999)) out.push({ id: 'nt_first_call', ctx: { pid: e.d.pid, code: e.d.code }, key: 'ntf' + e.d.pid, prio: 2 }); });
    MX.recent(st, 'nt_injury', 1).forEach(function (e) { out.push({ id: 'nt_injury_conflict', ctx: { pid: e.d.pid }, key: 'nti' + e.d.pid, prio: 3 }); });
    MX.recent(st, 'nt_hero', 1).forEach(function (e) { out.push({ id: 'nt_hero', ctx: { pid: e.d.pid }, key: 'nth' + e.d.pid, prio: 2, cd: 20 }); });
    MX.recent(st, 'nt_title', 1).forEach(function (e) { out.push({ id: 'nt_hero', ctx: { pid: e.d.pid }, key: 'ntt' + e.d.pid + st.season, prio: 3, cd: 50 }); });
    MX.recent(st, 'nt_bench', 1).forEach(function (e) { out.push({ id: 'nt_bench', ctx: { pid: e.d.pid }, key: 'ntb' + e.d.pid, prio: 1, cd: 16 }); });
    MX.recent(st, 'nt_coach', 2).forEach(function (e) { var lost = MN ? Object.keys(st.mnt.pl).filter(function (pid) { var p = st.players[pid], pr = st.mnt.pl[pid]; return p && p.clubId === cl(st).id && pr.code === e.d.code && pr.caps >= 5; })[0] : null; if (lost) out.push({ id: 'nt_coach_change', ctx: { pid: lost, neu: e.d.neu }, key: 'ntc' + lost + st.season, prio: 1, cd: 40 }); });
    MX.recent(st, 'sold', 1).forEach(function (e) { var h = mx.hist.pl[e.d.pid], p = st.players[e.d.pid]; var dem = MX.said(st, 'dementi_' + e.d.pid, 12) || MX.said(st, 'unverkaeuflich_' + e.d.pid, 20); if (dem) { fx(st, { media: -6, fans: -5 }); MX.feedAdd(st, { who: 'Fans', txt: 'Erst „' + dem.txt + '“, dann verkauft – Glaubwürdigkeit? Null.', kind: 'fan' }); } if (p && ((h && (h.seasons >= 4 || h.hg)) || mx.roles[e.d.pid] === 'fav')) out.push({ id: 'fan_protest', ctx: { target: 'transfer', n: pname(p) }, key: 'tp' + e.d.pid, prio: 2 }); });
    MX.recent(st, 'chance', 6).forEach(function (e) { var y = st.players[e.d.pid]; if (y && !y.youth && y.stats.apps >= 3 && y.stats.rsum / y.stats.apps >= (HB ? 7.2 : 6.8) && MX.cool(st, 'bt' + y.id, 999)) { st.mx.cd['bt' + y.id] = tick(st); out.push({ id: 'youth_breakthrough', ctx: { pid: y.id }, key: 'bt2' + y.id, prio: 3 }); } });
    // Spitzenverein meldet Interesse (nach Länderspielen oder Durchbruch)
    MX.recent(st, 'nt_hero', 3).concat(MX.recent(st, 'nt_title', 3)).forEach(function (e) { var p = st.players[e.d.pid]; if (!p || !T.windowOpen(st) || !MX.cool(st, 'os' + p.id, 20)) return; var rich = Object.keys(st.clubs).map(function (k) { return st.clubs[k]; }).filter(function (c) { return !c.userControlled && !c.foreign && c.league === 1 && c.cash > p.value * 1.4 && c.reputation >= (cl(st).reputation || 50); }).sort(function (a, b) { return b.reputation - a.reputation; })[0]; if (!rich) return; var amt = R.round(p.value * 1.35, 50000); st.inbox.unshift({ id: W.nextId(st, 'offer'), type: 'offer', listed: false, pid: p.id, from: rich.id, amount: amt, week: st.week, season: st.season, tick: tick(st) }); out.push({ id: 'offer_star', ctx: { pid: p.id, cid: rich.id, amount: amt }, key: 'os' + p.id, prio: 2 }); });
    // Fertiggestellte Bauprojekte
    (mx.ev || []).filter(function (e) { return e.k === 'built' && tick(st) - e.t <= 1; }).forEach(function (e) { out.push({ id: 'build_done', ctx: { n: e.d.n }, key: 'bd' + e.d.n + e.t, prio: 1 }); });
    var seen = {}; return out.filter(function (x) { var ok = MX.cool(st, x.key, x.cd || 999) && MX.cool(st, 'ev:' + x.id, x.id === 'nt_bench' ? 10 : x.id === 'nt_hero' ? 12 : x.id === 'offer_star' ? 10 : x.id === 'nt_first_call' || x.id === 'nt_injury_conflict' ? 0 : 3) && !seen[x.id]; if (ok) seen[x.id] = 1; return ok; });
  }
  MX.reactive = reactive;

  // Handlungsbogen Vereinskrise (Niederlagenserie): Zweifel → Unruhe → Fanproteste → Krisensitzung → Konsequenz
  function crisisArc(st) {
    var mx = st.mx, l = mx.last, a = mx.arcs.filter(function (x) { return x.k === 'crisis' && !x.done; })[0];
    if (!a) { if (l.winless >= 4 && l.streak <= -3 && st.phase === 'season' && MX.cool(st, 'crisis', 10)) { a = { k: 'crisis', ph: 0, t: tick(st), start: st.week }; mx.arcs.push(a); MX.setCool(st, 'crisis'); MX.chron(st, '🌧️', 'Erste Zweifel', 'Nach ' + l.winless + ' Spielen ohne Sieg wird die Taktik hinterfragt.', 2, 'trainerkrise'); } else return null; }
    if (l.wins2) { a.done = true; a.res = 'wende'; MX.setCool(st, 'crisis'); return { id: 'turnaround', ctx: {}, key: 'tu' + tick(st), prio: 4 }; }
    if (tick(st) - (a.lt || 0) < 1) return null;
    var need = [3, 4, 5, 6, 8][a.ph]; if (l.winless < need) return null;
    a.lt = tick(st); a.ph++;
    if (a.ph === 1) return { id: 'press', ctx: MX.pressTopics(st, true, 'Trainer unter Druck'), key: 'cr1' + a.t, prio: 3 };
    if (a.ph === 2) { var cap = cl(st).captain; return { id: 'crisis_unrest', ctx: { pid: cap && st.players[cap] && st.players[cap].clubId === cl(st).id ? cap : MX.starters(st)[0].id }, key: 'cr2' + a.t, prio: 3 }; }
    if (a.ph === 3) return { id: 'fan_protest', ctx: { target: 'sport' }, key: 'cr3' + a.t, prio: 3 };
    if (a.ph === 4) return { id: 'board_crisis', ctx: {}, key: 'cr4' + a.t, prio: 4 };
    a.done = true; a.res = 'eskalation'; return { id: 'crisis_final', ctx: {}, key: 'cr5' + a.t, prio: 4 };
  }
  MX.crisisArc = crisisArc;

  MX.DENS = { ruhig: 0.5, normal: 1, lebendig: 1.6 };
  MX.director = function (st) {
    var mx = st.mx; if (!mx || MX.pending(st) && mx.dq.length >= 3) return [];
    var fired = [], dens = MX.DENS[mx.opt.density] || 1;
    function fire(x) { if (!MX.D[x.id]) return false; var d = MX.D[x.id](st, x.ctx || {}); if (!d) return false; MX.start(st, x.id, x.ctx || {}, { prio: x.prio || 0 }); if (x.key) MX.setCool(st, x.key); MX.setCool(st, 'ev:' + x.id); MX.setCool(st, 'cat:' + (d.cat || '')); mx.stats.fired.push({ t: tick(st), id: x.id }); if (mx.stats.fired.length > 200) mx.stats.fired.shift(); fired.push(x.id); return true; }
    var arc = crisisArc(st); if (arc) fire(arc);
    reactive(st).sort(function (a, b) { return b.prio - a.prio; }).slice(0, 2 - fired.length).forEach(fire);
    // Ruhige Phasen bewusst zulassen
    var lastAny = mx.stats.fired.length ? tick(st) - mx.stats.fired[mx.stats.fired.length - 1].t : 99;
    var chance = 0.42 * dens * (lastAny <= 1 && !fired.length ? 0.45 : 1) * (fired.length ? 0.25 : 1);
    if (hr('dir' + tick(st) + (st.seed || 0), 1) < chance) {
      var cands = EV.filter(function (e) { return MX.cool(st, 'ev:' + e.id, e.cd) && MX.cool(st, 'cat:' + e.cat, 2); }).map(function (e) { var c = null; try { c = e.when(st); } catch (x) { c = null; } return c ? { e: e, c: c } : null; }).filter(Boolean);
      var sum = cands.reduce(function (s, x) { return s + x.e.w; }, 0), r = hr('dirp' + tick(st) + (st.seed || 0), 2) * sum;
      for (var i = 0; i < cands.length; i++) { r -= cands[i].e.w; if (r <= 0) { fire({ id: cands[i].e.dlg, ctx: cands[i].c, prio: 0 }) && MX.setCool(st, 'ev:' + cands[i].e.id); break; } }
    }
    mx.firedT = fired.length ? tick(st) : mx.firedT;
    return fired;
  };

  // ============================================================================================
  // WOCHE & SAISON (Einbindung in den vorhandenen Ablauf)
  // ============================================================================================
  MX.week = function (st) {
    var mx = MX.ensure(st), club = cl(st); if (!club) return;
    // Ergebnisse der eigenen Pflichtspiele
    var mine = (st.lastResults || []).filter(function (r) { return r.user && r.comp !== 'friendly'; }), w = 0, d = 0, lo = 0, l = mx.last;
    mine.forEach(function (r) { var my = r.h === club.id ? r.hg - r.ag : r.ag - r.hg; if (r.pens && my === 0) my = r.h === club.id ? r.pens[0] - r.pens[1] : r.pens[1] - r.pens[0]; if (my > 0) w++; else if (my < 0) lo++; else d++; });
    if (mine.length) {
      l.streak = w && !lo ? Math.max(0, l.streak || 0) + w : lo && !w ? Math.min(0, l.streak || 0) - lo : 0;
      l.winless = w ? 0 : (l.winless || 0) + mine.length; l.wins2 = (l.prevWin && w > 0) || w >= 2; l.prevWin = w > 0;
      var prevU = l.unbeaten || 0; l.unbeaten = lo ? 0 : prevU + mine.length;
      if (lo && prevU >= 8 && prevU > ((mx.hist.records.unbeaten || {}).v || 0)) { mx.hist.records.unbeaten = { v: prevU, s: st.season }; MX.chron(st, '📜', 'Vereinsrekord', prevU + ' Pflichtspiele in Folge ungeschlagen.', 2, 'meister'); }
      MX.fanWeek(st, { w: w, d: d, l: lo });
      // Social Media: Reaktionen auf das Spiel (aus echten Ergebnissen)
      var r0 = mine[0], opp = st.clubs[r0.h === club.id ? r0.a : r0.h], derby = opp && club.rivals && club.rivals.indexOf(opp.id) >= 0;
      if (derby) MX.feedAdd(st, { who: w ? 'Fans' : 'Fans von ' + opp.short, txt: w ? 'DERBYSIEGER! Die Stadt gehört uns!' : lo ? 'Danke für die Punkte, Nachbarn 😂' : 'Derby ohne Sieger – Hauptsache nicht verloren.', kind: 'fan', hot: !!lo });
      else if (l.streak <= -3) MX.feedAdd(st, { who: 'Fan-Forum', txt: Math.abs(l.streak) + ' Niederlagen am Stück. Wie lange noch?', kind: 'fan', hot: l.streak <= -4 });
      else if (l.streak >= 3) MX.feedAdd(st, { who: 'Fans', txt: l.streak + ' Siege in Folge! Wo soll das noch hinführen? 🔥', kind: 'fan' });
      if (l.streak === 5 || l.streak === 8) MX.start(st, 'win_streak', { n: l.streak }, { prio: 2 });
    } else l.wins2 = false;
    // Einsatzzeiten → Ersatzbank-Zähler
    var sqd = MX.squad(st);
    sqd.forEach(function (p) { var r = MX.pl(st, p); if (mine.length && st.phase === 'season') { if (p.stats.apps > r.apps0) r.bench = 0; else if (!p.inj && !p.ntAway) r.bench++; } r.apps0 = p.stats.apps; });
    // Mentor: Entwicklungsimpuls
    if (mx.mentor && mx.mentor.until > tick(st)) { var y = st.players[mx.mentor.y]; if (y && hr('mt' + tick(st), 1) < 0.18 && y.ovr < y.pot) { var k = D.attrKeys[hash('mk' + tick(st)) % D.attrKeys.length]; if (k !== 'gk' || y.pos === 'TW') { y.attr[k] = Math.min(99, y.attr[k] + 1); W.recalc(y); } } }
    // Kabine wirkt auf die Moral (langsames Ziehen in Richtung Kabinenstimmung)
    MX.computeRoles(st);
    var kb = MX.kabine(st); mx.kab = kb.v;
    sqd.forEach(function (p) { var tgtM = 50 + (kb.v - 50) * 0.6 + (MX.pl(st, p).rel - 50) * 0.15; p.morale = clamp(p.morale + (tgtM - p.morale) * 0.06, 0, 100); });
    // Unzufriedener Kapitän beeinflusst Mitspieler
    var cap = st.players[club.captain]; if (cap && cap.clubId === club.id && cap.morale < 35) sqd.forEach(function (p) { if (p !== cap && MX.pers(p).team < 12) p.morale = clamp(p.morale - 0.6, 0, 100); });
    MX.checkPromises(st);
    // Zusagen: Schützenrolle verletzt?
    MX.openPromises(st).forEach(function (pr) { if (pr.k === 'pen' && club.pen !== pr.pid) pr.violated = true; });
    mx.last.pen = club.pen || mx.last.pen;
    MX.lifeWeek(st); MX.decay(st);
    if (MN) MN.syncFame(st);
    // Ultimatum aus der Krisensitzung
    mx.mem.agree.filter(function (a) { return a.k === 'ultimatum' && !a.done; }).forEach(function (a) { if (st.week - a.w0 >= a.games) { a.done = true; var club2 = cl(st), pts = 0; (st.mx.ptsLog || []).filter(function (x) { return x.w > a.w0 && x.w <= a.w0 + a.games; }).forEach(function (x) { pts += x.p; }); a.got = pts; if (pts >= a.pts) { fx(st, { board: 8, pres: 5 }); MX.chron(st, '✅', 'Ultimatum erfüllt', pts + ' Punkte geholt.', 2); } else { fx(st, { board: -10 }); MX.chron(st, '❌', 'Ultimatum verfehlt', 'Nur ' + pts + ' Punkte.', 3); } } });
    // Punkteprotokoll (für Vereinbarungen)
    if (mine.length && st.phase === 'season') { mx.ptsLog = (mx.ptsLog || []).concat([{ w: st.week, p: w * (HB ? 2 : 3) + d }]).slice(-40); }
    // Regisseur
    if (st.phase === 'season' || st.phase === 'preseason' || st.phase === 'winter') MX.director(st);
  };
  MX.seasonEnd = function (st) { // vor dem Saisonwechsel
    var mx = MX.ensure(st), club = cl(st); if (!club) return;
    MX.seasonSnapshot(st);
    var snap = mx.hist.seasons[mx.hist.seasons.length - 1], ag = mx.mem.agree.filter(function (a) { return a.k === 'target' && a.s === st.season; })[0];
    MX.sponsorSettle(st);
    var good = false, txt = '';
    if (ag && snap.pos) {
      var hit = snap.pos <= ag.pos, yOk = !ag.extra || !ag.extra.youth || MX.squad(st).filter(function (p) { return p.homegrown && p.stats.apps >= 5; }).length >= ag.extra.youth;
      good = hit && yOk; ag.done = true; ag.hit = good;
      fx(st, good ? { pres: 6, board: 4 } : { pres: -5, board: -3 });
      if (good && ag.extra && ag.extra.conflict) fx(st, { pres: 6 });
      txt = 'Vereinbart war: ' + ag.txt + '. Erreicht: Platz ' + snap.pos + '.' + (ag.extra && ag.extra.youth ? (yOk ? ' Die Nachwuchsvereinbarung wurde eingehalten.' : ' Die Nachwuchsvereinbarung wurde verfehlt.') : '') + (good ? ' Der Vorstand ist zufrieden.' : ' Der Vorstand ist enttäuscht.');
      MX.chron(st, good ? '🎯' : '📉', 'Saisonbilanz ' + st.season, txt, 2);
    }
    if (snap.pos === 1) { MX.chron(st, '🏆', 'Meisterschaft!', club.name + ' wird Meister der ' + (D.leagueNames ? D.leagueNames[club.league] : 'Liga') + '.', 3, 'meister'); mx.hist.titles.push({ s: st.season, t: 'Meister ' + (D.leagueNames ? D.leagueNames[club.league] : '') }); good = true; }
    else if (snap.pos && snap.pos <= 2 && club.league > 1) { MX.chron(st, '⬆️', 'Aufstieg!', club.name + ' steigt auf.', 3, 'meister'); mx.hist.titles.push({ s: st.season, t: 'Aufstieg' }); good = true; }
    var n = st.leagues[club.league] ? st.leagues[club.league].clubIds.length : 18; if (snap.pos && snap.pos >= n - 1 && club.league < 3) { MX.chron(st, '⬇️', 'Abstieg', club.name + ' muss runter.', 3, 'abstieg'); mx.hist.titles.push({ s: st.season, t: 'Abstieg' }); }
    if (txt) MX.start(st, 'season_review', { good: good, txt: txt }, { prio: 1 });
    // Nationaltrainer-Angebot (optionaler Karriereweg)
    if (MN && !mx.ntJob && hr('njo' + st.season + (st.seed || 0), 1) < 0.35) { var code = MN.offerJob(st); if (code) MX.start(st, 'nt_job_offer', { code: code }, { prio: 1 }); }
  };
  MX.goalTalk = function (st) { var mx = st.mx; if (mx.goalS === st.season || !st.manager.boardTarget || !cl(st)) return; mx.goalS = st.season; MX.start(st, 'board_goals', {}, { prio: 2 }); };
  MX.seasonStart = function (st) { // nach dem Saisonwechsel
    var mx = MX.ensure(st); if (!cl(st)) return;
    mx.last = { pen: mx.last.pen }; mx.ptsLog = [];
    MX.squad(st).forEach(function (p) { var r = MX.pl(st, p); r.apps0 = p.stats.apps; r.bench = 0; });
    MX.sponsorGoals(st);
    MX.goalTalk(st);
  };

  // --- Einhängen in den vorhandenen Spielablauf ---
  var baseComplete = S.completeWeek;
  S.completeWeek = function (st, played) {
    var on = MX.on(st), clubBefore = on ? cl(st) : null, cons = clubBefore ? (clubBefore.construction || []).map(function (c) { return c.key + c.to; }) : [];
    if (on) { MX.ensure(st); if (st.phase === 'preseason' || st.week <= 2) MX.goalTalk(st); if (MN) MN.preWeek(st); }
    var res = baseComplete.apply(this, arguments);
    try {
      if (MX.on(st)) {
        var club = cl(st);
        if (clubBefore && club && club.id === clubBefore.id) { var now = (club.construction || []).map(function (c) { return c.key + c.to; }); cons.forEach(function (k) { if (now.indexOf(k) < 0) { var key = k.replace(/\d+$/, ''), lvl = +k.replace(/^\D+/, ''), nm = D.facilities[key] && D.facilities[key].levels[lvl] ? D.facilities[key].levels[lvl].n : key; MX.event(st, 'built', { n: nm }); st.mx.hist.builds.push({ s: st.season, n: nm }); MX.chron(st, '🏗️', 'Bauprojekt fertig', nm + '.', 2, 'stadionbau'); } }); }
        if (MN) MN.postWeek(st);
        MX.week(st);
      }
    } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    return res;
  };
  var baseNew = S.newSeason;
  S.newSeason = function (st) {
    var on = MX.on(st), cid = on ? cl(st).id : null;
    if (on) { try { MX.ensure(st); MX.seasonEnd(st); } catch (e) { if (typeof console !== 'undefined') console.error(e); } }
    var r = baseNew.apply(this, arguments);
    try { if (MX.on(st)) { MX.ensure(st); if (MN) MN.newSeason(st); MX.seasonStart(st); } } catch (e) { if (typeof console !== 'undefined') console.error(e); }
    return r;
  };
  // Alte Ereigniskarten nur, wenn der Regisseur in dieser Woche nichts ausgelöst hat (keine Ereignisflut)
  var baseMaybe = S.maybeEvent;
  S.maybeEvent = function (st, club) { if (st.mx && MX.on(st) && (st.mx.firedT === tick(st) || MX.pending(st))) return; return baseMaybe.apply(this, arguments); };
  // Vereinswechsel des Managers: Beziehung & Umzug
  var baseAccept = S.acceptJob;
  S.acceptJob = function (st, idx) { var o = st.manager.offers[idx], r = baseAccept.apply(this, arguments); try { if (st.mx && o && st.mx.life && st.mx.life.partner) { MX.ensure(st); MX.start(st, 'life_move', { city: (st.clubs[o.clubId] || {}).city || 'der neuen Stadt' }, { prio: 1 }); } } catch (e) { } return r; };
  // ============================================================================================
  // HINTERGRUNDGESPRÄCH MIT DER PRESSE (off the record) – inkl. Flirt mit Journalistinnen oder Masche
  // ============================================================================================
  var FEM = { Sabine: 1, Claudia: 1, Petra: 1, Anja: 1, Katrin: 1, Julia: 1, Nicole: 1, Sandra: 1, Miriam: 1, Lena: 1, Aylin: 1, Ines: 1, Carla: 1, Vera: 1 };
  MX.fem = function (name) { var f = String(name || '').split(' ')[0]; return !!FEM[f] || (MX.CFEM || []).indexOf(f) >= 0; };
  function jOf(st, id) { return st.mx.people.jrn.filter(function (j) { return j.id === id; })[0] || st.mx.people.jrn[0]; }
  function jCandM(st, j) { var c = (st.mx.life.cands || []).filter(function (y) { return y.name === j.name; })[0]; if (!c) { c = MX.newCand(st, 'presse'); c.name = j.name; c.job = 'Journalistin (' + j.outlet + ')'; c.src = 'zufall'; } return keepCand(st, c, 1, 58); }
  add('mx_pressbg', function (st, c) {
    var j = jOf(st, c.jid), pt = st.mx.life.partner, fem = MX.fem(j.name);
    if (c.her == null) { c.her = fem && hr('pbgher' + j.id + tick(st), 1) < 0.3 + (st.manager.reputation || 40) / 400 ? 1 : 0; c.real = hr('pbgreal' + j.id + tick(st), 2) < (/Boulevard|provokant/.test(j.type) ? 0.3 : 0.6) ? 1 : 0; }
    function badPress(why) { MX.chron(st, '📰', 'Peinliche Schlagzeile', j.outlet + ': ' + why, 2); return fx(st, { media: -8, board: -4, fans: -2, mrep: -2, jrn: [j.id, -15], stress: 5, partner: pt ? -8 : 0 }); }
    var startOpts = [
      O('Offen über Philosophie und Ziele reden', function () { return end(fnm(j) + ' hört genau zu. „Danke – so versteht man Ihre Arbeit besser.“', fx(st, { jrn: [j.id, 7], media: 2 })); }, { def: true }),
      O('Freundlich, aber nur Floskeln', function () { return end('Höflich, ohne Inhalt. ' + fnm(j) + ' klappt den Block gelangweilt zu.', fx(st, { jrn: [j.id, 1] })); })];
    if (fem) startOpts.push(O('Mit ihr flirten', function () { if (hr('pbgfl' + j.id + tick(st), 3) < clamp(0.35 + (j.v - 50) / 150 + ((st.manager.reputation || 40) - 40) / 300, 0.1, 0.75)) return nx(fnm(j) + ' lacht und hält deinem Blick stand. „Das ist jetzt aber wirklich off the record.“', fx(st, { jrn: [j.id, 4] }), 'match');
      return end(fnm(j) + ' zieht die Augenbrauen hoch. Zwei Tage später: „Trainer baggert Journalistin im Interview an“.', badPress('Trainer baggert Journalistin an – der Vorstand ist verärgert.')); }, { hint: 'Kann gut ankommen – oder in der Zeitung landen' }));
    return { title: 'Hintergrundgespräch', cat: 'medien', imp: 'normal', img: 'presse', max: 3, ic: '☕', who: { n: j.name, role: j.type + ' · ' + j.outlet, ic: '☕' },
      nodes: {
        start: c.her ? { say: fnm(j) + ' rückt näher, lacht über jeden deiner Witze. „Wir könnten das ja mal ohne Diktiergerät fortsetzen – bei einem Glas Wein?“', opts: [
            O('Darauf eingehen', function () { return nx(c.real ? 'In der Weinbar fragt sie nach dir – nicht nach dem Verein.' : 'Nach dem zweiten Glas wird sie neugierig: „Wie ist das eigentlich mit dem Vorstand? Und wer in der Kabine macht Ärger?“', [], c.real ? 'match' : 'leak'); }),
            O('Höflich abblocken', function () { return end('Du bleibst professionell. „Schade. Aber fair.“', fx(st, { jrn: [j.id, c.real ? -2 : 1], partner: pt ? 1 : 0 })); }, { def: true }),
            O('Nachfragen: „Ernst gemeint – oder wollen Sie eine Story?“', function () { if (c.real) return nx(fnm(j) + ' wird rot. „Ernst gemeint.“', fx(st, { jrn: [j.id, 2] }), 'match'); return end(fnm(j) + ' lacht ertappt. „Einen Versuch war es wert.“ Masche durchschaut.', fx(st, { jrn: [j.id, -3], mrep: 1 })); })
          ] } : { say: 'Ein Kaffee abseits der Kameras mit ' + fnm(j) + ' (' + j.outlet + '). „Alles off the record – ich will verstehen, wie Sie ticken.“', opts: startOpts },
        leak: { say: '„Komm schon, nur unter uns.“ Sie schenkt nach und wartet.', opts: [
          O('Ein bisschen aus dem Verein plaudern', function () { MX.chron(st, '📰', 'Interna in der Zeitung', j.outlet + ' druckt Interna aus Kabine und Vorstand – die Quelle bist du.', 3); return end('Drei Tage später steht alles in der Zeitung. Kabine und Vorstand wissen sofort, woher es kommt. Es war eine Masche.', fx(st, { kab: -6, team: -4, board: -8, sd: -6, media: -3, jrn: [j.id, 6], stress: 6, partner: pt ? -4 : 0 })); }),
          O('Lachen: „Über Interna rede ich nicht.“', function () { return end(fnm(j) + ' verliert schnell das Interesse. Da ging es wohl nie um dich.', fx(st, { jrn: [j.id, -4] })); }, { def: true })] },
        match: { say: 'Zwischen euch knistert es.' + (pt ? ' Zu Hause wartet ' + fnm(pt) + '.' : '') + ' Wie geht es weiter?', opts: [
          O('Nummern tauschen und ein Date ausmachen', function () { jCandM(st, j); return end(fnm(j) + ' tippt ihre Nummer in dein Handy. Ihr seht euch wieder.', fx(st, { stress: -1 })); }, { hint: pt ? 'Heimlicher Kontakt neben der Beziehung' : 'Kann eine Beziehung werden' }),
          O('Mit zu ihr', function () { var cd = jCandM(st, j); if (pt) MX.makePartner(st, cd); else cd.stage = Math.max(cd.stage || 0, 1); return end('Eine lange Nacht. „Das bleibt garantiert off the record.“', fx(st, { stress: pt ? 4 : -2, partner: pt ? -2 : 0 })); }, { hint: pt ? 'Affäre – Entdeckungsrisiko' : '' }),
          O('Lieber professionell bleiben', function () { return end('Ihr belasst es bei einem guten Gespräch.', fx(st, { jrn: [j.id, 3], partner: pt ? 1 : 0 })); }, { def: true })] }
      } };
  });
  // Spende des Vereins an die Fanszene: Choreo oder Auswärtsfahrt
  MX.DON = { choreo: { n: HB ? 'Choreo im Fanblock mitfinanzieren' : 'Choreo in der Kurve mitfinanzieren', ic: '🎨', base: 15000, fans: { ultras: 8, active: 6, clubs: 3 }, txt: 'Am Spieltag zeigt die Kurve eine riesige Choreo – auf einem Spruchband wird der Trainer gefeiert.' },
    away: { n: 'Auswärtsfahrt der Fans bezuschussen', ic: '🚌', base: 20000, fans: { away: 10, active: 4, clubs: 3 }, txt: 'Mehrere volle Busse fahren mit – im Gästeblock hallt dein Name.' } };
  MX.donCost = function (st, k) { return cash(st, MX.DON[k].base * (HB ? 0.4 : 1)); };
  MX.donBlock = function (st, k) { var c = cl(st), last = (st.mx.don || {})[k]; if (!c) return 'kein Verein'; if (last != null && tick(st) - last < 8) return 'wieder in ' + (8 - (tick(st) - last)) + ' Wo.'; if (c.cash < MX.donCost(st, k)) return 'zu wenig Geld'; return ''; };
  MX.donate = function (st, k) { var why = MX.donBlock(st, k), a = MX.DON[k]; if (why) return { ok: false, why: why }; var cost = MX.donCost(st, k); st.mx.don = st.mx.don || {}; st.mx.don[k] = tick(st);
    var e = fx(st, { cash: [-cost, 'Fanarbeit'], fans: a.fans, fanClubs: 2, ultras: k === 'choreo' ? 3 : 1, mrep: 1 }); MX.chron(st, a.ic, 'Spende an die Fans', a.n + ' (' + money(cost) + ').', 1); return { ok: true, txt: a.txt, fx: e }; };
  // Nationaltrainer: Gespräch mit dem Verband
  add('mx_ntfed', function (st, c) {
    var job = st.mx.ntJob; if (!job) return null; var nat = MN ? MN.natName(job.code) : job.code, sd = job.fedName || (job.fedName = MX.newName(st, 'fed' + job.code));
    function tr(v) { job.trust = clamp(job.trust + v, 0, 100); return { t: 'Vertrauen Verband ' + (v > 0 ? '+' : '−') + Math.abs(v), pos: v > 0, neg: v < 0 }; }
    return { title: 'Termin beim Verband', cat: 'medien', imp: 'normal', img: 'vorstand', max: 1, ic: '🏛️', who: { n: sd, role: 'Sportdirektor · Verband ' + nat, ic: '🏛️' },
      nodes: { start: { say: '„Schön, dass Sie Zeit haben, Trainer. Was können wir für die Nationalmannschaft tun?“', opts: [
        O('Mehr Lehrgänge und Testspiele fordern', function () { var ok = hr('ntfed1' + tick(st), 1) < 0.35 + job.trust / 200; return end(ok ? '„Wir finden zwei zusätzliche Termine.“' : '„Der Kalender ist voll – die Vereine würden toben.“', [tr(ok ? 3 : -2)]); }),
        O('Nachwuchsarbeit des Verbands stärken', function () { return end('Ihr vereinbart einen gemeinsamen Sichtungstag. Der Verband ist angetan.', [tr(4)].concat(fx(st, { mrep: 1 }))); }, { def: true }),
        O('Prämien für das Team verhandeln', function () { var ok = hr('ntfed2' + tick(st), 2) < 0.3 + job.trust / 250; return end(ok ? '„Einverstanden – die Mannschaft wird es Ihnen danken.“' : '„Die Prämien sind ausverhandelt.“ Man hält dich für schwierig.', [tr(ok ? 1 : -4)]); }),
        O('Über die eigene Zukunft sprechen', function () { return end(job.trust >= 65 ? '„Wir planen langfristig mit Ihnen.“' : '„Entscheidend sind die Ergebnisse beim nächsten Turnier.“', [tr(1)]); })
      ] } } };
  });
  // ============================================================================================
  // SCHREIBEN MIT EINER BEKANNTSCHAFT (analog Spielerkarriere)
  // ============================================================================================
  add('mx_chat', function (st, c) {
    var lf = st.mx.life, x = MX.cand(st, c.cid) || (lf.partner && lf.partner.id === c.cid ? lf.partner : null) || c.snap, pt = lf.partner; if (!x) return null;
    if (!c.snap && x) c.snap = { id: x.id, name: x.name, job: x.job, v: x.v, dates: x.dates || 0, stage: x.stage || 0, football: x.football }; // bleibt lesbar, auch wenn die Person die Kontaktliste verlässt
    var t = tick(st), opts = [
      O('Flirten', function () { var fresh = x.msgT !== t; x.msgT = t; if (fresh) x.v = clamp(x.v + 4, 0, 100);
        if (fresh && hr('chat' + x.id + t, 1) < 0.3) { x.v = clamp(x.v + 2, 0, 100); return end(fnm(x) + ' antwortet mit drei Emojis – und: „Wann sehen wir uns endlich?“', fx(st, { stress: -2 })); }
        return end(fresh ? 'Ihr schreibt bis spät in die Nacht.' : fnm(x) + ' antwortet knapp – ihr habt heute schon viel geschrieben.', fresh ? fx(st, { stress: -1 }) : []); }, { def: true }),
      O('Zum nächsten Heimspiel einladen', function () { if (x.match === t) return end('Die Einladung steht schon.', []); x.match = t; var fan = (x.football || 5) >= 6; x.v = clamp(x.v + (fan ? 6 : 2), 0, 100); if (x.aff) lf.suspect = t + 4;
        return end(fan ? fnm(x) + ' ist begeistert: „Ich setz mich direkt hinter die Bank!“' : fnm(x) + ': „Ich hab keine Ahnung von ' + (HB ? 'Handball' : 'Fußball') + ' – aber für dich komm ich.“', []); }, { hint: x.aff ? 'Viele Kameras im Stadion' : '' })
    ];
    if ((x.dates || 0) >= 1 && x.v >= 55) opts.push(O('Noch spontan bei ihr vorbeischauen', function () {
      if (hr('chatv' + x.id + t, 2) < 0.4 + (x.v - 55) / 60) { x.v = clamp(x.v + 7, 0, 100); x.night = (x.night || 0) + 1; x.dates = (x.dates || 0) + 1; lf.lastDate = t;
        if (pt && !x.aff) MX.makePartner(st, x); // vergeben → daraus wird eine heimliche Beziehung
        return end('Aus „nur kurz vorbeischauen“ wird eine lange Nacht. ' + fnm(x) + ' schläft noch, als du dich rausschleichst.', fx(st, { stress: pt ? 4 : -2, partner: pt ? -2 : 0 })); }
      x.v = clamp(x.v - 3, 0, 100); return end(fnm(x) + ' macht nur kurz die Tür auf: „Heute nicht – aber schön, dass du da bist.“', []); }, { hint: pt ? 'Affäre – Entdeckungsrisiko' : 'Kann die Nacht werden – oder zu schnell sein' }));
    if ((x.dates || 0) >= 2 && !x.aff) opts.push(O('Fragen, was das zwischen euch ist', function () {
      if (hr('chatq' + x.id + t, 3) < 0.4 + (x.v - 60) / 50 + (x.night ? 0.08 : 0)) { MX.makePartner(st, x); return end(fnm(x) + ' grinst: „Ich dachte schon, du fragst nie.“ ' + (pt ? 'Ab jetzt triffst du dich heimlich mit ' + fnm(x) + '.' : 'Ihr seid jetzt zusammen.'), fx(st, { stress: pt ? 3 : -2 })); }
      x.v = clamp(x.v - 4, 0, 100); return end(fnm(x) + ' zögert: „Ich mag dich – aber lass uns nichts überstürzen.“', []); }));
    opts.push(O('Kontakt einschlafen lassen', function () { MX.candEnd(st, x.id, 'Der Kontakt zu ' + x.name + ' ist eingeschlafen.'); return end('Du antwortest nicht mehr. Irgendwann schreibt ' + fnm(x) + ' auch nicht mehr.', []); }));
    return { title: 'Nachricht an ' + fnm(x), cat: 'privat', imp: 'normal', img: 'date', max: 1, ic: '💬', who: { n: x.name, role: (x.aff ? 'heimliche Beziehung' : (x.stage || 0) >= 1 ? 'Dating' : 'Nummer getauscht') + ' · ' + x.job, ic: '💬' },
      nodes: { start: { say: 'Du öffnest den Chat mit ' + fnm(x) + '. Interesse: ' + Math.round(x.v) + '/100. ' + (x.dates ? 'Ihr hattet schon ' + x.dates + ' Treffen.' : 'Ihr kennt euch erst kurz.'), opts: opts } } };
  });
})(RFM);
