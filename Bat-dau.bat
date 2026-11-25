@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Khong tim thay Node.js. Hay cai Node.js 18 tro len truoc.
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Dang cai thu vien lan dau, vui long cho...
  call npm.cmd install
  if errorlevel 1 (
    echo Cai thu vien that bai. Kiem tra ket noi Internet roi thu lai.
    pause
    exit /b 1
  )
)
echo Dang khoi dong TODO App...
start "TODO App server" /D "%~dp0" cmd /k "npm.cmd start"
timeout /t 3 /nobreak >nul
start "" http://localhost:3002

