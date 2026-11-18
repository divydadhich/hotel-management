const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const BusinessSettings = require('../models/BusinessSettings.model');
const { getPaymentGateway } = require('../services/payment.service');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { emitOrderStatusUpdate } = require('../sockets/orderSocket');

// 1. Create Gateway Order for online payment
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return ApiResponse.error(res, 'Order ID is required', 400);

  const order = await Order.findById(orderId);
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  if (order.paymentStatus === 'paid') {
    return ApiResponse.error(res, 'This order is already paid', 400);
  }

  const gateway = await getPaymentGateway(order.tenantId);
  const gatewayOrder = await gateway.createOrder({
    amount: order.grandTotal,
    currency: 'INR',
    receipt: order.orderNumber,
    notes: {
      tenantId: order.tenantId.toString(),
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  });

  // Record payment attempt
  await Payment.create({
    tenantId: order.tenantId,
    orderId: order._id,
    amount: order.grandTotal,
    gateway: 'razorpay',
    gatewayOrderId: gatewayOrder.id,
    status: 'pending',
  });

  const settings = await BusinessSettings.findOne({ tenantId: order.tenantId }).lean();
  const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';

  return ApiResponse.success(res, {
    gatewayOrderId: gatewayOrder.id,
    amount: gatewayOrder.amount,
    currency: gatewayOrder.currency,
    keyId,
    orderId: order._id,
    orderNumber: order.orderNumber,
    grandTotal: order.grandTotal,
  }, 'Payment order created');
});

// 2. Verify signature & confirm payment
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
    return ApiResponse.error(res, 'Missing payment verification parameters', 400);
  }

  const order = await Order.findById(orderId);
  if (!order) return ApiResponse.error(res, 'Order not found', 404);

  const gateway = await getPaymentGateway(order.tenantId);
  const isValid = gateway.verifySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    await Payment.findOneAndUpdate(
      { orderId: order._id, gatewayOrderId: razorpayOrderId },
      { $set: { status: 'failed', gatewayPaymentId: razorpayPaymentId } }
    );
    return ApiResponse.error(res, 'Payment verification failed: invalid signature', 400);
  }

  // Update payment record
  await Payment.findOneAndUpdate(
    { orderId: order._id, gatewayOrderId: razorpayOrderId },
    {
      $set: {
        status: 'captured',
        gatewayPaymentId: razorpayPaymentId,
        gatewaySignature: razorpaySignature,
      },
    },
    { upsert: true }
  );

  // Update order status
  order.paymentStatus = 'paid';
  if (order.status === 'pending') {
    order.status = 'accepted';
  }
  await order.save();

  const populated = await Order.findById(order._id).populate('tableId', 'number label').lean();
  emitOrderStatusUpdate(order.tenantId, order._id, order.status, populated);

  return ApiResponse.success(res, { order: populated }, 'Payment verified and order confirmed');
});

// 3. Webhook listener (Razorpay server-to-server)
const handleWebhook = asyncHandler(async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-razorpay-signature'];

  if (secret && signature) {
    const gateway = new (require('../services/payment.service').RazorpayProvider)();
    const isValid = gateway.verifyWebhookSignature({
      body: req.body,
      signature,
      secret,
    });
    if (!isValid) {
      return res.status(400).json({ status: 'invalid signature' });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload?.payment?.entity;

  if (event === 'payment.captured' && payload) {
    const orderId = payload.notes?.orderId;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        if (order.status === 'pending') order.status = 'accepted';
        await order.save();

        await Payment.findOneAndUpdate(
          { orderId: order._id },
          { $set: { status: 'captured', gatewayPaymentId: payload.id, webhookVerified: true } },
          { upsert: true }
        );

        emitOrderStatusUpdate(order.tenantId, order._id, order.status, order);
      }
    }
  }

  return res.status(200).json({ status: 'ok' });
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook,
};
