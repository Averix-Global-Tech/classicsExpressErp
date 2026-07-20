import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

import MyTasksPage from './MyTasksPage';
import AdminTaskDashboard from './AdminTaskDashboard';

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (![ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role)) {
    return <Navigate to="/tasks/my-tasks" replace />;
  }
  return children;
}

export default function TaskRouter() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAdmin ? 'dashboard' : 'my-tasks'} replace />} />
      <Route path="my-tasks" element={<MyTasksPage />} />
      <Route path="dashboard" element={<RequireAdmin><AdminTaskDashboard /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
