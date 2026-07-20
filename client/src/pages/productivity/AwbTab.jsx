import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardBody, DataTable, Badge, FilterBar, SearchBar, Select, Pagination } from '../../components/ui';

const MOCK_AWB = [
  { _id: '1', awbNumber: 'CE001234567', shipment: 'Delhi → Mumbai', status: 'In Transit', agent: 'Rajesh K.', bookedAt: '2026-07-18T10:30:00Z', pieces: 1, weight: '2.5 kg' },
  { _id: '2', awbNumber: 'CE001234568', shipment: 'Chennai → Bangalore', status: 'Delivered', agent: 'Priya P.', bookedAt: '2026-07-18T09:15:00Z', pieces: 2, weight: '1.2 kg' },
  { _id: '3', awbNumber: 'CE001234569', shipment: 'Pune → Kolkata', status: 'Pending', agent: 'Anita D.', bookedAt: '2026-07-18T08:45:00Z', pieces: 1, weight: '5.0 kg' },
  { _id: '4', awbNumber: 'CE001234570', shipment: 'Mumbai → Hyderabad', status: 'In Transit', agent: 'Mohammed A.', bookedAt: '2026-07-17T16:20:00Z', pieces: 3, weight: '0.8 kg' },
  { _id: '5', awbNumber: 'CE001234571', shipment: 'Bangalore → Delhi', status: 'Delivered', agent: 'Sunita R.', bookedAt: '2026-07-17T14:00:00Z', pieces: 1, weight: '3.1 kg' },
  { _id: '6', awbNumber: 'CE001234572', shipment: 'Jaipur → Lucknow', status: 'Returned', agent: 'Kavita J.', bookedAt: '2026-07-17T11:30:00Z', pieces: 1, weight: '1.8 kg' },
];

const columns = [
  { key: 'awbNumber', header: 'AWB Number', sortable: true },
  { key: 'shipment', header: 'Route' },
  { key: 'agent', header: 'Booked By', sortable: true },
  { key: 'pieces', header: 'Pieces', align: 'center' },
  { key: 'weight', header: 'Weight', align: 'right' },
  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  { key: 'bookedAt', header: 'Booked', sortable: true, render: (row) => new Date(row.bookedAt).toLocaleDateString('en-IN') },
];

export default function AwbTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortKey, setSortKey] = useState('bookedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...MOCK_AWB];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) => r.awbNumber.toLowerCase().includes(s) || r.agent.toLowerCase().includes(s)
      );
    }
    if (status) result = result.filter((r) => r.status === status);
    result.sort((a, b) => {
      const cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, status, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <FilterBar onRefresh={() => {}}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search AWB number or agent..."
              className="w-full sm:w-72"
            />
            <Select
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'In Transit', label: 'In Transit' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Returned', label: 'Returned' },
              ]}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full sm:w-44"
            />
          </FilterBar>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="AWB Records" subtitle={`${filtered.length} total records`} />
        <CardBody>
          <DataTable
            columns={columns}
            data={paginated}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
            onRowClick={(row) => navigate(`/shipments/${row._id}`)}
            emptyTitle="No AWB records found"
          />
          <div className="mt-4">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
