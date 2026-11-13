"""T-one (Т-Банк / T-Software): OpenAI Audio API /v1/audio/transcriptions.

Модель streaming CTC для русского, оптимизирована под телефонию. Официальный
пакет: https://github.com/voicekit-team/T-one (Apache 2.0). На Windows KenLM
не собирается — используйте Docker/WSL или Linux.

Окружение:
  TONE_MODEL    имя модели для /health (по умолчанию t-one)
  TONE_DEVICE   cpu | cuda (информационно; выбор устройства — внутри пакета)
  TONE_WORKERS  параллельных запросов
  PORT          порт (по умолчанию 5022)
"""
import os
import sys

import numpy as np

import speech_common as common

# Исходники T-one (zip с GitHub) лежат рядом: engines/T-one-main.
TONE_DIR = os.environ.get("TONE_DIR", "")
if TONE_DIR and TONE_DIR not in sys.path:
    sys.path.insert(0, TONE_DIR)

RATE = 16000      # decode_audio отдаёт 16 кГц
TONE_RATE = 8000  # T-one обучена на 8 кГц (телефония)


class Engine:
    def __init__(self, pipeline):
        self.pipeline = pipeline
        self.name = common.env("TONE_MODEL", "t-one")

    def transcribe(self, samples, language=None):
        x = np.asarray(samples, dtype=np.float32).reshape(-1)
        if RATE != TONE_RATE and x.size:
            import soxr
            x = soxr.resample(x, RATE, TONE_RATE)
        # T-one не нормализует вход, а с колонки звук приходит очень тихим
        # (пик ~0.003, −50 дБ) — без выравнивания уровня модель галлюцинирует.
        peak = float(np.max(np.abs(x))) if x.size else 0.0
        if peak > 1e-6:
            x = x / peak * 0.9
        # Дополнительное усиление поверх нормализации (TONE_GAIN, по умолчанию
        # 2.5): на записях с колонки модель точнее ловит начало фразы, клиппинг
        # здесь работает как грубый AGC. Проверено на дампе: gain 2.5 →
        # «алиса выключи свет в за» против «лиса выключи свет за» при 1.0.
        gain = common.env_float("TONE_GAIN", 2.5)
        if gain != 1.0:
            x = np.clip(x * gain, -1.0, 1.0)
        # T-one ждёт PCM int32 (-32768..32767), не float.
        pcm = (np.clip(x, -1.0, 1.0) * 32767.0).astype(np.int32)
        result = self.pipeline.forward_offline(pcm)
        if isinstance(result, str):
            return result.strip()
        return " ".join(getattr(part, "text", "") for part in result).strip()

    def info(self):
        return {"engine": "t-one", "model": self.name, "device": common.env("TONE_DEVICE", "cpu"),
                "voice": "", "state": {"model_loaded": True}}


def load_pipeline():
    print("Загрузка T-one", flush=True)
    from tone import StreamingCTCPipeline
    from tone.decoder import DecoderType

    # BEAM_SEARCH требует kenlm (Python 3.11 venv); GREEDY — где kenlm нет.
    kind = os.environ.get("TONE_DECODER", "greedy").strip().lower()
    decoder = DecoderType.BEAM_SEARCH if kind == "beam" else DecoderType.GREEDY
    # TONE_LOCAL_DIR — папка с model.onnx + kenlm.bin (не тянем 5 ГБ из HF повторно).
    local = os.environ.get("TONE_LOCAL_DIR", "").strip()
    if local:
        return StreamingCTCPipeline.from_local(local, decoder_type=decoder)
    return StreamingCTCPipeline.from_hugging_face(decoder_type=decoder)


def build_app(engine):
    return common.asr_app(engine.transcribe, engine.info, capacity=common.env_int("TONE_WORKERS", 1),
                          decode=lambda data: common.decode_opus_boost(data, boost=1.0))


if __name__ == "__main__":
    common.run(lambda: build_app(Engine(load_pipeline())), common.env_int("PORT", 5022), "T-one")
