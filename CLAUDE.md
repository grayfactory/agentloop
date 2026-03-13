# CLAUDE.md

이 파일은 AI Agent가 이 프로젝트에서 작업할 때 따라야 할 규칙입니다.

## 규칙

1. **커밋 시 서명하지 않기** — `--no-gpg-sign`, `-S`, `commit.gpgsign` 등 GPG/SSH 서명 옵션을 사용하지 않는다. `Co-Authored-By` 트레일러도 추가하지 않는다.
2. **"관련 문서 업데이트"의 범위** — 기능 추가/변경 후 "관련 문서 업데이트"를 지시받으면 아래 파일들을 **모두** 확인하고 필요 시 갱신한다:
   - `docs/PRD-v1.1-dsl.md` — 버전, API, UI, FILES, STATUS, DIFF 섹션
   - `README.md` — 기능 테이블, API 테이블, 프로젝트 구조
   - `AGENTS.md` (루트) — STRUCTURE, WHERE TO LOOK
   - `backend/AGENTS.md` — WHERE TO LOOK, CONVENTIONS
   - `frontend/AGENTS.md` — COMPONENT HIERARCHY, CONVENTIONS
