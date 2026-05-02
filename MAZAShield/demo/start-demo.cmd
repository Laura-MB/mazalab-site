@echo off
rem MAZALab Mother Brain - Gaming Demo launcher (double-click friendly).
rem Delegates to start-demo.ps1 with a bypass so no policy tweak is needed.
setlocal
set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-demo.ps1" %*
endlocal
