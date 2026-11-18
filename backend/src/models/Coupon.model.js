const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number },
    usageLimit: { type: Number, default: null },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    applicableItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }],
  },
  { timestamps: true }
);

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Coupon', couponSchema);
