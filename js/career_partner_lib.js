// Privatleben 2.0 – Gesprächsbibliothek Teil 1: Alltag (30) und Sport (30).
// Format je Gespräch: { id, cat, len: kurz|pers|gross, ph: [von, bis] (Beziehungsphase 1–10), when(c, p), rel(c, p), cd (Wochen),
// once, th (offene Geschichte nötig), trig (Anlass), act (Aktivität), nodes: { start: { s, img, o: [[Antwort, Reaktion, Wirkung, weiter, fx, req, Hinweis]] } } }
// Texte nutzen Variablen ({n} Name, {job}, {hob}, {club}, {opp}, {res}, {coach}, {mem} Erinnerung …) und Persönlichkeitsvarianten.
(function (R) {
  var L = R.life, P = L && L.pt, X = R.cx, C = R.pc; if (!P) return;
  function tk(st) { return st.tick || 0; }
  var A = [];
  // ======================= A. ALLTAG (kurz, 1–2 Runden) =======================
  A.push(
    { id: 'a01', cat: 'alltag', when: function (c) { return c.season; }, nodes: { start: { img: 'relaxed', s: { fan: '{n}: „Und? Wie war das Training? Habt ihr wieder Standards geübt?“', def: '{n}: „Na, wie war dein Tag auf dem Platz?“' }, o: [
      ['Anstrengend, aber gut.', { humor: '„Also wie immer. Dann gibt es heute Nudeln – Kohlenhydrate für den Helden.“', def: '„Dann ruh dich aus. Ich mach uns was zu essen.“' }, { stress: -1 }],
      ['Der Trainer war heute unzufrieden.', { fan: '„Mit dir oder mit allen? Erzähl!“ {n} will jedes Detail hören.', def: '„Das klingt nach einem langen Tag. Willst du darüber reden oder lieber abschalten?“' }, { partner: 1 }],
      ['Erzähl lieber von deinem Tag.', '{n} erzählt von der {place} – du hörst zu und merkst, wie gut dir das tut.', { partner: 2, stress: -1 }]] } } },
    { id: 'a02', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Ich hatte heute einen verrückten Tag in der {place}.“', o: [
      ['Was ist passiert?', { ehrgeiz: '„Ich habe endlich das Projekt durchbekommen, für das ich seit Wochen kämpfe.“', humor: '„Lange Geschichte mit einem Drucker, einer Kollegin und sehr viel Kaffee.“', def: '„Nichts Dramatisches – nur viel auf einmal. Aber ich habe es geschafft.“' }, { partner: 2 }],
      ['Bei mir war es auch chaotisch.', '„Dann haben wir uns beide ein ruhiges Sofa verdient.“', { stress: -1 }],
      ['Hm. Ich bin gerade ziemlich müde.', { c_offen: '„Okay. Aber ich hätte mich gefreut, wenn du kurz nachfragst.“', c_harmonie: '„Kein Problem.“ {n} lächelt – ein bisschen zu schnell.', def: '„Schon gut. Morgen erzähle ich es dir.“' }, { partner: -1 }]] } } },
    { id: 'a03', cat: 'alltag', when: function (c) { return c.season && c.wk % 2 === 0; }, nodes: { start: { img: 'relaxed', s: '{n}: „Was machen wir am Wochenende? Du spielst doch {opp2}.“'.replace('{opp2}', 'erst am Samstag'), o: [
      ['Nach dem Spiel essen gehen?', '„Abgemacht – du suchst aus, ich reserviere.“', { partner: 2 }],
      ['Sonntag gehört dir.', { herz: '„Wirklich? Dann plane ich etwas Schönes.“', def: '„Ich nehme dich beim Wort.“' }, { partner: 3 }, null, function (st) { P.open(st, 'sunday'); }],
      ['Ich brauche nach dem Spiel Ruhe.', '„Verstehe. Dann ein gemütlicher Abend zu Hause.“', { stress: -1 }]] } } },
    { id: 'a04', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n} steht vor dem Kühlschrank: „Was kochen wir heute?“', o: [
      ['Ich koche – etwas Leichtes.', { humor: '„Du? Ich hole schon mal den Feuerlöscher.“ Am Ende schmeckt es sogar.', def: '„Gern! Ich decke den Tisch.“' }, { partner: 2 }],
      ['Lass uns etwas bestellen.', '„Gute Idee. Ernährungsplan hin oder her.“', { well: 1 }],
      ['Der Ernährungsplan sagt: Fisch und Gemüse.', { fan: '„Profi durch und durch. Ich esse einfach mit.“', nofan: '„Dein Plan, nicht meiner. Ich nehme Pizza.“' }, { fit: 1 }]] } } },
    { id: 'a05', cat: 'alltag', when: function (c) { return c.cx.per.stress > 55; }, rel: function () { return 2; }, nodes: { start: { img: 'thought', s: '{n} sieht dich an: „Du bist heute ganz woanders. Alles okay?“', o: [
      ['Nur viel im Kopf. Danke, dass du fragst.', '„Ich bin da, wenn du reden willst.“ Allein das hilft.', { stress: -2, partner: 1 }],
      ['Lass uns einfach abschalten.', '„Serie und Decke? Ich bin dabei.“', { stress: -2 }],
      ['Alles gut.', { c_offen: '„Das glaube ich dir nicht ganz – aber ich dränge nicht.“', def: '„Okay.“' }, {}]] } } },
    { id: 'a06', cat: 'alltag', when: function (c) { return c.winter || c.summer; }, nodes: { start: { img: 'relaxed', s: { def: '{n}: „Endlich mal keine Spiele am Wochenende. Was fangen wir mit der Zeit an?“' }, o: [
      ['Ausschlafen. Ganz lange.', '„Bester Plan seit Wochen.“', { stress: -2, well: 1 }],
      ['Deine Freunde wollten uns doch sehen.', '„Stimmt! Die werden sich freuen.“', { partner: 2 }],
      ['Ich will an meiner Fitness arbeiten.', { ehrgeiz: '„Verstehe ich. Ich gehe mit laufen.“', def: '„Auch in der Pause? Na gut – aber abends gehörst du mir.“' }, { fit: 1 }]] } } },
    { id: 'a07', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe angefangen, {hob} wieder ernster zu nehmen.“', o: [
      ['Erzähl mal, was machst du gerade?', '{n} erzählt mit leuchtenden Augen. Du lernst eine neue Seite kennen.', { partner: 3 }, null, function (st) { P.mem(st, 'hobby_' + st.season, '{n} und {hob}', 'als du mir von deinem Hobby erzählt hast'); }],
      ['Darf ich mal mitkommen?', { still: '„Wirklich? Das würde mich freuen – auch wenn ich mich anfangs komisch fühle.“', def: '„Klar! Aber nicht lachen.“' }, { partner: 3 }],
      ['Schön für dich.', '„Ja …“ Das Gespräch versandet.', { partner: -1 }]] } } },
    { id: 'a08', cat: 'alltag', when: function (c) { return c.pt.stage >= 4; }, nodes: { start: { img: 'relaxed', s: '{n}: „Wer ist eigentlich diese Woche mit Einkaufen dran?“', o: [
      ['Ich, nach dem Training.', '„Danke! Vergiss die Milch nicht.“', { partner: 1 }],
      ['Lass uns zusammen gehen.', '„Ein Date im Supermarkt – romantisch.“', { partner: 2 }],
      ['Ich habe echt keine Zeit.', { c_direkt: '„Du hast nie Zeit. Ich mache es – aber das merke ich mir.“', def: '„Dann mache ich es eben.“' }, { partner: -2 }]] } } },
    { id: 'a09', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Hast du heute schon was von deiner Familie gehört?“', o: [
      ['Ich rufe sie gleich an.', '„Grüß schön!“', { family: 1 }],
      ['Meine Mutter fragt ständig nach dir.', { herz: '„Ach, wie süß. Wir sollten sie bald besuchen.“', still: '„Oh. Das ist … nett.“ {n} wird ein bisschen rot.', def: '„Dann sag ihr liebe Grüße.“' }, { partner: 1, family: 1 }],
      ['Nein, schon länger nicht.', '„Melde dich mal wieder. Familie ist wichtig.“', {}]] } } },
    { id: 'a10', cat: 'alltag', when: function (c) { return c.sp.fresh && c.sp.win; }, rel: function () { return 1.5; }, nodes: { start: { img: 'success', s: { fan: '{n}: „{res} gegen {opp}! Ich habe die Zusammenfassung dreimal geschaut.“', def: '{n}: „Ihr habt gewonnen, oder? Du strahlst so.“' }, o: [
      ['Ein gutes Gefühl!', '„Genieß es. Das hast du dir verdient.“', { well: 2 }],
      ['Nächste Woche zählt schon wieder.', { ehrgeiz: '„Typisch du. Aber heute Abend wird gefeiert.“', def: '„Immer der Profi. Heute darfst du dich freuen.“' }, { disc: 1 }],
      ['Darauf stoßen wir an.', '„Ein Glas. Du hast ja morgen Training.“', { partner: 2 }]] } } },
    { id: 'a11', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe eine Serie gefunden, die wir zusammen anfangen könnten.“', o: [
      ['Worum geht es?', { humor: '„Um Menschen, die schlechter kochen als du.“ Ihr lacht.', def: '„Ein Krimi. Spannend, aber nicht zu düster.“' }, { partner: 1 }],
      ['Heute Abend die erste Folge!', '„Abgemacht.“', { partner: 2, stress: -1 }],
      ['Ich schaue lieber Spielanalysen.', { fan: '„Dann schauen wir die zusammen. Ich will lernen.“', nofan: '„Du arbeitest sogar abends. Okay …“' }, {}]] } } },
    { id: 'a12', cat: 'alltag', when: function (c) { return c.load >= 3; }, nodes: { start: { img: 'thought', s: '{n}: „Du trainierst gerade wahnsinnig viel. Schläfst du genug?“', o: [
      ['Ehrlich gesagt nicht.', '„Dann heute Handy weg und um zehn ins Bett.“', { stress: -2, fit: 1 }],
      ['Das gehört dazu.', { c_offen: '„Ich mache mir trotzdem Sorgen. Pass auf dich auf.“', def: '„Wenn du meinst.“' }, {}],
      ['Danke, dass du darauf achtest.', '„Einer muss es ja tun.“', { partner: 2 }]] } } },
    { id: 'a13', cat: 'alltag', when: function (c) { return c.pt.stage >= 4; }, nodes: { start: { img: 'relaxed', s: '{n}: „Ich würde gern das Wohnzimmer umstellen. Hilfst du mir am freien Tag?“', o: [
      ['Klar, ich trage die schweren Sachen.', '„Mein Held mit Muskeln.“ Am Ende sieht es richtig gut aus.', { partner: 2 }],
      ['Mach ruhig, wie du willst.', { indep: '', def: '„Okay. Aber beschwer dich nicht, wenn das Sofa woanders steht.“' }, {}],
      ['Ich habe am freien Tag Regeneration.', '„Schon gut, dann frage ich meinen Bruder.“', { partner: -1 }]] } } },
    { id: 'a14', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n} hält dir das Handy hin: „Schau mal, wer Geburtstag hat – sollen wir zusammen ein Geschenk besorgen?“', o: [
      ['Gute Idee, such du aus.', '„Wie immer.“ {n} grinst.', { partner: 1 }],
      ['Ich kümmere mich darum.', '„Wirklich? Dann bin ich gespannt.“', { partner: 2 }],
      ['Mir fällt nie was ein.', { humor: '„Deshalb hast du ja mich.“', def: '„Dann überlegen wir gemeinsam.“' }, {}]] } } },
    { id: 'a15', cat: 'alltag', when: function (c) { return c.st.phase === 'season' && c.sp.fresh === false; }, nodes: { start: { img: 'relaxed', s: '{n}: „Bist du nervös wegen des Spiels am Wochenende?“', o: [
      ['Ein bisschen.', { fan: '„Gegen die Mannschaft? Verständlich. Aber ihr seid in Form.“', def: '„Das ist doch normal. Das zeigt, dass es dir wichtig ist.“' }, { stress: -1 }],
      ['Nein, ich bin bereit.', '„So gefällst du mir.“', { conf: 1 }],
      ['Lass uns über etwas anderes reden.', '„Gern. Wie wäre es mit Urlaubsplänen?“', {}]] } } },
    { id: 'a16', cat: 'alltag', when: function (c) { return c.pt.stage >= 3; }, nodes: { start: { img: 'romantic', s: '{n} schreibt dir zwischen zwei Terminen: „Ich denke gerade an dich.“', o: [
      ['Ich auch an dich.', '{n} schickt ein Herz zurück.', { partner: 2, well: 1 }],
      ['Ein Foto vom Trainingsplatz zurückschicken.', { fan: '„Ich will dabei sein!“', def: '„Viel Rasen, wenig du – aber süß.“' }, { partner: 1 }],
      ['Später antworten.', 'Die Nachricht bleibt bis zum Abend ungelesen.', {}]] } } },
    { id: 'a17', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Meine Freundin Jule fragt, ob wir nächste Woche zum Grillen kommen.“', o: [
      ['Gern, wenn kein Spiel ist.', '„Ich schaue in deinen Spielplan – ja, passt.“', { partner: 2 }],
      ['Geh du ruhig, ich komme später nach.', { indep: '', def: '„Okay. Aber wirklich kommen!“' }, {}],
      ['Ich bin bei deinen Freunden immer der Fußballer.'.replace('Fußballer', 'Profi'), { herz: '„Für sie bist du einfach du. Versprochen.“', def: '„Dann erzähl halt mal nichts vom Sport.“' }, { partner: 1 }]] } } },
    { id: 'a18', cat: 'alltag', when: function (c) { return !c.summer; }, nodes: { start: { img: 'relaxed', s: '{n}: „Du warst auf der Auswärtsfahrt lange weg. Wie war das Hotel?“', o: [
      ['Langweilig. Ich habe dich vermisst.', '„Ich dich auch. Die Wohnung war so still.“', { partner: 3 }],
      ['Gut, wir hatten viel Spaß im Team.', '„Schön! Erzähl, wer hat wieder Karten verloren?“', { mates: 1 }],
      ['Erzähle ich dir morgen.', '„Okay, schlaf gut.“', {}]] } } },
    { id: 'a19', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe ein neues Rezept entdeckt – {hob} hin oder her, heute probieren wir das.“', o: [
      ['Ich helfe beim Schnippeln.', '„Teamarbeit. Wie bei euch.“ Es wird lecker.', { partner: 2 }],
      ['Ich bin gespannt.', '„Zu Recht.“', { partner: 1 }],
      ['Hoffentlich passt das in meinen Ernährungsplan.', { c_direkt: '„Ernsthaft? Ich koche für dich und du rechnest Kalorien?“', def: '„Ich habe schon darauf geachtet.“' }, {}]] } } },
    { id: 'a20', cat: 'alltag', when: function (c) { return c.pt.pub < 45 && c.pc.fame > 20; }, nodes: { start: { img: 'thought', s: '{n}: „Heute hat mich jemand im Supermarkt erkannt, weil ich mit dir auf einem Foto war.“', o: [
      ['Das tut mir leid. War es unangenehm?', '„Ein bisschen. Aber nett gemeint.“', { partner: 2 }],
      ['Daran gewöhnt man sich.', { still: '„Ich will mich nicht daran gewöhnen müssen.“', def: '„Vielleicht. Aber nicht so schnell.“' }, { partner: -1 }],
      ['Ich achte mehr darauf, was ich poste.', '„Danke. Das bedeutet mir viel.“', { partner: 3, media: -1 }]] } } },
    { id: 'a21', cat: 'alltag', when: function (c) { return c.pt.stage >= 4; }, nodes: { start: { img: 'relaxed', s: '{n}: „Die Nachbarn haben gefragt, ob du ihrem Sohn ein Trikot signierst.“', o: [
      ['Na klar, ich bringe eins mit.', '„Er wird ausflippen.“ Ein kleiner Moment, der Freude macht.', { f_fam: 1, partner: 1 }],
      ['Ich mache gleich ein Foto mit ihm.', '„Du bist so lieb.“', { partner: 2, f_fam: 1 }],
      ['Ich will zu Hause eigentlich nicht der Profi sein.', '„Verstehe ich. Ich sage ihnen, du bist im Stress.“', {}]] } } },
    { id: 'a22', cat: 'alltag', when: function (c) { return c.st.phase === 'season'; }, nodes: { start: { img: 'relaxed', s: '{n}: „Wann ist eigentlich die nächste Auswärtsfahrt? Ich will das Wochenende planen.“', o: [
      ['Ich schick dir gleich den Spielplan.', '„Perfekt. Dann trage ich mir alles ein.“', { partner: 1 }],
      ['Komm doch mal mit zu einem Auswärtsspiel!', '„Echt? Gern – das wollte ich schon immer mal.“', { partner: 2 }],
      ['Erst mal kommen zwei Heimspiele.', { fan: '„Super, dann bin ich im Stadion!“', def: '„Schön, dann bist du öfter zu Hause.“' }, { partner: 1 }]] } } },
    { id: 'a23', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Erinnerst du dich an {mem}? Ich habe heute daran gedacht.“', o: [
      ['Wie könnte ich das vergessen.', '{n} lächelt. Für einen Moment ist der Alltag weit weg.', { partner: 3 }],
      ['Das sollten wir wiederholen.', '„Unbedingt. Ich nehme dich beim Wort.“', { partner: 2 }],
      ['Ehrlich gesagt nur noch dunkel.', { c_offen: '„Echt jetzt? Das war mir wichtig.“', def: '„Schade.“' }, { partner: -2 }]] } }, when: function (c, p) { return !!P.memRef(p, 8, c.t); } },
    { id: 'a24', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe gelesen, Sportler sollen Mittagsschlaf machen. Machst du das?“', o: [
      ['Jeden Tag, 30 Minuten.', '„Neid. In der {place} geht das nicht.“', {}],
      ['Selten. Sollte ich öfter.', '„Ich erinnere dich.“', { fit: 1 }],
      ['Woher weißt du das?', { fan: '„Ich lese alles über Sport, schon vergessen?“', def: '„Ich interessiere mich eben für dein Leben.“' }, { partner: 2 }]] } } },
    { id: 'a25', cat: 'alltag', when: function (c) { return c.money > 30000; }, nodes: { start: { img: 'relaxed', s: '{n}: „Sollen wir uns mal ein neues Sofa gönnen? Das alte quietscht.“', o: [
      ['Ja, such eins aus – ich zahle.', { indep: '', def: '„Wir teilen. Ich will nicht, dass du alles bezahlst.“' }, { partner: 1 }, null, function (st) { if (R.pf) R.pf.book(st, -600, 'Freizeit & Privatleben'); }],
      ['Lass uns zusammen schauen.', '„Ein Samstag im Möbelhaus. Herausforderung angenommen.“', { partner: 2 }],
      ['Das geht doch noch.', '„Für dich vielleicht.“', {}]] } } },
    { id: 'a26', cat: 'alltag', when: function (c) { return c.kid; }, nodes: { start: { img: 'relaxed', s: '{n}: „{kid} hat heute nach dir gefragt.“', o: [
      ['Ich lese heute die Gutenachtgeschichte.', '„{kid} wird sich freuen.“', { family: 2, partner: 1 }],
      ['Ich vermisse die Kleine/den Kleinen auch.'.replace('die Kleine/den Kleinen', 'unser Kind'), '„Dann nimm dir am Wochenende Zeit.“', { family: 1 }],
      ['Ich bin zu kaputt heute.', { c_direkt: '„Du bist oft zu kaputt.“', def: '„Morgen dann.“' }, { family: -1 }]] } } },
    { id: 'a27', cat: 'alltag', nodes: { start: { img: 'relaxed', s: '{n}: „Musik an beim Kochen – was willst du hören?“', o: [
      ['Deine Playlist.', '„Gute Wahl.“ {n} tanzt durch die Küche.', { partner: 2, well: 1 }],
      ['Die Kabinenmusik vom Team.', { humor: '„Bitte nicht schon wieder dieser Song.“ Ihr lacht beide.', def: '„Na gut, aber nur drei Lieder.“' }, { mates: 1 }],
      ['Lieber Ruhe.', '„Okay.“', {}]] } } },
    { id: 'a28', cat: 'alltag', when: function (c) { return c.st.phase === 'season' && c.wk >= 10; }, nodes: { start: { img: 'thought', s: '{n}: „Weißt du schon, wann eure Sommerpause genau anfängt? Ich muss Urlaub beantragen.“', o: [
      ['Ich schaue gleich nach.', '„Danke. Ich will diesmal frühzeitig planen.“', { partner: 1 }, null, function (st) { P.open(st, 'vacplan'); }],
      ['Plan ruhig, ich richte mich nach dir.', { ehrgeiz: '„Endlich mal so herum. Gefällt mir.“', def: '„Lieb von dir.“' }, { partner: 2 }],
      ['Kommt auf die Vorbereitung an.', '„Wie immer. Okay.“', { partner: -1 }]] } } },
    { id: 'a29', cat: 'alltag', when: function (c) { return c.pc.fame > 35; }, nodes: { start: { img: 'relaxed', s: '{n}: „In der Zeitung steht heute etwas über dich. Willst du es lesen?“', o: [
      ['Lies es mir vor.', { fan: '{n} liest – mit kommentierenden Zwischenrufen.', def: '{n} liest und schaut dich dann an: „Die schreiben, als würden sie dich kennen.“' }, { partner: 1 }],
      ['Nein, ich lese so etwas nicht.', '„Gut so.“', { stress: -1 }],
      ['Steht da was über uns?', { still: '„Zum Glück nicht.“', def: '„Nein. Nur Sport.“' }, {}]] } } },
    { id: 'a30', cat: 'alltag', nodes: { start: { img: 'romantic', s: '{n}: „Weißt du, was mir heute klar geworden ist? Ich bin gern mit dir zusammen.“', o: [
      ['Ich auch mit dir.', 'Ein stiller, guter Moment.', { partner: 3, well: 2 }],
      ['Wie kommst du gerade darauf?', '„Einfach so. Muss es immer einen Grund geben?“', { partner: 1 }],
      ['Du bist heute aber sentimental.', { temp: '„Und du heute aber charmant.“ {n} wirft ein Kissen.', def: '„Darf ich doch.“' }, {}]] } }, when: function (c) { return c.pt.v >= 60; } }
  );

  // ======================= S. SPORT (Anlass aus der Karriere) =======================
  A.push(
    { id: 's01', cat: 'sport', trig: 'goal', len: 'kurz', cd: 6, nodes: { start: { img: 'success', s: { fan: '{n} springt dir entgegen: „Das {res} gegen {opp}! Und dein Treffer – ich habe auf der Couch geschrien!“', nofan: '{n}: „Du hast getroffen? Ich habe es nur auf dem Handy gesehen – aber du siehst so glücklich aus.“', def: '{n}: „Glückwunsch! Ein Tor und ein Sieg – was für ein Tag.“' }, o: [
      ['Ich kann es selbst kaum glauben!', '„Glaub es. Du hast so hart dafür gearbeitet.“', { partner: 2, well: 2 }],
      ['Ohne die Mannschaft wäre das nicht gegangen.', { fan: '„Bescheiden wie immer. Die Vorlage war aber auch stark.“', def: '„Das ist so typisch du.“ {n} lächelt.' }, { mates: 1, partner: 1 }],
      ['Darauf sollten wir heute Abend anstoßen.', '„Ich habe schon etwas kalt gestellt.“', { partner: 2 }],
      ['Nächste Woche wartet schon das nächste Spiel.', { ehrgeiz: '„So ist es. Aber fünf Minuten Freude sind erlaubt.“', def: '„Heute ist heute. Freu dich doch mal.“' }, { disc: 1 }]] } } },
    { id: 's02', cat: 'sport', trig: 'goal', len: 'kurz', cd: 10, when: function (c) { return c.pt.sport >= 55; }, nodes: { start: { img: 'success', s: '{n}: „Erzähl mir, wie du das Tor gesehen hast. Ich will es aus deiner Sicht hören.“', o: [
      ['Den Raum gesehen und einfach geschossen.', '„Und ich habe gedacht, das war geplant!“ {n} lacht.', { partner: 2 }],
      ['Wir haben das genau so trainiert.', '„Ihr habt das geübt? Das muss ich nächstes Mal beim Training sehen.“', { partner: 2 }, null, function (st) { P.open(st, 'visit_training'); }],
      ['Ehrlich: Glück war auch dabei.', '„Glück hat, wer bereit ist.“', { conf: 1 }]] } } },
    { id: 's03', cat: 'sport', trig: 'loss', len: 'kurz', cd: 5, nodes: { start: { img: 'thought', s: { herz: '{n} nimmt dich in den Arm, ohne etwas zu sagen.', fan: '{n}: „Das {res} gegen {opp} war bitter. Was war in der zweiten Hälfte los?“', still: '{n} stellt dir einen Tee hin und wartet, bis du von selbst redest.', def: '{n}: „Harter Tag, oder?“' }, o: [
      ['Ich will gerade nicht darüber reden.', { c_offen: '„Okay. Ich bin trotzdem da.“', def: '„Verstehe. Wir machen einfach was anderes.“' }, { stress: -1 }],
      ['Wir waren einfach nicht gut genug.', { fan: '„Die Abwehr stand zu hoch. Aber du hast gekämpft.“', def: '„Ihr kommt wieder. Das weiß ich.“' }, { stress: -1, partner: 1 }],
      ['Lenk mich bitte ab.', '{n} erzählt eine absurde Geschichte aus der {place}. Du musst lachen.', { stress: -2, partner: 2 }],
      ['Du verstehst das sowieso nicht.', { c_direkt: '„Wow. Dann eben nicht.“ Die Stimmung kippt.', c_rueck: '{n} geht wortlos ins andere Zimmer.', def: '„Das war unfair.“' }, { partner: -4 }, null, function (st) { P.open(st, 'quarrel', { why: 'loss' }); }]] } } },
    { id: 's04', cat: 'sport', trig: 'loss', len: 'pers', cd: 25, when: function (c) { return c.pt.stage >= 4; }, nodes: {
      start: { img: 'thought', s: '{n}: „Ich weiß, das Spiel war hart. Aber ich hatte heute auch einen miesen Tag – darf ich trotzdem kurz erzählen?“', o: [
        ['Natürlich. Was ist passiert?', '{n} erzählt von einem Streit in der {place}.', { partner: 2 }, 'b'],
        ['Kann das bis morgen warten?', { c_offen: '„Es geht nicht immer nur um deinen Sport.“', def: '„Okay …“' }, { partner: -3 }, null, function (st) { P.open(st, 'quarrel', { why: 'ignored' }); }]] },
      b: { img: 'relaxed', s: '„Und weißt du was? Zu hören, wie es dir geht, hilft mir auch.“', o: [
        ['Dann tauschen wir uns öfter so aus.', '„Deal. Zwei schlechte Tage machen einen halbwegs guten Abend.“', { partner: 3, stress: -2 }],
        ['Lass uns heute einfach Pizza bestellen.', '„Bester Vorschlag des Tages.“', { partner: 2 }]] } } },
    { id: 's05', cat: 'sport', trig: 'win', len: 'kurz', cd: 6, nodes: { start: { img: 'success', s: { fan: '{n}: „Drei Punkte gegen {opp}! Habt ihr jetzt Anschluss nach oben?“', def: '{n}: „Gewonnen! Was machen wir mit dem guten Gefühl?“' }, o: [
      ['Wir gehen essen.', '„Ich ziehe mich schnell um.“', { partner: 2 }],
      ['Ich bin platt – Sofa.', '„Auch gut. Ich massiere dir die Waden.“', { stress: -1, partner: 1 }],
      ['Ich habe zu wenig gespielt.', { ehrgeiz: '„Dann arbeite dafür. Aber freu dich trotzdem für die anderen.“', def: '„Das kommt. Ich glaube an dich.“' }, { conf: 1 }]] } } },
    { id: 's06', cat: 'sport', trig: 'bench', len: 'pers', cd: 30, nodes: {
      start: { img: 'thought', s: '{n}: „Du wirkst seit ein paar Tagen ziemlich angespannt. Liegt das an den letzten Spielen?“', o: [
        ['Ja, ich habe Angst, meinen Stammplatz zu verlieren.', '„Das verstehe ich.“', { partner: 1 }, 'coach'],
        ['Das gehört eben zum Profisport.', { ehrgeiz: '„Mag sein. Aber du darfst trotzdem sagen, dass es dich nervt.“', def: '„Okay. Wenn du reden willst, sag Bescheid.“' }, {}],
        ['Eigentlich beschäftigt mich etwas anderes.', '„Was denn?“', {}, 'other']] },
      coach: { img: 'thought', s: '„Hast du schon mit {coach} gesprochen? Vielleicht weißt du dann besser, woran du bist.“', o: [
        ['Ich werde morgen mit ihm reden.', '„Gut. Erzähl mir danach, wie es war.“', { partner: 2, conf: 1 }, null, function (st) { P.open(st, 'coachp'); P.todo(st, 'coachp', 'Mit dem Trainer über deine Rolle sprechen (gegenüber {n} angekündigt)'.replace('{n}', P.partner(st).name.split(' ')[0]), 'coach'); }],
        ['Ich weiß nicht, ob das etwas bringt.', { c_offen: '„Nicht fragen bringt sicher nichts.“', def: '„Denk drüber nach.“' }, {}],
        ['Mein Berater kümmert sich bereits darum.', '„Dann bin ich gespannt, was {ag} herausfindet.“', {}, null, function (st) { P.open(st, 'agentp'); P.todo(st, 'agentp', 'Mit dem Berater über deine Situation sprechen', 'agent'); }, function (c) { return !!c.ag; }]] },
      other: { img: 'thought', s: function (c, p) { return P.isOpen(p, 'quarrel') ? '„Ist es wegen unseres Streits neulich?“' : P.isOpen(p, 'workstress') ? '„Machst du dir Sorgen, weil ich gerade so viel arbeite?“' : (c.cx.per.stress > 60 ? '„Ist es einfach alles zusammen? Du hast viel um die Ohren.“' : '„Du kannst es mir sagen, wenn du so weit bist.“'); }, o: [
        ['Ja – lass uns darüber reden.', function (c, p) { return P.isOpen(p, 'quarrel') ? '„Ich war auch nicht fair.“ Ihr räumt den Streit aus.' : '„Danke, dass du offen bist.“'; }, { partner: 3, stress: -2 }, null, function (st) { P.close(st, 'quarrel', 'geklärt'); }],
        ['Es ist nichts Konkretes.', '„Okay. Ich frage nicht weiter.“', {}]] } } },
    { id: 's07', cat: 'sport', trig: 'coachback', len: 'kurz', cd: 0, nodes: { start: { img: 'relaxed', s: '{n}: „Du wolltest doch mit {coach} über deine Rolle sprechen. Wie lief es?“', o: [
      ['Gut. Ich weiß jetzt, woran ich bin.', '„Siehst du. Ich bin stolz auf dich, dass du das angesprochen hast.“', { partner: 2, conf: 1 }, null, function (st) { P.close(st, 'coachp', 'gesprochen'); }],
      ['Nicht so toll, aber ehrlich.', '„Ehrlich ist besser als im Ungewissen. Was machst du jetzt?“', { partner: 1 }, null, function (st) { P.close(st, 'coachp', 'gesprochen'); }],
      ['Lass uns später darüber reden.', '„Okay.“', {}, null, function (st) { P.close(st, 'coachp', 'gesprochen'); }]] } } },
    { id: 's08', cat: 'sport', trig: 'inj1', len: 'pers', cd: 0, nodes: {
      start: { img: 'thought', s: function (c) { return '{n} kommt sofort, als du anrufst: „Was hat der Arzt gesagt?“ – Diagnose: ' + (c.p && c.p.inj ? c.p.inj.type + ', etwa ' + c.p.inj.weeks + ' Wochen.' : 'eine Verletzung.'); }, o: [
        ['Es ist schlimm. Ich falle lange aus.', { herz: '{n} hält deine Hand: „Wir schaffen das. Zusammen.“', ruhig: '„Okay. Eins nach dem anderen. Was brauchst du jetzt?“', def: '„Das tut mir so leid.“' }, { partner: 2, stress: -1 }, 'b'],
        ['Halb so wild.', { c_offen: '„Du musst nicht den Starken spielen.“', def: '„Ich glaube, du spielst es herunter.“' }, {}, 'b']] },
      b: { img: 'thought', s: '„Was kann ich tun?“', o: [
        ['Einfach da sein.', '„Bin ich. Versprochen.“', { partner: 3 }, null, function (st) { P.mem(st, 'inj_support_' + st.season, 'Unterstützung nach der Verletzung', 'die Zeit nach deiner Verletzung'); }],
        ['Lass mich erstmal allein.', { c_rueck: '„Verstehe ich besser, als du denkst.“', def: '„Okay. Aber nicht zu lange.“' }, {}]] } } },
    { id: 's09', cat: 'sport', trig: 'inj2', len: 'kurz', cd: 0, nodes: { start: { img: 'relaxed', s: '{n}: „Wie war die Reha heute? Kommst du voran?“', o: [
      ['Kleine Schritte, aber es geht vorwärts.', '„Kleine Schritte sind auch Schritte.“', { stress: -1, partner: 1 }],
      ['Begleitest du mich mal zur Physio?', { fan: '„Sehr gern! Ich will sehen, was die mit dir machen.“', def: '„Wenn ich mir freinehmen kann – ja.“' }, { partner: 2 }],
      ['Es nervt einfach.', '„Darf es auch. Hauptsache, du bleibst dran.“', {}]] } } },
    { id: 's10', cat: 'sport', trig: 'inj3', len: 'pers', cd: 0, nodes: {
      start: { img: 'conflict', s: '{n}: „Du bist in letzter Zeit gereizt. Ist es, weil du nicht spielen kannst?“', o: [
        ['Ja. Ich sehe die anderen spielen und sitze nur rum.', '„Das muss sich furchtbar anfühlen.“', { partner: 1 }, 'b'],
        ['Mir geht es gut!', { c_direkt: '„Merkt man. Total.“', def: '„Okay …“' }, { partner: -2 }]] },
      b: { img: 'thought', s: '„Was würde dir jetzt helfen?“', o: [
        ['Etwas ganz ohne Sport unternehmen.', '„Dann gehen wir morgen ins Museum. Kein Wort über Fußball.“'.replace('Fußball', '{sw}'), { stress: -3, partner: 2 }],
        ['Mehr Zeit beim Team verbringen.', '„Dann fahr zu den Spielen mit. Das tut dir gut.“', { mates: 2 }],
        ['Einfach Geduld.', '„Die hast du. Ich glaube an dich.“', { conf: 1 }]] } } },
    { id: 's11', cat: 'sport', trig: 'inj4', len: 'kurz', cd: 0, nodes: { start: { img: 'success', s: '{n}: „Du darfst wieder ins Mannschaftstraining? Das ist großartig!“', o: [
      ['Endlich!', '„Ich habe dich nie so strahlen sehen.“', { well: 3, partner: 1 }],
      ['Ich habe Angst vor dem ersten Zweikampf.', '„Das ist normal. Vertrau deinem Körper.“', { stress: -1 }],
      ['Danke, dass du durchgehalten hast mit mir.', '„Immer.“', { partner: 3 }]] } } },
    { id: 's12', cat: 'sport', trig: 'injback', len: 'kurz', cd: 0, nodes: { start: { img: 'success', s: { fan: '{n}: „Ich habe gesehen, du warst wieder dabei! Wie hat es sich angefühlt?“', def: '{n}: „Du hast wieder gespielt? Erzähl!“' }, o: [
      ['Wie ein Neuanfang.', '„Ich bin so froh. Die letzten Wochen waren für uns beide hart.“', { partner: 2, well: 2 }, null, function (st) { P.close(st, 'injback'); P.mem(st, 'comeback_' + st.season, 'Comeback nach Verletzung', 'dein Comeback'); }],
      ['Noch nicht wie früher.', '„Das kommt. Schritt für Schritt.“', {}, null, function (st) { P.close(st, 'injback'); }]] } } },
    { id: 's13', cat: 'sport', len: 'kurz', cd: 40, when: function (c) { return c.st.phase === 'season' && c.wk <= 3; }, nodes: { start: { img: 'relaxed', s: '{n}: „Neue Saison, neues Glück. Was hast du dir vorgenommen?“', o: [
      ['Stammspieler werden.', { ehrgeiz: '„Das schaffst du. Ich auch – ich will befördert werden.“', def: '„Ich drücke dir die Daumen.“' }, { conf: 1 }],
      ['Gesund bleiben.', '„Das wünsche ich mir auch für dich.“', { partner: 1 }],
      ['Mehr Zeit für uns trotz Saison.', '„Das ist das schönste Ziel, das ich je von dir gehört habe.“', { partner: 3 }]] } } },
    { id: 's14', cat: 'sport', len: 'kurz', cd: 40, when: function (c) { return c.st.phase !== 'season' && c.st.week <= 2; }, nodes: { start: { img: 'thought', s: '{n}: „Die Saison ist vorbei. Wie bist du zufrieden?“', o: [
      ['Insgesamt gut.', '„Ich finde auch. Jetzt erholst du dich.“', { well: 1 }],
      ['Es hätte mehr sein müssen.', { ehrgeiz: '„Dann weißt du ja, woran du arbeiten musst.“', def: '„Sei nicht so hart mit dir.“' }, {}],
      ['Am meisten freue ich mich auf Zeit mit dir.', '„Und ich mich auf dich.“', { partner: 3 }]] } } },
    { id: 's15', cat: 'sport', len: 'kurz', cd: 30, when: function (c) { return c.late && c.st.phase === 'season'; }, nodes: { start: { img: 'thought', s: { fan: '{n}: „Die Tabelle macht mich wahnsinnig. Wie geht es dir mit dem Druck?“', def: '{n}: „Es geht um viel in den letzten Wochen, oder?“' }, o: [
      ['Ich versuche, nicht zu viel nachzudenken.', '„Dann lenke ich dich ab – ohne Tabelle.“', { stress: -2 }],
      ['Ich brauche gerade viel Ruhe.', { herz: '„Bekommst du. Ich plane nichts bis Saisonende.“', def: '„Okay, ich halte dir den Rücken frei.“' }, { stress: -2, partner: 1 }],
      ['Ich liebe solche Wochen.', '„Du bist verrückt. Aber genau deshalb.“', { conf: 1 }]] } } },
    { id: 's16', cat: 'sport', len: 'kurz', cd: 60, when: function (c) { return c.p && c.p.susp > 0; }, nodes: { start: { img: 'conflict', s: '{n}: „Gesperrt? Was ist da passiert?“', o: [
      ['Ich habe mich provozieren lassen.', { ruhig: '„Passiert. Daraus lernst du.“', temp: '„Hätte mir auch passieren können.“ {n} grinst schief.', def: '„Das nächste Mal tief durchatmen.“' }, { disc: 1 }],
      ['Der Schiedsrichter hatte einen schlechten Tag.', '„Kann sein. Aber das bringt dich nicht zurück aufs Feld.“', {}],
      ['Dann habe ich wenigstens Zeit für dich.', '„Galgenhumor. Aber ich nehme es.“', { partner: 2 }]] } } },
    { id: 's17', cat: 'sport', len: 'kurz', cd: 80, when: function (c) { return c.cx.captain; }, nodes: { start: { img: 'success', s: '{n}: „Kapitän! Hast du das kommen sehen?“', o: [
      ['Nein, ich bin selbst überrascht.', '„Ich nicht. Du kümmerst dich um alle.“', { partner: 2, conf: 1 }],
      ['Das ist viel Verantwortung.', '„Die du tragen kannst.“', { conf: 1 }]] } } },
    { id: 's18', cat: 'sport', len: 'kurz', cd: 60, when: function (c) { return c.pc.nt && c.pc.nt.caps > 0 && c.pc.nt.status === 'squad' && R.nt && R.nt.away(c.st) > 0; }, nodes: { start: { img: 'success', s: '{n}: „Du fährst wieder zur Nationalmannschaft? Ich bin so stolz!“', o: [
      ['Das ist jedes Mal ein Traum.', '„Ich schaue jedes Spiel. Versprochen.“', { partner: 2 }],
      ['Dann bin ich wieder eine Woche weg.', '„Ich weiß. Wir telefonieren jeden Abend.“', { partner: 1 }]] } } },
    { id: 's19', cat: 'sport', len: 'kurz', cd: 40, when: function (c) { return c.pc.fame >= 30 && c.cx.per.stress > 50; }, nodes: { start: { img: 'thought', s: '{n}: „In den Medien wird gerade viel über dich geschrieben. Wie gehst du damit um?“', o: [
      ['Ich lese das nicht.', '„Gut so. Ich auch nicht mehr.“', { stress: -1 }],
      ['Es trifft mich mehr, als ich zugebe.', '„Danke, dass du es mir sagst.“ {n} hört lange zu.', { stress: -2, partner: 2 }],
      ['Das gehört zum Geschäft.', { still: '„Für dich. Ich finde es trotzdem anstrengend.“', def: '„Mag sein.“' }, {}]] } } },
    { id: 's20', cat: 'sport', len: 'kurz', cd: 50, when: function (c) { return c.pt.sport >= 55 && c.st.phase === 'season'; }, nodes: { start: { img: 'relaxed', s: '{n}: „Ich würde gern mal zum Training kommen und zuschauen. Geht das?“', o: [
      ['Na klar, Donnerstag ist öffentlich.', '„Ich bringe Kaffee für dich mit.“', { partner: 2 }, null, function (st) { P.mem(st, 'training_visit', '{n} beim Training'.replace('{n}', P.partner(st).name.split(' ')[0]), 'als du beim Training zugeschaut hast'); }],
      ['Lieber nicht, da bin ich konzentriert.', '„Okay, verstehe ich.“', {}]] } } },
    { id: 's21', cat: 'sport', len: 'kurz', cd: 40, when: function (c) { return !!c.rival; }, nodes: { start: { img: 'thought', s: '{n}: „Wer ist eigentlich dieser Konkurrent auf deiner Position, von dem du immer redest?“', o: [
      ['Er ist gut, ehrlich gesagt.', '„Respekt, dass du das sagst. Dann musst du eben besser werden.“', { conf: 1 }],
      ['Er nervt mich.', { humor: '„Soll ich ihm beim nächsten Heimspiel die Zunge rausstrecken?“', def: '„Lass dich nicht verrückt machen.“' }, {}]] } } },
    { id: 's22', cat: 'sport', len: 'kurz', cd: 30, when: function (c) { return c.form < 5.8 && c.st.phase === 'season'; }, nodes: { start: { img: 'thought', s: '{n}: „Läuft gerade nicht so, oder? Was sagt dein Gefühl?“', o: [
      ['Mir fehlt das Selbstvertrauen.', '„Dann erinnere dich an {mem}. Du kannst so viel.“', { conf: 2, partner: 1 }],
      ['Ich arbeite daran.', '„Ich weiß. Ich sehe es jeden Tag.“', {}],
      ['Können wir es heute ausblenden?', '„Absolut. Spieleabend?“', { stress: -2 }]] } } },
    { id: 's23', cat: 'sport', len: 'kurz', cd: 80, when: function (c) { return c.st.phase === 'season' && c.wk >= 6 && c.pt.sport >= 45; }, nodes: { start: { img: 'relaxed', s: '{n}: „Ich habe Karten für das nächste Heimspiel. Ich bringe meine Schwester mit.“', o: [
      ['Super, ich winke euch zu.', '„Wehe nicht!“', { partner: 2 }],
      ['Setzt euch in die Nordkurve, da ist Stimmung.', { fan: '„Genau mein Plan!“', def: '„Ist das nicht zu laut?“' }, {}]] } } },
    { id: 's24', cat: 'sport', len: 'kurz', cd: 50, when: function (c) { return c.pc.trust < 40; }, nodes: { start: { img: 'thought', s: '{n}: „Du redest kaum noch über {coach}. Ist das Verhältnis schwierig?“', o: [
      ['Ja, wir verstehen uns nicht.', '„Hast du schon versucht, offen mit ihm zu reden?“', { partner: 1 }, null, function (st) { P.open(st, 'coachp'); P.todo(st, 'coachp', 'Klärendes Gespräch mit dem Trainer', 'coach'); }],
      ['Das wird schon.', '„Hoffentlich.“', {}]] } } },
    { id: 's25', cat: 'sport', len: 'kurz', cd: 80, when: function (c) { return c.st.phase === 'season' && c.pc.titles && c.pc.titles.length > 0; }, nodes: { start: { img: 'success', s: '{n}: „Ich muss immer noch an euren Titel denken. Das Bild hängt jetzt im Flur.“', o: [
      ['Der schönste Moment meiner Karriere.', '„Und ich war dabei.“', { partner: 2 }],
      ['Wir wollen mehr.', '„Das sieht man dir an.“', { amb: 1 }]] } } },
    { id: 's26', cat: 'sport', len: 'kurz', cd: 60, when: function (c) { return c.pt.sport < 40 && c.st.phase === 'season'; }, nodes: { start: { img: 'relaxed', s: '{n}: „Ich verstehe die Abseitsregel immer noch nicht. Erklärst du sie mir nochmal?“'.replace('die Abseitsregel', 'manche Regeln'), o: [
      ['Mit Salzstreuern auf dem Tisch.', '{n} lacht Tränen. Am Ende sitzt es halbwegs.', { partner: 3 }],
      ['Musst du nicht verstehen.', '„Ich will aber.“', { partner: -1 }]] } } },
    { id: 's27', cat: 'sport', len: 'kurz', cd: 60, when: function (c) { return c.p && c.p.stats.goals >= 10; }, nodes: { start: { img: 'success', s: '{n}: „Zweistellig diese Saison! Das muss gefeiert werden.“', o: [
      ['Kleines Essen mit Freunden?', '„Ich organisiere alles.“', { partner: 2, mates: 1 }],
      ['Erst am Saisonende.', '„Der Abergläubische in dir.“', {}]] } } },
    { id: 's28', cat: 'sport', len: 'kurz', cd: 40, when: function (c) { return c.st.phase === 'season' && c.wk % 5 === 2; }, nodes: { start: { img: 'relaxed', s: '{n}: „Ihr habt ein englisches Woche – drei Spiele in acht Tagen. Wie überstehst du das?“'.replace('ein englisches', 'eine englische'), o: [
      ['Schlafen, essen, spielen.', '„Ich koche vor.“', { fit: 1, partner: 1 }],
      ['Mit dir am Telefon.', '„Dann bleibe ich lange wach.“', { partner: 2 }]] } } },
    { id: 's29', cat: 'sport', len: 'pers', cd: 80, when: function (c) { return c.age >= 31 && c.pt.stage >= 4; }, nodes: {
      start: { img: 'thought', s: '{n}: „Denkst du manchmal darüber nach, wie lange du noch spielst?“', o: [
        ['Öfter, als ich zugebe.', '„Was macht dir Sorgen?“', { partner: 1 }, 'b'],
        ['Noch lange!', { ehrgeiz: '„Das will ich hören.“', def: '„Hoffentlich bleibt dein Körper deiner Meinung.“' }, {}]] },
      b: { img: 'thought', s: '„Und was willst du danach machen?“', o: [
        ['Vielleicht Trainer werden.', '„Das passt zu dir.“', { partner: 2 }, null, function (st) { P.mem(st, 'after_talk', 'Gespräch über die Zeit nach der Karriere', 'unser Gespräch über die Zeit nach der Karriere'); }],
        ['Mehr Zeit mit dir und der Familie.', '„Darauf freue ich mich jetzt schon.“', { partner: 3 }],
        ['Keine Ahnung.', '„Dann finden wir es zusammen heraus.“', { partner: 1 }]] } } },
    { id: 's30', cat: 'sport', len: 'kurz', cd: 50, when: function (c) { return c.ag && c.st.phase === 'season'; }, nodes: { start: { img: 'relaxed', s: '{n}: „Was sagt eigentlich {ag} zu deiner Situation im Verein?“', o: [
      ['Er ist zufrieden.', '„Dann bin ich es auch.“', {}],
      ['Ich sollte ihn mal wieder anrufen.', '„Mach das. Und erzähl mir dann.“', {}, null, function (st) { P.open(st, 'agentp'); P.todo(st, 'agentp', 'Mit dem Berater über die Lage sprechen', 'agent'); }],
      ['Ich vertraue ihm nicht ganz.', { c_offen: '„Dann sprich das an. Oder such dir jemand anderen.“', def: '„Das klingt nicht gut.“' }, {}]] } } }
  );
  P.add(A);
})(RFM);
