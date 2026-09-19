// devices.js — виджет «Устройства» ZESP (порт static/apps/dboard.app на WinEngine).
// Оригиналы static/KWS/socket.js, static/KWS/widgets.js НЕ трогаем:
// - deviceList / eventE / widgetReport — из socket.js;
// - getWidget / widgetEvt / getIconSvg / getDeviceClass / renderDeviceTypeIcon /
//   DEVICE_TYPES_MAP / hsl / hsl2Hex — из widgets.js (подключён в lite.html как есть).
// window.get_tile переопределяем, как это делал dboard.app, чтобы socket.js
// (widgetReport) продолжал обновлять плитки в списке.

(function () {
  var DEVICE_CSS = `
.win-devices{display:flex;flex-direction:column;height:100%;min-height:0;position:relative;overflow:hidden}
.win-devices .db-search-bar{display:none;align-items:center;gap:6px;background:var(--bg3);padding:4px 8px;height:44px;box-sizing:border-box;position:absolute;top:0;left:0;right:0;z-index:10;border-bottom:1px solid var(--border)}
.win-devices .db-search-bar input{flex:1;background:var(--bg);border:1px solid var(--border2);border-radius:20px;color:var(--text);padding:6px 12px;font-size:14px;outline:none}
.win-devices .db-search-close{color:var(--faint);font-size:20px;cursor:pointer;padding:4px 8px}
.win-devices .location-list{font-weight:600;display:flex;overflow-x:auto;scrollbar-width:none;-ms-overflow-style:none;background:linear-gradient(180deg,var(--bg3),var(--bg2));border-bottom:1px solid var(--border);color:var(--text);align-items:center;height:48px;padding:6px 8px;box-sizing:border-box;gap:6px;user-select:none;scroll-behavior:smooth;position:relative;width:100%;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.25)}
.win-devices .location-list::-webkit-scrollbar{display:none}
.win-devices .location-list div{padding:7px 16px;cursor:pointer;white-space:nowrap;min-height:32px;min-width:35px;display:flex;align-items:center;justify-content:center;border-radius:14px;transition:background .18s,color .18s,box-shadow .18s,border-color .18s,transform .1s;font-size:13px;position:relative;flex-shrink:0;border:1px solid transparent;background:var(--bg2);box-shadow:0 1px 3px rgba(0,0,0,.22);color:var(--muted)}
.win-devices .location-list div:hover{color:var(--text);border-color:var(--border2);background:var(--hover)}
.win-devices .location-list div:active{transform:scale(.94)}
.win-devices .location-list div.active{background:linear-gradient(180deg,var(--accent),var(--accent-dark));color:#fff;border-color:var(--accent);font-weight:700;box-shadow:0 2px 8px rgba(59,130,246,.45),inset 0 1px 0 rgba(255,255,255,.18)}
.win-devices .device-grid{display:flex;flex-direction:column;background:var(--bg);gap:8px;padding:8px;overflow-y:auto;overflow-x:hidden;flex:1;min-height:0;box-sizing:border-box}
.win-devices .device-grid::-webkit-scrollbar{width:4px}
.win-devices .device-grid::-webkit-scrollbar-thumb{background:var(--scrollbar);border-radius:2px}
.win-devices .db-empty{text-align:center;color:var(--faint);padding:40px 20px;font-size:14px}
.win-devices .room-group{margin-bottom:12px}
.win-devices .room-header{background:linear-gradient(90deg,var(--bg3),var(--bg2));border-left:3px solid var(--accent);color:var(--text);padding:0 8px;border-radius:10px;margin-bottom:2px;font-size:13px;font-weight:700;letter-spacing:.03em;height:18px;display:flex;align-items:center;justify-content:space-between;box-shadow:0 2px 6px rgba(0,0,0,.28);border:1px solid var(--border);border-left-width:3px}
.win-devices .room-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.win-devices .room-count{background:var(--bg);color:var(--accent);font-size:11px;font-weight:700;padding:2px 9px;border-radius:12px;flex-shrink:0;margin-left:8px;border:1px solid var(--border2);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
.win-devices .devices-container{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;grid-auto-rows:min-content}
.win-devices .device{background:var(--bg2);border:2px solid var(--border2);border-radius:14px;cursor:pointer;padding:8px;box-shadow:0 4px 16px rgba(0,0,0,.6);min-height:140px;display:flex;flex-direction:column;gap:5px;transition:transform .12s,box-shadow .14s,border-color .14s;-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;color:var(--text)}
.win-devices .device:active{transform:scale(.96);box-shadow:0 2px 6px rgba(0,0,0,.4)}
.win-devices .device:hover:not(:active){border-color:var(--border2);box-shadow:0 6px 22px rgba(0,0,0,.65)}
.win-devices .device-offline .tile-lastseen{color:var(--red) !important}
.win-devices .tile-header{display:flex;align-items:flex-start;gap:7px}
.win-devices .tile-icon-wrap{width:40px;height:40px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--bg3);border:1px solid var(--border2);transition:opacity .2s}
.win-devices .tile-nm-wrap{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.win-devices .device-nm{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text);line-height:1.2}
.win-devices .device-type-label{font-size:9px;color:var(--faint);text-transform:uppercase;letter-spacing:.06em;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.win-devices .qt-btn{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:background .15s,box-shadow .15s,transform .1s;-webkit-tap-highlight-color:transparent;border:1px solid rgba(255,255,255,.08)}
.win-devices .qt-btn:active{transform:scale(.86)}
.win-devices .qt-on{background:rgba(76,175,80,.18);color:#69f0ae;box-shadow:0 0 8px rgba(105,240,174,.3);border-color:rgba(105,240,174,.3)}
.win-devices .qt-off{background:rgba(255,255,255,.04);color:var(--faint);border-color:var(--border2)}
.win-devices .qt-placeholder{width:30px;flex-shrink:0}
.win-devices .tile-divider{height:1px;background:var(--border);margin:0 -2px}
.win-devices .device-details{display:flex;flex-direction:column;gap:3px;flex-grow:1}
.win-devices .report-item{display:flex;justify-content:space-between;align-items:center}
.win-devices .report-item .label{display:flex;align-items:center;gap:4px;font-size:12px;font-weight:500;color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:58%}
.win-devices .report-item .parsed{font-size:13px;font-weight:700;color:var(--text);white-space:nowrap;max-width:42%;overflow:hidden;text-overflow:ellipsis;text-align:right}
.win-devices .unit{font-size:10px;color:var(--text);margin-left:2px;font-weight:600}
.win-devices .tile-more{font-size:10px;color:var(--faint);text-align:right;font-weight:600}
.win-devices .tile-footer{display:flex;justify-content:space-between;align-items:center;font-size:10px;padding-top:4px;border-top:1px solid var(--border);margin-top:auto}
.win-devices .tile-location{color:var(--faint);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.win-devices .tile-lastseen{font-weight:700;flex-shrink:0;margin-left:4px}
.win-devices #dboard_overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:2147483002;backdrop-filter:blur(2px)}
.win-devices .DeviceWidget{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(1);background:var(--bg2);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,.45);z-index:2147483003;visibility:hidden;opacity:1;transition:opacity .2s,transform .2s;max-width:95vw;max-height:90vh;overflow-y:auto;box-sizing:border-box;color:var(--text)}
.win-devices .DeviceWidget.widget-open{opacity:1;transform:translate(-50%,-50%) scale(1)}
@media (max-width:480px){.win-devices .DeviceWidget{width:96vw;top:50%}}
@media (max-width:360px){.win-devices .devices-container{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}.win-devices .device{padding:6px;margin:0}}
@media (min-width:600px){.win-devices .devices-container{grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}}
  `;

  // ── Поиск (перенесено из dboard.app) ───────────────────────────────────────
  function openSearch() {
    var bar = document.getElementById('db_search_bar');
    if (bar) { bar.style.display = 'flex'; var i = bar.querySelector('input'); if (i) i.focus(); }
  }
  function closeSearch() {
    var bar = document.getElementById('db_search_bar');
    if (bar) { bar.style.display = 'none'; var i = bar.querySelector('input'); if (i) i.value = ''; }
    displayDevicesByLocation(currentLocation);
  }
  function filterSearch(val) {
    var q = String(val || '').trim().toLowerCase();
    var grid = document.getElementById('deviceGrid');
    if (!grid) return;
    if (!q) { displayDevicesByLocation(currentLocation); return; }
    grid.innerHTML = '';
    grid.style.opacity = '0';
    var matched = deviceList.filter(function (d) {
      return (d.Name || '').toLowerCase().includes(q) || (d.Location || '').toLowerCase().includes(q);
    });
    if (!matched.length) { grid.innerHTML = '<div class="db-empty">Ничего не найдено</div>'; }
    else {
      var c = document.createElement('div');
      c.className = 'devices-container';
      matched.forEach(function (d) { c.appendChild(get_tile(d)); });
      grid.appendChild(c);
    }
    requestAnimationFrame(function () { grid.style.opacity = '1'; });
  }

  // ── Рендер списка (перенос dboard.app renderDevices/display/loca) ─────────
  var currentLocation = 'Все';
  var locations = ['Все'];

  function updateSelectedLocation(location) {
    document.querySelectorAll('.location-list div').forEach(function (item) {
      item.classList.toggle('active', item.innerText === location);
      if (item.classList.contains('active')) scrollIntoView(item);
    });
  }

  function scrollIntoView(element) {
    var list = document.querySelector('.location-list');
    if (!list) return;
    var scrollLeft = element.offsetLeft - (list.offsetWidth - element.offsetWidth) / 2;
    list.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }

  function groupDevicesByRoom(devices) {
    var grouped = {};
    devices.forEach(function (device) {
      var room = device.Location || 'Без комнаты';
      if (!grouped[room]) grouped[room] = [];
      grouped[room].push(device);
    });
    return grouped;
  }

  function renderDevices(location) {
    var grid = document.getElementById('deviceGrid');
    if (!grid) return;
    grid.innerHTML = '';
    var filtered = location === 'Все' ? deviceList : deviceList.filter(function (d) { return d.Location === location; });
    var grouped = groupDevicesByRoom(filtered);
    if (!Object.keys(grouped).length) { grid.innerHTML = '<div class="db-empty">Нет устройств</div>'; return; }
    Object.keys(grouped).forEach(function (roomName) {
      var rg = document.createElement('div');
      rg.className = 'room-group';
      rg.setAttribute('data-room', roomName);
      var hb = document.createElement('div');
      hb.className = 'room-header';
      hb.innerHTML = '<span class="room-name">📍 ' + roomName + '</span><span class="room-count">' + grouped[roomName].length + '</span>';
      var dc = document.createElement('div');
      dc.className = 'devices-container';
      grouped[roomName].forEach(function (device) { dc.appendChild(get_tile(device)); });
      rg.appendChild(hb); rg.appendChild(dc);
      grid.appendChild(rg);
    });
  }

  function displayDevicesByLocation(location, dir) {
    var grid = document.getElementById('deviceGrid');
    if (!grid) return;
    currentLocation = location;
    updateSelectedLocation(location);
    if (dir === undefined) {
      grid.style.transition = 'opacity 0.18s ease';
      grid.style.opacity = '0';
      requestAnimationFrame(function () {
        renderDevices(location);
        requestAnimationFrame(function () { grid.style.opacity = '1'; });
      });
      return;
    }
    var w = grid.offsetWidth || 1;
    grid.style.transition = 'transform .16s cubic-bezier(0.4,0,1,1), opacity .16s ease-in';
    grid.style.transform = 'translateX(' + (-dir * w * 0.3) + 'px)';
    grid.style.opacity = '0';
    setTimeout(function () {
      grid.style.transition = 'none';
      grid.style.transform = 'translateX(' + (dir * w * 0.3) + 'px)';
      renderDevices(location);
      requestAnimationFrame(function () {
        grid.style.transition = 'transform .3s cubic-bezier(0,0,0.2,1), opacity .3s ease-out';
        grid.style.transform = 'translateX(0)';
        grid.style.opacity = '1';
      });
    }, 160);
  }

  // ── Обновление lastSeen ──────────────────────────────────────────────
  function timeInterval(interval) {
    if (interval < 0 || isNaN(interval)) return '—';
    if (interval >= 86400) return Math.floor(interval / 86400) + 'д';
    if (interval >= 3600)  return Math.floor(interval / 3600) + 'ч';
    if (interval >= 60)    return Math.floor(interval / 60) + 'мин';
    if (interval >= 5)     return Math.floor(interval / 5) * 5 + 'с';
    return 'сейчас';
  }

  function updateLastSeen() {
    deviceList.forEach(function (device) {
      if (!device.lastSeen) return;
      var timeDiff = Math.floor((Date.now() - device.lastSeen) / 1000);
      var cls = CSS.escape(device.IEEE + 'lastSeen');
      document.querySelectorAll('.' + cls).forEach(function (ea) {
        ea.innerHTML = timeInterval(timeDiff);
        ea.style.color = timeDiff > 3600 ? 'var(--red)' : timeDiff > 300 ? 'var(--yellow)' : 'var(--green)';
      });
    });
  }

  // ── Swipe / keydown (перс dboard.app) ─────────────────────────────────
  var swipeHandlers = {};

  function handleSwipe() {
    removeSwipe(); // не дублировать обработчики при повторных alldev
    var xStart = null, yStart = null, swipeAxis = null, swipeLocked = false;
    var sl = document.getElementById('deviceGrid');
    if (!sl) return;
    var SWIPE_THRESHOLD = function () { return Math.max(60, window.innerWidth * 0.30); };
    swipeHandlers.touchStart = function (e) {
      if (e.touches.length !== 1) return;
      xStart = e.touches[0].clientX; yStart = e.touches[0].clientY;
      swipeAxis = null; swipeLocked = false;
    };
    swipeHandlers.touchMove = function (e) {
      if (xStart === null || swipeLocked) return;
      var dx = Math.abs(e.touches[0].clientX - xStart);
      var dy = Math.abs(e.touches[0].clientY - yStart);
      if (dx < 10 && dy < 10) return;
      swipeAxis = dx > dy ? 'h' : 'v';
      swipeLocked = true;
      if (swipeAxis === 'h') e.preventDefault();
    };
    swipeHandlers.touchEnd = function (e) {
      if (xStart === null) return;
      var widget = document.getElementById('DeviceWidget');
      if (widget && widget.style.visibility === 'visible') { xStart = null; return; }
      var xEnd = e.changedTouches[0].clientX;
      var yEnd = e.changedTouches[0].clientY;
      var xDiff = xStart - xEnd;
      var yDiff = Math.abs(yStart - yEnd);
      xStart = null; yStart = null;
      if (swipeAxis === 'h' && Math.abs(xDiff) > SWIPE_THRESHOLD() && yDiff < 80) {
        var curIdx = locations.indexOf(currentLocation);
        var offset = xDiff > 0 ? 1 : -1;
        var newIdx = (curIdx + offset + locations.length) % locations.length;
        displayDevicesByLocation(locations[newIdx], offset);
      }
    };
    sl.addEventListener('touchstart', swipeHandlers.touchStart, { passive: true });
    sl.addEventListener('touchmove',  swipeHandlers.touchMove,  { passive: false });
    sl.addEventListener('touchend',   swipeHandlers.touchEnd,   { passive: true });
  }

  function removeSwipe() {
    var sl = document.getElementById('deviceGrid');
    if (sl && swipeHandlers.touchStart) {
      sl.removeEventListener('touchstart', swipeHandlers.touchStart);
      sl.removeEventListener('touchmove',  swipeHandlers.touchMove);
      sl.removeEventListener('touchend',   swipeHandlers.touchEnd);
    }
    if (swipeHandlers._keydown) document.removeEventListener('keydown', swipeHandlers._keydown);
    swipeHandlers = {};
  }

  // ── Виджет устройства (клик по плитке) ───────────────────────────────
  function showWidget(IEEE, e) {
    if (e) e.preventDefault();
    var widget = document.getElementById('DeviceWidget');
    var overlay = document.getElementById('dboard_overlay');
    if (!widget) return;
    widget.innerHTML = getWidget(IEEE);
    widget.style.visibility = 'visible';
    widget.classList.add('widget-open');
    if (overlay) overlay.style.display = 'block';
  }

  function hideWidget() {
    var widget = document.getElementById('DeviceWidget');
    var overlay = document.getElementById('dboard_overlay');
    if (widget) {
      widget.classList.remove('widget-open');
      widget.style.opacity = '0';
      widget.style.transform = 'translate(-50%,-50%) scale(0.93)';
      setTimeout(function () {
        widget.style.visibility = 'hidden';
        widget.style.opacity = '';
        widget.style.transform = '';
      }, 200);
    }
    if (overlay) overlay.style.display = 'none';
  }

  function item_sel(IEEE, event) {
    if (event) { event.stopPropagation(); event.preventDefault(); }
    showWidget(IEEE, event);
  }

  // inline-обработчики в get_tile / template не видят замыкание — экспортируем.
  window.item_sel = item_sel;
  window.quickToggle = quickToggle;
  window.filterSearch = filterSearch;
  window.closeSearch = closeSearch;
  window.displayDevicesByLocation = displayDevicesByLocation;
  window.openSearch = openSearch;
  window.hideWidget = hideWidget;

  // ── Быстрый toggle ───────────────────────────────────────────────────
  var QUICK_TOGGLE_ROLES = ['switch', 'light'];
  var doubleReset = 0;

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

  function quickToggle(event, IEEE, attrKey) {
    event.stopPropagation();
    var dev = deviceList.filter(function (d) { return d.IEEE === IEEE; })[0];
    if (!dev) return;
    var rep = dev.Report && dev.Report[attrKey];
    if (!rep) return;
    var isOn = [1, '1', true, 'on', 'ON', 'true', 'ON'].indexOf(rep.parsed) !== -1;
    var id = IEEE + '#' + attrKey;
    widgetEvnt('on_off|' + id, isOn ? 0 : 1);
    var btn = event.currentTarget;
    btn.classList.toggle('qt-on', !isOn);
    btn.classList.toggle('qt-off', isOn);
  }

  // ── get_tile — глобально, как в dboard.app (cокет widgetReport его зовёт) ─
  window.get_tile = function (device) {
    try {
      var tile = document.createElement('div');
      tile.className = 'device';
      tile.id = device.IEEE;

      var secAgo = device.lastSeen ? Math.floor((Date.now() - device.lastSeen) / 1000) : -1;
      var isOffline = secAgo > 900;
      var hasLastSeen = secAgo >= 0;
      if (isOffline) tile.classList.add('device-offline');

      var quickToggleKey = null, quickToggleIsOn = false;
      if (device.Report) {
        for (var key in device.Report) {
          var rep = device.Report[key];
          var role = getRoleInfo(rep).roleBase;
          if (QUICK_TOGGLE_ROLES.indexOf(role) !== -1 && (rep.label === 'On_Off' || role === 'switch')) {
            quickToggleKey = key;
            quickToggleIsOn = [1, '1', true, 'on', 'ON', 'true', 'ON'].indexOf(rep.parsed) !== -1;
            break;
          }
        }
      }

      tile.setAttribute('onclick', 'item_sel(this.id, event)');
      tile.style.touchAction = 'manipulation';

      var d_type = device.type || 'devices.types.other';

      var qtHtml = quickToggleKey
        ? '<div class="qt-btn ' + (quickToggleIsOn ? 'qt-on' : 'qt-off') + '" onclick="quickToggle(event,\'' + device.IEEE + '\',\'' + quickToggleKey + '\')" title="' + (quickToggleIsOn ? 'Выключить' : 'Включить') + '">' +
          '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8H7c-1.66 0-3-1.34-3-3s1.34-3 3-3h10c1.66 0 3 1.34 3 3s-1.34 3-3 3z"/>' +
          (quickToggleIsOn ? '<circle fill="currentColor" cx="17" cy="12" r="2.5"/>' : '<circle fill="currentColor" cx="7" cy="12" r="2.5"/>') +
          '</svg></div>'
        : '<div class="qt-btn qt-placeholder"></div>';

      var detailsHtml = '', hiddenCount = 0;
      if (device.Report) {
        var keys = Object.keys(device.Report);
        var shown = 0;
        for (var i = 0; i < keys.length; i++) {
          var k = keys[i];
          var reportItem = device.Report[k];
          var roleInfo = getRoleInfo(reportItem);
          var type = roleInfo.roleBase;
          var attr = roleInfo.classObj;
          var pid = device.IEEE + '#' + k;
          var parsedValue = typeof reportItem.parsed === 'boolean' ? (reportItem.parsed ? 1 : 0) : reportItem.parsed;
          var unit = (attr && attr.unit_of_measurement) ? attr.unit_of_measurement : '';
          var devClass = getDeviceClass(device.Report[k]);
          if (!String(d_type).includes('smart_speaker') ||
              (String(d_type).includes('smart_speaker') && ['playing','volume','state','track','tts'].indexOf(String(reportItem.label).toLowerCase()) !== -1)) {
            if (shown < 3) {
              var state = parseInt(reportItem.parsed);
              detailsHtml += '<div class="report-item"><div class="label"><span class="ico">' + getIconSvg(devClass, 16, '#0dcaf0', state) + '</span>' + reportItem.label + '</div>' +
                '<div class="parsed"><span class="' + pid + '">' + (parsedValue !== undefined && parsedValue !== null ? parsedValue : '—') + '</span><span class="unit">' + unit + '</span></div></div>';
              shown++;
            } else { hiddenCount++; }
          }
        }
      }

      var moreHtml = hiddenCount > 0 ? '<div class="tile-more">+' + hiddenCount + ' ещё</div>' : '';
      var lastColor = !hasLastSeen ? 'var(--faint)' : secAgo > 3600 ? 'var(--red)' : secAgo > 300 ? 'var(--yellow)' : 'var(--green)';
      var lastText = !hasLastSeen ? '—' : timeInterval(secAgo);
      var lastHtml = '<div class="tile-footer"><span class="tile-location">' + (device.Location || '') + '</span>' +
        '<span class="' + device.IEEE + 'lastSeen tile-lastseen" style="color:' + lastColor + '">' + lastText + '</span></div>';

      tile.innerHTML =
        '<div class="tile-header">' +
          '<div class="tile-icon-wrap ' + (isOffline ? 'tile-icon-offline' : '') + '" id="ti_' + device.IEEE + '"></div>' +
          '<div class="tile-nm-wrap"><div class="device-nm">' + device.Name + '</div>' +
          '<div class="device-type-label">' + String(d_type).replace('devices.types.', '').replace(/\./g, ' › ') + '</div></div>' +
          qtHtml +
        '</div>' +
        '<div class="tile-divider"></div>' +
        '<div class="device-details">' + detailsHtml + moreHtml + '</div>' +
        lastHtml;

      var ic = tile.querySelector('#ti_' + device.IEEE);
      if (ic && typeof renderDeviceTypeIcon === 'function') {
        var svg = renderDeviceTypeIcon(d_type, 42, '#0dcaf0') ||
                  renderDeviceTypeIcon('devices.types.smart_speaker', 42, '#0dcaf0') ||
                  renderDeviceTypeIcon('devices.types.other', 42, '#0dcaf0');
        if (svg) ic.appendChild(svg);
      }
      return tile;
    } catch (e) { console.log('get_tile err:', e); }
  };

  // ── Регистрация виджета ────────────────────────────────────────────────
  window.WinEngine.register({
    id: 'devices',
    title: 'Устройства',
    label: 'Устройства',
    icon: '<img src="/static/icons/APP.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="40" data-y="20" data-w="640" data-h="480">' +
      '<style>' + DEVICE_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Устройства</span>' +
      '<div class="c-tools"><button class="cbtn" data-action="search" title="Поиск">🔍</button></div>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden"><div class="win-devices">' +
      '<div class="db-search-bar" id="db_search_bar">' +
      '<input type="search" placeholder="Поиск устройства..." oninput="filterSearch(this.value)" autocomplete="off">' +
      '<span class="db-search-close" onclick="closeSearch()">✕</span></div>' +
      '<div class="location-list" id="locationList"></div>' +
      '<div class="device-grid" id="deviceGrid"></div>' +
      '<div id="dboard_overlay"></div>' +
      '<div class="DeviceWidget" id="DeviceWidget"></div>' +
      '</div></div></div>',

    setup(node) {
      removeSwipe();
      node._state = { updateTimer: null, onDev: null, keydown: null };

      // Рендер при обновлении deviceList (alldev) и при ручном обновлении.
      node._state.onDev = function () {
        var grid = document.getElementById('deviceGrid');
        if (!grid) return;
        locations = ['Все'].concat(Array.from(new Set(deviceList.map(function (d) { return d.Location; }))).filter(Boolean));
        var list = document.querySelector('.location-list');
        if (list) {
          list.innerHTML = locations.map(function (l) { return '<div>' + l + '</div>'; }).join('');
          // клик/pointer по локации
          list.querySelectorAll('div').forEach(function (div) {
            div.addEventListener('click', function () {
              var sel = div.innerText;
              displayDevicesByLocation(sel);
            });
          });
        }
        handleSwipe();
        displayDevicesByLocation(currentLocation || 'Все');
      };
      if (window.eventE) window.eventE.on('updateDeviceList', node._state.onDev);

      // Запрос изнач. данных и обновление lastSeen по таймеру.
      if (window.websocket && websocket.readyState === 1) window.WSsend('getDeviceList');
      handleSwipe();

      node._state.keydown = function (e) {
        if (e.key === 'Escape') hideWidget();
        var widget = document.getElementById('DeviceWidget');
        if (widget && widget.style.visibility === 'visible') return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var idx = locations.indexOf(currentLocation);
          var off = e.key === 'ArrowRight' ? 1 : -1;
          var ni = (idx + off + locations.length) % locations.length;
          displayDevicesByLocation(locations[ni], off);
        }
      };
      document.addEventListener('keydown', node._state.keydown);

      node.addEventListener('click', function (e) {
        var b = e.target.closest('[data-action]');
        if (b && b.dataset.action === 'search') { openSearch(); }
      });
      // Клик по оверлею закрывает виджет (JS-делегирование, без inline onclick в dboard).
      node.querySelector('#dboard_overlay').addEventListener('click', hideWidget);
      // Клик по плитке / кнопке toggle делегируется глобальным функциям (inline onclick в get_tile).

      // Если данные уже пришли — отрисовать сразу.
      if (deviceList.length) node._state.onDev();

      node._state.updateTimer = setInterval(updateLastSeen, 5000);
    },

    activate(node) {
      var grid = document.getElementById('deviceGrid');
      if (grid && !grid.childElementCount && deviceList.length) {
        locations = ['Все'].concat(Array.from(new Set(deviceList.map(function (d) { return d.Location; }))).filter(Boolean));
        var list = document.querySelector('.location-list');
        if (list) list.innerHTML = locations.map(function (l) { return '<div>' + l + '</div>'; }).join('');
        displayDevicesByLocation(currentLocation || 'Все');
      }
    },

    destroy(node) {
      if (node._state) {
        if (node._state.updateTimer) clearInterval(node._state.updateTimer);
        if (window.eventE && node._state.onDev) eventE.off('updateDeviceList', node._state.onDev);
        if (node._state.keydown) document.removeEventListener('keydown', node._state.keydown);
      }
      removeSwipe();
      hideWidget();
      // Чистим DOM, чтобы socket widgetReport не находил висящие элементы.
      ['deviceGrid', 'locationList', 'DeviceWidget', 'dboard_overlay'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
      node._state = null;
    }
  });

})();