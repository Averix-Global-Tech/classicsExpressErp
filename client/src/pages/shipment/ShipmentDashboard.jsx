import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckCircle2, Clock, ShieldAlert, RotateCcw, TrendingUp, Plus, BarChart3,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Badge, StatCard, Spinner, EmptyState } from '../../components/ui';

const OPERATOR_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.ADMIN,
  ROLES.BRANCH_MANAGER,
  ROLES.DISPATCHER,
  ROLES.CUSTOMER_SERVICE,
  ROLES.EMPLOYEE,
];

export default function ShipmentDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const isOperator = OPERATOR_ROLES.includes(user?.role);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    shipmentService
      .getDashboardStats()
      .then(setData)
      .catch(() => toast.error('Failed to load shipment dashboard'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!data) return null;

  const { stats, bookedToday, deliveredToday, deliverySuccessRate, recentShipments, employeeBreakdown, branchBreakdown } = data;
  
  const isAdmin = ROLES.SYSTEM_ADMIN === user?.role || ROLES.ADMIN === user?.role;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Shipments</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Track and manage every courier from booking to delivery.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/shipment/reports">
            <Button variant="secondary" className="gap-2"><BarChart3 size={16} /> Reports</Button>
          </Link>
          {isOperator && (
            <Link to="/shipment/new">
              <Button className="gap-2"><Plus size={16} /> Book Shipment</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shipments" value={stats.total} icon={Package} accent="blue" />
        <StatCard title="Booked Today" value={bookedToday} icon={Plus} accent="purple" />
        <StatCard title="In Transit" value={stats.inTransit} icon={Truck} accent="amber" />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} accent="green" />
        <StatCard title="Pending Pickup" value={stats.pendingPickup} icon={Clock} accent="grey" />
        <StatCard title="Customs Hold" value={stats.customsHold} icon={ShieldAlert} accent="amber" />
        <StatCard title="Returned" value={stats.returned} icon={RotateCcw} accent="red" />
        <StatCard
          title="Delivery Success Rate"
          value={`${deliverySuccessRate}%`}
          icon={TrendingUp}
          accent="green"
          hint={`${deliveredToday} delivered today`}
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Recent Shipments</h3>
          <Link to="/shipment/list" className="text-sm font-medium text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </div>
        {recentShipments.length === 0 ? (
          <EmptyState icon={Package} title="No shipments yet" description="Booked shipments will show up here." />
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-700/50">
            {recentShipments.map((s) => (
              <Link
                key={s._id}
                to={`/shipment/${s._id}`}
                className="flex items-center justify-between px-5 py-3 transition hover:bg-slate-50 dark:bg-navy-900/50"
              >
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{s.awbNumber}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    To {s.receiver?.name} &middot; {s.destinationCountry}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge>{s.status}</Badge>
                  <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {isAdmin && employeeBreakdown && branchBreakdown && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
          <Card>
            <div className="border-b border-slate-100 dark:border-navy-800 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Shipments by Employee</h3>
            </div>
            <div className="p-5 space-y-4">
              {employeeBreakdown.map((emp) => (
                <div key={emp._id} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{emp.name}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{emp.count}</span>
                </div>
              ))}
              {employeeBreakdown.length === 0 && <p className="text-sm text-slate-500">No data available.</p>}
            </div>
          </Card>
          
          <Card>
            <div className="border-b border-slate-100 dark:border-navy-800 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Shipments by Branch</h3>
            </div>
            <div className="p-5 space-y-4">
              {branchBreakdown.map((branch) => (
                <div key={branch._id || 'HQ'} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{branch._id || 'Main Branch'}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{branch.count}</span>
                </div>
              ))}
              {branchBreakdown.length === 0 && <p className="text-sm text-slate-500">No data available.</p>}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
