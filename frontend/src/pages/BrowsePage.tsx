import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useIsFetching } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import AppHeader from '../components/AppHeader';
import {
  fetchFsList,
  fetchFsFileContent,
  updateFsFileContent,
  fsFileUrl,
  pickFolder,
  type FsFile,
  type FsListResponse,
} from '../api/client';

const LAST_PATH_KEY = 'browse-last-path';

type FileKind = 'markdown' | 'image' | 'html' | 'text';
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico']);

function classify(ext: string): FileKind {
  const e = ext.toLowerCase();
  if (IMAGE_EXTS.has(e)) return 'image';
  if (e === 'html' || e === 'htm') return 'html';
  if (e === 'md') return 'markdown';
  return 'text';
}

function joinSegments(segments: string[], separator: string): string {
  if (segments.length === 0) return '';
  const root = segments[0];
  const rest = segments.slice(1).join(separator);
  if (rest === '') return root;
  return root.endsWith(separator) ? root + rest : root + separator + rest;
}

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  const pathParam = searchParams.get('path');
  const fileParam = searchParams.get('file');

  useEffect(() => {
    if (pathParam) localStorage.setItem(LAST_PATH_KEY, pathParam);
  }, [pathParam]);

  const { data: listing, isLoading: listLoading, error: listError } = useQuery({
    queryKey: ['fs-list', pathParam ?? ''],
    queryFn: () => fetchFsList(pathParam!),
    enabled: !!pathParam,
  });

  function navigateTo(path: string) {
    setSearchParams({ path });
  }

  function selectFile(name: string) {
    if (!listing) return;
    setSearchParams({ path: listing.current_path, file: name });
  }

  const selectedFile: FsFile | null =
    listing?.files.find((f) => f.name === fileParam) ?? null;

  return (
    <div className="h-screen flex flex-col">
      <AppHeader
        onRefresh={() => queryClient.invalidateQueries()}
        isFetching={isFetching > 0}
        showWorkspaceActions={false}
      />
      <div className="flex flex-1 overflow-hidden">
        {pathParam ? (
          <>
            <aside className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden shrink-0">
              <BrowseSidebar
                listing={listing ?? null}
                loading={listLoading}
                error={listError instanceof Error ? listError.message : null}
                selectedFile={fileParam}
                onNavigate={navigateTo}
                onSelectFile={selectFile}
              />
            </aside>
            <main className="flex-1 overflow-hidden bg-slate-50">
              {selectedFile ? (
                <BrowseViewer file={selectedFile} />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  {listing ? '왼쪽에서 파일을 선택하세요' : '폴더를 선택하세요'}
                </div>
              )}
            </main>
          </>
        ) : (
          <EmptyState onPick={navigateTo} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (path: string) => void }) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recent = typeof window !== 'undefined' ? localStorage.getItem(LAST_PATH_KEY) : null;

  async function handlePick() {
    setPicking(true);
    setError(null);
    try {
      const picked = await pickFolder();
      if (picked) onPick(picked);
    } catch (e) {
      setError(e instanceof Error ? e.message : '폴더 선택 실패');
    } finally {
      setPicking(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-50 text-center p-8">
      <div className="text-5xl mb-4">&#128193;</div>
      <h2 className="text-base font-semibold text-gray-700 mb-1">폴더 열기</h2>
      <p className="text-xs text-gray-500 mb-5">
        OS 폴더 선택창에서 임의의 디렉토리를 골라 마크다운 파일을 보거나 편집합니다.
      </p>
      <button
        onClick={handlePick}
        disabled={picking}
        className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {picking ? '대기 중...' : '폴더 선택...'}
      </button>
      {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
      {recent && (
        <button
          onClick={() => onPick(recent)}
          className="mt-6 text-xs text-gray-500 hover:text-indigo-600 truncate max-w-md"
          title={recent}
        >
          최근: <span className="font-mono">{recent}</span>
        </button>
      )}
    </div>
  );
}

interface SidebarProps {
  listing: FsListResponse | null;
  loading: boolean;
  error: string | null;
  selectedFile: string | null;
  onNavigate: (path: string) => void;
  onSelectFile: (name: string) => void;
}

function BrowseSidebar({ listing, loading, error, selectedFile, onNavigate, onSelectFile }: SidebarProps) {
  const [manualPath, setManualPath] = useState('');
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    if (listing) setManualPath(listing.current_path);
  }, [listing?.current_path]);

  function handleGo(e: React.FormEvent) {
    e.preventDefault();
    if (manualPath.trim()) onNavigate(manualPath.trim());
  }

  async function handlePickFolder() {
    setPicking(true);
    try {
      const picked = await pickFolder();
      if (picked) onNavigate(picked);
    } finally {
      setPicking(false);
    }
  }

  return (
    <>
      <div className="p-3 border-b border-gray-100 shrink-0 space-y-1.5">
        <button
          onClick={handlePickFolder}
          disabled={picking}
          className="w-full text-xs px-2 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <span>&#128193;</span>
          {picking ? '대기 중...' : '폴더 열기...'}
        </button>
        <form onSubmit={handleGo} className="flex gap-1.5">
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="절대경로 입력..."
            className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50"
          >
            이동
          </button>
        </form>
      </div>

      {listing && listing.path_segments.length > 0 && (
        <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 flex items-center gap-1 overflow-x-auto whitespace-nowrap shrink-0">
          {listing.path_segments.map((seg, i) => {
            const isLast = i === listing.path_segments.length - 1;
            const targetPath = joinSegments(listing.path_segments.slice(0, i + 1), listing.separator);
            return (
              <span key={targetPath} className="flex items-center gap-1">
                {i > 0 && <span className="text-gray-300">{listing.separator}</span>}
                {isLast ? (
                  <span className="text-gray-800 font-medium">{seg || '/'}</span>
                ) : (
                  <button
                    onClick={() => onNavigate(targetPath)}
                    className="hover:text-indigo-600"
                  >
                    {seg || '/'}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="px-3 py-4 text-xs text-gray-400 text-center">불러오는 중...</div>
        )}
        {error && (
          <div className="px-3 py-4 text-xs text-red-500">{error}</div>
        )}
        {listing && !loading && (
          <div className="divide-y divide-gray-100">
            {listing.parent_path && (
              <button
                onClick={() => onNavigate(listing.parent_path!)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 flex items-center gap-2 text-gray-500"
              >
                <span>&#128193;</span>
                <span>..</span>
              </button>
            )}
            {listing.directories.map((dir) => (
              <button
                key={dir.path}
                onClick={() => onNavigate(dir.path)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-indigo-50 flex items-center gap-2"
              >
                <span>&#128193;</span>
                <span className="truncate">{dir.name}</span>
              </button>
            ))}
            {listing.files.map((f) => {
              const isSelected = f.name === selectedFile;
              return (
                <button
                  key={f.path}
                  onClick={() => onSelectFile(f.name)}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 ${
                    isSelected ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-indigo-50'
                  }`}
                >
                  <span>&#128196;</span>
                  <span className="truncate">{f.name}</span>
                </button>
              );
            })}
            {listing.directories.length === 0 && listing.files.length === 0 && !listing.parent_path && (
              <div className="px-3 py-4 text-xs text-gray-400 text-center">비어있는 폴더</div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

interface ViewerProps {
  file: FsFile;
}

function BrowseViewer({ file }: ViewerProps) {
  const kind = classify(file.extension);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsEditing(false);
  }, [file.path]);

  const isTextLike = kind === 'markdown' || kind === 'text';

  const handleToggleEdit = useCallback(() => {
    if (kind !== 'markdown' && kind !== 'text') return;
    setIsEditing((v) => !v);
  }, [kind]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        if (!isTextLike) return;
        e.preventDefault();
        handleToggleEdit();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handleToggleEdit, isTextLike]);

  async function handleCopy() {
    const content = queryClient.getQueryData<string>(['fs-file', file.path]);
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500 font-medium truncate" title={file.path}>{file.name}</span>
        <div className="flex items-center gap-1.5">
          {isTextLike && !isEditing && (
            <button
              onClick={handleCopy}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                copied ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          )}
          {isTextLike && (
            <button
              onClick={handleToggleEdit}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                isEditing ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="⌘E"
            >
              {isEditing ? '미리보기' : '편집'}
              <span className="ml-1 text-gray-400 text-[10px]">⌘E</span>
            </button>
          )}
        </div>
      </div>
      {kind === 'image' ? (
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 overflow-auto">
          <img
            src={fsFileUrl(file.path, file.last_modified)}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      ) : kind === 'html' ? (
        <iframe
          src={fsFileUrl(file.path, file.last_modified)}
          title={file.name}
          className="flex-1 w-full h-full bg-white border-0"
          sandbox="allow-scripts allow-popups allow-forms"
        />
      ) : isEditing ? (
        <FsEditor file={file} />
      ) : (
        <FsTextPreview file={file} />
      )}
    </div>
  );
}

function FsTextPreview({ file }: { file: FsFile }) {
  const kind = classify(file.extension);
  const { data: content, isLoading, error } = useQuery({
    queryKey: ['fs-file', file.path],
    queryFn: () => fetchFsFileContent(file.path),
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        파일을 불러올 수 없습니다.
      </div>
    );
  }

  if (kind === 'markdown') {
    return (
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl bg-white">
        <div className="prose prose-slate max-w-none prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-blockquote:border-indigo-500 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:text-gray-200 prose-th:bg-gray-50">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {content || ''}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <pre className="flex-1 overflow-auto p-4 font-mono text-sm text-gray-800 bg-white whitespace-pre-wrap">
      {content || ''}
    </pre>
  );
}

function FsEditor({ file }: { file: FsFile }) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { data: initialContent, isLoading } = useQuery({
    queryKey: ['fs-file', file.path],
    queryFn: () => fetchFsFileContent(file.path),
    refetchInterval: false,
  });

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent);
      setIsDirty(false);
    }
  }, [initialContent]);

  const saveMutation = useMutation({
    mutationFn: () => updateFsFileContent(file.path, content),
    onSuccess: () => {
      queryClient.setQueryData(['fs-file', file.path], content);
      setIsDirty(false);
    },
  });

  const handleSave = useCallback(() => {
    if (isDirty && !saveMutation.isPending) {
      saveMutation.mutate();
    }
  }, [isDirty, saveMutation]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">로딩 중...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-gray-200 text-xs shrink-0">
        <div className="flex items-center gap-2">
          {isDirty && <span className="text-amber-600 font-medium">변경됨</span>}
          {saveMutation.isPending && <span className="text-gray-400">저장 중...</span>}
          {saveMutation.isSuccess && !isDirty && <span className="text-green-600">저장됨</span>}
          {saveMutation.isError && <span className="text-red-500">저장 실패</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">&#8984;S 저장</span>
          <button
            onClick={handleSave}
            disabled={!isDirty || saveMutation.isPending}
            className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setIsDirty(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Tab') {
            e.preventDefault();
            const ta = e.currentTarget;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const spaces = '  ';
            const next = content.slice(0, start) + spaces + content.slice(end);
            setContent(next);
            setIsDirty(true);
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = start + spaces.length;
            });
          }
        }}
        className="flex-1 w-full p-4 font-mono text-sm text-gray-800 bg-white resize-none focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
