const mongoose = require('mongoose');

const tableSessionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    customerCount: { type: Number, default: 1 },
    totalOrders: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tableSessionSchema.index({ tenantId: 1, tableId: 1, isActive: 1 });

module.exports = mongoose.model('TableSession', tableSessionSchema);
