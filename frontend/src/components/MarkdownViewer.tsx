import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
      <div className="markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeSourceLine]}
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
