import { useState } from 'react';
import { createDocument } from '../api/client';

interface Props {
  projectName: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateDocumentModal({ projectName, onClose, onCreated }: Props) {
  const [filename, setFilename] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!filename.trim()) {
      setError('파일명을 입력하세요.');
      return;
    }
    const finalName = filename.trim().endsWith('.md') ? filename.trim() : `${filename.trim()}.md`;
    setLoading(true);
    setError('');
    try {
      await createDocument(projectName, finalName, content);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">새 문서 만들기</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">파일명</label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="100_사업개요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-400">.md 확장자는 자동으로 붙습니다</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">내용 (선택)</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="# 문서 제목"
              className="w-full h-32 resize-none px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              취소
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50" title="⌘Enter">
              {loading ? '생성 중...' : '생성 ⌘⏎'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
