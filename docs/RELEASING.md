# 릴리스 절차

## 빌드

```bash
./scripts/build-release.sh v1.0.0
# → dist/agentloop-v1.0.0.zip 생성
```

`scripts/build-release.sh`는 다음을 수행한다:
1. `frontend/` 의존성 설치 + `npm run build` (`frontend/dist/` 생성)
2. 릴리스 스테이징 디렉토리 (`dist/agentloop-<version>/`) 에 필요한 파일만 복사
3. `__pycache__`, `.pyc`, `.DS_Store` 정리
4. `backend/config.yaml` 누출 검증 (있으면 빌드 실패)
5. ZIP 압축

## 포함되는 파일

```
agentloop-<version>/
├── backend/
│   ├── main.py
│   ├── config.py
│   ├── pyproject.toml
│   ├── uv.lock
│   ├── models/
│   ├── services/
│   ├── routers/
│   └── presets/
├── frontend/
│   └── dist/                    ← 빌드 산출물 (사용자는 Node 불필요)
├── docs/
│   └── RELEASING.md
├── package.json
├── setup.sh / setup.bat
├── start.sh / start.bat
└── README.md
```

## 제외되는 파일

- `backend/config.yaml` — 사용자 개인 path 누출 방지
- `node_modules/`, `.venv/`, `.git/`
- `frontend/src/`, `frontend/node_modules/` — 사용자는 빌드된 dist만 필요
- `__pycache__/`, `*.pyc`, `.DS_Store`
- `test.md`, 임의의 untracked 작업 파일

## 검증

```bash
# 1. ZIP 내부에 누출 파일이 없는지 확인 (출력이 없어야 정상)
unzip -l dist/agentloop-v1.0.0.zip | grep -E 'config\.yaml|node_modules|\.venv|frontend/src'

# 2. 임시 디렉토리에 풀어 setup/start 흐름 시뮬레이션
mkdir -p /tmp/agentloop-test
cd /tmp/agentloop-test
unzip -q ~/workspace/001_projects/907_agentloop/agentloop/dist/agentloop-v1.0.0.zip
cd agentloop-v1.0.0
./setup.sh
./start.sh
# 브라우저 자동 오픈 → DirectoryPickerModal → 폴더 선택 → 정상 동작 확인
```

## GitHub Releases 업로드 (수동)

```bash
gh release create v1.0.0 dist/agentloop-v1.0.0.zip \
  --title "AgentLoop v1.0.0" \
  --notes-file CHANGELOG.md
```

또는 GitHub 웹 UI에서 직접 업로드.

## Windows VM 검증 (선택)

VirtualBox / Parallels / UTM 등에서 Windows 11 VM 실행 후:

1. Python 3.13 설치 (https://www.python.org/downloads/)
2. ZIP 다운로드 + 압축해제
3. `setup.bat` 더블클릭 (uv 자동 설치)
4. `setup.bat` 다시 더블클릭 (uv sync 진행)
5. `start.bat` 더블클릭 → 브라우저 자동 오픈
6. DirectoryPickerModal에서 `C:\Users\<name>\Documents` 탐색 시 breadcrumb이 정상 분리되는지 확인
7. `%APPDATA%\AgentLoop\config.yaml` 파일 생성 확인
