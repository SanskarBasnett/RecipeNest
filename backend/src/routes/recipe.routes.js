const express = require('express');
const router = express.Router();
const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
  toggleLike,
  addComment,
  deleteComment,
} = require('../controllers/recipe.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Protected chef routes — must be before /:id
router.get('/chef/my', protect, authorize('chef'), getMyRecipes);

// Public routes
router.get('/',    getAllRecipes);
router.get('/:id', getRecipeById);

// Chef / admin CRUD
router.post('/',    protect, authorize('chef'), upload.single('image'), createRecipe);
router.put('/:id',  protect, authorize('chef', 'admin'), upload.single('image'), updateRecipe);
router.delete('/:id', protect, authorize('chef', 'admin'), deleteRecipe);

// Likes & comments — any logged-in user
router.post('/:id/like',                    protect, toggleLike);
router.post('/:id/comments',                protect, addComment);
router.delete('/:id/comments/:commentId',   protect, deleteComment);

module.exports = router;
