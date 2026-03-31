import json
import re
from pathlib import Path

PRESETS_DIR = Path(__file__).resolve().parent.parent / "presets"
BUILTIN_IDS = {"default", "minimal", "research"}


def _preset_path(preset_id: str) -> Path:
    if not re.match(r"^[a-zA-Z0-9_-]+$", preset_id):
        raise ValueError(f"잘못된 프리셋 ID입니다: {preset_id}")
    return PRESETS_DIR / f"{preset_id}.json"


def list_presets() -> list[dict]:
    if not PRESETS_DIR.exists():
        return []
    presets = []
    for f in sorted(PRESETS_DIR.glob("*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            presets.append({
                "id": data.get("id", f.stem),
                "name": data.get("name", f.stem),
                "description": data.get("description", ""),
                "builtin": f.stem in BUILTIN_IDS,
            })
        except (json.JSONDecodeError, KeyError):
            continue
    return presets


def get_preset(preset_id: str) -> dict:
    path = _preset_path(preset_id)
    if not path.exists():
        raise FileNotFoundError(f"프리셋을 찾을 수 없습니다: {preset_id}")
    data = json.loads(path.read_text(encoding="utf-8"))
    data["builtin"] = preset_id in BUILTIN_IDS
    return data


def get_preset_content(preset_id: str) -> str:
    preset = get_preset(preset_id)
    return preset["content"]


def create_preset(preset_id: str, name: str, description: str, content: str) -> dict:
    path = _preset_path(preset_id)
    if path.exists():
        raise FileExistsError(f"이미 존재하는 프리셋입니다: {preset_id}")
    PRESETS_DIR.mkdir(parents=True, exist_ok=True)
    data = {"id": preset_id, "name": name, "description": description, "content": content}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {**data, "builtin": False}


def update_preset(preset_id: str, name: str, description: str, content: str) -> dict:
    if preset_id in BUILTIN_IDS:
        raise ValueError("기본 프리셋은 수정할 수 없습니다.")
    path = _preset_path(preset_id)
    if not path.exists():
        raise FileNotFoundError(f"프리셋을 찾을 수 없습니다: {preset_id}")
    data = {"id": preset_id, "name": name, "description": description, "content": content}
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {**data, "builtin": False}


def delete_preset(preset_id: str) -> None:
    if preset_id in BUILTIN_IDS:
        raise ValueError("기본 프리셋은 삭제할 수 없습니다.")
    path = _preset_path(preset_id)
    if not path.exists():
        raise FileNotFoundError(f"프리셋을 찾을 수 없습니다: {preset_id}")
    path.unlink()


def render_template(content: str, folder_name: str, project_title: str) -> str:
    return content.replace("{{folder_name}}", folder_name).replace("{{project_title}}", project_title)
