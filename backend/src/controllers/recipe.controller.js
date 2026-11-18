const mongoose = require('mongoose');
const Recipe = require('../models/Recipe.model');
const InventoryItem = require('../models/InventoryItem.model');
const MenuItem = require('../models/MenuItem.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

// Get all recipes for the tenant
const getRecipes = asyncHandler(async (req, res) => {
  const { menuItemId, page = 1, limit = 20 } = req.query;
  const query = { tenantId: req.tenantId, isActive: true };
  if (menuItemId) query.menuItemId = menuItemId;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [recipes, total] = await Promise.all([
    Recipe.find(query)
      .populate('menuItemId', 'name price discountedPrice image categoryId')
      .populate('ingredients.inventoryItemId', 'name unit currentStock averageCost')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Recipe.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, recipes, {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / parseInt(limit)),
  }, 'Recipes fetched');
});

// Get a single recipe
const getRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('menuItemId', 'name price discountedPrice image categoryId')
    .populate('ingredients.inventoryItemId', 'name unit currentStock averageCost')
    .lean();
  if (!recipe) return ApiResponse.error(res, 'Recipe not found', 404);
  return ApiResponse.success(res, recipe, 'Recipe fetched');
});

// Get recipe by menu item ID
const getRecipeByMenuItem = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findOne({
    tenantId: req.tenantId,
    menuItemId: req.params.menuItemId,
    isActive: true,
  })
    .populate('menuItemId', 'name price discountedPrice image')
    .populate('ingredients.inventoryItemId', 'name unit currentStock averageCost')
    .lean();

  // It's OK if no recipe exists yet
  return ApiResponse.success(res, recipe, recipe ? 'Recipe fetched' : 'No recipe found for this item');
});

// Create or update recipe for a menu item
const upsertRecipe = asyncHandler(async (req, res) => {
  const { menuItemId, ingredients, servings, preparationSteps, preparationTime, autoDeductOnOrder, notes } = req.body;

  if (!menuItemId) return ApiResponse.error(res, 'Menu item ID is required', 400);

  // Verify menu item belongs to tenant
  const menuItem = await MenuItem.findOne({ _id: menuItemId, tenantId: req.tenantId }).lean();
  if (!menuItem) return ApiResponse.error(res, 'Menu item not found', 404);

  // Validate and enrich ingredients
  const enrichedIngredients = [];
  if (ingredients && ingredients.length > 0) {
    for (const ing of ingredients) {
      if (!ing.inventoryItemId || !ing.quantity || ing.quantity <= 0) {
        return ApiResponse.error(res, 'Each ingredient needs a valid inventoryItemId and positive quantity', 400);
      }
      const invItem = await InventoryItem.findOne({ _id: ing.inventoryItemId, tenantId: req.tenantId }).lean();
      if (!invItem) {
        return ApiResponse.error(res, `Inventory item ${ing.inventoryItemId} not found`, 404);
      }
      enrichedIngredients.push({
        inventoryItemId: invItem._id,
        name: invItem.name,
        quantity: ing.quantity,
        unit: ing.unit || invItem.unit,
        costPerUnit: invItem.averageCost || invItem.purchaseCost || 0,
        totalCost: Math.round(ing.quantity * (invItem.averageCost || invItem.purchaseCost || 0) * 100) / 100,
      });
    }
  }

  // Check for existing active recipe
  let existingRecipe = await Recipe.findOne({ tenantId: req.tenantId, menuItemId, isActive: true });

  if (existingRecipe) {
    // Archive the old version
    existingRecipe.isActive = false;
    await existingRecipe.save();

    // Create new version
    const newVersion = existingRecipe.version + 1;
    const recipe = new Recipe({
      tenantId: req.tenantId,
      menuItemId,
      version: newVersion,
      servings: servings || 1,
      ingredients: enrichedIngredients,
      preparationSteps: preparationSteps?.trim(),
      preparationTime: preparationTime || 0,
      autoDeductOnOrder: autoDeductOnOrder ?? existingRecipe.autoDeductOnOrder,
      notes: notes?.trim(),
    });
    recipe.recalculateCosts();
    await recipe.save();

    const populated = await Recipe.findById(recipe._id)
      .populate('menuItemId', 'name price discountedPrice image')
      .populate('ingredients.inventoryItemId', 'name unit currentStock averageCost')
      .lean();

    return ApiResponse.success(res, populated, `Recipe updated to version ${newVersion}`);
  }

  // Create brand new recipe
  const recipe = new Recipe({
    tenantId: req.tenantId,
    menuItemId,
    version: 1,
    servings: servings || 1,
    ingredients: enrichedIngredients,
    preparationSteps: preparationSteps?.trim(),
    preparationTime: preparationTime || 0,
    autoDeductOnOrder: autoDeductOnOrder ?? false,
    notes: notes?.trim(),
  });
  recipe.recalculateCosts();
  await recipe.save();

  const populated = await Recipe.findById(recipe._id)
    .populate('menuItemId', 'name price discountedPrice image')
    .populate('ingredients.inventoryItemId', 'name unit currentStock averageCost')
    .lean();

  return ApiResponse.success(res, populated, 'Recipe created', 201);
});

// Delete recipe (soft delete)
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findOne({ _id: req.params.id, tenantId: req.tenantId, isActive: true });
  if (!recipe) return ApiResponse.error(res, 'Recipe not found', 404);
  recipe.isActive = false;
  await recipe.save();
  return ApiResponse.success(res, null, 'Recipe deactivated');
});

// Get food cost analysis across all recipes
const getFoodCostAnalysis = asyncHandler(async (req, res) => {
  const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);

  const recipes = await Recipe.find({ tenantId: tenantObjectId, isActive: true })
    .populate('menuItemId', 'name price discountedPrice image categoryId')
    .lean();

  const analysis = recipes
    .filter((r) => r.menuItemId) // skip if menu item was deleted
    .map((r) => {
      const sellingPrice = r.menuItemId.discountedPrice || r.menuItemId.price;
      const costPerServing = r.costPerServing || 0;
      const grossProfit = sellingPrice - costPerServing;
      const marginPercent = sellingPrice > 0 ? Math.round((grossProfit / sellingPrice) * 10000) / 100 : 0;

      return {
        menuItemId: r.menuItemId._id,
        menuItemName: r.menuItemId.name,
        image: r.menuItemId.image,
        sellingPrice,
        ingredientCost: r.totalIngredientCost,
        costPerServing,
        servings: r.servings,
        grossProfit: Math.round(grossProfit * 100) / 100,
        marginPercent,
        ingredientCount: r.ingredients.length,
      };
    })
    .sort((a, b) => a.marginPercent - b.marginPercent); // lowest margin first

  const avgMargin = analysis.length > 0
    ? Math.round(analysis.reduce((s, a) => s + a.marginPercent, 0) / analysis.length * 100) / 100
    : 0;

  return ApiResponse.success(res, {
    items: analysis,
    summary: {
      totalRecipes: analysis.length,
      averageMargin: avgMargin,
      lowestMarginItem: analysis[0] || null,
      highestMarginItem: analysis[analysis.length - 1] || null,
    },
  }, 'Food cost analysis');
});

// Recalculate all recipe costs (after inventory price changes)
const recalculateAllCosts = asyncHandler(async (req, res) => {
  const recipes = await Recipe.find({ tenantId: req.tenantId, isActive: true });
  let updated = 0;

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const invItem = await InventoryItem.findById(ing.inventoryItemId).lean();
      if (invItem) {
        ing.costPerUnit = invItem.averageCost || invItem.purchaseCost || 0;
      }
    }
    recipe.recalculateCosts();
    await recipe.save();
    updated++;
  }

  return ApiResponse.success(res, { updated }, `${updated} recipe costs recalculated`);
});

module.exports = {
  getRecipes,
  getRecipe,
  getRecipeByMenuItem,
  upsertRecipe,
  deleteRecipe,
  getFoodCostAnalysis,
  recalculateAllCosts,
};
