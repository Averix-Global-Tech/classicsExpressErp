import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';
import { Button, Input, DataTable, Modal, StatCard, SearchBar } from '../../../components/ui';
import { useToast } from '../../../context/ToastContext';
import productivityService from '../../../services/productivity.service';
import shipmentService from '../../../services/shipmentService';

export default function EmailTab({ stats, onUpdate }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ 
    emailReferenceNumber: '', 
    partyName: '', 
    subject: '', 
    relatedAwbNumber: '', 
    remarks: '' 
  });
  
  const [isSearchingAwb, setIsSearchingAwb] = useState(false);
  const [awbError, setAwbError] = useState('');
  const [awbSuccess, setAwbSuccess] = useState(false);
  
  const toast = useToast();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productivityService.getMyEmailResolutions({ search });
      if (res.success) {
        setEntries(res.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [search, toast]);

  const handleSearchAwb = async () => {
    if (!formData.relatedAwbNumber) return;
    
    setIsSearchingAwb(true);
    setAwbError('');
    setAwbSuccess(false);
    
    try {
      const res = await shipmentService.getShipmentByAwb(formData.relatedAwbNumber.trim());
      if (res?.shipment) {
        // Find Party Name - typically the sender or receiver depending on business logic. 
        // For courier companies, we might default to Sender's name or a dedicated party field.
        // If there's a sender.name, we use that.
        const partyName = res.shipment.sender?.name || res.shipment.receiver?.name || '';
        
        setFormData(prev => ({ ...prev, partyName }));
        setAwbSuccess(true);
      }
    } catch (error) {
      setAwbError('No shipment found for this AWB Number.');
    } finally {
      setIsSearchingAwb(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await productivityService.createEmailResolution(formData);
      toast.success('Email entry added successfully');
      setIsModalOpen(false);
      setFormData({ emailReferenceNumber: '', partyName: '', subject: '', relatedAwbNumber: '', remarks: '' });
      setAwbError('');
      setAwbSuccess(false);
      loadEntries();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create email entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email entry?')) return;
    try {
      await productivityService.deleteEmailResolution(id);
      toast.success('Email entry deleted');
      loadEntries();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to delete email entry');
    }
  };

  const columns = [
    {
      header: 'Ref Number',
      key: 'emailReferenceNumber',
      render: (row) => <span className="font-medium text-slate-900 dark:text-white">{row.emailReferenceNumber}</span>
    },
    { header: 'Subject', key: 'subject' },
    { header: 'Party Name', key: 'partyName' },
    { header: 'Related AWB', key: 'relatedAwbNumber' },
    { 
      header: 'Date', 
      key: 'resolutionDate',
      render: (row) => new Date(row.resolutionDate).toLocaleDateString()
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
          <StatCard title="Today's Emails" value={stats.today} icon="Mail" trend={null} />
          <StatCard title="This Week" value={stats.week} icon="CalendarDays" trend={null} />
          <StatCard title="This Month" value={stats.month} icon="CalendarCheck" trend={null} />
          <StatCard title="Total Emails" value={stats.total} icon="Inbox" trend={null} />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-72">
          <SearchBar 
            placeholder="Search by Email Reference, AWB Number or Subject..." 
            value={search}
            onChange={setSearch}
            onSearch={loadEntries}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus size={16} className="mr-2" /> Add Email Entry
        </Button>
      </div>

      {/* Data Table */}
      <DataTable 
        columns={columns}
        data={entries}
        loading={loading}
        emptyTitle="No Email Entries Found"
        emptyMessage="You haven't added any email resolutions yet or none match your search."
      />

      {/* Add Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Email Resolution"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Related AWB Number"
                required
                value={formData.relatedAwbNumber}
                onChange={(e) => {
                  setFormData({ ...formData, relatedAwbNumber: e.target.value });
                  setAwbError('');
                  setAwbSuccess(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchAwb();
                  }
                }}
                placeholder="e.g. CEX-2507-000001"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleSearchAwb} 
              loading={isSearchingAwb}
              disabled={!formData.relatedAwbNumber}
              className="mb-[2px]"
            >
              <Search size={18} />
            </Button>
          </div>
          
          {awbError && (
            <div className="text-sm text-red-500 flex items-center gap-1 mt-1">
              <XCircle size={14} /> {awbError}
            </div>
          )}
          {awbSuccess && (
            <div className="text-sm text-green-500 flex items-center gap-1 mt-1">
              <CheckCircle size={14} /> Shipment found! Party name auto-filled.
            </div>
          )}

          <Input
            label="Party Name"
            required
            value={formData.partyName}
            onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
            placeholder="e.g. Acme Corp"
          />
          <Input
            label="Email Reference Number"
            required
            value={formData.emailReferenceNumber}
            onChange={(e) => setFormData({ ...formData, emailReferenceNumber: e.target.value })}
            placeholder="e.g. TKT-12345"
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="e.g. Missing Package"
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
