// models/LeadInventory.js
// Tracks personal book stock for each Bookstall Lead
const mongoose = require('mongoose');

const leadInventorySchema = new mongoose.Schema({
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Volunteer',
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  quantity: {
    type: Number,
    default: 0,
    min: 0,
  },
}, { timestamps: true });

// Unique constraint - one record per lead per book
leadInventorySchema.index({ lead: 1, book: 1 }, { unique: true });

module.exports = mongoose.model('LeadInventory', leadInventorySchema);