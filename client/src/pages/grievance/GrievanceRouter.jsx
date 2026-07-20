import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

import GrievanceDashboard from './GrievanceDashboard';
import GrievanceList from './GrievanceList';
import NewGrievancePage from './NewGrievancePage';
import GrievanceDetail from './GrievanceDetail';
import GrievanceSettingsPage from './GrievanceSettingsPage';

export default function GrievanceRouter() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<GrievanceDashboard />} />
      
      {/* Employee-only route */}
      {!isAdmin && (
        <Route path="new" element={<NewGrievancePage />} />
      )}
      
      {/* Shared routes */}
      <Route path="list" element={<GrievanceList />} />
      <Route path=":id" element={<GrievanceDetail />} />

      {/* Admin-only routes */}
      {isAdmin && (
        <Route path="settings" element={<GrievanceSettingsPage />} />
      )}

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
