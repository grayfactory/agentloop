# AgentLoop — PRD v1.8 (DSL Summary)

> 신규 Agent 온보딩용. 이 문서만으로 프로젝트 전체 상태를 파악할 수 있어야 한다.
> 최종 갱신: 2026-03-18

---

## 1. WHAT — 제품 정의

```
정부지원사업 계획서 작성을 AI Agent와 협업하기 위한 로컬 워크스페이스 도구
├── 로컬 전용 (localhost, DB 없음, 파일시스템 = 저장소)
├── 기존 3자리 코드 체계(XYZ_파일명.md) 위에 얹힘
├── AI Agent가 생성한 문서를 자동 인식/뷰잉
├── v1.1: 1-Step Master-Detail UI + AI 협업 피드백 루프 + Context Builder
├── v1.3: 자동 새로고침 + 문서 편집 모드 + 프롬프트 파일 생성
├── v1.4: 동적 docs_root 설정 + 멀티/싱글 프로젝트 자동 감지
├── v1.5: 문서 생성/삭제 UI + DELETE API
├── v1.6: 프로젝트 삭제 기능 (DELETE API + 확인 모달)
├── v1.7: 드래그앤드롭 파일 업로드 + ⌘E 편집/미리보기 토글 단축키
└── v1.8: 파일명 변경(rename) 기능 — PATCH API + RenameModal
```

---

## 2. WHO — 사용자

```
1인 실무자 (gray) — 정부지원사업 계획서를 Claude 등 AI Agent와 협업 작성
```

---

## 3. ARCH — 아키텍처

```
┌──────────────────────────────────────┐
│  React + TS + Vite + TW v4           │  :5173
│  TanStack Query, Router v7           │
│  @dnd-kit, react-diff-viewer         │
├────────── /api proxy ────────────────┤
│  FastAPI (Python 3.13+)              │  :8066
│  uv 패키지 관리                       │
├──────────────────────────────────────┤
│  File System (docs/)                 │  ← 유일한 저장소
│  000_index.md = DB 역할               │
└──────────────────────────────────────┘
```

---

## 4. DATA — 핵심 데이터 모델

```python
Project       { folder_name, project_num, project_title, doc_count, last_modified }
Document      { code, filename, summary, status, category(0~9) }
WorkLog       { date, content, related_docs }
OrphanFile    { filename, extension, size_bytes, last_modified }         # v1.1 NEW
FeedbackRequest { line_number, target_text, instruction }               # v1.1 NEW
ProjectDetail { ...Project, documents[], worklogs[], orphan_files[], has_index }
AppConfig     { docs_root, is_valid }                                    # v1.4 UPD
SkillTemplate { id, name, instruction, createdAt }                      # v1.2 NEW (localStorage)
CreateDocumentRequest { filename, content }                             # v1.3 NEW
UpdateDocumentRequest { content }                                       # v1.3 NEW
UpdateConfigRequest { docs_root }                                       # v1.4 NEW
DirectoryEntry { name, path }                                           # v1.4 NEW
BrowseResponse { current_path, parent_path, directories[] }             # v1.4 NEW
UploadError    { filename, detail }                                      # v1.7 NEW
UploadResult   { uploaded[], errors[] }                                  # v1.7 NEW
RenameDocumentRequest { new_filename }                                   # v1.8 NEW
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
**멀티/싱글 자동 감지:**                                                  # v1.4 NEW
```
docs_root 하위에 ^\d{3}_.+ 디렉토리 존재? → 멀티 프로젝트 모드
docs_root.name 자체가 ^\d{3}_.+ 패턴?    → 싱글 프로젝트 모드
resolve_project_dir(name): 싱글=docs_root, 멀티=docs_root/name
```
**index.md 파싱:** 정규식 기반 마크다운 테이블 → Document[] + WorkLog[]
**Orphan 감지:** 파일시스템 스캔 − index 등록 파일 − 시스템 파일(CLAUDE.md, .DS_Store)

---

## 5. API — 엔드포인트

```
GET    /api/health                                → { status }
GET    /api/config                                → { docs_root, is_valid }    # v1.4 UPD
PUT    /api/config        ← { docs_root }       → { docs_root, is_valid }    # v1.4 NEW
       # 런타임 docs_root 변경 + config.yaml 저장
GET    /api/browse?path=                         → BrowseResponse             # v1.4 NEW
       # 디렉토리 탐색 (path 미지정 시 홈 디렉토리, 숨김 폴더 제외)
GET    /api/projects                              → Project[]
POST   /api/projects        ← { num, title }     → { folder_name, message }
DELETE /api/projects/{name}                       → { message }                 # v1.6 NEW
       # 프로젝트 디렉토리 전체 삭제 (싱글 모드 차단, 이름 패턴 검증)
GET    /api/projects/{name}                       → ProjectDetail (orphan_files, has_index 포함)
GET    /api/projects/{name}/documents             → Document[]
POST   /api/projects/{name}/documents             → { filename, status }       # v1.3 NEW
       ← { filename, content }
       # 프로젝트 디렉토리에 새 문서 파일 생성 (orphan으로 표시)
GET    /api/projects/{name}/documents/{filename}  → raw markdown (text/plain)
PUT    /api/projects/{name}/documents/{filename}  → { status }                 # v1.3 NEW
       ← { content }
       # 기존 문서 내용 덮어쓰기 (브라우저 편집 모드)
PATCH  /api/projects/{name}/documents/{filename}  → { old_filename, new_filename, status }  # v1.8 NEW
       ← { new_filename }
       # 문서 파일명 변경 (시스템 파일 보호, 경로 조작 방지, 중복 검증)
DELETE /api/projects/{name}/documents/{filename}  → { status }                 # v1.5 NEW
       # 문서 파일 삭제 (시스템 파일 보호, 경로 조작 방지)
POST   /api/projects/{name}/upload                → UploadResult               # v1.7 NEW
       ← multipart/form-data (files[])
       # 드래그앤드롭 파일 업로드. 바이너리 지원. 부분 성공 (uploaded[] + errors[])
POST   /api/projects/{name}/documents/{filename}/feedback          # v1.1 NEW
       ← { line_number, target_text, instruction }
       → { status: "ok" }
       # 원본 .md 파일의 line_number 위치에 피드백 블록 자동 삽입
GET    /api/projects/{name}/worklog               → WorkLog[]
```

**피드백 삽입 포맷 (마크다운 원본에 주입):**
```markdown
> 💡 **[사용자 피드백]**
> !! 타겟 텍스트: "선택한 텍스트"
> !! 지시사항: 사용자가 입력한 지시
```

---

## 6. UI — 화면 구성

```
[WorkspacePage / — 단일 페이지, 3컬럼 Master-Detail]

URL: /?project={folder_name}&doc={filename}

┌──────────────────────────────────────────────────────────────────┐
│ [≡] AgentLoop                   [↻][⚙][+ 새 프로젝트]    │
├─────────┬───────────────────────┬────────────────────────────────┤
│ LEFT    │ CENTER                │ RIGHT                          │
│ w-56    │ w-80                  │ flex-1                         │
│ 접기가능  │                       │                                │
│         │ 프로젝트명 + 번호      │ [파일명]  [복사][편집/미리보기 ⌘E]│
│         │           [+ 새 문서]  │                                │
│ ⠿ 008   │                       │                                │
│   BIM   │ ▼ 미분류 문서 (N)      │ MarkdownViewer (미리보기 모드)  │
│ ⠿ 009   │   ☐ 📄 orphan1.md    │  - rehypeSourceLine 플러그인    │
│  서울형  │   ☐ 📄 PROMPT_*.md   │  - 텍스트 드래그 → 플로팅 버튼   │
│ ⠿ 010   │   ☐ 📎 orphan2.docx  │  - 피드백 입력 → .md 자동 삽입   │
│  소방    │                       │  - 10초 자동 새로고침            │
│         │                       │  - 문서 전환 시 스크롤 위치 복원  │
│         │                       │  - ⌘E 편집/미리보기 토글 단축키  │
│         │ [드래그앤드롭 업로드]  │                                │
│         │  OS파일→패널 드롭     │                                │
│         │  오버레이 피드백      │                                │
│         │ 0xx 프로젝트관리 (2)  │                                │
│ @dnd-kit│   ☐ 000 index.md      │ ── 또는 ──                      │
│ 순서변경 │ 1xx RFP분석 (3)       │                                │
│         │   ☐ 101 공고문요약.md │ DocumentEditor (편집 모드)      │
│         │                       │  - monospace textarea           │
│         │ ─────────────────── │  - ⌘S 저장 + 저장 버튼           │
│         │ [ContextBuilder]      │  - 변경됨/저장됨 상태 표시       │
│         │  2개 선택      [해제] │  - 자동 새로고침 비활성화        │
│         │ [비교][프롬프트파일생성]│                                │
│         │ [템플릿 없음 ▼][⚙관리]│ ── 또는 ──                      │
│         │ ─────────────────── │                                │
│         │ ▼ 작업 로그 (N)       │ DiffViewer (Split View)        │
│         │   03-11 초기화        │  - 체크박스 2개 선택 → [비교]    │
├─────────┴───────────────────────┴────────────────────────────────┤
│ [InitProjectModal] — num (3자리) + title → POST /api/projects    │
│ [CreateDocumentModal] — 파일명(.md 자동) + 내용 → POST /documents │  # v1.5 NEW
│   ⌘Enter 단축키 생성, .md 확장자 자동 추가, autoFocus            │
│ [DeleteConfirmModal] — 확인 → DELETE /documents/{filename}       │  # v1.5 NEW
│ [RenameModal] — 새 파일명 입력 → PATCH /documents/{filename}    │  # v1.8 NEW
│   확장자 제외 자동선택, Enter/⌘Enter 단축키, 중복/빈값 검증     │
│ [DeleteProjectModal] — 확인 → DELETE /projects/{name}           │  # v1.6 NEW
│   프로젝트명 표시, "모든 문서 함께 삭제" 경고                      │
│ [SkillTemplateModal] — 스킬 템플릿 CRUD (localStorage)           │
│ [DirectoryPickerModal] — docs_root 디렉토리 탐색/선택            │  # v1.4 NEW
│   is_valid=false 시 자동 표시, ⚙ 버튼으로 수동 열기              │
└──────────────────────────────────────────────────────────────────┘
```

**상태 관리:**
```
URL searchParams       → selectedProject, selectedDoc
localStorage           → sidebar-collapsed, project-order (DnD), skill-templates (F7)
React state            → compareDoc (Diff 모드), showInitModal, checkedDocs (F6),
                          isEditing (편집 모드 토글, ⌘E 단축키),         # v1.3 NEW / v1.7 UPD
                           isDragOver, uploadError (드래그앤드롭 상태),    # v1.7 NEW
                            showDirectoryPicker (설정 모달),               # v1.4 NEW
                            showCreateModal, deleteTarget (문서 생성/삭제), # v1.5 NEW
                            renameTarget (파일명 변경),                     # v1.8 NEW
                           deleteProjectTarget (프로젝트 삭제)            # v1.6 NEW
TanStack Query         → projects (30s), projectDetail (10s), documentContent (10s), config
                          refetchInterval 기반 자동 새로고침            # v1.3 NEW
```

---

## 7. FILES — 프로젝트 구조

```
agentloop/
├── backend/
│   ├── main.py                  # FastAPI + CORS(:5173,:5174) + router 등록
│   │                            #   + GET /api/config (docs_root 반환)
│   ├── config.py                # config.yaml → get_docs_root() + set_docs_root()
│   │                            #   is_single_project_mode(), resolve_project_dir()  # v1.4 NEW
│   ├── config.yaml              # docs_root 경로 (런타임 변경 시 자동 저장)          # v1.4 UPD
│   ├── pyproject.toml           # uv, deps, dev script(:8066)
│   ├── models/schemas.py        # Pydantic: Project, Document, WorkLog,
│   │                            #   OrphanFile, FeedbackRequest, ProjectDetail,
│   │                            #   CreateDocumentRequest, UpdateDocumentRequest  # v1.3 NEW
│   ├── services/
│   │   ├── index_service.py     # parse_index() — 정규식 md 테이블 파싱
│   │   ├── project_service.py   # list/get/init/delete project + orphan 통합  # v1.6 UPD
│   │   └── document_service.py  # list docs, get content, get worklogs,
│   │                            #   detect_orphans(), insert_feedback(),
│   │                            #   create_document(), update_document_content(),  # v1.3 NEW
│   │                            #   delete_document(),                             # v1.5 NEW
│   │                            #   upload_file() (바이너리 파일 업로드),           # v1.7 NEW
│   │                            #   rename_document() (파일명 변경)                # v1.8 NEW
│   └── routers/
│       ├── projects.py          # /api/projects CRUD + DELETE              # v1.6 UPD
│       ├── documents.py         # /api/projects/{name}/documents + feedback
│       │                        #   + POST create + PUT update + DELETE     # v1.3/v1.5
│       │                        #   + PATCH rename (파일명 변경)            # v1.8 NEW
│       │                        #   + POST /upload (multipart)              # v1.7 NEW
│       └── config.py            # PUT /api/config + GET /api/browse         # v1.4 NEW
│
├── frontend/
│   ├── vite.config.ts           # proxy /api → :8066, tailwindcss plugin
│   ├── package.json             # react 19, @dnd-kit, react-diff-viewer-continued
│   └── src/
│       ├── api/client.ts        # fetch 래퍼 + TS 인터페이스 + fetchConfig()
│       │                        #   + createDocument(), updateDocumentContent()  # v1.3 NEW
│       │                        #   + deleteDocument()                          # v1.5 NEW
│       │                        #   + deleteProject()                           # v1.6 NEW
│       │                        #   + uploadFiles() (FormData multipart)        # v1.7 NEW
│       │                        #   + renameDocument()                          # v1.8 NEW
│       │                        #   + updateConfig(), browsePath()               # v1.4 NEW
│       ├── App.tsx              # → WorkspacePage (단일 렌더)
│       ├── plugins/
│       │   └── rehypeSourceLine.ts  # HTML data-source-line 속성 주입
│       ├── hooks/
│       │   ├── useProjectOrder.ts   # DnD 순서 localStorage 관리
│       │   └── useSkillTemplates.ts # 스킬 템플릿 CRUD localStorage 관리   # v1.2 NEW
│       ├── pages/
│       │   └── WorkspacePage.tsx     # 3컬럼 Master-Detail 메인 페이지
│       │                            #   + refetchInterval, 새로고침 핸들러  # v1.3 NEW
│       │                            #   + config 쿼리, DirectoryPickerModal 연동  # v1.4 NEW
│       │                            #   + deleteProjectTarget 상태, DeleteProjectModal 연동  # v1.6 NEW
│       └── components/
│           ├── AppHeader.tsx         # 상단 바 (≡ 토글 + ↻ 새로고침 + ⚙설정 + 새 프로젝트) # v1.4 UPD
│           ├── ProjectListItem.tsx   # 사이드바 프로젝트 항목 + 드래그 핸들 + 삭제 버튼  # v1.6 UPD
│           ├── ProjectSidebar.tsx    # LEFT: @dnd-kit 프로젝트 목록 + 접기 + 삭제 콜백  # v1.6 UPD
│           ├── DocumentPanel.tsx     # CENTER: Orphan + DocList + ContextBuilder + WorkLog
│           │                        #   + 새 문서 버튼, 생성/삭제 모달 연동    # v1.5 UPD
│           │                        #   + 드래그앤드롭 파일 업로드 (dragCounter 패턴)  # v1.7 NEW
│           ├── OrphanSection.tsx     # 미분류 문서 섹션 (F3) + 체크박스 + 삭제 버튼  # v1.5 UPD
│           ├── DocumentList.tsx      # 대분류(0~9)별 그룹핑 + hideEmpty + 체크박스 + 삭제 버튼  # v1.5 UPD
│           ├── ContextBuilder.tsx    # 문서 장바구니: 프롬프트 파일 생성 + 비교 버튼  # v1.3 UPD
│           ├── SkillTemplateSelector.tsx # 스킬 템플릿 드롭다운 + ⚙관리 버튼  # v1.3 UPD
│           ├── SkillTemplateModal.tsx    # 스킬 템플릿 CRUD 모달
│           ├── WorkLog.tsx           # 작업 로그 표시
│           ├── ViewerPanel.tsx       # RIGHT: 뷰어 ↔ 편집 ↔ Diff 전환 + 클립보드 복사 + 스크롤 위치 복원 + ⌘E 단축키  # v1.7 UPD
│           ├── DocumentEditor.tsx    # 문서 편집기 (textarea, ⌘S 저장)      # v1.3 NEW
│           ├── MarkdownViewer.tsx    # react-markdown + rehypeSourceLine + 피드백
│           │                        #   + 10초 자동 새로고침               # v1.3 UPD
│           ├── FeedbackPopover.tsx   # 텍스트 선택 → 플로팅 버튼 → 지시 입력
│           ├── DiffViewer.tsx        # 두 문서 Split View 비교
│           ├── InitProjectModal.tsx  # 프로젝트 생성 모달
│           ├── CreateDocumentModal.tsx  # 문서 생성 모달 (파일명+내용)       # v1.5 NEW
│           ├── DeleteConfirmModal.tsx   # 문서 삭제 확인 다이얼로그          # v1.5 NEW
│           ├── DeleteProjectModal.tsx  # 프로젝트 삭제 확인 다이얼로그      # v1.6 NEW
│           └── DirectoryPickerModal.tsx # docs_root 디렉토리 탐색/선택 모달  # v1.4 NEW
│
└── docs/                        # 기획/설계 문서 (이 파일 포함)
```

---

## 8. STATUS — 구현 상태

### Phase 1 (코어 워크스페이스) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F1. 1-Step Master-Detail | ✅ | 3컬럼 단일 페이지, URL searchParams 동기화 |
| F2. 프로젝트 관리 + DnD | ✅ | 초기화 모달 + @dnd-kit 순서 변경, localStorage 저장 |
| F3. 미분류 문서 감지 | ✅ | 파일시스템 vs index.md 비교, OrphanSection 컴포넌트 |

### Phase 2 (AI 협업 피드백 루프) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F4. 인라인 피드백 | ✅ | 텍스트 드래그 → 플로팅 버튼 → .md 파일 자동 주입, 포스트잇 렌더링 |
| F5. Diff 뷰어 | ✅ | 체크박스 2개 선택 → [비교] 버튼 또는 Shift+클릭, Split View |

### Phase 3 (프롬프트 엔지니어링 자동화) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F6. Context Builder | ✅ | 문서 체크박스 → PROMPT_*.md 파일 생성 (orphan으로 Agent가 직접 읽기) |
| F7. 스킬 템플릿 시스템 | ✅ | localStorage CRUD, 드롭다운 선택 → 프롬프트 생성 시 instruction 자동 포함 |

### Phase 4 (편의성 개선) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F8. 자동/수동 새로고침 | ✅ | TanStack Query refetchInterval (프로젝트 30s, 문서 10s) + 헤더 ↻ 버튼 |
| F9. 스킬 템플릿 버튼 가시성 | ✅ | 기어 아이콘 확대 + "관리" 라벨 + hover 배경색 |
| F10. 프롬프트 파일 생성 | ✅ | 클립보드 복사 → PROMPT_YYYYMMDD_HHmmss.md 파일 생성, orphan 섹션 즉시 반영 |
| F11. 문서 편집 모드 | ✅ | ViewerPanel 편집/미리보기 토글, DocumentEditor (textarea + ⌘S), PUT API |

### Phase 5 (독립 운영) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F12. 동적 docs_root 설정 | ✅ | PUT /api/config, GET /api/browse, DirectoryPickerModal, config.yaml 자동 저장 |
| F13. 멀티/싱글 프로젝트 자동 감지 | ✅ | is_single_project_mode(), resolve_project_dir() — 프론트 변경 없이 백엔드 자동 판별 |

### Phase 6 (문서 관리) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F14. 문서 생성 UI | ✅ | DocumentPanel "+ 새 문서" 버튼 → CreateDocumentModal (파일명+내용, .md 자동, ⌘Enter) |
| F15. 문서 삭제 | ✅ | DELETE API + 문서/orphan 항목 hover 시 삭제 버튼 → DeleteConfirmModal 확인 |

### Phase 7 (프로젝트 관리 확장) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F16. 프로젝트 삭제 | ✅ | DELETE /api/projects/{name} + 사이드바 hover 삭제 버튼 → DeleteProjectModal 확인, 싱글 모드 차단, shutil.rmtree |

### Phase 8 (편의성 개선 II) — ✅ 완료

| 기능 | 상태 | 비고 |
|------|------|------|
| F17. 드래그앤드롭 파일 업로드 | ✅ | POST /upload (multipart), DocumentPanel 드롭존, dragCounter 패턴, 부분 성공, 미분류로 자동 추가 |
| F18. ⌘E 편집/미리보기 토글 단축키 | ✅ | ViewerPanel ⌘E/Ctrl+E 키보드 단축키, 버튼에 힌트 표시, compare 모드 시 비활성화 |

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
          react-markdown 10, remark-gfm 4, rehype-highlight 7,
          @dnd-kit/core + sortable + modifiers + utilities,
          react-diff-viewer-continued 4,
          tailwindcss 4, vite 7
Runtime:  Python 3.13+, Node 18+, uv
```

---

## 11. DIFF from v1.0 — 변경 이력

```
v1.0 → v1.1 주요 변경:
├── UI: 2-Step (Dashboard → Project) → 1-Step 3컬럼 Master-Detail
├── 삭제: Dashboard.tsx, Project.tsx, ProjectCard.tsx
├── 신규: WorkspacePage, ProjectSidebar, DocumentPanel, ViewerPanel,
│         OrphanSection, AppHeader, ProjectListItem,
│         FeedbackPopover, DiffViewer, rehypeSourceLine, useProjectOrder
├── Backend: OrphanFile + FeedbackRequest 모델, detect_orphans(),
│            insert_feedback(), POST .../feedback 엔드포인트
├── 의존성 추가: @hello-pangea/dnd, react-diff-viewer-continued
└── URL 체계: /project/:name → /?project=X&doc=Y (searchParams)

v1.1 → v1.2 주요 변경:
├── DnD: @hello-pangea/dnd → @dnd-kit (React 19 StrictMode 호환)
│         ProjectListItem에 6점 드래그 핸들 추가
├── F5 개선: 체크박스 2개 선택 시 [비교] 버튼 노출 (Shift+클릭도 유지)
├── F6 신규: ContextBuilder — 문서 체크박스 → @파일경로 클립보드 복사
│         DocumentList, OrphanSection에 체크박스 추가
│         DocumentPanel에 checkedDocs 상태 관리
├── F7 신규: 스킬 템플릿 시스템 (localStorage CRUD)
│         useSkillTemplates 훅, SkillTemplateSelector, SkillTemplateModal
├── Backend: GET /api/config 엔드포인트 추가 (docs_root 반환)
├── Frontend: fetchConfig() + AppConfig 인터페이스 추가
└── 의존성 변경: -@hello-pangea/dnd, +@dnd-kit/core,sortable,modifiers,utilities

v1.2 → v1.3 주요 변경:
├── F8: 자동 새로고침 — TanStack Query refetchInterval 적용
│       projects 30초, projectDetail/documentContent 10초
│       AppHeader에 수동 새로고침 ↻ 버튼 (fetching 시 spin 애니메이션)
├── F9: 스킬 템플릿 관리 버튼 가시성 향상
│       기어 아이콘 text-base + "관리" 라벨 + hover:bg-indigo-50
├── F10: 프롬프트 파일 생성 — 클립보드 복사 → .md 파일 생성으로 변경
│        ContextBuilder useMutation, PROMPT_YYYYMMDD_HHmmss.md 포맷
│        Backend POST /api/projects/{name}/documents 엔드포인트
│        create_document() 서비스 (경로 조작 방지, 중복 파일 체크)
├── F11: 문서 편집 모드 — ViewerPanel 편집/미리보기 토글
│        신규 DocumentEditor 컴포넌트 (monospace textarea)
│        ⌘S/Ctrl+S 키보드 저장, 변경됨/저장됨 상태 표시
│        편집 중 refetchInterval 자동 비활성화
│        Backend PUT /api/projects/{name}/documents/{filename} 엔드포인트
│        update_document_content() 서비스
├── Backend 모델 추가: CreateDocumentRequest, UpdateDocumentRequest
├── Frontend API 추가: createDocument(), updateDocumentContent()
└── WorkspacePage main 영역 overflow-y-auto → overflow-hidden

v1.3 → v1.4 주요 변경:
├── F12: 동적 docs_root 설정
│       config.py: 런타임 상태(_runtime_docs_root) + set_docs_root() + is_docs_root_valid()
│       config.yaml 자동 저장 (_save_config)
│       신규 routers/config.py: PUT /api/config, GET /api/browse
│       신규 Pydantic 모델: UpdateConfigRequest, DirectoryEntry, BrowseResponse
│       GET /api/config 응답에 is_valid 필드 추가
│       신규 DirectoryPickerModal: 디렉토리 탐색 + breadcrumb + 직접 입력 + 선택
│       AppHeader에 ⚙ 설정 버튼 추가
│       WorkspacePage: config useQuery + is_valid=false 시 모달 자동 표시
│       Frontend API: updateConfig(), browsePath()
├── F13: 멀티/싱글 프로젝트 자동 감지
│       config.py: is_single_project_mode(), resolve_project_dir()
│       project_service.py: list_projects() 싱글 모드 분기, _build_project() 추출
│       document_service.py: 7개 함수 모두 resolve_project_dir() 사용으로 통일
│       멀티: docs_root 하위에 프로젝트 폴더 → 기존 동작
│       싱글: docs_root 자체가 프로젝트 → 프로젝트 1개로 표시
└── 설정 변경 시 URL searchParams 초기화 (이전 프로젝트 참조 방지)

v1.4 → v1.5 주요 변경:
├── F14: 문서 생성 UI
│       신규 CreateDocumentModal: 파일명 + 내용(선택) 입력 → POST /documents
│       DocumentPanel 헤더에 "+ 새 문서" 버튼 추가
│       기존 createDocument() API 활용 (새 UI만 추가)
│       .md 확장자 미입력 시 자동 추가, ⌘Enter/Ctrl+Enter 단축키, autoFocus
├── F15: 문서 삭제
│       Backend: delete_document() 서비스 (시스템 파일 보호, 경로 조작 방지)
│       Backend: DELETE /api/projects/{name}/documents/{filename} 엔드포인트
│       신규 DeleteConfirmModal: 삭제 확인 다이얼로그
│       DocumentList, OrphanSection에 hover 시 삭제 버튼 추가
│       Frontend API: deleteDocument()
├── DocumentPanel에 showCreateModal, deleteTarget 상태 추가
│       queryClient.invalidateQueries() 연동으로 삭제/생성 후 즉시 반영
└── 컴포넌트 수: 17 → 19 (CreateDocumentModal, DeleteConfirmModal 추가)

v1.5 → v1.6 주요 변경:
├── F16: 프로젝트 삭제
│       Backend: delete_project() 서비스 (싱글 모드 차단, PROJECT_PATTERN 검증, shutil.rmtree)
│       Backend: DELETE /api/projects/{name} 엔드포인트
│       신규 DeleteProjectModal: 프로젝트 삭제 확인 다이얼로그 ("모든 문서 함께 삭제" 경고)
│       ProjectListItem에 hover 시 삭제 버튼 추가 (group-hover, 휴지통 아이콘)
│       ProjectSidebar에 onDeleteProject 콜백 전달
│       WorkspacePage에 deleteProjectTarget 상태 + 삭제 시 선택 해제 처리
│       Frontend API: deleteProject()
├── 안전장치: 싱글 프로젝트 모드 삭제 차단 (ValueError 400)
│       PROJECT_PATTERN 미매칭 거부, 존재하지 않는 프로젝트 404
│       삭제된 프로젝트가 현재 선택 중이면 searchParams 초기화
└── 컴포넌트 수: 19 → 20 (DeleteProjectModal 추가)

v1.6 기능 추가 + 버그픽스:
├── 뷰어 모드 클립보드 복사 버튼 추가
│       ViewerPanel 헤더에 "복사" 버튼 (뷰어 모드에서만 표시)
│       TanStack Query 캐시에서 raw markdown 읽어서 navigator.clipboard.writeText()
│       클릭 시 "복사됨!" 2초 피드백 (bg-green-100 text-green-700)
├── 문서 전환 시 스크롤 위치 복원
│       ViewerPanel 스크롤 컨테이너에 ref + onScroll로 Map에 위치 저장
│       문서 전환 또는 편집→미리보기 전환 시 requestAnimationFrame으로 복원
│       TanStack Query 캐시 히트 시 즉시 렌더 → 복원 타이밍 자연스러움
├── DiffViewer 스크롤 불가 수정
│       ViewerPanel에서 DiffViewer 반환 시 h-full overflow-y-auto 래퍼 누락
│       부모 <main>이 overflow-hidden이라 확장된 diff 콘텐츠 스크롤 불가
│       MarkdownViewer와 동일한 스크롤 컨테이너 패턴 적용
└── AGENTS.md 문서에 ViewerPanel 스크롤 패턴 규칙 추가

v1.6 → v1.7 주요 변경:
├── F17: 드래그앤드롭 파일 업로드
│       Backend: upload_file() 서비스 (write_bytes, 경로 조작 방지, 중복 검증)
│       Backend: POST /api/projects/{name}/upload (multipart/form-data)
│       신규 Pydantic 모델: UploadError, UploadResult (부분 성공 응답)
│       DocumentPanel에 네이티브 HTML5 드래그앤드롭 핸들러 추가
│       dragCounter ref 패턴으로 자식 요소 경계 플리커 방지
│       dataTransfer.types.includes('Files') 가드로 @dnd-kit 충돌 방지
│       드래그 시 인디고 오버레이 ("파일을 여기에 놓으세요") 표시
│       업로드 에러 인라인 표시 (닫기 버튼)
│       업로드 후 queryClient.invalidateQueries로 OrphanSection 즉시 반영
│       Frontend API: uploadFiles() (FormData multipart, Content-Type 헤더 미설정)
├── F18: ⌘E 편집/미리보기 토글 단축키
│       ViewerPanel에 useEffect + document.addEventListener('keydown') 추가
│       ⌘E (Mac) / Ctrl+E (Windows/Linux) → setIsEditing 토글
│       compare 모드 또는 문서 미선택 시 단축키 비활성화
│       편집/미리보기 버튼에 "⌘E" 힌트 텍스트 + title 속성 추가
│       DocumentEditor의 ⌘S 패턴과 동일한 구현 방식
└── 컴포넌트 수: 20개 (변경 없음, 기존 컴포넌트 수정만)

v1.7 → v1.8 주요 변경:
├── F19: 파일명 변경 (Rename)
│       Backend: rename_document() 서비스 (시스템 파일 보호, 경로 조작 방지, 중복 검증)
│       Backend: PATCH /api/projects/{name}/documents/{filename} 엔드포인트
│       신규 Pydantic 모델: RenameDocumentRequest (new_filename)
│       신규 RenameModal: 파일명 입력 다이얼로그 (DeleteConfirmModal 패턴)
│       입력 필드 자동 포커스 + 확장자 제외 텍스트 선택 (setSelectionRange)
│       Enter / ⌘Enter / Esc 단축키 지원
│       빈값/동일이름 프론트엔드 검증 + 서버 에러 표시
│       DocumentList, OrphanSection에 hover 시 연필 아이콘 이름 변경 버튼 추가
│       DocumentPanel에 renameTarget 상태 + RenameModal 렌더링
│       WorkspacePage에 onRenameDoc 콜백 → URL searchParams doc 파라미터 동기화
│       queryClient.invalidateQueries()로 rename 후 목록 즉시 반영
│       Frontend API: renameDocument() (PATCH, encodeURIComponent)
└── 컴포넌트 수: 20 → 21 (RenameModal 추가)
```
