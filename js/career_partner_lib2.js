// Privatleben 2.0 – Gesprächsbibliothek Teil 2: Freizeit (20), Beruf & Ziele (20), Wechsel & Umzug (15),
// Konflikt & Versöhnung (15), Lebensereignisse (15). Format wie in career_partner_lib.js.
(function (R) {
  var L = R.life, P = L && L.pt, X = R.cx, C = R.pc; if (!P) return;
  function tk(st) { return st.tick || 0; }
  function ch(p) { return R.rand() < p; }
  function fn(p) { return p ? p.name.split(' ')[0] : ''; }
  function closeTh(k, res) { return function (st) { P.close(st, k, res || 'besprochen'); }; }
  function book(st, v, cat) { if (R.pf) R.pf.book(st, v, cat || 'Freizeit & Privatleben'); }
  var A = [];

  // ======================= F. FREIZEIT (nur über Aktivitäten) =======================
  A.push(
    { cd: 45, id: 'f01', cat: 'freizeit', act: 'dinner', nodes: { start: { img: 'romantic', s: { herz: 'Beim Dessert greift {n} nach deiner Hand: „So ein Abend fehlt uns viel zu oft.“', ehrgeiz: '{n} legt das Handy weg: „Heute keine Mails. Versprochen.“', def: '{n} schaut sich im Restaurant um: „Schön hier. Gute Wahl.“' }, o: [
      ['Lass uns das jeden Monat machen.', '„Ich trage es mir ein – mit Ausrufezeichen.“', { partner: 2 }, null, function (st) { P.open(st, 'monthly_dinner'); }],
      ['Erzähl mir von deinen Plänen für dieses Jahr.', '{n} erzählt von {goal}. Du merkst, wie viel es ihr bedeutet.'.replace('ihr', '{n}'), { partner: 3 }],
      ['Ich muss gleich noch Spielszenen schauen.', { c_direkt: '„Jetzt? Ernsthaft?“ Der Abend kühlt ab.', def: '„Okay … dann zahlen wir.“' }, { partner: -2 }]] } } },
    { cd: 45, id: 'f02', cat: 'freizeit', act: 'dinner', nodes: { start: { img: 'relaxed', s: 'Am Nachbartisch erkennt dich jemand und will ein Foto.', o: [
      ['Kurz lächeln, dann zurück zu {n}.', { still: '{n} atmet auf, als du dich wieder setzt: „Danke, dass es kurz blieb.“', def: '„Du machst das gut“, sagt {n}.' }, { partner: 1, pop: 1 }],
      ['Freundlich ablehnen – heute ist privat.', '{n} lächelt: „Das war gerade ziemlich charmant.“', { partner: 2 }],
      ['Ein ganzes Fotoshooting draus machen.', { still: '{n} schaut auf die Uhr. Der Zauber ist weg.', def: '{n} lacht – aber nur halb.' }, { pop: 2, partner: -2 }]] } } },
    { cd: 45, id: 'f03', cat: 'freizeit', act: 'cinema', nodes: { start: { img: 'relaxed', s: 'Nach dem Film fragt {n}: „Und? Ehrlich: Wie fandest du das Ende?“', o: [
      ['Großartig.', { humor: '„Lügner. Du hast geschlafen.“ Ihr lacht beide.', def: '„Fand ich auch!“' }, { partner: 1 }],
      ['Zu kitschig.', { temp: '„Kitschig? Das war Kunst!“ Ihr diskutiert bis nach Hause.', def: '„Ein bisschen schon.“' }, { partner: 2 }],
      ['Nächstes Mal suche ich aus.', '„Dann wird es bestimmt ein Sportfilm.“', {}]] } } },
    { cd: 45, id: 'f04', cat: 'freizeit', act: 'walk', nodes: { start: { img: 'thought', s: { winter: '', def: 'Beim Spaziergang bleibt {n} stehen: „Weißt du, was ich an solchen Momenten mag? Niemand will etwas von dir.“' }, o: [
      ['Genau deshalb brauche ich das.', '„Dann machen wir das öfter.“', { stress: -2, partner: 2 }],
      ['Doch – du willst, dass ich die Jacke zumache.', { humor: '„Weil es kalt ist, du Profi!“', def: '„Gut aufgepasst.“' }, { partner: 1 }]] } } },
    { cd: 45, id: 'f05', cat: 'freizeit', act: 'walk', when: function (c) { return c.pt.stage >= 3; }, nodes: { start: { img: 'romantic', s: '{n}: „Erinnerst du dich an {mem}? Hier in der Nähe war das doch.“', o: [
      ['Als wäre es gestern gewesen.', '{n} hakt sich bei dir unter.', { partner: 3 }],
      ['Ich glaube, das war woanders.', '„Nein, ganz sicher hier!“ Ihr streitet lachend.', { partner: 1 }]] } } },
    { cd: 45, id: 'f06', cat: 'freizeit', act: 'concert', nodes: { start: { img: 'success', s: 'Nach dem Konzert ist {n} heiser vom Mitsingen: „Das war der beste Abend seit Langem!“', o: [
      ['Du hast jedes Lied mitgesungen.', '„Und du hast getanzt. Ich habe es gesehen.“', { partner: 2, well: 2 }],
      ['Morgen bin ich beim Training ein Wrack.', { ehrgeiz: '„Das war es wert. Und du bist jung.“', def: '„Dann gehen wir jetzt direkt heim.“' }, { fit: -1, well: 2 }]] } } },
    { cd: 45, id: 'f07', cat: 'freizeit', act: 'sport', nodes: { start: { img: 'relaxed', s: '{n} keucht nach der Runde: „Du läufst ja gar nicht richtig. Schonst du mich?“', o: [
      ['Ein bisschen.', { ehrgeiz: '„Das nächste Mal nicht! Ich will es wissen.“', def: '„Lieb von dir.“' }, { partner: 2 }],
      ['Ich darf mich heute nicht belasten.', '„Ach so – Trainingsplan. Dann zeig mir lieber Dehnübungen.“', { fit: 1 }],
      ['Wettrennen bis zur Laterne!', '{n} gewinnt – du behauptest, du hättest {n} gewinnen lassen.', { partner: 3, well: 1 }]] } } },
    { cd: 45, id: 'f08', cat: 'freizeit', act: 'trip', nodes: { start: { img: 'romantic', s: { def: '{n} öffnet das Fenster der Pension: „Schau mal, diese Aussicht. Hier kennt dich niemand.“' }, o: [
      ['Herrlich. Nur wir zwei.', '„Genau so habe ich mir das vorgestellt.“', { partner: 3, stress: -2 }, null, function (st) { P.mem(st, 'trip_' + st.season + '_' + st.week, 'Wochenendausflug', 'unser Wochenende in der Pension'); }],
      ['Gibt es hier ein Fitnessstudio?', { humor: '„Die Treppe. 120 Stufen. Viel Spaß.“', def: '„Echt jetzt?“' }, { fit: 1 }]] } } },
    { cd: 45, id: 'f09', cat: 'freizeit', act: 'trip', nodes: { start: { img: 'thought', s: 'Auf der Rückfahrt wird {n} still: „Am Montag geht der Alltag wieder los. Schade.“', o: [
      ['Wir planen gleich den nächsten Ausflug.', '„Versprochen?“', { partner: 2 }],
      ['Ich freue mich ehrlich gesagt auf das Training.', { c_offen: '„Ich weiß. Ich freue mich trotzdem, dass du hier warst.“', def: '„Klar.“' }, {}]] } } },
    { cd: 45, id: 'f10', cat: 'freizeit', act: 'vacation', len: 'pers', nodes: {
      start: { img: 'romantic', s: '{n} liegt neben dir am Strand: „Kein Handy, keine Taktik. Wie fühlt sich das an?“', o: [
        ['Ungewohnt – aber gut.', '„Gewöhn dich dran. Noch fünf Tage.“', { stress: -2 }, 'b'],
        ['Mein Berater hat zweimal angerufen.', { c_direkt: '„Dann ruft er ein drittes Mal – und du gehst nicht ran.“', def: '„Und du gehst ran? Im Urlaub?“' }, {}, 'b']] },
      b: { img: 'romantic', s: '„Was war eigentlich dein schönster Moment dieses Jahr?“', o: [
        ['Dieser hier.', '{n} lächelt und sagt lange nichts.', { partner: 4, well: 2 }],
        ['Mein Treffer gegen {opp}.', { fan: '„Der war auch schön!“', def: '„Natürlich.“ {n} lacht.' }, { partner: 1 }],
        ['{mem}.', '„Das ist auch einer meiner liebsten.“', { partner: 3 }]] } } },
    { cd: 45, id: 'f11', cat: 'freizeit', act: 'vacation', nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe für morgen eine Wanderung rausgesucht. Bist du dabei?“', o: [
      ['Klar, ich trage den Rucksack.', '„Mein persönlicher Packesel.“', { partner: 2, fit: 1 }],
      ['Ich bleibe lieber am Pool.', { indep: '', def: '„Dann gehe ich mit der Gruppe vom Hotel.“' }, { stress: -1 }]] } } },
    { cd: 45, id: 'f12', cat: 'freizeit', act: 'friends', nodes: { start: { img: 'relaxed', s: '{n}s Freundeskreis fragt dich über deinen Verein aus. {n} sieht dich entschuldigend an.', o: [
      ['Gern erzählen – aber kurz.', '{n} wechselt geschickt das Thema, als es dir zu viel wird.', { partner: 1 }],
      ['Lieber über ihre Jobs reden.', 'Die Runde taut auf. Später sagt {n}: „Die mögen dich jetzt richtig.“', { partner: 3 }],
      ['Ausführlich über Taktik dozieren.', { fan: '{n} hört begeistert zu, die anderen weniger.', def: 'Die Runde wird ein bisschen still.' }, {}]] } } },
    { cd: 45, id: 'f13', cat: 'freizeit', act: 'friends', nodes: { start: { img: 'success', s: 'Spieleabend bei Freunden – {n} und du seid ein Team.', o: [
      ['Gewinnen wollen.', { ehrgeiz: 'Ihr gewinnt haushoch. {n} macht ein Siegerfoto.', def: 'Ihr wollt beide gewinnen – es wird laut und lustig.' }, { partner: 2, well: 1 }],
      ['Einfach Spaß haben.', 'Ihr verliert und lacht trotzdem am meisten.', { partner: 2 }]] } } },
    { cd: 45, id: 'f14', cat: 'freizeit', act: 'family', nodes: { start: { img: 'relaxed', s: 'Bei der Familienfeier fragt ein Onkel: „Und wann wird geheiratet?“ Alle schauen euch an.', req: null, o: [
      ['Lachen und das Thema wechseln.', '{n} drückt unter dem Tisch deine Hand.', { partner: 1, family: 1 }],
      ['„Wenn wir so weit sind.“', { herz: '{n} strahlt dich an.', def: '{n} nickt zufrieden.' }, { partner: 2 }],
      ['„Gar nicht so bald.“', { c_offen: 'Auf dem Heimweg fragt {n}: „Wie meintest du das vorhin?“', def: '{n} sagt den Rest des Abends nicht viel.' }, { partner: -2 }]] } }, when: function (c) { return c.pt.stage <= 4; } },
    { cd: 45, id: 'f15', cat: 'freizeit', act: 'family', nodes: { start: { img: 'relaxed', s: '{n}s Mutter zeigt dir Kinderfotos von {n}. {n} wird rot.', o: [
      ['Die Fotos will ich alle sehen.', '{n}: „Das zahle ich dir heim.“ Aber {n} lacht.', { partner: 2, family: 1 }],
      ['Gnädig sein und den Kuchen loben.', '„Danke für die Rettung“, flüstert {n}.', { partner: 2 }]] } } },
    { cd: 45, id: 'f16', cat: 'freizeit', act: 'match', nodes: { start: { img: 'success', s: { fan: 'Nach dem Spiel wartet {n} am Spielereingang: „Ich habe die ganze Zeit mitgezittert! Die Kurve war unglaublich.“', nofan: 'Nach dem Spiel wartet {n} am Spielereingang: „Ich habe nicht alles verstanden – aber die Stimmung war toll.“', def: 'Nach dem Spiel wartet {n} am Spielereingang und winkt.' }, o: [
      ['Ich habe dich auf der Tribüne gesehen.', '„Wirklich? Ich habe extra gewunken!“', { partner: 3 }],
      ['Was hast du von meinem Spiel gehalten?', { fan: '„Stark – aber in der zweiten Hälfte hast du zu viel gewartet.“ Ehrlich.', def: '„Du warst super. Glaube ich.“' }, { partner: 1 }]] } } },
    { cd: 45, id: 'f17', cat: 'freizeit', act: 'match', nodes: { start: { img: 'thought', s: '{n} saß neben anderen Spielerfrauen und -männern: „Die sind nett. Aber dort wird viel geredet.“', o: [
      ['Lass dich da nicht reinziehen.', '„Keine Sorge. Ich bin wegen dir dort.“', { partner: 2 }],
      ['Worüber denn?', '„Wer zum Sommer geht, wer Ärger mit dem Trainer hat …“ {n} zwinkert. „Du nicht.“', { partner: 1 }]] } } },
    { cd: 45, id: 'f18', cat: 'freizeit', act: 'dayoff', nodes: { start: { img: 'relaxed', s: 'Freier Tag: Ihr schlendert über den Markt. {n}: „Lass uns heute einfach treiben lassen.“', o: [
      ['Café, Buchladen, Park – in der Reihenfolge.', '„Du kennst mich zu gut.“', { partner: 3, stress: -2 }],
      ['Ich habe eine Überraschung geplant.', function (c, p) { return P.isOpen(p, 'sunday') ? '„Du hast es wirklich nicht vergessen!“ {n} strahlt.' : '„Du? Eine Überraschung? Ich bin gespannt.“'; }, { partner: 3 }, null, function (st) { P.close(st, 'sunday', 'eingelöst'); }]] } } },
    { cd: 45, id: 'f19', cat: 'freizeit', act: 'home', nodes: { start: { img: 'relaxed', s: '{n} kuschelt sich unter die Decke: „Welche Serie heute?“', o: [
      ['Die, mit der wir angefangen haben.', '„Endlich! Ich habe nicht heimlich weitergeschaut. Fast.“', { partner: 2 }],
      ['Du suchst aus.', '{n} wählt eine Doku über {hob}. Du schläfst nach 20 Minuten ein – {n} deckt dich zu.', { partner: 1, stress: -2 }]] } } },
    { cd: 45, id: 'f20', cat: 'freizeit', act: 'home', when: function (c) { return c.sp.fresh && c.sp.loss; }, nodes: { start: { img: 'thought', s: '{n} bestellt dein Lieblingsessen: „Nach so einem Spiel gibt es keine Diskussion über Kalorien.“', o: [
      ['Danke. Genau das brauche ich.', '„Ich weiß.“', { stress: -3, partner: 2 }],
      ['Ich habe eigentlich keinen Hunger.', '„Dann sitzen wir einfach hier.“ Das reicht auch.', { stress: -1 }]] } } }
  );

  // ======================= B. BERUF & ZIELE (eigenes Leben der Partnerperson) =======================
  A.push(
    { id: 'b01', cat: 'beruf', th: 'promo', onStart: closeTh('promo'), nodes: { start: { img: 'success', s: '{n} kommt strahlend heim: „Ich bin befördert worden!“', o: [
      ['Das feiern wir – heute Abend gehört dir.', '„Du hast wirklich daran gedacht, dass das wichtig ist.“', { partner: 4, well: 1 }, null, function (st) { P.mem(st, 'promo_' + st.season, 'Beförderung von {n}'.replace('{n}', fn(P.partner(st))), 'deine Beförderung'); }],
      ['Wahnsinn! Erzähl, wie es dazu kam.', { ehrgeiz: '{n} erzählt jedes Detail der Verhandlung – du bist beeindruckt.', def: '{n} erzählt, wie lange sie dafür gearbeitet hat.'.replace('sie', '{n}') }, { partner: 3 }],
      ['Schön. Ich hatte heute Ärger im Training.', { c_offen: '„Kannst du dich nicht einmal einfach für mich freuen?“', def: '„Oh … okay. Erzähl.“ {n}s Lächeln verschwindet.' }, { partner: -4 }]] } } },
    { id: 'b02', cat: 'beruf', trig: 'joboffer', len: 'gross', cd: 0, onStart: function (st, c, p) { p.th.joboffer.d.city = p.th.joboffer.d.city || 'Hamburg'; }, nodes: {
      start: { img: 'thought', s: function (c, p) { return '{n}: „Ich muss dir etwas sagen. Ich habe ein Jobangebot – in ' + p.th.joboffer.d.city + '. Eine richtig große Chance.“'; }, o: [
        ['Erzähl mir alles darüber.', '{n} erzählt: mehr Verantwortung, mehr Geld, ein Team, das sie sich immer gewünscht hat.'.replace('sie', '{n}'), { partner: 2 }, 'b'],
        ['Und was ist mit uns?', { c_direkt: '„Genau darüber will ich ja reden.“', def: '„Darüber denke ich seit Tagen nach.“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Was denkst du – soll ich es annehmen?“', o: [
        ['Nimm es an. Wir schaffen auch eine Fernbeziehung.', function (c, p) { return p.indep >= 55 ? '„Danke. Das bedeutet mir mehr, als du denkst.“' : '„Wirklich? Ich habe Angst, dass wir uns verlieren.“'; }, { partner: 3 }, 'c', function (st, c, p) { p.ld = true; P.close(st, 'joboffer', 'angenommen'); P.mem(st, 'ld_start', 'Beginn der Fernbeziehung', 'als du den Job in ' + p.th.joboffer.d.city + ' angenommen hast'); }],
        ['Ich würde mir wünschen, dass du bleibst.', function (c, p) { return p.indep >= 60 ? '„Das ist meine Karriere. Ich wäre auch für dich umgezogen.“' : '„Ich verstehe. Ich bleibe – aber das ist ein großes Opfer.“'; }, { partner: -1 }, 'c', function (st, c, p) { P.close(st, 'joboffer', 'abgelehnt'); if (p.indep >= 60) { p.v -= 6; p.neg += 2; } P.open(st, 'sacrifice'); }],
        ['Lass uns gemeinsam eine Lösung suchen.', '„Vielleicht kann ich teilweise im Homeoffice arbeiten …“', { partner: 2 }, 'c', function (st, c, p) { P.close(st, 'joboffer', 'Kompromiss'); if (ch(0.6)) { p.inc = Math.round(p.inc * 1.1 / 1000) * 1000; return { r: '{n} verhandelt: zwei Tage vor Ort, drei Tage von hier. Mehr Gehalt, kein Umzug.' }; } return { r: 'Die Firma lehnt Homeoffice ab. {n} bleibt – und ist ein bisschen traurig.' }; }]] },
      c: { img: 'reconcile', s: '„Danke, dass wir das zusammen entschieden haben.“', o: [
        ['Wir sind ein Team.', '{n} umarmt dich.', { partner: 2 }],
        ['Es fühlt sich trotzdem schwer an.', '„Ja. Aber ehrlich ist besser.“', { partner: 1 }]] } } },
    { id: 'b03', cat: 'beruf', th: 'exam', onStart: function (st, c, p) { p.th.exam.d.talk = 1; }, cd: 40, nodes: { start: { img: 'thought', s: '{n} sitzt über den Büchern: „Die Prüfung ist bald. Ich werde wahnsinnig.“', o: [
      ['Ich frage dich ab.', '{n} lacht über deine Aussprache, aber es hilft.', { partner: 3 }],
      ['Ich halte dir den Rücken frei.', '„Danke. Dann koche heute du.“', { partner: 2 }],
      ['Du schaffst das schon.', '„Leicht gesagt.“', {}]] } } },
    { id: 'b04', cat: 'beruf', th: 'examres', onStart: closeTh('examres'), nodes: { start: { img: 'success', s: function (c, p) { return p.th.examres.d.ok ? '{n} wedelt mit dem Zettel: „Bestanden! Und gar nicht knapp!“' : '{n} legt den Zettel weg: „Durchgefallen. Ich habe mich so angestrengt.“'; }, o: [
      [function (c, p) { return p.th.examres.d.ok ? 'Ich wusste es!' : 'Das tut mir so leid.'; }, function (c, p) { return p.th.examres.d.ok ? '„Und du hast mich abgefragt – halb dein Verdienst.“' : '„Ich versuche es nochmal. Danke, dass du da bist.“'; }, { partner: 3 }],
      ['Darauf ein Essen.', '„Ja. Egal wie es ausging – ein Essen geht immer.“', { partner: 2 }]] } } },
    { id: 'b05', cat: 'beruf', th: 'grad', onStart: closeTh('grad'), len: 'pers', nodes: {
      start: { img: 'success', s: '{n}: „Ich habe meinen Abschluss! Und ich fange als {job} an.“', o: [
        ['Ich bin so stolz auf dich.', '„Die Feier ist am Samstag. Kommst du?“', { partner: 3 }, 'b']] },
      b: { img: 'thought', s: '„Am Samstag ist auch euer Spiel, oder?“', o: [
        ['Ich komme nach dem Spiel direkt hin.', '„Mit Haaren noch nass? Perfekt.“', { partner: 3 }, null, function (st) { P.mem(st, 'grad_party', 'Abschlussfeier', 'deine Abschlussfeier'); }],
        ['Ich frage den Trainer, ob ich früher weg darf.', function (c) { return c.pc.trust >= 55 ? '{coach} erlaubt es – {n} ist überglücklich.' : '{coach} lehnt ab. {n}: „Schon okay. Du hast es versucht.“'; }, { partner: 2, coach: -1 }],
        ['Das schaffe ich leider nicht.', { c_offen: '„Das ist mein großer Tag.“ Du siehst, dass es weh tut.', def: '„Verstehe.“' }, { partner: -4 }]] } } },
    { id: 'b06', cat: 'beruf', th: 'workstress', onStart: closeTh('workstress'), len: 'pers', nodes: {
      start: { img: 'thought', s: '{n} kommt spät und erschöpft heim: „In der {place} ist gerade die Hölle los.“', o: [
        ['Setz dich, ich mache Tee. Erzähl.', '{n} erzählt von Deadlines und einem Chef, der nie zufrieden ist.', { partner: 2 }, 'b'],
        ['Bei mir ist es auch stressig.', { c_direkt: '„Es geht nicht immer um dich.“', def: '„Dann sind wir zwei Gestresste.“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Ich denke manchmal darüber nach, alles hinzuschmeißen.“', o: [
        ['Was würdest du stattdessen machen?', '„Vielleicht etwas mit {hob}.“ {n} wird nachdenklich, aber ruhiger.', { partner: 3 }, null, function (st, c, p) { if (p.indep >= 50) P.open(st, 'bizplan'); }],
        ['Halte durch, das geht vorbei.', '„Hoffentlich.“', { partner: 1 }],
        ['Mach eine Pause, ich verdiene genug.', function (c, p) { return p.indep >= 60 ? '„Ich will nicht von dir abhängig sein.“ Das war das Falsche.' : '„Das ist lieb. Aber mein Job ist mir wichtig.“'; }, { partner: -1 }]] } } },
    { id: 'b07', cat: 'beruf', th: 'course', onStart: closeTh('course'), nodes: { start: { img: 'relaxed', s: '{n}: „Ich mache eine Weiterbildung, abends und am Wochenende. Wir werden uns weniger sehen.“', o: [
      ['Super Idee. Wir finden unsere Zeiten.', '„Danke. Ich dachte, du wärst sauer.“', { partner: 3 }],
      ['Dann sehen wir uns ja kaum noch.', { indep: '', c_offen: '„Du bist auch dauernd weg. Jetzt bin ich mal dran.“', def: '„Ich weiß. Aber es ist mir wichtig.“' }, { partner: -2 }]] } } },
    { id: 'b08', cat: 'beruf', th: 'success', onStart: closeTh('success'), nodes: { start: { img: 'success', s: { ehrgeiz: '{n}: „Mein Projekt war ein voller Erfolg! Die Chefin hat mich vor allen gelobt.“', def: '{n}: „Heute lief es endlich mal richtig gut in der {place}.“' }, o: [
      ['Erzähl!', '{n} erzählt mit leuchtenden Augen.', { partner: 3 }],
      ['Siehst du – du bist toll in dem, was du tust.', '„Das musste ich mal hören.“', { partner: 3 }]] } } },
    { id: 'b09', cat: 'beruf', th: 'setback', onStart: closeTh('setback'), len: 'pers', nodes: {
      start: { img: 'thought', s: '{n} sitzt still am Küchentisch: „Sie haben die Stelle jemand anderem gegeben.“', o: [
        ['Das ist so unfair.', '„Danke.“', { partner: 2 }, 'b'],
        ['Vielleicht klappt es beim nächsten Mal.', { ehrgeiz: '„Ich will kein nächstes Mal. Ich wollte diese.“', def: '„Vielleicht.“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Weißt du, wie das ist, wenn du alles gibst und es reicht nicht?“', o: [
        ['Ja. Genau so fühlt sich die Bank an.', '{n} schaut dich an: „Stimmt. Du kennst das.“ Ein Moment echter Nähe.', { partner: 4 }],
        ['Komm, wir gehen raus. Ablenkung.', '„Ja. Bitte.“', { partner: 2, stress: -1 }]] } } },
    { id: 'b10', cat: 'beruf', th: 'famduty', onStart: closeTh('famduty'), nodes: { start: { img: 'thought', s: '{n}: „Meinem Vater geht es nicht gut. Ich fahre ein paar Tage zu ihm.“', o: [
      ['Fahr. Ich komme nach, wenn ich kann.', '„Danke. Das bedeutet mir viel.“', { partner: 3 }, null, function (st) { P.open(st, 'famcheck'); }],
      ['Brauchst du Geld für die Pflege?', function (c, p) { return p.indep >= 60 ? '„Danke – aber wir schaffen das.“' : '„Vielleicht ein wenig. Danke.“'; }, { partner: 2 }, null, function (st, c, p) { if (p.indep < 60) book(st, -1500, 'Familie'); }],
      ['Hoffentlich bist du bis zum Wochenende zurück.', '{n} sagt nichts. Du merkst, das war daneben.', { partner: -3 }]] } } },
    { id: 'b11', cat: 'beruf', th: 'famcheck', onStart: closeTh('famcheck'), nodes: { start: { img: 'relaxed', s: '{n}: „Meinem Vater geht es besser. Danke, dass du gefragt hast.“', o: [
      ['Grüß ihn von mir.', '„Er hat schon nach dir gefragt.“', { partner: 2, family: 1 }]] } } },
    { id: 'b12', cat: 'beruf', th: 'ownTrip', onStart: closeTh('ownTrip'), nodes: { start: { img: 'relaxed', s: '{n}: „Ich fahre mit meinen Freundinnen und Freunden ein paar Tage weg. Kommst du allein klar?“', o: [
      ['Na klar, viel Spaß!', '„Ich schicke Fotos.“', { partner: 2 }],
      ['Ich werde dich vermissen.', '„Ich dich auch. Aber es tut mir gut.“', { partner: 2 }],
      ['Gerade jetzt?', { c_direkt: '„Ich richte mich ständig nach deinem Spielplan. Jetzt mal nicht.“', def: '„Ja, gerade jetzt.“' }, { partner: -2 }]] } } },
    { id: 'b13', cat: 'beruf', th: 'bizplan', onStart: closeTh('bizplan'), len: 'pers', nodes: {
      start: { img: 'thought', s: '{n}: „Ich überlege, mich selbstständig zu machen. Mit {hob} als Geschäftsidee.“', o: [
        ['Erzähl mir den Plan.', '{n} holt eine Mappe. Es ist durchdacht.', { partner: 2 }, 'b'],
        ['Ist das nicht riskant?', { ehrgeiz: '„Klar. Du spielst auch jedes Wochenende mit deiner Gesundheit.“', def: '„Ja. Deshalb rede ich mit dir.“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Ich bräuchte ein Startkapital. Ich will dich nicht drängen.“', o: [
        ['Ich gebe dir 20.000 € als Startkapital.', '„Als Darlehen. Ich zahle es zurück.“ {n} ist gerührt.', { partner: 4 }, null, function (st, c, p) { book(st, -20000, 'Familie'); p.self = true; p.inc = Math.round(p.inc * 0.7 / 1000) * 1000; P.mem(st, 'biz', 'Gründung des eigenen Geschäfts', 'als du dein eigenes Geschäft gegründet hast'); }, function (c) { return c.money >= 30000; }],
        ['Mach es mit einem Bankkredit – ich unterstütze dich anders.', '„Gut. So bleibt es meins.“', { partner: 2 }, null, function (st, c, p) { if (ch(0.6)) { p.self = true; P.mem(st, 'biz', 'Gründung des eigenen Geschäfts', 'als du dein eigenes Geschäft gegründet hast'); } }],
        ['Lass es lieber.', { c_offen: '„Danke für deine Ehrlichkeit. Ich denke trotzdem weiter darüber nach.“', def: '„Okay.“ Enttäuschung.' }, { partner: -2 }]] } } },
    { id: 'b14', cat: 'beruf', cd: 50, when: function (c) { return !c.pt.stud; }, nodes: { start: { img: 'relaxed', s: '{n}: „Mein Ziel ist eigentlich {goal}. Ich frage mich, ob ich dafür genug tue.“', o: [
      ['Was wäre der nächste Schritt?', '{n} überlegt laut – und hat am Ende einen Plan.', { partner: 3 }],
      ['Du tust sehr viel.', '„Findest du?“', { partner: 1 }]] } } },
    { id: 'b15', cat: 'beruf', cd: 40, nodes: { start: { img: 'relaxed', s: '{n}: „Eine Kollegin hat mich gefragt, wie es so ist, mit einem Profi zusammen zu sein.“', o: [
      ['Und was hast du gesagt?', { humor: '„Viel Wäsche, wenig Wochenende.“ {n} grinst.', still: '„Dass du ganz normal bist.“', def: '„Dass du gar nicht so anders bist als andere.“' }, { partner: 1 }],
      ['Hoffentlich nur Gutes.', '„Meistens.“', {}]] } } },
    { id: 'b16', cat: 'beruf', cd: 50, when: function (c) { return c.pt.stud; }, nodes: { start: { img: 'thought', s: '{n}: „Das Studium frisst mich auf, und dein Leben ist so voll. Manchmal fühle ich mich wie ein Gast hier.“', o: [
      ['Du bist kein Gast. Das hier ist auch dein Zuhause.', '{n} lehnt sich an dich.', { partner: 3 }],
      ['Bald hast du es geschafft.', '„Hoffentlich.“', { partner: 1 }]] } } },
    { id: 'b17', cat: 'beruf', cd: 60, when: function (c) { return c.pt.self; }, nodes: { start: { img: 'success', s: '{n}: „Mein Geschäft hat diesen Monat zum ersten Mal Gewinn gemacht!“', o: [
      ['Ich wusste, dass du das schaffst.', '„Danke, dass du an mich geglaubt hast.“', { partner: 3 }],
      ['Ich komme vorbei und kaufe ein.', '„Mit Autogrammkarten als Bonus?“', { partner: 2 }]] } } },
    { id: 'b18', cat: 'beruf', cd: 60, when: function (c) { return c.money < 15000 && c.pt.stage >= 4; }, nodes: { start: { img: 'thought', s: '{n}: „Ich habe mir die Kontoauszüge angeschaut. Wir müssen über Geld reden.“', o: [
      ['Du hast recht. Lass uns einen Plan machen.', '„Danke. Ich will nicht, dass wir uns Sorgen machen müssen.“', { partner: 2 }],
      ['Das regelt mein Finanzberater.', { c_offen: '„Und mich fragt niemand?“', def: '„Hoffentlich.“' }, { partner: -1 }]] } } },
    { id: 'b19', cat: 'beruf', cd: 60, when: function (c) { return c.pt.pub < 45 && c.pc.fame > 40; }, nodes: { start: { img: 'thought', s: '{n}: „Ein Magazin hat bei mir in der {place} angerufen. Sie wollen ein Interview über uns.“', o: [
      ['Lehne ab, wenn du nicht willst.', '„Ich will nicht. Danke, dass du das verstehst.“', { partner: 3 }],
      ['Ein kleines Interview schadet doch nicht.', '„Für dich vielleicht nicht.“', { partner: -2, pop: 1 }]] } } },
    { id: 'b20', cat: 'beruf', th: 'sacrifice', onStart: closeTh('sacrifice'), len: 'pers', nodes: {
      start: { img: 'thought', s: '{n}: „Manchmal denke ich noch an das Jobangebot, das ich abgelehnt habe.“', o: [
        ['Bereust du es?', '„Nicht wegen dir. Aber ich frage mich, was gewesen wäre.“', { partner: 1 }, 'b']] },
      b: { img: 'reconcile', s: '„Ich will einfach, dass meine Wünsche auch Platz haben.“', o: [
        ['Beim nächsten Mal entscheiden wir für dich.', '„Das merke ich mir.“ {n} lächelt.', { partner: 4 }],
        ['Lass uns gemeinsam schauen, was du hier verändern kannst.', '{n} nickt. Ein echtes Gespräch.', { partner: 3 }]] } } }
  );

  // ======================= T. WECHSEL & UMZUG =======================
  function moveDecide(st, c, p, mode) { // Entscheidung nach Entfernung, Job, Kindern, Selbstständigkeit
    var willing = p.move + (mode === 'ask' ? 10 : 0) - (p.self ? 25 : 0) - (c.kid ? 10 : 0) + (p.v - 60) / 2 + (p.stage >= 5 ? 10 : 0) - (p.stud ? 15 : 0);
    P.close(st, 'move', 'besprochen'); P.open(st, 'move_' + st.season); P.close(st, 'move_' + st.season, 'ok');
    if (mode === 'ld' || willing < 45) { p.ld = true; P.mem(st, 'ld_start', 'Beginn der Fernbeziehung', 'als du zu ' + P.fill('{to}', c) + ' gewechselt bist'); P.open(st, 'ldlife'); return false; }
    p.ld = false; p.city = P.fill('{tocity}', c); P.open(st, 'settle'); if (!p.self) { p.inc = Math.round(p.inc * 0.85 / 1000) * 1000; P.open(st, 'newjob'); }
    P.mem(st, 'move_' + st.season, 'Gemeinsamer Umzug nach ' + p.city, 'unser Umzug nach ' + p.city); return true;
  }
  A.push(
    { id: 't01', cat: 'transfer', trig: 'offer', cd: 30, onStart: function (st, c, p) { if (p.th.offer) p.th.offer.d.told = true; }, nodes: { start: { img: 'thought', s: '{n}: „Ich habe gelesen, dass {to} Interesse an dir hat. Stimmt das?“', o: [
      ['Ja. Ich wollte es dir heute sagen.', '„Gut, dass du es mir sagst. Ich will das nicht aus der Zeitung erfahren.“', { partner: 2 }],
      ['Nur Gerüchte.', function (c) { return c.offers.length ? '{n} schaut dich lange an: „Bist du sicher?“' : '„Okay.“'; }, { partner: -1 }],
      ['Was würdest du davon halten?', function (c, p) { return p.move >= 55 ? '„Neue Stadt, neues Abenteuer? Ich wäre offen.“' : '„Ich habe hier meinen Job und meine Leute. Das wäre schwer.“'; }, { partner: 1 }]] } } },
    { id: 't02', cat: 'transfer', trig: 'offer', cd: 30, when: function (c) { return c.pt.stage >= 4; }, onStart: function (st, c, p) { if (p.th.offer) p.th.offer.d.told = true; }, len: 'pers', nodes: {
      start: { img: 'thought', s: '{n} legt die Zeitung auf den Tisch: „{to}? Wann wolltest du mir das sagen?“', o: [
        ['Ich wollte erst wissen, ob es ernst ist.', { c_direkt: '„Wir wohnen zusammen. Das betrifft mich genauso.“', def: '„Verstehe. Aber ich will dabei sein, wenn es ernst wird.“' }, { partner: -1 }, 'b'],
        ['Jetzt. Lass uns reden.', '{n} setzt sich.', { partner: 1 }, 'b']] },
      b: { img: 'thought', s: '„Was wäre für dich wichtig bei einem Wechsel?“', o: [
        ['Dass du mitkommen kannst.', '„Dann frag auch nach meinen Möglichkeiten dort.“', { partner: 3 }, null, function (st) { P.mem(st, 'move_together', 'Wechsel nur gemeinsam', 'dein Versprechen, Wechsel gemeinsam zu entscheiden'); }],
        ['Sportliche Perspektive zuerst.', { ehrgeiz: '„Verstehe ich. Ich hätte es genauso gemacht.“', def: '„Und ich?“' }, {}],
        ['Das Geld.', '„Ehrlich. Aber Geld ist nicht alles.“', { partner: -1 }]] } } },
    { id: 't03', cat: 'transfer', trig: 'offer2', cd: 30, onStart: function (st) { P.close(st, 'offer', 'besprochen'); P.mem(st, 'offer_s' + st.season, 'Wechselgespräch', 'unser Gespräch über den möglichen Wechsel'); }, nodes: { start: { img: 'thought', s: '{n}: „Gibt es Neuigkeiten wegen {to}? Ich denke ständig daran.“', o: [
      ['Noch nichts Neues. Ich halte dich auf dem Laufenden.', '„Danke.“', { partner: 1 }],
      ['Ich glaube, ich bleibe.', function (c, p) { return p.move >= 55 ? '„Schade irgendwie – aber auch schön.“' : '„Ehrlich gesagt bin ich erleichtert.“'; }, { partner: 2 }],
      ['Ich tendiere zum Wechsel.', function (c, p) { return p.move >= 55 ? '„Dann lass uns anfangen zu planen.“' : '„Dann müssen wir ernsthaft reden.“'; }, {}]] } } },
    { id: 't04', cat: 'transfer', trig: 'offer2', cd: 30, when: function (c) { return !!c.ag; }, onStart: function (st) { P.close(st, 'offer', 'besprochen'); P.mem(st, 'offer_s' + st.season, 'Wechselgespräch', 'unser Gespräch über den möglichen Wechsel'); }, nodes: { start: { img: 'thought', s: '{n}: „Was sagt {ag} zu den Angeboten? Ich traue Beratern nicht ganz.“', o: [
      ['Er denkt an meine Karriere.', '„Und wer denkt an uns?“', { partner: -1 }],
      ['Ich bespreche es erst mit dir, dann mit ihm.', '„So gefällt mir das.“', { partner: 3 }]] } } },
    { id: 't05', cat: 'transfer', trig: 'move', cd: 0, len: 'gross', ph: [4, 10], nodes: {
      start: { img: 'thought', s: '{n}: „Es ist also fix – du wechselst zu {to}. Jetzt müssen wir entscheiden, wie es mit uns weitergeht.“', o: [
        ['Ich möchte, dass du mitkommst.', function (c, p) { return p.self ? '„Mein Geschäft ist hier. Das kann ich nicht einfach mitnehmen.“' : c.kid ? '„Mit {kid} wäre das ein großer Schritt. Kita, Freunde …“' : '„Ich muss überlegen, was das für meinen Job heißt.“'; }, { partner: 1 }, 'b'],
        ['Wir könnten eine Fernbeziehung probieren.', '„Das wäre hart. Aber vielleicht ehrlicher.“', {}, 'c']] },
      b: { img: 'thought', s: '„Was wäre mit meinem Job?“', o: [
        ['Ich helfe dir, dort etwas zu finden – der Verein hat Kontakte.', '„Das wäre ein Anfang.“', { partner: 2 }, 'd'],
        ['Du musst nicht arbeiten, mein Gehalt reicht.', function (c, p) { return p.indep >= 55 ? '„Ich will aber arbeiten. Das bin ich.“' : '„Das ist lieb. Ich will aber trotzdem etwas Eigenes.“'; }, { partner: -2 }, 'd']] },
      c: { img: 'thought', s: '„Wie oft würden wir uns sehen?“', o: [
        ['Jedes freie Wochenende.', '„Und in der Saison? Wenn du spielst?“', {}, 'd'],
        ['Lass es uns einfach versuchen.', '„Okay. Versuchen wir es.“', {}, null, function (st, c, p) { moveDecide(st, c, p, 'ld'); return { r: 'Ihr entscheidet euch für eine Fernbeziehung. Der Abschied am Bahnhof fällt schwer.', img: 'farewell' }; }]] },
      d: { img: 'thought', s: '„Ich brauche eine Nacht, um darüber zu schlafen.“', o: [
        ['Nimm dir die Zeit.', '…', { partner: 2 }, null, function (st, c, p) { var ok = moveDecide(st, c, p, 'ask'); return ok ? { r: 'Am nächsten Morgen sagt {n}: „Ich komme mit.“ Ihr fallt euch in die Arme.', img: 'reconcile', e: { partner: 5, well: 3 } } : { r: '{n}: „Ich bleibe vorerst hier. Lass es uns aus der Ferne versuchen.“', img: 'farewell', e: { partner: -1 } }; }],
        ['Ich brauche die Antwort heute.', '{n} ist überrumpelt.', { partner: -3 }, null, function (st, c, p) { var ok = moveDecide(st, c, p, 'now'); return ok ? { r: '{n}: „Okay. Ich komme mit. Aber das war viel Druck.“', img: 'thought' } : { r: '{n}: „Dann ist die Antwort: Ich bleibe hier.“', img: 'farewell' }; }]] } } },
    { id: 't06', cat: 'transfer', th: 'settle', thAge: 12, onStart: closeTh('settle'), len: 'pers', nodes: {
      start: { img: 'thought', s: '{n} schaut aus dem Fenster der neuen Wohnung: „Ich kenne hier noch niemanden.“', o: [
        ['Ich stelle dir die Partner meiner Mitspieler vor.', '„Gern – aber ich will auch eigene Freunde.“', { partner: 2, mates: 1 }, 'b'],
        ['Am Wochenende erkunden wir die Stadt.', '„Ja. Zeig mir {city}.“', { partner: 3 }, 'b']] },
      b: { img: 'relaxed', s: '„Wird schon. Ein Zuhause wird es, wenn man es dazu macht.“', o: [
        ['Mit dir ist es schon eins.', '{n} lächelt zum ersten Mal seit dem Umzug richtig.', { partner: 3 }]] } } },
    { id: 't07', cat: 'transfer', th: 'newjob', thAge: 20, onStart: closeTh('newjob'), nodes: { start: { img: 'success', s: '{n}: „Ich habe hier eine Stelle gefunden! Nicht ganz wie vorher, aber gut.“', o: [
      ['Großartig! Darauf stoßen wir an.', '„Jetzt fühle ich mich angekommen.“', { partner: 3 }],
      ['Siehst du, es hat sich gelohnt.', '„Für dich sowieso.“ Sie lacht – meint es aber auch.'.replace('Sie', '{n}'), { partner: 1 }]] } } },
    { id: 't08', cat: 'transfer', th: 'ldlife', cd: 20, when: function (c) { return c.pt.ld; }, nodes: { start: { img: 'thought', s: '{n} am Telefon: „Ich vermisse dich. Die Wohnung ist so leer.“', o: [
      ['Ich komme am freien Tag zu dir.', '„Versprochen?“', { partner: 3 }, null, function (st) { book(st, -180, 'Freizeit & Privatleben'); }],
      ['Nur noch ein paar Wochen bis zur Pause.', '„Ich zähle.“', { partner: 1 }],
      ['Videoanruf jeden Abend um zehn?', '„Abgemacht. Auch wenn du verloren hast.“', { partner: 2 }]] } } },
    { id: 't09', cat: 'transfer', len: 'pers', cd: 80, when: function (c) { return c.pt.ld && c.pt.v >= 55; }, nodes: {
      start: { img: 'thought', s: '{n}: „Ich habe nachgedacht. Die Fernbeziehung zehrt an mir. Vielleicht ziehe ich doch zu dir.“', o: [
        ['Das wäre wunderbar.', '„Dann suche ich mir dort einen Job.“', { partner: 3 }, 'b'],
        ['Bist du dir sicher? Dein Leben ist dort.', '„Mein Leben bist auch du.“', { partner: 2 }, 'b']] },
      b: { img: 'reconcile', s: '„Dann machen wir es.“', o: [
        ['Ich helfe dir beim Umzug.', '{n} zieht zu dir. Ein Neuanfang zu zweit.', { partner: 4, well: 3 }, null, function (st, c, p) { p.ld = false; p.city = c.city; p.inc = Math.round(p.inc * 0.9 / 1000) * 1000; P.mem(st, 'ld_end', 'Ende der Fernbeziehung', 'als du endlich zu mir gezogen bist'); book(st, -1500, 'Freizeit & Privatleben'); }]] } } },
    { id: 't10', cat: 'transfer', trig: 'norenew', cd: 0, len: 'pers', onStart: closeTh('norenew'), nodes: {
      start: { img: 'thought', s: '{n}: „{club} verlängert deinen Vertrag nicht? Wie geht es dir damit?“', o: [
        ['Es tut weh. Ich dachte, die wollen mich.', '„Das verstehe ich. Die wissen nicht, was sie verlieren.“', { partner: 2, stress: -1 }, 'b'],
        ['Ist vielleicht eine Chance.', { ehrgeiz: '„Genau so musst du denken.“', def: '„Du bist so stark.“' }, { conf: 1 }, 'b']] },
      b: { img: 'thought', s: function (c, p) { return p.self ? '„Was heißt das für uns? Mein Geschäft ist hier.“' : c.kid ? '„Wir müssen an {kid} denken. Wohin könnte es gehen?“' : '„Wohin könnte es gehen? Ich will mitreden.“'; }, o: [
        ['Ich halte dich bei jedem Angebot auf dem Laufenden.', '„Danke. Dann stehen wir das gemeinsam durch.“', { partner: 3 }, null, function (st) { P.mem(st, 'norenew_' + st.season, 'Vertragsende gemeinsam getragen', 'die Zeit, als dein Vertrag nicht verlängert wurde'); }],
        ['Ich gehe dahin, wo es sportlich passt.', function (c, p) { return p.move >= 55 ? '„Das ist okay. Ich bin flexibel.“' : '„Und ich muss dann einfach mit?“'; }, { partner: -1 }]] } } },
    { id: 't11', cat: 'transfer', trig: 'norenew', cd: 0, when: function (c) { return c.pt.stage <= 3; }, onStart: closeTh('norenew'), nodes: { start: { img: 'thought', s: '{n}: „Ich habe gehört, dein Vertrag läuft aus. Musst du jetzt weg?“', o: [
      ['Vielleicht. Aber das ändert nichts zwischen uns.', '„Gut zu hören.“', { partner: 3 }],
      ['Ich weiß es noch nicht.', '„Sag mir Bescheid, sobald du etwas weißt.“', { partner: 1 }]] } } },
    { id: 't12', cat: 'transfer', cd: 80, when: function (c) { return c.offers.length >= 2 && c.pt.stage >= 4; }, nodes: { start: { img: 'thought', s: '{n} hat sich die Städte deiner Angebote angeschaut: „{tocity} soll schön sein. Und es gibt dort gute Jobs für mich.“', o: [
      ['Das fließt in meine Entscheidung ein.', '„Danke, dass du an mich denkst.“', { partner: 3 }],
      ['Entscheiden muss ich am Ende allein.', { c_direkt: '„Dann ziehe ich am Ende auch allein um, oder was?“', def: '„Mag sein.“' }, { partner: -3 }]] } } },
    { id: 't13', cat: 'transfer', cd: 120, when: function (c) { return c.pt.stage >= 4 && c.pc.clubs && c.pc.clubs.length >= 3; }, nodes: { start: { img: 'thought', s: '{n}: „Wir sind schon so oft umgezogen. Ich wünsche mir irgendwann einen Ort, der bleibt.“', o: [
      ['Den bekommen wir. Versprochen.', '„Ich halte dich daran fest.“', { partner: 3 }, null, function (st) { P.open(st, 'settle_wish'); }],
      ['Das gehört zum Profisport.', '„Für dich. Für mich nicht.“', { partner: -2 }]] } } },
    { id: 't14', cat: 'transfer', cd: 120, when: function (c) { return c.moving && c.pt.stage <= 3; }, nodes: { start: { img: 'farewell', s: '{n}: „Du ziehst also weg. Wir sind noch nicht so lange zusammen … Was machen wir?“', o: [
      ['Wir versuchen es aus der Ferne.', '„Okay. Ich will dich nicht verlieren.“', { partner: 2 }, null, function (st, c, p) { p.ld = true; }],
      ['Ich weiß es ehrlich nicht.', '{n} schweigt lange.', { partner: -3 }]] } } },
    { id: 't15', cat: 'transfer', cd: 200, when: function (c) { return c.pt.stage >= 4 && c.lg <= 1 && c.pc.fame >= 50; }, nodes: { start: { img: 'thought', s: '{n}: „Was wäre, wenn ein Angebot aus dem Ausland käme? Ich habe darüber nachgedacht.“', o: [
      ['Würdest du mitkommen?', function (c, p) { return p.move >= 60 ? '„Ja. Ich wollte immer mal woanders leben.“' : p.move >= 40 ? '„Vielleicht – für eine gewisse Zeit.“' : '„Ehrlich: Das wäre für mich sehr schwer.“'; }, { partner: 1 }, null, function (st, c, p) { P.mem(st, 'abroad_talk', 'Gespräch über das Ausland', 'unser Gespräch über einen Wechsel ins Ausland'); }],
      ['Ausland kommt für mich nur gemeinsam infrage.', '„Danke. Das wollte ich hören.“', { partner: 3 }]] } } }
  );

  // ======================= K. KONFLIKT & VERSÖHNUNG =======================
  function lessNeg(n) { return function (st, c, p) { p.neg = Math.max(0, p.neg - n); }; }
  A.push(
    { id: 'k01', cat: 'konflikt', trig: 'neg_soft', cd: 0, onStart: closeTh('neg_soft', 'angesprochen'), nodes: { start: { img: 'thought', s: { herz: '{n}: „Ich vermisse dich. Du bist zwar hier, aber irgendwie nicht richtig da.“', c_harmonie: '{n} sagt beiläufig: „Wir haben schon länger nichts mehr zusammen gemacht, oder?“', c_direkt: '{n}: „Ich sag es einfach: Du hast in letzter Zeit kaum Zeit für mich.“', def: '{n}: „Hast du diese Woche mal einen Abend für uns?“' }, o: [
      ['Du hast recht. Ich plane etwas für uns.', '„Das wäre schön.“', { partner: 2 }, null, lessNeg(3)],
      ['Die Saison ist gerade sehr intensiv.', '„Ich weiß. Ich wollte es nur sagen.“', {}],
      ['Ich bin doch ständig hier.', { c_offen: '„Körperlich ja.“', def: '„Okay …“' }, { partner: -2 }]] } } },
    { id: 'k02', cat: 'konflikt', trig: 'neg_soft', cd: 0, when: function (c) { return c.pt.stage >= 4; }, onStart: closeTh('neg_soft', 'angesprochen'), nodes: { start: { img: 'thought', s: '{n}: „Ich habe heute allein zu Abend gegessen. Schon wieder.“', o: [
      ['Tut mir leid. Morgen koche ich für uns.', '„Ich nehme dich beim Wort.“', { partner: 2 }, null, lessNeg(3)],
      ['Das Training ging länger.', '„Das geht es oft.“', {}]] } } },
    { id: 'k03', cat: 'konflikt', trig: 'neg_hard', len: 'pers', cd: 0, onStart: function (st, c, p) { X.chron(st, 'familie', '⛈️', 'Ernstes Gespräch', fn(p) + ' fühlt sich vernachlässigt.', 2); }, nodes: {
      start: { img: 'conflict', s: { c_direkt: '{n}: „So geht das nicht weiter. Ich bin nur noch die Person, die zu Hause wartet.“', c_rueck: '{n} hat seit Tagen kaum etwas gesagt. Heute bricht es heraus: „Ich fühle mich allein.“', c_harmonie: '{n} fängt plötzlich an zu weinen: „Ich wollte nichts sagen, aber ich kann nicht mehr.“', def: '{n}: „Wir müssen reden. Ernsthaft.“' }, o: [
        ['Ich höre dir zu. Sag mir alles.', '{n} erzählt von den Abenden allein, von abgesagten Plänen.', { partner: 2 }, 'b'],
        ['Ich mache das alles auch für uns.', '„Für uns? Ich sehe kein uns mehr.“', { partner: -3 }, 'b']] },
      b: { img: 'conflict', s: '„Was soll sich ändern?“', o: [
        ['Ein fester Abend pro Woche gehört nur dir.', '„Okay. Ich gebe dir eine Chance.“', { partner: 5 }, 'c', function (st, c, p) { P.close(st, 'neg_hard', 'Versprechen'); P.open(st, 'promise_eve'); p.neg = Math.max(0, p.neg - 6); L.remember(st, 'promise_family', 'Fester Abend pro Woche versprochen', fn(p)); }],
        ['Lass uns eine Paarberatung machen (300 €).', '„Das zeigt mir, dass du es ernst meinst.“', { partner: 6 }, 'c', function (st, c, p) { book(st, -300); P.close(st, 'neg_hard', 'Beratung'); p.neg = Math.max(0, p.neg - 8); p.crisis = 0; }],
        ['Ich weiß nicht, ob ich mehr geben kann.', '{n} sieht dich lange an. „Dann weiß ich auch nicht weiter.“', { partner: -6 }, null, function (st, c, p) { P.close(st, 'neg_hard', 'offen'); P.open(st, 'quarrel', { why: 'neglect' }); }]] },
      c: { img: 'reconcile', s: '„Ich liebe dich. Ich will nur, dass wir uns nicht verlieren.“', o: [
        ['Ich dich auch.', 'Ihr haltet euch lange fest.', { partner: 3, well: 2 }, null, function (st) { P.mem(st, 'crisis_' + st.season, 'Ausgesprochen und versöhnt', 'unser ehrliches Gespräch nach der schwierigen Zeit'); }]] } } },
    { id: 'k04', cat: 'konflikt', trig: 'neg_hard', len: 'pers', cd: 0, when: function (c, p) { return p.time >= 60 && p.stage >= 4; }, nodes: {
      start: { img: 'conflict', s: '{n} hat eine Tasche gepackt: „Ich fahre übers Wochenende zu meiner Schwester. Ich brauche Abstand.“', o: [
        ['Bitte bleib. Lass uns reden.', '{n} stellt die Tasche ab. „Dann rede.“', { partner: 1 }, 'b'],
        ['Okay. Wenn du das brauchst.', '{n} geht. Die Wohnung ist still.', { partner: -2, stress: 3 }, null, function (st) { P.close(st, 'neg_hard', 'Abstand'); P.open(st, 'quarrel', { why: 'space' }); }]] },
      b: { img: 'reconcile', s: '„Ich will nicht, dass du alles aufgibst. Ich will nur vorkommen.“', o: [
        ['Ab jetzt plane ich uns mit ein – wie ein Training.', function (c, p) { return p.pers === 'humor' ? '„Mit Trainingsplan? Wie romantisch.“ Aber sie lächelt.'.replace('sie', '{n}') : '„Das klingt komisch, aber gut.“'; }, { partner: 5 }, null, function (st, c, p) { P.close(st, 'neg_hard', 'Versprechen'); P.open(st, 'promise_eve'); p.neg = 0; }]] } } },
    { id: 'k05', cat: 'konflikt', th: 'quarrel', thAge: 10, cd: 6, len: 'pers', onStart: closeTh('quarrel', 'versöhnt'), nodes: {
      start: { img: 'reconcile', s: function (c, p) { var w = p.th.quarrel && p.th.quarrel.d.why; return w === 'loss' ? '{n}: „Wegen neulich nach dem Spiel – ich war verletzt, dass du mich so abgewiesen hast.“' : w === 'ignored' ? '{n}: „Neulich wollte ich dir von meinem Tag erzählen, und du hattest keinen Kopf dafür.“' : '{n}: „Können wir über unseren Streit reden?“'; }, o: [
        ['Es tut mir leid. Das war unfair von mir.', { c_harmonie: '„Schon vergessen.“ Aber du merkst, wie erleichtert {n} ist.', c_direkt: '„Danke. Das musste raus.“', def: '„Danke, dass du das sagst.“' }, { partner: 4 }, 'b'],
        ['Ich war einfach fertig.', '„Ich weiß. Trotzdem.“', { partner: 1 }, 'b']] },
      b: { img: 'reconcile', s: '„Lass uns so etwas künftig früher klären.“', o: [
        ['Abgemacht.', 'Ihr umarmt euch.', { partner: 2, stress: -2 }],
        ['Und du sagst mir, wenn dich etwas stört.', { c_harmonie: '„Ich versuche es. Das fällt mir schwer.“', def: '„Deal.“' }, { partner: 2 }]] } } },
    { id: 'k06', cat: 'konflikt', th: 'quarrel', cd: 20, when: function (c, p) { return c.t - p.th.quarrel.t > 10; }, onStart: closeTh('quarrel', 'nachgeholt'), nodes: { start: { img: 'thought', s: '{n}: „Wir haben uns nie richtig ausgesprochen. Es hängt noch zwischen uns.“', o: [
      ['Dann jetzt. Ich fange an.', 'Es dauert, aber am Ende ist die Luft rein.', { partner: 4 }],
      ['Ist doch längst vorbei.', { c_rueck: '{n} nickt und zieht sich zurück. Vorbei ist es nicht.', def: '„Für dich vielleicht.“' }, { partner: -2 }, null, function (st, c, p) { p.neg += 2; }]] } } },
    { id: 'k07', cat: 'konflikt', th: 'promise_eve', cd: 12, when: function (c, p) { return c.t - p.th.promise_eve.t >= 5; }, onStart: function (st, c, p) { var kept = p.actT && p.actT > p.th.promise_eve.t; P.close(st, 'promise_eve', kept ? 'gehalten' : 'gebrochen'); p.th.promise_eve.d.kept = kept; }, nodes: { start: { img: 'reconcile', s: function (c, p) { return p.th.promise_eve.d.kept ? '{n}: „Du hast dein Versprechen gehalten. Unsere Abende tun mir so gut.“' : '{n}: „Du hattest versprochen, dir einen Abend pro Woche zu nehmen. Was ist daraus geworden?“'; }, o: [
      [function (c, p) { return p.th.promise_eve.d.kept ? 'Mir auch.' : 'Du hast recht. Ich fange heute an.'; }, function (c, p) { return p.th.promise_eve.d.kept ? '„Siehst du – geht doch.“' : '„Ich glaube dir – noch einmal.“'; }, { partner: 2 }, null, function (st, c, p) { if (!p.th.promise_eve.d.kept) { p.neg += 2; p.v -= 3; } }]] } } },
    { id: 'k08', cat: 'konflikt', cd: 80, when: function (c) { return c.pt.pub < 50 && c.cx.per.media > 60; }, nodes: { start: { img: 'conflict', s: '{n} hält dir das Handy hin: „Warum ist ein Foto von uns beiden in deiner Story? Ich wollte das nicht.“', o: [
      ['Du hast recht, ich lösche es.', '„Danke. Frag mich bitte vorher.“', { partner: 2 }],
      ['Es ist doch nur ein Foto.', { still: '„Für dich. Ich will mein Gesicht nicht überall sehen.“', def: '„Darum geht es nicht.“' }, { partner: -3 }, null, function (st) { P.open(st, 'quarrel', { why: 'photo' }); }]] } } },
    { id: 'k09', cat: 'konflikt', cd: 80, when: function (c) { return c.pt.stage >= 4 && c.cx.per.stress >= 60; }, nodes: { start: { img: 'conflict', s: '{n}: „Du lässt deinen Stress an mir aus. Ich bin nicht deine Mannschaft.“', o: [
      ['Entschuldige. Du hast recht.', '„Danke. Was ist los?“', { partner: 2, stress: -1 }],
      ['Ich bin nicht gestresst!', '{n} hebt die Augenbrauen. Schweigen.', { partner: -3 }, null, function (st) { P.open(st, 'quarrel', { why: 'stress' }); }]] } } },
    { id: 'k10', cat: 'konflikt', cd: 120, when: function (c) { return c.pc.fame >= 40; }, nodes: { start: { img: 'conflict', s: '{n}: „Diese Nachrichten von Fans auf deinem Handy – manche sind ziemlich direkt.“', o: [
      ['Lies sie ruhig. Ich habe nichts zu verbergen.', '{n} legt das Handy weg: „Ich will nicht kontrollieren. Ich wollte es nur sagen.“', { partner: 3 }],
      ['Das ist doch normal.', { temp: '„Normal? Herzchen von Fremden?“', def: '„Für dich vielleicht.“' }, { partner: -2 }]] } } },
    { id: 'k11', cat: 'konflikt', cd: 80, when: function (c) { return c.pt.stage >= 4; }, nodes: { start: { img: 'conflict', s: '{n}: „Deine Trainingssachen liegen überall. Ich bin nicht dein Zeugwart.“', o: [
      ['Sorry, ich räume sofort auf.', '„Danke.“ {n} grinst. „Zeugwart wäre auch ein schlechter Job.“', { partner: 2 }],
      ['Ich bin so müde nach dem Training.', '„Ich arbeite auch.“', { partner: -2 }]] } } },
    { id: 'k12', cat: 'konflikt', th: 'sunday', cd: 15, when: function (c, p) { return c.t - p.th.sunday.t >= 6; }, onStart: closeTh('sunday', 'vergessen'), nodes: { start: { img: 'conflict', s: '{n}: „Du hattest mir einen Sonntag versprochen. Das ist jetzt Wochen her.“', o: [
      ['Du hast recht. Diesen Sonntag, ganz sicher.', '„Ich verlasse mich drauf.“', { partner: 1 }, null, function (st) { P.open(st, 'sunday'); }],
      ['Es kam immer etwas dazwischen.', '„Bei dir kommt immer etwas dazwischen.“', { partner: -3 }, null, function (st, c, p) { p.neg += 2; }]] } } },
    { id: 'k13', cat: 'konflikt', cd: 100, when: function (c) { return c.pt.ld; }, nodes: { start: { img: 'conflict', s: '{n} am Telefon: „Du hast gestern nicht angerufen. Ich habe gewartet.“', o: [
      ['Tut mir leid, die Mannschaftssitzung ging lange.', '„Schreib mir dann wenigstens.“', { partner: 1 }],
      ['Ich kann nicht jeden Abend.', { c_direkt: '„Dann sag es vorher.“', def: '„Okay …“' }, { partner: -2 }]] } } },
    { id: 'k14', cat: 'konflikt', cd: 120, when: function (c) { return c.pt.stage >= 4 && c.carNew; }, nodes: { start: { img: 'conflict', s: function (c) { return c.carBuys >= 2 ? '{n}: „Schon wieder ein neues Auto? Wir wollten doch sparen.“' : '{n}: „Ein neues Auto – einfach so, ohne mit mir zu reden? Wir wollten doch sparen.“'; }, o: [
      ['Du hast recht. Ich hätte vorher mit dir reden sollen.', '„Danke. Beim nächsten Mal entscheiden wir das zusammen.“', { partner: 2 }],
      ['Es ist mein Geld.', { indep: '', c_direkt: '„Und unser Leben.“', def: '„Ja. Aber unsere Pläne.“' }, { partner: -3 }]] } } },
    { id: 'k15', cat: 'konflikt', cd: 60, when: function (c, p) { return p.v >= 55 && P.closed(p, 'quarrel'); }, nodes: { start: { img: 'reconcile', s: '{n}: „Ich finde, wir streiten besser als früher. Fairer.“', o: [
      ['Wir lernen eben dazu.', '„Ja. Das mag ich an uns.“', { partner: 3 }],
      ['Wir streiten?', { humor: '„Jeden Dienstag, wegen der Spülmaschine.“', def: '„Manchmal.“ {n} lacht.' }, { partner: 1 }]] } } }
  );

  // ======================= L. LEBENSEREIGNISSE & ENTSCHEIDUNGEN =======================
  A.push(
    { id: 'l01', cat: 'leben', len: 'gross', decision: true, title: 'Zusammenziehen?', ic: '🏠', ph: [4, 6], when: function (c, p) { return p.stage === 3 && !p.ld && c.t - (p.since || 0) >= 20; }, nodes: {
      start: { img: 'romantic', s: '„Du willst etwas mit mir besprechen?“ {n} sieht dich neugierig an.', o: [
        ['Ich möchte mit dir zusammenziehen.', function (c, p) { return p.indep >= 70 ? '„Wow. Ich liebe meine Wohnung … aber ich liebe dich mehr. Glaube ich.“' : '„Wirklich? Ich habe gehofft, dass du das fragst.“'; }, {}, 'b']] },
      b: { img: 'thought', s: '„Aber wo? Deine Wohnung ist praktisch für das Training, meine für die {place}.“', o: [
        ['Wir suchen etwas Neues, das für beide passt.', '„Das gefällt mir.“', { partner: 2 }, 'c'],
        ['Zieh einfach zu mir.', function (c, p) { return p.indep >= 60 ? '„Dann bin ich bei dir zu Gast. Lieber etwas Gemeinsames.“' : '„Okay. Das ist am einfachsten.“'; }, {}, 'c']] },
      c: { img: 'romantic', s: '„Dann … machen wir es?“', o: [
        ['Ja.', '…', {}, null, function (st, c, p) { if (ch(0.45 + (p.v - 55) / 45)) { p.stage = 4; p.stageT = tk(st); X.chron(st, 'familie', '🏠', 'Zusammengezogen', 'Mit ' + p.name + '.', 2); P.mem(st, 'movein', 'Zusammengezogen', 'unser Einzug'); return { r: '{n} fällt dir um den Hals. Ihr sucht eine gemeinsame Wohnung.', e: { partner: 5, well: 4 }, img: 'success' }; } return { r: '{n}: „Ich will es – aber noch nicht jetzt. Lass uns in ein paar Monaten nochmal reden.“', e: { partner: -1 }, img: 'thought' }; }]] } } },
    { id: 'l02', cat: 'leben', len: 'gross', decision: true, title: 'Heiratsantrag', ic: '💍', ph: [5, 10], when: function (c, p) { return p.stage === 4 && c.t - (p.stageT || 0) >= 30; }, nodes: {
      start: { img: 'romantic', s: 'Du hast einen Ring gekauft (4.000 €). Wo machst du den Antrag?', o: [
        ['Beim Abendessen, ganz klassisch.', 'Du stellst den Ring auf den Tisch.', {}, 'b'],
        ['An dem Ort von {mem}.', '{n} erkennt den Ort sofort.', { partner: 2 }, 'b'],
        ['Im leeren Stadion nach dem Training.', function (c, p) { return p.sport >= 55 ? '{n} ist überwältigt.' : '{n} schaut sich irritiert um – bis sie den Ring sieht.'.replace('sie', '{n}'); }, {}, 'b']] },
      b: { img: 'romantic', s: '„Willst du mich heiraten?“', o: [
        ['(Auf die Antwort warten)', '…', {}, null, function (st, c, p) { book(st, -4000); if (ch(0.45 + (p.v - 60) / 40 + (P.has(p, 'future') ? 0.1 : 0))) { p.stage = 5; p.stageT = tk(st); X.chron(st, 'familie', '💍', 'Verlobt', 'Mit ' + p.name + '.', 3); P.mem(st, 'proposal', 'Verlobung', 'dein Heiratsantrag', 'romantic'); return { r: '„Ja! Ja, natürlich!“ Unter Tränen und Lachen.', e: { partner: 8, well: 8, conf: 2 }, img: 'success' }; } return { r: '{n}: „Ich liebe dich – aber ich bin noch nicht so weit.“', e: { partner: -3, conf: -2 }, img: 'thought' }; }]] } } },
    { id: 'l03', cat: 'leben', len: 'gross', decision: true, title: 'Die Hochzeit planen', ic: '💒', ph: [8, 8], when: function (c, p) { return p.stage === 5 && c.t - (p.stageT || 0) >= 20; }, nodes: {
      start: { img: 'romantic', s: '{n}: „Lass uns die Hochzeit planen. Groß oder klein?“', o: [
        ['Klein, nur Familie und enge Freunde (ca. 8.000 €).', '„Perfekt. So, wie wir sind.“', {}, 'b', function (st, c, p, d) { d.wed = 8000; }],
        ['Groß, mit allen – auch der Mannschaft (ca. 25.000 €).', function (c, p) { return p.pub < 45 ? '„Mit Presse? Bitte nicht.“ Ihr einigt euch auf keine Fotos.' : '„Ein riesiges Fest! Ja!“'; }, { mates: 2 }, 'b', function (st, c, p, d) { d.wed = 25000; }]] },
      b: { img: 'thought', s: '„Und wann? In der Saison ist es schwierig.“', o: [
        ['In der Sommerpause.', '„Dann haben wir auch Zeit für die Flitterwochen.“', {}, null, function (st, c, p, d) { book(st, -Math.round((d.wed || 15000) * (c.hb ? 0.6 : 1))); p.stage = 6; p.stageT = tk(st); X.chron(st, 'familie', '💒', 'Hochzeit', 'Ihr habt geheiratet.', 3); P.mem(st, 'wedding', 'Hochzeit', 'unsere Hochzeit', 'success'); return { r: 'Die Hochzeit wird ein unvergesslicher Tag.', e: { partner: 6, well: 10, family: 5 }, img: 'success' }; }]] } } },
    { id: 'l04', cat: 'leben', len: 'gross', decision: true, title: 'Familienplanung', ic: '👶', ph: [6, 10], when: function (c, p) { return p.stage >= 4 && c.age >= 22 && !c.life.planKids && !c.life.preg; }, nodes: {
      start: { img: 'thought', s: '{n}: „Du wolltest über Kinder reden?“', o: [
        ['Ich wünsche mir eine Familie mit dir.', function (c, p) { return p.kids >= 60 ? '{n} strahlt: „Ich auch. Schon lange.“' : p.kids >= 40 ? '„Ich auch – aber ich habe auch Angst davor.“' : '„Ich sehe mich ehrlich gesagt nicht als Elternteil. Zumindest jetzt nicht.“'; }, {}, 'b'],
        ['Was denkst du über Kinder?', function (c, p) { return p.kids >= 50 ? '„Ich wünsche mir welche. Und du?“' : '„Ich bin mir unsicher.“'; }, {}, 'b']] },
      b: { img: 'thought', s: '„Und deine Karriere? Die vielen Reisen?“', o: [
        ['Wir teilen uns das. Ich bin da.', '…', {}, null, function (st, c, p) { if (p.kids >= 45) { L.life(st).planKids = true; P.mem(st, 'family_plan', 'Gemeinsame Familienplanung', 'unsere Entscheidung für ein Kind'); return { r: '{n}: „Dann lass es uns versuchen.“', e: { partner: 5 }, img: 'romantic' }; } p.kids += 6; return { r: '{n}: „Lass mir noch Zeit. Vielleicht später.“', e: {}, img: 'thought' }; }],
        ['Vielleicht nach der Karriere.', '„Das ist vernünftig.“', { partner: 1 }]] } } },
    { id: 'l05', cat: 'leben', len: 'pers', decision: true, title: 'Über die Zukunft reden', ic: '🔭', ph: [4, 7], once: true, when: function (c, p) { return c.t - (p.since || 0) >= 12 && !P.has(p, 'future'); }, nodes: {
      start: { img: 'thought', s: '{n}: „Wo siehst du uns in fünf Jahren?“', o: [
        ['Zusammen. Irgendwo, wo wir beide glücklich sind.', '„Das klingt schön.“', { partner: 3 }, 'b'],
        ['Ehrlich: Ich denke nur bis zur nächsten Saison.', { ehrgeiz: '„Verstehe ich. Aber ich denke weiter.“', def: '„Okay …“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Was ist dir dabei am wichtigsten?“', o: [
        ['Dass wir beide unsere Ziele leben können.', '„Auch {goal}?“ – „Gerade das.“', { partner: 3 }, null, function (st) { P.mem(st, 'future', 'Gemeinsame Zukunft besprochen', 'unser Gespräch über die Zukunft'); }],
        ['Eine Familie.', function (c, p) { return p.kids >= 50 ? '„Das wünsche ich mir auch.“' : '„Darüber müssen wir noch reden.“'; }, { partner: 1 }, null, function (st) { P.mem(st, 'future', 'Gemeinsame Zukunft besprochen', 'unser Gespräch über die Zukunft'); }],
        ['Erfolg.', '„Und wir?“', { partner: -1 }, null, function (st) { P.mem(st, 'future', 'Gemeinsame Zukunft besprochen', 'unser Gespräch über die Zukunft'); }]] } } },
    { id: 'l06', cat: 'leben', len: 'pers', cd: 300, when: function (c) { return !!c.life.preg; }, nodes: {
      start: { img: 'success', s: '{n} hält dir ein Ultraschallbild hin: „Schau mal. Das ist unser Kind.“', o: [
        ['Ich bin sprachlos.', '{n} lacht und weint gleichzeitig.', { partner: 3, well: 3 }, 'b']] },
      b: { img: 'thought', s: '„Bist du bei der Geburt dabei – auch wenn ein Spiel ist?“', o: [
        ['Auf jeden Fall. Das kläre ich mit dem Verein.', '„Danke.“', { partner: 3, coach: -1 }, null, function (st) { P.open(st, 'birth_promise'); }],
        ['Ich versuche es.', '„Versuch es sehr.“', { partner: 1 }]] } } },
    { id: 'l07', cat: 'leben', cd: 300, when: function (c) { return c.life.newborn && c.t - c.life.newborn <= 4; }, nodes: { start: { img: 'success', s: '{n} hält {kid} im Arm: „Schau, wie klein die Hände sind.“', o: [
      ['Ich habe nie etwas Schöneres gesehen.', '{n} lehnt sich an dich. Ihr seid eine Familie.', { partner: 3, family: 5, well: 5 }, null, function (st) { P.mem(st, 'birth_' + st.season, 'Geburt von ' + P.fill('{kid}', P.ctx(st)), 'die Geburt von ' + P.fill('{kid}', P.ctx(st)), 'success'); }],
      ['Ich habe Angst, etwas falsch zu machen.', '„Ich auch. Wir lernen das zusammen.“', { partner: 3, family: 3 }]] } } },
    { id: 'l08', cat: 'leben', cd: 50, when: function (c) { return !!c.kid && c.season; }, nodes: { start: { img: 'relaxed', s: '{n}: „{kid} will unbedingt zu deinem nächsten Spiel. Mit Trikot und allem.“', o: [
      ['Dann besorge ich Karten für euch beide.', '„{kid} wird ausflippen.“', { family: 3, partner: 1 }],
      ['Ist das nicht zu laut im Stadion?', '„Mit Ohrenschützern geht das.“', { family: 1 }]] } } },
    { id: 'l09', cat: 'leben', cd: 40, ph: [4, 10], when: function (c, p) { var y = c.st.season - (p.sinceS || c.st.season); return y >= 1 && c.wk === ((p.since || 0) % 30) + 1; }, nodes: { start: { img: 'romantic', s: '{n}: „Weißt du, welcher Tag heute ist? {yrs} Jahr(e) wir beide.“', o: [
      ['Natürlich. Ich habe einen Tisch reserviert.', '{n} ist gerührt.', { partner: 4 }, null, function (st) { book(st, -150); }],
      ['Oh nein … ich habe es vergessen.', { humor: '„Ich weiß. Ich habe dir gestern einen Zettel an den Spiegel geklebt.“', c_offen: '„Ernsthaft?“ Enttäuschung.', def: '„Schon gut. Aber nächstes Jahr nicht.“' }, { partner: -2 }],
      ['Weißt du noch, {mem}?', '„Natürlich. Mein liebster Moment.“', { partner: 3 }]] } } },
    { id: 'l10', cat: 'leben', len: 'pers', decision: true, title: 'Eigenes Zuhause kaufen', ic: '🏡', cd: 300, ph: [7, 10], when: function (c, p) { return p.stage >= 4 && !p.ld && c.money >= 150000 && !P.has(p, 'house'); }, nodes: {
      start: { img: 'thought', s: '{n}: „Mieten wir eigentlich ewig? Ich träume von einem Garten.“', o: [
        ['Lass uns ein Haus anschauen.', '„Wirklich? Jetzt?“', { partner: 2 }, 'b'],
        ['Erst wenn klar ist, wo ich langfristig spiele.', '„Vernünftig. Leider.“', {}]] },
      b: { img: 'success', s: '„Und wenn du wechselst?“', o: [
        ['Dann vermieten wir es. Es ist unser Zuhause.', 'Ihr unterschreibt beim Notar.', { partner: 5, well: 3 }, null, function (st, c, p) { var amt = Math.round(Math.min(c.money * 0.4, 400000) / 1000) * 1000; book(st, -amt, 'Immobilien'); P.mem(st, 'house', 'Erstes eigenes Zuhause', 'unser Haus mit dem Garten', 'success'); if (R.pf && R.pf.ensure(st).assets) { try { R.pf.ensure(st).assets.push({ k: 'home', n: 'Eigenes Haus', v: amt }); } catch (er) {} } return { r: 'Ihr kauft ein Haus mit Garten (Eigenanteil ' + R.fmtMoney(amt) + '). {n} plant schon die Beete.' }; }],
        ['Lass uns doch noch warten.', '„Okay.“', {}]] } } },
    { id: 'l11', cat: 'leben', cd: 300, once: true, when: function (c, p) { return p.stage >= 4 && P.has(p, 'house') === false && c.t - (p.stageT || 0) >= 40; }, nodes: { start: { img: 'relaxed', s: '{n}: „Was hältst du von einem Hund?“', o: [
      ['Ja! Ich gehe morgens mit ihm laufen.', 'Eine Woche später zieht ein Welpe ein.', { partner: 3, well: 3 }, null, function (st) { P.mem(st, 'dog', 'Ein Hund zieht ein', 'als unser Hund eingezogen ist'); book(st, -900); }],
      ['Mit meinem Reiseplan? Schwierig.', '„Stimmt. Vielleicht später.“', {}]] } } },
    { id: 'l12', cat: 'leben', cd: 120, when: function (c) { return c.pt.stage >= 3; }, nodes: { start: { img: 'relaxed', s: '{n}: „Meine Eltern kommen am Wochenende zu Besuch. Sie wollen dich spielen sehen.“', o: [
      ['Ich besorge Ehrenplätze.', '{n}s Eltern sind begeistert – und stolz.', { partner: 3, family: 2 }],
      ['Hoffentlich spiele ich dann.', '„Sie kommen wegen dir, nicht wegen der Aufstellung.“', { partner: 1 }]] } } },
    { id: 'l13', cat: 'leben', cd: 300, ph: [8, 10], when: function (c, p) { return p.stage >= 6 && c.st.season - (p.sinceS || c.st.season) >= 4; }, nodes: { start: { img: 'romantic', s: '{n} blättert im Fotoalbum: „Schau, wie jung wir waren.“', o: [
      ['Und du bist immer noch die schönste Person im Raum.', '„Charmeur.“ {n} lächelt.', { partner: 3 }],
      ['{mem} – das Foto liebe ich.', '„Ich auch.“', { partner: 3 }]] } } },
    { id: 'l14', cat: 'leben', len: 'pers', cd: 300, when: function (c, p) { return c.age >= 33 && p.stage >= 4; }, nodes: {
      start: { img: 'thought', s: '{n}: „Wenn du mal aufhörst – was dann? Ich will mitplanen.“', o: [
        ['Ich möchte in den Trainerbereich.', '„Dann wieder viel unterwegs?“', {}, 'b'],
        ['Ruhe. Und Zeit für dich.', '„Das klingt wie ein Traum.“', { partner: 3 }, 'b']] },
      b: { img: 'thought', s: '„Ich habe für meinen Job auch Pläne. {goal}.“', o: [
        ['Dann bist du dran. Ich halte dir den Rücken frei.', '{n} ist gerührt: „Das hat noch niemand zu mir gesagt.“', { partner: 4 }, null, function (st) { P.mem(st, 'after_plan', 'Pläne für die Zeit danach', 'unsere Pläne für die Zeit nach deiner Karriere'); }],
        ['Wir finden einen Weg für beide.', '„Ja.“', { partner: 2 }]] } } },
    { id: 'l15', cat: 'leben', th: 'birth_promise', onStart: closeTh('birth_promise'), when: function (c) { return !c.life.preg && c.life.newborn && c.t - c.life.newborn <= 6; }, nodes: { start: { img: 'success', s: '{n}: „Du warst wirklich bei der Geburt dabei. Das werde ich nie vergessen.“', o: [
      ['Kein Spiel der Welt war wichtiger.', 'Ein Satz, den {n} noch Jahre später erzählt.', { partner: 4, family: 3 }]] } } }
  );
  P.add(A);
})(RFM);
