const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    orderCount: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastOrderAt: Date,
    notes: String,
  },
  { timestamps: true }
);

customerSchema.index({ tenantId: 1, phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ tenantId: 1, email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);
