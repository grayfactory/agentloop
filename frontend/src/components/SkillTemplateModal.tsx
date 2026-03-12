import { useState } from 'react';
import useSkillTemplates, { type SkillTemplate } from '../hooks/useSkillTemplates';

interface Props {
  onClose: () => void;
}

export default function SkillTemplateModal({ onClose }: Props) {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useSkillTemplates();
  const [newName, setNewName] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editInstruction, setEditInstruction] = useState('');

  function handleAdd() {
    if (!newName.trim() || !newInstruction.trim()) return;
    addTemplate(newName.trim(), newInstruction.trim());
    setNewName('');
    setNewInstruction('');
  }

  function startEdit(t: SkillTemplate) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditInstruction(t.instruction);
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim() || !editInstruction.trim()) return;
    updateTemplate(editingId, editName.trim(), editInstruction.trim());
    setEditingId(null);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">스킬 템플릿 관리</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {templates.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">저장된 템플릿이 없습니다.</p>
          )}
          {templates.map((t) => (
            <div key={t.id} className="border border-gray-100 rounded-lg p-3">
              {editingId === t.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1">
                      취소
                    </button>
                    <button onClick={handleSaveEdit} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700">
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">{t.instruction}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(t)} className="text-xs text-gray-400 hover:text-indigo-600 px-1.5 py-0.5">
                      편집
                    </button>
                    <button onClick={() => deleteTemplate(t.id)} className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5">
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">새 템플릿 추가</h3>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="템플릿 이름 (예: 평가항목 목차 구성)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            value={newInstruction}
            onChange={(e) => setNewInstruction(e.target.value)}
            placeholder="지시사항 (예: 선택된 문서들을 바탕으로 평가항목에 맞춰 400번대 목차를 구성해)"
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || !newInstruction.trim()}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
