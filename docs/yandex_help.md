# Справочник Яндекс Умного дома для шаблонов ZESP

Источник: официальная документация платформы Яндекс Умного дома
(<https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/device-types> и
смежные разделы), сверено 28.09.2026.

Назначение: справочник для ИИ-агента (и человека), который пишет
`ya_rep` — описание устройства для Яндекса — в шаблонах устройств ZESP.

Код, который читает это описание:
`internal/yandex/hubws.go` (`buildDeviceList`, `zesp2ya`, `stateDevice`,
`findReportKey`, `capToCmd`),
`internal/yandex/helpers.go` (`addSensorProp`, `addLightCap`,
`addSwitchCap`, `yandexSensorType`, `hasMultiId`, `isEmptyYaDevice`,
`allYaRepNone`, `clampToRange`, `isOn`).

Дополнительно в проекте есть `desktop/docs/yandex-device-types.md` —
он описывает привязку к ZESP-конкретике (роли, `multi_id`, кластеры).
Этот файл — протокол Яндекса целиком.

---

## 0. Быстрый чек-лист перед сохранением `ya_rep`

1. `type` начинается с `devices.types.` и взят из раздела 2.
2. `capabilities` + `properties` суммарно не пусты.
3. У каждого `range` заполнены `min`, `max`, `precision`.
4. У каждого `mode` непустой `modes[]`, `state.value` входит в этот список.
5. У каждого `event` непустой `events[]`, `state.value` входит в этот список.
6. У каждого `float` указаны **оба** поля `instance` и `unit`
   (таблица 10 и список единиц в 10).
7. `temperature_k` внутри диапазона 2000–9000 (рекомендуемое подмножество
   2700–6500).
8. `state.value` для `brightness` в диапазоне 1–100 (не 0 и не 255).
9. `multi_id.type` — полное имя вида `devices.types.switch`, не `switch`.
10. Если канал не должен попадать в Яндекс — `"ya_rep": "none"`.

Нарушение любого пункта 2–8 обычно означает, что Яндекс отвергнет
**всё обнаружение целиком**, а не одно устройство.

---

## 1. Структура объекта устройства

`DeviceObject` — ответ на «Информацию об устройствах пользователя».

| Поле | Тип | Обяз. | Описание |
|------|-----|-------|----------|
| `id` | String | да | Идентификатор устройства. В ZESP это `IEEE` (а для канала — `IEEE^ключ_отчёта`) |
| `name` | String | да | Имя устройства |
| `aliases` | [String] | да | Дополнительные имена |
| `room` | String | да | Комната; `null` — не привязано. В ZESP берётся из `Location` |
| `external_id` | String | да | Идентификатор в облаке производителя |
| `skill_id` | String | да | Идентификатор навыка производителя |
| `type` | String | да | Тип устройства `devices.types.{type}` |
| `groups` | [String] | да | Группы устройства |
| `capabilities` | [CapabilityObject] | да | Умения (управляемые функции) |
| `properties` | [PropertyObject] | да | Свойства (только чтение) |
| `household_id` | String | да | Дом |

В ZESP `type` устройства задаётся полем `type` верхнего уровня в
шаблоне (например `"type": "devices.types.switch"`), а `name` — полем
`Name`, `room` — полем `Location`.

### CapabilityObject (умение)

Описание при обнаружении:

```json
{
  "type": "devices.capabilities.{capability}",
  "retrievable": true,
  "reportable": true,
  "parameters": { }
}
```

- `retrievable` — можно ли запросить состояние. `false` = управление
  вслепую (кнопка без фиксированного состояния).
- `reportable` — будете ли слать callback при изменении состояния.
  Управляемые значения обычно `false` (состояние меняет сам провайдер),
  показания датчиков — `true`.

Состояние (в `query`, в `callback` и в `action`):

```json
{"type": "devices.capabilities.on_off", "state": {"instance": "on", "value": true}}
```

### PropertyObject (свойство)

Та же пара `parameters` / `state`, но `type` = `devices.properties.{type}`.
Свойства только читаются: `action` к ним не применим.

---

## 2. Типы устройств

Полный список из документации. Правый столбец — раздел
«Рекомендуемые умения» с соответствующей страницы типа. Это
рекомендация, а не ограничение: «Платформа умного дома не ограничивает
провайдера указанным списком».

### 2.1 Датчики

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.sensor` | Универсальный датчик, передаёт данные свойств | любые `float`/`event` (см. 2.11) |
| `devices.types.sensor.button` | Умная кнопка | `event/button` |
| `devices.types.sensor.climate` | Датчик климата | `float/temperature`, `float/humidity` |
| `devices.types.sensor.gas` | Датчик газа | `event/gas` |
| `devices.types.sensor.illumination` | Датчик освещённости | `float/illumination` |
| `devices.types.sensor.motion` | Датчик движения | `event/motion` |
| `devices.types.sensor.open` | Датчик открытия двери | `event/open` |
| `devices.types.sensor.smoke` | Датчик дыма | `event/smoke` |
| `devices.types.sensor.vibration` | Датчик вибрации | `event/vibration` |
| `devices.types.sensor.water_leak` | Датчик протечки | `event/water_leak` |

> В коде ZESP для датчика двери используется
> `devices.types.sensor.door` (`yandexSensorType`). Это legacy-написание,
> принятое платформой; в документации значится `sensor.open`.
> В новых шаблонах корректно указывать `devices.types.sensor.open`,
> в уже существующих — оставлять как есть, чтобы не ломать привязки.

### 2.2 Счётчики

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.smart_meter` | Универсальный счётчик расхода | `float/meter` |
| `devices.types.smart_meter.cold_water` | Счётчик холодной воды | `float/water_meter` |
| `devices.types.smart_meter.hot_water` | Счётчик горячей воды | `float/water_meter` |
| `devices.types.smart_meter.gas` | Счётчик газа | `float/gas_meter` |
| `devices.types.smart_meter.heat` | Счётчик тепла | `float/heat_meter` |
| `devices.types.smart_meter.electricity` | Счётчик электроэнергии | `float/electricity_meter` |

### 2.3 Медиаустройства

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.camera` | Камера, домофон, глазок | `on_off`, `event` (см. примечание про `video_stream` в разделе 3) |
| `devices.types.media_device` | DVD-плеер и прочие медиаустройства | `on_off`, `mode/input_source`, `range/channel`, `range/volume`, `toggle/mute`, `toggle/pause` |
| `devices.types.media_device.tv` | Умный ТВ, медиаприставка, ИК-пульт | то же + `toggle/backlight`, `toggle/controls_locked` |
| `devices.types.media_device.tv_box` | ТВ-приставка | `on_off`, `range/channel`, `range/volume`, `toggle/mute`, `toggle/pause` (без `mode`) |
| `devices.types.media_device.receiver` | Спутниковый/AV-ресивер | `on_off`, `range/channel`, `range/volume`, `mode/input_source`, `toggle/mute`, `toggle/pause` |

### 2.4 Кухонная техника

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.cooking` | Холодильник, духовой шкаф и прочая | `on_off`, `mode/program`, `range/temperature`, `toggle/controls_locked`, `toggle/keep_warm`, `toggle/pause`, `float/temperature` |
| `devices.types.cooking.coffee_maker` | Кофеварка, кофемашина | `on_off`, `mode/coffee_mode`, `mode/program`, `float/water_level`, `event/water_level` |
| `devices.types.cooking.kettle` | Умный чайник, термопот | `on_off`, `range/temperature`, `mode/tea_mode`, `toggle/backlight`, `toggle/controls_locked`, `toggle/keep_warm`, `color_setting`, `float/temperature`, `float/water_level`, `event/water_level` |
| `devices.types.cooking.multicooker` | Мультиварка | `on_off`, `mode/program`, `range/temperature`, `toggle/controls_locked`, `toggle/keep_warm` |
| `devices.types.dishwasher` | Посудомоечная машина | `on_off`, `mode/dishwashing`, `toggle/controls_locked` |

### 2.5 Бытовая техника

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.iron` | Утюг, парогенератор | `on_off`, `range/temperature`, `mode/program` |
| `devices.types.vacuum_cleaner` | Робот-пылесос | `on_off`, `mode/cleanup_mode`, `mode/work_speed`, `toggle/pause`, `float/battery_level`, `event/battery_level`, `float/water_level`, `event/water_level` |
| `devices.types.washing_machine` | Стиральная машина | `on_off`, `mode/program`, `toggle/pause`, `toggle/controls_locked` |

### 2.6 Устройства для животных

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.pet_feeder` | Кормушка | `on_off`, `float/food_level`, `event/food_level` |
| `devices.types.pet_drinking_fountain` | Поилка | `on_off`, `float/water_level`, `event/water_level` |

### 2.7 Климатическая техника

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.thermostat` | Теплый пол, обогреватель, водонагреватель | `on_off`, `range/temperature`, `mode/thermostat`, `mode/fan_speed`, `mode/heat`, `toggle/oscillation`, `float/temperature`, `float/pressure` |
| `devices.types.thermostat.ac` | Кондиционер | `on_off`, `range/temperature`, `mode/thermostat`, `mode/fan_speed`, `mode/swing`, `toggle/oscillation`, `toggle/ionization`, `float/temperature` |
| `devices.types.humidifier` | Увлажнитель | `on_off`, `range/humidity`, `mode/fan_speed`, `toggle/ionization`, `float/humidity`, `float/temperature`, `float/water_level`, `event/water_level` |
| `devices.types.purifier` | Очиститель, мойка воздуха | `on_off`, `mode/fan_speed`, `toggle/ionization`, `float/temperature` |
| `devices.types.ventilation` | Бризер, вытяжка, приточная вентиляция | `on_off`, `range/temperature`, `mode/ventilation_mode`, `mode/fan_speed`, `mode/thermostat`, `float/temperature`, `float/humidity`, `float/co2_level`, `float/tvoc`, `float/pm*_density` |
| `devices.types.ventilation.fan` | Вентилятор | `on_off`, `mode/fan_speed`, `toggle/oscillation` |

### 2.8 Электрооборудование

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.light` | Лампочка, светильник, ночник | `on_off`, `range/brightness`, `color_setting`, `toggle/backlight` |
| `devices.types.light.ceiling` | Люстра | то же |
| `devices.types.light.dimmable` | Умный диммер | `on_off`, `range/brightness` (без цвета) |
| `devices.types.light.strip` | Диодная лента | `on_off`, `range/brightness`, `color_setting` |
| `devices.types.light.garland` | Гирлянда | `on_off`, `range/brightness`, `color_setting` |
| `devices.types.light.lamp` | Настольная лампа | `on_off`, `range/brightness`, `color_setting`, `toggle/backlight` |
| `devices.types.light.sconce` | Бра | `on_off`, `range/brightness`, `color_setting` |
| `devices.types.light.torchere` | Торшер | `on_off`, `range/brightness`, `color_setting` |
| `devices.types.socket` | Умная розетка | `on_off`, `toggle/backlight`, `color_setting` (подсветка), `float/power`, `float/amperage`, `float/voltage` |
| `devices.types.switch` | Выключатель, тумблер, умная кнопка | `on_off`, `toggle/backlight`, `float/power`, `float/amperage`, `float/voltage` |
| `devices.types.switch.relay` | Реле, автомат в щитке | `on_off` |

Обратить внимание: у `light.strip`, `garland`, `sconce`, `torchere` в
рекомендации нет `toggle/backlight`, у `light` и `light.ceiling` — есть.
У `switch.relay` нет ни замеров, ни подсветки.

### 2.9 Открытие и закрытие

| Тип | Назначение | Рекомендуемое |
|-----|------------|----------------|
| `devices.types.openable` | Дверь, ворота, окно, ставни | `on_off`, `range/open`, `mode/work_speed`, `event/open` |
| `devices.types.openable.curtain` | Шторы, жалюзи | `on_off`, `range/open`, `mode/work_speed`, `event/open` |
| `devices.types.openable.valve` | Шаровой кран | `on_off`, `range/open` (без `mode` и `event`) |
| `devices.types.openable.door_lock` | Замок (бета) | перечень не опубликован |

### 2.10 Прочее

| Тип | Назначение |
|-----|------------|
| `devices.types.other` | Запасной тип, когда ничего не подошло |

### 2.11 Свойства типа `devices.types.sensor` (универсальный датчик)

Документация рекомендует для «умного датчика без конкретики» весь
набор функций — на устройство кладут только нужные:

`event`: `battery_level`, `button`, `gas`, `motion`, `open`, `smoke`,
`vibration`, `water_level`, `water_leak`

`float`: `battery_level`, `co2_level`, `humidity`, `illumination`,
`pm1_density`, `pm2.5_density`, `pm10_density`, `pressure`, `temperature`,
`tvoc`, `water_level`

> Правило модерации: если устройству подходит конкретный тип из списка —
> использовать его. `other` и «размазанный» `sensor` — последний выход,
> иначе навык рискует быть отклонён на проверке.

---

## 3. Умения: общие правила

Умение — функция, которой можно **управлять**. Именно в `action`
Яндекс присылает команду.

| Поле | Обяз. | Смысл |
|------|-------|-------|
| `type` | да | `devices.capabilities.{type}` |
| `retrievable` | да | можно ли читать состояние |
| `reportable` | да | присылать ли callback об изменении |
| `parameters` | нет | описание функции |
| `state` | нет | текущее значение (`instance` + `value`) |

Сводная страница «Об умениях» перечисляет **5 типов**: `on_off`,
`color_setting`, `mode`, `range`, `toggle`. Ни один другой тип в
`capabilities` подставлять нельзя.

> Исключение, о котором стоит знать: на странице
> `devices.types.camera` платформа рекомендует
> `devices.capabilities.video_stream`, которого нет в сводном списке
> и нет отдельной страницы. Это служебное умение внутреннего
> протокола: обычному провайдеру его реализовывать не нужно, в ZESP
> оно не поддерживается. Камеру следует описывать через `on_off`
> (включение) и `event` (движение), если нужно.

---

## 4. Умение `on_off`

Включение/выключение. Базовое умение большинства устройств.

- `parameters`: опционально только `split: true` — раздельные команды
  «открыть» и «закрыть» вместо переключения. Допустимо **только** при
  `retrievable: false` (состояние неизвестно). Типичный случай — шторы
  или жалюзи с двумя кнопками.
- `state.instance`: только `on`.
- `state.value`: `true` / `false`.

Примеры:

```json
{"type": "devices.capabilities.on_off", "retrievable": true, "reportable": true,
 "state": {"instance": "on", "value": false}}
```

```json
{"type": "devices.capabilities.on_off", "retrievable": false,
 "parameters": {"split": true}}
```

---

## 5. Умение `range`

Параметр с числовым диапазоном: яркость, температура, громкость, канал,
процент открытия.

- `parameters`:
  - `instance` — **обязательно**;
  - `unit` — см. 5.1;
  - `random_access` — можно ли ставить произвольное значение;
    по умолчанию `true`. `false` = только «прибавь/убавь» (например,
    громкость телевизора через ИК-пульт);
  - `range` — `{min, max, precision}`, `precision` по умолчанию 1.
- `state.value`: число **внутри** диапазона с кратностью `precision`.
- В `action` допустимо `relative: true` — значение прибавляется к
  текущему (по умолчанию `false`, то есть ставится абсолютно).

### 5.1 Экземпляры `range`

| instance | Назначение | Единица | min/max по документации |
|----------|-----------|---------|--------------------------|
| `brightness` | Яркость | `unit.percent` | 0–100 жёстко |
| `humidity` | Влажность (увлажнитель) | `unit.percent` | 0–100 жёстко |
| `open` | Степень открытия (шторы, жалюзи) | `unit.percent` | 0–100 жёстко |
| `volume` | Громкость | `unit.percent` | задаёт провайдер |
| `temperature` | Температура | `unit.temperature.celsius` или `unit.temperature.kelvin` | задаёт провайдер |
| `channel` | Номер канала | единица не задана | задаёт провайдер |

`precision` по умолчанию 1.

> ZESP отдаёт яркость как 1–100 (а не 0–100): значение 0 в
> `addLightCap` поднимается до 1, иначе Яндекс показывает «выключено»
> при реально включённой лампе. Поэтому в шаблонах для `brightness`
> принято писать `min: 1`.

Пример:

```json
{
  "type": "devices.capabilities.range",
  "retrievable": true,
  "reportable": true,
  "parameters": {
    "instance": "brightness",
    "unit": "unit.percent",
    "random_access": true,
    "range": {"min": 1, "max": 100, "precision": 1}
  },
  "state": {"instance": "brightness", "value": 50}
}
```

---

## 6. Умение `mode`

Переключение режимов работы.

- `parameters`:
  - `instance` — **обязательно**;
  - `modes` — массив `{"value": "..."}`, минимум 1. **Порядок элементов
    при повторной отправке менять нельзя** — иначе платформа считает
    это другим устройством.
- `state.value`: строка, **обязана входить в `modes[]`**. Значение вне
  списка рушит всё обнаружение.

### 6.1 Экземпляры `mode` и рекомендуемые значения

Значения взяты из раздела «Рекомендуемые умения» на страницах типов
устройств. Полный перечень допустимых строк — 6.2.

| instance | Устройства | Рекомендуемые значения |
|----------|-----------|------------------------|
| `thermostat` | `thermostat.ac` | `auto`, `cool`, `dry`, `eco`, `fan_only`, `heat` |
| `thermostat` | `thermostat`, `ventilation` | `auto`, `cool`, `dry`, `fan_only`, `heat` (у `ventilation`: `auto`, `fan_only`, `heat`) |
| `fan_speed` | `thermostat`, `thermostat.ac`, `humidifier`, `purifier`, `ventilation` | `auto`, `high`, `low`, `medium`, `quiet`, `turbo` |
| `fan_speed` | `ventilation.fan` | `low`, `medium`, `high`, `turbo` |
| `swing` | `thermostat.ac` | `auto`, `horizontal`, `stationary`, `vertical` |
| `work_speed` | `openable`, `openable.curtain` | `fast`, `medium`, `slow` |
| `work_speed` | `vacuum_cleaner` | `auto`, `fast`, `medium`, `slow`, `turbo` |
| `heat` | `thermostat` | `auto`, `max`, `min`, `normal`, `turbo` |
| `ventilation_mode` | `ventilation` | `auto`, `supply_air`, `extraction_air` |
| `tea_mode` | `cooking.kettle` | `black_tea`, `flower_tea`, `green_tea`, `herbal_tea`, `oolong_tea`, `puerh_tea`, `red_tea`, `white_tea` |
| `coffee_mode` | `cooking.coffee_maker` | `americano`, `cappuccino`, `double_espresso`, `espresso`, `latte` |
| `dishwashing` | `dishwasher` | `auto`, `eco`, `quiet`, `express`, `glass`, `intensive`, `pre_rinse` |
| `cleanup_mode` | `vacuum_cleaner` | `auto`, `eco`, `express`, `normal`, `quiet`, `wet_cleaning`, `dry_cleaning`, `mixed_cleaning` |
| `program` | `cooking` | `one`…`ten`, `express`, `normal` |
| `program` | `cooking.coffee_maker` | `one`…`ten` |
| `program` | `washing_machine` | `one`…`ten`, `express` |
| `program` | `iron` | `turbo`, `eco`, `steam`, `auto`, `one`, `two` |
| `program` | `cooking.multicooker` | 25 значений (см. 6.2) |
| `input_source` | `media_device`, `media_device.tv`, `media_device.receiver` | `one`…`ten` |

### 6.2 Полный список значений режимов

Страница «Список режимов работы» содержит 67 значений, доступных
любому `instance`. Порядок в `modes[]` должен оставаться постоянным.

Общие:

`auto`, `eco`, `smart`, `turbo`, `express`, `quiet`, `normal`,
`preheat`, `cool`, `dry`, `fan_only`, `heat`, `high`, `low`, `medium`,
`max`, `min`, `fast`, `slow`

Климат и вентиляция:

`horizontal`, `stationary`, `vertical`, `supply_air`, `extraction_air`

Уборка:

`dry_cleaning`, `wet_cleaning`, `mixed_cleaning`

Кофе:

`americano`, `cappuccino`, `double_espresso`, `espresso`, `latte`

Чай:

`black_tea`, `flower_tea`, `green_tea`, `herbal_tea`, `oolong_tea`,
`puerh_tea`, `red_tea`, `white_tea`

Посуда:

`glass`, `intensive`, `pre_rinse`

Программы мультиварки (25):

`aspic`, `baby_food`, `baking`, `bread`, `boiling`, `cereals`,
`cheesecake`, `deep_fryer`, `dessert`, `fowl`, `frying`, `macaroni`,
`milk_porridge`, `multicooker`, `pasta`, `pilaf`, `pizza`, `sauce`,
`slow_cook`, `soup`, `steam`, `stewing`, `vacuum`, `yogurt`, `preheat`

> Голосовые команды подсказывают порядковые значения: «включи
> десятую рабочую программу» = `ten`, «включи программу в первый
> режим» = `one`.

Пример:

```json
{
  "type": "devices.capabilities.mode",
  "retrievable": true,
  "reportable": true,
  "parameters": {
    "instance": "thermostat",
    "modes": [{"value": "auto"}, {"value": "cool"}, {"value": "heat"}]
  },
  "state": {"instance": "thermostat", "value": "heat"}
}
```

---

## 7. Умение `toggle`

Двухпозиционное включение/выключение дополнительной функции.

- `parameters`: только `instance` (обязательно).
- `state.value`: `true` / `false`.

| instance | Функция |
|----------|---------|
| `backlight` | Подсветка |
| `ionization` | Ионизация |
| `oscillation` | Вращение/качание |
| `keep_warm` | Поддержание тепла |
| `mute` | Выключение звука |
| `pause` | Пауза |
| `controls_locked` | Блокировка управления / детский режим |

Пример:

```json
{"type": "devices.capabilities.toggle", "retrievable": true, "reportable": true,
 "parameters": {"instance": "backlight"},
 "state": {"instance": "backlight", "value": true}}
```

---

## 8. Умение `color_setting`

Цвет, цветовая температура, сцены освещения. Хотя цвет — управляемое
умение, по смыслу это описание источника света.

`parameters` обязан содержать **хотя бы один** из трёх параметров.
Каждый из них помечен в документации как обязательный «если отсутствуют
два других» — то есть **все три можно сочетать одновременно** (так и
сделано в примере документации: `color_model` + `temperature_k` +
`color_scene`).

| Параметр | Смысл | Формат | Обязателен |
|-----------|-------|--------|------------|
| `color_model` | Модель цвета | `"hsv"` или `"rgb"` (24 бит) | если нет `temperature_k` и `color_scene` |
| `temperature_k` | Диапазон температуры | `{min, max}`, по умолчанию 2000–9000 | если нет `color_model` и `color_scene` |
| `color_scene` | Темы и сценарии | `{"scenes": [{"id": "..."}, ...]}`, минимум 1 | если нет `color_model` и `temperature_k` |

`state.instance` и формат `state.value`:

| instance | Формат value |
|----------|--------------|
| `hsv` | объект `{"h": 0–360, "s": 0–100, "v": 0–100}` |
| `rgb` | целое 0–16777215 |
| `temperature_k` | целое, кельвины |
| `scene` | строка с `id` сцены |

Ориентиры цветовой температуры: 1500 огненный, 2700 мягкий,
3400 тёплый, **4500 белый (значение по умолчанию платформы)**,
5600 дневной, 6500 холодный, 7500 туманный, 9000 небесный. Если
диапазон не пересекается с таблицей, пользователю показывается 4500 К.
Однорежимная лампа: `min == max` (например 5600).

Темы и сценарии освещения (`color_scene[].id`), 16 штук:

| id | Название | id | Название |
|----|----------|----|----------|
| `alarm` | Тревога | `night` | Ночь |
| `alice` | Алиса | `ocean` | Океан |
| `candle` | Свеча | `party` | Вечеринка |
| `dinner` | Ужин | `reading` | Чтение |
| `fantasy` | Фантазия | `rest` | Отдых |
| `garland` | Гирлянда | `romance` | Романтика |
| `jungle` | Джунгли | `siren` | Сирена |
| `movie` | Кино | `neon` | Неон |

Пример:

```json
{
  "type": "devices.capabilities.color_setting",
  "retrievable": true,
  "reportable": true,
  "parameters": {
    "color_model": "hsv",
    "temperature_k": {"min": 2700, "max": 6500}
  },
  "state": {"instance": "hsv", "value": {"h": 30, "s": 80, "v": 100}}
}
```

---

## 9. Свойства: общие правила

Свойство — **наблюдаемое** значение. Управлять им нельзя.

| Поле | Обяз. | Смысл |
|------|-------|-------|
| `type` | да | `devices.properties.{type}` |
| `retrievable` | да | можно ли читать состояние |
| `reportable` | да | присылать ли callback об изменении |
| `parameters` | да | описание функции |
| `state` | нет | текущее значение |

Всего документировано **2 типа свойств**: `float`, `event`.

> В ZESP роль `sensor` без явного `ya_rep` автоматически превращается
> в свойство по `device_class` (`addSensorProp`), а роль `binary_sensor`
> без `device_class` — в `event`-подобное описание. Явный `ya_rep`
> всегда приоритетнее автоподбора.

---

## 10. Свойство `float`

Числовое значение. `parameters` обязан содержать **оба** поля:
`instance` и `unit` (в документации оба помечены «Да»).

| instance | Показание | Единица | Ограничение по документации | Где применяется в ZESP |
|----------|-----------|---------|----------------------------|------------------------|
| `temperature` | Температура | `unit.temperature.celsius` или `unit.temperature.kelvin` | — | `device_class: temperature` |
| `humidity` | Влажность | `unit.percent` | — | `humidity` |
| `battery_level` | Заряд батареи | `unit.percent` | — | `battery` |
| `power` | Мощность | `unit.watt` | — | `energy` |
| `amperage` | Ток | `unit.ampere` | ≥ 0 | `current` |
| `voltage` | Напряжение | `unit.volt` | — | `voltage` |
| `illumination` | Освещённость | `unit.illumination.lux` | — | `illuminance` |
| `pressure` | Давление | `unit.pressure.atm` / `.bar` / `.mmhg` / `.pascal` | — | `pressure`, `atmospheric_pressure` |
| `co2_level` | CO₂ | `unit.ppm` | — | `carbon_dioxide` |
| `tvoc` | Летучие соединения | `unit.density.mcg_m3` | — | `volatile_organic_compounds` |
| `pm1_density` | PM1 | `unit.density.mcg_m3` | — | `pm1` |
| `pm2.5_density` | PM2.5 | `unit.density.mcg_m3` | — | `pm25` |
| `pm10_density` | PM10 | `unit.density.mcg_m3` | — | `pm10` |
| `water_level` | Уровень воды | `unit.percent` | — | `water`, `moisture` |
| `food_level` | Уровень корма | `unit.percent` | — | кормушка |
| `meter` | Универсальный счётчик | **в документации не указан** | ≥ 0 | `smart_meter` |
| `water_meter` | Расход воды | `unit.cubic_meter` | ≥ 0 | счётчики воды |
| `gas_meter` | Расход газа | `unit.cubic_meter` | ≥ 0 | счётчик газа |
| `heat_meter` | Расход тепла | `unit.gigacalorie` | ≥ 0 | счётчик тепла |
| `electricity_meter` | Расход электроэнергии | `unit.kilowatt_hour` | ≥ 0 | счётчик электричества |

Две оговорки:

- Ограничение «≥ 0» в документации есть только у счётчиков и тока.
  Для процентов (`battery_level`, `water_level`, `humidity`) диапазон
  явно не задан, но интерфейс Яндекса рассчитан на 0–100 — нарушение
  приведёт к некорректному отображению, даже если проверку пройдёт.
- Для `meter` документация не перечисляет допустимые единицы, хотя
  поле `unit` обязательно. Практический выбор для расхода —
  `unit.cubic_meter`.

Пример:

```json
{
  "type": "devices.properties.float",
  "retrievable": true,
  "reportable": true,
  "parameters": {"instance": "humidity", "unit": "unit.percent"},
  "state": {"instance": "humidity", "value": 45}
}
```

### 10.1 Полный список единиц

Всего в документации 16 единиц:

| Единица | Что измеряет |
|---------|--------------|
| `unit.percent | проценты |
| `unit.ampere` | амперы |
| `unit.volt` | вольты |
| `unit.watt` | ватты |
| `unit.kilowatt_hour` | киловатт-часы |
| `unit.cubic_meter` | кубические метры |
| `unit.gigacalorie` | гигакалории |
| `unit.illumination.lux` | люксы |
| `unit.ppm` | миллионные доли (parts per million) |
| `unit.density.mcg_m3` | мкг/м³ |
| `unit.pressure.atm` | атмосферы |
| `unit.pressure.bar` | бары |
| `unit.pressure.mmhg` | мм ртутного столба |
| `unit.pressure.pascal` | паскали |
| `unit.temperature.celsius` | градусы Цельсия |
| `unit.temperature.kelvin` | кельвины |

Других единиц платформа не принимает.

---

## 11. Свойство `event`

Дискретное событие. `parameters`: `instance` (обязательно) + `events`
(массив `{"value": "..."}`, минимум 1). `state.value` обязан входить
в `events`.

| instance | Допустимые значения | Оборудование в ZESP |
|----------|---------------------|--------------------|
| `open` | `opened` (открыто), `closed` (закрыто) | `device_class: door` / `window` / `opening` / `garage_door` |
| `motion` | `detected` (обнаружено), `not_detected` (не обнаружено) | `motion` / `occupancy` / `presence` |
| `smoke` | `detected`, `not_detected`, `high` (высокий уровень) | `smoke` |
| `gas` | `detected`, `not_detected`, `high` | `gas` |
| `water_leak` | `dry` (нет протечки), `leak` (протечка) | `water_leak` |
| `vibration` | `tilt` (переворачивание), `fall` (падение), `vibration` | `vibration` |
| `button` | `click` (одиночное), `double_click` (двойное), `long_press` (долгое) | пульты, кнопки |
| `battery_level` | `low` (низкий), `normal` (нормальный) | батарея как событие |
| `water_level` | `empty` (пусто), `low`, `normal` | чайник, поилка |
| `food_level` | `empty` (пусто), `low`, `normal` | кормушка |

Порядок значений в `events[]`, в отличие от `modes[]`, менять можно.

Пример:

```json
{
  "type": "devices.properties.event",
  "retrievable": true,
  "reportable": true,
  "parameters": {
    "instance": "open",
    "events": [{"value": "opened"}, {"value": "closed"}]
  },
  "state": {"instance": "open", "value": "opened"}
}
```

---

## 12. Готовые `ya_rep` под типовые Zigbee-устройства

Ниже — строки, которые можно положить в `ya_rep` записи отчёта
(`Report[<ключ>].ya_rep`) шаблона в `desktop/Devtemplates` (там
шаблоны — плоские файлы, а не папки).

Ключ отчёта: `<endpoint:2><cluster:4><attribute:4>`, например
`0100060000` = endpoint 01, cluster 0006 (On/Off), attribute 0000.
Значение атрибута лежит в `val`, разобранное для Яндекса — в `parsed`.

### 12.1 Реле / выключатель / розетка (`switch`, `socket`)

```json
{"capabilities":[{"type":"devices.capabilities.on_off","retrievable":true,"reportable":true,"state":{"instance":"on","value":false}}]}
```

Замеры идут отдельными отчётами кластера `0B04`
(Electrical Measurement) с ролью `sensor` и нужным `device_class`:

| Атрибут | Ключ отчёта | `ya_rep` |
|---------|-------------|----------|
| `05` — напряжение | `010B040505` | `{"properties":[{"type":"devices.properties.float","retrievable":true,"reportable":true,"parameters":{"instance":"voltage","unit":"unit.volt"},"state":{"instance":"voltage","value":0}}]}` |
| `08` — ток | `010B040508` | `{"properties":[{"type":"devices.properties.float","retrievable":true,"reportable":true,"parameters":{"instance":"amperage","unit":"unit.ampere"},"state":{"instance":"amperage","value":0}}]}` |
| `0B` — мощность | `010B04050B` | `{"properties":[{"type":"devices.properties.float","retrievable":true,"reportable":false,"parameters":{"instance":"power","unit":"unit.watt"},"state":{"instance":"power","value":0}}]}` |

Примеры соответствуют шаблону `TS011F`. У `power` в реальном шаблоне
`reportable: false` — то есть о приходе отчёта `010B04050B` Яндекс
не уведомляется, значение читается только по запросу. У остальных
двух замеров `reportable: true`.

### 12.2 Лампа (`light`) — вкл/выкл + яркость

```json
{"capabilities":[
  {"type":"devices.capabilities.on_off","retrievable":true,"reportable":true,"state":{"instance":"on","value":false}},
  {"type":"devices.capabilities.range","retrievable":true,"reportable":true,
   "parameters":{"instance":"brightness","unit":"unit.percent","random_access":true,"range":{"min":1,"max":100,"precision":1}},
   "state":{"instance":"brightness","value":100}}
]}
```

С цветом (RGB + CCT) — два отдельных отчёта: кластер `0300`, атрибут
`0000` — цвет, `0007` — температура.

```json
{"capabilities":[{"type":"devices.capabilities.color_setting","retrievable":true,"reportable":true,
 "parameters":{"color_model":"hsv","temperature_k":{"min":2700,"max":6500}},
 "state":{"instance":"hsv","value":{"h":0,"s":0,"v":100}}}]}
```

```json
{"capabilities":[{"type":"devices.capabilities.color_setting","retrievable":true,"reportable":true,
 "parameters":{"temperature_k":{"min":2700,"max":6500}},
 "state":{"instance":"temperature_k","value":4000}}]}
```

Только температура, один режим:

```json
{"capabilities":[{"type":"devices.capabilities.color_setting","retrievable":true,"reportable":true,
 "parameters":{"temperature_k":{"min":5600,"max":5600}},
 "state":{"instance":"temperature_k","value":5600}}]}
```

### 12.3 Датчик температуры/влажности (`sensor.climate`)

```json
{"properties":[{"type":"devices.properties.float","retrievable":true,"reportable":true,
 "parameters":{"instance":"temperature","unit":"unit.temperature.celsius"},
 "state":{"instance":"temperature","value":22}}]}
```

```json
{"properties":[{"type":"devices.properties.float","retrievable":true,"reportable":true,
 "parameters":{"instance":"humidity","unit":"unit.percent"},
 "state":{"instance":"humidity","value":45}}]}
```

### 12.4 Датчик движения (`sensor.motion`)

```json
{"properties":[{"type":"devices.properties.event","retrievable":true,"reportable":true,
 "parameters":{"instance":"motion","events":[{"value":"detected"},{"value":"not_detected"}]},
 "state":{"instance":"motion","value":"not_detected"}}]}
```

### 12.5 Датчик открытия (`sensor.open`)

```json
{"properties":[{"type":"devices.properties.event","retrievable":true,"reportable":true,
 "parameters":{"instance":"open","events":[{"value":"opened"},{"value":"closed"}]},
 "state":{"instance":"open","value":"closed"}}]}
```

### 12.6 Кнопка / пульт (`sensor.button`)

```json
{"properties":[{"type":"devices.properties.event","retrievable":true,"reportable":true,
 "parameters":{"instance":"button","events":[{"value":"click"},{"value":"double_click"},{"value":"long_press"}]},
 "state":{"instance":"button","value":"click"}}]}
```

### 12.7 Шторы / жалюзи (`openable.curtain`, шаблон `Drivent`)

```json
{"capabilities":[
  {"type":"devices.capabilities.on_off","retrievable":true,"reportable":true,"state":{"instance":"on","value":false}},
  {"type":"devices.capabilities.range","retrievable":true,"reportable":true,
   "parameters":{"instance":"open","unit":"unit.percent","random_access":true,"range":{"min":0,"max":100,"precision":1}},
   "state":{"instance":"open","value":0}}
]}
```

Шторы на две кнопки (состояние не известно):

```json
{"capabilities":[{"type":"devices.capabilities.on_off","retrievable":false,"parameters":{"split":true}}]}
```

### 12.8 Термостат / тёплый пол (`thermostat`)

Уставка (кластер `0201`, атрибут `0012`):

```json
{"capabilities":[{"type":"devices.capabilities.range","retrievable":true,"reportable":true,
 "parameters":{"instance":"temperature","unit":"unit.temperature.celsius","random_access":true,"range":{"min":5,"max":40,"precision":1}},
 "state":{"instance":"temperature","value":22}}]}
```

Режим (атрибут `001C`):

```json
{"capabilities":[
  {"type":"devices.capabilities.mode","retrievable":true,"reportable":true,
   "parameters":{"instance":"thermostat","modes":[{"value":"auto"},{"value":"heat"}]},
   "state":{"instance":"thermostat","value":"heat"}},
  {"type":"devices.capabilities.on_off","retrievable":true,"reportable":true,"state":{"instance":"on","value":true}}
]}
```

Внимание: в кластере `0201` режим `off` (`0`) в `modes` не входит —
выключение несёт `on_off`. Код ZESP подменяет значение вне `modes`
первым элементом списка, чтобы не сломать обнаружение.

### 12.9 Клавиатурный датчик (кластер `0405`, атрибут `0000`)

Клавиши/сцены приходят как индекс 0–255 в атрибуте `0000` кластера
`0405` (ключ отчёта вида `0104050000`). В ZESP так работают `TH01`,
`TS0201`, `DIYRuZ_Flower`, `lumi.weather`.

Обычные же пульты (`TS0044`, `FreePad_LeTV_8`) держат каждую клавишу
на своём endpoint кластера `0006` (`0100060000`, `0200060000`, …) —
тот же формат, что у реле, только вместо `capabilities` в `ya_rep`
лежит `event/button`.

Каждая клавиша как отдельное устройство через `multi_id` (см. 13):

```json
{"properties":[{"type":"devices.properties.event","retrievable":false,"reportable":true,
  "parameters":{"instance":"button","events":[{"value":"click"}]},
  "state":{"instance":"button","value":"click"}}],
  "multi_id":{"name":"кнопка 1","room":"Дом","type":"devices.types.sensor.button"}}
```

### 12.10 Скрыть запись из Яндекса

Чтобы скрыть запись отчёта целиком, в `ya_rep` кладут строку `none`:

```json
{"ya_rep": "none"}
```

---

## 13. `multi_id`: одно физическое устройство → несколько в Яндексе

### 13.1 Модель платформы: почему приходится разбивать

Понять это нужно **до** всех настроек, иначе `multi_id` будет
использоваться наугад. Ключевая мысль: **`capabilities` — это не
каналы управления, а разные аспекты одного физического объекта.**

```json
{"capabilities": [
  {"type": "devices.capabilities.on_off",       "state": {"instance": "on",        "value": true}},
  {"type": "devices.capabilities.range",        "state": {"instance": "brightness", "value": 60}},
  {"type": "devices.capabilities.color_setting","state": {"instance": "hsv",        "value": {"h": 0, "s": 0, "v": 100}}}
]}
```

Это **одна лампа**, а не три устройства: включение, яркость и цвет —
свойства одного объекта. `instance` здесь — не «канал», а **имя
аспекта**: `on`, `brightness`, `hsv`.

Отсюда соблазн решить, что «два реле = два `on_off` в одном
устройстве». Это неверно: получилось бы утверждение, что у объекта
два «вкл/выкл». Два независимых выключателя — не два аспекта одной
сущности, а **две разные сущности**.

Понятия «составное устройство» (один корпус — N каналов) в
протоколе нет вообще. Устройство — это единица работы платформы,
и ограничения жёсткие:

| Ограничение модели | Что ломается без разбиения |
|---|---|
| один `room` на устройство | Двухклавишник: клавиша в коридоре и клавиша в зале. Комната одна на оба — задать **физически невозможно**, никакими `capabilities` это не обходится |
| один `type` на устройство | Тройник: слоты — `devices.types.socket`. Одно устройство не может быть одновременно `socket` и `light` |
| одна идентичность в голосе, UI и сценах | Алиса не различит каналы: «Алиса, выключи свет» без имени неоднозначен. В интерфейсе один тумблер вместо двух. В сценах нельзя выбрать «второй канал» |
| одно состояние на `capability` | Четыре кнопки дают четыре свойства с одинаковым `type` + `instance` и сливаются в одно; `updateState` не сможет указать, какое именно нажатие произошло |

А вот физика, из-за которой всё это возникает:

| Физически | Как хочет пользователь |
|-----------|------------------------|
| Двухклавишный выключатель в одном корпусе | «свет в коридоре» и «свет в зале» — два независимых выключателя |
| Тройник-розетка | три розетки |
| Пульт на 4 кнопки | четыре кнопки, каждая привязывается к своим сценам |
| Вытяжка с 3 скоростями | три отдельных выключателя либо один с выбором скорости |
| LED-лента с 3 сегментами | три диммера |

Всё остальное сводится к одному критерию, и он **не про количество
реле**: сколько вещей здесь может существовать **отдельно**? Если
канал — аспект (яркость той же лампы), разделять нельзя. Если канал —
самостоятельная сущность со своим именем, комнатой и включением —
разделять обязательно.

### 13.2 Что делает `multi_id`

`multi_id` — обход отсутствия составных устройств. Он не добавляет
каналы внутрь устройства, а делает обратное: **отказывается от
объединения**. Каждая запись `Report` с `multi_id` становится
отдельным устройством Яндекса — со своим `id`, `type`, `room` и
именем, и ограничения выше снимаются по одному.

Отсюда странный на вид идентификатор: `id = IEEE^<ключ_отчёта>`,
например `0c11e401020b8f1^0200060000`. Настоящего второго `id` у
второго реле физически нет — корпус один, IEEE один. Но протокол
требует уникальный `id` на каждую сущность, поэтому ZESP
синтезирует его из IEEE и ключа отчёта.

Обратная сторона: `multi_id` — не косметика. Он меняет маршрутизацию
команд (13.4), поэтому применять его надо осознанно, а не «на всякий
случай».

### 13.3 Структура

`multi_id` кладётся в `ya_rep` рядом с `capabilities`/`properties`
той самой записи отчёта, которая описывает канал:

```json
{
  "capabilities": [
    {"type": "devices.capabilities.on_off", "retrievable": true, "reportable": true,
     "state": {"instance": "on", "value": false}}
  ],
  "multi_id": {
    "name": "свет большой",
    "room": "детская",
    "type": "devices.types.switch"
  }
}
```

| Поле | Смысл | Обяз. |
|------|-------|-------|
| `name` | Имя канала в Яндексе | нет (в шаблонах часто пустое) |
| `room` | Комната канала | нет |
| `type` | Тип **самого канала** | нет, по умолчанию `devices.types.other` |

`type` канала выбирается по смыслу **канала**, а не родителя:
клавиша света — `devices.types.switch`, слот тройника —
`devices.types.socket`, кнопка сцен — `devices.types.sensor.button`
или `devices.types.other`.

### 13.4 Как это работает в коде

Разбор целиком — в `hubws.go` и `helpers.go`.

**Шаг 1. Признак разделения.** `hasMultiId` (`helpers.go`) ищет ключ
`multi_id` в `ya_rep` — как в строке JSON, так и в готовом объекте.

**Шаг 2. Список устройств** (`buildDeviceList`, строки 420–538).
Устройство обрабатывается дважды:

```go
// 1) основное устройство — zesp2ya пропускает все multi_id-записи
tmpdev := h.zesp2ya(dm, t, "")
if !isEmptyYaDevice(tmpdev) {
    result = append(result, tmpdev)
}

// 2) каналы — отдельное устройство на каждый multi_id-отчёт
multiDev := map[string]interface{}{
    "id":          ieee + "^" + rk,        // ← ключ отчёта в ID
    "name":        multiRaw["name"],
    "room":        multiRaw["room"],
    "type":        multiRaw["type"],
    "capabilities": []interface{}{},
    "properties":   []interface{}{},
}
if caps, ok := tz["capabilities"]; ok { multiDev["capabilities"] = caps }
if props, ok := tz["properties"]; ok { multiDev["properties"] = props }
if !isEmptyYaDevice(multiDev) {
    result = append(result, multiDev)
}
```

Следствия, которые надо знать:

- **ID канала = `IEEE^<ключ_отчёта>`**, например
  `0c11e401020b8f1^0200060000`. Основное устройство остаётся с
  голым `IEEE`. По этой же строке Яндекс в ответах различает канал.
- **Основное устройство может исчезнуть.** `zesp2ya` пропускает
  `multi_id`-записи, поэтому если они *все*, основное устройство
  получается пустым и отсекается `isEmptyYaDevice`. Для `TS0012`
  (2 реле, оба с `multi_id`) в Яндексе видны только два отдельных
  устройства — «родителя» нет.
- **Смешанный случай.** Если часть отчётов обычная, а часть с
  `multi_id` (или `none`), существуют и основное устройство, и каналы.
  Теоретически это возможно, но **ни один готовый шаблон в
  `Devtemplates` так не сделан**: во всех четырёх шаблонах с
  `multi_id` основное устройство в итоге исчезает (см. 13.8).
- **`none` не спасает родителя.** Запись с `ya_rep: "none"` не
  разбирается и вовсе не участвует в описании устройства. Если у
  родителя все отчёты — либо `multi_id`, либо `none`, родитель
  отсечётся `isEmptyYaDevice` точно так же.
- **У канала должен быть хотя бы один `capability` или `property`**,
  иначе он отсечётся тем же `isEmptyYaDevice`.
- **`ya_rep` канала обязан быть непустым и не `none`** — иначе запись
  разбирается в `nil` и канал просто не создаётся.
- Порядок в JSON-объекте не важен, важно лишь *наличие* ключа.

**Шаг 3. Команда из Яндекса** (`action`, `hubws.go:240–307`).
ID разбирается по `^` (строки 257–262), и вторую часть код
использует как `reportKey` **напрямую** (строки 280–291):

```go
did, _ := dm["id"].(string)
dobj := ""
if strings.Contains(did, "^") {
    p := strings.SplitN(did, "^", 2)
    did, dobj = p[0], p[1]
}
...
cmd := h.capToCmd(capType, instance)
reportKey := dobj
if reportKey == "" {
    reportKey = h.findReportKey(dev, capType, instance)
}
if cmd != "" && reportKey != "" {
    h.fireCmd(ieee, reportKey, cmd, value)
}
```

Это ключевой момент: для канала `findReportKey` вообще не вызывается,
поиск по кластеру не нужен — канал адресован точно.

Два канала одного устройства дают **абсолютно одинаковую команду**
(для `on_off` это `on_off`). Различает их только `reportKey`. Отсюда
практическое следствие: если `multi_id` не сработал и канал уехал
не туда, дело не в команде, а в ключе отчёта.

**Шаг 4. Отправка состояния** (`UpdateState` — `hubws.go:363`,
`stateDevice` — `hubws.go:377–418`). Вызывается на каждый входящий
репорт (`main.go:1490–1498`). Там же формируется ID:

```go
multi := ""
if dobj != "" {
    if report, ok := dev["Report"].(map[string]interface{}); ok {
        if rv, ok := report[dobj].(map[string]interface{}); ok {
            if hasMultiId(rv) {
                multi = "^" + dobj
            }
        }
    }
}
t := map[string]interface{}{"id": ieee + multi}
return h.zesp2ya(dev, t, dobj)
```

То есть сообщение `updateState` для канала отправляется — с
правильным ID, но с **пустым** состоянием: в `zesp2ya` (строка 618)
`multi_id`-записи пропускаются безусловно, даже когда `dobj`
указывает именно на них. Полное описание канала с начальным
состоянием Яндекс получает только при обнаружении (`devices`).

Практический вывод: **управление каналом работает, отображение его
текущего состояния после обнаружения — нет.** Пользователь увидит
последнее состояние из discovery, дальше оно не обновляется. Для
реле это почти всегда терпимо (состояние и так меняется по команде),
для датчиков — нет: датчик с `multi_id` нельзя использовать как
источник событий.

### 13.5 Когда применять

Разделять, если канал **независим** от остальных:

| Случай | Пример в `Devtemplates` | Тип канала |
|--------|-------------------------|------------|
| Многоклавишник, каждая клавиша — свой свет | `TS0012` (2), `TS0013` (3) | `devices.types.switch` |
| Кнопки сцен, каждая привязывается отдельно | `TS0044` (4 кнопки) | `devices.types.sensor.button` / `other` |
| Скорости вытяжки как отдельные выключатели | `Zesp_CookerHood` (3 из 5) | `devices.types.switch` |
| Слоты тройника-розетки | — | `devices.types.socket` |
| Сегменты LED-ленты | — | `devices.types.light.dimmable` |

Про `TS011F` в этой таблице написать нельзя: он `multi_id` **не
использует** — см. следующую таблицу.

Не разделять, если каналы — части одного смысла:

| Случай | Почему `multi_id` не нужен |
|--------|-----------------------------|
| Датчик температуры + влажности | Это **два свойства** одного устройства `sensor.climate`: `float/temperature` + `float/humidity`. Никакого отдельного устройства |
| Реле с током, напряжением и мощностью | Одно устройство с `on_off` + тремя `float`. Так сделан `TS011F` |
| Лампа: вкл/выкл + яркость + цвет | Одно устройство `light` с `on_off` + `range/brightness` + `color_setting` |
| Каналы, которые всегда работают вместе | Раздельное управление бессмысленно, получится ложная независимость |
| Одноканальные устройства | Нечего разделять |

Проверка на «независимость»: если потеря одного канала делает
остальные бессмысленными (например, скорость 2 вытяжки бессмысленна
без скорости 1) — это **одно** устройство с `mode`, а не `multi_id`
с тремя `switch`.

Обратная ситуация — **несколько разных объектов одного вида внутри
одного корпуса**. Например, пульт: четыре кнопки — это четыре
устройства, а не одно устройство с четырьмя `event/button`.
Идентификатором свойства служит пара `type` + `instance`, поэтому
четыре независимые кнопки в одном описании получили бы четыре
свойства с **одинаковым** `instance` и слились бы в одно: различить
их в интерфейсе и в сценах нельзя, а `updateState` не сможет указать,
какое именно нажатие произошло. Разные `instance` у одного типа здесь
не помогут — они всё равно описывали бы разные *свойства*, а не
кнопки. Поэтому для кнопок нужен отдельный выход на каждое устройство,
то есть `multi_id`.

Совсем другое дело — `event/button` плюс `event/battery_level` на
одном устройстве. Это разные `instance`, поэтому так можно, и
`multi_id` не нужен.

### 13.6 Ловушки

1. **Тип канала может отличаться от типа родителя** — и это нормально.
   Клавиша света на корпусе `switch` — `switch`, слот тройника —
   `socket`, хотя физически это один Zigbee-девайс.
2. **Имя и комната.** Два устройства с одинаковым именем в одной
   комнате Алиса не различит. В шаблонах `TS0013` имена пустые —
   это нормально, пользователь переименует при привязке.
3. **Пустой `ya_rep` у канала = канала нет.** Недостаточно
   объявить `multi_id`: нужны `capabilities`/`properties`.
4. **`ya_rep: "none"` + `multi_id` вместе** — запись не разберётся,
   канал не создастся.
5. **Состояние канала не обновляется** (13.4, шаг 4). Для реле
   нормально, для датчиков — нет.
6. **Проверка значений** — та же, что в разделе 0: `state.value`
   должен лежать внутри заявленных `range`/`modes`/`events`,
   иначе Яндекс отклонит обнаружение целиком.
7. **Снятие `multi_id` возвращает канал в родителя** — устройство
   снова станет одним, с несколькими `capabilities` в одном списке.

### 13.7 Как поставить галочку в редакторе шаблонов

В окне редактирования `ya_rep` (`templateedit.js`):

| Элемент | ID | Действие |
|---------|-----|----------|
| Галочка разделения | `te_yre_multi` | создаёт `multi_id` с типом по умолчанию `devices.types.other` |
| Имя канала | `te_yre_mname` | `multi_id.name` |
| Комната | `te_yre_mroom` | `multi_id.room` |
| Тип | `te_yre_mtype` | `multi_id.type` |

Порядок работы:

1. Открыть запись отчёта устройства.
2. Включить `te_yre_multi` — появится блок `te_yre_multi_fields`.
3. Заполнить имя, комнату, тип.
4. Выбрать умение или свойство — `multi_id` при смене шаблона
   сохраняется автоматически (`templateedit.js:1925`, `:1955`).
5. Снять галочку, чтобы вернуть канал в состав родителя.

### 13.8 Реальные примеры из `Devtemplates`

`TS0012` — двухклавишник, оба отчёта разделены, родителя в Яндексе нет:

```
0100060000  ya_rep: on_off           + multi_id{name:"свет большой",  type: switch}
0200060000  ya_rep: on_off           + multi_id{name:"свет малый",   type: other}
```

`TS0044` — четырёхкнопочный пульт, свойство вместо умения:

```
0100060000  ya_rep: event/button     + multi_id{name:"кнопка1",  type: other}
0200060000  ya_rep: event/button     + multi_id{name:"",         type: sensor}
0300060000  ya_rep: event/button     + multi_id{name:"кнопка3",  type: sensor}
0400060000  ya_rep: event/button     + multi_id{name:"кнопка4",  type: sensor}
```

`Zesp_CookerHood` — вытяжка, у которой видны только скорости:

```
0100060000  label=Скорость1  on_off      + multi_id{name:"Скорость1",         type: switch}
0200060000  label=Скорость2  on_off      + multi_id{name:"Скорость2",         type: switch}
0300060000  label=Скорость3  on_off      + multi_id{name:"вытяжка скорость3", type: other}
0400060000  label=Подсветка  ya_rep=none
0500060000  label=Сирена      ya_rep=none
```

Результат: **сама вытяжка в Яндексе не появляется**. Все пять отчётов
либо разделены, либо скрыты, поэтому родитель пуст и отсечён
`isEmptyYaDevice`. В Яндексе видны ровно три устройства — по
`switch` на скорость. Тип `devices.types.cooking`, заданный в
шаблоне, не используется.

`Drivent` — шторы, `multi_id` не применяется:

```
0100060000  label=open_close  on_off/on        ← в Яндексе
0100080000  label=Target      range/open       ← в Яндексе
0200060000  label=alarm       ya_rep=none
0200080000  label=Curent      ya_rep=none
0300060000  label=wifi        ya_rep=none
```

Результат: одно устройство `openable` с `on_off` и `range/open`.
Открытие/закрытие и положение — части одного смысла, разделять
нечего.

`TS011F` — реле с замерами, тоже без `multi_id`:

```
0100060000  label=On_Off      ya_rep=none      ← само реле скрыто
0104020000  label=Temperature ya_rep=none
010B040505  label=Voltage     float/voltage
010B040508  label=Curent      float/amperage
010B04050B  label=Power       float/power
```

Результат: одно устройство с тремя `float`-свойствами и **без**
`on_off` — управлять им из Яндекса нельзя, только читать замеры.
Пример того, как `none` убирает лишнее, не раздувая устройство
пустыми умениями.

### 13.9 Чек-лист для `multi_id`

1. Канал действительно независим от остальных (13.5).
2. У канала непустые `capabilities`/`properties`.
3. `multi_id.type` — полное имя `devices.types.*`, не `switch`.
4. `multi_id.name` уникален в пределах комнаты.
5. Учтено, что состояние канала не обновляется через `updateState`.
6. Проверено, не разделяется ли то, что должно быть одним
   устройством (климат, яркость+цвет, реле с замерами).

---

## 14. Как `ya_rep` попадает в устройство

Два пути:

1. **Явный `ya_rep`** — приоритетный. JSON разбирается как есть,
   в `state.value` подставляется текущее значение из `parsed`
   отчёта. Значения вне заявленных диапазонов клампит `clampToRange`,
   а для `mode/thermostat` подменяется первым допустимым.
2. **Автозапасной путь** — если `ya_rep` пуст, тип и умения выводятся
   из `role` и `device_class`:
   - `sensor` / `binary_sensor` → свойство по `device_class`
     (`addSensorProp`) и тип (`yandexSensorType`);
   - `light_onoff` / `light_level` / `light_color` / `light_color_temp`
     → `light` + `on_off` / `range brightness` / `color_setting`
     (кластеры `0006`, `0008`, `0300`);
   - `switch` / `socket` → `switch` / `socket` + `on_off`.

Записи с `ya_rep = "none"` полностью скрыты от Яндекса; устройство,
у которого скрыты все записи, в список не попадает.

---

## 15. Обратное направление: команда из Яндекса в Zigbee

`capToCmd` (`hubws.go`) переводит команду в объект устройства:

| Умение / instance | Команда ZESP |
|-------------------|--------------|
| `on_off`, `toggle/*` | `on_off` |
| `range/brightness`, `range/volume` | `level` |
| `range/temperature` | `climate_temp` |
| `range/open` | `cover_pos` |
| `range/channel` | `select` |
| `color_setting/temperature_k` | `color_temp` |
| `color_setting` (остальное) | `color` |
| `mode/thermostat` | `climate_mode` |
| `mode/fan_speed`, `mode/work_speed` | `fan_speed` |
| `mode/*` (остальное) | `select` |

Ключ отчёта ищется сначала по совпадению `instance` в `ya_rep`
(`findReportKey`), затем по кластеру:

| Умение | Кластер / атрибут |
|--------|------------------|
| `on_off` | `0006` |
| `range/brightness` | `0008` |
| `range/temperature` | `0201` |
| `mode/thermostat` | `0201` |
| `color_setting/hsv` | `0300`, атрибут `0000` |
| `color_setting/temperature_k` | `0300`, атрибут `0007` |

Практический вывод для новых шаблонов: если устройство должно
управляться из Яндекса, а не только показывать состояние, запись
`ya_rep` обязана содержать `state.instance` (или `parameters.instance`),
иначе команда уйдёт не туда.

---

## 16. Особые случаи преобразования значений

| Источник | Преобразование | Где в коде |
|----------|----------------|------------|
| ZCL Level `0008` (0–255) | → проценты 1–100 | `addLightCap` |
| Мириды `0300` (mired) | → Кельвины `1000000 / mired`, кламп 1000–6500 | `addLightCap` |
| `#rrggbb` | → HSV `{h, s, v}` | `addLightCap` |
| ZCL `0201` режим (0/1/3/4) | → `off` / `auto` / `cool` / `heat`, затем подмена на первый из `modes` | `zesp2ya` |
| `on_off` значение | `1`, `true`, `on`, `ON`, `01` → `true` | `isOn` |

---

## 17. Ссылки на документацию

- Типы устройств: <https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/device-types>
- Умения: <https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/capability-types>
- Свойства: <https://yandex.ru/dev/dialogs/smart-home/doc/ru/concepts/properties-types>
- `on_off`: `/concepts/on_off`, `range`: `/concepts/range`,
  `mode`: `/concepts/mode`, `toggle`: `/concepts/toggle`,
  `color_setting`: `/concepts/color_setting`
- Списки функций: `/concepts/range-instance`, `/concepts/mode-instance`,
  `/concepts/mode-instance-modes`, `/concepts/toggle-instance`,
  `/concepts/float-instance`, `/concepts/event-instance`
- Объект устройства: `/concepts/platform-user-info` (раздел `DeviceObject`)
- Тестирование навыка: <https://dialogs.yandex.ru/developer/> → «Тестирование»
