// devicemanager.js — виджет «Менеджер устройств» (порт static/apps/deviceManager.app на WinEngine).
// Зависит: socket.js (deviceList/eventE/WSsend), widgets.js (getIconSvg/getDeviceClass/widgetEvnt),
// zesp-globals.js (groups). M2PC-окна wJoin/wGroup/wBind/wAbout → модальные панели внутри окна.

(function () {
  var CSS = `
.dm{display:flex;flex-direction:column;height:100%;min-height:0;position:relative;overflow:hidden;background:var(--bg);color:var(--text)}
.dm *{box-sizing:border-box}
.dm-toolbar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:6px 8px;border-bottom:1px solid var(--border);background:var(--bg3);flex-shrink:0}
.dm-search-wrap{position:relative;flex:1;min-width:110px;display:flex}
.dm-search{flex:1;min-width:0;background:var(--bg);border:1px solid var(--border2);border-radius:6px;color:var(--text);padding:6px 26px 6px 10px;font-size:13px;outline:none}
.dm-search-clear{position:absolute;right:8px;top:50%;transform:translateY(-50%);cursor:pointer;color:var(--faint);font-size:14px;line-height:1;display:none;user-select:none}
.dm-search-clear:hover{color:var(--red)}
.dm-btn{background:var(--bg3);color:var(--text);border:1px solid var(--border2);border-radius:6px;padding:5px 9px;font-size:12px;cursor:pointer}
.dm-btn:hover{border-color:var(--accent);background:var(--hover)}
.dm-table-wrap{flex:1;min-height:0;overflow:auto;position:relative}
.dm-statusbar{flex-shrink:0;display:flex;align-items:center;gap:12px;padding:5px 10px;border-top:1px solid var(--border);background:var(--bg3);font-size:11px;color:var(--faint)}
.dm-table{width:100%;border-collapse:collapse;font-size:13px}
.dm-table thead{position:sticky;top:0;z-index:5;background:var(--bg3)}
.dm-table th{padding:6px 8px;text-align:left;font-weight:600;color:var(--faint);font-size:11px;text-transform:uppercase;letter-spacing:.3px;border-bottom:1px solid var(--border);border-right:1px solid var(--border)}
.dm-table td{padding:5px 8px;border-bottom:1px solid var(--border);border-right:1px solid var(--border);vertical-align:middle}
.dm-table .parent-row{background:var(--bg2);font-weight:600}
.dm-table .parent-row:hover{background:var(--hover)}
.dm-table .child-row{background:var(--bg)}
.dm-table .child-row:hover{background:var(--hover)}
.col-dt{width:80px;white-space:nowrap}
.col-name{min-width:120px}
.col-state{min-width:190px}
.col-location{min-width:110px;white-space:nowrap}
.col-ieee{width:140px;white-space:nowrap;color:var(--faint);font-size:12px}
.expand-icon{display:inline-block;width:16px;cursor:pointer;font-size:12px;margin-right:4px;user-select:none;color:var(--accent)}
.editable-cell{cursor:pointer;position:relative}
.editable-cell:hover{background:rgba(59,130,246,.08)}
.cell-value{display:inline-block;word-break:break-word}
.edit-input{position:absolute;left:0;top:0;margin:0;padding:4px 6px;width:100%;height:100%;border:2px solid var(--accent);border-radius:2px;background:var(--bg2);font-size:13px;outline:none;color:var(--text);box-sizing:border-box}
.edit-select{position:absolute;left:0;top:0;margin:0;padding:4px 6px;width:100%;height:100%;border:2px solid var(--accent);border-radius:2px;background:var(--bg2);font-size:13px;outline:none;color:var(--text);box-sizing:border-box}
.menu-dots{cursor:pointer;display:inline-block;padding:0 6px;font-size:16px;line-height:1;color:var(--faint)}
.menu-dots:hover{color:var(--accent)}
.dm-th-sort{cursor:pointer;user-select:none;white-space:nowrap}
.dm-th-sort:hover{color:var(--accent)}
.dm-th-sort .arr{font-size:9px;margin-left:3px;opacity:.75}
.dm-status{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.dm-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;box-shadow:0 0 0 2px rgba(0,0,0,.18)}
.dm-dot.online{background:var(--green)}
.dm-dot.offline{background:var(--faint)}
.dm-dot.left{background:var(--red)}
.dm-status .txt{font-size:12px;color:var(--muted)}
.dm-status .cnt{font-size:11px;color:var(--faint)}
.toggle-input{display:none!important}
.toggle-switch{display:inline-flex;align-items:center;width:36px;height:18px;background:var(--bg3);border-radius:12px;position:relative;cursor:pointer;flex-shrink:0;border:1px solid var(--border2);vertical-align:middle;transition:background .2s,border-color .2s}
.toggle-switch span{position:absolute;top:2px;left:2px;width:12px;height:12px;background:var(--text);border-radius:50%;transition:left .15s ease}
.toggle-input:checked + label .toggle-switch{background:rgba(34,197,94,.35);border-color:var(--green)}
.toggle-input:checked + label .toggle-switch span{left:20px;background:var(--green)}
.dm-table input[type=range]{-webkit-appearance:none;appearance:none;height:5px;border-radius:3px;background:var(--bg3);border:none;outline:none;cursor:pointer;vertical-align:middle;flex-shrink:0}
.dm-table input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:var(--text);border:2px solid var(--accent);cursor:pointer}
.dm-table select,.dm-table input{background:var(--bg);color:var(--text);border:1px solid var(--border2);border-radius:4px;padding:3px 6px;font-size:12px;outline:none}
.dm-table select:focus{border-color:var(--accent)}
.dm-modal{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;backdrop-filter:blur(2px)}
.dm-modal.show{display:flex}
.dm-modal-box{background:var(--bg2);border:1px solid var(--border2);border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.5);width:min(460px,94vw);max-height:88vh;display:flex;flex-direction:column}
.dm-modal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid var(--border);font-weight:700;font-size:14px}
.dm-modal-close{cursor:pointer;color:var(--faint);font-size:18px;padding:0 4px}
.dm-modal-close:hover{color:var(--red)}
.dm-modal-body{padding:12px 14px;overflow-y:auto;flex:1;min-height:0}
.dm-modal-body table{width:100%;border-collapse:collapse;font-size:13px}
.dm-modal-body td{padding:4px;border-bottom:1px solid var(--border);text-align:left}
.dm-modal-body input,.dm-modal-body button,.dm-modal-body select{background:var(--bg);color:var(--text);border:1px solid var(--border2);border-radius:5px;padding:5px 8px;font-size:13px}
.dm-modal-body .dm-tabs{display:flex;gap:4px;margin-bottom:10px}
.dm-modal-body .dm-tab{background:transparent;border:none;padding:4px 2px;margin-right:10px;font-size:13px;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.dm-modal-body .dm-tab:hover{color:var(--text)}
.dm-modal-body .dm-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.dm-modal-body .dm-scan-btn{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600;padding:6px 14px;border-radius:6px}
.dm-modal-body .dm-scan-btn:hover{background:var(--accent);filter:brightness(1.12);border-color:var(--accent)}
.dm-modal-body .dm-scan-btn.running{background:var(--red);border-color:var(--red);font-variant-numeric:tabular-nums}
.dm-ble-table{width:100%;border-collapse:collapse;font-size:12px}
.dm-ble-table th{background:var(--bg3);padding:5px 8px;text-align:left;font-size:11px;text-transform:uppercase;color:var(--faint);border-bottom:1px solid var(--border)}
.dm-ble-table td{padding:5px 8px;border-bottom:1px solid var(--border)}
.dm-ble-table button{background:var(--bg3);color:var(--accent);border:1px solid var(--border2);border-radius:4px;padding:4px 8px;font-size:12px;width:100%;text-align:left;cursor:pointer}
.dm-ble-table button:hover{border-color:var(--accent);background:var(--hover)}
.dm-join-scroll{height:280px;overflow-y:auto;margin-top:6px;border-top:1px solid var(--border);padding-top:6px}
.dm-group-table{width:100%;border-collapse:collapse;font-size:13px}
.dm-group-table td{padding:5px;border-bottom:1px solid var(--border);text-align:left}
#dmContextMenu{border:1px solid var(--border2);background:var(--bg2);padding:4px 0;width:170px;position:fixed;font-size:13px;z-index:2147483200;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:none;overflow:hidden}
#dmContextMenu .itemEl{display:flex;align-items:center;padding:6px 12px;cursor:pointer}
#dmContextMenu .itemEl:hover{background:var(--hover);color:var(--accent)}
#dmContextMenu img{width:24px;height:24px;padding:4px;box-sizing:border-box;background:#3b82f6;border-radius:50%;margin-right:10px}
#dmContextMenu .itemTxt{flex:1}
.dm-clear{cursor:pointer;color:var(--faint);font-size:15px;padding:0 2px 0 6px;user-select:none}
.dm-clear:hover{color:var(--red)}
@keyframes dmSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
`;

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>]/g, function (m) {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }

  // t(key, fb, vars) — перевод из словаря devicemgr (папка devicemanager), fallback на русский.
  function t(key, fb, vars) {
    if (window.L) {
      var d = L.dicts.devicemgr || {};
      var v = (d[L.lang] && d[L.lang][key]) != null ? d[L.lang][key] : (d.en && d.en[key]);
      if (v != null && vars) {
        Object.keys(vars).forEach(function (k) { v = String(v).replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]); });
      }
      if (v != null) return v;
    }
    return fb;
  }

  // сервер шлёт UnixMilli, приводим к секундам
  function tsSec(ts) {
    ts = Number(ts) || 0;
    if (ts > 1e11) ts = Math.floor(ts / 1000);
    return ts;
  }

  function agoStr(ts) {
    var s = Math.floor(Date.now() / 1000 - tsSec(ts));
    if (s < 0) s = 0;
    if (s < 60) return s + ' ' + t('ago.sec', 'с');
    var m = Math.floor(s / 60);
    if (m < 60) return m + ' ' + t('ago.min', 'мин');
    var h = Math.floor(m / 60);
    if (h < 24) return h + ' ' + t('ago.h', 'ч');
    return Math.floor(h / 24) + ' ' + t('ago.d', 'дн');
  }

  // статус родительской строки: онлайн/офлайн/покинуло сеть + число датчиков + last-seen
  function statusHtml(d) {
    var cnt = d.Report ? Object.keys(d.Report).length : 0;
    var cls = 'offline', lbl = t('st.offline', 'Офлайн');
    if (d.Leave && d.Leave !== 0) { cls = 'left'; lbl = t('st.left', 'Покинуло сеть'); }
    else if (d.lastSeen && (Date.now() / 1000 - tsSec(d.lastSeen)) < 300) { cls = 'online'; lbl = t('st.online', 'Онлайн'); }
    var out = '<span class="dm-dot ' + cls + '"></span><span class="txt">' + lbl + '</span>';
    if (cnt) out += '<span class="cnt">· ' + cnt + ' ' + t('st.sensors', 'датч.') + '</span>';
    if (d.lastSeen) out += '<span class="cnt">· ' + agoStr(d.lastSeen) + '</span>';
    return out;
  }

  function getRoleInfo(rep) {
    var raw = rep.role || '';
    var ampIdx = raw.indexOf('&');
    if (ampIdx !== -1) {
      var roleBase = raw.substring(0, ampIdx).trim();
      var classObj = (rep.class && Object.keys(rep.class).length) ? rep.class : null;
      if (!classObj) { try { classObj = JSON.parse(raw.substring(ampIdx + 1)); } catch (e) { classObj = {}; } }
      return { roleBase: roleBase, classObj: classObj || {} };
    }
    return { roleBase: raw.trim(), classObj: rep.class || {} };
  }

  // ── виджет устройства (перенос deviceManager._vidget) ────────────────
  function widgetHtml(device, key, value) {
    try {
      var ri = getRoleInfo(value);
      var role = ri.roleBase, attr = ri.classObj;
      var device_class = '';
      try { device_class = value.class.device_class; } catch (e) { try { device_class = attr.device_class || ''; } catch (e2) {} }
      if (!device_class) device_class = role;
      var id = device.IEEE + '#' + key;
      var idw = id.replace(/[^a-zA-Z0-9]/g, '_') + '_' + (Date.now() % 1000000);
      var html = '';

      if (device.DevType === 'Z2M') {
        return '<span class="' + id + '">' + (value.parsed != null ? value.parsed : '?') + '</span>';
      }

      switch (role) {
        case 'light':
          if (value.label === 'On_Off' || value.label === 'on_off') {
            var litOn = [1, '1', true, 'on', 'ON'].indexOf(value.parsed) !== -1;
            html += '<div style="display:flex;align-items:center;gap:5px;">' + window.getIconSvg('light_bulb', 18, litOn ? '#ffd54f' : '#666') +
              '<input type="checkbox" class="' + id + ' input toggle-input" id="lt_' + idw + '"' + (litOn ? ' checked' : '') +
              ' onchange="evm(\'on_off|' + id + '\',this.checked?1:0)"/>' +
              '<label for="lt_' + idw + '"><div class="toggle-switch ' + id + '"><span></span></div></label>' +
              '<span class="' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          } else if (value.label === 'Level') {
            html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg('brightness', 16, '#ffd54f') +
              '<input class="' + id + ' level" type="range" id="level|' + id + '" style="width:80px" min="0" max="100" step="2" value="' + (value.parsed || 0) + '" onchange="evm(\'level|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value+\'%\'">' +
              '<span class="' + id + '" style="font-size:11px;color:var(--faint);min-width:26px">' + (value.parsed != null ? value.parsed : 0) + '%</span></div>';
          } else if (value.label === 'Color') {
            html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg('sun_temp', 16, '#ff9800') +
              '<input class="' + id + ' color-temp" type="range" id="colorT|' + id + '" style="width:80px" min="0" max="100" step="2" value="' + (value.parsed || 0) + '" onchange="evm(\'colorT|' + id + '\',this.value)">' +
              '<span class="z' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          } else {
            html += '<span class="' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span>';
          }
          break;
        case 'switch': {
          var swOn = [1, '1', true, 'on', 'ON', 'вкл'].indexOf(value.parsed) !== -1;
          html += '<div style="display:flex;align-items:center;gap:5px;">' + window.getIconSvg(device_class || 'switch', 18, swOn ? '#66bb6a' : '#666') +
            '<input type="checkbox" class="' + id + ' input toggle-input" id="sw_' + idw + '"' + (swOn ? ' checked' : '') +
            ' onchange="evm(\'on_off|' + id + '\',this.checked?1:0)"/>' +
            '<label for="sw_' + idw + '"><div class="toggle-switch ' + id + '"><span></span></div></label>' +
            '<span class="' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
        }
        case 'range': {
          var rMin = (attr && attr.min != null) ? attr.min : 0;
          var rMax = (attr && attr.max != null) ? attr.max : 100;
          var rStep = (attr && attr.precision != null) ? attr.precision : 1;
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg('number', 16, '#90caf9') +
            '<input type="range" id="level|' + id + '" class="' + id + ' level" style="width:80px" min="' + rMin + '" max="' + rMax + '" step="' + rStep + '" value="' + (value.parsed != null ? value.parsed : rMin) + '" onchange="evm(\'level|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value">' +
            '<span class="' + id + '" style="font-size:11px;color:var(--faint);min-width:26px">' + (value.parsed != null ? value.parsed : rMin) + '</span></div>';
          break;
        }
        case 'number': {
          var nMin = (attr && attr.min != null) ? attr.min : 0;
          var nMax = (attr && attr.max != null) ? attr.max : 100;
          var nStep = (attr && attr.step != null) ? attr.step : 1;
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg('number', 16, '#90caf9') +
            '<input class="' + id + ' level" type="range" id="number|' + id + '" style="width:80px" min="' + nMin + '" max="' + nMax + '" step="' + nStep + '" value="' + (value.parsed != null ? value.parsed : nMin) + '" onchange="evm(\'number|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value">' +
            '<span class="' + id + '" style="font-size:11px;color:var(--faint);min-width:26px">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
        }
        case 'select': {
          var rawOpts = (attr && attr.options) ? attr.options : [];
          var selOpts = Array.isArray(rawOpts) ? rawOpts : String(rawOpts).split(',').map(function (s) { return s.trim(); });
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg('info', 16, '#90caf9') +
            '<select id="' + id + '" class="select ' + id + '" onchange="evm(\'select|' + id + '\',this.value)" style="font-size:11px;max-width:120px">';
          selOpts.forEach(function (opt) { var sel = (opt === value.parsed) ? ' selected' : ''; html += '<option value="' + opt + '"' + sel + '>' + opt + '</option>'; });
          html += '</select></div>';
          break;
        }
        case 'button':
          html += '<input type="button" value="' + (value.label || 'Press') + '" class="' + id + ' button-input" onclick="evm(\'button_press|' + id + '\',1)">';
          break;
        case 'cover': {
          var cPos = parseInt(value.parsed) || 0;
          var cDC = device_class || 'curtain';
          html += '<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;">' + window.getIconSvg(cDC, 16, cPos > 0 ? '#90caf9' : '#607d8b') +
            '<span onclick="evm(\'cover_open|' + id + '\',1)" style="cursor:pointer;font-size:12px;padding:0 4px;background:var(--bg3);border-radius:3px">▲</span>' +
            '<span onclick="evm(\'cover_stop|' + id + '\',1)" style="cursor:pointer;font-size:12px;padding:0 4px;background:var(--bg3);border-radius:3px">⏹</span>' +
            '<span onclick="evm(\'cover_close|' + id + '\',0)" style="cursor:pointer;font-size:12px;padding:0 4px;background:var(--bg3);border-radius:3px">▼</span>' +
            '<input class="' + id + ' level" type="range" id="cover_pos|' + id + '" style="width:65px" min="0" max="100" value="' + cPos + '" onchange="evm(\'cover_pos|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value+\'%\'">' +
            '<span class="' + id + '" style="font-size:11px;color:#90caf9;min-width:26px">' + cPos + '%</span></div>';
          break;
        }
        case 'fan': {
          var fanOn = [1, '1', true, 'on', 'ON'].indexOf(value.parsed) !== -1;
          var fanSpd = (value.speed != null) ? value.speed : 0;
          html += '<div style="display:flex;align-items:center;gap:5px;">' +
            '<div style="animation:' + (fanOn ? 'dmSpin 1.5s linear infinite' : 'none') + '">' + window.getIconSvg('fan', 18, fanOn ? '#29b6f6' : '#607d8b') + '</div>' +
            '<input type="checkbox" class="' + id + ' input toggle-input" id="fn_' + idw + '"' + (fanOn ? ' checked' : '') + ' onchange="evm(\'on_off|' + id + '\',this.checked?1:0)"/>' +
            '<label for="fn_' + idw + '"><div class="toggle-switch ' + id + '"><span></span></div></label>' +
            '<input class="' + id + ' level" type="range" id="fan_speed|' + id + '" style="width:60px" min="0" max="100" step="10" value="' + fanSpd + '" onchange="evm(\'fan_speed|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value+\'%\'">' +
            '<span class="' + id + '" style="font-size:11px;color:#29b6f6;min-width:26px">' + fanSpd + '%</span></div>';
          break;
        }
        case 'climate': {
          var cTemp = value.parsed || '—';
          var cSet = (attr && attr.target_temp != null) ? attr.target_temp : (value.set_temp || (value.temperature || '—'));
          var cMode = (attr && attr.hvac_mode) ? attr.hvac_mode : (value.mode || 'off');
          var cModes = (attr && attr.modes) ? attr.modes.split(',') : ['off', 'heat', 'cool', 'auto'];
          var cMinT = (attr && attr.min_temp) ? Number(attr.min_temp) : 5;
          var cMaxT = (attr && attr.max_temp) ? Number(attr.max_temp) : 35;
          var cTStep = (attr && attr.temp_step) ? Number(attr.temp_step) : 0.5;
          var cMCols = { heat: '#ff7043', cool: '#42a5f5', auto: '#ab47bc', fan_only: '#29b6f6', dry: '#ffca28', off: '#616161' };
          var cMIcos = { heat: '🔥', cool: '❄️', auto: '♻️', fan_only: '💨', dry: '💧', off: '⏸' };
          var cMCol = cMCols[cMode] || '#888';
          html += '<div style="display:flex;align-items:center;gap:3px;flex-wrap:wrap;">' + window.getIconSvg('climate', 18, cMCol) +
            '<span class="' + id + '" style="color:' + cMCol + ';font-size:13px;font-weight:bold">' + cTemp + '°</span>';
          cModes.forEach(function (m) {
            var bg = (m === cMode) ? (cMCols[m] || '#888') : 'var(--bg3)';
            html += '<span onclick="evm(\'climate_mode|' + id + '\',\'' + m + '\')" style="cursor:pointer;border-radius:8px;padding:1px 4px;font-size:10px;color:#fff;background:' + bg + ';border:1px solid ' + (cMCols[m] || '#888') + '">' + (cMIcos[m] || '') + m + '</span>';
          });
          html += '</div><div style="display:flex;align-items:center;gap:4px;margin-top:2px;">' +
            '<span style="font-size:10px;color:var(--faint)">🎯</span>';
          var cSetVal = (cSet !== '—') ? cSet : 20;
          html += '<input class="' + id + ' level" type="range" id="climate_temp|' + id + '" style="width:70px" min="' + cMinT + '" max="' + cMaxT + '" step="' + cTStep + '" value="' + cSetVal + '" onchange="evm(\'climate_temp|' + id + '\',this.value)" oninput="this.nextElementSibling.textContent=this.value+\'°\'">' +
            '<span style="font-size:11px;color:#ff9800;min-width:26px">' + cSetVal + '°</span></div>';
          break;
        }
        case 'lock': {
          var lkd = ['locked', '1', 1, true].indexOf(value.parsed) !== -1;
          var lkCol = lkd ? '#ef5350' : '#66bb6a';
          var lkCmd = lkd ? 'unlock' : 'lock';
          html += '<div style="display:flex;align-items:center;gap:5px;">' + window.getIconSvg('lock', 18, lkCol) +
            '<span onclick="evm(\'lock_toggle|' + id + '\',\'' + lkCmd + '\')" style="cursor:pointer;font-size:18px;color:' + lkCol + '">' + (lkd ? '🔒' : '🔓') + '</span>' +
            '<span class="' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
        }
        case 'alarm_control_panel': {
          var alSt = value.parsed || 'disarmed';
          var alCols = { disarmed: '#66bb6a', armed_home: '#ff9800', armed_away: '#ef5350', triggered: '#e53935', arming: '#ffca28' };
          var alLabls = { disarmed: t('al.disarmed', 'Снято'), armed_home: t('al.arm_home', 'Дома'), armed_away: t('al.arm_away', 'Вне дома'), triggered: t('al.triggered', '⚠️ ТРЕВОГА'), arming: t('al.arming', 'Взводится') };
          var alCol = alCols[alSt] || '#888';
          html += '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">' + window.getIconSvg('alarm_control_panel', 16, alCol) +
            '<span style="color:' + alCol + ';font-size:11px;font-weight:bold">' + (alLabls[alSt] || alSt) + '</span>';
          [['disarm', t('al.disarm', 'Снять'), '#66bb6a'], ['arm_home', t('al.home', 'Дома'), '#ff9800'], ['arm_away', t('al.away', 'Уйти'), '#ef5350']].forEach(function (cmd) {
            html += '<span onclick="evm(\'alarm|' + id + '\',\'' + cmd[0] + '\')" style="cursor:pointer;border-radius:6px;padding:1px 5px;font-size:10px;color:#fff;background:' + cmd[2] + '">' + cmd[1] + '</span>';
          });
          html += '</div>';
          break;
        }
        case 'binary_sensor': {
          var bOn = [1, '1', true, 'on', 'ON', 'true', 'detected', 'open'].indexOf(value.parsed) !== -1;
          var bCol = bOn ? '#ef5350' : '#66bb6a';
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg(device_class || 'sensor', 18, bCol) +
            '<span class="' + id + '" style="font-size:11px;color:' + bCol + '">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
        }
        case 'sensor': {
          var sNum = parseFloat(value.parsed);
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg(device_class || 'sensor', 18, 'silver', sNum) +
            '<span class="' + id + '" style="font-size:11px;color:var(--text)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
        }
        default:
          html += '<div style="display:flex;align-items:center;gap:4px;">' + window.getIconSvg(device_class || 'sensor', 18, 'silver', parseFloat(value.parsed)) +
            '<span class="' + id + '" style="font-size:11px;color:var(--faint)">' + (value.parsed != null ? value.parsed : '?') + '</span></div>';
          break;
      }
      return html;
    } catch (e) { console.log(e); return '?'; }
  }

  // ── состояние ──
  var st = { filter: '', expanded: {}, editing: null, secTimer: null, scanSec: 0, sort: null };

  function thSort(cls, key, label) {
    var arr = (st.sort && st.sort.key === key) ? (st.sort.dir === 1 ? ' ▲' : ' ▼') : '';
    return '<th class="' + cls + ' dm-th-sort" data-sort="' + key + '">' + label + '<span class="arr">' + arr + '</span></th>';
  }

  function evm(id, val) { if (window.widgetEvnt) widgetEvnt(id, val); }
  window.evm = evm;

  // ── таблица ──
  function genTable() {
    var html = '<table class="dm-table"><thead><tr>' +
      thSort('col-dt', 'DevType', t('th.dt', 'DT')) +
      thSort('col-name', 'Name', t('th.name', 'Name')) +
      '<th class="col-state">State</th>' +
      thSort('col-location', 'Location', t('th.location', 'Location')) +
      thSort('col-ieee', 'IEEE', t('th.ieee', 'IEEE')) + '</tr></thead><tbody>';
    var f = st.filter.toLowerCase();
    var list = deviceList.slice();
    if (st.sort && st.sort.key) {
      var k = st.sort.key, dir = st.sort.dir;
      list.sort(function (a, b) {
        var va = (a[k] == null ? '' : a[k]).toString().toLowerCase();
        var vb = (b[k] == null ? '' : b[k]).toString().toLowerCase();
        return va < vb ? -dir : va > vb ? dir : 0;
      });
    }
    for (var i = 0; i < list.length; i++) {
      var d = list[i];
      if (f) {
        if (!(d.Name || '').toLowerCase().includes(f) && !(d.Location || '').toLowerCase().includes(f) &&
            !(d.IEEE || '').toLowerCase().includes(f) && !(d.DevType || '').toLowerCase().includes(f)) continue;
      }
      var ex = !!st.expanded[d.IEEE];
      html += '<tr class="parent-row" data-ieee="' + escapeHtml(d.IEEE) + '">' +
        '<td class="col-dt"><span class="expand-icon" data-ieee="' + escapeHtml(d.IEEE) + '">' + (ex ? '▼' : '▶') + '</span> <strong>' + escapeHtml(d.DevType || '—') + '</strong></td>' +
        '<td class="col-name editable-cell" data-ieee="' + escapeHtml(d.IEEE) + '" data-key="~" data-field="name"><span class="cell-value">' + escapeHtml(d.Name) + '</span></td>' +
        '<td class="col-state"><div class="dm-status">' + statusHtml(d) +
        '<div onclick="dm.cmMnu(this.id)" id="cm_' + escapeHtml(d.IEEE) + '" class="menu-dots" title="' + t('cm.hint', 'Меню устройства') + '">...</div></div></td>' +
        '<td class="col-location editable-cell" data-ieee="' + escapeHtml(d.IEEE) + '" data-key="~" data-field="location"><span class="cell-value">' + escapeHtml(d.Location || '—') + '</span></td>' +
        '<td class="col-ieee">' + escapeHtml(d.IEEE) + '</td></tr>';
      if (d.Report) {
        for (var key in d.Report) {
          if (!d.Report.hasOwnProperty(key)) continue;
          var v = d.Report[key];
          var iconType = 'sensor'; try { iconType = getRoleInfo(v).roleBase || 'sensor'; } catch (e) {}
          var objLoc = v.location || '';
          var locDisp = objLoc || d.Location || '—';
          var locStyle = objLoc ? 'color:#90caf9;font-style:italic;' : '';
          html += '<tr class="child-row" data-parent="' + escapeHtml(d.IEEE) + '" style="display:' + (ex ? 'table-row' : 'none') + ';">' +
            '<td class="col-dt"><span style="display:inline-block;width:8px"></span>' + window.getIconSvg(iconType, 18, '#666666') + '</td>' +
            '<td class="col-name editable-cell" data-ieee="' + escapeHtml(d.IEEE) + '" data-key="' + escapeHtml(key) + '" data-field="name"><span class="cell-value">' + escapeHtml(v.label) + '</span></td>' +
            '<td class="col-state widget-cell">' + widgetHtml(d, key, v) + '</td>' +
            '<td class="col-location editable-cell" data-ieee="' + escapeHtml(d.IEEE) + '" data-key="' + escapeHtml(key) + '" data-field="location"><span class="cell-value" style="' + locStyle + '">' + escapeHtml(locDisp) + '</span></td>' +
            '<td class="col-ieee"></td></tr>';
        }
      }
    }
    html += '</tbody></table>';
    return html;
  }

  function renderTable() {
    var wrap = document.getElementById('dm_table_wrap');
    if (!wrap) return;
    wrap.innerHTML = genTable();
    var icons = wrap.querySelectorAll('.expand-icon');
    for (var i = 0; i < icons.length; i++) icons[i].addEventListener('click', toggleExpand);
    var cells = wrap.querySelectorAll('.editable-cell');
    for (var j = 0; j < cells.length; j++) cells[j].addEventListener('dblclick', startEdit);
    var heads = wrap.querySelectorAll('.dm-th-sort');
    for (var h = 0; h < heads.length; h++) heads[h].addEventListener('click', function (e) {
      dm.sortBy(e.currentTarget.getAttribute('data-sort'));
    });
    var stc = document.getElementById('dm_st_count');
    if (stc) {
      var visible = deviceList.length;
      if (st.filter) {
        var f = st.filter.toLowerCase();
        visible = deviceList.filter(function (d) {
          return (d.Name || '').toLowerCase().includes(f) || (d.Location || '').toLowerCase().includes(f) ||
            (d.IEEE || '').toLowerCase().includes(f) || (d.DevType || '').toLowerCase().includes(f);
        }).length;
      }
      stc.textContent = t('st.devices', 'Устройств: {a} / {b}', { a: visible, b: deviceList.length });
    }
  }

  function toggleExpand(e) {
    e.stopPropagation();
    var ieee = e.currentTarget.getAttribute('data-ieee');
    if (st.expanded[ieee]) { delete st.expanded[ieee]; }
    else st.expanded[ieee] = true;
    renderTable();
  }

  // ── редактирование ячеек ──
  function startEdit(e) {
    if (st.editing) cancelEdit();
    var cell = e.currentTarget;
    var value = cell.querySelector('.cell-value').textContent;
    var ieee = cell.getAttribute('data-ieee');
    var key = cell.getAttribute('data-key');
    var field = cell.getAttribute('data-field');
    var commit = function (nv, sel) {
      doSaveEdit({ cell: cell, ieee: ieee, key: key, field: field, old: value }, nv, sel);
    };
    if (field === 'location') {
      var locs = [];
      deviceList.forEach(function (d) {
        if (d.Location && locs.indexOf(d.Location) === -1) locs.push(d.Location);
        if (d.Report) for (var k in d.Report) { var l = d.Report[k].location; if (l && locs.indexOf(l) === -1) locs.push(l); }
      });
      locs.sort();
      var sel = document.createElement('select');
      sel.className = 'edit-select';
      var empty = document.createElement('option'); empty.value = ''; empty.textContent = t('sel.select', '— Select —'); sel.appendChild(empty);
      locs.forEach(function (l) { var o = document.createElement('option'); o.value = l; o.textContent = l; if (l === value) o.selected = true; sel.appendChild(o); });
      cell.innerHTML = '';
      cell.appendChild(sel);
      sel.focus();
      st.editing = { cell: cell, select: sel, ieee: ieee, key: key, field: field, old: value };
      sel.addEventListener('change', function () { commit(sel.value); });
      sel.addEventListener('blur', function () { commit(sel.value); });
      sel.addEventListener('keydown', function (e2) {
        if (e2.key === 'Enter') commit(sel.value);
        if (e2.key === 'Escape') cancelEdit();
      });
    } else {
      var inp = document.createElement('input');
      inp.type = 'text'; inp.value = value; inp.className = 'edit-input';
      cell.innerHTML = ''; cell.appendChild(inp);
      inp.focus(); inp.select();
      st.editing = { cell: cell, input: inp, ieee: ieee, key: key, field: field, old: value };
      inp.addEventListener('blur', function () { commit(inp.value.trim()); });
      inp.addEventListener('keydown', function (e2) {
        if (e2.key === 'Enter') commit(inp.value.trim());
        if (e2.key === 'Escape') cancelEdit();
      });
    }
  }

  function cancelEdit() {
    if (!st.editing) return;
    var ed = st.editing;
    ed.cell.innerHTML = '<span class="cell-value">' + escapeHtml(ed.old || '—') + '</span>';
    st.editing = null;
  }

  function doSaveEdit(ed, nv) {
    if (nv === ed.old) { cancelEdit(); return; }
    var idx = -1;
    for (var i = 0; i < deviceList.length; i++) if (deviceList[i].IEEE == ed.ieee) { idx = i; break; }
    if (idx === -1) { cancelEdit(); return; }
    var d = deviceList[idx], changed = false;
    if (ed.field === 'location') {
      if (ed.key === '~') { if (d.Location !== nv) { d.Location = nv; changed = true; } }
      else if (d.Report && d.Report[ed.key]) { var ol = d.Report[ed.key].location || ''; if (ol !== nv) { d.Report[ed.key].location = nv; changed = true; } }
    } else {
      if (ed.key === '~') { if (d.Name !== nv) { d.Name = nv; changed = true; } }
      else if (d.Report && d.Report[ed.key]) { if (d.Report[ed.key].label !== nv) { d.Report[ed.key].label = nv; changed = true; } }
    }
    if (changed) {
      deviceList[idx] = d;
      WSsend('SaveJson|/Devices/' + d.IEEE + '|' + JSON.stringify(d));
    }
    ed.cell.innerHTML = '<span class="cell-value">' + escapeHtml(nv || '—') + '</span>';
    st.editing = null;
  }

  // ── контекст-меню ──
  var dm = {};
  window.dm = dm;

  dm.cmMnu = function (id) {
    var ieee = id.slice(3);
    var d = deviceList.find(function (x) { return x.IEEE == ieee; });
    if (!d) return;
    if (d.DevType == 'ZC') return;
    var mnu = document.getElementById('dmContextMenu');
    mnu.innerHTML = '';
    function addEl(imgP, caption, fn) {
      var img = document.createElement('img'); img.src = imgP;
      var div = document.createElement('div'); div.className = 'itemEl';
      var t = document.createElement('div'); t.className = 'itemTxt'; t.innerHTML = caption;
      div.appendChild(img); div.appendChild(t);
      div.onclick = function () { dm.cmAct(fn); };
      mnu.appendChild(div);
    }
    if (d.DevType == 'ZR') addEl('./static/icons/ZIGBEE.svg', t('cm.join', 'Join'), 'add&' + ieee);
    if (d.EP && JSON.stringify(d.EP).indexOf('0004') != -1) addEl('./static/icons/link.svg', t('cm.group', 'Add in group'), 'group&' + ieee);
    addEl('./static/icons/templateedit.svg', t('cm.config', 'Config'), 'edit&' + ieee);
    addEl('./static/icons/blockly.svg', t('cm.scenes', 'Сценарии'), 'scenes&' + ieee);
    addEl('./static/icons/trash.svg', t('cm.del', 'Del'), 'del&' + ieee);
    addEl('./static/icons/user-trash.png', t('cm.clean', 'Clean'), 'clean&' + ieee);
    // Центрируем меню относительно окна «Менеджер устройств», а не курсора.
    // Сначала показываем, иначе getBoundingClientRect вернёт нули.
    mnu.style.display = 'block';
    var win = mnu.closest('.window');
    if (win) {
      var wr = win.getBoundingClientRect();
      var mr = mnu.getBoundingClientRect();
      mnu.style.left = Math.round(wr.left + (wr.width - mr.width) / 2) + 'px';
      mnu.style.top = Math.round(wr.top + (wr.height - mr.height) / 2) + 'px';
    }
  };

  dm.cmAct = function (mnu) {
    var parts = mnu.split('&');
    var cmd = parts[0], dev = parts[1];
    var d = deviceList.find(function (x) { return x.IEEE == dev; });
    var m = document.getElementById('dmContextMenu'); if (m) m.style.display = 'none';
    switch (cmd) {
      case 'del': if (d) WSsend('removeDevice|' + d.Device + '|' + dev); break;
      case 'clean': if (d) WSsend('removeDevice|' + d.Device + '|' + dev + '|force'); break;
      case 'edit': if (window.WinEngine && WinEngine.open) WinEngine.open('templateedit', { params: '1#' + d.IEEE }); break;
      case 'group': dm.groupUI(); break;
      case 'scenes': if (window.WinEngine && WinEngine.open) WinEngine.open('scenes', { params: '1#' + d.IEEE }); break;
      case 'add':
        openModal('join');
        WSsend('addDevice|' + (d ? d.Device : ''));
        startAddTimer();
        break;
    }
  };

  // ── модалки ──
  function openModal(name) { var m = document.getElementById('dm_modal_' + name); if (m) m.classList.add('show'); }
  function closeModal(name) {
    var m = document.getElementById('dm_modal_' + name); if (m) m.classList.remove('show');
    if (name === 'join') {
      stopAddTimer();
      stopSecTimer();
      var box = document.querySelector('#dm_modal_join .dm-join-scroll'); if (box) box.innerHTML = '';
    }
  }
  dm.openModal = openModal; dm.closeModal = closeModal;

  function setScanBtn(label, running) {
    var b = document.getElementById('dm_scan_btn');
    if (!b) return;
    b.textContent = label;
    b.classList.toggle('running', !!running);
  }
  function startAddTimer() {
    stopSecTimer();
    st.scanSec = 240;
    setScanBtn(t('scan.sec', '⏹ {n} с', { n: st.scanSec }), true);
    st.secTimer = setInterval(function () {
      st.scanSec--;
      setScanBtn(t('scan.sec', '⏹ {n} с', { n: st.scanSec }), true);
      if (st.scanSec <= 0) {
        stopSecTimer();
        WSsend('addDeviceDone');
      }
    }, 1000);
  }
  function stopAddTimer() { stopSecTimer(); }
  function stopSecTimer() { if (st.secTimer) { clearInterval(st.secTimer); st.secTimer = null; } st.scanSec = 0; setScanBtn(t('scan.btn', 'Сканировать'), false); }
  dm.zigbeeScan = function () {
    if (st.secTimer) { WSsend('addDeviceDone'); stopSecTimer(); }
    else { WSsend('addDevice||' + document.getElementById('scan_ch').value); startAddTimer(); }
  };

  // ── BLE ──
  dm.ble = function (data) {
    var tb = document.getElementById('deviceTable');
    if (!tb) return;
    tb.innerHTML = '';
    data.forEach(function (dev) {
      var row = document.createElement('tr');
      var inBase = !!deviceList.find(function (nm) { return nm.IEEE === dev.id; });
      var ac = document.createElement('td');
      if (inBase) ac.textContent = dev.id;
      else {
        var b = document.createElement('button');
        b.textContent = dev.address;
        var nam = dev.localName || 'BLE';
        b.onclick = function () { dm.addBle(dev.id, nam); };
        ac.appendChild(b);
      }
      var nc = document.createElement('td'); nc.textContent = dev.localName || '';
      row.appendChild(ac); row.appendChild(nc);
      tb.appendChild(row);
    });
  };
  dm.addBle = function (adr, name) {
    WSsend('addBleDev|' + adr + '|' + name);
    WSsend('LoadJson|/Devtemplates/BLE');
    eventE.once('templatesBLE', function (data) {
      var dev = deviceList.find(function (nm) { return nm.IEEE === adr; });
      if (dev && dev.Report) return;
      eventE.off('ArBle', dm.ble);
      var box = document.querySelector('#dm_modal_join .dm-join-scroll');
      if (box) {
        box.innerHTML = '';
        try {
          var arr = JSON.parse(data);
          arr.forEach(function (item, index) {
            var key = Object.keys(item)[0];
            var val = item[key];
            var row = document.createElement('div');
            row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid var(--border);cursor:pointer';
            var img = document.createElement('img'); img.src = val.template.Img; img.width = 48;
            img.style.cssText = 'border-radius:5px';
            var txt = document.createElement('div');
            var h = document.createElement('b'); h.textContent = key;
            var p = document.createElement('div'); p.textContent = val.description; p.style.cssText = 'color:var(--faint);font-size:11px';
            txt.appendChild(h); txt.appendChild(p);
            row.appendChild(img); row.appendChild(txt);
            row.onclick = function () { dm.setBleTpl(val.template, adr, name); };
            box.appendChild(row);
          });
        } catch (e) { box.textContent = t('ble.err_tpl', 'Ошибка шаблонов: {msg}', { msg: e.message }); }
      }
    });
  };
dm.setBleTpl = function (dev, adr, name) {
    dev.Device = adr; dev.IEEE = adr; dev.Name = name;
    WSsend('BLEscan|"false"');
    WSsend('SaveJson|/Devices/' + adr + '|' + JSON.stringify(dev));
    WSsend('getDeviceList');
    stopAddTimer();
    closeModal('join');
  };
  dm.bleUI = function () {
    openModal('join');
    setJoinTab('dm_tab_ble');
    var box = document.querySelector('#dm_modal_join .dm-join-scroll');
    if (box) box.innerHTML = '<table class="dm-ble-table"><thead><tr><th>' + t('ble.addr', 'Address') + '</th><th>' + t('ble.local', 'Local Name') + '</th></tr></thead><tbody id="deviceTable"></tbody></table>';
    eventE.off('ArBle', dm.ble); eventE.on('ArBle', dm.ble);
    WSsend('BLEscan|"true"');
  };
  function setJoinTab(id) {
    ['dm_tab_zigbee', 'dm_tab_ble'].forEach(function (t) {
      var b = document.getElementById(t); if (b) b.classList.toggle('active', t === id);
    });
  }
  dm.zigbeeUI = function () {
    openModal('join');
    setJoinTab('dm_tab_zigbee');
    var root = document.querySelector('#dm_modal_join .dm-join-scroll');
    if (!root) return;
    root.innerHTML = '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><b>' + t('scan.channel', 'Канал') + ':</b><input id="scan_ch" style="width:70px" list="scan_channels">' +
      '<button id="dm_scan_btn" class="dm-scan-btn" onclick="dm.zigbeeScan()">' + t('scan.btn', 'Сканировать') + '</button></div>' +
      '<datalist id="scan_channels"></datalist>' +
      '<div style="height:220px;overflow-y:auto" id="joinstatus"></div>';
    var dl = document.getElementById('scan_channels');
    [11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26].forEach(function (c) { var o = document.createElement('option'); o.value = c; dl.appendChild(o); });
    var fillChan = function () {
      if (!window.jsconfig || !window.jsconfig.ZIGBEE) { return false; }
      var ch = window.jsconfig.ZIGBEE.Chanel || window.jsconfig.ZIGBEE.Channel;
      var f = document.getElementById('scan_ch');
      if (f && ch) f.value = ch;
      return true;
    };
    if (!fillChan()) {
      var mark = function (data) { if (fillChan()) { if (window.eventE) eventE.off('jsconfig', mark); } };
      if (window.eventE) eventE.on('jsconfig', mark);
    }
  };

  // ── группы ──
  dm.groupUI = function () {
    openModal('group');
    eventE.on('groups', dm.group);
    dm.group(groups);
  };
  dm.group = function (data) {
    var c = document.getElementById('GroupStatus');
    if (!c) return;
    var html = '<table class="dm-group-table">';
    for (var i = 0; i < data.length; i++) {
      html += '<tr><td><span style="color:var(--accent)">' + escapeHtml(data[i].adress) + '</span></td><td style="width:100%">' + escapeHtml(data[i].name) + '</td><td><button onclick="dm.delGroup(' + i + ')">Del</button></td></tr>';
    }
    html += '</table>';
    c.innerHTML = html;
  };
  dm.addGroup = function () {
    var adr = document.getElementById('group_adress').value.padStart(4, '0').toUpperCase();
    var name = document.getElementById('group_name').value;
    if (!name) return;
    groups.push({ name: name, adress: adr, devices: [] });
    WSsend('SaveJson|/groups.json|' + JSON.stringify(groups));
    WSsend('LoadJson|/groups.json');
    document.getElementById('group_adress').value = ''; document.getElementById('group_name').value = '';
  };
  dm.delGroup = function (num) {
    groups.splice(num, 1);
    WSsend('SaveJson|/groups.json|' + JSON.stringify(groups));
    WSsend('LoadJson|/groups.json');
  };

  // ── Bind ──
  // ponytail: координатор (ZC) первым, без дублей
  function dstAllOpts() {
    var li = '';
    deviceList.forEach(function (z) { if (z.DevType == 'ZC') li += '<option value="' + z.IEEE + '">' + (z.Name || 'Coordinator') + '</option>'; });
    deviceList.forEach(function (z) { if (z.DevType == 'ZR' || z.DevType == 'ZED') li += '<option value="' + z.IEEE + '">' + z.ModelId + '</option>'; });
    return li;
  }
  function bindRow(id, listId, label, opts, onch) {
    return '<tr><td>' + label + '</td><td><input id="' + id + '" list="' + listId + '"' + (onch ? ' onchange="' + onch + '"' : '') + '><datalist id="' + listId + '">' + (opts || '') + '</datalist>' +
      '<span class="dm-clear" title="Очистить" onclick="dm.clearBind(\'' + id + '\')">✕</span></td></tr>';
  }
  dm.bindUI = function () {
    openModal('bind');
    var c = document.getElementById('dmBindStatus');
    if (!c) return;
    var srcOpts = '';
    deviceList.forEach(function (z) { if (z.DevType == 'ZR' || z.DevType == 'ZED') srcOpts += '<option value="' + z.IEEE + '">' + z.Name + '</option>'; });
    c.innerHTML = '<table>' +
      bindRow('src_Adr', 'src_Adr_list', 'Controller Adr', srcOpts, 'dm.fSEP(this.value)') +
      bindRow('src_ep', 'src_ep_list', 'Source EP', '', 'dm.fCluster()') +
      bindRow('cluster_id', 'cluster_id_list', 'Cluster', '', 'dm.fDAdr()') +
      bindRow('dst_Adr', 'dst_Adr_list', 'Actuator Adr', dstAllOpts(), 'dm.fDEP(this.value)') +
      bindRow('dst_ep', 'dst_ep_list', 'Dst EP', '', '') +
      '</table>' +
      '<div style="text-align:center;margin-top:12px"><button id="dm_bind_btn" onclick="dm.bind()">Bind</button>&nbsp;<button id="dm_unbind_btn" onclick="dm.unbind()">UnBind</button>' +
      '<span id="dm_bind_wait" style="display:none">⏳ Выполнение...</span></div>';
    c.innerHTML = li;
    dm.bindBusy(!!st.bindBusy);
  };
  // крестик чистит своё поле и всё ниже по цепочке src→ep→cluster→dst→dstep
  dm.clearBind = function (id) {
    var order = ['src_Adr', 'src_ep', 'cluster_id', 'dst_Adr', 'dst_ep'];
    var lists = { src_Adr: 'src_ep_list', src_ep: 'cluster_id_list', cluster_id: 'dst_Adr_list', dst_Adr: 'dst_ep_list' };
    var start = order.indexOf(id);
    if (start === -1) { var f = document.getElementById(id); if (f) f.value = ''; return; }
    for (var i = start; i < order.length; i++) {
      var fl = document.getElementById(order[i]);
      if (fl) fl.value = '';
      var ln = lists[order[i]];
      if (ln) { var l = document.getElementById(ln); if (l) l.innerHTML = (order[i] === 'cluster_id') ? dstAllOpts() : ''; }
    }
  };
  dm.fSEP = function (dev) {
    var d = deviceList.find(function (x) { return x.IEEE == dev; });
    var li = ''; if (d && d.EP) for (var k in d.EP) li += '<option value="' + k + '">' + k + '</option>';
    var el = document.getElementById('src_ep_list'); if (el) el.innerHTML = li;
  };
  dm.fCluster = function () {
    var d = deviceList.find(function (x) { return x.IEEE == document.getElementById('src_Adr').value; });
    var ep = document.getElementById('src_ep').value;
    var cl = [];
    if (d && d.EP && d.EP[ep]) cl = Array.from(new Set((d.EP[ep].ClI || []).concat(d.EP[ep].ClO || [])));
    cl.sort();
    var li = ''; for (var i = 0; i < cl.length; i++) li += '<option value="' + cl[i] + '">' + cl[i] + '</option>';
    var el = document.getElementById('cluster_id_list'); if (el) el.innerHTML = li;
  };
  dm.fDAdr = function () {
    var c = document.getElementById('cluster_id').value;
    var li = '';
    deviceList.forEach(function (z) { if (z.DevType == 'ZC') li += '<option value="' + z.IEEE + '">' + (z.Name || 'Coordinator') + '</option>'; });
    deviceList.forEach(function (z) { if (z.DevType != 'ZC' && z.EP && JSON.stringify(z.EP).indexOf(c) != -1) li += '<option value="' + z.IEEE + '">' + z.Name + '</option>'; });
    var el = document.getElementById('dst_Adr_list'); if (el) el.innerHTML = li;
  };
  dm.fDEP = function (dev) {
    var c = document.getElementById('cluster_id').value;
    var d = deviceList.find(function (x) { return x.IEEE == dev; });
    var li = '';
    if (d && d.EP) for (var k in d.EP) { if (JSON.stringify(d.EP[k]).indexOf(c) != -1) li += '<option value="' + k + '">' + k + '</option>'; }
    var el = document.getElementById('dst_ep_list'); if (el) el.innerHTML = li;
  };
  function bindReq(which) {
    var js = {};
    js._u64TargetExtAddr = document.getElementById('src_Adr').value;
    js.u8TargetEndPoint = document.getElementById('src_ep').value;
    js.u16ClusterID = document.getElementById('cluster_id').value;
    js._u64DstAddr = document.getElementById('dst_Adr').value;
    js.u8DstEndPoint = document.getElementById('dst_ep').value;
    js.u8DstAddrMode = 3;
    if (!js.u8DstEndPoint) js.u8DstAddrMode = 1;
    var obj = {}; obj[which] = js;
    WSsend(JSON.stringify(obj));
  }
  dm.bind = function () { dm.bindBusy(true); bindReq('BIND_REQUEST'); };
  dm.unbind = function () { dm.bindBusy(true); bindReq('UNBIND_REQUEST'); };
  // прячем кнопки на время запроса, пока не придёт status| (результат или таймаут)
  dm.bindBusy = function (on) {
    st.bindBusy = !!on;
    var b1 = document.getElementById('dm_bind_btn'), b2 = document.getElementById('dm_unbind_btn'), w = document.getElementById('dm_bind_wait');
    if (b1) b1.style.display = on ? 'none' : '';
    if (b2) b2.style.display = on ? 'none' : '';
    if (w) w.style.display = on ? '' : 'none';
  };
  dm.onBindStatus = function (txt) {
    if (/BIND_REQUEST|UNBIND_REQUEST/.test(txt || '')) dm.bindBusy(false);
  };
  dm.reset = function () { openModal('confirm'); };
  dm.confirmYes = function () { closeModal('confirm'); WSsend('Init_Zigbee'); };
  dm.confirmNo = function () { closeModal('confirm'); };

  // ── поиск ──
  dm.search = function (v) {
    st.filter = v || '';
    var x = document.getElementById('dm_search_clear');
    if (x) x.style.display = st.filter ? 'block' : 'none';
    renderTable();
  };
  dm.clearSearch = function () { var i = document.getElementById('dm_search'); if (i) i.value = ''; dm.search(''); };

  // ── сортировка ──
  dm.sortBy = function (key) {
    if (!st.sort || st.sort.key !== key) st.sort = { key: key, dir: 1 };
    else st.sort.dir *= -1;
    renderTable();
  };

  // ── развернуть/свернуть все ──
  dm.toggleAll = function () {
    var anyCollapsed = false;
    for (var i = 0; i < deviceList.length; i++) {
      if (!st.expanded[deviceList[i].IEEE]) { anyCollapsed = true; break; }
    }
    if (anyCollapsed) deviceList.forEach(function (d) { st.expanded[d.IEEE] = true; });
    else st.expanded = {};
    renderTable();
  };

  // ── регистрация виджета ──
  window.WinEngine.register({
    id: 'devicemgr',
    title: 'Менеджер устройств',
    label: 'Менеджер устройств',
    icon: '<img src="/static/icons/devicemanager.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="120" data-y="60" data-w="900" data-h="580">' +
      '<style>' + CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Менеджер устройств</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden"><div class="dm">' +
        '<div class="dm-toolbar">' +
          '<button class="dm-btn" data-i18n="tb.add" onclick="dm.openModal(\'join\')">➕ Добавить</button>' +
          '<button class="dm-btn" data-i18n="tb.groups" onclick="dm.groupUI()">🗄 Группы</button>' +
          '<button class="dm-btn" data-i18n="tb.bind" onclick="dm.bindUI()">🔗 Bind</button>' +
          '<button class="dm-btn" data-i18n="tb.init" onclick="dm.reset()">♻️ Инит</button>' +
          '<span class="dm-search-wrap"><input class="dm-search" id="dm_search" placeholder="Поиск..." data-i18n-ph="tb.search" oninput="dm.search(this.value)">' +
          '<span class="dm-search-clear" id="dm_search_clear" title="Очистить" onclick="dm.clearSearch()">✕</span></span>' +
          '<button class="dm-btn" id="dm_expand_btn" data-i18n="tb.expand" onclick="dm.toggleAll()">⤢ Все</button>' +
        '</div>' +
        '<div class="dm-table-wrap" id="dm_table_wrap"></div>' +
        '<div class="dm-statusbar" id="dm_statusbar"><span id="dm_st_count"></span></div>' +
      '</div>' +
      '<div id="dmContextMenu"></div>' +

      '<div class="dm-modal" id="dm_modal_join"><div class="dm-modal-box">' +
        '<div class="dm-modal-head"><span data-i18n="modal.join">Добавить устройство</span><span class="dm-modal-close" onclick="dm.closeModal(\'join\')">✕</span></div>' +
        '<div class="dm-modal-body"><div class="dm-tabs">' +
          '<button class="dm-tab" id="dm_tab_zigbee" data-i18n="tab.zigbee" onclick="dm.zigbeeUI()">Zigbee</button>' +
          '<button class="dm-tab" id="dm_tab_ble" data-i18n="tab.ble" onclick="dm.bleUI()">BLE</button>' +
        '</div><div class="dm-join-scroll"></div></div>' +
      '</div></div>' +

      '<div class="dm-modal" id="dm_modal_group"><div class="dm-modal-box">' +
        '<div class="dm-modal-head"><span data-i18n="modal.group">Менеджер групп</span><span class="dm-modal-close" onclick="dm.closeModal(\'group\')">✕</span></div>' +
        '<div class="dm-modal-body"><div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
          '<span style="color:var(--faint)">id</span><input id="group_adress" style="width:64px">' +
          '<span style="color:var(--faint)">Name</span><input id="group_name" style="flex:1">' +
          '<button onclick="dm.addGroup()">+</button></div>' +
          '<div style="margin-top:8px;border-top:1px solid var(--border);padding-top:6px;height:260px;overflow-y:auto" id="GroupStatus"></div>' +
        '</div></div></div>' +

      '<div class="dm-modal" id="dm_modal_bind"><div class="dm-modal-box">' +
        '<div class="dm-modal-head"><span data-i18n="modal.bind">Привязка (Bind)</span><span class="dm-modal-close" onclick="dm.closeModal(\'bind\')">✕</span></div>' +
        '<div class="dm-modal-body" id="dmBindStatus"></div></div></div>' +

      '<div class="dm-modal" id="dm_modal_confirm"><div class="dm-modal-box">' +
        '<div class="dm-modal-head"><span data-i18n="modal.confirm">Инициализация Zigbee</span><span class="dm-modal-close" onclick="dm.confirmNo()">✕</span></div>' +
        '<div class="dm-modal-body" style="text-align:center"><div style="font-size:44px;margin:8px 0">⚠️</div>' +
          '<div style="font-weight:700;font-size:15px;margin-bottom:8px" data-i18n="confirm.msg">Инициализировать zigbee-сеть?</div>' +
          '<div style="font-size:13px;color:var(--muted);line-height:1.5;margin-bottom:16px" data-i18n="confirm.desc">Все устройства будут исключены из сети, сеть будет пересоздана заново.</div>' +
          '<div style="display:flex;gap:8px;justify-content:center">' +
            '<button class="dm-btn" data-i18n="btn.cancel" style="border-color:var(--red);color:var(--red)" onclick="dm.confirmNo()">Отмена</button>' +
            '<button class="dm-btn" data-i18n="btn.init" style="background:var(--red);color:#fff;border-color:var(--red)" onclick="dm.confirmYes()">Инициализировать</button>' +
          '</div></div></div></div>' +

      '</div></div>',

    setup(node) {
      node._state = { onDev: null };
      if (window.L) L.ready('devicemgr').then(function () { L.applyLang(node, 'devicemgr'); });
      st.onDev = function () { renderTable(); };
      if (window.eventE) eventE.on('updateDeviceList', st.onDev);
      // живой пересчёт «назад» (с/мин/ч/дн), пропуск пока редактируется ячейка
      if (st.agoTimer) clearInterval(st.agoTimer);
      st.agoTimer = setInterval(function () { if (!st.editing) renderTable(); }, 5000);
      if (window.eventE) eventE.on('bindStatus', dm.onBindStatus);
      if (window.websocket && websocket.readyState === 1) window.WSsend('getDeviceList');
      renderTable();
      node.addEventListener('click', function (e) {
        if (!e.target.closest('#dmContextMenu') && !e.target.closest('.menu-dots')) {
          var m = document.getElementById('dmContextMenu'); m.style.display = 'none';
        }
      });
      node.addEventListener('contextmenu', function (e) {
        var dots = e.target.closest('.menu-dots');
        if (dots) { e.preventDefault(); dm.cmMnu(dots.id); return; }
        var row = e.target.closest('.parent-row');
        if (row) { e.preventDefault(); dm.cmMnu('cm_' + row.getAttribute('data-ieee')); }
      });
    },
    activate(node) {
      var wrap = document.getElementById('dm_table_wrap');
      if (wrap && !wrap.children.length) renderTable();
    },
    destroy(node) {
      if (st.onDev) eventE.off('updateDeviceList', st.onDev);
      if (st.agoTimer) { clearInterval(st.agoTimer); st.agoTimer = null; }
      eventE.off('ArBle', dm.ble);
      eventE.off('groups', dm.group);
      eventE.off('bindStatus', dm.onBindStatus);
      stopAddTimer();
      stopSecTimer();
      st.editing = null;
    }
  });
})();