const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/super', require('./superAdmin.routes'));
router.use('/tenants', require('./tenant.routes'));
router.use('/menu', require('./menu.routes'));
router.use('/tables', require('./table.routes'));
router.use('/orders', require('./order.routes'));
router.use('/payments', require('./payment.routes'));
router.use('/reviews', require('./review.routes'));
router.use('/staff', require('./staff.routes'));
router.use('/coupons', require('./coupon.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/public', require('./public.routes'));

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Restaurant & Hotel SaaS Multi-tenant API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

module.exports = router;
