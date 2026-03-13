import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useIsFetching } from '@tanstack/react-query';
import { fetchProjects, fetchProjectDetail, fetchConfig } from '../api/client';
import AppHeader from '../components/AppHeader';
import ProjectSidebar from '../components/ProjectSidebar';
import DocumentPanel from '../components/DocumentPanel';
import ViewerPanel from '../components/ViewerPanel';
import InitProjectModal from '../components/InitProjectModal';
import DeleteProjectModal from '../components/DeleteProjectModal';
import DirectoryPickerModal from '../components/DirectoryPickerModal';

export default function WorkspacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedProject = searchParams.get('project');
  const selectedDoc = searchParams.get('doc');

  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true',
  );
  const [showInitModal, setShowInitModal] = useState(false);
  const [showDirectoryPicker, setShowDirectoryPicker] = useState(false);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<string | null>(null);
  const [compareDoc, setCompareDoc] = useState<string | null>(null);

  const isFetching = useIsFetching();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  });

  useEffect(() => {
    if (config && !config.is_valid) {
      setShowDirectoryPicker(true);
    }
  }, [config]);

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    refetchInterval: 30_000,
  });

  const { data: projectDetail } = useQuery({
    queryKey: ['project', selectedProject],
    queryFn: () => fetchProjectDetail(selectedProject!),
    enabled: !!selectedProject,
    refetchInterval: 10_000,
  });

  function selectProject(folderName: string) {
    setCompareDoc(null);
    setSearchParams({ project: folderName });
  }

  function selectDocument(filename: string) {
    if (selectedProject) {
      setSearchParams({ project: selectedProject, doc: filename });
    }
  }

  function toggleSidebar() {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  }

  return (
    <div className="h-screen flex flex-col">
      <AppHeader
        onToggleSidebar={toggleSidebar}
        onCreateProject={() => setShowInitModal(true)}
        onRefresh={() => queryClient.invalidateQueries()}
        onOpenSettings={() => setShowDirectoryPicker(true)}
        isFetching={isFetching > 0}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT - Project Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-14' : 'w-56'
          } bg-white border-r border-gray-200 transition-all duration-200 overflow-y-auto shrink-0`}
        >
          <ProjectSidebar
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={selectProject}
            onDeleteProject={(folderName) => setDeleteProjectTarget(folderName)}
            collapsed={sidebarCollapsed}
          />
        </aside>

        {/* CENTER - Document Panel */}
        <section className="w-80 bg-white border-r border-gray-200 overflow-hidden shrink-0">
          <DocumentPanel
            projectDetail={projectDetail ?? null}
            selectedDoc={selectedDoc}
            onSelectDoc={selectDocument}
            compareDoc={compareDoc}
            onSelectCompare={setCompareDoc}
          />
        </section>

        {/* RIGHT - Viewer */}
        <main className="flex-1 overflow-hidden bg-slate-50">
          <ViewerPanel
            projectName={selectedProject}
            filename={selectedDoc}
            compareFilename={compareDoc}
          />
        </main>
      </div>

      {showInitModal && (
        <InitProjectModal
          onClose={() => setShowInitModal(false)}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
        />
      )}

      {deleteProjectTarget && (
        <DeleteProjectModal
          folderName={deleteProjectTarget}
          projectTitle={projects.find((p) => p.folder_name === deleteProjectTarget)?.project_title ?? deleteProjectTarget}
          onClose={() => setDeleteProjectTarget(null)}
          onDeleted={() => {
            if (selectedProject === deleteProjectTarget) {
              setSearchParams({});
              setCompareDoc(null);
            }
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      )}

      {showDirectoryPicker && (
        <DirectoryPickerModal
          currentDocsRoot={config?.docs_root ?? ''}
          onClose={() => setShowDirectoryPicker(false)}
          onSelected={() => {
            setSearchParams({});
            setCompareDoc(null);
            queryClient.invalidateQueries();
          }}
        />
      )}
    </div>
  );
}
