const express = require('express');
const router = express.Router();
const { getAllChefs, getChefById, updateProfile, updateAvatar } = require('../controllers/chef.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Protected routes — must be before /:id to avoid param collision
router.put('/profile', protect, authorize('chef', 'admin'), updateProfile);
router.put('/avatar', protect, authorize('chef', 'admin'), upload.single('avatar'), updateAvatar);

// Public routes
router.get('/', getAllChefs);
router.get('/:id', getChefById);

module.exports = router;
