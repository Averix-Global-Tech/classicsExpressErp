const express = require('express');
const { taskValidator } = require('../validators/taskValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/constants/roles');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.use(authenticate);

router.post('/todos', taskValidator.createTodo, validate, taskController.createTodo);
router.post(
  '/',
  requireRole(ROLES.SYSTEM_ADMIN),
  taskValidator.createTask,
  validate,
  taskController.createTask
);
router.get('/', taskValidator.listTasks, validate, taskController.listTasks);
router.get('/overdue', taskController.overdueTasks);
router.get(
  '/employee/:userId/summary',
  requireRole(ROLES.SYSTEM_ADMIN),
  taskController.employeeSummary
);
router.get('/:id', taskController.getTask);
router.patch(
  '/:id',
  requireRole(ROLES.SYSTEM_ADMIN),
  taskValidator.updateTask,
  validate,
  taskController.updateTask
);
router.patch(
  '/:id/progress',
  taskValidator.updateProgress,
  validate,
  taskController.updateProgress
);
router.patch('/:id/complete', taskController.completeTask);
router.post('/:id/notes', taskValidator.addNote, validate, taskController.addProgressNote);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
