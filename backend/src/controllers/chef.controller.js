/**
 * @file chef.controller.js
 * @description Controller for chef profile routes.
 *
 * Provides public endpoints for browsing chef profiles and their recipes,
 * plus protected endpoints that allow a chef to update their own profile
 * information and avatar image.
 */

const User   = require('../models/User.model');
const Recipe = require('../models/Recipe.model');

/**
 * @route   GET /api/chefs
 * @desc    Retrieve all users with the 'chef' role.
 * @access  Public
 *
 * Returns an array of chef documents with the password field excluded.
 * Used to populate the public Chefs listing page.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 */
const getAllChefs = async (req, res) => {
  try {
    // Filter by role and strip the password from every document
    const chefs = await User.find({ role: 'chef' }).select('-password');
    res.json(chefs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/chefs/:id
 * @desc    Retrieve a single chef's profile together with all their recipes.
 * @access  Public
 *
 * Validates the ID format before querying to avoid a Mongoose CastError on
 * malformed ObjectIds. Returns both the chef document and their recipe list
 * in a single response so the profile page only needs one API call.
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const getChefById = async (req, res) => {
  try {
    // Guard against invalid ObjectId strings (e.g. "abc") that would cause
    // Mongoose to throw a CastError instead of returning a clean 400 response
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid chef ID' });
    }

    // Find a user that matches both the ID and the 'chef' role so that
    // passing a valid user ID for a non-chef account returns 404
    const chef = await User.findOne({ _id: req.params.id, role: 'chef' }).select('-password');
    if (!chef) return res.status(404).json({ message: 'Chef not found' });

    // Fetch all recipes authored by this chef
    const recipes = await Recipe.find({ chef: chef._id });

    // Return both the profile and recipes together in one response
    res.json({ chef, recipes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   PUT /api/chefs/profile
 * @desc    Update the authenticated chef's own profile fields.
 * @access  Private — chef only
 *
 * Accepts a subset of profile fields. Fields not included in the request body
 * are left unchanged. Returns the updated document without the password field.
 *
 * @param {import('express').Request}  req - Body: { name, bio, specialty, location, socialLinks }
 * @param {import('express').Response} res
 */
const updateProfile = async (req, res) => {
  try {
    const { name, bio, specialty, location, socialLinks } = req.body;

    // `new: true` returns the updated document rather than the original.
    // `runValidators: true` ensures schema constraints are enforced on update.
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

/**
 * @route   PUT /api/chefs/avatar
 * @desc    Upload and set a new avatar image for the authenticated chef.
 * @access  Private — chef only
 *
 * Expects the image to be sent as `multipart/form-data` with the field name
 * `avatar`. The `upload.single('avatar')` middleware (applied in the router)
 * processes the file and attaches it to `req.file` before this handler runs.
 *
 * @param {import('express').Request}  req - `req.file` populated by multer.
 * @param {import('express').Response} res
 */
const updateAvatar = async (req, res) => {
  try {
    // Reject the request if multer didn't attach a file (e.g. wrong field name)
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // Build the public URL path that the frontend can use to display the image
    const avatarUrl = `/uploads/${req.file.filename}`;

    // Persist the new avatar URL and return the updated profile
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
