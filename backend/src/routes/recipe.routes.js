const express = require('express');
const router = express.Router();
const {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getMyRecipes,
} = require('../controllers/recipe.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Protected routes — must be defined BEFORE /:id to avoid param collision
router.get('/chef/my', protect, authorize('chef'), getMyRecipes);

// Public routes
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);
router.post('/', protect, authorize('chef'), upload.single('image'), createRecipe);
router.put('/:id', protect, authorize('chef', 'admin'), upload.single('image'), updateRecipe);
router.delete('/:id', protect, authorize('chef', 'admin'), deleteRecipe);

module.exports = router;
