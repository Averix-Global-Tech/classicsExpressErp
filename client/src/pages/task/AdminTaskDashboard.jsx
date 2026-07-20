import { useState, useEffect, useCallback } from 'react';
import {
  Plus, CheckCircle, Clock, AlertTriangle, Users, ListTodo, Eye, Trash2, Edit2,
} from 'lucide-react';
import taskService from '../../services/taskService';
import employeeService from '../../services/employeeService';
import { useToast } from '../../context/ToastContext';
import {
  Button, Badge, Card, CardHeader, Spinner, EmptyState, Modal, Input, Select, Textarea,
  StatCard, SearchBar, Pagination, DataTable,
} from '../../components/ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const assignSchema = yup.object().shape({
  title: yup.string().min(2, 'Title must be 2-200 characters').max(200).required('Title is required'),
  description: yup.string().max(2000),
  assignedTo: yup.string().required('Assignee is required'),
  priority: yup.string(),
  deadline: yup.string(),
});

const priorityColors = { low: 'grey', medium: 'blue', high: 'amber', urgent: 'red' };
const statusColors = { pending: 'amber', in_progress: 'blue', completed: 'green' };

export default function AdminTaskDashboard() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [employees, setEmployees] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [detailTask, setDetailTask] = useState(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(assignSchema),
    defaultValues: { priority: 'medium' },
  });

  const fetchTasks = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (assigneeFilter) params.assignedTo = assigneeFilter;
      const res = await taskService.listTasks(params);
      setTasks(res.items || []);
      setPagination(res.pagination);
    } catch {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, assigneeFilter]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await employeeService.list({ limit: 100, isActive: 'true' });
      setEmployees(res.items || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchOverdue = useCallback(async () => {
    try {
      const res = await taskService.getOverdue();
      setOverdueTasks(res.items || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => { fetchTasks(); fetchEmployees(); fetchOverdue(); }, [fetchTasks, fetchEmployees, fetchOverdue]);

  const onAssign = async (data) => {
    setSubmitting(true);
    try {
      await taskService.createTask(data);
      toast.success('Task assigned successfully.');
      setShowAssign(false);
      reset();
      fetchTasks();
      fetchOverdue();
    } catch (err) {
      toast.error(err?.message || 'Failed to assign task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskService.deleteTask(id);
      toast.success('Task deleted.');
      fetchTasks();
      fetchOverdue();
      setDetailTask(null);
    } catch (err) {
      toast.error(err?.message || 'Failed to delete task.');
    }
  };

  const fetchDetail = async (id) => {
    try {
      const res = await taskService.getTask(id);
      setDetailTask(res.task);
    } catch {
      toast.error('Failed to load task details.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const columns = [
    {
      key: 'title',
      header: 'Task',
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.title}</span>
          {r.isPersonal && <span className="ml-2 text-[10px] text-purple-500 font-medium bg-purple-50 px-1.5 py-0.5 rounded">Personal</span>}
        </div>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      render: (r) => <span className="text-sm text-slate-600">{r.assignedTo?.name || r.assignedTo?.email || '—'}</span>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <Badge color={priorityColors[r.priority]}>{r.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <Badge color={statusColors[r.status]}>{r.status.replace('_', ' ')}</Badge>,
    },
    {
      key: 'progress',
      header: 'Progress',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${r.progress}%` }} />
          </div>
          <span className="text-xs text-slate-500">{r.progress}%</span>
        </div>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      render: (r) => (
        <span className={r.isOverdue ? 'text-rose-500 font-medium text-xs' : 'text-xs text-slate-500'}>
          {formatDate(r.deadline)}
        </span>
      ),
    },
    {
      key: '_id',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); fetchDetail(r._id); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-colors">
            <Eye size={14} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Task Management</h1>
          <p className="mt-1 text-sm text-slate-500">Assign tasks, track progress, and manage team workload.</p>
        </div>
        <Button onClick={() => setShowAssign(true)}>
          <Plus size={16} className="mr-1.5" /> Assign Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tasks" value={pagination.total} icon={ListTodo} accent="blue" />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} accent="amber" />
        <StatCard title="Completed" value={completedCount} icon={CheckCircle} accent="green" />
        <StatCard title="Overdue" value={overdueTasks.length} icon={AlertTriangle} accent="red" />
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-rose-600" />
            <h3 className="text-sm font-semibold text-rose-800">{overdueTasks.length} Overdue Task(s)</h3>
          </div>
          <div className="space-y-1.5">
            {overdueTasks.slice(0, 3).map((t) => (
              <div key={t._id} className="flex items-center justify-between text-xs">
                <span className="text-rose-700">{t.title}</span>
                <span className="text-rose-500">Due: {formatDate(t.deadline)} · {t.assignedTo?.name}</span>
              </div>
            ))}
            {overdueTasks.length > 3 && (
              <p className="text-xs text-rose-500">+ {overdueTasks.length - 3} more</p>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-wrap gap-3">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <Select
          label="Priority"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          options={[
            { value: '', label: 'All Priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        <Select
          label="Assignee"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          options={[
            { value: '', label: 'All Employees' },
            ...employees.map((emp) => ({ value: emp._id, label: emp.name })),
          ]}
        />
      </div>

      {/* Task Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <DataTable columns={columns} data={tasks} loading={loading} emptyTitle="No tasks found" emptyDescription="Assign your first task to get started." onRowClick={(r) => fetchDetail(r._id)} />
        {pagination.pages > 1 && (
          <div className="border-t border-slate-100 px-6 py-3">
            <Pagination page={pagination.page} pages={pagination.pages} onPageChange={fetchTasks} />
          </div>
        )}
      </div>

      {/* Assign Task Modal */}
      <Modal
        open={showAssign}
        onClose={() => { setShowAssign(false); reset(); }}
        title="Assign Task"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowAssign(false); reset(); }} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit(onAssign)} loading={submitting}>Assign</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Title" required placeholder="Task title" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" placeholder="Optional description" rows={3} {...register('description')} />
          <Select
            label="Assign To"
            required
            placeholder="Select employee"
            options={employees.map((emp) => ({ value: emp._id, label: `${emp.name} (${emp.email})` }))}
            error={errors.assignedTo?.message}
            {...register('assignedTo')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              options={['low', 'medium', 'high', 'urgent'].map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))}
              {...register('priority')}
            />
            <Input label="Deadline" type="date" {...register('deadline')} />
          </div>
        </form>
      </Modal>

      {/* Task Detail Modal */}
      <Modal
        open={!!detailTask}
        onClose={() => setDetailTask(null)}
        title={detailTask?.title || 'Task Details'}
        size="lg"
        footer={
          <div className="flex gap-2">
            {detailTask?.status !== 'completed' && (
              <Button variant="danger" size="sm" onClick={() => handleDelete(detailTask._id)}>Delete</Button>
            )}
          </div>
        }
      >
        {detailTask && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Assigned To</span>
                <p className="font-medium">{detailTask.assignedTo?.name || '—'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Assigned By</span>
                <p className="font-medium">{detailTask.assignedBy?.name || 'Self'}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Priority</span>
                <div className="mt-0.5"><Badge color={priorityColors[detailTask.priority]}>{detailTask.priority}</Badge></div>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Status</span>
                <div className="mt-0.5"><Badge color={statusColors[detailTask.status]}>{detailTask.status.replace('_', ' ')}</Badge></div>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Deadline</span>
                <p className="font-medium">{formatDate(detailTask.deadline)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Progress</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${detailTask.progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-brand-600">{detailTask.progress}%</span>
                </div>
              </div>
            </div>
            {detailTask.description && (
              <div>
                <span className="text-slate-500 text-xs">Description</span>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{detailTask.description}</p>
              </div>
            )}
            {detailTask.progressNotes?.length > 0 && (
              <div>
                <span className="text-slate-500 text-xs">Progress Notes</span>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {detailTask.progressNotes.map((note, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-3 text-xs">
                      <p className="text-slate-700">{note.note}</p>
                      <p className="text-slate-400 mt-1">{note.createdBy?.name || 'User'} · {formatDate(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
