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
├── DocumentPanel          # Center column (w-80)
│   ├── DocumentList       # Categorized document list
│   ├── OrphanSection      # Untracked files display
│   ├── ContextBuilder     # Checkbox → PROMPT_*.md generation
│   ├── SkillTemplateSelector
│   └── WorkLog            # Work log entries
├── ViewerPanel            # Right column (flex-1) + clipboard copy button
│   ├── MarkdownViewer     # Markdown render + source line annotations
│   ├── DocumentEditor     # Textarea + Cmd+S save
│   ├── FeedbackPopover    # Text select → floating feedback UI
│   └── DiffViewer         # Split-view document comparison
├── InitProjectModal       # Create project dialog
├── CreateDocumentModal    # Create new markdown document
├── DeleteConfirmModal     # Confirm document deletion
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
- **Flat components dir** — No feature folders. 20 components in single `components/` directory.
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
