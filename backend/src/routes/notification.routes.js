const express = require('express');
const router  = express.Router();
const { getNotifications, getUnreadCount, markAllRead, deleteNotification } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.use(protect); // all notification routes require login

router.get('/',              getNotifications);
router.get('/unread-count',  getUnreadCount);
router.put('/read-all',      markAllRead);
router.delete('/:id',        deleteNotification);

module.exports = router;
