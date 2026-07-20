const mongoose = require('mongoose');
const Grievance = require('../models/Grievance');
const GrievanceMessage = require('../models/GrievanceMessage');
const GrievanceSettings = require('../models/GrievanceSettings');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');

// ─── Utility ─────────────────────────────────────────────────────────────────

const getSettings = async () => {
  let settings = await GrievanceSettings.findOne();
  if (!settings) settings = await GrievanceSettings.create({});
  return settings;
};

const calculateExpectedResolution = (settings, priority) => {
  const hours = settings.slas.get(priority) || 72;
  const expectedDate = new Date();
  expectedDate.setHours(expectedDate.getHours() + hours);
  return expectedDate;
};

// ─── Settings Controllers ────────────────────────────────────────────────────

exports.getGrievanceSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  return ApiResponse.ok(res, 'Settings fetched', settings);
});

exports.updateGrievanceSettings = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  const { categories, slas, maxAttachmentSizeMB } = req.body;
  if (categories) settings.categories = categories;
  if (slas) settings.slas = slas;
  if (maxAttachmentSizeMB) settings.maxAttachmentSizeMB = maxAttachmentSizeMB;
  
  await settings.save();
  return ApiResponse.ok(res, 'Settings updated', settings);
});

// ─── Core Controllers ────────────────────────────────────────────────────────

exports.createGrievance = asyncHandler(async (req, res) => {
  const { subject, category, priority, description } = req.body;
  const settings = await getSettings();
  
  const attachments = req.files ? req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    filename: f.originalname,
    mimetype: f.mimetype,
    size: f.size
  })) : [];

  const expectedDate = calculateExpectedResolution(settings, priority || 'Medium');

  const grievance = await Grievance.create({
    employee: req.user._id,
    department: req.user.department || '',
    branch: req.user.branch || '',
    subject,
    category,
    priority: priority || 'Medium',
    description,
    attachments,
    expectedResolutionDate: expectedDate,
    auditLog: [{ modifiedBy: req.user._id, action: 'CREATED', details: 'Grievance submitted' }]
  });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'GRIEVANCE_CREATED',
    module: 'grievance',
    entity: 'Grievance',
    entityId: grievance._id,
    summary: `Raised grievance: ${grievance.ticketNumber}`,
    ip: req.ip,
  });

  return ApiResponse.created(res, 'Grievance submitted successfully', { grievance });
});

exports.getMyGrievances = asyncHandler(async (req, res) => {
  const grievances = await Grievance.find({ employee: req.user._id })
    .sort({ createdAt: -1 })
    .populate('assignedTo', 'name');
  
  return ApiResponse.ok(res, 'Grievances fetched', { grievances });
});

exports.getAllGrievances = asyncHandler(async (req, res) => {
  const { status, priority, category, search = '' } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (status) q.status = status;
  if (priority) q.priority = priority;
  if (category) q.category = category;
  if (search) {
    q.$or = [
      { ticketNumber: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    Grievance.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('employee', 'name employeeId department branch')
      .populate('assignedTo', 'name')
      .lean(),
    Grievance.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'All grievances fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getGrievanceDetails = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id)
    .populate('employee', 'name email department branch')
    .populate('assignedTo', 'name email')
    .populate('auditLog.modifiedBy', 'name role');

  if (!grievance) throw new ApiError(404, 'Grievance not found');

  // Security: If not admin/sysadmin, ensure it belongs to the user
  if (req.user.role === 'employee' && grievance.employee._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const messagesQuery = { grievance: grievance._id };
  // Hide internal notes from standard employees
  if (req.user.role === 'employee') {
    messagesQuery.isInternalNote = false;
  }

  const messages = await GrievanceMessage.find(messagesQuery)
    .sort({ createdAt: 1 })
    .populate('sender', 'name role');

  return ApiResponse.ok(res, 'Grievance details fetched', { grievance, messages });
});

exports.addReply = asyncHandler(async (req, res) => {
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new ApiError(404, 'Grievance not found');

  // Security check
  const isAdmin = ['system_admin', 'admin'].includes(req.user.role);
  if (!isAdmin && grievance.employee.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Access denied');
  }

  const { message, isInternalNote } = req.body;
  if (!message) throw new ApiError(400, 'Message is required');

  const attachments = req.files ? req.files.map(f => ({
    url: `/uploads/${f.filename}`,
    filename: f.originalname,
    mimetype: f.mimetype,
    size: f.size
  })) : [];

  const reply = await GrievanceMessage.create({
    grievance: grievance._id,
    sender: req.user._id,
    message,
    isInternalNote: isAdmin ? (isInternalNote === 'true') : false,
    attachments
  });

  // Auto-update status if needed
  if (!reply.isInternalNote && grievance.status !== 'Closed' && grievance.status !== 'Resolved') {
    if (isAdmin) grievance.status = 'Waiting for Employee';
    else if (grievance.status === 'Waiting for Employee') grievance.status = 'In Progress';
  }

  grievance.auditLog.push({
    modifiedBy: req.user._id,
    action: reply.isInternalNote ? 'INTERNAL_NOTE_ADDED' : 'REPLY_ADDED'
  });

  await grievance.save();
  await reply.populate('sender', 'name role');

  return ApiResponse.ok(res, 'Reply added', { reply });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new ApiError(404, 'Grievance not found');

  const oldStatus = grievance.status;
  grievance.status = status;
  
  if (status === 'Resolved') grievance.resolvedAt = new Date();
  if (status === 'Closed') grievance.closedAt = new Date();
  if (status === 'Rejected') {
    if (!rejectionReason) throw new ApiError(400, 'Rejection reason is required');
    grievance.rejectionReason = rejectionReason;
  }

  grievance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'STATUS_CHANGED',
    details: `Status changed from ${oldStatus} to ${status}`
  });

  await grievance.save();
  return ApiResponse.ok(res, 'Status updated', { grievance });
});

exports.assignGrievance = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const grievance = await Grievance.findById(req.params.id);
  if (!grievance) throw new ApiError(404, 'Grievance not found');

  grievance.assignedTo = assignedTo;
  if (grievance.status === 'Submitted' || grievance.status === 'Pending Review') {
    grievance.status = 'Assigned';
  }

  grievance.auditLog.push({
    modifiedBy: req.user._id,
    action: 'ASSIGNED',
    details: 'Ticket assigned'
  });

  await grievance.save();
  await grievance.populate('assignedTo', 'name email');
  return ApiResponse.ok(res, 'Ticket assigned', { grievance });
});

exports.submitFeedback = asyncHandler(async (req, res) => {
  const { rating, feedback, resolved } = req.body;
  const grievance = await Grievance.findById(req.params.id);
  
  if (!grievance) throw new ApiError(404, 'Grievance not found');
  if (grievance.employee.toString() !== req.user._id.toString()) throw new ApiError(403, 'Access denied');

  if (resolved === false) {
    grievance.status = 'Reopened';
    grievance.auditLog.push({ modifiedBy: req.user._id, action: 'REOPENED', details: feedback });
  } else {
    grievance.status = 'Closed';
    grievance.resolutionRating = rating;
    grievance.resolutionFeedback = feedback;
    grievance.closedAt = new Date();
    grievance.auditLog.push({ modifiedBy: req.user._id, action: 'CLOSED', details: 'Feedback submitted' });
  }

  await grievance.save();
  return ApiResponse.ok(res, 'Feedback submitted', { grievance });
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const isAdmin = ['system_admin', 'admin'].includes(req.user.role);
  
  const query = {};
  if (!isAdmin) {
    query.employee = req.user._id;
  }

  const stats = await Grievance.aggregate([
    { $match: query },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const priorityStats = await Grievance.aggregate([
    { $match: query },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);

  const categoryStats = await Grievance.aggregate([
    { $match: query },
    { $group: { _id: '$category', count: { $sum: 1 } } }
  ]);

  const statusMap = stats.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
  
  return ApiResponse.ok(res, 'Stats fetched', { 
    stats: statusMap,
    priorityStats,
    categoryStats,
  });
});
