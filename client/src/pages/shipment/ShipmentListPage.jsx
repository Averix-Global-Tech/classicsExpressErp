import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus } from 'lucide-react';
import {
  Card, CardBody, DataTable, Badge, Button,
  FilterBar, SearchBar, Select, Pagination,
} from '../../components/ui';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Booked', label: 'Booked' },
  { value: 'Pickup Scheduled', label: 'Pickup Scheduled' },
  { value: 'Picked Up', label: 'Picked Up' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Out For Delivery', label: 'Out For Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Returned', label: 'Returned' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const columns = [
  { key: 'awbNumber', header: 'AWB Number' },
  { key: 'sender.name', header: 'Sender', render: (row) => row.sender?.name },
  { key: 'receiver.name', header: 'Receiver', render: (row) => row.receiver?.name },
  { key: 'destinationCountry', header: 'Destination' },
  { key: 'weight', header: 'Weight', align: 'right', render: (row) => `${row.package?.weight || 0} kg` },
  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  { key: 'createdAt', header: 'Date', render: (row) => new Date(row.createdAt).toLocaleDateString('en-IN') },
];

export default function ShipmentListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shipmentService.getAllShipments({ page, limit: 10, search, status });
      setData(res.items || []);
      setTotalPages(res.pagination?.pages || 1);
    } catch (error) {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    if (page !== 1) {
      setPage(1);
    } else {
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="text-brand-600" size={24} />
          <h1 className="text-2xl font-bold text-slate-800">All Shipments</h1>
        </div>
        <Button onClick={() => navigate('/shipment/new')}>
          <Plus size={16} /> New Shipment
        </Button>
      </div>

      <Card>
        <CardBody>
          <FilterBar onRefresh={loadData}>
            <SearchBar
              value={search}
              onChange={setSearch}
              onSearch={handleSearch}
              placeholder="Search AWB, sender, receiver..."
              className="w-full sm:w-72"
            />
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full sm:w-44"
            />
          </FilterBar>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <DataTable
            columns={columns}
            data={data}
            loading={loading}
            onRowClick={(row) => navigate(`/shipment/${row._id}`)}
            emptyTitle="No shipments found"
            emptyDescription="Try adjusting your search or filter criteria."
          />
          <div className="mt-4">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
