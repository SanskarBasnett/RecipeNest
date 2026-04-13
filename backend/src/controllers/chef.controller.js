const User = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

// @route GET /api/chefs
// Get all chefs (public)
const getAllChefs = async (req, res) => {
  try {
    const chefs = await User.find({ role: 'chef' }).select('-password');
    res.json(chefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/chefs/:id
// Get single chef profile with their recipes (public)
const getChefById = async (req, res) => {
  try {
    // Guard against invalid ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid chef ID' });
    }

    const chef = await User.findOne({ _id: req.params.id, role: 'chef' }).select('-password');
    if (!chef) return res.status(404).json({ message: 'Chef not found' });

    const recipes = await Recipe.find({ chef: chef._id });
    res.json({ chef, recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/chefs/profile
// Update own profile (chef only)
const updateProfile = async (req, res) => {
  try {
    const { name, bio, specialty, location, socialLinks } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, specialty, location, socialLinks },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/chefs/avatar
// Upload avatar (chef only)
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const avatarUrl = `/uploads/${req.file.filename}`;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getAllChefs, getChefById, updateProfile, updateAvatar };
