const { body, query } = require('express-validator');

const createTask = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 characters.'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('assignedTo').isMongoId().withMessage('A valid employee is required.'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date.'),
];

const createTodo = [
  body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2–200 characters.'),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date.'),
];

const updateTask = [
  body('title').optional().trim().isLength({ min: 2, max: 200 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('assignedTo').optional().isMongoId(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('deadline').optional().isISO8601(),
];

const updateProgress = [
  body('progress').isInt({ min: 0, max: 100 }).withMessage('Progress must be 0–100.'),
];

const addNote = [
  body('note').trim().isLength({ min: 1, max: 1000 }).withMessage('Note must be 1–1000 characters.'),
];

const listTasks = [
  query('status').optional().isIn(['pending', 'in_progress', 'completed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = {
  taskValidator: { createTask, createTodo, updateTask, updateProgress, addNote, listTasks },
};
