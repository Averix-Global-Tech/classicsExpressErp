import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import shipmentService from '../../services/shipmentService';
import { useToast } from '../../context/ToastContext';
import { DataTable, SearchBar, Select, Pagination, Badge } from '../../components/ui';

const STATUS_OPTIONS = [
  'Booked', 'Pickup Scheduled', 'Picked Up', 'At Origin Hub', 'Export Customs',
  'In Transit', 'Arrived Destination Country', 'Import Customs', 'Out For Delivery',
  'Delivered', 'Returned', 'Cancelled', 'Lost',
];

export default function ShipmentList() {
  const navigate = useNavigate();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [country, setCountry] = useState('');

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (search) params.search = search;
      if (status) params.status = status;
      if (country) params.destinationCountry = country;
      const res = await shipmentService.getAllShipments(params);
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message || 'Failed to load shipments');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, country]);

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const columns = [
    { key: 'awbNumber', header: 'AWB Number', render: (r) => <span className="font-medium text-orange-700">{r.awbNumber}</span> },
    { key: 'sender', header: 'Sender', render: (r) => r.sender?.name },
    { key: 'receiver', header: 'Receiver', render: (r) => r.receiver?.name },
    { key: 'destinationCountry', header: 'Destination' },
    { key: 'serviceType', header: 'Service' },
    { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
    { key: 'createdAt', header: 'Booked On', render: (r) => new Date(r.createdAt).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">All Shipments</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search and track every booked shipment.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[240px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Search</label>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="AWB, sender, receiver or mobile number"
          />
        </div>
        <div className="min-w-[180px]">
          <Select
            label="Status"
            placeholder="All Statuses"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        </div>
        <div className="min-w-[180px]">
          <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Destination Country</label>
          <input
            className="input-base"
            placeholder="e.g. UAE"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={items}
          loading={loading}
          emptyTitle="No shipments found"
          emptyDescription="Try adjusting your filters, or book a new shipment."
          onRowClick={(row) => navigate(`/shipment/${row._id}`)}
        />
        {!loading && items.length > 0 && (
          <div className="border-t border-slate-200 dark:border-navy-700 px-6 py-4">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchData} />
          </div>
        )}
      </div>
    </div>
  );
}
