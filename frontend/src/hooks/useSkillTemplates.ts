import { useState } from 'react';

export interface SkillTemplate {
  id: string;
  name: string;
  instruction: string;
  createdAt: string;
}

const STORAGE_KEY = 'skill-templates';

export default function useSkillTemplates() {
  const [templates, setTemplates] = useState<SkillTemplate[]>(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  );

  function persist(next: SkillTemplate[]) {
    setTemplates(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function addTemplate(name: string, instruction: string) {
    const newTemplate: SkillTemplate = {
      id: crypto.randomUUID(),
      name,
      instruction,
      createdAt: new Date().toISOString(),
    };
    persist([...templates, newTemplate]);
  }

  function updateTemplate(id: string, name: string, instruction: string) {
    persist(templates.map((t) => (t.id === id ? { ...t, name, instruction } : t)));
  }

  function deleteTemplate(id: string) {
    persist(templates.filter((t) => t.id !== id));
  }

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}
