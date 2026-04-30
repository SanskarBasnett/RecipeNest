/**
 * @file notification.routes.js
 * @description Express router for in-app notification endpoints.
 *
 * Base path: /api/notifications  (mounted in index.js)
 *
 * All routes require authentication — `router.use(protect)` is applied once
 * at the top so it covers every route defined below without repetition.
 *
 * Routes:
 *  GET    /api/notifications              — list the current user's notifications
 *  GET    /api/notifications/unread-count — count of unread notifications (for badge)
 *  PUT    /api/notifications/read-all     — mark all notifications as read
 *  DELETE /api/notifications/:id          — delete a single notification
 *
 * IMPORTANT: The static paths (/unread-count, /read-all) must be defined
 * BEFORE the dynamic /:id route to prevent Express from treating those
 * segments as an ObjectId parameter.
 */

const express = require('express');
const router  = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAllRead,
  deleteNotification,
} = require('../controllers/notification.controller');

const { protect } = require('../middleware/auth.middleware');

// ---------------------------------------------------------------------------
// Global middleware — all notification routes require a valid JWT
// ---------------------------------------------------------------------------
router.use(protect);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/notifications
 * Returns the 50 most recent notifications for the authenticated user,
 * sorted newest-first.
 */
router.get('/', getNotifications);

/**
 * GET /api/notifications/unread-count
 * Returns { count: number } — the number of unread notifications.
 * Used to update the bell badge in the navigation bar.
 */
router.get('/unread-count', getUnreadCount);

/**
 * PUT /api/notifications/read-all
 * Marks all of the authenticated user's unread notifications as read.
 * Called when the user opens the notification panel.
 */
router.put('/read-all', markAllRead);

/**
 * DELETE /api/notifications/:id
 * Deletes a single notification by its ObjectId.
 * Scoped to the current user so they can only delete their own notifications.
 */
router.delete('/:id', deleteNotification);

module.exports = router;
