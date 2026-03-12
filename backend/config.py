import re
from pathlib import Path
import yaml

CONFIG_PATH = Path(__file__).parent / "config.yaml"

_runtime_docs_root: Path | None = None


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def get_docs_root() -> Path:
    if _runtime_docs_root is not None:
        return _runtime_docs_root
    cfg = load_config()
    raw = cfg.get("docs_root", "")
    if raw:
        return Path(raw)
    return Path("")


def is_docs_root_valid() -> bool:
    root = get_docs_root()
    return root != Path("") and root.exists() and root.is_dir()


def set_docs_root(path_str: str) -> Path:
    global _runtime_docs_root
    p = Path(path_str).resolve()
    if not p.exists():
        raise FileNotFoundError(f"Path does not exist: {p}")
    if not p.is_dir():
        raise NotADirectoryError(f"Path is not a directory: {p}")
    _runtime_docs_root = p
    _save_config({"docs_root": str(p)})
    return p


_PROJECT_PATTERN = re.compile(r"^(\d{3})_(.+)$")


def is_single_project_mode() -> bool:
    """docs_root 자체가 프로젝트 폴더인지 판별."""
    root = get_docs_root()
    if not root.exists() or not root.is_dir():
        return False
    for child in root.iterdir():
        if child.is_dir() and _PROJECT_PATTERN.match(child.name):
            return False
    return bool(_PROJECT_PATTERN.match(root.name))


def resolve_project_dir(project_name: str) -> Path:
    """프로젝트 실제 디렉토리 경로. 싱글 모드면 docs_root 자체."""
    root = get_docs_root()
    if is_single_project_mode():
        return root
    return root / project_name


def _save_config(updates: dict) -> None:
    cfg = load_config()
    cfg.update(updates)
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        yaml.dump(cfg, f, default_flow_style=False, allow_unicode=True)
