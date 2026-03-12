import { useQuery } from '@tanstack/react-query';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';
import { fetchDocumentContent } from '../api/client';

interface Props {
  projectName: string;
  oldFilename: string;
  newFilename: string;
}

export default function DiffViewer({ projectName, oldFilename, newFilename }: Props) {
  const { data: oldContent, isLoading: loadingOld } = useQuery({
    queryKey: ['doc', projectName, oldFilename],
    queryFn: () => fetchDocumentContent(projectName, oldFilename),
  });

  const { data: newContent, isLoading: loadingNew } = useQuery({
    queryKey: ['doc', projectName, newFilename],
    queryFn: () => fetchDocumentContent(projectName, newFilename),
  });

  if (loadingOld || loadingNew) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        문서 비교 로딩 중...
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-3 text-xs text-gray-500">
        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">{oldFilename}</span>
        <span>vs</span>
        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded">{newFilename}</span>
      </div>
      <ReactDiffViewer
        oldValue={oldContent || ''}
        newValue={newContent || ''}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        leftTitle={oldFilename}
        rightTitle={newFilename}
        styles={{
          variables: {
            light: {
              diffViewerBackground: '#ffffff',
              addedBackground: '#e6ffec',
              removedBackground: '#ffebe9',
              wordAddedBackground: '#abf2bc',
              wordRemovedBackground: '#ff818266',
            },
          },
        }}
      />
    </div>
  );
}
