import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { submitFeedback } from '../api/client';

interface Props {
  projectName: string;
  filename: string;
}

interface SelectionInfo {
  text: string;
  line: number;
  rect: DOMRect;
}

export default function FeedbackPopover({ projectName, filename }: Props) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const [showInput, setShowInput] = useState(false);
  const [instruction, setInstruction] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      submitFeedback(projectName, filename, {
        line_number: selection!.line,
        target_text: selection!.text,
        instruction,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doc', projectName, filename] });
      setShowInput(false);
      setSelection(null);
      setInstruction('');
    },
  });

  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.toString().trim()) {
        if (!showInput) setSelection(null);
        return;
      }

      const text = sel.toString().trim();
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Find closest element with data-source-line
      let node: Node | null = range.startContainer;
      let line = 0;
      while (node) {
        if (node instanceof HTMLElement && node.dataset.sourceLine) {
          line = parseInt(node.dataset.sourceLine, 10);
          break;
        }
        node = node.parentElement;
      }

      setSelection({ text: text.slice(0, 200), line, rect });
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [showInput]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  if (!selection) return null;

  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    top: selection.rect.bottom + 8,
    left: selection.rect.left + selection.rect.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 100,
  };

  if (showInput) {
    return (
      <div
        style={buttonStyle}
        className="bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-xs text-gray-400 mb-1 truncate">
          선택: "{selection.text.slice(0, 60)}..."
        </div>
        <textarea
          ref={inputRef}
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="AI에게 전달할 지시사항을 입력하세요..."
          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.metaKey && instruction.trim()) {
              mutation.mutate();
            }
            if (e.key === 'Escape') {
              setShowInput(false);
              setSelection(null);
            }
          }}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-[10px] text-gray-300">Cmd+Enter 전송 / Esc 취소</span>
          <div className="flex gap-1">
            <button
              onClick={() => { setShowInput(false); setSelection(null); }}
              className="text-xs text-gray-400 px-2 py-1 hover:text-gray-600"
            >
              취소
            </button>
            <button
              onClick={() => instruction.trim() && mutation.mutate()}
              disabled={!instruction.trim() || mutation.isPending}
              className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {mutation.isPending ? '전송 중...' : '피드백 삽입'}
            </button>
          </div>
        </div>
        {mutation.isError && (
          <p className="text-xs text-red-500 mt-1">전송 실패. 다시 시도해주세요.</p>
        )}
      </div>
    );
  }

  return (
    <button
      style={buttonStyle}
      onClick={() => setShowInput(true)}
      className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
    >
      AI에게 수정 요청
    </button>
  );
}
