const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    contactPerson: { type: String, trim: true, maxlength: 100 },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 20 },
    alternatePhone: { type: String, trim: true, maxlength: 20 },
    address: { type: String, trim: true, maxlength: 500 },
    city: { type: String, trim: true, maxlength: 100 },
    state: { type: String, trim: true, maxlength: 100 },
    gstNumber: { type: String, trim: true, maxlength: 20 },
    panNumber: { type: String, trim: true, maxlength: 15 },
    bankDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true },
    },
    paymentTerms: { type: String, trim: true, maxlength: 200 }, // e.g. "Net 30"
    rating: { type: Number, default: 0, min: 0, max: 5 },
    isActive: { type: Boolean, default: true },
    notes: { type: String, trim: true, maxlength: 500 },
    suppliedCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InventoryCategory' }],
  },
  { timestamps: true }
);

supplierSchema.index({ tenantId: 1, name: 1 }, { unique: true });
supplierSchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
