const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../constants/orderStatus');

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  image: String,
  price: { type: Number, required: true },
  discountedPrice: Number,
  variant: { name: String, price: Number },
  addons: [{ name: String, price: Number }],
  quantity: { type: Number, required: true, min: 1 },
  specialInstructions: String,
  subtotal: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    orderNumber: { type: String, required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: 'Table' },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TableSession' },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    customerEmail: { type: String, trim: true },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    taxAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    serviceChargeAmount: { type: Number, default: 0 },
    serviceChargeRate: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    paymentMethod: { type: String, enum: ['online', 'cash', 'pay_at_counter'], default: 'online' },
    idempotencyKey: { type: String },
    notes: String,
    estimatedReadyTime: Date,
    servedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, tableId: 1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
