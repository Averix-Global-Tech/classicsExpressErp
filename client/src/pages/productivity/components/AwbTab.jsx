import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Trash2, Edit } from 'lucide-react';
import { Button, Input, DataTable, Modal, StatCard, SearchBar } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import productivityService from '../../../services/productivity.service';

export default function AwbTab({ stats, onUpdate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ awbNumber: '', partyName: '', destinationCountry: '', remarks: '' });
  
  const toast = useToast();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productivityService.getMyAwbEntries({ search });
      if (res.success) {
        setEntries(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await productivityService.createAwbEntry(formData);
      toast.success('AWB entry added successfully');
      setIsModalOpen(false);
      setFormData({ awbNumber: '', partyName: '', destinationCountry: '', remarks: '' });
      loadEntries();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create AWB entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this AWB entry?')) return;
    try {
      await productivityService.deleteAwbEntry(id);
      toast.success('AWB entry deleted');
      loadEntries();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to delete AWB entry');
    }
  };

  const columns = [
    {
      header: 'AWB Number',
      key: 'awbNumber',
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.awbNumber}</span>
    },
    { header: 'Party Name', key: 'partyName' },
    { header: 'Destination', key: 'destinationCountry' },
    { 
      header: 'Date', 
      key: 'processingDate',
      render: (row) => new Date(row.processingDate).toLocaleDateString()
    },
    { header: 'Remarks', key: 'remarks' },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row._id)}>
            <Trash2 size={16} className="text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard title="Today's AWBs" value={stats.today} icon="Barcode" trend={null} />
          <StatCard title="This Week" value={stats.week} icon="CalendarDays" trend={null} />
          <StatCard title="This Month" value={stats.month} icon="CalendarCheck" trend={null} />
          <StatCard title="Total AWBs" value={stats.total} icon="Briefcase" trend={null} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <SearchBar 
            placeholder="Search AWB or Party..." 
            value={search}
            onChange={setSearch}
            onSearch={loadEntries}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Add AWB Entry
        </Button>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns}
        data={entries}
        loading={loading}
        emptyTitle="No AWB Entries Found"
        emptyMessage="You haven't added any AWB entries yet or none match your search."
      />

      {/* Add Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New AWB Entry"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="AWB Number"
            required
            value={formData.awbNumber}
            onChange={(e) => setFormData({ ...formData, awbNumber: e.target.value })}
            placeholder="Enter AWB Number"
          />
          <Input
            label="Party Name"
            value={formData.partyName}
            onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Destination Country"
            value={formData.destinationCountry}
            onChange={(e) => setFormData({ ...formData, destinationCountry: e.target.value })}
            placeholder="e.g. UAE"
          />
          <Input
            label="Remarks"
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            placeholder="Optional remarks"
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Add Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
