import { useState, useEffect } from 'react';
import type { ProjectDetail } from '../api/client';
import DocumentList from './DocumentList';
import OrphanSection from './OrphanSection';
import WorkLog from './WorkLog';
import ContextBuilder from './ContextBuilder';

interface Props {
  projectDetail: ProjectDetail | null;
  selectedDoc: string | null;
  onSelectDoc: (filename: string) => void;
  compareDoc: string | null;
  onSelectCompare: (filename: string | null) => void;
}

export default function DocumentPanel({
  projectDetail,
  selectedDoc,
  onSelectDoc,
  compareDoc,
  onSelectCompare,
}: Props) {
  const [showWorklog, setShowWorklog] = useState(true);
  const [checkedDocs, setCheckedDocs] = useState<Set<string>>(new Set());

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

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-100">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {projectDetail.project_num} {projectDetail.project_title}
        </h3>
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
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        <OrphanSection
          orphanFiles={projectDetail.orphan_files}
          hasIndex={projectDetail.has_index}
          onSelect={(f) => handleDocClick(f)}
          selectedDoc={selectedDoc}
          checkedDocs={checkedDocs}
          onToggleCheck={handleToggleCheck}
        />
        <DocumentList
          documents={projectDetail.documents}
          selected={selectedDoc}
          onSelect={(f, e) => handleDocClick(f, e)}
          hideEmpty
          checkedDocs={checkedDocs}
          onToggleCheck={handleToggleCheck}
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
    </div>
  );
}
