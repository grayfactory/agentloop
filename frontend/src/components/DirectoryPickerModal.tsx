import { useState, useEffect } from 'react';
import { browsePath, updateConfig, type BrowseResponse } from '../api/client';

interface Props {
  currentDocsRoot: string;
  onClose: () => void;
  onSelected: () => void;
}

export default function DirectoryPickerModal({ currentDocsRoot, onClose, onSelected }: Props) {
  const [browseData, setBrowseData] = useState<BrowseResponse | null>(null);
  const [manualPath, setManualPath] = useState(currentDocsRoot);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDirectory(currentDocsRoot || undefined);
  }, []);

  async function loadDirectory(path?: string) {
    setLoading(true);
    setError('');
    try {
      const data = await browsePath(path);
      setBrowseData(data);
      setManualPath(data.current_path);
    } catch (err) {
      setError(err instanceof Error ? err.message : '탐색 실패');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelect() {
    const pathToUse = manualPath.trim();
    if (!pathToUse) {
      setError('경로를 입력하세요.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateConfig(pathToUse);
      onSelected();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '설정 변경 실패');
    } finally {
      setSaving(false);
    }
  }

  function handleManualGo(e: React.FormEvent) {
    e.preventDefault();
    if (manualPath.trim()) {
      loadDirectory(manualPath.trim());
    }
  }

  const breadcrumbs = browseData
    ? browseData.current_path.split('/').filter(Boolean)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-1">프로젝트 루트 설정</h2>
        {currentDocsRoot && (
          <p className="text-xs text-gray-500 mb-4 truncate">
            현재: {currentDocsRoot}
          </p>
        )}

        {/* Breadcrumb */}
        {browseData && (
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => loadDirectory('/')}
              className="hover:text-indigo-600"
            >
              /
            </button>
            {breadcrumbs.map((seg, i) => {
              const fullPath = '/' + breadcrumbs.slice(0, i + 1).join('/');
              const isLast = i === breadcrumbs.length - 1;
              return (
                <span key={fullPath} className="flex items-center gap-1">
                  <span className="text-gray-300">/</span>
                  {isLast ? (
                    <span className="text-gray-800 font-medium">{seg}</span>
                  ) : (
                    <button
                      onClick={() => loadDirectory(fullPath)}
                      className="hover:text-indigo-600"
                    >
                      {seg}
                    </button>
                  )}
                </span>
              );
            })}
          </div>
        )}

        {/* Directory List */}
        <div className="border border-gray-200 rounded-lg flex-1 overflow-y-auto min-h-[200px] max-h-[320px] mb-3">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              불러오는 중...
            </div>
          ) : browseData ? (
            <div className="divide-y divide-gray-100">
              {browseData.parent_path && (
                <button
                  onClick={() => loadDirectory(browseData.parent_path!)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2 text-gray-500"
                >
                  <span>&#128193;</span>
                  <span>..</span>
                  <span className="text-xs text-gray-400">(상위 디렉토리)</span>
                </button>
              )}
              {browseData.directories.length === 0 && !browseData.parent_path && (
                <div className="px-3 py-4 text-sm text-gray-400 text-center">
                  하위 디렉토리가 없습니다
                </div>
              )}
              {browseData.directories.map((dir) => (
                <button
                  key={dir.path}
                  onClick={() => loadDirectory(dir.path)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center gap-2"
                >
                  <span>&#128193;</span>
                  <span className="truncate">{dir.name}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* Manual Path Input */}
        <form onSubmit={handleManualGo} className="flex gap-2 mb-3">
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="경로를 직접 입력..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            이동
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            취소
          </button>
          <button
            onClick={handleSelect}
            disabled={saving || !manualPath.trim()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '이 폴더 선택'}
          </button>
        </div>
      </div>
    </div>
  );
}
