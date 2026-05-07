@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0backend"

set "UV_LOCAL=%USERPROFILE%\.local\bin\uv.exe"
set "UV_CMD="
where uv >nul 2>&1
if not errorlevel 1 set "UV_CMD=uv"
if not defined UV_CMD if exist "%UV_LOCAL%" set "UV_CMD=%UV_LOCAL%"
if not defined UV_CMD (
  echo ERROR: uv를 찾을 수 없습니다. setup.bat 을 먼저 실행하세요.
  pause
  exit /b 1
)

start "" http://localhost:8066

call !UV_CMD! run uvicorn main:app --port 8066

echo.
echo === uvicorn 종료됨 ===
pause
