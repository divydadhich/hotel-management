const express = require('express');
const router = express.Router();
const asyncHandler = require('../../middleware/asyncHandler');
const ApiResponse = require('../../utils/apiResponse');
const Tenant = require('../../models/Tenant.model');
const Table = require('../../models/Table.model');
const MenuCategory = require('../../models/MenuCategory.model');
const MenuItem = require('../../models/MenuItem.model');
const BusinessSettings = require('../../models/BusinessSettings.model');
const orderController = require('../../controllers/order.controller');
const { orderLimiter } = require('../../middleware/rateLimiter.middleware');

// GET /public/menu/:slug — public restaurant menu
router.get('/menu/:slug', asyncHandler(async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!tenant) return ApiResponse.error(res, 'Restaurant not found', 404);
  if (tenant.isSuspended) return ApiResponse.error(res, 'This restaurant is currently unavailable', 403);

  const [categories, settings] = await Promise.all([
    MenuCategory.find({ tenantId: tenant._id, isActive: true }).sort({ sortOrder: 1 }).lean(),
    BusinessSettings.findOne({ tenantId: tenant._id }).lean(),
  ]);

  const categoryIds = categories.map(c => c._id);
  const items = await MenuItem.find({
    tenantId: tenant._id,
    categoryId: { $in: categoryIds },
    isAvailable: true,
  }).sort({ sortOrder: 1 }).lean();

  // Group items by category
  const itemsByCategory = {};
  items.forEach(item => {
    const catId = item.categoryId.toString();
    if (!itemsByCategory[catId]) itemsByCategory[catId] = [];
    itemsByCategory[catId].push(item);
  });

  const menu = categories.map(cat => ({
    ...cat,
    items: itemsByCategory[cat._id.toString()] || [],
  }));

  return ApiResponse.success(res, {
    tenant: {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      logo: tenant.logo,
      coverImage: tenant.coverImage,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      menuBackground: tenant.menuBackground,
      welcomeMessage: tenant.welcomeMessage,
      currency: tenant.currency,
      description: tenant.description,
    },
    menu,
    settings: {
      enableOnlinePayment: settings?.enableOnlinePayment,
      enableCashPayment: settings?.enableCashPayment,
      enablePayAtCounter: settings?.enablePayAtCounter,
      taxRate: settings?.taxRate || 0,
      taxName: settings?.taxName || 'GST',
      serviceChargeRate: settings?.serviceChargeRate || 0,
      serviceChargeName: settings?.serviceChargeName || 'Service Charge',
      enableReviews: settings?.enableReviews !== false,
      enableCoupons: settings?.enableCoupons || false,
    },
  }, 'Menu fetched');
}));

// GET /public/menu/:slug/table/:token — verify table QR token
router.get('/menu/:slug/table/:token', asyncHandler(async (req, res) => {
  const tenant = await Tenant.findOne({ slug: req.params.slug, isActive: true }).lean();
  if (!tenant) return ApiResponse.error(res, 'Restaurant not found', 404);

  const table = await Table.findOne({
    tenantId: tenant._id,
    token: req.params.token,
    isActive: true,
  }).lean();
  if (!table) return ApiResponse.error(res, 'Invalid or expired table QR code', 404);

  return ApiResponse.success(res, {
    tenantId: tenant._id,
    table: {
      id: table._id,
      number: table.number,
      label: table.label,
      capacity: table.capacity,
      status: table.status,
    },
  }, 'Table verified');
}));

// POST /public/orders — customer places order
router.post('/orders', orderLimiter, orderController.publicPlaceOrder);

// GET /public/orders/:orderId/status — customer tracks order status
router.get('/orders/:orderId/status', orderController.getPublicOrderStatus);

module.exports = router;
