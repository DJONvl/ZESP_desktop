// yandexedit.js — редактор описания Яндекс (ya_rep) для Device editor.
// Вынесен из templateedit.js. Зависимости (рантайм, globals):
// te_file, te_currentYaObj (чтение/запись), te_syncLive(), te_YA_JSON внутри.
// Подключается в desktop/index.html ПОСЛЕ templateedit.js.

// ===== YA REP EDITOR =====
te_YA_JSON = {"capability": [{"on_off": {"desc": "Включение/выключение", "tpl": {"type": "devices.capabilities.on_off", "retrievable": true, "reportable": true, "state": {"instance": "on", "value": false}}}}, {"color_setting": {"desc": "Цвет (температура K)", "tpl": {"type": "devices.capabilities.color_setting", "retrievable": true, "reportable": true, "parameters": {"temperature_k": {"max": 6500, "min": 1000}}, "state": {"instance": "temperature_k", "value": 4000}}}}, {"range": {"desc": "Диапазон — выбери instance ▼", "tpl": {"type": "devices.capabilities.range", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "brightness", "random_access": true, "range": {"max": 100, "min": 1, "precision": 1}, "unit": "unit.percent"}, {"instance": "volume", "random_access": true, "range": {"max": 100, "min": 0, "precision": 1}, "unit": "unit.percent"}, {"instance": "open", "random_access": true, "range": {"max": 100, "min": 0, "precision": 10}, "unit": "unit.percent"}, {"instance": "humidity", "random_access": true, "range": {"max": 100, "min": 10, "precision": 10}, "unit": "unit.percent"}, {"instance": "temperature", "random_access": true, "range": {"max": 40, "min": 18, "precision": 1}, "unit": "unit.temperature.celsius"}, {"instance": "channel", "random_access": true, "range": {"min": 0, "max": 999, "precision": 1}}], "state": {"instance": "brightness", "value": 50}}}}, {"toggle": {"desc": "Переключатель — выбери instance ▼", "tpl": {"type": "devices.capabilities.toggle", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "backlight"}, {"instance": "controls_locked"}, {"instance": "ionization"}, {"instance": "keep_warm"}, {"instance": "mute"}, {"instance": "oscillation"}, {"instance": "pause"}]}}}, {"mode": {"desc": "Режим работы — выбери instance ▼", "tpl": {"type": "devices.capabilities.mode", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "fan_speed", "modes": [{"value": "auto"}, {"value": "high"}, {"value": "medium"}, {"value": "low"}, {"value": "quiet"}, {"value": "turbo"}]}, {"instance": "thermostat", "modes": [{"value": "auto"}, {"value": "fan_only"}, {"value": "heat"}, {"value": "cool"}, {"value": "dry"}, {"value": "preheat"}]}, {"instance": "work_speed", "modes": [{"value": "auto"}, {"value": "fast"}, {"value": "max"}, {"value": "medium"}, {"value": "min"}, {"value": "slow"}, {"value": "turbo"}]}, {"instance": "swing", "modes": [{"value": "vertical"}, {"value": "horizontal"}, {"value": "stationary"}, {"value": "auto"}]}, {"instance": "program", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "input_source", "modes": [{"value": "one"}, {"value": "two"}, {"value": "three"}, {"value": "four"}, {"value": "five"}, {"value": "hdmi"}, {"value": "hdmi1"}, {"value": "hdmi2"}]}, {"instance": "cleanup_mode", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "tea_mode", "modes": [{"value": "black_tea"}, {"value": "green_tea"}, {"value": "oolong_tea"}, {"value": "express"}]}]}}}], "float": [{"amperage": {"desc": "Ток (А)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "amperage", "unit": "unit.ampere"}, "state": {"instance": "amperage", "value": 0}}}}, {"battery_level": {"desc": "Заряд батареи (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "unit": "unit.percent"}, "state": {"instance": "battery_level", "value": 0}}}}, {"co2_level": {"desc": "CO₂ (ppm)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "co2_level", "unit": "unit.ppm"}, "state": {"instance": "co2_level", "value": 0}}}}, {"humidity": {"desc": "Влажность (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "humidity", "unit": "unit.percent"}, "state": {"instance": "humidity", "value": 0}}}}, {"illumination": {"desc": "Освещённость (лк)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "illumination", "unit": "unit.illumination.lux"}, "state": {"instance": "illumination", "value": 0}}}}, {"pm1_density": {"desc": "PM1 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm1_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm1_density", "value": 0}}}}, {"pm2_5_density": {"desc": "PM2.5 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm2.5_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm2.5_density", "value": 0}}}}, {"pm10_density": {"desc": "PM10 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm10_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm10_density", "value": 0}}}}, {"power": {"desc": "Мощность (Вт)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "power", "unit": "unit.watt"}, "state": {"instance": "power", "value": 0}}}}, {"pressure": {"desc": "Давление (мм рт.ст.)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pressure", "unit": "unit.pressure.mmhg"}, "state": {"instance": "pressure", "value": 0}}}}, {"temperature": {"desc": "Температура (°C)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "temperature", "unit": "unit.temperature.celsius"}, "state": {"instance": "temperature", "value": 0}}}}, {"tvoc": {"desc": "TVOC органика (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "tvoc", "unit": "unit.density.mcg_m3"}, "state": {"instance": "tvoc", "value": 0}}}}, {"voltage": {"desc": "Напряжение (В)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "voltage", "unit": "unit.volt"}, "state": {"instance": "voltage", "value": 0}}}}, {"water_level": {"desc": "Уровень воды (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "unit": "unit.percent"}, "state": {"instance": "water_level", "value": 0}}}}, {"electricity_meter": {"desc": "Счётчик эл.энергии (кВт·ч)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "electricity_meter", "unit": "unit.kilowatt_hour"}, "state": {"instance": "electricity_meter", "value": 0}}}}, {"water_meter": {"desc": "Счётчик воды (м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_meter", "unit": "unit.cubic_meter"}, "state": {"instance": "water_meter", "value": 0}}}}], "event": [{"vibration": {"desc": "Вибрация / наклон / падение", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "vibration", "events": [{"value": "tilt"}, {"value": "fall"}, {"value": "vibration"}]}, "state": {"instance": "vibration", "value": "vibration"}}}}, {"open": {"desc": "Открытие / закрытие", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "open", "events": [{"value": "opened"}, {"value": "closed"}]}, "state": {"instance": "open", "value": "opened"}}}}, {"button": {"desc": "Кнопка (клик / двойной / удержание)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "button", "events": [{"value": "click"}, {"value": "double_click"}, {"value": "long_press"}]}, "state": {"instance": "button", "value": "click"}}}}, {"motion": {"desc": "Движение / покой", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "motion", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "motion", "value": "not_detected"}}}}, {"smoke": {"desc": "Дым", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "smoke", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "smoke", "value": "not_detected"}}}}, {"gas": {"desc": "Газ", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "gas", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "gas", "value": "not_detected"}}}}, {"water_leak": {"desc": "Протечка", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_leak", "events": [{"value": "dry"}, {"value": "leak"}]}, "state": {"instance": "water_leak", "value": "dry"}}}}, {"battery_level": {"desc": "Заряд батареи (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "battery_level", "value": "normal"}}}}, {"water_level": {"desc": "Уровень воды (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "water_level", "value": "normal"}}}}, {"food_level": {"desc": "Уровень корма (empty/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "food_level", "events": [{"value": "empty"}, {"value": "normal"}]}, "state": {"instance": "food_level", "value": "normal"}}}}]};

te_currentYaObj = null;
te_currentYaData = null; // editor working object

te_yre_getObj = function() {
  return te_currentYaData;
};

te_yre_setObj = function(obj) {
  te_currentYaData = JSON.parse(JSON.stringify(obj)); // deep copy
  te_yre_refreshPreview();
};

// ─── JSON preview ───
te_yre_refreshPreview = function() {
  const pre = document.getElementById('te_yre_preview');
  if (!pre) return;
  const d = te_currentYaData;
  if (!d) { pre.textContent = '—'; } else { pre.textContent = JSON.stringify(d, null, 2); }
  try { te_yre_refreshDevice(); } catch (e) { console.log('yre device', e); }
};

// ─── Режим вкладок «Понятно / JSON» ───
te_yre_tabMode = 'human';
te_yre_tab = function(mode) {
  te_yre_tabMode = mode;
  ['human', 'json', 'full'].forEach(function (m) {
    var b = document.getElementById('te_yre_tab_' + m);
    if (b) b.style.cssText += ';background:' + (m === mode ? 'var(--accent);color:#fff;border-color:var(--accent)' : 'var(--bg3);color:var(--text);border-color:var(--border2)');
  });
  var human = document.getElementById('te_yre_human'), pre = document.getElementById('te_yre_preview'),
      full = document.getElementById('te_yre_preview_full');
  if (human) human.style.display = mode === 'human' ? 'block' : 'none';
  if (pre) pre.style.display = mode === 'json' ? 'block' : 'none';
  if (full) full.style.display = mode === 'full' ? 'block' : 'none';
};

// ─── Режимы из устройства: class.modes канала ("off,heat" или пары "name:HEX") ───
// Возвращает список имён в нижнем регистре или null, если в устройстве их нет.
te_yre_devModes = function(objKey) {
  try {
    var ck = objKey || te_currentYaObj;
    var ro = window.te_file && window.te_file.Report && window.te_file.Report[ck];
    if (!ro) return null;
    var m = (ro.class && ro.class.modes != null) ? ro.class.modes : null;
    if (m == null) {
      var role = String(ro.role || ''), ai = role.indexOf('&');
      if (ai !== -1) { try { m = JSON.parse(role.slice(ai + 1)).modes; } catch (e) { m = null; } }
    }
    if (m == null) return null;
    var list = Array.isArray(m) ? m.map(function (x) {
      return (x && typeof x === 'object') ? (x.value || x.name || x.mode || '') : String(x);
    }) : String(m).split(',');
    var names = [];
    list.forEach(function (s) {
      s = String(s == null ? '' : s).trim();
      if (!s) return;
      var nm = s, ci = s.lastIndexOf(':');
      if (ci > 0 && ci < s.length - 1) nm = s.slice(0, ci).trim();
      nm = nm.toLowerCase();
      if (nm && names.indexOf(nm) === -1) names.push(nm);
    });
    return names.length ? names : null;
  } catch (e) { return null; }
};

// ─── Все режимы instance из встроенных шаблонов (для галочек выбора) ───
te_yre_tplModes = function(instance) {
  try {
    var caps = (window.te_YA_JSON && te_YA_JSON.capability) || [];
    for (var i = 0; i < caps.length; i++) {
      var entry = caps[i].mode;
      if (!entry || !entry.tpl || !entry.tpl.arparameter) continue;
      var ap = entry.tpl.arparameter;
      for (var j = 0; j < ap.length; j++) {
        if (String(ap[j].instance) === String(instance)) {
          return (ap[j].modes || []).map(function (m) { return String((m && m.value != null) ? m.value : m); });
        }
      }
    }
  } catch (e) {}
  return [];
};

// ─── class канала (объект class или зашит в role&{...}) ───
te_yre_chanClass = function(objKey) {
  try {
    var ck = objKey || te_currentYaObj;
    var ro = window.te_file && window.te_file.Report && window.te_file.Report[ck];
    if (!ro) return {};
    if (ro.class && typeof ro.class === 'object') return ro.class;
    var role = String(ro.role || ''), ai = role.indexOf('&');
    if (ai !== -1) { try { return JSON.parse(role.slice(ai + 1)) || {}; } catch (e) { return {}; } }
  } catch (e) {}
  return {};
};

// ─── Диапазон из устройства: min_temp/max_temp/temp_step или min/max/step ───
te_yre_devRange = function(objKey) {
  try {
    var cls = te_yre_chanClass(objKey);
    var num = function (v) {
      if (v == null || v === '') return null;
      var f = parseFloat(String(v).replace(',', '.'));
      return isFinite(f) ? f : null;
    };
    var mn = num(cls.min_temp);
    var mx = num(cls.max_temp);
    var st = num(cls.temp_step);
    if (mn == null) mn = num(cls.min);
    if (mx == null) mx = num(cls.max);
    if (st == null) st = num(cls.step);
    if (st == null) st = num(cls.precision);
    if (mn == null && mx == null) return null;
    var r = {};
    if (mn != null) r.min = mn;
    if (mx != null) r.max = mx;
    r.precision = (st != null) ? st : 1;
    return r;
  } catch (e) { return null; }
};

// ─── ZCL SystemMode (кластер 0201, атрибут 001C) → имя режима ───
te_yre_sysModeName = function(raw) {
  var map = { 0: 'off', 1: 'auto', 2: 'auto', 3: 'cool', 4: 'heat', 5: 'heat', 6: 'cool', 7: 'fan_only', 8: 'dry', 9: 'auto' };
  if (/^[0-9]+$/.test(String(raw).trim())) {
    var n = parseInt(String(raw).trim(), 10);
    if (map[n] !== undefined) return map[n];
  }
  return String(raw);
};

// ─── Галочка режима вкл/выкл ───
te_yre_modeToggle = function(val) {
  var d = te_currentYaData;
  var cap0 = d && d.capabilities && d.capabilities[0];
  if (!cap0) return;
  val = String(val);
  var cur = ((cap0.parameters && cap0.parameters.modes) || []).map(function (m) { return String((m && m.value != null) ? m.value : m); });
  var ix = cur.indexOf(val);
  if (ix === -1) cur.push(val); else cur.splice(ix, 1);
  cap0.parameters = cap0.parameters || {};
  cap0.parameters.modes = cur.map(function (v) { return { value: v }; });
  if (!cap0.state) cap0.state = {};
  if (cur.indexOf(String(cap0.state.value)) === -1) cap0.state.value = cur.length ? cur[0] : '';
  te_yre_refreshPreview();
};

// ─── Выбор state.value среди включённых ───
te_yre_modeState = function(val) {
  var d = te_currentYaData;
  var cap0 = d && d.capabilities && d.capabilities[0];
  if (!cap0) return;
  if (!cap0.state) cap0.state = {};
  cap0.state.value = String(val);
  te_yre_refreshPreview();
};
// ─── Полный JSON устройства «как уйдёт в Яндекс» ───
// Повторяет buildDeviceList (internal/yandex/hubws.go): основное устройство
// со склейкой всех каналов + отдельные multi_id-устройства массивом.
te_yre_buildFullJson = function(dev) {
  dev = dev || te_yre_collectDevice();
  var main = {
    id: dev.id || '',
    name: dev.name || '',
    room: dev.room || '',
    type: dev.type || ''
  };
  main.capabilities = dev.caps.map(function (e) { return e.cap; });
  main.properties = dev.props.map(function (e) { return e.prop; });
  var arr = [main];
  dev.multis.forEach(function (m) {
    arr.push({
      id: (dev.id || '') + '^' + m.key,
      name: (m.multi && m.multi.name) || '',
      room: (m.multi && m.multi.room) || '',
      type: (m.multi && m.multi.type) || '',
      capabilities: m.caps || [],
      properties: m.props || []
    });
  });
  return arr;
};

// ─── Нормализация ya_rep одного канала ───
// Возвращает {kind:'none'|'empty'|'obj'|'bad', data}
te_yre_parseYaRep = function(val) {
  if (val === undefined || val === null) return { kind: 'empty' };
  if (typeof val === 'string') {
    var s = val.trim();
    if (s === '' ) return { kind: 'empty' };
    if (s === 'none') return { kind: 'none' };
    try { return { kind: 'obj', data: JSON.parse(s) }; }
    catch (e) { return { kind: 'bad', raw: val }; }
  }
  if (typeof val === 'object') return { kind: 'obj', data: val };
  return { kind: 'bad', raw: val };
};

te_yre_shortType = function(t) {
  return String(t || '').replace('devices.capabilities.', '').replace('devices.properties.', '');
};

// ─── Человекочитаемая расшифровка одного умения/свойства ───
te_yre_humanOne = function(o, isCap) {
  try {
    var icon = isCap ? '⚡' : '📊';
    var type = te_yre_shortType(o.type);
    var p = o.parameters || {};
    var inst = p.instance || ((o.state && o.state.instance) || '');
    var parts = [];
    if (inst) parts.push('<b>' + inst + '</b>');
    if (p.unit) parts.push('ед: ' + String(p.unit).replace('unit.', ''));
    if (p.range) parts.push('диапазон ' + p.range.min + '…' + p.range.max + ' (шаг ' + (p.range.precision != null ? p.range.precision : '?') + ')');
    if (p.modes) {
      var mn = p.modes.map(function (m) { return (m && m.value != null) ? m.value : m; }).join(', ');
      parts.push('режимы: ' + mn);
    }
    if (p.events) {
      var en = p.events.map(function (e) { return (e && e.value != null) ? e.value : e; }).join(', ');
      parts.push('события: ' + en);
    }
    if (p.temperature_k) parts.push('цвет.темп: ' + p.temperature_k.min + '…' + p.temperature_k.max + 'K');
    if (p.color_model) parts.push('модель: ' + p.color_model);
    var st = (o.state && o.state.value !== undefined) ? o.state.value : '—';
    var flags = [];
    if (o.retrievable === true) flags.push('читаемое');
    if (o.reportable === true) flags.push('пушит изменения');
    if (!o.retrievable && !o.reportable) flags.push('вслепую');
    return '<div style="margin-bottom:4px">' + icon + ' <b>' + type + '</b> ' + parts.join(' · ') +
      '<br><span style="color:var(--faint)">состояние: ' + st + (flags.length ? ' (' + flags.join(', ') + ')' : '') + '</span></div>';
  } catch (e) { return ''; }
};

// ─── Сборка итогового устройства «как увидит Яндекс» ───
// Склеивает ya_rep всех каналов te_file.Report; текущий редактируемый канал
// подменяется несохранённым te_currentYaData. Повторяет логику бэкенда:
// buildDeviceList + zesp2ya (internal/yandex/hubws.go) — multi_id уходит
// отдельными устройствами, 'none' скрывает канал, пусто = автоподбор по role.
te_yre_collectDevice = function() {
  var dev = { name: '', room: '', type: '', id: '', caps: [], props: [], multis: [], chans: [], empty: false };
  if (!window.te_file) return dev;
  var f = window.te_file;
  dev.name = f.Name || '';
  dev.room = f.Location || '';
  dev.type = f.type || '';
  dev.id = f.IEEE || '';
  var rep = f.Report || {};
  var keys = Object.keys(rep);
  var autoCount = 0, noneCount = 0;
  keys.forEach(function (k) {
    var ro = rep[k] || {};
    var val = (k === te_currentYaObj) ? te_currentYaData : ro.ya_rep;
    // несохранённый редактор: null = пользователь ещё ничего не выбрал,
    // тогда берём сохранённое значение канала
    if (k === te_currentYaObj && (val === null || val === undefined)) val = ro.ya_rep;
    var n = te_yre_parseYaRep(val);
    var ch = { key: k, label: ro.label || '', parsed: ro.parsed, kind: n.kind, caps: [], props: [], multi: null };
    if (n.kind === 'obj' && n.data) {
      if (n.data.multi_id) {
        ch.multi = n.data.multi_id;
        dev.multis.push({ key: k, multi: n.data.multi_id, caps: n.data.capabilities || [], props: n.data.properties || [] });
      } else {
        (n.data.capabilities || []).forEach(function (c) { ch.caps.push(c); dev.caps.push({ key: k, cap: c }); });
        (n.data.properties || []).forEach(function (p) { ch.props.push(p); dev.props.push({ key: k, prop: p }); });
      }
    } else if (n.kind === 'empty') { autoCount++; }
    else if (n.kind === 'none') { noneCount++; }
    dev.chans.push(ch);
  });
  dev.autoCount = autoCount;
  dev.noneCount = noneCount;
  dev.empty = (dev.caps.length + dev.props.length) === 0;
  return dev;
};

// ─── Валидация по чек-листу desktop/docs/yandex_help.md (раздел 0) ───
// Возвращает [{lvl:'err'|'warn', text}]
te_yre_validate = function(dev) {
  var out = [];
  var push = function (lvl, text) { out.push({ lvl: lvl, text: text }); };
  // 1. тип устройства
  if (!dev.type || String(dev.type).indexOf('devices.types.') !== 0)
    push('err', 'Тип устройства «' + (dev.type || 'пусто') + '» должен начинаться с devices.types. (поле type шаблона)');
  // 2. суммарно не пусты
  if (dev.empty && dev.multis.length === 0)
    push('err', 'Нет ни одного умения/свойства: Яндекс отвергнет всё обнаружение целиком, а не одно устройство');
  dev.caps.forEach(function (e) {
    var c = e.cap || {}, p = c.parameters || {}, key = e.key;
    var t = te_yre_shortType(c.type);
    if (t === 'range') {
      if (!p.range || p.range.min == null || p.range.max == null || p.range.precision == null)
        push('err', key + ': у range заполни min, max и precision');
      if (!p.instance) push('err', key + ': у range нет instance');
      if (String(p.instance) === 'brightness' && c.state && (c.state.value === 0 || c.state.value > 100))
        push('err', key + ': brightness должен быть 1–100, а не 0–255');
    }
    if (t === 'mode') {
      if (!p.modes || !p.modes.length) push('err', key + ': у mode пустой modes[]');
      else if (c.state) {
        var vals = p.modes.map(function (m) { return String((m && m.value != null) ? m.value : m); });
        if (vals.indexOf(String(c.state.value)) === -1)
          push('err', key + ': state.value «' + c.state.value + '» нет в списке modes');
      }
      if (!p.instance) push('err', key + ': у mode нет instance');
    }
    if (t === 'toggle' && !p.instance) push('err', key + ': у toggle нет instance');
    if (t === 'color_setting' && p.temperature_k) {
      if (p.temperature_k.min < 2000 || p.temperature_k.max > 9000)
        push('err', key + ': temperature_k вне 2000–9000');
      else if (p.temperature_k.min < 2700 || p.temperature_k.max > 6500)
        push('warn', key + ': temperature_k за пределами рекомендуемых 2700–6500');
    }
    if (!c.retrievable && !c.reportable) push('warn', key + ' (' + t + '): управление вслепую — нет ни retrievable, ни reportable');
  });
  dev.props.forEach(function (e) {
    var c = e.prop || {}, p = c.parameters || {}, key = e.key;
    var t = te_yre_shortType(c.type);
    if (t === 'float' && (!p.instance || !p.unit))
      push('err', key + ': у float нужны оба поля — instance и unit');
    if (t === 'event') {
      if (!p.events || !p.events.length) push('err', key + ': у event пустой events[]');
      if (!p.instance) push('err', key + ': у event нет instance');
    }
  });
  dev.multis.forEach(function (m) {
    var t = String((m.multi && m.multi.type) || '');
    if (t.indexOf('devices.types.') !== 0)
      push('err', m.key + ': multi_id.type «' + t + '» — нужно полное имя вида devices.types.switch');
    if (!m.multi.name) push('warn', m.key + ': у multi_id пустое имя');
    if (!((m.caps && m.caps.length) || (m.props && m.props.length)))
      push('err', m.key + ': multi-устройство без умений и свойств Яндекс отвергнет');
  });
  // Дублей умений/свойств (type+instance) Яндекс не принимает —
  // отклоняет устройство целиком (см. лог провайдера: duplicated capability found).
  var seenC = {};
  dev.caps.forEach(function (e) {
    var c = e.cap || {};
    var inst = (c.parameters && c.parameters.instance) || ((c.state && c.state.instance) || '');
    var k = String(c.type) + ':' + String(inst);
    if (seenC[k]) push('err', e.key + ': дубль ' + te_yre_shortType(c.type) + (inst ? ':' + inst : '') + ' — вынеси канал в multi_id или скрой (none)');
    else seenC[k] = true;
  });
  var seenP = {};
  dev.props.forEach(function (e) {
    var c = e.prop || {};
    var inst = (c.parameters && c.parameters.instance) || ((c.state && c.state.instance) || '');
    var k = String(c.type) + ':' + String(inst);
    if (seenP[k]) push('err', e.key + ': дубль свойства ' + te_yre_shortType(c.type) + (inst ? ':' + inst : '') + ' — вынеси канал в multi_id или скрой (none)');
    else seenP[k] = true;
  });
  return out;
};

// ─── Короткая подпись ya_rep для строки статуса ───
te_yre_short = function(val) {
  var n = te_yre_parseYaRep(val === undefined ? null : val);
  if (n.kind === 'none') return 'none (скрыт)';
  if (n.kind === 'empty') return 'авто по role';
  if (n.kind === 'bad') return 'битый JSON';
  if (n.kind === 'obj' && n.data) {
    var d = n.data;
    if (d.multi_id) return '🔀 ' + ((d.multi_id && d.multi_id.name) || '?');
    var t = (d.capabilities || []).map(function (c) { return te_yre_shortType(c.type); })
      .concat((d.properties || []).map(function (p) { return te_yre_shortType(p.type); }));
    return (d.capabilities ? '⚡ ' : '📊 ') + (t.join(', ') || 'пусто');
  }
  return '—';
};

// ─── Перерисовка панели «Как увидит Яндекс» ───
te_yre_refreshDevice = function() {
  var dev = te_yre_collectDevice();
  // --- строка статуса: сохранено vs выбрано ---
  var stBox = document.getElementById('te_yre_status');
  if (stBox) {
    var savedVal = null;
    try { savedVal = window.te_file.Report[te_currentYaObj].ya_rep; } catch (e) {}
    var dirty = false;
    try {
      var sNorm = te_yre_parseYaRep(savedVal);
      var sKey = sNorm.kind === 'obj' ? JSON.stringify(sNorm.data) : sNorm.kind;
      var cKey = te_currentYaData ? JSON.stringify(te_currentYaData) : sKey;
      dirty = (te_currentYaData && cKey !== sKey);
    } catch (e) {}
    stBox.innerHTML = 'Сохранено: <b>' + te_yre_short(savedVal) + '</b> · Выбрано: <b>' +
      (te_currentYaData ? te_yre_short(te_currentYaData) : '—') + '</b>' +
      (dirty ? ' <span style="color:var(--yellow)">● не применено</span>' : '');
  }
  // --- расшифровка текущего канала ---
  var human = document.getElementById('te_yre_human');
  if (human && te_currentYaData) {
    var h = '';
    (te_currentYaData.capabilities || []).forEach(function (c, cix) {
      h += '<div style="position:relative">' + te_yre_humanOne(c, true) +
        '<span onclick="te_yre_delCap(' + cix + ')" title="Убрать умение из канала" style="cursor:pointer;color:var(--red)">✖</span></div>';
    });
    (te_currentYaData.properties || []).forEach(function (p, pix) {
      h += '<div style="position:relative">' + te_yre_humanOne(p, false) +
        '<span onclick="te_yre_delProp(' + pix + ')" title="Убрать свойство из канала" style="cursor:pointer;color:var(--red)">✖</span></div>';
    });
    if (te_currentYaData.multi_id) {
      var m = te_currentYaData.multi_id;
      h += '<div style="margin:4px 0;padding:4px 6px;background:var(--bg3);border-radius:4px">🔀 Отдельное устройство: <b>' +
        (m.name || 'без имени') + '</b> · ' + (m.room || 'без комнаты') + ' · ' + (m.type || '?') + '</div>';
    }
    human.innerHTML = h || '<span style="color:var(--faint)">—</span>';
  } else if (human) { human.innerHTML = '<span style="color:var(--faint)">Пока пусто — выбери шаблон слева.</span>'; }
  // --- живое значение канала ---
  var live = document.getElementById('te_yre_live');
  if (live) {
    if (te_currentYaObj && window.te_file && window.te_file.Report && window.te_file.Report[te_currentYaObj]) {
      var ro = window.te_file.Report[te_currentYaObj];
      var pv = (ro.parsed !== undefined && ro.parsed !== null && ro.parsed !== '') ? ro.parsed : '—';
      var hint = '';
      try {
        var rCls = (ro.class && typeof ro.class === 'object') ? ro.class : {};
        if (rCls.climate_part === 'system_mode' && pv !== '—') hint = ' → <b>' + te_yre_sysModeName(pv) + '</b>';
      } catch (e) {}
      live.innerHTML = 'Канал <b>' + te_currentYaObj + '</b>' + (ro.label ? ' (' + ro.label + ')' : '') +
        ' · сейчас в устройстве: <b>' + pv + '</b>' + hint + ' — это значение уйдёт в state.value при отправке в Яндекс';
    } else { live.innerHTML = ''; }
  }
  // --- выбор режимов (только для capability mode) ---
  var mbox = document.getElementById('te_yre_modebox');
  if (mbox) {
    var mCap = te_currentYaData && te_currentYaData.capabilities && te_currentYaData.capabilities[0];
    if (mCap && mCap.type === 'devices.capabilities.mode') {
      mbox.style.display = 'block';
      var mInst = (mCap.parameters && mCap.parameters.instance) || ((mCap.state && mCap.state.instance) || '');
      var mCur = ((mCap.parameters && mCap.parameters.modes) || []).map(function (x) { return String((x && x.value != null) ? x.value : x); });
      var mDev = te_yre_devModes() || [];
      var mTpl = te_yre_tplModes(mInst);
      var mAll = [];
      mDev.concat(mTpl).forEach(function (v) { if (mAll.indexOf(v) === -1) mAll.push(v); });
      var mState = (mCap.state && mCap.state.value != null) ? String(mCap.state.value) : '';
      var mh = '<div style="margin-bottom:4px"><b>Режимы «' + mInst + '»</b> — галочками выбери нужные</div>';
      if (mDev.length) mh += '<div style="margin-bottom:4px;color:var(--muted)">В устройстве (class.modes): <b>' + mDev.join(', ') + '</b></div>';
      else mh += '<div style="margin-bottom:4px;color:var(--yellow)">В устройстве режимов нет — показаны шаблонные, проверь class.modes канала</div>';
      mAll.forEach(function (v) {
        var on = mCur.indexOf(v) !== -1;
        var fromDev = mDev.indexOf(v) !== -1 ? ' · из устройства' : '';
        mh += '<label style="display:inline-flex;align-items:center;gap:4px;margin:0 10px 4px 0;cursor:pointer">' +
          '<input type="checkbox"' + (on ? ' checked' : '') + ' onchange="te_yre_modeToggle(\'' + v + '\')">' +
          '<span>' + v + '<span style="color:var(--faint);font-size:10px">' + fromDev + '</span></span></label>';
      });
      if (mCur.length) {
        mh += '<div style="margin-top:4px">Начальное состояние: ';
        mCur.forEach(function (v) {
          var sel = v === mState;
          mh += '<label style="display:inline-flex;align-items:center;gap:3px;margin-right:8px;cursor:pointer">' +
            '<input type="radio" name="te_yre_mstate"' + (sel ? ' checked' : '') + ' onchange="te_yre_modeState(\'' + v + '\')">' + v + '</label>';
        });
        mh += '</div>';
      } else {
        mh += '<div style="color:var(--red)">Ни один режим не выбран — Яндекс отвергнет устройство</div>';
      }
      mbox.innerHTML = mh;
    } else { mbox.style.display = 'none'; mbox.innerHTML = ''; }
  }
  // --- полный JSON устройства ---
  var fullPre = document.getElementById('te_yre_preview_full');
  if (fullPre) {
    try { fullPre.textContent = JSON.stringify(te_yre_buildFullJson(dev), null, 2); }
    catch (e) { fullPre.textContent = '?'; }
  }
  // --- валидация: канал + устройство ---
  var warnBox = document.getElementById('te_yre_warn');
  if (warnBox) {
    var issues = te_yre_validate(dev);
    if (!issues.length) {
      warnBox.innerHTML = '<div style="color:var(--green)">✓ По чек-листу ошибок нет</div>';
    } else {
      warnBox.innerHTML = issues.map(function (w) {
        var col = w.lvl === 'err' ? 'var(--red)' : 'var(--yellow)';
        var mark = w.lvl === 'err' ? '✖' : '⚠';
        return '<div style="color:' + col + ';margin-bottom:2px">' + mark + ' ' + w.text + '</div>';
      }).join('');
    }
  }
  // --- устройство целиком ---
  var box = document.getElementById('te_yre_device');
  if (!box) return;
  var s = '<div style="margin-bottom:6px"><b>' + (dev.name || 'Без имени') + '</b> · ' + (dev.room || 'без комнаты') +
    '<br><span style="color:var(--faint)">type: ' + (dev.type || '?') + ' · id: ' + (dev.id || '?') + '</span></div>';
  s += '<div style="margin-bottom:4px">📦 Умения: <b>' + dev.caps.length + '</b> · Свойства: <b>' + dev.props.length + '</b>';
  if (dev.autoCount) s += ' · <span style="color:var(--faint)">авто по role: ' + dev.autoCount + '</span>';
  if (dev.noneCount) s += ' · <span style="color:var(--faint)">скрыто (none): ' + dev.noneCount + '</span>';
  s += '</div>';
  s += '<div style="max-height:120px;overflow-y:auto;margin-bottom:6px">';
  dev.chans.forEach(function (ch) {
    var mark = '?', desc = '';
    var isCur = (ch.key === te_currentYaObj);
    if (ch.kind === 'none') { mark = '🚫'; desc = 'скрыт'; }
    else if (ch.kind === 'empty') { mark = '🤖'; desc = 'авто по role'; }
    else if (ch.kind === 'bad') { mark = '❌'; desc = 'битый JSON'; }
    else if (ch.multi) { mark = '🔀'; desc = '→ ' + (ch.multi.name || ch.key) + (ch.label ? ' (' + ch.label + ')' : ''); }
    else {
      var names = [];
      ch.caps.forEach(function (c) {
        var ci = (c.parameters && c.parameters.instance) ? ':' + c.parameters.instance : '';
        names.push(te_yre_shortType(c.type) + ci);
      });
      ch.props.forEach(function (p) {
        var pi = (p.parameters && p.parameters.instance) ? ':' + p.parameters.instance : '';
        names.push(te_yre_shortType(p.type) + pi);
      });
      mark = ch.caps.length ? '⚡' : '📊';
      desc = (ch.label ? ch.label + ' — ' : '') + (names.join(', ') || 'пусто');
      if (isCur) desc = '<b>' + desc + ' ✏️ редактируется</b>';
    }
    s += '<div style="font-size:11px;padding:2px 0;border-bottom:1px solid var(--border)">' + mark + ' <span style="font-family:monospace">' +
      ch.key + '</span> — ' + desc + '</div>';
  });
  s += '</div>';
  if (dev.multis.length) {
    s += '<div style="margin-bottom:4px"><b>🔀 Отдельных устройств: ' + dev.multis.length + '</b></div>';
    dev.multis.forEach(function (m) {
      s += '<div style="font-size:11px;padding:3px 6px;margin-bottom:3px;background:var(--bg3);border-radius:4px">🔀 <b>' +
        (m.multi.name || '?') + '</b> · ' + (m.multi.room || '?') + ' · ' + (m.multi.type || '?') +
        '<br><span style="color:var(--faint)">id: ' + dev.id + '^' + m.key + '</span></div>';
    });
  }
  box.innerHTML = s;
};

// ─── Режим «Заменить / Добавить» при клике по шаблону ───
te_yre_addMode = false;
// Раскрытый узел дерева (варианты arparameter): "cat:i" или null.
// Выбранное: te_yre_selTpl ("cat:i") или te_yre_selArp ("cat:i:j").
te_yre_expanded = null;
te_yre_selTpl = null;
te_yre_selArp = null;
te_yre_setAddMode = function(on) {
  te_yre_addMode = !!on;
  var rb = document.getElementById('te_yre_btn_replace'), ab = document.getElementById('te_yre_btn_add');
  var onCss = ';background:var(--accent);color:#fff;border-color:var(--accent)';
  var offCss = ';background:var(--bg3);color:var(--text);border-color:var(--border2)';
  if (rb) rb.style.cssText += on ? offCss : onCss;
  if (ab) ab.style.cssText += on ? onCss : offCss;
};

// ─── Добавить умения/свойства к текущему объекту (не заменяя) ───
te_yre_addObj = function(obj) {
  if (!te_currentYaData) { te_yre_setObj(obj); return; }
  var d = te_currentYaData;
  ['capabilities', 'properties'].forEach(function (k) {
    if (!obj[k] || !obj[k].length) return;
    if (!d[k]) d[k] = [];
    obj[k].forEach(function (x) { d[k].push(JSON.parse(JSON.stringify(x))); });
  });
  te_yre_refreshPreview();
  try { te_yre_syncFlags(); } catch (e) {}
};

// ─── Убрать умение/свойство из текущего объекта ───
te_yre_delCap = function(ix) {
  var d = te_currentYaData;
  if (d && d.capabilities && d.capabilities[ix] !== undefined) d.capabilities.splice(ix, 1);
  te_yre_refreshPreview();
};
te_yre_delProp = function(ix) {
  var d = te_currentYaData;
  if (d && d.properties && d.properties[ix] !== undefined) d.properties.splice(ix, 1);
  te_yre_refreshPreview();
};

// ─── Template list render: дерево, варианты arparameter — дети узла ───
te_yre_renderList = function() {
  const container = document.getElementById('te_yre_list');
  if (!container) return;
  const Ya = te_YA_JSON;
  const catLabels = { capability: '⚡ Capability', float: '📊 Float', event: '🔔 Event' };
  let html = '';
  for (const cat of ['capability', 'float', 'event']) {
    html += `<div style="padding:3px 8px;font-weight:bold;font-size:11px;color:#fff;background:#5a4a7a;margin-bottom:1px;">${catLabels[cat]}</div>`;
    for (let i = 0; i < Ya[cat].length; i++) {
      const key   = Object.keys(Ya[cat][i])[0];
      const desc  = Ya[cat][i][key].desc;
      const hasSub = !!(Ya[cat][i][key].tpl && Ya[cat][i][key].tpl.arparameter);
      const expKey = cat + ':' + i;
      const isExp = window.te_yre_expanded === expKey;
      const sel = (!hasSub && window.te_yre_selTpl === expKey) ? ' yre-active' : '';
      html += `<div class="yre-item${sel}" title="${desc}" onclick="te_yre_selectTpl('${cat}',${i})">${hasSub ? (isExp ? '▾ ' : '▸ ') : ''}${key}</div>`;
      if (hasSub && isExp) {
        Ya[cat][i][key].tpl.arparameter.forEach((arp, j) => {
          const nm = arp.instance || JSON.stringify(arp);
          const sub = (window.te_yre_selArp === expKey + ':' + j) ? ' yre-active' : '';
          html += `<div class="yre-item${sub}" style="padding-left:20px;background:var(--bg1);font-size:11px;" title="${desc}" onclick="te_yre_selectTpl_arp('${cat}',${i},${j})">↳ ${nm}</div>`;
        });
      }
    }
  }
  container.innerHTML = html;
};

// ─── Template selection from the list ───
te_yre_selectTpl = function(cat, i) {
  const Ya  = te_YA_JSON;
  const key = Object.keys(Ya[cat][i])[0];
  const tpl = JSON.parse(JSON.stringify(Ya[cat][i][key].tpl));

  // Узел с вариантами — раскрыть/свернуть дерево, справа ничего не трогаем
  if (tpl.arparameter) {
    const expKey = cat + ':' + i;
    window.te_yre_expanded = (window.te_yre_expanded === expKey) ? null : expKey;
    te_yre_renderList();
    return;
  }

  window.te_yre_selTpl = cat + ':' + i;
  window.te_yre_selArp = null;
  let tt = cat === 'capability' ? { capabilities: [tpl] } : { properties: [tpl] };
  if (te_currentYaData && te_currentYaData.multi_id)
    tt.multi_id = te_currentYaData.multi_id;

  if (window.te_yre_addMode) te_yre_addObj(tt); else te_yre_setObj(tt);
  te_yre_syncFlags();
  te_yre_renderList();
};

// ─── Сборка объекта шаблона из te_YA_JSON (общее для модалки и вкладки) ───
// j == null → целый tpl без arparameter; иначе вариант arparameter[j].
// objKey — канал для подхвата режимов/диапазонов из устройства (по умолчанию te_currentYaObj).
te_yre_buildTpl = function(cat, i, j, objKey) {
  var entry = te_YA_JSON[cat][i];
  var tpl = JSON.parse(JSON.stringify(entry[Object.keys(entry)[0]].tpl));
  if (j !== undefined && j !== null) {
    var arp = tpl.arparameter[j];
    if (tpl.type === 'devices.capabilities.range') {
      tpl.parameters = { instance: arp.instance, random_access: arp.random_access || true };
      if (arp.range)  tpl.parameters.range = arp.range;
      if (arp.unit)   tpl.parameters.unit  = arp.unit;
      var devR = te_yre_devRange(objKey);
      if (devR) tpl.parameters.range = devR;
      var stVal = (tpl.parameters.range && tpl.parameters.range.min != null) ? tpl.parameters.range.min : 0;
      try {
        var pro2 = window.te_file && window.te_file.Report && window.te_file.Report[objKey || te_currentYaObj];
        var pf2 = pro2 ? parseFloat(String(pro2.parsed).replace(',', '.')) : NaN;
        if (isFinite(pf2)) {
          var rg2 = tpl.parameters.range || {};
          if ((rg2.min == null || pf2 >= rg2.min) && (rg2.max == null || pf2 <= rg2.max)) stVal = pf2;
        }
      } catch (e) {}
      tpl.state = { instance: arp.instance, value: stVal };
    } else if (tpl.type === 'devices.capabilities.mode') {
      var devModes = te_yre_devModes(objKey);
      var srcModes = arp.modes || [];
      var useModes = srcModes;
      if (devModes && devModes.length) {
        var filtered = srcModes.filter(function (mm) {
          var vv = String((mm && mm.value != null) ? mm.value : mm).toLowerCase();
          return devModes.indexOf(vv) !== -1;
        });
        if (filtered.length) useModes = filtered;
      }
      tpl.parameters = { instance: arp.instance, modes: useModes };
      tpl.state = { instance: arp.instance, value: (useModes && useModes[0]) ? useModes[0].value : '' };
    } else if (tpl.type === 'devices.capabilities.toggle') {
      tpl.parameters = { instance: arp.instance };
      tpl.state = { instance: arp.instance, value: false };
    }
    delete tpl.arparameter;
  }
  return cat === 'capability' ? { capabilities: [tpl] } : { properties: [tpl] };
};

// Apply the selected arparameter
te_yre_selectTpl_arp = function(cat, i, j) {
  var tt = te_yre_buildTpl(cat, i, j);

  if (te_currentYaData && te_currentYaData.multi_id)
    tt.multi_id = te_currentYaData.multi_id;

  if (window.te_yre_addMode) te_yre_addObj(tt); else te_yre_setObj(tt);
  te_yre_syncFlags();
  // Подсветить выбранный вариант в дереве, узел не схлопывать
  window.te_yre_selTpl = null;
  window.te_yre_selArp = cat + ':' + i + ':' + j;
  te_yre_renderList();
};

// ─── retrievable/reportable flag sync with the current object ───
te_yre_syncFlags = function() {
  const d = te_currentYaData;
  if (!d) return;
  let retr = false, repo = false;
  try {
    const arr = d.capabilities || d.properties || [];
    retr = arr[0].retrievable === true;
    repo = arr[0].reportable  === true;
  } catch(e) {}
  document.getElementById('te_yre_retrievable').checked = retr;
  document.getElementById('te_yre_reportable').checked  = repo;
};

// ─── Updating flags in the object on checkbox click ───
te_yre_updateFlags = function() {
  const d = te_currentYaData;
  if (!d) return;
  const retr = document.getElementById('te_yre_retrievable').checked;
  const repo = document.getElementById('te_yre_reportable').checked;
  const arr = d.capabilities || d.properties;
  if (arr && arr[0]) {
    if (arr[0].hasOwnProperty('retrievable')) arr[0].retrievable = retr;
    if (arr[0].hasOwnProperty('reportable'))  arr[0].reportable  = repo;
  }
  te_yre_refreshPreview();
};

// ─── Multi-device ───
te_yre_toggleMulti = function() {
  const on  = document.getElementById('te_yre_multi').checked;
  const fld = document.getElementById('te_yre_multi_fields');
  fld.style.display = on ? 'block' : 'none';
  const d = te_currentYaData;
  if (!d) return;
  if (on) {
    if (!d.multi_id) d.multi_id = { name: '', room: '', type: 'devices.types.other' };
    document.getElementById('te_yre_mname').value = d.multi_id.name || '';
    document.getElementById('te_yre_mroom').value = d.multi_id.room || '';
    document.getElementById('te_yre_mtype').value = d.multi_id.type || 'devices.types.other';
  } else {
    delete d.multi_id;
  }
  te_yre_refreshPreview();
};

te_yre_updateMulti = function() {
  const d = te_currentYaData;
  if (!d || !d.multi_id) return;
  d.multi_id.name = document.getElementById('te_yre_mname').value;
  d.multi_id.room = document.getElementById('te_yre_mroom').value;
  d.multi_id.type = document.getElementById('te_yre_mtype').value;
  te_yre_refreshPreview();
};

// ─── Opening the editor ───
te_openYaRepEditor = function(obj) {
  te_currentYaObj = obj;
  const ro = te_file.Report[obj];
  let val = ro.ya_rep;

  // Normalize to an object
  if (!val || val === 'none') {
    te_currentYaData = null;
  } else {
    try {
      te_currentYaData = (typeof val === 'object') ? JSON.parse(JSON.stringify(val)) : JSON.parse(val);
    } catch(e) { te_currentYaData = null; }
  }

  try { te_yre_tab('human'); } catch (e) {}
  try { te_yre_setAddMode(false); } catch (e) {}
  window.te_yre_expanded = null;
  window.te_yre_selTpl = null;
  window.te_yre_selArp = null;
  te_yre_renderList();
  te_yre_refreshPreview();
  te_yre_syncFlags();

  // Multi-id
  const hasMulti = te_currentYaData && te_currentYaData.multi_id;
  document.getElementById('te_yre_multi').checked = !!hasMulti;
  document.getElementById('te_yre_multi_fields').style.display = hasMulti ? 'block' : 'none';
  if (hasMulti) {
    document.getElementById('te_yre_mname').value = te_currentYaData.multi_id.name || '';
    document.getElementById('te_yre_mroom').value = te_currentYaData.multi_id.room || '';
    document.getElementById('te_yre_mtype').value = te_currentYaData.multi_id.type || 'devices.types.other';
  }

  document.getElementById('te_yaRepEditorWnd').style.display = 'flex';
};

// ─── Closing ───
te_closeYaRepEditor = function() {
  document.getElementById('te_yaRepEditorWnd').style.display = 'none';
  te_currentYaObj  = null;
  te_currentYaData = null;
};

// ─── Set none ───
te_setYaRepNone = function() {
  const obj = te_currentYaObj;
  if (!obj) return;
  te_file.Report[obj].ya_rep = 'none';
  te_yre_updateView(obj, null);
  te_syncLive(true);
  te_closeYaRepEditor();
};

// ─── Set auto: убрать ya_rep, Яндекс подберёт описание по role ───
te_setYaRepAuto = function() {
  const obj = te_currentYaObj;
  if (!obj || !te_file.Report[obj]) return;
  delete te_file.Report[obj].ya_rep;
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (el) el.innerHTML = '<span style="color:#5ac8fa">авто</span>';
  te_syncLive(true);
  te_closeYaRepEditor();
};

// ─── Clear (the ✖ button in the table): сброс в авто ───
te_clearYaRep = function(obj) {
  if (!obj || !te_file.Report[obj]) return;
  delete te_file.Report[obj].ya_rep;
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (el) el.innerHTML = '<span style="color:#5ac8fa">авто</span>';
  te_syncLive(true);
};

// ─── Apply ───
te_applyYaRepEditor = function() {
  const obj = te_currentYaObj;
  if (!obj) return;
  const d = te_currentYaData;
  if (!d) {
    // Ничего не выбрано — оставить как было (не ставить none молча).
    te_closeYaRepEditor();
    return;
  }
  te_file.Report[obj].ya_rep = d;
  te_yre_updateView(obj, d);
  te_syncLive(true);
  te_closeYaRepEditor();
};

// ─── Table row preview update ───
te_yre_updateView = function(obj, d) {
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (!el) return;
  if (!d) { el.innerHTML = '<span style="color:#bbb">none</span>'; return; }
  try {
    var parts = [];
    (d.capabilities || []).forEach(function (c) { parts.push('⚡ ' + te_yre_shortType(c.type)); });
    (d.properties || []).forEach(function (p) {
      parts.push('📊 ' + ((p.parameters && p.parameters.instance) || te_yre_shortType(p.type)));
    });
    el.textContent = parts.join(', ') || JSON.stringify(d).substring(0, 50);
  } catch(e) { el.textContent = '?'; }
};

// ─── Разворот модалки во весь рост (кнопка ⛶ в шапке) ───
te_yre_expand = function() {
  var w = document.getElementById('te_yaRepEditorWnd');
  if (!w) return;
  var box = w.querySelector('.ce-modal');
  if (!box) return;
  box.classList.toggle('yre-full');
};

