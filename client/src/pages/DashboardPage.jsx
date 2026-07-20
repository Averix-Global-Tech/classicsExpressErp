import { useOutletContext } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardBody, StatCard } from '../components/ui';
import { ROLE_LABELS } from '../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { refreshNotifications: _refreshNotifications } = useOutletContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <LayoutDashboard className="text-orange-600" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Welcome back, {user?.name || 'User'}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Your Role" value={ROLE_LABELS[user?.role] || user?.role || '—'} />
        <StatCard title="Status" value={user?.isActive ? 'Active' : 'Inactive'} />
        <StatCard title="Last Login" value={user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'} />
        <StatCard title="Module Phase" value="Phase 1 — Core" />
      </div>


    </div>
  );
}
