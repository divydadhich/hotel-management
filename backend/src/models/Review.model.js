const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    foodRating: { type: Number, min: 1, max: 5 },
    serviceRating: { type: Number, min: 1, max: 5 },
    overallRating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
    ownerReply: { type: String, maxlength: 500 },
    ownerRepliedAt: Date,
    isPublished: { type: Boolean, default: true },
    customerName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
