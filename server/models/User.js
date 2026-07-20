const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants/roles');

const { Schema } = mongoose;

const addressSchema = new Schema(
  {
    line1: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    postalCode: { type: String, default: '' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
      default: ROLES.ADMIN,
      index: true,
    },
    phone: { type: String, default: '' },
    photo: { type: String, default: '' }, // Cloudinary URL

    // ── Core profile fields ──────────────────────────────────────────────────
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    address: { type: addressSchema, default: () => ({}) },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
    isActive: { type: Boolean, default: true, index: true },

    // ── Employee-specific fields (Phase 2) ──────────────────────────────────
    employeeId: {
      type: String,
      default: null,
      sparse: true, // allows multiple nulls; enforces unique when set
      index: true,
    },
    department: { type: String, default: '', trim: true },
    designation: { type: String, default: '', trim: true },
    employmentType: {
      type: String,
      enum: ['permanent', 'probation', 'contract', 'intern', ''],
      default: '',
    },
    joiningDate: { type: Date, default: null },
    reportingManager: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    // Forces employee to change their auto-generated password on first login.
    mustChangePassword: { type: Boolean, default: false },

    // ── Auth / Security ──────────────────────────────────────────────────────
    twoFactorEnabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
    refreshTokens: { type: [String], default: [] }, // hashed refresh tokens

    // Password reset
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password on save when modified.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never leak password/reset fields in JSON responses.
userSchema.methods.toJSON = function toPublicJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshTokens;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  return obj;
};

userSchema.index({ name: 'text', email: 'text' });

module.exports = mongoose.model('User', userSchema);
