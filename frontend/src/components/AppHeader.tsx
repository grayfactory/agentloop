interface Props {
  onToggleSidebar: () => void;
  onCreateProject: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  isFetching: boolean;
}

export default function AppHeader({ onToggleSidebar, onCreateProject, onRefresh, onOpenSettings, isFetching }: Props) {
  return (
    <header className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700 text-lg"
          title="사이드바 토글"
        >
          &#9776;
        </button>
        <h1 className="text-sm font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
          AgentLoop
          <img src="/logo.png" alt="AgentLoop" className="h-5 w-5" />
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className={`text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100 ${
            isFetching ? 'animate-spin' : ''
          }`}
          title="새로고침"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
          </svg>
        </button>
        <button
          onClick={onOpenSettings}
          className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          title="설정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button
          onClick={onCreateProject}
          className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + 새 프로젝트
        </button>
      </div>
    </header>
  );
}
