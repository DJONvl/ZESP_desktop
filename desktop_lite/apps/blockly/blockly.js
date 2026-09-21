// blockly.js — виджет «Blockly» (порт static/apps/blockly.app на WinEngine).
// Редактор блоков ZESP: workspace.xml + toolbox.xml, генерация категорий из deviceList,
// переключатель Blockly/JS (ace), экспорт XML/PNG, подсветка по событию report,
// сохранение в workspace.xml + script.js (SaveJson) + WSsend('initBlockly').
// Зависимости: blockly.js, msg/ru.js (MSG), ace.js, custom_blockly.js, socket.js, deviceList.

(function () {
  'use strict';

  var CSS = `
.bl-btns{display:flex;align-items:center;gap:4px;padding:4px 8px;border-bottom:1px solid var(--border);background:var(--bg3);flex-shrink:0}
.bl-btns button{background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:5px 10px;cursor:pointer;font-size:12px;border-radius:4px}
.bl-btns button:hover{background:var(--hover)}
.bl-area{position:relative;flex:1;min-height:0;overflow:hidden}
.bl-div{position:absolute;inset:0}
.bl-js{position:absolute;inset:0;display:none}
#toolbox,#workspaceBlocks,xml{display:none!important}
.blockly-custom-highlight > path.blocklyPath{stroke:#84ff00!important;stroke-width:5px!important;stroke-linejoin:round!important;paint-order:stroke!important;filter:drop-shadow(0 0 5px #84ff00) drop-shadow(0 0 10px #1aff00);animation:bl-gentle-pulse 2s ease-in-out infinite}
@keyframes bl-gentle-pulse{0%,100%{stroke-width:2px;filter:drop-shadow(0 0 2px #84ff00) drop-shadow(0 0 8px #1aff00)}50%{stroke-width:5px;filter:drop-shadow(0 0 2px #84ff00) drop-shadow(0 0 8px #1aff00)}}
`;

  var ws = null;        // Blockly workspace
  var editor = null;    // ace editor
  var exiting = false;

  // ---------- подсветка по событию report ----------
  function evtReport(data) {
    var ieee;
    if (data && data.length > 0) ieee = data[0].IEEE || data[1];
    if (ieee) highlightBlocks(ieee, 1500);
  }
  function highlightBlocks(ieee, duration) {
    if (!ws) return;
    var blocks = ws.getAllBlocks();
    var hl = [];
    blocks.forEach(function (b) {
      b.setHighlighted(false);
      var r = b.getSvgRoot();
      if (r) r.classList.remove('blockly-custom-highlight');
    });
    blocks.forEach(function (b) {
      var f = b.getField('ieee');
      if (f && f.getValue() === ieee) {
        var r = b.getSvgRoot();
        if (r) { r.classList.add('blockly-custom-highlight'); hl.push(b); }
        b.setHighlighted(true);
      }
    });
    if (hl.length) setTimeout(function () {
      hl.forEach(function (b) {
        b.setHighlighted(false);
        var r = b.getSvgRoot();
        if (r) r.classList.remove('blockly-custom-highlight');
      });
    }, duration);
  }

  // ---------- модалки экспорта/импорта ----------
  function modal(html) {
    var d = document.createElement('div');
    d.innerHTML = '<div style="position:fixed;inset:0;background:#0008;display:flex;align-items:center;justify-content:center;z-index:9999">' +
      '<div style="background:var(--bg2);border:1px solid var(--border2);color:var(--text);padding:20px;border-radius:10px;max-width:700px;width:90%">' + html + '</div></div>';
    document.body.appendChild(d);
    return d;
  }

  function extractXmlFromText(text) {
    if (!text) return null;
    var c = text.trim();
    var m = c.match(/```xml\s*([\s\S]*?)\s*```/);
    if (m) c = m[1].trim();
    m = c.match(/```\s*([\s\S]*?)\s*```/);
    if (m) c = m[1].trim();
    if ((c.charAt(0) === '"' && c.charAt(c.length - 1) === '"') || (c.charAt(0) === "'" && c.charAt(c.length - 1) === "'")) c = c.slice(1, -1);
    c = c.replace(/\\"/g, '"').replace(/\\'/g, "'");
    c = c.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').trim();
    if (c.indexOf('<block') === 0 || c.indexOf('<xml') === 0) return c;
    var bm = c.match(/<block[\s>][\s\S]*<\/block>/);
    if (bm) return bm[0];
    return null;
  }

  function exportXml(block) {
    var xml = Blockly.Xml.domToPrettyText(Blockly.Xml.blockToDom(block, true)).replace(/ id="\d+"/g, '');
    var w = modal('<h3>XML Blockly</h3><textarea id="blXmlTextarea" style="width:100%;height:300px;font-family:monospace;background:var(--bg);color:var(--text);border:1px solid var(--border2);padding:8px">' +
      '```' + xml + '```</textarea><div style="text-align:right;margin-top:10px">' +
      '<button id="blCopyBtn">Копировать</button> <button id="blOkBtn">OK</button> <span id="blCopyStatus" style="margin-right:10px;color:var(--green);display:none">✓ Скопировано!</span></div>');
    var ta = w.querySelector('#blXmlTextarea');
    ta.select();
    w.querySelector('#blCopyBtn').onclick = function () {
      ta.select();
      document.execCommand('copy');
      var s = w.querySelector('#blCopyStatus'); s.style.display = 'inline';
      setTimeout(function () { s.style.display = 'none'; }, 2000);
    };
    w.querySelector('#blOkBtn').onclick = function () { w.remove(); };
  }

  function importXml() {
    var w = modal('<h3>Импорт XML</h3><textarea id="blXmlIn" placeholder="Вставьте XML" style="width:100%;height:300px;font-family:monospace;background:var(--bg);color:var(--text);border:1px solid var(--border2);padding:8px"></textarea>' +
      '<div style="text-align:right;margin-top:10px"><button id="blImportBtn">Импорт</button> <button id="blCancelBtn">Отмена</button></div>');
    w.querySelector('#blImportBtn').onclick = function () {
      var text = w.querySelector('#blXmlIn').value.trim();
      var xml = extractXmlFromText(text);
      if (!xml) return alert('XML не найден');
      try {
        var dom = new DOMParser().parseFromString(xml, 'text/xml');
        var block = Blockly.Xml.domToBlock(dom.documentElement, ws);
        ws.centerOnBlock(block.id);
        w.remove();
      } catch (e) { alert('Ошибка при импорте XML: ' + e.message); }
    };
    w.querySelector('#blCancelBtn').onclick = function () { w.remove(); };
  }

  // ---------- экспорт PNG ----------
  function blockToSvg(block) {
    var svgRoot = block.getSvgRoot();
    var bbox = svgRoot.getBBox();
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', bbox.width + 20);
    svg.setAttribute('height', bbox.height + 20);
    svg.setAttribute('viewBox', '0 0 ' + (bbox.width + 20) + ' ' + (bbox.height + 20));
    var clone = svgRoot.cloneNode(true);
    clone.setAttribute('transform', 'translate(10,10)');
    svg.appendChild(clone);
    var css = Array.from(document.styleSheets).map(function (s) {
      try { return Array.from(s.cssRules).map(function (r) { return r.cssText; }).join('\n'); } catch (e) { return ''; }
    }).join('\n');
    var style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = css;
    svg.insertBefore(style, svg.firstChild);
    return svg;
  }
  async function exportPng(block) {
    var svg = blockToSvg(block);
    var xml = new XMLSerializer().serializeToString(svg);
    var img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
    await img.decode();
    var c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    c.getContext('2d').drawImage(img, 0, 0);
    c.toBlob(function (png) {
      var url = URL.createObjectURL(png);
      window.open(url, '_blank');
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }, 'image/png');
  }

  // ---------- генерация JS-кода ----------
  function mkClean() {
    var fn = 'cleanBlockly = function(){\n';
    var blocks = ws.getAllBlocks();
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'timeouts_setinterval') {
        var ni = blocks[i].getVars()[0];
        fn += '  (function(){if (' + ni + ') {clearInterval(' + ni + '); ' + ni + ' = null;}})();\n';
      }
      if (blocks[i].type === 'timeouts_settimeout') {
        var nt = blocks[i].getVars()[0];
        fn += '  (function(){if (' + nt + ') {clearTimeout(' + nt + '); ' + nt + ' = null;}})();\n';
      }
    }
    fn += '}\n';
    return fn;
  }
  function showCode() {
    Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
    if (!editor) {
      node.querySelector('.bl-js').innerHTML = Blockly.JavaScript.workspaceToCode(ws) + '\n' + mkClean();
      editor = ace.edit(node.querySelector('.bl-js'));
      editor.setTheme('ace/theme/dreamweaver');
      editor.session.setMode('ace/mode/javascript');
    } else {
      editor.setValue(Blockly.JavaScript.workspaceToCode(ws) + '\n' + mkClean());
    }
  }
  var node = null;

  // ---------- блоки/JS ----------
  function showBlocks() { node.querySelector('.bl-div').style.display = 'block'; node.querySelector('.bl-js').style.display = 'none'; }
  function showJs() { showCode(); node.querySelector('.bl-div').style.display = 'none'; node.querySelector('.bl-js').style.display = 'block'; }
  function toggleToolbar() {
    var t = node.querySelector('.blocklyToolboxDiv');
    if (t) t.style.display = (t.style.display === 'none') ? '' : 'none';
    Blockly.svgResize(ws);
  }

  // ---------- сохранение ----------
  function saveFile() {
    var xmlDom = Blockly.Xml.workspaceToDom(ws, true);
    var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
    var art = xmlText.split('\n');
    art[0] = '<xml  id="workspaceBlocks" >';
    xmlText = art.join('\n').replace(/ id="\d+"/g, '');
    SaveJson('/workspace.xml', xmlText);
    fetch('script.js').then(function (r) { return r.text(); }).then(function (jsfile) {
      var ofset = 64 + (jsfile + '').indexOf('//***************blockly generated code*******************marker');
      var filejs = (jsfile + '').substring(0, ofset) + '\n' + Blockly.JavaScript.workspaceToCode(ws) + '\n' + mkClean();
      SaveJson('/script.js', filejs);
    }).then(function () {
      setTimeout(function () { if (typeof WSsend === 'function') WSsend('initBlockly'); }, 5000);
    });
  }

  // ---------- init блокли ----------
  function blocklyInit() {
    var blocklyDiv = node.querySelector('.bl-div');
    if (typeof MSG === 'object') {
      for (var k in MSG) if (k.indexOf('cat') === 0) Blockly.Msg[k.toUpperCase()] = MSG[k];
    }
    ws = Blockly.inject(blocklyDiv, {
      media: '/static/KWS/blockly/media/',
      toolbox: document.getElementById('toolbox'),
      grid: { spacing: 20, length: 1, colour: '#888', snap: false },
      zoom: { controls: true, wheel: true, startScale: 1, maxScale: 3, minScale: 0.3 }
    });
    ws.configureContextMenu = function (options) {
      options.unshift(
        { text: '📤 Export PNG', enabled: true, callback: function () { var b = Blockly.selected; if (!b) return alert('Выделите блок'); exportPng(b); } },
        { text: '📋 Export XML', enabled: true, callback: function () { var b = Blockly.selected; if (!b) return alert('Выделите блок'); exportXml(b); } },
        { text: '📥 Import XML', enabled: true, callback: importXml }
      );
    };
    var wb = document.getElementById('workspaceBlocks');
    if (wb) Blockly.Xml.domToWorkspace(wb, ws);
    resize();
  }

  function resize() {
    if (!ws) return;
    Blockly.svgResize(ws);
  }

  // ---------- сброс (для переинициализации после прихода deviceList) ----------
  function resetEditor() {
    if (editor) { try { editor.destroy(); } catch (e) {} editor = null; }
    if (ws) { try { ws.dispose(); } catch (e) {} ws = null; }
    if (node) {
      node.querySelector('.bl-div').innerHTML = '';
      node.querySelector('.bl-js').innerHTML = '';
    }
    var tb = document.getElementById('toolbox'); if (tb) tb.remove();
    var wb = document.getElementById('workspaceBlocks'); if (wb) wb.remove();
  }

  // ---------- загрузка workspace.xml + toolbox.xml ----------
  function loadXml() {
    Promise.all(['workspace.xml', 'toolbox.xml'].map(function (file) {
      // файла может не быть (чистая установка) — тогда пустой workspace вместо 404-страницы
      return fetch(file).then(function (r) { return r.ok ? r.text() : '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'; });
    })).then(function (xmls) {
      xmls.forEach(function (xml) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'application/xml');
        if (doc.documentElement.id === 'toolbox') {
          var dins = '';
          for (var i = 1; i < deviceList.length; i++) {
            var d = deviceList[i];
            dins += '\n<category name="' + ((d.Name !== '') ? d.Name : d.ModelId) + '">';
            dins += '<block type="lab_dev" disabled="true"><value name="name"><block type="text"><field name="TEXT">' + d.IEEE + '</field></block></value></block>';
            var rep = d.Report;
            if (rep) {
              for (var key in rep) {
                var val = rep[key];
                dins += '<block type="dev_attrib"><field name="ieee">' + d.IEEE + '</field><field name="attr">' + val.label + '</field></block>';
                if (d.DevType === 'Z2M' && (val.access === 3 || val.access === 7)) {
                  dins += '<block type="z2m_set"><field name="ieee">' + d.IEEE + '</field><field name="attr">' + val.label + '</field></block>';
                }
              }
            }
            dins += '</category>';
          }
          xml = xml.replace('<!--marker.-->', dins);
          if (typeof MSG === 'object') {
            xml = xml.replace(/(^|[^%]){(\w+)}/g, function (m, p1, p2) { return p1 + (MSG[p2] != null ? MSG[p2] : '{' + p2 + '}'); });
          }
          doc = parser.parseFromString(xml, 'application/xml');
        }
        // XML-определения (toolbox/workspace) должны быть в DOM для getElementById,
        // но не должны светиться текстом под редактором — прячем явно.
        try { doc.documentElement.setAttribute('style', 'display:none!important'); } catch (e) {}
        node.appendChild(doc.documentElement);
      });
      blocklyInit();
    });
  }

  window.WinEngine.register({
    id: 'blockly',
    title: 'Blockly',
    label: 'Blockly',
    icon: '<img src="/static/icons/blockly.svg" alt="">',
    single: true,

    template: '<div class="window hidden" data-x="120" data-y="60" data-w="960" data-h="640">' +
      '<style>' + CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Blockly</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden;display:flex;flex-direction:column">' +
      '<div class="bl-btns">' +
      '<button data-bl="save" title="Сохранить">💾 Save</button>' +
      '<button data-bl="blocks" title="Режим блоков">🧩 Blockly</button>' +
      '<button data-bl="js" title="Режим JS">📜 JavaScript</button>' +
      '<button data-bl="toolbar" title="Показать/скрыть тулбар">↔ Toolbar</button>' +
      '</div>' +
      '<div class="bl-area"><div class="bl-div"></div><div class="bl-js"></div></div>' +
      '</div></div>',

    setup(n) {
      node = n;
      exiting = false;
      n._state = { ro: null };
      n.querySelector('.bl-btns').addEventListener('click', function (e) {
        var b = e.target.closest('[data-bl]');
        if (!b) return;
        var a = b.dataset.bl;
        if (a === 'save') return saveFile();
        if (a === 'blocks') return showBlocks();
        if (a === 'js') return showJs();
        if (a === 'toolbar') return toggleToolbar();
      });
      if (window.eventE) eventE.on('report', evtReport);
      // deviceList может прийти позже socket.js — при первом наполнении пересобираем тулбар
      n._state.onDev = function () {
        if (window.deviceList && window.deviceList.length) {
          if (window.eventE) eventE.off('updateDeviceList', n._state.onDev);
          resetEditor();
          loadXml();
        }
      };
      if (window.eventE && (!window.deviceList || !window.deviceList.length)) {
        eventE.on('updateDeviceList', n._state.onDev);
      }
      // ресайз: blockly-див пересчитываем по области окна
      var ro = new ResizeObserver(function () { resize(); });
      ro.observe(n.querySelector('.bl-area'));
      n._state.ro = ro;
      loadXml();
    },
    activate() {
      setTimeout(function () { if (ws) Blockly.svgResize(ws); }, 80);
    },
    destroy(n) {
      if (window.eventE) {
        eventE.off('report', evtReport);
        if (n._state && n._state.onDev) eventE.off('updateDeviceList', n._state.onDev);
      }
      if (n._state && n._state.ro) n._state.ro.disconnect();
      resetEditor();
      node = null;
    }
  });

})();
