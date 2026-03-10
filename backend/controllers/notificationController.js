// controllers/notificationController.js
const Notification = require('../models/Notification');

// GET /api/notifications - Get notifications for current user
const getNotifications = async (req, res) => {
  let filter = {};

  if (req.user.role === 'admin') {
    filter = { $or: [{ isForAdmin: true }, { isBroadcast: true }] };
  } else {
    // Volunteer sees their own + broadcasts
    filter = { $or: [{ recipient: req.user.id }, { isBroadcast: true }] };
  }

  const notifications = await Notification.find(filter)
    .sort('-createdAt')
    .limit(50);

  res.json(notifications);
};

// GET /api/notifications/unread-count
const getUnreadCount = async (req, res) => {
  let filter = { isRead: false };

  if (req.user.role === 'admin') {
    filter = { ...filter, $or: [{ isForAdmin: true }, { isBroadcast: true }] };
  } else {
    filter = { ...filter, $or: [{ recipient: req.user.id }, { isBroadcast: true }] };
  }

  const count = await Notification.countDocuments(filter);
  res.json({ count });
};

// PUT /api/notifications/:id/read - Mark notification as read
const markRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  res.json({ message: 'Marked as read' });
};

// PUT /api/notifications/read-all - Mark all as read
const markAllRead = async (req, res) => {
  let filter = {};
  if (req.user.role === 'admin') {
    filter = { $or: [{ isForAdmin: true }, { isBroadcast: true }] };
  } else {
    filter = { $or: [{ recipient: req.user.id }, { isBroadcast: true }] };
  }
  await Notification.updateMany(filter, { isRead: true });
  res.json({ message: 'All notifications marked as read' });
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
