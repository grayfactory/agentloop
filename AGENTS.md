# AGENTS.md

**Generated:** 2026-03-12 | **Commit:** 3b3cd92 | **Branch:** main

## OVERVIEW

정부지원사업 계획서를 AI Agent와 협업 작성하는 로컬 워크스페이스 도구.
FastAPI (Python 3.13+) + React 19 / TypeScript / Vite 7 monorepo. DB 없음 — 파일시스템이 저장소.

## STRUCTURE

```
agentloop/
├── backend/              # FastAPI API 서버 (:8066)
│   ├── main.py           # App entry, CORS, router 등록
│   ├── config.py         # docs_root 관리, single/multi 모드 감지
│   ├── models/schemas.py # Pydantic 모델 (전체 API 계약)
│   ├── services/         # 비즈니스 로직 (project, document, index 파싱)
│   └── routers/          # HTTP 엔드포인트 (projects, documents, config)
├── frontend/             # React SPA (:5173)
│   └── src/
│       ├── api/client.ts # fetch 래퍼 + TS 인터페이스 (backend 스키마 수동 미러)
│       ├── pages/        # WorkspacePage (3컬럼 Master-Detail, 유일한 페이지)
│       ├── components/   # 19개 React 컴포넌트 (flat 구조)
│       ├── hooks/        # localStorage 기반 커스텀 훅 2개
│       └── plugins/      # rehype 커스텀 플러그인
├── docs/                 # 기획/설계 문서 (PRD, 기술설계서, 구현가이드)
├── package.json          # 루트 스크립트 (concurrently)
└── CLAUDE.md             # AI Agent 규칙
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| API 엔드포인트 추가 | `backend/routers/` → `backend/services/` | router → service 패턴 따르기 |
| Pydantic 모델 추가 | `backend/models/schemas.py` | 단일 파일에 전부 정의 |
| API 타입 추가 (FE) | `frontend/src/api/client.ts` | BE 스키마 수동 미러 — 동기화 주의 |
| UI 컴포넌트 추가 | `frontend/src/components/` | flat 구조, default export |
| 상태 관리 | TanStack Query (서버) + localStorage (UI) | Redux/Zustand 없음 |
| docs_root 설정 | `backend/config.py` + `backend/config.yaml` | 런타임 변경 가능 |
| index.md 파싱 로직 | `backend/services/index_service.py` | 정규식 기반, 포맷 변경 시 주의 |
| 프로젝트 모드 판별 | `backend/config.py` → `is_single_project_mode()` | 폴더명 패턴 `\d{3}_.+` 기준 |
| 문서 생성/삭제 | `backend/services/document_service.py` + `frontend/src/components/CreateDocumentModal.tsx`, `DeleteConfirmModal.tsx` | BE: create_document/delete_document, FE: 모달 UI |

## CONVENTIONS

- **문서 코드 체계**: `XYZ_파일명.md` (X=대분류 0-9, YZ=순번 00-99)
- **Backend**: Router → Service → Filesystem (DB 없음). 모든 서비스 함수는 `Path` 기반.
- **Frontend**: 단일 페이지 SPA. URL `searchParams`로 상태 관리 (`?project=X&doc=Y`).
- **컴포넌트**: flat `components/` 디렉토리, 모두 `default export`.
- **API 클라이언트**: `fetch` 직접 사용, 에러 시 `res.json()` → `throw new Error(err.detail)` 패턴.
- **스타일링**: Tailwind CSS v4 (Vite 플러그인), `@tailwindcss/typography` 활성.
- **TS Strict**: `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` 활성.
- **Python**: `uv` 패키지 매니저, Python 3.13+ 필수, type hint 사용 (`Path | None`, `list[X]`).
- **한국어**: UI 문자열, 에러 메시지, 문서 모두 한국어.

## ANTI-PATTERNS

- **커밋 서명 금지**: `--no-gpg-sign`, `-S`, `commit.gpgsign` 사용 금지. `Co-Authored-By` 트레일러 금지.
- **DB 도입 금지**: 의도적으로 파일시스템 전용 설계. ORM/DB 추가하지 말 것.
- **API 타입 불일치 주의**: `client.ts` 인터페이스와 `schemas.py` 수동 동기화 필요. 한쪽만 변경하면 런타임 에러.
- **index.md 포맷 변경 주의**: `index_service.py`의 정규식이 정확한 마크다운 테이블 포맷에 의존.

## COMMANDS

```bash
# 개발 (루트에서)
npm run dev                    # backend + frontend 동시 실행
npm run dev:backend            # backend만 (:8066)
npm run dev:frontend           # frontend만 (:5173)

# 설치 (최초 1회)
cd backend && uv sync && cd .. # Python 의존성
npm install                    # 루트 concurrently
cd frontend && npm install     # Frontend 의존성

# 빌드/린트
cd frontend && npm run build   # tsc + vite build
cd frontend && npm run lint    # ESLint
```

## NOTES

- **테스트 없음**: 자동 테스트 프레임워크 미설정. 수동 테스트 의존.
- **CI/CD 없음**: `.github/workflows/` 없음.
- **Vite 프록시**: 개발 시 `/api` → `localhost:8066` 자동 프록시.
- **config.yaml gitignore됨**: `backend/config.yaml`은 런타임 생성, git 추적 안 함.
- **에러 바운더리 없음**: React Error Boundary 미구현. 에러 시 앱 전체 크래시 가능.
- **QueryClient**: `staleTime: 30_000`. 프로젝트 목록 30초, 프로젝트 상세 10초 자동 갱신.
