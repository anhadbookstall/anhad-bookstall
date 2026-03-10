// models/Volunteer.js - Volunteer profile schema
const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Volunteer name is required'],
      trim: true,
    },
    dateOfInclusion: {
      type: Date,
      default: Date.now,
    },
    geetaProfileLink: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    // If true, WhatsApp = contact number; if false, separate whatsappNumber is used
    sameAsWhatsApp: {
      type: Boolean,
      default: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    currentCity: {
      type: String,
      trim: true,
    },
    // Cities where volunteer is willing to serve (references Approved City IDs)
    willingCities: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'City',
      },
    ],
    profession: {
      type: String,
      trim: true,
    },
    // Books by Acharya Prashant the volunteer has read
    booksReadByAP: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
      },
    ],
    // Books recommended by AP (comma-separated, free text)
    booksReadRecommendedByAP: {
      type: String,
      default: '',
    },
    // Gmail ID used for Google OAuth login
    gmailId: {
      type: String,
      required: [true, 'Gmail ID is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Google OAuth sub (unique user ID from Google)
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows null before first login
    },
    profilePhoto: {
      url: String,
      publicId: String, // Cloudinary public_id for deletion
    },
    // Volunteer status
    status: {
      type: String,
      enum: ['active', 'suspended', 'removed'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
