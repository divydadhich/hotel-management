const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    logo: { type: String, default: null },
    coverImage: { type: String, default: null },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, default: 'India' },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    gstNumber: { type: String, trim: true },
    currency: { type: String, default: 'INR' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    isActive: { type: Boolean, default: true, index: true },
    isSuspended: { type: Boolean, default: false },
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    menuBackground: { type: String, default: '#ffffff' },
    fontPreference: { type: String, default: 'Inter' },
    welcomeMessage: { type: String, default: 'Welcome! Scan to order.' },
    customDomain: { type: String, default: null },
    description: { type: String, maxlength: 500 },
    businessType: { type: String, enum: ['restaurant', 'hotel', 'cafe', 'bar', 'other'], default: 'restaurant' },
  },
  { timestamps: true }
);

tenantSchema.index({ name: 'text' });

module.exports = mongoose.model('Tenant', tenantSchema);
