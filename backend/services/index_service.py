import re
from pathlib import Path
from models.schemas import Document, WorkLog

CATEGORY_HEADER = re.compile(r"^### (\d)xx\s+(.+)$")
TABLE_ROW = re.compile(r"^\|\s*(\S+)\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(\S+)\s*\|$")
WORKLOG_ROW = re.compile(r"^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*(.*?)\s*\|$")

CATEGORY_NAMES = {
    0: "프로젝트 관리",
    1: "RFP/공고 분석",
    2: "기획/전략",
    3: "연구/조사",
    4: "기술 설계",
    5: "개발내용 작성",
    6: "정량지표/성과",
    7: "시각화/산출물",
    8: "최종 제출문서",
    9: "참고/기타",
}


def parse_index(index_path: Path) -> tuple[list[Document], list[WorkLog]]:
    if not index_path.exists():
        return [], []

    text = index_path.read_text(encoding="utf-8")
    lines = text.split("\n")

    documents: list[Document] = []
    worklogs: list[WorkLog] = []
    current_category = -1
    in_worklog = False

    for line in lines:
        line = line.strip()

        if line.startswith("## 작업 로그"):
            in_worklog = True
            continue

        if in_worklog:
            m = WORKLOG_ROW.match(line)
            if m:
                worklogs.append(
                    WorkLog(date=m.group(1), content=m.group(2).strip(), related_docs=m.group(3).strip())
                )
            continue

        cat_match = CATEGORY_HEADER.match(line)
        if cat_match:
            current_category = int(cat_match.group(1))
            continue

        if current_category >= 0:
            row_match = TABLE_ROW.match(line)
            if row_match:
                code = row_match.group(1)
                filename = row_match.group(2).strip()
                summary = row_match.group(3).strip()
                status = row_match.group(4).strip()
                if code == "코드" or code == "------":
                    continue
                if filename == "(아직 없음)":
                    continue
                documents.append(
                    Document(
                        code=code,
                        filename=filename,
                        summary=summary,
                        status=status,
                        category=current_category,
                    )
                )

    return documents, worklogs
