import { Routes, Route, Navigate } from 'react-router-dom';
import MyProductivityPage from './MyProductivityPage';
import AdminProductivityPage from './AdminProductivityPage';
import AdminProductivityDetailPage from './AdminProductivityDetailPage';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function ProductivityRouter() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.SYSTEM_ADMIN || user?.role === ROLES.ADMIN;

  return (
    <Routes>
      <Route path="my" element={<MyProductivityPage />} />
      {isAdmin && (
        <>
          <Route path="admin" element={<AdminProductivityPage />} />
          <Route path="admin/:id" element={<AdminProductivityDetailPage />} />
        </>
      )}
      {/* Default redirect to my productivity */}
      <Route path="*" element={<Navigate to="my" replace />} />
    </Routes>
  );
}
