#!/usr/bin/env bash
# install.sh — установка голосовых сервисов ZESP (Linux).
# Сам каталог voice — дистрибутив из репозитория; сюда ничего не ставится.
#   ./install.sh                       спросит папку и движки
#   DIR=/srv/zesp-voice ./install.sh   папка задана
#   YES=1 PACKAGES="gigaam vosk" ./install.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PYTHON="${PYTHON:-python3}"

"$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' \
    || { echo "Нужен Python 3.10+"; exit 1; }

if [ -z "${DIR:-}" ]; then
    if [ "${YES:-0}" = "1" ]; then
        DIR="$HOME/zesp-voice"
    else
        echo
        echo "Куда установить сервисы? (Enter — $HOME/zesp-voice)"
        read -r answer
        DIR="${answer:-$HOME/zesp-voice}"
    fi
fi
mkdir -p "$DIR"
DIR="$(cd "$DIR" && pwd)"
VENV="$DIR/venv"
VPY="$VENV/bin/python"
mkdir -p "$DIR/models" "$DIR/logs"

mapfile -t ALL_IDS < <(find "$HERE/packages" -name '*.json' -printf '%f\n' | sed 's/\.json$//' | sort)

choose() {
    if [ -n "${PACKAGES:-}" ]; then
        # shellcheck disable=SC2206
        IDS=($PACKAGES)
    elif [ "${YES:-0}" = "1" ]; then
        IDS=(gigaam vosk silero)
    else
        echo "Доступные движки:"
        local i=1 id
        for id in "${ALL_IDS[@]}"; do
            local title note
            title="$("$PYTHON" -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("kind","").upper(), d.get("title", d.get("id")))' "$HERE/packages/$id.json")"
            note="$("$PYTHON" -c 'import json,sys; d=json.load(open(sys.argv[1])); print(d.get("note",""))' "$HERE/packages/$id.json")"
            if [ -n "$note" ]; then
                echo "  $i) $title — $note"
            else
                echo "  $i) $title"
            fi
            i=$((i + 1))
        done
        echo
        echo "Введите номера через запятую (Enter — gigaam, vosk, silero):"
        read -r answer
        if [ -z "${answer// /}" ]; then
            IDS=(gigaam vosk silero)
        else
            IDS=()
            local n
            IFS=',' read -ra nums <<< "$answer"
            for n in "${nums[@]}"; do
                n="$(echo "$n" | tr -d ' ')"
                IDS+=("${ALL_IDS[$((n - 1))]}")
            done
        fi
    fi
    [ "${#IDS[@]}" -gt 0 ] || { echo "Ничего не выбрано"; exit 1; }
    echo "Выбрано: ${IDS[*]}"
}

choose

if [ ! -x "$VPY" ]; then
    echo "Создаю venv…"
    "$PYTHON" -m venv "$VENV"
fi
"$VPY" -m pip install --upgrade pip --quiet
echo "Общие зависимости…"
COMMON=(aiohttp numpy soundfile soxr av zeroconf)
"$VPY" -m pip install --quiet "${COMMON[@]}"

# Пакету может понадобиться своя версия Python: kenlm (T-one) не собирается
# на 3.13, ему нужен 3.11. Тогда создаём отдельный venv из поля install.venv.
pkg_python() { # pkg_python <json> -> путь к python пакета
    local pkg="$1" venv_name python_ver pv pvpy base
    venv_name="$("$PYTHON" -c 'import json,sys; print((json.load(open(sys.argv[1],encoding="utf-8")).get("install") or {}).get("venv",""))' "$pkg")"
    [ -n "$venv_name" ] || { echo "$VPY"; return; }
    pv="$DIR/$venv_name"
    pvpy="$pv/bin/python"
    [ -x "$pvpy" ] && { echo "$pvpy"; return; }
    python_ver="$("$PYTHON" -c 'import json,sys; print((json.load(open(sys.argv[1],encoding="utf-8")).get("install") or {}).get("python",""))' "$pkg")"
    base="$PYTHON"
    if [ -n "$python_ver" ]; then
        base="python$python_ver"
        if ! command -v "$base" >/dev/null 2>&1; then
            if command -v apt-get >/dev/null 2>&1; then
                echo "  $base не найден — ставлю через apt-get…" >&2
                sudo apt-get update -qq || true
                sudo apt-get install -y "$base" "$base-venv" || true
            fi
        fi
        command -v "$base" >/dev/null 2>&1 || { echo "Для пакета нужен $base" >&2; exit 1; }
    fi
    echo "  отдельный venv $venv_name ($base)" >&2
    "$base" -m venv "$pv"
    "$pvpy" -m pip install --upgrade pip --quiet
    "$pvpy" -m pip install --quiet "${COMMON[@]}"
    echo "$pvpy"
}

json_list() { # json_list <file> <dotted path> -> строки массива
    "$PYTHON" - "$1" "$2" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
for key in sys.argv[2].split("."):
    data = data.get(key) if isinstance(data, dict) else None
if isinstance(data, str):
    data = [data]
for item in data or []:
    print(item)
PY
}

json_fields() { # json_fields <file> <dotted path> <field,...> -> TSV
    "$PYTHON" - "$1" "$2" "$3" <<'PY'
import json, sys
data = json.load(open(sys.argv[1], encoding="utf-8"))
for key in sys.argv[2].split("."):
    data = data.get(key) if isinstance(data, dict) else None
if isinstance(data, str):
    data = [data]
fields = sys.argv[3].split(",")
for item in data or []:
    print("\t".join(str(item.get(f, "")) for f in fields))
PY
}

for id in "${IDS[@]}"; do
    pkg="$HERE/packages/$id.json"
    [ -f "$pkg" ] || { echo "Нет пакета $id"; exit 1; }
    echo "Устанавливаю $id…"
    PKGPY="$(pkg_python "$pkg")"
    while IFS= read -r line; do
        [ -n "$line" ] && "$PKGPY" -m pip install "$line" --quiet
    done < <(json_list "$pkg" "install.pip")
    while IFS= read -r line; do
        [ -n "$line" ] && "$PKGPY" -m pip install "$line" --no-deps --quiet
    done < <(json_list "$pkg" "install.pipNoDeps")
    while IFS= read -r line; do
        [ -n "$line" ] && "$PKGPY" -m pip install "git+$line" --quiet
    done < <(json_list "$pkg" "install.pipGit")

    while IFS=$'\t' read -r url file dl_dir unzip_dir env_name env_value; do
        [ -n "$url" ] || continue
        if [ -n "$dl_dir" ]; then
            mkdir -p "$DIR/$dl_dir"
            target="$DIR/$dl_dir/$file"
        else
            target="$DIR/$file"
        fi
        if [ ! -f "$target" ]; then
            echo "  скачиваю $url"
            curl -L --fail --output "$target" "$url"
        fi
        if [ -n "$unzip_dir" ]; then
            dest="$DIR/$unzip_dir"
            if [ ! -f "$dest/.installed" ]; then
                echo "  распаковываю $file"
                mkdir -p "$dest"
                unzip -q -o "$target" -d "$dest"
                touch "$dest/.installed"
            fi
        fi
    done < <(json_fields "$pkg" "install.download" "url,file,dir,unzipDir,env,envValue")
done

cp "$HERE"/*.py "$DIR"/
cp "$HERE"/*.dll "$DIR"/ 2>/dev/null || true
"$PYTHON" "$HERE/gen_services.py" "${IDS[@]}" --out "$DIR/services.json"

# ── запуск и автозапуск ─────────────────────────────────────────────────────
RUN="$DIR/start_voice.sh"
{
    echo '#!/usr/bin/env bash'
    echo 'set -euo pipefail'
    echo "cd \"$DIR\""
    echo "pkill -f \"$DIR/venv\" 2>/dev/null || true"
    for id in "${IDS[@]}"; do
        pkg="$HERE/packages/$id.json"
        PKGPY="$(pkg_python "$pkg")"
        echo "export PORT=$("$PYTHON" -c 'import json,sys; print(json.load(open(sys.argv[1]))["port"])' "$pkg")"
        while IFS='=' read -r key value; do
            [ -n "$key" ] && echo "export $key=\"$value\""
        done < <("$PYTHON" - "$pkg" <<'PY'
import json, sys
d = json.load(open(sys.argv[1], encoding="utf-8"))
for k, v in (d.get("env") or {}).items():
    print(f"{k}={v}")
PY
)
        while IFS=$'\t' read -r url file dl_dir unzip_dir env_name env_value; do
            [ -n "$env_name" ] || continue
            if [ -n "$env_value" ]; then
                echo "export $env_name=\"$DIR/$env_value\""
            elif [ -n "$dl_dir" ]; then
                echo "export $env_name=\"$DIR/$dl_dir/$file\""
            else
                echo "export $env_name=\"$DIR/$file\""
            fi
        done < <(json_fields "$pkg" "install.download" "url,file,dir,unzipDir,env,envValue")
        echo "\"$PKGPY\" \"$DIR/$("$PYTHON" -c 'import json,sys; print(json.load(open(sys.argv[1]))["server"])' "$pkg")\" >> \"$DIR/logs/$id.log\" 2>&1 &"
    done
    echo "\"$VPY\" \"$DIR/announce.py\" --config services.json --log logs/announce.log &"
    echo 'wait'
} > "$RUN"
chmod +x "$RUN"

if command -v systemctl >/dev/null 2>&1; then
    unit_dir="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
    mkdir -p "$unit_dir"
    cat > "$unit_dir/zesp-voice.service" <<EOF
[Unit]
Description=ZESP voice services (TTS/ASR)
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$DIR
ExecStart=/bin/bash $RUN
Restart=on-failure

[Install]
WantedBy=default.target
EOF
    systemctl --user daemon-reload || true
    systemctl --user enable --now zesp-voice.service || true
    echo "Автозапуск: systemd user unit zesp-voice.service"
else
    echo "systemd не найден: запустите $RUN вручную или добавьте в автозапуск."
fi

nohup bash "$RUN" >"$DIR/logs/all.log" 2>&1 &
sleep 3
echo
echo "Готово. Проверьте: http://127.0.0.1:8099/manifest.json"
echo "В ZESP: Кластер → Сервисы (появится в течение ~10 секунд)."
