import re
from datetime import datetime
from pathlib import Path

from config import get_docs_root, is_single_project_mode, resolve_project_dir
from models.schemas import Project, ProjectDetail
from services.document_service import detect_orphans
from services.index_service import parse_index

PROJECT_PATTERN = re.compile(r"^(\d{3})_(.+)$")


def _build_project(folder: Path) -> Project | None:
    m = PROJECT_PATTERN.match(folder.name)
    if not m:
        return None
    md_files = list(folder.glob("*.md"))
    last_mod = datetime.fromtimestamp(folder.stat().st_mtime)
    for f in md_files:
        ft = datetime.fromtimestamp(f.stat().st_mtime)
        if ft > last_mod:
            last_mod = ft
    return Project(
        folder_name=folder.name,
        project_num=m.group(1),
        project_title=m.group(2),
        doc_count=len(md_files),
        last_modified=last_mod,
    )


def list_projects() -> list[Project]:
    docs_root = get_docs_root()
    if not docs_root.exists():
        return []

    if is_single_project_mode():
        p = _build_project(docs_root)
        return [p] if p else []

    projects: list[Project] = []
    for folder in sorted(docs_root.iterdir()):
        if not folder.is_dir():
            continue
        p = _build_project(folder)
        if p:
            projects.append(p)
    return projects


def get_project(name: str) -> ProjectDetail:
    project_dir = resolve_project_dir(name)
    if not project_dir.exists():
        raise FileNotFoundError(f"Project not found: {name}")

    m = PROJECT_PATTERN.match(name)
    if not m:
        raise ValueError(f"Invalid project name: {name}")

    index_path = project_dir / "000_index.md"
    has_index = index_path.exists()
    documents, worklogs = parse_index(index_path)
    orphan_files = detect_orphans(name)

    return ProjectDetail(
        folder_name=name,
        project_num=m.group(1),
        project_title=m.group(2),
        documents=documents,
        worklogs=worklogs,
        orphan_files=orphan_files,
        has_index=has_index,
    )


def init_project(num: str, title: str) -> str:
    docs_root = get_docs_root()
    folder_name = f"{num}_{title}"
    project_dir = docs_root / folder_name

    if project_dir.exists():
        raise FileExistsError(f"Already exists: {folder_name}")

    project_dir.mkdir(parents=True)
    today = datetime.now().strftime("%Y-%m-%d")

    claude_md = f"""# CLAUDE.md — {folder_name}

## 프로젝트 개요
- 프로젝트명: {title}
- 폴더: {folder_name}

---

## 문서 관리 코드 체계

이 프로젝트는 3자리 코드 체계를 사용합니다. **모든 문서 생성/참조 시 이 규칙을 따르세요.**

### 코드 구조
```
XYZ_파일명.md

X  (백의 자리) = 대분류
YZ (십·일의 자리) = 생성 순번 (00~99)
```

### 대분류표

| X | 대분류 | 포함 내용 |
|---|-------|----------|
| 0 | 프로젝트 관리 | 인덱스, 세션기록, CLAUDE.md, 문서체계 |
| 1 | RFP/공고 분석 | RFP 원문, 요구사항 분해, 평가기준 |
| 2 | 기획/전략 | 개발 방향, RNR, 컨소시엄, 일정, 예산 |
| 3 | 연구/조사 | 문헌연구, 기술동향, 시장조사, 특허 |
| 4 | 기술 설계 | 시스템 아키텍처, 데이터 스키마, API |
| 5 | 개발내용 작성 | 년차별 상세, 모듈별 개발, 개발범위 |
| 6 | 정량지표/성과 | 성능지표, KPI, 측정방법 |
| 7 | 시각화/산출물 | 도식, wireframe, HTML, 흐름도 |
| 8 | 최종 제출문서 | 신청서 항목별 최종본, 교정본 |
| 9 | 참고/기타 | 용어통일, IP, 외부자료 |

### 필수 행동 규칙

**세션 시작 시:**
1. 이 파일(CLAUDE.md) 읽기
2. `000_index.md` 읽기 → 현재 문서 현황 파악

**문서 생성 시:**
1. 적절한 대분류(X) 결정
2. 해당 대분류의 마지막 순번 확인 후 다음 번호 부여
3. `000_index.md` 문서 현황 테이블에 등록 — **요약 칸은 30자 이내**, 이 문서가 왜/무엇인지 한 마디로

**작업 완료 시:**
1. `000_index.md` 하단 "작업 로그"에 추가 — **작업 내용 50자 이내**로 요약 (날짜 + 무엇을 했는지 + 관련 문서)

**세션 종료 시:**
1. `000_index.md` 최종 업데이트 (새로 생성·수정된 문서 반영, 작업 로그 누락 확인)

### 파일명 형식
```
{{XYZ}}_{{설명적이름}}.md
예: 100_RFP원문정리.md, 301_문헌연구_Huang2025.md
```

### 버전 관리
- 같은 주제 반복 → 순번 증가 (500 → 501)
- `_v2`, `_re` 접미사 사용하지 않음

---

## 프로젝트 특이사항
(프로젝트 진행하며 추가)
"""

    index_md = f"""# 000_index — {folder_name}

> 마지막 업데이트: {today}

---

## 문서 현황

### 0xx 프로젝트 관리
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| 000 | 000_index.md | 문서 목록 + 작업 이력 마스터 인덱스 | 운영중 |
| - | CLAUDE.md | Agent 지시문, 코드체계 규칙 포함 | 운영중 |

### 1xx RFP/공고 분석
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 2xx 기획/전략
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 3xx 연구/조사
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 4xx 기술 설계
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 5xx 개발내용 작성
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 6xx 정량지표/성과
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 7xx 시각화/산출물
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 8xx 최종 제출문서
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

### 9xx 참고/기타
| 코드 | 파일명 | 요약 | 상태 |
|------|--------|------|------|
| - | (아직 없음) | - | - |

---

## 작업 로그

| 날짜 | 작업 내용 | 관련 문서 |
|------|----------|----------|
| {today} | 프로젝트 초기화, 문서 관리 템플릿 생성 | CLAUDE.md, 000_index.md |
"""

    (project_dir / "CLAUDE.md").write_text(claude_md, encoding="utf-8")
    (project_dir / "000_index.md").write_text(index_md, encoding="utf-8")

    return folder_name
