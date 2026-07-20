const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const notificationService = require('../services/notificationService');

/** GET /api/notifications */
const listNotifications = asyncHandler(async (req, res) => {
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const [items, unreadCount] = await Promise.all([
    notificationService.listFor(req.user._id, { limit }),
    notificationService.unreadCount(req.user._id),
  ]);
  return ApiResponse.ok(res, 'Notifications fetched', { items, unreadCount });
});

/** PATCH /api/notifications/:id/read */
const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markRead(req.params.id, req.user._id);
  if (!notification) throw new ApiError(404, 'Notification not found.');
  return ApiResponse.ok(res, 'Notification marked read', { notification });
});

/** PATCH /api/notifications/read-all */
const markAllRead = asyncHandler(async (req, res) => {
  const items = await notificationService.markAllRead(req.user._id);
  return ApiResponse.ok(res, 'All notifications marked read', { items });
});

module.exports = { listNotifications, markRead, markAllRead };
