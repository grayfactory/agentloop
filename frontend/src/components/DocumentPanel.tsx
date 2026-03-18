import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { ProjectDetail } from '../api/client';
import { uploadFiles } from '../api/client';
import DocumentList from './DocumentList';
import OrphanSection from './OrphanSection';
import WorkLog from './WorkLog';
import ContextBuilder from './ContextBuilder';
import CreateDocumentModal from './CreateDocumentModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import RenameModal from './RenameModal';

interface Props {
  projectDetail: ProjectDetail | null;
  selectedDoc: string | null;
  onSelectDoc: (filename: string) => void;
  compareDoc: string | null;
  onSelectCompare: (filename: string | null) => void;
  onRenameDoc?: (newFilename: string) => void;
}

export default function DocumentPanel({
  projectDetail,
  selectedDoc,
  onSelectDoc,
  compareDoc,
  onSelectCompare,
  onRenameDoc,
}: Props) {
  const queryClient = useQueryClient();
  const [showWorklog, setShowWorklog] = useState(true);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const dragCounter = useRef(0);

  useEffect(() => {
    setCheckedDocs(new Set());
  }, [projectDetail?.folder_name]);

  if (!projectDetail) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        프로젝트를 선택하세요
      </div>
    );
  }

  function handleDocClick(filename: string, e?: React.MouseEvent) {
    if (e?.shiftKey && selectedDoc && selectedDoc !== filename) {
      onSelectCompare(filename);
    } else {
      onSelectCompare(null);
      onSelectDoc(filename);
    }
  }

  function handleToggleCheck(filename: string) {
    setCheckedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragOver(false);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragOver(false);
    setUploadError(null);

    if (!projectDetail) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    try {
      const result = await uploadFiles(projectDetail.folder_name, files);
      if (result.uploaded.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['project', projectDetail.folder_name] });
      }
      if (result.errors.length > 0) {
        setUploadError(result.errors.map((err) => `${err.filename}: ${err.detail}`).join(', '));
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : '파일 업로드 실패');
    }
  }

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-50/80 border-2 border-dashed border-indigo-400 rounded-lg pointer-events-none">
          <p className="text-sm font-medium text-indigo-600">파일을 여기에 놓으세요</p>
        </div>
      )}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            {projectDetail.project_num} {projectDetail.project_title}
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            + 새 문서
          </button>
        </div>
        {compareDoc && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              비교 모드
            </span>
            <button
              onClick={() => onSelectCompare(null)}
              className="text-[10px] text-gray-400 hover:text-red-500"
            >
              해제
            </button>
          </div>
        )}
        {uploadError && (
          <div className="mt-1 flex items-center gap-1">
            <span className="text-[10px] text-red-600 truncate max-w-[250px]">{uploadError}</span>
            <button
              onClick={() => setUploadError(null)}
              className="text-[10px] text-gray-400 hover:text-red-500 shrink-0"
            >
              닫기
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <OrphanSection
          orphanFiles={projectDetail.orphan_files}
          hasIndex={projectDetail.has_index}
          onSelect={(f) => handleDocClick(f)}
          selectedDoc={selectedDoc}
          checkedDocs={checkedDocs}
          onToggleCheck={handleToggleCheck}
          onDelete={(f) => setDeleteTarget(f)}
          onRename={(f) => setRenameTarget(f)}
        />
        <DocumentList
          documents={projectDetail.documents}
          selected={selectedDoc}
          onSelect={(f, e) => handleDocClick(f, e)}
          hideEmpty
          checkedDocs={checkedDocs}
          onToggleCheck={handleToggleCheck}
          onDelete={(f) => setDeleteTarget(f)}
          onRename={(f) => setRenameTarget(f)}
        />
      </div>

      {checkedDocs.size > 0 && (
        <ContextBuilder
          projectName={projectDetail.folder_name}
          checkedDocs={checkedDocs}
          onClear={() => setCheckedDocs(new Set())}
          onCompare={(docA, docB) => {
            onSelectDoc(docA);
            onSelectCompare(docB);
          }}
        />
      )}

      <div className="border-t border-gray-100 px-3 py-2">
        <button
          onClick={() => setShowWorklog(!showWorklog)}
          className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 w-full text-left"
        >
          {showWorklog ? '\u25BC' : '\u25B6'} 작업 로그 ({projectDetail.worklogs.length})
        </button>
        {showWorklog && projectDetail.worklogs.length > 0 && (
          <div className="max-h-40 overflow-y-auto">
            <WorkLog worklogs={projectDetail.worklogs} />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDocumentModal
          projectName={projectDetail.folder_name}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['project', projectDetail.folder_name] })}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          projectName={projectDetail.folder_name}
          filename={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => queryClient.invalidateQueries({ queryKey: ['project', projectDetail.folder_name] })}
        />
      )}

      {renameTarget && (
        <RenameModal
          projectName={projectDetail.folder_name}
          filename={renameTarget}
          onClose={() => setRenameTarget(null)}
          onRenamed={(newFilename) => {
            queryClient.invalidateQueries({ queryKey: ['project', projectDetail.folder_name] });
            onRenameDoc?.(newFilename);
          }}
        />
      )}
    </div>
  );
}
