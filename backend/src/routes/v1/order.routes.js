const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/order.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { orderLimiter } = require('../../middleware/rateLimiter.middleware');
const { ROLES } = require('../../constants/roles');

// Authenticated staff/owner routes
router.use(authenticate, resolveTenant);

router.get('/', orderController.getOrders);
router.post('/', orderLimiter, authorize(ROLES.OWNER, ROLES.RECEPTIONIST), orderController.staffPlaceOrder);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/status', authorize(ROLES.OWNER, ROLES.RECEPTIONIST, ROLES.KITCHEN), orderController.updateOrderStatus);
router.patch('/:id/payment', authorize(ROLES.OWNER, ROLES.RECEPTIONIST), orderController.updatePaymentStatus);

module.exports = router;
