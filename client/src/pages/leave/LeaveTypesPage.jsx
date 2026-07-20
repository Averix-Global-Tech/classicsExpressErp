import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import leaveService from '../../services/leaveService';
import { useToast } from '../../context/ToastContext';
import { Button, Card, CardHeader, Spinner, EmptyState, Modal, Input, DataTable } from '../../components/ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const typeSchema = yup.object().shape({
  name: yup.string().min(2, 'Name must be 2-100 characters').max(100).required('Name is required'),
  code: yup.string().min(2, 'Code must be 2-10 characters').max(10).required('Code is required'),
  description: yup.string().max(500),
  defaultDaysPerYear: yup.number().min(0, 'Cannot be negative').max(365).required('Days per year is required'),
  isPaid: yup.boolean(),
});

export default function LeaveTypesPage() {
  const toast = useToast();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(typeSchema),
    defaultValues: { isPaid: true, defaultDaysPerYear: 12 },
  });

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await leaveService.getLeaveTypes();
      setTypes(res.items || []);
    } catch {
      toast.error('Failed to load leave types.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTypes(); }, [fetchTypes]);

  const openCreate = () => {
    setEditingType(null);
    reset({ name: '', code: '', description: '', defaultDaysPerYear: 12, isPaid: true });
    setShowModal(true);
  };

  const openEdit = (type) => {
    setEditingType(type);
    reset({
      name: type.name,
      code: type.code,
      description: type.description || '',
      defaultDaysPerYear: type.defaultDaysPerYear,
      isPaid: type.isPaid,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingType) {
        await leaveService.updateLeaveType(editingType._id, data);
        toast.success('Leave type updated.');
      } else {
        await leaveService.createLeaveType(data);
        toast.success('Leave type created.');
      }
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      toast.error(err?.message || 'Failed to save leave type.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`Deactivate "${type.name}"? Existing applications using this type will remain valid.`)) return;
    try {
      await leaveService.deleteLeaveType(type._id);
      toast.success('Leave type deactivated.');
      fetchTypes();
    } catch (err) {
      toast.error(err?.message || 'Failed to deactivate leave type.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => <span className="font-medium text-slate-800">{r.name}</span>,
    },
    {
      key: 'code',
      header: 'Code',
      render: (r) => <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{r.code}</span>,
    },
    { key: 'defaultDaysPerYear', header: 'Days/Year' },
    {
      key: 'isPaid',
      header: 'Type',
      render: (r) => r.isPaid ? (
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Paid</span>
      ) : (
        <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">Unpaid</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => r.isActive ? (
        <span className="text-xs font-medium text-emerald-700">Active</span>
      ) : (
        <span className="text-xs font-medium text-slate-400">Inactive</span>
      ),
    },
    {
      key: '_id',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(r); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors">
            <Edit2 size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leave Types</h1>
          <p className="mt-1 text-sm text-slate-500">Configure the leave categories available to employees.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} className="mr-1.5" /> Add Leave Type
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <DataTable columns={columns} data={types} loading={loading} emptyTitle="No leave types" emptyDescription="Create your first leave type to get started." />
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingType ? 'Edit Leave Type' : 'Create Leave Type'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)} loading={submitting}>{editingType ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Name" required placeholder="e.g. Casual Leave" error={errors.name?.message} {...register('name')} />
          <Input label="Code" required placeholder="e.g. CL" error={errors.code?.message} {...register('code')} />
          <Input label="Description" placeholder="Optional description" {...register('description')} />
          <Input label="Default Days Per Year" type="number" required error={errors.defaultDaysPerYear?.message} {...register('defaultDaysPerYear', { valueAsNumber: true })} />
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="rounded border-slate-300 text-brand-600" {...register('isPaid')} />
            Paid Leave
          </label>
        </form>
      </Modal>
    </div>
  );
}
