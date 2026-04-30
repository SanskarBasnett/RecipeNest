/**
 * @file recipe.routes.js
 * @description Express router for recipe endpoints.
 *
 * Base path: /api/recipes  (mounted in index.js)
 *
 * Public routes:
 *  GET    /api/recipes           — list all recipes (filterable/sortable)
 *  GET    /api/recipes/:id       — get a single recipe
 *
 * Protected routes (any logged-in user):
 *  GET    /api/recipes/liked                        — recipes liked by the current user
 *  POST   /api/recipes/:id/like                     — toggle like on a recipe
 *  POST   /api/recipes/:id/comments                 — add a comment
 *  DELETE /api/recipes/:id/comments/:commentId      — delete a comment (owner or admin)
 *
 * Protected routes (chef only):
 *  GET    /api/recipes/chef/my   — the authenticated chef's own recipes
 *  POST   /api/recipes           — create a new recipe
 *
 * Protected routes (chef or admin):
 *  PUT    /api/recipes/:id       — update a recipe
 *  DELETE /api/recipes/:id       — delete a recipe
 *
 * IMPORTANT: Static path segments (/chef/my, /liked) must be registered
 * BEFORE the dynamic /:id route to prevent Express from treating "my" or
 * "liked" as an ObjectId parameter.
 */

const express = require('express');
const router  = express.Router();

const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  getLikedRecipes,
  toggleLike,
  addComment,
  deleteComment,
} = require('../controllers/recipe.controller');

const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// ---------------------------------------------------------------------------
// Protected static routes — MUST come before /:id
// ---------------------------------------------------------------------------

/**
 * GET /api/recipes/chef/my
 * Returns all recipes created by the authenticated chef.
 * Restricted to the 'chef' role.
 */
router.get('/chef/my', protect, authorize('chef'), getMyRecipes);

/**
 * GET /api/recipes/liked
 * Returns all recipes that the authenticated user has liked.
 * Available to any logged-in user.
 */
router.get('/liked', protect, getLikedRecipes);

// ---------------------------------------------------------------------------
// Public routes
// ---------------------------------------------------------------------------

/** GET /api/recipes — list all recipes with optional sort/filter query params. */
router.get('/', getAllRecipes);

/** GET /api/recipes/:id — retrieve a single recipe by its ObjectId. */
router.get('/:id', getRecipeById);

// ---------------------------------------------------------------------------
// Chef / admin CRUD routes
// ---------------------------------------------------------------------------

/**
 * POST /api/recipes
 * Create a new recipe. Restricted to chefs.
 * `upload.single('image')` processes the optional hero image upload.
 */
router.post('/', protect, authorize('chef'), upload.single('image'), createRecipe);

/**
 * PUT /api/recipes/:id
 * Update an existing recipe. Accessible to the owning chef or any admin.
 * `upload.single('image')` handles an optional image replacement.
 */
router.put('/:id', protect, authorize('chef', 'admin'), upload.single('image'), updateRecipe);

/**
 * DELETE /api/recipes/:id
 * Delete a recipe. Accessible to the owning chef or any admin.
 */
router.delete('/:id', protect, authorize('chef', 'admin'), deleteRecipe);

// ---------------------------------------------------------------------------
// Likes & comments — any authenticated user
// ---------------------------------------------------------------------------

/** POST /api/recipes/:id/like — toggle a like on the specified recipe. */
router.post('/:id/like', protect, toggleLike);

/** POST /api/recipes/:id/comments — add a comment to the specified recipe. */
router.post('/:id/comments', protect, addComment);

/**
 * DELETE /api/recipes/:id/comments/:commentId
 * Delete a specific comment. Only the comment's author or an admin may do this.
 */
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
