const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema(
  {
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
    name: { type: String, required: true }, // denormalised for display
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true },
    costPerUnit: { type: Number, default: 0, min: 0 }, // snapshot at recipe creation/update
    totalCost: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const recipeSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    version: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
    servings: { type: Number, default: 1, min: 1 },
    ingredients: { type: [recipeIngredientSchema], default: [] },
    preparationSteps: { type: String, trim: true, maxlength: 3000 },
    preparationTime: { type: Number, default: 0 }, // minutes
    totalIngredientCost: { type: Number, default: 0, min: 0 },
    costPerServing: { type: Number, default: 0, min: 0 },
    notes: { type: String, trim: true, maxlength: 500 },
    // Auto-deduction config
    autoDeductOnOrder: { type: Boolean, default: false },
  },
  { timestamps: true }
);

recipeSchema.index({ tenantId: 1, menuItemId: 1, isActive: 1 });
recipeSchema.index({ tenantId: 1, menuItemId: 1, version: -1 });

// Method to recalculate costs based on current ingredient prices
recipeSchema.methods.recalculateCosts = function () {
  let total = 0;
  for (const ing of this.ingredients) {
    ing.totalCost = Math.round(ing.quantity * ing.costPerUnit * 100) / 100;
    total += ing.totalCost;
  }
  this.totalIngredientCost = Math.round(total * 100) / 100;
  this.costPerServing = this.servings > 0 ? Math.round((total / this.servings) * 100) / 100 : 0;
};

module.exports = mongoose.model('Recipe', recipeSchema);
