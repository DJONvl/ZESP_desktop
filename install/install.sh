#!/bin/sh
# ZESP installer — последний релиз с GitHub -> $INSTALL_DIR (по умолчанию /opt/zesp).
#
#   wget https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
#
# Нужны только sh + tar + любая качалка (curl/uclient-fetch/wget). Токен не нужен (репо публичный).
# Бинарь всегда ставится как $INSTALL_DIR/zesp (имя платформы из архива не важно).
# Персональное (jsconfig.txt, devicesjs.txt, Devices/, сцены...) при переустановке
# НЕ затирается; пустое создастся само из .tpl при старте.
set -e

REPO="DJONvl/ZESP_desktop"

die() { echo "ERROR: $1" >&2; exit 1; }

# качалка: curl -> uclient-fetch (OpenWrt) -> wget.
# (у busybox-wget бывает сборка без https — тогда он вообще не ест https-ссылки)
fetch() { # fetch URL OUTFILE(- = stdout)
  url=$1; out=$2
  if command -v curl >/dev/null 2>&1; then
    if [ "$out" = "-" ]; then curl -fsSL "$url"; else curl -fsSL -o "$out" "$url"; fi
  elif command -v uclient-fetch >/dev/null 2>&1; then
    if [ "$out" = "-" ]; then uclient-fetch -q -O - "$url"; else uclient-fetch -q -O "$out" "$url"; fi
  else
    if [ "$out" = "-" ]; then wget -q -O- "$url"; else wget -O "$out" "$url"; fi
  fi
}
# root -> /opt/zesp, обычный юзер -> ~/zesp (в /opt ему писать не дадут).
# Переопределить: INSTALL_DIR=/root/zesp sh install.sh
if [ -z "$INSTALL_DIR" ]; then
  if [ "$(id -u)" = 0 ]; then INSTALL_DIR=/opt/zesp; else INSTALL_DIR=$HOME/zesp; fi
fi
[ -z "$INSTALL_DIR" ] && die "cannot determine install dir (no HOME?)"
SKIP="jsconfig.txt devicesjs.txt Devices scenes.json groups.json location.json workspace.xml"

# --- архитектура -> ассет (имена из матрицы сборки) ---
# Можно переопределить вручную: ASSET=zesp_openwrt_mips.tar.gz sh install.sh
if [ -z "$ASSET" ]; then
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ASSET="zesp_linux_amd64.tar.gz" ;;
  aarch64|arm64) ASSET="zesp_linux_arm64.tar.gz" ;;
  armv6*) die "armv6 not supported (need armv7+)" ;;
  armv7l|armv7*|arm*) ASSET="zesp_linux_armv7l.tar.gz" ;;
  # uname -m не различает BE/LE mips; большинство современных роутеров — LE
  mips|mipsel|mipsle) ASSET="zesp_openwrt_mipsle.tar.gz" ;;
  *) die "unsupported arch: $ARCH (override with ASSET=... sh install.sh)" ;;
esac
fi

# --- последний релиз ---
TAG="$(fetch "https://api.github.com/repos/$REPO/releases/latest" - 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4)"
[ -z "$TAG" ] && die "cannot get latest release (network/api)"
echo "Installing ZESP $TAG ($ASSET) -> $INSTALL_DIR"

URL="https://github.com/$REPO/releases/download/$TAG/$ASSET"
TMP="$(mktemp -d)" || die "mktemp failed"
trap 'rm -rf "$TMP"' EXIT INT TERM
fetch "$URL" "$TMP/pkg.tgz" || die "download failed"
tar -xzf "$TMP/pkg.tgz" -C "$TMP" || die "extract failed"

# --- бинарь -> zesp (всегда свежий) ---
BIN=""
for b in "$TMP"/zesp_linux_* "$TMP"/zesp_openwrt_*; do
  if [ -f "$b" ]; then BIN="$b"; break; fi
done
[ -z "$BIN" ] && die "binary not found in archive"
mkdir -p "$INSTALL_DIR"
cp "$BIN" "$INSTALL_DIR/zesp" || die "cannot replace binary (stop running zesp first?)"
chmod 755 "$INSTALL_DIR/zesp"

# --- фронт (персональное не трогаем) ---
mkdir -p "$INSTALL_DIR/desktop"
for src in "$TMP"/desktop/*; do
  base="$(basename "$src")"
  skip=0
  for s in $SKIP; do
    if [ "$base" = "$s" ] && [ -e "$INSTALL_DIR/desktop/$base" ]; then skip=1; break; fi
  done
  if [ "$skip" = 1 ]; then echo "keep personal: $base"; continue; fi
  rm -rf "$INSTALL_DIR/desktop/$base"
  cp -r "$src" "$INSTALL_DIR/desktop/$base"
done

# --- автозапуск (системный юнит — только под рутом) ---
if [ -d /run/systemd/system ] && [ "$(id -u)" = 0 ]; then
  cat > /etc/systemd/system/zesp.service <<EOF
[Unit]
Description=ZESP smart home server
After=network.target
[Service]
ExecStart=$INSTALL_DIR/zesp
WorkingDirectory=$INSTALL_DIR
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable --now zesp
  echo "service zesp enabled and started"
else
  echo "no system autostart (no systemd or not root):"
  echo "  start manually: $INSTALL_DIR/zesp"
  echo "  or add to crontab (@reboot) / /etc/rc.local"
fi

echo "DONE: $INSTALL_DIR/zesp ($TAG)"
