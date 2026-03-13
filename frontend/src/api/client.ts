const BASE = '/api';

export interface AppConfig {
  docs_root: string;
  is_valid: boolean;
}

export interface DirectoryEntry {
  name: string;
  path: string;
}

export interface BrowseResponse {
  current_path: string;
  parent_path: string | null;
  directories: DirectoryEntry[];
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}/config`);
  return res.json();
}

export interface Project {
  folder_name: string;
  project_num: string;
  project_title: string;
  doc_count: number;
  last_modified: string;
}

export interface Document {
  code: string;
  filename: string;
  summary: string;
  status: string;
  category: number;
}

export interface WorkLog {
  date: string;
  content: string;
  related_docs: string;
}

export interface OrphanFile {
  filename: string;
  extension: string;
  size_bytes: number;
  last_modified: string;
}

export interface FeedbackRequest {
  line_number: number;
  target_text: string;
  instruction: string;
}

export interface ProjectDetail {
  folder_name: string;
  project_num: string;
  project_title: string;
  documents: Document[];
  worklogs: WorkLog[];
  orphan_files: OrphanFile[];
  has_index: boolean;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE}/projects`);
  return res.json();
}

export async function fetchProjectDetail(name: string): Promise<ProjectDetail> {
  const res = await fetch(`${BASE}/projects/${name}`);
  return res.json();
}

export async function fetchDocuments(name: string): Promise<Document[]> {
  const res = await fetch(`${BASE}/projects/${name}/documents`);
  return res.json();
}

export async function fetchDocumentContent(name: string, filename: string): Promise<string> {
  const res = await fetch(`${BASE}/projects/${name}/documents/${filename}`);
  return res.text();
}

export async function fetchWorklogs(name: string): Promise<WorkLog[]> {
  const res = await fetch(`${BASE}/projects/${name}/worklog`);
  return res.json();
}

export async function submitFeedback(
  projectName: string,
  filename: string,
  feedback: FeedbackRequest,
): Promise<void> {
  const res = await fetch(`${BASE}/projects/${projectName}/documents/${filename}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '피드백 전송 실패');
  }
}

export async function createDocument(
  projectName: string,
  filename: string,
  content: string,
): Promise<{ filename: string; status: string }> {
  const res = await fetch(`${BASE}/projects/${projectName}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '문서 생성 실패');
  }
  return res.json();
}

export async function deleteDocument(
  projectName: string,
  filename: string,
): Promise<void> {
  const res = await fetch(`${BASE}/projects/${projectName}/documents/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '문서 삭제 실패');
  }
}

export async function updateDocumentContent(
  projectName: string,
  filename: string,
  content: string,
): Promise<void> {
  const res = await fetch(`${BASE}/projects/${projectName}/documents/${filename}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '문서 저장 실패');
  }
}

export async function createProject(num: string, title: string): Promise<{ folder_name: string; message: string }> {
  const res = await fetch(`${BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num, title }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '프로젝트 생성 실패');
  }
  return res.json();
}

export async function deleteProject(folderName: string): Promise<void> {
  const res = await fetch(`${BASE}/projects/${encodeURIComponent(folderName)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '프로젝트 삭제 실패');
  }
}

export async function updateConfig(docsRoot: string): Promise<AppConfig> {
  const res = await fetch(`${BASE}/config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docs_root: docsRoot }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '설정 변경 실패');
  }
  return res.json();
}

export async function browsePath(path?: string): Promise<BrowseResponse> {
  const params = path ? `?path=${encodeURIComponent(path)}` : '';
  const res = await fetch(`${BASE}/browse${params}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || '디렉토리 탐색 실패');
  }
  return res.json();
}
