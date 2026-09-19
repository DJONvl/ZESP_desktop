// window-engine.js — свободный движок окон. Ничего не знает о конкретных виджетах.
// Виджеты регистрируются через WinEngine.register({ id, title, icon, label, single, template,
//   setup(node, opts), destroy(node), onFocus(node), activate(node, opts) })
// и открываются через WinEngine.open(id, opts).
// Движок отвечает: создание/закрытие/фокус окон, drag/resize (свой, с учётом zoom), мобильная адаптация,
// сохранение/восстановление раскладки (localStorage 'windowLayout'), ярлыки рабочего стола,
// старт-меню, событие 'layout' (для перерисовки виджетов после изменений).
window.WinEngine = (function () {
  const registry = new Map();       // id -> def
  const layoutListeners = new Set();
  let winZ = 1;
  let winUid = 0;

  function desktop() { return document.getElementById('desktop') }
  function getZoom() { return window.getZoom ? window.getZoom() : 1 }
  function isMobile() { return document.body.classList.contains('mobile-layout') }
  function windows() { return document.querySelectorAll('#desktop .window') }
  function windowsOf(id) { return document.querySelectorAll(`#desktop .window[data-wid="${id}"]`) }
  function countOf(id) { return windowsOf(id).length }

  // ---------- registry ----------
  function register(def) {
    registry.set(def.id, def);
  }
  function getDef(id) { return registry.get(id) }

  // ---------- layout events ----------
  function on(event, cb) {
    if (event === 'layout') layoutListeners.add(cb);
  }
  function emitLayout() {
    layoutListeners.forEach(cb => { try { cb() } catch (e) { console.error('layout listener error:', e) } });
    renderTaskbar();
  }

  // ---------- open / close / focus ----------
  function open(id, opts = {}) {
    const def = registry.get(id);
    if (!def) return null;
    if (def.single && !opts.force) {
      const existing = windowsOf(id)[0];
      if (existing) {
        focus(existing);
        if (def.activate) def.activate(existing, opts);
        emitLayout();
        return existing;
      }
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = def.template;
    const node = wrap.firstElementChild;
    node.classList.remove('hidden');
    node.id = '';
    node.dataset.wid = id;
    node.dataset.uid = 'win-' + (++winUid);
    positionNode(node, def, opts);
    desktop().appendChild(node);
    wireWindow(node, def);
    // переводим заголовок окна (для шаблонов без data-i18n у wtitle)
    const wtitle = node.querySelector('.wtitle');
    if (wtitle && !wtitle.hasAttribute('data-i18n')) {
      wtitle.textContent = wt(def, 'ui.title', def.title || def.label || id);
    }
    if (def.setup) def.setup(node, opts);
    if (def.single && def.activate) def.activate(node, opts);
    saveLayout();
    emitLayout();
    return node;
  }

  function positionNode(node, def, opts) {
    const d = desktop();
    const w = Number(node.dataset.w) || 400;
    const h = Number(node.dataset.h) || 300;
    const x = Number(node.dataset.x) || 10;
    const y = Number(node.dataset.y) || 10;
    if (opts.pos) {
      node.style.left = opts.pos.x + 'px';
      node.style.top = opts.pos.y + 'px';
      node.style.width = opts.pos.w + 'px';
      node.style.height = opts.pos.h + 'px';
      if (opts.pos.minimized) setMinimized(node, true);
      return;
    }
    if (opts.anchor) {
      const z = getZoom();
      const r = opts.anchor.getBoundingClientRect();
      const dr = d.getBoundingClientRect();
      const off = countOf(id) * 24;
      node.style.left = Math.max(4, (r.right - dr.left) / z - w + off) + 'px';
      node.style.top = Math.max(4, (r.top - dr.top) / z + off) + 'px';
      node.style.width = w + 'px';
      node.style.height = (r.height / z) + 'px';
      return;
    }
    const existing = windowsOf(node.dataset.wid).length;
    const off = existing * 24;
    node.style.left = Math.max(4, Math.round(d.clientWidth / 2 - w / 2) + off) + 'px';
    node.style.top = Math.max(4, Math.round(d.clientHeight / 2 - h / 2) + off) + 'px';
    node.style.width = Math.min(w, d.clientWidth - 8) + 'px';
    node.style.height = Math.min(h, d.clientHeight - 8) + 'px';
  }

  function close(node) {
    if (!node || !node.parentNode) return;
    if (typeof roseWin !== 'undefined' && node === roseWin && roseCloser) roseCloser(true);
    const def = registry.get(node.dataset.wid);
    if (def && def.destroy) { try { def.destroy(node) } catch (e) { console.error('destroy error:', e) } }
    const toolbar = node.querySelector('.c-tools, .chart-tools');
    if (toolbar && toolbar.__menu) { toolbar.__menu.remove(); toolbar.__menu = null }
    if (toolbar && toolbar.__ro) { toolbar.__ro.disconnect(); toolbar.__ro = null }
    node.remove();
    saveLayout();
    emitLayout();
  }

  function focus(node) {
    if (!node) return;
    node.style.zIndex = ++winZ;
    const def = registry.get(node.dataset.wid);
    if (def && def.onFocus) { try { def.onFocus(node) } catch (e) { console.error('onFocus error:', e) } }
  }

  function setMinimized(node, min) {
    if (!node) return;
    node.classList.toggle('minimized', min);
    node.querySelectorAll('.wbtn[data-waction="min"]').forEach(b => b.textContent = min ? '+' : '–');
  }

  // ---------- window chrome (min / max / close / focus) ----------
  function wireWindow(win, def) {
    win.style.zIndex = ++winZ;
    // Клик в любом месте окна (не только в шапку) поднимает его наверх,
    // иначе перекрытое окно нельзя взять за край для ресайза.
    win.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.wbtn')) return;
      focus(win);
    });
    const head = win.querySelector('.window-head');
    if (head) head.addEventListener('pointerdown', () => focus(win));
    // На тач-устройствах браузер перехватывает жест (скролл/зум) и ресайз «срывается»,
    // если у .window стоит touch-action:manipulation. Но ставить touch-action:none на всё
    // окно нельзя — сломается прокрутка внутри (.window-body с pan-y). Поэтому отключаем
    // обработку браузером только на время жеста, начавшегося у краёв или в шапке.
    const edgeZone = 12;
    win.addEventListener('pointerdown', (e) => {
      const r = win.getBoundingClientRect();
      const onHeader = e.target.closest('.window-head');
      const nearEdge = e.clientX < r.left + edgeZone || e.clientX > r.right - edgeZone || e.clientY > r.bottom - edgeZone;
      if (!onHeader && !nearEdge) return;
      win.style.touchAction = 'none';
      const restore = () => { win.style.touchAction = ''; cleanup() };
      const cleanup = () => {
        win.removeEventListener('pointerup', restore);
        win.removeEventListener('pointercancel', restore);
      };
      win.addEventListener('pointerup', restore);
      win.addEventListener('pointercancel', restore);
    });
    win.querySelectorAll('.wbtn').forEach(btn => {
      btn.addEventListener('pointerdown', () => { win.style.zIndex = ++winZ });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.waction;
        if (action === 'close') {
          close(win);
          return;
        }
        if (action === 'min') {
          setMinimized(win, !win.classList.contains('minimized'));
        }
        if (action === 'max') {
          if (win.classList.contains('maximized')) {
            win.style.left = (win.dataset.prevLeft || 4) + 'px';
            win.style.top = (win.dataset.prevTop || 4) + 'px';
            win.style.width = (win.dataset.prevWidth || 300) + 'px';
            win.style.height = (win.dataset.prevHeight || 200) + 'px';
            win.classList.remove('maximized');
            btn.textContent = '▢';
          } else {
            const z = getZoom();
            const r = win.getBoundingClientRect();
            const d = desktop().getBoundingClientRect();
            win.dataset.prevLeft = Math.round((r.left - d.left) / z);
            win.dataset.prevTop = Math.round((r.top - d.top) / z);
            win.dataset.prevWidth = Math.round(r.width / z);
            win.dataset.prevHeight = Math.round(r.height / z);
            win.style.left = '4px';
            win.style.top = '4px';
            win.style.width = (desktop().clientWidth - 8) + 'px';
            win.style.height = (desktop().clientHeight - 8) + 'px';
            win.classList.add('maximized');
            btn.textContent = '❐';
          }
          win.style.zIndex = ++winZ;
        }
        saveLayout();
        emitLayout();
      });
    });
    wireCollapsibleToolbar(win);
    wireTouchDragResize(win);
    wireMouseResize(win);
    wireMouseDrag(win);
  }

  // ---------- collapsible window-head toolbar ----------
  // Автоматически применяется к .c-tools / .chart-tools / .ops-tools в шапке окна.
  // Элементы, не влезающие по ширине, помечаются .tb-hidden и переносятся в меню
  // (кнопка «▾»): в меню лежат РЕАЛЬНЫЕ элементы, поэтому <select> и обработчики
  // работают нативно. Пересчёт при каждом изменении размера окна.
  function wireCollapsibleToolbar(win) {
    const toolbar = win.querySelector('.c-tools, .chart-tools, .ops-tools');
    if (!toolbar || toolbar.__collapsed) return;
    toolbar.__collapsed = true;

    const children = [...toolbar.children].filter(el => !el.classList.contains('tb-more'));
    const moreBtn = document.createElement('button');
    moreBtn.className = 'tb-more';
    moreBtn.textContent = '▾';
    moreBtn.title = tl('tb.more', 'Ещё');
    toolbar.appendChild(moreBtn);

    const menu = document.createElement('div');
    menu.className = 'tb-more-menu';
    document.body.appendChild(menu);
    toolbar.__menu = menu;

    function closeMenu() {
      menu.classList.remove('open');
      moreBtn.classList.remove('open');
      menu.innerHTML = '';
    }

    function relayout() {
      // вернуть все элементы на место и сбросить состояния
      children.forEach(el => toolbar.appendChild(el));
      children.forEach(el => { el.classList.remove('tb-hidden'); el.style.display = '' });
      toolbar.appendChild(moreBtn); // ▾ всегда в конце
      closeMenu();

      moreBtn.style.display = '';
      // доступное место для тулбара считаем от ширины шапки, а не от clientWidth тулбара.
      // Заголовку резервируем его естественную ширину (scrollWidth), НО не больше ~50%
      // шапки — чтобы длинный заголовок не вытеснил панель полностью (он обрезается
      // ellipsis'ом, flex-shrink:1, min-width:0).
      const head = win.querySelector('.window-head');
      const title = head.querySelector('.wtitle');
      const wbtns = head.querySelector('.wbtns');
      const hs = getComputedStyle(head);
      const headPad = (parseFloat(hs.paddingLeft) || 0) + (parseFloat(hs.paddingRight) || 0);
      const titleW = Math.min(title ? title.scrollWidth : 0, Math.max(60, head.clientWidth * 0.5));
      const wbtnsW = wbtns ? wbtns.offsetWidth : 0;
      const available = head.clientWidth - headPad - titleW - wbtnsW - moreBtn.offsetWidth - 6;
      let used = 0;
      let cutoff = children.length; // первый скрываемый индекс
      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        if (el.classList.contains('tb-sep')) continue;
        const w = el.offsetWidth;
        if (used + w <= available) {
          used += w + 4;
        } else {
          cutoff = i;
          break;
        }
      }
      // помечаем «хвост» вместе с разделителями, попавшими в него
      children.forEach((el, i) => {
        if (i >= cutoff) { el.classList.add('tb-hidden'); el.style.display = 'none' }
      });
      // если разделитель остался последним видимым — прячем его
      for (let i = cutoff - 1; i >= 0; i--) {
        if (children[i].classList.contains('tb-sep')) { children[i].classList.add('tb-hidden'); children[i].style.display = 'none' }
        else break;
      }
      moreBtn.style.display = (cutoff > 0 && cutoff < children.length) ? '' : 'none';
      // ограничиваем заголовок, чтобы он не расширился обратно и не вытеснил панель
      if (title) {
        const tbW = toolbar.getBoundingClientRect().width / getZoom();
        const rest = head.clientWidth - headPad - wbtnsW - tbW - 6;
        title.style.maxWidth = Math.max(24, rest) + 'px';
      }
    }

    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.classList.contains('open')) { closeMenu(); return }
      // в меню кладём КЛОНЫ скрытых элементов; клики/изменения делегируются оригиналам.
      // Оригиналы остаются в тулбаре, чтобы селекторы виджетов ('.ops-tools .cbtn') работали.
      children.forEach(el => {
        if (!el.classList.contains('tb-hidden') || el.classList.contains('tb-sep')) return;
        const clone = el.cloneNode(true);
        clone.style.display = '';
        const isForm = /^(SELECT|INPUT|TEXTAREA)$/.test(el.tagName);
        if (isForm) {
          clone.addEventListener('change', () => {
            el.value = clone.value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
            closeMenu();
          });
        } else {
          clone.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeMenu();
            el.click();
          });
        }
        menu.appendChild(clone);
      });
      menu.classList.add('open');
      moreBtn.classList.add('open');
      const z = getZoom();
      const wr = moreBtn.getBoundingClientRect();
      const mw = menu.offsetWidth;
      let left = wr.right / z - mw;
      if (left < 8) left = 8;
      let top = wr.bottom / z + 4;
      if (top + menu.offsetHeight > window.innerHeight / z - 8) top = wr.top / z - menu.offsetHeight - 4;
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    });
    document.addEventListener('pointerdown', (e) => {
      if (menu.classList.contains('open') && !menu.contains(e.target) && e.target !== moreBtn) closeMenu();
    });

    // пересчёт при ресайзе окна
    let roTimer;
    const ro = new ResizeObserver(() => {
      clearTimeout(roTimer);
      roTimer = setTimeout(relayout, 60);
    });
    ro.observe(win);
    toolbar.__ro = ro;

    // чтобы клики по «▾» не тянули окно
    moreBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    relayout();
    setTimeout(relayout, 100);
  }

  // ---------- layout persistence ----------
  function saveLayout() {
    const layout = [];
    const d = desktop().getBoundingClientRect();
    windows().forEach(win => {
      const minimized = win.classList.contains('minimized');
      let x, y, w, h;
      if (minimized) {
        x = parseFloat(win.style.left) || 0;
        y = parseFloat(win.style.top) || 0;
        w = parseFloat(win.style.width) || 200;
        h = parseFloat(win.style.height) || 120;
      } else {
        const z = getZoom();
        const r = win.getBoundingClientRect();
        x = (r.left - d.left) / z;
        y = (r.top - d.top) / z;
        w = r.width / z;
        h = r.height / z;
      }
      layout.push({
        uid: win.dataset.uid,
        wid: win.dataset.wid,
        x: Math.round(x),
        y: Math.round(y),
        w: Math.round(w),
        h: Math.round(h),
        minimized,
      });
    });
    localStorage.setItem('windowLayout', JSON.stringify(layout));
  }

  function restore() {
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem('windowLayout') || 'null') } catch { saved = [] }
    if (!Array.isArray(saved)) saved = [];
    saved.forEach(s => {
      const def = registry.get(s.wid);
      if (!def) return;
      open(s.wid, { force: true, pos: { x: s.x, y: s.y, w: s.w, h: s.h, minimized: s.minimized } });
    });
  }

  // ---------- drag / resize ----------
  const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // Собственный ресайз для МЫШИ. Невидимые кромки-ручки поверх всего окна
  // (z-index выше скроллбара), поэтому ресайз работает даже когда под курсором
  // полоса прокрутки. Кромки толще обычных 8px,
  // чтобы перекрывать вертикальный скроллбар.
  const MR_EDGE = 10;
  const MR_MIN_W = 100;
  const MR_MIN_H = 90;

  function wireMouseResize(win) {
    // На тач-устройствах ресайз делает wireTouchDragResize (long-press по шапке).
    // Не вешаем mouse-кромки на тач: они конфликтуют с видимыми rh-ручками
    // (z-index выше), перехватывают скролл у краёв и блокируют прокрутку.
    if (isTouchDevice()) return;
    if (win.__mr) return;
    win.__mr = true;
    const zones = [
      { edge: 'e', cls: 'mr-e', cursor: 'ew-resize' },
      { edge: 'w', cls: 'mr-w', cursor: 'ew-resize' },
      { edge: 's', cls: 'mr-s', cursor: 'ns-resize' },
      { edge: 'n', cls: 'mr-n', cursor: 'ns-resize' },
      { edge: 'se', cls: 'mr-se', cursor: 'nwse-resize' },
      { edge: 'sw', cls: 'mr-sw', cursor: 'nesw-resize' },
      { edge: 'ne', cls: 'mr-ne', cursor: 'nesw-resize' },
      { edge: 'nw', cls: 'mr-nw', cursor: 'nwse-resize' },
    ];
    zones.forEach(z => {
      const d = document.createElement('div');
      d.className = 'mresize-handle ' + z.cls;
      d.style.cursor = z.cursor;
      d.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const zm0 = getZoom();
        const r = win.getBoundingClientRect();
        const dr = desktop().getBoundingClientRect();
        const sx = e.clientX, sy = e.clientY;
        const bx = (r.left - dr.left) / zm0, by = (r.top - dr.top) / zm0;
        const bW = r.width / zm0, bH = r.height / zm0;
        win.style.touchAction = 'none';
        const move = (ev) => {
          const dz = getZoom();
          const dx = (ev.clientX - sx) / dz, dy = (ev.clientY - sy) / dz;
          let w = bW, h = bH, x = bx, y = by;
          if (z.edge.indexOf('e') >= 0) w = bW + dx;
          if (z.edge.indexOf('w') >= 0) { w = bW - dx; x = bx + dx }
          if (z.edge.indexOf('s') >= 0) h = bH + dy;
          if (z.edge.indexOf('n') >= 0) { h = bH - dy; y = by + dy }
          if (w < MR_MIN_W) { if (z.edge.indexOf('w') >= 0) x -= MR_MIN_W - w; w = MR_MIN_W }
          if (h < MR_MIN_H) h = MR_MIN_H;
          const ddr = desktop().getBoundingClientRect();
          if (x < 0) { w += -x; x = 0 }
          if (x + w > desktop().clientWidth) w = desktop().clientWidth - x;
          if (y < 0) { h += -y; y = 0 }
          if (y + h > desktop().clientHeight) h = desktop().clientHeight - y;
          win.style.left = x + 'px';
          win.style.top = y + 'px';
          win.style.width = Math.max(MR_MIN_W, w) + 'px';
          win.style.height = Math.max(MR_MIN_H, h) + 'px';
          win.style.zIndex = ++winZ;
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          win.style.touchAction = '';
          saveLayout();
          emitLayout();
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      });
      win.appendChild(d);
    });
  }

  // ---------- mouse drag (свой, вместо interact.js) ----------
  // Перетаскивание окон мышью за заголовок. Всё считается в CSS-пикселях
  // (дельты clientX делятся на zoom), поэтому корректно работает при любом
  // масштабе — в отличие от interact.js, который под CSS zoom ломался.
  function wireMouseDrag(win) {
    if (isTouchDevice()) return; // на таче — wireTouchDragResize
    if (win.__md) return;
    win.__md = true;
    const head = win.querySelector('.window-head');
    if (!head) return;
    let dragMode = false, dragSX = 0, dragSY = 0, dragBX = 0, dragBY = 0;
    head.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      if (e.target.closest('button, select, input, textarea, a')) return;
      const z = getZoom();
      dragSX = e.clientX; dragSY = e.clientY;
      const r = win.getBoundingClientRect();
      const dr = desktop().getBoundingClientRect();
      dragBX = (r.left - dr.left) / z; dragBY = (r.top - dr.top) / z;
      dragMode = true;
      win.style.zIndex = ++winZ;
      try { head.setPointerCapture(e.pointerId) } catch (err) {}
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragMode) return;
      const z = getZoom();
      const ds = desktop();
      const dx = (e.clientX - dragSX) / z, dy = (e.clientY - dragSY) / z;
      let x = dragBX + dx, y = dragBY + dy;
      x = Math.max(0, Math.min(x, ds.clientWidth - win.offsetWidth));
      y = Math.max(0, Math.min(y, ds.clientHeight - win.offsetHeight));
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    });
    const stop = () => {
      if (!dragMode) return;
      dragMode = false;
      saveLayout();
      emitLayout();
    };
    head.addEventListener('pointerup', stop);
    head.addEventListener('pointercancel', stop);
  }

  // ---------- mobile layout ----------
  function applyMobileLayout() {
    const mobile = window.innerWidth <= 820;
    const changed = document.body.classList.toggle('mobile-layout', mobile);
    if (mobile) {
      // окна не максимизируем — они остаются ресайзабельными; только подгоняем
      // вылезшие за экран (сохранённую раскладку не трогаем).
      windows().forEach(win => {
        if (win.classList.contains('maximized')) return;
        const d = desktop();
        const z = getZoom();
        const r = win.getBoundingClientRect();
        const dr = d.getBoundingClientRect();
        let x = (r.left - dr.left) / z, y = (r.top - dr.top) / z;
        const w = r.width / z, h = r.height / z;
        x = Math.max(4, Math.min(x, d.clientWidth - 8));
        y = Math.max(4, Math.min(y, d.clientHeight - 8));
        win.style.left = Math.min(x, d.clientWidth - w - 4) + 'px';
        win.style.top = Math.min(y, d.clientHeight - h - 4) + 'px';
      });
    }
    if (changed && typeof renderShortcuts === 'function') renderShortcuts();
  }

  // ---------- touch drag / long-press rose ----------
  // Быстрое движение по заголовку перетаскивает окно. Долгий тап (~450мс) по
  // заголовку открывает РОЗУ РЕСАЙЗА: полупрозрачный круг 300x300 по центру
  // экрана. Крест делит её на 4 зоны (стороны окна). Тяга из любой точки зоны
  // двигает соответствующий край окна 1:1. Роза остаётся после отпускания
  // пальца — можно тянуть несколько раз. Закрытие — тап за пределами розы.
  const TOUCH_LONG_MS = 450; // задержка долгого тапа
  const TOUCH_SLOP = 8;      // порог движения до активации, px
  const ROSE_SIZE = 300;     // диаметр розы, px

  // Одна роза на всех: открытая роза и окно, которое её вызвало.
  let roseEl = null, roseWin = null, roseCloser = null;

  // край окна по точке касания внутри розы (px,py — CSS-px от центра розы)
  function roseEdge(px, py) {
    if (Math.abs(px) >= Math.abs(py)) return px >= 0 ? 'e' : 'w';
    return py >= 0 ? 's' : 'n';
  }

  function wireTouchDragResize(win) {
    if (!isTouchDevice()) return;
    const minW = win.dataset.wid === 'trade' ? 220 : 100;
    const minH = 120;
    const head = win.querySelector('.window-head');
    if (!head) return;

    let longTimer = null;
    let dragMode = false;
    let dragSX = 0, dragSY = 0, dragBX = 0, dragBY = 0;
    let grab = null; // активный жест на розе {edge, sx, sy, bx, by, bW, bH}

    const closeRose = (silent) => {
      if (!roseEl || roseWin !== win) return;
      roseEl.remove();
      win.classList.remove('resize-mode');
      document.removeEventListener('pointerdown', roseOutsideDown, true);
      document.removeEventListener('pointermove', roseMove);
      document.removeEventListener('pointerup', roseUp);
      document.removeEventListener('pointercancel', roseUp);
      roseEl = null; roseWin = null;
      if (roseCloser === closeRose) roseCloser = null;
      grab = null;
      if (!silent) { saveLayout(); emitLayout(); }
    };
    const roseOutsideDown = (e) => {
      if (roseEl && roseWin === win && !grab && !roseEl.contains(e.target)) closeRose();
    };

    const driftResize = (edge, dx, dy, bx, by, bW, bH) => {
      const ds = desktop();
      let w = bW, h = bH, x = bx, y = by;
      if (edge.indexOf('e') >= 0) w = bW + dx;
      if (edge.indexOf('w') >= 0) { w = bW - dx; x = bx + dx }
      if (edge.indexOf('s') >= 0) h = bH + dy;
      if (edge.indexOf('n') >= 0) { h = bH - dy; y = by + dy }
      if (w < minW) { if (edge.indexOf('w') >= 0) x -= minW - w; w = minW }
      if (h < minH) h = minH;
      if (x < 0) { w += -x; x = 0 }
      if (x + w > ds.clientWidth) w = ds.clientWidth - x;
      if (y < 0) { h += -y; y = 0 }
      if (y + h > ds.clientHeight) h = ds.clientHeight - y;
      win.style.left = x + 'px';
      win.style.top = y + 'px';
      win.style.width = w + 'px';
      win.style.height = h + 'px';
    };

    const openRose = () => {
      if (roseCloser) roseCloser(true); // тихо снести чужую розу
      const z = getZoom();
      const el = document.createElement('div');
      el.className = 'rose';
      el.innerHTML = '<div class="rose-cross"></div>' +
        '<div class="rose-arrow rn">▲</div><div class="rose-arrow rs">▼</div>' +
        '<div class="rose-arrow rw">◀</div><div class="rose-arrow re">▶</div>';
      el.style.left = (window.innerWidth / z / 2 - ROSE_SIZE / 2) + 'px';
      el.style.top = (window.innerHeight / z / 2 - ROSE_SIZE / 2) + 'px';
      document.body.appendChild(el);
      roseEl = el; roseWin = win; roseCloser = closeRose;
      win.style.zIndex = ++winZ;
      win.classList.add('resize-mode');
      el.addEventListener('pointerdown', roseDown);
      el.addEventListener('contextmenu', (e) => { e.preventDefault() }); // давим меню long-press на таче
      document.addEventListener('pointerdown', roseOutsideDown, true);
    };
    const roseDown = (e) => {
      if (!roseEl || roseWin !== win) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault(); // давим нативное long-press меню на таче
      const z = getZoom();
      const rr = roseEl.getBoundingClientRect();
      const px = (e.clientX - (rr.left + rr.width / 2)) / z;
      const py = (e.clientY - (rr.top + rr.height / 2)) / z;
      const r = win.getBoundingClientRect();
      const dr = desktop().getBoundingClientRect();
      grab = { edge: roseEdge(px, py), sx: e.clientX, sy: e.clientY,
        bx: (r.left - dr.left) / z, by: (r.top - dr.top) / z,
        bW: r.width / z, bH: r.height / z };
      document.addEventListener('pointermove', roseMove);
      document.addEventListener('pointerup', roseUp);
      document.addEventListener('pointercancel', roseUp);
    };
    const roseMove = (e) => {
      if (!grab || roseWin !== win) return;
      const z = getZoom();
      driftResize(grab.edge, (e.clientX - grab.sx) / z, (e.clientY - grab.sy) / z,
        grab.bx, grab.by, grab.bW, grab.bH);
    };
    const roseUp = () => {
      document.removeEventListener('pointermove', roseMove);
      document.removeEventListener('pointerup', roseUp);
      document.removeEventListener('pointercancel', roseUp);
      if (grab) { grab = null; saveLayout(); emitLayout(); }
      // роза остаётся открытой — закрытие тапом вне её
    };

    head.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, select, input, textarea, a')) return;
      dragSX = e.clientX; dragSY = e.clientY;
      const z = getZoom();
      const r = win.getBoundingClientRect();
      const dr = desktop().getBoundingClientRect();
      dragBX = (r.left - dr.left) / z; dragBY = (r.top - dr.top) / z;
      clearTimeout(longTimer);
      longTimer = setTimeout(() => {
        longTimer = null;
        openRose();
      }, TOUCH_LONG_MS);
    });

    head.addEventListener('pointermove', (e) => {
      if (!longTimer && !dragMode) return;
      const dx = (e.clientX - dragSX) / getZoom(), dy = (e.clientY - dragSY) / getZoom();
      if (longTimer) {
        if (Math.abs(dx) <= TOUCH_SLOP && Math.abs(dy) <= TOUCH_SLOP) return;
        clearTimeout(longTimer); longTimer = null;
        dragMode = true;
        try { head.setPointerCapture(e.pointerId) } catch (err) {}
      }
      if (!dragMode) return;
      const ds = desktop();
      let x = dragBX + dx, y = dragBY + dy;
      x = Math.max(4, Math.min(x, ds.clientWidth - win.offsetWidth));
      y = Math.max(4, Math.min(y, ds.clientHeight - win.offsetHeight));
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    });

    head.addEventListener('pointerup', (e) => {
      if (longTimer) { clearTimeout(longTimer); longTimer = null }
      if (dragMode) {
        dragMode = false;
        saveLayout();
        emitLayout();
      }
    });
    head.addEventListener('pointercancel', (e) => {
      if (longTimer) { clearTimeout(longTimer); longTimer = null }
      dragMode = false;
    });
    head.addEventListener('contextmenu', (e) => { e.preventDefault() }); // давим меню long-press на таче
  }

  // ---------- desktop shortcuts ----------
  // tl(key, fallback, vars) — строка из словаря каркаса 'desktop'; если ключа нет — fallback.
  function tl(key, fb, vars) {
    if (window.L) {
      const v = L.t('desktop', key, vars);
      if (v !== key) return v;
    }
    return fb;
  }
// wt(def, key, fb) — перевод имени виджета из ЕГО словаря (L.dicts[def.id].ui.title/.ui.label);
// нет словаря/ключа — fallback на русское имя из def. Удалил виджет — удалил и перевод.
  function wt(def, key, fb) {
    if (!window.L) return fb;
    const d = L.dicts[def.id] || {};
    const v = (d[L.lang] && d[L.lang][key]) != null ? d[L.lang][key] : (d.en && d.en[key]);
    return v != null ? v : fb;
  }

  const SC_STEP = 86;
  let shortcutPos = {};
  let selectedShortcuts = new Set();
  let shortcutMultiSelect = false;

  function loadShortcutPos() {
    try { shortcutPos = JSON.parse(localStorage.getItem('desktopShortcuts') || '{}') } catch { shortcutPos = {} }
    if (!shortcutPos || typeof shortcutPos !== 'object') shortcutPos = {};
  }
  function saveShortcutPos() { localStorage.setItem('desktopShortcuts', JSON.stringify(shortcutPos)) }
  function loadSelShortcuts() {
    try { selectedShortcuts = new Set(JSON.parse(localStorage.getItem('selectedShortcuts') || '[]')) } catch { selectedShortcuts = new Set() }
  }
  function saveSelShortcuts() { localStorage.setItem('selectedShortcuts', JSON.stringify([...selectedShortcuts])) }
  function shortcutEls() { return document.querySelectorAll('#shortcuts .shortcut') }
  function applySel() {
    shortcutEls().forEach(el => el.classList.toggle('selected', selectedShortcuts.has(el.dataset.shortcut)));
  }
  function selectOnly(el) { selectedShortcuts = new Set([el.dataset.shortcut]); saveSelShortcuts(); applySel() }
  function toggleSelect(el) {
    const id = el.dataset.shortcut;
    selectedShortcuts.has(id) ? selectedShortcuts.delete(id) : selectedShortcuts.add(id);
    saveSelShortcuts(); applySel();
  }

  function shortcutWidgets() {
    const list = [];
    registry.forEach(def => { if (def.shortcut !== false) list.push(def) });
    return list;
  }

  function renderShortcuts() {
    const sc = document.getElementById('shortcuts');
    if (!sc) return;
    const trashLbl = document.getElementById('trashLbl');
    if (trashLbl) trashLbl.textContent = tl('trash.label', 'Корзина');
    sc.innerHTML = '';
    loadShortcutPos();
    loadSelShortcuts();
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('deletedShortcuts') || '[]') } catch {}
    const deletedSet = new Set(deleted);
    // колонки/строки считаем по доступной площади рабочего стола, чтобы ярлыки
    // не уходили за экран (особенно на мобильном)
    const d = desktop();
    const cols = Math.max(1, Math.floor((d.clientWidth - 8) / SC_STEP));
    shortcutWidgets().forEach((s, i) => {
      if (deletedSet.has(s.id)) return;
      const el = document.createElement('div');
      el.className = 'shortcut';
      el.dataset.shortcut = s.id;
      el.innerHTML = `<span class="ico">${s.icon}</span><span class="lbl">${wt(s, 'ui.label', s.label)}</span>`;
      el.title = tl('sc.open', 'Открыть: {title} (двойной клик)', { title: s.title });
      let p = shortcutPos[s.id];
      const fits = p && Number.isFinite(p.x) && Number.isFinite(p.y)
        && p.x >= 0 && p.y >= 0
        && p.x + SC_STEP <= d.clientWidth
        && p.y + SC_STEP <= d.clientHeight;
      if (!fits) {
        p = { x: (i % cols) * SC_STEP, y: Math.floor(i / cols) * SC_STEP };
        shortcutPos[s.id] = p;
      }
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      sc.appendChild(el);
    });
    applySel();
    initShortcutDrag();
    initShortcutMarquee();
  }

  function initShortcutDrag() {
    shortcutEls().forEach(el => {
      let dragging = false, moved = false, sx = 0, sy = 0, bx = 0, by = 0;
      let lpTimer = null, lpFired = false;
      let dragGroup = null;   // набор перетаскиваемых ярлыков (включая захваченный)
      const isTouch = (e) => e.pointerType === 'touch' || e.pointerType === 'pen';
      const clearLp = () => { if (lpTimer) { clearTimeout(lpTimer); lpTimer = null } };
      el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        dragging = true; moved = false; lpFired = false;
        sx = e.clientX; sy = e.clientY;
        bx = parseFloat(el.style.left); by = parseFloat(el.style.top);
        // Если захваченный ярлык выделен — двигаем всю группу выделенных.
        dragGroup = new Map();
        if (selectedShortcuts.has(el.dataset.shortcut)) {
          shortcutEls().forEach(s => {
            if (selectedShortcuts.has(s.dataset.shortcut)) {
              dragGroup.set(s.dataset.shortcut, { x: parseFloat(s.style.left), y: parseFloat(s.style.top) });
            }
          });
        }
        if (!dragGroup.has(el.dataset.shortcut)) {
          dragGroup.set(el.dataset.shortcut, { x: bx, y: by });
        }
        try { el.setPointerCapture(e.pointerId) } catch {}
        if (isTouch(e)) {
          lpTimer = setTimeout(() => {
            lpFired = true;
            shortcutMultiSelect = true;
            toggleSelect(el);
          }, 450);
        }
      });
      el.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const z = getZoom();
        const dx = (e.clientX - sx) / z, dy = (e.clientY - sy) / z;
        const threshold = isTouch(e) ? 12 : 4;
        if (!moved && Math.hypot(dx, dy) > threshold) {
          moved = true;
          clearLp();
        }
        if (moved && dragGroup) {
          dragGroup.forEach((st, id) => {
            const s = document.querySelector(`#shortcuts .shortcut[data-shortcut="${id}"]`);
            if (!s) return;
            s.classList.add('dragging');
            s.style.left = Math.max(-40, Math.min(desktop().clientWidth - 40, st.x + dx)) + 'px';
            s.style.top = Math.max(-20, Math.min(desktop().clientHeight - 30, st.y + dy)) + 'px';
          });
          const trash = document.getElementById('trash');
          if (trash) {
            const tr = trash.getBoundingClientRect();
            let over = false;
            dragGroup.forEach((st, id) => {
              const s = document.querySelector(`#shortcuts .shortcut[data-shortcut="${id}"]`);
              if (s && s.getBoundingClientRect().right > tr.left + 8 && s.getBoundingClientRect().left < tr.right - 8
                && s.getBoundingClientRect().bottom > tr.top + 8 && s.getBoundingClientRect().top < tr.bottom - 8) over = true;
            });
            trash.classList.toggle('hover', over);
          }
        }
      });
      el.addEventListener('pointerup', (e) => {
        clearLp();
        if (!dragging) return;
        dragging = false;
        shortcutEls().forEach(s => s.classList.remove('dragging'));
        const trash = document.getElementById('trash');
        if (trash) trash.classList.remove('hover');
        try { el.releasePointerCapture(e.pointerId) } catch {}
        if (moved && dragGroup) {
          const tr = trash ? trash.getBoundingClientRect() : null;
          const toDelete = [];
          dragGroup.forEach((st, id) => {
            const s = document.querySelector(`#shortcuts .shortcut[data-shortcut="${id}"]`);
            if (!s) return;
            const r = s.getBoundingClientRect();
            if (tr && r.right > tr.left + 8 && r.left < tr.right - 8 && r.bottom > tr.top + 8 && r.top < tr.bottom - 8) {
              toDelete.push(id);
            } else {
              shortcutPos[id] = { x: Math.round(parseFloat(s.style.left)), y: Math.round(parseFloat(s.style.top)) };
            }
          });
          dragGroup = null;
          if (toDelete.length) {
            deleteShortcuts(toDelete);
            selectedShortcuts.clear();
          } else {
            saveShortcutPos();
          }
          saveSelShortcuts();
        } else if (lpFired) {
          // already toggled by long-press
        } else if (e.ctrlKey || e.metaKey || shortcutMultiSelect) {
          toggleSelect(el);
        } else {
          selectOnly(el);
        }
      });
      el.addEventListener('pointercancel', (e) => {
        clearLp(); dragging = false; lpFired = false; dragGroup = null;
        shortcutEls().forEach(s => s.classList.remove('dragging'));
        const trash = document.getElementById('trash');
        if (trash) trash.classList.remove('hover');
        try { el.releasePointerCapture(e.pointerId) } catch {}
      });
      el.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        open(el.dataset.shortcut);
      });
      el.addEventListener('contextmenu', (e) => { e.preventDefault() });
    });
  }

  function initShortcutMarquee() {
    const d = desktop();
    let band = null, startX = 0, startY = 0, dragging = false;
    d.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.shortcut') || e.target.closest('.window') || e.target.closest('.trash')) return;
      if (e.target !== d && e.target.id !== 'desktop') return;
      if (e.pointerType !== 'mouse') {
        shortcutMultiSelect = false;
        selectedShortcuts.clear();
        applySel();
        saveSelShortcuts();
        return;
      }
      if (!e.ctrlKey && !e.metaKey) { selectedShortcuts.clear(); applySel() }
      dragging = false;
      startX = e.clientX; startY = e.clientY;
      band = document.createElement('div');
      band.className = 'rb-band';
      d.appendChild(band);
      const dr = d.getBoundingClientRect();
      const place = (cx, cy) => {
        const z = getZoom();
        const x = Math.min(startX, cx), y = Math.min(startY, cy);
        band.style.left = ((x - dr.left) / z) + 'px';
        band.style.top = ((y - dr.top) / z) + 'px';
        band.style.width = (Math.abs(cx - startX) / z) + 'px';
        band.style.height = (Math.abs(cy - startY) / z) + 'px';
      };
      const move = (ev) => {
        if (!band) return;
        dragging = true;
        place(ev.clientX, ev.clientY);
        const z = getZoom();
        const bandRect = {
          left: (Math.min(startX, ev.clientX) - dr.left) / z,
          top: (Math.min(startY, ev.clientY) - dr.top) / z,
          right: (Math.max(startX, ev.clientX) - dr.left) / z,
          bottom: (Math.max(startY, ev.clientY) - dr.top) / z,
        };
        if (!ev.ctrlKey && !ev.metaKey) selectedShortcuts.clear();
        shortcutEls().forEach(el => {
          const r = el.getBoundingClientRect();
          const sl = (r.left - dr.left) / z, st = (r.top - dr.top) / z;
          const w = r.width / z, h = r.height / z;
          if (sl < bandRect.right && (sl + w) > bandRect.left && st < bandRect.bottom && (st + h) > bandRect.top) {
            selectedShortcuts.add(el.dataset.shortcut);
          }
        });
        applySel();
      };
      const up = (ev) => {
        document.removeEventListener('pointermove', move);
        document.removeEventListener('pointerup', up);
        if (band) { band.remove(); band = null }
        saveSelShortcuts();
      };
      document.addEventListener('pointermove', move);
      document.addEventListener('pointerup', up);
    });
  }

  // ---------- start menu ----------
  function renderStartMenu() {
    const menu = document.getElementById('startMenu');
    const btn = document.getElementById('startBtn');
    if (!menu || !btn) return;
    menu.innerHTML = '';
    const items = [];
    registry.forEach(def => { if (def.startMenu !== false) items.push(def) });
    items.forEach(def => {
      const el = document.createElement('div');
      el.className = 'start-menu-item';
      el.dataset.widget = def.id;
      el.innerHTML = `<span class="ico">${def.icon}</span> ${wt(def, 'ui.label', def.label)}`;
      el.addEventListener('click', () => {
        open(def.id);
        closeStartMenu();
      });
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (def.shortcut !== false) showStartCtxMenu(e, def);
      });
      menu.appendChild(el);
    });
    const sep = document.createElement('div');
    sep.className = 'start-menu-sep';
    menu.appendChild(sep);
    const reset = document.createElement('div');
    reset.className = 'start-menu-item danger';
    reset.id = 'resetLayout';
    reset.innerHTML = `<span class="ico">↺</span> ${tl('sm.reset', 'Сброс раскладки')}`;
    reset.addEventListener('click', () => {
      ['windowLayout', 'desktopShortcuts', 'selectedShortcuts', 'deletedShortcuts'].forEach(k => localStorage.removeItem(k));
      location.reload();
    });
    menu.appendChild(reset);
    const restoreShortcuts = document.createElement('div');
    restoreShortcuts.className = 'start-menu-item';
    restoreShortcuts.innerHTML = `<span class="ico">⌂</span> ${tl('sm.restore', 'Вернуть ярлыки на рабочий стол')}`;
    restoreShortcuts.addEventListener('click', () => {
      localStorage.removeItem('deletedShortcuts');
      closeStartMenu();
      renderShortcuts();
    });
    menu.appendChild(restoreShortcuts);
    const restart = document.createElement('div');
    restart.className = 'start-menu-item danger';
    restart.innerHTML = `<span class="ico">↻</span> ${tl('sm.restart', 'Завершить сессию')}`;
    restart.addEventListener('click', () => {
      if (confirm(tl('sm.restart_confirm', 'Закрыть текущую сессию?'))) {
        if (typeof WSsend === 'function') WSsend('RebootESP');
      }
    });
    menu.appendChild(restart);
  }

  function closeStartMenu() {
    const menu = document.getElementById('startMenu');
    const btn = document.getElementById('startBtn');
    if (menu) menu.classList.remove('open');
    if (btn) btn.classList.remove('open');
  }

  // ---------- context menu of the Start menu items ----------
  let activeStartCtxMenu = null;
  function closeStartCtxMenu() {
    if (activeStartCtxMenu) { activeStartCtxMenu.remove(); activeStartCtxMenu = null }
  }
  function showStartCtxMenu(e, def) {
    closeStartCtxMenu();
    const m = document.createElement('div');
    m.className = 'ctx-menu';
    m.innerHTML = `<div class="ctx-menu-item"><span class="ico">🗀</span> ${tl('tm.place', 'Поместить на рабочий стол')}</div>`;
    m.querySelector('.ctx-menu-item').addEventListener('click', () => {
      restoreShortcut(def.id);
      closeStartCtxMenu();
      closeStartMenu();
    });
    document.body.appendChild(m);
    const z = getZoom();
    const r = m.getBoundingClientRect();
    m.style.left = Math.min(e.clientX / z, window.innerWidth / z - r.width / z - 8) + 'px';
    m.style.top = Math.min(e.clientY / z, window.innerHeight / z - r.height / z - 8) + 'px';
    activeStartCtxMenu = m;
  }

  function bindStartMenu() {
    const menu = document.getElementById('startMenu');
    const btn = document.getElementById('startBtn');
    if (!menu || !btn) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStartCtxMenu();
      menu.classList.toggle('open');
      btn.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (activeStartCtxMenu && !activeStartCtxMenu.contains(e.target)) closeStartCtxMenu();
      if (!menu.contains(e.target) && e.target !== btn) closeStartMenu();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeStartCtxMenu(); closeStartMenu() }
    });
  }

  // ---------- delete selected shortcuts ----------
  function deleteShortcuts(ids) {
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('deletedShortcuts') || '[]') } catch {}
    const deletedSet = new Set(deleted);
    ids.forEach(id => {
      delete shortcutPos[id];
      deletedSet.add(id);
      const el = document.querySelector(`#shortcuts .shortcut[data-shortcut="${id}"]`);
      if (el) el.remove();
      selectedShortcuts.delete(id);
    });
    localStorage.setItem('deletedShortcuts', JSON.stringify([...deletedSet]));
    saveShortcutPos();
  }
  function restoreShortcut(id) {
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('deletedShortcuts') || '[]') } catch {}
    const deletedSet = new Set(deleted);
    deletedSet.delete(id);
    localStorage.setItem('deletedShortcuts', JSON.stringify([...deletedSet]));
    renderShortcuts();
  }

  function bindDeleteShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Delete' && selectedShortcuts.size) {
        deleteShortcuts([...selectedShortcuts]);
        selectedShortcuts.clear();
        saveSelShortcuts();
      }
    });
  }

  // ---------- taskbar (window buttons + clock + tray) ----------
  let activeWinMenu = null;
  let activeWinBtn = null;

  function closeWinMenu() {
    if (activeWinMenu) { activeWinMenu.remove(); activeWinMenu = null }
    if (activeWinBtn) { activeWinBtn.classList.remove('open'); activeWinBtn = null }
  }

  function activateWin(win) {
    if (win.classList.contains('minimized')) {
      setMinimized(win, false);
      focus(win);
    } else if (win === topWinOf()) {
      setMinimized(win, true);
    } else {
      focus(win);
    }
    saveLayout();
    emitLayout();
  }

  function topWinOf() {
    let topWin = null, topZ = -1;
    windows().forEach(win => {
      if (win.classList.contains('minimized')) return;
      const z = parseInt(win.style.zIndex) || 0;
      if (z > topZ) { topZ = z; topWin = win }
    });
    return topWin;
  }

  function makeWinBtn(win, def, topWin) {
    const btn = document.createElement('button');
    btn.className = 'tb-btn';
    btn.dataset.uid = win.dataset.uid;
    if (win === topWin) btn.classList.add('active');
    if (win.classList.contains('minimized')) btn.classList.add('min');
    btn.innerHTML = `<span class="ico">${def.icon || ''}</span><span class="lbl">${wt(def, 'ui.title', def.title || def.label || win.dataset.wid)}</span>`;
    btn.title = btn.textContent;
    btn.addEventListener('click', () => activateWin(win));
    return btn;
  }

  function renderTaskbar() {
    const host = document.getElementById('tbWindows');
    if (!host) return;
    closeWinMenu();
    host.querySelectorAll('.tb-btn, .tb-win-group').forEach(b => b.remove());
    const topWin = topWinOf();
    const entries = [];
    windows().forEach(win => {
      const def = registry.get(win.dataset.wid);
      if (!def) return;
      entries.push({ win, def });
    });
    if (entries.length === 0) return;

    // сначала рендерим отдельные кнопки и проверяем, помещаются ли
    const buttons = entries.map(({ win, def }) => makeWinBtn(win, def, topWin));
    buttons.forEach(b => host.appendChild(b));
    const overflows = host.scrollWidth > host.clientWidth + 1;
    if (!overflows) return;

    // не помещаются — сворачиваем в одну групповую кнопку с выпадашкой
    buttons.forEach(b => b.remove());
    const group = document.createElement('div');
    group.className = 'tb-win-group';
    const gBtn = document.createElement('button');
    gBtn.className = 'tb-btn group';
    gBtn.innerHTML = `<span class="ico">🗗</span><span class="lbl">${tl('sm.windows', 'Окна')}</span>`;
    gBtn.title = tl('sm.windows', 'Окна');
    const menu = document.createElement('div');
    menu.className = 'tb-win-menu';
    entries.forEach(({ win, def }) => {
      const item = makeWinBtn(win, def, topWin);
      item.classList.add('wide');
      menu.appendChild(item);
    });
    const openMenu = () => {
      if (activeWinMenu === menu) return;
      closeWinMenu();
      document.body.appendChild(menu);
      menu.classList.add('open');
      gBtn.classList.add('open');
      activeWinMenu = menu;
      activeWinBtn = gBtn;
      const z = getZoom();
      const r = gBtn.getBoundingClientRect();
      menu.style.left = Math.max(4, Math.min(r.left / z, window.innerWidth / z - menu.offsetWidth - 4)) + 'px';
      menu.style.top = (r.top / z - menu.offsetHeight - 4) + 'px';
    };
    const toggle = (e) => {
      e.stopPropagation();
      if (activeWinMenu === menu) closeWinMenu();
      else openMenu();
    };
    gBtn.addEventListener('click', toggle);
    group.appendChild(gBtn);
    host.appendChild(group);
  }

  // applyLang() — перерисовка каркаса интерфейса при смене языка.
  function applyLang() {
    windows().forEach(win => {
      const def = registry.get(win.dataset.wid);
      if (!def) return;
      const wtitle = win.querySelector('.wtitle');
      if (wtitle && !wtitle.hasAttribute('data-i18n')) {
        wtitle.textContent = wt(def, 'ui.title', def.title || def.label || def.id);
      }
    });
    renderShortcuts();
    renderStartMenu();
    renderTaskbar();
  }

  function startTaskbarClock() {
    const clock = document.getElementById('tbClock');
    const date = document.getElementById('tbDate');
    if (!clock) return;
    const tick = () => {
      const now = new Date();
      clock.textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (date) date.textContent = now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    tick();
    setInterval(tick, 10000);
  }

  function initFullscreen() {
    const btn = document.getElementById('fsBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    });
    const sync = () => {
      const fs = !!document.fullscreenElement;
      btn.classList.toggle('active', fs);
      btn.title = fs ? 'Выйти из полноэкранного' : 'Во весь экран';
    };
    document.addEventListener('fullscreenchange', sync);
  }

  // ---------- init ----------
  function init() {
    applyMobileLayout();
    window.addEventListener('resize', () => { applyMobileLayout(); renderTaskbar(); });
    document.addEventListener('pointerdown', (e) => {
      if (activeWinMenu && !activeWinMenu.contains(e.target) && e.target !== activeWinBtn) closeWinMenu();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeWinMenu() });
    restore();
    renderStartMenu();
    bindStartMenu();
    renderShortcuts();
    bindDeleteShortcuts();
    renderTaskbar();
    startTaskbarClock();
    initFullscreen();
  }

  return {
    register,
    getDef,
    open,
    close,
    focus,
    on,
    saveLayout,
    restore,
    init,
    applyLang,
    desktop,
    isMobile,
    windows,
    windowsOf,
    countOf,
    emitLayout,
  };
})();
