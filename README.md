# AgentLoop

정부지원사업 계획서 작성을 AI Agent와 협업하기 위한 로컬 워크스페이스 도구.

- 로컬 전용 (localhost, DB 없음, 파일시스템 = 저장소)
- 기존 3자리 코드 체계(XYZ_파일명.md) 위에 동작
- AI Agent가 생성한 문서를 자동 인식/뷰잉
- 1-Step Master-Detail UI + AI 협업 피드백 루프 + Context Builder

## 주요 기능

| Phase | 기능 | 설명 |
|-------|------|------|
| 1 | 3컬럼 Master-Detail | 프로젝트 목록 + 문서 목록 + 뷰어/편집기, URL searchParams 동기화 |
| 1 | 프로젝트 관리 + DnD | 초기화 모달 + @dnd-kit 드래그 순서 변경 |
| 1 | 미분류 문서 감지 | 파일시스템 vs index.md 비교, OrphanSection |
| 2 | 인라인 피드백 | 텍스트 드래그 → 플로팅 버튼 → .md 파일에 피드백 자동 삽입 |
| 2 | Diff 뷰어 | 체크박스 2개 선택 → Split View 비교 |
| 3 | Context Builder | 문서 체크박스 → PROMPT_*.md 파일 생성 (orphan으로 Agent가 읽기) |
| 3 | 스킬 템플릿 | localStorage CRUD, 프롬프트 생성 시 instruction 자동 포함 |
| 4 | 자동/수동 새로고침 | TanStack Query refetchInterval + 헤더 ↻ 버튼 |
| 4 | 문서 편집 모드 | 편집/미리보기 토글, textarea + ⌘S 저장, 클립보드 복사, 스크롤 위치 복원 |
| 5 | 동적 docs_root 설정 | DirectoryPickerModal로 디렉토리 탐색/선택, config.yaml 자동 저장 |
| 5 | 멀티/싱글 프로젝트 자동 감지 | docs_root 구조에 따라 백엔드 자동 판별 |
| 6 | 문서 생성/삭제 | "+ 새 문서" 버튼 (.md 자동, ⌘Enter) + 삭제 확인 모달, DELETE API |
| 7 | 프로젝트 삭제 | 사이드바 hover 삭제 버튼 → 확인 모달, 싱글 모드 차단, 선택 해제 |
| 8 | 드래그앤드롭 업로드 | OS 파일을 문서 패널로 드래그앤드롭, 미분류로 자동 추가 |
| 8 | ⌘E 단축키 | 편집/미리보기 토글 단축키 (⌘E / Ctrl+E) |
| 9 | 파일명 변경 | hover 시 연필 아이콘 → RenameModal, 확장자 제외 자동선택, PATCH API |
| 9 | Tab 들여쓰기 | 편집 모드에서 Tab 키 → 2 spaces 삽입, 커서 위치 자동 복원 |
| 9 | 코드블럭 다크 테마 | github-dark 테마로 코드블럭 배경/텍스트 가독성 개선 |
| 9 | 스크롤 동기화 | ⌘E 토글 시 미리보기↔편집기 간 보던 위치 유지, data-source-line 기반 |
| 10 | CLAUDE.md 프리셋 | 프로젝트 생성 시 프리셋 선택 (기본 3종), 커스텀 프리셋 CRUD, JSON 파일 기반 |
| 11 | HTML 테이블 렌더링 | raw HTML `<table>` 지원 (rowspan/colspan/중첩), 정부양식 폼 격자 스타일 |
| 12 | 비-텍스트 미리보기 | 이미지(PNG/JPG/SVG 등) + HTML 파일 뷰어, FileResponse + iframe sandbox |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI (Python 3.13+), uv |
| Frontend | React 19 + TypeScript + Vite 7 |
| 스타일링 | Tailwind CSS v4 + @tailwindcss/typography |
| 상태관리 | TanStack Query 5, React Router v7 |
| MD 렌더링 | react-markdown + remark-gfm + rehype-highlight + rehype-raw |
| DnD | @dnd-kit/core + sortable |
| Diff | react-diff-viewer-continued |

## 프로젝트 구조

```
agentloop/
├── package.json             # 루트 실행 스크립트 (dev: concurrently, start: 단일 uvicorn)
├── setup.sh / setup.bat     # 일반 사용자용 셋업 (uv 자동 설치 + uv sync)
├── start.sh / start.bat     # 일반 사용자용 실행 (브라우저 자동 오픈)
├── scripts/
│   └── build-release.sh     # 배포용 ZIP 생성
├── backend/
│   ├── main.py                  # FastAPI + CORS + router 등록 + frontend/dist SPA 정적 서빙
│   ├── config.py                # docs_root 관리 (per-user config.yaml — platformdirs)
│   │                            #   is_single_project_mode(), resolve_project_dir()
│   ├── pyproject.toml           # uv, deps (fastapi/uvicorn/pyyaml/python-multipart/platformdirs)
│   ├── models/schemas.py        # Pydantic 모델
│   ├── presets/                 # CLAUDE.md 프리셋 JSON 파일
│   │   ├── default.json         #   기본 (정부지원사업)
│   │   ├── minimal.json         #   최소 구성
│   │   └── research.json        #   연구/논문 프로젝트
│   ├── services/
│   │   ├── index_service.py     # index.md 정규식 파싱
│   │   ├── project_service.py   # 프로젝트 목록/초기화/삭제 + orphan 통합
│   │   ├── preset_service.py    # 프리셋 CRUD + 템플릿 렌더링
│   │   └── document_service.py  # 문서 CRUD, rename, orphan 감지, 피드백 삽입
│   └── routers/
│       ├── projects.py          # /api/projects
│       ├── presets.py           # /api/presets CRUD
│       ├── documents.py         # /api/projects/{name}/documents + feedback
│       └── config.py            # PUT /api/config + GET /api/browse
│
├── frontend/
│   ├── vite.config.ts           # proxy /api → :8066
│   ├── package.json
│   └── src/
│       ├── api/client.ts        # fetch 래퍼 + TS 인터페이스
│       ├── App.tsx              # → WorkspacePage (단일 렌더)
│       ├── plugins/
│       │   └── rehypeSourceLine.ts
│       ├── utils/
│       │   └── scrollSync.ts    # 미리보기↔편집 스크롤 동기화 유틸
│       ├── hooks/
│       │   ├── useProjectOrder.ts
│       │   └── useSkillTemplates.ts
│       ├── pages/
│       │   └── WorkspacePage.tsx # 3컬럼 Master-Detail 메인 페이지
│       └── components/
│           ├── AppHeader.tsx
│           ├── ProjectSidebar.tsx
│           ├── DocumentPanel.tsx
│           ├── ViewerPanel.tsx
│           ├── MarkdownViewer.tsx
│           ├── DocumentEditor.tsx
│           ├── ImageViewer.tsx
│           ├── HtmlViewer.tsx
│           ├── FeedbackPopover.tsx
│           ├── DiffViewer.tsx
│           ├── ContextBuilder.tsx
│           ├── SkillTemplateSelector.tsx
│           ├── SkillTemplateModal.tsx
│           ├── InitProjectModal.tsx
│           ├── CreateDocumentModal.tsx
│           ├── DeleteConfirmModal.tsx
│           ├── RenameModal.tsx
│           ├── DeleteProjectModal.tsx
│           └── DirectoryPickerModal.tsx
│
└── docs/                        # 기획/설계 문서
```

## 실행 방법

AgentLoop는 두 가지 사용 방식을 지원합니다.

### A. 일반 사용자 (Windows / macOS) — 더블클릭 흐름

**사전 요구사항: Python 3.13+**

[python.org/downloads](https://www.python.org/downloads/)에서 설치. **Windows에서는 인스톨러 첫 화면 하단의 "Add python.exe to PATH" 체크박스를 반드시 켜고 설치하세요** — 이 옵션 없이 설치하면 `setup.bat`이 Python을 찾지 못해 즉시 종료됩니다.

**1. ZIP 다운로드 + 압축해제**

[GitHub Releases](https://github.com/grayfactory/agentloop/releases/latest) 페이지에서 최신 `agentloop-vX.Y.Z.zip`을 다운로드하고 원하는 위치에 압축해제합니다.

**2. 셋업 (최초 1회)**

- **Windows**:
  1. 압축해제한 폴더에서 `setup.bat` 더블클릭
  2. uv가 설치되지 않은 상태라면 자동 설치가 진행되고 `이 창을 닫고 setup.bat 을 다시 실행하세요` 메시지가 뜹니다 — 메시지대로 **콘솔 창을 닫고** `setup.bat`을 한 번 더 더블클릭하세요 (PATH 갱신을 위해 새 창이 필요합니다)
  3. 두 번째 실행에서 `Backend 의존성 설치 중...` → `셋업 완료` 메시지가 뜨면 끝
- **macOS**:
  1. 터미널을 열고 압축해제한 폴더로 이동
  2. `./setup.sh` 실행
  3. (Finder 더블클릭으로 압축을 푼 경우 실행 권한이 빠질 수 있습니다 — `Permission denied` 에러가 뜨면 `chmod +x setup.sh start.sh` 한 번 실행 후 다시 시도)

**3. 실행**

- **Windows**: `start.bat` 더블클릭
  - 첫 실행 시 Windows Defender 방화벽이 *"Python의 일부 기능을 차단했습니다"* 팝업을 띄울 수 있습니다 → **"액세스 허용"** 클릭 (개인/사설 네트워크만 체크된 채로 진행하면 됩니다)
- **macOS**: `./start.sh`

**4. 사용**

- 브라우저가 자동으로 http://localhost:8066 을 엽니다
- 첫 실행 시 `DirectoryPickerModal`이 자동으로 떠서 문서 루트 폴더를 선택할 수 있습니다 — 선택 후에는 자동 저장되어 다음부터는 모달 없이 바로 진입합니다

**5. 종료**

- **Windows**: 검은 콘솔 창의 우측 상단 X 버튼 클릭 또는 콘솔에 포커스를 두고 `Ctrl+C` → `Y`
- **macOS**: 터미널에서 `Ctrl+C`
- 콘솔 창을 닫으면 백엔드도 함께 종료됩니다 (브라우저 탭만 닫으면 백엔드는 계속 살아있으니 주의)

**설정 영속성**: docs_root 등 사용자 설정은 OS 표준 사용자 디렉토리에 저장되므로 ZIP을 새 버전으로 교체해도 그대로 유지됩니다.

- Windows: `%APPDATA%\AgentLoop\config.yaml`
- macOS: `~/Library/Application Support/AgentLoop/config.yaml`
- Linux: `~/.config/AgentLoop/config.yaml`

#### 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-------------|
| `setup.bat` 실행 직후 콘솔 창이 깜빡이며 사라짐 (출력 안 보임) | 보통 어딘가에서 즉시 종료된 경우. **`setup-debug.bat`을 더블클릭**하면 단계마다 멈추며 어디서 실패하는지 출력됩니다. 캡처해서 공유하세요 |
| `setup.bat` 실행 직후 `ERROR: Python을 찾을 수 없습니다` | python.org 인스톨러 재실행 → "Add python.exe to PATH" 체크 → 다시 설치. 또는 MS Store에서 "Python 3.13" 정식 설치 (App Execution Alias만으로는 부족) |
| `setup.bat`을 두 번 실행해도 uv를 못 찾음 | PowerShell 실행 정책 문제일 수 있음. PowerShell을 **관리자 권한**으로 열고 `irm https://astral.sh/uv/install.ps1 \| iex` 직접 실행 |
| `start.bat` 실행 직후 콘솔 창이 바로 닫힘 | 보통 포트 8066이 이미 사용 중. 콘솔에서 `cd backend && uv run uvicorn main:app --port 8066` 직접 실행해 에러 메시지 확인 |
| `Address already in use` / `[errno 48]` | 다른 프로그램이 8066 포트 사용 중. 해당 프로그램 종료 또는 (개발자) `--port 8077` 등 다른 포트로 실행 |
| `setup.sh: Permission denied` (mac) | `chmod +x setup.sh start.sh` 한 번 실행 |
| 브라우저는 떴는데 페이지가 안 뜸 | 콘솔에 에러가 있는지 확인. `frontend/dist/` 폴더가 빠진 ZIP이면 `setup.sh/.bat`을 다시 실행 (Node 설치 필요) |
| Python 버전이 3.12 이하 | `uv sync` 단계에서 실패. python.org에서 3.13 설치 후 재시도 |
| Windows에서 한글 파일명 깨짐 | 콘솔 코드페이지 문제. 사용에는 지장 없으며, 브라우저 화면에서는 정상 표시됨 |

### B. 개발자 — git clone + hot reload

**사전 요구사항**: Python 3.13+, Node.js 18+, [uv](https://docs.astral.sh/uv/)

```bash
# 최초 설치
cd backend && uv sync && cd ..
npm install
cd frontend && npm install && cd ..

# 개발 모드 (Vite hot reload, 두 포트)
npm run dev                       # backend(:8066) + frontend(:5173)
npm run dev:backend               # backend만 (uvicorn --reload)
npm run dev:frontend              # frontend만 (vite dev)
# → http://localhost:5173

# 단일 프로세스 production (프로덕션 산출물 서빙)
npm run build                     # frontend/dist/ 생성
npm run start                     # uvicorn :8066, FastAPI가 dist + /api/* 모두 서빙
npm run prod                      # build + start 한 번에
# → http://localhost:8066
```

### 릴리스 빌드 (배포용 ZIP 생성)

```bash
./scripts/build-release.sh v1.0.0
# → dist/agentloop-v1.0.0.zip 생성 (frontend/dist 포함, config.yaml 제외)
```

상세 절차는 [docs/RELEASING.md](docs/RELEASING.md) 참조.

## 설정

- **첫 실행**: `DirectoryPickerModal`이 자동 표시 — 문서 루트 폴더를 선택하면 자동 저장
- **변경**: 헤더의 ⚙ 버튼 클릭 또는 config 파일 직접 편집
- **config 파일 위치**:
  - Windows: `%APPDATA%\AgentLoop\config.yaml`
  - macOS: `~/Library/Application Support/AgentLoop/config.yaml`
  - Linux: `~/.config/AgentLoop/config.yaml`

```yaml
docs_root: "/path/to/docs"
```

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/health` | 헬스체크 |
| GET | `/api/config` | docs_root + is_valid 반환 |
| PUT | `/api/config` | docs_root 런타임 변경 |
| GET | `/api/browse?path=` | 디렉토리 탐색 |
| GET | `/api/projects` | 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 초기화 (preset_id 선택 가능) |
| DELETE | `/api/projects/{name}` | 프로젝트 삭제 |
| GET | `/api/projects/{name}` | 프로젝트 상세 (orphan, has_index 포함) |
| GET | `/api/projects/{name}/documents` | 문서 목록 |
| POST | `/api/projects/{name}/documents` | 문서 생성 |
| GET | `/api/projects/{name}/documents/{filename}` | 파일 내용 (mimetype 자동 — md/이미지/HTML 모두 지원) |
| PUT | `/api/projects/{name}/documents/{filename}` | 문서 내용 수정 |
| PATCH | `/api/projects/{name}/documents/{filename}` | 파일명 변경 |
| DELETE | `/api/projects/{name}/documents/{filename}` | 문서 삭제 |
| POST | `/api/projects/{name}/documents/{filename}/feedback` | 인라인 피드백 삽입 |
| GET | `/api/projects/{name}/worklog` | 작업 로그 |
| GET | `/api/presets` | 프리셋 목록 |
| GET | `/api/presets/{id}` | 프리셋 상세 (content 포함) |
| POST | `/api/presets` | 프리셋 생성 |
| PUT | `/api/presets/{id}` | 프리셋 수정 |
| DELETE | `/api/presets/{id}` | 프리셋 삭제 |

## 문서 코드 체계

```
XYZ_파일명.md
 X = 대분류 (0~9), YZ = 순번 (00~99)

0xx 프로젝트관리 | 1xx RFP/공고분석 | 2xx 기획/전략
3xx 연구/조사    | 4xx 기술설계     | 5xx 개발내용작성
6xx 정량지표     | 7xx 시각화/산출물 | 8xx 최종제출문서 | 9xx 참고/기타
```
