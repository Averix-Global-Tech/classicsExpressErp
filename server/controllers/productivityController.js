const AwbEntry = require('../models/AwbEntry');
const EmailResolution = require('../models/EmailResolution');
const User = require('../models/User');

// --- AWB Entries ---

exports.getMyAwbEntries = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    let query = { employee: req.user.id };

    if (startDate && endDate) {
      query.processingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      const trimmedSearch = search.trim();
      query.$or = [
        { awbNumber: { $regex: trimmedSearch, $options: 'i' } },
        { partyName: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }

    const entries = await AwbEntry.find(query).sort({ processingDate: -1, createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createAwbEntry = async (req, res) => {
  try {
    const { awbNumber, partyName, destinationCountry, processingDate, remarks } = req.body;

    // Check for existing AWB by this employee
    const existing = await AwbEntry.findOne({ employee: req.user.id, awbNumber: awbNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already processed this AWB number.' });
    }

    const entry = await AwbEntry.create({
      awbNumber,
      partyName,
      destinationCountry,
      processingDate: processingDate || Date.now(),
      remarks,
      employee: req.user.id,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already processed this AWB number.' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateAwbEntry = async (req, res) => {
  try {
    let entry = await AwbEntry.findOne({ _id: req.params.id, employee: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'AWB entry not found' });
    }

    entry = await AwbEntry.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: entry });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already processed this AWB number.' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteAwbEntry = async (req, res) => {
  try {
    const entry = await AwbEntry.findOne({ _id: req.params.id, employee: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'AWB entry not found' });
    }

    await entry.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// --- Email Resolutions ---

exports.getMyEmailResolutions = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    let query = { employee: req.user.id };

    if (startDate && endDate) {
      query.resolutionDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      const trimmedSearch = search.trim();
      query.$or = [
        { emailReferenceNumber: { $regex: trimmedSearch, $options: 'i' } },
        { relatedAwbNumber: { $regex: trimmedSearch, $options: 'i' } },
        { partyName: { $regex: trimmedSearch, $options: 'i' } },
        { subject: { $regex: trimmedSearch, $options: 'i' } },
      ];
    }

    const entries = await EmailResolution.find(query).sort({ resolutionDate: -1, createdAt: -1 });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createEmailResolution = async (req, res) => {
  try {
    const { emailReferenceNumber, partyName, subject, relatedAwbNumber, resolutionDate, remarks } = req.body;

    const entry = await EmailResolution.create({
      emailReferenceNumber,
      partyName,
      subject,
      relatedAwbNumber,
      resolutionDate: resolutionDate || Date.now(),
      remarks,
      employee: req.user.id,
    });

    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateEmailResolution = async (req, res) => {
  try {
    let entry = await EmailResolution.findOne({ _id: req.params.id, employee: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Email entry not found' });
    }

    entry = await EmailResolution.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteEmailResolution = async (req, res) => {
  try {
    const entry = await EmailResolution.findOne({ _id: req.params.id, employee: req.user.id });
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Email entry not found' });
    }

    await entry.deleteOne();
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// --- Statistics Helpers ---

const getStartOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
};

const getStartOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEmployeeStats = async (employeeId) => {
  const today = getStartOfToday();
  const week = getStartOfWeek();
  const month = getStartOfMonth();

  const [
    todayAwbs, weekAwbs, monthAwbs, totalAwbs,
    todayEmails, weekEmails, monthEmails, totalEmails
  ] = await Promise.all([
    AwbEntry.countDocuments({ employee: employeeId, processingDate: { $gte: today } }),
    AwbEntry.countDocuments({ employee: employeeId, processingDate: { $gte: week } }),
    AwbEntry.countDocuments({ employee: employeeId, processingDate: { $gte: month } }),
    AwbEntry.countDocuments({ employee: employeeId }),
    EmailResolution.countDocuments({ employee: employeeId, resolutionDate: { $gte: today } }),
    EmailResolution.countDocuments({ employee: employeeId, resolutionDate: { $gte: week } }),
    EmailResolution.countDocuments({ employee: employeeId, resolutionDate: { $gte: month } }),
    EmailResolution.countDocuments({ employee: employeeId })
  ]);

  return {
    awbs: { today: todayAwbs, week: weekAwbs, month: monthAwbs, total: totalAwbs },
    emails: { today: todayEmails, week: weekEmails, month: monthEmails, total: totalEmails }
  };
};


exports.getMyStats = async (req, res) => {
  try {
    const stats = await getEmployeeStats(req.user.id);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// --- Admin Endpoints ---

exports.getAdminProductivityList = async (req, res) => {
  try {
    const { search } = req.query;
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    const employees = await User.find(query).select('name employeeId department role');
    
    // Attach stats to each employee (This is an N+1 query problem conceptually, but for simplicity in MVP we map it. For scale, use aggregation pipeline)
    // To be performant, we'll use an aggregate pipeline for AWBs and Emails
    const employeeIds = employees.map(e => e._id);
    
    const today = getStartOfToday();
    const month = getStartOfMonth();

    // Aggregate AWBs
    const awbStats = await AwbEntry.aggregate([
      { $match: { employee: { $in: employeeIds } } },
      { $group: {
        _id: '$employee',
        total: { $sum: 1 },
        today: { $sum: { $cond: [{ $gte: ['$processingDate', today] }, 1, 0] } },
        month: { $sum: { $cond: [{ $gte: ['$processingDate', month] }, 1, 0] } }
      }}
    ]);

    // Aggregate Emails
    const emailStats = await EmailResolution.aggregate([
      { $match: { employee: { $in: employeeIds } } },
      { $group: {
        _id: '$employee',
        total: { $sum: 1 },
        today: { $sum: { $cond: [{ $gte: ['$resolutionDate', today] }, 1, 0] } },
        month: { $sum: { $cond: [{ $gte: ['$resolutionDate', month] }, 1, 0] } }
      }}
    ]);

    const result = employees.map(emp => {
      const eObj = emp.toObject();
      const aStat = awbStats.find(a => a._id.toString() === eObj._id.toString()) || { today: 0, month: 0, total: 0 };
      const eStat = emailStats.find(e => e._id.toString() === eObj._id.toString()) || { today: 0, month: 0, total: 0 };
      
      return {
        ...eObj,
        awbStats: { today: aStat.today, month: aStat.month, total: aStat.total },
        emailStats: { today: eStat.today, month: eStat.month, total: eStat.total }
      };
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAdminEmployeeProductivityDetail = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('name employeeId department role');
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const stats = await getEmployeeStats(req.params.id);
    
    // We only send recent ones in detail view by default, or all if requested. We'll send all for simplicity, can paginate later.
    const awbEntries = await AwbEntry.find({ employee: req.params.id }).sort({ processingDate: -1, createdAt: -1 });
    const emailEntries = await EmailResolution.find({ employee: req.params.id }).sort({ resolutionDate: -1, createdAt: -1 });

    res.json({
      success: true,
      data: {
        employee,
        stats,
        awbEntries,
        emailEntries
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
