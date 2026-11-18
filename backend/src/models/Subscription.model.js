const mongoose = require('mongoose');
const { SUBSCRIPTION_STATUS } = require('../constants/subscriptionStatus');

const paymentHistorySchema = new mongoose.Schema({
  amount: Number,
  paidAt: Date,
  gateway: String,
  transactionId: String,
  plan: String,
}, { _id: false });

const subscriptionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, unique: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    status: { type: String, enum: Object.values(SUBSCRIPTION_STATUS), default: SUBSCRIPTION_STATUS.TRIAL, index: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    trialEndsAt: { type: Date },
    gracePeriodEndsAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    paymentHistory: { type: [paymentHistorySchema], default: [] },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

subscriptionSchema.index({ tenantId: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
