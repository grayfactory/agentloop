# AgentLoop — PRD v1.0 (DSL Summary)

> 신규 Agent 온보딩용. 이 문서만으로 프로젝트 전체 상태를 파악할 수 있어야 한다.
> 최종 갱신: 2026-03-12

---

## 1. WHAT — 제품 정의

```
정부지원사업 계획서 작성을 AI Agent와 협업하기 위한 로컬 워크스페이스 도구
├── 로컬 전용 (localhost, DB 없음, 파일시스템 = 저장소)
├── 기존 3자리 코드 체계(XYZ_파일명.md) 위에 얹힘
└── AI Agent가 생성한 문서를 자동 인식/뷰잉
```

---

## 2. WHO — 사용자

```
1인 실무자 (gray) — 정부지원사업 계획서를 Claude 등 AI Agent와 협업 작성
```

---

## 3. ARCH — 아키텍처

```
┌─────────────────────────────┐
│  React + TS + Vite + TW v4  │  :5173
│  TanStack Query, Router v7  │
├────────── /api proxy ───────┤
│  FastAPI (Python 3.13+)     │  :8066
│  uv 패키지 관리              │
├─────────────────────────────┤
│  File System (docs/)        │  ← 유일한 저장소
│  index.md = DB 역할          │
└─────────────────────────────┘
```

---

## 4. DATA — 핵심 데이터 모델

```python
Project       { folder_name, project_num, project_title, doc_count, last_modified }
Document      { code, filename, summary, status, category(0~9) }
WorkLog       { date, content, related_docs }
ProjectDetail { ...Project, documents[], worklogs[] }
```

**문서 코드 체계:**
```
XYZ_파일명.md
 X = 대분류 (0~9)
 YZ = 순번 (00~99)

0xx 프로젝트관리 | 1xx RFP/공고분석 | 2xx 기획/전략
3xx 연구/조사    | 4xx 기술설계     | 5xx 개발내용작성
6xx 정량지표     | 7xx 시각화/산출물 | 8xx 최종제출문서 | 9xx 참고/기타
```

**프로젝트 폴더 감지:** `^\d{3}_.+` 패턴 매칭
**index.md 파싱:** 정규식 기반 마크다운 테이블 → Document[] + WorkLog[]

---

## 5. API — 엔드포인트

```
GET    /api/health                                → { status }
GET    /api/projects                              → Project[]
POST   /api/projects        ← { num, title }     → { folder_name, message }
GET    /api/projects/{name}                       → ProjectDetail
GET    /api/projects/{name}/documents             → Document[]
GET    /api/projects/{name}/documents/{filename}  → raw markdown (text/plain)
GET    /api/projects/{name}/worklog               → WorkLog[]
```

---

## 6. UI — 화면 구성

```
[Dashboard /]
┌─────────────────────────────────────────────┐
│ AgentLoop                [+ 새 프로젝트] │
├─────────────────────────────────────────────┤
│ ProjectCard × N                             │
│   {num} badge · title · 문서 N개 · 수정일     │
│   → click: /project/{folder_name}           │
└─────────────────────────────────────────────┘

[Project /project/:name]
┌──────────┬──────────────────────────────────┐
│ Sidebar  │ MarkdownViewer                   │
│          │                                  │
│ 0xx (N)  │ react-markdown + remark-gfm      │
│ 1xx (N)  │ GFM 테이블·코드블록·체크박스 지원   │
│ ...      │                                  │
│ 9xx (N)  │ 선택 안됨 → "문서를 선택하세요"     │
│──────────│                                  │
│ 작업로그  │                                  │
│ date:log │                                  │
└──────────┴──────────────────────────────────┘

[InitProjectModal]
  num (3자리) + title → POST /api/projects → 폴더+CLAUDE.md+index.md 생성
```

---

## 7. FILES — 프로젝트 구조

```
agentloop/
├── backend/
│   ├── main.py                  # FastAPI + CORS(:5173,:5174) + router 등록
│   ├── config.py                # config.yaml → get_docs_root()
│   ├── config.yaml              # docs_root 경로
│   ├── pyproject.toml           # uv, deps, dev script(:8066)
│   ├── models/schemas.py        # Pydantic: Project, Document, WorkLog, ...
│   ├── services/
│   │   ├── index_service.py     # parse_index() — 정규식 md 테이블 파싱
│   │   ├── project_service.py   # list/get/init project
│   │   └── document_service.py  # list docs, get content, get worklogs
│   └── routers/
│       ├── projects.py          # /api/projects CRUD
│       └── documents.py         # /api/projects/{name}/documents
│
├── frontend/
│   ├── vite.config.ts           # proxy /api → :8066, tailwindcss plugin
│   ├── package.json             # react 19, tanstack-query, react-markdown
│   └── src/
│       ├── api/client.ts        # fetch 래퍼 + TS 인터페이스
│       ├── App.tsx              # Routes: / → Dashboard, /project/:name
│       ├── pages/
│       │   ├── Dashboard.tsx    # 프로젝트 목록 + 생성 모달
│       │   └── Project.tsx      # 사이드바(DocList+WorkLog) + MarkdownViewer
│       └── components/
│           ├── ProjectCard.tsx
│           ├── DocumentList.tsx  # 대분류(0~9)별 그룹핑
│           ├── MarkdownViewer.tsx
│           ├── WorkLog.tsx
│           └── InitProjectModal.tsx
│
└── docs/                        # 기획/설계 문서 (이 파일 포함)
```

---

## 8. STATUS — 구현 상태

### Phase 1 (MVP) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F1. 프로젝트 대시보드 | ✅ | 폴더 스캔, 문서수, 수정일 |
| F2. 프로젝트 초기화 | ✅ | UI 모달 → CLAUDE.md + index.md 생성 |
| F3. 프로젝트 상세 뷰 | ✅ | index.md 파싱, 대분류별 사이드바, 작업로그 |
| F4. 마크다운 뷰어 | ✅ | react-markdown + remark-gfm |

### Phase 2 (자동 분류) — ❌ 미구현

| 기능 | 설명 |
|------|------|
| F5. 미분류 문서 감지 | 코드 체계 미준수 파일 감지 + 분류 제안 |
| F6. 파일 워치 + index 자동 업데이트 | watchdog 기반 폴더 변경 감지 |

### Phase 3 (스킬 시스템) — ❌ 미구현

| 기능 | 설명 |
|------|------|
| F7. 스킬 등록 | 프롬프트 + 메타데이터 저장 |
| F8. 스킬 실행 | 스킬 → Agent 전달 → 결과물 자동 등록 |

---

## 9. RUN — 실행 방법

```bash
# Backend
cd backend && uv sync && uv run uvicorn main:app --reload --port 8066

# Frontend
cd frontend && npm install && npm run dev

# → http://localhost:5173
```

---

## 10. DEPS — 의존성 요약

```
Backend:  fastapi, uvicorn, pyyaml, python-multipart  (dev: httpx)
Frontend: react 19, react-router-dom 7, @tanstack/react-query 5,
          react-markdown 10, remark-gfm 4, tailwindcss 4, vite 7
Runtime:  Python 3.13+, Node 18+, uv
```
