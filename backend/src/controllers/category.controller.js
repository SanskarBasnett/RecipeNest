/**
 * @file category.controller.js
 * @description Controller for recipe category management routes.
 *
 * Categories are simple named labels that chefs assign to their recipes.
 * The list is managed dynamically through the API:
 *  - Anyone can read the category list (used to populate filter dropdowns).
 *  - Chefs and admins can add new categories.
 *  - Only admins can delete categories.
 */

const Category = require('../models/Category.model');

/**
 * @route   GET /api/categories
 * @desc    Retrieve all category names sorted alphabetically.
 * @access  Public
 *
 * Returns a plain array of name strings rather than full documents because
 * the frontend only needs the names for dropdowns and filter chips.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getCategories = async (req, res) => {
  try {
    // Sort alphabetically so the dropdown is easy to scan
    const cats = await Category.find().sort({ name: 1 });

    // Map to an array of name strings — the client doesn't need the full document
    res.json(cats.map(c => c.name));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   POST /api/categories
 * @desc    Add a new category.
 * @access  Private — chef or admin only
 *
 * Performs a case-insensitive duplicate check before inserting so that
 * "Italian" and "italian" are treated as the same category.
 * Returns the new category's name string on success.
 *
 * @param {import('express').Request}  req - Body: { name }
 * @param {import('express').Response} res
 */
const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // Reject empty or whitespace-only names early
    if (!name || !name.trim())
      return res.status(400).json({ message: 'Category name is required.' });

    const trimmed = name.trim();

    // Case-insensitive duplicate check using a regex anchored to the full string.
    // This prevents entries like "Italian" and "ITALIAN" from coexisting.
    const exists = await Category.findOne({
      name: { $regex: `^${trimmed}$`, $options: 'i' },
    });
    if (exists)
      return res.status(400).json({ message: `"${trimmed}" already exists.` });

    // Create the category and associate it with the requesting user
    const cat = await Category.create({ name: trimmed, createdBy: req.user._id });

    // Return just the name string to match the format of getCategories
    res.status(201).json(cat.name);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   DELETE /api/categories/:name
 * @desc    Delete a category by its name.
 * @access  Private — admin only
 *
 * Uses the category name (not its ObjectId) as the URL parameter to keep
 * the client-side code simple — the client already has the name from the
 * list and doesn't need to track IDs separately.
 *
 * Note: Deleting a category does not update existing recipes that reference
 * it; those recipes will retain the old category string.
 *
 * @param {import('express').Request}  req - Params: { name }
 * @param {import('express').Response} res
 */
const deleteCategory = async (req, res) => {
  try {
    // findOneAndDelete returns null if no document matched — treated as a
    // silent success since the end state (category absent) is the same
    await Category.findOneAndDelete({ name: req.params.name });
    res.json({ message: 'Category deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getCategories, addCategory, deleteCategory };
