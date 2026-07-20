/**
 * Leave application status values. Single source of truth for the leave
 * approval workflow state machine.
 */
const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

module.exports = { LEAVE_STATUS };
