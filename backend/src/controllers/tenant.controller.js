const tenantService = require('../services/tenant.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const createTenant = asyncHandler(async (req, res) => {
  const { tenantData, ownerData, planId } = req.body;
  if (!tenantData || !ownerData || !planId) {
    return ApiResponse.error(res, 'tenantData, ownerData, and planId are required', 400);
  }
  const result = await tenantService.createTenant({ tenantData, ownerData, planId });
  return ApiResponse.success(res, result, 'Tenant created successfully', 201);
});

const listTenants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, isActive, isSuspended } = req.query;
  const result = await tenantService.listTenants(
    { search, isActive: isActive !== undefined ? isActive === 'true' : undefined, isSuspended: isSuspended !== undefined ? isSuspended === 'true' : undefined },
    { page, limit }
  );
  return ApiResponse.paginated(res, result.data, result.pagination, 'Tenants fetched');
});

const updateTenant = asyncHandler(async (req, res) => {
  const tenantId = req.params.tenantId || req.tenantId;
  const tenant = await tenantService.updateTenant(tenantId, req.body);
  return ApiResponse.success(res, { tenant }, 'Tenant updated');
});

const toggleStatus = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { isActive, isSuspended } = req.body;
  const tenant = await tenantService.toggleTenantStatus(tenantId, { isActive, isSuspended });
  return ApiResponse.success(res, { tenant }, 'Tenant status updated');
});

const getTenantProfile = asyncHandler(async (req, res) => {
  const Tenant = require('../models/Tenant.model');
  const tenant = await Tenant.findById(req.tenantId).lean();
  if (!tenant) return ApiResponse.error(res, 'Tenant not found', 404);
  return ApiResponse.success(res, { tenant }, 'Profile fetched');
});

module.exports = { createTenant, listTenants, updateTenant, toggleStatus, getTenantProfile };
