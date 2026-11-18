const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { ROLES } = require('../../constants/roles');
const tenantController = require('../../controllers/tenant.controller');
const superAdminController = require('../../controllers/superAdmin.controller');

// All routes require super_admin role
router.use(authenticate, authorize(ROLES.SUPER_ADMIN));

router.get('/stats', superAdminController.getPlatformStats);

// Tenant management
router.get('/tenants', tenantController.listTenants);
router.post('/tenants', tenantController.createTenant);
router.put('/tenants/:tenantId', tenantController.updateTenant);
router.patch('/tenants/:tenantId/status', tenantController.toggleStatus);

// Plan management
router.get('/plans', superAdminController.listPlans);
router.post('/plans', superAdminController.createPlan);
router.put('/plans/:id', superAdminController.updatePlan);
router.delete('/plans/:id', superAdminController.deletePlan);

module.exports = router;
