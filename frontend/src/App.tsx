import { Routes, Route, Navigate } from 'react-router-dom';
import WorkspacePage from './pages/WorkspacePage';
import BrowsePage from './pages/BrowsePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WorkspacePage />} />
      <Route path="/browse" element={<BrowsePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
