"""GigaAM v3 (Сбер): OpenAI Audio API /v1/audio/transcriptions на onnx-asr.

Вариант модели задаёт ASR_MODEL_VARIANT: e2e-rnnt (с пунктуацией и нормализацией чисел, по умолчанию),
e2e-ctc, rnnt, ctc. Остальное окружение — tools/onnx_asr_server.py.
"""
import os

import onnx_asr_server

if __name__ == "__main__":
    variant = os.environ.get("ASR_MODEL_VARIANT", "").strip() or "e2e-rnnt"
    onnx_asr_server.main("gigaam-v3-" + variant, "GigaAM v3", 5015)
