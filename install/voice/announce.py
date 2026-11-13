#!/usr/bin/env python3
"""Обёртка-анонсер голосовых сервисов для кластера ZESP.

Что делает:
  1. TCP-прокси наружу: сервисы на 127.0.0.1 становятся доступны в LAN
     (0.0.0.0:6015/6016 -> 127.0.0.1:5015/5016).
  2. Поллит /health каждого сервиса и собирает манифест из живого
     состояния (engine, model, voices, capacity, busy).
  3. Отдаёт GET /manifest.json (schema 1) с HMAC-подписью clusterSecret.
  4. Публикует mDNS _zesp-svc._tcp с TXT: id, kinds, path, v, sig.
  5. Переопубликовывает манифест только когда меняется содержимое.

Запуск:
  python announce.py --config services.json
  python announce.py --once          # напечатать манифест и выйти
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import hmac
import json
import logging
import os
import signal
import socket
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from zeroconf import ServiceInfo, Zeroconf

LOG = logging.getLogger("announce")
HEALTH_INTERVAL = 10.0
HEALTH_TIMEOUT = 4.0
SCHEMA = 1


# ── утилиты ────────────────────────────────────────────────────────────────


def now_iso() -> str:
	return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _ip_rank(ip: str) -> int:
	"""Меньше — лучше. TUN/VPN и link-local в LAN не годятся."""
	if ip.startswith("192.168."):
		return 0
	if ip.startswith("10."):
		return 1
	if ip.startswith("172."):
		try:
			second = int(ip.split(".")[1])
		except (IndexError, ValueError):
			return 5
		if 16 <= second <= 31:
			return 2
	if ip.startswith("169.254."):
		return 8
	if ip.startswith("198.18.") or ip.startswith("198.19."):
		return 9  # диапазон бенчмарков: Clash TUN, wwan
	if ip.startswith("127."):
		return 10
	return 5


def lan_ip() -> str:
	"""Адрес, который видят другие машины в той же подсети.

	UDP-трюк с 8.8.8.8 выбирает маршрут по умолчанию и часто попадает
	в TUN/VPN (198.18.x), поэтому перебираем все адреса хоста и берём
	самый «домашний» (192.168 -> 10 -> 172.16-31).
	"""
	cands: list[str] = []
	try:
		for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
			ip = info[4][0]
			if ip not in cands:
				cands.append(ip)
	except OSError:
		pass
	if not cands:
		s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
		try:
			s.connect(("8.8.8.8", 80))
			cands.append(s.getsockname()[0])
		except OSError:
			cands.append("127.0.0.1")
		finally:
			s.close()
	return sorted(cands, key=_ip_rank)[0]


def canonical(obj: Any) -> bytes:
	"""Канонизация для HMAC: сортировка ключей, без пробелов, UTF-8."""
	return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def read_secret(cfg: dict, cache: dict) -> str:
	cl = cfg.get("cluster", {}) or {}
	# 1) Прямой пароль в конфиге — машина без ZESP, инсталлятор пишет его сюда.
	direct = str(cl.get("secret", "") or "")
	if direct:
		return direct
	# 2) Файл (если ZESP стоит на этой же машине): jsconfig.txt → Cluster.secret.
	#    secretPath = ["Cluster","secret"]; старый secretKey оставлен для совместимости.
	path = Path(cl.get("secretFile", "") or "")
	if not path or not path.is_file():
		return ""
	try:
		mtime = path.stat().st_mtime
		if cache.get("mtime") == mtime:
			return cache.get("secret", "")
		data = json.loads(path.read_text(encoding="utf-8-sig"))
		secret_path = cl.get("secretPath")
		if isinstance(secret_path, list) and secret_path:
			cur = data
			for k in secret_path:
				if not isinstance(cur, dict):
					cur = None
					break
				cur = cur.get(k)
			secret = str(cur or "") if isinstance(cur, str) else ""
		else:
			key = cl.get("secretKey", "clusterSecret")
			secret = str(data.get(key, "") or "")
		cache["mtime"] = mtime
		cache["secret"] = secret
		return secret
	except (OSError, ValueError) as e:
		LOG.warning("секрет не прочитан из %s: %s", path, e)
		return ""


# ── манифест ───────────────────────────────────────────────────────────────


def normalize_format(fmt: str) -> str:
	"""Словарь контракта: локальные серверы отдают f32le, zesp просит pcm_f32le."""
	m = {
		"f32le": "pcm_f32le",
		"pcm": "pcm_f32le",
		"s16le": "pcm_s16le",
		"opus": "ogg_opus",
		"ogg": "ogg_opus",
	}
	return m.get((fmt or "").lower(), fmt)


def voices_from_health(svc: dict, health: dict | None) -> list[dict]:
	"""Приводит voices сервиса к формату контракта {value,label,lang,gender}."""
	if not health:
		return []
	labels = svc.get("voiceLabels", {})
	out = []
	for value in health.get("voices", []) or []:
		meta = labels.get(value, {})
		out.append(
			{
				"value": value,
				"label": meta.get("label", value),
				"lang": meta.get("lang", (svc.get("langs") or ["ru"])[0]),
				"gender": meta.get("gender", ""),
			}
		)
	return out


def build_service(svc: dict, host: str, health: dict | None, state: str, last_ok: str | None) -> dict:
	listen = svc.get("listen", {})
	port = int(listen.get("port", 0))
	if svc["kind"] == "vad":
		# VAD — потоковый TCP: колонка шлёт ogg и получает 'E'/'N'.
		url = f"tcp:{host}:{port}"
	else:
		url = f'http://{host}:{port}{svc.get("path", "/")}'
	out: dict[str, Any] = {
		"id": svc["id"],
		"kind": svc["kind"],
		"adapter": svc.get("adapter", "openai"),
		"url": url,
		"priority": int(svc.get("priority", 100)),
		"state": state,
	}
	if svc["kind"] == "vad":
		out["streaming"] = True
		out["transport"] = "tcp"
		if last_ok:
			out["last_ok"] = last_ok
		return out
	if svc["kind"] == "tts":
		modes = svc.get("voiceModes") or ["preset"]
		out["voice_modes"] = modes
		voices = voices_from_health(svc, health)
		if voices:
			out["voices"] = voices
		if health:
			current = health.get("voice") or (voices[0]["value"] if voices else "")
			mode = "preset"
			st = health.get("state")
			if isinstance(st, dict) and st.get("voice_mode"):
				mode = st["voice_mode"]
			if current:
				out["current_voice"] = {"mode": mode, "value": current}
			if svc.get("httpMode") == "tts":
				# Прокси отдаёт готовый Ogg/Opus, если клиент его попросил.
				out["formats"] = ["ogg_opus", "pcm_f32le"]
			elif health.get("format"):
				out["formats"] = [normalize_format(health["format"])]
			if health.get("sample_rate"):
				out["sample_rate"] = health["sample_rate"]
	else:
		model = (health or {}).get("model", "")
		if model:
			label = svc.get("modelLabel") or model
			out["models"] = [
				{"value": model, "label": label, "langs": svc.get("langs") or ["ru"]}
			]
		out["streaming"] = bool(svc.get("streaming", False))
	if health:
		out["health"] = {
			k: health[k]
			for k in ("engine", "model", "device", "capacity", "busy", "active", "waiting", "completed")
			if k in health
		}
	if last_ok:
		out["last_ok"] = last_ok
	return out


def build_manifest(cfg: dict, host: str, healths: dict[str, dict], secret: str) -> tuple[dict, str]:
	services = []
	for svc in cfg["services"]:
		st = healths.get(svc["id"], {})
		services.append(
			build_service(svc, host, st.get("health"), st.get("state", "down"), st.get("lastOk"))
		)
	body = {
		"schema": SCHEMA,
		"id": cfg["identity"]["id"],
		"name": cfg["identity"].get("name", cfg["identity"]["id"]),
		"role": "service",
		"updated": now_iso(),
		"services": services,
		"caps": None,
	}
	if secret:
		sig = hmac.new(secret.encode("utf-8"), canonical(body), hashlib.sha256).hexdigest()
		body["sig"] = f"hmac-sha256:{sig}"
		return body, sig
	body["sig"] = None
	return body, ""


# ── health ─────────────────────────────────────────────────────────────────


def fetch_json(url: str) -> dict | None:
	try:
		req = urllib.request.Request(url, headers={"Accept": "application/json"})
		with urllib.request.urlopen(req, timeout=HEALTH_TIMEOUT) as r:
			return json.loads(r.read(256 * 1024).decode("utf-8", "replace"))
	except Exception as e:  # noqa: BLE001 — любой сбой = сервис недоступен
		LOG.debug("health %s: %s", url, e)
		return None


def probe_tcp(addr: str) -> bool:
	"""Живость TCP-сервиса (VAD): достаточно успешного connect."""
	a = addr[4:] if addr.startswith("tcp:") else addr
	host, _, port = a.rpartition(":")
	try:
		with socket.create_connection((host, int(port)), timeout=HEALTH_TIMEOUT):
			return True
	except (OSError, ValueError):
		return False


async def poll_once(cfg: dict, healths: dict[str, dict]) -> None:
	for svc in cfg["services"]:
		if svc.get("healthMode") == "tcp":
			ok = await asyncio.to_thread(probe_tcp, svc.get("healthUrl", ""))
			h = {"status": "ok"} if ok else None
		else:
			h = await asyncio.to_thread(fetch_json, svc["healthUrl"])
		cur = healths.setdefault(svc["id"], {"state": "down", "health": None, "lastOk": None})
		if h and h.get("status") == "ok":
			cur["health"] = h
			cur["state"] = "running"
			cur["lastOk"] = now_iso()
		else:
			cur["state"] = "down"
			# health оставляем последний известный: UI увидит сервис и его состояние


async def health_loop(cfg: dict, healths: dict[str, dict], on_change) -> None:
	while True:
		try:
			await poll_once(cfg, healths)
			await on_change()
		except asyncio.CancelledError:
			return
		except Exception as e:  # noqa: BLE001
			LOG.warning("poll: %s", e)
		await asyncio.sleep(HEALTH_INTERVAL)


# ── HTTP: манифест ─────────────────────────────────────────────────────────


def body_digest(body: dict) -> str:
	"""Хеш содержимого без волатильных полей: updated, last_ok, completed.

	Иначе счётчик завершённых запросов менял бы манифест каждые 10 с.
	"""
	clean = {k: v for k, v in body.items() if k not in ("updated", "sig")}
	services = []
	for svc in clean.get("services", []):
		s = {k: v for k, v in svc.items() if k != "last_ok"}
		if isinstance(s.get("health"), dict):
			s["health"] = {k: v for k, v in s["health"].items() if k != "completed"}
		services.append(s)
	clean["services"] = services
	return hashlib.sha256(canonical(clean)).hexdigest()


async def handle_http(reader: asyncio.StreamReader, writer: asyncio.StreamWriter, state: dict) -> None:
	try:
		head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 5.0)
	except (asyncio.TimeoutError, asyncio.IncompleteReadError):
		writer.close()
		return
	try:
		line = head.split(b"\r\n", 1)[0].decode("latin-1")
		method, path, _ = (line.split(" ") + ["", ""])[:3]
		if method != "GET":
			await send(writer, 405, {"ok": False, "error": "GET only"})
			return
		if path == state["manifestPath"]:
			body = state["manifest"]
			data = json.dumps(body, ensure_ascii=False, indent=2).encode("utf-8")
			await send_raw(writer, 200, "application/json; charset=utf-8", data, state["etag"])
		elif path == "/health":
			await send(writer, 200, {"status": "ok", "id": state["id"], "services": len(body_services(state))})
		elif path == "/":
			text = f'ZESP voice announce: {state["id"]}\nmanifest: {state["manifestPath"]}\n'.encode()
			await send_raw(writer, 200, "text/plain; charset=utf-8", text)
		else:
			await send(writer, 404, {"ok": False, "error": "not found"})
	except Exception as e:  # noqa: BLE001
		LOG.debug("http: %s", e)
	finally:
		try:
			await writer.drain()
		finally:
			writer.close()


def body_services(state: dict) -> list:
	return state["manifest"].get("services", [])


async def send(writer: asyncio.StreamWriter, code: int, obj: dict) -> None:
	await send_raw(writer, code, "application/json; charset=utf-8", json.dumps(obj).encode())


async def send_raw(writer: asyncio.StreamWriter, code: int, ctype: str, data: bytes, etag: str = "") -> None:
	reasons = {200: "OK", 404: "Not Found", 405: "Method Not Allowed"}
	headers = [
		f"HTTP/1.1 {code} {reasons.get(code, 'OK')}",
		f"Content-Type: {ctype}",
		f"Content-Length: {len(data)}",
		"Cache-Control: max-age=30",
		"Connection: close",
	]
	if etag:
		headers.append(f'ETag: "{etag}"')
	writer.write(("\r\n".join(headers) + "\r\n\r\n").encode() + data)


# ── TCP-прокси ─────────────────────────────────────────────────────────────


async def pipe(src: asyncio.StreamReader, dst: asyncio.StreamWriter) -> int:
	total = 0
	try:
		while True:
			data = await src.read(65536)
			if not data:
				break
			total += len(data)
			dst.write(data)
			await dst.drain()
	except (ConnectionError, asyncio.CancelledError):
		pass
	finally:
		try:
			if dst.can_write_eof():
				dst.write_eof()
		except (OSError, RuntimeError):
			pass
	return total


async def proxy_conn(client_r: asyncio.StreamReader, client_w: asyncio.StreamWriter, target: tuple[str, int], label: str) -> None:
	peer = client_w.get_extra_info("peername")
	try:
		up_r, up_w = await asyncio.open_connection(*target)
	except Exception as e:  # noqa: BLE001
		LOG.warning("%s: нет соединения с %s: %s", label, target, e)
		client_w.close()
		return
	try:
		up, down = await asyncio.gather(pipe(client_r, up_w), pipe(up_r, client_w))
		LOG.info("%s: запрос от %s → %d Б, ответ %d Б", label, peer, up, down)
	except Exception as e:  # noqa: BLE001
		LOG.debug("%s: %s", label, e)
	finally:
		for w in (up_w, client_w):
			try:
				w.close()
			except Exception:  # noqa: BLE001
				pass


# ── TTS: перекодирование в Ogg/Opus ────────────────────────────────────────
#
# ZESP умеет сам звать ffmpeg, но на колонках его нет. Поэтому если клиент
# просит ogg/opus, обёртка запрашивает у сервиса pcm_f32le и кодирует здесь
# через PyAV (libopus) — системный ffmpeg не нужен.

OGG_FORMATS = {"ogg", "opus", "ogg_opus", "ogg-opus"}


async def read_http_request(reader: asyncio.StreamReader) -> tuple[str, str, dict, bytes]:
	head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 10.0)
	lines = head.decode("latin-1").split("\r\n")
	method, path, _ = (lines[0].split(" ") + ["", "", ""])[:3]
	headers: dict[str, str] = {}
	for line in lines[1:]:
		if not line:
			continue
		k, _, v = line.partition(":")
		headers[k.strip().lower()] = v.strip()
	length = int(headers.get("content-length") or 0)
	body = await reader.readexactly(length) if length > 0 else b""
	return method, path, headers, body


async def read_http_response(reader: asyncio.StreamReader) -> tuple[int, dict[str, str], bytes]:
	head = await asyncio.wait_for(reader.readuntil(b"\r\n\r\n"), 30.0)
	lines = head.decode("latin-1").split("\r\n")
	try:
		status = int(lines[0].split(" ")[1])
	except (IndexError, ValueError):
		status = 0
	headers: dict[str, str] = {}
	for line in lines[1:]:
		if not line:
			continue
		k, _, v = line.partition(":")
		headers[k.strip().lower()] = v.strip()
	if headers.get("transfer-encoding", "").lower() == "chunked":
		return status, headers, await read_chunked(reader)
	length = headers.get("content-length")
	if length is not None and length.isdigit():
		return status, headers, await reader.readexactly(int(length))
	return status, headers, await reader.read()


async def read_chunked(reader: asyncio.StreamReader) -> bytes:
	out = bytearray()
	while True:
		line = await reader.readuntil(b"\r\n")
		size = int(line.strip().split(b";")[0] or b"0", 16)
		if size == 0:
			await reader.readuntil(b"\r\n")
			return bytes(out)
		out += await reader.readexactly(size)
		await reader.readexactly(2)


def _encode_ogg_opus(pcm: bytes, rate: int) -> bytes:
	"""float32le PCM → Ogg/Opus через PyAV (libopus). Системный ffmpeg не нужен."""
	import io

	import av
	import numpy as np

	samples = np.frombuffer(pcm, dtype="<f4")
	if samples.size == 0:
		raise RuntimeError("пустой PCM от TTS")
	out = io.BytesIO()
	with av.open(out, mode="w", format="ogg") as container:
		stream = container.add_stream("libopus", rate=rate)
		stream.layout = "mono"
		stream.bit_rate = 32000
		frame = av.AudioFrame.from_ndarray(
			np.ascontiguousarray(samples, dtype=np.float32).reshape(1, -1),
			format="fltp",
			layout="mono",
		)
		frame.sample_rate = rate
		for packet in stream.encode(frame):
			container.mux(packet)
		for packet in stream.encode(None):
			container.mux(packet)
	data = out.getvalue()
	if not data.startswith(b"OggS"):
		raise RuntimeError("PyAV вернул не Ogg")
	return data


async def to_ogg(pcm: bytes, rate: int) -> bytes:
	return await asyncio.to_thread(_encode_ogg_opus, pcm, rate)


async def tts_conn(
	client_r: asyncio.StreamReader,
	client_w: asyncio.StreamWriter,
	target: tuple[str, int],
	label: str,
	svc: dict,
) -> None:
	peer = client_w.get_extra_info("peername")
	try:
		method, path, headers, body = await read_http_request(client_r)
	except Exception as e:  # noqa: BLE001
		LOG.warning("%s: запрос не прочитан: %r", label, e)
		client_w.close()
		return

	want_ogg = False
	payload = body
	if body:
		try:
			obj = json.loads(body)
			fmt = str(obj.get("response_format", "")).lower()
			if fmt in OGG_FORMATS:
				want_ogg = True
				obj["response_format"] = "pcm_f32le"
				payload = json.dumps(obj, ensure_ascii=False).encode("utf-8")
		except (ValueError, AttributeError):
			pass

	up_r, up_w = await asyncio.open_connection(*target)
	hdr = [f"{method} {path} HTTP/1.1", f"Host: {target[0]}:{target[1]}"]
	for k in ("content-type", "authorization", "accept"):
		if k in headers:
			hdr.append(f"{k.title()}: {headers[k]}")
	hdr.append(f"Content-Length: {len(payload)}")
	hdr.append("Connection: close")
	up_w.write(("\r\n".join(hdr) + "\r\n\r\n").encode() + payload)
	await up_w.drain()

	try:
		if not want_ogg:
			# Не ogg — отдаём ответ как есть, потоком.
			while True:
				data = await up_r.read(65536)
				if not data:
					break
				client_w.write(data)
				await client_w.drain()
			LOG.info("%s: запрос от %s без перекодирования", label, peer)
			return

		status, _, data = await read_http_response(up_r)
		if status != 200:
			msg = data[:200].decode("utf-8", "replace")
			client_w.write(
				f"HTTP/1.1 {status} Error\r\nContent-Length: {len(data)}\r\nConnection: close\r\n\r\n".encode()
				+ data
			)
			LOG.warning("%s: TTS HTTP %d (%s)", label, status, msg)
			return
		rate = int(svc.get("sampleRate") or 24000)
		ogg = await to_ogg(data, rate)
		client_w.write(
			(
				f"HTTP/1.1 200 OK\r\nContent-Type: audio/ogg\r\n"
				f"Content-Length: {len(ogg)}\r\nConnection: close\r\n\r\n"
			).encode()
			+ ogg
		)
		LOG.info("%s: ogg для %s — pcm %d Б → ogg %d Б", label, peer, len(data), len(ogg))
	except Exception as e:  # noqa: BLE001
		LOG.exception("%s: сбой: %s", label, e)
	finally:
		for w in (up_w, client_w):
			try:
				w.close()
			except Exception:  # noqa: BLE001
				pass


# ── ASR: chained Ogg → WAV ─────────────────────────────────────────────────
#
# Колонка присылает chained Ogg (pre-roll + речь, два OpusHead), libsndfile
# в gigaam его не читает. На колонке ffmpeg нет, поэтому конвертируем здесь.

def parse_multipart(body: bytes, boundary: str) -> list[dict]:
	parts = body.split(b"--" + boundary.encode())
	fields: list[dict] = []
	for part in parts[1:]:
		if part.startswith(b"--"):
			break
		part = part.lstrip(b"\r\n")
		head, sep, data = part.partition(b"\r\n\r\n")
		if not sep:
			continue
		if data.endswith(b"\r\n"):
			data = data[:-2]
		name = filename = ctype = ""
		for line in head.decode("latin-1").split("\r\n"):
			low = line.lower()
			if low.startswith("content-disposition:"):
				for kv in line.split(";")[1:]:
					k, _, v = kv.strip().partition("=")
					v = v.strip('"')
					if k.lower() == "name":
						name = v
					elif k.lower() == "filename":
						filename = v
			elif low.startswith("content-type:"):
				ctype = line.split(":", 1)[1].strip()
		fields.append({"name": name, "filename": filename, "ctype": ctype, "data": data})
	return fields


def build_multipart(fields: list[dict], boundary: str) -> bytes:
	out = bytearray()
	for f in fields:
		out += b"--" + boundary.encode() + b"\r\n"
		cd = f'Content-Disposition: form-data; name="{f["name"]}"'
		if f.get("filename"):
			cd += f'; filename="{f["filename"]}"'
		out += cd.encode("utf-8") + b"\r\n"
		if f.get("ctype"):
			out += f'Content-Type: {f["ctype"]}\r\n'.encode()
		out += b"\r\n" + f["data"] + b"\r\n"
	out += b"--" + boundary.encode() + b"--\r\n"
	return bytes(out)


def _decode_ogg_to_wav(ogg: bytes, rate: int = 16000) -> bytes:
	"""Chained Ogg/Opus → WAV 16 кГц моно через PyAV, с нормализацией уровня.

	Сигнал с микрофона колонки тихий: DC, RMS до -20 dBFS, усиление не больше
	+20 дБ, мягкий лимитер. Без этого Vosk/GigaAM теряют тихую речь.
	"""
	import io
	import wave

	import av
	import numpy as np

	chunks = []
	with av.open(io.BytesIO(ogg)) as container:
		stream = next((s for s in container.streams if s.type == "audio"), None)
		if stream is None:
			raise RuntimeError("в Ogg нет аудиопотока")
		resampler = av.AudioResampler(format="flt", layout="mono", rate=rate)
		for frame in container.decode(stream):
			for out in resampler.resample(frame):
				chunks.append(out.to_ndarray().reshape(-1))
		try:
			for out in resampler.resample(None):
				chunks.append(out.to_ndarray().reshape(-1))
		except Exception:  # noqa: BLE001 — старый PyAV без flush
			pass
	x = np.concatenate(chunks).astype(np.float32) if chunks else np.zeros(0, dtype=np.float32)
	# Нормализация ВЫКЛЮЧЕНА по умолчанию: fakeuniproxy присылает pre-roll + речь
	# одним Ogg, RMS по всему файлу завышает усиление и клиппирует речь.
	# Включать только вручную: ASR_NORMALIZE=1.
	if os.environ.get("ASR_NORMALIZE", "0") == "1" and x.size:
		x = x - float(x.mean())
		rms = float(np.sqrt(np.mean(x * x)))
		if rms > 1e-6:
			x = x * min(10.0 ** (-20.0 / 20.0) / rms, 10.0 ** (20.0 / 20.0))
		peak = float(np.max(np.abs(x)))
		if peak > 0.99:
			x = x * (0.99 / peak)
	pcm = (np.clip(x, -1.0, 1.0) * 32767.0).astype("<i2").tobytes()
	buffer = io.BytesIO()
	with wave.open(buffer, "wb") as target:
		target.setnchannels(1)
		target.setsampwidth(2)
		target.setframerate(rate)
		target.writeframes(pcm)
	return buffer.getvalue()


async def ogg_to_wav(ogg: bytes) -> bytes:
	return await asyncio.to_thread(_decode_ogg_to_wav, ogg)


async def asr_conn(
	client_r: asyncio.StreamReader,
	client_w: asyncio.StreamWriter,
	target: tuple[str, int],
	label: str,
	svc: dict,
) -> None:
	peer = client_w.get_extra_info("peername")
	try:
		method, path, headers, body = await read_http_request(client_r)
	except Exception as e:  # noqa: BLE001
		LOG.warning("%s: запрос не прочитан: %r", label, e)
		client_w.close()
		return

	ctype = headers.get("content-type", "")
	converted = False
	orig_body = len(body)
	dump_ogg = None
	# Ogg/Opus отдаём сервису как есть: Vosk декодирует opuslib+boost, GigaAM/
	# T-one — PyAV в speech_common. Конвертация в WAV здесь теряла chained-связи
	# и мешала boost. ASR_CONVERT_OGG=1 — вернуть старое поведение.
	if "multipart/form-data" in ctype and "boundary=" in ctype and os.environ.get("ASR_CONVERT_OGG", "0") == "1":
		boundary = ctype.split("boundary=", 1)[1].strip().strip('"')
		fields = parse_multipart(body, boundary)
		for f in fields:
			data = f.get("data") or b""
			if data.startswith(b"OggS"):
				dump_ogg = data
				try:
					wav = await ogg_to_wav(data)
					f["data"] = wav
					f["filename"] = "audio.wav"
					f["ctype"] = "audio/wav"
					converted = True
				except Exception as e:  # noqa: BLE001
					LOG.warning("%s: ogg→wav: %s", label, e)
		if converted:
			body = build_multipart(fields, boundary)

	dump_dir = os.environ.get("ASR_DUMP_DIR", "")
	if dump_dir and dump_ogg:
		try:
			os.makedirs(dump_dir, exist_ok=True)
			name = datetime.now().strftime("asr-%Y%m%d-%H%M%S-%f") + ".ogg"
			with open(os.path.join(dump_dir, name), "wb") as fh:
				fh.write(dump_ogg)
		except OSError as exc:
			LOG.warning("%s: дамп не записан: %s", label, exc)
	LOG.info("%s: запрос %d Б (ogg %s) → %d Б, wav=%s", label, orig_body,
	         len(dump_ogg) if dump_ogg else 0, len(body), converted)

	up_r, up_w = await asyncio.open_connection(*target)
	hdr = [f"{method} {path} HTTP/1.1", f"Host: {target[0]}:{target[1]}"]
	if ctype:
		hdr.append(f"Content-Type: {ctype}")
	if "authorization" in headers:
		hdr.append(f"Authorization: {headers['authorization']}")
	hdr.append(f"Content-Length: {len(body)}")
	hdr.append("Connection: close")
	up_w.write(("\r\n".join(hdr) + "\r\n\r\n").encode() + body)
	await up_w.drain()

	try:
		status, rhdrs, data = await read_http_response(up_r)
		out = [f"HTTP/1.1 {status} OK"]
		for k in ("content-type",):
			if k in rhdrs:
				out.append(f"{k.title()}: {rhdrs[k]}")
		out.append(f"Content-Length: {len(data)}")
		out.append("Connection: close")
		client_w.write(("\r\n".join(out) + "\r\n\r\n").encode() + data)
		LOG.info("%s: ответ %s %d Б (ogg→wav=%s)", label, peer, len(data), converted)
	except Exception as e:  # noqa: BLE001
		LOG.exception("%s: сбой: %s", label, e)
	finally:
		for w in (up_w, client_w):
			try:
				w.close()
			except Exception:  # noqa: BLE001
				pass


# ── mDNS ───────────────────────────────────────────────────────────────────


def publish_mdns(zc: Zeroconf, cfg: dict, host: str, kinds: list[str], signed: bool, port: int) -> None:
	if not cfg.get("mdns", {}).get("enabled", True):
		return
	type_ = cfg["mdns"].get("serviceType", "_zesp-svc._tcp.local.")
	node_id = cfg["identity"]["id"]
	name = f"{node_id}.{type_}"
	props = {
		"id": node_id,
		"name": cfg["identity"].get("name", node_id),
		"kinds": ",".join(kinds),
		"path": cfg["manifest"].get("path", "/manifest.json"),
		"v": str(SCHEMA),
		"schema": str(SCHEMA),
		"sig": "1" if signed else "0",
	}
	info = ServiceInfo(
		type_,
		name,
		addresses=[socket.inet_aton(host)],
		port=port,
		properties=props,
		server=f"{node_id}.local.",
	)
	try:
		if getattr(zc, "_zesp_registered", False):
			zc.update_service(info)
		else:
			zc.register_service(info)
			zc._zesp_registered = True  # type: ignore[attr-defined]
		LOG.info("mDNS: %s port=%d kinds=%s sig=%s", name, port, ",".join(kinds), signed)
	except Exception as e:  # noqa: BLE001
		LOG.warning("mDNS: %s", e)


# ── main ───────────────────────────────────────────────────────────────────


async def serve(cfg: dict, state: dict, zc: Zeroconf | None) -> None:
	host = state["host"]
	stop = asyncio.Event()

	# 1. TCP-прокси для каждого сервиса
	servers = []
	for svc in cfg["services"]:
		target_host, target_port = svc["target"].rsplit(":", 1)
		target = (target_host, int(target_port))
		lh = svc.get("listen", {}).get("host", "0.0.0.0")
		lp = int(svc.get("listen", {}).get("port", 0))
		if not lp:
			continue
		if svc.get("httpMode") == "tts":
			handler = lambda r, w, t=target, l=svc["id"], s=svc: tts_conn(r, w, t, l, s)
		elif svc.get("httpMode") == "asr":
			handler = lambda r, w, t=target, l=svc["id"], s=svc: asr_conn(r, w, t, l, s)
		else:
			handler = lambda r, w, t=target, l=svc["id"]: proxy_conn(r, w, t, l)
		srv = await asyncio.start_server(handler, lh, lp)
		servers.append(srv)
		LOG.info("прокси %s:%d -> %s:%d (%s)", lh, lp, target[0], target[1], svc["id"])

	# 2. HTTP манифеста
	mhost = cfg["manifest"].get("host", "0.0.0.0")
	mport = int(cfg["manifest"].get("port", 8099))
	state["manifestPath"] = cfg["manifest"].get("path", "/manifest.json")
	http_srv = await asyncio.start_server(lambda r, w: handle_http(r, w, state), mhost, mport)
	LOG.info("манифест http://%s:%d%s", host, mport, state["manifestPath"])

	async def refresh() -> None:
		secret = read_secret(cfg, state["secretCache"])
		body, sig = build_manifest(cfg, host, state["healths"], secret)
		digest = body_digest(body)
		if digest == state.get("digest"):
			return
		state["digest"] = digest
		state["manifest"] = body
		state["etag"] = digest[:16]
		# mDNS трогаем только когда меняется состав/состояние: иначе
		# счётчик completed и last_ok переопубликовывали бы запись каждые 10 с.
		kinds = sorted({s["kind"] for s in body["services"]})
		mdns_key = canonical(
			[[s["id"], s["kind"], s["state"]] for s in body["services"]] + [kinds, bool(sig)]
		)
		if zc and mdns_key != state.get("mdnsKey"):
			state["mdnsKey"] = mdns_key
			publish_mdns(zc, cfg, host, kinds, bool(sig), mport)
		LOG.info("манифест обновлён: %s", ", ".join(f'{s["id"]}={s["state"]}' for s in body["services"]))

	await refresh()
	task = asyncio.create_task(health_loop(cfg, state["healths"], refresh))

	def _stop(*_) -> None:
		stop.set()

	loop = asyncio.get_running_loop()
	for sig in (signal.SIGINT, signal.SIGTERM):
		try:
			loop.add_signal_handler(sig, _stop)
		except (NotImplementedError, RuntimeError):
			pass

	try:
		await stop.wait()
	finally:
		task.cancel()
		http_srv.close()
		for s in servers:
			s.close()
		await asyncio.gather(http_srv.wait_closed(), *[s.wait_closed() for s in servers], return_exceptions=True)


def main() -> int:
	ap = argparse.ArgumentParser(description="ZESP voice service announcer")
	ap.add_argument("--config", default=str(Path(__file__).with_name("services.json")))
	ap.add_argument("--log", default="")
	ap.add_argument("--once", action="store_true", help="напечатать манифест и выйти")
	ap.add_argument("--verbose", action="store_true")
	args = ap.parse_args()

	log_fmt = "%(asctime)s %(levelname).1s %(message)s"
	handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
	if args.log:
		handlers.append(logging.FileHandler(args.log, encoding="utf-8"))
	logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format=log_fmt, handlers=handlers)

	cfg = json.loads(Path(args.config).read_text(encoding="utf-8-sig"))
	host = cfg.get("advertiseHost") or lan_ip()
	state = {
		"host": host,
		"healths": {},
		"manifest": {},
		"digest": "",
		"etag": "",
		"id": cfg["identity"]["id"],
		"manifestPath": cfg["manifest"].get("path", "/manifest.json"),
		"secretCache": {},
	}

	if args.once:
		for svc in cfg["services"]:
			if svc.get("healthMode") == "tcp":
				h = {"status": "ok"} if probe_tcp(svc.get("healthUrl", "")) else None
			else:
				h = fetch_json(svc["healthUrl"])
			state["healths"][svc["id"]] = {
				"state": "running" if h and h.get("status") == "ok" else "down",
				"health": h,
				"lastOk": now_iso() if h else None,
			}
		secret = read_secret(cfg, state["secretCache"])
		body, _ = build_manifest(cfg, host, state["healths"], secret)
		print(json.dumps(body, ensure_ascii=False, indent=2))
		return 0

	zc = Zeroconf() if cfg.get("mdns", {}).get("enabled", True) else None
	try:
		asyncio.run(serve(cfg, state, zc))
	except KeyboardInterrupt:
		pass
	finally:
		if zc:
			zc.close()
	return 0


if __name__ == "__main__":
	sys.exit(main())
