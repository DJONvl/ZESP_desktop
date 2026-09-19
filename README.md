# ZESP

Сервер умного дома с веб-интерфейсом: Zigbee-координатор, устройства, карта сети, Blockly-автоматизация, сцены, 3D-план дома, MQTT + Home Assistant, Яндекс-колонки.

## Что нужно

* **Железо**: роутер с OpenWrt, Raspberry Pi, мини-ПК, Windows-ПК или Mac.
* **Zigbee-адаптер** (один из): ZiGate, ZBoss (Nordic), TI Z-Stack (CC2530/CC2531/CC2652 — режим `znp`), EmberZNet/EZSP (EFR32, SkyConnect, Sonoff ZBDongle-E), Telink. Можно и без адаптера — тогда только колонки/сцены/автоматизация.
* Остальное опционально: MQTT-брокер, аккаунт Яндекса (колонки), Telegram-бот.

## Какой архив качать

Со страницы [Releases](https://github.com/DJONvl/ZESP_desktop/releases):

| У тебя | Файл |
|---|---|
| Windows 64-bit | `zesp_windows_x64.zip` |
| Windows 32-bit | `zesp_windows_x86.zip` |
| Linux ПК (x64) | `zesp_linux_amd64.tar.gz` |
| Raspberry Pi 4/5, ARM64 | `zesp_linux_arm64.tar.gz` |
| Raspberry Pi 2/3, ARMv7 | `zesp_linux_armv7l.tar.gz` |
| Роутер OpenWrt | ставь скриптом ниже (сам выберет) |
| macOS Intel / Apple Silicon | `zesp_darwin_amd64` / `zesp_darwin_arm64.tar.gz` |

## Установка

### Linux / OpenWrt — выбери свою строку

**Обычная система** (есть wget/curl):

```sh
wget https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
```

**Голый OpenWrt** (wget без https) — любой из двух:

```sh
uclient-fetch -O install.sh https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
```

```sh
printf 'GET /DJONvl/ZESP_desktop/master/install/install.sh HTTP/1.0\r\nHost: raw.githubusercontent.com\r\nConnection: close\r\n\r\n' | openssl s_client -quiet -connect raw.githubusercontent.com:443 -servername raw.githubusercontent.com 2>/dev/null | sed '1,/^\r$/d' > install.sh
grep -q '^REPO=' install.sh && sh install.sh || echo DOWNLOAD FAILED
```

(второй — через `openssl` как TLS-трубу, если он есть, а качалок нет; заметь `| sh`, не `| bash` — bash'а на OpenWrt нет. Вставлять строго одной строкой: разорванная вставка — главная причина молчаливых fails. Проверка `grep` не даст запустить пустой файл)

**Совсем нет качалок** — закинь два файла с ПК в `/tmp` железки (по scp/WinSCP) и запусти офлайн:

```sh
LOCAL_TGZ=/tmp/zesp.tgz sh install.sh
```

Нужны: сам `install.sh` (папка [`install/`](install/) этого репо) + архив под твою архитектуру из таблицы выше. Живой `opkg`, но нет качалок — сначала `opkg update && opkg install curl`, дальше способ 1.

Нет `wget` с https (голый OpenWrt) — так:

```sh
uclient-fetch -O install.sh https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
```

Поставит последний релиз в `/opt/zesp` (бинарь как `zesp`, фронт рядом), под рутом добавит systemd-юнит. Из-под юзера ставится в `~/zesp`. Подробнее и особые случаи — [install/install.sh](install/install.sh).

### Windows

Скачай [`install/install.bat`](install/install.bat) и запусти — последний релиз распакуется в `C:\ZESP`, на рабочем столе появится ярлык ZESP.

### Вручную

1. Забери архив под свою платформу (таблица выше).
2. Распакуй: внутри бинарь + папка `desktop/` (+ `zesp_start.bat` на Windows).
3. Запусти: на Windows — **через `zesp_start.bat`** (супервизор: сам перезапускает сервер и применяет обновления), на Linux — `./zesp`.
4. Открой `http://<ip>:8081`. Порты: `8081` — веб, `8181` — WebSocket.

При первом старте недостающие конфиги создаются сами из шаблонов (`.tpl`).

## Первый запуск (5 минут)

1. Открой вебморду: `http://<ip-железки>:8081`.
2. Настройки → **ZIGBEE**: выбери свой адаптер (Adapter), укажи порт (Transport: `COMx` на Windows, `/dev/tty*` на Linux, `host:ip:port` для сетевого). Остальное (скорость, канал, PanID) — по умолчанию. Сохрани. Смена адаптера требует рестарта.
3. В списке устройств найди **Coordinator** → включи **PermitJoin**.
4. Переведи Zigbee-устройство в режим спаривания (обычно долгое нажатие кнопки) — оно появится в списке. Дай имя и комнату.
5. Дальше по вкусу: сцены, Blockly-автоматизация, MQTT/Home Assistant, Яндекс-колонки — всё в настройках.

## Обновления

Сервер проверяет [Releases](https://github.com/DJONvl/ZESP_desktop/releases) сам: кнопка «Обновление» в настройках (APP) скачивает архив под твою платформу, меняет бинарь (старый остаётся как `.old`) и фронт, потом просит рестарт. Настройки и устройства при этом не трогаются.

## Структура

```
desktop_lite/apps/   виджеты: devicemanager, devices, zigbeemap, blockly,
                     scenes, sh3d, templateedit, settings, yammanager
desktop_lite/js/     движок окон, сокеты, локализация
static/              библиотеки (blockly, sweet-home-3d, виджеты, иконки)
Devtemplates/        общие шаблоны устройств
img/                 фото устройств
*.tpl                шаблоны: jsconfig.tpl, devicesjs.tpl, workspace.tpl
install/             скрипты установки (в релизные архивы НЕ пакуются)
```

## Персональные файлы (в git не входят)

`jsconfig.txt` (настройки+токены), `devicesjs.txt`, `Devices/`, `scenes.json`, `groups.json`, `location.json`, `workspace.xml` — живут только на твоей машине. Не коммить и не выкладывай: там токены.
