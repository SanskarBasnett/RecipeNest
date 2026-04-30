/**
 * @file auth.routes.js
 * @description Express router for authentication endpoints.
 *
 * Base path: /api/auth  (mounted in index.js)
 *
 * Routes:
 *  POST   /api/auth/register        — create a new account
 *  POST   /api/auth/login           — authenticate and receive a JWT
 *  GET    /api/auth/me              — get the current user's profile (protected)
 *  PUT    /api/auth/change-password — update the current user's password (protected)
 */

const express = require('express');
const router  = express.Router();

const { register, login, getMe, changePassword } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// ---------------------------------------------------------------------------
// Public routes — no authentication required
// ---------------------------------------------------------------------------

/** Register a new user account (user or chef role). */
router.post('/register', register);

/** Log in with email + password and receive a signed JWT. */
router.post('/login', login);

// ---------------------------------------------------------------------------
// Protected routes — valid JWT required
// ---------------------------------------------------------------------------

/** Return the authenticated user's full profile object. */
router.get('/me', protect, getMe);

/** Change the authenticated user's password after verifying the current one. */
router.put('/change-password', protect, changePassword);

module.exports = router;
