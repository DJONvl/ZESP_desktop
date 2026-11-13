"""Распознавание речи на onnx-asr (GigaAM, Parakeet и др.): OpenAI Audio API /v1/audio/transcriptions.

Общая основа gigaam_server.py и parakeet_server.py; формат запросов и ответов — tools/speech_common.py.
Окружение (задаёт пакет voice_stack/packages/<id>.json):
  ASR_MODEL      имя модели onnx-asr (gigaam-v3-e2e-rnnt, nemo-parakeet-tdt-0.6b-v3, …)
  ASR_MODEL_DIR  папка с файлами модели (скачиваются при установке пакета)
  ASR_VAD_DIR    папка с Silero VAD: им режутся записи длиннее ~25 с (модели принимают до 20–30 с)
  ASR_DEVICE     cpu | cuda            ASR_QUANT   auto | int8 | fp32 (auto: int8 на процессоре, fp32 на видеокарте)
  ASR_THREADS    потоков процессора    ASR_WORKERS параллельных запросов
  CUDA_VISIBLE_DEVICES                 какая видеокарта видна процессу
"""
import speech_common as common

RATE = 16000
LONG_SECONDS = 25.0


def resolve_quantization(value, device):
    """auto → int8 на процессоре, без квантования на видеокарте; fp32 → None (веса как есть)."""
    value = (value or "auto").lower()
    if value == "auto":
        return None if device == "cuda" else "int8"
    return None if value in ("fp32", "none") else value


class Engine:
    def __init__(self, load_model, load_vad):
        self.name = common.env("ASR_MODEL")
        self.device = common.env("ASR_DEVICE", "cpu")
        self.quantization = resolve_quantization(common.env("ASR_QUANT", "auto"), self.device)
        self.model = load_model(self.name, self.device, self.quantization)
        vad_dir = common.env("ASR_VAD_DIR")
        self.long = self.model.with_vad(load_vad(vad_dir), max_speech_duration_s=20.0) if vad_dir else None

    def transcribe(self, samples, language=None):
        if self.long is None or len(samples) <= LONG_SECONDS * RATE:
            return str(self.model.recognize(samples, sample_rate=RATE))
        return " ".join(part.text.strip() for part in self.long.recognize(samples, sample_rate=RATE) if part.text.strip())

    def info(self):
        return {"engine": "onnx-asr", "model": self.name, "device": self.device,
                "quantization": self.quantization or "fp32", "voice": "",
                "state": {"model_loaded": True, "long_audio": self.long is not None}}


def real_loaders():
    """Загрузчики onnx-asr (тяжёлый импорт — только в рабочем процессе, не в тестах)."""
    import onnx_asr
    import onnxruntime

    def load_model(name, device, quantization):
        providers = ["CPUExecutionProvider"]
        if device == "cuda":
            common.preload_cuda_libs()
            try:
                onnxruntime.preload_dlls()
            except Exception:  # noqa: BLE001 — старые сборки без preload_dlls
                pass
            if "CUDAExecutionProvider" not in onnxruntime.get_available_providers():
                raise SystemExit("CUDA недоступна: нет видеокарты NVIDIA или установлен onnxruntime без CUDA")
            providers.insert(0, "CUDAExecutionProvider")
        options = onnxruntime.SessionOptions()
        threads = common.env_int("ASR_THREADS", 0)
        if threads > 0:
            options.intra_op_num_threads = threads
        print("Загрузка модели", name, device, quantization or "fp32", flush=True)
        return onnx_asr.load_model(name, common.env("ASR_MODEL_DIR") or None, quantization=quantization,
                                   sess_options=options, providers=providers)

    def load_vad(path):
        return onnx_asr.load_vad("silero", path)

    return load_model, load_vad


def build_app(engine):
    return common.asr_app(engine.transcribe, engine.info, capacity=common.env_int("ASR_WORKERS", 1))


def main(default_model, title, default_port):
    import os
    os.environ.setdefault("ASR_MODEL", default_model)
    load_model, load_vad = real_loaders()
    common.run(lambda: build_app(Engine(load_model, load_vad)), default_port, title)
