/**
 * @file category.routes.js
 * @description Express router for recipe category endpoints.
 *
 * Base path: /api/categories  (mounted in index.js)
 *
 * Routes:
 *  GET    /api/categories        — list all category names (public)
 *  POST   /api/categories        — add a new category (chef or admin only)
 *  DELETE /api/categories/:name  — delete a category by name (admin only)
 */

const express = require('express');
const router  = express.Router();

const { getCategories, addCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// ---------------------------------------------------------------------------
// Public route
// ---------------------------------------------------------------------------

/**
 * GET /api/categories
 * Returns a sorted array of category name strings.
 * No authentication required — used to populate filter dropdowns for all visitors.
 */
router.get('/', getCategories);

// ---------------------------------------------------------------------------
// Protected routes
// ---------------------------------------------------------------------------

/**
 * POST /api/categories
 * Add a new category to the list.
 * Restricted to chefs and admins — regular users cannot create categories.
 */
router.post('/', protect, authorize('chef', 'admin'), addCategory);

/**
 * DELETE /api/categories/:name
 * Delete a category by its name string (not its ObjectId).
 * Restricted to admins only.
 */
router.delete('/:name', protect, authorize('admin'), deleteCategory);

module.exports = router;
