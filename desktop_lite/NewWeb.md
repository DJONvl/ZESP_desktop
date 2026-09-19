# NewWeb — веб-морда ZESP (desktop_lite)

> Это актуальное описание новой (lite) веб-морды. Движок окон — `desktop/desktop_lite/js/window-engine.js`,
> фасад **`window.WinEngine`** (IIFE). Виджеты лежат в `desktop/desktop_lite/apps/<имя>/<имя>.js`
> и только **регистрируются** в движке. Движок ничего не знает о конкретных виджетах.
>
> Старая справка `desktop/desktop_lite/wingui.md` описывает версию `public/` (с `core.js`,
> `lightweight-charts`, иным порядком скриптов) — **не используйте её для desktop_lite**.

---

## 1. Как это работает

### 1.1 Загрузка (`desktop/lite.html`)

Порядок подключения скриптов (важен!):

```
KWS:    EventEmitter.min.js, socket.js, cl.js, widgets.js, ace.js, blockly/...
        custom_blockly.js, ntfcenter/notifi_center.js
globals:desktop_lite/js/zesp-globals.js        ← L (переводы), глобальные хелперы
lib:    desktop_lite/interact.min.js           ← drag/resize (только десктоп)
engine: desktop_lite/js/window-engine.js       ← WinEngine (сам движок)
widgets:desktop_lite/apps/<name>/<name>.js ... ← каждый регистрирует окно(а)
init:   WinEngine.init();                      ← в самом конце lite.html
```

Правило: **сначала `window-engine.js`, затем все файлы виджетов, в конце `WinEngine.init()`**.
Виджеты должны быть зарегистрированы до `init()`, иначе их не будет в старт-меню/на рабочем столе.

### 1.2 Жизненный цикл `WinEngine.init()`

`applyMobileLayout()` → `restore()` (раскладка из `localStorage`) → `renderStartMenu()` →
`renderShortcuts()` → `renderTaskbar()` → часы таскбара.

- На десктопе drag/resize окон — `interact.js`.
- На тач-устройствах (`body.mobile-layout`) interact отключён, движок использует собственный
  механизм: тащить за шапку, долгий тап (~450 мс) по шапке → режим ресайза с 8 ручками.
- Событие `'layout'` рассылается после любого изменения геометрии (ресайз/драг/открытие/закрытие/фокус).

### 1.3 Что умеет движок сам

- Создание / закрытие / фокус окон (`open`/`close`/`focus`).
- Drag/resize, максимизация/сворачивание (кнопки `.wbtn[data-waction]`).
- Авто-складывание невлезающих кнопок тулбары в меню «▾» (`.c-tools`/`.chart-tools`/`.ops-tools`).
- Хранение и восстановление раскладки (`windowLayout`), ярлыки рабочего стола, старт-меню, таскбар.
- Перевод заголовка окна и ярлыков; мобильная адаптация.

### 1.4 Хранилище (localStorage)

| Ключ | Назначение |
|------|------------|
| `windowLayout` | массив `{uid, wid, x, y, w, h, minimized}` открытых окон |
| `desktopShortcuts` | координаты ярлыков (`{id:{x,y}}`) |
| `selectedShortcuts` | выделенные ярлыки |
| `deletedShortcuts` | скрытые с рабочего стола ярлыки |
| `L_*` / `user` / прочее | переводы, настройки виджетов (см. ниже) |

«Сброс раскладки» в Пуск чистит `windowLayout`, `desktopShortcuts`, `selectedShortcuts`, `deletedShortcuts`
и делает `reload()`.

---

## 2. Как открыть/закрыть окно

```js
WinEngine.open('settings');                 // открыть (single) или сфокусировать
WinEngine.open('settings', { force: true }); // второй экземпляр (даже если single)
WinEngine.open('settings', { pos:{x,y,w,h,minimized} }); // точные координаты (restore)
WinEngine.open('settings', { anchor: el });  // рядом с элементом (кнопкой)
WinEngine.close(node);                       // закрыть узел .window (вызовет def.destroy)
WinEngine.focus(node);
```

`open()` сам: проверяет `single`, строит DOM из `template`, проставляет `data-wid`/`data-uid`,
позиционирует, вызывает `setup`, для `single` — `activate`, сохраняет раскладку и шлёт `layout`.

Автоматически окно можно открыть ярлыком (двойной клик) и из старт-меню (один клик) — если флаги
`shortcut`/`startMenu` не запрещают.

---

## 3. Создание виджета — правила

### 3.1 Файл виджета

Расположение: `desktop/desktop_lite/apps/<name>/<name>.js`.
Подключить в `desktop/lite.html` **перед** `WinEngine.init()` (после `window-engine.js`).

Шаблон файла:

```js
(function () {
  // 1) стили виджета — инлайн в <style> внутри template (см. §3.3)
  const CSS = `...`;

  // 2) вспомогательные функции внутри IIFE (не глобально)

  // 3) регистрация
  window.WinEngine.register({
    id: 'myapp',          // тип окна (уникален), пишется в data-wid
    title: 'Моё окно',    // заголовок окна + кнопка таскбара
    label: 'Моё окно',    // ярлык рабочего стола + пункт старт-меню
    icon: '⚙️',           // иконка (эмодзи) — для ярлыка/старт-меню/таскбара
    single: true,         // true — только один экземпляр (рекомендуется для форм/настроек)
    // shortcut: false,   // спрятать ярлык с рабочего стола
    // startMenu: false,  // спрятать из старт-меню
    template: TEMPLATE,   // HTML-строка (см. §3.3)
    setup(node, opts)  { /* init нового окна */ },
    activate(node, opts){ /* повторный open для single / передача параметра */ },
    destroy(node)      { /* очистка: таймеры, подписки, node._state=null */ },
    onFocus(node)      { /* подъём окна наверх */ },
  });
})();
```

### 3.2 Поля `def`

| Поле | Обяз. | Описание |
|------|-------|----------|
| `id` | да | тип окна; должен совпадать с именем папки/файла |
| `title` | да | заголовок окна + таскбар |
| `label` | да | ярлык + старт-меню |
| `icon` | да | эмодзи (⚠️ на устройствах без эмодзи-шрифта лучше PNG `/static/icons/...`) |
| `template` | да | HTML шаблона (корень `.window.hidden` + `data-*`) |
| `single` | нет | только один экземпляр (по умолч. false) |
| `shortcut:false` | нет | скрыть ярлык |
| `startMenu:false` | нет | скрыть из старт-меню |
| `setup(node,opts)` | нет | init нового окна (после вставки в DOM) |
| `activate(node,opts)` | нет | повторный open / передача параметров |
| `destroy(node)` | нет | очистка при закрытии |
| `onFocus(node)` | нет | реакция на фокус |

### 3.3 Шаблон окна (`template`)

```html
<div class="window hidden" data-x="40" data-y="20" data-w="680" data-h="480">
  <style>/* CSS виджета: .win-myapp{...} */</style>
  <div class="window-head">
    <span class="wtitle title" data-i18n="ui.title">Моё окно</span>
    <div class="c-tools">
      <button class="cbtn" data-action="save" data-i18n="ui.save">Сохранить</button>
    </div>
    <div class="wbtns">
      <button class="wbtn min"  data-waction="min">–</button>
      <button class="wbtn max"  data-waction="max">▢</button>
      <button class="wbtn"      data-waction="close">✕</button>
    </div>
  </div>
  <div class="window-body">
    <div class="win-myapp"> ...содержимое... </div>
  </div>
</div>
```

Правила:

- **Корень**: `.window.hidden` + `data-x data-y data-w data-h` (стартовая геометрия;
  по умолчанию 400×300 в центре). Движок сам снимает `hidden`, проставляет `data-wid`/`data-uid`.
- **Заголовок**: `.wtitle` с `data-i18n="ui.title"` — движок НЕ перезапишет его (он трогает
  `.wtitle` только если нет `data-i18n`). Перевод подхватится автоматически (см. §3.6).
- **Живая область** — `.window-body` (главный скроллер).
- **Кнопки окна**: `.wbtn[data-waction]` со значениями `min` / `max` / `close` — логика
  навешивается движком. `close` вызывает `def.destroy`.
- **Кнопки тулбары/действий виджета**: `data-action="..."` — обрабатывайте сами в `setup`
  через `node.addEventListener('click', e => ... e.target.closest('[data-action]'))`.
- **Внутри виджета НЕ используйте** `document.getElementById` — только `node.querySelector(...)`.
  При 2+ окнах одного типа глобальные `id` конфликтуют (см. §3.7).

### 3.4 Состояние экземпляра: `node._state`

Храните всё состояние окна в `node._state` (создаётся в `setup`). Это убирает глобальные
переменные и предотвращает конфликты между несколькими окнами одного типа.

```js
setup(node) {
  node._state = { poll: null, onData: null };
  node._state.onData = (d) => render(node, d);
  if (window.eventE) window.eventE.on('myevent', node._state.onData);
  node.addEventListener('click', (e) => {
    const b = e.target.closest('[data-action]');
    if (b) return doAction(node, b.dataset.action);
  });
},
destroy(node) {
  const st = node._state;
  if (st && st.poll) clearInterval(st.poll);
  if (window.eventE && st && st.onData) window.eventE.off('myevent', st.onData);
  node._state = null;   // обязательно — иначе висячие ссылки/утечки
}
```

Любые глобальные подписки (`eventE.on`, `WSsend` слушатели, `setInterval`) — **снимайте в `destroy`**.

### 3.5 Связь с бэкендом

Глобально доступны (из `socket.js` / `zesp-globals.js`):

- `window.WSsend(str)` — отправить WebSocket-команду бэкенду (см. `internal/web/commands.go`).
- `window.eventE` — `EventEmitter`; бэкенд шлёт события (`jsconfig`, `devices`, `zigbee`, ...),
  на которые подписываются виджеты: `eventE.on('devices', fn)` / `eventE.off(...)`.
- `window.websocket` — raw WS (проверяйте `readyState === 1` перед `WSsend`).
- `window.L` — движок переводов (см. §3.6).

```js
if (typeof window.WSsend === 'function' && window.websocket?.readyState === 1)
  window.WSsend('loadConfig');
if (window.eventE) window.eventE.on('jsconfig', node._state.onCfg);
```

### 3.6 Интернационализация (i18n)

Переводы виджета живут в `desktop/desktop_lite/apps/<name>/{ru,en}.lp` — JSON-словарь
вида `{ "ui.title": "Настройки", "ui.save": "Сохранить" }`.

- Разметка: помечайте узлы `data-i18n="ключ"` — `L.applyLang(node, '<name>')` подставит
  текст из словаря текущего языка.
- Заголовок окна `.wtitle` с `data-i18n="ui.title"` переведётся движком автоматически при `open`.
- Программный перевод в JS: `L.t('<name>', 'ui.save')` возвращает строку;
  `L.ready('<name>').then(() => L.applyLang(node, '<name>'))` — дождаться загрузки словаря.
- Смена языка: `L.lang = 'en'` + `L.applyLang(document)` + `WinEngine.applyLang()`.
- Словарь «оболочки» (старт-меню, корзина, таскбар) — `desktop/desktop_lite/apps/desktop/{ru,en}.lp`
  с префиксами `sm.*`, `sc.*`, `tm.*`, `trash.*`, `tb.*`.

### 3.7 Несколько окон одного типа

Чтобы 2+ окна одного `id` жили без конфликтов:

1. Уникальный инстанс = `data-wid` (тип) + `data-uid` (экземпляр).
2. Вся логика — из корня `node`: `node.querySelector(...)`, `node.addEventListener(...)`,
   НЕ `document.getElementById(...)`.
3. Нужен `id` внутри шаблона — делайте уникальным (суффикс `node.dataset.uid`) или всегда
   отталкивайтесь от `node`.
4. Глобальные подписки снимайте в `destroy`.

При `single:true` движок гарантирует один экземпляр, но правила выше всё равно соблюдайте.

---

## 4. Тулбары в шапке (auto-collapse)

Контейнер панели `.c-tools` / `.chart-tools` / `.ops-tools` **автоматически** включается в
механизм складывания:

- Элементы, не помещающиеся по ширине при ресайзе, уходят в меню «▾» (`.tb-more`).
- В меню — **клоны** скрытых элементов; клики/изменения `<select>` делегируются оригиналу
  (оригинал остаётся в DOM, чтобы селекторы виджета продолжали работать).
- Разделители `.tb-sep` переносятся группой.
- Пересчёт — на `ResizeObserver` окна (debounce).

```html
<div class="c-tools">
  <button class="cbtn" data-action="save">Сохранить</button>
  <select class="tiny-select" data-cfg="APP.Lang">...</select>
  <span class="tb-sep">|</span>
</div>
```

---

## 5. Мобильная адаптация

- Порог: `window.innerWidth <= 820` → `body.mobile-layout`.
- `applyMobileLayout()` вызывается при `resize` и `init`.
- В `mobile-layout`: `#desktop{overflow:hidden}`, окна не максимизируются — только подгоняются
  в экран; drag/resize — собственный (долгий тап по шапке → ручки ресайза).
- `WinEngine.isMobile()` доступен виджетам.
- Свои правила — в `@media (max-width:820px)` / `@media (max-width:480px)` внутри `<style>` шаблона.

---

## 6. Чек-лист добавления нового виджета

1. Создать папку `desktop/desktop_lite/apps/<name>/`.
2. Создать `<name>.js` — `template` (§3.3) + `WinEngine.register` (§3.1).
3. (опц.) Создать `ru.lp` / `en.lp` с ключами `ui.title`, `ui.*`.
4. Подключить `<script src="/desktop_lite/apps/<name>/<name>.js"></script>` в `desktop/lite.html`
   **после** `window-engine.js` и **до** `WinEngine.init();`.
5. В `setup` — инициализация через `node`, подписки на `eventE`/`WSsend`.
6. В `destroy` — снять все подписки, `clearInterval`, `node._state = null`.
7. Если виджет реагирует на ресайз — `WinEngine.on('layout', onLayout)`.
8. Открыть: ярлык (двойной клик) / старт-меню / программно `WinEngine.open('<name>')`.

Если старые окна «не видят» новую раскладку — «Сброс раскладки» в Пуск или
`localStorage.removeItem('windowLayout')`.

---

## 7. Заметки

- `interact.js` — только для десктопа (drag/resize). На тач — собственный механизм движка.
- `.window` — `touch-action:manipulation`; движок временно ставит `touch-action:none` у краёв/шапки
  на время жеста, чтобы не сорвался ресайз.
- Минимальный размер окна: `trade` 220×120 (max ширина 340), остальные 200×120.
- Все глобальные хелперы (`WSsend`, `eventE`, `L`, `websocket`) могут быть ещё не готовы в момент
  регистрации — поэтому подписки/вызовы делайте в `setup` (он вызывается при `open`, позже init).
- При сомнениях — читайте исходник `window-engine.js` и комментарии в коде движка.
