import re
from pathlib import Path

DEFAULT_CATEGORY_NAMES: dict[int, str] = {
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

_TABLE_ROW = re.compile(r"^\|\s*(\d)\s*\|\s*([^|]+?)\s*\|")


def extract_categories_from_markdown(text: str) -> dict[int, str]:
    """대분류표(`| X | 라벨 | ... |`)를 파싱하여 dict 반환.
    누락된 항목은 DEFAULT_CATEGORY_NAMES로 채워 항상 0~9 키를 보장한다."""
    found: dict[int, str] = {}
    for line in text.splitlines():
        m = _TABLE_ROW.match(line.strip())
        if not m:
            continue
        idx = int(m.group(1))
        label = m.group(2).strip()
        if not label:
            continue
        found.setdefault(idx, label)
    return {i: found.get(i, DEFAULT_CATEGORY_NAMES[i]) for i in range(10)}


def extract_categories_from_file(path: Path) -> dict[int, str]:
    if not path.exists():
        return dict(DEFAULT_CATEGORY_NAMES)
    return extract_categories_from_markdown(path.read_text(encoding="utf-8"))
