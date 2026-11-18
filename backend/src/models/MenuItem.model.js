const mongoose = require('mongoose');

const addonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  isRequired: { type: Boolean, default: false },
}, { _id: true });

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
}, { _id: true });

const menuItemSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    image: { type: String },
    price: { type: Number, required: true, min: 0 },
    discountedPrice: { type: Number, min: 0, default: null },
    isVeg: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true, index: true },
    preparationTime: { type: Number, default: 15 },
    isBestseller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    addons: { type: [addonSchema], default: [] },
    variants: { type: [variantSchema], default: [] },
    tags: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    spiceLevel: { type: String, enum: ['none', 'mild', 'medium', 'hot', 'extra_hot'], default: 'none' },
    calories: { type: Number },
    stockCount: { type: Number, default: null },
  },
  { timestamps: true }
);

menuItemSchema.index({ tenantId: 1, categoryId: 1 });
menuItemSchema.index({ tenantId: 1, isFeatured: 1 });
menuItemSchema.index({ tenantId: 1, isBestseller: 1 });
menuItemSchema.index({ tenantId: 1, name: 'text', description: 'text' });

module.exports = mongoose.model('MenuItem', menuItemSchema);
