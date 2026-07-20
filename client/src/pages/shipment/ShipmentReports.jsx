import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { Spinner, Card, CardHeader, EmptyState } from '../../components/ui';

export default function ShipmentReports() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    shipmentService
      .getReports()
      .then(setData)
      .catch(() => toast.error('Failed to load shipment reports'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  if (!data) return null;

  const { branchWise, countryWise, dailyLast14, pendingShipments, returnedShipments } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Shipment Reports</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Operational and performance analytics across branches and destinations.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Shipments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{pendingShipments}</p>
        </Card>
        <Card>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Returned Shipments</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{returnedShipments}</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Daily Shipment Volume" subtitle="Last 14 days — booked vs. delivered" />
        {dailyLast14.length === 0 ? (
          <EmptyState title="No data yet" description="Booking activity will appear here." />
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyLast14.map((d) => ({ date: d._id, Booked: d.booked, Delivered: d.delivered }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="Booked" stroke="#2563eb" fill="#2563eb" fillOpacity={0.15} />
                <Area type="monotone" dataKey="Delivered" stroke="#059669" fill="#059669" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6"><h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Branch-wise Report</h3></div>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-navy-700/50">
            {branchWise.length === 0 ? (
              <EmptyState title="No branch data" />
            ) : (
              branchWise.map((b) => (
                <div key={b._id || 'unassigned'} className="flex items-center justify-between px-5 py-3 sm:px-6 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{b._id || 'Unassigned'}</span>
                  <span className="text-slate-500 dark:text-slate-400">{b.delivered} delivered / {b.count} total</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 pt-5 sm:px-6 sm:pt-6"><h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Country-wise Report</h3></div>
          <div className="mt-3 divide-y divide-slate-100 dark:divide-navy-700/50">
            {countryWise.length === 0 ? (
              <EmptyState title="No destination data" />
            ) : (
              countryWise.map((c) => (
                <div key={c._id} className="flex items-center justify-between px-5 py-3 sm:px-6 text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{c._id}</span>
                  <span className="text-slate-500 dark:text-slate-400">{c.delivered} delivered / {c.count} total</span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
