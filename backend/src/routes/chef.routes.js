/**
 * @file chef.routes.js
 * @description Express router for chef profile endpoints.
 *
 * Base path: /api/chefs  (mounted in index.js)
 *
 * Public routes:
 *  GET    /api/chefs     — list all chefs
 *  GET    /api/chefs/:id — get a single chef's profile + recipes
 *
 * Protected routes (chef only):
 *  PUT    /api/chefs/profile — update own profile fields
 *  PUT    /api/chefs/avatar  — upload a new avatar image
 *
 * IMPORTANT: Protected routes are defined BEFORE the /:id route to prevent
 * Express from treating "profile" or "avatar" as an ID parameter.
 */

const express = require('express');
const router  = express.Router();

const { getAllChefs, getChefById, updateProfile, updateAvatar } = require('../controllers/chef.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// ---------------------------------------------------------------------------
// Protected routes — must be defined BEFORE /:id to avoid param collision
// ---------------------------------------------------------------------------

/**
 * Update the authenticated chef's profile fields (name, bio, specialty, etc.).
 * Requires a valid JWT.
 */
router.put('/profile', protect, updateProfile);

/**
 * Upload a new avatar image for the authenticated chef.
 * `upload.single('avatar')` processes the multipart form data and attaches
 * the file to `req.file` before the controller runs.
 */
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

/** Retrieve all users with the 'chef' role. */
router.get('/', getAllChefs);

/**
 * Retrieve a single chef's profile along with all their recipes.
 * The :id parameter is a MongoDB ObjectId string.
 */
router.get('/:id', getChefById);

module.exports = router;
