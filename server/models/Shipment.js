const mongoose = require('mongoose');
const { Schema } = mongoose;

// Full lifecycle a shipment can move through. Kept as a single source of
// truth so the controller/UI can build status dropdowns off it.
const STATUS_FLOW = [
  'Booked',
  'Pickup Scheduled',
  'Picked Up',
  'At Origin Hub',
  'Export Customs',
  'In Transit',
  'Arrived Destination Country',
  'Import Customs',
  'Out For Delivery',
  'Delivered',
];

// Terminal statuses reachable from any stage (exception handling).
const EXCEPTION_STATUSES = ['Returned', 'Cancelled', 'Lost'];

const ALL_STATUSES = [...STATUS_FLOW, ...EXCEPTION_STATUSES];

const contactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const shipmentSchema = new Schema(
  {
    awbNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ALL_STATUSES,
      default: 'Booked',
      index: true,
    },
    shipmentType: {
      type: String,
      enum: ['Document', 'Parcel', 'Freight', 'Other'],
      required: true,
    },
    otherShipmentType: { type: String, default: '', trim: true },
    serviceType: {
      type: String,
      enum: ['Express', 'Economy'],
      default: 'Economy',
    },
    sender: { type: contactSchema, required: true },
    receiver: { type: contactSchema, required: true },
    package: {
      numberOfPackages: { type: Number, default: 1, min: 1 },
      weight: { type: Number, default: 0, min: 0 }, // legacy (kg)
      weightValue: { type: Number, required: true, min: 0 },
      weightUnit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' },
      dimensions: {
        length: { type: Number, default: 0 }, // legacy (cm)
        width: { type: Number, default: 0 },  // legacy
        height: { type: Number, default: 0 }, // legacy
      },
      lengthValue: { type: Number, default: 0, min: 0 },
      lengthUnit: { type: String, enum: ['cm', 'in', 'mm'], default: 'cm' },
      widthValue: { type: Number, default: 0, min: 0 },
      widthUnit: { type: String, enum: ['cm', 'in', 'mm'], default: 'cm' },
      heightValue: { type: Number, default: 0, min: 0 },
      heightUnit: { type: String, enum: ['cm', 'in', 'mm'], default: 'cm' },
      shipmentValue: { type: Number, default: 0 },
      description: { type: String, default: '', trim: true },
      fragile: { type: Boolean, default: false },
    },
    destinationCountry: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    international: {
      customsInfo: { type: String, default: '' },
      commercialInvoiceNumber: { type: String, default: '' },
      hsCode: { type: String, default: '' },
      countryOfOrigin: { type: String, default: '' },
      exportReason: { type: String, default: '' },
    },
    branch: {
      type: String, // Copied from booking user at creation; Branch module not built yet.
      default: '',
    },
    bookedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deliveredAt: { type: Date, default: null },
    // Full status-change history — the "shipment timeline".
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        branch: { type: String, default: '' },
        employee: { type: Schema.Types.ObjectId, ref: 'User' },
        remarks: { type: String, default: '' },
      },
    ],
    // Audit Log (who/what/when — distinct from the operational timeline above).
    auditLog: [
      {
        modifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
  },
  { timestamps: true }
);

shipmentSchema.index({ 'sender.name': 'text', 'receiver.name': 'text' });
shipmentSchema.index({ 'sender.phone': 1 });
shipmentSchema.index({ 'receiver.phone': 1 });
shipmentSchema.index({ createdAt: -1 });

// Auto-generate AWB number pre-save if new. Format: CEX-YYMM-000001
shipmentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.awbNumber) {
    try {
      const now = new Date();
      const yymm = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const count = await this.constructor.countDocuments({
        awbNumber: new RegExp(`^CEX-${yymm}-`),
      });
      const seq = (count + 1).toString().padStart(6, '0');
      this.awbNumber = `CEX-${yymm}-${seq}`;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

const Shipment = mongoose.model('Shipment', shipmentSchema);
Shipment.STATUS_FLOW = STATUS_FLOW;
Shipment.EXCEPTION_STATUSES = EXCEPTION_STATUSES;
Shipment.ALL_STATUSES = ALL_STATUSES;

module.exports = Shipment;
