import type { Document } from '../api/client';

interface Props {
  documents: Document[];
  categories: Record<number, string>;
  selected: string | null;
  onSelect: (filename: string, e?: React.MouseEvent) => void;
  hideEmpty?: boolean;
  checkedDocs?: Set<string>;
  onToggleCheck?: (filename: string) => void;
  onDelete?: (filename: string) => void;
  onRename?: (filename: string) => void;
}

export default function DocumentList({ documents, categories, selected, onSelect, hideEmpty = false, checkedDocs, onToggleCheck, onDelete, onRename }: Props) {
  const grouped = new Map<number, Document[]>();
  for (let i = 0; i <= 9; i++) grouped.set(i, []);
  for (const doc of documents) {
    const cat = grouped.get(doc.category);
    if (cat) cat.push(doc);
  }

  return (
    <nav className="space-y-3">
      {Array.from(grouped.entries()).map(([cat, docs]) => {
        if (hideEmpty && docs.length === 0) return null;
        return (
        <div key={cat}>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {cat}xx {categories[cat] ?? ''} ({docs.length})
          </h4>
          {docs.length === 0 ? (
            <p className="text-xs text-gray-300 pl-2">-</p>
          ) : (
            <ul className="space-y-0.5">
              {docs.map((doc) => (
                <li key={doc.filename} className="group/item flex items-center gap-1">
                  {checkedDocs && onToggleCheck && (
                    <input
                      type="checkbox"
                      checked={checkedDocs.has(doc.filename)}
                      onChange={() => onToggleCheck(doc.filename)}
                      className="shrink-0 w-3.5 h-3.5 rounded accent-indigo-600"
                    />
                  )}
                  <button
                    onClick={(e) => onSelect(doc.filename, e)}
                    className={`flex-1 min-w-0 text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
                      selected === doc.filename
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xs text-gray-400 mr-1">{doc.code}</span>
                    {doc.filename.replace(/^\d{3}_/, '').replace(/\.md$/, '')}
                  </button>
                  {onRename && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRename(doc.filename); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-indigo-500 transition-colors opacity-0 group-hover/item:opacity-100"
                      title="이름 변경"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(doc.filename); }}
                      className="shrink-0 p-1 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                      title="삭제"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        );
      })}
    </nav>
  );
}
