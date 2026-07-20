import { useState, useEffect } from 'react';
import { 
  Search, Filter, ChevronLeft, ChevronRight, 
  Edit2, FileSpreadsheet, Download
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Modal, Spinner, Select, Badge } from '../../components/ui';

export default function AdminAttendanceLog() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  
  // Data
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  });

  // Manual Update Modal
  const [manualModal, setManualModal] = useState({ open: false, record: null });
  const [manualForm, setManualForm] = useState({ status: '', checkIn: '', checkOut: '', remarks: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const res = await attendanceService.listAllAttendance({
        page,
        limit: pagination.limit,
        ...filters
      });
      setItems(res.items);
      setPagination(res.pagination);
    } catch (err) {
      toast.error('Failed to load attendance logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    fetchRecords(newPage);
  };

  const openManualModal = (record) => {
    setManualForm({
      status: record.status || '',
      checkIn: record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : '',
      checkOut: record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '',
      remarks: '',
    });
    setManualModal({ open: true, record });
  };

  const handleManualSubmit = async () => {
    if (!manualForm.remarks.trim()) {
      toast.error('Remarks are mandatory for manual updates.');
      return;
    }
    
    try {
      setSubmitting(true);
      await attendanceService.manualUpdate(manualModal.record._id, {
        ...manualForm,
        checkIn: manualForm.checkIn ? new Date(manualForm.checkIn).toISOString() : null,
        checkOut: manualForm.checkOut ? new Date(manualForm.checkOut).toISOString() : null,
      });
      toast.success('Attendance record updated.');
      setManualModal({ open: false, record: null });
      fetchRecords(pagination.page);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Log</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            View, filter, and manually correct organizational attendance history.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" className="gap-2">
            <FileSpreadsheet size={16} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Status</label>
          <Select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Present', label: 'Present' },
              { value: 'Absent', label: 'Absent' },
              { value: 'Half Day', label: 'Half Day' },
              { value: 'Leave', label: 'Leave' }
            ]}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Start Date</label>
          <input 
            type="date" 
            className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">End Date</label>
          <input 
            type="date" 
            className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
        <Button variant="secondary" onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}>
          Clear Filters
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-navy-900/50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-navy-700">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Check In</th>
                <th className="px-6 py-4">Check Out</th>
                <th className="px-6 py-4">Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-navy-700/50 bg-white dark:bg-navy-900">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <Spinner size={24} className="mx-auto mb-2" />
                    Loading attendance...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No attendance records found matching filters.
                  </td>
                </tr>
              ) : (
                items.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50 dark:bg-navy-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{record.employee?.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{record.employee?.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {(record.workingMinutes / 60).toFixed(1)}h
                      {record.overtimeMinutes > 0 && <span className="text-xs text-orange-600 ml-1">(+{ (record.overtimeMinutes / 60).toFixed(1) }h)</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge>
                        {record.status} {record.isLate && '(Late)'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        onClick={() => openManualModal(record)}
                        className="text-orange-600 hover:text-orange-800 inline-flex items-center gap-1 text-xs font-medium bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && items.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 px-6 py-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
              <span className="font-medium text-slate-900 dark:text-white">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-medium text-slate-900 dark:text-white">{pagination.total}</span> records
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="secondary"
                disabled={pagination.page === pagination.pages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Update Modal */}
      <Modal
        open={manualModal.open}
        onClose={() => !submitting && setManualModal({ open: false, record: null })}
        title="Manual Attendance Correction"
        description={`Editing record for ${manualModal.record?.employee?.name} on ${manualModal.record ? new Date(manualModal.record.date).toLocaleDateString() : ''}.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setManualModal({ open: false, record: null })} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleManualSubmit} loading={submitting}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
            <Select
              value={manualForm.status}
              onChange={(e) => setManualForm(prev => ({ ...prev, status: e.target.value }))}
              options={[
                { value: 'Present', label: 'Present' },
                { value: 'Absent', label: 'Absent' },
                { value: 'Half Day', label: 'Half Day' },
                { value: 'Leave', label: 'Leave' },
                { value: 'Holiday', label: 'Holiday' },
                { value: 'Weekend', label: 'Weekend' }
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Check In Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={manualForm.checkIn}
                onChange={(e) => setManualForm(prev => ({ ...prev, checkIn: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Check Out Time</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                value={manualForm.checkOut}
                onChange={(e) => setManualForm(prev => ({ ...prev, checkOut: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Remarks (Mandatory) *</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows="2"
              placeholder="Reason for manual update (e.g. Employee forgot to punch out)"
              value={manualForm.remarks}
              onChange={(e) => setManualForm(prev => ({ ...prev, remarks: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
