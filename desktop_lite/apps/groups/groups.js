// groups.js — "Groups" app: Zigbee group administration.
// GRP devices (Devices/GROUP_XXXX from Devtemplates/GROUP).
// Entry points: WinEngine.open('groups') or WinEngine.open('groups', {params: ieee})
// (preselect a device to add).
// Dependencies: socket.js (WSsend/SaveJson/eventE/deviceList/groups), zesp-globals.js (L).
var grp_node = null;
var grp_bodyEl = null;

function grpCloseWindow() { if (window.WinEngine && grp_node) { try { WinEngine.close(grp_node); } catch (e) {} } }
function grpSetTitle(a) { var t = grp_node && grp_node.querySelector('.wtitle'); if (t && a && a.length) t.textContent = a[0]; }

// ---------- state ----------
window.grp_state = window.grp_state || { tpl: null, migDone: false, atgIeee: null, atgNew: false };

// ---------- helpers ----------
function grpList() {
  return (window.deviceList || []).filter(function (z) { return z.DevType === 'GRP'; });
}
function grpEscape(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function grpRefresh() {
  var el = document.getElementById('grp_table');
  if (!el) return;
  var list = grpList();
  var html = '<table style="width:100%;border-collapse:collapse;font-size:13px">';
  for (var i = 0; i < list.length; i++) {
    var g = list[i];
    var members = g.Members || [];
    html += '<tr style="cursor:pointer;border-bottom:1px solid var(--border2)" title="Показать слушателей" onclick="grpToggle(' + i + ')">' +
      '<td style="padding:5px 6px;color:var(--accent);font-family:monospace">' + grpEscape(g.Device || '') + '</td>' +
      '<td style="padding:5px 6px;width:100%">' + grpEscape(g.Name || '') +
      ' <span style="color:var(--text-muted)">(' + members.length + ')</span></td>' +
      '<td style="white-space:nowrap">' +
      '<button class="g-btn" onclick="event.stopPropagation();grpEdit(\'' + grpEscape(g.IEEE) + '\')" title="Полный редактор">✏️</button> ' +
      '<button class="g-btn" onclick="event.stopPropagation();grpDel(\'' + grpEscape(g.IEEE) + '\')" title="Удалить группу">🗑</button></td></tr>';
    html += '<tr id="grp_m_' + i + '" style="display:none"><td></td><td colspan="2" style="font-size:12px;padding:2px 6px 8px 6px">' +
      grpMembersHtml(members) + '</td></tr>';
  }
  html += '</table>';
  if (!list.length) html += '<div style="color:var(--text-muted);font-size:12px;padding:8px">— пусто —</div>';
  el.innerHTML = html;
}
function grpToggle(i) {
  var r = document.getElementById('grp_m_' + i);
  if (r) r.style.display = (r.style.display === 'none' ? '' : 'none');
}
function grpMembersHtml(members) {
  if (!members || !members.length) return '<span style="color:var(--text-muted)">— пусто —</span>';
  return members.map(function (ieee) {
    var d = (window.deviceList || []).find(function (z) { return z.IEEE === ieee; });
    if (d) return '<div>· ' + grpEscape(d.Name || d.ModelId || ieee) +
      ' <button class="g-btn" onclick="grpKick(\'' + grpEscape(grpMemberGroup(ieee)) + '\',\'' + grpEscape(ieee) + '\')" title="Убрать из группы">×</button></div>';
    return '<div>· ' + grpEscape(ieee) + ' <span style="color:var(--red)">(нет в сети)</span></div>';
  }).join('');
}
// Listener's group — for the × button (first match)
function grpMemberGroup(ieee) {
  var gs = grpList();
  for (var i = 0; i < gs.length; i++) {
    if ((gs[i].Members || []).indexOf(ieee) !== -1) return gs[i].IEEE;
  }
  return '';
}
// Ключ объекта-держателя групп на EP: существующий 0004* либо новый EP+'00040000'
function grpHolderKey(dev, ep) {
  ep = String(ep || '').toUpperCase();
  var keys = Object.keys(dev.Report || {});
  for (var i = 0; i < keys.length; i++) {
    var k = String(keys[i]).toUpperCase();
    if (k.length >= 6 && k.substring(0, 2) === ep && k.substring(2, 6) === '0004') return keys[i];
  }
  return ep + '00040000';
}
function grpEnsureHolder(dev, ep) {
  var key = grpHolderKey(dev, ep);
  dev.Report = dev.Report || {};
  if (!dev.Report[key]) {
    dev.Report[key] = { label: 'Groups', role: 'sensor', class: { entity_category: 'config' }, dataType: '18', val: '', mat: '1', parsed: '', retain: '0', ya_rep: 'none', polling: 0, debounce: 0, groups: [] };
  }
  if (!Array.isArray(dev.Report[key].groups)) dev.Report[key].groups = [];
  return key;
}
function grpSyncParsed(dev, key) {
  try {
    var g = dev.Report[key].groups || [];
    dev.Report[key].parsed = g.join(',');
    dev.Report[key].val = dev.Report[key].parsed;
  } catch (e) {}
}
// Remove a listener: from the group Members + drop membership from Report 0004-objects + live remove
function grpKick(gIeee, ieee) {
  if (!gIeee || !ieee) return;
  try {
    if (window.grpRemoveMember) window.grpRemoveMember(gIeee, ieee);
  } catch (e) {}
  try {
    var g = grpList().find(function (x) { return x.IEEE === gIeee; });
    var gAddr = g ? g.Device : '';
    var d = (window.deviceList || []).find(function (x) { return x.IEEE === ieee; });
    eventE.once('deviceFile:/Devices/' + ieee, function (data) {
      try {
        if (!data || data === 'NULL') return;
        var dev = JSON.parse(data);
        var removed = [];
        Object.keys(dev.Report || {}).forEach(function (k) {
          var arr = dev.Report[k].groups;
          if (!Array.isArray(arr) || arr.indexOf(gAddr) === -1) return;
          dev.Report[k].groups = arr.filter(function (a) { return a !== gAddr; });
          grpSyncParsed(dev, k);
          removed.push(k.substring(0, 2));
        });
        if (!removed.length) return;
        SaveJson('/Devices/' + ieee, JSON.stringify(dev));
        // Live command to the device — per EP of each removed membership
        if (d && d.Device) removed.forEach(function (ep) {
          WSsend('groupRemove|' + d.Device + '|' + ep + '|' + gAddr);
        });
      } catch (e) {}
    });
    WSsend('LoadJson|/Devices/' + ieee);
  } catch (e) {}
  setTimeout(grpRefresh, 800);
}
function grpEdit(ieee) {
  if (window.WinEngine) WinEngine.open('templateedit', { params: '1#' + ieee });
}

// ---------- create / delete ----------
function grpCreate(adr, name, cb) {
  adr = (adr || '').toUpperCase();
  if (!/^[0-9A-F]{4}$/.test(adr)) { window.zespAlert && zespAlert('Адрес группы — 4 hex-символа', { title: 'Группы' }); return; }
  var ieee = 'GROUP_' + adr;
  var dup = grpList().some(function (z) { return z.IEEE === ieee; });
  if (dup) { if (cb) cb(ieee, adr); return; }
  function doCreate() {
    var g = JSON.parse(JSON.stringify(window.grp_state.tpl));
    g.Device = adr; g.IEEE = ieee;
    if (name) g.Name = name;
    g.Members = [];
    WSsend('SaveJson|/Devices/' + ieee + '|' + JSON.stringify(g));
    if (cb) eventE.once('updateDeviceList', function () { cb(ieee, adr); });
  }
  if (window.grp_state.tpl) { doCreate(); return; }
  eventE.once('deviceFile:/Devtemplates/GROUP', function (data) {
    if (!data || data === 'NULL') { window.zespAlert && zespAlert('Нет шаблона Devtemplates/GROUP', { title: 'Группы' }); return; }
    try { window.grp_state.tpl = JSON.parse(data); } catch (e) { return; }
    doCreate();
  });
  WSsend('LoadJson|/Devtemplates/GROUP');
}
function grpAdd() {
  var adrEl = document.getElementById('grp_adress');
  var nameEl = document.getElementById('grp_name');
  var adr = adrEl ? adrEl.value.padStart(4, '0').toUpperCase() : '';
  var name = nameEl ? nameEl.value : '';
  if (!name) return;
  grpCreate(adr, name, function () {
    grpRefresh();
    if (adrEl) adrEl.value = '';
    if (nameEl) nameEl.value = '';
  });
}
function grpDel(ieee) {
  var g = grpList().find(function (z) { return z.IEEE === ieee; });
  if (!g) return;
  var members = g.Members || [];
  // Refuse a non-empty one: remove listeners first (× on each)
  if (members.length) {
    var names = members.map(function (m) {
      var d = (window.deviceList || []).find(function (z) { return z.IEEE === m; });
      return '· ' + (d ? (d.Name || d.ModelId || m) : m);
    }).join('\n');
    if (window.zespAlert) zespAlert('В группе ' + members.length + ' слушателей. Сначала уберите их (× у каждого):\n' + names, { title: 'Удаление группы' });
    return;
  }
  WSsend('removeDevice|' + (g.Device || '') + '|' + ieee + '|force');
  eventE.once('updateDeviceList', function () { grpRefresh(); });
}
// One-time migration legacy groups.json → GROUP files
function grpMigrate() {
  if (window.grp_state.migDone) return; window.grp_state.migDone = true;
  try {
    eventE.once('groups', function (data) {
      try {
        (data || []).forEach(function (gr) {
          var adr = (gr.adress || '').toUpperCase();
          if (!/^[0-9A-F]{4}$/.test(adr)) return;
          var exists = grpList().some(function (z) { return (z.Device || '').toUpperCase() === adr; });
          if (!exists) grpCreate(adr, gr.name || adr);
        });
        setTimeout(grpRefresh, 1500);
      } catch (e) {}
    });
    WSsend('LoadJson|/groups.json');
  } catch (e) {}
}

// ---------- adding a device to a group ----------
function grpEpList(ieee) {
  var eps = [];
  try {
    var d = (window.deviceList || []).find(function (x) { return x.IEEE === ieee; });
    if (d && d.EP) for (var k in d.EP) {
      var cl = (d.EP[k].ClI || []).concat(d.EP[k].ClO || []);
      var has4 = cl.some(function (c) { return String(c).toUpperCase() === '0004'; });
      eps.push({ ep: k, has4: has4 });
    }
    eps.sort(function (a, b) { return ((b.has4 ? 1 : 0) - (a.has4 ? 1 : 0)); });
  } catch (e) {}
  return eps;
}
function grpAddToUI(ieee) {
  var d = (window.deviceList || []).find(function (x) { return x.IEEE === ieee; });
  if (!d) return;
  window.grp_state.atgIeee = ieee;
  var nm = document.getElementById('grp_atg_name');
  if (nm) nm.textContent = d.Name || d.IEEE;
  var gs = document.getElementById('grp_atg_group');
  if (gs) {
    gs.innerHTML = grpList().map(function (g) {
      return '<option value="' + grpEscape(g.IEEE) + '">' + grpEscape((g.Device || '') + ' — ' + (g.Name || '')) + '</option>';
    }).join('') + '<option value="NEW">+ новая…</option>';
  }
  var es = document.getElementById('grp_atg_ep');
  if (es) {
    es.innerHTML = grpEpList(ieee).map(function (e) {
      return '<option value="' + e.ep + '">EP ' + e.ep + (e.has4 ? ' · 0004' : '') + '</option>';
    }).join('');
  }
  grpAtgToggle(true);
  var box = document.getElementById('grp_addbox');
  if (box) box.style.display = 'flex';
}
function grpAtgToggle(reset) {
  var s = document.getElementById('grp_atg_group');
  var box = document.getElementById('grp_atg_new');
  if (reset) window.grp_state.atgNew = false;
  else window.grp_state.atgNew = !!(s && s.value === 'NEW');
  if (box) box.style.display = window.grp_state.atgNew ? 'flex' : 'none';
}
function grpAddToDo() {
  var d = (window.deviceList || []).find(function (x) { return x.IEEE === window.grp_state.atgIeee; });
  if (!d) return;
  var gselEl = document.getElementById('grp_atg_group');
  var epEl = document.getElementById('grp_atg_ep');
  var gsel = gselEl ? gselEl.value : '';
  var ep = epEl ? epEl.value : '';
  if (!ep) return;
  function done(gIeee, gAddr) {
    try {
      eventE.once('deviceFile:/Devices/' + d.IEEE, function (data) {
        try {
          if (!data || data === 'NULL') return;
          var dev = JSON.parse(data);
          var key = grpEnsureHolder(dev, ep);
          if (dev.Report[key].groups.indexOf(gAddr) === -1) dev.Report[key].groups.push(gAddr);
          grpSyncParsed(dev, key);
          SaveJson('/Devices/' + d.IEEE, JSON.stringify(dev));
        } catch (e) {}
      });
      WSsend('LoadJson|/Devices/' + d.IEEE);
    } catch (e) {}
    if (d.Device) WSsend('groupAdd|' + d.Device + '|' + ep + '|' + gAddr);
    try {
      var ecl = [];
      if (d.EP && d.EP[ep]) ecl = (d.EP[ep].ClI || []).concat(d.EP[ep].ClO || []);
      if (window.grpExtendSurface) window.grpExtendSurface(gIeee, d.IEEE, ecl);
    } catch (e) {}
    var box = document.getElementById('grp_addbox');
    if (box) box.style.display = 'none';
    setTimeout(grpRefresh, 800);
  }
  if (gsel === 'NEW') {
    var nnmEl = document.getElementById('grp_atg_newname');
    var nadEl = document.getElementById('grp_atg_newaddr');
    var nnm = nnmEl ? nnmEl.value : '', nad = nadEl ? nadEl.value.toUpperCase() : '';
    if (!nnm || !/^[0-9A-F]{4}$/.test(nad)) return;
    grpCreate(nad, nnm, function (ieee, adr) { done(ieee, adr); });
  } else {
    var g = grpList().find(function (x) { return x.IEEE === gsel; });
    if (!g) return;
    done(g.IEEE, g.Device);
  }
}

// ---------- window frame ----------
var GRP_CSS = '\n' +
  '.g-btn{padding:2px 8px;font-size:12px;border:1px solid var(--border2);border-radius:4px;background:var(--bg3);cursor:pointer;color:var(--text);white-space:nowrap}\n' +
  '.g-btn:hover{background:var(--hover)}\n' +
  '.g-btn-primary{background:var(--accent);color:#fff;border-color:var(--accent)}\n' +
  '.g-input{border:1px solid var(--border2);border-radius:4px;padding:3px 6px;font-size:12px;background:var(--bg1);color:var(--text)}\n' +
  '#grp_addbox{display:none;flex-direction:column;gap:8px;border:1px solid var(--border2);border-radius:6px;padding:8px;margin-bottom:8px;background:var(--bg2)}\n';

var GRP_BODY = '' +
  '<div style="padding:8px;display:flex;flex-direction:column;gap:8px;height:100%;box-sizing:border-box;overflow-y:auto">' +
  '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">' +
  '<span style="color:var(--text-muted);font-size:12px">id</span>' +
  '<input id="grp_adress" class="g-input" style="width:64px">' +
  '<span style="color:var(--text-muted);font-size:12px">Name</span>' +
  '<input id="grp_name" class="g-input" style="flex:1;min-width:120px">' +
  '<button class="g-btn g-btn-primary" onclick="grpAdd()" title="Создать группу">+</button></div>' +
  '<div id="grp_addbox">' +
  '<div>Устройство: <b id="grp_atg_name">—</b></div>' +
  '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:12px">Группа</span>' +
  '<select id="grp_atg_group" class="g-input" style="flex:1" onchange="grpAtgToggle()"></select></div>' +
  '<div id="grp_atg_new" style="display:none;gap:6px;align-items:center">' +
  '<input id="grp_atg_newname" class="g-input" style="flex:1" placeholder="Имя новой группы">' +
  '<input id="grp_atg_newaddr" class="g-input" style="width:70px" placeholder="Addr"></div>' +
  '<div style="display:flex;gap:6px;align-items:center"><span style="font-size:12px">EP</span>' +
  '<select id="grp_atg_ep" class="g-input" style="flex:1"></select>' +
  '<button class="g-btn g-btn-primary" onclick="grpAddToDo()">Добавить</button></div>' +
  '</div>' +
  '<div id="grp_table" style="overflow-y:auto"></div>' +
  '</div>';

window.WinEngine && window.WinEngine.register({
  id: 'groups',
  title: 'Группы',
  label: 'Группы',
  icon: '<img src="/static/icons/link.svg" alt="">',
  single: true,
  template: '<div class="window hidden" data-x="140" data-y="60" data-w="560" data-h="520">' +
    '<style>' + GRP_CSS + '</style>' +
    '<div class="window-head"><span class="wtitle title">Группы</span>' +
    '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
    '<button class="wbtn max" data-waction="max">▢</button>' +
    '<button class="wbtn" data-waction="close">✕</button></div></div>' +
    '<div class="window-body" style="padding:0">' + GRP_BODY + '</div>' +
    '</div>',
  setup: function (node, opts) {
    grp_node = node; window.grp_body = node.querySelector('.window-body');
    node._state = {};
    grpRefresh();
    grpMigrate();
    if (window.eventE) {
      node._state.upd = function () { grpRefresh(); };
      eventE.on('updateDeviceList', node._state.upd);
    }
    // params = device IEEE for quick add
    try {
      var p = (opts && opts.params) || '';
      if (p && p !== 'new') grpAddToUI(p);
    } catch (e) {}
  },
  destroy: function (node) {
    try { if (node._state && node._state.upd && window.eventE) eventE.off('updateDeviceList', node._state.upd); } catch (e) {}
    grp_node = null;
  }
});
