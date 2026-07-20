const Task = require('../models/Task');
const { TASK_STATUS } = require('../config/constants/task');

/** Derive status from a 0–100 progress value; 100 also stamps completedAt. */
function statusForProgress(progress) {
  if (progress >= 100) return TASK_STATUS.COMPLETED;
  if (progress > 0) return TASK_STATUS.IN_PROGRESS;
  return TASK_STATUS.PENDING;
}

/**
 * Full task breakdown for one employee — powers both the employee's own
 * dashboard and the admin's "view any employee's profile" screen.
 */
async function getProfileSummary(userId) {
  const tasks = await Task.find({ assignedTo: userId }).sort({ deadline: 1 }).lean();
  const now = new Date();

  const summary = {
    total: tasks.length,
    assignedCount: 0,
    personalCount: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    completionPercentage: 0,
  };

  for (const task of tasks) {
    if (task.isPersonal) summary.personalCount += 1;
    else summary.assignedCount += 1;

    if (task.status === TASK_STATUS.COMPLETED) summary.completed += 1;
    else if (task.status === TASK_STATUS.IN_PROGRESS) summary.inProgress += 1;
    else summary.pending += 1;

    const isOverdue =
      task.deadline && new Date(task.deadline) < now && task.status !== TASK_STATUS.COMPLETED;
    if (isOverdue) summary.overdue += 1;
  }

  summary.completionPercentage =
    summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;

  return { tasks, summary };
}

module.exports = { statusForProgress, getProfileSummary };
