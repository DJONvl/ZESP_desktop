// sh3d.js — виджет «Home plan 3D» (порт static/apps/sh3d.app на WinEngine).
// 3D-просмотр плана Sweet Home 3D (./static/swh/my.sh3d).
// Зависимости: хостовые socket.js (deviceList/eventE/WSsend/SaveFile/getWidget),
// widgets.js (geticon), zesp-globals.js. SW3D-библиотеки (static/swh/lib/*)
// грузятся лениво при первом открытии окна.

(function () {
  'use strict';

  var S3D_LIBS = [
    'big.min.js', 'gl-matrix-min.js', 'jszip.min.js', 'core.min.js',
    'geom.min.js', 'batik-svgpathparser.min.js', 'jsXmlSaxParser.min.js',
    'triangulator.min.js', 'viewmodel.min.js', 'viewhome.min.js'
  ];

  var CANVAS_ID = 'sh3dCanvas';
  var DEV_WIDGET_ID = 'sh3dDevWidget';
  var LIST_ID = 'sh3dDeviceList';
  var PROGRESS_DIV_ID = 'sh3dProgressDiv';
  var PROGRESS_ID = 'sh3dProgress';
  var PROGRESS_LABEL_ID = 'sh3dProgressLabel';
  var VIEWER_DIV_ID = 'sh3dViewerDiv';
  var VIEWER_LABEL_ID = 'sh3dViewerLabel';
  var FILE_INPUT_ID = 'sh3dFileInput';

  // ── ленивая загрузка SW3D-библиотек (последовательно, как в index.html) ──
  var libsLoaded = false;
  var libsLoading = false;
  var pendingOnLoad = [];

  function loadS3DLibs(onDone) {
    if (libsLoaded) { onDone(); return; }
    if (libsLoading) { pendingOnLoad.push(onDone); return; }
    libsLoading = true;
    var i = 0;
    (function next() {
      if (i >= S3D_LIBS.length) {
        libsLoaded = true;
        libsLoading = false;
        onDone();
        pendingOnLoad.forEach(function (f) { f(); });
        pendingOnLoad = [];
        return;
      }
      var s = document.createElement('script');
      s.src = '/static/swh/lib/' + S3D_LIBS[i];
      s.onload = function () { i++; next(); };
      s.onerror = function () { console.error('sh3d: не удалось загрузить ' + s.src); i++; next(); };
      document.head.appendChild(s);
    })();
  }

  // ── внутреннее состояние ──
  var hpc = null;          // viewHome controller
  var doorStates = {};
  var started = false;
  var reportBound = false;

  function cloneTrs(trs) {
    if (!trs || !trs.length) return [];
    var TCtor = trs[0].constructor;
    var r = [];
    for (var i = 0; i < trs.length; i++) {
      var m = trs[i].getMatrix();
      r.push(new TCtor(trs[i].getName(), [[m[0][0], m[0][1], m[0][2], m[0][3]], [m[1][0], m[1][1], m[1][2], m[1][3]], [m[2][0], m[2][1], m[2][2], m[2][3]]]));
    }
    return r;
  }

  function openTrs(trs, item, isOpen) {
    var r = cloneTrs(trs);
    var sashes = item && item.getSashes ? item.getSashes() : null;
    for (var i = 0; i < r.length; i++) {
      var n = r[i].getName();
      if (n && (n.indexOf('sweethome3d_hinge') >= 0 || n.indexOf('sweethome3d_rail') >= 0)) {
        var m = r[i].matrix;
        var angle = -Math.PI / 2;
        var tx = 0, ty = 0, tz = 0;
        if (sashes && sashes.length > 0) {
          var idx = 0;
          var lc = n.charAt(n.length - 1);
          if (lc >= '0' && lc <= '9') idx = parseInt(lc) - 1;
          var sash = idx < sashes.length ? sashes[idx] : sashes[0];
          if (sash) {
            angle = isOpen !== false ? sash.endAngle : sash.startAngle;
            var mm = window.ModelManager && ModelManager.getInstance();
            if (mm && typeof mm.getNormalizedTransform === 'function') {
              var norm = mm.getNormalizedTransform(item);
              if (norm) {
                var x = sash.xAxis, y = 0.0, z = sash.yAxis;
                tx = norm[0] * x + norm[4] * y + norm[8] * z + norm[12];
                ty = norm[1] * x + norm[5] * y + norm[9] * z + norm[13];
                tz = norm[2] * x + norm[6] * y + norm[10] * z + norm[14];
              }
            }
          }
        }
        var open = mat4.create();
        mat4.fromYRotation(open, angle);
        open[12] = tx; open[13] = ty; open[14] = tz;
        m[0] = [open[0], open[4], open[8], open[12]];
        m[1] = [open[1], open[5], open[9], open[13]];
        m[2] = [open[2], open[6], open[10], open[14]];
        break;
      }
    }
    return r;
  }

  function rgb2color(r, g, b) { return -1 * ((0xFF - r) << 16 | (0xFF - g) << 8 | (0xFF - b) & 0xFF); }

  function devClassOf(report, key) {
    try { return JSON.parse(report[key].role.split("&")[1]).device_class; } catch (e) { return ''; }
  }

  // ── реакция на события устройств (двери/окна, ярлыки, подсветка) ──
  function zespEvt(data) {
    if (!data || !data[0]) return;
    var obj = data[0].EndPoint + data[0].ClusterId + data[0].AttribId;
    var dev;
    for (var di = 0; di < deviceList.length; di++) {
      if (deviceList[di].IEEE == data[0].IEEE) { dev = deviceList[di]; break; }
    }
    if (!dev || !dev.sh3d) return;
    var eItem;
    var itar = hpc.getComponent3D().homeObjects;
    for (var i = 0; i < itar.length; i++) { if (itar[i].id == dev.sh3d) { eItem = itar[i]; break; } }
    if (!eItem) return;
    var widget = eItem.id.split("-")[0];
    switch (widget) {
      case 'doorOrWindow': {
        var val = data[0].parsed;
        var openVal = val == "open" || val == "1" || val == "true" || val === 1 || val === true;
        var st = doorStates[eItem.id];
        if (!st || !st.closedTrs) {
          st = { isOpen: false, closedTrs: cloneTrs(eItem.object3D.userData.getModelTransformations()) };
          doorStates[eItem.id] = st;
        }
        if (openVal && !st.isOpen) {
          eItem.object3D.userData.setModelTransformations(openTrs(st.closedTrs, eItem, true));
          component3D.updateObjects([eItem]);
          st.isOpen = true;
        } else if (!openVal && st.isOpen) {
          eItem.object3D.userData.setModelTransformations(openTrs(st.closedTrs, eItem, false));
          component3D.updateObjects([eItem]);
          st.isOpen = false;
        }
        break;
      }
      case 'label': {
        var txt = dev.Name + "\n";
        for (var key in dev.Report) {
          var v = dev.Report[key];
          var dc = devClassOf(dev.Report, key);
          txt += geticon(dc) + "\t" + v.label + "\t\t:\t" + (obj == key ? data[0].parsed : v.parsed) + "\n";
        }
        eItem.text = txt;
        component3D.updateObjects([eItem]);
        break;
      }
      default: {
        eItem.color = rgb2color(255, 255, 0);
        component3D.updateObjects([eItem]);
        setTimeout(function () {
          eItem.color = null;
          component3D.updateObjects([eItem]);
        }, 200);
      }
    }
  }

  // ── привязка устройства к объекту плана ──
  function bindItem(IEEE, itemId) {
    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i].sh3d && deviceList[i].sh3d == itemId) {
        deviceList[i].sh3d = "";
        edDevUpdate(i);
      }
      if (deviceList[i].IEEE == IEEE) {
        deviceList[i].sh3d = itemId;
        edDevUpdate(i);
      }
    }
    var dv = document.getElementById(VIEWER_DIV_ID);
    if (dv) dv.style.visibility = "hidden";
  }

  function edDevUpdate(i) {
    try { WSsend('Update_edDev|' + JSON.stringify(deviceList[i])); } catch (e) { console.log('sh3d update_edDev err:', e); }
  }

  // клик по устройству в списке комнаты — показать виджет устройства
  function clickItem(IEEE) {
    var dv = document.getElementById(VIEWER_DIV_ID);
    if (dv) dv.style.visibility = "hidden";
    var dw = document.getElementById(DEV_WIDGET_ID);
    if (!dw) return;
    dw.innerHTML = getWidget(IEEE);
    dw.style.visibility = "visible";
  }

  function evtXY(e, touch) {
    return touch ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : { x: e.clientX, y: e.clientY };
  }

  // ── двойной клик: привязка устройства к объекту / список по комнате ──
  function doubleTapItemEvt(e) {
    if (e.preventDefault) { e.preventDefault(); e.stopPropagation(); }
    var dw = document.getElementById(DEV_WIDGET_ID);
    if (dw) dw.style.visibility = "hidden";
    var p = evtXY(e, e.changedTouches);
    var item = hpc.getComponent3D().getClosestItemAt(p.x, p.y);
    if (!item) return;
    var dv = document.getElementById(VIEWER_DIV_ID);
    var listEl = document.getElementById(LIST_ID);
    if (item.id.indexOf("room") < 0) {
      var li = "<table>";
      for (var i = 0; i < deviceList.length; i++) {
        li += `<tr onclick="sh3dBind('` + deviceList[i].IEEE + `','` + item.id + `')"><td>` + deviceList[i].Location + `</td><td>` + deviceList[i].Name + `</td></tr>`;
      }
      li += "</table>";
      if (listEl) listEl.innerHTML = li;
      if (dv) dv.style.visibility = "visible";
    } else if (item.id.indexOf("room") == 0) {
      var li2 = "<table>";
      for (var j = 0; j < deviceList.length; j++) {
        if (String(deviceList[j].Location || '').toLowerCase() == String(item.getName() || '').toLowerCase()) {
          li2 += `<tr onclick="sh3dClick('` + deviceList[j].IEEE + `')"><td>` + deviceList[j].IEEE + `</td><td>` + deviceList[j].Name + `</td></tr>`;
        }
      }
      li2 += "</table>";
      if (listEl) listEl.innerHTML = li2;
      if (dv) dv.style.visibility = "visible";
    }
    var lbl = document.getElementById(VIEWER_LABEL_ID);
    if (lbl) lbl.innerText = (item && item.getName) ? item.getName() : '';
  }

  // ── движение/клики по холсту ──
  function itemEvt(e) {
    if (!hpc) return;
    var labels = hpc.home.labels;
    for (var i = 0; i < labels.length; i++) {
      labels[i].pitch = 1.5 - hpc.home.getCamera().getPitch();
      labels[i].angle = 179 + hpc.home.getCamera().getYaw();
      component3D.updateObjects([labels[i]]);
    }
    var p;
    switch (e.type) {
      case 'mousemove': {
        var item = hpc.getComponent3D().getClosestItemAt(e.clientX, e.clientY);
        try {
          var co = document.getElementById('sh3dCurrentObject');
          var cv = document.getElementById(CANVAS_ID);
          if (item.id.indexOf("room") < 0) {
            if (co) co.innerText = (item && item.getName) ? item.getName() : '';
            if (cv) cv.style.cursor = 'pointer';
          } else {
            if (co) co.innerText = '';
            if (cv) cv.style.cursor = 'default';
          }
        } catch (err) {}
        break;
      }
      case 'mouseup': {
        hideOverlays();
        action(e.clientX, e.clientY);
        break;
      }
      case 'touchend': {
        hideOverlays();
        p = evtXY(e, true);
        action(p.x, p.y);
        break;
      }
    }
  }

  function hideOverlays() {
    var dv = document.getElementById(VIEWER_DIV_ID);
    if (dv) dv.style.visibility = "hidden";
    var dw = document.getElementById(DEV_WIDGET_ID);
    if (dw) dw.style.visibility = "hidden";
  }

  function action(x, y) {
    var item = hpc.getComponent3D().getClosestItemAt(x, y);
    if (!item) return;
    var widget = item.id.split("-")[0];
    switch (widget) {
      case 'doorOrWindow': {
        if (!doorStates[item.id] || !doorStates[item.id].closedTrs) {
          doorStates[item.id] = { isOpen: false, closedTrs: cloneTrs(item.object3D.userData.getModelTransformations()) };
        }
        var st = doorStates[item.id];
        if (st.isOpen) {
          item.object3D.userData.setModelTransformations(openTrs(st.closedTrs, item, false));
          st.isOpen = false;
        } else {
          item.object3D.userData.setModelTransformations(openTrs(st.closedTrs, item, true));
          st.isOpen = true;
        }
        component3D.updateObjects([item]);
        break;
      }
      case 'zpieceOfFurniture':
        break;
      default: {
        item.outlineColor = rgb2color(0, 255, 0);
        component3D.updateObjects([item]);
        setTimeout(function () {
          item.outlineColor = null;
          component3D.updateObjects([item]);
        }, 300);
      }
    }
    for (var i = 0; i < deviceList.length; i++) {
      try {
        if (deviceList[i].sh3d == item.id) clickItem(deviceList[i].IEEE);
      } catch (err) {}
    }
  }

  // ── загрузка плана my.sh3d ──
  function parseFile(file) {
    var onerror = function (err) {
      if (err == "No WebGL") { alert("Ваш браузер не поддерживает WebGL."); }
      else { console.log(err.stack); alert("Ошибка: " + (err.message ? err.constructor.name + " " + err.message : err)); }
    };
    var onprogression = function (part, info, percentage) {
      var progress = document.getElementById(PROGRESS_ID);
      var label = document.getElementById(PROGRESS_LABEL_ID);
      if (part === HomeRecorder.READING_HOME) {
        progress.value = percentage * 100;
        info = info.substring(info.lastIndexOf('/') + 1);
      } else if (part === Node3D.READING_MODEL) {
        progress.value = 100 + percentage * 100;
        if (percentage === 1) {
          var pd = document.getElementById(PROGRESS_DIV_ID);
          if (pd) pd.style.visibility = "hidden";
          resize3d();
          hpc.getHome().addFurnitureListener(function (e) { console.log(e); });
          var UP = hpc.getUserPreferences();
          UP.setAerialViewCenteredOnSelectionEnabled(true);
          var HOME = hpc.getHome();
          HOME.getSelectableViewableItems();
          var cv = document.getElementById(CANVAS_ID);
          if (cv) {
            cv.addEventListener("mousemove", itemEvt);
            cv.addEventListener("mouseup", itemEvt);
            cv.addEventListener("dblclick", doubleTapItemEvt);
            cv.addEventListener("touchend", itemEvt);
          }
          if (window.eventE && !reportBound) {
            eventE.on('report', zespEvt);
            reportBound = true;
          }
        }
      }
      if (label) label.innerHTML = (percentage ? Math.floor(percentage * 100) + "% " : "") + part + " " + info;
    };
    hpc = viewHome(CANVAS_ID, file, onerror, onprogression, {
      roundsPerMinute: 0,
      navigationPanel: "none",
      aerialViewButtonId: "sh3dAerialView",
      virtualVisitButtonId: "sh3dVirtualVisit",
      levelsAndCamerasListId: "sh3dLevelsCameras",
      activateCameraSwitchKey: true
    });
  }

  function resize3d() {
    var cv = document.getElementById(CANVAS_ID);
    var wrap = cv && cv.parentElement;
    if (cv && wrap) {
      cv.width = wrap.clientWidth;
      cv.height = wrap.clientHeight;
    }
    try { if (window.component3D) component3D.windowResizeListener(); } catch (e) {}
  }

  // ── глобальные обработчики кнопок ──
  window.sh3dBind = function (IEEE, itemId) { bindItem(IEEE, itemId); };
  window.sh3dClick = function (IEEE) { clickItem(IEEE); };

  window.sh3dTop = function () {
    if (hpc) hpc.home.setCamera(hpc.getHome().getTopCamera());
  };
  window.sh3dVisit = function () {
    if (hpc) hpc.home.setCamera(hpc.getHome().getObserverCamera());
  };

  window.sh3dExport = function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', './static/swh/my.sh3d');
    xhr.responseType = 'blob';
    xhr.onload = function () {
      if (xhr.status === 200) {
        var a = document.createElement('a');
        a.href = window.URL.createObjectURL(xhr.response);
        a.download = 'my.sh3d';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    };
    xhr.send();
  };

  window.sh3dImport = function () {
    var fileInput = document.getElementById(FILE_INPUT_ID);
    if (!fileInput) return;
    fileInput.onchange = function (e) {
      var file = e.target.files[0];
      if (file) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          try {
            var base64 = btoa(ev.target.result);
            SaveFile("/static/swh/my.sh3d", base64);
            setTimeout(function () {
              var win = WinEngine.windowsOf('sh3d')[0];
              if (win) { WinEngine.close(win); }
              setTimeout(function () { WinEngine.open('sh3d'); }, 600);
            }, 1200);
          } catch (err) { console.log('sh3d import err:', err); }
        };
        reader.readAsBinaryString(file);
      }
    };
    fileInput.click();
  };

  var S3D_CSS =
    '#sh3dViewerDiv tr:hover{background-color:gold;}' +
    '.sh3d-wrap{position:relative;width:100%;height:100%;overflow:hidden;background:#fff;}' +
    '.sh3d-wrap canvas{display:block;position:absolute;inset:0;background:#cccccc;}' +
    '#sh3dViewerDiv{width:320px;height:400px;position:absolute;top:5px;left:5px;background-color:rgba(225,225,218,.7);padding:12px;border-radius:15px;visibility:hidden;overflow-y:auto;z-index:5;}' +
    '#sh3dViewerDiv table{width:100%;border-collapse:collapse;}' +
    '#sh3dViewerDiv tr{cursor:pointer;}' +
    '#sh3dProgressDiv{width:320px;position:absolute;top:5px;left:5px;background:rgba(128,128,128,.7);padding:20px;border-radius:25px;z-index:6;}';

  // ── регистрация виджета ───────────────────────────────────────────
  window.WinEngine.register({
    id: 'sh3d',
    title: 'Home plan 3D',
    label: 'Home plan 3D',
    icon: '<img src="/static/icons/sh3d.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="60" data-y="30" data-w="840" data-h="640">' +
      '<style>' + S3D_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Home plan 3D</span>' +
      '<div class="c-tools">' +
      '<button class="cbtn" onclick="sh3dTop()" title="Вид сверху">⬆ Top</button>' +
      '<button class="cbtn" onclick="sh3dVisit()" title="Вид от первого лица">👁 Visit</button>' +
      '<button class="cbtn" onclick="sh3dImport()" title="Загрузить план">Import</button>' +
      '<button class="cbtn" onclick="sh3dExport()" title="Скачать план">Export</button>' +
      '</div>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden">' +
      '<div class="sh3d-wrap">' +
      '<canvas id="' + CANVAS_ID + '" width="500" height="500" style="outline:none;" tabIndex="1"></canvas>' +
      '<div id="' + PROGRESS_DIV_ID + '">' +
      '<progress id="' + PROGRESS_ID + '" value="0" max="200" style="width:280px;"></progress>' +
      '<label id="' + PROGRESS_LABEL_ID + '" style="display:block;text-align:left;color:#000;"></label></div>' +
      '<div id="' + DEV_WIDGET_ID + '" class="DeviceWidget" style="z-index:8;"></div>' +
      '<div id="' + VIEWER_DIV_ID + '">' +
      '<label id="' + VIEWER_LABEL_ID + '" style="display:block;text-align:center;color:#000;">item</label>' +
      '<div id="' + LIST_ID + '"></div></div>' +
      '<input id="sh3dAerialView" name="sh3dCameraType" type="radio" style="visibility:hidden;"/>' +
      '<input id="sh3dVirtualVisit" name="sh3dCameraType" type="radio" style="visibility:hidden;"/>' +
      '<select id="sh3dLevelsCameras" style="visibility:hidden;"></select>' +
      '<div id="sh3dCurrentObject" style="position:absolute;bottom:5px;text-align:center;width:95%;z-index:9;color:#000;">Object</div>' +
      '<div style="visibility:hidden;"><input type="file" id="' + FILE_INPUT_ID + '"></div>' +
      '</div></div></div>',

    setup(node) {
      node._state = { ro: null, loaded: false };

      loadS3DLibs(function () {
        node._state.loaded = true;
        if (node._state.destroyed) return;
        started = true;
        parseFile("./static/swh/my.sh3d");
        resize3d();
      });

      var wrap = node.querySelector('.sh3d-wrap');
      if (wrap && window.ResizeObserver) {
        var ro = new ResizeObserver(function () { if (started) resize3d(); });
        ro.observe(wrap);
        node._state.ro = ro;
      }
    },

    activate(node) {
      if (started && hpc) {
        resize3d();
        try { hpc.getHome().getCamera(); } catch (e) {}
      }
    },

    destroy(node) {
      node._state.destroyed = true;
      if (window.eventE && reportBound) {
        eventE.off('report', zespEvt);
        reportBound = false;
      }
      if (node._state && node._state.ro) node._state.ro.disconnect();
      node._state = null;
      started = false;
      hpc = null;
      doorStates = {};
      [CANVAS_ID, PROGRESS_DIV_ID, DEV_WIDGET_ID, VIEWER_DIV_ID, LIST_ID].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });
})();