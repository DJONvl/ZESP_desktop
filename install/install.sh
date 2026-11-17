#!/bin/sh
# ZESP installer — последний релиз с GitHub -> /opt/zesp.
#
#   wget https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install/install.sh && sh install.sh
#
# Нужны только sh + tar + качалка. Токен не нужен (репо публичный).
# Если wget собран без https (busybox на Станциях) — скрипт сам подтянет
# статический wget с зеркала HTTP_UTILS.
#
# Флаги:
#   --dry-run       показать план (донор, точка монтирования, init) и выйти
#   --no-service    не прописывать автозапуск
#   --no-start      не запускать после установки
#   --force         ставить даже если zesp уже запущен
#   --donor=PATH    задать rw-раздел-донор вручную (/bkupgrade, /data, ...)
#   --dir=PATH      ставить в PATH как есть (без донора и монтирования)
#
# Бинарь всегда ставится как /opt/zesp/zesp (имя платформы из архива не важно).
# Персональное (jsconfig.txt, devicesjs.txt, Devices/, сцены...) при переустановке
# НЕ затирается; пустое создастся само из .tpl при старте.
set -e

REPO="DJONvl/ZESP_desktop"

# Зеркало статических утилит по http. Нужно прошивкам, где busybox-wget собран
# без TLS (Яндекс.Станции/Buildroot): оттуда берём wget и уже им идём на https.
HTTP_UTILS="${HTTP_UTILS:-http://82.146.46.112/fw/utils}"
# GNU wget на колонках не подхватывает системный CA сам — указываем явно.
WGET_CA="${WGET_CA:-/etc/ssl/certs/ca-certificates.crt}"

DRY=0
WITH_SERVICE=1
NO_START=0
FORCE=0
FORCE_DIR=""
DONOR=""
INIT_OUT=""
DROP_INIT=""

die() { echo "ERROR: $1" >&2; exit 1; }
say() { echo "$@"; }

usage() {
  sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
}

for a in "$@"; do
  case "$a" in
    --dry-run) DRY=1 ;;
    --no-service) WITH_SERVICE=0 ;;
    --no-start) NO_START=1 ;;
    --force) FORCE=1 ;;
    --donor=*) DONOR="${a#*=}" ;;
    --dir=*) FORCE_DIR="${a#*=}" ;;
    --init-out=*) INIT_OUT="${a#*=}" ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $a (see --help)" ;;
  esac
done

# ---------- качалка ----------
ZWGET=""

wget_https() { # wget_https PATH
  if "$1" --version 2>/dev/null | grep -q GNU; then return 0; fi
  if "$1" -T 8 -q -O /dev/null https://api.github.com >/dev/null 2>&1; then return 0; fi
  return 1
}

# Скачать статический wget с зеркала по http.
bootstrap_wget() {
  case "$ARCH" in
    aarch64|arm64) name="wget-linux-arm64" ;;
    armv7l|armv7*|arm*) name="wget-linux-armv7" ;;
    *) return 1 ;;
  esac
  tmp="$TMP/wget"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL -o "$tmp" "$HTTP_UTILS/$name" || return 1
  elif command -v wget >/dev/null 2>&1; then
    wget -q -O "$tmp" "$HTTP_UTILS/$name" || return 1
  else
    return 1
  fi
  chmod 755 "$tmp"
  ZWGET="$tmp"
}

pick_downloader() {
  if command -v curl >/dev/null 2>&1; then return 0; fi
  if command -v uclient-fetch >/dev/null 2>&1; then return 0; fi
  if command -v wget >/dev/null 2>&1 && wget_https wget; then return 0; fi
  bootstrap_wget || die "no https downloader (no curl/uclient-fetch, wget without TLS, bootstrap failed)"
}

# GNU wget: сначала штатно, затем с явным CA, затем без проверки.
wget_try() { # wget_try URL OUTFILE(- = stdout)
  url=$1; out=$2
  if [ "$out" = "-" ]; then
    if wget -q -O- "$url"; then return 0; fi
    if [ -f "$WGET_CA" ] && wget -q --ca-certificate="$WGET_CA" -O- "$url"; then return 0; fi
    wget -q --no-check-certificate -O- "$url"
  else
    if wget -O "$out" "$url"; then return 0; fi
    if [ -f "$WGET_CA" ] && wget --ca-certificate="$WGET_CA" -O "$out" "$url"; then return 0; fi
    wget --no-check-certificate -O "$out" "$url"
  fi
}

fetch() { # fetch URL OUTFILE(- = stdout)
  url=$1; out=$2
  if [ -n "$ZWGET" ]; then
    if [ "$out" = "-" ]; then "$ZWGET" -q -O - "$url"; else "$ZWGET" -q -O "$out" "$url"; fi
  elif command -v curl >/dev/null 2>&1; then
    if [ "$out" = "-" ]; then curl -fsSL "$url"; else curl -fsSL -o "$out" "$url"; fi
  elif command -v uclient-fetch >/dev/null 2>&1; then
    if [ "$out" = "-" ]; then uclient-fetch -q -O - "$url"; else uclient-fetch -q -O "$out" "$url"; fi
  else
    wget_try "$url" "$out"
  fi
}

# ---------- детект системы ----------
root_ro() { grep -E ' / [^ ]+ ro[, ]' /proc/mounts >/dev/null 2>&1; }
is_mount() { mountpoint -q "$1" 2>/dev/null || grep -q " $1 " /proc/mounts; }
free_kb() { df -Pk "$1" 2>/dev/null | awk 'NR==2{print $4}'; }
has_space() { f=$(free_kb "$1"); [ -n "$f" ] && [ "$f" -ge "${2:-$NEED_KB}" ]; }
empty_dir() { [ -z "$(ls -A "$1" 2>/dev/null)" ]; }

detect_init() {
  if [ -d /run/systemd/system ]; then echo systemd
  elif [ -f /etc/rc.common ] && command -v procd >/dev/null 2>&1; then echo procd
  elif [ -d /etc/init.d ] && [ -f /etc/inittab ]; then echo sysv
  else echo none
  fi
}

# root -> /opt/zesp (или донор), обычный юзер -> ~/zesp
if [ -z "$FORCE_DIR" ] && [ -z "$INSTALL_DIR" ]; then
  if [ "$(id -u)" = 0 ]; then INSTALL_DIR=/opt/zesp; else INSTALL_DIR=$HOME/zesp; fi
fi
[ -z "$INSTALL_DIR" ] && INSTALL_DIR="/opt/zesp"
SKIP="jsconfig.txt devicesjs.txt Devices scenes.json groups.json location.json workspace.xml"

# ---------- архитектура -> ассет ----------
ARCH="${ARCH:-$(uname -m)}"
if [ -z "$ASSET" ]; then
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

# ---------- куда ставим ----------
NEED_KB=${NEED_KB:-32768}   # ~32 МБ: бинарь + фронт + запас

if [ -n "$FORCE_DIR" ]; then
  ROOT_DIR="$FORCE_DIR"
  REAL_DIR="$FORCE_DIR"
  DONOR=""
else
  ROOT_DIR="$INSTALL_DIR"
  if [ -z "$DONOR" ]; then
    if [ "$ROOT_DIR" = "/opt/zesp" ] && [ -d /opt ] && ! root_ro && has_space /opt; then
      DONOR=""
    else
      for d in /bkupgrade /data; do
        [ -L "$d" ] && continue
        if is_mount "$d" && has_space "$d"; then DONOR="$d"; break; fi
      done
    fi
  fi
  if [ -n "$DONOR" ]; then
    REAL_DIR="$DONOR/opt/zesp"
  else
    REAL_DIR="$ROOT_DIR"
  fi
fi

# Родитель каталога установки: из него делается bind на /opt целиком.
SRC_DIR=$(dirname "$REAL_DIR")
INIT=$(detect_init)

# ---------- план ----------
say "arch:    $ARCH ($ASSET)"
say "init:    $INIT"
say "rootfs:  $(root_ro && echo ro || echo rw)"
if [ -n "$DONOR" ]; then
  say "donor:   $DONOR ($(free_kb "$DONOR") KB free)"
  if is_mount "$ROOT_DIR" || is_mount /opt; then
    say "install: $REAL_DIR  (уже смонтировано в $ROOT_DIR)"
  else
    say "install: $REAL_DIR  ->  $ROOT_DIR (bind)"
  fi
else
  say "install: $REAL_DIR"
fi
if [ "$WITH_SERVICE" = 1 ]; then
  case "$INIT" in
    systemd) say "service: /etc/systemd/system/zesp.service" ;;
    procd) say "service: /etc/init.d/zesp (procd)" ;;
    sysv) say "service: /etc/init.d/S99zesp" ;;
    *) say "service: none (no supported init found)" ;;
  esac
fi

if [ "$DRY" = 1 ]; then
  say "dry-run: ничего не менял"
  exit 0
fi

# ---------- защита ----------
[ "$(id -u)" = 0 ] || die "run as root"
if pidof zesp >/dev/null 2>&1 && [ "$FORCE" != 1 ]; then
  die "zesp уже запущен. Обновление делается из веб-интерфейса; для переустановки добавь --force"
fi
if [ "$FORCE" = 1 ] && pidof zesp >/dev/null 2>&1; then
  say "warning: zesp запущен — файлы заменятся, но процесс не перезапустится (нужен restart/обновление из GUI)"
fi

# ---------- скачивание ----------
TMP="$(mktemp -d)" || die "mktemp failed"
trap 'rm -rf "$TMP"' EXIT INT TERM

if [ -n "$LOCAL_TGZ" ]; then
  TAG="${TAG:-local}"
  case "$(basename "$LOCAL_TGZ")" in
    zesp_*) [ "$(basename "$LOCAL_TGZ")" = "$ASSET" ] || say "WARNING: archive $(basename "$LOCAL_TGZ") != detected $ASSET" ;;
  esac
  say "Using local archive: $LOCAL_TGZ"
  cp "$LOCAL_TGZ" "$TMP/pkg.tgz" || die "cannot read $LOCAL_TGZ"
else
  pick_downloader
  # GitHub иногда отдаёт JSON одной строкой — режем запятые в строки,
  # иначе grep хватает всю строку и cut вытаскивает url вместо тега.
  TAG="$(fetch "https://api.github.com/repos/$REPO/releases/latest" - 2>/dev/null | tr ',' '\n' | grep '"tag_name"' | head -1 | cut -d'"' -f4)"
  [ -z "$TAG" ] && die "cannot get latest release (no network? try LOCAL_TGZ offline mode)"
  URL="https://github.com/$REPO/releases/download/$TAG/$ASSET"
  fetch "$URL" "$TMP/pkg.tgz" || die "download failed"
fi
say "Installing ZESP $TAG -> $REAL_DIR"

untgz() { # untgz FILE DEST
  if command -v gzip >/dev/null 2>&1 && gzip -dc "$1" 2>/dev/null | tar -xf - -C "$2"; then return 0; fi
  tar -xzf "$1" -C "$2"
}
untgz "$TMP/pkg.tgz" "$TMP" || die "extract failed (no gzip on box?)"

# ---------- окружение: /opt должен указывать на донор ----------
mkdir -p "$REAL_DIR" || die "cannot create $REAL_DIR"

ensure_mount() {
  [ -n "$DONOR" ] || return 0
  [ "$ROOT_DIR" = "/opt/zesp" ] || return 0
  if is_mount /opt || is_mount "$ROOT_DIR"; then return 0; fi

  was_ro=0
  if root_ro; then
    mount -o remount,rw / || die "cannot remount / rw"
    was_ro=1
  fi
  if empty_dir /opt; then
    mount --bind "$SRC_DIR" /opt || { [ "$was_ro" = 1 ] && mount -o remount,ro / 2>/dev/null; die "cannot bind $SRC_DIR -> /opt"; }
  else
    mkdir -p "$ROOT_DIR"
    mount --bind "$REAL_DIR" "$ROOT_DIR" || { [ "$was_ro" = 1 ] && mount -o remount,ro / 2>/dev/null; die "cannot bind $REAL_DIR -> $ROOT_DIR"; }
  fi
  if [ "$was_ro" = 1 ]; then
    sync
    mount -o remount,ro / 2>/dev/null || say "warning: / stays rw"
  fi
  say "mounted: $ROOT_DIR"
}
ensure_mount

# ---------- файлы ----------
BIN=""
for b in "$TMP"/zesp_linux_* "$TMP"/zesp_openwrt_*; do
  if [ -f "$b" ]; then BIN="$b"; break; fi
done
[ -z "$BIN" ] && die "binary not found in archive"

# Замена через rename: работающий процесс не падает с "Text file busy",
# новый бинарь подхватится при следующем рестарте.
cp "$BIN" "$REAL_DIR/zesp.new" || die "cannot stage binary (no space?)"
chmod 755 "$REAL_DIR/zesp.new"
mv -f "$REAL_DIR/zesp.new" "$REAL_DIR/zesp" || die "cannot replace binary"

# фронт: персональное не трогаем
mkdir -p "$REAL_DIR/desktop"
for src in "$TMP"/desktop/*; do
  base="$(basename "$src")"
  skip=0
  for s in $SKIP; do
    if [ "$base" = "$s" ] && [ -e "$REAL_DIR/desktop/$base" ]; then skip=1; break; fi
  done
  if [ "$skip" = 1 ]; then say "keep personal: $base"; continue; fi
  rm -rf "$REAL_DIR/desktop/$base"
  cp -r "$src" "$REAL_DIR/desktop/$base"
done

# ---------- автозапуск ----------
write_etc() { # write_etc PATH (stdin -> файл), умеет ro-rootfs
  path=$1
  if [ -n "$INIT_OUT" ]; then
    cat > "$INIT_OUT"
    chmod 755 "$INIT_OUT"
    say "init written to $INIT_OUT (test mode)"
    return 0
  fi
  was_ro=0
  if root_ro; then
    mount -o remount,rw / || die "cannot remount / rw"
    was_ro=1
  fi
  cat > "$path"
  chmod 755 "$path"
  # Старые init-скрипты ZESP не должны запускаться параллельно с новым.
  # Бэкап не нужен: это наши же файлы от прежних установок, на чистой системе их нет.
  # Важно удалять, а не переименовывать: имя с префиксом S<NN> всё равно
  # попадёт под маску /etc/init.d/S??* и rcS запустит его.
  if [ -n "$DROP_INIT" ]; then
    for f in $DROP_INIT; do
      [ "/etc/init.d/$f" = "$path" ] && continue
      if [ -f "/etc/init.d/$f" ]; then
        rm -f "/etc/init.d/$f"
        say "old init removed: /etc/init.d/$f"
      fi
    done
  fi
  if [ "$was_ro" = 1 ]; then
    sync
    mount -o remount,ro / 2>/dev/null || say "warning: / stays rw"
  fi
}

SERVICE_START=""
if [ "$WITH_SERVICE" = 1 ]; then
  case "$INIT" in
    systemd)
      cat > /etc/systemd/system/zesp.service <<EOF
[Unit]
Description=ZESP smart home server
After=network.target
[Service]
ExecStart=$REAL_DIR/zesp
WorkingDirectory=$REAL_DIR
Restart=always
RestartSec=5
[Install]
WantedBy=multi-user.target
EOF
      systemctl daemon-reload
      systemctl enable zesp
      SERVICE_START="systemctl start zesp"
      ;;
    procd)
      DROP_INIT="S98zesp S99zesp"
      write_etc /etc/init.d/zesp <<EOF
#!/bin/sh /etc/rc.common
START=99
USE_PROCD=1
start_service() {
	procd_open_instance
	procd_set_param command /bin/sh -c 'cd $REAL_DIR && exec ./zesp'
	procd_set_param respawn 3600 5 0
	procd_set_param stdout 1
	procd_set_param stderr 1
	procd_close_instance
}
EOF
      /etc/init.d/zesp enable 2>/dev/null || true
      SERVICE_START="/etc/init.d/zesp start"
      ;;
    sysv)
      # Как на .151: init сам монтирует /opt, если его нет, и держит процесс.
      DROP_INIT="S98zesp S99zesp"
      write_etc /etc/init.d/S99zesp <<EOF
#!/bin/sh
# ZESP autostart ($TAG)
D=$REAL_DIR
SRC=$SRC_DIR
BIN=/opt/zesp/zesp
PID=/var/run/zesp.pid
LOG=\${ZESP_LOG:-/dev/null}
DELAY=3
_was_ro=0

root_ro() { grep -E ' / [^ ]+ ro[, ]' /proc/mounts >/dev/null 2>&1; }
mounted() { mountpoint -q "\$1" 2>/dev/null || grep -q " \$1 " /proc/mounts; }
alive() { { [ -f "\$PID" ] && kill -0 "\$(cat "\$PID")" 2>/dev/null; } || pidof zesp >/dev/null 2>&1; }

preflight() {
	[ -x "\$BIN" ] && return 0
	if root_ro; then
		_was_ro=1
		mount -o remount,rw / || { echo "zesp: cannot remount / rw" >&2; return 1; }
	fi
	if [ -z "\$(ls -A /opt 2>/dev/null)" ]; then
		mount --bind "\$SRC" /opt || { echo "zesp: cannot bind \$SRC -> /opt" >&2; return 1; }
	else
		mkdir -p /opt/zesp 2>/dev/null
		mount --bind "\$D" /opt/zesp || { echo "zesp: cannot bind \$D -> /opt/zesp" >&2; return 1; }
	fi
	if [ "\$_was_ro" = 1 ]; then
		sync
		mount -o remount,ro / 2>/dev/null || echo "zesp: / stays rw" >&2
	fi
	[ -x "\$BIN" ]
}

supervise() {
	cd "\$D" || exit 1
	while :; do
		"\$BIN" >>"\$LOG" 2>&1
		sleep "\$DELAY"
	done
}

case "\$1" in
start)
	alive && exit 0
	preflight || exit 1
	supervise </dev/null >/dev/null 2>&1 &
	echo \$! >"\$PID"
	sleep 2
	alive && echo "zesp: started (supervisor \$(cat "\$PID"), zesp \$(pidof zesp), log: \$LOG)"
	;;
stop)
	alive && kill "\$(cat "\$PID")" 2>/dev/null && sleep 1
	rm -f "\$PID"
	killall zesp 2>/dev/null
	sleep 1
	killall -9 zesp 2>/dev/null
	echo "zesp: stopped"
	;;
restart) "\$0" stop; "\$0" start ;;
status)
	alive && echo "zesp: running (supervisor \$(cat "\$PID"), zesp \$(pidof zesp))" || echo "zesp: stopped"
	if mounted /opt || mounted /opt/zesp; then echo "zesp: /opt mounted"; else echo "zesp: /opt on rootfs"; fi
	;;
esac
EOF
      SERVICE_START="/etc/init.d/S99zesp start"
      ;;
    *)
      say "no supported init: start manually $REAL_DIR/zesp"
      ;;
  esac
fi

# ---------- старт и проверка ----------
if [ "$NO_START" = 1 ]; then
  say "skip start (--no-start)"
else
  if [ -n "$SERVICE_START" ]; then
    sh -c "$SERVICE_START" || die "start failed"
  else
    (cd "$REAL_DIR" && ./zesp >/dev/null 2>&1 &) || die "start failed"
  fi
  sleep 1
fi

pid=$(pidof zesp 2>/dev/null || true)
if [ -n "$pid" ]; then
  cwd=$(readlink "/proc/$pid/cwd" 2>/dev/null || true)
  say "zesp pid $pid, cwd: ${cwd:-?}"
else
  say "warning: zesp not running"
fi

# Установщик скачан во временный каталог — не оставляем мусор.
case "$0" in
  /tmp/*|/var/tmp/*) rm -f "$0" ;;
esac

say "DONE: $TAG -> $REAL_DIR"
