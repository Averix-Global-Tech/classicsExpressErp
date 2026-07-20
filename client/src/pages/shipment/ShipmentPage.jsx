import { useNavigate } from 'react-router-dom';
import { Package, Truck, Clock } from 'lucide-react';
import { Card, CardHeader, CardBody, StatCard, DataTable, Badge, Button } from '../../components/ui';

const MOCK_STATS = {
  total: 1284,
  inTransit: 342,
  delivered: 891,
  pending: 51,
};

const MOCK_RECENT = [
  { _id: '1', awbNumber: 'CE001234567', sender: 'Rajesh Kumar', receiver: 'Amit Sharma', destination: 'Mumbai', status: 'In Transit', origin: 'Delhi', createdAt: '2026-07-18T10:30:00Z' },
  { _id: '2', awbNumber: 'CE001234568', sender: 'Priya Patel', receiver: 'Sanjay Mehta', destination: 'Bangalore', status: 'Delivered', origin: 'Chennai', createdAt: '2026-07-18T09:15:00Z' },
  { _id: '3', awbNumber: 'CE001234569', sender: 'Anita Desai', receiver: 'Vikram Singh', destination: 'Kolkata', status: 'Pending', origin: 'Pune', createdAt: '2026-07-18T08:45:00Z' },
  { _id: '4', awbNumber: 'CE001234570', sender: 'Mohammed Ali', receiver: 'Deepa Nair', destination: 'Hyderabad', status: 'In Transit', origin: 'Mumbai', createdAt: '2026-07-17T16:20:00Z' },
  { _id: '5', awbNumber: 'CE001234571', sender: 'Sunita Reddy', receiver: 'Arjun Rao', destination: 'Delhi', status: 'Delivered', origin: 'Bangalore', createdAt: '2026-07-17T14:00:00Z' },
];

const columns = [
  { key: 'awbNumber', header: 'AWB Number', sortable: true },
  { key: 'sender', header: 'Sender', sortable: true },
  { key: 'receiver', header: 'Receiver' },
  { key: 'destination', header: 'Destination', sortable: true },
  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  { key: 'createdAt', header: 'Created', render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN') },
];

export default function ShipmentPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="text-brand-600" size={24} />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Shipments</h1>
            <p className="text-sm text-slate-500">Overview of all shipments</p>
          </div>
        </div>
        <Button onClick={() => navigate('/shipments/new')}>
          <Package size={16} /> New Shipment
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Shipments" value={MOCK_STATS.total} icon={Package} accent="blue" />
        <StatCard title="In Transit" value={MOCK_STATS.inTransit} icon={Truck} accent="amber" />
        <StatCard title="Delivered" value={MOCK_STATS.delivered} icon={Package} accent="green" />
        <StatCard title="Pending Pickup" value={MOCK_STATS.pending} icon={Clock} accent="red" />
      </div>

      <Card>
        <CardHeader
          title="Recent Shipments"
          subtitle="Latest shipments across all branches"
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate('/shipments/list')}>
              View All
            </Button>
          }
        />
        <CardBody>
          <DataTable
            columns={columns}
            data={MOCK_RECENT}
            rowKey="_id"
            onRowClick={(row) => navigate(`/shipments/${row._id}`)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
