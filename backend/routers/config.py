from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from config import set_docs_root
from models.schemas import BrowseResponse, DirectoryEntry, UpdateConfigRequest

router = APIRouter(prefix="/api", tags=["config"])


@router.put("/config")
def update_config(req: UpdateConfigRequest):
    try:
        new_root = set_docs_root(req.docs_root)
        return {"docs_root": str(new_root), "is_valid": True}
    except (FileNotFoundError, NotADirectoryError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/browse", response_model=BrowseResponse)
def browse_directories(path: str = Query(default="")):
    if not path:
        target = Path.home()
    else:
        target = Path(path).resolve()

    if not target.exists():
        raise HTTPException(status_code=404, detail=f"경로를 찾을 수 없습니다: {target}")
    if not target.is_dir():
        raise HTTPException(status_code=400, detail=f"디렉토리가 아닙니다: {target}")

    directories: list[DirectoryEntry] = []
    try:
        for entry in sorted(target.iterdir()):
            if entry.is_dir() and not entry.name.startswith("."):
                directories.append(
                    DirectoryEntry(name=entry.name, path=str(entry))
                )
    except PermissionError:
        raise HTTPException(status_code=403, detail=f"접근 권한이 없습니다: {target}")

    parent_path = str(target.parent) if target.parent != target else None

    return BrowseResponse(
        current_path=str(target),
        parent_path=parent_path,
        directories=directories,
    )
