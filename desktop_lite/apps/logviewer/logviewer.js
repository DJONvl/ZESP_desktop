// logviewer.js — виджет «Логи»: живая лента серверного лога с фильтрами.
// Бэкенд: internal/debug (события logfmt) + internal/web/logfeed.go.
// Протокол: logSub|<query> / logUnsub / logHist|n=..&.. → события log|<строка>.
// Клик по строке с cid= — отследить цепочку одним кликом.

(function () {
  'use strict';

  var MAX_DOM = 500; // потолок строк в ленте (защита вкладки)

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var LOGV_CSS =
    '.logv-wrap{display:flex;flex-direction:column;height:100%;gap:6px}' +
    '.logv-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}' +
    '.logv-bar select,.logv-bar input{background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:4px 8px;font-size:12px}' +
    '.logv-bar input{min-width:0}' +
    '.logv-btn{background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer}' +
    '.logv-btn:hover{border-color:var(--accent)}' +
    '.logv-btn.on{border-color:var(--accent);color:var(--accent)}' +
    '.logv-cnt{font-size:11px;color:var(--muted);margin-left:auto;white-space:nowrap}' +
    // поле с крестиком очистки: × виден только при непустом вводе
    '.logv-f{position:relative;display:inline-flex;align-items:center;min-width:0}' +
    '.logv-f input{width:100%;padding-right:20px;box-sizing:border-box}' +
    '.logv-x{position:absolute;right:2px;display:none;background:transparent;border:none;color:var(--faint);cursor:pointer;font-size:14px;line-height:1;padding:2px 5px;border-radius:4px}' +
    '.logv-x:hover{color:var(--red);background:rgba(239,68,68,.1)}' +
    '.logv-f.has .logv-x{display:block}' +
    // пресеты фильтров в один клик + подсказки значений
    '.logv-presets{display:flex;flex-wrap:wrap;gap:4px;align-items:center}' +
    '.logv-pre{background:transparent;border:1px solid var(--border2);color:var(--muted);border-radius:11px;padding:2px 10px;font-size:11px;cursor:pointer;white-space:nowrap}' +
    '.logv-pre:hover{color:var(--accent);border-color:var(--accent)}' +
    '.logv-pre.on{color:var(--accent);border-color:var(--accent);background:rgba(59,130,246,.12)}' +
    // дропдаун мультивыбора с галочками (mod, ev)
    '.logv-dd{position:relative;display:inline-flex;min-width:0}' +
    '.logv-ddb{background:var(--bg3);border:1px solid var(--border2);color:var(--text);border-radius:6px;padding:4px 8px;font-size:12px;cursor:pointer;max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left}' +
    '.logv-ddb:hover{border-color:var(--accent)}' +
    '.logv-ddp{position:absolute;top:calc(100% + 4px);left:0;z-index:60;min-width:150px;max-height:240px;overflow-y:auto;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;box-shadow:0 12px 34px rgba(0,0,0,.45);padding:6px;display:flex;flex-direction:column;gap:1px}' +
    '.logv-ddp.hidden{display:none}' +
    '.logv-ddp label{display:flex;gap:7px;align-items:center;font-size:12px;color:var(--text);padding:3px 6px;border-radius:5px;cursor:pointer;white-space:nowrap}' +
    '.logv-ddp label:hover{background:var(--hover)}' +
    '.logv-ddp input{margin:0}' +
    '.logv-tape{flex:1;overflow-y:auto;background:#0d1117;border:1px solid var(--border2);border-radius:6px;padding:6px 8px;font-family:Consolas,Menlo,monospace;font-size:12px;line-height:1.45;min-height:120px}' +
    '.logv-line{white-space:pre-wrap;word-break:break-all;color:#c9d1d9;padding:0 2px;border-radius:3px;cursor:default}' +
    '.logv-line.has-cid{cursor:pointer}' +
    '.logv-line.has-cid:hover{background:rgba(59,130,246,.15)}' +
    '.logv-lvl{display:inline-block;min-width:14px;font-weight:700}' +
    '.logv-E .logv-lvl{color:#f85149}' +
    '.logv-W .logv-lvl{color:#d29922}' +
    '.logv-I .logv-lvl{color:#58a6ff}' +
    '.logv-D .logv-lvl{color:#bc8cff}' +
    '.logv-T .logv-lvl{color:#8b949e}' +
    '.logv-hint{font-size:11px;color:var(--faint)}';

  var LOGV_BODY =
    '<div class="logv-wrap">' +
    '<div class="logv-bar">' +
    '<select class="logv-lvl" title="Уровень (и выше)"></select>' +
    '<div class="logv-dd"><button class="logv-ddb" data-dd="mod" title="Модули: клик — выбрать галочками">mod: всё ▾</button><div class="logv-ddp hidden" data-ddp="mod"></div></div>' +
    '<div class="logv-dd"><button class="logv-ddb" data-dd="ev" title="События: клик — выбрать галочками">ev: всё ▾</button><div class="logv-ddp hidden" data-ddp="ev"></div></div>' +
    '<span class="logv-f" style="width:60px"><input class="logv-cid" placeholder="cid" title="ID цепочки — клик по строке подставляет сам"><button class="logv-x" title="Очистить поле">×</button></span>' +
    '<span class="logv-f" style="flex:1;min-width:80px"><input class="logv-text" placeholder="текст" title="Подстрока по строке"><button class="logv-x" title="Очистить поле">×</button></span>' +
    '<input class="logv-n" type="number" value="200" min="10" max="1000" title="Сколько строк истории подтянуть" style="width:64px">' +
    '<button class="logv-btn logv-apply">Применить</button>' +
    '<button class="logv-btn logv-pause">Пауза</button>' +
    '<button class="logv-btn logv-clear">Очистить</button>' +
    '<span class="logv-cnt">○ 0</span>' +
    '</div>' +
    '<div class="logv-presets" title="Готовые фильтры в один клик">' +
    '<button class="logv-pre" data-lvl="D" data-mod="telink,zcl" data-ev="">Эфир</button>' +
    '<button class="logv-pre" data-lvl="D" data-mod="ws,mqtt" data-ev="cmd">Команды</button>' +
    '<button class="logv-pre" data-lvl="D" data-mod="rep,zcl" data-ev="rx,report">Репорты</button>' +
    '<button class="logv-pre" data-lvl="D" data-mod="zcl,rep,mqtt,ws" data-ev="rx,report,cmd,pub">Цепочки</button>' +
    '<button class="logv-pre" data-lvl="E" data-mod="" data-ev="">Ошибки</button>' +
    '<button class="logv-pre" data-lvl="D" data-mod="" data-ev="">Всё</button>' +
    '</div>' +
    '<div class="logv-tape"></div>' +
    '<div class="logv-hint">Клик по строке с cid= — показать только эту цепочку. Пауза отписывает ленту на сервере.</div>' +
    '</div>';

  function lvlOf(line) {
    var m = / lvl=([EWIDT]) /.exec(' ' + line + ' ');
    return m ? m[1] : 'D';
  }
  function cidOf(line) {
    var m = / cid=([0-9a-z-]+)/i.exec(line);
    return m ? m[1] : '';
  }

  function buildQuery(node) {
    var q = [];
    var lvl = node.querySelector('.logv-lvl').value || 'D';
    q.push('lvl=' + lvl);
    var mods = ddVals(node, 'mod');
    if (mods.length) q.push('mod=' + mods.join(','));
    var evs = ddVals(node, 'ev');
    if (evs.length) q.push('ev=' + evs.join(','));
    var cid = node.querySelector('.logv-cid').value.trim();
    if (cid) q.push('cid=' + cid);
    var text = node.querySelector('.logv-text').value.trim();
    if (text) q.push('text=' + encodeURIComponent(text));
    return q.join('&');
  }

  function tape(node) { return node.querySelector('.logv-tape'); }
  function cnt(node) { return node.querySelector('.logv-cnt'); }

  // setField ставит значение поля и синхронит крестик очистки.
  function setField(node, sel, v) {
    var inp = node.querySelector(sel);
    if (!inp) return;
    inp.value = v;
    var f = inp.closest('.logv-f');
    if (f) f.classList.toggle('has', !!v);
  }

  // Дропдауны мультивыбора с галочками: состояние — массивы на node,
  // чекбоксы в выпавшей панели. Пусто = все.
  var LOGV_MODS = ['telink', 'zboss', 'zigate', 'ember', 'zstack', 'zcl',
    'rep', 'mqtt', 'ws', 'ya', 'ble', 'auto', 'trs', 'db', 'sys', 'main'];
  var LOGV_EVS = ['rx', 'tx', 'report', 'cmd', 'pub', 'join', 'leave', 'ack',
    'lux', 'ping', 'state', 'err', 'dbg'];
  function ddVals(node, kind) { return node['_logv_' + kind] || []; }
  function paintDd(node, kind) {
    var v = ddVals(node, kind);
    var b = node.querySelector('.logv-ddb[data-dd="' + kind + '"]');
    if (!b) return;
    if (!v.length) {
      b.textContent = kind + ': всё ▾';
      b.title = kind + ': все (клик — выбрать галочками)';
    } else {
      b.textContent = kind + ': ' + v.join(',');
      b.title = kind + ' = ' + v.join(', ');
    }
  }
  function setDd(node, kind, arr) {
    node['_logv_' + kind] = (arr || []).slice();
    node.querySelectorAll('.logv-ddp[data-ddp="' + kind + '"] input').forEach(function (cb) {
      cb.checked = node['_logv_' + kind].indexOf(cb.value) !== -1;
    });
    paintDd(node, kind);
  }
  function buildDd(node, kind, values) {
    var p = node.querySelector('.logv-ddp[data-ddp="' + kind + '"]');
    if (!p) return;
    values.forEach(function (v) {
      var lb = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = v;
      cb.addEventListener('change', function () {
        var cur = ddVals(node, kind).slice();
        var i = cur.indexOf(v);
        if (cb.checked && i === -1) cur.push(v);
        if (!cb.checked && i !== -1) cur.splice(i, 1);
        cur.sort(function (a, b) { return values.indexOf(a) - values.indexOf(b); });
        node['_logv_' + kind] = cur;
        paintDd(node, kind);
        clearPre(node);
        applyFilter(node);
      });
      lb.appendChild(cb);
      lb.appendChild(document.createTextNode(v));
      p.appendChild(lb);
    });
  }
  function clearPre(node) {
    node.querySelectorAll('.logv-pre.on').forEach(function (o) { o.classList.remove('on'); });
  }
  function splitList(s) {
    var out = [];
    String(s || '').split(',').forEach(function (x) {
      x = x.trim().toLowerCase();
      if (x) out.push(x);
    });
    return out;
  }

  // paintCnt: счётчик + индикатор подписки (● идёт / ○ тишина).
  function paintCnt(node) {
    cnt(node).textContent = (node._logvSub ? '● ' : '○ ') + (node._logvCount || 0);
  }

  function stickBottom(t) {
    return t.scrollHeight - t.scrollTop - t.clientHeight < 40;
  }

  function appendLine(node, line) {
    var t = tape(node);
    var stick = stickBottom(t);
    var lvl = lvlOf(line);
    var cid = cidOf(line);
    var div = document.createElement('div');
    div.className = 'logv-line logv-' + lvl + (cid ? ' has-cid' : '');
    // lvl красим отдельно, остальное — текстом
    var lv = document.createElement('span');
    lv.className = 'logv-lvl';
    lv.textContent = lvl + ' ';
    div.appendChild(lv);
    var rest = document.createElement('span');
    rest.textContent = line;
    div.appendChild(rest);
    if (cid) {
      div.title = 'Показать цепочку cid=' + cid;
      div.setAttribute('data-cid', cid);
    }
    t.appendChild(div);
    while (t.children.length > MAX_DOM) t.removeChild(t.firstChild);
    node._logvCount = (node._logvCount || 0) + 1;
    paintCnt(node);
    if (stick) t.scrollTop = t.scrollHeight;
  }

  function clearTape(node) {
    tape(node).innerHTML = '';
    node._logvCount = 0;
    paintCnt(node);
  }

  function applyFilter(node) {
    if (typeof WSsend !== 'function') return;
    var q = buildQuery(node);
    var n = parseInt(node.querySelector('.logv-n').value, 10) || 200;
    clearTape(node);
    node._logvPaused = false;
    node.querySelector('.logv-pause').classList.remove('on');
    node.querySelector('.logv-pause').textContent = 'Пауза';
    WSsend('logSub|' + q);
    WSsend('logHist|n=' + n + '&' + q);
  }

  function setPaused(node, paused) {
    if (typeof WSsend !== 'function') return;
    node._logvPaused = paused;
    var b = node.querySelector('.logv-pause');
    if (paused) {
      WSsend('logUnsub');
      b.classList.add('on');
      b.textContent = 'Продолжить';
    } else {
      b.classList.remove('on');
      b.textContent = 'Пауза';
      WSsend('logSub|' + buildQuery(node));
    }
  }

  window.WinEngine && window.WinEngine.register({
    id: 'logviewer',
    title: 'Логи',
    label: 'Логи',
    icon: '📜',
    single: true,
    template: '<div class="window hidden" data-x="120" data-y="40" data-w="760" data-h="520">' +
      '<style>' + LOGV_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Логи</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:6px">' + LOGV_BODY + '</div>' +
      '</div>',
    setup: function (node, opts) {
      node._logvCount = 0;
      node._logvPaused = false;
      // уровни: E/W/I/D/T; дефолт I — тихо, детализация пресетами ниже
      var sel = node.querySelector('.logv-lvl');
      [['E', 'E — ошибки'], ['W', 'W — и выше'], ['I', 'I — и выше'],
       ['D', 'D — и выше'], ['T', 'T — всё']].forEach(function (o) {
        var el = document.createElement('option');
        el.value = o[0];
        el.textContent = o[1];
        if (o[0] === 'I') el.selected = true;
        sel.appendChild(el);
      });
      node.querySelector('.logv-apply').addEventListener('click', function () { applyFilter(node); });
      // дропдауны мультивыбора: состояние + построение чекбоксов
      node._logv_mod = [];
      node._logv_ev = [];
      buildDd(node, 'mod', LOGV_MODS);
      buildDd(node, 'ev', LOGV_EVS);
      paintDd(node, 'mod');
      paintDd(node, 'ev');
      // открытие/закрытие панелей; клик вне — закрыть
      node.querySelectorAll('.logv-ddb').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          var kind = b.getAttribute('data-dd');
          var p = node.querySelector('.logv-ddp[data-ddp="' + kind + '"]');
          var wasHidden = p.classList.contains('hidden');
          node.querySelectorAll('.logv-ddp').forEach(function (o) { o.classList.add('hidden'); });
          if (wasHidden) p.classList.remove('hidden');
        });
      });
      node._logvDocCl = function (e) {
        if (!node.isConnected) return;
        if (e.target.closest && e.target.closest('.logv-dd')) return;
        node.querySelectorAll('.logv-ddp').forEach(function (o) { o.classList.add('hidden'); });
      };
      document.addEventListener('click', node._logvDocCl);
      // пресеты: один клик ставит готовый фильтр (cid/текст сбрасываются)
      node.querySelectorAll('.logv-pre').forEach(function (b) {
        b.addEventListener('click', function () {
          node.querySelector('.logv-lvl').value = b.getAttribute('data-lvl') || 'D';
          setDd(node, 'mod', splitList(b.getAttribute('data-mod')));
          setDd(node, 'ev', splitList(b.getAttribute('data-ev')));
          setField(node, '.logv-cid', '');
          setField(node, '.logv-text', '');
          node.querySelectorAll('.logv-pre').forEach(function (o) { o.classList.remove('on'); });
          b.classList.add('on');
          applyFilter(node);
        });
      });
      // крестики очистки: × виден при непустом поле, клик чистит без применения
      // (фильтр вступает по кнопке «Применить»)
      var bar = node.querySelector('.logv-bar');
      bar.addEventListener('input', function (e) {
        var f = e.target.closest ? e.target.closest('.logv-f') : null;
        if (!f) return;
        var inp = f.querySelector('input');
        f.classList.toggle('has', !!(inp && inp.value));
        // ручная правка — активный пресет больше не отражает фильтр
        node.querySelectorAll('.logv-pre.on').forEach(function (o) { o.classList.remove('on'); });
      });
      bar.addEventListener('click', function (e) {
        var x = e.target.closest ? e.target.closest('.logv-x') : null;
        if (!x) return;
        var f = x.closest('.logv-f');
        var inp = f && f.querySelector('input');
        if (inp) { inp.value = ''; inp.focus(); f.classList.remove('has'); }
      });
      node.querySelector('.logv-pause').addEventListener('click', function () { setPaused(node, !node._logvPaused); });
      node.querySelector('.logv-clear').addEventListener('click', function () {
        clearTape(node);
        // сносим и серверное кольцо: следующий logHist начнётся с чистого
        if (typeof WSsend === 'function') WSsend('logClear');
      });
      tape(node).addEventListener('click', function (e) {
        var ln = e.target.closest ? e.target.closest('.logv-line.has-cid') : null;
        if (!ln) return;
        node.querySelector('.logv-cid').value = ln.getAttribute('data-cid');
        var cf = node.querySelector('.logv-cid').closest('.logv-f');
        if (cf) cf.classList.add('has');
        applyFilter(node);
      });
      if (window.eventE) {
        node._logvOnLog = function (line) {
          if (node._logvPaused) return;
          appendLine(node, line);
        };
        node._logvOnHist = function (arr) {
          if (!arr || !arr.length) return;
          clearTape(node);
          arr.forEach(function (line) { appendLine(node, line); });
        };
        // logCtl|ok sub|unsub — индикатор подписки в счётчике.
        // ok clear подписку не меняет — игнорируем.
        node._logvOnCtl = function (msg) {
          if (msg === 'ok sub') node._logvSub = true;
          else if (msg === 'ok unsub') node._logvSub = false;
          else return;
          paintCnt(node);
        };
        // wsopen — сокет пересоздан (обрыв): подписка жила на старом
        // соединении, переподписываемся. Окно закрыто — хендлера нет,
        // сервер молчит: трафик только при открытом окне.
        node._logvOnOpen = function () {
          if (node._logvPaused) return;
          applyFilter(node);
        };
        eventE.on('log', node._logvOnLog);
        eventE.on('logHist', node._logvOnHist);
        eventE.on('logCtl', node._logvOnCtl);
        eventE.on('wsopen', node._logvOnOpen);
      }
      if (window.L) { L.load('logviewer', '/desktop_lite/apps/logviewer/'); setTimeout(function () { L.applyLang(node, 'logviewer'); }, 400); }
      applyFilter(node);
    },
    destroy: function (node) {
      try {
        if (node._logvDocCl) document.removeEventListener('click', node._logvDocCl);
        if (window.eventE) {
          if (node._logvOnLog) eventE.off('log', node._logvOnLog);
          if (node._logvOnHist) eventE.off('logHist', node._logvOnHist);
          if (node._logvOnCtl) eventE.off('logCtl', node._logvOnCtl);
          if (node._logvOnOpen) eventE.off('wsopen', node._logvOnOpen);
        }
        // Окно закрыто — отписываемся: сервер перестаёт слать нам ленту.
        if (typeof WSsend === 'function') WSsend('logUnsub');
      } catch (e) {}
    }
  });
})();
