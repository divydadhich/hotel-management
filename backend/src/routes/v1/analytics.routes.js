const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analytics.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

router.use(authenticate, resolveTenant, authorize(ROLES.OWNER));

router.get('/summary', analyticsController.getDashboardSummary);
router.get('/revenue', analyticsController.getRevenueAnalytics);

module.exports = router;
