// models/Sale.js - Individual book sale transaction
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema(
  {
    bookstall: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bookstall',
      required: true,
    },
    soldBy: {
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
      required: true,
      min: 1,
      default: 1,
    },
    soldPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Purchaser demographics
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Third Gender'],
      required: true,
    },
    ageCategory: {
      type: String,
      enum: [
        '0-5', '6-10', '11-15', '16-20', '21-25', '26-30',
        '31-35', '36-40', '41-45', '46-50', '51-55', '56-60',
        '61-65', '66-70', '71 & above',
      ],
      required: true,
    },
    knowsAcharyaPrashant: {
      type: Boolean,
      required: true,
    },
    joinedGitaCommunity: {
      type: Boolean, // Only relevant if knowsAcharyaPrashant is true
    },
    // Optional purchaser photo
    purchaserPhoto: {
      url: String,
      publicId: String, // Cloudinary ID - for 6-month deletion
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      // Purchaser consent to being photographed
      consent: {
        type: Boolean,
        default: false,
      },
    },
    saleDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// After saving a sale, decrease inventory for that book
saleSchema.post('save', async function () {
  const Book = require('./Book');
  await Book.findByIdAndUpdate(this.book, {
    $inc: { currentStock: -this.quantity },
  });
});

module.exports = mongoose.model('Sale', saleSchema);
