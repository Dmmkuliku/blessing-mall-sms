@echo off
setlocal
cd /d "%~dp0\.."
title Prepare USB delivery package
echo Creating DeliveryPackage folder (without node_modules / .next)...
set OUT=%~dp0..\DeliveryPackage
if exist "%OUT%" rmdir /s /q "%OUT%"
mkdir "%OUT%"

robocopy . "%OUT%" /E /XD node_modules .next .git data logs DeliveryPackage .vercel /XF *.db *.db-journal .env
if errorlevel 8 (
  echo Copy failed.
  pause
  exit /b 1
)

echo.
echo Delivery package ready:
echo   %OUT%
echo.
echo Copy that folder to USB, then on the customer laptop run setup\install.bat
echo.
pause
endlocal
