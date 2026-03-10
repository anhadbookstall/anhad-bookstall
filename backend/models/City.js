// models/City.js - Approved cities for bookstall operations
const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    pinCode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'PIN code must be 6 digits'],
    },
    dateOfInclusion: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('City', citySchema);
