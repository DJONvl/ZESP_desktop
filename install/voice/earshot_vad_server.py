#!/usr/bin/env python3
"""Earshot VAD (pykeio/earshot) по TCP для ZESP: Ogg/Opus → 'E' / 'N'.

Earshot — streaming VAD на Rust (`pip install earshot`): кадры по 256 сэмплов
(16 мс) на 16 кГц, score 0..1. Модель и ONNX Runtime не нужны (~95 КБ).

Протокол тот же, что у `vad_server.py` (Silero): ZESP открывает TCP на каждый
диалог, пишет Ogg/Opus (начиная с OpusHead) и ждёт один байт: 'E' — речь была,
'N' — речи нет. Ogg/Opus декодирует PyAV.

Записи с колонки бывают очень тихими (пик ~0,003, −50 дБ), поэтому перед
детектором работает адаптивный AGC: пик запоминается с затуханием и сигнал
нормализуется к 0,9 (ограничение усиления — `VAD_MAX_GAIN`). Без него Earshot
не видит речь при пике −50 дБ.

Окружение:
  VAD_PORT       18094   порт
  VAD_AGC        1       0 — выключить адаптивное усиление
  VAD_MAX_GAIN   300     потолок усиления AGC
  VAD_AGC_DECAY  0.999   затухание запомненного пика на кадр
  VAD_GAIN       1       дополнительное усиление после AGC (tanh)
  VAD_THRESH     0.5     порог речи
  VAD_SILENCE    0.8     тишина после речи, с
  VAD_NOSPEECH   4.0     сколько ждать речь, с
"""
import os
import socketserver
import time

import numpy as np

RATE = 16000
FRAME = 256  # 16 мс при 16 кГц
MAX_SECONDS = 60.0

VAD_PORT = int(os.environ.get("VAD_PORT", "18094"))
VAD_AGC = os.environ.get("VAD_AGC", "1") not in ("0", "false", "no")
VAD_MAX_GAIN = float(os.environ.get("VAD_MAX_GAIN", "300"))
VAD_AGC_DECAY = float(os.environ.get("VAD_AGC_DECAY", "0.999"))
VAD_GAIN = float(os.environ.get("VAD_GAIN", "1"))
VAD_THRESH = float(os.environ.get("VAD_THRESH", "0.5"))
VAD_SILENCE = float(os.environ.get("VAD_SILENCE", "0.8"))
VAD_NOSPEECH = float(os.environ.get("VAD_NOSPEECH", "4.0"))


class SocketReader:
    """Файловый объект для PyAV поверх TCP: read() блокируется до данных."""

    def __init__(self, sock):
        self.sock = sock

    def read(self, size=-1):
        return self.sock.recv(size if size and size > 0 else 65536)

    def seekable(self):
        return False

    def tell(self):
        return 0

    def seek(self, *args):
        raise OSError("not seekable")

    def close(self):
        pass


class VADHandler(socketserver.BaseRequestHandler):
    def handle(self):
        import av
        from earshot import Detector

        sock = self.request
        sock.settimeout(15)
        detector = Detector()
        reader = SocketReader(sock)

        heard = False
        samples = 0
        silence_frames = 0
        silence_need = max(1, int(round(VAD_SILENCE * RATE / FRAME)))
        nospeech_samples = int(VAD_NOSPEECH * RATE)
        done = False
        why = "eof"
        resampler = None
        pending = np.zeros(0, dtype=np.float32)
        peak = 1e-4

        def feed(x):
            """Скормить сэмплы детектору; вернуть True, когда пора отвечать."""
            nonlocal heard, samples, silence_frames, pending, peak
            pending = np.concatenate([pending, x]) if pending.size else x
            while pending.size >= FRAME:
                frame = pending[:FRAME]
                pending = pending[FRAME:]
                if VAD_AGC:
                    peak = max(peak * VAD_AGC_DECAY, float(np.max(np.abs(frame))), 1e-4)
                    frame = np.clip(frame * min(0.9 / peak, VAD_MAX_GAIN), -1.0, 1.0)
                if VAD_GAIN != 1.0:
                    frame = np.tanh(frame * VAD_GAIN)
                score = detector.predict_f32(np.ascontiguousarray(frame, dtype=np.float32))
                samples += FRAME
                if score >= VAD_THRESH:
                    heard = True
                    silence_frames = 0
                elif heard:
                    silence_frames += 1
                    if silence_frames >= silence_need:
                        return True
                if not heard and samples >= nospeech_samples:
                    return True
            return False

        try:
            with av.open(
                reader,
                format="ogg",
                options={"fflags": "nobuffer", "probesize": "32", "analyzeduration": "0"},
            ) as container:
                stream = next((s for s in container.streams if s.type == "audio"), None)
                if stream is None:
                    raise RuntimeError("в Ogg нет аудиопотока")
                resampler = av.AudioResampler(format="s16", layout="mono", rate=RATE)
                deadline = time.time() + MAX_SECONDS
                for frame in container.decode(stream):
                    for out in resampler.resample(frame):
                        pcm = out.to_ndarray().reshape(-1).astype(np.float32) / 32768.0
                        if feed(pcm):
                            done = True
                            why = "speech" if heard else "nospeech"
                            break
                    if done:
                        break
                    if time.time() > deadline:
                        why = "timeout"
                        break
            if not done:
                try:
                    for out in resampler.resample(None):
                        pcm = out.to_ndarray().reshape(-1).astype(np.float32) / 32768.0
                        if feed(pcm):
                            why = "speech" if heard else "nospeech"
                            break
                except Exception:  # noqa: BLE001 — старый PyAV без flush
                    pass
        except Exception as exc:  # noqa: BLE001 — обрыв/конец потока
            why = "end: " + (str(exc) or type(exc).__name__)

        # Как и Silero-путь: при любой ненулевой записи просим STT попробовать,
        # пустой результат отсечёт гейт ASR. 'N' — только на явной тишине.
        answer = b"E" if (heard or samples > RATE // 4) else b"N"
        print("earshot: %s, %.2fs, speech=%s -> %s" % (why, samples / RATE, heard, answer.decode()),
              flush=True)
        try:
            sock.sendall(answer)
        except OSError:
            pass
        try:
            sock.close()
        except OSError:
            pass


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    srv = Server(("127.0.0.1", VAD_PORT), VADHandler)
    print("Earshot VAD готов на порту", VAD_PORT, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
