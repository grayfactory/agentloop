# backend/ AGENTS.md

## OVERVIEW

FastAPI 백엔드. 파일시스템 기반 문서 CRUD + index.md 정규식 파싱. DB/ORM 없음.

## ARCHITECTURE

```
Router (HTTP) → Service (비즈니스 로직) → Filesystem (pathlib.Path)
```

- `main.py`: FastAPI 앱 생성, CORS 설정 (localhost:5173, :5174), 라우터 4개 등록 + `frontend/dist/` SPA 정적 서빙 (단일 포트 production)
- `config.py`: `docs_root` 관리. 런타임 메모리(`_runtime_docs_root`) + `config.yaml` 이중 저장. `config.yaml`은 사용자별 디렉토리 (`platformdirs.user_config_dir("AgentLoop")`)
- `models/schemas.py`: 모든 Pydantic 모델 단일 파일. Request/Response 모델 포함 (`BrowseResponse`에 `path_segments` + `separator` — Windows 경로 호환)

## WHERE TO LOOK

| Task | File | Pattern |
|------|------|---------|
| 새 API 추가 | `routers/` 새 파일 → `main.py`에 등록 | `APIRouter(prefix="/api/...")` |
| 비즈니스 로직 추가 | `services/` 새 파일 | 함수 기반 (클래스 없음) |
| 스키마 추가 | `models/schemas.py` | `class X(BaseModel):` |
| 프로젝트 목록/생성/삭제 | `services/project_service.py` | list/get/init/delete_project |
| 문서 CRUD + 삭제 + 이름변경 | `services/document_service.py` | create/delete/update/upload/rename + orphan 감지 |
| index.md 파싱 | `services/index_service.py` | 정규식 3개: CATEGORY_HEADER, TABLE_ROW, WORKLOG_ROW |
| 카테고리 라벨 추출 | `services/categories_service.py` | `extract_categories_from_markdown(text)` — 프리셋 content / 프로젝트 CLAUDE.md 표 행 파싱. 누락 시 `DEFAULT_CATEGORY_NAMES` |
| 프리셋 CRUD | `services/preset_service.py` + `presets/*.json` | list/get/create/update/delete + render_template |
| 설정 변경 | `config.py` → `set_docs_root()` | `config.yaml` 자동 저장 |

## CONVENTIONS

- **서비스 레이어**: 함수 기반 (클래스 X). `list_projects()`, `get_project()`, `delete_project()` 등 순수 함수.
- **Config 패턴**: `_runtime_docs_root` (메모리) > `config.yaml` (파일) 우선순위. `set_docs_root()`가 양쪽 갱신.
- **프로젝트 감지**: 폴더명 `^\d{3}_.+$` 패턴 매칭 (`_PROJECT_PATTERN`). 매칭 폴더 없으면 single-project 모드.
- **에러 처리**: 서비스에서 `FileNotFoundError`/`ValueError`/`FileExistsError` raise → 라우터에서 `HTTPException` 변환.
- **Type Hints**: Python 3.13+ 문법 (`Path | None`, `list[Document]`). `from __future__` 불필요.
- **응답 포맷**: 문서 내용 GET은 `FileResponse` (mimetype 자동 추론 — text/markdown, image/png, text/html 등), 나머지는 JSON.
- **한국어 메시지**: 에러 메시지, 카테고리명 모두 한국어.

## ANTI-PATTERNS

- **DB 사용 금지**: 의도적 파일시스템 전용 설계.
- **index.md 정규식 취약**: `CATEGORY_HEADER`, `TABLE_ROW`, `WORKLOG_ROW` 정규식은 정확한 포맷 전제. 포맷 수정 시 반드시 `index_service.py` 동시 수정.
- **`_runtime_docs_root` 글로벌 상태**: 멀티 워커 시 상태 불일치 가능. 단일 프로세스 전제.

## NOTES

- **의존성 최소**: fastapi, uvicorn, pyyaml, python-multipart, platformdirs (5개)
- **dev 의존성**: httpx (수동 API 테스트용)
- **`__init__.py` 전부 빈 파일**: 패키지 마커 역할만
- **CORS**: localhost:5173 + :5174만 허용
- **FileResponse 패턴**: `routers/documents.py::get_document`가 `FileResponse(file_path)`로 응답하면 `mimetypes.guess_type()`이 자동으로 Content-Type을 결정. 바이너리(PNG/JPG)와 텍스트(MD/HTML) 모두 한 엔드포인트로 처리. 라우터 진입부에서 경로 조작(`/`, `\\`, `..`) 검사 필수 — `resolve_project_dir(name) / filename` 직전에 가드.
- **SPA 정적 서빙 (main.py)**: 모든 `include_router(...)` 호출 **이후**에 `app.mount("/assets", StaticFiles(...))` + catch-all `@app.get("/{full_path:path}")` 등록. 순서 바꾸면 catch-all이 `/api/*`를 가로챔. `DIST_DIR.exists()` 가드로 dev 모드(빌드 미진행)에도 backend 단독 실행 가능. catch-all은 `api/`로 시작하는 path는 404로 거절.
- **Per-user config**: `config.py`는 `platformdirs.user_config_dir("AgentLoop")`을 사용. mac=`~/Library/Application Support/AgentLoop/`, Windows=`%APPDATA%\AgentLoop\`, Linux=`~/.config/AgentLoop/`. legacy 호환: 같은 디렉토리의 `backend/config.yaml`이 있고 user dir에 config.yaml이 없으면 모듈 로드 시 1회 자동 복사.
- **`/api/browse` Windows 호환**: `BrowseResponse.path_segments`(`Path.parts` 결과 그대로) + `separator`(`os.sep`) 제공 — 프론트엔드는 직접 split 하지 않고 이 필드들로 breadcrumb 구성. POSIX `/Users/gray` → `('/', 'Users', 'gray')`, Windows `C:\Users\gray` → `('C:\\', 'Users', 'gray')`.
- **카테고리 단일 소스**: 0xx~9xx 라벨은 코드 어디에도 직접 하드코딩하지 말 것. `services/categories_service.py`만 라벨을 안다 — `DEFAULT_CATEGORY_NAMES`는 fallback 전용. `init_project()`는 프리셋 `content`에서 표를 파싱해 그 dict로 CLAUDE.md(템플릿 그대로)와 index.md 헤더(루프 렌더)를 둘 다 채움. `get_project()`는 매 요청마다 그 프로젝트의 `CLAUDE.md`를 파싱해 `ProjectDetail.categories`에 채움 → 사용자 편집 즉시 반영. **새 코드에서 `0: "프로젝트 관리"` 같은 dict literal을 만들면 안 됨** (categories_service 임포트 또는 ProjectDetail.categories 사용).
