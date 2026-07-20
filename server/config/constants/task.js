/**
 * Employee task status/priority values. Single source of truth for the task
 * management module's workflow state machine.
 */
const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

module.exports = { TASK_STATUS, TASK_PRIORITY };
