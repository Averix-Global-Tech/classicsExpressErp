import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

import MyAttendancePage from './MyAttendancePage';
import AdminAttendanceDashboard from './AdminAttendanceDashboard';
import AdminAttendanceLog from './AdminAttendanceLog';
import AttendanceSettingsPage from './AttendanceSettingsPage';

function RequireAdmin({ children }) {
  const { user } = useAuth();
  const adminRoles = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN];
  
  if (!user || !adminRoles.includes(user.role)) {
    return <Navigate to="/attendance/my-attendance" replace />;
  }
  return children;
}

export default function AttendanceRouter() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);

  return (
    <Routes>
      {/* 
        Default route for Attendance: 
        Admins go to dashboard, regular employees go to "my-attendance" 
      */}
      <Route 
        path="/" 
        element={<Navigate to={isAdmin ? "dashboard" : "my-attendance"} replace />} 
      />

      {/* Employee-facing page */}
      <Route path="my-attendance" element={<MyAttendancePage />} />

      {/* Admin-facing pages */}
      <Route 
        path="dashboard" 
        element={
          <RequireAdmin>
            <AdminAttendanceDashboard />
          </RequireAdmin>
        } 
      />
      <Route 
        path="log" 
        element={
          <RequireAdmin>
            <AdminAttendanceLog />
          </RequireAdmin>
        } 
      />
      <Route 
        path="settings" 
        element={
          <RequireAdmin>
            <AttendanceSettingsPage />
          </RequireAdmin>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
