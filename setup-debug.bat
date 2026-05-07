@echo on
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ===========================================
echo  AgentLoop Setup - DEBUG (진단 모드)
echo ===========================================
echo.
echo 이 스크립트는 어디서 setup.bat이 멈추는지 확인하기 위한 진단용입니다.
echo 각 단계마다 [Press any key]로 멈추므로 출력을 확인한 뒤 키를 눌러 계속하세요.
echo.
pause

echo.
echo ----- ENV -----
echo 현재 디렉토리: %CD%
echo USERPROFILE  : %USERPROFILE%
echo APPDATA      : %APPDATA%
echo PATH 첫 200자:
echo %PATH:~0,200%
pause

echo.
echo ----- STEP 1: Python 탐색 -----
echo where py:
where py
echo errorlevel = !errorlevel!
echo.
echo where python:
where python
echo errorlevel = !errorlevel!
echo.
echo where python3:
where python3
echo errorlevel = !errorlevel!
pause

echo.
echo ----- STEP 2: Python 버전 확인 -----
echo --- py -3 --version ---
py -3 --version
echo errorlevel = !errorlevel!
echo.
echo --- python --version ---
python --version
echo errorlevel = !errorlevel!
pause

echo.
echo ----- STEP 3: uv 탐색 -----
echo where uv:
where uv
echo errorlevel = !errorlevel!
echo.
if exist "%USERPROFILE%\.local\bin\uv.exe" (
  echo "%USERPROFILE%\.local\bin\uv.exe" 존재함
  "%USERPROFILE%\.local\bin\uv.exe" --version
) else (
  echo "%USERPROFILE%\.local\bin\uv.exe" 없음
)
pause

echo.
echo ----- STEP 4: backend 디렉토리 확인 -----
if exist "backend\pyproject.toml" (
  echo backend\pyproject.toml 존재함
  type backend\pyproject.toml
) else (
  echo ERROR: backend\pyproject.toml 없음. ZIP이 제대로 풀렸는지 확인하세요.
)
pause

echo.
echo ----- STEP 5: uv sync 실제 시도 -----
pushd backend
echo "현재 디렉토리: %CD%"
where uv >nul 2>&1
if not errorlevel 1 (
  uv sync
) else if exist "%USERPROFILE%\.local\bin\uv.exe" (
  "%USERPROFILE%\.local\bin\uv.exe" sync
) else (
  echo uv를 찾을 수 없어 sync를 건너뜁니다.
)
echo errorlevel after uv sync = !errorlevel!
popd
pause

echo.
echo ----- STEP 6: frontend\dist 확인 -----
if exist "frontend\dist" (
  echo frontend\dist 존재함:
  dir frontend\dist
) else (
  echo frontend\dist 없음
)
pause

echo.
echo ===========================================
echo  DEBUG 종료. 위 출력 내용을 캡처해 공유하세요.
echo ===========================================
pause
