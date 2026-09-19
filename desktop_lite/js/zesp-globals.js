// zesp-globals.js — глобальные объекты, которые ожидает static/KWS/socket.js как есть.
// Подключать ПОСЛЕ socket.js: на верхнем уровне socket.js делает var updateProgress={},
// здесь он перезаписывается рабочей реализацией.
// ponytail: минимальные рабочие стабы, без фреймворков; расширяются по мере переноса виджетов.

// deviceList заполняется socket.js при alldev (WS может ответить раньше,
// чем выполнится этот скрипт) — не перезаписываем уже пришедший список.
var deviceList = (typeof window.deviceList !== 'undefined' && window.deviceList) ? window.deviceList : [];
var CURVERSION = '';
var groups = [];
var jsconfig = null;

// CSS.escape — полифилл (нет в некоторых браузерах/WebView; нужен socket.js и devices.js)
if (typeof window.CSS !== 'undefined' && typeof window.CSS.escape !== 'function') {
  window.CSS.escape = function (str) {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, function (ch) {
      return '\\' + ch;
    });
  };
}

// ── Toast ─────────────────────────────────────────────────────────────────────
// Стаб, только если не подключён настоящий (KWS.js / notifi_center.js)
if (!window.Toast) {
  function Toast(opts) {
    opts = opts || {};
    this.title = opts.title || '';
    this.text = opts.text || '';
    console.log('[Toast]', this.title, this.text);
    var self = this;
    var delay = (opts.interval != null && opts.interval > 0) ? opts.interval : 3500;
    setTimeout(function () {
      if (window.onToast) window.onToast(self.title, self.text);
    }, delay);
  }
  window.Toast = Toast;
}

// ── Notification Center ───────────────────────────────────────────────────────
// Стаб, только если не подключён настоящий notifi_center.js
if (!window.NC) {
  window.NC = {
    add: function (title, text, type) {
      console.log('[NC]', type || 'info', title, text);
      if (window.onToast) window.onToast(title, text);
    }
  };
}

// ── Progress bar (update firmware) ────────────────────────────────────────────
// Порт с static/KWS/progress.js, без жёстких цветов — на переменных тем.
if (typeof ProgressBarWidget === 'undefined') {
  class ProgressBarWidget {
    constructor() {
      this.currentPercent = 0;
      this.createWidget();
    }
    createWidget() {
      var s = document.createElement('style');
      s.textContent = '.zesp-pb{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:2147483000;width:300px;background:var(--bg2);border:1px solid var(--border2);border-radius:10px;box-shadow:0 8px 32px rgba(0,0,0,.5);padding:16px;display:none;align-items:center;flex-direction:column;gap:10px;color:var(--text)}' +
        '.zesp-pb-text{font-size:15px;font-weight:700;text-align:center}' +
        '.zesp-pb-bar{position:relative;width:90%;height:18px;border:1px solid var(--border2);border-radius:9px;overflow:hidden;background:var(--bg3);display:flex;align-items:center;justify-content:center}' +
        '.zesp-pb-fill{position:absolute;top:0;left:0;height:100%;width:0;background:var(--accent);transition:width .3s ease}' +
        '.zesp-pb-percent{position:relative;z-index:1;font-size:12px;font-weight:700;color:var(--text)}';
      document.head.appendChild(s);
      this.container = document.createElement('div');
      this.container.className = 'zesp-pb';
      this.textEl = document.createElement('div');
      this.textEl.className = 'zesp-pb-text';
      this.textEl.textContent = 'Обновление';
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'zesp-pb-bar';
      this.progressFill = document.createElement('div');
      this.progressFill.className = 'zesp-pb-fill';
      this.progressPercent = document.createElement('div');
      this.progressPercent.className = 'zesp-pb-percent';
      this.progressPercent.textContent = '0%';
      this.progressBar.appendChild(this.progressFill);
      this.progressBar.appendChild(this.progressPercent);
      this.container.appendChild(this.textEl);
      this.container.appendChild(this.progressBar);
      document.body.appendChild(this.container);
    }
    show() { this.container.style.display = 'flex'; }
    hide() { this.container.style.display = 'none'; }
    updateProgress(p) { this.currentPercent = p; this.progressFill.style.width = p + '%'; this.progressPercent.textContent = p + '%'; }
    setText(t) { this.textEl.textContent = t; }
    setFileText(n) { this.progressPercent.textContent = n; this.progressPercent.style.fontSize = '11px'; }
  }
  window.ProgressBarWidget = ProgressBarWidget;
}
window.updateProgress = new ProgressBarWidget();

// ── get_tile(dev) — tile устройства в списке устройств ───────────────────────
// socket.js вызывает внутри widgetReport при каждом rep.
function get_tile(device) {
  var el = document.createElement('div');
  el.setAttribute('data-ieee', device && device.IEEE || '');
  var name = document.createElement('span');
  name.textContent = (device && device.Device) || '';
  el.appendChild(name);
  return el;
}
window.get_tile = get_tile;

// ── i18n: подключаемые словари <widget>.lp ──────────────────────────────────
// Файлы: apps/<widget>/<lang>.lp (например apps/settings/ru.lp). Выбранный язык
// берётся из jsconfig.APP.Lang.val, fallback цепочка: выбранный → en → ключ.
// Использование: t('settings', 'ui.save') — строка; t('settings','ui.save',{n:3}) — {n}.
// ponytail: плоский словарь, плейсхолдеры {name}; плюрализация не нужна пока.
var L = {};
L.lang = 'en';
L.dicts = {}; // dicts[widgetId][lang] = {ключ: строка}
L._loaded = {}; // загруженные combo "widget/lang"

L._pending = {}; // widgetId -> Promise.all

L.load = function (widgetId, base) {
  // id виджета может отличаться от имени папки словаря (devicemgr -> devicemanager)
  var dir = (window.L_DICT_DIRS && L_DICT_DIRS[widgetId]) || widgetId;
  base = base || ('/desktop_lite/apps/' + dir + '/');
  var langs = [L.lang, 'en'];
  var pending = [];
  langs.forEach(function (lg) {
    var key = widgetId + '/' + lg;
    if (L._loaded[key]) return;
    L._loaded[key] = true;
    pending.push(fetch(base + lg + '.lp').then(function (r) {
      return r.ok ? r.json() : {};
    }).then(function (d) {
      if (!L.dicts[widgetId]) L.dicts[widgetId] = {};
      L.dicts[widgetId][lg] = d || {};
    }).catch(function () {
      if (!L.dicts[widgetId]) L.dicts[widgetId] = {};
      L.dicts[widgetId][lg] = {};
    }));
  });
  return L._pending[widgetId] = Promise.all(pending);
};

// ready(widgetId) — Promise, который резолвится после загрузки словаря виджета.
L.ready = function (widgetId) {
  if (!L._pending[widgetId]) L.load(widgetId);
  return L._pending[widgetId];
};

// t(widgetId, path, vars) — строка из словаря выбранного языка, fallback en, затем сам ключ.
L.t = function (widgetId, path, vars) {
  var d = (L.dicts[widgetId] && L.dicts[widgetId][L.lang]) ||
          (L.dicts[widgetId] && L.dicts[widgetId].en) || {};
  var s = d[path];
  if (s == null && L.lang !== 'en') s = (L.dicts[widgetId] || {}).en && (L.dicts[widgetId].en[path]);
  if (s == null) s = path;
  if (vars) {
    Object.keys(vars).forEach(function (k) {
      s = String(s).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return s;
};

// applyLang(root, widgetId) — подставляет текст во все [data-i18n="key"] внутри root.
// ponytail: если перевода нет (словарь ещё не загружен), текст шаблона не трогаем,
// иначе гонка загрузки затирает кнопки сырыми ключами.
L.applyLang = function (root, widgetId) {
  (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
    var w = el.getAttribute('data-widget') || widgetId;
    if (!w) {
      var win = el.closest('.window');
      w = win && win.dataset.wid;
    }
    if (!w) return;
    var key = el.getAttribute('data-i18n');
    var s = L.t(w, key);
    if (s === key) return;
    el.textContent = s;
  });
  (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) {
    var w = el.getAttribute('data-widget') || widgetId;
    if (!w) {
      var win = el.closest('.window');
      w = win && win.dataset.wid;
    }
    if (!w) return;
    var key = el.getAttribute('data-i18n-ph');
    var s = L.t(w, key);
    if (s === key) return;
    el.placeholder = s;
  });
};

// save(widgetId, lang, key, value) — накапливает правку в памяти (буфер dirty-файлов).
// Ничего не шлёт на сервер: весь файл записывается один раз при flush().
// ponytail: буфер ключ->значение, flush шлёт каждый изменённый файл целиком.
L.pending = {}; // widgetId -> {lang: {key: value}}
L.save = function (widgetId, lang, key, value) {
  if (!L.dicts[widgetId]) L.dicts[widgetId] = {};
  if (!L.dicts[widgetId][lang]) L.dicts[widgetId][lang] = {};
  L.dicts[widgetId][lang][key] = value;
  if (!L.pending[widgetId]) L.pending[widgetId] = {};
  if (!L.pending[widgetId][lang]) L.pending[widgetId][lang] = {};
  L.pending[widgetId][lang][key] = value;
};

// flush() — один SaveJson на каждый изменённый язык-пак (весь файл целиком), затем сброс буфера.
L.flush = function () {
  var flushed = 0;
  Object.keys(L.pending).forEach(function (wid) {
    Object.keys(L.pending[wid]).forEach(function (lang) {
      var body = JSON.stringify(L.dicts[wid][lang], null, 2);
      if (typeof WSsend === 'function') WSsend('SaveJson|/desktop_lite/apps/' + wid + '/' + lang + '.lp|' + body);
      flushed++;
    });
    L.pending[wid] = {};
  });
  L.pending = {};
  return flushed;
};

// подхватываем выбор языка при приходе конфига; грузим все известные словари
// id -> папка словаря (devicemgr живёт в apps/devicemanager/)
window.L = L;
var L_DICT_DIRS = { settings: 'settings', devicemgr: 'devicemanager', devices: 'devices', scenes: 'scenes', yammanager: 'yammanager', zigbeemap: 'zigbeemap', templateedit: 'templateedit', sh3d: 'sh3d', blockly: 'blockly', desktop: 'desktop' };
if (typeof eventE !== 'undefined') {
  eventE.on('jsconfig', function (cfg) {
    var v = cfg && cfg.APP && cfg.APP.Lang && cfg.APP.Lang.val;
    if (typeof v === 'string' && v) L.lang = v;
    Object.keys(L_DICT_DIRS).forEach(function (id) {
      L.load(id, '/desktop_lite/apps/' + L_DICT_DIRS[id] + '/');
    });
    setTimeout(function () {
      L.applyLang(document);
      if (window.WinEngine && window.WinEngine.applyLang) window.WinEngine.applyLang();
    }, 400);
  });
}
