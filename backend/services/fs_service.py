"""Free-folder browsing — works on any user-chosen absolute path,
independent of the workspace docs_root and project structure."""

import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path

from models.schemas import DirectoryEntry, FsFile, FsListResponse

VIEWABLE_EXTS = {
    "md", "txt", "json", "csv", "yaml", "yml",
    "png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico",
    "html", "htm",
}


def _resolve(path: str | None) -> Path:
    target = Path(path).expanduser().resolve() if path else Path.home()
    if not target.exists():
        raise FileNotFoundError(f"경로를 찾을 수 없습니다: {target}")
    return target


def list_directory(path: str | None) -> FsListResponse:
    target = _resolve(path)
    if not target.is_dir():
        raise NotADirectoryError(f"디렉토리가 아닙니다: {target}")

    directories: list[DirectoryEntry] = []
    files: list[FsFile] = []
    for entry in sorted(target.iterdir()):
        if entry.name.startswith("."):
            continue
        if entry.is_dir():
            directories.append(DirectoryEntry(name=entry.name, path=str(entry)))
        elif entry.is_file():
            ext = entry.suffix.lstrip(".").lower()
            if ext not in VIEWABLE_EXTS:
                continue
            stat = entry.stat()
            files.append(
                FsFile(
                    name=entry.name,
                    path=str(entry),
                    extension=ext,
                    size_bytes=stat.st_size,
                    last_modified=datetime.fromtimestamp(stat.st_mtime),
                )
            )

    parent_path = str(target.parent) if target.parent != target else None
    return FsListResponse(
        current_path=str(target),
        parent_path=parent_path,
        directories=directories,
        files=files,
        path_segments=list(target.parts),
        separator=os.sep,
    )


def resolve_file(path: str) -> Path:
    target = _resolve(path)
    if not target.is_file():
        raise IsADirectoryError(f"파일이 아닙니다: {target}")
    return target


def write_file(path: str, content: str) -> Path:
    target = resolve_file(path)
    target.write_text(content, encoding="utf-8")
    return target


def pick_folder() -> str | None:
    """Show a native OS folder picker dialog and return the chosen path.
    Returns None if the user cancels or the dialog cannot be displayed."""
    if sys.platform == "darwin":
        return _pick_folder_macos()
    return _pick_folder_tk()


def _pick_folder_macos() -> str | None:
    script = (
        'tell application "System Events" to activate\n'
        'POSIX path of (choose folder with prompt "AgentLoop — 폴더 선택")'
    )
    try:
        result = subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            text=True,
            timeout=600,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return _pick_folder_tk()
    if result.returncode != 0:
        return None
    folder = result.stdout.strip().rstrip("/")
    return folder or None


def _pick_folder_tk() -> str | None:
    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError:
        return None
    root = tk.Tk()
    root.withdraw()
    try:
        root.attributes("-topmost", True)
    except tk.TclError:
        pass
    try:
        folder = filedialog.askdirectory(
            initialdir=str(Path.home()),
            mustexist=True,
            title="AgentLoop — 폴더 선택",
        )
    finally:
        root.destroy()
    return folder or None
