# voice — голосовые сервисы ZESP (TTS/ASR)

Ставит на ПК (Windows или Linux) выбранные движки и общий анонсер, чтобы ZESP
нашёл их в окне **Кластер → Сервисы**. Пароль кластера не нужен: сервис
публикуется без подписи и принимается ZESP как «без подписи».

## Что внутри

| Файл | Назначение |
|---|---|
| `install.ps1` / `install.sh` | инсталлятор: выбор движков, venv, модели, автозапуск |
| `packages/*.json` | рецепты движков: pip-пакеты, модели, порты, переменные окружения |
| `speech_common.py` | общий HTTP (OpenAI API), декодирование аудио и **нормализация** |
| `gigaam_server.py` | GigaAM v3 (ONNX, RU) → `/v1/audio/transcriptions` |
| `vosk_server.py` | Vosk (RU, CPU, лёгкий) |
| `tone_server.py` | T-one (RU, телефония; Windows/Linux, beam + KenLM на Python 3.11) |
| `vad_server.py` | Silero VAD (sherpa-onnx): TCP `18093 → 18193`, отвечает `E`/`N` |
| `earshot_vad_server.py` | Earshot VAD (Rust, без модели): TCP `18094 → 18194`, тот же протокол |
| `silero_server.py` | Silero TTS v5 (RU) → `/v1/audio/speech` |
| `announce.py` | прокси в LAN, манифест `/manifest.json`, mDNS `_zesp-svc._tcp` |
| `gen_services.py` | собирает `services.json` из выбранных пакетов |
| `services.json` | шаблон конфига анонсера (рабочий генерируется при установке) |

## Быстрый старт

Сам `desktop/install/voice` — **дистрибутив** (едет в git): серверы, пакеты,
установщик. Сюда ничего не ставится. Инсталлятор спрашивает папку и кладёт
рабочие файлы, venv и модели в неё.

Windows (PowerShell):

```powershell
cd desktop\install\voice
.\install.ps1
```

Linux:

```bash
cd desktop/install/voice
./install.sh
```

Инсталлятор спросит:

1. **Куда установить** (Enter — `%LOCALAPPDATA%\ZESP\voice` / `~/zesp-voice`);
2. какие движки поставить — **меню с галочками** (на Windows): `↑`/`↓` —
   движение, `Space` — отметить, `Enter` — установить, `A` — все, `N` — снять
   все, `Esc` — выход. На Linux — номера через запятую.

Дальше создаст venv, скачает модели, сгенерирует `services.json` и настроит
автозапуск. Папку можно задать сразу: `.\install.ps1 -Dir D:\ZESP\voice` или
`DIR=/srv/zesp-voice ./install.sh`.

Всё нужное для выбранных движков ставится само:

- **Python 3.11 для T-one** — если его нет, инсталлятор поставит его через
  `winget` (Windows) или `apt-get` (Linux). На Windows установка изолированная:
  `PrependPath=0`, `Include_launcher=0`, `InstallAllUsers=0` — PATH и системный
  Python не меняются, `py`-лаунчер не трогается;
- модели Vosk, Silero, Silero VAD и T-one (`model.onnx` + `kenlm.bin` 5,1 ГБ);
- отдельный `venv311` для T-one — KenLM не собирается на Python 3.13;
- `opus.dll` рядом с серверами (нужен `opuslib`);
- перед T-one проверяется свободное место (~5,5 ГБ).

Если интерактивный терминал недоступен, набор задаётся явно:
`.\install.ps1 -Packages gigaam,vosk,tone`. Флаг `-Yes` ставит набор по
умолчанию без вопросов.

После установки ZESP должен увидеть провайдера в «Кластер → Сервисы» в течение
~10 секунд. Если mDNS не проходит — в карточке сервиса есть адрес манифеста,
его можно добавить вручную (политика помнит URL).

Инсталлятор в конце сам проверяет `http://127.0.0.1:8099/manifest.json` и печатает
состояние каждого сервиса (`running`/`down`). Логи — в `<папка>/logs/`.

## Звук с колонки

Колонка присылает **Ogg/Opus чанками** (несколько `OpusHead`, pre-roll + речь).
`speech_common.py` разбирает Ogg по страницам и декодирует Opus **по пакетам
через `opuslib`** — так chained-связи не теряются; затем `soxr` в нужную частоту.
PyAV остался fallback-ом. `announce.py` не конвертирует Ogg→WAV перед ASR
(`ASR_CONVERT_OGG=0`): конвертация теряла связи и обнуляла усиление.
Системный `ffmpeg` не нужен ни для ASR, ни для TTS.

Записи с колонки бывают очень тихими (пик ~0,003, −50 дБ), поэтому уровень
выравнивается:

| Переменная | По умолчанию | Смысл |
|---|---|---|
| `VOSK_BOOST` | `5` | усиление после opuslib для Vosk |
| `TONE_GAIN` | `2.5` | доп. усиление T-one поверх нормализации пика до 0,9 |
| `TONE_DECODER` | `beam` | `greedy` — без KenLM (хуже качество) |
| `ASR_CONVERT_OGG` | `0` | `1` — старое поведение: Ogg→WAV в анонсере |
| `ASR_NORMALIZE` | `0` | общая нормализация `decode_audio` (GigaAM) |
| `ASR_TARGET_DBFS` | `-20` | целевой RMS при `ASR_NORMALIZE=1` |
| `ASR_MAX_GAIN_DB` | `20` | потолок усиления тихого сигнала |

## Добавить движок

1. Положить сервер `<id>_server.py` рядом с `speech_common.py` (использовать
   `common.asr_app` или `common.tts_app`).
2. Добавить `packages/<id>.json` с полями `kind`, `port`, `publicPort`,
   `server`, `install.pip`, `env`.
3. Перезапустить инсталлятор.

Порты: сервисы слушают `127.0.0.1:50xx`, анонсер публикует `0.0.0.0:60xx`;
номера не важны для ZESP — он берёт `url` из манифеста.
