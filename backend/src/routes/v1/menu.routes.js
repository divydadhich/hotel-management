const express = require('express');
const router = express.Router();
const menuController = require('../../controllers/menu.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

router.use(authenticate, resolveTenant);

// Categories
router.get('/categories', menuController.getCategories);
router.post('/categories', authorize(ROLES.OWNER), menuController.createCategory);
router.put('/categories/:id', authorize(ROLES.OWNER), menuController.updateCategory);
router.delete('/categories/:id', authorize(ROLES.OWNER), menuController.deleteCategory);

// Menu Items
router.get('/items', menuController.getMenuItems);
router.post('/items', authorize(ROLES.OWNER), menuController.createMenuItem);
router.put('/items/:id', authorize(ROLES.OWNER), menuController.updateMenuItem);
router.delete('/items/:id', authorize(ROLES.OWNER), menuController.deleteMenuItem);
router.patch('/items/:id/availability', authorize(ROLES.OWNER, ROLES.RECEPTIONIST, ROLES.KITCHEN), menuController.toggleAvailability);

module.exports = router;
