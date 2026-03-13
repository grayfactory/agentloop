import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Project } from '../api/client';

interface Props {
  project: Project;
  isSelected: boolean;
  onSelect: (folderName: string) => void;
  onDelete?: (folderName: string) => void;
  collapsed: boolean;
}

export default function ProjectListItem({ project, isSelected, onSelect, onDelete, collapsed }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.folder_name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group/project flex items-center gap-1">
      <button
        {...attributes}
        {...listeners}
        className={`shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 ${
          collapsed ? 'px-0.5' : 'px-1'
        }`}
        aria-label="드래그하여 순서 변경"
        tabIndex={-1}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>
      <button
        onClick={() => onSelect(project.folder_name)}
        className={`flex-1 min-w-0 text-left rounded-lg transition-colors ${
          isSelected
            ? 'bg-indigo-50 border-indigo-200 border'
            : 'hover:bg-gray-50 border border-transparent'
        } ${collapsed ? 'px-1 py-2 flex justify-center' : 'px-3 py-2'}`}
        title={`${project.project_num} ${project.project_title}`}
      >
        <span className={`inline-block text-xs font-mono font-bold rounded px-1.5 py-0.5 ${
          isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {project.project_num}
        </span>
        {!collapsed && (
          <div className="mt-1">
            <div className="text-sm font-medium text-gray-800 truncate">{project.project_title}</div>
            <div className="text-xs text-gray-400">{project.doc_count}개 문서</div>
          </div>
        )}
      </button>
      {onDelete && !collapsed && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(project.folder_name); }}
          className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/project:opacity-100"
          title="프로젝트 삭제"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      )}
    </div>
  );
}
