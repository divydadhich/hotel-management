const mongoose = require('mongoose');
const crypto = require('crypto');

const tableSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    number: { type: String, required: true, trim: true },
    label: { type: String, trim: true },
    capacity: { type: Number, default: 4 },
    token: { type: String, unique: true },
    qrCodeUrl: { type: String },
    qrCodeData: { type: String },
    status: { type: String, enum: ['available', 'occupied', 'order_pending', 'cleaning'], default: 'available', index: true },
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

tableSchema.index({ tenantId: 1, number: 1 }, { unique: true });
tableSchema.index({ tenantId: 1, token: 1 }, { unique: true });

tableSchema.pre('save', function () {
  if (!this.token) {
    this.token = crypto.randomBytes(24).toString('hex');
  }
});

module.exports = mongoose.model('Table', tableSchema);
