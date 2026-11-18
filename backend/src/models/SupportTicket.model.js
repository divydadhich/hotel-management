const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: String,
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const supportTicketSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
    subject: { type: String, required: true },
    category: { type: String, enum: ['billing', 'technical', 'feature_request', 'other'], default: 'other' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
    messages: { type: [messageSchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: Date,
  },
  { timestamps: true }
);

supportTicketSchema.index({ tenantId: 1 });
supportTicketSchema.index({ status: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
