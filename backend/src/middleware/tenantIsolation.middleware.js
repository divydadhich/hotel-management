const { ROLES } = require('../constants/roles');
const Tenant = require('../models/Tenant.model');
const ApiResponse = require('../utils/apiResponse');

// Attach tenantId to req from the authenticated user's JWT (never from frontend body)
const resolveTenant = async (req, res, next) => {
  try {
    if (!req.user) return ApiResponse.error(res, 'Authentication required', 401);

    if (req.user.role === ROLES.SUPER_ADMIN) {
      // Super admin can target any tenant via param or body
      const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
      if (tenantId) {
        const tenant = await Tenant.findById(tenantId).lean();
        if (!tenant) return ApiResponse.error(res, 'Tenant not found', 404);
        req.tenantId = tenantId;
        req.tenant = tenant;
      }
      return next();
    }

    // For all other roles, tenantId MUST come from their JWT
    if (!req.user.tenantId) {
      return ApiResponse.error(res, 'Tenant context required', 403);
    }

    const tenant = await Tenant.findById(req.user.tenantId).lean();
    if (!tenant) return ApiResponse.error(res, 'Your business account was not found', 404);
    if (!tenant.isActive) return ApiResponse.error(res, 'Your business account is inactive', 403);
    if (tenant.isSuspended) return ApiResponse.error(res, 'Your business account has been suspended', 403);

    req.tenantId = req.user.tenantId.toString();
    req.tenant = tenant;
    next();
  } catch (err) {
    next(err);
  }
};

// Ensure any tenantId in the request body or params matches the resolved tenantId
const enforceTenantMatch = (req, res, next) => {
  const bodyTenantId = req.body.tenantId;
  const paramTenantId = req.params.tenantId;

  if (bodyTenantId && req.tenantId && bodyTenantId.toString() !== req.tenantId.toString()) {
    return ApiResponse.error(res, 'Tenant mismatch detected', 403);
  }
  if (paramTenantId && req.tenantId && paramTenantId.toString() !== req.tenantId.toString()) {
    if (req.user.role !== ROLES.SUPER_ADMIN) {
      return ApiResponse.error(res, 'Tenant mismatch detected', 403);
    }
  }
  next();
};

module.exports = { resolveTenant, enforceTenantMatch };
