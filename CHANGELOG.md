# Changelog

이 파일은 AgentLoop의 주요 변경사항을 기록합니다.
포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)을 따릅니다.

## [1.0.2] - 2026-05-07

대분류 카테고리 라벨을 단일 소스(single source of truth)로 통합. 이제 프리셋의 CLAUDE.md 표만 수정하면 새 프로젝트의 CLAUDE.md / index.md / 사이드바 라벨이 모두 한 번에 변경됩니다. 기존 프로젝트도 그 폴더의 CLAUDE.md 표만 고치면 사이드바·API 응답이 즉시 반영됩니다.

### Added

- **`backend/services/categories_service.py`** — 신규. `extract_categories_from_markdown(text)` 가 프리셋 `content` 또는 프로젝트 `CLAUDE.md`의 `| X | 라벨 | ... |` 표 행을 정규식으로 매칭해 0~9 dict를 반환. 누락 키는 `DEFAULT_CATEGORY_NAMES`(fallback)로 채움.
- **`ProjectDetail.categories: dict[int, str]`** — `GET /api/projects/{name}` 응답에 카테고리 라벨 dict 추가. 매 요청마다 그 프로젝트의 CLAUDE.md를 다시 파싱해 채움.

### Changed

- **`backend/services/project_service.py::init_project()`** — index.md 헤더 10개를 하드코딩 문자열에서 프리셋 표 파싱 결과로 루프 렌더하도록 변경 (`_build_index_md` 헬퍼). CLAUDE.md와 index.md가 같은 dict로 생성되어 정합 보장.
- **`frontend/src/components/DocumentList.tsx`** — 하드코딩된 `CATEGORY_NAMES` dict 삭제. `categories: Record<number, string>` prop을 받아 사용. `DocumentPanel`이 `projectDetail.categories`를 전달.
- **`backend/services/index_service.py`** — 자체 `CATEGORY_NAMES` dict 삭제(중복 제거).

### Notes

- 프리셋 JSON 구조 변경 없음. 사용자는 기존 프리셋 편집 textarea에서 마크다운 표의 라벨만 고치면 됨 — 새 UI 추가되지 않음.
- 기존 프로젝트의 `000_index.md` 헤더는 자동으로 갱신되지 않음(마크다운은 사용자 소유). 사이드바·API 응답만 즉시 반영.

## [1.0.1] - 2026-04-30

Windows 셋업 안정화 패치. v1.0.0의 `setup.bat`이 macOS에서 LF 개행으로 저장되어 Windows cmd가 첫 줄에서 즉시 종료되던 버그를 해결합니다.

### Fixed

- **Windows: `setup.bat` / `start.bat` 즉시 종료** — 빌드 시 모든 `*.bat` 파일을 자동으로 CRLF 개행으로 변환. macOS/Linux 편집기로 저장된 LF only 파일도 ZIP 생성 시 정상화됨.
- **Windows: 한글 echo 깨짐** — `setup.bat` / `start.bat`에 `chcp 65001` 추가.

### Changed

- **Windows: MS Store Python 호환성** — `py -3` launcher를 우선 사용하고, 없으면 `python`로 fallback. App Execution Alias의 stub `python.exe`가 잡히는 문제를 회피하고 Python 3.13+ 버전을 명시적으로 검증.
- **Windows: uv 자동 설치 후 1회 실행으로 셋업 완료** — PATH가 갱신되지 않아도 `%USERPROFILE%\.local\bin\uv.exe`를 직접 사용하도록 fallback 추가. 이전엔 콘솔을 닫고 다시 실행해야 했음.
- **Windows: 콘솔 즉시 닫힘 방지 강화** — `setlocal enabledelayedexpansion`, `pushd`/`popd`, 모든 에러 분기와 종료 직전에 `pause` 보장. `start.bat`도 uvicorn 종료 후 `pause`.

### Added

- **`setup-debug.bat`** — Windows 진단용 스크립트. `@echo on` + 단계마다 `pause`로 Python/uv 탐색, `uv sync` 실행, `frontend\dist` 존재 여부를 차례로 확인할 수 있어 셋업 실패 위치를 즉시 특정 가능.

## [1.0.0] - 2026-04-30

AgentLoop의 첫 정식 배포판. 크로스 플랫폼(macOS / Windows) 배포를 위한 production 빌드 스크립트, setup/start 런처, 그리고 누적된 에디터·뷰어 기능을 포함합니다.

### Added

- **배포 인프라**
  - `scripts/build-release.sh` — frontend 빌드, 스테이징, ZIP 압축, 누출 검증을 자동 수행하는 릴리스 빌드 스크립트
  - `setup.sh` / `setup.bat` — uv 자동 설치 + 의존성 동기화
  - `start.sh` / `start.bat` — uvicorn 백엔드 기동 + 브라우저 자동 오픈
  - `docs/RELEASING.md` — 릴리스 절차 문서
- **에디터 / 마크다운**
  - 이미지 및 HTML 파일 미리보기 (FileResponse + 전용 뷰어)
  - Raw HTML 테이블 지원 (rowspan / colspan / nested)
  - Tab 들여쓰기, 다크 코드 블록 테마
  - 에디터-프리뷰 스크롤 동기화
  - 문서 전환 시 스크롤 위치 복원
  - 뷰어 클립보드 복사 버튼
  - 드래그 앤 드롭 파일 업로드
  - `Cmd+E` 에디터 토글 단축키
- **문서 / 프로젝트 관리**
  - 문서 생성·삭제 모달 + 단축키
  - 문서 이름 변경 (PATCH API + RenameModal)
  - 프로젝트 삭제 (확인 모달, 안전 가드)
  - CLAUDE.md 프리셋 시스템 (프로젝트 생성 시 적용)
- **UI**
  - Favicon 및 헤더 로고

### Changed

- 마크다운 스타일을 `@tailwindcss/typography` + `rehype-highlight` 기반으로 업그레이드
- 뷰어 패널 배경을 흰색으로 변경하여 가독성 개선
- 루트 dev 러너에 `concurrently` 도입 (`npm run dev`로 backend / frontend 동시 기동)

### Fixed

- DiffViewer에서 collapsed 섹션을 펼칠 때 발생하던 스크롤 위치 이슈

### Docs

- PRD v1.9 갱신 (Tab indent, dark code blocks, scroll sync 반영)
- 루트·backend·frontend `AGENTS.md` 갱신

### Security

- 릴리스 ZIP에 사용자 개인 path가 담긴 `backend/config.yaml`이 포함되지 않도록 빌드 단계에서 검증 (포함 시 빌드 실패)
