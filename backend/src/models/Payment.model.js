const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    gateway: { type: String, enum: ['razorpay', 'cash', 'manual'], required: true },
    gatewayOrderId: String,
    gatewayPaymentId: String,
    gatewaySignature: String,
    status: { type: String, enum: ['pending', 'captured', 'failed', 'refunded'], default: 'pending' },
    method: String,
    refundId: String,
    refundAmount: Number,
    metadata: { type: mongoose.Schema.Types.Mixed },
    webhookVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

paymentSchema.index({ tenantId: 1, orderId: 1 });
paymentSchema.index({ gatewayPaymentId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema);
