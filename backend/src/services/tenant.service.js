const Tenant = require('../models/Tenant.model');
const User = require('../models/User.model');
const Subscription = require('../models/Subscription.model');
const SubscriptionPlan = require('../models/SubscriptionPlan.model');
const BusinessSettings = require('../models/BusinessSettings.model');
const authService = require('./auth.service');
const { ROLES } = require('../constants/roles');
const { SUBSCRIPTION_STATUS } = require('../constants/subscriptionStatus');

const createTenant = async ({ tenantData, ownerData, planId }) => {
  // Check slug uniqueness
  const existing = await Tenant.findOne({ slug: tenantData.slug });
  if (existing) throw Object.assign(new Error('Business slug already taken'), { statusCode: 409 });

  // Find plan
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw Object.assign(new Error('Subscription plan not found'), { statusCode: 404 });

  // Create tenant
  const tenant = await Tenant.create(tenantData);

  // Create owner user
  const owner = await authService.register({
    name: ownerData.name,
    email: ownerData.email,
    password: ownerData.password,
    role: ROLES.OWNER,
    tenantId: tenant._id,
    phone: ownerData.phone,
  });

  // Create trial subscription
  const trialEndsAt = new Date(Date.now() + (plan.trialDays || 14) * 24 * 60 * 60 * 1000);
  await Subscription.create({
    tenantId: tenant._id,
    planId: plan._id,
    status: SUBSCRIPTION_STATUS.TRIAL,
    trialEndsAt,
    endDate: trialEndsAt,
  });

  // Create default business settings
  await BusinessSettings.create({ tenantId: tenant._id });

  return { tenant, owner };
};

const getTenantBySlug = async (slug) => {
  return Tenant.findOne({ slug, isActive: true }).lean();
};

const listTenants = async (filters = {}, options = {}) => {
  const { paginate } = require('../utils/pagination');
  const query = {};
  if (filters.search) query.$text = { $search: filters.search };
  if (filters.isActive !== undefined) query.isActive = filters.isActive;
  if (filters.isSuspended !== undefined) query.isSuspended = filters.isSuspended;

  return paginate(Tenant, query, options);
};

const updateTenant = async (tenantId, data) => {
  const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: data }, { new: true, runValidators: true });
  if (!tenant) throw Object.assign(new Error('Tenant not found'), { statusCode: 404 });
  return tenant;
};

const toggleTenantStatus = async (tenantId, { isActive, isSuspended }) => {
  const update = {};
  if (isActive !== undefined) update.isActive = isActive;
  if (isSuspended !== undefined) update.isSuspended = isSuspended;
  return Tenant.findByIdAndUpdate(tenantId, { $set: update }, { new: true });
};

module.exports = { createTenant, getTenantBySlug, listTenants, updateTenant, toggleTenantStatus };
