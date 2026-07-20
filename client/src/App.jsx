import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailPage from './pages/EmployeeDetailPage';
import AttendanceRouter from './pages/attendance/AttendanceRouter';
import GrievanceRouter from './pages/grievance/GrievanceRouter';
import ProductivityRouter from './pages/productivity/ProductivityRouter';
import ShipmentRouter from './pages/shipment/ShipmentRouter';
import LeaveRouter from './pages/leave/LeaveRouter';
import TaskRouter from './pages/task/TaskRouter';
import SettingsPage from './pages/settings/SettingsPage';
import { Spinner } from './components/ui';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, initialized, user } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-navy-900/50">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // If user must change password, only allow /change-password
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-navy-900/50">
        <Spinner size={28} />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AuthLayout title="Sign in to your account" subtitle="Enter your credentials to continue">
              <LoginPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <AuthLayout title="Forgot password" subtitle="We'll send you a reset link">
              <ForgotPasswordPage />
            </AuthLayout>
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <AuthLayout title="Reset password" subtitle="Enter your new password">
            <ResetPasswordPage />
          </AuthLayout>
        }
      />

      {/* Force password change — accessible when authenticated but mustChangePassword=true */}
      <Route path="/change-password" element={<ChangePasswordPage />} />

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/employees" element={<EmployeeListPage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/attendance/*" element={<AttendanceRouter />} />
        <Route path="/grievance/*" element={<GrievanceRouter />} />
        <Route path="/productivity/*" element={<ProductivityRouter />} />
        <Route path="/shipment/*" element={<ShipmentRouter />} />
        <Route path="/leave/*" element={<LeaveRouter />} />
        <Route path="/tasks/*" element={<TaskRouter />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
