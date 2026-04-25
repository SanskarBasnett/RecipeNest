const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const logActivity = require('../utils/logActivity');

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already in use' });

    // Only allow user or chef roles on register (admin created manually)
    const allowedRoles = ['user', 'chef'];
    const assignedRole = allowedRoles.includes(role) ? role : 'user';

    const user = await User.create({ name, email, password, role: assignedRole });

    await logActivity('USER_REGISTER',
      { id: user._id, name: user.name, role: user.role },
      { type: 'user', id: user._id, label: user.name }
    );

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      specialty: user.specialty,
      location: user.location,
      socialLinks: user.socialLinks,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      specialty: user.specialty,
      location: user.location,
      socialLinks: user.socialLinks,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password are required.' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user._id);

    const match = await user.matchPassword(currentPassword);
    if (!match)
      return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = newPassword; // pre-save hook will hash it
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { register, login, getMe, changePassword };
