const Coupon = require('../models/Coupon.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

// Owner lists coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).lean();
  return ApiResponse.success(res, { coupons }, 'Coupons fetched');
});

// Owner creates coupon
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, validUntil } = req.body;

  if (!code || !discountType || discountValue === undefined) {
    return ApiResponse.error(res, 'Code, discount type, and value are required', 400);
  }

  const existing = await Coupon.findOne({ tenantId: req.tenantId, code: code.toUpperCase().trim() });
  if (existing) {
    return ApiResponse.error(res, 'Coupon code already exists', 409);
  }

  const coupon = await Coupon.create({
    tenantId: req.tenantId,
    code: code.toUpperCase().trim(),
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount: maxDiscount || undefined,
    usageLimit: usageLimit || null,
    validUntil: validUntil ? new Date(validUntil) : null,
  });

  return ApiResponse.success(res, { coupon }, 'Coupon created', 201);
});

// Owner deletes coupon
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!coupon) return ApiResponse.error(res, 'Coupon not found', 404);
  return ApiResponse.success(res, null, 'Coupon deleted');
});

// Customer validates coupon (Public or authenticated)
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, tenantId, orderAmount } = req.body;

  if (!code || !tenantId) {
    return ApiResponse.error(res, 'Code and tenantId are required', 400);
  }

  const coupon = await Coupon.findOne({
    tenantId,
    code: code.toUpperCase().trim(),
    isActive: true,
  });

  if (!coupon) return ApiResponse.error(res, 'Invalid coupon code', 404);

  if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) {
    return ApiResponse.error(res, 'Coupon has expired', 400);
  }

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return ApiResponse.error(res, 'Coupon usage limit reached', 400);
  }

  const subtotal = Number(orderAmount) || 0;
  if (subtotal < (coupon.minOrderAmount || 0)) {
    return ApiResponse.error(res, `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}`, 400);
  }

  let discount = 0;
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return ApiResponse.success(res, {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: Math.round(discount),
  }, 'Coupon applied successfully');
});

module.exports = {
  getCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon,
};
