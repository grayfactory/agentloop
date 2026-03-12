from pydantic import BaseModel
from datetime import datetime


class Project(BaseModel):
    folder_name: str
    project_num: str
    project_title: str
    doc_count: int
    last_modified: datetime


class Document(BaseModel):
    code: str
    filename: str
    summary: str
    status: str
    category: int


class WorkLog(BaseModel):
    date: str
    content: str
    related_docs: str


class OrphanFile(BaseModel):
    filename: str
    extension: str
    size_bytes: int
    last_modified: datetime


class FeedbackRequest(BaseModel):
    line_number: int
    target_text: str
    instruction: str


class ProjectDetail(BaseModel):
    folder_name: str
    project_num: str
    project_title: str
    documents: list[Document]
    worklogs: list[WorkLog]
    orphan_files: list[OrphanFile]
    has_index: bool


class InitProjectRequest(BaseModel):
    num: str
    title: str


class CreateDocumentRequest(BaseModel):
    filename: str
    content: str


class UpdateDocumentRequest(BaseModel):
    content: str


class UpdateConfigRequest(BaseModel):
    docs_root: str


class DirectoryEntry(BaseModel):
    name: str
    path: str


class BrowseResponse(BaseModel):
    current_path: str
    parent_path: str | None
    directories: list[DirectoryEntry]
