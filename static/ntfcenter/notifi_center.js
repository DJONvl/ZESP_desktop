/**
 * NotificationCenter — notification panel for ZESP desktop
 * Include AFTER socket.js and KWS.js
 *
 * What it does:
 *  - NC.add(title, text, type) — adds a notification to the panel
 *  - Auto-removal after 12 hours
 *  - Stored in localStorage (survives reload)
 *  - Shows an unread-count badge on the bell button
 *  - Checks for a new firmware version via WSsend('cmdUpdatefw|false')
 *    The reply arrives via notify in socket.js → NC.add(...)
 */

(function () {
    'use strict';

    // ───────────────────────── constants ─────────────────────────
    const STORAGE_KEY   = 'zesp_notifications';
    const MAX_AGE_MS    = 12 * 60 * 60 * 1000;   // 12 hours
    const CHECK_VER_INT = 60 * 60 * 1000;          // check version once an hour

    // ───────────────────────── storage ─────────────────────────
    function loadNotifications() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    function saveNotifications(list) {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch {}
    }

    function pruneOld(list) {
        const cutoff = Date.now() - MAX_AGE_MS;
        return list.filter(n => n.ts > cutoff);
    }

    // ───────────────────────── adding ────────────────────────
    const DEDUP_AGE_MS = 60 * 60 * 1000; // duplicate if the same message < 1 hour ago

    function addNotification(title, text, type) {
        let list = pruneOld(loadNotifications());

        const normTitle   = (title || '').trim();
        const normText    = (text  || '').trim();
        const dedupCutoff = Date.now() - DEDUP_AGE_MS;

        // Look for a duplicate: same title+text, not older than DEDUP_AGE_MS
        const dupIdx = list.findIndex(n =>
            n.title.trim() === normTitle &&
            n.text.trim()  === normText  &&
            n.ts > dedupCutoff
        );

        if (dupIdx !== -1) {
            // Move to top, refresh time, mark as unread
            const existing = { ...list[dupIdx], ts: Date.now(), read: false };
            list.splice(dupIdx, 1);
            list.unshift(existing);
            saveNotifications(list);
            renderPanel();
            updateBadge();
            return;
        }

        const entry = {
            id:    Date.now() + '_' + Math.random().toString(36).slice(2),
            ts:    Date.now(),
            title: normTitle,
            text:  normText,
            type:  type || 'info',
            read:  false
        };
        list.unshift(entry);
        saveNotifications(list);
        renderPanel();
        updateBadge();
    }

    // ───────────────────────── removal ──────────────────────────
    function removeNotification(id) {
        let list = loadNotifications().filter(n => n.id !== id);
        saveNotifications(list);
        renderPanel();
        updateBadge();
    }

    function clearAll() {
        saveNotifications([]);
        renderPanel();
        updateBadge();
    }

    function markAllRead() {
        let list = loadNotifications().map(n => ({ ...n, read: true }));
        saveNotifications(list);
        updateBadge();
    }

    // ───────────────────────── badge ─────────────────────────────
    function updateBadge() {
        const list   = pruneOld(loadNotifications());
        const unread = list.filter(n => !n.read).length;
        const badge  = document.getElementById('notifi_badge');
        if (!badge) return;
        badge.textContent = unread > 0 ? (unread > 99 ? '99+' : unread) : '';
        badge.style.display = unread > 0 ? 'flex' : 'none';
    }

    // ───────────────────────── panel rendering ─────────────────────
    function formatTime(ts) {
        const d = new Date(ts);
        const pad = n => String(n).padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth()+1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    const typeIcon = { info:'ℹ️', success:'✅', error:'❌', warning:'⚠️', update:'🆕' };
    const typeColor= { info:'#0078d7', success:'#2e7d32', error:'#c62828', warning:'#f57f17', update:'#6a1b9a' };

    function renderPanel() {
        const container = document.getElementById('nc_list');
        if (!container) return;

        let list = pruneOld(loadNotifications());
        saveNotifications(list);   // clean up old ones along the way

        if (list.length === 0) {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--faint);font-size:13px;">Нет уведомлений</div>';
            return;
        }

        container.innerHTML = list.map(n => {
            const icon  = typeIcon[n.type]  || 'ℹ️';
            const color = typeColor[n.type] || 'var(--muted)';
            return `
            <div class="nc_item ${n.read ? '' : 'nc_unread'}"
                 style="border-left:3px solid ${color}">
                <div class="nc_item_head">
                    <span class="nc_icon">${icon}</span>
                    <span class="nc_title" style="color:${color}">${escHtml(n.title)}</span>
                    <span class="nc_time">${formatTime(n.ts)}</span>
                    <span class="nc_del" onclick="NC.remove('${n.id}')" title="Удалить">✕</span>
                </div>
                <div class="nc_body">${escHtml(n.text)}</div>
            </div>`;
        }).join('');
    }

    function escHtml(s) {
        return String(s)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;');
    }

    // ───────────────────────── panel DOM creation ────────────────
    function buildPanel() {
        let panel = document.getElementById('notifi_cntr');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'notifi_cntr';
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <div class="nc_header">
                <span style="font-weight:bold;font-size:15px;">🔔 Уведомления</span>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span class="nc_btn_small" onclick="NC.clearAll()" title="Очистить все">🗑 Очистить</span>
                    <span class="nc_btn_small" onclick="toggl_notifi()" title="Закрыть">✕</span>
                </div>
            </div>
            <div id="nc_list" class="nc_list"></div>
            <div class="nc_footer">
                Уведомления хранятся 12 часов
            </div>`;

        renderPanel();
    }

    // ───────────────────────── version check via WS ──────────
    // Send the command to ZESP — it checks the version itself and sends notify|...
    // The notify handler in socket.js will call NC.add() with the result
    function checkNewVersion() {
        if (typeof WSsend === 'function') {
            WSsend('cmdUpdatefw|false');
        } else {
            console.warn('NC: WSsend не доступен, пропускаем проверку версии');
        }
    }

    // ───────────────────────── Toast ─────────────────────────────
    // The real class (port from KWS.js). Define only if it does not exist yet
    // (in the old version Toast includes KWS.js — don't interfere there).
    if (typeof window.Toast === 'undefined') {
        class Toast {
            constructor(t) {
                this._title  = t.title !== false && (t.title || 'Title');
                this._text   = t.text || 'Message...';
                this._theme  = t.theme || 'default';
                this._autohide = !!t.autohide;
                this._interval = +t.interval || 5000;
                this._create();
                this._el.addEventListener('click', e => {
                    if (e.target.classList.contains('toast__close')) this._hide();
                });
                this._show();
            }
            _show() {
                this._el.classList.add('toast_showing', 'toast_show');
                setTimeout(() => this._el.classList.remove('toast_showing'));
                if (this._autohide) setTimeout(() => this._hide(), this._interval);
            }
            _hide() {
                const el = this._el;
                el.classList.add('toast_showing');
                el.style.overflow = 'hidden';
                el.style.height = el.offsetHeight + 'px';
                el.style.marginBottom = '0';
                // collapse the element, freeing space in the container, then remove
                requestAnimationFrame(() => {
                    el.style.height = '0';
                    el.style.borderWidth = '0';
                    el.style.boxShadow = 'none';
                });
                el.addEventListener('transitionend', () => {
                    el.classList.remove('toast_showing', 'toast_show');
                    el.remove();
                }, { once: true });
                document.dispatchEvent(new CustomEvent('hide.toast', { detail: { target: el } }));
            }
            _create() {
                const t = document.createElement('div');
                t.className = 'toast toast_' + this._theme;
                t.innerHTML = '<div class="toast__header"></div><div class="toast__body"></div><button class="toast__close" type="button"></button>';
                if (this._title) {
                    t.querySelector('.toast__header').textContent = this._title;
                } else {
                    t.classList.add('toast_message');
                }
                t.querySelector('.toast__body').textContent = this._text;
                this._el = t;
                let container = document.querySelector('.toast-container');
                if (!container) {
                    container = document.createElement('div');
                    container.className = 'toast-container';
                    document.body.append(container);
                }
                container.append(this._el);
            }
        }
        window.Toast = Toast;
    }

    // ───────────────────────── public API ─────────────────────
    window.NC = {
        add:           addNotification,
        remove:        removeNotification,
        clearAll:      clearAll,
        render:        renderPanel,
        badge:         updateBadge,
        checkVersion:  checkNewVersion   // can be called manually from the console
    };

    // ───────────────────────── initialization ─────────────────────
    function init() {
        buildPanel();

        // Auto-removal: clean once a minute
        setInterval(() => {
            const list = pruneOld(loadNotifications());
            saveNotifications(list);
            renderPanel();
            updateBadge();
        }, 60 * 1000);

        // Version check: 5 sec after start, then every hour
        setTimeout(() => {
            checkNewVersion();
            setInterval(checkNewVersion, CHECK_VER_INT);
        }, 5000);

        // Opening the panel — mark everything as read
        const btnOpen = document.getElementById('notifi_btn');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                markAllRead();
                updateBadge();
            });
        }

        // Close on click outside the panel (the cross stays).
        // Ignore clicks on the bell button — otherwise opening would close right away.
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notifi_cntr');
            if (!panel || !panel.classList.contains('nc_open')) return;
            const t = e.target;
            if (t && t.closest && (t.closest('#notifi_cntr') || t.closest('#notifi_btn'))) return;
            panel.classList.remove('nc_open');
        }, true);

        updateBadge();
    }

    // ───────────────────────── startup ────────────────────────────
    function tryInit() {
        if (!document.body) {
            console.warn('NC: body ещё не готов, повторяем через 100ms...');
            setTimeout(tryInit, 100);
            return;
        }
        console.log('NC: init, readyState =', document.readyState);
        init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();