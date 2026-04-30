# Changelog

이 파일은 AgentLoop의 주요 변경사항을 기록합니다.
포맷은 [Keep a Changelog](https://keepachangelog.com/ko/1.1.0/)을 따릅니다.

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
