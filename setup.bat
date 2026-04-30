@echo off
setlocal
cd /d %~dp0

where python >nul 2>&1
if errorlevel 1 (
  echo ERROR: Python 3.13+ 가 필요합니다. https://www.python.org/downloads/ 에서 설치하세요.
  pause
  exit /b 1
)

where uv >nul 2>&1
if errorlevel 1 (
  echo uv가 설치되어 있지 않습니다. 자동 설치합니다...
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  if errorlevel 1 (
    echo ERROR: uv 자동 설치에 실패했습니다.
    pause
    exit /b 1
  )
  echo uv 설치 완료. 이 창을 닫고 setup.bat 을 다시 실행하세요.
  pause
  exit /b 0
)

echo [1/2] Backend 의존성 설치 중...
cd backend
call uv sync
if errorlevel 1 (
  echo ERROR: uv sync 실패
  cd ..
  pause
  exit /b 1
)
cd ..

if not exist "frontend\dist" (
  where node >nul 2>&1
  if errorlevel 1 (
    echo ERROR: frontend\dist 가 없고 Node.js도 설치되어 있지 않습니다.
    echo        빌드된 frontend\dist 가 포함된 릴리스 ZIP을 받거나 Node.js 18+를 설치하세요.
    pause
    exit /b 1
  )
  echo [2/2] Frontend 빌드 중...
  cd frontend
  call npm install
  call npm run build
  cd ..
) else (
  echo [2/2] frontend\dist 가 이미 존재합니다. 빌드를 건너뜁니다.
)

echo.
echo 셋업 완료. start.bat 으로 실행하세요.
pause
