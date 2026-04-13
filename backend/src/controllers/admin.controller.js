const User = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

// @route GET /api/admin/users
// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/admin/users/:id
// Delete a user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Also delete their recipes
    await Recipe.deleteMany({ chef: user._id });
    await user.deleteOne();

    res.json({ message: 'User and their recipes deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/admin/users/:id/role
// Change user role (admin only)
const changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const allowed = ['user', 'chef', 'admin'];
    if (!allowed.includes(role)) return res.status(400).json({ message: 'Invalid role' });

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

// @route GET /api/admin/stats
// Dashboard stats (admin only)
const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalChefs = await User.countDocuments({ role: 'chef' });
    const totalRecipes = await Recipe.countDocuments();

    res.json({ totalUsers, totalChefs, totalRecipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllUsers, deleteUser, changeUserRole, getStats };
