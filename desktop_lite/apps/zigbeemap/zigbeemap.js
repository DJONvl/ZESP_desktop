// zigbeemap.js — виджет «Zigbee Map» (порт static/apps/zigbeeMap.app на WinEngine).
// Схема Zigbee-сети на vis.js (LQI). Зависимости: socket.js (deviceList/eventE/WSsend/Hex),
// widgets.js (getWidget), zesp-globals.js. vis-network.min.js грузится лениво.

(function () {
  'use strict';

  var DIR = '/img/';
  var EDGE_LENGTH_MAIN = 150;
  var EDGE_LENGTH_SUB = 80;
  var WRAP_ID = 'zbMapWrap';
  var CANVAS_ID = 'M2PC_@!@_mapnetwork';
  var DEV_WID_ID = 'M2PC_@!@_DeviceWidget';

  var $ = function (id) { return document.getElementById(id); };

  // ── состояние ──
  var network = null;
  var nodesDS = null;
  var edgesDS = null;
  var nodes = [];
  var edges = [];
  var networkEvents = [];
  var curInd = 0;
  var messages2send = [];
  var tim_map = null;
  var edgeFilter = { child: true, sibling: true, parent: true, other: true, bed: true };

  // ── ленивая загрузка vis-network ──
  var visLoading = false;
  var visPending = [];

  function loadVis(onDone) {
    if (window.vis && window.vis.Network) { onDone(); return; }
    if (visLoading) { visPending.push(onDone); return; }
    visLoading = true;
    var s = document.createElement('script');
    s.src = '/static/KWS/vis-network.min.js';
    s.onload = function () { onDone(); visPending.forEach(function (f) { f(); }); visPending = []; };
    s.onerror = function () { console.error('zigbeemap: не удалось загрузить vis-network'); onDone(); };
    document.head.appendChild(s);
  }

  // ── хелперы ──
  function ModelIdDev(Adr) {
    var ModelId = 'Unknown';
    if (Adr && Adr.length > 4) {
      for (var i = 0; i < deviceList.length; i++) if (deviceList[i].IEEE === Adr) { ModelId = deviceList[i].ModelId; break; }
    } else {
      for (var j = 0; j < deviceList.length; j++) if (deviceList[j].Device === Adr) { ModelId = deviceList[j].ModelId; break; }
    }
    return ModelId;
  }
  function imgSrc(dev, modelId) { return (dev && dev.Img) ? dev.Img : DIR + modelId + '.jpg'; }
  function tryname(str) { return str; }

  // SVG-иконка типа устройства (как в виджете «Устройства»), fallback — картинка .jpg.
  function deviceIconSrc(IEEE) {
    if (typeof renderDeviceTypeIcon !== 'function') return null;
    var dType = 'devices.types.other';
    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i].IEEE === IEEE && deviceList[i].type) { dType = deviceList[i].type; break; }
    }
    var color = '#0dcaf0';
    var svg = renderDeviceTypeIcon(dType, 42, color) ||
              renderDeviceTypeIcon('devices.types.other', 42, color);
    if (!svg) return null;
    // currentColor не наследуется в canvas — подставляем цвет явно
    var html = svg.outerHTML.replace(/currentColor/g, color);
    if (html.indexOf('xmlns') === -1) html = html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(html);
  }

  // ── очередь запросов LQI ──
  function scheduleTimeout() {
    if (tim_map) clearTimeout(tim_map);
    tim_map = setTimeout(function () {
      if (tim_map) clearTimeout(tim_map);
      if (messages2send.length) {
        curInd = 0;
        messages2send.shift();
        WSsend(messages2send[0].cmd);
        scheduleTimeout();
      }
    }, 3000);
  }
  function nextMsg() {
    messages2send.shift();
    if (messages2send.length) { WSsend(messages2send[0].cmd); scheduleTimeout(); }
  }

  function listenerLQI_RSP(tmp) {
    if (tmp === 'timeout') return;
    if (!tmp || tmp.error) {
      curInd = 0; messages2send.shift();
      if (messages2send.length) WSsend(messages2send[0].cmd);
      return;
    }
    if (tim_map) clearTimeout(tim_map);
    var adr = (messages2send[0] && messages2send[0].nwkAddr) || '0000';
    tmp.src_addr = adr;
    parseMap(tmp);

    if (tmp.NeighborLqiList) {
      tmp.NeighborLqiList.forEach(function (neighbor) {
        if (neighbor.DeviceType === 'ZED') {
          messages2send = messages2send.filter(function (m) { return m.nwkAddr !== neighbor.NetworkAddress; });
        }
      });
      var total = parseInt(tmp.NeighborTableEntries, 16);
      var count = parseInt(tmp.NeighborTableListCount, 16);
      if (!isNaN(total) && !isNaN(count) && total > (count + curInd)) {
        curInd += count;
        WSsend('LQI_REQ|' + adr + '|' + Hex(curInd, 2));
        scheduleTimeout();
      } else { curInd = 0; nextMsg(); }
    } else {
      curInd = 0; messages2send.shift();
      if (messages2send.length) WSsend(messages2send[0].cmd);
    }
  }

  function putEventToNode(devId) {
    if (!network) return;
    var ds = network.body && network.body.data && network.body.data.nodes;
    if (!ds || !ds._data) return;
    var found = false;
    for (var id in ds._data) { if (ds._data[id] && ds._data[id].id === devId) { found = true; break; } }
    if (found && !networkEvents.some(function (ev) { return ev.node === devId; })) {
      networkEvents.push({ node: devId, radius: 0 });
    }
  }

  function reqMap() {
    nodes = [];
    edges = [];
    messages2send = [];
    if (nodesDS) nodesDS.clear();
    if (edgesDS) edgesDS.clear();
    messages2send.push({ cmd: 'LQI_REQ|0000|0', nwkAddr: '0000' });
    for (var i = 1; i < deviceList.length; i++) {
      if (deviceList[i]['DevType'] === 'ZR') {
        messages2send.push({ cmd: 'LQI_REQ|' + deviceList[i].Device + '|0', nwkAddr: deviceList[i].Device });
      }
    }
    WSsend('LQI_REQ|0000|00');
  }

  function buildNodes() {
    nodes = [];
    edges = [];
    nodes.push({ mass: 2, id: 0, label: 'ZESP_Coordinator', image: DIR + 'zesp.png', shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } });
    for (var i = 1; i < deviceList.length; i++) {
      var device = deviceList[i];
      if (device.DevType === 'YAM') continue;
      var mid = ModelIdDev(device.IEEE);
      var deviceId = parseInt(device.Device, 16);
      var nodeData = { mass: 2, id: deviceId, label: mid + '\n' + device.IEEE, image: deviceIconSrc(device.IEEE) || imgSrc(device, mid), shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } };
      if (device.DevType === 'ZR') { nodeData.color.border = 'gold'; nodeData.borderWidth = 3; }
      else if (device.DevType === 'BED') { edges.push({ id: deviceId + '>0', from: deviceId, to: 0, length: EDGE_LENGTH_MAIN, kind: 'bed' }); }
      nodes.push(nodeData);
    }
  }

  function relKind(rel, devType) {
    if (rel === 'Child') return 'child';
    if (rel === 'Sibling') return 'sibling';
    if (rel === 'Parent') return 'parent';
    // Прошивка часто отдаёт Relationship=Unknown — классифицируем по типу устройства
    if (rel === 'PreviousChild' || devType === 'ZED') return 'child';
    if (devType === 'ZR' || devType === 'ZC') return 'sibling';
    return 'other';
  }

  function parseMap(dev) {
    if (dev.Status === '00') {
      if (nodes.length === 0) buildNodes();

      if (dev.NeighborLqiList) {
        dev.NeighborLqiList.forEach(function (neighbor) {
          var neighborId = parseInt(neighbor.NetworkAddress, 16);
          var nmid = tryname(ModelIdDev(neighbor.ExtendedAddress));
          if (!nodes.some(function (n) { return n.id === neighborId; })) {
            nodes.push({ id: neighborId, label: nmid + '\n' + neighbor.ExtendedAddress, image: deviceIconSrc(neighbor.ExtendedAddress) || (DIR + nmid + '.jpg'), shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } });
            var newKind = relKind(neighbor.Relationship, neighbor.DeviceType);
            var newEdge = { id: parseInt(dev.src_addr, 16) + '>' + neighborId, label: parseInt(neighbor.LQI, 16).toString(), from: parseInt(dev.src_addr, 16), to: neighborId, length: EDGE_LENGTH_SUB, kind: newKind };
            if (newKind === 'child') newEdge.color = 'white';
            else if (newKind === 'sibling') { newEdge.color = 'gold'; newEdge.dashes = true; newEdge.length = EDGE_LENGTH_MAIN * 2; }
            else if (newKind === 'parent') newEdge.color = 'green';
            edges.push(newEdge);
          } else {
            var edKind = relKind(neighbor.Relationship, neighbor.DeviceType);
            var edgeData = {
              id: parseInt(dev.src_addr, 16) + '>' + neighborId,
              label: parseInt(neighbor.LQI, 16).toString(),
              from: parseInt(dev.src_addr, 16),
              to: neighborId,
              length: parseInt(neighbor.LQI, 16),
              kind: edKind
            };
            if (edKind === 'child') edgeData.color = 'white';
            else if (edKind === 'sibling') { edgeData.color = 'gold'; edgeData.dashes = true; edgeData.length = EDGE_LENGTH_MAIN * 2; }
            else if (edKind === 'parent') edgeData.color = 'green';
            if (!edges.some(function (e) { return e.from === edgeData.from && e.to === edgeData.to; })) edges.push(edgeData);
          }
        });
      }
      redrawMap();
    }
  }
  function redrawMap() {
    if (!network) return;
    var visible = edges.filter(function (e) { return edgeFilter[e.kind] !== false; });
    if (!nodesDS || !edgesDS) {
      nodesDS = new vis.DataSet(nodes);
      edgesDS = new vis.DataSet(visible);
      network.setData({ nodes: nodesDS, edges: edgesDS });
    } else {
      nodesDS.update(nodes);
      var keep = {};
      visible.forEach(function (e) { keep[e.id] = true; });
      var drop = edgesDS.getIds().filter(function (id) { return !keep[id]; });
      if (drop.length) edgesDS.remove(drop);
      edgesDS.update(visible);
    }
    network.redraw();
  }

  // ── построение сети ──
  function buildNetwork(node) {
    var container = $(CANVAS_ID);
    if (!container) return;
    nodesDS = new vis.DataSet([]);
    edgesDS = new vis.DataSet([]);
    network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
      interaction: { hover: true },
      autoResize: true,
      nodes: { shape: 'box' },
      layout: { improvedLayout: true }
    });

    if (node && node._state.loopTimer) clearInterval(node._state.loopTimer);
    node._state.loopTimer = setInterval(function () {
      if (networkEvents.length > 0 && network) {
        network.redraw();
        var toDelete = [];
        networkEvents.forEach(function (ev, index) {
          if (ev.radius >= 1) toDelete.push(index); else ev.radius += 0.08;
        });
        toDelete.forEach(function (index) { networkEvents.splice(index, 1); });
      }
    }, 60);

    network.on('beforeDrawing', function (ctx) {
      if (networkEvents.length > 0) {
        var nodePosition = network.getPositions();
        networkEvents.forEach(function (event) {
          var pos = nodePosition[event.node];
          if (!pos) return;
          var cap = Math.cos(event.radius * Math.PI / 2);
          var c0 = 'rgba(255,255,0,' + cap.toFixed(2) + ')';
          var c1 = 'rgba(255,0,0,' + cap.toFixed(2) + ')';
          ctx.strokeStyle = c0;
          ctx.fillStyle = c1;
          var radius = Math.abs(100 * Math.sin(event.radius));
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        });
      }
    });

    reqMap();

    network.on('doubleClick', function (params) {
      try {
        var obj = params.nodes[0];
        if (obj === undefined) return;
        var hd = obj.toString(16).padStart(4, '0').toUpperCase();
        var ieee = null;
        for (var i = 0; i < deviceList.length; i++) if (deviceList[i].Device === hd) { ieee = deviceList[i].IEEE; break; }
        if (ieee) {
          var dw = $(DEV_WID_ID);
          if (dw) { dw.innerHTML = getWidget(ieee); dw.style.visibility = 'visible'; }
        }
      } catch (e) { console.error('zigbeemap dblclick err:', e); }
    });
    network.on('click', function () { var dw = $(DEV_WID_ID); if (dw) dw.style.visibility = 'hidden'; });

    tim_map = setTimeout(function () {
      if (tim_map) clearTimeout(tim_map);
      parseMap({ src_addr: '0000', Status: '00', NeighborTableEntries: '00', StartIndex: '00', NeighborTableListCount: '00', NeighborLqiList: [] });
    }, 3000);
  }

  // ── глобальные кнопки ──
  window.zigbeeMapRefresh = function () { if (network) { reqMap(); } };
  window.zigbeeMapToggleEdge = function (kind, on) { edgeFilter[kind] = on; if (network) redrawMap(); };

  var ZBM_CSS = '' +
    '[id="' + CANVAS_ID + '"]{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:1px solid lightgray;}' +
    '[id="' + CANVAS_ID + '"] div.vis-network{width:100%;height:100%;background-color:darkgray;opacity:.99;}' +
    '[id="' + DEV_WID_ID + '"]:not(:focus){visibility:hidden;}' +
    '.zb-tgl{display:inline-flex;align-items:center;gap:3px;font-size:12px;color:inherit;cursor:pointer;margin-left:10px;}' +
    '.zb-tgl input{margin:0;cursor:pointer;}';

  // ── регистрация виджета ──
  window.WinEngine.register({
    id: 'zigbeemap',
    title: 'Zigbee Map',
    label: 'Zigbee Map',
    icon: '<img src="/static/icons/ZIGBEE.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="90" data-y="50" data-w="760" data-h="520">' +
      '<style>' + ZBM_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Devices Map</span>' +
      '<div class="c-tools"><button class="cbtn" onclick="zigbeeMapRefresh()" title="Обновить">🔄</button>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'child\',this.checked)">дети</label>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'sibling\',this.checked)">соседи</label>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'parent\',this.checked)">родители</label>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'other\',this.checked)">другое</label>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'bed\',this.checked)">прямые</label></div>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body zbw-body" style="display:flex;flex-direction:column;padding:0;overflow:hidden">' +
      '<div id="' + WRAP_ID + '" style="position:relative;width:100%;flex:1;min-height:0;">' +
      '<div id="' + CANVAS_ID + '"></div>' +
      '<div id="' + DEV_WID_ID + '" class="DeviceWidget"></div>' +
      '</div></div></div>',

    setup(node) {
      node._state = { loopTimer: null, wsOnLQI: null, wsOnReport: null, wsOnDevList: null, destroyed: false };

      node._state.wsOnReport = function (report) {
        try { if (report && report[0] && report[0].ShortAddr) putEventToNode(parseInt('0x' + report[0].ShortAddr, 16)); } catch (e) {}
      };
      node._state.wsOnLQI = function (tmp) { listenerLQI_RSP(tmp); };
      node._state.wsOnDevList = function () {
        // deviceList пришёл/обновился после перезагрузки — перестроить карту
        if (network && deviceList && deviceList.length) reqMap();
      };
      if (window.eventE) {
        eventE.on('report', node._state.wsOnReport);
        eventE.on('LQI_RSP', node._state.wsOnLQI);
        eventE.on('updateDeviceList', node._state.wsOnDevList);
      }

      loadVis(function () {
        if (node._state.destroyed) return;
        buildNetwork(node);
      });
    },

    activate() {
      if (network) { try { network.redraw(); network.fit(); } catch (e) {} }
    },

    destroy(node) {
      node._state.destroyed = true;
      if (window.eventE) {
        if (node._state.wsOnLQI) eventE.off('LQI_RSP', node._state.wsOnLQI);
        if (node._state.wsOnReport) eventE.off('report', node._state.wsOnReport);
        if (node._state.wsOnDevList) eventE.off('updateDeviceList', node._state.wsOnDevList);
      }
      if (tim_map) clearTimeout(tim_map);
      tim_map = null;
      if (node._state.loopTimer) clearInterval(node._state.loopTimer);
      if (network) { try { network.destroy(); } catch (e) {} }
      network = null;
      nodesDS = null;
      edgesDS = null;
      nodes = [];
      edges = [];
      networkEvents = [];
      curInd = 0;
      messages2send = [];
      var wrap = $(WRAP_ID);
      if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap);
      node._state = null;
    }
  });
})();