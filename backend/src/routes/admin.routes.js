/**
 * @file admin.routes.js
 * @description Express router for admin-only management endpoints.
 *
 * Base path: /api/admin  (mounted in index.js)
 *
 * All routes in this file are protected by `protect` + `authorize('admin')`
 * applied via `router.use()` so every handler is automatically restricted
 * to authenticated admin users without repeating the middleware on each route.
 *
 * Routes:
 *  GET    /api/admin/stats           — platform statistics (user/chef/recipe counts)
 *  GET    /api/admin/users           — list all users
 *  GET    /api/admin/users/:id       — get a single user with their liked recipes
 *  GET    /api/admin/recipes         — list all recipes with chef info
 *  DELETE /api/admin/users/:id       — delete a user and their recipes
 *  DELETE /api/admin/recipes/:id     — delete any recipe
 *  PUT    /api/admin/users/:id/role  — change a user's role
 */

const express = require('express');
const router  = express.Router();

const {
  getAllUsers,
  getAllRecipes,
  deleteUser,
  deleteRecipe,
  changeUserRole,
  getStats,
  getUserById,
} = require('../controllers/admin.controller');

const { protect, authorize } = require('../middleware/auth.middleware');

// ---------------------------------------------------------------------------
// Global middleware for this router
// Every route below requires a valid JWT AND the 'admin' role.
// ---------------------------------------------------------------------------
router.use(protect, authorize('admin'));

// ---------------------------------------------------------------------------
// Dashboard overview
// ---------------------------------------------------------------------------

/** Return aggregate counts: total users, chefs, and recipes. */
router.get('/stats', getStats);

// ---------------------------------------------------------------------------
// User management
// ---------------------------------------------------------------------------

/** List all registered users (any role) without their passwords. */
router.get('/users', getAllUsers);

/** Get a single user's profile plus the recipes they have liked. */
router.get('/users/:id', getUserById);

/** Delete a user account and cascade-delete all their recipes. */
router.delete('/users/:id', deleteUser);

/** Change a user's role to 'user', 'chef', or 'admin'. */
router.put('/users/:id/role', changeUserRole);

// ---------------------------------------------------------------------------
// Recipe management
// ---------------------------------------------------------------------------

/** List all recipes with their author's name and email. */
router.get('/recipes', getAllRecipes);

/** Delete any recipe regardless of who created it. */
router.delete('/recipes/:id', deleteRecipe);

module.exports = router;
