import re
import shutil
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


def delete_project(name: str) -> None:
    if is_single_project_mode():
        raise ValueError("싱글 프로젝트 모드에서는 프로젝트를 삭제할 수 없습니다.")

    m = PROJECT_PATTERN.match(name)
    if not m:
        raise ValueError(f"잘못된 프로젝트 이름입니다: {name}")

    project_dir = resolve_project_dir(name)
    if not project_dir.exists():
        raise FileNotFoundError(f"프로젝트를 찾을 수 없습니다: {name}")

    shutil.rmtree(project_dir)


def init_project(num: str, title: str, preset_id: str = "default") -> str:
    from services.preset_service import get_preset_content, render_template

    docs_root = get_docs_root()
    folder_name = f"{num}_{title}"
    project_dir = docs_root / folder_name

    if project_dir.exists():
        raise FileExistsError(f"Already exists: {folder_name}")

    project_dir.mkdir(parents=True)
    today = datetime.now().strftime("%Y-%m-%d")

    template_content = get_preset_content(preset_id)
    claude_md = render_template(template_content, folder_name, title)

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
