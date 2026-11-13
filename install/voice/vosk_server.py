"""Vosk (Kaldi): OpenAI Audio API /v1/audio/transcriptions на процессоре.

Формат запросов и ответов — tools/speech_common.py. Окружение (пакет voice_stack/packages/vosk.json):
  VOSK_MODEL_DIR  папка распакованной модели (vosk-model-small-ru-0.22, vosk-model-ru-0.42)
  VOSK_MODEL      её имя — для /health          VOSK_WORKERS  параллельных запросов
Модель выдаёт текст строчными буквами без знаков препинания.
"""
import json

import numpy as np

import speech_common as common

RATE = 16000
CHUNK = RATE * 2 * 4  # 4 секунды звука за вызов AcceptWaveform


class Engine:
    def __init__(self, model, recognizer_class):
        self.model = model
        self.recognizer_class = recognizer_class
        self.name = common.env("VOSK_MODEL", "vosk")

    def transcribe(self, samples, language=None):
        recognizer = self.recognizer_class(self.model, RATE)
        pcm = (np.clip(samples, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
        parts = []
        for position in range(0, len(pcm), CHUNK):
            if recognizer.AcceptWaveform(pcm[position:position + CHUNK]):
                parts.append(json.loads(recognizer.Result()).get("text", ""))
        parts.append(json.loads(recognizer.FinalResult()).get("text", ""))
        return " ".join(part for part in parts if part)

    def info(self):
        return {"engine": "vosk", "model": self.name, "device": "cpu", "voice": "",
                "state": {"model_loaded": True}}


def load_model():
    from vosk import KaldiRecognizer, Model, SetLogLevel
    SetLogLevel(-1)
    path = common.env("VOSK_MODEL_DIR")
    print("Загрузка модели", path, flush=True)
    try:
        return Engine(Model(path), KaldiRecognizer)
    except Exception as exc:  # noqa: BLE001 — vosk бросает общее Exception на отсутствующую папку
        raise SystemExit("Модель Vosk не загрузилась из " + path + ": переустановите пакет") from exc


def build_app(engine):
    return common.asr_app(engine.transcribe, engine.info, capacity=common.env_int("VOSK_WORKERS", 2),
                          decode=common.decode_opus_boost)


if __name__ == "__main__":
    common.run(lambda: build_app(load_model()), 5018, "Vosk")
