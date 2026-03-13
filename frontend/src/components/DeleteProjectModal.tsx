import { useState } from 'react';
import { deleteProject } from '../api/client';

interface DeleteProjectModalProps {
  folderName: string;
  projectTitle: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteProjectModal({
  folderName,
  projectTitle,
  onClose,
  onDeleted,
}: DeleteProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      await deleteProject(folderName);
      onDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">프로젝트 삭제</h2>

        <div className="mb-6">
          <p className="text-gray-800 mb-2">
            &ldquo;{projectTitle}&rdquo; 프로젝트를 삭제하시겠습니까?
          </p>
          <p className="text-gray-500 text-sm">
            프로젝트 내 모든 문서가 함께 삭제되며, 이 작업은 되돌릴 수 없습니다.
          </p>
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
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  );
}
