// settings.js — виджет «Настройки» ZESP (порт static/apps/settings.app на WinEngine)
// Данные: socket.js — WSsend('loadConfig') -> событие eventE 'jsconfig';
// сохранение через SaveJson('/jsconfig.txt', json).

(function () {
  var CSS = `
.win-settings{display:flex;gap:8px;height:100%;min-height:0}
.win-settings select,.win-settings button,.win-settings input{border-radius:4px}
.win-settings .s-menu{width:170px;min-width:170px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;background:var(--bg3);border-radius:6px;padding:6px;border:1px solid var(--border)}
.win-settings .s-tab{padding:8px 10px;cursor:pointer;border-radius:4px;display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted);transition:all .15s;border:1px solid transparent;white-space:nowrap;background:transparent}
.win-settings .s-tab img{width:30px;height:30px;padding:4px;box-sizing:border-box;background:#3b82f6;border-radius:50%;flex-shrink:0}
.win-settings .s-tab:hover{background:var(--hover);color:var(--text)}
.win-settings .s-tab.active{background:rgba(59,130,246,.15);color:var(--accent);border-color:var(--accent)}
.win-settings .s-content{flex:1;overflow-y:auto;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:12px;min-width:0}
.win-settings .s-pane{display:none}
.win-settings .s-pane.active{display:block}
.win-settings .s-group{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:8px;padding:8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px}
.win-settings .s-group>label{font-size:11px;color:var(--muted);min-width:90px;text-transform:uppercase;letter-spacing:.4px;flex:1}
.win-settings .s-group input{background:var(--bg);border:1px solid var(--border2);color:var(--text);padding:6px 8px;font-size:12.5px;flex:1;min-width:120px}
.win-settings .s-group input:focus{outline:none;border-color:var(--accent)}
.win-settings .s-combo{position:relative;flex:1;display:flex;min-width:120px}
.win-settings .s-combo input{width:100%;min-width:0;flex:1;padding-right:32px}
.win-settings .s-pick{position:absolute;right:1px;top:1px;bottom:1px;width:28px;flex:none;border:none;border-left:1px solid var(--border2);border-radius:0 3px 3px 0;background-color:transparent;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2388909c' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center;padding:0;cursor:pointer;color:var(--muted);font-size:0;line-height:0}
.win-settings .s-pick:hover{background-color:var(--hover)}
.win-settings .s-pick:focus{outline:none;border-left-color:var(--accent)}
.win-settings .s-drop{position:absolute;top:calc(100% + 2px);left:0;right:0;background:var(--bg);border:1px solid var(--border2);border-radius:4px;max-height:180px;overflow-y:auto;z-index:50;box-shadow:0 6px 18px rgba(0,0,0,.25)}
.win-settings .s-drop[hidden]{display:none}
.win-settings .s-opt{padding:6px 8px;font-size:12.5px;color:var(--text);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.win-settings .s-opt:hover{background:var(--hover)}
.win-settings .s-opt.cur{color:var(--accent);font-weight:600}
.win-settings button{background:var(--accent);border:none;color:#fff;padding:7px 14px;cursor:pointer;font-size:12.5px;font-weight:600}
.win-settings button:hover{background:var(--accent-dark)}
.win-settings .s-group.s-btn-row{justify-content:flex-end}
.ya-backdrop{position:fixed;inset:0;z-index:2147483003;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.ya-modal{background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:20px;border-radius:8px;max-width:520px;width:92%}
.ya-tabs{display:flex;gap:6px;margin-bottom:14px;align-items:center}
.ya-tabs button{background:transparent;color:var(--muted);border:1px solid var(--border2);padding:8px 18px;cursor:pointer;font-size:13px;border-radius:4px}
.ya-tabs button.active{background:var(--accent);color:#fff;font-weight:600}
.ya-close{margin-left:auto;background:transparent;color:var(--faint);border:none;padding:2px 8px;cursor:pointer;font-size:18px;line-height:1}
.ya-pane{display:none;font-size:13px}
.ya-pane.active{display:block}
.ya-center{text-align:center}
.ya-pane h3{margin:0 0 10px;color:var(--green)}
.ya-pane ol{padding-left:20px;margin:5px 0}
.ya-pane input{width:100%;margin:14px 0;border:1px solid var(--green);background:var(--bg);color:var(--text);padding:8px;border-radius:4px}
@media (max-width:640px){.win-settings{flex-direction:column}.win-settings .s-menu{width:100%;min-width:unset;flex-direction:row;overflow-x:auto;gap:4px;padding:4px}}
`;

  // ---------------- helpers ----------------
  function esc(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function setByPath(node, key, value) {
    var a = key.split('.');
    var obj = node._state.cfg && node._state.cfg[a[0]];
    if (!obj || !(a[1] in obj)) return;
    if (obj[a[1]] && typeof obj[a[1]] === 'object' && 'val' in obj[a[1]]) obj[a[1]].val = value;
    else obj[a[1]] = value;
  }
  function setInput(node, key, value) {
    var el = node.querySelector('[data-cfg="' + key + '"]');
    if (el && el.tagName === 'INPUT') el.value = value;
  }

  // Board-пресеты: list из одно-ключевых объектов {"имя платы": {поле: значение}}.
  // Обычные списки — массив строк. "custom" — пустой пресет {}, ручной режим.
  function isBoardList(list) {
    return Array.isArray(list) && list.length > 0 && typeof list[0] === 'object' && list[0] !== null && !Array.isArray(list[0]);
  }
  function boardNames(list) {
    if (!isBoardList(list)) return [];
    return list.map(function (item) { return String(Object.keys(item)[0]); });
  }
  function boardPreset(list, name) {
    if (!isBoardList(list)) return null;
    for (var i = 0; i < list.length; i++) {
      if (String(Object.keys(list[i])[0]) === String(name)) return list[i][Object.keys(list[i])[0]] || {};
    }
    return null;
  }
  // Раскладывает пресет платы по полям секции (инпуты + cfg). Пустой пресет (custom) — ничего не делает.
  function applyBoardPreset(node, section, boardName) {
    var st = node._state;
    if (!st) return;
    var sec = (st.cfg || {})[section];
    if (!sec) return;
    var preset = boardPreset(sec.Board && sec.Board.list, boardName);
    if (!preset) return;
    Object.keys(preset).forEach(function (k) {
      if (!(k in sec)) return; // неизвестных полей не трогаем
      var v = String(preset[k] == null ? '' : preset[k]);
      setByPath(node, section + '.' + k, v);
      var el = node.querySelector('input[data-cfg="' + section + '.' + k + '"]');
      if (el) el.value = v;
      st._comboDone = st._comboDone || {};
      st._comboDone[section + '.' + k] = v;
    });
  }
  // ---------------- render ----------------
  function render(node, data) {
    var st = node._state;
    if (!st) return; // узел мог быть закрыт (destroy обнуляет _state)
    st.cfg = data || {};
    var menu = node.querySelector('[data-role="menu"]');
    var content = node.querySelector('[data-role="content"]');
    if (!menu || !content) return;

    var sections = Object.keys(st.cfg);
    menu.innerHTML = sections.map(function (s) {
      return '<div class="s-tab" data-tab="' + s + '"><img src="/static/icons/' + s + '.svg"><span>' + s + '</span></div>';
    }).join('');
    menu.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () { img.remove(); });
    });

    content.innerHTML = sections.map(function (s) {
      var props = st.cfg[s] || {};
      var rows = Object.keys(props).map(function (prop) { return fieldHtml(s, prop, props[prop]); }).join('');
      return '<div class="s-pane" data-pane="' + s + '">' + rows + '</div>';
    }).join('');

    if (sections.length) selectTab(node, sections[0]);
  }

  function fieldHtml(section, prop, val) {
    if (prop.indexOf('button') === 0) {
      var act = (val && val.onClick) || '';
      var blabel = (val && val.label) || prop;
      return '<div class="s-group s-btn-row"><button data-action="' + act + '">' + esc(blabel) + '</button></div>';
    }
    if (val && typeof val === 'object' && 'val' in val) {
      var list = val.list || [];
      var cur = String(val.val == null ? '' : val.val);
      var isBoard = isBoardList(list);
      var names = isBoard ? boardNames(list) : list.map(String);
      var opts = names.map(function (s) {
        return '<div class="s-opt' + (s === cur ? ' cur' : '') + '" data-val="' + esc(s) + '">' + esc(s) + '</div>';
      }).join('');
      var ph = (isBoard && !cur) ? ' placeholder="выберите плату…"' : '';
      return '<div class="s-group"><label>' + prop + '</label>' +
        '<div class="s-combo"><input data-cfg="' + section + '.' + prop + '" value="' + esc(val.val) + '" autocomplete="off"' + ph + '>' +
        '<button type="button" class="s-pick" tabindex="-1" title="Выбрать из списка">▾</button>' +
        '<div class="s-drop" hidden>' + opts + '</div></div></div>';
    }
    return '<div class="s-group"><label>' + prop + '</label><input data-cfg="' + section + '.' + prop + '" value="' + esc(val || '') + '"></div>';
  }

  function selectTab(node, tab) {
    node._state.active = tab;
    node.querySelectorAll('.s-tab').forEach(function (el) { el.classList.toggle('active', el.dataset.tab === tab); });
    node.querySelectorAll('.s-pane').forEach(function (el) { el.classList.toggle('active', el.dataset.pane === tab); });
  }

  function saveAll(node) {
    if (!node._state.cfg) return;
    node.querySelectorAll('[data-cfg]').forEach(function (el) {
      if (el.tagName === 'INPUT') setByPath(node, el.dataset.cfg, el.value);
    });
    if (typeof SaveJson === 'function') SaveJson('/jsconfig.txt', JSON.stringify(node._state.cfg));
    console.log('[settings] save:', JSON.stringify(node._state.cfg));
  }

  // ---------------- Yandex auth ----------------
  function startYaAuth(node) {
    if (node.querySelector('.ya-backdrop')) return;
    var st = node._state;
    var bd = document.createElement('div');
    bd.className = 'ya-backdrop';
    bd.innerHTML = '<div class="ya-modal">' +
      '<div class="ya-tabs"><button data-ya="qr" data-i18n="ya.qr">QR-код</button><button data-ya="cookie" data-i18n="ya.cookie">Cookie</button>' +
      '<button class="ya-close" data-ya="close" data-i18n="ya.close">✕</button></div>' +
      '<div class="ya-pane" data-ya-pane="qr"><h3 data-i18n="ya.qr_title">Авторизация по QR</h3><div class="ya-center" data-ya-progress></div><p data-ya-status data-i18n="ya.qr_wait">Загрузка QR-кода…</p></div>' +
      '<div class="ya-pane" data-ya-pane="cookie"><h3 data-i18n="ya.cookie_title">Авторизация через Cookie</h3>' +
      '<ol><li data-i18n="ya.cookie_step1">Откройте https://yandex.ru/iot и авторизуйтесь</li><li data-i18n="ya.cookie_step2">F12 → Application → Storage → Cookies → https://yandex.ru</li><li data-i18n="ya.cookie_step3">Скопируйте Session_id и вставьте ниже</li></ol>' +
      '<input type="text" placeholder="Session_id" data-ya-sess><button data-ya="cookie-ok" data-i18n="ya.ok">OK</button></div></div>';
    document.body.appendChild(bd);
    if (window.L) L.applyLang(bd, 'settings');

    bd.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ya]');
      if (!b) return;
      var k = b.dataset.ya;
      if (k === 'close') return endYaAuth(node, bd);
      if (k === 'qr' || k === 'cookie') {
        bd.querySelectorAll('.ya-pane').forEach(function (p) { p.classList.toggle('active', p.dataset.yaPane === k); });
        bd.querySelectorAll('.ya-tabs button').forEach(function (t) { t.classList.toggle('active', t.dataset.ya === k); });
        if (k === 'qr') startPoll(node, bd); else stopPoll(node);
      }
      if (k === 'cookie-ok') {
        var sid = (bd.querySelector('[data-ya-sess]') || {}).value || '';
        if (sid.length > 100) { setInput(node, 'Ya.ya_Sid', btoa('Session_id=' + sid)); endYaAuth(node, bd); }
        else alert(L.t ? L.t('settings', 'ya.err_sess') : 'Session_id некорректен');
      }
    });
    startPoll(node, bd);
  }

  function startPoll(node, bd) {
    var st = node._state;
    if (!st) return;
    if (st.yaPoll) clearInterval(st.yaPoll);
    st.onYa = function (data) { onYaLogin(node, bd, data); };
    if (window.eventE) { window.eventE.off('yaLogin'); window.eventE.on('yaLogin', st.onYa); }
    if (window.WSsend) window.WSsend('yaLogin');
    st.yaPoll = setInterval(function () { if (window.WSsend) window.WSsend('yaLoginPoll'); }, 3000);
  }
  function stopPoll(node) { var st = node._state; if (st && st.yaPoll) { clearInterval(st.yaPoll); st.yaPoll = null; } }

  function onYaLogin(node, bd, data) {
    var prog = bd.querySelector('[data-ya-progress]');
    var sts = bd.querySelector('[data-ya-status]');
    if (!data) return;
    if (data.svg) {
      prog.innerHTML = (String(data.svg).indexOf('data:image') === 0
        ? '<img src="' + data.svg + '" style="width:256px;height:256px">' : data.svg);
      if (sts) sts.textContent = L.t ? L.t('settings', 'ya.qr_scan') : 'Отсканируйте QR в приложении Яндекс';
    }
    if (data.native_default_email) {
      setInput(node, 'Ya.ya_Import', '1');
      if (data.session_id) setInput(node, 'Ya.ya_Sid', btoa('Session_id=' + data.session_id));
      else if (data.sid) setInput(node, 'Ya.ya_Sid', data.sid);
      if (data.x_token) setInput(node, 'Ya.ya_Token', data.x_token);
      endYaAuth(node, bd);
    }
    if (data.error) {
      if (String(data.error).indexOf('not scanned yet') >= 0) { if (sts) sts.textContent = L.t ? L.t('settings', 'ya.qr_pending') : 'Ожидание сканирования…'; }
      else { if (sts) sts.textContent = 'Ошибка: ' + data.error; }
    }
  }

  function endYaAuth(node, bd) {
    var st = node._state;
    if (st && st.yaPoll) clearInterval(st.yaPoll); if (st) st.yaPoll = null;
    if (window.eventE && st && st.onYa) window.eventE.off('yaLogin', st.onYa);
    if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
  }

  function regYa(node) {
    var get = function (k) { var el = node.querySelector('[data-cfg="Ya.' + k + '"]'); return el ? el.value : ''; };
    var ok = get('ya_Enable') === '1' && get('ac_id') !== '' && get('ac_login') !== '' && get('ac_pass') !== '';
    if (ok) { if (window.WSsend) window.WSsend('regYandex'); }
    else alert(L.t ? L.t('settings', 'ya.err_reg') : 'активируйте ya_Enable 1, заполните ac_id/ac_login/ac_pass и сохраните');
  }

  // ---------------- register ----------------
  window.WinEngine.register({
    id: 'settings',
    title: 'Настройки',
    label: 'Настройки',
    icon: '<img src="/static/icons/settings.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="40" data-y="20" data-w="680" data-h="480">' +
      '<style>' + CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title" data-i18n="ui.title">Настройки</span>' +
      '<div class="c-tools"><button class="cbtn" data-action="save" data-i18n="ui.save_title" title="Сохранить"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button></div>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body"><div class="win-settings">' +
      '<div class="s-menu" data-role="menu"></div>' +
      '<div class="s-content" data-role="content"></div>' +
      '</div></div></div>',

    setup(node) {
      node._state = { cfg: null, active: null, yaPoll: null, onCfg: null, onYa: null };
      if (window.L) L.ready('settings').then(function () { L.applyLang(node, 'settings'); });

      // socket.js сам шлёт loadConfig в onOpen; подписка постоянная — любой повторный
      // loadConfig/переподключение обновляет окно. Именованная функция — чтобы снять в destroy.
      node._state.onCfg = function (data) { render(node, data); };
      if (window.eventE) window.eventE.on('jsconfig', node._state.onCfg);
      if (typeof window.WSsend === 'function' && window.websocket && window.websocket.readyState === 1) {
        window.WSsend('loadConfig');
      }

      function closeDrops() { node.querySelectorAll('.s-drop').forEach(function (d) { d.hidden = true; }); }
      function toggleDrop(combo) {
        if (!combo) return;
        var drop = combo.querySelector('.s-drop');
        if (!drop) return;
        var willOpen = drop.hidden;
        closeDrops();
        if (willOpen) drop.hidden = false;
      }
      function markCur(combo, v) {
        combo.querySelectorAll('.s-opt').forEach(function (o) { o.classList.toggle('cur', o.dataset.val === v); });
      }

      node.addEventListener('click', function (e) {
        var tab = e.target.closest('[data-tab]');
        if (tab) { closeDrops(); return selectTab(node, tab.dataset.tab); }
        var pick = e.target.closest('.s-pick');
        if (pick) { toggleDrop(pick.closest('.s-combo')); return; }
        var opt = e.target.closest('.s-opt');
        if (opt) {
          var combo = opt.closest('.s-combo');
          var inp = combo && combo.querySelector('input[data-cfg]');
          if (inp) { inp.value = opt.dataset.val; markCur(combo, inp.value); comboCommit(inp.dataset.cfg, inp.value); }
          closeDrops();
          return;
        }
        if (!e.target.closest('.s-combo')) closeDrops();
        var b = e.target.closest('[data-action]');
        if (!b) return;
        var act = b.dataset.action;
        if (act === 'save') return saveAll(node);
        if (act === 'qrLogin') return startYaAuth(node);
        if (act === 'yaRegister') return regYa(node);
        if (act === 'checkUpdate') { if (typeof getUpdate === 'function') getUpdate(); return; }
        if (typeof window[act] === 'function') return window[act]();
      });

      // Коммит значения комбобокса (input + свой выпадающий список): обновить cfg и мгновенные сайд-эффекты.
      // Сайд-эффекты (смена агента/языка/onchange) — только если значение из списка,
      // чтобы опечатка в ручном вводе ничего не ломала до нажатия «Сохранить».
      function comboCommit(key, value) {
        if (!node._state) return;
        var st = node._state;
        st._comboDone = st._comboDone || {};
        if (st._comboDone[key] === value) return;
        st._comboDone[key] = value;
        setByPath(node, key, value);
        var arr = key.split('.');
        if (arr[1] === 'Board') applyBoardPreset(node, arr[0], value); // выбор платы — разложить пресет по полям
        // Ручные правки других полей Board не сбрасывают: пресет — это стартовые
        // значения, дальше пользователь волен менять скорость и т.д., плата остаётся выбранной.
        var o = (st.cfg || {})[arr[0]];
        var entry = o && o[arr[1]];
        var list = entry && entry.list;
        var valid = !list || (isBoardList(list) ? boardNames(list).indexOf(String(value)) >= 0 : list.map(String).indexOf(String(value)) >= 0);
        if (entry && entry.onchange && window[entry.onchange]) { try { window[entry.onchange](value); } catch (_) {} }
        if (arr[0] === 'APP' && arr[1] === 'agent' && value && valid) {
          if (typeof loadAgent === 'function') loadAgent(value); // мгновенная смена агента без перезагрузки
        }
        if (arr[0] === 'APP' && arr[1] === 'Lang' && value && valid && window.L) {
          L.lang = value; // мгновенная смена языка интерфейса
          L.ready('settings').then(function () {
            L.applyLang(document);
            if (window.WinEngine && window.WinEngine.applyLang) window.WinEngine.applyLang();
          });
        }
      }

      node.addEventListener('input', function (e) {
        var inp = e.target.closest && e.target.closest('.s-combo input[data-cfg]');
        if (!inp || !node._state) return;
        // Мгновенная реакция при точном совпадении со списком (выбор из выпадашки
        // или допечатали вручную). change — только при blur/Enter.
        var arr = inp.dataset.cfg.split('.');
        var sec = (node._state.cfg || {})[arr[0]];
        var entry = sec && sec[arr[1]];
        var list = entry && entry.list;
        if (!list) return;
        var names = isBoardList(list) ? boardNames(list) : list.map(String);
        if (names.indexOf(inp.value) >= 0) {
          comboCommit(inp.dataset.cfg, inp.value);
          var combo = inp.closest('.s-combo');
          if (combo) markCur(combo, inp.value);
        }
      });

      node.addEventListener('change', function (e) {
        var inp = e.target.closest && e.target.closest('.s-combo input[data-cfg]');
        if (!inp) return;
        comboCommit(inp.dataset.cfg, inp.value);
        var combo = inp.closest('.s-combo');
        if (combo) markCur(combo, inp.value);
      });

      node.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') closeDrops();
      });
      // Клик вне окна настроек — закрыть раскрытый список
      node._state.onDoc = function (ev) { if (!node.contains(ev.target)) closeDrops(); };
      document.addEventListener('pointerdown', node._state.onDoc);
    },

    destroy(node) {
      var st = node._state;
      if (st && st.yaPoll) clearInterval(st.yaPoll);
      if (window.eventE) {
        if (st && st.onCfg) window.eventE.off('jsconfig', st.onCfg);
        if (st && st.onYa) window.eventE.off('yaLogin', st.onYa);
      }
      if (st && st.onDoc) document.removeEventListener('pointerdown', st.onDoc);
      var bd = node.querySelector('.ya-backdrop');
      if (bd && bd.parentNode) bd.parentNode.removeChild(bd);
      node._state = null;
    }
  });

})();