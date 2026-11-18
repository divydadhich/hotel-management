const { getIO } = require('./index');

const emitNewOrder = (tenantId, order) => {
  const io = getIO();
  io.to(`tenant:${tenantId}`).emit('order:new', { order });
  io.to(`kitchen:${tenantId}`).emit('kitchen:new_order', { order });
};

const emitOrderStatusUpdate = (tenantId, orderId, status, order) => {
  const io = getIO();
  io.to(`tenant:${tenantId}`).emit('order:status_updated', { orderId, status, order });
  io.to(`kitchen:${tenantId}`).emit('kitchen:order_updated', { orderId, status, order });
  io.to(`order:${orderId}`).emit('order:status_changed', { orderId, status, order });
};

const emitKitchenNotification = (tenantId, order) => {
  const io = getIO();
  io.to(`kitchen:${tenantId}`).emit('kitchen:notification', { order });
};

module.exports = { emitNewOrder, emitOrderStatusUpdate, emitKitchenNotification };
