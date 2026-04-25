const User = require('../models/User.model');
const Recipe = require('../models/Recipe.model');
const ActivityLog = require('../models/ActivityLog.model');
const logActivity = require('../utils/logActivity');

// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/recipes
// Get all recipes with chef info (admin only)
const getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find()
      .populate('chef', 'name email')
      .sort({ createdAt: -1 });
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/admin/users/:id
// Delete a user and all their recipes
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Recipe.deleteMany({ chef: user._id });
    await user.deleteOne();

    await logActivity('USER_DELETE',
      { id: req.user._id, name: req.user.name, role: req.user.role },
      { type: 'user', id: user._id, label: user.name },
      { deletedRole: user.role }
    );

    res.json({ message: 'User and their recipes deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/admin/recipes/:id
// Delete any recipe (admin only)
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

// @route PUT /api/admin/users/:id/role
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['user', 'chef', 'admin'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/admin/stats
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

// @route GET /api/admin/activity
const getActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, getAllRecipes, deleteUser, deleteRecipe, changeUserRole, getStats, getActivity, getUserById };
