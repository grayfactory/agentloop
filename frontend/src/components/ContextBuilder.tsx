import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConfig, createDocument } from '../api/client';
import useSkillTemplates, { type SkillTemplate } from '../hooks/useSkillTemplates';
import SkillTemplateSelector from './SkillTemplateSelector';
import SkillTemplateModal from './SkillTemplateModal';

interface Props {
  projectName: string;
  checkedDocs: Set<string>;
  onClear: () => void;
  onCompare?: (docA: string, docB: string) => void;
}

export default function ContextBuilder({ projectName, checkedDocs, onClear, onCompare }: Props) {
  const queryClient = useQueryClient();
  const { templates } = useSkillTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<SkillTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [createdFile, setCreatedFile] = useState<string | null>(null);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity,
  });

  const createMutation = useMutation({
    mutationFn: ({ filename, content }: { filename: string; content: string }) =>
      createDocument(projectName, filename, content),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectName] });
      setCreatedFile(data.filename);
      setTimeout(() => setCreatedFile(null), 3000);
    },
  });

  function handleGenerate() {
    if (!config || createMutation.isPending) return;

    const filenames = Array.from(checkedDocs).sort();
    const paths = filenames.map((f) => `@${config.docs_root}/${projectName}/${f}`);

    let result = paths.join('\n');

    if (selectedTemplate) {
      result = `${selectedTemplate.instruction}\n\n${result}`;
    }

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const promptFilename = `PROMPT_${ts}.md`;

    createMutation.mutate({ filename: promptFilename, content: result });
  }

  return (
    <>
      <div className="border-t border-indigo-100 bg-indigo-50/50 px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-700">
            {checkedDocs.size}개 선택
          </span>
          <button
            onClick={onClear}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            해제
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {checkedDocs.size === 2 && onCompare && (
            <button
              onClick={() => {
                const [a, b] = Array.from(checkedDocs).sort();
                onCompare(a, b);
              }}
              className="text-[11px] bg-blue-600 text-white px-2 py-1 rounded-md hover:bg-blue-700 transition-colors shrink-0"
            >
              비교
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={!config || createMutation.isPending}
            className="text-[11px] bg-indigo-600 text-white px-2 py-1 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shrink-0"
          >
            {createdFile ? '생성됨!' : createMutation.isPending ? '생성 중...' : '프롬프트 파일 생성'}
          </button>
          <SkillTemplateSelector
            templates={templates}
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
            onManage={() => setShowModal(true)}
          />
        </div>
        {createMutation.isError && (
          <p className="text-[10px] text-red-500">{(createMutation.error as Error).message}</p>
        )}
      </div>
      {showModal && <SkillTemplateModal onClose={() => setShowModal(false)} />}
    </>
  );
}
