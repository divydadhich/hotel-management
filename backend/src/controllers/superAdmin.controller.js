const tenantService = require('../services/tenant.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const Tenant = require('../models/Tenant.model');
const Order = require('../models/Order.model');
const User = require('../models/User.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const { ROLES } = require('../constants/roles');

const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalTenants, activeTenants, totalOrders, totalUsers] = await Promise.all([
    Tenant.countDocuments(),
    Tenant.countDocuments({ isActive: true, isSuspended: false }),
    Order.countDocuments(),
    User.countDocuments({ role: { $ne: ROLES.SUPER_ADMIN } }),
  ]);

  return ApiResponse.success(res, {
    totalTenants,
    activeTenants,
    inactiveTenants: totalTenants - activeTenants,
    totalOrders,
    totalUsers,
  }, 'Platform stats fetched');
});

const listPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find().sort({ sortOrder: 1 });
  return ApiResponse.success(res, { plans }, 'Plans fetched');
});

const createPlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.create(req.body);
  return ApiResponse.success(res, { plan }, 'Plan created', 201);
});

const updatePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!plan) return ApiResponse.error(res, 'Plan not found', 404);
  return ApiResponse.success(res, { plan }, 'Plan updated');
});

const deletePlan = asyncHandler(async (req, res) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!plan) return ApiResponse.error(res, 'Plan not found', 404);
  return ApiResponse.success(res, null, 'Plan deactivated');
});

module.exports = { getPlatformStats, listPlans, createPlan, updatePlan, deletePlan };
