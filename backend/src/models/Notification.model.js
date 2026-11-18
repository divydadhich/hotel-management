const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed },
    link: String,
  },
  { timestamps: true }
);

notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
