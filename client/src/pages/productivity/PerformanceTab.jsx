import { Card, CardHeader, CardBody, StatCard } from '../../components/ui';
import { TrendingUp, Clock, CheckCircle, Truck } from 'lucide-react';

const METRICS = [
  { label: 'Avg. Delivery Time', value: '2.3 days', change: -8, period: 'vs last week' },
  { label: 'On-Time Delivery', value: '94.2%', change: 2.1, period: 'vs last month' },
  { label: 'Bookings/Day', value: '47', change: 12, period: 'vs yesterday' },
  { label: 'Return Rate', value: '2.1%', change: -0.5, period: 'vs last month' },
];

const BRANCH_PERFORMANCE = [
  { branch: 'Delhi Hub', bookings: 142, delivered: 128, pending: 14, rate: '90.1%' },
  { branch: 'Mumbai Hub', bookings: 118, delivered: 110, pending: 8, rate: '93.2%' },
  { branch: 'Bangalore Hub', bookings: 96, delivered: 89, pending: 7, rate: '92.7%' },
  { branch: 'Chennai Hub', bookings: 84, delivered: 78, pending: 6, rate: '92.9%' },
  { branch: 'Kolkata Hub', bookings: 67, delivered: 61, pending: 6, rate: '91.0%' },
];

export default function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((m, i) => (
          <StatCard
            key={m.label}
            title={m.label}
            value={m.value}
            icon={[TrendingUp, Clock, CheckCircle, Truck][i]}
            accent={['green', 'blue', 'amber', 'red'][i]}
            trend={m.change}
            hint={m.period}
            index={i}
          />
        ))}
      </div>

      <Card>
        <CardHeader title="Branch Performance" subtitle="This week's metrics by branch" />
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-left">
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500">Branch</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 text-right">Bookings</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 text-right">Delivered</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 text-right">Pending</th>
                  <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-500 text-right">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {BRANCH_PERFORMANCE.map((row) => (
                  <tr key={row.branch} className="border-b border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.branch}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.bookings}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.delivered}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{row.pending}</td>
                    <td className="px-4 py-3 text-right text-slate-700 font-medium">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
