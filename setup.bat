@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo === AgentLoop Setup ===
echo.

REM --- Python 탐색 (py launcher 우선, MS Store stub 회피) ---
set "PY_CMD="
where py >nul 2>&1
if not errorlevel 1 set "PY_CMD=py -3"
if not defined PY_CMD (
  where python >nul 2>&1
  if not errorlevel 1 set "PY_CMD=python"
)
if not defined PY_CMD (
  echo ERROR: Python을 찾을 수 없습니다.
  echo        https://www.python.org/downloads/ 에서 Python 3.13+ 설치 후 다시 시도하세요.
  echo        ^(설치 시 "Add python.exe to PATH" 체크 필수^)
  pause
  exit /b 1
)

%PY_CMD% -c "import sys; sys.exit(0 if sys.version_info >= (3, 13) else 1)" >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python 3.13 이상이 필요합니다. 현재 버전:
  %PY_CMD% --version
  pause
  exit /b 1
)
echo Python OK:
%PY_CMD% --version

REM --- uv 탐색 (PATH → 표준 설치 경로 fallback) ---
set "UV_LOCAL=%USERPROFILE%\.local\bin\uv.exe"
set "UV_CMD="
where uv >nul 2>&1
if not errorlevel 1 set "UV_CMD=uv"
if not defined UV_CMD if exist "%UV_LOCAL%" set "UV_CMD=%UV_LOCAL%"
if not defined UV_CMD (
  echo uv가 설치되어 있지 않습니다. 자동 설치 진행 중...
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  if errorlevel 1 (
    echo ERROR: uv 자동 설치에 실패했습니다.
    pause
    exit /b 1
  )
  if exist "%UV_LOCAL%" (
    set "UV_CMD=%UV_LOCAL%"
  ) else (
    echo uv 설치는 완료되었으나 PATH 갱신을 위해 새 콘솔이 필요합니다.
    echo 이 창을 닫고 setup.bat 을 다시 실행하세요.
    pause
    exit /b 0
  )
)
echo uv OK: !UV_CMD!
echo.

echo [1/2] Backend 의존성 설치 중...
pushd backend
call !UV_CMD! sync
set "RC=!errorlevel!"
popd
if not "!RC!"=="0" (
  echo ERROR: uv sync 실패 ^(exit code !RC!^)
  pause
  exit /b !RC!
)
echo.

if not exist "frontend\dist" (
  where node >nul 2>&1
  if errorlevel 1 (
    echo ERROR: frontend\dist 가 없고 Node.js도 설치되어 있지 않습니다.
    echo        빌드된 frontend\dist 가 포함된 릴리스 ZIP을 받거나 Node.js 18+ 설치 후 다시 시도하세요.
    pause
    exit /b 1
  )
  echo [2/2] Frontend 빌드 중...
  pushd frontend
  call npm install
  call npm run build
  popd
) else (
  echo [2/2] frontend\dist 가 이미 존재합니다. 빌드를 건너뜁니다.
)

echo.
echo === 셋업 완료. start.bat 으로 실행하세요. ===
pause
