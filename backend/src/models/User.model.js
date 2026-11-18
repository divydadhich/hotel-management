const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../constants/roles');

const refreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  userAgent: String,
  ipAddress: String,
}, { _id: false });

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    avatar: { type: String, default: null },
    phone: { type: String, trim: true },
    refreshTokens: { type: [refreshTokenSchema], default: [] },
    permissions: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Compound unique: email per tenant (null tenantId for super_admin is allowed once)
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { userId: this._id, tenantId: this.tenantId, role: this.role, email: this.email },
    process.env.JWT_SECRET || 'hotel_saas_default_jwt_secret_32_characters_long_key',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { userId: this._id },
    process.env.JWT_REFRESH_SECRET || 'hotel_saas_default_jwt_refresh_secret_32_characters',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
};

userSchema.methods.addRefreshToken = async function (token, options = {}) {
  const hash = await bcrypt.hash(token, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  // Keep max 5 refresh tokens
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens.shift();
  }
  this.refreshTokens.push({ tokenHash: hash, expiresAt, ...options });
  await this.save();
};

userSchema.methods.removeRefreshToken = async function (token) {
  const checks = await Promise.all(
    this.refreshTokens.map(async (rt) => {
      const match = await bcrypt.compare(token, rt.tokenHash);
      return match ? null : rt;
    })
  );
  this.refreshTokens = checks.filter(Boolean);
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
