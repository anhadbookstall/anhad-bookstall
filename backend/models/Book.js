// models/Book.js - Book catalog schema
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
    },
    language: {
      type: String,
      enum: ['Hindi', 'English', 'Bangla', 'Odiya'],
      required: true,
    },
    unitCost: {
      type: Number,
      required: [true, 'Unit cost is required'],
      min: 0,
    },
    // Subjects as array, e.g. ["Philosophy", "Self-Help"]
    subjects: {
      type: [String],
      default: [],
    },
    publication: {
      type: String,
      enum: ['PAF', 'Penguin', 'HarperCollins', 'Jaico', 'Rajpal & Sons', 'Prabhat Prakashan', 'Other'],
      required: true,
    },
    // Current stock in inventory
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

// Virtual to check if stock is low (less than 3)
bookSchema.virtual('isLowStock').get(function () {
  return this.currentStock < 3;
});

module.exports = mongoose.model('Book', bookSchema);
