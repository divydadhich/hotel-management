const express = require('express');
const router = express.Router();
const tableController = require('../../controllers/table.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

router.use(authenticate, resolveTenant);

router.get('/', tableController.getTables);
router.post('/', authorize(ROLES.OWNER), tableController.createTable);
router.put('/:id', authorize(ROLES.OWNER, ROLES.RECEPTIONIST), tableController.updateTable);
router.post('/:id/regenerate-qr', authorize(ROLES.OWNER), tableController.regenerateQR);
router.post('/:id/reset', authorize(ROLES.OWNER, ROLES.RECEPTIONIST), tableController.resetTableSession);
router.delete('/:id', authorize(ROLES.OWNER), tableController.deleteTable);

module.exports = router;
