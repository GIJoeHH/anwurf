// ANWURF! – Zahleneingabe
//  • Überall: Geldfelder zeigen den Betrag lesbar darunter an („= 1.250.000 € · 1,25 Mio. €“)
//  • iPad/Touch: Zahlenfelder öffnen ein eigenes kleines Zahlenpad (mit „Tsd.“ und „Mio.“) statt der
//    Bildschirmtastatur. Nebeneffekt: Ohne Tastatureingabe gibt es auch keinen „Eingabe widerrufen“-Dialog.
(function (R) {
  if (typeof document === 'undefined') return;
  var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;

  function fmt(v) { return Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function hasMult(el) { return isMoney(el) || el.hasAttribute('data-mult'); }
  function isMoney(el) { return el.hasAttribute('data-money') || (+el.getAttribute('step') || 0) >= 1000 || /Amt$|^feeIn$|^wIn$|^sIn$|^bIn$/.test(el.id || ''); }
  function hintText(el) {
    var v = +el.value || 0;
    if (!v) return '';
    return '= ' + fmt(v) + ' €' + (Math.abs(v) >= 10000 ? ' · ' + R.fmtMoney(v) : '');
  }
  function updHint(el) { var h = el._hint; if (h) h.textContent = hintText(el); }
  function decorate(root) {
    var list = (root || document).querySelectorAll('input[type=number]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (el._np) continue; el._np = true;
      if (isMoney(el)) {
        var h = document.createElement('span'); h.className = 'num-hint';
        el.insertAdjacentElement('afterend', h); el._hint = h; updHint(el);
        el.addEventListener('input', function () { updHint(this); });
      }
      if (touch) { el.setAttribute('inputmode', 'none'); el.readOnly = true; el.classList.add('np-field'); }
    }
  }
  var mo = new MutationObserver(function () { decorate(document); });
  function start() { decorate(document); mo.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  // ---------- Zahlenpad ----------
  // Touch: alle Zahlenfelder. Mac/PC: nur Felder mit data-pad (z. B. Börse) – dort geht auch die Tastatur (Ziffern, T = Tsd., M = Mio., Enter, Esc).
  if (!touch) document.addEventListener('keydown', function (e) {
    if (!pad || pad.style.display !== 'flex') return;
    var k = e.key, map = { Enter: 'ok', Escape: 'cancel', Backspace: '⌫', t: 'tsd', T: 'tsd', m: 'mio', M: 'mio', ',': ',', '.': ',', Delete: 'clr' };
    var np = /^[0-9]$/.test(k) ? k : map[k]; if (!np) return;
    e.preventDefault(); var b = pad.querySelector('[data-np="' + np + '"]'); if (b) b.click();
  }, true);
  var pad = null, target = null, buf = '', mult = 1;
  function label(el) {
    var l = el.closest('label'); if (l) { var t = l.childNodes[0]; if (t && t.nodeType === 3) return t.textContent.trim(); }
    var f = el.closest('.f'); if (f) { var s = f.querySelector('span,b'); if (s) return s.textContent.trim(); }
    return el.getAttribute('placeholder') || 'Zahl eingeben';
  }
  function value() { return (+buf || 0) * mult; }
  function render() {
    var money = target && isMoney(target), v = value();
    pad.querySelector('.np-v').textContent = buf === '' ? '0' : fmt(v);
    pad.querySelector('.np-u').textContent = money ? (Math.abs(v) >= 10000 ? R.fmtMoney(v) : '€') : '';
    pad.querySelector('[data-np=tsd]').classList.toggle('on', mult === 1000);
    pad.querySelector('[data-np=mio]').classList.toggle('on', mult === 1000000);
  }
  function open(el) {
    target = el; mult = 1;
    var v = +el.value || 0;
    if (hasMult(el) && v && v % 1000000 === 0) { mult = 1000000; buf = String(v / 1000000); }
    else if (hasMult(el) && v && v % 1000 === 0) { mult = 1000; buf = String(v / 1000); }
    else buf = v ? String(v) : '';
    if (!pad) {
      pad = document.createElement('div'); pad.id = 'numpad';
      var keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', ',', '0', '⌫'];
      pad.innerHTML = '<div class="np-box"><div class="np-t"></div><div class="np-d"><span class="np-v">0</span><span class="np-u"></span></div>' +
        '<div class="np-mul"><button data-np="tsd">Tsd.</button><button data-np="mio">Mio.</button><button data-np="clr">C</button></div>' +
        '<div class="np-keys">' + keys.map(function (k) { return '<button data-np="' + k + '">' + k + '</button>'; }).join('') + '</div>' +
        '<div class="np-act"><button data-np="cancel">Abbrechen</button><button class="primary" data-np="ok">Übernehmen</button></div></div>';
      document.body.appendChild(pad);
      pad.addEventListener('click', function (e) {
        if (e.target === pad) { close(false); return; }
        var b = e.target.closest('[data-np]'); if (!b) return;
        var k = b.getAttribute('data-np');
        if (k === 'ok') return close(true);
        if (k === 'cancel') return close(false);
        if (k === 'clr') { buf = ''; mult = 1; }
        else if (k === '⌫') buf = buf.slice(0, -1);
        else if (k === 'tsd') mult = mult === 1000 ? 1 : 1000;
        else if (k === 'mio') mult = mult === 1000000 ? 1 : 1000000;
        else if (k === ',') { if (buf.indexOf('.') < 0) buf = (buf || '0') + '.'; }
        else if (buf.length < 12) buf = (buf === '0' ? '' : buf) + k;
        render();
      });
    }
    var money = hasMult(el);
    pad.querySelector('.np-mul').style.display = money ? '' : 'none';
    pad.querySelector('[data-np=","]').style.visibility = money ? '' : 'hidden';
    pad.querySelector('.np-t').textContent = label(el);
    pad.style.display = 'flex';
    render();
  }
  function close(ok) {
    if (!pad) return;
    pad.style.display = 'none';
    if (ok && target) {
      var v = value(), mn = target.getAttribute('min');
      if (mn !== null && mn !== '' && v < +mn) v = +mn;
      target.value = String(Math.round(v));
      updHint(target);
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    target = null;
  }
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('input[type=number]');
    if (!el || el.disabled) return;
    if (!touch && !el.hasAttribute('data-pad')) return;
    e.preventDefault(); el.blur(); open(el);
  }, true);
  R.numpad = { open: open, close: close, fmt: fmt };
})(RFM);
