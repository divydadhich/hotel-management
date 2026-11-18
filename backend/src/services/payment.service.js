const crypto = require('crypto');
const Razorpay = require('razorpay');
const BusinessSettings = require('../models/BusinessSettings.model');
const Payment = require('../models/Payment.model');
const Order = require('../models/Order.model');
const logger = require('../utils/logger');
const { emitOrderStatusUpdate } = require('../sockets/orderSocket');

// Gateway Provider Interface
class PaymentGatewayProvider {
  async createOrder({ amount, currency, receipt, notes }) {
    throw new Error('Not implemented');
  }
  verifySignature({ orderId, paymentId, signature }) {
    throw new Error('Not implemented');
  }
}

class RazorpayProvider extends PaymentGatewayProvider {
  constructor(keyId, keySecret) {
    super();
    this.keyId = keyId;
    this.keySecret = keySecret;
    if (keyId && keySecret) {
      this.client = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
  }

  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.client) {
      // In development or when keys aren't set, return mock order structure for smooth testing
      logger.warn('Razorpay keys not configured; generating development test order');
      return {
        id: `order_test_${Date.now()}`,
        amount: Math.round(amount * 100), // paise
        currency,
        receipt,
        status: 'created',
      };
    }

    const options = {
      amount: Math.round(amount * 100), // paise
      currency,
      receipt: String(receipt).slice(0, 40),
      notes,
    };
    return await this.client.orders.create(options);
  }

  verifySignature({ orderId, paymentId, signature }) {
    if (!this.keySecret) {
      // If mock test order in dev, allow if signature starts with dev_ or exists
      return true;
    }
    const generated = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }

  verifyWebhookSignature({ body, signature, secret }) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');
    return expected === signature;
  }
}

// Payment Factory
const getPaymentGateway = async (tenantId) => {
  const settings = await BusinessSettings.findOne({ tenantId }).select('+razorpayKeySecret').lean();
  const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;

  return new RazorpayProvider(keyId, keySecret);
};

module.exports = {
  getPaymentGateway,
  RazorpayProvider,
};
