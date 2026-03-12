import { useMemo, useState } from 'react';
import type { Project } from '../api/client';

const STORAGE_KEY = 'project-order';

export default function useProjectOrder(projects: Project[]) {
  const [customOrder, setCustomOrder] = useState<string[]>(
    () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  );

  const orderedProjects = useMemo(() => {
    if (customOrder.length === 0) return projects;
    const orderMap = new Map(customOrder.map((name, i) => [name, i]));
    return [...projects].sort((a, b) => {
      const ai = orderMap.get(a.folder_name) ?? Infinity;
      const bi = orderMap.get(b.folder_name) ?? Infinity;
      return ai - bi;
    });
  }, [projects, customOrder]);

  const reorder = (fromIndex: number, toIndex: number) => {
    const newOrder = orderedProjects.map((p) => p.folder_name);
    const [moved] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, moved);
    setCustomOrder(newOrder);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrder));
  };

  return { orderedProjects, reorder };
}
