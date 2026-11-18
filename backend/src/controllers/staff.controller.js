const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { ROLES } = require('../constants/roles');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const getStaff = asyncHandler(async (req, res) => {
  const staff = await User.find({
    tenantId: req.tenantId,
    role: { $in: [ROLES.RECEPTIONIST, ROLES.KITCHEN] },
  })
    .select('-passwordHash -refreshTokens')
    .sort({ createdAt: -1 })
    .lean();

  return ApiResponse.success(res, { staff }, 'Staff members fetched');
});

const createStaff = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    return ApiResponse.error(res, 'Name, email, password, and role are required', 400);
  }

  if (![ROLES.RECEPTIONIST, ROLES.KITCHEN].includes(role)) {
    return ApiResponse.error(res, 'Role must be receptionist or kitchen', 400);
  }

  const existing = await User.findOne({ tenantId: req.tenantId, email: email.toLowerCase().trim() });
  if (existing) {
    return ApiResponse.error(res, 'A staff member with this email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    tenantId: req.tenantId,
    name,
    email: email.toLowerCase().trim(),
    passwordHash,
    role,
    phone,
  });

  return ApiResponse.success(res, {
    staff: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone },
  }, 'Staff member created', 201);
});

const updateStaff = asyncHandler(async (req, res) => {
  const { name, phone, isActive, role, password } = req.body;
  const update = {};
  if (name) update.name = name;
  if (phone !== undefined) update.phone = phone;
  if (isActive !== undefined) update.isActive = isActive;
  if (role && [ROLES.RECEPTIONIST, ROLES.KITCHEN].includes(role)) update.role = role;

  if (password) {
    update.passwordHash = await bcrypt.hash(password, 12);
  }

  const staff = await User.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId, role: { $in: [ROLES.RECEPTIONIST, ROLES.KITCHEN] } },
    { $set: update },
    { new: true }
  ).select('-passwordHash -refreshTokens');

  if (!staff) return ApiResponse.error(res, 'Staff member not found', 404);
  return ApiResponse.success(res, { staff }, 'Staff member updated');
});

const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOneAndDelete({
    _id: req.params.id,
    tenantId: req.tenantId,
    role: { $in: [ROLES.RECEPTIONIST, ROLES.KITCHEN] },
  });

  if (!staff) return ApiResponse.error(res, 'Staff member not found', 404);
  return ApiResponse.success(res, null, 'Staff member deleted');
});

module.exports = {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
};
