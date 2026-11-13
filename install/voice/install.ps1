# install.ps1 — установка голосовых сервисов ZESP (Windows).
# Сам каталог voice — дистрибутив из репозитория; сюда ничего не ставится.
# Запуск: .\install.ps1              (спросит папку и движки)
#         .\install.ps1 -Dir D:\ZESP\voice -Packages gigaam,vosk
#         .\install.ps1 -Yes -Dir D:\ZESP\voice
param(
    [switch]$Yes,
    [string[]]$Packages = @(),
    [string]$Dir = "",
    [string]$Python = "python"
)
$ErrorActionPreference = "Stop"
# Кириллица в консоли (TUI и сообщения) — иначе PS 5.1 печатает кракозябры.
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch { }
$here = $PSScriptRoot

$pythonExe = (Get-Command $Python -ErrorAction SilentlyContinue)
if (-not $pythonExe) { throw "Python не найден. Установите Python 3.10+ и повторите." }
$pyVersion = (& $Python -c "import sys; print('%d.%d' % sys.version_info[:2])" 2>$null)
if (-not $pyVersion -or [version]$pyVersion -lt [version]"3.10") {
    throw "Нужен Python 3.10+ (найден $pyVersion)"
}

$defaultDir = Join-Path $env:LOCALAPPDATA "ZESP\voice"
if (-not $Dir) {
    if ($Yes) {
        $Dir = $defaultDir
    } else {
        Write-Host ""
        Write-Host "Куда установить сервисы? (Enter — $defaultDir)"
        $answer = Read-Host
        if ($answer -and $answer.Trim()) { $Dir = $answer.Trim() } else { $Dir = $defaultDir }
    }
}
$Dir = [IO.Path]::GetFullPath($Dir)
New-Item -ItemType Directory -Force -Path $Dir, (Join-Path $Dir "models"), (Join-Path $Dir "logs") | Out-Null
$log = Join-Path $Dir "install.log"

function Say($msg) { Write-Host $msg; Add-Content -Path $log -Value ("[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $msg) }

# ── вспомогательные функции установки ────────────────────────────────────────
function Find-PythonVersion($ver) {
    $launcher = Get-Command py -ErrorAction SilentlyContinue
    if ($launcher) {
        $found = & py -$ver -c "import sys; print(sys.executable)" 2>$null
        if ($found) { return $found.Trim() }
    }
    $tag = "Python" + ($ver -replace '\.', '')
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Programs\Python\$tag\python.exe"),
        "C:\Program Files\$tag\python.exe",
        "C:\$tag\python.exe"
    )
    foreach ($c in $candidates) { if (Test-Path $c) { return $c } }
    return $null
}

function Install-Python311 {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw "Для T-one нужен Python 3.11, а winget не найден. Установите Python 3.11 вручную и повторите."
    }
    Say "Python 3.11 не найден — ставлю через winget изолированно."
    Say "  PATH не меняется, py-лаунчер не ставится, системный Python не затрагивается."
    # PrependPath=0 — не менять PATH; Include_launcher=0 — не трогать py.exe;
    # InstallAllUsers=0 — установка только для текущего пользователя.
    & winget install --id Python.Python.3.11 --exact --scope user --silent `
        --accept-package-agreements --accept-source-agreements `
        --override "/quiet InstallAllUsers=0 PrependPath=0 Include_launcher=0 Include_test=0" | Out-Null
    $py = Find-PythonVersion "3.11"
    if (-not $py) {
        throw "Python 3.11 установлен, но python.exe не найден. Проверьте %LOCALAPPDATA%\Programs\Python\Python311."
    }
    Say ("  Python 3.11: " + $py)
    return $py
}

function Read-PackageSelect($items) {
    $defaults = @("gigaam", "vosk", "silero", "silero-vad")
    $checked = @{}
    foreach ($it in $items) { if ($defaults -contains $it.Pkg.id) { $checked[$it.Pkg.id] = $true } }
    $cursor = 0
    $width = [Math]::Max(60, [Console]::WindowWidth - 1)
    $top = [Console]::CursorTop
    $oldVisible = [Console]::CursorVisible
    [Console]::CursorVisible = $false
    try {
        while ($true) {
            [Console]::SetCursorPosition(0, $top)
            $lines = New-Object System.Collections.Generic.List[string]
            $lines.Add("Выберите движки: ↑/↓ — движение, Space — галочка, Enter — установить")
            $lines.Add("A — отметить все, N — снять все, Esc — выход")
            $lines.Add("")
            for ($i = 0; $i -lt $items.Count; $i++) {
                $p = $items[$i].Pkg
                $mark = if ($checked.ContainsKey($p.id)) { "[x]" } else { "[ ]" }
                $prefix = if ($i -eq $cursor) { "> " } else { "  " }
                $line = $prefix + $mark + " " + $p.kind.ToUpper().PadRight(4) + " " + $p.title
                if ($p.note) { $line += "  — " + $p.note }
                if ($line.Length -gt $width) { $line = $line.Substring(0, $width) }
                $lines.Add($line.PadRight($width))
            }
            foreach ($line in $lines) {
                [Console]::Write($line)
                [Console]::Write("`n")
            }
            $key = [Console]::ReadKey($true)
            switch ($key.Key) {
                "UpArrow" { $cursor = ($cursor - 1 + $items.Count) % $items.Count }
                "DownArrow" { $cursor = ($cursor + 1) % $items.Count }
                "Spacebar" {
                    $id = $items[$cursor].Pkg.id
                    if ($checked.ContainsKey($id)) { $checked.Remove($id) } else { $checked[$id] = $true }
                }
                "Enter" {
                    $picked = @()
                    foreach ($it in $items) { if ($checked.ContainsKey($it.Pkg.id)) { $picked += $it } }
                    if ($picked.Count -gt 0) { return $picked }
                }
                "A" { foreach ($it in $items) { $checked[$it.Pkg.id] = $true } }
                "N" { $checked.Clear() }
                "Escape" { throw "Установка отменена" }
                "Q" { throw "Установка отменена" }
            }
        }
    } finally {
        [Console]::CursorVisible = $oldVisible
    }
}

Say "Каталог установки: $Dir"
Say ("Python: " + (& $Python --version 2>&1))

# ── выбор пакетов ────────────────────────────────────────────────────────────
$catalog = Get-ChildItem (Join-Path $here "packages\*.json") | ForEach-Object {
    $p = [IO.File]::ReadAllText($_.FullName, [Text.Encoding]::UTF8) | ConvertFrom-Json
    [pscustomobject]@{ File = $_.FullName; Pkg = $p }
}
# На Windows показываем только пакеты с поддержкой windows (T-one теперь умеет
# beam + KenLM через отдельный venv на Python 3.11).
$catalog = @($catalog | Where-Object { -not $_.Pkg.platforms -or ($_.Pkg.platforms -contains "windows") })

$selected = @()
if ($Packages.Count -gt 0) {
    $wanted = @($Packages | ForEach-Object { $_ -split '[,\s]+' } | Where-Object { $_ })
    $selected = $catalog | Where-Object { $wanted -contains $_.Pkg.id }
} elseif ($Yes) {
    $selected = $catalog | Where-Object { $_.Pkg.id -in @("gigaam", "vosk", "silero") }
} elseif ([Console]::IsInputRedirected -or [Console]::IsOutputRedirected) {
    # Нет интерактивного терминала (IDE, перенаправленный вывод) — номера.
    Say ""
    Say "Доступные движки:"
    for ($i = 0; $i -lt $catalog.Count; $i++) {
        $p = $catalog[$i].Pkg
        $line = "  " + ($i + 1) + ") " + $p.kind + "  " + $p.title
        if ($p.note) { $line += "  — " + $p.note }
        Say $line
    }
    Say ""
    Say "Введите номера через запятую (Enter — gigaam, vosk, silero):"
    $answer = Read-Host
    if (-not $answer.Trim()) {
        $selected = $catalog | Where-Object { $_.Pkg.id -in @("gigaam", "vosk", "silero") }
    } else {
        $idx = $answer.Split(",") | ForEach-Object { [int]$_.Trim() - 1 }
        $selected = $idx | ForEach-Object { $catalog[$_] }
    }
} else {
    Say ""
    $selected = Read-PackageSelect $catalog
    Say ""
}
if (-not $selected) {
    throw ("Ничего не выбрано. Доступно: " + (($catalog | ForEach-Object { $_.Pkg.id }) -join ", "))
}
Say ("Выбрано: " + (($selected | ForEach-Object { $_.Pkg.id }) -join ", "))

# ── окружение ────────────────────────────────────────────────────────────────
$venv = Join-Path $Dir "venv"
$vpy = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path $vpy)) {
    Say "Создаю venv…"
    & $Python -m venv $venv
}
Say "Обновляю pip…"
& $vpy -m pip install --upgrade pip --quiet
Say "Общие зависимости (aiohttp, numpy, soundfile, soxr, PyAV, zeroconf)…"
$commonPkgs = @("aiohttp", "numpy", "soundfile", "soxr", "av", "zeroconf")
& $vpy -m pip install @commonPkgs --quiet

# Пакету может понадобиться своя версия Python: kenlm (T-one) не собирается
# на 3.13, ему нужен 3.11. Тогда создаём отдельный venv из поля install.venv.
function Get-PkgPython($p) {
    $venvName = $p.install.venv
    if (-not $venvName) { return $vpy }
    $pv = Join-Path $Dir $venvName
    $pvpy = Join-Path $pv "Scripts\python.exe"
    if (Test-Path $pvpy) { return $pvpy }
    $want = $p.install.python
    if (-not $want) {
        & $Python -m venv $pv
        return $pvpy
    }
    $basePy = Find-PythonVersion $want
    if (-not $basePy) {
        if ($want -eq "3.11") {
            $basePy = Install-Python311
        } else {
            throw ("Для " + $p.id + " нужен Python " + $want + ". Установите его вручную и повторите.")
        }
    }
    Say ("  отдельный venv для " + $p.id + " на Python " + $want + " (" + $basePy + ")")
    & $basePy -m venv $pv
    & $pvpy -m pip install --upgrade pip --quiet
    & $pvpy -m pip install @commonPkgs --quiet
    return $pvpy
}

foreach ($item in $selected) {
    $p = $item.Pkg
    Say ("Устанавливаю " + $p.id + "…")
    if ($p.id -eq "tone") {
        try {
            $free = (Get-Item $Dir).PSDrive.Free
            if ($free -and $free -lt 8GB) {
                Say ("  Внимание: свободно " + [math]::Round($free / 1GB, 1) + " ГБ, для T-one нужно ~5,5 ГБ.")
            }
        } catch { }
    }
    $pkgPy = Get-PkgPython $p
    foreach ($pkg in @($p.install.pip)) {
        if ($pkg) { & $pkgPy -m pip install $pkg --quiet }
    }
    foreach ($pkg in @($p.install.pipNoDeps)) {
        if ($pkg) { & $pkgPy -m pip install $pkg --no-deps --quiet }
    }
    foreach ($git in @($p.install.pipGit)) {
        if ($git) { & $pkgPy -m pip install ("git+" + $git) --quiet }
    }
    # модели
    foreach ($dl in @($p.install.download)) {
        if (-not $dl) { continue }
        $targetDir = $Dir
        if ($dl.dir) { $targetDir = Join-Path $Dir $dl.dir }
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
        $target = Join-Path $targetDir $dl.file
        if (-not (Test-Path $target)) {
            Say ("  скачиваю " + $dl.url)
            Invoke-WebRequest -Uri $dl.url -OutFile $target -UseBasicParsing
        }
        if ($dl.unzipDir) {
            $dest = Join-Path $Dir $dl.unzipDir
            $marker = Join-Path $dest ".installed"
            if (-not (Test-Path $marker)) {
                Say ("  распаковываю " + $dl.file)
                Expand-Archive -Path $target -DestinationPath $dest -Force
                New-Item -ItemType File -Force -Path $marker | Out-Null
            }
        }
    }
}

# ── скрипты и конфиг ─────────────────────────────────────────────────────────
Copy-Item (Join-Path $here "*.py") $Dir -Force
if (Test-Path (Join-Path $here "*.dll")) {
    Copy-Item (Join-Path $here "*.dll") $Dir -Force
}

# services.json генерирует Python: PowerShell 5.1 портит кириллицу при
# чтении/записи JSON (UTF-8 без BOM читается как ANSI).
$ids = @($selected | ForEach-Object { $_.Pkg.id })
& $vpy (Join-Path $here "gen_services.py") @ids --out (Join-Path $Dir "services.json")
if ($LASTEXITCODE -ne 0) { throw "gen_services.py завершился с ошибкой" }
# ── запуск и автозапуск ──────────────────────────────────────────────────────
$run = Join-Path $Dir "start_voice.ps1"
$lines = @('$ErrorActionPreference = "Stop"', ('Set-Location "{0}"' -f $Dir))
# Остановить прежние процессы этого каталога (venv), иначе второй экземпляр
# займёт порт и первый упадёт.
$lines += 'Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*$PSScriptRoot\venv*" -and $_.ProcessId -ne $PID } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }'
foreach ($item in $selected) {
    $p = $item.Pkg
    $pkgPy = Get-PkgPython $p
    $lines += ('$env:PORT = "{0}"' -f $p.port)
    foreach ($kv in $p.env.PSObject.Properties) { $lines += ('$env:{0} = "{1}"' -f $kv.Name, $kv.Value) }
    foreach ($dl in @($p.install.download)) {
        if ($dl -and $dl.env) {
            $val = if ($dl.envValue) { Join-Path $Dir $dl.envValue } else { Join-Path $Dir $dl.file }
            $lines += ('$env:{0} = "{1}"' -f $dl.env, $val)
        }
    }
    $lines += ('Start-Process -FilePath "{0}" -ArgumentList "{1}" -WorkingDirectory "{2}" -WindowStyle Hidden -RedirectStandardOutput "logs\{3}.out" -RedirectStandardError "logs\{3}.err"' -f $pkgPy, $p.server, $Dir, $p.id)
    $lines += 'Start-Sleep -Milliseconds 300'
}
$lines += ('Start-Process -FilePath "{0}" -ArgumentList "announce.py --config services.json --log logs\announce.log" -WorkingDirectory "{1}" -WindowStyle Hidden' -f $vpy, $Dir)
$lines | Set-Content $run -Encoding UTF8

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $run)
$trigger = New-ScheduledTaskTrigger -AtStartup
try {
    Register-ScheduledTask -TaskName "ZESP voice" -Action $action -Trigger $trigger -RunLevel Highest -Force -ErrorAction Stop | Out-Null
    Say "Автозапуск: планировщик задач «ZESP voice»."
} catch {
    # Без прав администратора — ярлык в автозагрузке пользователя (после входа).
    $startup = [Environment]::GetFolderPath("Startup")
    $lnk = Join-Path $startup "ZESP voice.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($lnk)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $run)
    $shortcut.WorkingDirectory = $Dir
    $shortcut.Save()
    Say "Автозапуск: ярлык в «Автозагрузке» (без администратора — после входа в систему)."
}

Say "Запускаю…"
$busy = Get-NetTCPConnection -State Listen -LocalPort 8099 -ErrorAction SilentlyContinue | Select-Object -First 1
if ($busy) {
    $owner = Get-Process -Id $busy.OwningProcess -ErrorAction SilentlyContinue
    $ownerCmd = ""
    if ($owner) {
        try { $ownerCmd = (Get-CimInstance Win32_Process -Filter ("ProcessId=" + $owner.Id) -ErrorAction SilentlyContinue).CommandLine } catch { }
    }
    if ($ownerCmd -and ($ownerCmd -like ("*" + $Dir + "*"))) {
        Say "Порт 8099 занимает предыдущий анонсер этого каталога — перезапускаю."
    } elseif ($owner) {
        Say ("Внимание: порт 8099 слушает " + $owner.ProcessName + " (PID " + $owner.Id + ") из другого каталога. Остановите его вручную.")
    }
}
Start-Process -FilePath "powershell.exe" -ArgumentList ('-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "{0}"' -f $run) -WindowStyle Hidden
Start-Sleep -Seconds 5

Say ""
$manifestOK = $false
for ($attempt = 1; $attempt -le 15; $attempt++) {
    try {
        $m = Invoke-RestMethod "http://127.0.0.1:8099/manifest.json" -TimeoutSec 3
        $notReady = @($m.services | Where-Object { $_.state -ne "running" })
        if ($notReady.Count -eq 0) {
            Say ("Манифест OK: " + $m.name + ", сервисов " + @($m.services).Count)
            foreach ($svc in @($m.services)) { Say ("  " + $svc.id + " (" + $svc.kind + ") state=" + $svc.state) }
            $manifestOK = $true
            break
        }
        Say ("Ожидаю: " + (($notReady | ForEach-Object { $_.id + "=" + $_.state }) -join ", "))
    } catch {
        # анонсер ещё не поднял HTTP
    }
    Start-Sleep -Seconds 3
}
if (-not $manifestOK) {
    Say "Манифест пока не отвечает. Смотрите логи: " + (Join-Path $Dir "logs\announce.log")
}

Say ""
Say "Готово. Проверьте: http://127.0.0.1:8099/manifest.json"
Say "В ZESP: Кластер → Сервисы (появится в течение ~10 секунд)."
