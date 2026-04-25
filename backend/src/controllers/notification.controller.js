const Notification = require('../models/Notification.model');

// @route GET /api/notifications
// Get all notifications for the logged-in chef
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

// @route GET /api/notifications/unread-count
// Get unread count for bell badge
const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/notifications/read-all
// Mark all as read
const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route DELETE /api/notifications/:id
// Delete a single notification
const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNotifications, getUnreadCount, markAllRead, deleteNotification };
