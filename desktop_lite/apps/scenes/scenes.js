// scenes.js — виджет «Сценарии» (порт static/apps/scenes.app на WinEngine).
// Редактор сценариев: список + редактор записей (триггеры/условия/действия).
// Данные: /scenes.json (server) + localStorage «zesp_scenes», статус /api/scenes/status.
// Зависимости: socket.js (WSsend/SaveJson/eventE), zesp-globals.js (deviceList).

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function escHtml(str) {
    if (typeof str !== 'string') return String(str || '');
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function markDirty() { st._editorDirty = true; }

  // ── состояние ──
  var st = {
    scenes: [],
    scenesStatus: {},
    editingIdx: -1,
    deviceFilter: '',
    editorDirty: false,
    searchFilter: '',
    undoStack: [],
    redoStack: [],
    keyAttached: false,
    editorScene: null,
    draggedItem: null,
    fireTargetEl: null,
    fireTargetIdx: undefined,
    exiting: false
  };

  function deviceLabel(d) {
    if (!d) return '';
    return (d.Name || '?') + ' | ' + (d.Location || '?') + ' | ' + (d.IEEE || '?');
  }

  function getDeviceLabel(ieee) {
    if (!ieee) return '?';
    var DL = window.deviceList;
    if (DL && DL.length) {
      for (var i = 0; i < DL.length; i++) {
        if (DL[i] && DL[i].IEEE === ieee) return DL[i].Name || DL[i].ModelId || ieee;
      }
    }
    return ieee;
  }

  function getDeviceAttrs(ieee) {
    var attrs = [];
    var DL = window.deviceList;
    if (!ieee || !DL || !DL.length) return attrs;
    for (var i = 0; i < DL.length; i++) {
      if (DL[i] && DL[i].IEEE === ieee) {
        var dev = DL[i];
        if (dev.Report) {
          for (var key in dev.Report) {
            var rep = dev.Report[key];
            if (rep && rep.label) {
              var cur = '';
              if (rep.Parsed !== undefined && rep.Parsed !== null && rep.Parsed !== '') {
                var pv = String(rep.Parsed);
                if (pv.length > 20) pv = pv.substring(0, 20) + '…';
                cur = ' (текущ: ' + pv + ')';
              }
              attrs.push({ key: key, label: rep.label, title: cur ? rep.label + cur : '', current: cur });
            }
          }
        }
        break;
      }
    }
    return attrs;
  }

  // ── загрузка ──
  function migrateScenes(scenes) {
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (s.entries) continue;
      var oldTrig = s.triggers && s.triggers.length > 0 ? s.triggers[0] : s.trigger;
      var entry = {
        trigger: oldTrig || { type: 'device', ieee: '', attribute: '', operator: 'EQ', value: '' },
        conditions: s.conditions || [],
        actions: s.actions || []
      };
      s.entries = [entry];
      delete s.triggers;
      delete s.trigger;
      delete s.conditions;
      delete s.actions;
    }
  }

  function loadScenes() {
    var saved = localStorage.getItem('zesp_scenes');
    if (saved) {
      try { st.scenes = JSON.parse(saved); } catch (e) {}
    }
    fetch('/scenes.json').then(function (r) {
      if (!r.ok) throw new Error('not found');
      return r.text();
    }).then(function (text) {
      if (text && text.length > 2) {
        try {
          var parsed = JSON.parse(text);
          migrateScenes(parsed);
          st.scenes = parsed;
          localStorage.setItem('zesp_scenes', text);
        } catch (e) {}
      }
      renderList();
    }).catch(function () {
      renderList();
    });
    renderList();
    loadSceneStatus();
  }

  function loadSceneStatus() {
    fetch('/api/scenes/status').then(function (r) { return r.json(); }).then(function (data) {
      st.scenesStatus = data;
      renderList();
      setTimeout(loadSceneStatus, 10000);
    }).catch(function () {
      setTimeout(loadSceneStatus, 15000);
    });
  }

  function saveScenes() {
    if (st.undoStack.length >= 50) st.undoStack.shift();
    st.undoStack.push(JSON.stringify(st.scenes));
    st.redoStack = [];
    localStorage.setItem('zesp_scenes', JSON.stringify(st.scenes));
    window.SaveJson && SaveJson('/scenes.json', JSON.stringify(st.scenes, null, 2));
    renderList();
  }

  function getSceneDevices(s) {
    var devs = {};
    if (s.entries) {
      for (var i = 0; i < s.entries.length; i++) {
        var e = s.entries[i];
        if (e.trigger && e.trigger.ieee) devs[e.trigger.ieee] = true;
        if (e.conditions) {
          for (var j = 0; j < e.conditions.length; j++) {
            var c = e.conditions[j];
            if (c.ieee) devs[c.ieee] = true;
          }
        }
        if (e.actions) {
          for (var j = 0; j < e.actions.length; j++) {
            if (e.actions[j].ieee) devs[e.actions[j].ieee] = true;
          }
        }
      }
    }
    return Object.keys(devs);
  }

  function describeTrigger(t) {
    if (!t) return '—';
    var type = t.type || 'on_event';
    if (type === 'time') {
      var days = t.daysOfWeek;
      var dayStr = '';
      if (days && days !== '*') dayStr = ' [' + days + ']';
      return '🕐 ' + (t.time || '08:00') + dayStr;
    }
    if (type === 'date') return '📅 ' + (t.date || '') + (t.repeat && t.repeat !== 'none' ? ' (' + t.repeat + ')' : '');
    if (type === 'on_msg') return '📨 Telegram: ' + (t.chatId || '?') + (t.msgFilter ? ' [' + t.msgFilter + ']' : '');
    if (type === 'on_topic') return '📡 MQTT: ' + (t.topic || '?');
    if (type === 'device' && t.ieee) {
      var label = getDeviceLabel(t.ieee);
      var attr = t.attribute || '—';
      var opMap = { EQ: '=', NEQ: '≠', GT: '>', LT: '<', GTE: '≥', LTE: '≤' };
      return '🔧 ' + label + ' → ' + attr + ' ' + (opMap[t.operator] || t.operator) + ' ' + (t.value || '');
    }
    if (t.ieee) {
      var label = getDeviceLabel(t.ieee);
      var attr = t.attribute || '—';
      return '📊 ' + label + ' → ' + attr;
    }
    return '⚡ ' + type;
  }

  function describeActions(actions) {
    if (!actions || actions.length === 0) return '—';
    var parts = [];
    for (var i = 0; i < Math.min(actions.length, 3); i++) {
      var a = actions[i];
      if (a.type === 'send_cmd') {
        var label = getDeviceLabel(a.ieee);
        var val = a.value || '';
        if (a.use_trigger_value) {
          val = '🔁' + (val ? '(' + val + ')' : '');
          if (a.trigger_value_transform) val += ' ' + a.trigger_value_transform;
        }
        parts.push(label + '/' + (a.command || '—') + '=' + val);
      } else if (a.type === 'mqtt') {
        var mqttVal = a.topic || '—';
        if (a.use_trigger_value) mqttVal += ' 🔁';
        parts.push('MQTT: ' + mqttVal);
      } else if (a.type === 'telegram') {
        parts.push('📨 TG' + (a.use_trigger_value ? ' 🔁' : ''));
      } else if (a.type === 'http') {
        parts.push('🌐 HTTP' + (a.use_trigger_value ? ' 🔁' : ''));
      } else if (a.type === 'speaker_tts') {
        var label = getDeviceLabel(a.speaker_id);
        var volStr = a.volume ? ' [' + a.volume + '%]' : '';
        parts.push('🔊 ' + label + ' сказать' + volStr + (a.use_trigger_value ? ' 🔁' : ''));
      } else if (a.type === 'speaker_play') {
        var label = getDeviceLabel(a.speaker_id);
        var volStr = a.volume ? ' [' + a.volume + '%]' : '';
        parts.push('🎵 ' + label + ' ' + (a.url || '—') + volStr);
      } else if (a.type === 'speaker_volume') {
        var label = getDeviceLabel(a.speaker_id);
        parts.push('🔊 ' + label + ' громкость=' + (a.volume || '—') + '%');
      } else if (a.type === 'group') {
        parts.push('📦[' + (a.children ? a.children.length : 0) + ']');
      } else if (a.type === 'delay') {
        parts.push('⏱' + (a.delay_ms || '0') + 'ms');
      } else if (a.type === 'if') {
        var c = a.conditions ? a.conditions.length : 0;
        var tn = a.then_actions ? a.then_actions.length : 0;
        var en = a.else_actions ? a.else_actions.length : 0;
        var desc = '🔀 (' + c + ' усл.) → ' + tn + ' д.';
        if (en > 0) desc += ' | иначе ' + en + ' д.';
        parts.push(desc);
      }
      var mod = '';
      if (a.delay_ms) mod += '⏱' + a.delay_ms + 'ms';
      if (a.repeat) mod += (mod ? ' ' : '') + '×' + a.repeat;
      if (a.gap_ms) mod += (mod ? ' ' : '') + 'gap' + a.gap_ms;
      if (a.enabled === false) mod += (mod ? ' ' : '') + '⊘';
      if (mod) parts[parts.length - 1] += '(' + mod + ')';
    }
    if (actions.length > 3) parts.push('…');
    return parts.join('; ');
  }

  function buildDeviceFilter() {
    var sel = $('sc_device_filter');
    if (!sel) return;
    sel.innerHTML = '<option value="">Все устройства</option>';
    var seen = {};
    for (var i = 0; i < st.scenes.length; i++) {
      var devs = getSceneDevices(st.scenes[i]);
      for (var j = 0; j < devs.length; j++) {
        var ieee = devs[j];
        if (seen[ieee]) continue;
        seen[ieee] = true;
        var label = getDeviceLabel(ieee);
        sel.innerHTML += '<option value="' + escHtml(ieee) + '">' + escHtml(label) + '</option>';
      }
    }
    if (st.deviceFilter && !seen[st.deviceFilter]) {
      var label = getDeviceLabel(st.deviceFilter);
      sel.innerHTML += '<option value="' + escHtml(st.deviceFilter) + '">' + escHtml(label) + '</option>';
    }
    sel.value = st.deviceFilter || '';
  }

  function renderList() {
    var container = $('sc_list');
    if (!container) return;
    buildDeviceFilter();
    if (!st.scenes || st.scenes.length === 0) {
      container.innerHTML = '<div class="sc-empty">Нет сценариев.<br/>Нажмите <strong>+ Сценарий</strong>, чтобы создать первый.</div>';
      return;
    }
    var html = '';
    var filteredCount = 0;
    for (var i = 0; i < st.scenes.length; i++) {
      var s = st.scenes[i];
      if (st.deviceFilter) {
        var devs = getSceneDevices(s);
        if (devs.indexOf(st.deviceFilter) === -1) continue;
      }
      if (st.searchFilter) {
        var sname = (s.name || '').toLowerCase();
        if (sname.indexOf(st.searchFilter.toLowerCase()) === -1) continue;
      }
      filteredCount++;
      html += '<div class="sc-card' + (s.enabled === false ? ' sc-disabled' : '') + '" data-idx="' + i + '">';
      html += '<div class="sc-card-top">';
      html += '<div class="sc-card-name">' + escHtml(s.name || 'Без имени') + '</div>';
      html += '<label class="sc-toggle">';
      html += '<input type="checkbox"' + (s.enabled !== false ? ' checked' : '') + ' data-idx="' + i + '" onchange="scToggleScene(this)">';
      html += '<span class="sc-toggle-slider"></span>';
      html += '</label>';
      html += '</div>';
      if (s.entries && s.entries.length > 0) {
        var first = s.entries[0];
        html += '<div class="sc-card-trigger"><span class="sc-label">Триггер:</span> ' + escHtml(describeTrigger(first.trigger)) + '</div>';
        if (first.actions && first.actions.length > 0) {
          html += '<div class="sc-card-actions"><span class="sc-label">Действия:</span> ' + escHtml(describeActions(first.actions)) + '</div>';
        }
      }
      html += '<div class="sc-card-footer">';
      html += '<button class="sc-btn sc-btn-sm sc-btn-play" onclick="event.stopPropagation();scTestFire(' + i + ',this)" title="Выполнить сценарий сейчас (игнорирует триггеры)">▶</button>';
      html += '<button class="sc-btn sc-btn-sm" onclick="scEditScene(' + i + ')">Править</button>';
      html += '<button class="sc-btn sc-btn-sm" onclick="scDuplicateScene(' + i + ')" title="Создать копию">⧉ Дублировать</button>';
      html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scDeleteScene(' + i + ')">Удалить</button>';
      html += '</div>';
      var status = st.scenesStatus && st.scenesStatus[s.id];
      if (status && status.last_fired) {
        var fired = new Date(status.last_fired);
        var ago = Math.round((Date.now() - fired.getTime()) / 1000);
        var agoStr = ago < 60 ? ago + 'с' : ago < 3600 ? Math.round(ago / 60) + 'м' : Math.round(ago / 3600) + 'ч';
        html += '<div class="sc-last-fired" title="Последнее срабатывание: ' + fired.toLocaleString() + '">🕐 ' + agoStr + ' назад</div>';
      }
      html += '</div>';
    }
    if (filteredCount === 0 && st.deviceFilter) {
      container.innerHTML = '<div class="sc-empty">Нет сценариев с этим устройством.</div>';
    } else {
      container.innerHTML = '<div class="sc-grid">' + html + '</div>';
    }
  }

  // ── render entry (триггеры/условия/действия) ──
  var TRIGGER_TYPES = [
    ['on_event', '⚡ on_event (репорт)', 'Срабатывает при любом репорте устройства по IEEE (и атрибуту, если выбран). Значение не сравнивается'],
    ['on_change', '🔄 on_change (изменение)', 'Срабатывает только если значение атрибута изменилось с прошлого репорта'],
    ['device', '🔧 Устройство (=)', 'Срабатывает при репорте устройства и совпадении значения по оператору (=, ≠, >, <, ≥, ≤)'],
    ['on_msg', '📨 Telegram', 'Срабатывает на входящее сообщение Telegram (chatID + подстрока в тексте)'],
    ['on_topic', '📡 MQTT', 'Срабатывает на MQTT-сообщение (topic + wildcard +/# и подстрока в payload)'],
    ['time', '🕐 Время', 'Срабатывает в указанное время по расписанию дней недели'],
    ['date', '📅 Дата', 'Срабатывает в конкретную дату, с режимом повторения: разово/ежедневно/ежемесячно/ежегодно']
  ];
  var OPS = [['EQ', '='], ['NEQ', '≠'], ['GT', '>'], ['LT', '<'], ['GTE', '≥'], ['LTE', '≤']];

  function devOptions(selected) {
    var html = '<option value="">— устройство —</option>';
    var DL = window.deviceList;
    if (DL && DL.length) {
      for (var j = 0; j < DL.length; j++) {
        var d = DL[j];
        if (!d) continue;
        html += '<option value="' + escHtml(d.IEEE) + '"' + (d.IEEE === selected ? ' selected' : '') + '>' + escHtml(deviceLabel(d)) + '</option>';
      }
    }
    return html;
  }

  function attrOptions(ieee, selected) {
    var html = '<option value="">— атрибут —</option>';
    if (ieee) {
      var attrs = getDeviceAttrs(ieee);
      for (var j = 0; j < attrs.length; j++) {
        html += '<option value="' + escHtml(attrs[j].key) + '"' + (attrs[j].key === selected ? ' selected' : '') + '>' + escHtml(attrs[j].label) + (attrs[j].title ? ' title="' + escHtml(attrs[j].title) + '"' : '') + '</option>';
      }
    }
    return html;
  }

  function opOptions(selected) {
    var html = '';
    for (var j = 0; j < OPS.length; j++) {
      html += '<option value="' + OPS[j][0] + '"' + (OPS[j][0] === (selected || 'EQ') ? ' selected' : '') + '>' + OPS[j][1] + '</option>';
    }
    return html;
  }

  function renderTriggerFields(t) {
    var type = t.type || 'on_event';
    var html = '';
    if (type === 'time') {
      html += '<input class="sc-ent-trig-time" type="time" value="' + escHtml(t.time || '08:00') + '">';
      html += '<span class="sc-now-btn" onclick="scSetServerTime(this)">🕐 сейчас</span>';
      html += '<span style="color:var(--faint);font-size:11px;">дни:</span>';
      html += '<span class="sc-dow-presets"><button type="button" class="sc-dow-preset" onclick="scDowPreset(this,\'weekdays\')" title="Будни Пн–Пт">Будни</button><button type="button" class="sc-dow-preset" onclick="scDowPreset(this,\'weekend\')" title="Сб, Вс">Вых</button><button type="button" class="sc-dow-preset" onclick="scDowPreset(this,\'all\')" title="Все дни">Все</button></span>';
      var days = [['1', 'Пн'], ['2', 'Вт'], ['3', 'Ср'], ['4', 'Чт'], ['5', 'Пт'], ['6', 'Сб'], ['0', 'Вс']];
      var dayMap = {};
      if (t.daysOfWeek && t.daysOfWeek !== '*') {
        var parts = t.daysOfWeek.split(',');
        for (var d = 0; d < parts.length; d++) dayMap[parts[d].trim()] = true;
      }
      for (var d = 0; d < days.length; d++) {
        var checked = (t.daysOfWeek === '*' || dayMap[days[d][0]]) ? ' checked' : '';
        html += '<label class="sc-day-cb"><input type="checkbox" class="sc-ent-trig-dow" value="' + days[d][0] + '"' + checked + '><span class="sc-day-btn">' + days[d][1] + '</span></label>';
      }
    } else if (type === 'date') {
      html += '<input class="sc-ent-trig-date" type="date" value="' + escHtml(t.date || '') + '">';
      html += '<select class="sc-ent-trig-repeat">';
      var rpts = [['none', 'Однократно'], ['daily', 'Ежедневно'], ['monthly', 'Ежемесячно'], ['yearly', 'Ежегодно']];
      for (var i = 0; i < rpts.length; i++) {
        html += '<option value="' + rpts[i][0] + '"' + (rpts[i][0] === (t.repeat || 'none') ? ' selected' : '') + '>' + rpts[i][1] + '</option>';
      }
      html += '</select>';
    } else if (type === 'on_msg') {
      html += '<input class="sc-ent-trig-chatid" type="text" placeholder="Chat ID" value="' + escHtml(t.chatId || '') + '">';
      html += '<input class="sc-ent-trig-msgfilter" type="text" placeholder="фильтр" value="' + escHtml(t.msgFilter || '') + '" style="flex:1;">';
    } else if (type === 'on_topic') {
      html += '<input class="sc-ent-trig-topic" type="text" placeholder="топик (+/#)" value="' + escHtml(t.topic || '') + '" style="width:180px;">';
      html += '<input class="sc-ent-trig-topicfilter" type="text" placeholder="фильтр" value="' + escHtml(t.topicFilter || '') + '" style="flex:1;">';
    } else {
      html += '<select class="sc-ent-trig-device">' + devOptions(t.ieee) + '</select>';
      html += '<select class="sc-ent-trig-attr">' + attrOptions(t.ieee, t.attribute) + '</select>';
      if (type === 'device') {
        html += '<select class="sc-ent-trig-op">' + opOptions(t.operator) + '</select>';
        html += '<input class="sc-ent-trig-val" type="text" placeholder="знач" value="' + escHtml(t.value || '') + '">';
      }
    }
    return html;
  }

  function renderEntryCond(idx, c, triggerIeee) {
    var html = '<div class="sc-ent-cond-item' + (c.negate ? ' sc-cond-negated' : '') + '" data-saved-attr="' + escHtml(c.attribute || '') + '">';
    html += '<label class="sc-checkbox-label" title="Инвертировать условие (NOT)"><input type="checkbox" class="sc-ent-cond-negate" ' + (c.negate ? 'checked' : '') + ' onchange="scCondNegateToggle(this)"><span>¬</span></label>';
    html += '<select class="sc-ent-cond-type" onchange="scCondTypeChange(this)">';
    html += '<option value="device"' + (c.type === 'device' ? ' selected' : '') + ' title="Проверить текущее состояние атрибута другого устройства">🔧 устройство</option>';
    html += '<option value="trigger_device"' + (c.type === 'trigger_device' ? ' selected' : '') + ' title="Проверить состояние устройства-источника триггера (по его IEEE)">🔁 то же устройство</option>';
    html += '<option value="telegram"' + (c.type === 'telegram' ? ' selected' : '') + ' title="Проверить последнее сообщение Telegram в этом chatID">📨 Telegram</option>';
    html += '<option value="mqtt"' + (c.type === 'mqtt' ? ' selected' : '') + ' title="Проверить последнее сообщение в этом MQTT topic">📡 MQTT</option>';
    html += '<option value="time"' + (c.type === 'time' ? ' selected' : '') + ' title="Проверить, что текущее время в диапазоне (поддержка перехода через полночь 22:00–07:00)">🕐 время</option>';
    html += '</select>';

    if (c.type === 'telegram') {
      html += '<input class="sc-ent-cond-chatid" type="text" placeholder="Chat ID" value="' + escHtml(c.chatId || '') + '" style="width:90px;">';
    } else if (c.type === 'mqtt') {
      html += '<input class="sc-ent-cond-topic" type="text" placeholder="Топик" value="' + escHtml(c.topic || '') + '" style="width:140px;">';
    } else if (c.type === 'time') {
      html += '<span style="color:var(--faint);font-size:11px;">с</span>';
      html += '<input class="sc-ent-cond-tstart" type="time" value="' + escHtml(c.time_start || '22:00') + '" style="width:90px;" title="Начало диапазона (включительно)">';
      html += '<span style="color:var(--faint);font-size:11px;">по</span>';
      html += '<input class="sc-ent-cond-tend" type="time" value="' + escHtml(c.time_end || '07:00') + '" style="width:90px;" title="Конец диапазона. Если меньше начала — диапазон переходит через полночь">';
    } else if (c.type === 'trigger_device') {
      html += '<select class="sc-ent-cond-attr">' + attrOptions(triggerIeee || '', c.attribute) + '</select>';
    } else {
      html += '<select class="sc-ent-cond-device" onchange="scCondDeviceChange(this)">' + devOptions(c.ieee) + '</select>';
      html += '<select class="sc-ent-cond-attr">' + attrOptions(c.ieee, c.attribute) + '</select>';
    }

    if (c.type !== 'time') {
      html += '<select class="sc-ent-cond-op">' + opOptions(c.operator) + '</select>';
      html += '<input class="sc-ent-cond-val" type="text" placeholder="знач" value="' + escHtml(c.value || '') + '" style="width:60px;">';
    }
    html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scRemoveCond(this)">✕</button>';
    html += '</div>';
    return html;
  }

  var ACTION_TYPES = [
    ['send_cmd', '🔧 send_cmd', 'Отправить Zigbee команду на устройство (включить/выключить/значение)'],
    ['mqtt', '📡 mqtt', 'Опубликовать MQTT-сообщение в topic; {{trigger}} подставит значение триггера'],
    ['telegram', '📨 telegram', 'Отправить сообщение в Telegram; {{trigger}} подставит значение триггера'],
    ['http', '🌐 http', 'HTTP GET на URL; {{trigger}} подставит значение триггера'],
    ['speaker_tts', '🔊 сказать', 'Yandex-колонка: проговорить текст с заданной громкостью'],
    ['speaker_play', '🎵 воспроизвести', 'Yandex-колонка: воспроизвести аудио по URL'],
    ['speaker_volume', '🔊 громкость', 'Yandex-колонка: установить громкость (0-100)'],
    ['group', '📦 group', 'Контейнер вложенных действий с delay/repeat/gap — выполняет children последовательно'],
    ['delay', '⏱ delay', 'Пауза перед следующим действием (в миллисекундах)'],
    ['if', '🔀 Если… (условие)', 'Если условие верно — выполнить одни действия, иначе — другие']
  ];

  function speakerOptions(selected) {
    var html = '<option value="">— колонка —</option>';
    var DL = window.deviceList;
    if (DL && DL.length) {
      for (var j = 0; j < DL.length; j++) {
        var d = DL[j];
        if (!d || d.DevType !== 'YAM') continue;
        html += '<option value="' + escHtml(d.IEEE) + '"' + (d.IEEE === selected ? ' selected' : '') + '>' + escHtml(deviceLabel(d)) + '</option>';
      }
    }
    return html;
  }

  function triggerValCheckbox(checked, labelText) {
    return '<label class="sc-checkbox-label">' +
      '<input type="checkbox" class="sc-use-trigger-val" ' + (checked ? 'checked' : '') + ' onchange="scToggleTriggerValue(this)">' +
      '<span>' + labelText + '</span></label>';
  }

  function renderEntryAction(idx, a) {
    var html = '<div class="sc-ent-action-item' + (a.type === 'group' ? ' sc-ent-action-group' : '') + (a.enabled === false ? ' sc-ent-action-disabled' : '') + '">';
    html += '<label class="sc-enable-label"><input type="checkbox" class="sc-ent-action-enable" ' + (a.enabled !== false ? 'checked' : '') + ' onchange="scToggleActionEnable(this)"></label>';
    html += '<select class="sc-ent-action-type sc-act-type-' + (a.type || 'send_cmd') + '" onchange="scActionTypeChange(this)">';
    for (var ati = 0; ati < ACTION_TYPES.length; ati++) {
      html += '<option value="' + ACTION_TYPES[ati][0] + '"' + (a.type === ACTION_TYPES[ati][0] ? ' selected' : '') + ' title="' + escHtml(ACTION_TYPES[ati][2]) + '">' + ACTION_TYPES[ati][1] + '</option>';
    }
    html += '</select>';

    if (a.type === 'group') {
      html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scRemoveAction(this)">✕</button>';
      html += '<div class="sc-ent-action-modifiers">';
      html += '<label class="sc-mod-label">delay<input class="sc-ent-action-delay" type="number" min="0" value="' + (a.delay_ms || '') + '" style="width:65px;">ms</label>';
      html += '<label class="sc-mod-label">repeat<input class="sc-ent-action-repeat" type="number" min="0" value="' + (a.repeat || '') + '" style="width:50px;"></label>';
      html += '<label class="sc-mod-label">gap<input class="sc-ent-action-gap" type="number" min="0" value="' + (a.gap_ms || '') + '" style="width:60px;">ms</label>';
      html += '</div>';
      html += '<div class="sc-ent-action-children">';
      if (a.children) {
        for (var ci = 0; ci < a.children.length; ci++) html += renderEntryAction(ci, a.children[ci]);
      }
      html += '<button class="sc-btn sc-btn-sm" onclick="scAddChildAction(this)">➕ вложенное</button>';
      html += '</div>';
    } else if (a.type === 'delay') {
      html += '<label class="sc-mod-label">⏱ пауза<input class="sc-ent-action-delay" type="number" min="0" value="' + (a.delay_ms || '') + '" style="width:70px;" title="миллисекунды (1000 = 1с, 60000 = 1мин)">ms</label>';
      html += '<span class="sc-delay-quick"><button type="button" class="sc-dq-btn" onclick="scDelayQuick(this,1000)" title="1 секунда">1с</button><button type="button" class="sc-dq-btn" onclick="scDelayQuick(this,10000)" title="10 секунд">10с</button><button type="button" class="sc-dq-btn" onclick="scDelayQuick(this,60000)" title="1 минута">1м</button><button type="button" class="sc-dq-btn" onclick="scDelayQuick(this,300000)" title="5 минут">5м</button></span>';
      html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scRemoveAction(this)">✕</button>';
    } else if (a.type === 'if') {
      html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scRemoveAction(this)">✕</button>';
      html += '<div class="sc-ent-action-conds" style="margin-top:4px;">';
      var condCnt = a.conditions && a.conditions.length > 0;
      if (condCnt) {
        for (var ci = 0; ci < a.conditions.length; ci++) html += renderEntryCond(ci, a.conditions[ci], '');
      } else {
        html += '<div style="font-size:11px;color:var(--muted);padding:2px 0 4px 0;">→ нет условий (всегда верно)</div>';
      }
      html += '<button class="sc-btn sc-btn-sm" onclick="scActionAddCond(this)">➕ Условие</button>';
      html += '</div>';
      html += '<div class="sc-ent-action-then">';
      html += '<span class="sc-sub-label">✅ Тогда</span>';
      if (a.then_actions) {
        for (var ti = 0; ti < a.then_actions.length; ti++) html += renderEntryAction(ti, a.then_actions[ti]);
      }
      html += '<button class="sc-btn sc-btn-sm" onclick="scAddThenAction(this)">➕ Действие (тогда)</button>';
      html += '</div>';
      var hasElse = a.else_actions && a.else_actions.length > 0;
      html += '<div class="sc-ent-action-else' + (hasElse ? '' : ' sc-else-empty') + '">';
      html += '<span class="sc-sub-label">❌ Иначе</span>';
      if (hasElse) {
        for (var ei = 0; ei < a.else_actions.length; ei++) html += renderEntryAction(ei, a.else_actions[ei]);
      }
      html += '<button class="sc-btn sc-btn-sm" onclick="scAddElseAction(this)">➕ Действие (иначе)</button>';
      html += '</div>';
    } else if (a.type === 'send_cmd') {
      html += '<select class="sc-ent-action-device" onchange="scActionDeviceChange(this)">' + devOptions(a.ieee) + '</select>';
      html += '<select class="sc-ent-action-cmd">' + attrOptions(a.ieee, a.command) + '</select>';
      html += '<input class="sc-ent-action-val" type="text" placeholder="знач" value="' + escHtml(a.value || '') + '" style="width:60px;">';
      html += triggerValCheckbox(a.use_trigger_value, '🔁 из триггера');
      html += '<div class="sc-transform-group" style="display:' + (a.use_trigger_value ? 'inline-flex' : 'none') + ';">';
      html += '<select class="sc-trigger-transform" style="width:90px;">';
      var transforms = [['', 'без измен.'], ['add', '➕ +'], ['subtract', '➖ -'], ['multiply', '✖️ ×'], ['divide', '➗ ÷'], ['round', '🔵 округл.'], ['percent', '📊 %'], ['invert', '🔄 инверт. 0↔1']];
      for (var tj = 0; tj < transforms.length; tj++) {
        html += '<option value="' + transforms[tj][0] + '"' + (a.trigger_value_transform === transforms[tj][0] ? ' selected' : '') + '>' + transforms[tj][1] + '</option>';
      }
      html += '</select>';
      html += '<input type="number" class="sc-transform-param" placeholder="парам" value="' + (a.trigger_value_param || '') + '" step="any" style="width:60px;">';
      html += '</div>';
    } else if (a.type === 'mqtt') {
      html += '<input class="sc-ent-action-topic" type="text" placeholder="топик" value="' + escHtml(a.topic || '') + '" style="width:140px;">';
      html += '<input class="sc-ent-action-msg" type="text" placeholder="сообщение" value="' + escHtml(a.message || '') + '" style="flex:1;">';
      html += triggerValCheckbox(a.use_trigger_value, '🔁 вставить {{trigger}}');
    } else if (a.type === 'telegram') {
      html += '<input class="sc-ent-action-text" type="text" placeholder="текст" value="' + escHtml(a.text || '') + '" style="flex:1;">';
      html += triggerValCheckbox(a.use_trigger_value, '🔁 вставить {{trigger}}');
    } else if (a.type === 'http') {
      html += '<input class="sc-ent-action-url" type="text" placeholder="URL" value="' + escHtml(a.url || '') + '" style="flex:1;">';
      html += triggerValCheckbox(a.use_trigger_value, '🔁 вставить {{trigger}}');
    } else if (a.type === 'speaker_tts') {
      html += '<select class="sc-ent-action-speaker">' + speakerOptions(a.speaker_id) + '</select>';
      html += '<input class="sc-ent-action-text" type="text" placeholder="текст" value="' + escHtml(a.text || '') + '" style="flex:1;">';
      html += '<input class="sc-ent-action-vol" type="number" placeholder="громк 0-100" value="' + (a.volume || '') + '" min="0" max="100" style="width:80px;">';
      html += triggerValCheckbox(a.use_trigger_value, '🔁 вставить {{trigger}}');
    } else if (a.type === 'speaker_play') {
      html += '<select class="sc-ent-action-speaker">' + speakerOptions(a.speaker_id) + '</select>';
      html += '<select class="sc-ent-action-sound" onchange="scSoundPick(this)"><option value="">— файл из wav/ —</option></select>';
      html += '<input class="sc-ent-action-url" type="text" placeholder="URL аудио" value="' + escHtml(a.url || '') + '" style="flex:1;">';
      html += '<button class="sc-btn sc-btn-sm" onclick="scReloadSounds(this)">📂</button>';
      html += '<input class="sc-ent-action-vol" type="number" placeholder="громк 0-100" value="' + (a.volume || '') + '" min="0" max="100" style="width:80px;">';
    } else if (a.type === 'speaker_volume') {
      html += '<select class="sc-ent-action-speaker">' + speakerOptions(a.speaker_id) + '</select>';
      html += '<input class="sc-ent-action-vol" type="number" placeholder="громк 0-100" value="' + (a.volume || '') + '" min="0" max="100" style="width:80px;">';
    }
    html += '<button class="sc-btn sc-btn-sm sc-btn-del" onclick="scRemoveAction(this)">✕</button>';
    html += '</div>';
    return html;
  }

  function renderEntry(idx, e, triggerIeee) {
    var t = e.trigger || {};
    var type = t.type || 'on_event';
    var html = '';
    html += '<div class="sc-entry" data-idx="' + idx + '" draggable="true">';
    html += '<div class="sc-entry-header">';
    html += '<span class="sc-entry-num">#' + (idx + 1) + '</span>';
    html += '<span class="sc-entry-title">Триггер</span>';
    html += '<select class="sc-ent-trig-type" onchange="scTrigTypeChange(this)">';
    for (var i = 0; i < TRIGGER_TYPES.length; i++) {
      html += '<option value="' + TRIGGER_TYPES[i][0] + '"' + (TRIGGER_TYPES[i][0] === type ? ' selected' : '') + ' title="' + escHtml(TRIGGER_TYPES[i][2]) + '">' + TRIGGER_TYPES[i][1] + '</option>';
    }
    html += '</select>';
    html += '</div>';
    html += '<div class="sc-entry-trigger">' + renderTriggerFields(t) + '</div>';
    html += '<div class="sc-entry-conditions">';
    html += '<div class="sc-entry-subheader"><span>📋 Доп. проверки для записи</span><select class="sc-ent-cond-mode" onchange="scMarkDirty()" title="«И» — все условия должны выполняться; «ИЛИ» — достаточно любого одного"><option value="AND"' + ((e.conditionsMode || 'AND') === 'AND' ? ' selected' : '') + '>И (все)</option><option value="OR"' + (e.conditionsMode === 'OR' ? ' selected' : '') + '>ИЛИ (любое)</option></select><button class="sc-btn sc-btn-sm" onclick="scAddCond(this)">+</button></div>';
    html += '<div class="sc-ent-cond-list">';
    if (e.conditions) {
      for (var i = 0; i < e.conditions.length; i++) {
        var cond = e.conditions[i];
        var triggerIeeeForCond = (cond.type === 'trigger_device') ? triggerIeee : '';
        html += renderEntryCond(i, cond, triggerIeeeForCond);
      }
    }
    html += '</div>';
    html += '</div>';
    html += '<div class="sc-entry-actions">';
    html += '<div class="sc-entry-subheader"><span>⚡ Действия</span><button class="sc-btn sc-btn-sm" onclick="scAddAction(this)">+</button></div>';
    html += '<div class="sc-ent-action-list">';
    if (e.actions) {
      for (var i = 0; i < e.actions.length; i++) html += renderEntryAction(i, e.actions[i]);
    }
    html += '</div>';
    html += '</div>';
    html += '<button class="sc-btn sc-btn-sm" onclick="scDuplicateEntry(this)" title="Создать копию этой записи сразу после">⧉ Дублировать</button>';
    html += '<button class="sc-btn sc-btn-sm sc-btn-del sc-entry-del" onclick="scRemoveEntry(this)">✕ удалить запись</button>';
    html += '</div>';
    return html;
  }

  // ── editor: entries ──
  function getTriggerIeee(entry) {
    var devSel = entry.querySelector('.sc-ent-trig-device');
    if (devSel) return devSel.value;
    return '';
  }

  function entReindex() {
    var nums = document.querySelectorAll('#sc_entries .sc-entry-num');
    for (var i = 0; i < nums.length; i++) nums[i].textContent = '#' + (i + 1);
  }

  function addEntry() {
    var container = $('sc_entries');
    if (!container) return;
    var idx = container.children.length;
    var e = { trigger: { type: 'on_event', ieee: '', attribute: '', operator: 'EQ', value: '' }, conditions: [], actions: [] };
    var div = document.createElement('div');
    div.innerHTML = renderEntry(idx, e, '');
    while (div.children.length > 0) container.appendChild(div.children[0]);
    reindexAll();
    reattachActions(container);
  }
  function removeEntry(el) {
    var entry = el.closest('.sc-entry');
    if (entry) entry.remove();
    reindexAll();
    reattachActions($('sc_entries'));
  }
  function duplicateEntry(el) {
    var entry = el.closest('.sc-entry');
    if (!entry) return;
    var container = entry.parentNode;
    var single = readEntry(entry);
    if (!single) return;
    single.trigger = single.trigger || { type: 'on_event', ieee: '', attribute: '', operator: 'EQ', value: '' };
    var idx = Array.prototype.indexOf.call(container.children, entry);
    var div = document.createElement('div');
    div.innerHTML = renderEntry(idx + 1, single, single.trigger.ieee || '');
    var newNode = div.firstElementChild;
    if (newNode) container.insertBefore(newNode, entry.nextSibling);
    reindexAll();
    reattachActions(container);
    fillTriggerDeviceAttrs(container);
    markDirty();
  }
  function readEntry(entryEl) {
    var trigger = readEntryTrigger(entryEl);
    var conditions = [];
    var condItems = entryEl.querySelectorAll('.sc-ent-cond-item');
    for (var j = 0; j < condItems.length; j++) {
      var c = readEntryCond(condItems[j]);
      if (c) conditions.push(c);
    }
    var actions = [];
    var allItems = entryEl.querySelectorAll('.sc-ent-action-item');
    for (var j = 0; j < allItems.length; j++) {
      if (allItems[j].closest('.sc-ent-action-children') || allItems[j].closest('.sc-ent-action-then') || allItems[j].closest('.sc-ent-action-else')) continue;
      var a = readEntryAction(allItems[j]);
      if (a) actions.push(a);
    }
    if (actions.length === 0) return null;
    return { trigger: trigger, conditions: conditions, actions: actions };
  }
  function readEntriesFromForm() {
    var entries = document.querySelectorAll('#sc_entries .sc-entry');
    var result = [];
    for (var i = 0; i < entries.length; i++) {
      var e = entries[i];
      var trigger = readEntryTrigger(e);
      var conditions = [];
      var condItems = e.querySelectorAll(':scope > .sc-entry-conditions .sc-ent-cond-item');
      if (condItems.length === 0) condItems = e.querySelectorAll('.sc-ent-cond-item');
      for (var j = 0; j < condItems.length; j++) {
        var c = readEntryCond(condItems[j]);
        if (c) conditions.push(c);
      }
      var mode = readEntryCondMode(e);
      var actions = [];
      var allItems = e.querySelectorAll('.sc-ent-action-item');
      for (var j = 0; j < allItems.length; j++) {
        if (allItems[j].closest('.sc-ent-action-children') || allItems[j].closest('.sc-ent-action-then') || allItems[j].closest('.sc-ent-action-else')) continue;
        var a = readEntryAction(allItems[j]);
        if (a) actions.push(a);
      }
      if (actions.length > 0) {
        var entry = { trigger: trigger, conditions: conditions, actions: actions };
        if (mode && mode !== 'AND') entry.conditionsMode = mode;
        var orig = st.editorScene && st.editorScene.entries && st.editorScene.entries[i];
        if (orig && orig.throttle_ms > 0) entry.throttle_ms = orig.throttle_ms;
        result.push(entry);
      }
    }
    return result;
  }
  function readEntryTrigger(entry) {
    var type = (entry.querySelector('.sc-ent-trig-type') || {}).value || 'on_event';
    var t = { type: type };
    if (type === 'time') {
      t.time = (entry.querySelector('.sc-ent-trig-time') || {}).value || '08:00';
      var cbs = entry.querySelectorAll('.sc-ent-trig-dow:checked');
      var vals = [];
      for (var i = 0; i < cbs.length; i++) vals.push(cbs[i].value);
      t.daysOfWeek = vals.length === 7 ? '*' : vals.sort().join(',');
    } else if (type === 'date') {
      t.date = (entry.querySelector('.sc-ent-trig-date') || {}).value || '';
      t.repeat = (entry.querySelector('.sc-ent-trig-repeat') || {}).value || 'none';
    } else if (type === 'on_msg') {
      t.chatId = (entry.querySelector('.sc-ent-trig-chatid') || {}).value || '';
      t.msgFilter = (entry.querySelector('.sc-ent-trig-msgfilter') || {}).value || '';
    } else if (type === 'on_topic') {
      t.topic = (entry.querySelector('.sc-ent-trig-topic') || {}).value || '';
      t.topicFilter = (entry.querySelector('.sc-ent-trig-topicfilter') || {}).value || '';
    } else {
      t.ieee = (entry.querySelector('.sc-ent-trig-device') || {}).value || '';
      t.attribute = (entry.querySelector('.sc-ent-trig-attr') || {}).value || '';
      if (type === 'device') {
        t.operator = (entry.querySelector('.sc-ent-trig-op') || {}).value || 'EQ';
        t.value = (entry.querySelector('.sc-ent-trig-val') || {}).value || '';
      }
    }
    return t;
  }
  function readEntryCond(item) {
    var type = (item.querySelector('.sc-ent-cond-type') || {}).value || 'device';
    var c = { type: type };
    var negEl = item.querySelector('.sc-ent-cond-negate');
    if (negEl && negEl.checked) c.negate = true;
    if (type === 'telegram') {
      c.chatId = (item.querySelector('.sc-ent-cond-chatid') || {}).value || '';
      c.operator = (item.querySelector('.sc-ent-cond-op') || {}).value || 'EQ';
      c.value = (item.querySelector('.sc-ent-cond-val') || {}).value || '';
      if (!c.chatId) return null;
    } else if (type === 'mqtt') {
      c.topic = (item.querySelector('.sc-ent-cond-topic') || {}).value || '';
      c.operator = (item.querySelector('.sc-ent-cond-op') || {}).value || 'EQ';
      c.value = (item.querySelector('.sc-ent-cond-val') || {}).value || '';
      if (!c.topic) return null;
    } else if (type === 'time') {
      c.time_start = (item.querySelector('.sc-ent-cond-tstart') || {}).value || '';
      c.time_end = (item.querySelector('.sc-ent-cond-tend') || {}).value || '';
      if (!c.time_start) return null;
    } else if (type === 'trigger_device') {
      c.attribute = (item.querySelector('.sc-ent-cond-attr') || {}).value || '';
      c.operator = (item.querySelector('.sc-ent-cond-op') || {}).value || 'EQ';
      c.value = (item.querySelector('.sc-ent-cond-val') || {}).value || '';
      if (!c.attribute) return null;
    } else {
      c.ieee = (item.querySelector('.sc-ent-cond-device') || {}).value || '';
      c.attribute = (item.querySelector('.sc-ent-cond-attr') || {}).value || '';
      c.operator = (item.querySelector('.sc-ent-cond-op') || {}).value || 'EQ';
      c.value = (item.querySelector('.sc-ent-cond-val') || {}).value || '';
      if (!c.ieee || !c.attribute) return null;
    }
    return c;
  }
  function readEntryAction(item) {
    var type = (item.querySelector('.sc-ent-action-type') || {}).value || 'send_cmd';
    var a = { type: type };
    var enableEl = item.querySelector('.sc-ent-action-enable');
    if (enableEl) a.enabled = enableEl.checked;

    if (type === 'group') {
      var delay = parseInt((item.querySelector('.sc-ent-action-delay') || {}).value || 0);
      if (delay > 0) a.delay_ms = delay;
      var repeat = parseInt((item.querySelector('.sc-ent-action-repeat') || {}).value || 0);
      if (repeat > 0) a.repeat = repeat;
      var gap = parseInt((item.querySelector('.sc-ent-action-gap') || {}).value || 0);
      if (gap > 0) a.gap_ms = gap;
      var children = [];
      var childItems = item.querySelectorAll(':scope > .sc-ent-action-children > .sc-ent-action-item');
      for (var ci = 0; ci < childItems.length; ci++) {
        var ca = readEntryAction(childItems[ci]);
        if (ca) children.push(ca);
      }
      if (children.length > 0) a.children = children;
      return a;
    }
    if (type === 'delay') {
      var ms = parseInt((item.querySelector('.sc-ent-action-delay') || {}).value || 0);
      if (ms > 0) a.delay_ms = ms;
      return a;
    }
    if (type === 'if') {
      var condItems = item.querySelectorAll(':scope > .sc-ent-action-conds > .sc-ent-cond-item');
      if (condItems.length > 0) {
        a.conditions = [];
        for (var ci = 0; ci < condItems.length; ci++) {
          var c = readEntryCond(condItems[ci]);
          if (c) a.conditions.push(c);
        }
      }
      var thenList = item.querySelector(':scope > .sc-ent-action-then');
      if (thenList) {
        var thenItems = thenList.querySelectorAll(':scope > .sc-ent-action-item');
        if (thenItems.length > 0) {
          a.then_actions = [];
          for (var ti = 0; ti < thenItems.length; ti++) {
            var ta = readEntryAction(thenItems[ti]);
            if (ta) a.then_actions.push(ta);
          }
        }
      }
      var elseList = item.querySelector(':scope > .sc-ent-action-else');
      if (elseList) {
        var elseItems = elseList.querySelectorAll(':scope > .sc-ent-action-item');
        if (elseItems.length > 0) {
          a.else_actions = [];
          for (var ei = 0; ei < elseItems.length; ei++) {
            var ea = readEntryAction(elseItems[ei]);
            if (ea) a.else_actions.push(ea);
          }
        }
      }
      return a;
    }
    if (type === 'send_cmd') {
      a.ieee = (item.querySelector('.sc-ent-action-device') || {}).value || '';
      a.command = (item.querySelector('.sc-ent-action-cmd') || {}).value || '';
      a.obj = a.command;
      a.value = (item.querySelector('.sc-ent-action-val') || {}).value || '';
      var useTrigger = (item.querySelector('.sc-use-trigger-val') || {}).checked || false;
      if (useTrigger) {
        a.use_trigger_value = true;
        var transform = (item.querySelector('.sc-trigger-transform') || {}).value || '';
        if (transform) a.trigger_value_transform = transform;
        var param = parseFloat((item.querySelector('.sc-transform-param') || {}).value || 0);
        if (param && !isNaN(param)) a.trigger_value_param = param;
      }
      if (!a.ieee || !a.command) return null;
    } else if (type === 'mqtt') {
      a.topic = (item.querySelector('.sc-ent-action-topic') || {}).value || '';
      a.message = (item.querySelector('.sc-ent-action-msg') || {}).value || '';
      var useTrigger = (item.querySelector('.sc-use-trigger-val') || {}).checked || false;
      if (useTrigger) a.use_trigger_value = true;
      if (!a.topic) return null;
    } else if (type === 'telegram') {
      a.text = (item.querySelector('.sc-ent-action-text') || {}).value || '';
      var useTrigger = (item.querySelector('.sc-use-trigger-val') || {}).checked || false;
      if (useTrigger) a.use_trigger_value = true;
      if (!a.text) return null;
    } else if (type === 'http') {
      a.url = (item.querySelector('.sc-ent-action-url') || {}).value || '';
      var useTrigger = (item.querySelector('.sc-use-trigger-val') || {}).checked || false;
      if (useTrigger) a.use_trigger_value = true;
      if (!a.url) return null;
    } else if (type === 'speaker_tts') {
      a.speaker_id = (item.querySelector('.sc-ent-action-speaker') || {}).value || '';
      a.text = (item.querySelector('.sc-ent-action-text') || {}).value || '';
      var vol = parseInt((item.querySelector('.sc-ent-action-vol') || {}).value || 0);
      if (vol > 0) a.volume = vol;
      var useTrigger = (item.querySelector('.sc-use-trigger-val') || {}).checked || false;
      if (useTrigger) a.use_trigger_value = true;
      if (!a.speaker_id) return null;
    } else if (type === 'speaker_play') {
      a.speaker_id = (item.querySelector('.sc-ent-action-speaker') || {}).value || '';
      a.url = (item.querySelector('.sc-ent-action-url') || {}).value || '';
      var vol = parseInt((item.querySelector('.sc-ent-action-vol') || {}).value || 0);
      if (vol > 0) a.volume = vol;
      if (!a.speaker_id) return null;
    } else if (type === 'speaker_volume') {
      a.speaker_id = (item.querySelector('.sc-ent-action-speaker') || {}).value || '';
      var vol = parseInt((item.querySelector('.sc-ent-action-vol') || {}).value || 0);
      if (vol > 0) a.volume = vol;
      if (!a.speaker_id) return null;
    }
    return a;
  }
  function readEntryCondMode(entryEl) {
    var node = entryEl.querySelector('.sc-ent-cond-mode');
    if (!node) return 'AND';
    return node.value || 'AND';
  }

  // ── editor actions (inline handlers) ──
  function trigTypeChange(el) {
    var entry = el.closest('.sc-entry');
    var trigDiv = entry.querySelector('.sc-entry-trigger');
    var t = readEntryTrigger(entry);
    t.type = el.value;
    trigDiv.innerHTML = renderTriggerFields(t);
    var devSel = trigDiv.querySelector('.sc-ent-trig-device');
    if (devSel) devSel.onchange = function () { trigDeviceChange(this); };
  }
  function trigDeviceChange(el) {
    var entry = el.closest('.sc-entry');
    var ieee = el.value;
    var attrSel = entry.querySelector('.sc-ent-trig-attr');
    if (!attrSel) return;
    attrSel.innerHTML = '<option value="">— атрибут —</option>';
    var attrs = getDeviceAttrs(ieee);
    for (var j = 0; j < attrs.length; j++) {
      attrSel.innerHTML += '<option value="' + escHtml(attrs[j].key) + '">' + escHtml(attrs[j].label) + (attrs[j].title ? ' title="' + escHtml(attrs[j].title) + '"' : '') + '</option>';
    }
  }
  function addCond(el) {
    var entry = el.closest('.sc-entry');
    var list = entry.querySelector('.sc-ent-cond-list');
    if (!list) return;
    var triggerIeee = getTriggerIeee(entry);
    var div = document.createElement('div');
    div.innerHTML = renderEntryCond(list.children.length, { type: 'device', ieee: '', attribute: '', operator: 'EQ', value: '' }, triggerIeee);
    while (div.children.length > 0) list.appendChild(div.children[0]);
    var devSel = list.querySelector('.sc-ent-cond-device');
    if (devSel) devSel.onchange = function () { condDeviceChange(this); };
    markDirty();
  }
  function actionAddCond(el) {
    var actionItem = el.closest('.sc-ent-action-item');
    var list = actionItem.querySelector('.sc-ent-action-conds');
    if (!list) return;
    var entry = el.closest('.sc-entry');
    var triggerIeee = entry ? getTriggerIeee(entry) : '';
    var idx = list.querySelectorAll('.sc-ent-cond-item').length;
    var div = document.createElement('div');
    div.innerHTML = renderEntryCond(idx, { type: 'device', ieee: '', attribute: '', operator: 'EQ', value: '' }, triggerIeee);
    while (div.children.length > 0) list.insertBefore(div.children[0], list.lastElementChild);
    var devSel = list.querySelector('.sc-ent-cond-device');
    if (devSel) devSel.onchange = function () { condDeviceChange(this); };
  }
  function condTypeChange(el) {
    var item = el.closest('.sc-ent-cond-item');
    var entry = item.closest('.sc-entry');
    var triggerIeee = getTriggerIeee(entry);
    var c = readEntryCond(item);
    c.type = el.value;
    var parent = item.parentNode;
    var idx = Array.prototype.indexOf.call(parent.children, item);
    item.outerHTML = renderEntryCond(idx, c, triggerIeee);
  }
  function condNegateToggle(el) {
    var item = el.closest('.sc-ent-cond-item');
    if (!item) return;
    if (el.checked) item.classList.add('sc-cond-negated'); else item.classList.remove('sc-cond-negated');
    markDirty();
  }
  function condDeviceChange(el) {
    var item = el.closest('.sc-ent-cond-item');
    var ieee = el.value;
    var attrSel = item.querySelector('.sc-ent-cond-attr');
    if (!attrSel) return;
    var attrs = getDeviceAttrs(ieee);
    attrSel.innerHTML = '<option value="">— атрибут —</option>';
    for (var j = 0; j < attrs.length; j++) {
      attrSel.innerHTML += '<option value="' + escHtml(attrs[j].key) + '">' + escHtml(attrs[j].label) + (attrs[j].title ? ' title="' + escHtml(attrs[j].title) + '"' : '') + '</option>';
    }
  }
  function addAction(el) {
    var entry = el.closest('.sc-entry');
    var list = entry.querySelector('.sc-ent-action-list');
    if (!list) return;
    var div = document.createElement('div');
    div.innerHTML = renderEntryAction(list.children.length, { type: 'send_cmd', ieee: '', command: '', value: '' });
    while (div.children.length > 0) list.appendChild(div.children[0]);
    var devSel = list.querySelector('.sc-ent-action-device');
    if (devSel) devSel.onchange = function () { actionDeviceChange(this); };
  }
  function addChildAction(el) {
    var children = el.closest('.sc-ent-action-children');
    if (!children) return;
    var items = children.querySelectorAll(':scope > .sc-ent-action-item');
    var div = document.createElement('div');
    div.innerHTML = renderEntryAction(items.length, { type: 'send_cmd', ieee: '', command: '', value: '' });
    while (div.children.length > 0) children.insertBefore(div.children[0], el);
    var devSel = children.querySelector('.sc-ent-action-device');
    if (devSel) devSel.onchange = function () { actionDeviceChange(this); };
  }
  function toggleActionEnable(el) {
    var item = el.closest('.sc-ent-action-item');
    if (!item) return;
    if (el.checked) item.classList.remove('sc-ent-action-disabled');
    else item.classList.add('sc-ent-action-disabled');
  }
  function addThenAction(el) {
    var ifItem = el.closest('.sc-ent-action-item');
    if (!ifItem) return;
    var thenList = ifItem.querySelector('.sc-ent-action-then');
    if (!thenList) return;
    var items = thenList.querySelectorAll(':scope > .sc-ent-action-item');
    var div = document.createElement('div');
    div.innerHTML = renderEntryAction(items.length, { type: 'send_cmd', ieee: '', command: '', value: '' });
    thenList.insertBefore(div.firstElementChild, el);
    var devSel = thenList.querySelector('.sc-ent-action-device');
    if (devSel) devSel.onchange = function () { actionDeviceChange(this); };
    markDirty();
  }
  function addElseAction(el) {
    var ifItem = el.closest('.sc-ent-action-item');
    if (!ifItem) return;
    var elseList = ifItem.querySelector('.sc-ent-action-else');
    if (!elseList) return;
    elseList.classList.remove('sc-else-empty');
    var items = elseList.querySelectorAll(':scope > .sc-ent-action-item');
    var div = document.createElement('div');
    div.innerHTML = renderEntryAction(items.length, { type: 'send_cmd', ieee: '', command: '', value: '' });
    elseList.insertBefore(div.firstElementChild, el);
    var devSel = elseList.querySelector('.sc-ent-action-device');
    if (devSel) devSel.onchange = function () { actionDeviceChange(this); };
    markDirty();
  }
  function actionTypeChange(el) {
    var item = el.closest('.sc-ent-action-item');
    var a = readEntryAction(item);
    if (!a) a = {};
    a.type = el.value;
    var parent = item.parentNode;
    var idx = Array.prototype.indexOf.call(parent.children, item);
    item.outerHTML = renderEntryAction(idx, a);
    var newItem = parent.children[idx];
    var devSel = newItem ? newItem.querySelector('.sc-ent-action-device') : null;
    if (devSel) devSel.onchange = function () { actionDeviceChange(this); };
    var condDevSels = newItem ? newItem.querySelectorAll('.sc-ent-cond-device') : [];
    for (var cd = 0; cd < condDevSels.length; cd++) {
      condDevSels[cd].onchange = function () { condDeviceChange(this); };
    }
    if (el.value === 'speaker_play') {
      var newItem = parent.children[idx];
      if (newItem) {
        var btn = newItem.querySelector('.sc-btn');
        if (btn) setTimeout(function () { reloadSounds(btn); }, 50);
      }
    }
    markDirty();
  }
  function actionDeviceChange(el) {
    var item = el.closest('.sc-ent-action-item');
    var ieee = el.value;
    var cmdSel = item.querySelector('.sc-ent-action-cmd');
    if (!cmdSel) return;
    cmdSel.innerHTML = '<option value="">— команда —</option>';
    var attrs = getDeviceAttrs(ieee);
    for (var j = 0; j < attrs.length; j++) {
      cmdSel.innerHTML += '<option value="' + escHtml(attrs[j].key) + '">' + escHtml(attrs[j].label) + (attrs[j].title ? ' title="' + escHtml(attrs[j].title) + '"' : '') + '</option>';
    }
  }
  function toggleTriggerValue(el) {
    var item = el.closest('.sc-ent-action-item');
    var transformGroup = item.querySelector('.sc-transform-group');
    if (transformGroup) {
      transformGroup.style.display = el.checked ? 'inline-flex' : 'none';
    }
  }
  function removeCond(el) {
    var item = el.closest('.sc-ent-cond-item');
    if (item) item.remove();
  }
  function removeAction(el) {
    var item = el.closest('.sc-ent-action-item');
    if (item) item.remove();
  }
  function soundPick(el) {
    var file = el.value;
    if (!file) return;
    var item = el.closest('.sc-ent-action-item');
    var urlInput = item.querySelector('.sc-ent-action-url');
    urlInput.value = window.location.protocol + '//' + window.location.host + '/sounds/' + encodeURIComponent(file);
  }
  function reloadSounds(el) {
    var item = el.closest('.sc-ent-action-item');
    var sel = item.querySelector('.sc-ent-action-sound');
    if (!sel) return;
    sel.innerHTML = '<option value="">— загрузка... —</option>';
    fetch('/api/sounds.json').then(function (r) { return r.json(); }).then(function (files) {
      sel.innerHTML = '<option value="">— файл из wav/ —</option>';
      for (var i = 0; i < files.length; i++) {
        sel.innerHTML += '<option value="' + escHtml(files[i]) + '">' + escHtml(files[i]) + '</option>';
      }
    }).catch(function () {
      sel.innerHTML = '<option value="">— ошибка загрузки —</option>';
    });
  }
  function delayQuick(el, ms) {
    var item = el.closest('.sc-ent-action-item') || el.parentNode;
    var input = item.querySelector('.sc-ent-action-delay') || item.querySelector('.sc-mod-label input');
    if (!input) return;
    input.value = ms;
    markDirty();
  }
  function reindexAll() {
    var nums = document.querySelectorAll('#sc_entries .sc-entry-num');
    for (var i = 0; i < nums.length; i++) nums[i].textContent = '#' + (i + 1);
  }
  function renderEntries(entries) {
    var container = $('sc_entries');
    if (!container) return;
    var html = '';
    for (var i = 0; i < entries.length; i++) {
      var triggerIeee = entries[i].trigger ? entries[i].trigger.ieee : '';
      html += renderEntry(i, entries[i], triggerIeee);
    }
    container.innerHTML = html;
    reindexAll();
    var devSels = container.querySelectorAll('.sc-ent-trig-device');
    for (var i = 0; i < devSels.length; i++) {
      devSels[i].onchange = function () { trigDeviceChange(this); };
    }
    fillTriggerDeviceAttrs(container);
  }
  function fillTriggerDeviceAttrs(container) {
    var entries = container.querySelectorAll('.sc-entry');
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      var triggerIeee = getTriggerIeee(entry);
      if (!triggerIeee) continue;
      var condItems = entry.querySelectorAll('.sc-ent-cond-item');
      for (var j = 0; j < condItems.length; j++) {
        var typeSel = condItems[j].querySelector('.sc-ent-cond-type');
        if (typeSel && typeSel.value === 'trigger_device') {
          var attrSel = condItems[j].querySelector('.sc-ent-cond-attr');
          if (attrSel && attrSel.children.length <= 1) {
            attrSel.innerHTML = '<option value="">— атрибут —</option>';
            var attrs = getDeviceAttrs(triggerIeee);
            for (var k = 0; k < attrs.length; k++) {
              attrSel.innerHTML += '<option value="' + escHtml(attrs[k].key) + '">' + escHtml(attrs[k].label) + '</option>';
            }
            var savedAttr = condItems[j].getAttribute('data-saved-attr');
            if (savedAttr) attrSel.value = savedAttr;
          }
        }
      }
    }
  }
  function reattachActions(container) {
    var devSels = container.querySelectorAll('.sc-ent-trig-device');
    for (var i = 0; i < devSels.length; i++) {
      devSels[i].onchange = function () { trigDeviceChange(this); };
    }
  }

  // ── editor open/save ──
  function renderSceneConditions(conds, mode) {
    var container = $('sc_scene_conds');
    if (!container) return;
    var modeSel = $('sc_scene_cond_mode');
    if (modeSel) modeSel.value = mode || 'AND';
    var list = container.querySelector('.sc-ent-cond-list');
    if (!list) return;
    list.innerHTML = '';
    for (var i = 0; i < conds.length; i++) {
      var div = document.createElement('div');
      div.innerHTML = renderEntryCond(i, conds[i], '');
      while (div.children.length > 0) list.appendChild(div.children[0]);
    }
  }
  function openEditor(scene) {
    var overlay = $('sc_editor_overlay');
    var editor = $('sc_editor');
    if (!overlay || !editor) return;
    $('sc_edit_name').value = scene.name || '';
    renderEntries(scene.entries || []);
    renderSceneConditions(scene.conditions || [], scene.conditionsMode || 'AND');
    var cd = $('sc_cooldown');
    if (cd) cd.value = scene.cooldown_ms ? Math.round(scene.cooldown_ms / 1000) : '';
    overlay.style.display = 'flex';
    editor.style.display = 'flex';
    st.editorScene = scene;
    st.editorDirty = false;
    editor.addEventListener('input', markDirty);
    editor.addEventListener('change', markDirty);
  }
  function newScene() {
    st.editingIdx = -1;
    openEditor({
      id: 's_' + Date.now(),
      name: '',
      enabled: true,
      entries: [{ trigger: { type: 'on_event', ieee: '', attribute: '', operator: 'EQ', value: '' }, conditions: [], actions: [] }]
    });
  }
  function editScene(idx) {
    st.editingIdx = idx;
    var s = st.scenes[idx];
    if (!s) return;
    openEditor(JSON.parse(JSON.stringify(s)));
  }
  function closeEditor(force) {
    if (!force && st.editorDirty) {
      if (!window.confirm('Есть несохранённые изменения. Закрыть без сохранения?')) return;
    }
    var overlay = $('sc_editor_overlay');
    var editor = $('sc_editor');
    if (overlay) overlay.style.display = 'none';
    if (editor) editor.style.display = 'none';
    st.editorScene = null;
    st.editorDirty = false;
  }
  function readSceneConditions() {
    var container = $('sc_scene_conds');
    if (!container) return [];
    var items = container.querySelectorAll('.sc-ent-cond-item');
    var out = [];
    for (var j = 0; j < items.length; j++) {
      var c = readEntryCond(items[j]);
      if (c) out.push(c);
    }
    return out;
  }
  function saveEditor() {
    var scene = st.editorScene;
    if (!scene) return;
    scene.name = $('sc_edit_name').value.trim() || 'Новый сценарий';
    scene.conditions = readSceneConditions();
    scene.conditionsMode = ($('sc_scene_cond_mode') || {}).value || 'AND';
    var cdSec = parseInt(($('sc_cooldown') || {}).value || 0);
    if (cdSec > 0) scene.cooldown_ms = cdSec * 1000; else delete scene.cooldown_ms;
    scene.entries = readEntriesFromForm();
    if (scene.entries.length === 0) { alert('Добавьте хотя бы одну запись'); return; }
    if (st.editingIdx >= 0) {
      st.scenes[st.editingIdx] = scene;
    } else {
      st.scenes.push(scene);
    }
    saveScenes();
    closeEditor(true);
  }

  // ── toolbar / list actions ──
  function onSearchChange(val) {
    st.searchFilter = val || '';
    renderList();
  }
  function onDeviceFilterChange(val) {
    st.deviceFilter = val;
    renderList();
  }
  function toggleScene(el) {
    var idx = parseInt(el.getAttribute('data-idx'));
    if (idx >= 0 && idx < st.scenes.length) {
      st.scenes[idx].enabled = el.checked;
      saveScenes();
    }
  }
  function deleteScene(idx) {
    if (!confirm('Удалить сценарий "' + (st.scenes[idx].name || '') + '"?')) return;
    st.scenes.splice(idx, 1);
    saveScenes();
  }
  function duplicateScene(idx) {
    var s = st.scenes[idx];
    if (!s) return;
    var copy = JSON.parse(JSON.stringify(s));
    copy.id = 's_' + Date.now();
    copy.name = (s.name || 'Сценарий') + ' (копия)';
    st.scenes.push(copy);
    saveScenes();
  }
  function exportScenes() {
    var data = JSON.stringify(st.scenes, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'zesp_scenes_' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  function importScenes(fileInput) {
    if (!fileInput || !fileInput.files || !fileInput.files[0]) return;
    var file = fileInput.files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var parsed = JSON.parse(e.target.result);
        if (!Array.isArray(parsed)) { alert('Файл не содержит массив сцен'); return; }
        migrateScenes(parsed);
        if (!confirm('Импортировать ' + parsed.length + ' сцен? Текущие сцены будут заменены.')) return;
        st.scenes = parsed;
        saveScenes();
      } catch (err) {
        alert('Ошибка импорта: ' + err.message);
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  }
  function testFire(idx, el) {
    var s = st.scenes[idx];
    if (!s) return;
    st.fireTargetEl = el;
    st.fireTargetIdx = idx;
    $('sc_confirm_text').textContent = 'Запустить «' + (s.name || '') + '» сейчас?';
    $('sc_confirm_overlay').style.display = 'flex';
  }
  function confirmCancel() {
    $('sc_confirm_overlay').style.display = 'none';
    st.fireTargetEl = null;
  }
  function confirmOk() {
    $('sc_confirm_overlay').style.display = 'none';
    var el = st.fireTargetEl;
    var idx = st.fireTargetIdx;
    if (!el || idx === undefined) return;
    el.disabled = true;
    window.WSsend && WSsend('FireScene|' + st.scenes[idx].id);
    setTimeout(function () { if (el) el.disabled = false; loadSceneStatus(); }, 3000);
    st.fireTargetEl = null;
    st.fireTargetIdx = undefined;
  }
  function setServerTime(el) {
    fetch('/api/server_time').then(function (r) { return r.json(); }).then(function (data) {
      var input = el.parentNode.querySelector('.sc-ent-trig-time');
      if (input && data.time) input.value = data.time;
    }).catch(function () {});
  }
  function dowPreset(el, mode) {
    var entry = el.closest('.sc-entry');
    if (!entry) return;
    var cbs = entry.querySelectorAll('.sc-ent-trig-dow');
    for (var i = 0; i < cbs.length; i++) {
      var v = cbs[i].value;
      var on = false;
      if (mode === 'all') on = true;
      else if (mode === 'weekdays') on = (v === '1' || v === '2' || v === '3' || v === '4' || v === '5');
      else if (mode === 'weekend') on = (v === '6' || v === '0');
      cbs[i].checked = on;
    }
  }
  function sceneAddCond(el) {
    var container = $('sc_scene_conds');
    if (!container) return;
    var list = container.querySelector('.sc-ent-cond-list');
    if (!list) return;
    var idx = list.children.length;
    var div = document.createElement('div');
    div.innerHTML = renderEntryCond(idx, { type: 'time', time_start: '22:00', time_end: '07:00' }, '');
    while (div.children.length > 0) list.appendChild(div.children[0]);
    var devSel = list.querySelector('.sc-ent-cond-device');
    if (devSel) devSel.onchange = function () { condDeviceChange(this); };
    markDirty();
  }

  // ── keyboard shortcuts ──
  function attachKeyShortcuts() {
    if (st.keyAttached) return;
    st.keyAttached = true;
    document.addEventListener('keydown', function (e) {
      if (!(e.ctrlKey || e.metaKey)) return;
      var k = (e.key || '').toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === 'y') || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    });
  }
  function undo() {
    if (st.undoStack.length === 0) return;
    st.redoStack.push(JSON.stringify(st.scenes));
    st.scenes = JSON.parse(st.undoStack.pop());
    localStorage.setItem('zesp_scenes', JSON.stringify(st.scenes));
    window.SaveJson && SaveJson('/scenes.json', JSON.stringify(st.scenes, null, 2));
    renderList();
  }
  function redo() {
    if (st.redoStack.length === 0) return;
    st.undoStack.push(JSON.stringify(st.scenes));
    st.scenes = JSON.parse(st.redoStack.pop());
    localStorage.setItem('zesp_scenes', JSON.stringify(st.scenes));
    window.SaveJson && SaveJson('/scenes.json', JSON.stringify(st.scenes, null, 2));
    renderList();
  }

  // ── доступные глобальные обработчики inline onclick ──
  window.scMarkDirty = markDirty;
  window.scSetServerTime = setServerTime;
  window.scDowPreset = dowPreset;
  window.scTrigTypeChange = trigTypeChange;
  window.scCondNegateToggle = function (el) {
    var item = el.closest('.sc-ent-cond-item');
    if (!item) return;
    if (el.checked) item.classList.add('sc-cond-negated'); else item.classList.remove('sc-cond-negated');
    markDirty();
  };
  window.scCondTypeChange = condTypeChange;
  window.scCondDeviceChange = condDeviceChange;
  window.scRemoveCond = removeCond;
  window.scAddCond = addCond;
  window.scAddAction = addAction;
  window.scAddChildAction = addChildAction;
  window.scAddThenAction = addThenAction;
  window.scAddElseAction = addElseAction;
  window.scActionAddCond = actionAddCond;
  window.scToggleActionEnable = toggleActionEnable;
  window.scActionTypeChange = actionTypeChange;
  window.scActionDeviceChange = actionDeviceChange;
  window.scRemoveAction = removeAction;
  window.scToggleTriggerValue = toggleTriggerValue;
  window.scSoundPick = soundPick;
  window.scReloadSounds = reloadSounds;
  window.scDelayQuick = delayQuick;
  window.scDuplicateEntry = duplicateEntry;
  window.scRemoveEntry = removeEntry;
  window.scAddEntry = addEntry;
  window.scSceneAddCond = sceneAddCond;
  window.scCloseEditor = closeEditor;
  window.scSaveEditor = saveEditor;
  window.scNewScene = newScene;
  window.scEditScene = editScene;
  window.scDeleteScene = deleteScene;
  window.scDuplicateScene = duplicateScene;
  window.scToggleScene = toggleScene;
  window.scExportScenes = exportScenes;
  window.scImportScenes = importScenes;
  window.scTestFire = testFire;
  window.scConfirmOk = confirmOk;
  window.scConfirmCancel = confirmCancel;
  window.scOnSearchChange = onSearchChange;
  window.scOnDeviceFilterChange = onDeviceFilterChange;
  window.scUndo = undo;
  window.scRedo = redo;

  var SCENES_CSS = '' +
    '*{box-sizing:border-box;}' +
    '.sc-toolbar{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:var(--bg);border-bottom:1px solid var(--border);}' +
    '.sc-toolbar-title{color:var(--text);font-size:16px;font-weight:700;}' +
    '.sc-filter-select{background:var(--bg3);color:var(--text);border:1px solid var(--border2);border-radius:8px;padding:5px 10px;font-size:13px;min-width:180px;margin:0 12px;}' +
    '.sc-search-input{background:var(--bg3);color:var(--text);border:1px solid var(--border2);border-radius:8px;padding:5px 10px;font-size:13px;min-width:160px;outline:none;}' +
    '.sc-search-input:focus{border-color:var(--accent);}' +
    '.sc-toolbar label.sc-btn{cursor:pointer;position:relative;overflow:hidden;}' +
    '.sc-delay-quick{display:inline-flex;gap:2px;margin:0 4px;}' +
    '.sc-dq-btn{background:#37474f;color:#e0f7fa;border:1px solid #546e7a;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:600;cursor:pointer;user-select:none;}' +
    '.sc-dq-btn:hover{background:#546e7a;color:#ffffff;}' +
    '.sc-btn{background:#3d5afe;color:#ffffff;border:1px solid #2a3fb8;border-radius:8px;padding:6px 16px;cursor:pointer;font-size:13px;font-weight:600;transition:background .15s,color .15s;-webkit-tap-highlight-color:transparent;user-select:none;}' +
    '.sc-btn:hover{background:#2a3fb8;color:#ffffff;}' +
    '.sc-btn-sm{padding:4px 10px;font-size:12px;border-radius:6px;}' +
    '.sc-btn-del{background:#c62828;color:#ffffff;border-color:#b71c1c;}' +
    '.sc-btn-del:hover{background:#b71c1c;color:#ffffff;}' +
    '.sc-btn-play{background:#2e7d32;color:#ffffff;border-color:#1b5e20;padding:4px 8px;font-size:12px;}' +
    '.sc-btn-play:hover{background:#1b5e20;color:#ffffff;}' +
    '.sc-btn-play:disabled{opacity:.4;cursor:default;}' +
    '.sc-btn-primary{background:#2e7d32;color:#ffffff;border-color:#1b5e20;}' +
    '.sc-btn-primary:hover{background:#1b5e20;color:#ffffff;}' +
    '.sc-list{padding:8px;overflow-y:auto;height:calc(100% - 48px);background:var(--bg);}' +
    '.sc-list::-webkit-scrollbar{width:4px;}' +
    '.sc-list::-webkit-scrollbar-thumb{background:#555;border-radius:2px;}' +
    '.sc-empty{text-align:center;color:var(--faint);padding:60px 20px;font-size:15px;line-height:1.8;}' +
    '.sc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;}' +
    '.sc-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;cursor:pointer;}' +
    '.sc-card:hover{border-color:var(--accent)66;box-shadow:0 4px 16px rgba(0,0,0,.4);}' +
    '.sc-disabled{opacity:.5;}' +
    '.sc-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}' +
    '.sc-card-name{color:var(--text);font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}' +
    '.sc-card-trigger,.sc-card-actions{color:var(--muted);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.sc-label{color:var(--faint);font-weight:600;}' +
    '.sc-card-footer{display:flex;gap:6px;margin-top:4px;padding-top:6px;border-top:1px solid var(--border);align-items:center;}' +
    '.sc-last-fired{color:var(--muted);font-size:10px;margin-top:4px;}' +
    '.sc-toggle{position:relative;display:inline-block;width:36px;height:20px;flex-shrink:0;}' +
    '.sc-toggle input{opacity:0;width:0;height:0;}' +
    '.sc-toggle-slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:var(--border2);border-radius:20px;transition:background .2s;}' +
    '.sc-toggle-slider:before{content:"";position:absolute;height:16px;width:16px;left:2px;bottom:2px;background:#3a4060;border-radius:50%;transition:transform .2s,background .2s;}' +
    '.sc-toggle input:checked+.sc-toggle-slider{background:var(--green);}' +
    '.sc-toggle input:checked+.sc-toggle-slider:before{transform:translateX(16px);background:#a5d6a7;}' +
    '#sc_editor_overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;backdrop-filter:blur(4px);}' +
    '#sc_editor{display:none;background:linear-gradient(145deg,var(--bg3),var(--bg3));border:1px solid var(--border2);border-radius:16px;width:850px;max-width:95vw;max-height:90vh;flex-direction:column;box-shadow:0 12px 48px rgba(0,0,0,.6);overflow:hidden;}' +
    '.sc-editor-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;background:linear-gradient(90deg,var(--bg3),var(--bg3));border-bottom:1px solid var(--border);}' +
    '.sc-editor-header h3{margin:0;color:var(--text);font-size:16px;font-weight:700;}' +
    '.sc-editor-body{padding:20px;overflow-y:auto;flex:1;}' +
    '.sc-editor-body::-webkit-scrollbar{width:6px;}' +
    '.sc-editor-body::-webkit-scrollbar-thumb{background:var(--accent)66;border-radius:3px;}' +
    '.sc-editor-footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid var(--border);background:var(--bg3);}' +
    '.sc-field{margin-bottom:14px;}' +
    '.sc-field label{display:block;color:var(--muted);font-size:12px;font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:.05em;}' +
    '.sc-field input[type=text],.sc-field select,.sc-field input[type=time],.sc-field input[type=date],.sc-field input[type=number]{width:100%;background:var(--bg2);border:1px solid var(--border2);border-radius:8px;color:var(--text);padding:8px 12px;font-size:13px;outline:none;}' +
    '.sc-field input:focus,.sc-field select:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(61,90,254,.15);}' +
    '.sc-entry{background:var(--bg);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:12px;overflow:hidden;}' +
    '.sc-entry-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;}' +
    '.sc-entry-num{color:var(--accent);font-size:12px;font-weight:700;}' +
    '.sc-entry-title{color:var(--muted);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;}' +
    '.sc-entry-trigger{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:6px 0;}' +
    '.sc-entry-trigger input{min-width:0;width:120px;flex:0 0 auto;}' +
    '.sc-entry select,.sc-entry input{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 10px;font-size:12px;outline:none;flex:0 0 auto;min-width:70px;max-width:180px;}' +
    '.sc-entry select:focus,.sc-entry input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(61,90,254,.12);}' +
    '.sc-entry-subheader{display:flex;align-items:center;gap:8px;padding:4px 0;margin-top:6px;border-top:1px solid var(--bg3);color:var(--muted);font-size:11px;font-weight:600;}' +
    '.sc-entry-subheader select{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:3px 8px;font-size:11px;outline:none;}' +
    '.sc-entry-subheader select:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(61,90,254,.12);}' +
    '.sc-entry-subheader .sc-btn{padding:2px 8px;font-size:11px;}' +
    '.sc-ent-cond-item,.sc-ent-action-item{display:flex;flex-wrap:wrap;gap:4px;align-items:center;background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:6px 8px;margin-bottom:4px;}' +
    '.sc-ent-cond-item select,.sc-ent-cond-item input,.sc-ent-action-item select,.sc-ent-action-item input{background:var(--bg3);border:1px solid var(--border2);border-radius:6px;color:var(--text);font-size:11px;padding:3px 6px;outline:none;flex:0 0 auto;}' +
    '.sc-entry .sc-ent-cond-item select,.sc-entry .sc-ent-action-item select{width:130px;min-width:80px;max-width:130px;}' +
    '.sc-entry .sc-ent-cond-item input,.sc-entry .sc-ent-action-item input{width:auto;min-width:40px;max-width:120px;}' +
    '.sc-ent-cond-item select:focus,.sc-ent-cond-item input:focus,.sc-ent-action-item select:focus,.sc-ent-action-item input:focus{border-color:var(--accent);box-shadow:0 0 0 2px rgba(61,90,254,.12);}' +
    '.sc-ent-cond-item .sc-btn,.sc-ent-action-item .sc-btn{padding:2px 6px;font-size:10px;}' +
    '.sc-day-cb{display:inline-flex;cursor:pointer;}' +
    '.sc-day-cb input{display:none;}' +
    '.sc-day-btn{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;background:var(--bg3);color:var(--muted);font-size:12px;font-weight:700;border:1px solid var(--border2);transition:all .12s;user-select:none;}' +
    '.sc-day-cb input:checked+.sc-day-btn{background:var(--green);color:var(--yellow);border-color:var(--green);}' +
    '.sc-dow-presets{display:inline-flex;gap:2px;margin-right:4px;}' +
    '.sc-dow-preset{background:#455a64;color:#ffffff;border:1px solid #607d8b;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:600;cursor:pointer;user-select:none;}' +
    '.sc-dow-preset:hover{background:#607d8b;color:#ffffff;}' +
    '.sc-now-btn{color:#ffffff;font-size:11px;cursor:pointer;border:1px solid #546e7a;border-radius:6px;padding:4px 8px;background:#455a64;user-select:none;}' +
    '.sc-now-btn:hover{background:#607d8b;color:#ffffff;}' +
    '.sc-entry-del{margin-left:auto;}' +
    '.sc-checkbox-label{display:inline-flex;align-items:center;gap:4px;color:var(--muted);font-size:11px;cursor:pointer;background:var(--bg2);padding:2px 6px;border-radius:4px;}' +
    '.sc-checkbox-label input{margin:0;width:14px;height:14px;}' +
    '.sc-transform-group{display:inline-flex;gap:4px;align-items:center;}' +
    '.sc-ent-action-modifiers{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:5px 8px;margin-top:5px;background:var(--bg3);border-radius:4px;font-size:11px;color:var(--muted);}' +
    '.sc-mod-label{display:inline-flex;align-items:center;gap:3px;color:var(--muted);font-size:11px;font-weight:600;}' +
    '.sc-mod-label input{width:auto!important;min-width:40px!important;background:var(--bg2);border:1px solid var(--border2);border-radius:4px;color:var(--text);padding:2px 4px;font-size:11px;outline:none;text-align:right;}' +
    '.sc-mod-label input:focus{border-color:var(--accent);}' +
    '.sc-ent-action-group{border-color:var(--green)66!important;border-left-width:3px!important;}' +
    '.sc-ent-action-item.sc-act-type-send_cmd{border-left:3px solid var(--accent)66;}' +
    '.sc-ent-action-item.sc-act-type-mqtt{border-left:3px solid #ff980066;}' +
    '.sc-ent-action-item.sc-act-type-telegram{border-left:3px solid var(--green)66;}' +
    '.sc-ent-action-item.sc-act-type-http{border-left:3px solid #00bcd466;}' +
    '.sc-ent-action-item.sc-act-type-speaker_tts{border-left:3px solid #8bc34a66;}' +
    '.sc-ent-action-item.sc-act-type-speaker_play{border-left:3px solid #cddc3966;}' +
    '.sc-ent-action-item.sc-act-type-speaker_volume{border-left:3px solid #7cb34266;}' +
    '.sc-ent-action-item.sc-act-type-group{border-left:3px solid #607d8b66;}' +
    '.sc-ent-action-item.sc-act-type-delay{border-left:3px solid var(--faint)55;}' +
    '.sc-ent-action-item.sc-act-type-if{border-left:3px solid #9c27b066;}' +
    '.sc-cond-negated{border-color:#7d2e2e66!important;background:rgba(125,46,46,.08);}' +
    '.sc-dragging{opacity:.4;outline:2px dashed var(--accent);}' +
    '.sc-drag-over{border-top:2px solid var(--yellow)!important;}' +
    '.sc-move-btn{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:4px;border:1px solid #78909c;background:#607d8b;color:#ffffff;font-size:9px;cursor:pointer;padding:0;margin:0 2px 0 0;flex-shrink:0;}' +
    '.sc-move-btn:hover{background:#78909c;color:#ffffff;}' +
    '.sc-entry[draggable=true]:hover,.sc-ent-cond-item[draggable=true]:hover,.sc-ent-action-item[draggable=true]:hover{cursor:grab;}' +
    '.sc-ent-action-children{margin:6px 0 2px 16px;padding:6px;border-left:2px solid var(--border2);border-radius:0 6px 6px 0;background:var(--bg);}' +
    '.sc-ent-action-children .sc-ent-action-item{margin-bottom:4px;}' +
    '.sc-ent-action-conds{margin:4px 0 2px 12px;padding:6px;border-left:2px solid var(--border2);border-radius:0 4px 4px 0;background:var(--bg);}' +
    '.sc-ent-action-conds .sc-ent-cond-item{margin-bottom:3px;}' +
    '.sc-ent-action-conds .sc-btn{font-size:11px;padding:2px 8px;}' +
    '.sc-enable-label{display:inline-flex;align-items:center;margin-right:4px;}' +
    '.sc-enable-label input{margin:0;width:14px;height:14px;cursor:pointer;}' +
    '.sc-ent-action-disabled{opacity:.45!important;}' +
    '.sc-ent-action-disabled .sc-ent-action-type,.sc-ent-action-disabled input,.sc-ent-action-disabled select{opacity:.7;}' +
    '.sc-ent-action-then,.sc-ent-action-else{margin:6px 0 2px 16px;padding:6px;border-left:2px solid var(--green);border-radius:0 6px 6px 0;background:var(--bg);}' +
    '.sc-ent-action-else{border-left-color:#7d2e2e;}' +
    '.sc-else-empty{opacity:.4;}' +
    '.sc-sub-label{display:block;font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase;margin-bottom:4px;letter-spacing:.5px;}' +
    '.sc-ent-action-item.sc-ent-action-disabled{border-color:#555!important;}' +
    '#sc_confirm_overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;align-items:center;justify-content:center;backdrop-filter:blur(3px);}' +
    '#sc_confirm_overlay .confirm-box{background:linear-gradient(145deg,var(--bg3),var(--bg3));border:1px solid var(--border2);border-radius:12px;padding:24px 28px;max-width:360px;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.5);}' +
    '#sc_confirm_overlay .confirm-text{color:var(--text);font-size:14px;margin-bottom:20px;}' +
    '#sc_confirm_overlay .confirm-btns{display:flex;gap:8px;justify-content:center;}' +
    '.sc-editor-header .sc-btn-sm:hover{background:#c62828;color:#ffffff;border-color:#b71c1c;}' +
    '.sc-wbody{height:calc(100% - 48px);}';

  // ── регистрация виджета ──
  window.WinEngine.register({
    id: 'scenes',
    title: 'Сценарии',
    label: 'Сценарии',
    icon: '<img src="/static/icons/scenes.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="90" data-y="40" data-w="880" data-h="620">' +
      '<style>' + SCENES_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Сценарии</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden;background:var(--bg)">' +
      '<div class="sc-toolbar">' +
      '<div class="sc-toolbar-title">📋 Сценарии</div>' +
      '<input type="text" id="sc_search" class="sc-search-input" placeholder="🔍 поиск по имени…" oninput="scOnSearchChange(this.value)" title="Фильтр сцен по подстроке в имени">' +
      '<select id="sc_device_filter" class="sc-filter-select" onchange="scOnDeviceFilterChange(this.value)"></select>' +
      '<button class="sc-btn" onclick="scExportScenes()" title="Скачать все сцены в JSON-файл">⬇ Экспорт</button>' +
      '<label class="sc-btn" title="Загрузить и заменить сцены из JSON-файла">⬆ Импорт<input type="file" accept=".json,application/json" style="display:none;" onchange="scImportScenes(this)"></label>' +
      '<button class="sc-btn sc-btn-primary" onclick="scNewScene()">+ Сценарий</button>' +
      '</div>' +
      '<div class="sc-list" id="sc_list"><div class="sc-empty">Загрузка...</div></div>' +
      '<div id="sc_editor_overlay"><div id="sc_editor">' +
      '<div class="sc-editor-header"><h3>✏️ Редактор сценария</h3><button class="sc-btn sc-btn-sm" onclick="scCloseEditor()">✕</button></div>' +
      '<div class="sc-editor-body">' +
      '<div class="sc-field"><label>📝 Название сценария</label><input type="text" id="sc_edit_name" placeholder="Например: Свет по движению"></div>' +
      '<div class="sc-field"><label>⏱ Не чаще, чем раз в (сек)</label><input type="number" id="sc_cooldown" min="0" placeholder="0 — без ограничения" value="" title="Минимальная пауза между срабатываниями сценария в секундах."></div>' +
      '<div id="sc_scene_conds" style="margin-bottom:14px;">' +
      '<div class="sc-entry-subheader"><span>🌙 Срабатывать только когда…</span><select id="sc_scene_cond_mode" onchange="scMarkDirty()" title="«И» — все условия; «ИЛИ» — любое" style="width:auto;font-size:11px;"><option value="AND" selected>И (все)</option><option value="OR">ИЛИ (любое)</option></select><button class="sc-btn sc-btn-sm" onclick="scSceneAddCond(this)">+</button></div>' +
      '<div class="sc-ent-cond-list"></div>' +
      '</div>' +
      '<div id="sc_entries"></div>' +
      '<div style="margin-top:8px;"><button class="sc-btn sc-btn-sm" onclick="scAddEntry()">+ Добавить запись</button></div>' +
      '</div>' +
      '<div class="sc-editor-footer"><button class="sc-btn" onclick="scCloseEditor()">Отмена</button><button class="sc-btn sc-btn-primary" onclick="scSaveEditor()">💾 Сохранить</button></div>' +
      '</div></div>' +
      '<div id="sc_confirm_overlay"><div class="confirm-box">' +
      '<div class="confirm-text" id="sc_confirm_text"></div>' +
      '<div class="confirm-btns"><button class="sc-btn" onclick="scConfirmCancel()">Отмена</button><button class="sc-btn sc-btn-play" onclick="scConfirmOk()">▶ Запустить</button></div>' +
      '</div></div>' +
      '</div></div>',

    setup(node) {
      loadScenes();
      renderList();
      attachKeyShortcuts();
      node._state = {};
    },

    destroy(node) {
      st.exiting = true;
      st.keyAttached = false;
      node._state = null;
      ['sc_list', 'sc_search', 'sc_device_filter', 'sc_editor_overlay', 'sc_editor', 'sc_confirm_overlay'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });
})();