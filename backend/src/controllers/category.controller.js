const Category = require('../models/Category.model');

// @route GET /api/categories
// Get all categories (public)
const getCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    res.json(cats.map(c => c.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/categories
// Add a new category (chef or admin only)
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Category name is required.' });

    const trimmed = name.trim();

    // Case-insensitive duplicate check
    const exists = await Category.findOne({
      name: { $regex: `^${trimmed}$`, $options: 'i' },
    });
    if (exists)
      return res.status(400).json({ message: `"${trimmed}" already exists.` });

    const cat = await Category.create({ name: trimmed, createdBy: req.user._id });
    res.status(201).json(cat.name);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/categories/:name
// Delete a category (admin only)
const deleteCategory = async (req, res) => {
  try {
    await Category.findOneAndDelete({ name: req.params.name });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCategories, addCategory, deleteCategory };
