// yandexedit.js — редактор описания Яндекс (ya_rep) для Device editor.
// Вынесен из templateedit.js. Зависимости (рантайм, globals):
// te_file, te_currentYaObj / te_currentYaMode / te_yre_draft (чтение/запись),
// te_syncLive(), te_YA_JSON внутри. Окно редактирует всё устройство:
// слева список каналов + библиотека шаблонов, справа — выбранный канал.
// Правки копятся в te_yre_draft и пишутся в te_file только по «Применить».
// Подключается в desktop/index.html ПОСЛЕ templateedit.js.

// ===== YA REP EDITOR =====
te_YA_JSON = {"capability": [{"on_off": {"desc": "Включение/выключение", "tpl": {"type": "devices.capabilities.on_off", "retrievable": true, "reportable": true, "state": {"instance": "on", "value": false}}}}, {"color_setting": {"desc": "Цвет (температура K)", "tpl": {"type": "devices.capabilities.color_setting", "retrievable": true, "reportable": true, "parameters": {"temperature_k": {"max": 6500, "min": 1000}}, "state": {"instance": "temperature_k", "value": 4000}}}}, {"range": {"desc": "Диапазон — выбери instance ▼", "tpl": {"type": "devices.capabilities.range", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "brightness", "random_access": true, "range": {"max": 100, "min": 1, "precision": 1}, "unit": "unit.percent"}, {"instance": "volume", "random_access": true, "range": {"max": 100, "min": 0, "precision": 1}, "unit": "unit.percent"}, {"instance": "open", "random_access": true, "range": {"max": 100, "min": 0, "precision": 10}, "unit": "unit.percent"}, {"instance": "humidity", "random_access": true, "range": {"max": 100, "min": 10, "precision": 10}, "unit": "unit.percent"}, {"instance": "temperature", "random_access": true, "range": {"max": 40, "min": 18, "precision": 1}, "unit": "unit.temperature.celsius"}, {"instance": "channel", "random_access": true, "range": {"min": 0, "max": 999, "precision": 1}}], "state": {"instance": "brightness", "value": 50}}}}, {"toggle": {"desc": "Переключатель — выбери instance ▼", "tpl": {"type": "devices.capabilities.toggle", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "backlight"}, {"instance": "controls_locked"}, {"instance": "ionization"}, {"instance": "keep_warm"}, {"instance": "mute"}, {"instance": "oscillation"}, {"instance": "pause"}]}}}, {"mode": {"desc": "Режим работы — выбери instance ▼", "tpl": {"type": "devices.capabilities.mode", "retrievable": true, "reportable": true, "parameters": {}, "arparameter": [{"instance": "fan_speed", "modes": [{"value": "auto"}, {"value": "high"}, {"value": "medium"}, {"value": "low"}, {"value": "quiet"}, {"value": "turbo"}]}, {"instance": "thermostat", "modes": [{"value": "auto"}, {"value": "fan_only"}, {"value": "heat"}, {"value": "cool"}, {"value": "dry"}, {"value": "preheat"}]}, {"instance": "work_speed", "modes": [{"value": "auto"}, {"value": "fast"}, {"value": "max"}, {"value": "medium"}, {"value": "min"}, {"value": "slow"}, {"value": "turbo"}]}, {"instance": "swing", "modes": [{"value": "vertical"}, {"value": "horizontal"}, {"value": "stationary"}, {"value": "auto"}]}, {"instance": "program", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "input_source", "modes": [{"value": "one"}, {"value": "two"}, {"value": "three"}, {"value": "four"}, {"value": "five"}, {"value": "hdmi"}, {"value": "hdmi1"}, {"value": "hdmi2"}]}, {"instance": "cleanup_mode", "modes": [{"value": "auto"}, {"value": "eco"}, {"value": "express"}, {"value": "normal"}, {"value": "quiet"}]}, {"instance": "tea_mode", "modes": [{"value": "black_tea"}, {"value": "green_tea"}, {"value": "oolong_tea"}, {"value": "express"}]}]}}}], "float": [{"amperage": {"desc": "Ток (А)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "amperage", "unit": "unit.ampere"}, "state": {"instance": "amperage", "value": 0}}}}, {"battery_level": {"desc": "Заряд батареи (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "unit": "unit.percent"}, "state": {"instance": "battery_level", "value": 0}}}}, {"co2_level": {"desc": "CO₂ (ppm)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "co2_level", "unit": "unit.ppm"}, "state": {"instance": "co2_level", "value": 0}}}}, {"humidity": {"desc": "Влажность (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "humidity", "unit": "unit.percent"}, "state": {"instance": "humidity", "value": 0}}}}, {"illumination": {"desc": "Освещённость (лк)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "illumination", "unit": "unit.illumination.lux"}, "state": {"instance": "illumination", "value": 0}}}}, {"pm1_density": {"desc": "PM1 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm1_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm1_density", "value": 0}}}}, {"pm2_5_density": {"desc": "PM2.5 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm2.5_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm2.5_density", "value": 0}}}}, {"pm10_density": {"desc": "PM10 (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pm10_density", "unit": "unit.density.mcg_m3"}, "state": {"instance": "pm10_density", "value": 0}}}}, {"power": {"desc": "Мощность (Вт)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "power", "unit": "unit.watt"}, "state": {"instance": "power", "value": 0}}}}, {"pressure": {"desc": "Давление (мм рт.ст.)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "pressure", "unit": "unit.pressure.mmhg"}, "state": {"instance": "pressure", "value": 0}}}}, {"temperature": {"desc": "Температура (°C)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "temperature", "unit": "unit.temperature.celsius"}, "state": {"instance": "temperature", "value": 0}}}}, {"tvoc": {"desc": "TVOC органика (мкг/м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "tvoc", "unit": "unit.density.mcg_m3"}, "state": {"instance": "tvoc", "value": 0}}}}, {"voltage": {"desc": "Напряжение (В)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "voltage", "unit": "unit.volt"}, "state": {"instance": "voltage", "value": 0}}}}, {"water_level": {"desc": "Уровень воды (%)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "unit": "unit.percent"}, "state": {"instance": "water_level", "value": 0}}}}, {"electricity_meter": {"desc": "Счётчик эл.энергии (кВт·ч)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "electricity_meter", "unit": "unit.kilowatt_hour"}, "state": {"instance": "electricity_meter", "value": 0}}}}, {"water_meter": {"desc": "Счётчик воды (м³)", "tpl": {"type": "devices.properties.float", "retrievable": true, "reportable": true, "parameters": {"instance": "water_meter", "unit": "unit.cubic_meter"}, "state": {"instance": "water_meter", "value": 0}}}}], "event": [{"vibration": {"desc": "Вибрация / наклон / падение", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "vibration", "events": [{"value": "tilt"}, {"value": "fall"}, {"value": "vibration"}]}, "state": {"instance": "vibration", "value": "vibration"}}}}, {"open": {"desc": "Открытие / закрытие", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "open", "events": [{"value": "opened"}, {"value": "closed"}]}, "state": {"instance": "open", "value": "opened"}}}}, {"button": {"desc": "Кнопка (клик / двойной / удержание)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "button", "events": [{"value": "click"}, {"value": "double_click"}, {"value": "long_press"}]}, "state": {"instance": "button", "value": "click"}}}}, {"motion": {"desc": "Движение / покой", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "motion", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "motion", "value": "not_detected"}}}}, {"smoke": {"desc": "Дым", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "smoke", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "smoke", "value": "not_detected"}}}}, {"gas": {"desc": "Газ", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "gas", "events": [{"value": "detected"}, {"value": "not_detected"}]}, "state": {"instance": "gas", "value": "not_detected"}}}}, {"water_leak": {"desc": "Протечка", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_leak", "events": [{"value": "dry"}, {"value": "leak"}]}, "state": {"instance": "water_leak", "value": "dry"}}}}, {"battery_level": {"desc": "Заряд батареи (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "battery_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "battery_level", "value": "normal"}}}}, {"water_level": {"desc": "Уровень воды (событие low/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "water_level", "events": [{"value": "low"}, {"value": "normal"}]}, "state": {"instance": "water_level", "value": "normal"}}}}, {"food_level": {"desc": "Уровень корма (empty/normal)", "tpl": {"type": "devices.properties.event", "retrievable": true, "reportable": true, "parameters": {"instance": "food_level", "events": [{"value": "empty"}, {"value": "normal"}]}, "state": {"instance": "food_level", "value": "normal"}}}}]};

te_currentYaObj = null;
te_currentYaData = null; // editor working object (mode === 'obj')
te_currentYaMode = 'auto'; // 'obj' | 'none' | 'auto' — режим активного канала
te_yre_draft = null;       // черновики по всем каналам: key -> {mode, data}
te_yre_leftView = 'chan';  // левая панель: 'chan' (каналы) | 'lib' (библиотека)

te_yre_getObj = function() {
  return te_currentYaData;
};

// HTML-escape для подписей в списках
te_yre_esc = function(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// Эффективное ya_rep канала из ФАЙЛА (без черновика)
te_yre_fileEff = function(key) {
  var ro = (window.te_file && te_file.Report && te_file.Report[key]) || {};
  var n = te_yre_parseYaRep(ro.ya_rep);
  if (n.kind === 'none') return { mode: 'none', data: null };
  if (n.kind === 'obj') return { mode: 'obj', data: n.data };
  if (n.kind === 'bad') return { mode: 'auto', data: null, bad: true };
  return { mode: 'auto', data: null };
};

// Эффективное ya_rep канала: черновик, иначе файл
te_yre_eff = function(key) {
  if (te_yre_draft && Object.prototype.hasOwnProperty.call(te_yre_draft, key)) return te_yre_draft[key];
  return te_yre_fileEff(key);
};

// Есть ли несохранённые правки в канале
te_yre_isDirty = function(key) {
  if (!te_yre_draft || !Object.prototype.hasOwnProperty.call(te_yre_draft, key)) return false;
  var cur = te_yre_draft[key], saved = te_yre_fileEff(key);
  if (cur.mode !== saved.mode) return true;
  if (cur.mode === 'obj') {
    try { return JSON.stringify(cur.data) !== JSON.stringify(saved.data); } catch (e) { return true; }
  }
  return false;
};

// Что канал значит для Яндекса — словами, без имён типов.
// «float» или «range:temperature» человеку ничего не говорят — нужны иконка и название.
te_yre_effectLabel = function(d) {
  try {
    if (!d) return '—';
    if (d.multi_id) return '🔀 Отдельное устройство: ' + (d.multi_id.name || 'без имени');
    var caps = d.capabilities || [], props = d.properties || [];
    var total = caps.length + props.length;
    if (!total) return '<span style="color:var(--faint)">пусто</span>';
    var first = caps.length ? { o: caps[0], isCap: true } : { o: props[0], isCap: false };
    var c = te_yre_card(first.o, first.isCap);
    return c.icon + ' <b>' + c.title + '</b>' + (total > 1 ? ' <span style="color:var(--faint)">+' + (total - 1) + '</span>' : '');
  } catch (e) { return '—'; }
};

te_yre_setObj = function(obj) {
  te_currentYaData = JSON.parse(JSON.stringify(obj)); // deep copy
  te_currentYaMode = 'obj';
  te_yre_refreshPreview();
};

// ─── JSON preview ───
// Центральная точка обновления: синхронизирует текущий канал в черновик,
// перерисовывает превью/устройство/список каналов.
te_yre_refreshPreview = function() {
  if (te_currentYaObj && window.te_file && te_file.Report && te_file.Report[te_currentYaObj]) {
    if (!te_yre_draft) te_yre_draft = {};
    te_yre_draft[te_currentYaObj] = { mode: te_currentYaMode, data: te_currentYaData };
  }
  const pre = document.getElementById('te_yre_preview');
  if (pre) {
    const d = te_currentYaData;
    if (!d) { pre.textContent = '—'; } else { pre.textContent = JSON.stringify(d, null, 2); }
  }
  try { te_yre_refreshDevice(); } catch (e) { console.log('yre device', e); }
  try { te_yre_renderChans(); } catch (e) { console.log('yre chans', e); }
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
    var icon = te_yre_card(o, isCap).icon; // тот же набор иконок, что и в карточках
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
// Склеивает ya_rep всех каналов te_file.Report; значения берутся из черновиков
// (te_yre_eff), так что сводка и валидация сразу видят несохранённые правки.
// Повторяет логику бэкенда: buildDeviceList + zesp2ya (internal/yandex/hubws.go) —
// multi_id уходит отдельными устройствами, 'none' скрывает канал, пусто = автоподбор по role.
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
    var eff = te_yre_eff(k);
    var kind = (eff.mode === 'obj') ? 'obj' : (eff.mode === 'none' ? 'none' : 'empty');
    var ch = { key: k, label: ro.label || '', parsed: ro.parsed, kind: kind, caps: [], props: [], multi: null };
    if (eff.mode === 'obj' && eff.data) {
      if (eff.data.multi_id) {
        ch.multi = eff.data.multi_id;
        dev.multis.push({ key: k, multi: eff.data.multi_id, caps: eff.data.capabilities || [], props: eff.data.properties || [] });
      } else {
        (eff.data.capabilities || []).forEach(function (c) { ch.caps.push(c); dev.caps.push({ key: k, cap: c }); });
        (eff.data.properties || []).forEach(function (p) { ch.props.push(p); dev.props.push({ key: k, prop: p }); });
      }
    } else if (eff.mode === 'none') { noneCount++; }
    else { autoCount++; }
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
    return t.join(', ') || 'пусто';
  }
  return '—';
};

// ─── Превью карточек в стиле приложения Яндекс ───
// Яндекс рисует capabilities и properties разными группами: «Управление» и
// «Датчики». Словари РАЗНЫЕ и намеренно не объединены: один и тот же instance
// в capabilities и в properties — разные сущности (temperature в capabilities
// — уставка, в properties — показание), сливать их в одну карту нельзя.
te_YA_CARD_CAP = {  // управление — то, чем устройство УПРАВЛЯЮТ (только цветные эмодзи)
  on:               ['💡', 'Вкл/выкл'],
  brightness:       ['☀️', 'Яркость'],
  volume:           ['🔊', 'Громкость'],
  open:             ['🎚', 'Положение'],
  temperature:      ['🌡', 'Уставка температуры'],
  channel:          ['📺', 'Канал'],
  thermostat:       ['🔀', 'Режим работы'],
  fan_speed:        ['🌀', 'Скорость вентилятора'],
  work_speed:       ['🌀', 'Рабочая скорость'],
  hsv:              ['🎨', 'Цвет'],
  temperature_k:    ['🎨', 'Цветовая температура'],
  backlight:        ['🌟', 'Подсветка'],
  mute:             ['🔇', 'Без звука'],
  pause:            ['⏸️', 'Пауза'],
  controls_locked:  ['🔒', 'Блокировка'],
  ionization:       ['⚡', 'Ионизация'],
  keep_warm:        ['♨️', 'Подогрев'],
  oscillation:      ['🔄', 'Колебания']
};

te_YA_CARD_PROP = { // показания — то, что устройство ПОКАЗЫВАЕТ (только цветные эмодзи)
  temperature:      ['🌡', 'Температура'],
  humidity:         ['💧', 'Влажность'],
  battery:          ['🔋', 'Заряд'],
  battery_charging: ['🔋', 'Заряд'],
  illumination:     ['🔆', 'Освещённость'],
  illuminance:      ['🔆', 'Освещённость'],
  light_level:      ['🔆', 'Освещённость'],
  pressure:         ['⚖️', 'Давление'],
  co2:              ['🌫', 'CO₂'],
  'ppM2.5_density': ['🏭', 'PM2.5'],
  pm25:             ['🏭', 'PM2.5'],
  pm10:             ['🌪', 'PM10'],
  tvoc:             ['🌿', 'ЛОВС'],
  voc:              ['🍃', 'VOC'],
  noise:            ['📣', 'Шум'],
  voltage:          ['⚡', 'Напряжение'],
  current:          ['🔌', 'Ток'],
  amperage:         ['🔌', 'Ток'],
  power:            ['💡', 'Мощность'],
  energy:           ['📈', 'Энергия'],
  wind_speed:       ['🌬', 'Скорость ветра'],
  soil_moisture:    ['🌱', 'Влажность почвы'],
  signal_level:     ['📶', 'Уровень сигнала'],
  water_leak:       ['💦', 'Протечка'],
  motion:           ['🚶', 'Движение'],
  door:             ['🚪', 'Дверь'],
  smoke:            ['🔥', 'Дым'],
  gas:              ['☁',  'Газ'],
  vibration:        ['📳', 'Вибрация'],
  button:           ['🔘', 'Кнопка'],
  online:           ['🟢', 'Связь']
};

// Иконка + название по instance из СВОЕГО словаря (управление/показание)
te_yre_card = function(o, isCap) {
  var p = o.parameters || {}, st = o.state || {};
  var inst = p.instance || st.instance || '';
  var dict = isCap ? te_YA_CARD_CAP : te_YA_CARD_PROP;
  var hit = dict[String(inst)];
  if (hit) return { icon: hit[0], title: hit[1] };
  var short = te_yre_shortType(o.type);
  if (isCap) return { icon: '🎛', title: short };
  return { icon: '📈', title: short === 'float' ? 'Показание' : short };
};

// Единица: из шаблона Яндекса, иначе class.unit_of_measurement канала
te_yre_unit = function(o, key) {
  var map = { 'percent': '%', 'temperature.celsius': '°C', 'temperature.fahrenheit': '°F' };
  var u = (o.parameters && o.parameters.unit) || '';
  if (u) {
    u = String(u).replace(/^unit\./, '');
    return map[u] || u;
  }
  try {
    var cls = te_yre_chanClass(key);
    if (cls && cls.unit_of_measurement) return String(cls.unit_of_measurement);
  } catch (e) {}
  return '';
};

// Текущее значение канала (parsed, иначе val) — как его увидит Яндекс
te_yre_valStr = function(key) {
  try {
    var ro = te_file.Report[key] || {};
    var v = (ro.parsed !== undefined && ro.parsed !== null && ro.parsed !== '') ? ro.parsed : ro.val;
    if (v === undefined || v === null || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'да' : 'нет';
    if (typeof v === 'object') return '—';
    var n = parseFloat(String(v).replace(',', '.'));
    if (isFinite(n)) {
      var r = Math.round(n * 100) / 100;
      return (r === 0 || r % 1 === 0) ? String(r) : String(r);
    }
    return String(v).substring(0, 24);
  } catch (e) { return '—'; }
};

// Режим работы для capability `mode`: в Яндекс уходит ИМЯ режима, а не ZCL-код.
// Порядок как в zesp2ya: пары "имя:HEX" из class.modes → канон ZCL SystemMode →
// кламп к parameters.modes (иначе Яндекс роняет весь discovery).
te_YA_MODE_RU = { off: 'Выключен', auto: 'Авто', heat: 'Отопление', cool: 'Охлаждение', dry: 'Сушка', fan_only: 'Вентиляция' };
te_YA_SYSMODE = { 0: 'off', 1: 'auto', 2: 'auto', 3: 'cool', 4: 'heat', 5: 'heat', 6: 'cool', 7: 'fan_only', 8: 'dry', 9: 'auto' };

te_yre_rawVal = function(key) {
  try {
    var ro = te_file.Report[key] || {};
    var v = (ro.parsed !== undefined && ro.parsed !== null && ro.parsed !== '') ? ro.parsed : ro.val;
    return v === undefined ? null : v;
  } catch (e) { return null; }
};

// Пары "имя:HEX" из class.modes канала → [[имя, код]]
te_yre_devModePairs = function(key) {
  var out = [];
  try {
    var ro = te_file.Report[key] || {};
    var m = null;
    if (ro.class && typeof ro.class === 'object') m = ro.class.modes;
    if (m == null) {
      var role = String(ro.role || ''), ai = role.indexOf('&');
      if (ai !== -1) { try { m = JSON.parse(role.slice(ai + 1)).modes; } catch (e) {} }
    }
    if (m == null) return out;
    var list = Array.isArray(m) ? m : String(m).split(',');
    list.forEach(function (s) {
      s = String(s == null ? '' : s).trim();
      if (!s) return;
      var ci = s.lastIndexOf(':');
      if (ci > 0 && ci < s.length - 1) {
        var nm = s.slice(0, ci).trim(), code = s.slice(ci + 1).trim();
        var n = parseInt(code, 16);
        if (isFinite(n) && nm) out.push([nm, n]);
      } else {
        out.push([s, null]);
      }
    });
  } catch (e) {}
  return out;
};

te_yre_modeVal = function(o, key) {
  var allowed = ((o.parameters && o.parameters.modes) || []).map(function (m) {
    return String((m && m.value != null) ? m.value : m);
  });
  var raw = te_yre_rawVal(key);
  var name = null;
  var pairs = te_yre_devModePairs(key);
  var n = parseFloat(String(raw).replace(',', '.'));
  // 1) код из пар class.modes выигрывает у канона
  if (isFinite(n) && pairs.length) {
    for (var i = 0; i < pairs.length; i++) {
      if (pairs[i][1] !== null && pairs[i][1] === n) { name = pairs[i][0]; break; }
    }
  }
  // 2) значение уже строкой (устройство шлёт имя режима)
  if (name === null && typeof raw === 'string' && raw.trim() && isNaN(n)) name = raw.trim();
  // 3) канон ZCL SystemMode
  if (name === null && isFinite(n) && te_YA_SYSMODE[n] !== undefined) name = te_YA_SYSMODE[n];
  if (name === null) return '—';
  // 4) кламп к объявленному modes — иначе Яндекс отвергнет устройство
  if (allowed.length && allowed.indexOf(name) === -1) name = allowed[0];
  return te_YA_MODE_RU[name] || name;
};

// Значение + единица для карточки — с учётом типа умения
te_yre_cardVal = function(o, isCap, key) {
  var t = te_yre_shortType(o.type);
  if (isCap && t === 'mode') return { v: te_yre_modeVal(o, key), u: '' };
  if (isCap && (t === 'on_off' || t === 'toggle')) {
    var raw = te_yre_rawVal(key);
    var s = String(raw == null ? '' : raw).trim().toLowerCase();
    var on = (raw === true || s === 'on' || s === '1' || s === 'true' || s === 'вкл');
    return { v: on ? 'вкл' : 'выкл', u: '' };
  }
  return { v: te_yre_valStr(key), u: te_yre_unit(o, key) };
};

// Строка «значение — название» без плиток и без ключа канала:
// ключ и так есть в списке каналов слева, в плитке он только ломал вёрстку.
te_yre_cardRow = function(key, o, isCap) {
  var c = te_yre_card(o, isCap);
  var cv = te_yre_cardVal(o, isCap, key);
  var hi = key === te_currentYaObj;
  return '<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;border-radius:4px;' +
    (hi ? 'background:var(--bg3);' : '') + '">' +
    '<span style="font-size:14px;line-height:1;width:16px;text-align:center">' + c.icon + '</span>' +
    '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' +
    (hi ? 'font-weight:600;' : '') + '">' + te_yre_esc(c.title) + '</span>' +
    '<b style="white-space:nowrap">' + te_yre_esc(cv.v) + (cv.u ? ' ' + te_yre_esc(cv.u) : '') + '</b>' +
    '</div>';
};

// ─── Перерисовка панели «Как увидит Яндекс» ───
te_yre_refreshDevice = function() {
  var dev = te_yre_collectDevice();
  // --- строка статуса: что канал значит для Яндекса + кнопка выбора нового ---
  var stBox = document.getElementById('te_yre_status');
  if (stBox) {
    var eff = te_currentYaObj ? te_yre_eff(te_currentYaObj) : { mode: 'auto', data: null };
    var dirty = te_currentYaObj ? te_yre_isDirty(te_currentYaObj) : false;
    var label;
    if (!te_currentYaObj) label = '<span style="color:var(--faint)">выбери канал слева</span>';
    else if (eff.mode === 'none') label = '🚫 Скрыт от Яндекса';
    else if (eff.mode === 'auto') label = '🤖 Авто по role';
    else label = te_yre_effectLabel(eff.data);
    stBox.innerHTML = '<b>Канал ' + te_yre_esc(te_currentYaObj || '—') + '</b> · ' + label +
      (dirty ? ' <span style="color:var(--yellow)">● не применено</span>' : '') +
      ' <button class="obj-mnu-btn" style="padding:1px 8px;margin-left:6px" ' +
      'onclick="te_yre_lview(\'lib\')" title="Открыть библиотеку и выбрать другое описание канала">Изменить</button>';
  }
  // --- расшифровка текущего канала ---
  var human = document.getElementById('te_yre_human');
  if (human && te_currentYaData) {
    var h = '';
    var del = function (ix, fn) {
      return '<span onclick="' + fn + '(' + ix + ')" title="Убрать из канала"' +
        ' style="position:absolute;right:4px;top:2px;cursor:pointer;color:var(--red);font-weight:bold">✖</span>';
    };
    (te_currentYaData.capabilities || []).forEach(function (c, cix) {
      h += '<div style="position:relative;padding-right:16px">' + te_yre_humanOne(c, true) + del(cix, 'te_yre_delCap') + '</div>';
    });
    (te_currentYaData.properties || []).forEach(function (p, pix) {
      h += '<div style="position:relative;padding-right:16px">' + te_yre_humanOne(p, false) + del(pix, 'te_yre_delProp') + '</div>';
    });
    if (te_currentYaData.multi_id) {
      var m = te_currentYaData.multi_id;
      h += '<div style="margin:4px 0;padding:4px 6px;background:var(--bg3);border-radius:4px">🔀 Отдельное устройство: <b>' +
        (m.name || 'без имени') + '</b> · ' + (m.room || 'без комнаты') + ' · ' + (m.type || '?') + '</div>';
    }
    human.innerHTML = h || '<span style="color:var(--faint)">—</span>';
  } else if (human) {
    if (te_currentYaMode === 'none') {
      human.innerHTML = '<span style="color:var(--faint)">Канал скрыт от Яндекса (none). Назначь шаблон в «Библиотеке», чтобы снова показать его Алисе.</span>';
    } else {
      human.innerHTML = '<span style="color:var(--faint)">Авто по role — Яндекс подберёт описание сам. Можно переопределить шаблоном из «Библиотеки».</span>';
    }
  }
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
  // --- устройство целиком: превью как в приложении Яндекс ---
  var box = document.getElementById('te_yre_device');
  if (!box) return;
  var s = '<div style="margin-bottom:2px"><b>' + te_yre_esc(dev.name || 'Без имени') + '</b>' +
    (dev.room ? ' · ' + te_yre_esc(dev.room) : ' · <span style="color:var(--faint)">без комнаты</span>') + '</div>';
  s += '<div style="color:var(--faint);font-size:10px;margin-bottom:8px;word-break:break-all;">' +
    te_yre_esc(dev.type || 'type не задан') + ' · ' + te_yre_esc(dev.id || '?') + '</div>';

  // Группа «Управление» — то, чем устройство управляют
  if (dev.caps.length) {
    s += '<div style="font-weight:700;font-size:11px;margin:8px 0 2px;">Управление · ' + dev.caps.length + '</div>';
    dev.caps.forEach(function (e) { s += te_yre_cardRow(e.key, e.cap, true); });
  }

  // Группа «Датчики» — то, что устройство показывает
  if (dev.props.length) {
    s += '<div style="font-weight:700;font-size:11px;margin:8px 0 2px;">Датчики · ' + dev.props.length + '</div>';
    dev.props.forEach(function (e) { s += te_yre_cardRow(e.key, e.prop, false); });
  }

  if (!dev.caps.length && !dev.props.length) {
    s += '<div style="color:var(--faint);margin-top:4px">Управления и показаний нет — Яндекс отвергнет устройство.</div>';
  } else if (!dev.caps.length) {
    s += '<div style="color:var(--faint);font-size:10px;margin-top:6px;">Управления нет — устройство только показывает.</div>';
  }

  if (dev.autoCount || dev.noneCount) {
    s += '<div style="color:var(--faint);font-size:10px;margin-top:6px;">Ещё: авто по role ' + dev.autoCount +
      ' · скрыто ' + dev.noneCount + '</div>';
  }
  if (dev.empty) s += '<div style="color:var(--red);margin-top:6px">Ни одного умения или свойства — Яндекс отвергнет устройство целиком.</div>';
  if (dev.multis.length) {
    s += '<div class="ce-divider"></div><div style="margin-bottom:3px;font-weight:700;font-size:11px;">Отдельные устройства (multi): ' + dev.multis.length + '</div>';
    dev.multis.forEach(function (m) {
      s += '<div style="font-size:10px;padding:3px 6px;margin-bottom:3px;background:var(--bg3);border-radius:4px">' +
        te_yre_esc(m.multi.name || '?') + ' · ' + te_yre_esc(m.multi.room || '?') + ' · ' + te_yre_esc(m.multi.type || '?') +
        '<br><span style="color:var(--faint)">id: ' + te_yre_esc(dev.id) + '^' + te_yre_esc(m.key) + '</span></div>';
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
  if (!te_currentYaData) {
    te_currentYaData = JSON.parse(JSON.stringify(obj));
    te_currentYaMode = 'obj';
    te_yre_refreshPreview();
    try { te_yre_syncFlags(); } catch (e) {}
    return;
  }
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
  const container = document.getElementById('te_yre_tpllist') || document.getElementById('te_yre_list');
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
  // шаблон выбран — возвращаемся к списку каналов, чтобы был виден результат
  if (te_yre_leftView === 'lib') te_yre_lview('chan');
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
  // вариант выбран — возвращаемся к списку каналов, чтобы был виден результат
  if (te_yre_leftView === 'lib') te_yre_lview('chan');
};

// ─── retrievable/reportable flag sync with the current object ───
te_yre_syncFlags = function() {
  const d = te_currentYaData;
  let retr = false, repo = false;
  if (d) {
    try {
      const arr = d.capabilities || d.properties || [];
      retr = arr[0].retrievable === true;
      repo = arr[0].reportable  === true;
    } catch(e) {}
  }
  var r = document.getElementById('te_yre_retrievable'); if (r) r.checked = retr;
  var p = document.getElementById('te_yre_reportable');  if (p) p.checked = repo;
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
  const d = te_currentYaData;
  if (!d) {
    document.getElementById('te_yre_multi').checked = false;
    fld.style.display = 'none';
    return;
  }
  fld.style.display = on ? 'block' : 'none';
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

// ─── Левая панель: список каналов устройства + библиотека шаблонов ───
// Перестраиваем существующую колонку модалки (#te_yre_list живёт в разметке
// TE_BODY внутри div шириной 200px) в двухрежимную панель.
te_yre_buildLeftPanel = function() {
  var panel = document.getElementById('te_yre_left');
  if (!panel) {
    var anchor = document.getElementById('te_yre_list');
    if (!anchor) return;
    panel = anchor.parentNode;
    panel.id = 'te_yre_left';
  }
  panel.style.width = '240px';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.minHeight = '0';
  panel.innerHTML = te_yre_leftHtml();
  te_yre_lview(te_yre_leftView || 'chan');
};

te_yre_leftHtml = function() {
  return '' +
    '<div style="padding:4px 6px;border-bottom:1px solid var(--border);display:flex;gap:4px;align-items:center;flex-shrink:0;">' +
      '<button id="te_yre_libBack" class="obj-mnu-btn" style="padding:1px 8px" onclick="te_yre_lview(\'chan\')" title="Вернуться к списку каналов">← Каналы</button>' +
      '<span id="te_yre_lhint" style="font-size:10px;color:var(--faint)"></span>' +
    '</div>' +
    '<div id="te_yre_chanlist" style="flex:1;overflow-y:auto;padding:2px 0;font-size:12px;"></div>' +
    '<div id="te_yre_libbox" style="display:none;flex:1;min-height:0;flex-direction:column;">' +
      '<div style="padding:4px 6px;border-bottom:1px solid var(--border);display:flex;gap:4px;align-items:center;flex-shrink:0;">' +
        '<button id="te_yre_btn_replace" class="obj-mnu-btn" style="padding:1px 6px;background:var(--accent);color:#fff;border-color:var(--accent)" onclick="te_yre_setAddMode(false)" title="Клик по шаблону заменит умения канала целиком">Заменить</button>' +
        '<button id="te_yre_btn_add" class="obj-mnu-btn" style="padding:1px 6px" onclick="te_yre_setAddMode(true)" title="Клик по шаблону добавит умение к текущим (напр. mode + on_off от SystemMode)">+ Добавить</button>' +
      '</div>' +
      '<div id="te_yre_tpllist" style="flex:1;overflow-y:auto;padding:4px 0;font-size:12px;"></div>' +
    '</div>';
};

te_yre_lview = function(v) {
  te_yre_leftView = v;
  var chan = document.getElementById('te_yre_chanlist');
  var lib  = document.getElementById('te_yre_libbox');
  var back = document.getElementById('te_yre_libBack');
  var hint = document.getElementById('te_yre_lhint');
  var isLib = (v === 'lib');
  if (chan) chan.style.display = isLib ? 'none' : 'block';
  if (lib)  lib.style.display  = isLib ? 'flex' : 'none';
  if (back) back.style.display = isLib ? 'inline-block' : 'none';
  if (hint) hint.innerHTML = isLib
    ? 'Выбери шаблон для канала <b>' + te_yre_esc(te_currentYaObj || '') + '</b>'
    : 'Каналы устройства';
  if (isLib) { try { te_yre_renderList(); } catch (e) {} }
};

// Список каналов устройства со статусами (авто / скрыт / типы / multi / ● изменено)
te_yre_renderChans = function() {
  var box = document.getElementById('te_yre_chanlist');
  if (!box) return;
  if (!window.te_file || !te_file.Report) { box.innerHTML = ''; return; }
  var rep = te_file.Report;
  var h = '';
  Object.keys(rep).forEach(function (k) {
    var ro = rep[k] || {};
    var eff = te_yre_eff(k);
    var mark = '?', desc = '';
    if (eff.mode === 'none') { mark = '🚫'; desc = 'скрыт от Яндекса'; }
    else if (eff.mode === 'auto') { mark = '🤖'; desc = eff.bad ? 'битый JSON → авто' : 'авто по role'; }
    else {
      var d = eff.data || {};
      if (d.multi_id) { mark = '🔀'; desc = 'отдельное: ' + (d.multi_id.name || 'multi'); }
      else {
        var names = [];
        (d.capabilities || []).forEach(function (c) {
          var i = (c.parameters && c.parameters.instance) || (c.state && c.state.instance) || '';
          names.push(te_yre_shortType(c.type) + (i ? ':' + i : ''));
        });
        (d.properties || []).forEach(function (p) {
          var i = (p.parameters && p.parameters.instance) || '';
          names.push(te_yre_shortType(p.type) + (i ? ':' + i : ''));
        });
        var firstObj = null, firstIsCap = false;
        if (d.capabilities && d.capabilities.length) { firstObj = d.capabilities[0]; firstIsCap = true; }
        else if (d.properties && d.properties.length) { firstObj = d.properties[0]; firstIsCap = false; }
        // та же иконка, что и в карточке — один стиль на весь редактор
        mark = firstObj ? te_yre_card(firstObj, firstIsCap).icon : '📈';
        desc = names.join(', ') || 'пусто';
      }
    }
    var dirty = te_yre_isDirty(k) ? ' <span style="color:var(--yellow)" title="не применено">●</span>' : '';
    var active = (k === te_currentYaObj) ? ' yre-active' : '';
    h += '<div class="yre-item' + active + '" style="padding:4px 8px;line-height:1.3;white-space:normal"' +
      ' title="' + te_yre_esc(ro.label || k) + '" onclick="te_yre_loadChan(\'' + k + '\')">' +
      mark + ' <span style="font-family:monospace;font-size:11px">' + te_yre_esc(k) + '</span>' + dirty +
      '<div style="font-size:10px;opacity:0.75">' + (ro.label ? te_yre_esc(ro.label) + ' — ' : '') + te_yre_esc(desc) + '</div>' +
      '</div>';
  });
  box.innerHTML = h || '<div style="padding:6px 8px;color:var(--faint)">В устройстве нет объектов</div>';
};

// Загрузка канала в редактор (без потери несохранённых правок других каналов)
te_yre_loadChan = function(key) {
  if (!key || !window.te_file || !te_file.Report || !te_file.Report[key]) return;
  te_currentYaObj = key;
  var eff = te_yre_eff(key);
  te_currentYaMode = eff.mode;
  te_currentYaData = (eff.mode === 'obj' && eff.data) ? JSON.parse(JSON.stringify(eff.data)) : null;
  window.te_yre_expanded = null;
  window.te_yre_selTpl = null;
  window.te_yre_selArp = null;
  try { te_yre_renderList(); } catch (e) {}
  try { te_yre_syncFlags(); } catch (e) {}
  // Multi-device шапка
  var hasMulti = te_currentYaData && te_currentYaData.multi_id;
  var mc = document.getElementById('te_yre_multi');
  if (mc) mc.checked = !!hasMulti;
  var mf = document.getElementById('te_yre_multi_fields');
  if (mf) mf.style.display = hasMulti ? 'block' : 'none';
  if (hasMulti) {
    document.getElementById('te_yre_mname').value = te_currentYaData.multi_id.name || '';
    document.getElementById('te_yre_mroom').value = te_currentYaData.multi_id.room || '';
    document.getElementById('te_yre_mtype').value = te_currentYaData.multi_id.type || 'devices.types.other';
  }
  te_yre_refreshPreview();
};

// ─── Opening the editor (сразу во весь рост) ───
te_openYaRepEditor = function(obj) {
  te_yre_draft = {};
  te_yre_buildLeftPanel();
  try { te_yre_tab('human'); } catch (e) {}
  try { te_yre_setAddMode(false); } catch (e) {}
  var wnd = document.getElementById('te_yaRepEditorWnd');
  wnd.style.display = 'flex';
  var keys = Object.keys((window.te_file && te_file.Report) || {});
  var first = (obj && te_file.Report && te_file.Report[obj]) ? obj : keys[0];
  if (first) te_yre_loadChan(first);
  else { te_currentYaObj = null; te_currentYaMode = 'auto'; te_currentYaData = null; te_yre_refreshPreview(); }
};

// Есть ли неприменённые правки в каком-либо канале
te_yre_hasDirty = function() {
  var d = te_yre_draft || {};
  return Object.keys(d).some(function (k) {
    try { return te_yre_isDirty(k); } catch (e) { return false; }
  });
};

// ─── Closing (крестик / Отмена: черновики отбрасываются) ───
// force=true — после «Применить», без вопроса.
te_closeYaRepEditor = function(force) {
  if (!force && te_yre_hasDirty()) {
    if (!confirm('Есть неприменённые правки каналов.\nЗакрыть без применения?')) return;
  }
  document.getElementById('te_yaRepEditorWnd').style.display = 'none';
  te_currentYaObj  = null;
  te_currentYaData = null;
  te_currentYaMode = 'auto';
  te_yre_draft = null;
};

// ─── Режим канала: скрыть (none) ───
te_setYaRepNone = function() {
  if (!te_currentYaObj) return;
  te_currentYaMode = 'none';
  te_currentYaData = null;
  te_yre_refreshPreview();
  try { te_yre_syncFlags(); } catch (e) {}
};

// ─── Режим канала: авто по role (убрать ya_rep) ───
te_setYaRepAuto = function() {
  if (!te_currentYaObj || !te_file.Report[te_currentYaObj]) return;
  te_currentYaMode = 'auto';
  te_currentYaData = null;
  te_yre_refreshPreview();
  try { te_yre_syncFlags(); } catch (e) {}
};

// ─── Clear (the ✖ button in the table): сброс в авто ───
te_clearYaRep = function(obj) {
  if (!obj || !te_file.Report[obj]) return;
  delete te_file.Report[obj].ya_rep;
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (el) el.innerHTML = '<span style="color:#5ac8fa">авто</span>';
  te_syncLive(true);
};

// ─── Apply: записать черновики ВСЕХ изменённых каналов в устройство ───
te_applyYaRepEditor = function() {
  var d = te_yre_draft || {};
  Object.keys(d).forEach(function (k) {
    if (!window.te_file || !te_file.Report || !te_file.Report[k]) return;
    if (typeof te_yre_isDirty === 'function' && !te_yre_isDirty(k)) return;
    var e = d[k];
    if (e.mode === 'none') te_file.Report[k].ya_rep = 'none';
    else if (e.mode === 'obj' && e.data) te_file.Report[k].ya_rep = e.data;
    else delete te_file.Report[k].ya_rep;
    te_yre_updateView(k, e.mode === 'obj' ? e.data : null, e.mode);
  });
  try { te_syncLive(true); } catch (e) {}
  te_closeYaRepEditor(true);
};

// ─── Table row preview update ───
te_yre_updateView = function(obj, d, mode) {
  const el = document.getElementById(obj + '_te_ya_rep_view');
  if (!el) return;
  if (mode === 'none') { el.innerHTML = '<span style="color:#bbb">none</span>'; return; }
  if (mode === 'auto' || (!d && mode !== 'obj')) { el.innerHTML = '<span style="color:#5ac8fa">авто</span>'; return; }
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

