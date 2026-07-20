const Task = require('../models/Task');
const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const notificationService = require('../services/notificationService');
const taskService = require('../services/taskService');
const { ROLES } = require('../config/constants/roles');
const { TASK_STATUS } = require('../config/constants/task');

const isSystemAdmin = (user) => user.role === ROLES.SYSTEM_ADMIN;
const canAccessTask = (user, task) =>
  isSystemAdmin(user) || String(task.assignedTo._id || task.assignedTo) === String(user._id);

/** POST /api/tasks — system admin assigns a task to an employee. */
const createTask = asyncHandler(async (req, res) => {
  const { title, description = '', assignedTo, priority = 'medium', deadline = null } = req.body;

  const employee = await User.findById(assignedTo);
  if (!employee || !employee.isActive) throw new ApiError(400, 'Assignee is not a valid, active user.');

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    priority,
    deadline,
    isPersonal: false,
  });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'TASK_ASSIGNED',
    module: 'task',
    entity: 'Task',
    entityId: task._id,
    summary: `Assigned "${task.title}" to ${employee.email}`,
    ip: req.ip,
  });

  notificationService.push({
    user: employee._id,
    type: 'task_assigned',
    title: 'New task assigned',
    body: `${req.user.name} assigned you: "${task.title}".`,
  });

  return ApiResponse.created(res, 'Task assigned', { task });
});

/** POST /api/tasks/todos — employee creates a personal to-do. */
const createTodo = asyncHandler(async (req, res) => {
  const { title, description = '', priority = 'medium', deadline = null } = req.body;

  const task = await Task.create({
    title,
    description,
    assignedTo: req.user._id,
    assignedBy: null,
    priority,
    deadline,
    isPersonal: true,
  });

  return ApiResponse.created(res, 'To-do created', { task });
});

/** GET /api/tasks — admins see everyone (filterable); employees only see their own. */
const listTasks = asyncHandler(async (req, res) => {
  const { status, priority, isPersonal } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (isSystemAdmin(req.user)) {
    if (req.query.assignedTo) q.assignedTo = req.query.assignedTo;
  } else {
    q.assignedTo = req.user._id;
  }
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (isPersonal !== undefined) q.isPersonal = isPersonal === 'true';

  const [items, total] = await Promise.all([
    Task.find(q)
      .sort({ deadline: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email'),
    Task.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Tasks fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** GET /api/tasks/overdue — admins see every overdue task; employees see their own. */
const overdueTasks = asyncHandler(async (req, res) => {
  const q = {
    deadline: { $ne: null, $lt: new Date() },
    status: { $ne: TASK_STATUS.COMPLETED },
  };
  if (!isSystemAdmin(req.user)) q.assignedTo = req.user._id;

  const items = await Task.find(q)
    .sort({ deadline: 1 })
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email');
  return ApiResponse.ok(res, 'Overdue tasks fetched', { items });
});

/** GET /api/tasks/employee/:userId/summary — system admin's view of one employee's workload. */
const employeeSummary = asyncHandler(async (req, res) => {
  const employee = await User.findById(req.params.userId);
  if (!employee) throw new ApiError(404, 'Employee not found.');

  const { tasks, summary } = await taskService.getProfileSummary(req.params.userId);
  return ApiResponse.ok(res, 'Employee task summary fetched', {
    employee: { _id: employee._id, name: employee.name, email: employee.email },
    summary,
    tasks,
  });
});

/** GET /api/tasks/:id */
const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('assignedBy', 'name email')
    .populate('progressNotes.createdBy', 'name email');
  if (!task) throw new ApiError(404, 'Task not found.');
  if (!canAccessTask(req.user, task)) throw new ApiError(403, 'You do not have permission to view this task.');
  return ApiResponse.ok(res, 'Task fetched', { task });
});

/** PATCH /api/tasks/:id — system admin edits an assigned task. */
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found.');

  const { title, description, assignedTo, priority, deadline } = req.body;
  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority !== undefined) task.priority = priority;
  if (deadline !== undefined) task.deadline = deadline;
  if (assignedTo !== undefined && String(assignedTo) !== String(task.assignedTo)) {
    const employee = await User.findById(assignedTo);
    if (!employee || !employee.isActive) throw new ApiError(400, 'Assignee is not a valid, active user.');
    task.assignedTo = assignedTo;
    notificationService.push({
      user: employee._id,
      type: 'task_assigned',
      title: 'Task reassigned to you',
      body: `${req.user.name} assigned you: "${task.title}".`,
    });
  }
  await task.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'TASK_UPDATED',
    module: 'task',
    entity: 'Task',
    entityId: task._id,
    summary: `Updated task "${task.title}"`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Task updated', { task });
});

/** PATCH /api/tasks/:id/progress — employee (own task) or system admin. */
const updateProgress = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found.');
  if (!canAccessTask(req.user, task)) throw new ApiError(403, 'You do not have permission to update this task.');

  const { progress } = req.body;
  task.progress = progress;
  task.status = taskService.statusForProgress(progress);
  task.completedAt = task.status === TASK_STATUS.COMPLETED ? new Date() : null;
  await task.save();

  return ApiResponse.ok(res, 'Task progress updated', { task });
});

/** PATCH /api/tasks/:id/complete — shortcut to mark 100% complete. */
const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found.');
  if (!canAccessTask(req.user, task)) throw new ApiError(403, 'You do not have permission to update this task.');

  task.progress = 100;
  task.status = TASK_STATUS.COMPLETED;
  task.completedAt = new Date();
  await task.save();

  if (task.assignedBy) {
    notificationService.push({
      user: task.assignedBy,
      type: 'task_completed',
      title: 'Task completed',
      body: `"${task.title}" was marked complete.`,
    });
  }

  return ApiResponse.ok(res, 'Task marked complete', { task });
});

/** POST /api/tasks/:id/notes — add a progress note. */
const addProgressNote = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found.');
  if (!canAccessTask(req.user, task)) throw new ApiError(403, 'You do not have permission to update this task.');

  task.progressNotes.push({ note: req.body.note, createdBy: req.user._id });
  await task.save();

  return ApiResponse.created(res, 'Progress note added', { task });
});

/** DELETE /api/tasks/:id — system admin, or the employee for their own personal to-do. */
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new ApiError(404, 'Task not found.');

  const ownPersonalTodo = task.isPersonal && String(task.assignedTo) === String(req.user._id);
  if (!isSystemAdmin(req.user) && !ownPersonalTodo) {
    throw new ApiError(403, 'You do not have permission to delete this task.');
  }

  await task.deleteOne();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'TASK_DELETED',
    module: 'task',
    entity: 'Task',
    entityId: task._id,
    summary: `Deleted task "${task.title}"`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Task deleted');
});

module.exports = {
  createTask,
  createTodo,
  listTasks,
  overdueTasks,
  employeeSummary,
  getTask,
  updateTask,
  updateProgress,
  completeTask,
  addProgressNote,
  deleteTask,
};
