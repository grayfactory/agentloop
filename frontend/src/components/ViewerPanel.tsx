import { useState, useEffect } from 'react';
import MarkdownViewer from './MarkdownViewer';
import DiffViewer from './DiffViewer';
import DocumentEditor from './DocumentEditor';

interface Props {
  projectName: string | null;
  filename: string | null;
  compareFilename: string | null;
}

export default function ViewerPanel({ projectName, filename, compareFilename }: Props) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [projectName, filename]);

  if (!projectName || !filename) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        프로젝트를 선택한 후 문서를 선택하세요
      </div>
    );
  }

  if (compareFilename) {
    return (
      <DiffViewer
        projectName={projectName}
        oldFilename={filename}
        newFilename={compareFilename}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-100 shrink-0">
        <span className="text-xs text-gray-500 font-medium truncate">{filename}</span>
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

      {isEditing ? (
        <DocumentEditor
          projectName={projectName}
          filename={filename}
        />
      ) : (
        <div className="flex-1 overflow-y-auto p-8 max-w-4xl bg-white">
          <MarkdownViewer projectName={projectName} filename={filename} />
        </div>
      )}
    </div>
  );
}
