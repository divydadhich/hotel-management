const express = require('express');
const router = express.Router();
const staffController = require('../../controllers/staff.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { ROLES } = require('../../constants/roles');

router.use(authenticate, resolveTenant, authorize(ROLES.OWNER));

router.get('/', staffController.getStaff);
router.post('/', staffController.createStaff);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

module.exports = router;
