// models/Schedule.js - Upcoming bookstall schedule
const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    location: {
      type: String,
      required: true, // Exact location name (e.g., "Near Gate 3, Science City")
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String, // e.g., "10:00 AM"
      required: true,
    },
    // Volunteer assigned as lead for this bookstall
    assignedLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
    },
    // Will be set when bookstall is started by lead
    bookstallRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookstall',
    },
    // Track if 12-hour advance notification was sent
    notificationSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
