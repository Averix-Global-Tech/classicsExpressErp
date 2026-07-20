import { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Plus, Clock, CheckCircle, XCircle, Ban, Loader2 } from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useToast } from '../../context/ToastContext';
import { Button, Badge, Card, CardHeader, Spinner, EmptyState, Modal, Input, Select, Textarea } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const applySchema = yup.object().shape({
  leaveType: yup.string().required('Leave type is required'),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required'),
  halfDay: yup.boolean(),
  reason: yup.string().min(5, 'Reason must be at least 5 characters').max(500).required('Reason is required'),
});

const statusColors = {
  pending: 'amber',
  approved: 'green',
  rejected: 'red',
  cancelled: 'grey',
};

export default function MyLeavePage() {
  const toast = useToast();
  const [balance, setBalance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('');

  const currentYear = new Date().getFullYear();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(applySchema),
    defaultValues: { halfDay: false },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, leavesRes, typesRes] = await Promise.all([
        leaveService.getBalance(currentYear),
        leaveService.getMyLeaves(filter || undefined),
        leaveService.getLeaveTypes(true),
      ]);
      setBalance(balRes);
      setLeaves(leavesRes.items || []);
      setLeaveTypes(typesRes.items || []);
    } catch {
      toast.error('Failed to load leave data.');
    } finally {
      setLoading(false);
    }
  }, [filter, currentYear]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await leaveService.applyLeave(data);
      toast.success('Leave application submitted.');
      setShowApply(false);
      reset();
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to submit leave application.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this leave application?')) return;
    try {
      await leaveService.cancelApplication(id);
      toast.success('Leave application cancelled.');
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to cancel leave application.');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Leave</h1>
          <p className="mt-1 text-sm text-slate-500">View your leave balance and apply for leave.</p>
        </div>
        <Button onClick={() => setShowApply(true)}>
          <Plus size={16} className="mr-1.5" /> Apply Leave
        </Button>
      </div>

      {/* Balance Cards */}
      {balance && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {balance.items.map((b) => (
            <div key={b.leaveType._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600">{b.leaveType.name}</span>
                {b.leaveType.isPaid ? (
                  <span className="text-[10px] font-semibold uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Paid</span>
                ) : (
                  <span className="text-[10px] font-semibold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">Unpaid</span>
                )}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-brand-600">{b.balance}</p>
                  <p className="text-xs text-slate-400">Available</p>
                </div>
                <div className="text-right text-xs text-slate-500 space-y-0.5">
                  <div>Allocated: {b.allocated}</div>
                  <div>Used: {b.used}</div>
                  {b.carriedForward > 0 && <div>CF: {b.carriedForward}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Applications List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">My Applications</h2>
          <div className="flex gap-2">
            {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  filter === s ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        </div>

        {leaves.length === 0 ? (
          <EmptyState title="No leave applications" description="You haven't applied for any leave yet." />
        ) : (
          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div key={leave._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    leave.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                    leave.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    leave.status === 'cancelled' ? 'bg-slate-100 text-slate-500' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {leave.status === 'approved' ? <CheckCircle size={18} /> :
                     leave.status === 'rejected' ? <XCircle size={18} /> :
                     leave.status === 'cancelled' ? <Ban size={18} /> :
                     <Clock size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {leave.leaveType?.name || 'Leave'} {leave.halfDay && '(Half Day)'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(leave.startDate)} — {formatDate(leave.endDate)} · {leave.days} day(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge color={statusColors[leave.status]}>{leave.status}</Badge>
                  {['pending', 'approved'].includes(leave.status) && (
                    <Button variant="ghost" size="sm" onClick={() => handleCancel(leave._id)}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <Modal
        open={showApply}
        onClose={() => { setShowApply(false); reset(); }}
        title="Apply for Leave"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowApply(false); reset(); }} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={submitting}>Submit Application</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Select
            label="Leave Type"
            required
            placeholder="Select leave type"
            options={leaveTypes.map((t) => ({ value: t._id, label: t.name }))}
            error={errors.leaveType?.message}
            {...register('leaveType')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" required error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End Date" type="date" required error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600" {...register('halfDay')} />
            Half Day
          </label>
          <Textarea label="Reason" required rows={3} error={errors.reason?.message} {...register('reason')} />
        </form>
      </Modal>
    </div>
  );
}
