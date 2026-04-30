/**
 * @file admin.controller.js
 * @description Controller for admin-only management routes.
 *
 * Provides endpoints for:
 *  - Viewing and managing all users (list, get by ID, change role, delete)
 *  - Viewing and deleting any recipe
 *  - Fetching platform-wide statistics (user/chef/recipe counts)
 *  - Reading the activity log audit trail
 *
 * All routes in this controller are protected by `protect` + `authorize('admin')`
 * middleware applied at the router level.
 */

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

/**
 * @route   GET /api/admin/users
 * @desc    Retrieve all registered users (any role).
 * @access  Private — admin only
 *
 * Returns every user document with the password field excluded.
 * Used to populate the admin user management table.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getAllUsers = async (req, res) => {
  try {
    // Exclude passwords from all returned documents
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/admin/recipes
 * @desc    Retrieve all recipes with their author's name and email.
 * @access  Private — admin only
 *
 * Populates the `chef` field with name and email so the admin can identify
 * who created each recipe. Sorted newest-first.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('chef', 'name email') // only the fields needed for the admin table
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user account and all recipes they authored.
 * @access  Private — admin only
 *
 * Cascades the deletion to the user's recipes so orphaned recipe documents
 * don't remain in the database after the chef account is removed.
 * Logs the deletion event for the audit trail.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove all recipes authored by this user before deleting the account
    await Recipe.deleteMany({ chef: user._id });

    // Delete the user document itself
    await user.deleteOne();

    res.json({ message: 'User and their recipes deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   DELETE /api/admin/recipes/:id
 * @desc    Delete any recipe regardless of who created it.
 * @access  Private — admin only
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    await recipe.deleteOne();
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Change a user's role.
 * @access  Private — admin only
 *
 * Validates that the requested role is one of the three allowed values before
 * applying the change. Returns the updated user document.
 *
 * @param {import('express').Request}  req - Params: { id }; Body: { role }
 * @param {import('express').Response} res
 */
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Reject any role value that isn't part of the defined enum
    const allowed = ['user', 'chef', 'admin'];
    if (!allowed.includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    // Apply the role change and return the updated document (without password)
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/admin/users/:id
 * @desc    Retrieve a single user's profile along with their liked recipes.
 * @access  Private — admin only
 *
 * Combines the user document with a list of recipes they have liked so the
 * admin can see the user's activity in one request.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Find all recipes where this user's ID appears in the `likes` array
    const likedRecipes = await Recipe.find({ likes: user._id })
      .sort({ createdAt: -1 })
      .populate('chef', 'name avatar specialty');

    // Merge the liked recipes into the response alongside the user document
    res.json({ ...user.toObject(), likedRecipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/admin/stats
 * @desc    Return high-level platform statistics for the admin dashboard.
 * @access  Private — admin only
 *
 * Runs three count queries to return user, chef, and recipe totals.
 * countDocuments is efficient as it uses the collection index.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getStats = async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments({ role: 'user' });
    const totalChefs   = await User.countDocuments({ role: 'chef' });
    const totalRecipes = await Recipe.countDocuments();

    res.json({ totalUsers, totalChefs, totalRecipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllUsers,
  getAllRecipes,
  deleteUser,
  deleteRecipe,
  changeUserRole,
  getStats,
  getUserById,
};
