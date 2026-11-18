const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { resolveTenant } = require('../../middleware/tenantIsolation.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { ROLES } = require('../../constants/roles');
const ctrl = require('../../controllers/recipe.controller');

router.use(authenticate, resolveTenant, authorize(ROLES.OWNER));

router.get('/', ctrl.getRecipes);
router.get('/food-cost', ctrl.getFoodCostAnalysis);
router.post('/recalculate', ctrl.recalculateAllCosts);
router.get('/by-menu-item/:menuItemId', ctrl.getRecipeByMenuItem);
router.get('/:id', ctrl.getRecipe);
router.post('/', ctrl.upsertRecipe);
router.delete('/:id', ctrl.deleteRecipe);

module.exports = router;
