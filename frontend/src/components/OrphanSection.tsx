import { useState } from 'react';
import type { OrphanFile } from '../api/client';

interface Props {
  orphanFiles: OrphanFile[];
  hasIndex: boolean;
  onSelect: (filename: string) => void;
  selectedDoc: string | null;
  checkedDocs?: Set<string>;
  onToggleCheck?: (filename: string) => void;
  onDelete?: (filename: string) => void;
  onRename?: (filename: string) => void;
}

export default function OrphanSection({ orphanFiles, hasIndex, onSelect, selectedDoc, checkedDocs, onToggleCheck, onDelete, onRename }: Props) {
  const [expanded, setExpanded] = useState(true);

  if (orphanFiles.length === 0 && hasIndex) return null;

  return (
    <div className="mb-3">
      {!hasIndex && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2 text-xs text-amber-700">
          index 파일이 없습니다. 모든 파일이 미분류로 표시됩니다.
        </div>
      )}
      {orphanFiles.length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1 w-full text-left"
          >
            <span className="text-[10px]">{expanded ? '\u25BC' : '\u25B6'}</span>
            미분류 문서 ({orphanFiles.length})
          </button>
          {expanded && (
            <ul className="space-y-0.5">
              {orphanFiles.map((file) => (
                <li key={file.filename} className="group/item flex items-center gap-1">
                  {checkedDocs && onToggleCheck && (
                    <input
                      type="checkbox"
                      checked={checkedDocs.has(file.filename)}
                      onChange={() => onToggleCheck(file.filename)}
                      className="shrink-0 w-3.5 h-3.5 rounded accent-amber-600"
                    />
                  )}
                  <button
                    onClick={() => onSelect(file.filename)}
                    className={`flex-1 min-w-0 text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                      selectedDoc === file.filename
                        ? 'bg-amber-50 text-amber-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs text-amber-400 mr-1">
                      {file.extension === 'md' ? '\u{1F4C4}' : '\u{1F4CE}'}
                    </span>
                    {file.filename}
                  </button>
                  {onRename && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRename(file.filename); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-indigo-500 transition-colors opacity-0 group-hover/item:opacity-100"
                      title="이름 변경"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(file.filename); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                      title="삭제"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
