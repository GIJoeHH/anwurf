// Spielerkarriere 3.0 – Gesprächsinhalte für das zentrale Dialogsystem (R.life): Trainer, Spielerberater,
// Vertragsverhandlung mit Gegenangeboten, Vereinsführung, Presse (mehrstufig, mit Gedächtnis), Fans/Ultras,
// Partnerschaft, Familie, Freunde, Mannschaftsarzt, Jugendtrainer, Finanzberatung. Gemeinsam für beide Sportarten.
(function (R) {
  var L = R.life, X = R.cx, C = R.pc, W = R.world, AG = R.ag, PF = R.pf, FA = R.fa, D = R.data;
  if (!L || !X) return;
  var HB = X.HB, SW = X.SW, clamp = X.clamp, money = L.money;
  function tick(st) { return st.tick || 0; }
  function pick(a) { return a[Math.floor(R.rand() * a.length)]; }
  function rk(c) { return c.p && !c.p.youth ? C.squadRank(c.st, c.p) : 0; }
  function slots(c) { return AG && c.p ? (AG.SLOTS[c.p.pos] || 2) : 2; }
  function coachName(c) { return c.c && c.c.coach ? c.c.coach.name || 'Der Trainer' : 'Der Trainer'; }
  function weakest(p) { var k = Object.keys(X.TRAITS).filter(function (x) { return p.attr && p.attr[x] != null; }).sort(function (a, b) { return p.attr[a] - p.attr[b]; }); return k[0] || 'tec'; }
  function strongest(p) { var k = Object.keys(X.TRAITS).filter(function (x) { return p.attr && p.attr[x] != null; }).sort(function (a, b) { return p.attr[b] - p.attr[a]; }); return k[0] || 'tec'; }
  function end(r, e, x) { var o = { r: r, e: e, end: true }; if (x) for (var k in x) o[k] = x[k]; return o; }
  function go(next, r, e, x) { var o = { r: r, e: e, next: next }; if (x) for (var k in x) o[k] = x[k]; return o; }
  function chance(p) { return R.rand() < clamp(p, 0.03, 0.97); }

  // ================= TRAINER =================
  L.addDlg([{
    id: 'coach', cat: 'trainer', ic: '📋', scene: 'trainer', title: 'Trainergespräch', max: 5,
    who: function (c) { return { n: coachName(c), role: 'Cheftrainer · ' + (c.c ? c.c.short : ''), ic: '📋', kind: 'coach' }; },
    nodes: {
      start: { say: function (c) { var t = c.pc.trust; return t >= 65 ? '„Komm rein, setz dich. Ich habe ohnehin mit dir reden wollen – was liegt dir auf dem Herzen?“' : t >= 40 ? '„Du wolltest mich sprechen? Ich habe zehn Minuten. Worum geht es?“' : '„Ich höre. Aber mach es kurz – die Einheit beginnt gleich.“'; },
        opts: [{ l: 'Ich will mehr Einsatzzeit.', fx: function () { return go('play', 'Der Trainer lehnt sich zurück und verschränkt die Arme.'); } },
          { l: 'Wo sehen Sie meine Rolle in der Mannschaft?', fx: function () { return go('role', 'Er überlegt kurz.'); } },
          { l: 'Was muss ich verbessern?', fx: function () { return go('feedback', 'Er holt ein Tablet mit deinen Werten hervor.', { coach: 1 }); } },
          { l: 'Ich könnte mir eine andere Position vorstellen.', req: function (c) { return c.cx.prof.pos2 && c.cx.prof.pos2.length; }, fx: function () { return go('pos', 'Er hebt die Augenbrauen.'); } },
          { l: 'Mir passt etwas am Training nicht.', fx: function () { return go('crit', 'Sein Blick wird ernster.', { coach: -1 }); } }] },
      play: { say: function (c) { var r = rk(c); return r <= slots(c) ? '„Du spielst regelmäßig. Ich erwarte, dass du daraus mehr machst – Konstanz statt Forderungen.“' : '„Ehrlich gesagt: Im Moment sind ' + (r - 1) + ' Spieler auf deiner Position vor dir. Überzeug mich im Training.“'; },
        opts: [{ l: 'Verstanden. Ich dränge mich im Training auf.', fx: function () { return go('close', '„Genau das will ich sehen.“ Er nickt anerkennend.', { coach: 3, disc: 1 }, { mem: { k: 'promise_work', txt: 'Versprochen, sich im Training aufzudrängen' } }); } },
          { l: 'Ich erwarte eine faire Chance – sonst muss ich nachdenken.', fx: function () { return go('ultimatum', '„Nachdenken? Interessant.“ Die Stimmung kühlt ab.', { coach: -2, amb: 2 }, { mem: { k: 'demand_playtime', txt: 'Mehr Einsatzzeit gefordert' } }); } },
          { l: 'Dann sage ich das eben öffentlich.', hint: 'riskant', fx: function () { return end('Er steht auf. „Mach das. Aber dann brauchst du hier nicht mehr anklopfen.“', { coach: -9, media: 2, risk: 3 }, { mem: { k: 'threat_press', txt: 'Mit öffentlicher Kritik gedroht' } }); } }] },
      ultimatum: { say: function (c) { return c.pc.trust >= 52 ? '„Gut. Ich sehe deine Arbeit. In den nächsten Wochen bekommst du deine Minuten – nutz sie.“' : '„Drohungen beeindrucken mich nicht. Wer spielt, entscheide ich nach Leistung.“'; },
        opts: [{ l: 'Danke – ich werde es zurückzahlen.', fx: function (st, c) { if (c.pc.trust >= 52) { L.life(st).coachPromise = tick(st) + 5; return end('Er reicht dir die Hand. Eine Chance – nicht mehr, nicht weniger.', { coach: 2, conf: 3 }, { mem: { k: 'coach_promised', txt: 'Trainer hat Spielminuten in Aussicht gestellt' } }); } return end('„Dann zeig es.“ Das Gespräch ist beendet.', { coach: 1 }); } },
          { l: 'Dann soll sich mein Berater umhören.', fx: function (st) { X.setFlag(st, 'wantMove', st.season); return end('Er zuckt mit den Schultern. „Das ist dein gutes Recht.“', { coach: -3, loyal: -3 }, { mem: { k: 'want_move', txt: 'Wechselgedanken gegenüber dem Trainer geäußert' } }); } }] },
      role: { say: function (c) { var r = rk(c), s = slots(c); return '„' + (r <= s ? 'Du bist für mich ein fester Bestandteil der Startelf.' : r <= s + 2 ? 'Du bist ein wichtiger Rotationsspieler – du wirst gebraucht.' : 'Du bist ein Perspektivspieler. Dein Weg dauert noch.') + '“'; },
        opts: [{ l: 'Ich will mehr Verantwortung übernehmen.', fx: function () { return go('lead', '„Verantwortung muss man sich nehmen, nicht bekommen.“', { amb: 1 }); } },
          { l: 'Damit bin ich zufrieden.', fx: function () { return end('Er lächelt knapp. Ein ruhiges, ehrliches Gespräch.', { sat: 3, coach: 1 }); } },
          { l: 'Ich sehe mich weiter vorne.', fx: function () { return go('close', '„Dann beweis es mir.“', { amb: 2, conf: 1 }); } }] },
      lead: { say: '„Rede mit den Jungs, sei auf dem Platz laut, geh in schwierigen Phasen voran. Ich beobachte das.“',
        opts: [{ l: 'Ich spreche mit dem Kapitän darüber.', fx: function (st) { X.pplRel(st, 'capt', 3); return end('Der Trainer nickt. „Gute Idee – nicht gegen, sondern mit ihm.“', { lead: 2, capt: 2 }); } },
          { l: 'Ich gehe voran – auch mit Kritik an anderen.', fx: function () { return end('„Vorsicht, dass du nicht übers Ziel hinausschießt.“', { lead: 3, mates: -2, coach: 1 }); } }] },
      feedback: { say: function (c) { var w = weakest(c.p), s = strongest(c.p); return '„Deine Stärke ist ' + X.TRAITS[s] + ' – daran zweifelt keiner. Aber bei ' + X.TRAITS[w] + ' fehlt mir noch einiges.“'; },
        opts: [{ l: 'Ich mache Zusatzschichten im Trainingszentrum.', fx: function (st, c) { var lf = L.life(st); lf.train[weakest(c.p)] = (lf.train[weakest(c.p)] || 0) + 0.4; return go('close', '„Mach das – aber übertreib es nicht.“ Er notiert sich etwas.', { coach: 2, disc: 2 }, { mem: { k: 'promise_work', txt: 'Zusatzschichten zugesagt' } }); } },
          { l: 'Können wir Videoanalyse zusammen machen?', fx: function () { return go('close', '„Dienstag nach dem Training. Bring Fragen mit.“', { coach: 3 }); } },
          { l: 'Das sehe ich anders.', fx: function (st, c) { return c.pc.trust > 60 ? go('close', '„Ich mag Spieler mit Meinung. Trotzdem: arbeite dran.“', { conf: 2 }) : go('close', 'Er schweigt einen Moment zu lange.', { coach: -3, conf: 1 }); } }] },
      pos: { say: function (c) { var p2 = c.cx.prof.pos2[0]; return '„Als ' + ((D.posNames && D.posNames[p2]) || p2) + '? Hm. Ich habe dich dort im Training gesehen, das war nicht schlecht.“'; },
        opts: [{ l: 'Ich will es im Training ausprobieren.', fx: function (st, c) { L.life(st).posTry = c.cx.prof.pos2[0]; return end('„Zwei Wochen. Dann reden wir wieder.“', { coach: 2, amb: 1 }, { mem: { k: 'pos_try', txt: 'Positionswechsel angefragt' } }); } },
          { l: 'Nur, wenn es der Mannschaft hilft.', fx: function () { return end('„Das ist die richtige Einstellung.“', { coach: 3, team: 2 }); } }] },
      crit: { say: '„Was genau stört dich?“',
        opts: [{ l: 'Zu wenig individuelle Förderung.', fx: function (st, c) { return c.pc.trust >= 55 ? go('close', '„Guter Punkt. Ich rede mit dem Athletiktrainer.“', { coach: 1, sat: 2 }) : go('close', '„Individuelle Förderung muss man sich verdienen.“', { coach: -2 }); } },
          { l: 'Die Belastung ist zu hoch.', fx: function (st) { L.life(st).loadTalk = tick(st) + 3; return go('close', '„Ich lasse die Werte prüfen.“ Er wirkt nachdenklich.', { coach: 0, stress: -2 }); } },
          { l: 'Vergessen Sie es.', fx: function () { return end('Er sieht dich einen Moment irritiert an.', { coach: -1 }); } }] },
      close: { say: '„Gut. Dann sehen wir uns auf dem Platz.“',
        opts: [{ l: 'Danke, Trainer.', fx: function () { return end('Ein kurzer Händedruck.', { coach: 1 }); } }, { l: 'Eine Sache noch …', fx: function () { return go('start', '„Na schön, schieß los.“'); } }] }
    },
    sum: function (st, c, d, s) { var m = s.log.map(function (x) { return x.a; }); return 'Gesprächsverlauf: ' + m.join(' → ') + '. Trainervertrauen jetzt ' + Math.round(c.pc.trust) + '.'; }
  }]);

  // ================= SPIELERBERATER =================
  function ag(c) { return AG ? AG.current(c.st) : null; }
  L.addDlg([{
    id: 'agent', cat: 'berater', ic: '💼', scene: 'berater', title: 'Beratergespräch', max: 6,
    who: function (c) { var a = ag(c); return a ? { n: a.n, role: 'Spielerberater · ' + a.firm, ic: '💼', kind: 'agent' } : { n: 'Kein Berater', role: '' }; },
    init: function (st, c, d, s) { if (!ag(c)) { s.done = true; s.sum = 'Du hast derzeit keinen Spielerberater – unter „Berater & Verträge“ kannst du einen engagieren.'; } },
    nodes: {
      start: { say: function (c) { var a = ag(c); return a && a.a.care > 60 ? '„Schön, dass du anrufst. Wie geht es dir – wirklich? Und was können wir angehen?“' : '„Ich hab nicht viel Zeit, aber für dich immer. Was gibt es?“'; },
        opts: [{ l: 'Lass uns über meine Karriereziele reden.', fx: function () { return go('goals', ''); } },
          { l: 'Was bin ich wert – verdiene ich genug?', fx: function () { return go('wage', ''); } },
          { l: 'Ich denke über einen Wechsel nach.', fx: function () { return go('move', '', { loyal: -1 }); } },
          { l: 'Wäre eine Leihe sinnvoll?', req: function (c) { return c.pro && rk(c) > slots(c); }, fx: function () { return go('loan', ''); } },
          { l: 'Gibt es Sponsoring-Möglichkeiten?', req: function (c) { return c.pc.fame >= 12 && !c.youth; }, fx: function () { return go('spons', ''); } },
          { l: 'Was hältst du von einer Ausstiegsklausel?', req: function (c) { return c.pro; }, fx: function () { return go('clause', ''); } },
          { l: 'Wie stehen meine Chancen auf die Nationalmannschaft?', req: function (c) { return c.pro; }, fx: function () { return go('nat', ''); } },
          { l: 'Ich habe Probleme mit dem Trainer.', req: function (c) { return c.pc.trust < 48; }, fx: function () { return go('coach', ''); } }] },
      goals: { say: function (c) { var a = ag(c); return a.a.comm > 65 ? '„Ganz ehrlich? In deinem Alter musst du mitnehmen, was geht. Große Bühne, großes Geld – der Rest kommt von selbst.“' : a.a.yth > 65 && c.age < 23 ? '„Du brauchst jetzt Spielpraxis und einen Trainer, der dich entwickelt. Geld ist zweitrangig.“' : '„Was ist dir wichtiger: Titel, Sicherheit oder Heimat? Das entscheidet, welche Türen ich öffne.“'; },
        opts: [{ l: 'Sportliche Entwicklung steht an erster Stelle.', fx: function () { return go('question', '„Verstanden. Dann filtere ich Angebote danach.“', { amb: 1 }, { mem: { k: 'goal_sport', txt: 'Sportliche Entwicklung als Ziel genannt' } }); } },
          { l: 'Finanzielle Sicherheit für mich und meine Familie.', fx: function () { return go('question', '„Klug. Dann achten wir auf Laufzeit und Absicherung.“', {}, { mem: { k: 'goal_money', txt: 'Finanzielle Sicherheit als Ziel genannt' } }); } },
          { l: 'Ich will in der Nähe meiner Heimat bleiben.', fx: function () { return go('question', '„Das schränkt ein, aber es ist dein Leben.“', { family: 2 }, { mem: { k: 'goal_home', txt: 'Heimatnähe als Ziel genannt' } }); } }] },
      question: { say: '„Noch Fragen zu meiner Einschätzung?“',
        opts: [{ l: 'Warum genau empfiehlst du das?', fx: function (st, c) { AG.know(st, ag(c).id, 'hon', 1); AG.know(st, ag(c).id, 'comm', 1); return go('why', 'Kurzes Zögern am anderen Ende.'); } },
          { l: 'Klingt gut, mach weiter so.', fx: function (st, c) { AG.trust(st, 2, 'Zustimmung im Gespräch'); return end('„Ich melde mich, sobald sich etwas tut.“'); } },
          { l: 'Ich hole mir eine zweite Meinung.', fx: function (st, c) { AG.trust(st, -3, 'Zweite Meinung angekündigt'); AG.know(st, ag(c).id, 'neg', 1); return end('„Mach das. Aber verlier keine Zeit.“ Die Stimme klingt gekränkt.', { conf: 1 }); } }] },
      why: { say: function (c) { var a = ag(c); return a.a.hon >= 60 ? '„Offen gesagt: Bei einem Wechsel verdiene ich mit, das gehört zur Wahrheit. Aber ich würde dir nichts empfehlen, woran ich nicht glaube.“' : '„Vertrau mir einfach, ich mache das seit Jahren. Die Details sind kompliziert.“'; },
        opts: [{ l: 'Danke für die Offenheit.', fx: function (st, c) { var a = ag(c); AG.know(st, a.id, 'hon', 2); AG.trust(st, a.a.hon >= 60 ? 4 : -2, 'Nachfrage zu Interessen'); return end(a.a.hon >= 60 ? 'Das Vertrauen wächst.' : 'Ein schaler Beigeschmack bleibt.'); } },
          { l: 'Das überzeugt mich nicht.', fx: function (st, c) { AG.trust(st, -3, 'Skepsis geäußert'); return end('„Wie du meinst.“ Das Gespräch endet kühl.', { conf: 1 }); } }] },
      wage: { say: function (c) { var fair = W.fairWage(c.p), w = c.p.wage; return '„Dein Marktwert liegt bei etwa ' + money(c.p.value) + '. Marktüblich wären rund ' + money(fair) + ' im Jahr – du bekommst ' + money(w) + '. ' + (w < fair * 0.85 ? 'Da ist Luft nach oben.' : w > fair * 1.1 ? 'Du wirst gut bezahlt.' : 'Das passt im Moment.') + '“'; },
        opts: [{ l: 'Dann sprich mit dem Verein über eine Verlängerung.', req: function (c) { return c.p.contract <= 3 && !c.st.pc.offers.some(function (o) { return o.renew; }); }, fx: function (st, c) {
            var ok = c.pc.trust >= 40 && chance(0.4 + ag(c).a.neg / 250 + c.pc.trust / 300);
            if (ok) { var fair = W.fairWage(c.p); st.pc.offers.push({ id: 'own', clubId: c.c.id, renew: true, wage: Math.round(Math.max(c.p.wage * 1.05, fair * (0.88 + c.pc.trust / 600)) / 1000) * 1000, years: c.age >= 31 ? 1 : R.randInt(2, 4) }); return end('Zwei Tage später: Der Verein legt ein Verlängerungsangebot vor. Es liegt unter „Berater & Verträge“.', { conf: 2 }); }
            return end('Der Verein vertröstet: „Erst Leistung, dann reden wir.“', { conf: -1 }); } },
          { l: 'Erst mal Leistung bringen.', fx: function () { return end('„Vernünftig. Ich behalte den Markt im Auge.“', { disc: 1 }); } },
          { l: 'Dann prüf andere Vereine.', fx: function () { return go('move', ''); } }] },
      move: { say: function (c) { var a = ag(c); return a.a.net >= 60 || a.a.intl >= 60 ? '„Ich habe gute Kontakte – Interesse an dir gibt es. Die Frage ist: national oder international?“' : '„Ich kann mich umhören, aber versprechen kann ich nichts.“'; },
        opts: [{ l: 'Hör dich diskret um.', fx: function (st, c) { X.setFlag(st, 'scout', st.season); var leak = chance((100 - ag(c).a.med) / 260); if (leak) { L.life(st).leak = tick(st); return end('Leider sickert etwas durch: Eine Zeitung berichtet über Wechselgedanken.', { coach: -3, f_ultras: -3, f_club: -2, media: 1 }, { mem: { k: 'want_move', txt: 'Wechselgerüchte öffentlich geworden' } }); } return end('„Diskretion ist mein Geschäft.“ Bis zur nächsten Wechselphase meldet sich wahrscheinlich ein Verein mehr.', { loyal: -2 }, { mem: { k: 'want_move', txt: 'Berater hört sich nach Vereinen um' } }); } },
          { l: 'Auch Angebote aus dem Ausland?', fx: function (st, c) { X.setFlag(st, 'scoutAbroad', st.season); var pt = c.life.partner; return go('abroad', pt ? '„Klar. Aber hast du mit ' + pt.name.split(' ')[0] + ' darüber gesprochen?“' : '„Klar. Das Ausland kann ein Karriereschub sein.“'); } },
          { l: 'Lieber doch nicht.', fx: function () { return end('„Okay. Loyalität wird auch belohnt.“', { loyal: 2 }); } }] },
      abroad: { say: '„Ein Wechsel ins Ausland verändert alles: Sprache, Umfeld, Familie. Bist du bereit dafür?“',
        opts: [{ l: 'Ja – ich will den Schritt wagen.', fx: function (st) { return end('„Dann schaue ich mich gezielt um.“', { amb: 2, risk: 2 }, { mem: { k: 'abroad_ok', txt: 'Offen für einen Wechsel ins Ausland' } }); } },
          { l: 'Ich rede erst mit meinem Umfeld.', fx: function (st, c) { if (c.life.partner) L.start(st, 'partner_talk', { topic: 'abroad' }); return end('„Sehr gut. Melde dich, wenn du klarer siehst.“', { family: 2 }); } }] },
      loan: { say: '„Eine Leihe zu einem kleineren Verein bringt Spielpraxis. Ein Jahr Stammplatz kann mehr wert sein als zwei auf der Bank.“',
        opts: [{ l: 'Kümmer dich darum.', fx: function (st) { X.setFlag(st, 'loanWish', st.season); return end('In der nächsten Wechselphase kommt voraussichtlich ein Leihangebot.', { amb: 1 }, { mem: { k: 'loan_wish', txt: 'Leihe gewünscht' } }); } },
          { l: 'Nein, ich kämpfe hier um meinen Platz.', fx: function () { return end('„Respekt. Dann gib Gas.“', { loyal: 2, coach: 1 }); } }] },
      spons: { say: function (c) { return '„Ein Sportartikel-Hersteller fragt an: rund ' + money(Math.max(4000, c.pc.fame * 900 * (HB ? 0.3 : 1))) + ' im Jahr, dafür Termine und Social-Media-Posts.“'; },
        opts: [{ l: 'Machen wir.', fx: function (st, c) { PF.addSponsor(st, { n: 'Sportartikel-Partner', y: Math.max(4000, c.pc.fame * 900 * (HB ? 0.3 : 1)), weeks: 52 }); return end('Der Vertrag ist unterschrieben.', { fame: 1, sponsor: 5 }); } },
          { l: 'Nicht während der Saison.', fx: function () { return end('„Verstehe. Ich halte sie warm.“'); } }] },
      clause: { say: '„Eine Ausstiegsklausel gibt dir Freiheit – der Verein zahlt dafür aber meist weniger Gehalt.“',
        opts: [{ l: 'Bei der nächsten Verhandlung fordern.', fx: function () { return end('„Notiert.“', {}, { mem: { k: 'want_clause', txt: 'Ausstiegsklausel gewünscht' } }); } },
          { l: 'Ist mir nicht wichtig.', fx: function () { return end('„Dann konzentrieren wir uns aufs Gehalt.“'); } }] },
      nat: { say: function (c) { var need = W.fromMoneyScale ? W.fromMoneyScale(c.st, C.CFG.natOvr) : C.CFG.natOvr, gap = need - c.p.ovr; return gap <= 0 ? '„Du bist auf dem Zettel. Konstanz und Einsatzzeit – dann kommt der Anruf.“' : gap <= 5 ? '„Du bist nah dran. Noch ein, zwei Schritte.“' : '„Ehrlich: Da fehlt noch einiges. Konzentrier dich auf deinen Verein.“'; },
        opts: [{ l: 'Danke für die ehrliche Einschätzung.', fx: function (st) { AG.trust(st, 1); return end('', { amb: 1 }); } }] },
      coach: { say: '„Soll ich mit dem Trainer sprechen? Manchmal hilft ein Vermittler.“',
        opts: [{ l: 'Ja, bitte vermittle.', fx: function (st, c) { var a = ag(c), ok = chance(0.35 + (a.a.med + a.a.neg) / 300); return end(ok ? 'Der Berater berichtet: Das Gespräch war konstruktiv.' : 'Der Trainer fühlte sich übergangen – das ging nach hinten los.', ok ? { coach: 4 } : { coach: -4 }); } },
          { l: 'Das kläre ich selbst.', fx: function (st) { return end('„Gut so. Bleib sachlich.“', { lead: 1 }); } }] }
    },
    sum: function (st, c, d, s) { return s.log.map(function (x) { return x.a; }).join(' → '); }
  }]);

  // ================= VERTRAGSVERHANDLUNG =================
  function offer(st, d) { return st.pc.offers.filter(function (o) { return o.id === d.oid; })[0] || null; }
  function pkg(v) { return money(v.wage) + '/Jahr · ' + v.years + ' Jahre' + (v.bonus ? ' · Prämien +' + v.bonus * 25 + ' %' : '') + (v.title ? ' · Erfolgsbonus' : '') + (v.clause ? ' · Ausstiegsklausel' : ''); }
  L.addDlg([{
    id: 'negotiate', cat: 'vertrag', ic: '✍️', scene: 'vertrag', title: function (c, d) { var o = offer(c.st, d); return 'Vertragsverhandlung' + (o ? ' mit ' + c.st.clubs[o.clubId].short : ''); }, max: 10, imp: 3,
    who: function (c, d) { var o = offer(c.st, d), cl = o ? c.st.clubs[o.clubId] : null; return { n: d.rep || 'Sportdirektion', role: (cl ? cl.name : 'Verein') + ' · Verhandlungsführung', ic: '🤝', kind: 'club' }; },
    init: function (st, c, d, s) {
      var o = offer(st, d); if (!o) { s.done = true; return; }
      var a = ag(c), skill = a ? a.a.neg : 30 + c.cx.per.conf / 4;
      d.rep = d.rep || L.name();
      s.v = { wage: o.wage, years: o.years, bonus: 0, title: false, clause: false, w0: o.wage, pat: 3 + (o.renew ? 1 : 0) + (skill > 70 ? 1 : 0), last: '' };
      s.v.maxW = Math.round(o.wage * (1.06 + c.pc.fame / 400 + skill / 900 + (o.role === 'Stammspieler' ? 0.04 : 0)));
      if (L.said(st, 'want_clause')) s.v.wantClause = true;
    },
    nodes: {
      start: { say: function (c, d, s) { var o = offer(c.st, d); return o ? '„Wir möchten dich ' + (o.renew ? 'langfristig halten' : 'unbedingt verpflichten') + '. Unser Angebot: ' + pkg(s.v) + (o.fee ? ', die Ablöse von ' + money(o.fee) + ' tragen wir.' : '.') + '“' : 'Das Angebot ist nicht mehr gültig.'; }, opts: function (c, d, s) { return negOpts(c, d, s); } },
      talk: { say: function (c, d, s) { return s.v.last + ' Aktueller Stand: ' + pkg(s.v) + '.'; }, opts: function (c, d, s) { return negOpts(c, d, s); } }
    },
    sum: function (st, c, d, s) { return s.v.result || ('Verhandlung offen – letzter Stand: ' + pkg(s.v)); }
  }]);
  function negOpts(c, d, s) {
    var v = s.v;
    function counter(st, ask, agg) {
      var want = Math.round(v.wage * (1 + ask) / 1000) * 1000; v.pat -= agg ? 2 : 1;
      if (v.pat <= 0 && chance(agg ? 0.7 : 0.45)) { var o = offer(st, d); st.pc.offers = st.pc.offers.filter(function (x) { return x !== o; }); v.result = 'Verhandlung abgebrochen – das Angebot ist zurückgezogen.'; return end('„Wir sind hier fertig.“ Der Verein zieht das Angebot zurück.', { conf: -2, board: -2 }); }
      if (want <= v.maxW) { v.wage = want; v.last = '„In Ordnung, darauf können wir uns einigen.“'; return go('talk', 'Akzeptiert: ' + money(want) + '/Jahr.', { conf: 1 }); }
      var mid = Math.round((v.wage + Math.max(v.wage, v.maxW)) / 2 / 1000) * 1000;
      if (mid > v.wage) { v.wage = mid; v.last = '„Ganz so viel geht nicht. Wir kommen dir aber auf ' + money(mid) + ' entgegen.“'; return go('talk', 'Gegenangebot: ' + money(mid) + '/Jahr.'); }
      v.last = '„Beim Gehalt ist unser Rahmen ausgeschöpft.“'; return go('talk', 'Der Verein bleibt hart.', { stress: 1 });
    }
    var list = [
      { l: 'Annehmen und unterschreiben', fx: function (st) {
          var o = offer(st, d); if (!o) return end('Das Angebot ist nicht mehr da.');
          o.wage = v.wage; o.years = v.years; var res = C.acceptOffer(st, o.id);
          if (res.ok) { L.life(st).contract = { club: o.clubId, bonus: v.bonus, title: v.title, clause: v.clause, wage: v.wage, years: v.years, s: st.season }; v.result = 'Unterschrieben: ' + pkg(v) + '.'; L.remember(st, o.renew ? 'renewed' : 'signed', 'Vertrag ' + (o.renew ? 'verlängert' : 'unterschrieben') + ': ' + pkg(v), st.clubs[o.clubId].short); }
          return end(res.ok ? 'Handschlag, Unterschrift, Foto für die Vereinsmedien. ' + (res.msg || '') : res.why, res.ok ? { conf: 3, sat: 4 } : {});
        } },
      { l: 'Mehr Grundgehalt fordern (+10 %)', fx: function (st) { return counter(st, 0.1, false); } },
      { l: 'Deutlich mehr fordern (+25 %)', hint: 'riskant', fx: function (st) { return counter(st, 0.25, true); } },
      { l: 'Längere Laufzeit (+1 Jahr)', req: function () { return v.years < 5 && c.age < 32; }, fx: function () { v.years++; v.pat -= 0.5; v.last = '„Mehr Laufzeit? Sehr gern – das zeigt Bindung.“'; return go('talk', 'Laufzeit jetzt ' + v.years + ' Jahre.', { loyal: 1 }); } },
      { l: 'Kürzere Laufzeit (−1 Jahr)', req: function () { return v.years > 1; }, fx: function () { v.years--; v.pat -= 1; v.wage = Math.round(v.wage * 0.98 / 1000) * 1000; v.last = '„Kürzer? Dann müssen wir beim Gehalt etwas nachjustieren.“'; return go('talk', 'Laufzeit ' + v.years + ' Jahre, Gehalt leicht angepasst.'); } },
      { l: 'Höhere Einsatz- und ' + SW.goal + 'prämien', req: function () { return v.bonus < 2; }, fx: function () { v.pat -= 1; if (chance(0.65)) { v.bonus++; v.last = '„Leistung soll sich lohnen – einverstanden.“'; return go('talk', 'Prämien erhöht.'); } v.last = '„Unsere Prämienordnung gilt für alle.“'; return go('talk', 'Abgelehnt.'); } },
      { l: 'Erfolgsbonus (Titel / Aufstieg)', req: function () { return !v.title; }, fx: function () { v.pat -= 0.5; if (chance(0.7)) { v.title = true; v.last = '„Wenn wir etwas gewinnen, sollst du profitieren.“'; return go('talk', 'Erfolgsbonus aufgenommen.'); } v.last = '„Kein Erfolgsbonus – das ist bei uns nicht üblich.“'; return go('talk', 'Abgelehnt.'); } },
      { l: 'Ausstiegsklausel verlangen', req: function () { return !v.clause; }, fx: function () { v.pat -= 1; if (chance(0.45 + (v.wantClause ? 0.1 : 0))) { v.clause = true; v.wage = Math.round(v.wage * 0.97 / 1000) * 1000; v.last = '„Eine Klausel – gut, aber dann sinkt das Grundgehalt etwas.“'; return go('talk', 'Ausstiegsklausel aufgenommen.'); } v.last = '„Eine Ausstiegsklausel kommt für uns nicht infrage.“'; return go('talk', 'Abgelehnt.'); } },
      { l: 'Bedenkzeit – Gespräch beenden', fx: function () { v.result = 'Bedenkzeit erbeten. Letzter Stand: ' + pkg(v) + '.'; return end('„Melde dich bald, das Angebot gilt nicht ewig.“'); } },
      { l: 'Verhandlung abbrechen', fx: function (st) { var o = offer(st, d); if (o) { C.declineOffer(st, o.id); } v.result = 'Angebot abgelehnt.'; return end('Man trennt sich höflich, aber kühl.', { board: o && o.renew ? -3 : 0 }); } }
    ];
    // Verhandlungsergebnis sofort im Angebot sichtbar halten
    var o = offer(c.st, d); if (o) { o.wage = v.wage; o.years = v.years; o.neg3 = { bonus: v.bonus, title: v.title, clause: v.clause }; }
    return list;
  }

  // ================= VEREINSFÜHRUNG =================
  L.addDlg([{
    id: 'board', cat: 'vertrag', ic: '🏛️', scene: 'vorstand', title: 'Gespräch mit der Vereinsführung', max: 4,
    who: function (c) { return { n: c.life.boardName || (c.life.boardName = L.name()), role: 'Sportvorstand · ' + (c.c ? c.c.short : ''), ic: '🏛️', kind: 'board' }; },
    nodes: {
      start: { say: function (c) { return c.cx.rel.board >= 60 ? '„Schön, dass du vorbeikommst. Du bist einer, auf den wir bauen.“' : '„Was können wir für dich tun?“'; },
        opts: [{ l: 'Wohin soll sich der Verein entwickeln?', fx: function () { return go('future', ''); } },
          { l: 'Ich möchte über meinen Vertrag sprechen.', req: function (c) { return c.pro && c.p.contract <= 2; }, fx: function () { return go('contract', ''); } },
          { l: 'Die Trainingsbedingungen könnten besser sein.', fx: function () { return go('infra', ''); } },
          { l: 'Ich stehe zum Verein – das wollte ich sagen.', fx: function () { return end('Der Vorstand ist sichtlich angetan.', { board: 4, loyal: 3, f_club: 2 }, { mem: { k: 'promise_loyal', txt: 'Vereinstreue gegenüber der Vereinsführung versichert' } }); } }] },
      future: { say: function (c) { var lg = c.c ? c.c.league : 3; return '„' + (lg === 1 ? 'Wir wollen oben angreifen und international spielen.' : 'Mittelfristig wollen wir eine Liga höher.') + ' Dafür brauchen wir Spieler, die vorangehen.“'; },
        opts: [{ l: 'Da will ich dabei sein.', fx: function () { return end('„Genau das wollten wir hören.“', { board: 3, loyal: 2 }); } }, { l: 'Dafür fehlt mir die Qualität im Kader.', fx: function () { return end('Ein kurzes, angespanntes Schweigen.', { board: -2, amb: 1 }); } }] },
      contract: { say: '„Wir schätzen dich. Die sportliche Leitung entscheidet, aber ich kann Signale senden.“',
        opts: [{ l: 'Ich würde gern verlängern.', fx: function (st, c) { if (c.cx.rel.board >= 45 && c.pc.trust >= 35 && !st.pc.offers.some(function (o) { return o.renew; })) { var fair = W.fairWage(c.p); st.pc.offers.push({ id: 'own', clubId: c.c.id, renew: true, wage: Math.round(Math.max(c.p.wage, fair * 0.92) / 1000) * 1000, years: c.age >= 31 ? 1 : R.randInt(2, 3) }); return end('Wenige Tage später liegt ein Verlängerungsangebot vor.', { board: 2, loyal: 2 }); } return end('„Wir melden uns.“ Bisher bleibt es dabei.', {}); } },
          { l: 'Ich halte mir alles offen.', fx: function () { return end('„Verstehe.“ Der Ton bleibt freundlich, aber vorsichtig.', { board: -2 }); } }] },
      infra: { say: function (c) { var t = c.c && c.c.fac ? (c.c.fac.training || 0) : 0, m = c.c && c.c.fac ? (c.c.fac.medizin || 0) : 0; return '„Unser Trainingszentrum ist auf Stufe ' + t + ', die medizinische Abteilung auf Stufe ' + m + '. Investitionen sind geplant, aber das Geld ist begrenzt.“'; },
        opts: [{ l: 'Konstruktive Vorschläge machen', fx: function () { return end('Der Vorstand notiert sich deine Punkte.', { board: 2, lead: 1 }); } }, { l: 'Unzufriedenheit deutlich machen', fx: function () { return end('„Wir sind kein Wunschkonzert.“', { board: -3, sat: -1 }); } }] }
    }
  }]);

  // ================= PRESSE (mehrstufig, Gedächtnis, Journalisten) =================
  var PQ = [
    { k: 'win', when: function (c) { var lm = c.cx.lastMatch; return lm && lm.score[lm.side] > lm.score[1 - lm.side]; }, q: function (c) { return 'Starker Sieg zuletzt. Wie viel Anteil hatten Sie daran?'; } },
    { k: 'loss', when: function (c) { var lm = c.cx.lastMatch; return lm && lm.score[lm.side] < lm.score[1 - lm.side]; }, q: function (c) { return 'Die Niederlage war deutlich. Was ist da schiefgelaufen?'; } },
    { k: 'rumor', when: function (c) { return c.st.pc.offers.length || c.st.pc.moving || L.life(c.st).leak; }, q: function (c) { return 'Es gibt Gerüchte über einen Wechsel. Was ist da dran?'; } },
    { k: 'coach', when: function (c) { return c.pc.trust < 42 || L.said(c.st, 'demand_playtime', 30); }, q: function () { return 'Man hört, das Verhältnis zum Trainer sei angespannt. Stimmt das?'; } },
    { k: 'inj', when: function (c) { return c.inj; }, q: function () { return 'Wie geht es Ihnen nach der Verletzung – wann sind Sie zurück?'; } },
    { k: 'contract', when: function (c) { return c.pro && c.p.contract <= 1; }, q: function () { return 'Ihr Vertrag läuft aus. Bleiben Sie?'; } },
    { k: 'fans', when: function (c) { return L.life(c.st).fans.krit > 55 || L.life(c.st).protest; }, q: function () { return 'Die Fans protestieren. Haben Sie Verständnis dafür?'; } },
    { k: 'derby', when: function (c) { return c.season && c.c && c.c.rivals && c.c.rivals.length; }, q: function (c) { var r = c.st.clubs[c.c.rivals[0]]; return 'Bald steht das Derby gegen ' + (r ? r.short : 'den Rivalen') + ' an. Was erwarten Sie?'; } },
    { k: 'form', when: function (c) { return c.form < 6.2; }, q: function () { return 'Ihre Form schwankt. Fehlt Ihnen das Selbstvertrauen?'; } },
    { k: 'private', when: function (c) { return L.life(c.st).partner && L.life(c.st).partner.stage >= 3; }, q: function () { return 'Ihre Beziehung ist Thema in den Klatschspalten. Wie gehen Sie damit um?'; }, boul: true },
    { k: 'goal', when: function () { return true; }, q: function (c) { return 'Was ist Ihr Ziel für den Rest der Saison?'; } }
  ];
  var PA = {
    diplo: { l: 'Diplomatisch antworten', e: { media: 1 } },
    honest: { l: 'Ehrlich und offen antworten', e: { media: 1, press: 1 } },
    bold: { l: 'Klare Kante zeigen', e: { conf: 2, media: 2 } },
    avoid: { l: 'Ausweichen – kein Kommentar', e: { press: -1 } }
  };
  function pressFx(qk, a, jt) {
    var e = {}; function add(k, v) { e[k] = (e[k] || 0) + v; }
    var base = PA[a].e; Object.keys(base).forEach(function (k) { add(k, base[k]); });
    if (qk === 'coach') { if (a === 'bold') { add('coach', -7); add('f_krit', 2); } else if (a === 'diplo') add('coach', 2); else if (a === 'honest') { add('coach', -2); add('press', 2); } }
    if (qk === 'rumor') { if (a === 'bold') { add('f_ultras', -4); add('board', -3); add('value', 2); } else if (a === 'honest') { add('f_club', -1); } else if (a === 'diplo') add('board', 1); }
    if (qk === 'loss') { if (a === 'bold') { add('mates', -4); add('f_krit', 2); } else if (a === 'honest') { add('f_fam', 2); add('mates', 1); } }
    if (qk === 'win') { if (a === 'bold') { add('mates', -2); add('fame', 1); } else if (a === 'diplo') add('mates', 2); }
    if (qk === 'fans') { if (a === 'honest') { add('f_krit', 3); add('board', -1); } else if (a === 'bold') { add('f_krit', -5); add('f_fam', 1); } }
    if (qk === 'contract') { if (a === 'bold') { add('board', -2); add('value', 1); } else if (a === 'diplo') add('board', 1); }
    if (qk === 'derby') { if (a === 'bold') { add('f_ultras', 4); add('f_aktiv', 2); add('stress', 2); } }
    if (qk === 'private' && a === 'avoid') { add('press', 1); add('partner', 1); }
    if (qk === 'private' && a === 'honest') { add('partner', -2); add('fame', 1); }
    if (jt === 'krit' && a === 'avoid') add('press', -2);
    if (jt === 'boul' && a === 'bold') add('fame', 1);
    if (jt === 'nah' && a === 'diplo') add('board', 1);
    return e;
  }
  function pressSay(c, s) {
    var q = s.v.qs[s.v.i], j = L.jrn(c.st, 'j_' + q.j), mem = '';
    if (q.k === 'rumor' && L.said(c.st, 'promise_loyal')) { var pr = L.said(c.st, 'promise_loyal'); mem = 'Saison ' + pr.s + ' haben Sie Vereinstreue versichert. '; }
    else if (q.k === 'coach' && L.said(c.st, 'threat_press')) mem = 'Sie hatten angekündigt, öffentlich Klartext zu reden. ';
    else if (q.follow && q.prev) mem = q.prev + ' ';
    else if (j && j.quotes.length && R.rand() < 0.4) mem = 'Neulich sagten Sie: „' + j.quotes[0].txt + '“. ';
    return (j ? j.name + ' (' + j.outlet + '): ' : '') + '„' + mem + q.q + '“';
  }
  L.addDlg([{
    id: 'press', cat: 'medien', ic: '🎙️', scene: 'presse', title: function (c, d) { return d.kind === 'interview' ? 'Interview nach dem Spiel' : 'Pressekonferenz'; }, max: function (c, d, s) { return s.v.qs ? s.v.qs.length : 5; },
    who: function (c, d, s) { var q = s.v.qs && s.v.qs[s.v.i], j = q ? L.jrn(c.st, 'j_' + q.j) : null; return j ? { n: j.name, role: L.JTYPES[j.type] + ' · ' + j.outlet, ic: '🎙️', kind: 'press' } : { n: 'Pressestelle', role: '' }; },
    init: function (st, c, d, s) {
      var pool = PQ.filter(function (q) { try { return q.when(c); } catch (er) { return false; } });
      var n = d.kind === 'interview' ? 2 : R.randInt(3, 4), qs = [], types = ['sach', 'krit', 'boul', 'nah'];
      while (qs.length < n && pool.length) { var q = pool.splice(Math.floor(R.rand() * pool.length), 1)[0]; qs.push({ k: q.k, q: q.q(c), j: q.boul ? 'boul' : types[(qs.length + R.randInt(0, 3)) % 4] }); }
      if (!qs.length) qs.push({ k: 'goal', q: 'Was ist Ihr Ziel?', j: 'sach' });
      s.v = { qs: qs, i: 0, said: [] };
    },
    nodes: {
      start: { say: function (c, d, s) { return pressSay(c, s); }, opts: function (c, d, s) { return pressOpts(c, d, s); } },
      q: { say: function (c, d, s) { return pressSay(c, s); }, opts: function (c, d, s) { return pressOpts(c, d, s); } }
    },
    sum: function (st, c, d, s) { return 'Aussagen: ' + s.v.said.join(' | '); }
  }]);
  var QUOTES = {
    win: { diplo: 'Das war eine starke Mannschaftsleistung.', honest: 'Ich hatte einen guten Tag, aber das Team hat es möglich gemacht.', bold: 'Wenn ich so spiele, sind wir schwer zu schlagen.', avoid: 'Drei Punkte, mehr zählt nicht.' },
    loss: { diplo: 'Wir analysieren das in Ruhe.', honest: 'Wir waren heute nicht gut genug, ich auch nicht.', bold: 'Einige haben heute nicht ihre Leistung gebracht.', avoid: 'Dazu sage ich heute nichts.' },
    rumor: { diplo: 'Ich konzentriere mich auf meinen Verein.', honest: 'Es gibt Gespräche, das will ich nicht verheimlichen.', bold: 'Ich will den nächsten Schritt machen – egal wo.', avoid: 'Kein Kommentar zu Gerüchten.' },
    coach: { diplo: 'Der Trainer und ich reden offen miteinander.', honest: 'Es gab Meinungsverschiedenheiten, die klären wir intern.', bold: 'Ich verstehe manche Entscheidungen nicht.', avoid: 'Das bleibt in der Kabine.' },
    inj: { diplo: 'Ich halte mich an die Ärzte.', honest: 'Es ist hart, aber ich arbeite jeden Tag.', bold: 'Ich bin schneller zurück, als alle denken.', avoid: 'Wir werden sehen.' },
    contract: { diplo: 'Wir sind in guten Gesprächen.', honest: 'Ich weiß es noch nicht.', bold: 'Wer mich halten will, muss sich bewegen.', avoid: 'Darüber spreche ich nicht öffentlich.' },
    fans: { diplo: 'Ich verstehe die Enttäuschung.', honest: 'Die Kritik ist zum Teil berechtigt.', bold: 'Pfiffe helfen niemandem.', avoid: 'Kein Kommentar.' },
    derby: { diplo: 'Ein besonderes Spiel, wir sind vorbereitet.', honest: 'Ich bin nervös, ehrlich gesagt.', bold: 'Das Derby gewinnen wir.', avoid: 'Ein Spiel wie jedes andere.' },
    form: { diplo: 'Ich arbeite daran.', honest: 'Ja, im Moment fehlt mir etwas.', bold: 'Meine Form ist besser als ihr Ruf.', avoid: 'Fragen Sie den Trainer.' },
    private: { diplo: 'Mein Privatleben bleibt privat.', honest: 'Wir sind sehr glücklich.', bold: 'Schreiben Sie lieber über Sport.', avoid: 'Kein Kommentar.' },
    goal: { diplo: 'Jedes Spiel gewinnen wollen.', honest: 'Mich festspielen und gesund bleiben.', bold: 'Ganz oben angreifen.', avoid: 'Schritt für Schritt.' }
  };
  function pressOpts(c, d, s) {
    var q = s.v.qs[s.v.i];
    return ['diplo', 'honest', 'bold', 'avoid'].map(function (a) {
      return { l: PA[a].l + ': „' + (QUOTES[q.k] || QUOTES.goal)[a] + '“', fx: function (st) {
        var e = pressFx(q.k, a, q.j), j = L.jrn(st, 'j_' + q.j), qt = (QUOTES[q.k] || QUOTES.goal)[a];
        if (j) { j.quotes.unshift({ txt: qt, s: st.season, w: st.week, k: q.k }); if (j.quotes.length > 8) j.quotes.length = 8; e['j_' + q.j] = (a === 'avoid' ? (q.j === 'krit' ? -3 : -1) : a === 'honest' ? 2 : a === 'bold' ? (q.j === 'boul' ? 3 : -1) : 1); }
        s.v.said.push(qt);
        if (q.k === 'rumor' && a === 'diplo') L.remember(st, 'promise_loyal', 'Öffentlich: „' + qt + '“', 'Presse');
        if (q.k === 'coach' && a === 'bold') L.remember(st, 'crit_coach', 'Öffentliche Kritik am Trainer', 'Presse');
        if (q.k === 'fans' && a !== 'bold') L.remember(st, 'fans_support', 'Den Fans Verständnis signalisiert', 'Presse');
        // Folgefrage hängt von der Antwort ab (ausweichend/provokant → Nachhaken)
        if ((a === 'avoid' && q.j === 'krit' || a === 'bold') && !q.follow && s.v.qs.length < 6) s.v.qs.splice(s.v.i + 1, 0, { k: q.k, q: a === 'bold' ? 'Ist das nicht respektlos gegenüber Ihren Kollegen?' : 'Das ist keine Antwort. Ich frage noch einmal.', j: q.j, follow: true, prev: a === 'bold' ? 'Sie sagen also: „' + qt + '“.' : '' });
        s.v.i++;
        var r = { diplo: 'Die Journalisten notieren nüchtern mit.', honest: 'Einige nicken anerkennend – eine ehrliche Antwort.', bold: 'Kameras klicken. Das wird morgen eine Schlagzeile.', avoid: 'Ein Raunen geht durch den Raum.' }[a];
        return s.v.i < s.v.qs.length ? go('q', r, e) : end(r + ' Die Pressekonferenz ist beendet.', e);
      } };
    });
  }

  // ================= FANS / ULTRAS =================
  var FT = {
    loyal: { q: function (c, d) { return d.grp === 'ultras' ? '„Wir wollen wissen, ob du für diese Farben brennst – oder ob wir nur eine Zwischenstation sind.“' : '„Viele fragen sich: Bleibst du uns treu?“'; },
      o: [['Ich stehe zu diesem Verein.', { f_ultras: 4, f_club: 4, f_fam: 2, loyal: 3 }, 'promise_loyal'], ['Ich bin Profi – aber hier fühle ich mich zu Hause.', { f_club: 2, f_fam: 2, f_ultras: 1 }], ['Versprechen kann ich nichts.', { f_ultras: -4, f_club: -2, f_krit: 1, media: 1 }]] },
    perf: { q: function () { return '„Ehrlich: Deine letzten Spiele waren nicht gut. Was ist los?“'; },
      o: [['Ihr habt recht. Ich arbeite hart daran.', { f_krit: 3, f_club: 2, conf: -1 }], ['Ich brauche euch gerade jetzt.', { f_fam: 3, f_club: 2, f_aktiv: 1 }], ['Ihr seht nicht alles, was im Training passiert.', { f_krit: -4, f_ultras: -2 }]] },
    pyro: { q: function () { return '„Wie stehst du zu Pyrotechnik in der Kurve?“'; },
      o: [['Ich lehne sie ab – die Sicherheitsrisiken sind zu groß.', { f_ultras: -6, f_aktiv: -3, f_fam: 4, board: 3, press: 2 }], ['Ich verstehe, dass sie zur Fankultur gehört.', { f_ultras: 5, f_aktiv: 3, f_fam: -2, board: -2, press: -1 }], ['Ich setze mich für sichere und legale Formen ein.', { f_ultras: 2, f_aktiv: 2, f_fam: 1, board: 1, press: 2 }], ['Gefährliche Aktionen kritisiere ich klar.', { f_ultras: -2, f_fam: 3, board: 2 }], ['Dazu äußere ich mich nicht öffentlich.', { media: -1 }], ['Lasst uns mit euren Vertretern und dem Verein reden.', { f_ultras: 3, f_club: 2, board: 1, lead: 1 }]] },
    // Handball (ANWURF!): Hallen-Themen statt Pyrotechnik – Trommeln/Fanblock und Harzverbot
    drums: { q: function () { return '„Die Hallenbetreiber wollen Trommeln und Megafone in unserem Block einschränken. Stehst du hinter uns?“'; },
      o: [['Ohne euren Block fehlt uns die Heimstärke – ich setze mich für euch ein.', { f_ultras: 5, f_aktiv: 3, board: -2 }], ['Stimmung ja, aber auch Rücksicht auf Familien in der Halle.', { f_fam: 3, f_ultras: -1, f_club: 1 }], ['Lasst uns mit Verein und Hallenbetreiber eine Lösung finden.', { f_ultras: 2, f_club: 2, board: 2 }], ['Das entscheiden andere.', { f_ultras: -3, media: -1 }]] },
    harz: { q: function () { return '„Die Stadt will in unserer Halle Harz verbieten. Was heißt das für euch Spieler?“'; },
      o: [['Ohne Harz leiden Würfe und Tempo – das trifft unser Spiel hart.', { f_ultras: 2, f_aktiv: 3, board: -1 }], ['Wir trainieren mit harzfreien Bällen und stellen uns darauf ein.', { f_krit: 2, f_club: 2, board: 2 }], ['Der Verein muss mit der Stadt verhandeln – notfalls über eine Reinigungspauschale.', { f_club: 3, board: 1, press: 1 }]] },
    prices: { q: function () { return '„Die Eintrittspreise steigen jedes Jahr. Was sagst du dazu?“'; },
      o: [[(HB ? 'Handball' : 'Fußball') + ' muss bezahlbar bleiben.', { f_fam: 3, f_aktiv: 3, f_ultras: 2, board: -2 }], ['Der Verein braucht die Einnahmen.', { board: 2, f_aktiv: -3, f_ultras: -2 }], ['Ich spreche das bei der Vereinsführung an.', { f_club: 2, f_aktiv: 2, board: -1 }]] },
    comm: { q: function () { return HB ? '„Anwurfzeiten fürs Fernsehen, Spiele unter der Woche, immer mehr Sponsoren – geht der Sport kaputt?“' : '„Anstoßzeiten, Sponsoren, Montagsspiele – geht der Sport kaputt?“'; },
      o: [['Ich teile viele eurer Sorgen.', { f_ultras: 4, f_aktiv: 3, sponsor: -2 }], ['Ohne Geld geht es nicht – aber mit Maß.', { f_club: 1, f_gel: 2 }], ['Davon profitieren am Ende alle.', { f_ultras: -4, sponsor: 3 }]] },
    away: { q: function () { return '„Beim letzten Auswärtsspiel gab es Ärger mit den gegnerischen Fans. Deine Meinung?“'; },
      o: [['Gewalt hat ' + (HB ? 'in der Halle' : 'im Stadion') + ' nichts verloren.', { f_fam: 3, f_ultras: -2, board: 2 }], ['Rivalität ja – aber mit Respekt.', { f_ultras: 1, f_away: 2, f_fam: 1 }], ['Ich war nicht dabei, das kann ich nicht beurteilen.', {}]] },
    rival: { q: function () { return '„Es heißt, ein Rivale sei an dir interessiert. Würdest du dorthin wechseln?“'; },
      o: [['Niemals.', { f_ultras: 6, f_club: 4, loyal: 3 }, 'promise_no_rival'], ['Ich schließe nichts aus.', { f_ultras: -6, f_club: -4, value: 1 }], ['Darüber denke ich gerade nicht nach.', { f_ultras: -1 }]] },
    mood: { q: function () { return '„Die Stimmung ' + (HB ? 'in der Halle' : 'im Stadion') + ' war zuletzt mau. Wie seht ihr Spieler das?“'; },
      o: [['Wir müssen euch auch etwas zurückgeben.', { f_aktiv: 3, f_club: 2 }], ['Mit euch im Rücken sind wir stärker.', { f_aktiv: 2, f_fam: 2 }], ['Die Stimmung macht ihr, nicht wir.', { f_aktiv: -4 }]] },
    protest: { q: function () { return '„Wir planen einen Protest gegen die Vereinsführung. Stehst du hinter uns?“'; },
      o: [['Ich verstehe euren Ärger, bleibe aber neutral.', { f_ultras: 1, board: 1 }], ['Ja, eure Kritik ist berechtigt.', { f_ultras: 5, f_aktiv: 4, board: -6 }], ['Proteste schaden dem Team.', { f_ultras: -5, board: 3 }]] }
  };
  L.addDlg([{
    id: 'fans', cat: 'medien', ic: '📣', scene: function (c, d) { return d.grp === 'ultras' ? 'ultras' : 'fans'; }, max: function (c, d, s) { return (s.v.topics || []).length || 3; },
    title: function (c, d) { return d.grp === 'ultras' ? (HB ? 'Treffen mit dem Fanblock' : 'Treffen mit den Ultras') : d.grp === 'fam' ? 'Treffen mit Familienfans und Jugendfans' : 'Fanclub-Treffen'; },
    who: function (c, d) { return { n: d.rep || 'Fanvertretung', role: d.grp === 'ultras' ? (HB ? 'Sprecher des Fanblocks' : 'Sprecher der Ultras') : d.grp === 'fam' ? 'Familienblock & Jugendfans' : 'Fanclub-Vorsitz', ic: '📣', kind: 'fans' }; },
    init: function (st, c, d, s) {
      d.grp = d.grp || 'club'; d.rep = d.rep || L.name();
      var pool = d.grp === 'ultras' ? ['loyal', HB ? 'drums' : 'pyro', 'comm', 'protest', 'away', 'rival', 'mood'] : d.grp === 'fam' ? ['perf', 'prices', 'mood', 'loyal'] : ['loyal', 'perf', 'prices', HB ? 'harz' : 'pyro', 'mood', 'comm', 'rival'];
      if (c.form >= 6.4) pool = pool.filter(function (k) { return k !== 'perf'; });
      var n = d.grp === 'fam' ? 2 : R.randInt(3, 4), t = [];
      while (t.length < n && pool.length) t.push(pool.splice(Math.floor(R.rand() * pool.length), 1)[0]);
      s.v = { topics: t, i: 0 };
    },
    nodes: { start: { say: fanSay, opts: fanOpts }, t: { say: fanSay, opts: fanOpts } },
    sum: function (st, c, d, s) { var f = c.life.fans; return 'Stimmung danach: ' + (HB ? 'Fanblock ' : 'Ultras ') + Math.round(f.ultras) + ', Fanclubs ' + Math.round(f.club) + ', Familienfans ' + Math.round(f.fam) + '.'; }
  }]);
  function fanSay(c, d, s) { return FT[s.v.topics[s.v.i]].q(c, d); }
  function fanOpts(c, d, s) {
    var t = FT[s.v.topics[s.v.i]];
    return t.o.map(function (o) { return { l: o[0], fx: function (st) {
      if (o[2]) L.remember(st, o[2], 'Fans: „' + o[0] + '“', 'Fans');
      s.v.i++; var g = Object.keys(o[1]).filter(function (k) { return k.indexOf('f_') === 0; }), pos = g.filter(function (k) { return o[1][k] > 0; }).length, neg = g.length - pos;
      var r = !g.length ? 'Höfliches Nicken, keine große Reaktion.' : pos > neg ? 'Applaus aus den Reihen – aber nicht von allen.' : neg > pos ? 'Unruhe, einige schütteln den Kopf.' : 'Die Meinungen gehen auseinander.';
      return s.v.i < s.v.topics.length ? go('t', r, o[1]) : end(r + ' Zum Abschluss: Fotos, Autogramme, ein Schal als Geschenk.', o[1]);
    } }; });
  }

  // ================= PARTNERSCHAFT =================
  function cand(st, d) { var lf = L.life(st); return lf.cands.filter(function (x) { return x.id === d.cid; })[0] || null; }
  function fn(x) { return x ? x.name.split(' ')[0] : ''; }
  L.addDlg([{
    id: 'meet', cat: 'familie', ic: '✨', scene: 'date', title: 'Eine neue Begegnung', max: 3, imp: 1,
    who: function (c, d) { var x = cand(c.st, d); return { n: x ? x.name : '?', role: x ? x.job : '', ic: '✨', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var x = cand(c.st, d); return x ? (d.where || 'Auf der Geburtstagsfeier eines Freundes') + ' kommst du mit ' + x.name + ' ins Gespräch. ' + x.job + ', interessiert sich für ' + x.intr.join(' und ') + '.' : ''; },
        opts: [{ l: 'Ehrliches Interesse zeigen und nachfragen', fx: function (st, c, d) { var x = cand(st, d); x.v += 6; return go('talk', fn(x) + ' erzählt begeistert – ihr lacht viel.'); } },
          { l: 'Vom Fußball- bzw. Handballalltag erzählen', fx: function (st, c, d) { var x = cand(st, d); x.v += x.sport >= 50 ? 5 : -3; return go('talk', x.sport >= 50 ? fn(x) + ' hört gespannt zu.' : fn(x) + ' wirkt etwas gelangweilt vom Sportthema.'); } },
          { l: 'Freundlich bleiben, aber kein Interesse', fx: function (st, c, d) { L.life(st).cands = L.life(st).cands.filter(function (y) { return y.id !== d.cid; }); return end('Ein netter Abend – mehr nicht.'); } }] },
      talk: { say: function (c, d) { var x = cand(c.st, d); return x ? fn(x) + ': „Und, was machst du so, wenn du nicht auf dem Platz stehst?“' : ''; },
        opts: [{ l: 'Nach einem Treffen fragen', fx: function (st, c, d) { var x = cand(st, d), ok = chance(0.35 + c.cx.per.conf / 250 + (x.v - 50) / 80); if (ok) { x.stage = 1; x.v = Math.max(x.v, 55); return end(fn(x) + ' lächelt: „Gern. Schreib mir.“', { conf: 2, well: 2 }); } x.v -= 5; return end(fn(x) + ' zögert: „Lass uns erst mal sehen.“', { conf: -1 }); } },
          { l: 'Nummern tauschen, mal sehen', fx: function (st, c, d) { var x = cand(st, d); x.stage = 1; return end('Ihr tauscht Nummern.', { well: 1 }); } },
          { l: 'Fragen, ob sie noch mitkommt', hint: 'Sagt sie ja: eine Nacht (Affäre) – Spaß, aber Stress, Frische − und Entdeckungsrisiko', fx: function (st, c, d) { var x = cand(st, d), A = L.pt && L.pt.AFF, pt = L.life(st).partner; if (!x || !A || !A.flingAdd) return end('Ihr verabschiedet euch.');
            if (!chance(clamp(0.3 + (c.cx.per.conf - 50) / 200 + (x.v - 50) / 60, 0.12, 0.8))) { x.v = clamp(x.v - 5, 0, 100); return end(fn(x) + ' lacht: „Nicht so schnell. Aber du darfst mir gern schreiben.“', { conf: -1 }); } A.flingAdd(st, x.name); L.life(st).cands = L.life(st).cands.filter(function (y) { return y.id !== d.cid; }); if (pt && L.pt.partner(st)) L.pt.partner(st).neg += 2; R.cx.chron(st, 'familie', '🍸', 'Affäre', 'Eine Nacht mit ' + x.name + (pt ? ' – ' + pt.name.split(' ')[0] + ' darf davon nichts erfahren.' : '.'), 1, 'date'); return end('Aus dem Gespräch wird eine lange Nacht bei ' + fn(x) + '.', pt ? { well: 3, stress: 3, fit: -3 } : { well: 4, stress: 1, fit: -3 }); } },
          { l: 'Lieber auf die Karriere konzentrieren', fx: function (st, c, d) { L.life(st).cands = L.life(st).cands.filter(function (y) { return y.id !== d.cid; }); return end('Du verabschiedest dich früh.', { disc: 1 }); } }] }
    }
  }, {
    id: 'date', cat: 'familie', ic: '🌹', scene: 'date', title: function (c, d) { var x = cand(c.st, d) || c.life.partner; return 'Date mit ' + fn(x); }, max: 3, imp: 1,
    who: function (c, d) { var x = cand(c.st, d) || c.life.partner; return { n: x ? x.name : '?', role: x ? x.job : '', ic: '🌹', kind: 'partner' }; },
    nodes: {
      start: { say: function (c, d) { var x = cand(c.st, d) || c.life.partner; return 'Was unternehmt ihr? ' + fn(x) + ' mag ' + x.intr.join(' und ') + '.'; },
        opts: [['Schick essen gehen', 160, 'Kochen'], ['Ausflug in die Natur', 20, 'Wandern'], ['Konzert besuchen', 140, 'Musik'], ['Zuhause kochen', 50, 'Kochen'], ['Ausstellung oder Kino', 60, 'Kunst']].map(function (a) {
          return { l: a[0] + (a[1] ? ' (' + money(a[1]) + ')' : ''), fx: function (st, c, d) { var x = cand(st, d) || L.life(st).partner; if (R.pf) R.pf.book(st, -a[1], 'Freizeit & Privatleben'); var hit = x.intr.indexOf(a[2]) >= 0 || (a[2] === 'Kunst' && x.intr.indexOf('Filme') >= 0); x.v = clamp(x.v + (hit ? 9 : 4), 0, 100); x.dates = (x.dates || 0) + 1; return go('talk', hit ? fn(x) + ' strahlt – genau das Richtige.' : 'Ein schöner Abend.', { well: 2 }); } };
        }) },
      talk: { say: function (c, d) { var x = cand(c.st, d) || c.life.partner; return 'Später fragt ' + fn(x) + ': „Wie siehst du dich eigentlich in ein paar Jahren?“'; },
        opts: [{ l: 'Nach den Plänen von ' + 'deinem Gegenüber fragen', fx: function (st, c, d) { var x = cand(st, d) || L.life(st).partner; x.v = clamp(x.v + 5, 0, 100); return go('end', fn(x) + ' erzählt von den eigenen Zielen: ' + x.goal + '.'); } },
          { l: 'Von deinen sportlichen Zielen erzählen', fx: function (st, c, d) { var x = cand(st, d) || L.life(st).partner; x.v = clamp(x.v + (x.sport >= 50 ? 4 : 0), 0, 100); return go('end', 'Ehrgeiz kommt an – meistens.'); } },
          { l: 'Lieber locker bleiben', fx: function () { return go('end', 'Ihr lacht über Belangloses.'); } }] },
      end: { say: function (c, d) { var x = cand(c.st, d) || c.life.partner; return 'Der Abend neigt sich dem Ende zu. ' + fn(x) + ' wirkt ' + (x.v >= 65 ? 'sehr glücklich' : x.v >= 50 ? 'zufrieden' : 'nachdenklich') + '.'; },
        opts: function (c, d) { var x = cand(c.st, d); var o = [{ l: 'Bald wiedersehen', fx: function (st, c2, d2) { var y = cand(st, d2); if (y) y.stage = 2; return end('Ihr verabredet euch für nächste Woche.', { well: 2 }); } }];
          if (x && (x.dates || 0) >= 2 && x.v >= 62) o.unshift({ l: 'Eine feste Beziehung vorschlagen', fx: function (st, c2, d2) { var y = cand(st, d2); if (chance(0.45 + (y.v - 60) / 50)) { L.makePartner(st, y); return end(fn(y) + ' sagt Ja. Ihr seid jetzt ein Paar.', { well: 6, conf: 2, stress: -3 }); } y.v -= 4; return end(fn(y) + ': „Ich brauche noch etwas Zeit.“', { conf: -1 }); } });
          if (!x) o = [{ l: 'Danke für den Abend', fx: function () { return end('Ein Abend, der euch guttut.', { partner: 3, stress: -2, well: 3 }); } }];
          return o; } }
    }
  }, {
    id: 'partner_talk', cat: 'familie', ic: '💬', scene: 'partner', title: function (c) { return 'Gespräch mit ' + fn(c.life.partner); }, max: 4,
    who: function (c) { var p = c.life.partner; return { n: p ? p.name : '?', role: p ? 'Partnerperson · ' + L.STAGES[p.stage] : '', ic: '💞', kind: 'partner' }; },
    init: function (st, c, d, s) { if (!c.life.partner) s.done = true; },
    nodes: {
      start: { say: function (c, d) { var p = c.life.partner; if (!p) return ''; if (d.topic === 'abroad') return fn(p) + ': „Dein Berater spricht vom Ausland? Ich habe hier meinen Job, meine Leute. Was heißt das für uns?“'; if (d.topic === 'crisis') return fn(p) + ': „Wir müssen reden. Ich habe das Gefühl, du bist nie wirklich da.“'; return fn(p) + ': „Schön, dass wir mal Zeit haben. Worüber willst du reden?“'; },
        opts: function (c, d) {
          var p = c.life.partner; if (!p) return [];
          if (d.topic === 'abroad') return [{ l: 'Ich würde nur gehen, wenn du mitkommst.', fx: function (st) { return end(p.move >= 50 ? fn(p) + ' überlegt: „Vielleicht. Für dich würde ich es versuchen.“' : fn(p) + ': „Ich kann nicht versprechen, dass ich mitkomme.“', { partner: 3 }, { mem: { k: 'abroad_together', txt: 'Ausland nur gemeinsam versprochen' } }); } },
            { l: 'Meine Karriere hat gerade Vorrang.', fx: function () { return end(fn(p) + ' schweigt lange.', { partner: -8, amb: 2 }); } },
            { l: 'Wir entscheiden das gemeinsam, Schritt für Schritt.', fx: function () { return end('Ihr verabredet, offen zu bleiben.', { partner: 4, stress: -1 }); } }];
          if (d.topic === 'crisis') return [{ l: 'Zuhören und mehr Zeit versprechen', fx: function (st) { p.crisis = Math.max(0, (p.crisis || 0) - 1); return end('Ihr redet bis spät in die Nacht.', { partner: 8, family: 2 }, { mem: { k: 'promise_family', txt: 'Mehr gemeinsame Zeit versprochen' } }); } },
            { l: 'Meinen Beruf verteidigen', fx: function () { return end('„Es geht nicht immer nur um dich.“ Die Tür fällt ins Schloss.', { partner: -6, stress: 3 }); } },
            { l: 'Eine Paarberatung vorschlagen (300 €)', fx: function (st) { if (R.pf) R.pf.book(st, -300, 'Freizeit & Privatleben'); p.crisis = 0; return end('Ihr vereinbart einen Termin – ein Anfang.', { partner: 6, stress: -2 }); } },
            { l: 'Vielleicht sollten wir uns trennen.', fx: function (st) { L.breakup(st, 'Trennung nach einer Krise'); return end('Es ist vorbei. Es tut weh – auf beiden Seiten.', { well: -10, stress: 6 }); } }];
          var o = [];
          if (p.stage === 3 && tick(c.st) - p.since >= 20) o.push({ l: 'Zusammenziehen vorschlagen', fx: function (st) { if (chance(0.4 + (p.v - 55) / 45)) { p.stage = 4; p.stageT = tick(st); X.chron(st, 'familie', '🏠', 'Zusammengezogen', 'Mit ' + p.name + '.', 2); return end(fn(p) + ' fällt dir um den Hals. Ihr sucht eine gemeinsame Wohnung.', { partner: 5, well: 4 }); } return end(fn(p) + ': „Noch nicht – ich brauche meinen Raum.“', { partner: -2 }); } });
          if (p.stage === 4 && tick(c.st) - (p.stageT || 0) >= 30) o.push({ l: 'Einen Heiratsantrag machen (Ring 4.000 €)', fx: function (st) { if (R.pf) R.pf.book(st, -4000, 'Freizeit & Privatleben'); if (chance(0.45 + (p.v - 60) / 40)) { p.stage = 5; p.stageT = tick(st); X.chron(st, 'familie', '💍', 'Verlobt', 'Mit ' + p.name + '.', 3); return end('Ja! Unter Tränen und Lachen.', { partner: 8, well: 8, conf: 2 }); } return end(fn(p) + ': „Ich liebe dich – aber dafür ist es zu früh.“', { partner: -3, conf: -2 }); } });
          if (p.stage === 5 && tick(c.st) - (p.stageT || 0) >= 20) o.push({ l: 'Die Hochzeit planen (ca. 25.000 €)', fx: function (st) { if (R.pf) R.pf.book(st, -Math.round(25000 * (HB ? 0.6 : 1)), 'Freizeit & Privatleben'); p.stage = 6; p.stageT = tick(st); X.chron(st, 'familie', '💒', 'Hochzeit', 'Ihr habt geheiratet – mit Familie, Freunden und Mitspielern.', 3); return end('Die Hochzeit wird ein unvergesslicher Tag.', { partner: 6, well: 10, mates: 3, family: 5 }); } });
          if (p.stage >= 4 && c.age >= 22 && !c.life.planKids) o.push({ l: 'Über Familienplanung sprechen', fx: function (st) { if (p.kids >= 45) { L.life(st).planKids = true; return end(fn(p) + ': „Ja. Ich wünsche mir das auch.“', { partner: 5 }, { mem: { k: 'family_plan', txt: 'Gemeinsame Familienplanung' } }); } return end(fn(p) + ': „Ich sehe mich gerade nicht als Elternteil.“', { partner: 0 }); } });
          if (c.life.planKids) o.push({ l: 'Familienplanung erst einmal pausieren', fx: function (st) { L.life(st).planKids = false; return end('Ihr seid euch einig: später vielleicht.', { partner: p.kids >= 70 ? -3 : 1 }); } });
          o.push({ l: 'Einen gemeinsamen Urlaub planen (2 Termine, 2.500 €)', fx: function (st) { var r = L.spend(st, 1, 2500); if (!r.ok) return end(r.why); return end('Ihr bucht eine Woche Sonne. Erholung pur.', { partner: 9, stress: -6, well: 6, fit: 4 }); } });
          o.push({ l: 'Ein Geschenk machen (200 €)', fx: function (st) { if (R.pf) R.pf.book(st, -200, 'Freizeit & Privatleben'); return end(fn(p) + ' freut sich über die Aufmerksamkeit.', { partner: 4 }); } });
          o.push({ l: 'Über die gemeinsame Zukunft reden', fx: function (st) { return end(fn(p) + ' wünscht sich ' + (p.time >= 60 ? 'mehr gemeinsame Zeit.' : 'vor allem Verlässlichkeit.'), { partner: 2 }); } });
          o.push({ l: 'Die Beziehung beenden', fx: function (st) { L.breakup(st, 'Du hast die Beziehung beendet'); return end('Ein schwerer Abend. Danach ist es still.', { well: -8, stress: 4 }); } });
          return o;
        } }
    }
  }]);

  // ================= FAMILIE & FREUNDE =================
  L.addDlg([{
    id: 'family', cat: 'familie', ic: '👨‍👩‍👧', scene: 'familie', title: 'Familiengespräch', max: 3,
    who: function (c, d) { var f = c.life.fam[d.i || 0]; return { n: f ? f.name : 'Familie', role: f ? f.rel : '', ic: '🏡', kind: 'family' }; },
    nodes: {
      start: { say: function (c, d) { var f = c.life.fam[d.i || 0]; return c.youth ? f.rel + ': „Wie läuft es in der Schule? Und im Training? Wir machen uns manchmal Sorgen, dass es zu viel wird.“' : f.rel + ': „Schön, dich zu hören! Kommst du am Wochenende vorbei?“'; },
        opts: function (c, d) { var f = c.life.fam[d.i || 0]; return c.youth ? [
          { l: 'Alles im Griff – Schule und Sport passen.', fx: function () { return end('Erleichterung am Küchentisch.', { family: 3, disc: 1 }); } },
          { l: 'Ehrlich: Die Schule leidet gerade.', fx: function (st) { return end('Ihr vereinbart Nachhilfe – und weniger Zocken.', { family: 4, stress: -2 }, { mem: { k: 'school_help', txt: 'Den Eltern Schulprobleme offen erzählt' } }); } },
          { l: 'Ich will mich voll auf den Sport konzentrieren.', fx: function () { return end('Stirnrunzeln. „Ein Abschluss ist wichtig.“', { family: -4, amb: 2 }); } }] : [
          { l: 'Ja, ich komme vorbei.', fx: function (st) { var r = L.spend(st, 1); if (!r.ok) return end(r.why); f.v = clamp(f.v + 6, 0, 100); return end('Ein ruhiger Sonntag mit Familie – Kuchen, Geschichten, Heimat.', { family: 5, stress: -3, well: 3 }); } },
          { l: 'Diese Woche schaffe ich es nicht.', fx: function () { f.v = clamp(f.v - 3, 0, 100); return end('„Schade. Pass auf dich auf.“', { family: -2 }); } },
          { l: 'Kann ich euch finanziell unterstützen?', req: function () { return R.pf && R.pf.liquid(c.st) > 20000; }, fx: function (st) { if (R.pf) R.pf.book(st, -5000, 'Familie'); f.v = clamp(f.v + 4, 0, 100); return end('„Das musst du nicht.“ Aber man sieht, dass es hilft.', { family: 4 }); } }]; } }
    }
  }, {
    id: 'friend', cat: 'freund', ic: '🤝', scene: 'freunde', title: function (c, d) { var f = L.friend(c.st, d.friend); return f ? 'Treffen mit ' + fn(f) : 'Freundschaft'; }, max: 3,
    who: function (c, d) { var f = L.friend(c.st, d.friend); return { n: f ? f.name : '?', role: f ? L.FRK[f.kind] : '', ic: '🤝', kind: 'friend' }; },
    nodes: {
      start: { say: function (c, d) { var f = L.friend(c.st, d.friend); if (!f) return ''; if (d.topic === 'money') return fn(f) + ': „Mir ist das unangenehm … Kannst du mir ' + money(d.amt) + ' leihen? Ich zahle es zurück, versprochen.“'; if (d.topic === 'biz') return fn(f) + ': „Ich will ein ' + d.biz + ' eröffnen. Steigst du mit ' + money(d.amt) + ' ein?“'; if (d.topic === 'reunion') return 'Nach Jahren wiedergesehen: ' + fn(f) + ' steht plötzlich vor dir. „Erinnerst du dich noch an damals?“'; if (d.topic === 'bday') return fn(f) + ' feiert Geburtstag und hat dich eingeladen.'; return fn(f) + ': „Lange nichts gehört! Was machst du so?“'; },
        opts: function (c, d) { var f = L.friend(c.st, d.friend); if (!f) return [];
          if (d.topic === 'money') return [{ l: 'Ja, ich helfe dir.', req: function () { return R.pf && R.pf.liquid(c.st) >= d.amt; }, fx: function (st) { R.pf.book(st, -d.amt, 'Privatdarlehen'); var back = chance(0.45 + f.v / 300); X.later(st, R.randInt(10, 30), 'fr_money_back', { friend: f.id, amt: d.amt, ok: back }); return end(fn(f) + ' ist sehr dankbar.', { friend: 10 }, { ref: { friend: f.id }, mem: { k: 'friend_loan', txt: money(d.amt) + ' an ' + f.name + ' verliehen' } }); } },
            { l: 'Ich kann nur einen Teil geben.', req: function () { return R.pf && R.pf.liquid(c.st) >= d.amt / 3; }, fx: function (st) { R.pf.book(st, -Math.round(d.amt / 3), 'Privatdarlehen'); return end('„Danke – das hilft schon.“', { friend: 4 }, { ref: { friend: f.id } }); } },
            { l: 'Nein, bei Geld hört die Freundschaft auf.', fx: function () { return end('Die Stimmung kühlt merklich ab.', { friend: -12 }, { ref: { friend: f.id } }); } }];
          if (d.topic === 'biz') return [{ l: 'Ich steige ein.', req: function () { return R.pf && R.pf.liquid(c.st) >= d.amt; }, fx: function (st) { R.pf.book(st, -d.amt, 'Beteiligung'); X.later(st, R.randInt(26, 52), 'fr_biz_result', { friend: f.id, amt: d.amt, biz: d.biz, ok: chance(0.42) }); return end('Handschlag. Ihr seid jetzt auch Geschäftspartner.', { friend: 6, risk: 2 }, { ref: { friend: f.id } }); } },
            { l: 'Ich prüfe den Businessplan erst genau.', fx: function (st) { var ok = chance(0.5); return end(ok ? 'Der Plan hat Lücken – ' + fn(f) + ' überarbeitet ihn. Gute Entscheidung.' : fn(f) + ' ist enttäuscht, dass du zögerst.', ok ? { friend: 1, disc: 1 } : { friend: -3 }, { ref: { friend: f.id } }); } },
            { l: 'Lieber nicht.', fx: function () { return end('„Schade, aber okay.“', { friend: -3 }, { ref: { friend: f.id } }); } }];
          if (d.topic === 'bday') return [{ l: 'Hingehen und mitfeiern', fx: function (st) { var r = L.spend(st, 1, 80); if (!r.ok) return end(r.why); return end('Eine lange Nacht. Am nächsten Tag ein bisschen müde.', { friend: 8, fit: -3, well: 3 }, { ref: { friend: f.id } }); } },
            { l: 'Kurz vorbeischauen', fx: function () { return end('Ein Stündchen – aber du warst da.', { friend: 3 }, { ref: { friend: f.id } }); } },
            { l: 'Absagen – morgen ist Training', fx: function () { return end('„Klar, Profi halt.“ Ein bisschen Enttäuschung schwingt mit.', { friend: -4, disc: 1 }, { ref: { friend: f.id } }); } }];
          return [{ l: 'Sich richtig Zeit nehmen', fx: function (st) { var r = L.spend(st, 1, 60); if (!r.ok) return end(r.why); return end('Wie früher. Es tut gut, jemanden zu haben, der dich ohne Trikot kennt.', { friend: 9, stress: -3, well: 3 }, { ref: { friend: f.id } }); } },
            { l: 'Gemeinsamen Kurzurlaub planen (900 €)', fx: function (st) { var r = L.spend(st, 1, 900); if (!r.ok) return end(r.why); return end('Ein Wochenende am Meer.', { friend: 12, stress: -5, well: 4 }, { ref: { friend: f.id } }); } },
            { l: 'Nur kurz schreiben', fx: function () { return end('Ein paar Nachrichten hin und her.', { friend: 2 }, { ref: { friend: f.id } }); } }]; } }
    }
  }]);

  // ================= MEDIZIN, JUGENDTRAINER, FINANZBERATUNG =================
  function medLv(c) { var l = c.c && c.c.fac ? (c.c.fac.medizin || 1) : 1; return D.facilities.medizin.levels[l] || D.facilities.medizin.levels[1]; }
  function medQ(c) { return 0.35 + (medLv(c).q || 0) * 0.12; }
  L.addDlg([{
    id: 'doctor', cat: 'verletzung', ic: '🩺', scene: 'medizin', title: 'Gespräch mit dem Mannschaftsarzt', max: 3,
    who: function (c) { return { n: c.life.docName || (c.life.docName = 'Dr. ' + L.name()), role: 'Mannschaftsarzt · ' + medLv(c).n, ic: '🩺', kind: 'doctor' }; },
    nodes: {
      start: { say: function (c) { return c.p.inj ? '„Diagnose: ' + c.p.inj.type + '. Realistisch ' + c.p.inj.weeks + ' Wochen. Wie wollen wir vorgehen?“' : '„Medizinisch sieht alles gut aus. Frische ' + Math.round(c.p.fitness) + ' %. Was kann ich für dich tun?“'; },
        opts: function (c) { return c.p.inj ? [
          { l: 'Schnelle Rückkehr – ich will spielen.', hint: 'Rückfallrisiko', fx: function (st, c2) { var p = c2.p; if (p.inj.weeks > 1 && chance(0.5 + medQ(c2) / 3)) p.inj.weeks--; L.life(st).relapse = tick(st) + 6; return end('„Auf deine Verantwortung. Wir schieben die Reha an.“ Kein Heilungsversprechen.', { coach: 1, risk: 2 }); } },
          { l: 'Vollständig auskurieren.', fx: function (st) { L.life(st).relapse = 0; return end('„Vernünftig. Wir machen es gründlich.“', { stress: -2, coach: -1 }); } },
          { l: 'Eine Zweitmeinung einholen (1.500 €).', fx: function (st, c2) { if (R.pf) R.pf.book(st, -1500, 'Gesundheit'); var p = c2.p, r = R.rand(); if (r < 0.3 && p.inj.weeks > 2) { p.inj.weeks -= 1; return end('Der Spezialist sieht es etwas günstiger: eine Woche weniger Pause.', { conf: 1 }); } if (r > 0.85) { p.inj.weeks += 1; return end('Die Zweitmeinung ist ernüchternd: eher eine Woche länger.', { stress: 2 }); } return end('Die Diagnose wird bestätigt.', {}); } }] : [
          { l: 'Belastungsdiagnostik machen', fx: function (st) { L.life(st).med.dx = tick(st) + 6; return end('Werte und Belastung werden gesteuert – das Verletzungsrisiko sinkt in den nächsten Wochen etwas.', { coach: 1 }); } },
          { l: 'Präventive Physiotherapie', fx: function () { return end('Muskulatur gelockert, Frische steigt.', { fit: 5, stress: -1 }); } },
          { l: 'Danke, alles gut.', fx: function () { return end('„Melde dich, wenn etwas zwickt.“'); } }]; } }
    }
  }, {
    id: 'youthcoach', cat: 'trainer', ic: '🧢', scene: 'jugend', title: 'Gespräch mit dem Jugendtrainer', max: 3,
    who: function (c) { return { n: c.life.ycName || (c.life.ycName = L.name('b')), role: 'Nachwuchstrainer', ic: '🧢', kind: 'coach' }; },
    nodes: {
      start: { say: function (c) { return '„Du machst Fortschritte. Die Frage ist, wie es weitergeht: ' + (c.age >= 15 ? 'Leistungszentrum, Internat, Perspektive Profikader.' : 'Schule, Training und Spaß müssen zusammenpassen.') + '“'; },
        opts: function (c) { var o = [];
          if (c.age >= 14 && !X.mem(c.st, 'academy')) o.push({ l: 'Ich will ins Internat / Leistungszentrum.', fx: function (st) { X.mem(st, 'academy', 1); return end('Die Eltern stimmen nach langem Gespräch zu. Ein neues Kapitel: eigenes Zimmer, Training jeden Tag.', { amb: 3, family: -3, disc: 2 }, { mem: { k: 'academy', txt: 'Ins Internat/Leistungszentrum gewechselt' } }); } });
          o.push({ l: 'Wie sieht meine Profi-Perspektive aus?', fx: function (st, c2) { var gap = (c2.c ? R.avg(W.squad(st, c2.p.clubId).filter(function (x) { return !x.youth; }), function (x) { return x.ovr; }) : 60) - c2.p.ovr; return end(gap <= 3 ? '„Du bist nah dran. Bald trainierst du oben mit.“' : gap <= 10 ? '„Zwei, drei Jahre, wenn du dranbleibst.“' : '„Ehrlich: Der Weg ist weit. Aber Spätstarter gibt es immer wieder.“', { conf: gap <= 3 ? 3 : 0 }); } });
          o.push({ l: 'Kann ich eine andere Position probieren?', fx: function () { return end('„Probier es im nächsten Turnier.“', { amb: 1 }); } });
          return o; } }
    }
  }, {
    id: 'finadv', cat: 'finberater', ic: '🧮', scene: 'finanzen', title: 'Gespräch mit der Finanzberatung', max: 3,
    who: function (c) { var a = FA && FA.current(c.st); return a ? { n: a.n, role: 'Finanzberatung · ' + a.firm, ic: '🧮', kind: 'fa' } : { n: 'Bankberatung', role: 'Hausbank', ic: '🏦', kind: 'fa' }; },
    nodes: {
      start: { say: function (c) { var sec = PF.security(c.st); return '„Ihre Reserve reicht für ' + (Math.round(sec.months * 10) / 10).toString().replace('.', ',') + ' Monate, die Sicherheitsstufe ist ' + sec.lvl + '. Worüber möchten Sie sprechen?“'; },
        opts: [{ l: 'Was kostet mich Ihre Empfehlung wirklich?', req: function (c) { return FA && FA.current(c.st); }, fx: function (st, c) { var a = FA.current(st); FA.know(st, a.id, 'trans', 1); return go('cost', a.a.trans >= 60 ? 'Die Kosten werden offen aufgeschlüsselt.' : 'Die Antwort bleibt etwas vage.'); } },
          { l: 'Wie riskant ist mein Depot?', fx: function (st, c) { var sec = PF.security(st); return end('Schwankende Anlagen machen ' + Math.round(Math.min(1, sec.vol) * 100) + ' % aus. ' + (sec.vol > 0.5 ? 'Das ist viel – ein Crash würde weh tun.' : 'Das ist vertretbar.'), {}); } },
          { l: 'Sollte ich einen Kredit aufnehmen?', fx: function (st, c) { var sec = PF.security(st); return end(sec.lvl >= 4 ? '„Davon rate ich Ihnen ab – Ihre Lage ist zu angespannt.“' : '„Nur für werthaltige Dinge wie eine Immobilie.“', { disc: 1 }); } }] },
      cost: { say: function (c) { var a = FA.current(c.st); return '„Laufende Kosten derzeit ' + money(FA.monthlyCost(c.st)) + ' im Monat.' + (a.a.ehr < 45 ? ' Aber die Produkte rechnen sich langfristig!' : '') + '“'; },
        opts: [{ l: 'Danke, das ist transparent.', fx: function (st) { FA.trust(st, 2, 'Offenes Kostengespräch'); return end('', {}); } }, { l: 'Das ist mir zu teuer.', fx: function (st) { FA.trust(st, -3, 'Kosten hinterfragt'); return end('Der Berater wirkt verstimmt, bietet aber eine günstigere Variante an.', { conf: 1 }); } }] }
    }
  }]);
})(RFM);
