import { useState, useEffect, useCallback } from 'react';
import {
  Plus, CheckCircle, Clock, AlertTriangle, ListTodo, Trash2,
  ArrowUpRight, Loader2, MessageSquare,
} from 'lucide-react';
import taskService from '../../services/taskService';
import { useToast } from '../../context/ToastContext';
import {
  Button, Badge, Card, CardHeader, Spinner, EmptyState, Modal, Input, Select, Textarea,
} from '../../components/ui';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const todoSchema = yup.object().shape({
  title: yup.string().min(2, 'Title must be 2-200 characters').max(200).required('Title is required'),
  description: yup.string().max(2000),
  priority: yup.string(),
  deadline: yup.string(),
});

const progressSchema = yup.object().shape({
  progress: yup.number().min(0).max(100).required(),
});

const noteSchema = yup.object().shape({
  note: yup.string().min(1, 'Note is required').max(1000).required('Note is required'),
});

const priorityColors = { low: 'grey', medium: 'blue', high: 'amber', urgent: 'red' };
const statusIcons = {
  pending: <Clock size={14} className="text-amber-500" />,
  in_progress: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  completed: <CheckCircle size={14} className="text-emerald-500" />,
};

export default function MyTasksPage() {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showTodo, setShowTodo] = useState(false);
  const [detailTask, setDetailTask] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(todoSchema),
    defaultValues: { priority: 'medium' },
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab === 'todos') params.isPersonal = 'true';
      if (activeTab === 'assigned') params.isPersonal = 'false';
      if (activeTab === 'pending') params.status = 'pending';
      if (activeTab === 'in_progress') params.status = 'in_progress';
      if (activeTab === 'completed') params.status = 'completed';
      const res = await taskService.listTasks({ ...params, limit: 100 });
      setTasks(res.items || []);
    } catch {
      toast.error('Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const fetchDetail = async (id) => {
    try {
      const res = await taskService.getTask(id);
      setDetailTask(res.task);
    } catch {
      toast.error('Failed to load task details.');
    }
  };

  const onSubmitTodo = async (data) => {
    setSubmitting(true);
    try {
      await taskService.createTodo(data);
      toast.success('To-do created.');
      setShowTodo(false);
      reset();
      fetchTasks();
    } catch (err) {
      toast.error(err?.message || 'Failed to create to-do.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgress = async (taskId, progress) => {
    try {
      await taskService.updateProgress(taskId, progress);
      toast.success('Progress updated.');
      fetchTasks();
      if (detailTask?._id === taskId) fetchDetail(taskId);
    } catch (err) {
      toast.error(err?.message || 'Failed to update progress.');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await taskService.completeTask(taskId);
      toast.success('Task marked complete!');
      fetchTasks();
      if (detailTask?._id === taskId) fetchDetail(taskId);
    } catch (err) {
      toast.error(err?.message || 'Failed to complete task.');
    }
  };

  const handleAddNote = async (taskId) => {
    if (!noteText.trim()) return;
    try {
      await taskService.addNote(taskId, noteText.trim());
      toast.success('Note added.');
      setNoteText('');
      if (detailTask?._id === taskId) fetchDetail(taskId);
    } catch (err) {
      toast.error(err?.message || 'Failed to add note.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await taskService.deleteTask(id);
      toast.success('Task deleted.');
      setDetailTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err?.message || 'Failed to delete task.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const tabs = [
    { id: 'all', label: 'All Tasks' },
    { id: 'assigned', label: 'Assigned to Me' },
    { id: 'todos', label: 'My To-Dos' },
    { id: 'pending', label: 'Pending' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  if (loading && tasks.length === 0) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Tasks</h1>
          <p className="mt-1 text-sm text-slate-500">Manage your assigned tasks and personal to-dos.</p>
        </div>
        <Button onClick={() => setShowTodo(true)}>
          <Plus size={16} className="mr-1.5" /> New To-Do
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-white border border-b-0 border-slate-200 text-brand-600'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks found" description="You're all caught up!" />
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              onClick={() => fetchDetail(task._id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{statusIcons[task.status]}</div>
                  <div className="min-w-0">
                    <h3 className={`text-sm font-semibold ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-lg">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      {task.deadline && (
                        <span className={task.isOverdue ? 'text-rose-500 font-medium' : ''}>
                          Due: {formatDate(task.deadline)}
                        </span>
                      )}
                      {task.assignedBy && (
                        <span>Assigned by: {task.assignedBy.name || task.assignedBy.email}</span>
                      )}
                      {task.isPersonal && (
                        <span className="text-purple-500 font-medium">Personal</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={priorityColors[task.priority]}>{task.priority}</Badge>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-600">{task.progress}%</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.progress >= 50 ? 'bg-brand-500' :
                    task.progress > 0 ? 'bg-amber-500' : 'bg-slate-200'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* New To-Do Modal */}
      <Modal
        open={showTodo}
        onClose={() => { setShowTodo(false); reset(); }}
        title="New To-Do"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setShowTodo(false); reset(); }} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmitTodo)} loading={submitting}>Create To-Do</Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <Input label="Title" required placeholder="What needs to be done?" error={errors.title?.message} {...register('title')} />
          <Textarea label="Description" placeholder="Optional details..." rows={3} {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" options={['low', 'medium', 'high', 'urgent'].map((p) => ({ value: p, label: p.charAt(0).toUpperCase() + p.slice(1) }))} {...register('priority')} />
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
          <div className="flex items-center gap-2">
            {detailTask && detailTask.status !== 'completed' && (
              <>
                <Button variant="danger" size="sm" onClick={() => handleDelete(detailTask._id)}>Delete</Button>
                <Button variant="secondary" size="sm" onClick={() => handleComplete(detailTask._id)}>
                  <CheckCircle size={14} className="mr-1" /> Mark Complete
                </Button>
              </>
            )}
          </div>
        }
      >
        {detailTask && (
          <div className="space-y-5">
            {/* Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 text-xs">Status</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {statusIcons[detailTask.status]}
                  <span className="font-medium capitalize">{detailTask.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Priority</span>
                <div className="mt-0.5"><Badge color={priorityColors[detailTask.priority]}>{detailTask.priority}</Badge></div>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Deadline</span>
                <p className="font-medium mt-0.5">{formatDate(detailTask.deadline)}</p>
              </div>
              <div>
                <span className="text-slate-500 text-xs">Assigned By</span>
                <p className="font-medium mt-0.5">{detailTask.assignedBy?.name || 'Self'}</p>
              </div>
            </div>

            {detailTask.description && (
              <div>
                <span className="text-slate-500 text-xs">Description</span>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{detailTask.description}</p>
              </div>
            )}

            {/* Progress Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Progress</span>
                <span className="text-sm font-bold text-brand-600">{detailTask.progress}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={detailTask.progress}
                onChange={(e) => handleProgress(detailTask._id, Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
              </div>
            </div>

            {/* Progress Notes */}
            <div>
              <span className="text-sm font-medium text-slate-700 mb-2 block">Progress Notes</span>
              {detailTask.progressNotes?.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {detailTask.progressNotes.map((note, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-3 text-xs">
                      <p className="text-slate-700">{note.note}</p>
                      <p className="text-slate-400 mt-1">{note.createdBy?.name || 'You'} · {formatDate(note.createdAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No notes yet.</p>
              )}

              {detailTask.status !== 'completed' && (
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a progress note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={() => handleAddNote(detailTask._id)} disabled={!noteText.trim()}>
                    <MessageSquare size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
