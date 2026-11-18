const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    slug: { type: String, lowercase: true, trim: true },
  },
  { timestamps: true }
);

menuCategorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
menuCategorySchema.index({ tenantId: 1, sortOrder: 1 });

module.exports = mongoose.model('MenuCategory', menuCategorySchema);
