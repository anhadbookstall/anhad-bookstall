// models/Notification.js - In-app notifications
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // 'all' means all active volunteers, or a specific volunteer ID
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
    },
    isForAdmin: {
      type: Boolean,
      default: false,
    },
    isBroadcast: {
      type: Boolean,
      default: false, // If true, shown to all volunteers
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['bookstall_reminder', 'low_stock', 'general'],
      default: 'general',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
