const Review = require('../models/Review.model');
const Order = require('../models/Order.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { paginate } = require('../utils/pagination');

// Customer submits review (public or authenticated)
const submitReview = asyncHandler(async (req, res) => {
  const { orderId, overallRating, foodRating, serviceRating, comment, customerName } = req.body;

  if (!orderId || !overallRating) {
    return ApiResponse.error(res, 'Order ID and overall rating (1-5) are required', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  // Validate eligible order status
  if (!['served', 'completed'].includes(order.status)) {
    return ApiResponse.error(res, 'Reviews can only be submitted for served or completed orders', 400);
  }

  // Prevent duplicate review for the same order
  const existing = await Review.findOne({ orderId: order._id });
  if (existing) {
    return ApiResponse.error(res, 'A review has already been submitted for this order', 409);
  }

  const review = await Review.create({
    tenantId: order.tenantId,
    orderId: order._id,
    overallRating: Math.min(5, Math.max(1, Number(overallRating))),
    foodRating: foodRating ? Math.min(5, Math.max(1, Number(foodRating))) : undefined,
    serviceRating: serviceRating ? Math.min(5, Math.max(1, Number(serviceRating))) : undefined,
    comment: comment?.trim(),
    customerName: customerName || order.customerName || 'Anonymous Guest',
  });

  return ApiResponse.success(res, { review }, 'Thank you for your review!', 201);
});

// Owner gets reviews list & stats
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, minRating } = req.query;
  const query = { tenantId: req.tenantId };
  if (minRating) query.overallRating = { $gte: Number(minRating) };

  const [result, stats] = await Promise.all([
    paginate(Review, query, { page, limit, sort: { createdAt: -1 } }),
    Review.aggregate([
      { $match: { tenantId: req.tenantId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$overallRating' },
          totalReviews: { $sum: 1 },
          fiveStar: { $sum: { $cond: [{ $eq: ['$overallRating', 5] }, 1, 0] } },
          fourStar: { $sum: { $cond: [{ $eq: ['$overallRating', 4] }, 1, 0] } },
          threeStar: { $sum: { $cond: [{ $eq: ['$overallRating', 3] }, 1, 0] } },
          twoStar: { $sum: { $cond: [{ $eq: ['$overallRating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$overallRating', 1] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const summary = stats[0] || {
    avgRating: 0,
    totalReviews: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
  };

  return ApiResponse.paginated(
    res,
    { reviews: result.data, summary },
    result.pagination,
    'Reviews fetched'
  );
});

// Owner responds to a review
const replyToReview = asyncHandler(async (req, res) => {
  const { reply } = req.body;
  if (!reply) return ApiResponse.error(res, 'Reply message is required', 400);

  const review = await Review.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!review) return ApiResponse.error(res, 'Review not found', 404);

  review.ownerReply = reply.trim();
  review.ownerRepliedAt = new Date();
  await review.save();

  return ApiResponse.success(res, { review }, 'Reply posted');
});

module.exports = {
  submitReview,
  getReviews,
  replyToReview,
};
