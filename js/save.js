// ANWURF! – Spielstände: Mac-App (iCloud-Sync-Ordner) oder Browser (IndexedDB)
(function (R) {
  var SV = R.save = {};
  var native = typeof window !== 'undefined' && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.rfm;
  SV.isNative = !!native;
  function call(cmd, args) {
    var msg = { cmd: cmd }; for (var k in args) msg[k] = args[k];
    return native.postMessage(msg).then(function (r) { return typeof r === 'string' ? JSON.parse(r) : r; });
  }

  // ---- IndexedDB (Browser) ----
  var dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('no idb')); return; }
      var req = indexedDB.open('anwurf-handball-manager', 1);
      req.onupgradeneeded = function () { req.result.createObjectStore('saves'); };
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { rej(req.error); };
    });
    return dbp;
  }
  function idbOp(mode, fn) {
    return idb().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction('saves', mode), store = tx.objectStore('saves'), r = fn(store);
        tx.oncomplete = function () { res(r && r.result); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }

  SV.meta = function (st, slot) {
    var c = st.manager && !st.manager.unemployed ? st.clubs[st.manager.clubId] : null;
    return { slot: slot, manager: st.manager.name, club: c ? c.name : 'Vereinslos', season: st.season, week: st.week, phase: st.phase, saved: new Date().toISOString(), cheat: !!st.cheatUsed, version: st.version };
  };

  SV.save = function (st, slot) {
    st.rngState = R.rng.state;
    var data = JSON.stringify(st), meta = SV.meta(st, slot);
    if (native) return call('save', { slot: slot, data: data, meta: JSON.stringify(meta) });
    try { if (slot === 'autosave') localStorage.setItem('anwurf_lastLocal', meta.saved); } catch (e) {}
    return idbOp('readwrite', function (s) { s.put({ meta: meta, data: data }, slot); }).then(function () { return { ok: true }; })
      .catch(function () { try { localStorage.setItem('anwurf_' + slot, JSON.stringify({ meta: meta, data: data })); return { ok: true }; } catch (e) { return { ok: false, error: 'Speicher voll' }; } });
  };
  SV.list = function () {
    if (native) return call('list', {}).then(function (r) { return r.slots || []; });
    return idb().then(function (db) {
      return new Promise(function (res) {
        var out = [], tx = db.transaction('saves', 'readonly'), cur = tx.objectStore('saves').openCursor();
        cur.onsuccess = function () { var c = cur.result; if (c) { out.push(c.value.meta); c.continue(); } else res(out); };
        cur.onerror = function () { res(out); };
      });
    }).catch(function () {
      var out = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('anwurf_') === 0) try { out.push(JSON.parse(localStorage.getItem(k)).meta); } catch (e) {} }
      return out;
    });
  };
  SV.load = function (slot) {
    var p = native ? call('load', { slot: slot }).then(function (r) { if (!r.ok) throw new Error(r.error || 'Laden fehlgeschlagen'); return r.data; })
      : idbOp('readonly', function (s) { return s.get(slot); }).then(function (v) { if (!v) throw new Error('nicht gefunden'); return v.data; })
        .catch(function () { var v = localStorage.getItem('anwurf_' + slot); if (!v) throw new Error('Spielstand nicht gefunden'); return JSON.parse(v).data; });
    return p.then(function (data) { return SV.parse(data); });
  };
  SV.remove = function (slot) {
    if (native) return call('delete', { slot: slot });
    return idbOp('readwrite', function (s) { s.delete(slot); }).catch(function () { localStorage.removeItem('anwurf_' + slot); });
  };
  // Prüfen und reparieren beim Laden (sicheres Wiederherstellen)
  SV.parse = function (data) {
    var st = typeof data === 'string' ? JSON.parse(data) : data;
    if (!st || !st.clubs || !st.players || !st.leagues || !st.manager) throw new Error('Ungültiger Spielstand');
    if (Object.keys(st.clubs).length < 54) throw new Error('Spielstand unvollständig');
    st.settings = st.settings || {}; st.inbox = st.inbox || []; st.news = st.news || []; st.achievements = st.achievements || {};
    Object.keys(st.clubs).forEach(function (k) { var c = st.clubs[k]; c.construction = c.construction || []; c.portfolio = c.portfolio || {}; c.loans = c.loans || []; });
    if (R.stadium) Object.keys(st.clubs).forEach(function (k) { if (st.clubs[k].stadium) R.stadium.migrate(st.clubs[k]); }); // Stadionplan v1 → v2
    if (R.deals) R.deals.ensureAll(st);
    if (R.econ && R.econ.ensureBande) Object.keys(st.clubs).forEach(function (k) { R.econ.ensureBande(st, st.clubs[k]); }); // Bandenwerbung: 20 einzelne Banden
    if (R.world.migrateWages) R.world.migrateWages(st); // Gehaltsgefüge 2026-11 (reale Größenordnungen, Ligaobergrenzen)
    R.rng.seed(st.rngState || st.seed || 1);
    return st;
  };
  // Browser/Web-App: auf iPad/iPhone über das Teilen-Menü („In Dateien sichern“), sonst als Download
  var isTouch = typeof navigator !== 'undefined' && ((navigator.maxTouchPoints || 0) > 1 || /iPad|iPhone|Android/.test(navigator.userAgent || ''));
  function shareOrDownload(files) {
    if (isTouch && navigator.canShare && navigator.share && typeof File !== 'undefined') {
      var fl = files.map(function (f) { return new File([f.text], f.name, { type: f.mime || 'application/json' }); });
      if (navigator.canShare({ files: fl })) {
        return navigator.share({ files: fl }).then(function () { return { ok: true, how: 'share' }; })
          .catch(function (e) { if (e && e.name === 'AbortError') return { ok: false, aborted: true, error: 'Abgebrochen' }; return download(); });
      }
    }
    return download();
    function download() {
      files.forEach(function (f, i) {
        setTimeout(function () {
          var blob = new Blob([f.text], { type: f.mime || 'application/json' });
          var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = f.name;
          document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        }, i * 400);
      });
      return Promise.resolve({ ok: true, how: 'download' });
    }
  }
  SV.exportFile = function (name, text, mime) {
    if (native) return call('export', { name: name, data: text });
    return shareOrDownload([{ name: name, text: text, mime: mime }]);
  };
  // Sync für die Web-App (Vorbild Handball-Live): Spielstand im Format des Ordners „Spielstände“
  // (<Slot>.json + <Slot>.meta) ausgeben – in iCloud Drive › … › Handball-Manager-Anwurf › Spielstände sichern,
  // dann sehen Mac- und iPad-App ihn unter „Weiterspielen“/„Spielstand laden“.
  SV.syncExport = function (st, slot) {
    slot = slot || 'autosave';
    st.rngState = R.rng.state;
    var meta = SV.meta(st, slot);
    try { localStorage.setItem('anwurf_sync', JSON.stringify({ savedAt: meta.saved })); } catch (e) {}
    return shareOrDownload([{ name: slot + '.json', text: JSON.stringify(st) }, { name: slot + '.meta', text: JSON.stringify(meta) }]);
  };
  // Nach dem Import aus iCloud entspricht der Stand der Datei → gilt als gesichert
  SV.markSynced = function () { try { localStorage.setItem('anwurf_sync', JSON.stringify({ savedAt: new Date().toISOString() })); } catch (e) {} };
  SV.lastSync = function () { try { return JSON.parse(localStorage.getItem('anwurf_sync') || '{}').savedAt || null; } catch (e) { return null; } };
  SV.isTouch = isTouch;
  SV.platform = function () { return native ? (window.RFM_PLATFORM === 'ipad' ? 'iPad-App' : 'Mac-App') : ((window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)) ? 'Web-App' : 'Web'); };
  SV.storageInfo = function () {
    if (native) return call('info', {});
    return Promise.resolve({ path: 'Browser-Speicher (IndexedDB) – nicht synchronisiert. Für die Synchronisierung die Mac-App verwenden oder Spielstände exportieren.' });
  };
  // OCR: Apple Vision in der Mac-App, sonst Tesseract.js (falls online verfügbar)
  SV.ocr = function (dataUrl) {
    if (native) return call('ocr', { image: dataUrl.split(',')[1] }).then(function (r) { if (!r.ok) throw new Error(r.error || 'Texterkennung fehlgeschlagen'); return r.text; });
    return new Promise(function (res, rej) {
      function run() { window.Tesseract.recognize(dataUrl, 'deu').then(function (r) { res(r.data.text); }).catch(rej); }
      if (window.Tesseract) return run();
      var s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = run; s.onerror = function () { rej(new Error('Texterkennung offline nicht verfügbar – bitte die Mac-App verwenden oder Daten manuell eingeben.')); };
      document.head.appendChild(s);
    });
  };
})(RFM);
