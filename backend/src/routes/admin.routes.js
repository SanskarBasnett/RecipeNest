const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, changeUserRole, getStats } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// All admin routes are protected
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', changeUserRole);
router.get('/stats', getStats);

module.exports = router;
