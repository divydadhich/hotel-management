const express = require('express');
const router = express.Router();
const tenantController = require('../../controllers/tenant.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

// Owner: get/update own tenant profile & settings
router.get('/me', authenticate, resolveTenant, tenantController.getTenantProfile);
router.put('/me', authenticate, authorize(ROLES.OWNER), resolveTenant, tenantController.updateTenant);

module.exports = router;
