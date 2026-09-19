// yammanager.js — виджет «YAM Manager» (порт static/apps/YAMmanager.app на WinEngine).
// Управление Яндекс.Станциями + аудиостриминг.
// Зависимости: socket.js (WSsend/eventE), zesp-globals.js.
// $ — локальный хелпер по id (в lite нет jQuery).

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── состояние ──
  var pollTimer = null;
  var selectedDevice = null;
  var speakerData = {};

  // ── WS-реакции ──
  function onWS(data, evtName) {
    var st = function (html) { var e = $('yam_status'); if (e) e.innerHTML = html; };
    if (evtName === 'speakerList') {
      renderList(data);
    } else if (evtName === 'speakerDiscover') {
      if (data.error) st('<span style="color:#ef5350;">❌ ' + data.error + '</span>');
      else if (Array.isArray(data)) { st('<span style="color:#66bb6a;">mDNS найдено: ' + data.length + '</span>'); setTimeout(loadList, 500); }
      else { st('<span style="color:#66bb6a;">Поиск завершён</span>'); setTimeout(loadList, 500); }
    } else if (evtName === 'speakerCloudLoad') {
      if (data.error) {
        st('<span style="color:#ef5350;">❌ ' + data.error + '</span>');
        if (data.list) renderList(data.list);
      } else if (Array.isArray(data)) { renderList(data); st('<span style="color:#66bb6a;">Найдено: ' + data.length + '</span>'); }
      else { renderList([data]); st('<span style="color:#66bb6a;">OK</span>'); }
    } else if (evtName === 'speakerConnect' || evtName === 'speakerDisconnect' || evtName === 'speakerRemove') {
      if (data.error) st('<span style="color:#ef5350;">❌ ' + data.error + '</span>');
      else { st('<span style="color:#66bb6a;">OK</span>'); loadList(); }
    } else if (evtName === 'speakerState') {
      if (data.device_id && data.device_id === selectedDevice) updateNowPlaying(data);
    } else if (evtName === 'playStream' || evtName === 'playURL') {
      if (data.error) st('<span style="color:#ef5350;">❌ ' + data.error + '</span>');
      else st('<span style="color:#66bb6a;">Воспроизведение запущено</span>');
    }
  }

  // ── список / layout ──
  function updateLayout() {
    var ml = $('yam_main_layout');
    if (!ml) return;
    ml.classList.toggle('wide', ml.offsetWidth > 550);
  }
  function updateToggleLabel() {
    var btn = $('yam_toggle_btn');
    if (!btn) return;
    var ml = $('yam_main_layout');
    var el = $('yam_list');
    var narrow = ml ? ml.offsetWidth <= 550 : true;
    btn.style.display = narrow ? '' : 'none';
    if (!narrow && el) el.classList.remove('visible');
    var isVisible = el && narrow && el.classList.contains('visible');
    btn.textContent = isVisible ? '✕ Скрыть список' : '📋 Колонки';
  }
  function loadList() { window.WSsend('speakerList'); }
  function toggleList() {
    var el = $('yam_list');
    if (!el) return;
    el.classList.toggle('visible');
    updateToggleLabel();
  }

  function renderList(speakers) {
    var listEl = $('yam_list');
    if (!listEl) { setTimeout(function () { renderList(speakers); }, 100); return; }
    if (!speakers || !speakers.length) {
      listEl.innerHTML = '<div class="empty">Нет колонок. Загрузите из облака или найдите через mDNS.</div>';
      return;
    }
    var html = '<div class="speaker-grid">';
    speakerData = {};
    speakers.forEach(function (sp) {
      speakerData[sp.device_id] = sp.state || {};
      var isConnected = sp.connected === true;
      var state = sp.state || {};
      var vol = state.volume !== undefined ? Math.round(state.volume * 100) : '—';
      var track = '', artist = '';
      if (state.playerState) { track = state.playerState.title || ''; artist = state.playerState.subtitle || ''; }
      var playing = state.playing ? '▶' : '⏸';
      var ipStr = sp.ip || '';
      var color = isConnected ? '#66bb6a' : '#ef5350';
      var statusText = isConnected ? 'Подключена' : 'Нет связи';
      var selClass = selectedDevice === sp.device_id ? ' selected' : '';

      html += '<div class="speaker-card' + selClass + '" onclick="yamSelect(\'' + sp.device_id + '\')">';
      html += '<button class="card-close" onclick="event.stopPropagation();yamConfirmRemove(\'' + sp.device_id + '\',\'' + escapeHtml(sp.name || sp.device_id) + '\')">✕</button>';
      html += '<div class="sp-header"><span class="sp-name">' + escapeHtml(sp.name || sp.device_id) + '</span>';
      html += '<span class="sp-status" style="color:' + color + '">● ' + statusText + '</span></div>';
      html += '<div class="sp-info"><span>📍 ' + escapeHtml(sp.location || '—') + '</span>';
      html += (sp.platform ? '<span> (' + sp.platform + ')</span>' : '');
      html += '<span>🔊 ' + vol + '%</span></div>';
      html += '<div class="sp-nowplaying"><span class="np-icon">' + playing + '</span>';
      html += '<span class="np-track">' + escapeHtml(track || '—') + '</span>';
      if (artist) html += '<span class="np-artist">' + escapeHtml(artist) + '</span>';
      html += '</div>';
      html += '<div class="sp-ip-row"><span style="color:#7a86a8;">🌐 IP:</span>';
      html += '<input class="ip-input" id="yam_ip_' + sp.device_id + '" value="' + escapeHtml(ipStr) + '" placeholder="192.168.1.x" style="flex:1;min-width:0;padding:2px 6px;border-radius:4px;border:1px solid #444;background:#222;color:#fff;font-size:11px;" onclick="event.stopPropagation();">';
      html += '<button onclick="event.stopPropagation();yamSaveIP(\'' + sp.device_id + '\')" style="padding:2px 8px;font-size:10px;">💾</button>';
      html += '</div></div>';
    });
    html += '</div>';
    $('yam_list').innerHTML = html;
  }

  // ── выбор / плоллинг ──
  function selectDevice(deviceID) {
    selectedDevice = deviceID;
    var ml = $('yam_main_layout');
    if (ml && ml.offsetWidth <= 550) {
      var listEl = $('yam_list');
      if (listEl) listEl.classList.remove('visible');
      updateToggleLabel();
      ml.scrollTop = 0;
    }
    var card = document.querySelector('.speaker-card[onclick*="' + deviceID + '"]');
    var name = deviceID;
    if (card) {
      var nameEl = card.querySelector('.sp-name');
      if (nameEl) name = nameEl.textContent;
    }
    $('yam_sel_device').textContent = name;
    var raw = speakerData[deviceID];
    if (raw) {
      var player = raw.playerState || {};
      updateNowPlaying({
        device_id: deviceID,
        playing: raw.playing,
        volume: raw.volume || 0.5,
        track: player.title || '',
        artist: player.subtitle || '',
        progress: player.progress || 0,
        duration: player.duration || 0
      });
    }
    startPolling(deviceID);
    var cards = document.querySelectorAll('.speaker-card');
    cards.forEach(function (c) { c.classList.remove('selected'); });
    if (card) card.classList.add('selected');
  }
  function startPolling(deviceID) {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(function () { WSsend('speakerState|' + deviceID); }, 2000);
    window.WSsend('speakerState|' + deviceID);
  }

  function updateNowPlaying(state) {
    if (!state) return;
    var track = state.title || state.track || '';
    var artist = state.subtitle || state.artist || '';
    var playing = state.playing ? '▶ Играет' : '⏸ Пауза';
    var progress = state.progress || 0;
    var duration = state.duration || 0;
    var volume = state.volume !== undefined ? Math.round(state.volume * 100) : 50;

    var el;
    el = $('yam_np_track'); if (el) el.textContent = track || '—';
    el = $('yam_np_artist'); if (el) el.textContent = artist || '';
    el = $('yam_np_status'); if (el) el.textContent = playing;
    el = $('yam_np_current'); if (el) el.textContent = formatTime(progress);
    el = $('yam_np_total'); if (el) el.textContent = formatTime(duration);
    el = $('yam_np_progress_fill'); if (el) el.style.width = (duration > 0 ? (progress / duration * 100) : 0) + '%';
    el = $('yam_volume_slider'); if (el) el.value = volume;
    el = $('yam_volume_val'); if (el) el.textContent = volume + '%';
  }
  function formatTime(sec) {
    if (!sec || sec <= 0) return '0:00';
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function cmd(action, deviceID) { $('yam_status').innerHTML = '⏳ ' + action + ' ' + deviceID + '...'; window.WSsend(action + '|' + deviceID); }

  // ── команды (глобальные — из inline onclick) ──
  window.yamToggle = function () { toggleList(); };
  window.yamCloud = function () { $('yam_status').innerHTML = '⏳ Загрузка из облака...'; window.WSsend('speakerCloudLoad'); };
  window.yamDiscover = function () { $('yam_status').innerHTML = '⏳ Поиск колонок в сети...'; window.WSsend('speakerDiscover'); };
  window.yamRefresh = function () { loadList(); };

  window.yamSelect = function (deviceId) { selectDevice(deviceId); };
  window.yamSaveIP = function (deviceId) {
    var ip = document.getElementById('yam_ip_' + deviceId).value.trim();
    if (!ip) return;
    window.WSsend('speakerSetIP|' + deviceId + '|' + ip);
    $('yam_status').innerHTML = 'IP сохранён';
  };
  window.yamConfirmRemove = function (deviceId) { window.WSsend('speakerRemove|' + deviceId); };

  window.yamCmd = function (c) {
    if (!selectedDevice) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Выберите колонку</span>'; return; }
    window.WSsend('speakerConnect|' + selectedDevice);
    var ieee = 'YAM_' + selectedDevice;
    window.WSsend(JSON.stringify({ DEVICE_CMD: { cmd: c, obj: ieee + '#state', value: c } }));
    $('yam_status').innerHTML = '⏳ ' + c;
  };
  window.yamSetVolume = function (val) {
    if (!selectedDevice) return;
    $('yam_volume_val').textContent = val + '%';
    var ieee = 'YAM_' + selectedDevice;
    window.WSsend(JSON.stringify({ DEVICE_CMD: { cmd: 'volume', obj: ieee + '#volume', value: parseInt(val) } }));
  };
  window.yamUploadFile = function () {
    var fileInput = $('yam_file_input');
    if (!fileInput || !fileInput.files || !fileInput.files[0]) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Выберите файл</span>'; return; }
    if (!selectedDevice) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Выберите колонку</span>'; return; }
    var file = fileInput.files[0];
    $('yam_status').innerHTML = '⏳ Загрузка ' + file.name + ' (' + Math.round(file.size / 1024) + ' KB)...';
    var xhr = new XMLHttpRequest();
    var fd = new FormData();
    fd.append('file', file);
    xhr.open('POST', '/api/upload', true);
    xhr.onload = function () {
      if (xhr.status !== 200) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Ошибка загрузки: ' + xhr.status + '</span>'; return; }
      try {
        var data = JSON.parse(xhr.responseText);
        if (data.stream_id) { $('yam_status').innerHTML = '⏳ Воспроизведение...'; window.WSsend('playStream|' + selectedDevice + '|' + data.stream_id); }
        else $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Ошибка: нет stream_id</span>';
      } catch (e) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Ошибка: ' + e.message + '</span>'; }
    };
    xhr.onerror = function () { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Ошибка сети</span>'; };
    xhr.send(fd);
  };
  window.yamPlayURL = function () {
    var url = $('yam_url_input').value.trim();
    if (!url) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Введите URL</span>'; return; }
    if (!selectedDevice) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Выберите колонку</span>'; return; }
    $('yam_status').innerHTML = '⏳ Воспроизведение URL...';
    window.WSsend('playURL|' + selectedDevice + '|' + url);
  };
  window.yamSendTTS = function () {
    var text = $('yam_tts_input').value.trim();
    if (!text) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Введите текст</span>'; return; }
    if (!selectedDevice) { $('yam_status').innerHTML = '<span style="color:#ef5350;">❌ Выберите колонку</span>'; return; }
    var ieee = 'YAM_' + selectedDevice;
    window.WSsend(JSON.stringify({ DEVICE_CMD: { cmd: 'tts', obj: ieee + '#tts', value: text } }));
    $('yam_status').innerHTML = '🗣️ Озвучиваю...';
  };

  var YAM_CSS = '' +
    '.yam-toolbar{display:flex;gap:6px;padding:8px;background:#1a1d30;align-items:center;border-bottom:1px solid #2a2e4a;flex-wrap:wrap;}' +
    '.yam-toolbar button{padding:6px 14px;border:none;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;background:#2a2e4a;color:#c8cfe0;transition:background .15s;}' +
    '.yam-toolbar button:hover{background:#3d4470;}' +
    '.yam-toolbar button.primary{background:#1565c0;color:#fff;}' +
    '.yam-toolbar button.primary:hover{background:#1976d2;}' +
    '.yam-status{padding:4px 12px;font-size:12px;color:#90caf9;min-height:18px;background:#1a1d30;border-bottom:1px solid #2a2e4a;}' +
    '.main-layout{display:flex;flex-direction:column;width:100%;height:calc(100% - 82px);}' +
    '.speaker-grid{display:grid;grid-template-columns:1fr;gap:8px;padding:8px;}' +
    '.speaker-list{width:100%;flex:1;overflow-y:auto;box-sizing:border-box;background:#31333b;border-bottom:1px solid #2a2e4a;display:none;order:2;}' +
    '.speaker-list.visible{display:block;}' +
    '.main-layout:not(.wide) .speaker-list.visible ~ .player-panel{display:none;}' +
    '.player-panel{width:100%;overflow-y:auto;box-sizing:border-box;background:#0d0f1a;padding:12px;flex-shrink:0;order:1;}' +
    '.player-content{margin-inline:auto;border:1px solid #1e2240;border-radius:8px;padding:8px;}' +
    '.main-layout.wide{flex-direction:row;}' +
    '.main-layout.wide .speaker-list{width:auto;flex:0 0 50%;display:block;order:1;border-right:1px solid #2a2e4a;border-bottom:none;}' +
    '.main-layout.wide .player-panel{flex:1;display:flex;flex-direction:column;justify-content:center;align-items:center;order:2;}' +
    '.main-layout.wide .player-content{width:100%;max-width:500px;margin-inline:auto;}' +
    '.main-layout.wide .speaker-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));}' +
    '.speaker-list::-webkit-scrollbar,.player-panel::-webkit-scrollbar{width:4px;}' +
    '.speaker-list::-webkit-scrollbar-thumb,.player-panel::-webkit-scrollbar-thumb{background:#555;border-radius:2px;}' +
    '.empty{text-align:center;color:#4e587a;padding:60px 20px;font-size:15px;line-height:1.8;}' +
    '.speaker-card{background:#0d0f1a;border:1px solid #1e2240;border-radius:12px;padding:12px;display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:border-color .15s,box-shadow .15s;position:relative;}' +
    '.speaker-card:hover{border-color:#3d5afe66;box-shadow:0 4px 16px rgba(0,0,0,.4);}' +
    '.speaker-card.selected{border-color:#3d5afe;box-shadow:0 0 12px rgba(61,90,254,.3);}' +
    '.sp-header{display:flex;align-items:center;justify-content:space-between;gap:8px;}' +
    '.sp-name{color:#f0f2ff;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}' +
    '.sp-status{font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0;}' +
    '.sp-info{color:#7a86a8;font-size:11px;}' +
    '.sp-info span+span{margin-left:16px;}' +
    '.sp-nowplaying{display:flex;align-items:center;gap:6px;font-size:12px;background:#111320;border-radius:6px;padding:4px 8px;margin-top:2px;}' +
    '.sp-nowplaying .np-icon{flex-shrink:0;}' +
    '.sp-nowplaying .np-track{color:#e0e4ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.sp-nowplaying .np-artist{color:#7a86a8;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:40%;}' +
    '.sp-ip-row{display:flex;gap:4px;align-items:center;font-size:10px;color:#7a86a8;margin-top:4px;}' +
    '.card-close{position:absolute;top:8px;right:8px;width:28px;height:28px;border:none;border-radius:50%;background:rgba(239,83,80,.2);color:#ef5350;font-size:16px;line-height:1;cursor:pointer;opacity:0;transition:opacity .2s,background .2s;display:flex;align-items:center;justify-content:center;}' +
    '.speaker-card:hover .card-close{opacity:1;}' +
    '.card-close:hover{background:#ef5350;color:#fff;}' +
    '.panel-title{color:#90caf9;font-size:13px;font-weight:600;margin-bottom:8px;border-bottom:1px solid #1e2240;padding-bottom:4px;}' +
    '.selected-device{color:#f0f2ff;font-size:14px;font-weight:700;margin-bottom:12px;}' +
    '.np-section{background:#111320;border-radius:8px;padding:10px;margin-bottom:12px;}' +
    '.np-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;}' +
    '.np-label{color:#7a86a8;font-size:11px;width:50px;flex-shrink:0;}' +
    '.np-value{color:#e0e4ff;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}' +
    '.np-value.artist{color:#7a86a8;font-size:12px;font-weight:400;}' +
    '.progress-container{margin:8px 0;}' +
    '.progress-bar{width:100%;height:6px;background:#1e2240;border-radius:3px;overflow:hidden;}' +
    '.progress-fill{height:100%;background:linear-gradient(90deg,#3d5afe,#66bb6a);border-radius:3px;transition:width .3s;}' +
    '.progress-times{display:flex;justify-content:space-between;font-size:10px;color:#4e587a;margin-top:4px;}' +
    '.controls{display:flex;gap:10px;margin:12px 0;justify-content:center;flex-wrap:wrap;}' +
    '.controls button{width:48px;height:48px;border:none;border-radius:50%;cursor:pointer;font-size:20px;background:#1e2240;color:#c8cfe0;transition:all .15s;display:flex;align-items:center;justify-content:center;touch-action:manipulation;}' +
    '.controls button:hover{background:#3d4470;transform:scale(1.05);}' +
    '.controls button:active{transform:scale(.95);}' +
    '.controls button.primary{background:#1565c0;color:#fff;}' +
    '.volume-row{display:flex;align-items:center;gap:10px;margin:10px 0;}' +
    '.volume-row input[type=range]{flex:1;height:6px;-webkit-appearance:none;background:#1e2240;border-radius:3px;outline:none;}' +
    '.volume-row input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#3d5afe;cursor:pointer;}' +
    '.volume-row span{color:#7a86a8;font-size:13px;min-width:40px;text-align:right;}' +
    '.upload-section{background:#111320;border-radius:8px;padding:10px;margin-bottom:12px;}' +
    '.upload-section input[type=file]{width:100%;margin-bottom:6px;color:#c8cfe0;font-size:11px;}' +
    '.upload-section input[type=text]{width:100%;padding:6px 8px;border:none;border-radius:6px;background:#1e2240;color:#c8cfe0;font-size:12px;box-sizing:border-box;margin-bottom:6px;}' +
    '.upload-section button{width:100%;padding:6px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;background:#1565c0;color:#fff;}' +
    '.upload-section button:hover{background:#1976d2;}' +
    '.upload-section .or-divider{text-align:center;color:#4e587a;font-size:11px;margin:4px 0;}' +
    '.tts-section{display:flex;gap:8px;background:#111320;border-radius:8px;padding:10px;margin-bottom:12px;align-items:center;}' +
    '.tts-section input[type=text]{flex:1;padding:10px 12px;border:none;border-radius:6px;background:#1e2240;color:#c8cfe0;font-size:13px;box-sizing:border-box;}' +
    '.tts-section button{padding:10px 16px;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;background:#1565c0;color:#fff;}' +
    '.tts-section button:hover{background:#1976d2;}';

  // ── регистрация виджета ──
  window.WinEngine.register({
    id: 'yam',
    title: 'YAM Manager',
    label: 'YAM колонки',
    icon: '<img src="/static/icons/Ya.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="80" data-y="40" data-w="880" data-h="620">' +
      '<style>' + YAM_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">YAM Manager</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden;background:#111320">' +
      '<div class="yam-toolbar">' +
      '<button id="yam_toggle_btn" onclick="yamToggle()" class="primary" style="display:none;">📋 Колонки</button>' +
      '<button onclick="yamCloud()" class="primary">☁️ Из облака</button>' +
      '<button onclick="yamDiscover()">📡 mDNS поиск</button>' +
      '<button onclick="yamRefresh()" title="Обновить">🔄</button></div>' +
      '<div id="yam_status" class="yam-status">Готово</div>' +
      '<div id="yam_main_layout" class="main-layout" style="height:calc(100% - 72px);">' +
      '<div id="yam_list" class="speaker-list"></div>' +
      '<div class="player-panel"><div class="player-content">' +
      '<div class="panel-title">🎵 Плеер</div>' +
      '<div id="yam_sel_device" class="selected-device">—</div>' +
      '<div class="np-section">' +
      '<div class="np-row"><span class="np-label">Трек:</span><span id="yam_np_track" class="np-value">—</span></div>' +
      '<div class="np-row"><span class="np-label">Артист:</span><span id="yam_np_artist" class="np-value artist">—</span></div>' +
      '<div class="np-row"><span class="np-label">Статус:</span><span id="yam_np_status" class="np-value">—</span></div>' +
      '<div class="progress-container"><div class="progress-bar"><div id="yam_np_progress_fill" class="progress-fill" style="width:0%"></div></div>' +
      '<div class="progress-times"><span id="yam_np_current">0:00</span><span id="yam_np_total">0:00</span></div></div></div>' +
      '<div class="controls">' +
      '<button onclick="yamCmd(\'prev\')" title="Предыдущий">⏮</button>' +
      '<button onclick="yamCmd(\'play\')" class="primary" title="Play">▶</button>' +
      '<button onclick="yamCmd(\'stop\')" title="Стоп">⏹</button>' +
      '<button onclick="yamCmd(\'next\')" title="Следующий">⏭</button></div>' +
      '<div class="volume-row"><span>🔊</span>' +
      '<input type="range" id="yam_volume_slider" min="0" max="100" value="50" oninput="yamSetVolume(this.value)">' +
      '<span id="yam_volume_val">50%</span></div>' +
      '<div class="tts-section">' +
      '<input type="text" id="yam_tts_input" placeholder="Текст для озвучки..." style="flex:1;padding:8px 12px;border:none;border-radius:6px;background:#1e2240;color:#c8cfe0;font-size:13px;box-sizing:border-box;">' +
      '<button onclick="yamSendTTS()" style="padding:8px 16px;border:none;border-radius:6px;background:#1565c0;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">🗣️ Сказать</button></div>' +
      '<div class="upload-section">' +
      '<input type="file" id="yam_file_input" accept="audio/*">' +
      '<button onclick="yamUploadFile()">📤 Загрузить и играть</button>' +
      '<div class="or-divider">— или —</div>' +
      '<input type="text" id="yam_url_input" placeholder="https://example.com/audio.mp3">' +
      '<button onclick="yamPlayURL()">🔗 Играть по ссылке</button></div>' +
      '</div></div></div></div></div>',

    setup(node) {
      node._state = { ro: null };
      var handlers = {};
      var names = ['speakerList', 'speakerDiscover', 'speakerCloudLoad', 'speakerConnect', 'speakerDisconnect', 'speakerRemove', 'speakerSetIP', 'speakerState', 'playStream', 'playURL'];
      names.forEach(function (n) {
        handlers[n] = function (d) { onWS(d, n); };
        if (window.eventE) eventE.on(n, handlers[n]);
      });
      node._state.handlers = handlers;
      node._state.onResize = function () { updateLayout(); updateToggleLabel(); };
      if (window.ResizeObserver) {
        var ro = new ResizeObserver(node._state.onResize);
        var ml = $('yam_main_layout');
        if (ml) ro.observe(ml);
        node._state.ro = ro;
      }
      updateLayout();
      updateToggleLabel();
      loadList();
    },

    destroy(node) {
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
      selectedDevice = null;
      if (node._state) {
        if (window.eventE && node._state.handlers) {
          Object.keys(node._state.handlers).forEach(function (n) { eventE.off(n, node._state.handlers[n]); });
        }
        if (node._state.ro) node._state.ro.disconnect();
      }
      node._state = null;
      ['yam_list', 'yam_status', 'yam_main_layout', 'yam_file_input', 'yam_url_input'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });
})();