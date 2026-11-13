"""Собирает services.json для announce.py из выбранных пакетов.

Использование: python gen_services.py gigaam vosk silero > services.json
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = json.loads((HERE / "services.json").read_text(encoding="utf-8"))

VOICE_LABELS = {
    "aidar": {"label": "Айдар", "gender": "m", "lang": "ru"},
    "baya": {"label": "Бая", "gender": "f", "lang": "ru"},
    "kseniya": {"label": "Ксения", "gender": "f", "lang": "ru"},
    "xenia": {"label": "Ксения", "gender": "f", "lang": "ru"},
    "eugene": {"label": "Юджин", "gender": "m", "lang": "ru"},
}


def service(pkg):
    kind = pkg["kind"]
    if kind == "vad":
        port = int(pkg["port"])
        return {
            "id": pkg["id"],
            "kind": "vad",
            "adapter": "tcp",
            "healthMode": "tcp",
            "healthUrl": "tcp:127.0.0.1:%d" % port,
            "target": "127.0.0.1:%d" % port,
            "listen": {"host": "0.0.0.0", "port": int(pkg["publicPort"])},
            "priority": 10,
        }
    svc = {
        "id": pkg["id"],
        "kind": kind,
        "adapter": "openai",
        "healthUrl": "http://127.0.0.1:%d/health" % int(pkg["port"]),
        "target": "127.0.0.1:%d" % int(pkg["port"]),
        "listen": {"host": "0.0.0.0", "port": int(pkg["publicPort"])},
        "path": "/v1/audio/speech" if kind == "tts" else "/v1/audio/transcriptions",
        "priority": 10,
        "httpMode": "tts" if kind == "tts" else "asr",
    }
    if kind == "tts":
        svc["sampleRate"] = 24000
        if pkg["id"] == "silero":
            svc["voiceLabels"] = VOICE_LABELS
    return svc


def main():
    argv = sys.argv[1:]
    out = None
    if "--out" in argv:
        pos = argv.index("--out")
        if pos + 1 >= len(argv):
            raise SystemExit("--out требует путь")
        out = argv[pos + 1]
        argv = argv[:pos] + argv[pos + 2:]
    ids = argv
    if not ids:
        raise SystemExit("укажите id пакетов: gigaam vosk silero")
    services = []
    for sid in ids:
        path = HERE / "packages" / (sid + ".json")
        if not path.is_file():
            raise SystemExit("нет пакета " + sid)
        services.append(service(json.loads(path.read_text(encoding="utf-8"))))
    BASE["services"] = services
    text = json.dumps(BASE, ensure_ascii=False, indent=2) + "\n"
    if out:
        Path(out).write_text(text, encoding="utf-8")
    else:
        sys.stdout.write(text)


if __name__ == "__main__":
    main()
