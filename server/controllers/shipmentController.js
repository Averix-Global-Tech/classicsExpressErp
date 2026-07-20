const mongoose = require('mongoose');
const Shipment = require('../models/Shipment');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const auditService = require('../services/auditService');
const { ADMIN_ROLES } = require('../config/constants/roles');

// ─── Booking ─────────────────────────────────────────────────────────────────

exports.logRequest = (req, res, next) => {
  console.log(`[SHIPMENT ROUTE] ${req.method} ${req.originalUrl}`);
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('User _id:', req.user?._id);
  console.log('User role:', req.user?.role);
  next();
};

exports.createShipment = asyncHandler(async (req, res) => {
  const {
    shipmentType,
    otherShipmentType,
    serviceType,
    sender,
    receiver,
    package: pkg,
    destinationCountry,
    international,
  } = req.body;

  if (!sender?.name || !sender?.phone || !sender?.address) {
    throw new ApiError(400, 'Sender name, phone and address are required');
  }
  if (!/^\d{10}$/.test(sender.phone)) {
    throw new ApiError(400, 'Sender mobile number must contain exactly 10 digits.');
  }

  if (!receiver?.name || !receiver?.phone || !receiver?.address) {
    throw new ApiError(400, 'Receiver name, phone and address are required');
  }
  if (!/^\d{10}$/.test(receiver.phone)) {
    throw new ApiError(400, 'Receiver mobile number must contain exactly 10 digits.');
  }

  if (shipmentType === 'Other' && !otherShipmentType) {
    throw new ApiError(400, 'Please specify the shipment type when Other is selected.');
  }

  // Backward compatibility support: ensure weightValue exists, fallback to legacy weight if not present
  const weightVal = pkg?.weightValue !== undefined ? pkg.weightValue : pkg?.weight;
  if (weightVal === undefined || weightVal === null || weightVal <= 0) {
    throw new ApiError(400, 'Package weight must be greater than 0');
  }
  
  if (pkg?.lengthValue < 0 || pkg?.widthValue < 0 || pkg?.heightValue < 0) {
    throw new ApiError(400, 'Dimensions cannot be negative');
  }

  if (!destinationCountry) {
    throw new ApiError(400, 'Destination country is required');
  }

  const branch = req.user.branch?.toString() || '';

  const shipment = await Shipment.create({
    shipmentType,
    otherShipmentType: shipmentType === 'Other' ? otherShipmentType : '',
    serviceType: serviceType || 'Economy',
    sender,
    receiver,
    package: pkg,
    destinationCountry,
    international: international || {},
    branch,
    bookedBy: req.user._id,
    timeline: [
      {
        status: 'Booked',
        branch,
        employee: req.user._id,
        remarks: 'Shipment booked',
      },
    ],
    auditLog: [{ modifiedBy: req.user._id, action: 'CREATED', details: 'Shipment booked' }],
  });

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'SHIPMENT_CREATED',
    module: 'shipment',
    entity: 'Shipment',
    entityId: shipment._id,
    summary: `Booked shipment: ${shipment.awbNumber}`,
    ip: req.ip,
  });

  return ApiResponse.created(res, 'Shipment booked successfully', { shipment });
});

// ─── Listing / Search ────────────────────────────────────────────────────────

exports.getAllShipments = asyncHandler(async (req, res) => {
  const { status, destinationCountry, search = '', dateFrom, dateTo } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

  const q = {};
  if (!ADMIN_ROLES.includes(req.user.role)) {
    q.bookedBy = req.user._id;
  }
  if (status) q.status = status;
  if (destinationCountry) q.destinationCountry = { $regex: destinationCountry, $options: 'i' };
  if (dateFrom || dateTo) {
    q.createdAt = {};
    if (dateFrom) q.createdAt.$gte = new Date(dateFrom);
    if (dateTo) q.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
  }
  if (search) {
    q.$or = [
      { awbNumber: { $regex: search, $options: 'i' } },
      { 'sender.name': { $regex: search, $options: 'i' } },
      { 'receiver.name': { $regex: search, $options: 'i' } },
      { 'sender.phone': { $regex: search, $options: 'i' } },
      { 'receiver.phone': { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Shipment.find(q)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('bookedBy', 'name')
      .lean(),
    Shipment.countDocuments(q),
  ]);

  return ApiResponse.ok(res, 'Shipments fetched', {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
  });
});

exports.getShipmentDetails = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, 'Invalid Shipment ID');
  }

  const shipment = await Shipment.findById(req.params.id)
    .populate('bookedBy', 'name email')
    .populate('timeline.employee', 'name role')
    .populate('auditLog.modifiedBy', 'name role');

  if (!shipment) throw new ApiError(404, 'Shipment not found');

  if (!ADMIN_ROLES.includes(req.user.role) && shipment.bookedBy._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You are not authorized to view this shipment');
  }

  return ApiResponse.ok(res, 'Shipment details fetched', { shipment });
});

exports.getShipmentByAwb = asyncHandler(async (req, res) => {
  const { awbNumber } = req.params;
  const shipment = await Shipment.findOne({ awbNumber: { $regex: new RegExp(`^${awbNumber}$`, 'i') } })
    .populate('bookedBy', 'name email')
    .populate('timeline.employee', 'name role')
    .populate('auditLog.modifiedBy', 'name role');

  if (!shipment) throw new ApiError(404, 'Shipment not found for this AWB Number');

  return ApiResponse.ok(res, 'Shipment found', { shipment });
});


// ─── Status / Tracking ───────────────────────────────────────────────────────

exports.updateStatus = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, 'Invalid Shipment ID');
  }

  const { status, remarks } = req.body;
  if (!status || !Shipment.ALL_STATUSES.includes(status)) {
    throw new ApiError(400, 'A valid status is required');
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  if (Shipment.EXCEPTION_STATUSES.includes(status) && !remarks) {
    throw new ApiError(400, `Remarks are required when marking a shipment as ${status}`);
  }

  const oldStatus = shipment.status;
  const branch = req.user.branch?.toString() || shipment.branch;

  shipment.status = status;
  if (status === 'Delivered') shipment.deliveredAt = new Date();

  shipment.timeline.push({
    status,
    branch,
    employee: req.user._id,
    remarks: remarks || '',
  });

  shipment.auditLog.push({
    modifiedBy: req.user._id,
    action: 'STATUS_CHANGED',
    details: `Status changed from ${oldStatus} to ${status}`,
  });

  await shipment.save();
  await shipment.populate('timeline.employee', 'name role');

  return ApiResponse.ok(res, 'Status updated', { shipment });
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

const IN_TRANSIT_STATUSES = [
  'Picked Up',
  'At Origin Hub',
  'Export Customs',
  'In Transit',
  'Arrived Destination Country',
  'Out For Delivery',
];

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  const matchFilter = isAdmin ? {} : { bookedBy: req.user._id };

  const [statusAgg, bookedToday, deliveredToday, recentShipments] = await Promise.all([
    Shipment.aggregate([{ $match: matchFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Shipment.countDocuments({ ...matchFilter, createdAt: { $gte: startOfToday } }),
    Shipment.countDocuments({ ...matchFilter, deliveredAt: { $gte: startOfToday } }),
    Shipment.find(matchFilter).sort({ createdAt: -1 }).limit(8).select('awbNumber status destinationCountry receiver.name createdAt').lean(),
  ]);

  let employeeBreakdown = [];
  let branchBreakdown = [];

  if (isAdmin) {
    [employeeBreakdown, branchBreakdown] = await Promise.all([
      Shipment.aggregate([
        { $group: { _id: '$bookedBy', count: { $sum: 1 } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
        { $unwind: '$employee' },
        { $project: { name: '$employee.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Shipment.aggregate([
        { $group: { _id: '$branch', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
  }

  const statusMap = statusAgg.reduce((acc, curr) => ({ ...acc, [curr._id]: curr.count }), {});
  const total = statusAgg.reduce((sum, curr) => sum + curr.count, 0);
  const inTransit = IN_TRANSIT_STATUSES.reduce((sum, s) => sum + (statusMap[s] || 0), 0);
  const delivered = statusMap['Delivered'] || 0;
  const returned = statusMap['Returned'] || 0;
  const cancelled = statusMap['Cancelled'] || 0;
  const lost = statusMap['Lost'] || 0;
  const closedCount = delivered + returned + cancelled + lost;
  const deliverySuccessRate = closedCount > 0 ? Math.round((delivered / closedCount) * 1000) / 10 : 0;

  return ApiResponse.ok(res, 'Stats fetched', {
    stats: {
      total,
      booked: statusMap['Booked'] || 0,
      pendingPickup: statusMap['Pickup Scheduled'] || 0,
      inTransit,
      customsHold: (statusMap['Import Customs'] || 0) + (statusMap['Export Customs'] || 0),
      delivered,
      returned,
      cancelled,
      lost,
    },
    bookedToday,
    deliveredToday,
    deliverySuccessRate,
    statusBreakdown: statusAgg,
    employeeBreakdown,
    branchBreakdown,
    recentShipments,
  });
});

// ─── Reports ──────────────────────────────────────────────────────────────────

exports.getReports = asyncHandler(async (req, res) => {
  const [branchWise, countryWise, dailyLast14] = await Promise.all([
    Shipment.aggregate([
      { $group: { _id: '$branch', count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]),
    Shipment.aggregate([
      { $group: { _id: '$destinationCountry', count: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } } } },
      { $sort: { count: -1 } },
    ]),
    Shipment.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          booked: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const [pendingShipments, returnedShipments] = await Promise.all([
    Shipment.countDocuments({ status: { $nin: ['Delivered', 'Returned', 'Cancelled', 'Lost'] } }),
    Shipment.countDocuments({ status: 'Returned' }),
  ]);

  return ApiResponse.ok(res, 'Reports fetched', {
    branchWise,
    countryWise,
    dailyLast14,
    pendingShipments,
    returnedShipments,
  });
});

exports.updateShipment = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, 'Invalid Shipment ID');
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  const isAdmin = ADMIN_ROLES.includes(req.user.role);
  if (!isAdmin) {
    if (shipment.bookedBy.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You are not authorized to edit this shipment');
    }
    if (shipment.status !== 'Booked') {
      throw new ApiError(403, 'Shipment cannot be edited after it has been processed');
    }
  }

  const { shipmentType, otherShipmentType, serviceType, sender, receiver, package: pkg, destinationCountry, international } = req.body;
  
  if (sender) {
    if (sender.phone && !/^\d{10}$/.test(sender.phone)) {
      throw new ApiError(400, 'Sender mobile number must contain exactly 10 digits.');
    }
    shipment.sender = sender;
  }
  
  if (receiver) {
    if (receiver.phone && !/^\d{10}$/.test(receiver.phone)) {
      throw new ApiError(400, 'Receiver mobile number must contain exactly 10 digits.');
    }
    shipment.receiver = receiver;
  }
  
  if (shipmentType) {
    shipment.shipmentType = shipmentType;
    if (shipmentType === 'Other') {
      if (!otherShipmentType) throw new ApiError(400, 'Please specify the shipment type when Other is selected.');
      shipment.otherShipmentType = otherShipmentType;
    } else {
      shipment.otherShipmentType = '';
    }
  }

  if (pkg) {
    const weightVal = pkg.weightValue !== undefined ? pkg.weightValue : pkg.weight;
    if (weightVal !== undefined && weightVal <= 0) {
      throw new ApiError(400, 'Package weight must be greater than 0');
    }
    if ((pkg.lengthValue !== undefined && pkg.lengthValue < 0) || 
        (pkg.widthValue !== undefined && pkg.widthValue < 0) || 
        (pkg.heightValue !== undefined && pkg.heightValue < 0)) {
      throw new ApiError(400, 'Dimensions cannot be negative');
    }
    shipment.package = pkg;
  }

  if (serviceType) shipment.serviceType = serviceType;
  if (destinationCountry) shipment.destinationCountry = destinationCountry;
  if (international) shipment.international = international;

  shipment.auditLog.push({
    modifiedBy: req.user._id,
    action: 'UPDATED',
    details: 'Shipment details updated manually',
  });

  await shipment.save();
  return ApiResponse.ok(res, 'Shipment updated', { shipment });
});

exports.deleteShipment = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(400, 'Invalid Shipment ID');
  }

  const shipment = await Shipment.findById(req.params.id);
  if (!shipment) throw new ApiError(404, 'Shipment not found');

  await shipment.deleteOne();

  auditService.record({
    user: req.user._id,
    userEmail: req.user.email,
    action: 'SHIPMENT_DELETED',
    module: 'shipment',
    entity: 'Shipment',
    entityId: shipment._id,
    summary: `Deleted shipment: ${shipment.awbNumber}`,
    ip: req.ip,
  });

  return ApiResponse.ok(res, 'Shipment deleted');
});
