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
| 4 | 문서 편집 모드 | 편집/미리보기 토글, textarea + ⌘S 저장 |
| 5 | 동적 docs_root 설정 | DirectoryPickerModal로 디렉토리 탐색/선택, config.yaml 자동 저장 |
| 5 | 멀티/싱글 프로젝트 자동 감지 | docs_root 구조에 따라 백엔드 자동 판별 |
| 6 | 문서 생성/삭제 | "+ 새 문서" 버튼 (.md 자동, ⌘Enter) + 삭제 확인 모달, DELETE API |

## 기술 스택

| 영역 | 기술 |
|------|------|
| Backend | FastAPI (Python 3.13+), uv |
| Frontend | React 19 + TypeScript + Vite 7 |
| 스타일링 | Tailwind CSS v4 + @tailwindcss/typography |
| 상태관리 | TanStack Query 5, React Router v7 |
| MD 렌더링 | react-markdown + remark-gfm + rehype-highlight |
| DnD | @dnd-kit/core + sortable |
| Diff | react-diff-viewer-continued |

## 프로젝트 구조

```
agentloop/
├── package.json             # 루트 실행 스크립트 (concurrently)
├── backend/
│   ├── main.py                  # FastAPI + CORS + router 등록
│   ├── config.py                # config.yaml → get_docs_root() + set_docs_root()
│   │                            #   is_single_project_mode(), resolve_project_dir()
│   ├── config.yaml              # docs_root 경로 (런타임 변경 시 자동 저장)
│   ├── pyproject.toml           # uv, deps, dev script(:8066)
│   ├── models/schemas.py        # Pydantic 모델
│   ├── services/
│   │   ├── index_service.py     # index.md 정규식 파싱
│   │   ├── project_service.py   # 프로젝트 목록/초기화 + orphan 통합
│   │   └── document_service.py  # 문서 CRUD, orphan 감지, 피드백 삽입
│   └── routers/
│       ├── projects.py          # /api/projects
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
│           ├── FeedbackPopover.tsx
│           ├── DiffViewer.tsx
│           ├── ContextBuilder.tsx
│           ├── SkillTemplateSelector.tsx
│           ├── SkillTemplateModal.tsx
│           ├── InitProjectModal.tsx
│           ├── CreateDocumentModal.tsx
│           ├── DeleteConfirmModal.tsx
│           └── DirectoryPickerModal.tsx
│
└── docs/                        # 기획/설계 문서
```

## 실행 방법

### 사전 요구사항

- Python 3.13+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/)

### 실행 (루트에서)

```bash
cd backend && uv sync && cd ..   # 최초 1회
npm install                       # 최초 1회
npm run dev                       # backend + frontend 동시 실행
```

→ http://localhost:5173 접속

### 개별 실행

```bash
npm run dev:backend    # backend만 (:8066)
npm run dev:frontend   # frontend만 (:5173)
```

## 설정

첫 실행 시 `DirectoryPickerModal`이 자동으로 표시되며, 문서 폴더 경로를 선택할 수 있습니다.
수동으로 변경하려면 헤더의 ⚙ 버튼을 클릭하거나 `backend/config.yaml`을 직접 편집하세요.

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
| POST | `/api/projects` | 프로젝트 초기화 |
| GET | `/api/projects/{name}` | 프로젝트 상세 (orphan, has_index 포함) |
| GET | `/api/projects/{name}/documents` | 문서 목록 |
| POST | `/api/projects/{name}/documents` | 문서 생성 |
| GET | `/api/projects/{name}/documents/{filename}` | 문서 내용 (raw md) |
| PUT | `/api/projects/{name}/documents/{filename}` | 문서 내용 수정 |
| DELETE | `/api/projects/{name}/documents/{filename}` | 문서 삭제 |
| POST | `/api/projects/{name}/documents/{filename}/feedback` | 인라인 피드백 삽입 |
| GET | `/api/projects/{name}/worklog` | 작업 로그 |

## 문서 코드 체계

```
XYZ_파일명.md
 X = 대분류 (0~9), YZ = 순번 (00~99)

0xx 프로젝트관리 | 1xx RFP/공고분석 | 2xx 기획/전략
3xx 연구/조사    | 4xx 기술설계     | 5xx 개발내용작성
6xx 정량지표     | 7xx 시각화/산출물 | 8xx 최종제출문서 | 9xx 참고/기타
```
