const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { ROLES } = require('../../constants/roles');
const ctrl = require('../../controllers/inventory.controller');

// All routes require authentication + tenant context + owner role
router.use(authenticate, resolveTenant, authorize(ROLES.OWNER));

// Dashboard
router.get('/dashboard', ctrl.getDashboardSummary);
router.get('/low-stock', ctrl.getLowStockAlerts);

// Categories
router.get('/categories', ctrl.getCategories);
router.post('/categories', ctrl.createCategory);
router.put('/categories/:id', ctrl.updateCategory);
router.delete('/categories/:id', ctrl.deleteCategory);

// Items
router.get('/items', ctrl.getItems);
router.get('/items/:id', ctrl.getItem);
router.post('/items', ctrl.createItem);
router.put('/items/:id', ctrl.updateItem);
router.delete('/items/:id', ctrl.deleteItem);

// Stock adjustments
router.post('/items/:id/adjust', ctrl.adjustStock);

// Transaction log
router.get('/transactions', ctrl.getTransactions);

// Suppliers
router.get('/suppliers', ctrl.getSuppliers);
router.post('/suppliers', ctrl.createSupplier);
router.put('/suppliers/:id', ctrl.updateSupplier);
router.delete('/suppliers/:id', ctrl.deleteSupplier);

module.exports = router;
