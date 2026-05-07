#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

VERSION="${1:-dev}"
OUT_DIR="dist"
STAGE="${OUT_DIR}/agentloop-${VERSION}"
ZIP_PATH="${OUT_DIR}/agentloop-${VERSION}.zip"

mkdir -p "${OUT_DIR}"
rm -rf "${STAGE}" "${ZIP_PATH}"

echo "[1/3] Frontend 빌드..."
( cd frontend && npm install && npm run build )

if [ ! -d "frontend/dist" ]; then
  echo "ERROR: frontend/dist 빌드 결과물이 없습니다." >&2
  exit 1
fi

echo "[2/3] 릴리스 디렉토리 구성: ${STAGE}"
mkdir -p "${STAGE}/backend" "${STAGE}/frontend" "${STAGE}/docs"

cp -R \
  backend/main.py \
  backend/config.py \
  backend/pyproject.toml \
  backend/uv.lock \
  backend/models \
  backend/services \
  backend/routers \
  backend/presets \
  "${STAGE}/backend/"

cp -R frontend/dist "${STAGE}/frontend/"
cp package.json "${STAGE}/"
cp setup.sh setup.bat setup-debug.bat start.sh start.bat README.md "${STAGE}/"
cp docs/RELEASING.md "${STAGE}/docs/" 2>/dev/null || true

find "${STAGE}" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "${STAGE}" -type f -name "*.pyc" -delete 2>/dev/null || true
find "${STAGE}" -type f -name ".DS_Store" -delete 2>/dev/null || true

find "${STAGE}" -maxdepth 1 -type f -name "*.bat" -exec perl -pi -e 's/\r?\n/\r\n/g' {} +

if [ -f "${STAGE}/backend/config.yaml" ]; then
  echo "ERROR: ${STAGE}/backend/config.yaml 이 포함되어 있습니다 (사용자 path 누출 위험)." >&2
  exit 1
fi

echo "[3/3] ZIP 생성: ${ZIP_PATH}"
( cd "${OUT_DIR}" && zip -rq "agentloop-${VERSION}.zip" "agentloop-${VERSION}" )

SIZE=$(du -h "${ZIP_PATH}" | cut -f1)
FILES=$(unzip -l "${ZIP_PATH}" | tail -1 | awk '{print $2}')
echo ""
echo "완료: ${ZIP_PATH} (${SIZE}, ${FILES} files)"
echo "검증:"
echo "  unzip -l ${ZIP_PATH} | grep -E 'config\\.yaml|node_modules|\\.venv'   (출력 없으면 OK)"
