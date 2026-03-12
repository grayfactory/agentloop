import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import type { Project } from '../api/client';
import useProjectOrder from '../hooks/useProjectOrder';
import ProjectListItem from './ProjectListItem';

interface Props {
  projects: Project[];
  selectedProject: string | null;
  onSelectProject: (folderName: string) => void;
  collapsed: boolean;
}

export default function ProjectSidebar({ projects, selectedProject, onSelectProject, collapsed }: Props) {
  const { orderedProjects, reorder } = useProjectOrder(projects);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedProjects.findIndex((p) => p.folder_name === active.id);
    const newIndex = orderedProjects.findIndex((p) => p.folder_name === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorder(oldIndex, newIndex);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={orderedProjects.map((p) => p.folder_name)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1 p-2">
          {orderedProjects.map((project) => (
            <ProjectListItem
              key={project.folder_name}
              project={project}
              isSelected={selectedProject === project.folder_name}
              onSelect={onSelectProject}
              collapsed={collapsed}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
