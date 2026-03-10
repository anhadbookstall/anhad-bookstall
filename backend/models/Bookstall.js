// models/Bookstall.js - An active or completed bookstall session
const mongoose = require('mongoose');

// Tracks each volunteer's presence during a bookstall
const attendanceSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  // If volunteer exited and rejoined, track all intervals
  sessions: [
    {
      joinedAt: Date,
      exitedAt: Date,
    },
  ],
  isPresent: {
    type: Boolean,
    default: true,
  },
});

const bookstallSchema = new mongoose.Schema(
  {
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
    },
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Volunteer',
      required: true,
    },
    attendance: [attendanceSchema],
    // GPS coordinates captured when bookstall starts
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    specialOccasion: {
      type: String, // Free text for event/holiday tagging
      trim: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['ongoing', 'closed'],
      default: 'ongoing',
    },
    // Reflections written by volunteers
    reflections: [
      {
        volunteer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Volunteer',
        },
        text: String,
        writtenAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bookstall', bookstallSchema);
