// routes/notifications.js
const express = require('express');
const router = express.Router();
const { getNotifications, getUnreadCount, markRead, markAllRead } = require('../controllers/notificationController');
const { protect, authenticated } = require('../middleware/auth');

router.get('/', protect, authenticated, getNotifications);
router.get('/unread-count', protect, authenticated, getUnreadCount);
router.put('/read-all', protect, authenticated, markAllRead);
router.put('/:id/read', protect, authenticated, markRead);

module.exports = router;
