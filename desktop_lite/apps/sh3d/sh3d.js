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
  var doorStates = {};     // itemId -> { isOpen, baseTrs, closedTrs, openTrs, pivots }
  var glowStates = {};     // itemId -> { base, on, level }
  var itemIndex = {};      // itemId -> объект плана
  var started = false;
  var reportBound = false;
  var deviceListBound = false;

  function makeTransformation(name, matrix) {
    return {
      name: name,
      matrix: matrix,
      getName: function () { return this.name; },
      getMatrix: function () { return this.matrix; }
    };
  }

  function trName(tr) { return tr && (typeof tr.getName === 'function' ? tr.getName() : tr.name); }
  function trMatrix(tr) { return tr && (typeof tr.getMatrix === 'function' ? tr.getMatrix() : tr.matrix); }

  function cloneTrs(trs) {
    if (!trs || !trs.length) return [];
    var r = [];
    for (var i = 0; i < trs.length; i++) {
      var m = trMatrix(trs[i]);
      r.push(makeTransformation(trName(trs[i]), [[m[0][0], m[0][1], m[0][2], m[0][3]], [m[1][0], m[1][1], m[1][2], m[1][3]], [m[2][0], m[2][1], m[2][2], m[2][3]]]));
    }
    return r;
  }

  function readHingeTransforms3D(item) {
    var out = [];
    if (!item || !item.object3D) return out;
    (function walk(node, depth) {
      if (!node || depth > 18) return;
      try {
        var nm = node.getName && node.getName();
        if (nm && nm.indexOf('_transformation') >= 0 && typeof node.getTransform === 'function') {
          var name = nm.substring(0, nm.indexOf('_transformation'));
          if (name.indexOf('sweethome3d_hinge') === 0 || name.indexOf('sweethome3d_rail') === 0) {
            var t = mat4.create();
            node.getTransform(t);
            out.push(makeTransformation(name, [
              [t[0], t[4], t[8], t[12]],
              [t[1], t[5], t[9], t[13]],
              [t[2], t[6], t[10], t[14]]
            ]));
          }
        }
        var kids = node.getChildren ? node.getChildren() : null;
        if (kids) for (var i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
      } catch (e) {}
    })(item.object3D, 0);
    return out;
  }

  function worldMatrix(node) {
    var chain = [], n = node;
    while (n) {
      if (n.getTransform) { var t = mat4.create(); n.getTransform(t); chain.push(t); }
      n = n.getParent ? n.getParent() : null;
    }
    var m = mat4.create();
    for (var i = chain.length - 1; i >= 0; i--) mat4.mul(m, m, chain[i]);
    return m;
  }

  function collectHingePivots(item, out) {
    if (!item || !item.object3D) return;
    var hinges = [];
    (function walk(node, depth) {
      if (!node || depth > 18) return;
      try {
        var nm = node.getName && node.getName();
        if (nm && nm.indexOf('_transformation') >= 0 && typeof node.getTransform === 'function') {
          var name = nm.substring(0, nm.indexOf('_transformation'));
          if (name.indexOf('sweethome3d_hinge') === 0 || name.indexOf('sweethome3d_rail') === 0) hinges.push({ name: name, node: node });
        }
        var kids = node.getChildren ? node.getChildren() : null;
        if (kids) for (var i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
      } catch (e) {}
    })(item.object3D, 0);
    for (var h = 0; h < hinges.length; h++) {
      var hinge = hinges[h];
      var inv = mat4.create();
      if (!mat4.invert(inv, worldMatrix(hinge.node))) continue;
      var prefix = hinge.name + '_';
      var sum = [0, 0, 0], cnt = 0;
      (function walk2(node, depth) {
        if (!node || depth > 18) return;
        try {
          var nm = node.getName && node.getName();
          if (nm && nm.indexOf(prefix) === 0 && node.constructor && node.constructor.name === 'Shape3D' && /^\d+$/.test(nm.substring(prefix.length)) && typeof node.getBounds === 'function') {
            var bb = node.getBounds(), lo = vec3.create(), hi = vec3.create();
            bb.getLower(lo); bb.getUpper(hi);
            var cx = (lo[0] + hi[0]) / 2, cy = (lo[1] + hi[1]) / 2, cz = (lo[2] + hi[2]) / 2;
            var mw = worldMatrix(node);
            var wx = mw[0] * cx + mw[4] * cy + mw[8] * cz + mw[12];
            var wy = mw[1] * cx + mw[5] * cy + mw[9] * cz + mw[13];
            var wz = mw[2] * cx + mw[6] * cy + mw[10] * cz + mw[14];
            sum[0] += inv[0] * wx + inv[4] * wy + inv[8] * wz + inv[12];
            sum[1] += inv[1] * wx + inv[5] * wy + inv[9] * wz + inv[13];
            sum[2] += inv[2] * wx + inv[6] * wy + inv[10] * wz + inv[14];
            cnt++;
          }
          var kids2 = node.getChildren ? node.getChildren() : null;
          if (kids2) for (var j = 0; j < kids2.length; j++) walk2(kids2[j], depth + 1);
        } catch (e) {}
      })(item.object3D, 0);
      if (cnt) out[hinge.name] = [sum[0] / cnt, sum[1] / cnt, sum[2] / cnt];
    }
  }

  function findTransformNode(node, name, depth) {
    if (!node || depth > 16) return null;
    try {
      if (node.getName && node.getName() === name && typeof node.setTransform === 'function') return node;
      var kids = node.getChildren ? node.getChildren() : null;
      if (kids) for (var i = 0; i < kids.length; i++) {
        var r = findTransformNode(kids[i], name, depth + 1);
        if (r) return r;
      }
    } catch (e) {}
    return null;
  }

  function applyTrs3D(item, trs) {
    if (!item || !item.object3D || !trs || !trs.length) return false;
    var changed = false;
    for (var i = 0; i < trs.length; i++) {
      var name = trs[i].getName() + '_transformation';
      var node = findTransformNode(item.object3D, name, 0);
      if (!node) continue;
      var m = trs[i].getMatrix();
      var t = mat4.create();
      t[0] = m[0][0]; t[1] = m[1][0]; t[2] = m[2][0]; t[3] = 0;
      t[4] = m[0][1]; t[5] = m[1][1]; t[6] = m[2][1]; t[7] = 0;
      t[8] = m[0][2]; t[9] = m[1][2]; t[10] = m[2][2]; t[11] = 0;
      t[12] = m[0][3]; t[13] = m[1][3]; t[14] = m[2][3]; t[15] = 1;
      node.setTransform(t);
      changed = true;
    }
    if (changed && window.component3D && component3D.canvas3D && component3D.canvas3D.repaint) {
      component3D.canvas3D.repaint();
    }
    return changed;
  }

  function pinPivot(node, prefix, depth, acc) {
    if (!node || depth > 18) return;
    try {
      var n = node.getName && node.getName();
      if (n && n.indexOf(prefix) === 0 && node.constructor && node.constructor.name === 'Shape3D' && typeof node.getBounds === 'function') {
        var suffix = n.substring(prefix.length);
        if (/^\d+$/.test(suffix)) {
          var bb = node.getBounds(), lo = vec3.create(), hi = vec3.create();
          bb.getLower(lo); bb.getUpper(hi);
          acc.push([(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2]);
        }
      }
      var kids = node.getChildren ? node.getChildren() : null;
      if (kids) for (var i = 0; i < kids.length; i++) pinPivot(kids[i], prefix, depth + 1, acc);
    } catch (e) {}
  }

  function shapeNormalXZ(node) {
    var bb = node.getBounds(), lo = vec3.create(), hi = vec3.create();
    bb.getLower(lo); bb.getUpper(hi);
    var sizes = [Math.abs(hi[0] - lo[0]), Math.abs(hi[1] - lo[1]), Math.abs(hi[2] - lo[2])];
    var axis = 0;
    if (sizes[1] < sizes[axis]) axis = 1;
    if (sizes[2] < sizes[axis]) axis = 2;
    var v = [0, 0, 0]; v[axis] = 1;
    var m = worldMatrix(node);
    var wx = m[0] * v[0] + m[4] * v[1] + m[8] * v[2];
    var wz = m[2] * v[0] + m[6] * v[1] + m[10] * v[2];
    var len = Math.sqrt(wx * wx + wz * wz) || 1;
    return [wx / len, wz / len];
  }

  function findFrameAndLeaf(item) {
    if (!item || !item.object3D) return null;
    var frame = null, leaf = null, leafVol = -1;
    var pane = null, paneVol = -1;
    (function walk(node, depth) {
      if (!node || depth > 18) return;
      try {
        if (node.constructor && node.constructor.name === 'Shape3D' && typeof node.getBounds === 'function') {
          var nm = node.getName && node.getName();
          var bb, lo, hi, vol;
          if (nm === 'frame') {
            frame = node;
          } else if (nm && nm.indexOf('window_pane') >= 0) {
            bb = node.getBounds(); lo = vec3.create(); hi = vec3.create();
            bb.getLower(lo); bb.getUpper(hi);
            vol = Math.abs((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2]));
            if (vol > paneVol) { paneVol = vol; pane = node; }
          } else if (nm && nm.indexOf('sweethome3d_hinge') < 0 && nm.indexOf('handle') < 0) {
            bb = node.getBounds(); lo = vec3.create(); hi = vec3.create();
            bb.getLower(lo); bb.getUpper(hi);
            vol = Math.abs((hi[0] - lo[0]) * (hi[1] - lo[1]) * (hi[2] - lo[2]));
            if (vol > leafVol) { leafVol = vol; leaf = node; }
          }
        }
        var kids = node.getChildren ? node.getChildren() : null;
        if (kids) for (var i = 0; i < kids.length; i++) walk(kids[i], depth + 1);
      } catch (e) {}
    })(item.object3D, 0);
    if (pane) leaf = pane;
    return (frame && leaf) ? { frame: frame, leaf: leaf } : null;
  }

  function leafFrameAngle(item) {
    var fl = findFrameAndLeaf(item);
    if (!fl) return null;
    var nf = shapeNormalXZ(fl.frame);
    var nl = shapeNormalXZ(fl.leaf);
    if (!nf || !nl) return null;
    var dot = nf[0] * nl[0] + nf[1] * nl[1];
    var cross = nf[1] * nl[0] - nf[0] * nl[1];
    return Math.atan2(cross, dot);
  }

  function shapeCenterXZ(node) {
    var bb = node.getBounds(), lo = vec3.create(), hi = vec3.create();
    bb.getLower(lo); bb.getUpper(hi);
    var c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
    var m = worldMatrix(node);
    return [
      m[0] * c[0] + m[4] * c[1] + m[8] * c[2] + m[12],
      m[2] * c[0] + m[6] * c[1] + m[10] * c[2] + m[14]
    ];
  }

  function frameLeafDistance(item) {
    var fl = findFrameAndLeaf(item);
    if (!fl) return Infinity;
    var cf = shapeCenterXZ(fl.frame);
    var cl = shapeCenterXZ(fl.leaf);
    return Math.hypot(cf[0] - cl[0], cf[1] - cl[1]);
  }

  function parallelErr(d) {
    var a = Math.abs(d);
    if (a > Math.PI / 2) a = Math.PI - a;
    return a;
  }

  function measureLeafAngle(item) {
    var d = leafFrameAngle(item);
    return (d === null) ? 0 : d;
  }

  function trsToMat4(m) {
    var t = mat4.create();
    t[0] = m[0][0]; t[1] = m[1][0]; t[2] = m[2][0]; t[3] = 0;
    t[4] = m[0][1]; t[5] = m[1][1]; t[6] = m[2][1]; t[7] = 0;
    t[8] = m[0][2]; t[9] = m[1][2]; t[10] = m[2][2]; t[11] = 0;
    t[12] = m[0][3]; t[13] = m[1][3]; t[14] = m[2][3]; t[15] = 1;
    return t;
  }

  function mat4ToTrs(t) {
    return [
      [t[0], t[4], t[8], t[12]],
      [t[1], t[5], t[9], t[13]],
      [t[2], t[6], t[10], t[14]]
    ];
  }

  function rotateTrsWorld(trs, item, angleWorld, pivots) {
    var out = cloneTrs(trs);
    for (var i = 0; i < out.length; i++) {
      var n = out[i].getName();
      if (!n || (n.indexOf('sweethome3d_hinge') < 0 && n.indexOf('sweethome3d_rail') < 0)) continue;
      var pv = pivots && pivots[n];
      if (!pv) continue;
      var hingeNode = findTransformNode(item.object3D, n + '_transformation', 0);
      if (!hingeNode) continue;
      var M0 = trsToMat4(trs[i].matrix);
      var w0 = worldMatrix(hingeNode);
      var invM0 = mat4.create();
      if (!mat4.invert(invM0, M0)) continue;
      var P = mat4.create();
      mat4.mul(P, w0, invM0);
      var A = [
        w0[0] * pv[0] + w0[4] * pv[1] + w0[8] * pv[2] + w0[12],
        w0[1] * pv[0] + w0[5] * pv[1] + w0[9] * pv[2] + w0[13],
        w0[2] * pv[0] + w0[6] * pv[1] + w0[10] * pv[2] + w0[14]
      ];
      var R = mat4.create();
      mat4.fromYRotation(R, angleWorld);
      var T = mat4.create(); mat4.translate(T, T, A);
      var Tn = mat4.create(); mat4.translate(Tn, Tn, [-A[0], -A[1], -A[2]]);
      var M = mat4.create();
      mat4.mul(M, Tn, w0);
      mat4.mul(M, R, M);
      mat4.mul(M, T, M);
      var invP = mat4.create();
      if (!mat4.invert(invP, P)) continue;
      var Ml = mat4.create();
      mat4.mul(Ml, invP, M);
      out[i] = makeTransformation(n, mat4ToTrs(Ml));
    }
    return out;
  }

  function sashOpenAngle(item) {
    var s = item && item.getSashes ? item.getSashes() : null;
    if (!s || !s.length) return 0;
    return (s[0].endAngle || 0) - (s[0].startAngle || 0);
  }

  function findClosedTrs(item, base, pivots) {
    applyTrs3D(item, cloneTrs(base));
    var d0 = measureLeafAngle(item);

    applyTrs3D(item, cloneTrs(base));
    var c1 = rotateTrsWorld(base, item, -d0, pivots);
    applyTrs3D(item, c1);
    var dist1 = frameLeafDistance(item);
    var err1 = parallelErr(measureLeafAngle(item));

    applyTrs3D(item, cloneTrs(base));
    var c2 = rotateTrsWorld(base, item, -d0 + Math.PI, pivots);
    applyTrs3D(item, c2);
    var dist2 = frameLeafDistance(item);
    var err2 = parallelErr(measureLeafAngle(item));

    var pick;
    if (Math.abs(dist1 - dist2) < 5) pick = (err1 <= err2) ? c1 : c2;
    else pick = (dist1 < dist2) ? c1 : c2;
    applyTrs3D(item, pick);
    return pick;
  }

  function openTrs(trs, item, isOpen, pivots, forcedAngle) {
    var r = cloneTrs(trs);
    var sashes = item && item.getSashes ? item.getSashes() : null;
    if (!sashes || !sashes.length) return r;
    for (var i = 0; i < r.length; i++) {
      var n = r[i].getName();
      if (!n || (n.indexOf('sweethome3d_hinge') < 0 && n.indexOf('sweethome3d_rail') < 0)) continue;
      var idx = 0;
      var lc = n.charAt(n.length - 1);
      if (lc >= '0' && lc <= '9') idx = parseInt(lc) - 1;
      var sash = idx < sashes.length ? sashes[idx] : sashes[0];
      if (!sash) continue;
      var angle = (forcedAngle !== undefined) ? forcedAngle
        : ((isOpen !== false) ? sash.endAngle : sash.startAngle);
      var mirrored = !!(item && typeof item.isModelMirrored === 'function' && item.isModelMirrored());
      var m = r[i].matrix;
      var planPx = (sash.xAxis !== undefined && sash.xAxis !== null ? sash.xAxis : 0.5) - 0.5;
      var pv = pivots && pivots[n];
      var px, pz = 0;
      if (pv) {
        px = pv[0];
        pz = pv[2];
      } else {
        var pins = [];
        pinPivot(item.object3D, n + '_', 0, pins);
        if (pins.length) {
          var avgX = 0, avgZ = 0;
          for (var pi = 0; pi < pins.length; pi++) { avgX += pins[pi][0]; avgZ += pins[pi][2]; }
          px = avgX / pins.length;
          pz = avgZ / pins.length;
        } else {
          px = planPx;
        }
      }
      var divergent = (sash.width !== undefined && sash.width !== null && sash.width < 0.7 &&
                       Math.abs(px - planPx) > 0.15);
      if (forcedAngle === undefined && mirrored && !divergent) angle = -angle;
      var c = Math.cos(angle);
      var s = Math.sin(angle);
      var m00 = m[0][0], m01 = m[0][1], m02 = m[0][2];
      var m10 = m[1][0], m11 = m[1][1], m12 = m[1][2];
      var m20 = m[2][0], m21 = m[2][1], m22 = m[2][2];
      var t0x = m[0][3], t0y = m[1][3], t0z = m[2][3];
      var pwx = m00 * px + m02 * pz + t0x;
      var pwy = m10 * px + m12 * pz + t0y;
      var pwz = m20 * px + m22 * pz + t0z;
      var dx = t0x - pwx, dy = t0y - pwy, dz = t0z - pwz;
      var rx = c * dx + s * dz;
      var rz = -s * dx + c * dz;
      m[0] = [c * m00 + s * m20, c * m01 + s * m21, c * m02 + s * m22, pwx + rx];
      m[1] = [m10, m11, m12, pwy + dy];
      m[2] = [-s * m00 + c * m20, -s * m01 + c * m21, -s * m02 + c * m22, pwz + rz];
    }
    return r;
  }

  function rgb2color(r, g, b) { return (0xFF000000 | (r << 16) | (g << 8) | b) | 0; }

  function devClassOf(report, key) {
    try { return JSON.parse(report[key].role.split("&")[1]).device_class; } catch (e) { return ''; }
  }

  // ── реакция на события устройств (двери/окна, ярлыки, подсветка) ──
  var DOOR_CLASSES = { door: 1, window: 1, garage_door: 1, opening: 1 };

  function reportKeyOf(rep) {
    return rep.Object || rep.Obj || (rep.EndPoint + rep.ClusterId + rep.AttribId);
  }

  function entryValue(e) {
    if (!e) return '';
    if (e.parsed !== undefined && e.parsed !== null && e.parsed !== '') return e.parsed;
    return e.val;
  }

  function boolValue(e) {
    var v = entryValue(e);
    if (typeof v === 'string' && /^[0-9A-Fa-f]{1,2}$/.test(v)) {
      var n = parseInt(v, 16);
      if (!isNaN(n)) return n ? 1 : 0;
    }
    return v;
  }

  function isOnValue(v) {
    if (v === true || v === 1) return true;
    var s = String(v == null ? '' : v).trim().toLowerCase();
    return s === '1' || s === 'on' || s === 'true' || s === 'open';
  }

  function isOpenValue(v) {
    if (v === true || v === 1) return true;
    var s = String(v == null ? '' : v).trim().toLowerCase();
    return s === '1' || s === 'on' || s === 'true' || s === 'open' || s === 'opened';
  }

  function toLevel(v) {
    var n = parseFloat(v);
    if (!isFinite(n) || n < 0) return null;
    if (n > 100) n = n * 100 / 255;
    return Math.max(0, Math.min(100, n));
  }

  function entryDeviceClass(e) {
    if (!e) return '';
    try {
      if (typeof getDeviceClass === 'function') return String(getDeviceClass(e) || '').toLowerCase();
    } catch (err) {}
    try {
      if (e.class && e.class.device_class) return String(e.class.device_class).toLowerCase();
      var p = String(e.role || '').split('&');
      if (p.length > 1) {
        var parsed = JSON.parse(p[1]);
        if (parsed && parsed.device_class) return String(parsed.device_class).toLowerCase();
      }
      return String(p[0] || '').toLowerCase();
    } catch (err2) { return ''; }
  }

  function isDoorEntry(e) {
    if (!e) return false;
    if (DOOR_CLASSES[entryDeviceClass(e)]) return true;
    var role = String(e.role || '').split('&')[0].toLowerCase();
    return role === 'binary_sensor' && /door|window|contact|окн|двер|open/i.test(String(e.label || ''));
  }

  function findDoorEntry(dev) {
    var report = (dev && dev.Report) || {};
    for (var k in report) {
      if (isDoorEntry(report[k])) return { key: k, entry: report[k] };
    }
    return null;
  }

  function isLevelEntry(key, e) {
    if (!e) return false;
    var cls = e.class || {};
    if (cls.light_part === 'level') return true;
    var role = String(e.role || '').split('&')[0];
    if (role === 'light_level') return true;
    var k = String(key || '').toUpperCase();
    return k.length >= 10 && k.substr(2, 4) === '0008' && role === 'light';
  }

  function isOnOffEntry(key, e) {
    if (!e || isDoorEntry(e)) return false;
    var cls = e.class || {};
    if (cls.light_part === 'onoff') return true;
    if (String(e.role || '').split('&')[0] === 'light_onoff') return true;
    var k = String(key || '').toUpperCase();
    return k.length >= 10 && k.substr(2, 4) === '0006' && k.substr(6, 4) === '0000';
  }

  function devState(dev) {
    var report = (dev && dev.Report) || {};
    var out = { has: false, on: false, level: null };
    for (var k in report) {
      if (isOnOffEntry(k, report[k])) {
        out.has = true;
        if (isOnValue(boolValue(report[k]))) out.on = true;
      }
    }
    for (var lk in report) {
      if (!isLevelEntry(lk, report[lk])) continue;
      var lvl = toLevel(entryValue(report[lk]));
      if (lvl === null) continue;
      out.level = (out.level === null) ? lvl : Math.max(out.level, lvl);
    }
    return out;
  }

  function itemState(itemId) {
    var out = { any: false, on: false, level: null };
    for (var i = 0; i < deviceList.length; i++) {
      var dev = deviceList[i];
      if (!dev || dev.sh3d !== itemId) continue;
      var st = devState(dev);
      if (!st.has) continue;
      out.any = true;
      if (!st.on) continue;
      out.on = true;
      if (st.level !== null) out.level = (out.level === null) ? st.level : Math.max(out.level, st.level);
    }
    if (out.on && out.level === 0) out.on = false;
    return out;
  }

  function itemDoorOpen(itemId) {
    var out = { has: false, open: false };
    for (var i = 0; i < deviceList.length; i++) {
      var dev = deviceList[i];
      if (!dev || dev.sh3d !== itemId) continue;
      var d = findDoorEntry(dev);
      if (!d) continue;
      out.has = true;
      if (isOpenValue(boolValue(d.entry))) out.open = true;
    }
    return out;
  }

  function rebuildItemIndex() {
    itemIndex = {};
    if (!hpc) return;
    var arr = hpc.getComponent3D().homeObjects;
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (it && it.id) itemIndex[it.id] = it;
    }
  }

  function findItemById(id) {
    if (!id) return null;
    if (itemIndex[id]) return itemIndex[id];
    if (!hpc) return null;
    var arr = hpc.getComponent3D().homeObjects;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) { itemIndex[id] = arr[i]; return arr[i]; }
    }
    return null;
  }

  function warmColor(level) {
    var t = (level === null || level === undefined) ? 1 : Math.min(1, Math.max(0, level / 100));
    t = Math.max(0.15, t);
    return rgb2color(255, Math.round(150 + 100 * t), Math.round(40 + 150 * t));
  }

  function applyGlow(item, state) {
    if (!item || !window.component3D) return;
    var st = glowStates[item.id];
    if (!st) {
      st = glowStates[item.id] = {
        base: (typeof item.getColor === 'function') ? item.getColor() : null,
        on: null,
        level: null
      };
    }
    if (st.on === state.on && st.level === state.level) return;
    st.on = state.on;
    st.level = state.level;
    item.color = state.on ? warmColor(state.level) : st.base;
    component3D.updateObjects([item]);
  }

  function applyDoorState(item, open) {
    if (!item || !item.object3D || !item.object3D.userData || !window.component3D) return;
    var cat = (typeof item.getCatalogId === 'function') ? String(item.getCatalogId()) : '';
    var st = doorStates[item.id];
    if (!st || !st.baseTrs) {
      var base = item.object3D.userData.getModelTransformations();
      if (!base || !base.length) base = readHingeTransforms3D(item);
      st = doorStates[item.id] = {
        isOpen: false,
        baseTrs: cloneTrs(base),
        closedTrs: [],
        openTrs: [],
        pivots: {}
      };
      collectHingePivots(item, st.pivots);
      if (!st.baseTrs.length) return;
      applyTrs3D(item, st.baseTrs);
      var a0 = measureLeafAngle(item);
      if (cat.indexOf('openDoor') >= 0) {
        st.closedTrs = cloneTrs(st.baseTrs);
        st.openTrs = openTrs(st.baseTrs, item, true, st.pivots);
      } else {
        st.closedTrs = findClosedTrs(item, st.baseTrs, st.pivots);
        if (a0 !== null && Math.abs(a0) > Math.PI / 4) {
          st.openTrs = cloneTrs(st.baseTrs);
        } else {
          var ang = sashOpenAngle(item);
          if (a0 !== null && Math.abs(a0) > 0.1) ang = (a0 < 0 ? -1 : 1) * Math.abs(ang);
          st.openTrs = rotateTrsWorld(st.closedTrs, item, ang, st.pivots);
        }
      }
    }
    if (!st.closedTrs.length || !st.openTrs.length) return;
    if (!applyTrs3D(item, open === false ? st.closedTrs : st.openTrs)) return;
    st.isOpen = open;
  }

  function refreshItem(itemId) {
    var item = findItemById(itemId);
    if (!item || !window.component3D) return;
    var id = String(item.id || '');
    if (id.indexOf('doorOrWindow') === 0) {
      var ds = itemDoorOpen(id);
      if (ds.has) applyDoorState(item, ds.open);
      return;
    }
    if (id.indexOf('label') === 0 || id.indexOf('room') === 0) return;
    var st = itemState(id);
    if (st.any) applyGlow(item, st);
  }

  function applyAllStates() {
    if (!hpc) return;
    rebuildItemIndex();
    var arr = hpc.getComponent3D().homeObjects;
    for (var j = 0; j < arr.length; j++) {
      var o = arr[j];
      if (String(o.id || '').indexOf('doorOrWindow') !== 0) continue;
      applyDoorState(o, false);
    }
    var seen = {};
    for (var i = 0; i < deviceList.length; i++) {
      var sh = deviceList[i] && deviceList[i].sh3d;
      if (sh) seen[sh] = 1;
    }
    for (var id in seen) refreshItem(id);
  }

  function zespEvt(data) {
    if (!data || !data[0] || !hpc) return;
    var rep = data[0];
    var obj = reportKeyOf(rep);
    var dev;
    for (var di = 0; di < deviceList.length; di++) {
      if (deviceList[di].IEEE == rep.IEEE) { dev = deviceList[di]; break; }
    }
    if (!dev || !dev.sh3d) return;
    var eItem = findItemById(dev.sh3d);
    if (!eItem) return;

    var id = String(eItem.id || '');
    var entry = dev.Report && dev.Report[obj];

    if (id.indexOf('doorOrWindow') === 0) {
      if (entry && isDoorEntry(entry)) refreshItem(id);
      return;
    }

    if (id.indexOf('label') === 0) {
      var txt = dev.Name + "\n";
      for (var key in dev.Report) {
        var v = dev.Report[key];
        var dc = devClassOf(dev.Report, key);
        txt += geticon(dc) + "\t" + v.label + "\t\t:\t" + (obj == key ? rep.parsed : v.parsed) + "\n";
      }
      eItem.text = txt;
      if (window.component3D) component3D.updateObjects([eItem]);
      return;
    }

    if (entry && (isOnOffEntry(obj, entry) || isLevelEntry(obj, entry))) {
      refreshItem(id);
      return;
    }

    var prev = (typeof eItem.getColor === 'function') ? eItem.getColor() : null;
    eItem.color = rgb2color(255, 255, 0);
    if (window.component3D) component3D.updateObjects([eItem]);
    setTimeout(function () {
      eItem.color = prev;
      if (window.component3D) component3D.updateObjects([eItem]);
    }, 200);
  }

  // ── привязка устройства к объекту плана ──
  function bindItem(IEEE, itemId) {
    // Один объект может быть привязан к нескольким устройствам.
    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i].IEEE == IEEE) {
        deviceList[i].sh3d = itemId;
        edDevUpdate(i);
      }
    }
    refreshItem(itemId);
    var dv = document.getElementById(VIEWER_DIV_ID);
    if (dv) dv.style.visibility = "hidden";
  }

  function edDevUpdate(i) {
    try {
      var dev = deviceList[i];
      WSsend('SaveJson|/Devices/' + dev.IEEE + '|' + JSON.stringify(dev));
    } catch (e) { console.log('sh3d save err:', e); }
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

  function hasHingeNode(item) {
    return !!(item && item.object3D && findTransformNode(item.object3D, 'sweethome3d_hinge_1_transformation', 0));
  }

  function nearestHingedDoor(from) {
    if (!from || !hpc) return null;
    var best = null, bestD = 300;
    var arr = hpc.getComponent3D().homeObjects;
    for (var i = 0; i < arr.length; i++) {
      var o = arr[i];
      if (o === from || String(o.id || '').indexOf('doorOrWindow') !== 0) continue;
      if (!hasHingeNode(o)) continue;
      var dx = (o.getX ? o.getX() : 0) - (from.getX ? from.getX() : 0);
      var dy = (o.getY ? o.getY() : 0) - (from.getY ? from.getY() : 0);
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  function action(x, y) {
    var item = hpc.getComponent3D().getClosestItemAt(x, y);
    if (!item) return;
    var widget = item.id.split("-")[0];
    switch (widget) {
      case 'doorOrWindow': {
        var target = hasHingeNode(item) ? item : nearestHingedDoor(item);
        if (target) {
          var dst = doorStates[target.id];
          applyDoorState(target, dst ? !dst.isOpen : false);
        }
        break;
      }
      default: {
        var prevColor = (typeof item.getColor === 'function') ? item.getColor() : null;
        item.color = rgb2color(255, 255, 0);
        component3D.updateObjects([item]);
        setTimeout(function () {
          item.color = prevColor;
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
          rebuildItemIndex();
          applyAllStates();
          setTimeout(function () { if (hpc) applyAllStates(); }, 600);
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
          if (window.eventE && !deviceListBound) {
            eventE.on('updateDeviceList', applyAllStates);
            deviceListBound = true;
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
      if (window.eventE && deviceListBound) {
        eventE.off('updateDeviceList', applyAllStates);
        deviceListBound = false;
      }
      if (node._state && node._state.ro) node._state.ro.disconnect();
      node._state = null;
      started = false;
      hpc = null;
      doorStates = {};
      glowStates = {};
      itemIndex = {};
      [CANVAS_ID, PROGRESS_DIV_ID, DEV_WIDGET_ID, VIEWER_DIV_ID, LIST_ID].forEach(function (id) {
        var el = document.getElementById(id);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      });
    }
  });
})();