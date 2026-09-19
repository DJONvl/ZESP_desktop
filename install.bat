@echo off
rem ZESP installer (Windows): последний релиз с GitHub -> C:\ZESP (или %1).
rem Скачай https://raw.githubusercontent.com/DJONvl/ZESP_desktop/master/install.bat и запусти.
rem Требует PowerShell (есть в Windows 7+). Токен не нужен (репо публичный).
rem Персональное (jsconfig.txt, devicesjs.txt, Devices/, сцены...) не затирается.
setlocal
set REPO=DJONvl/ZESP_desktop
if "%~1"=="" ( set INSTALL_DIR=C:\ZESP ) else ( set INSTALL_DIR=%~1 )

rem --- архитектура ---
if /i "%PROCESSOR_ARCHITECTURE%"=="AMD64" set ASSET=zesp_windows_x64.zip
if /i "%PROCESSOR_ARCHITECTURE%"=="X86" set ASSET=zesp_windows_x86.zip
if not defined ASSET (
    echo Unsupported architecture: %PROCESSOR_ARCHITECTURE% >&2
    exit /b 1
)

rem --- последний релиз ---
for /f "usebackq delims=" %%T in (`powershell -noprofile -command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; (Invoke-RestMethod https://api.github.com/repos/%REPO%/releases/latest).tag_name"`) do set TAG=%%T
if not defined TAG (
    echo Cannot get latest release ^(network/api^) >&2
    exit /b 1
)
echo Installing ZESP %TAG% (%ASSET%) to %INSTALL_DIR%

set TMPDIR=%TEMP%\zesp-install
rmdir /s /q "%TMPDIR%" 2>nul
mkdir "%TMPDIR%"
powershell -noprofile -command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest https://github.com/%REPO%/releases/download/%TAG%/%ASSET% -OutFile '%TMPDIR%\pkg.zip'"
if errorlevel 1 (
    echo Download failed >&2
    exit /b 1
)
powershell -noprofile -command "Expand-Archive '%TMPDIR%\pkg.zip' -DestinationPath '%TMPDIR%\pkg' -Force"
if errorlevel 1 (
    echo Extract failed >&2
    exit /b 1
)

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%" 2>nul
if not exist "%INSTALL_DIR%" (
    echo No write access to %INSTALL_DIR% - run as admin or pass another path: install.bat D:\ZESP >&2
    exit /b 1
)
rem бинарь и стартер всегда свежие (если сервер запущен — сначала останови)
copy /y "%TMPDIR%\pkg\zesp_*.exe" "%INSTALL_DIR%\" >nul
if errorlevel 1 (
    echo Cannot replace binary - stop running ZESP first >&2
    exit /b 1
)
copy /y "%TMPDIR%\pkg\zesp_start.bat" "%INSTALL_DIR%\" >nul

rem фронт: персональное не затирать, остальное синкнуть
powershell -noprofile -command "$skip=@('jsconfig.txt','devicesjs.txt','Devices','scenes.json','groups.json','location.json','workspace.xml'); Get-ChildItem '%TMPDIR%\pkg\desktop' | ForEach-Object { $d=Join-Path '%INSTALL_DIR%\desktop' $_.Name; if (($skip -contains $_.Name) -and (Test-Path $d)) { 'keep personal: '+$_.Name } else { Remove-Item $d -Recurse -Force -ErrorAction SilentlyContinue; Copy-Item $_.FullName $d -Recurse -Force } }"

rem ярлык на стартер (точка входа с супервизором и автообновлением)
powershell -noprofile -command "$w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut($env:USERPROFILE+'\Desktop\ZESP.lnk'); $s.TargetPath='%INSTALL_DIR%\zesp_start.bat'; $s.WorkingDirectory='%INSTALL_DIR%'; $s.Save()"
rmdir /s /q "%TMPDIR%" 2>nul

echo DONE: %INSTALL_DIR% (%TAG%)
echo Start with ZESP shortcut on Desktop or %INSTALL_DIR%\zesp_start.bat
