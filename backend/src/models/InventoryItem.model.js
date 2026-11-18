const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    sku: { type: String, trim: true, maxlength: 50 },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory', default: null },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'mg', 'l', 'ml', 'pcs', 'dozen', 'box', 'packet', 'bottle', 'can', 'bunch', 'other'],
      default: 'kg',
    },
    currentStock: { type: Number, default: 0, min: 0 },
    minimumStock: { type: Number, default: 0, min: 0 },
    maximumStock: { type: Number, default: null },
    purchaseCost: { type: Number, default: 0, min: 0 }, // cost per unit
    lastPurchaseCost: { type: Number, default: 0, min: 0 },
    averageCost: { type: Number, default: 0, min: 0 }, // weighted average cost per unit
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', default: null },
    storageLocation: { type: String, trim: true, maxlength: 100 },
    storageCondition: {
      type: String,
      enum: ['room_temperature', 'refrigerated', 'frozen', 'dry_storage', 'other'],
      default: 'room_temperature',
    },
    expiryDate: { type: Date, default: null },
    batchNumber: { type: String, trim: true, maxlength: 50 },
    isPerishable: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

inventoryItemSchema.index({ tenantId: 1, name: 1 }, { unique: true });
inventoryItemSchema.index({ tenantId: 1, sku: 1 }, { unique: true, sparse: true });
inventoryItemSchema.index({ tenantId: 1, categoryId: 1 });
inventoryItemSchema.index({ tenantId: 1, currentStock: 1 });

// Virtual: is stock below minimum?
inventoryItemSchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

// Virtual: stock value
inventoryItemSchema.virtual('stockValue').get(function () {
  return Math.round(this.currentStock * this.averageCost * 100) / 100;
});

inventoryItemSchema.set('toJSON', { virtuals: true });
inventoryItemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
