# backend/ AGENTS.md

## OVERVIEW

FastAPI 백엔드. 파일시스템 기반 문서 CRUD + index.md 정규식 파싱. DB/ORM 없음.

## ARCHITECTURE

```
Router (HTTP) → Service (비즈니스 로직) → Filesystem (pathlib.Path)
```

- `main.py`: FastAPI 앱 생성, CORS 설정 (localhost:5173, :5174), 라우터 3개 등록
- `config.py`: `docs_root` 관리. 런타임 메모리(`_runtime_docs_root`) + `config.yaml` 이중 저장
- `models/schemas.py`: 모든 Pydantic 모델 단일 파일. Request/Response 모델 포함

## WHERE TO LOOK

| Task | File | Pattern |
|------|------|---------|
| 새 API 추가 | `routers/` 새 파일 → `main.py`에 등록 | `APIRouter(prefix="/api/...")` |
| 비즈니스 로직 추가 | `services/` 새 파일 | 함수 기반 (클래스 없음) |
| 스키마 추가 | `models/schemas.py` | `class X(BaseModel):` |
| 프로젝트 목록/생성 | `services/project_service.py` | 가장 큰 파일 (226줄) |
| 문서 CRUD + 삭제 | `services/document_service.py` | create/delete/update + orphan 감지 |
| index.md 파싱 | `services/index_service.py` | 정규식 3개: CATEGORY_HEADER, TABLE_ROW, WORKLOG_ROW |
| 설정 변경 | `config.py` → `set_docs_root()` | `config.yaml` 자동 저장 |

## CONVENTIONS

- **서비스 레이어**: 함수 기반 (클래스 X). `list_projects()`, `get_project()` 등 순수 함수.
- **Config 패턴**: `_runtime_docs_root` (메모리) > `config.yaml` (파일) 우선순위. `set_docs_root()`가 양쪽 갱신.
- **프로젝트 감지**: 폴더명 `^\d{3}_.+$` 패턴 매칭 (`_PROJECT_PATTERN`). 매칭 폴더 없으면 single-project 모드.
- **에러 처리**: 서비스에서 `FileNotFoundError`/`ValueError`/`FileExistsError` raise → 라우터에서 `HTTPException` 변환.
- **Type Hints**: Python 3.13+ 문법 (`Path | None`, `list[Document]`). `from __future__` 불필요.
- **응답 포맷**: 문서 내용은 `PlainTextResponse` (raw markdown), 나머지는 JSON.
- **한국어 메시지**: 에러 메시지, 카테고리명 모두 한국어.

## ANTI-PATTERNS

- **DB 사용 금지**: 의도적 파일시스템 전용 설계.
- **index.md 정규식 취약**: `CATEGORY_HEADER`, `TABLE_ROW`, `WORKLOG_ROW` 정규식은 정확한 포맷 전제. 포맷 수정 시 반드시 `index_service.py` 동시 수정.
- **`_runtime_docs_root` 글로벌 상태**: 멀티 워커 시 상태 불일치 가능. 단일 프로세스 전제.

## NOTES

- **의존성 최소**: fastapi, uvicorn, pyyaml, python-multipart (4개)
- **dev 의존성**: httpx (수동 API 테스트용)
- **`__init__.py` 전부 빈 파일**: 패키지 마커 역할만
- **CORS**: localhost:5173 + :5174만 허용
