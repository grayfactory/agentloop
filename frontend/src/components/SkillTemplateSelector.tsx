import type { SkillTemplate } from '../hooks/useSkillTemplates';

interface Props {
  templates: SkillTemplate[];
  selected: SkillTemplate | null;
  onSelect: (template: SkillTemplate | null) => void;
  onManage: () => void;
}

export default function SkillTemplateSelector({ templates, selected, onSelect, onManage }: Props) {
  return (
    <div className="flex items-center gap-0.5 min-w-0 flex-1">
      <select
        value={selected?.id ?? ''}
        onChange={(e) => {
          const t = templates.find((t) => t.id === e.target.value) ?? null;
          onSelect(t);
        }}
        className="text-[11px] border border-gray-200 rounded-md px-1.5 py-1 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-w-0 flex-1 truncate"
      >
        <option value="">템플릿 없음</option>
        {templates.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <button
        onClick={onManage}
        className="text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded-md transition-colors shrink-0 flex items-center gap-0.5"
        title="템플릿 관리"
      >
        <span className="text-base leading-none">&#x2699;</span>
        <span className="text-[10px]">관리</span>
      </button>
    </div>
  );
}
