import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

import MyLeavePage from './MyLeavePage';
import AdminLeaveDashboard from './AdminLeaveDashboard';
import LeaveTypesPage from './LeaveTypesPage';

function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (![ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role)) {
    return <Navigate to="/leave/my-leaves" replace />;
  }
  return children;
}

export default function LeaveRouter() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAdmin ? 'dashboard' : 'my-leaves'} replace />} />
      <Route path="my-leaves" element={<MyLeavePage />} />
      <Route path="dashboard" element={<RequireAdmin><AdminLeaveDashboard /></RequireAdmin>} />
      <Route path="types" element={<RequireAdmin><LeaveTypesPage /></RequireAdmin>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
