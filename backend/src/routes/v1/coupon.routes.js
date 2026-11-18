const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/coupon.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

// Public validation for customer checkout
router.post('/validate', couponController.validateCoupon);

// Owner routes
router.use(authenticate, resolveTenant, authorize(ROLES.OWNER));
router.get('/', couponController.getCoupons);
router.post('/', couponController.createCoupon);
router.delete('/:id', couponController.deleteCoupon);

module.exports = router;
