const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAllRecipes,
  deleteUser,
  deleteRecipe,
  changeUserRole,
  getStats,
  getActivity,
  getUserById,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All admin routes are protected
router.use(protect, authorize('admin'));

router.get('/stats',            getStats);
router.get('/activity',         getActivity);
router.get('/users',            getAllUsers);
router.get('/users/:id',        getUserById);
router.get('/recipes',          getAllRecipes);
router.delete('/users/:id',     deleteUser);
router.delete('/recipes/:id',   deleteRecipe);
router.put('/users/:id/role',   changeUserRole);

module.exports = router;
