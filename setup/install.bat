@echo off
setlocal
cd /d "%~dp0\.."
title Blessing Mall SMS Installer
echo.
echo ====================================================
echo   Blessing Mall Supermarket Management System
echo   Windows Laptop Installation
echo ====================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo Installation failed. See messages above.
  pause
  exit /b 1
)
endlocal
