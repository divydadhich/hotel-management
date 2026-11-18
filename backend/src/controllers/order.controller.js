const Order = require('../models/Order.model');
const MenuItem = require('../models/MenuItem.model');
const Table = require('../models/Table.model');
const TableSession = require('../models/TableSession.model');
const BusinessSettings = require('../models/BusinessSettings.model');
const Coupon = require('../models/Coupon.model');
const Customer = require('../models/Customer.model');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../constants/orderStatus');
const { emitNewOrder, emitOrderStatusUpdate } = require('../sockets/orderSocket');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { paginate } = require('../utils/pagination');

// Helper to generate readable sequential-like order number
const generateOrderNumber = async (tenantId) => {
  const count = await Order.countDocuments({ tenantId });
  const prefix = 'ORD';
  const num = (count + 1).toString().padStart(4, '0');
  return `${prefix}-${num}`;
};

// Customer or Staff places order
const placeOrder = async ({
  tenantId,
  tableId,
  items: requestItems,
  customerName,
  customerPhone,
  customerEmail,
  couponCode,
  paymentMethod = 'online',
  idempotencyKey,
  notes,
}) => {
  // Idempotency check
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ tenantId, idempotencyKey }).lean();
    if (existingOrder) return existingOrder;
  }

  if (!requestItems || requestItems.length === 0) {
    throw Object.assign(new Error('Cart cannot be empty'), { statusCode: 400 });
  }

  // Verify Table
  const table = await Table.findOne({ _id: tableId, tenantId }).lean();
  if (!table) {
    throw Object.assign(new Error('Invalid table'), { statusCode: 400 });
  }

  // Fetch actual menu items from DB (NEVER trust frontend prices!)
  const itemIds = requestItems.map(i => i.menuItemId);
  const dbItems = await MenuItem.find({
    _id: { $in: itemIds },
    tenantId,
  }).lean();

  const itemMap = new Map(dbItems.map(i => [i._id.toString(), i]));

  // Validate items & calculate immutable price snapshots
  let subtotal = 0;
  const processedItems = [];

  for (const reqItem of requestItems) {
    const dbItem = itemMap.get(reqItem.menuItemId);
    if (!dbItem) {
      throw Object.assign(new Error(`Item not found: ${reqItem.name || reqItem.menuItemId}`), { statusCode: 400 });
    }
    if (!dbItem.isAvailable) {
      throw Object.assign(new Error(`Item is currently unavailable: ${dbItem.name}`), { statusCode: 400 });
    }

    const qty = Math.max(1, parseInt(reqItem.quantity) || 1);
    let basePrice = dbItem.discountedPrice || dbItem.price;

    // Handle variant pricing
    let selectedVariant = null;
    if (reqItem.variant && reqItem.variant.name) {
      const matchVariant = dbItem.variants?.find(v => v.name === reqItem.variant.name);
      if (matchVariant) {
        basePrice = matchVariant.price;
        selectedVariant = { name: matchVariant.name, price: matchVariant.price };
      }
    }

    // Handle add-ons
    let addonsTotal = 0;
    const selectedAddons = [];
    if (Array.isArray(reqItem.addons)) {
      for (const addon of reqItem.addons) {
        const matchAddon = dbItem.addons?.find(a => a.name === addon.name);
        if (matchAddon) {
          addonsTotal += matchAddon.price;
          selectedAddons.push({ name: matchAddon.name, price: matchAddon.price });
        }
      }
    }

    const unitPrice = basePrice + addonsTotal;
    const itemSubtotal = unitPrice * qty;
    subtotal += itemSubtotal;

    processedItems.push({
      menuItemId: dbItem._id,
      name: dbItem.name,
      image: dbItem.image,
      price: unitPrice,
      discountedPrice: dbItem.discountedPrice,
      variant: selectedVariant,
      addons: selectedAddons,
      quantity: qty,
      specialInstructions: reqItem.specialInstructions || '',
      subtotal: itemSubtotal,
    });
  }

  // Fetch Business Settings for taxes & service charge
  const settings = await BusinessSettings.findOne({ tenantId }).lean();
  const taxRate = settings?.taxRate || 0;
  const serviceChargeRate = settings?.serviceChargeRate || 0;

  // Calculate discounts if coupon provided
  let discountAmount = 0;
  let appliedCouponCode = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      tenantId,
      code: couponCode.toUpperCase().trim(),
      isActive: true,
      validFrom: { $lte: new Date() },
      $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }],
    });

    if (coupon) {
      if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
        if (subtotal >= (coupon.minOrderAmount || 0)) {
          if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
              discountAmount = coupon.maxDiscount;
            }
          } else {
            discountAmount = Math.min(coupon.discountValue, subtotal);
          }
          appliedCouponCode = coupon.code;
          coupon.usedCount += 1;
          await coupon.save();
        }
      }
    }
  }

  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
  const serviceChargeAmount = parseFloat(((taxableAmount * serviceChargeRate) / 100).toFixed(2));
  const grandTotal = Math.round(taxableAmount + taxAmount + serviceChargeAmount);

  // Table session handling
  let session = await TableSession.findOne({ tenantId, tableId, isActive: true });
  if (!session) {
    session = await TableSession.create({
      tenantId,
      tableId,
      customerCount: 1,
      totalOrders: 1,
      totalAmount: grandTotal,
    });
  } else {
    session.totalOrders += 1;
    session.totalAmount += grandTotal;
    await session.save();
  }

  // Update table status to occupied or order_pending
  await Table.findByIdAndUpdate(tableId, { status: 'occupied' });

  // Update or create customer record if phone or email provided
  if (customerPhone || customerEmail) {
    const custFilter = { tenantId };
    if (customerPhone) custFilter.phone = customerPhone;
    else custFilter.email = customerEmail;

    await Customer.findOneAndUpdate(
      custFilter,
      {
        $set: { name: customerName || 'Guest Customer', lastOrderAt: new Date() },
        $inc: { orderCount: 1, totalSpent: grandTotal },
      },
      { upsert: true }
    );
  }

  const orderNumber = await generateOrderNumber(tenantId);

  const order = await Order.create({
    tenantId,
    orderNumber,
    tableId,
    sessionId: session._id,
    customerName: customerName || 'Guest',
    customerPhone,
    customerEmail,
    items: processedItems,
    subtotal,
    discountAmount,
    couponCode: appliedCouponCode,
    taxRate,
    taxAmount,
    serviceChargeRate,
    serviceChargeAmount,
    grandTotal,
    status: ORDER_STATUS.PENDING,
    paymentStatus: paymentMethod === 'cash' || paymentMethod === 'pay_at_counter' ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
    paymentMethod,
    idempotencyKey,
    notes,
  });

  const populatedOrder = await Order.findById(order._id).populate('tableId', 'number label').lean();

  // Real-time broadcast
  emitNewOrder(tenantId, populatedOrder);

  return populatedOrder;
};

// CONTROLLER HANDLERS

// Public Order Placement (from QR customer menu)
const publicPlaceOrder = asyncHandler(async (req, res) => {
  const { tenantId, tableId, items, customerName, customerPhone, customerEmail, couponCode, paymentMethod, idempotencyKey, notes } = req.body;
  if (!tenantId || !tableId) {
    return ApiResponse.error(res, 'Tenant and Table are required', 400);
  }

  const order = await placeOrder({
    tenantId,
    tableId,
    items,
    customerName,
    customerPhone,
    customerEmail,
    couponCode,
    paymentMethod,
    idempotencyKey,
    notes,
  });

  return ApiResponse.success(res, { order }, 'Order placed successfully', 201);
});

// Authenticated staff place order
const staffPlaceOrder = asyncHandler(async (req, res) => {
  const { tableId, items, customerName, customerPhone, paymentMethod, notes } = req.body;
  const order = await placeOrder({
    tenantId: req.tenantId,
    tableId,
    items,
    customerName,
    customerPhone,
    paymentMethod,
    notes,
  });
  return ApiResponse.success(res, { order }, 'Order placed successfully', 201);
});

// List orders for staff/owner
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, tableId, startDate, endDate, search } = req.query;
  const query = { tenantId: req.tenantId };

  if (status) query.status = status;
  if (tableId) query.tableId = tableId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { customerPhone: { $regex: search, $options: 'i' } },
    ];
  }

  const result = await paginate(Order, query, {
    page,
    limit,
    sort: { createdAt: -1 },
  });

  // Populate table numbers
  const tableIds = [...new Set(result.data.map(o => o.tableId).filter(Boolean))];
  const tables = await Table.find({ _id: { $in: tableIds } }).select('number label').lean();
  const tableMap = new Map(tables.map(t => [t._id.toString(), t]));

  result.data = result.data.map(o => ({
    ...o,
    table: o.tableId ? tableMap.get(o.tableId.toString()) : null,
  }));

  return ApiResponse.paginated(res, result.data, result.pagination, 'Orders fetched');
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('tableId', 'number label capacity')
    .lean();
  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  return ApiResponse.success(res, { order }, 'Order fetched');
});

// Update order status (Staff / Kitchen)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, estimatedReadyTime } = req.body;
  if (!Object.values(ORDER_STATUS).includes(status)) {
    return ApiResponse.error(res, 'Invalid order status', 400);
  }

  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  const prevStatus = order.status;
  order.status = status;

  if (estimatedReadyTime) {
    order.estimatedReadyTime = new Date(estimatedReadyTime);
  }
  if (status === ORDER_STATUS.SERVED && !order.servedAt) {
    order.servedAt = new Date();
  }
  if (status === ORDER_STATUS.COMPLETED && !order.completedAt) {
    order.completedAt = new Date();
    // Also mark payment as paid if cash/pay at counter was pending
    if (order.paymentStatus === PAYMENT_STATUS.PENDING && (order.paymentMethod === 'cash' || order.paymentMethod === 'pay_at_counter')) {
      order.paymentStatus = PAYMENT_STATUS.PAID;
    }
  }

  await order.save();

  const populated = await Order.findById(order._id).populate('tableId', 'number label').lean();

  // Socket notification
  emitOrderStatusUpdate(req.tenantId, order._id, status, populated);

  return ApiResponse.success(res, { order: populated }, `Order status updated to ${status}`);
});

// Update payment status (e.g. receptionist collecting cash at table or counter)
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body;
  if (!Object.values(PAYMENT_STATUS).includes(paymentStatus)) {
    return ApiResponse.error(res, 'Invalid payment status', 400);
  }

  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  order.paymentStatus = paymentStatus;
  await order.save();

  return ApiResponse.success(res, { order }, `Payment status updated to ${paymentStatus}`);
});

// Public customer check order status
const getPublicOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId)
    .select('orderNumber status paymentStatus grandTotal items createdAt estimatedReadyTime')
    .lean();
  if (!order) return ApiResponse.error(res, 'Order not found', 404);
  return ApiResponse.success(res, { order }, 'Status fetched');
});

module.exports = {
  placeOrder,
  publicPlaceOrder,
  staffPlaceOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  getPublicOrderStatus,
};
