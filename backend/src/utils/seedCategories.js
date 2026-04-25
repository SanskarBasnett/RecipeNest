const Category = require('../models/Category.model');

const DEFAULT_CATEGORIES = [
  'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack', 'Appetizer', 'Beverage',
];

const seedCategories = async () => {
  try {
    for (const name of DEFAULT_CATEGORIES) {
      const exists = await Category.findOne({ name });
      if (!exists) await Category.create({ name });
    }
  } catch (err) {
    console.error('Category seed error:', err.message);
  }
};

module.exports = seedCategories;
