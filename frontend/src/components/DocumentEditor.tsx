import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocumentContent, updateDocumentContent } from '../api/client';
import { scrollTextareaToLine } from '../utils/scrollSync';

interface Props {
  projectName: string;
  filename: string;
  initialLine?: number | null;
  cursorLineRef?: { current: number };
}

export default function DocumentEditor({ projectName, filename, initialLine, cursorLineRef }: Props) {
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: initialContent, isLoading } = useQuery({
    queryKey: ['doc', projectName, filename],
    queryFn: () => fetchDocumentContent(projectName, filename),
    refetchInterval: false,
  });

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const didScrollToInitialLine = useRef(false);

  useEffect(() => {
    didScrollToInitialLine.current = false;
  }, [filename]);

  useEffect(() => {
    if (initialContent !== undefined) {
      setContent(initialContent);
      setIsDirty(false);
    }
  }, [initialContent]);

  useEffect(() => {
    if (didScrollToInitialLine.current) return;
    if (initialLine == null || initialLine <= 0 || !content || !textareaRef.current) return;
    didScrollToInitialLine.current = true;
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        scrollTextareaToLine(textareaRef.current, content, initialLine);
      }
    });
  }, [initialLine, content]);

  const saveMutation = useMutation({
    mutationFn: () => updateDocumentContent(projectName, filename, content),
    onSuccess: () => {
      queryClient.setQueryData(['doc', projectName, filename], content);
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
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        로딩 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-1.5 bg-white border-b border-gray-200 text-xs shrink-0">
        <div className="flex items-center gap-2">
          {isDirty && (
            <span className="text-amber-600 font-medium">변경됨</span>
          )}
          {saveMutation.isPending && (
            <span className="text-gray-400">저장 중...</span>
          )}
          {saveMutation.isSuccess && !isDirty && (
            <span className="text-green-600">저장됨</span>
          )}
          {saveMutation.isError && (
            <span className="text-red-500">저장 실패</span>
          )}
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
        onSelect={() => {
          if (cursorLineRef && textareaRef.current) {
            const pos = textareaRef.current.selectionStart;
            cursorLineRef.current = textareaRef.current.value.slice(0, pos).split('\n').length;
          }
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
