import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Clock, CheckCircle, XCircle, Ban, ChevronLeft, ChevronRight,
  BarChart3, Users, FileText, Plus,
} from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useToast } from '../../context/ToastContext';
import {
  Button, Badge, Card, CardHeader, Spinner, EmptyState, Pagination, Select, Modal,
  Input, Textarea, StatCard,
} from '../../components/ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const reviewSchema = yup.object().shape({
  reviewComment: yup.string().max(500),
});

const statusColors = { pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'grey' };

export default function AdminLeaveDashboard() {
  const toast = useToast();
  const [applications, setApplications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarItems, setCalendarItems] = useState([]);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [reviewing, setReviewing] = useState(false);
  const [reports, setReports] = useState(null);

  const { register, handleSubmit, reset } = useForm({ resolver: yupResolver(reviewSchema) });

  const fetchApplications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await leaveService.getAllApplications({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setApplications(res.items || []);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchCalendar = useCallback(async () => {
    try {
      const from = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).toISOString();
      const to = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).toISOString();
      const res = await leaveService.getCalendar(from, to);
      setCalendarItems(res.items || []);
    } catch {
      /* silent */
    }
  }, [calendarDate]);

  const fetchReports = useCallback(async () => {
    try {
      const res = await leaveService.getReports();
      setReports(res);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useEffect(() => { fetchCalendar(); }, [fetchCalendar]);
  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleReview = async (data) => {
    setReviewing(true);
    try {
      await leaveService.reviewApplication(reviewModal._id, reviewAction, data.reviewComment || '');
      toast.success(`Leave application ${reviewAction}d.`);
      setReviewModal(null);
      reset();
      fetchApplications(pagination.page);
      fetchCalendar();
    } catch (err) {
      toast.error(err?.message || 'Failed to review application.');
    } finally {
      setReviewing(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();

  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const approvedCount = calendarItems.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Management</h1>
          <p className="mt-1 text-sm text-slate-500">Review applications, manage leave types, and track team availability.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pending Reviews" value={pagination.total || 0} icon={Clock} accent="amber" />
        <StatCard title="Approved This Month" value={approvedCount} icon={CheckCircle} accent="green" />
        <StatCard title="Rejected" value={reports?.byStatus?.find((s) => s._id === 'rejected')?.count || 0} icon={XCircle} accent="red" />
        <StatCard title="Total Applications" value={reports?.byStatus?.reduce((a, b) => a + b.count, 0) || 0} icon={FileText} accent="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pending Applications */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-800">Applications</h2>
            <div className="flex gap-2">
              {['pending', 'approved', 'rejected', 'cancelled', ''].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : applications.length === 0 ? (
            <EmptyState title="No applications" description="No leave applications match the current filter." />
          ) : (
            <div className="divide-y divide-slate-100">
              {applications.map((app) => (
                <div key={app._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-sm font-bold">
                      {(app.user?.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{app.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">
                        {app.leaveType?.name} · {formatDate(app.startDate)} — {formatDate(app.endDate)} · {app.days} day(s)
                      </p>
                      {app.reason && <p className="text-xs text-slate-400 mt-0.5 max-w-md truncate">{app.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={statusColors[app.status]}>{app.status}</Badge>
                    {app.status === 'pending' && (
                      <Button size="sm" onClick={() => { setReviewModal(app); setReviewAction('approve'); }}>
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {pagination.pages > 1 && (
            <div className="border-t border-slate-100 px-6 py-3">
              <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchApplications} />
            </div>
          )}
        </div>

        {/* Calendar Sidebar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-medium text-slate-400 uppercase">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
              const leavesOnDay = calendarItems.filter((item) => {
                const start = new Date(item.startDate);
                const end = new Date(item.endDate);
                return date >= start && date <= end;
              });
              return (
                <div
                  key={day}
                  className={`relative flex flex-col items-center justify-center rounded-lg h-9 text-xs ${
                    leavesOnDay.length > 0 ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-600'
                  }`}
                  title={leavesOnDay.map((l) => `${l.user?.name} (${l.leaveType?.name})`).join(', ')}
                >
                  {day}
                  {leavesOnDay.length > 0 && (
                    <div className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brand-500" />
                  )}
                </div>
              );
            })}
          </div>

          {calendarItems.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-slate-500 uppercase">On Leave</p>
              {calendarItems.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center gap-2 text-xs">
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="text-slate-700 truncate">{item.user?.name}</span>
                  <span className="text-slate-400">({item.leaveType?.code})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        open={!!reviewModal}
        onClose={() => { setReviewModal(null); reset(); }}
        title={`${reviewAction === 'approve' ? 'Approve' : 'Reject'} Leave Application`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewModal(null)} disabled={reviewing}>Cancel</Button>
            {reviewAction === 'approve' && (
              <Button variant="secondary" onClick={() => setReviewAction('reject')} disabled={reviewing}>Reject</Button>
            )}
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              onClick={handleSubmit(handleReview)}
              loading={reviewing}
            >
              {reviewAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        {reviewModal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-2">
              <div><span className="text-slate-500">Employee:</span> <span className="font-medium text-slate-800">{reviewModal.user?.name}</span></div>
              <div><span className="text-slate-500">Type:</span> <span className="font-medium text-slate-800">{reviewModal.leaveType?.name}</span></div>
              <div><span className="text-slate-500">Dates:</span> <span className="font-medium text-slate-800">{formatDate(reviewModal.startDate)} — {formatDate(reviewModal.endDate)}</span></div>
              <div><span className="text-slate-500">Days:</span> <span className="font-medium text-slate-800">{reviewModal.days}</span></div>
              <div><span className="text-slate-500">Reason:</span> <span className="text-slate-800">{reviewModal.reason}</span></div>
            </div>
            <Textarea label="Comment (optional)" rows={2} {...register('reviewComment')} />
          </div>
        )}
      </Modal>
    </div>
  );
}
