import { useState, useMemo } from 'react';
import { Users } from 'lucide-react';
import {
  Card, CardHeader, CardBody, DataTable, Badge, Button,
  FilterBar, SearchBar, Select, Pagination, Modal, Input,
} from '../../components/ui';
import { ROLE_LABELS } from '../../utils/constants';

const MOCK_TEAM = [
  { _id: '1', name: 'System Administrator', email: 'admin@classicexpress.com', role: 'system_admin', isActive: true, lastLoginAt: '2026-07-18T08:00:00Z' },
  { _id: '2', name: 'Rajesh Kumar', email: 'rajesh@classicexpress.com', role: 'admin', isActive: true, lastLoginAt: '2026-07-18T10:30:00Z' },
  { _id: '3', name: 'Priya Patel', email: 'priya@classicexpress.com', role: 'admin', isActive: true, lastLoginAt: '2026-07-17T09:15:00Z' },
  { _id: '4', name: 'Anita Desai', email: 'anita@classicexpress.com', role: 'admin', isActive: false, lastLoginAt: '2026-07-10T14:00:00Z' },
  { _id: '5', name: 'Mohammed Ali', email: 'mohammed@classicexpress.com', role: 'admin', isActive: true, lastLoginAt: '2026-07-16T16:20:00Z' },
];

export default function TeamTab() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const perPage = 10;

  const filtered = useMemo(() => {
    let result = [...MOCK_TEAM];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (r) => r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s)
      );
    }
    if (roleFilter) result = result.filter((r) => r.role === roleFilter);
    result.sort((a, b) => {
      const cmp = String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [search, roleFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const columns = [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role', render: (row) => <Badge>{ROLE_LABELS[row.role] || row.role}</Badge> },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge color={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      sortable: true,
      render: (row) => row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleDateString('en-IN') : '—',
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardBody>
          <FilterBar onRefresh={() => {}}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or email..."
              className="w-full sm:w-72"
            />
            <Select
              options={[
                { value: '', label: 'All Roles' },
                { value: 'system_admin', label: 'System Admin' },
                { value: 'admin', label: 'Admin' },
              ]}
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-40"
            />
            <Button onClick={() => setAddOpen(true)}>
              <Users size={15} /> Add Member
            </Button>
          </FilterBar>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Team Members" subtitle={`${filtered.length} members`} />
        <CardBody>
          <DataTable
            columns={columns}
            data={paginated}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key, dir) => { setSortKey(key); setSortDir(dir); }}
            emptyTitle="No team members found"
          />
          <div className="mt-4">
            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        </CardBody>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Team Member"
        description="Invite a new team member to the system"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddOpen(false)}>Send Invite</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Enter full name" />
          <Input label="Email" type="email" placeholder="member@example.com" />
          <Select
            label="Role"
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'system_admin', label: 'System Admin' },
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}
