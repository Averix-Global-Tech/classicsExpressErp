require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Grievance = require('../models/Grievance');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    // 1. Create or Find User "Bhavya"
    let bhavya = await User.findOne({ email: 'bhavya@classicexpress.com' });
    if (!bhavya) {
      bhavya = new User({
        name: 'Bhavya',
        email: 'bhavya@classicexpress.com',
        password: 'password123', // Will be hashed by pre-save hook
        role: 'admin',
        employeeId: 'EMP-001',
        department: 'IT',
        designation: 'Web Developer',
        isActive: true,
      });
      await bhavya.save();
      console.log('Created user Bhavya');
    } else {
      console.log('User Bhavya already exists');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 2. Create Sample Attendance
    await Attendance.deleteMany({ employee: bhavya._id });

    const attendanceRecords = [
      {
        employee: bhavya._id,
        date: yesterday,
        checkIn: new Date(yesterday.setHours(9, 15, 0, 0)),
        checkOut: new Date(yesterday.setHours(18, 30, 0, 0)),
        workingMinutes: 9 * 60 + 15, // 9 hours 15 mins
        status: 'Present',
        approvalStatus: 'Approved',
        isLate: true,
        lateMinutes: 15,
        auditLog: [
          { action: 'CHECK_IN', details: 'Checked in at 9:15 AM' },
          { action: 'CHECK_OUT', details: 'Checked out at 6:30 PM' },
          { action: 'APPROVED', details: 'Approved by system' }
        ]
      },
      {
        employee: bhavya._id,
        date: today,
        checkIn: new Date(new Date().setHours(8, 55, 0, 0)), // Today morning
        checkOut: null,
        workingMinutes: 0,
        status: 'Present',
        approvalStatus: 'Checked In',
        isLate: false,
        lateMinutes: 0,
        auditLog: [
          { action: 'CHECK_IN', details: 'Checked in at 8:55 AM' }
        ]
      },
      {
        employee: bhavya._id,
        date: tomorrow, // Just a pending one
        checkIn: null,
        checkOut: null,
        workingMinutes: 0,
        status: 'Leave',
        approvalStatus: 'Pending Check-In',
        auditLog: []
      }
    ];

    await Attendance.insertMany(attendanceRecords);
    console.log('Created sample attendance records for Bhavya');

    // 3. Create Sample Grievances
    await Grievance.deleteMany({ employee: bhavya._id });

    const grievanceRecords = [
      {
        employee: bhavya._id,
        subject: 'Internet Connectivity Issue ',
        category: 'IT Support',
        priority: 'High',
        status: 'In Progress',
        description: '<p>The Wi-Fi connection in Bay 4 drops frequently. Please check the router.</p>',
        department: 'IT',
        auditLog: [
          { action: 'CREATED', details: 'Grievance submitted by Bhavya' },
          { action: 'STATUS_CHANGED', details: 'Status changed to In Progress' }
        ]
      },
      {
        employee: bhavya._id,
        subject: 'Air Conditioning too cold',
        category: 'Facilities',
        priority: 'Low',
        status: 'Submitted',
        description: '<p>The AC near my desk is blowing directly and it is very cold.</p>',
        department: 'IT',
        auditLog: [
          { action: 'CREATED', details: 'Grievance submitted by Bhavya' }
        ]
      },
      {
        employee: bhavya._id,
        subject: 'Request for new ergonomic chair',
        category: 'HR/Admin',
        priority: 'Medium',
        status: 'Resolved',
        description: '<p>Requesting a replacement for my chair as the current one is causing back pain.</p>',
        department: 'IT',
        resolvedAt: new Date(),
        resolutionFeedback: 'A new chair has been ordered and placed at your desk.',
        auditLog: [
          { action: 'CREATED', details: 'Grievance submitted by Bhavya' },
          { action: 'STATUS_CHANGED', details: 'Status changed to Resolved' }
        ]
      }
    ];

    for (let record of grievanceRecords) {
      const g = new Grievance(record);
      await g.save();
    }
    console.log('Created sample grievance records for Bhavya');

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
