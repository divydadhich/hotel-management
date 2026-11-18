const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String },
    monthlyPrice: { type: Number, required: true, default: 0 },
    yearlyPrice: { type: Number, default: 0 },
    features: { type: [String], default: [] },
    limits: {
      maxTables: { type: Number, default: 5 },
      maxStaff: { type: Number, default: 2 },
      maxMenuItems: { type: Number, default: 30 },
      maxCategories: { type: Number, default: 5 },
    },
    isActive: { type: Boolean, default: true },
    isPublic: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    trialDays: { type: Number, default: 14 },
    color: { type: String, default: '#6366f1' },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
