import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import grievanceService from '../../services/grievanceService';
import { Spinner, Card, Button } from '../../components/ui';
import { AlertTriangle, CheckCircle, Clock, PieChart, Info, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PieChart as RePieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#64748b'];

export default function GrievanceDashboard() {
  const { user } = useAuth();
  const isAdmin = [ROLES.SYSTEM_ADMIN, ROLES.ADMIN].includes(user?.role);
  
  const [stats, setStats] = useState(null);
  const [priorityStats, setPriorityStats] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await grievanceService.getDashboardStats();
        setStats(res.stats);
        setPriorityStats(res.priorityStats);
        setCategoryStats(res.categoryStats);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (error) return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;

  const total = Object.values(stats || {}).reduce((a, b) => a + b, 0);
  const pendingCount = (stats['Submitted'] || 0) + (stats['Pending Review'] || 0);
  const inProgressCount = (stats['In Progress'] || 0) + (stats['Waiting for Employee'] || 0);
  const resolvedCount = (stats['Resolved'] || 0) + (stats['Closed'] || 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Grievance Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Overview of workplace grievances</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link to="/grievance/settings">
              <Button variant="outline" className="flex items-center gap-2">
                Settings
              </Button>
            </Link>
          )}
          {!isAdmin && (
            <Link to="/grievance/new">
              <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus size={16} /> Raise Grievance
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 border-l-4 border-l-slate-500">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-slate-100 dark:bg-navy-800 p-3"><PieChart className="text-slate-600 dark:text-slate-400" size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tickets</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{total}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-orange-100 p-3"><Info className="text-orange-600" size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{pendingCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-100 p-3"><Clock className="text-blue-600" size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">In Progress</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{inProgressCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-green-500">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-green-100 p-3"><CheckCircle className="text-green-600" size={24} /></div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Resolved / Closed</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{resolvedCount}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Priority Distribution</h3>
          {priorityStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={priorityStats.map(s => ({ name: s._id, value: s.count }))}
                    cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                  >
                    {priorityStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Category Breakdown</h3>
          {categoryStats.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={categoryStats.map(s => ({ name: s._id, value: s.count }))}
                    cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  >
                    {categoryStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <ReTooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">No data available</div>
          )}
        </Card>
      </div>
      
      <div className="mt-8 flex justify-center">
        <Link to="/grievance/list">
          <Button variant="outline" className="px-8">View All Tickets</Button>
        </Link>
      </div>
    </div>
  );
}
