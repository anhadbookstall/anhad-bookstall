// models/Inventory.js - Records each inventory update (books received)
const mongoose = require('mongoose');

// Each entry in an inventory update
const inventoryItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitCostAtTime: {
    type: Number, // Store cost at time of purchase for accounting
  },
});

const inventoryUpdateSchema = new mongoose.Schema(
  {
    items: [inventoryItemSchema],
    dateReceived: {
      type: Date,
      default: Date.now,
    },
    // Optional: PDF invoice uploaded by admin
    invoiceFile: {
      url: String,
      publicId: String,
    },
    notes: String,
    addedBy: {
      type: String,
      default: 'Admin',
    },
  },
  { timestamps: true }
);

// After saving, automatically update Book.currentStock
inventoryUpdateSchema.post('save', async function () {
  const Book = require('./Book');
  for (const item of this.items) {
    await Book.findByIdAndUpdate(item.book, {
      $inc: { currentStock: item.quantity },
    });
  }
});

module.exports = mongoose.model('InventoryUpdate', inventoryUpdateSchema);
