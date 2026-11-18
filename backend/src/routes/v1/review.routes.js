const express = require('express');
const router = express.Router();
const reviewController = require('../../controllers/review.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

// Customer submits review (public)
router.post('/submit', reviewController.submitReview);

// Owner routes (authenticated)
router.get('/', authenticate, resolveTenant, authorize(ROLES.OWNER), reviewController.getReviews);
router.post('/:id/reply', authenticate, resolveTenant, authorize(ROLES.OWNER), reviewController.replyToReview);

module.exports = router;
