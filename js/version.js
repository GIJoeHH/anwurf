// ANWURF! – Versionsnummer (wird auf jedem Bildschirm unten links angezeigt)
// Bei jeder neuen Spielversion RFM.VERSION erhöhen. web/deploy.sh hängt beim Veröffentlichen
// zusätzlich die Build-Kennung an (RFM.BUILD), damit man auf dem iPad sieht, welcher Stand läuft.
(function (R) {
  R.VERSION = '1.1';
  R.BUILD = R.BUILD || '';
  R.versionText = function (long) {
    var plat = R.save && R.save.platform ? R.save.platform() : '';
    return 'Version ' + R.VERSION + (R.BUILD ? ' · Build ' + R.BUILD.slice(0, 7) : '') + (long && plat ? ' · ' + plat : '');
  };
  if (typeof document === 'undefined') return;
  function show() {
    if (document.getElementById('verTag')) return;
    var el = document.createElement('div'); el.id = 'verTag';
    el.style.cssText = 'position:fixed;left:max(8px,env(safe-area-inset-left,0px));bottom:calc(6px + env(safe-area-inset-bottom,0px));z-index:5;' +
      'pointer-events:none;font:600 10.5px -apple-system,system-ui,sans-serif;color:#8ea0c4;opacity:.75;letter-spacing:.02em';
    el.textContent = R.versionText(true);
    document.body.appendChild(el);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show();
})(RFM);
RFM.BUILD = 'eb82ae32b5';
