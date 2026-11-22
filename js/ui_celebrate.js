/* ANWURF! – Große Momente: Titel-Screens für Meisterschaft, DHB-Pokal und Europapokal (Sieg und verlorenes Finale).
   Die Spiellogik legt sie mit S.celebrate in st.celebrations ab; gezeigt werden sie nach dem Spieltag.
   Aufbau nach dem Vorbild von ANPFIFF! (js/ui_celebrate.js dort). */
(function (R) {
  'use strict';
  var U = R.ui, D = R.data, esc = R.esc;
  // Bilder in img/cel – bisher ein Handball-Motiv; weitere Dateien einfach in die Listen aufnehmen
  var IMG = {
    league1: ['meister1'],
    league: ['meister1'],
    win: ['meister1'],
    lose: ['meister1']
  };
  function pick(list, o) { var n = (o.season || 0) * 7 + (o.level || 0) + (o.kind || '').length; return 'img/cel/' + list[n % list.length] + '.jpg'; }
  function euroName(k) { return (R.euro && R.euro.NAMES && R.euro.NAMES[k]) || 'Europapokal'; }
  function oppCrest(o) {
    var st = U.st, t = st.clubs[o.opp] || (R.euro && R.euro.info && o.opp != null ? R.euro.info(st, o.opp) : null);
    return t && t.colors ? U.crest(t, 22) + ' ' : '';
  }
  function stat(label, value) { return '<div class="cel-stat"><span>' + label + '</span><b>' + value + '</b></div>'; }

  U.celebrationHTML = function (o, replay) {
    var st = U.st, c = st.clubs[o.club] || U.club(), k = o.kind, win = !!o.win;
    var pre = '', ss = 'Saison ' + o.season + '/' + String(o.season + 1).slice(2), kick, title, text, stats = [], art, img;
    var name = esc(c ? c.name : '');
    if (k === 'league') {
      var top = o.level === 1, ln = D.leagueNames[o.level] || '';
      kick = (top ? 'Deutsche Meisterschaft' : 'Meisterschaft ' + ln) + ' · ' + ss;
      title = top ? 'Deutscher Meister!' : 'Meister der ' + ln + '!';
      if (!top) pre = 'Meister der';
      text = top ? name + ' holt die Meisterschale! ' + o.pts + ' Punkte, ' + (o.gap > 0 ? o.gap + ' Punkte Vorsprung' : 'am Ende hauchdünn vorn') + ' – die ganze Stadt feiert ihre Mannschaft.'
        : o.level === 2 ? name + ' ist Meister der 2. Bundesliga und steigt in die Bundesliga auf. Was für eine Saison!'
          : name + ' ist Meister der ' + ln + '! Jetzt geht es in der Aufstiegsrunde um den Sprung in die 2. Bundesliga.';
      stats = [stat('Punkte', o.pts), stat('Bilanz S/U/N', o.w + '/' + o.d + '/' + o.l), stat('Tore', o.gf + ':' + o.ga), stat('Vorsprung', (o.gap > 0 ? '+' : '') + o.gap)];
      art = 'meister'; img = pick(top ? IMG.league1 : IMG.league, o);
    } else {
      var cup = k === 'cup', comp = cup ? 'DHB-Pokal' : euroName(k);
      kick = (cup ? 'DHB-Pokal · Finale' : comp + ' · Finale' + (o.city ? ' in ' + esc(o.city) : '')) + ' · ' + ss;
      if (win) {
        title = cup ? 'Pokalsieger!' : 'Sieger der ' + comp + '!';
        if (!cup) pre = 'Sieger der';
        text = 'Finalsieg gegen ' + esc(o.oppName) + ' (' + esc(o.res) + ')! ' + (cup ? 'Der DHB-Pokal gehört ' + name + '.' : name + ' ist die Nummer eins in Europa.') + ' Die Siegprämie von ' + R.fmtMoney(o.prize) + ' wurde überwiesen.';
      } else {
        title = 'Finale verloren';
        text = 'So nah dran: ' + esc(o.oppName) + ' gewinnt ' + (cup ? 'den DHB-Pokal' : 'die ' + comp) + ' (' + esc(o.res) + '). Ein bitterer Abend – und trotzdem eine große ' + (cup ? 'Pokalsaison' : 'Reise durch Europa') + '.';
      }
      stats = [stat('Gegner', oppCrest(o) + esc(o.oppName)), stat('Ergebnis', esc(o.res))];
      if (win) stats.push(stat('Siegprämie', R.fmtMoney(o.prize)));
      stats.push(stat(cup ? 'Pokal-Einnahmen' : 'Einnahmen ' + comp, R.fmtMoney(o.earn || 0)));
      art = cup ? 'pokal' : 'euro'; img = pick(win ? IMG.win : IMG.lose, o);
    }
    if (o.career) { // Spielerkarriere: gleiche Bilder, aber aus Sicht des eigenen Spielers (keine Vereinsprämien)
      text = text.replace(/ *Die Siegprämie[^.]*\./, '').replace(/ *Die Titelprämie[^.]*\./, '');
      stats = stats.filter(function (x) { return x.indexOf('prämie') < 0 && x.indexOf('Einnahmen') < 0; });
      var pl = R.pc && R.pc.player ? R.pc.player(st) : null;
      if (pl) { stats.push(stat('Deine Einsätze', pl.stats.apps || 0)); stats.push(stat('Deine Tore', pl.stats.goals || 0)); text += ' Und du warst mittendrin, ' + esc(pl.first || '') + '!'; }
    }
    var confetti = '';
    if (win) for (var i = 0; i < 70; i++) confetti += '<i style="left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i * 0.13) % 4).toFixed(2) + 's;animation-duration:' + (3.2 + (i % 5) * 0.5).toFixed(1) + 's" class="c' + (i % 4) + '"></i>';
    return '<div class="cel ' + (win ? 'win' : 'lose') + ' cel-' + k + '" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '<div class="cel-bg" style="background-image:url(' + img + ')"></div><div class="cel-shade"></div>' + (win ? '<div class="cel-confetti" aria-hidden="true">' + confetti + '</div>' : '') +
      '<div class="cel-card"><div class="cel-head"><span class="cel-art">' + (U.trophyArt ? U.trophyArt(art, 76) : U.lc('trophy', 40)) + '</span><div><div class="cel-kick">' + kick + '</div><h1 class="cel-title">' + (pre ? '<small>' + pre + '</small>' + esc(title.slice(pre.length + 1)) : esc(title)) + '</h1></div></div>' +
      '<div class="cel-club">' + (c ? U.crest(c, 30) : '') + '<b>' + name + '</b></div><p class="cel-text">' + text + '</p><div class="cel-stats">' + stats.join('') + '</div>' +
      '<div class="cel-actions"><button class="primary" data-act="celNext"' + (replay ? ' data-replay="1"' : '') + '>' + (replay ? 'Schließen' : win ? U.lc('sparkles', 16) + ' Weiter feiern' : 'Weiter') + '</button></div></div></div>';
  };

  function host() {
    var el = document.getElementById('celebrate');
    if (!el) { el = document.createElement('div'); el.id = 'celebrate'; document.body.appendChild(el); }
    return el;
  }
  // Nächsten offenen Titel-Screen zeigen; true, wenn einer offen ist
  U.showCelebration = function () {
    var q = U.st && U.st.celebrations; if (!q || !q.length) return false;
    var el = host(); el.innerHTML = U.celebrationHTML(q[0]); el.className = 'show';
    var b = el.querySelector('[data-act="celNext"]'); if (b) b.focus();
    return true;
  };
  U.acts.celNext = function (d) {
    var el = host();
    if (!d.replay && U.st.celebrations) U.st.celebrations.shift();
    el.className = ''; el.innerHTML = '';
    if (!d.replay) { if (U.showCelebration()) return; if (U.autosave) U.autosave(); if (U.afterWeekPopups) U.afterWeekPopups(); }
  };
  // Aus der Vereinsgeschichte erneut ansehen
  U.acts.celReplay = function (d) {
    var o = (U.st.celebrationLog || [])[+d.i]; if (!o) return;
    var el = host(); el.innerHTML = U.celebrationHTML(o, true); el.className = 'show';
  };
  U.celebrationTitle = function (o) {
    if (o.kind === 'league') return o.level === 1 ? 'Deutscher Meister' : 'Meister ' + D.leagueNames[o.level];
    var comp = o.kind === 'cup' ? 'DHB-Pokal' : euroName(o.kind);
    return o.win ? (o.kind === 'cup' ? 'Pokalsieger' : comp + '-Sieger') : comp + '-Finale verloren';
  };
  document.addEventListener('keydown', function (e) {
    var el = document.getElementById('celebrate');
    if (e.key === 'Escape' && el && el.className === 'show') { var b = el.querySelector('[data-act="celNext"]'); if (b) b.click(); }
  });
})(RFM);
