from datetime import datetime
from pathlib import Path

from config import get_docs_root, resolve_project_dir
from models.schemas import Document, FeedbackRequest, OrphanFile, WorkLog
from services.index_service import parse_index

SYSTEM_FILES = {"CLAUDE.md", ".DS_Store", ".gitkeep"}


def list_documents(project_name: str) -> list[Document]:
    index_path = resolve_project_dir(project_name) / "000_index.md"
    documents, _ = parse_index(index_path)
    return documents


def get_document_content(project_name: str, filename: str) -> str:
    file_path = resolve_project_dir(project_name) / filename
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {filename}")
    return file_path.read_text(encoding="utf-8")


def get_worklogs(project_name: str) -> list[WorkLog]:
    index_path = resolve_project_dir(project_name) / "000_index.md"
    _, worklogs = parse_index(index_path)
    return worklogs


def detect_orphans(project_name: str) -> list[OrphanFile]:
    project_dir = resolve_project_dir(project_name)
    index_path = project_dir / "000_index.md"

    registered_filenames: set[str] = set()
    if index_path.exists():
        documents, _ = parse_index(index_path)
        registered_filenames = {doc.filename for doc in documents}
        registered_filenames.add("000_index.md")

    orphans: list[OrphanFile] = []
    for file_path in sorted(project_dir.iterdir()):
        if not file_path.is_file():
            continue
        if file_path.name in registered_filenames:
            continue
        if file_path.name in SYSTEM_FILES:
            continue

        stat = file_path.stat()
        orphans.append(
            OrphanFile(
                filename=file_path.name,
                extension=file_path.suffix.lstrip("."),
                size_bytes=stat.st_size,
                last_modified=datetime.fromtimestamp(stat.st_mtime),
            )
        )

    return orphans


def create_document(project_name: str, filename: str, content: str) -> str:
    """Create a new document file in the project directory."""
    project_dir = resolve_project_dir(project_name)
    if not project_dir.exists():
        raise FileNotFoundError(f"Project not found: {project_name}")

    if "/" in filename or "\\" in filename or ".." in filename:
        raise ValueError(f"Invalid filename: {filename}")

    file_path = project_dir / filename
    if file_path.exists():
        raise FileExistsError(f"File already exists: {filename}")

    file_path.write_text(content, encoding="utf-8")
    return filename


def update_document_content(project_name: str, filename: str, content: str) -> str:
    """Overwrite existing document content."""
    file_path = resolve_project_dir(project_name) / filename
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {filename}")
    file_path.write_text(content, encoding="utf-8")
    return "ok"


def insert_feedback(
    project_name: str, filename: str, req: FeedbackRequest
) -> str:
    file_path = resolve_project_dir(project_name) / filename
    if not file_path.exists():
        raise FileNotFoundError(f"File not found: {filename}")

    lines = file_path.read_text(encoding="utf-8").splitlines(keepends=True)

    feedback_block = (
        f"\n> 💡 **[사용자 피드백]**\n"
        f'> !! 타겟 텍스트: "{req.target_text}"\n'
        f"> !! 지시사항: {req.instruction}\n\n"
    )

    insert_at = min(req.line_number, len(lines))
    lines.insert(insert_at, feedback_block)
    file_path.write_text("".join(lines), encoding="utf-8")
    return "ok"
