const MenuCategory = require('../models/MenuCategory.model');
const MenuItem = require('../models/MenuItem.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');

// CATEGORIES
const getCategories = asyncHandler(async (req, res) => {
  const categories = await MenuCategory.find({ tenantId: req.tenantId }).sort({ sortOrder: 1 }).lean();
  return ApiResponse.success(res, { categories }, 'Categories fetched');
});

const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, sortOrder } = req.body;
  if (!name) return ApiResponse.error(res, 'Category name is required', 400);

  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const category = await MenuCategory.create({
    tenantId: req.tenantId,
    name,
    slug: `${slug}-${Date.now().toString(36)}`,
    description,
    image,
    sortOrder: sortOrder || 0,
  });
  return ApiResponse.success(res, { category }, 'Category created', 201);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await MenuCategory.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { $set: req.body },
    { new: true }
  );
  if (!category) return ApiResponse.error(res, 'Category not found', 404);
  return ApiResponse.success(res, { category }, 'Category updated');
});

const deleteCategory = asyncHandler(async (req, res) => {
  // Check if items exist under this category
  const itemCount = await MenuItem.countDocuments({ tenantId: req.tenantId, categoryId: req.params.id });
  if (itemCount > 0) {
    return ApiResponse.error(res, `Cannot delete category containing ${itemCount} items. Move or delete items first.`, 400);
  }
  const deleted = await MenuCategory.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!deleted) return ApiResponse.error(res, 'Category not found', 404);
  return ApiResponse.success(res, null, 'Category deleted');
});

// MENU ITEMS
const getMenuItems = asyncHandler(async (req, res) => {
  const { categoryId, isAvailable, search } = req.query;
  const filter = { tenantId: req.tenantId };
  if (categoryId) filter.categoryId = categoryId;
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const items = await MenuItem.find(filter).populate('categoryId', 'name').sort({ sortOrder: 1, createdAt: -1 }).lean();
  return ApiResponse.success(res, { items }, 'Menu items fetched');
});

const createMenuItem = asyncHandler(async (req, res) => {
  const {
    name, categoryId, description, image, price, discountedPrice,
    isVeg, isAvailable, preparationTime, isBestseller, isFeatured,
    addons, variants, tags, spiceLevel,
  } = req.body;

  if (!name || !categoryId || price === undefined) {
    return ApiResponse.error(res, 'Name, category, and price are required', 400);
  }

  const item = await MenuItem.create({
    tenantId: req.tenantId,
    name,
    categoryId,
    description,
    image,
    price,
    discountedPrice,
    isVeg: isVeg !== undefined ? isVeg : true,
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    preparationTime: preparationTime || 15,
    isBestseller: isBestseller || false,
    isFeatured: isFeatured || false,
    addons: addons || [],
    variants: variants || [],
    tags: tags || [],
    spiceLevel: spiceLevel || 'none',
  });

  return ApiResponse.success(res, { item }, 'Menu item created', 201);
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!item) return ApiResponse.error(res, 'Menu item not found', 404);
  return ApiResponse.success(res, { item }, 'Menu item updated');
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!item) return ApiResponse.error(res, 'Menu item not found', 404);
  return ApiResponse.success(res, null, 'Menu item deleted');
});

const toggleAvailability = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!item) return ApiResponse.error(res, 'Menu item not found', 404);

  item.isAvailable = !item.isAvailable;
  await item.save();
  return ApiResponse.success(res, { item }, `Item is now ${item.isAvailable ? 'available' : 'unavailable'}`);
});

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
};
