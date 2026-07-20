const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const { ROLES } = require('../config/constants/roles');

/** GET /api/users — paginated list with search + role filter. */
const listUsers = asyncHandler(async (req, res) => {
  const { search = '', role, isActive } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (role) q.role = role;
  if (isActive !== undefined && isActive !== '') q.isActive = isActive === 'true';
  if (search.trim()) {
    q.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { email: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    User.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Users fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

/** POST /api/users — system admin creates a new user/admin. */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = ROLES.ADMIN, phone } = req.body;
  if (!password) throw new ApiError(400, 'Password is required when creating a user.');

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) throw new ApiError(409, 'A user with that email already exists.');

  const user = await User.create({ name, email, password, role, phone });
  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'USER_CREATED',
    module: 'user',
    entity: 'User',
    entityId: user._id,
    summary: `Created user ${user.email} (${user.role})`,
    ip: req.ip,
  });
  return ApiResponse.created(res, 'User created', { user });
});

/** GET /api/users/:id */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  return ApiResponse.ok(res, 'User fetched', { user });
});

/** PATCH /api/users/:id */
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+password');
  if (!user) throw new ApiError(404, 'User not found.');

  const { name, email, password, role, phone, isActive } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password !== undefined) user.password = password; // hashed by pre-save hook
  if (role !== undefined) user.role = role;
  if (phone !== undefined) user.phone = phone;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'USER_UPDATED',
    module: 'user',
    entity: 'User',
    entityId: user._id,
    summary: `Updated user ${user.email}`,
    ip: req.ip,
  });
  return ApiResponse.ok(res, 'User updated', { user });
});

/** DELETE /api/users/:id — soft deactivate to preserve audit referential integrity. */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (String(user._id) === String(req.user._id)) {
    throw new ApiError(400, 'You cannot delete your own account.');
  }
  user.isActive = false;
  await user.save();
  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'USER_DEACTIVATED',
    module: 'user',
    entity: 'User',
    entityId: user._id,
    summary: `Deactivated user ${user.email}`,
    ip: req.ip,
  });
  return ApiResponse.ok(res, 'User deactivated');
});

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser };
