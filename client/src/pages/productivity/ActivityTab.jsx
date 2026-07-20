import { useState } from 'react';
import { Package, Mail, User, Settings, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody, Badge, Pagination } from '../../components/ui';

const MOCK_ACTIVITY = [
  { _id: '1', action: 'Shipment Created', module: 'Shipments', user: 'Rajesh Kumar', time: '2026-07-18T10:30:00Z', icon: Package, details: 'AWB CE001234567 — Delhi to Mumbai' },
  { _id: '2', action: 'Email Sent', module: 'Communications', user: 'System', time: '2026-07-18T10:35:00Z', icon: Mail, details: 'Dispatch notification to rajesh@example.com' },
  { _id: '3', action: 'Status Updated', module: 'Shipments', user: 'Priya Patel', time: '2026-07-18T09:20:00Z', icon: Package, details: 'AWB CE001234568 marked as Delivered' },
  { _id: '4', action: 'User Login', module: 'Auth', user: 'System Admin', time: '2026-07-18T08:00:00Z', icon: User, details: 'Login from 192.168.1.100' },
  { _id: '5', action: 'Settings Changed', module: 'Settings', user: 'System Admin', time: '2026-07-17T17:30:00Z', icon: Settings, details: 'SMTP configuration updated' },
  { _id: '6', action: 'Alert Triggered', module: 'Monitoring', user: 'System', time: '2026-07-17T16:00:00Z', icon: AlertTriangle, details: 'Delayed shipment CE001234569 — 48h overdue' },
  { _id: '7', action: 'Shipment Created', module: 'Shipments', user: 'Anita Desai', time: '2026-07-17T14:30:00Z', icon: Package, details: 'AWB CE001234570 — Pune to Kolkata' },
  { _id: '8', action: 'Email Failed', module: 'Communications', user: 'System', time: '2026-07-17T18:00:00Z', icon: Mail, details: 'Weekly report delivery failed — SMTP timeout' },
  { _id: '9', action: 'Status Updated', module: 'Shipments', user: 'Sunita Reddy', time: '2026-07-17T14:00:00Z', icon: Package, details: 'AWB CE001234571 marked as Delivered' },
  { _id: '10', action: 'User Created', module: 'Admin', user: 'System Admin', time: '2026-07-17T10:00:00Z', icon: User, details: 'New agent account: Mohammed Ali' },
];

const MODULE_COLORS = {
  Shipments: 'blue',
  Communications: 'green',
  Auth: 'purple',
  Settings: 'grey',
  Monitoring: 'amber',
  Admin: 'purple',
};

export default function ActivityTab() {
  const [page, setPage] = useState(1);
  const perPage = 8;
  const totalPages = Math.ceil(MOCK_ACTIVITY.length / perPage);
  const paginated = MOCK_ACTIVITY.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="Activity Log" subtitle="Recent system activity across all modules" />
        <CardBody>
          <div className="space-y-1">
            {paginated.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item._id}
                  className="flex items-start gap-3 rounded-lg px-3 py-3 transition hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{item.action}</p>
                      <Badge color={MODULE_COLORS[item.module] || 'grey'}>{item.module}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{item.details}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.user} · {new Date(item.time).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
