// models/Expenditure.js - Tracks all non-book expenses
const mongoose = require('mongoose');

const expenditureSchema = new mongoose.Schema(
  {
    detail: {
      type: String,
      required: [true, 'Expenditure detail is required'],
      trim: true,
    },
    // Recurring: fuel, food, free book gifting
    // One-time: table, book stand, table cloth, stationery
    type: {
      type: String,
      enum: ['recurring', 'one-time'],
      required: true,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: 0,
    },
    dateOfExpenditure: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: String,
      default: 'Admin',
    },
    // Optional: link to a bookstall session (for session-specific expenses like fuel)
    bookstall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookstall',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expenditure', expenditureSchema);
