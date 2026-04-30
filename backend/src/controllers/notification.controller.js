/**
 * @file notification.controller.js
 * @description Controller for in-app notification routes.
 *
 * Notifications are created automatically by the recipe controller whenever
 * a user likes or comments on a chef's recipe. This controller provides the
 * read and management endpoints that the chef uses to view and clear them.
 *
 * All routes require authentication (enforced at the router level via
 * `router.use(protect)`).
 */

const Notification = require('../models/Notification.model');

/**
 * @route   GET /api/notifications
 * @desc    Retrieve the most recent 50 notifications for the authenticated chef.
 * @access  Private (any logged-in user, but only chefs receive notifications)
 *
 * Results are sorted newest-first and capped at 50 to keep the response
 * payload manageable.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Return the number of unread notifications for the authenticated user.
 * @access  Private
 *
 * Used to drive the notification bell badge in the navigation bar.
 * Returns `{ count: number }` rather than the full documents to keep the
 * polling payload as small as possible.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const getUnreadCount = async (req, res) => {
  try {
    // countDocuments is efficient — it uses the index without loading documents
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all of the authenticated user's unread notifications as read.
 * @access  Private
 *
 * Called when the user opens the notification panel so the badge count
 * resets to zero. Uses `updateMany` for efficiency instead of loading and
 * saving each document individually.
 *
 * @param {import('express').Request}  req - `req.user` populated by `protect`.
 * @param {import('express').Response} res
 */
const markAllRead = async (req, res) => {
  try {
    // Bulk-update only the unread notifications belonging to this user
    await Notification.updateMany(
      { recipient: req.user._id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a single notification.
 * @access  Private
 *
 * The `recipient` filter ensures a user can only delete their own
 * notifications — passing someone else's notification ID will silently
 * do nothing rather than returning an error (the end state is the same).
 *
 * @param {import('express').Request}  req - Params: { id }
 * @param {import('express').Response} res
 */
const deleteNotification = async (req, res) => {
  try {
    // Scope the delete to the current user's notifications for safety
    await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
    });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotifications, getUnreadCount, markAllRead, deleteNotification };
