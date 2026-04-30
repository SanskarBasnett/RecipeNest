/**
 * @file auth.controller.js
 * @description Controller for authentication-related routes.
 *
 * Handles user registration, login, fetching the current user's profile,
 * and changing passwords. JWTs are issued on successful register/login and
 * must be included in the Authorization header for protected routes.
 */

const User        = require('../models/User.model');
const jwt         = require('jsonwebtoken');

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Generates a signed JWT for the given user ID.
 * The token expires after 7 days, after which the client must log in again.
 *
 * @param {string|import('mongoose').Types.ObjectId} id - The user's MongoDB _id.
 * @returns {string} Signed JWT string.
 */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ---------------------------------------------------------------------------
// Controllers
// ---------------------------------------------------------------------------

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account.
 * @access  Public
 *
 * Validates that the email is not already taken, enforces allowed roles
 * (only 'user' and 'chef' can self-register — admins are created via seed),
 * creates the user document, logs the registration event, and returns the
 * new user's profile along with a JWT.
 *
 * @param {import('express').Request}  req - Body: { name, email, password, role }
 * @param {import('express').Response} res
 */
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Prevent duplicate accounts — email must be unique across all users
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    // Guard against privilege escalation: only 'user' and 'chef' are valid
    // self-registration roles. Any other value (including 'admin') falls back
    // to the default 'user' role.
    const allowedRoles = ['user', 'chef'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    // Create the user — the pre-save hook in User.model.js will hash the password
    const user = await User.create({ name, email, password, role: assignedRole });

    // Return the full profile plus a token so the client is immediately logged in
    res.status(201).json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      avatar:      user.avatar,
      bio:         user.bio,
      specialty:   user.specialty,
      location:    user.location,
      socialLinks: user.socialLinks,
      token:       generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate an existing user and return a JWT.
 * @access  Public
 *
 * Looks up the user by email, then uses the `matchPassword` instance method
 * to compare the submitted password against the stored bcrypt hash.
 * A missing user and a wrong password return the same generic error to
 * prevent user-enumeration attacks.
 *
 * @param {import('express').Request}  req - Body: { email, password }
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return the full profile plus a fresh token
    res.json({
      _id:         user._id,
      name:        user.name,
      email:       user.email,
      role:        user.role,
      avatar:      user.avatar,
      bio:         user.bio,
      specialty:   user.specialty,
      location:    user.location,
      socialLinks: user.socialLinks,
      token:       generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Return the currently authenticated user's profile.
 * @access  Private (requires valid JWT via `protect` middleware)
 *
 * The `protect` middleware already fetched and attached the user document
 * to `req.user`, so this handler simply echoes it back.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const getMe = async (req, res) => {
  // req.user is set by the protect middleware — no DB query needed here
  res.json(req.user);
};

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change the authenticated user's password.
 * @access  Private (requires valid JWT via `protect` middleware)
 *
 * Validates that both fields are present, enforces a minimum length on the
 * new password, verifies the current password, then saves the new one.
 * The pre-save hook in User.model.js handles hashing automatically.
 *
 * @param {import('express').Request}  req - Body: { currentPassword, newPassword }
 * @param {import('express').Response} res
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Both fields are required — reject early with a clear message
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password are required.' });

    // Enforce a minimum password length for basic security
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    // Re-fetch the user with the password field included (it was excluded by protect)
    const user = await User.findById(req.user._id);

    // Verify the user knows their current password before allowing the change
    const match = await user.matchPassword(currentPassword);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect.' });

    // Assign the plain-text password — the pre-save hook will hash it before persisting
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, changePassword };
