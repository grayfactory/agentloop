import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import MarkdownViewer from './MarkdownViewer';
import DiffViewer from './DiffViewer';
import DocumentEditor from './DocumentEditor';

interface Props {
  projectName: string | null;
  filename: string | null;
  compareFilename: string | null;
}

export default function ViewerPanel({ projectName, filename, compareFilename }: Props) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionsRef = useRef(new Map<string, number>());

  useEffect(() => {
    setIsEditing(false);
  }, [projectName, filename]);

  const handleCopy = useCallback(async () => {
    if (!projectName || !filename) return;
    const content = queryClient.getQueryData<string>(['doc', projectName, filename]);
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [queryClient, projectName, filename]);

  const handleScroll = useCallback(() => {
    if (!projectName || !filename || !scrollContainerRef.current) return;
    scrollPositionsRef.current.set(
      `${projectName}/${filename}`,
      scrollContainerRef.current.scrollTop,
    );
  }, [projectName, filename]);

  useEffect(() => {
    if (!projectName || !filename || isEditing) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const saved = scrollPositionsRef.current.get(`${projectName}/${filename}`);
    requestAnimationFrame(() => {
      el.scrollTop = saved ?? 0;
    });
  }, [projectName, filename, isEditing]);

  if (!projectName || !filename) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        프로젝트를 선택한 후 문서를 선택하세요
      </div>
    );
  }

  if (compareFilename) {
    return (
      <div className="h-full overflow-y-auto">
        <DiffViewer
          projectName={projectName}
          oldFilename={filename}
          newFilename={compareFilename}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500 font-medium truncate">{filename}</span>
        <div className="flex items-center gap-1.5">
          {!isEditing && (
            <button
              onClick={handleCopy}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              isEditing
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isEditing ? '미리보기' : '편집'}
          </button>
        </div>
      </div>

      {isEditing ? (
        <DocumentEditor
          projectName={projectName}
          filename={filename}
        />
      ) : (
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 max-w-4xl bg-white"
        >
          <MarkdownViewer projectName={projectName} filename={filename} />
        </div>
      )}
    </div>
  );
}
