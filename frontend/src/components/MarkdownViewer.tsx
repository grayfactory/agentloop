import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { fetchDocumentContent } from '../api/client';
import rehypeSourceLine from '../plugins/rehypeSourceLine';
import FeedbackPopover from './FeedbackPopover';

interface Props {
  projectName: string;
  filename: string;
}

export default function MarkdownViewer({ projectName, filename }: Props) {
  const { data: content, isLoading, error } = useQuery({
    queryKey: ['doc', projectName, filename],
    queryFn: () => fetchDocumentContent(projectName, filename),
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        로딩 중...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        문서를 불러올 수 없습니다.
      </div>
    );
  }

  const isMdFile = filename.endsWith('.md');

  return (
    <div className="relative">
      <div className="prose prose-slate max-w-none prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-2 prose-blockquote:border-indigo-500 prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:text-gray-200 prose-th:bg-gray-50">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight, rehypeSourceLine]}
        >
          {content || ''}
        </ReactMarkdown>
      </div>
      {isMdFile && (
        <FeedbackPopover projectName={projectName} filename={filename} />
      )}
    </div>
  );
}
