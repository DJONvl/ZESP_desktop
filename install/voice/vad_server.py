#!/usr/bin/env python3
"""Silero VAD (sherpa-onnx) по TCP для ZESP: Ogg/Opus → 'E' / 'N'.

ZESP открывает TCP на каждый диалог, пишет Ogg/Opus (начиная с OpusHead) и
ждёт один байт: 'E' — речь найдена и закончилась, 'N' — речи нет. Системный
ffmpeg не нужен: Ogg/Opus декодирует PyAV, VAD считает sherpa-onnx.

Окружение:
  VAD_PORT      18093                     порт
  VAD_MODEL     models/silero_vad.onnx    файл модели
  VAD_GAIN      8                         усиление перед VAD (tanh)
  VAD_THRESH    0.5                       порог речи
  VAD_SILENCE   0.8                       тишина после речи, с
  VAD_NOSPEECH  4.0                       сколько ждать речь, с
  VAD_SKIP      0.7                       фразы короче — хвост «Алисы», с
"""
import os
import socket
import socketserver
import time

import numpy as np

RATE = 16000
MAX_SECONDS = 60.0

VAD_PORT = int(os.environ.get("VAD_PORT", "18093"))
VAD_MODEL = os.environ.get("VAD_MODEL", os.path.join("models", "silero_vad.onnx"))
VAD_GAIN = float(os.environ.get("VAD_GAIN", "8"))
VAD_THRESH = float(os.environ.get("VAD_THRESH", "0.5"))
VAD_SILENCE = float(os.environ.get("VAD_SILENCE", "0.8"))
VAD_NOSPEECH = float(os.environ.get("VAD_NOSPEECH", "4.0"))
VAD_SKIP = float(os.environ.get("VAD_SKIP", "0.7"))


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


def _vad_config(sherpa_onnx):
    cfg = sherpa_onnx.VadModelConfig()
    cfg.silero_vad.model = VAD_MODEL
    cfg.silero_vad.threshold = VAD_THRESH
    cfg.silero_vad.min_silence_duration = VAD_SILENCE
    cfg.silero_vad.min_speech_duration = 0.1
    cfg.sample_rate = RATE
    cfg.num_threads = 1
    return cfg


class VADHandler(socketserver.BaseRequestHandler):
    def handle(self):
        import av
        import sherpa_onnx

        sock = self.request
        sock.settimeout(15)
        vad = sherpa_onnx.VoiceActivityDetector(_vad_config(sherpa_onnx), buffer_size_in_seconds=MAX_SECONDS)

        reader = SocketReader(sock)
        heard = False
        samples = 0
        done = False
        why = "eof"
        resampler = None
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
                        pcm = out.to_ndarray().reshape(-1)
                        x = np.tanh(pcm.astype(np.float32) * (VAD_GAIN / 32768.0))
                        vad.accept_waveform(x)
                        samples += len(x)
                        if vad.is_speech_detected():
                            heard = True
                        while not vad.empty():
                            seg = vad.front
                            end = (seg.start + len(seg.samples)) / RATE
                            vad.pop()
                            if end >= VAD_SKIP:
                                done = True
                                why = "speech"
                                break
                        if done:
                            break
                    if done:
                        break
                    if not heard and samples / RATE >= VAD_NOSPEECH:
                        why = "nospeech"
                        break
                    if time.time() > deadline:
                        why = "timeout"
                        break
            try:
                for out in resampler.resample(None):
                    pcm = out.to_ndarray().reshape(-1)
                    vad.accept_waveform(np.tanh(pcm.astype(np.float32) * (VAD_GAIN / 32768.0)))
            except Exception:  # noqa: BLE001 — старый PyAV без flush
                pass
        except Exception as exc:  # noqa: BLE001 — обрыв/конец потока
            why = "end: " + (str(exc) or type(exc).__name__)
        # Речь была или мы честно дошли до конца записи — просим STT попробовать.
        # Пустой результат отсечёт гейт ASR (на тишине текст пустой).
        answer = b"E" if (heard or samples > RATE // 4) else b"N"
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
    print("VAD готов на порту", VAD_PORT, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
