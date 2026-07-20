import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, UserX, Clock, AlertCircle, 
  CheckCircle, XCircle, Search, Calendar, ChevronRight
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import { useToast } from '../../context/ToastContext';
import { Button, Modal, Spinner, Badge } from '../../components/ui';

export default function AdminAttendanceDashboard() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);

  const [rejectModal, setRejectModal] = useState({ open: false, recordId: null, reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, pendRes] = await Promise.all([
        attendanceService.getAdminDashboard(),
        attendanceService.getPendingApprovals()
      ]);
      setStats(dashRes.stats);
      setPending(pendRes.records);
    } catch (err) {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id, isCheckIn) => {
    try {
      setSubmitting(true);
      if (isCheckIn) {
        await attendanceService.approveCheckIn(id);
      } else {
        await attendanceService.approveCheckOut(id);
      }
      toast.success('Attendance request approved successfully.');
      fetchData(); // Refresh list
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }
    
    try {
      setSubmitting(true);
      await attendanceService.rejectRequest(rejectModal.recordId, rejectModal.reason);
      toast.success('Attendance request rejected.');
      setRejectModal({ open: false, recordId: null, reason: '' });
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rejection failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !stats) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Verification</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Review and approve daily check-ins and check-outs across the organization.
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Present Today</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.present}</p>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Late Arrivals</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.late}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Absent</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.absent}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 p-6 shadow-sm flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Approvals</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Pending Approvals ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-navy-700 bg-slate-50 dark:bg-navy-900/50 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Pending Approval Requests ({pending.length})</h2>
        </div>
        
        {pending.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300">All caught up!</p>
            <p className="text-sm mt-1">There are no pending attendance requests.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-navy-700/50">
            {pending.map((record) => {
              const isCheckIn = record.approvalStatus === 'Pending Check-In';
              const timeString = isCheckIn 
                ? (record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A')
                : (record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A');
                
              return (
                <div key={record._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 hover:bg-slate-50 dark:bg-navy-900/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Avatar placeholder */}
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold">
                      {record.employee?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {record.employee?.name || 'Unknown Employee'} 
                        <span className="text-slate-400 text-xs font-normal ml-2">#{record.employee?.employeeId}</span>
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        {record.employee?.designation} &middot; {record.employee?.department}
                      </p>
                      
                      <div className="mt-2 flex items-center gap-2">
                        <Badge color={isCheckIn ? 'blue' : 'purple'}>
                          {isCheckIn ? 'Check In Request' : 'Check Out Request'}
                        </Badge>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          @ {timeString}
                        </span>
                        {!isCheckIn && record.checkIn && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 ml-2 border-l pl-2">
                            Started at: {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex items-center gap-2">
                    <Button 
                      variant="secondary" 
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200"
                      disabled={submitting}
                      onClick={() => setRejectModal({ open: true, recordId: record._id, reason: '' })}
                    >
                      Reject
                    </Button>
                    <Button 
                      disabled={submitting}
                      onClick={() => handleApprove(record._id, isCheckIn)}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => !submitting && setRejectModal({ open: false, recordId: null, reason: '' })}
        title="Reject Attendance Request"
        description="Please provide a reason for rejecting this request. This will be visible to the employee."
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModal({ open: false, recordId: null, reason: '' })} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={submitting}>
              Reject Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Rejection Reason *</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 dark:border-navy-600 p-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              rows="3"
              placeholder="e.g., Check-in time is incorrect, please resubmit."
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              autoFocus
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
