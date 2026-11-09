// ANWURF! – Touch-Bedienung (iPad/iPhone). Auf Macs ohne Touchscreen ist diese Datei wirkungslos.
//  • Aufstellung: Spielfeld-Figuren direkt ziehen; Zeilen der Ersatzbank/Reserve kurz gedrückt halten, dann ziehen
//    (normales Wischen scrollt weiter). Antippen-und-Antippen zum Tauschen funktioniert wie gewohnt.
//  • Hover-Hinweise (title-Attribute, SVG-<title>): lange drücken zeigt den Hinweis; Antippen eines
//    gesperrten Knopfs zeigt, warum er gesperrt ist.
(function (R) {
  var T = R.touch = { enabled: false };
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
  if (!isTouch) return;
  T.enabled = true;
  document.documentElement.classList.add('touch');

  var ARM_MS = 220, TIP_MS = 480, SLOP = 10;
  var t0 = null; // aktueller Finger: { x, y, armed, dragEl, timer, tipTimer, tipShown }

  function closestTitle(el) {
    while (el && el !== document.documentElement) {
      if (el.getAttribute) {
        var t = el.getAttribute('title');
        if (t) return t;
        if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
          for (var i = 0; i < el.childNodes.length; i++) { var c = el.childNodes[i]; if (c.nodeName === 'title' && c.textContent) return c.textContent; }
        }
      }
      el = el.parentNode;
    }
    return '';
  }

  var tipEl = null, tipHide = null;
  T.tip = function (text, x, y) {
    if (!text) return;
    if (!tipEl) {
      tipEl = document.createElement('div'); tipEl.id = 'touchTip';
      tipEl.style.cssText = 'position:fixed;z-index:99999;max-width:300px;padding:8px 11px;border-radius:8px;background:#0d1527;color:#fff;' +
        'border:1px solid #4a6aa8;box-shadow:0 6px 24px rgba(0,0,0,.5);font:13px/1.35 -apple-system,system-ui,sans-serif;pointer-events:none;transition:opacity .15s';
      document.body.appendChild(tipEl);
    }
    tipEl.textContent = text; tipEl.style.opacity = '1'; tipEl.style.display = 'block';
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight, vw = window.innerWidth;
    var left = Math.max(8, Math.min(vw - w - 8, x - w / 2)), top = y - h - 18;
    if (top < 8) top = y + 26;
    tipEl.style.left = left + 'px'; tipEl.style.top = top + 'px';
    clearTimeout(tipHide); tipHide = setTimeout(T.hideTip, 2600);
  };
  T.hideTip = function () { if (tipEl) { tipEl.style.opacity = '0'; setTimeout(function () { if (tipEl && tipEl.style.opacity === '0') tipEl.style.display = 'none'; }, 160); } };

  document.addEventListener('touchstart', function (e) {
    if (e.touches.length > 1) { cancel(); return; }
    var p = e.touches[0], target = e.target && e.target.nodeType === 1 ? e.target : e.target.parentNode;
    cancel();
    t0 = { x: p.clientX, y: p.clientY, armed: false, dragEl: null };
    var dragEl = target && target.closest ? target.closest('[data-drag]') : null;
    if (dragEl) {
      t0.dragEl = dragEl;
      // Figuren auf dem Spielfeld sofort ziehbar, Tabellenzeilen erst nach kurzem Halten (sonst kein Scrollen)
      if (dragEl.classList.contains('token')) t0.armed = true;
      else t0.timer = setTimeout(function () { if (t0) { t0.armed = true; dragEl.classList.add('drag-armed'); } }, ARM_MS);
      return;
    }
    var title = closestTitle(target);
    if (title) {
      t0.tipTimer = setTimeout(function () { if (t0) { t0.tipShown = true; T.tip(title, t0.x, t0.y); } }, TIP_MS);
    }
  }, { passive: true, capture: true });

  document.addEventListener('touchmove', function (e) {
    if (!t0) return;
    var p = e.touches[0];
    if (t0.armed) { e.preventDefault(); return; } // ziehen statt scrollen
    if (Math.abs(p.clientX - t0.x) + Math.abs(p.clientY - t0.y) > SLOP) { clearTimeout(t0.timer); clearTimeout(t0.tipTimer); }
  }, { passive: false, capture: true });

  document.addEventListener('touchend', function (e) {
    if (!t0) return;
    var s = t0; cancel();
    // Gesperrter Knopf angetippt → Grund anzeigen
    if (!s.tipShown && !s.dragEl) {
      var p = e.changedTouches[0], el = document.elementFromPoint(p.clientX, p.clientY);
      var btn = el && el.closest ? el.closest('button[disabled][title], [disabled][title]') : null;
      if (btn) T.tip(btn.getAttribute('title'), p.clientX, p.clientY);
    }
    if (s.tipShown) e.preventDefault(); // langer Druck auf Hinweis löst keinen Klick aus
  }, { passive: false, capture: true });

  document.addEventListener('touchcancel', cancel, { passive: true, capture: true });

  function cancel() {
    if (!t0) return;
    clearTimeout(t0.timer); clearTimeout(t0.tipTimer);
    if (t0.dragEl) t0.dragEl.classList.remove('drag-armed');
    t0 = null;
  }

  // iOS-Kontextmenü/Textauswahl bei langem Druck auf ziehbare Elemente unterdrücken
  document.addEventListener('contextmenu', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('[data-drag], .iso-click, [title]') : null;
    if (el) e.preventDefault();
  });
})(RFM);
