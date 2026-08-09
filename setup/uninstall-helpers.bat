@echo off
setlocal
cd /d "%~dp0\.."
title Uninstall helpers - Blessing Mall SMS
echo This removes Desktop shortcut and stops the running server.
echo Application files are NOT deleted.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$desk=[Environment]::GetFolderPath('Desktop'); $lnk=Join-Path $desk 'Blessing Mall SMS.lnk'; if (Test-Path $lnk) { Remove-Item $lnk -Force; Write-Host 'Desktop shortcut removed.' } else { Write-Host 'No desktop shortcut found.' }; Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Write-Host 'Stopped process on port 3000 (if any).'"
echo.
pause
endlocal
