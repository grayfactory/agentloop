# FRONTEND KNOWLEDGE BASE

## OVERVIEW

React 19 + TypeScript 5.9 + Vite 7 SPA. Single-page 3-column master-detail workspace. Tailwind CSS v4 for styling.

## WHERE TO LOOK

| Task | File | Notes |
|------|------|-------|
| Add API call | `src/api/client.ts` | Add fetch function + TS interface (manually mirrors backend Pydantic schema) |
| Add component | `src/components/` | Flat directory, `export default function Name()` pattern |
| Add hook | `src/hooks/` | localStorage-backed custom hooks |
| Change layout | `src/pages/WorkspacePage.tsx` | 3-column orchestrator: ProjectSidebar + DocumentPanel + ViewerPanel |
| Change routing/state | `src/pages/WorkspacePage.tsx` | URL searchParams (`?project=X&doc=Y`), no React Router routes |
| Change markdown render | `src/components/MarkdownViewer.tsx` + `src/plugins/rehypeSourceLine.ts` | react-markdown + remark-gfm + rehype-highlight |
| Change styling | Inline Tailwind classes | No CSS modules, no styled-components |
| Change data fetching | Component using `useQuery()` | TanStack Query 5; refetchInterval: 30s (projects), 10s (detail) |

## COMPONENT HIERARCHY

```
App.tsx → WorkspacePage.tsx (sole page)
├── AppHeader              # Top bar: sidebar toggle, create project, refresh, settings
├── ProjectSidebar         # Left column (w-56 / w-14 collapsed)
│   └── ProjectListItem    # DnD-sortable project items (@dnd-kit)
├── DocumentPanel          # Center column (w-80) + drag-and-drop file upload
│   ├── DocumentList       # Categorized document list
│   ├── OrphanSection      # Untracked files display
│   ├── ContextBuilder     # Checkbox → PROMPT_*.md generation
│   ├── SkillTemplateSelector
│   └── WorkLog            # Work log entries
├── ViewerPanel            # Right column (flex-1) + clipboard copy + scroll restore + ⌘E toggle + scroll sync
│   ├── MarkdownViewer     # Markdown render + source line annotations + dark code theme
│   ├── DocumentEditor     # Textarea + Cmd+S save + Tab 2-space indent + scroll sync props
│   ├── FeedbackPopover    # Text select → floating feedback UI
│   └── DiffViewer         # Split-view document comparison
├── InitProjectModal       # Create project + preset management (inline view switch)
├── CreateDocumentModal    # Create new markdown document
├── DeleteConfirmModal     # Confirm document deletion
├── RenameModal            # Rename document dialog (auto-select filename, Enter/⌘Enter/Esc)
├── DeleteProjectModal     # Confirm project deletion (sidebar hover trigger)
├── DirectoryPickerModal   # Select docs_root path
└── SkillTemplateModal     # Skill template CRUD
```

## CONVENTIONS

- **All default exports** — Every component: `export default function ComponentName()`
- **No barrel exports** — Import directly: `import X from '../components/X'`
- **TanStack Query keys** — Array convention: `['projects']`, `['project', name]`, `['config']`
- **Tailwind only** — No CSS modules. All styling via className with Tailwind utilities.
- **Tailwind v4** — Uses `@tailwindcss/vite` plugin (not PostCSS). Import `@tailwindcss/typography` for prose.
- **No global state** — Server state in TanStack Query; UI state in component state + localStorage
- **localStorage keys** — `'sidebar-collapsed'`, `'project-order'`, `'skill-templates'`
- **Flat components dir** — No feature folders. 21 components in single `components/` directory (PresetManagerModal was merged into InitProjectModal).
- **API client pattern** — `const res = await fetch(...)` → check `res.ok` → throw Korean error messages
- **Props pattern** — Inline type annotations in function params, no separate Props interfaces

## ANTI-PATTERNS

- **No `as any` / `@ts-ignore`** — Strict mode: `noUnusedLocals`, `noUnusedParameters`
- **No React.FC** — Use plain function declarations
- **No useEffect for data** — TanStack Query handles all server state
- **No global CSS** — Only `index.css` for Tailwind base + minimal custom styles
- **No error boundaries** — Not yet implemented (known gap)

## KEY DEPENDENCIES

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2 | UI framework (automatic JSX runtime) |
| @tanstack/react-query | 5.x | Server state, auto-refetch |
| react-router-dom | 7.x | URL searchParams sync only (no routes) |
| react-markdown | 10.x | Markdown rendering |
| remark-gfm + rehype-highlight | latest | GFM tables + code highlighting |
| @dnd-kit | latest | Drag-and-drop project reordering |
| react-diff-viewer-continued | 4.x | Split-view document comparison |
| tailwindcss | 4.x | Utility-first CSS (via Vite plugin) |

## NOTES

- **ViewerPanel scroll** — 자식 뷰(MarkdownViewer, DiffViewer 등)는 반드시 `h-full overflow-y-auto` 래퍼 안에 렌더해야 함. 부모 `<main>`이 `overflow-hidden`이라 래퍼 없으면 콘텐츠 확장 시 스크롤 불가.
- **No tests** — ESLint + TypeScript strict mode are the only quality checks
- **Vite proxy** — `/api` → `localhost:8066`; no CORS config needed in dev
- **QueryClient staleTime** — 30s default (set in `main.tsx`)
- **ESM only** — `"type": "module"` in package.json; `verbatimModuleSyntax` in tsconfig
- **Build** — `tsc -b && vite build`; TypeScript errors block build
- **키보드 단축키** — ⌘S (편집 모드 저장, DocumentEditor), ⌘E (편집/미리보기 토글, ViewerPanel), ⌘Enter (모달 제출), Enter (RenameModal 제출), Tab (편집 모드 2-space 들여쓰기, DocumentEditor)
- **드래그앤드롭 패턴** — @dnd-kit은 Pointer Events 기반 (프로젝트 순서 변경), 파일 업로드는 네이티브 HTML5 Drag Events 기반 (DocumentPanel). 충돌 없음 — `dataTransfer.types.includes('Files')` 가드로 구분. `dragCounter` ref로 자식 요소 경계 플리커 방지.
- **스크롤 동기화** — ⌘E 토글 시 미리보기↔편집기 간 스크롤 위치 동기화. utils/scrollSync.ts의 4개 함수(findFirstVisibleSourceLine, scrollTextareaToLine, getLineFromCursor, scrollPreviewToSourceLine) + ViewerPanel의 syncLineRef/editorCursorLineRef + DocumentEditor의 initialLine/cursorLineRef props. rehypeSourceLine 플러그인의 data-source-line 속성이 핵심 인프라.
- **코드블럭 테마** — highlight.js github-dark.css 사용. MarkdownViewer에 prose-pre Tailwind 오버라이드 적용 (bg-[#0d1117], border-gray-700, text-gray-200).
- **Tab indent** — DocumentEditor textarea onKeyDown에서 Tab 키 인터셉트 → 2 spaces 삽입. requestAnimationFrame으로 커서 위치 복원.
