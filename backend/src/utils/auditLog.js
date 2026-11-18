const AuditLog = require('../models/AuditLog.model');
const logger = require('./logger');

const logAction = async ({ tenantId = null, userId, action, resource, resourceId, oldValues, newValues, req }) => {
  try {
    await AuditLog.create({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      oldValues,
      newValues,
      ipAddress: req?.ip,
      userAgent: req?.get('user-agent'),
    });
  } catch (err) {
    logger.error(`Failed to write audit log: ${err.message}`);
  }
};

module.exports = { logAction };
