const mongoose = require('mongoose');
const InventoryItem = require('../models/InventoryItem.model');
const StockTransaction = require('../models/StockTransaction.model');
const { TRANSACTION_TYPES } = require('../models/StockTransaction.model');

/**
 * Record a stock transaction and update the inventory item's currentStock atomically.
 * Returns the created transaction document.
 */
const recordStockTransaction = async ({
  tenantId,
  inventoryItemId,
  type,
  quantity,
  unitCost = 0,
  referenceType = 'manual',
  referenceId = null,
  batchNumber,
  expiryDate,
  reason,
  performedBy,
  session = null,
}) => {
  const item = await InventoryItem.findOne({ _id: inventoryItemId, tenantId });
  if (!item) {
    throw Object.assign(new Error('Inventory item not found'), { statusCode: 404 });
  }

  const stockBefore = item.currentStock;

  // For outflow types, quantity is recorded as negative
  const isOutflow = [
    TRANSACTION_TYPES.SALE_DEDUCTION,
    TRANSACTION_TYPES.ADJUSTMENT_SUBTRACT,
    TRANSACTION_TYPES.WASTAGE,
    TRANSACTION_TYPES.TRANSFER_OUT,
  ].includes(type);

  const absQty = Math.abs(quantity);
  const signedQty = isOutflow ? -absQty : absQty;
  const stockAfter = Math.max(0, stockBefore + signedQty);

  if (isOutflow && stockBefore < absQty) {
    // Allow deduction but clamp to 0
  }

  const totalCost = Math.round(absQty * unitCost * 100) / 100;

  const txn = new StockTransaction({
    tenantId,
    inventoryItemId,
    type,
    quantity: signedQty,
    unitCost,
    totalCost,
    stockBefore,
    stockAfter,
    referenceType,
    referenceId,
    batchNumber,
    expiryDate,
    reason,
    performedBy,
  });

  // Update item stock and cost tracking
  item.currentStock = stockAfter;

  if (!isOutflow && unitCost > 0) {
    item.lastPurchaseCost = unitCost;
    // Weighted average cost
    const prevValue = stockBefore * (item.averageCost || 0);
    const newValue = absQty * unitCost;
    const totalQty = stockBefore + absQty;
    item.averageCost = totalQty > 0 ? Math.round(((prevValue + newValue) / totalQty) * 100) / 100 : unitCost;
    item.purchaseCost = unitCost;
  }

  if (batchNumber) item.batchNumber = batchNumber;
  if (expiryDate) item.expiryDate = expiryDate;

  const opts = session ? { session } : {};
  await txn.save(opts);
  await item.save(opts);

  return txn;
};

/**
 * Deduct ingredients for an order based on recipes.
 * Returns array of transactions created.
 */
const deductIngredientsForOrder = async ({ tenantId, orderId, items, performedBy, session = null }) => {
  const Recipe = require('../models/Recipe.model');
  const transactions = [];

  for (const orderItem of items) {
    // Find active recipe for this menu item
    const recipe = await Recipe.findOne({
      tenantId,
      menuItemId: orderItem.menuItemId,
      isActive: true,
      autoDeductOnOrder: true,
    });

    if (!recipe) continue; // No recipe configured for auto-deduction

    for (const ingredient of recipe.ingredients) {
      const qtyNeeded = ingredient.quantity * orderItem.quantity;
      try {
        const txn = await recordStockTransaction({
          tenantId,
          inventoryItemId: ingredient.inventoryItemId,
          type: TRANSACTION_TYPES.SALE_DEDUCTION,
          quantity: qtyNeeded,
          unitCost: ingredient.costPerUnit,
          referenceType: 'order',
          referenceId: orderId,
          reason: `Order deduction: ${orderItem.name} x${orderItem.quantity}`,
          performedBy,
          session,
        });
        transactions.push(txn);
      } catch (err) {
        // Log but don't block order completion
        console.error(`Inventory deduction failed for ${ingredient.name}:`, err.message);
      }
    }
  }

  return transactions;
};

module.exports = {
  recordStockTransaction,
  deductIngredientsForOrder,
  TRANSACTION_TYPES,
};
