import { useState, useMemo } from 'react';
import { Send } from 'lucide-react';
import { Card, CardHeader, CardBody, DataTable, Badge, FilterBar, SearchBar, Select, Pagination, Button, Modal, Input, Textarea } from '../../components/ui';

const MOCK_EMAILS = [
  { _id: '1', to: 'rajesh@example.com', subject: 'Shipment CE001234567 Dispatched', type: 'Dispatch', status: 'Sent', sentAt: '2026-07-18T10:35:00Z' },
  { _id: '2', to: 'amit@example.com', subject: 'Delivery Scheduled for Tomorrow', type: 'Delivery', status: 'Sent', sentAt: '2026-07-18T10:36:00Z' },
  { _id: '3', to: 'priya@example.com', subject: 'Shipment CE001234568 Delivered', type: 'Delivery', status: 'Sent', sentAt: '2026-07-18T09:20:00Z' },
  { _id: '4', to: 'anita@example.com', subject: 'Action Required: Pickup Pending', type: 'Alert', status: 'Pending', sentAt: null },
  { _id: '5', to: 'support@classicexpress.com', subject: 'Weekly Performance Report', type: 'Report', status: 'Failed', sentAt: '2026-07-17T18:00:00Z' },
  { _id: '6', to: 'deepak@example.com', subject: 'Shipment Delay Notification', type: 'Alert', status: 'Sent', sentAt: '2026-07-17T15:10:00Z' },
];

const columns = [
  { key: 'to', header: 'Recipient', sortable: true },
  { key: 'subject', header: 'Subject' },
  { key: 'type', header: 'Type', render: (row) => <Badge>{row.type}</Badge> },
  { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
  { key: 'sentAt', header: 'Sent At', sortable: true, render: (row) => row.sentAt ? new Date(row.sentAt).toLocaleString('en-IN') : '—' },
];

export default function EmailTab() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [sortKey, setSortKey] = useState('sentAt');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...MOCK_EMAILS];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) => r.to.toLowerCase().includes(s) || r.subject.toLowerCase().includes(s)
      );
    }
    if (type) result = result.filter((r) => r.type === type);
    result.sort((a, b) => {
      const cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, type, sortKey, sortDir]);

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
              placeholder="Search recipient or subject..."
              className="w-full sm:w-72"
            />
            <Select
              options={[
                { value: '', label: 'All Types' },
                { value: 'Dispatch', label: 'Dispatch' },
                { value: 'Delivery', label: 'Delivery' },
                { value: 'Alert', label: 'Alert' },
                { value: 'Report', label: 'Report' },
              ]}
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="w-full sm:w-40"
            />
            <Button onClick={() => setComposeOpen(true)}>
              <Send size={15} /> Compose
            </Button>
          </FilterBar>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Email Communications" subtitle={`${filtered.length} emails`} />
        <CardBody>
          <DataTable
            columns={columns}
            data={paginated}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
            emptyTitle="No emails found"
          />
          <div className="mt-4">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        </CardBody>
      </Card>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="Compose Email"
        description="Send an email notification"
        footer={
          <>
            <Button variant="secondary" onClick={() => setComposeOpen(false)}>Cancel</Button>
            <Button onClick={() => setComposeOpen(false)}><Send size={15} /> Send</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="To" placeholder="recipient@example.com" />
          <Input label="Subject" placeholder="Email subject" />
          <Textarea label="Body" rows={5} placeholder="Write your message..." />
        </div>
      </Modal>
    </div>
  );
}
