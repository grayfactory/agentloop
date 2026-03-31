import { useState, useEffect } from 'react';
import {
  createProject,
  fetchPresets,
  fetchPreset,
  createPreset,
  updatePreset,
  deletePreset,
  type Preset,
} from '../api/client';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

type ModalView = 'form' | 'preset-list' | 'preset-edit' | 'preset-preview';

export default function InitProjectModal({ onClose, onCreated }: Props) {
  // form states
  const [num, setNum] = useState('');
  const [title, setTitle] = useState('');
  const [presetId, setPresetId] = useState('default');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // view
  const [view, setView] = useState<ModalView>('form');

  // preset edit states
  const [isNewPreset, setIsNewPreset] = useState(false);
  const [formPId, setFormPId] = useState('');
  const [formPName, setFormPName] = useState('');
  const [formPDesc, setFormPDesc] = useState('');
  const [formPContent, setFormPContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [previewName, setPreviewName] = useState('');
  const [presetLoading, setPresetLoading] = useState(false);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const list = await fetchPresets();
      setPresets(list);
    } catch {
      /* ignore */
    }
  }

  function goBack() {
    setError('');
    if (view === 'preset-edit' || view === 'preset-preview') {
      setView('preset-list');
    } else {
      setView('form');
    }
  }

  // --- project creation ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{3}$/.test(num)) {
      setError('프로젝트 번호는 3자리 숫자여야 합니다.');
      return;
    }
    if (!title.trim()) {
      setError('프로젝트 이름을 입력하세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createProject(num, title.trim(), presetId);
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '프로젝트 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  // --- preset management ---
  function openPresetList() {
    setError('');
    setView('preset-list');
  }

  function returnToForm() {
    loadPresets().then(() => {
      // ensure selected preset still exists
      setPresets((prev) => {
        if (!prev.find((p) => p.id === presetId)) setPresetId('default');
        return prev;
      });
    });
    setError('');
    setView('form');
  }

  async function handlePresetPreview(preset: Preset) {
    try {
      const full = await fetchPreset(preset.id);
      setPreviewContent(full.content || '');
      setPreviewName(full.name);
      setView('preset-preview');
    } catch {
      setError('프리셋을 불러올 수 없습니다.');
    }
  }

  async function handlePresetEdit(preset: Preset) {
    try {
      const full = await fetchPreset(preset.id);
      setFormPId(full.id);
      setFormPName(full.name);
      setFormPDesc(full.description);
      setFormPContent(full.content || '');
      setIsNewPreset(false);
      setError('');
      setView('preset-edit');
    } catch {
      setError('프리셋을 불러올 수 없습니다.');
    }
  }

  function handlePresetNew() {
    setFormPId('');
    setFormPName('');
    setFormPDesc('');
    setFormPContent(
      '# CLAUDE.md — {{folder_name}}\n\n## 프로젝트 개요\n- 프로젝트명: {{project_title}}\n- 폴더: {{folder_name}}\n\n---\n\n## 작업 규칙\n\n(여기에 규칙을 작성하세요)\n\n---\n\n## 프로젝트 특이사항\n(프로젝트 진행하며 추가)\n',
    );
    setIsNewPreset(true);
    setError('');
    setView('preset-edit');
  }

  async function handlePresetSave() {
    if (!formPId.trim() || !formPName.trim()) {
      setError('ID와 이름은 필수입니다.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(formPId)) {
      setError('ID는 영문, 숫자, _, - 만 사용할 수 있습니다.');
      return;
    }
    setPresetLoading(true);
    setError('');
    try {
      const payload = { id: formPId, name: formPName, description: formPDesc, content: formPContent };
      if (isNewPreset) {
        await createPreset(payload);
      } else {
        await updatePreset(formPId, payload);
      }
      await loadPresets();
      setView('preset-list');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setPresetLoading(false);
    }
  }

  async function handlePresetDelete(preset: Preset) {
    if (!confirm(`"${preset.name}" 프리셋을 삭제하시겠습니까?`)) return;
    try {
      await deletePreset(preset.id);
      await loadPresets();
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    }
  }

  const selectedPreset = presets.find((p) => p.id === presetId);
  const isWide = view !== 'form';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-xl w-full flex flex-col transition-all duration-200 ${
          isWide ? 'max-w-2xl max-h-[80vh]' : 'max-w-md'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            {view !== 'form' && (
              <button
                onClick={view === 'preset-list' ? returnToForm : goBack}
                className="text-sm text-gray-400 hover:text-gray-600 mr-1"
              >
                &larr;
              </button>
            )}
            <h2 className="text-lg font-bold">
              {view === 'form' && '새 프로젝트 생성'}
              {view === 'preset-list' && 'CLAUDE.md 프리셋 관리'}
              {view === 'preset-edit' && (isNewPreset ? '새 프리셋' : '프리셋 편집')}
              {view === 'preset-preview' && `미리보기: ${previewName}`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          {/* === Form View === */}
          {view === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 번호</label>
                <input
                  type="text"
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                  placeholder="011"
                  maxLength={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 이름</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="스마트팩토리"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CLAUDE.md 프리셋</label>
                <div className="flex gap-2">
                  <select
                    value={presetId}
                    onChange={(e) => setPresetId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {presets.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={openPresetList}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-indigo-600 border border-gray-300 rounded-lg hover:border-indigo-300 transition-colors"
                    title="프리셋 관리"
                  >
                    ⚙
                  </button>
                </div>
                {selectedPreset && (
                  <p className="mt-1 text-xs text-gray-500">{selectedPreset.description}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? '생성 중...' : '생성'}
                </button>
              </div>
            </form>
          )}

          {/* === Preset List View === */}
          {view === 'preset-list' && (
            <div className="space-y-2">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{p.name}</span>
                      {p.builtin && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button
                      onClick={() => handlePresetPreview(p)}
                      className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                    >
                      미리보기
                    </button>
                    {!p.builtin && (
                      <>
                        <button
                          onClick={() => handlePresetEdit(p)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-indigo-600 rounded hover:bg-indigo-50"
                        >
                          편집
                        </button>
                        <button
                          onClick={() => handlePresetDelete(p)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 rounded hover:bg-red-50"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <button
                onClick={handlePresetNew}
                className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
              >
                + 새 프리셋 만들기
              </button>
            </div>
          )}

          {/* === Preset Edit View === */}
          {view === 'preset-edit' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                  <input
                    type="text"
                    value={formPId}
                    onChange={(e) => setFormPId(e.target.value)}
                    placeholder="my-preset"
                    disabled={!isNewPreset}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                  <input
                    type="text"
                    value={formPName}
                    onChange={(e) => setFormPName(e.target.value)}
                    placeholder="내 프리셋"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={formPDesc}
                  onChange={(e) => setFormPDesc(e.target.value)}
                  placeholder="이 프리셋에 대한 설명"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CLAUDE.md 내용
                  <span className="text-xs text-gray-400 ml-2">
                    {'{{folder_name}}'}, {'{{project_title}}'} 사용 가능
                  </span>
                </label>
                <textarea
                  value={formPContent}
                  onChange={(e) => setFormPContent(e.target.value)}
                  rows={14}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                  placeholder="# CLAUDE.md — {{folder_name}}"
                />
              </div>
            </div>
          )}

          {/* === Preset Preview View === */}
          {view === 'preset-preview' && (
            <pre className="text-sm font-mono whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[50vh] overflow-y-auto">
              {previewContent}
            </pre>
          )}
        </div>

        {/* ── Footer (preset-edit only) ── */}
        {view === 'preset-edit' && (
          <div className="flex justify-end px-6 py-4 border-t shrink-0">
            <button
              onClick={handlePresetSave}
              disabled={presetLoading}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {presetLoading ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
