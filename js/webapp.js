// ANWURF! – Web-App (GitHub Pages, iPad-Home-Bildschirm). In der Mac- und iPad-App wirkungslos.
//  • Offline-Betrieb und Updates über den Service Worker (sw.js wird von web/deploy.sh erzeugt)
//  • Hinweis „☁︎ Nicht in iCloud gesichert“, solange der aktuelle Stand noch nicht per „In iCloud sichern“
//    in den Ordner „Spielstände“ gelegt wurde (Abgleich mit Mac und iPad-App)
(function (R) {
  if (typeof window === 'undefined' || !R.save || R.save.isNative) return;
  if (!/^https?:$/.test(location.protocol)) return;
  var W = R.webapp = {};

  // ---------- Offline + Updates ----------
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    var hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      W.reg = reg;
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadController) { hadController = true; return; } // erste Installation
      if (!R.ui || !R.ui.st || R.ui.screen === 'start') { location.reload(); return; }
      bar('Neue Version von ANWURF! ist da.', 'Neu starten', function () { location.reload(); });
    });
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});

  function bar(text, btn, fn) {
    var old = document.getElementById('webappBar'); if (old) old.remove();
    var b = document.createElement('div'); b.id = 'webappBar';
    b.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 8px);z-index:99998;display:flex;gap:10px;align-items:center;' +
      'background:#0d1527;color:#fff;border:1px solid #4a6aa8;border-radius:12px;padding:8px 12px;font:600 14px -apple-system,system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45);max-width:calc(100% - 32px)';
    b.innerHTML = '<span></span><button type="button" style="min-height:36px;border:0;border-radius:8px;background:#16a34a;color:#fff;font-weight:700;padding:0 12px"></button>' +
      '<button type="button" style="min-height:36px;border:1px solid #4a6aa8;border-radius:8px;background:transparent;color:#fff;padding:0 10px">Später</button>';
    b.children[0].textContent = text; b.children[1].textContent = btn;
    b.children[1].onclick = function () { b.remove(); fn(); };
    b.children[2].onclick = function () { b.remove(); };
    document.body.appendChild(b);
  }

  // ---------- iCloud-Hinweis ----------
  var pill = null;
  function t(s) { return s ? new Date(s).getTime() : 0; }
  W.dirty = function () {
    var local = 0; try { local = t(localStorage.getItem('anwurf_lastLocal')); } catch (e) {}
    return local > t(R.save.lastSync()) + 5000;
  };
  W.refresh = function () {
    var show = !!(R.ui && R.ui.st && R.ui.screen !== 'start' && W.dirty());
    if (!pill) {
      if (!show) return;
      pill = document.createElement('button'); pill.type = 'button'; pill.id = 'cloudPill';
      pill.style.cssText = 'position:fixed;right:max(14px,env(safe-area-inset-right,0px));bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9000;' +
        'border-radius:999px;border:1px solid #e2b453;background:#3a2d10;color:#f2c464;font:700 13px -apple-system,system-ui,sans-serif;padding:9px 14px;box-shadow:0 6px 18px rgba(0,0,0,.4)';
      pill.textContent = '☁︎ Nicht in iCloud gesichert';
      pill.title = 'Tippen: Spielstand für Mac und iPad-App in den iCloud-Ordner „Spielstände“ sichern';
      pill.onclick = function () {
        if (!R.ui || !R.ui.st) return;
        R.save.syncExport(R.ui.st, 'autosave').then(function (r) {
          if (r && r.aborted) return;
          if (R.ui.toast) R.ui.toast(r && r.how === 'download' ? 'autosave.json + autosave.meta heruntergeladen – bitte in den Ordner „Spielstände“ verschieben.' : 'In iCloud gesichert.');
          W.refresh();
        });
      };
      document.body.appendChild(pill);
    }
    pill.style.display = show ? 'block' : 'none';
  };
  setInterval(W.refresh, 4000);
  document.addEventListener('visibilitychange', W.refresh);
})(RFM);
