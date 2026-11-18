const mongoose = require('mongoose');

const dayScheduleSchema = new mongoose.Schema({
  isOpen: { type: Boolean, default: true },
  openTime: { type: String, default: '09:00' },
  closeTime: { type: String, default: '22:00' },
}, { _id: false });

const businessSettingsSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxName: { type: String, default: 'GST' },
    serviceChargeRate: { type: Number, default: 0, min: 0, max: 100 },
    serviceChargeName: { type: String, default: 'Service Charge' },
    enableOnlinePayment: { type: Boolean, default: false },
    enableCashPayment: { type: Boolean, default: true },
    enablePayAtCounter: { type: Boolean, default: true },
    razorpayKeyId: { type: String, default: null },
    razorpayKeySecret: { type: String, default: null, select: false },
    operatingHours: {
      monday: { type: dayScheduleSchema, default: () => ({}) },
      tuesday: { type: dayScheduleSchema, default: () => ({}) },
      wednesday: { type: dayScheduleSchema, default: () => ({}) },
      thursday: { type: dayScheduleSchema, default: () => ({}) },
      friday: { type: dayScheduleSchema, default: () => ({}) },
      saturday: { type: dayScheduleSchema, default: () => ({}) },
      sunday: { type: dayScheduleSchema, default: () => ({}) },
    },
    holidays: { type: [Date], default: [] },
    closedMessage: { type: String, default: 'We are currently closed. Please visit us during our working hours.' },
    enableReviews: { type: Boolean, default: true },
    enableCoupons: { type: Boolean, default: false },
    enableStockTracking: { type: Boolean, default: false },
    notificationEmail: String,
    lowStockThreshold: { type: Number, default: 5 },
    orderConfirmationSms: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
