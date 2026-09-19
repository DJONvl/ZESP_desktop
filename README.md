# ZESP

Веб-интерфейс умного дома ZESP: устройства, карта Zigbee, Blockly-автоматизация, сцены, 3D-план дома, Яндекс-колонки, настройки.

## Установка

### Linux / OpenWrt — одна строка

```sh
wget https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
```

Поставит последний релиз в `/opt/zesp` (бинарь как `zesp`, фронт рядом), под рутом добавит systemd-юнит. Из-под юзера ставится в `~/zesp`. Подробнее и особые случаи — [install/install.sh](install/install.sh).

### Windows

Скачай [`install/install.bat`](install/install.bat) и запусти — последний релиз распакуется в `C:\ZESP`, на рабочем столе появится ярлык ZESP.

### Вручную

1. Забери архив под свою платформу со страницы [Releases](https://github.com/DJONvl/ZESP_desktop/releases) (`zesp_windows_x64.zip`, `zesp_linux_armv7l.tar.gz` и т.д.).
2. Распакуй: внутри бинарь + папка `desktop/` (+ `zesp_start.bat` на Windows).
3. Запусти: на Windows — **через `zesp_start.bat`** (супервизор: сам перезапускает сервер и применяет обновления), на Linux — `./zesp`.
4. Открой `http://<ip>:8081`. Порты: `8081` — веб, `8181` — WebSocket.

При первом старте недостающие конфиги создаются сами из шаблонов (`.tpl`).

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
