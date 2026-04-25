const express = require('express');
const router  = express.Router();
const { getCategories, addCategory, deleteCategory } = require('../controllers/category.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/',          getCategories);
router.post('/',         protect, authorize('chef', 'admin'), addCategory);
router.delete('/:name',  protect, authorize('admin'), deleteCategory);

module.exports = router;
