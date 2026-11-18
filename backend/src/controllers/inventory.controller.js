const mongoose = require('mongoose');
const InventoryCategory = require('../models/InventoryCategory.model');
const InventoryItem = require('../models/InventoryItem.model');
const StockTransaction = require('../models/StockTransaction.model');
const Supplier = require('../models/Supplier.model');
const ApiResponse = require('../utils/apiResponse');
const { paginate } = require('../utils/pagination');
const asyncHandler = require('../middleware/asyncHandler');
const inventoryService = require('../services/inventory.service');

// ───────── CATEGORIES ─────────

const getCategories = asyncHandler(async (req, res) => {
  const categories = await InventoryCategory.find({ tenantId: req.tenantId })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  return ApiResponse.success(res, categories, 'Inventory categories fetched');
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, sortOrder } = req.body;
  if (!name?.trim()) return ApiResponse.error(res, 'Category name is required', 400);

  const exists = await InventoryCategory.findOne({ tenantId: req.tenantId, name: name.trim() });
  if (exists) return ApiResponse.error(res, 'Category with this name already exists', 409);

  const category = await InventoryCategory.create({
    tenantId: req.tenantId,
    name: name.trim(),
    description: description?.trim(),
    sortOrder: sortOrder || 0,
  });
  return ApiResponse.success(res, category, 'Category created', 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, sortOrder, isActive } = req.body;

  const category = await InventoryCategory.findOne({ _id: id, tenantId: req.tenantId });
  if (!category) return ApiResponse.error(res, 'Category not found', 404);

  if (name !== undefined) category.name = name.trim();
  if (description !== undefined) category.description = description?.trim();
  if (sortOrder !== undefined) category.sortOrder = sortOrder;
  if (isActive !== undefined) category.isActive = isActive;

  await category.save();
  return ApiResponse.success(res, category, 'Category updated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const itemCount = await InventoryItem.countDocuments({ tenantId: req.tenantId, categoryId: id });
  if (itemCount > 0) {
    return ApiResponse.error(res, `Cannot delete: ${itemCount} inventory item(s) use this category`, 400);
  }
  const deleted = await InventoryCategory.findOneAndDelete({ _id: id, tenantId: req.tenantId });
  if (!deleted) return ApiResponse.error(res, 'Category not found', 404);
  return ApiResponse.success(res, null, 'Category deleted');
});

// ───────── INVENTORY ITEMS ─────────

const getItems = asyncHandler(async (req, res) => {
  const { page, limit, search, categoryId, lowStock, sortBy, sortOrder } = req.query;

  const query = { tenantId: req.tenantId, isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
    ];
  }
  if (categoryId) query.categoryId = categoryId;
  if (lowStock === 'true') {
    query.$expr = { $lte: ['$currentStock', '$minimumStock'] };
  }

  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.name = 1;
  }

  const result = await paginate(InventoryItem, query, { page, limit, sort });
  return ApiResponse.paginated(res, result.data, result.pagination, 'Inventory items fetched');
});

const getItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('categoryId', 'name')
    .populate('supplierId', 'name phone')
    .lean();
  if (!item) return ApiResponse.error(res, 'Item not found', 404);
  return ApiResponse.success(res, item, 'Item fetched');
});

const createItem = asyncHandler(async (req, res) => {
  const {
    name, sku, categoryId, unit, currentStock, minimumStock, maximumStock,
    purchaseCost, supplierId, storageLocation, storageCondition,
    expiryDate, batchNumber, isPerishable, notes,
  } = req.body;

  if (!name?.trim()) return ApiResponse.error(res, 'Item name is required', 400);
  if (!unit) return ApiResponse.error(res, 'Unit is required', 400);

  const item = await InventoryItem.create({
    tenantId: req.tenantId,
    name: name.trim(),
    sku: sku?.trim() || undefined,
    categoryId: categoryId || undefined,
    unit,
    currentStock: currentStock || 0,
    minimumStock: minimumStock || 0,
    maximumStock: maximumStock || undefined,
    purchaseCost: purchaseCost || 0,
    averageCost: purchaseCost || 0,
    lastPurchaseCost: purchaseCost || 0,
    supplierId: supplierId || undefined,
    storageLocation: storageLocation?.trim(),
    storageCondition,
    expiryDate: expiryDate || undefined,
    batchNumber: batchNumber?.trim(),
    isPerishable: isPerishable || false,
    notes: notes?.trim(),
  });

  // Record opening stock transaction if initial stock > 0
  if (currentStock > 0) {
    await inventoryService.recordStockTransaction({
      tenantId: req.tenantId,
      inventoryItemId: item._id,
      type: 'opening_stock',
      quantity: currentStock,
      unitCost: purchaseCost || 0,
      referenceType: 'opening',
      reason: 'Initial stock entry',
      performedBy: req.user.userId,
    });
  }

  return ApiResponse.success(res, item, 'Inventory item created', 201);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!item) return ApiResponse.error(res, 'Item not found', 404);

  const updatableFields = [
    'name', 'sku', 'categoryId', 'unit', 'minimumStock', 'maximumStock',
    'purchaseCost', 'supplierId', 'storageLocation', 'storageCondition',
    'expiryDate', 'batchNumber', 'isPerishable', 'isActive', 'notes',
  ];

  for (const field of updatableFields) {
    if (req.body[field] !== undefined) {
      item[field] = req.body[field];
    }
  }

  await item.save();
  return ApiResponse.success(res, item, 'Item updated');
});

const deleteItem = asyncHandler(async (req, res) => {
  const item = await InventoryItem.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!item) return ApiResponse.error(res, 'Item not found', 404);

  // Soft delete
  item.isActive = false;
  await item.save();
  return ApiResponse.success(res, null, 'Item deactivated');
});

// ───────── STOCK ADJUSTMENTS ─────────

const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, type, reason, unitCost, batchNumber, expiryDate } = req.body;

  if (!quantity || quantity <= 0) return ApiResponse.error(res, 'Quantity must be positive', 400);
  if (!type) return ApiResponse.error(res, 'Transaction type is required', 400);

  const allowedTypes = [
    'purchase', 'adjustment_add', 'adjustment_subtract', 'wastage', 'return',
  ];
  if (!allowedTypes.includes(type)) {
    return ApiResponse.error(res, 'Invalid transaction type for manual adjustment', 400);
  }

  const txn = await inventoryService.recordStockTransaction({
    tenantId: req.tenantId,
    inventoryItemId: req.params.id,
    type,
    quantity,
    unitCost: unitCost || 0,
    referenceType: 'manual',
    reason: reason?.trim(),
    batchNumber: batchNumber?.trim(),
    expiryDate,
    performedBy: req.user.userId,
  });

  return ApiResponse.success(res, txn, 'Stock adjusted');
});

// ───────── STOCK TRANSACTIONS LOG ─────────

const getTransactions = asyncHandler(async (req, res) => {
  const { page, limit, inventoryItemId, type, startDate, endDate } = req.query;

  const query = { tenantId: req.tenantId };
  if (inventoryItemId) query.inventoryItemId = inventoryItemId;
  if (type) query.type = type;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const result = await paginate(StockTransaction, query, {
    page,
    limit,
    sort: { createdAt: -1 },
  });

  // Populate item names
  const StockTransactionModel = StockTransaction;
  const populatedData = await StockTransactionModel.populate(result.data, [
    { path: 'inventoryItemId', select: 'name sku unit' },
    { path: 'performedBy', select: 'name' },
  ]);

  return ApiResponse.paginated(res, populatedData, result.pagination, 'Transactions fetched');
});

// ───────── DASHBOARD SUMMARY ─────────

const getDashboardSummary = asyncHandler(async (req, res) => {
  const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

  const [
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalValuation,
    categoryBreakdown,
    recentTransactions,
    expiringItems,
  ] = await Promise.all([
    InventoryItem.countDocuments({ tenantId: tenantObjectId, isActive: true }),
    InventoryItem.countDocuments({
      tenantId: tenantObjectId,
      isActive: true,
      $expr: { $and: [{ $gt: ['$currentStock', 0] }, { $lte: ['$currentStock', '$minimumStock'] }] },
    }),
    InventoryItem.countDocuments({
      tenantId: tenantObjectId,
      isActive: true,
      currentStock: 0,
    }),
    InventoryItem.aggregate([
      { $match: { tenantId: tenantObjectId, isActive: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$averageCost'] } } } },
    ]),
    InventoryItem.aggregate([
      { $match: { tenantId: tenantObjectId, isActive: true } },
      {
        $lookup: {
          from: 'inventorycategories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          count: { $sum: 1 },
          value: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
        },
      },
      { $sort: { value: -1 } },
    ]),
    StockTransaction.find({ tenantId: tenantObjectId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('inventoryItemId', 'name unit')
      .populate('performedBy', 'name')
      .lean(),
    InventoryItem.find({
      tenantId: tenantObjectId,
      isActive: true,
      isPerishable: true,
      expiryDate: { $ne: null, $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    })
      .sort({ expiryDate: 1 })
      .limit(10)
      .lean(),
  ]);

  return ApiResponse.success(res, {
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalValuation: Math.round((totalValuation[0]?.total || 0) * 100) / 100,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      category: c._id || 'Uncategorized',
      count: c.count,
      value: Math.round(c.value * 100) / 100,
    })),
    recentTransactions,
    expiringItems,
  }, 'Inventory dashboard summary');
});

// ───────── LOW STOCK ALERTS ─────────

const getLowStockAlerts = asyncHandler(async (req, res) => {
  const items = await InventoryItem.find({
    tenantId: req.tenantId,
    isActive: true,
    $expr: { $lte: ['$currentStock', '$minimumStock'] },
  })
    .populate('categoryId', 'name')
    .populate('supplierId', 'name phone')
    .sort({ currentStock: 1 })
    .lean();

  return ApiResponse.success(res, items, 'Low stock items fetched');
});

// ───────── SUPPLIERS (basic CRUD for Phase 1) ─────────

const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ tenantId: req.tenantId, isActive: true })
    .sort({ name: 1 })
    .lean();
  return ApiResponse.success(res, suppliers, 'Suppliers fetched');
});

const createSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, email, phone, address, city, state, gstNumber, paymentTerms, notes } = req.body;
  if (!name?.trim()) return ApiResponse.error(res, 'Supplier name is required', 400);

  const supplier = await Supplier.create({
    tenantId: req.tenantId,
    name: name.trim(),
    contactPerson: contactPerson?.trim(),
    email: email?.trim(),
    phone: phone?.trim(),
    address: address?.trim(),
    city: city?.trim(),
    state: state?.trim(),
    gstNumber: gstNumber?.trim(),
    paymentTerms: paymentTerms?.trim(),
    notes: notes?.trim(),
  });
  return ApiResponse.success(res, supplier, 'Supplier created', 201);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!supplier) return ApiResponse.error(res, 'Supplier not found', 404);

  const fields = ['name', 'contactPerson', 'email', 'phone', 'alternatePhone', 'address', 'city', 'state', 'gstNumber', 'panNumber', 'paymentTerms', 'notes', 'isActive', 'rating'];
  for (const f of fields) {
    if (req.body[f] !== undefined) supplier[f] = req.body[f];
  }

  await supplier.save();
  return ApiResponse.success(res, supplier, 'Supplier updated');
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!supplier) return ApiResponse.error(res, 'Supplier not found', 404);
  supplier.isActive = false;
  await supplier.save();
  return ApiResponse.success(res, null, 'Supplier deactivated');
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  adjustStock,
  getTransactions,
  getDashboardSummary,
  getLowStockAlerts,
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
