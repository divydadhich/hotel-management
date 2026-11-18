const mongoose = require('mongoose');

const TRANSACTION_TYPES = {
  PURCHASE: 'purchase',
  SALE_DEDUCTION: 'sale_deduction',
  ADJUSTMENT_ADD: 'adjustment_add',
  ADJUSTMENT_SUBTRACT: 'adjustment_subtract',
  WASTAGE: 'wastage',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  OPENING_STOCK: 'opening_stock',
  RETURN: 'return',
};

const stockTransactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(TRANSACTION_TYPES),
      required: true,
    },
    quantity: { type: Number, required: true }, // positive for inflow, negative for outflow
    unitCost: { type: Number, default: 0, min: 0 },
    totalCost: { type: Number, default: 0 },
    stockBefore: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    referenceType: {
      type: String,
      enum: ['order', 'purchase_order', 'manual', 'wastage_report', 'transfer', 'opening'],
      default: 'manual',
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    batchNumber: { type: String, trim: true },
    expiryDate: { type: Date },
    reason: { type: String, trim: true, maxlength: 300 },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

stockTransactionSchema.index({ tenantId: 1, createdAt: -1 });
stockTransactionSchema.index({ tenantId: 1, inventoryItemId: 1, createdAt: -1 });
stockTransactionSchema.index({ tenantId: 1, type: 1 });
stockTransactionSchema.index({ referenceType: 1, referenceId: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
