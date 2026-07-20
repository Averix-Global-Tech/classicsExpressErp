const mongoose = require('mongoose');
const { TASK_STATUS, TASK_PRIORITY } = require('../config/constants/task');

const { Schema } = mongoose;

/**
 * A single task, either admin-assigned (isPersonal: false, assignedBy set) or a
 * self-created to-do (isPersonal: true, assignedBy null, assignedTo === creator).
 * `isOverdue` is derived from deadline/status rather than stored so it never
 * goes stale.
 */
const progressNoteSchema = new Schema(
  {
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isPersonal: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: Object.values(TASK_PRIORITY),
      default: TASK_PRIORITY.MEDIUM,
    },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(TASK_STATUS),
      default: TASK_STATUS.PENDING,
      index: true,
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    progressNotes: { type: [progressNoteSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

taskSchema.virtual('isOverdue').get(function getIsOverdue() {
  return Boolean(
    this.deadline && this.deadline < new Date() && this.status !== TASK_STATUS.COMPLETED
  );
});

taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
