const logger = require('../utils/logger');
const Subscription = require('../models/Subscription.model');
const { SUBSCRIPTION_STATUS } = require('../constants/subscriptionStatus');

const checkExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    // Move trial → grace period
    await Subscription.updateMany(
      { status: SUBSCRIPTION_STATUS.TRIAL, trialEndsAt: { $lt: now } },
      { $set: { status: SUBSCRIPTION_STATUS.GRACE_PERIOD, gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }
    );
    // Move grace period → expired
    await Subscription.updateMany(
      { status: SUBSCRIPTION_STATUS.GRACE_PERIOD, gracePeriodEndsAt: { $lt: now } },
      { $set: { status: SUBSCRIPTION_STATUS.EXPIRED } }
    );
    // Move active → grace period
    await Subscription.updateMany(
      { status: SUBSCRIPTION_STATUS.ACTIVE, endDate: { $lt: now } },
      { $set: { status: SUBSCRIPTION_STATUS.GRACE_PERIOD, gracePeriodEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }
    );
    logger.info('Subscription expiry verification check completed');
  } catch (err) {
    logger.error(`Subscription expiry job error: ${err.message}`);
  }
};

const startSubscriptionExpiryJob = () => {
  const INTERVAL_MS = 6 * 60 * 60 * 1000; // Every 6 hours
  checkExpiredSubscriptions();
  setInterval(checkExpiredSubscriptions, INTERVAL_MS);
  logger.info('Subscription expiry background job initialized');
};

module.exports = { startSubscriptionExpiryJob };
