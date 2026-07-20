const express = require('express');
const { userValidator } = require('../validators/userValidator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/constants/roles');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authenticate, requireRole(ROLES.SYSTEM_ADMIN));

router.get('/', userController.listUsers);
router.post('/', userValidator.createUser, validate, userController.createUser);
router.get('/:id', userController.getUser);
router.patch('/:id', userValidator.updateUser, validate, userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
