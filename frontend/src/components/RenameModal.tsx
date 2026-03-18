import { useState, useEffect, useRef } from 'react';
import { renameDocument } from '../api/client';

interface RenameModalProps {
  projectName: string;
  filename: string;
  onClose: () => void;
  onRenamed: (newFilename: string) => void;
}

export default function RenameModal({
  projectName,
  filename,
  onClose,
  onRenamed,
}: RenameModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newFilename, setNewFilename] = useState(filename);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const dotIndex = filename.lastIndexOf('.');
      if (dotIndex > 0) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [filename]);

  const handleRename = async () => {
    const trimmed = newFilename.trim();
    if (!trimmed) {
      setError('파일명을 입력해주세요.');
      return;
    }
    if (trimmed === filename) {
      setError('새 파일명이 기존 파일명과 동일합니다.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await renameDocument(projectName, filename, trimmed);
      onRenamed(result.new_filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일명 변경 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleRename();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">파일명 변경</h2>
        
        <div className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="새 파일명 입력"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleRename}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? '변경 중...' : '변경'}
          </button>
        </div>
      </div>
    </div>
  );
}
