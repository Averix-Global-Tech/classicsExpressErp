const express = require('express');
const { authenticate } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);

module.exports = router;
