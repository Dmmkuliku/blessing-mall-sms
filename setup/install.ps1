#Requires -Version 5.1
<#
.SYNOPSIS
  Installs Blessing Mall Supermarket Management System on a Windows laptop.
#>
param(
  [switch]$SkipBuild,
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root "package.json"))) {
  $Root = $PSScriptRoot
  if (-not (Test-Path (Join-Path $Root "package.json"))) {
    throw "Could not locate the Blessing Mall project folder."
  }
}

function Write-Step($msg) {
  Write-Host ""
  Write-Host "==> $msg" -ForegroundColor Cyan
}

function New-Secret([int]$Length = 48) {
  $bytes = New-Object byte[] $Length
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return ([Convert]::ToBase64String($bytes) -replace "[^a-zA-Z0-9]", "X").Substring(0, [Math]::Min($Length, 64))
}

Set-Location $Root
Write-Host ""
Write-Host "Blessing Mall SMS — Laptop Installation" -ForegroundColor Green
Write-Host ("=" * 48)
Write-Host "Install folder: $Root"

Write-Step "Checking Node.js"
$node = Get-Command node -ErrorAction SilentlyContinue
$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $node -or -not $npm) {
  Write-Host @"

Node.js was not found on this computer.
1. Download Node.js LTS (20 or newer): https://nodejs.org/
2. Install it, then restart this installer.
"@ -ForegroundColor Yellow
  Start-Process "https://nodejs.org/"
  exit 1
}

$nodeVersion = (& node -v).Trim()
Write-Host "Found Node.js $nodeVersion"
$major = [int]($nodeVersion -replace "^v","").Split(".")[0]
if ($major -lt 18) {
  throw "Node.js 18+ is required. Current version: $nodeVersion"
}

Write-Step "Creating local data folder"
$dataDir = Join-Path $Root "data"
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root "logs") | Out-Null

Write-Step "Writing secure environment file"
$envPath = Join-Path $Root ".env"
$secret = New-Secret
@"
# Blessing Mall SMS — local laptop installation
DATABASE_URL="file:../data/blessing-mall.db"
AUTH_SECRET="$secret"
NEXT_PUBLIC_SHOP_NAME="Blessing Mall"
NEXT_PUBLIC_CURRENCY="TZS"
PORT=$Port
HOSTNAME=127.0.0.1
"@ | Set-Content -Path $envPath -Encoding UTF8
Write-Host "Created .env with a unique AUTH_SECRET"

Write-Step "Installing dependencies (this may take several minutes)"
npm ci
if ($LASTEXITCODE -ne 0) {
  Write-Host "npm ci failed — trying npm install..." -ForegroundColor Yellow
  npm install
  if ($LASTEXITCODE -ne 0) { throw "Dependency installation failed." }
}

Write-Step "Preparing database"
npx prisma generate
if ($LASTEXITCODE -ne 0) { throw "Prisma generate failed." }
npx prisma db push
if ($LASTEXITCODE -ne 0) { throw "Database setup failed." }
npx tsx prisma/seed-delivery.ts
if ($LASTEXITCODE -ne 0) { throw "Database seed failed." }

if (-not $SkipBuild) {
  Write-Step "Building the application"
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Application build failed." }
}

Write-Step "Creating Start / Stop launchers"
$startBat = Join-Path $Root "START Blessing Mall.bat"
$stopBat = Join-Path $Root "STOP Blessing Mall.bat"
@"
@echo off
cd /d "%~dp0"
title Blessing Mall SMS
echo Starting Blessing Mall Supermarket Management System...
echo Open http://127.0.0.1:$Port in your browser if it does not open automatically.
echo Keep this window open while using the system.
echo.
if not exist ".next\" (
  echo ERROR: Application is not built. Run setup\install.bat first.
  pause
  exit /b 1
)
start "" "http://127.0.0.1:$Port/setup"
set PORT=$Port
set HOSTNAME=127.0.0.1
call npm run start
pause
"@ | Set-Content -Path $startBat -Encoding ASCII

@"
@echo off
title Stop Blessing Mall SMS
echo Stopping Blessing Mall on port $Port...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :$Port ^| findstr LISTENING') do (
  taskkill /PID %%a /F >nul 2>&1
)
echo Done.
timeout /t 2 >nul
"@ | Set-Content -Path $stopBat -Encoding ASCII

Write-Step "Creating Desktop shortcut"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "Blessing Mall SMS.lnk"
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut($shortcutPath)
$sc.TargetPath = $startBat
$sc.WorkingDirectory = $Root
$sc.WindowStyle = 1
$sc.Description = "Start Blessing Mall Supermarket Management System"
$sc.Save()
Write-Host "Desktop shortcut created: $shortcutPath"

$marker = Join-Path $Root "data\INSTALL_COMPLETE.txt"
@"
Blessing Mall SMS installed successfully.
Installed at: $(Get-Date -Format "yyyy-MM-dd HH:mm")
Folder: $Root
Port: $Port

Next steps:
1. Double-click "START Blessing Mall.bat" or the Desktop shortcut.
2. Complete the first-run setup in the browser.
3. Change all temporary passwords after handover.
"@ | Set-Content -Path $marker -Encoding UTF8

Write-Host ""
Write-Host "Installation complete." -ForegroundColor Green
Write-Host @"

How to use:
  1. Double-click "START Blessing Mall.bat" (or the Desktop shortcut)
  2. Finish First-Run Setup in the browser
  3. Sign in with the owner account you create during setup

Temporary training accounts (change after handover):
  owner@blessingmall.co.tz / ChangeMe#2026
  manager@blessingmall.co.tz / ChangeMe#2026
  attendant@blessingmall.co.tz / ChangeMe#2026

Documentation:
  docs\INSTALLATION_GUIDE.md
  docs\USER_MANUAL.md
  docs\DELIVERY_CHECKLIST.md
"@
Write-Host "Press Enter to close..."
[void][System.Console]::ReadLine()
