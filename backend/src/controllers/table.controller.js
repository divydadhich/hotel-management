const crypto = require('crypto');
const QRCode = require('qrcode');
const Table = require('../models/Table.model');
const TableSession = require('../models/TableSession.model');
const Tenant = require('../models/Tenant.model');
const Order = require('../models/Order.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

const generateQR = async (frontendUrl, slug, token) => {
  const url = `${frontendUrl}/menu/${slug}/table/${token}`;
  const qrCodeUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  return { url, qrCodeUrl };
};

const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find({ tenantId: req.tenantId }).sort({ number: 1 }).lean();
  return ApiResponse.success(res, { tables }, 'Tables fetched');
});

const createTable = asyncHandler(async (req, res) => {
  const { number, label, capacity, description } = req.body;
  if (!number) return ApiResponse.error(res, 'Table number is required', 400);

  const existing = await Table.findOne({ tenantId: req.tenantId, number });
  if (existing) return ApiResponse.error(res, `Table ${number} already exists`, 409);

  const tenant = await Tenant.findById(req.tenantId).lean();
  const token = crypto.randomBytes(24).toString('hex');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { url, qrCodeUrl } = await generateQR(frontendUrl, tenant.slug, token);

  const table = await Table.create({
    tenantId: req.tenantId,
    number,
    label: label || `Table ${number}`,
    capacity: capacity || 4,
    description,
    token,
    qrCodeData: url,
    qrCodeUrl,
    status: 'available',
  });

  return ApiResponse.success(res, { table }, 'Table created', 201);
});

const updateTable = asyncHandler(async (req, res) => {
  const { number, label, capacity, status, description, isActive } = req.body;
  const updateData = {};
  if (number) updateData.number = number;
  if (label !== undefined) updateData.label = label;
  if (capacity !== undefined) updateData.capacity = capacity;
  if (status) updateData.status = status;
  if (description !== undefined) updateData.description = description;
  if (isActive !== undefined) updateData.isActive = isActive;

  const table = await Table.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { $set: updateData },
    { new: true }
  );
  if (!table) return ApiResponse.error(res, 'Table not found', 404);
  return ApiResponse.success(res, { table }, 'Table updated');
});

const regenerateQR = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) return ApiResponse.error(res, 'Table not found', 404);

  const tenant = await Tenant.findById(req.tenantId).lean();
  const token = crypto.randomBytes(24).toString('hex');
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const { url, qrCodeUrl } = await generateQR(frontendUrl, tenant.slug, token);

  table.token = token;
  table.qrCodeData = url;
  table.qrCodeUrl = qrCodeUrl;
  await table.save();

  return ApiResponse.success(res, { table }, 'QR Code regenerated successfully');
});

const resetTableSession = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) return ApiResponse.error(res, 'Table not found', 404);

  // Close any active session
  await TableSession.updateMany(
    { tenantId: req.tenantId, tableId: table._id, isActive: true },
    { $set: { isActive: false, closedAt: new Date() } }
  );

  table.status = 'available';
  await table.save();

  return ApiResponse.success(res, { table }, 'Table reset to available');
});

const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!table) return ApiResponse.error(res, 'Table not found', 404);

  // Check if active orders exist
  const activeOrders = await Order.countDocuments({
    tenantId: req.tenantId,
    tableId: table._id,
    status: { $in: ['pending', 'accepted', 'preparing', 'ready', 'served'] },
  });

  if (activeOrders > 0) {
    return ApiResponse.error(res, 'Cannot delete table with active orders in progress', 400);
  }

  await Table.findByIdAndDelete(table._id);
  return ApiResponse.success(res, null, 'Table deleted');
});

module.exports = {
  getTables,
  createTable,
  updateTable,
  regenerateQR,
  resetTableSession,
  deleteTable,
};
