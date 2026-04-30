#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

if ! command -v uv >/dev/null 2>&1; then
  echo "uv가 설치되어 있지 않습니다. 자동 설치합니다..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="$HOME/.local/bin:$PATH"
  if ! command -v uv >/dev/null 2>&1; then
    echo "ERROR: uv 설치 후에도 PATH에서 찾을 수 없습니다. 셸을 재시작하고 다시 실행하세요." >&2
    exit 1
  fi
fi

echo "[1/2] Backend 의존성 설치 중..."
( cd backend && uv sync )

if [ ! -d "frontend/dist" ]; then
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    echo "[2/2] Frontend 빌드 중..."
    ( cd frontend && npm install && npm run build )
  else
    echo "ERROR: frontend/dist 가 없고 Node.js도 설치되어 있지 않습니다." >&2
    echo "       빌드된 frontend/dist 가 포함된 릴리스 ZIP을 받거나 Node.js 18+를 설치하세요." >&2
    exit 1
  fi
else
  echo "[2/2] frontend/dist 가 이미 존재합니다. 빌드를 건너뜁니다."
fi

echo ""
echo "셋업 완료. ./start.sh 로 실행하세요."
