// cluster.js — окно «Кластер»: эта нода, ноды кластера, найденные, сервисы из манифестов.
// Dependencies: window-engine.js (WinEngine), REST /api/cluster/*.
(function () {
  'use strict';

  var CL_CSS =
    '.cl-wrap{position:relative;display:flex;flex-direction:column;height:100%;background:var(--bg);color:var(--text);font-size:13px;overflow:hidden}' +
    '.cl-off{display:flex;align-items:center;gap:8px;margin:10px 12px 0;padding:8px 12px;border-radius:8px;background:var(--bg3);border:1px solid var(--yellow);color:var(--yellow);font-size:12px;flex-shrink:0}' +
    '.cl-self{margin:10px 12px 0;padding:9px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;flex-shrink:0}' +
    '.cl-self-in{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}' +
    '.cl-self-main{min-width:0;flex:1}' +
    '.cl-self-side{display:flex;align-items:center;gap:6px}' +
    '.cl-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '.cl-name{font-size:14px;font-weight:600;color:var(--text)}' +
    '.cl-sub{color:var(--faint);font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-dot{width:8px;height:8px;border-radius:50%;background:var(--muted);flex-shrink:0}' +
    '.cl-dot.ok{background:var(--green);box-shadow:0 0 5px var(--green)}' +
    '.cl-dot.warn{background:var(--yellow)}' +
    '.cl-badge{font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:0;color:var(--muted);white-space:nowrap}' +
    '.cl-badge.ok{color:var(--green)}' +
    '.cl-badge.master{color:var(--accent)}' +
    '.cl-local{font-size:11px;color:var(--accent);white-space:nowrap}' +
    '.cl-btn{font:inherit;font-size:12px;line-height:1;padding:6px 9px;border-radius:5px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);cursor:pointer;white-space:nowrap}' +
    '.cl-btn:hover{background:var(--hover)}' +
    '.cl-btn.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}' +
    '.cl-btn.primary:hover{background:var(--accent-dark)}' +
    '.cl-btn.sm{font-size:11px;padding:4px 7px}' +
    '.cl-grid{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(360px,1.25fr);gap:12px;flex:1;min-height:0;padding:10px 12px}' +
    '.cl-wrap.cl-narrow .cl-grid{display:flex;flex-direction:column;overflow:auto}' +
    '.cl-panel{display:flex;flex-direction:column;min-height:0;background:var(--bg2);border:1px solid var(--border);border-radius:8px;overflow:hidden}' +
    '.cl-wrap.cl-narrow .cl-panel{min-height:0;flex:none}' +
    '.cl-wrap.cl-narrow .cl-list{overflow:visible;flex:none}' +
    '.cl-phead{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:var(--bg3);border-bottom:1px solid var(--border);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}' +
    '.cl-phead-actions{display:flex;align-items:center;gap:6px}' +
    '.cl-count{font-size:11px;color:var(--faint);letter-spacing:0;text-transform:none}' +
    '.cl-tabs{display:flex;gap:16px;padding:8px 12px 0;border-bottom:1px solid var(--border);flex-shrink:0}' +
    '.cl-tab{flex:0 0 auto;display:flex;align-items:center;gap:5px;font:inherit;font-size:12px;padding:3px 0 7px;border:0;border-bottom:2px solid transparent;background:none;color:var(--muted);cursor:pointer;white-space:nowrap}' +
    '.cl-tab:hover{color:var(--text)}' +
    '.cl-tab.active{border-bottom-color:var(--accent);color:var(--text);font-weight:600}' +
    '.cl-list{overflow:auto;padding:8px 12px;flex:1;min-height:0}' +
    '.cl-node{padding:8px 0;border-top:1px solid var(--border)}' +
    '.cl-node:first-child{border-top:0;padding-top:2px}' +
    '.cl-node-head{display:flex;align-items:center;gap:8px;min-width:0}' +
    '.cl-node-name{font-size:13px;font-weight:600;color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-node-meta{color:var(--faint);font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-node-caps{color:var(--muted);font-size:11px;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-node-actions{display:flex;align-items:center;gap:6px;flex-shrink:0}' +
    '.cl-prog{margin-top:6px;max-width:240px}' +
    '.cl-bar{height:4px;border-radius:2px;background:var(--bg3);overflow:hidden}' +
    '.cl-bar-fill{height:100%;background:var(--accent);border-radius:2px;transition:width .25s}' +
    '.cl-bar.done .cl-bar-fill{background:var(--green)}' +
    '.cl-bar.bad .cl-bar-fill{background:var(--red)}' +
    '.cl-bar.indet .cl-bar-fill{width:35%!important;animation:clIndet 1.2s ease-in-out infinite}' +
    '@keyframes clIndet{0%{margin-left:-35%}100%{margin-left:100%}}' +
    '.cl-empty{color:var(--faint);font-size:12px;line-height:1.5;padding:6px 0}' +
    '.cl-empty code{color:var(--muted);background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:0 4px}' +
    '.cl-live-grid{display:flex;flex-direction:column}' +
    '.cl-live-card{border-top:1px solid var(--border);min-width:0}' +
    '.cl-live-card:first-child{border-top:0;padding-top:1px}' +
    '.cl-live-row{display:flex;align-items:center;gap:10px;padding:8px 0;cursor:pointer;min-width:0}' +
    '.cl-live-row:hover{background:var(--hover)}' +
    '.cl-live-kind{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);width:145px;flex-shrink:0}' +
    '.cl-live-val{font-size:12px;font-weight:600;flex:0 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.cl-live-sub{font-size:11px;color:var(--faint);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:40%}' +
    '.cl-live-chev{color:var(--muted);font-size:10px;flex-shrink:0;margin-left:auto}' +
    '.cl-live-opts{border-top:1px dashed var(--border);padding:2px 0 8px}' +
    '.cl-live-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:4px;padding-top:6px;border-top:1px dashed var(--border)}' +
    '.cl-live-none{color:var(--faint);font-size:11px;padding:5px 0}' +
    '.cl-opt{display:flex;align-items:center;gap:8px;width:100%;text-align:left;font:inherit;font-size:12px;padding:5px 4px;border:0;border-radius:0;background:none;color:var(--text);cursor:pointer}' +
    '.cl-opt:hover{background:var(--hover)}' +
    '.cl-opt-mark{width:12px;height:12px;border:1px solid var(--border2);border-radius:50%;flex-shrink:0}' +
    '.cl-opt.cur .cl-opt-mark{border-color:var(--accent);box-shadow:inset 0 0 0 3px var(--accent)}' +
    '.cl-opt-name{font-weight:600;flex-shrink:0}' +
    '.cl-opt-meta{color:var(--faint);font-size:11px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-opt-now{margin-left:auto;color:var(--green);font-size:10px;text-transform:uppercase;letter-spacing:.05em;flex-shrink:0}' +
    '.cl-ctrl-label{font-size:11px;color:var(--faint)}' +
    '.cl-sel{font:inherit;font-size:11px;padding:3px 6px;border-radius:5px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);max-width:200px}' +
    '.cl-status{min-height:20px;padding:0 14px 6px;color:var(--muted);font-size:12px;flex-shrink:0}' +
    '.cl-status.bad{color:var(--red)}';

  var CL_BODY =
    '<div class="cl-wrap">' +
    '<div id="cl_off" class="cl-off" style="display:none">Обнаружение выключено в конфиге (<code>Cluster.enable = "0"</code>) — ноды не видны. Включите его и перезапустите ноду.</div>' +
    '<div id="cl_self" class="cl-self"></div>' +
    '<div class="cl-grid">' +
    '<div class="cl-panel">' +
    '<div class="cl-phead"><span>Ноды</span></div>' +
    '<div id="cl_tabs" class="cl-tabs" style="display:none">' +
    '<button id="cl_tab_paired" class="cl-tab active" onclick="clSetTab(\'paired\')">В кластере <span id="cl_n_paired" class="cl-count">0</span></button>' +
    '<button id="cl_tab_found" class="cl-tab" onclick="clSetTab(\'found\')">Найденные <span id="cl_n_found" class="cl-count">0</span></button>' +
    '</div>' +
    '<div id="cl_nodes" class="cl-list"></div>' +
    '</div>' +
    '<div class="cl-panel">' +
    '<div class="cl-phead"><span>Сервисы</span>' +
    '<span class="cl-phead-actions">' +
    '<button id="cl_all_btn" class="cl-btn sm" style="display:none" onclick="clResetLocal()" title="Вернуться к выбору мастера">Как у всех</button>' +
    '<button class="cl-btn sm" onclick="clRescanServices()" title="Искать сервисы в сети по mDNS">↻</button>' +
    '</span></div>' +
    '<div id="cl_svc" class="cl-list"></div>' +
    '</div>' +
    '</div>' +
    '<div id="cl_status" class="cl-status"></div>' +
    '</div>';

  var cl_state = {
    data: null, services: null, timer: null, flashTimer: 0, node: null,
    progress: {}, updateH: null, tab: 'paired', ro: null,
    openLive: null, outsideH: null, latest: '', latestAt: 0
  };

  // ── утилиты ──────────────────────────────────────────────────────────────
  function clEsc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function clHost(addr) {
    var s = String(addr || '');
    var i = s.indexOf(':');
    return i > 0 ? s.slice(0, i) : s;
  }

  function clAgo(iso) {
    var t = Date.parse(iso);
    if (isNaN(t)) return '—';
    var sec = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (sec < 3) return 'только что';
    if (sec < 60) return sec + ' с назад';
    var m = Math.round(sec / 60);
    return m + ' мин назад';
  }

  function clRoleLabel(role) {
    if (role === 'hub') return 'хаб';
    if (role === 'leaf') return 'лист';
    if (role === 'standalone') return 'одиночная';
    return role || '—';
  }

  function clRoleTitle(role) {
    if (role === 'hub') return 'hub — центр управления';
    if (role === 'leaf') return 'leaf — нода с Zigbee-координатором';
    if (role === 'standalone') return 'standalone — одиночная нода';
    return role ? 'роль ' + role : '';
  }

  function clPlural(n, one, few, many) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
    return many;
  }

  function clCapsSummary(caps) {
    if (!caps) return '';
    var bits = [];
    if (caps.devices) bits.push(caps.devices + ' ' + clPlural(caps.devices, 'устройство', 'устройства', 'устройств'));
    if (caps.speakers) bits.push(caps.speakers + ' ' + clPlural(caps.speakers, 'колонка', 'колонки', 'колонок'));
    if (caps.alice) bits.push('Алиса');
    if (caps.zigbee) bits.push('Zigbee');
    if (caps.ble) bits.push('BLE');
    return bits.join(' · ');
  }

  function clProgInfo(msg) {
    if (!msg) return null;
    msg = String(msg);
    if (msg.indexOf('restart|') === 0) return { pct: null, text: msg.slice(8) || 'перезапуск…' };
    var m = /updateProgress\|downPercent\|(\d+)/.exec(msg);
    if (m) return { pct: parseInt(m[1], 10), text: 'обновление ' + m[1] + '%' };
    if (/updateProgress\|downStart/.test(msg)) return { pct: null, text: 'загрузка обновления…' };
    if (/updateProgress\|downComplete/.test(msg)) return { pct: 100, text: 'загрузка завершена' };
    if (/updateProgress\|checksumOk/.test(msg)) return { pct: 100, text: 'контрольная сумма верна' };
    if (/updateProgress\|step\|install/.test(msg)) return { pct: 100, text: 'установка' };
    if (/updateProgress\|step\|restartNeeded/.test(msg)) return { pct: 100, text: 'нужен перезапуск' };
    if (/updateProgress\|step\|replaceDone/.test(msg)) return { pct: 100, text: 'файл заменён, нужен перезапуск' };
    if (/^готово/.test(msg)) return { pct: 100, text: 'готово', done: true };
    if (/^ошибка/i.test(msg)) return { pct: 100, text: msg, bad: true };
    if (/Checking for updates/.test(msg)) return { pct: null, text: 'проверка обновлений…' };
    if (/Local version is up-to-date/.test(msg)) return { pct: 100, text: 'уже обновлено', done: true };
    if (/Current version/.test(msg)) return { pct: null, text: 'есть новая версия' };
    return { pct: null, text: msg };
  }

  function clProgBusy(msg) {
    if (!msg) return false;
    msg = String(msg);
    if (msg.indexOf('restart|') === 0) return true;
    if (/downStart|downPercent|Checking for updates|step\|install/.test(msg)) return true;
    return false;
  }

  function clProgBar(msg) {
    var p = clProgInfo(msg);
    if (!p) return '';
    var cls = 'cl-bar' + (p.done ? ' done' : p.bad ? ' bad' : p.pct == null ? ' indet' : '');
    var w = p.pct == null ? 35 : Math.max(2, Math.min(100, p.pct));
    return '<div class="cl-prog" title="' + clEsc(p.text) + '"><div class="' + cls + '">' +
      '<div class="cl-bar-fill" style="width:' + w + '%"></div></div></div>';
  }

  function clSetNodeProgress(node, msg) {
    var row = null;
    try { row = document.querySelector('.cl-node[data-node="' + node + '"]'); } catch (e) {}
    if (!row) return;
    var old = row.querySelector('.cl-prog');
    var html = clProgBar(msg);
    if (old) {
      if (html) old.outerHTML = html; else old.parentNode.removeChild(old);
    } else if (html) {
      row.insertAdjacentHTML('beforeend', html);
    }
  }

  function clCapsTitle(caps) {
    if (!caps) return '';
    var bits = [];
    if (caps.deviceTypes) {
      Object.keys(caps.deviceTypes).sort().forEach(function (k) {
        bits.push(k + ' ' + caps.deviceTypes[k]);
      });
    }
    if (caps.alice) bits.push('Алиса: ' + caps.alice);
    return bits.join(' · ');
  }

  function clFetchJSON(url, opts) {
    return fetch(url, opts).then(function (r) {
      return r.text().then(function (t) {
        var d = null;
        try { d = JSON.parse(t); } catch (e) {}
        if (!r.ok) {
          var err = new Error((d && d.error) || ('HTTP ' + r.status));
          err.status = r.status;
          err.data = d;
          throw err;
        }
        return d;
      });
    });
  }

  function clFlash(text, ok) {
    var el = document.getElementById('cl_status');
    if (!el) return;
    el.textContent = text || '';
    el.className = 'cl-status' + (ok === false ? ' bad' : '');
    if (cl_state.flashTimer) clearTimeout(cl_state.flashTimer);
    cl_state.flashTimer = setTimeout(function () {
      if (el) el.textContent = '';
    }, 6000);
  }

  // ── данные ───────────────────────────────────────────────────────────────
  window.clRefresh = function () {
    clFetchJSON('/api/cluster/info').then(function (d) {
      cl_state.data = d;
      clRender();
    }).catch(function (e) {
      clFlash('Нет связи с сервером: ' + e.message, false);
    });
    clFetchJSON('/api/cluster/services').then(function (d) {
      cl_state.services = d;
      clRenderServices(false);
    }).catch(function () {});
    clRefreshLatest(false);
  };

  // Тег последнего релиза GitHub: нужен для кнопок «Обновить». Кэш на клиенте
  // 5 минут, на сервере — 10 (окно опрашивает info каждые 5 с).
  function clRefreshLatest(force) {
    if (!force && cl_state.latestAt && Date.now() - cl_state.latestAt < 5 * 60 * 1000) return;
    clFetchJSON('/api/cluster/update/check').then(function (d) {
      cl_state.latest = (d && d.tag) ? String(d.tag) : '';
      cl_state.latestAt = Date.now();
      if (cl_state.data) clRenderNodes(cl_state.data);
    }).catch(function () {
      cl_state.latestAt = Date.now();
    });
  }

  // ── эта нода и ноды ──────────────────────────────────────────────────────
  function clRender() {
    var d = cl_state.data;
    if (!d || !d.self) return;

    var off = document.getElementById('cl_off');
    if (off) off.style.display = d.enabled ? 'none' : 'flex';

    clRenderSelf(d);
    clRenderNodes(d);
  }

  function clRenderSelf(d) {
    var el = document.getElementById('cl_self');
    if (!el) return;
    var self = d.self;
    var isMaster = !!(d.masterId && d.masterId === self.node);
    var selfPaired = self.state === 'paired';
    var host = location.hostname || '';
    var addr = host ? host + ':' + (self.http || '8081') : (self.http || '');
    var tip = [clRoleTitle(self.role), self.ver || '—'];
    if (self.priority) tip.push('приоритет ' + self.priority);
    if (self.term) tip.push('term ' + self.term);
    var capsText = clCapsSummary(d.caps);
    var capsTitle = clCapsTitle(d.caps);
    var sub = [addr, capsText].filter(Boolean).join(' · ');
    var subTitle = tip.concat(capsTitle ? [capsTitle] : []).filter(Boolean).join(' · ');

    el.innerHTML = '' +
      '<div class="cl-self-in">' +
      '<div class="cl-self-main">' +
      '<div class="cl-row">' +
      '<span class="cl-dot ' + (selfPaired ? 'ok' : 'warn') + '"></span>' +
      '<span class="cl-name">' + clEsc(self.name || '—') + '</span>' +
      (isMaster ? '<span class="cl-badge master">Мастер</span>' : '') +
      '</div>' +
      '<div class="cl-sub" title="' + clEsc(subTitle) + '">' + clEsc(sub) + '</div>' +
      '</div>' +
      '<div class="cl-self-side">' +
      '<button class="cl-btn sm" onclick="clRefresh()" title="Обновить данные">↻</button>' +
      '</div>' +
      '</div>';
  }

  function clRenderNodes(d) {
    var peers = (d.peers || []).slice();
    var paired = peers.filter(function (p) { return p.state === 'paired'; });
    var found = peers.filter(function (p) { return p.state !== 'paired'; });
    if (!found.length && cl_state.tab === 'found') cl_state.tab = 'paired';

    var n1 = document.getElementById('cl_n_paired');
    var n2 = document.getElementById('cl_n_found');
    if (n1) n1.textContent = String(paired.length);
    if (n2) n2.textContent = String(found.length);
    var tabs = document.getElementById('cl_tabs');
    if (tabs) tabs.style.display = found.length ? 'flex' : 'none';

    // Успешно обновившаяся нода пришла с версией latest — прогресс больше не нужен.
    Object.keys(cl_state.progress).forEach(function (nodeID) {
      for (var i = 0; i < peers.length; i++) {
        if (peers[i].node !== nodeID) continue;
        var doneVersion = cl_state.latest && peers[i].ver === cl_state.latest;
        var restarted = String(cl_state.progress[nodeID] || '').indexOf('restart|') === 0 &&
          peers[i].uptime > 0 && peers[i].uptime < 120;
        if (doneVersion || restarted) {
          delete cl_state.progress[nodeID];
          return;
        }
      }
    });

    var tab = cl_state.tab === 'found' ? 'found' : 'paired';
    var tabPaired = document.getElementById('cl_tab_paired');
    var tabFound = document.getElementById('cl_tab_found');
    if (tabPaired) tabPaired.className = 'cl-tab' + (tab === 'paired' ? ' active' : '');
    if (tabFound) tabFound.className = 'cl-tab' + (tab === 'found' ? ' active' : '');

    var list = tab === 'found' ? found : paired;
    var box = document.getElementById('cl_nodes');
    if (box) {
      box.innerHTML = list.length
        ? list.map(function (p) { return clNodeCard(p, d, tab === 'paired'); }).join('')
        : '<div class="cl-empty">' + (tab === 'found'
          ? 'Нод с тем же паролем, но без подключения к мастеру, нет.'
          : 'Пока только эта нода.') + '</div>';
    }

  }

  function clNodeCard(p, d, paired) {
    var host = clHost(p.addr);
    var port = p.http || '8081';
    var isMaster = !!(d.masterId && d.masterId === p.node);
    var selfIsMaster = !!(d.masterId && d.self && d.masterId === d.self.node);
    var latest = cl_state.latest || '';
    var progMsg = cl_state.progress[p.node] || '';
    var busy = clProgBusy(progMsg);
    var canUpdate = paired && selfIsMaster && latest !== '' && p.node !== d.masterId &&
      (p.ver || '') !== latest && !busy;
    var canRestart = paired && selfIsMaster && p.node !== d.masterId && !busy;
    var badge = isMaster ? '<span class="cl-badge master">Мастер</span>' : '';
    var meta = [clRoleLabel(p.role), p.ver || '—', host + ':' + port, clAgo(p.lastSeen)].join(' · ');
    var tip = [clRoleTitle(p.role)];
    if (p.priority) tip.push('приоритет ' + p.priority);
    if (p.term) tip.push('term ' + p.term);
    var capsText = clCapsSummary(p.caps);
    var capsTitle = clCapsTitle(p.caps);

    var actions = '';
    if (canUpdate) {
      actions += '<button class="cl-btn sm" title="Обновить до ' + clEsc(latest) + '" ' +
        'onclick="clUpdateNode(\'' + clEsc(p.node) + '\')">Обновить</button>';
    }
    if (canRestart) {
      actions += '<button class="cl-btn sm" title="Перезапустить ноду" ' +
        'onclick="clRestartNode(\'' + clEsc(p.node) + '\')">Рестарт</button>';
    }
    actions += '<button class="cl-btn sm" title="Открыть веб-интерфейс" onclick="clOpenUi(\'' +
      clEsc(host) + '\',\'' + clEsc(port) + '\')">Открыть ↗</button>';

    return '' +
      '<div class="cl-node" data-node="' + clEsc(p.node) + '">' +
      '<div class="cl-node-head">' +
      '<span class="cl-dot ' + (paired ? 'ok' : 'warn') + '"></span>' +
      '<span class="cl-node-name" title="' + clEsc(p.name || '') + '">' + clEsc(p.name || '—') + '</span>' +
      badge +
      '<span class="cl-node-actions">' + actions + '</span></div>' +
      '<div class="cl-node-meta" title="' + clEsc(tip.filter(Boolean).join(' · ')) + '">' + clEsc(meta) + '</div>' +
      (capsText ? '<div class="cl-node-caps" title="' + clEsc(capsTitle) + '">' + clEsc(capsText) + '</div>' : '') +
      clProgBar(progMsg) +
      '</div>';
  }

  window.clSetTab = function (tab) {
    cl_state.tab = tab === 'found' ? 'found' : 'paired';
    if (cl_state.data) clRenderNodes(cl_state.data);
  };

  window.clUpdateNode = function (node) {
    if (!node) return;
    cl_state.progress[node] = 'updateProgress|downStart';
    if (cl_state.data) clRenderNodes(cl_state.data);
    clFetchJSON('/api/cluster/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: [node] })
    }).then(function (d) {
      if (!d.sent) {
        delete cl_state.progress[node];
        clFlash('Нода недоступна по каналу /peer — команда не ушла', false);
      } else {
        cl_state.progress[node] = 'updateProgress|downStart';
        clFlash('Обновление отправлено: ' + (d.tag || cl_state.latest));
      }
      if (cl_state.data) clRenderNodes(cl_state.data);
    }).catch(function (e) {
      delete cl_state.progress[node];
      clFlash('Ошибка обновления: ' + e.message, false);
      if (cl_state.data) clRenderNodes(cl_state.data);
    });
  };

  window.clRestartNode = function (node) {
    if (!node) return;
    cl_state.progress[node] = 'restart|перезапуск…';
    if (cl_state.data) clRenderNodes(cl_state.data);
    clFetchJSON('/api/cluster/restart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: [node] })
    }).then(function (d) {
      if (!d.sent) {
        delete cl_state.progress[node];
        clFlash('Нода недоступна по каналу /peer — команда не ушла', false);
      } else {
        clFlash('Команда перезапуска отправлена');
      }
      if (cl_state.data) clRenderNodes(cl_state.data);
      setTimeout(function () {
        if (String(cl_state.progress[node] || '').indexOf('restart|') === 0) {
          delete cl_state.progress[node];
          if (cl_state.data) clRenderNodes(cl_state.data);
        }
      }, 30000);
    }).catch(function (e) {
      delete cl_state.progress[node];
      clFlash('Ошибка перезапуска: ' + e.message, false);
      if (cl_state.data) clRenderNodes(cl_state.data);
    });
  };

  // ── сервисы: компактные строки с раскрытием ──────────────────────────────
  function clSvcBusy() {
    var a = document.activeElement;
    var box = document.getElementById('cl_svc');
    return !!(a && box && a.tagName === 'SELECT' && box.contains(a));
  }

  function clRenderServices(force) {
    var box = document.getElementById('cl_svc');
    if (!box) return;
    var d = cl_state.services;
    if (!d) return;
    if (!force && clSvcBusy()) return;

    var providers = d.providers || [];
    var groups = { tts: [], asr: [], vad: [], llm: [], other: [] };
    providers.forEach(function (p) {
      var svcs = (p.manifest && p.manifest.services) || [];
      svcs.forEach(function (s) {
        var kind = String(s.kind || '').toLowerCase();
        if (!groups[kind]) kind = 'other';
        groups[kind].push({ p: p, s: s });
      });
    });

    box.innerHTML = clLiveBlock(groups);
    // Выбора сервисов здесь больше нет — только список найденного.
    var allBtn = document.getElementById('cl_all_btn');
    if (allBtn) allBtn.style.display = 'none';
  }

  // Список сервисов — только для просмотра: что реально видно по mDNS.
  // Выбор голосового сервиса теперь на вкладке Alice в настройках ноды.
  function clLiveBlock(groups) {
    var titles = {
      tts: 'Синтез речи', asr: 'Распознавание речи',
      vad: 'Детектор речи', llm: 'Языковая модель', other: 'Другие сервисы'
    };
    var kinds = ['tts', 'asr', 'vad'];
    Object.keys(groups || {}).forEach(function (k) {
      if (kinds.indexOf(k) < 0 && (groups[k] || []).length) kinds.push(k);
    });
    return '<div class="cl-live-grid">' + kinds.map(function (k) {
      var arr = ((groups || {})[k] || []).slice().sort(function (a, b) {
        var an = String(a.p.name || a.p.id), bn = String(b.p.name || b.p.id);
        if (an !== bn) return an.localeCompare(bn);
        return String(a.s.id || '').localeCompare(String(b.s.id || ''));
      });
      var rows = arr.length ? arr.map(function (it) {
        var name = String(it.s.id || k);
        var meta = (it.p.name || it.p.id) + (it.p.online === false ? ' · офлайн' : '');
        return '<div class="cl-opt" style="cursor:default;pointer-events:none">' +
          '<span class="cl-opt-name">' + clEsc(name) + '</span>' +
          '<span class="cl-opt-meta">' + clEsc(meta) + '</span></div>';
      }).join('') : '<div class="cl-live-none">не найден</div>';
      return '<div class="cl-live-card">' +
        '<div class="cl-live-row" style="cursor:default">' +
        '<span class="cl-live-kind">' + clEsc(titles[k] || k.toUpperCase()) + '</span>' +
        '<span class="cl-live-val">' + (arr.length ? arr.length + ' в сети' : '—') + '</span>' +
        '</div><div class="cl-live-opts">' + rows + '</div></div>';
    }).join('') + '</div>';
  }

  function clLiveCard(kind, title, groups) {
    var arr = clVariants(kind);
    var main = arr[0];
    var opts = ((groups || {})[kind] || []).slice();
    opts.sort(function (a, b) { return clSvcOrder(kind, a, b); });
    var open = cl_state.openLive === kind;
    var value = 'не выбран';
    var sub = opts.length ? 'нажмите, чтобы выбрать' : 'не найден';
    if (main) {
      var extra = '';
      if (kind === 'tts' && main.voice) extra = clVoiceLabel(main.provider, main.service, main.voice);
      else if (kind === 'asr' && main.model) extra = main.model;
      value = (main.service || clProviderName(main.provider)) + (extra ? ' · ' + extra : '');
      sub = clProviderName(main.provider);
    }

    var body = '';
    if (open) {
      var list = opts.length
        ? opts.map(function (it) { return clLiveOpt(kind, it.p, it.s); }).join('')
        : '<div class="cl-live-none">Сервис не найден в сети.</div>';
      var controls = '';
      if (main) {
        var mainSvc = null;
        opts.forEach(function (it) {
          if (it.p.id === main.provider && it.s.id === main.service) mainSvc = it.s;
        });
        if (mainSvc && kind === 'tts' && (mainSvc.voices || []).length) {
          controls += clVoiceSelect(kind, main, mainSvc.voices);
        } else if (mainSvc && kind === 'asr' && (mainSvc.models || []).length) {
          controls += clVoiceSelect(kind, main, mainSvc.models);
        }
        if (kind === 'tts' || kind === 'asr') {
          controls += '<button class="cl-btn sm" onclick="clTestService(\'' + clEsc(kind) + '\',\'' +
            clEsc(main.provider) + '\',\'' + clEsc(main.service) + '\')">Проверить</button>';
        }
      }
      body = '<div class="cl-live-opts">' + list +
        (controls ? '<div class="cl-live-actions">' + controls + '</div>' : '') + '</div>';
    }

    return '' +
      '<div class="cl-live-card" data-kind="' + clEsc(kind) + '">' +
      '<div class="cl-live-row" onclick="clLiveToggle(\'' + clEsc(kind) + '\')">' +
      '<span class="cl-live-kind">' + clEsc(title) + (clLocalKind(kind) ? ' · своё' : '') + '</span>' +
      '<span class="cl-live-val">' + clEsc(value) + '</span>' +
      '<span class="cl-live-sub">' + clEsc(sub) + '</span>' +
      '<span class="cl-live-chev">' + (open ? '▴' : '▾') + '</span>' +
      '</div>' + body +
      '</div>';
  }

  function clVoiceSelect(kind, main, items) {
    var current = kind === 'tts' ? (main.voice || '') : (main.model || '');
    var label = kind === 'tts' ? 'Голос' : 'Модель';
    return '<span class="cl-ctrl-label">' + label + '</span>' +
      '<select class="cl-sel" onchange="clSetVoice(\'' + clEsc(kind) + '\',\'' +
      clEsc(main.provider) + '\',\'' + clEsc(main.service) + '\',this.value)">' +
      items.map(function (v) {
        var sel = v.value === current ? ' selected' : '';
        return '<option value="' + clEsc(v.value) + '"' + sel + '>' + clEsc(v.label || v.value) + '</option>';
      }).join('') + '</select>';
  }

  function clLiveOpt(kind, p, s) {
    var idx = clChoiceIndex(kind, p.id, s.id);
    var meta = [p.name || p.id];
    if (!p.online) meta.push('офлайн');
    return '' +
      '<button class="cl-opt' + (idx === 0 ? ' cur' : '') + '" ' +
      'onclick="event.stopPropagation();clLivePick(\'' + clEsc(kind) + '\',\'' +
      clEsc(p.id) + '\',\'' + clEsc(s.id) + '\')">' +
      '<span class="cl-opt-mark"></span>' +
      '<span class="cl-opt-name">' + clEsc(s.id || kind) + '</span>' +
      '<span class="cl-opt-meta">' + clEsc(meta.join(' · ')) + '</span>' +
      (idx === 0 ? '<span class="cl-opt-now">сейчас</span>' : '') +
      '</button>';
  }

  window.clLiveToggle = function (kind) {
    cl_state.openLive = cl_state.openLive === kind ? null : kind;
    clRenderServices(true);
  };

  window.clLivePick = function (kind, provider, service) {
    if (clChoiceIndex(kind, provider, service) === 0) {
      cl_state.openLive = null;
      clRenderServices(true);
      return;
    }
    clSetPrimary(kind, provider, service);
  };

  // ── политика сервисов ────────────────────────────────────────────────────
  function clPolicy() {
    var d = cl_state.services || {};
    return d.effective || d.policy || {};
  }

  function clLocal() {
    return (cl_state.services && cl_state.services.local) || {};
  }

  function clHasLocal() {
    var l = clLocal();
    return (l.tts || []).length > 0 || (l.asr || []).length > 0 || (l.vad || []).length > 0;
  }

  function clLocalKind(kind) {
    var arr = clLocal()[kind];
    return Array.isArray(arr) && arr.length > 0;
  }

  function clVariants(kind) {
    var arr = clPolicy()[kind];
    return Array.isArray(arr) ? arr.slice() : [];
  }

  function clChoice(kind, provider, service) {
    var arr = clVariants(kind);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].provider === provider && arr[i].service === service) return arr[i];
    }
    return null;
  }

  function clChoiceIndex(kind, provider, service) {
    var arr = clVariants(kind);
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].provider === provider && arr[i].service === service) return i;
    }
    return -1;
  }

  function clSame(c, provider, service) {
    return c.provider === provider && c.service === service;
  }

  function clProviderName(id) {
    var list = (cl_state.services && cl_state.services.providers) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i].name || list[i].id;
    }
    return id;
  }

  function clSvcOrder(kind, a, b) {
    var ai = clChoiceIndex(kind, a.p.id, a.s.id);
    var bi = clChoiceIndex(kind, b.p.id, b.s.id);
    if (ai !== bi) {
      if (ai < 0) return 1;
      if (bi < 0) return -1;
      return ai - bi;
    }
    if (!!a.p.online !== !!b.p.online) return a.p.online ? -1 : 1;
    return String(a.s.id || '').localeCompare(String(b.s.id || ''));
  }

  function clPolicySend(kind, variants) {
    clFetchJSON('/api/cluster/services/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: kind, variants: variants })
    }).then(function (d) {
      if (cl_state.services) {
        if (d.policy) cl_state.services.policy = d.policy;
        if (d.local) cl_state.services.local = d.local;
        if (d.effective) cl_state.services.effective = d.effective;
      }
      clRenderServices(true);
      var where = cl_state.services && cl_state.services.isMaster ? '' : ' (для этой ноды)';
      clFlash('Сохранено: ' + kind.toUpperCase() + where);
    }).catch(function (e) {
      clFlash('Не сохранилось: ' + e.message, false);
    });
  }

  function clFirstVoice(kind, provider, service) {
    var list = (cl_state.services && cl_state.services.providers) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== provider) continue;
      var svcs = (list[i].manifest && list[i].manifest.services) || [];
      for (var j = 0; j < svcs.length; j++) {
        if (svcs[j].id !== service) continue;
        var v = svcs[j].voices || [];
        return v.length ? v[0].value : '';
      }
    }
    return '';
  }

  function clFirstModel(kind, provider, service) {
    var list = (cl_state.services && cl_state.services.providers) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== provider) continue;
      var svcs = (list[i].manifest && list[i].manifest.services) || [];
      for (var j = 0; j < svcs.length; j++) {
        if (svcs[j].id !== service) continue;
        var m = svcs[j].models || [];
        return m.length ? m[0].value : '';
      }
    }
    return '';
  }

  window.clSetPrimary = function (kind, provider, service) {
    cl_state.openLive = null;
    var cur = clChoice(kind, provider, service) || {};
    var rest = clVariants(kind).filter(function (c) { return !clSame(c, provider, service); });
    clPolicySend(kind, [{
      provider: provider, service: service,
      voice: cur.voice || clFirstVoice(kind, provider, service),
      model: cur.model || clFirstModel(kind, provider, service)
    }].concat(rest));
  };

  window.clSetVoice = function (kind, provider, service, value) {
    var cur = clChoice(kind, provider, service);
    if (!cur) return;
    var arr = clVariants(kind).map(function (c) {
      if (clSame(c, provider, service)) {
        if (kind === 'asr') c.model = value; else c.voice = value;
      }
      return c;
    });
    clPolicySend(kind, arr);
  };

  window.clTestService = function (kind, provider, service) {
    var cur = clChoice(kind, provider, service) || {};
    var body = {
      kind: kind, provider: provider, service: service,
      voice: cur.voice || '', model: cur.model || '', text: ''
    };
    clFlash(kind.toUpperCase() + ': проверяю ' + service + '…');
    fetch('/api/cluster/services/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (r) {
      if (kind === 'tts') {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
        return r.blob().then(function (b) {
          var a = new Audio(URL.createObjectURL(b));
          a.play();
          clFlash('TTS: «Проверка связи» воспроизводится');
        });
      }
      return r.json().then(function (d) {
        if (!d.ok) throw new Error(d.error || 'ошибка');
        clFlash('ASR: «' + (d.text || '—') + '» · ' + (d.ms || 0) + ' мс');
      });
    }).catch(function (e) {
      clFlash(kind.toUpperCase() + ': ' + e.message, false);
    });
  };

  function clVoiceLabel(provider, service, voice) {
    var list = (cl_state.services && cl_state.services.providers) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id !== provider) continue;
      var svcs = (list[i].manifest && list[i].manifest.services) || [];
      for (var j = 0; j < svcs.length; j++) {
        if (svcs[j].id !== service) continue;
        var vs = svcs[j].voices || [];
        for (var k = 0; k < vs.length; k++) {
          if (vs[k].value === voice) return vs[k].label || voice;
        }
      }
    }
    return voice;
  }

  window.clResetLocal = function () {
    clFetchJSON('/api/cluster/services/local/reset', { method: 'POST' }).then(function (d) {
      if (cl_state.services) {
        cl_state.services.local = {};
        cl_state.services.effective = d.effective;
      }
      clRenderServices(true);
      clFlash('Снова как у всех');
    }).catch(function (e) {
      clFlash('Не сбросилось: ' + e.message, false);
    });
  };

  window.clRescanServices = function () {
    clFetchJSON('/api/cluster/services/rescan', { method: 'POST' }).then(function () {
      clFlash('Ищу сервисы в сети…');
      setTimeout(clRefresh, 1200);
      setTimeout(clRefresh, 4000);
    }).catch(function (e) {
      clFlash('Скан не запустился: ' + e.message, false);
    });
  };

  // ── действия ─────────────────────────────────────────────────────────────
  window.clOpenUi = function (host, port) {
    if (!host) return;
    window.open('http://' + host + ':' + (port || '8081'), '_blank', 'noopener');
  };

  // ── адаптация под ширину окна ────────────────────────────────────────────
  var cl_layoutBound = false;

  function clApplyWidth() {
    if (!cl_state.node || !cl_state.node.isConnected) return;
    var wrap = cl_state.node.querySelector('.cl-wrap');
    if (!wrap) return;
    wrap.classList.toggle('cl-narrow', wrap.clientWidth < 880);
  }

  function clBindLayout() {
    if (cl_layoutBound) return;
    cl_layoutBound = true;
    if (window.WinEngine && typeof window.WinEngine.on === 'function') {
      window.WinEngine.on('layout', clApplyWidth);
    }
    window.addEventListener('resize', clApplyWidth);
  }

  function clWatchWidth(node) {
    clUnwatchWidth();
    var wrap = node && node.querySelector('.cl-wrap');
    if (!wrap) return;
    clApplyWidth();
    clBindLayout();
    if (typeof ResizeObserver === 'undefined') return;
    cl_state.ro = new ResizeObserver(clApplyWidth);
    cl_state.ro.observe(wrap);
  }

  function clUnwatchWidth() {
    if (cl_state.ro) {
      try { cl_state.ro.disconnect(); } catch (e) {}
      cl_state.ro = null;
    }
  }

  // ── регистрация окна ─────────────────────────────────────────────────────
  window.WinEngine && window.WinEngine.register({
    id: 'cluster',
    title: 'Кластер',
    label: 'Кластер',
    icon: '<img src="/static/icons/cluster.svg" alt="">',
    single: true,
    template: '<div class="window hidden" data-x="120" data-y="50" data-w="1040" data-h="560">' +
      '<style>' + CL_CSS + '</style>' +
      '<div class="window-head"><span class="wtitle title">Кластер ZESP</span>' +
      '<div class="wbtns"><button class="wbtn min" data-waction="min">–</button>' +
      '<button class="wbtn max" data-waction="max">▢</button>' +
      '<button class="wbtn" data-waction="close">✕</button></div></div>' +
      '<div class="window-body" style="padding:0;overflow:hidden">' + CL_BODY + '</div>' +
      '</div>',
    setup: function (node) {
      cl_state.node = node;
      cl_state.data = null;
      cl_state.services = null;
      cl_state.progress = {};
      cl_state.tab = 'paired';
      cl_state.openLive = null;
      cl_state.latest = '';
      cl_state.latestAt = 0;
      clWatchWidth(node);

      cl_state.outsideH = function (ev) {
        if (!cl_state.openLive) return;
        var t = ev.target;
        if (t && t.closest && t.closest('.cl-live-card')) return;
        cl_state.openLive = null;
        clRenderServices(true);
      };
      document.addEventListener('click', cl_state.outsideH);

      // Прогресс обновления нод приходит из wsSend мастера.
      cl_state.updateH = function (ev) {
        if (!ev || !ev.node) return;
        var had = !!cl_state.progress[ev.node];
        cl_state.progress[ev.node] = ev.msg;
        if (cl_state.data && (!had || /restartNeeded|replaceDone|^готово|^ошибка/.test(ev.msg))) {
          clRenderNodes(cl_state.data);
        } else {
          clSetNodeProgress(ev.node, ev.msg);
        }
      };
      if (window.eventE) eventE.on('clusterUpdate', cl_state.updateH);
      clRefresh();
      if (cl_state.timer) clearInterval(cl_state.timer);
      cl_state.timer = setInterval(clRefresh, 5000);
    },
    destroy: function () {
      if (cl_state.timer) clearInterval(cl_state.timer);
      if (cl_state.flashTimer) clearTimeout(cl_state.flashTimer);
      if (window.eventE && cl_state.updateH) eventE.off('clusterUpdate', cl_state.updateH);
      if (cl_state.outsideH) document.removeEventListener('click', cl_state.outsideH);
      clUnwatchWidth();
      cl_state = {
        data: null, services: null, timer: null, flashTimer: 0, node: null,
        progress: {}, updateH: null, tab: 'paired', ro: null,
        openLive: null, outsideH: null, latest: '', latestAt: 0
      };
    }
  });
})();
