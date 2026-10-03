// zigbeemap.js — "Zigbee Map" widget (port of static/apps/zigbeeMap.app to WinEngine).
// Zigbee network diagram on vis.js (LQI). Dependencies: socket.js (deviceList/eventE/WSsend/Hex),
// widgets.js (getWidget), zesp-globals.js. vis-network.min.js loads lazily.

(function () {
  'use strict';
  console.log('zigbeemap.js v8 (no fit on focus)');

  var DIR = '/img/';
  var EDGE_LENGTH_MAIN = 150;
  var EDGE_LENGTH_SUB = 80;
  var WRAP_ID = 'zbMapWrap';
  var CANVAS_ID = 'M2PC_@!@_mapnetwork';
  var DEV_WID_ID = 'M2PC_@!@_DeviceWidget';

  var $ = function (id) { return document.getElementById(id); };

  // ── state ──
  var network = null;
  var nodesDS = null;
  var edgesDS = null;
  var nodes = [];
  var edges = [];
  var networkEvents = [];
  var curInd = 0;
  var messages2send = [];
  var tim_map = null;
  var autoFitted = false;
  var mapLoading = false;
  var edgeFilter = { child: true, sibling: true, parent: true, other: true, bed: true, group: true };
  // Diagnostics passed: groups render. true — show GRP nodes with links.
  var SHOW_GROUPS = true;

  // ── lazy vis-network loading ──
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

  // ── helpers ──
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

  // SVG icon of the device type (as in the "Devices" widget), fallback — .jpg picture.
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
    // currentColor is not inherited in canvas — substitute the color explicitly
    var html = svg.outerHTML.replace(/currentColor/g, color);
    if (html.indexOf('xmlns') === -1) html = html.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(html);
  }

  // ── LQI request queue ──
  function scheduleTimeout() {
    if (tim_map) clearTimeout(tim_map);
    tim_map = setTimeout(function () {
      if (tim_map) clearTimeout(tim_map);
      if (messages2send.length) {
        curInd = 0;
        messages2send.shift();
        if (messages2send.length) { WSsend(messages2send[0].cmd); scheduleTimeout(); }
        else finishLoad();
      }
    }, 3000);
  }
  function nextMsg() {
    messages2send.shift();
    if (messages2send.length) { WSsend(messages2send[0].cmd); scheduleTimeout(); }
    else finishLoad();
  }

  // Final centering when the LQI queue is drained (all responses received).
  // No animation: amid live physics animated-fit glitches in old vis.
  function finishLoad() {
    if (!network) { mapLoading = false; return; }
    mapLoading = false;
    try { network.fit(); } catch (e) {}
  }

  function listenerLQI_RSP(tmp) {
    if (tmp === 'timeout') return;
    if (!tmp || tmp.error) {
      curInd = 0; messages2send.shift();
      if (messages2send.length) WSsend(messages2send[0].cmd);
      else finishLoad();
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
      else finishLoad();
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
    autoFitted = false;
    mapLoading = true;
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
    var groups = [];
    for (var i = 1; i < deviceList.length; i++) {
      var device = deviceList[i];
      if (device.DevType === 'YAM') continue;
      // Groups are not radio neighbors. While SHOW_GROUPS=false — skip entirely.
      if (device.DevType === 'GRP') { if (SHOW_GROUPS) groups.push(device); continue; }
      var mid = ModelIdDev(device.IEEE);
      var deviceId = parseInt(device.Device, 16);
      // No address (BLE virtuals, MQTT import): separate node with a string id
      // (numeric NaN would poison physics) + direct link to the coordinator.
      if (isNaN(deviceId)) {
        var vid = 'virt:' + device.IEEE;
        nodes.push({ mass: 2, id: vid, label: mid + '\n' + device.IEEE, image: deviceIconSrc(device.IEEE) || imgSrc(device, mid), shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } });
        edges.push({ id: vid + '>0', from: vid, to: 0, length: EDGE_LENGTH_MAIN, kind: 'bed' });
        continue;
      }
      var nodeData = { mass: 2, id: deviceId, label: mid + '\n' + device.IEEE, image: deviceIconSrc(device.IEEE) || imgSrc(device, mid), shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } };
      if (device.DevType === 'ZR') { nodeData.color.border = 'gold'; nodeData.borderWidth = 3; }
      else if (device.DevType === 'BED') { edges.push({ id: deviceId + '>0', from: deviceId, to: 0, length: EDGE_LENGTH_MAIN, kind: 'bed' }); }
      nodes.push(nodeData);
    }
    // Group nodes (string id — no clash with network addresses)
    // + dashed group → member edges
    groups.forEach(function (g) {
      var addr = (g.Device || '').toUpperCase();
      var gid = 'grp:' + (addr || g.IEEE);
      nodes.push({
        mass: 3, id: gid,
        label: (g.Name || addr) + '\nGRP ' + addr,
        shape: 'box',
        color: { background: '#fdf3e0', border: '#e67e22' },
        borderWidth: 2, font: { color: '#7e5109' }
      });
      (g.Members || []).forEach(function (ieee) {
        for (var k = 1; k < deviceList.length; k++) {
          if (deviceList[k].IEEE === ieee) {
            var mId = parseInt(deviceList[k].Device, 16);
            if (isNaN(mId)) return;
            edges.push({
              id: gid + '>' + mId, from: gid, to: mId,
              label: 'grp', length: EDGE_LENGTH_SUB,
              kind: 'group', color: '#9b59b6', dashes: true
            });
            break;
          }
        }
      });
    });
  }

  function relKind(rel, devType) {
    if (rel === 'Child') return 'child';
    if (rel === 'Sibling') return 'sibling';
    if (rel === 'Parent') return 'parent';
    // Firmware often reports Relationship=Unknown — classify by device type
    if (rel === 'PreviousChild' || devType === 'ZED') return 'child';
    if (devType === 'ZR' || devType === 'ZC') return 'sibling';
    return 'other';
  }

  function parseMap(dev) {
    if (dev.Status === '00') {
      if (nodes.length === 0) buildNodes();

      if (dev.NeighborLqiList) {
        var srcId = parseInt(dev.src_addr, 16);
        dev.NeighborLqiList.forEach(function (neighbor) {
          var neighborId = parseInt(neighbor.NetworkAddress, 16);
          // Broken over-the-air addresses — skip, otherwise NaN breaks physics
          if (isNaN(neighborId) || isNaN(srcId)) return;
          var lqi = parseInt(neighbor.LQI, 16);
          var lqiLabel = isNaN(lqi) ? '' : lqi.toString();
          var nmid = tryname(ModelIdDev(neighbor.ExtendedAddress));
          if (!nodes.some(function (n) { return n.id === neighborId; })) {
            nodes.push({ id: neighborId, label: nmid + '\n' + neighbor.ExtendedAddress, image: deviceIconSrc(neighbor.ExtendedAddress) || (DIR + nmid + '.jpg'), shape: 'circularImage', color: { background: '#f4f6fa', border: '#8a94a8' } });
            var newKind = relKind(neighbor.Relationship, neighbor.DeviceType);
            var newEdge = { id: srcId + '>' + neighborId, label: lqiLabel, from: srcId, to: neighborId, length: EDGE_LENGTH_SUB, kind: newKind };
            if (newKind === 'child') newEdge.color = 'white';
            else if (newKind === 'sibling') { newEdge.color = 'gold'; newEdge.dashes = true; newEdge.length = EDGE_LENGTH_MAIN * 2; }
            else if (newKind === 'parent') newEdge.color = 'green';
            edges.push(newEdge);
          } else {
            var edKind = relKind(neighbor.Relationship, neighbor.DeviceType);
            var edgeData = {
              id: srcId + '>' + neighborId,
              label: lqiLabel,
              from: srcId,
              to: neighborId,
              length: isNaN(lqi) ? EDGE_LENGTH_SUB : lqi,
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

  // ── network building ──
  function buildNetwork(node) {
    var container = $(CANVAS_ID);
    if (!container) return;
    nodesDS = new vis.DataSet([]);
    edgesDS = new vis.DataSet([]);
    network = new vis.Network(container, { nodes: nodesDS, edges: edgesDS }, {
      interaction: { hover: true, dragNodes: true, dragView: true, zoomView: true },
      autoResize: true,
      nodes: { shape: 'box' },
      layout: { improvedLayout: false },
      physics: {
        enabled: true,
        stabilization: { enabled: true, iterations: 300, updateInterval: 25 }
      }
    });

    // Center once per load — when physics has settled.
    // reqMap resets the flag, so it will center after a manual refresh too.
    network.on('stabilized', function () {
      if (autoFitted || !network) return;
      autoFitted = true;
      try { network.fit(); } catch (e) {}
    });

    // Windows are divs inside the page: vis autoResize does not see their resize
    // (it watches only the browser window) — the canvas buffer desyncs from
    // the CSS size and clicks/drag miss. We sync manually.
    function syncSize() {
      if (!network) return;
      var w = container.clientWidth, h = container.clientHeight;
      if (!w || !h) return;
      try {
        network.setSize(w, h);
        network.redraw();
      } catch (e) {}
    }
    syncSize();
    if (typeof ResizeObserver === 'function') {
      try {
        if (node._state.mapRO) node._state.mapRO.disconnect();
        var ro = new ResizeObserver(function () {
          if (!node._state || node._state.destroyed || !network) return;
          syncSize();
        });
        ro.observe(container);
        node._state.mapRO = ro;
      } catch (e) {}
    }

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
        // Group node — no device widget, ignore
        if (typeof obj === 'string' && obj.indexOf('grp:') === 0) return;
        // Virtual node (BLE/MQTT without address) — IEEE embedded in id
        if (typeof obj === 'string' && obj.indexOf('virt:') === 0) {
          var vieee = obj.slice(5);
          var vdw = $(DEV_WID_ID);
          if (vdw) { vdw.innerHTML = getWidget(vieee); vdw.style.visibility = 'visible'; }
          return;
        }
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
      // Safety net: LQI responses never arrived — show at least the nodes and center
      if (mapLoading && messages2send.length) finishLoad();
    }, 3000);
  }

  // ── global buttons ──
  window.zigbeeMapRefresh = function () { if (network) { reqMap(); } };
  window.zigbeeMapToggleEdge = function (kind, on) { edgeFilter[kind] = on; if (network) redrawMap(); };

  var ZBM_CSS = '' +
    '[id="' + CANVAS_ID + '"]{position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;border:1px solid lightgray;}' +
    '[id="' + CANVAS_ID + '"] div.vis-network{width:100%;height:100%;background-color:darkgray;opacity:.99;}' +
    '[id="' + DEV_WID_ID + '"]:not(:focus){visibility:hidden;}' +
    '.zb-tgl{display:inline-flex;align-items:center;gap:3px;font-size:12px;color:inherit;cursor:pointer;margin-left:10px;}' +
    '.zb-tgl input{margin:0;cursor:pointer;}';

  // ── widget registration ──
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
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'bed\',this.checked)">прямые</label>' +
      '<label class="zb-tgl"><input type="checkbox" checked onchange="zigbeeMapToggleEdge(\'group\',this.checked)">группы</label></div>' +
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
        // deviceList arrived/updated after reload — rebuild the map
        if (network && deviceList && deviceList.length) reqMap();
      };
      if (window.eventE) {
        eventE.on('report', node._state.wsOnReport);
        eventE.on('LQI_RSP', node._state.wsOnLQI);
        eventE.on('updateDeviceList', node._state.wsOnDevList);
      }

      loadVis(function () {
        if (!node._state || node._state.destroyed) return;
        // Create the network after reflow: synchronously after appendChild the container
        // still has zero size and the vis canvas stays empty.
        var run = function () {
          if (!node._state || node._state.destroyed) return;
          buildNetwork(node);
        };
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(function () {
            if (!node._state || node._state.destroyed) return;
            requestAnimationFrame(run);
          });
        } else {
          setTimeout(run, 50);
        }
      });
    },

    activate() {
      // No fit: centering — only on load (stabilized/finishLoad).
      // fit on focus jerked the camera under the cursor — clicks and drag missed.
      if (network) {
        try {
          var c = $(CANVAS_ID);
          if (c && c.clientWidth && c.clientHeight) network.setSize(c.clientWidth, c.clientHeight);
          network.redraw();
        } catch (e) {}
      }
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
      autoFitted = false;
      mapLoading = false;
      if (node._state.mapRO) { try { node._state.mapRO.disconnect(); } catch (e) {} }
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