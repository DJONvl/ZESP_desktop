// cluster.js — окно «Кластер»: эта нода, участники, найденные, спаривание по коду.
// Dependencies: window-engine.js (WinEngine), REST /api/cluster/*.
(function () {
  'use strict';

  var CL_CSS =
    '.cl-wrap{position:relative;display:flex;flex-direction:column;height:100%;background:var(--bg);color:var(--text);font-size:13px}' +
    '.cl-self{margin:10px 12px 8px;padding:12px;background:var(--bg2);border:1px solid var(--border);border-radius:10px}' +
    '.cl-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}' +
    '.cl-row b{font-size:15px;color:var(--text);font-weight:600}' +
    '.cl-dot{width:9px;height:9px;border-radius:50%;background:var(--muted);flex-shrink:0}' +
    '.cl-dot.ok{background:var(--green);box-shadow:0 0 6px var(--green)}' +
    '.cl-dot.warn{background:var(--yellow)}' +
    '.cl-badge{font-size:10px;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:999px;border:1px solid var(--border2);color:var(--muted);background:transparent}' +
    '.cl-badge.ok{color:var(--green);border-color:var(--green)}' +
    '.cl-badge.warn{color:var(--yellow);border-color:var(--yellow)}' +
    '.cl-badge.master{color:var(--accent);border-color:var(--accent)}' +
    '.cl-meta{color:var(--muted);font-size:12px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cl-idline{margin-top:6px;display:flex;align-items:center;gap:6px;color:var(--muted);font-size:12px}' +
    '.cl-idline code{color:var(--text);background:var(--bg3);border:1px solid var(--border);border-radius:5px;padding:1px 6px;font-size:11px}' +
    '.cl-mini{background:var(--bg3);color:var(--muted);border:1px solid var(--border2);border-radius:5px;cursor:pointer;padding:1px 6px;font-size:12px}' +
    '.cl-mini:hover{background:var(--hover);color:var(--text)}' +
    '.cl-chk{width:15px;height:15px;accent-color:var(--accent);cursor:pointer;flex-shrink:0}' +
    '.cl-prog{color:var(--accent)}' +
    '.cl-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}' +
    '.cl-actions button,.cl-actions a{font:inherit;font-size:12px;padding:7px 12px;border-radius:7px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);cursor:pointer;text-decoration:none}' +
    '.cl-actions button:hover,.cl-actions a:hover{background:var(--hover)}' +
    '.cl-actions .cl-primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}' +
    '.cl-actions .cl-primary:hover{background:var(--accent-dark)}' +
    '.cl-cols{display:flex;gap:12px;flex:1;min-height:0;padding:0 12px 10px}' +
    '.cl-col{flex:1;display:flex;flex-direction:column;min-width:0;background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden}' +
    '.cl-colhead{display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:var(--bg3);border-bottom:1px solid var(--border);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}' +
    '.cl-count{background:var(--bg);border:1px solid var(--border);border-radius:999px;padding:0 7px;font-size:11px;color:var(--muted)}' +
    '.cl-list{overflow:auto;padding:8px;flex:1;min-height:60px}' +
    '.cl-card{background:var(--bg);border:1px solid var(--border);border-radius:9px;padding:10px;margin-bottom:8px}' +
    '.cl-card:last-child{margin-bottom:0}' +
    '.cl-card .cl-meta{margin-top:4px}' +
    '.cl-card-actions{display:flex;gap:6px;margin-top:8px}' +
    '.cl-card-actions button{font:inherit;font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);cursor:pointer}' +
    '.cl-card-actions button:hover{background:var(--hover)}' +
    '.cl-card-actions .cl-primary{background:var(--accent);border-color:var(--accent);color:#fff}' +
    '.cl-card-actions .cl-primary:hover{background:var(--accent-dark)}' +
    '.cl-empty{color:var(--faint);font-size:12px;line-height:1.6;padding:10px 6px}' +
    '.cl-off{display:flex;align-items:center;gap:8px;margin:0 12px 8px;padding:8px 12px;border-radius:8px;background:var(--bg3);border:1px solid var(--yellow);color:var(--yellow);font-size:12px}' +
    '.cl-status{min-height:26px;padding:0 14px 8px;color:var(--muted);font-size:12px}' +
    '.cl-status.bad{color:var(--red)}' +
    '.cl-svc{border-top:1px dashed var(--border);padding:7px 0}' +
    '.cl-svc:first-of-type{border-top:0;padding-top:2px}' +
    '.cl-kind{font-size:10px;letter-spacing:.05em;padding:1px 6px;border-radius:4px;border:1px solid var(--border2);color:var(--muted);background:var(--bg3)}' +
    '.cl-kind.tts{color:var(--accent);border-color:var(--accent)}' +
    '.cl-kind.asr{color:var(--green);border-color:var(--green)}' +
    '.cl-voices{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}' +
    '.cl-voice{font-size:10px;padding:1px 7px;border-radius:999px;border:1px solid var(--border2);color:var(--muted);background:var(--bg3)}' +
    '.cl-voice.cur{color:var(--accent);border-color:var(--accent)}' +
    '.cl-sel{font:inherit;font-size:11px;padding:3px 6px;border-radius:6px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);max-width:150px}' +
    '.cl-policy{margin-top:8px;padding:8px;border:1px dashed var(--border);border-radius:8px;background:var(--bg)}' +
    '.cl-policy-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:11px;color:var(--muted);margin:4px 0}' +
    '.cl-policy-row b{color:var(--text);font-size:10px;text-transform:uppercase;letter-spacing:.05em;min-width:32px}' +
    '.cl-pill{font-size:10px;padding:1px 7px;border-radius:999px;border:1px solid var(--border2);color:var(--muted)}' +
    '.cl-pill.main{color:var(--accent);border-color:var(--accent)}' +
    '.cl-modal{position:absolute;inset:0;background:rgba(8,12,20,.58);display:flex;align-items:center;justify-content:center;padding:16px;z-index:20}' +
    '.cl-modal.hidden{display:none}' +
    '.cl-box{width:100%;max-width:380px;background:var(--bg2);border:1px solid var(--border2);border-radius:12px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.35)}' +
    '.cl-box h3{margin:0 0 4px;font-size:15px;color:var(--text)}' +
    '.cl-box label{display:block;margin:14px 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}' +
    '.cl-box input{width:100%;box-sizing:border-box;font:16px ui-monospace,monospace;letter-spacing:.32em;text-align:center;padding:11px 10px;border-radius:8px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);outline:none}' +
    '.cl-box input:focus{border-color:var(--accent)}' +
    '.cl-hint{color:var(--muted);font-size:11px;margin-top:7px;line-height:1.5}' +
    '.cl-err{color:var(--red);font-size:12px;min-height:18px;margin-top:8px}' +
    '.cl-box-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}' +
    '.cl-box-actions button{font:inherit;font-size:12px;padding:8px 14px;border-radius:7px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);cursor:pointer}' +
    '.cl-box-actions button:hover{background:var(--hover)}' +
    '.cl-box-actions .cl-primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}' +
    '.cl-box-actions .cl-primary:hover{background:var(--accent-dark)}' +
    '.cl-box-actions button:disabled{opacity:.55;cursor:default}' +
    '.cl-bigcode{font:700 40px/1.2 ui-monospace,monospace;letter-spacing:.18em;text-align:center;color:var(--accent);margin:18px 0 6px}' +
    '@media(max-width:720px){.cl-cols{flex-direction:column}.cl-col{min-height:120px}}';

  var CL_BODY =
    '<div class="cl-wrap">' +
    '<div id="cl_off" class="cl-off" style="display:none">Обнаружение выключено в конфиге (<code>Cluster.enable = "0"</code>) — ноды не видны.</div>' +
    '<div id="cl_self" class="cl-self"></div>' +
    '<div class="cl-cols">' +
    '<div class="cl-col"><div class="cl-colhead"><span>Участники</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<button id="cl_upd_btn" class="cl-mini" onclick="clUpdateSelected()" style="display:none">Обновить</button>' +
    '<span id="cl_n_paired" class="cl-count">0</span></span></div><div id="cl_paired" class="cl-list"></div></div>' +
    '<div class="cl-col"><div class="cl-colhead"><span>Найденные</span><span id="cl_n_found" class="cl-count">0</span></div><div id="cl_found" class="cl-list"></div></div>' +
    '<div class="cl-col"><div class="cl-colhead"><span>Сервисы</span>' +
    '<span style="display:flex;align-items:center;gap:6px">' +
    '<button class="cl-mini" onclick="clRescanServices()" title="Искать TTS/ASR в сети">Сканировать</button>' +
    '<span id="cl_n_svc" class="cl-count">0</span></span></div>' +
    '<div id="cl_svc" class="cl-list"></div></div>' +
    '</div>' +
    '<div id="cl_status" class="cl-status"></div>' +
    '<div id="cl_add_modal" class="cl-modal hidden"><div class="cl-box">' +
    '<h3>Добавить ноду</h3><div id="cl_add_sub" class="cl-hint"></div>' +
    '<label for="cl_add_code">Код с ноды</label>' +
    '<input id="cl_add_code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000">' +
    '<div class="cl-hint">Код виден на <code>/setup</code> этой ноды или в логе при старте.</div>' +
    '<div id="cl_add_err" class="cl-err"></div>' +
    '<div class="cl-box-actions"><button onclick="clCloseAdd()">Отмена</button>' +
    '<button id="cl_add_ok" class="cl-primary" onclick="clAdd()">Добавить</button></div>' +
    '</div></div>' +
    '<div id="cl_code_modal" class="cl-modal hidden"><div class="cl-box">' +
    '<h3>Код этой ноды</h3><div id="cl_code_sub" class="cl-hint"></div>' +
    '<div id="cl_code_val" class="cl-bigcode">—</div>' +
    '<div class="cl-hint" style="text-align:center">Введите его в окне «Кластер» на мастере.</div>' +
    '<div class="cl-box-actions"><button class="cl-primary" onclick="clCloseCode()">Готово</button></div>' +
    '</div></div>' +
    '</div>';

  var cl_state = { data: null, services: null, timer: null, fast: 0, addPeer: null, flashTimer: 0, node: null, selected: {}, progress: {}, updateH: null };

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
      clRenderServices();
    }).catch(function () {});
  };

  function clFastPoll() {
    if (cl_state.fast) clearTimeout(cl_state.fast);
    var n = 0;
    (function tick() {
      clRefresh();
      n++;
      if (n < 5) cl_state.fast = setTimeout(tick, 1000);
    })();
  }

  // ── рендер ───────────────────────────────────────────────────────────────
  function clRender() {
    var d = cl_state.data;
    if (!d || !d.self) return;

    var off = document.getElementById('cl_off');
    if (off) off.style.display = d.enabled ? 'none' : 'flex';

    var self = d.self;
    var isMaster = !!(d.masterId && d.masterId === self.node);
    var selfPaired = self.state === 'paired';
    var html = '' +
      '<div class="cl-row">' +
      '<span class="cl-dot ' + (selfPaired ? 'ok' : 'warn') + '"></span>' +
      '<b>' + clEsc(self.name || '—') + '</b>' +
      '<span class="cl-badge ' + (selfPaired ? 'ok' : 'warn') + '">' + (selfPaired ? 'В кластере' : 'Не в кластере') + '</span>' +
      (isMaster ? '<span class="cl-badge master">Мастер</span>' : '') +
      '</div>' +
      '<div class="cl-meta">' + clEsc(self.role) + ' · ' + clEsc(self.ver || '') +
      (self.priority ? ' · приоритет ' + clEsc(self.priority) : '') +
      (self.term ? ' · term ' + clEsc(self.term) : '') +
      ' · ' + clEsc(location.hostname) + ':' + clEsc(self.http || '') + '</div>' +
      '<div class="cl-idline">nodeID <code>' + clEsc(String(self.node || '').slice(0, 8)) + '…</code>' +
      '<button class="cl-mini" onclick="clCopyNode()" title="Копировать nodeID">⧉</button></div>' +
      '<div class="cl-actions">' +
      '<button onclick="clShowCode()">Показать мой код</button>' +
      '<a href="/setup" target="_blank" rel="noopener">Настройки</a>' +
      '<button onclick="clRefresh()">Обновить</button>' +
      '</div>';
    var selfEl = document.getElementById('cl_self');
    if (selfEl) selfEl.innerHTML = html;

    var peers = (d.peers || []).slice();
    var paired = peers.filter(function (p) { return p.state === 'paired'; });
    var found = peers.filter(function (p) { return p.state !== 'paired'; });

    var n1 = document.getElementById('cl_n_paired');
    var n2 = document.getElementById('cl_n_found');
    if (n1) n1.textContent = String(paired.length);
    if (n2) n2.textContent = String(found.length);

    var pEl = document.getElementById('cl_paired');
    var selfVer = self.ver || '';
    var updatable = selfVer !== '' && selfVer.indexOf('dev') !== 0;
    // Выбор не должен переживать исчезнувшую ноду.
    var sel = {};
    peers.forEach(function (p) { if (cl_state.selected[p.node]) sel[p.node] = true; });
    cl_state.selected = sel;

    if (pEl) {
      pEl.innerHTML = paired.length
        ? paired.map(function (p) {
            var canUpdate = updatable && p.node !== d.masterId && (p.ver || '') !== selfVer;
            return clCard(p, true, d.masterId, canUpdate, selfVer);
          }).join('')
        : '<div class="cl-empty">Пока никого. Добавьте ноду из колонки «Найденные» по коду с неё.</div>';
    }

    var fEl = document.getElementById('cl_found');
    if (fEl) {
      fEl.innerHTML = found.length
        ? found.map(function (p) { return clCard(p, false, d.masterId, false, selfVer); }).join('')
        : '<div class="cl-empty">Новых нод не видно. Проверьте, что у них включено обнаружение и они в одной сети (или прописаны в <code>Cluster.peers</code>).</div>';
    }

    var btn = document.getElementById('cl_upd_btn');
    if (btn) {
      var nsel = Object.keys(cl_state.selected).length;
      btn.style.display = nsel ? '' : 'none';
      btn.textContent = 'Обновить (' + nsel + ')';
    }
  }

  // ── сервисы TTS/ASR ──────────────────────────────────────────────────────
  function clRenderServices() {
    var box = document.getElementById('cl_svc');
    if (!box) return;
    var d = cl_state.services;
    var list = (d && d.providers) || [];
    var n = document.getElementById('cl_n_svc');
    if (n) n.textContent = String(list.length);
    if (!list.length) {
      box.innerHTML = '<div class="cl-empty">Провайдер не виден: mDNS не проходит через эту сеть. ' +
        'Выбор ниже всё равно работает по сохранённому адресу.</div>' + clPolicyBlock();
      return;
    }
    box.innerHTML = list.map(clProviderCard).join('') + clPolicyBlock();
  }

  // ── политика: что выбрано основным ───────────────────────────────────────
  function clPolicy() {
    var d = cl_state.services || {};
    return d.effective || d.policy || {};
  }

  function clLocal() {
    return (cl_state.services && cl_state.services.local) || {};
  }

  function clHasLocal() {
    var l = clLocal();
    return (l.tts || []).length > 0 || (l.asr || []).length > 0;
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
      clRenderServices();
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
    var cur = clChoice(kind, provider, service) || {};
    var rest = clVariants(kind).filter(function (c) { return !clSame(c, provider, service); });
    clPolicySend(kind, [{
      provider: provider, service: service,
      voice: cur.voice || clFirstVoice(kind, provider, service),
      model: cur.model || clFirstModel(kind, provider, service)
    }].concat(rest));
  };

  window.clSetReserve = function (kind, provider, service) {
    var cur = clChoice(kind, provider, service) || {};
    var rest = clVariants(kind).filter(function (c) { return !clSame(c, provider, service); });
    rest.push({
      provider: provider, service: service,
      voice: cur.voice || clFirstVoice(kind, provider, service),
      model: cur.model || clFirstModel(kind, provider, service)
    });
    clPolicySend(kind, rest);
  };

  window.clRemoveChoice = function (kind, provider, service) {
    clPolicySend(kind, clVariants(kind).filter(function (c) { return !clSame(c, provider, service); }));
  };

  window.clSetVoice = function (kind, provider, service, value) {
    var cur = clChoice(kind, provider, service);
    if (!cur) {
      // Ещё не выбран — этот голос/модель делает сервис основным.
      var rest = clVariants(kind).filter(function (c) { return !clSame(c, provider, service); });
      var item = { provider: provider, service: service, voice: '', model: '' };
      if (kind === 'asr') item.model = value; else item.voice = value;
      clPolicySend(kind, [item].concat(rest));
      return;
    }
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

  function clPolicyBlock() {
    var kinds = ['tts', 'asr', 'vad'];
    var rows = kinds.map(function (kind) {
      var arr = clVariants(kind);
      var pills = arr.length
        ? arr.map(function (c, i) {
            var suffix = c.voice ? ' · ' + clVoiceLabel(c.provider, c.service, c.voice) : '';
            var label = clProviderName(c.provider) + ' · ' + c.service + suffix;
            return '<span class="cl-pill' + (i === 0 ? ' main' : '') + '">' + (i + 1) + '. ' +
              clEsc(label) + '</span>';
          }).join('')
        : '<span class="cl-pill">не выбран</span>';
      return '<div class="cl-policy-row"><b>' + kind.toUpperCase() + '</b>' + pills + '</div>';
    }).join('');
    var head = '<div class="cl-meta" style="margin:0 0 4px">В работе' +
      (clHasLocal() ? ' · <b style="color:var(--accent)">своё для этой ноды</b>' : '') + '</div>';
    return '<div class="cl-policy">' + head + rows +
      (clHasLocal() ? '<div class="cl-card-actions"><button onclick="clResetLocal()">Как у всех</button></div>' : '') +
      '</div>';
  }

  window.clResetLocal = function () {
    clFetchJSON('/api/cluster/services/local/reset', { method: 'POST' }).then(function (d) {
      if (cl_state.services) {
        cl_state.services.local = {};
        cl_state.services.effective = d.effective;
      }
      clRenderServices();
      clFlash('Снова как у всех');
    }).catch(function (e) {
      clFlash('Не сбросилось: ' + e.message, false);
    });
  };

  function clProviderCard(p) {
    var m = p.manifest || {};
    var svcs = m.services || [];
    var badges = '';
    badges += p.signed
      ? '<span class="cl-badge ok">подписано</span>'
      : '<span class="cl-badge warn">без подписи</span>';
    if (!p.online) badges += '<span class="cl-badge warn">офлайн</span>';
    var body = svcs.length
      ? svcs.map(function (s) { return clServiceRow(p, s); }).join('')
      : '<div class="cl-empty">Манифест пуст.</div>';
    return '' +
      '<div class="cl-card">' +
      '<div class="cl-row"><span class="cl-dot ' + (p.online ? 'ok' : 'warn') + '"></span>' +
      '<b>' + clEsc(p.name || p.id) + '</b>' + badges + '</div>' +
      '<div class="cl-meta">' + clEsc(p.addr) + ' · ' + clEsc(p.id) +
      (p.online ? ' · ' + clEsc(clAgo(p.seen)) : '') + '</div>' +
      (p.error ? '<div class="cl-meta cl-err">' + clEsc(p.error) + '</div>' : '') +
      body +
      '</div>';
  }

  function clServiceRow(p, s) {
    var kind = String(s.kind || '').toLowerCase();
    var running = s.state === 'running';
    var meta = [];
    var h = s.health || {};
    if (h.engine) meta.push(h.engine);
    if (h.model) meta.push(h.model);
    if (h.capacity) meta.push('потоков ' + h.capacity);
    if (s.transport) meta.push(s.transport);
    var choice = clChoice(kind, p.id, s.id);
    var isMain = false;
    if (choice) {
      var arr = clVariants(kind);
      isMain = arr.length > 0 && clSame(arr[0], p.id, s.id);
    }

    var chooser = '';
    if (kind === 'tts' && (s.voices || []).length) {
      var selected = choice ? choice.voice || '' : '';
      chooser = '<select class="cl-sel" onchange="clSetVoice(\'' + clEsc(kind) + '\',\'' +
        clEsc(p.id) + '\',\'' + clEsc(s.id) + '\',this.value)">' +
        (s.voices || []).map(function (v) {
          var sel = v.value === selected ? ' selected' : '';
          return '<option value="' + clEsc(v.value) + '"' + sel + '>' + clEsc(v.label || v.value) + '</option>';
        }).join('') + '</select>';
    } else if (kind === 'asr' && (s.models || []).length) {
      var selModel = choice ? choice.model || '' : '';
      chooser = '<select class="cl-sel" onchange="clSetVoice(\'' + clEsc(kind) + '\',\'' +
        clEsc(p.id) + '\',\'' + clEsc(s.id) + '\',this.value)">' +
        (s.models || []).map(function (mv) {
          var sel = mv.value === selModel ? ' selected' : '';
          return '<option value="' + clEsc(mv.value) + '"' + sel + '>' + clEsc(mv.label || mv.value) + '</option>';
        }).join('') + '</select>';
    }

    var actions = '';
    if (choice) {
      actions = '<span class="cl-badge ' + (isMain ? 'ok' : '') + '">' +
        (isMain ? 'основной' : 'резерв') + '</span>' +
        '<button onclick="clRemoveChoice(\'' + clEsc(kind) + '\',\'' + clEsc(p.id) + '\',\'' + clEsc(s.id) + '\')">Убрать</button>';
    } else {
      actions = '<button class="cl-primary" onclick="clSetPrimary(\'' + clEsc(kind) + '\',\'' +
        clEsc(p.id) + '\',\'' + clEsc(s.id) + '\')">Основной</button>' +
        '<button onclick="clSetReserve(\'' + clEsc(kind) + '\',\'' + clEsc(p.id) + '\',\'' + clEsc(s.id) + '\')">В резерв</button>';
    }
    actions += kind === 'vad'
      ? ''
      : '<button onclick="clTestService(\'' + clEsc(kind) + '\',\'' + clEsc(p.id) + '\',\'' + clEsc(s.id) + '\')">Проверить</button>';

    return '' +
      '<div class="cl-svc">' +
      '<div class="cl-row"><span class="cl-kind ' + clEsc(kind) + '">' + clEsc(kind.toUpperCase()) + '</span>' +
      '<span class="cl-dot ' + (running ? 'ok' : 'warn') + '"></span>' +
      '<b>' + clEsc(s.id) + '</b></div>' +
      (meta.length ? '<div class="cl-meta">' + clEsc(meta.join(' · ')) + '</div>' : '') +
      '<div class="cl-card-actions">' + chooser + actions + '</div>' +
      '</div>';
  }

  window.clRescanServices = function () {
    clFetchJSON('/api/cluster/services/rescan', { method: 'POST' }).then(function () {
      clFlash('Ищу сервисы в сети…');
      setTimeout(clRefresh, 1200);
      setTimeout(clRefresh, 4000);
    }).catch(function (e) {
      clFlash('Скан не запустился: ' + e.message, false);
    });
  };

  function clCard(p, paired, masterId, canUpdate, selfVer) {
    var host = clHost(p.addr);
    var httpPort = p.http || '8081';
    var isMaster = !!(masterId && masterId === p.node);
    var badge = isMaster ? '<span class="cl-badge master">Мастер</span>' : '';
    var chk = canUpdate
      ? '<input type="checkbox" class="cl-chk" ' + (cl_state.selected[p.node] ? 'checked' : '') +
        ' onchange="clToggle(\'' + clEsc(p.node) + '\',this.checked)" title="Выбрать для обновления">'
      : '';
    var actions = paired
      ? '<button onclick="clOpenUi(\'' + clEsc(host) + '\',\'' + clEsc(httpPort) + '\')">Открыть интерфейс ↗</button>'
      : '<button class="cl-primary" onclick="clOpenAdd(\'' + clEsc(p.node) + '\')">Добавить</button>';
    var prog = cl_state.progress[p.node] || '';
    return '' +
      '<div class="cl-card">' +
      '<div class="cl-row">' + chk + '<span class="cl-dot ' + (paired ? 'ok' : 'warn') + '"></span>' +
      '<b>' + clEsc(p.name || '—') + '</b>' + badge + '</div>' +
      '<div class="cl-meta">' + clEsc(p.role || '') + ' · ' + clEsc(p.ver || '') +
      (p.term ? ' · term ' + clEsc(p.term) : '') +
      ' · ' + clEsc(host) + ':' + clEsc(httpPort) + '</div>' +
      '<div class="cl-meta">отклик ' + clEsc(clAgo(p.lastSeen)) + '</div>' +
      (prog ? '<div class="cl-meta cl-prog">' + clEsc(prog) + '</div>' : '') +
      '<div class="cl-card-actions">' + actions + '</div>' +
      '</div>';
  }

  window.clToggle = function (nodeId, on) {
    if (on) {
      cl_state.selected[nodeId] = true;
    } else {
      delete cl_state.selected[nodeId];
    }
    clRender();
  };

  window.clUpdateSelected = function () {
    var nodes = Object.keys(cl_state.selected);
    if (!nodes.length) {
      clFlash('Отметьте ноды для обновления', false);
      return;
    }
    cl_state.progress = {};
    clFetchJSON('/api/cluster/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nodes: nodes })
    }).then(function (d) {
      clFlash('Обновление отправлено: ' + (d.sent || 0) + ' нод (версия ' + (d.tag || '') + ')');
      cl_state.selected = {};
      clRender();
    }).catch(function (e) {
      clFlash('Ошибка обновления: ' + e.message, false);
    });
  };

  // ── действия ─────────────────────────────────────────────────────────────
  window.clCopyNode = function () {
    var d = cl_state.data;
    if (!d || !d.self) return;
    clCopy(d.self.node, 'nodeID скопирован');
  };

  function clCopy(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { clFlash(msg); }, function () { clFlash('Не удалось скопировать', false); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); clFlash(msg); } catch (e) { clFlash('Не удалось скопировать', false); }
    document.body.removeChild(ta);
  }

  window.clOpenUi = function (host, port) {
    if (!host) return;
    window.open('http://' + host + ':' + (port || '8081'), '_blank', 'noopener');
  };

  window.clShowCode = function () {
    clFetchJSON('/api/cluster/code').then(function (d) {
      if (d.paired) {
        clFlash('Эта нода уже в кластере. Выйти можно на странице /setup.');
        return;
      }
      var v = document.getElementById('cl_code_val');
      var s = document.getElementById('cl_code_sub');
      if (v) v.textContent = d.code || '—';
      if (s) s.textContent = 'Действует ещё ~' + (d.left || 0) + ' мин. Код одноразовый.';
      var m = document.getElementById('cl_code_modal');
      if (m) m.classList.remove('hidden');
    }).catch(function (e) {
      if (e.status === 403) clFlash('Код виден только при открытии окна с самой ноды. Удалённо: /setup?token=… (токен в логе).', false);
      else clFlash(e.message, false);
    });
  };

  window.clCloseCode = function () {
    var m = document.getElementById('cl_code_modal');
    if (m) m.classList.add('hidden');
  };

  window.clOpenAdd = function (nodeId) {
    var d = cl_state.data;
    var peer = null;
    if (d) {
      for (var i = 0; i < d.peers.length; i++) {
        if (d.peers[i].node === nodeId) { peer = d.peers[i]; break; }
      }
    }
    if (!peer) { clFlash('Нода пропала из сети', false); return; }
    cl_state.addPeer = peer;
    var sub = document.getElementById('cl_add_sub');
    if (sub) sub.innerHTML = '<b>' + clEsc(peer.name) + '</b> · ' + clEsc(clHost(peer.addr)) + ':' + clEsc(peer.http || '8081') + ' · ' + clEsc(peer.ver || '');
    var err = document.getElementById('cl_add_err');
    if (err) err.textContent = '';
    var inp = document.getElementById('cl_add_code');
    if (inp) inp.value = '';
    var m = document.getElementById('cl_add_modal');
    if (m) m.classList.remove('hidden');
    if (inp) setTimeout(function () { inp.focus(); }, 50);
  };

  window.clCloseAdd = function () {
    var m = document.getElementById('cl_add_modal');
    if (m) m.classList.add('hidden');
    cl_state.addPeer = null;
  };

  window.clAdd = function () {
    var peer = cl_state.addPeer;
    var inp = document.getElementById('cl_add_code');
    var err = document.getElementById('cl_add_err');
    var ok = document.getElementById('cl_add_ok');
    if (!peer || !inp) return;
    var code = String(inp.value || '').replace(/\D/g, '');
    if (code.length !== 6) {
      if (err) err.textContent = 'Код — 6 цифр';
      return;
    }
    if (err) err.textContent = '';
    if (ok) { ok.disabled = true; ok.textContent = 'Соединяюсь…'; }
    clFetchJSON('/api/cluster/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ peer: peer.node, code: code })
    }).then(function () {
      if (ok) { ok.disabled = false; ok.textContent = 'Добавить'; }
      clCloseAdd();
      clFlash('Нода «' + (peer.name || peer.node) + '» добавлена. Ждём подтверждения…');
      clFastPoll();
    }).catch(function (e) {
      if (ok) { ok.disabled = false; ok.textContent = 'Добавить'; }
      var msg = e.message || 'Ошибка';
      if (e.status === 403) msg = 'Неверный или просроченный код';
      else if (e.status === 429) msg = 'Слишком много попыток, подождите 5 минут';
      else if (e.status === 409) msg = 'Нода уже в другом кластере — сначала выйдите из него на самой ноде';
      else if (e.status === 404) msg = 'Нода пропала из сети';
      if (err) err.textContent = msg;
    });
  };

  // Enter в поле кода отправляет форму.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var m = document.getElementById('cl_add_modal');
    if (!m || m.classList.contains('hidden')) return;
    var inp = document.getElementById('cl_add_code');
    if (inp && document.activeElement === inp) { e.preventDefault(); clAdd(); }
  });

  // ── регистрация окна ─────────────────────────────────────────────────────
  window.WinEngine && window.WinEngine.register({
    id: 'cluster',
    title: 'Кластер',
    label: 'Кластер',
    icon: '<img src="/static/icons/cluster.svg" alt="">',
    single: true,
    template: '<div class="window hidden" data-x="120" data-y="50" data-w="1120" data-h="640">' +
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
      cl_state.selected = {};
      cl_state.progress = {};
      // Прогресс обновления нод приходит из wsSend мастера.
      cl_state.updateH = function (ev) {
        if (!ev || !ev.node) return;
        cl_state.progress[ev.node] = ev.msg;
        clRender();
      };
      if (window.eventE) eventE.on('clusterUpdate', cl_state.updateH);
      clRefresh();
      if (cl_state.timer) clearInterval(cl_state.timer);
      cl_state.timer = setInterval(clRefresh, 5000);
    },
    destroy: function () {
      if (cl_state.timer) clearInterval(cl_state.timer);
      if (cl_state.fast) clearTimeout(cl_state.fast);
      if (cl_state.flashTimer) clearTimeout(cl_state.flashTimer);
      if (window.eventE && cl_state.updateH) eventE.off('clusterUpdate', cl_state.updateH);
      cl_state = { data: null, services: null, timer: null, fast: 0, addPeer: null, flashTimer: 0, node: null, selected: {}, progress: {}, updateH: null };
    }
  });
})();
