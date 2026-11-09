// ANWURF! – Hilfsfunktionen (Zufall, Formatierung)
var RFM = (typeof RFM !== 'undefined') ? RFM : {};

(function (R) {
  // Reproduzierbarer Zufallsgenerator (mulberry32). Zustand liegt im Spielstand.
  R.rng = {
    state: 123456789,
    seed: function (s) { this.state = (s >>> 0) || 1; },
    next: function () {
      var t = (this.state = (this.state + 0x6D2B79F5) >>> 0);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };
  R.rand = function () { return R.rng.next(); };
  R.randInt = function (a, b) { return a + Math.floor(R.rand() * (b - a + 1)); };
  R.randRange = function (a, b) { return a + R.rand() * (b - a); };
  R.chance = function (p) { return R.rand() < p; };
  R.pick = function (arr) { return arr[Math.floor(R.rand() * arr.length)]; };
  R.gauss = function (mean, sd) {
    var u = 1 - R.rand(), v = R.rand();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  R.shuffle = function (arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(R.rand() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  R.weighted = function (items, wfn) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += Math.max(0, wfn(items[i]));
    if (total <= 0) return items[0];
    var r = R.rand() * total;
    for (i = 0; i < items.length; i++) { r -= Math.max(0, wfn(items[i])); if (r <= 0) return items[i]; }
    return items[items.length - 1];
  };
  R.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  R.round = function (v, step) { step = step || 1; return Math.round(v / step) * step; };
  R.sum = function (arr, fn) { var s = 0; for (var i = 0; i < arr.length; i++) s += fn ? fn(arr[i]) : arr[i]; return s; };
  R.avg = function (arr, fn) { return arr.length ? R.sum(arr, fn) / arr.length : 0; };

  R.fmtMoney = function (v) {
    var neg = v < 0; v = Math.abs(Math.round(v));
    var s;
    if (v >= 1e6) s = (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace('.', ',') + ' Mio. €';
    else if (v >= 1e4) s = Math.round(v / 1000).toLocaleString('de-DE') + ' Tsd. €';
    else s = v.toLocaleString('de-DE') + ' €';
    return (neg ? '−' : '') + s;
  };
  R.fmtMoneyFull = function (v) { return (v < 0 ? '−' : '') + Math.abs(Math.round(v)).toLocaleString('de-DE') + ' €'; };
  R.fmtNum = function (v) { return Math.round(v).toLocaleString('de-DE'); };
  R.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  R.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
})(RFM);
