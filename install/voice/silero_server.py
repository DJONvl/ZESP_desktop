"""Silero TTS v5 (русский): OpenAI Speech API /v1/audio/speech, float32 PCM потоком по предложениям.

Формат запросов и ответов — tools/speech_common.py. Окружение (пакет voice_stack/packages/silero.json):
  SILERO_MODEL_PATH  файл модели v5_*_ru.pt (скачивается при установке пакета)
  SILERO_VOICE       голос по умолчанию (aidar, baya, kseniya, xenia, eugene); запрос может указать другой
  SILERO_RATE        частота синтеза: 8000 | 24000 | 48000
  SILERO_ACCENT      1 — автоматически ставить ударения      SILERO_YO  1 — восстанавливать «ё»
  SILERO_DEVICE      cpu | cuda    SILERO_THREADS  потоков процессора    SILERO_WORKERS  параллельных запросов
  CUDA_VISIBLE_DEVICES             какая видеокарта видна процессу
"""
import re

import numpy as np

import speech_common as common

SENTENCE_LIMIT = 350  # символов в одном вызове модели: более длинный текст она не принимает
SPLIT = re.compile(r"(?<=[.!?…])\s+|\n+")
SPEAKERS = ("aidar", "baya", "kseniya", "xenia", "eugene")


def split_text(text, limit=SENTENCE_LIMIT):
    """Текст → предложения не длиннее limit (длинные режутся по запятым и пробелам)."""
    parts = []
    for sentence in SPLIT.split(text):
        sentence = sentence.strip()
        while len(sentence) > limit:
            cut = max(sentence.rfind(mark, 0, limit) for mark in (", ", "; ", ": ", " "))
            cut = cut if cut > limit // 3 else limit
            parts.append(sentence[:cut + 1].strip())
            sentence = sentence[cut + 1:].strip()
        if sentence:
            parts.append(sentence)
    return parts


class Engine:
    def __init__(self, model, device="cpu"):
        self.model = model
        self.device = device
        self.speakers = list(getattr(model, "speakers", None) or SPEAKERS)
        self.voice = common.env("SILERO_VOICE", "xenia")
        if self.voice not in self.speakers:
            raise common.UserError("Голос «%s» не поддерживается моделью: %s" % (self.voice, ", ".join(self.speakers)))
        self.rate = common.env_int("SILERO_RATE", 24000)
        if self.rate not in (8000, 24000, 48000):
            raise common.UserError("SILERO_RATE: 8000, 24000 или 48000")
        self.accent = common.env_flag("SILERO_ACCENT", True)
        self.yo = common.env_flag("SILERO_YO", True)

    def pick(self, voice):
        voice = voice or self.voice
        if voice not in self.speakers:
            raise common.UserError("Неизвестный голос «%s». Доступны: %s" % (voice, ", ".join(self.speakers)))
        return voice

    def sentence(self, text, voice):
        audio = self.model.apply_tts(text=text, speaker=voice, sample_rate=self.rate,
                                     put_accent=self.accent, put_yo=self.yo)
        if hasattr(audio, "detach"):
            audio = audio.detach().cpu().numpy()
        return np.asarray(audio, dtype=np.float32).reshape(-1)

    def stream(self, text, voice=None):
        voice = self.pick(voice)
        for sentence in split_text(text):
            yield self.sentence(sentence, voice)

    def synth(self, text, voice=None):
        chunks = list(self.stream(text, voice))
        return np.concatenate(chunks) if chunks else np.zeros(0, dtype=np.float32)

    def info(self):
        return {"engine": "silero", "model": common.env("SILERO_MODEL", "silero-v5-ru"), "device": self.device,
                "voice": self.voice, "voices": self.speakers,
                "state": {"model_loaded": True, "voice_mode": "preset", "accent": self.accent, "yo": self.yo}}


def load_engine():
    import torch
    device = common.env("SILERO_DEVICE", "cpu")
    if device == "cuda" and not torch.cuda.is_available():
        raise SystemExit("CUDA недоступна: нет видеокарты NVIDIA или установлен PyTorch без CUDA")
    threads = common.env_int("SILERO_THREADS", 0)
    if threads > 0:
        torch.set_num_threads(threads)
    path = common.env("SILERO_MODEL_PATH")
    print("Загрузка модели", path, device, flush=True)
    model = torch.package.PackageImporter(path).load_pickle("tts_models", "model")
    model.to(torch.device("cuda" if device == "cuda" else "cpu"))
    return Engine(model, device)


def build_app(engine):
    return common.tts_app(engine.synth, engine.rate, engine.info, stream=engine.stream,
                          capacity=common.env_int("SILERO_WORKERS", 1))


if __name__ == "__main__":
    common.run(lambda: build_app(load_engine()), 5019, "Silero")
